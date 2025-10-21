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
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';

// Correct answers for Cambridge 10, Listening Test 3
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': '4',
  '2': '46 Wombat',
  '3': 'Thursday',
  '4': '8.30',
  '5': 'red',
  '6': 'lunch',
  '7': 'glasses',
  '8': 'Ball',
  '9': 'aunt',
  '10': 'month',

  // Section 2: Questions 11-20
  '11': 'C', // 11&12 in either order
  '12': 'E',
  '13': 'B',
  '14': 'A',
  '15': 'C',
  '16': 'B',
  '17': 'C',
  '18': 'D',
  '19': 'D',
  '20': 'A',

  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'A',
  '23': 'A',
  '24': 'B',
  '25': 'B',
  '26': 'E',
  '27': 'D',
  '28': 'A',
  '29': 'G',
  '30': 'C',

  // Section 4: Questions 31-40
  '31': 'achievement/achievements',
  '32': 'personality/character',
  '33': 'situational',
  '34': 'friend',
  '35': 'aspirations/ambitions',
  '36': 'style',
  '37': 'development',
  '38': 'vision',
  '39': 'structures',
  '40': 'innovation/innovations'
};

const correctSet11_12 = ['C', 'E'];

export default function Test3Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '11_12': [],
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

  // Set test start time
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

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };

  const handleMultiSelect = (questionKey: '11_12', value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const isSelected = currentAnswers.includes(value);
        let newAnswers;
        if (isSelected) {
            newAnswers = currentAnswers.filter(ans => ans !== value);
        } else {
            newAnswers = currentAnswers.length < 2 ? [...currentAnswers, value] : currentAnswers;
        }
        return { ...prev, [questionKey]: newAnswers };
    });
  };

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber) ? 'correct' : 'incorrect';
  };
  
  const getMultiSelectStatus = (key: '11_12') => {
    if (!submitted) return 'default';
    const userAnswers = new Set(multipleAnswers[key] || []);
    const correctSet = new Set(correctSet11_12);
    return userAnswers.size === correctSet.size && [...userAnswers].every(ans => correctSet.has(ans)) ? 'correct' : 'incorrect';
  }

  const checkAnswer = (questionNumber: string) => {
    if (['11', '12'].includes(questionNumber)) {
      const userSet = new Set(multipleAnswers['11_12']);
      const correctSet = new Set(correctSet11_12);
      return userSet.size === correctSet.size && [...userSet].every(ans => correctSet.has(ans));
    }
    return checkAnswerWithMatching(answers[questionNumber] || '', correctAnswers[questionNumber], questionNumber);
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Score regular questions
    for (const qNum in correctAnswers) {
      if (['11', '12'].includes(qNum)) continue;
      if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
        correctCount++;
      }
    }
    
    // Score multi-select questions
    const userSet = new Set(multipleAnswers['11_12']);
    const correctSet = new Set(correctSet11_12);
    if (userSet.size === correctSet.size && [...userSet].every(ans => correctSet.has(ans))) {
      correctCount += 2;
    } else if (userSet.size > 0 && [...userSet].some(ans => correctSet.has(ans))) {
        let partialScore = 0;
        userSet.forEach(ans => {
            if(correctSet.has(ans)) partialScore++;
        });
        if (userSet.size > correctSet.size) { // penalize for extra answers
             partialScore = 0;
        }
        correctCount += partialScore;
    }
    
    return Math.min(correctCount, 40); // Ensure score does not exceed 40
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
        book: 'book-10',
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
 
  const handleTestStart = () => setIsTestStarted(true);

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[]) => (
    <div className="space-y-2">
      {options.map((option, index) => {
        const optionValue = String.fromCharCode(65 + index);
        return (
          <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name={`question-${questionNumber}`} value={optionValue} checked={answers[questionNumber] === optionValue} onChange={() => handleMultipleChoice(questionNumber, optionValue)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4"/>
            <span className="text-sm">{optionValue}. {option}</span>
          </label>
        );
      })}
    </div>
  );

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm text-gray-600">Complete the form below.</p>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Early Learning Childcare Centre Enrolment Form</h3>
          <p>Parent or guardian: Carol <span className="underline font-medium">Smith</span> (Example)</p>
          <div className="space-y-3">
            <h4 className="font-semibold pt-4">Personal Details</h4>
            <p>Child's name: Kate</p>
            <p>Age: <strong>1</strong> <Input type="text" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Address: <strong>2</strong> <Input type="text" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} /> Road, Woodside, 4032</p>
            <h4 className="font-semibold pt-4">Childcare Information</h4>
            <p>Days enrolled for: Monday and <strong>3</strong> <Input type="text" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Start time: <strong>4</strong> <Input type="text" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} /> am</p>
            <p>Childcare group: the <strong>5</strong> <Input type="text" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} /> group</p>
            <p>Which meal/s are required each day? <strong>6</strong> <Input type="text" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Medical conditions: needs <strong>7</strong> <Input type="text" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Emergency contact: Jenny <strong>8</strong> <Input type="text" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Relationship to child: <strong>9</strong> <Input type="text" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <h4 className="font-semibold pt-4">Fees</h4>
            <p>Will pay each <strong>10</strong> <Input type="text" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 11 and 12</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO things does Alice say about the Dolphin Conservation Trust?</p>
          <div className={`${getMultiSelectStatus('11_12') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('11_12') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
            {['Children make up most of the membership.', "It's the country's largest dolphin conservation organisation.", 'It helps finance campaigns for changes in fishing practices.', 'It employs several dolphin experts full-time.', 'Volunteers help in various ways.'].map((opt, i) => {
              const val = String.fromCharCode(65 + i);
              const isSelected = multipleAnswers['11_12'].includes(val);
              return (<label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={isSelected} onChange={() => handleMultiSelect('11_12', val)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4"/><span className="text-sm">{val}. {opt}</span></label>);
            })}
            {submitted && <p className="text-xs mt-1 text-gray-600">Correct answers: C and E</p>}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 13-15</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="space-y-6">
            {[
              { q: '13', text: 'Why is Alice so pleased the Trust has won the Charity Commission award?', options: ['It has brought in extra money.', 'It made the work of the trust better known.', 'It has attracted more members.'] },
              { q: '14', text: 'Alice says oil exploration causes problems to dolphins because of', options: ['noise.', 'oil leaks.', 'movement of ships.'] },
              { q: '15', text: 'Alice became interested in dolphins when', options: ['she saw one swimming near her home.', 'she heard a speaker at her school.', 'she read a book about them.'] }
            ].map(({ q, text, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {text}</p>
                <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {renderMultipleChoiceQuestion(q, options)}
                  {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: {correctAnswers[q]}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 16-20</h4>
          <p className="text-sm mb-4">Which dolphin does Alice make each of the following comments about?</p>
          <p className="text-sm font-semibold mb-4">Write the correct letter, A, B, C or D, next to questions 16-20.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="bg-gray-100 p-4 rounded-lg mb-4 h-fit"><h4 className="font-bold text-center mb-2">Dolphins</h4><ul className="space-y-1 text-sm"><li>A Moondancer</li><li>B Echo</li><li>C Kiwi</li><li>D Samson</li></ul></div>
            <div>
              <h4 className="font-semibold mb-3">Comments</h4>
              <div className="space-y-3">
                {[
                  { q: '16', text: 'It has not been seen this year.' },
                  { q: '17', text: 'It is photographed more than the others.' },
                  { q: '18', text: 'It is always very energetic.' },
                  { q: '19', text: 'It is the newest one in the scheme.' },
                  { q: '20', text: 'It has an unusual shape.' }
                ].map(({ q, text }) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="w-40"><strong>{q}</strong> {text}</span>
                    <Input type="text" value={answers[q] || ''} onChange={e => handleInputChange(q, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${getAnswerStatus(q) === 'correct' ? 'border-green-500' : getAnswerStatus(q) === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1}/>
                    {submitted && <span className="text-xs">Correct: {correctAnswers[q]}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 21-25</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4"><h3 className="font-bold text-center text-lg">Theatre Studies Course</h3></div>
          <div className="space-y-6">
            {[
              {q: '21', text: 'What helped Rob to prepare to play the character of a doctor?', options: ['the stories his grandfather told him', 'the times when he watched his grandfather working', 'the way he imagined his grandfather at work']},
              {q: '22', text: "In the play's first scene, the boredom of village life was suggested by", options: ['repetition of words and phrases.', 'scenery painted in dull colours.', 'long pauses within conversations.']},
              {q: '23', text: 'What has Rob learned about himself through working in a group?', options: ['He likes to have clear guidelines.', 'He copes well with stress.', 'He thinks he is a good leader.']},
              {q: '24', text: 'To support the production, research material was used which described', options: ['political developments.', 'changing social attitudes.', 'economic transformations.']},
              {q: '25', text: 'What problem did the students overcome in the final rehearsal?', options: ['one person forgetting their words', 'an equipment failure', 'the injury of one character']}
            ].map(({ q, text, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {text}</p>
                <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {renderMultipleChoiceQuestion(q, options)}
                  {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: {correctAnswers[q]}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 26-30</h4>
          <p className="text-sm mb-4">What action is needed for the following stages in doing the 'year abroad' option?</p>
          <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="bg-gray-100 p-4 rounded-lg mb-4 h-fit"><h4 className="font-bold text-center mb-2">Action</h4><ul className="space-y-1 text-sm"><li>A be on time</li><li>B get a letter of recommendation</li><li>C plan for the final year</li><li>D make sure the institution's focus is relevant</li><li>E show ability in Theatre Studies</li><li>F make travel arrangements and bookings</li><li>G ask for help</li></ul></div>
            <div>
              <h4 className="font-semibold mb-3">Stages in doing the 'year abroad' option</h4>
              <div className="space-y-3">
                {[
                  { q: '26', text: 'in the second year of the course' },
                  { q: '27', text: 'when first choosing where to go' },
                  { q: '28', text: 'when sending in your choices' },
                  { q: '29', text: 'when writing your personal statement' },
                  { q: '30', text: 'when doing the year abroad' }
                ].map(({ q, text }) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="w-60"><strong>{q}</strong> {text}</span>
                    <Input type="text" value={answers[q] || ''} onChange={e => handleInputChange(q, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${getAnswerStatus(q) === 'correct' ? 'border-green-500' : getAnswerStatus(q) === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1}/>
                    {submitted && <span className="text-xs">Correct: {correctAnswers[q]}</span>}
                  </div>
                ))}
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
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD ONLY for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">'Self-regulatory focus theory' and leadership</h3>
            
            <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">Self-regulatory focus theory</h4>
                <p>People's focus is to approach pleasure or avoid pain</p>
                <p>Promotion goals focus on <strong>31</strong> <Input type="text" value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
                <p>Prevention goals emphasise avoiding punishment</p>
            </div>
            
            <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">Factors that affect people's focus</h4>
                <p className="font-medium">The Chronic Factor</p>
                <ul className="list-disc ml-6">
                    <li>comes from one's <strong>32</strong> <Input type="text" value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                </ul>
                <p>The <strong>33</strong> <Input type="text" value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} /> Factor</p>
                <ul className="list-disc ml-6">
                    <li>we are more likely to focus on promotion goals when with a <strong>34</strong> <Input type="text" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                    <li>we are more likely to focus on prevention goals with our boss</li>
                </ul>
            </div>
            
            <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">How people's focus affects them</h4>
                <p>Promotion Focus: People think about an ideal version of themselves, their <strong>35</strong> <Input type="text" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} /> and their gains.</p>
                <p>Prevention Focus: People think about their 'ought' self and their obligations</p>
            </div>
            
            <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">Leaders</h4>
                <p>Leadership behaviour and <strong>36</strong> <Input type="text" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} /> affects people's focus</p>
                
                <p className="font-medium italic">Transformational Leaders:</p>
                <ul className="list-disc ml-6">
                    <li>pay special attention to the <strong>37</strong> <Input type="text" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} /> of their followers</li>
                    <li>passionately communicate a clear <strong>38</strong> <Input type="text" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                    <li>inspire promotion focus in followers</li>
                </ul>
                
                <p className="font-medium italic">Transactional Leaders:</p>
                <ul className="list-disc ml-6">
                    <li>create <strong>39</strong> <Input type="text" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} /> to make expectations clear</li>
                    <li>emphasise the results of a mistake</li>
                    <li>inspire prevention focus in followers</li>
                </ul>
            </div>
            
            <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">Conclusion</h4>
                <p>Promotion Focus is good for jobs requiring <strong>40</strong> <Input type="text" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-40 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
                <p>Prevention Focus is good for work such as a surgeon</p>
                <p>Leaders' actions affect which focus people use</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 10 - Test 3 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book10.test3} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 10 - Listening Test 3" />
        <Card className="mb-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>Answer all questions as you listen.</li><li>You have 10 minutes at the end to transfer your answers.</li></ul></CardContent></Card>
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? "default" : "outline"} onClick={() => setCurrentSection(s)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {s}</Button>)}</div>{!isTestStarted && !submitted && <div className="text-center mt-2"><p className="text-sm text-blue-600"><strong>Note:</strong> Section navigation is enabled after you start the test.</p></div>}</div>
        {!isTestStarted && !submitted && <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4"><div className="text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></div></CardContent></Card>}
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        <div className="flex gap-4 justify-center"><Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
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
                  {Array.from({ length: 40 }, (_, i) => i + 1).map(qNum => {
                    const questionNum = String(qNum);
                    
                    if (['11', '12'].includes(questionNum)) {
                        if (questionNum === '12') return null; // Render as one block
                        const userAnswers = multipleAnswers['11_12'].join(', ') || 'No answer';
                        const isBlockCorrect = getMultiSelectStatus('11_12') === 'correct';
                        return (
                            <div key="11-12" className={`p-3 rounded border ${isBlockCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Q11-12</span>
                                  {isBlockCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                                </div>
                                <div className="text-sm">
                                  <div className="mb-1">
                                    <span className="text-gray-600">Your: </span>
                                    <span className={isBlockCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswers}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Correct: </span>
                                    <span className="text-green-700 font-medium">{correctSet11_12.join(' & ')}</span>
                                  </div>
                                </div>
                            </div>
                        );
                    }
                    
                    const userAnswer = answers[questionNum] || 'No answer';
                    const correctAnswer = correctAnswers[questionNum];
                    const isCorrect = getAnswerStatus(questionNum) === 'correct';
                    
                    return (
                      <div key={questionNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Q{questionNum}</span>
                          {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-gray-600">Your: </span>
                            <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span>
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
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Analytics Components */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <PageViewTracker 
          book="book-10"
          module="listening"
          testNumber={3}
        />
        <TestStatistics 
          book="book-10"
          module="listening"
          testNumber={3}
        />
        <UserTestHistory 
          book="book-10"
          module="listening"
          testNumber={3}
        />
      </div>
    </div>
  );
}