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
  '1': 'B', '2': 'A', '3': 'C', '4': 'bus station', '5': '450', '6': 'noisy', '7': 'bus station', '8': 'Hill Avenue', '9': '(very) modern', '10': 'quiet',
  // Section 2: Questions 11-20
  '11': 'Sundays', '12': '1998', '13': '100,000/a hundred thousand/one hundred thousand', '14': 'government', '15': 'research', '16': 'Conference Centre/Center', '17': 'Information Desk', '18': 'bookshop', '19': 'King\'s Library', '20': 'stamp display',
  // Section 3: Questions 21-30
  '21': 'B', '22': 'C', '23': 'A', '24': 'B', '25': 'A', '26': 'organisation/organization', '27': 'definition', '28': 'aims', '29': 'key skills', '30': 'evidence',
  // Section 4: Questions 31-40
  '31': 'proficiency', '32': 'learning', '33': 'social and economic', '34': 'positive', '35': 'adults', '36': 'A', '37': 'A', '38': 'B', '39': 'C', '40': 'A',
};

export default function Test2Page() {
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
    Object.keys(correctAnswers).forEach(qNum => {
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
        testNumber: 2,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
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
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10 (Rental Property Search Discussion)</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 1-3</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
        <p className="mb-2">Example: Martin wants to B rent a flat.</p>
        {renderMultipleChoiceSingle('1', 'What is Martin\'s occupation?', ['A He works in a car factory.', 'B He works in a bank.', 'C He is a college student.'])}
        {renderMultipleChoiceSingle('2', 'The friends would prefer somewhere with', ['A four bedrooms.', 'B three bedrooms.', 'C two bathrooms.'])}
        {renderMultipleChoiceSingle('3', 'Phil would rather live in', ['A the east suburbs.', 'B the city centre.', 'C the west suburbs.'])}
        <h4 className="font-semibold mb-2 mt-6">Questions 4-10</h4>
        <p className="text-sm font-semibold mb-4">Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left"><th className="p-2">Location</th><th className="p-2">Details of flats available</th><th className="p-2">Good (✓) and bad (✗) points</th></tr></thead>
                <tbody>
                    <tr className="border-t">
                        <td className="p-2">Bridge Street, near the <strong>4</strong> <Input className="inline w-32" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                        <td className="p-2"><ul className="list-disc pl-4"><li>3 bedrooms</li><li>very big living room</li></ul></td>
                        <td className="p-2">✓ £ <strong>5</strong> <Input className="inline w-16" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /> a month<br/>✓ transport links<br/>✗ no shower<br/>✗ could be <strong>6</strong> <Input className="inline w-32" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                    </tr>
                    <tr className="border-t">
                        <td className="p-2"><strong>7</strong> <Input className="inline w-32" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                        <td className="p-2"><ul className="list-disc pl-4"><li>4 bedrooms</li><li>living room</li><li><strong>8</strong> <Input className="inline w-32" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} /></li></ul></td>
                        <td className="p-2">✓ <strong>9</strong> <Input className="inline w-32" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} /> and well equipped<br/>✓ shower<br/>✓ will be <strong>10</strong> <Input className="inline w-32" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /><br/>✗ £800 a month</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20 (The British Library Tour Information)</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 11-15</h4>
        <p className="text-sm font-semibold mb-4">Complete the sentences below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-lg mb-2">The British Library</h3>
            <p><strong>11</strong> The reading rooms are only open for group visits on <Input className="inline w-40" value={answers['11'] || ''} onChange={e => handleInputChange('11', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
            <p><strong>12</strong> The library was officially opened in <Input className="inline w-40" value={answers['12'] || ''} onChange={e => handleInputChange('12', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
            <p><strong>13</strong> All the library rooms together cover <Input className="inline w-40" value={answers['13'] || ''} onChange={e => handleInputChange('13', e.target.value)} disabled={!isTestStarted || submitted} /> m².</p>
            <p><strong>14</strong> The library is financed by the <Input className="inline w-40" value={answers['14'] || ''} onChange={e => handleInputChange('14', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
            <p><strong>15</strong> The main function of the library is to provide resources for people doing <Input className="inline w-40" value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
        </div>
        <h4 className="font-semibold mb-2 mt-6">Questions 16-20</h4>
        <p className="text-sm font-semibold mb-4">Label the plan below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <img src="https://d2cy8nxnsajz6t.cloudfront.net/ielts/cambridge-plus/plus2/listening/test2/plan.png" alt="British Library Plan" className="w-full mb-4 rounded-lg" />
        <div className="space-y-2">
            <p><strong>16</strong> <Input className="inline w-40" value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p><strong>17</strong> <Input className="inline w-40" value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p><strong>18</strong> <Input className="inline w-40" value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p><strong>19</strong> <Input className="inline w-40" value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || submitted} /></p>
            <p><strong>20</strong> <Input className="inline w-40" value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || submitted} /></p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30 (Project on Work Placement)</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 21-25</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct answer, A, B or C.</p>
        <h3 className="font-bold text-lg mb-2">Project on work placement</h3>
        {renderMultipleChoiceSingle('21', 'The main aim of Dave\'s project is to', ['A describe a policy.', 'B investigate an assumption.', 'C identify a problem.'])}
        {renderMultipleChoiceSingle('22', 'Dave\'s project is based on schemes in', ['A schools.', 'B colleges.', 'C universities.'])}
        {renderMultipleChoiceSingle('23', 'How many academic organisations returned Dave\'s questionnaire?', ['A 15', 'B 50', 'C 150'])}
        {renderMultipleChoiceSingle('24', 'Dave wanted his questionnaires to be completed by company', ['A Human Resources Managers.', 'B Line Managers.', 'C owners.'])}
        {renderMultipleChoiceSingle('25', 'Dr Green wants Dave to provide a full list of', ['A respondents.', 'B appendices.', 'C companies.'])}
        <h4 className="font-semibold mb-2 mt-6">Questions 26-30</h4>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-lg">Notes on project</h3>
            <p><strong>Introduction</strong></p>
            <ul className="list-disc pl-5 space-y-2">
                <li>improve the <strong>26</strong> <Input className="inline w-40" value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} disabled={!isTestStarted || submitted} /> of ideas</li>
                <li>include a <strong>27</strong> <Input className="inline w-40" value={answers['27'] || ''} onChange={e => handleInputChange('27', e.target.value)} disabled={!isTestStarted || submitted} /> of 'Work Placement'</li>
                <li>have separate sections for literature survey and research <strong>28</strong> <Input className="inline w-40" value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value)} disabled={!isTestStarted || submitted} /> and methods</li>
            </ul>
            <p className="mt-2"><strong>Findings</strong></p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Preparation stage - add summary</li>
                <li><strong>29</strong> <Input className="inline w-40" value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value)} disabled={!isTestStarted || submitted} /> development - good</li>
                <li>Constraints on learning - provide better links to the <strong>30</strong> <Input className="inline w-40" value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value)} disabled={!isTestStarted || submitted} /> from research</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40 (Bilingualism and Cognitive Development)</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 31-35</h4>
        <p className="text-sm font-semibold mb-4">Complete the sentences below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <div className="space-y-2">
            <p><strong>31</strong> Bilingualism can be defined as having an equal level of communicative <Input className="inline w-48" value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} /> in two or more languages.</p>
            <p><strong>32</strong> Early research suggested that bilingualism caused problems with <Input className="inline w-48" value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} /> and mental development.</p>
            <p><strong>33</strong> Early research into bilingualism is now rejected because it did not consider the <Input className="inline w-48" value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} /> and <Input className="inline w-48" value={answers['33b'] || ''} disabled={true} /> backgrounds of the children.</p>
            <p><strong>34</strong> It is now thought that there is a <Input className="inline w-48" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} /> relationship between bilingualism and cognitive skills in children.</p>
            <p><strong>35</strong> Research done by Ellen Bialystok in Canada now suggests that the effects of bilingualism also apply to <Input className="inline w-48" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
        </div>
        <h4 className="font-semibold mb-2 mt-6">Questions 36-40</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
        {renderMultipleChoiceSingle('36', 'In Dr Bialystok\'s experiment, the subjects had to react according to', ['A the colour of the square on the screen.', 'B the location of the square on the screen.', 'C the location of the shift key on the keyboard.'])}
        {renderMultipleChoiceSingle('37', 'The experiment demonstrated the \'Simon effect\' because it involved a conflict between', ['A seeing something and reacting to it.', 'B producing fast and slow reactions.', 'C demonstrating awareness of shape and colour.'])}
        {renderMultipleChoiceSingle('38', 'The experiment shows that, compared with the monolingual subjects, the bilingual subjects', ['A were more intelligent.', 'B had faster reaction times overall.', 'C had more problems with the \'Simon effect\'.'])}
        {renderMultipleChoiceSingle('39', 'The results of the experiment indicate that bilingual people may be better at', ['A doing different types of tasks at the same time.', 'B thinking about several things at once.', 'C focusing only on what is needed to do a task.'])}
        {renderMultipleChoiceSingle('40', 'Dr Bialystok\'s first and second experiments both suggest that bilingualism may', ['A slow down the effects of old age on the brain.', 'B lead to mental confusion among old people.', 'C help old people to stay in better physical condition.'])}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-2" module="listening" testNumber={2} />
      
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge-test-plus/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-2">IELTS Practice Tests Plus 2 - Test 2 Listening</h1>
        <p className="text-lg text-gray-600 mb-4">Rental property search, British Library tour, work placement project, bilingualism research</p>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus2.test2} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Plus 2 Listening Test 2" />
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
        <TestStatistics book="practice-tests-plus-2" module="listening" testNumber={2} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-2" 
          module="listening" 
          testNumber={2} 
        />
      </div>
    </div>
  );
}