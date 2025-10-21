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


// Correct answers for IELTS Practice Tests Plus 1 - Listening Test 1
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1
  '1': 'C',
  '2': 'C',
  '3': 'D',
  '4': 'mcdonald',
  '5': 'post office box 676',
  '6': '775431',
  '7': 'credit card',
  '8': ['d', 'f'], // shirt with long sleeves, hat
  '9': ['a', 'f'], // camping, bed and breakfast
  '10': 'after the exams',

  // Section 2
  '11': '473',
  '12': 'open 2-seater',
  '13': 'smooth',
  '14': '180 kilometres',
  '15': 'frame and engine',
  '16': 'instrument panel',
  '17': '30',
  '18': 'light aircraft',
  '19': 'wings',
  '20': 'rear wheels',

  // Section 3
  '21': 'out and about',
  '22': 'the university',
  '23': 'B',
  '24': 'C',
  '25': 'B',
  '26': 'A',
  '27': 'x',
  '28': 'south american',
  '29': '✓',
  '30': '✓✓',

  // Section 4
  '31': 'human activity',
  '32': 'farming and drainage',
  '33': 'dirty thirties',
  '34': 'dry thunderstorms',
  '35': 'machine operators',
  '36': 'drought',
  '37': 'irrigation',
  '38': 'two-thirds',
  '39': 'salty',
  '40': 'crops',
};

