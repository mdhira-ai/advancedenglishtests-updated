'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';

// Correct answers for all questions
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'Canadian',
  '2': 'furniture',
  '3': 'Park',
  '4': '250',
  '5': 'phone',
  '6': '10(th) September',
  '7': 'museum',
  '8': 'time',
  '9': 'blond/blonde',
  '10': '87954 82361',
  
  // Section 2: Questions 11-20
  '11': 'A',
  '12': 'C',
  '13': 'B',
  '14': 'E',
  '15': 'B',
  '16': 'B',
  '17': 'C',
  '18': 'A',
  '19': 'A',
  '20': 'C',
  
  // Section 3: Questions 21-30
  '21': 'B',
  '22': 'A',
  '23': 'C',
  '24': 'B',
  '25': 'A',
  '26': 'B',
  '27': 'A',
  '28': 'F',
  '29': 'G',
  '30': 'C',

  // Section 4: Questions 31-40
  '31': 'industry',
  '32': 'constant',
  '33': 'direction',
  '34': 'floor',
  '35': 'predictable', // Note: Correct answer from audio is 'floor', answer key has typo. Let's use audio/key: floor
  '36': 'bay',
  '37': 'gates',
  '38': 'fuel',
  '39': 'jobs',
  '40': 'migration',
};

const correctSet11_12 = ['A', 'C'];
const correctSet13_14 = ['B', 'E'];

