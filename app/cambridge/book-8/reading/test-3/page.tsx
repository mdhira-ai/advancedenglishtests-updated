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

export default function Book8ReadingTest3() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now());
      hasTrackedClick.current = true;
    }
  }, []); // Empty dependency array to run only once
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
  const [activeTab, setActiveTab] = useState('section1')

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTestStarted && !submitted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Auto-submit when time runs out
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestStarted, submitted, timeLeft]);

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
      
      // Calculate time taken
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      // Prepare detailed answers data
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
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database
      const testScoreData = {
        book: 'book-8',
        module: 'reading',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
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
      // Still show results even if save failed
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
    setTimeLeft(60 * 60) // Reset to 60 minutes
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'D',
    '2': 'A',
    '3': 'A',
    '4': 'power companies',
    '5': 'safely',
    '6': 'size',
    '7': 'B',
    '8': 'C',
    '9': 'G',
    '10': 'D',
    '11': 'NO',
    '12': 'YES',
    '13': 'NOT GIVEN',
    '14': 'B', // B,C,F,H,J IN ANY ORDER
    '15': 'C',
    '16': 'F',
    '17': 'H',
    '18': 'J',
    '19': 'TRUE',
    '20': 'TRUE',
    '21': 'FALSE',
    '22': 'TRUE',
    '23': 'TRUE',
    '24': 'NOT GIVEN',
    '25': 'TRUE',
    '26': 'NOT GIVEN',
    '27': 'ix',
    '28': 'ii',
    '29': 'vii',
    '30': 'i',
    '31': 'viii',
    '32': 'iv',
    '33': 'physical chemistry', // IN EITHER ORDER with 34
    '34': 'thermodynamics',   // IN EITHER ORDER with 33
    '35': 'adapt',
    '36': 'immortality',
    '37': 'NO',
    '38': 'YES',
    '39': 'NOT GIVEN',
    '40': 'YES'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 8 - Reading Test 3</h1>
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
                    <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>{formatTime(timeLeft)}</div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">60 minutes</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
                {!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}
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
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">Reading Passages</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              {/* Passage 1 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-center font-bold">Striking Back at Lightning With Lasers</h3>
                    <p>Seldom is the weather more dramatic than when thunderstorms strike. Their electrical fury inflicts death or serious injury on around 500 people each year in the United States alone. As the clouds roll in, a leisurely round of golf can become a terrifying dice with death – out in the open, a lone golfer may be a lightning bolt’s most inviting target. And there is damage to property too. Lightning damage costs American power companies more than $100 million a year.</p>
                    <p>But researchers in the United States and Japan are planning to hit back. Already in laboratory trials they have tested strategies for neutralising the power of thunderstorms, and this winter they will brave real storms, equipped with an armoury of lasers that they will be pointing towards the heavens to discharge thunderclouds before lightning can strike.</p>
                    <p>The idea of forcing storm clouds to discharge their lightning on command is not new. In the early 1960s, researchers tried firing rockets trailing wires into thunderclouds to set up an easy discharge path for the huge electric charges that these clouds generate. The technique survives to this day at a test site in Florida run by the University of Florida, with support from the Electrical Power Research Institute (EPRI), based in California. EPRI, which is funded by power companies, is looking at ways to protect the United States’ power grid from lightning strikes. ‘We can cause the lightning to strike where we want it to using rockets,’ says Ralph Bernstein, manager of lightning projects at EPRI. The rocket site is providing precise measurements of lightning voltages and allowing engineers to check how electrical equipment bears up.</p>
                    <h4 className="font-semibold">Bad behaviour</h4>
                    <p>But while rockets are fine for research, they cannot provide the protection from lightning strikes that everyone is looking for. The rockets cost around $1,200 each, can only be fired at a limited frequency and their failure rate is about 40 per cent. And even when they do trigger lightning, things still do not always go according to plan. ‘Lightning is not perfectly well behaved,’ says Bernstein. ‘Occasionally, it will take a branch and go someplace it wasn’t supposed to go.’</p>
                    <p>‘And anyway, who would want to fire streams of rockets in a populated area?’ asks Jean-Claude Diels of the University of New Mexico. Diels is leading a project, which is backed by EPRI, to try to use lasers to discharge lightning safely – and safety is a basic requirement since no one wants to put themselves or their expensive equipment at risk.With around $500,000 invested so far, a promising system is just emerging from the laboratory.</p>
                    <p>The idea began some 20 years ago, when high-powered lasers were revealing their ability to extract electrons out of atoms and create ions. If a laser could generate a line of ionisation in the air all the way up to a storm cloud, this conducting path could be used to guide lightning to Earth, before the electric field becomes strong enough to break down the air in an uncontrollable surge. To stop the laser itself being struck, it would not be pointed straight at the clouds. Instead it would be directed at a mirror, and from there into the sky. The mirror would be protected by placing lightning conductors close by. Ideally, the cloud-zapper (gun) would be cheap enough to be installed around all key power installations, and portable enough to be taken to international sporting events to beam up at brewing storm clouds.</p>
                    <h4 className="font-semibold">A stumbling block</h4>
                    <p>However, there is still a big stumbling block. The laser is no nifty portable: it’s a monster that takes up a whole room. Diels is trying to cut down the size and says that a laser around the size of a small table is in the offing. He plans to test this more manageable system on live thunderclouds next summer.</p>
                    <p>Bernstein says that Diels’s system is attracting lots of interest from the power companies. But they have not yet come up with the $5 million that EPRI says will be needed to develop a commercial system, by making the lasers yet smaller and cheaper. ‘I cannot say I have money yet, but I’m working on it,’ says Bernstein. He reckons that the forthcoming field tests will be the turning point – and he’s hoping for good news. Bernstein predicts ‘an avalanche of interest and support’ if all goes well. He expects to see cloud-zappers eventually costing $50,000 to $100,000 each.</p>
                    <p>Other scientists could also benefit. With a lightning ‘switch’ at their fingertips, materials scientists could find out what happens when mighty currents meet matter. Diels also hopes to see the birth of ‘interactive meteorology’ – not just forecasting the weather but controlling it. ‘If we could discharge clouds, we might affect the weather,’ he says. And perhaps, says Diels, we’ll be able to confront some other meteorological menaces. ‘We think we could prevent hail by inducing lightning,’ he says. Thunder, the shock wave that comes from a lightning flash, is thought to be the trigger for the torrential rain that is typical of storms. A laser thunder factory could shake the moisture out of clouds, perhaps preventing the formation of the giant hailstones that threaten crops. With luck, as the storm clouds gather this winter, laser-toting researchers could, for the first time, strike back.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-center font-bold">The Nature of Genius</h3>
                    <p>There has always been an interest in geniuses and prodigies. The word ‘genius’, from the Latin gens (= family) and the term ‘genius’, meaning ‘begetter’, comes from the early Roman cult of a divinity as the head of the family. In its earliest form, genius was concerned with the ability of the head of the family, the paterfamilias, to perpetuate himself. Gradually, genius came to represent a person’s characteristic disposition, and then an individual’s natural endowment or talent. Today, people still look to stars or genes, astrology or genetics, in the hope of finding the source of exceptional abilities or personal characteristics.</p>
                    <p>The concept of genius and of giftedness has become part of our folk culture, and attitudes are ambivalent towards them. We envy the gifted and mistrust them. In the mythology of giftedness, it is popularly believed that if people are talented in one area, they must be defective in another, that intellectuals are impractical, that prodigies burn too brightly too soon and burn out, that gifted people are eccentric, that they are physical weaklings, that there’s a thin line between genius and madness, that genius runs in families, that the gifted are so clever they don’t need special help, that giftedness is the same as having a high IQ, that some races are more intelligent or musical or mathematical than others, that genius goes unrecognised and unrewarded, that adversity makes men wise or that people with gifts have a responsibility to use them. Language has been enriched with such terms as ‘highbrow’, ‘blue-stocking’, ‘wiseacre’, ‘know-all’, ‘boffin’ and, for many, ‘intellectual’ is a term of denigration.</p>
                    <p>The nineteenth century saw considerable interest in the nature of genius, and produced not a few studies of famous prodigies. Perhaps for us today, the most significant aspect of most of these studies of genius is the frequency with which early encouragement and teaching by parents and tutors had beneficial effects on the intellectual, artistic or musical development of the children but caused great difficulties of adjustment later in their lives. However, the difficulty with the evidence produced by these studies, fascinating as they are in collecting together anecdotes and apparent similarities and exceptions, is that they are not what we would today call norm-referenced. In other words, when, for instance, information is collated about early illnesses, methods of upbringing, schooling, etc., we must also take into account information from other historical sources about how common or exceptional these were at the time. For instance, infant mortality was high and life expectancy much shorter than today, and home tutoring was common in the families of the nobility and wealthy, and corporal punishment was common at the best independent schools and, for the most part, the cases studied were members of the privileged classes.</p>
                    <p>It was only with the growth of paediatrics and psychology in the twentieth century that studies could be carried out on a more objective, if still not always very scientific, basis. Geniuses, however they are defined, are but the peaks which stand out through the mist of history and are visible to the particular observer from his or her particular vantage point. Change the observers and the vantage points, and the peaks representing genius remain prominent, but their name and number may change. Genius is a term we apply to those whom we recognise for their outstanding achievements and who stand near the end of the continuum of human abilities which reaches back through the mundane and mediocre to the incapable. There is still much truth in Dr Samuel Johnson’s observation, ‘The true genius is a mind of large general powers, accidentally determined to some particular direction’. We may disagree with the ‘general’, for we doubt if all musicians of genius could have become scientists of genius or vice versa, but there is no doubting the accidental determination which nurtured or triggered their gifts into those channels into which they have poured their powers so successfully. Along the continuum of abilities are hundreds of thousands of gifted men and women, boys and girls.</p>
                    <p>What we appreciate, enjoy or marvel at in the works of genius or the achievements of prodigies are the manifestations of skills or abilities which are similar to, but so much superior to, our own. But that their minds are not different from our own is demonstrated by the fact that the hard-won discoveries of scientists like Kepler or Einstein become the commonplace knowledge of schoolchildren and the once outrageous shapes and colours of an artist like Paul Klee so soon appear on the fabrics we wear. This does not minimise the supremacy of their achievements, which outstrip our own as the sub-four-minute milers outstrip our jogging. To think of geniuses and the gifted as having uniquely different brains is only reasonable if we accept that each human brain is uniquely different. The purpose of instruction is to make us even more different from one another, and in the process of being educated we can learn from the achievements of those more gifted than ourselves. But before we try to emulate geniuses or encourage our children to do so we should note that some of the things we learn from them may prove unpalatable. We may envy their achievements and fame, but we should also recognise the price they may have paid in terms of perseverance, single-mindedness, dedication, restrictions on their personal lives, and how often they had to display great courage to preserve their integrity or to make their way to the top.</p>
                    <p>Genius and giftedness are relative descriptive terms of no real substance. We may, at best, give them some precision by defining them and placing them in a context but, whatever we do, we should never delude ourselves into believing that gifted children or geniuses are different from the rest of humanity, save in the degree to which they have developed the performance of their abilities.</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-center font-bold">HOW DOES THE BIOLOGICAL CLOCK TICK?</h3>
                  <p><span className="font-semibold">A</span> Our life span is restricted. Everyone accepts this as ‘biologically’ obvious. ‘Nothing lives for ever!’ However, in this statement we think of artificially produced, technical objects, products which are subjected to natural wear and tear during use. This leads to the result that at some time or other the object stops working and is unusable (‘death’ in the biological sense). But are the wear and tear and loss of function of technical objects and the death of living organisms really similar or comparable?</p>
                  <p><span className="font-semibold">B</span> Our ‘dead’ products are ‘static’, closed systems. It is always the basic material which constitutes the object and which, in the natural course of things, is worn down and becomes ‘older’. Ageing in this case must occur according to the laws of physical chemistry and thermodynamics. Although the same law holds for a living organism, the result of this law is not inexorable in the same way. At least as long as a biological system has the ability to renew itself it could actually become older without ageing; an organism is an open, dynamic system through which new material continuously flows. Destruction of old material and formation of new material are thus in permanent dynamic equilibrium. The material of which the organism is formed changes continuously. Thus our bodies continuously exchange old substance for new, just like a spring which more or less maintains its form and movement, but in which the water molecules are always different.</p>
                  <p><span className="font-semibold">C</span> Thus ageing and death should not be seen as inevitable, particularly as the organism possesses many mechanisms for repair. It is not, in principle, necessary for a biological system to age and die. Nevertheless, a restricted life span, ageing, and then death are basic characteristics of life. The reason for this is easy to recognise: in nature, the existent organisms either adapt or are regularly replaced by new types. Because of changes in the genetic material (mutations) these have new characteristics and in the course of their individual lives they are tested for optimal or better adaptation to the environmental conditions. Immortality would disturb this system – it needs room for new and better life. This is the basic problem of evolution.</p>
                  <p><span className="font-semibold">D</span> Every organism has a life span which is characteristic. There are striking differences in life span between different species, but within one species the parameter is relatively constant. For example, the average duration of human life has hardly changed in thousands of years. Although more and more people attain an advanced age as a result of developments in medical care and better nutrition, the characteristic upper limit for most remains 80 years. A further argument against the simple wear and tear theory is the observation that the time within which organisms age lies between a few days (even a few hours for unicellular organisms) and several thousand years, as with mammoth trees.</p>
                  <p><span className="font-semibold">E</span> If a life span is a genetically determined biological characteristic, it is logically necessary to propose the existence of an internal clock, which in some way measures and controls the ageing process and which finally determines death as the last step in a fixed programme. Like the life span, the metabolic rate has for different organisms a fixed mathematical relationship to the body mass. In comparison to the life span this relationship is ‘inverted’: the larger the organism the lower its metabolic rate. Again this relationship is valid not only for birds, but also, similarly on average within the systematic unit, for all other organisms (plants, animals, unicellular organisms).</p>
                  <p><span className="font-semibold">F</span> Animals which behave ‘frugally’ with energy become particularly old, for example, crocodiles and tortoises. Parrots and birds of prey are often held chained up. Thus they are not able to ‘experience life’ and so they attain a high life span in captivity. Animals which save energy by hibernation or lethargy (e.g. bats or hedgehogs) live much longer than those which are always active. The metabolic rate of mice can be reduced by a very low consumption of food (hunger diet). They then may live twice as long as their well fed comrades. Women become distinctly (about 10 per cent) older than men. If you examine the metabolic rates of the two sexes you establish that the higher male metabolic rate roughly accounts for the lower male life span. That means that they live life ‘energetically’ – more intensively, but not for as long.</p>
                  <p><span className="font-semibold">G</span> It follows from the above that sparing use of energy reserves should tend to extend life. Extreme high performance sports may lead to optimal cardiovascular performance, but they quite certainly do not prolong life. Relaxation lowers metabolic rate, as does adequate sleep and in general an equable and balanced personality. Each of us can develop his or her own ‘energy saving programme’ with a little self-observation, critical self-control and, above all, logical consistency. Experience will show that to live in this way not only increases the life span but is also very healthy. This final aspect should not be forgotten.</p>
                </CardContent>
              </Card>
            </div>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-3</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div><p>The main topic discussed in the text is</p><p>A the damage caused to US golf courses and golf players by lightning strikes.</p><p>B the effect of lightning on power supplies in the US and in Japan.</p><p>C a variety of methods used in trying to control lightning strikes.</p><p>D a laser technique used in trying to control lightning strikes.</p><Input className="mt-2 max-w-[100px]" value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div><p>According to the text, every year lightning</p><p>A does considerable damage to buildings during thunderstorms.</p><p>B kills or injures mainly golfers in the United States.</p><p>C kills or injures around 500 people throughout the world.</p><p>D damages more than 100 American power companies.</p><Input className="mt-2 max-w-[100px]" value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div><p>Researchers at the University of Florida and the University of New Mexico</p><p>A receive funds from the same source.</p><p>B are using the same techniques.</p><p>C are employed by commercial companies.</p><p>D are in opposition to each other.</p><Input className="mt-2 max-w-[100px]" value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 4-6</h3><p className="mb-4"><strong>Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><div className="space-y-4">
                    <p>4. EPRI receives financial support from __________________.</p><Input className="mt-2 w-full max-w-sm" value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                    <p>5. The advantage of the technique being developed by Diels is that it can be used __________________.</p><Input className="mt-2 w-full max-w-sm" value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                    <p>6. The main difficulty associated with using the laser equipment is related to its __________________.</p><Input className="mt-2 w-full max-w-sm" value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7-10</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-I, below.</strong></p><div className="p-4 bg-gray-50 border rounded-md mb-4">
                    <p>In this method, a laser is used to create a line of ionisation by removing electrons from <strong>7</strong> <Input className="mt-1" value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting}/>. This laser is then directed at <strong>8</strong> <Input className="mt-1" value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting}/> in order to control electrical charges, a method which is less dangerous than using <strong>9</strong> <Input className="mt-1" value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting}/>. As a protection for the lasers, the beams are aimed firstly at <strong>10</strong> <Input className="mt-1" value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting}/>.</p>
                  </div><div className="border p-4 grid grid-cols-3 gap-2"><span>A cloud-zappers</span><span>B atoms</span><span>C storm clouds</span><span>D mirrors</span><span>E technique</span><span>F ions</span><span>G rockets</span><span>H conductors</span><span>I thunder</span></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 11-13</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the claims of the writer</p><p><strong>NO</strong> if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><p>Power companies have given Diels enough money to develop his laser.</p><Input className="mt-2 max-w-[150px]" value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><p>Obtaining money to improve the lasers will depend on tests in real storms.</p><Input className="mt-2 max-w-[150px]" value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><p>Weather forecasters are intensely interested in Diels’s system.</p><Input className="mt-2 max-w-[150px]" value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p className="mb-4"><strong>Choose FIVE letters, A-K. Which FIVE of these beliefs are reported by the writer of the text?</strong></p><div className="grid grid-cols-2 gap-2 border p-4">
                    <span>A Truly gifted people are talented in all areas.</span>
                    <span>B The talents of geniuses are soon exhausted.</span>
                    <span>C Gifted people should use their gifts.</span>
                    <span>D A genius appears once in every generation.</span>
                    <span>E Genius can be easily destroyed by discouragement.</span>
                    <span>F Genius is inherited.</span>
                    <span>G Gifted people are very hard to live with.</span>
                    <span>H People never appreciate true genius.</span>
                    <span>I Geniuses are natural leaders.</span>
                    <span>J Gifted people develop their greatness through difficulties.</span>
                    <span>K Genius will always reveal itself.</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Input className="w-16" value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="14"/>
                    <Input className="w-16" value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="15"/>
                    <Input className="w-16" value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="16"/>
                    <Input className="w-16" value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="17"/>
                    <Input className="w-16" value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="18"/>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-26</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 2?</strong></p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><p>Nineteenth-century studies of the nature of genius failed to take into account the uniqueness of the person’s upbringing.</p><Input className="mt-2 max-w-[150px]" value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><p>Nineteenth-century studies of genius lacked both objectivity and a proper scientific approach.</p><Input className="mt-2 max-w-[150px]" value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><p>A true genius has general powers capable of excellence in any area.</p><Input className="mt-2 max-w-[150px]" value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">22</span><p>The skills of ordinary individuals are in essence the same as the skills of prodigies.</p><Input className="mt-2 max-w-[150px]" value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><p>The ease with which truly great ideas are accepted and taken for granted fails to lessen their significance.</p><Input className="mt-2 max-w-[150px]" value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><p>Giftedness and genius deserve proper scientific research into their true nature so that all talent may be retained for the human race.</p><Input className="mt-2 max-w-[150px]" value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><p>Geniuses often pay a high price to achieve greatness.</p><Input className="mt-2 max-w-[150px]" value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><p>To be a genius is worth the high personal cost.</p><Input className="mt-2 max-w-[150px]" value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p className="mb-4"><strong>Reading Passage 3 has seven paragraphs, A-G. Choose the correct heading for paragraphs B-G from the list of headings below.</strong></p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1"><div><strong>i</strong> The biological clock</div><div><strong>ii</strong> Why dying is beneficial</div><div><strong>iii</strong> The ageing process of men and women</div><div><strong>iv</strong> Prolonging your life</div><div><strong>v</strong> Limitations of life span</div><div><strong>vi</strong> Modes of development of different species</div><div><strong>vii</strong> A stable life span despite improvements</div><div><strong>viii</strong> Energy consumption</div><div><strong>ix</strong> Fundamental differences in ageing of objects and organisms</div><div><strong>x</strong> Repair of genetic material</div></div>
                    </div><div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">Example</span><p>Paragraph A</p><span className="font-bold">v</span></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><p>Paragraph B</p><Input className="mt-2 max-w-[100px]" value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><p>Paragraph C</p><Input className="mt-2 max-w-[100px]" value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><p>Paragraph D</p><Input className="mt-2 max-w-[100px]" value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><p>Paragraph E</p><Input className="mt-2 max-w-[100px]" value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">31</span><p>Paragraph F</p><Input className="mt-2 max-w-[100px]" value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><p>Paragraph G</p><Input className="mt-2 max-w-[100px]" value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-36</h3><p className="mb-4"><strong>Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><div className="space-y-4">
                        <p>• Objects age in accordance with principles of <strong>33</strong> <Input className="w-40 inline-block" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting}/> and <strong>34</strong> <Input className="w-40 inline-block" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting}/>.</p>
                        <p>• Through mutations, organisms can <strong>35</strong> <Input className="w-40 inline-block" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting}/> better to the environment.</p>
                        <p>• <strong>36</strong> <Input className="w-40 inline-block" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting}/> would pose a serious problem for the theory of evolution.</p>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 3?</strong></p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the views of the writer</p><p><strong>NO</strong> if the statement contradicts the views of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><p>The wear and tear theory applies to both artificial objects and biological systems.</p><Input className="mt-2 max-w-[150px]" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><p>In principle, it is possible for a biological system to become older without ageing.</p><Input className="mt-2 max-w-[150px]" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><p>Within seven years, about 90 per cent of a human body is replaced as new.</p><Input className="mt-2 max-w-[150px]" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><p>Conserving energy may help to extend a human’s life.</p><Input className="mt-2 max-w-[150px]" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {/* --- Elements below the two-column layout --- */}
        {!submitted && (
            <div className="mt-8 text-center">
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
            {!isTestStarted ? (<p className="text-sm text-blue-600 mt-2">Start the test to enable submission</p>) : (<p className="text-sm text-gray-600 mt-2">Make sure you have answered all questions before submitting</p>)}
            </div>
        )}
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
        <div className="flex justify-center mt-8">{!submitted && (<Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answers</Button>)}</div>
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
                    const userAnswer = answers[question] || ''; const isCorrect = checkAnswer(question);
                    return (<div key={question} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{answer}</span></div></div></div>);})}
                </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(correctAnswers).map(([question, answer]) => (<div key={question} className="flex justify-between p-2 bg-gray-50 rounded"><span className="font-semibold">{question}:</span><span className="text-gray-800">{answer}</span></div>))}
                </div>
                )}
            </CardContent>
            </Card>
        )}
        {showResultsPopup && (
            <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
                    <div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div><div className="text-center"><div className="text-3xl font-bold text-red-600">{40 - score}</div><div className="text-sm text-gray-600">Incorrect Answers</div></div></div></div>
                    <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map((questionNumber) => { const userAnswer = answers[questionNumber] || ''; const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]; const isCorrect = checkAnswer(questionNumber); return (<div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div></div></div>);})}</div></div>
                    <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
                </div>
    </div>
  )
}
        {/* Page View Tracker */}
        <PageViewTracker 
          book="book-8"
          module="reading"
          testNumber={3}
        />
        
        {/* Test Information and Statistics */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics 
            book="book-8"
            module="reading"
            testNumber={3}
          />
          <UserTestHistory 
            book="book-8"
            module="reading"
            testNumber={3}
          />
        </div>

      </div>
    </div>
  )
}