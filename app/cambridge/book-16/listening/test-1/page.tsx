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
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { TestStatistics } from '@/components/analytics/TestStatistics';
import { UserTestHistory } from '@/components/analytics/UserTestHistory';
import { saveTestScore } from '@/lib/test-score-saver';
import { useSession } from '@/lib/auth-client';

// Correct answers for all questions
const correctAnswers: { [key: string]: string } = {
  '1': 'egg',
  '2': 'tower',
  '3': 'car',
  '4': 'animals',
  '5': 'bridge',
  '6': 'movie/film',
  '7': 'decorate',
  '8': 'Wednesdays',
  '9': 'Fradstone',
  '10': 'parking',
  '11': 'C',
  '12': 'A',
  '13': 'B',
  '14': 'C',
  '15': 'H',
  '16': 'C',
  '17': 'G',
  '18': 'B',
  '19': 'I',
  '20': 'A',
  '21': 'C', // In either order with 22
  '22': 'E', // In either order with 21
  '23': 'B', // In either order with 24
  '24': 'E', // In either order with 23
  '25': 'D',
  '26': 'C',
  '27': 'A',
  '28': 'H',
  '29': 'F',
  '30': 'G',
  '31': 'practical',
  '32': 'publication',
  '33': 'choices',
  '34': 'negative',
  '35': 'play',
  '36': 'capitalism',
  '37': 'depression',
  '38': 'logic',
  '39': 'opportunity',
  '40': 'practice/practise',
};

const correctSet21_22 = ['C', 'E'];
const correctSet23_24 = ['B', 'E'];

