'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocalAudioPlayer from "@/components/utils/LocalAudioPlayer";
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { TestStatistics } from '@/components/analytics/TestStatistics';
import { UserTestHistory } from '@/components/analytics/UserTestHistory';
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { saveTestScore } from '@/lib/test-score-saver';
import { checkAnswer as checkAnswerWithMatching, checkIndividualAnswer, calculateTestScore } from '@/lib/answer-matching';
import { Clock, ArrowLeft, RotateCcw } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

// Correct answers for all questions (from Cambridge IELTS 8 Test 1)
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'c',
  '2': 'b',
  '3': '48 north avenue',
  '4': 'ws6 2yh',
  '5': '01674 553242/01674553242',
  '6': '(free) drink(s)/refreshment(s)',
  '7': '(the/a) pianist/piano player',
  '8': '10.50',
  '9': '4',
  '10': '50%',
  
  // Section 2: Questions 11-20
  '11': '1.30',
  '12': '25 december/christmas day',
  '13': 'car-park/parking lot',
  '14': '45',
  '15': '(some) tables',
  '16': 'c', // Questions 16-18: Each answer counts separately, but selected from same set
  '17': 'f',
  '18': 'g',
  '19': 'b', // Questions 19-20: Each answer counts separately, but selected from same set  
  '20': 'e',
  
  // Section 3: Questions 21-30
  '21': 'a',
  '22': 'c',
  '23': 'a',
  '24': 'b',
  '25': 'b', // Questions 25-27: Each answer counts separately, but selected from same set
  '26': 'c',
  '27': 'f',
  '28': '12,000',
  '29': 'horses',
  '30': 'caves',
  
  // Section 4: Questions 31-40
  '31': 'surface',
  '32': 'environment',
  '33': 'impact(s)/effect(s)',
  '34': 'urban',
  '35': 'problems',
  '36': 'images',
  '37': 'patterns',
  '38': 'distortion(s)',
  '39': 'traffic',
  '40': 'weather'
};

