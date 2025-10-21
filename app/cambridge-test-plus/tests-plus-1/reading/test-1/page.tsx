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

export default function Book1ReadingTest1() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
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
      
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      
      await saveTestScore({
        book: 'practice-tests-plus-1',
        module: 'reading',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
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
    '1': 'scientists', '2': 'science', '3': '(seven) fields', '4': 'co-operation/collaboration', 
    '5': 'observations', '6': 'dinosaurs', '7': 'conservation programme', '8': 'acknowledge', 
    '9': 'B', '10': 'A', '11': 'D', '12': 'B', '13': 'C', 
    '14': 'C', '15': 'A', '16': 'B', '17': 'D', '18': 'YES', 
    '19': 'NO', '20': 'NOT GIVEN', '21': 'YES', '22': 'YES', '23': 'NO', 
    '24': 'manuscript', '25': '(tabloid) newspapers', '26': 'shopping lists', 
    '27': 'x', '28': 'viii', '29': 'v', '30': 'iii', '31': 'vii', 
    '32': 'ii', '33': 'i', '34': 'columns', '35': 'vertical walls', 
    '36': 'hollow boxes', '37': 'D', '38': 'C', '39': 'G', '40': 'F'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 1 - Reading Test 1</h1>
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
                {!isTestStarted && !submitted && (
                  <Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                    Start Test
                  </Button>
                )}
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
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-center text-gray-500 italic mb-4">In Praise of Amateurs</p>
                     <p>Despite the specialisation of scientific research, amateurs still have an important role to play</p>
                     <p><span className="font-semibold">D</span>uring the scientific revolution of the 17th century, scientists were largely men of private means who pursued their interest in natural philosophy for their own edification. Only in the past century or two has it become possible to make a living from investigating the workings of nature. Modern science was, in other words, built on the work of amateurs. Today, science is an increasingly specialised and compartmentalised subject, the domain of experts who know more and more about less and less. Perhaps surprisingly, however, amateurs – even those without private means – are still important.</p>
                     <p>A recent poll carried out at a meeting of the American Association for the Advancement of Sciences by Dr Richard Fienberg found that, in addition to his field of astronomy, amateurs are actively involved in such fields as acoustics, horticulture, ornithology, meteorology, hydrology and palaeontology. Far from being crackpots, amateur scientists are often in close touch with professionals, some of whom rely heavily on their co-operation.</p>
                     <p>Admittedly, some fields are more open to amateurs than others. Anything that requires expensive equipment is clearly a no-go area. And some kinds of research can be dangerous; most amateur chemists, jokes Dr Fienberg, are either locked up or have blown themselves to bits. But amateurs can make valuable contributions in fields from rocketry to palaeontology and the rise of the internet has made it easier than ever before to collect data and distribute results.</p>
                     <p>Exactly which field of study has benefited most from the contributions of amateurs is a matter of some dispute. Dr Fienberg makes a strong case for astronomy. There is, he points out, a long tradition of collaboration between amateur and professional sky watchers. Numerous comets, asteroids and even the planet Uranus were discovered by amateurs. Today, in addition to comet and asteroid spotting, amateurs continue to do valuable work observing the brightness of variable stars and detecting novae – 'new' stars in the Milky Way and supernovae in other galaxies. Amateur observers are helpful, says Dr Fienberg, because there are so many of them (they far outnumber professionals) and because they are distributed all over the world. This makes special kinds of observations possible: if several observers around the world accurately record the time when a star is eclipsed by an asteroid, for example, it is possible to derive useful information about the asteroid's shape.</p>
                     <p>Another field in which amateurs have traditionally played an important role is palaeontology. Adrian Hunt, a palaeontologist at Mesa Technical College in New Mexico, insists that his is the field in which amateurs have made the biggest contribution. Despite the development of high-tech equipment, he says, the best sensors for finding fossils are human eyes – lots of them. Finding volunteers to look for fossils is not difficult, he says, because of the near-universal interest in anything to do with dinosaurs. As well as helping with this research, volunteers learn about science, a process he calls 'recreational education'.</p>
                     <p>Rick Bonney of the Cornell Laboratory of Ornithology in Ithaca, New York, contends that amateurs have contributed the most in his field. There are, he notes, thought to be as many as 60 million birdwatchers in America alone. Given their huge numbers and the wide geographical coverage they provide, Dr Bonney has enlisted thousands of amateurs in a number of research projects. Over the past few years their observations have uncovered previously unknown trends and cycles in bird migrations and revealed declines in the breeding populations of several species of migratory birds, prompting a habitat conservation programme.</p>
                     <p>Despite the successes and whatever the field of study, collaboration between amateurs and professionals is not without its difficulties. Not everyone, for example, is happy with the term 'amateur'. Mr Bonney has coined the term 'citizen scientist' because he felt that other words, such as 'volunteer' sounded disparaging. A more serious problem is the question of how professionals can best acknowledge the contributions made by amateurs. Dr Fienberg says that some amateur astronomers are happy to provide their observations but grumble about not being reimbursed for out-of-pocket expenses. Others feel let down when their observations are used in scientific papers, but they are not listed as co-authors. Dr Hunt says some amateur palaeontologists are disappointed when told that they cannot take finds home with them.</p>
                     <p>These are legitimate concerns but none seems insurmountable. Provided amateurs and professionals agree the terms on which they will work together beforehand, there is no reason why co-operation between the two groups should not flourish. Last year Dr S. Carlson, founder of the Society for Amateur Scientists won an award worth $290,000 for his work in promoting such co-operation. He says that one of the main benefits of the prize is the endorsement it has given to the contributions of amateur scientists, which has done much to silence critics among those professionals who believe science should remain their exclusive preserve.</p>
                     <p>At the moment, says Dr Carlson, the society is involved in several schemes including an innovative rocket-design project and the setting up of a network of observers who will search for evidence of a link between low-frequency radiation and earthquakes. The amateurs, he says, provide enthusiasm and talent, while the professionals provide guidance 'so that anything they do discover will be taken seriously'. Having laid the foundations of science, amateurs will have much to contribute to its ever-expanding edifice.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic mb-4">READING THE SCREEN</p>
                    <p>Are the electronic media exacerbating illiteracy and making our children stupid? On the contrary, says Colin McCabe, they have the potential to make us truly literate</p>
                    <p>The debate surrounding literacy is one of the most charged in education. On the one hand there is an army of people convinced that traditional skills of reading and writing are declining. On the other, a host of progressives protest that literacy is much more complicated than a simple technical mastery of reading and writing. This second position is supported by most of the relevant academic work over the past 20 years. These studies argue that literacy can only be understood in its social and technical context. In Renaissance England, for example, many more people could read than could write, and within reading there was a distinction between those who could read print and those who could manage the more difficult task of reading manuscript. An understanding of these earlier periods helps us understand today’s 'crisis in literacy' debate.</p>
                    <p>There does seem to be evidence that there has been an overall decline in some aspects of reading and writing - you only need to compare the tabloid newspapers of today with those of 50 years ago to see a clear decrease in vocabulary and simplification of syntax. But the picture is not uniform and doesn’t readily demonstrate the simple distinction between literate and illiterate which had been considered adequate since the middle of the 19th century.</p>
                    <p>While reading a certain amount of writing is as crucial as it has ever been in industrial societies, it is doubtful whether a fully extended grasp of either is as necessary as it was 30 or 40 years ago. While print retains much of its authority as a source of topical information, television has increasingly usurped this role. The ability to write fluent letters has been undermined by the telephone and research suggests that for many people the only use for writing, outside formal education, is the compilation of shopping lists.</p>
                    <p>The decision of some car manufacturers to issue their instructions to mechanics as a video pack rather than as a handbook might be taken to spell the end of any automatic link between industrialisation and literacy. On the other hand, it is also the case that ever-increasing numbers of people make their living out of writing, which is better rewarded than ever before. Schools are generally seen as institutions where the book rules, film, television and recorded sound have almost no place; but it is not clear that this opposition is appropriate. While you may not need to read and write to watch television, you certainly need to be able to read and write in order to make programmes.</p>
                    <p>Those who work in the new media are anything but illiterate. The traditional oppositions between old and new media are inadequate for understanding the world which a young child now encounters. The computer has re-established a central place for the written word on the screen, which used to be entirely devoted to the image. There is even anecdotal evidence that children are mastering reading and writing in order to get on to the Internet. There is no reason why the new and old media cannot be integrated in schools to provide the skills to become economically productive and politically enfranchised.</p>
                    <p>Nevertheless, there is a crisis in literacy and it would be foolish to ignore it. To understand that literacy may be declining because it is less central to some aspects of everyday life is not the same as acquiescing in this state of affairs. The production of school work with the new technologies could be a significant stimulus to literacy. How should these new technologies be introduced into the schools? It isn’t enough to call for computers, camcorders and edit suites in every classroom; unless they are properly integrated into the educational culture, they will stand unused. Evidence suggests that this is the fate of most information technology used in the classroom. Similarly, although media studies are now part of the national curriculum, and more and more students are now clamouring to take these courses, teachers remain uncertain about both methods and aims in this area.</p>
                    <p>This is not the fault of the teachers. The entertainment and information industries must be drawn into a debate with the educational institutions to determine how best to blend these new technologies into the classroom.</p>
                    <p>Many people in our era are drawn to the pessimistic view that the new media are destroying old skills and eroding critical judgement. It may be true that past generations were more literate but - taking the pre-19th century meaning of the term - this was true of only a small section of the population. The word literacy is a 19th-century coinage to describe the divorce of reading and writing from a full knowledge of literature. The education reforms of the 19th century produced reading and writing as skills separable from full participation in the cultural heritage.</p>
                    <p>The new media now point not only to a futuristic cyber-economy, they also make our cultural past available to the whole nation. Most children's access to these treasures is initially through television. It is doubtful whether our literary heritage has ever been available to, or sought out by more than about 5 per cent of the population; it has certainly not been available to more than 10 per cent. But the new media joined to the old, through the public service tradition of British broadcasting, now makes our literary tradition available to all.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-500 italic mb-4">The Revolutionary Bridges of Robert Maillart</p>
                    <p>Swiss engineer Robert Maillart built some of the greatest bridges of the 20th century. His designs elegantly solved a basic engineering problem: how to support enormous weights using a slender arch</p>
                    <p><span className="font-semibold">A</span> Just as railway bridges were the great structural symbols of the 19th century, highway bridges became the engineering emblems of the 20th century. The invention of the automobile created an irresistible demand for paved roads and vehicular bridges throughout the developed world. The type of bridge needed for cars and trucks, however, is fundamentally different from that needed for locomotives. Most highway bridges carry lighter loads than railway bridges do, and their roadways can be sharply curved or steeply sloping. To meet these needs, many turn-of-the-century bridge designers began working with a new building material: reinforced concrete, which has steel bars embedded in it. And the master of this new material was Swiss structural engineer, Robert Maillart.</p>
                    <p><span className="font-semibold">B</span> Early in his career, Maillart developed a unique method for designing bridges, buildings and other concrete structures. He rejected the complex mathematical analysis of loads and stresses that was being enthusiastically adopted by most of his contemporaries. At the same time, he also eschewed the decorative approach taken by many bridge builders of his time. He resisted imitating architectural styles and adding design elements solely for ornamentation. Maillart’s method was a form of creative intuition. He had a knack for conceiving new shapes to solve classic engineering problems. And because he worked in a highly competitive field, one of his goals was economy – he sought design and construction contracts because his structures were reasonably priced, often less costly than all his rivals' proposals.</p>
                    <p><span className="font-semibold">C</span> Maillart’s first important bridge was built in the small Swiss town of Zuoz. The local officials had initially wanted a steel bridge to span the 30-metre wide Inn River, but Maillart argued that he could build a more elegant bridge made of reinforced concrete for about the same cost. His crucial innovation was incorporating the bridge's arch and roadway into a form called the hollow-box arch, which would substantially reduce the bridge's expense by minimising the amount of concrete needed. In a conventional arch bridge the weight of the roadway is transferred by columns to the arch, which must be relatively thick. In Maillart’s design, though, the roadway and arch were connected by three vertical walls, forming two hollow boxes running under the roadway (see diagram). The big advantage of this design was that because the arch would not have to bear the load alone, it could be much thinner – as little as one-third as thick as the arch in the conventional bridge.</p>
                    <p><span className="font-semibold">D</span> His first masterpiece, however, was the 1905 Tavanasa Bridge over the Rhine river in the Swiss Alps. In this design, Maillart removed the parts of the vertical walls which were not essential because they carried no load. This produced a slender, lighter-looking form, which perfectly met the bridge's structural requirements. But the Tavanasa Bridge gained little favourable publicity in Switzerland; on the contrary, it aroused strong, aesthetic objections from public officials, who were more comfortable with old-fashioned stone-faced bridges. Maillart, who had founded his own construction firm in 1902, was unable to win any more bridge projects, so he shifted his focus to designing buildings, warehouses and other structures made of reinforced concrete and did not resume his work on concrete bridges until the early 1920s.</p>
                    <p><span className="font-semibold">E</span> His most important breakthrough during this period was the development of the deck-stiffened arch, the first example of which was the Flienglibach Bridge built in 1923. An arch bridge is somewhat like an inverted cable; a simple arch is downward when a weight is hung from it. An arch bridge curves upward to support the roadway and the compression in the arch balances the dead load of the traffic. For aesthetic reasons, Maillart wanted a thinner arch and his solution was to connect the arch to the roadway with transverse walls. In this way, Maillart justified making the arch as thin as he could reasonably build it. His analysis accurately predicted the behaviour of the bridge but the building authorities of Swiss engineering would argue against his methods for the next quarter of a century.</p>
                    <p><span className="font-semibold">F</span> Over the next 10 years, Maillart concentrated on refining the visual appearance of the deck-stiffened arch. His best-known structure is the Salginatobel Bridge, completed in 1930. He won the competition for the contract because his design was the least expensive of the 19 submitted – the bridge and road were built for only 700,000 Swiss francs, equivalent to some $3.5 million today. Salginatobel was also Maillart’s longest span, at 90 metres, and it had the most dramatic setting of all his structures, vaulting 80 metres above the ravine of the Salgina brook. In 1991 it became the first concrete bridge to be designated an international historic landmark.</p>
                    <p><span className="font-semibold">G</span> Before his death in 1940, Maillart completed other remarkable bridges and continued to refine his designs. However, architects often recognised the high quality of Maillart’s structures before his fellow engineers did and in 1947 the architectural section of the Museum of Modern Art in New York City devoted a major exhibition entirely to his works. In contrast, very few American structural engineers at that time had even heard of Maillart. In the following years, however, engineers realised that Maillart’s bridges were more than just aesthetically pleasing – they were technically unsurpassed. Maillart’s hollow-box arch became the dominant design form for medium and long-span concrete bridges in the US. In Switzerland, professors finally began to teach Maillart’s ideas, which then influenced a new generation of designers.</p>
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
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 2: Q 14-26</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 3: Q 27-40</button>
                </div>
              </div>

              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p className="mb-4"><strong>Complete the summary below. Choose ONE or TWO WORDS from the passage for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 1-8 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg space-y-3"><h4 className="font-semibold text-center mb-2">Summary</h4><p>Prior to the 19th century, professional ... <strong>1</strong> ... did not exist and scientific research was largely carried out by amateurs. However, while ... <strong>2</strong> ... today is mostly the domain of professionals, a recent US survey highlighted the fact that amateurs play an important role in at least seven ... <strong>3</strong> ... and indeed many professionals are reliant on their ... <strong>4</strong> ... . In areas such as astronomy, amateurs can be invaluable when making specific ... <strong>5</strong> ... on a global basis. Similarly in the area of palaeontology their involvement is invaluable and helpers are easy to recruit because of the popularity of ... <strong>6</strong> ... . Amateur birdwatchers also play an active role and their work has led to the establishment of a ... <strong>7</strong> ... . Occasionally the term 'amateur' has been the source of disagreement and alternative names have been suggested but generally speaking, as long as the professional scientists ... <strong>8</strong> ... the work of the non-professionals, the two groups can work productively together.</p></div><div className="mt-4 grid grid-cols-2 gap-4"><div>1. <Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>2. <Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>3. <Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>4. <Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>5. <Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>6. <Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>7. <Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>8. <Input value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p className="mb-4"><strong>Reading Passage 1 contains a number of opinions provided by four different scientists. Match each opinion (Questions 9-13) with the scientists A-D.</strong></p><p className="mb-4 italic">NB You may use any of the scientists A-D more than once.</p><div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm"><p><strong>A</strong> Dr Fienberg</p><p><strong>B</strong> Adrian Hunt</p><p><strong>C</strong> Rick Bonney</p><p><strong>D</strong> Dr Carlson</p></div><div className="space-y-4"><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">9</span><p>Amateur involvement can also be an instructive pastime.</p><Input className={`ml-auto w-20 ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">10</span><p>Amateur scientists are prone to accidents.</p><Input className={`ml-auto w-20 ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">11</span><p>Science does not belong to professional scientists alone.</p><Input className={`ml-auto w-20 ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">12</span><p>In certain areas of my work, people are a more valuable resource than technology.</p><Input className={`ml-auto w-20 ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">13</span><p>It is important to give amateurs a name which reflects the value of their work.</p><Input className={`ml-auto w-20 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p className="mb-4"><strong>Choose the appropriate letters A-D and write them in boxes 14-17 on your answer sheet.</strong></p><div className="space-y-6"><div className="space-y-2"><p><span className="font-semibold">14</span> When discussing the debate on literacy in education, the writer notes that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> children cannot read and write as well as they used to.</p><p><strong>B</strong> academic work has improved over the last 20 years.</p><p><strong>C</strong> there is evidence that literacy is related to external factors.</p><p><strong>D</strong> there are opposing arguments that are equally convincing.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-2"><p><span className="font-semibold">15</span> In the 4th paragraph, the writer's main point is that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> the printed word is both gaining and losing power.</p><p><strong>B</strong> all inventions bring disadvantages as well as benefits.</p><p><strong>C</strong> those who work in manual jobs no longer need to read.</p><p><strong>D</strong> the media offers the best careers for those who like writing.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-2"><p><span className="font-semibold">16</span> According to the writer, the main problem that schools face today is</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> how best to teach the skills of reading and writing.</p><p><strong>B</strong> how best to incorporate technology into classroom teaching.</p><p><strong>C</strong> finding the means to purchase technological equipment.</p><p><strong>D</strong> managing the widely differing levels of literacy amongst pupils.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-2"><p><span className="font-semibold">17</span> At the end of the article, the writer is suggesting that</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> literature and culture cannot be divorced.</p><p><strong>B</strong> the term 'literacy' has not been very useful.</p><p><strong>C</strong> 10 per cent of the population never read literature.</p><p><strong>D</strong> our access to cultural information is likely to increase.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-23</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 2?</strong></p><p className="mb-4 italic">In boxes 18-23 on your answer sheet write</p><div className="ml-4 mb-4 space-y-1 text-sm"><p><strong>YES</strong> if the statement agrees with the writer</p><p><strong>NO</strong> if the statement contradicts the writer</p><p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p></div><div className="space-y-4"><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">18</span><p>It is not as easy to analyse literacy levels as it used to be.</p><Input className={`ml-auto max-w-[150px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">19</span><p>Our literacy skills need to be as highly developed as they were in the past.</p><Input className={`ml-auto max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">20</span><p>Illiteracy is on the increase.</p><Input className={`ml-auto max-w-[150px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">21</span><p>Professional writers earn relatively more than they used to.</p><Input className={`ml-auto max-w-[150px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">22</span><p>A good literacy level is important for those who work in television.</p><Input className={`ml-auto max-w-[150px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-4"><span className="font-semibold min-w-[20px]">23</span><p>Computers are having a negative impact on literacy in schools.</p><Input className={`ml-auto max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p className="mb-4"><strong>Complete the sentences below with words taken from Reading Passage 2. Use NO MORE THAN THREE WORDS for each answer.</strong></p><p className="mb-4 italic">Write your answers in boxes 24-26 on your answer sheet.</p><div className="space-y-4"><p><strong>24.</strong> In Renaissance England, the best readers were those able to read ...</p><Input className={`mt-1 max-w-[200px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-4"><p><strong>25.</strong> The writer uses the example of ... to illustrate the general fall in certain areas of literacy.</p><Input className={`mt-1 max-w-[200px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="space-y-4"><p><strong>26.</strong> It has been shown that after leaving school, the only things that a lot of people write are ...</p><Input className={`mt-1 max-w-[200px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-33</h3><p className="mb-4"><strong>Reading Passage 3 has seven paragraphs A-G. From the list of headings below choose the most suitable heading for each paragraph.</strong></p><p className="mb-4 italic">Write the appropriate numbers (i-x) in boxes 27-33 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg mb-4"><h4 className="font-semibold mb-3">List of headings</h4><div className="space-y-1 text-sm"><p><strong>i</strong> The long-term impact</p><p><strong>ii</strong> A celebrated achievement</p><p><strong>iii</strong> Early brilliance passes unrecognised</p><p><strong>iv</strong> Outdated methods retain popularity</p><p><strong>v</strong> The basis of a new design is born</p><p><strong>vi</strong> Frustration at never getting the design right</p><p><strong>vii</strong> Further refinements meet persistent objections</p><p><strong>viii</strong> Different in all respects</p><p><strong>ix</strong> Bridge-makers look elsewhere</p><p><strong>x</strong> Transport developments spark a major change</p></div></div><div className="grid grid-cols-2 gap-4"><div className="flex items-center gap-2"><span className="font-semibold">27</span><p>Paragraph A</p><Input className={`ml-auto w-16 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-2"><span className="font-semibold">28</span><p>Paragraph B</p><Input className={`ml-auto w-16 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-2"><span className="font-semibold">29</span><p>Paragraph C</p><Input className={`ml-auto w-16 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-2"><span className="font-semibold">30</span><p>Paragraph D</p><Input className={`ml-auto w-16 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-2"><span className="font-semibold">31</span><p>Paragraph E</p><Input className={`ml-auto w-16 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-2"><span className="font-semibold">32</span><p>Paragraph F</p><Input className={`ml-auto w-16 ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-center gap-2"><span className="font-semibold">33</span><p>Paragraph G</p><Input className={`ml-auto w-16 ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 34-36</h3><p className="mb-4"><strong>Complete the labels on the diagrams below using ONE or TWO WORDS from the reading passage.<img 
                src="/img/ielts/cambridge-plus/plus1/reading/test1/bridge.png" 
                alt="Agricultural Park Map" 
                className="mx-auto max-w-full h-auto rounded border shadow-lg"
              /></strong></p><p className="mb-4 italic">Write your answers in boxes 34-36 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg space-y-4"></div><div className="grid grid-cols-3 gap-4 mt-4"><div>34. <Input value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>35. <Input value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>36. <Input value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p className="mb-4"><strong>Complete each of the following statements (Questions 37-40) with the best ending (A-G) from the box below.</strong></p><p className="mb-4 italic">Write the appropriate letters A-G in boxes 37-40 on your answer sheet.</p><div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm"><p><strong>A</strong> ... prove that local people were wrong.</p><p><strong>B</strong> ... find work in Switzerland.</p><p><strong>C</strong> ... win more building commissions.</p><p><strong>D</strong> ... reduce the amount of raw material required.</p><p><strong>E</strong> ... recognise his technical skills.</p><p><strong>F</strong> ... capitalise on the spectacular terrain.</p><p><strong>G</strong> ... improve the appearance of his bridges.</p></div><div className="space-y-3"><div className="flex items-start gap-4"><span className="font-semibold">37</span><p>Maillart designed the hollow-box arch in order to ...</p><Input className={`ml-auto w-20 ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-start gap-4"><span className="font-semibold">38</span><p>Following the construction of the Tavanasa Bridge, Maillart failed to ...</p><Input className={`ml-auto w-20 ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-start gap-4"><span className="font-semibold">39</span><p>The transverse walls of the Flienglibach Bridge allowed Maillart to ...</p><Input className={`ml-auto w-20 ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div className="flex items-start gap-4"><span className="font-semibold">40</span><p>Of all his bridges, the Salginatobel enabled Maillart to ...</p><Input className={`ml-auto w-20 ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (
            <div className="mt-8 text-center">
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>
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
        
        {showAnswers && (
            <Card className="mt-8">
            <CardHeader><CardTitle>Answer Key</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(correctAnswers).map(([question, answer]) => (
                    <div key={question} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{question}:</span>
                        <span className="text-gray-800">{answer}</span>
                    </div>
                    ))}
                </div>
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
        )}

        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <PageViewTracker 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={1} 
          />
          <TestStatistics 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={1} 
          />
          <UserTestHistory 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={1}
          />
        </div>
      </div>
    </div>
  )
}