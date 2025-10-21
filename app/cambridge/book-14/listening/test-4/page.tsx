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

const correctAnswers: { [key: string]: string } = {
  // Section 1
  '1': '85', '2': 'roses', '3': 'trees', '4': 'stage', '5': 'speech', '6': 'support', '7': 'cabins', '8': 'C', '9': 'A', '10': 'B',
  // Section 2
  '11': 'G', '12': 'D', '13': 'A', '14': 'E', '15': 'F', '16': 'B', '17': 'B', '18': 'D', '19': 'A', '20': 'D',
  // Section 3
  '21': 'A', '22': 'C', '23': 'A', '24': 'B', '25': 'B', '26': 'F', '27': 'E', '28': 'C', '29': 'B', '30': 'G',
  // Section 4
  '31': 'spring', '32': 'tools', '33': 'maps', '34': 'heavy', '35': 'marble', '36': 'light', '37': 'camera/cameras', '38': 'medical', '39': 'eyes', '40': 'wine',
};
const correctSet17_18 = ['B', 'E'];
const correctSet19_20 = ['A', 'D'];

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '17_18': [], '19_20': [],
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

  const handleInputChange = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toLowerCase() }));
  const handleMultipleChoice = (qNum: string, val: string) => setAnswers(prev => ({ ...prev, [qNum]: val.toUpperCase() }));

  const handleMultiSelect = (key: '17_18' | '19_20', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        const newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const calculateScore = () => {
    let correctCount = 0; const scoredMulti = new Set();
    Object.keys(correctAnswers).forEach(qNum => {
        if (['17', '18'].includes(qNum)) {
            if (!scoredMulti.has('17_18')) {
                (multipleAnswers['17_18'] || []).forEach(a => { if (correctSet17_18.includes(a)) correctCount++; });
                scoredMulti.add('17_18');
            }
        } else if (['19', '20'].includes(qNum)) {
            if (!scoredMulti.has('19_20')) {
                (multipleAnswers['19_20'] || []).forEach(a => { if (correctSet19_20.includes(a)) correctCount++; });
                scoredMulti.add('19_20');
            }
        } else {
            if (checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum)) correctCount++;
        }
    });
    return correctCount;
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    const calculatedScore = calculateScore(); setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    try {
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-14',
        module: 'listening',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSListeningScore(calculatedScore),
        timeTaken: timeTaken || 0
      };
      
      const result = await saveTestScore(testScoreData, session);
      
      if (result.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', result.error);
      }
    } catch (error) { console.error('Error submitting test:', error); }
    setSubmitted(true); setShowResultsPopup(true); setIsSubmitting(false);
  };
 
  const renderMultiSelect = (key: '17_18' | '19_20', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h4 className="font-semibold mb-2">{title}</h4><p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => { const opt = String.fromCharCode(65 + index);
            return <label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={multipleAnswers[key].includes(opt)} onChange={() => handleMultiSelect(key, opt)} disabled={!isTestStarted || submitted} /><span>{opt} {option}</span></label>;
            })}
        </div>
        {submitted && <div className="mt-2 text-sm">Correct: {correctSet.join(', ')}</div>}
    </div>
  );
  
  const renderMatchingInput = (startQ: number, endQ: number, items: string[], boxTitle: string, boxOptions: string[]) => (
     <div className="space-y-2">
        <div className="border rounded-lg p-4 mb-4 text-sm"><p className="font-semibold">{boxTitle}</p>{boxOptions.map(opt => <p key={opt}>{opt}</p>)}</div>
        {items.map((item, index) => {
            const qNum = String(startQ + index);
            const isCorrect = submitted && checkAnswerWithMatching(answers[qNum] || '', correctAnswers[qNum], qNum);
            return (<div key={qNum} className={`flex items-center p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : ''}`}>
                    <span className="flex-1"><strong>{qNum}</strong> {item}</span><Input value={answers[qNum] || ''} onChange={e => handleMultipleChoice(qNum, e.target.value)} disabled={!isTestStarted || submitted} className="w-16 text-center" /></div>);
        })}
    </div>
  );
  
  const renderSection1 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 1 - Questions 1-10</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-4">Questions 1-7: Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
              <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                  <h3 className="font-bold text-center text-lg mb-4">Enquiry about booking hotel room for event</h3>
                  <p>Example: Andrew is the <span className="underline">Events</span> Manager</p>
                  <p><strong>Rooms</strong></p>
                  <p>Adelphi Room:</p>
                  <ul className="list-disc pl-5"><li>number of people who can sit down to eat: <strong>1</strong> <Input value={answers['1'] || ''} onChange={e => handleInputChange('1', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-20"/></li>
                      <li>has a gallery suitable for musicians</li>
                      <li>can go out and see the <strong>2</strong> <Input value={answers['2'] || ''} onChange={e => handleInputChange('2', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24"/> in pots on the terrace</li>
                      <li>terrace has a view of a group of <strong>3</strong> <Input value={answers['3'] || ''} onChange={e => handleInputChange('3', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24"/></li>
                  </ul>
                  <p>Carlton Room:</p>
                  <ul className="list-disc pl-5">
                      <li>number of people who can sit down to eat: 110</li>
                      <li>has a <strong>4</strong> <Input value={answers['4'] || ''} onChange={e => handleInputChange('4', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24"/></li><li>view of the lake</li>
                  </ul>
                  <p><strong>Options</strong></p>
                  <ul className="list-disc pl-5">
                      <li>Master of Ceremonies: can give a <strong>5</strong> <Input value={answers['5'] || ''} onChange={e => handleInputChange('5', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24"/> while people are eating</li>
                      <li>will provide <strong>6</strong> <Input value={answers['6'] || ''} onChange={e => handleInputChange('6', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24"/> if there are any problems</li>
                  </ul>
                  <p>Accommodation: in hotel rooms or <strong>7</strong> <Input value={answers['7'] || ''} onChange={e => handleInputChange('7', e.target.value)} disabled={!isTestStarted || submitted} className="inline w-24"/></p>
              </div>
            </div>
            <div>
                <p className="text-sm font-semibold mb-4">Questions 8-10: What is said about using each of the following hotel facilities?</p>
                {renderMatchingInput(8, 10, ['outdoor swimming pool', 'gym', 'tennis courts'], 'Availability', ['A included in cost of hiring room', 'B available at extra charge', 'C not available'])}
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
      <CardContent className="space-y-8">
        <div>
          <p className="text-sm font-semibold mb-4">Questions 11-16: What information does the speaker give about each of the following excursions?</p>
          {renderMatchingInput(11, 16, ['dolphin watching', 'forest walk', 'cycle trip', 'local craft tour', 'observatory trip', 'horse riding'], 
          'Information', ['A all downhill', 'B suitable for beginners', 'C only in good weather', 'D food included', 'E no charge', 'F swimming possible', 'G fully booked today', 'H transport not included'])}
        </div>
        {renderMultiSelect('17_18', 'Questions 17 and 18', 'Which TWO things does the speaker say about the attraction called Musical Favourites?', 
        ['You pay extra for drinks.', 'You must book it in advance.', 'You get a reduction if you buy two tickets.', 'You can meet the performers.', 'You can take part in the show.'], correctSet17_18)}
        {renderMultiSelect('19_20', 'Questions 19 and 20', 'Which TWO things does the speaker say about the Castle Feast?',
        ['Visitors can dance after the meal.', 'There is a choice of food.', 'Visitors wear historical costume.', 'Knives and forks are not used.', 'The entertainment includes horse races.'], correctSet19_20)}
      </CardContent>
    </Card>
  );

  const renderSection3 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm font-semibold mb-4">Questions 21-25: Choose the correct letter, A, B or C.</p>
          <div className="space-y-6 mb-8">
            <div>
              <p className="mb-3"><strong>21</strong> What does Trevor find interesting about the purpose of children's literature?</p>
              <div className="space-y-2 ml-4">
                {['A', 'B', 'C'].map(option => {
                  const options = {
                    'A': 'the fact that authors may not realise what values they\'re teaching',
                    'B': 'the fact that literature can be entertaining and educational at the same time',
                    'C': 'the fact that adults expect children to imitate characters in literature'
                  };
                  const isCorrect = submitted && answers['21'] === option && correctAnswers['21'] === option;
                  const isIncorrect = submitted && answers['21'] === option && correctAnswers['21'] !== option;
                  return (
                    <label key={option} className={`flex items-start space-x-2 p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : isIncorrect ? 'bg-red-50' : '') : ''}`}>
                      <input type="radio" name="q21" value={option} checked={answers['21'] === option} onChange={() => handleMultipleChoice('21', option)} disabled={!isTestStarted || submitted} />
                      <span><strong>{option}</strong> {options[option as keyof typeof options]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3"><strong>22</strong> Trevor says the module about the purpose of children's literature made him</p>
              <div className="space-y-2 ml-4">
                {['A', 'B', 'C'].map(option => {
                  const options = {
                    'A': 'analyse some of the stories that his niece reads.',
                    'B': 'wonder how far popularity reflects good quality.',
                    'C': 'decide to start writing some children\'s stories.'
                  };
                  const isCorrect = submitted && answers['22'] === option && correctAnswers['22'] === option;
                  const isIncorrect = submitted && answers['22'] === option && correctAnswers['22'] !== option;
                  return (
                    <label key={option} className={`flex items-start space-x-2 p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : isIncorrect ? 'bg-red-50' : '') : ''}`}>
                      <input type="radio" name="q22" value={option} checked={answers['22'] === option} onChange={() => handleMultipleChoice('22', option)} disabled={!isTestStarted || submitted} />
                      <span><strong>{option}</strong> {options[option as keyof typeof options]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3"><strong>23</strong> Stephanie is interested in the Pictures module because</p>
              <div className="space-y-2 ml-4">
                {['A', 'B', 'C'].map(option => {
                  const options = {
                    'A': 'she intends to become an illustrator.',
                    'B': 'she can remember beautiful illustrations from her childhood.',
                    'C': 'she believes illustrations are more important than words.'
                  };
                  const isCorrect = submitted && answers['23'] === option && correctAnswers['23'] === option;
                  const isIncorrect = submitted && answers['23'] === option && correctAnswers['23'] !== option;
                  return (
                    <label key={option} className={`flex items-start space-x-2 p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : isIncorrect ? 'bg-red-50' : '') : ''}`}>
                      <input type="radio" name="q23" value={option} checked={answers['23'] === option} onChange={() => handleMultipleChoice('23', option)} disabled={!isTestStarted || submitted} />
                      <span><strong>{option}</strong> {options[option as keyof typeof options]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3"><strong>24</strong> Trevor and Stephanie agree that comics</p>
              <div className="space-y-2 ml-4">
                {['A', 'B', 'C'].map(option => {
                  const options = {
                    'A': 'are inferior to books.',
                    'B': 'have the potential for being useful.',
                    'C': 'discourage children from using their imagination.'
                  };
                  const isCorrect = submitted && answers['24'] === option && correctAnswers['24'] === option;
                  const isIncorrect = submitted && answers['24'] === option && correctAnswers['24'] !== option;
                  return (
                    <label key={option} className={`flex items-start space-x-2 p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : isIncorrect ? 'bg-red-50' : '') : ''}`}>
                      <input type="radio" name="q24" value={option} checked={answers['24'] === option} onChange={() => handleMultipleChoice('24', option)} disabled={!isTestStarted || submitted} />
                      <span><strong>{option}</strong> {options[option as keyof typeof options]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3"><strong>25</strong> With regard to books aimed at only boys or only girls, Trevor was surprised</p>
              <div className="space-y-2 ml-4">
                {['A', 'B', 'C'].map(option => {
                  const options = {
                    'A': 'how long the distinction had gone unquestioned.',
                    'B': 'how few books were aimed at both girls and boys.',
                    'C': 'how many children enjoyed books intended for the opposite sex.'
                  };
                  const isCorrect = submitted && answers['25'] === option && correctAnswers['25'] === option;
                  const isIncorrect = submitted && answers['25'] === option && correctAnswers['25'] !== option;
                  return (
                    <label key={option} className={`flex items-start space-x-2 p-2 rounded ${submitted ? (isCorrect ? 'bg-green-50' : isIncorrect ? 'bg-red-50' : '') : ''}`}>
                      <input type="radio" name="q25" value={option} checked={answers['25'] === option} onChange={() => handleMultipleChoice('25', option)} disabled={!isTestStarted || submitted} />
                      <span><strong>{option}</strong> {options[option as keyof typeof options]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold mb-4">Questions 26-30: What comment is made about each of these stories?</p>
          {renderMatchingInput(26, 30, ["Perrault's fairy tales", "The Swiss Family Robinson", "The Nutcracker and the Mouse King", "The Lord of the Rings", "War Horse"],
          'Comments', ['A translated into many other languages', 'B hard to read', 'C inspired a work in a different area of art', 'D more popular than the author\'s other works', 'E original title refers to another book', 'F started a new genre', 'G unlikely topic'])}
        </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card className="mb-6"><CardHeader><CardTitle>Section 4 - Questions 31-40</CardTitle></CardHeader>
        <CardContent>
            <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
              <h3 className="font-bold text-center text-lg mb-4">The hunt for sunken settlements and ancient shipwrecks</h3>
              <p><strong>ATLIT-YAM</strong></p>
              <ul className="list-disc pl-5">
                  <li>was a village on coast of eastern Mediterranean, thrived until about 7,000 BC</li>
                  <li>stone homes had a courtyard, had a semicircle of large stones round a <strong>31</strong> <Input value={answers['31'] || ''} onChange={e => handleInputChange('31', e.target.value)} className="inline w-32"/></li>
                  <li>cause of destruction unknown – now under the sea, biggest settlement from the prehistoric period found on the seabed</li>
                  <li>research carried out into structures, <strong>32</strong> <Input value={answers['32'] || ''} onChange={e => handleInputChange('32', e.target.value)} className="inline w-32"/> and human remains</li>
              </ul>
              <p><strong>TRADITIONAL AUTONOMOUS UNDERWATER VEHICLES (AUVs)</strong></p>
              <ul className="list-disc pl-5">
                <li>used in the oil industry, e.g. to make <strong>33</strong> <Input value={answers['33'] || ''} onChange={e => handleInputChange('33', e.target.value)} className="inline w-32"/></li>
                <li>problems: they were expensive and <strong>34</strong> <Input value={answers['34'] || ''} onChange={e => handleInputChange('34', e.target.value)} className="inline w-32"/></li>
              </ul>
              <p><strong>LATEST AUVs</strong></p>
              <ul className="list-disc pl-5">
                <li>much easier to use, relatively cheap, sophisticated</li>
                <li>Tests: Marzameni, Sicily: found ancient Roman ships carrying architectural elements made of <strong>35</strong> <Input value={answers['35'] || ''} onChange={e => handleInputChange('35', e.target.value)} className="inline w-32"/></li>
              </ul>
              <p><strong>Underwater Internet:</strong></p>
              <ul className="list-disc pl-5">
                  <li><strong>36</strong> <Input value={answers['36'] || ''} onChange={e => handleInputChange('36', e.target.value)} className="inline w-32"/> is used for short distance communication, acoustic waves for long distance</li>
                  <li>plans for communication with researchers by satellite</li>
                  <li>AUV can send data to another AUV that has better <strong>37</strong> <Input value={answers['37'] || ''} onChange={e => handleInputChange('37', e.target.value)} className="inline w-32"/>, for example</li>
              </ul>
              <p><strong>Planned research in Gulf of Baratti:</strong></p>
              <ul className="list-disc pl-5">
                  <li>to find out more about wrecks of ancient Roman ships, including</li>
                  <li>one carrying <strong>38</strong> <Input value={answers['38'] || ''} onChange={e => handleInputChange('38', e.target.value)} className="inline w-32"/> supplies; tablets may have been used for cleaning the <strong>39</strong> <Input value={answers['39'] || ''} onChange={e => handleInputChange('39', e.target.value)} className="inline w-32"/></li>
                  <li>others carrying containers of olive oil or <strong>40</strong> <Input value={answers['40'] || ''} onChange={e => handleInputChange('40', e.target.value)} className="inline w-32"/></li>
              </ul>
            </div>
        </CardContent>
    </Card>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/cambridge/"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tests</Button></Link>
          <h1 className="text-3xl font-bold mb-4">Cambridge IELTS 14 - Test 4 Listening</h1>
          <LocalAudioPlayer audioSrc={AUDIO_URLS.book14.test4} onTestStart={() => setIsTestStarted(true)} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="C14 Listening Test 4" />
          <div className="my-4 flex justify-center space-x-2">{[1, 2, 3, 4].map(s => <Button key={s} variant={currentSection === s ? 'default' : 'outline'} onClick={() => setCurrentSection(s)} disabled={!isTestStarted || submitted}>Section {s}</Button>)}</div>
          {currentSection === 1 && renderSection1()}
          {currentSection === 2 && renderSection2()}
          {currentSection === 3 && renderSection3()}
          {currentSection === 4 && renderSection4()}
          <div className="text-center mt-6"><Button onClick={handleSubmit} disabled={!isTestStarted || submitted} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        </div>
        
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
                {/* Questions 1-16 */}
                {Array.from({length: 16}, (_, i) => i + 1).map(qNum => {
                  const qNumStr = String(qNum);
                  const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  const userAnswer = answers[qNumStr] || '';
                  return (
                    <div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Q{qNumStr}</span>
                        {isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}
                      </div>
                      <p>Your: {userAnswer || 'No Answer'}</p>
                      {!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}
                    </div>
                  );
                })}
                
                {/* Questions 17-18 (Multi-select) */}
                <div className="p-3 rounded border bg-blue-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Q17-18</span>
                    <div className="text-sm">Multi-select</div>
                  </div>
                  <p>Your: {(multipleAnswers['17_18'] || []).join(', ') || 'No Answer'}</p>
                  <p>Correct: {correctSet17_18.join(', ')}</p>
                  <p className="text-xs">Score: {(multipleAnswers['17_18'] || []).filter(a => correctSet17_18.includes(a)).length}/2</p>
                </div>
                
                {/* Questions 19-20 (Multi-select) */}
                <div className="p-3 rounded border bg-blue-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Q19-20</span>
                    <div className="text-sm">Multi-select</div>
                  </div>
                  <p>Your: {(multipleAnswers['19_20'] || []).join(', ') || 'No Answer'}</p>
                  <p>Correct: {correctSet19_20.join(', ')}</p>
                  <p className="text-xs">Score: {(multipleAnswers['19_20'] || []).filter(a => correctSet19_20.includes(a)).length}/2</p>
                </div>
                
                {/* Questions 21-40 */}
                {Array.from({length: 20}, (_, i) => i + 21).map(qNum => {
                  const qNumStr = String(qNum);
                  const isCorrect = checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr], qNumStr);
                  const userAnswer = answers[qNumStr] || '';
                  return (
                    <div key={qNumStr} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Q{qNumStr}</span>
                        {isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}
                      </div>
                      <p>Your: {userAnswer || 'No Answer'}</p>
                      {!isCorrect && <p>Correct: {correctAnswers[qNumStr]}</p>}
                    </div>
                  );
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
        testNumber={4} 
      />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TestStatistics book="book-14" module="listening" testNumber={4} />
          <UserTestHistory book="book-14" module="listening" testNumber={4} />
        </div>
      </div>
    </>
  );
}