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

// Correct answers for Cambridge 11, Listening Test 4
const correctAnswers: { [key: string]: string } = {
  // Section 1
  '1': 'secondary',
  '2': 'flute',
  '3': 'cinema',
  '4': 'concert',
  '5': 'market',
  '6': 'Bythwaite',
  '7': 'actor',
  '8': 'A',
  '9': 'B',
  '10': 'C',

  // Section 2
  '11': 'E', '12': 'D', '13': 'G', '14': 'B', '15': 'C', '16': 'A',
  '17': 'F', '18': 'H', '19': 'C', '20': 'B',

  // Section 3
  '21': 'B', '22': 'D', // IN EITHER ORDER
  '23': 'A', '24': 'B', // IN EITHER ORDER
  '25': 'B', '26': 'E', // IN EITHER ORDER
  '27': 'C',
  '28': 'A',
  '29': 'A',
  '30': 'C',

  // Section 4
  '31': 'dry',
  '32': 'hard',
  '33': 'sugar/sugars',
  '34': 'roots',
  '35': 'moist/damp/wet',
  '36': 'variety',
  '37': 'cattle',
  '38': 'garden/gardening',
  '39': 'grasses',
  '40': 'payment/payments/money',
};

const groupedAnswerConfig: { [key: string]: { questions: string[]; answers: string[] } } = {
  '21-22': { questions: ['21', '22'], answers: ['B', 'E'] },
  '23-24': { questions: ['23', '24'], answers: ['A', 'D'] },
  '25-26': { questions: ['25', '26'], answers: ['A', 'D'] },
};

const questionToGroupMap: { [key: string]: string } = {};
Object.entries(groupedAnswerConfig).forEach(([groupKey, config]) => {
  config.questions.forEach(q => { questionToGroupMap[q] = groupKey; });
});

