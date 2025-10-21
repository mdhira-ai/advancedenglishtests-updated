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
  '1': '75 cm/seventy-five centimetres', '2': 'wood', '3': '15.00/15/fifteen pounds', '4': 'cream', '5': 'adjustable', '6': 'cupboard', '7': 'glass', '8': '95.00/95/ninety-five pounds', '9': 'Wilson', '10': 'B',
  // Section 2: Questions 11-20
  '11': 'cafe', '12': '7.30/seven thirty/half past seven', '13': 'the disabled', '14': 'birds', '15': 'art exhibitions', '16': 'abstract', '17': 'designer', '18': 'portraits', '19': '2/two years/yrs', '20': 'photographs/photos',
  // Section 3: Questions 21-30
  '21': 'A', '22': 'C', '23': 'B', '24': 'C', '25': 'B', '26': 'style and interests', '27': 'visuals', '28': 'range', '29': 'source(s)', '30': 'content',
  // Section 4: Questions 31-40
  '31': 'B', '32': 'B', '33': 'A', '34': 'microclimate', '35': 'concentration', '36': 'frost', '37': 'liquid', '38': 'supercoming', '39': 'mars', '40': 'locations',
};

export default function Test1Page() {
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
        testNumber: 1,
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
                        <span><strong>{optLetter}</strong> {option}</span>
                    </label>
                );
            })}
        </div>
    </div>
  );

  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">ENQUIRY ABOUT BOOKCASES</h3>
          <p className="text-center">Example: Number of bookcases available: two</p>
          <h4 className="font-semibold mt-4">Both bookcases</h4>
          <p>Width: <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
          <p>Made of: <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
          <h4 className="font-semibold mt-4">First bookcase</h4>
          <p>Cost: <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
          <p>Colour: <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
          <p>Number of shelves: six (four are <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" />)</p>
          <h4 className="font-semibold mt-4">Second bookcase</h4>
          <p>Colour: dark brown</p>
          <p>Other features:</p>
          <ul className="list-disc pl-5">
            <li>almost 80 years old</li>
            <li>has a <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /> at the bottom</li>
            <li>has <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></li>
          </ul>
          <p>Cost: <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
          <h4 className="font-semibold mt-4">Details of seller</h4>
          <p>Name: Mrs <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
          <p>Address: 41 Oak Rise, Stanton.</p>
        </div>
        <h4 className="font-semibold mt-6 mb-2">Question 10</h4>
        <p>Choose the correct letter, A, B or C.</p> 
        <p className="mb-2">Which map shows the correct location of the seller's house?</p>
        <img src="https://d2cy8nxnsajz6t.cloudfront.net/ielts/cambridge-plus/plus2/listening/test1/map.png" alt="Map of Stanton" className="w-full mb-4" />
        <div className="flex space-x-4">
            {['A', 'B', 'C'].map(opt => <label key={opt} className="flex items-center space-x-2"><input type="radio" name="q10" value={opt} onChange={(e) => handleMultipleChoice('10', e.target.value)} disabled={!isTestStarted || submitted} /> {opt} </label>)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 11-13</h4>
        <p className="text-sm font-semibold mb-4">Complete the summary below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-center text-lg mb-2">Charity Art Sale</h3>
            <p>The paintings will be displayed in the Star Gallery and in a nearby <strong>11</strong> <Input className="inline w-40" value={answers['11'] || ''} onChange={e => handleInputChange('11', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
            <p>The sale of pictures will begin at <strong>12</strong> <Input className="inline w-40" value={answers['12'] || ''} onChange={e => handleInputChange('12', e.target.value)} disabled={!isTestStarted || submitted} /> on Thursday, and there will be refreshments beforehand.</p>
            <p>The money raised will all be used to help <strong>13</strong> <Input className="inline w-40" value={answers['13'] || ''} onChange={e => handleInputChange('13', e.target.value)} disabled={!isTestStarted || submitted} /> children in New Zealand and other countries.</p>
        </div>
        <h4 className="font-semibold mb-2 mt-6">Questions 14-20</h4>
        <p className="text-sm font-semibold mb-4">Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left"><th className="p-2">Artist</th><th className="p-2">Personal information</th><th className="p-2">Type of painting</th></tr></thead>
                <tbody>
                    <tr className="border-t"><td className="p-2">Don Studley</td><td className="p-2"><ul className="list-disc pl-4"><li>daughter is recovering from a problem with her back</li><li>self-taught artist</li></ul></td><td className="p-2"><ul className="list-disc pl-4"><li>pictures of the <strong>14</strong> <Input className="inline w-32" value={answers['14'] || ''} onChange={e => handleInputChange('14', e.target.value)} disabled={!isTestStarted || submitted} /> of New Zealand</li></ul></td></tr>
                    <tr className="border-t"><td className="p-2">James Chang</td><td className="p-2"><ul className="list-disc pl-4"><li>originally from Taiwan</li><li>had a number of <strong>15</strong> <Input className="inline w-32" value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || submitted} /> there</li></ul></td><td className="p-2"><ul className="list-disc pl-4"><li><strong>16</strong> <Input className="inline w-32" value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || submitted} /> paintings</li><li>strong colours</li></ul></td></tr>
                    <tr className="border-t"><td className="p-2">Natalie Stevens</td><td className="p-2"><ul className="list-disc pl-4"><li>has shown pictures in many countries</li><li>is an artist and a website <strong>17</strong> <Input className="inline w-32" value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || submitted} /></li></ul></td><td className="p-2"><ul className="list-disc pl-4"><li>soft colours, various media</li><li>mainly does <strong>18</strong> <Input className="inline w-32" value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || submitted} /></li></ul></td></tr>
                    <tr className="border-t"><td className="p-2">Christine Shin</td><td className="p-2"><ul className="list-disc pl-4"><li>lived in New Zealand for <strong>19</strong> <Input className="inline w-32" value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || submitted} /></li><li>Korean</li></ul></td><td className="p-2"><ul className="list-disc pl-4"><li>paintings are based on <strong>20</strong> <Input className="inline w-32" value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || submitted} /></li><li>watercolours of New Zealand landscapes</li></ul></td></tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 21-25</h4>
        <p className="text-sm mb-2">What instructions were the students given about their project?</p>
        <p className="text-sm font-semibold mb-4">Write the correct letter, A, B or C next to Questions 21-25.</p>
        <p>A they must do this</p>
        <p>B they can do this if they want to</p>
        <p>C they can't do this</p>
        <div className="space-y-2 mt-4">
            {['Choose a writer from a list provided.', 'Get biographical information from the Internet.', 'Study a collection of poems.', 'Make a one-hour video.', 'Refer to key facts in the writer\'s life.'].map((item, index) => {
              const qNum = String(21 + index);
              return (<div key={qNum} className="flex items-center space-x-4"><span className="flex-1"><strong>{qNum}</strong> {item}</span><Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" /></div>);
            })}
        </div>
        <h4 className="font-semibold mb-2 mt-6">Questions 26-30</h4>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-lg">Other requirements for the project</h3>
            <ul className="list-disc pl-5 space-y-2">
                <li>extract chosen from the author's work must reflect the <strong>26</strong> <Input className="inline w-48" value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} disabled={!isTestStarted || submitted} /> and <Input className="inline w-48" value={answers['26b'] || ''} disabled={true} /> of the author.</li>
                <li>students must find sound effects and <strong>27</strong> <Input className="inline w-48" value={answers['27'] || ''} onChange={e => handleInputChange('27', e.target.value)} disabled={!isTestStarted || submitted} /> to match the texts they choose.</li>
                <li>students must use a <strong>28</strong> <Input className="inline w-48" value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value)} disabled={!isTestStarted || submitted} /> of computer software programs to make the video.</li>
                <li>students must include information about the <strong>29</strong> <Input className="inline w-48" value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value)} disabled={!isTestStarted || submitted} /> of all material</li>
            </ul>
            <h3 className="font-bold text-lg mt-4">Criteria for assessment</h3>
            <ul className="list-disc pl-5 space-y-2">
                <li>completion of all components - 25%</li>
                <li><strong>30</strong> <Input className="inline w-48" value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value)} disabled={!isTestStarted || submitted} /> (must represent essence of author's work) - 50%</li>
                <li>artistic and technical design of video - 25%</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <h4 className="font-semibold mb-2">Questions 31-33</h4>
        <p className="text-sm font-semibold mb-4">Choose the correct answer, A, B or C.</p>
        {renderMultipleChoiceSingle('31', '\'Extremophiles\' are life forms that can live in', ['isolated areas.', 'hostile conditions.', 'new habitats.'])}
        {renderMultipleChoiceSingle('32', 'The researchers think that some of the organisms they found in Antarctica are', ['new species.', 'ancient colonies.', 'types of insects.'])}
        {renderMultipleChoiceSingle('33', 'The researchers were the first people to find life forms in Antarctica', ['in the soil.', 'under the rock surface.', 'on the rocks.'])}
        <h4 className="font-semibold mb-2 mt-6">Questions 34-40</h4>
        <p className="text-sm font-semibold mb-4">Complete the sentences below. Write ONE WORD for each answer.</p>
        <h3 className="font-bold text-lg mb-2">How the extremophiles survive</h3>
        <div className="space-y-2">
            <p><strong>34</strong> Access to the sun's heat can create a <Input className="inline w-40" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} /> for some organisms.</p>
            <p><strong>35</strong> The deeper the soil, the higher the <Input className="inline w-40" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} /> of salt.</p>
            <p><strong>36</strong> Salt can protect organisms against the effects of <Input className="inline w-40" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} />, even at very low temperatures.</p>
            <p><strong>37</strong> All living things must have access to <Input className="inline w-40" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} /> water.</p>
            <p><strong>38</strong> Salt plays a part in the process of <Input className="inline w-40" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} />, which prevents freezing.</p>
            <p><strong>39</strong> The environment of <Input className="inline w-40" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} /> is similar to the dry valleys of Antarctica.</p>
            <p><strong>40</strong> This research may provide evidence of the existence of extraterrestrial life forms and their possible <Input className="inline w-40" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} /> on other planets.</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-2" module="listening" testNumber={1} />
      
      <div className="max-w-4xl mx-auto">
        <Link href="/cambridge-test-plus/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
        <h1 className="text-3xl font-bold mb-4">IELTS Practice Tests Plus 2 - Test 1 Listening</h1>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus2.test1} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Plus 2 Listening Test 1" />
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
        <TestStatistics book="practice-tests-plus-2" module="listening" testNumber={1} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-2" 
          module="listening" 
          testNumber={1} 
        />
      </div>
    </div>
  );
}