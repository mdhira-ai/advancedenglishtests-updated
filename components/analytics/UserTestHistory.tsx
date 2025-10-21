'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface UserTestHistoryProps {
  book: string
  module: string
  testNumber: number
}

interface TestResult {
  id: number
  score: number
  totalQuestions: number | null
  percentage: number | null
  ieltsBandScore: number | null
  timeTaken: number | null
  createdAt: string
}

interface TestHistoryData {
  attempts: number
  bestScore: number | null
  testHistory: TestResult[]
}

export function UserTestHistory({ book, module, testNumber }: UserTestHistoryProps) {
  const { data: session } = useSession()
  const [historyData, setHistoryData] = useState<TestHistoryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!session?.user?.id) {
        setLoading(false)
        return
      }

      try {
        const userId = session.user.id
        
        console.log('Fetching test history for:', { book, module, testNumber, userId })

        // Get user's test history for this specific test
        // Use actual database field names (snake_case) since we're querying via Supabase
        let { data: userTestHistory, error } = await supabase
          .from('test_scores')
          .select('*')
          .eq('book', book)
          .eq('module', module)
          .eq('test_number', testNumber)
          .eq('userId', userId)
          .order('createdAt', { ascending: false })

        console.log('Supabase query result:', { userTestHistory, error })

        if (error) {
          console.error('Error fetching user test history:', error)
          return
        }

        if (userTestHistory && userTestHistory.length > 0) {
          // Get user's best score for this test
          const bestScore = Math.max(...userTestHistory.map(test => test.score))

          // Convert data to match the interface - use actual database field names
          const testHistory = userTestHistory.slice(0, 10).map(test => ({
            id: Number(test.id),
            score: test.score,
            totalQuestions: test.total_questions,
            percentage: test.percentage,
            ieltsBandScore: test.ielts_band_score,
            timeTaken: test.time_taken,
            createdAt: test.createdAt
          }))

          setHistoryData({
            attempts: userTestHistory.length,
            bestScore,
            testHistory
          })
        } else {
          setHistoryData({
            attempts: 0,
            bestScore: null,
            testHistory: []
          })
        }
      } catch (error) {
        console.error('Error fetching test history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [book, module, testNumber, session?.user?.id])

  // Don't show anything for anonymous users
  if (!session?.user) {
    return null
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!historyData || historyData.attempts === 0) {
    return (
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-blue-800">
            📈 Your Test History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            This is your first attempt at this test. Complete the test to see your results and track your progress!
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime2 = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          📈 Your Test History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Best Score Display */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-yellow-700 font-medium">🏆 Best Score</div>
              <div className="text-2xl font-bold text-yellow-800">
                {historyData.bestScore}/{historyData.testHistory[0]?.totalQuestions || 40}
              </div>
              {historyData.testHistory.find(t => t.score === historyData.bestScore)?.ieltsBandScore && (
                <div className="text-sm text-yellow-700">
                  IELTS Band: {historyData.testHistory.find(t => t.score === historyData.bestScore)?.ieltsBandScore}
                </div>
              )}
            </div>
            <div className="text-right">
              {historyData.testHistory.find(t => t.score === historyData.bestScore) && (
                <>
                  <div className="text-sm text-yellow-700">
                    {formatDate(historyData.testHistory.find(t => t.score === historyData.bestScore)!.createdAt)}
                  </div>
                  <div className="text-xs text-yellow-600">
                    ⏱ {formatTime(historyData.testHistory.find(t => t.score === historyData.bestScore)!.timeTaken)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Attempts */}
        <div>
          <h4 className="font-semibold mb-3 text-gray-700">
            Recent Attempts ({historyData.attempts})
          </h4>
          <div className="space-y-3">
            {historyData.testHistory.slice(0, 3).map((attempt, index) => (
              <div 
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div>
                  <div className="font-semibold text-gray-800">
                    Attempt {index + 1}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(attempt.createdAt)} at {formatTime2(attempt.createdAt)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-800">
                    {attempt.score}/{attempt.totalQuestions || 40}
                  </div>
                  {attempt.ieltsBandScore && (
                    <div className="text-sm text-red-600 font-medium">
                      Band: {attempt.ieltsBandScore}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    ⏱ {formatTime(attempt.timeTaken)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {historyData.attempts > 3 && (
            <div className="text-center mt-3">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All {historyData.attempts} Attempts
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}