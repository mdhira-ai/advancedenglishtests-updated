// pages/practice-tests-plus-1/listening/test-2.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import IELTSBandDisplay from '@/components/evaluation/IELTSBandDisplay';
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { AUDIO_URLS } from '@/constants/audio';

// Correct answers for IELTS Practice Tests Plus 1 - Listening Test 2
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1
  '1': 'B', '2': 'A', '3': 'B', '4': 'C',
  '5': 'hagerty', '6': 'ricky45', '7': '29 february', '8': 'business',
  '9': 'conversation', '10': 'at school',
  // Section 2
  '11': 'loyal', '12': 'statue', '13': 'count', '14': 'gentle nature',
  '15': 'donations', '16': 'search and rescue', '17': 'international database', '18': 'love their food',
  '19': '80 people', '20': 'in a team',
  // Section 3
  '21': "father's workshop", '22': '1824', '23': 'night writing', '24': 'B',
  '25': 'A', '26': 'C', '27': 'C',
  '28': 'mathematics', '29': 'science', '30': 'music',
  // Section 4
  '31': 'particular events', '32': 'string', '33': '14 days', '34': 'a fortnight',
  '35': 'six months', '36': 'language', '37': 'retrieve', '38': 'an argument',
  '39': '70%', '40': '40%',
};

