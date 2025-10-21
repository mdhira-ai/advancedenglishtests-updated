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

// Correct answers for Cambridge 11, Listening Test 3
const correctAnswers: { [key: string]: string } = {
  // Section 1
  '1': 'B', '2': 'C', '3': 'B', '4': 'A', '5': 'C', '6': 'A',
  '7': 'birds', '8': 'flowers', '9': 'mushrooms', '10': 'river',

  // Section 2
  '11': 'C', '12': 'B', '13': 'B', '14': 'A', '15': 'C',
  '16': 'G', '17': 'A', '18': 'C', '19': 'B', '20': 'F',

  // Section 3
  '21': 'cave', '22': 'tiger', '23': 'dancing', '24': 'crying',
  '25': 'grass', '26': 'scarf',
  '27': 'A', '28': 'C', '29': 'D', '30': 'B',

  // Section 4
  '31': 'attitude/attitudes', '32': 'numbers', '33': 'time/minutes',
  '34': 'software', '35': 'patients', '36': 'emotions/feelings',
  '37': 'income', '38': 'comfortable', '39': 'observation', '40': 'analysis',
};

export default function Test3Page() {
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const userAnswer = answers[questionNumber]?.trim() || '';
    const correctAnswer = correctAnswers[questionNumber];

    if (!userAnswer) {
      return false;
    }

    if (/^[A-G]$/.test(correctAnswer)) {
      return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    }
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  };
  
  const calculateScore = () => {
    return Object.keys(correctAnswers).reduce((acc, qNum) => {
      return acc + (checkAnswer(qNum) ? 1 : 0);
    }, 0);
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
        testNumber: 3,
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
  
  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default';
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect';
  };

  const handleTestStart = () => setIsTestStarted(true);

  const renderSingleChoiceQuestion = (questionNumber: string, questionText: string, options: string[]) => {
    const status = getAnswerStatus(questionNumber);
    const statusClass = status === 'correct' ? 'bg-green-50' : status === 'incorrect' ? 'bg-red-50' : '';

    return (
        <div key={questionNumber}>
            <p className="font-medium mb-2">{questionNumber}. {questionText}</p>
            <div className={`${statusClass} p-2 rounded`}>
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
                {submitted && (
                    <div className="mt-2 flex items-center gap-2">
                        {status === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-sm text-gray-600">Correct answer: {correctAnswers[questionNumber]}</span>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderSection1 = () => (
    <Card className="mb-6">
        <CardHeader>
            <CardTitle>Section 1 - Questions 1-10</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Questions 1-6 */}
            <div className="mb-8">
                <h4 className="font-semibold mb-2">Questions 1-6</h4>
                <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
                <h3 className="font-bold text-center text-lg mb-4">Free activities in the Burnham area</h3>
                
                {/* Example Box */}
                <div className="border-2 border-gray-400 p-4 mb-6 bg-gray-50">
                    <div className="mb-2">
                        <span className="font-semibold italic">Example</span>
                    </div>
                    <div className="ml-4">
                        <p className="mb-2">The caller wants to find out about events on</p>
                        <div className="ml-4 space-y-1">
                            <div>A&nbsp;&nbsp;&nbsp;&nbsp;27 June.</div>
                            <div>B&nbsp;&nbsp;&nbsp;&nbsp;28 June.</div>
                            <div className="flex items-center">
                                <span className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-sm font-bold mr-2">C</span>
                                <span>29 June.</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    {renderSingleChoiceQuestion('1', "The 'Family Welcome' event in the art gallery begins at", ['10 am.', '10.30 am.', '2 pm.'])}
                    {renderSingleChoiceQuestion('2', "The film that is now shown in the 'Family Welcome' event is about", ['sculpture.', 'painting.', 'ceramics.'])}
                    {renderSingleChoiceQuestion('3', 'When do most of the free concerts take place?', ['in the morning', 'at lunchtime', 'in the evening'])}
                    {renderSingleChoiceQuestion('4', 'Where will the 4 pm concert of Latin American music take place?', ['in a museum', 'in a theatre', 'in a library'])}
                    {renderSingleChoiceQuestion('5', 'The boat race begins at', ['Summer Pool.', 'Charlesworth Bridge.', 'Offord Marina.'])}
                    {renderSingleChoiceQuestion('6', 'One of the boat race teams', ['won a regional competition earlier this year.', 'has represented the region in a national competition.', 'has won several regional competitions.'])}
                </div>
            </div>
            
            {/* Questions 7-10 */}
            <div>
                <h4 className="font-semibold mb-2">Questions 7-10</h4>
                <p className="text-sm font-semibold mb-4">Complete the sentences below. Write ONE WORD ONLY for each answer.</p>
                <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                    <h3 className="font-bold text-center text-lg mb-4">Paxton Nature Reserve</h3>
                    {[
                        {num: '7', text: 'Paxton is a good place for seeing rare ____ all year round.'},
                        {num: '8', text: 'This is a particularly good time for seeing certain unusual ____.'},
                        {num: '9', text: 'Visitors will be able to learn about ____ and then collect some.'},
                        {num: '10', text: 'Part of the ____ has been made suitable for swimming.'}
                    ].map(({num, text}) => (
                        <div key={num} className="flex items-center gap-2">
                            <span>{num}.</span>
                            <span className="flex-1" dangerouslySetInnerHTML={{ __html: text.replace('____', `<input type="text" value="${answers[num] || ''}" class="inline-block w-32 mx-2 p-1 border rounded" ${submitted ? 'disabled' : ''} onchange="this.dispatchEvent(new CustomEvent('input-change', { bubbles: true, detail: { q: '${num}', v: this.value }}))" />`) }}
                                  onInput={(e: any) => { if (e.target.tagName === 'INPUT') handleInputChange(e.detail.q, e.detail.v); }}
                            ></span>
                             {submitted && <span className={`flex items-center gap-1 ${getAnswerStatus(num) === 'correct' ? 'text-green-600' : 'text-red-600'}`}>{getAnswerStatus(num) === 'correct' ? <CheckCircle size={16}/> : <><XCircle size={16}/> ({correctAnswers[num]})</>}</span>}
                        </div>
                    ))}
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
             {/* Questions 11-15 */}
            <div className="mb-8">
                <h4 className="font-semibold mb-2">Questions 11-15</h4>
                <p className="text-sm font-semibold mb-4">Choose the correct letter, A, B or C.</p>
                <h3 className="font-bold text-center text-lg mb-4">Changes in Barford over the last 50 years</h3>
                <div className="space-y-6">
                    {renderSingleChoiceQuestion('11', "In Shona's opinion, why do fewer people use buses in Barford these days?", ['The buses are old and uncomfortable.', 'Fares have gone up too much.', 'There are not so many bus routes.'])}
                    {renderSingleChoiceQuestion('12', 'What change in the road network is known to have benefited the town most?', ['the construction of a bypass', 'the development of cycle paths', 'the banning of cars from certain streets'])}
                    {renderSingleChoice_question('13', 'What is the problem affecting shopping in the town centre?', ['lack of parking spaces', 'lack of major retailers', 'lack of restaurants and cafés'])}
                    {renderSingleChoiceQuestion('14', 'What does Shona say about medical facilities in Barford?', ['There is no hospital.', 'New medical practices are planned.', 'The number of dentists is too low.'])}
                    {renderSingleChoiceQuestion('15', 'The largest number of people are employed in', ['manufacturing.', 'services.', 'education.'])}
                </div>
            </div>

            {/* Questions 16-20 */}
             <div>
                <h4 className="font-semibold mb-2">Questions 16-20</h4>
                <p className="text-sm font-semibold mb-4">What is planned for each of the following facilities? Choose FIVE answers from the box and write the correct letter, A-G, next to Questions 16-20.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-bold mb-2 text-center">Plans</h4>
                        <ul className="space-y-1 text-sm">
                            <li><strong>A</strong> It will move to a new location.</li>
                            <li><strong>B</strong> It will have its opening hours extended.</li>
                            <li><strong>C</strong> It will be refurbished.</li>
                            <li><strong>D</strong> It will be used for a different purpose.</li>
                            <li><strong>E</strong> It will have its opening hours reduced.</li>
                            <li><strong>F</strong> It will have new management.</li>
                            <li><strong>G</strong> It will be expanded.</li>
                        </ul>
                    </div>
                     <div className="space-y-3">
                         <h4 className="font-bold mb-2">Facilities</h4>
                         {[16, 17, 18, 19, 20].map(qNum => (
                             <div key={qNum} className="flex items-center gap-2">
                                 <span className="w-40">{qNum}. { {16: 'railway station car park', 17: 'cinema', 18: 'indoor market', 19: 'library', 20: 'nature reserve'}[qNum] }</span>
                                 <Input type="text" value={answers[String(qNum)] || ''} onChange={e => handleInputChange(String(qNum), e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} maxLength={1} className={`w-12 text-center ${getAnswerStatus(String(qNum)) === 'correct' ? 'border-green-500' : getAnswerStatus(String(qNum)) === 'incorrect' ? 'border-red-500' : ''}`} />
                                 {submitted && getAnswerStatus(String(qNum)) !== 'default' && (getAnswerStatus(String(qNum)) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                             </div>
                         ))}
                     </div>
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
        {/* Questions 21-26 */}
        <div className="mb-8">
            <h4 className="font-semibold mb-2">Questions 21-26</h4>
            <p className="text-sm font-semibold mb-4">Complete the table below. Write ONE WORD ONLY for each answer.</p>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Subject of drawing</th>
                        <th className="border border-gray-300 p-2 text-left">Change to be made</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        {q1: '21', q2: '22', subject: 'A ____ surrounded by trees', change: 'Add Malcolm and a ____ noticing him'},
                        {q1: '23', q2: '24', subject: 'People who are ____ outside the forest', change: 'Add Malcolm sitting on a tree trunk and ____'},
                        {q1: '25', q2: '26', subject: 'Ice-skaters on ____ covered with ice', change: 'Add a ____ for each person'},
                    ].map(({q1, q2, subject, change}) => (
                         <tr key={q1}>
                            <td className="border border-gray-300 p-2" dangerouslySetInnerHTML={{ __html: subject.replace('____', `<input type="text" value="${answers[q1] || ''}" class="inline-block w-24 mx-1 p-1 border rounded" ${submitted ? 'disabled' : ''} oninput="this.dispatchEvent(new CustomEvent('input-change', { bubbles: true, detail: { q: '${q1}', v: this.value }}))" />`) }}
                                onInput={(e: any) => { if (e.target.tagName === 'INPUT') handleInputChange(e.detail.q, e.detail.v); }}>
                            </td>
                            <td className="border border-gray-300 p-2" dangerouslySetInnerHTML={{ __html: change.replace('____', `<input type="text" value="${answers[q2] || ''}" class="inline-block w-24 mx-1 p-1 border rounded" ${submitted ? 'disabled' : ''} oninput="this.dispatchEvent(new CustomEvent('input-change', { bubbles: true, detail: { q: '${q2}', v: this.value }}))" />`) }}
                                onInput={(e: any) => { if (e.target.tagName === 'INPUT') handleInputChange(e.detail.q, e.detail.v); }}>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {/* Questions 27-30 */}
        <div>
            <h4 className="font-semibold mb-2">Questions 27-30</h4>
            <p className="text-sm font-semibold mb-4">Who is going to write each of the following parts of the report? Write the correct letter, A-D, next to Questions 27-30.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <ul className="space-y-1 text-sm">
                        <li><strong>A</strong> Helen only</li>
                        <li><strong>B</strong> Jeremy only</li>
                        <li><strong>C</strong> both Helen and Jeremy</li>
                        <li><strong>D</strong> neither Helen nor Jeremy</li>
                    </ul>
                </div>
                 <div className="space-y-3">
                     <h4 className="font-bold mb-2">Parts of the report</h4>
                     {[27, 28, 29, 30].map(qNum => (
                         <div key={qNum} className="flex items-center gap-2">
                             <span className="w-48">{qNum}. { {27: 'how they planned the project', 28: 'how they had ideas for their stories', 29: 'an interpretation of their stories', 30: 'comments on the illustrations'}[qNum] }</span>
                             <Input type="text" value={answers[String(qNum)] || ''} onChange={e => handleInputChange(String(qNum), e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} maxLength={1} className={`w-12 text-center ${getAnswerStatus(String(qNum)) === 'correct' ? 'border-green-500' : getAnswerStatus(String(qNum)) === 'incorrect' ? 'border-red-500' : ''}`} />
                             {submitted && getAnswerStatus(String(qNum)) !== 'default' && (getAnswerStatus(String(qNum)) === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />)}
                         </div>
                     ))}
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
            <p className="text-sm font-semibold mb-4">Complete the notes below. Write ONE WORD ONLY for each answer.</p>
        </CardHeader>
        <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                 <h3 className="font-bold text-center text-lg mb-4">Ethnography in Business</h3>
                 <div>
                    <p>Ethnography: research which explores human cultures.</p>
                    <p>It can be used in business:</p>
                    <ul className="list-disc list-inside ml-4">
                        <li>to investigate customer needs and <span>31</span><Input type="text" value={answers['31'] || ''} onChange={(e) => handleInputChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /></li>
                        <li>to help companies develop new designs</li>
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-semibold">Examples of ethnographic research in business</h4>
                    <ul className="list-disc list-inside ml-4">
                        <li><strong>Kitchen equipment:</strong> Researchers found that cooks could not easily see the <span>32</span><Input type="text" value={answers['32'] || ''} onChange={(e) => handleInputChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> in measuring cups.</li>
                        <li><strong>Cell phones:</strong> In Uganda, customers paid to use the cell phones of entrepreneurs. These customers wanted to check the <span>33</span><Input type="text" value={answers['33'] || ''} onChange={(e) => handleInputChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> used.</li>
                        <li><strong>Computer companies:</strong> There was a need to develop <span>34</span><Input type="text" value={answers['34'] || ''} onChange={(e) => handleInputChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> to improve communication between system administrators and colleagues.</li>
                        <li><strong>Hospitals:</strong> Nurses needed to access information about <span>35</span><Input type="text" value={answers['35'] || ''} onChange={(e) => handleInputChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> in different parts of the hospital.</li>
                        <li><strong>Airlines:</strong> Respondents recorded information about their <span>36</span><Input type="text" value={answers['36'] || ''} onChange={(e) => handleInputChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> while travelling.</li>
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-semibold">Principles of ethnographic research in business</h4>
                    <ul className="list-disc list-inside ml-4">
                        <li>The researcher does not start off with a hypothesis.</li>
                        <li>Participants may be selected by criteria such as age, <span>37</span><Input type="text" value={answers['37'] || ''} onChange={(e) => handleInputChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> or product used.</li>
                        <li>The participants must feel <span>38</span><Input type="text" value={answers['38'] || ''} onChange={(e) => handleInputChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> about taking part in the research.</li>
                        <li>There is usually direct <span>39</span><Input type="text" value={answers['39'] || ''} onChange={(e) => handleInputChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> of the participants.</li>
                        <li>The interview is guided by the participant.</li>
                        <li>A lot of time is needed for the <span>40</span><Input type="text" value={answers['40'] || ''} onChange={(e) => handleInputChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} className="inline-block w-32 ml-2 p-1 border rounded" /> of the data.</li>
                        <li>Researchers look for a meaningful pattern in the data.</li>
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
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 11 - Test 3 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book11.test3}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 11 - Listening Test 3"
        />

        <div className="my-6 flex justify-center space-x-2">
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

        {currentSection === 1 && renderSection1()}
        {currentSection === 2 && renderSection2()}
        {currentSection === 3 && renderSection3()}
        {currentSection === 4 && renderSection4()}

        <div className="flex gap-4 justify-center mt-8">
          <Button 
            onClick={handleSubmit}
            disabled={!isTestStarted || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
        </div>

        {showResultsPopup && (
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
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(correctAnswers).map(([qNum, correctAns]) => {
                    const isCorrect = checkAnswer(qNum);
                    const userAnswer = answers[qNum] || 'No answer';
                    return (
                      <div 
                        key={qNum}
                        className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Q{qNum}</span>
                          {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-gray-600">Your: </span>
                            <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span>
                          </div>
                          {!isCorrect && (
                             <div>
                              <span className="text-gray-600">Correct: </span>
                              <span className="text-green-700 font-medium">{correctAns}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-11"
        module="listening"
        testNumber={3}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <TestStatistics 
          book="book-11"
          module="listening"
          testNumber={3}
        />
        <UserTestHistory 
          book="book-11"
          module="listening"
          testNumber={3}
        />
      </div>
    </div>
  );
}

// A simple utility function to avoid repeating the whole render logic for single choice questions
const renderSingleChoice_question = (qNum: string, question: string, options: string[]) => {
    // This is a placeholder that would be implemented inside the main component
    // where it has access to state and handlers.
    // In the final code, this logic is integrated into renderSingleChoiceQuestion.
    return <div></div>; 
}