export default function PracticeTestsPlus1Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '8': [],
    '9': [],
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
    if (questionNumber === '8' || questionNumber === '9') {
      const maxSelections = 2;
      setMultipleAnswers(prev => {
        const current = prev[questionNumber] || [];
        if (current.includes(value)) {
          return { ...prev, [questionNumber]: current.filter(v => v !== value) };
        } else if (current.length < maxSelections) {
          return { ...prev, [questionNumber]: [...current, value] };
        }
        return prev;
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionNumber]: value }));
    }
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber];
    
    // Handle multi-select questions
    if (questionNumber === '8' || questionNumber === '9') {
      const userAnswers = new Set(multipleAnswers[questionNumber] || []);
      const correctAnswersSet = new Set(correctAnswer as string[]);
      return userAnswers.size === correctAnswersSet.size && 
             [...userAnswers].every(answer => correctAnswersSet.has(answer));
    }
    
    const userAnswer = answers[questionNumber] || '';
    
    // If no answer provided, return false
    if (!userAnswer || userAnswer.trim() === '') {
      return false;
    }

    if (typeof correctAnswer === 'string') {
      // For multiple choice questions (single letter answers)
      if (correctAnswer.length === 1 && 'ABCDEFG'.includes(correctAnswer.toUpperCase())) {
        return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
      }
      // For fill-in-the-blank questions
      return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
    }
    
    return false;
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Handle single-answer questions
    for (let i = 1; i <= 40; i++) {
        const qNumStr = String(i);
        if (qNumStr === '8' || qNumStr === '9') continue; // Skip multi-select questions

        if (answers[qNumStr] !== undefined && correctAnswers[qNumStr] !== undefined) {
          if (checkAnswerWithMatching(answers[qNumStr], correctAnswers[qNumStr] as string, qNumStr)) {
            correctCount++;
          }
        }
    }

    // Handle multi-select questions (8 and 9) - each question worth 1 mark if fully correct
    if (checkAnswer('8')) {
      correctCount++;
    }
    if (checkAnswer('9')) {
      correctCount++;
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
        multipleAnswers: multipleAnswers,
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || multipleAnswers[questionNum] || '',
          correctAnswer: correctAnswers[questionNum],
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database
      await saveTestScore({
        userId: session?.user?.id || null,
        book:'practice-tests-plus-1',
        module: 'listening',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined
      });
      
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

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[], isMultiSelect = false) => {
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, etc.
          const isSelected = isMultiSelect 
            ? (multipleAnswers[questionNumber] || []).includes(optionLetter.toLowerCase())
            : answers[questionNumber] === optionLetter.toLowerCase();
          
          const isCorrectOption = submitted && 
            (isMultiSelect 
              ? (correctAnswers[questionNumber] as string[]).includes(optionLetter.toLowerCase())
              : correctAnswers[questionNumber] === optionLetter);
          
          const showAsCorrect = isCorrectOption;
          const showAsWrong = submitted && isSelected && !showAsCorrect;
          
          return (
            <div key={optionLetter} 
                 className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${
                   submitted
                     ? showAsCorrect
                       ? 'bg-green-100 border-green-500'
                       : showAsWrong
                         ? 'bg-red-100 border-red-500'
                         : isSelected
                           ? 'bg-blue-100 border-blue-500'
                           : 'border-gray-200'
                     : isSelected 
                       ? 'bg-blue-100 border-blue-500'
                       : 'border-gray-200 hover:bg-gray-50'
                 }`}
                 onClick={() => !submitted && handleMultipleChoice(questionNumber, optionLetter.toLowerCase())}>
              <input
                type={isMultiSelect ? "checkbox" : "radio"}
                checked={isSelected}
                onChange={() => !submitted && handleMultipleChoice(questionNumber, optionLetter.toLowerCase())}
                disabled={submitted}
                className="form-checkbox"
              />
              <span className="font-semibold">{optionLetter}</span>
              <span>{option}</span>
              {submitted && showAsCorrect && (
                <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
              )}
              {submitted && showAsWrong && (
                <XCircle className="w-4 h-4 text-red-600 ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const ieltsScore = getIELTSListeningScore(score);

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800">SECTION 1 - Questions 1-10</h3>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-4">
            <p className="font-medium mb-2">Example</p>
            <p>Which course does the man suggest?</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">A</span>
                <span>2 day</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">C</span>
                <span>5 day</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 rounded-md p-2">
                <span className="text-blue-600 font-bold">B</span>
                <span>4 day</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">D</span>
                <span>6 day</span>
              </div>
            </div>
          </div>
          <p>Questions 1–3: Circle the correct letters A–D.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { q: '1', question: "How much is the beginner's course?", options: ["$190", "$320", "$330", "$430"] },
            { q: '2', question: "What does the club insurance cover?", options: ["injury to yourself", "injury to your equipment", "damage to other people's property", "loss of personal belongings"] },
            { q: '3', question: "How do the girls want to travel?", options: ["public transport", "private bus", "car", "bicycle"] },
          ].map(({ q, question, options }) => (
            <div key={q}>
              <p className="font-semibold">{q}. {question}</p>
              {renderMultipleChoiceQuestion(q, options)}
              {submitted && !checkAnswer(q) && (
                <p className="text-sm text-red-600 mt-1 ml-4">Correct answer: {correctAnswers[q]}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><p>Questions 4–7: Complete the form below. Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
        <CardContent className="p-4 border rounded-lg space-y-2 bg-gray-50 text-center">
            <h4 className="font-bold text-lg">TELEPHONE MEMO</h4>
            <p><strong>Name:</strong> Marla Gentle</p>
            <div className="flex justify-center items-center">
              <strong>Address:</strong> Clo Mr & Mrs 
              <Input 
                className={`w-40 mx-2 ${submitted ? (checkAnswer('4') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                placeholder="4" 
                value={answers['4'] || ''} 
                onChange={e => handleInputChange('4', e.target.value)} 
                disabled={!isTestStarted || submitted}
              />
              {submitted && !checkAnswer('4') && (
                <span className="text-sm text-red-600 ml-2">({correctAnswers['4']})</span>
              )}
            </div>
            <div className="flex justify-center items-center">
              <Input 
                className={`w-40 mx-2 ${submitted ? (checkAnswer('5') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                placeholder="5" 
                value={answers['5'] || ''} 
                onChange={e => handleInputChange('5', e.target.value)} 
                disabled={!isTestStarted || submitted}
              />, Newcastle
              {submitted && !checkAnswer('5') && (
                <span className="text-sm text-red-600 ml-2">({correctAnswers['5']})</span>
              )}
            </div>
            <div className="flex justify-center items-center">
              <strong>Fax no:</strong> 0249 
              <Input 
                className={`w-40 mx-2 ${submitted ? (checkAnswer('6') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                placeholder="6" 
                value={answers['6'] || ''} 
                onChange={e => handleInputChange('6', e.target.value)} 
                disabled={!isTestStarted || submitted}
              />
              {submitted && !checkAnswer('6') && (
                <span className="text-sm text-red-600 ml-2">({correctAnswers['6']})</span>
              )}
            </div>
            <div className="flex justify-center items-center">
              <strong>Type of Card:</strong>
              <Input 
                className={`w-40 mx-2 ${submitted ? (checkAnswer('7') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                placeholder="7" 
                value={answers['7'] || ''} 
                onChange={e => handleInputChange('7', e.target.value)} 
                disabled={!isTestStarted || submitted}
              />
              {submitted && !checkAnswer('7') && (
                <span className="text-sm text-red-600 ml-2">({correctAnswers['7']})</span>
              )}
            </div>
        </CardContent>
      </Card>

      {[
        {q: '8', question: "Which TWO of the following items must people take with them?", options: ["sandals", "old clothes", "pullover", "shirt with long sleeves", "soft drinks", "hat", "sunglasses"]},
        {q: '9', question: "Which TWO accommodation options mentioned are near the paragliding school?", options: ["camping", "youth hostel", "family", "backpackers' inn", "caravan park", "bed and breakfast", "cheap hotel"]}
      ].map(({q, question, options}) => (
        <Card key={q}>
            <CardHeader><p>Question {q}: Circle TWO letters A-G. {question}</p></CardHeader>
            <CardContent>
                {renderMultipleChoiceQuestion(q, options, true)}
                {submitted && (
                  <div className="mt-2 text-sm text-blue-700 p-2 bg-blue-50 rounded">
                    Correct Answers: {(correctAnswers[q] as string[]).join(', ').toUpperCase()}
                  </div>
                )}
            </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><p>Question 10: Write <strong>NO MORE THAN THREE WORDS</strong> for your answer.</p></CardHeader>
        <CardContent>
            <p>Which weekend do the girls decide to go?</p>
            <Input 
              className={`${submitted ? (checkAnswer('10') ? 'bg-green-100' : 'bg-red-100') : ''}`}
              placeholder="10" 
              value={answers['10'] || ''} 
              onChange={e => handleInputChange('10', e.target.value)} 
              disabled={!isTestStarted || submitted}
            />
            {submitted && !checkAnswer('10') && (
              <p className="text-sm text-red-600 mt-1">Correct answer: {correctAnswers['10']}</p>
            )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800">SECTION 2 - Questions 11-20</h3>
      </div>
      <Card>
        <CardHeader><p>Questions 11–20: Complete the notes below. Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
        <CardContent className="p-4 border rounded-lg space-y-3 bg-gray-50">
          <img 
                src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/listening/test1/car.png" 
                alt="Agricultural Park Map" 
                className="mx-auto max-w-full h-auto rounded border shadow-lg"
              />
          {[
            {q: '11', label: 'Number made:', suffix: ''},
            {q: '12', label: 'Type of body:', suffix: ''},
            {q: '13', label: 'Engines contained capsules of mercury to ensure a', suffix: 'trip.'},
            {q: '14', label: 'Top speed:', suffix: 'per hour.'},
            {q: '15', label: 'Sold as a', suffix: 'and ...'},
            {q: '16', label: 'Main attraction:', suffix: ''},
            {q: '17', label: 'Number built (Leyat Helica):', suffix: ''},
            {q: '18', label: 'Car looks like a', suffix: 'without 19 ...'},
            {q: '19', label: '... without', suffix: ''},
            {q: '20', label: 'Steering used the', suffix: ''},
          ].map(({q, label, suffix}) => (
            <div key={q} className="flex items-center">
              <label className="w-2/5 shrink-0">{label}</label>
              <Input 
                className={`w-3/5 ${submitted ? (checkAnswer(q) ? 'bg-green-100' : 'bg-red-100') : ''}`}
                placeholder={q} 
                value={answers[q] || ''} 
                onChange={e => handleInputChange(q, e.target.value)} 
                disabled={!isTestStarted || submitted}
              />
              {suffix && <span className="ml-2">{suffix}</span>}
              {submitted && !checkAnswer(q) && (
                <span className="ml-2 text-sm text-red-600">({correctAnswers[q]})</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800">SECTION 3 - Questions 21-30</h3>
      </div>
      <Card>
          <CardHeader><p>Questions 21–22: Write <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <span>Title of project: </span>
                <Input 
                  className={`ml-2 ${submitted ? (checkAnswer('21') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                  placeholder="21" 
                  value={answers['21'] || ''} 
                  onChange={e => handleInputChange('21', e.target.value)} 
                  disabled={!isTestStarted || submitted}
                />
                {submitted && !checkAnswer('21') && (
                  <span className="text-sm text-red-600 ml-2">({correctAnswers['21']})</span>
                )}
              </div>
              <div className="flex items-center">
                <span>Focus of project: entertainment away from </span>
                <Input 
                  className={`ml-2 ${submitted ? (checkAnswer('22') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                  placeholder="22" 
                  value={answers['22'] || ''} 
                  onChange={e => handleInputChange('22', e.target.value)} 
                  disabled={!isTestStarted || submitted}
                />
                {submitted && !checkAnswer('22') && (
                  <span className="text-sm text-red-600 ml-2">({correctAnswers['22']})</span>
                )}
              </div>
            </div>
          </CardContent>
      </Card>
      <Card>
        <CardHeader><p>Questions 23–26: Circle the correct letters A–C.</p></CardHeader>
        <CardContent className="space-y-6">
          {/* Question 23 with image */}
          <div>
            <div className="mb-4">
              <p className="font-semibold">23. Which chart shows the percentage of cinema seats provided by the different cinema houses?</p>
              {renderMultipleChoiceQuestion('23', ["Pie Chart A", "Pie Chart B", "Pie Chart C"])}
              {submitted && !checkAnswer('23') && (
                <p className="text-sm text-red-600 mt-1">Correct answer: {correctAnswers['23']}</p>
              )}
            </div>
            <img 
              src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/listening/test1/pie.png" 
              alt="Pie Charts showing cinema seats distribution" 
              className="mx-auto max-w-full h-auto rounded border shadow-lg mb-6"
            />
          </div>

          {/* Question 24 with image */}
          <div>
            <div className="mb-4">
              <p className="font-semibold">24. What graph shows the relative popularity of different cinemas?</p>
              {renderMultipleChoiceQuestion('24', ["Bar Graph A", "Bar Graph B", "Bar Graph C"])}
              {submitted && !checkAnswer('24') && (
                <p className="text-sm text-red-600 mt-1">Correct answer: {correctAnswers['24']}</p>
              )}
            </div>
            <img 
              src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/listening/test1/bar.png" 
              alt="Bar Graphs showing cinema popularity" 
              className="mx-auto max-w-full h-auto rounded border shadow-lg mb-6"
            />
          </div>

          {/* Question 25 without image */}
          <div className="mb-4">
            <p className="font-semibold">25. What did Rosie and Mike realise about the two theatres?</p>
            {renderMultipleChoiceQuestion('25', ["The prices were very similar.", "They were equally popular.", "They offered the same facilities."])}
            {submitted && !checkAnswer('25') && (
              <p className="text-sm text-red-600 mt-1">Correct answer: {correctAnswers['25']}</p>
            )}
          </div>

          {/* Question 26 with image */}
          <div>
            <div className="mb-4">
              <p className="font-semibold">26. Which graph shows comparative attendance for cinema and theatre?</p>
              {renderMultipleChoiceQuestion('26', ["Line Graph A", "Line Graph B", "Line Graph C"])}
              {submitted && !checkAnswer('26') && (
                <p className="text-sm text-red-600 mt-1">Correct answer: {correctAnswers['26']}</p>
              )}
            </div>
            <img 
              src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/listening/test1/line.png" 
              alt="Line Graphs comparing cinema and theatre attendance" 
              className="mx-auto max-w-full h-auto rounded border shadow-lg"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><p>Questions 27–30: Complete the chart below. Write NO MORE THAN TWO WORDS or use ONE of the symbols for each answer. (X poor, ✓ OK, ✓✓ excellent)</p></CardHeader>
        <CardContent>
            <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Club</th>
                    <th className="p-2 border">Type of music</th>
                    <th className="p-2 border">Quality of venue</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td className="p-2 border">The Blues Club</td>
                      <td className="p-2 border">Blues</td>
                      <td className="p-2 border">
                        <Input 
                          className={`${submitted ? (checkAnswer('27') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                          placeholder="27" 
                          value={answers['27'] || ''} 
                          onChange={e => handleInputChange('27', e.target.value)} 
                          disabled={!isTestStarted || submitted}
                        />
                        {submitted && !checkAnswer('27') && (
                          <span className="text-sm text-red-600 ml-1">({correctAnswers['27']})</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border">The Sansue</td>
                      <td className="p-2 border">
                        <Input 
                          className={`${submitted ? (checkAnswer('28') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                          placeholder="28" 
                          value={answers['28'] || ''} 
                          onChange={e => handleInputChange('28', e.target.value)} 
                          disabled={!isTestStarted || submitted}
                        />
                        {submitted && !checkAnswer('28') && (
                          <span className="text-sm text-red-600 ml-1">({correctAnswers['28']})</span>
                        )}
                      </td>
                      <td className="p-2 border">✓✓</td>
                    </tr>
                    <tr>
                      <td className="p-2 border">Pier Hotel</td>
                      <td className="p-2 border">Folk</td>
                      <td className="p-2 border">
                        <Input 
                          className={`${submitted ? (checkAnswer('29') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                          placeholder="29" 
                          value={answers['29'] || ''} 
                          onChange={e => handleInputChange('29', e.target.value)} 
                          disabled={!isTestStarted || submitted}
                        />
                        {submitted && !checkAnswer('29') && (
                          <span className="text-sm text-red-600 ml-1">({correctAnswers['29']})</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border">Baldrock Café</td>
                      <td className="p-2 border">Rock</td>
                      <td className="p-2 border">
                        <Input 
                          className={`${submitted ? (checkAnswer('30') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                          placeholder="30" 
                          value={answers['30'] || ''} 
                          onChange={e => handleInputChange('30', e.target.value)} 
                          disabled={!isTestStarted || submitted}
                        />
                        {submitted && !checkAnswer('30') && (
                          <span className="text-sm text-red-600 ml-1">({correctAnswers['30']})</span>
                        )}
                      </td>
                    </tr>
                </tbody>
            </table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">SECTION 4 - Questions 31-40</h3>
        </div>
        <Card>
            <CardHeader><p>Questions 31–40: Complete the notes below using NO MORE THAN THREE WORDS for each answer.</p></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center">
                  <span>Main focus of lecture: the impact of </span>
                  <Input 
                    className={`w-48 inline-block ml-2 ${submitted ? (checkAnswer('31') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    placeholder="31" 
                    value={answers['31'] || ''} 
                    onChange={e => handleInputChange('31', e.target.value)} 
                    disabled={!isTestStarted || submitted}
                  />
                  <span className="ml-2">on the occurrence of dust storms.</span>
                  {submitted && !checkAnswer('31') && (
                    <span className="text-sm text-red-600 ml-2">({correctAnswers['31']})</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span>Two main types of impact: B) remove protective plants, e.g. </span>
                  <Input 
                    className={`w-48 inline-block ml-2 ${submitted ? (checkAnswer('32') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                    placeholder="32" 
                    value={answers['32'] || ''} 
                    onChange={e => handleInputChange('32', e.target.value)} 
                    disabled={!isTestStarted || submitted}
                  />
                  <span className="ml-2">and ...</span>
                  {submitted && !checkAnswer('32') && (
                    <span className="text-sm text-red-600 ml-2">({correctAnswers['32']})</span>
                  )}
                </div>
                
                <table className="w-full border-collapse border">
                    <tbody>
                        <tr>
                          <td className="p-2 border">USA 'dust bowl'</td>
                          <td className="p-2 border">
                            <div className="flex items-center">
                              <span>Decade renamed the </span>
                              <Input 
                                className={`ml-2 ${submitted ? (checkAnswer('33') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                placeholder="33" 
                                value={answers['33'] || ''} 
                                onChange={e => handleInputChange('33', e.target.value)} 
                                disabled={!isTestStarted || submitted}
                              />
                              {submitted && !checkAnswer('33') && (
                                <span className="text-sm text-red-600 ml-2">({correctAnswers['33']})</span>
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border">Arizona</td>
                          <td className="p-2 border">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span>Worst dust clouds arise from </span>
                                <Input 
                                  className={`ml-2 ${submitted ? (checkAnswer('34') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                  placeholder="34" 
                                  value={answers['34'] || ''} 
                                  onChange={e => handleInputChange('34', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                />
                                {submitted && !checkAnswer('34') && (
                                  <span className="text-sm text-red-600 ml-2">({correctAnswers['34']})</span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span>Dust deposits are hazardous to </span>
                                <Input 
                                  className={`ml-2 ${submitted ? (checkAnswer('35') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                  placeholder="35" 
                                  value={answers['35'] || ''} 
                                  onChange={e => handleInputChange('35', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                />
                                {submitted && !checkAnswer('35') && (
                                  <span className="text-sm text-red-600 ml-2">({correctAnswers['35']})</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border">Sahara</td>
                          <td className="p-2 border">
                            <div className="flex items-center">
                              <span>Increased wind erosion has occurred along with long-term </span>
                              <Input 
                                className={`ml-2 ${submitted ? (checkAnswer('36') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                placeholder="36" 
                                value={answers['36'] || ''} 
                                onChange={e => handleInputChange('36', e.target.value)} 
                                disabled={!isTestStarted || submitted}
                              />
                              {submitted && !checkAnswer('36') && (
                                <span className="text-sm text-red-600 ml-2">({correctAnswers['36']})</span>
                              )}
                            </div>
                          </td>
                        </tr>
                    </tbody>
                </table>

                <h4 className="font-semibold text-center mt-4">Drying-up of Aral Sea</h4>
                <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center">
                      <span>Intensive </span>
                      <Input 
                        className={`mx-2 ${submitted ? (checkAnswer('37') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                        placeholder="37" 
                        value={answers['37'] || ''} 
                        onChange={e => handleInputChange('37', e.target.value)} 
                        disabled={!isTestStarted || submitted}
                      />
                      <span>in Central Asian Republics</span>
                      {submitted && !checkAnswer('37') && (
                        <span className="text-sm text-red-600 ml-2">({correctAnswers['37']})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <span>Total volume of water in lake reduced by </span>
                      <Input 
                        className={`mx-2 ${submitted ? (checkAnswer('38') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                        placeholder="38" 
                        value={answers['38'] || ''} 
                        onChange={e => handleInputChange('38', e.target.value)} 
                        disabled={!isTestStarted || submitted}
                      />
                      {submitted && !checkAnswer('38') && (
                        <span className="text-sm text-red-600 ml-2">({correctAnswers['38']})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <span>Lake has become more </span>
                      <Input 
                        className={`mx-2 ${submitted ? (checkAnswer('39') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                        placeholder="39" 
                        value={answers['39'] || ''} 
                        onChange={e => handleInputChange('39', e.target.value)} 
                        disabled={!isTestStarted || submitted}
                      />
                      {submitted && !checkAnswer('39') && (
                        <span className="text-sm text-red-600 ml-2">({correctAnswers['39']})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <span>Serious effects on </span>
                      <Input 
                        className={`mx-2 ${submitted ? (checkAnswer('40') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                        placeholder="40" 
                        value={answers['40'] || ''} 
                        onChange={e => handleInputChange('40', e.target.value)} 
                        disabled={!isTestStarted || submitted}
                      />
                      <span>nearby</span>
                      {submitted && !checkAnswer('40') && (
                        <span className="text-sm text-red-600 ml-2">({correctAnswers['40']})</span>
                      )}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );

  const renderResults = () => {
    // Generate an array of question numbers to render, grouping 8&9
    const questionKeysToRender = Object.keys(correctAnswers).filter(k => k !== '8' && k !== '9');
    questionKeysToRender.splice(7, 0, '8', '9'); // Insert at positions 8 and 9
  
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
                if (qKey === '8' || qKey === '9') {
                    const userChoices = multipleAnswers[qKey] || [];
                    const correctChoices = correctAnswers[qKey] as string[];
                    const isFullyCorrect = checkAnswer(qKey);
                    const statusClass = isFullyCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

                    return (
                        <div key={qKey} className={`p-3 rounded border ${statusClass}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Q{qKey}</span>
                                {isFullyCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="text-sm">
                                <div className="mb-1">
                                  <span>Your answer: </span>
                                  <span className={isFullyCorrect ? 'text-green-700' : 'text-red-700'}>
                                    {userChoices.map(c => c.toUpperCase()).join(', ') || 'No answer'}
                                  </span>
                                </div>
                                <div>
                                  <span>Correct: </span>
                                  <span className="text-green-700 font-medium">{correctChoices.map(c => c.toUpperCase()).join(', ')}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Select 2 options</div>
                            </div>
                        </div>
                    );
                }

                const isCorrect = checkAnswer(qKey);
                const userAnswer = answers[qKey] || '';
                const correctAnswer = correctAnswers[qKey];
                
                return (
                  <div key={qKey} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Q{qKey}</span>
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="text-sm">
                      <div className="mb-1">
                        <span>Your answer: </span>
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer || 'No answer'}</span>
                      </div>
                      <div>
                        <span>Correct: </span>
                        <span className="text-green-700 font-medium">{correctAnswer}</span>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="practice-tests-plus-1" module="listening" testNumber={1} />
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              IELTS Practice Tests Plus 1 - Listening Test 1
            </h1>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                30 minutes
              </div>
              <div>40 questions</div>
            </div>
          </div>
        </div>

        <LocalAudioPlayer
          audioSrc={AUDIO_URLS.plus1.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="IELTS Practice Tests Plus 1 - Listening Test 1"
        />

        {/* Section Navigation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((section) => (
              <Button 
                key={section} 
                variant={currentSection === section ? "default" : "outline"} 
                onClick={() => setCurrentSection(section)} 
                className="w-24" 
                disabled={!isTestStarted || submitted}
              >
                Section {section}
              </Button>
            ))}
          </div>
          {!isTestStarted && !submitted && (
            <div className="text-center mt-2">
              <p className="text-sm text-blue-600">Start the test to navigate between sections.</p>
            </div>
          )}
        </div>

        {/* Test Content */}
        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-yellow-800 text-center">
                Please start the audio player above to begin the test. You'll have 30 minutes to complete all 40 questions.
              </p>
            </CardContent>
          </Card>
        )}
        
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        {/* Results */}
        {submitted && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center">Test Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center space-x-8">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{score}/40</div>
                    <div className="text-sm text-gray-600">Raw Score</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{ieltsScore}</div>
                    <div className="text-sm text-gray-600">IELTS Band</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!submitted && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubmit} 
              size="lg" 
              className="px-8"
              disabled={!isTestStarted || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
            {!isTestStarted && (
              <p className="text-sm text-blue-600 mt-2">
                Start the test to enable submission.
              </p>
            )}
          </div>
        )}

      {/* Results Popup */}
      {showResultsPopup && renderResults()}
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics book="practice-tests-plus-1" module="listening" testNumber={1} />
        <UserTestHistory book="practice-tests-plus-1" module="listening" testNumber={1} />
      </div>
        
      </div>
    </div>
  );
}