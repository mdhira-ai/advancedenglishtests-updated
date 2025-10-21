

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching, checkIndividualAnswer, calculateTestScore } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'

export default function Book8ReadingTest1() {
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
        book: 'book-8',
        module: 'reading',
        testNumber: 1,
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
    '1': 'D', '2': 'B', '3': 'F', '4': 'E', '5': 'B', '6': 'F', '7': 'D', '8': 'A',
    '9': '(ship\'s) anchor/(an/the) anchor', '10': '(escape) wheel', '11': 'tooth', '12': '(long) pendulum', '13': 'second',
    '14': 'ii', '15': 'iii', '16': 'v', '17': 'iv', '18': 'viii', '19': 'vii',
    '20': 'FALSE', '21': 'FALSE', '22': 'NOT GIVEN', '23': 'TRUE', '24': 'TRUE', '25': 'FALSE', '26': 'TRUE',
    '27': 'E', '28': 'B', '29': 'A', '30': 'F', '31': 'sender', '32': 'picture/image', '33': 'receiver',
    '34': 'sensory leakage', '35': '(outright) fraud', '36': 'computers', '37': 'human involvement',
    '38': 'meta-analysis', '39': 'lack of consistency', '40': 'big/large enough'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page View Tracker */}
        <PageViewTracker book="book-8" module="reading" testNumber={1} />
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 8 - Reading Test 1</h1>
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
                     <p className="text-start text-gray-500 italic mb-2">
                        Our conception of time depends on the way we measure it
                      </p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> According to archaeological evidence, at least 5,000 years ago, and long before the advent of the Roman Empire, the Babylonians began to measure time, introducing calendars to co-ordinate communal activities, to plan the shipment of goods and, in particular, to regulate planting and harvesting. They based their calendars on three natural cycles: the solar day, marked by the successive periods of light and darkness as the earth rotates on its axis; the lunar month, following the phases of the moon as it orbits the earth; and the solar year, defined by the changing seasons that accompany our planet's revolution around the sun.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> Before the invention of artificial light, the moon had greater social impact. And, for those living near the equator in particular, its waxing and waning was more conspicuous than the passing of the seasons. Hence, the calendars that were developed at the lower latitudes were influenced more by the lunar cycle than by the solar year. In more northern climes, however, where seasonal agriculture was practised, the solar year became more crucial. As the Roman Empire expanded northward, it organised its activity chart for the most part around the solar year.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> Centuries before the Roman Empire, the Egyptians had formulated a municipal calendar having 12 months of 30 days, with five days added to approximate the solar year. Each period of ten days was marked by the appearance of special groups of stars called decans. At the rise of the star Sirius just before sunrise, which occurred around the all-important annual flooding of the Nile, 12 decans could be seen spanning the heavens. The cosmic significance the Egyptians placed in the 12 decans led them to develop a system in which each interval of darkness (and later, each interval of daylight) was divided into a dozen equal parts. These periods became known as temporal hours because their duration varied according to the changing length of days and nights with the passing of the seasons. Summer hours were long, winter ones short; only at the spring and autumn equinoxes were the hours of daylight and darkness equal. Temporal hours, which were first adopted by the Greeks and then the Romans, who disseminated them through Europe, remained in use for more than 2,500 years.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> In order to track temporal hours during the day, inventors created sundials, which indicate time by the length or direction of the sun's shadow. The sundial's counterpart, the water clock, was designed to measure temporal hours at night. One of the first water clocks was a basin with a small hole near the bottom through which the water dripped out. The falling water level denoted the passing hour as it dipped below hour lines inscribed on the inner surface. Although these devices performed satisfactorily around the Mediterranean, they could not always be depended on in the cloudy and often freezing weather of northern Europe.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> The advent of the mechanical clock meant that although it could be adjusted to maintain temporal hours, it was naturally suited to keeping equal ones. With these, however, arose the question of when to begin counting, and so, in the early 14th century, a number of systems evolved. The schemes that divided the day into 24 equal parts varied according to the start of the count: Italian hours began at sunset, Babylonian hours at sunrise, astronomical hours at midday and 'great clock' hours, used for some large public clocks in Germany, at midnight. Eventually these were superseded by 'small clock', or French, hours, which split the day into two 12-hour periods commencing at midnight.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">F</span> The earliest recorded weight-driven mechanical clock was built in 1283 in Bedfordshire in England. The revolutionary aspect of this new timekeeper was neither the descending weight that provided its motive force nor the gear wheels (which had been around for at least 1,300 years) that transferred the power; it was the part called the escapement. In the early 1400s came the invention of the coiled spring or fusee which maintained constant force to the gear wheels of the timekeeper despite the changing tension of its mainspring. By the 16th century, a pendulum clock had been devised, but the pendulum swung in a large arc and thus was not very efficient.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">G</span> To address this, a variation on the original escapement was invented in 1670, in England. It was called the anchor escapement, which was a lever-based device shaped like a ship's anchor. The motion of a pendulum rocks this device so that it catches and then releases each tooth of the escape wheel, in turn allowing it to turn a precise amount. Unlike the original form used in early pendulum clocks, the anchor escapement permitted the pendulum to travel in a very small arc. Moreover, this invention allowed the use of a long pendulum which could beat once a second and thus led to the development of a new floor-standing case design, which became known as the grandfather clock.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">H</span> Today, highly accurate timekeeping instruments set the beat for most electronic devices. Nearly all computers contain a quartz-crystal clock to regulate their operation. Moreover, not only do time signals beamed down from Global Positioning System satellites calibrate the functions of precision navigation equipment, they do so as well for mobile phones, instant stock-trading systems and nationwide power-distribution grids. So integral have these time-based technologies become to day-to-day existence that our dependency on them is recognised only when they fail to work.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> An accident that occurred in the skies over the Grand Canyon in 1956 resulted in the establishment of the Federal Aviation Administration (FAA) to regulate and oversee the operation of aircraft in the skies over the United States, which were becoming quite congested. The resulting structure of air traffic control has greatly increased the safety of flight in the United States, and similar air traffic control procedures are also in place over much of the rest of the world.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> Rudimentary air traffic control (ATC) existed well before the Grand Canyon disaster. As early as the 1920s, the earliest air traffic controllers manually guided aircraft in the vicinity of the airports, using lights and flags, while beacons and flashing lights were placed along cross-country routes to establish the earliest airways. However, this purely visual system was useless in bad weather, and, by the 1930s, radio communication was coming into use for ATC. The first region to have something approximating today’s ATC was New York City, with other major metropolitan areas following soon after.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> In the 1940s, ATC centres could and did take advantage of the newly developed radar and improved radio communication brought about by the Second World War, but the system remained rudimentary. It was only after the creation of the FAA that full-scale regulation of America’s airspace took place, and this was fortuitous, for the advent of the jet engine suddenly resulted in a large number of very fast planes, reducing pilots’ margin of error and practically demanding some set of rules to keep everyone well separated and operating safely in the air.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> Many people think that ATC consists of a row of controllers sitting in front of their radar screens at the nation’s airports telling arriving and departing traffic what to do. This is a very incomplete part of the picture. The FAA realised that the airspace over the United States would at any time have many different kinds of planes, flying for many different purposes, in a variety of weather conditions, and the same kind of structure was needed to accommodate all of them.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> To meet this challenge, the following elements were put into effect. First, ATC extends over virtually the entire United States. In general, from 365m above the ground and higher, the entire country is blanketed by controlled airspace. In certain areas, mainly near airports, controlled airspace extends down to 215m above the ground, and, in the immediate vicinity of an airport, all the way down to the surface. Controlled airspace is that space in which FAA regulations apply. Elsewhere, in uncontrolled airspace, pilots are bound by fewer regulations. In this way, the recreational pilot who simply wishes to go flying for a while without all the restrictions imposed by the FAA has only to stay in uncontrolled airspace, below 365m, while the pilot who does want the protection afforded by ATC can easily enter the controlled airspace.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">F</span> The FAA then recognised two types of operating environments. In good meteorological conditions, flying would be permitted under Visual Flight Rules (VFR), which suggests a strong reliance on visual cues to maintain an acceptable level of safety. Poor visibility necessitated a set of Instrumental Flight Rules (IFR), under which the pilot relied on altitude and navigational information provided by the plane's instrument panel to fly safely. On a clear day, a pilot in controlled airspace can choose a VFR or IFR flight plan, and the FAA regulations were devised in a way which accommodates both VFR and IFR operations in the same airspace. However, a pilot can only choose to fly IFR if they possess an instrument rating which is above and beyond the basic pilot's licence that must also be held.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">G</span> Controlled airspace is divided into several different types, designated by letters of the alphabet. Uncontrolled airspace is designated Class F, while controlled airspace below 5,490m above sea level and not in the vicinity of an airport is Class E. All airspace above 5,490m is designated Class A. The reason for the division of Class E and Class A airspace stems from the type of planes operating in them. Generally, Class E airspace is where one finds general aviation aircraft (few of which can climb above 5,490m anyway), and commercial turboprop aircraft. Above 5,490m is the realm of the heavy jets, since jet engines operate more efficiently at higher altitudes. The difference between Class E and A airspace is that in Class A, all operations are IFR, and pilots must be instrument-rated, that is, skilled and licensed in aircraft instrumentation. This is because ATC control of the entire space is essential. Three other types of airspace, Classes D, C and B, govern the vicinity of airports. These correspond roughly to small municipal, medium-sized metropolitan and major metropolitan airports respectively, and encompass an increasingly rigorous set of regulations. For example, all a VFR pilot has to do to enter Class C airspace is establish two-way radio contact with ATC. No explicit permission from ATC to enter is needed, although the pilot must continue to obey all regulations governing VFR flight. To enter Class B airspace, such as on approach to a major metropolitan airport, an explicit ATC clearance is required. The private pilot who cruises without permission into this airspace risks losing their licence.</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-500 italic">TELEPATHY</p>
                  <p className="text-start text-gray-500 italic mb-2">Can human beings communicate by thought alone? For more than a century the issue of telepathy has divided the scientific community, and even today it still sparks bitter controversy among top academics.</p>
                  <p className="text-start text-gray-500 italic mb-2">Since the 1970s, parapsychologists at leading universities and research institutes around the world have risked the derision of sceptical colleagues by putting the various claims for telepathy to the test in dozens of rigorous scientific studies. The results and their implications are dividing even the researchers who uncovered them.</p>
                  <p className="text-start text-gray-500 italic mb-2">Some researchers say the results constitute compelling evidence that telepathy is genuine. Other parapsychologists believe the field is on the brink of collapse, having tried to produce definitive scientific proof and failed. Sceptics and advocates alike do concur on one issue, however: that the most impressive evidence so far has come from the so-called 'ganzfeld' experiments, a German term that means 'whole field'. Reports of telepathic experiences had by people during meditation led parapsychologists to suspect that telepathy might involve 'signals' passing between people that were so faint that they were usually swamped by normal brain activity. In this case, such signals might be more easily detected by those experiencing meditation-like tranquillity in a relaxing 'whole field' of light, sound and warmth.</p>
                  <p className="text-start text-gray-500 italic mb-2">The ganzfeld experiment tries to recreate these conditions with participants sitting in soft reclining chairs in a sealed room, listening to relaxing sounds while their eyes are covered with special filters letting in only soft pink light. In early ganzfeld experiments, the telepathy test involved identification of a picture chosen from a random selection of four taken from a large image bank. The idea was that a person acting as a 'sender' would attempt to beam the image over to the 'receiver' relaxing in the sealed room. Once the session was over, this person was asked to identify which of the four images had been used. Random guessing would give a hit-rate of 25 per cent; if telepathy is real, however, the hit-rate would be higher. In 1982, the results from the first ganzfeld studies were analysed by one of its pioneers, the American parapsychologist Charles Honorton. They pointed to typical hit-rates of better than 30 per cent - a small effect, but one which statistical tests suggested could not be put down to chance.</p>
                  <p className="text-start text-gray-500 italic mb-2">The implication was that the ganzfeld method had revealed real evidence for telepathy. But there was a crucial flaw in this argument - one routinely overlooked in more conventional areas of science. Just because chance had been ruled out as an explanation did not prove telepathy must exist; there were many other ways of getting positive results. These ranged from 'sensory leakage' - where clues about the pictures accidentally reach the receiver - to outright fraud. In response, the researchers issued a review of all the ganzfeld studies done up to 1985 to show that 80 per cent had found statistically significant evidence. However, they also agreed that there were still too many problems in the experiments which could lead to positive results, and they drew up a list demanding new standards for future research.</p>
                  <p className="text-start text-gray-500 italic mb-2">After this, many researchers switched to autoganzfeld tests - an automated variant of the technique which used computers to perform many of the key tasks such as the random selection of images. By minimising human involvement, the idea was to minimise the risk of flawed results. In 1987, results from hundreds of autoganzfeld tests were studied by Honorton in a 'meta-analysis', a statistical technique for finding the overall results from a set of studies. Though less compelling than before, the outcome was still impressive.</p>
                  <p className="text-start text-gray-500 italic mb-2">Yet some parapsychologists remain disturbed by the lack of consistency between individual ganzfeld studies. Defenders of telepathy point out that demanding impressive evidence from every study ignores one basic statistical fact: it takes large samples to detect small effects. If, as current results suggest, telepathy produces hit-rates only marginally above the 25 per cent expected by chance, it's unlikely to be detected by a typical ganzfeld study involving around 40 people: the group is just not big enough. Only when many studies are combined in a meta-analysis will the faint signal of telepathy really become apparent. And that is what researchers do seem to be finding.</p>
                  <p className="text-start text-gray-500 italic mb-2">What they are certainly not finding, however, is any change in attitude of mainstream scientists: most still totally reject the very idea of telepathy. The problem stems at least in part from the lack of any plausible mechanism for telepathy.</p>
                  <p className="text-start text-gray-500 italic mb-2">Various theories have been put forward, many focusing on esoteric ideas from theoretical physics. They include 'quantum entanglement', in which events affecting one group of atoms instantly affect another group, no matter how far apart they may be. While physicists have demonstrated entanglement with specially prepared atoms, no-one knows if it also exists between atoms making up human minds. Answering such questions would transform parapsychology. This has prompted some researchers to argue that the future lies not in collecting more evidence for telepathy, but in probing possible mechanisms. Some work has begun already, with researchers trying to identify people who are particularly successful in autoganzfeld trials. Early results show that creative and artistic people do much better than average; in one study at the University of Edinburgh, musicians achieved a hit-rate of 56 per cent. Perhaps more tests like these will eventually give the researchers the evidence they are seeking and strengthen the case for the existence of telepathy.</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-4</h3><p className="mb-4"><strong>Reading Passage 1 has eight paragraphs, A-H.</strong></p><p className="mb-4"><strong>Which paragraph contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-H, in boxes 1-4 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>a description of an early timekeeping invention affected by cold temperatures</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>an explanation of the importance of geography in the development of the calendar in farming communities</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>a description of the origins of the pendulum clock</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>details of the simultaneous efforts of different societies to calculate time using uniform hours</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 5-8</h3><p className="mb-4"><strong>Look at the following events (Questions 5-8) and the list of nationalities below.</strong></p><p className="mb-4"><strong>Match each event with the correct nationality, A-F.</strong></p><p className="mb-4 italic">Write the correct letter, A-F, in boxes 5-8 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Nationalities</h4><div className="grid grid-cols-2 gap-2"><div><strong>A</strong> Babylonians</div><div><strong>B</strong> Egyptians</div><div><strong>C</strong> Greeks</div><div><strong>D</strong> English</div><div><strong>E</strong> Germans</div><div><strong>F</strong> French</div></div></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>They devised a civil calendar in which the months were equal in length.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>They divided the day into two equal halves.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>They developed a new cabinet shape for a type of timekeeper.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>They created a calendar to organise public events and work schedules.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p className="mb-4"><strong>Label the diagram below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 9-13 on your answer sheet.</p><div className="text-center mb-6"><h4 className="font-semibold mb-4">How the 1670 lever-based device worked</h4><div className="border border-gray-300 p-4 bg-gray-50"><img src="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/reading/test1/diagram.png" alt="1670 lever-based device diagram" className="mx-auto max-w-full h-auto"/><p className="text-sm text-gray-500 mt-2">[Diagram showing the 1670 lever-based device with labeled parts]</p></div></div><div className="space-y-4"><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>escapement (resembling ______________________)</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">10</span><div className="flex-1"><p>the ______________________</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">11</span><div className="flex-1"><p>the ______________________</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">12</span><div className="flex-1"><p>a ______________________ which beats each</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">13</span><div className="flex-1"><p>______________________</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p className="mb-4"><strong>Reading Passage 2 has seven paragraphs, A-G.</strong></p><p className="mb-4"><strong>Choose the correct heading for paragraphs A and C-G from the list below.</strong></p><p className="mb-4 italic">Write the correct number, i-x, in boxes 14-19 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4><div className="space-y-1"><div><strong>i</strong> Disobeying FAA regulations</div><div><strong>ii</strong> Aviation disaster prompts action</div><div><strong>iii</strong> Two coincidental developments</div><div><strong>iv</strong> Setting altitude zones</div><div><strong>v</strong> An oversimplified view</div><div><strong>vi</strong> Controlling pilots' licences</div><div><strong>vii</strong> Defining airspace categories</div><div><strong>viii</strong> Setting rules to weather conditions</div><div><strong>ix</strong> Taking off safely</div><div><strong>x</strong> First steps towards ATC</div></div></div><div className="space-y-4"><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">14</span><div className="flex-1"><p>Paragraph A</p><div className="border border-gray-300 p-2 mt-2 bg-gray-100"><div className="flex justify-between"><span><strong>Example</strong></span><span><strong>Answer</strong></span></div><div className="flex justify-between"><span>Paragraph B</span><span>x</span></div></div><Input className="mt-2 max-w-[100px]" value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">15</span><div className="flex-1"><p>Paragraph C</p><Input className="mt-2 max-w-[100px]" value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">16</span><div className="flex-1"><p>Paragraph D</p><Input className="mt-2 max-w-[100px]" value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">17</span><div className="flex-1"><p>Paragraph E</p><Input className="mt-2 max-w-[100px]" value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">18</span><div className="flex-1"><p>Paragraph F</p><Input className="mt-2 max-w-[100px]" value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">19</span><div className="flex-1"><p>Paragraph G</p><Input className="mt-2 max-w-[100px]" value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-26</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 2?</strong></p><p className="mb-4">In boxes 20-26 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><div className="flex-1"><p>The FAA was created as a result of the introduction of the jet engine.</p><Input className="mt-2 max-w-[150px]" value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><div className="flex-1"><p>Air Traffic Control started after the Grand Canyon crash in 1956.</p><Input className="mt-2 max-w-[150px]" value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">22</span><div className="flex-1"><p>Beacons and flashing lights are still used by ATC today.</p><Input className="mt-2 max-w-[150px]" value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><div className="flex-1"><p>Some improvements were made in radio communication during World War II.</p><Input className="mt-2 max-w-[150px]" value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><div className="flex-1"><p>className F airspace is airspace which is below 365m and near airports.</p><Input className="mt-2 max-w-[150px]" value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><div className="flex-1"><p>All aircraft in className E airspace must use IFR.</p><Input className="mt-2 max-w-[150px]" value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><div className="flex-1"><p>A pilot entering className C airspace is flying over an average-sized city.</p><Input className="mt-2 max-w-[150px]" value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-30</h3><p className="mb-4"><strong>Complete each sentence with the correct ending, A-G, below.</strong></p><p className="mb-4 italic">Write the correct letter, A-G, in boxes 27-30 on your answer sheet.</p><div className="space-y-4 mb-6"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><div className="flex-1"><p>Researchers with differing attitudes towards telepathy agree on</p><Input className="mt-2 max-w-[100px]" value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><div className="flex-1"><p>Reports of experiences during meditation indicated</p><Input className="mt-2 max-w-[100px]" value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><div className="flex-1"><p>Attitudes to parapsychology would alter drastically with</p><Input className="mt-2 max-w-[100px]" value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><div className="flex-1"><p>Recent ganzfeld trials suggest that success rates will improve with</p><Input className="mt-2 max-w-[100px]" value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} placeholder="Answer"/></div></div></div><div className="border border-gray-300 p-4 bg-gray-50"><div className="space-y-1"><div><strong>A</strong> the discovery of a mechanism for telepathy.</div><div><strong>B</strong> the need for a meta-analysis of different experiment for telepathy.</div><div><strong>C</strong> their claims of a high success rate.</div><div><strong>D</strong> a solution to the problem of random guessing.</div><div><strong>E</strong> the significance of the ganzfeld experiments.</div><div><strong>F</strong> a more careful selection of subjects.</div><div><strong>G</strong> a need to keep altering conditions.</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 31-40</h3><p className="mb-4"><strong>Complete the table below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN THREE WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 31-40 on your answer sheet.</p><div className="overflow-x-auto"><table className="w-full border-collapse border border-gray-300"><thead><tr className="bg-gray-100"><th className="border border-gray-300 p-3 text-center font-semibold" colSpan={4}>Telepathy Experiments</th></tr><tr className="bg-gray-50"><th className="border border-gray-300 p-3 font-semibold">Name/Date</th><th className="border border-gray-300 p-3 font-semibold">Description</th><th className="border border-gray-300 p-3 font-semibold">Result</th><th className="border border-gray-300 p-3 font-semibold">Flaw</th></tr></thead><tbody><tr><td className="border border-gray-300 p-3 font-semibold">Ganzfeld studies 1982</td><td className="border border-gray-300 p-3">Involved a person acting as a <div className="mt-2"><Input className="w-full" value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} placeholder="31"/></div>who picked out one of four pictures and attempted to transmit it to <div className="mt-2"><Input className="w-full" value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} placeholder="32"/></div>a random selection of four. One <div className="mt-2"><Input className="w-full" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} placeholder="33"/></div>who then tried to identify it.</td><td className="border border-gray-300 p-3">Hit-rates were higher than with random guessing.</td><td className="border border-gray-300 p-3">Positive results could be produced by factors such as <div className="mt-2"><Input className="w-full" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} placeholder="34"/></div>by <div className="mt-2"><Input className="w-full" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} placeholder="35"/></div></td></tr><tr><td className="border border-gray-300 p-3 font-semibold">Autoganzfeld studies 1987</td><td className="border border-gray-300 p-3"><div className="mt-2"><Input className="w-full" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} placeholder="36"/></div>were used for key tasks to limit the amount of <div className="mt-2"><Input className="w-full" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} placeholder="37"/></div>in carrying out the tests.</td><td className="border border-gray-300 p-3">The results were then subjected to <div className="mt-2"><Input className="w-full" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} placeholder="38"/></div></td><td className="border border-gray-300 p-3">The <div className="mt-2"><Input className="w-full" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} placeholder="39"/></div>between different test results was put down to the fact that sample groups were not <div className="mt-2"><Input className="w-full" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} placeholder="40"/></div>(as with most ganzfeld studies).</td></tr></tbody></table></div></div>
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
        
        {/* Test Statistics and User History */}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
          <TestStatistics 
            book="book-8"
            module="reading"
            testNumber={1}
          />
          <UserTestHistory 
            book="book-8"
            module="reading"
            testNumber={1}
          />
        </div>
      </div>
    </div>
  )
}
