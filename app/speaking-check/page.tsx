'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mic,Users , MicOff, Play, Pause, Download, Upload, FileText, Search, Clock, SkipForward, Copy, Check, Share2 } from 'lucide-react'
import { AssemblyAI } from 'assemblyai'
import { useSession } from '@/lib/auth-client'
import { supabase } from '@/lib/supabase'
import topics from '@/data/speakingCard'


export default function SpeakingAIPage() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession()
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [totalRecordedTime, setTotalRecordedTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [assemblyAIClient, setAssemblyAIClient] = useState<AssemblyAI | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<typeof topics[0] | null>(null)
  
  // New states for the practice flow
  const [practicePhase, setPracticePhase] = useState<'topic-selection' | 'practice-timer' | 'countdown' | 'recording' | 'evaluation'>('topic-selection')
  const [practiceTime, setPracticeTime] = useState(150) // 2 minutes default
  const [countdown, setCountdown] = useState(30) // 30 seconds countdown
  const [isCountdownActive, setIsCountdownActive] = useState(false)
  
  const [activeUsers, setActiveUsers] = useState(1);
  const [isUserCountVisible, setIsUserCountVisible] = useState(true);

  // Evaluation states
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  // URL sharing states
  const [shareableUrl, setShareableUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const recordingStartTime = useRef<number>(0)





  
  // Simulate live user activity
  useEffect(() => {
    // Initial random count between 15-45 users
    const initialCount = Math.floor(Math.random() * 31) + 15;
    setActiveUsers(initialCount);

    const interval = setInterval(() => {
      setActiveUsers(prevCount => {
        // Random change between -3 to +5 users every 5-10 seconds
        const change = Math.floor(Math.random() * 9) - 3;
        const newCount = Math.max(8, Math.min(60, prevCount + change));
        return newCount;
      });
    }, Math.random() * 5000 + 5000); // Random interval between 5-10 seconds

    // Hide/show user count periodically for more dynamic feel
    const visibilityInterval = setInterval(() => {
      setIsUserCountVisible(prev => {
        // Mostly visible (85% of the time)
        return Math.random() > 0.15;
      });
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(visibilityInterval);
    };
  }, []);
  // Initialize AssemblyAI client on component mount
  useEffect(() => {
    initializeAssemblyAI()
  }, [])

  // Countdown effect
  useEffect(() => {
    if (isCountdownActive && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else if (isCountdownActive && countdown === 0) {
      setIsCountdownActive(false)
      setPracticePhase('recording')
      setCountdown(30) // Reset for next time
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [isCountdownActive, countdown])

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

  // API evaluation function
  const evaluateVoice = async (question: string, answer: string, recordingTime: number) => {
    // Determine IELTS part based on topic title
    const topicTitle = selectedTopic?.title || '';
    let ieltspart = 'Part 2'; // Default to Part 2
    
    if (topicTitle.startsWith('Follow Up Questions:')) {
      ieltspart = 'Part 3';
    } else if (topicTitle.startsWith('PART 1') || topicTitle.startsWith('SPEAKING PART 1')) {
      ieltspart = 'Part 1';
    }
      
    const prompt = `
- Part: ${ieltspart}
- Question: ${selectedTopic?.title || 'Speaking Practice'} - ${question}
- Response: ${answer}
- Duration: ${formatTime(recordingTime)}`;
    
    const response = await fetch(
        "https://9x2p4mt3.rpcl.dev/api/v1/prediction/932a6896-ee2c-4dbd-ae22-1e539f58cc2a",
             
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

  // Function to save evaluation data to database using Supabase direct insertion
  const saveEvaluationData = async (
    topic: string,
    questions: string[],
    userAnswer: string,
    evaluationResponse: any,
    recordingDuration: number
  ) => {
    try {
      const userId = session?.user?.id || null
      const isLoggedIn = !!session?.user
      
      console.log('Saving speaking evaluation data...', {
        topic: topic.substring(0, 50) + '...',
        recordingDuration,
        userId: userId ? 'present' : 'null'
      });
      
      // Generate a unique URL identifier
      const urlLink = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Insert data into Supabase
      const { data, error } = await supabase
        .from('speaking_evaluation_data')
        .insert([
          {
            userId,
            topic,
            questions: JSON.stringify(questions),
            userAnswer,
            evaluationResponse: JSON.stringify(evaluationResponse),
            recordingDuration,
            isLoggedIn,
            urlLink
          }
        ])
        .select()
      
      if (error) {
        console.error('Supabase Error:', error)
        throw new Error(`Supabase error: ${error.message}`)
      }
      
      console.log('Speaking evaluation data saved successfully:', data);
      
      // Store shareable URL if save was successful
      const insertedData = data[0]
      if (insertedData && insertedData.urlLink) {
        const fullUrl = `${window.location.origin}/evaluation/speaking/${insertedData.urlLink}`;
        setShareableUrl(fullUrl);
      }
      
      // Return result (matching the API response format)
      return {
        success: true,
        id: insertedData.id.toString(),
        urlLink: insertedData.urlLink,
        shareableUrl: urlLink,
        createdAt: insertedData.createdAt
      };
    } catch (error) {
      console.error('Failed to save evaluation data:', error);
      // Don't show alert to user as this is background data collection
      // The main functionality should continue working even if data saving fails
      return null;
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

  // Transcribe audio using AssemblyAI
  const transcribeWithAssemblyAI = async (audioBlob: Blob) => {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        
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
          
          // Auto-evaluate the response if we have a selected topic
          if (selectedTopic && transcriptionText) {
            await evaluateResponse(transcriptionText, finalDuration);
          }
        } catch (error) {
          console.error('Transcription failed:', error);
          setTranscript('Transcription failed. Please try again.');
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingStartTime.current = performance.now()

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playAudio = () => {
    if (audioRef.current && audioBlob) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
    const duration = parsedResult["Duration Assessment (Part 1)"] || parsedResult["Duration Assessment (Part 2)"] || parsedResult["Duration Assessment (Part 3)"] || parsedResult["Duration Assessment"] || "";
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

  // Filter topics based on search query
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.questions.some(question => 
      question.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleTopicSelect = (topic: typeof topics[0]) => {
    setSelectedTopic(topic)
    setPracticePhase('practice-timer')
    
    // Set practice duration based on IELTS part
    const topicTitle = topic.title || '';
    let duration = 150; // Default to Part 2 (2:30)
    
    if (topicTitle.startsWith('Follow Up Questions:')) {
      duration = 270; // Part 3 (4:30)
    } else if (topicTitle.startsWith('PART 1') || topicTitle.startsWith('PART 1')) {
      duration = 270; // Part 1 (4:30)
    }
    
    setPracticeTime(duration)
    
    // Reset any previous state
    setAudioBlob(null)
    setTranscript('')
    setRecordingTime(0)
    setTotalRecordedTime(0)
  }

  const startPractice = () => {
    setPracticePhase('countdown')
    setIsCountdownActive(true)
    setCountdown(30)
  }

  const skipCountdown = () => {
    setIsCountdownActive(false)
    setPracticePhase('recording')
    setCountdown(30) // Reset for next time
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }
  }

  const backToTopics = () => {
    setPracticePhase('topic-selection')
    setSelectedTopic(null)
    setAudioBlob(null)
    setTranscript('')
    setRecordingTime(0)
    setTotalRecordedTime(0)
    setIsRecording(false)
    setIsCountdownActive(false)
    setCountdown(30)
    setEvaluationResult(null)
    setIsEvaluating(false)
    setShareableUrl(null)
    setCopiedUrl(false)
    recordingStartTime.current = 0
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-20 px-0">
      {/* Visitor Tracking Component */}
      
      <div className="max-w-6xl mx-auto">

          {isUserCountVisible && (
          <div className="fixed bottom-2 md:bottom-4 right-2 md:right-4 z-50">
            <Card className="bg-white/95 m-0 py-3 backdrop-blur-sm shadow-lg border border-gray-200">
              <div className="px-3 md:px-4 py-0 flex items-center space-x-2 md:space-x-3">
                <div className="relative">
                  <Users className="w-4 md:w-5 h-4 md:h-5 text-green-600" />
                  <div className="absolute -top-1 -right-1 w-1.5 md:w-2 h-1.5 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs md:text-sm">
                  <div className="font-semibold text-gray-900">{activeUsers} active</div>
                  <div className="text-gray-600 text-xs">taking tests now</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Speaking AI</h1>
          <p className="text-lg text-gray-600">Practice speaking with Advanced IELTS Trained AI-powered feedback and topic suggestions</p>
        </div>

        {/* Topic Selection Phase */}
        {practicePhase === 'topic-selection' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Speaking Topics Section */}
            <div className="space-y-6">
              <Card className="p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Speaking Topics</h2>
                
                {/* Search Field */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Topics List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTopics.length > 0 ? (
                    filteredTopics.map((topic, index) => (
                      <Card
                        key={index}
                        className="p-4 cursor-pointer gap-0 transition-all duration-200 hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleTopicSelect(topic)}
                      >
                        <h3 className="font-semibold text-gray-900 text-sm mb-2">
                          {topic.title}
                        </h3>
                        {/* Show first few vocabulary words */}
                        {topic.questions && topic.questions.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 italic">
                              {topic.questions.slice(0, 4).join(', ')}
                              {topic.questions.length > 4 ? '...' : ''}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-600">
                          {topic.questions.length} questions
                        </p>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No topics found matching your search.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Instructions Section */}
            <div className="space-y-6">
              <Card className="p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Practice</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full items-center justify-center mr-4 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Select a Topic</h3>
                      <p className="text-gray-600 text-sm">Choose a speaking topic from the list on the left</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full items-center justify-center mr-4 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Set Practice Time</h3>
                      <p className="text-gray-600 text-sm">Choose how long you want to practice speaking</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full items-center justify-center mr-4 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Get Ready</h3>
                      <p className="text-gray-600 text-sm">Use the 30-second countdown to prepare your thoughts</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full items-center justify-center mr-4 flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Start Speaking</h3>
                      <p className="text-gray-600 text-sm">Record your response and get transcription</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>💡 Pro Tip:</strong> Choose a topic that interests you - passion shows in your speaking!
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Practice Timer Phase */}
        {practicePhase === 'practice-timer' && selectedTopic && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 shadow-lg">
              <div className="text-center mb-8">
                <Button
                  onClick={backToTopics}
                  variant="outline"
                  className="mb-4"
                >
                  ← Back to Topics
                </Button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Selected Topic</h2>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-600">{selectedTopic.title}</h3>
                </div>
              </div>

              {/* Topic Questions */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Questions to consider:</h4>
                <div className="space-y-3">
                  {selectedTopic.questions.map((question, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>

                {/* Vocabulary Section */}
                {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Useful Vocabulary:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.vocab.map((word, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Practice Timer Section */}
              <div className="text-center">
                <div className="mb-6">
                  <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Timer</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Set practice duration (seconds):
                    </label>
                  
                  </div>

                  <div className="text-3xl font-bold text-blue-600 mb-6">
                    {formatTime(practiceTime)}
                  </div>
                </div>

                <Button
                  onClick={startPractice}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-full shadow-lg transform transition-transform hover:scale-105"
                  size="lg"
                >
                  Start Practice
                </Button>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>🎯 Practice Tip:</strong> Find a quiet, noiseless place for recording. Use this preparation time to organize your thoughts and plan your main points!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Countdown Phase */}
        {practicePhase === 'countdown' && selectedTopic && (
          <div className="max-w-6xl mx-auto">
            {/* Mobile Layout: Countdown first, topic below */}
            <div className="block lg:hidden space-y-6">
              {/* Countdown Section - Mobile */}
              <Card className="p-6 shadow-lg">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Ready!</h2>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-600">{selectedTopic.title}</h3>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-6xl font-bold text-blue-600 mb-4">
                      {countdown}
                    </div>
                    <div className="text-lg text-gray-600 mb-6">
                      seconds to prepare
                    </div>
                    
                    {/* Circular Progress - Mobile */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 128 128">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${((30 - countdown) / 30) * 351.86} 351.86`}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                    </div>
                  </div>

                  <Button
                    onClick={skipCountdown}
                    variant="outline"
                    className="px-6 py-3 text-lg mb-4"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Start Early
                  </Button>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>🕒 Get Ready:</strong> Use this countdown to think about your answer structure.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Topic Questions - Mobile */}
              <Card className="p-6 bg-gray-50 shadow-lg">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">Questions to prepare for:</h4>
                <div className="space-y-3">
                  {selectedTopic.questions.map((question, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 text-sm">{question}</p>
                    </div>
                  ))}
                </div>

                {/* Vocabulary Section - Mobile */}
                {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-center">Useful Vocabulary:</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedTopic.vocab.map((word, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Desktop Layout: Original single card */}
            <div className="hidden lg:block max-w-2xl mx-auto">
              <Card className="p-8 shadow-lg">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Ready!</h2>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-600">{selectedTopic.title}</h3>
                  </div>

                  {/* Topic Questions */}
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg text-left">
                    <h4 className="font-semibold text-gray-900 mb-4 text-center">Questions to prepare for:</h4>
                    <div className="space-y-3">
                      {selectedTopic.questions.map((question, index) => (
                        <div key={index} className="flex items-start">
                          <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-gray-700 text-sm">{question}</p>
                        </div>
                      ))}
                    </div>

                    {/* Vocabulary Section */}
                    {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4 text-center">Useful Vocabulary:</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {selectedTopic.vocab.map((word, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-8">
                    <div className="text-8xl font-bold text-blue-600 mb-4">
                      {countdown}
                    </div>
                    <div className="text-xl text-gray-600 mb-6">
                      seconds to prepare
                    </div>
                    
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32 mx-auto mb-8">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${((30 - countdown) / 30) * 351.86} 351.86`}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                    </div>
                  </div>

                  <Button
                    onClick={skipCountdown}
                    variant="outline"
                    className="px-6 py-3 text-lg"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Start Early
                  </Button>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>🕒 Get Ready:</strong> Use this countdown to think about your answer structure. Remember: introduction, main points, and conclusion work well for most topics.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Recording Phase */}
        {practicePhase === 'recording' && selectedTopic && (
          <div className="max-w-6xl mx-auto">
            {/* Mobile Layout: Recording first, topic below */}
            <div className="block lg:hidden space-y-6">
              {/* Voice Recorder - Mobile */}
              <Card className="p-6 shadow-lg">
                <div className="mb-4">
                  <Button
                    onClick={backToTopics}
                    variant="outline"
                    size="sm"
                  >
                    ← Back to Topics
                  </Button>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-0 text-center">Voice Recorder</h2>
                {/* Practice Timer Display */}
                <div className="mt-0 p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-sm text-green-800 mb-1">Practice Duration</div>
                  <div className="text-xl font-bold text-green-900">
                    {formatTime(practiceTime)}
                  </div>
                </div>
                <div className="text-center space-y-6">
                  {/* Recording Status */}
                  <div className="mb-6">
                    {isRecording ? (
                      <div className="text-red-600">
                        <div className="text-2xl font-bold mb-2">Recording...</div>
                        <div className="text-xl">{formatTime(recordingTime)}</div>
                        <div className="flex justify-center mt-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ) : totalRecordedTime > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-semibold">Recording Complete</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          Total Duration: {formatTime(totalRecordedTime)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <div className="text-xl">Ready to record</div>
                        {audioBlob && (
                          <div className="text-sm mt-2 text-green-600">Recording saved successfully!</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Main Recording Button */}
                  <div className="mb-8">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`${
                        isRecording 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white px-8 py-4 text-lg rounded-full shadow-lg transform transition-transform hover:scale-105`}
                      size="lg"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-6 h-6 mr-3" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-6 h-6 mr-3" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Audio Playback */}
                  {audioBlob && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <audio 
                          ref={audioRef} 
                          controls 
                          className="w-full"
                          onEnded={() => setIsPlaying(false)}
                        >
                          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center space-x-4">
                        <Button
                          onClick={playAudio}
                          variant="outline"
                          className="px-6 py-2"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Play
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={downloadAudio}
                          variant="outline"
                          className="px-6 py-2"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>

                      </div>

                      {/* Recording Info */}
                      <div className="text-center text-sm text-gray-600 mt-4">
                        <p>File size: {(audioBlob.size / 1024).toFixed(1)} KB</p>
                        <p>Duration: {formatTime(totalRecordedTime)}</p>
                      </div>
                    </div>
                  )}

                  {/* Transcription Section */}
                  {(transcript || isTranscribing) && (
                    <div className="mt-6">
                      <Card className="p-4 bg-green-50 border-green-200">
                        <div className="text-left">
                          <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Transcription
                          </h3>
                          {isTranscribing ? (
                            <div className="text-green-700 italic">
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                                Transcribing your speech...
                              </div>
                            </div>
                          ) : (
                            <div className="text-green-800 whitespace-pre-wrap">
                              {transcript || "No transcription available"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Recording Tips */}
                  <div className="mt-6">
                    <Card className="p-4 bg-orange-50 border-orange-200">
                      <div className="text-center">
                        <p className="text-sm text-orange-800">
                          <strong>🎤 Recording Tips:</strong> Find a noiseless place, speak clearly at natural pace, and maintain good posture. Don't worry about perfection - focus on communicating your ideas effectively!
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Evaluation Loading */}
                  {isEvaluating && (
                    <div className="mt-6">
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="text-center">
                          <div className="flex items-center justify-center text-blue-700">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
                            Evaluating your response...
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </Card>

              {/* Topic Reference - Mobile */}
              <Card className="p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {selectedTopic.title}
                </h3>
                <div className="space-y-2">
                  {selectedTopic.questions.map((question, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 text-sm">{question}</p>
                    </div>
                  ))}
                </div>

                {/* Vocabulary Section */}
                {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
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
            </div>

            {/* Desktop Layout: Original side-by-side */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Topic Reference */}
                <Card className="p-6 shadow-lg">
                  <div className="mb-4">
                    <Button
                      onClick={backToTopics}
                      variant="outline"
                      size="sm"
                    >
                      ← Back to Topics
                    </Button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedTopic.title}
                  </h3>
                  <div className="space-y-2">
                    {selectedTopic.questions.map((question, index) => (
                      <div key={index} className="flex items-start">
                        <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 text-sm">{question}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vocabulary Section */}
                  {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
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

                {/* Voice Recorder */}
                <Card className="p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-0 text-center">Voice Recorder</h2>
                   {/* Practice Timer Display */}
                  <div className="mt-0 p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-sm text-green-800 mb-1">Practice Duration</div>
                    <div className="text-xl font-bold text-green-900">
                      {formatTime(practiceTime)}
                    </div>
                  </div>
                  <div className="text-center space-y-6">
                    {/* Recording Status */}
                    <div className="mb-6">
                      {isRecording ? (
                        <div className="text-red-600">
                          <div className="text-2xl font-bold mb-2">Recording...</div>
                          <div className="text-xl">{formatTime(recordingTime)}</div>
                          <div className="flex justify-center mt-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ) : totalRecordedTime > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-2">
                            <Clock className="w-5 h-5 text-green-600" />
                            <span className="text-green-600 font-semibold">Recording Complete</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            Total Duration: {formatTime(totalRecordedTime)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-600">
                          <div className="text-xl">Ready to record</div>
                          {audioBlob && (
                            <div className="text-sm mt-2 text-green-600">Recording saved successfully!</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Main Recording Button */}
                    <div className="mb-8">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white px-8 py-4 text-lg rounded-full shadow-lg transform transition-transform hover:scale-105`}
                        size="lg"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-6 h-6 mr-3" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-6 h-6 mr-3" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Audio Playback */}
                    {audioBlob && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <audio 
                            ref={audioRef} 
                            controls 
                            className="w-full"
                            onEnded={() => setIsPlaying(false)}
                          >
                            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-4">
                          <Button
                            onClick={playAudio}
                            variant="outline"
                            className="px-6 py-2"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Play
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={downloadAudio}
                            variant="outline"
                            className="px-6 py-2"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>

                        </div>

                        {/* Recording Info */}
                        <div className="text-center text-sm text-gray-600 mt-4">
                          <p>File size: {(audioBlob.size / 1024).toFixed(1)} KB</p>
                          <p>Duration: {formatTime(totalRecordedTime)}</p>
                        </div>
                      </div>
                    )}

                    {/* Transcription Section */}
                    {(transcript || isTranscribing) && (
                      <div className="mt-6">
                        <Card className="p-4 bg-green-50 border-green-200">
                          <div className="text-left">
                            <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                              <FileText className="w-5 h-5 mr-2" />
                              Transcription
                            </h3>
                            {isTranscribing ? (
                              <div className="text-green-700 italic">
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                                  Transcribing your speech...
                                </div>
                              </div>
                            ) : (
                              <div className="text-green-800 whitespace-pre-wrap">
                                {transcript || "No transcription available"}
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* Recording Tips */}
                    <div className="mt-6">
                      <Card className="p-4 bg-orange-50 border-orange-200">
                        <div className="text-center">
                          <p className="text-sm text-orange-800">
                            <strong>🎤 Recording Tips:</strong> Find a noiseless place, speak clearly at natural pace, and maintain good posture. Don't worry about perfection - focus on communicating your ideas effectively!
                          </p>
                        </div>
                      </Card>
                    </div>

                    {/* Evaluation Loading */}
                    {isEvaluating && (
                      <div className="mt-6">
                        <Card className="p-4 bg-blue-50 border-blue-200">
                          <div className="text-center">
                            <div className="flex items-center justify-center text-blue-700">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
                              Evaluating your response...
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Phase */}
        {practicePhase === 'evaluation' && selectedTopic && evaluationResult && (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-lg">
              <div className="text-center mb-8">
                <Button
                  onClick={backToTopics}
                  variant="outline"
                  className="mb-4"
                >
                  ← Back to Topics
                </Button>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Results</h2>
                <p className="text-lg text-gray-600">Here's how you performed on the speaking task</p>
                
               
                
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
                <div className="bg-white border border-gray-300 rounded-lg">
                  {formatEvaluationResult(evaluationResult)}
                </div>

                {/* Your Response - Mobile (Second) */}
                <Card className="p-6 bg-green-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Your Response
                  </h3>
                  <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                    {transcript}
                  </div>
                </Card>

                {/* Topic - Mobile (Third) */}
                <Card className="p-6 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Topic</h3>
                  <h4 className="text-lg text-blue-600 mb-3">{selectedTopic.title}</h4>
                  <div className="space-y-2">
                    {selectedTopic.questions.map((question, index) => (
                      <div key={index} className="flex items-start">
                        <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 text-sm">{question}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vocabulary Section */}
                  {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
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
                      // Reset to recording phase for another attempt
                      setPracticePhase('recording')
                      setAudioBlob(null)
                      setTranscript('')
                      setEvaluationResult(null)
                      setRecordingTime(0)
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Try Again
                  </Button>

                  <Button
                    onClick={() => {
                      // Start countdown for another practice
                      setPracticePhase('countdown')
                      setIsCountdownActive(true)
                      setCountdown(30)
                      setAudioBlob(null)
                      setTranscript('')
                      setEvaluationResult(null)
                      setRecordingTime(0)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Practice Again (with countdown)
                  </Button>

                  {audioBlob && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <audio 
                          ref={audioRef} 
                          controls 
                          className="w-full"
                          onEnded={() => setIsPlaying(false)}
                        >
                          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>

                      <Button
                        onClick={downloadAudio}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
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
                      <h4 className="text-lg text-blue-600 mb-3">{selectedTopic.title}</h4>
                      <div className="space-y-2">
                        {selectedTopic.questions.map((question, index) => (
                          <div key={index} className="flex items-start">
                            <span className="flex w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <p className="text-gray-700 text-sm">{question}</p>
                          </div>
                        ))}
                      </div>

                      {/* Vocabulary Section */}
                      {selectedTopic.vocab && selectedTopic.vocab.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Useful Vocabulary:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTopic.vocab.map((word, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
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
                        {transcript}
                      </div>
                    </Card>
                  </div>

                  {/* Evaluation Results */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-300 rounded-lg">
                      {formatEvaluationResult(evaluationResult)}
                    </div>

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
                          // Reset to recording phase for another attempt
                          setPracticePhase('recording')
                          setAudioBlob(null)
                          setTranscript('')
                          setEvaluationResult(null)
                          setRecordingTime(0)
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Try Again
                      </Button>

                      <Button
                        onClick={() => {
                          // Start countdown for another practice
                          setPracticePhase('countdown')
                          setIsCountdownActive(true)
                          setCountdown(30)
                          setAudioBlob(null)
                          setTranscript('')
                          setEvaluationResult(null)
                          setRecordingTime(0)
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Practice Again (with countdown)
                      </Button>

                      {audioBlob && (
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <audio 
                              ref={audioRef} 
                              controls 
                              className="w-full"
                              onEnded={() => setIsPlaying(false)}
                            >
                              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>

                          <Button
                            onClick={downloadAudio}
                            variant="outline"
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Recording
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
