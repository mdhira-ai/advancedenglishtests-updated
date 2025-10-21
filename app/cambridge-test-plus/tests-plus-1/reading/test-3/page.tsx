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
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'

export default function Book1ReadingTest3() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<Record<string, string[]>>({
    '33&34&35': []
  })
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();
  
  const handleTestStart = () => {
    setIsTestStarted(true);
    setStartTime(Date.now());
  };
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [activeTab, setActiveTab] = useState('section1')
  const { clearAllHighlights } = useTextHighlighter()

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
    return () => { if (interval) clearInterval(interval); };
  }, [isTestStarted, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }))
  }

  const handleMultipleChoiceToggle = (questionKey: string, option: string) => {
    setMultipleChoiceAnswers(prev => {
      const currentAnswers = prev[questionKey] || [];
      const isSelected = currentAnswers.includes(option);
      const maxSelections = 3; // Allow exactly 3 selections for questions 33-35

      if (isSelected) {
        // Remove the option if it's already selected
        return { ...prev, [questionKey]: currentAnswers.filter(ans => ans !== option) };
      } else if (currentAnswers.length < maxSelections) {
        // Add the option if under the limit
        return { ...prev, [questionKey]: [...currentAnswers, option].sort() };
      }
      return prev; // Don't change if at max selections
    });
  }

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    
    // For questions 33-35 (multi-select question)
    if (questionNumber === '33&34&35') {
      const userChoices = multipleChoiceAnswers[questionNumber] || []
      const correctChoices = correctAnswer as string[]
      
      // Check if user selected exactly the correct choices
      if (userChoices.length !== correctChoices.length) return false
      return userChoices.every(choice => correctChoices.includes(choice))
    }
    
    // For other questions
    const userAnswer = answers[questionNumber] || ''
    if (!userAnswer.trim()) return false
    return checkAnswerWithMatching(userAnswer, correctAnswer as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    
    // Handle single-answer questions (skip 33, 34, 35)
    for (const questionNumber of Object.keys(correctAnswers)) {
      if (['33', '34', '35', '33&34&35'].includes(questionNumber)) continue; // Skip multi-select questions
      if (checkAnswer(questionNumber)) correctCount++
    }
    
    // Handle multi-select questions (33-35) - award 1 point for each correct choice
    const userChoices3335 = multipleChoiceAnswers['33&34&35'] || [];
    const correctChoices3335 = correctAnswers['33&34&35'] as string[];
    userChoices3335.forEach(choice => {
      if (correctChoices3335.includes(choice)) {
        correctCount++;
      }
    });
    
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      
      await saveTestScore({
        book: 'practice-tests-plus-1',
        module: 'reading',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      }, session);
      
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
    setMultipleChoiceAnswers({ '33&34&35': [] })
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
    '1': 'D', '2': 'B', '3': 'D', '4': 'B', '5': 'C', '6': 'A', '7': 'C', '8': 'D', '9': 'A', '10': 'F', '11': 'H', '12': 'I', '13': 'G',
    '14': 'viii', '15': 'vi', '16': 'ix', '17': 'iv', '18': 'i', '19': 'iii',
    '20': 'YES', '21': 'NOT GIVEN', '22': 'YES', '23': 'NO', '24': 'NOT GIVEN',
    '25': 'video camera', '26': 'database', '27': '(tiny/small) pressure pads',
    '28': 'YES', '29': 'NO', '30': 'YES', '31': 'NOT GIVEN', '32': 'NO',
    '33&34&35': ['B', 'D', 'F'],
    '36': 'C', '37': 'E', '38': 'B', '39': 'D', '40': 'F'
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 1 - Reading Test 3</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6">
          <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-center"><div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div></div>{!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}{isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}{submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">Reading Passages</h2>
            <TextHighlighter><div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">Indoor Pollution</p>
                <p>Since the early eighties we have been only too aware of the devastating effects of large-scale environmental pollution. Such pollution is generally the result of poor government planning in many developing nations or the short-sighted, selfish policies of the already industrialised countries which encourage a minority of the world's population to squander the majority of its natural resources.</p>
                <p>While events such as the deforestation of the Amazon jungle or the nuclear disaster in Chernobyl continue to receive high media exposure, as do acts of environmental sabotage, it must be remembered that not all pollution is on this grand scale. A large proportion of the world's pollution has its source much closer to home. The recent spillage of crude oil from an oil tanker accidentally discharging its cargo straight into Sydney Harbour not only caused serious damage to the harbour foreshores but also created severely toxic fumes which hung over the suburbs for days and left the angry residents wondering how such a disaster could have been allowed to happen.</p>
                <p>Avoiding pollution can be a full-time job. Try not to inhale traffic fumes; keep away from chemical plants and building-sites; wear a mask when cycling. It is enough to make you want to stay at home. But that, according to a growing body of scientific evidence, would also be a bad idea. Research shows that levels of pollutants such as hazardous gases, particulate matter and other 'chemical nasties' are usually higher indoors than out, even in the most polluted cities. Since the average American spends 18 hours indoors for every hour outside, it looks as though many environmentalists may be attacking the wrong target.</p>
                <p>The latest study, conducted by two environmental engineers, Richard Corsi and Cynthia Howard-Reed, of the University of Texas in Austin, and published in Environmental Science and Technology, suggests that it is the process of keeping clean that may be making indoor pollution worse. The researchers found that baths, showers, dishwashers and washing machines can all be significant sources of indoor pollution, because they extract trace amounts of chemicals from the water that they use and transfer them to the air. Nearly all public water supplies contain very low concentrations of toxic chemicals, most of them left over from the otherwise beneficial process of chlorination. Dr. Corsi wondered whether they stay there when water is used, or whether they end up in the air that people breathe.</p>
                <p>The team conducted a series of experiments in which known quantities of five such chemicals were mixed with water and passed through a dishwasher, a washing machine, a shower head inside a shower stall or a tap in a bath, all inside a specially designed chamber. The levels of chemicals in the effluent water and in the air extracted from the chamber were then measured to see how much of each chemical had been transferred from the water into the air.</p>
                <p>The degree to which the most volatile elements could be removed from the water, a process known as chemical stripping, depended on a wide range of factors, including the volatility of the chemical, the temperature of the water and the surface area available for transfer. Dishwashers were found to be particularly effective: the high-temperature spray, splashing against the crockery and cutlery, results in a nasty plume of toxic chemicals that escapes when the door is opened at the end of the cycle.</p>
                <p>In fact, in many cases, the degree of exposure to toxic chemicals in tap water by inhalation is comparable to the exposure that would result from drinking the stuff. This is significant because many people are so concerned about water-borne pollutants that they drink only bottled water, worldwide sales of which are forecast to reach $72 billion by next year. Dr. Corsi's results suggest that they are being exposed to such pollutants anyway simply by breathing at home.</p>
                <p>The aim of such research is not, however, to encourage the use of gas masks when unloading the washing. Instead, it is to bring a sense of perspective to the debate about pollution. According to Dr Corsi, disproportionate effort is wasted campaigning against certain forms of outdoor pollution, when there is as much or more cause for concern indoors, right under people's noses.</p>
                <p>Using gas cookers or burning candles, for example, both result in indoor levels of carbon monoxide and particulate matter that are just as high as those to be found outside, amid heavy traffic. Overcrowded classrooms whose ventilation systems were designed for smaller numbers of children frequently contain levels of carbon dioxide that would be regarded as unacceptable on board a submarine. 'New car smell' is the result of high levels of toxic chemicals, not cleanliness. Laser printers, computers, carpets and paints all contribute to the noxious indoor mix.</p>
                <p>The implications of indoor pollution for health are unclear. But before worrying about the problems caused by large-scale industry, it makes sense to consider the small-scale pollution at home and welcome international debate about this. Scientists investigating indoor pollution will gather next month in Edinburgh at the Indoor Air conference to discuss the problem. Perhaps unwisely, the meeting is being held indoors.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">ROBOTS</p>
                <p>Since the dawn of human ingenuity, people have devised ever more cunning tools to cope with work that is dangerous, boring, onerous, or just plain nasty. That compulsion has culminated in robotics – the science of conferring various human capabilities on machines</p>
                <p><span className="font-semibold">A</span> The modern world is increasingly populated by quasi-intelligent gizmos whose presence we barely notice but whose creeping ubiquity has removed much human drudgery. Our factories hum to the rhythm of robot assembly arms. Our banking is done at automated teller terminals that thank us with rote politeness for the transaction. Our subway trains are controlled by tireless robo-drivers. Our mine shafts are dug by automated moles, and our nuclear accidents – such as those at Three Mile Island and Chernobyl – are cleaned up by robotic muckers fit to withstand radiation.</p>
                <p><span className="font-semibold">B</span> Other innovations promise to extend the abilities of human operators. Thanks to the incessant miniaturisation of electronics and micro-mechanics, there are already robot systems that can perform some kinds of brain and bone surgery with submillimeter accuracy – far greater precision than highly skilled physicians can achieve with their hands alone. At the same time, techniques of long-distance control will keep people even farther from hazard. In 1994 a ten-foot-tall NASA robotic explorer called Dante, with video-camera eyes and with spiderlike legs, scrambled over the menacing rim of an Alaskan volcano while technicians 2,000 miles away in California watched the scene by satellite and controlled Dante's descent.</p>
                <p><span className="font-semibold">C</span> But if robots are to reach the next stage of labour-saving utility, they will have to operate with less human supervision and be able to make at least a few decisions for themselves – goals that pose a formidable challenge. 'We know how to tell a robot to handle a specific error,' says one expert, 'we can't yet give a robot enough common sense to reliably interact with a dynamic world.' Indeed the quest for true artificial intelligence (AI) has produced very mixed results. Despite a spasm of initial optimism in the 1960s and 1970s, when it appeared that transistor circuits and microprocessors might be able to perform in the same way as the human brain by the 21st century, researchers lately have extended their forecasts by decades if not centuries.</p>
                <p><span className="font-semibold">D</span> What they found, in attempting to model thought, is that the human brain's roughly one hundred billion neurons are much more talented – and human perception far more complicated – than previously imagined. They have built robots that can recognise the misalignment of a machine panel by a fraction of a millimeter in a controlled factory environment. But the human mind can glimpse a rapidly changing scene and immediately disregard the 98 per cent that is irrelevant, instantaneously focusing on the woodchuck at the side of a winding forest road or the single suspicious face in a tumultuous crowd. The most advanced computer systems on Earth can't approach that kind of ability, and neuroscientists still don't know quite how we do it.</p>
                <p><span className="font-semibold">E</span> Nonetheless, as information theorists, neuroscientists, and computer experts pool their talents, they are finding ways to get some lifelike intelligence from robots. One method renounces the linear, logical structure of conventional electronic circuits in favour of the messy, ad hoc arrangement of a real brain's neurons. These 'neural networks' do not have to be programmed. They can 'teach' themselves by a system of feedback signals that reinforce electrical pathways that produced correct responses and, conversely, wipe out connections that produced errors. Eventually the net wires itself into a system that can pronounce certain words or distinguish certain shapes.</p>
                <p><span className="font-semibold">F</span> In other areas researchers are struggling to fashion a more natural relationship between people and robots in the expectation that some day machines will take on some tasks now done by humans in, say, nursing homes. This is particularly important in Japan, where the percentage of elderly citizens is rapidly increasing. So experiments at the Science University of Tokyo have created a 'face robot' – a life-size, soft plastic model of a female head with a video camera imbedded in the left eye – as a prototype. The researchers' goal is to create robots that people feel comfortable around. They are concentrating on the face because they believe facial expressions are the most important way to transfer emotional messages. We read those messages by interpreting expressions to decide whether a person is happy, frightened, angry, or nervous. Thus the Japanese robot is designed to detect emotions in the person it is 'looking at' by sensing changes in the spatial arrangement of the person's eyes, nose, eyebrows, and mouth. It compares those configurations with a database of standard facial expressions and guesses the emotion. The robot then uses an ensemble of tiny pressure pads to adjust its plastic face into an appropriate emotional response.</p>
                <p><span className="font-semibold">G</span> Other labs are taking a different approach, one that doesn't try to mimic human intelligence or emotions. Just as computer design has moved away from one central mainframe in favour of myriad individual workstations – and single processors have been replaced by arrays of smaller units that break a big problem into parts that are solved simultaneously – many experts are now investigating whether swarms of semi-smart robots can generate a collective intelligence that is greater than the sum of its parts. That's what bee hives and ant colonies do, and several teams are betting that legions of mini-critters working together like an ant colony could be sent to explore the climate of planets or to inspect pipes in dangerous industrial situations.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">SAVING LANGUAGE</p>
                <p>For the first time, linguists have put a price on language. To save a language from extinction isn't cheap – but more and more people are arguing that the alternative is the death of communities.</p>
                <p>There is nothing unusual about a single language dying. Communities have come and gone throughout history, and with them their language. But what is happening today is extraordinary, judged by the standards of the past. It is language extinction on a massive scale. According to the best estimates, there are some 6,000 languages in the world. Of these, about half are going to die out in the course of the next century: that's 3,000 languages in 1,200 months. On average, there is a language dying out somewhere in the world every two weeks or so.</p>
                <p>How do we know? In the course of the past two or three decades, linguists all over the world have been gathering comparative data. If they find a language with just a few speakers left, and nobody is bothering to pass the language on to the children, they conclude that language is bound to die out soon. And we have to draw the same conclusion if a language has less than 100 speakers. It is not likely to last very long. A 1990s survey shows that 97 per cent of the world's languages are spoken by just four per cent of the people.</p>
                <p>It is too late to do anything to help many languages, where the speakers are too few or too old, and where the community is too busy just trying to survive to care about their language. But many languages are not in such a serious position. Often, where languages are seriously endangered, there are things that can be done to give new life to them. It is called revitalisation.</p>
                <p>Once a community realises that its language is in danger, it can start to introduce measures which can genuinely revitalise. The community itself must want to save its language. The culture of which it is a part must need to have a respect for minority languages. There needs to be funding, to support courses, materials, and teachers. And there need to be linguists, to get on with the basic task of putting the language down on paper. That's the bottom line: getting the language documented – recorded, analysed, written down. People must be able to read and write if they and their language are to have a future in an increasingly computer-literate civilisation.</p>
                <p>But can we save a few thousand languages, just like that? Yes, if the will and funding were available. It is not cheap, getting linguists into the field, training local analysts, supporting the community with language resources and teachers, compiling grammars and dictionaries, writing materials for use in schools. It takes time, lots of it.</p>
                <p>To revitalise an endangered language. Conditions vary so much that it is difficult to generalise, but a figure of $100,000 a year per language cannot be far from the truth. If we devoted that amount of effort over three years for each of 3,000 languages, we would be talking about some $900 million.</p>
                <p>There are some famous cases which illustrate what can be done. Welsh, alone among the Celtic languages, is not only stopping its steady decline towards extinction but showing signs of real growth. Two Language Acts protect the status of Welsh now, and its presence is increasingly in evidence wherever you travel in Wales.</p>
                <p>On the other side of the world, Maori in New Zealand has been maintained by a system of so-called 'language nests', first introduced in 1982. These are organisations which provide children under five with a domestic setting in which they are intensively exposed to the language. The staff are all Maori speakers from the local community. The hope is that the children will keep their Maori skills alive after leaving the nests, and that as they grow older they will in turn become role models to a new generation of young children. There are cases like this all over the world. And when the reviving language is associated with a degree of political autonomy, the growth can be especially striking, as shown by Faroese, spoken in the Faroe Islands, after the islanders received a measure of autonomy from Denmark.</p>
                <p>In Switzerland, Romansch was facing a difficult situation, spoken in five very different dialects, with small and diminishing numbers, as young people left their community for work in the German-speaking cities. The solution here was the creation in the 1980s of a unified written language for all these dialects. Romansch Grischun, as it is now called, has official status in parts of Switzerland, and is being increasingly used in spoken form on radio and television.</p>
                <p>A language can be brought back from the very brink of extinction. The Ainu language of Japan, after many years of neglect and repression, had reached a stage where there were only eight fluent speakers left, all elderly. However, new government policies brought fresh attitudes and a positive interest in survival. Several 'semi-speakers' – people who had become unwilling to speak Ainu because of the negative attitudes by Japanese speakers – were prompted to become active speakers again. There is fresh interest now and the language is more publicly available than it has been for years.</p>
                <p>If good descriptions and materials are available, even extinct languages can be resurrected. Kaurna, from South Australia, is an example. This language had been extinct for about a century, but had been quite well documented. So, when a strong movement grew for its revival, it was possible to reconstruct it. The revised language is not the same as the original, of course. It lacks the range that the original had, and much of the old vocabulary. But it can nonetheless act as a badge of present-day identity for its people. And as long as people continue to value it as a true marker of their identity, and are prepared to keep using it, it will develop new functions and new vocabulary, as any other living language would do.</p>
                <p>It is too soon to predict the future of these revived languages, but in some parts of the world they are attracting precisely the range of positive attitudes and grass-roots support which are the preconditions for language survival. In such unexpected but heart-warming ways might we see the grand total of languages in the world minimally increased.</p>
              </CardContent></Card>
            </div></TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2"><div className="flex space-x-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button><button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-27</button><button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 28-40</button></div></div>
              {activeTab === 'section1' && (<Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-6</h3><p className="mb-4"><strong>Choose the appropriate letters A-D and write them in boxes 1-6 on your answer sheet.</strong></p><div className="space-y-6"><div><p><span className="font-semibold">1</span> In the first paragraph, the writer argues that pollution</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> has increased since the eighties.</p><p><strong>B</strong> is at its worst in industrialised countries.</p><p><strong>C</strong> results from poor relations between nations.</p><p><strong>D</strong> is caused by human self-interest.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">2</span> The Sydney Harbour oil spill was the result of a</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> ship refuelling in the harbour.</p><p><strong>B</strong> tanker pumping oil into the sea.</p><p><strong>C</strong> collision between two oil tankers.</p><p><strong>D</strong> deliberate act of sabotage.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">3</span> In the 3rd paragraph the writer suggests that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> people should avoid working in cities.</p><p><strong>B</strong> Americans spend too little time outdoors.</p><p><strong>C</strong> hazardous gases are concentrated in industrial suburbs.</p><p><strong>D</strong> there are several ways to avoid city pollution.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">4</span> The Corsi research team hypothesised that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> toxic chemicals can pass from air to water.</p><p><strong>B</strong> pollution is caused by dishwashers and baths.</p><p><strong>C</strong> city water contains insufficient chlorine.</p><p><strong>D</strong> household appliances are poorly designed.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">5</span> As a result of their experiments, Dr Corsi's team found that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> dishwashers are very efficient machines.</p><p><strong>B</strong> tap water is as polluted as bottled water.</p><p><strong>C</strong> indoor pollution rivals outdoor pollution.</p><p><strong>D</strong> gas masks are a useful protective device.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">6</span> Regarding the dangers of pollution, the writer believes that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> there is a need for rational discussion.</p><p><strong>B</strong> indoor pollution is a recent phenomenon.</p><p><strong>C</strong> people should worry most about their work environment.</p><p><strong>D</strong> industrial pollution causes specific diseases.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7-13</h3><p className="mb-4"><strong>Reading Passage 1 describes a number of cause and effect relationships. Match each Cause (Questions 7-13) in List A with its Effect (A-J) in List B.</strong></p><div className="flex flex-col md:flex-row gap-8"><div className="flex-1 bg-gray-50 p-4 rounded-lg"><h4 className="font-semibold mb-3">List A: CAUSES</h4><div className="space-y-3"><div><span className="font-semibold">7</span> Industrialised nations use a lot of energy.</div><div><span className="font-semibold">8</span> Oil spills into the sea.</div><div><span className="font-semibold">9</span> The researchers publish their findings.</div><div><span className="font-semibold">10</span> Water is brought to a high temperature.</div><div><span className="font-semibold">11</span> People fear pollutants in tap water.</div><div><span className="font-semibold">12</span> Air conditioning systems are inadequate.</div><div><span className="font-semibold">13</span> Toxic chemicals are abundant in new cars.</div></div></div><div className="flex-1 bg-gray-50 p-4 rounded-lg"><h4 className="font-semibold mb-3">List B: EFFECTS</h4><div className="space-y-1 text-sm"><p><strong>A</strong> The focus of pollution moves to the home.</p><p><strong>B</strong> The levels of carbon monoxide rise.</p><p><strong>C</strong> The world's natural resources are unequally shared.</p><p><strong>D</strong> People demand an explanation.</p><p><strong>E</strong> Environmentalists look elsewhere for an explanation.</p><p><strong>F</strong> Chemicals are effectively stripped from the water.</p><p><strong>G</strong> A clean odour is produced.</p><p><strong>H</strong> Sales of bottled water increase.</p><p><strong>I</strong> The levels of carbon dioxide rise.</p><p><strong>J</strong> The chlorine content of drinking water increased.</p></div></div></div><div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4"><div>7. <Input className={`w-20 ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>8. <Input className={`w-20 ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>9. <Input className={`w-20 ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>10. <Input className={`w-20 ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>11. <Input className={`w-20 ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>12. <Input className={`w-20 ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>13. <Input className={`w-20 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
              </CardContent></Card>)}
              {activeTab === 'section2' && (<Card><CardHeader><CardTitle>Questions 14-27</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p className="mb-4"><strong>Reading Passage 2 has seven paragraphs A-G. From the list of headings below choose the most suitable heading for each paragraph.</strong></p><div className="bg-gray-50 p-4 rounded-lg mb-4"><h4 className="font-semibold mb-3">List of headings</h4><div className="space-y-1 text-sm"><p><strong>i</strong> Some success has resulted from observing how the brain functions.</p><p><strong>ii</strong> Are we expecting too much from one robot?</p><p><strong>iii</strong> Scientists are examining the humanistic possibilities.</p><p><strong>iv</strong> There are judgements that robots cannot make.</p><p><strong>v</strong> Has the power of robots become too great?</p><p><strong>vi</strong> Human skills have been heightened with the help of robotics.</p><p><strong>vii</strong> There are some things we prefer the brain to control.</p><p><strong>viii</strong> Robots have quietly infiltrated our lives.</p><p><strong>ix</strong> Original predictions have been revised.</p><p><strong>x</strong> Another approach meets the same result.</p></div><p className="mt-2 text-sm">Example: Paragraph G - Answer ii</p></div><div className="grid grid-cols-2 gap-4"><div>14. Paragraph A <Input className={`w-16 ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>15. Paragraph B <Input className={`w-16 ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>16. Paragraph C <Input className={`w-16 ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>17. Paragraph D <Input className={`w-16 ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>18. Paragraph E <Input className={`w-16 ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>19. Paragraph F <Input className={`w-16 ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-24</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 2?</strong></p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">Write:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>YES</strong> if the statement agrees with the writer's views</p>
                      <p><strong>NO</strong> if the statement contradicts the writer's views</p>
                      <p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p>
                    </div>
                  </div>
                  <div className="space-y-3"><div>20. Karel Capek successfully predicted our current uses for robots. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>21. Lives were saved by the NASA robot, Dante. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>22. Robots are able to make fine visual judgements. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>23. The internal workings of the brain can be replicated by robots. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>24. The Japanese have the most advanced robot systems. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 25-27</h3><p className="mb-4"><strong>Complete the summary below with words taken from paragraph F. Use NO MORE THAN THREE WORDS for each answer.</strong></p><p>The prototype of the Japanese 'face robot' observes humans through a ... <strong>25</strong> ... which is planted in its head. It then refers to a ... <strong>26</strong> ... of typical 'looks' that the face can have, to decide what emotion the person is feeling. To respond to this expression, the robot alters its own expression using a number of ... <strong>27</strong> ... .</p><div className="grid grid-cols-3 gap-4 mt-4"><div>25. <Input value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>26. <Input value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>27. <Input value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div></div></div>
              </CardContent></Card>)}
              {activeTab === 'section3' && (<Card><CardHeader><CardTitle>Questions 28-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 28-32</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 3?</strong></p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">Write:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>YES</strong> if the statement agrees with the writer's views</p>
                      <p><strong>NO</strong> if the statement contradicts the writer's views</p>
                      <p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p>
                    </div>
                  </div>
                  <div className="space-y-3"><div>28. The rate at which languages are becoming extinct has increased. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>29. Research on the subject of language extinction began in the 1990s. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>30. In order to survive, a language needs to be spoken by more than 100 people. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>31. Certain parts of the world are more vulnerable than others to language extinction. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>32. Saving language should be the major concern of any small community whose language is under threat. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-35</h3><p className="mb-4"><strong>The list below gives some of the factors that are necessary to assist the revitalisation of a language within a community. Which THREE of the factors are mentioned by the writer of the text?</strong></p><p className="mb-4 italic">Write the appropriate letters A-G in boxes 33-35 on your answer sheet.</p><div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { letter: 'A', text: 'the existence of related languages' },
                        { letter: 'B', text: 'support from the indigenous population' },
                        { letter: 'C', text: 'books tracing the historical development of the language' },
                        { letter: 'D', text: 'on-the-spot help from language experts' },
                        { letter: 'E', text: 'a range of speakers of different ages' },
                        { letter: 'F', text: 'formal education procedures' },
                        { letter: 'G', text: 'a common purpose for which the language is required' }
                      ].map(option => {
                        const isSelected = (multipleChoiceAnswers['33&34&35'] || []).includes(option.letter)
                        const isCorrect = submitted && ['B', 'D', 'F'].includes(option.letter) && isSelected
                        const isIncorrect = submitted && ((!['B', 'D', 'F'].includes(option.letter) && isSelected) || (['B', 'D', 'F'].includes(option.letter) && !isSelected))
                        
                        return (
                          <button
                            key={option.letter}
                            onClick={() => handleMultipleChoiceToggle('33&34&35', option.letter)}
                            disabled={!isTestStarted || submitted || isSubmitting}
                            className={`flex items-center space-x-3 p-3 border rounded-lg text-left transition-colors ${
                              submitted 
                                ? isCorrect 
                                  ? 'bg-green-50 border-green-300' 
                                  : isIncorrect 
                                    ? 'bg-red-50 border-red-300' 
                                    : 'bg-gray-50 border-gray-200'
                                : isSelected 
                                  ? 'bg-blue-50 border-blue-300' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              submitted 
                                ? isCorrect 
                                  ? 'border-green-500 bg-green-500' 
                                  : isIncorrect 
                                    ? 'border-red-500 bg-red-500' 
                                    : 'border-gray-300'
                                : isSelected 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                            }`}>
                              {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold mr-2">{option.letter}</span>
                              <span>{option.text}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Selected: {(multipleChoiceAnswers['33&34&35'] || []).length}/3 options
                      {(multipleChoiceAnswers['33&34&35'] || []).length > 0 && (
                        <span className="ml-2 font-medium">({(multipleChoiceAnswers['33&34&35'] || []).join(', ')})</span>
                      )}
                    </div>
                  </div>
                  </div>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Questions 36-40</h3>
                    <p className="mb-4"><strong>Match the languages A-F with the statements below (Questions 36-40) which describe how a language was saved.</strong></p>
                    <p className="mb-4 italic">Write your answers in boxes 36-40 on your answer sheet.</p>
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">Languages</h4>
                        <p><strong>A</strong> Welsh</p>
                        <p><strong>B</strong> Maori</p>
                        <p><strong>C</strong> Faroese</p>
                        <p><strong>D</strong> Romansch</p>
                        <p><strong>E</strong> Ainu</p>
                        <p><strong>F</strong> Kaurna</p>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-3">Statements</h4>
                        <div className="space-y-3">
                          <div>36. The region in which the language was spoken gained increased independence.</div>
                          <div>37. People were encouraged to view the language with less prejudice.</div>
                          <div>38. Language immersion programmes were set up for sectors of the population.</div>
                          <div>39. A merger of different varieties of the language took place.</div>
                          <div>40. Written samples of the language permitted its revitalisation.</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>36. <Input className={`w-20 ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div>
                      <div>37. <Input className={`w-20 ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div>
                      <div>38. <Input className={`w-20 ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div>
                      <div>39. <Input className={`w-20 ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div>
                      <div>40. <Input className={`w-20 ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div>
                    </div>
                  </div>
              </CardContent></Card>)}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {submitted && (<Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4"><div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div><div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div><div className="flex justify-center space-x-4 mt-6"><Button onClick={handleReset} variant="outline">Try Again</Button><Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button></div></div></CardContent></Card>)}
        {showAnswers && (<Card className="mt-8"><CardHeader><CardTitle>Answer Key</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{Object.entries(correctAnswers).map(([question, answer]) => (<div key={question} className="flex justify-between p-2 bg-gray-50 rounded"><span className="font-semibold">{question}:</span><span className="text-gray-800">{answer}</span></div>))}</div></CardContent></Card>)}
        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{score}/40</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{ieltsScore}</div>
                    <div className="text-sm text-gray-600">IELTS Band Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{40 - score}</div>
                    <div className="text-sm text-gray-600">Incorrect Answers</div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(correctAnswers)
                    .filter(qNum => !['33', '34', '35'].includes(qNum)) // Filter out individual 33, 34, 35
                    .sort((a, b) => {
                      // Custom sorting to place 33&34&35 after 32
                      if (a === '33&34&35') return parseInt('33') - parseInt(b);
                      if (b === '33&34&35') return parseInt(a) - parseInt('33');
                      return parseInt(a) - parseInt(b);
                    })
                    .map((qNum) => {
                      const isCorrect = checkAnswer(qNum);
                      let userAnswer = '';
                      let correctAnswer = '';

                      if (qNum === '33&34&35') {
                        // Handle multiple choice question
                        const userChoices = multipleChoiceAnswers[qNum] || [];
                        const correctChoices = correctAnswers[qNum] as string[];
                        userAnswer = userChoices.length > 0 ? userChoices.join(', ') : 'No answer';
                        correctAnswer = correctChoices.join(', ');
                      } else {
                        // Handle regular questions
                        userAnswer = answers[qNum] || '';
                        correctAnswer = correctAnswers[qNum as keyof typeof correctAnswers] as string;
                      }

                      return (
                        <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Question {qNum}</span>
                            <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {isCorrect ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-gray-600">Your answer: </span>
                              <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {userAnswer || '(No answer)'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Correct answer: </span>
                              <span className="font-medium text-green-700">{correctAnswer}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button>
                <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <PageViewTracker 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={3} 
          />
          <TestStatistics 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={3} 
          />
          <UserTestHistory 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={3}
          />
        </div>
      </div>
    </div>
  )
}