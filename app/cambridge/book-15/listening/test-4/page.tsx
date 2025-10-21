// FILE: cambridge-15/listening/test-4/page.tsx

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

const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'journalist', '2': 'shopping', '3': 'Staunfirth', '4': 'return', '5': '23.70', '6': 'online', '7': 'delay', '8': 'information', '9': 'platform(s)', '10': 'parking',
  // Section 2: Questions 11-16
  '11': 'D', '12': 'C', '13': 'G', '14': 'H', '15': 'A', '16': 'E',
  // Section 3: Questions 21-30
  '21': 'B', '22': 'A', '23': 'B', '24': 'A', '25': 'A', '26': 'A', '27': 'B', '28': 'B', '29': 'A', '30': 'C',
  // Section 4: Questions 31-40
  '31': 'wealth', '32': 'technology', '33': 'power', '34': 'textile(s)', '35': 'machines', '36': 'newspapers', '37': 'local', '38': 'lighting', '39': 'windows', '40': 'advertising',
};
const correctSet17_18 = ['A', 'D'];
const correctSet19_20 = ['A', 'C'];

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '17_18': [], '19_20': [],
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

  const handleInputChange = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toLowerCase() }));
  const handleMultipleChoice = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toUpperCase() }));

  const handleMultiSelect = (key: '17_18' | '19_20', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    Object.keys(correctAnswers).forEach(qNum => {
        if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) correctCount++;
    });
    (multipleAnswers['17_18'] || []).forEach(c => { if (correctSet17_18.includes(c)) correctCount++; });
    (multipleAnswers['19_20'] || []).forEach(c => { if (correctSet19_20.includes(c)) correctCount++; });
    return correctCount;
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    try {
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-15',
        module: 'listening',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', result.error);
      }
    } catch (error) { console.error('Error submitting test:', error); }
    setSubmitted(true); setShowResultsPopup(true); setIsSubmitting(false);
  };
 
  const renderMultiSelect = (key: '17_18' | '19_20', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
            const opt = String.fromCharCode(65 + index);
            return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={(multipleAnswers[key] || []).includes(opt)} onChange={() => handleMultiSelect(key, opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
        </div>
        {submitted && <div className="mt-2 text-sm">Correct: {correctSet.join(', ')}</div>}
    </div>
  );
  
  const renderMultipleChoiceSingle = (qNum: string, question: string, options: string[]) => (
    <div className="mb-4">
        <p className="mb-2"><strong>{qNum}</strong> {question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
                const optLetter = String.fromCharCode(65 + index);
                return (
                    <label key={optLetter} className={`flex items-center space-x-2 p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) && answers[qNum] === optLetter ? 'bg-green-50' : (answers[qNum] === optLetter ? 'bg-red-50' : '')) : ''}`}>
                        <input type="radio" name={`q${qNum}`} value={optLetter} onChange={(e) => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} checked={answers[qNum] === optLetter} />
                        <span><strong>{optLetter}</strong> {option}</span>
                    </label>
                );
            })}
        </div>
    </div>
  );
  
  const renderMatchingInput = (startQ: number, endQ: number, items: string[], boxTitle: string, boxOptions: string[]) => (
     <div>
        <div className="border rounded-lg p-4 mb-4 text-sm">
            <p className="font-semibold">{boxTitle}</p>
            {boxOptions.map(opt => <p key={opt}>{opt}</p>)}
        </div>
        <div className="space-y-2">
            {items.map((item, index) => {
              const qNum = String(startQ + index);
              return (
                  <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                      <span className="flex-1"><strong>{qNum}</strong> {item}</span>
                      <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" />
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
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-center text-lg mb-4">Customer Satisfaction Survey</h3>
            <p><strong>Customer details</strong></p>
            <p>Name: Sophie Bird</p>
            <p>Occupation: <strong>1</strong> <Input className="inline w-32" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p>Reason for travel today: <strong>2</strong> <Input className="inline w-32" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p><strong>Journey information</strong></p>
            <p>Name of station returning to: <strong>3</strong> <Input className="inline w-32" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p>Type of ticket purchased: standard <strong>4</strong> <Input className="inline w-32" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /> ticket</p>
            <p>Cost of ticket: £<strong>5</strong> <Input className="inline w-20" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p>When ticket was purchased: yesterday</p>
            <p>Where ticket was bought: <strong>6</strong> <Input className="inline w-32" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p><strong>Satisfaction with journey</strong></p>
            <p>Most satisfied with: the <strong>7</strong> <Input className="inline w-32" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p>Least satisfied with: the <strong>8</strong> <Input className="inline w-32" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} /> this morning</p>
            <p><strong>Satisfaction with station facilities</strong></p>
            <p>Most satisfied with: how much <strong>9</strong> <Input className="inline w-32" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} /> was provided</p>
            <p>Least satisfied with: lack of seats, particularly on the <strong>10</strong> <Input className="inline w-32" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p>Neither satisfied nor dissatisfied with: the <strong>10</strong> <Input className="inline w-32" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /> available</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 11-16</h4>
          <p className="text-sm font-semibold mb-4">Label the map below. Write the correct letter, A-H, next to Questions 11-16.</p>
          <div className="border p-4 rounded-lg">
            <h3 className="text-center font-bold mb-4">Croft Valley Park</h3>
            <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book15/listening/test4/map.png" alt="Croft Valley Park Map" className="w-full mb-4" />
            <div className="grid grid-cols-2 gap-2">
                {['café', 'toilets', 'formal gardens', 'outdoor gym', 'skateboard ramp', 'wild flowers'].map((item, index) => {
                    const qNum = String(11 + index);
                    return (
                        <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                            <span className="flex-1"><strong>{qNum}</strong> {item}</span>
                            <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" maxLength={1} />
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
        <div>
          {renderMultiSelect('17_18', 'Questions 17 and 18', 'Choose TWO letters, A-E. What does the speaker say about the adventure playground?', 
          ['Children must be supervised.', 'It costs more in winter.', 'Some activities are only for younger children.', 'No payment is required.', 'It was recently expanded.'], correctSet17_18)}
        </div>
        <div>
          {renderMultiSelect('19_20', 'Questions 19 and 20', 'Choose TWO letters, A-E. What does the speaker say about the glass houses?',
          ['They are closed at weekends.', 'Volunteers are needed to work there.', 'They were badly damaged by fire.', 'More money is needed to repair some of the glass.', 'Visitors can see palm trees from tropical regions.'], correctSet19_20)}
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
            <h3 className="font-bold text-lg mb-2">Presentation about refrigeration</h3>
            {renderMultipleChoiceSingle('21', 'What did Annie discover from reading about icehouses?', ['why they were first created', 'how the ice was kept frozen', 'where they were located'])}
            {renderMultipleChoiceSingle('22', 'What point does Annie make about refrigeration in ancient Rome?', ['It became a commercial business.', 'It used snow from nearby.', 'It took a long time to become popular.'])}
            {renderMultipleChoiceSingle('23', 'In connection with modern refrigerators, both Annie and Jack are worried about', ['the complexity of the technology.', 'the fact that some are disposed of irresponsibly.', 'the large number that quickly break down.'])}
            {renderMultipleChoiceSingle('24', 'What do Jack and Annie agree regarding domestic fridges?', ['They are generally good value for money.', 'There are plenty of useful variations.', 'They are more useful than other domestic appliances.'])}
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm font-semibold mb-4">Who is going to do research into each topic? Write the correct letter, A, B or C, next to Questions 25-30.</p>
            {renderMatchingInput(25, 30, ['the goods that are refrigerated', 'the effects on health', 'the impact on food producers', 'the impact on cities', 'refrigerated transport', 'domestic fridges'], 'People', 
            ['A Annie', 'B Jack', 'C both Annie and Jack'])}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">How the Industrial Revolution affected life in Britain</h3>
          <p><strong>19th century</strong></p>
          <ul className="list-disc pl-5">
            <li>For the first time, people's possessions were used to measure Britain's <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" />.</li>
            <li>Developments in production of goods and in <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" /> greatly changed lives.</li>
          </ul>
          <p><strong>MAIN AREAS OF CHANGE</strong></p>
          <p><strong>Manufacturing</strong></p>
          <ul className="list-disc pl-5">
            <li>The Industrial Revolution would not have happened without the new types of <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" /> that were used then.</li>
            <li>The leading industry was <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" /> (its products became widely available).</li>
            <li>New <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" /> made factories necessary and so more people moved into towns.</li>
          </ul>
          <p><strong>Transport</strong></p>
          <ul className="list-disc pl-5">
            <li>The railways took the place of canals.</li>
            <li>Because of the new transport:
              <ul className="list-circle pl-5">
                <li>greater access to <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" /> made people more aware of what they could buy in shops.</li>
                <li>when shopping, people were not limited to buying <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" /> goods.</li>
              </ul>
            </li>
          </ul>
          <p><strong>Retailing</strong></p>
          <ul className="list-disc pl-5">
            <li>The first department stores were opened.</li>
            <li>The displays of goods were more visible
              <ul className="list-circle pl-5">
                <li>inside stores because of better <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" />.</li>
                <li>outside stores, because <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" /> were bigger.</li>
              </ul>
            </li>
            <li><strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" /> that was persuasive became more common.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-15" module="listening" testNumber={4} />
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">Cambridge IELTS 15 - Test 4 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book15.test4} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="C15 Listening Test 4" />
        <div className="my-4"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? 'default' : 'outline'} onClick={() => setCurrentSection(s)} disabled={!isTestStarted || submitted}>Section {s}</Button>)}</div></div>
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        <div className="text-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || submitted} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6"><h2 className="text-2xl font-bold">Test Results</h2><div className="flex justify-center items-center space-x-8 mt-2"><div><p className="text-3xl font-bold text-blue-600">{score}/40</p><p>Raw Score</p></div><div><p className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</p><p>IELTS Band</p></div></div></div>
              <h3 className="text-lg font-semibold mb-4 text-center">Answer Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 16}, (_, i) => i + 1).map(qNum => {
                  const qNumStr = String(qNum); const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  return (<div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between items-center"><span className="font-bold">Q{qNumStr}</span>{isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div><p>Your: {answers[qNumStr] || 'No Answer'}</p>{!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}</div>);
                })}
                <div className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q17-18</span><div className="text-sm">Multi-select</div></div><p>Your: {(multipleAnswers['17_18'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet17_18.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['17_18'] || []).filter(a => correctSet17_18.includes(a)).length}/2</p></div>
                <div className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q19-20</span><div className="text-sm">Multi-select</div></div><p>Your: {(multipleAnswers['19_20'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet19_20.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['19_20'] || []).filter(a => correctSet19_20.includes(a)).length}/2</p></div>
                {Array.from({length: 20}, (_, i) => i + 21).map(qNum => {
                   const qNumStr = String(qNum); const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  return (<div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between items-center"><span className="font-bold">Q{qNumStr}</span>{isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div><p>Your: {answers[qNumStr] || 'No Answer'}</p>{!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}</div>);
                })}
              </div>
              <div className="text-center mt-6"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
       <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="listening" testNumber={4} /><UserTestHistory book="book-15" module="listening" testNumber={4} /></div>
    </div>
  );
}