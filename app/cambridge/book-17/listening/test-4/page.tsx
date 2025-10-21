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
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';

const correctAnswers: { [key: string]: string } = {
  '1': 'floor/floors', '2': 'fridge', '3': 'shirts', '4': 'windows', '5': 'balcony', '6': 'electrician', '7': 'dust',
  '8': 'police', '9': 'training', '10': 'review', '11': 'A', '12': 'A', '13': 'A', '14': 'C', '15': 'A',
  '16': 'C', '17': 'B', '18': 'C', '19': 'B', '20': 'A', '21': 'C', '22': 'E', '23': 'A', '24': 'D',
  '25': 'B', '26': 'F', '27': 'A', '28': 'D', '29': 'C', '30': 'G', '31': 'golden', '32': 'healthy',
  '33': 'climate', '34': 'rock/rocks', '35': 'diameter', '36': 'tube', '37': 'fire', '38': 'steam',
  '39': 'cloudy', '40': 'litre/liter',
};

const correctSet21_22 = ['C', 'E'];
const correctSet23_24 = ['A', 'D'];

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21_22': [], '23_24': [],
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };
  
  const handleMultiSelect = (key: string, value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[key] || [];
        const newAnswers = currentAnswers.includes(value)
            ? currentAnswers.filter(ans => ans !== value)
            : [...currentAnswers, value].slice(0, 2).sort();
        return { ...prev, [key]: newAnswers };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (!['21', '22', '23', '24'].includes(qNum)) {
            if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
                correctCount++;
            }
        }
    }
    
    [
        { key: '21_22', correctSet: correctSet21_22 },
        { key: '23_24', correctSet: correctSet23_24 }
    ].forEach(({ key, correctSet }) => {
        const userChoices = multipleAnswers[key] || [];
        userChoices.forEach(choice => {
            if (correctSet.includes(choice)) {
                correctCount++;
            }
        });
    });

    return correctCount;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : undefined;
    const detailedAnswers = { singleAnswers: answers, multipleAnswers, score: calculatedScore, timeTaken };
    
    try {
      // Save test score using test-score-saver
      const testScoreData = {
        userId: session?.user?.id || null,
        book: 'book-17',
        module: 'listening',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken
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

  const renderMultiSelectStatus = (key: string, correctSet: string[]) => {
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
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Easy Life Cleaning Services</h3>
          <p><strong>Basic cleaning package offered</strong></p>
          <ul className="list-disc pl-5">
            <li>Cleaning all surfaces</li>
            <li>Cleaning the <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['1'], correctAnswers['1'], '1') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> throughout the apartment
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['1']}</span>}
            </li>
            <li>Cleaning shower, sinks, toilet etc.</li>
          </ul>
          <p><strong>Additional services agreed</strong></p>
          <ul className="list-disc pl-5">
            <li>Every week
                <ul className="list-disc pl-5">
                    <li>Cleaning the <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['2'], correctAnswers['2'], '2') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['2']}</span>}
                    </li>
                    <li>Ironing clothes - <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['3'], correctAnswers['3'], '3') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> only
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['3']}</span>}
                    </li>
                </ul>
            </li>
            <li>Every month
                <ul className="list-disc pl-5">
                    <li>Cleaning all the <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['4'], correctAnswers['4'], '4') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> from the inside
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['4']}</span>}
                    </li>
                    <li>Washing down the <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['5'], correctAnswers['5'], '5') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['5']}</span>}
                    </li>
                </ul>
            </li>
          </ul>
          <p><strong>Other possibilities</strong></p>
          <ul className="list-disc pl-5">
            <li>They can organise a plumber or an <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['6'], correctAnswers['6'], '6') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> if necessary.
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['6']}</span>}
            </li>
            <li>A special cleaning service is available for customers who are allergic to <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['7'], correctAnswers['7'], '7') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['7']}</span>}
            </li>
          </ul>
          <p><strong>Information on the cleaners</strong></p>
          <ul className="list-disc pl-5">
            <li>Before being hired, all cleaners have a background check carried out by the <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['8'], correctAnswers['8'], '8') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['8']}</span>}
            </li>
            <li>References are required.</li>
            <li>All cleaners are given <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['9'], correctAnswers['9'], '9') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> for two weeks.
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['9']}</span>}
            </li>
            <li>Customers send a <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['10'], correctAnswers['10'], '10') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> after each visit.
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['10']}</span>}
            </li>
            <li>Usually, each customer has one regular cleaner.</li>
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
            {renderMultipleChoiceQuestion('11', 'Many hotel managers are unaware that their staff often leave because of', ['a lack of training.', 'long hours.', 'low pay.'])}
            {renderMultipleChoiceQuestion('12', 'What is the impact of high staff turnover on managers?', ['an increased workload', 'low morale', 'an inability to meet targets'])}
            {renderMultipleChoiceQuestion('13', 'What mistake should managers always avoid?', ['failing to treat staff equally', 'reorganising shifts without warning', 'neglecting to have enough staff during busy periods'])}
            {renderMultipleChoiceQuestion('14', 'What unexpected benefit did Dunwich Hotel notice after improving staff retention rates?', ['a fall in customer complaints', 'an increase in loyalty club membership', 'a rise in spending per customer'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm mb-2">Which way of reducing staff turnover was used in each of the following hotels?</p>
          <p className="text-sm font-semibold mb-4">Write the correct letter, A, B or C, next to Questions 15-20.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Ways of reducing staff turnover</p>
            <p><strong>A</strong> improving relationships and teamwork</p>
            <p><strong>B</strong> offering incentives and financial benefits</p>
            <p><strong>C</strong> providing career opportunities</p>
          </div>
          <p className="font-semibold">Hotels</p>
          <div className="space-y-2 mt-2">
            {['The Sun Club', 'The Portland', 'Bluewater Hotels', 'Pentlow Hotels', 'Green Planet', 'The Amesbury'].map((part, index) => {
              const qNum = String(15 + index);
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                  {submitted && renderAnswerStatusIcon(isCorrect)}
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers[qNum]}</span>}
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
          <h4 className="font-semibold mb-2">Questions 21-22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO points do Thomas and Jeanne make about Thomas's sporting activities at school?</p>
          <div className="space-y-2">{['He should have felt more positive about them.', 'The training was too challenging for him.', 'He could have worked harder at them.', 'His parents were disappointed in him.', 'His fellow students admired him.'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['21_22'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('21_22', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('21_22', correctSet21_22)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 23 and 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO feelings did Thomas experience when he was in Kenya?</p>
          <div className="space-y-2">{['disbelief', 'relief', 'stress', 'gratitude', 'homesickness'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['23_24'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('23_24', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('23_24', correctSet23_24)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <p className="text-sm mb-2">What comment do the students make about the development of each of the following items of sporting equipment?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 25-30.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Comments about the development of the equipment</p>
            <p><strong>A</strong> It could cause excessive sweating.</p><p><strong>B</strong> The material was being mass produced for another purpose.</p><p><strong>C</strong> People often needed to make their own.</p>
            <p><strong>D</strong> It often had to be replaced.</p><p><strong>E</strong> The material was expensive.</p><p><strong>F</strong> It was unpopular among spectators.</p>
            <p><strong>G</strong> It caused injuries.</p><p><strong>H</strong> No one using it liked it at first.</p>
          </div>
          <p className="font-semibold">Items of sporting equipment</p>
          <div className="space-y-2 mt-2">
            {['the table tennis bat', 'the cricket helmet', 'the cycle helmet', 'the golf club', 'the hockey stick', 'the football'].map((part, index) => {
              const qNum = String(25 + index);
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                  {submitted && renderAnswerStatusIcon(isCorrect)}
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers[qNum]}</span>}
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
            <h3 className="font-bold text-center text-lg mb-4">Maple syrup</h3>
            <p><strong>What is maple syrup?</strong></p>
            <ul className="list-disc pl-5">
                <li>made from the sap of the maple tree</li>
                <li>added to food or used in cooking</li>
                <li>colour described as <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['31'], correctAnswers['31'], '31') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['31']}</span>}
                </li>
                <li>very <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['32'], correctAnswers['32'], '32') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> compared to refined sugar
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['32']}</span>}
                </li>
            </ul>
            <p><strong>The maple tree</strong></p>
            <ul className="list-disc pl-5">
                <li>has many species</li>
                <li>needs sunny days and cool nights</li>
                <li>maple leaf has been on the Canadian flag since 1964</li>
                <li>needs moist soil but does not need fertiliser as well</li>
                <li>best growing conditions and <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['33'], correctAnswers['33'], '33') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> are in Canada and North America
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['33']}</span>}
                </li>
            </ul>
            <p><strong>Early maple sugar producers</strong></p>
            <ul className="list-disc pl-5">
                <li>made holes in the tree trunks</li>
                <li>used hot <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['34'], correctAnswers['34'], '34') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> to heat the sap
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['34']}</span>}
                </li>
                <li>used tree bark to make containers for collection</li>
                <li>sweetened food and drink with sugar</li>
            </ul>
            <p><strong>Today's maple syrup</strong></p>
            <p><u>The trees</u></p>
            <ul className="list-disc pl-5">
                <li>Tree trunks may not have the correct <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['35'], correctAnswers['35'], '35') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> until they have been growing for 40 years.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['35']}</span>}
                </li>
                <li>The changing temperature and movement of water within the tree produces the sap.</li>
            </ul>
            <p><u>The production</u></p>
            <ul className="list-disc pl-5">
                <li>A tap is drilled into the trunk and a <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['36'], correctAnswers['36'], '36') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> carries the sap into a bucket.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['36']}</span>}
                </li>
                <li>Large pans of sap called evaporators are heated by means of a <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['37'], correctAnswers['37'], '37') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['37']}</span>}
                </li>
                <li>A lot of <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['38'], correctAnswers['38'], '38') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> is produced during the evaporation process.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['38']}</span>}
                </li>
                <li>'Sugar sand' is removed because it makes the syrup look <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['39'], correctAnswers['39'], '39') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> and affects the taste.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['39']}</span>}
                </li>
                <li>The syrup is ready for use.</li>
                <li>A huge quantity of sap is needed to make a <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['40'], correctAnswers['40'], '40') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> of maple syrup.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['40']}</span>}
                </li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-17" module="listening" testNumber={4} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
            <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 17 - Test 4 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book17.test4} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 17 - Listening Test 4" />
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

                    if (['21', '22'].includes(qNum)) {
                        userAnswer = (multipleAnswers['21_22'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet21_22.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet21_22.join('').length;
                        correctAns = correctSet21_22.join(', ');
                        if (qNum === '21') return null;
                        displayQNum = 'Q21-22';
                    } else if (['23', '24'].includes(qNum)) {
                        userAnswer = (multipleAnswers['23_24'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet23_24.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet23_24.join('').length;
                        correctAns = correctSet23_24.join(', ');
                        if (qNum === '23') return null;
                        displayQNum = 'Q23-24';
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
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics book="book-17" module="listening" testNumber={4} />
        <UserTestHistory book="book-17" module="listening" testNumber={4} />
      </div>
    </div>
  );
}