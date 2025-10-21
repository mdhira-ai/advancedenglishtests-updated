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

// Correct answers for Cambridge 12, Listening Test 7
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'travel/travelling',
  '2': 'history',
  '3': 'study',
  '4': 'teenagers',
  '5': 'kitchen',
  '6': 'crime',
  '7': 'appointment/booking',
  '8': 'sugar',
  '9': 'stamps',
  '10': 'parking',

  // Section 2: Questions 11-20
  '11&12': ['D', 'E'],
  '13&14': ['A', 'C'],
  '15': 'C',
  '16': 'B',
  '17': 'A',
  '18': 'stress',
  '19': 'weight',
  '20': 'families',

  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'E',
  '23': 'H',
  '24': 'B',
  '25': 'A',
  '26': 'F',
  '27': 'A',
  '28': 'C',
  '29': 'B',
  '30': 'B',

  // Section 4: Questions 31-40
  '31': 'insects',
  '32': 'behaviour/behavior',
  '33': 'father',
  '34': 'complex/complicated',
  '35': 'reproduction/breeding',
  '36': 'control',
  '37': 'duck(s)',
  '38': 'language',
  '39': 'food',
  '40': 'cost(s)/price(s)/bill(s)',
};

export default function Test7Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({});
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
  
  const handleMultipleCheckboxChange = (questionKey: string, value: string) => {
    setMultipleAnswers(prev => {
      const currentSelection = prev[questionKey] || [];
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(item => item !== value)
        : [...currentSelection, value];
      return { ...prev, [questionKey]: newSelection };
    });
  };

  const checkAnswer = (questionNumber: string): boolean | number => {
    const correctAnswer = correctAnswers[questionNumber];
    
    if (Array.isArray(correctAnswer)) { // For multiple checkbox questions
      const userSelection = multipleAnswers[questionNumber] || [];
      let correctCount = 0;
      userSelection.forEach(selection => {
        if (correctAnswer.includes(selection)) {
          correctCount++;
        }
      });
      return correctCount; // Returns number of correct selections
    } else { // For single answer questions
      const userAnswer = answers[questionNumber]?.trim() || '';
      if (!userAnswer) return false;
      if (/^[A-I]$/.test(correctAnswer as string)) {
        return userAnswer.toUpperCase() === (correctAnswer as string).toUpperCase();
      }
      return checkAnswerWithMatching(userAnswer, correctAnswer as string, questionNumber);
    }
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    for (const questionNumber in correctAnswers) {
      const result = checkAnswer(questionNumber);
      if (typeof result === 'number') {
        correctCount += result;
      } else if (result === true) {
        correctCount++;
      }
    }
    return correctCount;
  };

  const getTotalQuestions = () => {
    let total = 0;
    for (const key in correctAnswers) {
      const value = correctAnswers[key];
      if (Array.isArray(value)) {
        total += value.length;
      } else {
        total++;
      }
    }
    return total;
  };
  
  const totalQuestions = getTotalQuestions();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      const detailedAnswers = {
        singleAnswers: answers,
        multipleAnswers: multipleAnswers,
        results: Object.keys(correctAnswers).map(qNum => {
          if (Array.isArray(correctAnswers[qNum])) {
             return { 
                questionNumber: qNum,
                userAnswer: multipleAnswers[qNum] || [],
                correctAnswer: correctAnswers[qNum],
                isCorrect: (checkAnswer(qNum) as number) === (correctAnswers[qNum] as string[]).length
             }
          }
          return {
            questionNumber: qNum,
            userAnswer: answers[qNum] || '',
            correctAnswer: correctAnswers[qNum],
            isCorrect: checkAnswer(qNum) === true
          }
        }),
        score: calculatedScore,
        totalQuestions,
        percentage: Math.round((calculatedScore / totalQuestions) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-12',
        module: 'listening',
        testNumber: 7,
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
    const result = checkAnswer(questionNumber);
    if (Array.isArray(correctAnswers[questionNumber])) {
      return (result as number) === (correctAnswers[questionNumber] as string[]).length ? 'correct' : 'incorrect';
    }
    return result ? 'correct' : 'incorrect';
  };

  // Helper function to get input border color classes
  const getInputBorderClass = (questionNumber: string) => {
    if (!submitted) return '';
    const status = getAnswerStatus(questionNumber);
    return status === 'correct' ? 'border-green-500' : 'border-red-500';
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

  const renderMultipleCheckboxQuestion = (qKey: string, options: string[], numChoices: number) => (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const val = String.fromCharCode(65 + i);
        return (
          <label key={val} className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" value={val} checked={(multipleAnswers[qKey] || []).includes(val)} onChange={() => handleMultipleCheckboxChange(qKey, val)} disabled={!isTestStarted || isSubmitting || ((multipleAnswers[qKey]?.length || 0) >= numChoices && !multipleAnswers[qKey]?.includes(val))} className="w-4 h-4"/>
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
        <p className="text-sm font-semibold">Write ONE WORD ONLY for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">PUBLIC LIBRARY</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2"><strong>Example:</strong> The library re-opened last <span className="underline">month</span></div>
              
              <h4 className="font-semibold">The library now has</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>a seating area with magazines</li>
                <li>an expanded section for books on <span>1</span><Input type="text" value={answers['1'] || ''} onChange={(e) => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('1')}`} />{submitted && (getAnswerStatus('1') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>a new section on local <span>2</span><Input type="text" value={answers['2'] || ''} onChange={(e) => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('2')}`} />{submitted && (getAnswerStatus('2') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>a community room for meetings (also possible to <span>3</span><Input type="text" value={answers['3'] || ''} onChange={(e) => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('3')}`} /> there){submitted && (getAnswerStatus('3') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>a new section of books for <span>4</span><Input type="text" value={answers['4'] || ''} onChange={(e) => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('4')}`} />{submitted && (getAnswerStatus('4') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              </ul>

              <h4 className="font-semibold">For younger children</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>the next Science Club meeting: experiments using things from your <span>5</span><Input type="text" value={answers['5'] || ''} onChange={(e) => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('5')}`} />{submitted && (getAnswerStatus('5') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>Reading Challenge: read six books during the holidays</li>
              </ul>
              
              <h4 className="font-semibold">For adults</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>this Friday: a local author talks about a novel based on a real <span>6</span><Input type="text" value={answers['6'] || ''} onChange={(e) => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('6')}`} />{submitted && (getAnswerStatus('6') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>IT support is available on Tuesdays – no <span>7</span><Input type="text" value={answers['7'] || ''} onChange={(e) => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('7')}`} /> is necessary{submitted && (getAnswerStatus('7') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>free check of blood <span>8</span><Input type="text" value={answers['8'] || ''} onChange={(e) => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('8')}`} /> and cholesterol levels (over 60s only){submitted && (getAnswerStatus('8') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              </ul>
              
              <h4 className="font-semibold">Other information</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>the library shop sells wall-charts, cards and <span>9</span><Input type="text" value={answers['9'] || ''} onChange={(e) => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('9')}`} />{submitted && (getAnswerStatus('9') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                <li>evenings and weekends: free <span>10</span><Input type="text" value={answers['10'] || ''} onChange={(e) => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('10')}`} /> is available{submitted && (getAnswerStatus('10') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
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
          <h4 className="font-semibold mb-2">Questions 11 and 12</h4>
          <p className="text-sm font-semibold mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-2">Which TWO age groups are taking increasing numbers of holidays with BC Travel?</p>
          <div className={`${getAnswerStatus('11&12') === 'correct' ? 'bg-green-50' : getAnswerStatus('11&12') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
            {renderMultipleCheckboxQuestion('11&12', ['16-30 years', '31-42 years', '43-54 years', '55-64 years', 'over 65 years'], 2)}
            {submitted && <div className="mt-2 text-sm text-gray-600">Correct answers: { (correctAnswers['11&12'] as string[]).join(', ')}</div>}
          </div>
        </div>
        
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 13 and 14</h4>
          <p className="text-sm font-semibold mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-2">Which TWO are the main reasons given for the popularity of activity holidays?</p>
          <div className={`${getAnswerStatus('13&14') === 'correct' ? 'bg-green-50' : getAnswerStatus('13&14') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
            {renderMultipleCheckboxQuestion('13&14', ['Clients make new friends.', 'Clients learn a useful skill.', 'Clients learn about a different culture.', 'Clients are excited by the risk involved.', 'Clients find them good value for money.'], 2)}
            {submitted && <div className="mt-2 text-sm text-gray-600">Correct answers: { (correctAnswers['13&14'] as string[]).join(', ')}</div>}
          </div>
        </div>

        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 15-17</h4>
          <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
            {[
              { q: '15', question: "How does BC Travel plan to expand the painting holidays?", options: ['by adding to the number of locations', 'by increasing the range of levels', 'by employing more teachers'] },
              { q: '16', question: "Why are BC Travel's cooking holidays unusual?", options: ['They only use organic foods.', 'They have an international focus.', 'They mainly involve vegetarian dishes.'] },
              { q: '17', question: "What does the speaker say about the photography holidays?", options: ['Clients receive individual tuition.', 'The tutors are also trained guides.', 'Advice is given on selling photographs.'] },
            ].map(({ q, question, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {question}</p>
                <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {renderMultipleChoiceQuestion(q, options)}
                  {submitted && <div className="mt-2 text-sm text-gray-600">Correct answer: {correctAnswers[q]}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Questions 18-20</h4>
          <p className="text-sm text-gray-600 mb-2">Complete the table below.</p>
          <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
          <h3 className="font-bold text-lg text-center mb-4">Fitness Holidays</h3>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-200">
                <th className="border p-2">Location</th><th className="border p-2">Main focus</th><th className="border p-2">Other comments</th>
            </tr></thead>
            <tbody>
              <tr>
                <td className="border p-2">Ireland and Italy</td><td className="border p-2">general fitness</td><td className="border p-2">
                  <ul className="list-disc list-inside">
                    <li>personally designed programme</li>
                    <li>also reduces <span>18</span><Input type="text" value={answers['18'] || ''} onChange={(e) => handleInputChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('18')}`} />{submitted && (getAnswerStatus('18') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td className="border p-2">Greece</td><td className="border p-2"><span>19</span><Input type="text" value={answers['19'] || ''} onChange={(e) => handleInputChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block mr-2 ${getInputBorderClass('19')}`} /> control{submitted && (getAnswerStatus('19') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</td><td className="border p-2">includes exercise on the beach</td>
              </tr>
              <tr>
                <td className="border p-2">Morocco</td><td className="border p-2">mountain biking</td><td className="border p-2">
                  <ul className="list-disc list-inside">
                    <li>wide variety of levels</li>
                    <li>one holiday that is specially designed for <span>20</span><Input type="text" value={answers['20'] || ''} onChange={(e) => handleInputChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('20')}`} />{submitted && (getAnswerStatus('20') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 21-26</h4>
          <p className="text-sm text-gray-600 mb-2">Complete the flow-chart below.</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 21-26.</p>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="border p-4 rounded-md bg-gray-50 flex-shrink-0">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <li><strong>A</strong> patterns</li><li><strong>B</strong> names</li><li><strong>C</strong> sources</li><li><strong>D</strong> questions</li>
                <li><strong>E</strong> employees</li><li><strong>F</strong> solutions</li><li><strong>G</strong> headings</li><li><strong>H</strong> officials</li>
              </ul>
            </div>
            <div className="flex-grow space-y-2">
              <div className="border p-3 rounded-md">
                  <h5 className="font-bold text-center">STAGES IN DOING A TOURISM CASE STUDY</h5>
                  <h6 className="font-semibold mt-2">RESEARCH</h6>
                  <p>Locate and read relevant articles, noting key information and also <span>21</span><Input type="text" value={answers['21'] || ''} onChange={(e) => handleInputChange('21', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getInputBorderClass('21')}`} maxLength={1} />.{submitted && (getAnswerStatus('21') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</p>
                  <p>Identify a problem or need</p>
                  <p>Select interviewees – these may be site <span>22</span><Input type="text" value={answers['22'] || ''} onChange={(e) => handleInputChange('22', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getInputBorderClass('22')}`} maxLength={1} />, visitors or city <span>23</span><Input type="text" value={answers['23'] || ''} onChange={(e) => handleInputChange('23', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getInputBorderClass('23')}`} maxLength={1} />.{submitted && (getAnswerStatus('22') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)} {submitted && (getAnswerStatus('23') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</p>
                  <p>Prepare and carry out interviews. If possible, collect statistics.</p>
                  <p>Check whether <span>24</span><Input type="text" value={answers['24'] || ''} onChange={(e) => handleInputChange('24', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getInputBorderClass('24')}`} maxLength={1} /> of interviewees can be used.{submitted && (getAnswerStatus('24') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</p>
                  <div className="text-center my-1">↓</div>
                  <h6 className="font-semibold">ANALYSIS</h6>
                  <p>Select relevant information and try to identify <span>25</span><Input type="text" value={answers['25'] || ''} onChange={(e) => handleInputChange('25', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getInputBorderClass('25')}`} maxLength={1} />.{submitted && (getAnswerStatus('25') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</p>
                  <p>Decide on the best form of visuals</p>
                  <div className="text-center my-1">↓</div>
                  <h6 className="font-semibold">WRITING THE CASE STUDY</h6>
                  <p>Give some background before writing the main sections</p>
                  <p>Do NOT end with <span>26</span><Input type="text" value={answers['26'] || ''} onChange={(e) => handleInputChange('26', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getInputBorderClass('26')}`} maxLength={1} />.{submitted && (getAnswerStatus('26') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Questions 27-30</h4>
          <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold text-lg mb-4">The Horton Castle site</h3>
          <div className="space-y-6">
            {[
              { q: '27', question: "Natalie and Dave agree one reason why so few people visit Horton Castle is that", options: ['the publicity is poor.', 'it is difficult to get to.', 'there is little there of interest.'] },
              { q: '28', question: "Natalie and Dave agree that the greatest problem with a visitor centre could be", options: ['covering the investment costs.', 'finding a big enough space for it.', 'dealing with planning restrictions.'] },
              { q: '29', question: "What does Dave say about conditions in the town of Horton?", options: ['There is a lot of unemployment.', 'There are few people of working age.', 'There are opportunities for skilled workers.'] },
              { q: '30', question: "According to Natalie, one way to prevent damage to the castle site would be to", options: ['insist visitors have a guide.', 'make visitors keep to the paths.', 'limit visitor numbers.'] },
            ].map(({ q, question, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {question}</p>
                <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {renderMultipleChoiceQuestion(q, options)}
                  {submitted && <div className="mt-2 text-sm text-gray-600">Correct answer: {correctAnswers[q]}</div>}
                </div>
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
          <h3 className="font-bold text-center text-lg mb-4">The effects of environmental change on birds</h3>
          <div className="space-y-4">
            <h4 className="font-semibold">Mercury (Hg)</h4>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Highly toxic</li>
              <li>Released into the atmosphere from coal</li>
              <li>In water it may be consumed by fish</li>
              <li>It has also recently been found to affect birds which feed on <span>31</span><Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('31')}`} />{submitted && (getAnswerStatus('31') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>

            <h4 className="font-semibold">Research on effects of mercury on birds</h4>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Claire Varian-Ramos is investigating:
                <ul className="list-disc list-inside pl-6">
                  <li>the effects on birds' <span>32</span><Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('32')}`} /> or mental processes, e.g. memory{submitted && (getAnswerStatus('32') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                  <li>the effects on bird song (usually learned from a bird's <span>33</span><Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('33')}`} />){submitted && (getAnswerStatus('33') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                </ul>
              </li>
              <li>Findings:
                <ul className="list-disc list-inside pl-6">
                  <li>songs learned by birds exposed to mercury are less <span>34</span><Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('34')}`} />{submitted && (getAnswerStatus('34') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                  <li>this may have a negative effect on birds' <span>35</span><Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('35')}`} />{submitted && (getAnswerStatus('35') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                </ul>
              </li>
              <li>Lab-based studies:
                <ul className="list-disc list-inside pl-6">
                  <li>allow more <span>36</span><Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('36')}`} /> for the experimenter{submitted && (getAnswerStatus('36') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
                </ul>
              </li>
            </ul>

            <h4 className="font-semibold">Implications for humans</h4>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Migrating birds such as <span>37</span><Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('37')}`} /> containing mercury may be eaten by humans{submitted && (getAnswerStatus('37') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Mercury also causes problems in learning <span>38</span><Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('38')}`} />{submitted && (getAnswerStatus('38') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Mercury in a mother's body from <span>39</span><Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('39')}`} /> may affect the unborn child{submitted && (getAnswerStatus('39') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>New regulations for mercury emissions will affect everyone's energy <span>40</span><Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getInputBorderClass('40')}`} />{submitted && (getAnswerStatus('40') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
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
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 12 - Test 7 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book12.test3}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 12 - Listening Test 7"
        />

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(correctAnswers).map(([qNum, correctAns]) => {
                    const isMultiple = Array.isArray(correctAns);
                    const isCorrect = isMultiple 
                        ? (checkAnswer(qNum) as number) === correctAns.length 
                        : checkAnswer(qNum) === true;
                    const userAnswer = isMultiple ? multipleAnswers[qNum] || [] : answers[qNum] || '';

                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qNum}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm">
                          <div className="mb-1"><span className="text-gray-600">Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{Array.isArray(userAnswer) ? (userAnswer.join(', ') || 'No answer') : (userAnswer || 'No answer')}</span></div>
                          {!isCorrect && <div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{Array.isArray(correctAns) ? correctAns.join(', ') : correctAns}</span></div>}
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
        testNumber={7} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-12" module="listening" testNumber={7} />
          <UserTestHistory book="book-12" module="listening" testNumber={7} />
        </div>
      </div>
    </div>
  );
}
