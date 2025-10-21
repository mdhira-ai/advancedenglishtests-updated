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

// Correct answers for Test 3
const correctAnswers: { [key: string]: string } = {
  '1': 'grey/gray', '2': '62,000', '3': 'teacher', '4': 'shopping', '5': '1100',
  '6': 'tax', '7': 'tyre/tire', '8': 'headlight', '9': 'Thursday', '10': 'London',
  '11': 'A', '12': 'A', '13': 'B', '14': 'C', '15': 'H',
  '16': 'F', '17': 'E', '18': 'A', '19': 'B', '20': 'D',
  '21': 'C', '22': 'C', '23': 'A', '24': 'B', '25': 'B', '26': 'E',
  '27': 'C', '28': 'D', '29': 'B', '30': 'D',
  '31': 'English literature', '32': 'autobiography', '33': 'lab(oratory)', '34': 'practical skills', '35': 'novices/beginners',
  '36': 'experimental', '37': 'video', '38': 'framework', '39': 'editor', '40': 'sequence/order',
};

const correctSet25_26 = ['B', 'E'];
const correctSet27_28 = ['C', 'D'];
const correctSet29_30 = ['B', 'D'];

export default function Test3Page() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession();
  
  // Debug session
  console.log('Session status:', { session: session?.user?.id ? 'logged in' : 'not logged in', isSessionLoading })
  
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '25_26': [], '27_28': [], '29_30': [],
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

  const handleMultiSelect = (questionKey: '25_26' | '27_28' | '29_30', value: string) => {
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
        if (['25', '26'].includes(qNum)) {
            if (!answeredMultiSelect.has('25_26')) {
                (multipleAnswers['25_26'] || []).forEach(c => { if (correctSet25_26.includes(c)) correctCount++; });
                answeredMultiSelect.add('25_26');
            }
        } else if (['27', '28'].includes(qNum)) {
            if (!answeredMultiSelect.has('27_28')) {
                (multipleAnswers['27_28'] || []).forEach(c => { if (correctSet27_28.includes(c)) correctCount++; });
                answeredMultiSelect.add('27_28');
            }
        } else if (['29', '30'].includes(qNum)) {
             if (!answeredMultiSelect.has('29_30')) {
                (multipleAnswers['29_30'] || []).forEach(c => { if (correctSet29_30.includes(c)) correctCount++; });
                answeredMultiSelect.add('29_30');
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
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length + correctSet25_26.length + correctSet27_28.length + correctSet29_30.length,
        percentage: Math.round((calculatedScore / (Object.keys(correctAnswers).length + correctSet25_26.length + correctSet27_28.length + correctSet29_30.length)) * 100),
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
      '25_26': [], '27_28': [], '29_30': [],
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
  
  const renderMultiSelectStatus = (key: '25_26' | '27_28' | '29_30', correctSet: string[]) => {
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
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write NO MORE THAN ONE WORD OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
          <h3 className="font-bold text-center text-lg mb-4">Car for sale (Mini)</h3>
          <p>Example: Age of car: just under <span className="underline">13 years old</span></p>
          <p>Colour: <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Mileage: <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Previous owner was a <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Current owner has used car mainly for <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Price: may accept offers from £ <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>(Note: <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> not due for 5 months)</p>
          <p>Condition: good (recently serviced)</p>
          <p>Will need a new <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> soon</p>
          <p>Minor problem with a <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></p>
          <p>Viewing</p>
          <p>Agreed to view the car on <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> a.m.</p>
          <p>Address: 238, <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> Road.</p>
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
            <div className="space-y-4">
              <p><strong>11</strong> The Treloar Valley passenger ferry</p>
              <div>{['usually starts services in April.', 'departs at the same time each day.', 'is the main means of transport for local villagers.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q11" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('11', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>12</strong> What does the speaker say about the river cruise?</p>
              <div>{['It can be combined with a train journey.', 'It\'s unsuitable for people who have walking difficulties.', 'The return journey takes up to four hours.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q12" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('12', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>13</strong> What information is given about train services in the area?</p>
              <div>{['Trains run non-stop between Calton and Plymouth.', 'One section of the rail track is raised.', 'Bookings can be made by telephone or the Internet.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q13" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('13', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>14</strong> The 'Rover' bus ticket</p>
              <div>{['can be used for up to five journeys a day.', 'is valid for weekend travel only.', 'has recently gone down in price.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q14" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('14', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 15-20</h4>
            <p className="text-sm mb-4">Label the map below. Write the correct letter, A-H, next to questions 15-20. (Image of Calton Map omitted)</p>
            <img src="https://d2cy8nxnsajz6t.cloudfront.net/ielts/cambridge-plus/plus3/listening/test3/map.png" alt="Calton Map" className="w-full mb-4" />
            <div className="space-y-2">
                <div className="flex items-center"><strong>15</strong> Bus stop <Input value={answers['15'] || ''} onChange={e => handleMultipleChoice('15', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>16</strong> Car park <Input value={answers['16'] || ''} onChange={e => handleMultipleChoice('16', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>17</strong> Museum <Input value={answers['17'] || ''} onChange={e => handleMultipleChoice('17', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>18</strong> Mill <Input value={answers['18'] || ''} onChange={e => handleMultipleChoice('18', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>19</strong> Potter's studio <Input value={answers['19'] || ''} onChange={e => handleMultipleChoice('19', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
                <div className="flex items-center"><strong>20</strong> Café <Input value={answers['20'] || ''} onChange={e => handleMultipleChoice('20', e.target.value.toUpperCase())} className="ml-2 w-16" disabled={!isTestStarted || submitted} /></div>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-24</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C. Advice on writing a dissertation</p>
            <div className="space-y-4">
                <p><strong>21</strong> What does Howard say about the experience of writing his dissertation?</p>
                <div>{['It was difficult in unexpected ways.', 'It was more enjoyable than he\'d anticipated.', 'It helped him understand previous course work.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q21" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('21', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>22</strong> What is Joanne most worried about?</p>
                <div>{['Finding enough material.', 'Missing deadlines.', 'Writing too much.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q22" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('22', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>23</strong> What does Howard say was his main worry a year previously?</p>
                <div>{['Forgetting what he\'d read about.', 'Not understanding what he\'d read.', 'Taking such a long time to read each book.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q23" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('23', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>24</strong> What motivated Howard to start writing his dissertation?</p>
                <div>{['Talking to his tutor about his problems.', 'Seeing an inspirational TV show.', 'Reading a controversial journal article.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q24" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('24', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <div className="space-y-4">
              <p className="text-sm font-semibold">Questions 25-26: Choose TWO letters, A-E. What TWO things does Howard advise Joanne to do in the first month of tutorials?</p>
              <div>{['See her tutor every week.', 'Review all the module booklists.', 'Buy all the key books.', 'Write full references for everything she reads.', 'Write a draft of the first chapter.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['25_26'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('25_26', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              {renderMultiSelectStatus('25_26', correctSet25_26)}
              <p className="text-sm font-semibold pt-4">Questions 27-28: Choose TWO letters, A-E. What TWO things does Howard say about library provision?</p>
              <div>{['Staff are particularly helpful to undergraduates.', 'Inter-library loans are very reliable.', 'Students can borrow extra books when writing a dissertation.', 'Staff recommend relevant old dissertations.', 'It\'s difficult to access electronic resources.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['27_28'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('27_28', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              {renderMultiSelectStatus('27_28', correctSet27_28)}
              <p className="text-sm font-semibold pt-4">Questions 29-30: Choose TWO letters, A-E. What TWO things do Joanne agree to discuss with her tutor?</p>
              <div>{['The best ways to collaborate with other students.', 'Who to get help from during college vacations.', 'The best way to present the research.', 'Whether she can use web sources.', 'How to manage her study time.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['29_30'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('29_30', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              {renderMultiSelectStatus('29_30', correctSet29_30)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the flow chart below. Write NO MORE THAN TWO WORDS for each answer.</p>
        <h3 className="font-bold text-center text-lg my-4">Expertise in creative writing</h3>
        <div className="space-y-2 text-center border p-4 rounded-lg">
            <p>Background – researcher had previously studied <strong>31</strong> <Input className="inline w-40" value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} /></p> <p>↓</p>
            <p>Had initial idea for research – inspired by a book (the <strong>32</strong> <Input className="inline w-32" value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} /> of a famous novelist).</p> <p>↓</p>
            <p>Posed initial question – why do some people become experts whilst others don’t?</p> <p>↓</p>
            <p>Read expertise research in different fields. Avoided studies conducted in a <strong>33</strong> <Input className="inline w-32" value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} /> because too controlled. Most helpful studies-research into <strong>34</strong> <Input className="inline w-32" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} />, e.g. waiting tables.</p> <p>↓</p>
            <p>Found participants: four true <strong>35</strong> <Input className="inline w-32" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} /> in creative writing (easy to find) and four with extensive experience.</p> <p>↓</p>
            <p>Using ‘think aloud’ techniques, gathered <strong>36</strong> <Input className="inline w-32" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} /> data from inexperienced writer. (During session – assistant made <strong>37</strong> <Input className="inline w-32" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} /> recordings).</p> <p>↓</p>
            <p>Gathered similar data from experienced writers.</p> <p>↓</p>
            <p>Compared two data sets and generated a <strong>38</strong> <Input className="inline w-32" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} /> for analysis (Identified five major stages in writing – will be refined later).</p> <p>↓</p>
            <p>Got an expert <strong>39</strong> <Input className="inline w-32" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} /> to evaluate the quality of the different products.</p> <p>↓</p>
            <p>Identified the most effective <strong>40</strong> <Input className="inline w-32" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} /> of stages in producing text.</p>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-3" module="listening" testNumber={3} />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">IELTS Practice Tests Plus 3 - Test 3 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus3.test3} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Plus 3 - Listening Test 3" />
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
                     let userAnswer: string = ''; let isCorrect: boolean = false; let questionDisplay = `Q${qNum}`;
                     if (['25','26'].includes(qNum)) { userAnswer = (multipleAnswers['25_26'] || []).join(', '); correctAns = correctSet25_26.join(', '); isCorrect = correctSet25_26.every(a => userAnswer.includes(a)); questionDisplay = "Q25-26"; if(qNum==='25') return null;
                     } else if (['27','28'].includes(qNum)) { userAnswer = (multipleAnswers['27_28'] || []).join(', '); correctAns = correctSet27_28.join(', '); isCorrect = correctSet27_28.every(a => userAnswer.includes(a)); questionDisplay = "Q27-28"; if(qNum==='27') return null;
                     } else if (['29','30'].includes(qNum)) { userAnswer = (multipleAnswers['29_30'] || []).join(', '); correctAns = correctSet29_30.join(', '); isCorrect = correctSet29_30.every(a => userAnswer.includes(a)); questionDisplay = "Q29-30"; if(qNum==='29') return null;
                     } else { userAnswer = answers[qNum] || ''; isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum); }
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between"><span className="font-medium">{questionDisplay}</span> {renderAnswerStatusIcon(isCorrect)}</div>
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
        <TestStatistics book="practice-tests-plus-3" module="listening" testNumber={3} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-3" 
          module="listening" 
          testNumber={3} 
        />
      </div>
    </div>
  );
}