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

export default function Book16ReadingTest1() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '25_26': [],
  })
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

  const handleMultiSelect = (key: '25_26', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    
    if (['25', '26'].includes(questionNumber)) {
        return false;
    }

    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&') || ['25', '26'].includes(qNum)) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    
    const userChoices25_26 = multipleAnswers['25_26'] || [];
    const correctSet25_26 = ['B', 'D'];
    userChoices25_26.forEach(choice => {
        if (correctSet25_26.includes(choice)) {
            correctCount++;
        }
    });
    
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, multipleAnswers, results: Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      // Save test score using test-score-saver
      const result = await saveTestScore({
        book: 'book-16',
        module: 'reading',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      }, session);
      
      if (!result.success) {
        console.error('Failed to save test score:', result.error);
      }
      setSubmitted(true); setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      const calculatedScore = calculateScore(); setScore(calculatedScore); setSubmitted(true); setShowResultsPopup(true);
    } finally { setIsSubmitting(false); }
  }

  const handleReset = () => {
    setAnswers({}); setMultipleAnswers({ '25_26': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const renderMultiSelect = (key: '25_26', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
            const opt = String.fromCharCode(65 + index);
            return (
                <label key={opt} className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        value={opt} 
                        checked={multipleAnswers[key].includes(opt)} 
                        onChange={() => handleMultiSelect(key, opt)} 
                        disabled={!isTestStarted || submitted} 
                    />
                    <span><strong>{opt}</strong> {option}</span>
                </label>
            );
            })}
        </div>
        {submitted && <div className="mt-2 text-sm font-semibold text-green-600">Correct answers: {correctSet.join(', ')}</div>}
    </div>
  );

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'FALSE', '2': 'FALSE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'TRUE', '6': 'FALSE', '7': 'TRUE', '8': 'violent', '9': 'tool', '10': 'meat', '11': 'photographer', '12': 'game', '13': 'frustration', '14': 'iv', '15': 'vii', '16': 'ii', '17': 'i', '18': 'v', '19': 'viii', '20': 'vi', '21': 'city', '22': 'priests', '23': 'trench', '24': 'location', 
    '25': 'B', '26': 'D', '25&26': ['B', 'D'],
    '27': 'B', '28': 'D', '29': 'C', '30': 'D', '31': 'G', '32': 'E', '33': 'C', '34': 'F', '35': 'B', '36': 'A', '37': 'C', '38': 'A', '39': 'B', '40': 'C'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-16" module="reading" testNumber={1} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 16 - Reading Test 1</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div></div>
        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Why we need to protect polar bears</p>
                     <p>Polar bears are being increasingly threatened by the effects of climate change, but their disappearance could have far-reaching consequences. They are uniquely adapted to the extreme conditions of the Arctic Circle, where temperatures can reach -40°C. One reason for this is that they have up to 11 centimetres of fat underneath their skin. Humans with comparative levels of adipose tissue would be considered obese and would be likely to suffer from diabetes and heart disease. Yet the polar bear experiences no such consequences.</p>
                     <p>A 2014 study by Shi Ping Liu and colleagues sheds light on this mystery. They compared the genetic structure of polar bears with that of their closest relatives from a warmer climate, the brown bears. This allowed them to determine the genes that have allowed polar bears to survive in one of the toughest environments on Earth. Liu and his colleagues found the polar bears had a gene known as ApoB, which reduces levels of low-density lipoproteins (LDLs) – a form of ‘bad’ cholesterol. In humans, mutations of this gene are associated with increased risk of heart disease. Polar bears may therefore be an important study model to understand heart disease in humans.</p>
                     <p>The genome of the polar bear may also provide the solution for another condition, one that particularly affects our older generation: osteoporosis. This is a disease where bones show reduced density, usually caused by insufficient exercise, reduced calcium intake or food starvation. Bone tissue is constantly being remodelled, meaning that bone is added or removed, depending on nutrient availability and the stress that the bone is under. Female polar bears, however, undergo extreme conditions during every pregnancy. Once autumn comes around, these females will dig maternity dens in the snow and will remain there throughout the winter, both before and after the birth of their cubs. This process results in about six months of fasting, where the female bears have to keep themselves and their cubs alive, depleting their own calcium and calorie reserves. Despite this, their bones remain strong and dense.</p>
                     <p>Physiologists Alanda Lennox and Allen Goodship found an explanation for this paradox in 2008. They discovered that pregnant bears were able to increase the density of their bones before they started to build their dens. In addition, six months later, when they finally emerged from the den with their cubs, there was no evidence of significant loss of bone density. Hibernating brown bears do not have this capacity and must therefore resort to major bone reformation in the following spring. If the mechanism of bone remodelling in polar bears can be understood, many bedridden humans and even astronauts could potentially benefit.</p>
                     <p>The medical benefits of the polar bear for humanity certainly have their importance in our conservation efforts, but these should not be the only factors taken into consideration. We tend to want to protect animals we think are intelligent and possess emotions, such as elephants and primates. Bears, on the other hand, seem to be perceived as stupid and in many cases violent. And yet anecdotal evidence from the field challenges those assumptions, suggesting for example that polar bears have good problem-solving abilities. A male bear called GoGo in Tennoji Zoo, Osaka, has even been observed making use of a tool to manipulate his environment. The bear used a tree branch on multiple occasions to dislodge a piece of meat hung out of his reach. Problem-solving ability has also been witnessed in wild polar bears, although not as obviously as with GoGo. A calculated move by a male bear involved running and jumping onto barrels in an attempt to get to a photographer standing on a platform four metres high.</p>
                     <p>In other studies, such as one by Alison Ames in 2008, polar bears showed deliberate and focussed manipulation. For example, Ames observed bears putting objects in piles and then knocking them over in what appeared to be a game. The study demonstrates that bears are capable of agile and thought-out behaviours. These examples suggest bears have greater creativity and problem-solving abilities than previously thought.</p>
                     <p>As for emotions, while the evidence is once again anecdotal, many bears have been seen to hit out at ice and snow – seemingly out of frustration – when they have just missed out on a kill. Moreover, polar bears can form unusual relationships with other species, including playing with the dogs used to pull sleds in the Arctic. Remarkably, one hand-raised polar bear called Agee has formed a close relationship with her owner Mark Dumas to the point where they even swim together. This is even more astonishing since polar bears are known to actively hunt humans in the wild.</p>
                     <p>If climate change were to lead to their extinction, this would mean not only the loss of potential breakthroughs in human medicine, but more importantly, the disappearance of an intelligent, majestic animal.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The Step Pyramid of Djoser</p>
                     <p><span className="font-semibold">A</span> The pyramids are the most famous monuments of ancient Egypt and still hold enormous interest for people in the present day. These grand, impressive tributes to the memory of the Egyptian kings have become linked with the country even though other cultures, such as the Chinese and Mayan, also built pyramids. The evolution of the pyramid form has been written and argued about for centuries. However, there is no question that, as far as Egypt is concerned, it began with one monument to one king designed by one brilliant architect: the Step Pyramid of Djoser at Saqqara.</p>
                     <p><span className="font-semibold">B</span> Djoser was the first king of the Third Dynasty of Egypt and the first to build in stone. Prior to Djoser’s reign, tombs were rectangular monuments made of dried clay brick, which covered underground passages where the deceased person was buried. For reasons which remain unclear, Djoser’s main official, whose name was Imhotep, conceived of building a taller, more impressive tomb for his king by stacking stone slabs on top of one another, progressively making them smaller, to form the shape now known as the Step Pyramid. Djoser is thought to have reigned for 19 years, but some historians and scholars attribute a much longer time for his rule, owing to the number and size of the monuments he built.</p>
                     <p><span className="font-semibold">C</span> The Step Pyramid has been thoroughly examined and investigated over the last century, and it is now known that the building process went through many different stages. Historian Marc Van de Mieroop comments on this, writing ‘Much experimentation was involved, which is especially clear in the construction of the pyramid in the center of the complex. It had several plans ... before it became the first Step Pyramid in history, piling six levels on top of one another ... The weight of the enormous mass was a challenge for the builders, who placed the stones at an inward incline in order to prevent the monument breaking up.’</p>
                     <p><span className="font-semibold">D</span> When finally completed, the Step Pyramid rose 62 meters high and was the tallest structure of its time. The complex in which it was built was the size of a city in ancient Egypt and included a temple, courtyards, shrines, and living quarters for the priests. It covered a region of 16 hectares and was surrounded by a wall 10.5 meters high. The wall had 13 false doors cut into it with only one true entrance cut into the south-east corner; the entire wall was then ringed by a trench 750 meters long and 40 meters wide. The false doors and the trench were incorporated into the complex to discourage unwanted visitors. If someone wished to enter, he or she would have needed to know in advance how to find the location of the true opening in the wall. Djoser was so proud of his accomplishment that he broke the tradition of having only his own name on the monument and had Imhotep’s name carved on it as well.</p>
                     <p><span className="font-semibold">E</span> The burial chamber of the tomb, where the king’s body was laid to rest, was dug beneath the base of the pyramid, surrounded by a vast maze of long tunnels that had rooms off them to discourage robbers. One of the most mysterious discoveries found inside the pyramid was a large number of stone vessels. Over 40,000 of these vessels, of various forms and shapes, were discovered in storerooms off the pyramid’s underground passages. They are inscribed with the names of rulers from the First and Second Dynasties of Egypt and made from different kinds of stone. There is no agreement among scholars and archaeologists on why the vessels were placed in the tomb of Djoser or what they were supposed to represent. The archaeologist Jean-Philippe Lauer, who excavated most of the pyramid and complex, believes they were originally stored and then given a ‘proper burial’ by Djoser in his pyramid to honor his predecessors. There are other historians, however, who claim the vessels were dumped into the shafts as yet another attempt to prevent grave robbers from getting to the king’s burial chamber.</p>
                     <p><span className="font-semibold">F</span> Unfortunately, all of the precautions and intricate design of the underground network did not prevent ancient robbers from finding a way in. Djoser’s grave goods, and even his body, were stolen at some point in the past and all archaeologists found were a small number of his valuables overlooked by the thieves. There was enough left throughout the pyramid and its complex, however, to astonish and amaze the archaeologists who excavated it.</p>
                     <p><span className="font-semibold">G</span> Egyptologist Miroslav Verner writes, ‘Few monuments hold a place in human history as significant as that of the Step Pyramid in Saqqara ... It can be said without exaggeration that this pyramid complex constitutes a milestone in the evolution of monumental stone architecture in Egypt and in the world as a whole.’ The Step Pyramid was a revolutionary advance in architecture and became the archetype which all other great pyramid builders of Egypt would follow.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The future of work</p>
                     <p>According to a leading business consultancy, 3-14% of the global workforce will need to switch to a different occupation within the next 10-15 years, and all workers will need to adapt as their occupations evolve alongside increasingly capable machines. Automation – or ‘embodied artificial intelligence’ (AI) – is one aspect of the disruptive effects of technology on the labour market. ‘Disembodied AI’, like the algorithms running our smartphones, is another.</p>
                     <p>Dr Stella Pachidi from Cambridge Judge Business School believes that some of the most fundamental changes are happening as a result of the ‘algorithmication’ of jobs that are dependent on data rather than on production – the so-called knowledge economy. Algorithms are capable of learning from data to undertake tasks that previously needed human judgement, such as reading legal contracts, analysing medical scans and gathering market intelligence.</p>
                     <p>‘In many cases, they can outperform humans,’ says Pachidi. ‘Organisations are attracted to using algorithms because they want to make choices based on what they consider is “perfect information”, as well as to reduce costs and enhance productivity.’</p>
                     <p>‘But these enhancements are not without consequences,’ says Pachidi. ‘If routine cognitive tasks are taken over by AI, how do professions develop their future experts?’ she asks. ‘One way of learning about a job is “legitimate peripheral participation” – a novice stands next to experts and learns by observation. If this isn’t happening, then you need to find new ways to learn.’</p>
                     <p>Another issue is the extent to which the technology influences or even controls the workforce. For over two years, Pachidi monitored a telecommunications company. The way telecoms sales Ppeople work is through personal and frequent contact with clients, using the benefit of experience to assess a situation and reach a decision. However, the company had started using a[n] algorithm that defined when account managers should contact certain customers about which kinds of campaigns and what to offer them.</p>
                     <p>The algorithm – usually built by external designers – often becomes the keeper of knowledge, she explains. In cases like this, Pachidi believes, a short-sighted view begins to creep into working practices whereby workers learn through the ‘algorithm’s eyes’ and become dependent on its instructions. Alternative explorations – where experimentation and human instinct lead to progress and new ideas – are effectively discouraged.</p>
                     <p>Pachidi and colleagues even observed people developing strategies to make the algorithm work to their own advantage. ‘We are seeing cases where workers feed the algorithm with false data to reach their targets,’ she reports.</p>
                     <p>It’s scenarios like these that many researchers are working to avoid. Their objective is to make AI technologies more trustworthy and transparent, so that organisations and individuals understand how AI decisions are made. In the meantime, says Pachidi, ‘We need to make sure we fully understand the dilemmas that this new world raises regarding expertise, occupational boundaries and control.’</p>
                     <p>Economist Professor Hamish Low believes that the future of work will involve major transitions across the whole life course for everyone: ‘The traditional trajectory of full-time education followed by full-time work followed by a pensioned retirement is a thing of the past,’ says Low. Instead, he envisages a multistage employment life: one where retraining happens across the life course, and where multiple jobs and no job happen by choice at different stages.</p>
                     <p>On the subject of job losses, Low believes the predictions are founded on a fallacy: ‘It assumes that the number of jobs is fixed. If in 30 years, half of 100 jobs are being carried out by robots, that doesn’t mean we are left with just 50 jobs for humans. The number of jobs will increase: we would expect there to be 150 jobs.’</p>
                     <p>Dr Ewan McGaughey, at Cambridge’s Centre for Business Research and King’s College London, agrees that ‘apocalyptic’ views about the future of work are misguided. ‘It’s the laws that restrict the supply of capital to the job market, not the advent of new technologies that causes unemployment.’</p>
                     <p>His recently published research answers the question of whether automation, AI and robotics will mean a ‘jobless future’ by looking at the causes of unemployment. ‘History is clear that change can mean redundancies. But social policies can tackle this through retraining and redeployment.’</p>
                     <p>He adds: ‘If there is going to be change to jobs as a result of AI and robotics then I’d like to see governments seizing the opportunity to improve policy to enforce good job security. We can “reprogramme” the law to prepare for a fairer future of work and leisure.’ McGaughey’s findings are a call to arms to leaders of organisations, governments and banks to pre-empt the coming changes with bold new policies that guarantee full employment, fair incomes and a thriving economic democracy.</p>
                     <p>‘The promises of these new technologies are astounding. They deliver humankind the capacity to live in a way that nobody could have once imagined,’ he adds. ‘Just as the industrial revolution brought people past subsistence agriculture, and the corporate revolution enabled mass production, a third revolution has been pronounced. But it will not only be one of technology. The next revolution will be social.’</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–7</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 1, text: "Polar bears suffer from various health problems due to the build-up of fat under their skin." },
                          { num: 2, text: "The study done by Liu and his colleagues compared different groups of polar bears." },
                          { num: 3, text: "Liu and colleagues were the first researchers to compare polar bears and brown bears genetically." },
                          { num: 4, text: "Polar bears are able to control their levels of ‘bad’ cholesterol by genetic means." },
                          { num: 5, text: "Female polar bears are able to survive for about six months without food." },
                          { num: 6, text: "It was found that the bones of female polar bears were very weak when they came out of their dens in spring." },
                          { num: 7, text: "The polar bear’s mechanism for increasing bone density could also be used by people one day." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 8–13</h3><p>Complete the table below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">Reasons why polar bears should be protected</h4>
                      <p>People think of bears as unintelligent and <strong>8</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} />.</p>
                      <p>However, this may not be correct. For example:</p>
                      <ul>
                        <li>• In Tennoji Zoo, a bear has been seen using a branch as a <strong>9</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} />. This allowed him to knock down some <strong>10</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} />.</li>
                        <li>• A wild polar bear worked out a method of reaching a platform where a <strong>11</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} /> was located.</li>
                        <li>• Polar bears have displayed behaviour such as conscious manipulation of objects and activity similar to a <strong>12</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} />.</li>
                      </ul>
                      <p>Bears may also display emotions. For example:</p>
                      <ul>
                          <li>• They may make movements suggesting <strong>13</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} /> if disappointed when hunting.</li>
                          <li>• They may form relationships with other species.</li>
                      </ul>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–20</h3><p>Reading Passage 2 has seven paragraphs, A–G. Choose the correct heading for each paragraph from the list of headings below. Write the correct number, i–ix.</p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-bold text-center mb-2">List of Headings</h4>
                      <ul className="text-sm list-roman list-inside">
                          <li>The areas and artefacts within the pyramid itself</li>
                          <li>A difficult task for those involved</li>
                          <li>A king who saved his people</li>
                          <li>A single certainty among other less definite facts</li>
                          <li>An overview of the external buildings and areas</li>
                          <li>A pyramid design that others copied</li>
                          <li>An idea for changing the design of burial structures</li>
                          <li>An incredible experience despite the few remains</li>
                          <li>The answers to some unexpected questions</li>
                      </ul>
                  </div>
                  <div className="space-y-2">
                      <p><strong>14</strong> Paragraph A <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} /></p>
                      <p><strong>15</strong> Paragraph B <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} /></p>
                      <p><strong>16</strong> Paragraph C <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} /></p>
                      <p><strong>17</strong> Paragraph D <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} /></p>
                      <p><strong>18</strong> Paragraph E <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} /></p>
                      <p><strong>19</strong> Paragraph F <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} /></p>
                      <p><strong>20</strong> Paragraph G <Input className={`inline-block w-20 ml-2 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /></p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21–24</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">The Step Pyramid of Djoser</h4>
                      <p>The complex that includes the Step Pyramid and its surroundings is considered to be as big as an Egyptian <strong>21</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} /> of the past. The area outside the pyramid included accommodation that was occupied by <strong>22</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} />, along with many other buildings and features.</p>
                      <p>A wall ran around the outside of the complex and a number of false entrances were built into this. In addition, a long <strong>23</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /> encircled the wall. As a result, any visitors who had not been invited were cleverly prevented from entering the pyramid grounds unless they knew the <strong>24</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /> of the real entrance.</p>
                  </div></div>
                  <div className="mb-8">
                    {renderMultiSelect('25_26', 'Questions 25 and 26', 'Which TWO of the following points does the writer make about King Djoser?', [
                        'Initially he had to be persuaded to build in stone rather than clay.',
                        'There is disagreement concerning the length of his reign.',
                        'He failed to appreciate Imhotep’s part in the design of the Step Pyramid.',
                        'A few of his possessions were still in his tomb when archaeologists found it.',
                        'He criticised the design and construction of other pyramids in Egypt.'
                    ], ['B', 'D'])}
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–30</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>27</strong> The first paragraph tells us about</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> the kinds of jobs that will be most affected by the growth of AI.</p><p><strong>B</strong> the extent to which AI will alter the nature of the work that people do.</p><p><strong>C</strong> the proportion of the world’s labour force who will have jobs in AI in the future.</p><p><strong>D</strong> the difference between ways that embodied and disembodied AI will impact on workers.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} /></div>
                      <div><p><strong>28</strong> According to the second paragraph, what is Stella Pachidi’s view of the ‘knowledge economy’?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> It is having an influence on the number of jobs available.</p><p><strong>B</strong> It is changing people’s attitudes towards their occupations.</p><p><strong>C</strong> It is the main reason why the production sector is declining.</p><p><strong>D</strong> It is a key factor driving current developments in the workplace.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} /></div>
                      <div><p><strong>29</strong> What did Pachidi observe at the telecommunications company?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> staff disagreeing with the recommendations of AI</p><p><strong>B</strong> staff feeling resentful about the intrusion of AI in their work</p><p><strong>C</strong> staff making sure that AI produces the results that they want</p><p><strong>D</strong> staff allowing AI to carry out tasks they ought to do themselves</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} /></div>
                      <div><p><strong>30</strong> In his recently published research, Ewan McGaughey</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> challenges the idea that redundancy is a negative thing.</p><p><strong>B</strong> shows the profound effect of mass unemployment on society.</p><p><strong>C</strong> highlights some differences between past and future job losses.</p><p><strong>D</strong> illustrates how changes in the job market can be successfully handled.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 31–34</h3><p>Complete the summary using the list of words, A–G, below. Write the correct letter, A–G.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">The ‘algorithmication’ of jobs</h4>
                      <p>Stella Pachidi of Cambridge Judge Business School has been focusing on the ‘algorithmication’ of jobs which rely not on production but on <strong>31</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />.</p>
                      <p>While monitoring a telecommunications company, Pachidi observed a growing <strong>32</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} /> on the recommendations made by AI, as workers begin to learn through the ‘algorithm’s eyes’. Meanwhile, staff are deterred from experimenting and using their own <strong>33</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />, and are therefore prevented from achieving innovation.</p>
                      <p>To avoid the kind of situations which Pachidi observed, researchers are trying to make AI’s decision-making process easier to comprehend, and to increase users’ <strong>34</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> with regard to the technology.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                      <div className="bg-gray-100 p-2 rounded"><strong>A</strong> pressure</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>B</strong> satisfaction</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>C</strong> intuition</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>D</strong> promotion</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>E</strong> reliance</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>F</strong> confidence</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>G</strong> information</div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 35–40</h3><p>Look at the following statements (Questions 35–40) and the list of people below. Match each statement with the correct person, A, B or C.</p>
                  <div className="space-y-4">
                      {[
                          { num: 35, text: "Greater levels of automation will not result in lower employment." },
                          { num: 36, text: "There are several reasons why AI is appealing to businesses." },
                          { num: 37, text: "AI’s potential to transform people’s lives has parallels with major cultural shifts in previous eras." },
                          { num: 38, text: "It is important to be aware of the range of problems that AI causes." },
                          { num: 39, text: "People are going to follow a less conventional career path than in the past." },
                          { num: 40, text: "Authorities should take measures to ensure that there will be adequately paid work for everyone." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div>
                   <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <h4 className="font-bold text-center mb-2">List of People</h4>
                      <ul className="text-sm list-none text-center space-y-1">
                          <li><strong>A</strong> Stella Pachidi</li>
                          <li><strong>B</strong> Hamish Low</li>
                          <li><strong>C</strong> Ewan McGaughey</li>
                      </ul>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>
        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['25', '26'].includes(q)).map(qNum => { 
  const isCorrect = checkAnswer(qNum); 
  const items = [(<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>)];
  
  // Add Q 25-26 after Q 24
  if (qNum === '24') {
    items.push(<div key="25-26" className={`p-3 rounded border ${multipleAnswers['25_26'].sort().join(',') === 'B,D' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 25-26</span><span className={`font-bold ${multipleAnswers['25_26'].sort().join(',') === 'B,D' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['25_26'].sort().join(',') === 'B,D' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['25_26'].length > 0 ? multipleAnswers['25_26'].sort().join(', ') : '(none)'}</div><div>Correct: B, D</div></div>);
  }
  
  return items;
}).flat()}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="reading" testNumber={1} /><UserTestHistory book="book-16" module="reading" testNumber={1} /></div>
      </div>
    </div>
  )
}