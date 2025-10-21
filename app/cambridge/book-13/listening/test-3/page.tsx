'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { AUDIO_URLS } from '@/constants/audio';
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';

// Correct answers for Cambridge IELTS 13, Listening Test 3
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': '850',
  '2': 'bike/bicycle',
  '3': 'parking',
  '4': '30/thirty',
  '5': 'weekend(s)',
  '6': 'cinema',
  '7': 'hospital',
  '8': 'dentist',
  '9': 'Thursday',
  '10': 'café/cafe',
  
  // Section 2: Questions 11-20
  '11': 'F',
  '12': 'D',
  '13': 'A',
  '14': 'B',
  '15': 'C',
  '16': 'G',
  '17&18': ['B', 'C'], // Multi-select question
  '19&20': ['B', 'D'], // Multi-select question
  
  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'A',
  '23': 'A',
  '24': 'B',
  '25': 'C',
  '26': 'F',
  '27': 'H',
  '28': 'D',
  '29': 'A',
  '30': 'E',
  
  // Section 4: Questions 31-40
  '31': 'tongue(s)',
  '32': 'plants',
  '33': 'snakes',
  '34': 'sky',
  '35': 'partner(s)',
  '36': 'contact',
  '37': 'protection',
  '38': 'tail(s)',
  '39': 'steps',
  '40': 'injury/injuries'
};

