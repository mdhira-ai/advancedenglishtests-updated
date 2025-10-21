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

// Correct answers for Cambridge IELTS 13, Listening Test 1
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'choose',
  '2': 'private',
  '3': '20 /twenty percent',
  '4': 'healthy',
  '5': 'bones',
  '6': 'lecture',
  '7': 'Arretsa',
  '8': 'vegetarian',
  '9': 'market',
  '10': 'knife',
  
  // Section 2: Questions 11-20
  '11': 'B',
  '12': 'C',
  '13': 'B',
  '14': 'E',
  '15': 'D',
  '16': 'B',
  '17': 'G',
  '18': 'C',
  '19': 'H',
  '20': 'I',
  
  // Section 3: Questions 21-30
  '21': 'A',
  '22': 'C',
  '23': 'B',
  '24': 'C',
  '25': 'B',
  '26': 'G',
  '27': 'C',
  '28': 'H',
  '29': 'A',
  '30': 'E',
  
  // Section 4: Questions 31-40
  '31': 'crow',
  '32': 'cliffs',
  '33': 'speed',
  '34': 'brain/brains',
  '35': 'food',
  '36': 'behaviour/behavior/behaviors/behaviours',
  '37': 'new',
  '38': 'stress',
  '39': 'tail(s)',
  '40': 'permanent'
};

