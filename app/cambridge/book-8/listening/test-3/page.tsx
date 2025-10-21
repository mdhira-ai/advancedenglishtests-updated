'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { TestStatistics } from '@/components/analytics/TestStatistics';
import { UserTestHistory } from '@/components/analytics/UserTestHistory';
import IELTSBandDisplay from '@/components/evaluation/IELTSBandDisplay';
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { saveTestScore } from '@/lib/test-score-saver';
import { checkAnswer as checkAnswerWithMatching, checkIndividualAnswer, calculateTestScore } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';

// Correct answers for all questions
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'central',
  '2': '600',
  '3': '2 year(s)',
  '4': 'garage',
  '5': 'garden',
  '6': 'study',
  '7': 'noisy',
  '8': '595',
  '9': 'b', // Questions 9-10: Each answer counts separately, but selected from same set
  '10': 'e',
  
  // Section 2: Questions 11-20
  '11': 'classical music/ concerts',
  '12': 'bookshop/bookstore',
  '13': 'planned',
  '14': '1983/(the) 1980s',
  '15': 'city council',
  '16': '363',
  '17': '(the) garden hall',
  '18': 'three lives',
  '19': '4.50',
  '20': 'faces of china',
  
  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'C',
  '23': 'A',
  '24': 'B',
  '25': 'C',
  '26': 'A',
  '27': 'C',
  '28': 'A',
  '29': 'B',
  '30': 'C',
  
  // Section 4: Questions 31-40
  '31': 'B',
  '32': 'B',
  '33': 'B',
  '34': 'A',
  '35': 'combination',
  '36': 'safety',
  '37': 'attitude',
  '38': 'control',
  '39': 'factory',
  '40': 'skills'
};

