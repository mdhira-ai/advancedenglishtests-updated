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

// Correct answers for Test 4
const correctAnswers: { [key: string]: string } = {
  '1': 'hairdresser', '2': 'tablets', '3': 'sunglasses', '4': 'lock', '5': 'adaptor/adapter',
  '6': 'taxi', '7': 'Jefferey', '8': '0777594128', '9': 'church', '10': '30th April/30.04/04.30',
  '11': 'C', '12': 'A', '13': 'A', '14': 'C', '15': 'B', '16': 'C',
  '17': 'D', '18': 'E', '19': 'C', '20': 'E',
  '21': 'C', '22': 'B', '23': 'C', '24': 'A', '25': 'C', '26': 'E',
  '27': 'D', '28': 'E', '29': 'C', '30': 'E',
  '31': 'call centre', '32': 'inconclusive', '33': 'methodology/methods', '34': 'unequal', '35': 'female/women',
  '36': 'response', '37': 'control', '38': '(a/the) group', '39': '(their) colleagues', '40': 'confidential',
};

const correctSet17_18 = ['D', 'E'];
const correctSet19_20 = ['C', 'E'];
const correctSet25_26 = ['C', 'E'];
const correctSet27_28 = ['D', 'E'];
const correctSet29_30 = ['C', 'E'];

