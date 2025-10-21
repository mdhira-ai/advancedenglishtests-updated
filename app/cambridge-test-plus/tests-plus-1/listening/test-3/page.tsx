// pages/practice-tests-plus-1/listening/test-3.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { AUDIO_URLS } from '@/constants/audio';

// Correct answers for IELTS Practice Tests Plus 1 - Listening Test 3
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1
  '1': 'mitchell', 
  '2a': '66', '2b': "women's college", 
  '3': 'education', '4': '994578ed',
  '5': 'c', '6': 'b', '7': 'b', '8': 'a', '9': 'c', '10': 'a',
  // Section 2
  '11': 'fishing village', '12': 'pine trees', '13': 'marshland', '14': 'sunbeds and umbrellas',
  '15': 'longest', '16': 'flag system/flags', '17': 'north(-) west', '18': 'white cliffs',
  '19': 'sand(-) banks', 
  '20a': 'food', '20b': 'drink',
  // Section 3
  '21': '(course) booklists/reading list(s)', '22': 'recommended', '23': 'sales figures',
  '24': 'year (group)', '25': 'catalogues', '26': 'letters/correspondence', '27': 'inspection/free copies',
  '28': 'value (for money)', '29': 'clear/easy to use', '30': 'easy to use/clear',
  // Section 4
  '31': 'c', '32': 'a/d', '33': 'd/a', '34': 'a', '35': 'b',
  '36': '(a) competition(s)', 
  '37a': 'design', '37b': 'print', 
  '38': 'styles/techniques',
  '39': 'categories', '40': 'two/2 names',
  // Multi-part questions
  '32-33': ['a', 'd'], // Questions 32-33: Which TWO worry new artists
  '34-35': ['a', 'e'], // Questions 34-35: Which TWO influenced Rebecca's decision
};

const multiPartQuestions = {
    '32-33': { parts: ['32', '33'], marks: 2 },
    '34-35': { parts: ['34', '35'], marks: 2 },
};

