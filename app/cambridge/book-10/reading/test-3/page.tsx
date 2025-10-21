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

export default function Book10ReadingTest3() {
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
    clearAllHighlights() // Clear highlights using the hook
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'ii', '2': 'i', '3': 'v', '4': 'vii', 
    '5': 'TRUE', '6': 'NOT GIVEN', '7': 'NOT GIVEN', '8': 'TRUE', '9': 'NOT GIVEN', '10': 'FALSE',
    '11': 'source of income/industry', '12': 'employer', '13': 'domestic tourism',
    '14': 'C', '15': 'B', '16': 'H', '17': 'B', '18': 'E', 
    '19': 'sun(light)', '20': 'upper', '21': 'dry', '22': 'north', 
    '23': 'FALSE', '24': 'TRUE', '25': 'NOT GIVEN', '26': 'B',
    '27': 'B', '28': 'F', '29': 'I', '30': 'G', '31': 'D',
    '32': 'C', '33': 'A', '34': 'D', '35': 'C',
    '36': 'NO', '37': 'YES', '38': 'NOT GIVEN', '39': 'YES', '40': 'NOT GIVEN'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 10 - Reading Test 3</h1>
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
                        The Context, Meaning and Scope of Tourism
                      </p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> Travel has existed since the beginning of time, when primitive man set out, often traversing great distances in search of game, which provided the food and clothing necessary for his survival. Throughout the course of history, people have travelled for purposes of trade, religious conviction, economic gain, war, migration and other equally compelling motivations. In the Roman era, wealthy aristocrats and high government officials also travelled for pleasure. Seaside resorts located at Pompeii and Herculaneum afforded citizens the opportunity to escape to their vacation villas in order to avoid the summer heat of Rome. Travel, except during the Dark Ages, has continued to grow and, throughout recorded history, has played a vital role in the development of civilisations and their economies.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> Tourism in the mass form as we know it today is a distinctly twentieth-century phenomenon. Historians suggest that the advent of mass tourism began in England during the industrial revolution with the rise of the middle class and the availability of relatively inexpensive transportation. The creation of the commercial airline industry following the Second World War and the subsequent development of the jet aircraft in the 1950s signalled the rapid growth and expansion of international travel. This growth led to the development of a major new industry: tourism. In turn, international tourism became the concern of a number of world governments since it not only provided new employment opportunities but also produced a means of earning foreign exchange.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> Tourism today has grown significantly in both economic and social importance. In most industrialised countries over the past few years the fastest growth has been seen in the area of services. One of the largest segments of the service industry, although largely unrecognised as an entity in some of these countries, is travel and tourism. According to the World Travel and Tourism Council (1992), 'Travel and tourism is the largest industry in the world on virtually any economic measure including value-added capital investment, employment and tax contributions'. In 1992, the industry's gross output was estimated to be $3.5 trillion, over 12 per cent of all consumer spending. The travel and tourism industry is the world's largest employer with almost 130 million jobs, or almost 7 per cent of all employees. This industry is the world's leading industrial contributor, producing over 6 per cent of the world's gross national product and accounting for capital investment in excess of $422 billion in direct, indirect and personal taxes each year. Thus, tourism has a profound impact both on the world economy and, because of the educative effect of travel and the effects on employment, on society itself.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> However, the major problems of the travel and tourism industry that have hidden, or obscured, its economic impact are the diversity and fragmentation of the industry itself. The travel industry includes: hotels, motels and other types of accommodation; restaurants and other food services; transportation services and facilities; amusements, attractions and other leisure facilities; gift shops and a large number of other enterprises. Since many of these businesses also serve local residents, the impact of spending by visitors can easily be overlooked or underestimated. In addition, Meis (1992) points out that the travel and tourism industry involves concepts that have remained amorphous to both analysts and decision makers. Moreover, in all nations this problem has made it difficult for the industry to develop any type of reliable or credible tourism information base in order to estimate the contribution it makes to regional, national and global economies. However, the nature of this very diversity makes travel and tourism ideal vehicles for economic development in a wide variety of countries, regions or communities.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> Once the exclusive province of the wealthy, travel and tourism have become an institutionalised way of life for most of the population. In fact, McIntosh and Goeldner (1990) suggest that tourism has become the largest commodity in international trade for many nations and, for a significant number of other countries, it ranks second or third. For example, tourism is the major source of income in Bermuda, Greece, Italy, Spain, Switzerland and most Caribbean countries. In addition, Hawkins and Ritchie, quoting from data published by the American Express Company, suggest that the travel and tourism industry is the number one ranked employer in the Bahamas, Brazil, Canada, France, (the former) West Germany, Hong Kong, Italy, Jamaica, Japan, Singapore, the United Kingdom and the United States. However, because of problems of definition, which directly affect statistical measurement, it is not possible with any degree of certainty to provide precise, valid or reliable data about the extent of world-wide tourism participation or its economic impact. In many cases, similar difficulties arise when attempts are made to measure domestic tourism.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">Autumn leaves</p>
                    <p className="text-start text-gray-500 italic mb-2">Canadian writer Jay Ingram investigates the mystery of why leaves turn red in the fall</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> One of the most captivating natural events of the year in many areas throughout North America is the turning of the leaves in the fall. The colours are magnificent, but the question of exactly why some trees turn yellow or orange, and others red or purple, is something which has long puzzled scientists.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> Summer leaves are green because they are full of chlorophyll, the molecule that captures sunlight and converts that energy into new building materials for the tree. As fall approaches in the northern hemisphere, the amount of solar energy available declines considerably. For many trees – evergreen conifers being an exception – the best strategy is to abandon photosynthesis* until the spring. So rather than maintaining the now redundant leaves throughout the winter, the tree saves its precious resources and discards them. But before letting its leaves go, the tree dismantles their chlorophyll molecules and ships their valuable nitrogen back into the twigs. As chlorophyll is depleted, other colours that have been dominated by it throughout the summer begin to be revealed. This unmasking explains the autumn colours of yellow and orange, but not the brilliant reds and purples of trees such as the maple or sumac.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> The source of the red is widely known: it is created by anthocyanins, water-soluble plant pigments reflecting the red to blue range of the visible spectrum. They belong to a class of sugar-based chemical compounds also known as flavonoids. What's puzzling is that anthocyanins are actually newly minted, made in the leaves at the same time as the tree is preparing to drop them. But it is hard to make sense of the manufacture of anthocyanins - why should a tree bother making new chemicals in its leaves when it's already scrambling to withdraw and preserve the ones already there?</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> Some theories about anthocyanins have argued that they might act as a chemical defence against attacks by insects or fungi, or that they might attract fruit-eating birds or increase a leaf's tolerance to freezing. However, there are problems with each of these theories, including the fact that leaves are red for such a relatively short period that the expense of energy needed to manufacture the anthocyanins would outweigh any anti-fungal or anti-herbivore activity achieved.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> It has also been proposed that trees may produce vivid red colours to convince herbivorous insects that they are healthy and robust and would be easily able to mount chemical defences against infestation. If insects paid attention to such advertisements, they might be prompted to lay their eggs on a duller, and presumably less resistant host. The flaw in this theory lies in the lack of proof to support it. No one has as yet ascertained whether more robust trees sport the brightest leaves, or whether insects make choices according to colour intensity.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">F</span> Perhaps the most plausible suggestion as to why leaves would go to the trouble of making anthocyanins when they're busy packing up for the winter is the theory known as the 'light screen' hypothesis. It sounds paradoxical, because the idea behind this hypothesis is that the red pigment is made in autumn leaves to protect chlorophyll, the light-absorbing chemical, from too much light. Why does chlorophyll need protection when it is the natural world's supreme light absorber? Why protect chlorophyll at a time when the tree is breaking it down to salvage as much of it as possible?</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">G</span> Chlorophyll, although exquisitely evolved to capture the energy of sunlight, can sometimes be overwhelmed by it, especially in situations of drought, low temperatures, or nutrient deficiency. Moreover, the problem of oversensitivity to light is even more acute in the fall, when the leaf is busy preparing for winter by dismantling its internal machinery. The energy absorbed by the chlorophyll molecules of the unstable autumn leaf is not immediately channelled into useful products and processes, as it would be in an intact summer leaf. The weakened fall leaf then becomes vulnerable to the highly destructive effects of the oxygen created by the excited chlorophyll molecules.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">H</span> Even if you had never suspected that this is what was going on when leaves turn red, there are clues out there. One is straightforward: on many trees, the leaves that are the reddest are those on the side of the tree which gets most sun. Not only that, but the red is brighter on the upper side of the leaf. It has also been recognised for decades that the best conditions for intense red colours are dry, sunny days and cool nights, conditions that nicely match those that make leaves susceptible to excess light. And finally, trees such as maples usually get much redder the more north you travel in the northern hemisphere. It's colder there, they're more stressed, their chlorophyll is more sensitive and it needs more sunblock.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">I</span> What is still not fully understood, however, is why some trees resort to producing red pigments while others don't bother, and simply reveal their orange or yellow hues. Do these trees have other means at their disposal to prevent overexposure to light in autumn? Their story, though not as spectacular to the eye, will surely turn out to be as subtle and as complex.</p>
                    <p className="text-start text-gray-500 italic text-sm mb-2">* photosynthesis: the production of new material from sunlight, water and carbon dioxide</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">Beyond the blue horizon</p>
                  <p className="text-start text-gray-500 italic mb-2">Ancient voyagers who settled the far-flung islands of the Pacific Ocean</p>
                  <p className="text-start text-gray-500 italic mb-2">An important archaeological discovery on the island of Efate in the Pacific archipelago of Vanuatu has revealed traces of an ancient seafaring people, the distant ancestors of today's Polynesians. The site came to light only by chance. An agricultural worker, digging in the grounds of a derelict plantation, scraped open a grave - the first of dozens in a burial ground some 3,000 years old. It is the oldest cemetery ever found in the Pacific islands, and it harbors the remains of an ancient people archaeologists call the Lapita.</p>
                  <p className="text-start text-gray-500 italic mb-2">They were daring blue-water adventurers who used basic canoes to rove across the ocean. But they were not just explorers. They were also pioneers who carried with them everything they would need to build new lives - their livestock, taro seedlings and stone tools. Within the span of several centuries, the Lapita stretched the boundaries of their world from the jungle-clad volcanoes of Papua New Guinea to the loneliest coral outliers of Tonga.</p>
                  <p className="text-start text-gray-500 italic mb-2">The Lapita left precious few clues about themselves, but Efate expands the volume of data available to researchers dramatically. The remains of 62 individuals have been uncovered so far, and archaeologists were also thrilled to find six complete Lapita pots. Other items included a Lapita burial urn with modeled birds arranged on the rim as though peering down at the human remains sealed inside. 'It's an important discovery,' says Matthew Spriggs, professor of archaeology at the Australian National University and head of the international team digging up the site, 'for it conclusively identifies the remains as Lapita.'</p>
                  <p className="text-start text-gray-500 italic mb-2">DNA teased from these human remains may help answer one of the most puzzling questions in Pacific anthropology: did all Pacific islanders spring from one source or many? Was there only one outward migration from a single point in Asia, or several from different points? 'This represents the best opportunity we've had yet,' says Spriggs, 'to find out who the Lapita actually were, where they came from, and who their closest descendants are today.'</p>
                  <p className="text-start text-gray-500 italic mb-2">There is one stubborn question for which archaeology has yet to provide any answers: how did the Lapita accomplish the ancient equivalent of a moon landing, many times over? No-one has found one of their canoes or any rigging, which could reveal how the canoes were sailed. Nor do the oral histories and traditions of later Polynesians offer any insights, for they turn into myths long before they reach as far back in time as the Lapita.</p>
                  <p className="text-start text-gray-500 italic mb-2">'All we can say for certain is that the Lapita had canoes that were capable of ocean voyages, and they had the ability to sail them,' says Geoff Irwin, a professor of archaeology at the University of Auckland. Those sailing skills, he says, were developed and passed down over thousands of years by earlier mariners who worked their way through the archipelagoes of the western Pacific, making short crossings to nearby islands. The real adventure didn't begin, however, until their Lapita descendants sailed out of sight of land, with empty horizons on every side. This must have been as difficult for them as landing on the moon is for us today. Certainly it distinguished them from their ancestors, but what gave them the courage to launch out on such risky voyages?</p>
                  <p className="text-start text-gray-500 italic mb-2">The Lapita's thrust into the Pacific was eastward, against the prevailing trade winds, Irwin notes. Those nagging headwinds, he argues, may have been the key to their success. They could sail out for days into the unknown and assess the area, secure in the knowledge that if they didn't find anything, they could turn about and catch a swift ride back on the trade winds. This is what would have made the whole thing work.' Once out there, skilled seafarers would have detected abundant leads to follow to land: seabirds, coconuts and twigs carried out to sea by the tides, and the afternoon pile-up of clouds on the horizon which often indicates an island in the distance.</p>
                  <p className="text-start text-gray-500 italic mb-2">For returning explorers, successful or not, the geography of their own archipelagoes would have provided a safety net. Without this to go by, overshooting their home ports, getting lost and sailing off into eternity would have been all too easy. Vanuatu, for example, stretches more than 500 miles in a northwest-southeast trend, its scores of intervisible islands forming a backstop for mariners riding the trade winds home.</p>
                  <p className="text-start text-gray-500 italic mb-2">All this presupposes one essential detail, says Atholl Anderson, professor of prehistory at the Australian National University: the Lapita had mastered the advanced art of sailing against the wind. 'And there's no proof they could do any such thing,' Anderson says. 'There has been this assumption they did, and people have built canoes to re-create those early voyages based on that assumption. But nobody has any idea what their canoes looked like or how they were rigged.'</p>
                  <p className="text-start text-gray-500 italic mb-2">Rather than give all the credit to human skill, Anderson invokes the winds of chance. El Niño, the same climate disruption that affects the Pacific today, may have helped scatter the Lapita, Anderson suggests. He points out that climate data obtained from slow-growing corals around the Pacific indicate a series of unusually frequent El Niños around the time of the Lapita expansion. By reversing the regular east-to-west flow of the trade winds for weeks at a time, these 'super El Niños' might have taken the Lapita on long unplanned voyages.</p>
                  <p className="text-start text-gray-500 italic mb-2">However they did it, the Lapita spread themselves a third of the way across the Pacific, then called it quits for reasons known only to them. Ahead lay the vast emptiness of the central Pacific and perhaps they were too thinly stretched to venture farther. They probably never numbered more than a few thousand in total, and in their rapid migration eastward they encountered hundreds of islands - more than 300 in Fiji alone.</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-4</h3><p className="mb-4"><strong>Reading Passage 1 has five paragraphs, A-E.</strong></p><p className="mb-4"><strong>Choose the correct heading for paragraphs B-E from the list of headings below.</strong></p><p className="mb-4 italic">Write the correct number, i-viii, in boxes 1-4 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4><div className="space-y-1"><div><strong>i</strong> Economic and social significance of tourism</div><div><strong>ii</strong> The development of mass tourism</div><div><strong>iii</strong> Travel for the wealthy</div><div><strong>iv</strong> Earning foreign exchange through tourism</div><div><strong>v</strong> Difficulty in recognising the economic effects of tourism</div><div><strong>vi</strong> The contribution of air travel to tourism</div><div><strong>vii</strong> The world impact of tourism</div><div><strong>viii</strong> The history of travel</div></div></div><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><div className="flex items-center gap-4 border border-gray-300 p-2 bg-gray-100 rounded-md"><span className="font-semibold min-w-[20px]">Example</span><div><p>Paragraph A</p></div><span className="font-bold">viii</span></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>Paragraph B</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>Paragraph C</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>Paragraph D</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>Paragraph E</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 5-10</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><p className="mb-4">In boxes 5-10 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>The largest employment figures in the world are found in the travel and tourism industry.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>Tourism contributes over six per cent of the Australian gross national product.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>Tourism has a social impact because it promotes recreation.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>Two main features of the travel and tourism industry make its economic significance difficult to ascertain.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>Visitor spending is always greater than the spending of residents in tourist areas.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><div className="flex-1"><p>It is easy to show statistically how tourism affects individual economies.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 11-13</h3><p className="mb-4"><strong>Complete the sentences below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN THREE WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 11-13 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><div className="flex-1"><p>In Greece, tourism is the most important <Input className={`mt-2 w-full ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/></p></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><div className="flex-1"><p>The travel and tourism industry in Jamaica is the major <Input className={`mt-2 w-full ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/></p></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><div className="flex-1"><p>The problems associated with measuring international tourism are often reflected in the measurement of <Input className={`mt-2 w-full ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/></p></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p className="mb-4"><strong>Reading Passage 2 has nine paragraphs, A-I.</strong></p><p className="mb-4"><strong>Which paragraph contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-I, in boxes 14-18 on your answer sheet.</p><p className="mb-4 italic font-semibold">NB You may use any letter more than once.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><div className="flex-1"><p>a description of the substance responsible for the red colouration of leaves</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><div className="flex-1"><p>the reason why trees drop their leaves in autumn</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><div className="flex-1"><p>some evidence to confirm a theory about the purpose of the red leaves</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><div className="flex-1"><p>an explanation of the function of chlorophyll</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">18</span><div className="flex-1"><p>a suggestion that the red colouration in leaves could serve as a warning signal</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-22</h3><p className="mb-4"><strong>Complete the notes below.</strong></p><p className="mb-4"><strong>Choose ONE WORD ONLY from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 19-22 on your answer sheet.</p><div className="border border-gray-300 p-4 bg-gray-50"><h4 className="font-bold mb-4 text-center">Why believe the 'light screen' hypothesis?</h4><ul className="list-disc pl-6 space-y-2"><li>The most vividly coloured red leaves are found on the side of the tree facing the <strong>19</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>.</li><li>The <strong>20</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> surfaces of leaves contain the most red pigment.</li><li>Red leaves are most abundant when daytime weather conditions are <strong>21</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> and sunny.</li><li>The intensity of the red colour of leaves increases as you go further <strong>22</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>.</li></ul></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23-26</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 2?</strong></p><p className="mb-4">In boxes 23-25 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><div className="flex-1"><p>It is likely that the red pigments help to protect the leaf from freezing temperatures.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><div className="flex-1"><p>The 'light screen' hypothesis would initially seem to contradict what is known about chlorophyll.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><div className="flex-1"><p>Leaves which turn colours other than red are more likely to be damaged by sunlight.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><p className="font-semibold mt-6 mb-4">Question 26</p><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><div className="flex-1"><p>For which of the following questions does the writer offer an explanation?</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> why conifers remain green in winter</p><p><strong>B</strong> how leaves turn orange and yellow in autumn</p><p><strong>C</strong> how herbivorous insects choose which trees to lay their eggs in</p><p><strong>D</strong> why anthocyanins are restricted to certain trees</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p className="mb-4"><strong>Complete the summary using the list of words and phrases, A-J, below.</strong></p><p className="mb-4 italic">Write the correct letter, A-J, in boxes 27-31 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-bold mb-4 text-center">The Efate burial site</h4><p>A 3,000-year-old burial ground of a seafaring people called the Lapita has been found on an abandoned <strong>27</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> on the Pacific island of Efate. The cemetery, which is a significant <strong>28</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>, was uncovered accidentally by an agricultural worker.</p><p>The Lapita explored and colonised many Pacific islands over several centuries. They took many things with them on their voyages including <strong>29</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> and tools.</p><p>The burial ground increases the amount of information about the Lapita available to scientists. A team of researchers, led by Matthew Spriggs from the Australian National University, are helping with the excavation of the site. Spriggs believes the <strong>30</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> which was found at the site is very important since it confirms that the <strong>31</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> found inside are Lapita.</p></div><div className="border border-gray-300 p-4 bg-gray-50"><div className="grid grid-cols-2 gap-2"><div><strong>A</strong> proof</div><div><strong>B</strong> plantation</div><div><strong>C</strong> harbour</div><div><strong>D</strong> bones</div><div><strong>E</strong> data</div><div><strong>F</strong> archaeological discovery</div><div><strong>G</strong> burial urn</div><div><strong>H</strong> source</div><div><strong>I</strong> animals</div><div><strong>J</strong> maps</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-35</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter in boxes 32-35 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><div className="flex-1"><p>According to the writer, there are difficulties explaining how the Lapita accomplished their journeys because</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> the canoes that have been discovered offer relatively few clues.</p><p><strong>B</strong> archaeologists have shown limited interest in this area of research.</p><p><strong>C</strong> little information relating to this period can be relied upon for accuracy.</p><p><strong>D</strong> technological advances have altered the way such achievements are viewed.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">33</span><div className="flex-1"><p>According to the sixth paragraph, what was extraordinary about the Lapita?</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> They sailed beyond the point where land was visible.</p><p><strong>B</strong> Their cultural heritage discouraged the expression of fear.</p><p><strong>C</strong> They were able to build canoes that withstood ocean voyages.</p><p><strong>D</strong> Their navigational skills were passed on from one generation to the next.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><div className="flex-1"><p>What does 'This' refer to in the seventh paragraph?</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> the Lapita's seafaring talent</p><p><strong>B</strong> the Lapita's ability to detect signs of land</p><p><strong>C</strong> the Lapita's extensive knowledge of the region</p><p><strong>D</strong> the Lapita's belief they would be able to return home</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><div className="flex-1"><p>According to the eighth paragraph, how was the geography of the region significant?</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> It played an important role in Lapita culture.</p><p><strong>B</strong> It meant there were relatively few storms at sea.</p><p><strong>C</strong> It provided a navigational aid for the Lapita.</p><p><strong>D</strong> It made a large number of islands habitable.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36-40</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 3?</strong></p><p className="mb-4 italic">In boxes 36-40 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the views of the writer</p><p><strong>NO</strong> if the statement contradicts the views of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><div className="flex-1"><p>It is now clear that the Lapita could sail into a prevailing wind.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><div className="flex-1"><p>Extreme climate conditions may have played a role in Lapita migration.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>The Lapita learnt to predict the duration of El Niños.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>It remains unclear why the Lapita halted their expansion across the Pacific.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>It is likely that the majority of Lapita settled on Fiji.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
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
        {/* Analytics Components */}
        <PageViewTracker 
          book="book-10" 
          module="reading" 
          testNumber={3}
        />
        
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <TestStatistics 
            book="book-10"
            module="reading"
            testNumber={3}
          />
          
          <UserTestHistory 
            book="book-10"
            module="reading"
            testNumber={3}
          />
        </div>

                </div>
    </div>
  )
}

      </div>
    </div>
  )
}