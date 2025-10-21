'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mic, MessageSquare, Copy, Check, Clock, Hash, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EvaluationData {
  id: string // BigInt converted to string
  userId: string | null
  topic: string
  questions: string // JSON string in database
  userAnswer: string
  evaluationResponse: string
  recordingDuration: number
  urlLink: string | null
  createdAt: string
  updatedAt: string
  user?: {
    name: string
    email: string
  } | null
}

export default function SpeakingEvaluationPage() {
  const { urlLink } = useParams()
  const router = useRouter()
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  useEffect(() => {
    if (urlLink) {
      fetchEvaluationData()
    }
  }, [urlLink])

  const fetchEvaluationData = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('speaking_evaluation_data')
        .select('*')
        .eq('urlLink', urlLink)
        .single()
      
      if (error) {
        throw new Error('Evaluation not found')
      }

      setEvaluationData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluation')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Function to format evaluation result with clean, professional styling
  const formatEvaluationResult = (result: string) => {
    if (!result) return null;

    // Handle different result formats
    let parsedResult: any = {};
    
    // Try to parse JSON string from database
    try {
      parsedResult = JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse evaluation result:', error);
      // If parsing fails, display the raw text
      return (
        <div className="bg-white p-4 rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      );
    }
    
    // If result has a text property containing JSON, parse it
    if (parsedResult.text && typeof parsedResult.text === 'string') {
      try {
        // Extract JSON from the text if it's wrapped in ```json blocks
        const jsonMatch = parsedResult.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try to parse the text directly as JSON
          parsedResult = JSON.parse(parsedResult.text);
        }
      } catch (error) {
        console.error('Failed to parse nested evaluation result:', error);
        // Fallback to original result
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

  const copyUrlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading evaluation...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !evaluationData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Evaluation Not Found</h1>
              <p className="text-gray-600 mb-6">The speaking evaluation you're looking for doesn't exist or has been removed.</p>
              <Link href="/speaking-check">
                <Button className="bg-gray-800 hover:bg-gray-900 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Speaking Check
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <Link href="/speaking-check">
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Speaking Check
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Speaking Evaluation</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(evaluationData.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                onClick={copyUrlToClipboard}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Link
                  </>
                )}
              </Button>
            </div>

          <div className="grid gap-6">
            {/* Topic and Questions */}
            <Card className="border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Mic className="w-5 h-5" />
                  Speaking Topic
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {evaluationData.topic}
                </h3>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Practice Questions:</h4>
                  <div className="space-y-2">
                    {(() => {
                      let questions = evaluationData.questions;
                      
                      // Try to parse JSON string if it's a JSON array
                      try {
                        const parsed = JSON.parse(questions);
                        if (Array.isArray(parsed)) {
                          return parsed.map((question, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200">
                              <span className="text-sm font-medium text-gray-600 mt-0.5">
                                {index + 1}.
                              </span>
                              <span className="text-gray-700">{question}</span>
                            </div>
                          ));
                        }
                      } catch (e) {
                        // If parsing fails, treat as single question string
                      }
                      
                      // Display as single question if not an array
                      return (
                        <div className="p-3 bg-gray-50 border border-gray-200">
                          <span className="text-gray-700">{questions}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Recording Duration: {formatTime(evaluationData.recordingDuration)}
                  </div>
                 
                </div>
              </CardContent>
            </Card>

            {/* User Response */}
            <Card className="border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <MessageSquare className="w-5 h-5" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <div className="bg-gray-50 p-4 border border-gray-200 border-l-4 border-l-gray-500">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {evaluationData.userAnswer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Evaluation */}
            <Card className="border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-gray-800">
                  AI Evaluation & Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  {formatEvaluationResult(evaluationData.evaluationResponse)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Want to practice more speaking? 
              <Link href="/speaking-check" className="text-gray-700 hover:text-gray-900 ml-1">
                Try another topic
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }
