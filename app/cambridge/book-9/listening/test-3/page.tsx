'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer'; // Assuming this component exists
import { AUDIO_URLS } from '@/constants/audio'; // Assuming this constant file exists
import { getIELTSListeningScore } from '@/lib/utils'; // Assuming this utility function exists
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'; // Assuming this helper exists

// Correct answers for Cambridge IELTS 9, Listening Test 3
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': '300',
  '2': 'Sunshade',
  '3': 'balcony',
  '4': 'forest/forests',
  '5': '319',
  '6': '10,000',
  '7': 'relative',
  '8': 'missed',
  '9': 'item',
  '10': 'Ludlow',

  // Section 2: Questions 11-20
  '11': 'C',
  '12': 'A',
  '13': 'C',
  '14': 'E',
  '15': 'H',
  '16': 'F',
  '17': 'C',
  '18': 'G',
  '19': '120',
  '20': '5 to 12',

  // Section 3: Questions 21-30
  '21': 'fishing industry',
  '22': 'statistics',
  '23': 'note-taking',
  '24': 'confidence',
  '25': 'ideas',
  '26': 'student support',
  '27': 'places',
  '28': 'general',
  '29': '3 times',
  '30': '25/25th',

  // Section 4: Questions 31-40
  '31': 'B',
  '32': 'A',
  '33': 'glass',
  '34': 'insulation',
  '35': 'windows',
  '36': 'electricity',
  '37': 'floor/floors',
  '38': 'waste',
  '39': 'concrete',
  '40': '15 years'
};

