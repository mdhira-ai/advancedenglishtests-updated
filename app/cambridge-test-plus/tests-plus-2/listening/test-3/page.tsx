'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { AUDIO_URLS } from '@/constants/audio'; // Placeholder for audio URLs
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { TestStatistics } from "@/components/analytics/TestStatistics";
import { UserTestHistory } from "@/components/analytics/UserTestHistory";

const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': '230 South Road', '2': '18', '3': 'Activities and workshops', '4': '250', '5': 'interactive', '6': 'material(s)', '7': 'insurance', '8': 'publicity', '9': 'programme', '10': 'not available/unavailable',
  // Section 2: Questions 11-20
  '11': 'A', '12': 'C', '13': 'B', '14': 'A', '15': 'C', '16': 'B', '17': 'E', '18': 'G', '19': 'H', '20': 'C',
  // Section 3: Questions 21-30
  '21': 'investigate', '22': 'sunny and warm', '23': 'change', '24': 'F', '25': 'D', '26': 'C', '27': 'B',
  // Section 4: Questions 31-40
  '35': '12,000', '36': 'minority', '37': 'all', '38': 'teachers', '39': '(the) evaluation', '40': 'poor',
};

const correctSet28_30 = ['B', 'F', 'H'];
const correctSet31_32 = ['A', 'D'];
const correctSet33_34 = ['B', 'E'];

