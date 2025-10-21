'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, MessageSquare, Copy, Check, Clock, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Add professional evaluation styles
const evaluationStyles = `
  .professional-evaluation {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  
  .professional-evaluation h1 {
    color: #1A3A6E;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .professional-evaluation h2 {
    color: #1A3A6E;
    font-weight: bold;
    border-bottom: 2px solid #4f5bd5;
    padding-bottom: 0.5rem;
    margin: 1rem 0 0.75rem 0;
  }
  
  .professional-evaluation h3 {
    color: #1A3A6E;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
  }
  
  .professional-evaluation h4 {
    color: #4f5bd5;
    font-weight: 600;
    background-color: rgba(79, 91, 213, 0.1);
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin: 1rem 0 0.5rem 0;
  }
  
  .professional-evaluation p {
    color: #374151;
    line-height: 1.625;
    margin-bottom: 0.75rem;
  }
  
  .professional-evaluation strong {
    color: #1A3A6E;
    font-weight: 600;
  }
  
  .professional-evaluation table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .professional-evaluation table th {
    background-color: #1A3A6E;
    color: white;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #d1d5db;
  }
  
  .professional-evaluation table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #d1d5db;
    color: #374151;
  }
  
  .professional-evaluation table tbody tr:nth-child(even) {
    background-color: #f9fafb;
  }
  
  .professional-evaluation table tbody tr:hover {
    background-color: #f3f4f6;
  }
  
  .professional-evaluation ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  .professional-evaluation li {
    color: #374151;
    margin-bottom: 0.25rem;
  }
`;

interface EvaluationData {
  id: string // BigInt converted to string
  userId: string | null
  taskType: string
  question: string
  userAnswer: string
  evaluationResponse: string
  wordCount: number | null
  urlLink: string | null
  isLoggedIn: boolean | null
  createdAt: string
  updatedAt: string
  user?: {
    name: string
    email: string
  } | null
}