export default function Cambridge9Test3Listening() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []); // Empty dependency array to run only once

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const calculateScore = () => {
    return Object.keys(correctAnswers).reduce((count, qNum) => {
      if (answers[qNum] && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

    const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      // Calculate time taken
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      // Prepare detailed answers data
      const detailedAnswers = {
        singleAnswers: answers,
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || '',
          correctAnswer: correctAnswers[questionNum],
          isCorrect: checkAnswerWithMatching(answers[questionNum], correctAnswers[questionNum], questionNum)
        })),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-9',
        module: 'listening',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
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
  
  const handleTestStart = () => setIsTestStarted(true);
  
  const getAnswerStatus = (qNum: string) => {
    if (!submitted) return 'default';
    return answers[qNum] && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) ? 'correct' : 'incorrect';
  };

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg">
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 1-5</h4>
            <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-200"><th className="p-2 border">Apartments</th><th className="p-2 border">Facilities</th><th className="p-2 border">Other Information</th><th className="p-2 border">Cost</th></tr></thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 border font-medium">Rose Garden Apartments</td><td className="p-2 border">studio flat</td><td className="p-2 border">Example: Greek <span className="underline">dancing</span></td><td className="p-2 border">£219</td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">Blue Bay Apartments</td><td className="p-2 border">large salt-water swimming pool</td><td className="p-2 border">- just <Input id="1" className={`w-20 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="1" /> metres from beach<br/>- near shops</td><td className="p-2 border">£275</td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium"><Input id="2" className={`w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="2" /> Apartments</td><td className="p-2 border">terrace</td><td className="p-2 border">watersports</td><td className="p-2 border">£490</td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">The Grand</td><td className="p-2 border">- Greek paintings<br/>- <Input id="3" className={`w-24 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="3" /></td><td className="p-2 border">- overlooking <Input id="4" className={`w-24 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="4" /><br/>- near a supermarket and a disco</td><td className="p-2 border">£<Input id="5" className={`w-20 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="5" /></td></tr>
                </tbody>
            </table>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 6-10</h4>
            <h3 className="font-bold text-center text-lg my-4">GREEK ISLAND HOLIDAYS</h3>
            <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-200"><th className="p-2 border">Insurance Benefits</th><th className="p-2 border">Maximum Amount</th></tr></thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 border font-medium">Cancellation</td><td className="p-2 border">£<Input id="6" className={`w-24 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="6" /></td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">Hospital</td><td className="p-2 border">£600. Additional benefit allows a <Input id="7" className={`w-32 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="7" /> to travel to resort</td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium"><Input id="8" className={`w-32 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="8" /> departure</td><td className="p-2 border">Up to £1000. Depends on reason</td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">Personal belongings</td><td className="p-2 border">Up to £3000; £500 for one <Input id="9" className={`w-24 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="9" /></td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">Name of Assistant Manager:</td><td className="p-2 border">Ben <Input id="10" className={`w-32 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="10" /></td></tr>
                    <tr><td className="p-2 border font-medium">Direct phone line:</td><td className="p-2 border">081260 543216</td></tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <h3 className="font-bold text-center text-lg mb-4">Winridge Forest Railway Park</h3>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 11–13</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            {[
                {q: '11', p: "Simon’s idea for a theme park came from", o: ["his childhood hobby.", "his interest in landscape design.", "his visit to another park."]},
                {q: '12', p: "When they started, the family decided to open the park only when", o: ["the weather was expected to be good.", "the children weren’t at school.", "there were fewer farming commitments."]},
                {q: '13', p: "Since opening, the park has had", o: ["50,000 visitors.", "1,000,000 visitors.", "1,500,000 visitors."]}
            ].map(({ q, p, o }) => (
                <div key={q} className="my-4">
                    <p className="font-medium mb-2">{q}. {p}</p>
                    <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {o.map((opt, i) => { const val = String.fromCharCode(65 + i); return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${q}`} value={val} checked={answers[q] === val} onChange={() => handleInputChange(q, val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label> })}
                    </div>
                </div>
            ))}
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 14-18</h4>
            <p className="text-sm mb-4">What is currently the main area of work of each of the following people?</p>
            <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A–H, next to questions 14–18.</p>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-gray-100 p-4 rounded">
                    <h5 className="font-bold mb-2 text-center">Area of work</h5>
                    <ul className="space-y-1 text-sm">
                        <li>A advertising</li><li>B animal care</li><li>C building</li><li>D educational links</li>
                        <li>E engine maintenance</li><li>F food and drink</li><li>G sales</li><li>H staffing</li>
                    </ul>
                </div>
                <div className="flex-1 space-y-3">
                    <h5 className="font-bold mb-2">People</h5>
                    {['Simon (the speaker)', 'Liz', 'Sarah', 'Duncan', 'Judith'].map((person, i) => {
                        const q = String(14 + i);
                        return <div key={q} className="flex items-center gap-2"><span className="w-36 font-medium">{person}</span><Input id={q} className={`w-16 text-center ${getAnswerStatus(q) === 'correct' ? 'border-green-500' : getAnswerStatus(q) === 'incorrect' ? 'border-red-500' : ''}`} value={answers[q] || ''} onChange={e => handleInputChange(q, e.target.value.toUpperCase())} maxLength={1} disabled={!isTestStarted || isSubmitting} placeholder={q}/></div>
                    })}
                </div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD AND/OR NUMBERS for each answer.</p>
            <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-200"><th className="p-2 border">Feature</th><th className="p-2 border">Size</th><th className="p-2 border">Biggest challenge</th><th className="p-2 border">Target age group</th></tr></thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 border font-medium">Railway</td><td className="p-2 border">1.2 km</td><td className="p-2 border">Making tunnels</td><td className="p-2 border"></td></tr>
                    <tr className="border-b"><td className="p-2 border font-medium">Go-Kart arena</td><td className="p-2 border flex items-center gap-1"><Input id="19" className={`w-20 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="19" />m²</td><td className="p-2 border">Removing mounds on the track</td><td className="p-2 border flex items-center gap-1"><Input id="20" className={`w-20 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="20" /> year-olds</td></tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle><p className="text-sm font-semibold">Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p></CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg space-y-6">
        <h3 className="font-bold text-center text-lg mb-4">Study Skills Tutorial – Caroline Benning</h3>
        <div className="flex items-center gap-2">Dissertation topic: the <Input id="21" className={`w-48 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['21'] || ''} onChange={e => handleInputChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="21" /></div>
        <div>Strengths: <ul className="list-disc list-inside ml-4"><li><Input id="22" className={`w-48 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['22'] || ''} onChange={e => handleInputChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="22" /></li><li>computer modelling</li></ul></div>
        <div>Weaknesses: <ul className="list-disc list-inside ml-4"><li>lack of background information</li><li>poor <Input id="23" className={`w-48 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="23" /> skills</li></ul></div>
        <table className="w-full border-collapse text-sm bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">Possible strategy</th><th className="p-2 border">Benefits</th><th className="p-2 border">Problems</th></tr></thead>
            <tbody>
                <tr className="border-b"><td className="p-2 border">peer group discussion</td><td className="p-2 border">increases <Input id="24" className={`w-32 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['24'] || ''} onChange={e => handleInputChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="24" /></td><td className="p-2 border">dissertations tend to contain the same <Input id="25" className={`w-32 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['25'] || ''} onChange={e => handleInputChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="25" /></td></tr>
                <tr className="border-b"><td className="p-2 border">use the <Input id="26" className={`w-32 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="26" /> service</td><td className="p-2 border">provides structured programme</td><td className="p-2 border">limited <Input id="27" className={`w-32 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['27'] || ''} onChange={e => handleInputChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="27" /></td></tr>
                <tr className="border-b"><td className="p-2 border">consult study skills books</td><td className="p-2 border">are a good source of reference</td><td className="p-2 border">can be too <Input id="28" className={`w-32 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="28" /></td></tr>
            </tbody>
        </table>
        <div>Recommendations: <ul className="list-disc list-inside ml-4"><li>use a card index</li><li>read all notes <Input id="29" className={`w-32 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="29" /></li></ul></div>
        <div className="flex items-center gap-2">Next tutorial date: <Input id="30" className={`w-32 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="30" /> January</div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-center text-lg mb-4">The Underground House</h3>
        <div className="mb-6">
            <h4 className="font-semibold mb-2">Questions 31 and 32</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            {[
                {q: '31', p: "The owners of the underground house", o: ["had no experience of living in a rural area.", "were interested in environmental issues.", "wanted a professional project manager."]},
                {q: '32', p: "What does the speaker say about the site of the house?", o: ["The land was quite cheap.", "Stone was being extracted nearby.", "It was in a completely unspoilt area."]}
            ].map(({ q, p, o }) => (
                <div key={q} className="my-4">
                    <p className="font-medium mb-2">{q}. {p}</p>
                    <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {o.map((opt, i) => { const val = String.fromCharCode(65 + i); return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${q}`} value={val} checked={answers[q] === val} onChange={() => handleInputChange(q, val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label> })}
                    </div>
                </div>
            ))}
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 33-40</h4>
            <p className="text-sm font-semibold mb-4">Write ONE WORD AND/OR A NUMBER for each answer.</p>
            <div className="space-y-4">
                <div><h5 className="font-semibold">Design</h5><ul className="list-disc list-inside ml-4">
                    <li>Built in the earth, with two floors</li>
                    <li className="flex items-center gap-2">The south-facing side was constructed of two layers of <Input id="33" className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="33" /></li>
                    <li>Photovoltaic tiles were attached</li>
                    <li className="flex items-center gap-2">A layer of foam was used to improve the <Input id="34" className={`w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="34" /> of the building</li>
                </ul></div>
                <div><h5 className="font-semibold">Special features</h5><ul className="list-disc list-inside ml-4">
                    <li className="flex items-center gap-2">To increase the light, the building has many internal mirrors and <Input id="35" className={`w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="35" /></li>
                    <li className="flex items-center gap-2">In future, the house may produce more <Input id="36" className={`w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="36" /> than it needs</li>
                    <li className="flex items-center gap-2">Recycled wood was used for the <Input id="37" className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="37" /> of the house</li>
                    <li className="flex items-center gap-2">The system for processing domestic <Input id="38" className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="38" /> is organic</li>
                </ul></div>
                <div><h5 className="font-semibold">Environmental issues</h5><ul className="list-disc list-inside ml-4">
                    <li className="flex items-center gap-2">The use of large quantities of <Input id="39" className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="39" /> in construction was environmentally harmful</li>
                    <li className="flex items-center gap-2">But the house will have paid its ‘environmental debt’ within <Input id="40" className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} /></li>
                </ul></div>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
          <div className="flex justify-center items-center space-x-8 mb-4">
            <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Raw Score</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-purple-600">{Math.round((score/40)*100)}%</div><div className="text-sm text-gray-600">Percentage</div></div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(correctAnswers).map(([qKey, correctAns]) => {
              const isCorrect = getAnswerStatus(qKey) === 'correct';
              return (
                <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qKey}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                  <div className="text-sm">
                    <div className="mb-1"><span>Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qKey] || 'No answer'}</span></div>
                    <div><span>Correct: </span><span className="text-green-700 font-medium">{correctAns}</span></div>
                  </div>
                </div>);
            })}
          </div>
        </div>
        <div className="flex justify-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 9 - Test 3 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book9.test3} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 9 - Listening Test 3" />
        <Card className="mb-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent></Card>
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((section) => (<Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {section}</Button>))}
        </div>
        {!isTestStarted && !submitted && <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4 text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></CardContent></Card>}
        <div style={{display: currentSection === 1 ? 'block' : 'none'}}>{renderSection1()}</div>
        <div style={{display: currentSection === 2 ? 'block' : 'none'}}>{renderSection2()}</div>
        <div style={{display: currentSection === 3 ? 'block' : 'none'}}>{renderSection3()}</div>
        <div style={{display: currentSection === 4 ? 'block' : 'none'}}>{renderSection4()}</div>
        <div className="flex justify-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        {showResultsPopup && renderResults()}
      </div>
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-9"
        module="listening"
        testNumber={3}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics 
          book="book-9"
          module="listening"
          testNumber={3}
        />
        <UserTestHistory 
          book="book-9"
          module="listening"
          testNumber={3}
        />
      </div>
    </div>
  );
}