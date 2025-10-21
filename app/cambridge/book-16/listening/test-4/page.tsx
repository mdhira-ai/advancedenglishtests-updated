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
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { TestStatistics } from '@/components/analytics/TestStatistics';
import { UserTestHistory } from '@/components/analytics/UserTestHistory';
import { saveTestScore } from '@/lib/test-score-saver';
import { useSession } from '@/lib/auth-client';

// Correct answers for all questions
const correctAnswers: { [key: string]: string } = {
  '1': '28th/twenty-eighth',
  '2': '550',
  '3': 'Chervil',
  '4': 'garage',
  '5': 'garden',
  '6': 'parking',
  '7': 'wood',
  '8': 'bridge',
  '9': 'monument',
  '10': 'March',
  '11': 'C',
  '12': 'A',
  '13': 'B',
  '14': 'B',
  '15': 'C',
  '16': 'F',
  '17': 'A',
  '18': 'I',
  '19': 'E',
  '20': 'H',
  '21': 'B', '22': 'C', // In either order
  '23': 'B', '24': 'C', // In either order
  '25': 'C',
  '26': 'F',
  '27': 'D',
  '28': 'E',
  '29': 'B',
  '30': 'A',
  '31': 'spice(s)',
  '32': 'colony/settlement',
  '33': 'fat',
  '34': 'head',
  '35': 'movement',
  '36': 'balance/balancing',
  '37': 'brain',
  '38': 'smell',
  '39': 'rats',
  '40': 'forest',
};

