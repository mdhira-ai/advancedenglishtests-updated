'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface TestStatisticsProps {
  book: string
  module: string
  testNumber: number
}

interface TestStatistics {
  totalViews: number
  totalAttempts: number
  userSpecificData?: {
    attempts: number
    bestScore: number | null
    testHistory: Array<{
      id: number
      score: number
      totalQuestions: number | null
      percentage: number | null
      ieltsBandScore: number | null
      timeTaken: number | null
      createdAt: string
    }>
  } | null
}

export function TestStatistics({ book, module, testNumber }: TestStatisticsProps) {
  const { data: session } = useSession()
  const [statistics, setStatistics] = useState<TestStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        console.log('Fetching statistics for:', { book, module, testNumber, userId: session?.user?.id })
        
        // Get total views from daily_test_clicks table
        const { data: clicksData, error: clicksError } = await supabase
          .from('daily_test_clicks')
          .select('click_count')
          .eq('book', book)
          .eq('module', module)
          .eq('test_number', testNumber)

        if (clicksError) {
          console.error('Error fetching clicks:', {
            error: clicksError,
            message: clicksError.message,
            details: clicksError.details,
            hint: clicksError.hint,
            code: clicksError.code,
            book,
            module,
            testNumber
          })
        }

        const totalViews = clicksData?.reduce((sum, record) => sum + (record.click_count || 0), 0) || 0

        // Get total unique attempts (from test_scores)
        const { count: totalAttempts, error: attemptsError } = await supabase
          .from('test_scores')
          .select('*', { count: 'exact', head: true })
          .eq('book', book)
          .eq('module', module)
          .eq('test_number', testNumber)

        if (attemptsError) {
          console.error('Error fetching attempts:', {
            error: attemptsError,
            message: attemptsError.message,
            details: attemptsError.details,
            hint: attemptsError.hint,
            code: attemptsError.code,
            book,
            module,
            testNumber
          })
        }

        // Get user-specific data if logged in
        let userSpecificData = null
        if (session?.user?.id) {
          const userId = session.user.id

          // Get user's test history for this specific test
          const { data: userTestHistory, error: historyError } = await supabase
            .from('test_scores')
            .select('*')
            .eq('book', book)
            .eq('module', module)
            .eq('test_number', testNumber)
            .eq('userId', userId)
            .order('createdAt', { ascending: false })

          if (historyError) {
            console.error('Error fetching user history:', {
              error: historyError,
              message: historyError.message,
              details: historyError.details,
              hint: historyError.hint,
              code: historyError.code,
              userId,
              book,
              module,
              testNumber
            })
          } else if (userTestHistory) {
            // Get user's best score for this test
            const bestScore = userTestHistory.length > 0 
              ? Math.max(...userTestHistory.map(test => test.score || 0))
              : null

            // Get user's total attempts count for this test
            const userAttempts = userTestHistory.length

            userSpecificData = {
              attempts: userAttempts,
              bestScore,
              testHistory: userTestHistory.slice(0, 10).map(test => ({
                id: Number(test.id) || 0,
                score: test.score || 0,
                totalQuestions: test.totalQuestions || null,
                percentage: test.percentage || null,
                ieltsBandScore: test.ieltsBandScore || null,
                timeTaken: test.timeTaken || null,
                createdAt: test.createdAt || ''
              }))
            }
            
            console.log('User specific data retrieved:', userSpecificData)
          } else {
            console.log('No user test history found, but no error occurred')
          }
        }

        setStatistics({
          totalViews,
          totalAttempts: totalAttempts || 0,
          userSpecificData,
        })
      } catch (error) {
        console.error('Error fetching test statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [book, module, testNumber, session?.user?.id])

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!statistics) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          📊 Test Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Total Views */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.totalViews}
            </div>
            <div className="text-sm text-blue-700 font-medium">Total Views</div>
            <div className="text-xs text-blue-600">All-time test access count</div>
          </div>

          {/* Total Attempts */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {statistics.totalAttempts}
            </div>
            <div className="text-sm text-green-700 font-medium">Total Attempts</div>
            <div className="text-xs text-green-600">All-time test completion count</div>
          </div>
        </div>

        {/* User-specific statistics for logged-in users */}
        {session?.user && statistics.userSpecificData && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-gray-700">Your Progress</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {statistics.userSpecificData.attempts}
                </div>
                <div className="text-xs text-purple-700">Your Attempts</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {statistics.userSpecificData.bestScore || 'N/A'}
                </div>
                <div className="text-xs text-yellow-700">Best Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Sign in prompt for anonymous users */}
        {!session?.user && (
          <div className="border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-gray-500 mb-2">
                👤 Track Your Progress
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Sign in to save your test scores and track your improvement over time.
              </p>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}