// FILE: cambridge-15/listening/test-2/page.tsx

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
  '1': 'Eustatis', '2': 'review', '3': 'dance', '4': 'Chat', '5': 'healthy', '6': 'posters', '7': 'wood', '8': 'lake', '9': 'insects', '10': 'blog',
  // Section 2: Questions 11-20
  '11': 'C', '12': 'A', '13': 'B', '14': 'C', '15': 'E', '16': 'C', '17': 'B', '18': 'A', '19': 'G', '20': 'D',
  // Section 3: Questions 21-30
  '25': 'G', '26': 'B', '27': 'D', '28': 'C', '29': 'H', '30': 'F',
  // Section 4: Questions 31-40
  '31': 'irrigation', '32': 'women', '33': 'wire(s)', '34': 'seed(s)', '35': 'posts', '36': 'transport', '37': 'preservation', '38': 'fish(es)', '39': 'bees', '40': 'design',
};
const correctSet21_22 = ['B', 'D'];
const correctSet23_24 = ['B', 'C'];

export default function Test2Page() {
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
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);

  const handleInputChange = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toLowerCase() }));
  const handleMultipleChoice = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toUpperCase() }));

  const handleMultiSelect = (key: '21_22' | '23_24', value: string) => {
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
    (multipleAnswers['21_22'] || []).forEach(c => { if (correctSet21_22.includes(c)) correctCount++; });
    (multipleAnswers['23_24'] || []).forEach(c => { if (correctSet23_24.includes(c)) correctCount++; });
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
        testNumber: 2,
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
 
  const renderMultiSelect = (key: '21_22' | '23_24', title: string, question: string, options: string[], correctSet: string[]) => (
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
        <p className="text-sm font-semibold mb-4">Questions 1-4: Complete the table below. Write ONE WORD ONLY for each answer.</p>
        <div className="border rounded-lg overflow-hidden mb-8">
            <table className="w-full text-sm">
                <caption className="p-2 font-bold bg-gray-100 text-lg">Festival information</caption>
                <thead className="bg-gray-50"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Type of event</th><th className="p-2 text-left">Details</th></tr></thead>
                <tbody>
                    <tr className="border-t"><td className="p-2">17th</td><td className="p-2">a concert</td><td className="p-2">performers from Canada</td></tr>
                    <tr className="border-t"><td className="p-2">18th</td><td className="p-2">a ballet</td><td className="p-2">company called <strong>1</strong> <Input className="inline w-32" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} /></td></tr>
                    <tr className="border-t"><td className="p-2">19th-20th (afternoon)</td><td className="p-2">a play</td><td className="p-2">type of play: a comedy called Jemima<br/>has had a good <strong>2</strong> <Input className="inline w-32" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} /></td></tr>
                    <tr className="border-t"><td className="p-2">20th (evening)</td><td className="p-2">a <strong>3</strong> <Input className="inline w-32" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} /> show</td><td className="p-2">show is called <strong>4</strong> <Input className="inline w-32" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /></td></tr>
                </tbody>
            </table>
        </div>
        <p className="text-sm font-semibold mb-4">Questions 5-10: Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h4 className="font-bold">Workshops</h4>
            <ul className="list-disc pl-5">
                <li>Making <strong>5</strong> <Input className="inline w-32" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /> food</li>
                <li>(children only) Making <strong>6</strong> <Input className="inline w-32" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /></li>
                <li>(adults only) Making toys from <strong>7</strong> <Input className="inline w-32" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} /> using various tools</li>
            </ul>
            <h4 className="font-bold">Outdoor activities</h4>
            <ul className="list-disc pl-5">
                <li>Swimming in the <strong>8</strong> <Input className="inline w-32" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} /></li>
                <li>Walking in the woods, led by an expert on <strong>9</strong> <Input className="inline w-32" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            </ul>
            <p>See the festival organiser's <strong>10</strong> <Input className="inline w-32" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /> for more information</p>
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
          <h3 className="font-bold text-lg mb-2">Minster Park</h3>
        
          {renderMultipleChoiceSingle('11', 'The park was originally established', ['as an amenity provided by the city council.', 'as land belonging to a private house.', 'as a shared area set up by the local community.'])}
          {renderMultipleChoiceSingle('12', 'Why is there a statue of Diane Gosforth in the park?', ['She was a resident who helped to lead a campaign.', 'She was a council member responsible for giving the public access.', 'She was a senior worker at the park for many years.'])}
          {renderMultipleChoiceSingle('13', 'During the First World War, the park was mainly used for', ['exercises by troops.', 'growing vegetables.', 'public meetings.'])}
          {renderMultipleChoiceSingle('14', 'When did the physical transformation of the park begin?', ['2013', '2015', '2016'])}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
         
          <p className="text-sm font-semibold mb-4">Label the map below. Write the correct letter, A-I, next to Questions 15-20.</p>
          <div className="border p-4 rounded-lg">
            <h3 className="text-center font-bold mb-4">Minster Park</h3>
          <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book15/listening/test2/map.png" alt="Minster Park" className="w-full h-auto mb-4 rounded-lg" />
            
            <p className="text-sm text-center mb-4">(Image of map is not available. Please answer based on the audio description.)</p>
            <div className="grid grid-cols-2 gap-2">
                {['statue of Diane Gosforth', 'wooden sculptures', 'playground', 'maze', 'tennis courts', 'fitness area'].map((item, index) => {
                    const qNum = String(15 + index);
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
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          {renderMultiSelect('21_22', 'Questions 21 and 22', 'Which TWO groups of people is the display primarily intended for?', 
          ['students from the English department', 'residents of the local area', 'the university\'s teaching staff', 'potential new students', 'students from other departments'], correctSet21_22)}
        </div>
        <div>
          {renderMultiSelect('23_24', 'Questions 23 and 24', 'What are Cathy and Graham\'s TWO reasons for choosing the novelist Charles Dickens?',
          ['His speeches inspired others to try to improve society.', 'He used his publications to draw attention to social problems.', 'His novels are well-known now.', 'He was consulted on a number of social issues.', 'His reputation has changed in recent times.'], correctSet23_24)}
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm mb-2">What topic do Cathy and Graham choose to illustrate with each novel?</p>
            <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 25-30.</p>
            {renderMatchingInput(25, 30, ['The Pickwick Papers', 'Oliver Twist', 'Nicholas Nickleby', 'Martin Chuzzlewit', 'Bleak House', 'Little Dorrit'], 'Topics', 
            ['A poverty', 'B education', 'C Dickens\'s travels', 'D entertainment', 'E crime and the law', 'F wealth', 'G medicine', 'H a woman\'s life'])}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Agricultural programme in Mozambique</h3>
          <h4 className="font-semibold">How the programme was organised</h4>
          <ul className="list-disc pl-5">
            <li>It focused on a dry and arid region in Chicualacuala district, near the Limpopo River.</li>
            <li>People depended on the forest to provide charcoal as a source of income.</li>
            <li><strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" /> was seen as the main priority to ensure the supply of water.</li>
            <li>Most of the work organised by farmers' associations was done by <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" />.</li>
            <li>Fenced areas were created to keep animals away from crops.</li>
            <li>The programme provided
              <ul className="list-circle pl-5">
                <li><strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" /> for the fences</li>
                <li><strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" /> for suitable crops</li>
                <li>water pumps.</li>
              </ul>
            </li>
            <li>The farmers provided
                <ul className="list-circle pl-5">
                    <li>labour</li>
                    <li><strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" /> for the fences on their land.</li>
                </ul>
            </li>
          </ul>
          <h4 className="font-semibold mt-4">Further developments</h4>
          <ul className="list-disc pl-5">
            <li>The marketing of produce was sometimes difficult due to lack of <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" />.</li>
            <li>Training was therefore provided in methods of food <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" />.</li>
            <li>Farmers made special places where <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" /> could be kept.</li>
            <li>Local people later suggested keeping <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" />.</li>
          </ul>
          <h4 className="font-semibold mt-4">Evaluation and lessons learned</h4>
          <ul className="list-disc pl-5">
            <li>Agricultural production increased, improving incomes and food security.</li>
            <li>Enough time must be allowed, particularly for the <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" /> phase of the programme.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-15" module="listening" testNumber={2} />
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">Cambridge IELTS 15 - Test 2 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book15.test2} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="C15 Listening Test 2" />
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
                {Array.from({length: 20}, (_, i) => i + 1).map(qNum => {
                  const qNumStr = String(qNum); const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  return (<div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between items-center"><span className="font-bold">Q{qNumStr}</span>{isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div><p>Your: {answers[qNumStr] || 'No Answer'}</p>{!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}</div>);
                })}
                <div className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q21-22</span><div className="text-sm">Multi-select</div></div><p>Your: {(multipleAnswers['21_22'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet21_22.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['21_22'] || []).filter(a => correctSet21_22.includes(a)).length}/2</p></div>
                <div className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q23-24</span><div className="text-sm">Multi-select</div></div><p>Your: {(multipleAnswers['23_24'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet23_24.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['23_24'] || []).filter(a => correctSet23_24.includes(a)).length}/2</p></div>
                {Array.from({length: 16}, (_, i) => i + 25).map(qNum => {
                   const qNumStr = String(qNum); const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  return (<div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between items-center"><span className="font-bold">Q{qNumStr}</span>{isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div><p>Your: {answers[qNumStr] || 'No Answer'}</p>{!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}</div>);
                })}
              </div>
              <div className="text-center mt-6"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
       <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="listening" testNumber={2} /><UserTestHistory book="book-15" module="listening" testNumber={2} /></div>
    </div>
  );
}