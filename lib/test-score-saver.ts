import { supabase } from './supabase';

export interface TestScoreData {
  book: string;
  module: string;
  testNumber: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  ieltsBandScore: number;
  timeTaken?: number;
  userId?: string | null;
}

/**
 * Simple function to save test scores to Supabase
 * Works for both logged in and logged out users
 * Based on the pattern used in SpeakingAIPage
 */
export const saveTestScore = async (
  testData: TestScoreData,
  session?: any
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const userId = session?.user?.id || null;
    
    console.log('Saving test score...', {
      book: testData.book,
      module: testData.module,
      testNumber: testData.testNumber,
      score: testData.score,
      userId: userId ? 'present' : 'null'
    });
    
    // Insert data into Supabase test_scores table
    // Use database field names (snake_case) since we're using Supabase client directly
    const { data, error } = await supabase
      .from('test_scores')
      .insert([
        {
          userId,
          book: testData.book,
          module: testData.module,
          test_number: testData.testNumber,
          score: testData.score,
          total_questions: testData.totalQuestions,
          percentage: testData.percentage,
          ielts_band_score: testData.ieltsBandScore,
          time_taken: testData.timeTaken || null
        }
      ])
      .select();
    
    if (error) {
      console.error('Supabase Error:', error);
      return {
        success: false,
        error: `Failed to save test score: ${error.message}`
      };
    }
    
    console.log('Test score saved successfully:', data);
    
    return {
      success: true,
      data: data[0]
    };
  } catch (error) {
    console.error('Failed to save test score:', error);
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Helper function to get IELTS band score for different modules
 * Can be extended for reading, writing, speaking in the future
 */
export const getModuleBandScore = (score: number, module: string): number => {
  switch (module.toLowerCase()) {
    case 'listening':
      return getIELTSListeningScore(score);
    case 'reading':
      // Can be implemented when needed
      return getIELTSListeningScore(score); // Using listening as default for now
    default:
      return getIELTSListeningScore(score);
  }
};

// Import from utils for band score calculation
import { getIELTSListeningScore } from './utils';