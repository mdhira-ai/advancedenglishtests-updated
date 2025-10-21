'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'

export default function Book9ReadingTest3() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();

  // Set test start time
  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []); // Empty dependency array to run only once
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
  const [activeTab, setActiveTab] = useState('section1')

  // Use the text highlighter hook
  const { clearAllHighlights, getHighlightCount } = useTextHighlighter()

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTestStarted && !submitted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTestStarted, submitted, timeLeft]);

  // Handle ESC key to close highlight menu and document selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestStart = () => {
    setIsTestStarted(true);
  };

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }))
  }

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const userAnswer = answers[questionNumber] || ''
    
    if (!userAnswer || userAnswer.trim() === '') {
      return false
    }
    
    if (typeof correctAnswer === 'string') {
        return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber)
    }
    
    return false
  }

  const calculateScore = () => {
    let correctCount = 0
    
    for (const questionNumber of Object.keys(correctAnswers)) {
      if (checkAnswer(questionNumber)) {
        correctCount++
      }
    }
    
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      const detailedAnswers = {
        singleAnswers: answers,
        multipleAnswers: {},
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || '',
          correctAnswer: correctAnswers[questionNum as keyof typeof correctAnswers],
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        timeTaken
      };
      
      // Save to database
      const testScoreData = {
        book: 'book-9',
        module: 'reading',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      };
      
      const saveResult = await saveTestScore(testScoreData, session);
      
      if (saveResult.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', saveResult.error);
      }
      
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
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setShowAnswers(false)
    setShowResultsPopup(false)
    setIsTestStarted(false)
    setTimeLeft(60 * 60)
    clearAllHighlights()
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'YES', '2': 'NO', '3': 'YES', '4': 'NOT GIVEN', '5': 'YES', '6': 'YES', '7': 'NO', '8': 'YES',
    '9': 'H', '10': 'F', '11': 'A', '12': 'C',
    '13': 'B',
    '14': 'C', '15': 'E', '16': 'A', '17': 'C',
    '18': 'A', '19': 'D', '20': 'E', '21': 'F', '22': 'J',
    '23': 'maintenance', '24': 'slow (turning)', '25': 'low pressure', '26': 'cavitation',
    '27': 'D', '28': 'F', '29': 'B', '30': 'E', '31': 'A', '32': 'C',
    '33': 'Jupiter Saturn', '34': 'Solar System', '35': 'sensors circuits', '36': 'spares', '37': 'radio dish',
    '38': 'TRUE', '39': 'TRUE', '40': 'FALSE'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 9 - Reading Test 3</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">60 minutes</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
                
                {!isTestStarted && !submitted && (
                  <Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                    Start Test
                  </Button>
                )}
                
                {isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}
                
                {submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}
              </div>
              
              {!isTestStarted && !submitted && (
                <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                  <p className="font-semibold">Instructions:</p>
                  <p>• You have 60 minutes to complete all 40 questions</p>
                  <p>• Click "Start Test" to begin the timer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Left Column: Reading Passages */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">
              <h2 className="text-xl font-bold">Reading Passages</h2>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={clearAllHighlights} 
                  variant="outline" 
                  size="sm"
                  disabled={!isTestStarted || isSubmitting}
                  className="text-xs"
                >
                  Clear Highlights
                </Button>
                <div className="text-xs text-gray-500">
                  Select text to highlight • Double-click to remove • ESC to cancel
                </div>
              </div>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              {/* Passage 1 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-center text-gray-500 italic">Attitudes to language</p>
                     <p className="text-start mb-2">It is not easy to be systematic and objective about language study. Popular linguistic debate regularly deteriorates into invective and polemic. Language belongs to everyone, so most people feel they have a right to hold an opinion about it. And when opinions differ, emotions can run high. Arguments can start as easily over minor points of usage as over major policies of linguistic education.</p>
                     <p className="text-start mb-2">Language, moreover, is a very public behaviour, so it is easy for different usages to be noted and criticised. No part of society or social behaviour is exempt: linguistic factors influence how we judge personality, intelligence, social status, educational standards, job aptitude, and many other areas of identity and social survival. As a result, it is easy to hurt, and to be hurt, when language use is unfeelingly attacked.</p>
                     <p className="text-start mb-2">In its most general sense, prescriptivism is the view that one variety of language has an inherently higher value than others, and that this ought to be imposed on the whole of the speech community. The view is propounded especially in relation to grammar and vocabulary, and frequently with reference to pronunciation. The variety which is favoured, in this account, is usually a version of the 'standard' written language, especially as encountered in literature, or in the formal spoken language which most closely reflects this style. Adherents to this variety are said to speak or write 'correctly'; deviations from it are said to be 'incorrect'.</p>
                     <p className="text-start mb-2">All the main languages have been studied prescriptively, especially in the 18th century approach to the writing of grammars and dictionaries. The aims of these early grammarians were threefold: (a) they wanted to codify the principles of their languages, to show that there was a system beneath the apparent chaos of usage, (b) they wanted a means of settling disputes over usage, and (c) they wanted to point out what they felt to be common errors, in order to 'improve' the language. The authoritarian nature of the approach is best characterised by its reliance on 'rules' of grammar. Some usages are 'prescribed', to be learnt and followed accurately; others are 'proscribed', to be avoided. In this early period, there were no half-measures: usage was either right or wrong, and it was the task of the grammarian not simply to record alternatives, but to pronounce judgement upon them.</p>
                     <p className="text-start mb-2">These attitudes are still with us, and they motivate a widespread concern that linguistic standards should be maintained. Nevertheless, there is an alternative point of view that is concerned less with standards than with the facts of linguistic usage. This approach is summarised in the statement that it is the task of the grammarian to describe, not prescribe - to record the facts of linguistic diversity, and not to attempt the impossible tasks of evaluating language variation or halting language change. In the second half of the 18th century, we already find advocates of this view, such as Joseph Priestley, whose Rudiments of English Grammar (1761) insists that 'the custom of speaking is the original and only just standard of any language'. Linguistic issues, it is argued, cannot be solved by logic and legislation. And this view has become the tenet of the modern linguistic approach to grammatical analysis.</p>
                     <p className="text-start mb-2">In our own time, the opposition between 'descriptivists' and 'prescriptivists' has often become extreme, with both sides painting unreal pictures of the other. Descriptive grammarians have been presented as people who do not care about standards, because of the way they see all forms of usage as equally valid. Prescriptive grammarians have been presented as blind adherents to a historical tradition. The opposition has even been presented in quasi-political terms - of radical liberalism vs elitist conservatism.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic">Tidal Power</p>
                    <p className="text-center text-gray-500 italic">Undersea turbines which produce electricity from the tides are set to become an important source of renewable energy for Britain. It is still too early to predict the extent of the impact they may have, but all the signs are that they will play a significant role in the future.</p>
                    <p className="text-start mb-2"><span className="font-semibold">A</span>  Operating on the same principle as wind turbines, the power in sea turbines comes from tidal currents which turn blades similar to ships' propellers, but, unlike wind, the tides are predictable and the power input is constant. The technology raises the prospect of Britain becoming self-sufficient in renewable energy and drastically reducing its carbon dioxide emissions. If tide, wind and wave power are all developed, Britain would be able to close gas, coal and nuclear power plants and export renewable power to other parts of Europe. Unlike wind power, which Britain originally developed and then abandoned for 20 years allowing the Dutch to make it a major industry, undersea turbines could become a big export earner to island nations such as Japan and New Zealand.</p>
                    <p className="text-start mb-2"><span className="font-semibold">B</span> Tidal sites have already been identified that will produce one-sixth or more of the UK's power - and at prices competitive with modern gas turbines and the ever-cleaner coal stations. Some estimates claim that tidal power could produce 10% of the country's electricity needs. One site alone, the Pentland Firth, between Orkney and mainland Scotland, could produce 10% of the country's electricity with banks of turbines under the sea, and another at Alderney in the Channel Islands could provide 1,200 megawatts of power. Other sites identified include the Bristol Channel and the west coast of Scotland, particularly the channel between Campbeltown and Northern Ireland.</p>
                    <p className="text-start mb-2"><span className="font-semibold">C</span> Work on designs for the new turbine blades and sites are well advanced at the University of Southampton's sustainable energy research group. The first station is expected to be installed off Lynmouth in Devon shortly to test the technology in a venture jointly funded by the department of Trade and Industry and the European Union. AbuBakr Bahaj, in charge of the Southampton research, said: 'The prospects for energy from tidal currents are far better than from wind because the flows of water are predictable and constant. The technology for dealing with the hostile saline environment under the sea has been developed in the North Sea oil industry and much is already known about turbine blade design, because of wind power and ship propellers. There are a few technical difficulties, but I believe in the next five to ten years we will be installing commercial marine turbine farms.' Southampton has been awarded £215,000 over three years to develop the turbines and is working with Marine Current Turbines, a subsidiary of IT power, on the Lynmouth project. EU research has now identified 106 potential sites for tidal power, 80% round the coasts of Britain. The best sites are between islands or around heavily indented coasts where there are strong tidal currents.</p>
                    <p className="text-start mb-2"><span className="font-semibold">D</span> A marine turbine blade needs to be only one-third of the size of a wind generator to produce three times as much power. The blades will be about 20 metres in diameter, so around 30 metres of water is required. Unlike wind power, there are unlikely to be environmental objections. Fish and other creatures are thought unlikely to be at risk from the relatively slow-turning blades. Each turbine will be mounted on a tower which will connect to the national power supply grid via underwater cables. The towers will stick out of the water and be lit, to warn shipping, and also be designed to be lifted out of the water for maintenance and to clean seaweed from the blades.</p>
                    <p className="text-start mb-2"><span className="font-semibold">E</span> Dr Bahaj has done most work on the Alderney site, where there are powerful currents. The single undersea turbine farm would produce far more power than needed for the Channel Islands and most would be fed into the French Grid and be re-imported into Britain via the cable under the Channel. One technical difficulty is cavitation, where low pressure behind a turning blade causes air bubbles. These can cause vibration and damage the blades of the turbines. Dr Bahaj said: 'We have to test a number of blade types to avoid this happening or at least make sure it does not damage the turbines or reduce performance. Another slight concern is submerged debris floating into the blades. So far we do not know how much of a problem it might be. We will have to make the turbines robust because the sea is a hostile environment, but all the signs that we can do it are good.'</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-500 italic">Information theory lies at the heart of everything - from DVD players and the genetic code of DNA to the physics of the universe at its most fundamental. It has been central to the development of the science of communication, which enables data to be sent electronically and has therefore had a major impact on our lives.</p>
                  <p className="text-start mb-2"><span className="font-semibold">A</span> In April 2002 an event took place which demonstrated one of the many applications of information theory. The space probe, Voyager I, launched in 1977, had sent back spectacular images of Jupiter and Saturn and then soared out of the Solar System on a one-way mission to the stars. After 25 years of exposure to the freezing temperatures of deep space, the probe was beginning to show its age. Sensors and circuits were on the brink of failing and NASA experts realised that they had to do something or lose contact with their probe forever. The solution was to get a message to Voyager I to instruct it to use spares to change the failing parts. With the probe 12 billion kilometres from Earth, this was not an easy task. By means of a radio dish belonging to NASA's Deep Space Network, the message was sent out into the depths of space. Even travelling at the speed of light, it took over 11 hours to reach its target, far beyond the orbit of Pluto. Yet, incredibly, the little probe managed to hear the faint call from its home planet, and successfully made the switchover.</p>
                  <p className="text-start mb-2"><span className="font-semibold">B</span> It was the longest-distance repair job in history, and a triumph for the NASA engineers. But it also highlighted the astonishing power of the techniques developed by American communications engineer Claude Shannon, who had died just a year earlier. Born in 1916 in Petoskey, Michigan, Shannon showed an early talent for maths and for building gadgets, and made breakthroughs in the foundations of computer technology when still a student. While at Bell Telephone Laboratories, Shannon developed information theory, but shunned the resulting acclaim. In the 1940s, he single-handedly created an entire science of communication which has since inveigled its way into a host of applications, from DVDs to satellite communications to bar codes - any area, in short, where data has to be conveyed rapidly yet accurately.</p>
                  <p className="text-start mb-2"><span className="font-semibold">C</span> This all seems light years away from the down-to-earth uses Shannon originally had for his work, which began when he was a 22-year-old graduate engineering student at the prestigious Massachusetts Institute of Technology in 1939. He set out with an apparently simple aim: to pin down the precise meaning of the concept of 'information'. The most basic form of information, Shannon argued, is whether something is true or false - which can be captured in the binary unit, or 'bit', of the form 1 or 0. Having identified this fundamental unit, Shannon set about defining otherwise vague ideas about information and how to transmit it from place to place. In the process he discovered something surprising: it is always possible to guarantee information will get through random interference - 'noise' - intact.</p>
                  <p className="text-start mb-2"><span className="font-semibold">D</span> Noise usually means unwanted sounds which interfere with genuine information. Information theory generalises this idea via theorems that capture the effects of noise with mathematical precision. In particular, Shannon showed that noise sets a limit on the rate at which information can pass along communication channels while remaining error-free. This rate depends on the relative strengths of the signal and noise travelling down the communication channel, and on its capacity (its 'bandwidth'). The resulting limit, given in units of bits per second, is the absolute maximum rate of error-free communication given signal strength and noise level. The trick, Shannon showed, is to find ways of packaging up - 'coding' - information to cope with the ravages of noise, while staying within the information-carrying capacity - 'bandwidth' - of the communication system being used.</p>
                  <p className="text-start mb-2"><span className="font-semibold">E</span> Over the years scientists have devised many such coding methods, and they have proved crucial in many technological feats. The Voyager spacecraft transmitted data using codes which added one extra bit for every single bit of information; the result was an error rate of just one bit in 10,000 - and stunningly clear pictures of the planets. Other codes have become part of everyday life - such as the Universal Product Code, or bar code, which uses a simple error-detecting system that ensures supermarket check-out lasers can read the price even on, say, a crumpled bag of crisps. As recently as 1993, engineers made a major breakthrough by discovering so-called turbo codes - which come very close to Shannon's ultimate limit for the maximum rate that data can be transmitted reliably, and now play a key role in the mobile videophone revolution.</p>
                  <p className="text-start mb-2"><span className="font-semibold">F</span> Shannon also laid the foundations of more efficient ways of storing information, by stripping out superfluous ('redundant') bits from data which contributed little real information. As mobile phone text messages like 'I CN C U' show, it is often possible to leave out a lot of data without losing much meaning. As with error correction, however, there's a limit beyond which messages become too ambiguous. Shannon showed how to calculate this limit, opening the way to the design of compression methods that cram maximum information into minimum space.</p>
                </CardContent>
              </Card>
              </div>
            </TextHighlighter>
          </div>

          {/* Right Column: Questions */}
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {/* Tab Navigation */}
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 1: Q 1-13</button>
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 2: Q 14-26</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 3: Q 27-40</button>
                </div>
              </div>

              {/* Section Content */}
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p className="mb-4"><strong>Do the following statements agree with the claims of the writer in Reading Passage 1?</strong></p><p className="mb-4 italic">In boxes 1-8 on your answer sheet, write</p><div className="ml-4 mb-4 space-y-1 text-sm"><p><strong>YES</strong> if the statement agrees with the claims of the writer</p><p><strong>NO</strong> if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>There are understandable reasons why arguments occur about language.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>People feel more strongly about language education than about small differences in language usage.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>Our assessment of a person's intelligence is affected by the way he or she uses language.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>Prescriptive grammar books cost a lot of money to buy in the 18th century.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>Prescriptivism still exists today.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>According to descriptivists, it is pointless to try to stop language change.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>Descriptivism only appeared after the 18th century.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>Both descriptivists and prescriptivists have been misrepresented.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-12</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-I, below.</strong></p><p className="mb-4 italic">Write the correct letter, A-I, in boxes 9-12 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg border"><h4 className="font-semibold text-center mb-4">The language debate</h4><p>According to <strong>9</strong> ______________, there is only one correct form of language. Linguists who take this approach to language place great importance on grammatical <strong>10</strong> ______________. Conversely, the view of <strong>11</strong> ______________, such as Joseph Priestley, is that grammar should be based on <strong>12</strong> ______________.</p><div className="flex flex-wrap gap-x-4 gap-y-2 mt-4"><div className="flex items-center gap-2"><span className="font-semibold">9</span><Input className={`w-20 ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-center gap-2"><span className="font-semibold">10</span><Input className={`w-20 ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-center gap-2"><span className="font-semibold">11</span><Input className={`w-20 ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-center gap-2"><span className="font-semibold">12</span><Input className={`w-20 ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="grid grid-cols-3 gap-2 mt-4 text-sm"><p><strong>A</strong> descriptivists</p><p><strong>B</strong> language experts</p><p><strong>C</strong> popular speech</p><p><strong>D</strong> formal language</p><p><strong>E</strong> evaluation</p><p><strong>F</strong> rules</p><p><strong>G</strong> modern linguists</p><p><strong>H</strong> prescriptivists</p><p><strong>I</strong> change</p></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Question 13</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter in box 13 on your answer sheet.</p><p className="mb-4">What is the writer's purpose in Reading Passage 1?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> to argue in favour of a particular approach to writing dictionaries and grammar books</p><p><strong>B</strong> to present a historical account of differing views of language</p><p><strong>C</strong> to describe the differences between spoken and written language</p><p><strong>D</strong> to show how a certain view of language has been discredited</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p className="mb-4"><strong>Reading Passage 2 has six paragraphs, A-E.</strong></p><p className="mb-4"><strong>Which paragraph contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-E, in boxes 14-17 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><div className="flex-1"><p>the location of the first test site</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><div className="flex-1"><p>a way of bringing the power produced on one site back into Britain</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><div className="flex-1"><p>a reference to a previous attempt by Britain to find an alternative source of energy</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><div className="flex-1"><p>mention of the possibility of applying technology from another industry</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-22</h3><p className="mb-4"><strong>Choose FIVE letters, A-J.</strong></p><p className="mb-4 italic">Write the correct letters in boxes 18-22 on your answer sheet.</p><p className="mb-4">Which FIVE of the following claims about tidal power are made by the writer?</p><div className="grid grid-cols-2 gap-2 text-sm mb-4"><p><strong>A</strong> It is a more reliable source of energy than wind power.</p><p><strong>B</strong> It would replace all other forms of energy in Britain.</p><p><strong>C</strong> Its introduction has come as a result of public pressure.</p><p><strong>D</strong> It would cut down on air pollution.</p><p><strong>E</strong> It could contribute to the closure of many existing power stations in Britain.</p><p><strong>F</strong> It could be a means of increasing national income.</p><p><strong>G</strong> It could face a lot of resistance from other fuel industries.</p><p><strong>H</strong> It could be sold more cheaply than any other type of fuel.</p><p><strong>I</strong> It could compensate for the shortage of inland sites for energy production.</p><p><strong>J</strong> It is best produced in the vicinity of coastlines with particular features.</p></div><div className="space-y-3"><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">18</span><Input className={`max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Letter"/></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">19</span><Input className={`max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Letter"/></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">20</span><Input className={`max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Letter"/></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">21</span><Input className={`max-w-[100px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Letter"/></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">22</span><Input className={`max-w-[100px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Letter"/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23-26</h3><p className="mb-4"><strong>Label the diagram below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 23-26 on your answer sheet.</p><div className="bg-white p-4 rounded border"><h4 className="font-semibold text-center mb-4">An Undersea Turbine</h4><div className="text-center mb-4"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/reading/test3/turbine.png" alt="Undersea Turbine Diagram" className="mx-auto max-w-full h-auto border rounded" /></div><div className="text-center mb-4"><p>Whole tower can be raised for <strong>23</strong> ______________ and the extraction of seaweed from the blades.</p><Input className={`mt-1 mx-auto max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="grid grid-cols-2 gap-4"><div className="text-center"><p>Air bubbles result from the <strong>25</strong> ______________ behind blades. This is known as <strong>26</strong> ______________.</p><Input className={`mt-1 mx-auto max-w-[150px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 25"/><Input className={`mt-1 mx-auto max-w-[150px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 26"/></div><div className="text-center"><p>Sea life not in danger due to the fact that blades are comparatively <strong>24</strong> ______________.</p><Input className={`mt-1 mx-auto max-w-[150px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p className="mb-4"><strong>Reading Passage 3 has six paragraphs, A-F.</strong></p><p className="mb-4"><strong>Which paragraph contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-F, in boxes 27-32 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><div className="flex-1"><p>an explanation of the factors affecting the transmission of information</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><div className="flex-1"><p>an example of how unnecessary information can be omitted</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><div className="flex-1"><p>a reference to Shannon's attitude to fame</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><div className="flex-1"><p>details of a machine capable of interpreting incomplete information</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">31</span><div className="flex-1"><p>a detailed account of an incident involving information theory</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><div className="flex-1"><p>a reference to what Shannon initially intended to achieve in his research</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-37</h3><p className="mb-4"><strong>Complete the notes below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 33-37 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg border space-y-3"><h4 className="text-center font-semibold">The Voyager 1 Space Probe</h4><div className="flex items-start gap-2"><span className="text-xl">•</span><div>The probe transmitted pictures of both <strong>33</strong> ______________ and ______________, then left the <strong>34</strong> ______________.</div></div><div className="flex flex-wrap gap-x-4"><Input className={`ml-6 max-w-[200px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 33"/><Input className={`max-w-[200px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 34"/></div><div className="flex items-start gap-2"><span className="text-xl">•</span><div>The freezing temperatures were found to have a negative effect on parts of the space probe.</div></div><div className="flex items-start gap-2"><span className="text-xl">•</span><div>Scientists feared that both the <strong>35</strong> ______________ and ______________ were about to stop working.</div></div><div className="flex flex-wrap gap-x-4"><Input className={`ml-6 max-w-[200px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 35"/></div><div className="flex items-start gap-2"><span className="text-xl">•</span><div>The only hope was to tell the probe to replace them with <strong>36</strong> ______________ - but distance made communication with the probe difficult.</div></div><div className="flex flex-wrap gap-x-4"><Input className={`ml-6 max-w-[200px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 36"/></div><div className="flex items-start gap-2"><span className="text-xl">•</span><div>A <strong>37</strong> ______________ was used to transmit the message at the speed of light.</div></div><div className="flex flex-wrap gap-x-4"><Input className={`ml-6 max-w-[200px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer 37"/></div><div className="flex items-start gap-2"><span className="text-xl">•</span><div>The message was picked up by the probe and the switchover took place.</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38-40</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 3?</strong></p><p className="mb-4 italic">In boxes 38-40 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>The concept of describing something as true or false was the starting point for Shannon in his attempts to send messages over distances.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>The amount of information that can be sent in a given time period is determined with reference to the signal strength and noise level.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>Products have now been developed which can convey more information than Shannon had anticipated as possible.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
            </div>
          </div>

        </div>

        {/* --- Elements below the two-column layout --- */}

        {/* Submit Button */}
        {!submitted && (
            <div className="mt-8 text-center">
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
            {!isTestStarted ? (
                <p className="text-sm text-blue-600 mt-2">Start the test to enable submission</p>
            ) : (
                <p className="text-sm text-gray-600 mt-2">Make sure you have answered all questions before submitting</p>
            )}
            </div>
        )}

        {/* Results */}
        {submitted && (
            <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader>
            <CardContent>
                <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div>
                <div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div>
                <div className="flex justify-center space-x-4 mt-6">
                    <Button onClick={handleReset} variant="outline">Try Again</Button>
                    <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button>
                </div>
                </div>
            </CardContent>
            </Card>
        )}

        {/* Answer Key Toggle */}
        <div className="flex justify-center mt-8">
            {!submitted && (
                <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">
                    {showAnswers ? 'Hide' : 'Show'} Answers
                </Button>
            )}
        </div>

        {/* Answer Key Display */}
        {showAnswers && (
            <Card className="mt-8">
            <CardHeader>
                <CardTitle>Answer Key</CardTitle>
                {submitted && (<p className="text-sm text-gray-600"><span className="text-green-600">Green</span> = Correct, <span className="text-red-600 ml-2">Red</span> = Incorrect</p>)}
            </CardHeader>
            <CardContent>
                {submitted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(correctAnswers).map(([question, answer]) => {
                    const userAnswer = answers[question] || '';
                    const isCorrect = checkAnswer(question);
                    return (
                        <div key={question} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                        <div className="text-sm space-y-1">
                            <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div>
                            <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{answer}</span></div>
                        </div>
                        </div>
                    );
                    })}
                </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(correctAnswers).map(([question, answer]) => (
                    <div key={question} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{question}:</span>
                        <span className="text-gray-800">{answer}</span>
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
            </Card>
        )}

        {/* Results Popup */}
        {showResultsPopup && (
            <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
                    <div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div><div className="text-center"><div className="text-3xl font-bold text-red-600">{40 - score}</div><div className="text-sm text-gray-600">Incorrect Answers</div></div></div></div>
                    <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map((questionNumber) => { const userAnswer = answers[questionNumber] || ''; const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]; const isCorrect = checkAnswer(questionNumber); return (<div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div></div></div>);})}</div></div>
                    <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
                </div>
            </div>
        )}

        {/* Analytics Components */}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
          <PageViewTracker 
            book="book-9"
            module="reading"
            testNumber={3}
          />
          <TestStatistics 
            book="book-9"
            module="reading"
            testNumber={3}
          />
          <UserTestHistory 
            book="book-9"
            module="reading"
            testNumber={3}
          />
        </div>

      </div>
    </div>
  )
}