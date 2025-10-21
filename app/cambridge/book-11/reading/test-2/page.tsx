'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { TestStatistics } from '@/components/analytics/TestStatistics'
import { UserTestHistory } from '@/components/analytics/UserTestHistory';

export default function Book11ReadingTest2() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Set test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
  const [activeTab, setActiveTab] = useState('section1')

  const { clearAllHighlights, getHighlightCount } = useTextHighlighter()

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Handled by TextHighlighter
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
    
    // For questions 25 and 26, each can be B or C individually
    if (questionNumber === '25' || questionNumber === '26') {
        const correctSet = new Set(['B', 'C'])
        return correctSet.has(userAnswer.toUpperCase())
    }

    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber)
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
      
      // Save to database using test score saver
      const testScoreData = {
        book: 'book-11',
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
    setTimeLeft(60 * 60)
    clearAllHighlights()
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'

    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'TRUE', '2': 'NOT GIVEN', '3': 'TRUE', '4': 'FALSE', '5': 'C', '6': 'B', '7': 'G', '8': 'A',
    '9': '(lifting) frame', '10': 'hydraulic jacks', '11': 'stabbing guides', '12': '(lifting) cradle', '13': 'air bags',
    '14': 'ii', '15': 'ix', '16': 'viii', '17': 'i', '18': 'iv', '19': 'vii', '20': 'vi',
    '21': 'farming', '22': 'canoes', '23': 'birds', '24': 'wood',
    '25': 'B/C', '26': 'B/C', // Handled by special logic
    '27': 'C', '28': 'D', '29': 'B', '30': 'A', '31': 'C', '32': 'B', '33': 'H',
    '34': 'NOT GIVEN', '35': 'YES', '36': 'NO', '37': 'NO', '38': 'YES', '39': 'NOT GIVEN', '40': 'A'
  }
  const answerKeysForDisplay = { ...correctAnswers, '25': 'B, C (in any order)', '26': 'B, C (in any order)' };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 11 - Reading Test 2</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

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
              {!isTestStarted && !submitted && (<div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800"><p className="font-semibold">Instructions:</p><p>• You have 60 minutes to complete all 40 questions</p><p>• Click "Start Test" to begin the timer</p></div>)}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">
              <h2 className="text-xl font-bold">Reading Passages</h2>
              <div className="flex items-center space-x-2">
                <Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button>
                <div className="text-xs text-gray-500">Select text to highlight • Double-click to remove • ESC to cancel</div>
              </div>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
                <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center font-bold text-xl mb-4">Raising the Mary Rose</p><p>On 19 July 1545, English and French fleets were engaged in a sea battle off the coast of southern England in the area of water called the Solent, between Portsmouth and the Isle of Wight. Among the English vessels was a warship by the name of Mary Rose. Built in Portsmouth some 35 years earlier, she had had a long and successful fighting career, and was a favorite of King Henry VIII. Accounts of what happened to the ship vary: while witnesses agree that she was not hit by the French, some maintain that she was outdated, over-laden and sailing too low in the water, others that she was mishandled by an undisciplined crew. What is undisputed, however, is that the Mary Rose sank into the Solent that day, taking at least 500 men with her. After the battle, attempts were made to recover the ship, but these failed.</p><p>The Mary Rose came to rest on the seabed, lying on her starboard (right) side at an angle of approximately 60 degrees. The hull (the body of the ship) acted as a trap for the sand and mud carried by the Solent currents. As a result, the starboard side filled rapidly, leaving the exposed port (left) side to be eroded by marine organisms and mechanical degradation. Because of the way the ship sank, nearly all of the starboard half survived intact. During the seventeenth and eighteenth centuries, the entire site became covered with a layer of hard grey clay, which minimised further erosion.</p><p>Then, on 16 June 1836, some fishermen in the Solent found that their equipment was caught on an underwater obstruction, which turned out to be the Mary Rose. Diver John Deane happened to be exploring another sunken ship nearby, and the fishermen approached him, asking him to free their gear. Deane dived down, and found the equipment caught on a timber protruding slightly from the seabed. Exploring further, he uncovered several other timbers and a bronze gun. Deane continued diving on the site intermittently until 1840, recovering several more guns, two bows, various timbers, part of a pump and various other small finds.</p><p>The Mary Rose then faded into obscurity for another hundred years. But in 1965, military historian and amateur diver Alexander McKee, in conjunction with the British Sub-Aqua Club, initiated a project called ‘Solent Ships’. While on paper this was a plan to examine a number of known wrecks in the Solent, what McKee really hoped for was to find the Mary Rose. Ordinary search techniques proved unsatisfactory, so McKee entered into collaboration with Harold E. Edgerton, professor of electrical engineering at the Massachusetts Institute of Technology. In 1967, Edgerton’s side-scan sonar systems revealed a large, unusually shaped object, which McKee believed was the Mary Rose.</p><p>Further excavations revealed stray pieces of timber and an iron gun. But the climax to the operation came when, on 5 May 1971, part of the ship’s frame was uncovered. McKee and his team now knew for certain that they had found the wreck, but were as yet unaware that it also housed a treasure trove of beautifully preserved artefacts. Interest in the project grew, and in 1979, the Mary Rose Trust was formed, with Prince Charles as its president and Dr Margaret Rule its archaeological director. The decision whether or not to salvage the wreck was not an easy one, although an excavation in 1978 had shown that it might be possible to raise the hull. While the original aim was to raise the hull if at all feasible, the operation was not given the go-ahead until January 1982, when all the necessary information was available.</p><p>An important factor in trying to salvage the Mary Rose was that the remaining hull was an open shell. This led to an important decision being taken: namely to carry out the lifting operation in three very distinct stages. The hull was attached to a lifting frame via a network of bolts and lifting wires. The problem of the hull being sucked back downwards into the mud was overcome by using 12 hydraulic jacks. These raised it a few centimetres over a period of several days, as the lifting frame rose slowly up its four legs. It was only when the hull was hanging freely from the lifting frame, clear of the seabed and the suction effect of the surrounding mud, that the salvage operation progressed to the second stage. In this stage, the lifting frame was fixed to a hook attached to a crane, and the hull was lifted completely clear of the seabed and transferred underwater into the lifting cradle. This required precise positioning to locate the legs into the ‘stabbing guides’ of the lifting cradle. The lifting cradle was designed to fit the hull using archaeological survey drawings, and was fitted with air bags to provide additional cushioning for the hull’s delicate timber framework. The third and final stage was to lift the entire structure into the air, by which time the hull was also supported from below. Finally, on 11 October 1982, millions of people around the world held their breath as the timber skeleton of the Mary Rose was lifted clear of the water, ready to be returned home to Portsmouth.</p></CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center font-bold text-xl mb-4">What destroyed the civilisation of Easter Island?</p><p><span className="font-semibold">A</span> Easter Island, or Rapa Nui as it is known locally, is home to several hundred ancient human statues – the moai. After this remote Pacific island was settled by the Polynesians, it remained isolated for centuries. All the energy and resources that went into the moai – some of which are ten metres tall and weigh over 7,000 kilos – came from the island itself. Yet when Dutch explorers landed in 1722, they met a Stone Age culture. The moai were carved with stone tools, then transported for many kilometres, without the use of animals or wheels, to massive stone platforms. The identity of the moai builders was in doubt until well into the twentieth century. Thor Heyerdahl, the Norwegian ethnographer and adventurer, thought the statues had been created by pre-Inca peoples from Peru. Bestselling Swiss author Erich von Däniken believed they were built by stranded extraterrestrials. Modern science – linguistic, archaeological and genetic evidence – has definitively proved the moai builders were Polynesians, but not how they moved their creations. Local folklore maintains that the statues walked, while researchers have tended to assume the ancestors dragged the statues somehow, using ropes and logs.</p><p><span className="font-semibold">B</span> When the Europeans arrived, Rapa Nui was grassland, with only a few scrawny trees. In the 1970s and 1980s, though, researchers found pollen preserved in lake sediments, which proved the island had been covered in lush palm forests for thousands of years. Only after the Polynesians arrived did those forests disappear. US scientist Jared Diamond believes that the Rapanui people – descendants of Polynesian settlers – wrecked their own environment. They had unfortunately settled on an extremely fragile island – dry, cool, and too remote to be properly fertilised by windblown volcanic ash. When the islanders cleared the forests for firewood and farming, the forests didn’t grow back. As trees became scarce and they could no longer construct wooden canoes for fishing, they ate birds. Soil erosion decreased their crop yields. Before Europeans arrived, the Rapanui had descended into civil war and cannibalism, he maintains. The collapse of their isolated civilisation, Diamond writes, is a ‘worst-case scenario for what may lie ahead of us in our own future’.</p><p><span className="font-semibold">C</span> The moai, he thinks, accelerated the self-destruction. Diamond interprets them as power displays by rival chieftains who, trapped on a remote little island, lacked other ways of asserting their dominance. They competed by building ever bigger figures. Diamond thinks they laid the moai on wooden sledges, hauled over log rails, but that required both a lot of wood and a lot of people. To feed the people, even more land had to be cleared. When the wood was gone and civil war began, the islanders began toppling the moai. By the nineteenth century none were standing.</p><p><span className="font-semibold">D</span> Archaeologists Terry Hunt of the University of Hawaii and Carl Lipo of California State University agree that Easter Island lost its lush forests and that it was an ‘ecological catastrophe’ – but they believe the islanders themselves weren’t to blame. And the moai certainly weren’t. Archaeological excavations indicate that the Rapanui went to heroic efforts to protect the resources of their wind-lashed, infertile fields. They built thousands of circular stone windbreaks and gardened inside them, and used broken volcanic rocks to keep the soil moist. In short, Hunt and Lipo argue, the prehistoric Rapanui were ‘pioneers of sustainable farming’.</p><p><span className="font-semibold">E</span> Hunt and Lipo contend that moai-building was an activity that helped keep the peace between islanders. They also believe that moving the moai required few people and no wood, because they were walked upright. On that issue, Hunt and Lipo say, archaeological evidence backs up Rapanui folklore. Recent experiments indicate that as few as 18 people could, with three strong ropes and a bit of practice, easily manoeuvre a 1,000 kg moai replica a few hundred metres. The figures’ fat bellies tilted them forward, and a D-shaped base allowed handlers to roll and rock them side to side.</p><p><span className="font-semibold">F</span> Moreover, Hunt and Lipo are convinced that the settlers were not wholly responsible for the loss of the island’s trees. Archaeological finds of nuts from the extinct Easter Island palm show tiny grooves, made by the teeth of Polynesian rats. The rats arrived along with the settlers, and in just a few years, Hunt and Lipo calculate, they would have overrun the island. They would have prevented the reseeding of the slow-growing palm trees and thereby doomed Rapa Nui’s forest, even without the settlers’ campaign of deforestation. No doubt the rats ate birds’ eggs too. Hunt and Lipo also see no evidence that Rapanui civilisation collapsed when the palm forest did. They think its population grew rapidly and then remained more or less stable until the arrival of the Europeans, who introduced deadly diseases to which islanders had no immunity. Then in the nineteenth century slave traders decimated the population, which shrivelled to 111 people by 1877.</p><p><span className="font-semibold">G</span> Hunt and Lipo’s vision, therefore, is one of an island populated by peaceful and ingenious moai builders and careful stewards of the land, rather than by reckless destroyers ruining their own environment and society. Rather than a case of abject failure, Rapa Nui is an unlikely story of success, they claim. Whichever is the case, there are surely some valuable lessons which the world at large can learn from the story of Rapa Nui.</p></CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center font-bold text-xl mb-4">Neuroaesthetics</p><p>An emerging discipline called neuroaesthetics is seeking to bring scientific objectivity to the study of art, and has already given us a better understanding of many masterpieces. The blurred imagery of Impressionist paintings seems to stimulate the brain’s amygdala, for instance. Since the amygdala plays a crucial role in our feelings, that finding might explain why many people find these pieces so moving.</p><p>Could the same approach also shed light on abstract twentieth-century pieces, from Mondrian’s geometrical blocks of colour, to Pollock’s seemingly haphazard arrangements of splashed paint on canvas? Sceptics believe that people claim to like such works simply because they are famous. We certainly do have an inclination to follow the crowd. When asked to make simple perceptual decisions such as matching a shape to its rotated image, for example, people often choose a definitively wrong answer if they see others doing the same. It is easy to imagine that this mentality would have even more impact on a fuzzy concept like art appreciation, where there is no right or wrong answer.</p><p>Angelina Hawley-Dolan, of Boston College, Massachusetts, responded to this debate by asking volunteers to view pairs of paintings – either the creations of famous abstract artists or the doodles of infants, chimps and elephants. They then had to judge which they preferred. A third of the paintings were given no captions, while many were labelled incorrectly – volunteers might think they were viewing a chimp’s messy brushstrokes when they were actually seeing an acclaimed masterpiece. In each set of trials, volunteers generally preferred the work of renowned artists, even when they believed it was by an animal or a child. It seems that the viewer can sense the artist’s vision in paintings, even if they can’t explain why.</p><p>Robert Pepperell, an artist based at Cardiff University, creates ambiguous works that are neither entirely abstract nor clearly representational. In one study, Pepperell and his collaborators asked volunteers to decide how ‘powerful’ they considered an artwork to be, and whether they saw anything familiar in the piece. The longer they took to answer these questions, the more highly they rated the piece under scrutiny, and the greater their neural activity. It would seem that the brain sees these images as puzzles, and the harder it is to decipher the meaning, the more rewarding is the moment of recognition.</p><p>And what about artists such as Mondrian, whose paintings consist exclusively of horizontal and vertical lines encasing blocks of colour? Mondrian’s works are deceptively simple, but eye-tracking studies confirm that they are meticulously composed, and that simply rotating a piece radically changes the way we view it. With the originals, volunteers’ eyes tended to stay longer on certain places in the image, but with the altered versions they would flit across a piece more rapidly. As a result, the volunteers considered the altered versions less pleasurable when they later rated the work.</p><p>In a similar study, Oshin Vartanian of Toronto University asked volunteers to compare original paintings with ones which he had altered by moving objects around within the frame. He found that almost everyone preferred the original, whether it was a Van Gogh still life or an abstract by Miró. Vartanian also found that changing the composition of the paintings reduced activation in those brain areas linked with meaning and interpretation.</p><p>In another experiment, Alex Forsythe of the University of Liverpool analysed the visual intricacy of different pieces of art, and her results suggest that many artists use a key level of detail to please the brain. Too little and the work is boring, but too much results in a kind of ‘perceptual overload’, according to Forsythe. What’s more, appealing pieces both abstract and representational, show signs of ‘fractals’ – repeated motifs recurring in different scales. Fractals are common throughout nature, for example in the shapes of mountain peaks or the branches of trees. It is possible that our visual system, which evolved in the great outdoors, finds it easier to process such patterns.</p><p>It is also intriguing that the brain appears to process movement when we see a handwritten letter, as if we are replaying the writer’s moment of creation. This has led some to wonder whether Pollock’s works feel so dynamic because the brain reconstructs the energetic actions the artist used as he painted. This may be down to our brain’s ‘mirror neurons’, which are known to mimic others’ actions. The hypothesis will need to be thoroughly tested, however. It might even be the case that we could use neuroaesthetic studies to understand the longevity of some pieces of artwork. While the fashions of the time might shape what is currently popular, works that are best adapted to our visual system may be the most likely to linger once the trends of previous generations have been forgotten.</p><p>It’s still early days for the field of neuroaesthetics – and these studies are probably only a taste of what is to come. It would, however, be foolish to reduce art appreciation to a set of scientific laws. We shouldn’t underestimate the importance of the style of a particular artist, their place in history and the artistic environment of their time. Abstract art offers both a challenge and the freedom to play with different interpretations. In some ways, it’s not so different to science, where we are constantly looking for systems and decoding meaning so that we can view and appreciate the world in a new way.</p></CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
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
              {activeTab === 'section1' && (<Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-4</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><p className="mb-4">In boxes 1-4 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>There is some doubt about what caused the Mary Rose to sink.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>The Mary Rose was the only ship to sink in the battle of 19 July 1545.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>Most of one side of the Mary Rose lay undamaged under the sea.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>Alexander McKee knew that the wreck would contain many valuable historical objects.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 5-8</h3><p className="mb-4"><strong>Look at the following statements (Questions 5-8) and the list of dates below.</strong></p><p className="mb-4"><strong>Match each statement with the correct date, A-G.</strong></p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Dates</h4><div className="grid grid-cols-2 gap-2"><div><strong>A</strong> 1836</div><div><strong>B</strong> 1840</div><div><strong>C</strong> 1965</div><div><strong>D</strong> 1967</div><div><strong>E</strong> 1971</div><div><strong>F</strong> 1979</div><div><strong>G</strong> 1982</div></div></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>A search for the Mary Rose was launched.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>One person's exploration of the Mary Rose site stopped.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>It was agreed that the hull of the Mary Rose should be raised.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>The site of the Mary Rose was found by chance.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p className="mb-4"><strong>Label the diagram below.</strong></p><p className="mb-4">Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p><div className="text-center mb-6"><h4 className="font-semibold mb-4">Raising the hull of the Mary Rose: Stages one and two</h4><div className="border border-gray-300 p-4 bg-gray-50"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/reading/test2/diagram.png" alt="Diagram showing the raising of the Mary Rose" className="mx-auto max-w-full h-auto"/><p className="text-sm text-gray-500 mt-2">[Diagram of the Mary Rose salvage operation]</p></div></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>................ attached to hull by wires</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><div className="flex-1"><p>................ to prevent hull being sucked into mud</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><div className="flex-1"><p>legs are placed into ................</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><div className="flex-1"><p>hull is lowered into ................</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><div className="flex-1"><p>................ used as extra protection for the hull</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div></CardContent></Card>)}
              {activeTab === 'section2' && (<Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-20</h3><p className="mb-4"><strong>Reading Passage 2 has seven paragraphs, A-G.</strong></p><p className="mb-4">Choose the correct heading for each paragraph from the list of headings below.</p><p className="mb-4">Write the correct number, <strong>i-ix</strong>, in boxes 14-20 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4><div className="space-y-1"><div><strong>i</strong> Evidence of innovative environment management practices</div><div><strong>ii</strong> An undisputed answer to a question about the moai</div><div><strong>iii</strong> The future of the moai statues</div><div><strong>iv</strong> A theory which supports a local belief</div><div><strong>v</strong> The future of Easter Island</div><div><strong>vi</strong> Two opposing views about the Rapanui people</div><div><strong>vii</strong> Destruction outside the inhabitants' control</div><div><strong>viii</strong> How the statues made a situation worse</div><div><strong>ix</strong> Diminishing food resources</div></div></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><p>Paragraph A</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><p>Paragraph B</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><p>Paragraph C</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><p>Paragraph D</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">18</span><p>Paragraph E</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><p>Paragraph F</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><p>Paragraph G</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21-24</h3><p className="mb-4"><strong>Complete the summary below.</strong></p><p className="mb-4">Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p><p className="mb-4">Write your answers in boxes 21-24 on your answer sheet.</p><div className="space-y-4 p-4 border rounded-md bg-gray-50"><h4 className="font-semibold text-center mb-4">Jared Diamond's View</h4><p>Diamond believes that the Polynesian settlers on Rapa Nui destroyed its forests, cutting down its trees for <span className="font-semibold">21</span><Input className={`inline-block w-20 mx-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} />. Twentieth-century discoveries of pollen prove that Rapa Nui had once been covered in palm forests, which had turned into grassland by the time the Europeans arrived on the island. When the islanders were no longer able to build the <span className="font-semibold">22</span><Input className={`inline-block w-20 mx-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} /> they needed to go fishing, they began using the island's <span className="font-semibold">23</span><Input className={`inline-block w-20 mx-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} /> as a food source, according to Diamond. Diamond also claims that the moai were built to show the power of the island's chieftains, and that the methods of transporting the statues needed not only a great number of people, but also a great deal of <span className="font-semibold">24</span><Input className={`inline-block w-20 mx-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} />.</p></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 25-26</h3><p className="mb-4">Choose <strong>TWO</strong> letters, <strong>A-E</strong>.</p><p className="mb-4">On what points do Hunt and Lipo disagree with Diamond?</p><p className="mb-4">Write the correct letters in boxes 25-26 on your answer sheet.</p><div className="ml-4 mb-4 space-y-1"><div><strong>A</strong> the period when the moai were created</div><div><strong>B</strong> how the moai were transported</div><div><strong>C</strong> the impact of the moai on Rapanui society</div><div><strong>D</strong> how the moai were carved</div><div><strong>E</strong> the origins of the people who made the moai</div></div><div className="space-y-2 flex gap-4 items-center"><span className="font-semibold min-w-[20px]">25</span><div><Input className={`max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="space-y-2 flex gap-4 items-center"><span className="font-semibold min-w-[20px]">26</span><div><Input className={`max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></CardContent></Card>)}
              {activeTab === 'section3' && (<Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-30</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="space-y-6"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><div className="flex-1"><p>In the second paragraph, the writer refers to a shape-matching test in order to illustrate</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> the subjective nature of art appreciation.</div><div><strong>B</strong> the reliance of modern art on abstract forms.</div><div><strong>C</strong> our tendency to be influenced by the opinions of others.</div><div><strong>D</strong> a common problem encountered when processing visual data.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><div className="flex-1"><p>Angelina Hawley-Dolan’s findings indicate that people</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> mostly favour works of art which they know well.</div><div><strong>B</strong> have a deep-seated reaction to abstract art.</div><div><strong>C</strong> are often misled by their initial expectations of a work of art.</div><div><strong>D</strong> have the ability to perceive the intention behind works of art.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><div className="flex-1"><p>Results of studies involving Robert Pepperell’s pieces suggest that people</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> can appreciate a painting without fully understanding it.</div><div><strong>B</strong> find it satisfying to work out what a painting represents.</div><div><strong>C</strong> vary widely in the time they spend looking at paintings.</div><div><strong>D</strong> generally prefer representational art to abstract art.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><div className="flex-1"><p>What do the experiments described in the fifth paragraph suggest about the paintings of Mondrian?</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> They are more carefully put together than they appear.</div><div><strong>B</strong> They can be interpreted in a number of different ways.</div><div><strong>C</strong> They challenge our assumptions about shape and colour.</div><div><strong>D</strong> They are easier to appreciate than many other abstract works.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="my-8"><h3 className="text-lg font-semibold mb-4">Questions 31-33</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-H, below.</strong></p><div className="space-y-4 p-4 border rounded-md bg-gray-50"><h4 className="font-semibold text-center">Art and the Brain</h4><p>The discipline of neuroaesthetics aims to bring scientific objectivity to the study of art. Neurological studies of the brain, for example, demonstrate the impact that Impressionist paintings have on our <span className="font-semibold">31</span><Input className={`inline-block w-24 mx-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} />. Alex Forsythe of the University of Liverpool believes many artists give their works the precise degree of <span className="font-semibold">32</span><Input className={`inline-block w-24 mx-1 ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} /> which most appeals to the viewer’s brain. She also observes that pleasing works of art often contain certain repeated <span className="font-semibold">33</span><Input className={`inline-block w-24 mx-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} /> which occur frequently in the natural world.</p></div><div className="border border-gray-300 p-4 mt-4 bg-gray-50 grid grid-cols-4 gap-2 text-center"><p><strong>A</strong> interpretation</p><p><strong>B</strong> complexity</p><p><strong>C</strong> emotions</p><p><strong>D</strong> movements</p><p><strong>E</strong> skill</p><p><strong>F</strong> layout</p><p><strong>G</strong> concern</p><p><strong>H</strong> images</p></div></div><div className="my-8"><h3 className="text-lg font-semibold mb-4">Questions 34-39</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 3?</strong></p><p className="mb-4">In boxes 34-39 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the views of the writer</p><p><strong>NO</strong> if the statement contradicts the views of the writer</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><div className="flex-1"><p>Forsythe’s findings contradicted previous beliefs on the function of ‘fractals’ in art.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><div className="flex-1"><p>Certain ideas regarding the link between ‘mirror neurons’ and art appreciation require further verification.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><div className="flex-1"><p>People’s taste in paintings depends entirely on the current artistic trends of the period.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><div className="flex-1"><p>Scientists should seek to define the precise rules which govern people’s reactions to works of art.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>Art appreciation should always involve taking into consideration the cultural context in which an artist worked.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>It is easier to find meaning in the field of science than in that of art.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="my-8"><h3 className="text-lg font-semibold mb-4">Question 40</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>What would be the most appropriate subtitle for the article?</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> Some scientific insights into how the brain responds to abstract art</div><div><strong>B</strong> Recent studies focusing on the neural activity of abstract artists</div><div><strong>C</strong> A comparison of the neurological bases of abstract and representational art</div><div><strong>D</strong> How brain research has altered public opinion about abstract art</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></CardContent></Card>)}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>{!isTestStarted ? (<p className="text-sm text-blue-600 mt-2">Start the test to enable submission</p>) : (<p className="text-sm text-gray-600 mt-2">Make sure you have answered all questions before submitting</p>)}</div>)}
        {submitted && (<Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4"><div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div><div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div><div className="flex justify-center space-x-4 mt-6"><Button onClick={handleReset} variant="outline">Try Again</Button><Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button></div></div></CardContent></Card>)}
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
                    {Object.entries(answerKeysForDisplay).map(([question, answer]) => {
                        const isCorrect = getAnswerStatus(question) === 'correct';
                        let userAnswer = answers[question] || '(No answer)';
                        if (question === '25' || question === '26') {
                            const userAnswer25 = answers['25'] || ''
                            const userAnswer26 = answers['26'] || ''
                            userAnswer = `${userAnswer25}, ${userAnswer26}`.replace(/^,|,$/g, '').trim() || '(No answer)'
                        }
                        if ( (question === '26' && answers['25']) ) { // Only show pair once
                            return null;
                        }
                    return (
                        <div key={question} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question === '25' ? '25 & 26' : question}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                        <div className="text-sm space-y-1">
                            <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer}</span></div>
                            <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{answer}</span></div>
                        </div>
                        </div>
                    );
                    })}
                </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(answerKeysForDisplay).map(([question, answer]) => (
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

        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div><div className="text-center"><div className="text-3xl font-bold text-red-600">{40 - score}</div><div className="text-sm text-gray-600">Incorrect Answers</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(answerKeysForDisplay).map((questionNumber) => { const isCorrect = getAnswerStatus(questionNumber) === 'correct'; const correctAnswer = answerKeysForDisplay[questionNumber as keyof typeof answerKeysForDisplay]; let userAnswer = answers[questionNumber] || ''; if (questionNumber === '25' || questionNumber === '26') { const userAnswer25 = answers['25'] || ''; const userAnswer26 = answers['26'] || ''; userAnswer = `${userAnswer25}, ${userAnswer26}`.replace(/^,|,$/g, '').trim() || '(No answer)'; if (questionNumber === '26') return null; } return (<div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber === '25' ? '25 & 26' : questionNumber}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div></div></div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        {/* Page View Tracker */}
        <PageViewTracker 
          book="book-11"
          module="reading"
          testNumber={2}
        />
        
        {/* Test Information and Statistics */}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
          <TestStatistics 
            book="book-11"
            module="reading"
            testNumber={2}
          />
          <UserTestHistory 
            book="book-11"
            module="reading"
            testNumber={2}
          />
        </div>

      </div>
    </div>
  )
}