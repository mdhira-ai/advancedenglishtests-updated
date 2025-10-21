'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, Edit3, MessageSquare, Users, Upload, X, Image, Search, BookOpen, Filter, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import WordCounter from '@/components/utils/WordCounter'
import { useSession } from '@/lib/auth-client'
import { supabase } from '@/lib/supabase'

import { cambridgeWritingTasks, filterTasksByType, searchTasks, getUniqueBooks, getUniqueCategories, type WritingTask } from '@/data/cambridgeWritingTasks'


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

export default function WritingCheck() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession()
  
  // Task configuration states
  const [task1Question, setTask1Question] = useState('')
  const [task2Question, setTask2Question] = useState('')
  const [isConfiguring, setIsConfiguring] = useState(true)
  
  // Image upload states
  const [task1Image, setTask1Image] = useState<string | null>(null)
  const [task1ImageFile, setTask1ImageFile] = useState<File | null>(null)
  
  // Cambridge tasks search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCambridgeTasks, setShowCambridgeTasks] = useState(false)
  const [currentTaskType, setCurrentTaskType] = useState<'task1' | 'task2'>('task1')
  const [filteredTasks, setFilteredTasks] = useState<WritingTask[]>([])
  
  // Answer states
  const [task1Answer, setTask1Answer] = useState('')
  const [task2Answer, setTask2Answer] = useState('')
  
  // Evaluation states
  const [task1Evaluation, setTask1Evaluation] = useState<any>(null)
  const [task2Evaluation, setTask2Evaluation] = useState<any>(null)
  const [isEvaluatingTask1, setIsEvaluatingTask1] = useState(false)
  const [isEvaluatingTask2, setIsEvaluatingTask2] = useState(false)
  
  // Cooldown states for feedback buttons (1 minute = 60 seconds)
  const [task1CooldownTime, setTask1CooldownTime] = useState(0)
  const [task2CooldownTime, setTask2CooldownTime] = useState(0)
  const [isTask1OnCooldown, setIsTask1OnCooldown] = useState(false)
  const [isTask2OnCooldown, setIsTask2OnCooldown] = useState(false)
  
  // Timer states
  const [isWritingMode, setIsWritingMode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false)
  
  // Active users states
  const [activeUsers, setActiveUsers] = useState(1)
  const [isUserCountVisible, setIsUserCountVisible] = useState(true)
  
  // URL sharing states
  const [task1ShareableUrl, setTask1ShareableUrl] = useState<string | null>(null)
  const [task2ShareableUrl, setTask2ShareableUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  
  // Registration modal states

  


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



  // Filter and search Cambridge tasks
  useEffect(() => {
    let tasks = cambridgeWritingTasks;
    
    // Filter by task type
    tasks = filterTasksByType(tasks, currentTaskType);
    
    // Filter by book
    if (selectedBook !== 'all') {
      tasks = tasks.filter(task => task.book === selectedBook);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      tasks = tasks.filter(task => task.category === selectedCategory);
    }
    
    // Search
    tasks = searchTasks(tasks, searchQuery);
    
    setFilteredTasks(tasks);
  }, [searchQuery, selectedBook, selectedCategory, currentTaskType]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTimerActive, timeLeft])

  // Task 1 cooldown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTask1OnCooldown && task1CooldownTime > 0) {
      interval = setInterval(() => {
        setTask1CooldownTime(prevTime => {
          const newTime = prevTime - 1
          if (newTime <= 0) {
            setIsTask1OnCooldown(false)
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTask1OnCooldown, task1CooldownTime])

  // Task 2 cooldown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTask2OnCooldown && task2CooldownTime > 0) {
      interval = setInterval(() => {
        setTask2CooldownTime(prevTime => {
          const newTime = prevTime - 1
          if (newTime <= 0) {
            setIsTask2OnCooldown(false)
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTask2OnCooldown, task2CooldownTime])

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

  // Format cooldown time for display (just seconds)
  const formatCooldownTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  const handleStartWriting = () => {
    if (!task1Question.trim() && !task2Question.trim()) {
      alert('Please enter at least one task question before starting.')
      return
    }
    setIsConfiguring(false)
    setIsWritingMode(true)
    // Don't auto-start timer, let user start it manually
  }

  const handleToggleTimer = () => {
    setIsTimerActive(!isTimerActive)
  }

  const handleResetTimer = () => {
    setTimeLeft(60 * 60)
    setIsTimerActive(false)
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

  // Evaluation API function
  const evaluateEssay = async (question: string, answer: string) => {
    const prompt = `Q: ${question}\n\nAns: ${answer}`;
    console.log( prompt);
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

      // Start 1-minute cooldown after successful evaluation
      setTask1CooldownTime(60); // 60 seconds = 1 minute
      setIsTask1OnCooldown(true);

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

      // Start 1-minute cooldown after successful evaluation
      setTask2CooldownTime(60); // 60 seconds = 1 minute
      setIsTask2OnCooldown(true);

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



  const handleReset = () => {
    setIsConfiguring(true)
    setIsWritingMode(false)
    setTask1Answer('')
    setTask2Answer('')
    setTask1Evaluation(null)
    setTask2Evaluation(null)
    setTask1ShareableUrl(null)
    setTask2ShareableUrl(null)
    setCopiedUrl(null)
    setIsTimerActive(false)
    setTimeLeft(60 * 60)
    setTask1Image(null)
    setTask1ImageFile(null)
    setShowCambridgeTasks(false)
    setSearchQuery('')
    setSelectedBook('all')
    setSelectedCategory('all')
    // Reset cooldown states
    setTask1CooldownTime(0)
    setTask2CooldownTime(0)
    setIsTask1OnCooldown(false)
    setIsTask2OnCooldown(false)
    // Reset file input
    const fileInput = document.getElementById('task1-image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const selectCambridgeTask = (task: WritingTask) => {
    if (task.type === 'task1') {
      setTask1Question(task.question)
      if (task.imagePath) {
        setTask1Image(task.imagePath)
        setTask1ImageFile(null) // Clear uploaded file as we're using Cambridge image
      }
    } else {
      setTask2Question(task.question)
    }
    setShowCambridgeTasks(false)
  }

  const openCambridgeTaskBrowser = (taskType: 'task1' | 'task2') => {
    setCurrentTaskType(taskType)
    setShowCambridgeTasks(true)
  }

  const closeCambridgeTaskBrowser = () => {
    setShowCambridgeTasks(false)
    setSearchQuery('')
    setSelectedBook('all')
    setSelectedCategory('all')
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, JPEG, GIF, etc.)')
        return
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      setTask1ImageFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setTask1Image(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setTask1Image(null)
    setTask1ImageFile(null)
    // Reset file input
    const fileInput = document.getElementById('task1-image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  if (isConfiguring) {
    return (
      <div className="min-h-screen bg-gray-50 p-20 px-0">
        {/* Visitor Tracking Component */}
        
        <style dangerouslySetInnerHTML={{ __html: evaluationStyles }} />
        <div className="py-2 sm:py-4 lg:py-8">
        {/* Cambridge Tasks Browser Modal */}
        {showCambridgeTasks && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="bg-[#1A3A6E] text-white p-3 sm:p-4 lg:p-6 flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold">
                    Cambridge IELTS {currentTaskType === 'task1' ? 'Task 1' : 'Task 2'} Questions
                  </h2>
                </div>
                <Button 
                  onClick={closeCambridgeTaskBrowser}
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-6">
                {/* Search and Filter Controls */}
                <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                        <Input
                          placeholder="Search questions by keywords, topics, or chart types..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 sm:pl-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <select
                        value={selectedBook}
                        onChange={(e) => setSelectedBook(e.target.value)}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Books</option>
                        {getUniqueBooks(cambridgeWritingTasks).map(book => (
                          <option key={book} value={book}>{book}</option>
                        ))}
                      </select>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Categories</option>
                        {getUniqueCategories(cambridgeWritingTasks).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Found {filteredTasks.length} {currentTaskType === 'task1' ? 'Task 1' : 'Task 2'} questions
                  </div>
                </div>

                {/* Tasks List */}
                <div className="max-h-[60vh] overflow-y-auto space-y-2 sm:space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                      <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">No tasks found matching your criteria</p>
                      <p className="text-xs sm:text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredTasks.map((task, index) => (
                      <Card 
                        key={task.id} 
                        className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => selectCambridgeTask(task)}
                      >
                        <CardContent className="p-2 sm:p-3 lg:p-4">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            {task.imagePath && (
                              <div className="flex-shrink-0">
                                <img
                                  src={task.imagePath}
                                  alt={`${task.book} ${task.test} Task 1`}
                                  className="w-full sm:w-24 lg:w-32 h-16 sm:h-16 lg:h-20 object-cover rounded border group-hover:border-blue-300 transition-colors"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded transition-colors">
                                    {task.book}
                                  </span>
                                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{task.test}</span>
                                  {task.category && (
                                    <span className="text-xs text-gray-500 bg-gray-100 group-hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors">
                                      {task.category}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-blue-600 group-hover:text-blue-700 font-medium transition-colors">
                                  Click to select →
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors line-clamp-3">
                                {task.question}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="max-w-6xl mx-auto px-2 sm:px-3 lg:px-4">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <Link href="/" className="inline-flex items-center text-[#1A3A6E] hover:text-[#142d57] mb-3 sm:mb-4 lg:mb-6 transition-colors text-sm sm:text-base">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back to Home
            </Link>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#1A3A6E] mb-1 sm:mb-2 lg:mb-3">
                IELTS Writing Practice
              </h1>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 mb-1 sm:mb-2">Create your custom writing practice session</p>
              <p className="text-xs sm:text-sm lg:text-base text-gray-500">Set up your Task 1 and Task 2 questions to begin</p>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:gap-8 lg:grid-cols-2">
            {/* Task 1 Configuration */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-[#1A3A6E] text-white rounded-t-lg p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  Writing Task 1
                </CardTitle>
                <p className="text-blue-100 text-xs sm:text-sm">Academic Writing | 150+ words | 20 minutes</p>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Task 1 Question
                  </label>
                  <Textarea
                    placeholder="Enter your Task 1 question here (charts, diagrams, processes, etc.)"
                    className="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] text-xs sm:text-sm lg:text-base border-2 border-blue-100 focus:border-blue-300 transition-colors resize-none"
                    value={task1Question}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTask1Question(e.target.value)}
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Upload Chart/Graph/Table Image (Optional)
                  </label>
                  
                  {!task1Image ? (
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-3 sm:p-4 lg:p-6 text-center hover:border-blue-300 transition-colors">
                      <input
                        id="task1-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="task1-image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-1 sm:space-y-2"
                      >
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                        <span className="text-xs sm:text-sm text-blue-600 font-medium">Click to upload image</span>
                        <span className="text-xs text-gray-500">PNG, JPG, JPEG, GIF (max 5MB)</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border-2 border-blue-200 rounded-lg overflow-hidden">
                      <img
                        src={task1Image}
                        alt="Task 1 Visual"
                        className="w-full h-auto max-h-64 sm:max-h-80 object-contain bg-white"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center space-x-1">
                        <Image className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span>{task1ImageFile?.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 lg:mb-3">Quick Fill Options:</p>
                  <div className="space-y-1 sm:space-y-2 mb-3">
                    {/* Cambridge Books Browser Button */}
                    <Button
                      onClick={() => openCambridgeTaskBrowser('task1')}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-2 sm:p-3 text-xs hover:bg-green-50 border-green-200 border-2"
                    >
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0 text-green-600" />
                      <div className="text-left">
                        <div className="font-semibold text-green-700">Browse Cambridge IELTS Task 1 Questions</div>
                        <div className="text-xs text-green-600 mt-0.5">Official questions with charts, graphs, tables & diagrams</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task 2 Configuration */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-[#ff8c42] text-white rounded-t-lg p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  Writing Task 2
                </CardTitle>
                <p className="text-purple-100 text-xs sm:text-sm">Essay Writing | 250+ words | 40 minutes</p>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Task 2 Question
                  </label>
                  <Textarea
                    placeholder="Enter your Task 2 question here (opinion, discussion, problem-solution, etc.)"
                    className="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] text-xs sm:text-sm lg:text-base border-2 border-purple-100 focus:border-purple-300 transition-colors resize-none"
                    value={task2Question}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTask2Question(e.target.value)}
                  />
                </div>
                
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 lg:mb-3">Quick Fill Options:</p>
                  <div className="space-y-1 sm:space-y-2 mb-3">
                    {/* Cambridge Books Browser Button */}
                    <Button
                      onClick={() => openCambridgeTaskBrowser('task2')}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-2 sm:p-3 text-xs hover:bg-green-50 border-green-200 border-2"
                    >
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0 text-green-600" />
                      <div className="text-left">
                        <div className="font-semibold text-green-700">Browse Cambridge IELTS Task 2 Questions</div>
                        <div className="text-xs text-green-600 mt-0.5">Official essay questions from all Cambridge books</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
            <Button 
              onClick={handleStartWriting}
              className="bg-[#1A3A6E] hover:bg-[#142d57] text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg font-medium shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
              disabled={!task1Question.trim() && !task2Question.trim()}
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
              Start Writing Practice
            </Button>
            {(!task1Question.trim() && !task2Question.trim()) && (
              <p className="text-xs sm:text-sm text-red-500 mt-2 px-2">Please enter at least one task question</p>
            )}
            {(task1Question.trim() || task2Question.trim()) && (
              <p className="text-xs sm:text-sm text-[#1A3A6E] mt-2 px-2">
                Ready to practice: {task1Question.trim() ? 'Task 1' : ''} {task1Question.trim() && task2Question.trim() ? '& ' : ''} {task2Question.trim() ? 'Task 2' : ''}
              </p>
            )}
          </div>
        </div>
        </div>
        

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-20 px-0">
      {/* Visitor Tracking Component */}
      
      <style dangerouslySetInnerHTML={{ __html: evaluationStyles }} />
      <div className="py-2 sm:py-4 lg:py-8">
      {isUserCountVisible && (
        <div className="fixed bottom-2 md:bottom-4 right-2 md:right-4 z-50">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200">
            <div className="px-3 md:px-4 py-1 flex items-center space-x-2 md:space-x-3">
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
      <div className="max-w-6xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <Button 
                onClick={handleReset}
                variant="outline" 
                className="self-start border-gray-300 hover:bg-gray-50 text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                New Session
              </Button>
              
              <div className="text-center flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1">Writing Practice Session</h1>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Complete your tasks and get instant feedback</p>
              </div>
              
              <div className="flex items-center space-x-2 sm:self-start">
                <div className="text-xs text-gray-500 hidden sm:block">Manual timer control</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <Card className={`mb-3 sm:mb-4 lg:mb-6 border-0 shadow-md ${timeLeft <= 300 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex flex-col space-y-2 sm:space-y-3 lg:space-y-0 lg:flex-row items-center justify-between lg:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                <div className="text-center">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Time Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">60:00</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Time</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3 w-full lg:w-auto">
                <div className="flex items-center space-x-2 w-full lg:w-auto">
                  {!isTimerActive ? (
                    <Button
                      onClick={handleToggleTimer}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 font-medium text-xs sm:text-sm lg:text-base flex-1 lg:flex-none"
                    >
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Start Timer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleToggleTimer}
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base flex-1 lg:flex-none"
                    >
                      Pause Timer
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleResetTimer}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    Reset
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isTimerActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={isTimerActive ? "text-green-600 font-medium" : "text-gray-500"}>
                    {isTimerActive ? "Running" : "Stopped"}
                  </span>
                </div>
              </div>
            </div>
            
            {!isTimerActive && timeLeft === 60 * 60 && (
              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 bg-blue-100 rounded-lg text-xs sm:text-sm text-blue-800">
                <p className="font-semibold">Ready to start your writing practice!</p>
                <p className="mt-1">Click "Start Timer" when you're ready to begin. You'll have 60 minutes to complete your task(s).</p>
              </div>
            )}
            
            {timeLeft <= 300 && timeLeft > 0 && isTimerActive && (
              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 bg-red-100 rounded-lg text-xs sm:text-sm text-red-800">
                <p className="font-semibold">⚠️ Warning: Less than 5 minutes remaining!</p>
                <p className="mt-1">Please wrap up your writing and review your answers.</p>
              </div>
            )}
            
            {timeLeft === 0 && (
              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 bg-gray-100 rounded-lg text-xs sm:text-sm text-gray-800">
                <p className="font-semibold">⏰ Time's up!</p>
                <p className="mt-1">Your 60-minute practice session has ended. You can still continue writing or evaluate your work.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vertical layout for tasks and evaluations */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Task 1 Section */}
          {task1Question.trim() && (
            <div className="space-y-4 sm:space-y-6">
              {/* Task 1 Question and Answer */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-[#1A3A6E] text-white p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                    Writing Task 1
                  </CardTitle>
                  <p className="text-blue-100 text-xs sm:text-sm">150+ words | 20 minutes recommended</p>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 lg:p-4 xl:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="bg-blue-50 p-2 sm:p-3 lg:p-4 rounded-lg border-l-4 border-blue-400">
                    <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1 sm:mb-2">Question:</p>
                    <p className="text-blue-700 leading-relaxed text-xs sm:text-sm lg:text-base break-words">{task1Question}</p>
                  </div>

                  {/* Display uploaded image if available */}
                  {task1Image && (
                    <div className="bg-white p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-blue-200">
                      <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1 sm:mb-2">Visual Reference:</p>
                      <div className="relative">
                        <img
                          src={task1Image}
                          alt="Task 1 Visual Reference"
                          className="w-full h-auto max-h-64 sm:max-h-80 lg:max-h-96 object-contain bg-gray-50 rounded border"
                        />
                        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center space-x-1">
                          <Image className="w-2 h-2 sm:w-3 sm:h-3" />
                          <span>{task1ImageFile?.name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Textarea
                    placeholder="Type your Task 1 answer here..."
                    className="min-h-[150px] sm:min-h-[180px] lg:min-h-[220px] xl:min-h-[300px] text-xs sm:text-sm lg:text-base border-2 border-blue-100 focus:border-blue-300 transition-colors resize-none"
                    value={task1Answer}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTask1Answer(e.target.value)}
                  />
                  
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center gap-2">
                    <WordCounter text={task1Answer} minWords={150} />
                    <Button 
                      onClick={handleTask1Evaluation} 
                      disabled={isEvaluatingTask1 || !task1Answer.trim() || isTask1OnCooldown}
                      className={`${
                        isTask1OnCooldown 
                          ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white text-xs sm:text-sm lg:text-base w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2`}
                    >
                      {isEvaluatingTask1 
                        ? 'Evaluating...' 
                        : isTask1OnCooldown 
                          ? `Wait ${formatCooldownTime(task1CooldownTime)}`
                          : 'Get Feedback'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task 1 Evaluation Result */}
              {task1Evaluation && (
                <Card className="bg-gray-50 border-gray-200 border-2">
                  <CardHeader className="pb-1 sm:pb-2 lg:pb-3 p-2 sm:p-3 lg:p-4">
                    <CardTitle className="text-[#1A3A6E] text-sm sm:text-base lg:text-lg">Task 1 Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-2 sm:p-3 lg:p-4">
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-xs sm:text-sm lg:text-base leading-relaxed text-gray-800 break-words">
                          {formatEvaluationText(task1Evaluation.text) || JSON.stringify(task1Evaluation, null, 2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Shareable URL Section */}
                    {task1ShareableUrl && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 mb-1">Share Your Evaluation</p>
                            <p className="text-xs text-blue-600 mb-2">Copy this link to share your Task 1 evaluation with others</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={task1ShareableUrl}
                                readOnly
                                className="flex-1 text-xs px-2 py-1 bg-white border border-blue-200 rounded text-blue-700 focus:outline-none"
                              />
                              <Button
                                onClick={() => copyUrlToClipboard(task1ShareableUrl, 'task1')}
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              >
                                {copiedUrl === 'task1' ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Task 2 Section */}
          {task2Question.trim() && (
            <div className="space-y-4 sm:space-y-6">
              {/* Task 2 Question and Answer */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-[#ff8c42] text-white p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                    Writing Task 2
                  </CardTitle>
                  <p className="text-purple-100 text-xs sm:text-sm">250+ words | 40 minutes recommended</p>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 lg:p-4 xl:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="bg-purple-50 p-2 sm:p-3 lg:p-4 rounded-lg border-l-4 border-purple-400">
                    <p className="text-xs sm:text-sm font-medium text-purple-800 mb-1 sm:mb-2">Question:</p>
                    <p className="text-purple-700 leading-relaxed text-xs sm:text-sm lg:text-base break-words">{task2Question}</p>
                  </div>
                  
                  <Textarea
                    placeholder="Type your Task 2 answer here..."
                    className="min-h-[150px] sm:min-h-[180px] lg:min-h-[220px] xl:min-h-[300px] text-xs sm:text-sm lg:text-base border-2 border-purple-100 focus:border-purple-300 transition-colors resize-none"
                    value={task2Answer}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTask2Answer(e.target.value)}
                  />
                  
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center gap-2">
                    <WordCounter text={task2Answer} minWords={250} />
                    <Button 
                      onClick={handleTask2Evaluation} 
                      disabled={isEvaluatingTask2 || !task2Answer.trim() || isTask2OnCooldown}
                      className={`${
                        isTask2OnCooldown 
                          ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      } text-white text-xs sm:text-sm lg:text-base w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2`}
                    >
                      {isEvaluatingTask2 
                        ? 'Evaluating...' 
                        : isTask2OnCooldown 
                          ? `Wait ${formatCooldownTime(task2CooldownTime)}`
                          : 'Get Feedback'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task 2 Evaluation Result */}
              {task2Evaluation && (
                <Card className="bg-gray-50 border-gray-200 border-2">
                  <CardHeader className="pb-1 sm:pb-2 lg:pb-3 p-2 sm:p-3 lg:p-4">
                    <CardTitle className="text-[#1A3A6E] text-sm sm:text-base lg:text-lg">Task 2 Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-2 sm:p-3 lg:p-4">
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-xs sm:text-sm lg:text-base leading-relaxed text-gray-800 break-words">
                          {formatEvaluationText(task2Evaluation.text) || JSON.stringify(task2Evaluation, null, 2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Shareable URL Section */}
                    {task2ShareableUrl && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 mb-1">Share Your Evaluation</p>
                            <p className="text-xs text-blue-600 mb-2">Copy this link to share your Task 2 evaluation with others</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={task2ShareableUrl}
                                readOnly
                                className="flex-1 text-xs px-2 py-1 bg-white border border-blue-200 rounded text-blue-700 focus:outline-none"
                              />
                              <Button
                                onClick={() => copyUrlToClipboard(task2ShareableUrl, 'task2')}
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              >
                                {copiedUrl === 'task2' ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <Card className="mt-4 sm:mt-6 lg:mt-8 border-0 shadow-md bg-gray-50">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 lg:mb-4 text-sm sm:text-base lg:text-lg">Writing Tips & Instructions</h3>
            <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2 text-xs sm:text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">Task 1 Guidelines:</h4>
                <ul className="space-y-0.5 sm:space-y-1 list-disc list-inside text-xs sm:text-sm">
                  <li>Write at least 150 words</li>
                  <li>Spend about 20 minutes on this task</li>
                  <li>Describe the visual information objectively</li>
                  <li>Include an overview with main trends</li>
                  <li>Use appropriate vocabulary for data description</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">Task 2 Guidelines:</h4>
                <ul className="space-y-0.5 sm:space-y-1 list-disc list-inside text-xs sm:text-sm">
                  <li>Write at least 250 words</li>
                  <li>Spend about 40 minutes on this task</li>
                  <li>Present a clear position on the topic</li>
                  <li>Support your ideas with examples</li>
                  <li>Use a variety of sentence structures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      

    </div>
  )
}
