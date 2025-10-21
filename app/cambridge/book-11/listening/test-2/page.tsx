'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { TestStatistics } from '@/components/analytics/TestStatistics';
import { UserTestHistory } from '@/components/analytics/UserTestHistory';

// Correct answers for Cambridge 11, Listening Test 2
const correctAnswers: { [key: string]: string } = {
  // Section 1
  '1': 'hostel',
  '2': 'Buckleigh',
  '3': 'PE9 7QT',
  '4': 'waiter',
  '5': 'politics',
  '6': 'cycling',
  '7': 'cinema',
  '8': 'disabled',
  '9': '4.30 (pm)/half past four',
  '10': '07788136711',

  // Section 2
  '11': 'A', '12': 'B',
  '13': 'B', '14': 'D',
  '15': 'C', '16': 'E',
  '17': 'G',
  '18': 'D',
  '19': 'B',
  '20': 'F',

  // Section 3
  '21': 'A',
  '22': 'A',
  '23': 'C',
  '24': 'B',
  '25': 'B',
  '26': 'B',
  '27': 'A', '28': 'D',
  '29': 'C', '30': 'E',

  // Section 4
  '31': 'social',
  '32': 'factory',
  '33': 'canal',
  '34': 'bridge',
  '35': 'box',
  '36': 'screen',
  '37': 'rubber',
  '38': 'curved',
  '39': 'curtains',
  '40': 'international',
};

// Configuration for questions that require multiple answers in any order
const groupedAnswerConfig: { [key: string]: { questions: string[]; answers: string[] } } = {
  '11-12': { questions: ['11', '12'], answers: ['A', 'B'] },
  '13-14': { questions: ['13', '14'], answers: ['B', 'D'] },
  '15-16': { questions: ['15', '16'], answers: ['C', 'E'] },
  '27-28': { questions: ['27', '28'], answers: ['A', 'D'] },
  '29-30': { questions: ['29', '30'], answers: ['C', 'E'] },
};

// Create a reverse map for easy lookup
const questionToGroupMap: { [key: string]: string } = {};
Object.entries(groupedAnswerConfig).forEach(([groupKey, config]) => {
  config.questions.forEach(q => {
    questionToGroupMap[q] = groupKey;
  });
});

