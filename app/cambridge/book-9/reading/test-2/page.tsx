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

export default function Book9ReadingTest2() {
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
      // Special handling for questions 11 and 12 - they can have A or C in any order
      if (questionNumber === '11' || questionNumber === '12') {
        const userLetter = userAnswer.toUpperCase().trim();
        
        // Check if user entered A or C (both are valid answers for either question)
        if (userLetter === 'A' || userLetter === 'C') {
          return true;
        }
        return false;
      }
      
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
        testNumber: 2,
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
    '1': 'H', '2': 'C', '3': 'B', '4': 'I', '5': 'D', '6': 'A',
    '7': 'two decades', '8': 'crowd (noise)', '9': 'invisible (disabilities)', '10': 'Objective 3',
    '11': 'A', '12': 'C',
    '13': 'C',
    '14': 'F', '15': 'D', '16': 'G', '17': 'E',
    '18': 'D', '19': 'A', '20': 'B', '21': 'C',
    '22': 'FALSE', '23': 'FALSE', '24': 'TRUE', '25': 'NOT GIVEN', '26': 'TRUE',
    '27': 'C', '28': 'B', '29': 'D', '30': 'C', '31': 'B',
    '32': 'YES', '33': 'YES', '34': 'NOT GIVEN', '35': 'NO', '36': 'NOT GIVEN', '37': 'NO',
    '38': 'A', '39': 'B', '40': 'C'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 9 - Reading Test 2</h1>
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
                     <p className="text-start mb-2"><span className="font-semibold">A</span> Hearing impairment or other auditory function deficit in young children can have a major impact on their development of speech and communication, resulting in a detrimental effect on their ability to learn at school. This is likely to have major consequences for the individual and the population as a whole. The New Zealand Ministry of Health has found from research carried out over two decades that 6-10% of children in that country are affected by hearing loss.</p>
                     <p className="text-start mb-2"><span className="font-semibold">B</span> A preliminary study in New Zealand has shown that classroom noise presents a major concern for teachers and pupils. Modern teaching practices, the organisation of desks in the classroom, poor classroom acoustics, and mechanical means of ventilation such as air-conditioning units all contribute to the number of children unable to comprehend the teacher's voice. Education researchers Nelson and Soli have also suggested that recent trends in learning often involve collaborative interaction of multiple minds and tools as much as individual possession of information. This all amounts to heightened activity and noise levels, which have the potential to be particularly serious for children experiencing auditory function deficit. Noise in classrooms can only exacerbate their difficulty in comprehending and processing verbal communication with other children and instructions from the teacher.</p>
                     <p className="text-start mb-2"><span className="font-semibold">C</span> Children with auditory function deficit are potentially falling behind their peers in language and literacy development and social skills. This failure to learn is often exacerbated by the presence of reverberation, the persistence of sound after the sound source has been stopped. Children with auditory function deficit are particularly sensitive to the effects of reverberation. The effects of noise on the ability of children to learn effectively in typical classroom environments are now the subject of increasing concern. The International Institute of Noise Control Engineering (I-INCE), on the advice of the World Health Organization, has established an international working party, which includes New Zealand, to evaluate noise and reverberation control for school rooms.</p>
                     <p className="text-start mb-2"><span className="font-semibold">D</span> While the detrimental effects of noise in classroom situations are not limited to children experiencing disability, those with a disability that affects their processing of speech and verbal communication could be extremely vulnerable. The auditory function deficits in question include hearing impairment, autistic spectrum disorders (ASD) and attention deficit disorders (ADD/ADHD).</p>
                     <p className="text-start mb-2"><span className="font-semibold">E</span> Autism is considered a neurological and genetic life-long disorder that causes discrepancies in the way information is processed. This disorder is characterised by interlinking problems with social imagination, social communication and social interaction. According to Janzen, this affects the ability to understand and relate in typical ways to people, understand events and objects in the environment, and understand or respond to sensory stimuli. Autism does not allow learning or thinking in the same ways as in children who are developing normally. Autistic spectrum disorders often result in major difficulties in comprehending verbal information and speech processing. Those experiencing these disorders often find sounds such as crowd noise and the noise generated by machinery painful and distressing. This is difficult to scientifically quantify as each child's experience is unique. But a child who finds any type of noise in their classroom or learning space intrusive is likely to be adversely affected in their ability to process information.</p>
                     <p className="text-start mb-2"><span className="font-semibold">F</span> The attention deficit disorders are indicative of neurological and genetic disorders and are characterised by difficulties with sustaining attention, effort and persistence, organisation skills and disinhibition. Children experiencing these disorders find it difficult to screen out unimportant information, and focus on everything in the environment rather than attending to a single activity. Background noise in the classroom becomes a major distraction, which can affect their ability to concentrate.</p>
                     <p className="text-start mb-2"><span className="font-semibold">G</span> Children experiencing an auditory function deficit can often find speech and communication very difficult to isolate and process when set against high levels of background noise. These levels come from outside activities that penetrate the classroom structure, from teaching activities, and other noise generated inside, which can be exacerbated by room reverberation. Strategies are needed to obtain the optimum classroom construction and perhaps a change in classroom culture and methods of teaching. In particular, the effects of noisy classrooms and activities on those experiencing disabilities in the form of auditory function deficit need thorough investigation. It is probable that many undiagnosed children exist in the education system with 'invisible' disabilities. Their needs are less likely to be met than those of children with known disabilities.</p>
                     <p className="text-start mb-2"><span className="font-semibold">H</span> The New Zealand Government has developed a New Zealand Disability Strategy and has embarked on a wide-ranging consultation process. The strategy recognises that people experiencing disability face significant barriers in achieving a full quality of life in areas such as attitude, education, employment and access to services. Objective 3 of the New Zealand Disability Strategy is to 'Provide the Best Education for Disabled People' by improving education so that all children, youth learners and adult learners will have equal opportunities to learn and develop within their already existing local school. For a successful education, the learning environment is vitally significant, so any effort to improve this is likely to be of great benefit to all children, but especially to those with auditory function disabilities.</p>
                     <p className="text-start mb-2"><span className="font-semibold">I</span> A number of countries are already in the process of formulating their own standards for the control and reduction of classroom noise. New Zealand will probably follow their example. The literature to date on noise in school rooms appears to focus on the effects on schoolchildren in general, their teachers and the hearing impaired. Only limited attention appears to have been given to those students experiencing the other disabilities involving auditory function deficit. It is imperative that the needs of these children are taken into account in the setting of appropriate international standards to be promulgated in future.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic">Venus in transit</p>
                    <p className="text-center text-gray-500 italic">June 2004 saw the first passage, known as a ‘transit’, of the planet Venus across the face of the Sun in 122 years. Transits have helped shape our view of the whole Universe, as Heather Cooper and Nigel Henbest explain</p>
                    <p className="text-start mb-2"><span className="font-semibold">A</span> On 8 June 2004, more than half the population of the world were treated to a rare astronomical event. For over six hours, the planet Venus steadily inched its way over the surface of the Sun. This 'transit' of Venus was the first since 6 December 1882. On that occasion, the American astronomer Professor Simon Newcomb led a party to South Africa to observe the event. They were based at a girls' school, where - it is alleged - the combined forces of three schoolmistresses outperformed the professionals with the accuracy of their observations.</p>
                    <p className="text-start mb-2"><span className="font-semibold">B</span> For centuries, transits of Venus have drawn explorers and astronomers alike to the four corners of the globe. And you can put it all down to the extraordinary polymath Edmond Halley. In November 1677, Halley observed a transit of the innermost planet, Mercury, from the desolate island of St Helena in the South Pacific. He realised that, from different latitudes, the passage of the planet across the Sun's disc would appear to differ. By timing the transit from two widely-separated locations, teams of astronomers could calculate the parallax angle - the apparent difference in position of an astronomical body due to a difference in the observer's position. Calculating this angle would allow astronomers to measure what was then the ultimate goal: the distance of the Earth from the Sun. This distance is known as the 'astronomical unit' or AU.</p>
                    <p className="text-start mb-2"><span className="font-semibold">C</span> Halley was aware that the AU was one of the most fundamental of all astronomical measurements. Johannes Kepler, in the early 17th century, had shown that the distances of the planets from the Sun governed their orbital speeds, which were easily measurable. But no-one had found a way to calculate accurate distances to the planets from the Earth. The goal was to measure the AU; then, knowing the orbital speeds of all the other planets around the Sun, the scale of the Solar System would fall into place. However, Halley realised that Mercury was so far away that its parallax angle would be very difficult to determine. As Venus was closer to the Earth, its parallax angle would be larger, and Halley worked out that by using Venus it would be possible to measure the Sun's distance to 1 part in 500. But there was a problem: transits of Venus, unlike those of Mercury, are rare, occurring in pairs roughly eight years apart every hundred or so years.</p>
                    <p className="text-start mb-2"><span className="font-semibold">D</span> Inspired by Halley's suggestion of a way to pin down the scale of the Solar System, teams of British and French astronomers set out on expeditions to places as diverse as India and Siberia. But things weren't helped by Britain and France being at war. The person who deserves most sympathy is the French astronomer Guillaume Le Gentil. He was thwarted by the fact that the British were besieging his observation site at Pondicherry in India. Fleeing on a French warship crossing the Indian Ocean, Le Gentil saw a wonderful transit - but the ship's pitching and rolling ruled out any attempt at making accurate observations. Undaunted, he remained south of the equator, keeping himself busy by studying the islands of Mauritius and Madagascar before setting off to observe the next transit in the Philippines. Ironically after travelling nearly 50,000 kilometres, his view was clouded out at the last moment, a very dispiriting experience.</p>
                    <p className="text-start mb-2"><span className="font-semibold">E</span> While the early transit timings were as precise as instruments would allow, the measurements were dogged by the 'black drop' effect. When Venus begins to cross the Sun's disc, it looks smeared not circular - which makes it difficult to establish timings. This is due to diffraction of light. The second problem is that Venus exhibits a halo of light when it is seen just outside the Sun's disc. While this showed astronomers that Venus was surrounded by a thick layer of gases refracting sunlight, both effects made it impossible to obtain accurate timings.</p>
                    <p className="text-start mb-2"><span className="font-semibold">F</span> But astronomers laboured hard to analyse the results of these expeditions to observe Venus transits. Johann Franz Encke, Director of the Berlin Observatory, finally determined a value for the AU based on all these parallax measurements: 153,340,000 km. Reasonably accurate for the time, that is quite close to today's value of 149,597,870 km, determined by radar, which has now superseded transits and all other methods in accuracy. The AU is a cosmic measuring rod, and the basis of how we scale the Universe. The parallax principle can be extended to measure the distances to the stars. If we look at a star in January - when Earth is at one point in its orbit - it will seem to be in a different position from where it appears six months later. Knowing the width of Earth's orbit, the parallax shift lets astronomers calculate the distance.</p>
                    <p className="text-start mb-2"><span className="font-semibold">G</span> June 2004's transit of Venus was thus more of an astronomical spectacle than a scientifically important event. But such transits have paved the way for what might prove to be one of the most vital breakthroughs in the cosmos - detecting Earth-sized planets orbiting other stars.</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-500 italic">A neuroscientist reveals how to think differently</p>
                  <p className="text-start mb-2">In the last decade a revolution has occurred in the way that scientists think about the brain. We now know that the decisions humans make can be traced to the firing patterns of neurons in specific parts of the brain. These discoveries have led to the field known as neuroeconomics, which studies the brain’s secrets to success in an economic environment that demands innovation and being able to do things differently from competitors. A brain that can do this is an iconoclastic one. Briefly, an iconoclast is a person who does something that others say can’t be done.
</p>
                  <p className="text-start mb-2">This definition implies that iconoclasts are different from other people, but more precisely, it is their brains that are different in three distinct ways: perception, fear response, and social intelligence. Each of these three functions utilizes a different circuit in the brain. Naysayers might suggest that the brain is irrelevant, that thinking in an original, even revolutionary, way is more a matter of personality than brain function. But the field of neuroeconomics was born out of the realization that the physical workings of the brain place limitations on the way we make decisions. By understanding these constraints, we begin to understand why some people march to a different drumbeat.
</p>
                  <p className="text-start mb-2">The first thing to realize is that the brain suffers from limited resources. It has a fixed energy budget, about the same as a 40 watt light bulb, so it has evolved to work as efficiently as possible. This is where most people are impeded from being an iconoclast. For example, when confronted with information streaming from the eyes, the brain will interpret this information in the quickest way possible. Thus it will draw on both past experience and any other source of information, such as what other people say, to make sense of what it is seeing. This happens all the time. The brain takes shortcuts that work so well we are hardly ever aware of them. We think our perceptions of the world are real, but they are only biological and electrical rumblings. Perception is not simply a product of what your eyes or ears transmit to your brain. More than the physical reality of photons or sound waves, perception is a product of the brain.
</p>
                  <p className="text-start mb-2">Perception is central to iconoclasm. Iconoclasts see things differently to other people. Their brains do not fall into efficiency pitfalls as much as the average person’s brain. Iconoclasts, either because they were born that way or through learning, have found ways to work around the perceptual shortcuts that plague most people. Perception is not something that is hardwired into the brain. It is a learned process, which is both a curse and an opportunity for change. The brain faces the fundamental problem of interpreting physical stimuli from the senses. Everything the brain sees, hears, or touches has multiple interpretations. The one that is ultimately chosen is simply the brain’s best theory. In technical terms, these conjectures have their basis in the statistical likelihood of one interpretation over another and are heavily influenced by past experience and, importantly for potential iconoclasts, what other people say.
</p>
                  <p className="text-start mb-2">The best way to see things differently to other people is to bombard the brain with things it has never encountered before. Novelty releases the perceptual process from the chains of past experience and forces the brain to make new judgments. Successful iconoclasts have an extraordinary willingness to be exposed to what is fresh and different. Observation of iconoclasts shows that they embrace novelty while most people avoid things that are different.
</p>
                  <p className="text-start mb-2">The problem with novelty, however, is that it tends to trigger the brain’s fear system. Fear is a major impediment to thinking like an iconoclast and stops the average person in his tracks. There are many types of fear, but the two that inhibit iconoclastic thinking and people generally find difficult to deal with are fear of uncertainty and fear of public ridicule. These may seem like trivial phobias. But fear of public speaking, which everyone must do from time to time, afflicts one-third of the population. This makes it too common to be considered a mental disorder. It is simply a common variant of human nature, one which iconoclasts do not let inhibit their reactions.
</p>
                  <p className="text-start mb-2">Finally, to be successful iconoclasts, individuals must sell their ideas to other people. This is where social intelligence comes in. Social intelligence is the ability to understand and manage people in a business setting. In the last decade there has been an explosion of knowledge about the social brain and how the brain works when groups coordinate decision making. Neuroscience has revealed which brain circuits are responsible for functions like understanding what other people think, empathy, fairness, and social identity. These brain regions play key roles in whether people convince others of their ideas. Perception is important in social cognition too. The perception of someone’s enthusiasm, or reputation, can make or break a deal. Understanding how perception becomes intertwined with social decision making shows why successful iconoclasts are so rare.
</p>
                  <p className="text-start mb-2">Iconoclasts create new opportunities in every area from artistic expression to technology to business. They supply creativity and innovation not easily accomplished by committees. Rules aren’t important to them. Iconoclasts face alienation and failure, but can also be a major asset to any organization. It is crucial for success in any field to understand how the iconoclastic mind works.
</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-6</h3><p className="mb-4"><strong>Reading Passage 1 has nine sections, A-I.</strong></p><p className="mb-4"><strong>Which section contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-I, in boxes 1-6 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>an account of a national policy initiative</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>a description of a global team effort</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>a hypothesis as to one reason behind the growth in classroom noise</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>a demand for suitable worldwide regulations</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>a list of medical conditions which place some children more at risk from noise than others</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>the estimated proportion of children in New Zealand with auditory problems</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7-10</h3><p className="mb-4"><strong>Answer the questions below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 7-10 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>For what period of time has hearing loss in schoolchildren been studied in New Zealand?</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>In addition to machinery noise, what other type of noise can upset children with autism?</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>What term is used to describe the hearing problems of schoolchildren which have not been diagnosed?</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><div className="flex-1"><p>What part of the New Zealand Disability Strategy aims to give schoolchildren equal opportunity?</p><Input className={`mt-2 max-w-[200px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 11 and 12</h3><p className="mb-4"><strong>Choose TWO letters, A-F.</strong></p><p className="mb-4 italic">Write the correct letters in boxes 11 and 12 on your answer sheet.</p><p className="mb-4">The list below includes factors contributing to classroom noise. Which TWO are mentioned by the writer of the passage?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> current teaching methods</p><p><strong>B</strong> echoing corridors</p><p><strong>C</strong> cooling systems</p><p><strong>D</strong> large class sizes</p><p><strong>E</strong> loud-voiced teachers</p><p><strong>F</strong> playground games</p></div><div className="ml-6 mt-4 space-y-3"><div className="flex items-center gap-4"><span className="font-semibold">11.</span><Input className={`max-w-[100px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-center gap-4"><span className="font-semibold">12.</span><Input className={`max-w-[100px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Question 13</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter in box 13 on your answer sheet.</p><p className="mb-4">What is the writer's overall purpose in writing this article?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> to compare different methods of dealing with auditory problems</p><p><strong>B</strong> to provide solutions for overly noisy learning environments</p><p><strong>C</strong> to increase awareness of the situation of children with auditory problems</p><p><strong>D</strong> to promote New Zealand as a model for other countries to follow</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p className="mb-4"><strong>Reading Passage 2 has seven paragraphs, A-G.</strong></p><p className="mb-4"><strong>Which paragraph contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-G, in boxes 14-17 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><div className="flex-1"><p>examples of different ways in which the parallax principle has been applied</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><div className="flex-1"><p>a description of an event which prevented a transit observation</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><div className="flex-1"><p>a statement about potential future discoveries leading on from transit observations</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><div className="flex-1"><p>a description of physical states connected with Venus which early astronomical instruments failed to overcome</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-21</h3><p className="mb-4"><strong>Look at the following statements (Questions 18-21) and the list of people below.</strong></p><p className="mb-4"><strong>Match each statement with the correct person, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter, A, B, C or D, in boxes 18-21 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">18</span><div className="flex-1"><p>He calculated the distance of the Sun from the Earth based on observations of Venus with a fair degree of accuracy.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><div className="flex-1"><p>He understood that the distance of the Sun from the Earth could be worked out by comparing observations of a transit.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><div className="flex-1"><p>He realised that the time taken by a planet to go round the Sun depends on its distance from the Sun.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><div className="flex-1"><p>He witnessed a Venus transit but was unable to make any calculations.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="bg-gray-50 p-4 rounded-lg mt-4"><h4 className="font-semibold mb-3">List of People</h4><div className="space-y-1 text-sm"><p><strong>A</strong> Edmond Halley</p><p><strong>B</strong> Johannes Kepler</p><p><strong>C</strong> Guillaume Le Gentil</p><p><strong>D</strong> Johann Franz Encke</p></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 22-26</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 2?</strong></p><p className="mb-4 italic">In boxes 22-26 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">22</span><div className="flex-1"><p>Halley observed one transit of the planet Venus.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><div className="flex-1"><p>Le Gentil managed to observe a second Venus transit.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><div className="flex-1"><p>The shape of Venus appears distorted when it starts to pass in front of the Sun.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><div className="flex-1"><p>Early astronomers suspected that the atmosphere on Venus was toxic.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><div className="flex-1"><p>The parallax principle allows astronomers to work out how far away distant stars are from the Earth.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter in boxes 27-31 on your answer sheet.</p><div className="space-y-4"><div className="space-y-2"><p><span className="font-semibold">27</span> Neuroeconomics is a field of study which seeks to</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> cause a change in how scientists understand brain chemistry.</p><p><strong>B</strong> understand how good decisions are made in the brain.</p><p><strong>C</strong> understand how the brain is linked to achievement in competitive fields.</p><p><strong>D</strong> trace the specific firing patterns of neurons in different areas of the brain.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="space-y-2"><p><span className="font-semibold">28</span> According to the writer, iconoclasts are distinctive because</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> they create unusual brain circuits.</p><p><strong>B</strong> their brains function differently.</p><p><strong>C</strong> their personalities are distinctive.</p><p><strong>D</strong> they make decisions easily.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="space-y-2"><p><span className="font-semibold">29</span> According to the writer, the brain works efficiently because</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> it uses the eyes quickly.</p><p><strong>B</strong> it interprets data logically.</p><p><strong>C</strong> it generates its own energy.</p><p><strong>D</strong> it relies on previous events.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="space-y-2"><p><span className="font-semibold">30</span> The writer says that perception is</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> a combination of photons and sound waves.</p><p><strong>B</strong> a reliable product of what your senses transmit.</p><p><strong>C</strong> a result of brain processes.</p><p><strong>D</strong> a process we are usually conscious of.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="space-y-2"><p><span className="font-semibold">31</span> According to the writer, an iconoclastic thinker</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> centralises perceptual thinking in one part of the brain.</p><p><strong>B</strong> avoids cognitive traps.</p><p><strong>C</strong> has a brain that is hardwired for learning.</p><p><strong>D</strong> has more opportunities than the average person.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-37</h3><p className="mb-4"><strong>Do the following statements agree with the claims of the writer in Reading Passage 3?</strong></p><p className="mb-4 italic">In boxes 32-37 on your answer sheet, write</p><div className="ml-4 mb-4 space-y-1 text-sm"><p><strong>YES</strong> if the statement agrees with the claims of the writer</p><p><strong>NO</strong> if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><div className="flex-1"><p>Exposure to different events forces the brain to think differently.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">33</span><div className="flex-1"><p>Iconoclasts are unusually receptive to new experiences.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><div className="flex-1"><p>Most people are too shy to try different things.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><div className="flex-1"><p>If you think in an iconoclastic way, you can easily overcome fear.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><div className="flex-1"><p>When concern about embarrassment matters less, other fears become irrelevant.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><div className="flex-1"><p>Fear of public speaking is a psychological illness.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38-40</h3><p className="mb-4"><strong>Complete each sentence with the correct ending, A-E, below.</strong></p><p className="mb-4 italic">Write the correct letter, A-E, in boxes 38-40 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>Thinking like a successful iconoclast is demanding because it</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>The concept of the social brain is useful to iconoclasts because it</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>Iconoclasts are generally an asset because their way of thinking</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="bg-gray-50 p-4 rounded-lg mt-4"><div className="space-y-1 text-sm"><p><strong>A</strong> requires both perceptual and social intelligence skills.</p><p><strong>B</strong> focuses on how groups decide on an action.</p><p><strong>C</strong> works in many fields, both artistic and scientific.</p><p><strong>D</strong> leaves one open to criticism and rejection.</p><p><strong>E</strong> involves understanding how organisations manage people.</p></div></div></div>
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
                        <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question.replace('&', ' & ')}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
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
                        <span className="font-semibold">{question.replace('&', ' & ')}:</span>
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
                    <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map((questionNumber) => { const userAnswer = answers[questionNumber] || ''; const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]; const isCorrect = checkAnswer(questionNumber); return (<div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber.replace('&', ' & ')}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div></div></div>);})}</div></div>
                    <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
                </div>
            </div>
        )}

        {/* Analytics Components */}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
          <PageViewTracker 
            book="book-9"
            module="reading"
            testNumber={2}
          />
          <TestStatistics 
            book="book-9"
            module="reading"
            testNumber={2}
          />
          <UserTestHistory 
            book="book-9"
            module="reading"
            testNumber={2}
          />
        </div>

      </div>
    </div>
  )
}