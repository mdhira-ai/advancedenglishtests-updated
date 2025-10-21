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

const correctAnswers: { [key: string]: string } = {
  '1': 'family', '2': 'fit', '3': 'hotels', '4': 'Carrowniskey', '5': 'week', '6': 'bay', '7': 'September',
  '8': '19/nineteen', '9': '30/thirty', '10': 'boots', '11': 'B', '12': 'E', '13': 'C', '14': 'C', '15': 'A',
  '16': 'E', '17': 'D', '18': 'G', '19': 'F', '20': 'C', '21': 'B', '22': 'A', '23': 'A', '24': 'B',
  '25': 'C', '26': 'A', '27': 'D', '28': 'B', '29': 'F', '30': 'H', '31': 'mud', '32': 'feathers',
  '33': 'shape', '34': 'moon', '35': 'neck', '36': 'evidence', '37': 'destinations', '38': 'oceans',
  '39': 'recovery', '40': 'atlas',
};

const correctSet11_12 = ['B', 'E'];

export default function Test3Page() {
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };
  
  const handleMultiSelect = (key: string, value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[key] || [];
        const newAnswers = currentAnswers.includes(value)
            ? currentAnswers.filter(ans => ans !== value)
            : [...currentAnswers, value].slice(0, 2).sort();
        return { ...prev, [key]: newAnswers };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (!['11', '12'].includes(qNum)) {
            if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
                correctCount++;
            }
        }
    }
    
    const userChoices = multipleAnswers['11_12'] || [];
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
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : undefined;
    const detailedAnswers = { singleAnswers: answers, multipleAnswers, score: calculatedScore, timeTaken };
    
    try {
      // Save test score using test-score-saver
      const testScoreData = {
        userId: session?.user?.id || null,
        book: 'book-17',
        module: 'listening',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', result.error);
      }
    } catch (error) { console.error('Error submitting test:', error); }
    setSubmitted(true);
    setShowResultsPopup(true);
    setIsSubmitting(false);
  };

  const renderAnswerStatusIcon = (isCorrect: boolean) => isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />;

  const renderMultiSelectStatus = (key: string, correctSet: string[]) => {
    if (!submitted) return null;
    const userChoices = multipleAnswers[key] || [];
    const isFullyCorrect = userChoices.length === correctSet.length && correctSet.every(ans => userChoices.includes(ans));
    return (
      <div className="mt-2 flex items-center gap-2">
        {renderAnswerStatusIcon(isFullyCorrect)}
        <span className="text-sm text-gray-600">Correct answers: {correctSet.join(' and ')}</span>
      </div>
    );
  };

  const renderMultipleChoiceQuestion = (qNum: string, question: string, options: string[]) => (
    <div>
      <p className="font-medium mb-2">{qNum}. {question}</p>
      <div className={`p-2 rounded ${submitted ? (checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum) ? 'bg-green-50' : 'bg-red-50') : ''}`}>
        <div className="space-y-2">
          {options.map((option, index) => {
            const optionValue = String.fromCharCode(65 + index);
            return (
              <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name={`question-${qNum}`} value={optionValue} checked={answers[qNum] === optionValue}
                  onChange={() => handleMultipleChoice(qNum, optionValue)} disabled={!isTestStarted || submitted} className="w-4 h-4" />
                <span>{optionValue} {option}</span>
              </label>
            );
          })}
        </div>
        {submitted && <p className="text-xs mt-1 text-gray-600">Correct answer: {correctAnswers[qNum]}</p>}
      </div>
    </div>
  );

  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">Advice on surfing holidays</h3>
          <p><strong>Jack's advice</strong></p>
          <ul className="list-disc pl-5">
            <li>Recommends surfing for <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['1'], correctAnswers['1'], '1') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> holidays in the summer
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['1']}</span>}
            </li>
            <li>Need to be quite <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['2'], correctAnswers['2'], '2') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['2']}</span>}
            </li>
          </ul>
          <p><strong>Irish surfing locations</strong></p>
          <ul className="list-disc pl-5">
            <li>County Clare
              <ul className="list-disc pl-5">
                <li>Lahinch has some good quality <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['3'], correctAnswers['3'], '3') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> and surf schools
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['3']}</span>}
                </li>
                <li>There are famous cliffs nearby</li>
              </ul>
            </li>
            <li>County Mayo
                <ul className="list-disc pl-5">
                    <li>Good surf school at <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['4'], correctAnswers['4'], '4') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> beach
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['4']}</span>}
                    </li>
                    <li>Surf camp lasts for one <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['5'], correctAnswers['5'], '5') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['5']}</span>}
                    </li>
                    <li>Can also explore the local <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['6'], correctAnswers['6'], '6') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> by kayak
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['6']}</span>}
                    </li>
                </ul>
            </li>
          </ul>
           <p><strong>Weather</strong></p>
          <ul className="list-disc pl-5">
            <li>Best month to go: <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['7'], correctAnswers['7'], '7') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['7']}</span>}
            </li>
            <li>Average temperature in summer: approx. <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['8'], correctAnswers['8'], '8') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> degrees
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['8']}</span>}
            </li>
          </ul>
           <p><strong>Costs</strong></p>
          <ul className="list-disc pl-5">
            <li>Equipment
                <ul className="list-disc pl-5">
                    <li>Wetsuit and surfboard: <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['9'], correctAnswers['9'], '9') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> euros per day
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['9']}</span>}
                    </li>
                    <li>Also advisable to hire <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['10'], correctAnswers['10'], '10') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> for warmth
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['10']}</span>}
                    </li>
                </ul>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 11 and 12</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO facts are given about the school's extended hours childcare service?</p>
          <div className="space-y-2">{['It started recently.', 'More children attend after school than before school.', 'An average of 50 children attend in the mornings.', 'A child cannot attend both the before and after school sessions.', 'The maximum number of children who can attend is 70.'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['11_12'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('11_12', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('11_12', correctSet11_12)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 13-15</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('13', 'How much does childcare cost for a complete afternoon session per child?', ['£3.50', '£5.70', '£7.20'])}
            {renderMultipleChoiceQuestion('14', 'What does the manager say about food?', ['Children with allergies should bring their own food.', 'Children may bring healthy snacks with them.', 'Children are given a proper meal at 5 p.m.'])}
            {renderMultipleChoiceQuestion('15', 'What is different about arrangements in the school holidays?', ['Children from other schools can attend.', 'Older children can attend.', 'A greater number of children can attend.'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 16-20</h4>
          <p className="text-sm mb-2">What information is given about each of the following activities on offer?</p>
          <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A-G, next to Questions 16-20.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Information</p>
            <p><strong>A</strong> has limited availability</p>
            <p><strong>B</strong> is no longer available</p>
            <p><strong>C</strong> is for over 8s only</p>
            <p><strong>D</strong> requires help from parents</p>
            <p><strong>E</strong> involves an additional fee</p>
            <p><strong>F</strong> is a new activity</p>
            <p><strong>G</strong> was requested by children</p>
          </div>
          <p className="font-semibold">Activities</p>
          <div className="space-y-2 mt-2">
            {['Spanish', 'Music', 'Painting', 'Yoga', 'Cooking'].map((part, index) => {
              const qNum = String(16 + index);
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                  {submitted && renderAnswerStatusIcon(isCorrect)}
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers[qNum]}</span>}
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
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold mb-4">Holly's Work Placement Tutorial</h3>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('21', 'Holly has chosen the Orion Stadium placement because', ['it involves children.', 'it is outdoors.', 'it sounds like fun.'])}
            {renderMultipleChoiceQuestion('22', 'Which aspect of safety does Dr Green emphasise most?', ['ensuring children stay in the stadium', 'checking the equipment children will use', 'removing obstacles in changing rooms'])}
            {renderMultipleChoiceQuestion('23', 'What does Dr Green say about the spectators?', ['They can be hard to manage.', 'They make useful volunteers.', "They shouldn't take photographs."])}
            {renderMultipleChoiceQuestion('24', 'What has affected the schedule in the past?', ['bad weather', 'an injury', 'extra time'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <p className="text-sm mb-2">What do Holly and her tutor agree is an important aspect of each of the following events management skills?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 25-30.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Important aspects</p>
            <p><strong>A</strong> being flexible</p><p><strong>B</strong> focusing on details</p><p><strong>C</strong> having a smart appearance</p>
            <p><strong>D</strong> hiding your emotions</p><p><strong>E</strong> relying on experts</p><p><strong>F</strong> trusting your own views</p>
            <p><strong>G</strong> doing one thing at a time</p><p><strong>H</strong> thinking of the future</p>
          </div>
          <p className="font-semibold">Events management skills</p>
          <div className="space-y-2 mt-2">
            {['Communication', 'Organisation', 'Time management', 'Creativity', 'Leadership', 'Networking'].map((part, index) => {
              const qNum = String(25 + index);
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
                  {submitted && renderAnswerStatusIcon(isCorrect)}
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers[qNum]}</span>}
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
            <h3 className="font-bold text-center text-lg mb-4">Bird Migration Theory</h3>
            <p>Most birds are believed to migrate seasonally.</p>
            <p><strong>Hibernation theory</strong></p>
            <ul className="list-disc pl-5">
                <li>It was believed that birds hibernated underwater or buried themselves in <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['31'], correctAnswers['31'], '31') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['31']}</span>}
                </li>
                <li>This theory was later disproved by experiments on caged birds.</li>
            </ul>
            <p><strong>Transmutation theory</strong></p>
            <ul className="list-disc pl-5">
                <li>Aristotle believed birds changed from one species into another in summer and winter.
                    <ul className="list-disc pl-5">
                        <li>In autumn he observed that redstarts experience the loss of <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['32'], correctAnswers['32'], '32') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> and thought they then turned into robins.
                          {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['32']}</span>}
                        </li>
                        <li>Aristotle's assumptions were logical because the two species of birds had a similar <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['33'], correctAnswers['33'], '33') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                          {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['33']}</span>}
                        </li>
                    </ul>
                </li>
            </ul>
            <p><strong>17th century</strong></p>
            <ul className="list-disc pl-5">
                <li>Charles Morton popularised the idea that birds fly to the <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['34'], correctAnswers['34'], '34') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> in winter.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['34']}</span>}
                </li>
            </ul>
            <p><strong>Scientific developments</strong></p>
            <ul className="list-disc pl-5">
                <li>In 1822, a stork was killed in Germany which had an African spear in its <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['35'], correctAnswers['35'], '35') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['35']}</span>}
                    <ul className="list-disc pl-5">
                        <li>previously there had been no <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['36'], correctAnswers['36'], '36') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> that storks migrate to Africa
                          {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['36']}</span>}
                        </li>
                    </ul>
                </li>
                <li>Little was known about the <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['37'], correctAnswers['37'], '37') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> and journeys of migrating birds until the practice of ringing was established.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['37']}</span>}
                    <ul className="list-disc pl-5">
                        <li>It was thought large birds carried small birds on some journeys because they were considered incapable of travelling across huge <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['38'], correctAnswers['38'], '38') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                          {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['38']}</span>}
                        </li>
                        <li>Ringing depended on what is called the <strong>39</strong> '<Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['39'], correctAnswers['39'], '39') ? 'bg-green-50' : 'bg-red-50') : ''}`} />' of dead birds.
                          {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['39']}</span>}
                        </li>
                    </ul>
                </li>
                <li>In 1931, the first <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['40'], correctAnswers['40'], '40') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> to show the migration of European birds was printed.
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['40']}</span>}
                </li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-17" module="listening" testNumber={3} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
            <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 17 - Test 3 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book17.test3} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 17 - Listening Test 3" />
        <Card className="my-6"><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm"><li>Answer all questions as you listen.</li><li>This test has 40 questions.</li></ul></CardContent></Card>
        <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? 'default' : 'outline'} onClick={() => setCurrentSection(s)} className="w-24" disabled={!isTestStarted || submitted}>Section {s}</Button>)}</div></div>
        
        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}
        
        <div className="flex gap-4 justify-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || submitted} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
                <div className="flex justify-center items-center space-x-8">
                  <div><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Raw Score</div></div>
                  <div><div className="text-3xl font-bold text-green-600">{getIELTSListeningScore(score)}</div><div className="text-sm">IELTS Band</div></div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([qNum, correctAns]) => {
                    let userAnswer: string = '';
                    let isCorrect: boolean = false;
                    let displayQNum = `Q${qNum}`;

                    if (['11', '12'].includes(qNum)) {
                        userAnswer = (multipleAnswers['11_12'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet11_12.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet11_12.join('').length;
                        correctAns = correctSet11_12.join(', ');
                        if (qNum === '11') return null;
                        displayQNum = 'Q11-12';
                    } else {
                       userAnswer = answers[qNum] || '';
                       isCorrect = checkAnswerWithMatching(userAnswer, correctAns, qNum);
                    }
                    
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                           <span className="font-medium">{displayQNum}</span> {renderAnswerStatusIcon(isCorrect)}
                        </div>
                        <p className="text-sm">Your: {userAnswer || 'No answer'}</p>
                        <p className="text-sm">Correct: {correctAns}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-center"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button></div>
            </div>
          </div>
        )}
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <TestStatistics book="book-17" module="listening" testNumber={3} />
        <UserTestHistory book="book-17" module="listening" testNumber={3} />
      </div>
    </div>
  );
}