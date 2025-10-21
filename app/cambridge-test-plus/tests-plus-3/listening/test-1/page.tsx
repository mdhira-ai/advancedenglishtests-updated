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

// Correct answers for Test 1
const correctAnswers: { [key: string]: string } = {
  '1': '(an) accountant', '2': 'over 50', '3': 'family (membership)', '4': '4/nine/9', '5': 'doctor',
  '6': 'pool', '7': 'pay (extra)', '8': 'social events', '9': 'air conditioning', '10': '(the) restaurant',
  '11': 'E', '12': 'F', '13': 'B', '14': 'D', '15': 'C', '16': 'G',
  '17': 'B', '18': 'E', '19': 'A', '20': 'D',
  '21': 'C', '22': 'A', '23': 'B', '24': 'A', '25': 'B',
  '26': 'E', '27': 'G', '28': 'A', '29': 'D', '30': 'B',
  '31': 'ice age', '32': 'invisible', '33': 'infection(s)', '34': 'flavour', '35': 'fungus/fungi',
  '36': 'sexes', '37': 'extinction', '38': 'lowland', '39': 'shelter(s)', '40': 'cuttings',
};

const correctSet17_18 = ['B', 'E'];
const correctSet19_20 = ['A', 'D'];

export default function Test1Page() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession();
  
  // Debug session
  console.log('Session status:', { session: session?.user?.id ? 'logged in' : 'not logged in', isSessionLoading })
  
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '17_18': [], '19_20': [],
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

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };
  
  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const handleMultiSelect = (questionKey: '17_18' | '19_20', value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const maxAnswers = 2;
        let newAnswers;
        if (currentAnswers.includes(value)) {
            newAnswers = currentAnswers.filter(ans => ans !== value);
        } else {
            if (currentAnswers.length < maxAnswers) {
                newAnswers = [...currentAnswers, value].sort();
            } else { newAnswers = currentAnswers; }
        }
        return { ...prev, [questionKey]: newAnswers };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    const answeredMultiSelect = new Set<string>();

    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (['17', '18'].includes(qNum)) {
            if (!answeredMultiSelect.has('17_18')) {
                const userChoices = multipleAnswers['17_18'] || [];
                userChoices.forEach(choice => {
                    if (correctSet17_18.includes(choice)) { correctCount++; }
                });
                answeredMultiSelect.add('17_18');
            }
        } else if (['19', '20'].includes(qNum)) {
            if (!answeredMultiSelect.has('19_20')) {
                const userChoices = multipleAnswers['19_20'] || [];
                userChoices.forEach(choice => {
                    if (correctSet19_20.includes(choice)) { correctCount++; }
                });
                answeredMultiSelect.add('19_20');
            }
        } else if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
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
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length + correctSet17_18.length + correctSet19_20.length,
        percentage: Math.round((calculatedScore / (Object.keys(correctAnswers).length + correctSet17_18.length + correctSet19_20.length)) * 100),
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
      '17_18': [], '19_20': [],
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
 
  const renderAnswerStatusIcon = (isCorrect: boolean) => isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
  
  const renderMultiSelectStatus = (key: '17_18' | '19_20', correctSet: string[]) => {
    if (!submitted) return null;
    const userChoices = multipleAnswers[key] || [];
    const correctCount = userChoices.filter(c => correctSet.includes(c)).length;
    const isFullyCorrect = correctCount === correctSet.length && userChoices.length === correctSet.length;
    return (
        <div className="mt-2 flex items-center gap-2">
            {renderAnswerStatusIcon(isFullyCorrect)}
            <span className="text-sm text-gray-600">Correct answers: {correctSet.join(' and ')} ({correctCount}/{correctSet.length} correct)</span>
        </div>
    );
  };

  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the form below. Write NO MORE THAN TWO WORDS OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
          <h3 className="font-bold text-center text-lg mb-4">Health club customer research</h3>
          <p>Example: Name - Selina Thompson</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p>Occupation: <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} /></p></div>
            <div><p>Age group: <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} /></p></div>
            <div><p>Type of membership: <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} /></p></div>
            <div><p>Length of membership: <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} /> years</p></div>
            <div><p>Why joined: Recommended by a <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} /></p></div>
            <div><p>Visits to club per month: Eight (on average)</p></div>
            <div><p>Facility used most: <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} /></p></div>
            <div><p>Facility not used (if any): Tennis courts (because reluctant to <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} />)</p></div>
            <div><p>Suggestions for improvements: Have more <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} /></p></div>
            <div><p>Install <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} /> in the gym.</p></div>
            <div><p>Open <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} /> later at weekends.</p></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-8">
            <div>
              <h4 className="font-semibold mb-2">Questions 11-16</h4>
              <p className="text-sm mb-4">Complete the flow chart below. Choose SIX answers from the box and write the correct letter, A-G, next to questions 11-16.</p>
              <div className="border rounded-lg p-4 mb-4 grid grid-cols-4 gap-2 text-center">
                  <div>A air</div> <div>B ash</div> <div>C earth</div> <div>D grass</div> <div>E sticks</div> <div>F stones</div> <div>G water</div>
              </div>
              <h3 className="font-bold text-center text-lg my-4">Making a steam pit</h3>
              <div className="space-y-2 text-center">
                  <p>Dig a pit.</p> <p>↓</p>
                  <p>Arrange a row of <strong>11</strong> <Input className="inline w-16" value={answers['11'] || ''} onChange={e => handleMultipleChoice('11', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /> over the pit.</p> <p>↓</p>
                  <p>Place <strong>12</strong> <Input className="inline w-16" value={answers['12'] || ''} onChange={e => handleMultipleChoice('12', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /> on top.</p> <p>↓</p>
                  <p>Light the wood and let it burn out.</p> <p>↓</p>
                  <p>Remove <strong>13</strong> <Input className="inline w-16" value={answers['13'] || ''} onChange={e => handleMultipleChoice('13', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} />.</p> <p>↓</p>
                  <p>Insert a stick.</p> <p>↓</p>
                  <p>Cover the pit with <strong>14</strong> <Input className="inline w-16" value={answers['14'] || ''} onChange={e => handleMultipleChoice('14', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} />.</p> <p>↓</p>
                  <p>Place wrapped food on top, and cover it with <strong>15</strong> <Input className="inline w-16" value={answers['15'] || ''} onChange={e => handleMultipleChoice('15', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} />.</p> <p>↓</p>
                  <p>Remove the stick and put <strong>16</strong> <Input className="inline w-16" value={answers['16'] || ''} onChange={e => handleMultipleChoice('16', e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} /> into the hole.</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Questions 17-18</h4>
              <p className="text-sm mb-4">Choose TWO letters, A-E. Which TWO characteristics apply to the bamboo oven?</p>
              <div className="space-y-2">
                  {['It\'s suitable for windy weather.', 'The fire is lit below the bottom end of the bamboo.', 'The bamboo is cut into equal lengths.', 'The oven hangs from a stick.', 'It cooks food by steaming it.'].map((opt, i) => <label key={i} className="flex items-center space-x-2"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['17_18'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('17_18', e.target.value)} disabled={!isTestStarted || submitted} /><span>{String.fromCharCode(65+i)} {opt}</span></label>)}
              </div>
               {renderMultiSelectStatus('17_18', correctSet17_18)}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Questions 19-20</h4>
              <p className="text-sm mb-4">Choose TWO letters, A-E. Which TWO pieces of advice does the speaker give about eating wild fungi?</p>
              <div className="space-y-2">
                  {['Cooking doesn\'t make poisonous fungi edible.', 'Edible wild fungi can be eaten without cooking.', 'Wild fungi are highly nutritious.', 'Some edible fungi look very similar to poisonous varieties.', 'Fungi which cannot be identified should only be eaten in small quantities.'].map((opt, i) => <label key={i} className="flex items-center space-x-2"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['19_20'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('19_20', e.target.value)} disabled={!isTestStarted || submitted} /><span>{String.fromCharCode(65+i)} {opt}</span></label>)}
              </div>
              {renderMultiSelectStatus('19_20', correctSet19_20)}
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
            <p className="text-sm mb-4">Choose the correct letter, A, B or C. Research project on attitudes towards study</p>
            <div className="space-y-4">
              <p><strong>21</strong> Phoebe's main reason for choosing her topic was that</p>
              <div>{['her classmates had been very interested in it.', 'it would help prepare her for her first teaching post.', 'she had been inspired by a particular book.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q21" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('21', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>22</strong> Phoebe's main research question related to</p>
              <div>{['the effect of teacher discipline.', 'the variety of learning activities.', 'levels of pupil confidence.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q22" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('22', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>23</strong> Phoebe was most surprised by her finding that</p>
              <div>{['gender did not influence behaviour significantly.', 'girls were more negative about school than boys.', 'boys were more talkative than girls in class.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q23" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('23', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>24</strong> Regarding teaching, Phoebe says she has learned that</p>
              <div>{['teachers should be flexible in their lesson planning.', 'brighter children learn from supporting weaker ones.', 'children vary from each other in unpredictable ways.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q24" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('24', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>25</strong> Tony is particularly impressed by Phoebe's ability to</p>
              <div>{['recognise the limitations of such small-scale research.', 'reflect on her own research experience in an interesting way.', 'design her research in such a way as to minimise difficulties.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q25" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('25', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 26-30</h4>
            <p className="text-sm mb-4">What did Phoebe find difficult about the different research techniques she used? Choose FIVE answers from the box and write the correct letter A-G, next to questions 26-30.</p>
            <div className="border rounded-lg p-4 mb-4">
              <p className="font-bold">Difficulties</p>
              <div className="grid grid-cols-2 gap-2">
                <p>A Obtaining permission</p> <p>B Deciding on a suitable focus</p> <p>C Concentrating while gathering data</p> <p>D Working collaboratively</p> <p>E Processing data she had gathered</p> <p>F Finding a suitable time to conduct the research</p> <p>G Getting hold of suitable equipment</p>
              </div>
            </div>
            <div className="space-y-2">
                <p><strong>Research techniques</strong></p>
                <div className="flex items-center"><strong>26</strong> Observing lessons <Input value={answers['26'] || ''} onChange={e => handleMultipleChoice('26', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>27</strong> Interviewing teachers <Input value={answers['27'] || ''} onChange={e => handleMultipleChoice('27', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>28</strong> Interviewing pupils <Input value={answers['28'] || ''} onChange={e => handleMultipleChoice('28', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>29</strong> Using questionnaires <Input value={answers['29'] || ''} onChange={e => handleMultipleChoice('29', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>30</strong> Taking photographs <Input value={answers['30'] || ''} onChange={e => handleMultipleChoice('30', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-center text-lg mb-4">Saving the juniper plant</h3>
            <p><strong>Background</strong></p>
            <p><strong>31</strong> Juniper was one of the first plants to colonise Britain after the last <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</p>
            <p><strong>32</strong> Its smoke is virtually <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />, so juniper wood was used as fuel in illegal activities.</p>
            <p><strong>33</strong> Oils from the plant were used to prevent <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> spreading.</p>
            <p><strong>34</strong> Nowadays, its berries are widely used to <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> food and drink.</p>
            <p><strong>Ecology</strong></p>
            <p><strong>35</strong> Juniper plants also support several species of insects and <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</p>
            <p><strong>Problems</strong></p>
            <p><strong>36</strong> In current juniper populations, ratios of the <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> are poor.</p>
            <p><strong>37</strong> Many of the bushes in each group are of the same age so <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> of whole populations is rapid.</p>
            <p><strong>Solutions</strong></p>
            <p><strong>38</strong> Plantlife is trialling novel techniques across <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> areas of England.</p>
            <p><strong>39</strong> One measure is to introduce <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> for seedlings.</p>
            <p><strong>40</strong> A further step is to plant <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> from healthy bushes.</p>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-3" module="listening" testNumber={1} />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">IELTS Practice Tests Plus 3 - Test 1 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus3.test1} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Plus 3 - Listening Test 1" />
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
                    let userAnswer: string = '';
                    let isCorrect: boolean = false;
                     if (['17', '18'].includes(qNum)) {
                         userAnswer = (multipleAnswers['17_18'] || []).join(', ');
                         isCorrect = !!userAnswer && correctSet17_18.every(a => userAnswer.includes(a));
                         correctAns = correctSet17_18.join(', ');
                     } else if (['19', '20'].includes(qNum)) {
                         userAnswer = (multipleAnswers['19_20'] || []).join(', ');
                         isCorrect = !!userAnswer && correctSet19_20.every(a => userAnswer.includes(a));
                         correctAns = correctSet19_20.join(', ');
                     } else {
                        userAnswer = answers[qNum] || '';
                        isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum);
                     }
                    if ((['17', '19'].includes(qNum))) return null;
                    const questionDisplay = ['18', '20'].includes(qNum) ? `Q${parseInt(qNum)-1}-${qNum}` : `Q${qNum}`;
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                           <span className="font-medium">{questionDisplay}</span> {renderAnswerStatusIcon(isCorrect)}
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
        <TestStatistics book="practice-tests-plus-3" module="listening" testNumber={1} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-3" 
          module="listening" 
          testNumber={1} 
        />
      </div>
    </div>
  );
}