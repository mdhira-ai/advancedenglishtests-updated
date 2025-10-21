'use client';

import { useState, useRef } from 'react';
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
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { TestStatistics } from "@/components/analytics/TestStatistics";
import { UserTestHistory } from "@/components/analytics/UserTestHistory";

// Correct answers for Test 2
const correctAnswers: { [key: string]: string } = {
  '1': 'Lamerton', '2': '42 West Lane', '3': '11(th) june/11.06/60.11', '4': 'cook', '5': 'equipment',
  '6': 'food-handling', '7': 'First Aid', '8': '8 (college) tutor', '9': '0208 685114', '10': 'colour/color blindness',
  '11': 'A', '12': 'A', '13': 'B', '14': 'A', '15': 'C',
  '16': 'C', '17': 'A', '18': 'B', '19': 'C', '20': 'B',
  '21': 'C', '22': 'G', '23': 'A', '24': 'E', '25': 'F',
  '26': 'D', '27': 'G', '28': 'C', '29': 'F', '30': 'E',
  '31': 'heavy', '32': 'surgery', '33': 'beetles', '34': 'gas', '35': 'moving',
  '36': 'surface area', '37': 'tubes', '38': 'pressure', '39': 'submarines/a submarine', '40': 'fuel',
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

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };
  
  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
            correctCount++;
        }
    }
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
        book: 'practice-tests-plus-3',
        module: 'listening',
        testNumber: 2,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
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
 
  const renderAnswerStatusIcon = (isCorrect: boolean) => isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
  
  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-center text-lg mb-4">Pinder's Animal Park</h3>
            <p>Example: Enquiries about <span className="underline">temporary work</span></p>
            <p><strong>Personal Details:</strong></p>
            <p>Name: Jane <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
            <p>Address: <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" />, Exeter</p>
            <p>Telephone number: 07792430921</p>
            <p>Availability: Can start work on <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
            <p><strong>Work details:</strong></p>
            <p>Preferred type of work: Assistant <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
            <p>Relevant skills: Familiar with kitchen <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
            <p>Relevant qualifications: A <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> certificate</p>
            <p>Training required: A <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> course</p>
            <p><strong>Referee:</strong></p>
            <p>Name: Dr Ruth Price</p>
            <p>Position: <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
            <p>Phone number: <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
            <p>Other: Applicant has a form of <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 11-15</h4>
            <p className="text-sm mb-4">Choose the correct answer, A, B or C.</p>
            <p><strong>Tamerton Centre</strong></p>
            <div className="space-y-4">
                <p><strong>11</strong> The Tamerton Centre was set up in order to encourage people</p>
                <div>{['to enjoy being in the countryside.', 'to help conserve the countryside.', 'to learn more about the countryside.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q11" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('11', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>12</strong> Last year's group said that the course</p>
                <div>{['built their self esteem.', 'taught them lots of new skills.', 'made them fitter and stronger.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q12" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('12', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>13</strong> For the speaker, what's the most special feature of the course?</p>
                <div>{['You can choose which activities you do.', 'There\'s such a wide variety of activities.', 'You can become an expert in new activities.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q13" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('13', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>14</strong> The speaker advises people to bring</p>
                <div>{['their own board games.', 'extra table tennis equipment.', 'a selection of films on DVD.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q14" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('14', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>15</strong> Bed-time is strictly enforced because</p>
                <div>{['it\'s a way to reduce bad behaviour.', 'tiredness can lead to accidents.', 'it makes it easy to check everyone\'s in.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q15" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('15', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 16-20</h4>
            <p className="text-sm mb-4">What rules apply to taking different objects to the Centre? Match each object with the correct rule, A-C.</p>
            <div className="border rounded-lg p-4 mb-4">
                <p className="font-bold">Rules</p>
                <p>A You MUST take this</p>
                <p>B You CAN take this, if you wish</p>
                <p>C You must NOT take this</p>
            </div>
            <div className="space-y-2">
                <p><strong>Objects</strong></p>
                <div className="flex items-center"><strong>16</strong> Electrical equipment <Input value={answers['16'] || ''} onChange={e => handleMultipleChoice('16', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>17</strong> Mobile phone <Input value={answers['17'] || ''} onChange={e => handleMultipleChoice('17', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>18</strong> Sun cream <Input value={answers['18'] || ''} onChange={e => handleMultipleChoice('18', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>19</strong> Aerosol deodorant <Input value={answers['19'] || ''} onChange={e => handleMultipleChoice('19', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>20</strong> Towel <Input value={answers['20'] || ''} onChange={e => handleMultipleChoice('20', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-25</h4>
            <p className="text-sm mb-4">Label the diagram below. Write the correct letter, A-G, next to questions 21-25 below. (Image of Biogas Plant omitted)</p>
            <img src="https://d2cy8nxnsajz6t.cloudfront.net/ielts/cambridge-plus/plus3/listening/test2/biogas-plant.png" alt="Biogas Plant Diagram" className="w-full mb-4" />
            <div className="space-y-2">
                <div className="flex items-center"><strong>21</strong> Waste container <Input value={answers['21'] || ''} onChange={e => handleMultipleChoice('21', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>22</strong> Slurry <Input value={answers['22'] || ''} onChange={e => handleMultipleChoice('22', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>23</strong> Water inlet <Input value={answers['23'] || ''} onChange={e => handleMultipleChoice('23', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>24</strong> Gas <Input value={answers['24'] || ''} onChange={e => handleMultipleChoice('24', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>25</strong> Overflow tank <Input value={answers['25'] || ''} onChange={e => handleMultipleChoice('25', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 26-30</h4>
            <p className="text-sm mb-4">Complete the flow chart below. Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.</p>
            <div className="border rounded-lg p-4 mb-4 grid grid-cols-2 gap-2">
                <p>A Identify sequence</p> <p>B Ask questions</p> <p>C Copy</p> <p>D Demonstrate meaning</p> <p>E Distribute worksheet</p> <p>F Draw pictures</p> <p>G Present sentences</p>
            </div>
            <h3 className="font-bold text-center text-lg my-4">LESSON OUTLINE YEAR THREE TOPIC: ENERGY</h3>
            <div className="space-y-2 text-center">
                <p>Teacher: Introduce word | Pupils: look and listen</p> <p>↓</p>
                <p>Teacher: <strong>26</strong> <Input className="inline w-16" value={answers['26'] || ''} onChange={e => handleMultipleChoice('26', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /> | Pupils: look and listen</p> <p>↓</p>
                <p>Teacher: Present question | Pupils: respond</p> <p>↓</p>
                <p>Teacher: <strong>27</strong> <Input className="inline w-16" value={answers['27'] || ''} onChange={e => handleMultipleChoice('27', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /> and expand | Pupils: <strong>28</strong> <Input className="inline w-16" value={answers['28'] || ''} onChange={e => handleMultipleChoice('28', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /></p> <p>↓</p>
                <p>Teacher: Display pictures | Pupils: <strong>29</strong> <Input className="inline w-16" value={answers['29'] || ''} onChange={e => handleMultipleChoice('29', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /></p> <p>↓</p>
                <p>Teacher: <strong>30</strong> <Input className="inline w-16" value={answers['30'] || ''} onChange={e => handleMultipleChoice('30', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /> | Pupils: write</p> <p>↓</p>
                <p>Teacher: Monitor pupils</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-center text-lg mb-4">Creating artificial gills</h3>
            <p><strong>Background</strong></p>
            <ul className="list-disc pl-5">
                <li>Taking in oxygen : mammals – lungs; fish – gills</li>
                <li>Long-held dreams – humans swimming underwater without oxygen tanks</li>
                <li>Oxygen tanks considered too <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> and large</li>
                <li>Attempts to extract oxygen directly from water</li>
                <li>1960s – prediction that humans would have gills added by <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li>
                <li>Ideas for artificial gills were inspired by research on: fish gills, fish swim bladders, animals without gills – especially bubbles used by <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li>
            </ul>
            <p><strong>Building a simple artificial gill</strong></p>
            <ul className="list-disc pl-5">
                <li>Make a watertight box of a material which lets <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> pass through</li>
                <li>Fill with air and submerge in water</li>
                <li>Important that the diver and the water keep <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li>
                <li>The gill has to have a large <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li>
                <li>Designers often use a network of small <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> on their gill</li>
                <li>Main limitation – problems caused by increased <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> in deeper water</li>
            </ul>
            <p><strong>Other applications</strong></p>
            <ul className="list-disc pl-5">
                <li>Supplying oxygen for use on <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /></li>
                <li>Powering <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> cells for driving machinery underwater</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-3" module="listening" testNumber={2} />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">IELTS Practice Tests Plus 3 - Test 2 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus3.test2} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Plus 3 - Listening Test 2" />
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
                    const userAnswer = answers[qNum] || '';
                    const isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum);
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                           <span className="font-medium">Q{qNum}</span> {renderAnswerStatusIcon(isCorrect)}
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
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics book="practice-tests-plus-3" module="listening" testNumber={2} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-3" 
          module="listening" 
          testNumber={2} 
        />
      </div>
    </div>
  );
}