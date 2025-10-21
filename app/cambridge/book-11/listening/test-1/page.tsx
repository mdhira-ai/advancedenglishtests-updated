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
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { TestStatistics } from '@/components/analytics/TestStatistics';
import { UserTestHistory } from '@/components/analytics/UserTestHistory';

// Correct answers for Cambridge 11, Listening Test 1
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': 'Charlton',
  '2': '115/one hundred (and) fifteen',
  '3': 'cash',
  '4': 'parking',
  '5': 'music',
  '6': 'entry',
  '7': 'stage',
  '8': 'code',
  '9': 'floors/floor',
  '10': 'decoration/decorations',

  // Section 2: Questions 11-20
  '11': 'animal/animals',
  '12': 'tools/tool',
  '13': 'shoes',
  '14': 'dog(s)/dog',
  '15': 'F',
  '16': 'G',
  '17': 'D',
  '18': 'H',
  '19': 'C',
  '20': 'A',

  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'B',
  '23': 'B',
  '24': 'C',
  '25': 'A',
  '26': 'B',
  '27': 'C',
  '28': 'A',
  '29': 'B',
  '30': 'A',

  // Section 4: Questions 31-40
  '31': 'conservation',
  '32': 'food/foods',
  '33': 'surface',
  '34': 'oxygen/O2',
  '35': 'mammals',
  '36': 'ice',
  '37': 'decline/declining/decrease',
  '38': 'map', // Corrected based on audioscript
  '39': 'migration', // Corrected based on audioscript
  '40': 'consumption',
};

