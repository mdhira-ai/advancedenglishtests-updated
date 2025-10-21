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
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';

// Correct answers for Cambridge 10, Listening Test 4
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'Pargetter',
  '2': 'East',
  '3': 'library',
  '4': 'morning/mornings',
  '5': 'postbox',
  '6': 'prices',
  '7': 'glass',
  '8': 'cooker',
  '9': 'week',
  '10': 'fence',

  // Section 2: Questions 11-20
  '11': 'B',
  '12': 'B',
  '13': 'A',
  '14': 'A',
  '15': 'C',
  '16': 'trains',
  '17': 'dark',
  '18': 'games',
  '19': 'guided tour',
  '20': 'ladder/ladders',

  // Section 3: Questions 21-30
  '21': 'A', // 21&22 in either order
  '22': 'E',
  '23': 'B', // 23&24 in either order
  '24': 'C',
  '25': 'D',
  '26': 'F',
  '27': 'G',
  '28': 'B',
  '29': 'E',
  '30': 'C',

  // Section 4: Questions 31-40
  '31': 'C',
  '32': 'B',
  '33': 'C',
  '34': 'metal/metals',
  '35': 'space',
  '36': 'memory',
  '37': 'solar',
  '38': 'oil',
  '39': 'waste',
  '40': 'tests'
};