export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '16-18': [], // Shared selection pool for questions 16, 17, 18
    '19-20': [], // Shared selection pool for questions 19, 20
    '25-27': []  // Shared selection pool for questions 25, 26, 27
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
    if (questionNumber === '16-18') {
      const maxSelections = 3;
      setMultipleAnswers(prev => {
        const current = prev[questionNumber] || [];
        if (current.includes(value)) {
          return { ...prev, [questionNumber]: current.filter(v => v !== value) };
        } else if (current.length < maxSelections) {
          return { ...prev, [questionNumber]: [...current, value] };
        }
        return prev;
      });
    } else if (questionNumber === '19-20') {
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
    } else if (questionNumber === '25-27') {
      const maxSelections = 3;
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
    if (['16', '17', '18'].includes(questionNumber)) {
      const selectedPool = multipleAnswers['16-18'] || [];
      return selectedPool.includes(correctAnswer as string);
    } else if (['19', '20'].includes(questionNumber)) {
      const selectedPool = multipleAnswers['19-20'] || [];
      return selectedPool.includes(correctAnswer as string);
    } else if (['25', '26', '27'].includes(questionNumber)) {
      const selectedPool = multipleAnswers['25-27'] || [];
      return selectedPool.includes(correctAnswer as string);
    } else {
      const userAnswer = answers[questionNumber] || '';
      
      if (!userAnswer || userAnswer.trim() === '') {
        return false;
      }
      
      if (typeof correctAnswer === 'string') {
        // Use the imported answer matching function for better accuracy
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
        testNumber: 1,
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

  const handleReset = () => {
    setAnswers({});
    setMultipleAnswers({
      '16-18': [],
      '19-20': [],
      '25-27': []
    });
    setSubmitted(false);
    setScore(0);
    setCurrentSection(1);
    setIsTestStarted(false);
    setShowResultsPopup(false);
  };

  const handleTestStart = () => {
    setIsTestStarted(true);
  };

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const ieltsScore = getIELTSListeningScore(score);

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[], isMultiSelect = false) => {
    const selectedAnswers = isMultiSelect ? (multipleAnswers[questionNumber] || []) : [answers[questionNumber] || ''];
    
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, etc.
          const isSelected = selectedAnswers.includes(optionLetter.toLowerCase());
          const status = getAnswerStatus(questionNumber);
          
          return (
            <div key={optionLetter} 
                 className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${
                   isSelected 
                     ? status === 'correct' 
                       ? 'bg-green-100 border-green-500' 
                       : status === 'incorrect' 
                         ? 'bg-red-100 border-red-500' 
                         : 'bg-blue-100 border-blue-500'
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
            </div>
          );
        })}
      </div>
    );
  };

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">SECTION 1 - Questions 1–10</CardTitle>
        <p className="text-gray-600">SUMMER MUSIC FESTIVAL BOOKING FORM</p>
      </CardHeader>
      <CardContent>
        {/* Questions 1-2 Multiple Choice */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 1 and 2</p>
          <p className="text-blue-700">Choose the correct letter, A, B or C.</p>
        </div>

        <div className="mb-6">
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <p className="font-semibold mb-2">Example</p>
            <p>In the library George found</p>
            <div className="ml-4">
              <p>A  a book.</p>
              <p><strong>(B)</strong>  a brochure.</p>
              <p>C  a newspaper.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">1. In the lobby of the library George saw</p>
              {renderMultipleChoiceQuestion('1', [
                'a group playing music.',
                'a display of instruments.',
                'a video about the festival.'
              ])}
            </div>

            <div>
              <p className="font-semibold mb-2">2. George wants to sit at the back so they can</p>
              {renderMultipleChoiceQuestion('2', [
                'see well.',
                'hear clearly.',
                'pay less.'
              ])}
            </div>
          </div>
        </div>

        {/* Questions 3-10 Form Completion */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 3–10</p>
          <p className="text-blue-700">Complete the form below.</p>
          <p className="text-blue-700">Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-center font-bold text-lg mb-4 bg-gray-800 text-white p-2">
            SUMMER MUSIC FESTIVAL<br/>BOOKING FORM
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">NAME:</label>
                <p>George O'Neill</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">ADDRESS:</label>
                <div className="flex items-center space-x-2">
                  <span>3</span>
                  <Input
                    placeholder="Question 3"
                    value={answers['3'] || ''}
                    onChange={(e) => handleInputChange('3', e.target.value)}
                    disabled={submitted}
                    className={`flex-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : 
                               getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  <span>, Westsea</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">POSTCODE:</label>
                <Input
                  placeholder="Question 4"
                  value={answers['4'] || ''}
                  onChange={(e) => handleInputChange('4', e.target.value)}
                  disabled={submitted}
                  className={getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : 
                             getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}
                />
              </div>
              <div>
                <label className="font-semibold">TELEPHONE:</label>
                <Input
                  placeholder="Question 5"
                  value={answers['5'] || ''}
                  onChange={(e) => handleInputChange('5', e.target.value)}
                  disabled={submitted}
                  className={getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : 
                             getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}
                />
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-50">Date</th>
                  <th className="border border-gray-300 p-2 bg-gray-50">Event</th>
                  <th className="border border-gray-300 p-2 bg-gray-50">Price per ticket</th>
                  <th className="border border-gray-300 p-2 bg-gray-50">No. of tickets</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">5 June</td>
                  <td className="border border-gray-300 p-2">Instrumental group – Guitarrini</td>
                  <td className="border border-gray-300 p-2">£7.50</td>
                  <td className="border border-gray-300 p-2">2</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">17 June</td>
                  <td className="border border-gray-300 p-2">
                    Singer (price includes <Input
                      placeholder="6"
                      value={answers['6'] || ''}
                      onChange={(e) => handleInputChange('6', e.target.value)}
                      disabled={submitted}
                      className={`inline-block w-32 mx-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : 
                                 getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                    /> in the garden)
                  </td>
                  <td className="border border-gray-300 p-2">£6</td>
                  <td className="border border-gray-300 p-2">2</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">22 June</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      placeholder="7"
                      value={answers['7'] || ''}
                      onChange={(e) => handleInputChange('7', e.target.value)}
                      disabled={submitted}
                      className={`inline-block w-32 mx-1 ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : 
                                 getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                    /> (Anna Ventura)
                  </td>
                  <td className="border border-gray-300 p-2">£7.00</td>
                  <td className="border border-gray-300 p-2">1</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">23 June</td>
                  <td className="border border-gray-300 p-2">Spanish Dance & Guitar Concert</td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      placeholder="8"
                      value={answers['8'] || ''}
                      onChange={(e) => handleInputChange('8', e.target.value)}
                      disabled={submitted}
                      className={`inline-block w-16 mx-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : 
                                 getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                    /> £
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      placeholder="9"
                      value={answers['9'] || ''}
                      onChange={(e) => handleInputChange('9', e.target.value)}
                      disabled={submitted}
                      className={`inline-block w-16 mx-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : 
                                 getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4">
              <p>NB Children / Students / Senior Citizens have 
                <Input
                  placeholder="10"
                  value={answers['10'] || ''}
                  onChange={(e) => handleInputChange('10', e.target.value)}
                  disabled={submitted}
                  className={`inline-block w-16 mx-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : 
                             getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                /> discount on all tickets.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">SECTION 2 - Questions 11–20</CardTitle>
        <p className="text-gray-600">THE DINOSAUR MUSEUM</p>
      </CardHeader>
      <CardContent>
        {/* Questions 11-15 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 11–15</p>
          <p className="text-blue-700">Complete the sentences below.</p>
          <p className="text-blue-700">Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <div className="text-center font-bold text-lg mb-4">The Dinosaur Museum</div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">11</span>
              <span>The museum closes at</span>
              <Input
                placeholder="Question 11"
                value={answers['11'] || ''}
                onChange={(e) => handleInputChange('11', e.target.value)}
                disabled={submitted}
                className={`w-32 ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : 
                           getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
              />
              <span>p.m. on Mondays.</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold">12</span>
              <span>The museum is not open on</span>
              <Input
                placeholder="Question 12"
                value={answers['12'] || ''}
                onChange={(e) => handleInputChange('12', e.target.value)}
                disabled={submitted}
                className={`w-48 ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : 
                           getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
              />
              <span>.</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold">13</span>
              <span>School groups are met by tour guides in the</span>
              <Input
                placeholder="Question 13"
                value={answers['13'] || ''}
                onChange={(e) => handleInputChange('13', e.target.value)}
                disabled={submitted}
                className={`w-32 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : 
                           getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
              />
              <span>.</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold">14</span>
              <span>The whole visit takes 90 minutes, including</span>
              <Input
                placeholder="Question 14"
                value={answers['14'] || ''}
                onChange={(e) => handleInputChange('14', e.target.value)}
                disabled={submitted}
                className={`w-24 ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : 
                           getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
              />
              <span>minutes for the guided tour.</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold">15</span>
              <span>There are</span>
              <Input
                placeholder="Question 15"
                value={answers['15'] || ''}
                onChange={(e) => handleInputChange('15', e.target.value)}
                disabled={submitted}
                className={`w-32 ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : 
                           getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
              />
              <span>behind the museum where students can have lunch.</span>
            </div>
          </div>
        </div>

        {/* Questions 16-18 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 16–18</p>
          <p className="text-blue-700">Choose THREE letters, A–G.</p>
          <p className="text-blue-700">Which THREE things can students have with them in the museum?</p>
        </div>

        <div className="mb-6">
          {renderMultipleChoiceQuestion('16-18', [
            'food',
            'water',
            'cameras',
            'books',
            'bags',
            'pens',
            'worksheets'
          ], true)}
        </div>

        {/* Questions 19-20 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 19 and 20</p>
          <p className="text-blue-700">Choose TWO letters, A–E.</p>
          <p className="text-blue-700">Which TWO activities can students do after the tour at present?</p>
        </div>

        <div>
          {renderMultipleChoiceQuestion('19-20', [
            'build model dinosaurs',
            'watch films',
            'draw dinosaurs',
            'find dinosaur eggs',
            'play computer games'
          ], true)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">SECTION 3 - Questions 21–30</CardTitle>
        <p className="text-gray-600">FIELD TRIP PROPOSAL</p>
      </CardHeader>
      <CardContent>
        {/* Questions 21-24 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 21–24</p>
          <p className="text-blue-700">Choose the correct letter, A, B or C.</p>
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <div className="text-center font-bold text-lg mb-4">Field Trip Proposal</div>
          
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">21. The tutor thinks that Sandra's proposal</p>
              {renderMultipleChoiceQuestion('21', [
                'should be re-ordered in some parts.',
                'needs a contents page.',
                'ought to include more information.'
              ])}
            </div>

            <div>
              <p className="font-semibold mb-2">22. The proposal would be easier to follow if Sandra</p>
              {renderMultipleChoiceQuestion('22', [
                'inserted subheadings.',
                'used more paragraphs.',
                'shortened her sentences.'
              ])}
            </div>

            <div>
              <p className="font-semibold mb-2">23. What was the problem with the formatting on Sandra's proposal?</p>
              {renderMultipleChoiceQuestion('23', [
                'Separate points were not clearly identified.',
                'The headings were not always clear.',
                'Page numbering was not used in an appropriate way.'
              ])}
            </div>

            <div>
              <p className="font-semibold mb-2">24. Sandra became interested in visiting the Navajo National Park through</p>
              {renderMultipleChoiceQuestion('24', [
                'articles she read.',
                'movies she saw as a child.',
                'photographs she found on the internet.'
              ])}
            </div>
          </div>
        </div>

        {/* Questions 25-27 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 25–27</p>
          <p className="text-blue-700">Choose THREE letters, A–G.</p>
          <p className="text-blue-700">Which THREE topics does Sandra agree to include in the proposal?</p>
        </div>

        <div className="mb-6">
          {renderMultipleChoiceQuestion('25-27', [
            'climate change',
            'field trip activities',
            'geographical features',
            'impact of tourism',
            'myths and legends',
            'plant and animal life',
            'social history'
          ], true)}
        </div>

        {/* Questions 28-30 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Questions 28–30</p>
          <p className="text-blue-700">Complete the sentences below.</p>
          <p className="text-blue-700">Write ONE WORD AND/OR A NUMBER for each answer.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">28</span>
            <span>The tribal park covers</span>
            <Input
              placeholder="Question 28"
              value={answers['28'] || ''}
              onChange={(e) => handleInputChange('28', e.target.value)}
              disabled={submitted}
              className={`w-32 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : 
                         getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
            />
            <span>hectares.</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold">29</span>
            <span>Sandra suggests that they share the</span>
            <Input
              placeholder="Question 29"
              value={answers['29'] || ''}
              onChange={(e) => handleInputChange('29', e.target.value)}
              disabled={submitted}
              className={`w-32 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : 
                         getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
            />
            <span>for transport.</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold">30</span>
            <span>She says they could also explore the local</span>
            <Input
              placeholder="Question 30"
              value={answers['30'] || ''}
              onChange={(e) => handleInputChange('30', e.target.value)}
              disabled={submitted}
              className={`w-32 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : 
                         getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
            />
            <span>.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">SECTION 4 - Questions 31–40</CardTitle>
        <p className="text-gray-600">GEOGRAPHY</p>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">Complete the notes below.</p>
          <p className="text-blue-700">Write ONE WORD ONLY for each answer.</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-center font-bold text-lg mb-4 bg-gray-800 text-white p-2">Geography</div>
          
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Studying geography helps us to understand:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li className="flex items-center space-x-2">
                  <span>the effects of different processes on the</span>
                  <Input
                    placeholder="31"
                    value={answers['31'] || ''}
                    onChange={(e) => handleInputChange('31', e.target.value)}
                    disabled={submitted}
                    className={`w-32 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : 
                               getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  <span>of the Earth</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>the dynamic between</span>
                  <Input
                    placeholder="32"
                    value={answers['32'] || ''}
                    onChange={(e) => handleInputChange('32', e.target.value)}
                    disabled={submitted}
                    className={`w-32 ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : 
                               getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  <span>and population</span>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">Two main branches of study:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>physical features</li>
                <li className="flex items-center space-x-2">
                  <span>human lifestyles and their</span>
                  <Input
                    placeholder="33"
                    value={answers['33'] || ''}
                    onChange={(e) => handleInputChange('33', e.target.value)}
                    disabled={submitted}
                    className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : 
                               getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                  />
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">Specific study areas:</p>
              <p className="flex items-center space-x-2">
                <span>biophysical, topographic, political, social, economic, historical and</span>
                <Input
                  placeholder="34"
                  value={answers['34'] || ''}
                  onChange={(e) => handleInputChange('34', e.target.value)}
                  disabled={submitted}
                  className={`w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : 
                             getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                />
                <span>geography, and also cartography</span>
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Key point:</p>
              <p className="flex items-center space-x-2">
                <span>geography helps us to understand our surroundings and the associated</span>
                <Input
                  placeholder="35"
                  value={answers['35'] || ''}
                  onChange={(e) => handleInputChange('35', e.target.value)}
                  disabled={submitted}
                  className={`w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : 
                             getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                />
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">What do geographers do?</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li className="flex items-center space-x-2">
                  <span>find data – e.g. conduct censuses, collect information in the form of</span>
                  <Input
                    placeholder="36"
                    value={answers['36'] || ''}
                    onChange={(e) => handleInputChange('36', e.target.value)}
                    disabled={submitted}
                    className={`w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : 
                               getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  <span>using computer and satellite technology</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>analyse data – identify</span>
                  <Input
                    placeholder="37"
                    value={answers['37'] || ''}
                    onChange={(e) => handleInputChange('37', e.target.value)}
                    disabled={submitted}
                    className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : 
                               getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  <span>, e.g. cause and effect</span>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">publish findings in form of:</p>
              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium">a) maps</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>easy to carry</li>
                    <li>can show physical features of large and small areas</li>
                    <li className="flex items-center space-x-2">
                      <span>BUT a two-dimensional map will always have some</span>
                      <Input
                        placeholder="38"
                        value={answers['38'] || ''}
                        onChange={(e) => handleInputChange('38', e.target.value)}
                        disabled={submitted}
                        className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : 
                                   getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                      />
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">b) aerial photos</p>
                  <ul className="list-disc list-inside ml-4">
                    <li className="flex items-center space-x-2">
                      <span>can show vegetation problems,</span>
                      <Input
                        placeholder="39"
                        value={answers['39'] || ''}
                        onChange={(e) => handleInputChange('39', e.target.value)}
                        disabled={submitted}
                        className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : 
                                   getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                      />
                      <span>density, ocean floor etc.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">c) Landsat pictures sent to receiving stations</p>
                  <ul className="list-disc list-inside ml-4">
                    <li className="flex items-center space-x-2">
                      <span>used for monitoring</span>
                      <Input
                        placeholder="40"
                        value={answers['40'] || ''}
                        onChange={(e) => handleInputChange('40', e.target.value)}
                        disabled={submitted}
                        className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : 
                                   getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                      />
                      <span>conditions etc.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
              Cambridge IELTS 8 - Listening Test 1
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
          audioSrc={AUDIO_URLS.book8.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 8 - Listening Test 1"
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
                disabled={!isTestStarted && !submitted}
              >
                Section {section}
              </Button>
            ))}
          </div>
          {!isTestStarted && !submitted && (
            <div className="text-center mt-2">
              <p className="text-sm text-blue-600">
                ⚠ Section navigation will be enabled after you start the test.
              </p>
            </div>
          )}
        </div>

        {/* Test Content */}
        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center text-yellow-800">
                🎧 Please start the audio player above to begin the test. You will have 30 minutes to complete all 40 questions.
                <br />
                📝 Remember to transfer your answers carefully and check your spelling.
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Current Section */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">{score}</div>
                    <div className="text-sm text-gray-600">Raw Score</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">{getIELTSListeningScore(score)}</div>
                    <div className="text-sm text-gray-600">IELTS Band</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-purple-600">{Math.round((score / 40) * 100)}%</div>
                    <div className="text-sm text-gray-600">Percentage</div>
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

      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-8"
        module="listening"
        testNumber={1}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-8"
          module="listening"
          testNumber={1}
        />
        <UserTestHistory 
          book="book-8"
          module="listening"
          testNumber={1}
        />
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
                  <div className="text-3xl font-bold text-purple-600">{Math.round((score / 40) * 100)}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(correctAnswers).map((questionNum) => {
                  const isCorrect = checkAnswer(questionNum);
                  
                  let userAnswer = '';
                  if (['16', '17', '18'].includes(questionNum)) {
                    const pool = multipleAnswers['16-18'] || [];
                    const questionIndex = ['16', '17', '18'].indexOf(questionNum);
                    userAnswer = pool[questionIndex] || '';
                  } else if (['19', '20'].includes(questionNum)) {
                    const pool = multipleAnswers['19-20'] || [];
                    const questionIndex = ['19', '20'].indexOf(questionNum);
                    userAnswer = pool[questionIndex] || '';
                  } else if (['25', '26', '27'].includes(questionNum)) {
                    const pool = multipleAnswers['25-27'] || [];
                    const questionIndex = ['25', '26', '27'].indexOf(questionNum);
                    userAnswer = pool[questionIndex] || '';
                  } else {
                    userAnswer = answers[questionNum] || '';
                  }
                  
                  const correctAnswer = correctAnswers[questionNum] as string;
                  
                  return (
                    <div key={questionNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="font-semibold text-sm">Q{questionNum}</div>
                      <div className="text-xs mt-1">
                        <div className={`${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          Your: {userAnswer || '(blank)'}
                        </div>
                        <div className="text-gray-600">
                          Correct: {correctAnswer}
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
    </div>
  );
}
