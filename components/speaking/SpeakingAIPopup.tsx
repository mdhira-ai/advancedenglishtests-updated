'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Search, Mic, Clock, Play, StopCircle, Pause, Volume2, RotateCcw, FileText, Share2, Check } from 'lucide-react'
import { AssemblyAI } from 'assemblyai'
import topics from '@/data/speakingCard'
import { useSession } from "@/lib/auth-client"

type SessionPhase = 'selection' | 'question-card' | 'preparation' | 'recording' | 'transcribing' | 'evaluation'

interface SpeakingAIPopupProps {
  isOpen: boolean
  onClose: () => void
  onTopicSelect?: (topic: typeof topics[0]) => void
}

export default function SpeakingAIPopup({ isOpen, onClose, onTopicSelect }: SpeakingAIPopupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<typeof topics[0] | null>(null)
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>('selection')
  const [preparationTime, setPreparationTime] = useState(30)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [totalRecordedTime, setTotalRecordedTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [transcriptionText, setTranscriptionText] = useState('')
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [practicePhase, setPracticePhase] = useState<SessionPhase>('selection')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [assemblyAIClient, setAssemblyAIClient] = useState<AssemblyAI | null>(null)
  
  // URL sharing states
  const [shareableUrl, setShareableUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  
  const { data: session } = useSession()
  
  const preparationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const recordingStartTime = useRef<number>(0)

  // Maximum recording time in seconds (2.30 minutes)
  const MAX_RECORDING_TIME = 150

  // Parse WAV header to get duration
  const getWavDuration = async (blob: Blob): Promise<number> => {
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const dataView = new DataView(arrayBuffer)
      
      // Check if it's a valid WAV file
      const riffHeader = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1),
        dataView.getUint8(2),
        dataView.getUint8(3)
      )
      
      if (riffHeader !== 'RIFF') {
        throw new Error('Not a valid WAV file')
      }
      
      // Get sample rate (bytes 24-27)
      const sampleRate = dataView.getUint32(24, true)
      // Get channels (bytes 22-23)
      const channels = dataView.getUint16(22, true)
      // Get bits per sample (bytes 34-35)
      const bitsPerSample = dataView.getUint16(34, true)
      
      // Find data chunk
      let offset = 12
      while (offset < dataView.byteLength - 8) {
        const chunkId = String.fromCharCode(
          dataView.getUint8(offset),
          dataView.getUint8(offset + 1),
          dataView.getUint8(offset + 2),
          dataView.getUint8(offset + 3)
        )
        const chunkSize = dataView.getUint32(offset + 4, true)
        
        if (chunkId === 'data') {
          const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8)
          return chunkSize / bytesPerSecond
        }
        
        offset += 8 + chunkSize
      }
      
      throw new Error('Data chunk not found')
    } catch (error) {
      console.warn('WAV parsing failed:', error)
      return 0
    }
  }

  // Function to format evaluation result with clean, professional styling
  const formatEvaluationResult = (result: any) => {
    if (!result) return null;

    // Handle different result formats
    let parsedResult = result;
    
    // If result has a text property containing JSON, parse it
    if (result.text && typeof result.text === 'string') {
      try {
        // Extract JSON from the text if it's wrapped in ```json blocks
        const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try to parse the text directly as JSON
          parsedResult = JSON.parse(result.text);
        }
      } catch (error) {
        console.error('Failed to parse evaluation result:', error);
        // Fallback to original result
        parsedResult = result;
      }
    }

    // Extract data with multiple fallback options
    const overallBand = parsedResult["Overall Band"] || parsedResult.overall_band || parsedResult["Band Score"] || "N/A";
    const responseType = parsedResult["Response Type"] || "Speaking Assessment";
    const relevance = parsedResult["Relevance Assessment"] || parsedResult.relevance || "";
    const duration = parsedResult["Duration Assessment (Part 2 only)"] || parsedResult["Duration Assessment"] || "";
    const fluency = parsedResult.fluency_justification || parsedResult.fluency || "";
    const lexical = parsedResult.lexical_justification || parsedResult.lexical || "";
    const grammar = parsedResult.grammar_justification || parsedResult.grammar || "";
    const grammarImprovement = parsedResult.grammar_improvement || "";
    const pronunciation = parsedResult.pronunciation_justification || parsedResult.pronunciation || "";
    
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.5',
        color: '#374151',
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            color: '#111827'
          }}>IELTS Speaking Assessment</h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0'
          }}>Most Advanced IELTS Trained AI-Powered Evaluation Report</p>
        </div>

        {/* Overall Band Score */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '500',
            margin: '0 0 12px 0',
            color: '#64748b'
          }}>Overall IELTS Band Score</h3>
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#1e40af',
            margin: '0 0 8px 0'
          }}>{overallBand}</div>
         
        </div>

        {/* Assessment Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Response Type */}
          {responseType && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 8px 0'
              }}>Response Type</h4>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: '0'
              }}>{responseType}</p>
            </div>
          )}

          {/* Duration Assessment */}
          {duration && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 8px 0'
              }}>Duration Assessment</h4>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: '0'
              }}>{duration}</p>
            </div>
          )}
        </div>

        {/* Detailed Assessments */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Relevance Assessment */}
          {relevance && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#10b981',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px',
                  fontSize: '12px',
                  color: 'white'
                }}>✓</span>
                Relevance Assessment
              </h4>
              <p style={{
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: '0'
              }}>{relevance}</p>
            </div>
          )}

          {/* Skills Assessment */}
          {fluency && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 12px 0'
              }}>Fluency & Coherence</h4>
              <p style={{
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: '0'
              }}>{fluency}</p>
            </div>
          )}

          {lexical && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 12px 0'
              }}>Lexical Resource</h4>
              <p style={{
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: '0'
              }}>{lexical}</p>
            </div>
          )}

          {/* Grammar Analysis */}
          {(grammar || grammarImprovement) && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 12px 0'
              }}>Grammar & Accuracy</h4>
              
              {grammar && (
                <div style={{
                  marginBottom: grammarImprovement ? '16px' : '0'
                }}>
                  <p style={{
                    color: '#374151',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: '0'
                  }}>{grammar}</p>
                </div>
              )}

              {grammarImprovement && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  padding: '12px'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#166534',
                    margin: '0 0 8px 0'
                  }}>Improvement Suggestion:</h5>
                  <p style={{
                    color: '#166534',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: '0'
                  }}>{grammarImprovement}</p>
                </div>
              )}
            </div>
          )}

          {pronunciation && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 12px 0'
              }}>Pronunciation</h4>
              <p style={{
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: '0'
              }}>{pronunciation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '16px',
          marginTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          
        </div>
      </div>
    );
  };

  // API evaluation function
  const evaluateVoice = async (question: string, answer: string, recordingTime: number) => {
  
 const prompt = `
- Question: ${selectedTopic?.title || 'Speaking Practice'} - ${question}
- Response: ${answer}
- Estimated Duration: ${formatTime(recordingTime)}`;
    
  
    const response = await fetch(
        "https://9x2p4mt3.rpcl.dev/api/v1/prediction/0f204511-0691-45ff-925b-edd546267795",
    
 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: prompt })
      }
    );
    const result = await response.json();
    return result;
  };

  // Function to save evaluation data to database
  const saveEvaluationData = async (
    topic: string,
    questions: string[],
    userAnswer: string,
    evaluationResponse: any,
    recordingDuration: number
  ) => {
    try {
      const response = await fetch('/api/speaking/evaluation-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          questions,
          userAnswer,
          evaluationResponse,
          recordingDuration,
          user_id: session?.user?.id || null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Evaluation data saved successfully:', result);
      
      // Store shareable URL if save was successful
      if (result && result.shareableUrl) {
        setShareableUrl(result.shareableUrl);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to save evaluation data:', error);
      // Don't show alert to user as this is background data collection
      // The main functionality should continue working even if data saving fails
    }
  };

  // Function to copy URL to clipboard
  const copyUrlToClipboard = async () => {
    if (!shareableUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL to clipboard');
    }
  };

  // Evaluate the transcribed response
  const evaluateResponse = async (transcriptionText: string, actualRecordingTime: number) => {
    if (!selectedTopic) return;
    
    // Don't evaluate if transcription is not available or empty
    if (!transcriptionText || transcriptionText.trim() === '' || transcriptionText === 'No transcription available') {
      return;
    }
    
    try {
      setIsEvaluating(true);
      
      // Combine all questions into a single prompt for context
      const allQuestions = selectedTopic.questions.join(' ');
      const topicContext = `Topic: ${selectedTopic.title}\nQuestions: ${allQuestions}`;
      
      const result = await evaluateVoice(topicContext, transcriptionText, actualRecordingTime);
      setEvaluationResult(result);
      setPracticePhase('evaluation');
      setCurrentPhase('evaluation');

      // Save evaluation data to database (in background, don't block UI)
      const saveResult = await saveEvaluationData(
        selectedTopic.title,
        selectedTopic.questions,
        transcriptionText,
        result,
        actualRecordingTime
      );
      
      // Show success message if URL was generated
      if (saveResult && saveResult.shareableUrl) {
        console.log('✅ Evaluation saved successfully! Shareable link generated.');
      }

    } catch (error) {
      console.error('Evaluation failed:', error);
      alert('Failed to evaluate your response. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Initialize AssemblyAI client
  const initializeAssemblyAI = () => {
    try {
      const client = new AssemblyAI({
        apiKey: "84fdabff1c094d8d92f6de10ecf3f7a6", // Replace with your actual API key
      });
      setAssemblyAIClient(client);
      console.log("AssemblyAI client initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize AssemblyAI:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to initialize AssemblyAI: ${errorMessage}`);
      return false;
    }
  };

  // Transcribe audio using Web Speech API
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log("Transcribing audio...", audioBlob.size, "bytes");
      setIsTranscribing(true);
      
      // Check if the browser supports Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log("Speech recognition not supported, using placeholder");
        return `Audio recorded successfully (${audioBlob.size} bytes). Speech recognition not available in this browser. The recording was captured but cannot be transcribed to text.`;
      }

      return new Promise((resolve, reject) => {
        // Create audio URL from blob
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Use Web Speech API for transcription
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        let transcriptionResult = '';
        
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcriptionResult += event.results[i][0].transcript + ' ';
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Still return that recording was successful even if transcription failed
          resolve(`Audio recorded successfully (${audioBlob.size} bytes). Transcription failed: ${event.error}. Your speech was captured but could not be converted to text.`);
        };
        
        recognition.onend = () => {
          URL.revokeObjectURL(audioUrl);
          if (transcriptionResult.trim()) {
            resolve(transcriptionResult.trim());
          } else {
            resolve(`Audio recorded successfully (${audioBlob.size} bytes). No speech was detected in the recording. Please ensure you spoke clearly and your microphone is working properly.`);
          }
        };
        
        // Start recognition
        try {
          recognition.start();
          
          // Auto-stop after 10 seconds if no results
          setTimeout(() => {
            try {
              recognition.stop();
            } catch (e) {
              console.log('Recognition already stopped');
            }
          }, 10000);
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          resolve(`Audio recorded successfully (${audioBlob.size} bytes). Failed to start speech recognition. Your recording was captured successfully.`);
        }
      });
      
    } catch (error) {
      console.error("Transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return `Audio recorded successfully. Transcription failed: ${errorMessage}. Your speech was captured but could not be converted to text.`;
    } finally {
      setIsTranscribing(false);
    }
  };

  // Transcribe audio using AssemblyAI
  const transcribeWithAssemblyAI = async (audioBlob: Blob): Promise<string> => {
    if (!assemblyAIClient) {
      throw new Error("AssemblyAI client not initialized");
    }

    try {
      console.log("Transcribing with AssemblyAI...");
      setIsTranscribing(true);
      
      // Convert blob to file for upload
      const audioFile = new File([audioBlob], "recording.wav", { type: audioBlob.type });
      
      // Upload and transcribe
      const transcript = await assemblyAIClient.transcripts.transcribe({
        audio: audioFile,
        speaker_labels: false
      });

      if (transcript.status === 'error') {
        throw new Error(transcript.error || 'Transcription failed');
      }

      return transcript.text || "No transcription available";
    } catch (error) {
      console.error("AssemblyAI transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Transcription failed: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Filter topics based on search query
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.questions.some(question => 
      question.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Audio player functions
  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play()
      setIsPlayingAudio(true)
    }
  }

  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      setIsPlayingAudio(false)
    }
  }

  const resetAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0
      setAudioCurrentTime(0)
      setIsPlayingAudio(false)
    }
  }

  const formatAudioTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Create audio URL when audio blob changes
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      
      // Create audio element for playback
      const audio = new Audio(url)
      audioPlayerRef.current = audio
      
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration)
      })
      
      audio.addEventListener('timeupdate', () => {
        setAudioCurrentTime(audio.currentTime)
      })
      
      audio.addEventListener('ended', () => {
        setIsPlayingAudio(false)
        setAudioCurrentTime(0)
      })
      
      return () => {
        URL.revokeObjectURL(url)
        if (audioPlayerRef.current) {
          audioPlayerRef.current.removeEventListener('loadedmetadata', () => {})
          audioPlayerRef.current.removeEventListener('timeupdate', () => {})
          audioPlayerRef.current.removeEventListener('ended', () => {})
        }
      }
    }
  }, [audioBlob])

  // Reset search when popup closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedTopic(null)
      setCurrentPhase('selection')
      setPreparationTime(30)
      setIsRecording(false)
      setRecordingTime(0)
      setTotalRecordedTime(0)
      setIsTranscribing(false)
      setIsEvaluating(false)
      setTranscriptionText('')
      setEvaluationResult(null)
      setPracticePhase('selection')
      setAudioChunks([])
      setAudioBlob(null)
      setTranscript('')
      setAudioUrl(null)
      setIsPlayingAudio(false)
      setAudioCurrentTime(0)
      setAudioDuration(0)
      setShareableUrl(null)
      setCopiedUrl(false)
      recordingStartTime.current = 0
      if (preparationIntervalRef.current) {
        clearInterval(preparationIntervalRef.current)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current = null
      }
      if (mediaRecorder) {
        mediaRecorder.stop()
        setMediaRecorder(null)
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current = null
      }
    }
  }, [isOpen, mediaRecorder])

  // Initialize AssemblyAI client on component mount
  useEffect(() => {
    initializeAssemblyAI()
  }, [])

  // Preparation countdown effect
  useEffect(() => {
    if (currentPhase === 'preparation' && preparationTime > 0) {
      preparationIntervalRef.current = setInterval(() => {
        setPreparationTime(prev => {
          if (prev <= 1) {
            setCurrentPhase('recording')
            startRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (preparationIntervalRef.current) {
        clearInterval(preparationIntervalRef.current)
      }
    }
  }, [currentPhase, preparationTime])

  // Recording time counter
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop recording when reaching max time
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording()
            return MAX_RECORDING_TIME
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const handleTopicSelect = (topic: typeof topics[0]) => {
    setSelectedTopic(topic)
    setCurrentPhase('question-card')
    if (onTopicSelect) {
      onTopicSelect(topic)
    }
  }

  const handleStartSpeaking = () => {
    setCurrentPhase('preparation')
    setPreparationTime(30)
  }

  const handleStartEarly = () => {
    if (preparationIntervalRef.current) {
      clearInterval(preparationIntervalRef.current)
    }
    setCurrentPhase('recording')
    startRecording()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        setMediaRecorder(null)
        setIsRecording(false)
        setCurrentPhase('transcribing')
        
        // Calculate duration using performance timing
        let finalDuration = Math.round((performance.now() - recordingStartTime.current) / 1000)
        
        // Try to get more precise duration from WAV parsing
        try {
          const wavDuration = await getWavDuration(audioBlob)
          if (wavDuration > 0) {
            const roundedWavDuration = Math.round(wavDuration)
            // Use WAV duration if it's significantly different (more than 1 second off)
            if (Math.abs(roundedWavDuration - finalDuration) > 1) {
              finalDuration = roundedWavDuration
            }
          }
        } catch (error) {
          console.warn('WAV duration parsing failed:', error)
          // Keep the performance-based duration
        }
        
        // Set the total recorded time state
        setTotalRecordedTime(finalDuration)
        
        // Auto-transcribe when recording stops
        try {
          const transcriptionText = await transcribeWithAssemblyAI(audioBlob);
          setTranscript(transcriptionText);
          setTranscriptionText(transcriptionText);
          
          // Auto-evaluate the response if we have a selected topic
          if (selectedTopic && transcriptionText) {
            await evaluateResponse(transcriptionText, finalDuration);
          }
        } catch (error) {
          console.error('Transcription failed:', error);
          setTranscript('Transcription failed. Please try again.');
          setTranscriptionText('Transcription failed. Please try again.');
        }
      }

      mediaRecorderRef.current.start()
      setMediaRecorder(mediaRecorderRef.current)
      setIsRecording(true)
      setRecordingTime(0)
      recordingStartTime.current = performance.now()

      // Start timer using recordingIntervalRef instead of timerRef
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping recording...')
      mediaRecorderRef.current.stop()
    } else {
      console.log('MediaRecorder not recording or not available')
    }
    
    // Clear the timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleBackToSelection = () => {
    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop()
    }
    
    // Clear all intervals
    if (preparationIntervalRef.current) {
      clearInterval(preparationIntervalRef.current)
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    
    // Reset all states
    setCurrentPhase('selection')
    setSelectedTopic(null)
    setPreparationTime(30)
    setRecordingTime(0)
    setTotalRecordedTime(0)
    setIsTranscribing(false)
    setIsEvaluating(false)
    setTranscriptionText('')
    setEvaluationResult(null)
    setPracticePhase('selection')
    setAudioChunks([])
    setIsRecording(false)
    setMediaRecorder(null)
    setAudioBlob(null)
    setTranscript('')
    setAudioUrl(null)
    setIsPlayingAudio(false)
    setAudioCurrentTime(0)
    setAudioDuration(0)
    setShareableUrl(null)
    setCopiedUrl(false)
    recordingStartTime.current = 0
    mediaRecorderRef.current = null
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      audioPlayerRef.current = null
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 xs:p-4 sm:p-4 md:p-5 lg:p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-2 xs:space-x-3">
            <div className="p-1.5 xs:p-2 bg-blue-100 rounded-lg">
              <Mic className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 truncate">Speaking AI Practice</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Choose a topic to practice speaking</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <X className="h-4 w-4 xs:h-5 xs:w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="h-full">
          {/* Show different content based on current phase */}
          {currentPhase === 'selection' && (
            <>
              {/* Topics List - Full Width */}
              <div className="flex flex-col">
                <div className="p-3 xs:p-4 sm:p-4 md:p-5 lg:p-6">
                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-3 xs:mb-4">Speaking Topics</h3>
                  
                  {/* Search Field */}
                  <div className="relative">
                    <Search className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 xs:w-4 xs:h-4" />
                    <Input
                      type="text"
                      placeholder="Search topics or questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 xs:pl-10 pr-3 xs:pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm"
                    />
                  </div>

                  {/* Search Results Counter */}
                  <div className="mt-2 text-xs sm:text-sm text-gray-600">
                    {searchQuery && (
                      <span>
                        {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </div>

                {/* Topics List */}
                <div className="px-3 xs:px-4 sm:px-4 md:px-5 lg:px-6 pb-3 xs:pb-4 sm:pb-4 md:pb-5 lg:pb-6">
                  <div className="space-y-2 xs:space-y-3 max-h-96 overflow-y-auto pr-1 xs:pr-2">
                    {filteredTopics.length > 0 ? (
                      filteredTopics.map((topic, index) => (
                        <Card
                          key={index}
                          className={`p-2 xs:p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200 hover:border-blue-300 ${
                            selectedTopic?.title === topic.title 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'hover:bg-blue-50'
                          }`}
                          onClick={() => handleTopicSelect(topic)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-xs xs:text-sm leading-relaxed mb-1 xs:mb-2 pr-2">
                                {topic.title}
                              </h4>
                              <div className="flex items-center flex-wrap gap-2 xs:gap-4 text-xs text-gray-600">
                                <span className="flex items-center">
                                  <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />
                                  {topic.questions.length} questions
                                </span>
                                {topic.title.includes('PART 1') && (
                                  <span className="bg-green-100 text-green-800 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-xs">
                                    Part 1
                                  </span>
                                )}
                                {topic.title.includes('Follow Up') && (
                                  <span className="bg-orange-100 text-orange-800 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-xs">
                                    Follow Up
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedTopic?.title === topic.title && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 xs:py-12">
                        <Search className="w-8 h-8 xs:w-12 xs:h-12 text-gray-300 mx-auto mb-2 xs:mb-4" />
                        <h4 className="text-base xs:text-lg font-medium text-gray-500 mb-1 xs:mb-2">No topics found</h4>
                        <p className="text-gray-400 text-xs xs:text-sm px-4">
                          {searchQuery 
                            ? `No topics match "${searchQuery}". Try a different search term.`
                            : 'No topics available at the moment.'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Question Card Phase */}
          {currentPhase === 'question-card' && selectedTopic && (
            <div className="flex flex-col">
              {/* Selected Topic Header */}
              <div className="p-4 bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">{selectedTopic.title}</h3>
                    <p className="text-sm text-blue-700">{selectedTopic.questions.length} questions to address</p>
                  </div>
                  <Button
                    onClick={handleBackToSelection}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Change Topic
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Speaking Task</h3>
                    <div className="p-4 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="space-y-3 sm:space-y-4">
                        {selectedTopic.questions.map((question, index) => (
                          <div key={index} className="flex items-start text-left">
                            <span className="flex w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-full items-center justify-center mr-3 sm:mr-4 mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{question}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center">
                    <Button
                      onClick={handleBackToSelection}
                      variant="outline"
                      className="px-4 sm:px-6 py-2 sm:py-3 text-sm"
                    >
                      Back to Topics
                    </Button>
                    <Button
                      onClick={handleStartSpeaking}
                      className="px-6 sm:px-8 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Speaking
                    </Button>
                  </div>

                  <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      <strong>📝 Instructions:</strong> You will have 30 seconds to prepare your response. 
                      Think about how you want to structure your answer and what key points you want to cover.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preparation Phase */}
          {currentPhase === 'preparation' && selectedTopic && (
            <div className="flex flex-col">
              {/* Selected Topic Header */}
              <div className="p-4 bg-yellow-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">{selectedTopic.title}</h3>
                    <p className="text-sm text-yellow-700">Preparation time - Think about your response</p>
                  </div>
                  <Button
                    onClick={handleBackToSelection}
                    variant="outline"
                    size="sm"
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-100"
                  >
                    Change Topic
                  </Button>
                </div>
                {/* Show questions during preparation */}
                <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2">Questions to Address:</h4>
                  <div className="space-y-2">
                    {selectedTopic.questions.map((question, index) => (
                      <div key={index} className="flex items-start">
                        <span className="flex w-4 h-4 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center space-y-6 sm:space-y-8">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Preparation Time</h3>
                    <div className="text-4xl sm:text-6xl font-bold text-blue-600 mb-4">
                      {formatTime(preparationTime)}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">Think about your response</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      onClick={handleStartEarly}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 text-sm"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording Early
                    </Button>

                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">
                        Recording will start automatically when preparation time ends, or you can start early if you're ready.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recording Phase */}
          {currentPhase === 'recording' && selectedTopic && (
            <div className="flex flex-col">
              {/* Selected Topic Header */}
              <div className="p-4 bg-red-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">{selectedTopic.title}</h3>
                    <p className="text-sm text-red-700">Recording in progress - Speak clearly</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-red-900">REC</span>
                  </div>
                </div>
                {/* Show questions during recording */}
                <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                  <div className="space-y-2">
                    {selectedTopic.questions.map((question, index) => (
                      <div key={index} className="flex items-start">
                        <span className="flex w-4 h-4 bg-red-100 text-red-800 text-xs font-medium rounded-full items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center space-y-6 sm:space-y-8">
                  <div className='mt-0'>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900  mb-4">Recording</h3>
                    <div className="text-3xl sm:text-4xl font-bold text-red-600 mb-4">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-2">
                      Max time: {formatTime(MAX_RECORDING_TIME)}
                    </div>
                  
                    <p className="text-sm sm:text-base text-gray-600">Speak clearly and address all points</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      onClick={stopRecording}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 text-sm"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Finish Talking
                    </Button>

                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">
                        <strong>🎤 Recording in progress:</strong> Your response is being recorded. 
                        Recording will automatically stop at {formatTime(MAX_RECORDING_TIME)} or click "Finish Talking" when done.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transcribing Phase */}
          {currentPhase === 'transcribing' && selectedTopic && (
            <div className="flex flex-col">
              {/* Selected Topic Header */}
              <div className="p-4 bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">{selectedTopic.title}</h3>
                    <p className="text-sm text-blue-700">Processing your response...</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-semibold text-blue-900">Processing</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center space-y-6 sm:space-y-8">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Processing Your Response</h3>
                    <div className="flex items-center justify-center space-x-3 mb-6">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">Converting speech to text...</p>
                    {isTranscribing && (
                      <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-blue-800">
                          <strong>📝 Transcribing:</strong> Converting your speech to text for evaluation.
                          This may take a few moments.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Phase */}
          {currentPhase === 'evaluation' && (
            <div className="p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                  {isEvaluating ? (
                    <div className="text-center space-y-4 sm:space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Evaluating Your Response</h3>
                      <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600"></div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600">AI is analyzing your speaking performance...</p>
                      <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-green-800">
                          <strong>🤖 AI Evaluation:</strong> Analyzing your fluency, vocabulary, grammar, and content.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 sm:space-y-8">
                      <div className="text-center mb-8">
                        <Button
                          onClick={handleBackToSelection}
                          variant="outline"
                          className="mb-4"
                        >
                          ← Back to Topics
                        </Button>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Results</h2>
                        <p className="text-lg text-gray-600">Here's how you performed on the speaking task</p>
                        
                        {/* URL Generated Notification */}
                        {shareableUrl && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                            <p className="text-sm text-blue-800">
                              <strong>🔗 Shareable Link Generated!</strong> Your evaluation has been saved and can be shared with others using the "Share Evaluation" button below.
                            </p>
                          </div>
                        )}
                        
                        {/* Evaluation Phase Tip */}
                        <div className="mt-4 p-4 bg-green-50 rounded-lg max-w-2xl mx-auto">
                          <p className="text-sm text-green-800">
                            <strong>📈 Improvement Tip:</strong> Review the feedback carefully and focus on specific areas mentioned. Practice regularly with different topics to build confidence and fluency!
                          </p>
                        </div>
                      </div>

                      {/* Mobile Layout: AET Evaluation first, then response/topic */}
                      <div className="block lg:hidden space-y-6">
                        {/* AET IELTS AI Evaluation - Mobile (First) */}
                        <Card className="p-6 bg-gray-50">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">AET IELTS AI Evaluation</h3>
                          {formatEvaluationResult(evaluationResult)}
                        </Card>

                        {/* Your Response - Mobile (Second) */}
                        <Card className="p-6 bg-green-50">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Your Response
                          </h3>
                          <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                            {transcript || transcriptionText}
                          </div>
                        </Card>

                        {/* Topic - Mobile (Third) */}
                        <Card className="p-6 bg-gray-50">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Topic</h3>
                          <h4 className="text-lg text-blue-600 mb-3">{selectedTopic?.title}</h4>
                          <div className="space-y-2">
                            {selectedTopic?.questions.map((question, index) => (
                              <div key={index} className="flex items-start">
                                <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                  {index + 1}
                                </span>
                                <p className="text-gray-700 text-sm">{question}</p>
                              </div>
                            ))}
                          </div>

                          {/* Vocabulary Section if available */}
                          {selectedTopic?.vocab && selectedTopic.vocab.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Useful Vocabulary:</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedTopic.vocab.map((word, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>

                        {/* Action Buttons - Mobile */}
                        <div className="space-y-4">
                          {/* Share URL Button */}
                          {shareableUrl && (
                            <Button
                              onClick={copyUrlToClipboard}
                              variant="outline"
                              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              {copiedUrl ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Link Copied!
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share Evaluation
                                </>
                              )}
                            </Button>
                          )}

                         

                          <Button
                            onClick={() => {
                              // Start preparation for another practice
                              setCurrentPhase('preparation')
                              setPreparationTime(30)
                              setAudioBlob(null)
                              setTranscript('')
                              setTranscriptionText('')
                              setEvaluationResult(null)
                              setRecordingTime(0)
                              setTotalRecordedTime(0)
                              recordingStartTime.current = 0
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Practice Again (with preparation)
                          </Button>

                          {audioBlob && (
                            <div className="space-y-3">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <audio 
                                  controls 
                                  className="w-full" 
                                  src={audioUrl || undefined}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                              <Button
                                onClick={() => {
                                  if (audioBlob) {
                                    const url = URL.createObjectURL(audioBlob)
                                    const a = document.createElement('a')
                                    a.style.display = 'none'
                                    a.href = url
                                    a.download = `speaking-practice-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`
                                    document.body.appendChild(a)
                                    a.click()
                                    window.URL.revokeObjectURL(url)
                                    document.body.removeChild(a)
                                  }
                                }}
                                variant="outline"
                                className="w-full"
                              >
                                Download Recording
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout: Original side-by-side */}
                      <div className="hidden lg:block">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Topic and Transcript */}
                          <div className="space-y-6">
                            <Card className="p-6 bg-gray-50">
                              <h3 className="text-xl font-bold text-gray-900 mb-4">Topic</h3>
                              <h4 className="text-lg text-blue-600 mb-3">{selectedTopic?.title}</h4>
                              <div className="space-y-2">
                                {selectedTopic?.questions.map((question, index) => (
                                  <div key={index} className="flex items-start">
                                    <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                      {index + 1}
                                    </span>
                                    <p className="text-gray-700 text-sm">{question}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Vocabulary Section if available */}
                              {selectedTopic?.vocab && selectedTopic.vocab.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Useful Vocabulary:</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedTopic.vocab.map((word, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                      >
                                        {word}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Card>

                            <Card className="p-6 bg-green-50">
                              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Your Response
                              </h3>
                              <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                                {transcript || transcriptionText}
                              </div>
                            </Card>
                          </div>

                          {/* Evaluation Results */}
                          <div className="space-y-6">
                            <Card className="p-6 bg-gray-50">
                              <h3 className="text-xl font-bold text-gray-900 mb-4">AET IELTS AI Evaluation</h3>
                              {formatEvaluationResult(evaluationResult)}
                            </Card>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                              {/* Share URL Button */}
                              {shareableUrl && (
                                <Button
                                  onClick={copyUrlToClipboard}
                                  variant="outline"
                                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                  {copiedUrl ? (
                                    <>
                                      <Check className="w-4 h-4 mr-2" />
                                      Link Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Share2 className="w-4 h-4 mr-2" />
                                      Share Evaluation
                                    </>
                                  )}
                                </Button>
                              )}

                              <Button
                                onClick={() => {
                                  // Start preparation for another practice
                                  setCurrentPhase('preparation')
                                  setPreparationTime(30)
                                  setAudioBlob(null)
                                  setTranscript('')
                                  setTranscriptionText('')
                                  setEvaluationResult(null)
                                  setRecordingTime(0)
                                  setTotalRecordedTime(0)
                                  recordingStartTime.current = 0
                                }}
                                variant="outline"
                                className="w-full"
                              >
                                Practice Again (with preparation)
                              </Button>

                              {audioBlob && (
                                <div className="space-y-3">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <audio 
                                      controls 
                                      className="w-full" 
                                      src={audioUrl || undefined}
                                    >
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (audioBlob) {
                                        const url = URL.createObjectURL(audioBlob)
                                        const a = document.createElement('a')
                                        a.style.display = 'none'
                                        a.href = url
                                        a.download = `speaking-practice-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`
                                        document.body.appendChild(a)
                                        a.click()
                                        window.URL.revokeObjectURL(url)
                                        document.body.removeChild(a)
                                      }
                                    }}
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Download Recording
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
