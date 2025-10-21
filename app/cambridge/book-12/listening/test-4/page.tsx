'use client';

import { useState, useEffect, useRef } from 'react';
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
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';

// Correct answers for Cambridge 12, Listening Test 8
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'temporary',
  '2': 'doctor',
  '3': 'Africa',
  '4': 'youth',
  '5': 'May',
  '6': 'cheese',
  '7': 'Arbuthnot',
  '8': 'DG7 4PH',
  '9': 'Tuesday',
  '10': 'talk/presentation',

  // Section 2: Questions 11-20
  '11': 'A',
  '12': 'C',
  '13': 'B',
  '14': 'B',
  '15': 'H',
  '16': 'C',
  '17': 'F',
  '18': 'G',
  '19': 'I',
  '20': 'B',

  // Section 3: Questions 21-30
  '21': 'classification',
  '22': 'worst',
  '23': 'slides',
  '24': 'issues',
  '25': 'F',
  '26': 'A',
  '27': 'E',
  '28': 'C',
  '29': 'G',
  '30': 'B',

  // Section 4: Questions 31-40
  '31': 'garden(s)',
  '32': 'political',
  '33': 'work/study',
  '34': 'fountain',
  '35': 'social',
  '36': 'lively',
  '37': 'training',
  '38': 'culture',
  '39': 'nature',
  '40': 'silent',
};

