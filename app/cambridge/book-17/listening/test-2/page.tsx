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
  '1': 'collecting', '2': 'records', '3': 'West', '4': 'transport', '5': 'art', '6': 'hospital',
  '7': 'garden', '8': 'quiz', '9': 'tickets', '10': 'poster', '11': 'B', '12': 'C', '13': 'C', '14': 'B',
  '15': 'D', '16': 'C', '17': 'G', '18': 'A', '19': 'E', '20': 'F', '21': 'D', '22': 'E', '23': 'D', '24': 'C',
  '25': 'A', '26': 'E', '27': 'F', '28': 'B', '29': 'C', '30': 'C', '31': '321,000', '32': 'vocabulary',
  '33': 'podcast', '34': 'smartphones', '35': 'bilingual', '36': 'playground', '37': 'picture', '38': 'grammar',
  '39': 'identity', '40': 'fluent',
};

const correctSet21_22 = ['D', 'E'];

export default function Test2Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21_22': [],
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
        if (!['21', '22'].includes(qNum)) {
            if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) {
                correctCount++;
            }
        }
    }
    
    const userChoices = multipleAnswers['21_22'] || [];
    userChoices.forEach(choice => {
        if (correctSet21_22.includes(choice)) {
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
        testNumber: 2,
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
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-center text-lg mb-4">Opportunities for voluntary work in Southoe village</h3>
            <p><strong>Library</strong></p>
            <ul className="list-disc pl-5">
                <li>Help with <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['1'], correctAnswers['1'], '1') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> books (times to be arranged)
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['1']}</span>}
                </li>
                <li>Help needed to keep <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['2'], correctAnswers['2'], '2') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> of books up to date
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['2']}</span>}
                </li>
                <li>Library is in the <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['3'], correctAnswers['3'], '3') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> Room in the village hall
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['3']}</span>}
                </li>
            </ul>
            <p><strong>Lunch club</strong></p>
            <ul className="list-disc pl-5">
                <li>Help by providing <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['4'], correctAnswers['4'], '4') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['4']}</span>}
                </li>
                <li>Help with hobbies such as <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['5'], correctAnswers['5'], '5') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['5']}</span>}
                </li>
            </ul>
            <p><strong>Help for individuals needed next week</strong></p>
            <ul className="list-disc pl-5">
                <li>Taking Mrs Carroll to <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['6'], correctAnswers['6'], '6') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['6']}</span>}
                </li>
                <li>Work in the <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['7'], correctAnswers['7'], '7') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> at Mr Selsbury's house
                  {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['7']}</span>}
                </li>
            </ul>
             <p className="font-semibold mt-4">Village social events</p>
             <table className="w-full border-collapse border"><thead><tr><th className="border p-2">Date</th><th className="border p-2">Event</th><th className="border p-2">Location</th><th className="border p-2">Help needed</th></tr></thead><tbody>
                <tr><td className="border p-2">19 Oct</td><td className="border p-2"><strong>8</strong> <Input value={answers['8'] || ''} onChange={e => handleInputChange('8', e.target.value)} disabled={!isTestStarted || submitted} className={`w-full ${submitted ? (checkAnswerWithMatching(answers['8'], correctAnswers['8'], '8') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs text-gray-600">Correct: {correctAnswers['8']}</span>}
                </td><td className="border p-2">Village hall</td><td className="border p-2">providing refreshments</td></tr>
                <tr><td className="border p-2">18 Nov</td><td className="border p-2">dance</td><td className="border p-2">Village hall</td><td className="border p-2">checking <strong>9</strong> <Input value={answers['9'] || ''} onChange={e => handleInputChange('9', e.target.value)} disabled={!isTestStarted || submitted} className={`w-full ${submitted ? (checkAnswerWithMatching(answers['9'], correctAnswers['9'], '9') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs text-gray-600">Correct: {correctAnswers['9']}</span>}
                </td></tr>
                <tr><td className="border p-2">31 Dec</td><td className="border p-2">New Year's Eve party</td><td className="border p-2">Mountfort Hotel</td><td className="border p-2">designing the <strong>10</strong> <Input value={answers['10'] || ''} onChange={e => handleInputChange('10', e.target.value)} disabled={!isTestStarted || submitted} className={`w-full ${submitted ? (checkAnswerWithMatching(answers['10'], correctAnswers['10'], '10') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
                  {submitted && <span className="text-xs text-gray-600">Correct: {correctAnswers['10']}</span>}
                </td></tr>
             </tbody></table>
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
          <h3 className="font-bold mb-4">Oniton Hall</h3>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('11', 'Many past owners made changes to', ['the gardens.', 'the house.', 'the farm.'])}
            {renderMultipleChoiceQuestion('12', 'Sir Edward Downes built Oniton Hall because he wanted', ['a place for discussing politics.', 'a place to display his wealth.', 'a place for artists and writers.'])}
            {renderMultipleChoiceQuestion('13', 'Visitors can learn about the work of servants in the past from', ['audio guides.', 'photographs.', 'people in costume.'])}
            {renderMultipleChoiceQuestion('14', 'What is new for children at Oniton Hall?', ['clothes for dressing up', 'mini tractors', 'the adventure playground'])}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 15-20</h4>
          <p className="text-sm mb-2">Which activity is offered at each of the following locations on the farm?</p>
          <p className="text-sm font-semibold mb-4">Choose SIX answers from the box and write the correct letter, A-H, next to Questions 15-20.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Activities</p>
            <p><strong>A</strong> shopping</p>
            <p><strong>B</strong> watching cows being milked</p>
            <p><strong>C</strong> seeing old farming equipment</p>
            <p><strong>D</strong> eating and drinking</p>
            <p><strong>E</strong> starting a trip</p>
            <p><strong>F</strong> seeing rare breeds of animals</p>
            <p><strong>G</strong> helping to look after animals</p>
            <p><strong>H</strong> using farming tools</p>
          </div>
          <p className="font-semibold">Locations on the farm</p>
          <div className="space-y-2 mt-2">
            {['dairy', 'large barn', 'small barn', 'stables', 'shed', 'parkland'].map((part, index) => {
              const qNum = String(15 + index);
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

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold mb-2">Questions 21 and 22</h4>
          <p className="text-sm mb-4">Choose TWO letters, A-E.</p>
          <p className="font-medium mb-4">Which TWO things do the students agree they need to include in their reviews of Romeo and Juliet?</p>
          <div className="space-y-2">{['analysis of the text', 'a summary of the plot', 'a description of the theatre', 'a personal reaction', 'a reference to particular scenes'].map((opt, i) => <label key={i} className="flex items-center"><input type="checkbox" value={String.fromCharCode(65 + i)} checked={multipleAnswers['21_22'].includes(String.fromCharCode(65 + i))} onChange={() => handleMultiSelect('21_22', String.fromCharCode(65 + i))} disabled={!isTestStarted || submitted} className="mr-2"/>{String.fromCharCode(65 + i)} {opt}</label>)}</div>
          {renderMultiSelectStatus('21_22', correctSet21_22)}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Questions 23-27</h4>
          <p className="text-sm mb-2">Which opinion do the speakers give about each of the following aspects of The Emporium's production of Romeo and Juliet?</p>
          <p className="text-sm font-semibold mb-4">Choose FIVE answers from the box and write the correct letter, A-G, next to Questions 23-27.</p>
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-semibold">Opinions</p>
            <p><strong>A</strong> They both expected this to be more traditional.</p>
            <p><strong>B</strong> They both thought this was original.</p>
            <p><strong>C</strong> They agree this created the right atmosphere.</p>
            <p><strong>D</strong> They agree this was a major strength.</p>
            <p><strong>E</strong> They were both disappointed by this.</p>
            <p><strong>F</strong> They disagree about why this was an issue.</p>
            <p><strong>G</strong> They disagree about how this could be improved.</p>
          </div>
          <p className="font-semibold">Aspects of the production</p>
          <div className="space-y-2 mt-2">
            {['the set', 'the lighting', 'the costume design', 'the music', "the actors' delivery"].map((part, index) => {
              const qNum = String(23 + index);
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
        <div>
          <h4 className="font-semibold mb-2">Questions 28-30</h4>
          <p className="text-sm mb-4">Choose the correct letter, A, B or C.</p>
          <div className="space-y-6">
            {renderMultipleChoiceQuestion('28', 'The students think the story of Romeo and Juliet is still relevant for young people today because', ['it illustrates how easily conflict can start.', 'it deals with problems that families experience.', 'it teaches them about relationships.'])}
            {renderMultipleChoiceQuestion('29', 'The students found watching Romeo and Juliet in another language', ['frustrating.', 'demanding.', 'moving.'])}
            {renderMultipleChoiceQuestion('30', "Why do the students think Shakespeare's plays have such international appeal?", ['The stories are exciting.', 'There are recognisable characters.', 'They can be interpreted in many ways.'])}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-center text-lg mb-4">The impact of digital technology on the Icelandic language</h3>
          <p><strong>The Icelandic language</strong></p>
          <ul className="list-disc pl-5">
            <li>has approximately <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['31'], correctAnswers['31'], '31') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> speakers
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['31']}</span>}
            </li>
            <li>has a <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['32'], correctAnswers['32'], '32') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> that is still growing
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['32']}</span>}
            </li>
            <li>has not changed a lot over the last thousand years</li>
            <li>has its own words for computer-based concepts, such as web browser and <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['33'], correctAnswers['33'], '33') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['33']}</span>}
            </li>
          </ul>
          <p><strong>Young speakers</strong></p>
          <ul className="list-disc pl-5">
            <li>are big users of digital technology, such as <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['34'], correctAnswers['34'], '34') ? 'bg-green-50' : 'bg-red-50') : ''}`} />
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['34']}</span>}
            </li>
            <li>are becoming <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['35'], correctAnswers['35'], '35') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> very quickly
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['35']}</span>}
            </li>
            <li>are having discussions using only English while they are in the <strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['36'], correctAnswers['36'], '36') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> at school
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['36']}</span>}
            </li>
            <li>are better able to identify the content of a <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['37'], correctAnswers['37'], '37') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> in English than Icelandic
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['37']}</span>}
            </li>
          </ul>
          <p><strong>Technology and internet companies</strong></p>
          <ul className="list-disc pl-5">
            <li>write very little in Icelandic because of the small number of speakers and because of how complicated its <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['38'], correctAnswers['38'], '38') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> is
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['38']}</span>}
            </li>
          </ul>
          <p><strong>The Icelandic government</strong></p>
          <ul className="list-disc pl-5">
            <li>has set up a fund to support the production of more digital content in the language</li>
            <li>believes that Icelandic has a secure future</li>
            <li>is worried that young Icelanders may lose their <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['39'], correctAnswers['39'], '39') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> as Icelanders
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['39']}</span>}
            </li>
            <li>is worried about the consequences of children not being <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} disabled={!isTestStarted || submitted} className={`inline w-32 ${submitted ? (checkAnswerWithMatching(answers['40'], correctAnswers['40'], '40') ? 'bg-green-50' : 'bg-red-50') : ''}`} /> in either Icelandic or English
              {submitted && <span className="text-xs ml-2 text-gray-600">Correct: {correctAnswers['40']}</span>}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageViewTracker book="book-17" module="listening" testNumber={2} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listening Tests</Link>
            <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 17 - Test 2 Listening</h1>
        </div>
        <LocalAudioPlayer audioSrc={AUDIO_URLS.book17.test2} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="Cambridge IELTS 17 - Listening Test 2" />
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
                        if (qNum === '21') return null;
                        displayQNum = 'Q21-22';
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
        <TestStatistics book="book-17" module="listening" testNumber={2} />
        <UserTestHistory book="book-17" module="listening" testNumber={2} />
      </div>
    </div>
  );
}