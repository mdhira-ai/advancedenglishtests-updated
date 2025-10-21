/**
 * Common answer matching logic for IELTS tests
 * 
 * This module provides functions to generate answer variations and check answers
 * with support for:
 * - Optional words in parentheses: (the/a) pianist/piano player
 * - Slash alternatives: car-park/parking lot
 * - Hyphenated words: car-park vs car park vs carpark
 * - User input with "or" alternatives: sensory leakage or fraud, sensory leakage (or) fraud
 * - Exact matching (no partial matches)
 */

/**
 * Generates all possible variations of an answer based on IELTS answer format rules
 * @param answer The correct answer string
 * @returns Array of all possible valid answer variations
 */
export function generateAnswerVariations(answer: string): string[] {
  const variations = new Set<string>();
  let cleanAnswer = answer.toLowerCase().trim();
  
  // Add the original answer
  variations.add(cleanAnswer);
  
  // First, extract and handle parentheses content
  const processParentheses = (text: string): string[] => {
    const results = new Set<string>();
    let workingText = text;
    
    // Handle parentheses with optional words (e.g., "(free) drink(s)", "(the/a) pianist")
    const parenMatches = workingText.match(/\([^)]*\)/g);
    if (parenMatches) {
      // Generate combinations with and without parenthetical content
      let combinations: string[] = [workingText];
      
      parenMatches.forEach(parenContent => {
        const newCombinations: string[] = [];
        const content = parenContent.slice(1, -1); // Remove parentheses
        
        combinations.forEach(combo => {
          // Version without the parenthetical content
          const withoutParen = combo.replace(parenContent, '').replace(/\s+/g, ' ').trim();
          newCombinations.push(withoutParen);
          
          // Handle "(or)" pattern specifically - treat as "or" separator
          if (content.toLowerCase() === 'or') {
            // For "(or)" pattern, split the text around it
            const parts = combo.split(parenContent);
            if (parts.length === 2) {
              const leftPart = parts[0].trim();
              const rightPart = parts[1].trim();
              if (leftPart && rightPart) {
                newCombinations.push(leftPart);
                newCombinations.push(rightPart);
              }
            }
          }
          // Handle slash alternatives within parentheses
          else if (content.includes('/')) {
            const parenParts = content.split('/');
            parenParts.forEach(part => {
              const withPart = combo.replace(parenContent, part.trim()).replace(/\s+/g, ' ').trim();
              newCombinations.push(withPart);
            });
          } else {
            // Regular parenthetical content
            const withContent = combo.replace(parenContent, content).replace(/\s+/g, ' ').trim();
            newCombinations.push(withContent);
          }
        });
        
        combinations = newCombinations;
      });
      
      combinations.forEach(combo => results.add(combo));
    } else {
      results.add(workingText);
    }
    
    return Array.from(results);
  };
  
  // Process the main answer for parentheses
  const parenVariations = processParentheses(cleanAnswer);
  parenVariations.forEach(variation => variations.add(variation));
  
  // Now handle slash alternatives for each variation
  const finalVariations = new Set<string>();
  variations.forEach(variation => {
    finalVariations.add(variation);
    
    if (variation.includes('/')) {
      const parts = variation.split('/');
      parts.forEach(part => {
        const trimmedPart = part.trim();
        if (trimmedPart.length > 0) {
          finalVariations.add(trimmedPart);
        }
      });
    }
  });
  
  // Handle hyphenated alternatives (e.g., "car-park/parking lot")
  const hyphenVariations = new Set<string>();
  finalVariations.forEach(variation => {
    hyphenVariations.add(variation);
    
    if (variation.includes('-')) {
      const withoutHyphens = variation.replace(/-/g, ' ');
      hyphenVariations.add(withoutHyphens);
      const withoutHyphensAndSpaces = variation.replace(/-/g, '');
      hyphenVariations.add(withoutHyphensAndSpaces);
    }
  });
  
  return Array.from(hyphenVariations).filter(v => v.length > 0);
}

/**
 * Generates all possible variations from user input that contains "or" alternatives
 * @param userInput The user's input that may contain "or" alternatives
 * @returns Array of individual answer parts from the user input
 */
function extractUserAnswerVariations(userInput: string): string[] {
  const variations = new Set<string>();
  let cleanInput = userInput.toLowerCase().trim();
  
  // Add the original input
  variations.add(cleanInput);
  
  // Handle different "or" formats: "or", "(or)", " / ", etc.
  const orPatterns = [
    /\s+or\s+/gi,           // " or "
    /\s*\(or\)\s*/gi,       // "(or)"
    /\s*\/\s*/g,            // "/"
    /\s*\|\s*/g             // "|"
  ];
  
  orPatterns.forEach(pattern => {
    if (pattern.test(cleanInput)) {
      const parts = cleanInput.split(pattern);
      parts.forEach(part => {
        const trimmedPart = part.trim();
        if (trimmedPart.length > 0) {
          variations.add(trimmedPart);
        }
      });
    }
  });
  
  return Array.from(variations).filter(v => v.length > 0);
}

/**
 * Checks if a user answer matches the correct answer using IELTS matching rules
 * @param userAnswer The user's input answer
 * @param correctAnswer The correct answer from the answer key
 * @param questionNumber The question number (optional, currently unused but kept for future extensions)
 * @returns Boolean indicating if the answer is correct
 */
export function checkAnswer(
  userAnswer: string, 
  correctAnswer: string, 
  questionNumber?: string
): boolean {
  // If no answer provided, return false
  if (!userAnswer || userAnswer.trim() === '') {
    return false;
  }
  
  // Generate all possible variations of the correct answer
  const correctVariations = generateAnswerVariations(correctAnswer);
  
  // Extract all possible answers from user input (handling "or" alternatives)
  const userVariations = extractUserAnswerVariations(userAnswer);
  
  // Check if any user variation matches any correct variation
  return userVariations.some(userVar => {
    return correctVariations.some(correctVar => {
      return userVar === correctVar;
    });
  });
}

/**
 * Calculate the total score for a test
 * @param answers Object containing user answers (questionNumber: answer)
 * @param correctAnswers Object containing correct answers (questionNumber: answer)
 * @param totalQuestions Total number of questions (default: 40)
 * @returns Number of correct answers
 */
export function calculateTestScore(
  answers: { [key: string]: string },
  correctAnswers: { [key: string]: string },
  totalQuestions: number = 40
): number {
  let totalCorrect = 0;
  for (let i = 1; i <= totalQuestions; i++) {
    const questionNumber = i.toString();
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    if (correctAnswer && checkAnswer(userAnswer, correctAnswer, questionNumber)) {
      totalCorrect++;
    }
  }
  return totalCorrect;
}

/**
 * Check individual answer with question-specific logic
 * @param answers Object containing all user answers
 * @param correctAnswers Object containing all correct answers
 * @param questionNumber The specific question number to check
 * @returns Boolean indicating if the answer is correct
 */
export function checkIndividualAnswer(
  answers: { [key: string]: string },
  correctAnswers: { [key: string]: string },
  questionNumber: string
): boolean {
  const userAnswer = answers[questionNumber] || '';
  const correctAnswer = correctAnswers[questionNumber];
  
  if (!correctAnswer) {
    return false;
  }
  
  return checkAnswer(userAnswer, correctAnswer, questionNumber);
}
