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

const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'Tesla', '2': 'microphone', '3': 'exhibition', '4': 'wifi', '5': '45', '6': '135', '7': 'pool', '8': 'airport', '9': 'sea', '10': 'clubs',
  // Section 2: Questions 11-20
  '11': 'A', '12': 'E', '13': 'B', '14': 'E', '15': 'F', '16': 'A', '17': 'E', '18': 'G', '19': 'D', '20': 'C',
  // Section 3: Questions 21-30
  '21': '50', '22': 'regional', '23': 'carnival', '24': 'drummer', '25': 'film', '26': 'parade', '27': 'D', '28': 'B', '29': 'E', '30': 'F',
  // Section 4: Questions 31-40
  '31': 'violin', '32': 'energy', '33': 'complex', '34': 'opera', '35': 'disturbing', '36': 'clarinet', '37': 'diversity', '38': 'physics', '39': 'dance', '40': 'Olympics',
};
const correctSet11_12 = ['C', 'E'];
const correctSet13_14 = ['B', 'E'];

export default function Test3Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '11_12': [], '13_14': [],
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

  const handleInputChange = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toLowerCase() }));
  const handleMultipleChoice = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toUpperCase() }));

  const handleMultiSelect = (key: '11_12' | '13_14', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Handle single-answer questions (skip 11-14 which are multi-select)
    Object.keys(correctAnswers).forEach(qNum => {
        if (!['11', '12', '13', '14'].includes(qNum)) {
            if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) correctCount++;
        }
    });

    // Handle multi-select questions 11-12
    const userChoices11_12 = multipleAnswers['11_12'] || [];
    userChoices11_12.forEach(choice => {
        if (correctSet11_12.includes(choice)) {
            correctCount++;
        }
    });

    // Handle multi-select questions 13-14
    const userChoices13_14 = multipleAnswers['13_14'] || [];
    userChoices13_14.forEach(choice => {
        if (correctSet13_14.includes(choice)) {
            correctCount++;
        }
    });

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
        book: 'book-14',
        module: 'listening',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
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
 
  const renderMultiSelect = (key: '11_12' | '13_14', title: string, question: string, options: string[], correctSet: string[]) => (
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
          <h3 className="font-bold text-center text-lg mb-4">Flanders Conference Hotel</h3>
          <p>Example: Customer Services Manager: <span className="underline">Angela</span></p>
          <p><strong>Date available:</strong> weekend beginning February 4th</p>
          <p><strong>Conference facilities</strong></p>
          <ul className="list-disc pl-5">
            <li>the <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> room for talks</li>
            <li>area for coffee and an <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> available</li>
            <li>free <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> throughout</li>
            <li>a standard buffet lunch costs $ <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-20" /> per head</li>
          </ul>
          <p><strong>Accommodation</strong></p>
          <ul className="list-disc pl-5"><li>Rooms will cost $ <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-20" /> including breakfast.</li></ul>
          <p><strong>Other facilities</strong></p>
          <ul className="list-disc pl-5">
            <li>The hotel also has a spa and rooftop <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            <li>There's a free shuttle service to the <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
          </ul>
          <p><strong>Location</strong></p>
          <ul className="list-disc pl-5">
            <li>Wilby Street (quite near the <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />)</li>
            <li>near to restaurants and many <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        {renderMultiSelect('11_12', 'Questions 11 and 12', 'Which TWO activities that volunteers do are mentioned?', 
            ['decorating', 'cleaning', 'delivering meals', 'shopping', 'childcare'], correctSet11_12)}
        {renderMultiSelect('13_14', 'Questions 13 and 14', 'Which TWO ways that volunteers can benefit from volunteering are mentioned?',
            ['learning how to be part of a team', 'having a sense of purpose', 'realising how lucky they are', 'improved ability at time management', 'boosting their employment prospects'], correctSet13_14)}
        <div>
            <h4 className="font-semibold mb-2">Questions 15-20</h4>
            <p className="text-sm mb-2">What has each of the following volunteers helped someone to do?</p>
            <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-G, next to Questions 15-20.</p>
            {renderMatchingInput(15, 20, ['Habib', 'Consuela', 'Minh', 'Tanya', 'Alexei', 'Juba'], 'What volunteers have helped people to do', 
            ['A overcome physical difficulties', 'B rediscover skills not used for a long time', 'C improve their communication skills', 'D solve problems independently', 'E escape isolation', 'F remember past times', 'G start a new hobby'])}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-26</h4>
            <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
              <h3 className="font-bold text-center text-lg mb-4">Background on school marching band</h3>
              <ul className="list-disc pl-5">
                <li>It consists of around <strong>21</strong> <Input value={answers['21'] || ''} onChange={e => handleInputChange('21', e.target.value)} className="inline w-20" /> students.</li>
                <li>It is due to play in a <strong>22</strong> <Input value={answers['22'] || ''} onChange={e => handleInputChange('22', e.target.value)} className="inline w-32" /> band competition.</li>
                <li>It has been invited to play in the town's <strong>23</strong> <Input value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} className="inline w-32" />.</li>
                <li>They have listened to a talk by a <strong>24</strong> <Input value={answers['24'] || ''} onChange={e => handleInputChange('24', e.target.value)} className="inline w-32" />.</li>
                <li>Joe will discuss a <strong>25</strong> <Input value={answers['25'] || ''} onChange={e => handleInputChange('25', e.target.value)} className="inline w-32" /> with the band.</li>
                <li>Joe hopes the band will attend a <strong>26</strong> <Input value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} className="inline w-32" /> next month.</li>
              </ul>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 27-30</h4>
            <p className="text-sm mb-2">What problem does Joe mention in connection with each of the following band members?</p>
            <p className="text-sm font-semibold mb-4">Choose FOUR answers from the box and write the correct letter, A-F, next to Questions 27-30.</p>
            {renderMatchingInput(27, 30, ['flautist', 'trumpeter', 'trombonist', 'percussionist'], 'Problems', 
            ['A makes a lot of mistakes in rehearsals', 'B keeps making unhelpful suggestions', 'C has difficulty with rhythm', 'D misses too many rehearsals', 'E has a health problem', 'F doesn\'t mix with other students'])}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 4 - Questions 31-40</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Concerts in university arts festival</h3>
          {/* Concert 1 */}
          <p className="font-semibold">Concert 1</p>
          <ul className="list-disc pl-5">
            <li>Australian composer: Liza Lim</li>
            <li>studied piano and <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" /> before turning to composition</li>
            <li>performers and festivals around the world have given her a lot of commissions</li>
            <li>compositions show a great deal of <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" /> and are drawn from various cultural sources</li>
            <li>her music is very expressive and also <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" /></li>
            <li>festival will include her <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" /> called <em>The Oresteia</em></li>
            <li>Lim described the sounds in <em>The Oresteia</em> as <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" /></li>
            <li>British composers: Ralph Vaughan Williams, Frederick Delius</li>
          </ul>
          {/* Concert 2 */}
          <p className="font-semibold mt-4">Concert 2</p>
          <ul className="list-disc pl-5">
            <li>British composers: Benjamin Britten, Judith Weir</li>
            <li>Australian composer: Ross Edwards</li>
            <li>festival will include <em>The Tower of Remoteness</em>, inspired by nature</li>
            <li><em>The Tower of Remoteness</em> is performed by piano and <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" /></li>
            <li>compositions include music for children</li>
            <li>celebrates Australia's cultural <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" /></li>
          </ul>
          {/* Concert 3 */}
          <p className="font-semibold mt-4">Concert 3</p>
          <ul className="list-disc pl-5">
            <li>Australian composer: Carl Vine</li>
            <li>played cornet then piano</li>
            <li>studied <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" /> before studying music</li>
            <li>worked in Sydney as a pianist and composer</li>
            <li>became well known as composer of music for <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" /></li>
            <li>festival will include his music for the 1996 <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" /></li>
            <li>British composers: Edward Elgar, Thomas Adès</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // Main Return Block
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">Cambridge IELTS 14 - Test 3 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book14.test3} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="C14 Listening Test 3" />
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
                {/* Questions 1-10 */}
                {Array.from({length: 10}, (_, i) => i + 1).map(qNum => {
                  const qNumStr = String(qNum);
                  const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  const userAnswer = answers[qNumStr] || '';
                  return (
                    <div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Q{qNumStr}</span>
                        {isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}
                      </div>
                      <p>Your: {userAnswer || 'No Answer'}</p>
                      {!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}
                    </div>
                  );
                })}
                
                {/* Questions 11-12 (Multi-select) */}
                <div className="p-3 rounded border bg-blue-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Q11-12</span>
                    <div className="text-sm">Multi-select</div>
                  </div>
                  <p>Your: {(multipleAnswers['11_12'] || []).join(', ') || 'No Answer'}</p>
                  <p>Correct: {correctSet11_12.join(', ')}</p>
                  <p className="text-xs">Score: {(multipleAnswers['11_12'] || []).filter(a => correctSet11_12.includes(a)).length}/2</p>
                </div>
                
                {/* Questions 13-14 (Multi-select) */}
                <div className="p-3 rounded border bg-blue-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Q13-14</span>
                    <div className="text-sm">Multi-select</div>
                  </div>
                  <p>Your: {(multipleAnswers['13_14'] || []).join(', ') || 'No Answer'}</p>
                  <p>Correct: {correctSet13_14.join(', ')}</p>
                  <p className="text-xs">Score: {(multipleAnswers['13_14'] || []).filter(a => correctSet13_14.includes(a)).length}/2</p>
                </div>
                
                {/* Questions 15-40 */}
                {Array.from({length: 26}, (_, i) => i + 15).map(qNum => {
                  const qNumStr = String(qNum);
                  const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  const userAnswer = answers[qNumStr] || '';
                  return (
                    <div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Q{qNumStr}</span>
                        {isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}
                      </div>
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
       <PageViewTracker 
         book="book-14" 
         module="listening" 
         testNumber={3} 
       />
       <div className="max-w-4xl mx-auto px-4 mt-8">
         <div className="grid gap-6 md:grid-cols-2">
           <TestStatistics book="book-14" module="listening" testNumber={3} />
           <UserTestHistory book="book-14" module="listening" testNumber={3} />
         </div>
       </div>
    </div>
  );
}