export default function Test2Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '11-12': [], '13-14': [], '15-16': [], '27-28': [], '29-30': [],
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
  }, []);

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };
  
  const handleMultipleAnswerChange = (groupKey: string, value: string) => {
    setMultipleAnswers(prev => {
      const currentSelection = prev[groupKey] || [];
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(v => v !== value)
        : [...currentSelection, value];
      
      // Limit to 2 selections
      if (newSelection.length > 2) {
        return prev;
      }
      return { ...prev, [groupKey]: newSelection };
    });
  };

  const checkSingleAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber]?.trim() || '';
    if (!userAnswer) return false;
    return checkAnswerWithMatching(userAnswer, correctAnswers[questionNumber], questionNumber);
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const groupKey = questionToGroupMap[questionNumber];
    if (groupKey) {
      return checkGroupedAnswers(groupKey);
    }
    return checkSingleAnswer(questionNumber);
  };
  
  const checkGroupedAnswers = (groupKey: string): boolean => {
    const userSelection = (multipleAnswers[groupKey] || []).sort();
    const correctSelection = groupedAnswerConfig[groupKey].answers.sort();
    // Check if user got the complete set correct (for full points)
    return userSelection.length === correctSelection.length && userSelection.every((val, index) => val === correctSelection[index]);
  };

  const checkGroupedAnswersPartial = (groupKey: string): boolean => {
    const userSelection = multipleAnswers[groupKey] || [];
    const correctSelection = groupedAnswerConfig[groupKey].answers;
    // Check if at least one answer is correct
    return userSelection.some(answer => correctSelection.includes(answer));
  };

  const calculateScore = () => {
    let correctCount = 0;
    const countedQuestions = new Set<string>();

    // Score grouped questions
    Object.keys(groupedAnswerConfig).forEach(groupKey => {
      if (checkGroupedAnswers(groupKey)) {
        // Full marks - both answers correct
        correctCount += 2;
      } else if (checkGroupedAnswersPartial(groupKey)) {
        // Partial marks - at least one answer correct
        correctCount += 1;
      }
      groupedAnswerConfig[groupKey].questions.forEach(q => countedQuestions.add(q));
    });

    // Score single questions
    Object.keys(correctAnswers).forEach(questionNumber => {
      if (!countedQuestions.has(questionNumber)) {
        if (checkSingleAnswer(questionNumber)) {
          correctCount++;
        }
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
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || multipleAnswers?.[questionNum] || '',
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
        book: 'book-11',
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
  
  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    const groupKey = questionToGroupMap[questionNumber];
    if (groupKey) {
      if (checkGroupedAnswers(groupKey)) {
        return 'correct';
      } else if (checkGroupedAnswersPartial(groupKey)) {
        return 'partial';
      } else {
        return 'incorrect';
      }
    }
    return checkSingleAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const getInputBorderClass = (questionNumber: string) => {
    if (!submitted) return '';
    const status = getAnswerStatus(questionNumber);
    if (status === 'correct') return 'border-green-500';
    if (status === 'partial') return 'border-yellow-500';
    if (status === 'incorrect') return 'border-red-500';
    return '';
  };

  const handleTestStart = () => setIsTestStarted(true);

  const renderSingleChoiceQuestion = (questionNumber: string, options: string[]) => {
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionValue = String.fromCharCode(65 + index); // A, B, C...
          return (
            <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${questionNumber}`}
                value={optionValue}
                checked={answers[questionNumber] === optionValue}
                onChange={() => handleInputChange(questionNumber, optionValue)}
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

  const renderMultipleChoiceGroup = (groupKey: string, questionText: string, options: string[]) => {
    let status = '';
    let statusIcon = null;
    
    if (submitted) {
      if (checkGroupedAnswers(groupKey)) {
        status = 'bg-green-50';
        statusIcon = <CheckCircle className="w-4 h-4 text-green-500" />;
      } else if (checkGroupedAnswersPartial(groupKey)) {
        status = 'bg-yellow-50';
        statusIcon = <CheckCircle className="w-4 h-4 text-yellow-500" />;
      } else {
        status = 'bg-red-50';
        statusIcon = <XCircle className="w-4 h-4 text-red-500" />;
      }
    }
    
    const correctSelection = groupedAnswerConfig[groupKey].answers;
    
    return (
      <div className="mb-8">
        <p className="font-medium mb-4">{questionText}</p>
        <div className={`${status} p-2 rounded`}>
          <div className="space-y-2">
            {options.map((option, index) => {
              const optionValue = String.fromCharCode(65 + index);
              return (
                <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={optionValue}
                    checked={(multipleAnswers[groupKey] || []).includes(optionValue)}
                    onChange={() => handleMultipleAnswerChange(groupKey, optionValue)}
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
              {statusIcon}
              <span className="text-sm text-gray-600">Correct answers: {correctSelection.join(', ')}</span>
              {checkGroupedAnswersPartial(groupKey) && !checkGroupedAnswers(groupKey) && (
                <span className="text-sm text-yellow-600 ml-2">(Partial credit: 1 point)</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderSection1 = () => (
    <Card className="mb-6">
        <CardHeader>
            <CardTitle>Section 1 - Questions 1-10</CardTitle>
            <p className="text-sm text-gray-600">Complete the notes below.</p>
            <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
        </CardHeader>
        <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-bold text-center text-lg mb-4">Enquiry about joining Youth Council</h3>
                <div className="space-y-4">
                    <p><strong>Example</strong> Name: Roger <span className="underline">Brown</span></p>
                    <p>Age: 18</p>
                    <div className="flex items-center gap-2">
                        <span>Currently staying in a </span>
                        <Input type="text" value={answers['1'] || ''} onChange={(e) => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getInputBorderClass('1')}`} />
                        <span> during the week</span>
                        {submitted && getAnswerStatus('1') !== 'default' && (getAnswerStatus('1') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Postal address: 17, </span>
                        <Input type="text" value={answers['2'] || ''} onChange={(e) => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('2') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        <span> Street, Stamford, Lincs</span>
                        {submitted && getAnswerStatus('2') !== 'default' && (getAnswerStatus('2') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                     <div className="flex items-center gap-2">
                        <span>Postcode: </span>
                        <Input type="text" value={answers['3'] || ''} onChange={(e) => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('3') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        {submitted && getAnswerStatus('3') !== 'default' && (getAnswerStatus('3') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Occupation: student and part-time job as a </span>
                        <Input type="text" value={answers['4'] || ''} onChange={(e) => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('4') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        {submitted && getAnswerStatus('4') !== 'default' && (getAnswerStatus('4') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                     <div className="flex items-center gap-2">
                        <span>Studying </span>
                        <Input type="text" value={answers['5'] || ''} onChange={(e) => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('5') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        <span> (major subject) and history (minor subject)</span>
                        {submitted && getAnswerStatus('5') !== 'default' && (getAnswerStatus('5') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Hobbies: does a lot of </span>
                        <Input type="text" value={answers['6'] || ''} onChange={(e) => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('6') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        <span>, and is interested in the </span>
                        <Input type="text" value={answers['7'] || ''} onChange={(e) => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('7') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        {submitted && getAnswerStatus('6') !== 'default' && (getAnswerStatus('6') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                        {submitted && getAnswerStatus('7') !== 'default' && (getAnswerStatus('7') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>On Youth Council, wants to work with young people who are </span>
                        <Input type="text" value={answers['8'] || ''} onChange={(e) => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('8') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        {submitted && getAnswerStatus('8') !== 'default' && (getAnswerStatus('8') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Will come to talk to the Elections Officer next Monday at </span>
                        <Input type="text" value={answers['9'] || ''} onChange={(e) => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('9') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                         pm
                        {submitted && getAnswerStatus('9') !== 'default' && (getAnswerStatus('9') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Mobile number: </span>
                        <Input type="text" value={answers['10'] || ''} onChange={(e) => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${submitted ? (getAnswerStatus('10') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />
                        {submitted && getAnswerStatus('10') !== 'default' && (getAnswerStatus('10') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
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
            <h3 className="font-semibold text-lg mb-4">New staff at theatre</h3>
            
            {renderMultipleChoiceGroup(
                '11-12', 
                'Questions 11 and 12: Which TWO changes have been made so far during the refurbishment of the theatre?',
                ['Some rooms now have a different use.', 'A different type of seating has been installed.', 'An elevator has been installed.', 'The outside of the building has been repaired.', 'Extra seats have been added.']
            )}

            {renderMultipleChoiceGroup(
                '13-14',
                'Questions 13 and 14: Which TWO facilities does the theatre currently offer to the public?',
                ['rooms for hire', 'backstage tours', 'hire of costumes', 'a bookshop', 'a café']
            )}

            {renderMultipleChoiceGroup(
                '15-16',
                'Questions 15 and 16: Which TWO workshops does the theatre currently offer?',
                ['sound', 'acting', 'making puppets', 'make-up', 'lighting']
            )}

            <div className="mt-8">
                <h4 className="font-semibold mb-2">Questions 17-20</h4>
                <p className="text-sm mb-4">Label the plan below.</p>
                <p className="text-sm font-semibold mb-4">Write the correct letter, A-G, next to Questions 17-20.</p>
                
                 <div className="text-center mb-4">
                  <img 
                    src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/listening/test2/plan.png" 
                    alt="Ground floor plan of theatre" 
                    className="mx-auto max-w-full h-auto rounded border shadow-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  {[
                    { num: '17', label: 'box office' },
                    { num: '18', label: 'theatre manager\'s office' },
                    { num: '19', label: 'lighting box' },
                    { num: '20', label: 'artistic director\'s office' }
                  ].map(({ num, label }) => (
                    <div key={num} className="flex items-center gap-4">
                      <span className="w-6">{num}</span>
                      <span className="flex-1 capitalize">{label}</span>
                      <Input
                        type="text"
                        value={answers[num] || ''}
                        onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-16 text-center ${submitted ? (getAnswerStatus(num) === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`}
                        maxLength={1}
                      />
                      {submitted && getAnswerStatus(num) !== 'default' && (getAnswerStatus(num) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
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
            <h3 className="font-semibold text-lg mb-4">Rocky Bay field trip</h3>
            
            <div className="space-y-6">
              {[
                { q: '21', question: 'What do the students agree should be included in their aims?', options: ['factors affecting where organisms live', 'the need to preserve endangered species', 'techniques for classifying different organisms'] },
                { q: '22', question: 'What equipment did they forget to take on the Field Trip?', options: ['string', 'a compass', 'a ruler'] },
                { q: '23', question: 'In Helen\'s procedure section, Colin suggests a change in', options: ['the order in which information is given.', 'the way the information is divided up.', 'the amount of information provided.'] },
                { q: '24', question: 'What do they say about the method they used to measure wave speed?', options: ['It provided accurate results.', 'It was simple to carry out.', 'It required special equipment.'] },
                { q: '25', question: 'What mistake did Helen make when first drawing the map?', options: ['She chose the wrong scale.', 'She stood in the wrong place.', 'She did it at the wrong time.'] },
                { q: '26', question: 'What do they decide to do next with their map?', options: ['scan it onto a computer', 'check it using photographs', 'add information from the internet'] },
              ].map(({ q, question, options }) => (
                <div key={q}>
                  <p className="font-medium mb-2">{q}. {question}</p>
                  <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'partial' ? 'bg-yellow-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {renderSingleChoiceQuestion(q, options)}
                    {submitted && (
                      <div className="mt-2 flex items-center gap-2">
                        {getAnswerStatus(q) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-sm text-gray-600">Correct answer: {correctAnswers[q]}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {renderMultipleChoiceGroup(
                  '27-28',
                  'Questions 27 and 28: Which TWO problems affecting organisms in the splash zone are mentioned?',
                  ['lack of water', 'strong winds', 'lack of food', 'high temperatures', 'large waves']
              )}

              {renderMultipleChoiceGroup(
                  '29-30',
                  'Questions 29 and 30: Which TWO reasons for possible error will they include in their report?',
                  ['inaccurate records of the habitat of organisms', 'influence on behaviour of organisms by observer', 'incorrect identification of some organisms', 'making generalisations from a small sample', 'missing some organisms when counting']
              )}
            </div>
        </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
        <CardHeader>
            <CardTitle>Section 4 - Questions 31-40</CardTitle>
            <p className="text-sm text-gray-600">Complete the notes below.</p>
            <p className="text-sm font-semibold">Write ONE WORD ONLY for each answer.</p>
        </CardHeader>
        <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-bold text-center text-lg mb-4">Designing a public building: The Taylor Concert Hall</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Introduction</h4>
                        <ul className="list-disc list-inside ml-4 space-y-3 mt-2">
                            <li>The designer of a public building may need to consider the building's function, physical and <span>31</span><Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('31') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> context, and symbolic meaning.</li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold">Location and concept of the Concert Hall</h4>
                        <ul className="list-disc list-inside ml-4 space-y-3 mt-2">
                            <li>On the site of a disused <span>32</span><Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('32') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />.</li>
                            <li>Beside a <span>33</span><Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('33') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />.</li>
                            <li>The design is based on the concept of a mystery.</li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold">Building design</h4>
                        <ul className="list-disc list-inside ml-4 space-y-3 mt-2">
                            <li>It's approached by a <span>34</span><Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('34') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> for pedestrians.</li>
                            <li>The building is the shape of a <span>35</span><Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('35') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />.</li>
                            <li>One exterior wall acts as a large <span>36</span><Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('36') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold">In the auditorium</h4>
                         <ul className="list-disc list-inside ml-4 space-y-3 mt-2">
                            <li>The floor is built on huge pads made of <span>37</span><Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('37') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />.</li>
                            <li>The walls are made of local wood and are <span>38</span><Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('38') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> in shape.</li>
                            <li>Ceiling panels and <span>39</span><Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('39') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> on walls allow adjustment of acoustics.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold">Evaluation</h4>
                         <ul className="list-disc list-inside ml-4 space-y-3 mt-2">
                            <li>Some critics say the <span>40</span><Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ml-2 ${submitted ? (getAnswerStatus('40') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> style of the building is inappropriate.</li>
                         </ul>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 11 - Test 2 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book11.test2}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 11 - Listening Test 2"
        />

        <div className="my-6 flex justify-center space-x-2">
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

        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        <div className="flex gap-4 justify-center mt-8">
          <Button 
            onClick={handleSubmit}
            disabled={!isTestStarted || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
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
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.keys(correctAnswers).map((qNum) => {
                    const groupKey = questionToGroupMap[qNum];
                    if (groupKey && qNum !== groupedAnswerConfig[groupKey].questions[0]) {
                      return null; // Render group review only once
                    }
                    
                    const isCorrect = getAnswerStatus(qNum) === 'correct';
                    let userAnswerDisplay, correctAnswerDisplay;

                    if (groupKey) {
                      userAnswerDisplay = (multipleAnswers[groupKey] || []).join(', ') || 'No answer';
                      correctAnswerDisplay = groupedAnswerConfig[groupKey].answers.join(', ');
                    } else {
                      userAnswerDisplay = answers[qNum] || 'No answer';
                      correctAnswerDisplay = correctAnswers[qNum];
                    }

                    return (
                      <div 
                        key={qNum}
                        className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {groupKey ? `Q${groupedAnswerConfig[groupKey].questions.join(' & ')}` : `Q${qNum}`}
                          </span>
                          {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-gray-600">Your: </span>
                            <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswerDisplay}</span>
                          </div>
                          {!isCorrect && (
                             <div>
                              <span className="text-gray-600">Correct: </span>
                              <span className="text-green-700 font-medium">{correctAnswerDisplay}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-11"
        module="listening"
        testNumber={2}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <TestStatistics 
          book="book-11"
          module="listening"
          testNumber={2}
        />
        <UserTestHistory 
          book="book-11"
          module="listening"
          testNumber={2}
        />
      </div>
    </div>
  );
}