export default function PracticeTestsPlus1Test2Page() {
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

  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []);

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };
  
  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber];
    const userAnswer = answers[questionNumber] || '';
    if (!userAnswer) return false;
    
    if (typeof correctAnswer === 'string') {
        if (correctAnswer.length === 1 && 'ABC'.includes(correctAnswer.toUpperCase())) {
            return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
        }
        return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
    }
    return false;
  };

  const calculateScore = () => {
    let correctCount = 0;
    for (let i = 1; i <= 40; i++) {
        const qNumStr = String(i);
        if (checkAnswer(qNumStr)) {
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
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      const detailedAnswers = {
        answers,
        results: Object.keys(correctAnswers).map(qNum => ({
          questionNumber: qNum,
          userAnswer: answers[qNum] || '',
          correctAnswer: correctAnswers[qNum],
          isCorrect: checkAnswer(qNum)
        })),
        score: calculatedScore,
        totalQuestions: 40,
        timeTaken
      };
      
      await saveTestScore({
        userId: session?.user?.id || null,
        book:'practice-tests-plus-1',
        module: 'listening',
        testNumber: 2,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined
      });
      
      setSubmitted(true);
      setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestStart = () => setIsTestStarted(true);

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[]) => {
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index);
          const isSelected = answers[questionNumber] === optionLetter.toLowerCase();
          const isCorrectOption = submitted && correctAnswers[questionNumber] === optionLetter;
          
          return (
            <div key={optionLetter} 
                 className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${
                   submitted ? (isCorrectOption ? 'bg-green-100 border-green-500' : (isSelected ? 'bg-red-100 border-red-500' : 'border-gray-200'))
                   : (isSelected ? 'bg-blue-100 border-blue-500' : 'border-gray-200 hover:bg-gray-50')}`}
                 onClick={() => !submitted && handleMultipleChoice(questionNumber, optionLetter.toLowerCase())}>
              <input type="radio" checked={isSelected} readOnly disabled={submitted} className="form-radio" />
              <span className="font-semibold">{optionLetter}</span>
              <span>{option}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 1 - Questions 1-10</h3></div>
      <Card>
        <CardHeader>
          <p className="mb-4">Example</p>
          <div className="mb-6">
            <p className="font-semibold mb-2">Which course is the man interested in?</p>
            {renderMultipleChoiceQuestion('example', ["English", "Mandarin", "Japanese"])}
            <p className="text-sm text-green-600 mt-1 ml-4">Answer: C</p>
          </div>
          <p>Questions 1–4: Circle the correct letters A–C.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { q: '1', question: "What kind of course is the man seeking?", options: ["Daytime", "Evenings", "Weekends"] },
            { q: '2', question: "How long does the man want to study?", options: ["12 weeks", "6 months", "8 months"] },
            { q: '3', question: "What proficiency level is the student?", options: ["Beginner", "Intermediate", "Advanced"] },
            { q: '4', question: "When does the man want to start the course?", options: ["March", "June", "September"] },
          ].map(({ q, question, options }) => (
            <div key={q}>
              <p className="font-semibold">{q}. {question}</p>
              {renderMultipleChoiceQuestion(q, options)}
              {submitted && !checkAnswer(q) && <p className="text-sm text-red-600 mt-1 ml-4">Correct answer: {correctAnswers[q]}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><p>Questions 5–10: Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
        <CardContent className="p-4 border rounded-lg space-y-2 bg-gray-50">
          <h4 className="font-bold text-lg text-center">Language Centre Client Information Card</h4>
          {[
            { q: '5', label: 'Name: Richard' },
            { q: '6', label: 'E-mail address:', suffix: '@hotmail.com' },
            { q: '7', label: 'Date of birth:', suffix: '1980' },
            { q: '8', label: 'Reason for studying Japanese:' },
            { q: '9', label: 'Specific learning needs:' },
            { q: '10', label: 'Place of previous study (if any):' },
          ].map(({ q, label, suffix }) => (
            <div key={q} className="flex items-center">
              <label className="w-2/5 shrink-0">{label}</label>
              <Input className={`${submitted ? (checkAnswer(q) ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers[q] || ''} onChange={e => handleInputChange(q, e.target.value)} disabled={!isTestStarted || submitted} />
              {suffix && <span className="ml-2">{suffix}</span>}
              {submitted && !checkAnswer(q) && <span className="ml-2 text-sm text-red-600">({correctAnswers[q]})</span>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 2 - Questions 11-20</h3></div>
      <Card>
        <CardHeader><p>Questions 11-12: Complete the sentences below. Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
        <CardContent className="space-y-3">
            <div className="flex items-center">11. The story illustrates that dogs are <Input className={`mx-2 ${submitted ? (checkAnswer('11') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['11'] || ''} onChange={e => handleInputChange('11', e.target.value)} disabled={!isTestStarted || submitted}/> animals. {submitted && !checkAnswer('11') && <span className="ml-2 text-sm text-red-600">({correctAnswers['11']})</span>} </div>
            <div className="flex items-center">12. The people of the town built a <Input className={`mx-2 ${submitted ? (checkAnswer('12') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['12'] || ''} onChange={e => handleInputChange('12', e.target.value)} disabled={!isTestStarted || submitted}/> of a dog. {submitted && !checkAnswer('12') && <span className="ml-2 text-sm text-red-600">({correctAnswers['12']})</span>} </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><p>Questions 13-20: Complete the table below. Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
        <CardContent>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="p-2 border">TYPE OF WORKING DOG</th><th className="p-2 border">ESSENTIAL CHARACTERISTICS</th><th className="p-2 border">ADDITIONAL INFORMATION</th></tr></thead>
            <tbody>
              <tr><td className="p-2 border">Sheep dogs</td><td className="p-2 border">Smart, obedient</td><td className="p-2 border">Herd sheep and <Input className={`${submitted ? (checkAnswer('13') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['13'] || ''} onChange={e => handleInputChange('13', e.target.value)} disabled={!isTestStarted || submitted}/> them {submitted && !checkAnswer('13') && <span className="ml-1 text-sm text-red-600">({correctAnswers['13']})</span>}</td></tr>
              <tr><td className="p-2 border">Guide dogs</td><td className="p-2 border">Confident and <Input className={`${submitted ? (checkAnswer('14') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['14'] || ''} onChange={e => handleInputChange('14', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && !checkAnswer('14') && <span className="ml-1 text-sm text-red-600">({correctAnswers['14']})</span>}</td><td className="p-2 border">Training paid for by <Input className={`${submitted ? (checkAnswer('15') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['15'] || ''} onChange={e => handleInputChange('15', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && !checkAnswer('15') && <span className="ml-1 text-sm text-red-600">({correctAnswers['15']})</span>}</td></tr>
              <tr><td className="p-2 border">Guard dogs and <Input className={`${submitted ? (checkAnswer('16') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || submitted}/> dogs {submitted && !checkAnswer('16') && <span className="ml-1 text-sm text-red-600">({correctAnswers['16']})</span>}</td><td className="p-2 border">Tough and courageous</td><td className="p-2 border">Dogs and trainers available through <Input className={`${submitted ? (checkAnswer('17') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && !checkAnswer('17') && <span className="ml-1 text-sm text-red-600">({correctAnswers['17']})</span>}</td></tr>
              <tr><td className="p-2 border">Detector dogs</td><td className="p-2 border">Need to really <Input className={`${submitted ? (checkAnswer('18') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && !checkAnswer('18') && <span className="ml-1 text-sm text-red-600">({correctAnswers['18']})</span>}</td><td className="p-2 border">In Sydney they catch <Input className={`${submitted ? (checkAnswer('19') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || submitted}/> a month {submitted && !checkAnswer('19') && <span className="ml-1 text-sm text-red-600">({correctAnswers['19']})</span>}</td></tr>
              <tr><td className="p-2 border">Transport dogs</td><td className="p-2 border">Happy working <Input className={`${submitted ? (checkAnswer('20') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && !checkAnswer('20') && <span className="ml-1 text-sm text-red-600">({correctAnswers['20']})</span>}</td><td className="p-2 border">International treaty bans huskies from Antarctica</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 3 - Questions 21-30</h3></div>
      <Card>
        <CardHeader><p>Questions 21–23: Complete the notes below. Write <strong>NO MORE THAN THREE WORDS or A NUMBER</strong> for each answer.</p></CardHeader>
        <CardContent className="space-y-3">
          <h4 className="font-bold">Braille – a system of writing for the blind</h4>
          <ul>
            <li className="flex items-center">Louis Braille was blinded as a child in his <Input className={`w-32 mx-2 ${submitted ? (checkAnswer('21') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['21'] || ''} onChange={e => handleInputChange('21', e.target.value)} disabled={!isTestStarted || submitted}/>. {submitted && !checkAnswer('21') && <span className="ml-2 text-sm text-red-600">({correctAnswers['21']})</span>}</li>
            <li className="flex items-center">Braille invented the writing system in the year <Input className={`w-32 mx-2 ${submitted ? (checkAnswer('22') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['22'] || ''} onChange={e => handleInputChange('22', e.target.value)} disabled={!isTestStarted || submitted}/>. {submitted && !checkAnswer('22') && <span className="ml-2 text-sm text-red-600">({correctAnswers['22']})</span>}</li>
            <li className="flex items-center">A military system using dots was called <Input className={`w-32 mx-2 ${submitted ? (checkAnswer('23') ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers['23'] || ''} onChange={e => handleInputChange('23', e.target.value)} disabled={!isTestStarted || submitted}/>. {submitted && !checkAnswer('23') && <span className="ml-2 text-sm text-red-600">({correctAnswers['23']})</span>}</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><p>Questions 24–27: Circle the correct letters A–C.</p></CardHeader>
        <CardContent className="space-y-4">
            {[
                { q: '24', question: "Which diagram shows the Braille positions?", options: ["Diagram A", "Diagram B", "Diagram C"] },
                { q: '25', question: "What can the combined dots represent?", options: ["both letters and words", "only individual words", "only letters of the alphabet"] },
                { q: '26', question: "When was the Braille system officially adopted?", options: ["as soon as it was invented", "two years after it was invented", "after Louis Braille had died"] },
                { q: '27', question: "What is unusual about the way Braille is written?", options: ["It can only be written using a machine.", "The texts have to be read backwards.", "Handwritten Braille is created in reverse."] },
            ].map(({ q, question, options }) => (
                <div key={q}>
                <p className="font-semibold">{q}. {question}</p>
                {renderMultipleChoiceQuestion(q, options)}
                {submitted && !checkAnswer(q) && <p className="text-sm text-red-600 mt-1 ml-4">Correct answer: {correctAnswers[q]}</p>}
                </div>
            ))}
        </CardContent>
      </Card>
      <Card>
          <CardHeader><p>Questions 28-30: List THREE subjects that also use a Braille code. Write <strong>NO MORE THAN ONE WORD</strong> for each answer.</p></CardHeader>
          <CardContent className="space-y-2">
            {[28, 29, 30].map(q => (
                <div key={q} className="flex items-center">
                    <span className="w-8">{q}.</span>
                    <Input className={`${submitted ? (checkAnswer(String(q)) ? 'bg-green-100' : 'bg-red-100') : ''}`} value={answers[String(q)] || ''} onChange={e => handleInputChange(String(q), e.target.value)} disabled={!isTestStarted || submitted}/>
                    {submitted && !checkAnswer(String(q)) && <span className="ml-2 text-sm text-red-600">({correctAnswers[String(q)]})</span>}
                </div>
            ))}
          </CardContent>
      </Card>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-semibold text-blue-800">SECTION 4 - Questions 31-40</h3></div>
        <Card>
            <CardHeader>
                <p><em>Complete the notes below.</em></p>
                <p><em>Write <strong>NO MORE THAN THREE WORDS or A NUMBER</strong> for each answer.</em></p>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="flex items-center">
                    Question: Can babies remember any 
                    <Input className={`inline-block w-40 mx-2 ${submitted ? (checkAnswer('31') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                           value={answers['31'] || ''} 
                           onChange={e => handleInputChange('31', e.target.value)} 
                           disabled={!isTestStarted || submitted}
                           placeholder="31"/>?
                    {submitted && !checkAnswer('31') && <span className="ml-2 text-sm text-red-600">({correctAnswers['31']})</span>}
                </p>
                
                <div className="border p-4 rounded bg-gray-50">
                    <h4 className="font-semibold italic mb-3">Experiment with babies:</h4>
                    <div className="space-y-2">
                        <p>Apparatus: baby in cot</p>
                        <p className="ml-16">colourful mobile</p>
                        <p className="flex items-center ml-16">
                            some 
                            <Input className={`inline-block w-32 mx-2 ${submitted ? (checkAnswer('32') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                   value={answers['32'] || ''} 
                                   onChange={e => handleInputChange('32', e.target.value)} 
                                   disabled={!isTestStarted || submitted}
                                   placeholder="32"/>
                            {submitted && !checkAnswer('32') && <span className="ml-2 text-sm text-red-600">({correctAnswers['32']})</span>}
                        </p>
                        <p className="flex items-center">
                            Re-introduce mobile between one and 
                            <Input className={`inline-block w-32 mx-2 ${submitted ? (checkAnswer('33') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                   value={answers['33'] || ''} 
                                   onChange={e => handleInputChange('33', e.target.value)} 
                                   disabled={!isTestStarted || submitted}
                                   placeholder="33"/> later.
                            {submitted && !checkAnswer('33') && <span className="ml-2 text-sm text-red-600">({correctAnswers['33']})</span>}
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="font-semibold text-center mb-4">Table showing memory test results</h4>
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Baby's age</th>
                                <th className="border border-gray-300 p-2 text-left">Maximum memory span</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">2 months</td>
                                <td className="border border-gray-300 p-2">2 days</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">3 months</td>
                                <td className="border border-gray-300 p-2 flex items-center">
                                    <Input className={`w-20 mr-2 ${submitted ? (checkAnswer('34') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                           value={answers['34'] || ''} 
                                           onChange={e => handleInputChange('34', e.target.value)} 
                                           disabled={!isTestStarted || submitted}
                                           placeholder="34"/>
                                    {submitted && !checkAnswer('34') && <span className="ml-2 text-sm text-red-600">({correctAnswers['34']})</span>}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">21 months</td>
                                <td className="border border-gray-300 p-2">several weeks</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">2 years</td>
                                <td className="border border-gray-300 p-2 flex items-center">
                                    <Input className={`w-20 mr-2 ${submitted ? (checkAnswer('35') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                           value={answers['35'] || ''} 
                                           onChange={e => handleInputChange('35', e.target.value)} 
                                           disabled={!isTestStarted || submitted}
                                           placeholder="35"/>
                                    {submitted && !checkAnswer('35') && <span className="ml-2 text-sm text-red-600">({correctAnswers['35']})</span>}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 space-y-4">
                    <h4 className="font-semibold italic">Questions 36-40</h4>
                    <p className="flex items-center">
                        <em>Research questions:</em> Is memory linked to 
                        <Input className={`inline-block w-32 mx-2 ${submitted ? (checkAnswer('36') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                               value={answers['36'] || ''} 
                               onChange={e => handleInputChange('36', e.target.value)} 
                               disabled={!isTestStarted || submitted}
                               placeholder="36"/> development?
                        {submitted && !checkAnswer('36') && <span className="ml-2 text-sm text-red-600">({correctAnswers['36']})</span>}
                    </p>
                    
                    <p className="flex items-center ml-16">
                        Can babies 
                        <Input className={`inline-block w-32 mx-2 ${submitted ? (checkAnswer('37') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                               value={answers['37'] || ''} 
                               onChange={e => handleInputChange('37', e.target.value)} 
                               disabled={!isTestStarted || submitted}
                               placeholder="37"/> their memories?
                        {submitted && !checkAnswer('37') && <span className="ml-2 text-sm text-red-600">({correctAnswers['37']})</span>}
                    </p>
                </div>

                <div className="border p-4 rounded bg-gray-50 mt-6">
                    <h4 className="font-semibold italic mb-3">Experiment with older children:</h4>
                    <div className="space-y-2">
                        <p>Stages in incident: a) lecture taking place</p>
                        <p className="ml-16">b) object falls over</p>
                        <p className="flex items-center ml-16">
                            c) 
                            <Input className={`inline-block w-32 mx-2 ${submitted ? (checkAnswer('38') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                   value={answers['38'] || ''} 
                                   onChange={e => handleInputChange('38', e.target.value)} 
                                   disabled={!isTestStarted || submitted}
                                   placeholder="38"/>
                            {submitted && !checkAnswer('38') && <span className="ml-2 text-sm text-red-600">({correctAnswers['38']})</span>}
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="font-semibold text-center mb-4">Table showing memory test results</h4>
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Age</th>
                                <th className="border border-gray-300 p-2 text-left">% remembered next day</th>
                                <th className="border border-gray-300 p-2 text-left">% remembered after 5 months</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">Adults</td>
                                <td className="border border-gray-300 p-2">70%</td>
                                <td className="border border-gray-300 p-2 flex items-center">
                                    <Input className={`w-20 mr-2 ${submitted ? (checkAnswer('39') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                           value={answers['39'] || ''} 
                                           onChange={e => handleInputChange('39', e.target.value)} 
                                           disabled={!isTestStarted || submitted}
                                           placeholder="39"/>
                                    {submitted && !checkAnswer('39') && <span className="ml-2 text-sm text-red-600">({correctAnswers['39']})</span>}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">9-year-olds</td>
                                <td className="border border-gray-300 p-2">70%</td>
                                <td className="border border-gray-300 p-2">Less than 60%</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">6-year-olds</td>
                                <td className="border border-gray-300 p-2">Just under 70%</td>
                                <td className="border border-gray-300 p-2 flex items-center">
                                    <Input className={`w-20 mr-2 ${submitted ? (checkAnswer('40') ? 'bg-green-100' : 'bg-red-100') : ''}`} 
                                           value={answers['40'] || ''} 
                                           onChange={e => handleInputChange('40', e.target.value)} 
                                           disabled={!isTestStarted || submitted}
                                           placeholder="40"/>
                                    {submitted && !checkAnswer('40') && <span className="ml-2 text-sm text-red-600">({correctAnswers['40']})</span>}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
  
  const renderResults = () => (
    <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
          <div className="flex justify-center items-center space-x-8 mb-4">
            <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Raw Score</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 40 }, (_, i) => String(i + 1)).map((qKey) => {
              const isCorrect = checkAnswer(qKey);
              return (
                <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qKey}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                  <div className="text-sm">
                    <div className="mb-1">Your: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qKey] || 'No answer'}</span></div>
                    <div>Correct: <span className="text-green-700 font-medium">{correctAnswers[qKey]}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="practice-tests-plus-1" module="listening" testNumber={2} />
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listening Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-800 mb-4">IELTS Practice Tests Plus 1 - Listening Test 2</h1></div>
        </div>

        <LocalAudioPlayer audioSrc={AUDIO_URLS.plus1.test2} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Practice Tests Plus 1 - Listening Test 2" />

        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((section) => <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || submitted}>Section {section}</Button>)}
          </div>
        </div>

        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        
        {!submitted && <div className="mt-8 text-center"><Button onClick={handleSubmit} size="lg" className="px-8" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>}
        
        {showResultsPopup && renderResults()}

        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics book="practice-tests-plus-1" module="listening" testNumber={2} />
          <UserTestHistory book="practice-tests-plus-1" module="listening" testNumber={2} />
        </div>
      </div>
    </div>
  );
}