export default function Cambridge13Test1Listening() {
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

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber];
    const correctAnswer = correctAnswers[questionNumber];
    if (userAnswer === undefined || correctAnswer === undefined) return false;
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
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
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || '',
          correctAnswer: correctAnswers[questionNum],
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        timeTaken
      };
      
      await saveTestScore({
        userId: session?.user?.id || null,
        book: 'book-13',
        module: 'listening',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
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

  const handleTestStart = () => {
    setIsTestStarted(true);
  };
  
  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const inputClass = (qNum: string) => `w-48 ${getAnswerStatus(qNum) === 'correct' ? 'border-green-500' : getAnswerStatus(qNum) === 'incorrect' ? 'border-red-500' : ''}`;
  const disabledState = !isTestStarted || isSubmitting;
  
  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-center text-lg mb-6">COOKERY CLASSES</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-800">
            <thead>
              <tr className="bg-gray-200">
                <th className="border-2 border-gray-800 p-3 text-left font-bold">Cookery Class</th>
                <th className="border-2 border-gray-800 p-3 text-left font-bold">Focus</th>
                <th className="border-2 border-gray-800 p-3 text-left font-bold">Other Information</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border-2 border-gray-800 p-3 align-top">
                  <div className="font-medium">
                    <em>Example</em>
                    <br />
                    The Food <span className='underline'>Studio</span>
                  </div>
                </td>
                <td className="border-2 border-gray-800 p-3 align-top">
                  <div>
                    how to <Input 
                      id="1" 
                      className={`${inputClass('1')} inline-block w-20 mx-1`} 
                      value={answers['1'] || ''} 
                      onChange={e => handleInputChange('1', e.target.value)} 
                      disabled={disabledState} 
                    />
                    <br />
                    and cook with seasonal products
                  </div>
                </td>
                <td className="border-2 border-gray-800 p-3 align-top">
                  <ul className="list-disc list-inside space-y-2">
                    <li>small classes</li>
                    <li>
                      also offers <Input 
                        id="2" 
                        className={`${inputClass('2')} inline-block w-16 mx-1`} 
                        value={answers['2'] || ''} 
                        onChange={e => handleInputChange('2', e.target.value)} 
                        disabled={disabledState} 
                      /> classes
                    </li>
                    <li>
                      clients who return get a <Input 
                        id="3" 
                        className={`${inputClass('3')} inline-block w-24 mx-1`} 
                        value={answers['3'] || ''} 
                        onChange={e => handleInputChange('3', e.target.value)} 
                        disabled={disabledState} 
                      /> discount
                    </li>
                  </ul>
                </td>
              </tr>
              
              <tr className="bg-white">
                <td className="border-2 border-gray-800 p-3 align-top">
                  <div className="font-medium">Bond's Cookery School</div>
                </td>
                <td className="border-2 border-gray-800 p-3 align-top">
                  <div>
                    food that<br />
                    is <Input 
                      id="4" 
                      className={`${inputClass('4')} inline-block w-20 mx-1`} 
                      value={answers['4'] || ''} 
                      onChange={e => handleInputChange('4', e.target.value)} 
                      disabled={disabledState} 
                    />
                  </div>
                </td>
                <td className="border-2 border-gray-800 p-3 align-top">
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      includes recipes to strengthen your <Input 
                        id="5" 
                        className={`${inputClass('5')} inline-block w-16 mx-1`} 
                        value={answers['5'] || ''} 
                        onChange={e => handleInputChange('5', e.target.value)} 
                        disabled={disabledState} 
                      />
                    </li>
                    <li>
                      they have a<br />
                      free <Input 
                        id="6" 
                        className={`${inputClass('6')} inline-block w-20 mx-1`} 
                        value={answers['6'] || ''} 
                        onChange={e => handleInputChange('6', e.target.value)} 
                        disabled={disabledState} 
                      /> every Thursday
                    </li>
                  </ul>
                </td>
              </tr>
              
              <tr className="bg-white">
                <td className="border-2 border-gray-800 p-3 align-top">
                  <div className="font-medium">
                    The <Input 
                      id="7" 
                      className={`${inputClass('7')} inline-block w-20 mx-1`} 
                      value={answers['7'] || ''} 
                      onChange={e => handleInputChange('7', e.target.value)} 
                      disabled={disabledState} 
                    />
                    <br />
                    Centre
                  </div>
                </td>
                <td className="border-2 border-gray-800 p-3 align-top">
                  <div>
                    mainly <Input 
                      id="8" 
                      className={`${inputClass('8')} inline-block w-20 mx-1`} 
                      value={answers['8'] || ''} 
                      onChange={e => handleInputChange('8', e.target.value)} 
                      disabled={disabledState} 
                    />
                    <br />
                    food
                  </div>
                </td>
                <td className="border-2 border-gray-800 p-3 align-top">
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      located near<br />
                      the <Input 
                        id="9" 
                        className={`${inputClass('9')} inline-block w-20 mx-1`} 
                        value={answers['9'] || ''} 
                        onChange={e => handleInputChange('9', e.target.value)} 
                        disabled={disabledState} 
                      />
                    </li>
                    <li>
                      a special course in skills with a <Input 
                        id="10" 
                        className={`${inputClass('10')} inline-block w-16 mx-1`} 
                        value={answers['10'] || ''} 
                        onChange={e => handleInputChange('10', e.target.value)} 
                        disabled={disabledState} 
                      /> is sometimes available
                    </li>
                  </ul>
                </td>
              </tr>
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
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 11-13</h4>
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-4">
                <div>
                    <p className="font-medium mb-2">11. Why are changes needed to traffic systems in Granford?</p>
                    <div className={`${getAnswerStatus('11') === 'correct' ? 'bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {['The number of traffic accidents has risen.', 'The amount of traffic on the roads has increased.', 'The types of vehicles on the roads have changed.'].map((opt, i) => {
                        const val = String.fromCharCode(65 + i);
                        return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q11" value={val} checked={answers['11'] === val} onChange={() => handleMultipleChoice('11', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                    })}
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">12. In a survey, local residents particularly complained about</p>
                    <div className={`${getAnswerStatus('12') === 'correct' ? 'bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {['dangerous driving by parents.', 'pollution from trucks and lorries.', 'inconvenience from parked cars.'].map((opt, i) => {
                        const val = String.fromCharCode(65 + i);
                        return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q12" value={val} checked={answers['12'] === val} onChange={() => handleMultipleChoice('12', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                    })}
                    </div>
                </div>
                 <div>
                    <p className="font-medium mb-2">13. According to the speaker, one problem with the new regulations will be</p>
                    <div className={`${getAnswerStatus('13') === 'correct' ? 'bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                    {['raising money to pay for them.', 'finding a way to make people follow them.', 'getting the support of the police.'].map((opt, i) => {
                        const val = String.fromCharCode(65 + i);
                        return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q13" value={val} checked={answers['13'] === val} onChange={() => handleMultipleChoice('13', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                    })}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Questions 14-20</h4>
            <p className="text-sm font-semibold mb-4">Label the map below. Write the correct letter, A–I, next to Questions 14–20.</p>
          <div className="text-center mb-4"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/listening/test1/map.png" alt="Sheepmarket Map" className="mx-auto max-w-full h-auto rounded border shadow-lg"/></div>
            <div className="space-y-3">
              {[14, 15, 16, 17, 18, 19, 20].map(q => {
                  const labels: { [key: number]: string } = {
                      14: 'New traffic lights', 15: 'Pedestrian crossing', 16: 'Parking allowed', 17: "New 'No Parking' sign",
                      18: 'New disabled parking spaces', 19: 'Widened pavement', 20: 'Lorry loading/unloading restrictions'
                  };
                  return (
                      <div key={q} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                          <label htmlFor={String(q)} className="font-medium w-64">{q}. {labels[q]}</label>
                          <Input id={String(q)} className={`w-20 ${getAnswerStatus(String(q)) === 'correct' ? 'border-green-500' : getAnswerStatus(String(q)) === 'incorrect' ? 'border-red-500' : ''}`} value={answers[String(q)] || ''} onChange={e => handleInputChange(String(q), e.target.value.toUpperCase())} disabled={disabledState} />
                      </div>
                  );
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
            <h4 className="font-semibold mb-2">Questions 21-25</h4>
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {[
                    { q: '21', p: "Why is Jack interested in investigating seed germination?", o: ["He may do a module on a related topic later on.", "He wants to have a career in plant science.", "He is thinking of choosing this topic for his dissertation."] },
                    { q: '22', p: "Jack and Emma agree the main advantage of their present experiment is that it can be", o: ["described very easily.", "carried out inside the laboratory.", "completed in the time available."] },
                    { q: '23', p: "What do they decide to check with their tutor?", o: ["whether their aim is appropriate.", "whether anyone else has chosen this topic.", "whether the assignment contributes to their final grade."] },
                    { q: '24', p: "They agree that Graves' book on seed germination is disappointing because", o: ["it fails to cover recent advances in seed science.", "the content is irrelevant for them.", "its focus is very theoretical."] },
                    { q: '25', p: "What does Jack say about the article on seed germination by Lee Hall?", o: ["The diagrams of plant development are useful.", "The analysis of seed germination statistics is thorough.", "The findings on seed germination after fires are surprising."] },
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
            <h4 className="font-semibold mb-2">Questions 26-30</h4>
            <p className="text-sm font-semibold mb-4">Complete the flow-chart below. Choose FIVE answers from the box and write the correct letter, A–H, next to Questions 26–30.</p>
            <div className="border p-4 rounded mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-50 text-center">
              <div><span className="font-bold">A</span> container</div><div><span className="font-bold">B</span> soil</div>
              <div><span className="font-bold">C</span> weight</div><div><span className="font-bold">D</span> condition</div>
              <div><span className="font-bold">E</span> height</div><div><span className="font-bold">F</span> colour</div>
              <div><span className="font-bold">G</span> types</div><div><span className="font-bold">H</span> depths</div>
            </div>
            <div className="space-y-3 bg-gray-100 p-4 rounded-lg">
                <h3 className="font-bold text-center text-lg mb-4">Stages in the experiment</h3>
                <div className="flex items-center justify-center gap-2"><span>Select seeds of different</span><Input id="26" className="w-16" value={answers['26'] || ''} onChange={e => handleInputChange('26', e.target.value.toUpperCase())} disabled={disabledState} /><span className={getAnswerStatus('26')==='correct' ? 'text-green-600' : 'text-red-600'}> {submitted && correctAnswers['26']} </span><span>and sizes.</span></div>
                <div className="text-center text-xl">↓</div>
                <div className="flex items-center justify-center gap-2"><span>Measure and record the</span><Input id="27" className="w-16" value={answers['27'] || ''} onChange={e => handleInputChange('27', e.target.value.toUpperCase())} disabled={disabledState} /><span className={getAnswerStatus('27')==='correct' ? 'text-green-600' : 'text-red-600'}> {submitted && correctAnswers['27']} </span><span>and size of each one.</span></div>
                <div className="text-center text-xl">↓</div>
                <div className="flex items-center justify-center gap-2"><span>Decide on the</span><Input id="28" className="w-16" value={answers['28'] || ''} onChange={e => handleInputChange('28', e.target.value.toUpperCase())} disabled={disabledState} /><span className={getAnswerStatus('28')==='correct' ? 'text-green-600' : 'text-red-600'}> {submitted && correctAnswers['28']} </span><span>to be used.</span></div>
                <div className="text-center text-xl">↓</div>
                <div className="flex items-center justify-center gap-2"><span>Use a different</span><Input id="29" className="w-16" value={answers['29'] || ''} onChange={e => handleInputChange('29', e.target.value.toUpperCase())} disabled={disabledState} /><span className={getAnswerStatus('29')==='correct' ? 'text-green-600' : 'text-red-600'}> {submitted && correctAnswers['29']} </span><span>for each seed and label it.</span></div>
                <div className="text-center text-xl">↓</div>
                <div className="flex items-center justify-center gap-2"><span>After about 3 weeks, record the plant's</span><Input id="30" className="w-16" value={answers['30'] || ''} onChange={e => handleInputChange('30', e.target.value.toUpperCase())} disabled={disabledState} /><span className={getAnswerStatus('30')==='correct' ? 'text-green-600' : 'text-red-600'}> {submitted && correctAnswers['30']} </span>.</div>
                <div className="text-center text-xl">↓</div>
                <div className="flex items-center justify-center gap-2"><span>Investigate the findings.</span></div>
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
        <h3 className="font-bold text-center text-lg mb-4">Effects of urban environments on animals</h3>
        <div>
          <h4 className="font-semibold">Introduction</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>Recent urban developments represent massive environmental changes. It was previously thought that only a few animals were suitable for city life, e.g.</li>
            <li className="flex items-center gap-2">the <Input id="31" className={inputClass('31')} value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={disabledState} /> – because of its general adaptability</li>
            <li className="flex items-center gap-2">the pigeon – because walls of city buildings are similar to <Input id="32" className={inputClass('32')} value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={disabledState} /></li>
            <li className="flex items-center gap-2">In fact, many urban animals are adapting with unusual <Input id="33" className={inputClass('33')} value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={disabledState} /></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Recent research</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>Emilie Snell-Rood studied small urbanised mammal specimens from museums in Minnesota.</li>
            <li className="flex items-center gap-2">– She found the size of their <Input id="34" className={inputClass('34')} value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={disabledState} /> had increased</li>
            <li className="flex items-center gap-2">– She suggests this may be due to the need to locate new sources of <Input id="35" className={inputClass('35')} value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={disabledState} /> and to deal with new dangers.</li>
            <li>Catarina Miranda focused on the <Input id="36" className={inputClass('36')} value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={disabledState} /> of urban and rural blackbirds.</li>
            <li className="flex items-center gap-2">– She found urban birds were often braver, but were afraid of situations that were <Input id="37" className={inputClass('37')} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={disabledState} /></li>
            <li>Jonathan Atwell studies how animals respond to urban environments.</li>
            <li className="flex items-center gap-2">– He found that some animals respond to <Input id="38" className={inputClass('38')} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={disabledState} /> by producing lower levels of hormones.</li>
            <li>Sarah Partan’s team found urban squirrels use their <Input id="39" className={inputClass('39')} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={disabledState} /> to help them communicate.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Long-term possibilities</h4>
          <p className="ml-4 mt-2">Species of animals may develop which are unique to cities. However, some changes may not be <Input id="40" className={inputClass('40')} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={disabledState} /></p>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    const questionKeysToRender = Array.from({ length: 40 }, (_, i) => String(i + 1));
  
    return (
      <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
            <div className="flex justify-center items-center space-x-8 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{score}/40</div>
                <div className="text-sm text-gray-600">Raw Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div>
                <div className="text-sm text-gray-600">IELTS Band</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{Math.round((score/40)*100)}%</div>
                <div className="text-sm text-gray-600">Percentage</div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionKeysToRender.map((qKey) => {
                const isCorrect = getAnswerStatus(qKey) === 'correct';
                return (
                  <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Q{qKey}</span>
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="text-sm">
                      <div className="mb-1">
                        <span>Your answer: </span>
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[qKey] || 'No answer'}</span>
                      </div>
                      <div>
                        <span>Correct: </span>
                        <span className="text-green-700 font-medium">{correctAnswers[qKey]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 13 - Test 1 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book13.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 13 - Listening Test 1"
        />

        <Card className="mb-6">
          <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
          <CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent>
        </Card>

        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((section) => (
            <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={disabledState}>
              Section {section}
            </Button>
          ))}
        </div>
        
        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4 text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></CardContent></Card>
        )}
        
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
        testNumber={1} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-13" module="listening" testNumber={1} />
          <UserTestHistory book="book-13" module="listening" testNumber={1} />
        </div>
      </div>
    </div>
  );
}