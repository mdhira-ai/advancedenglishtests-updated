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

export default function Book8ReadingTest2() {
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
        testNumber: 2,
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
    '1': 'spinning',
    '2': '(perfectly) unblemished',
    '3': 'labour/labour-intensive',
    '4': 'thickness',
    '5': 'marked',
    '6': '(molten) glass',
    '7': '(molten) tin/metal',
    '8': 'rollers',
    '9': 'TRUE',
    '10': 'NOT GIVEN',
    '11': 'FALSE',
    '12': 'TRUE',
    '13': 'TRUE',
    '14': 'ii',
    '15': 'vii',
    '16': 'ix',
    '17': 'iv',
    '18': 'C', // IN EITHER ORDER with 19
    '19': 'B', // IN EITHER ORDER with 18
    '20': 'A',
    '21': 'H',
    '22': 'G',
    '23': 'C',
    '24': 'C',
    '25': 'A',
    '26': 'B',
    '27': 'viii',
    '28': 'ii',
    '29': 'vi',
    '30': 'i',
    '31': 'iii',
    '32': 'v',
    '33': 'C',
    '34': 'A',
    '35': 'C',
    '36': 'D',
    '37': 'clothing',
    '38': 'vocabulary',
    '39': 'chemicals',
    '40': 'cultures'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 8 - Reading Test 2</h1>
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
                    <h3 className="text-center font-bold">Sheet glass manufacture: the float process</h3>
                    <p>Glass, which has been made since the time of the Mesopotamians and Egyptians, is little more than a mixture of sand, soda ash and lime. When heated to about 1500 degrees Celsius (°C) this becomes a molten mass that hardens when slowly cooled. The first successful method for making clear, flat glass involved spinning. This method was very effective as the glass had not touched any surfaces between being soft and becoming hard, so it stayed perfectly unblemished, with a 'fire finish'. However, the process took a long time and was labour intensive.</p>
                    <p>Nevertheless, demand for flat glass was very high and glassmakers across the world were looking for a method of making it continuously. The first continuous ribbon process involved squeezing molten glass through two hot rollers, similar to an old mangle. This allowed glass of virtually any thickness to be made non-stop, but the rollers would leave both sides of the glass marked, and these would then need to be ground and polished. This part of the process rubbed away around 20 per cent of the glass, and the machines were very expensive.</p>
                    <p>The float process for making flat glass was invented by Alistair Pilkington. This process allows the manufacture of clear, tinted and coated glass for buildings, and clear and tinted glass for vehicles. Pilkington had been experimenting with improving the melting process, and in 1952 he had the idea of using a bed of molten metal to form the flat glass, eliminating the need for rollers within the float bath. The metal had to melt at a temperature less than the hardening point of glass (about 600°C), but could not boil at a temperature below the temperature of the molten glass (about 1500°C). The best metal for the job was tin.</p>
                    <p>The rest of the concept relied on gravity, which guaranteed that the surface of the molten metal was perfectly flat and horizontal. Consequently, when pouring molten glass onto the molten tin, the underside of the glass would also be perfectly flat. If the glass were kept hot enough, it would flow over the molten tin until the top surface was also flat, horizontal and perfectly parallel to the bottom surface. Once the glass cooled to 604°C or less it was too hard to mark and could be transported out of the cooling zone by rollers. The glass settled to a thickness of six millimetres because of surface tension interactions between the glass and the tin. By fortunate coincidence, 60 per cent of the flat glass market at that time was for six millimetre glass.</p>
                    <p>Pilkington built a pilot plant in 1953 and by 1955 he had convinced his company to build a full-scale plant. However, it took 14 months of non-stop production, costing the company £100,000 a month, before the plant produced any usable glass. Furthermore, once they succeeded in making marketable flat glass, the machine was turned off for a service to prepare it for years of continuous production. When it started up again it took another four months to get the process right again. They finally succeeded in 1959 and there are now float plants all over the world, with each able to produce around 1000 tons of glass every day, non-stop for around 15 years.</p>
                    <p>Float plants today make glass of near optical quality. Several processes — melting, refining, homogenising — take place simultaneously in the 2000 tonnes of molten glass in the furnace. They occur in separate zones in a complex glass flow driven by high temperatures. It adds up to a continuous melting process, lasting as long as 50 hours, that delivers glass smoothly and continuously to the float bath, and from there to a coating zone and finally a heat treatment zone, where stresses are relieved.</p>
                    <p>The principle of float glass is unchanged since the 1950s. However, the product has changed dramatically, from a single thickness of 6.8 mm to a range from sub-millimetre to 25 mm, from a ribbon frequently marred by inclusions and bubbles to almost optical perfection. To ensure the highest quality, inspection takes place at every stage. Occasionally, a bubble is not removed during refining, a sand grain refuses to melt, a tremor in the tin puts ripples into the glass ribbon. Automated on-line inspection does two things. Firstly, it reveals process faults upstream that can be corrected. Inspection technology allows more than 100 million measurements a second to be made across the ribbon, locating flaws the unaided eye would be unable to see. Secondly, it enables computers downstream to steer cutters around flaws.</p>
                    <p>Float glass is sold by the square metre, and at the final stage computers translate customer requirements into patterns of cuts designed to minimise waste.Retry</p>
               
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-center font-bold">THE LITTLE ICE AGE</h3>
                    <p><span className="font-semibold">A</span> This book will provide a detailed examination of the Little Ice Age and other climatic shifts, but, before I embark on that, let me provide a historical context. We tend to think of climate as opposed to weather - as something unchanging, yet humanity has been at the mercy of climate change for its entire existence, with at least eight glacial episodes in the past 730,000 years. Our ancestors adapted to the universal but irregular global warming since the end of the last great Ice Age, around 10,000 years ago, with dazzling opportunism. They developed strategies for surviving harsh drought cycles, decades of heavy rainfall or unaccustomed cold; adopted agriculture and stock-raising, which revolutionised human life; and founded the world's first pre-industrial civilisations in Egypt, Mesopotamia and the Americas. But the price of sudden climate change, in famine, disease and suffering, was often high.</p>
                    <p><span className="font-semibold">B</span> The Little Ice Age lasted from roughly 1300 until the middle of the nineteenth century. Only two centuries ago, Europe experienced a cycle of bitterly cold winters; mountain glaciers in the Swiss Alps were the lowest in recorded memory, and pack ice surrounded Iceland for much of the year. The climatic events of the Little Ice Age did more than help shape the modern world. They are the deeply important context for the current unprecedented global warming. The Little Ice Age was far from a deep freeze, however; rather an irregular seesaw of rapid climatic shifts, few lasting more than a quarter-century, driven by complex and still little understood interactions between the atmosphere and the ocean. The seesaw brought cycles of intensely cold winters and easterly winds, then switched abruptly to years of heavy spring and early summer rains, mild winters, and frequent Atlantic storms, or to periods of droughts, light northeasterly winds, and summer heat waves.</p>
                    <p><span className="font-semibold">C</span> Reconstructing the climate changes of the past is extremely difficult, because systematic weather observations began only a few centuries ago, in Europe and North America. Records from India and tropical Africa are even more recent. For the time before records began, we have only 'proxy records' reconstructed largely from tree rings and ice cores, supplemented by a few incomplete written accounts. We now have hundreds of tree-ring records from throughout the northern hemisphere, and many from south of the equator, too, amplified with a growing body of temperature data from ice cores drilled in Antarctica, Greenland, the Peruvian Andes, and other locations. We are close to a knowledge of annual summer and winter temperature variations over much of the northern hemisphere going back 600 years.</p>
                    <p><span className="font-semibold">D</span> This book is a narrative history of climatic shifts during the past ten centuries, and some of the ways in which people in Europe adapted to them. Part One describes the Medieval Warm Period, roughly 900 to 1200. During these three centuries, Norse voyagers from Northern Europe explored northern seas, settled Greenland, and visited North America. It was not a time of uniform warmth, for then, as always since the Great Ice Age, there were constant shifts in rainfall and temperature. Mean European temperatures were about the same as today, perhaps slightly cooler.</p>
                    <p><span className="font-semibold">E</span> It is known that the Little Ice Age cooling began in Greenland and the Arctic in about 1200. As the Arctic ice pack spread southward, Norse voyages to the west were rerouted into the open Atlantic, then ended altogether. Storminess increased in the North Atlantic and North Sea. Colder, much wetter weather descended on Europe between 1315 and 1319, when thousands perished in a continent-wide famine. By 1400, the weather had become decidedly more unpredictable and stormier, with sudden shifts and lower temperatures that culminated in the cold decades of the late sixteenth century. Fish were a vital commodity in growing towns and cities, where food supplies were a constant concern. Dried cod and herring were already the staples of the European fish trade, but changes in water temperatures forced fishing fleets to work further offshore. The Basques, Dutch, and English developed the first offshore fishing boats adapted to a colder and stormier Atlantic. A gradual agricultural revolution in northern Europe stemmed from concerns over food supplies at a time of rising populations. The revolution involved intensive commercial farming and the growing of animal fodder on land not previously used for crops. The increased productivity from farmland made some countries self-sufficient in grain and livestock and offered effective protection against famine.</p>
                    <p><span className="font-semibold">F</span> Global temperatures began to rise slowly after 1850, with the beginning of the Modern Warm Period. There was a vast migration from Europe by land-hungry farmers and others, to which the famine caused by the Irish potato blight contributed, to North America, Australia, New Zealand, and southern Africa. Millions of hectares of forest and woodland fell before the newcomers' axes between 1850 and 1890, as intensive European farming methods expanded across the world. The unprecedented land clearance released vast quantities of carbon dioxide into the atmosphere, triggering for the first time humanly caused global warming. Temperatures climbed more rapidly in the twentieth century as the use of fossil fuels proliferated and greenhouse gas levels continued to soar. The rise has been even steeper since the early 1980s. The Little Ice Age has given way to a new climatic regime, marked by prolonged and steady warming. At the same time, extreme weather events like Category 5 hurricanes are becoming more frequent.</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-center font-bold">The meaning and power of smell</h3>
                  <p><span className="font-semibold">A</span> A survey conducted by Anthony Synnott at Montreal's Concordia University asked participants to comment on how important smell was to them in their lives. It became apparent that smell can evoke strong emotional responses. A scent associated with a good experience can bring a rush of joy, while a foul odour or one associated with a bad memory may make us grimace with disgust. Respondents to the survey noted that many of their olfactory likes and dislikes were based on emotional associations. Such associations can be powerful enough so that odours that we would generally label unpleasant become agreeable, and those that we would generally consider fragrant become disagreeable for particular individuals. The perception of smell, therefore, consists not only of the sensation of the odours themselves, but of the experiences and emotions associated with them.</p>
                  <p><span className="font-semibold">B</span> Odours are also essential cues in social bonding. One respondent to the survey believed that there is no true emotional bonding without touching and smelling a loved one. In fact, infants recognise the odours of their mothers soon after birth and adults can often identify their children or spouses by scent. In one well-known test, women and men were able to distinguish by smell alone clothing worn by their marriage partners from similar clothing worn by other people. Most of the subjects would probably never have given much thought to odour as a cue for identifying family members before being involved in the test, but as the experiment revealed, even when not consciously considered, smells register.Retry</p>
                  <p><span className="font-semibold">C</span> In spite of its importance to our emotional and sensory lives, smell is probably the most undervalued of the senses. The reason often given for the low regard in which smell is held is that, in comparison with its importance among animals, the human sense of smell is feeble and undeveloped. While it is true that the olfactory powers of humans are nothing like as fine as those possessed by certain animals, they are still remarkably acute. Our noses are able to recognise thousands of smells, and to perceive odours which are present only in extremely small quantities.</p>
                  <p><span className="font-semibold">D</span> Smell, however, is a highly elusive phenomenon. Odours, unlike colours, for instance, cannot be named in many languages because the specific vocabulary simply doesn't exist. 'It smells like ... ,' we have to say when describing an odour, struggling to express our olfactory experience. Nor can odours be recorded: there is no effective way to either capture or store them over time. In the realm of olfaction, we must make do with descriptions and recollections. This has implications for olfactory research.</p>
                  <p><span className="font-semibold">E</span> Most of the research on smell undertaken to date has been of a physical scientific nature. Significant advances have been made in the understanding of the biological and chemical nature of olfaction, but many fundamental questions have yet to be answered. Researchers have still to decide whether smell is one sense or two - one responding to odours proper and the other registering odourless chemicals in the air. Other unanswered questions are whether the nose is the only part of the body affected by odours, and how smells can be measured objectively given the non-physical components. Questions like these mean that interest in the psychology of smell is inevitably set to play an increasingly important role for researchers.</p>
                  <p><span className="font-semibold">F</span> However, smell is not simply a biological and psychological phenomenon. Smell is cultural, hence it is a social and historical phenomenon. Odours are invested with cultural values: smells that are considered to be offensive in some cultures may be perfectly acceptable in others. Therefore, our sense of smell is a means of, and model for, interacting with the world. Different smells can provide us with intimate and emotionally charged experiences and the value that we attach to these experiences is interiorised by the members of society in a deeply personal way. Importantly, our commonly held feelings about smells can help distinguish us from other cultures. The study of the cultural history of smell is, therefore, in a very real sense, an investigation into the essence of human culture.</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p className="mb-4"><strong>Complete the table and diagram below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><div className="overflow-x-auto"><table className="w-full border-collapse border border-gray-300 mb-6"><thead><tr className="bg-gray-100"><th className="border border-gray-300 p-3 text-center font-semibold" colSpan={3}>Early methods of producing flat glass</th></tr><tr className="bg-gray-50"><th className="border border-gray-300 p-3 font-semibold">Method</th><th className="border border-gray-300 p-3 font-semibold">Advantages</th><th className="border border-gray-300 p-3 font-semibold">Disadvantages</th></tr></thead><tbody>
                    <tr><td className="border border-gray-300 p-3"><strong>1</strong> <Input className="mt-1" value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting}/></td><td className="border border-gray-300 p-3">Glass remained <strong>2</strong> <Input className="mt-1" value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting}/></td><td className="border border-gray-300 p-3"><ul><li>Slow</li><li><strong>3</strong> <Input className="mt-1" value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li></ul></td></tr>
                    <tr><td className="border border-gray-300 p-3">Ribbon</td><td className="border border-gray-300 p-3"><ul><li>Could produce glass sheets of varying <strong>4</strong> <Input className="mt-1" value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li><li>Non-stop process</li></ul></td><td className="border border-gray-300 p-3"><ul><li>Glass was <strong>5</strong> <Input className="mt-1" value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li><li>20% of glass rubbed away</li><li>Machines were expensive</li></ul></td></tr>
                  </tbody></table></div><div className="text-center mb-6"><h4 className="font-semibold mb-4">Pilkington's float process</h4><div className="border border-gray-300 p-4 bg-gray-50"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/reading/test2/floatprocess.png" alt="Float Process Diagram" className="mx-auto max-w-full h-auto"/><p className="text-sm text-gray-500 mt-2">[Diagram of float process with melting zone, cooling zone, and rollers]</p></div></div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><p> __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><p> __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><p> __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><p>The metal used in the float process had to have specific properties.</p><Input className="mt-2 max-w-[150px]" value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><p>Pilkington invested some of his own money in his float plant.</p><Input className="mt-2 max-w-[150px]" value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><p>Pilkington's first full-scale plant was an instant commercial success.</p><Input className="mt-2 max-w-[150px]" value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><p>The process invented by Pilkington has now been improved.</p><Input className="mt-2 max-w-[150px]" value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><p>Computers are better than humans at detecting faults in glass.</p><Input className="mt-2 max-w-[150px]" value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p className="mb-4"><strong>Reading Passage 2 has six paragraphs, A-F. Choose the correct heading for paragraphs B and D-F from the list of headings below.</strong></p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1"><div><strong>i</strong> Predicting climatic changes</div><div><strong>ii</strong> The relevance of the Little Ice Age today</div><div><strong>iii</strong> How cities contribute to climate change</div><div><strong>iv</strong> Human impact on the climate</div><div><strong>v</strong> How past climatic conditions can be determined</div><div><strong>vi</strong> A growing need for weather records</div><div><strong>vii</strong> A study covering a thousand years</div><div><strong>viii</strong> People have always responded to climate change</div><div><strong>ix</strong> Enough food at last</div></div>
                  </div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">Example</span><p>Paragraph A</p><span className="font-bold">viii</span></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><p>Paragraph B</p><Input className="mt-2 max-w-[100px]" value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">Example</span><p>Paragraph C</p><span className="font-bold">v</span></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><p>Paragraph D</p><Input className="mt-2 max-w-[100px]" value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><p>Paragraph E</p><Input className="mt-2 max-w-[100px]" value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><p>Paragraph F</p><Input className="mt-2 max-w-[100px]" value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-22</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-I, below.</strong></p><div className="p-4 bg-gray-50 border rounded-md mb-4">
                    <p>Documentation of past weather conditions is limited: our main sources of knowledge of conditions in the distant past are <strong>18</strong> <Input className="mt-1" value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting}/> and <strong>19</strong> <Input className="mt-1" value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting}/>. We can deduce that the Little Ice Age was a time of <strong>20</strong> <Input className="mt-1" value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, rather than of consistent freezing. Within it there were some periods of very cold winters, others of <strong>21</strong> <Input className="mt-1" value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting}/> and heavy rain, and yet others that saw <strong>22</strong> <Input className="mt-1" value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting}/> with no rain at all.</p>
                  </div><div className="border p-4 grid grid-cols-3 gap-2"><span>A climatic shifts</span><span>B ice cores</span><span>C tree rings</span><span>D glaciers</span><span>E interactions</span><span>F weather observations</span><span>G heat waves</span><span>H storms</span><span>I written accounts</span></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23-26</h3><p className="mb-4"><strong>Classify the following events as occurring during the...</strong></p><div className="ml-4 mb-4"><p><strong>A</strong> Medieval Warm Period</p><p><strong>B</strong> Little Ice Age</p><p><strong>C</strong> Modern Warm Period</p></div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><p>Many Europeans started farming abroad.</p><Input className="mt-2 max-w-[100px]" value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><p>The cutting down of trees began to affect the climate.</p><Input className="mt-2 max-w-[100px]" value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><p>Europeans discovered other lands.</p><Input className="mt-2 max-w-[100px]" value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><p>Changes took place in fishing patterns.</p><Input className="mt-2 max-w-[100px]" value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p className="mb-4"><strong>Reading Passage 3 has six paragraphs, A-F. Choose the correct heading for each paragraph from the list of headings below.</strong></p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1"><div><strong>i</strong> The difficulties of talking about smells</div><div><strong>ii</strong> The role of smell in personal relationships</div><div><strong>iii</strong> Future studies into smell</div><div><strong>iv</strong> The relationship between the brain and the nose</div><div><strong>v</strong> The interpretation of smells as a factor in defining groups</div><div><strong>vi</strong> Why our sense of smell is not appreciated</div><div><strong>vii</strong> Smell is our superior sense</div><div><strong>viii</strong> The relationship between smell and feelings</div></div>
                    </div><div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><p>Paragraph A</p><Input className="mt-2 max-w-[100px]" value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><p>Paragraph B</p><Input className="mt-2 max-w-[100px]" value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><p>Paragraph C</p><Input className="mt-2 max-w-[100px]" value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><p>Paragraph D</p><Input className="mt-2 max-w-[100px]" value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">31</span><p>Paragraph E</p><Input className="mt-2 max-w-[100px]" value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><p>Paragraph F</p><Input className="mt-2 max-w-[100px]" value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-36</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">33</span><div><p>According to the introduction, we become aware of the importance of smell when</p><p>A we discover a new smell.</p><p>B we experience a powerful smell.</p><p>C our ability to smell is damaged.</p><p>D we are surrounded by odours.</p><Input className="mt-2 max-w-[100px]" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><div><p>The experiment described in paragraph B</p><p>A shows how we make use of smell without realising it.</p><p>B demonstrates that family members have a similar smell.</p><p>C proves that a sense of smell is learnt.</p><p>D compares the sense of smell in males and females.</p><Input className="mt-2 max-w-[100px]" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><div><p>What is the writer doing in paragraph C?</p><p>A supporting other research</p><p>B making a proposal</p><p>C rejecting a common belief</p><p>D describing limitations</p><Input className="mt-2 max-w-[100px]" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><div><p>What does the writer suggest about the study of smell in the atmosphere in paragraph E?</p><p>A The measurement of smell is becoming more accurate.</p><p>B Researchers believe smell is a purely physical reaction.</p><p>C Most smells are inoffensive.</p><p>D Smell is yet to be defined.</p><Input className="mt-2 max-w-[100px]" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p className="mb-4"><strong>Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.</strong></p><div className="space-y-4">
                        <p>37. Tests have shown that odours can help people recognise the __________________ belonging to their husbands and wives.</p><Input className="mt-2 w-full max-w-sm" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                        <p>38. Certain linguistic groups may have difficulty describing smell because they lack the appropriate __________________.</p><Input className="mt-2 w-full max-w-sm" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                        <p>39. The sense of smell may involve response to __________________ which do not smell, in addition to obvious odours.</p><Input className="mt-2 w-full max-w-sm" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                        <p>40. Odours regarded as unpleasant in certain __________________ are not regarded as unpleasant in others.</p><Input className="mt-2 w-full max-w-sm" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
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
          testNumber={2}
        />
        
        {/* Test Information and Statistics */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics 
            book="book-8"
            module="reading"
            testNumber={2}
          />
          <UserTestHistory 
            book="book-8"
            module="reading"
            testNumber={2}
          />
        </div>

      </div>
    </div>
  )
}