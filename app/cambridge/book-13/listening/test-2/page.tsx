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

// Correct answers for Cambridge IELTS 13, Listening Test 2
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'races',
  '2': 'insurance',
  '3': 'Jerriz',
  '4': '25/twenty-five',
  '5': 'stadium',
  '6': 'park',
  '7': 'coffee',
  '8': 'leader',
  '9': 'route',
  '10': 'lights',
  
  // Section 2: Questions 11-20
  '11': 'C',
  '12': 'B',
  '13': 'C',
  '14': 'B',
  '15': 'B',
  '16': 'A',
  '17&18': ['C', 'E'], // Multi-select question
  '19&20': ['B', 'D'], // Multi-select question
  
  // Section 3: Questions 21-30
  '21': 'B',
  '22': 'A',
  '23': 'C',
  '24': 'C',
  '25': 'A',
  '26': 'A',
  '27': 'C',
  '28': 'D',
  '29': 'G',
  '30': 'B',
  
  // Section 4: Questions 31-40
  '31': 'location',
  '32': 'world',
  '33': 'personal',
  '34': 'attention',
  '35': 'name',
  '36': 'network',
  '37': 'frequency',
  '38': 'colour/color',
  '39': 'brain',
  '40': 'self'
};

export default function Cambridge13Test2Listening() {
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
        if (qNumStr === '17' || qNumStr === '18' || qNumStr === '19' || qNumStr === '20') continue; // Skip multi-select questions

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
        // You could add a more detailed results breakdown here if needed
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-13',
        module: 'listening',
        testNumber: 2,
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
        <h3 className="font-bold text-center text-lg mb-4">South City Cycling Club</h3>
        <p>Example: Name of club secretary: Jim <span className="underline font-medium">Hunter</span></p>
        <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Membership
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li className="flex items-center gap-2">Full membership costs $260; this covers cycling and <Input id="1" className={inputClass('1')} value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={disabledState} /> all over Australia</li>
                    <li>Recreational membership costs $108</li>
                    <li className="flex items-center gap-2">Cost of membership includes the club fee and <Input id="2" className={inputClass('2')}  value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={disabledState} /></li>
                    <li className="flex items-center gap-2">The club kit is made by a company called <Input id="3" className={inputClass('3')}  value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={disabledState} /></li>
                </ul>
            </li>
            <li>Training rides
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li>Chance to improve cycling skills and fitness</li>
                    <li className="flex items-center gap-2">Level B: speed about <Input id="4" className={inputClass('4')} value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={disabledState} /> kph</li>
                    <li className="flex items-center gap-2">Weekly sessions - Tuesdays at 5.30 am, meet at the <Input id="5" className={inputClass('5')} value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={disabledState} /></li>
                    <li className="flex items-center gap-2">Thursdays at 5.30 am, meet at the entrance to the <Input id="6" className={inputClass('6')}  value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={disabledState} /></li>
                </ul>
            </li>
            <li>Further information
                <ul className="list-disc list-inside ml-6 space-y-2 mt-1">
                    <li>Rides are about an hour and a half</li>
                    <li className="flex items-center gap-2">Members often have <Input id="7" className={inputClass('7')} value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={disabledState} /> together afterwards</li>
                    <li className="flex items-center gap-2">There is not always a <Input id="8" className={inputClass('8')} value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={disabledState} /> with the group on these rides</li>
                    <li className="flex items-center gap-2">Check and print the <Input id="9" className={inputClass('9')} value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={disabledState} /> on the website beforehand</li>
                    <li className="flex items-center gap-2">Bikes must have <Input id="10" className={inputClass('10')} value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={disabledState} /></li>
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
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-4">
            {[
                {q: '11', p: 'How much time for volunteering does the company allow per employee?', o: ['two hours per week', 'one day per month', '8 hours per year']},
                {q: '12', p: 'In feedback, almost all employees said that volunteering improved their', o: ['chances of promotion.', 'job satisfaction.', 'relationships with colleagues.']},
                {q: '13', p: 'Last year some staff helped unemployed people with their', o: ['literacy skills.', 'job applications.', 'communication skills.']},
                {q: '14', p: 'This year the company will start a new volunteering project with a local', o: ['school.', 'park.', 'charity.']},
                {q: '15', p: 'Where will the Digital Inclusion Day be held?', o: ["at the company's training facility.", 'at a college.', 'in a community centre.']},
                {q: '16', p: 'What should staff do if they want to take part in the Digital Inclusion Day?', o: ['fill in a form.', 'attend a training workshop.', 'get permission from their manager.']},
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
        
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 17 and 18</h4>
            <p className="text-sm font-semibold mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">What TWO things are mentioned about the participants on the last Digital Inclusion Day?</p>
             <div className={`${getMultiSelectStatus('17&18') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('17&18') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['They were all over 70.', 'They never used their computer.', 'Their phones were mostly old-fashioned.', 'They only used their phones for making calls.', 'They initially showed little interest.'].map((opt, i) => {
                    const val = String.fromCharCode(65 + i);
                    return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" value={val} checked={(multipleAnswers['17&18'] || []).includes(val)} onChange={() => handleMultiSelect('17&18', val)} disabled={disabledState}/><span>{val}. {opt}</span></label>
                })}
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
            <p className="text-sm font-semibold mb-4">Choose TWO letters, A–E.</p>
            <p className="font-medium mb-2">What TWO activities on the last Digital Inclusion Day did participants describe as useful?</p>
             <div className={`${getMultiSelectStatus('19&20') === 'correct' ? 'bg-green-50' : getMultiSelectStatus('19&20') === 'incorrect' ? 'bg-red-50' : 'bg-yellow-50'} p-2 rounded`}>
                {['learning to use tablets', 'communicating with family', 'shopping online', 'playing online games', 'sending emails'].map((opt, i) => {
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
            <h4 className="font-semibold mb-2">Questions 21-25</h4>
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {[
                    { q: '21', p: "Russ says that his difficulty in planning the presentation is due to", o: ["his lack of knowledge about the topic.", "his uncertainty about what he should try to achieve.", "the short time he has for preparation."] },
                    { q: '22', p: "Russ and his tutor agree that his approach in the presentation will be", o: ["to concentrate on how nanotechnology is used in one field.", "to follow the chronological development of nanotechnology.", "to show the range of applications of nanotechnology."] },
                    { q: '23', p: "In connection with slides, the tutor advises Russ to", o: ["talk about things that he can find slides to illustrate.", "look for slides to illustrate the points he makes.", "consider omitting slides altogether."] },
                    { q: '24', p: "They both agree that the best way for Russ to start his presentation is", o: ["to encourage the audience to talk.", "to explain what Russ intends to do.", "to provide an example."] },
                    { q: '25', p: "What does the tutor advise Russ to do next while preparing his presentation?", o: ["summarise the main point he wants to make.", "read the notes he has already made.", "list the topics he wants to cover."] },
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
            <p className="text-sm font-semibold mb-4">What comments do the speakers make about each of the following aspects of Russ's previous presentation? Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 26–30.</p>
            <div className="border p-4 rounded mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50">
              {['A: lacked a conclusion', 'B: useful in the future', 'C: not enough', 'D: sometimes distracting', 'E: showed originality', 'F: covered a wide range', 'G: not too technical'].map(opt => <div key={opt}>{opt}</div>)}
            </div>
            <div className="space-y-3">
              {[26, 27, 28, 29, 30].map(q => {
                  const labels: { [key: number]: string } = { 26: 'structure', 27: 'eye contact', 28: 'body language', 29: 'choice of words', 30: 'handouts' };
                  const qStr = String(q);
                  return (
                      <div key={q} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                          <label htmlFor={qStr} className="font-medium w-48">{q}. Aspects of Russ's previous presentation: {labels[q]}</label>
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
        <h3 className="font-bold text-center text-lg mb-4">Episodic memory</h3>
        <ul className="list-disc list-inside ml-4 space-y-2">
            <li className="flex items-center gap-2">the ability to recall details, e.g. the time and <Input id="31" className={inputClass('31')} value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={disabledState} /> of past events</li>
            <li className="flex items-center gap-2">different to semantic memory – the ability to remember general information about the <Input id="32" className={inputClass('32')} value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={disabledState} />, which does not involve recalling <Input id="33" className={inputClass('33')} value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={disabledState} /> information</li>
        </ul>
        <h4 className="font-semibold mt-4">Forming episodic memories involves three steps:</h4>
        <div className="ml-4">
            <h5 className="font-medium">Encoding</h5>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>involves receiving and processing information</li>
                <li className="flex items-center gap-2">the more <Input id="34" className={inputClass('34')} value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={disabledState} /> given to an event, the more successfully it can be encoded</li>
                <li className="flex items-center gap-2">to remember a <Input id="35" className={inputClass('35')} value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={disabledState} />, it is useful to have a strategy for encoding such information</li>
            </ul>
        </div>
        <div className="ml-4">
            <h5 className="font-medium">Consolidation</h5>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>how memories are strengthened and stored</li>
                <li className="flex items-center gap-2">most effective when memories can be added to a <Input id="36" className={inputClass('36')} value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={disabledState} /> of related information</li>
                <li className="flex items-center gap-2">the <Input id="37" className={inputClass('37')} value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={disabledState} /> of retrieval affects the strength of memories</li>
            </ul>
        </div>
        <div className="ml-4">
            <h5 className="font-medium">Retrieval</h5>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li className="flex items-center gap-2">memory retrieval often depends on using a <Input id="38" className={inputClass('38')} value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={disabledState} />, e.g. the memory of an object near to the place where you left your car</li>
            </ul>
        </div>
        <h4 className="font-semibold mt-4">Episodic memory impairments</h4>
        <ul className="list-disc list-inside ml-4 space-y-2">
            <li>these affect people with a wide range of medical conditions</li>
            <li className="flex items-center gap-2"><Input id="39" className={inputClass('39')} value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={disabledState} /> which stimulate the brain have been found to help people with schizophrenia</li>
            <li>children with autism may have difficulty forming episodic memories – possibly because their concept of the <Input id="40" className={inputClass('40')} value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={disabledState} /> may be absent</li>
            <li>memory training may help autistic children develop social skills</li>
        </ul>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    // Generate an array of question numbers/keys to render, grouping multi-selects
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 13 - Test 2 Listening</h1>
        </div>

        <LocalAudioPlayer audioSrc={AUDIO_URLS.book13.test2} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 13 - Listening Test 2" />

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
        testNumber={2} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-13" module="listening" testNumber={2} />
          <UserTestHistory book="book-13" module="listening" testNumber={2} />
        </div>
      </div>
    </div>
  );
}