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

// Correct answers for Cambridge 10, Listening Test 2
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'Hardie',
  '2': '19',
  '3': 'GT8 2LC',
  '4': 'hairdresser',
  '5': "dentist/dentist's",
  '6': 'lighting',
  '7': 'trains',
  '8': 'safe',
  '9': 'shower',
  '10': 'training',
  
  // Section 2: Questions 11-20
  '11': 'A',
  '12': 'C',
  '13': 'C',
  '14': 'A',
  '15': 'E',
  '16': 'F',
  '17': 'D',
  '18': 'H',
  '19': 'A',
  '20': 'B',
  
  // Section 3: Questions 21-30
  '21': 'B', 
  '22': 'C',
  '23': 'B', 
  '24': 'E',
  '25': 'A',
  '26': 'C',
  '27': 'C',
  '28': 'A',
  '29': 'B',
  '30': 'A',
  
  // Section 4: Questions 31-40
  '31': 'competition',
  '32': 'global',
  '33': 'demand',
  '34': 'customers',
  '35': 'regulation',
  '36': 'project',
  '37': 'flexible',
  '38': 'leadership',
  '39': 'women',
  '40': 'self-employed'
};

const correctSet21_22 = ['C', 'E'];
const correctSet23_24 = ['B', 'E'];

export default function Test2Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21_22': [],
    '23_24': [],
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
    const processedValue = questionNumber === '3' ? value.toUpperCase().replace(/\s/g, '') : value.toLowerCase();
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: processedValue
    }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const handleMultiSelect = (questionKey: '21_22' | '23_24', value: string) => {
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

  const checkAnswer = (questionNumber: string): boolean => {
    // For the "Choose TWO" question sets
    if (['21', '22'].includes(questionNumber)) {
        const userChoices = multipleAnswers['21_22'] || [];
        const userAnswerForThisQ = questionNumber === '21' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '21' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return false;

        const isCorrect = correctSet21_22.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect;
    }

    if (['23', '24'].includes(questionNumber)) {
        const userChoices = multipleAnswers['23_24'] || [];
        const userAnswerForThisQ = questionNumber === '23' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '23' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return false;

        const isCorrect = correctSet23_24.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect;
    }

    // For regular questions
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    
    // For the "Choose TWO" question sets
    if (['21', '22'].includes(questionNumber)) {
        const userChoices = multipleAnswers['21_22'] || [];
        const userAnswerForThisQ = questionNumber === '21' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '21' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return 'incorrect';

        const isCorrect = correctSet21_22.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect ? 'correct' : 'incorrect';
    }

    if (['23', '24'].includes(questionNumber)) {
        const userChoices = multipleAnswers['23_24'] || [];
        const userAnswerForThisQ = questionNumber === '23' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '23' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return 'incorrect';

        const isCorrect = correctSet23_24.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect ? 'correct' : 'incorrect';
    }

    // For regular questions
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber) ? 'correct' : 'incorrect';
  };
  
  const getMultiSelectStatus = (key: '21_22' | '23_24') => {
    if (!submitted) return 'default';
    const userAnswers = new Set(multipleAnswers[key] || []);
    const correctSet = new Set(key === '21_22' ? correctSet21_22 : correctSet23_24);
    return userAnswers.size === correctSet.size && [...userAnswers].every(ans => correctSet.has(ans)) ? 'correct' : 'incorrect';
  }

  const calculateScore = () => {
    let correctCount = 0;
    
    // Score regular questions (excluding multi-select questions)
    for (const qNum in correctAnswers) {
      if (['21', '22', '23', '24'].includes(qNum)) continue;
      if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
        correctCount++;
      }
    }

    // Score questions 21 & 22
    const userChoices21_22 = [...new Set(multipleAnswers['21_22'] || [])]; // Use Set to handle unique choices
    userChoices21_22.forEach(choice => {
      if (correctSet21_22.includes(choice)) {
        correctCount++;
      }
    });

    // Score questions 23 & 24
    const userChoices23_24 = [...new Set(multipleAnswers['23_24'] || [])]; // Use Set to handle unique choices
    userChoices23_24.forEach(choice => {
      if (correctSet23_24.includes(choice)) {
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
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Transport Survey</h3>
          <p>Travelled to town today by: <span className="underline font-medium">bus</span> (Example)</p>
          <div className="space-y-3">
            <p>Name: Luisa <strong>1</strong> <Input type="text" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Address: <strong>2</strong> <Input type="text" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} /> White Stone Rd</p>
            <p>Postcode: <strong>3</strong> <Input type="text" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Occupation: <strong>4</strong> <Input type="text" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Reason for visit to town: to go to the <strong>5</strong> <Input type="text" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
          </div>
          <h4 className="font-semibold pt-4">Suggestions for improvement</h4>
          <ul className="list-disc list-inside pl-4 space-y-3">
            <li>better <strong>6</strong> <Input type="text" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
            <li>more frequent <strong>7</strong> <Input type="text" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
          </ul>
           <h4 className="font-semibold pt-4">Things that would encourage cycling to work:</h4>
           <ul className="list-disc list-inside pl-4 space-y-3">
            <li>having <strong>8</strong> <Input type="text" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} /> parking places for bicycles</li>
            <li>being able to use a <strong>9</strong> <Input type="text" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} /> at work</li>
            <li>the opportunity to have cycling <strong>10</strong> <Input type="text" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} /> on busy roads</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 11-14</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4"><h3 className="font-bold text-center text-lg">New city developments</h3></div>
          <div className="space-y-6">
            {[
              { q: '11', text: 'The idea for the two new developments in the city came from', options: ['local people.', 'the City Council.', 'the SWRDC.'] },
              { q: '12', text: 'What is unusual about Brackenside pool?', options: ['its architectural style', 'its heating system', 'its method of water treatment'] },
              { q: '13', text: 'Local newspapers have raised worries about', options: ['the late opening date.', 'the cost of the project.', 'the size of the facilities.'] },
              { q: '14', text: 'What decision has not yet been made about the pool?', options: ["who will be at the door", "the exact opening times", "who will open it"] }
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
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm mb-4">Which feature is related to each of the following areas of the world represented in the playground?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-I, next to questions 15-20.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="bg-gray-100 p-4 rounded-lg mb-4 h-fit">
                  <h4 className="font-bold text-center mb-2">Features</h4>
                  <ul className="space-y-1 text-sm">
                      <li>A ancient forts</li><li>B waterways</li><li>C ice and snow</li><li>D jewels</li><li>E local animals</li><li>F mountains</li><li>G music and film</li><li>H space travel</li><li>I volcanoes</li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-semibold mb-3">Areas of the world</h4>
                  <div className="space-y-3">
                      {[15, 16, 17, 18, 19, 20].map(num => (
                          <div key={num} className="flex items-center gap-2">
                              <span><strong>{num}</strong> { {15: 'Asia', 16: 'Antarctica', 17: 'South America', 18: 'North America', 19: 'Europe', 20: 'Africa'}[num] }</span>
                              <Input type="text" value={answers[String(num)] || ''} onChange={e => handleInputChange(String(num), e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${getAnswerStatus(String(num)) === 'correct' ? 'border-green-500' : getAnswerStatus(String(num)) === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1}/>
                              {submitted && <span className="text-xs">Correct: {correctAnswers[String(num)]}</span>}
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
          <h4 className="font-semibold mb-2">Questions 21 & 22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO hobbies was Thor Heyerdahl very interested in as a youth?</p>
          <div className={`${getMultiSelectStatus('21_22') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('21_22') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
            {['camping', 'climbing', 'collecting', 'hunting', 'reading'].map((opt, i) => {
              const val = String.fromCharCode(65 + i);
              const isSelected = multipleAnswers['21_22'].includes(val);
              return (<label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={isSelected} onChange={() => handleMultiSelect('21_22', val)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4"/><span className="text-sm">{val}. {opt}</span></label>);
            })}
            {submitted && <p className="text-xs mt-1 text-gray-600">Correct answers: C and E</p>}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 23 & 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which do the speakers say are the TWO reasons why Heyerdahl went to live on an island?</p>
          <div className={`${getMultiSelectStatus('23_24') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('23_24') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
            {['to examine ancient carvings', 'to experience an isolated place', 'to formulate a new theory', 'to learn survival skills', 'to study the impact of an extreme environment'].map((opt, i) => {
              const val = String.fromCharCode(65 + i);
              const isSelected = multipleAnswers['23_24'].includes(val);
              return (<label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={isSelected} onChange={() => handleMultiSelect('23_24', val)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4"/><span className="text-sm">{val}. {opt}</span></label>);
            })}
            {submitted && <p className="text-xs mt-1 text-gray-600">Correct answers: B and E</p>}
          </div>
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
             <div className="bg-gray-100 p-4 rounded-lg mb-4"><h3 className="font-bold text-center text-lg">The later life of Thor Heyerdahl</h3></div>
             <div className="space-y-6">
                 {[
                     {q: '25', text: 'According to Victor and Olivia, academics thought that Polynesian migration from the east was impossible due to', options: ['the fact that Eastern countries were far away.', 'the lack of materials for boat building.', 'the direction of the winds and currents.']},
                     {q: '26', text: 'Which do the speakers agree was the main reason for Heyerdahl\'s raft journey?', options: ['to overcome a research setback', 'to demonstrate a personal quality', 'to test a new theory']},
                     {q: '27', text: 'What was most important to Heyerdahl about his raft journey?', options: ['the fact that he was the first person to do it', 'the speed of crossing the Pacific', 'the use of authentic construction methods']},
                     {q: '28', text: 'Why did Heyerdahl go to Easter Island?', options: ['to build a stone statue', 'to sail a reed boat', 'to learn the local language']},
                     {q: '29', text: "In Olivia's opinion, Heyerdahl's greatest influence was on", options: ['theories about Polynesian origins.', 'the development of archaeological methodology.', 'establishing archaeology as an academic subject.']},
                     {q: '30', text: "Which criticism do the speakers make of William Oliver's textbook?", options: ['Its style is out of date.', 'Its content is over-simplified.', 'Its methodology is flawed.']}
                 ].map(({q, text, options}) => (
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
        <div className="bg-gray-100 p-4 rounded-lg space-y-4 ">
            <h3 className="font-bold text-center text-lg mb-4">THE FUTURE OF MANAGEMENT</h3>
            <div className="space-y-3">
                <p className="font-semibold">Business markets</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>greater <strong>31</strong> <Input type="text" value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} /> among companies</li>
                    <li>increase in power of large <strong>32</strong> <Input type="text" value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} /> companies</li>
                    <li>rising <strong>33</strong> <Input type="text" value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} /> in certain countries</li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="font-semibold">External influences on businesses</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>more discussion with <strong>34</strong> <Input type="text" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} /> before making business decisions</li>
                    <li>environmental concerns which may lead to more <strong>35</strong> <Input type="text" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="font-semibold">Business structures</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>more teams will be formed to work on a particular <strong>36</strong> <Input type="text" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                    <li>businesses may need to offer hours that are <strong>37</strong> <Input type="text" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} />, or the chance to work remotely</li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="font-semibold">Management styles</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>increasing need for managers to provide good <strong>38</strong> <Input type="text" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                    <li>changes influenced by <strong>39</strong> <Input type="text" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} /> taking senior roles</li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="font-semibold">Changes in the economy</p>
                <ul className="list-disc list-inside pl-4 space-y-3 ">
                    <li>(service sector continues to be important)</li>
                    <li>increasing value of intellectual property</li>
                    <li>more and more <strong>40</strong> <Input type="text" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} /> workers</li>
                </ul>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 10 - Test 2 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book10.test2} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 10 - Listening Test 2" />
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
                  <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Raw Score</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-purple-600">{Math.round((score / 40) * 100)}%</div><div className="text-sm text-gray-600">Percentage</div></div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 40 }, (_, i) => i + 1).map(qNum => {
                    const questionNum = String(qNum);
                    let userAnswer, correctAnswer, isCorrect;
                    
                    if (['21', '22'].includes(questionNum)) {
                        const userChoices = multipleAnswers['21_22'] || [];
                        const correctSet = correctSet21_22;
                        isCorrect = userChoices.includes(correctAnswers[questionNum]);
                        userAnswer = userChoices.join(', ') || 'No answer';
                        correctAnswer = correctSet.join(' & ');
                        // To avoid rendering this twice, only render for Q21
                        if(questionNum === '22') return null;
                        return (
                            <div key="21-22" className={`p-3 rounded border ${getMultiSelectStatus('21_22') === 'correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between mb-2"><span className="font-medium">Q21-22</span>{getMultiSelectStatus('21_22') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                                <div className="text-sm"><div className="mb-1"><span className="text-gray-600">Your: </span><span className={getMultiSelectStatus('21_22') === 'correct' ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></div><div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAnswer}</span></div></div>
                            </div>
                        );
                    }
                    if (['23', '24'].includes(questionNum)) {
                         const userChoices = multipleAnswers['23_24'] || [];
                        const correctSet = correctSet23_24;
                        isCorrect = userChoices.includes(correctAnswers[questionNum]);
                        userAnswer = userChoices.join(', ') || 'No answer';
                        correctAnswer = correctSet.join(' & ');
                        if(questionNum === '24') return null;
                        return (
                            <div key="23-24" className={`p-3 rounded border ${getMultiSelectStatus('23_24') === 'correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between mb-2"><span className="font-medium">Q23-24</span>{getMultiSelectStatus('23_24') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                                <div className="text-sm"><div className="mb-1"><span className="text-gray-600">Your: </span><span className={getMultiSelectStatus('23_24') === 'correct' ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></div><div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAnswer}</span></div></div>
                            </div>
                        );
                    }
                    
                    userAnswer = answers[questionNum] || 'No answer';
                    correctAnswer = correctAnswers[questionNum];
                    isCorrect = getAnswerStatus(questionNum) === 'correct';
                    
                    return (
                      <div key={questionNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{questionNum}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm"><div className="mb-1"><span className="text-gray-600">Your: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></div><div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAnswer}</span></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
      {/* Analytics Components */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <PageViewTracker 
          book="book-10"
          module="listening"
          testNumber={2}
        />
        <TestStatistics 
          book="book-10"
          module="listening"
          testNumber={2}
        />
        <UserTestHistory 
          book="book-10"
          module="listening"
          testNumber={2}
        />
      </div>
    </div>
  );
}