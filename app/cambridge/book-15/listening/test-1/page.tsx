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
  '1': 'Jamieson', '2': 'afternoon', '3': 'communication', '4': 'week', '5': '10/ten', '6': 'suit', '7': 'passport', '8': 'personality', '9': 'feedback', '10': 'time',
  // Section 2: Questions 11-20
  '11': 'A', '12': 'B', '13': 'A', '14': 'C', '15': 'river', '16': '1422', '17': 'top', '18': 'pass', '19': 'steam', '20': 'capital',
  // Section 3: Questions 21-30
  '21': 'G', '22': 'F', '23': 'A', '24': 'E', '25': 'B', '26': 'C', '27': 'C', '28': 'B',
  // Section 4: Questions 31-40
  '31': 'shelter', '32': 'oil', '33': 'roads', '34': 'insects', '35': 'grass(es)', '36': 'water', '37': 'soil', '38': 'dry', '39': 'simple', '40': 'nest(s)',
};
const correctSet29_30 = ['B', 'D'];

export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '29_30': [],
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

  const handleMultiSelect = (key: '29_30', value: string) => {
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
    const userChoices29_30 = multipleAnswers['29_30'] || [];
    userChoices29_30.forEach(choice => { if (correctSet29_30.includes(choice)) correctCount++; });
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
        testNumber: 1,
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
 
  const renderMultiSelect = (key: '29_30', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
            const opt = String.fromCharCode(65 + index);
            return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers[key].includes(opt)} onChange={() => handleMultiSelect(key, opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
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
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum);
              return (
                  <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
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
          <h3 className="font-bold text-center text-lg mb-4">Bankside Recruitment Agency</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Address of agency: 497 Eastside, Docklands</li>
            <li>Name of agent: Becky <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>Phone number: 07866 510333</li>
            <li>Best to call her in the <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
          </ul>
          <h4 className="font-semibold mt-4">Typical jobs</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Clerical and admin roles, mainly in the finance industry</li>
            <li>Must have good <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> skills</li>
            <li>Jobs are usually for at least one <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>Pay is usually £<strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-20" /> per hour</li>
          </ul>
          <h4 className="font-semibold mt-4">Registration process</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Wear a <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> to the interview</li>
            <li>Must bring your <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> to the interview</li>
            <li>They will ask questions about each applicant's <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
          </ul>
           <h4 className="font-semibold mt-4">Advantages of using an agency</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>The <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> you receive at interview will benefit you</li>
            <li>Will get access to vacancies which are not advertised</li>
            <li>Less <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> is involved in applying for jobs</li>
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
          <h3 className="font-bold text-lg mb-2">Matthews Island Holidays</h3>
          {renderMultipleChoiceSingle('11', 'According to the speaker, the company', ['has been in business for longer than most of its competitors.', 'arranges holidays to more destinations than its competitors.', 'has more customers than its competitors.'])}
          {renderMultipleChoiceSingle('12', 'Where can customers meet the tour manager before travelling to the Isle of Man?', ['Liverpool', 'Heysham', 'Luton'])}
          {renderMultipleChoiceSingle('13', 'How many lunches are included in the price of the holiday?', ['three', 'four', 'five'])}
          {renderMultipleChoiceSingle('14', 'Customers have to pay extra for', ['guaranteeing themselves a larger room.', 'booking at short notice.', 'transferring to another date.'])}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm font-semibold mb-4">Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <caption className="p-2 font-bold bg-gray-100">Timetable for Isle of Man holiday</caption>
                <thead className="bg-gray-50"><tr className="text-left"><th className="p-2">Activity</th><th className="p-2">Notes</th></tr></thead>
                <tbody>
                    <tr className="border-t"><td className="p-2">Day 1 Arrive</td><td className="p-2">Introduction by manager<br/>Hotel dining room has view of the <strong>15</strong> <Input className="inline w-32" value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || submitted} />.</td></tr>
                    <tr className="border-t"><td className="p-2">Day 2 Tynwald Exhibition and Peel</td><td className="p-2">Tynwald may have been founded in <strong>16</strong> <Input className="inline w-32" value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || submitted} /> not 979.</td></tr>
                    <tr className="border-t"><td className="p-2">Day 3 Trip to Snaefell</td><td className="p-2">Travel along promenade in a tram; train to Laxey; train to the <strong>17</strong> <Input className="inline w-32" value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || submitted} /> of Snaefell.</td></tr>
                    <tr className="border-t"><td className="p-2">Day 4 Free day</td><td className="p-2">Company provides a <strong>18</strong> <Input className="inline w-32" value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || submitted} /> for local transport and heritage sites.</td></tr>
                    <tr className="border-t"><td className="p-2">Day 5 Take the <strong>19</strong> <Input className="inline w-32" value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || submitted} /> railway train from Douglas to Port Erin</td><td className="p-2">Free time, then coach to Castletown - former <strong>20</strong> <Input className="inline w-32" value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || submitted} /> has old castle.</td></tr>
                    <tr className="border-t"><td className="p-2">Day 6 Leave</td><td className="p-2">Leave the island by ferry or plane</td></tr>
                </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-26</h4>
            <p className="text-sm mb-2">What did findings of previous research claim about the personality traits a child is likely to have because of their position in the family?</p>
            <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 21-26.</p>
            {renderMatchingInput(21, 26, ['the eldest child', 'a middle child', 'the youngest child', 'a twin', 'an only child', 'a child with much older siblings'], 'Personality Traits', 
            ['A outgoing', 'B selfish', 'C independent', 'D attention-seeking', 'E introverted', 'F co-operative', 'G caring', 'H competitive'])}
        </div>
         <div>
            <h4 className="font-semibold mb-2">Questions 27 and 28</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            {renderMultipleChoiceSingle('27', 'What do the speakers say about the evidence relating to birth order and academic success?', ['There is conflicting evidence about whether oldest children perform best in intelligence tests.', 'There is little doubt that birth order has less influence on academic achievement than socio-economic status.', 'Some studies have neglected to include important factors such as family size.'])}
            {renderMultipleChoiceSingle('28', 'What does Ruth think is surprising about the difference in oldest children\'s academic performance?', ['It is mainly thanks to their roles as teachers for their younger siblings.', 'The advantages they have only lead to a slightly higher level of achievement.', 'The extra parental attention they receive at a young age makes little difference.'])}
        </div>
        <div>
            {renderMultiSelect('29_30', 'Questions 29 and 30', 'Which TWO experiences of sibling rivalry do the speakers agree has been valuable for them?', 
            ['learning to share', 'learning to stand up for oneself', 'learning to be a good loser', 'learning to be tolerant', 'learning to say sorry'], correctSet29_30)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">The Eucalyptus Tree in Australia</h3>
          <h4 className="font-semibold">Importance</h4>
          <ul className="list-disc pl-5">
            <li>it provides <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" /> and food for a wide range of species</li>
            <li>its leaves provide <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" /> which is used to make a disinfectant</li>
          </ul>
          <h4 className="font-semibold mt-4">Reasons for present decline in number</h4>
          <h5 className="font-semibold pl-5">A) Diseases</h5>
          <ul className="list-disc pl-10">
            <li>(i) 'Mundulla Yellows'
              <ul className="list-circle pl-5">
                <li>Cause - lime used for making <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" /> was absorbed</li>
                <li>trees were unable to take in necessary iron through their roots</li>
              </ul>
            </li>
            <li>(ii) 'Bell-miner Associated Die-back'
              <ul className="list-circle pl-5">
                <li>Cause - <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" /> feed on eucalyptus leaves</li>
                <li>they secrete a substance containing sugar</li>
                <li>bell-miner birds are attracted by this and keep away other species</li>
              </ul>
            </li>
          </ul>
           <h5 className="font-semibold pl-5 mt-2">B) Bushfires</h5>
          <p className="pl-10">William Jackson's theory:</p>
          <ul className="list-disc pl-10">
            <li>high-frequency bushfires have impact on vegetation, resulting in the growth of <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" /></li>
            <li>mid-frequency bushfires result in the growth of eucalyptus forests, because they:
              <ul className="list-circle pl-5">
                <li>make more <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" /> available to the trees</li>
                <li>maintain the quality of the <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" /></li>
              </ul>
            </li>
            <li>low-frequency bushfires result in the growth of '<strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" /> rainforest', which is:
              <ul className="list-circle pl-5">
                <li>a <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" /> ecosystem</li>
                <li>an ideal environment for the <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" /> of the bell-miner</li>
              </ul>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // Main Return Block
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-15" module="listening" testNumber={1} />
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">Cambridge IELTS 15 - Test 1 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book15.test1} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="C15 Listening Test 1" />
        <div className="my-4"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? 'default' : 'outline'} onClick={() => setCurrentSection(s)} disabled={!isTestStarted || submitted}>Section {s}</Button>)}</div></div>
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        <div className="text-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || submitted} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Test Results</h2>
                <div className="flex justify-center items-center space-x-8 mt-2">
                  <div><p className="text-3xl font-bold text-blue-600">{score}/40</p><p>Raw Score</p></div>
                  <div><p className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</p><p>IELTS Band</p></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-4 text-center">Answer Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 40}, (_, i) => i + 1).map(qNum => {
                  const qNumStr = String(qNum);
                  if (qNum >= 29 && qNum <= 30) {
                     if (qNum === 29) { // Render one box for 29-30
                       return (
                         <div key="29_30" className="p-3 rounded border bg-blue-50">
                           <div className="flex justify-between items-center"><span className="font-bold">Q29-30</span><div className="text-sm">Multi-select</div></div>
                           <p>Your: {(multipleAnswers['29_30'] || []).join(', ') || 'No Answer'}</p>
                           <p>Correct: {correctSet29_30.join(', ')}</p>
                           <p className="text-xs">Score: {(multipleAnswers['29_30'] || []).filter(a => correctSet29_30.includes(a)).length}/2</p>
                         </div>
                       );
                     }
                     return null; // Don't render a box for 30
                  }
                  const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  const userAnswer = answers[qNumStr] || '';
                  return (
                    <div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex justify-between items-center"><span className="font-bold">Q{qNumStr}</span>{isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div>
                      <p>Your: {userAnswer || 'No Answer'}</p>
                      {!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-6"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
       <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="listening" testNumber={1} /><UserTestHistory book="book-15" module="listening" testNumber={1} /></div>
    </div>
  );
}