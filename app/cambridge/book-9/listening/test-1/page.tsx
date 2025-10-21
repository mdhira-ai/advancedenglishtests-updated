'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer'; // Assuming this component exists
import { AUDIO_URLS } from '@/constants/audio'; // Assuming this constant file exists
import { getIELTSListeningScore } from '@/lib/utils'; // Assuming this utility function exists
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'; // Assuming this helper exists

// Correct answers for Cambridge IELTS 9, Listening Test 1
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'answering (the) phone',
  '2': 'Hillsdunne Road', // The transcript has 'Hillsdunne Road', but the form says 'Work in the: ... branch' - this is a known ambiguity. Let's stick to the key.
  '3': '(the) Library',
  '4': '4.45',
  '5': 'national holidays',
  '6': 'after 11 (o\'clock)',
  '7': '(a) clear voice',
  '8': 'think quickly',
  '9': '22(nd) October',
  '10': 'Manuja',
  
  // Section 2: Questions 11-20
  '11': 'branch',
  '12': 'west',
  '13': 'clothing',
  '14': '10/ten',
  '15': 'running',
  '16': 'bags',
  '17': 'A',
  '18': 'A',
  '19&20': ['A', 'E'], // Multi-select question
  
  // Section 3: Questions 21-30
  '21': 'B',
  '22': 'C',
  '23': 'B',
  '24': 'A',
  '25': 'C',
  '26': 'B',
  '27': 'A',
  '28': 'B',
  '29': 'C',
  '30': 'B',
  
  // Section 4: Questions 31-40
  '31': 'tide/tides',
  '32': 'hearing/ears/ear',
  '33': 'plants, animals/fish/fishes', // Both required for one mark
  '34': 'feeding',
  '35': 'noise/noises',
  '36': 'healthy',
  '37': '(a) group',
  '38': 'social',
  '39': '(the) leader',
  '40': 'network/networks'
};

