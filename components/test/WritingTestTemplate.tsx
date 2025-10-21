'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Eye, EyeOff, Clock, BookOpen, FileText, ClipboardList, PenTool, CheckCircle, Search, Book, BookOpenCheck, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import WordCounter from '@/components/utils/WordCounter'
import { useSession } from '@/lib/auth-client'
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

interface WritingTestProps {
  bookNumber: string
  testNumber: string
  task1Question: string
  task1ImagePath?: string
  task1ModelAnswer?: string
  task2Question: string
  task2ModelAnswer?: string
  backUrl: string
}

export default function WritingTestTemplate({
  bookNumber,
  testNumber,
  task1Question,
  task1ImagePath,
  task1ModelAnswer,
  task2Question,
  task2ModelAnswer,
  backUrl
}: WritingTestProps) {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession()
  
  const [task1Answer, setTask1Answer] = useState('')
  const [task2Answer, setTask2Answer] = useState('')
  const [showModelAnswers, setShowModelAnswers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('')
  
  // Evaluation states
  const [task1Evaluation, setTask1Evaluation] = useState<any>(null)
  const [task2Evaluation, setTask2Evaluation] = useState<any>(null)
  const [isEvaluatingTask1, setIsEvaluatingTask1] = useState(false)
  const [isEvaluatingTask2, setIsEvaluatingTask2] = useState(false)
  
  // Shareable URL states
  const [task1ShareableUrl, setTask1ShareableUrl] = useState<string | null>(null)
  const [task2ShareableUrl, setTask2ShareableUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<'task1' | 'task2' | null>(null)
  
  // Timer states
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
  const [submitted, setSubmitted] = useState(false)
  


  // Function to format evaluation text with professional styling
  const formatEvaluationText = (text: string) => {
    if (!text) return null;
    
    // Remove HTML comments
    let cleanText = text.replace(/<!--[\s\S]*?-->/g, '');
    
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
                  <h1 key={lineIndex} className="text-2xl font-bold text-[#1A3A6E] mb-4 text-center">
                    {h1Content}
                  </h1>
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
                  <h4 className="text-base font-semibold text-[#4f5bd5] bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-[#4f5bd5]">
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTestStarted && !submitted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Auto-submit when time runs out
            handleSubmit()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTestStarted, submitted, timeLeft])

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTestStart = () => {
    setIsTestStarted(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitted(true)
    setSubmissionStatus('Test completed!')
    setIsSubmitting(false)
  }

  // Evaluation API function
  const evaluateEssay = async (question: string, answer: string) => {
    const prompt = `Q: ${question}\n\nAns: ${answer}`;
    const response = await fetch(
        "https://9x2p4mt3.rpcl.dev/api/v1/prediction/fc6e56dd-9660-4002-99a8-23a825115085",
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
  }

  // Function to count words in text
  const countWords = (text: string): number => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  // Function to save evaluation data to database using Supabase direct insertion
  const saveWritingEvaluationData = async (
    taskType: 'task1' | 'task2',
    question: string,
    userAnswer: string,
    evaluationResponse: any,
    wordCount: number
  ) => {
    try {
      const isLoggedIn = !!session?.user
      const userId = session?.user?.id || null
      
      console.log('Saving writing evaluation data...', {
        taskType,
        wordCount,
        isLoggedIn,
        userId: userId ? 'present' : 'null'
      });
      
      // Generate a unique URL identifier
      const urlLink = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Insert data into Supabase
      const { data, error } = await supabase
        .from('writing_evaluation_data')
        .insert([
          {
            userId,
            taskType,
            question,
            userAnswer,
            evaluationResponse: JSON.stringify(evaluationResponse),
            wordCount,
            isLoggedIn,
            urlLink
          }
        ])
        .select()
      
      if (error) {
        console.error('Supabase Error:', error)
        throw new Error(`Supabase error: ${error.message}`)
      }
      
      console.log('Writing evaluation data saved successfully:', data);
      
      // Return result with shareable URL (matching the API response format)
      const insertedData = data[0]
      return {
        success: true,
        id: insertedData.id.toString(),
        urlLink: insertedData.urlLink,
        shareableUrl: urlLink,
        createdAt: insertedData.createdAt
      };
    } catch (error) {
      console.error('Failed to save writing evaluation data:', error);
      // Don't show alert to user as this is background data collection
      // The main functionality should continue working even if data saving fails
      return null;
    }
  };

  const handleTask1Evaluation = async () => {
    if (!task1Answer.trim()) {
      alert('Please write your Task 1 answer before evaluating.');
      return;
    }

    setIsEvaluatingTask1(true);
    try {
      const result = await evaluateEssay(task1Question, task1Answer);
      setTask1Evaluation(result);

      // Save evaluation data to database (in background, don't block UI)
      const saveResult = await saveWritingEvaluationData(
        'task1',
        task1Question,
        task1Answer,
        result,
        countWords(task1Answer)
      );
      
      // Store shareable URL if save was successful
      if (saveResult && saveResult.shareableUrl) {
        const fullUrl = `${window.location.origin}/evaluation/writing/${saveResult.shareableUrl}`;
        setTask1ShareableUrl(fullUrl);
      }

    } catch (error) {
      console.error('Error evaluating Task 1:', error);
      alert('Failed to evaluate Task 1. Please try again.');
    } finally {
      setIsEvaluatingTask1(false);
    }
  }

  const handleTask2Evaluation = async () => {
    if (!task2Answer.trim()) {
      alert('Please write your Task 2 answer before evaluating.');
      return;
    }

    setIsEvaluatingTask2(true);
    try {
      const result = await evaluateEssay(task2Question, task2Answer);
      setTask2Evaluation(result);

      // Save evaluation data to database (in background, don't block UI)
      const saveResult = await saveWritingEvaluationData(
        'task2',
        task2Question,
        task2Answer,
        result,
        countWords(task2Answer)
      );
      
      // Store shareable URL if save was successful
      if (saveResult && saveResult.shareableUrl) {
        const fullUrl = `${window.location.origin}/evaluation/writing/${saveResult.shareableUrl}`;
        setTask2ShareableUrl(fullUrl);
      }

    } catch (error) {
      console.error('Error evaluating Task 2:', error);
      alert('Failed to evaluate Task 2. Please try again.');
    } finally {
      setIsEvaluatingTask2(false);
    }
  }

  // Function to copy URL to clipboard
  const copyUrlToClipboard = async (url: string, taskType: 'task1' | 'task2') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(taskType);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL to clipboard');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: evaluationStyles }} />
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {/* Header Section */}
        <div className="mb-4 sm:mb-8">
          <Link href={backUrl} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors duration-200 text-sm sm:text-base">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back to Writing Tests
          </Link>
          
          <div className="text-center bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-8 border border-gray-100">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Cambridge IELTS {bookNumber}</h1>
            </div>
            <div className="bg-blue-600 text-white rounded-lg p-3 sm:p-4 mx-auto max-w-2xl">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Writing Test {testNumber}</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span><strong>Total:</strong> 60 minutes</span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span><strong>Task 1:</strong> 20 min</span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span><strong>Task 2:</strong> 40 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Section */}
        <div className="mb-4 sm:mb-8">
          <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'} shadow-lg`}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-3xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Time Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-semibold text-gray-800">60 minutes</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Time</div>
                  </div>
                </div>
                
                {!isTestStarted && !submitted && (
                  <Button 
                    onClick={handleTestStart} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Start Test
                  </Button>
                )}
                
                {isTestStarted && !submitted && (
                  <div className="bg-blue-100 px-3 sm:px-4 py-2 rounded-lg">
                    <div className="text-xs sm:text-sm text-blue-700 font-bold">Test in Progress</div>
                  </div>
                )}
                
                {submitted && (
                  <div className="bg-green-100 px-3 sm:px-4 py-2 rounded-lg">
                    <div className="text-xs sm:text-sm text-green-700 font-bold">Test Completed</div>
                  </div>
                )}
              </div>
              
              {!isTestStarted && !submitted && (
                <div className="mt-4 p-3 sm:p-4 bg-amber-100 rounded-lg border border-amber-200">
                  <p className="font-bold text-amber-800 mb-2 flex items-center text-sm sm:text-base">
                    <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Instructions:
                  </p>
                  <div className="text-amber-700 space-y-1 text-xs sm:text-sm">
                    <p>• <strong>You have 60 minutes</strong> to complete both tasks</p>
                    <p>• <strong>Spend about 20 minutes</strong> on Task 1 and <strong>40 minutes</strong> on Task 2</p>
                    <p>• <strong>Click "Start Test"</strong> to begin the timer</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-8">
          {/* Task 1 */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" />
                Writing Task 1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm sm:text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                  <strong>{task1Question}</strong>
                </p>
              </div>
              
              {task1ImagePath && (
                <div className="flex justify-center my-4 sm:my-6">
                  <img 
                    src={task1ImagePath} 
                    alt="Task 1 Visual" 
                    className="max-w-full h-auto rounded-lg border shadow-md" 
                  />
                </div>
              )}
              
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 font-semibold flex items-center">
                  <PenTool className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Write at least 150 words.
                </p>
              </div>
              
              <Textarea
                placeholder="Type your answer for Task 1 here..."
                className="min-h-[200px] sm:min-h-[250px] text-sm sm:text-base border-2 focus:border-blue-500 rounded-lg p-3 sm:p-4"
                value={task1Answer}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTask1Answer(e.target.value)}
                disabled={isSubmitting || !isTestStarted}
              />
              <div className="text-right">
                <WordCounter text={task1Answer} minWords={150} />
              </div>
              
              {/* Task 1 Evaluation Button */}
              <div className="mt-4 sm:mt-6 border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex justify-center">
                  <Button 
                    onClick={handleTask1Evaluation} 
                    disabled={isEvaluatingTask1 || !task1Answer.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isEvaluatingTask1 ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="hidden sm:inline">Evaluating Task 1...</span>
                        <span className="sm:hidden">Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        <span className="hidden sm:inline">Evaluate Task 1</span>
                        <span className="sm:hidden">Evaluate</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Task 1 Evaluation Result */}
              {task1Evaluation && (
                <div className="mt-4 sm:mt-6">
                  <Card className="bg-white shadow-xl border-t-4 border-green-500">
                    <CardHeader className="bg-green-600 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                            <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <span className="hidden sm:inline">Task 1 Evaluation Result</span>
                          <span className="sm:hidden">Task 1 Result</span>
                        </CardTitle>
                        <div className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Analysis Complete</span>
                          <span className="sm:hidden">Complete</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-6 shadow-inner">
                        <div className="prose prose-sm md:prose-base max-w-none">
                          <div className="whitespace-pre-wrap text-gray-900 font-medium leading-relaxed text-sm sm:text-base">
                            {formatEvaluationText(task1Evaluation.text) || (
                              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-gray-100 p-2 sm:p-3 rounded border overflow-x-auto">
                                {JSON.stringify(task1Evaluation, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Shareable URL Section for Task 1 */}
                      {task1ShareableUrl && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-blue-800 mb-1">Share Your Result</h4>
                              <p className="text-xs text-blue-600 break-all">{task1ShareableUrl}</p>
                            </div>
                            <Button
                              onClick={() => copyUrlToClipboard(task1ShareableUrl, 'task1')}
                              size="sm"
                              variant="outline"
                              className="ml-2 flex items-center gap-1 text-xs"
                            >
                              {copiedUrl === 'task1' ? (
                                <><Check className="w-3 h-3" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task 2 */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" />
                Writing Task 2
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
              <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <p className="text-sm sm:text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                  <strong>{task2Question}</strong>
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 font-semibold flex items-center">
                  <PenTool className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Write at least 250 words.
                </p>
              </div>
              
              <Textarea
                placeholder="Type your answer for Task 2 here..."
                className="min-h-[250px] sm:min-h-[350px] text-sm sm:text-base border-2 focus:border-indigo-500 rounded-lg p-3 sm:p-4"
                value={task2Answer}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTask2Answer(e.target.value)}
                disabled={isSubmitting || !isTestStarted}
              />
              <div className="text-right">
                <WordCounter text={task2Answer} minWords={250} />
              </div>
              
              {/* Task 2 Evaluation Button */}
              <div className="mt-4 sm:mt-6 border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex justify-center">
                  <Button 
                    onClick={handleTask2Evaluation} 
                    disabled={isEvaluatingTask2 || !task2Answer.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isEvaluatingTask2 ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="hidden sm:inline">Evaluating Task 2...</span>
                        <span className="sm:hidden">Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        <span className="hidden sm:inline">Evaluate Task 2</span>
                        <span className="sm:hidden">Evaluate</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Task 2 Evaluation Result */}
              {task2Evaluation && (
                <div className="mt-4 sm:mt-6">
                  <Card className="bg-white shadow-xl border-t-4 border-indigo-500">
                    <CardHeader className="bg-indigo-600 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                            <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <span className="hidden sm:inline">Task 2 Evaluation Result</span>
                          <span className="sm:hidden">Task 2 Result</span>
                        </CardTitle>
                        <div className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Analysis Complete</span>
                          <span className="sm:hidden">Complete</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-6 shadow-inner">
                        <div className="prose prose-sm md:prose-base max-w-none">
                          <div className="whitespace-pre-wrap text-gray-900 font-medium leading-relaxed text-sm sm:text-base">
                            {formatEvaluationText(task2Evaluation.text) || (
                              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-gray-100 p-2 sm:p-3 rounded border overflow-x-auto">
                                {JSON.stringify(task2Evaluation, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Shareable URL Section for Task 2 */}
                      {task2ShareableUrl && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-blue-800 mb-1">Share Your Result</h4>
                              <p className="text-xs text-blue-600 break-all">{task2ShareableUrl}</p>
                            </div>
                            <Button
                              onClick={() => copyUrlToClipboard(task2ShareableUrl, 'task2')}
                              size="sm"
                              variant="outline"
                              className="ml-2 flex items-center gap-1 text-xs"
                            >
                              {copiedUrl === 'task2' ? (
                                <><Check className="w-3 h-3" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model Answers Section */}
        <div className="mt-8 sm:mt-12 flex flex-col items-center space-y-4 sm:space-y-6">
          {submissionStatus && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base">
              {submissionStatus}
            </div>
          )}

          <Button 
            onClick={() => setShowModelAnswers(!showModelAnswers)} 
            variant="outline"
            className="border-2 border-gray-400 hover:border-gray-600 px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105"
          >
            {showModelAnswers ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
            <strong>
              <span className="hidden sm:inline">{showModelAnswers ? 'Hide Model Answers' : 'Show Model Answers'}</span>
              <span className="sm:hidden">{showModelAnswers ? 'Hide Answers' : 'Show Answers'}</span>
            </strong>
          </Button>
        </div>

        {showModelAnswers && (task1ModelAnswer || task2ModelAnswer) && (
          <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
            {task1ModelAnswer && (
              <Card className="bg-blue-50 border-blue-200 shadow-lg">
                <CardHeader className="bg-blue-600 text-white">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Book className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <strong>
                      <span className="hidden sm:inline">Model Answer: Task 1</span>
                      <span className="sm:hidden">Model: Task 1</span>
                    </strong>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-gray-800 bg-white p-3 sm:p-4 rounded-lg border">
                    {task1ModelAnswer}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {task2ModelAnswer && (
              <Card className="bg-indigo-50 border-indigo-200 shadow-lg">
                <CardHeader className="bg-indigo-600 text-white">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <BookOpenCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <strong>
                      <span className="hidden sm:inline">Model Answer: Task 2</span>
                      <span className="sm:hidden">Model: Task 2</span>
                    </strong>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-gray-800 bg-white p-3 sm:p-4 rounded-lg border">
                    {task2ModelAnswer}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
