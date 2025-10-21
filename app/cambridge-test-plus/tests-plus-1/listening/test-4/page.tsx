// pages/practice-tests-plus-1/listening/test-4.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { saveTestScore } from '@/lib/test-score-saver';
import LocalAudioPlayer from '@/components/utils/LocalAudioPlayer';
import { getIELTSListeningScore } from '@/lib/utils';
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching';
import { AUDIO_URLS } from '@/constants/audio';
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics';

// Correct answers for IELTS Practice Tests Plus 1 - Listening Test 4
const correctAnswers: { [key: string]: string | string[] } = {
  // Section 1
  '1': 'sun(day) 2nd july', '2': 'marina', '3': '9.30(am)', '4': '£1,000/one/a thousand pounds', '5': 'hong kong',
  '6': '(team) captain', '7': "parents' permission", '8': '(20/twenty) life jackets', '9': 'clothes/clothing/set of clothes', '10': 'name',
  // Section 2
  '11': 'stamps and coins', '12': '(shrill) call', '13': 'sense of smell', '14': 'fly', '15': 'introduced animals',
  '16': '(scientific) research', '17': 'global education', '18': 'eggs (are) collected', '19': 'chicks (are) reared', '20': '5% to 85%',
  // Section 3
  '21': 'c', '22': 'a', '23': 'a', '24': 'b', '25': 'sydney', '26': 'frankfurt',
  '27-28': ['a', 'd'], '29-30': ['b', 'f'],
  // Section 4
  '31': 'export/transit (overseas)', '32': 'food shortages', '33': 'lasts longer/lasts much longer', '34': 'food-poisoning/poisoning', '35': 'electricity/electricity supply/supply of electricity/power',
  '36': 'chemical preservation/add (adding) chemicals/using chemicals (not salt/sugar/vinegar)', '37': 'cheap to store', '38': '(hot) soup', '39': '(heated) belt', '40': 'powdered soup/dried soup/dry soup',
};

const multiPartQuestions = {
    '27-28': { parts: ['27', '28'], marks: 2 },
    '29-30': { parts: ['29', '30'], marks: 2 },
};