export default function PracticeTestsPlus1Test3Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '32-33': [], '34-35': [],
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

  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []);

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };
  
  const handleMultipleChoice = (questionNumber: string, value: string) => {
    if (Object.keys(multiPartQuestions).includes(questionNumber)) {
        const maxSelections = multiPartQuestions[questionNumber as keyof typeof multiPartQuestions].marks;
        setMultipleAnswers(prev => {
            const current = prev[questionNumber] || [];
            if (current.includes(value)) return { ...prev, [questionNumber]: current.filter(v => v !== value) };
            if (current.length < maxSelections) return { ...prev, [questionNumber]: [...current, value] };
            return prev;
        });
    } else {
        setAnswers(prev => ({ ...prev, [questionNumber]: value }));
    }
  };

  const checkMultiPartAnswer = (qKey: string) => {
    const userAnswers = new Set(multipleAnswers[qKey] || []);
    const correctAnswerArray = Array.isArray(correctAnswers[qKey]) ? correctAnswers[qKey] as string[] : [];
    const correctAnswersSet = new Set(correctAnswerArray);
    return userAnswers.size === correctAnswersSet.size && [...userAnswers].every(answer => correctAnswersSet.has(answer));
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    const answeredMultiPart = new Set<string>();

    // Handle split questions (2a/2b, 20a/20b, 37a/37b)
    const splitQuestions = ['2', '20', '37'];
    splitQuestions.forEach(q => {
      const aAnswer = answers[q + 'a'] || '';
      const bAnswer = answers[q + 'b'] || '';
      const correctA = correctAnswers[q + 'a'] as string;
      const correctB = correctAnswers[q + 'b'] as string;
      
      if (checkAnswerWithMatching(aAnswer, correctA, q + 'a') && checkAnswerWithMatching(bAnswer, correctB, q + 'b')) {
        correctCount++;
      }
    });

    for (let i = 1; i <= 40; i++) {
        const qNumStr = String(i);
        
        // Skip split questions as they're handled above
        if (splitQuestions.includes(qNumStr)) continue;
        
        let inMultiPart = false;
        for (const key in multiPartQuestions) {
            if (multiPartQuestions[key as keyof typeof multiPartQuestions].parts.includes(qNumStr)) {
                inMultiPart = true;
                if (!answeredMultiPart.has(key)) {
                    const userAnswers = new Set(multipleAnswers[key] || []);
                    const correctAnswersSet = new Set(correctAnswers[key] as string[]);
                    if (userAnswers.size <= correctAnswersSet.size) {
                        userAnswers.forEach(ans => {
                            if (correctAnswersSet.has(ans)) correctCount++;
                        });
                    }
                    answeredMultiPart.add(key);
                }
                break;
            }
        }
        if (!inMultiPart && correctAnswers[qNumStr] && checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr] as string, qNumStr)) {
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
        const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
        
        const detailedAnswers = { singleAnswers: answers, multipleAnswers, score: calculatedScore, totalQuestions: 40, timeTaken };
        
        await saveTestScore({
            userId: session?.user?.id || null,
            book:'practice-tests-plus-1',
            module: 'listening',
            testNumber: 3,
            score: calculatedScore,
            totalQuestions: 40,
            percentage: Math.round((calculatedScore / 40) * 100),
            ieltsBandScore: getIELTSListeningScore(calculatedScore),
            timeTaken: timeTaken || undefined
        });
        setSubmitted(true);
        setShowResultsPopup(true);
    } catch (error) {
        console.error('Error submitting test:', error);
        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        setSubmitted(true);
        setShowResultsPopup(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleTestStart = () => setIsTestStarted(true);

  const renderSingleMcq = (q: string, question: string, options: string[]) => (
    <div key={q}>
      <p className="font-semibold">{q}. {question}</p>
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index);
          const isSelected = answers[q] === optionLetter.toLowerCase();
          return (
            <div key={optionLetter} className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${ submitted ? (correctAnswers[q] === optionLetter ? 'bg-green-100' : (isSelected ? 'bg-red-100' : '')) : (isSelected ? 'bg-blue-100' : 'hover:bg-gray-50') }`} onClick={() => !submitted && handleMultipleChoice(q, optionLetter.toLowerCase())}>
              <input type="radio" checked={isSelected} readOnly disabled={submitted}/>
              <span>{optionLetter}. {option}</span>
            </div>
          );
        })}
        {submitted && !checkAnswerWithMatching(answers[q] || '', correctAnswers[q] as string, q) && <p className="text-sm text-red-600 mt-1">Correct: {correctAnswers[q]}</p>}
      </div>
    </div>
  );

  const renderMultiMcq = (qKey: string, question: string, options: string[], letters: string) => (
    <div key={qKey}>
      <p className="font-semibold">{question} Circle TWO letters {letters}.</p>
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index);
          const isSelected = (multipleAnswers[qKey] || []).includes(optionLetter.toLowerCase());
          const correctAnswerArray = Array.isArray(correctAnswers[qKey]) ? correctAnswers[qKey] as string[] : [];
          const isCorrect = correctAnswerArray.includes(optionLetter.toLowerCase());
          return (
            <div key={optionLetter} className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${ submitted ? (isCorrect ? 'bg-green-100' : (isSelected ? 'bg-red-100' : '')) : (isSelected ? 'bg-blue-100' : 'hover:bg-gray-50') }`} onClick={() => !submitted && handleMultipleChoice(qKey, optionLetter.toLowerCase())}>
              <input type="checkbox" checked={isSelected} readOnly disabled={submitted}/>
              <span>{optionLetter}. {option}</span>
            </div>
          );
        })}
        {submitted && !checkMultiPartAnswer(qKey) && <p className="text-sm text-red-600 mt-1">Correct answers: {Array.isArray(correctAnswers[qKey]) ? (correctAnswers[qKey] as string[]).join(', ').toUpperCase() : 'N/A'}</p>}
      </div>
    </div>
  );

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 1 - Questions 1-10</h3></div>
      <Card>
        <CardHeader><p>Questions 1–4: Complete the form below. Write <strong>NO MORE THAN THREE WORDS or A NUMBER</strong> for each answer.</p></CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-bold text-lg text-center">Conference Registration Form</h4>
          
          <div className="text-center mb-4">
            <p><em>Example</em></p>
            <p><strong>Name of Conference:</strong> <span className="italic">Beyond 2000</span></p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-1/3 shrink-0"><strong>Name:</strong> Melanie <span className="underline">1</span></label>
              <Input 
                className={`w-48 ${submitted ? (checkAnswerWithMatching(answers['1'] || '', correctAnswers['1'] as string, '1') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['1'] || ''} 
                onChange={e => handleInputChange('1', e.target.value)} 
                disabled={!isTestStarted || submitted}
                placeholder="1"
              />
              <span className="ml-2">Ms......</span>
              {submitted && !checkAnswerWithMatching(answers['1'] || '', correctAnswers['1'] as string, '1') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['1']})</span>}
            </div>

            <div className="flex items-center">
              <label className="w-1/3 shrink-0"><strong>Address:</strong> <span className="underline">2</span> Room</label>
              <Input 
                className={`w-24 mx-2 ${submitted ? (checkAnswerWithMatching(answers['2a'] || '', correctAnswers['2a'] as string, '2a') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['2a'] || ''} 
                onChange={e => handleInputChange('2a', e.target.value)} 
                disabled={!isTestStarted || submitted}
                placeholder="2a"
              />
              <span>at</span>
              <Input 
                className={`w-40 mx-2 ${submitted ? (checkAnswerWithMatching(answers['2b'] || '', correctAnswers['2b'] as string, '2b') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['2b'] || ''} 
                onChange={e => handleInputChange('2b', e.target.value)} 
                disabled={!isTestStarted || submitted}
                placeholder="2b"
              />
              <span>Newtown</span>
              {submitted && (!checkAnswerWithMatching(answers['2a'] || '', correctAnswers['2a'] as string, '2a') || !checkAnswerWithMatching(answers['2b'] || '', correctAnswers['2b'] as string, '2b')) && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['2a']}, {correctAnswers['2b']})</span>}
            </div>

            <div className="flex items-center">
              <label className="w-1/3 shrink-0"><strong>Faculty:</strong> <span className="underline">3</span></label>
              <Input 
                className={`w-48 ${submitted ? (checkAnswerWithMatching(answers['3'] || '', correctAnswers['3'] as string, '3') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['3'] || ''} 
                onChange={e => handleInputChange('3', e.target.value)} 
                disabled={!isTestStarted || submitted}
                placeholder="3"
              />
              {submitted && !checkAnswerWithMatching(answers['3'] || '', correctAnswers['3'] as string, '3') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['3']})</span>}
            </div>

            <div className="flex items-center">
              <label className="w-1/3 shrink-0"><strong>Student No:</strong> <span className="underline">4</span></label>
              <Input 
                className={`w-48 ${submitted ? (checkAnswerWithMatching(answers['4'] || '', correctAnswers['4'] as string, '4') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['4'] || ''} 
                onChange={e => handleInputChange('4', e.target.value)} 
                disabled={!isTestStarted || submitted}
                placeholder="4"
              />
              {submitted && !checkAnswerWithMatching(answers['4'] || '', correctAnswers['4'] as string, '4') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['4']})</span>}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><p>Questions 5–10: Circle the correct letters A–C.</p></CardHeader>
        <CardContent className="space-y-4">
            {[ {q: '5', question: "Registration for:", options: ["Half day", "Full day", "Full conference"]}, {q: '6', question: "Accommodation required:", options: ["Share room/share bathroom", "Own room/share bathroom", "Own room with bathroom"]}, {q: '7', question: "Meals required:", options: ["Breakfast", "Lunch", "Dinner"]}, {q: '8', question: "Friday SIGs:", options: ["Computers in Education", "Teaching Reading", "The Gifted Child"]}, {q: '9', question: "Saturday SIGs:", options: ["Cultural Differences", "Music in the Curriculum", "Gender Issues"]}, {q: '10', question: "Method of payment:", options: ["Credit Card", "Cheque", "Cash"]}, ].map(item => renderSingleMcq(item.q, item.question, item.options))}
        </CardContent>
      </Card>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 2 - Questions 11-20</h3></div>
      <Card><CardHeader><p>Questions 11-20: Complete the table below. Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
        <CardContent><table className="w-full border-collapse border text-sm">
            <thead><tr className="bg-gray-100"><th className="p-1 border">Name of Beach</th><th className="p-1 border">Location</th><th className="p-1 border">Geographical Features</th><th className="p-1 border">Other information</th></tr></thead>
            <tbody>
                <tr><td className="p-1 border">Bandela</td><td className="p-1 border">1km from Bandela <Input className={`${submitted ? (checkAnswerWithMatching(answers['11'] || '', correctAnswers['11'] as string, '11') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['11'] || ''} onChange={e => handleInputChange('11', e.target.value)} disabled={!isTestStarted || submitted} placeholder="11" /></td><td className="p-1 border">surrounded by <Input className={`${submitted ? (checkAnswerWithMatching(answers['12'] || '', correctAnswers['12'] as string, '12') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['12'] || ''} onChange={e => handleInputChange('12', e.target.value)} disabled={!isTestStarted || submitted} placeholder="12" /></td><td className="p-1 border">safe for children/ non-swimmers</td></tr>
                <tr><td className="p-1 border">Da Porlata</td><td className="p-1 border">east corner of island</td><td className="p-1 border">area around beach is <Input className={`${submitted ? (checkAnswerWithMatching(answers['13'] || '', correctAnswers['13'] as string, '13') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['13'] || ''} onChange={e => handleInputChange('13', e.target.value)} disabled={!isTestStarted || submitted} placeholder="13" /></td><td className="p-1 border">can hire <Input className={`${submitted ? (checkAnswerWithMatching(answers['14'] || '', correctAnswers['14'] as string, '14') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['14'] || ''} onChange={e => handleInputChange('14', e.target.value)} disabled={!isTestStarted || submitted} placeholder="14" /> and ...</td></tr>
                <tr><td className="p-1 border">San Gett</td><td className="p-1 border">just past 'Tip of Caln'</td><td className="p-1 border"><Input className={`${submitted ? (checkAnswerWithMatching(answers['15'] || '', correctAnswers['15'] as string, '15') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || submitted} placeholder="15" /> beach on island</td><td className="p-1 border">check <Input className={`${submitted ? (checkAnswerWithMatching(answers['16'] || '', correctAnswers['16'] as string, '16') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || submitted} placeholder="16" /> on beach in rough weather</td></tr>
                <tr><td className="p-1 border">Blanaka</td><td className="p-1 border"><Input className={`${submitted ? (checkAnswerWithMatching(answers['17'] || '', correctAnswers['17'] as string, '17') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || submitted} placeholder="17" /> corner</td><td className="p-1 border">surrounded by <Input className={`${submitted ? (checkAnswerWithMatching(answers['18'] || '', correctAnswers['18'] as string, '18') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || submitted} placeholder="18" /></td><td className="p-1 border">can go caving and diving</td></tr>
                <tr><td className="p-1 border">Dissidor</td><td className="p-1 border">close to Blanaka</td><td className="p-1 border">need to walk over <Input className={`${submitted ? (checkAnswerWithMatching(answers['19'] || '', correctAnswers['19'] as string, '19') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || submitted} placeholder="19" /></td><td className="p-1 border">need to take some <Input className={`w-20 ${submitted ? (checkAnswerWithMatching(answers['20a'] || '', correctAnswers['20a'] as string, '20a') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['20a'] || ''} onChange={e => handleInputChange('20a', e.target.value)} disabled={!isTestStarted || submitted} placeholder="20a" /> and <Input className={`w-20 ${submitted ? (checkAnswerWithMatching(answers['20b'] || '', correctAnswers['20b'] as string, '20b') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['20b'] || ''} onChange={e => handleInputChange('20b', e.target.value)} disabled={!isTestStarted || submitted} placeholder="20b" /></td></tr>
            </tbody></table>
            {submitted && (
              <div className="mt-2 text-sm">
                {!checkAnswerWithMatching(answers['11'] || '', correctAnswers['11'] as string, '11') && <p className="text-red-600">Q11: {correctAnswers['11']}</p>}
                {!checkAnswerWithMatching(answers['12'] || '', correctAnswers['12'] as string, '12') && <p className="text-red-600">Q12: {correctAnswers['12']}</p>}
                {!checkAnswerWithMatching(answers['13'] || '', correctAnswers['13'] as string, '13') && <p className="text-red-600">Q13: {correctAnswers['13']}</p>}
                {!checkAnswerWithMatching(answers['14'] || '', correctAnswers['14'] as string, '14') && <p className="text-red-600">Q14: {correctAnswers['14']}</p>}
                {!checkAnswerWithMatching(answers['15'] || '', correctAnswers['15'] as string, '15') && <p className="text-red-600">Q15: {correctAnswers['15']}</p>}
                {!checkAnswerWithMatching(answers['16'] || '', correctAnswers['16'] as string, '16') && <p className="text-red-600">Q16: {correctAnswers['16']}</p>}
                {!checkAnswerWithMatching(answers['17'] || '', correctAnswers['17'] as string, '17') && <p className="text-red-600">Q17: {correctAnswers['17']}</p>}
                {!checkAnswerWithMatching(answers['18'] || '', correctAnswers['18'] as string, '18') && <p className="text-red-600">Q18: {correctAnswers['18']}</p>}
                {!checkAnswerWithMatching(answers['19'] || '', correctAnswers['19'] as string, '19') && <p className="text-red-600">Q19: {correctAnswers['19']}</p>}
                {(!checkAnswerWithMatching(answers['20a'] || '', correctAnswers['20a'] as string, '20a') || !checkAnswerWithMatching(answers['20b'] || '', correctAnswers['20b'] as string, '20b')) && <p className="text-red-600">Q20: {correctAnswers['20a']}, {correctAnswers['20b']}</p>}
              </div>
            )}
        </CardContent></Card>
    </div>
  );
  
  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 3 - Questions 21-30</h3></div>
      <Card><CardHeader><p>Questions 21-30: Complete the notes below. Write <strong>NO MORE THAN THREE WORDS or A NUMBER</strong> for each answer.</p></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-bold text-lg mb-3">Procedure for Bookshops</h4>
          <ul className="space-y-2">
            <li>• Keep database of course/college details.</li>
            <li className="flex items-center">
              • In May, request 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['21'] || '', correctAnswers['21'] as string, '21') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['21'] || ''} 
                onChange={e => handleInputChange('21', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="21"
              />
              from lecturers.
              {submitted && !checkAnswerWithMatching(answers['21'] || '', correctAnswers['21'] as string, '21') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['21']})</span>}
            </li>
            <li className="flex items-center flex-wrap">
              • Categorise books as – essential reading
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['22'] || '', correctAnswers['22'] as string, '22') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['22'] || ''} 
                onChange={e => handleInputChange('22', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="22"
              />
              reading
              {submitted && !checkAnswerWithMatching(answers['22'] || '', correctAnswers['22'] as string, '22') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['22']})</span>}
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;– background reading
            </li>
            <li className="flex items-center flex-wrap">
              When ordering, refer to last year's 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['23'] || '', correctAnswers['23'] as string, '23') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['23'] || ''} 
                onChange={e => handleInputChange('23', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="23"
              />
              {submitted && !checkAnswerWithMatching(answers['23'] || '', correctAnswers['23'] as string, '23') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['23']})</span>}
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;– type of course
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;– students' 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['24'] || '', correctAnswers['24'] as string, '24') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['24'] || ''} 
                onChange={e => handleInputChange('24', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="24"
              />
              {submitted && !checkAnswerWithMatching(answers['24'] || '', correctAnswers['24'] as string, '24') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['24']})</span>}
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;– own judgement
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-3">Procedure for Publishers</h4>
          <ul className="space-y-2">
            <li className="flex items-center">
              • Send 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['25'] || '', correctAnswers['25'] as string, '25') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['25'] || ''} 
                onChange={e => handleInputChange('25', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="25"
              />
              to course providers
              {submitted && !checkAnswerWithMatching(answers['25'] || '', correctAnswers['25'] as string, '25') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['25']})</span>}
            </li>
            <li>• Use websites</li>
            <li className="flex items-center">
              • Compose personal 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['26'] || '', correctAnswers['26'] as string, '26') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['26'] || ''} 
                onChange={e => handleInputChange('26', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="26"
              />
              to academic staff
              {submitted && !checkAnswerWithMatching(answers['26'] || '', correctAnswers['26'] as string, '26') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['26']})</span>}
            </li>
            <li className="flex items-center">
              • Send 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['27'] || '', correctAnswers['27'] as string, '27') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['27'] || ''} 
                onChange={e => handleInputChange('27', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="27"
              />
              to bookstores
              {submitted && !checkAnswerWithMatching(answers['27'] || '', correctAnswers['27'] as string, '27') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['27']})</span>}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-3">Students</h4>
          <ul className="space-y-2">
            <li className="flex items-center">
              Main objective is to find books that are good 
              <Input 
                className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['28'] || '', correctAnswers['28'] as string, '28') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['28'] || ''} 
                onChange={e => handleInputChange('28', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="28"
              />
              {submitted && !checkAnswerWithMatching(answers['28'] || '', correctAnswers['28'] as string, '28') && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['28']})</span>}
            </li>
            <li className="flex items-center flex-wrap">
              Also look for books that are 
              <Input 
                className={`inline-block w-24 mx-2 ${submitted ? (checkAnswerWithMatching(answers['29'] || '', correctAnswers['29'] as string, '29') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['29'] || ''} 
                onChange={e => handleInputChange('29', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="29"
              />
              and 
              <Input 
                className={`inline-block w-24 mx-2 ${submitted ? (checkAnswerWithMatching(answers['30'] || '', correctAnswers['30'] as string, '30') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                value={answers['30'] || ''} 
                onChange={e => handleInputChange('30', e.target.value)}
                disabled={!isTestStarted || submitted}
                placeholder="30"
              />
              {submitted && (!checkAnswerWithMatching(answers['29'] || '', correctAnswers['29'] as string, '29') || !checkAnswerWithMatching(answers['30'] || '', correctAnswers['30'] as string, '30')) && 
                <span className="ml-2 text-sm text-red-600">({correctAnswers['29']}, {correctAnswers['30']})</span>}
            </li>
          </ul>
        </div>
      </CardContent></Card>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 4 - Questions 31-40</h3></div>
      <Card>
        <CardHeader><p>Questions 31-40: Complete the tasks.</p></CardHeader>
        <CardContent className="space-y-6">
            {renderSingleMcq('31', "At the start of her talk Rebecca points out that new graduates can find it hard to:", ["get the right work.", "take sufficient breaks.", "motivate themselves."])}
            {renderMultiMcq('32-33', "Questions 32-33: Which TWO of the following does Rebecca say worry new artists?", ["earning enough money", "moving to a new environment", "competing with other artists", "having their work criticised", "getting their portfolios ready"], "A-E")}
            {renderMultiMcq('34-35', "Questions 34-35: Which TWO of the following influenced Rebecca's decision to become an illustrator?", ["afforded her greater objectivity as an artist.", "offered her greater freedom of expression.", "allowed her to get her work published.", "enabled her to work from home.", "provided her with a steady income."], "A-E")}
            <div>
                <p className="font-semibold mb-4">Questions 36-40: Suggestions for Developing a Portfolio</p>
                <p className="mb-3"><strong>Complete the notes below.</strong></p>
                <p className="mb-3"><strong>Write NO MORE THAN THREE WORDS for each answer.</strong></p>
                <ul className="list-disc list-inside space-y-3">
                    <li className="flex items-center">
                        Get some artwork printed in magazines by entering 
                        <Input 
                            className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['36'] || '', correctAnswers['36'] as string, '36') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                            value={answers['36'] || ''} 
                            onChange={e => handleInputChange('36', e.target.value)}
                            disabled={!isTestStarted || submitted}
                            placeholder="36"
                        />
                        {submitted && !checkAnswerWithMatching(answers['36'] || '', correctAnswers['36'] as string, '36') && 
                            <span className="ml-2 text-sm text-red-600">({correctAnswers['36']})</span>}
                    </li>
                    <li className="flex items-center flex-wrap">
                        Also you can 
                        <Input 
                            className={`inline-block w-24 mx-2 ${submitted ? (checkAnswerWithMatching(answers['37a'] || '', correctAnswers['37a'] as string, '37a') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                            value={answers['37a'] || ''} 
                            onChange={e => handleInputChange('37a', e.target.value)}
                            disabled={!isTestStarted || submitted}
                            placeholder="37a"
                        />
                        and 
                        <Input 
                            className={`inline-block w-24 mx-2 ${submitted ? (checkAnswerWithMatching(answers['37b'] || '', correctAnswers['37b'] as string, '37b') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                            value={answers['37b'] || ''} 
                            onChange={e => handleInputChange('37b', e.target.value)}
                            disabled={!isTestStarted || submitted}
                            placeholder="37b"
                        />
                        mock up book pages.
                        {submitted && (!checkAnswerWithMatching(answers['37a'] || '', correctAnswers['37a'] as string, '37a') || !checkAnswerWithMatching(answers['37b'] || '', correctAnswers['37b'] as string, '37b')) && 
                            <span className="ml-2 text-sm text-red-600">({correctAnswers['37a']}, {correctAnswers['37b']})</span>}
                    </li>
                    <li className="flex items-center">
                        Make an effort to use a variety of artistic 
                        <Input 
                            className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['38'] || '', correctAnswers['38'] as string, '38') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                            value={answers['38'] || ''} 
                            onChange={e => handleInputChange('38', e.target.value)}
                            disabled={!isTestStarted || submitted}
                            placeholder="38"
                        />
                        {submitted && !checkAnswerWithMatching(answers['38'] || '', correctAnswers['38'] as string, '38') && 
                            <span className="ml-2 text-sm text-red-600">({correctAnswers['38']})</span>}
                    </li>
                    <li className="flex items-center">
                        Aim for recognition by dividing work into distinct 
                        <Input 
                            className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['39'] || '', correctAnswers['39'] as string, '39') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                            value={answers['39'] || ''} 
                            onChange={e => handleInputChange('39', e.target.value)}
                            disabled={!isTestStarted || submitted}
                            placeholder="39"
                        />
                        {submitted && !checkAnswerWithMatching(answers['39'] || '', correctAnswers['39'] as string, '39') && 
                            <span className="ml-2 text-sm text-red-600">({correctAnswers['39']})</span>}
                    </li>
                    <li className="flex items-center">
                        Possibly use 
                        <Input 
                            className={`inline-block w-32 mx-2 ${submitted ? (checkAnswerWithMatching(answers['40'] || '', correctAnswers['40'] as string, '40') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                            value={answers['40'] || ''} 
                            onChange={e => handleInputChange('40', e.target.value)}
                            disabled={!isTestStarted || submitted}
                            placeholder="40"
                        />
                        {submitted && !checkAnswerWithMatching(answers['40'] || '', correctAnswers['40'] as string, '40') && 
                            <span className="ml-2 text-sm text-red-600">({correctAnswers['40']})</span>}
                    </li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => (
    <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
          <div className="flex justify-center items-center space-x-8 mb-4">
            <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Raw Score</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 40 }, (_, i) => String(i + 1)).map((qKey) => {
              // Check if question is part of a multi-part question
              let isCorrect = false;
              let userAnswer = '';
              let correctAnswer = '';
              
              // Handle split questions (2, 20, 37)
              const splitQuestions = ['2', '20', '37'];
              if (splitQuestions.includes(qKey)) {
                const aAnswer = answers[qKey + 'a'] || '';
                const bAnswer = answers[qKey + 'b'] || '';
                const correctA = correctAnswers[qKey + 'a'] as string;
                const correctB = correctAnswers[qKey + 'b'] as string;
                
                isCorrect = checkAnswerWithMatching(aAnswer, correctA, qKey + 'a') && checkAnswerWithMatching(bAnswer, correctB, qKey + 'b');
                userAnswer = `${aAnswer}, ${bAnswer}`;
                correctAnswer = `${correctA}, ${correctB}`;
              } else {
                // Handle multi-part questions
                const multiPartKey = Object.keys(multiPartQuestions).find(key => 
                  multiPartQuestions[key as keyof typeof multiPartQuestions].parts.includes(qKey)
                );
                
                if (multiPartKey) {
                  const userAnswers = new Set(multipleAnswers[multiPartKey] || []);
                  const correctAnswerArray = Array.isArray(correctAnswers[multiPartKey]) ? correctAnswers[multiPartKey] as string[] : [];
                  const correctAnswersSet = new Set(correctAnswerArray);
                  
                  // For individual questions in multi-part, check if this specific answer is in user's selection
                  const questionAnswer = answers[qKey] || '';
                  isCorrect = correctAnswersSet.has(questionAnswer) && userAnswers.has(questionAnswer);
                  userAnswer = userAnswers.has(questionAnswer) ? questionAnswer : 'Not selected';
                  correctAnswer = correctAnswerArray.join(', ').toUpperCase();
                } else {
                  // Handle regular questions
                  isCorrect = checkAnswerWithMatching(answers[qKey] || '', correctAnswers[qKey] as string, qKey);
                  userAnswer = answers[qKey] || 'No answer';
                  correctAnswer = correctAnswers[qKey] as string;
                }
              }
              
              return (
                <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qKey}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                  <div className="text-sm">
                    <div className="mb-1">Your: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></div>
                    <div>Correct: <span className="text-green-700 font-medium">{correctAnswer}</span></div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="practice-tests-plus-1" module="listening" testNumber={3} />
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8"><Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listening Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-800 mb-4">IELTS Practice Tests Plus 1 - Listening Test 3</h1></div></div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus1.test3} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Practice Tests Plus 1 - Listening Test 3" />
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map((section) => <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || submitted}>Section {section}</Button>)}</div></div>
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        {!submitted && <div className="mt-8 text-center"><Button onClick={handleSubmit} size="lg" className="px-8" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>}
        {showResultsPopup && renderResults()}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics book="practice-tests-plus-1" module="listening" testNumber={3} />
          <UserTestHistory book="practice-tests-plus-1" module="listening" testNumber={3} />
        </div>
      </div>
    </div>
  );
}