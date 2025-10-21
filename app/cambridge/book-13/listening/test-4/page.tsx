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

// Correct answers for Cambridge IELTS 13, Listening Test 4
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'finance',
  '2': 'maths/math/mathematics',
  '3': 'business',
  '4': '17/seventeen',
  '5': 'holiday/vacation',
  '6': 'college',
  '7': 'location',
  '8': 'jeans',
  '9': 'late',
  '10': 'smile',
  
  // Section 2: Questions 11-20
  '11': 'A',
  '12': 'B',
  '13': 'A',
  '14': 'C',
  '15': 'A',
  '16': 'B',
  '17': 'B',
  '18': 'D',
  '19': 'A',
  '20': 'E',
  
  // Section 3: Questions 21-30
  '21': 'A',
  '22': 'A',
  '23': 'C',
  '24': 'C',
  '25': 'B',
  '26': 'A',
  '27&28': ['B', 'C'], // Multi-select question - IN EITHER ORDER
  '29&30': ['D', 'E'], // Multi-select question - IN EITHER ORDER
  
  // Section 4: Questions 31-40
  '31': 'destruction',
  '32': 'universities/university',
  '33': 'political',
  '34': 'port/ports',
  '35': 'slaves/slavery',
  '36': 'taxation',
  '37': 'sugar',
  '38': 'tea',
  '39': 'transportation',
  '40': 'night'
};