export default function EvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const urlLink = params.urlLink as string
  
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchEvaluationData = async () => {
      try {
        const { data, error } = await supabase
          .from('writing_evaluation_data')
          .select('*')
          .eq('urlLink', urlLink)
          .single()
        
        if (error) {
          setError('Evaluation not found')
          return
        }

        setEvaluationData(data)
      } catch (err) {
        console.error('Error fetching evaluation data:', err)
        setError('Failed to load evaluation data')
      } finally {
        setLoading(false)
      }
    }

    if (urlLink) {
      fetchEvaluationData()
    }
  }, [urlLink])

  const formatEvaluationText = (text: string | any) => {
    if (!text) return null;
    
    // If it's a JSON object, extract the text property
    if (typeof text === 'object' && text.text) {
      text = text.text;
    }
    
    // Convert to string if it's not already
    const textString = typeof text === 'string' ? text : String(text);
    
    // Remove HTML comments
    let cleanText = textString.replace(/<!--[\s\S]*?-->/g, '');
    
    // Extract Band Score if it appears early in the text
    const bandScoreMatch = cleanText.match(/Band Score:\s*(\d+(?:\.\d+)?)/i);
    let bandScore = null;
    if (bandScoreMatch) {
      bandScore = bandScoreMatch[1];
      // Remove the band score line from the main content
      cleanText = cleanText.replace(/Band Score:\s*\d+(?:\.\d+)?/i, '');
    }
    
    // Check if the content contains HTML structure (like tables, divs)
    if (cleanText.includes('<table') || cleanText.includes('<div class=') || cleanText.includes('<tbody>')) {
      return (
        <div className="professional-evaluation">
          {/* Band Score Header */}
          {bandScore && (
            <div className="mb-6 p-4 bg-white border-l-4 border-[#1A3A6E] rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-[#1A3A6E] mb-2">
                Band Score: {bandScore}
              </h1>
              <p className="text-[#4f5bd5] font-medium">IELTS Writing Evaluation Result</p>
            </div>
          )}
          
          {/* Render HTML content with professional styling */}
          <div 
            className="evaluation-content space-y-4"
            dangerouslySetInnerHTML={{ 
              __html: cleanText
                // Add professional styling classes
                .replace(/<div class="[^"]*">/g, '<div class="mb-4">')
                .replace(/<h2[^>]*>/g, '<h2 class="text-xl font-bold text-[#1A3A6E] mb-3 pb-2 border-b-2 border-[#4f5bd5]">')
                .replace(/<h3[^>]*>/g, '<h3 class="text-lg font-semibold text-[#1A3A6E] mb-2 mt-4">')
                .replace(/<h4[^>]*>/g, '<h4 class="text-base font-semibold text-[#4f5bd5] mb-2 mt-3">')
                .replace(/<p class="[^"]*">/g, '<p class="text-gray-700 leading-relaxed mb-3">')
                .replace(/<p>/g, '<p class="text-gray-700 leading-relaxed mb-3">')
                .replace(/<table[^>]*>/g, '<table class="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden mb-4">')
                .replace(/<thead[^>]*>/g, '<thead class="bg-[#1A3A6E] text-white">')
                .replace(/<th[^>]*>/g, '<th class="border border-gray-300 px-4 py-2 text-left font-semibold">')
                .replace(/<td[^>]*>/g, '<td class="border border-gray-300 px-4 py-2">')
                .replace(/<tfoot[^>]*>/g, '<tfoot class="bg-gray-50">')
                .replace(/<ul[^>]*>/g, '<ul class="list-disc list-inside space-y-1 mb-3 ml-4">')
                .replace(/<li[^>]*>/g, '<li class="text-gray-700">')
            }} 
          />
        </div>
      );
    }
    
    // Fallback to structured formatting for non-HTML content
    const lines = cleanText.split('\n');
    
    return (
      <div className="professional-evaluation">
        {/* Band Score Header */}
        {bandScore && (
          <div className="mb-6 p-4 bg-white border-l-4 border-[#1A3A6E] rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-[#1A3A6E] mb-2">
              Band Score: {bandScore}
            </h1>
            <p className="text-[#4f5bd5] font-medium">IELTS Writing Evaluation Result</p>
          </div>
        )}
        
        <div className="space-y-4">
          {lines.map((line, lineIndex) => {
            // Check if line contains h1 tag (any variation)
            if (line.includes('<h1') && line.includes('</h1>')) {
              // Extract the h1 content more robustly
              const h1Match = line.match(/<h1[^>]*>(.*?)<\/h1>/i);
              if (h1Match && h1Match[1]) {
                const h1Content = h1Match[1].trim();
                return (
                  <div key={lineIndex} className="mb-4">
                    <h1 className="text-xl font-bold text-[#1A3A6E] pb-2 border-b-2 border-[#4f5bd5]">
                      {h1Content}
                    </h1>
                  </div>
                );
              }
            }
            
            // Check if line starts with ### for section headers
            if (line.startsWith('###') || line.startsWith('<h3>')) {
              const headerText = line.replace(/^###\s*/, '').replace(/<\/?h3>/g, '');
              return (
                <h3 key={lineIndex} className="text-lg font-semibold text-[#1A3A6E] mb-2 mt-4">
                  {headerText}
                </h3>
              );
            }
            
            // Check if line starts with #### or contains h4 for task descriptors
            if (line.startsWith('####') || line.includes('<h4>')) {
              const headerText = line.replace(/^####\s*/, '').replace(/<\/?h4>/g, '');
              return (
                <div key={lineIndex} className="mt-4 mb-2">
                  <h4 className="text-base font-semibold text-[#4f5bd5] mb-2 bg-[#4f5bd5]/10 p-2 rounded">
                    {headerText}
                  </h4>
                </div>
              );
            }
            
            // Skip empty lines
            if (!line.trim()) {
              return <div key={lineIndex} className="h-2" />;
            }
            
            // Process **text** formatting for bold and handle paragraph content
            const parts = line.split(/(\*\*.*?\*\*)/g);
            
            return (
              <div key={lineIndex} className="mb-3">
                <p className="text-gray-700 leading-relaxed">
                  {parts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      // Remove ** and make bold
                      const boldText = part.slice(2, -2);
                      return (
                        <strong key={partIndex} className="font-semibold text-[#1A3A6E]">
                          {boldText}
                        </strong>
                      );
                    }
                    return <span key={partIndex}>{part}</span>;
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const countWords = (text: string): number => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A3A6E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading evaluation data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !evaluationData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="mb-6">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-700 mb-2">
                {error || 'Evaluation Not Found'}
              </h1>
              <p className="text-gray-600">
                The evaluation you're looking for doesn't exist or has been removed.
              </p>
            </div>
            <Link href="/writing-check">
              <Button className="bg-[#1A3A6E] hover:bg-[#142d57] text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Writing Practice
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: evaluationStyles }} />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/writing-check"
            className="inline-flex items-center text-[#1A3A6E] hover:text-[#142d57] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Writing Practice
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A3A6E] mb-2">
                IELTS Writing Evaluation
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(evaluationData.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  {urlLink}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={copyUrl}
              variant="outline"
              className="border-[#1A3A6E] text-[#1A3A6E] hover:bg-[#1A3A6E] hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Share URL
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Task Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader className={`text-white rounded-t-lg ${
              evaluationData.taskType === 'task1' ? 'bg-[#1A3A6E]' : 'bg-[#ff8c42]'
            }`}>
              <CardTitle className="flex items-center text-lg">
                {evaluationData.taskType === 'task1' ? (
                  <FileText className="w-5 h-5 mr-2" />
                ) : (
                  <MessageSquare className="w-5 h-5 mr-2" />
                )}
                Writing {evaluationData.taskType === 'task1' ? 'Task 1' : 'Task 2'}
              </CardTitle>
              <p className="text-sm opacity-90">
                {evaluationData.taskType === 'task1' 
                  ? 'Academic Writing | 150+ words | 20 minutes'
                  : 'Essay Writing | 250+ words | 40 minutes'
                }
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Question:</h3>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#1A3A6E]">
                  <p className="text-gray-800 whitespace-pre-wrap">{evaluationData.question}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Word Count: <span className="font-semibold text-gray-800">{evaluationData.wordCount || 0}</span></span>
                <span>•</span>
                <span>Type: <span className="font-semibold text-gray-800 capitalize">{evaluationData.taskType}</span></span>
              </div>
            </CardContent>
          </Card>

          {/* User Answer */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gray-100 rounded-t-lg">
              <CardTitle className="text-gray-700 text-lg">Your Answer</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {evaluationData.userAnswer}
                </p>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Actual word count: {countWords(evaluationData.userAnswer)} words
              </div>
            </CardContent>
          </Card>

          {/* AI Evaluation */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-green-50 border-b border-green-200 rounded-t-lg">
              <CardTitle className="text-green-700 text-lg">AI Evaluation & Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg">
                <div className="prose max-w-none">
                  {(() => {
                    let evaluationText = evaluationData.evaluationResponse;
                    
                    // If it's a JSON string, try to parse it and extract text
                    try {
                      const parsed = JSON.parse(evaluationText);
                      if (parsed.text) {
                        evaluationText = parsed.text;
                      }
                    } catch (e) {
                      // If parsing fails, use the original string
                    }
                    
                    return (
                      <div className="space-y-3 text-gray-700 leading-relaxed">
                        {formatEvaluationText(evaluationText)}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/writing-check">
              <Button className="bg-[#1A3A6E] hover:bg-[#142d57] text-white w-full sm:w-auto">
                Practice More Writing
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-[#1A3A6E] text-[#1A3A6E] hover:bg-[#1A3A6E] hover:text-white w-full sm:w-auto">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
