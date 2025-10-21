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

// Correct answers for Cambridge 12, Listening Test 6
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': '2.45/two forty-five',
  '2': 'band',
  '3': 'play',
  '4': 'scientist',
  '5': 'river',
  '6': 'grandparents',
  '7': 'Handsworth',
  '8': 'traditional',
  '9': 'outdoor',
  '10': 'logo',

  // Section 2: Questions 11-20
  '11': 'B',
  '12': 'C',
  '13': 'A',
  '14': 'C',
  '15': 'B',
  '16': 'F',
  '17': 'B',
  '18': 'E',
  '19': 'G',
  '20': 'C',

  // Section 3: Questions 21-30
  '21': 'C',
  '22': 'B',
  '23': 'C',
  '24': 'A',
  '25': 'C',
  '26': 'E',
  '27': 'G',
  '28': 'D',
  '29': 'C',
  '30': 'A',

  // Section 4: Questions 31-40
  '31': 'bullying',
  '32': 'superiority',
  '33': 'personality',
  '34': 'structural',
  '35': 'absence',
  '36': 'confidence',
  '37': 'visions',
  '38': 'democratic',
  '39': 'respect',
  '40': 'mediator',
};

export default function Test6Page() {
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
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber]?.trim() || '';
    const correctAnswer = correctAnswers[questionNumber];
    if (!userAnswer) return false;
    if (/^[A-I]$/.test(correctAnswer)) {
      return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    }
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
      
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
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
        book: 'book-12',
        module: 'listening',
        testNumber: 6,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
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

  const handleTestStart = () => {
    setIsTestStarted(true);
  };

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const renderMultipleChoiceQuestion = (questionNumber: string, options: string[]) => (
    <div className="space-y-2">
      {options.map((option, index) => {
        const optionValue = String.fromCharCode(65 + index);
        return (
          <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`question-${questionNumber}`}
              value={optionValue}
              checked={answers[questionNumber] === optionValue}
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

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">Events during Kenton Festival</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2"><strong>Example:</strong> Start date: <span className="underline">16th</span> May</div>

            <h4 className="font-semibold mt-4">Opening ceremony (first day)</h4>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>In town centre, starting at <span>1</span><Input type="text" value={answers['1'] || ''} onChange={(e) => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('1') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>The mayor will make a speech</li>
              <li>A <span>2</span><Input type="text" value={answers['2'] || ''} onChange={(e) => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} /> will perform{submitted && (getAnswerStatus('2') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Performance of a <span>3</span><Input type="text" value={answers['3'] || ''} onChange={(e) => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} /> about Helen Tungate (a <span>4</span><Input type="text" value={answers['4'] || ''} onChange={(e) => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} />){submitted && (getAnswerStatus('3') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)} {submitted && (getAnswerStatus('4') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Evening fireworks display situated across the <span>5</span><Input type="text" value={answers['5'] || ''} onChange={(e) => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('5') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>

            <h4 className="font-semibold mt-4">Other events</h4>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>Videos about relationships that children have with their <span>6</span><Input type="text" value={answers['6'] || ''} onChange={(e) => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('6') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Venue: <span>7</span><Input type="text" value={answers['7'] || ''} onChange={(e) => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} /> House{submitted && (getAnswerStatus('7') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Performance of <span>8</span><Input type="text" value={answers['8'] || ''} onChange={(e) => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} /> dances{submitted && (getAnswerStatus('8') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Venue: the <span>9</span><Input type="text" value={answers['9'] || ''} onChange={(e) => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} /> market in the town centre{submitted && (getAnswerStatus('9') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Time: 2 and 5 pm every day except 1st day of festival</li>
              <li>Several professional concerts and one by children</li>
              <li>Venue: library</li>
              <li>Time: 6.30 pm on the 18th</li>
              <li>Tickets available online from festival box office and from shops which have the festival <span>10</span><Input type="text" value={answers['10'] || ''} onChange={(e) => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} /> in their windows{submitted && (getAnswerStatus('10') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
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
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 11-14</h4>
          <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold text-lg mb-4">Theatre trip to Munich</h3>
          <div className="space-y-6">
            {[
              { q: '11', question: "When the group meet at the airport they will have", options: ['breakfast.', 'coffee.', 'lunch.'] },
              { q: '12', question: "The group will be met at Munich Airport by", options: ['an employee at the National Theatre.', 'a theatre manager.', 'a tour operator.'] },
              { q: '13', question: "How much will they pay per night for a double room at the hotel?", options: ['110 euros', '120 euros', '150 euros'] },
              { q: '14', question: "What type of restaurant will they go to on Tuesday evening?", options: ['an Italian restaurant', 'a Lebanese restaurant', 'a typical restaurant of the region'] },
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
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm text-gray-600 mb-2">What does the man say about the play on each of the following days?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-G, next to Questions 15-20.</p>
          <div className="border p-4 rounded-md bg-gray-50 mb-4">
            <h5 className="font-bold mb-2">Comments</h5>
            <ul className="list-none space-y-1 text-sm">
              <li><strong>A</strong> The playwright will be present.</li>
              <li><strong>B</strong> The play was written to celebrate an anniversary.</li>
              <li><strong>C</strong> The play will be performed inside a historic building.</li>
              <li><strong>D</strong> The play will be accompanied by live music.</li>
              <li><strong>E</strong> The play will be performed outdoors.</li>
              <li><strong>F</strong> The play will be performed for the first time.</li>
              <li><strong>G</strong> The performance will be attended by officials from the town.</li>
            </ul>
          </div>
          <div className="space-y-3">
            {[
              { num: '15', label: 'Wednesday' },
              { num: '16', label: 'Thursday' },
              { num: '17', label: 'Friday' },
              { num: '18', label: 'Saturday' },
              { num: '19', label: 'Sunday' },
              { num: '20', label: 'Monday' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-2">
                <span className="w-28">{label}</span>
                <Input type="text" value={answers[num] || ''} onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${getAnswerStatus(num) === 'correct' ? 'border-green-500' : getAnswerStatus(num) === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1} />
                {submitted && (getAnswerStatus(num) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
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
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 21-25</h4>
          <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold text-lg mb-4">Scandinavian Studies</h3>
          <div className="space-y-6">
            {[
              { q: '21', question: "James chose to take Scandinavian Studies because when he was a child", options: ['he was often taken to Denmark.', 'his mother spoke to him in Danish.', 'a number of Danish people visited his family.'] },
              { q: '22', question: "When he graduates, James would like to", options: ['take a postgraduate course.', 'work in the media.', 'become a translator.'] },
              { q: '23', question: "Which course will end this term?", options: ['Swedish cinema', 'Danish television programmes', 'Scandinavian literature'] },
              { q: '24', question: "They agree that James's literature paper this term will be on", options: ['19th century playwrights.', 'the Icelandic sagas.', 'modern Scandinavian novels.'] },
              { q: '25', question: "Beth recommends that James's paper should be", options: ['a historical overview of the genre.', 'an in-depth analysis of a single writer.', 'a study of the social background to the literature.'] },
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
          <h4 className="font-semibold mb-2">Questions 26-30</h4>
          <p className="text-sm text-gray-600 mb-2">Complete the flow-chart below.</p>
          <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A-G, next to Questions 26-30.</p>
          <h3 className="font-bold text-lg text-center mb-4">How James will write his paper on the Vikings</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="border p-4 rounded-md bg-gray-50 flex-shrink-0">
              <ul className="list-none space-y-1 text-sm">
                <li><strong>A</strong> bullet points</li>
                <li><strong>B</strong> film</li>
                <li><strong>C</strong> notes</li>
                <li><strong>D</strong> structure</li>
                <li><strong>E</strong> student paper</li>
                <li><strong>F</strong> textbook</li>
                <li><strong>G</strong> documentary</li>
              </ul>
            </div>
            <div className="flex-grow space-y-2">
              <div className="border p-3 rounded text-center">He'll read a <span>26</span><Input type="text" value={answers['26'] || ''} onChange={(e) => handleInputChange('26', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1} /> and choose his topic.{submitted && (getAnswerStatus('26') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</div>
              <div className="text-center">↓</div>
              <div className="border p-3 rounded text-center">He'll borrow a <span>27</span><Input type="text" value={answers['27'] || ''} onChange={(e) => handleInputChange('27', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1} /> from Beth.{submitted && (getAnswerStatus('27') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</div>
              <div className="text-center">↓</div>
              <div className="border p-3 rounded text-center">He'll plan the <span>28</span><Input type="text" value={answers['28'] || ''} onChange={(e) => handleInputChange('28', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1} /> of the paper.{submitted && (getAnswerStatus('28') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</div>
              <div className="text-center">↓</div>
              <div className="border p-3 rounded text-center">He'll read some source material and write <span>29</span><Input type="text" value={answers['29'] || ''} onChange={(e) => handleInputChange('29', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1} />.{submitted && (getAnswerStatus('29') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</div>
              <div className="text-center">↓</div>
              <div className="border p-3 rounded text-center">He'll write the paper using <span>30</span><Input type="text" value={answers['30'] || ''} onChange={(e) => handleInputChange('30', e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center inline-block mx-1 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500' : ''}`} maxLength={1} />.{submitted && (getAnswerStatus('30') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</div>
              <div className="text-center">↓</div>
              <div className="border p-3 rounded text-center">He'll write the complete paper.</div>
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
        <p className="text-sm text-gray-600">Complete the notes below.</p>
        <p className="text-sm font-semibold">Write ONE WORD ONLY for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">Conflict at work</h3>
          <div className="space-y-4">
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Conflict mostly consists of behaviour in the general category of <span>31</span><Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('31') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Often a result of people wanting to prove their <span>32</span><Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('32') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Also caused by differences in <span>33</span><Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} /> between people{submitted && (getAnswerStatus('33') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>'<span>34</span><Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block mx-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} />' conflicts: people more concerned about own team than about company{submitted && (getAnswerStatus('34') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Conflict-related stress can cause <span>35</span><Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} /> that may last for months{submitted && (getAnswerStatus('35') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>
            <h4 className="font-semibold mt-4">Chief Executives (CEOs)</h4>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Many have both <span>36</span><Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} /> and anxiety{submitted && (getAnswerStatus('36') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>May not like to have their decisions questioned</li>
              <li>There may be conflict between people who have different <span>37</span><Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('37') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>
            <h4 className="font-semibold mt-4">Other managers</h4>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>A structure that is more <span>38</span><Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} /> may create a feeling of uncertainty about who staff should report to.{submitted && (getAnswerStatus('38') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
            </ul>
            <h4 className="font-semibold mt-4">Minimising conflict</h4>
            <ul className="list-disc list-inside pl-4 space-y-3">
              <li>Bosses need to try hard to gain <span>39</span><Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} />{submitted && (getAnswerStatus('39') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
              <li>Someone from outside the company may be given the role of <span>40</span><Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline-block ml-2 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} /> in order to resolve conflicts.{submitted && (getAnswerStatus('40') === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500 inline-block ml-1" /> : <XCircle className="w-4 h-4 text-red-500 inline-block ml-1" />)}</li>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 12 - Test 6 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book12.test2}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 12 - Listening Test 6"
        />

        <Card className="mb-6">
          <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
          <CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>This test has 4 sections with 40 questions total.</li><li>You will hear each section only once.</li><li>Answer all questions as you listen.</li></ul></CardContent>
        </Card>

        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map((section) => (<Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {section}</Button>))}</div></div>

        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        <div className="flex gap-4 justify-center mt-8">
          <Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {showResultsPopup && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([questionNum, correctAnswer]) => {
                    const isCorrect = checkAnswer(questionNum);
                    return (
                      <div key={questionNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{questionNum}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm">
                          <div className="mb-1"><span className="text-gray-600">Your answer: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[questionNum] || 'No answer'}</span></div>
                          {!isCorrect && <div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAnswer}</span></div>}
                        </div>
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
      <PageViewTracker 
        book="book-12" 
        module="listening" 
        testNumber={6} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-12" module="listening" testNumber={6} />
          <UserTestHistory book="book-12" module="listening" testNumber={6} />
        </div>
      </div>
    </div>
  );
}