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

export default function Book15ReadingTest3() {
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
    
    if (questionNumber === '17' || questionNumber === '18') {
        const otherQ = questionNumber === '17' ? '18' : '17';
        const userAns = answers[questionNumber]?.toUpperCase().trim();
        const otherUserAns = answers[otherQ]?.toUpperCase().trim();
        const correctAnswersSet = ['B', 'D'];
        return correctAnswersSet.includes(userAns || '') && correctAnswersSet.includes(otherUserAns || '') && userAns !== otherUserAns;
    }

    if (questionNumber === '19' || questionNumber === '20') {
        const otherQ = questionNumber === '19' ? '20' : '19';
        const userAns = answers[questionNumber]?.toUpperCase().trim();
        const otherUserAns = answers[otherQ]?.toUpperCase().trim();
        const correctAnswersSet = ['A', 'E'];
        return correctAnswersSet.includes(userAns || '') && correctAnswersSet.includes(otherUserAns || '') && userAns !== otherUserAns;
    }

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
        testNumber: 3,
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
    '1': 'TRUE', '2': 'FALSE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'NOT GIVEN', '6': 'FALSE', '7': 'TRUE', '8': 'resignation', '9': 'materials', '10': 'miners', '11': 'family', '12': 'collectors', '13': 'income',
    '14': 'iii', '15': 'vi', '16': 'v', '17': 'x', '18': 'iv', '19': 'viii', '20': 'i', '21': 'wheels', '22': 'film', '23': 'filter', '24': 'waste', '25': 'performance', '26': 'servicing',
    '27': 'C', '28': 'B', '29': 'F', '30': 'A', '31': 'E', '32': 'D', '33': 'F', '34': 'B', '35': 'C', '36': 'G', '37': 'B', '38': 'D', '39': 'A', '40': 'A'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-15" module="reading" testNumber={3} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 15 - Reading Test 3</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Henry Moore (1898–1986)</h3>
                  <p className="text-center italic">The British sculptor Henry Moore was a leading figure in the 20th-century art world</p>
                  <p>Henry Moore was born in Castleford, a small town near Leeds in the north of England. He was the seventh child of Raymond Moore and his wife Mary Baker. He studied at Castleford Grammar School from 1909 to 1915, where his art teacher, Alice Gostick, was an important influence. After leaving school, Moore hoped to become a sculptor, but instead he complied with his father’s wish that he train as a schoolteacher. He had to abandon his training in 1917 when he was sent to France to fight in the First World War.</p>
                  <p>After the war, Moore enrolled at the Leeds School of Art, where he studied for two years. In his first year, he spent most of his time drawing. Although he wanted to study sculpture, no teacher was appointed until his second year. At the end of that year, he passed the sculpture examination and was awarded a scholarship to the Royal College of Art in London. In September 1921, he moved to London and began three years of advanced study in sculpture.</p>
                  <p>Alongside the instruction he received at the Royal College, Moore visited many of the London museums, particularly the British Museum, which had a wide-ranging collection of ancient sculpture. During these visits, he discovered the power and beauty of ancient Egyptian and African sculpture. As he became increasingly interested in these ‘primitive’ forms of art, he turned away from European sculptural traditions.</p>
                  <p>After graduating, Moore spent the first six months of 1925 travelling in France. When he visited the Trocadero Museum in Paris, he was impressed by a cast of a Mayan* sculpture of the rain spirit. It was a male reclining figure with its knees drawn up together, and its head at a right angle to its body. Moore became fascinated with this stone sculpture, which he thought had a power and originality that no other stone sculpture possessed. He himself started carving a variety of subjects in stone, including depictions of reclining women, mother-and-child groups, and masks.</p>
                  <p>Moore’s exceptional talent soon gained recognition, and in 1926 he started work as a sculpture instructor at the Royal College. In 1933, he became a member of a group of young artists called Unit One. The aim of the group was to convince the English public of the merits of the emerging international movement in modern art and architecture.</p>
                  <p>Around this time, Moore moved away from the human figure to experiment with abstract shapes. In 1931, he held an exhibition at the Leicester Galleries in London. His work was enthusiastically welcomed by fellow sculptors, but the reviews in the press were extremely negative and turned Moore into a notorious figure. There were calls for his resignation from the Royal College, and the following year, when his contract expired, he left to start a sculpture department at the Chelsea School of Art in London.</p>
                  <p>Throughout the 1930s, Moore did not show any inclination to please the British public. He became interested in the paintings of the Spanish artist Pablo Picasso, whose work inspired him to distort the human body in a radical way. At times, he seemed to abandon the human figure altogether. The pages of his sketchbooks from this period show his ideas for abstract sculptures that bore little resemblance to the human form.</p>
                  <p>During the Second World War, Moore stopped teaching at the Chelsea School and moved to a farmhouse about 20 miles north of London. A shortage of materials forced him to focus on drawing. He did numerous small sketches of Londoners, later turning these ideas into large coloured drawings in his studio. In 1942, he returned to Castleford to make a series of sketches of the miners who worked there.</p>
                  <p>In 1944, a town near London offered Moore a commission for a sculpture depicting a family. The resulting work signifies a dramatic change in Moore’s style, away from the experimentation of the 1930s towards a more natural and humanistic subject matter. He did dozens of studies in clay for the sculpture, and they were cast in bronze and issued in editions of seven to nine copies each. This gave Moore’s work a wide circulation. The boost to his income enabled him to take on ambitious projects and start working on the scale he felt his sculpture demanded.</p>
                  <p>Critics who had begun to think that Moore had become less revolutionary were proven wrong by the appearance, in 1950, of the first of Moore’s series of standing figures in bronze, with their harsh and angular pierced forms and distinct impression of menace. Moore also varied his subject matter with works such as the 1950s bronze *Warrior with Shield* and *Falling Warrior*. These were rare examples of Moore’s use of the male figure and owe something to his visit to Greece in 1951, when he had the opportunity to study ancient works of art.</p>
                  <p>In his final years, Moore created the Henry Moore Foundation to promote art appreciation and to display his work. Moore was the first modern English sculptor to achieve international critical acclaim and he is still regarded as one of the most important sculptors of the 20th century.</p>
                  <p className="text-xs">*Mayan: belonging to an ancient civilisation that inhabited parts of current-day Mexico, Guatemala, Belize, El Salvador and Honduras.</p>
              </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <h3 className="text-center font-bold">The Desolenator: producing clean water</h3>
                     <p>A. Travelling around Thailand in the 1990s, William Janssen was impressed with the basic rooftop solar heating systems that were on many homes, where energy from the sun was absorbed by a plate and then used to heat water for domestic use. Two decades later Janssen developed that basic idea he saw in Southeast Asia into a portable device that uses the power from the sun to purify water.</p>
                     <p>B. The Desolenator operates as a mobile desalination unit that can take water from different places, such as the sea, rivers, boreholes and rain, and purify it for human consumption. It is particularly valuable in regions where natural groundwater reserves have been polluted, or where seawater is the only water source available.</p>
                     <p>C. Janssen saw that there was a need for a sustainable way to clean water in both the developing and the developed countries when he moved to the United Arab Emirates. He became aware that there was a problem with water supplies and large-scale water processing. ‘I was confronted with the enormous carbon footprint that the Gulf nations have because of all of the desalination that they do,’ he says.</p>
                     <p>D. The Desolenator can produce 15 litres of drinking water per day, enough to sustain a family for cooking and drinking. Its main selling point is that unlike standard desalination techniques, it doesn’t require a generated power supply: just sunlight. It is made of a solar panel, a battery and a boiler. Water enters through a pipe and flows as a thin film between a sheet of double glazing and the solar panel. The panel heats the water, which then flows into a small boiler, which is heated by the solar-powered battery. The water is then vaporised and any pollutants are separated from the water, which is then condensed and collected. The device is easy to transport, and has a very simple filter to trap particles, which can be easily cleaned or replaced. The performance of the unit is shown on an LCD screen and transmitted to the company which provides servicing when necessary.</p>
                     <p>E. A recent analysis found that at least two-thirds of the world’s population lives with severe water scarcity for at least a month every year. Janssen says that by 2030 half of the world’s population will be living with water stress – where demand exceeds the supply over a certain period of time. ‘It is really important that a sustainable solution is brought to the market to help these people,’ he says. Many countries ‘don’t have the money for desalination plants, which are very expensive to build. They don’t have the money to operate them, they are very maintenance intensive, and they don’t have the money to buy the diesel to run the desalination plants, so it is a really bad situation.’</p>
                     <p>F. The device is aimed at a wide variety of users – from homeowners in the developing world who do not have a constant supply of water, to people living off the grid in rural parts of the US. The first commercial versions of the Desolenator are expected to be in operation in India early next year, after field tests are carried out. The market for the self-sufficient devices in developing countries is twofold – those who cannot afford the money for the device outright and pay through microfinance, and middle-income homes that can lease their own equipment. ‘People in India don’t pay for a fridge outright; they pay for it over six months. They would put the Desolenator on their roof and hook it up to their municipal supply and they would get very reliable drinking water on a daily basis,’ Janssen says. In the developed world, it is aimed at niche markets where tap water is unavailable – for camping, on boats, or for the military, for instance.</p>
                     <p>G. Prices will vary according to where it is bought. In the developing world, the price will depend on what deal aid organisations can negotiate. In developed countries, it is likely to come in at $1,000 (£685) a unit, said Janssen. ‘We are a venture with a social mission. We are aware that the product we have envisioned is mainly finding application in the developing world and humanitarian sector and that this is the way we will proceed. We do realise, though, that to be a viable company there is a bottom line to keep in mind,’ he says.</p>
                     <p>H. The company itself is based at Imperial College London, although Janssen is its only chief executive, still lives in the UAE. He has raised £340,000 in funding so far. Within two years, he says, the company aims to be selling 1,000 units a month, mainly in the humanitarian field. They are expected to be sold in areas such as Australia, northern Chile, Peru, Texas and California.</p>
              </CardContent></Card>
              
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Why fairy tales are really scary tales</h3>
                  <p>Some people think that fairy tales are just stories to amuse children, but their universal and enduring appeal may be due to more serious reasons.</p>
                  <p>People of every culture tell each other fairy tales but the same story often takes a variety of forms in different parts of the world. In the story of Little Red Riding Hood that European children are familiar with, a young girl on the way to see her grandmother meets a wolf and tells him where she is going. The wolf runs on ahead and disposes of the grandmother, then gets into bed dressed in the grandmother’s clothes to wait for Little Red Riding Hood. You may know the story – but which version? In some versions, the wolf swallows up the grandmother, while in others it locks her in a cupboard. In some stories Red Riding Hood gets the better of the wolf on her own, while in others a hunter or a woodcutter hears her cries and comes to her rescue.</p>
                  <p>The universal appeal of these tales is frequently attributed to the idea that they contain cautionary messages: in the case of Little Red Riding Hood, to listen to your mother, and avoid talking to strangers. ‘It might be what we find interesting about this story is that it’s got this survival-relevant information in it,’ says anthropologist Jamie Tehrani at Durham University in the UK. But his research suggests otherwise. ‘We have this huge gap in our knowledge about the history and prehistory of storytelling, despite the fact that we know this genre is an incredibly ancient one,’ he says. That hasn’t stopped anthropologists, folklorists* and other academics devising theories to explain the importance of fairy tales in human society. Now Tehrani has found a way to test these ideas, borrowing a technique from evolutionary biologists.</p>
                  <p>To work out the evolutionary history, development and relationships among groups of organisms, biologists compare the characteristics of living species in a process called ‘phylogenetic analysis’. Tehrani has used the same approach to compare related versions of fairy tales to discover how they have evolved and which elements have survived longest. Tehrani’s analysis focused on Little Red Riding Hood in its many forms, which include another Western fairy tale known as The Wolf and the Kids. Checking for variants of these two tales and similar stories from Africa, East Asia and other regions, he ended up with 58 stories recorded from oral traditions. Once his phylogenetic analysis had established that they were indeed related, he used the same methods to explore how they have developed and altered over time.</p>
                  <p>First, he tested some assumptions about which aspects of the story alter least as it is retold, indicating their importance. Folklorists believe that what happens in a story is more central to the story than the characters in it – that visiting a relative, only to be met by a scary animal in disguise, is more fundamental than whether the visitor is a little girl or a group of kids, or whether the scary animal is a tiger or a wolf. </p>
                  <p>However, Tehrani found no significant difference in the rate of evolution of incidents compared with that of characters. 'Certain episodes are very stable because they are crucial to the story, but there are lots of other details that can evolve quite freely,' he says. Neither did his analysis support the theory that the central section of a story is the most conserved part. He found no significant difference in the flexibility of events there compared with the beginning or the end.</p>
                  <p>But the really big surprise came when he looked at the cautionary elements of the story. ‘Studies on hunter-gatherer folk tales suggest that these narratives include really important information about the environment and the possible dangers that may be faced there - stuff that’s relevant to survival,’ he says. Yet in his analysis such elements were just as flexible as seemingly trivial details. What, then, is important enough to be reproduced from generation to generation?</p>
                  <p>The answer, it would appear, is fear – blood-thirsty and gruesome aspects of the story, such as the eating of the grandmother by the wolf, turned out to be the best preserved of all. Why are these details retained by generations of storytellers, when other features are not? Tehrani has an idea: ‘In an oral context, a story won’t survive because of one great teller. It also needs to be interesting when it’s told by someone who’s not necessarily a great storyteller.’ Maybe being swallowed whole by a wolf, then cut out of its stomach alive is so gripping that it helps the story remain popular, no matter how badly it’s told.</p>
                  <p>Jack Zipes at the University of Minnesota, Minneapolis, is unconvinced by Tehrani’s views on fairy tales. ‘Even if they’re gruesome, they won’t stick unless they matter,’ he says. He believes the perennial theme of women as victims in stories like Little Red Riding Hood explains why they continue to feel relevant. But Tehrani points out that although this is often the case in Western versions, it isn’t always true elsewhere. In Chinese and Japanese versions, often known as The Tiger Grandmother, the villain is a woman, and in both Iran and Nigeria, the victim is a boy.</p>
                  <p>Mathias Clasen at Aarhus University in Denmark isn’t surprised by Tehrani’s findings. ‘Habits and morals change, but the things that scare us, and the fact that we seek out entertainment that’s designed to scare us – those are constant,’ he says. Clasen believes that scary stories teach us what it feels like to be afraid without having to experience real danger, and so build up resistance to negative emotions.</p>
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
                        <p><strong>1</strong> On leaving school, Moore did what his father wanted him to do.</p><Input className={`max-w-[150px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>2</strong> Moore began studying sculpture in his first term at the Leeds School of Art.</p><Input className={`max-w-[150px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>3</strong> When Moore started at the Royal College of Art, its reputation for teaching sculpture was excellent.</p><Input className={`max-w-[150px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>4</strong> Moore became aware of ancient sculpture as a result of visiting London museums.</p><Input className={`max-w-[150px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>5</strong> The Trocadero Museum’s Mayan sculpture attracted a lot of public interest.</p><Input className={`max-w-[150px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>6</strong> Moore thought the Mayan sculpture was similar in certain respects to other stone sculptures.</p><Input className={`max-w-[150px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>7</strong> The artists who belonged to Unit One wanted to make modern art and architecture more popular.</p><Input className={`max-w-[150px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 8–13</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">Moore’s career as an artist</h4>
                        <p><strong>1930s</strong></p>
                        <ul className="list-disc pl-6">
                          <li>Moore’s exhibition at the Leicester Galleries is criticised by the press</li>
                          <li>Moore is urged to offer his <strong>8</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} /> and leave the Royal College</li>
                        </ul>
                        <p><strong>1940s</strong></p>
                        <ul className="list-disc pl-6">
                          <li>Moore turns to drawing because <strong>9</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} /> for sculpting are not readily available</li>
                          <li>While visiting his hometown, Moore does some drawings of <strong>10</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} /></li>
                          <li>Moore is employed to produce a sculpture of a <strong>11</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} /></li>
                          <li><strong>12</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} /> start to buy Moore’s work</li>
                          <li>Moore’s increased <strong>13</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} /> makes it possible for him to do more ambitious sculptures</li>
                        </ul>
                        <p><strong>1950s</strong></p>
                        <ul className="list-disc pl-6">
                          <li>Moore’s series of bronze figures marks a further change in his style</li>
                        </ul>
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-20</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–20</h3><p>Reading Passage 2 has eight sections, A–H. Choose the correct heading for each section from the list of headings below. Write the correct number, i–x, in boxes 14–20 on your answer sheet.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of Headings</strong></p>
                        <p><strong>i</strong> Getting the finance for production</p>
                        <p><strong>ii</strong> An unexpected benefit</p>
                        <p><strong>iii</strong> From initial inspiration to new product</p>
                        <p><strong>iv</strong> The range of potential customers for the device</p>
                        <p><strong>v</strong> What makes the device different from alternatives</p>
                        <p><strong>vi</strong> Cleaning water from a range of sources</p>
                        <p><strong>vii</strong> Overcoming production difficulties</p>
                        <p><strong>viii</strong> Profit not the primary goal</p>
                        <p><strong>ix</strong> A warm welcome for the device</p>
                        <p><strong>x</strong> The number of people affected by water shortages</p>
                    </div>
                    <div className="space-y-4">
                        <p><strong>14</strong> Section A <Input className={`max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p><strong>15</strong> Section B <Input className={`max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p><strong>16</strong> Section D <Input className={`max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p><strong>17</strong> Section E <Input className={`max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p><strong>18</strong> Section F <Input className={`max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p><strong>19</strong> Section G <Input className={`max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p><strong>20</strong> Section H <Input className={`max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21–26</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">How the Desolenator works</h4>
                        <p>The energy required to operate the Desolenator comes from sunlight. The device can be used in different locations, as it has <strong>21</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} />. Water is fed into a pipe, and a <strong>22</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} /> of water flows over a solar panel. The water then enters a boiler, where it turns into steam. Any particles in the water are caught in a <strong>23</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} />. The purified water comes out through one tube, and all types of <strong>24</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /> come out through another. A screen displays the <strong>25</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> of the device, and transmits the information to the company so that they know when the Desolenator requires <strong>26</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} />.</p>
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–31</h3><p>Complete each sentence with the correct ending, A–F, below.</p>
                  <div className="space-y-4">
                      <p><strong>27</strong> In fairy tales, details of the plot <Input className={`max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                      <p><strong>28</strong> Tehrani rejects the idea that the useful lessons for life in fairy tales <Input className={`max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                      <p><strong>29</strong> Various theories about the social significance of fairy tales <Input className={`max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                      <p><strong>30</strong> Insights into the development of fairy tales <Input className={`max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                      <p><strong>31</strong> All the fairy tales analysed by Tehrani <Input className={`max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2"><p><strong>A</strong> may be provided through methods used in biological research.</p><p><strong>B</strong> are the reason for their survival.</p><p><strong>C</strong> show considerable global variation.</p><p><strong>D</strong> contain animals which transform to become humans.</p><p><strong>E</strong> were originally spoken rather than written.</p><p><strong>F</strong> have been developed without factual basis.</p></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32–36</h3><p>Complete the summary using the list of words, A–I, below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">Phylogenetic analysis of Little Red Riding Hood</h4>
                      <p>Tehrani used techniques from evolutionary biology to find out if <strong>32</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} /> existed among 58 stories from around the world. He also wanted to know which aspects of the stories had fewest <strong>33</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />, as he believed these would be the most important ones. Contrary to other beliefs, he found that some <strong>34</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> that were included in a story tended to change over time, and that the moral of a story seemed no more important than the other parts. He was also surprised that parts of a story which seemed to provide some sort of <strong>35</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> were unimportant. The aspect that he found most important in a story's survival was <strong>36</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-sm"><p><strong>A</strong> ending</p><p><strong>B</strong> events</p><p><strong>C</strong> warning</p><p><strong>D</strong> links</p><p><strong>E</strong> records</p><p><strong>F</strong> variations</p><p><strong>G</strong> horror</p><p><strong>H</strong> people</p><p><strong>I</strong> plot</p></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37–40</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>37</strong> What method did Jamie Tehrani use to test his ideas about fairy tales?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> He compared oral and written forms of the same stories.</p><p><strong>B</strong> He looked at many different forms of the same basic story.</p><p><strong>C</strong> He looked at unrelated stories from many different countries.</p><p><strong>D</strong> He contrasted the development of fairy tales with that of living creatures.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /></div>
                      <div><p><strong>38</strong> When discussing Tehrani’s views, Jack Zipes suggests that</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> Tehrani ignores key changes in the role of women.</p><p><strong>B</strong> stories which are too horrific are not always taken seriously.</p><p><strong>C</strong> Tehrani overemphasises the importance of violence in stories.</p><p><strong>D</strong> features of stories only survive if they have a deeper significance.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /></div>
                      <div><p><strong>39</strong> Why does Tehrani refer to Chinese and Japanese fairy tales?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> to indicate that Jack Zipes’ theory is incorrect</p><p><strong>B</strong> to suggest that crime is a global problem</p><p><strong>C</strong> to imply that all fairy tales have a similar meaning</p><p><strong>D</strong> to add more evidence for Jack Zipes’ ideas</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /></div>
                      <div><p><strong>40</strong> What does Mathias Clasen believe about fairy tales?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> They are a safe way of learning to deal with fear.</p><p><strong>B</strong> They are a type of entertainment that some people avoid.</p><p><strong>C</strong> They reflect the changing values of our society.</p><p><strong>D</strong> They reduce our ability to deal with real-world problems.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /></div>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="reading" testNumber={3} /><UserTestHistory book="book-15" module="reading" testNumber={3} /></div>
      </div>
    </div>
  )
}