export default function Test4Page() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21-22': [], '23-24': [], '25-26': [],
  });
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

  const handleInputChange = (qNum: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qNum]: value }));
  };

  const handleMultipleAnswerChange = (groupKey: string, value: string) => {
    setMultipleAnswers(prev => {
      const currentSelection = prev[groupKey] || [];
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(v => v !== value)
        : [...currentSelection, value];
      
      if (newSelection.length > 2) return prev;
      return { ...prev, [groupKey]: newSelection };
    });
  };

  const checkSingleAnswer = (qNum: string) => {
    const userAnswer = answers[qNum]?.trim() || '';
    if (!userAnswer) return false;
    return checkAnswerWithMatching(userAnswer, correctAnswers[qNum], qNum);
  };
  
  const checkGroupedAnswers = (groupKey: string) => {
    const userSelection = (multipleAnswers[groupKey] || []).sort();
    const correctSelection = groupedAnswerConfig[groupKey].answers.sort();
    return userSelection.length === correctSelection.length && userSelection.every((v, i) => v === correctSelection[i]);
  };

  const checkIndividualGroupedAnswer = (qNum: string) => {
    const groupKey = questionToGroupMap[qNum];
    if (!groupKey) return false;
    
    const userSelection = multipleAnswers[groupKey] || [];
    const correctAnswer = correctAnswers[qNum];
    return userSelection.includes(correctAnswer);
  };

  const calculateScore = () => {
    let correctCount = 0;
    const countedQs = new Set<string>();

    // Check grouped questions individually
    Object.keys(groupedAnswerConfig).forEach(groupKey => {
      groupedAnswerConfig[groupKey].questions.forEach(qNum => {
        if (checkIndividualGroupedAnswer(qNum)) {
          correctCount++;
        }
        countedQs.add(qNum);
      });
    });

    // Check regular single answer questions
    Object.keys(correctAnswers).forEach(qNum => {
      if (!countedQs.has(qNum) && checkSingleAnswer(qNum)) {
        correctCount++;
      }
    });
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
        multipleAnswers: multipleAnswers || {},
        results: Object.keys(correctAnswers).map(questionNum => {
          const groupKey = questionToGroupMap[questionNum];
          let userAnswer, isCorrect;
          
          if (groupKey) {
            userAnswer = (multipleAnswers[groupKey] || []).join(', ');
            isCorrect = checkIndividualGroupedAnswer(questionNum);
          } else {
            userAnswer = answers[questionNum] || '';
            isCorrect = checkSingleAnswer(questionNum);
          }
          
          return {
            questionNumber: questionNum,
            userAnswer: userAnswer,
            correctAnswer: correctAnswers[questionNum],
            isCorrect: isCorrect
          };
        }),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-11',
        module: 'listening',
        testNumber: 4,
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
  
  const getAnswerStatus = (qNum: string) => {
    if (!submitted) return 'default';
    const groupKey = questionToGroupMap[qNum];
    if (groupKey) return checkIndividualGroupedAnswer(qNum) ? 'correct' : 'incorrect';
    return checkSingleAnswer(qNum) ? 'correct' : 'incorrect';
  };

  const handleTestStart = () => setIsTestStarted(true);
  
  const getInputBorderClass = (qNum: string) => {
    if (!submitted) return '';
    const status = getAnswerStatus(qNum);
    if (status === 'correct') return 'border-green-500';
    if (status === 'incorrect') return 'border-red-500';
    return '';
  };

  const TdInput = ({ qNum }: { qNum: string }) => {
    const status = getAnswerStatus(qNum);
    let borderClass = '';
    
    if (submitted) {
      if (status === 'correct') {
        borderClass = 'border-green-500';
      } else if (status === 'incorrect') {
        borderClass = 'border-red-500';
      }
    }
    
    return (
      <Input
          type="text"
          value={answers[qNum] || ''}
          onChange={(e) => handleInputChange(qNum, e.target.value)}
          disabled={!isTestStarted || isSubmitting}
          className={`w-28 ${borderClass}`}
      />
    );
  };
  
  const renderSection1 = () => (
    <Card className="mb-6">
        <CardHeader>
            <CardTitle>Section 1 - Questions 1-10</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Questions 1-7 */}
            <div className="mb-8">
                <h4 className="font-semibold mb-2">Questions 1-7</h4>
                <p className="text-sm font-semibold mb-4">Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.</p>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Event</th><th className="border p-2 text-left">Cost</th><th className="border p-2 text-left">Venue</th><th className="border p-2 text-left">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-2">Jazz band</td>
                            <td className="border p-2">Example: Tickets available for £<span className="underline">15</span></td>
                            <td className="border p-2">The <strong>1</strong> <TdInput qNum="1" /> school</td>
                            <td className="border p-2">Also appearing: Carolyn Hart (plays the <strong>2</strong> <TdInput qNum="2" />)</td>
                        </tr>
                        <tr>
                            <td className="border p-2">Duck races</td>
                            <td className="border p-2">£1 per duck</td>
                            <td className="border p-2">Start behind the <strong>3</strong> <TdInput qNum="3" /></td>
                            <td className="border p-2">Prize: tickets for <strong>4</strong> <TdInput qNum="4" /> held at the end of the festival. Ducks can be bought in the <strong>5</strong> <TdInput qNum="5" /></td>
                        </tr>
                        <tr>
                            <td className="border p-2">Flower show</td>
                            <td className="border p-2">Free</td>
                            <td className="border p-2"><strong>6</strong> <TdInput qNum="6" /> Hall</td>
                            <td className="border p-2">Prizes presented at 5 pm by a well-known <strong>7</strong> <TdInput qNum="7" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Questions 8-10 */}
            <div>
                <h4 className="font-semibold mb-2">Questions 8-10</h4>
                <p className="text-sm font-semibold mb-4">Who is each play suitable for? Write the correct letter, A, B or C, next to Questions 8-10.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <ul className="space-y-1">
                            <li><strong>A</strong> mainly for children</li>
                            <li><strong>B</strong> mainly for adults</li>
                            <li><strong>C</strong> suitable for people of all ages</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold">Plays</h4>
                        {['The Mystery of Muldoon', 'Fire and Flood', 'Silly Sailor'].map((play, i) => {
                            const qNum = String(8 + i);
                            return (
                                <div key={qNum} className="flex items-center gap-2">
                                    <span className="w-40">{qNum}. {play}</span>
                                    <Input type="text" value={answers[qNum] || ''} onChange={e => handleInputChange(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} maxLength={1} className={`w-12 text-center ${getInputBorderClass(qNum)}`} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );

  const renderSection2 = () => (
    <Card className="mb-6">
        <CardHeader><CardTitle>Section 2 - Questions 11-20</CardTitle></CardHeader>
        <CardContent>
            {/* Questions 11-16 */}
            <div className="mb-8">
                <h4 className="font-semibold mb-2">Questions 11-16</h4>
                <p className="text-sm font-semibold mb-4">What does the speaker say about each of the following collections? Choose SIX answers from the box and write the correct letter, A-G, next to Questions 11-16.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-bold mb-2 text-center">Comments</h4>
                        <ul className="space-y-1 text-sm">
                            <li>A. was given by one person</li><li>B. was recently publicised in the media</li><li>C. includes some items given by members of the public</li><li>D. includes some items given by the artists</li><li>E. includes the most popular exhibits in the museum</li><li>F. is the largest of its kind in the country</li><li>G. has had some of its contents relocated</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold mb-2">Collections</h4>
                        {['20th- and 21st-century paintings', '19th-century paintings', 'Sculptures', "'Around the world' exhibition", 'Coins', 'Porcelain and glass'].map((coll, i) => {
                            const qNum = String(11 + i);
                            return (
                                <div key={qNum} className="flex items-center gap-2">
                                    <span className="flex-1">{qNum}. {coll}</span>
                                    <Input type="text" value={answers[qNum] || ''} onChange={e => handleInputChange(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} maxLength={1} className={`w-12 text-center ${getInputBorderClass(qNum)}`} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Questions 17-20 */}
            <div>
                <h4 className="font-semibold mb-2">Questions 17-20</h4>
                <p className="text-sm font-semibold mb-4">Label the plan below. Write the correct letter, A-H, next to Questions 17-20.</p>
                <div className="text-center mb-4">
                  <img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/listening/test4/plan.png" alt="Basement of museum plan" className="mx-auto max-w-full h-auto rounded border shadow-lg" />
                </div>
                <div className="space-y-2">
                    {['restaurant', 'café', 'baby-changing facilities', 'cloakroom'].map((loc, i) => {
                        const qNum = String(17 + i);
                        return (
                             <div key={qNum} className="flex items-center gap-2">
                                <span className="w-48">{qNum}. {loc}</span>
                                <Input type="text" value={answers[qNum] || ''} onChange={e => handleInputChange(qNum, e.target.value.toUpperCase())} disabled={!isTestStarted || isSubmitting} maxLength={1} className={`w-12 text-center ${getInputBorderClass(qNum)}`} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </CardContent>
    </Card>
  );

  const renderMultipleChoiceGroup = (groupKey: string, questionText: string, options: string[]) => {
    const questions = groupedAnswerConfig[groupKey].questions;
    const hasAnyCorrect = submitted && questions.some(qNum => checkIndividualGroupedAnswer(qNum));
    const hasAnyIncorrect = submitted && questions.some(qNum => !checkIndividualGroupedAnswer(qNum));
    
    let status = '';
    if (submitted) {
      if (hasAnyCorrect && !hasAnyIncorrect) {
        status = 'bg-green-50';
      } else if (hasAnyCorrect && hasAnyIncorrect) {
        status = 'bg-yellow-50';
      } else {
        status = 'bg-red-50';
      }
    }
    
    return (
      <div className="mb-6">
        <p className="font-medium mb-2">{questionText}</p>
        <div className={`${status} p-2 rounded`}>
          <div className="space-y-2">
            {options.map((option, i) => {
              const val = String.fromCharCode(65 + i);
              return (
                <label key={val} className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" value={val} checked={(multipleAnswers[groupKey] || []).includes(val)} onChange={() => handleMultipleAnswerChange(groupKey, val)} disabled={!isTestStarted || isSubmitting} className="w-4 h-4" />
                  <span className="text-sm">{val}. {option}</span>
                </label>
              );
            })}
          </div>
          {submitted && (
            <div className="text-sm text-gray-600 mt-2">
              {questions.map(qNum => (
                <div key={qNum} className="flex justify-between">
                  <span>Q{qNum}: {checkIndividualGroupedAnswer(qNum) ? '✓' : '✗'}</span>
                  <span>Correct: {correctAnswers[qNum]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderSingleChoiceQuestion = (qNum: string, questionText: string, options: string[]) => {
    const status = getAnswerStatus(qNum);
    const bgClass = submitted ? (status === 'correct' ? 'bg-green-50' : status === 'incorrect' ? 'bg-red-50' : '') : '';
    
    return (
      <div className="mb-6">
        <p className="font-medium mb-2">{qNum}. {questionText}</p>
        <div className={`${bgClass} p-2 rounded`}>
            {options.map((opt, i) => {
                const val = String.fromCharCode(65 + i);
                return <label key={val} className="flex items-center space-x-2 cursor-pointer"><input type="radio" name={`q${qNum}`} value={val} checked={answers[qNum] === val} onChange={() => handleInputChange(qNum, val)} disabled={!isTestStarted || isSubmitting}/><span>{val}. {opt}</span></label>
            })}
            {submitted && <span className="text-sm text-gray-600 mt-2 block">Correct: {correctAnswers[qNum]}</span>}
        </div>
      </div>
    );
  };

  const renderSection3 = () => (
    <Card className="mb-6">
        <CardHeader><CardTitle>Section 3 - Questions 21-30</CardTitle></CardHeader>
        <CardContent>
            {renderMultipleChoiceGroup('21-22', 'Questions 21 and 22: Which TWO characteristics were shared by the subjects of Joanna’s psychology study?', ['They had all won prizes for their music.', 'They had all made music recordings.', 'They were all under 27 years old.', 'They had all toured internationally.', 'They all played a string instrument.'])}
            {renderMultipleChoiceGroup('23-24', 'Questions 23 and 24: Which TWO points does Joanna make about her use of telephone interviews?', ['It meant rich data could be collected.', 'It allowed the involvement of top performers.', 'It led to a stressful atmosphere at times.', 'It meant interview times had to be limited.', 'It caused some technical problems.'])}
            {renderMultipleChoiceGroup('25-26', 'Questions 25 and 26: Which TWO topics did Joanna originally intend to investigate in her research?', ['regulations concerning concert dress', 'audience reactions to the dress of performers', 'changes in performer attitudes to concert dress', 'how choice of dress relates to performer roles', 'links between musical instrument and dress choice'])}
            {renderSingleChoiceQuestion('27', "Joanna concentrated on women performers because", ['women are more influenced by fashion.', "women's dress has led to more controversy.", "women's code of dress is less strict than men's."])}
            {renderSingleChoiceQuestion('28', "Mike Frost's article suggests that in popular music, women's dress is affected by", ['their wish to be taken seriously.', 'their tendency to copy each other.', 'their reaction to the masculine nature of the music.'])}
            {renderSingleChoiceQuestion('29', "What did Joanna's subjects say about the audience at a performance?", ["The musicians' choice of clothing is linked to respect for the audience.", 'The clothing should not distract the audience from the music.', 'The audience should make the effort to dress appropriately.'])}
            {renderSingleChoiceQuestion('30', "According to the speakers, musicians could learn from sports scientists about", ['the importance of clothing for physical freedom.', 'the part played by clothing in improving performance.', 'the way clothing may protect against physical injury.'])}
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
                <h3 className="font-bold text-center text-lg mb-4">The use of soil to reduce carbon dioxide (CO₂) in the atmosphere</h3>
                <p><strong>Rattan Lal:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    <li>Claims that 13% of CO₂ in the atmosphere could be absorbed by agricultural soils</li>
                    <li>Erosion is more likely in soil that is <strong>31</strong> <TdInput qNum="31" /></li>
                    <li>Lal found soil in Africa that was very <strong>32</strong> <TdInput qNum="32" /></li>
                    <li>It was suggested that carbon from soil was entering the atmosphere</li>
                </ul>
                <p><strong>Soil and carbon:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    <li>plants turn CO₂ from the air into carbon-based substances such as <strong>33</strong> <TdInput qNum="33" /></li>
                    <li>some CO₂ moves from the <strong>34</strong> <TdInput qNum="34" /> of plants to microbes in the soil</li>
                    <li>carbon was lost from the soil when agriculture was invented</li>
                </ul>
                <p><strong>Regenerative agriculture:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    <li>uses established practices to make sure soil remains fertile and <strong>35</strong> <TdInput qNum="35" /></li>
                    <li>e.g. through year-round planting and increasing the <strong>36</strong> <TdInput qNum="36" /> of plants that are grown</li>
                </ul>
                <p><strong>California study:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    <li>taking place on a big <strong>37</strong> <TdInput qNum="37" /> farm</li>
                    <li>uses compost made from waste from agriculture and <strong>38</strong> <TdInput qNum="38" /></li>
                </ul>
                <p><strong>Australia study:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    <li>aims to increase soil carbon by using <strong>39</strong> <TdInput qNum="39" /> that are always green</li>
                </ul>
                <p><strong>Future developments may include:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    <li>reducing the amount of fertilizer used in farming</li>
                    <li>giving farmers <strong>40</strong> <TdInput qNum="40" /> for carbon storage, as well as their produce</li>
                </ul>
            </div>
        </CardContent>
    </Card>
  );

 return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/cambridge/book-11/listening" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listening Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cambridge IELTS 11 - Test 4 Listening</h1>
        </div>

        <LocalAudioPlayer 
          audioSrc={AUDIO_URLS.book11.test4}
          onTestStart={handleTestStart}
          isTestStarted={isTestStarted}
          disabled={submitted}
          testDuration={30}
          title="Cambridge IELTS 11 - Listening Test 4"
        />

        <div className="my-6 flex justify-center space-x-2">
          {[1, 2, 3, 4].map((section) => (
            <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || isSubmitting}>Section {section}</Button>
          ))}
        </div>

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
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.keys(correctAnswers).map((qNum) => {
                    const groupKey = questionToGroupMap[qNum];
                    let isCorrect, userAnswerDisplay, correctAnswerDisplay, qDisplay;

                    if (groupKey) {
                      isCorrect = checkIndividualGroupedAnswer(qNum);
                      const userSelection = multipleAnswers[groupKey] || [];
                      userAnswerDisplay = userSelection.length > 0 ? userSelection.join(', ') : 'No answer';
                      correctAnswerDisplay = correctAnswers[qNum];
                      qDisplay = `Q${qNum}`;
                    } else {
                      isCorrect = getAnswerStatus(qNum) === 'correct';
                      userAnswerDisplay = answers[qNum] || 'No answer';
                      correctAnswerDisplay = correctAnswers[qNum];
                      qDisplay = `Q${qNum}`;
                    }
                    
                    return (
                      <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">{qDisplay}</span>{isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</div>
                        <div className="text-sm">
                          <div className="mb-1"><span className="text-gray-600">Your: </span><span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswerDisplay}</span></div>
                          <div><span className="text-gray-600">Correct: </span><span className="text-green-700 font-medium">{correctAnswerDisplay}</span></div>
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
      
      {/* Page View Tracker */}
      <PageViewTracker 
        book="book-11"
        module="listening"
        testNumber={4}
      />
      
      {/* Test Information and Statistics */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <TestStatistics 
          book="book-11"
          module="listening"
          testNumber={4}
        />
        <UserTestHistory 
          book="book-11"
          module="listening"
          testNumber={4}
        />
      </div>
    </div>
  );
}