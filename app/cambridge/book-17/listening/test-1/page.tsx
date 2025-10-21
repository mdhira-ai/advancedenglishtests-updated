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
  '1': 'litter', '2': 'dogs', '3': 'insects', '4': 'butterflies', '5': 'wall',
  '6': 'island', '7': 'boots', '8': 'beginners', '9': 'spoons', '10': '35/thirty five',
  '11': 'A', '12': 'C', '13': 'B', '14': 'B', '15': 'A', '16': 'D',
  '17': 'B', '18': 'C', '19': 'D', '20': 'E', '21': 'A', '22': 'B', '23': 'B',
  '24': 'A', '25': 'C', '26': 'C', '27': 'A', '28': 'E', '29': 'F', '30': 'C',
  '31': 'puzzle', '32': 'logic', '33': 'confusion', '34': 'meditation', '35': 'stone',
  '36': 'coins', '37': 'tree', '38': 'breathing', '39': 'paper', '40': 'anxiety',
};

const correctSet15_16 = ['A', 'D'];
const correctSet17_18 = ['B', 'C'];
const correctSet19_20 = ['D', 'E'];

export default function Test1Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '15_16': [], '17_18': [], '19_20': [],
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
    
    // Handle single-choice and fill-in-the-blanks
    for (let i = 1; i <= 40; i++) {
        const qNum = String(i);
        if (!['15', '16', '17', '18', '19', '20'].includes(qNum)) {
            if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
                correctCount++;
            }
        }
    }
    
    // Handle multi-select sets
    [
        { key: '15_16', correctSet: correctSet15_16 },
        { key: '17_18', correctSet: correctSet17_18 },
        { key: '19_20', correctSet: correctSet19_20 }
    ].forEach(({ key, correctSet }) => {
        const userChoices = multipleAnswers[key] || [];
        userChoices.forEach(choice => {
            if (correctSet.includes(choice)) {
                correctCount++;
            }
        });
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
        testNumber: 1,
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
          <h3 className="font-bold text-center text-lg mb-4">Buckworth Conservation Group</h3>
          <p><strong>Regular activities</strong></p>
          <p>Beach</p>
          <ul className="list-disc pl-5">
            <li>making sure the beach does not have <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['1'], correctAnswers['1'], '1') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> on it
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['1']}</span>}
            </li>
            <li>no <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['2'], correctAnswers['2'], '2') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['2']}</span>}
            </li>
          </ul>
          <p>Nature reserve</p>
          <ul className="list-disc pl-5">
            <li>maintaining paths</li>
            <li>nesting boxes for birds installed</li>
            <li>next task is taking action to attract <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['3'], correctAnswers['3'], '3') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> to the place
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['3']}</span>}
            </li>
            <li>identifying types of <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['4'], correctAnswers['4'], '4') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['4']}</span>}
            </li>
            <li>building a new <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['5'], correctAnswers['5'], '5') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['5']}</span>}
            </li>
          </ul>
          <p><strong>Forthcoming events</strong></p>
          <p>Saturday</p>
          <ul className="list-disc pl-5">
            <li>meet at Dunsmore Beach car park</li>
            <li>walk across the sands and reach the <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['6'], correctAnswers['6'], '6') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['6']}</span>}
            </li>
            <li>take a picnic</li>
            <li>wear appropriate <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['7'], correctAnswers['7'], '7') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['7']}</span>}
            </li>
          </ul>
          <p>Woodwork session</p>
          <ul className="list-disc pl-5">
            <li>suitable for <strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['8'], correctAnswers['8'], '8') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> to participate in
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['8']}</span>}
            </li>
            <li>making <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['9'], correctAnswers['9'], '9') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> out of wood
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['9']}</span>}
            </li>
            <li>17th, from 10 a.m. to 3 p.m.</li>
            <li>cost of session (no camping): £ <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['10'], correctAnswers['10'], '10') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['10']}</span>}
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
          <h4 className="font-semibold mb-2">Questions 11-14</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold mb-4">Boat trip round Tasmania</h3>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('11', 'What is the maximum number of people who can stand on each side of the boat?', ['9', '15', '18'])}
            {renderMultipleChoiceQuestion('12', 'What colour are the tour boats?', ['dark red', 'jet black', 'light green'])}
            {renderMultipleChoiceQuestion('13', "Which lunchbox is suitable for someone who doesn't eat meat or fish?", ['Lunchbox 1', 'Lunchbox 2', 'Lunchbox 3'])}
            {renderMultipleChoiceQuestion('14', 'What should people do with their litter?', ['take it home', 'hand it to a member of staff', 'put it in the bins provided on the boat'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 15 and 16</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO features of the lighthouse does Lou mention?</p>
          <div className="space-y-2">{['why it was built', 'who built it', 'how long it took to build', 'who staffed it', 'what it was built with'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['15_16'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('15_16', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('15_16', correctSet15_16)}
        </div>
         <div>
          <h4 className="font-semibold mb-2">Questions 17 and 18</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO types of creature might come close to the boat?</p>
          <div className="space-y-2">{['sea eagles', 'fur seals', 'dolphins', 'whales', 'penguins'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['17_18'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('17_18', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('17_18', correctSet17_18)}
        </div>
         <div>
          <h4 className="font-semibold mb-2">Questions 19 and 20</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO points does Lou make about the caves?</p>
          <div className="space-y-2">{['Only large tourist boats can visit them.', 'The entrances to them are often blocked.', 'It is too dangerous for individuals to go near them.', 'Someone will explain what is inside them.', 'They cannot be reached on foot.'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['19_20'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('19_20', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('19_20', correctSet19_20)}
        </div>
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 21-26</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <h3 className="font-bold mb-4">Work experience for veterinary science students</h3>
           <div className="space-y-6">
            {renderMultipleChoiceQuestion('21', 'What problem did both Diana and Tim have when arranging their work experience?', ['making initial contact with suitable farms', 'organising transport to and from the farm', 'finding a placement for the required length of time'])}
            {renderMultipleChoiceQuestion('22', 'Tim was pleased to be able to help', ['a lamb that had a broken leg.', 'a sheep that was having difficulty giving birth.', 'a newly born lamb that was having trouble feeding.'])}
            {renderMultipleChoiceQuestion('23', 'Diana says the sheep on her farm', ['were of various different varieties.', 'were mainly reared for their meat.', 'had better quality wool than sheep on the hills.'])}
            {renderMultipleChoiceQuestion('24', 'What did the students learn about adding supplements to chicken feed?', ['These should only be given if specially needed.', 'It is worth paying extra for the most effective ones.', 'The amount given at one time should be limited.'])}
            {renderMultipleChoiceQuestion('25', 'What happened when Diana was working with dairy cows?', ['She identified some cows incorrectly.', 'She accidentally threw some milk away.', 'She made a mistake when storing milk.'])}
            {renderMultipleChoiceQuestion('26', 'What did both farmers mention about vets and farming?', ['Vets are failing to cope with some aspects of animal health.', 'There needs to be a fundamental change in the training of vets.', 'Some jobs could be done by the farmer rather than by a vet.'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 27-30</h4>
          <p className="text-sm mb-2">What opinion do the students give about each of the following modules on their veterinary science course?</p>
          <p className="text-sm font-semibold mb-4">Choose FOUR answers from the box and write the correct letter, A-F, next to questions 27-30.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Opinions</p>
            <p><strong>A</strong> Tim found this easier than expected.</p>
            <p><strong>B</strong> Tim thought this was not very clearly organised.</p>
            <p><strong>C</strong> Diana may do some further study on this.</p>
            <p><strong>D</strong> They both found the reading required for this was difficult.</p>
            <p><strong>E</strong> Tim was shocked at something he learned on this module.</p>
            <p><strong>F</strong> They were both surprised how little is known about some aspects of this.</p>
          </div>
          <p className="font-semibold">Modules on Veterinary Science course</p>
          <div className="space-y-2 mt-2">
            {['Medical terminology', 'Diet and nutrition', 'Animal disease', 'Wildlife medication'].map((part, index) => {
              const qNum = String(27 + index);
              const isCorrect = submitted && checkAnswerWithMatching(answers[qNum], correctAnswers[qNum], qNum);
              return (
                <div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                  <span className="flex-1"><strong>{qNum}</strong> {part}</span>
                  <Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || submitted} className="w-16 text-center" />
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
          <h3 className="font-bold text-center text-lg mb-4">Labyrinths</h3>
          <p><strong>Definition</strong></p>
          <ul className="list-disc pl-5"><li>a winding spiral path leading to a central area</li></ul>
          <p><strong>Labyrinths compared with mazes</strong></p>
          <ul className="list-disc pl-5">
            <li>Mazes are a type of <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['31'], correctAnswers['31'], '31') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['31']}</span>}
                <ul className="list-disc pl-5">
                    <li><strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['32'], correctAnswers['32'], '32') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> is needed to navigate through a maze
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['32']}</span>}
                    </li>
                    <li>the word 'maze' is derived from a word meaning a feeling of <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['33'], correctAnswers['33'], '33') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['33']}</span>}
                    </li>
                </ul>
            </li>
            <li>Labyrinths represent a journey through life
                <ul className="list-disc pl-5">
                    <li>they have frequently been used in <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['34'], correctAnswers['34'], '34') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> and prayer
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['34']}</span>}
                    </li>
                </ul>
            </li>
          </ul>
           <p><strong>Early examples of the labyrinth spiral</strong></p>
          <ul className="list-disc pl-5">
            <li>Ancient carvings on <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['35'], correctAnswers['35'], '35') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> have been found across many cultures
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['35']}</span>}
            </li>
            <li>The Pima, a Native American tribe, wove the symbol on baskets</li>
            <li>Ancient Greeks used the symbol on <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['36'], correctAnswers['36'], '36') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['36']}</span>}
            </li>
          </ul>
          <p><strong>Walking labyrinths</strong></p>
          <ul className="list-disc pl-5">
            <li>The largest surviving example of a turf labyrinth once had a big <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['37'], correctAnswers['37'], '37') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> at its centre
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['37']}</span>}
            </li>
          </ul>
          <p><strong>Labyrinths nowadays</strong></p>
          <ul className="list-disc pl-5">
            <li>Believed to have a beneficial impact on mental and physical health, e.g., walking a maze can reduce a person's <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['38'], correctAnswers['38'], '38') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> rate
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['38']}</span>}
            </li>
            <li>Used in medical and health and fitness settings and also prisons</li>
            <li>Popular with patients, visitors and staff in hospitals
                <ul className="list-disc pl-5">
                    <li>patients who can't walk can use 'finger labyrinths' made from <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['39'], correctAnswers['39'], '39') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['39']}</span>}
                    </li>
                    <li>research has shown that Alzheimer's sufferers experience less <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['40'], correctAnswers['40'], '40') ? 'bg-green-50' : 'bg-red-50') : ''}`} />.
                      {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['40']}</span>}
                    </li>
                </ul>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // Main return with simplified results popup for brevity
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-17" module="listening" testNumber={1} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 17 - Test 1 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book17.test1} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 17 - Listening Test 1" />
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

                    if (['15', '16'].includes(qNum)) {
                        userAnswer = (multipleAnswers['15_16'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet15_16.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet15_16.join('').length;
                        correctAns = correctSet15_16.join(', ');
                        if (qNum === '15') return null;
                        displayQNum = 'Q15-16';
                    } else if (['17', '18'].includes(qNum)) {
                        userAnswer = (multipleAnswers['17_18'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet17_18.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet17_18.join('').length;
                        correctAns = correctSet17_18.join(', ');
                        if (qNum === '17') return null;
                        displayQNum = 'Q17-18';
                    } else if (['19', '20'].includes(qNum)) {
                        userAnswer = (multipleAnswers['19_20'] || []).join(', ');
                        isCorrect = !!userAnswer && correctSet19_20.every(a => userAnswer.includes(a)) && userAnswer.replace(/, /g, '').length === correctSet19_20.join('').length;
                        correctAns = correctSet19_20.join(', ');
                        if (qNum === '19') return null;
                        displayQNum = 'Q19-20';
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
        <TestStatistics book="book-17" module="listening" testNumber={1} />
        <UserTestHistory book="book-17" module="listening" testNumber={1} />
      </div>
    </div>
  );
}