'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import { getIELTSReadingScore } from '@/lib/utils'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'

export default function Book12ReadingTest7() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
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
    setTestStartTime(Date.now());
  };

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }))
  }
  
  const correctAnswers = {
    '1': 'v', '2': 'iii', '3': 'viii', '4': 'i', '5': 'iv', '6': 'vi', '7': 'ii',
    '8': 'pirates', '9': 'food', '10': 'oil', '11': 'settlers', '12': 'species', '13': 'eggs',
    '14': 'D', '15': 'C', '16': 'F', '17': 'G', '18': 'D', '19': 'B',
    '20': 'vaccinations', '21': 'antibiotics', '22': 'mosquito/mosquitos/mosquitoes', '23': 'factories', '24': 'forests', '25': 'polio', '26': 'mountain',
    '27': 'dopamine', '28': 'pleasure', '29': 'caudate', '30': 'anticipatory phase', '31': 'food',
    '32': 'B', '33': 'C', '34': 'A', '35': 'B', '36': 'D',
    '37': 'F', '38': 'B', '39': 'E', '40': 'C'
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const userAnswer = answers[questionNumber] || ''
    
    if (!userAnswer || userAnswer.trim() === '') {
      return false
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
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : (60*60) - timeLeft;
      
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
      
      const testScoreData = {
        book: 'book-12',
        module: 'reading',
        testNumber: 7,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || 0
      };
      
      const saveResult = await saveTestScore(testScoreData, session);
      
      if (saveResult.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', saveResult.error);
      }
      
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
      setIsSubmitting(false);
      setTimeLeft(0)
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


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 12 - Reading Test 7</h1>
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
                {isTestStarted && !submitted && (
                  <div className="text-sm text-blue-600 font-medium">Test in Progress</div>
                )}
                {submitted && (
                  <div className="text-sm text-green-600 font-medium">Test Completed</div>
                )}
              </div>
              {!isTestStarted && !submitted && (
                <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                  <p className="font-semibold">Instructions:</p>
                  <p>• You have 60 minutes to complete all 40 questions.</p>
                  <p>• Click &quot;Start Test&quot; to begin the timer. The test will auto-submit when the timer runs out.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
                  Select text to highlight
                </div>
              </div>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
                 <Card>
                    <CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <h3 className="font-bold text-lg text-center">Flying tortoises</h3>
                      <p><b>A</b> Forests of spiny cacti cover much of the uneven lava plains that separate the interior of the Galapagos island of Isabela from the Pacific Ocean. With its five distinct volcanoes, the island resembles a lunar landscape. Only the thick vegetation at the skirt of the often cloud-covered peak of Sierra Negra offers respite from the barren terrain below. This inhospitable environment is home to the giant Galapagos tortoise. Some time after the Galapagos’s birth, around five million years ago, the islands were colonised by one or more tortoises from mainland South America. As these ancestral tortoises settled on the individual islands, the different populations adapted to their unique environments, giving rise to at least 14 different subspecies. Island life agreed with them. In the absence of significant predators, they grew to become the largest and longest-living tortoises on the planet, weighing more than 400 kilograms, occasionally exceeding 1.8 metres in length and living for more than a century.</p>
                      <p><b>B</b> Before human arrival, the archipelago’s tortoises numbered in the hundreds of thousands. From the 17th century onwards, pirates took a few on board for food, but the arrival of whaling ships in the 1790s saw this exploitation grow exponentially. Relatively immobile and capable of surviving for months without food or water, the tortoises were taken on board these ships to act as food supplies during long ocean passages. Sometimes, their bodies were processed into high-grade oil. In total, an estimated 200,000 animals were taken from the archipelago before the 20th century. This historical exploitation was then exacerbated when settlers came to the islands. They hunted the tortoises and destroyed their habitat to clear land for agriculture. They also introduced alien species – ranging from cattle, pigs, goats, rats and dogs to plants and ants – that either prey on the eggs and young tortoises or damage or destroy their habitat.</p>
                      <p><b>C</b> Today, only 11 of the original subspecies survive and of these, several are highly endangered. In 1989, work began on a tortoise-breeding centre just outside the town of Puerto Villamil on Isabela, dedicated to protecting the island’s tortoise populations. The centre’s captive-breeding programme proved to be extremely successful, and it eventually had to deal with an overpopulation problem.</p>
                      <p><b>D</b> The problem was also a pressing one. Captive-bred tortoises can’t be reintroduced into the wild until they’re at least five years old and weigh at least 4.5 kilograms, at which point their size and weight – and their hardened shells – are sufficient to protect them from predators. But if people wait too long after that point, the tortoises eventually become too large to transport.</p>
                      <p><b>E</b> For years, repatriation efforts were carried out in small numbers, with the tortoises carried on the backs of men over weeks of long, treacherous hikes along narrow trails. But in November 2010, the environmentalist and Galapagos National Park liaison officer Godfrey Merlin, a visiting private motor yacht captain and a helicopter pilot gathered around a table in a small café in Puerto Ayora on the island of Santa Cruz to work out a more ambitious reintroduction. The aim was to use a helicopter to move 300 of the breeding centre’s tortoises to various locations close to Sierra Negra.</p>
                      <p><b>F</b> This unprecedented effort was made possible by the owners of the 67-metre yacht White Cloud, who provided the Galapagos National Park with free use of their helicopter and its experienced pilot, as well as the logistical support of the yacht, its captain and crew. Originally an air ambulance, the yacht’s helicopter has a rear double door and a large internal space that’s well suited for cargo, so a custom crate was designed to hold up to 33 tortoises with a total weight of about 150 kilograms. This weight, together with that of the fuel, pilot and four crew, approached the helicopter’s maximum payload, and there were times when it was clearly right on the edge of the helicopter’s capabilities. During a period of three days, a group of volunteers from the breeding centre worked around the clock to prepare the young tortoises for transport. Meanwhile, park wardens, dropped off ahead of time in remote locations, cleared landing sites within the thick brush, cacti and lava rocks.</p>
                      <p><b>G</b> Upon their release, the juvenile tortoises quickly spread out over their ancestral territory, investigating their new surroundings and feeding on the vegetation. Eventually, one tiny tortoise came across a fully grown giant who had been lumbering around the island for around a hundred years. The two stood side by side, a powerful symbol of the regeneration of an ancient species.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <h3 className="font-bold text-lg text-center">The Intersection of Health Sciences and Geography</h3>
                      <p><b>A</b> While many diseases that affect humans have been eradicated due to improvements in vaccinations and the availability of healthcare, there are still areas around the world where certain health issues are more prevalent. In a world that is far more globalised than ever before, people come into contact with one another through travel and living closer and closer to each other. As a result, super-viruses and other infections resistant to antibiotics are becoming more and more common.</p>
                      <p><b>B</b> Geography can often play a very large role in the health concerns of certain populations. For instance, depending on where you live, you will not have the same health concerns as someone who lives in a different geographical region. Perhaps one of the most obvious examples of this idea is malaria-prone areas, which are usually tropical regions that foster a warm and damp environment in which the mosquitos that can give people this disease can grow. Malaria is much less of a problem in high-altitude deserts, for instance.</p>
                      <p><b>C</b> In some countries, geographical factors influence the health and well-being of the population in very obvious ways. In many large cities, the wind is not strong enough to clear the air of the massive amounts of smog and pollution that cause asthma, lung problems, eyesight issues and more in the people who live there. Part of the problem is, of course, the massive number of cars being driven, in addition to factories that run on coal power. The rapid industrialisation of some countries in recent years has also led to the cutting down of forests to allow for the expansion of big cities, which makes it even harder to fight the pollution with the fresh air that is produced by plants.</p>
                      <p><b>D</b> It is in situations like these that the field of health geography comes into its own. It is an increasingly important area of study in a world where diseases like polio are re-emerging, respiratory diseases continue to spread, and malaria-prone areas are still fighting to find a better cure. Health geography is the combination of, on the one hand, knowledge regarding geography and methods used to analyse and interpret geographical information, and on the other, the study of health, diseases and healthcare practices around the world. The aim of this hybrid science is to create solutions for common geography-based health problems. While people will always be prone to illness, the study of how geography affects our health could lead to the eradication of certain illnesses, and the prevention of others in the future. By understanding why and how we get sick, we can change the way we treat illness and disease specific to certain geographical locations.</p>
                      <p><b>E</b> The geography of disease and ill health analyses the frequency with which certain diseases appear in different parts of the world, and overlays the data with the geography of the region, to see if there could be a correlation between the two. Health geographers also study factors that could make certain individuals or a population more likely to be taken ill with a specific health concern or disease, as compared with the population of another area. Health geographers in this field are usually trained as healthcare workers, and have an understanding of basic epidemiology as it relates to the spread of diseases among the population.</p>
                      <p><b>F</b> Researchers study the interactions between humans and their environment that could lead to illness (such as asthma in places with high levels of pollution) and work to create a clear way of categorising illnesses, diseases and epidemics into local and global scales. Health geographers can map the spread of illnesses and attempt to identify the reasons behind an increase or decrease in illnesses, as they work to find a way to halt the further spread or re-emergence of diseases in vulnerable populations.</p>
                      <p><b>G</b> The second subcategory of health geography is the geography of healthcare provision. This group studies the availability (or lack thereof) of healthcare resources to individuals and populations around the world. In both developed and developing nations there is often a very large discrepancy between the options available to people in different social classes, income brackets, and levels of education. Individuals working in the area of the geography of healthcare provision attempt to assess the levels of healthcare in the area (for instance, it may be very difficult for people to get medical attention because there is a mountain between their village and the nearest hospital). These researchers are on the frontline of making recommendations regarding policy to international organisations, local government bodies and others.</p>
                      <p><b>H</b> The field of health geography is often overlooked, but it constitutes a huge area of need in the fields of geography and healthcare. If we can understand how geography affects our health no matter where in the world we are located, we can better treat disease, prevent illness, and keep people safe and well.</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <h3 className="font-bold text-lg text-center">Music and the emotions</h3>
                        <p>Why does music make us feel? On the one hand, music is a purely abstract art form, devoid of language or explicit ideas. And yet, even though music says little, it still manages to touch us deeply. When listening to our favourite songs, our body betrays all the symptoms of emotional arousal. The pupils in our eyes dilate, our pulse and blood pressure rise, the electrical conductance of our skin is lowered, and the cerebellum, a brain region associated with bodily movement, becomes strangely active. Blood is even re-directed to the muscles in our legs. In other words, sound stirs us at our biological roots.</p>
                        <p>A recent paper in Nature Neuroscience by a research team in Montreal, Canada, marks an important step in revealing the precise underpinnings of ‘the potent pleasurable stimulus’ that is music. Although the study involves plenty of fancy technology, including functional magnetic resonance imaging (fMRI) and ligand-based positron emission tomography (PET) scanning, the experiment itself was rather straightforward. After screening 217 individuals who responded to advertisements requesting people who experience ‘chills’ to instrumental music, the scientists narrowed down the subject pool to ten. They then asked the subjects to bring in their playlist of favourite songs – virtually every genre was represented, from techno to tango – and played them the music while their brain activity was monitored. Because the scientists were combining methodologies (PET and fMRI), they were able to obtain an impressively exact and detailed portrait of music in the brain. The first thing they discovered is that music triggers the production of dopamine – a chemical with a key role in setting people’s moods – by the neurons (nerve cells) in both the dorsal and ventral regions of the brain. As these two regions have long been linked with the experience of pleasure, this finding isn’t particularly surprising.</p>
                        <p>What is rather more significant is the finding that the dopamine neurons in the caudate – a region of the brain involved in learning stimulus-response associations, and in anticipating food and other ‘reward’ stimuli – were at their most active around 15 seconds before the participants’ favourite moments in the music. The researchers call this the ‘anticipatory phase’ and argue that the purpose of this activity is to help us predict the arrival of our favourite part. The question, of course, is what all these dopamine neurons are up to. Why are they so active in the period preceding the acoustic climax? After all, we typically associate surges of dopamine with pleasure, with the processing of actual rewards. And yet, this cluster of cells is most active when the ‘chills’ have yet to arrive, when the melodic pattern is still unresolved.</p>
                        <p>One way to answer the question is to look at the music and not the neurons. While music can often seem (at least to the outsider) like a labyrinth of intricate patterns, it turns out that the most important part of every song or symphony is when the patterns break down, when the sound becomes unpredictable. If the music is too obvious, it is annoyingly boring, like an alarm clock. Numerous studies, after all, have demonstrated that dopamine neurons quickly adapt to predictable rewards. If we know what’s going to happen next, then we don’t get excited. This is why composers often introduce a key note in the beginning of a song, spend most of the rest of the piece in the studious avoidance of the pattern, and then finally repeat it only at the end. The longer we are denied the pattern we expect, the greater the emotional release when the pattern returns, safe and sound.</p>
                        <p>To demonstrate this psychological principle, the musicologist Leonard Meyer, in his classic book Emotion and Meaning in Music (1956), analysed the 5th movement of Beethoven’s String Quartet in C-sharp minor, Op. 131. Meyer wanted to show how music is defined by its flirtation with – but not submission to – our expectations of order. Meyer dissected 50 measures (bars) of the masterpiece, showing how Beethoven begins with the clear statement of a rhythmic and harmonic pattern and then, in an ingenious tonal dance, carefully holds off repeating it. What Beethoven does instead is suggest variations of the pattern. He wants to preserve an element of uncertainty in his music, making our brains beg for the one chord he refuses to give us. Beethoven saves that chord for the end.</p>
                        <p>According to Meyer, it is the suspenseful tension of music, arising out of our unfulfilled expectations, that is the source of the music’s feeling. While earlier theories of music focused on the way a sound can refer to the real world of images and experiences – its ‘connotative’ meaning – Meyer argued that the emotions we find in music come from the unfolding events of the music itself. This ‘embodied meaning’ arises from the patterns the symphony invokes and then ignores. It is this uncertainty that triggers the surge of dopamine in the caudate, as we struggle to figure out what will happen next. We can predict some of the notes, but we can’t predict them all, and that is what keeps us listening, waiting expectantly for our reward, for the pattern to be completed.</p>
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
                  <button 
                    onClick={() => setActiveTab('section1')} 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'section1' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Section 1: Q 1-13
                  </button>
                  <button 
                    onClick={() => setActiveTab('section2')} 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'section2' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Section 2: Q 14-26
                  </button>
                  <button 
                    onClick={() => setActiveTab('section3')} 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'section3' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Section 3: Q 27-40
                  </button>
                </div>
              </div>

              {activeTab === 'section1' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questions 1-13</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 1-7</h3>
                      <p className="mb-4">Choose the correct heading for each paragraph from the list of headings below.</p>
                      <div className="border p-4 rounded-md mb-4 bg-slate-50">
                          <h4 className="font-bold mb-2">List of Headings</h4>
                          <ul className="list-roman list-inside text-sm">
                              <li>i. The importance of getting the timing right</li>
                              <li>ii. Young meets old</li>
                              <li>iii. Developments to the disadvantage of tortoise populations</li>
                              <li>iv. Planning a bigger idea</li>
                              <li>v. Tortoises populate the islands</li>
                              <li>vi. Carrying out a carefully prepared operation</li>
                              <li>vii. Looking for a home for the islands’ tortoises</li>
                              <li>viii. The start of the conservation project</li>
                          </ul>
                      </div>
                      <div className="space-y-2">
                         <p><b>1</b> Paragraph A <Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('1') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['1']})</span>}</p>
                         <p><b>2</b> Paragraph B <Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('2') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['2']})</span>}</p>
                         <p><b>3</b> Paragraph C <Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('3') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['3']})</span>}</p>
                         <p><b>4</b> Paragraph D <Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('4') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['4']})</span>}</p>
                         <p><b>5</b> Paragraph E <Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('5') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['5']})</span>}</p>
                         <p><b>6</b> Paragraph F <Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('6') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['6']})</span>}</p>
                         <p><b>7</b> Paragraph G <Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('7') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['7']})</span>}</p>
                      </div>
                    </div>
                    <hr />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 8-13</h3>
                      <p className="mb-4">Complete the notes below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                      <div className="border p-4 rounded-md bg-slate-50 space-y-2">
                        <h4 className="font-bold text-center mb-4">The decline of the Galapagos tortoise</h4>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Originally from mainland South America</li>
                          <li>Numbers on Galapagos islands increased, due to lack of predators</li>
                          <li>17th century: small numbers taken onto ships used by <b>8</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || submitted} />.</li>
                          <li>1790s: very large numbers taken onto whaling ships, kept for <b>9</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || submitted} />, and also used to produce <b>10</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || submitted} />.</li>
                          <li>Hunted by <b>11</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || submitted} /> on the islands.</li>
                          <li>Habitat destruction: for the establishment of agriculture and by various <b>12</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || submitted} /> not native to the islands, which also fed on baby tortoises and tortoises' <b>13</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || submitted} />.</li>
                        </ul>
                        {submitted && ['8', '9', '10', '11', '12', '13'].some(q => getAnswerStatus(q) === 'incorrect') && (
                        <div className="text-sm text-green-600 mt-2">
                            Correct answers: 
                            {getAnswerStatus('8') === 'incorrect' && ` 8. ${correctAnswers['8']}`}
                            {getAnswerStatus('9') === 'incorrect' && ` 9. ${correctAnswers['9']}`}
                            {getAnswerStatus('10') === 'incorrect' && ` 10. ${correctAnswers['10']}`}
                            {getAnswerStatus('11') === 'incorrect' && ` 11. ${correctAnswers['11']}`}
                            {getAnswerStatus('12') === 'incorrect' && ` 12. ${correctAnswers['12']}`}
                            {getAnswerStatus('13') === 'incorrect' && ` 13. ${correctAnswers['13']}`}
                        </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'section2' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questions 14-26</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 14-19</h3>
                    <p className="mb-4">Which paragraph contains the following information?</p>
                    <div className="space-y-3">
                       <p><b>14</b> an acceptance that not all diseases can be totally eliminated <Input value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('14') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['14']})</span>}</p>
                       <p><b>15</b> examples of physical conditions caused by human behaviour <Input value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('15') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['15']})</span>}</p>
                       <p><b>16</b> a reference to classifying diseases on the basis of how far they extend geographically <Input value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('16') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['16']})</span>}</p>
                       <p><b>17</b> reasons why the level of access to healthcare can vary within a country <Input value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('17') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['17']})</span>}</p>
                       <p><b>18</b> a description of health geography as a mixture of different academic fields <Input value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('18') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['18']})</span>}</p>
                       <p><b>19</b> a description of the type of area where a particular illness is rare <Input value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('19') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['19']})</span>}</p>
                    </div>
                  </div>
                  <hr />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 20-26</h3>
                    <p className="mb-4">Complete the sentences below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                    <div className="space-y-3">
                      <p><b>20</b> Certain diseases have disappeared, thanks to better <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || submitted} /> and healthcare.</p>
                      <p><b>21</b> Because there is more contact between people, <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || submitted} /> are losing their usefulness.</p>
                      <p><b>22</b> Disease-causing <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || submitted} /> are most likely to be found in hot, damp regions.</p>
                      <p><b>23</b> One cause of pollution is <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || submitted} /> that burn a particular fuel.</p>
                      <p><b>24</b> The growth of cities often has an impact on nearby <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
                      <p><b>25</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || submitted} /> is one disease that is growing after having been eradicated.</p>
                      <p><b>26</b> A physical barrier such as a <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || submitted} /> can prevent people from reaching a hospital.</p>
                      {submitted && ['20', '21', '22', '23', '24', '25', '26'].some(q => getAnswerStatus(q) === 'incorrect') && (
                        <div className="text-sm text-green-600 mt-2">
                          Correct answers:
                          {getAnswerStatus('20') === 'incorrect' && ` 20. ${correctAnswers['20']}`}
                          {getAnswerStatus('21') === 'incorrect' && ` 21. ${correctAnswers['21']}`}
                          {getAnswerStatus('22') === 'incorrect' && ` 22. ${correctAnswers['22']}`}
                          {getAnswerStatus('23') === 'incorrect' && ` 23. ${correctAnswers['23']}`}
                          {getAnswerStatus('24') === 'incorrect' && ` 24. ${correctAnswers['24']}`}
                          {getAnswerStatus('25') === 'incorrect' && ` 25. ${correctAnswers['25']}`}
                          {getAnswerStatus('26') === 'incorrect' && ` 26. ${correctAnswers['26']}`}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {activeTab === 'section3' && (
              <Card>
                <CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 27-31</h3>
                        <p className="mb-4">Complete the summary below. Choose <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.</p>
                        <div className="border p-4 rounded-md bg-slate-50 space-y-2">
                          <h4 className="font-bold text-center mb-2">The Montreal Study</h4>
                          <p>Participants, who were recruited for the study through advertisements, had their brain activity monitored while listening to their favourite music. It was noted that the music stimulated the brain’s neurons to release a substance called <b>27</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || submitted} /> in two of the parts of the brain which are associated with feeling <b>28</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
                          <p>Researchers also observed that the neurons in the area of the brain called the <b>29</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || submitted} /> were particularly active just before the participants' favourite moments in the music - the period known as the <b>30</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || submitted} />. Activity in this part of the brain is associated with the expectation of 'reward' stimuli such as <b>31</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
                          {submitted && ['27','28','29','30','31'].some(q => getAnswerStatus(q) === 'incorrect') && (
                            <div className="text-sm text-green-600 mt-2">
                                Correct answers: 
                                {getAnswerStatus('27') === 'incorrect' && ` 27. ${correctAnswers['27']}`}
                                {getAnswerStatus('28') === 'incorrect' && ` 28. ${correctAnswers['28']}`}
                                {getAnswerStatus('29') === 'incorrect' && ` 29. ${correctAnswers['29']}`}
                                {getAnswerStatus('30') === 'incorrect' && ` 30. ${correctAnswers['30']}`}
                                {getAnswerStatus('31') === 'incorrect' && ` 31. ${correctAnswers['31']}`}
                            </div>
                           )}
                        </div>
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 32-36</h3>
                        <p className="mb-4">Choose the correct letter, <b>A, B, C</b> or <b>D</b>.</p>
                        <p className="mb-4 text-sm text-gray-600">Write the correct letter in boxes 32-36 on your answer sheet.</p>
                        
                        <div className="space-y-6">
                          <div>
                            <p className="mb-3"><b>32</b> What point does the writer emphasise in the first paragraph?</p>
                            <div className="ml-4 space-y-2">
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q32" 
                                  value="A" 
                                  checked={answers['32'] === 'A'} 
                                  onChange={(e) => handleAnswerChange('32', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>A</b> how dramatically our reactions to music can vary</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q32" 
                                  value="B" 
                                  checked={answers['32'] === 'B'} 
                                  onChange={(e) => handleAnswerChange('32', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>B</b> how intense our physical responses to music can be</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q32" 
                                  value="C" 
                                  checked={answers['32'] === 'C'} 
                                  onChange={(e) => handleAnswerChange('32', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>C</b> how little we know about the way that music affects us</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q32" 
                                  value="D" 
                                  checked={answers['32'] === 'D'} 
                                  onChange={(e) => handleAnswerChange('32', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>D</b> how much music can tell us about how our brains operate</label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="mb-3"><b>33</b> What view of the Montreal study does the writer express in the second paragraph?</p>
                            <div className="ml-4 space-y-2">
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q33" 
                                  value="A" 
                                  checked={answers['33'] === 'A'} 
                                  onChange={(e) => handleAnswerChange('33', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>A</b> Its aims were innovative.</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q33" 
                                  value="B" 
                                  checked={answers['33'] === 'B'} 
                                  onChange={(e) => handleAnswerChange('33', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>B</b> The approach was too simplistic.</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q33" 
                                  value="C" 
                                  checked={answers['33'] === 'C'} 
                                  onChange={(e) => handleAnswerChange('33', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>C</b> It produced some remarkably precise data.</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q33" 
                                  value="D" 
                                  checked={answers['33'] === 'D'} 
                                  onChange={(e) => handleAnswerChange('33', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>D</b> The technology used was unnecessarily complex.</label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="mb-3"><b>34</b> What does the writer find interesting about the results of the Montreal study?</p>
                            <div className="ml-4 space-y-2">
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q34" 
                                  value="A" 
                                  checked={answers['34'] === 'A'} 
                                  onChange={(e) => handleAnswerChange('34', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>A</b> the timing of participants' neural responses to the music</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q34" 
                                  value="B" 
                                  checked={answers['34'] === 'B'} 
                                  onChange={(e) => handleAnswerChange('34', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>B</b> the impact of the music on participants' emotional state</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q34" 
                                  value="C" 
                                  checked={answers['34'] === 'C'} 
                                  onChange={(e) => handleAnswerChange('34', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>C</b> the section of participants' brains which was activated by the music</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q34" 
                                  value="D" 
                                  checked={answers['34'] === 'D'} 
                                  onChange={(e) => handleAnswerChange('34', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>D</b> the type of music which had the strongest effect on participants' brains</label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="mb-3"><b>35</b> Why does the writer refer to Meyer's work on music and emotion?</p>
                            <div className="ml-4 space-y-2">
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q35" 
                                  value="A" 
                                  checked={answers['35'] === 'A'} 
                                  onChange={(e) => handleAnswerChange('35', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>A</b> to propose an original theory about the subject</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q35" 
                                  value="B" 
                                  checked={answers['35'] === 'B'} 
                                  onChange={(e) => handleAnswerChange('35', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>B</b> to offer support for the findings of the Montreal study</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q35" 
                                  value="C" 
                                  checked={answers['35'] === 'C'} 
                                  onChange={(e) => handleAnswerChange('35', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>C</b> to recommend the need for further research into the subject</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q35" 
                                  value="D" 
                                  checked={answers['35'] === 'D'} 
                                  onChange={(e) => handleAnswerChange('35', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>D</b> to present a view which opposes that of the Montreal researchers</label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="mb-3"><b>36</b> According to Leonard Meyer, what causes the listener's emotional response to music?</p>
                            <div className="ml-4 space-y-2">
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q36" 
                                  value="A" 
                                  checked={answers['36'] === 'A'} 
                                  onChange={(e) => handleAnswerChange('36', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>A</b> the way that the music evokes poignant memories in the listener</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q36" 
                                  value="B" 
                                  checked={answers['36'] === 'B'} 
                                  onChange={(e) => handleAnswerChange('36', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>B</b> the association of certain musical chords with certain feelings</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q36" 
                                  value="C" 
                                  checked={answers['36'] === 'C'} 
                                  onChange={(e) => handleAnswerChange('36', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>C</b> the listener's sympathy with the composer's intentions</label>
                              </div>
                              <div className="flex items-start space-x-2">
                                <input 
                                  type="radio" 
                                  name="q36" 
                                  value="D" 
                                  checked={answers['36'] === 'D'} 
                                  onChange={(e) => handleAnswerChange('36', e.target.value)} 
                                  disabled={!isTestStarted || submitted}
                                  className="mt-1"
                                />
                                <label className="text-sm"><b>D</b> the internal structure of the musical composition</label>
                              </div>
                            </div>
                          </div>

                          {submitted && ['32', '33', '34', '35', '36'].some(q => getAnswerStatus(q) === 'incorrect') && (
                            <div className="text-sm text-green-600 mt-4 p-3 bg-green-50 rounded">
                                <b>Correct answers:</b>
                                {getAnswerStatus('32') === 'incorrect' && ` 32. ${correctAnswers['32']}`}
                                {getAnswerStatus('33') === 'incorrect' && ` 33. ${correctAnswers['33']}`}
                                {getAnswerStatus('34') === 'incorrect' && ` 34. ${correctAnswers['34']}`}
                                {getAnswerStatus('35') === 'incorrect' && ` 35. ${correctAnswers['35']}`}
                                {getAnswerStatus('36') === 'incorrect' && ` 36. ${correctAnswers['36']}`}
                            </div>
                          )}
                        </div>
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 37-40</h3>
                        <p className="mb-4">Complete each sentence with the correct ending, <b>A-F</b>, below.</p>
                        <div className="border p-4 rounded-md mb-4 bg-slate-50">
                          <ul className="list-none text-sm space-y-1">
                              <li><b>A</b> our response to music depends on our initial emotional state.</li>
                              <li><b>B</b> neuron activity decreases if outcomes become predictable.</li>
                              <li><b>C</b> emotive music can bring to mind actual pictures and events.</li>
                              <li><b>D</b> experiences in our past can influence our emotional reaction to music.</li>
                              <li><b>E</b> emotive music delays giving listeners what they expect to hear.</li>
                              <li><b>F</b> neuron activity increases prior to key points in a musical piece.</li>
                          </ul>
                        </div>
                        <div className="space-y-3">
                           <p><b>37</b> The Montreal researchers discovered that <Input value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-16 ml-1 ${submitted ? (getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /></p>
                           <p><b>38</b> Many studies have demonstrated that <Input value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-16 ml-1 ${submitted ? (getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /></p>
                           <p><b>39</b> Meyer's analysis of Beethoven's music shows that <Input value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-16 ml-1 ${submitted ? (getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /></p>
                           <p><b>40</b> Earlier theories of music suggested that <Input value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-16 ml-1 ${submitted ? (getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /></p>
                           {submitted && ['37', '38', '39', '40'].some(q => getAnswerStatus(q) === 'incorrect') && (
                            <div className="text-sm text-green-600 mt-2">
                                Correct answers: 
                                {getAnswerStatus('37') === 'incorrect' && ` 37. ${correctAnswers['37']}`}
                                {getAnswerStatus('38') === 'incorrect' && ` 38. ${correctAnswers['38']}`}
                                {getAnswerStatus('39') === 'incorrect' && ` 39. ${correctAnswers['39']}`}
                                {getAnswerStatus('40') === 'incorrect' && ` 40. ${correctAnswers['40']}`}
                            </div>
                           )}
                        </div>
                    </div>
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubmit} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" 
              size="lg" 
              disabled={!isTestStarted || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
            {!isTestStarted ? (
              <p className="text-sm text-blue-600 mt-2">Start the test to enable submission</p>
            ) : (
              <p className="text-sm text-gray-600 mt-2">Make sure you have answered all questions before submitting</p>
            )}
          </div>
        )}

        {submitted && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div>
                <div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div>
                <div className="flex justify-center space-x-4 mt-6">
                  <Button onClick={handleReset} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">
                    {showAnswers ? 'Hide' : 'Show'} Answer Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center mt-8">
          {!submitted && (
            <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
          )}
        </div>

        {showAnswers && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Answer Key</CardTitle>
              {submitted && (
                <p className="text-sm text-gray-600">
                  <span className="text-green-600">Green</span> = Correct, <span className="text-red-600 ml-2">Red</span> = Incorrect
                </p>
              )}
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(correctAnswers).map(([question, answer]) => {
                    const userAnswer = answers[question] || '';
                    const isCorrect = checkAnswer(question);
                    return (
                      <div 
                        key={question} 
                        className={`p-3 rounded border ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Question {question}</span>
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
                            <span className="font-medium text-green-700">{answer}</span>
                          </div>
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

        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  {Object.keys(correctAnswers).map((questionNumber) => {
                    const userAnswer = answers[questionNumber] || '';
                    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers];
                    const isCorrect = checkAnswer(questionNumber);
                    return (
                      <div 
                        key={questionNumber} 
                        className={`p-3 rounded border ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Question {questionNumber}</span>
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
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">
                  Close
                </Button>
                <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        <PageViewTracker 
          book="book-12" 
          module="reading" 
          testNumber={7} 
        />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <TestStatistics book="book-12" module="reading" testNumber={7} />
            <UserTestHistory book="book-12" module="reading" testNumber={7} />
          </div>
        </div>

      </div>
    </div>
  )
}