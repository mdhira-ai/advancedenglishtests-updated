'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IELTSBandDisplay from './IELTSBandDisplay';

interface TestScore {
  id: string;
  userId: string | null;
  book: string;
  module: string;
  testNumber: number;
  score: number;
  totalQuestions?: number | null;
  percentage: number | null;
  ieltsBandScore: number | null;
  timeTaken: number | null;
  createdAt: string;
  updatedAt: string;
}

interface UserOverallStats {
  userId: string;
  email: string;
  name: string;
  gender: string | null;
  userSince: Date;
  totalTestsTaken: number | null;
  avgIeltsScore: number | null;
  bestIeltsScore: number | null;
  uniqueTestsAttempted: number | null;
  firstTestDate: Date | null;
  latestTestDate: Date | null;
}

interface UserTestResultsProps {
  userId?: string;
  testScores?: TestScore[];
  userStats?: UserOverallStats;
}

export default function UserTestResults({ userId, testScores = [], userStats }: UserTestResultsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Since we're now receiving data as props, we don't need to fetch from API
    setLoading(false);
  }, [testScores, userStats]);

  // Process test scores to calculate attempts and summary data
  const processTestData = () => {
    if (!testScores.length || !userStats) {
      return {
        summary: {
          totalTestsTaken: 0,
          avgIeltsScore: 0,
          bestIeltsScore: 0,
          uniqueTestsAttempted: 0,
          firstTestDate: null,
          latestTestDate: null
        },
        attempts: [],
        recentTests: []
      };
    }

    // Group tests by unique combination of book, module, and test number
    const testGroups = new Map<string, TestScore[]>();
    
    testScores.forEach(test => {
      // Use a more reliable separator that won't conflict with book names
      // Also ensure testNumber is valid
      const testNum = test.testNumber || 0;
      const key = `${test.book}|${test.module}|${testNum}`;
      if (!testGroups.has(key)) {
        testGroups.set(key, []);
      }
      testGroups.get(key)!.push(test);
    });

    // Calculate attempts data
    const attempts = Array.from(testGroups.entries()).map(([key, tests]) => {
      const [book, module, testNumber] = key.split('|');
      
      const bestTest = tests.reduce((best, current) => 
        (current.ieltsBandScore || 0) > (best.ieltsBandScore || 0) ? current : best
      );
      const latestTest = tests.reduce((latest, current) => 
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      );

      return {
        book,
        module,
        testNumber: parseInt(testNumber) || 0,
        attemptCount: tests.length,
        bestScore: bestTest.score,
        bestPercentage: bestTest.percentage || 0,
        bestIeltsScore: bestTest.ieltsBandScore || 0,
        latestAttempt: latestTest.createdAt
      };
    });

    // Sort attempts by latest attempt date (most recent first)
    attempts.sort((a, b) => new Date(b.latestAttempt).getTime() - new Date(a.latestAttempt).getTime());

    // Get recent tests (last 10 tests)
    const recentTests = [...testScores]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      summary: {
        totalTestsTaken: userStats.totalTestsTaken || 0,
        avgIeltsScore: userStats.avgIeltsScore || 0,
        bestIeltsScore: userStats.bestIeltsScore || 0,
        uniqueTestsAttempted: userStats.uniqueTestsAttempted || 0,
        firstTestDate: userStats.firstTestDate,
        latestTestDate: userStats.latestTestDate
      },
      attempts,
      recentTests
    };
  };

  const data = processTestData();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">Please log in to view your test results.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">Loading your test results...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalTestsTaken === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">No test results found. Take your first test to see results here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Your Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.totalTestsTaken}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.uniqueTestsAttempted}</div>
              <div className="text-sm text-gray-600">Unique Tests</div>
            </div>
            <div className="text-center">
              <IELTSBandDisplay score={data.summary.bestIeltsScore || 0} size="sm" />
              <div className="text-sm text-gray-600">Best IELTS Band</div>
            </div>
            <div className="text-center">
              <IELTSBandDisplay score={data.summary.avgIeltsScore || 0} size="sm" />
              <div className="text-sm text-gray-600">Avg IELTS Band</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Attempts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Test Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.attempts.map((attempt) => (
              <div key={`${attempt.book}|${attempt.module}|${attempt.testNumber}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {attempt.book.replace('-', ' ').toUpperCase()} - {attempt.module.charAt(0).toUpperCase() + attempt.module.slice(1)} Test {attempt.testNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {attempt.attemptCount} attempt{attempt.attemptCount > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <IELTSBandDisplay score={attempt.bestIeltsScore || 0} size="sm" showLabel={false} />
                  <div className="text-sm text-gray-600">
                    {attempt.bestScore}/40 ({attempt.bestPercentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {test.book.replace('-', ' ').toUpperCase()} - {test.module.charAt(0).toUpperCase() + test.module.slice(1)} Test {test.testNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(test.createdAt)} • {formatDuration(test.timeTaken)}
                  </div>
                </div>
                <div className="text-right">
                  <IELTSBandDisplay score={test.ieltsBandScore || 0} size="sm" showLabel={false} />
                  <div className="text-sm text-gray-600">
                    {test.score}/{test.totalQuestions} ({test.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
