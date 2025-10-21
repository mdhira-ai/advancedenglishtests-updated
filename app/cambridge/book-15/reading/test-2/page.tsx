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
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { TestStatistics } from '@/components/analytics/TestStatistics'
import { UserTestHistory } from '@/components/analytics/UserTestHistory'
import { saveTestScore } from '@/lib/test-score-saver'
import { useSession } from '@/lib/auth-client'

export default function Book15ReadingTest2() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Track test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);

  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [activeTab, setActiveTab] = useState('section1')
  const { clearAllHighlights } = useTextHighlighter()

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTestStarted && !submitted && timeLeft > 0) {
      interval = setInterval(() => { setTimeLeft(prevTime => { if (prevTime <= 1) { handleSubmit(); return 0; } return prevTime - 1; }); }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTestStarted, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestStart = () => setIsTestStarted(true);
  const handleAnswerChange = (qNum: string, value: string) => setAnswers(prev => ({ ...prev, [qNum]: value }))

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''

    if (!user) return false;
    // Ensure correct is a string when calling checkAnswerWithMatching
    const correctStr = Array.isArray(correct) ? correct.join(' or ') : correct;
    return checkAnswerWithMatching(user, correctStr, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&')) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, results: Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      // Save test score using test-score-saver
      const result = await saveTestScore({
        book: 'book-15',
        module: 'reading',
        testNumber: 2,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      }, session);
      
      if (!result.success) {
        console.error('Failed to save test score:', result.error);
      } else {
        console.log('Test score saved successfully');
      }
      setSubmitted(true); setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      const calculatedScore = calculateScore(); setScore(calculatedScore); setSubmitted(true); setShowResultsPopup(true);
    } finally { setIsSubmitting(false); }
  }

  const handleReset = () => {
    setAnswers({}); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'B', '2': 'C', '3': 'F', '4': 'D', '5': 'E', '6': 'A', '7': 'safety', '8': 'traffic', '9': 'carriageway', '10': 'mobile', '11': 'dangerous', '12': 'communities', '13': 'healthy',
    '14': 'F', '15': 'A', '16': 'D', '17': 'A', '18': 'genetic traits', '19': 'heat loss', '20': 'ears', '21': '(insulating) fat', '22': '(carbon) emissions', '23': 'B', '24': 'C', '25': 'A', '26': 'C',
    '27': 'C', '28': 'A', '29': 'B', '30': 'B', '31': 'D', '32': 'F', '33': 'H', '34': 'C', '35': 'D', '36': 'E', '37': 'NOT GIVEN', '38': 'YES', '39': 'NO', '40': 'NO'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-15" module="reading" testNumber={2} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 15 - Reading Test 2</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Could urban engineers learn from dance?</h3>
                  <p>A. The way we travel around cities has a major impact on whether they are sustainable. Transportation is estimated to account for 30% of energy consumption in most of the world’s most developed nations, so lowering the need for energy-using vehicles is essential for decreasing the environmental impact of mobility. But as more and more people move to cities, it is important to think about other kinds of sustainable travel too. The ways we travel affect our physical and mental health, our social lives, our access to work and culture, and the air we breathe. Engineers are tasked with changing how we travel around cities for the better, but the engineering industry still works on the assumptions that led to the creation of the energy-consuming transport systems we have now: the emphasis is placed solely on efficiency, speed, and quantitative data. Are there radical changes, to make it healthier, more enjoyable, and less environmentally damaging to travel around cities?</p>
                  <p>B. Dance might hold some of the answers. That is not to suggest everyone should dance their way to work, however healthy and happy it might make us, but rather that the techniques used by choreographers to experiment with and design movement in dance could provide engineers with tools to stimulate new ideas in city-making. Richard Sennett, an influential urbanist and sociologist who has transformed ideas about the way cities are made, argues that urban design has suffered from a separation between mind and body since the introduction of the architectural blueprint.</p>
                  <p>C. Whereas medieval builders improvised and adapted construction through their intimate knowledge of materials and personal experience of the conditions on a site, building designs are now conceived and stored in media technologies that detach the designer from the physical and social realities they are creating. While the design practices created by these new technologies are essential for managing the technical complexity of the modern city, they have the drawback of simplifying reality in the process.</p>
                  <p>D. To illustrate, Sennett discusses the Peachtree Center in Atlanta, USA, a development typical of the modernist approach to urban planning prevalent in the 1970s. Peachtree created a grid of streets and towers intended as a new pedestrian-friendly downtown for Atlanta. According to Sennett, this failed because its designers had invested too much faith in computer-aided design to tell them how it would operate. They failed to take into account that purpose-built street cafés could not operate in the hot sun without the protective awnings common in older buildings, and would need energy-consuming air conditioning instead, or that its giant car park would feel so unwelcoming that it would put people off getting out of their cars. What seems entirely predictable and controllable on screen has unexpected results when translated into reality.</p>
                  <p>E. The same is true in transport engineering, which uses models to predict and shape the way people move through the city. Again, these models are necessary, but they are built on specific world views in which certain forms of efficiency and safety are considered and other experiences of the city ignored. Designs that seem logical in models appear counter-intuitive in the actual experience of their users. The guard rails that will be familiar to anyone who has attempted to cross a British road, for example, were an engineering solution to pedestrian safety based on models that prioritised the smooth flow of traffic. On wide major roads, they often guide pedestrians to specific crossing points and slow down their progress across the road by using staggered access points to divide the crossing into two – one for each carriageway. In doing so they make crossings feel longer, introducing psychological barriers greatly impacting those that are the least mobile, and encouraging others to make dangerous crossings to get around the guard rails. These barriers don’t just make it harder to cross the road: they divide communities and decrease opportunities for healthy transport. As a result, many are now being removed, causing disruption, cost, and waste.</p>
                  <p>F. If their designers had had the tools to think with their bodies – like dancers – and imagine how these barriers would feel, there might have been a better solution. In order to bring about fundamental changes to the ways we use our cities, engineering will need to develop a richer understanding of why people move in certain ways, and how this movement affects them. Choreography may not seem an obvious choice for tackling this problem. Yet it shares with engineering the aim of designing patterns of movement within limitations of space. It is an art form developed almost entirely by trying out ideas with the body, and gaining instant feedback on how the results feel. Choreographers have a deep understanding of the psychological, aesthetic, and physical implications of different ways of moving.</p>
                  <p>G. Observing the choreographer Wayne McGregor, cognitive scientist David Kirsh described how he ‘thinks with the body’. Kirsh argues that by using the body to simulate outcomes, McGregor is able to imagine solutions that would not be possible using purely abstract thought. This kind of physical knowledge is valued in many areas of expertise, but currently has no place in formal engineering design processes. A suggested method for transport engineers is to improvise design solutions and get instant feedback about how they would work from their own experience of them, or model designs at full scale in the way choreographers experiment with groups of dancers. Above all, perhaps, they might learn to design for emotional as well as functional effects.</p>
              </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <h3 className="text-center font-bold">Should we try to bring extinct species back to life?</h3>
                     <p>A. The passenger pigeon was a legendary species. Flying in vast numbers across North America, with potentially many millions within a single flock, their migration was once one of nature’s great spectacles. Sadly, the passenger pigeon’s existence came to an end on 1 September 1914, when the last living specimen died at Cincinnati Zoo. Geneticist Ben Novak is lead researcher on an ambitious project which now aims to bring the bird back to life through a process known as ‘de-extinction’. The basic premise involves using cloning technology to turn the DNA of extinct animals into a fertilised embryo, which is carried by the nearest relative still in existence – in this case, the abundant band-tailed pigeon – before being born as a living, breathing animal. Passenger pigeons are one of the pioneering species in this field, but they are far from the only ones on which this cutting-edge technology is being trialled.</p>
                     <p>B. In Australia, the thylacine, more commonly known as the Tasmanian tiger, is another extinct creature which genetic scientists are striving to bring back to life. 'There is no carnivore now in Tasmania that fills the niche which thylacines once occupied,' explains Michael Archer of the University of New South Wales. He points out that in the decades since the thylacine went extinct, there has been a spread in a 'dangerously debilitating' facial tumour syndrome which threatens the existence of the Tasmanian devils, the island's other notorious resident. Thylacines would have prevented this spread because they would have killed significant numbers of Tasmanian devils. 'If that contagious cancer had popped up previously, it would have burned out in whatever region it started. The return of thylacines to Tasmania could help to ensure that devils are never again subjected to risks of this kind.'</p>
                     <p>C. If extinct species can be brought back to life, can humanity begin to correct the damage it has caused to the natural world over the past few millennia? ‘The idea of de-extinction is that we can reverse this process, bringing species that no longer exist back to life,’ says Beth Shapiro of University of California Santa Cruz’s Genomics Institute. ‘I don’t think that we can do this. There is no way to bring back something that is 100 per cent identical to a species that went extinct a long time ago.’ A more practical approach for long-extinct species is to take the DNA of existing species as a template, ready for the insertion of strands of extinct animal DNA to create something new; a hybrid, based on the living species, but which looks and/or acts like the animal which died out.</p>
                     <p>D. This complicated process and questionable outcome begs the question: what is the actual point of this technology? ‘For us, the goal has always been replacing the extinct species with a suitable replacement,’ explains Novak. ‘When it comes to breeding, band-tailed pigeons scatter and make maybe one or two nests per hectare, whereas passenger pigeons were very social and would make 10,000 or more nests in one hectare.’ Since the disappearance of this key species, ecosystems in the eastern US have suffered, as the lack of disturbance caused by thousands of passenger pigeons wrecking trees and branches means there has been minimal need for regrowth. This has left forests stagnant and therefore unwelcoming to the plants and animals which evolved to help regenerate the forest after a disturbance. According to Novak, a hybridised band-tailed pigeon, with the added nesting habits of a passenger pigeon, could, in theory, re-establish that forest disturbance, thereby creating a habitat necessary for a great many other native species to thrive.</p>
                     <p>E. Another popular candidate for this technology is the woolly mammoth. George Church, professor at Harvard Medical School and leader of the Woolly Mammoth Revival Project, has been focusing on cold resistance, the main way in which the extinct woolly mammoth and its nearest living relative, the Asian elephant, differ. By pinpointing which genetic traits made it possible for mammoths to survive the icy climate of the tundra, the project’s goal is to return mammoths, or a mammoth-like species, to the area. ‘My highest priority would be preserving the endangered Asian elephant,’ says Church, ‘expanding their range to the huge ecosystem of the tundra. Necessary adaptations would include smaller ears, thicker hair, and extra insulating fat, all for the purpose of reducing heat loss in the tundra, and all traits found in the now extinct woolly mammoth.’ This repopulation of the tundra and boreal forests of Eurasia and North America with large mammals could also be a useful factor in reducing carbon emissions – elephants punch holes through snow and knock down trees, which encourages grass growth. This grass growth would reduce temperatures, and mitigate emissions from melting permafrost.</p>
                     <p>F. While the prospect of bringing extinct animals back to life might capture imaginations, it is, of course, far easier to try to save an existing species which is merely threatened with extinction. ‘Many of the technologies that people have in mind when they think about de-extinction can be used as a form of “genetic rescue”,’ explains Shapiro. She prefers to focus the debate on how this emerging technology could be used to fully understand why various species went extinct in the first place, and therefore how we could use it to make genetic modifications which could prevent mass extinctions in the future. ‘I would also say there’s an incredible moral hazard to not do anything at all,’ she continues. ‘We know that what we are doing today is not enough, and we have to be willing to take some calculated and measured risks.’</p>
              </CardContent></Card>
              
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Having a laugh</h3>
                  <p>The findings of psychological scientists reveal the importance of humour</p>
                  <p>Humans start developing a sense of humour as early as six weeks old, when babies begin to laugh and smile in response to stimuli. Laughter is universal across all human cultures and even exists in some form in rats, chimps, and bonobos. Like other human emotions and expressions, laughter and humour provide psychological scientists with rich resources for studying human psychology, ranging from the development of language to the neuroscience of social perception.</p>
                  <p>Theories focusing on the evolution of laughter point to it as an important adaptation for social communication. Take, for example, the recorded laughter in TV comedy shows. Back in 1950, US sound engineer Charley Douglass hated dealing with the unpredictable laughter of live audiences, so started recording his own ‘laugh tracks’. These were intended to help people at home feel like they were in a social situation, such as a crowded theatre. Douglass even recorded various types of laughter, as well as mixtures of laughter from men, women, and children. In doing so, he picked up on a quality of laughter that is now interesting researchers: a simple ‘haha’ communicates a remarkable amount of socially relevant information.</p>
                  <p>In one study conducted in 2016, samples of laughter from pairs of English-speaking students were recorded at the University of California, Santa Cruz. A team made up of more than 30 psychological scientists, anthropologists, and biologists then played these recordings to listeners from 24 diverse societies, from indigenous tribes in New Guinea to city-dwellers in India and Europe. Participants were asked whether they thought the people laughing were friends or strangers. On average, the results were remarkably consistent: worldwide, people’s guesses were correct approximately 60% of the time.</p>
                  <p>Researchers have also found that different types of laughter serve as codes to complex human social hierarchies. A team led by Christopher Oveis from the University of California, San Diego, found that high-status individuals had different laughs from low-status individuals, and that strangers’ judgements of an individual’s social status were influenced by the dominant or submissive quality of their laughter. In their study, 48 male college students were randomly assigned to groups of four, with each group composed of two low-status members, who had just joined their college fraternity group, and two high-status members, older students who had been active in the fraternity for at least two years. Laughter was recorded as each student took a turn at being teased by the others, involving the use of mildly insulting nicknames. Analysis revealed that, as expected, high-status individuals produced more dominant laughs and fewer submissive laughs relative to the low-status individuals. Meanwhile, low-status individuals were more likely to change their laughter based on their position of power; that is, the newcomers produced more dominant laughs when they were in the ‘powerful’ role of teasers. Dominant laughter was higher in pitch, louder, and more variable in tone than submissive laughter.</p>
                  <p>A random group of volunteers then listened to an equal number of dominant and submissive laughs from both the high- and low-status individuals, and were asked to estimate the social status of the laugher. In line with predictions, laughers producing dominant laughs were perceived to be significantly higher in status than laughers producing submissive laughs. ‘This was particularly true for low-status individuals, who were rated as significantly higher in status when displaying a dominant versus submissive laugh,’ Oveis and colleagues note. ‘Thus, by strategically displaying more dominant laughter when the context allows, low-status individuals may achieve higher status in the eyes of others.’ However, high-status individuals were rated as high-status whether they produced their natural dominant laugh or tried to do a submissive one.</p>
                  <p>Another study, conducted by David Cheng and Lu Wang of Australian National University, was based on the hypothesis that humour might provide a respite from tedious situations in the workplace. This ‘mental break’ might facilitate the replenishment of mental resources. To test this theory, the researchers recruited 74 business students, ostensibly for an experiment on perception. First, the students performed a tedious task in which they had to cross out every instance of the letter ‘e’ over two pages of text. The students then were randomly assigned to watch a video clip eliciting either humour, contentment, or neutral feelings. Some watched a clip of the BBC comedy Mr. Bean; others a relaxing scene with dolphins swimming in the ocean, and others a factual video about the management profession.</p>
                  <p>The students then completed a task requiring persistence, in which they were asked to guess the potential performance of employees based on provided profiles, and were told that making 10 correct assessments in a row would lead to a win. However, the software was programmed such that it was impossible to achieve 10 consecutive correct answers. Participants were allowed to quit the task at any point. Students who had watched the Mr. Bean video ended up spending significantly more time working on the task, making twice as many predictions as the other two groups.</p>
                  <p>Cheng and Wang then replicated these results in a second study, during which they had participants complete long multiplication questions by hand. Again, participants who watched the humorous video spent significantly more time on this tedious task and completed more questions correctly than did the students in either of the other two groups.</p>
                  <p>‘Although humour has been found to help relieve stress and facilitate social relationships, the traditional view of task performance implies that individuals should avoid things such as humour that may distract them from the accomplishment of task goals,’ Cheng and Wang conclude. ‘We suggest that humour is not only enjoyable but more importantly, energising.’</p>
              </CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2"><div className="flex space-x-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button><button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-26</button><button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 27-40</button></div></div>
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–6</h3><p>Reading Passage 1 has seven paragraphs, A–G. Which paragraph contains the following information?</p>
                    <div className="space-y-4">
                        <p><strong>1</strong> reference to an appealing way of using dance that the writer is not proposing</p><Input className={`max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>2</strong> an example of a contrast between past and present approaches to building</p><Input className={`max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>3</strong> mention of an objective of both dance and engineering</p><Input className={`max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>4</strong> reference to an unforeseen problem arising from ignoring the climate</p><Input className={`max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>5</strong> why some measures intended to help people are being reversed</p><Input className={`max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>6</strong> reference to how transport has an impact on human lives</p><Input className={`max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7–13</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">Guard rails</h4>
                        <p>Guard rails were introduced on British roads to improve the <strong>7</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /> of pedestrians, while ensuring that the movement of <strong>8</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} /> is not disrupted. Pedestrians are led to access points, and encouraged to cross one <strong>9</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} /> at a time.</p>
                        <p>An unintended effect is to create psychological difficulties in crossing the road, particularly for less <strong>10</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} /> people. Another result is that some people cross the road in a <strong>11</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} /> way. The guard rails separate <strong>12</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} />, and make it more difficult to introduce forms of transport that are <strong>13</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} />.</p>
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–17</h3><p>Reading Passage 2 has six paragraphs, A–F. Which paragraph contains the following information? NB You may use any letter more than once.</p>
                    <div className="space-y-4">
                        <p><strong>14</strong> a reference to how further disappearance of multiple species could be avoided</p><Input className={`max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>15</strong> explanation of a way of reproducing an extinct animal using the DNA of only that species</p><Input className={`max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>16</strong> reference to a habitat which has suffered following the extinction of a species</p><Input className={`max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>17</strong> mention of the exact point at which a particular species became extinct</p><Input className={`max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18–22</h3><p>Complete the summary below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">The woolly mammoth revival project</h4>
                        <p>Professor George Church and his team are trying to identify the <strong>18</strong> <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} /> which enabled mammoths to live in the tundra. The findings could help preserve the mammoth’s close relative, the endangered Asian elephant.</p>
                        <p>According to Church, introducing Asian elephants to the tundra would involve certain physical adaptations to minimise <strong>19</strong> <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />. To survive in the tundra, the species would need to have the mammoth-like features of thicker hair, <strong>20</strong> <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /> of a reduced size and more <strong>21</strong> <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} />.</p>
                        <p>Repopulating the tundra with mammoths or Asian elephant/mammoth hybrids would also have an impact on the environment, which could help to reduce temperatures and decrease <strong>22</strong> <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} />.</p>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23–26</h3><p>Look at the following statements and the list of people below. Match each statement with the correct person, A, B or C.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of People</strong></p><p><strong>A</strong> Ben Novak</p><p><strong>B</strong> Michael Archer</p><p><strong>C</strong> Beth Shapiro</p></div>
                    <div className="space-y-4">
                        <p><strong>23</strong> Reintroducing an extinct species to its original habitat could improve the health of a particular species living there.</p><Input className={`max-w-[100px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>24</strong> It is important to concentrate on the causes of an animal’s extinction.</p><Input className={`max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>25</strong> A species brought back from extinction could have an important beneficial impact on the vegetation of its habitat.</p><Input className={`max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>26</strong> Our current efforts at preserving biodiversity are insufficient.</p><Input className={`max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–31</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>27</strong> When referring to laughter in the first paragraph, the writer emphasises</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> its impact on language.</p><p><strong>B</strong> its function in human culture.</p><p><strong>C</strong> its value to scientific research.</p><p><strong>D</strong> its universality in animal societies.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} /></div>
                      <div><p><strong>28</strong> What does the writer suggest about Charley Douglass?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> He understood the importance of enjoying humour in a group setting.</p><p><strong>B</strong> He believed that TV viewers at home needed to be told when to laugh.</p><p><strong>C</strong> He wanted his shows to appeal to audiences across the social spectrum.</p><p><strong>D</strong> He preferred shows where audiences were present in the recording studio.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} /></div>
                      <div><p><strong>29</strong> What makes the Santa Cruz study particularly significant?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> the various different types of laughter that were studied</p><p><strong>B</strong> the similar results produced by a wide range of cultures</p><p><strong>C</strong> the number of different academic disciplines involved</p><p><strong>D</strong> the many kinds of people whose laughter was recorded</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} /></div>
                      <div><p><strong>30</strong> Which of the following happened in the San Diego study?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> Some participants became very upset.</p><p><strong>B</strong> Participants exchanged roles.</p><p><strong>C</strong> Participants who had not met before became friends.</p><p><strong>D</strong> Some participants were unable to laugh.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} /></div>
                      <div><p><strong>31</strong> In the fifth paragraph, what did the results of the San Diego study suggest?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> It is clear whether a dominant laugh is produced by a high- or low-status person.</p><p><strong>B</strong> Low-status individuals in a position of power will still produce submissive laughs.</p><p><strong>C</strong> The submissive laughs of low- and high-status individuals are surprisingly similar.</p><p><strong>D</strong> High-status individuals can always be identified by their way of laughing.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32–36</h3><p>Complete the summary using the list of words, A–H, below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">The benefits of humour</h4>
                      <p>In one study at Australian National University, randomly chosen groups of participants were shown one of three videos, each designed to generate a different kind of <strong>32</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />. When all participants were then given a deliberately frustrating task to do, it was found that those who had watched the <strong>33</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} /> video persisted with the task for longer and tried harder to accomplish the task than either of the other two groups.</p>
                      <p>A second study in which participants were asked to perform a particularly <strong>34</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> task produced similar results. According to researchers David Cheng and Lu Wang, these findings suggest that humour not only reduces <strong>35</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> and helps build social connections but it may also have a <strong>36</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} /> effect on the body and mind.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-sm"><p><strong>A</strong> laughter</p><p><strong>B</strong> relaxing</p><p><strong>C</strong> boring</p><p><strong>D</strong> anxiety</p><p><strong>E</strong> stimulating</p><p><strong>F</strong> emotion</p><p><strong>G</strong> enjoyment</p><p><strong>H</strong> amusing</p></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37–40</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>37</strong> Participants in the Santa Cruz study were more accurate at identifying the laughs of friends than those of strangers.</p><Input className={`max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>38</strong> The researchers in the San Diego study were correct in their predictions regarding the behaviour of the high-status individuals.</p><Input className={`max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>39</strong> The participants in the Australian National University study were given a fixed amount of time to complete the task focusing on employee profiles.</p><Input className={`max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>40</strong> Cheng and Wang’s conclusions were in line with established notions regarding task performance.</p><Input className={`max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="reading" testNumber={2} /><UserTestHistory book="book-15" module="reading" testNumber={2} /></div>
      </div>
    </div>
  )
}