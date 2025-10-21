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

// Correct answers for all questions
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'Ardleigh',
  '2': 'newspaper',
  '3': 'theme',
  '4': 'tent',
  '5': 'castle',
  '6': 'beach/beaches',
  '7': '2020',
  '8': 'flight',
  '9': '429',
  '10': 'dinner',
  
  // Section 2: Questions 11-20
  '11': 'A', // 11 & 12 are A & C in any order
  '12': 'C',
  '13': 'health problems',
  '14': 'safety rules',
  '15': 'plan',
  '16': 'joining',
  '17': 'free entry',
  '18': 'peak',
  '19': 'guests',
  '20': 'photo card/cards',
  
  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'A',
  '23': 'B',
  '24': 'A',
  '25': 'C',
  '26': 'presentation',
  '27': 'model',
  '28': 'material/materials',
  '29': 'grant',
  '30': 'technical',
  
  // Section 4: Questions 31-40
  '31': 'gene',
  '32': 'power/powers',
  '33': 'strangers',
  '34': 'erosion',
  '35': 'islands',
  '36': 'roads',
  '37': 'fishing',
  '38': 'reproduction',
  '39': 'method/methods',
  '40': 'expansion'
};

const correctSet11_12 = ['A', 'C'];

export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '11_12': [],
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

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };

  const handleMultiSelect = (questionKey: '11_12', value: string) => {
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
    // For the "Choose TWO" question set
    if (['11', '12'].includes(questionNumber)) {
        const userChoices = multipleAnswers['11_12'] || [];
        const userAnswerForThisQ = questionNumber === '11' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '11' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return false;

        const isCorrect = correctSet11_12.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect;
    }

    // For regular questions
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    
    // For the "Choose TWO" question set
    if (['11', '12'].includes(questionNumber)) {
        const userChoices = multipleAnswers['11_12'] || [];
        const userAnswerForThisQ = questionNumber === '11' ? userChoices[0] : userChoices[1];
        const otherUserAnswer = questionNumber === '11' ? userChoices[1] : userChoices[0];

        if (!userAnswerForThisQ) return 'incorrect';

        const isCorrect = correctSet11_12.includes(userAnswerForThisQ) && userAnswerForThisQ !== otherUserAnswer;
        return isCorrect ? 'correct' : 'incorrect';
    }

    // For regular questions
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber) ? 'correct' : 'incorrect';
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    
    // Score regular questions (1-10, 13-40)
    for (const qNum in correctAnswers) {
      if (qNum === '11' || qNum === '12') continue;
      if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
        correctCount++;
      }
    }

    // Score questions 11 & 12
    const userChoices = [...new Set(multipleAnswers['11_12'] || [])]; // Use Set to handle unique choices
    userChoices.forEach(choice => {
      if (correctSet11_12.includes(choice)) {
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
        testNumber: 1,
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
 
  const handleTestStart = () => {
    setIsTestStarted(true);
  };

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[]) => (
    <div className="space-y-2">
      {options.map((option, index) => {
        const optionValue = String.fromCharCode(65 + index); // A, B, C...
        return (
          <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`question-${questionNumber}`}
              value={optionValue}
              checked={answers[questionNumber] === optionValue}
              onChange={() => handleMultipleChoice(questionNumber, optionValue)}
              disabled={!isTestStarted || isSubmitting}
              className="w-4 h-4"
            />
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
          <h3 className="font-bold text-center text-lg mb-4">SELF-DRIVE TOURS IN THE USA</h3>
          <div className="bg-white p-3 rounded"><strong>Example:</strong> Name: Andrea <span className="underline font-medium">Brown</span></div>
          
          <div className="space-y-3">
            <p>Address: 24 <Input type="text" value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} /> Road <strong>(1)</strong></p>
            <p>Postcode: BH5 2QP</p>
            <p>Phone: (mobile) 077 8664 3091</p>
            <p>Heard about company from: <Input type="text" value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} /> <strong>(2)</strong></p>
          </div>

          <h4 className="font-semibold pt-4">Possible self-drive tours</h4>
          <div className="space-y-3">
              <p><strong>Trip One:</strong></p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                  <li>Los Angeles: customer wants to visit some <Input type="text" value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} /> parks with her children <strong>(3)</strong></li>
                  <li>Yosemite Park: customer wants to stay in a lodge, not a <Input type="text" value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} /> <strong>(4)</strong></li>
              </ul>
              <p><strong>Trip Two:</strong></p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                  <li>Customer wants to see the <Input type="text" value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} /> on the way to Cambria <strong>(5)</strong></li>
                  <li>At Santa Monica: not interested in shopping</li>
                  <li>At San Diego, wants to spend time on the <Input type="text" value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`inline-block w-32 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} /> <strong>(6)</strong></li>
              </ul>
          </div>
        </div>

        <div className="mt-6 border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left"></th>
                        <th className="p-2 text-left">Number of days</th>
                        <th className="p-2 text-left">Total distance</th>
                        <th className="p-2 text-left">Price (per person)</th>
                        <th className="p-2 text-left">Includes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-t">
                        <td className="p-2 font-semibold">Trip One</td>
                        <td className="p-2">12 days</td>
                        <td className="p-2"><Input type="text" value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-24 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} /> km <strong>(7)</strong></td>
                        <td className="p-2">£525</td>
                        <td className="p-2">accommodation, car, one <Input type="text" value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-24 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} /> <strong>(8)</strong></td>
                    </tr>
                    <tr className="border-t bg-gray-50">
                        <td className="p-2 font-semibold">Trip Two</td>
                        <td className="p-2">9 days</td>
                        <td className="p-2">980 km</td>
                        <td className="p-2">£ <Input type="text" value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-24 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} /> <strong>(9)</strong></td>
                        <td className="p-2">accommodation, car, <Input type="text" value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-24 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} /> <strong>(10)</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 2 - Questions 11-20</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 11 and 12</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO facilities at the leisure club have recently been improved?</p>
          
          <div className={`${submitted ? (getAnswerStatus('11') === 'correct' || getAnswerStatus('12') === 'correct' ? 'bg-green-50' : 'bg-red-50') : ''} p-2 rounded`}>
            <div className="space-y-2">
              {[
                'the gym', 'the tracks', 'the indoor pool', 'the outdoor pool', 'the sports training for children'
              ].map((option, index) => {
                const optionValue = String.fromCharCode(65 + index);
                const isSelected = multipleAnswers['11_12'].includes(optionValue);
                
                return (
                  <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isSelected}
                      onChange={() => handleMultiSelect('11_12', optionValue)}
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
                {(getAnswerStatus('11') === 'correct' && getAnswerStatus('12') === 'correct') ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-gray-600">Correct answers: A and C</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 13-20</h4>
          <p className="text-sm text-gray-600 mb-2">Complete the notes below.</p>
          <p className="text-sm font-semibold mb-4">Write NO MORE THAN TWO WORDS for each answer.</p>
          
          <div className="bg-gray-100 p-4 rounded-lg space-y-3">
              <h3 className="font-bold text-center text-lg mb-4">Joining the leisure club</h3>
              <p><strong>Personal Assessment</strong></p>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>New members should describe any <strong>13</strong> <Input type="text" value={answers['13'] || ''} onChange={(e) => handleInputChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                <li>The <strong>14</strong> <Input type="text" value={answers['14'] || ''} onChange={(e) => handleInputChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500' : ''}`} /> will be explained to you before you use the equipment.</li>
                <li>You will be given a six-week <strong>15</strong> <Input type="text" value={answers['15'] || ''} onChange={(e) => handleInputChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
              </ul>
              <p className="pt-2"><strong>Types of membership</strong></p>
              <ul className="list-disc list-inside pl-4 space-y-3">
                <li>There is a compulsory £90 <strong>16</strong> <Input type="text" value={answers['16'] || ''} onChange={(e) => handleInputChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500' : ''}`} /> fee for members.</li>
                <li>Gold members are given <strong>17</strong> <Input type="text" value={answers['17'] || ''} onChange={(e) => handleInputChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500' : ''}`} /> to all the LP clubs.</li>
                <li>Premier members are given priority during <strong>18</strong> <Input type="text" value={answers['18'] || ''} onChange={(e) => handleInputChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500' : ''}`} /> hours.</li>
                <li>Premier members can bring some <strong>19</strong> <Input type="text" value={answers['19'] || ''} onChange={(e) => handleInputChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500' : ''}`} /> every month.</li>
                <li>Members should always take their <strong>20</strong> <Input type="text" value={answers['20'] || ''} onChange={(e) => handleInputChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-40 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500' : ''}`} /> with them.</li>
              </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 3 - Questions 21-30</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 21-25</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-center text-lg">Global Design Competition</h3>
            </div>
            <div className="space-y-6">
                <div>
                    <p className="font-medium mb-2">21. Students entering the design competition have to</p>
                    <div className={`${getAnswerStatus('21') === 'correct' ? 'bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {renderMultipleChoiceQuestion('21', ['produce an energy-efficient design.', 'adapt an existing energy-saving appliance.', 'develop a new use for current technology.'])}
                        {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: C</p>}
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">22. John chose a dishwasher because he wanted to make dishwashers</p>
                    <div className={`${getAnswerStatus('22') === 'correct' ? 'bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {renderMultipleChoiceQuestion('22', ['more appealing.', 'more common.', 'more economical.'])}
                        {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: A</p>}
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">23. The stone in John's 'Rockpool' design is used</p>
                    <div className={`${getAnswerStatus('23') === 'correct' ? 'bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {renderMultipleChoiceQuestion('23', ['for decoration.', 'to switch it on.', 'to stop water escaping.'])}
                        {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: B</p>}
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">24. In the holding chamber, the carbon dioxide</p>
                    <div className={`${getAnswerStatus('24') === 'correct' ? 'bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {renderMultipleChoiceQuestion('24', ['changes back to a gas.', 'dries the dishes.', 'is allowed to cool.'])}
                        {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: B</p>}
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">25. At the end of the cleaning process, the carbon dioxide</p>
                    <div className={`${getAnswerStatus('25') === 'correct' ? 'bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {renderMultipleChoiceQuestion('25', ['is released into the air.', 'is disposed of with the waste.', 'is collected ready to be re-used.'])}
                        {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: C</p>}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Questions 26-30</h4>
            <p className="text-sm text-gray-600 mb-2">Complete the notes below.</p>
            <p className="text-sm font-semibold mb-4">Write ONE WORD ONLY for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-3">
                    <li>John needs help preparing for his <strong>26</strong> <Input type="text" value={answers['26'] || ''} onChange={(e) => handleInputChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                    <li>The professor advises John to make a <strong>27</strong> <Input type="text" value={answers['27'] || ''} onChange={(e) => handleInputChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500' : ''}`} /> of his design.</li>
                    <li>John's main problem is getting good quality <strong>28</strong> <Input type="text" value={answers['28'] || ''} onChange={(e) => handleInputChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                    <li>The professor suggests John apply for a <strong>29</strong> <Input type="text" value={answers['29'] || ''} onChange={(e) => handleInputChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                    <li>The professor will check the <strong>30</strong> <Input type="text" value={answers['30'] || ''} onChange={(e) => handleInputChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500' : ''}`} /> information in John's written report.</li>
                </ul>
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
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">THE SPIRIT BEAR</h3>
            
            <div className="space-y-3">
                <p className="font-semibold">General facts</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>It is a white bear belonging to the black bear family.</li>
                    <li>Its colour comes from an uncommon <strong>31</strong> <Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                    <li>Local people believe that it has unusual <strong>32</strong> <Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                    <li>They protect the bear from <strong>33</strong> <Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                </ul>
            </div>

            <div className="space-y-3">
                <p className="font-semibold">Habitat</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>The bear's relationship with the forest is complex.</li>
                    <li>Tree roots stop <strong>34</strong> <Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} /> along salmon streams.</li>
                    <li>It is currently found on a small number of <strong>35</strong> <Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                </ul>
            </div>
            
            <div className="space-y-3">
                <p className="font-semibold">Threats</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>Habitat is being lost due to deforestation and construction of <strong>36</strong> <Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} /> by logging companies.</li>
                    <li>Unrestricted <strong>37</strong> <Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} /> is affecting the salmon supply.</li>
                    <li>The bears' existence is also threatened by their low rate of <strong>38</strong> <Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                </ul>
            </div>
            
            <div className="space-y-3">
                <p className="font-semibold">Going forward</p>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>Interested parties are working together.</li>
                    <li>Logging companies must improve their <strong>39</strong> <Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} /> of logging.</li>
                    <li>Maintenance and <strong>40</strong> <Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} /> of the spirit bears' territory is needed.</li>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 10 - Test 1 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book10.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 10 - Listening Test 1"
        />

        <Card className="mb-6">
          <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
          <CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>Answer all questions as you listen.</li><li>You have 10 minutes at the end to transfer your answers.</li></ul></CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((section) => (
              <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>
                Section {section}
              </Button>
            ))}
          </div>
          {!isTestStarted && !submitted && <div className="text-center mt-2"><p className="text-sm text-blue-600"><strong>Note:</strong> Section navigation will be enabled after you start the test.</p></div>}
        </div>

        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4"><div className="text-center text-yellow-800"><p className="font-semibold">Please start the audio before beginning the test.</p></div></CardContent></Card>
        )}
        
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        <div className="flex gap-4 justify-center">
          <Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([questionNum, correctAnswer]) => {
                    let userAnswer, isCorrect;
                    
                    if (['11', '12'].includes(questionNum)) {
                        const userChoices = multipleAnswers['11_12'] || [];
                        userAnswer = questionNum === '11' ? (userChoices[0] || '') : (userChoices[1] || '');
                        const otherUserAnswer = questionNum === '11' ? (userChoices[1] || '') : (userChoices[0] || '');
                        isCorrect = userAnswer && correctSet11_12.includes(userAnswer) && userAnswer !== otherUserAnswer;
                    } else {
                        userAnswer = answers[questionNum] || '';
                        isCorrect = checkAnswerWithMatching(userAnswer, correctAnswer, questionNum);
                    }
                    
                    return (
                      <div key={questionNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Q{questionNum}</span>
                          {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="text-sm">
                          <div className="mb-1"><span className="text-gray-600">Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer || 'No answer'}</span></div>
                          <div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{['11', '12'].includes(questionNum) ? "A or C" : correctAnswer}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Analytics Components */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <PageViewTracker 
          book="book-10"
          module="listening"
          testNumber={1}
        />
        <TestStatistics 
          book="book-10"
          module="listening"
          testNumber={1}
        />
        <UserTestHistory 
          book="book-10"
          module="listening"
          testNumber={1}
        />
      </div>
    </div>
  );
}