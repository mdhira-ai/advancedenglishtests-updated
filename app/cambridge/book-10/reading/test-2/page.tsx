'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics/'
import { saveTestScore } from '@/lib/test-score-saver'

export default function Book10ReadingTest2() {
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
    // Special handling for question 23 (two-part answer)
    if (questionNumber === '23') {
      const answer23a = answers['23a'] || ''
      const answer23b = answers['23b'] || ''
      const correctAnswer23a = correctAnswers['23a'] as string
      const correctAnswer23b = correctAnswers['23b'] as string
      
      if (!answer23a.trim() || !answer23b.trim()) {
        return false
      }
      
      // Check if both parts are correct using the matching function
      const isCorrect23a = checkAnswerWithMatching(answer23a, correctAnswer23a, '23a')
      const isCorrect23b = checkAnswerWithMatching(answer23b, correctAnswer23b, '23b')
      
      return isCorrect23a && isCorrect23b
    }
    
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
    
    // Get all unique question numbers (excluding 23a and 23b separately since they count as one question)
    const questionNumbers = Object.keys(correctAnswers).filter(q => q !== '23a' && q !== '23b')
    questionNumbers.push('23') // Add question 23 as a single question
    
    for (const questionNumber of questionNumbers) {
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
    '1': 'iv', '2': 'viii', '3': 'vii', '4': 'i', '5': 'vi', '6': 'ix', '7': 'ii',
    '8': 'NOT GIVEN', '9': 'TRUE', '10': 'FALSE', '11': 'FALSE', '12': 'NOT GIVEN', '13': 'TRUE',
    '14': 'A', '15': 'D', '16': 'F', '17': 'D',
    '18': 'B', '19': 'D', '20': 'E', '21': 'A', '22': 'C',
    '23a': 'books', '23b': 'activities', '24': 'internal regulation/self-regulation', '25': 'emotional awareness', '26': 'spoon-feeding',
    '27': 'B', '28': 'H', '29': 'L', '30': 'G', '31': 'D',
    '32': 'C', '33': 'D', '34': 'A', '35': 'D',
    '36': 'NOT GIVEN', '37': 'NO', '38': 'YES', '39': 'NOT GIVEN', '40': 'NO'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 10 - Reading Test 2</h1>
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
                        Tea and the Industrial Revolution
                      </p>
                      <p className="text-start text-gray-500 italic mb-2">A Cambridge professor says that a change in drinking habits was the reason for the Industrial Revolution in Britain. Anjana Ahuja reports</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> Alan Macfarlane, professor of anthropological science at King’s College, Cambridge, has, like other historians, spent decades wrestling with the enigma of the Industrial Revolution. Why did this particular Big Bang – the world-changing birth of industry – happen in Britain? And why did it strike at the end of the 18th century?</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> Macfarlane compares the puzzle to a combination lock. ‘There are about 20 different factors and all of them need to be present before the revolution can happen,’ he says. For industry to take off, there needs to be the technology and power to drive factories, large urban populations to provide cheap labour, easy transport to move goods around, an affluent middle-class willing to buy mass-produced objects, a market-driven economy and a political system that allows this to happen. While this was the case for England, other nations, such as Japan, the Netherlands and France also met some of these criteria but were not industrialising. ‘All these factors must have been necessary but not sufficient to cause the revolution,’ says Macfarlane. ‘After all, Holland had everything except coal, while China also had many of these factors. Most historians are convinced there are one or two missing factors that you need to open the lock.’</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> The missing factors, he proposes, are to be found in almost every kitchen cupboard. Tea and beer, two of the nation’s favourite drinks, fuelled the revolution. The antiseptic properties of tannin, the active ingredient in tea, and of hops in beer – plus the fact that both are made with boiled water – allowed urban communities to flourish at close quarters without succumbing to water-borne diseases such as dysentery. The theory sounds eccentric but once he starts to explain the detective work that went into his deduction, the scepticism gives way to wary admiration. Macfarlane’s case has been strengthened by support from notable quarters – Roy Porter, the distinguished medical historian, recently wrote a favourable appraisal of his research.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> Macfarlane had wondered for a long time how the Industrial Revolution came about. Historians had alighted on one interesting factor around the mid-18th century that required explanation. Between about 1650 and 1740, the population in Britain was static. But then there was a burst in population growth. Macfarlane says: ‘The infant mortality rate halved in the space of 20 years, and this happened in both rural areas and cities, and across all classes. People suggested four possible causes. Was there a sudden change in the viruses and bacteria around? Unlikely. Was there a revolution in medical science? But this was a century before Lister’s revolution*. Was there a change in environmental conditions? There were improvements in agriculture that wiped out malaria, but these were small gains. Sanitation did not become widespread until the 19th century. The only option left is food. But the height and weight statistics show a decline. So the food must have got worse. Efforts to explain this sudden reduction in child deaths appeared to draw a blank.’</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> This population burst seemed to happen at just the right time to provide labour for the Industrial Revolution. ‘When you start moving towards an industrial revolution, it is economically efficient to have people living close together,’ says Macfarlane. ‘But then you get disease, particularly from human waste.’ Some digging around in historical records revealed that there was a change in the incidence of water-borne disease at that time, especially dysentery. Macfarlane deduced that whatever the British were drinking must have been important in regulating disease. He says, ‘We drank beer. For a long time, the English were protected by the strong antibacterial agent in hops, which were added to help preserve the beer. But in the late 17th century a tax was introduced on malt, the basic ingredient of beer. The poor turned to water and gin and in the 1720s the mortality rate began to rise again. Then it suddenly dropped again. What caused this?’</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">F</span> Macfarlane looked to Japan, which was also developing large cities about the same time, and also had no sanitation. Water-borne diseases had a much looser grip on the Japanese population than those in Britain. Could it be the prevalence of tea in their culture? Macfarlane then noted that the history of tea in Britain provided an extraordinary coincidence of dates. Tea was relatively expensive until Britain started a direct clipper trade with China in the early 18th century. By the 1740s, about the time that infant mortality was dipping, the drink was common. Macfarlane guessed that the fact that water had to be boiled, together with the stomach-purifying properties of tea meant that the breast milk provided by mothers was healthier than it had ever been. No other European nation sipped tea like the British, which, by Macfarlane’s logic, pushed these other countries out of contention for the revolution.</p>
                      <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">G</span> But, if tea is a factor in the combination lock, why didn’t Japan forge ahead in a tea-soaked industrial revolution of its own? Macfarlane notes that even though 17th-century Japan had large cities, high literacy rates, even a future market, it had turned its back on the essence of any work-based revolution by giving up labour-saving devices such as animals, afraid that they would put people out of work. So, the nation that we now think of as one of the most technologically advanced entered the 19th century having ‘abandoned the wheel’.</p>
                      <p className="text-start text-gray-500 italic text-sm mb-2">* Joseph Lister was the first doctor to use antiseptic techniques during surgical operations to prevent infections.</p>
                </CardContent>
              </Card>

              {/* Passage 2 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">Gifted children and learning</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">A</span> Internationally, ‘giftedness’ is most frequently determined by a score on a general intelligence test, known as an IQ test, which is above a chosen cut-off point, usually at around the top 2-5%. Children’s educational environment contributes to the IQ score and the way intelligence is used. For example, a very close positive relationship was found when children’s IQ scores were compared with their home educational provision (Freeman, 2010). The higher the children’s IQ scores, especially over IQ 130, the better the quality of their educational backup, measured in terms of reported verbal interactions with parents, number of books and activities in their home etc. Because IQ tests are decidedly influenced by what the child has learned, they are to some extent measures of current achievement based on age-norms; that is, how well the children have learned to manipulate their knowledge and know-how within the terms of the test. The vocabulary aspect, for example, is dependent on having heard those words. But IQ tests can neither identify the processes of learning and thinking nor predict creativity.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">B</span> Excellence does not emerge without appropriate help. To reach an exceptionally high standard in any area very able children need the means to learn, which includes material to work with and focused challenging tuition – and the encouragement to follow their dream. There appears to be a qualitative difference in the way the intellectually highly able think, compared with more average-ability or older pupils, for whom external regulation by the teacher often compensates for lack of internal regulation. To be at their most effective in their self-regulation, all children can be helped to identify their own ways of learning – metacognition – which will include strategies of planning, monitoring, evaluation, and choice of what to learn. Emotional awareness is also part of metacognition, so children should be helped to be aware of their feelings around the area to be learned, feelings of curiosity or confidence, for example.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">C</span> High achievers have been found to use self-regulatory learning strategies more often and more effectively than lower achievers, and are better able to transfer these strategies to deal with unfamiliar tasks. This happens to such a high degree in some children that they appear to be demonstrating talent in particular areas. Overviewing research on the thinking process of highly able children, (Shore and Kanevsky, 1993) put the instructor’s problem succinctly: ‘If they [the gifted] merely think more quickly, then we need only teach more quickly. If they merely make fewer errors, then we can shorten the practice’. But of course, this is not entirely the case; adjustments have to be made in methods of learning and teaching, to take account of the many ways individuals think.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">D</span> Yet in order to learn by themselves, the gifted do need some support from their teachers. Conversely, teachers who have a tendency to ‘overdirect’ can diminish their gifted pupils’ learning autonomy. Although ‘spoon-feeding’ can produce extremely high examination results, these are not always followed by equally impressive life successes. Too much dependence on the teacher risks loss of autonomy and motivation to discover. However, when teachers help pupils to reflect on their own learning and thinking activities, they increase their pupils’ self-regulation. For a young child, it may be just the simple question ‘What have you learned today?’ which helps them to recognise what they are doing. Given that a fundamental goal of education is to transfer the control of learning from teachers to pupils, improving pupils’ learning to learn techniques should be a major outcome of the school experience, especially for the highly competent. There are quite a number of new methods which can help, such as child-initiated learning, ability-peer tutoring, etc. Such practices have been found to be particularly useful for bright children from deprived areas.</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">E</span> But scientific progress is not all theoretical, knowledge is also vital to outstanding performance: individuals who know a great deal about a specific domain will achieve at a higher level than those who do not (Elshout, 1995). Research with creative scientists by Simonton (1988) brought him to the conclusion that above a certain high level, characteristics such as independence seemed to contribute more to reaching the highest levels of expertise than intellectual skills, due to the great demands of effort and time needed for learning and practice. Creativity in all forms can be seen as expertise mixed with a high level of motivation (Weisberg, 1993).</p>
                    <p className="text-start text-gray-500 italic mb-2"><span className="font-semibold">F</span> To sum up, learning is affected by emotions of both the individual and significant others. Positive emotions facilitate the creative aspects of learning and negative emotions inhibit it. Fear, for example, can limit the development of curiosity, which is a strong force in scientific advance, because it motivates problem-solving behaviour. In Boekaerts’ (1991) review of emotion in the learning of very high IQ and highly achieving children, she found emotional forces in harness. They were not only curious, but often had a strong desire to control their environment, improve their learning efficiency, and increase their own learning resources.</p>
                </CardContent>
              </Card>

              {/* Passage 3 */}
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-500 italic mb-2 font-semibold text-xl">Museums of fine art and their public</p>
                  <p className="text-start text-gray-500 italic mb-2">The fact that people go to the Louvre museum in Paris to see the original painting Mona Lisa when they can see a reproduction anywhere leads us to question some assumptions about the role of museums of fine art in today's world.</p>
                  <p className="text-start text-gray-500 italic mb-2">One of the most famous works of art in the world is Leonardo da Vinci's Mona Lisa. Nearly everyone who goes to see the original will already be familiar with it from reproductions, but they accept that fine art is more rewardingly viewed in its original form.</p>
                  <p className="text-start text-gray-500 italic mb-2">However, if Mona Lisa was a famous novel, few people would bother to go to a museum to read the writer's actual manuscript rather than a printed reproduction. This might be explained by the fact that the novel has evolved precisely because of technological developments that made it possible to print out huge numbers of texts, whereas oil paintings have always been produced as unique objects. In addition, it could be argued that the practice of interpreting or 'reading' each medium follows different conventions. With novels, the reader attends mainly to the meaning of words rather than the way they are printed on the page, whereas the 'reader' of a painting must attend just as closely to the material form of marks and shapes in the picture as to any ideas they may signify.</p>
                  <p className="text-start text-gray-500 italic mb-2">Yet it has always been possible to make very accurate facsimiles of pretty well any fine art work. The seven surviving versions of Mona Lisa bear witness to the fact that in the 16th century, artists seemed perfectly content to assign the reproduction of their creations to their workshop apprentices as regular 'bread and butter' work. And today the task of reproducing pictures is incomparably more simple and reliable, with reprographic techniques that allow the production of high-quality prints made exactly to the original scale, with faithful colour values, and even with duplication of the surface relief of the painting.</p>
                  <p className="text-start text-gray-500 italic mb-2">But despite an implicit recognition that the spread of good reproductions can be culturally valuable, museums continue to promote the special status of original work. Unfortunately, this seems to place severe limitations on the kind of experience offered to visitors. One limitation is related to the way the museum presents its exhibits. As repositories of unique historical objects, art museums are often called 'treasure houses'. We are reminded of this even before we view a collection by the presence of security guards, attendants, ropes and display cases to keep us away from the exhibits. In many cases, the architectural style of the building further reinforces that notion. In addition, a major collection like that of London's National Gallery is housed in numerous rooms, each with dozens of works, any one of which is likely to be worth more than all the average visitor possesses. In a society that judges the personal status of the individual so much by their material worth, it is therefore difficult not to be impressed by one's own relative 'worthlessness' in such an environment.</p>
                  <p className="text-start text-gray-500 italic mb-2">Furthermore, consideration of the 'value' of the original work in its treasure house setting impresses upon the viewer that, since these works were originally produced, they have been assigned a huge monetary value by some person or institution more powerful than themselves. Evidently, nothing the viewer thinks about the work is going to alter that value, and so today's viewer is deterred from trying to extend that spontaneous, immediate, self-reliant kind of reading which would originally have met the work.</p>
                  <p className="text-start text-gray-500 italic mb-2">The visitor may then be struck by the strangeness of seeing such diverse paintings, drawings and sculptures brought together in an environment for which they were not originally created. This 'displacement effect' is further heightened by the sheer volume of exhibits. In the case of a major collection, there are probably more works on display than we could realistically view in weeks or even months.</p>
                  <p className="text-start text-gray-500 italic mb-2">This is particularly distressing because time seems to be a vital factor in the appreciation of all art forms. A fundamental difference between paintings and other art forms is that there is no prescribed time over which a painting is viewed. By contrast, the audience encounters an opera or a play over a specific time, which is the duration of the performance. Similarly, novels and poems are read in a prescribed temporal sequence, whereas a picture has no clear place at which to start viewing, or at which to finish. Thus art works themselves encourage us to view them superficially, without appreciating the richness of detail and labour that is involved.</p>
                  <p className="text-start text-gray-500 italic mb-2">Consequently, the dominant critical approach becomes that of the art historian, a specialised academic approach devoted to 'discovering the meaning' of art within the cultural context of its time. This is in perfect harmony with the museum's function, since the approach is dedicated to seeking out and conserving 'authentic', 'original' readings of the exhibits. Again, this seems to put paid to that spontaneous, participatory criticism which can be found in abundance in criticism of classic works of literature, but is absent from most art history.</p>
                  <p className="text-start text-gray-500 italic mb-2">The displays of art museums serve as a warning of what critical practices can emerge when spontaneous criticism is suppressed. The museum public, like any other audience, experience art more rewardingly when given the confidence to express their views. If appropriate works of fine art could be rendered permanently accessible to the public by means of high-fidelity reproductions, as literature and music already are, the public may feel somewhat less in awe of them. Unfortunately, that may be too much to ask from those who seek to maintain and control the art establishment.</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-7</h3><p className="mb-4"><strong>Reading Passage 1 has seven paragraphs, A-G.</strong></p><p className="mb-4"><strong>Choose the correct heading for each paragraph from the list of headings below.</strong></p><p className="mb-4 italic">Write the correct number, i-ix, in boxes 1-7 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Headings</h4><div className="space-y-1"><div><strong>i</strong> The search for the reasons for an increase in population</div><div><strong>ii</strong> Industrialisation and the fear of unemployment</div><div><strong>iii</strong> The development of cities in Japan</div><div><strong>iv</strong> The time and place of the Industrial Revolution</div><div><strong>v</strong> The cases of Holland, France and China</div><div><strong>vi</strong> Changes in drinking habits in Britain</div><div><strong>vii</strong> Two keys to Britain’s industrial revolution</div><div><strong>viii</strong> Conditions required for industrialisation</div><div><strong>ix</strong> Comparisons with Japan lead to the answer</div></div></div><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>Paragraph A</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>Paragraph B</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>Paragraph C</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>Paragraph D</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>Paragraph E</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>Paragraph F</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>Paragraph G</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 8-13</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><p className="mb-4">In boxes 8-13 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>China's transport system was not suitable for industry in the 18th century.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>Tea and beer both helped to prevent dysentery in Britain.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">10</span><div className="flex-1"><p>Roy Porter disagrees with Professor Macfarlane's findings.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">11</span><div className="flex-1"><p>After 1740, there was a reduction in population in Britain.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">12</span><div className="flex-1"><p>People in Britain used to make beer at home.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">13</span><div className="flex-1"><p>The tax on malt indirectly caused a rise in the death rate.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p className="mb-4"><strong>Reading Passage 2 has six paragraphs, A-F.</strong></p><p className="mb-4"><strong>Which paragraph contains the following information?</strong></p><p className="mb-4 italic">Write the correct letter, A-F, in boxes 14-17 on your answer sheet.</p><p className="mb-4 italic font-semibold">NB You may use any letter more than once.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><div className="flex-1"><p>a reference to the influence of the domestic background on the gifted child</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><div className="flex-1"><p>reference to what can be lost if learners are given too much guidance</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><div className="flex-1"><p>a reference to the damaging effects of anxiety</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><div className="flex-1"><p>examples of classroom techniques which favour socially-disadvantaged children</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-22</h3><p className="mb-4"><strong>Look at the following statements (Questions 18-22) and the list of people below.</strong></p><p className="mb-4"><strong>Match each statement with the correct person or people, A-E.</strong></p><p className="mb-4 italic">Write the correct letter, A-E, in boxes 18-22 on your answer sheet.</p><div className="space-y-4 mb-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">18</span><div className="flex-1"><p>Less time can be spent on exercises with gifted pupils who produce accurate work.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><div className="flex-1"><p>Self-reliance is a valuable tool that helps gifted students reach their goals.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><div className="flex-1"><p>Gifted children know how to channel their feelings to assist their learning.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><div className="flex-1"><p>The very gifted child benefits from appropriate support from close relatives.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">22</span><div className="flex-1"><p>Really successful students have learnt a considerable amount about their subject.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="border border-gray-300 p-4 bg-gray-50"><h4 className="font-semibold mb-2">List of People</h4><div className="grid grid-cols-2 gap-2"><div><strong>A</strong> Freeman</div><div><strong>B</strong> Shore and Kanevsky</div><div><strong>C</strong> Elshout</div><div><strong>D</strong> Simonton</div><div><strong>E</strong> Boekaerts</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23-26</h3><p className="mb-4"><strong>Complete the sentences below.</strong></p><p className="mb-4"><strong>Choose NO MORE THAN TWO WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 23-26 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><div className="flex-1"><p>One study found a strong connection between children's IQ and the availability of <Input className={`mt-2 w-full ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23a'] || ''} onChange={(e) => handleAnswerChange('23a', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> and <Input className={`mt-2 w-full ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23b'] || ''} onChange={(e) => handleAnswerChange('23b', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> at home.</p></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><div className="flex-1"><p>Children of average ability seem to need more direction from teachers because they do not have <Input className={`mt-2 w-full ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>.</p></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><div className="flex-1"><p>Metacognition involves children understanding their own learning strategies, as well as developing <Input className={`mt-2 w-full ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>.</p></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><div className="flex-1"><p>Teachers who rely on what is known as <Input className={`mt-2 w-full ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> often produce sets of impressive grades in class tests.</p></div></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-L, below.</strong></p><p className="mb-4 italic">Write the correct letter, A-L, in boxes 27-31 on your answer sheet.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">The value attached to original works of art</h4><p>People go to art museums because they accept the value of seeing an original work of art. But they do not go to museums to read original manuscripts of novels, perhaps because the availability of novels has depended on <strong>27</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> for so long, and also because with novels, the <strong>28</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> are the most important thing.</p><p>However, in historical times artists such as Leonardo were happy to instruct <strong>29</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/> to produce copies of their work and these days new methods of reproduction allow excellent replication of surface relief features as well as colour and <strong>30</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>.</p><p>It is regrettable that museums still promote the superiority of original works of art, since this may not be in the interests of the <strong>31</strong> <Input className={`inline w-16 mx-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="..."/>.</p></div><div className="border border-gray-300 p-4 bg-gray-50"><div className="grid grid-cols-3 gap-2"><div><strong>A</strong> institution</div><div><strong>B</strong> mass production</div><div><strong>C</strong> mechanical processes</div><div><strong>D</strong> public</div><div><strong>E</strong> paints</div><div><strong>F</strong> artist</div><div><strong>G</strong> size</div><div><strong>H</strong> underlying ideas</div><div><strong>I</strong> basic technology</div><div><strong>J</strong> readers</div><div><strong>K</strong> picture frames</div><div><strong>L</strong> assistants</div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-35</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><p className="mb-4 italic">Write the correct letter in boxes 32-35 on your answer sheet.</p><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><div className="flex-1"><p>The writer mentions London's National Gallery to illustrate</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> the undesirable cost to a nation of maintaining a huge collection of art.</p><p><strong>B</strong> the conflict that may arise in society between financial and artistic values.</p><p><strong>C</strong> the negative effect a museum can have on visitors' opinions of themselves.</p><p><strong>D</strong> the need to put individual well-being above large-scale artistic schemes.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">33</span><div className="flex-1"><p>The writer says that today, viewers may be unwilling to criticise a work because</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> they lack the knowledge needed to support an opinion.</p><p><strong>B</strong> they fear it may have financial implications.</p><p><strong>C</strong> they have no real concept of the work's value.</p><p><strong>D</strong> they feel their personal reaction is of no significance.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">34</span><div className="flex-1"><p>According to the writer, the 'displacement effect' on the visitor is caused by</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> the variety of works on display and the way they are arranged.</p><p><strong>B</strong> the impossibility of viewing particular works of art over a long period.</p><p><strong>C</strong> the similar nature of the paintings and the lack of great works.</p><p><strong>D</strong> the inappropriate nature of the individual works selected for exhibition.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">35</span><div className="flex-1"><p>The writer says that unlike other forms of art, a painting does not</p><div className="ml-4 mt-2 space-y-1"><p><strong>A</strong> involve direct contact with an audience.</p><p><strong>B</strong> require a specific location for a performance.</p><p><strong>C</strong> need the involvement of other professionals.</p><p><strong>D</strong> have a specific beginning or end.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36-40</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 3?</strong></p><p className="mb-4 italic">In boxes 36-40 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the views of the writer</p><p><strong>NO</strong> if the statement contradicts the views of the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">36</span><div className="flex-1"><p>Art history should focus on discovering the meaning of art using a range of media.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><div className="flex-1"><p>The approach of art historians conflicts with that of art museums.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>People should be encouraged to give their opinions openly on works of art.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>Reproductions of fine art should only be sold to the public if they are of high quality.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>In the future, those with power are likely to encourage more people to enjoy art.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div>
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
                    {(() => {
                      const questionNumbers = Object.keys(correctAnswers).filter(q => q !== '23a' && q !== '23b')
                      questionNumbers.push('23') // Add question 23 as a single question
                      
                      return questionNumbers.map(question => {
                        if (question === '23') {
                          const userAnswer = `${answers['23a'] || ''} , ${answers['23b'] || ''}`;
                          const isCorrect = checkAnswer(question);
                          return (
                            <div key={question} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                              <div className="text-sm space-y-1">
                                <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div>
                                <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">books , activities</span></div>
                              </div>
                            </div>
                          );
                        }
                        
                        const userAnswer = answers[question] || '';
                        const isCorrect = checkAnswer(question);
                        const correctAnswer = correctAnswers[question as keyof typeof correctAnswers];
                        return (
                          <div key={question} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                            <div className="text-sm space-y-1">
                              <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div>
                              <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(() => {
                      const questionNumbers = Object.keys(correctAnswers).filter(q => q !== '23a' && q !== '23b')
                      questionNumbers.push('23') // Add question 23 as a single question
                      
                      return questionNumbers.map(question => {
                        if (question === '23') {
                          return (
                            <div key={question} className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="font-semibold">{question}:</span>
                              <span className="text-gray-800">books , activities</span>
                            </div>
                          );
                        }
                        
                        const correctAnswer = correctAnswers[question as keyof typeof correctAnswers];
                        return (
                          <div key={question} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="font-semibold">{question}:</span>
                            <span className="text-gray-800">{correctAnswer}</span>
                          </div>
                        );
                      });
                    })()}
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
                    <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(() => {
                      const questionNumbers = Object.keys(correctAnswers).filter(q => q !== '23a' && q !== '23b')
                      questionNumbers.push('23') // Add question 23 as a single question
                      
                      return questionNumbers.map((questionNumber) => {
                        if (questionNumber === '23') {
                          const userAnswer = `${answers['23a'] || ''} , ${answers['23b'] || ''}`;
                          const isCorrect = checkAnswer(questionNumber);
                          return (
                            <div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                              <div className="text-sm space-y-1">
                                <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div>
                                <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">books , activities</span></div>
                              </div>
                            </div>
                          );
                        }
                        
                        const userAnswer = answers[questionNumber] || '';
                        const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers];
                        const isCorrect = checkAnswer(questionNumber);
                        return (
                          <div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                            <div className="text-sm space-y-1">
                              <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div>
                              <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div>
                            </div>
                          </div>
                        );
                      });
                    })()}</div></div>
                    <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
        {/* Analytics Components */}
        <PageViewTracker 
          book="book-10" 
          module="reading" 
          testNumber={2}
        />
        
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <TestStatistics 
            book="book-10"
            module="reading"
            testNumber={2}
          />
          
          <UserTestHistory 
            book="book-10"
            module="reading"
            testNumber={2}
          />
        </div>

                </div>
    </div>
  )
}
        {/* Test Information and Statistics */}
        {/* Analytics Components */}
        <PageViewTracker 
          book="book-10" 
          module="reading" 
          testNumber={2}
        />
        
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <TestStatistics 
            book="book-10"
            module="reading"
            testNumber={2}
          />
          
          <UserTestHistory 
            book="book-10"
            module="reading"
            testNumber={2}
          />
        </div>

      </div>
    </div>
  )
}