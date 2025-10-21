'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching, checkIndividualAnswer, calculateTestScore } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics/'
import { saveTestScore } from '@/lib/test-score-saver'

export default function Book10ReadingTest4() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Set test start time on component mount
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);
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
  }, [isTestStarted, submitted, timeLeft]);

  // Handle ESC key to close highlight menu and document selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // ESC key handling is now managed by TextHighlighter component
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
      // Use the imported answer matching function for better accuracy
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
      
      // Save to database using test-score-saver
      const testScoreData = {
        book: 'book-10',
        module: 'reading',
        testNumber: 4,
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
    clearAllHighlights() // Clear highlights using the hook
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'spread', '2': '10/ten times', '3': 'below', '4': 'fuel', '5': 'seasons', '6': 'homes/housing',
    '7': 'TRUE', '8': 'FALSE', '9': 'TRUE', '10': 'TRUE', '11': 'NOT GIVEN', '12': 'FALSE', '13': 'FALSE',
    '14': 'transformation/change', '15': 'young age', '16': 'optimism', '17': 'skills/techniques', '18': 'negative emotions/feelings',
    '19': 'E', '20': 'C', '21': 'G', '22': 'A', '23': 'E', '24': 'C', '25': 'G', '26': 'H',
    '27': 'C', '28': 'D', '29': 'C', '30': 'B', '31': 'A', 
    '32': 'F', '33': 'G', '34': 'A', '35': 'B', '36': 'D',
    '37': 'NOT GIVEN', '38': 'YES', '39': 'NO', '40': 'YES'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 10 - Reading Test 4</h1>
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
                     <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">
                        The megafires of California
                      </p>
                      <p className="text-start text-gray-500 italic mb-2">Drought, housing expansion, and oversupply of tinder make for bigger, hotter fires in the western United States</p>
                      <p className="text-start text-gray-500 italic mb-2">Wildfires are becoming an increasing menace in the western United States, with Southern California being the hardest hit area. There's a reason fire squads battling more frequent blazes in Southern California are having such difficulty containing the flames, despite better preparedness than ever and decades of experience fighting fires fanned by the 'Santa Ana Winds'. The wildfires themselves, experts say, are generally hotter, faster, and spread more erratically than in the past.</p>
                      <p className="text-start text-gray-500 italic mb-2">Megafires, also called 'siege fires', are the increasingly frequent blazes that burn 500,000 acres or more – 10 times the size of the average forest fire of 20 years ago. Some recent wildfires are among the biggest ever in California in terms of acreage burned, according to state figures and news reports.</p>
                      <p className="text-start text-gray-500 italic mb-2">One explanation for the trend to more superhot fires is that the region, which usually has dry summers, has had significantly below normal precipitation in many recent years. Another reason, experts say, is related to the century-long policy of the US Forest Service to stop wildfires as quickly as possible. The unintentional consequence has been to halt the natural eradication of underbrush, now the primary fuel for megafires.</p>
                      <p className="text-start text-gray-500 italic mb-2">Three other factors contribute to the trend, they add. First is climate change, marked by a 1-degree Fahrenheit rise in average yearly temperature across the western states. Second is fire seasons that on average are 78 days longer than they were 20 years ago. Third is increased construction of homes in wooded areas.</p>
                      <p className="text-start text-gray-500 italic mb-2">'We are increasingly building our homes in fire-prone ecosystems,' says Dominik Kulakowski, adjunct professor of biology at Clark University Graduate School of Geography in Worcester, Massachusetts. 'Doing that in many of the forests of the western US is like building homes on the side of an active volcano.'</p>
                      <p className="text-start text-gray-500 italic mb-2">In California, where population growth has averaged more than 600,000 a year for at least a decade, more residential housing is being built. 'What once was open space is now residential homes providing fuel to make fires burn with greater intensity,' says Terry McHale of the California Department of Forestry firefighters' union. 'With so much dryness, so many communities to catch fire, so many fronts to fight, it becomes an almost incredible job.'</p>
                      <p className="text-start text-gray-500 italic mb-2">That said, many experts give California high marks for making progress on preparedness in recent years, after some of the largest fires in state history scorched thousands of acres, burned thousands of homes, and killed numerous people. Stung in the past by criticism of bungling that allowed fires to spread when they might have been contained, personnel are meeting the peculiar challenges of neighbourhood- and canyon-hopping fires better than previously, observers say.</p>
                      <p className="text-start text-gray-500 italic mb-2">State promises to provide more up-to-date engines, planes, and helicopters to fight fires have been fulfilled. Firefighters' unions that in the past complained of dilapidated equipment, old fire engines, and insufficient blueprints for fire safety are now praising the state's commitment, noting that funding for firefighting has increased, despite huge cuts in many other programs. 'We are pleased that the current state administration has been very proactive in its support of us, and [has] come through with budgetary support of the infrastructure needs we have long sought,' says Mr. McHale of the firefighters' union.</p>
                      <p className="text-start text-gray-500 italic mb-2">Besides providing money to upgrade the fire engines that must traverse the mammoth state and wind along serpentine canyon roads, the state has invested in better command-and-control facilities as well as in the strategies to run them. 'In the fire sieges of earlier years, we found that other jurisdictions and states were willing to offer mutual-aid help, but we were not able to communicate adequately with them,' says Kim Zagaris, chief of the state's Office of Emergency Services Fire and Rescue Branch. After a commission examined and revamped communications procedures, the statewide response 'has become far more professional and responsive,' he says. There is a sense among both government officials and residents that the speed, dedication, and coordination of firefighters from several states and jurisdictions are resulting in greater efficiency than in past 'siege fire' situations.</p>
                      <p className="text-start text-gray-500 italic mb-2">In recent years, the Southern California region has improved building codes, evacuation procedures, and procurement of new technology. 'I am extraordinarily impressed by the improvements we have witnessed,' says Randy Jacobs, a Southern California-based lawyer who has had to evacuate both his home and business to escape wildfires. 'Notwithstanding all the damage that will continue to be caused by wildfires, we will no longer suffer the loss of life endured in the past because of the fire prevention and firefighting measures that have been put in place,' he says.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">Second nature</p>
                    <p className="text-start text-gray-500 italic mb-2">Your personality isn't necessarily set in stone. With a little experimentation, people can reshape their temperaments and inject passion, optimism, joy and courage into their lives</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> Psychologists have long held that a person’s character cannot undergo a transformation in any meaningful way and that the key traits of personality are determined at a very young age. However, researchers have begun looking more closely at ways we can change. Positive psychologists have identified 24 qualities we admire, such as loyalty and kindness, and are studying them to find out why they come so naturally to some people. What they're discovering is that many of these qualities amount to habitual behaviour that determines the way we respond to the world. The good news is that all this can be learned.

Some qualities are less challenging to develop than others, optimism being one of them. However, developing qualities requires mastering a range of skills which are diverse and sometimes surprising. For example, to bring more joy and passion into your life, you must be open to experiencing negative emotions. Cultivating such qualities will help you realise your full potential.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> The evidence is good that most personality traits can be altered. People learn to become more conscientious, agreeable and open to experience. Christopher Peterson, professor of psychology at the University of Michigan, cites himself as an example. Inherently introverted, he realised early on that as an academic, his reticence would prove disastrous in the lecture hall. So he learned to be more outgoing and entertain his classes. 'Now my extroverted behaviour is spontaneous,' he says.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> David Fajgenbaum had to make a similar transition. He was preparing for university, when he had an accident that put an end to his sports career. On campus, he quickly found that beyond ordinary counselling, the university had no services for students who were undergoing physical rehabilitation and suffering from depression like him. He therefore launched a support group to help others in similar situations. He took action despite his own pain - a typical response of an optimist.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> Suzanne Segerstrom, professor of psychology at the University of Kentucky, believes that the key to increasing optimism is through cultivating optimistic behaviour, rather than positive thinking. She recommends you train yourself to pay attention to good fortune by writing down three positive things that come about each day. This will help you convince yourself that favourable outcomes actually happen all the time, making it easier to begin taking action.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> You can recognise a person who is passionate about a pursuit by the way they are so strongly involved in it. Tanya Streeter's passion is freediving - the sport of plunging deep into the water without tanks or other breathing equipment. Beginning in 1998, she set nine world records and can hold her breath for six minutes. The physical stamina required for this sport is intense but the psychological demands are even more overwhelming. Streeter learned to untangle her fears from her judgment of what her body and mind could do. 'In my career as a competitive freediver, there was a limit to what I could do - but it wasn't anywhere near what I thought it was,' she says.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">F</span> Finding a pursuit that excites you can improve anyone's life. The secret about consuming passions, though, according to psychologist Paul Silvia of the University of North Carolina, is that 'they require discipline, hard work and ability, which is why they are so rewarding.' Psychologist Todd Kashdan has this advice for those people taking up a new passion: 'As a newcomer, you have to tolerate and laugh at your own ignorance. You must be willing to accept the negative feelings that come your way,' he says.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">G</span> In 2004, physician-scientist Mauro Zappaterra began his PhD research at Harvard Medical School. Unfortunately, he was miserable in his research position. He then took a break and during eight months in Santa Fe, Zappaterra learned about alternative healing techniques. He has now gone back to his conventional medical training, but with a different outlook. He is now learning to look for the joy in everything, including failure, as this could help him learn about his research and himself. One thing that can hold joy back is a person’s concentration on avoiding failure rather than their looking forward to doing something well. ‘Focusing on being safe might get in the way of your reaching your goals,’ explains Kashdan. For example, are you hoping to get through a business lunch without embarrassing yourself, or are you thinking about how fascinating the conversation might be?</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">H</span> Usually, we think of courage in physical terms but ordinary life demands something else. For marketing executive Kenneth Pedeleose, it meant speaking out against something he thought was ethically wrong. The new manager was intimidating staff so Pedeleose carefully recorded each instance of bullying and eventually took the evidence to a senior director, knowing his own job security would be threatened. Eventually the manager was moved. According to Cynthia Pury, a psychologist at Clemson University, Pedeleose's story proves the point that courage is not motivated by fearlessness, but by moral obligation. Pury also believes that people can acquire courage. Many of her students said that faced with a risky situation, they first tried to calm themselves down, then looked for a way to mitigate the danger, just as Pedeleose did by documenting his allegations. Over the long term, picking up a new character trait may help you move toward being the person you want to be. And in the short term, the effort itself could be surprisingly rewarding, a kind of internal adventure. </p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">When evolution runs backwards</p>
                  <p className="text-start text-gray-500 italic mb-2">Evolution isn't supposed to run backwards - yet an increasing number of examples show that it does and that it can sometimes represent the future of a species</p>
                  <p className="text-start text-gray-500 italic mb-2">The description of any animal as an ‘evolutionary throwback’ is controversial. For the better part of a century, most biologists have been reluctant to use those words, mindful of a principle of evolution that says ‘evolution cannot run backwards’. But as more and more examples come to light and modern genetics enters the scene, that principle is having to be rewritten. Not only are evolutionary throwbacks possible, they sometimes play an important role in the forward march of evolution.</p>
                  <p className="text-start text-gray-500 italic mb-2">The technical term for an evolutionary throwback is an ‘atavism’, from the Latin atavus, meaning forefather. The word has ugly connotations thanks largely to Cesare Lombroso, a 19th-century Italian medic who argued that criminals were born not made and could be identified by certain physical features that were throwbacks to a primitive, sub-human state.</p>
                  <p className="text-start text-gray-500 italic mb-2">While Lombroso was measuring criminals, a Belgian palaeontologist called Louis Dollo was studying fossil records and coming to the opposite conclusion. In 1890 he proposed that evolution was irreversible: that ‘an organism is unable to return, even partially, to a previous stage already realised in the ranks of its ancestors’. Early 20th-century biologists came to a similar conclusion, though they qualified it. In terms of probability, stating that there is no reason why evolution cannot run backwards - it is just very unlikely. And so the idea of irreversibility in evolution stuck and came to be known as 'Dollo's law'.</p>
                  <p className="text-start text-gray-500 italic mb-2">If Dollo's law is right, atavisms should occur only very rarely, if at all. Yet almost since the idea took root, exceptions have been cropping up. In 1919, for example, a humpback whale with a pair of leg-like appendages over a metre long, complete with a full set of limb bones, was caught off Vancouver Island in Canada. Explorer Roy Chapman Andrews argued at the time that the whale must be a throwback to a land-living ancestor. 'I can see no other explanation,' he wrote in 1921.</p>
                  <p className="text-start text-gray-500 italic mb-2">Since then, so many other examples have been discovered that it no longer makes sense to say that evolution is as good as irreversible. And this poses a puzzle: how can characteristics that disappeared millions of years ago suddenly reappear? In 1994, Rudolf Raff and colleagues at Indiana University in the USA decided to use genetics to put a number on the probability of evolution going into reverse. They reasoned that while some evolutionary changes involve the loss of genes and are therefore irreversible, others may be the result of genes being switched off. If these silent genes are somehow switched back on, they argued, long-lost traits could reappear.</p>
                  <p className="text-start text-gray-500 italic mb-2">Raff's team went on to calculate the likelihood of it happening. Silent genes accumulate random mutations, they reasoned, eventually rendering them useless. So how long can a gene survive in a species if it is no longer used? The team calculated that there is a good chance of silent genes surviving for up to 6 million years in at least a few individuals in a population, and that some might survive as long as 10 million years. In other words, throwbacks are possible, but only to the relatively recent evolutionary past.</p>
                  <p className="text-start text-gray-500 italic mb-2">As a possible example, the team pointed to the mole salamanders of Mexico and California. Like most amphibians these begin life in a juvenile 'tadpole' state, then metamorphose into the adult form – except for one species, the axolotl, which famously lives its entire life as a juvenile. The simplest explanation for this is that the axolotl lineage alone lost the ability to metamorphose, while others retained it. From a detailed analysis of the salamanders' family tree, however, it is clear that the other lineages evolved from an ancestor that itself had lost the ability to metamorphose. In other words, metamorphosis in mole salamanders is an atavism. The salamander example fits with Raff's 10-million-year time frame.</p>
                  <p className="text-start text-gray-500 italic mb-2">More recently, however, examples have been reported that break the time limit, suggesting that silent genes may not be the whole story. In a paper published last year, biologist Gunter Wagner of Yale University reported some work on the evolutionary history of a group of South American lizards called Bachia. Many of these have minuscule limbs; some look more like snakes than lizards and a few have completely lost the toes on their hind limbs. Other species, however, sport up to four toes on their hind legs. The simplest explanation is that the toed lineages never lost their toes, but Wagner begs to differ. According to his analysis of the Bachia family tree, the toed species re-evolved toes from toeless ancestors and, what is more, digit loss and gain has occurred on more than one occasion over tens of millions of years.</p>
                  <p className="text-start text-gray-500 italic mb-2">So what's going on? One possibility is that these traits are lost and then simply reappear, in much the same way that similar structures can independently arise in unrelated species, such as the dorsal fins of sharks and killer whales. Another more intriguing possibility is that the genetic information needed to make toes somehow survived for tens or perhaps hundreds of millions of years in the lizards and was reactivated. These atavistic traits provided an advantage and spread through the population, effectively reversing evolution.</p>
                  <p className="text-start text-gray-500 italic mb-2">But if silent genes degrade within 6 to 10 million years, how can long-lost traits be reactivated over longer timescales? The answer may lie in the womb. Early embryos of many species develop ancestral features. Snake embryos, for example, sprout hind limb buds. Later in development these features disappear thanks to developmental programs that say 'lose the leg'. If for any reason this does not happen, the ancestral feature may not disappear, leading to an atavism.</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-6</h3><p className="mb-4"><strong>Complete the notes below.</strong></p><p className="mb-4"><strong>Choose ONE WORD AND/OR A NUMBER from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 1-6 on your answer sheet.</p><div className="border border-gray-300 p-4 bg-gray-50"><h4 className="font-bold mb-4 text-center">Wildfires</h4><p className="font-semibold">Characteristics of wildfires and wildfire conditions today compared to the past:</p><ul className="list-disc pl-6 space-y-2"><li>occurrence: more frequent</li><li>temperature: hotter</li><li>speed: faster</li><li>movement: <strong>1</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> more unpredictably</li><li>size of fires: <strong>2</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> greater on average than two decades ago</li></ul><p className="font-semibold mt-4">Reasons wildfires cause more damage today compared to the past:</p><ul className="list-disc pl-6 space-y-2"><li>rainfall: <strong>3</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> average</li><li>more brush to act as <strong>4</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/></li><li>increase in yearly temperature</li><li>extended fire <strong>5</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/></li><li>more building of <strong>6</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> in vulnerable places</li></ul></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7-13</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><p className="mb-4">In boxes 7-13 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>The amount of open space in California has diminished over the last ten years.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>Many experts believe California has made little progress in readying itself to fight fires.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>Personnel in the past have been criticised for mishandling fire containment.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><div className="flex-1"><p>California has replaced a range of firefighting tools.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><div className="flex-1"><p>More firefighters have been hired to improve fire-fighting capacity.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><div className="flex-1"><p>Citizens and government groups disapprove of the efforts of different states and agencies working together.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><div className="flex-1"><p>Randy Jacobs believes that loss of life from fires will continue at the same levels, despite changes made.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p className="mb-4"><strong>Complete the summary below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 14-18 on your answer sheet.</p><div className="border border-gray-300 p-4 bg-gray-50"><p>Psychologists have traditionally believed that a personality <strong>14</strong> <Input className={`inline w-40 mx-1 ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> was impossible and that by a <strong>15</strong> <Input className={`inline w-32 mx-1 ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>, a person's character tends to be fixed. This is not true according to positive psychologists, who say that our personal qualities can be seen as habitual behaviour. One of the easiest qualities to acquire is <strong>16</strong> <Input className={`inline w-32 mx-1 ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>. However, regardless of the quality, it is necessary to learn a wide variety of different <strong>17</strong> <Input className={`inline w-40 mx-1 ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> in order for a new quality to develop; for example, a person must understand and feel some <strong>18</strong> <Input className={`inline w-52 mx-1 ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> in order to increase their happiness.</p></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-22</h3><p className="mb-4"><strong>Look at the following statements (Questions 19-22) and the list of people below.</strong></p><p className="mb-4"><strong>Match each statement with the correct person, A-G.</strong></p><p className="mb-4 italic">Write the correct letter, A-G, in boxes 19-22 on your answer sheet.</p><div className="space-y-4 mb-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><div className="flex-1"><p>People must accept that they do not know much when first trying something new.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><div className="flex-1"><p>It is important for people to actively notice when good things happen.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><div className="flex-1"><p>Courage can be learned once its origins in a sense of responsibility are understood.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">22</span><div className="flex-1"><p>It is possible to overcome shyness when faced with the need to speak in public.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="border border-gray-300 p-4 bg-gray-50"><h4 className="font-semibold mb-2">List of People</h4><div className="grid grid-cols-2 gap-2"><div><strong>A</strong> Christopher Peterson</div><div><strong>B</strong> David Fajgenbaum</div><div><strong>C</strong> Suzanne Segerstrom</div><div><strong>D</strong> Tanya Streeter</div><div><strong>E</strong> Todd Kashdan</div><div><strong>F</strong> Kenneth Pedeleose</div><div><strong>G</strong> Cynthia Pury</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23-26</h3><p className="mb-4"><strong>Reading Passage 2 has eight sections, A-H.</strong></p><p className="mb-4"><strong>Which section contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-H, in boxes 23-26 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><div className="flex-1"><p>a mention of how rational thinking enabled someone to achieve physical goals</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><div className="flex-1"><p>an account of how someone overcame a sad experience</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><div className="flex-1"><p>a description of how someone decided to rethink their academic career path</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><div className="flex-1"><p>an example of how someone risked his career out of a sense of duty</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter in boxes 27-31 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><div className="flex-1"><p>When discussing the theory developed by Louis Dollo, the writer says that</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> it was immediately referred to as Dollo's law.</p><p><strong>B</strong> it supported the possibility of evolutionary throwbacks.</p><p><strong>C</strong> it was modified by biologists in the early twentieth century.</p><p><strong>D</strong> it was based on many years of research.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><div className="flex-1"><p>The humpback whale caught off Vancouver Island is mentioned because of</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> the exceptional size of its body.</p><p><strong>B</strong> the way it exemplifies Dollo's law.</p><p><strong>C</strong> the amount of local controversy it caused.</p><p><strong>D</strong> the reason given for its unusual features.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><div className="flex-1"><p>What is said about 'silent genes'?</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> Their numbers vary according to species.</p><p><strong>B</strong> Raff disagreed with the use of the term.</p><p><strong>C</strong> They could lead to the re-emergence of certain characteristics.</p><p><strong>D</strong> They can have an unlimited life span.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><div className="flex-1"><p>The writer mentions the mole salamander because</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> it exemplifies what happens in the development of most amphibians.</p><p><strong>B</strong> it suggests that Raff's theory is correct.</p><p><strong>C</strong> it has lost and regained more than one ability.</p><p><strong>D</strong> its ancestors have become the subject of extensive research.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">31</span><div className="flex-1"><p>Which of the following does Wagner claim?</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> Members of the Bachia lizard family have lost and regained certain features several times.</p><p><strong>B</strong> Evidence shows that the evolution of the Bachia lizard is due to the environment.</p><p><strong>C</strong> His research into South American lizards supports Raff's assertions.</p><p><strong>D</strong> His findings will apply to other species of South American lizards.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-36</h3><p className="mb-4"><strong>Complete each sentence with the correct ending, A-G, below.</strong></p><p className="mb-4 italic">Write the correct letter, A-G, in boxes 32-36 on your answer sheet.</p><div className="space-y-4 mb-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><div className="flex-1"><p>For a long time biologists rejected</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">33</span><div className="flex-1"><p>Opposing views on evolutionary throwbacks are represented by</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><div className="flex-1"><p>Examples of evolutionary throwbacks have led to</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><div className="flex-1"><p>The shark and killer whale are mentioned to exemplify</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><div className="flex-1"><p>One explanation for the findings of Wagner's research is</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="border border-gray-300 p-4 bg-gray-50"><div className="space-y-1"><div><strong>A</strong> the question of how certain long-lost traits could reappear.</div><div><strong>B</strong> the occurrence of a particular feature in different species.</div><div><strong>C</strong> parallels drawn between behaviour and appearance.</div><div><strong>D</strong> the continued existence of certain genetic information.</div><div><strong>E</strong> the doubts felt about evolutionary throwbacks.</div><div><strong>F</strong> the possibility of evolution being reversible.</div><div><strong>G</strong> Dollo's findings and the convictions held by Lombroso.</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p className="mb-4"><strong>Do the following statements agree with the claims of the writer in Reading Passage 3?</strong></p><p className="mb-4 italic">In boxes 37-40 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the claims of the writer</p><p><strong>NO</strong> if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><div className="flex-1"><p>Wagner was the first person to do research on South American lizards.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>Wagner believes that Bachia lizards with toes had toeless ancestors.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>The temporary occurrence of long-lost traits in embryos is rare.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>Evolutionary throwbacks might be caused by developmental problems in the womb.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
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
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <PageViewTracker 
            book="book-10"
            module="reading"
            testNumber={4}
          />
          <TestStatistics 
            book="book-10"
            module="reading"
            testNumber={4}
          />
          <UserTestHistory 
            book="book-10"
            module="reading"
            testNumber={4}
          />
        </div>

      </div>
    </div>
  )
}