export default function Cambridge9Test1Listening() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '19&20': [],
  });
  const [twoPartAnswers, setTwoPartAnswers] = useState<{ [key: string]: { part1: string, part2: string } }>({
    '33': { part1: '', part2: '' },
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
      [questionNumber]: value
    }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };
  
  const handleTwoPartChange = (questionNumber: string, part: 'part1' | 'part2', value: string) => {
    setTwoPartAnswers(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        [part]: value
      }
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

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber] || multipleAnswers?.[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber] as string;
    
    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
      return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
    }
    
    return false;
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Handle single-answer questions
    for (let i = 1; i <= 40; i++) {
        const qNumStr = String(i);
        if (qNumStr === '19' || qNumStr === '20' || qNumStr === '33') continue; // Skip multi-select and two-part questions

        if (answers[qNumStr] !== undefined && correctAnswers[qNumStr] !== undefined) {
          if (checkAnswerWithMatching(answers[qNumStr], correctAnswers[qNumStr] as string, qNumStr)) {
            correctCount++;
          }
        }
    }

    // Handle multi-select questions (19 & 20)
    const userChoices1920 = multipleAnswers['19&20'] || [];
    const correctChoices1920 = correctAnswers['19&20'] as string[];
    userChoices1920.forEach(choice => {
        if (correctChoices1920.includes(choice)) {
            correctCount++;
        }
    });

    // Handle two-part question 33 (both parts required for one mark, in either order)
    const userAnswer33 = twoPartAnswers['33'];
    if (userAnswer33 && userAnswer33.part1.trim() && userAnswer33.part2.trim()) {
      const userPart1 = userAnswer33.part1.trim().toLowerCase();
      const userPart2 = userAnswer33.part2.trim().toLowerCase();
      
      // Check if both parts match the correct answer (in either order)
      const validCombinations = [
        'plants, animals', 'plants, fish', 'plants, fishes',
        'animals, plants', 'fish, plants', 'fishes, plants'
      ];
      
      const userCombination1 = `${userPart1}, ${userPart2}`;
      const userCombination2 = `${userPart2}, ${userPart1}`;
      
      if (validCombinations.includes(userCombination1) || validCombinations.includes(userCombination2)) {
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
        book: 'book-9',
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

  const handleTestStart = () => {
    setIsTestStarted(true);
  };
  
  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    
    // Handle two-part question 33
    if (questionNumber === '33') {
      const userAnswer33 = twoPartAnswers['33'];
      if (!userAnswer33 || !userAnswer33.part1.trim() || !userAnswer33.part2.trim()) return 'incorrect';
      
      const userPart1 = userAnswer33.part1.trim().toLowerCase();
      const userPart2 = userAnswer33.part2.trim().toLowerCase();
      
      const validCombinations = [
        'plants, animals', 'plants, fish', 'plants, fishes',
        'animals, plants', 'fish, plants', 'fishes, plants'
      ];
      
      const userCombination1 = `${userPart1}, ${userPart2}`;
      const userCombination2 = `${userPart2}, ${userPart1}`;
      
      return (validCombinations.includes(userCombination1) || validCombinations.includes(userCombination2)) ? 'correct' : 'incorrect';
    }
    
    const userAnswer = answers[questionNumber];
    if (userAnswer === undefined) return 'incorrect';
    return checkAnswerWithMatching(userAnswer, correctAnswers[questionNumber] as string, questionNumber) ? 'correct' : 'incorrect';
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

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm font-semibold">Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-center text-lg mb-4">JOB ENQUIRY</h3>
        <div className="space-y-4">
          <p>• Example: Work at: <span className="underline font-medium">a restaurant</span></p>
          <div className="flex items-center gap-2"><span>• Type of work:</span><Input id="1" className={`w-48 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="1" /></div>
          <p>• Number of hours per week: 12 hours</p>
          <div className="flex items-center gap-2"><span>• Work in the:</span><Input id="2" className={`w-48 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="2" /><span>branch</span></div>
          <div className="flex items-center gap-2"><span>• Nearest bus stop: next to</span><Input id="3" className={`w-48 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="3" /></div>
          <div className="flex items-center gap-2"><span>• Pay: £</span><Input id="4" className={`w-24 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="4" /><span>an hour</span></div>
          <div>
            <p>• Extra benefits:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>a free dinner</li>
              <li className="flex items-center gap-2">extra pay when you work on <Input id="5" className={`w-48 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="5" /></li>
              <li className="flex items-center gap-2">transport home when you work <Input id="6" className={`w-48 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="6" /></li>
            </ul>
          </div>
          <div>
            <p>• Qualities required:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li className="flex items-center gap-2"><Input id="7" className={`w-48 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="7" /></li>
              <li className="flex items-center gap-2">ability to <Input id="8" className={`w-48 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="8" /></li>
            </ul>
          </div>
          <div className="flex items-center gap-2"><span>• Interview arranged for: Thursday</span><Input id="9" className={`w-32 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="9" /><span>at 6 p.m.</span></div>
          <p>• Bring the names of two referees</p>
          <div className="flex items-center gap-2"><span>• Ask for: Samira</span><Input id="10" className={`w-48 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="10" /></div>
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
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 11-16</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD AND/OR A NUMBER for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-center text-lg mb-4">SPORTS WORLD</h3>
                <div className="flex items-center gap-2"><span>• a new</span><Input id="11" className={`w-48 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['11'] || ''} onChange={e => handleInputChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="11" /><span>of an international sports goods company</span></div>
                <div className="flex items-center gap-2"><span>• located in the shopping centre to the</span><Input id="12" className={`w-48 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['12'] || ''} onChange={e => handleInputChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="12" /><span>of Bradcaster</span></div>
                <div className="flex items-center gap-2"><span>• has sports</span><Input id="13" className={`w-48 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['13'] || ''} onChange={e => handleInputChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="13" /><span>and equipment on floors 1 – 3</span></div>
                <div className="flex items-center gap-2"><span>• can get you any item within</span><Input id="14" className={`w-48 ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['14'] || ''} onChange={e => handleInputChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="14" /><span>days</span></div>
                <div className="flex items-center gap-2"><span>• shop specialises in equipment for</span><Input id="15" className={`w-48 ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="15" /></div>
                <div className="flex items-center gap-2"><span>• has a special section which just sells</span><Input id="16" className={`w-48 ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="16" /></div>
            </div>
        </div>

        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 17 and 18</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-4">
                <div>
                    <p className="font-medium mb-2">17. A champion athlete will be in the shop</p>
                    <div className={`${getAnswerStatus('17') === 'correct' ? 'bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {['on Saturday morning only.', 'all day Saturday.', 'for the whole weekend.'].map((opt, i) => {
                        const val = String.fromCharCode(65 + i);
                        return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q17" value={val} checked={answers['17'] === val} onChange={() => handleMultipleChoice('17', val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
                    })}
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">18. The first person to answer 20 quiz questions correctly will win</p>
                    <div className={`${getAnswerStatus('18') === 'correct' ? 'bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {['a gym membership.', 'a video.', 'a calendar.'].map((opt, i) => {
                        const val = String.fromCharCode(65 + i);
                        return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q18" value={val} checked={answers['18'] === val} onChange={() => handleMultipleChoice('18', val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
                    })}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
            <p className="text-sm mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">Which TWO pieces of information does the speaker give about the fitness test?</p>
             <div className={`${getMultiSelectStatus('19&20') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('19&20') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['You need to reserve a place.', 'It is free to account holders.', 'You get advice on how to improve your health.', 'It takes place in a special clinic.', 'It is cheaper this month.'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['19&20'] || []).includes(val)} onChange={() => handleMultiSelect('19&20', val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 3 - Questions 21-30</CardTitle>
        <p className="text-sm font-semibold">Choose the correct letter, A, B or C.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
            { q: '21', p: "One reason why Spiros felt happy about his marketing presentation was that", o: ["he was not nervous.", "his style was good.", "the presentation was the best in his group."] },
            { q: '22', p: "What surprised Hiroko about the other students’ presentations?", o: ["Their presentations were not interesting.", "They found their presentations stressful.", "They didn’t look at the audience enough."] },
            { q: '23', p: "After she gave her presentation, Hiroko felt", o: ["delighted.", "dissatisfied.", "embarrassed."] },
            { q: '24', p: "How does Spiros feel about his performance in tutorials?", o: ["not very happy", "really pleased", "fairly confident"] },
            { q: '25', p: "Why can the other students participate so easily in discussions?", o: ["They are polite to each other.", "They agree to take turns in speaking.", "They know each other well."] },
            { q: '26', p: "Why is Hiroko feeling more positive about tutorials now?", o: ["She finds the other students’ opinions more interesting.", "She is making more of a contribution.", "The tutor includes her in the discussion."] },
            { q: '27', p: "To help her understand lectures, Hiroko", o: ["consulted reference materials.", "had extra tutorials with her lecturers.", "borrowed lecture notes from other students."] },
            { q: '28', p: "What does Spiros think of his reading skills?", o: ["He reads faster than he used to.", "It still takes him a long time to read.", "He tends to struggle with new vocabulary."] },
            { q: '29', p: "What is Hiroko’s subject area?", o: ["environmental studies", "health education", "engineering"] },
            { q: '30', p: "Hiroko thinks that in the reading classes the students should", o: ["learn more vocabulary.", "read more in their own subject areas.", "develop better reading strategies."] },
        ].map(({ q, p, o }) => (
          <div key={q}>
            <p className="font-medium mb-2">{q}. {p}</p>
            <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {o.map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${q}`} value={val} checked={answers[q] === val} onChange={() => handleMultipleChoice(q, val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
                })}
            </div>
          </div>  
        ))}
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 4 - Questions 31-40</CardTitle>
        <p className="text-sm font-semibold">Write NO MORE THAN TWO WORDS for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-center text-lg mb-4">Mass Strandings of Whales and Dolphins</h3>
        <div className="space-y-4">
            <p>Mass strandings: situations where groups of whales, dolphins, etc. swim onto the beach and die</p>
            <div className="flex items-center gap-2"><span>Common in areas where the</span><Input id="31" className={`w-48 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="31" /><span>can change quickly</span></div>
            <p>Several other theories:</p>
            
            <div className="mt-4">
                <h4 className="font-semibold">Parasites</h4>
                <div className="ml-4 mt-2 flex items-center gap-2"><span>e.g. some parasites can affect marine animals'</span><Input id="32" className={`w-48 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="32" /><span>, which they depend on for navigation</span></div>
            </div>

            <div className="mt-4">
                <h4 className="font-semibold">Toxins</h4>
                <div className="ml-4 mt-2 flex items-center gap-2">
                  <span>Poisons from</span>
                  <Input 
                    id="33-part1" 
                    className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} 
                    value={twoPartAnswers['33']?.part1 || ''} 
                    onChange={e => handleTwoPartChange('33', 'part1', e.target.value)} 
                    disabled={!isTestStarted || isSubmitting} 
                    placeholder="33a"
                  />
                  <span>or</span>
                  <Input 
                    id="33-part2" 
                    className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} 
                    value={twoPartAnswers['33']?.part2 || ''} 
                    onChange={e => handleTwoPartChange('33', 'part2', e.target.value)} 
                    disabled={!isTestStarted || isSubmitting} 
                    placeholder="33b"
                  />
                  <span>are commonly consumed by whales</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-4">Both answers required for one mark (in either order)</p>
                <p className="ml-4 mt-1">e.g. Cape Cod (1988) – whales were killed by saxitoxin</p>
            </div>

            <div className="mt-4">
                <h4 className="font-semibold">Accidental Strandings</h4>
                <div className="ml-4 mt-2 flex items-center gap-2"><span>Unlikely because the majority of animals were not</span><Input id="34" className={`w-48 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="34" /><span>when they stranded</span></div>
            </div>

            <div className="mt-4">
                <h4 className="font-semibold">Human Activity</h4>
                <div className="ml-4 mt-2 flex items-center gap-2"><Input id="35" className={`w-48 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="35" /><span>from military tests are linked to some recent strandings</span></div>
                <div className="ml-4 mt-2">
                    <p>The Bahamas (2000) stranding was unusual because the whales</p>
                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li className="flex items-center gap-2">were all <Input id="36" className={`w-48 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="36" /></li>
                        <li className="flex items-center gap-2">were not in a <Input id="37" className={`w-48 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="37" /></li>
                    </ul>
                </div>
            </div>
            
            <div className="mt-4">
                <h4 className="font-semibold">Group Behaviour</h4>
                <div className="ml-4 mt-2 flex items-center gap-2"><span>More strandings in the most</span><Input id="38" className={`w-48 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="38" /><span>species of whales</span></div>
                <div className="ml-4 mt-2 flex items-center gap-2"><span>1994 dolphin stranding – only the</span><Input id="39" className={`w-48 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="39" /><span>was ill</span></div>
            </div>

            <div className="mt-4">
                <h4 className="font-semibold">Further Reading</h4>
                <div className="ml-4 mt-2 flex items-center gap-2"><span>Marine Mammals Ashore (Connor) – gives information about stranding</span><Input id="40" className={`w-48 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="40" /></div>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    // Generate an array of question numbers to render, grouping 19&20
    const questionKeysToRender = Object.keys(correctAnswers).filter(k => k !== '19&20');
    questionKeysToRender.splice(18, 0, '19&20');
  
    return (
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
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{Math.round((score/40)*100)}%</div>
                <div className="text-sm text-gray-600">Percentage</div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionKeysToRender.map((qKey) => {
                if (qKey === '19&20') {
                    const userChoices = multipleAnswers['19&20'] || [];
                    const correctChoices = correctAnswers['19&20'] as string[];
                    const correctCount = userChoices.filter(c => correctChoices.includes(c)).length;
                    const isFullyCorrect = correctCount === 2 && userChoices.length === 2;
                    const statusClass = isFullyCorrect ? 'bg-green-50 border-green-200' : (correctCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200');

                    return (
                        <div key={qKey} className={`p-3 rounded border ${statusClass}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Q19 & Q20</span>
                                {isFullyCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="text-sm">
                                <div className="mb-1">
                                  <span>Your answer: </span>
                                  <span className={isFullyCorrect ? 'text-green-700' : 'text-red-700'}>
                                    {userChoices.join(', ') || 'No answer'}
                                  </span>
                                </div>
                                <div>
                                  <span>Correct: </span>
                                  <span className="text-green-700 font-medium">{correctChoices.join(', ')}</span>
                                </div>
                            </div>
                        </div>
                    );
                }

                if (qKey === '33') {
                    const userAnswer33 = twoPartAnswers['33'];
                    const isCorrect = getAnswerStatus('33') === 'correct';
                    const userAnswerText = userAnswer33 && userAnswer33.part1.trim() && userAnswer33.part2.trim() 
                        ? `${userAnswer33.part1.trim()}, ${userAnswer33.part2.trim()}`
                        : 'No answer';

                    return (
                        <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Q33</span>
                                {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="text-sm">
                                <div className="mb-1">
                                  <span>Your answer: </span>
                                  <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswerText}</span>
                                </div>
                                <div>
                                  <span>Correct: </span>
                                  <span className="text-green-700 font-medium">{correctAnswers[qKey]}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Both parts required, in either order</div>
                            </div>
                        </div>
                    );
                }

                const isCorrect = getAnswerStatus(qKey) === 'correct';
                return (
                  <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Q{qKey}</span>
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="text-sm">
                      <div className="mb-1">
                        <span>Your answer: </span>
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qKey] || 'No answer'}</span>
                      </div>
                      <div>
                        <span>Correct: </span>
                        <span className="text-green-700 font-medium">{correctAnswers[qKey]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 9 - Test 1 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book9.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 9 - Listening Test 1"
        />

        <Card className="mb-6">
          <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
          <CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent>
        </Card>

        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((section) => (
            <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>
              Section {section}
            </Button>
          ))}
        </div>
        
        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4 text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></CardContent></Card>
        )}
        
        <div style={{display: currentSection === 1 ? 'block' : 'none'}}>{renderSection1()}</div>
        <div style={{display: currentSection === 2 ? 'block' : 'none'}}>{renderSection2()}</div>
        <div style={{display: currentSection === 3 ? 'block' : 'none'}}>{renderSection3()}</div>
        <div style={{display: currentSection === 4 ? 'block' : 'none'}}>{renderSection4()}</div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {showResultsPopup && renderResults()}
      </div>
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-9"
        module="listening"
        testNumber={1}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-9"
          module="listening"
          testNumber={1}
        />
        <UserTestHistory 
          book="book-9"
          module="listening"
          testNumber={1}
        />
      </div>
    </div>
  );
}