export default function Test8Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
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

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber]?.trim() || '';
    const correctAnswer = correctAnswers[questionNumber] as string;
    if (!userAnswer) return false;
    if (/^[A-I]$/.test(correctAnswer)) {
      return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    }
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };

  const calculateScore = () => {
    let correctCount = 0;
    for (const questionNumber in correctAnswers) {
      if (checkAnswer(questionNumber)) {
        correctCount++;
      }
    }
    return correctCount;
  };

  const totalQuestions = Object.keys(correctAnswers).length;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      const detailedAnswers = {
        singleAnswers: answers,
        results: Object.keys(correctAnswers).map(qNum => ({
          questionNumber: qNum,
          userAnswer: answers[qNum] || '',
          correctAnswer: correctAnswers[qNum],
          isCorrect: checkAnswer(qNum)
        })),
        score: calculatedScore,
        totalQuestions,
        percentage: Math.round((calculatedScore / totalQuestions) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-12',
        module: 'listening',
        testNumber: 8,
        score: calculatedScore,
        totalQuestions,
        percentage: Math.round((calculatedScore / totalQuestions) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', result.error);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setSubmitted(true);
      setShowResultsPopup(true);
      setIsSubmitting(false);
    }
  };

  const handleTestStart = () => setIsTestStarted(true);

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const renderMultipleChoiceQuestion = (q: string, options: string[]) => (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const val = String.fromCharCode(65 + i);
        return (
          <label key={val} className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name={`q-${q}`} value={val} checked={answers[q] === val} onChange={() => handleInputChange(q, val)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4"/>
            <span className="text-sm">{val}. {opt}</span>
          </label>
        );
      })}
    </div>
  );

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">Cycle tour leader: Applicant enquiry</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2"><strong>Example:</strong> Name: Margaret <span className="underline">Smith</span></div>
              
              <h4 className="font-semibold">About the applicant:</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>wants a <span>1</span><Input type="text" value={answers['1'] || ''} onChange={(e) => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('1') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> job{submitted && (getAnswerStatus('1') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>will soon start work as a <span>2</span><Input type="text" value={answers['2'] || ''} onChange={(e) => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('2') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('2') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>has led cycle trips in <span>3</span><Input type="text" value={answers['3'] || ''} onChange={(e) => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('3') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('3') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>interested in being a leader of a cycling trip for families</li>
                <li>is currently doing voluntary work with members of a <span>4</span><Input type="text" value={answers['4'] || ''} onChange={(e) => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('4') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> club{submitted && (getAnswerStatus('4') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>available for five months from the 1st of <span>5</span><Input type="text" value={answers['5'] || ''} onChange={(e) => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('5') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('5') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>can't eat <span>6</span><Input type="text" value={answers['6'] || ''} onChange={(e) => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('6') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('6') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              </ul>

              <h4 className="font-semibold">Contact details:</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>address: 27 <span>7</span><Input type="text" value={answers['7'] || ''} onChange={(e) => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('7') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> Place, Dumfries{submitted && (getAnswerStatus('7') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>postcode: <span>8</span><Input type="text" value={answers['8'] || ''} onChange={(e) => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('8') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('8') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              </ul>
              
              <h4 className="font-semibold">Interview:</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>interview at 2.30 pm on <span>9</span><Input type="text" value={answers['9'] || ''} onChange={(e) => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('9') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('9') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>will plan a short <span>10</span><Input type="text" value={answers['10'] || ''} onChange={(e) => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('10') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> about being a tour guide{submitted && (getAnswerStatus('10') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 11-14</h4>
          <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold text-lg mb-4">Visiting the Sheepmarket area</h3>
          <div className="space-y-6">
            {[
              { q: '11', question: "Which is the most rapidly-growing group of residents in the Sheepmarket area?", options: ['young professional people', 'students from the university', 'employees in the local market'] },
              { q: '12', question: "The speaker recommends the side streets in the Sheepmarket for their", options: ['international restaurants.', 'historical buildings.', 'arts and crafts.'] },
              { q: '13', question: "Clothes designed by entrants for the Young Fashion competition must", options: ['be modelled by the designers themselves.', 'be inspired by aspects of contemporary culture.', 'be made from locally produced materials.'] },
              { q: '14', question: "Car parking is free in some car parks if you", options: ['stay for less than an hour.', 'buy something in the shops.', 'park in the evenings or at weekends.'] },
            ].map(({ q, question, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {question}</p>
                <div className={`${submitted ? (getAnswerStatus(q) === 'correct' ? 'bg-green-50' : 'bg-red-50') : ''} p-2 rounded`}>{renderMultipleChoiceQuestion(q, options)}{submitted && <div className="mt-2 text-sm text-gray-600">Correct: {correctAnswers[q]}</div>}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm text-gray-600 mb-2">Label the map below.</p>
          <p className="text-sm font-semibold mb-4">Write the correct letter, A-I, next to Questions 15-20.</p>
          <div className="text-center mb-4"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book12/listening/test4/map.png" alt="Sheepmarket Map" className="mx-auto max-w-full h-auto rounded border shadow-lg"/></div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '15', label: 'The Reynolds House' },
              { num: '16', label: 'The Thumb' },
              { num: '17', label: 'The Museum' },
              { num: '18', label: 'The Contemporary Art Gallery' },
              { num: '19', label: 'The Warner Gallery' },
              { num: '20', label: 'Nucleus' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-2">
                <span className="w-48">{num} {label}</span>
                <Input type="text" value={answers[num] || ''} onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${submitted ? (getAnswerStatus(num) === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} maxLength={1} />
                {submitted && (getAnswerStatus(num) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 21-24</h4>
          <p className="text-sm text-gray-600 mb-2">Complete the table below.</p>
          <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
          <h3 className="font-bold text-lg text-center mb-4">Presentation on film adaptations of Shakespeare's plays</h3>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-200"><th className="border p-2">Stages of presentation</th><th className="border p-2">Work still to be done</th></tr></thead>
            <tbody>
              <tr><td className="border p-2">Introduce Giannetti's book containing a <span>21</span><Input type="text" value={answers['21'] || ''} onChange={(e) => handleInputChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block mx-1 ${submitted ? (getAnswerStatus('21') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> of adaptations{submitted && (getAnswerStatus('21') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</td><td className="border p-2">Organise notes</td></tr>
              <tr><td className="border p-2">Ask class to suggest the <span>22</span><Input type="text" value={answers['22'] || ''} onChange={(e) => handleInputChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block mx-1 ${submitted ? (getAnswerStatus('22') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> adaptations{submitted && (getAnswerStatus('22') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</td><td className="border p-2">No further work needed</td></tr>
              <tr><td className="border p-2">Present Rachel Malchow's ideas</td><td className="border p-2">Prepare some <span>23</span><Input type="text" value={answers['23'] || ''} onChange={(e) => handleInputChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block mx-1 ${submitted ? (getAnswerStatus('23') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('23') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</td></tr>
              <tr><td className="border p-2">Discuss relationship between adaptations and <span>24</span><Input type="text" value={answers['24'] || ''} onChange={(e) => handleInputChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block mx-1 ${submitted ? (getAnswerStatus('24') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> at the time of making the film{submitted && (getAnswerStatus('24') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</td><td className="border p-2">No further work needed</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <p className="text-sm text-gray-600 mb-2">What do the speakers say about each of the following films?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-G, next to questions 25-30.</p>
          <div className="border p-4 rounded-md bg-gray-50 mb-4">
            <h5 className="font-bold mb-2">Comments</h5>
            <ul className="list-none space-y-1 text-sm">
                <li><strong>A</strong> clearly shows the historical period</li><li><strong>B</strong> contains only parts of the play</li><li><strong>C</strong> is too similar to another kind of film</li>
                <li><strong>D</strong> turned out to be unpopular with audiences</li><li><strong>E</strong> presents the play in a different period from the original</li><li><strong>F</strong> sets the original in a different country</li><li><strong>G</strong> incorporates a variety of art forms</li>
            </ul>
          </div>
          <div className="space-y-3">
            {[
              { num: '25', label: 'Ran' }, { num: '26', label: 'Much Ado About Nothing' }, { num: '27', label: 'Romeo & Juliet' },
              { num: '28', label: 'Hamlet' }, { num: '29', label: 'Prospero\'s Books' }, { num: '30', label: 'Looking for Richard' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-2">
                <span className="w-48">{num} {label}</span>
                <Input type="text" value={answers[num] || ''} onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${submitted ? (getAnswerStatus(num) === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} maxLength={1} />
                {submitted && (getAnswerStatus(num) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 4 - Questions 31-40</CardTitle>
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD ONLY for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">Noise in Cities</h3>
          <div className="space-y-4">
            <h4 className="font-semibold">Past research focused on noise level (measured in decibels) and people's responses.</h4>
            <h5 className="font-medium">Noise 'maps'</h5>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>show that the highest noise levels are usually found on roads</li>
              <li>do not show other sources of noise, e.g. when windows are open or people's neighbours are in their <span>31</span><Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('31') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('31') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>ignore variations in people's perceptions of noise</li>
              <li>have made people realize that the noise is a <span>32</span><Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('32') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> issue that must be dealt with{submitted && (getAnswerStatus('32') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>
            <h5 className="font-medium">Problems caused by noise</h5>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>sleep disturbance</li><li>increase in amount of stress</li>
              <li>effect on the <span>33</span><Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('33') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> of schoolchildren{submitted && (getAnswerStatus('33') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>
            <h5 className="font-medium">Different types of noise</h5>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Some noises can be considered pleasant e.g. the sound of a <span>34</span><Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('34') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> in a town{submitted && (getAnswerStatus('34') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>To investigate this, researchers may use methods from <span>35</span><Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('35') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> sciences e.g. questionnaires{submitted && (getAnswerStatus('35') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>
            <h5 className="font-medium">What people want</h5>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Plenty of activity in urban environments which are <span>36</span><Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('36') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />, but also allow people to relax{submitted && (getAnswerStatus('36') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>But architects and town planners
                <ul className="list-disc list-inside pl-6">
                  <li>do not get much <span>37</span><Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('37') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> in acoustics{submitted && (getAnswerStatus('37') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                  <li>regard sound as the responsibility of engineers</li>
                </ul>
              </li>
            </ul>
            <h5 className="font-medium">Understanding sound as an art form</h5>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>We need to know
                <ul className="list-disc list-inside pl-6">
                  <li>how sound relates to <span>38</span><Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('38') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('38') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                  <li>what can be learnt from psychology about the effects of sound</li>
                  <li>whether physics can help us understand the <span>39</span><Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('39') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} /> of sound{submitted && (getAnswerStatus('39') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                </ul>
              </li>
              <li>Virtual reality programs
                <ul className="list-disc list-inside pl-6">
                  <li>advantage: predict the effect of buildings</li>
                  <li>current disadvantage: they are <span>40</span><Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${submitted ? (getAnswerStatus('40') === 'correct' ? 'border-green-500' : 'border-red-500') : ''}`} />{submitted && (getAnswerStatus('40') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 12 - Test 8 Listening</h1>
        </div>

        <LocalAudioPlayer audioSrc={AUDIO_URLS.book12.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 12 - Listening Test 8"/>

        <Card className="mb-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent></Card>
        
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map((section) => (<Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {section}</Button>))}</div></div>

        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        <div className="flex gap-4 justify-center mt-8"><Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>

        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/{totalQuestions}</div><div className="text-sm text-gray-600">Raw Score</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-purple-600">{Math.round((score/totalQuestions)*100)}%</div><div className="text-sm text-gray-600">Percentage</div></div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([qNum, correctAns]) => {
                    const isCorrect = checkAnswer(qNum);
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qNum}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm">
                          <div className="mb-1"><span className="text-gray-600">Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qNum] || 'No answer'}</span></div>
                          {!isCorrect && <div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAns}</span></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
      <PageViewTracker 
        book="book-12" 
        module="listening" 
        testNumber={8} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-12" module="listening" testNumber={8} />
          <UserTestHistory book="book-12" module="listening" testNumber={8} />
        </div>
      </div>
    </div>
  );
}