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
  '1': 'frame',
  '2': '195',
  '3': 'payment',
  '4': 'Grandparents',
  '5': 'colour/color',
  '6': 'hand',
  '7': 'background',
  '8': 'focus',
  '9': 'ten/10 days',
  '10': 'plastic',
  '11': 'C',
  '12': 'B',
  '13': 'A',
  '14': 'A',
  '15': 'C',
  '16': 'D',
  '17': 'A',
  '18': 'B',
  '19': 'B', // in either order
  '20': 'C', // in either order
  '21': 'B',
  '22': 'A',
  '23': 'C',
  '24': 'C',
  '25': 'history',
  '26': 'paper',
  '27': 'humans/people',
  '28': 'stress',
  '29': 'graph',
  '30': 'evaluate',
  '31': 'creativity',
  '32': 'therapy',
  '33': 'fitness',
  '34': 'balance',
  '35': 'brain',
  '36': 'motivation',
  '37': 'isolation',
  '38': 'calories',
  '39': 'obesity',
  '40': 'habit',
};

const correctSet19_20 = ['B', 'C'];

export default function Test2Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '19_20': [],
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

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toUpperCase() }));
  };

  const handleMultiSelect = (questionKey: '19_20', value: string) => {
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
  
  const calculateScore = () => {
    let correctCount = 0;
    const answeredMultiSelect = new Set<string>();

    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (['19', '20'].includes(qNum)) {
            if (!answeredMultiSelect.has('19_20')) {
                const userChoices = multipleAnswers['19_20'] || [];
                userChoices.forEach(choice => {
                    if (correctSet19_20.includes(choice)) { correctCount++; }
                });
                answeredMultiSelect.add('19_20');
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
        testNumber: 2,
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
  
  const renderMultiSelectStatus = (key: '19_20', correctSet: string[]) => {
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
          <h3 className="font-bold text-center text-lg mb-4">Copying photos to digital format</h3>
          <p><strong>Name of company: Picturerep</strong></p>
          <p><strong>Requirements</strong></p>
          <ul className="list-disc pl-5">
            <li>Maximum size of photos is 30 cm, minimum size 4 cm.</li>
            <li>Photos must not be in a <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> or an album.</li>
          </ul>
          <p><strong>Cost</strong></p>
          <ul className="list-disc pl-5">
            <li>The cost for 360 photos is £ <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24" /> (including one disk).</li>
            <li>Before the completed order is sent, <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> is required.</li>
          </ul>
          <p><strong>Services included in the price</strong></p>
          <ul className="list-disc pl-5">
            <li>Photos can be placed in a folder, e.g. with the name <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
            <li>The <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> and contrast can be improved if necessary.</li>
            <li>Photos which are very fragile will be scanned by <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
          </ul>
          <p><strong>Special restore service (costs extra)</strong></p>
          <ul className="list-disc pl-5">
            <li>It may be possible to remove an object from a photo, or change the <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
            <li>A photo which is not correctly in <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> cannot be fixed.</li>
          </ul>
          <p><strong>Other information</strong></p>
          <ul className="list-disc pl-5">
            <li>Orders are completed within <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
            <li>Send the photos in a box (not <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />).</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 11-15</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('11', 'Dartfield House school used to be', ['a tourist information centre.', 'a private home.', 'a local council building.'])}
            {renderMultipleChoiceQuestion('12', 'What is planned with regard to the lower school?', ['All buildings on the main site will be improved.', 'The lower school site will be used for new homes.', 'Additional school buildings will be constructed on the lower school site.'])}
            {renderMultipleChoiceQuestion('13', 'The catering has been changed because of', ['long queuing times.', 'changes to the school timetable.', 'dissatisfaction with the menus.'])}
            {renderMultipleChoiceQuestion('14', 'Parents are asked to', ['help their children to decide in advance which serving point to use.', 'make sure their children have enough money for food.', 'advise their children on healthy food to eat.'])}
            {renderMultipleChoiceQuestion('15', 'What does the speaker say about the existing canteen?', ['Food will still be served there.', 'Only staff will have access to it.', 'Pupils can take their food into it.'])}
          </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 16-18</h4>
            <p className="text-sm mb-2">What comment does the speaker make about each of the following serving points in the Food Hall?</p>
            <p className="text-sm font-semibold mb-4">Choose THREE answers from the box and write the correct letter, A-D, next to Questions 16-18.</p>
            <div className="border rounded-lg p-4 mb-4 text-sm">
                <p className="font-semibold">Comments</p>
                <p>A. pupils help to plan menus</p> <p>B. only vegetarian food</p> <p>C. different food every week</p> <p>D. daily change in menu</p>
            </div>
            <div className="space-y-2">
                {['World Adventures', 'Street Life', 'Speedy Italian'].map((part, index) => {
                    const qNum = String(16 + index);
                    const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
                    return (
                        <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                            <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                            <Input placeholder="A-D" value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                        </div>
                    );
                })}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
            <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
            <p className="font-medium mb-4">Which TWO optional after-school lessons are new?</p>
            <div className="space-y-2">
            {['swimming', 'piano', 'acting', 'cycling', 'theatre sound and lighting'].map((option, index) => {
                const opt = String.fromCharCode(65 + index);
                return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['19_20'].includes(opt)} onChange={() => handleMultiSelect('19_20', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
            </div>
            {renderMultiSelectStatus('19_20', correctSet19_20)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 21-24</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('21', 'Luke read that one reason why we often forget dreams is that', ['our memories cannot cope with too much information.', 'we might otherwise be confused about what is real.', 'we do not think they are important.'])}
            {renderMultipleChoiceQuestion('22', 'What do Luke and Susie agree about dreams predicting the future?', ['It may just be due to chance.', 'It only happens with certain types of event.', 'It happens more often than some people think.'])}
            {renderMultipleChoiceQuestion('23', 'Susie says that a study on pre-school children having a short nap in the day', ['had controversial results.', 'used faulty research methodology.', 'failed to reach any clear conclusions.'])}
            {renderMultipleChoiceQuestion('24', 'In their last assignment, both students had problems with', ['statistical analysis.', 'making an action plan.', 'self-assessment.'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <p className="text-sm mb-4">Complete the flow chart below. Write ONE WORD ONLY for each answer.</p>
          <div className="bg-gray-100 p-4 rounded-lg space-y-3 border">
            <h3 className="font-bold text-center text-lg mb-4">Assignment plan</h3>
            <div className="text-center p-2 border rounded">Decide on research question: Is there a relationship between hours of sleep and number of dreams?</div>
            <div className="text-center font-bold">↓</div>
            <div className="text-center p-2 border rounded">Decide on sample: Twelve students from the <strong>25</strong> <Input value={answers['25'] || ''} onChange={e => handleInputChange('25', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> department</div>
            <div className="text-center font-bold">↓</div>
            <div className="text-center p-2 border rounded">Decide on methodology: Self-reporting</div>
            <div className="text-center font-bold">↓</div>
            <div className="text-center p-2 border rounded">Decide on procedure: Answers on <strong>26</strong> <Input value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></div>
            <div className="text-center font-bold">↓</div>
            <div className="text-center p-2 border rounded">Check ethical guidelines for working with <strong>27</strong> <Input value={answers['27'] || ''} onChange={e => handleInputChange('27', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />. Ensure that risk is assessed and <strong>28</strong> <Input value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> is kept to a minimum.</div>
            <div className="text-center font-bold">↓</div>
            <div className="text-center p-2 border rounded">Analyse the results: Calculate the correlation and make a <strong>29</strong> <Input value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</div>
            <div className="text-center font-bold">↓</div>
            <div className="text-center p-2 border rounded"><strong>30</strong> <Input value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> the research.</div>
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
            <h3 className="font-bold text-center text-lg mb-4">Health benefits of dance</h3>
            <p><strong>Recent findings:</strong></p>
            <ul className="list-disc pl-5">
              <li>All forms of dance produce various hormones associated with feelings of happiness.</li>
              <li>Dancing with others has a more positive impact than dancing alone.</li>
              <li>An experiment on university students suggested that dance increases <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>For those with mental illness, dance could be used as a form of <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
            </ul>
            <p><strong>Benefits of dance for older people:</strong></p>
            <ul className="list-disc pl-5">
              <li>accessible for people with low levels of <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
              <li>reduces the risk of heart disease</li>
              <li>better <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> reduces the risk of accidents</li>
              <li>improves <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> function by making it work faster</li>
              <li>improves participants' general well-being</li>
              <li>gives people more <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> to take exercise</li>
              <li>can lessen the feeling of <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />, very common in older people</li>
            </ul>
            <p><strong>Benefits of Zumba:</strong></p>
            <ul className="list-disc pl-5">
              <li>A study at The University of Wisconsin showed that doing Zumba for 40 minutes uses up as many <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> as other quite intense forms of exercise.</li>
              <li>The American Journal of Health Behavior study showed that:</li>
              <li>- women suffering from <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> benefited from doing Zumba.</li>
              <li>- Zumba became a <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> for the participants.</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-16" module="listening" testNumber={2} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 16 - Test 2 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book16.test2} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 16 - Listening Test 2" />
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

                     if (['19', '20'].includes(qNum)) {
                         userAnswer = (multipleAnswers['19_20'] || []).join(', ');
                         isCorrect = !!userAnswer && correctSet19_20.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet19_20.join('').length;
                         correctAns = correctSet19_20.join(', ');
                         if (qNum === '19') return null;
                         displayQNum = 'Q19-20';
                     } else {
                        userAnswer = answers[qNum] || '';
                        isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum);
                     }
                    
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                           <span className="font-medium">{displayQNum}</span> {renderAnswerStatusIcon(isCorrect)}
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
      <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="listening" testNumber={2} /><UserTestHistory book="book-16" module="listening" testNumber={2} /></div>
    </div>
  );
}