export default function Cambridge13Test3Listening() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '17&18': [],
    '19&20': [],
  });
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

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };
  
  const handleMultiSelect = (questionKey: string, value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const isSelected = currentAnswers.includes(value);
        const maxSelections = 2;

        if (isSelected) {
            return { ...prev, [questionKey]: currentAnswers.filter(ans => ans !== value) };
        } else if (currentAnswers.length < maxSelections) {
            return { ...prev, [questionKey]: [...currentAnswers, value] };
        }
        return prev;
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Handle single-answer questions
    for (let i = 1; i <= 40; i++) {
        const qNumStr = String(i);
        if (qNumStr === '17' || qNumStr === '18' || qNumStr === '19' || qNumStr === '20') continue;

        if (answers[qNumStr] !== undefined && correctAnswers[qNumStr] !== undefined) {
          if (checkAnswerWithMatching(answers[qNumStr], correctAnswers[qNumStr] as string, qNumStr)) {
            correctCount++;
          }
        }
    }

    // Handle multi-select questions
    const multiSelectKeys = ['17&18', '19&20'];
    multiSelectKeys.forEach(key => {
        const userChoices = multipleAnswers[key] || [];
        const correctChoices = correctAnswers[key] as string[];
        userChoices.forEach(choice => {
            if (correctChoices.includes(choice)) {
                correctCount++;
            }
        });
    });

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
        singleAnswers: answers,
        multipleAnswers: multipleAnswers || {},
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-13',
        module: 'listening',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
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
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestStart = () => setIsTestStarted(true);
  
  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    const userAnswer = answers[questionNumber];
    const correctAnswer = correctAnswers[questionNumber] as string;
    if (userAnswer === undefined || correctAnswer === undefined) return 'incorrect';
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber) ? 'correct' : 'incorrect';
  };
  
  const getMultiSelectStatus = (questionKey: string) => {
      if (!submitted) return 'default';
      const userChoices = multipleAnswers[questionKey] || [];
      const correctChoices = correctAnswers[questionKey] as string[];
      const correctCount = userChoices.filter(c => correctChoices.includes(c)).length;
      
      if (correctCount === correctChoices.length && userChoices.length === correctChoices.length) return 'correct';
      if (correctCount > 0) return 'partial';
      return 'incorrect';
  };

  const inputClass = (qNum: string) => `w-32 ${getAnswerStatus(qNum) === 'correct' ? 'border-green-500' : getAnswerStatus(qNum) === 'incorrect' ? 'border-red-500' : ''}`;
  const disabledState = !isTestStarted || isSubmitting;

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg space-y-4">
        <h3 className="font-bold text-center text-lg mb-4">Moving to Banford City</h3>
        <p>Example: Linda recommends living in suburb of: <span className="underline font-medium">Dalton</span></p>
        <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Accommodation
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li className="flex items-center gap-2">Average rent: £<Input id="1" className={inputClass('1')} value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={disabledState} /> a month</li>
                </ul>
            </li>
            <li>Transport
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li className="flex items-center gap-2">Linda travels to work by <Input id="2" className={inputClass('2')} value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={disabledState} /></li>
                    <li className="flex items-center gap-2">Limited <Input id="3" className={inputClass('3')} value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={disabledState} /> in city centre</li>
                    <li className="flex items-center gap-2">Trains to London every <Input id="4" className={inputClass('4')} value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={disabledState} /> minutes</li>
                    <li className="flex items-center gap-2">Poor train service at <Input id="5" className={inputClass('5')} value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={disabledState} /></li>
                </ul>
            </li>
            <li>Advantages of living in Banford
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li className="flex items-center gap-2">New <Input id="6" className={inputClass('6')} value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={disabledState} /> opened recently</li>
                    <li className="flex items-center gap-2"><Input id="7" className={inputClass('7')} value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={disabledState} /> has excellent reputation</li>
                    <li className="flex items-center gap-2">Good <Input id="8" className={inputClass('8')} value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={disabledState} /> on Bridge Street</li>
                </ul>
            </li>
             <li>Meet Linda
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li className="flex items-center gap-2">Meet Linda on <Input id="9" className={inputClass('9')} value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={disabledState} /> after 5.30 pm</li>
                    <li className="flex items-center gap-2">In the <Input id="10" className={inputClass('10')} value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={disabledState} /> opposite the station</li>
                </ul>
            </li>
        </ul>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 11-16</h4>
            <p className="text-sm font-semibold mb-4">What advantage does the speaker mention for each of the following physical activities? Choose SIX answers from the box and write the correct letter, A–G, next to Questions 11–16.</p>
            <div className="border p-4 rounded mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50">
              {['A: not dependent on season', 'B: enjoyable', 'C: low risk of injury', 'D: fitness level unimportant', 'E: sociable', 'F: fast results', 'G: motivating'].map(opt => <div key={opt}>{opt}</div>)}
            </div>
            <p><b>Physical activities:</b></p>
            <div className="space-y-3">
              {[11, 12, 13, 14, 15, 16].map(q => {
                  const labels: { [key: number]: string } = { 11: 'using a gym', 12: 'running', 13: 'swimming', 14: 'cycling', 15: 'doing yoga', 16: 'training with a personal trainer' };
                  const qStr = String(q);
                  return (
                      <div key={q} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                          <label htmlFor={qStr} className="font-medium w-64"> {q}. {labels[q]}</label>
                          <Input id={qStr} className={`w-20 ${getAnswerStatus(qStr) === 'correct' ? 'border-green-500' : getAnswerStatus(qStr) === 'incorrect' ? 'border-red-500' : ''}`} value={answers[qStr] || ''} onChange={e => handleInputChange(qStr, e.target.value.toUpperCase())} disabled={disabledState} />
                      </div>
                  );
              })}
            </div>
        </div>
        
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 17 and 18</h4>
            <p className="text-sm font-semibold mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">For which TWO reasons does the speaker say people give up going to the gym?</p>
             <div className={`${getMultiSelectStatus('17&18') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('17&18') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['lack of time', 'loss of confidence', 'too much effort required', 'high costs', 'feeling less successful than others'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['17&18'] || []).includes(val)} onChange={() => handleMultiSelect('17&18', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                })}
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
            <p className="text-sm font-semibold mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">Which TWO pieces of advice does the speaker give for setting goals?</p>
             <div className={`${getMultiSelectStatus('19&20') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('19&20') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['write goals down', 'have achievable aims', 'set a time limit', 'give yourself rewards', 'challenge yourself'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['19&20'] || []).includes(val)} onChange={() => handleMultiSelect('19&20', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                })}
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
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {[
                    { q: '21', p: "What first inspired Jim to choose this project?", o: ["textiles displayed in an exhibition", "a book about a botanic garden", "carpets he saw on his holiday"] },
                    { q: '22', p: "Jim eventually decided to do a practical investigation which involved", o: ["using a range of dyes with different fibres.", "applying different dyes to one type of fibre.", "testing one dye and a range of fibres."] },
                    { q: '23', p: "When doing his experiments, Jim was surprised by", o: ["how much natural material was needed to make the dye.", "the fact that dyes were widely available on the internet.", "the time that he had to leave the fabric in the dye."] },
                    { q: '24', p: "What problem did Jim have with using tartrazine as a fabric dye?", o: ["It caused a slight allergic reaction.", "It was not a permanent dye on cotton.", "It was ineffective when used on nylon."] },
                ].map(({ q, p, o }) => (
                  <div key={q}>
                    <p className="font-medium mb-2">{q}. {p}</p>
                    <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {o.map((opt, i) => {
                            const val = String.fromCharCode(65 + i);
                            return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${q}`} value={val} checked={answers[q] === val} onChange={() => handleMultipleChoice(q, val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                        })}
                    </div>
                  </div>  
                ))}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm font-semibold mb-4">What problem is identified with each of the following natural dyes? Choose SIX answers from the box and write the correct letter, A–H, next to Questions 25–30.</p>
            <div className="border p-4 rounded mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50">
              {['A: It is expensive.', 'B: The colour is too strong.', 'C: The colour is not long-lasting.', 'D: It is very poisonous.', 'E: It can damage the fabric.', 'F: The colour may be unexpected.', 'G: It is unsuitable for some fabrics.', 'H: It is not generally available.'].map(opt => <div key={opt}>{opt}</div>)}
            </div>
            <p><b>Natural dyes:</b></p>
            <div className="space-y-3">
              {[25, 26, 27, 28, 29, 30].map(q => {
                  const labels: { [key: number]: string } = { 25: 'turmeric', 26: 'beetroot', 27: 'Tyrian purple', 28: 'logwood', 29: 'cochineal', 30: 'metal oxide' };
                  const qStr = String(q);
                  return (
                      <div key={q} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                          <label htmlFor={qStr} className="font-medium w-48"> {q}. {labels[q]}</label>
                          <Input id={qStr} className={`w-20 ${getAnswerStatus(qStr) === 'correct' ? 'border-green-500' : getAnswerStatus(qStr) === 'incorrect' ? 'border-red-500' : ''}`} value={answers[qStr] || ''} onChange={e => handleInputChange(qStr, e.target.value.toUpperCase())} disabled={disabledState} />
                      </div>
                  );
              })}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 4 - Questions 31-40</CardTitle>
        <p className="text-sm font-semibold">Write ONE WORD ONLY for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg space-y-4">
        <h3 className="font-bold text-center text-lg mb-4">The sleepy lizard (tiliqua rugosa)</h3>
        <div>
          <h4 className="font-semibold">Description</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>They are common in Western and South Australia</li>
            <li className="flex items-center gap-2">They are brown, but recognisable by their blue <Input id="31" className={inputClass('31')} value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={disabledState} /></li>
            <li>They are relatively large</li>
            <li className="flex items-center gap-2">Their diet consists mainly of <Input id="32" className={inputClass('32')} value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={disabledState} /></li>
            <li className="flex items-center gap-2">Their main predators are large birds and <Input id="33" className={inputClass('33')} value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={disabledState} /></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Navigation study</h4>
          <ul className="list-disc list-inside ml-4 mt-2">
            <li className="flex items-center gap-2">One study found that lizards can use the <Input id="34" className={inputClass('34')} value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={disabledState} /> to help them navigate</li>
          </ul>
        </div>
         <div>
          <h4 className="font-semibold">Observations in the wild</h4>
          <ul className="list-disc list-inside ml-4 mt-2">
            <li className="flex items-center gap-2">Observations show that these lizards keep the same <Input id="35" className={inputClass('35')} value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={disabledState} /> for several years</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">What people want</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>Possible reasons:</li>
            <li className="ml-4 flex items-center gap-2">- to improve the survival of their young (but little <Input id="36" className={inputClass('36')} value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={disabledState} /> has been noted between parents and children)</li>
            <li className="ml-4 flex items-center gap-2">- to provide <Input id="37" className={inputClass('37')} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={disabledState} /> for female lizards</li>
          </ul>
        </div>
         <div>
          <h4 className="font-semibold">Tracking study</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li className="flex items-center gap-2">A study was carried out using <Input id="38" className={inputClass('38')} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={disabledState} /> systems attached to the lizards.</li>
            <li className="flex items-center gap-2">This provided information on the lizards' location and even the number of <Input id="39" className={inputClass('39')} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={disabledState} /> taken.</li>
            <li>It appeared that the lizards were trying to avoid one another.</li>
            <li className="flex items-center gap-2">This may be in order to reduce chances of <Input id="40" className={inputClass('40')} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={disabledState} />.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    const questionKeysToRender: string[] = [];
    for (let i = 1; i <= 40; i++) {
        if (i === 17) { questionKeysToRender.push('17&18'); i++; }
        else if (i === 19) { questionKeysToRender.push('19&20'); i++; }
        else { questionKeysToRender.push(String(i)); }
    }
  
    return (
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
              {questionKeysToRender.map((qKey) => {
                if (qKey.includes('&')) {
                    const userChoices = multipleAnswers[qKey] || [];
                    const correctChoices = correctAnswers[qKey] as string[];
                    const status = getMultiSelectStatus(qKey);
                    const statusClass = status === 'correct' ? 'bg-green-50 border-green-200' : status === 'partial' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
                    const qLabel = `Q${qKey.replace('&', ' & Q')}`;

                    return (
                        <div key={qKey} className={`p-3 rounded border ${statusClass}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{qLabel}</span>
                                {status === 'correct' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="text-sm">
                                <div className="mb-1"><span>Your answer: </span><span className={status === 'correct' ? 'text-green-700' : 'text-red-700'}>{userChoices.join(', ') || 'No answer'}</span></div>
                                <div><span>Correct: </span><span className="text-green-700 font-medium">{correctChoices.join(', ')}</span></div>
                            </div>
                        </div>
                    );
                }

                const isCorrect = getAnswerStatus(qKey) === 'correct';
                return (
                  <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{qKey}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                    <div className="text-sm">
                      <div className="mb-1"><span>Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qKey] || 'No answer'}</span></div>
                      <div><span>Correct: </span><span className="text-green-700 font-medium">{correctAnswers[qKey]}</span></div>
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 13 - Test 3 Listening</h1>
        </div>

        <LocalAudioPlayer audioSrc={AUDIO_URLS.book13.test3} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 13 - Listening Test 3" />

        <Card className="mb-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent></Card>

        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((section) => (<Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={disabledState}>Section {section}</Button>))}
        </div>
        
        {!isTestStarted && !submitted && (<Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4 text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></CardContent></Card>)}
        
        <div style={{display: currentSection === 1 ? 'block' : 'none'}}>{renderSection1()}</div>
        <div style={{display: currentSection === 2 ? 'block' : 'none'}}>{renderSection2()}</div>
        <div style={{display: currentSection === 3 ? 'block' : 'none'}}>{renderSection3()}</div>
        <div style={{display: currentSection === 4 ? 'block' : 'none'}}>{renderSection4()}</div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {showResultsPopup && renderResults()}
      </div>
      <PageViewTracker 
        book="book-13" 
        module="listening" 
        testNumber={3} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-13" module="listening" testNumber={3} />
          <UserTestHistory book="book-13" module="listening" testNumber={3} />
        </div>
      </div>
    </div>
  );
}