export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '11_12': [],
    '13_14': [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const handleMultiSelect = (questionKey: '11_12' | '13_14', value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const maxAnswers = 2;
        let newAnswers;
        if (currentAnswers.includes(value)) {
            newAnswers = currentAnswers.filter(ans => ans !== value);
        } else {
            if (currentAnswers.length < maxAnswers) {
                newAnswers = [...currentAnswers, value].sort();
            } else { newAnswers = currentAnswers; }
        }
        return { ...prev, [questionKey]: newAnswers };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    if (['11', '12'].includes(questionNumber)) {
        return (multipleAnswers['11_12'] || []).length === 2 && correctSet11_12.every(ans => multipleAnswers['11_12'].includes(ans));
    }
    if (['13', '14'].includes(questionNumber)) {
        return (multipleAnswers['13_14'] || []).length === 2 && correctSet13_14.every(ans => multipleAnswers['13_14'].includes(ans));
    }
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    const answeredMultiSelect = new Set<string>();

    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (['11', '12'].includes(qNum)) {
            if (!answeredMultiSelect.has('11_12')) {
                const userChoices = multipleAnswers['11_12'] || [];
                userChoices.forEach(choice => {
                    if (correctSet11_12.includes(choice)) { correctCount++; }
                });
                answeredMultiSelect.add('11_12');
            }
        } else if (['13', '14'].includes(qNum)) {
            if (!answeredMultiSelect.has('13_14')) {
                const userChoices = multipleAnswers['13_14'] || [];
                userChoices.forEach(choice => {
                    if (correctSet13_14.includes(choice)) { correctCount++; }
                });
                answeredMultiSelect.add('13_14');
            }
        } else if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
            correctCount++;
        }
    }
    return correctCount;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    const detailedAnswers = { singleAnswers: answers, multipleAnswers, score: calculatedScore, timeTaken };
    try {
      await saveTestScore({
        userId: session?.user?.id || null,
        book: 'book-14',
        module: 'listening',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
      });
    } catch (error) { console.error('Error submitting test:', error); }
    setSubmitted(true);
    setShowResultsPopup(true);
    setIsSubmitting(false);
  };
 
  const renderAnswerStatusIcon = (isCorrect: boolean) => isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
  
  const renderMultiSelectStatus = (key: '11_12' | '13_14', correctSet: string[]) => {
    if (!submitted) return null;
    const userChoices = multipleAnswers[key] || [];
    const isFullyCorrect = userChoices.length === correctSet.length && correctSet.every(ans => userChoices.includes(ans));
    return (
        <div className="mt-2 flex items-center gap-2">
            {renderAnswerStatusIcon(isFullyCorrect)}
            <span className="text-sm text-gray-600">Correct answers: {correctSet.join(' and ')}</span>
        </div>
    );
  };

  const renderMultipleChoiceQuestion = (qNum: string, question: string, options: string[]) => (
    <div>
        <p className="font-medium mb-2">{qNum}. {question}</p>
        <div className={`p-2 rounded ${submitted ? (checkAnswer(qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
            <div className="space-y-2">
                {options.map((option, index) => {
                    const optionValue = String.fromCharCode(65 + index);
                    return (
                        <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name={`question-${qNum}`} value={optionValue} checked={answers[qNum] === optionValue}
                                onChange={() => handleMultipleChoice(qNum, optionValue)} disabled={!isTestStarted || submitted} className="w-4 h-4" />
                            <span>{optionValue} {option}</span>
                        </label>
                    );
                })}
            </div>
            {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: {correctAnswers[qNum]}</p>}
        </div>
    </div>
  );
  
  const renderMatchingQuestion = (startQ: number, endQ: number, title: string, questions: string[], options: {key: string, value: string}[]) => (
    <div>
        <h4 className="font-semibold mb-2">{title}</h4>
        <div className="border p-4 rounded-lg">
            <div className="flex justify-end mb-2">
                {options.map(opt => <div key={opt.key} className="w-16 text-center font-bold">{opt.key}</div>)}
            </div>
            {questions.map((question, index) => {
                const qNum = String(startQ + index);
                const isCorrect = submitted && checkAnswer(qNum);
                return (
                    <div key={qNum} className={`flex items-center py-2 border-t ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                        <span className="flex-1">{qNum}. {question}</span>
                        <div className="flex justify-end">
                            {options.map(opt => (
                                <div key={opt.key} className="w-16 text-center">
                                    <input type="radio" name={`question-${qNum}`} value={opt.key} checked={answers[qNum] === opt.key}
                                        onChange={() => handleMultipleChoice(qNum, opt.key)} disabled={!isTestStarted || submitted} />
                                </div>
                            ))}
                        </div>
                         {submitted && <span className="text-xs ml-2 w-20">Ans: {correctAnswers[qNum]}</span>}
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">CRIME REPORT FORM</h3>
          <p><strong>Type of crime:</strong> theft</p>
          <p><strong>Personal information</strong></p>
          <p>Example: Name - Louise <span className="underline">Taylor</span></p>
          <p>Nationality: <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Date of birth: 14 December 1977</p>
          <p>Occupation: interior designer</p>
          <p>Reason for visit: business (to buy antique <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />)</p>
          <p>Length of stay: two months</p>
          <p>Current address: <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> Apartments (No 15)</p>
          <p><strong>Details of theft</strong></p>
          <p>Items stolen: - a wallet containing approximately <strong>4</strong> £ <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24" /> </p>
          <p>               - a <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Date of theft: <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p><strong>Possible time and place of theft</strong></p>
          <p>Location: outside the <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> at about 4 pm</p>
          <p>Details of suspect: - some boys asked for the <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> then ran off</p>
          <p>                   - one had a T-shirt with a picture of a tiger</p>
          <p>                   - he was about 12, slim build with <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> hair</p>
          <p><strong>Crime reference number allocated</strong></p>
          <p><strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-8">
            <div>
              <h4 className="font-semibold mb-2">Questions 11 and 12</h4>
              <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
              <p className="font-medium mb-4">Which TWO pieces of advice for the first week of an apprenticeship does the manager give?</p>
              <div className="space-y-2">
                {['get to know colleagues', 'learn from any mistakes', 'ask lots of questions', 'react positively to feedback', 'enjoy new challenges'].map((option, index) => {
                  const opt = String.fromCharCode(65 + index);
                  return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['11_12'].includes(opt)} onChange={() => handleMultiSelect('11_12', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
                })}
              </div>
              {renderMultiSelectStatus('11_12', correctSet11_12)}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Questions 13 and 14</h4>
              <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
              <p className="font-medium mb-4">Which TWO things does the manager say mentors can help with?</p>
              <div className="space-y-2">
                {['confidence-building', 'making career plans', 'completing difficult tasks', 'making a weekly timetable', 'reviewing progress'].map((option, index) => {
                  const opt = String.fromCharCode(65 + index);
                  return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['13_14'].includes(opt)} onChange={() => handleMultiSelect('13_14', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
                })}
              </div>
              {renderMultiSelectStatus('13_14', correctSet13_14)}
            </div>
            <div>
              {renderMatchingQuestion(15, 20, "Questions 15-20",
                  [ "Using the internet", "Flexible working", "Booking holidays", "Working overtime", "Wearing trainers", "Bringing food to work" ],
                  [ {key: 'A', value: 'It is encouraged.'}, {key: 'B', value: 'There are some restrictions.'}, {key: 'C', value: 'It is against the rules.'} ]
              )}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-25</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {renderMultipleChoiceQuestion('21', 'Carla and Rob were surprised to learn that coastal cities', ['contain nearly half the world\'s population.', 'include most of the world\'s largest cities.', 'are growing twice as fast as other cities.'])}
                {renderMultipleChoiceQuestion('22', 'According to Rob, building coastal cities near to rivers', ['may bring pollution to the cities.', 'may reduce the land available for agriculture.', 'may mean the countryside is spoiled by industry.'])}
                {renderMultipleChoiceQuestion('23', 'What mistake was made when building water drainage channels in Miami in the 1950s?', ['There were not enough of them.', 'They were made of unsuitable materials.', 'They did not allow for the effects of climate change.'])}
                {renderMultipleChoiceQuestion('24', 'What do Rob and Carla think that the authorities in Miami should do immediately?', ['take measures to restore ecosystems.', 'pay for a new flood prevention system.', 'stop disposing of waste materials into the ocean.'])}
                {renderMultipleChoiceQuestion('25', 'What do they agree should be the priority for international action?', ['greater coordination of activities', 'more sharing of information', 'agreement on shared policies'])}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 26-30</h4>
            <p className="text-sm mb-2">What decision do the students make about each of the following parts of their presentation?</p>
            <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A-G, next to Questions 26-30.</p>
            <div className="border rounded-lg p-4 mb-4">
                <p className="font-semibold">Decisions</p>
                <p>A. use visuals</p>
                <p>B. keep it short</p>
                <p>C. involve other students</p>
                <p>D. check the information is accurate</p>
                <p>E. provide a handout</p>
                <p>F. focus on one example</p>
                <p>G. do online research</p>
            </div>
            <div className="space-y-2">
                {['Historical background', 'Geographical factors', 'Past mistakes', 'Future risks', 'International implications'].map((part, index) => {
                    const qNum = String(26 + index);
                    const isCorrect = submitted && checkAnswer(qNum);
                    return (
                        <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                            <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                            <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                        </div>
                    );
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">Marine renewable energy (ocean energy)</h3>
            <p><strong>Introduction</strong></p>
            <ul className="list-disc pl-5"><li>More energy required because of growth in population and <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li></ul>
            <p><strong>What's needed:</strong></p>
            <ul className="list-disc pl-5"><li>renewable energy sources</li><li>methods that won't create pollution</li></ul>
            <p><strong>Wave energy</strong></p>
            <ul className="list-disc pl-5"><li>Advantage: waves provide a <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> source of renewable energy</li><li>Electricity can be generated using offshore or onshore systems</li><li>Onshore systems may use a reservoir</li></ul>
            <p><strong>Problems:</strong></p>
            <ul className="list-disc pl-5"><li>waves can move in any <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li><li>movement of sand, etc. on the <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> of the ocean may be affected</li></ul>
            <p><strong>Tidal energy</strong></p>
            <ul className="list-disc pl-5"><li>Tides are more <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> than waves</li><li>Planned tidal lagoon in Wales; will be created in a <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> at Swansea</li><li>breakwater (dam) containing 16 turbines</li><li>rising tide forces water through turbines, generating electricity</li><li>stored water is released through <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />, driving the turbines in the reverse direction</li></ul>
            <p><strong>Advantages:</strong></p>
            <ul className="list-disc pl-5"><li>not dependent on weather</li><li>no <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> is required to make it work</li><li>likely to create a number of <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li></ul>
            <p><strong>Problem:</strong></p>
            <ul className="list-disc pl-5"><li>may harm fish and birds, e.g. by affecting <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> and building up silt</li></ul>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 14 - Test 1 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book14.test1} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 14 - Listening Test 1" />
        <Card className="my-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>Answer all questions as you listen.</li><li>This test has 40 questions.</li></ul></CardContent></Card>
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? 'default' : 'outline'} onClick={() => setCurrentSection(s)} className="w-24" disabled={!isTestStarted || submitted}>Section {s}</Button>)}</div></div>
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        <div className="flex gap-4 justify-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || submitted} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
                <div className="flex justify-center items-center space-x-8">
                  <div><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Raw Score</div></div>
                  <div><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm">IELTS Band</div></div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([qNum, correctAns]) => {
                    let userAnswer: string = '';
                    let isCorrect: boolean = false;
                     if (['11', '12'].includes(qNum)) {
                         userAnswer = (multipleAnswers['11_12'] || []).join(', ');
                         isCorrect = !!userAnswer && correctSet11_12.every(a => userAnswer.includes(a));
                         correctAns = correctSet11_12.join(', ');
                     } else if (['13', '14'].includes(qNum)) {
                         userAnswer = (multipleAnswers['13_14'] || []).join(', ');
                         isCorrect = !!userAnswer && correctSet13_14.every(a => userAnswer.includes(a));
                         correctAns = correctSet13_14.join(', ');
                     } else {
                        userAnswer = answers[qNum] || '';
                        isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum);
                     }
                    if ((['11', '13'].includes(qNum))) return null;
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                           <span className="font-medium">{['12','14'].includes(qNum) ? `Q${parseInt(qNum)-1}-${qNum}`: `Q${qNum}`}</span> {renderAnswerStatusIcon(isCorrect)}
                        </div>
                        <p className="text-sm">Your: {userAnswer || 'No answer'}</p>
                        <p className="text-sm">Correct: {correctAns}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
      <PageViewTracker 
        book="book-14" 
        module="listening" 
        testNumber={1} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-14" module="listening" testNumber={1} />
          <UserTestHistory book="book-14" module="listening" testNumber={1} />
        </div>
      </div>
    </div>
  );
}