export default function Test3Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '9-10': [] // Shared selection pool for questions 9, 10
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Set test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []); // Empty dependency array to run only once

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value.toLowerCase()
    }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    // Handle special multi-select questions where answers are picked from shared pools
    if (questionNumber === '9-10') {
      const maxSelections = 2;
      setMultipleAnswers(prev => {
        const current = prev[questionNumber] || [];
        if (current.includes(value)) {
          return { ...prev, [questionNumber]: current.filter(v => v !== value) };
        } else if (current.length < maxSelections) {
          return { ...prev, [questionNumber]: [...current, value] };
        }
        return prev;
      });
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionNumber]: value
      }));
    }
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber];
    
    // Handle shared pool questions - check if the correct answer is in the selected pool
    if (['9', '10'].includes(questionNumber)) {
      const selectedPool = multipleAnswers['9-10'] || [];
      return selectedPool.includes(correctAnswer as string);
    } else if (questionNumber >= '21' && questionNumber <= '40') {
      // For multiple choice questions (single answer)
      const userAnswer = answers[questionNumber] || '';
      
      // If no answer provided, return false
      if (!userAnswer || userAnswer.trim() === '') {
        return false;
      }
      
      return userAnswer.toUpperCase() === correctAnswer;
    } else {
      // For fill-in-the-blank questions - use the imported answer matching function
      const userAnswer = answers[questionNumber] || '';
      
      if (typeof correctAnswer === 'string') {
        return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
      }
    }
    
    return false;
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    for (const questionNumber of Object.keys(correctAnswers)) {
      if (checkAnswer(questionNumber)) {
        correctCount++;
      }
    }
    
    return correctCount;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      // Calculate time taken
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      // Prepare detailed answers data
      const detailedAnswers = {
        singleAnswers: answers,
        multipleAnswers: multipleAnswers,
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || multipleAnswers[questionNum] || '',
          correctAnswer: correctAnswers[questionNum],
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-8',
        module: 'listening',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', result.error);
      }
      
      setSubmitted(true);
      setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      // Still show results even if save failed
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestStart = () => {
    setIsTestStarted(true);
  };

 

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[], isMultiSelect = false) => {
    const selectedAnswers = isMultiSelect ? (multipleAnswers[questionNumber] || []) : [answers[questionNumber] || ''];
    
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, etc.
          const isSelected = selectedAnswers.includes(optionLetter.toLowerCase());
          
          // For multi-select questions like 9-10, check if this option is a correct answer
          const isCorrectOption = isMultiSelect && submitted && 
            (correctAnswers['9'] === optionLetter.toLowerCase() || correctAnswers['10'] === optionLetter.toLowerCase());
          
          // For single select questions
          const isSingleCorrect = !isMultiSelect && submitted && 
            correctAnswers[questionNumber] === optionLetter.toUpperCase();
          
          const showAsCorrect = isCorrectOption || isSingleCorrect;
          const showAsWrong = submitted && isSelected && !showAsCorrect;
          
          return (
            <div key={optionLetter} 
                 className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${
                   submitted
                     ? showAsCorrect
                       ? 'bg-green-100 border-green-500'
                       : showAsWrong
                         ? 'bg-red-100 border-red-500'
                         : isSelected
                           ? 'bg-blue-100 border-blue-500'
                           : 'border-gray-200'
                     : isSelected 
                       ? 'bg-blue-100 border-blue-500'
                       : 'border-gray-200 hover:bg-gray-50'
                 }`}
                 onClick={() => !submitted && handleMultipleChoice(questionNumber, optionLetter.toLowerCase())}>
              <input
                type={isMultiSelect ? "checkbox" : "radio"}
                checked={isSelected}
                onChange={() => !submitted && handleMultipleChoice(questionNumber, optionLetter.toLowerCase())}
                disabled={submitted}
                className="form-checkbox"
              />
              <span className="font-semibold">{optionLetter}</span>
              <span>{option}</span>
              {submitted && showAsCorrect && (
                <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
              )}
              {submitted && showAsWrong && (
                <XCircle className="w-4 h-4 text-red-600 ml-auto" />
              )}
            </div>
          );
        })}
        {/* Show correct answers for multi-select when submitted */}
        {submitted && isMultiSelect && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-800 mb-1">Correct answers:</p>
            <p className="text-sm text-blue-700">
              Question 9: <span className="font-medium">{(correctAnswers['9'] as string).toUpperCase()} - {options[(correctAnswers['9'] as string).charCodeAt(0) - 97]}</span>
            </p>
            <p className="text-sm text-blue-700">
              Question 10: <span className="font-medium">{(correctAnswers['10'] as string).toUpperCase()} - {options[(correctAnswers['10'] as string).charCodeAt(0) - 97]}</span>
            </p>
          </div>
        )}
      </div>
    );
  };

  const ieltsScore = getIELTSListeningScore(score);

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 1 - Questions 1-10</h3>
        <p className="text-blue-700">Questions 1-3: Complete the form below.</p>
        <p className="text-sm text-blue-600 mt-1">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Rental Properties Customer's Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border p-4 rounded">
              <p><strong>Name:</strong> Steven Godfrey</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p><strong>Example:</strong> No. of bedrooms: <span className="underline">four</span></p>
                </div>
                <div>
                  <p><strong>Answer:</strong></p>
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center space-x-2">
                  <label className="w-48"><strong>Preferred location:</strong> in the</label>
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('1') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['1'] || ''}
                    onChange={(e) => handleInputChange('1', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="1"
                  />
                  <span>area of town</span>
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('1') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['1']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <label className="w-48"><strong>Maximum monthly rent:</strong></label>
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('2') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['2'] || ''}
                    onChange={(e) => handleInputChange('2', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="2"
                  />
                  <span>£</span>
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('2') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['2']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <label className="w-48"><strong>Length of let required:</strong></label>
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('3') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['3'] || ''}
                    onChange={(e) => handleInputChange('3', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="3"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('3') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['3']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </div>

                <p><strong>Starting:</strong> September 1st</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">Questions 4-8: Complete the table below.</p>
        <p className="text-sm text-blue-600 mt-1">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Address</th>
                <th className="border border-gray-300 p-2">Rooms</th>
                <th className="border border-gray-300 p-2">Monthly rent</th>
                <th className="border border-gray-300 p-2">Problem</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Oakington Avenue</td>
                <td className="border border-gray-300 p-2">living/dining room, separate kitchen</td>
                <td className="border border-gray-300 p-2">£550</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  no 
                  <Input 
                    className={`w-24 mx-2 ${submitted ? (checkAnswer('4') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['4'] || ''}
                    onChange={(e) => handleInputChange('4', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="4"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('4') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['4']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Mead Street</td>
                <td className="border border-gray-300 p-2">large living room and kitchen, bathroom and a cloakroom</td>
                <td className="border border-gray-300 p-2">£580</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  the 
                  <Input 
                    className={`w-24 mx-2 ${submitted ? (checkAnswer('5') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['5'] || ''}
                    onChange={(e) => handleInputChange('5', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="5"
                  />
                  is too large
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('5') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['5']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Hamilton Road</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  living room, kitchen-diner, and a 
                  <Input 
                    className={`w-24 mx-2 ${submitted ? (checkAnswer('6') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['6'] || ''}
                    onChange={(e) => handleInputChange('6', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="6"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('6') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['6']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 p-2">£550</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  too 
                  <Input 
                    className={`w-24 mx-2 ${submitted ? (checkAnswer('7') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['7'] || ''}
                    onChange={(e) => handleInputChange('7', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="7"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('7') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['7']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Devon Close</td>
                <td className="border border-gray-300 p-2">living room, dining room, small kitchen</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  £
                  <Input 
                    className={`w-24 mx-2 ${submitted ? (checkAnswer('8') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['8'] || ''}
                    onChange={(e) => handleInputChange('8', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="8"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('8') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['8']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 p-2">none</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">Questions 9 and 10: Choose TWO letters, A-E.</p>
        <p className="text-blue-700 mt-2">Which TWO facilities in the district of Devon Close are open to the public at the moment?</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderMultipleChoiceQuestion('9-10', [
            'museum',
            'concert hall',
            'cinema',
            'sports centre',
            'swimming pool'
          ], true)}
        </CardContent>
      </Card>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 2 - Questions 11-20</h3>
        <p className="text-blue-700">Questions 11-16: Complete the notes below.</p>
        <p className="text-sm text-blue-600 mt-1">Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">THE NATIONAL ARTS CENTRE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <label className="w-32"><strong>Well known for:</strong></label>
              <Input 
                className={`w-32 ${submitted ? (checkAnswer('11') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                value={answers['11'] || ''}
                onChange={(e) => handleInputChange('11', e.target.value)}
                disabled={!isTestStarted || isSubmitting}
                placeholder="11"
              />
              {submitted && (
                <span className="ml-2">
                  {checkAnswer('11') ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['11']}</span>
                    </div>
                  )}
                </span>
              )}
            </div>

            <div>
              <p><strong>Complex consists of:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>concert rooms</li>
                <li>theatres</li>
                <li>cinemas</li>
                <li>art galleries</li>
                <li>public library</li>
                <li>restaurants</li>
                <li className="flex items-center space-x-2">
                  a 
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('12') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['12'] || ''}
                    onChange={(e) => handleInputChange('12', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="12"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('12') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['12']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </li>
              </ul>
            </div>

            <div>
              <p><strong>Historical background:</strong></p>
              <ul className="ml-4 space-y-2">
                <li>1940 – area destroyed by bombs</li>
                <li className="flex items-center space-x-2">
                  1960s–1970s – Centre was 
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('13') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['13'] || ''}
                    onChange={(e) => handleInputChange('13', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="13"
                  />
                  and built
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('13') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['13']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </li>
                <li className="flex items-center space-x-2">
                  in 
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('14') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['14'] || ''}
                    onChange={(e) => handleInputChange('14', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="14"
                  />
                  – opened to public
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('14') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['14']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </li>
              </ul>
            </div>

            <div className="flex items-center space-x-2">
              <label className="w-32"><strong>Managed by:</strong></label>
              the 
              <Input 
                className={`w-32 ${submitted ? (checkAnswer('15') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                value={answers['15'] || ''}
                onChange={(e) => handleInputChange('15', e.target.value)}
                disabled={!isTestStarted || isSubmitting}
                placeholder="15"
              />
              {submitted && (
                <span className="ml-2">
                  {checkAnswer('15') ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['15']}</span>
                    </div>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <label className="w-32"><strong>Open:</strong></label>
              <Input 
                className={`w-32 ${submitted ? (checkAnswer('16') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                value={answers['16'] || ''}
                onChange={(e) => handleInputChange('16', e.target.value)}
                disabled={!isTestStarted || isSubmitting}
                placeholder="16"
              />
              days per year
              {submitted && (
                <span className="ml-2">
                  {checkAnswer('16') ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['16']}</span>
                    </div>
                  )}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">Questions 17-20: Complete the table below.</p>
        <p className="text-sm text-blue-600 mt-1">Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Day</th>
                <th className="border border-gray-300 p-2">Time</th>
                <th className="border border-gray-300 p-2">Event</th>
                <th className="border border-gray-300 p-2">Venue</th>
                <th className="border border-gray-300 p-2">Ticket price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Monday and Tuesday</td>
                <td className="border border-gray-300 p-2">7.30 p.m.</td>
                <td className="border border-gray-300 p-2">'The Magic Flute' (opera by Mozart)</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('17') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['17'] || ''}
                    onChange={(e) => handleInputChange('17', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="17"
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('17') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['17']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 p-2">from £8.00</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Wednesday</td>
                <td className="border border-gray-300 p-2">8.00 p.m.</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  <Input 
                    className={`w-32 ${submitted ? (checkAnswer('18') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['18'] || ''}
                    onChange={(e) => handleInputChange('18', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="18"
                  />
                  (Canadian film)
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('18') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['18']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 p-2">Cinema 2</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  <Input 
                    className={`w-24 ${submitted ? (checkAnswer('19') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['19'] || ''}
                    onChange={(e) => handleInputChange('19', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="19"
                  />
                  £
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('19') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['19']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Saturday and Sunday</td>
                <td className="border border-gray-300 p-2">11 a.m. to 10 p.m.</td>
                <td className="border border-gray-300 p-2 flex items-center">
                  <Input 
                    className={`w-40 ${submitted ? (checkAnswer('20') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['20'] || ''}
                    onChange={(e) => handleInputChange('20', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    placeholder="20"
                  />
                  (art exhibition)
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('20') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['20']}</span>
                        </div>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 p-2">Gallery 1</td>
                <td className="border border-gray-300 p-2">free</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 3 - Questions 21-30</h3>
        <p className="text-blue-700">Questions 21-26: Choose the correct letter, A, B or C.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Latin American studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="font-semibold mb-3">21. Paul decided to get work experience in South America because he wanted</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'to teach English there.' },
                  { letter: 'B', text: 'to improve his Spanish.' },
                  { letter: 'C', text: 'to learn about Latin American life.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q21"
                      value={option.letter}
                      checked={answers['21'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('21', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['21'] === option.letter.toLowerCase() ? 
                      (checkAnswer('21') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['21'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('21') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: C - to learn about Latin American life.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">22. What project work did Paul originally intend to get involved in?</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'construction' },
                  { letter: 'B', text: 'agriculture' },
                  { letter: 'C', text: 'tourism' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q22"
                      value={option.letter}
                      checked={answers['22'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('22', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['22'] === option.letter.toLowerCase() ? 
                      (checkAnswer('22') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['22'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('22') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: A - construction
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">23. Why did Paul change from one project to another?</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'His first job was not well organised.' },
                  { letter: 'B', text: 'He found doing the routine work very boring.' },
                  { letter: 'C', text: 'The work was too physically demanding.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q23"
                      value={option.letter}
                      checked={answers['23'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('23', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['23'] === option.letter.toLowerCase() ? 
                      (checkAnswer('23') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['23'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('23') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: B - He found doing the routine work very boring.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">24. In the village community, he learnt how important it was to</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'respect family life.' },
                  { letter: 'B', text: 'develop trust.' },
                  { letter: 'C', text: 'use money wisely.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q24"
                      value={option.letter}
                      checked={answers['24'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('24', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['24'] === option.letter.toLowerCase() ? 
                      (checkAnswer('24') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['24'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('24') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: B - develop trust.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">25. What does Paul say about his project manager?</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'He let Paul do most of the work.' },
                  { letter: 'B', text: 'His plans were too ambitious.' },
                  { letter: 'C', text: 'He was very supportive of Paul.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q25"
                      value={option.letter}
                      checked={answers['25'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('25', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['25'] === option.letter.toLowerCase() ? 
                      (checkAnswer('25') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['25'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('25') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: C - He was very supportive of Paul.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">26. Paul was surprised to be given</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'a computer to use.' },
                  { letter: 'B', text: 'so little money to live on.' },
                  { letter: 'C', text: 'an extension to his contract.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q26"
                      value={option.letter}
                      checked={answers['26'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('26', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['26'] === option.letter.toLowerCase() ? 
                      (checkAnswer('26') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['26'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('26') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: C - an extension to his contract.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">Questions 27-30: What does Paul decide about each of the following modules?</p>
        <p className="text-blue-700 mt-2">Write the correct letter, A, B or C, next to questions 27-30.</p>
        <div className="mt-2 p-3 bg-white rounded border">
          <p><strong>A</strong> He will do this.</p>
          <p><strong>B</strong> He might do this.</p>
          <p><strong>C</strong> He won't do this.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span><strong>27</strong> Gender Studies in Latin America</span>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {['A', 'B', 'C'].map(letter => (
                    <label key={letter} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="q27"
                        value={letter}
                        checked={answers['27'] === letter.toLowerCase()}
                        onChange={(e) => handleInputChange('27', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span className={`${submitted && answers['27'] === letter.toLowerCase() ? 
                        (checkAnswer('27') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                        {letter}
                      </span>
                    </label>
                  ))}
                </div>
                {submitted && (
                  <span className="ml-2">
                    {checkAnswer('27') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="ml-1 text-sm text-red-600">Answer: A</span>
                      </div>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span><strong>28</strong> Second Language Acquisition</span>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {['A', 'B', 'C'].map(letter => (
                    <label key={letter} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="q28"
                        value={letter}
                        checked={answers['28'] === letter.toLowerCase()}
                        onChange={(e) => handleInputChange('28', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span className={`${submitted && answers['28'] === letter.toLowerCase() ? 
                        (checkAnswer('28') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                        {letter}
                      </span>
                    </label>
                  ))}
                </div>
                {submitted && (
                  <span className="ml-2">
                    {checkAnswer('28') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="ml-1 text-sm text-red-600">Answer: B</span>
                      </div>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span><strong>29</strong> Indigenous Women's Lives</span>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {['A', 'B', 'C'].map(letter => (
                    <label key={letter} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="q29"
                        value={letter}
                        checked={answers['29'] === letter.toLowerCase()}
                        onChange={(e) => handleInputChange('29', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span className={`${submitted && answers['29'] === letter.toLowerCase() ? 
                        (checkAnswer('29') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                        {letter}
                      </span>
                    </label>
                  ))}
                </div>
                {submitted && (
                  <span className="ml-2">
                    {checkAnswer('29') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="ml-1 text-sm text-red-600">Answer: C</span>
                      </div>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span><strong>30</strong> Portuguese Language Studies</span>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {['A', 'B', 'C'].map(letter => (
                    <label key={letter} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="q30"
                        value={letter}
                        checked={answers['30'] === letter.toLowerCase()}
                        onChange={(e) => handleInputChange('30', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span className={`${submitted && answers['30'] === letter.toLowerCase() ? 
                        (checkAnswer('30') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                        {letter}
                      </span>
                    </label>
                  ))}
                </div>
                {submitted && (
                  <span className="ml-2">
                    {checkAnswer('30') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="ml-1 text-sm text-red-600">Answer: C</span>
                      </div>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 4 - Questions 31-40</h3>
        <p className="text-blue-700">Questions 31-34: Choose the correct letter, A, B or C.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Trying to repeat success</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="font-semibold mb-3">31. Compared to introducing new business processes, attempts to copy existing processes are</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'more attractive.' },
                  { letter: 'B', text: 'more frequent.' },
                  { letter: 'C', text: 'more straightforward.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q31"
                      value={option.letter}
                      checked={answers['31'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('31', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['31'] === option.letter.toLowerCase() ? 
                      (checkAnswer('31') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['31'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('31') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: B - more frequent.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">32. Most research into the repetition of success in business has</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'been done outside the United States.' },
                  { letter: 'B', text: 'produced consistent findings.' },
                  { letter: 'C', text: 'related to only a few contexts.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q32"
                      value={option.letter}
                      checked={answers['32'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('32', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['32'] === option.letter.toLowerCase() ? 
                      (checkAnswer('32') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['32'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('32') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: B - produced consistent findings.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">33. What does the speaker say about consulting experts?</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'Too few managers ever do it.' },
                  { letter: 'B', text: 'It can be useful in certain circumstances.' },
                  { letter: 'C', text: 'Experts are sometimes unwilling to give advice.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q33"
                      value={option.letter}
                      checked={answers['33'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('33', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['33'] === option.letter.toLowerCase() ? 
                      (checkAnswer('33') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['33'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('33') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: B - It can be useful in certain circumstances.
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold mb-3">34. An expert's knowledge about a business system may be incomplete because</p>
              <div className="space-y-2 ml-4">
                {[
                  { letter: 'A', text: 'some details are difficult for workers to explain.' },
                  { letter: 'B', text: 'workers choose not to mention certain details.' },
                  { letter: 'C', text: 'details are sometimes altered by workers.' }
                ].map(option => (
                  <label key={option.letter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q34"
                      value={option.letter}
                      checked={answers['34'] === option.letter.toLowerCase()}
                      onChange={(e) => handleInputChange('34', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className={`${submitted && answers['34'] === option.letter.toLowerCase() ? 
                      (checkAnswer('34') ? 'bg-green-100' : 'bg-red-100') : ''} px-1 rounded`}>
                      <strong>{option.letter}</strong> {option.text}
                    </span>
                    {submitted && correctAnswers['34'] === option.letter && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('34') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: A - some details are difficult for workers to explain.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">Questions 35-40: Complete the notes below.</p>
        <p className="text-sm text-blue-600 mt-1">Write ONE WORD ONLY for each answer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Setting up systems based on an existing process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Two mistakes</h4>
              <div className="ml-4 space-y-2">
                <p><strong>Manager tries to:</strong></p>
                <ul className="ml-4 space-y-2">
                  <li>• improve on the original process</li>
                  <li className="flex items-center space-x-2">
                    • create an ideal 
                    <Input 
                      className={`w-32 ${submitted ? (checkAnswer('35') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['35'] || ''}
                      onChange={(e) => handleInputChange('35', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      placeholder="35"
                    />
                    from the best parts of several processes
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('35') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['35']}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Cause of problems</h4>
              <div className="ml-4 space-y-2">
                <ul className="space-y-2">
                  <li>• information was inaccurate</li>
                  <li>• comparison between the business settings was invalid</li>
                  <li className="flex items-center space-x-2">
                    • disadvantages were overlooked, e.g. effect of changes on 
                    <Input 
                      className={`w-32 ${submitted ? (checkAnswer('36') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['36'] || ''}
                      onChange={(e) => handleInputChange('36', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      placeholder="36"
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('36') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['36']}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Solution</h4>
              <div className="ml-4 space-y-2">
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    • change 
                    <Input 
                      className={`w-32 ${submitted ? (checkAnswer('37') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['37'] || ''}
                      onChange={(e) => handleInputChange('37', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      placeholder="37"
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('37') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['37']}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </li>
                  <li className="flex items-center space-x-2">
                    • impose rigorous 
                    <Input 
                      className={`w-32 ${submitted ? (checkAnswer('38') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['38'] || ''}
                      onChange={(e) => handleInputChange('38', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      placeholder="38"
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('38') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['38']}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </li>
                  <li>• copy original very closely:</li>
                  <li className="ml-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      – physical features of the 
                      <Input 
                        className={`w-32 ${submitted ? (checkAnswer('39') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                        value={answers['39'] || ''}
                        onChange={(e) => handleInputChange('39', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        placeholder="39"
                      />
                      {submitted && (
                        <span className="ml-2">
                          {checkAnswer('39') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['39']}</span>
                            </div>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      – the 
                      <Input 
                        className={`w-32 ${submitted ? (checkAnswer('40') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                        value={answers['40'] || ''}
                        onChange={(e) => handleInputChange('40', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        placeholder="40"
                      />
                      of original employees
                      {submitted && (
                        <span className="ml-2">
                          {checkAnswer('40') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['40']}</span>
                            </div>
                          )}
                        </span>
                      )}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Cambridge IELTS 8 - Listening Test 3
            </h1>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                30 minutes
              </div>
              <div>40 questions</div>
              <div>4 sections</div>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <LocalAudioPlayer
          audioSrc={AUDIO_URLS.book8.test3}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 8 - Listening Test 3"
        />

        {/* Section Navigation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((section) => (
              <Button
                key={section}
                variant={currentSection === section ? "default" : "outline"}
                onClick={() => setCurrentSection(section)}
                className="w-24"
                disabled={!isTestStarted || isSubmitting}
              >
                Section {section}
              </Button>
            ))}
          </div>
          {!isTestStarted && !submitted && (
            <div className="text-center mt-2">
              <p className="text-sm text-blue-600">
                <strong>Note:</strong> Section navigation will be enabled after you start the test.
              </p>
            </div>
          )}
        </div>

        {/* Test Content */}
        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center text-yellow-800">
                <p className="font-semibold">Please start the audio before beginning the test.</p>
                <p className="text-sm mt-1">Click the "Start Test" button in the audio player above to begin.</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        {/* Results */}
        {submitted && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-blue-800">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-blue-800">
                  {score}/40
                </div>
                <div className="text-lg text-blue-700">
                  You got {score} out of 40 questions correct ({Math.round((score/40)*100)}%)
                </div>
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span>{score} Correct</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-600 mr-1" />
                    <span>{40 - score} Incorrect</span>
                  </div>
                </div>
                <div className="pt-4">
                  <IELTSBandDisplay score={ieltsScore} />
                  <div className="mt-4">
                    <Link href="/cambridge/">
                      <Button variant="outline">
                        Back to Tests
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!submitted && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubmit} 
              size="lg" 
              className="px-8"
              disabled={!isTestStarted || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
            {!isTestStarted && (
              <p className="text-sm text-blue-600 mt-2">
                Start the test to enable submission.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Results Popup */}
      {showResultsPopup && (
        <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
              <div className="flex justify-center items-center space-x-8 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{score}/40</div>
                  <div className="text-sm text-gray-600">Raw Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div>
                  <div className="text-sm text-gray-600">IELTS Band</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{Math.round((score/40)*100)}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(correctAnswers).map(([questionNum, correctAnswer]) => {
                  let userAnswer = '';
                  let displayAnswer = '';
                  
                  // Handle questions 9 and 10 specially (multi-select from shared pool)
                  if (['9', '10'].includes(questionNum)) {
                    const selectedPool = multipleAnswers['9-10'] || [];
                    userAnswer = selectedPool.includes(correctAnswer as string) ? (correctAnswer as string) : '';
                    displayAnswer = userAnswer ? userAnswer.toUpperCase() : 'No answer';
                  } else {
                    userAnswer = answers[questionNum] || '';
                    displayAnswer = userAnswer || 'No answer';
                  }
                  
                  const isCorrect = checkAnswer(questionNum);
                  
                  return (
                    <div 
                      key={questionNum}
                      className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Q{questionNum}</span>
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="text-gray-600">Your answer: </span>
                          <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {displayAnswer}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Correct: </span>
                          <span className="text-green-700 font-medium">
                            {typeof correctAnswer === 'string' ? correctAnswer.toUpperCase() : correctAnswer}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => setShowResultsPopup(false)}
                variant="outline"
              >
                Close
              </Button>
              
            </div>
          </div>
        </div>
      )}
      
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-8"
        module="listening"
        testNumber={3}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-8"
          module="listening"
          testNumber={3}
        />
        <UserTestHistory 
          book="book-8"
          module="listening"
          testNumber={3}
        />
      </div>
    </div>
  );
}
