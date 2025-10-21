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

// Correct answers for all questions
const correctAnswers: { [key: string]: string } = {
  // Section 1: Questions 1-10
  '1': '219 442 9785', '2': '10(th) October', '3': 'manager', '4': 'Cawley', '5': 'knee', '6': '3 weeks', '7': 'tennis', '8': 'running', '9': 'shoulder', '10': 'vitamins',
  // Section 2: Questions 11-20
  '11': 'B', '12': 'C', '13': 'C', '14': 'B', '15': 'A', '16': 'H', '17': 'D', '18': 'F', '19': 'A', '20': 'E',
  // Section 3: Questions 21-30
  '21': 'B', '22': 'C', '23': 'A', '24': 'A', '25': 'E', '26': 'D', '27': 'A', '28': 'H', '29': 'G', '30': 'C', // NOTE: Original PDF key is slightly different from official errata. This is from official key.
  // Section 4: Questions 31-40
  '31': 'dances', '32': 'survival', '33': 'clouds', '34': 'festivals', '35': 'comets', '36': 'sky', '37': 'instruments', '38': 'thermometer', '39': 'storms', '40': 'telegraph',
};

export default function Test2Page() {
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toUpperCase() }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber] || '';
    const correctAnswer = correctAnswers[questionNumber];
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    for (const qNum in correctAnswers) {
      if (checkAnswer(qNum)) { correctCount++; }
    }
    return correctCount;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    const detailedAnswers = { singleAnswers: answers, score: calculatedScore, timeTaken };
    try {
      await saveTestScore({
        userId: session?.user?.id || null,
        book: 'book-14',
        module: 'listening',
        testNumber: 2,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
      });
    } catch (error) { console.error('Error submitting test:', error); }
    setSubmitted(true); setShowResultsPopup(true); setIsSubmitting(false);
  };
 
  const renderMultipleChoiceQuestion = (qNum: string, question: string, options: string[]) => (
    <div>
      <p className="font-medium mb-2">{qNum}. {question}</p>
      <div className={`p-2 rounded ${submitted ? (checkAnswer(qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
        <div className="space-y-2">
          {options.map((option, index) => {
            const optionValue = String.fromCharCode(65 + index);
            return (
              <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name={`question-${qNum}`} value={optionValue} checked={answers[qNum] === optionValue}
                  onChange={() => handleMultipleChoice(qNum, optionValue)} disabled={!isTestStarted || submitted} />
                <span>{optionValue} {option}</span>
              </label>
            );
          })}
        </div>
        {submitted && <p className="text-xs mt-1 text-gray-600">Correct: {correctAnswers[qNum]}</p>}
      </div>
    </div>
  );
  
  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">TOTAL HEALTH CLINIC</h3>
            <p><strong>PATIENT DETAILS</strong></p>
            <p><strong>Personal information</strong></p>
            <p>Example: Name - Julie Anne <span className="underline">Garcia</span></p>
            <p>Contact phone: <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
            <p>Date of birth: <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" />, 1992</p>
            <p>Occupation: works as a <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
            <p>Insurance company: <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /> Life Insurance</p>
            <p><strong>Details of the problem</strong></p>
            <p>Type of problem: pain in her left <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
            <p>When it began: <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /> ago</p>
            <p>Action already taken: has taken painkillers and applied ice</p>
            <p><strong>Other information</strong></p>
            <p>Sports played: belongs to a <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /> club, goes <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /> regularly</p>
            <p>Medical history: injured her <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /> last year, no allergies, no regular medication apart from <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-40" /></p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 11-15</h4>
          <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
          <div className="space-y-6">
              {renderMultipleChoiceQuestion('11', 'Before Queen Elizabeth I visited the castle in 1576,', ['repairs were carried out to the guest rooms.', 'a new building was constructed for her.', 'a fire damaged part of the main hall.'])}
              {renderMultipleChoiceQuestion('12', 'In 1982, the castle was sold to', ['the government.', 'the Fenys family.', 'an entertainment company.'])}
              {renderMultipleChoiceQuestion('13', 'In some of the rooms, visitors can', ['speak to experts on the history of the castle.', 'interact with actors dressed as famous characters.', 'see models of historical figures moving and talking.'])}
              {renderMultipleChoiceQuestion('14', 'In the castle park, visitors can', ['see an 800-year-old tree.', 'go to an art exhibition.', 'visit a small zoo.'])}
              {renderMultipleChoiceQuestion('15', 'At the end of the visit, the group will have', ['afternoon tea in the conservatory.', 'the chance to meet the castle\'s owners.', 'a photograph together on the Great Staircase.'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 16-20</h4>
          <p className="text-sm font-semibold mb-4">Label the plan below. Write the correct letter, A-H, next to Questions 16-20.</p>
         <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book14/listening/test2/plan.png" alt="Castle Plan" className="w-full mb-4" />
          <div className="space-y-2">
            {['Starting point for walking the walls', 'Bow and arrow display', 'Hunting birds display', 'Traditional dancing', 'Shop'].map((item, index) => {
              const qNum = String(16 + index);
              const isCorrect = submitted && checkAnswer(qNum);
              return (
                  <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                      <span className="flex-1"><strong>{qNum}</strong> {item}</span>
                      <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                  </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 21-24</h4>
            <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
            <h3 className="font-medium text-center mb-4">Woolly mammoths on St Paul's Island</h3>
            <div className="space-y-6">
              {renderMultipleChoiceQuestion('21', "How will Rosie and Martin introduce their presentation?", ['with a drawing of woolly mammoths in their natural habitat', 'with a timeline showing when woolly mammoths lived', 'with a video clip about woolly mammoths'])}
              {renderMultipleChoiceQuestion('22', "What was surprising about the mammoth tooth found by Russell Graham?", ['It was still embedded in the mammoth\'s jawbone.', 'It was from an unknown species of mammoth.', 'It was not as old as mammoth remains from elsewhere.'])}
              {renderMultipleChoiceQuestion('23', "The students will use an animated diagram to demonstrate how the mammoths", ['became isolated on the island.', 'spread from the island to other areas.', 'coexisted with other animals on the island.'])}
              {renderMultipleChoiceQuestion('24', "According to Martin, what is unusual about the date of the mammoths' extinction on the island?", ['how exact it is', 'how early it is', 'how it was established'])}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 25-30</h4>
            <p className="text-sm mb-2">What action will the students take for each of the following sections of their presentation?</p>
            <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 25-30.</p>
            <div className="border rounded-lg p-4 mb-4 text-sm grid grid-cols-2 gap-x-4">
                <div><p className="font-semibold">Actions</p><p>A make it more interactive</p><p>B reduce visual input</p><p>C add personal opinions</p><p>D contact one of the researchers</p></div>
                <div><p className="invisible font-semibold">_</p><p>E make detailed notes</p><p>F find information online</p><p>G check timing</p><p>H organise the content more clearly</p></div>
            </div>
             <div className="space-y-2">
                {['Introduction', 'Discovery of the mammoth tooth', 'Initial questions asked by the researchers', 'Further research carried out on the island', 'Findings and possible explanations', 'Relevance to the present day'].map((item, index) => {
                  const qNum = String(25 + index);
                  const isCorrect = submitted && checkAnswer(qNum);
                  return (
                      <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                          <span className="flex-1"><strong>{qNum} Sections of presentation:</strong> {item}</span>
                          <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                      </div>
                  );
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">The history of weather forecasting</h3>
            <p><strong>Ancient cultures</strong></p>
            <ul className="list-disc pl-5">
              <li>many cultures believed that floods and other disasters were involved in the creation of the world</li>
              <li>many cultures invented <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" /> and other ceremonies to make the weather gods friendly</li>
              <li>people needed to observe and interpret the sky to ensure their <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" /></li>
              <li>around 650 BC, Babylonians started forecasting, using weather phenomena such as <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" /></li>
              <li>by 300 BC, the Chinese had a calendar made up of a number of <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" /> connected with the weather</li>
            </ul>
            <p><strong>Ancient Greeks</strong></p>
            <ul className="list-disc pl-5">
                <li>a more scientific approach</li>
                <li>Aristotle tried to explain the formation of various weather phenomena</li>
                <li>Aristotle also described haloes and <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" /></li>
            </ul>
            <p><strong>Middle Ages</strong></p>
            <ul className="list-disc pl-5">
                <li>Aristotle's work considered accurate</li>
                <li>many proverbs, e.g. about the significance of the colour of the <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" />, passed on accurate information.</li>
            </ul>
            <p><strong>15th-19th centuries</strong></p>
            <ul className="list-disc pl-5">
              <li>15th century: scientists recognised value of <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" /> for the first time</li>
              <li>Galileo invented the <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" /></li>
              <li>Pascal showed relationship between atmospheric pressure and altitude</li>
              <li>from the 17th century, scientists could measure atmospheric pressure and temperature</li>
              <li>18th century: Franklin identified the movement of <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" /></li>
              <li>19th century: data from different locations could be sent to the same place by <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" /></li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 14 - Test 2 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book14.test2} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 14 - Listening Test 2" />
        <Card className="my-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside"><li>This test has 40 questions.</li></ul></CardContent></Card>
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? 'default' : 'outline'} onClick={() => setCurrentSection(s)} disabled={!isTestStarted || submitted}>Section {s}</Button>)}</div></div>
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        <div className="text-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || submitted} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        {showResultsPopup && (
            <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Test Results</h2>
                    <div className="flex justify-center items-center space-x-8 mt-2">
                        <div><p className="text-3xl font-bold text-blue-600">{score}/40</p><p>Raw Score</p></div>
                        <div><p className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</p><p>IELTS Band</p></div>
                    </div>
                </div>
                <h3 className="text-lg font-semibold mb-4 text-center">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(correctAnswers).map(([qNum, correctAns]) => {
                        const isCorrect = checkAnswer(qNum);
                        const userAnswer = answers[qNum] || '';
                        return (
                        <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex justify-between items-center"><span className="font-bold">Q{qNum}</span> {isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}</div>
                            <p>Your: {userAnswer || 'No Answer'}</p>
                            {!isCorrect && <p>Correct: {correctAns}</p>}
                        </div>);
                    })}
                </div>
                <div className="text-center mt-6"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
                </div>
            </div>
        )}
      </div>
      <PageViewTracker 
        book="book-14" 
        module="listening" 
        testNumber={2} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-14" module="listening" testNumber={2} />
          <UserTestHistory book="book-14" module="listening" testNumber={2} />
        </div>
      </div>
    </div>
  );
}