'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';

// Correct answers for all questions based on the provided images
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'waiter(s)',
  '2': 'day off',
  '3': 'break',
  '4': '(free) meal',
  '5': 'dark (coloured/colored)',
  '6': 'jacket',
  '7': '28 June',
  '8': 'Urwin',
  '9': '12.00 (pm)/noon/mid-day',
  '10': 'reference',
  
  // Section 2: Questions 11-20
  '11': 'A',
  '12': 'B',
  '13': 'B',
  '14': 'C',
  '15': 'D',
  '16': 'G',
  '17': 'B',
  '18': 'F',
  '19': 'A',
  '20': 'E',
  
  // Section 3: Questions 21-30
  '21&22': ['B', 'E'], // Questions 21&22 IN EITHER ORDER - Multi-select question
  '23&24': ['A', 'C'], // Questions 23&24 IN EITHER ORDER - Multi-select question
  '25': 'B',
  '26': 'C',
  '27': 'priorities',
  '28': 'timetable',
  '29': '(small) tasks',
  '30': '(single) paragraph',
  
  // Section 4: Questions 31-40
  '31': 'C',
  '32': 'B',
  '33': 'C',
  '34': 'A',
  '35': 'B',
  '36': 'B',
  '37': 'animal/creature',
  '38': 'sea/water level(s)',
  '39': 'hunting',
  '40': 'creation'
};

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21&22': [],
    '23&24': []
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []); // Empty dependency array to run only once

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value.toLowerCase()
    }));
  };

  const handleMultiSelect = (questionKey: string, value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const isSelected = currentAnswers.includes(value);
        const maxSelections = 2;

        if (isSelected) {
            return { ...prev, [questionKey]: currentAnswers.filter(ans => ans !== value) };
        } else if (currentAnswers.length < maxSelections) {
            return { ...prev, [questionKey]: [...currentAnswers, value] };
        }
        return prev;
    });
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber];
    
    const userAnswer = answers[questionNumber] || '';
    
    // If no answer provided, return false
    if (!userAnswer || userAnswer.trim() === '') {
      return false;
    }
    
    if (typeof correctAnswer === 'string') {
      // For multiple choice questions (uppercase letters)
      if (['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '25', '26', '31', '32', '33', '34', '35', '36'].includes(questionNumber)) {
        return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
      }
      
      // For text answers, use the imported answer matching function
      return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
    }
    
    return false;
  };

  const getMultiSelectStatus = (questionKey: string) => {
      if (!submitted) return 'default';
      const userChoices = multipleAnswers[questionKey] || [];
      const correctChoices = correctAnswers[questionKey] as string[];
      const correctCount = userChoices.filter(c => correctChoices.includes(c)).length;
      
      if (correctCount === correctChoices.length && userChoices.length === correctChoices.length) return 'correct';
      if (correctCount > 0) return 'partial';
      return 'incorrect';
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Handle single-answer questions
    for (let i = 1; i <= 40; i++) {
        const qNumStr = String(i);
        if (qNumStr === '21' || qNumStr === '22' || qNumStr === '23' || qNumStr === '24') continue; // Skip multi-select questions

        if (answers[qNumStr] !== undefined && correctAnswers[qNumStr] !== undefined) {
          const userAnswer = answers[qNumStr] || '';
          const correctAnswer = correctAnswers[qNumStr];
          
          // If no answer provided, skip
          if (!userAnswer || userAnswer.trim() === '') {
            continue;
          }
          
          if (typeof correctAnswer === 'string') {
            // For multiple choice questions (uppercase letters)
            if (['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '25', '26', '31', '32', '33', '34', '35', '36'].includes(qNumStr)) {
              if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                correctCount++;
              }
            } else {
              // For text answers, use the imported answer matching function
              if (checkAnswerWithMatching(userAnswer, correctAnswer, qNumStr)) {
                correctCount++;
              }
            }
          }
        }
    }

    // Handle multi-select questions (21 & 22, 23 & 24)
    const userChoices2122 = multipleAnswers['21&22'] || [];
    const correctChoices2122 = correctAnswers['21&22'] as string[];
    userChoices2122.forEach(choice => {
        if (correctChoices2122.includes(choice)) {
            correctCount++;
        }
    });

    const userChoices2324 = multipleAnswers['23&24'] || [];
    const correctChoices2324 = correctAnswers['23&24'] as string[];
    userChoices2324.forEach(choice => {
        if (correctChoices2324.includes(choice)) {
            correctCount++;
        }
    });
    
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
        multipleAnswers: multipleAnswers || {},
        results: [
          // Handle individual questions 1-20, 25-40
          ...Array.from({length: 40}, (_, i) => i + 1)
            .filter(num => ![21, 22, 23, 24].includes(num))
            .map(num => {
              const questionNum = String(num);
              return {
                questionNumber: questionNum,
                userAnswer: answers[questionNum] || '',
                correctAnswer: correctAnswers[questionNum] || '',
                isCorrect: correctAnswers[questionNum] ? checkAnswer(questionNum) : false
              };
            }),
          // Handle multi-select questions
          {
            questionNumber: '21&22',
            userAnswer: (multipleAnswers['21&22'] || []).join(', '),
            correctAnswer: (correctAnswers['21&22'] as string[]).join(', '),
            isCorrect: getMultiSelectStatus('21&22') === 'correct'
          },
          {
            questionNumber: '23&24', 
            userAnswer: (multipleAnswers['23&24'] || []).join(', '),
            correctAnswer: (correctAnswers['23&24'] as string[]).join(', '),
            isCorrect: getMultiSelectStatus('23&24') === 'correct'
          }
        ],
        score: calculatedScore,
        totalQuestions: 40, // Fixed total questions count
        percentage: Math.round((calculatedScore / 40) * 100),
        timeTaken
      };
      
      // Save to database
      const saveResult = await saveTestScore({
        userId: session?.user?.id || null,
        book: 'book-8',
        module: 'listening',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined
      });
      
      if (saveResult.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', saveResult.error);
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

  const ieltsScore = getIELTSListeningScore(score);

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[], isMultiSelect = false) => {
    const selectedAnswers = isMultiSelect ? (multipleAnswers[questionNumber] || []) : [answers[questionNumber] || ''];
    
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionValue = String.fromCharCode(65 + index); // A, B, C, etc.
          const isSelected = selectedAnswers.includes(optionValue);
          
          return (
            <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
              <input
                type={isMultiSelect ? "checkbox" : "radio"}
                name={`question-${questionNumber}`}
                value={optionValue}
                checked={isSelected}
                onChange={() => handleMultipleChoice(questionNumber, optionValue)}
                disabled={!isTestStarted || isSubmitting}
                className="w-4 h-4"
              />
              <span className="text-sm">{optionValue}. {option}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="font-bold text-center text-lg mb-4">West Bay Hotel – details of job</h3>
          
          <div className="bg-white p-3 rounded mb-4">
            <div className="flex gap-4">
              <strong>Example</strong>
              <div className="flex-1">
                <span>Newspaper advert for </span>
                <span className="underline font-medium">temporary</span>
                <span> staff</span>
              </div>
              <strong>Answer</strong>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span>• Vacancies for</span>
              <div className="flex items-center gap-2">
                <span>1</span>
                <Input
                  type="text"
                  value={answers['1'] || ''}
                  onChange={(e) => handleInputChange('1', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('1') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('1') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>• Two shifts</span>
            </div>

            <div className="flex items-center gap-2">
              <span>• Can choose your</span>
              <div className="flex items-center gap-2">
                <span>2</span>
                <Input
                  type="text"
                  value={answers['2'] || ''}
                  onChange={(e) => handleInputChange('2', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('2') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('2') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <span>(must be the same each week)</span>
            </div>

            <div className="flex items-center gap-2">
              <span>• Pay: £5.50 per hour, including a</span>
              <div className="flex items-center gap-2">
                <span>3</span>
                <Input
                  type="text"
                  value={answers['3'] || ''}
                  onChange={(e) => handleInputChange('3', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('3') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('3') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>• A</span>
              <div className="flex items-center gap-2">
                <span>4</span>
                <Input
                  type="text"
                  value={answers['4'] || ''}
                  onChange={(e) => handleInputChange('4', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('4') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('4') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <span>is provided in the hotel</span>
            </div>

            <div className="flex items-center gap-2">
              <span>• Total weekly pay: £231</span>
            </div>

            <div className="flex items-center gap-2">
              <span>• Dress: a white shirt and</span>
              <div className="flex items-center gap-2">
                <span>5</span>
                <Input
                  type="text"
                  value={answers['5'] || ''}
                  onChange={(e) => handleInputChange('5', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('5') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('5') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <span>trousers (not supplied)</span>
            </div>

            <div className="flex items-center gap-2 ml-8">
              <span>a</span>
              <div className="flex items-center gap-2">
                <span>6</span>
                <Input
                  type="text"
                  value={answers['6'] || ''}
                  onChange={(e) => handleInputChange('6', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('6') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('6') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <span>(supplied)</span>
            </div>

            <div className="flex items-center gap-2">
              <span>• Starting date:</span>
              <div className="flex items-center gap-2">
                <span>7</span>
                <Input
                  type="text"
                  value={answers['7'] || ''}
                  onChange={(e) => handleInputChange('7', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('7') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('7') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>• Call Jane</span>
              <div className="flex items-center gap-2">
                <span>8</span>
                <Input
                  type="text"
                  value={answers['8'] || ''}
                  onChange={(e) => handleInputChange('8', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('8') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('8') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <span>(Service Manager) before</span>
              <div className="flex items-center gap-2">
                <span>9</span>
                <Input
                  type="text"
                  value={answers['9'] || ''}
                  onChange={(e) => handleInputChange('9', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('9') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('9') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-8">
              <span>tomorrow (Tel: 832009)</span>
            </div>

            <div className="flex items-center gap-2">
              <span>• She'll require a</span>
              <div className="flex items-center gap-2">
                <span>10</span>
                <Input
                  type="text"
                  value={answers['10'] || ''}
                  onChange={(e) => handleInputChange('10', e.target.value)}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-32 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`}
                />
                {submitted && getAnswerStatus('10') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus('10') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 2 - Questions 11-20</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Questions 11-13 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 11-13</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-center text-lg mb-4">Improvements to Red Hill Suburb</h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-medium mb-2">11. Community groups are mainly concerned about</p>
              <div className={`${getAnswerStatus('11') === 'correct' ? 'bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {renderMultipleChoiceQuestion('11', [
                  'pedestrian safety.',
                  'traffic jams.',
                  'increased pollution.'
                ])}
                {submitted && (
                  <div className="mt-2 flex items-center gap-2">
                    {getAnswerStatus('11') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm text-gray-600">Correct answer: A</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">12. It has been decided that the overhead power lines will be</p>
              <div className={`${getAnswerStatus('12') === 'correct' ? 'bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {renderMultipleChoiceQuestion('12', [
                  'extended.',
                  'buried.',
                  'repaired.'
                ])}
                {submitted && (
                  <div className="mt-2 flex items-center gap-2">
                    {getAnswerStatus('12') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm text-gray-600">Correct answer: B</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">13. The expenses related to the power lines will be paid for by</p>
              <div className={`${getAnswerStatus('13') === 'correct' ? 'bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {renderMultipleChoiceQuestion('13', [
                  'the council.',
                  'the power company.',
                  'local businesses.'
                ])}
                {submitted && (
                  <div className="mt-2 flex items-center gap-2">
                    {getAnswerStatus('13') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm text-gray-600">Correct answer: B</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Questions 14-20 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 14-20</h4>
          <p className="text-sm mb-4">Label the map below.</p>
          <p className="text-sm font-semibold mb-4">Write the correct letter, A-H, next to questions 14-20.</p>
           
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-center text-lg mb-4">Red Hill Improvement Plan</h3>
            <div className="text-center">
              <p className="text-sm text-gray-600">[Map would be displayed here showing areas labeled A through H]</p>
              <p className="text-xs text-gray-500 mt-2">
                Areas include: Evelyn Street, Hill Street, Days Road, Carberry Street, Thomas Street with various buildings and improvement zones marked A-H
              </p>
            </div>
            <div className="text-center  mt-2">
              <img 
                src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/listening/test4/map.png" 
                alt="Agricultural Park Map" 
                className="mx-auto max-w-full h-auto rounded border shadow-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '14', label: 'trees' },
              { num: '15', label: 'wider footpaths' },
              { num: '16', label: 'coloured road surface' },
              { num: '17', label: 'new sign' },
              { num: '18', label: 'traffic lights' },
              { num: '19', label: 'artwork' },
              { num: '20', label: "children's playground" }
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-2">
                <span className="w-6">{num}</span>
                <span className="flex-1">{label}</span>
                <Input
                  type="text"
                  value={answers[num] || ''}
                  onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-16 text-center ${getAnswerStatus(num) === 'correct' ? 'border-green-500' : getAnswerStatus(num) === 'incorrect' ? 'border-red-500' : ''}`}
                  maxLength={1}
                />
                {submitted && getAnswerStatus(num) === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus(num) === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 3 - Questions 21-30</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Questions 21 and 22 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 21 and 22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">In which TWO ways is Dan financing his course?</p>
          
          <div className={`${getMultiSelectStatus('21&22') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('21&22') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
            <div className="space-y-2">
              {[
                'He is receiving money from the government.',
                'His family are willing to help him.',
                'The college is giving him a small grant.',
                'His local council is supporting him for a limited period.',
                'A former employer is providing partial funding.'
              ].map((option, index) => {
                const optionValue = String.fromCharCode(65 + index);
                const isSelected = (multipleAnswers['21&22'] || []).includes(optionValue);
                
                return (
                  <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isSelected}
                      onChange={() => handleMultiSelect('21&22', optionValue)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{optionValue}. {option}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-2 flex items-center gap-2">
                {getMultiSelectStatus('21&22') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-gray-600">Correct answers: B and E (in either order)</span>
              </div>
            )}
          </div>
        </div>

        {/* Questions 23 and 24 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 23 and 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO reasons does Jeannie give for deciding to leave some college clubs?</p>
          
          <div className={`${getMultiSelectStatus('23&24') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('23&24') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
            <div className="space-y-2">
              {[
                'She is not sufficiently challenged.',
                'The activity interferes with her studies.',
                'She does not have enough time.',
                'The activity is too demanding physically.',
                'She does not think she is any good at the activity.'
              ].map((option, index) => {
                const optionValue = String.fromCharCode(65 + index);
                const isSelected = (multipleAnswers['23&24'] || []).includes(optionValue);
                
                return (
                  <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isSelected}
                      onChange={() => handleMultiSelect('23&24', optionValue)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{optionValue}. {option}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-2 flex items-center gap-2">
                {getMultiSelectStatus('23&24') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-gray-600">Correct answers: A and C (in either order)</span>
              </div>
            )}
          </div>
        </div>

        {/* Questions 25 and 26 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 25 and 26</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>

          <div className="space-y-6">
            <div>
              <p className="font-medium mb-2">25. What does Dan say about the seminars on the course?</p>
              <div className={`${getAnswerStatus('25') === 'correct' ? 'bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {renderMultipleChoiceQuestion('25', [
                  'The other students do not give him a chance to speak.',
                  'The seminars make him feel inferior to the other students.',
                  'The preparation for seminars takes too much time.'
                ])}
                {submitted && (
                  <div className="mt-2 flex items-center gap-2">
                    {getAnswerStatus('25') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm text-gray-600">Correct answer: B</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">26. What does Jeannie say about the tutorials on the course?</p>
              <div className={`${getAnswerStatus('26') === 'correct' ? 'bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {renderMultipleChoiceQuestion('26', [
                  'They are an inefficient way of providing guidance.',
                  'They are more challenging than she had expected.',
                  'They are helping her to develop her study skills.'
                ])}
                {submitted && (
                  <div className="mt-2 flex items-center gap-2">
                    {getAnswerStatus('26') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm text-gray-600">Correct answer: C</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Questions 27-30 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 27-30</h4>
          <p className="text-sm mb-4">Complete the flow-chart below.</p>
          <p className="text-sm font-semibold mb-4">Choose NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
          
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="font-bold text-center text-lg mb-6">Advice on exam preparation</h3>
            
            <div className="space-y-4">
              <div className="bg-white p-3 rounded border text-center">
                Make sure you know the exam requirements
              </div>
              
              <div className="text-center">↓</div>
              
              <div className="bg-white p-3 rounded border text-center">
                Find some past papers
              </div>
              
              <div className="text-center">↓</div>
              
              <div className="bg-white p-3 rounded border text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Work out your</span>
                  <div className="flex items-center gap-2">
                    <span>27</span>
                    <Input
                      type="text"
                      value={answers['27'] || ''}
                      onChange={(e) => handleInputChange('27', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className={`w-24 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                    {submitted && getAnswerStatus('27') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('27') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <span>for revision</span>
                </div>
                <div className="mt-2">and write them on a card</div>
              </div>
              
              <div className="text-center">↓</div>
              
              <div className="bg-white p-3 rounded border text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Make a</span>
                  <div className="flex items-center gap-2">
                    <span>28</span>
                    <Input
                      type="text"
                      value={answers['28'] || ''}
                      onChange={(e) => handleInputChange('28', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className={`w-24 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                    {submitted && getAnswerStatus('28') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('28') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <span>and keep it in view</span>
                </div>
              </div>
              
              <div className="text-center">↓</div>
              
              <div className="bg-white p-3 rounded border text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Divide revision into</span>
                  <div className="flex items-center gap-2">
                    <span>29</span>
                    <Input
                      type="text"
                      value={answers['29'] || ''}
                      onChange={(e) => handleInputChange('29', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className={`w-24 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                    {submitted && getAnswerStatus('29') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('29') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <span>for each day</span>
                </div>
              </div>
              
              <div className="text-center">↓</div>
              
              <div className="bg-white p-3 rounded border text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Write one</span>
                  <div className="flex items-center gap-2">
                    <span>30</span>
                    <Input
                      type="text"
                      value={answers['30'] || ''}
                      onChange={(e) => handleInputChange('30', e.target.value)}
                      disabled={!isTestStarted || isSubmitting}
                      className={`w-24 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                    {submitted && getAnswerStatus('30') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('30') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <span>about each topic</span>
                </div>
              </div>
              
              <div className="text-center">↓</div>
              
              <div className="bg-white p-3 rounded border text-center">
                Practise writing some exam answers
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 4 - Questions 31-40</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Questions 31-36 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 31-36</h4>
          <p className="text-sm mb-4">Which painting styles have the following features?</p>
          <p className="text-sm font-semibold mb-4">Write the correct letter, A, B or C, next to questions 31-36.</p>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-center text-lg mb-4">Australian Aboriginal Rock Paintings</h3>
            
            <div className="bg-white p-4 rounded mb-4">
              <h4 className="font-bold text-center mb-2">Painting Styles</h4>
              <div className="text-center space-y-1">
                <div>A &nbsp; Dynamic</div>
                <div>B &nbsp; Yam</div>
                <div>C &nbsp; Modern</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Features</h4>
            
            {[
              { num: '31', feature: 'figures revealing bones' },
              { num: '32', feature: 'rounded figures' },
              { num: '33', feature: 'figures with parts missing' },
              { num: '34', feature: 'figures smaller than life size' },
              { num: '35', feature: 'sea creatures' },
              { num: '36', feature: 'plants' }
            ].map(({ num, feature }) => (
              <div key={num} className="flex items-center gap-4">
                <span className="w-6">{num}</span>
                <span className="flex-1">{feature}</span>
                <Input
                  type="text"
                  value={answers[num] || ''}
                  onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-16 text-center ${getAnswerStatus(num) === 'correct' ? 'border-green-500' : getAnswerStatus(num) === 'incorrect' ? 'border-red-500' : ''}`}
                  maxLength={1}
                />
                {submitted && getAnswerStatus(num) === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus(num) === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Questions 37-40 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 37-40</h4>
          <p className="text-sm mb-4">Complete the notes below.</p>
          <p className="text-sm font-semibold mb-4">Write NO MORE THAN TWO WORDS for each answer.</p>
          
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="font-bold text-center text-lg mb-4">Rainbow Serpent Project</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span><strong>Aim of project:</strong> to identify the</span>
                <div className="flex items-center gap-2">
                  <span>37</span>
                  <Input
                    type="text"
                    value={answers['37'] || ''}
                    onChange={(e) => handleInputChange('37', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  {submitted && getAnswerStatus('37') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('37') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
                <span>used as the basis for the Rainbow Serpent</span>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Yam Period</h4>
                <div className="space-y-3 ml-4">
                  <div className="flex items-center gap-2">
                    <span>• environmental changes led to higher</span>
                    <div className="flex items-center gap-2">
                      <span>38</span>
                      <Input
                        type="text"
                        value={answers['38'] || ''}
                        onChange={(e) => handleInputChange('38', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`}
                      />
                      {submitted && getAnswerStatus('38') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {submitted && getAnswerStatus('38') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>• traditional activities were affected, especially</span>
                    <div className="flex items-center gap-2">
                      <span>39</span>
                      <Input
                        type="text"
                        value={answers['39'] || ''}
                        onChange={(e) => handleInputChange('39', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`}
                      />
                      {submitted && getAnswerStatus('39') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {submitted && getAnswerStatus('39') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Rainbow Serpent image</h4>
                <div className="space-y-3 ml-4">
                  <div>• similar to a sea horse</div>
                  <div>• unusual because it appeared in inland areas</div>
                  <div className="flex items-center gap-2">
                    <span>• symbolises</span>
                    <div className="flex items-center gap-2">
                      <span>40</span>
                      <Input
                        type="text"
                        value={answers['40'] || ''}
                        onChange={(e) => handleInputChange('40', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`}
                      />
                      {submitted && getAnswerStatus('40') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {submitted && getAnswerStatus('40') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <span>in Aboriginal culture</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 8 - Test 4 Listening</h1>
        </div>

        {/* Audio Player */}
         {/* Audio Player */}
        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book8.test4}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={isSubmitting}
          testDuration={30}
          title="Cambridge IELTS 8 - Listening Test 4"
        />
        {/* Test Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>This test has 4 sections with 40 questions total</li>
              <li>You will hear each section only once</li>
              <li>Answer all questions as you listen</li>
              <li>You have 10 minutes at the end to transfer your answers</li>
              <li>Write your answers in the spaces provided</li>
            </ul>
          </CardContent>
        </Card>

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

        {/* Submit Button */}
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={handleSubmit}
            disabled={!isTestStarted || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
         
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
                  {/* Render all questions in sequential order 1-40 */}
                  {Array.from({length: 40}, (_, i) => i + 1).map(num => {
                    const questionNum = String(num);
                    
                    // Handle multi-select questions 21-24
                    if ([21, 22, 23, 24].includes(num)) {
                      const key = num <= 22 ? '21&22' : '23&24';
                      const correctAnswers_group = num <= 22 ? ['B', 'E'] : ['A', 'C'];
                      const index = num <= 22 ? (num - 21) : (num - 23);
                      const correctAnswer_single = correctAnswers_group[index];
                      const userAnswers_multi = multipleAnswers[key] || [];
                      const userSelected = userAnswers_multi.includes(correctAnswer_single);
                      const isCorrect_single = userSelected;
                      
                      return (
                        <div 
                          key={questionNum}
                          className={`p-3 rounded border ${isCorrect_single ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Q{questionNum}</span>
                            {isCorrect_single ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="text-sm">
                            <div className="mb-1">
                              <span className="text-gray-600">Your answer: </span>
                              <span className={isCorrect_single ? 'text-green-700' : 'text-red-700'}>
                                {userAnswers_multi.join(', ') || 'No answer'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Correct: </span>
                              <span className="text-green-700 font-medium">{correctAnswer_single}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle regular individual questions
                    const correctAnswer = correctAnswers[questionNum];
                    const userAnswer = answers[questionNum] || '';
                    const isCorrect = correctAnswer ? checkAnswer(questionNum) : false;
                    const displayCorrectAnswer = Array.isArray(correctAnswer) 
                      ? correctAnswer.join(', ')
                      : correctAnswer;
                    
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
                            <span className="text-green-700 font-medium">{displayCorrectAnswer}</span>
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
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-8"
        module="listening"
        testNumber={4}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-8"
          module="listening"
          testNumber={4}
        />
        <UserTestHistory 
          book="book-8"
          module="listening"
          testNumber={4}
        />
      </div>
    </div>
  );
}