export default function PracticeTestsPlus1Test4Page() {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({ '27-28': [], '29-30': [] });
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
        if (Object.keys(multiPartQuestions).includes(questionNumber)) {
            const maxSelections = multiPartQuestions[questionNumber as keyof typeof multiPartQuestions].marks;
            setMultipleAnswers(prev => {
                const current = prev[questionNumber] || [];
                if (current.includes(value)) return { ...prev, [questionNumber]: current.filter(v => v !== value) };
                if (current.length < maxSelections) return { ...prev, [questionNumber]: [...current, value] };
                return prev;
            });
        } else {
            setAnswers(prev => ({ ...prev, [questionNumber]: value }));
        }
    };
    
    const calculateScore = () => {
        let correctCount = 0;
        const answeredMultiPart = new Set<string>();

        for (let i = 1; i <= 40; i++) {
            const qNumStr = String(i);
            let inMultiPart = false;
            for (const key in multiPartQuestions) {
                if (multiPartQuestions[key as keyof typeof multiPartQuestions].parts.includes(qNumStr)) {
                    inMultiPart = true;
                    if (!answeredMultiPart.has(key)) {
                        const userAnswers = new Set(multipleAnswers[key] || []);
                        const correctAnswersSet = new Set(correctAnswers[key] as string[]);
                        if (userAnswers.size <= correctAnswersSet.size) {
                            userAnswers.forEach(ans => {
                                if (correctAnswersSet.has(ans)) correctCount++;
                            });
                        }
                        answeredMultiPart.add(key);
                    }
                    break;
                }
            }
            if (!inMultiPart && correctAnswers[qNumStr] && checkAnswerWithMatching(answers[qNumStr] || '', correctAnswers[qNumStr] as string, qNumStr)) {
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
            const detailedAnswers = { singleAnswers: answers, multipleAnswers, score: calculatedScore, totalQuestions: 40, timeTaken };
            
            await saveTestScore({
                userId: session?.user?.id || null,
                book: 'practice-tests-plus-1',
                module: 'listening',
                testNumber: 4,
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

    const renderSection1 = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">SECTION 1 Questions 1-10</h3>
                <p className="text-sm">Complete the notes below.</p>
                <p className="text-sm font-semibold">Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
            </div>
            
            <Card className="p-6">
                <div className="bg-gray-100 p-6 mb-6">
                    <h4 className="text-center font-bold text-lg mb-4">Event Details</h4>
                    
                    <div className="space-y-4">
                        <div className="flex">
                            <span className="font-semibold w-32">Type of event:</span>
                            <span className="italic">Example</span>
                            <span className="ml-2">Dragon Boat Race</span>
                        </div>
                        
                        <div className="mt-4">
                            <p className="font-semibold mb-2">Race details</p>
                            <div className="space-y-2 ml-4">
                                <div className="flex items-center">
                                    <span>Day & date: 1 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['1'] || '', correctAnswers['1'] as string, '1') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['1'] || ''}
                                        onChange={(e) => handleInputChange('1', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <span>Place: Brighton 2 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['2'] || '', correctAnswers['2'] as string, '2') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['2'] || ''}
                                        onChange={(e) => handleInputChange('2', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <span>Registration time: 3 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['3'] || '', correctAnswers['3'] as string, '3') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['3'] || ''}
                                        onChange={(e) => handleInputChange('3', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <p className="font-semibold mb-2">Sponsorship</p>
                            <div className="space-y-2 ml-4">
                                <div className="flex items-center">
                                    <span>- aim to raise over 4 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['4'] || '', correctAnswers['4'] as string, '4') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['4'] || ''}
                                        onChange={(e) => handleInputChange('4', e.target.value)}
                                        disabled={submitted}
                                    />
                                    <span> as a team and get a free t-shirt</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <span>- free Prize Draw for trip to 5 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['5'] || '', correctAnswers['5'] as string, '5') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['5'] || ''}
                                        onChange={(e) => handleInputChange('5', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <p className="font-semibold mb-2">Team details</p>
                            <div className="space-y-2 ml-4">
                                <div className="flex items-center">
                                    <span>- must have crew of 20 and elect a 6 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['6'] || '', correctAnswers['6'] as string, '6') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['6'] || ''}
                                        onChange={(e) => handleInputChange('6', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <span>- under 18s need to have 7 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['7'] || '', correctAnswers['7'] as string, '7') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['7'] || ''}
                                        onChange={(e) => handleInputChange('7', e.target.value)}
                                        disabled={submitted}
                                    />
                                    <span> to enter</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <span>- need to hire 8 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['8'] || '', correctAnswers['8'] as string, '8') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['8'] || ''}
                                        onChange={(e) => handleInputChange('8', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <span>- advised to bring extra 9 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['9'] || '', correctAnswers['9'] as string, '9') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['9'] || ''}
                                        onChange={(e) => handleInputChange('9', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <span>- must choose a 10 </span>
                                    <input
                                        type="text"
                                        className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['10'] || '', correctAnswers['10'] as string, '10') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['10'] || ''}
                                        onChange={(e) => handleInputChange('10', e.target.value)}
                                        disabled={submitted}
                                    />
                                    <span> for the team</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderSection2 = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">SECTION 2 Questions 11-20</h3>
                <p className="text-sm">Questions 11-15: Complete the notes below.</p>
                <p className="text-sm font-semibold">Use NO MORE THAN THREE WORDS for each answer.</p>
            </div>
            
            <Card className="p-6">
                <div className="bg-gray-100 p-6 mb-6">
                    <h4 className="text-center font-bold text-lg mb-4">KIWI FACT SHEET</h4>
                    
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <span>Pictures of kiwis are found on 11 </span>
                            <input
                                type="text"
                                className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['11'] || '', correctAnswers['11'] as string, '11') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                value={answers['11'] || ''}
                                onChange={(e) => handleInputChange('11', e.target.value)}
                                disabled={submitted}
                            />
                            <span> and </span>
                            <input
                                type="text"
                                className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['11'] || '', correctAnswers['11'] as string, '11') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                value={answers['11'] || ''}
                                onChange={(e) => handleInputChange('11', e.target.value)}
                                disabled={submitted}
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <span>The name 'kiwi' comes from its 12 </span>
                            <input
                                type="text"
                                className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['12'] || '', correctAnswers['12'] as string, '12') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                value={answers['12'] || ''}
                                onChange={(e) => handleInputChange('12', e.target.value)}
                                disabled={submitted}
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <span>The kiwi has poor sight but a good 13 </span>
                            <input
                                type="text"
                                className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['13'] || '', correctAnswers['13'] as string, '13') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                value={answers['13'] || ''}
                                onChange={(e) => handleInputChange('13', e.target.value)}
                                disabled={submitted}
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <span>Kiwis cannot 14 </span>
                            <input
                                type="text"
                                className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['14'] || '', correctAnswers['14'] as string, '14') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                value={answers['14'] || ''}
                                onChange={(e) => handleInputChange('14', e.target.value)}
                                disabled={submitted}
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <span>Kiwis are endangered by 15 </span>
                            <input
                                type="text"
                                className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['15'] || '', correctAnswers['15'] as string, '15') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                value={answers['15'] || ''}
                                onChange={(e) => handleInputChange('15', e.target.value)}
                                disabled={submitted}
                            />
                        </div>
                    </div>
                    
                   
                </div>
                
                <div className="mt-6">
                    <p className="text-sm mb-4">Questions 16-17: Complete the notes below.</p>
                    <p className="text-sm font-semibold mb-4">Use NO MORE THAN THREE WORDS for each answer.</p>
                    
                    <div className="bg-gray-100 p-6">
                        <h4 className="text-center font-bold text-lg mb-4">Kiwi Recovery Program</h4>
                        
                        <table className="w-full border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-300 p-3 text-left">Stage of program</th>
                                    <th className="border border-gray-300 p-3 text-left">Program involves</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-3">
                                        (16) 
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['16'] || '', correctAnswers['16'] as string, '16') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['16'] || ''}
                                            onChange={(e) => handleInputChange('16', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-3">Looking at kiwi survival needs</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-3">Action</td>
                                    <td className="border border-gray-300 p-3">Putting science into practice</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-3">
                                        (17) 
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['17'] || '', correctAnswers['17'] as string, '17') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['17'] || ''}
                                            onChange={(e) => handleInputChange('17', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-3">Schools and the website</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-6">
                        <p className="text-sm mb-4">Questions 18-20: Complete the flow chart below.</p>
                        <p className="text-sm font-semibold mb-4">Use NO MORE THAN THREE WORDS or A NUMBER for each answer.</p>
                        
                        <div className="bg-gray-100 p-6">
                            <h4 className="text-center font-bold text-lg mb-6">OPERATION NEST EGG</h4>
                            
                            <div className="flex flex-col items-center space-y-4">
                                <div className="border border-gray-300 p-4 bg-white rounded w-64 text-center">
                                    18 
                                    <input
                                        type="text"
                                        className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['18'] || '', correctAnswers['18'] as string, '18') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['18'] || ''}
                                        onChange={(e) => handleInputChange('18', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="text-2xl">↓</div>
                                
                                <div className="border border-gray-300 p-4 bg-white rounded w-64 text-center">
                                    19 
                                    <input
                                        type="text"
                                        className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['19'] || '', correctAnswers['19'] as string, '19') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                        value={answers['19'] || ''}
                                        onChange={(e) => handleInputChange('19', e.target.value)}
                                        disabled={submitted}
                                    />
                                </div>
                                
                                <div className="text-2xl">↓</div>
                                
                                <div className="border border-gray-300 p-4 bg-white rounded w-80 text-center">
                                    <p className="mb-2">Chicks returned to wild</p>
                                    <p className="text-sm font-bold">RESULT</p>
                                    <div className="mt-2">
                                        <span>Survival rate increased from </span>
                                        <input
                                            type="text"
                                            className={`mx-1 px-2 py-1 border border-gray-300 rounded w-16 ${submitted ? (checkAnswerWithMatching(answers['20'] || '', correctAnswers['20'] as string, '20') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['20'] || ''}
                                            onChange={(e) => handleInputChange('20', e.target.value)}
                                            disabled={submitted}
                                        />
                                        <span> to </span>
                                        <input
                                            type="text"
                                            className={`mx-1 px-2 py-1 border border-gray-300 rounded w-16 ${submitted ? (checkAnswerWithMatching(answers['20'] || '', correctAnswers['20'] as string, '20') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['20'] || ''}
                                            onChange={(e) => handleInputChange('20', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderSection3 = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">SECTION 3 Questions 21-30</h3>
            </div>
            
            <Card className="p-6">
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-semibold mb-4">Questions 21-24</p>
                        <p className="text-sm mb-4">Circle the correct letters A-C.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="font-semibold mb-2">21. The professor says that super highways</p>
                                <div className="space-y-2 ml-4">
                                    {['A lead to better lifestyles.', 'B are a feature of wealthy cities.', 'C result in more city suburbs.'].map((option, index) => (
                                        <label key={index} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="question21"
                                                value={String.fromCharCode(97 + index)}
                                                checked={answers['21'] === String.fromCharCode(97 + index)}
                                                onChange={(e) => handleMultipleChoice('21', e.target.value)}
                                                disabled={submitted}
                                                className="mr-2"
                                            />
                                            <span className={submitted ? (checkAnswerWithMatching(answers['21'] || '', correctAnswers['21'] as string, '21') && answers['21'] === String.fromCharCode(97 + index) ? 'bg-green-100' : answers['21'] === String.fromCharCode(97 + index) ? 'bg-red-100' : '') : ''}>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <p className="font-semibold mb-2">22. The student thinks people</p>
                                <div className="space-y-2 ml-4">
                                    {['A like the advantages of the suburbs.', 'B rarely go into the city for entertainment.', 'C enjoy living in the city.'].map((option, index) => (
                                        <label key={index} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="question22"
                                                value={String.fromCharCode(97 + index)}
                                                checked={answers['22'] === String.fromCharCode(97 + index)}
                                                onChange={(e) => handleMultipleChoice('22', e.target.value)}
                                                disabled={submitted}
                                                className="mr-2"
                                            />
                                            <span className={submitted ? (checkAnswerWithMatching(answers['22'] || '', correctAnswers['22'] as string, '22') && answers['22'] === String.fromCharCode(97 + index) ? 'bg-green-100' : answers['22'] === String.fromCharCode(97 + index) ? 'bg-red-100' : '') : ''}>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <p className="font-semibold mb-2">23. The professor suggests that in five years' time</p>
                                <div className="space-y-2 ml-4">
                                    {['A City Link will be choked by traffic.', 'B public transport will be more popular.', 'C roads will cost ten times more to build.'].map((option, index) => (
                                        <label key={index} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="question23"
                                                value={String.fromCharCode(97 + index)}
                                                checked={answers['23'] === String.fromCharCode(97 + index)}
                                                onChange={(e) => handleMultipleChoice('23', e.target.value)}
                                                disabled={submitted}
                                                className="mr-2"
                                            />
                                            <span className={submitted ? (checkAnswerWithMatching(answers['23'] || '', correctAnswers['23'] as string, '23') && answers['23'] === String.fromCharCode(97 + index) ? 'bg-green-100' : answers['23'] === String.fromCharCode(97 + index) ? 'bg-red-100' : '') : ''}>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <p className="font-semibold mb-2">24. The student believes that highways</p>
                                <div className="space-y-2 ml-4">
                                    {['A encourage a higher standard of driving.', 'B result in lower levels of pollution.', 'C discourage the use of old cars.'].map((option, index) => (
                                        <label key={index} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="question24"
                                                value={String.fromCharCode(97 + index)}
                                                checked={answers['24'] === String.fromCharCode(97 + index)}
                                                onChange={(e) => handleMultipleChoice('24', e.target.value)}
                                                disabled={submitted}
                                                className="mr-2"
                                            />
                                            <span className={submitted ? (checkAnswerWithMatching(answers['24'] || '', correctAnswers['24'] as string, '24') && answers['24'] === String.fromCharCode(97 + index) ? 'bg-green-100' : answers['24'] === String.fromCharCode(97 + index) ? 'bg-red-100' : '') : ''}>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <p className="text-sm font-semibold mb-4">Questions 25-26</p>
                        <p className="text-sm mb-4">Label the two bars identified on the graph below.</p>
                        <p className="text-sm mb-4">Choose your answers from the box and write them next to Questions 25-26.</p>
                        
                        <div className="bg-gray-100 p-6 mb-4">
                            <h4 className="text-center font-bold mb-4">Percentage of people using public transport by capital city</h4>
                                                 <img src="/img/ielts/cambridge-plus/plus1/listening/test4/bar.png" alt="illustration" className="w-100 h-full" />

                           
                            
                            <div className="mt-4 p-4 border border-gray-300 bg-white">
                                <p className="font-semibold mb-2">List of cities:</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Detroit</div>
                                    <div>Frankfurt</div>
                                    <div>London</div>
                                    <div>Paris</div>
                                    <div>Sydney</div>
                                    <div>Toronto</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <span className="w-8">25.</span>
                                <input
                                    type="text"
                                    className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['25'] || '', correctAnswers['25'] as string, '25') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                    value={answers['25'] || ''}
                                    onChange={(e) => handleInputChange('25', e.target.value)}
                                    disabled={submitted}
                                />
                            </div>
                            <div className="flex items-center">
                                <span className="w-8">26.</span>
                                <input
                                    type="text"
                                    className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['26'] || '', correctAnswers['26'] as string, '26') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                    value={answers['26'] || ''}
                                    onChange={(e) => handleInputChange('26', e.target.value)}
                                    disabled={submitted}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <p className="text-sm font-semibold mb-4">Questions 27-28</p>
                        <p className="text-sm mb-4">Circle TWO letters A-F.</p>
                        <p className="text-sm mb-4">Which TWO facts are mentioned about Copenhagen?</p>
                        
                        <div className="space-y-2 ml-4">
                            {[
                                'A live street theatre encouraged',
                                'B 30% of citizens walk to work', 
                                'C introduction of parking metres',
                                'D annual reduction of parking spots',
                                'E free city bicycles',
                                'F free public transport'
                            ].map((option, index) => (
                                <label key={index} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        value={String.fromCharCode(97 + index)}
                                        checked={multipleAnswers['27-28']?.includes(String.fromCharCode(97 + index)) || false}
                                        onChange={(e) => handleMultipleChoice('27-28', e.target.value)}
                                        disabled={submitted}
                                        className="mr-2"
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <p className="text-sm font-semibold mb-4">Questions 29-30</p>
                        <p className="text-sm mb-4">Circle TWO letters A-F.</p>
                        <p className="text-sm mb-4">Which TWO reasons are given for the low popularity of public transport?</p>
                        
                        <div className="space-y-2 ml-4">
                            {[
                                'A buses slower than cars',
                                'B low use means reduced service',
                                'C private cars safer',
                                'D public transport expensive',
                                'E frequent stopping inconvenient',
                                'F making connections takes time'
                            ].map((option, index) => (
                                <label key={index} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        value={String.fromCharCode(97 + index)}
                                        checked={multipleAnswers['29-30']?.includes(String.fromCharCode(97 + index)) || false}
                                        onChange={(e) => handleMultipleChoice('29-30', e.target.value)}
                                        disabled={submitted}
                                        className="mr-2"
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
    
    const renderSection4 = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">SECTION 4 Questions 31-40</h3>
                <p className="text-sm">Questions 31-32: Complete the notes below.</p>
                <p className="text-sm font-semibold">Write NO MORE THAN THREE WORDS for each answer.</p>
            </div>
            
            <Card className="p-6">
                <div className="space-y-6">
                    <div className="bg-gray-100 p-4 border border-gray-300">
                        <h4 className="font-semibold mb-3">Reasons for preserving food</h4>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <span>• Available all year</span>
                            </div>
                            <div className="flex items-center">
                                <span>• For 31 </span>
                                <input
                                    type="text"
                                    className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['31'] || '', correctAnswers['31'] as string, '31') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                    value={answers['31'] || ''}
                                    onChange={(e) => handleInputChange('31', e.target.value)}
                                    disabled={submitted}
                                />
                            </div>
                            <div className="flex items-center">
                                <span>• In case of 32 </span>
                                <input
                                    type="text"
                                    className={`mx-2 px-2 py-1 border border-gray-300 rounded w-40 ${submitted ? (checkAnswerWithMatching(answers['32'] || '', correctAnswers['32'] as string, '32') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                    value={answers['32'] || ''}
                                    onChange={(e) => handleInputChange('32', e.target.value)}
                                    disabled={submitted}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <p className="text-sm mb-4">Questions 33-37: Complete the table below.</p>
                        <p className="text-sm font-semibold mb-4">Write NO MORE THAN THREE WORDS for each answer.</p>
                        
                        <table className="w-full border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-300 p-3 text-left">Method of preservation</th>
                                    <th className="border border-gray-300 p-3 text-left">Advantage</th>
                                    <th className="border border-gray-300 p-3 text-left">Disadvantage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-3">Ultra-high temperature (UHT milk)</td>
                                    <td className="border border-gray-300 p-3">
                                        ... 33 ...
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['33'] || '', correctAnswers['33'] as string, '33') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['33'] || ''}
                                            onChange={(e) => handleInputChange('33', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-3">spoils the taste</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-3">canning</td>
                                    <td className="border border-gray-300 p-3">inexpensive</td>
                                    <td className="border border-gray-300 p-3">
                                        risk of ... 34 ...
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['34'] || '', correctAnswers['34'] as string, '34') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['34'] || ''}
                                            onChange={(e) => handleInputChange('34', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-3">refrigeration</td>
                                    <td className="border border-gray-300 p-3">stays fresh without processing</td>
                                    <td className="border border-gray-300 p-3">
                                        requires ... 35 ...
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['35'] || '', correctAnswers['35'] as string, '35') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['35'] || ''}
                                            onChange={(e) => handleInputChange('35', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-3">
                                        ... 36 ...
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['36'] || '', correctAnswers['36'] as string, '36') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['36'] || ''}
                                            onChange={(e) => handleInputChange('36', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-3">effective</td>
                                    <td className="border border-gray-300 p-3">time-consuming</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-3">drying</td>
                                    <td className="border border-gray-300 p-3">
                                        long-lasting, light and
                                        ... 37 ...
                                        <input
                                            type="text"
                                            className={`ml-2 px-2 py-1 border border-gray-300 rounded w-32 ${submitted ? (checkAnswerWithMatching(answers['37'] || '', correctAnswers['37'] as string, '37') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                            value={answers['37'] || ''}
                                            onChange={(e) => handleInputChange('37', e.target.value)}
                                            disabled={submitted}
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-3">loses nutritional value</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-6">
                        <p className="text-sm mb-4">Questions 38-40: Label the diagram.</p>
                        <p className="text-sm font-semibold mb-4">Write NO MORE THAN THREE WORDS for each answer.</p>
                        
                        <div className="bg-gray-100 p-6 rounded-lg border border-gray-300">
                            <h4 className="text-center font-bold text-lg mb-6">Roller drying</h4>
                            <div className="flex justify-center mb-6">
                                <img src="/img/ielts/cambridge-plus/plus1/listening/test4/roller.png" alt="Roller drying diagram" className="max-w-full h-auto rounded-md shadow-lg border-2 border-gray-300 bg-white p-4" />
                            </div>
                            <div className="relative">
                                {/* Placeholder for roller drying diagram */}
                                <div className="bg-white border border-gray-300 p-8 h-48 flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="flex items-center justify-between w-80">
                                            <div className="text-right">
                                                38 
                                                <input
                                                    type="text"
                                                    className={`ml-2 px-2 py-1 border border-gray-300 rounded w-24 ${submitted ? (checkAnswerWithMatching(answers['38'] || '', correctAnswers['38'] as string, '38') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                                    value={answers['38'] || ''}
                                                    onChange={(e) => handleInputChange('38', e.target.value)}
                                                    disabled={submitted}
                                                />
                                            </div>
                                           
                                        </div>
                                        
                                        <div className="flex items-center  w-80">
                                            <div className="text-center">
                                                39 
                                                <input
                                                    type="text"
                                                    className={`ml-2 px-2 py-1 border border-gray-300 rounded w-24 ${submitted ? (checkAnswerWithMatching(answers['39'] || '', correctAnswers['39'] as string, '39') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                                    value={answers['39'] || ''}
                                                    onChange={(e) => handleInputChange('39', e.target.value)}
                                                    disabled={submitted}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-start w-80">
                                            <div className="">
                                                40 
                                                <input
                                                    type="text"
                                                    className={`ml-2 px-2 py-1 border border-gray-300 rounded w-24 ${submitted ? (checkAnswerWithMatching(answers['40'] || '', correctAnswers['40'] as string, '40') ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                                    value={answers['40'] || ''}
                                                    onChange={(e) => handleInputChange('40', e.target.value)}
                                                    disabled={submitted}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
    
    const renderResults = () => (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 40 }, (_, i) => String(i + 1)).map((qKey) => {
                            const isMultiPart = Object.keys(multiPartQuestions).some(key => 
                                multiPartQuestions[key as keyof typeof multiPartQuestions].parts.includes(qKey)
                            );
                            
                            if (isMultiPart) {
                                const multiKey = Object.keys(multiPartQuestions).find(key => 
                                    multiPartQuestions[key as keyof typeof multiPartQuestions].parts.includes(qKey)
                                );
                                if (multiKey && multiPartQuestions[multiKey as keyof typeof multiPartQuestions].parts[0] === qKey) {
                                    const userAnswers = multipleAnswers[multiKey] || [];
                                    const correctAnswersArray = correctAnswers[multiKey] as string[];
                                    const isCorrect = userAnswers.length === correctAnswersArray.length && 
                                        userAnswers.every(ans => correctAnswersArray.includes(ans));
                                    
                                    return (
                                        <div key={qKey} className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className="font-semibold text-sm">Q{multiKey}</div>
                                            <div className="text-xs text-gray-600">Your: {userAnswers.join(', ').toUpperCase() || 'No answer'}</div>
                                            <div className="text-xs text-gray-600">Correct: {correctAnswersArray.join(', ').toUpperCase()}</div>
                                        </div>
                                    );
                                }
                                return null;
                            }
                            
                            const userAnswer = answers[qKey] || '';
                            const correctAnswer = correctAnswers[qKey] as string;
                            const isCorrect = checkAnswerWithMatching(userAnswer, correctAnswer, qKey);
                            
                            return (
                                <div key={qKey} className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="font-semibold text-sm">Q{qKey}</div>
                                    <div className="text-xs text-gray-600">Your: {userAnswer || 'No answer'}</div>
                                    <div className="text-xs text-gray-600">Correct: {correctAnswer}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-center">
                    <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8"><div className="max-w-4xl mx-auto px-4">
            <div className="mb-8"><Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listening Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-800 mb-4">IELTS Practice Tests Plus 1 - Listening Test 4</h1></div></div>
            <LocalAudioPlayer audioSrc={AUDIO_URLS.plus1.test4} onTestStart={handleTestStart} isTestStarted={isTestStarted} disabled={submitted} testDuration={30} title="IELTS Practice Tests Plus 1 - Listening Test 4" />
            <div className="mb-6"><div className="flex justify-center space-x-2">{[1, 2, 3, 4].map((section) => <Button key={section} variant={currentSection === section ? "default" : "outline"} onClick={() => setCurrentSection(section)} className="w-24" disabled={!isTestStarted || submitted}>Section {section}</Button>)}</div></div>
            {currentSection === 1 && renderSection1()}
            {currentSection === 2 && renderSection2()}
            {currentSection === 3 && renderSection3()}
            {currentSection === 4 && renderSection4()}
            {!submitted && <div className="mt-8 text-center"><Button onClick={handleSubmit} size="lg" className="px-8" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>}
            {showResultsPopup && renderResults()}
            <PageViewTracker 
                book="practice-tests-plus-1" 
                module="listening" 
                testNumber={4} 
            />
            <div className="max-w-4xl mx-auto px-4 mt-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <TestStatistics book="practice-tests-plus-1" module="listening" testNumber={4} />
                    <UserTestHistory book="practice-tests-plus-1" module="listening" testNumber={4} />
                </div>
            </div>
        </div></div>
    );
}