export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Set test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber]?.trim() || '';
    const correctAnswer = correctAnswers[questionNumber];

    if (!userAnswer) {
      return false;
    }

    // For multiple choice or letter-based answers
    if (/^[A-I]$/.test(correctAnswer)) {
      return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    }

    // For text answers, use the imported answer matching function
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
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-11',
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

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[]) => {
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionValue = String.fromCharCode(65 + index); // A, B, C...
          const isSelected = answers[questionNumber] === optionValue;
          
          return (
            <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${questionNumber}`}
                value={optionValue}
                checked={isSelected}
                onChange={() => handleInputChange(questionNumber, optionValue)}
                disabled={!isTestStarted || isSubmitting}
                className="w-4 h-4"
              />
              <span className="text-sm">{optionValue}. {option}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">Hiring a public room</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <strong>Example:</strong> the Main Hall - seats <span className="underline">200</span>
            </div>

            <h4 className="font-semibold mt-4">Room and cost</h4>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>
                <div className="flex items-center gap-2">
                  the 
                  <span>1</span>
                  <Input
                    type="text"
                    value={answers['1'] || ''}
                    onChange={(e) => handleInputChange('1', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                   Room – seats 100
                  {submitted && getAnswerStatus('1') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('1') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                    Cost of Main Hall for Saturday evening: £
                    <span>2</span>
                    <Input
                        type="text"
                        value={answers['2'] || ''}
                        onChange={(e) => handleInputChange('2', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                     + £250 deposit
                    {submitted && getAnswerStatus('2') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('2') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  <span>3</span>
                  <Input
                    type="text"
                    value={answers['3'] || ''}
                    onChange={(e) => handleInputChange('3', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  payment is required
                  {submitted && getAnswerStatus('3') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('3') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  Cost includes use of tables and chairs and also 
                  <span>4</span>
                  <Input
                    type="text"
                    value={answers['4'] || ''}
                    onChange={(e) => handleInputChange('4', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  {submitted && getAnswerStatus('4') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('4') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>Additional charge for use of the kitchen: £25</li>
            </ul>

            <h4 className="font-semibold mt-4">Before the event</h4>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>
                <div className="flex items-center gap-2">
                    Will need a
                    <span>5</span>
                    <Input
                        type="text"
                        value={answers['5'] || ''}
                        onChange={(e) => handleInputChange('5', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-32 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                    licence
                    {submitted && getAnswerStatus('5') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('5') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                    Need to contact caretaker (Mr Evans) in advance to arrange
                    <span>6</span>
                    <Input
                        type="text"
                        value={answers['6'] || ''}
                        onChange={(e) => handleInputChange('6', e.target.value)}
                        disabled={!isTestStarted || isSubmitting}
                        className={`w-32 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`}
                    />
                    {submitted && getAnswerStatus('6') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {submitted && getAnswerStatus('6') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
            </ul>

            <h4 className="font-semibold mt-4">During the event</h4>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>The building is no smoking</li>
                <li>
                    <div className="flex items-center gap-2">
                        The band should use the
                        <span>7</span>
                        <Input
                            type="text"
                            value={answers['7'] || ''}
                            onChange={(e) => handleInputChange('7', e.target.value)}
                            disabled={!isTestStarted || isSubmitting}
                            className={`w-32 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`}
                        />
                        door at the back
                        {submitted && getAnswerStatus('7') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('7') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                </li>
                <li>Don't touch the system that controls the volume</li>
                <li>For microphones, contact the caretaker</li>
            </ul>
             <h4 className="font-semibold mt-4">After the event</h4>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <div className="flex items-center gap-2">
                        Need to know the
                        <span>8</span>
                        <Input
                            type="text"
                            value={answers['8'] || ''}
                            onChange={(e) => handleInputChange('8', e.target.value)}
                            disabled={!isTestStarted || isSubmitting}
                            className={`w-32 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`}
                        />
                        for the cleaning cupboard
                        {submitted && getAnswerStatus('8') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('8') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                </li>
                 <li>
                    <div className="flex items-center gap-2">
                        The
                        <span>9</span>
                        <Input
                            type="text"
                            value={answers['9'] || ''}
                            onChange={(e) => handleInputChange('9', e.target.value)}
                            disabled={!isTestStarted || isSubmitting}
                            className={`w-32 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`}
                        />
                        must be washed and rubbish placed in black bags
                        {submitted && getAnswerStatus('9') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('9') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                </li>
                 <li>
                    <div className="flex items-center gap-2">
                        All
                        <span>10</span>
                        <Input
                            type="text"
                            value={answers['10'] || ''}
                            onChange={(e) => handleInputChange('10', e.target.value)}
                            disabled={!isTestStarted || isSubmitting}
                            className={`w-32 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`}
                        />
                        must be taken down
                        {submitted && getAnswerStatus('10') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('10') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                </li>
                <li>Chairs and tables must be piled up</li>
            </ul>
          </div>
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
        {/* Questions 11-14 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 11-14</h4>
          <p className="text-sm text-gray-600">Complete the notes below.</p>
          <p className="text-sm font-semibold mb-4">Write ONE WORD for each answer.</p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Fiddy Working Heritage Farm</h3>
            <h4 className="font-semibold mb-2">Advice about visiting the farm</h4>
            <ul className="list-disc list-inside space-y-3">
              <li>
                <div className="flex items-center gap-2">
                  Visitors should take care not to harm any <span>11</span>
                  <Input
                    type="text"
                    value={answers['11'] || ''}
                    onChange={(e) => handleInputChange('11', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  {submitted && getAnswerStatus('11') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('11') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  not touch any <span>12</span>
                  <Input
                    type="text"
                    value={answers['12'] || ''}
                    onChange={(e) => handleInputChange('12', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  {submitted && getAnswerStatus('12') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('12') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  wear <span>13</span>
                  <Input
                    type="text"
                    value={answers['13'] || ''}
                    onChange={(e) => handleInputChange('13', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  {submitted && getAnswerStatus('13') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('13') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  not bring <span>14</span>
                  <Input
                    type="text"
                    value={answers['14'] || ''}
                    onChange={(e) => handleInputChange('14', e.target.value)}
                    disabled={!isTestStarted || isSubmitting}
                    className={`w-32 ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500' : ''}`}
                  />
                  into the farm, with certain exceptions
                  {submitted && getAnswerStatus('14') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {submitted && getAnswerStatus('14') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Questions 15-20 */}
        <div className="mb-8">
          <h4 className="font-semibold mb-4">Questions 15-20</h4>
          <p className="text-sm mb-4">Label the map below.</p>
          <p className="text-sm font-semibold mb-4">Write the correct letter, A-I, next to questions 15-20.</p>
          <div className="text-center mb-4">
            <img 
              src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/listening/test1/map.png" 
              alt="Fiddy Working Heritage Farm Map" 
              className="mx-auto max-w-full h-auto rounded border shadow-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '15', label: 'Scarecrow' },
              { num: '16', label: 'Maze' },
              { num: '17', label: 'Café' },
              { num: '18', label: 'Black Barn' },
              { num: '19', label: 'Covered picnic area' },
              { num: '20', label: 'Fiddy House' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-2">
                <span className="w-6">{num}</span>
                <span className="flex-1">{label}</span>
                <Input
                  type="text"
                  value={answers[num] || ''}
                  onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())}
                  disabled={!isTestStarted || isSubmitting}
                  className={`w-16 text-center ${getAnswerStatus(num) === 'correct' ? 'border-green-500' : getAnswerStatus(num) === 'incorrect' ? 'border-red-500' : ''}`}
                  maxLength={1}
                />
                {submitted && getAnswerStatus(num) === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {submitted && getAnswerStatus(num) === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 3 - Questions 21-30</CardTitle>
        <p className="text-sm font-semibold">Choose the correct letter, A, B or C.</p>
      </CardHeader>
      <CardContent>
        <h3 className="font-bold text-lg mb-4">Study on Gender in Physics</h3>
        <div className="space-y-6">
          {[
            { q: '21', question: "The students in Akira Miyake's study were all majoring in", options: ['physics.', 'psychology or physics.', 'science, technology, engineering or mathematics.'] },
            { q: '22', question: "The aim of Miyake's study was to investigate", options: ['what kind of women choose to study physics.', "a way of improving women's performance in physics.", 'whether fewer women than men study physics at college.'] },
            { q: '23', question: 'The female physics students were wrong to believe that', options: ['the teachers marked them in an unfair way.', 'the male students expected them to do badly.', "their test results were lower than the male students'."] },
            { q: '24', question: "Miyake's team asked the students to write about", options: ['what they enjoyed about studying physics.', 'the successful experiences of other people.', 'something that was important to them personally.'] },
            { q: '25', question: 'What was the aim of the writing exercise done by the subjects?', options: ['to reduce stress.', 'to strengthen verbal ability.', 'to encourage logical thinking.'] },
            { q: '26', question: 'What surprised the researchers about the study?', options: ['how few students managed to get A grades.', 'the positive impact it had on physics results for women.', 'the difference between male and female performance.'] },
            { q: '27', question: "Greg and Lisa think Miyake's results could have been affected by", options: ['the length of the writing task.', 'the number of students who took part.', 'the information the students were given.'] },
            { q: '28', question: 'Greg and Lisa decide that in their own project, they will compare the effects of', options: ['two different writing tasks.', 'a writing task with an oral task.', 'two different oral tasks.'] },
            { q: '29', question: "The main finding of Smolinsky's research was that class teamwork activities", options: ['were most effective when done by all-women groups.', 'had no effect on the performance of men or women.', 'improved the results of men more than of women.'] },
            { q: '30', question: 'What will Lisa and Greg do next?', options: ['talk to a professor.', 'observe a science class.', 'look at the science timetable.'] },
          ].map(({ q, question, options }) => (
            <div key={q}>
              <p className="font-medium mb-2">{q}. {question}</p>
              <div className={`${getAnswerStatus(q) === 'correct' ? 'bg-green-50' : getAnswerStatus(q) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {renderMultipleChoiceQuestion(q, options)}
                {submitted && (
                  <div className="mt-2 flex items-center gap-2">
                    {getAnswerStatus(q) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm text-gray-600">Correct answer: {correctAnswers[q]}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
          <h3 className="font-bold text-center text-lg mb-4">Ocean Biodiversity</h3>
          <div className="space-y-4">
              <h4 className="font-semibold">Biodiversity hotspots</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                  <li>areas containing many different species</li>
                  <li>
                    <div className="flex items-center gap-2">
                        important for locating targets for <span>31</span>
                        <Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} />
                        {submitted && getAnswerStatus('31') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('31') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </li>
                  <li>at first only identified on land</li>
              </ul>

              <h4 className="font-semibold mt-4">Boris Worm, 2005</h4>
              <ul className="list-disc list-inside pl-4 space-y-3">
                  <li>identified hotspots for large ocean predators, e.g. sharks</li>
                  <li>
                     <div className="flex items-center gap-2">
                        found that ocean hotspots: were not always rich in <span>32</span>
                        <Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} />
                        {submitted && getAnswerStatus('32') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('32') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                     </div>
                  </li>
                  <li>
                     <div className="flex items-center gap-2">
                        had higher temperatures at the <span>33</span>
                        <Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} />
                        {submitted && getAnswerStatus('33') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('33') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                     </div>
                  </li>
                  <li>
                     <div className="flex items-center gap-2">
                        had sufficient <span>34</span>
                        <Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} />
                        in the water
                        {submitted && getAnswerStatus('34') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {submitted && getAnswerStatus('34') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                     </div>
                  </li>
              </ul>

               <h4 className="font-semibold mt-4">Lisa Ballance, 2007</h4>
                <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>
                        <div className="flex items-center gap-2">
                            looked for hotspots for marine <span>35</span>
                            <Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} />
                            {submitted && getAnswerStatus('35') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {submitted && getAnswerStatus('35') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                    </li>
                    <li>found these were all located where ocean currents meet</li>
                </ul>

                <h4 className="font-semibold mt-4">Census of Marine Life</h4>
                 <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>
                        <div className="flex items-center gap-2">
                            found new ocean species living: under the <span>36</span>
                            <Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} />
                            {submitted && getAnswerStatus('36') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {submitted && getAnswerStatus('36') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                    </li>
                    <li>near volcanoes on the ocean floor</li>
                </ul>

                <h4 className="font-semibold mt-4">Global Marine Species Assessment</h4>
                 <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>want to list endangered ocean species, considering:
                        <ul className='list-disc list-inside pl-6'>
                            <li>population size</li>
                            <li>geographical distribution</li>
                            <li>
                                <div className="flex items-center gap-2">
                                    rate of <span>37</span>
                                    <Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} />
                                    {submitted && getAnswerStatus('37') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {submitted && getAnswerStatus('37') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li>
                         <div className="flex items-center gap-2">
                            Aim: to assess 20,000 species and make a distribution <span>38</span>
                            <Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} /> for each one
                            {submitted && getAnswerStatus('38') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {submitted && getAnswerStatus('38') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                    </li>
                 </ul>

                <h4 className="font-semibold mt-4">Recommendations to retain ocean biodiversity</h4>
                 <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>increase the number of ocean reserves</li>
                     <li>
                        <div className="flex items-center gap-2">
                            establish <span>39</span>
                            <Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} />
                            corridors (e.g. for turtles)
                            {submitted && getAnswerStatus('39') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {submitted && getAnswerStatus('39') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                    </li>
                    <li>reduce fishing quotas</li>
                     <li>
                        <div className="flex items-center gap-2">
                            catch fish only for the purpose of <span>40</span>
                            <Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} />
                            {submitted && getAnswerStatus('40') === 'correct' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {submitted && getAnswerStatus('40') === 'incorrect' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
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
        {/* Header */}
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 11 - Test 1 Listening</h1>
        </div>

        {/* Audio Player */}
        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book11.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 11 - Listening Test 1"
        />

        {/* Test Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>This test has 4 sections with 40 questions total.</li>
              <li>You will hear each section only once.</li>
              <li>Answer all questions as you listen.</li>
              <li>For this practice test, check your answers as you go.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section Navigation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((section) => (
              <Button
                key={section}
                variant={currentSection === section ? "default" : "outline"}
                onClick={() => setCurrentSection(section)}
                className="w-24"
                disabled={!isTestStarted || isSubmitting}
              >
                Section {section}
              </Button>
            ))}
          </div>
          {!isTestStarted && !submitted && (
            <div className="text-center mt-2">
              <p className="text-sm text-blue-600">
                <strong>Note:</strong> Section navigation will be enabled after you start the test.
              </p>
            </div>
          )}
        </div>

        {/* Test Content */}
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        {/* Submit Button */}
        <div className="flex gap-4 justify-center mt-8">
          <Button 
            onClick={handleSubmit}
            disabled={!isTestStarted || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {/* Results Popup */}
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([questionNum, correctAnswer]) => {
                    const userAnswer = answers[questionNum] || '';
                    const isCorrect = checkAnswer(questionNum);
                    
                    return (
                      <div 
                        key={questionNum}
                        className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Q{questionNum}</span>
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-gray-600">Your answer: </span>
                            <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {userAnswer || 'No answer'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                                <span className="text-gray-600">Correct: </span>
                                <span className="text-green-700 font-medium">{correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => setShowResultsPopup(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-11"
        module="listening"
        testNumber={1}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <TestStatistics 
          book="book-11"
          module="listening"
          testNumber={1}
        />
        <UserTestHistory 
          book="book-11"
          module="listening"
          testNumber={1}
        />
      </div>
    </div>
  );
}