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
  '1': '19.75', '2': 'theme', '3': 'quiet', '4': 'children', '5': 'breakfast(s)', '6': 'free skydive', '7': 'A', '8': 'C', '9': 'B', '10': 'C',
  // Section 2: Questions 11-20
  '11': 'B', '12': 'A', '13': 'C', '14': 'C', 
  // Q15-17 in any order
  '15': 'local councils/schools/companies', '16': 'local councils/schools/companies', '17': 'local councils/schools/companies', 
  '18': '020 7562 4028', '19': '27.50', '20': '3 hours/hrs',
  // Section 3: Questions 21-30
  '21': '(the/their) technique', '22': '(answering) (the/students) questions', '23': '(the/their) solutions', '24': 'A', '25': 'B', '26': 'B', '27': 'C', '28': 'ending', '29': 'limitations', '30': 'literature',
  // Section 4: Questions 31-40
  '31': 'clean and safe/safe and clean', '32': 'basic needs', '33': 'local government', '34': 'residents', '35': 'economic', '36': 'secondary school', '37': 'films', '38': 'Women\'s Centre/Center', '39': 'skills', '40': 'status',
};

export default function Test4Page() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession();
  
  // Debug session
  console.log('Session status:', { session: session?.user?.id ? 'logged in' : 'not logged in', isSessionLoading })
  
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
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
  
  const calculateScore = () => {
    let correctCount = 0;
    
    // Handle Q15-17 (any order)
    const userAnswers15_17 = [answers['15'], answers['16'], answers['17']].filter(Boolean).map(a => a.toLowerCase());
    const correctAnswers15_17 = ['local councils', 'schools', 'companies'];
    correctAnswers15_17.forEach(correctAnswer => {
        const foundIndex = userAnswers15_17.findIndex(userAnswer => checkAnswerWithMatching(userAnswer, correctAnswer, ''));
        if (foundIndex !== -1) {
            correctCount++;
            userAnswers15_17.splice(foundIndex, 1);
        }
    });

    // Handle Q31 (two parts: clean and safe / safe and clean)
    const answer31a = (answers['31'] || '').toLowerCase().trim();
    const answer31b = (answers['31b'] || '').toLowerCase().trim();
    const combined31 = `${answer31a} and ${answer31b}`;
    if (checkAnswerWithMatching(combined31, correctAnswers['31'], '31')) {
        correctCount++;
    }

    Object.keys(correctAnswers).forEach(qNum => {
        if (parseInt(qNum) >= 15 && parseInt(qNum) <= 17) return; // Skip these as they're handled above
        if (qNum === '31') return; // Skip Q31 as it's handled above
        if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) correctCount++;
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
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length + 3, // +3 for Q15-17
        percentage: Math.round((calculatedScore / (Object.keys(correctAnswers).length + 3)) * 100),
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
        <h4 className="font-semibold mb-2">Questions 1-6</h4>
        <p className="text-sm font-semibold mb-4">Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <caption className="p-2 font-bold bg-gray-100">Budget accommodation in Queenstown, New Zealand</caption>
                <thead className="bg-gray-50"><tr className="text-left"><th className="p-2">Accommodation</th><th className="p-2">Price (dormitory)</th><th className="p-2">Comments</th></tr></thead>
                <tbody>
                    <tr className="border-t"><td className="p-2">Travellers' Lodge</td><td className="p-2">Example: fully booked</td><td className="p-2"></td></tr>
                    <tr className="border-t"><td className="p-2">Bingley's</td><td className="p-2">1 US$ <Input className="inline w-24" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} /></td><td className="p-2">• in town centre<br/>• café with regular <strong>2</strong> <Input className="inline w-32" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} /> nights<br/>• sundeck</td></tr>
                    <tr className="border-t"><td className="p-2">Chalet Lodge</td><td className="p-2">US$ 18.00</td><td className="p-2">• located in a <strong>3</strong> <Input className="inline w-32" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} /> alpine setting<br/>• 10 mins from town centre<br/>• <strong>4</strong> <Input className="inline w-32" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /> are welcome</td></tr>
                    <tr className="border-t"><td className="p-2">Globetrotters</td><td className="p-2">US$ 18.50</td><td className="p-2">• in town centre<br/>• <strong>5</strong> <Input className="inline w-32" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /> included<br/>• chance to win a <strong>6</strong> <Input className="inline w-32" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /></td></tr>
                </tbody>
            </table>
        </div>
        <h4 className="font-semibold mb-2 mt-6">Questions 7-10</h4>
        <p className="text-sm mb-2">Who wants to do each of the activities below?</p>
        <p>A only Jacinta</p>
        <p>B only Lewis</p>
        <p>C both Jacinta and Lewis</p>
        <p className="text-sm font-semibold mb-4">Write the correct letter, A, B or C, next to Questions 7-10.</p>
        <div className="space-y-2">
            {['bungee jump', 'white-water rafting', 'jet-boat ride', 'trekking on wilderness trail'].map((item, index) => {
              const qNum = String(7 + index);
              return (<div key={qNum} className="flex items-center space-x-4"><span className="flex-1"><strong>{qNum}</strong> {item}</span><Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" /></div>);
            })}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 11-14</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
        {renderMultipleChoiceSingle('11', 'Jack says that in London these days, many people', ['A see cycling as a foolish activity.', 'B have no experience of cycling.', 'C take too many risks when cycling.'])}
        {renderMultipleChoiceSingle('12', 'If people want to cycle to school or work, CitiCyclist helps them by', ['A giving cycling lessons on the route they take.', 'B advising them on the safest route to choose.', 'C teaching them basic skills on quiet roads first.'])}
        {renderMultipleChoiceSingle('13', 'Jack works with some advanced cyclists who want to develop', ['A international competitive riding skills.', 'B knowledge of advanced equipment.', 'C confidence in complex road systems.'])}
        {renderMultipleChoiceSingle('14', 'CitiCyclist supports the view that cyclists should', ['A have separate sections of the road from motor traffic.', 'B always wear protective clothing when cycling.', 'C know how to ride confidently on busy roads.'])}
        <h4 className="font-semibold mb-2 mt-6">Questions 15-17</h4>
        <p className="text-sm font-semibold mb-4">List THREE types of organisations for which CitiCyclist provides services. Write NO MORE THAN THREE WORDS for each answer.</p>
        <p><strong>15</strong> <Input className="w-full" value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        <p><strong>16</strong> <Input className="w-full" value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        <p><strong>17</strong> <Input className="w-full" value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        <h4 className="font-semibold mb-2 mt-6">Questions 18-20</h4>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <p>website address: citicyclist.co.uk</p>
            <p>phone: <strong>18</strong> <Input className="inline w-40" value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p>cost (single person): <strong>19</strong> <Input className="inline w-40" value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || submitted} /> per lesson</p>
            <p>usual length of course: <strong>20</strong> <Input className="inline w-40" value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || submitted} /> (except complete beginners)</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 21-23</h4>
        <p className="text-sm font-semibold mb-4">Answer the questions below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <p><strong>21</strong> What do Sharon and Xiao Li agree was the strongest aspect of their presentation? <Input className="w-full mt-1" value={answers['21'] || ''} onChange={e => handleInputChange('21', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        <p><strong>22</strong> Which part of their presentation was Xiao Li least happy with? <Input className="w-full mt-1" value={answers['22'] || ''} onChange={e => handleInputChange('22', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        <p><strong>23</strong> Which section does Sharon feel they should have discussed in more depth? <Input className="w-full mt-1" value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        <h4 className="font-semibold mb-2 mt-6">Questions 24-27</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
        {renderMultipleChoiceSingle('24', 'Sharon and Xiao Li were surprised when the class said', ['A they spoke too quickly.', 'B they included too much information.', 'C their talk was not well organised.'])}
        {renderMultipleChoiceSingle('25', 'The class gave Sharon and Xiao Li conflicting feedback on their', ['A timing.', 'B use of visuals.', 'C use of eye contact.'])}
        {renderMultipleChoiceSingle('26', 'The class thought that the presentation was different from the others because', ['A the analysis was more detailed.', 'B the data collection was more wide-ranging.', 'C the background reading was more extensive.'])}
        {renderMultipleChoiceSingle('27', 'Which bar chart represents the marks given by the tutor?', ['A', 'B', 'C'])}
        <img src="https://d2cy8nxnsajz6t.cloudfront.net/ielts/cambridge-plus/plus2/listening/test4/bar.png" alt="Bar Chart" className="w-full my-4" />
       
        <h4 className="font-semibold mb-2 mt-6">Questions 28-30</h4>
        <p className="text-sm font-semibold mb-4">Complete the sentences below. Write ONE WORD ONLY for each answer.</p>
        <p><strong>28</strong> The tutor says that the <Input className="inline w-32" value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value)} disabled={!isTestStarted || submitted} /> of the presentation seemed rather sudden.</p>
        <p><strong>29</strong> The tutor praises the students' discussion of the <Input className="inline w-32" value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value)} disabled={!isTestStarted || submitted} /> of their results.</p>
        <p><strong>30</strong> The tutor suggests that they could extend the <Input className="inline w-32" value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value)} disabled={!isTestStarted || submitted} /> review in their report.</p>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Questions 31-33: Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <p>The World Health Organisation says a healthy city must</p>
            <ul className="list-disc pl-5">
                <li>have a <strong>31</strong> <Input className="inline w-40" value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} /> and <Input className="inline w-40" value={answers['31b'] || ''} onChange={e => handleInputChange('31b', e.target.value)} disabled={!isTestStarted || submitted} /> environment.</li>
                <li>meet the <strong>32</strong> <Input className="inline w-40" value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} /> of all its inhabitants.</li>
                <li>provide easily accessible health services.</li>
                <li>encourage ordinary people to take part in <strong>33</strong> <Input className="inline w-40" value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} />.</li>
            </ul>
        </div>
        <p className="text-sm font-semibold my-4">Questions 34-40: Complete the table below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left"><th className="p-2">Place / Project</th><th className="p-2">Aim</th><th className="p-2">Method</th><th className="p-2">Achievement</th></tr></thead>
                <tbody>
                    <tr className="border-t">
                        <td className="p-2">Sri Lanka Community Contracts System</td>
                        <td className="p-2">to upgrade squatter settlements</td>
                        <td className="p-2">the <strong>34</strong> <Input className="inline w-32" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} /> constructed infrastructure, e.g. drains, paths</td>
                        <td className="p-2">• better housing and infrastructure<br/>• provided better <strong>35</strong> <Input className="inline w-32" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} /> opportunities</td>
                    </tr>
                    <tr className="border-t">
                        <td className="p-2">Mali cooperative</td>
                        <td className="p-2">to improve sanitation in city</td>
                        <td className="p-2">• <strong>36</strong> <Input className="inline w-32" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} /> organising garbage collection<br/>• public education campaign via <strong>37</strong> <Input className="inline w-32" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} /> and discussion groups</td>
                        <td className="p-2">• greater environmental awareness<br/>• improved living conditions</td>
                    </tr>
                    <tr className="border-t">
                        <td className="p-2">Egypt (Mokattam) <strong>38</strong> <Input className="inline w-32" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                        <td className="p-2">to support disadvantaged women</td>
                        <td className="p-2">women provided with the <strong>39</strong> <Input className="inline w-32" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} /> and equipment for sewing and weaving</td>
                        <td className="p-2">• rise in the <strong>40</strong> <Input className="inline w-32" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} /> and quality of life of young women</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-2" module="listening" testNumber={4} />
      
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge-test-plus/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">IELTS Practice Tests Plus 2 - Test 4 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus2.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Plus 2 Listening Test 4" />
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
                   // Custom display for Q15-17
                   if (qNum === 15) {
                    const userAnswers = [answers['15'], answers['16'], answers['17']].filter(Boolean).map(a => a.toLowerCase());
                    const correctAnswersSet = ['local councils', 'schools', 'companies'];
                    const correctUserAnswers = userAnswers.filter(ua => correctAnswersSet.some(ca => checkAnswerWithMatching(ua, ca, '')));
                    const numCorrect = new Set(correctUserAnswers).size;
                    return (
                        <div key="15-17" className="p-3 rounded border bg-blue-50">
                            <div className="flex justify-between items-center"><span className="font-bold">Q15-17</span><div className="text-sm">List (any order)</div></div>
                            <p>Your: {userAnswers.join(', ') || 'No Answer'}</p>
                            <p>Correct: {correctAnswersSet.join(', ')}</p>
                            <p className="text-xs">Score: {numCorrect}/3</p>
                        </div>
                    );
                  }
                  if (qNum === 16 || qNum === 17) return null;

                  // Custom display for Q31 (two parts)
                  if (qNum === 31) {
                    const answer31a = (answers['31'] || '').toLowerCase().trim();
                    const answer31b = (answers['31b'] || '').toLowerCase().trim();
                    const combined31 = `${answer31a} and ${answer31b}`;
                    const isCorrect = checkAnswerWithMatching(combined31, correctAnswers['31'], '31');
                    const userAnswer = answer31a && answer31b ? `${answer31a} and ${answer31b}` : (answer31a || answer31b || '');
                    return (
                        <div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex justify-between items-center"><span className="font-bold">Q{qNumStr}</span>{isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div>
                            <p>Your: {userAnswer || 'No Answer'}</p>
                            {!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}
                        </div>
                    );
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
        <TestStatistics book="practice-tests-plus-2" module="listening" testNumber={4} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-2" 
          module="listening" 
          testNumber={4} 
        />
      </div>
    </div>
  );
}