const correctSet21_22 = ['B', 'C'];
const correctSet23_24 = ['B', 'C'];

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({ '21_22': [], '23_24': [] });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);

  const handleInputChange = (qNum: string, val: string) => setAnswers(p => ({ ...p, [qNum]: val.toLowerCase() }));
  const handleMultipleChoice = (qNum: string, val: string) => setAnswers(p => ({ ...p, [qNum]: val.toUpperCase() }));

  const handleMultiSelect = (key: '21_22' | '23_24', val: string) => {
    setMultipleAnswers(p => {
      const current = p[key] || [];
      const newAnswers = current.includes(val) ? current.filter(ans => ans !== val) : (current.length < 2 ? [...current, val].sort() : current);
      return { ...p, [key]: newAnswers };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    const answered = new Set<string>();
    
    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (['21', '22'].includes(qNum)) {
            if (!answered.has('21_22')) {
                const userChoices = multipleAnswers['21_22'] || [];
                userChoices.forEach(choice => { if (correctSet21_22.includes(choice)) correctCount++; });
                answered.add('21_22');
            }
        } else if (['23', '24'].includes(qNum)) {
            if (!answered.has('23_24')) {
                const userChoices = multipleAnswers['23_24'] || [];
                userChoices.forEach(choice => { if (correctSet23_24.includes(choice)) correctCount++; });
                answered.add('23_24');
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
      // Save test score using test-score-saver
      const testScoreData = {
        book: 'book-16',
        module: 'listening',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined,
        userId: session?.user?.id || null
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', result.error);
      }
    } catch (error) { console.error('Error submitting test:', error); }
    setSubmitted(true);
    setShowResultsPopup(true);
    setIsSubmitting(false);
  };
 
  const renderAnswerStatusIcon = (isCorrect: boolean) => isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
  
  const renderMultiSelectStatus = (key: '21_22' | '23_24', correctSet: string[]) => {
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
        <div className={`p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
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

  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Holiday rental</h3>
          <p>Owners' names: Jack Fitzgerald and Shirley Fitzgerald</p>
          <p><strong>Granary Cottage</strong></p>
          <ul className="list-disc pl-5">
            <li>available for week beginning <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> May</li>
            <li>cost for the week: £ <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24" /></li>
          </ul>
          <p><strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> Cottage</p>
          <ul className="list-disc pl-5">
            <li>cost for the week: £480</li>
            <li>building was originally a <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>walk through doors from living room into a <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>several <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> spaces at the front</li>
            <li>bathroom has a shower</li>
            <li>central heating and stove that burns <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>views of old <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> from living room</li>
            <li>view of hilltop <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> from the bedroom</li>
          </ul>
          <p><strong>Payment</strong></p>
          <ul className="list-disc pl-5">
            <li>deposit: £144</li>
            <li>deadline for final payment: end of <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 11-14</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {renderMultipleChoiceQuestion('11', 'A survey found people\'s main concern about traffic in the area was', ['cuts to public transport.', 'poor maintenance of roads.', 'changes in the type of traffic.'])}
                {renderMultipleChoiceQuestion('12', 'Which change will shortly be made to the cycle path next to the river?', ['It will be widened.', 'It will be extended.', 'It will be resurfaced.'])}
                {renderMultipleChoiceQuestion('13', 'Plans for a pedestrian crossing have been postponed because', ['the Post Office has moved.', 'the proposed location is unsafe.', 'funding is not available at present.'])}
                {renderMultipleChoiceQuestion('14', 'On Station Road, notices have been erected', ['telling cyclists not to leave their bikes outside the station ticket office.', 'asking motorists to switch off engines when waiting at the level crossing.', 'warning pedestrians to leave enough time when crossing the railway line.'])}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 15-20</h4>
            <p className="text-sm mb-4">Label the map below. Write the correct letter, A-I, next to Questions 15-20.</p>
            <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book16/listening/test4/map.png" alt="Map of the area" className="w-full mb-4 rounded-lg shadow-sm" />
             <div className="space-y-2">
                {['New car park', 'New cricket pitch', 'Children\'s playground', 'Skateboard ramp', 'Pavilion', 'Notice board'].map((location, index) => {
                    const qNum = String(15 + index);
                    return (
                        <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                            <span className="flex-1"><strong>{qNum}</strong> {location}</span>
                            <Input placeholder="A-I" value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                        </div>
                    );
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 21 and 22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO benefits of city bike-sharing schemes do the students agree are the most important?</p>
          <div className="space-y-2">
            {['reducing noise pollution', 'reducing traffic congestion', 'improving air quality', 'encouraging health and fitness', 'making cycling affordable'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['21_22'].includes(opt)} onChange={() => handleMultiSelect('21_22', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('21_22', correctSet21_22)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 23 and 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO things do the students think are necessary for successful bike-sharing schemes?</p>
          <div className="space-y-2">
            {['Bikes should have a GPS system.', 'The app should be easy to use.', 'Public awareness should be raised.', 'Only one scheme should be available.', 'There should be a large network of cycle lanes.'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['23_24'].includes(opt)} onChange={() => handleMultiSelect('23_24', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('23_24', correctSet23_24)}
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm mb-2">What is the speakers' opinion of the bike-sharing schemes in each of the following cities?</p>
            <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-G, next to Questions 25-30.</p>
            <div className="border rounded-lg p-4 mb-4 text-sm">
                <p className="font-semibold">Opinion of bike-sharing scheme</p>
                <p>A. They agree it has been disappointing.</p><p>B. They think it should be cheaper.</p><p>C. They are surprised it has been so successful.</p><p>D. They agree that more investment is required.</p>
                <p>E. They think the system has been well designed.</p><p>F. They disagree about the reasons for its success.</p><p>G. They think it has expanded too quickly.</p>
            </div>
            <div className="space-y-2">
            {['Amsterdam', 'Dublin', 'London', 'Buenos Aires', 'New York', 'Sydney'].map((part, index) => {
                const qNum = String(25 + index);
                return (
                    <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                    <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                    <Input placeholder="A-G" value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
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
            <h3 className="font-bold text-center text-lg mb-4">THE EXTINCTION OF THE DODO BIRD</h3>
            <p><strong>History</strong></p>
            <ul className="list-disc pl-5">
              <li>1507 - Portuguese ships transporting <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> stopped at the island to collect food and water.</li>
              <li>1638 - The Dutch established a <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> on the island.</li>
              <li>They killed the dodo birds for their meat.</li>
              <li>The last one was killed in 1681.</li>
            </ul>
            <p><strong>Description</strong></p>
            <ul className="list-disc pl-5">
              <li>The only record we have is written descriptions and pictures (possibly unreliable).</li>
              <li>A Dutch painting suggests the dodo was very <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>The only remaining soft tissue is a dried <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>Recent studies of a dodo skeleton suggest the birds were capable of rapid <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>It's thought they were able to use their small wings to maintain <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>Their <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> was of average size.</li>
              <li>Their sense of <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> enabled them to find food.</li>
            </ul>
            <p><strong>Reasons for extinction</strong></p>
            <ul className="list-disc pl-5">
              <li>Hunting was probably not the main cause.</li>
              <li>Sailors brought dogs and monkeys.</li>
              <li><strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> also escaped onto the island and ate the birds' eggs.</li>
              <li>The arrival of farming meant the <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> was destroyed.</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-16" module="listening" testNumber={4} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 16 - Test 4 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book16.test4} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 16 - Listening Test 4" />
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
                    let userAnswer: string = ''; let isCorrect: boolean = false; let displayQNum = `Q${qNum}`;
                    
                    if (['21', '22'].includes(qNum)) {
                        userAnswer = (multipleAnswers['21_22'] || []).join(', '); isCorrect = !!userAnswer && correctSet21_22.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet21_22.join('').length; correctAns = correctSet21_22.join(', '); if (qNum === '21') return null; displayQNum = 'Q21-22';
                    } else if (['23', '24'].includes(qNum)) {
                        userAnswer = (multipleAnswers['23_24'] || []).join(', '); isCorrect = !!userAnswer && correctSet23_24.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet23_24.join('').length; correctAns = correctSet23_24.join(', '); if (qNum === '23') return null; displayQNum = 'Q23-24';
                    } else {
                        userAnswer = answers[qNum] || ''; isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum);
                    }
                    
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between"><span className="font-medium">{displayQNum}</span> {renderAnswerStatusIcon(isCorrect)}</div>
                        <p className="text-sm">Your: {userAnswer || 'No answer'}</p><p className="text-sm">Correct: {correctAns}</p>
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
      <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="listening" testNumber={4} /><UserTestHistory book="book-16" module="listening" testNumber={4} /></div>
    </div>
  );
}