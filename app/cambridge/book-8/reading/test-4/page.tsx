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

export default function Book8ReadingTest4() {
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
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'vii',
    '2': 'i',
    '3': 'v',
    '4': 'ii',
    '5': 'viii',
    '6': 'YES',
    '7': 'NO',
    '8': 'NOT GIVEN',
    '9': 'NO',
    '10': 'B',
    '11': 'C',
    '12': 'A',
    '13': 'C',
    '14': 'B',
    '15': 'A',
    '16': 'D',
    '17': 'D',
    '18': 'NOT GIVEN',
    '19': 'YES',
    '20': 'NO',
    '21': 'YES',
    '22': 'D',
    '23': 'H',
    '24': 'C',
    '25': 'E',
    '26': 'B',
    '27': 'TRUE',
    '28': 'NOT GIVEN',
    '29': 'TRUE',
    '30': 'FALSE',
    '31': 'A',
    '32': 'C',
    '33': 'B',
    '34': 'D',
    '35': 'A',
    '36': 'D',
    '37': 'heat',
    '38': 'leaf litter',
    '39': 'screen',
    '40': 'alcohol'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 8 - Reading Test 4</h1>
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
                    <h3 className="text-center font-bold">LAND OF THE RISING SUM</h3>
                    <p><span className="font-semibold">A</span> Japan has a significantly better record in terms of average mathematical attainment than England and Wales. Large sample international comparisons of pupils' attainments since the 1960s have established that not only did Japanese pupils at age 13 have better scores of average attainment, but there was also a larger proportion of 'low' attainers in England, where, incidentally, the variation in attainment scores was much greater. The percentage of Gross National Product spent on education is reasonably similar in the two countries, so how is this higher and more consistent attainment in maths achieved?</p>
                    <p><span className="font-semibold">B</span> Lower secondary schools in Japan cover three school years, from the seventh grade (age 13) to the ninth grade (age 15). Virtually all pupils at this stage attend state schools: only 3 per cent are in the private sector. Schools are usually modern in design, set well back from the road and spacious inside. Classrooms are large and pupils sit at single desks in rows. Lessons last for a standardised 50 minutes and are always followed by a 10-minute break, which gives the pupils a chance to let off steam. Teachers begin with a formal address and mutual bowing, and then concentrate on whole-class teaching.Classes are large – usually about 40 – and are unstreamed. Pupils stay in the same class for all lessons throughout the school and develop considerable class identity and loyalty. Pupils attend the school in their own neighbourhood, which in theory removes ranking by school. In practice in Tokyo, because of the relative concentration of schools, there is some competition to get into the 'better' school in a particular area.</p>
                    <p><span className="font-semibold">C</span> Traditional ways of teaching form the basis of the lesson and the remarkably quiet classes take their own notes of the points made and the examples demonstrated. Everyone has their own copy of the textbook supplied by the central education authority, Monbusho, as part of the concept of free compulsory education up to the age of 15. These textbooks are, on the whole, small, presumably inexpensive to produce, but well set out and logically developed. (One teacher was particularly keen to introduce colour and pictures into maths textbooks: he felt this would make them more accessible to pupils brought up in a cartoon culture.) Besides approving textbooks, Monbusho also decides the highly centralised national curriculum and how it is to be delivered.</p>
                    <p><span className="font-semibold">D</span> Lessons all follow the same pattern. At the beginning, the pupils put solutions to the homework on the board, then the teachers comment, correct or elaborate as necessary. Pupils mark their own homework; this is an important principle in Japanese schooling as it enables pupils to see where and why they made a mistake, so that these can be avoided in future. No one minds mistakes or ignorance as long as you are prepared to learn from them. After the homework has been discussed, the teacher explains the topic of the lesson, slowly and with a lot of repetition and elaboration. Examples are demonstrated on the board; questions from the textbook are worked through first with the class, and then the class is set questions from the textbook to do individually. Only rarely are supplementary worksheets distributed in a maths class. The impression is that the logical nature of the textbooks and their comprehensive coverage of different types of examples, combined with the relative homogeneity of the class, renders work sheets unnecessary. At this point, the teacher would circulate and make sure that all the pupils were coping well.</p>
                    <p><span className="font-semibold">E</span> It is remarkable that large classes are kept together for maths throughout all their compulsory schooling from 6 to 15. Teachers say that they give individual help at the end of a lesson or after school, setting extra work if necessary. In observed lessons, any strugglers would be assisted by the teacher or quietly seek help from their neighbour. Carefully fostered class identity makes pupils keen to help each other - anyway, it is in their interests to do so, as the class progresses together. This scarcely seems adequate help to enable slow learners to keep up. However, the Japanese attitude towards education runs along the lines of 'if you work hard enough, you can do almost anything'. Parents are kept closely informed of their children's progress and will play a part in helping their children to keep up with class, sending them to 'Juku' (private evening tuition) if extra help is needed and encouraging them to work harder. It seems to work, at least for 95 per cent of the school population.</p>
                    <p><span className="font-semibold">F</span> So what are the major contributing factors in the success of maths teaching? Clearly, attitudes are important. Education is valued greatly in Japanese culture; maths is recognised as an important compulsory subject throughout schooling; and the emphasis is on hard work coupled with a focus on accuracy. Other relevant points relate to the supportive attitude of a class towards slower pupils, the lack of competition within a class, and the positive emphasis on learning for oneself and improving one's own standard. And the view of repetitively boring lessons and learning the facts by heart, which is sometimes quoted in relation to Japanese classes, may be unfair and unjustified. No poor maths lessons were observed. They were mainly good and one or two were inspirational.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-center font-bold">Biological control of pests</h3>
                    <p>The continuous and reckless use of synthetic chemicals for the control of pests which pose a threat to agricultural crops and human health is proving to be counter-productive. Apart from engendering widespread ecological disorders, pesticides have contributed to the emergence of a new breed of chemical-resistant, highly lethal superbugs.</p>
                    <p>According to a recent study by the Food and Agriculture Organisation (FAO), more than 300 species of agricultural pests have developed resistance to a wide range of potent chemicals. Not to be left behind are the disease-spreading pests, about 100 species of which have become immune to a variety of insecticides now in use.</p>
                    <p>One glaring disadvantage of pesticides' application is that, while destroying harmful pests, they also wipe out many useful non-targeted organisms, which keep the growth of the pest population in check. This results in what agroecologists call the 'treadmill syndrome'. Because of their tremendous breeding potential and genetic diversity, many pests are known to withstand synthetic chemicals and bear offspring with a built-in resistance to pesticides.</p>
                    <p>The havoc that the 'treadmill syndrome' can bring about is well illustrated by what happened to cotton farmers in Central America. In the early 1940s, basking in the glory of chemical-based intensive agriculture, the farmers avidly took to pesticides as a sure measure to boost crop yield. The insecticide was applied eight times a year in the mid-1940s, rising to 28 in a season in the mid-1950s, following the sudden proliferation of three new varieties of chemical-resistant pests.</p>
                    <p>By the mid-1960s, the situation took an alarming turn with the outbreak of four more new pests, necessitating pesticide spraying to such an extent that 50% of the financial outlay on cotton production was accounted for by pesticides. In the early 1970s, the spraying frequently reached 70 times a season as the farmers were pushed to the wall by the invasion of genetically stronger insect species.</p>
                    <p>Most of the pesticides in the market today remain inadequately tested for properties that cause cancer and mutations as well as for other adverse effects on health, says a study by United States environmental agencies. The United States National Resource Defense Council has found that DDT was the most popular of a long list of dangerous chemicals in use.</p>
                    <p>In the face of the escalating perils from indiscriminate applications of pesticides, a more effective and ecologically sound strategy of biological control, involving the selective use of natural enemies of the pest population, is fast gaining popularity - though, as yet, it is a new field with limited potential. The advantage of biological control in contrast to other methods is that it provides a relatively low-cost, perpetual control system with a minimum of detrimental side-effects. When handled by experts, bio-control is safe, non-polluting and self-dispersing.</p>
                    <p>The Commonwealth Institute of Biological Control (CIBC) in Bangalore, with its global network of research laboratories and field stations, is one of the most active, non-commercial research agencies engaged in pest control by setting natural predators against parasites. CIBC also serves as a clearing-house for the export and import of biological agents for pest control world-wide.</p>
                    <p>CIBC successfully used a seed-feeding weevil, native to Mexico, to control the obnoxious parthenium weed, known to exert devious influence on agriculture and human health in both India and Australia. Similarly the Hyderabad-based Regional Research Laboratory (RRL), supported by CIBC, is now trying out an Argentinian weevil for the eradication of water hyacinth, another dangerous weed, which has become a nuisance in many parts of the world. According to Mrs Kaiser Jamil of RRL, 'The Argentinian weevil does not attack any other plant and a pair of adult bugs could destroy the weed in 4-5 days.' CIBC is also perfecting the technique for breeding parasites that prey on 'disapene scale' insects - notorious defoliants of fruit trees in the US and India.</p>
                    <p>How effectively biological control can be pressed into service is proved by the following examples. In the late 1960s, when Sri Lanka's flourishing coconut groves were plagued by leaf-mining hispides, a larval parasite imported from Singapore brought the pest under control. A natural predator indigenous to India, Neodumetia sangawani, was found useful in controlling the Rhodes grass-scale insect that was devouring forage grass in many parts of the US. By using Neochetina bruci, a beetle native to Brazil, scientists at Kerala Agricultural University freed a 12-kilometre-long canal from the clutches of the weed Salvinia molesta, popularly called 'African Payal' in Kerala. About 30,000 hectares of rice fields in Kerala are infested by this weed.</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Collecting Ant Specimens</h3>
                  <p>Collecting ants can be as simple as picking up stray ones and placing them in a glass jar, or as complicated as completing an exhaustive survey of all species present in an area and estimating their relative abundances. The exact method used will depend on the final purpose of the collections. For taxonomy, or classification, long series, from a single nest, which contain all castes (workers, including majors and minors, and, if present, queens and males) are desirable, to allow the determination of variation within species. For ecological studies, the most important factor is collecting identifiable samples of as many of the different species present as possible. Unfortunately, these methods are not always compatible. The taxonomist sometimes overlooks whole species in favour of those groups currently under study, while the ecologist often collects only a limited number of specimens of each species, thus reducing their value for taxonomic investigations.</p>
                  <p>To collect as wide a range of species as possible, several methods must be used. These include hand collecting, using baits to attract the ants, ground litter sampling, and the use of pitfall traps. Hand collecting consists of searching for ants everywhere they are likely to occur. This includes on the ground, under rocks, logs or other objects on the ground, in rotten wood on the ground or on trees, in vegetation, on tree trunks and under bark. When possible, collections should be made from nests or foraging columns and at least 20 to 25 individuals collected. This will ensure that all individuals are of the same species, and so increase their value for detailed studies. Since some species are largely nocturnal, collecting should not be confined to daytime. Specimens are collected using an aspirator (often called a pooter), forceps, a fine, moistened paint brush, or fingers, if the ants are known not to sting. Individual insects are placed in plastic or glass tubes (1.5–3.0 ml capacity for small ants, 5–8 ml for larger ants) containing 75% to 95% ethanol. Plastic tubes with secure tops are better than glass because they are lighter, and do not break as easily if mishandled.</p>
                  <p>Baits can be used to attract and concentrate foragers. This often increases the number of individuals collected and attracts species that are otherwise elusive. Sugars and meats or oils will attract different species and a range should be utilised. These baits can be placed either on the ground or on the trunks of trees or large shrubs. When placed on the ground, baits should be situated on small paper cards or other flat, light-coloured surfaces, or in test-tubes or vials. This makes it easier to spot ants and to collect them before they can escape into the surrounding leaf litter.</p>
                  <p>Many ants are small and forage primarily in the layer of leaves and other debris on the ground. Collecting these species by hand can be difficult. One of the most successful ways to collect them is to gather the leaf litter in which they are foraging and extract the ants from it. This is most commonly done by placing leaf litter on a screen over a large funnel, often under some heat. As the leaf litter dries from above, ants (and other animals) move downward and eventually fall out the bottom and are collected in alcohol placed below the funnel. This method works especially well in rain forests and marshy areas. A method of improving the catch when using a funnel is to sift the leaf litter through a coarse screen before placing it above the funnel. This will concentrate the litter and remove larger leaves and twigs. It will also allow more litter to be sampled when using a limited number of funnels.</p>
                  <p>The pitfall trap is another commonly used tool for collecting ants. A pitfall trap can be any small container placed in the ground with the top level with the surrounding surface and filled with a preservative. Ants are collected when they fall into the trap while foraging. The diameter of the traps can vary from about 18 mm to 10 cm and the number used can vary from a few to several hundred. The size of the traps used is influenced largely by personal preference (although larger sizes are generally better), while the number will be determined by the study being undertaken. The preservative used is usually ethylene glycol or propylene glycol, as alcohol will evaporate quickly and the traps will dry out. One advantage of pitfall traps is that they can be used to collect over a period of time with minimal maintenance and intervention. One disadvantage is that some species are not collected as they either avoid the traps or do not commonly encounter them while foraging.</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-5</h3><p className="mb-4"><strong>Reading Passage 1 has six sections, A-F. Choose the correct heading for sections B-F from the list of headings below.</strong></p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1"><div><strong>i</strong> The influence of Monbusho</div><div><strong>ii</strong> Helping less successful students</div><div><strong>iii</strong> The success of compulsory education</div><div><strong>iv</strong> Research findings concerning achievements in maths</div><div><strong>v</strong> The typical format of a maths lesson</div><div><strong>vi</strong> Comparative expenditure on maths education</div><div><strong>vii</strong> Background to middle-years education in Japan</div><div><strong>viii</strong> The key to Japanese successes in maths education</div><div><strong>ix</strong> The role of homework correction</div></div>
                  </div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">Example</span><p>Section A</p><span className="font-bold">iv</span></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><p>Section B</p><Input className="mt-2 max-w-[100px]" value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><p>Section C</p><Input className="mt-2 max-w-[100px]" value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><p>Section D</p><Input className="mt-2 max-w-[100px]" value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><p>Section E</p><Input className="mt-2 max-w-[100px]" value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><p>Section F</p><Input className="mt-2 max-w-[100px]" value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6-9</h3><p className="mb-4"><strong>Do the following statements agree with the claims of the writer in Reading Passage 1?</strong></p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the claims of the writer</p><p><strong>NO</strong> if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><p>There is a wider range of achievement amongst English pupils studying maths than amongst their Japanese counterparts.</p><Input className="mt-2 max-w-[150px]" value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><p>The percentage of Gross National Product spent on education generally reflects the level of attainment in mathematics.</p><Input className="mt-2 max-w-[150px]" value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><p>Private schools in Japan are more modern and spacious than state-run lower secondary schools.</p><Input className="mt-2 max-w-[150px]" value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><p>Teachers mark homework in Japanese schools.</p><Input className="mt-2 max-w-[150px]" value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 10-13</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><div><p>Maths textbooks in Japanese schools are</p><p>A cheap for pupils to buy.</p><p>B well organised and adapted to the needs of the pupils.</p><p>C written to be used in conjunction with TV programmes.</p><p>D not very popular with many Japanese teachers.</p><Input className="mt-2 max-w-[100px]" value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><div><p>When a new maths topic is introduced,</p><p>A students answer questions on the board.</p><p>B students rely entirely on the textbook.</p><p>C it is carefully and patiently explained to the students.</p><p>D it is usual for students to use extra worksheets.</p><Input className="mt-2 max-w-[100px]" value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><div><p>How do schools deal with students who experience difficulties?</p><p>A They are given appropriate supplementary tuition.</p><p>B They are encouraged to copy from other pupils.</p><p>C They are forced to explain their slow progress.</p><p>D They are placed in a mixed-ability class.</p><Input className="mt-2 max-w-[100px]" value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><div><p>Why do Japanese students tend to achieve relatively high rates of success in maths?</p><p>A It is a compulsory subject in Japan.</p><p>B They are used to working without help from others.</p><p>C Much effort is made and correct answers are emphasised.</p><p>D There is a strong emphasis on repetitive learning.</p><Input className="mt-2 max-w-[100px]" value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><div><p>The use of pesticides has contributed to</p><p>A a change in the way ecologies are classified by agroecologists.</p><p>B an imbalance in many ecologies around the world.</p><p>C the prevention of ecological disasters in some parts of the world.</p><p>D an increase in the range of ecologies which can be usefully farmed.</p><Input className="mt-2 max-w-[100px]" value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><div><p>The Food and Agriculture Organisation has counted more than 300 agricultural pests which</p><p>A are no longer responding to most pesticides in use.</p><p>B can be easily controlled through the use of pesticides.</p><p>C continue to spread disease in a wide range of crops.</p><p>D may be used as part of bio-control's replacement of pesticides.</p><Input className="mt-2 max-w-[100px]" value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><div><p>Cotton farmers in Central America began to use pesticides</p><p>A because of an intensive government advertising campaign.</p><p>B in response to the appearance of new varieties of pest.</p><p>C as a result of changes in the seasons and the climate.</p><p>D to ensure more cotton was harvested from each crop.</p><Input className="mt-2 max-w-[100px]" value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><div><p>By the mid-1960s, cotton farmers in Central America found that pesticides</p><p>A were wiping out 50% of the pests plaguing the crops.</p><p>B were destroying 50% of the crops they were meant to protect.</p><p>C were causing a 50% increase in the number of new pests reported.</p><p>D were costing 50% of the total amount they spent on their crops.</p><Input className="mt-2 max-w-[100px]" value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-21</h3><p className="mb-4"><strong>Do the following statements agree with the claims of the writer in Reading Passage 2?</strong></p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the claims of the writer</p><p><strong>NO</strong> if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4">
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">18</span><p>Disease-spreading pests respond more quickly to pesticides than agricultural pests do.</p><Input className="mt-2 max-w-[150px]" value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><p>A number of pests are now born with an innate immunity to some pesticides.</p><Input className="mt-2 max-w-[150px]" value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><p>Biological control entails using synthetic chemicals to try and change the genetic make-up of the pests' offspring.</p><Input className="mt-2 max-w-[150px]" value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><p>Bio-control is free from danger under certain circumstances.</p><Input className="mt-2 max-w-[150px]" value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 22-26</h3><p className="mb-4"><strong>Complete each sentence with the correct ending, A-I, below.</strong></p><div className="space-y-4 mb-4">
                    <p>22. Disapene scale insects feed on <Input className="w-16 ml-2" value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting}/></p>
                    <p>23. Neodumetia sangawani ate <Input className="w-16 ml-2" value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting}/></p>
                    <p>24. Leaf-mining hispides blighted <Input className="w-16 ml-2" value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting}/></p>
                    <p>25. An Argentinian weevil may be successful in wiping out <Input className="w-16 ml-2" value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting}/></p>
                    <p>26. Salvinia molesta plagues <Input className="w-16 ml-2" value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting}/></p>
                  </div><div className="border p-4 grid grid-cols-2 gap-2">
                    <span>A forage grass.</span><span>B rice fields.</span><span>C coconut trees.</span><span>D fruit trees.</span><span>E water hyacinth.</span><span>F parthenium weed.</span><span>G Brazilian beetles.</span><span>H grass-scale insects.</span><span>I larval parasites.</span>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-30</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 3?</strong></p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><p>Taxonomic research involves comparing members of one group of ants.</p><Input className="mt-2 max-w-[150px]" value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><p>New species of ant are frequently identified by taxonomists.</p><Input className="mt-2 max-w-[150px]" value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><p>Range is the key criterion for ecological collections.</p><Input className="mt-2 max-w-[150px]" value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><p>A single collection of ants can generally be used for both taxonomic and ecological purposes.</p><Input className="mt-2 max-w-[150px]" value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 31-36</h3><p className="mb-4"><strong>Classify the following statements as referring to...</strong></p><div className="ml-4 mb-4"><p><strong>A</strong> hand collecting</p><p><strong>B</strong> using bait</p><p><strong>C</strong> sampling ground litter</p><p><strong>D</strong> using a pitfall trap</p></div><div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">31</span><p>It is preferable to take specimens from groups of ants.</p><Input className="mt-2 max-w-[100px]" value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><p>It is particularly effective for wet habitats.</p><Input className="mt-2 max-w-[100px]" value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">33</span><p>It is a good method for species which are hard to find.</p><Input className="mt-2 max-w-[100px]" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><p>Little time and effort is required.</p><Input className="mt-2 max-w-[100px]" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><p>Separate containers are used for individual specimens.</p><Input className="mt-2 max-w-[100px]" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><p>Non-alcoholic preservative should be used.</p><Input className="mt-2 max-w-[100px]" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting}/></div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p className="mb-4"><strong>Label the diagram below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><div className="text-center mb-6"><h4 className="font-semibold mb-4">One method of collecting ants</h4><div className="border border-gray-300 p-4 bg-gray-50"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/reading/test4/diagram.png" alt="Ant collection diagram" className="mx-auto max-w-full h-auto"/></div></div>
                    <div className="space-y-4">
                        <p>37. some __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                        <p>38. a __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                        <p>39. a __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
                        <p>40. __________________</p><Input className="mt-2 w-full max-w-sm" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting}/>
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
          testNumber={4}
        />
        
        {/* Test Information and Statistics */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics 
            book="book-8"
            module="reading"
            testNumber={4}
          />
          <UserTestHistory 
            book="book-8"
            module="reading"
            testNumber={4}
          />
        </div>

      </div>
    </div>
  )
}