export default function Cambridge13Test4Listening() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '27&28': [],
    '29&30': [],
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
        if (['27', '28', '29', '30'].includes(qNumStr)) continue;

        if (answers[qNumStr] !== undefined && correctAnswers[qNumStr] !== undefined) {
          if (checkAnswerWithMatching(answers[qNumStr], correctAnswers[qNumStr] as string, qNumStr)) {
            correctCount++;
          }
        }
    }

    // Handle multi-select questions
    const multiSelectKeys = ['27&28', '29&30'];
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
        testNumber: 4,
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

  const inputClass = (qNum: string) => `w-48 ${getAnswerStatus(qNum) === 'correct' ? 'border-green-500' : getAnswerStatus(qNum) === 'incorrect' ? 'border-red-500' : ''}`;
  const disabledState = !isTestStarted || isSubmitting;

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4 rounded-lg space-y-4">
        <h3 className="font-bold text-center text-lg mb-4">Alex's Training</h3>
        <p>Example: Alex completed his training in: <span className="underline font-medium">2014</span></p>
        <div>
          <h4 className="font-semibold">About the applicant:</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li className="flex items-center gap-2">At first, Alex did his training in the <Input id="1" className={inputClass('1')} value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={disabledState} /> department.</li>
            <li className="flex items-center gap-2">Alex didn't have a qualification from school in <Input id="2" className={inputClass('2')} value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={disabledState} />.</li>
            <li className="flex items-center gap-2">Alex thinks he should have done the diploma in <Input id="3" className={inputClass('3')} value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={disabledState} /> skills.</li>
            <li className="flex items-center gap-2">Age of other trainees: the youngest was <Input id="4" className={inputClass('4')} value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={disabledState} />.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Benefits of doing training at JPNW:</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>Lots of opportunities because of the size of the organisation.</li>
            <li className="flex items-center gap-2">Trainees receive the same amount of <Input id="5" className={inputClass('5')} value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={disabledState} /> as permanent staff.</li>
            <li>The training experience increases people's confidence a lot.</li>
            <li className="flex items-center gap-2">Trainees go to <Input id="6" className={inputClass('6')} value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={disabledState} /> one day per month.</li>
            <li className="flex items-center gap-2">The company is in a convenient <Input id="7" className={inputClass('7')} value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={disabledState} />.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Advice for the interview:</h4>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li className="flex items-center gap-2">Don't wear <Input id="8" className={inputClass('8')} value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={disabledState} /> clothes.</li>
            <li className="flex items-center gap-2">Don't be <Input id="9" className={inputClass('9')} value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={disabledState} />.</li>
            <li className="flex items-center gap-2">Make sure you <Input id="10" className={inputClass('10')} value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={disabledState} />.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 11-16</h4>
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-4">
            {[
                {q: '11', p: 'Annie recommends that when cross-country skiing, the visitors should', o: ['get away from the regular trails.', 'stop to enjoy views of the scenery.', 'go at a slow speed at the beginning.']},
                {q: '12', p: 'What does Annie tell the group about this afternoon’s dog-sled trip?', o: ['Those who want to can take part in a race.', 'Anyone has the chance to drive a team of dogs.', 'One group member will be chosen to lead the trail.']},
                {q: '13', p: 'What does Annie say about the team-relay event?', o: ['All participants receive a medal.', 'The course is 4 km long.', 'Each team is led by a teacher.']},
                {q: '14', p: 'On the snow-shoe trip, the visitors will', o: ['visit an old gold mine.', 'learn about unusual flowers.', 'climb to the top of a mountain.']},
                {q: '15', p: 'The cost of accommodation in the mountain hut includes', o: ['a supply of drinking water.', 'transport of visitors’ luggage.', 'cooked meals.']},
                {q: '16', p: 'If there is a storm while the visitors are in the hut, they should', o: ['contact the bus driver.', 'wait until the weather improves.', 'use the emergency locator beacon.']},
            ].map(({q, p, o}) => (
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
            <h4 className="font-semibold mb-2">Questions 17-20</h4>
            <p className="text-sm font-semibold mb-4">What information does Annie give about skiing on each of the following mountain trails? Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 17–20.</p>
            <div className="border p-4 rounded mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50">
                {['A: It has a good place to stop and rest.', 'B: It is suitable for all abilities.', 'C: It involves crossing a river.', 'D: It demands a lot of skill.', 'E: It may be closed in bad weather.', 'F: It has some very narrow sections.'].map(opt => <div key={opt}>{opt}</div>)}
            </div>
            <p><b>Mountain trails:</b></p>
            <div className="space-y-3">
              {[17, 18, 19, 20].map(q => {
                  const labels: { [key: number]: string } = { 17: 'Highland Trail', 18: 'Pine Trail', 19: 'Stony Trail', 20: 'Loser’s Trail' };
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

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent>
         <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 21-26</h4>
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {[
                    { q: '21', p: "What was Jack's attitude to nutritional food labels before this project?", o: ["He didn't read everything on them.", "He didn't think they were important.", "He thought they were too complicated."] },
                    { q: '22', p: "Alice says that before doing this project,", o: ["she was unaware of what certain foods contained.", "she was too lazy to read food labels.", "she was only interested in the number of calories."] },
                    { q: '23', p: "When discussing supermarket brands of pizza, Jack agrees with Alice that", o: ["the list of ingredients is shocking.", "he will hesitate before buying pizza again.", "the nutritional label is misleading."] },
                    { q: '24', p: "Jack prefers the daily value system to other labelling systems because it is", o: ["more accessible.", "more logical.", "more comprehensive."] },
                    { q: '25', p: "What surprised both students about one flavour of crisps?", o: ["The percentage of artificial additives given was incorrect.", "The products did not contain any meat.", "The labels did not list all the ingredients."] },
                    { q: '26', p: "What do the students think about research into the impact of nutritional food labelling?", o: ["It did not produce clear results.", "It focused on the wrong people.", "It made unrealistic recommendations."] },
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
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 27 and 28</h4>
            <p className="text-sm font-semibold mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">Which TWO things surprised the students about the traffic-light system for nutritional labels?</p>
             <div className={`${getMultiSelectStatus('27&28') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('27&28') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['its widespread use', 'the fact that it is voluntary for supermarkets', 'how little research was done before its introduction', 'its un-popularity with food manufacturers', 'the way that certain colours are used'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['27&28'] || []).includes(val)} onChange={() => handleMultiSelect('27&28', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                })}
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Questions 29 and 30</h4>
            <p className="text-sm font-semibold mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">Which TWO things are true about the participants in the study on the traffic-light system?</p>
             <div className={`${getMultiSelectStatus('29&30') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('29&30') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['They had low literacy levels.', 'They were regular consumers of packaged food.', 'They were selected randomly.', 'They were from all socio-economic groups.', 'They were interviewed face-to-face.'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['29&30'] || []).includes(val)} onChange={() => handleMultiSelect('29&30', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
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
        <h3 className="font-bold text-center text-lg mb-4">The history of coffee</h3>
        <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Coffee in the Arab world</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-2">
                    <li>There was small-scale trade in wild coffee from Ethiopia.</li>
                    <li>1522: Coffee was approved in the Ottoman court as a type of medicine.</li>
                    <li className="flex items-center gap-2">1623: In Constantinople, the ruler ordered the <Input id="31" className={inputClass('31')} value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={disabledState} /> of every coffee house.</li>
                </ul>
            </li>
            <li><strong>Coffee's arrival in Europe (17th century)</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-2">
                    <li className="flex items-center gap-2">Coffee shops were compared to <Input id="32" className={inputClass('32')} value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={disabledState} />.</li>
                    <li className="flex items-center gap-2">They played an important part in social and <Input id="33" className={inputClass('33')} value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={disabledState} /> changes.</li>
                </ul>
            </li>
            <li><strong>Coffee and European colonisation</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-2">
                    <li>European powers established coffee plantations in their colonies.</li>
                    <li className="flex items-center gap-2">Types of coffee were often named according to the <Input id="34" className={inputClass('34')} value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={disabledState} /> they came from.</li>
                    <li className="flex items-center gap-2">In Brazil and the Caribbean, most cultivation depended on <Input id="35" className={inputClass('35')} value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={disabledState} />.</li>
                    <li className="flex items-center gap-2">In Java, coffee was used as a form of <Input id="36" className={inputClass('36')} value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={disabledState} />.</li>
                    <li className="flex items-center gap-2">Coffee became almost as important as <Input id="37" className={inputClass('37')} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={disabledState} />.</li>
                    <li className="flex items-center gap-2">The move towards the consumption of <Input id="38" className={inputClass('38')} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={disabledState} />in Britain did not also take place in the USA.</li>
                </ul>
            </li>
            <li><strong>Coffee in the 19th century</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-2">
                    <li className="flex items-center gap-2">Prices dropped because of improvements in <Input id="39" className={inputClass('39')} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={disabledState} />.</li>
                    <li className="flex items-center gap-2">Industrial workers found coffee helped them to work at <Input id="40" className={inputClass('40')} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={disabledState} />.</li>
                </ul>
            </li>
        </ul>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    const questionKeysToRender: string[] = [];
    for (let i = 1; i <= 40; i++) {
        if (i === 27) { questionKeysToRender.push('27&28'); i++; }
        else if (i === 29) { questionKeysToRender.push('29&30'); i++; }
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
                            <div className="flex items-center justify-between mb-2"><span className="font-medium">{qLabel}</span>{status === 'correct' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 13 - Test 4 Listening</h1>
        </div>

        <LocalAudioPlayer audioSrc={AUDIO_URLS.book13.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 13 - Listening Test 4" />

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
        testNumber={4} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-13" module="listening" testNumber={4} />
          <UserTestHistory book="book-13" module="listening" testNumber={4} />
        </div>
      </div>
    </div>
  );
}