// FILE: cambridge-15/listening/test-3/page.tsx

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
  '1': 'furniture', '2': 'meetings', '3': 'diary', '4': 'detail(s)', '5': '1/one year', '6': 'deliveries', '7': 'tidy', '8': 'team', '9': 'heavy', '10': 'customer',
  // Section 2: Questions 11-16
  '11': 'B', '12': 'A', '13': 'C', '14': 'B', '15': 'C', '16': 'B',
  // Section 3: Questions 21-30
  '21': 'page', '22': 'size', '23': 'graphic(s)', '24': 'structure', '25': 'purpose', '26': 'assumption(s)', '27': 'A', '28': 'C', '29': 'C', '30': 'B',
  // Section 4: Questions 31-40
  '31': 'mud', '32': 'clay', '33': 'metal', '34': 'hair', '35': 'bath(s)', '36': 'disease(s)', '37': 'perfume', '38': 'salt', '39': 'science', '40': 'tax',
};
const correctSet17_18 = ['B', 'D'];
const correctSet19_20 = ['A', 'E'];

export default function Test3Page() {
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
        testNumber: 3,
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
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">Employment Agency: Possible Jobs</h3>
            <h4 className="font-semibold">First Job</h4>
            <p>Administrative assistant in a company that produces <strong>1</strong> <Input className="inline w-32" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} /> (North London)</p>
            <p className="font-semibold">Responsibilities</p>
            <ul className="list-disc pl-5">
                <li>data entry</li>
                <li>go to <strong>2</strong> <Input className="inline w-32" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} /> and take notes</li>
                <li>general admin</li>
                <li>management of <strong>3</strong> <Input className="inline w-32" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            </ul>
            <p className="font-semibold">Requirements</p>
            <ul className="list-disc pl-5">
                <li>good computer skills including spreadsheets</li>
                <li>good interpersonal skills</li>
                <li>attention to <strong>4</strong> <Input className="inline w-32" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            </ul>
             <p className="font-semibold">Experience</p>
            <ul className="list-disc pl-5"><li>need a minimum of <strong>5</strong> <Input className="inline w-32" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /> of experience of teleconferencing</li></ul>
            <hr className="my-4"/>
             <h4 className="font-semibold">Second Job</h4>
             <p>Warehouse assistant in South London</p>
             <p className="font-semibold">Responsibilities</p>
            <ul className="list-disc pl-5">
                <li>stock management</li>
                <li>managing <strong>6</strong> <Input className="inline w-32" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            </ul>
            <p className="font-semibold">Requirements</p>
            <ul className="list-disc pl-5">
                <li>ability to work with numbers</li>
                <li>good computer skills</li>
                <li>very organised and <strong>7</strong> <Input className="inline w-32" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} /></li>
                <li>good communication skills</li>
                <li>used to working in a <strong>8</strong> <Input className="inline w-32" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} /></li>
                <li>able to cope with items that are <strong>9</strong> <Input className="inline w-32" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            </ul>
             <p className="font-semibold">Need experience of</p>
            <ul className="list-disc pl-5">
                <li>driving in London</li>
                <li>warehouse work</li>
                <li><strong>10</strong> <Input className="inline w-32" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /> service</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 11-16</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold text-lg mb-2">Street Play Scheme</h3>
          {renderMultipleChoiceSingle('11', 'When did the Street Play Scheme first take place?', ['two years ago', 'three years ago', 'six years ago'])}
          {renderMultipleChoiceSingle('12', 'How often is Beechwood Road closed to traffic now?', ['once a week', 'on Saturdays and Sundays', 'once a month'])}
          {renderMultipleChoiceSingle('13', 'Who is responsible for closing the road?', ['a council official', 'the police', 'local wardens'])}
          {renderMultipleChoiceSingle('14', 'Residents who want to use their cars', ['have to park in another street.', 'must drive very slowly.', 'need permission from a warden.'])}
          {renderMultipleChoiceSingle('15', 'Alice says that Street Play Schemes are most needed in', ['wealthy areas.', 'quiet suburban areas.', 'areas with heavy traffic.'])}
          {renderMultipleChoiceSingle('16', 'What has been the reaction of residents who are not parents?', ['Many of them were unhappy at first.', 'They like seeing children play in the street.', 'They are surprised by the lack of noise.'])}
        </div>
        <div>
          {renderMultiSelect('17_18', 'Questions 17 and 18', 'Which TWO benefits for children does Alice think are the most important?', 
          ['increased physical activity', 'increased sense of independence', 'opportunity to learn new games', 'opportunity to be part of a community', 'opportunity to make new friends'], correctSet17_18)}
        </div>
        <div>
          {renderMultiSelect('19_20', 'Questions 19 and 20', 'Which TWO results of the King Street experiment surprised Alice?',
          ['more shoppers', 'improved safety', 'less air pollution', 'more relaxed atmosphere', 'less noise pollution'], correctSet19_20)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-26</h4>
            <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
              <h3 className="font-bold text-center text-lg mb-4">What Hazel should analyse about items in newspapers:</h3>
              <ul className="list-disc pl-5">
                <li>what <strong>21</strong> <Input value={answers['21'] || ''} onChange={e => handleInputChange('21', e.target.value)} className="inline w-32" /> the item is on</li>
                <li>the <strong>22</strong> <Input value={answers['22'] || ''} onChange={e => handleInputChange('22', e.target.value)} className="inline w-32" /> of the item, including the headline</li>
                <li>any <strong>23</strong> <Input value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} className="inline w-32" /> accompanying the item</li>
                <li>the <strong>24</strong> <Input value={answers['24'] || ''} onChange={e => handleInputChange('24', e.target.value)} className="inline w-32" /> of the item, e.g. what's made prominent</li>
                <li>the writer's main <strong>25</strong> <Input value={answers['25'] || ''} onChange={e => handleInputChange('25', e.target.value)} className="inline w-32" /></li>
                <li>the <strong>26</strong> <Input value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} className="inline w-32" /> the writer may make about the reader</li>
              </ul>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 27-30</h4>
            <p className="text-sm mb-2">What does Hazel decide to do about each of the following types of articles?</p>
            <p className="text-sm font-semibold mb-4">Write the correct letter, A, B or C, next to Questions 27-30.</p>
            {renderMatchingInput(27, 30, ['national news item', 'editorial', 'human interest', 'arts'], 'Types of articles', 
            ['A She will definitely look for a suitable article.', 'B She may look for a suitable article.', 'C She will definitely not look for an article.'])}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Early history of keeping clean</h3>
          <p><strong>Prehistoric times:</strong></p>
          <ul className="list-disc pl-5"><li>water was used to wash off <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" /></li></ul>
          <p><strong>Ancient Babylon:</strong></p>
          <ul className="list-disc pl-5"><li>soap-like material found in <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" /> cylinders</li></ul>
          <p><strong>Ancient Greece:</strong></p>
          <ul className="list-disc pl-5"><li>people cleaned themselves with sand and other substances</li><li>used a strigil - scraper made of <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" /></li><li>washed clothes in streams</li></ul>
          <p><strong>Ancient Germany and Gaul:</strong></p>
          <ul className="list-disc pl-5"><li>used soap to colour their <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" /></li></ul>
          <p><strong>Ancient Rome:</strong></p>
          <ul className="list-disc pl-5"><li>animal fat, ashes and clay mixed through action of rain, used for washing clothes</li><li>from about 312 BC, water carried to Roman <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" /> by aqueducts</li></ul>
          <p><strong>Europe in Middle Ages:</strong></p>
          <ul className="list-disc pl-5"><li>decline in bathing contributed to occurrence of <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" /></li><li><strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" /> began to be added to soap</li></ul>
          <p><strong>Europe from 17th century:</strong></p>
          <ul className="list-disc pl-5"><li>1600s: cleanliness and bathing started becoming usual</li><li>1791: Leblanc invented a way of making soda ash from <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" /></li><li>early 1800s: Chevreul turned soapmaking into a <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" /></li><li>from 1800s, there was no longer a <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" /> on soap</li></ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-15" module="listening" testNumber={3} />
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">Cambridge IELTS 15 - Test 3 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book15.test3} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="C15 Listening Test 3" />
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
       <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="listening" testNumber={3} /><UserTestHistory book="book-15" module="listening" testNumber={3} /></div>
    </div>
  );
}