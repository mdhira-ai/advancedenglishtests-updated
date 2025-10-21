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
import { checkAnswer } from '@/lib/answer-matching';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';

// Correct answers for Cambridge IELTS 12, Test 1
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1: Questions 1-10
  '1': 'mountains',
  '2': 'horse',
  '3': 'garden(s)',
  '4': 'lunch',
  '5': 'map',
  '6': 'experience',
  '7': 'Ratchesons',
  '8': 'helmet',
  '9': 'shops',
  '10': '267',

  // Section 2: Questions 11-20
  '11': 'A',
  '12': 'A',
  '13': 'C',
  '14': 'C',
  '17': 'F',
  '18': 'C',
  '19': 'D',
  '20': 'B',

  // Section 3: Questions 21-30
  '21': 'B',
  '22': 'C',
  '23': 'C',
  '24': 'budget',
  '25': 'employment',
  '26': 'safety',
  '27': 'insurance',
  '28': 'diary',
  '29': 'database',
  '30': 'museum',

  // Section 4: Questions 31-40
  '31': 'damage',
  '32': 'side effects',
  '33': 'bridge',
  '34': 'confusion',
  '35': 'smartphone',
  '36': 'resources',
  '37': 'unnecessary/not necessary',
  '38': 'chocolate bar',
  '39': 'problem',
  '40': 'market share'
};

const multiSelectCorrectAnswers: { [key: string]: string[] } = {
    '15-16': ['A', 'E'],
};