const correctSet21_22 = ['A', 'E'];
const correctSet23_24 = ['B', 'C'];

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21_22': [],
    '23_24': [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();

  // Set test start time
  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []); // Empty dependency array to run only once

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value.toLowerCase()
    }));
  };
  
  const handleMatchingChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value.toUpperCase()
    }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const handleMultiSelect = (questionKey: '21_22' | '23_24', value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const maxAnswers = 2;
        let newAnswers;

        if (currentAnswers.includes(value)) {
            newAnswers = currentAnswers.filter(ans => ans !== value);
        } else {
            if (currentAnswers.length < maxAnswers) {
                newAnswers = [...currentAnswers, value];
            } else {
                newAnswers = currentAnswers; 
            }
        }
        return { ...prev, [questionKey]: newAnswers };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    // For the "Choose TWO" question sets
    if (['21', '22'].includes(questionNumber)) {
        const userChoices = multipleAnswers['21_22'] || [];
        const userAnswerForThisQ = questionNumber === '21' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '21' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return false;

        const isCorrect = correctSet21_22.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect;
    }

    if (['23', '24'].includes(questionNumber)) {
        const userChoices = multipleAnswers['23_24'] || [];
        const userAnswerForThisQ = questionNumber === '23' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '23' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return false;

        const isCorrect = correctSet23_24.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect;
    }

    // For regular questions
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    
    // For the "Choose TWO" question sets
    if (['21', '22'].includes(questionNumber)) {
        const userChoices = multipleAnswers['21_22'] || [];
        const userAnswerForThisQ = questionNumber === '21' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '21' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return 'incorrect';

        const isCorrect = correctSet21_22.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect ? 'correct' : 'incorrect';
    }

    if (['23', '24'].includes(questionNumber)) {
        const userChoices = multipleAnswers['23_24'] || [];
        const userAnswerForThisQ = questionNumber === '23' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '23' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return 'incorrect';

        const isCorrect = correctSet23_24.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect ? 'correct' : 'incorrect';
    }

    // For regular questions
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber) ? 'correct' : 'incorrect';
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    
    // Score regular questions (excluding multi-select questions)
    for (const qNum in correctAnswers) {
      if (['21', '22', '23', '24'].includes(qNum)) continue;
      if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
        correctCount++;
      }
    }

    // Score questions 21 & 22
    const userChoices21_22 = [...new Set(multipleAnswers['21_22'] || [])]; // Use Set to handle unique choices
    userChoices21_22.forEach(choice => {
      if (correctSet21_22.includes(choice)) {
        correctCount++;
      }
    });

    // Score questions 23 & 24
    const userChoices23_24 = [...new Set(multipleAnswers['23_24'] || [])]; // Use Set to handle unique choices
    userChoices23_24.forEach(choice => {
      if (correctSet23_24.includes(choice)) {
        correctCount++;
      }
    });

    return correctCount;
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
        multipleAnswers: multipleAnswers || {},
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || multipleAnswers?.[questionNum] || '',
          correctAnswer: correctAnswers[questionNum],
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-10',
        module: 'listening',
        testNumber: 4,
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

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[]) => (
    <div className="space-y-2">
      {options.map((option, index) => {
        const optionValue = String.fromCharCode(65 + index);
        return (
          <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name={`question-${questionNumber}`} value={optionValue} checked={answers[questionNumber] === optionValue} onChange={() => handleMultipleChoice(questionNumber, optionValue)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4"/>
            <span className="text-sm">{optionValue}. {option}</span>
          </label>
        );
      })}
    </div>
  );

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm text-gray-600">Complete the notes and table below.</p>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">THORNDYKE'S BUILDERS</h3>
          <p>Customer heard about Thorndyke's from a <span className="underline font-medium">friend</span> (Example)</p>
          <div className="space-y-3">
            <p>Name: Edith <strong>1</strong> <Input type="text" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Address: Flat 4, <strong>2</strong> <Input type="text" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} /> Park Flats (Behind the <strong>3</strong> <Input type="text" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} />)</p>
            <p>Phone number: 875934</p>
            <p>Best time to contact customer: during the <strong>4</strong> <Input type="text" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Where to park: opposite entrance next to the <strong>5</strong> <Input type="text" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
            <p>Needs full quote showing all the jobs and the <strong>6</strong> <Input type="text" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} /></p>
          </div>
        </div>
        <div className="mt-6 border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Area</th><th className="p-2">Work to be done</th><th className="p-2">Notes</th></tr></thead>
                <tbody>
                    <tr className="border-t">
                        <td className="p-2 font-semibold align-top">Kitchen</td>
                        <td className="p-2 align-top">Replace the <strong>7</strong> <Input type="text" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} /> in the door<br/>Paint wall above the <strong>8</strong> <Input type="text" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} /></td>
                        <td className="p-2 align-top">Fix tomorrow<br/>Strip paint and plaster approximately one <strong>9</strong> <Input type="text" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} /> in advance</td>
                    </tr>
                    <tr className="border-t bg-gray-50">
                        <td className="p-2 font-semibold">Garden</td>
                        <td className="p-2">One <strong>10</strong> <Input type="text" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} /> needs replacing</td>
                        <td className="p-2">(end of garden)</td>
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
          <h4 className="font-semibold mb-2">Questions 11-15</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4"><h3 className="font-bold text-center text-lg">MANHAM PORT</h3></div>
          <div className="space-y-6">
            {[
              { q: '11', text: 'Why did a port originally develop at Manham?', options: ['It was safe from enemy attack.', 'It was convenient for river transport.', 'It had a good position on the sea coast.'] },
              { q: '12', text: "What caused Manham's sudden expansion during the Industrial Revolution?", options: ['the improvement in mining techniques', 'the increase in demand for metals', 'the discovery of tin in the area'] },
              { q: '13', text: 'Why did rocks have to be sent away from Manham to be processed?', options: ['shortage of fuel', 'poor transport systems', 'lack of skills among local people'] },
              { q: '14', text: 'What happened when the port declined in the twentieth century?', options: ['The workers went away.', 'Traditional skills were lost.', 'Buildings were used for new purposes.'] },
              { q: '15', text: 'What did the Manham Trust hope to do?', options: ['discover the location of the original port', 'provide jobs for the unemployed', 'rebuild the port complex'] }
            ].map(({ q, text, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {text}</p>
                <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {renderMultipleChoiceQuestion(q, options)}
                  {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: {correctAnswers[q]}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 16-20</h4>
          <p className="text-sm mb-4">Complete the table below.</p>
          <p className="text-sm font-semibold mb-4">Write NO MORE THAN TWO WORDS for each answer.</p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <caption className="p-2 font-bold text-lg bg-gray-100">Tourist attractions in Manham</caption>
              <thead className="bg-gray-200"><tr><th className="p-2">Place</th><th className="p-2">Features and activities</th><th className="p-2">Advice</th></tr></thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2">copper mine</td>
                  <td className="p-2">specially adapted miners' <strong>16</strong> <Input type="text" value={answers['16'] || ''} onChange={e => handleInputChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500' : ''}`} /> take visitors into the mountain</td>
                  <td className="p-2">the mine is <strong>17</strong> <Input type="text" value={answers['17'] || ''} onChange={e => handleInputChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500' : ''}`} /> and enclosed</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="p-2">village school</td>
                  <td className="p-2">classrooms and a special exhibition of <strong>18</strong> <Input type="text" value={answers['18'] || ''} onChange={e => handleInputChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-24 ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500' : ''}`} /></td>
                  <td className="p-2">a <strong>19</strong> <Input type="text" value={answers['19'] || ''} onChange={e => handleInputChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500' : ''}`} /> is recommended</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">'The George' (old sailing ship)</td>
                  <td className="p-2">the ship's wheel (was lost but has now been restored)</td>
                  <td className="p-2">children shouldn't use the <strong>20</strong> <Input type="text" value={answers['20'] || ''} onChange={e => handleInputChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500' : ''}`} /> </td>
                </tr>
              </tbody>
            </table>
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
          <h4 className="font-semibold mb-2">Questions 21 & 22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO skills did Laura improve as a result of her work placement?</p>
          
          <div className={`${submitted ? (getAnswerStatus('21') === 'correct' || getAnswerStatus('22') === 'correct' ? 'bg-green-50' : 'bg-red-50') : ''} p-2 rounded`}>
            <div className="space-y-2">
              {['communication', 'design', 'IT', 'marketing', 'organisation'].map((option, index) => {
                const optionValue = String.fromCharCode(65 + index); // A, B, C, D, E
                const isSelected = multipleAnswers['21_22'].includes(optionValue);
                return (
                  <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isSelected}
                      onChange={() => handleMultiSelect('21_22', optionValue)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{optionValue}. {option}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-2 flex items-center gap-2">
                {(getAnswerStatus('21') === 'correct' && getAnswerStatus('22') === 'correct') ? 
                  <CheckCircle className="w-4 h-4 text-green-500" /> : 
                  <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="text-xs text-gray-600">Correct answers: A and C</span>
              </div>
            )}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 23 & 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO immediate benefits did the company get from Laura's work placement?</p>
          
          <div className={`${submitted ? (getAnswerStatus('23') === 'correct' || getAnswerStatus('24') === 'correct' ? 'bg-green-50' : 'bg-red-50') : ''} p-2 rounded`}>
            <div className="space-y-2">
              {['updates for its software', 'cost savings', 'an improved image', 'new clients', 'a growth in sales'].map((option, index) => {
                const optionValue = String.fromCharCode(65 + index); // A, B, C, D, E
                const isSelected = multipleAnswers['23_24'].includes(optionValue);
                return (
                  <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isSelected}
                      onChange={() => handleMultiSelect('23_24', optionValue)}
                      disabled={!isTestStarted || isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{optionValue}. {option}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-2 flex items-center gap-2">
                {(getAnswerStatus('23') === 'correct' && getAnswerStatus('24') === 'correct') ? 
                  <CheckCircle className="w-4 h-4 text-green-500" /> : 
                  <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="text-xs text-gray-600">Correct answers: B and C</span>
              </div>
            )}
          </div>
        </div>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <p className="text-sm mb-4">What source of information should Tim use at each of the following stages of the work placement?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-G, next to questions 25-30.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="bg-gray-100 p-4 rounded-lg mb-4 h-fit"><h4 className="font-bold text-center mb-2">Sources of information</h4><ul className="space-y-1 text-sm"><li>A company manager</li><li>B company's personnel department</li><li>C personal tutor</li><li>D psychology department</li><li>E mentor</li><li>F university careers officer</li><li>G internet</li></ul></div>
            <div>
              <h4 className="font-semibold mb-3">Stages of the work placement procedure</h4>
              <div className="space-y-3">
                {[
                  { q: '25', text: 'obtaining booklet' },
                  { q: '26', text: 'discussing options' },
                  { q: '27', text: 'getting updates' },
                  { q: '28', text: 'responding to invitation for interview' },
                  { q: '29', text: 'informing about outcome of interview' },
                  { q: '30', text: 'requesting a reference' }
                ].map(({ q, text }) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="w-60"><strong>{q}</strong> {text}</span>
                    <Input type="text" value={answers[q] || ''} onChange={e => handleMatchingChange(q, e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${getAnswerStatus(q) === 'correct' ? 'border-green-500' : getAnswerStatus(q) === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1}/>
                    {submitted && <span className="text-xs">Correct: {correctAnswers[q]}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 4 - Questions 31-40</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 31-33</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4"><h3 className="font-bold text-center text-lg">Nanotechnology: technology on a small scale</h3></div>
          <div className="space-y-6">
            {[
              {q: '31', text: 'The speaker says that one problem with nanotechnology is that', options: ['it could threaten our way of life.', 'it could be used to spy on people.', 'it is misunderstood by the public.']},
              {q: '32', text: 'According to the speaker, some scientists believe that nano-particles', options: ['should be restricted to secure environments.', 'should be used with more caution.', 'should only be developed for essential products.']},
              {q: '33', text: "In the speaker's opinion, research into nanotechnology", options: ['has yet to win popular support.', 'could be seen as unethical.', 'ought to be continued.']}
            ].map(({ q, text, options }) => (
              <div key={q}>
                <p className="font-medium mb-2">{q}. {text}</p>
                <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {renderMultipleChoiceQuestion(q, options)}
                  {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: {correctAnswers[q]}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 34-40</h4>
            <p className="text-sm text-gray-600 mb-2">Complete the notes below.</p>
            <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-center text-lg mb-4">Uses of Nanotechnology</h3>
                <div>
                    <p className="font-semibold">Transport</p>
                    <ul className="list-disc list-inside pl-4 space-y-3">
                        <li>Nanotechnology could allow the development of stronger <strong>34</strong> <Input type="text" value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                        <li>Planes would be much lighter in weight.</li>
                        <li><strong>35</strong> <Input type="text" value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} /> travel will be made available to the masses.</li>
                    </ul>
                </div>
                <div>
                    <p className="font-semibold">Technology</p>
                    <ul className="list-disc list-inside pl-4 space-y-3">
                        <li>Computers will be even smaller, faster, and will have a greater <strong>36</strong> <Input type="text" value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                        <li><strong>37</strong> <Input type="text" value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} /> energy will become more affordable.</li>
                    </ul>
                </div>
                 <div>
                    <p className="font-semibold">The Environment</p>
                    <ul className="list-disc list-inside pl-4 space-y-3">
                        <li>Nano-robots could rebuild the ozone layer.</li>
                        <li>Pollutants such as <strong>38</strong> <Input type="text" value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} /> could be removed from water more easily.</li>
                        <li>There will be no <strong>39</strong> <Input type="text" value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} /> from manufacturing.</li>
                    </ul>
                </div>
                 <div>
                    <p className="font-semibold">Health and Medicine</p>
                    <ul className="list-disc list-inside pl-4 space-y-3">
                        <li>New methods of food production could eradicate famine.</li>
                        <li>Analysis of medical <strong>40</strong> <Input type="text" value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} /> will be speeded up.</li>
                        <li>Life expectancy could be increased.</li>
                    </ul>
                </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 10 - Test 4 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book10.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 10 - Listening Test 4" />
        <Card className="mb-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>Answer all questions as you listen.</li><li>You have 10 minutes at the end to transfer your answers.</li></ul></CardContent></Card>
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? "default" : "outline"} onClick={() => setCurrentSection(s)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {s}</Button>)}</div>{!isTestStarted && !submitted && <div className="text-center mt-2"><p className="text-sm text-blue-600"><strong>Note:</strong> Section navigation is enabled after you start the test.</p></div>}</div>
        {!isTestStarted && !submitted && <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4"><div className="text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></div></CardContent></Card>}
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        <div className="flex gap-4 justify-center"><Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Raw Score</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm text-gray-600">IELTS Band</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-purple-600">{Math.round((score / 40) * 100)}%</div><div className="text-sm text-gray-600">Percentage</div></div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 40 }, (_, i) => i + 1).map(qNum => {
                    const questionNum = String(qNum);
                    
                    if (['21', '22'].includes(questionNum)) {
                        if (questionNum === '22') return null;
                        const userAnswers = multipleAnswers['21_22'].join(', ') || 'No answer';
                        const isBlockCorrect = (getAnswerStatus('21') === 'correct' && getAnswerStatus('22') === 'correct');
                        return (<div key="21-22" className={`p-3 rounded border ${isBlockCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-medium">Q21-22</span>{isBlockCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div><div className="text-sm"><div className="mb-1"><span className="text-gray-600">Your: </span><span className={isBlockCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswers}</span></div><div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctSet21_22.join(' & ')}</span></div></div></div>);
                    }
                     if (['23', '24'].includes(questionNum)) {
                        if (questionNum === '24') return null;
                        const userAnswers = multipleAnswers['23_24'].join(', ') || 'No answer';
                        const isBlockCorrect = (getAnswerStatus('23') === 'correct' && getAnswerStatus('24') === 'correct');
                        return (<div key="23-24" className={`p-3 rounded border ${isBlockCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-medium">Q23-24</span>{isBlockCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div><div className="text-sm"><div className="mb-1"><span className="text-gray-600">Your: </span><span className={isBlockCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswers}</span></div><div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctSet23_24.join(' & ')}</span></div></div></div>);
                    }
                    
                    const userAnswer = answers[questionNum] || 'No answer';
                    const correctAnswer = correctAnswers[questionNum];
                    const isCorrect = getAnswerStatus(questionNum) === 'correct';
                    
                    return (
                      <div key={questionNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{questionNum}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm"><div className="mb-1"><span className="text-gray-600">Your: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></div><div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAnswer}</span></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
      {/* Analytics Components */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <PageViewTracker 
          book="book-10"
          module="listening"
          testNumber={4}
        />
        <TestStatistics 
          book="book-10"
          module="listening"
          testNumber={4}
        />
        <UserTestHistory 
          book="book-10"
          module="listening"
          testNumber={4}
        />
      </div>
    </div>
  );
}