export default function Test1Page() {
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
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);

  const handleInputChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toLowerCase() }));
  };

  const handleMultipleChoice = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value.toUpperCase() }));
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
          newAnswers = [...currentAnswers, value].sort();
        } else { newAnswers = currentAnswers; }
      }
      return { ...prev, [questionKey]: newAnswers };
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    const answeredMultiSelect = new Set<string>();

    for (let i = 1; i <= 40; i++) {
      const qNum = String(i);
      if (['21', '22'].includes(qNum)) {
        if (!answeredMultiSelect.has('21_22')) {
          const userChoices = multipleAnswers['21_22'] || [];
          userChoices.forEach(choice => {
            if (correctSet21_22.includes(choice)) { correctCount++; }
          });
          answeredMultiSelect.add('21_22');
        }
      } else if (['23', '24'].includes(qNum)) {
        if (!answeredMultiSelect.has('23_24')) {
          const userChoices = multipleAnswers['23_24'] || [];
          userChoices.forEach(choice => {
            if (correctSet23_24.includes(choice)) { correctCount++; }
          });
          answeredMultiSelect.add('23_24');
        }
      } else if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
        correctCount++;
      }
    }
    return correctCount;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    const detailedAnswers = { singleAnswers: answers, multipleAnswers, score: calculatedScore, timeTaken };
    try {
      // Save test score using test-score-saver
      const testScoreData = {
        book: 'book-16',
        module: 'listening',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || undefined,
        userId: session?.user?.id || null
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

  const renderMultiSelectStatus = (key: '21_22' | '23_24', correctSet: string[]) => {
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
          <h3 className="font-bold text-center text-lg mb-4">Children's Engineering Workshops</h3>
          <p><strong>Tiny Engineers (ages 4-5)</strong></p>
          <p>Activities:</p>
          <ul className="list-disc pl-5">
            <li>Create a cover for an <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> so they can drop it from a height without breaking it.</li>
            <li>Take part in a competition to build the tallest <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" />.</li>
            <li>Make a <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> powered by a balloon.</li>
          </ul>
          <p><strong>Junior Engineers (ages 6-8)</strong></p>
          <p>Activities:</p>
          <ul className="list-disc pl-5">
            <li>Build model cars, trucks and <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> and learn how to program them so they can move.</li>
            <li>Take part in a competition to build the longest <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> using card and wood.</li>
            <li>Create a short <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> with special software.</li>
            <li>Build, <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> and program a humanoid robot.</li>
          </ul>
          <p>Cost for a five-week block: £50</p>
          <p>Held on <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> from 10 am to 11 am</p>
          <p><strong>Location</strong></p>
          <p>Building 10A, <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> Industrial Estate, Grasford</p>
          <p>Plenty of <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-32" /> is available.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h4 className="font-semibold mb-2">Questions 11-14</h4>
            <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
            <div className="space-y-6">
                {renderMultipleChoiceQuestion('11', "Stevenson's was founded in", ['1923.', '1924.', '1926.'])}
                {renderMultipleChoiceQuestion('12', "Originally, Stevenson's manufactured goods for", ['the healthcare industry.', 'the automotive industry.', 'the machine tools industry.'])}
                {renderMultipleChoiceQuestion('13', 'What does the speaker say about the company premises?', ['The company has recently moved.', 'The company has no plans to move.', 'The company is going to move shortly.'])}
                {renderMultipleChoiceQuestion('14', 'The programme for the work experience group includes', ['time to do research.', 'meetings with a teacher.', 'talks by staff.'])}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Questions 15-20</h4>
            <p className="text-sm mb-4">Label the map below. Write the correct letter, A-J, next to Questions 15-20.</p>
            <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book16/listening/test1/map.png" alt="Map of Stevenson's premises" className="w-full h-auto mb-4 rounded-lg shadow-sm" />
             <div className="space-y-2">
                {['coffee room', 'warehouse', 'staff canteen', 'meeting room', 'human resources', 'boardroom'].map((location, index) => {
                    const qNum = String(15 + index);
                    const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
                    return (
                        <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                            <span className="flex-1"><strong>{qNum}</strong> {location}</span>
                            <Input placeholder="A-J" value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" />
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
          <h4 className="font-semibold mb-2">Questions 21 and 22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO parts of the introductory stage to their art projects do Jess and Tom agree were useful?</p>
          <div className="space-y-2">
            {['the Bird Park visit', 'the workshop sessions', 'the Natural History Museum visit', 'the projects done in previous years', 'the handouts with research sources'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['21_22'].includes(opt)} onChange={() => handleMultiSelect('21_22', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('21_22', correctSet21_22)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 23 and 24</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">In which TWO ways do both Jess and Tom decide to change their proposals?</p>
          <div className="space-y-2">
            {['by giving a rationale for their action plans', 'by being less specific about the outcome', 'by adding a video diary presentation', 'by providing a timeline and a mind map', 'by making their notes more evaluative'].map((option, index) => {
              const opt = String.fromCharCode(65 + index);
              return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers['23_24'].includes(opt)} onChange={() => handleMultiSelect('23_24', opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
          </div>
          {renderMultiSelectStatus('23_24', correctSet23_24)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 25-30</h4>
          <p className="text-sm mb-2">Which personal meaning do the students decide to give to each of the following pictures?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 25-30.</p>
          <div className="border rounded-lg p-4 mb-4 text-sm">
            <p className="font-semibold">Personal meanings</p>
            <p>A. a childhood memory</p><p>B. hope for the future</p><p>C. fast movement</p><p>D. a potential threat</p>
            <p>E. the power of colour</p><p>F. the continuity of life</p><p>G. protection of nature</p><p>H. a confused attitude to nature</p>
          </div>
          <div className="space-y-2">
            {['Falcon (Landseer)', 'Fish hawk (Audubon)', 'Kingfisher (van Gogh)', 'Portrait of William Wells', 'Vairumati (Gauguin)', 'Portrait of Giovanni de Medici'].map((part, index) => {
              const qNum = String(25 + index);
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input placeholder="A-H" value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
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
          <h3 className="font-bold text-center text-lg mb-4">Stoicism</h3>
          <p>Stoicism is still relevant today because of its <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> appeal.</p>
          <p><strong>Ancient Stoics</strong></p>
          <ul className="list-disc pl-5">
            <li>Stoicism was founded over 2,000 years ago in Greece.</li>
            <li>The Stoics' ideas are surprisingly well known, despite not being intended for <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
          </ul>
          <p><strong>Stoic principles</strong></p>
          <ul className="list-disc pl-5">
            <li>Happiness could be achieved by leading a virtuous life.</li>
            <li>Controlling emotions was essential.</li>
            <li>Epictetus said that external events cannot be controlled but the <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> people make in response can be controlled.</li>
            <li>A Stoic is someone who has a different view on experiences which others would consider as <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
          </ul>
          <p><strong>The influence of Stoicism</strong></p>
          <ul className="list-disc pl-5">
            <li>George Washington organised a <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> about Cato to motivate his men.</li>
            <li>The French artist Delacroix was a Stoic.</li>
            <li>Adam Smith's ideas on <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> were influenced by Stoicism.</li>
            <li>Some of today's political leaders are inspired by the Stoics.</li>
            <li>Cognitive Behaviour Therapy (CBT) - the treatment for <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> is based on ideas from Stoicism.</li>
            <li>- people learn to base their thinking on <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
            <li>In business, people benefit from Stoicism by identifying obstacles as <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} />.</li>
          </ul>
          <p><strong>Relevance of Stoicism</strong></p>
          <ul className="list-disc pl-5">
            <li>It requires a lot of <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32" disabled={!isTestStarted || submitted} /> but Stoicism can help people to lead a good life.</li>
            <li>It teaches people that having a strong character is more important than anything else.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-16" module="listening" testNumber={1} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 16 - Test 1 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book16.test1} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 16 - Listening Test 1" />
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

                    if (['21', '22'].includes(qNum)) {
                        userAnswer = (multipleAnswers['21_22'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet21_22.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet21_22.join('').length;
                        correctAns = correctSet21_22.join(', ');
                        if (qNum === '21') return null; // Hide Q21, show combined result for Q22
                        displayQNum = 'Q21-22';
                    } else if (['23', '24'].includes(qNum)) {
                        userAnswer = (multipleAnswers['23_24'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet23_24.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet23_24.join('').length;
                        correctAns = correctSet23_24.join(', ');
                        if (qNum === '23') return null; // Hide Q23, show combined result for Q24
                        displayQNum = 'Q23-24';
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
      <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="listening" testNumber={1} /><UserTestHistory book="book-16" module="listening" testNumber={1} /></div>
    </div>
  );
}