export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '15-16': [],
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase().trim() }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };
  
  const handleMultiSelect = (questionKey: string, value: string, maxSelections: number) => {
    setMultipleAnswers(prev => {
      const currentAnswers = prev[questionKey] || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter(ans => ans !== value)
        : currentAnswers.length < maxSelections
          ? [...currentAnswers, value]
          : currentAnswers; // Limit selections
      return { ...prev, [questionKey]: newAnswers };
    });
  };

  const checkAnswerForQuestion = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber] || '';
    if (!userAnswer) return false;
    const correctAnswer = correctAnswers[questionNumber];
    if (typeof correctAnswer !== 'string') return false;
    
    return checkAnswer(userAnswer, correctAnswer, questionNumber);
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    // Calculate score for single-answer questions
    for (const qNum of Object.keys(correctAnswers)) {
      if (checkAnswerForQuestion(qNum)) {
        correctCount++;
      }
    }

    // Calculate score for multi-select questions
    for (const qKey of Object.keys(multiSelectCorrectAnswers)) {
      const userSelections = multipleAnswers[qKey] || [];
      const correctSelections = multiSelectCorrectAnswers[qKey];
      userSelections.forEach(selection => {
        if (correctSelections.includes(selection)) {
          correctCount++;
        }
      });
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
        multipleAnswers: multipleAnswers,
        results: Object.keys(correctAnswers).map(qNum => ({
          questionNumber: qNum,
          userAnswer: answers[qNum] || '',
          correctAnswer: correctAnswers[qNum],
          isCorrect: checkAnswerForQuestion(qNum)
        })).concat(Object.keys(multiSelectCorrectAnswers).map(qKey => ({
          questionNumber: qKey,
          userAnswer: multipleAnswers[qKey].join(', '),
          correctAnswer: multiSelectCorrectAnswers[qKey].join(', '),
          isCorrect: (multipleAnswers[qKey] || []).every(ans => multiSelectCorrectAnswers[qKey].includes(ans)) && multipleAnswers[qKey].length === multiSelectCorrectAnswers[qKey].length
        }))),
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        timeTaken
      };
      
      await saveTestScore({
        userId: session?.user?.id || null,
        book: 'book-12',
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

  const handleTestStart = () => setIsTestStarted(true);

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswerForQuestion(questionNumber) ? 'correct' : 'incorrect';
  };
  
  const getMultiSelectGroupStatus = (questionKey: string) => {
      if (!submitted) return 'default';
      const userAnswers = multipleAnswers[questionKey] || [];
      const correctAnswers = multiSelectCorrectAnswers[questionKey];
      if (userAnswers.length === 0) return 'incorrect';
      const allCorrect = userAnswers.length === correctAnswers.length && userAnswers.every(ans => correctAnswers.includes(ans));
      return allCorrect ? 'correct' : 'incorrect';
  }

  const renderSection1 = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Section 1 - Questions 1-10</CardTitle>
        <p className="text-sm font-semibold">Write ONE WORD AND/OR A NUMBER for each answer.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="font-bold text-lg text-center">FAMILY EXCURSIONS</h3>
        
        <div>
          <h4 className="font-semibold text-md mb-2">Cruise on a lake</h4>
          <p>• Example: Travel on an old ... steamship ...</p>
          <div className="flex items-center gap-2">
            <p>• Can take photos of the</p>
            <span>1</span>
            <Input type="text" value={answers['1'] || ''} onChange={(e) => handleInputChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500' : ''}`} />
            <p>that surround the lake</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-md mb-2">Farm visit</h4>
          <p>• Children can help feed the sheep</p>
          <div className="flex items-center gap-2">
            <p>• Visit can include a 40-minute ride on a</p>
            <span>2</span>
            <Input type="text" value={answers['2'] || ''} onChange={(e) => handleInputChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500' : ''}`} />
          </div>
          <div className="flex items-center gap-2">
            <p>• Visitors can walk in the farm’s</p>
            <span>3</span>
            <Input type="text" value={answers['3'] || ''} onChange={(e) => handleInputChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500' : ''}`} />
            <p>by the lake</p>
          </div>
          <div className="flex items-center gap-2">
            <span>4</span>
            <Input type="text" value={answers['4'] || ''} onChange={(e) => handleInputChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500' : ''}`} />
            <p>is available at extra cost</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-md mb-2">Cycling trips</h4>
          <p>• Cyclists explore the Back Road</p>
          <div className="flex items-center gap-2">
            <p>• A</p>
            <span>5</span>
            <Input type="text" value={answers['5'] || ''} onChange={(e) => handleInputChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500' : ''}`} />
            <p>is provided</p>
          </div>
          <div className="flex items-center gap-2">
            <p>• Only suitable for cyclists who have some</p>
            <span>6</span>
            <Input type="text" value={answers['6'] || ''} onChange={(e) => handleInputChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500' : ''}`} />
          </div>
          <p className="ml-4">• Bikes can be hired from <span>7</span> <Input type="text" value={answers['7'] || ''} onChange={(e) => handleInputChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500' : ''}`} /> (near the Cruise Ship Terminal)</p>
          <div className="ml-4">
            <p>• Cyclists need:</p>
            <p className="ml-4">- a repair kit</p>
            <p className="ml-4">- food and drink</p>
            <div className="flex items-center gap-2 ml-4">
                <p>- a</p>
                <span>8</span>
                <Input type="text" value={answers['8'] || ''} onChange={(e) => handleInputChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500' : ''}`} />
                <p>(can be hired)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <p>• There are no</p>
            <span>9</span>
            <Input type="text" value={answers['9'] || ''} onChange={(e) => handleInputChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500' : ''}`} />
            <p>or accommodation in the area</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-md mb-2">Cost</h4>
          <div className="flex items-center gap-2">
            <p>• Total cost for whole family of cruise and farm visit: $</p>
            <span>10</span>
            <Input type="text" value={answers['10'] || ''} onChange={(e) => handleInputChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500' : ''}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
      <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Questions 11-14</h4>
          <p className="mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold text-center text-lg mb-4">Talk to new kitchen assistants</h3>
          {['11', '12', '13', '14'].map(qNum => {
            const questionText = {
              '11': 'According to the manager, what do most people like about the job of kitchen assistant?',
              '12': 'The manager is concerned about some of the new staff’s',
              '13': 'The manager says that the day is likely to be busy for kitchen staff because',
              '14': 'Only kitchen staff who are 18 or older are allowed to use',
            }[qNum];
            const options = {
              '11': ['the variety of work', 'the friendly atmosphere', 'the opportunities for promotion'],
              '12': ['jewellery.', 'hair styles.', 'shoes.'],
              '13': ['it is a public holiday.', 'the head chef is absent.', 'the restaurant is almost fully booked.'],
              '14': ['the waste disposal unit.', 'the electric mixer.', 'the meat slicer.'],
            }[qNum];
            return (
              <div key={qNum} className="mb-4">
                <p className="font-medium mb-2">{qNum}. {questionText}</p>
                <div className={`${getAnswerStatus(qNum) === 'correct' ? 'bg-green-50' : getAnswerStatus(qNum) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                  {options?.map((option, index) => {
                    const optionValue = String.fromCharCode(65 + index);
                    return (
                        <label key={optionValue} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`question-${qNum}`} value={optionValue} checked={answers[qNum] === optionValue} onChange={() => handleMultipleChoice(qNum, optionValue)} disabled={!isTestStarted || isSubmitting} /><span className="text-sm">{optionValue}. {option}</span></label>
                    );
                  })}
                  {submitted && <div className="mt-1 text-sm text-gray-600">Correct answer: {correctAnswers[qNum]}</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 15 and 16</h4>
            <p className="mb-4">Choose TWO letters, A-E.</p>
            <p className="font-medium mb-2">According to the manager, which TWO things can make the job of kitchen assistant stressful?</p>
            <div className={`${getMultiSelectGroupStatus('15-16') === 'correct' ? 'bg-green-50' : getMultiSelectGroupStatus('15-16') === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                {['They have to follow orders immediately.', 'The kitchen gets very hot.', 'They may not be able to take a break.', 'They have to do overtime.', 'The work is physically demanding.'].map((option, index) => {
                    const optionValue = String.fromCharCode(65 + index);
                    return (
                      <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          value={optionValue} 
                          checked={(multipleAnswers['15-16'] || []).includes(optionValue)} 
                          onChange={() => handleMultiSelect('15-16', optionValue, 2)} 
                          disabled={!isTestStarted || isSubmitting} 
                        />
                        <span className="text-sm">{optionValue}. {option}</span>
                      </label>
                    );
                })}
                {submitted && <div className="mt-1 text-sm text-gray-600">Correct answers: {multiSelectCorrectAnswers['15-16'].join(', ')}</div>}
            </div>
        </div>
        
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 17-20</h4>
            <p className="mb-4">What is the responsibility of each of the following restaurant staff? Choose FOUR answers from the box and write the correct letter, A-F, next to Questions 17-20.</p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4 border">
                <h4 className="font-bold text-center mb-2">Responsibilities</h4>
                <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <p>A training courses</p><p>B food stocks</p><p>C first aid</p><p>D breakages</p><p>E staff discounts</p><p>F timetables</p>
                </div>
            </div>
            <div className="space-y-2">
                {[ {num: '17', name: 'Joy Parkins'}, {num: '18', name: 'David Field'}, {num: '19', name: 'Dexter Wills'}, {num: '20', name: 'Mike Smith'} ].map(({num, name}) => (
                    <div key={num} className="flex items-center gap-4">
                        <span className="font-medium w-32">{num} {name}</span>
                        <Input type="text" value={answers[num] || ''} onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())} maxLength={1} disabled={!isTestStarted || isSubmitting} className={`w-16 text-center ${getAnswerStatus(num) === 'correct' ? 'border-green-500' : getAnswerStatus(num) === 'incorrect' ? 'border-red-500' : ''}`}/>
                        {submitted && <div className="text-sm text-gray-600">Correct: {correctAnswers[num]}</div>}
                    </div>
                ))}
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
            <h4 className="font-semibold mb-2">Questions 21-23</h4>
            <p className="mb-4">Choose the correct letter, A, B or C.</p>
            <h3 className="font-bold text-center text-lg mb-4">Paper on Public Libraries</h3>
            {['21', '22', '23'].map(qNum => {
                const questionText = {
                    '21': 'What will be the main topic of Trudie and Stewart’s paper?',
                    '22': 'They agree that one disadvantage of free digitalised books is that',
                    '23': 'Stewart expects that in the future libraries will',
                }[qNum];
                const options = {
                    '21': ['how public library services are organised in different countries', 'how changes in society are reflected in public libraries', 'how the funding of public libraries has changed'],
                    '22': ['they may take a long time to read.', 'they can be difficult to read.', 'they are generally old.'],
                    '23': ['maintain their traditional function.', 'become centres for local communities.', 'no longer contain any books.'],
                }[qNum];
                return (
                <div key={qNum} className="mb-4">
                    <p className="font-medium mb-2">{qNum}. {questionText}</p>
                    <div className={`${getAnswerStatus(qNum) === 'correct' ? 'bg-green-50' : getAnswerStatus(qNum) === 'incorrect' ? 'bg-red-50' : ''} p-2 rounded`}>
                        {options?.map((option, index) => {
                            const optionValue = String.fromCharCode(65 + index);
                            return (<label key={optionValue} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`question-${qNum}`} value={optionValue} checked={answers[qNum] === optionValue} onChange={() => handleMultipleChoice(qNum, optionValue)} disabled={!isTestStarted || isSubmitting} /><span className="text-sm">{optionValue}. {option}</span></label>);
                        })}
                        {submitted && <div className="mt-1 text-sm text-gray-600">Correct answer: {correctAnswers[qNum]}</div>}
                    </div>
                </div>
                )
            })}
        </div>
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 24-30</h4>
            <p className="mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-bold text-center text-lg mb-4">Study of local library: possible questions</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>whether it has a <span>24</span> <Input type="text" value={answers['24'] || ''} onChange={(e) => handleInputChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500' : ''}`} /> of its own</li>
                    <li>its policy regarding noise of various kinds</li>
                    <li>how it’s affected by laws regarding all aspects of <span>25</span> <Input type="text" value={answers['25'] || ''} onChange={(e) => handleInputChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                    <li>how the design needs to take the <span>26</span> <Input type="text" value={answers['26'] || ''} onChange={(e) => handleInputChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500' : ''}`} /> of customers into account</li>
                    <li>what <span>27</span> <Input type="text" value={answers['27'] || ''} onChange={(e) => handleInputChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500' : ''}`} /> is required in case of accidents</li>
                    <li>why a famous person’s <span>28</span> <Input type="text" value={answers['28'] || ''} onChange={(e) => handleInputChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500' : ''}`} /> is located in the library</li>
                    <li>whether it has a <span>29</span> <Input type="text" value={answers['29'] || ''} onChange={(e) => handleInputChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500' : ''}`} /> of local organisations</li>
                    <li>how it’s different from a library in a <span>30</span> <Input type="text" value={answers['30'] || ''} onChange={(e) => handleInputChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`w-32 inline ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
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
        <p className="text-sm font-semibold">Write NO MORE THAN TWO WORDS for each answer.</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold text-center text-lg mb-4">Four business values</h3>
          <ul className="list-disc list-inside space-y-3">
            <li>Many business values can result in <span>31</span> <Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} className={`w-32 inline ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
            <li>Senior managers need to understand and deal with the potential <span>32</span> <Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} className={`w-32 inline ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500' : ''}`} /> that may result.</li>
            
            <li className="font-semibold mt-4">Collaboration</li>
            <ul className="list-inside space-y-2 ml-6">
                <li>During a training course, the speaker was in a team that had to build a <span>33</span> <Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} className={`w-32 inline ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500' : ''}`} /></li>
                <li>Other teams experienced <span>34</span> <Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} className={`w-32 inline ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500' : ''}`} /> from trying to collaborate.</li>
                <li>The speaker's team won because they reduced collaboration.</li>
                <li>Sales of a <span>35</span> <Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} className={`w-32 inline ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500' : ''}`} /> were poor because of collaboration.</li>
            </ul>

            <li className="font-semibold mt-4">Industriousness</li>
             <ul className="list-inside space-y-2 ml-6">
                <li>Hard work may be a bad use of various company <span>36</span> <Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} className={`w-32 inline ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
                <li>The word 'lazy' in this context refers to people who avoid doing tasks that are <span>37</span> <Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} className={`w-40 inline ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
            </ul>

            <li className="font-semibold mt-4">Creativity</li>
             <ul className="list-inside space-y-2 ml-6">
                <li>An advertising campaign for a <span>38</span> <Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} className={`w-32 inline ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500' : ''}`} /> was memorable but failed to boost sales.</li>
                <li>Creativity should be used as a response to a particular <span>39</span> <Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} className={`w-32 inline ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500' : ''}`} />.</li>
            </ul>

            <li className="font-semibold mt-4">Excellence</li>
             <ul className="list-inside space-y-2 ml-6">
                <li>According to one study, on average, pioneers had a <span>40</span> <Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} className={`w-32 inline ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500' : ''}`} /> that was far higher than that of followers.</li>
                <li>Companies that always aim at excellence may miss opportunities.</li>
            </ul>
          </ul>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 12 - Test 1 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book12.test1}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={isSubmitting}
          testDuration={40}
          title="Cambridge IELTS 12 - Listening Test 1"
        />
        
        <div className="flex justify-center space-x-2 my-6">
            {[1, 2, 3, 4].map((section) => (
              <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>
                Section {section}
              </Button>
            ))}
        </div>
        
        {!isTestStarted && !submitted && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200"><CardContent className="p-4 text-center text-yellow-800"><p className="font-semibold">Please start the audio to begin the test.</p></CardContent></Card>
        )}
        
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        <div className="flex justify-center mt-6">
          <Button onClick={handleSubmit} disabled={!isTestStarted || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
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
                  {Array.from({ length: 40 }, (_, i) => i + 1).map(qNum => {
                    const questionNumber = String(qNum);
                    
                    if(qNum === 15 || qNum === 16){
                        if(qNum === 16) return null; // Render 15-16 as one block
                        const qKey = '15-16';
                        const userAnswers = multipleAnswers[qKey] || [];
                        const correctAnswers = multiSelectCorrectAnswers[qKey];
                        const correctUserAnswers = userAnswers.filter(ans => correctAnswers.includes(ans));
                        const isFullyCorrect = correctUserAnswers.length === correctAnswers.length && userAnswers.length === correctAnswers.length;

                        return (
                             <div key={qKey} className={`p-3 rounded border ${isFullyCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">Q15-16</span>
                                    {isFullyCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                                </div>
                                <div className="text-sm">
                                    <p>Your: <span className={isFullyCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswers.join(', ') || 'No answer'}</span></p>
                                    <p>Correct: <span className="text-green-700 font-medium">{correctAnswers.join(', ')}</span></p>
                                </div>
                            </div>
                        );
                    }

                    const isCorrect = checkAnswerForQuestion(questionNumber);
                    return (
                      <div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">Q{questionNumber}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm">
                            <p>Your: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{answers[questionNumber] || 'No answer'}</span></p>
                            <p>Correct: <span className="text-green-700 font-medium">{correctAnswers[questionNumber]}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
      <PageViewTracker 
        book="book-12" 
        module="listening" 
        testNumber={1} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-12" module="listening" testNumber={1} />
          <UserTestHistory book="book-12" module="listening" testNumber={1} />
        </div>
      </div>
    </div>
  );
}