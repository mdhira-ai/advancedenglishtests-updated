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

export default function Book1ReadingTest2() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<Record<string, string[]>>({
    '30&31&32': []
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

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }))
  }

  const handleMultipleChoiceToggle = (questionKey: string, option: string) => {
    setMultipleChoiceAnswers(prev => {
      const currentAnswers = prev[questionKey] || [];
      const isSelected = currentAnswers.includes(option);
      const maxSelections = 3; // Allow exactly 3 selections for questions 30-32

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
    
    // For questions 30-32 (multi-select question)
    if (questionNumber === '30&31&32') {
      const userChoices = multipleChoiceAnswers[questionNumber] || []
      const correctChoices = correctAnswer as string[]
      
      // Check if user selected exactly the correct choices
      if (userChoices.length !== correctChoices.length) return false
      return userChoices.every(choice => correctChoices.includes(choice))
    }
    
    // For other questions
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
    
    // Handle single-answer questions (skip 30, 31, 32)
    for (const questionNumber of Object.keys(correctAnswers)) {
      if (['30', '31', '32', '30&31&32'].includes(questionNumber)) continue; // Skip multi-select questions
      if (checkAnswer(questionNumber)) correctCount++
    }
    
    // Handle multi-select questions (30-32) - award 1 point for each correct choice
    const userChoices3032 = multipleChoiceAnswers['30&31&32'] || [];
    const correctChoices3032 = correctAnswers['30&31&32'] as string[];
    userChoices3032.forEach(choice => {
      if (correctChoices3032.includes(choice)) {
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
        testNumber: 2,
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
    setMultipleChoiceAnswers({ '30&31&32': [] })
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
    
    // For multiple select questions (30-32)
    if (questionNumber === '30&31&32') {
      const userChoices = multipleChoiceAnswers[questionNumber] || []
      const correctChoices = correctAnswers[questionNumber] as string[]
      const correctCount = userChoices.filter(c => correctChoices.includes(c)).length
      
      if (correctCount === correctChoices.length && userChoices.length === correctChoices.length) return 'correct'
      if (correctCount > 0) return 'partial'
      return 'incorrect'
    }
    
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'x', '2': 'vii', '3': 'iii', '4': 'iv', '5': 'xi', '6': 'ii', '7': 'vi', '8': 'viii', 
    '9': 'metabolism', '10': 'less', '11': 'genetic', '12': 'consume', '13': 'behaviour',
    '14': 'D', '15': 'C', '16': 'A', '17': 'F', '18': 'B', '19': 'C', '20': 'F', '21': 'G', 
    '22': 'B', '23': 'E', '24': 'C', '25': 'A', '26': 'D', '27': 'C',
    '28': 'IQ/intelligence', '29': 'multi-faceted approach', '30&31&32': ['B', 'C', 'E'], 
    '33': 'C', '34': 'A', '35': 'NOT GIVEN', '36': 'YES', '37': 'YES', '38': 'NO', '39': 'NO', '40': 'D'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 1 - Reading Test 2</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

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
                </div>
                {!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}
                {isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}
                {submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">
              <h2 className="text-xl font-bold">Reading Passages</h2>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">Tackling Obesity in the Western World</p>
                <p><span className="font-semibold">A</span> Obesity is a huge problem in many Western countries and one which now attracts considerable medical interest as researchers take up the challenge to find a 'cure' for the common condition of being seriously overweight. However, rather than take responsibility for their weight, obese people have often sought solace in the excuse that they have a slow metabolism, a genetic hiccup which sentences more than half the Australian population (63% of men and 47% of women) to a life of battling with their weight. The argument goes like this: it doesn't matter how little they eat, they gain weight because their bodies break down food and turn it into energy more slowly than those with a so-called normal metabolic rate.</p>
                <p><span className="font-semibold">B</span> 'This is nonsense,' says Dr Susan Jebb from the Dunn Nutrition Unit at Cambridge in England. Despite the persistence of this metabolism myth, science has known for several years that the exact opposite is in fact true. Fat people have faster metabolisms than thin people. 'What is very clear,' says Dr Jebb, 'is that overweight people actually burn off more energy. They have more cells, bigger hearts, bigger lungs and they all need more energy just to keep going.'</p>
                <p><span className="font-semibold">C</span> It took only one night, spent in a sealed room at the Dunn Unit to disabuse one of their patients of the beliefs of a lifetime: her metabolism was fast, not slow. By sealing the room and measuring the exact amount of oxygen she used, researchers were able to show her that her metabolism was not the culprit. It wasn't the answer she expected and probably not the one she wanted but she took the news philosophically.</p>
                <p><span className="font-semibold">D</span> Although the metabolism myth has been completely disproved, science has far from discounted our genes as responsible for making us whatever weight we are, fat or thin. One of the world's leading obesity researchers, geneticist Professor Stephen O'Rahilly, goes so far as to say we are on the threshold of a complete change in the way we view not only morbid obesity, but also everyday overweight. Prof. O'Rahilly's groundbreaking work in Cambridge has proven that obesity can be caused by our genes. 'These people are not weak-willed, slothful or lazy,' says Prof. O'Rahilly. 'They have a medical condition due to a genetic defect and that causes them to be obese.'</p>
                <p><span className="font-semibold">E</span> In Australia, the University of Sydney's Professor Ian Caterson says while major genetic defects may be rare, many people probably have minor genetic variations that combine to dictate weight and are responsible for things such as how much we eat, the amount of exercise we do and the amount of energy we need. When you add up all these little variations, the result is that some people are genetically predisposed to putting on weight. He says that while the metabolism debate may have been settled, that doesn't mean some other subtle change in the metabolism gene won't be found in overweight people. He is confident that science will, eventually, be able to 'cure' some forms of obesity but the only effective way for the vast majority of overweight and obese people to lose weight is a change of diet and an increase in exercise.</p>
                <p><span className="font-semibold">F</span> Despite the $500 million a year Australians spend trying to lose weight and the $830 million it costs the community in health care, obesity is at epidemic proportions here, as it is in all Western nations. Until recently, research and treatment for obesity had concentrated on behaviour modification, drugs to decrease appetite and surgery. How the drugs worked was often not understood and many caused severe side effects and even death in some patients. Surgery for obesity has also claimed many lives.</p>
                <p><span className="font-semibold">G</span> It has long been known that a part of the brain called the hypothalamus is responsible for regulating hunger, among other things. But it wasn't until 1994 that Professor Jeffery Friedman from Rockerfeller University in the US sent science in a new direction by studying an obese mouse. Prof. Friedman found that unlike its thin brothers, the fat mouse did not produce a hitherto unknown hormone called leptin. Manufactured by the fat cells, leptin acts as a messenger, sending signals to the hypothalamus to turn off the appetite. Previously, the fat cells were though to be responsible simply for storing fat. Prof. Friedman gave the fat mouse leptin and it lost 30% of its body weight in two weeks.</p>
                <p><span className="font-semibold">H</span> On the other side of the Atlantic, Prof. O'Rahilly read about this research with great excitement. For many months two blood samples had lain in the bottom of his freezer, taken from two extremely obese young cousins. He hired a doctor to develop a test for leptin in human blood, which eventually resulted in the discovery that neither of the children's blood contained the hormone. When one cousin was given leptin, she lost a stone in weight and Prof. O'Rahilly made medical history. Here was the first proof that a genetic defect could cause obesity in humans. But leptin deficiency turned out to be an extremely rare condition and there is a lot more research to be done before the 'magic' cure for obesity is ever found.</p>
              </CardContent>
              </Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">Wheel of Fortune</p>
                <p>Emma Duncan discusses the potential effects on the entertainment industry of the digital revolution</p>
                <p><span className="font-semibold">A</span> Since moving pictures were invented a century ago, a new way of distributing entertainment to consumers has emerged about once every generation. Each such innovation has changed the industry irreversibly; each has been accompanied by a period of fear mixed with exhilaration. The arrival of digital technology, which translates music, pictures and text into the zeros and ones of computer language, marks one of those periods.</p>
                <p><span className="font-semibold">B</span> This may sound familiar, because the digital revolution, and the explosion of choice that would go with it, has been heralded for some time. In 1992, John Malone, chief executive of TCI, an American cable giant, welcomed the '500-channel universe'. Digital television was about to deliver everything except pizzas to people's living rooms. When the entertainment companies tried out the technology, it worked fine – but not at a price that people were prepared to pay.</p>
                <p><span className="font-semibold">C</span> Those 500 channels eventually arrived but via the Internet and the PC rather than through television. The digital revolution was starting to affect the entertainment business in unexpected ways. Eventually it will change every aspect of it, from the way cartoons are made to the way films are screened to the way people buy music. That much is clear. What nobody is sure of is how it will affect the economics of the business.</p>
                <p><span className="font-semibold">D</span> New technologies always contain within them both threats and opportunities. They have the potential both to make the companies in the business a great deal richer, and to sweep them away. Old companies always fear new technology. Hollywood was hostile to television, television terrified by the VCR. Go back far enough, points out Hal Varian, an economist at the University of California at Berkeley, and you find publishers 'complaining that 'circulating libraries' would cannibalise their sales.' Yet whenever a new technology has come in, it has made more money for existing entertainment companies. The proliferation of the means of distribution results, gratifyingly, in the proliferation of dollars, pounds, pesetas and the rest to pay for it.</p>
                <p><span className="font-semibold">E</span> All the same, there is something in the old companies' fears. New technologies may not threaten their lives, but they usually change their role. Once television became widespread, film and radio stopped being the staple form of entertainment. Cable television has undermined the power of the broadcasters. And as power has shifted, the movie studios, the radio companies and the television broadcasters have been swallowed up. These days, the grand old names of entertainment have more resonance than power. Paramount is part of Viacom, a cable company; Universal, part of Seagram, a drinks-and-entertainment company; MGM, once the roaring lion of Hollywood, has been reduced to a whisper because it is not part of one of the giants. And RCA, once the most important broadcasting company in the world, is now a recording label belonging to Bertelsmann, a large German entertainment company.</p>
                <p><span className="font-semibold">F</span> Part of the reason why incumbents got pushed aside was that they did not see what was coming. But they also faced a tighter regulatory environment than the present one. In America, laws preventing television broadcasters from owning programme companies were repealed earlier this decade, allowing the creation of vertically integrated businesses. Greater freedom, combined with a sense of history, prompted the smarter companies in the entertainment business to re-invent themselves. They saw what happened to those of their predecessors who were stuck with one form of distribution. So, these days, the powers in the entertainment business are no longer movie studios, or television broadcasters, or publishers; all those businesses have become part of bigger businesses still, companies that can both create content and distribute it in a range of different ways.</p>
                <p><span className="font-semibold">G</span> Out of all this, seven huge entertainment companies have emerged – Time Warner, Walt Disney, Bertelsmann, Viacom, News Corp, Seagram and Sony. They cover pretty well every bit of the entertainment business except pornography. Three are American, one is Australian, one Canadian, one German and one Japanese. 'What you are seeing', says Christopher Dixon, managing director of media research at PaineWebber, a stockbroker, 'is the creation of a global oligopoly. It happened to the oil and automotive businesses early this century; now it is happening to the entertainment business.' It remains to be seen whether the latest technology will weaken those great companies, or make them stronger than ever.</p>
              </CardContent>
              </Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                <p><span className="font-semibold">W</span>hat do we mean by being 'talented' or 'gifted'? The most obvious way is to look at the work someone does and if they are capable of significant success, label them as talented. The purely quantitative route - 'percentage definition' - looks not at individuals, but at simple percentages, such as the top five per cent of the population, and labels them - by definition - as gifted. This definition has fallen from favour, eclipsed by the advent of IQ tests, favoured by luminaries such as Professor Hans Eysenck, where a series of written or verbal tests of general intelligence leads to a score and intelligence.</p>
                <p>The IQ test has been eclipsed in turn. Most people studying intelligence and creativity in the new millennium now prefer a broader definition, using a multifaceted approach where talents in many areas are recognised rather than purely concentrating on academic achievement. If we are therefore assuming that talented, creative or gifted individuals may need to be assessed across a range of abilities, does this mean intelligence can be inherited? Mental dysfunction - such as schizophrenia - can, so is an efficient mental capacity passed on from parent to child?</p>
                <p>Animal experiments throw some light on this question, and on the whole area of whether it is genetics, the environment or a combination of the two that allows for intelligence and creative ability. Different strains of rats show great differences in intelligence or 'rat reasoning'. If these are brought up in normal conditions and then run through a maze to reach a food goal, the 'bright' strain make far fewer wrong turns that the 'dull' ones. But if the environment is made dull and boring the number of errors becomes equal. Return the rats to an exciting maze and the discrepancy returns as before - but is much smaller. In other words, a dull rat in a stimulating environment will almost do as well as a bright rat who is bored in a normal one. This principle applies to humans too. Someone may be born with innate intelligence, but their environment probably has the final say over whether they become creative or even a genius.</p>
                <p>Evidence now exists that most young children, if given enough opportunities and encouragement, are able to achieve significant and sustainable levels of academic or sporting prowess. Bright or creative children are often physically very active at the same time, and so may receive more parental attention as a result - almost by default - in order to ensure their safety. They may also talk earlier, and this, in turn, presages parental interest. This can sometimes cause problems with other siblings who may feel jealous even though they themselves may be bright. Their creative talents may be undervalued and so never come to fruition. Two themes seem to run through famously creative families as a result. The first is that the parents were able to identify the talents of each child, and nurture and encourage these accordingly but in an even-handed manner. Individual differences were encouraged, and friendly sibling rivalry was not seen as a particular problem. If the father is, say, a famous actor, there is no undue pressure for his children to follow him onto the boards, but instead their chosen interests are encouraged. There need not even be any obvious talent in such a family since there always needs to be someone who sets the family career in motion, as in the case of the Sheen acting dynasty.</p>
                <p>Martin Sheen was the seventh of ten children born to a Spanish immigrant father and an Irish mother. Despite intense parental disapproval he turned his back on entrance exams to university and borrowed cash from a local priest to start a fledgling acting career. His acting successes in films such as Badlands and Apocalypse Now made him one of the most highly-regarded actors of the 1970s. Three sons - Emilio Estevez, Ramon Estevez and Charlie Sheen - have followed him into the profession as a consequence of being inspired by his motivation and enthusiasm.</p>
                <p>A stream seems to run through creative families. Such children are not necessarily born talented and with a love of the parents. They feel loved and wanted, and are secure in their home, but are more surrounded by an atmosphere of work and where following a calling appears to be important. They may see from their parents that it takes time and dedication to be master of a craft, and so are in less of a hurry to achieve for themselves once they start to work.</p>
                <p>The generation of creativity is complex: it is a mixture of genetics, the environment, parental teaching and luck that determines the successful or talented family members. This last point - luck - is often not mentioned where talent is concerned but plays an undoubted part. Mozart, considered by many to be the finest composer of all time, was lucky to be living in an age that encouraged the writing of music. He was brought up surrounded by it, his father was a musician who encouraged him to the point of giving up his job to promote his child genius, and he learnt musical composition with frightening speed - the speed of a genius. Mozart himself simply wanted to create the finest music ever written but did not necessarily view himself as a genius - he could write sublime music at will, and so often preferred to lead a hedonistic lifestyle that he found more exciting than writing music to order.</p>
                <p>Albert Einstein and Bill Gates are two more examples of people whose talents have blossomed by virtue of the times they were living in. Einstein was a solitary, somewhat slow child who had affection at home but whose phenomenal intelligence emerged without any obvious parental input. This may have been partly due to the fact that at the start of the 20th Century a lot of the Newtonian laws of physics were being questioned, leaving a fertile ground for ideas such as his to be developed. Bill Gates may have had the creative vision to develop Microsoft, but without the new computer age dawning at the same time he may never have achieved the position on the world stage he now occupies.</p>
              </CardContent>
              </Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 1: Q 1-13</button>
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 2: Q 14-27</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 3: Q 28-40</button>
                </div>
              </div>

              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p className="mb-4"><strong>Reading Passage 1 has seven paragraphs A-H. From the list of headings below choose the most suitable heading for each paragraph.</strong></p><p className="mb-4 italic">Write the appropriate numbers (i-xi) in boxes 1-8 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg mb-4"><h4 className="font-semibold mb-3">List of headings</h4><div className="space-y-1 text-sm"><p><strong>i</strong> Obesity in animals</p><p><strong>ii</strong> Hidden dangers</p><p><strong>iii</strong> Proof of the truth</p><p><strong>iv</strong> New perspective on the horizon</p><p><strong>v</strong> No known treatment</p><p><strong>vi</strong> Rodent research leads the way</p><p><strong>vii</strong> Expert explains energy requirements of obese people</p><p><strong>viii</strong> A very uncommon complaint</p><p><strong>ix</strong> Nature or nurture</p><p><strong>x</strong> Shifting the blame</p><p><strong>xi</strong> Lifestyle change required despite new findings</p></div></div><div className="grid grid-cols-2 gap-4"><div>1. Paragraph A <Input className={`ml-2 w-20 ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>2. Paragraph B <Input className={`ml-2 w-20 ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>3. Paragraph C <Input className={`ml-2 w-20 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>4. Paragraph D <Input className={`ml-2 w-20 ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>5. Paragraph E <Input className={`ml-2 w-20 ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>6. Paragraph F <Input className={`ml-2 w-20 ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>7. Paragraph G <Input className={`ml-2 w-20 ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>8. Paragraph H <Input className={`ml-2 w-20 ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p className="mb-4"><strong>Complete the summary of Reading Passage 1 (Questions 9-13) using words from the box at the bottom of the page.</strong></p><p className="mb-4 italic">Write your answers in boxes 9-13 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg space-y-3"><h4 className="font-semibold text-center mb-2">OBESITY</h4><p>People with a (0) ... problem often try to deny responsibility. They do this by seeking to blame their (9) ... for the fact that they are overweight and erroneously believe that they use (10) ... energy than thin people to stay alive. However, recent research has shown that a (11) ... problem can be responsible for obesity as some people seem programmed to (12) ... more than others. The new research points to a shift from trying to change people's (13) ... to seeking an answer to the problem in the laboratory.</p></div><div className="bg-gray-100 p-4 rounded-lg mt-4 grid grid-cols-4 gap-2 text-sm text-center"><p>weight</p><p>exercise</p><p>sleep</p><p>mind</p><p>bodies</p><p>exercise</p><p>metabolism</p><p>more</p><p>genetic</p><p>less</p><p>physical</p><p>consume</p><p>behaviour</p><p>use</p><p>mental</p></div><div className="mt-4 grid grid-cols-2 gap-4"><div>9. <Input value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>10. <Input value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>11. <Input value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>12. <Input value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>13. <Input value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-27</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-21</h3><p className="mb-4"><strong>Reading Passage 2 has seven paragraphs A-G. Which paragraph mentions the following (Questions 14-21)?</strong></p><p className="mb-4 italic">Write the appropriate letters (A-G) in boxes 14-21 on your answer sheet. NB Some of the paragraphs will be used more than once.</p><div className="space-y-3"><div><span className="font-semibold mr-2">14</span>the contrasting effects that new technology can have on existing business<Input className={`ml-4 w-16 ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">15</span>the fact that a total transformation is going to take place in the future in the delivery of all forms of entertainment<Input className={`ml-4 w-16 ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">16</span>the confused feelings that people are known to have experienced in response to technological innovation<Input className={`ml-4 w-16 ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">17</span>the fact that some companies have learnt from the mistakes of others<Input className={`ml-4 w-16 ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">18</span>the high cost to the consumer of new ways of distributing entertainment<Input className={`ml-4 w-16 ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">19</span>uncertainty regarding the financial impact of wider media access<Input className={`ml-4 w-16 ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">20</span>the fact that some companies were the victims of strict government policy<Input className={`ml-4 w-16 ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">21</span>the fact that the digital revolution could undermine the giant entertainment companies<Input className={`ml-4 w-16 ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 22-25</h3><p className="mb-4"><strong>The writer refers to various individuals and companies in the reading passage. Match the people or companies (A-E) with the points made in Questions 22-25 about the introduction of new technology.</strong></p><p className="mb-4 italic">Write the appropriate letter (A-E) in boxes 22-25 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm"><p><strong>A</strong> John Malone</p><p><strong>B</strong> Hal Varian</p><p><strong>C</strong> MGM</p><p><strong>D</strong> Walt Disney</p><p><strong>E</strong> Christopher Dixon</p></div><div className="space-y-3"><div><span className="font-semibold mr-2">22</span>Historically, new forms of distributing entertainment have alarmed those well-established in the business.<Input className={`ml-4 w-16 ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">23</span>The merger of entertainment companies follows a pattern evident in other industries.<Input className={`ml-4 w-16 ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">24</span>Major entertainment bodies that have remained independent have lost their influence.<Input className={`ml-4 w-16 ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><span className="font-semibold mr-2">25</span>News of the most recent technological development was published some years ago.<Input className={`ml-4 w-16 ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 26-27</h3><p className="mb-4"><strong>Choose the appropriate letters A-D and write them in boxes 26-27 on your answer sheet.</strong></p><div className="space-y-6"><div className="space-y-2"><p><span className="font-semibold">26</span> How does the writer put across his views on the digital revolution?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> by examining the forms of media that will be affected by it</p><p><strong>B</strong> by analysing the way entertainment companies have reacted to it</p><p><strong>C</strong> by giving a personal definition of technological innovation</p><p><strong>D</strong> by drawing comparisons with other periods of technological innovation</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-2"><p><span className="font-semibold">27</span> Which of the following best summarises the writer's views in Reading Passage 2?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> The public should cease resisting the introduction of new technology.</p><p><strong>B</strong> Digital technology will increase profits in the entertainment business.</p><p><strong>C</strong> Entertainment companies should adapt to technological innovation.</p><p><strong>D</strong> Technological change only benefits big entertainment companies.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 28-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 28-29</h3><p className="mb-4"><strong>Complete the notes, which show how the approaches to defining 'talent' have changed. Choose ONE or TWO WORDS from the passage for each answer.</strong></p><div className="bg-gray-50 p-6 rounded-lg border text-center"><p>'percentage definition'</p><p>↓</p><p>... <strong>28</strong> ...</p><p>↓</p><p>... <strong>29</strong> ...</p></div><div className="mt-4 grid grid-cols-2 gap-4"><div>28. <Input value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>29. <Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 30-32</h3><p className="mb-4"><strong>Which THREE of the following does the writer regard as a feature of creative families?</strong></p><p className="mb-4 italic">Choose exactly THREE letters A-F in boxes 30-32 on your answer sheet.</p><div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { letter: 'A', text: 'a higher than average level of parental affection' },
                        { letter: 'B', text: 'competition between brothers and sisters' },
                        { letter: 'C', text: 'parents who demonstrate vocational commitment' },
                        { letter: 'D', text: 'strong motivation to take exams and attend university' },
                        { letter: 'E', text: 'a patient approach to achieving success' },
                        { letter: 'F', text: 'the identification of the most talented child in the family' }
                      ].map(option => {
                        const isSelected = (multipleChoiceAnswers['30&31&32'] || []).includes(option.letter)
                        const isCorrect = submitted && ['B', 'C', 'E'].includes(option.letter) && isSelected
                        const isIncorrect = submitted && ((!['B', 'C', 'E'].includes(option.letter) && isSelected) || (['B', 'C', 'E'].includes(option.letter) && !isSelected))
                        
                        return (
                          <button
                            key={option.letter}
                            onClick={() => handleMultipleChoiceToggle('30&31&32', option.letter)}
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
                      Selected: {(multipleChoiceAnswers['30&31&32'] || []).length}/3 options
                      {(multipleChoiceAnswers['30&31&32'] || []).length > 0 && (
                        <span className="ml-2 font-medium">({(multipleChoiceAnswers['30&31&32'] || []).join(', ')})</span>
                      )}
                    </div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-34</h3><p className="mb-4"><strong>Choose the appropriate letters A-D and write them in boxes 33-34 on your answer sheet.</strong></p><div className="space-y-6"><div className="space-y-2"><p><span className="font-semibold">33</span> The rat experiment was conducted to show that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> a certain species of rat are more intelligent than others.</p><p><strong>B</strong> intelligent rats are more motivated than 'dull' rats.</p><p><strong>C</strong> a rat's surroundings can influence its behaviour.</p><p><strong>D</strong> a boring environment makes for a 'bright' rat.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-2"><p><span className="font-semibold">34</span> The writer cites the story of Martin Sheen to 'show' that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> he was the first in a creative line.</p><p><strong>B</strong> his parents did not have his creative flair.</p><p><strong>C</strong> he became an actor without proper training.</p><p><strong>D</strong> his sons were able to benefit from his talents.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 35-39</h3><p className="mb-4"><strong>Do the following statements agree with the claims of the writer in Reading Passage 3?</strong></p><p className="mb-4 italic">In boxes 35-39 on your answer sheet write</p><div className="ml-4 mb-4 space-y-1 text-sm"><p><strong>YES</strong> if the statement agrees with the writer's claims</p><p><strong>NO</strong> if the statement contradicts the writer's claims</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-3"><div>35. Intelligence tests have now been proved to be unreliable.<Input className={`ml-auto max-w-[150px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>36. The brother or sister of a gifted older child may fail to fulfil their own potential.<Input className={`ml-auto max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>37. The importance of luck in the genius equation tends to be ignored.<Input className={`ml-auto max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>38. Mozart was acutely aware of his own remarkable talent.<Input className={`ml-auto max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>39. Einstein and Gates would have achieved success in any era.<Input className={`ml-auto max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Question 40</h3><p className="mb-4"><strong>From the list below choose the most suitable title for the whole of Reading Passage 3.</strong></p><p className="mb-4 italic">Write the appropriate letter A-D in box 40 on your answer sheet.</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> Geniuses in their time</p><p><strong>B</strong> Education for the gifted</p><p><strong>C</strong> Revising the definition of intelligence</p><p><strong>D</strong> Nurturing talent within the family</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {submitted && (<Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4"><div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div><div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div><div className="flex justify-center space-x-4 mt-6"><Button onClick={handleReset} variant="outline">Try Again</Button><Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button></div></div></CardContent></Card>)}
        {showAnswers && (<Card className="mt-8"><CardHeader><CardTitle>Answer Key</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{Object.entries(correctAnswers).map(([question, answer]) => (<div key={question} className="flex justify-between p-2 bg-gray-50 rounded"><span className="font-semibold">{question}:</span><span className="text-gray-800">{answer}</span></div>))}</div></CardContent></Card>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div><div className="text-center"><div className="text-3xl font-bold text-red-600">{40 - score}</div><div className="text-sm text-gray-600">Incorrect Answers</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map((qNum) => { 
  const userAnswer = qNum === '30&31&32' 
    ? (multipleChoiceAnswers[qNum] || []).join(', ') 
    : answers[qNum] || ''; 
  const correctAnswer = correctAnswers[qNum as keyof typeof correctAnswers]; 
  const isCorrect = checkAnswer(qNum); 
  return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {qNum === '30&31&32' ? '30-32' : qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}</span></div></div></div>);
})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <PageViewTracker 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={2} 
          />
          <TestStatistics 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={2} 
          />
          <UserTestHistory 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={2}
          />
        </div>
      </div>
    </div>
  )
}