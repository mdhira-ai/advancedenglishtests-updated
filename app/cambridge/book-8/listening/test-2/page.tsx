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
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { saveTestScore } from '@/lib/test-score-saver';
import { checkAnswer as checkAnswerWithMatching, checkIndividualAnswer, calculateTestScore } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';

// Correct answers for all questions (from Cambridge IELTS 8 Test 2)
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'milperra',
  '2': 'first class movers',
  '3': '28 november',
  '4': 'screen',
  '5': 'bathroom',
  '6': 'door',
  '7': '140',
  '8': 'leg',
  '9': 'plates',
  '10': '60',
  
  // Section 2: Questions 11-20
  '11': 'b',
  '12': '(the) forest',
  '13': 'fish farm(s)',
  '14': 'market garden',
  '15': 'c',
  '16': 'a',
  '17': 'c',
  '18': 'b',
  '19': 'c',
  '20': 'a',
  
  // Section 3: Questions 21-30
  '21': 'a',
  '22': 'b',
  '23': 'c',
  '24': 'a',
  '25': 'insects',
  '26': 'feeding/eating',
  '27': 'laboratory',
  '28': 'water',
  '29': 'wings',
  '30': 'reliable/accurate',
  
  // Section 4: Questions 31-40
  '31': 'b',
  '32': 'b',
  '33': 'a',
  '34': 'a',
  '35': 'c',
  '36': 'c',
  '37': 'b',
  '38': 'f',
  '39': 'd',
  '40': 'c'
};

