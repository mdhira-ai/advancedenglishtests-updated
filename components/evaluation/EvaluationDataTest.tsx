import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface SpeakingEvaluation {
  id: string; // Changed from number to string for BigInt compatibility
  topic: string;
  recordingDuration: number; // Changed from recording_duration to match schema
  urlLink: string | null; // Changed from url_link and made nullable
  createdAt: string; // Changed from created_at to match schema
  questions: string;
  userAnswer: string;
  evaluationResponse: string;
}

interface WritingEvaluation {
  id: string; // Changed from number to string for BigInt compatibility
  taskType: string; // Changed from task_type to match schema
  question: string;
  wordCount: number | null; // Made nullable to match schema
  urlLink: string | null; // Changed from url_link and made nullable
  createdAt: string; // Changed from created_at to match schema
  userAnswer: string;
  evaluationResponse: string;
}

interface EvaluationTestProps {
  userId: string;
}

const EvaluationDataTest: React.FC<EvaluationTestProps> = ({ userId }) => {
  const [speakingData, setSpeakingData] = useState<{
    summary: any;
    evaluations: SpeakingEvaluation[];
  } | null>(null);
  
  const [writingData, setWritingData] = useState<{
    summary: any;
    evaluations: WritingEvaluation[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Helper function to format dates nicely
  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'None') return 'None';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Fetch speaking evaluations from Supabase
  const fetchSpeakingEvaluations = async () => {
    try {
      const { data: speakingEvaluations, error: speakingError } = await supabase
        .from('speaking_evaluation_data')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (speakingError) {
        console.error('Speaking evaluations error:', speakingError);
        throw new Error(`Speaking query failed: ${speakingError.message}`);
      }

      // Transform the data to match expected format
      const transformedEvaluations: SpeakingEvaluation[] = (speakingEvaluations || []).map(evaluation => ({
        id: evaluation.id.toString(), // Convert BigInt to string
        topic: evaluation.topic,
        recordingDuration: evaluation.recordingDuration,
        urlLink: evaluation.urlLink,
        createdAt: evaluation.createdAt,
        questions: evaluation.questions,
        userAnswer: evaluation.userAnswer,
        evaluationResponse: evaluation.evaluationResponse
      }));

      // Calculate summary
      const summary = {
        total_evaluations: transformedEvaluations.length,
        total_duration: transformedEvaluations.reduce((sum, evaluation) => sum + (evaluation.recordingDuration || 0), 0),
        avg_duration: transformedEvaluations.length > 0 
          ? transformedEvaluations.reduce((sum, evaluation) => sum + (evaluation.recordingDuration || 0), 0) / transformedEvaluations.length 
          : 0,
        total_minutes: Math.round(transformedEvaluations.reduce((sum, evaluation) => sum + (evaluation.recordingDuration || 0), 0) / 60),
        latest_evaluation: transformedEvaluations.length > 0 ? transformedEvaluations[0]?.createdAt : null
      };

      setSpeakingData({
        summary,
        evaluations: transformedEvaluations
      });

    } catch (error) {
      console.error('Error fetching speaking evaluations:', error);
      setError(`Speaking fetch error: ${error}`);
    }
  };

  // Fetch writing evaluations from Supabase
  const fetchWritingEvaluations = async () => {
    try {
      const { data: writingEvaluations, error: writingError } = await supabase
        .from('writing_evaluation_data')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (writingError) {
        console.error('Writing evaluations error:', writingError);
        throw new Error(`Writing query failed: ${writingError.message}`);
      }

      // Transform the data to match expected format
      const transformedEvaluations: WritingEvaluation[] = (writingEvaluations || []).map(evaluation => ({
        id: evaluation.id.toString(), // Convert BigInt to string
        taskType: evaluation.taskType,
        question: evaluation.question,
        wordCount: evaluation.wordCount,
        urlLink: evaluation.urlLink,
        createdAt: evaluation.createdAt,
        userAnswer: evaluation.userAnswer,
        evaluationResponse: evaluation.evaluationResponse
      }));

      // Calculate summary
      const task1Count = transformedEvaluations.filter(evaluation => evaluation.taskType === 'task1').length;
      const task2Count = transformedEvaluations.filter(evaluation => evaluation.taskType === 'task2').length;
      const avgWordCount = transformedEvaluations.length > 0
        ? transformedEvaluations.reduce((sum, evaluation) => sum + (evaluation.wordCount || 0), 0) / transformedEvaluations.length
        : 0;

      const summary = {
        total_evaluations: transformedEvaluations.length,
        task1_count: task1Count,
        task2_count: task2Count,
        avg_word_count: Math.round(avgWordCount),
        latest_evaluation: transformedEvaluations.length > 0 ? transformedEvaluations[0]?.createdAt : null
      };

      setWritingData({
        summary,
        evaluations: transformedEvaluations
      });

    } catch (error) {
      console.error('Error fetching writing evaluations:', error);
      setError(prev => prev ? `${prev}; Writing fetch error: ${error}` : `Writing fetch error: ${error}`);
    }
  };

  // Set up real-time subscriptions
  const setupSubscriptions = () => {
    const subs: any[] = [];

    // Subscribe to speaking_evaluation_data changes
    const speakingSubscription = supabase
      .channel(`speaking_evaluation_data_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_evaluation_data', filter: `userId=eq.${userId}` },
        (payload) => {
          fetchSpeakingEvaluations(); // Refetch data on change
        }
      )
      .subscribe();

    subs.push(speakingSubscription);

    // Subscribe to writing_evaluation_data changes
    const writingSubscription = supabase
      .channel(`writing_evaluation_data_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'writing_evaluation_data', filter: `userId=eq.${userId}` },
        (payload) => {
          fetchWritingEvaluations(); // Refetch data on change
        }
      )
      .subscribe();

    subs.push(writingSubscription);

    setSubscriptions(subs);
  };

  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch both types of evaluations
        await Promise.all([
          fetchSpeakingEvaluations(),
          fetchWritingEvaluations()
        ]);

        // Set up real-time subscriptions
        setupSubscriptions();

      } catch (error) {
        console.error('Error fetching evaluation data:', error);
        setError(`Fetch error: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [userId]);

  // Cleanup subscriptions when component unmounts
  useEffect(() => {
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [subscriptions]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Evaluation Data Test</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading evaluation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Evaluation Data Test</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Speaking Evaluations */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-green-700">Speaking Evaluations</h3>
        {speakingData ? (
          <div>
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">Summary:</h4>
              <ul className="text-sm space-y-1">
                <li>Total Evaluations: {speakingData.summary?.total_evaluations || 0}</li>
                <li>Total Duration: {speakingData.summary?.total_duration || 0} seconds</li>
                <li>Average Duration: {speakingData.summary?.avg_duration || 0} seconds</li>
                <li>Total Minutes: {speakingData.summary?.total_minutes || 0}</li>
                <li>Latest: {formatDate(speakingData.summary?.latest_evaluation)}</li>
              </ul>
            </div>
            
            {speakingData.evaluations && speakingData.evaluations.length > 0 ? (
              <div className="space-y-3">
                {speakingData.evaluations.map((evaluation, index) => (
                  <div key={evaluation.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{evaluation.topic}</h5>
                        <p className="text-sm text-gray-600">Duration: {evaluation.recordingDuration}s</p>
                        <p className="text-sm text-gray-500">
                          {new Date(evaluation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {evaluation.urlLink && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-4 bg-[#10b981] text-white border-[#10b981] hover:bg-[#059669] hover:border-[#059669]"
                            onClick={() => window.open(`/evaluation/speaking/${evaluation.urlLink}`, '_blank')}
                          >
                            View Result
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No speaking evaluations found</p>
            )}
          </div>
        ) : (
          <p className="text-red-500">Failed to load speaking data</p>
        )}
      </div>

      {/* Writing Evaluations */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-purple-700">Writing Evaluations</h3>
        {writingData ? (
          <div>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">Summary:</h4>
              <ul className="text-sm space-y-1">
                <li>Total Evaluations: {writingData.summary?.total_evaluations || 0}</li>
                <li>Task 1 Count: {writingData.summary?.task1_count || 0}</li>
                <li>Task 2 Count: {writingData.summary?.task2_count || 0}</li>
                <li>Average Word Count: {writingData.summary?.avg_word_count || 0}</li>
                <li>Latest: {formatDate(writingData.summary?.latest_evaluation)}</li>
              </ul>
            </div>
            
            {writingData.evaluations && writingData.evaluations.length > 0 ? (
              <div className="space-y-3">
                {writingData.evaluations.map((evaluation, index) => (
                  <div key={evaluation.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {evaluation.taskType.toUpperCase()}
                        </h5>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {evaluation.question.substring(0, 100)}...
                        </p>
                        <p className="text-sm text-gray-600">Words: {evaluation.wordCount}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(evaluation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {evaluation.urlLink && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-4 bg-[#10b981] text-white border-[#10b981] hover:bg-[#059669] hover:border-[#059669]"
                            onClick={() => window.open(`/evaluation/writing/${evaluation.urlLink}`, '_blank')}
                          >
                            View Result
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No writing evaluations found</p>
            )}
          </div>
        ) : (
          <p className="text-red-500">Failed to load writing data</p>
        )}
      </div>
    </div>
  );
};

export default EvaluationDataTest;