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

// Correct answers for Cambridge IELTS 9, Listening Test 4
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1
  '1': 'babies',
  '2': 'Eshcol',
  '3': 'evening',
  '4': 'Gormley',
  '5&6': ['B', 'E'], // Multi-select
  '7': 'heart',
  '8': 'primary school',
  '9': '4.30/four-thirty',
  '10': 'ages',

  // Section 2
  '11-13': ['B', 'C', 'E'], // Multi-select
  '14': 'B',
  '15': 'E',
  '16': 'D',
  '17': 'A',
  '18': 'C',
  '19': '732281',
  '20': 'Thursday/Thursdays',

  // Section 3
  '21': 'A',
  '22': 'C',
  '23': 'approach',
  '24': 'mature',
  '25': 'interest',
  '26': 'groups',
  '27': 'every 2 days',
  '28': '2 weeks/two weeks',
  '29': 'confident',
  '30': 'education system',

  // Section 4
  '31': 'C',
  '32': 'A',
  '33': 'B',
  '34': 'B',
  '35': 'A',
  '36': 'C',
  '37': 'frog/frogs',
  '38': 'predators',
  '39': 'count',
  '40': 'seed/seeds'
};

export default function Cambridge9Test4Listening() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '5&6': [],
    '11-13': [],
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

  const handleInputChange = (qNum: string, value: string) => setAnswers(prev => ({ ...prev, [qNum]: value }));
  
  const handleMultiSelect = (key: '5&6' | '11-13', value: string) => {
    setMultipleAnswers(prev => {
      const current = prev[key] || [];
      const max = key === '5&6' ? 2 : 3;
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(ans => ans !== value) };
      }
      if (current.length < max) {
        return { ...prev, [key]: [...current, value] };
      }
      return prev;
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    // Single answers
    Object.keys(answers).forEach(qNum => {
      if (correctAnswers[qNum] && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum] as string, qNum)) {
        correctCount++;
      }
    });
    // Multi-select answers
    Object.keys(multipleAnswers).forEach(key => {
      const userChoices = multipleAnswers[key as keyof typeof multipleAnswers] || [];
      const correctChoices = correctAnswers[key] as string[];
      userChoices.forEach(choice => {
        if (correctChoices.includes(choice)) {
          correctCount++;
        }
      });
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
        book: 'book-9',
        module: 'listening',
        testNumber: 4,
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

  const getAnswerStatus = (qNum: string) => {
    if (!submitted) return 'default';
    return answers[qNum] && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum] as string, qNum) ? 'correct' : 'incorrect';
  };
  
  const getMultiSelectStatus = (key: '5&6' | '11-13') => {
    if (!submitted) return 'default';
    const userChoices = multipleAnswers[key] || [];
    const correctChoices = correctAnswers[key] as string[];
    const correctCount = userChoices.filter(c => correctChoices.includes(c)).length;
    if (correctCount === correctChoices.length && userChoices.length === correctChoices.length) return 'correct';
    return 'incorrect';
  };

  const checkAnswer = (qNum: string) => {
    if (qNum === '5&6' || qNum === '11-13') {
      return getMultiSelectStatus(qNum as '5&6' | '11-13') === 'correct';
    }
    return answers[qNum] && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum] as string, qNum);
  };

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg">
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 1–4</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
            <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-200"><th className="p-2 border">Name of centre</th><th className="p-2 border">Doctor’s name</th><th className="p-2 border">Advantage</th></tr></thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 border font-medium">The Harvey Clinic</td><td className="p-2 border">Example: Dr <span className="underline">Green</span></td><td className="p-2 border">especially good with <Input id="1" placeholder="1" className={`w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} /></td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">The <Input id="2" placeholder="2" className={`w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} /> Health Practice</td><td className="p-2 border">Dr Fuller</td><td className="p-2 border">offers <Input id="3" placeholder="3" className={`w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} /> appointments</td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">The Shore Lane Health Centre</td><td className="p-2 border">Dr <Input id="4" placeholder="4" className={`w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} /></td><td className="p-2 border"></td></tr>
                </tbody>
            </table>
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 5 and 6</h4>
            <p className="text-sm mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">Which TWO of the following are offered free of charge at Shore Lane Health Centre?</p>
            <div className={`${getMultiSelectStatus('5&6') === 'correct' ? 'bg-green-50' : 'bg-red-50'} p-2 rounded`}>
                {['acupuncture', 'employment medicals', 'sports injury therapy', 'travel advice', 'vaccinations'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['5&6'] || []).includes(val)} onChange={() => handleMultiSelect('5&6', val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
                })}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 7–10</h4>
            <p className="text-sm font-semibold mb-4">Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
            <h3 className="font-bold text-center text-lg mb-4">Talks for patients at Shore Lane Health Centre</h3>
            <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-200"><th className="p-2 border">Subject of talk</th><th className="p-2 border">Date/Time</th><th className="p-2 border">Location</th><th className="p-2 border">Notes</th></tr></thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 border">Giving up smoking</td><td className="p-2 border">25th February at 7pm</td><td className="p-2 border">room 4</td><td className="p-2 border">useful for people with asthma or <Input id="7" placeholder="7" className={`w-32 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} /> problems</td></tr>
                    <tr className="border-b"><td className="p-2 border">Healthy eating</td><td className="p-2 border">1st March at 5pm</td><td className="p-2 border">the <Input id="8" placeholder="8" className={`w-40 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} /> (Shore Lane)</td><td className="p-2 border">anyone welcome</td></tr>
                    <tr className="border-b"><td className="p-2 border">Avoiding injuries during exercise</td><td className="p-2 border">9th March at <Input id="9" placeholder="9" className={`w-32 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} /></td><td className="p-2 border">room 6</td><td className="p-2 border">for all <Input id="10" placeholder="10" className={`w-24 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} /></td></tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 11–13</h4>
            <p className="text-sm mb-4">Label the diagram below.</p>
            <p className="text-sm font-semibold mb-4">Choose THREE answers from the box and write the correct letter, A–E, next to questions 11–13.</p>
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                    <h5 className="font-bold mb-2">Water Heater</h5>
                    <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/listening/test4/diagram.png" alt="Water Heater Diagram" className="w-full max-w-xs mx-auto rounded border shadow-lg" />
                </div>
                <div className="flex-1 space-y-4">
                    <div className="bg-gray-100 p-3 rounded">
                        <ul className="space-y-1"><li>A electricity indicator</li><li>B on/off switch</li><li>C reset button</li><li>D time control</li><li>E warning indicator</li></ul>
                    </div>
                    <div className={`${getMultiSelectStatus('11-13') === 'correct' ? 'bg-green-50' : 'bg-red-50'} p-2 rounded`}>
                        <p className="font-medium mb-2">Select the three correct labels:</p>
                        {['electricity indicator', 'on/off switch', 'reset button', 'time control', 'warning indicator'].map((opt, i) => {
                            const val = String.fromCharCode(65 + i);
                            return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['11-13'] || []).includes(val)} onChange={() => handleMultiSelect('11-13', val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
                        })}
                    </div>
                </div>
            </div>
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 14–18</h4>
            <p className="text-sm mb-4">Where can each of the following items be found?</p>
            <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A–G, next to questions 14–18.</p>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-gray-100 p-4 rounded"><h5 className="font-bold mb-2 text-center">Locations</h5><ul className="space-y-1"><li>A in box on washing machine</li><li>B in cupboard on landing</li><li>C in chest of drawers</li><li>D next to window in living room</li><li>E on shelf by back door</li><li>F on top of television</li><li>G under kitchen sink</li></ul></div>
                <div className="flex-1 space-y-3"><h5 className="font-bold mb-2">Items</h5>
                    {['pillows', 'washing powder', 'key', 'light bulbs', 'map'].map((item, i) => {
                        const q = String(14 + i);
                        return <div key={q} className="flex items-center gap-2"><span className="w-32 font-medium">{q}. {item}</span><Input id={q} placeholder={q} className={`w-16 text-center ${getAnswerStatus(q) === 'correct' ? 'border-green-500' : getAnswerStatus(q) === 'incorrect' ? 'border-red-500' : ''}`} value={answers[q] || ''} onChange={e => handleInputChange(q, e.target.value.toUpperCase())} maxLength={1} disabled={!isTestStarted || isSubmitting}/></div>
                    })}
                </div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD AND/OR A NUMBER for each answer.</p>
            <ul className="list-disc list-inside space-y-3">
                <li>The best place to park in town – next to the station</li>
                <li className="flex items-center gap-2">Phone number for takeaway pizzas – <Input id="19" placeholder="19" className={`w-32 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
                <li className="flex items-center gap-2">Railway museum closed on <Input id="20" placeholder="20" className={`w-40 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 21 and 22</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            {[
                {q: '21', p: "In her home country, Kira had", o: ["completed a course.", "done two years of a course.", "found her course difficult."]},
                {q: '22', p: "To succeed with assignments, Kira had to", o: ["read faster.", "write faster.", "change her way of thinking."]}
            ].map(({ q, p, o }) => (
                <div key={q} className="my-4"><p className="font-medium mb-2">{q}. {p}</p><div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>{o.map((opt, i) => { const val = String.fromCharCode(65 + i); return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${q}`} value={val} checked={answers[q] === val} onChange={() => handleInputChange(q, val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label> })}</div></div>
            ))}
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 23–25</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
            <ul className="list-disc list-inside space-y-3">
                <li className="flex items-center gap-2">23. Kira says that lecturers are easier to <Input id="23" placeholder="23" className={`w-32 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} /> than those in her home country.</li>
                <li className="flex items-center gap-2">24. Paul suggests that Kira may be more <Input id="24" placeholder="24" className={`w-32 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['24'] || ''} onChange={e => handleInputChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} /> than when she was studying before.</li>
                <li className="flex items-center gap-2">25. Kira says that students want to discuss things that worry them or that <Input id="25" placeholder="25" className={`w-32 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['25'] || ''} onChange={e => handleInputChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} /> them very much.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 26–30</h4>
            <p className="text-sm font-semibold mb-4">Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
            <ul className="list-disc list-inside space-y-3">
                <li className="flex items-center gap-2">26. How did the students do their practical sessions? <Input id="26" placeholder="26" className={`w-40 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
                <li className="flex items-center gap-2">27. In the second semester how often did Kira work in a hospital? <Input id="27" placeholder="27" className={`w-40 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['27'] || ''} onChange={e => handleInputChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
                <li className="flex items-center gap-2">28. How much full-time work did Kira do during the year? <Input id="28" placeholder="28" className={`w-40 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
                <li className="flex items-center gap-2">29. Having completed the year, how does Kira feel? <Input id="29" placeholder="29" className={`w-40 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
                <li className="flex items-center gap-2">30. In addition to the language, what do overseas students need to become familiar with? <Input id="30" placeholder="30" className={`w-40 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <h3 className="font-bold text-center text-lg mb-4">Wildlife in city gardens</h3>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 31–36</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            {[
                {q: '31', p: "What led the group to choose their topic?", o: ["They were concerned about the decline of one species.", "They were interested in the effects of city growth.", "They wanted to investigate a recent phenomenon."]},
                {q: '32', p: "The exact proportion of land devoted to private gardens was confirmed by", o: ["consulting some official documents.", "taking large-scale photos.", "discussions with town surveyors."]},
                {q: '33', p: "The group asked garden owners to", o: ["take part in formal interviews.", "keep a record of animals they saw.", "get in contact when they saw a rare species."]},
                {q: '34', p: "The group made their observations in gardens", o: ["which had a large number of animal species.", "which they considered to be representative.", "which had stable populations of rare animals."]},
                {q: '35', p: "The group did extensive reading on", o: ["wildlife problems in rural areas.", "urban animal populations.", "current gardening practices."]},
                {q: '36', p: "The speaker focuses on three animal species because", o: ["a lot of data has been obtained about them.", "the group were most interested in them.", "they best indicated general trends."]}
            ].map(({ q, p, o }) => (
                <div key={q} className="my-4"><p className="font-medium mb-2">{q}. {p}</p><div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>{o.map((opt, i) => { const val = String.fromCharCode(65 + i); return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${q}`} value={val} checked={answers[q] === val} onChange={() => handleInputChange(q, val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label> })}</div></div>
            ))}
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 37–40</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
            <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-200"><th className="p-2 border">Animals</th><th className="p-2 border">Reason for population increase in gardens</th><th className="p-2 border">Comments</th></tr></thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 border"><Input id="37" placeholder="37" className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} /></td><td className="p-2 border">suitable stretches of water</td><td className="p-2 border">massive increase in urban population</td></tr>
                    <tr className="border-b"><td className="p-2 border">Hedgehogs</td><td className="p-2 border">safer from <Input id="38" placeholder="38" className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} /> when in cities</td><td className="p-2 border">easy to <Input id="39" placeholder="39" className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} /> them accurately</td></tr>
                    <tr className="border-b"><td className="p-2 border">Song thrushes</td><td className="p-2 border">– a variety of <Input id="40" placeholder="40" className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} /> to eat<br/>– more nesting places available</td><td className="p-2 border">large survey starting soon</td></tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    const questionKeys = ['1', '2', '3', '4', '5&6', '7', '8', '9', '10', '11-13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40'];
    
    return (
      <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
            <div className="flex justify-center items-center space-x-8 mb-4">
              <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Raw Score</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-purple-600">{Math.round((score/40)*100)}%</div><div className="text-sm text-gray-600">Percentage</div></div>
            </div>
          </div>
          <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionKeys.map(qKey => {
                if (qKey.includes('&') || qKey.includes('-')) { // Multi-select questions
                  const userChoices = multipleAnswers[qKey as keyof typeof multipleAnswers] || [];
                  const correctChoices = correctAnswers[qKey] as string[];
                  const isCorrect = getMultiSelectStatus(qKey as '5&6' | '11-13') === 'correct';
                  const statusClass = isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
                  const qLabel = qKey.replace('&', ' & ').replace('-', '–');

                  return (
                    <div key={qKey} className={`p-3 rounded border ${statusClass}`}>
                      <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qLabel}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                      <div className="text-sm">
                        <div className="mb-1"><span>Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userChoices.sort().join(', ') || 'No answer'}</span></div>
                        <div><span>Correct: </span><span className="text-green-700 font-medium">{correctChoices.sort().join(', ')}</span></div>
                      </div>
                    </div>
                  );
                }
                
                // Single answer questions
                const isCorrect = getAnswerStatus(qKey) === 'correct';
                return (
                  <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qKey}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                    <div className="text-sm">
                      <div className="mb-1"><span>Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qKey] || 'No answer'}</span></div>
                      <div><span>Correct: </span><span className="text-green-700 font-medium">{correctAnswers[qKey]}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 9 - Test 4 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book9.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 9 - Listening Test 4" />
        <Card className="mb-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent></Card>
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((section) => (<Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {section}</Button>))}
        </div>
        {!isTestStarted && !submitted && <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4 text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></CardContent></Card>}
        <div style={{display: currentSection === 1 ? 'block' : 'none'}}>{renderSection1()}</div>
        <div style={{display: currentSection === 2 ? 'block' : 'none'}}>{renderSection2()}</div>
        <div style={{display: currentSection === 3 ? 'block' : 'none'}}>{renderSection3()}</div>
        <div style={{display: currentSection === 4 ? 'block' : 'none'}}>{renderSection4()}</div>
        <div className="flex justify-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        {showResultsPopup && renderResults()}
      </div>
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-9"
        module="listening"
        testNumber={4}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-9"
          module="listening"
          testNumber={4}
        />
        <UserTestHistory 
          book="book-9"
          module="listening"
          testNumber={4}
        />
      </div>
    </div>
  );
}