export default function Test2Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
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

  const handleAnswerChange = (questionId: number, value: string) => {
    handleInputChange(questionId.toString(), value);
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber];
    const userAnswer = answers[questionNumber] || '';
    
    // If no answer provided, return false
    if (!userAnswer || userAnswer.trim() === '') {
      return false;
    }
    
    // Handle multiple choice questions 
    if ((parseInt(questionNumber) >= 11 && parseInt(questionNumber) <= 20) || (parseInt(questionNumber) >= 31 && parseInt(questionNumber) <= 40)) {
      return userAnswer.toLowerCase() === correct.toLowerCase();
    }
    
    // Handle fill-in-the-blank questions with the imported answer matching function
    return checkAnswerWithMatching(userAnswer, correct, questionNumber);
  };

  const calculateScore = () => {
    let totalCorrect = 0;
    for (let i = 1; i <= 40; i++) {
      if (checkAnswer(i.toString())) {
        totalCorrect++;
      }
    }
    return totalCorrect;
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
        multipleAnswers: {},
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || '',
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
        testNumber: 2,
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

  

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 1 - Questions 1-10</h3>
        <p className="text-blue-700">Complete the form below.</p>
        <p className="text-sm text-blue-600 mt-1">Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">TOTAL INSURANCE INCIDENT REPORT</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Questions 1-3 Form */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 1–3</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Complete the form below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.
            </p>
            <div className="bg-white p-6 rounded border shadow-sm">
              <h4 className="font-semibold text-center mb-4 text-gray-900">TOTAL INSURANCE INCIDENT REPORT</h4>
              <p className="text-sm text-gray-500 mb-4">Example: Name: Michael Alexander</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-32">Address:</label>
                  <span>24 Manly Street,</span>
                  <Input 
                    placeholder="1"
                    className={`w-32 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500 ${submitted ? (checkAnswer('1') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['1'] || ''}
                    onChange={(e) => handleInputChange('1', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
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
                  <span>, Sydney</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-32">Shipping agent:</label>
                  <Input 
                    placeholder="2"
                    className={`w-48 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500 ${submitted ? (checkAnswer('2') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['2'] || ''}
                    onChange={(e) => handleInputChange('2', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
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
                
                <div className="flex items-center gap-4">
                  <label className="w-32">Place of origin:</label>
                  <span>China</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32">Date of arrival:</label>
                  <Input 
                    placeholder="3"
                    className="w-32 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500"
                    value={answers[3] || ''}
                    onChange={(e) => handleAnswerChange(3, e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32">Reference number:</label>
                  <span>601 ACK</span>
                </div>
              </div>
            </div>
          </div>

          {/* Questions 4-10 Table */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 4–10</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-gray-300 rounded">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left font-semibold">Item</th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">Damage</th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">Cost to repair/replace</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Television</td>
                    <td className="border border-gray-300 p-3">
                      The <Input 
                        placeholder="4"
                        className="inline-block w-24 mx-1 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500"
                        value={answers[4] || ''}
                        onChange={(e) => handleAnswerChange(4, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      /> needs to be replaced
                    </td>
                    <td className="border border-gray-300 p-3 text-gray-600">not known</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3">
                      The <Input 
                        placeholder="5"
                        className="inline-block w-24 mx-1 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500"
                        value={answers[5] || ''}
                        onChange={(e) => handleAnswerChange(5, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      /> cabinet
                    </td>
                    <td className="border border-gray-300 p-3">
                      The <Input 
                        placeholder="6"
                        className="inline-block w-24 mx-1 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500"
                        value={answers[6] || ''}
                        onChange={(e) => handleAnswerChange(6, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      /> of the cabinet is damaged
                    </td>
                    <td className="border border-gray-300 p-3">
                      $<Input 
                        placeholder="7"
                        className="inline-block w-20 mx-1 border-b border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none focus:border-blue-500"
                        value={answers[7] || ''}
                        onChange={(e) => handleAnswerChange(7, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Dining room table</td>
                    <td className="border border-gray-300 p-3">
                      A <Input 
                        placeholder="8"
                        className="inline-block w-24 mx-1 border-b-2 border-l-0 border-r-0 border-t-0 rounded-none"
                        value={answers[8] || ''}
                        onChange={(e) => handleAnswerChange(8, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      /> is split
                    </td>
                    <td className="border border-gray-300 p-3 text-gray-600">$200</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3">Set of china</td>
                    <td className="border border-gray-300 p-3">
                      Six <Input 
                        placeholder="9"
                        className="inline-block w-24 mx-1 border-b-2 border-l-0 border-r-0 border-t-0 rounded-none"
                        value={answers[9] || ''}
                        onChange={(e) => handleAnswerChange(9, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      /> were broken
                    </td>
                    <td className="border border-gray-300 p-3">
                      about $<Input 
                        placeholder="10"
                        className="inline-block w-20 mx-1 border-b-2 border-l-0 border-r-0 border-t-0 rounded-none"
                        value={answers[10] || ''}
                        onChange={(e) => handleAnswerChange(10, e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                      /> in total
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 2 - Questions 11-20</h3>
        <p className="text-blue-700">Agricultural Park Information</p>
        <p className="text-sm text-blue-600 mt-1">Choose the correct letter and complete the diagram.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Question 11 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Question 11</h3>
            <p className="text-sm text-gray-600 mb-4">Choose the correct letter, A, B or C.</p>
            <div className="mb-4">
              <p className="font-medium mb-3">According to the speaker, the main purposes of the park are</p>
              <div className="space-y-2">
                {['education and entertainment.', 'research and education.', 'research and entertainment.'].map((option, index) => (
                  <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded ${submitted ? (checkAnswer('11') ? 'bg-green-100' : 'bg-red-100') : ''}`}>
                    <input 
                      type="radio" 
                      name="q11" 
                      value={String.fromCharCode(65 + index).toLowerCase()}
                      onChange={(e) => handleInputChange('11', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span>{String.fromCharCode(65 + index)} {option}</span>
                    {submitted && answers['11'] === String.fromCharCode(65 + index).toLowerCase() && (
                      <span className="ml-auto">
                        {checkAnswer('11') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {submitted && !checkAnswer('11') && (
                <div className="mt-2 text-sm text-red-600">
                  Correct answer: {correctAnswers['11'].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Map Image for Questions 12-14 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 12–14</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Label the plan below. Write NO MORE THAN TWO WORDS for each answer.
            </p>
            <div className="text-center mb-6">
              <img 
                src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/listening/test2/map.png" 
                alt="Agricultural Park Map" 
                className="mx-auto max-w-full h-auto rounded border shadow-lg"
              />
              <p className="text-sm text-gray-600 mt-2 font-medium">Agricultural Park</p>
            </div>
            
            {/* Questions 12-14 Fill-in inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="w-16 font-medium">12.</label>
                <Input 
                  placeholder="Answer"
                  className={`w-48 ${submitted ? (checkAnswer('12') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                  value={answers['12'] || ''}
                  onChange={(e) => handleInputChange('12', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
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
              </div>
              
              <div className="flex items-center gap-4">
                <label className="w-16 font-medium">13.</label>
                <Input 
                  placeholder="Answer"
                  className={`w-48 ${submitted ? (checkAnswer('13') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                  value={answers['13'] || ''}
                  onChange={(e) => handleInputChange('13', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                />
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
              </div>
              
              <div className="flex items-center gap-4">
                <label className="w-16 font-medium">14.</label>
                <Input 
                  placeholder="Answer"
                  className={`w-48 ${submitted ? (checkAnswer('14') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                  value={answers['14'] || ''}
                  onChange={(e) => handleInputChange('14', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                />
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
              </div>
            </div>
          </div>

          {/* Questions 15-20 Multiple Choice */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 15–20</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Choose the correct letter, A, B or C.
            </p>
            
            <div className="space-y-6">
              {/* Question 15 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">15. When are the experimental areas closed to the public?</p>
                <div className="space-y-2">
                  {['all the year round', 'almost all the year', 'a short time every year'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['15'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('15') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q15"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('15', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['15'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('15') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('15') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['15'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 16 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">16. How can you move around the park?</p>
                <div className="space-y-2">
                  {['by tram, walking and bicycle', 'by solar car or bicycle', 'by bicycle, walking or bus'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['16'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('16') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q16"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('16', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['16'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('16') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('16') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['16'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 17 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">17. The rare breed animals kept in the park include</p>
                <div className="space-y-2">
                  {['hens and horses.', 'goats and cows.', 'goats and hens.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['17'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('17') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q17"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('17', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['17'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('17') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('17') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['17'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 18 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">18. What is the main purpose of having the Rare Breeds Section?</p>
                <div className="space-y-2">
                  {['to save unusual animals', 'to keep a variety of breeds', 'to educate the public'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['18'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('18') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q18"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('18', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['18'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('18') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('18') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['18'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 19 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">19. What can you see in the park at the present time?</p>
                <div className="space-y-2">
                  {['the arrival of wild birds', 'fruit tree blossom', 'a demonstration of fishing'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['19'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('19') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q19"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('19', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['19'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('19') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('19') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['19'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 20 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">20. The shop contains books about</p>
                <div className="space-y-2">
                  {['animals.', 'local traditions.', 'the history of the park.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['20'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('20') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q20"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('20', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['20'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('20') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('20') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['20'].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 3 - Questions 21–30</h3>
        <p className="text-blue-700">Honey Bees in Australia</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Questions 21-24 Multiple Choice */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 21–24</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Choose the correct letter, A, B or C.
            </p>
            <div className="bg-white p-4 rounded border shadow-sm mb-4">
              <h4 className="font-semibold text-center mb-4 text-gray-900">Honey Bees in Australia</h4>
            </div>
            
            <div className="space-y-6">
              {/* Question 21 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">21. Where in Australia have Asian honey bees been found in the past?</p>
                <div className="space-y-2">
                  {['Queensland', 'New South Wales', 'several states'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['21'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('21') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q21"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('21', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['21'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('21') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('21') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['21'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 22 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">22. A problem with Asian honey bees is that they</p>
                <div className="space-y-2">
                  {['attack native bees.', 'carry parasites.', 'damage crops.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['22'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('22') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q22"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('22', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['22'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('22') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('22') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['22'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 23 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">23. What point is made about Australian bees?</p>
                <div className="space-y-2">
                  {['The honey varies in quality.', 'Their size stops them from pollinating some flowers.', 'They are sold to customers abroad.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['23'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('23') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q23"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('23', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['23'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('23') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('23') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['23'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 24 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">24. Grant Freeman says that if Asian honey bees got into Australia,</p>
                <div className="space-y-2">
                  {['the country\'s economy would be affected.', 'they could be used in the study of allergies.', 'certain areas of agriculture would benefit.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['24'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('24') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q24"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('24', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['24'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('24') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('24') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['24'].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Questions 25-30 Fill in the blanks */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 25–30</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Complete the summary below. Write ONE WORD ONLY for each answer.
            </p>
            
            <div className="bg-white p-6 rounded border shadow-sm">
              <h4 className="font-semibold mb-4 text-gray-900">Looking for Asian honey bees</h4>
              
              <div className="space-y-4 text-gray-800 leading-relaxed">
                <p>
                  Birds called Rainbow Bee Eaters eat only{' '}
                  <Input 
                    placeholder="25"
                    className={`inline-block w-24 mx-1 border-b-2 border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none text-center ${submitted ? (checkAnswer('25') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['25'] || ''}
                    onChange={(e) => handleInputChange('25', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('25') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <span className="text-red-600 text-sm">({correctAnswers['25']})</span>
                      )}
                    </span>
                  )}
                  , and cough up small bits of skeleton and other products in a pellet.
                </p>
                
                <p>
                  Researchers go to the locations the bee eaters like to use for{' '}
                  <Input 
                    placeholder="26"
                    className={`inline-block w-24 mx-1 border-b-2 border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none text-center ${submitted ? (checkAnswer('26') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['26'] || ''}
                    onChange={(e) => handleInputChange('26', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('26') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <span className="text-red-600 text-sm">({correctAnswers['26']})</span>
                      )}
                    </span>
                  )}
                  . They collect the pellets and take them to a{' '}
                  <Input 
                    placeholder="27"
                    className={`inline-block w-24 mx-1 border-b-2 border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none text-center ${submitted ? (checkAnswer('27') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['27'] || ''}
                    onChange={(e) => handleInputChange('27', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('27') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <span className="text-red-600 text-sm">({correctAnswers['27']})</span>
                      )}
                    </span>
                  )}
                  {' '}for analysis.
                </p>
                
                <p>
                  Here{' '}
                  <Input 
                    placeholder="28"
                    className={`inline-block w-24 mx-1 border-b-2 border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none text-center ${submitted ? (checkAnswer('28') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['28'] || ''}
                    onChange={(e) => handleInputChange('28', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('28') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <span className="text-red-600 text-sm">({correctAnswers['28']})</span>
                      )}
                    </span>
                  )}
                  {' '}is used to soften them, and the researchers look for the{' '}
                  <Input 
                    placeholder="29"
                    className={`inline-block w-24 mx-1 border-b-2 border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none text-center ${submitted ? (checkAnswer('29') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['29'] || ''}
                    onChange={(e) => handleInputChange('29', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('29') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <span className="text-red-600 text-sm">({correctAnswers['29']})</span>
                      )}
                    </span>
                  )}
                  {' '}of Asian bees in the pellets.
                </p>
                
                <p>
                  The benefit of this research is that the result is more{' '}
                  <Input 
                    placeholder="30"
                    className={`inline-block w-24 mx-1 border-b-2 border-gray-300 border-l-0 border-r-0 border-t-0 rounded-none text-center ${submitted ? (checkAnswer('30') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    value={answers['30'] || ''}
                    onChange={(e) => handleInputChange('30', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                  />
                  {submitted && (
                    <span className="ml-2">
                      {checkAnswer('30') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <span className="text-red-600 text-sm">({correctAnswers['30']})</span>
                      )}
                    </span>
                  )}
                  {' '}than searching for live Asian honey bees.
                </p>
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
        <h3 className="font-semibold text-blue-800 mb-2">SECTION 4 - Questions 31–40</h3>
        <p className="text-blue-700">Research on questions about doctors</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Questions 31-36 Multiple Choice */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 31–36</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Choose the correct letter, A, B or C.
            </p>
            <div className="bg-white p-4 rounded border shadow-sm mb-4">
              <h4 className="font-semibold text-center mb-4 text-gray-900">Research on questions about doctors</h4>
            </div>
            
            <div className="space-y-6">
              {/* Question 31 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">31. In order to set up her research programme, Shona got</p>
                <div className="space-y-2">
                  {['advice from personal friends in other countries.', 'help from students in other countries.', 'information from her tutor\'s contacts in other countries.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['31'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('31') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q31"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('31', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['31'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('31') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('31') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['31'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 32 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">32. What types of people were included in the research?</p>
                <div className="space-y-2">
                  {['young people in their first job', 'men who were working', 'women who were unemployed'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['32'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('32') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q32"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('32', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['32'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('32') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('32') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['32'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 33 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">33. Shona says that in her questionnaire her aim was</p>
                <div className="space-y-2">
                  {['to get a wide range of data.', 'to limit people\'s responses.', 'to guide people through interviews.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['33'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('33') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q33"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('33', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['33'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('33') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('33') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['33'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 34 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">34. What do Shona's initial results show about medical services in Britain?</p>
                <div className="space-y-2">
                  {['Current concerns are misrepresented by the press.', 'Financial issues are critical to the government.', 'Reforms within hospitals have been unsuccessful.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['34'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('34') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q34"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('34', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['34'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('34') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('34') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['34'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 35 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">35. Shona needs to do further research in order to</p>
                <div className="space-y-2">
                  {['present the government with her findings.', 'decide on the level of first aid needed.', 'identify the preferences of the public.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['35'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('35') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q35"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('35', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['35'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('35') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('35') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['35'].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Question 36 */}
              <div className="p-4 bg-white rounded border">
                <p className="font-medium mb-3">36. Shona has learnt from the research project that</p>
                <div className="space-y-2">
                  {['it is important to plan projects carefully.', 'people do not like answering questions', 'colleagues do not always agree.'].map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded ${submitted ? (answers['36'] === String.fromCharCode(65 + index).toLowerCase() ? (checkAnswer('36') ? 'bg-green-100' : 'bg-red-100') : '') : ''}`}>
                      <input 
                        type="radio" 
                        name="q36"
                        value={String.fromCharCode(65 + index).toLowerCase()}
                        onChange={(e) => handleInputChange('36', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className="w-4 h-4"
                      />
                      <span>{String.fromCharCode(65 + index)} {option}</span>
                      {submitted && answers['36'] === String.fromCharCode(65 + index).toLowerCase() && (
                        <span className="ml-auto">
                          {checkAnswer('36') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {submitted && !checkAnswer('36') && (
                  <div className="mt-2 text-sm text-red-600">
                    Correct answer: {correctAnswers['36'].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Questions 37-40 Matching */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Questions 37–40</h3>
            <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border">
              Which statement applies to each of the following people who were interviewed by Shona?<br/>
              Choose FOUR answers from the box and write the correct letter, A–F, next to questions 37–40.
            </p>
            
            <div className="bg-white p-6 rounded border shadow-sm mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div><span className="font-semibold">A</span> gave false data</div>
                  <div><span className="font-semibold">B</span> decided to stop participating</div>
                  <div><span className="font-semibold">C</span> refused to tell Shona about their job</div>
                </div>
                <div className="space-y-2">
                  <div><span className="font-semibold">D</span> kept changing their mind about participating</div>
                  <div><span className="font-semibold">E</span> became very angry with Shona</div>
                  <div><span className="font-semibold">F</span> was worried about confidentiality</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">People interviewed by Shona</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-medium">37</span>
                    <span className="w-48">a person interviewed in the street</span>
                    <Input 
                      placeholder="Letter"
                      className={`w-16 text-center ${submitted ? (checkAnswer('37') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['37'] || ''}
                      onChange={(e) => handleInputChange('37', e.target.value.toUpperCase())}
                      disabled={!isTestStarted || isSubmitting}
                      maxLength={1}
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('37') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['37'].toUpperCase()}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-medium">38</span>
                    <span className="w-48">an undergraduate at the university</span>
                    <Input 
                      placeholder="Letter"
                      className={`w-16 text-center ${submitted ? (checkAnswer('38') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['38'] || ''}
                      onChange={(e) => handleInputChange('38', e.target.value.toUpperCase())}
                      disabled={!isTestStarted || isSubmitting}
                      maxLength={1}
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('38') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['38'].toUpperCase()}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-medium">39</span>
                    <span className="w-48">a colleague in her department</span>
                    <Input 
                      placeholder="Letter"
                      className={`w-16 text-center ${submitted ? (checkAnswer('39') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['39'] || ''}
                      onChange={(e) => handleInputChange('39', e.target.value.toUpperCase())}
                      disabled={!isTestStarted || isSubmitting}
                      maxLength={1}
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('39') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['39'].toUpperCase()}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-medium">40</span>
                    <span className="w-48">a tutor in a foreign university</span>
                    <Input 
                      placeholder="Letter"
                      className={`w-16 text-center ${submitted ? (checkAnswer('40') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                      value={answers['40'] || ''}
                      onChange={(e) => handleInputChange('40', e.target.value.toUpperCase())}
                      disabled={!isTestStarted || isSubmitting}
                      maxLength={1}
                    />
                    {submitted && (
                      <span className="ml-2">
                        {checkAnswer('40') ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="ml-1 text-sm text-red-600">Answer: {correctAnswers['40'].toUpperCase()}</span>
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </div>
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
              Cambridge IELTS 8 - Listening Test 2
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
          audioSrc={AUDIO_URLS.book8.test2}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 8 - Listening Test 2"
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
                 
                  <Link href="/cambridge/">
                    <Button variant="outline">
                      Back to Tests
                    </Button>
                  </Link>
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
                  const userAnswer = answers[questionNum] || '';
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
                            {userAnswer || 'No answer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Correct: </span>
                          <span className="text-green-700 font-medium">{correctAnswer}</span>
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
        testNumber={2}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-8"
          module="listening"
          testNumber={2}
        />
        <UserTestHistory 
          book="book-8"
          module="listening"
          testNumber={2}
        />
      </div>
    </div>
  );
}
