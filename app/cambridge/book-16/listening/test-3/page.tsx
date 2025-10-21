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
  '1': 'park',
  '2': 'blue',
  '3': 'reference',
  '4': 'story',
  '5': 'rain',
  '6': 'snack',
  '7': 'medication',
  '8': 'helmet',
  '9': 'tent',
  '10': '199',
  '11': 'A', '12': 'C', // in either order
  '13': 'B', '14': 'C', // in either order
  '15': 'D',
  '16': 'F',
  '17': 'A',
  '18': 'H',
  '19': 'C',
  '20': 'G',
  '21': 'C', '22': 'D', // in either order
  '23': 'C', '24': 'E', // in either order
  '25': 'C',
  '26': 'A',
  '27': 'B',
  '28': 'A',
  '29': 'A',
  '30': 'C',
  '31': 'grandmother',
  '32': 'decade',
  '33': 'equipment',
  '34': 'economic',
  '35': 'basic',
  '36': 'round',
  '37': 'bone',
  '38': 'rough',
  '39': 'style',
  '40': 'sheep',
};

const correctSet11_12 = ['A', 'C'];
const correctSet13_14 = ['B', 'C'];
const correctSet21_22 = ['C', 'D'];
const correctSet23_24 = ['C', 'E'];

export default function Test3Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '11_12': [], '13_14': [], '21_22': [], '23_24': [],
  });
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

  const handleMultiSelect = (key: '11_12' | '13_14' | '21_22' | '23_24', val: string) => {
    setMultipleAnswers(p => {
      const current = p[key] || [];
      const newAnswers = current.includes(val) ? current.filter(ans => ans !== val) : (current.length < 2 ? [...current, val].sort() : current);
      return { ...p, [key]: newAnswers };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    const answered = new Set<string>();
    const multiSelectGroups = { '11_12': correctSet11_12, '13_14': correctSet13_14, '21_22': correctSet21_22, '23_24': correctSet23_24 };
    
    for (let i = 1; i <= 40; i++) {
      const qNum = String(i);
      let inMultiGroup = false;
      for (const key in multiSelectGroups) {
        if (key.split('_').includes(qNum)) {
          inMultiGroup = true;
          if (!answered.has(key)) {
            const userChoices = multipleAnswers[key as keyof typeof multipleAnswers] || [];
            userChoices.forEach(choice => {
              if (multiSelectGroups[key as keyof typeof multiSelectGroups].includes(choice)) { correctCount++; }
            });
            answered.add(key);
          }
          break;
        }
      }
      if (!inMultiGroup && checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
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
        testNumber: 3,
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
  
  const renderMultiSelectStatus = (key: keyof typeof multipleAnswers, correctSet: string[]) => {
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
          <h3 className="font-bold text-center text-lg mb-4">JUNIOR CYCLE CAMP</h3>
          <p>The course focuses on skills and safety.</p>
          <ul className="list-disc pl-5">
            <li>Charlie would be placed in Level 5.</li>
            <li>First of all, children at this level are taken to practise in a <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
          </ul>
          <p><strong>Instructors</strong></p>
          <ul className="list-disc pl-5">
            <li>Instructors wear <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> shirts.</li>
            <li>A <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> is required and training is given.</li>
          </ul>
          <p><strong>Classes</strong></p>
          <ul className="list-disc pl-5">
            <li>The size of the classes is limited.</li>
            <li>There are quiet times during the morning for a <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> or a game.</li>
            <li>Classes are held even if there is <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
          </ul>
          <p><strong>What to bring</strong></p>
          <ul className="list-disc pl-5">
            <li>a change of clothing</li>
            <li>a <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>shoes (not sandals)</li>
            <li>Charlie's <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
          </ul>
          <p><strong>Day 1</strong></p>
          <ul className="list-disc pl-5">
            <li>Charlie should arrive at 9.20 am on the first day.</li>
            <li>Before the class, his <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> will be checked.</li>
            <li>He should then go to the <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> to meet his class instructor.</li>
          </ul>
          <p><strong>Cost</strong></p>
          <ul className="list-disc pl-5">
            <li>The course costs $ <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24" /> per week.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 11 and 12</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">According to Megan, what are the TWO main advantages of working in the agriculture and horticulture sectors?</p>
          <div className="space-y-2">
            {['the active lifestyle', 'the above-average salaries', 'the flexible working opportunities', 'the opportunities for overseas travel', 'the chance to be in a natural environment'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['11_12'].includes(opt)} onChange={() => handleMultiSelect('11_12', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('11_12', correctSet11_12)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 13 and 14</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO of the following are likely to be disadvantages for people working outdoors?</p>
          <div className="space-y-2">
            {['the increasing risk of accidents', 'being in a very quiet location', 'difficult weather conditions at times', 'the cost of housing', 'the level of physical fitness required'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['13_14'].includes(opt)} onChange={() => handleMultiSelect('13_14', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('13_14', correctSet13_14)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm mb-2">What information does Megan give about each of the following job opportunities?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 15-20.</p>
          <div className="border rounded-lg p-4 mb-4 text-sm">
            <p className="font-semibold">Information</p>
            <p>A. not a permanent job</p><p>B. involves leading a team</p><p>C. experience not essential</p><p>D. intensive work but also fun</p>
            <p>E. chance to earn more through overtime</p><p>F. chance for rapid promotion</p><p>G. accommodation available</p><p>H. local travel involved</p>
          </div>
          <div className="space-y-2">
            {['Fresh food commercial manager', 'Agronomist', 'Fresh produce buyer', 'Garden centre sales manager', 'Tree technician', 'Farm worker'].map((part, index) => {
              const qNum = String(15 + index);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input placeholder="A-H" value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
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
          <p className="font-medium mb-4">Which TWO points does Adam make about his experiment on artificial sweeteners?</p>
          <div className="space-y-2">
            {['The results were what he had predicted.', 'The experiment was simple to set up.', 'A large sample of people was tested.', 'The subjects were unaware of what they were drinking.', 'The test was repeated several times for each person.'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['21_22'].includes(opt)} onChange={() => handleMultiSelect('21_22', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('21_22', correctSet21_22)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 23 and 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO problems did Rosie have when measuring the fat content of nuts?</p>
          <div className="space-y-2">
            {['She used the wrong sort of nuts.', 'She used an unsuitable chemical.', 'She did not grind the nuts finely enough.', 'The information on the nut package was incorrect.', 'The weighing scales may have been unsuitable.'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['23_24'].includes(opt)} onChange={() => handleMultiSelect('23_24', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('23_24', correctSet23_24)}
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {renderMultipleChoiceQuestion('25', 'Adam suggests that restaurants could reduce obesity if their menus', ['offered fewer options.', 'had more low-calorie foods.', 'were organised in a particular way.'])}
                {renderMultipleChoiceQuestion('26', 'The students agree that food manufacturers deliberately', ['make calorie counts hard to understand.', 'fail to provide accurate calorie counts.', 'use ineffective methods to reduce calories.'])}
                {renderMultipleChoiceQuestion('27', 'What does Rosie say about levels of exercise in England?', ['The amount recommended is much too low.', 'Most people overestimate how much they do.', 'Women now exercise more than they used to.'])}
                {renderMultipleChoiceQuestion('28', 'Adam refers to the location and width of stairs in a train station to illustrate', ['practical changes that can influence people\'s behaviour.', 'methods of helping people who have mobility problems.', 'ways of preventing accidents by controlling crowd movement.'])}
                {renderMultipleChoiceQuestion('29', 'What do the students agree about including reference to exercise in their presentation?', ['They should probably leave it out.', 'They need to do more research on it.', 'They should discuss this with their tutor.'])}
                {renderMultipleChoiceQuestion('30', 'What are the students going to do next for their presentation?', ['prepare some slides for it', 'find out how long they have for it', 'decide on its content and organisation'])}
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
            <h3 className="font-bold text-center text-lg mb-4">Hand knitting</h3>
            <p><strong>Interest in knitting</strong></p>
            <ul className="list-disc pl-5">
              <li>Knitting has a long history around the world.</li>
              <li>We imagine someone like a <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> knitting.</li>
              <li>A <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> ago, knitting was expected to disappear.</li>
              <li>The number of knitting classes is now increasing.</li>
              <li>People are buying more <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> for knitting nowadays.</li>
            </ul>
            <p><strong>Benefits of knitting</strong></p>
            <ul className="list-disc pl-5">
              <li>gives support in times of <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> difficulty</li>
              <li>requires only <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> skills and little money to start</li>
              <li>reduces stress in a busy life</li>
            </ul>
            <p><strong>Early knitting</strong></p>
            <ul className="list-disc pl-5">
              <li>The origins are not known.</li>
              <li>Findings show early knitted items to be <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> in shape.</li>
              <li>The first needles were made of natural materials such as wood and <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>Early yarns felt <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> to touch.</li>
              <li>Wool became the most popular yarn for spinning.</li>
              <li>Geographical areas had their own <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> of knitting.</li>
              <li>Everyday tasks like looking after <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> were done while knitting.</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-16" module="listening" testNumber={3} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 16 - Test 3 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book16.test3} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 16 - Listening Test 3" />
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
                    let displayQNum = `Q${qNum}`;

                    if (['11', '12'].includes(qNum)) {
                        userAnswer = (multipleAnswers['11_12'] || []).join(', '); isCorrect = !!userAnswer && correctSet11_12.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet11_12.join('').length; correctAns = correctSet11_12.join(', '); if (qNum === '11') return null; displayQNum = 'Q11-12';
                    } else if (['13', '14'].includes(qNum)) {
                        userAnswer = (multipleAnswers['13_14'] || []).join(', '); isCorrect = !!userAnswer && correctSet13_14.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet13_14.join('').length; correctAns = correctSet13_14.join(', '); if (qNum === '13') return null; displayQNum = 'Q13-14';
                    } else if (['21', '22'].includes(qNum)) {
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
      <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="listening" testNumber={3} /><UserTestHistory book="book-16" module="listening" testNumber={3} /></div>
    </div>
  );
}