export default function Test3Page() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession();
  
  // Debug session
  console.log('Session status:', { session: session?.user?.id ? 'logged in' : 'not logged in', isSessionLoading })
  
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '28_30': [], '31_32': [], '33_34': [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);

  const handleInputChange = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toLowerCase() }));
  const handleMultipleChoice = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toUpperCase() }));

  const handleMultiSelect = (key: '28_30' | '31_32' | '33_34', value: string) => {
    const limit = key === '28_30' ? 3 : 2;
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) 
          ? current.filter(ans => ans !== value) 
          : (current.length < limit ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    Object.keys(correctAnswers).forEach(qNum => {
        if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) correctCount++;
    });
    const sets: { key: '28_30' | '31_32' | '33_34', correct: string[] }[] = [
      { key: '28_30', correct: correctSet28_30 },
      { key: '31_32', correct: correctSet31_32 },
      { key: '33_34', correct: correctSet33_34 },
    ];
    sets.forEach(({ key, correct }) => {
        const userChoices = multipleAnswers[key] || [];
        userChoices.forEach(choice => { if (correct.includes(choice)) correctCount++; });
    });
    return correctCount;
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      // Calculate time taken in seconds
      const endTime = new Date();
      const timeInSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      setTimeTaken(timeInSeconds);
      
      // Save test score using the simple save function
      const result = await saveTestScore({
        book: 'practice-tests-plus-2',
        module: 'listening',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length + correctSet28_30.length + correctSet31_32.length + correctSet33_34.length,
        percentage: Math.round((calculatedScore / (Object.keys(correctAnswers).length + correctSet28_30.length + correctSet31_32.length + correctSet33_34.length)) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeInSeconds
      }, session);
      
      if (result.success) {
        console.log('Test score saved successfully:', result.data);
      } else {
        console.error('Failed to save test score:', result.error);
      }
      
      setSubmitted(true);
      setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      // Still show results even if save failed
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestStart = () => {
    setIsTestStarted(true);
    setStartTime(new Date()); // Record start time
  };

  const handleReset = () => {
    setAnswers({});
    setMultipleAnswers({
      '28_30': [], '31_32': [], '33_34': [],
    });
    setSubmitted(false);
    setScore(0);
    setCurrentSection(1);
    setIsTestStarted(false);
    setShowResultsPopup(false);
    setIsSubmitting(false);
    setStartTime(null);
    setTimeTaken(0);
  };

  // Helper function to format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
 
  const renderMultiSelect = (key: '28_30' | '31_32' | '33_34', title: string, question: string, options: string[], correctSet: string[]) => (
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
                        <span>{option}</span>
                    </label>
                );
            })}
        </div>
    </div>
  );
  
  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the form below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2 border">
          <h3 className="font-bold text-center text-lg mb-4">Council Youth Scheme - Application for Funding for Group Project</h3>
          <p>Example: Name: Ralph Pearson</p>
          <p>Contact address: <strong>1</strong> <Input className="inline w-48" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} />, Drayton DR6 8AB</p>
          <p>Telephone number: 01453 586098</p>
          <p>Name of group: Community Youth Theatre Group</p>
          <p>Description of group: amateur theatre group (<strong>2</strong> <Input className="inline w-16" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} /> members) involved in drama <strong>3</strong> <Input className="inline w-48" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} /></p>
          <p>Amount of money requested: <strong>4</strong> £ <Input className="inline w-24" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /></p>
          <p>Description of project: to produce a short <strong>5</strong> <Input className="inline w-40" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /> play for young children</p>
          <p>Money needed for:</p>
          <ul className="list-disc pl-5">
            <li><strong>6</strong> <Input className="inline w-32" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /> for scenery</li>
            <li>costumes</li>
            <li>cost of <strong>7</strong> <Input className="inline w-32" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            <li><strong>8</strong> <Input className="inline w-32" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} /></li>
            <li>sundries</li>
          </ul>
          <p>How source of funding will be credited: acknowledged in the <strong>9</strong> <Input className="inline w-40" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} /> given to audience</p>
          <p>Other organisations approached for funding (and outcome): National Youth Services - money was <strong>10</strong> <Input className="inline w-40" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 11-15</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
        {renderMultipleChoiceSingle('11', 'Joanne says that visitors to Darwin are often surprised by', ['A the number of young people.', 'B the casual atmosphere.', 'C the range of cultures.'])}
        {renderMultipleChoiceSingle('12', 'To enjoy cultural activities, the people of Darwin tend to', ['A travel to southern Australia.', 'B bring in artists from other areas.', 'C involve themselves in production.'])}
        {renderMultipleChoiceSingle('13', 'The Chinese temple in Darwin', ['A is no longer used for its original purpose.', 'B was rebuilt after its destruction in a storm.', 'C was demolished to make room for new buildings.'])}
        {renderMultipleChoiceSingle('14', 'The main problem with travelling by bicycle is', ['A the climate.', 'B the traffic.', 'C the hills.'])}
        {renderMultipleChoiceSingle('15', 'What does Joanne say about swimming in the sea?', ['A It is essential to wear a protective suit.', 'B Swimming is only safe during the winter.', 'C You should stay in certain restricted areas.'])}
        <h4 className="font-semibold mb-2 mt-6">Questions 16-20</h4>
        <p className="text-sm mb-2">What can you find at each of the places below?</p>
        <p className="text-sm font-semibold mb-4">Choose your answers from the box and write the correct letter A-H next to Questions 16-20.</p>
        <div className="border p-4 rounded-lg mb-4 text-sm">
          <p>A a flower market</p><p>B a chance to feed the fish</p><p>C good nightlife</p><p>D international arts and crafts</p><p>E good cheap international food</p><p>F a trip to catch fish</p><p>G shops and seafood restaurants</p><p>H a wide range of different plants</p>
        </div>
        <div className="space-y-2">
            {['Aquascene', 'Smith Street Mall', 'Cullen Bay Marina', 'Fannie Bay', 'Mitchell Street'].map((item, index) => {
              const qNum = String(16 + index);
              return (<div key={qNum} className="flex items-center space-x-4"><span className="flex-1"><strong>{qNum}</strong> {item}</span><Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" /></div>);
            })}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 21-23</h4>
        <p className="text-sm font-semibold mb-4">Complete the sentences below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <h3 className="font-bold text-lg mb-2">Effects of weather on mood</h3>
        <p><strong>21</strong> Phil and Stella's goal is to <Input className="inline w-48" value={answers['21'] || ''} onChange={e => handleInputChange('21', e.target.value)} disabled={!isTestStarted || submitted} /> the hypothesis that weather has an effect on a person's mood.</p>
        <p><strong>22</strong> They expect to find that 'good' weather (weather which is <Input className="inline w-48" value={answers['22'] || ''} onChange={e => handleInputChange('22', e.target.value)} disabled={!isTestStarted || submitted} /> and <Input className="inline w-48" value={answers['22b'] || ''} disabled={true} />) has a positive effect on a person's mood.</p>
        <p><strong>23</strong> Stella defines 'effect on mood' as a <Input className="inline w-48" value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} disabled={!isTestStarted || submitted} /> in the way a person feels.</p>
        <h4 className="font-semibold mb-2 mt-6">Questions 24-27</h4>
        <p className="text-sm font-semibold mb-4">What information was given by each writer? Choose your answers from the box and write the letters A-F next to Questions 24-27.</p>
        <div className="border p-4 rounded-lg mb-4 text-sm">
            <p>A the benefits of moving to a warmer environment</p><p>B the type of weather with the worst effect on mood</p><p>C how past events affect attitudes to weather</p><p>D the important effect of stress on mood</p><p>E the important effect of hours of sunshine on mood</p><p>F psychological problems due to having to cope with bad weather</p>
        </div>
        <div className="space-y-2">
            {['Vickers', 'Whitebourne', 'Haverton', 'Stanfield'].map((item, index) => {
              const qNum = String(24 + index);
              return (<div key={qNum} className="flex items-center space-x-4"><span className="flex-1"><strong>{qNum}</strong> {item}</span><Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" /></div>);
            })}
        </div>
        {renderMultiSelect('28_30', 'Questions 28-30', 'Choose THREE letters A-H. Which THREE things do Phil and Stella still have to decide on?', 
            ['how to analyse their results', 'their methods of presentation', 'the design of their questionnaire', 'the location of their survey', 'weather variables to be measured', 'the dates of their survey', 'the size of their survey', 'the source of data on weather variables'], correctSet28_30)}
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        {renderMultiSelect('31_32', 'Questions 31-32', 'Choose TWO letters A-F. Which two of the following problems are causing concern to educational authorities in the USA?', 
            ['differences between rich and poor students', 'high numbers dropping out of education', 'falling standards of students', 'poor results compared with other nationalities', 'low scores of overseas students', 'differences between rural and urban students'], correctSet31_32)}
        {renderMultiSelect('33_34', 'Questions 33-34', 'Choose TWO letters A-F. According to the speaker, what are two advantages of reducing class sizes?', 
            ['more employment for teachers', 'improvement in general health of the population', 'reduction in number of days taken off sick by teachers', 'better use of existing buildings and resources', 'better level of education of workforce', 'availability of better qualified teachers'], correctSet33_34)}
        <h4 className="font-semibold mb-2 mt-6">Questions 35-40</h4>
        <p className="text-sm font-semibold mb-4">Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <caption className="p-2 font-bold bg-gray-100">USA RESEARCH PROJECTS INTO CLASS SIZES</caption>
                <thead className="bg-gray-50"><tr className="text-left"><th className="p-2">State</th><th className="p-2">Schools Involved</th><th className="p-2">Number of students participating</th><th className="p-2">Key findings</th><th className="p-2">Problems</th></tr></thead>
                <tbody>
                    <tr className="border-t"><td className="p-2">Tennessee</td><td className="p-2">about 70 schools</td><td className="p-2">in total <strong>35</strong> <Input className="inline w-32" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} /></td><td className="p-2">significant benefit especially for <strong>36</strong> <Input className="inline w-32" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} /> pupils</td><td className="p-2">• lack of agreement on implications of data</td></tr>
                    <tr className="border-t"><td className="p-2">California</td><td className="p-2"><strong>37</strong> <Input className="inline w-32" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} /> schools</td><td className="p-2">1.8 million</td><td className="p-2">very little benefit</td><td className="p-2">• shortage of <strong>38</strong> <Input className="inline w-32" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} />, especially in poorer areas<br/>• no proper method for <strong>39</strong> <Input className="inline w-32" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} /> of project</td></tr>
                    <tr className="border-t"><td className="p-2">Wisconsin</td><td className="p-2">14 schools (with pupils from <strong>40</strong> <Input className="inline w-32" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} /> families)</td><td className="p-2"></td><td className="p-2">similar results to Tennessee project</td><td className="p-2"></td></tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-2" module="listening" testNumber={3} />
      
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge-test-plus/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">IELTS Practice Tests Plus 2 - Test 3 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus2.test3} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Plus 2 Listening Test 3" />
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
                  // Multi-select questions
                  if (qNum >= 28 && qNum <= 30) {
                     if (qNum === 28) return (<div key="28_30" className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q28-30</span><div className="text-sm">Multi-select (3)</div></div><p>Your: {(multipleAnswers['28_30'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet28_30.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['28_30'] || []).filter(a => correctSet28_30.includes(a)).length}/3</p></div>);
                     return null;
                  }
                  if (qNum >= 31 && qNum <= 32) {
                     if (qNum === 31) return (<div key="31_32" className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q31-32</span><div className="text-sm">Multi-select (2)</div></div><p>Your: {(multipleAnswers['31_32'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet31_32.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['31_32'] || []).filter(a => correctSet31_32.includes(a)).length}/2</p></div>);
                     return null;
                  }
                  if (qNum >= 33 && qNum <= 34) {
                     if (qNum === 33) return (<div key="33_34" className="p-3 rounded border bg-blue-50"><div className="flex justify-between items-center"><span className="font-bold">Q33-34</span><div className="text-sm">Multi-select (2)</div></div><p>Your: {(multipleAnswers['33_34'] || []).join(', ') || 'No Answer'}</p><p>Correct: {correctSet33_34.join(', ')}</p><p className="text-xs">Score: {(multipleAnswers['33_34'] || []).filter(a => correctSet33_34.includes(a)).length}/2</p></div>);
                     return null;
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
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics book="practice-tests-plus-2" module="listening" testNumber={3} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-2" 
          module="listening" 
          testNumber={3} 
        />
      </div>
    </div>
  );
}