export default function Test4Page() {
  // Get session data to check if user is logged in
  const { data: session, isPending: isSessionLoading } = useSession();
  
  // Debug session
  console.log('Session status:', { session: session?.user?.id ? 'logged in' : 'not logged in', isSessionLoading })
  
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '17_18': [], '19_20': [], '25_26': [], '27_28': [], '29_30': [],
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

  const handleMultiSelect = (questionKey: '17_18' | '19_20' | '25_26' | '27_28' | '29_30', value: string) => {
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
        if (['17', '18'].includes(qNum)) { if (!answeredMultiSelect.has('17_18')) { (multipleAnswers['17_18'] || []).forEach(c => { if (correctSet17_18.includes(c)) correctCount++; }); answeredMultiSelect.add('17_18'); }
        } else if (['19', '20'].includes(qNum)) { if (!answeredMultiSelect.has('19_20')) { (multipleAnswers['19_20'] || []).forEach(c => { if (correctSet19_20.includes(c)) correctCount++; }); answeredMultiSelect.add('19_20'); }
        } else if (['25', '26'].includes(qNum)) { if (!answeredMultiSelect.has('25_26')) { (multipleAnswers['25_26'] || []).forEach(c => { if (correctSet25_26.includes(c)) correctCount++; }); answeredMultiSelect.add('25_26'); }
        } else if (['27', '28'].includes(qNum)) { if (!answeredMultiSelect.has('27_28')) { (multipleAnswers['27_28'] || []).forEach(c => { if (correctSet27_28.includes(c)) correctCount++; }); answeredMultiSelect.add('27_28'); }
        } else if (['29', '30'].includes(qNum)) { if (!answeredMultiSelect.has('29_30')) { (multipleAnswers['29_30'] || []).forEach(c => { if (correctSet29_30.includes(c)) correctCount++; }); answeredMultiSelect.add('29_30'); }
        } else if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) { correctCount++; }
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
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length + correctSet17_18.length + correctSet19_20.length + correctSet25_26.length + correctSet27_28.length + correctSet29_30.length,
        percentage: Math.round((calculatedScore / (Object.keys(correctAnswers).length + correctSet17_18.length + correctSet19_20.length + correctSet25_26.length + correctSet27_28.length + correctSet29_30.length)) * 100),
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
      '17_18': [], '19_20': [], '25_26': [], '27_28': [], '29_30': [],
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
  
  const renderMultiSelectStatus = (key: '17_18' | '19_20' | '25_26' | '27_28' | '29_30', correctSet: string[]) => {
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
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-center text-lg mb-4">Things to do before we go</h3>
            <p>Example: Collect the <span className="underline">currency</span></p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Cancel appointment with the <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> (Monday)</li>
                <li>Begin taking the <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> (Tuesday)</li>
                <li>Buy: <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />, a small bag, a spare <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />, an electrical <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
                <li>Book a <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
                <li>Instructions for Laura's mum: Feed the cat</li>
                <li>Vet's details: Name: Colin <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />, Tel: <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />, Address: Fore Street (opposite the <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />)</li>
                <li>Water the plants</li>
                <li>Meet the heating engineer on <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /></li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 11-16</h4>
            <p className="text-sm mb-4">Choose the correct answer, A, B or C. Adbourne Film Festival</p>
            <div className="space-y-4">
              <p><strong>11</strong> Why was the Film Festival started?</p>
              <div>{['To encourage local people to make films.', 'To bring more tourists to the town.', 'To use money released from another project.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q11" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('11', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>12</strong> What is the price range for tickets?</p>
              <div>{['£1.00 - £2.50', '50p - £2.00', '£1.50 - £2.50'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q12" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('12', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>13</strong> As well as online, tickets for the films can be obtained</p>
              <div>{['from the local library.', 'from several different shops.', 'from the two festival cinemas.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q13" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('13', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>14</strong> Last year's winning film was about</p>
              <div>{['farms of the future.', 'schools and the environment.', 'green transport options.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q14" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('14', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>15</strong> This year the competition prize is</p>
              <div>{['a stay in a hotel.', 'film-making equipment.', 'a sum of money.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q15" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('15', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              <p><strong>16</strong> The deadline for entering a film in the competition is the end of</p>
              <div>{['May.', 'June.', 'July.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q16" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('16', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 17-20</h4>
            <p className="text-sm font-semibold mb-2">Questions 17-18: Choose TWO letters, A-E. What TWO main criteria are used to judge the film competition?</p>
            <div>{['Ability to persuade', 'Quality of the story', 'Memorable characters', 'Quality of photography', 'Originality'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['17_18'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('17_18', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            {renderMultiSelectStatus('17_18', correctSet17_18)}
            <p className="text-sm font-semibold mt-4 mb-2">Questions 19-20: Choose TWO letters, A-E. What TWO changes will be made to the competition next year?</p>
            <div>{['A new way of judging', 'A different length of film', 'An additional age category', 'Different performance times', 'New locations for performances'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['19_20'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('19_20', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            {renderMultiSelectStatus('19_20', correctSet19_20)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-24</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C. Research on web-based crosswords</p>
            <div className="space-y-4">
                <p><strong>21</strong> Leela and Jake chose this article because</p>
                <div>{['it was on a topic familiar to most students.', 'it covered both IT and education issues.', 'it dealt with a very straightforward concept.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q21" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('21', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>22</strong> How did Leela and Jake persuade students to take part in their research?</p>
                <div>{['They convinced them they would enjoy the experience.', 'They said it would help them do a particular test.', 'They offered to help them with their own research later on.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q22" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('22', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>23</strong> Leela and Jake changed the design of the original questionnaire because</p>
                <div>{['it was too short for their purposes.', 'it asked misleading questions.', 'it contained out-of-date points.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q23" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('23', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                <p><strong>24</strong> Leela was surprised by the fact that</p>
                <div>{['it is normal for questionnaire returns to be low.', 'so many students sent back their questionnaires.', 'the questionnaire responses were of such high quality.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="q24" value={String.fromCharCode(65+i)} onChange={e=>handleMultipleChoice('24', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
            </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <div className="space-y-4">
              <p className="text-sm font-semibold">Questions 25-26: Choose TWO letters, A-E. What TWO things did respondents say they liked most about doing the crossword?</p>
              <div>{['It helped them spell complex technical terms.', 'It was an enjoyable experience.', 'It helped them concentrate effectively.', 'It increased their general motivation to study.', 'It showed what they still needed to study.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['25_26'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('25_26', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              {renderMultiSelectStatus('25_26', correctSet25_26)}
              <p className="text-sm font-semibold pt-4">Questions 27-28: Choose TWO letters, A-E. In which TWO areas did these research findings differ from those of the original study?</p>
              <div>{['Students\' interest in doing similar exercises.', 'How much students liked doing the crossword.', 'Time taken to do the crossword.', 'Gender differences in appreciation.', 'Opinions about using crosswords for formal assessment.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['27_28'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('27_28', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              {renderMultiSelectStatus('27_28', correctSet27_28)}
              <p className="text-sm font-semibold pt-4">Questions 29-30: Choose TWO letters, A-E. What TWO skills did Leela and Jake agree they had learned from doing the project?</p>
              <div>{['How to manage their time effectively.', 'How to process numerical data.', 'How to design research tools.', 'How to reference other people\'s work.', 'How to collaborate in research.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['29_30'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('29_30', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
              {renderMultiSelectStatus('29_30', correctSet29_30)}
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
            <h3 className="font-bold text-center text-lg mb-4">Job satisfaction study</h3>
            <p><strong>31</strong> Workers involved in the study were employed at a <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</p>
            <p><strong>32</strong> Despite some apparent differences between groups of workers, the survey results were statistically <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</p>
            <p><strong>33</strong> The speaker analysed the study's <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-40" disabled={!isTestStarted || submitted} /> to identify any problems with it.</p>
            <p><strong>34</strong> The various sub-groups were <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> in size.</p>
            <p><strong>35</strong> Workers in the part-time group were mainly <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</p>
            <p><strong>36</strong> The <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> of workers who agreed to take part in the study was disappointing.</p>
            <p><strong>37</strong> Researchers were unable to <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> the circumstances in which workers filled out the questionnaire.</p>
            <p><strong>38</strong> In future, the overall size of the <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> should be increased.</p>
            <p><strong>39</strong> In future studies, workers should be prevented from having discussions with <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-40" disabled={!isTestStarted || submitted} />.</p>
            <p><strong>40</strong> Workers should be reassured that their responses to questions are <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</p>
        </div>
      </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Page View Tracker - Hidden component for analytics */}
      <PageViewTracker book="practice-tests-plus-3" module="listening" testNumber={4} />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">IELTS Practice Tests Plus 3 - Test 4 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus3.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Plus 3 - Listening Test 4" />
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
                     const multiSelectKeys: {[key: string]: string[]} = {'17_18': correctSet17_18, '19_20': correctSet19_20, '25_26': correctSet25_26, '27_28': correctSet27_28, '29_30': correctSet29_30};
                     const multiSelectInfo = Object.entries(multiSelectKeys).find(([key]) => key.split('_').includes(qNum));

                     if (multiSelectInfo) {
                       const [key, correctSet] = multiSelectInfo;
                       userAnswer = (multipleAnswers[key as keyof typeof multipleAnswers] || []).join(', ');
                       correctAns = correctSet.join(', ');
                       isCorrect = correctSet.every(a => userAnswer.includes(a));
                       questionDisplay = `Q${key.replace('_', '-')}`;
                       if (qNum === key.split('_')[0]) return null;
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
        <TestStatistics book="practice-tests-plus-3" module="listening" testNumber={4} />
        <UserTestHistory 
          key={`test-history-${submitted ? score : 'initial'}`} 
          book="practice-tests-plus-3" 
          module="listening" 
          testNumber={4} 
        />
      </div>
    </div>
  );
}