import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * IELTS Listening Score Conversion Table
 * Converts raw score (out of 40) to IELTS band score
 * @param rawScore - The number of correct answers (0-40)
 * @returns IELTS band score (0.5-9.0)
 */
export const getIELTSListeningScore = (rawScore: number): number => {
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 32) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 26) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 18) return 5.5;
  if (rawScore >= 16) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  if (rawScore >= 8) return 3.5;
  if (rawScore >= 6) return 3.0;
  if (rawScore >= 4) return 2.5;
  if (rawScore >= 3) return 2.0;
  if (rawScore >= 2) return 1.5;
  if (rawScore >= 1) return 1.0;
  return 0.5;
};

/**
 * IELTS Academic Reading Score Conversion Table
 * Converts raw score (out of 40) to IELTS band score
 * @param rawScore - The number of correct answers (0-40)
 * @returns IELTS band score (0.5-9.0)
 */
export const getIELTSReadingScore = (rawScore: number): number => {
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 33) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 27) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 19) return 5.5;
  if (rawScore >= 15) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  if (rawScore >= 8) return 3.5;
  if (rawScore >= 6) return 3.0;
  if (rawScore >= 4) return 2.5;
  if (rawScore >= 3) return 2.0;
  if (rawScore >= 2) return 1.5;
  if (rawScore >= 1) return 1.0;
  return 0.5;
};

/**
 * Generic IELTS Score function (defaults to Listening score for backward compatibility)
 * @param rawScore - The number of correct answers (0-40)
 * @returns IELTS band score (0.5-9.0)
 */
export const getIELTSScore = (rawScore: number): number => {
  return getIELTSListeningScore(rawScore);
};
