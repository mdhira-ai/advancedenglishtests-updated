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

export default function Book17ReadingTest3() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21_22': [],
  })
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();

  useEffect(() => {
    if (!hasTrackedClick.current) {
      setTestStartTime(Date.now()); hasTrackedClick.current = true;
    }
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

  const handleMultiSelect = (key: '21_22', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    
    if (['21', '22'].includes(questionNumber)) {
        return false;
    }

    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&') || ['21', '22'].includes(qNum)) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    
    const userChoices21_22 = multipleAnswers['21_22'] || [];
    const correctSet21_22 = ['B', 'C'];
    userChoices21_22.forEach(choice => {
        if (correctSet21_22.includes(choice)) {
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
      await saveTestScore({
        book: 'book-17',
        module: 'reading',
        testNumber: 3,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      }, session);
      setSubmitted(true); setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      const calculatedScore = calculateScore(); setScore(calculatedScore); setSubmitted(true); setShowResultsPopup(true);
    } finally { setIsSubmitting(false); }
  }

  const handleReset = () => {
    setAnswers({}); setMultipleAnswers({ '21_22': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const renderMultiSelect = (key: '21_22', title: string, question: string, options: string[], correctSet: string[]) => (
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
    '1': 'carnivorous', '2': 'scent', '3': 'pouch', '4': 'fossil', '5': 'habitat', '6': 'TRUE', '7': 'FALSE', '8': 'NOT GIVEN', '9': 'FALSE',
    '10': 'NOT GIVEN', '11': 'FALSE', '12': 'TRUE', '13': 'NOT GIVEN', '14': 'F', '15': 'G', '16': 'A', '17': 'H', '18': 'B', '19': 'E', '20': 'C',
    '21': 'B', '22': 'C', '21&22': ['B', 'C'], '23': 'solid', '24': '(Sumatran) orangutan', '25': 'carbon stocks', '26': 'biodiversity', '27': 'D',
    '28': 'B', '29': 'C', '30': 'D', '31': 'C', '32': 'NO', '33': 'YES', '34': 'NOT GIVEN', '35': 'NO', '36': 'H', '37': 'D', '38': 'I', '39': 'B', '40': 'F'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-17" module="reading" testNumber={3} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 17 - Reading Test 3</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div></div>
        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The thylacine</p>
                     <p>The extinct thylacine, also known as the Tasmanian tiger, was a marsupial* that bore a superficial resemblance to a dog. Its most distinguishing feature was the 13-19 dark brown stripes over its back, beginning at the rear of the body and extending onto the tail. The thylacine's average nose-to-tail length for adult males was 162.6 cm, compared to 153.7 cm for females.</p>
                     <p>The thylacine appeared to occupy most types of terrain except dense rainforest, with open eucalyptus forest thought to be its prime habitat. In terms of feeding, it was exclusively carnivorous, and its stomach was muscular with an ability to distend so that it could eat large amounts of food at one time, probably an adaptation to compensate for long periods when hunting was unsuccessful and food scarce. The thylacine was not a fast runner and probably caught its prey by exhausting it during a long pursuit. During long-distance chases, thylacines were likely to have relied more on scent than any other sense. They emerged to hunt during the evening, night and early morning and tended to retreat to the hills and forest for shelter during the day. Despite the common name 'tiger', the thylacine had a shy, nervous temperament. Although mainly nocturnal, it was sighted moving during the day and some individuals were even recorded basking in the sun.</p>
                     <p>The thylacine had an extended breeding season from winter to spring, with indications that some breeding took place throughout the year. The thylacine, like all marsupials, was tiny and hairless when born. Newborns crawled into the pouch on the belly of their mother, and attached themselves to one of the four teats, remaining there for up to three months. When old enough to leave the pouch, the young stayed in a lair such as a deep rocky cave, well-hidden nest or hollow log, whilst the mother hunted.</p>
                     <p>Approximately 4,000 years ago, the thylacine was widespread throughout New Guinea and most of mainland Australia, as well as the island of Tasmania. The most recent, well-dated occurrence of a thylacine on the mainland is a carbon-dated fossil from Murray Cave in Western Australia, which is around 3,100 years old. Its extinction coincided closely with the arrival of wild dogs called dingoes in Australia and a similar predator in New Guinea. Dingoes never reached Tasmania, and most scientists see this as the main reason for the thylacine's survival there.</p>
                     <p>The dramatic decline of the thylacine in Tasmania, which began in the 1830s and continued for a century, is generally attributed to the relentless efforts of sheep farmers and bounty hunters** with shotguns. While this determined campaign undoubtedly played a large part, it is likely that various other factors also contributed to the decline and eventual extinction of the species. These include competition with wild dogs introduced by European settlers, loss of habitat along with the disappearance of prey species, and a distemper-like disease which may also have affected the thylacine.</p>
                     <p>There was only one successful attempt to breed a thylacine in captivity, at Melbourne Zoo in 1899. This was despite the large numbers that went through some zoos, particularly London Zoo and Tasmania's Hobart Zoo. The famous naturalist John Gould foresaw the thylacine's demise when he published his Mammals of Australia between 1848 and 1863, writing, 'The numbers of this singular animal will speedily diminish, extermination will have its full sway, and it will then, like the wolf of England and Scotland, be recorded as an animal of the past.'</p>
                     <p>However, there seems to have been little public pressure to preserve the thylacine, nor was much concern expressed by scientists at the decline of this species in the decades that followed. A notable exception was T.T. Flynn, Professor of Biology at the University of Tasmania. In 1914, he was sufficiently concerned about the scarcity of the thylacine to suggest that some should be captured and placed on a small island. But it was not until 1929, with the species on the very edge of extinction, that Tasmania's Animals and Birds Protection Board passed a motion protecting thylacines only for the month of December, which was thought to be their prime breeding season. The last known wild thylacine to be killed was shot by a farmer in the north-east of Tasmania in 1930, leaving just captive specimens. Official protection of the species by the Tasmanian government was introduced in July 1936, 59 days before the last known individual died in Hobart Zoo on 7th September, 1936.</p>
                     <p>There have been numerous expeditions and searches for the thylacine over the years, none of which has produced definitive evidence that thylacines still exist. The species was declared extinct by the Tasmanian government in 1986.</p>
                     <p className="text-xs italic">*marsupial: a mammal, such as a kangaroo, whose young are born incompletely developed and are typically carried and suckled in a pouch on the mother's belly</p>
                     <p className="text-xs italic">**bounty hunters: people who are paid a reward for killing a wild animal</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Palm oil</p>
                     <p><span className="font-semibold">A</span> Palm oil is an edible oil derived from the fruit of the African oil palm tree, and is currently the most consumed vegetable oil in the world. It's almost certainly in the soap we wash with in the morning, the sandwich we have for lunch, and the biscuits we snack on during the day. Why is palm oil so attractive for manufacturers? Primarily because its unique properties – such as remaining solid at room temperature – make it an ideal ingredient for long-term preservation, allowing many packaged foods on supermarket shelves to have 'best before' dates of months, even years, into the future.</p>
                     <p><span className="font-semibold">B</span> Many farmers have seized the opportunity to maximise the planting of oil palm trees. Between 1990 and 2012, the global land area devoted to growing oil palm trees grew from 6 to 17 million hectares, now accounting for around ten percent of total cropland in the entire world. From a mere two million tonnes of palm oil being produced annually globally 50 years ago, there are now around 60 million tonnes produced every single year, a figure looking likely to double or even triple by the middle of the century.</p>
                     <p><span className="font-semibold">C</span> However, there are multiple reasons why conservationists cite the rapid spread of oil palm plantations as a major concern. There are countless news stories of deforestation, habitat destruction and dwindling species populations, all as a direct result of land clearing to establish oil palm tree monoculture on an industrial scale, particularly in Malaysia and Indonesia. Endangered species – most famously the Sumatran orangutan, but also rhinos, elephants, tigers, and numerous other fauna – have suffered from the unstoppable spread of oil palm plantations.</p>
                     <p><span className="font-semibold">D</span> 'Palm oil is surely one of the greatest threats to global biodiversity,' declares Dr Farnon Ellwood of the University of the West of England, Bristol. 'Palm oil is replacing rainforest, and rainforest is where all the species are. That's a problem.' This has led to some radical questions among environmentalists, such as whether consumers should try to boycott palm oil entirely. Meanwhile Bhavani Shankar, Professor at London's School of Oriental and African Studies, argues, 'It's easy to say that palm oil is the enemy and we should be against it. It makes for a more dramatic story, and it's very intuitive. But given the complexity of the argument, I think a much more nuanced story is closer to the truth.'</p>
                     <p><span className="font-semibold">E</span> One response to the boycott movement has been the argument for the vital role palm oil plays in lifting many millions of people in the developing world out of poverty. Is it desirable to have palm oil boycotted, replaced, eliminated from the global supply chain, given how many low-income people in developing countries depend on it for their livelihoods? How best to strike a utilitarian balance between these competing factors has become a serious bone of contention.</p>
                     <p><span className="font-semibold">F</span> Even the deforestation argument isn't as straightforward as it seems. Oil palm plantations produce at least four and potentially up to ten times more oil per hectare than soybean, rapeseed, sunflower or other competing oils. That immensely high yield – which is predominantly what makes it so profitable – is potentially also an ecological benefit. If ten times more palm oil can be produced from a patch of land than any competing oil, then ten times more land would need to be cleared in order to produce the same volume of oil from that competitor. As for the question of carbon emissions, the issue really depends on what oil palm trees are replacing. Crops vary in the degree to which they sequester carbon – in other words, the amount of carbon they capture from the atmosphere and store within the plant. The more carbon a plant sequesters, the more it reduces the effect of climate change. As Shankar explains: '[Palm oil production] actually sequesters more carbon in some ways than other alternatives. [...] Of course, if you're cutting down virgin forest it's terrible – that's what's happening in Indonesia and Malaysia, it's been allowed to get out of hand. But if it's replacing rice, for example, it might actually sequester more carbon.'</p>
                     <p><span className="font-semibold">G</span> The industry is now regulated by a group called the Roundtable on Sustainable Palm Oil (RSPO), consisting of palm growers, retailers, product manufacturers, and other interested parties. Over the past decade or so, an agreement has gradually been reached regarding standards that producers of palm oil have to meet in order for their product to be regarded as officially 'sustainable'. The RSPO insists upon no virgin forest clearing, transparency and regular assessment of carbon stocks, among other criteria. Only once these requirements are fully satisfied is the oil allowed to be sold as certified sustainable palm oil (CSPO). Recent figures show that the RSPO now certifies around 12 million tonnes of palm oil annually, equivalent to roughly 21 percent of the world's total palm oil production.</p>
                     <p><span className="font-semibold">H</span> There is even hope that oil palm plantations might not need to be such sterile monocultures, or 'green deserts', as Ellwood describes them. New research at Ellwood's lab hints at one plant which might make all the difference. The bird's nest fern (Asplenium nidus) grows on trees in an epiphytic fashion (meaning it's dependent on the tree only for support, not for nutrients), and is native to many tropical regions, where as a keystone species it performs a vital ecological role. Ellwood believes that reintroducing the bird's nest fern into oil palm plantations could potentially allow these areas to recover their biodiversity, providing a home for all manner of species, from fungi and bacteria, to invertebrates such as insects, amphibians, reptiles and even mammals.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Building the Skyline: The Birth and Growth of Manhattan's Skyscrapers</p>
                     <p className="italic text-center mb-4">Katharine L. Shester reviews a book by Jason Barr about the development of New York City</p>
                     <p>In Building the Skyline, Jason Barr takes the reader through a detailed history of New York City. The book combines geology, history, economics, and a lot of data to explain why business clusters developed where they did and how the early decisions of workers and firms shaped the skyline we see today. Building the Skyline is organized into two distinct parts. The first is primarily historical and addresses New York's settlement and growth from 1609 to 1900; the second deals primarily with the 20th century and is a compilation of chapters commenting on different aspects of New York's urban development. The tone and organization of the book changes somewhat between the first and second parts, as the latter chapters incorporate aspects of Barr's related research papers.</p>
                     <p>Barr begins chapter one by taking the reader on a 'helicopter time-machine' ride – giving a fascinating account of how the New York landscape in 1609 might have looked from the sky. He then moves on to a subterranean walking tour of the city, indicating the location of rock and water below the subsoil, before taking the reader back to the surface. His love of the city comes through as he describes various fun facts about the location of the New York residence of early 19th-century vice-president Aaron Burr as well as a number of legends about the city.</p>
                     <p>Chapters two and three take the reader up to the Civil War (1861–1865), with chapter two focusing on the early development of land and the implementation of a grid system in 1811. Chapter three focuses on land use before the Civil War. Both chapters are informative and well researched and set the stage for the economic analysis that comes later in the book. I would have liked Barr to expand upon his claim that existing tenements* prevented skyscrapers in certain neighborhoods because 'likely no skyscraper developer was interested in performing the necessary "slum clearance"'. Later in the book, Barr makes the claim that the depth of bedrock** was not a limiting factor for developers, as foundation costs were a small fraction of the cost of development. At first glance, it is not obvious why slum clearance would be limiting, while more expensive foundations would not.</p>
                     <p>Chapter four focuses on immigration and the location of neighborhoods and tenements in the late 19th century. Barr identifies four primary immigrant enclaves and analyzes their locations in terms of the amenities available in the area. Most of these enclaves were located on the least valuable land, between the industries located on the waterfront and the wealthy neighborhoods bordering Central Park.</p>
                     <p>Part two of the book begins with a discussion of the economics of skyscraper height. In chapter five, Barr distinguishes between engineering height, economic height, and developer height – where engineering height is the tallest building that can be safely made at a given time, economic height is the height that is most efficient from society's point of view, and developer height is the actual height chosen by the developer, who is attempting to maximize return on investment. Chapter five also has an interesting discussion of the technological advances that led to the construction of skyscrapers. For example, the introduction of iron and steel skeletal frames made thick, load-bearing walls unnecessary, expanding the usable square footage of buildings and increasing the use of windows and availability of natural light. Chapter six then presents data on building height throughout the 20th century and uses regression analysis to 'predict' building construction. While less technical than the research paper on which the chapter is based, it is probably more technical than would be preferred by a general audience.</p>
                     <p>Chapter seven tackles the 'bedrock myth', the assumption that the absence of bedrock close to the surface between Downtown and Midtown New York is the reason for skyscrapers not being built between the two urban centers. Rather, Barr argues that while deeper bedrock does increase foundation costs, these costs were neither prohibitively high nor were they large compared to the overall cost of building a skyscraper. What I enjoyed the most about this chapter was Barr's discussion of how foundations are actually built. He describes the use of caissons, which enable workers to dig down for considerable distances, often below the water table, until they reach bedrock. Barr's thorough technological history discusses not only how caissons work, but also the dangers involved. While this chapter references empirical research papers, it is a relatively easy read.</p>
                     <p>Chapters eight and nine focus on the birth of Midtown and the building boom of the 1920s. Chapter eight contains lengthy discussions of urban economic theory that may serve as a distraction to readers primarily interested in New York. However, they would be well-suited for undergraduates learning about the economics of cities. In the next chapter, Barr considers two of the primary explanations for the building boom of the 1920s – the first being exuberance, and the second being financing. He uses data to assess the viability of these two explanations and finds that supply and demand factors explain much of the development of the 1920s; though it enabled the boom, cheap credit was not, he argues, the primary cause.</p>
                     <p>In the final chapter (chapter 10), Barr discusses another of his empirical papers that estimates Manhattan land values from the mid-19th century to the present day. The data work that went into these estimations is particularly impressive. Toward the end of the chapter, Barr assesses 'whether skyscrapers are a cause or an effect of high land values'. He finds that changes in land values predict future building height, but the reverse is not true. The book ends with an epilogue, in which Barr discusses the impact of climate change on the city and makes policy suggestions for New York going forward.</p>
                     <p className="text-xs italic">*a tenement: a multi-occupancy building of any sort, but particularly a run-down apartment building or slum building</p>
                     <p className="text-xs italic">**bedrock: the solid, hard rock in the ground that lies under a loose layer of soil</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–5</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-bold text-center">The thylacine</h4>
                    <p><strong>Appearance and behaviour</strong></p>
                    <ul><li>• looked rather like a dog</li><li>• had a series of stripes along its body and tail</li><li>• ate an entirely <strong>1</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /> diet</li><li>• probably depended mainly on <strong>2</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} /> when hunting</li><li>• young spent first months of life inside its mother's <strong>3</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} />.</li></ul>
                    <p><strong>Decline and extinction</strong></p>
                    <ul><li>• last evidence in mainland Australia is a 3,100-year-old <strong>4</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} />.</li><li>• probably went extinct in mainland Australia due to animals known as dingoes</li><li>• reduction in <strong>5</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} /> and available sources of food were partly responsible for decline in Tasmania</li></ul>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6–13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 6, text: "Significant numbers of thylacines were killed by humans from the 1830s onwards." },
                          { num: 7, text: "Several thylacines were born in zoos during the late 1800s." },
                          { num: 8, text: "John Gould's prediction about the thylacine surprised some biologists." },
                          { num: 9, text: "In the early 1900s, many scientists became worried about the possible extinction of the thylacine." },
                          { num: 10, text: "T. T. Flynn's proposal to rehome captive thylacines on an island proved to be impractical." },
                          { num: 11, text: "There were still reasonable numbers of thylacines in existence when a piece of legislation protecting the species during their breeding season was passed." },
                          { num: 12, text: "From 1930 to 1936, the only known living thylacines were all in captivity." },
                          { num: 13, text: "Attempts to find living thylacines are now rarely made." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–20</h3><p>Reading Passage 2 has eight sections, A–H. Which section contains the following information?</p>
                  <div className="space-y-4">
                      {[
                          { num: 14, text: "examples of a range of potential environmental advantages of oil palm tree cultivation" },
                          { num: 15, text: "description of an organisation which controls the environmental impact of palm oil production" },
                          { num: 16, text: "examples of the widespread global use of palm oil" },
                          { num: 17, text: "reference to a particular species which could benefit the ecosystem of oil palm plantations" },
                          { num: 18, text: "figures illustrating the rapid expansion of the palm oil industry" },
                          { num: 19, text: "an economic justification for not opposing the palm oil industry" },
                          { num: 20, text: "examples of creatures badly affected by the establishment of oil palm plantations" }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8">
                    {renderMultiSelect('21_22', 'Questions 21 and 22', 'Choose TWO letters, A–E. Which TWO statements are made about the Roundtable on Sustainable Palm Oil (RSPO)?', [
                        'Its membership has grown steadily over the course of the last decade.',
                        'It demands that certified producers be open and honest about their practices.',
                        'It took several years to establish its set of criteria for sustainable palm oil certification.',
                        'Its regulations regarding sustainability are stricter than those governing other industries.',
                        'It was formed at the request of environmentalists concerned about the loss of virgin forests.'
                    ], ['B', 'C'])}
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23–26</h3><p>Complete the sentences below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage.</p>
                  <div className="space-y-4">
                      <p><strong>23</strong> One advantage of palm oil for manufacturers is that it stays <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /> even when not refrigerated.</p>
                      <p><strong>24</strong> The <Input className={`inline-block w-48 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /> is the best known of the animals suffering habitat loss as a result of the spread of oil palm plantations.</p>
                      <p><strong>25</strong> As one of its criteria for the certification of sustainable palm oil, the RSPO insists that growers check <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> on a routine basis.</p>
                      <p><strong>26</strong> Ellwood and his researchers are looking into whether the bird's nest fern could restore <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} /> in areas where oil palm trees are grown.</p>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–31</h3><p>Choose the correct letter, A, B, C or D.</p>
                    <div className="space-y-6">
                        <div><p><strong>27</strong> What point does Shester make about Barr's book in the first paragraph?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> It gives a highly original explanation for urban development.</p><p><strong>B</strong> Elements of Barr's research papers are incorporated throughout the book.</p><p><strong>C</strong> Other books that are available on the subject have taken a different approach.</p><p><strong>D</strong> It covers a range of factors that affected the development of New York.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} /></div>
                        <div><p><strong>28</strong> How does Shester respond to the information in the book about tenements?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> She describes the reasons for Barr's interest.</p><p><strong>B</strong> She indicates a potential problem with Barr's analysis.</p><p><strong>C</strong> She compares Barr's conclusion with that of other writers.</p><p><strong>D</strong> She provides details about the sources Barr used for his research.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} /></div>
                        <div><p><strong>29</strong> What does Shester say about chapter six of the book?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> It contains conflicting data.</p><p><strong>B</strong> It focuses too much on possible trends.</p><p><strong>C</strong> It is too specialised for most readers.</p><p><strong>D</strong> It draws on research that is out of date.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} /></div>
                        <div><p><strong>30</strong> What does Shester suggest about the chapters focusing on the 1920s building boom?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> The information should have been organised differently.</p><p><strong>B</strong> More facts are needed about the way construction was financed.</p><p><strong>C</strong> The explanation that is given for the building boom is unlikely.</p><p><strong>D</strong> Some parts will have limited appeal to certain people.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} /></div>
                        <div><p><strong>31</strong> What impresses Shester the most about the chapter on land values?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> the broad time period that is covered</p><p><strong>B</strong> the interesting questions that Barr asks</p><p><strong>C</strong> the nature of the research into the topic</p><p><strong>D</strong> the recommendations Barr makes for the future</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} /></div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32–35</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4">
                        {[
                            { num: 32, text: "The description in the first chapter of how New York probably looked from the air in the early 1600s lacks interest." },
                            { num: 33, text: "Chapters two and three prepare the reader well for material yet to come." },
                            { num: 34, text: "The biggest problem for many nineteenth-century New York immigrant neighbourhoods was a lack of amenities." },
                            { num: 35, text: "In the nineteenth century, New York's immigrant neighbourhoods tended to concentrate around the harbour." }
                        ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36–40</h3><p>Complete the summary using the list of phrases, A–J, below.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <h4 className="font-bold text-center">The bedrock myth</h4>
                        <p>In chapter seven, Barr indicates how the lack of bedrock close to the surface does not explain why skyscrapers are absent from <strong>36</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />. He points out that although the cost of foundations increases when bedrock is deep below the surface, this cannot be regarded as <strong>37</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} />, especially when compared to <strong>38</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} />.</p>
                        <p>A particularly enjoyable part of the chapter was Barr's account of how foundations are built. He describes not only how <strong>39</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /> are made possible by the use of caissons, but he also discusses their <strong>40</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} />. The chapter is well researched but relatively easy to understand.</p>
                        <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                            <p><strong>A</strong> development plans</p> <p><strong>B</strong> deep excavations</p> <p><strong>C</strong> great distance</p>
                            <p><strong>D</strong> excessive expense</p> <p><strong>E</strong> impossible tasks</p> <p><strong>F</strong> associated risks</p>
                            <p><strong>G</strong> water level</p> <p><strong>H</strong> specific areas</p> <p><strong>I</strong> total expenditure</p>
                            <p><strong>J</strong> construction guidelines</p>
                        </div>
                    </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>
        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* Questions 1-20 */}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['21', '22'].includes(q)).slice(0, 20).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}{/* Multi-select questions 21-22 */}<div className={`p-3 rounded border ${multipleAnswers['21_22'].sort().join(',') === 'B,C' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 21-22</span><span className={`font-bold ${multipleAnswers['21_22'].sort().join(',') === 'B,C' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['21_22'].sort().join(',') === 'B,C' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['21_22'].length > 0 ? multipleAnswers['21_22'].sort().join(', ') : '(none)'}</div><div>Correct: B, C</div></div>{/* Questions 23-40 */}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['21', '22'].includes(q)).slice(20).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics book="book-17" module="reading" testNumber={3} />
          <UserTestHistory book="book-17" module="reading" testNumber={3} />
        </div>
      </div>
    </div>
  )
}