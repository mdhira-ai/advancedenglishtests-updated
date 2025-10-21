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

export default function Book17ReadingTest1() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '23_24': [], '25_26': [],
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

  const handleMultiSelect = (key: '23_24' | '25_26', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    
    if (['23', '24', '25', '26'].includes(questionNumber)) {
        return false;
    }

    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&') || ['23', '24', '25', '26'].includes(qNum)) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    
    const userChoices23_24 = multipleAnswers['23_24'] || [];
    const correctSet23_24 = ['C', 'D'];
    userChoices23_24.forEach(choice => {
        if (correctSet23_24.includes(choice)) {
            correctCount++;
        }
    });

    const userChoices25_26 = multipleAnswers['25_26'] || [];
    const correctSet25_26 = ['B', 'E'];
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
      await saveTestScore({
        book: 'book-17',
        module: 'reading',
        testNumber: 1,
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
    setAnswers({}); setMultipleAnswers({ '23_24': [], '25_26': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const renderMultiSelect = (key: '23_24' | '25_26', title: string, question: string, options: string[], correctSet: string[]) => (
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
    '1': 'population', '2': 'suburbs', '3': 'businessmen', '4': 'funding', '5': 'press', '6': 'soil', '7': 'FALSE', '8': 'NOT GIVEN', '9': 'TRUE',
    '10': 'TRUE', '11': 'FALSE', '12': 'FALSE', '13': 'NOT GIVEN', '14': 'A', '15': 'F', '16': 'E', '17': 'D', '18': 'fortress', '19': 'bullfights',
    '20': 'opera', '21': 'salt', '22': 'shops', '23': 'C', '24': 'D', '23&24': ['C', 'D'], '25': 'B', '26': 'E', '25&26': ['B', 'E'], '27': 'H',
    '28': 'J', '29': 'F', '30': 'B', '31': 'D', '32': 'NOT GIVEN', '33': 'NO', '34': 'NO', '35': 'YES', '36': 'B', '37': 'C', '38': 'A', '39': 'B', '40': 'D'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-17" module="reading" testNumber={1} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 17 - Reading Test 1</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div></div>
        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The development of the London underground railway</p>
                     <p>In the first half of the 1800s, London's population grew at an astonishing rate, and the central area became increasingly congested. In addition, the expansion of the overground railway network resulted in more and more passengers arriving in the capital. However, in 1846, a Royal Commission decided that the railways should not be allowed to enter the City, the capital’s historic and business centre. The result was that the overground railway stations formed a ring around the City. The area within consisted of poorly built, overcrowded slums and the streets were full of horse-drawn traffic. Crossing the City became a nightmare. It could take an hour and a half to travel 8 km by horse-drawn carriage or bus. Numerous schemes were proposed to resolve these problems, but few succeeded.</p>
                     <p>Amongst the most vocal advocates for a solution to London's traffic problems was Charles Pearson, who worked as a solicitor for the City of London. He saw both social and economic advantages in building an underground railway that would link the overground railway stations together and clear London slums at the same time. His idea was to relocate the poor workers who lived in the inner-city slums to newly constructed suburbs, and to provide cheap rail travel for them to get to work. Pearson's ideas gained support amongst some businessmen and in 1851 he submitted a plan to Parliament. It was rejected, but coincided with a proposal from another group for an underground connecting line, which Parliament passed.</p>
                     <p>The two groups merged and established the Metropolitan Railway Company in August 1854. The company's plan was to construct an underground railway line from the Great Western Railway's (GWR) station at Paddington to the edge of the City at Farringdon Street – a distance of almost 5 km. The organisation had difficulty in raising the funding for such a radical and expensive scheme, not least because of the critical articles printed by the press. Objectors argued that the tunnels would collapse under the weight of traffic overhead, buildings would be shaken and passengers would be poisoned by the emissions from the train engines. However, Pearson and his partners persisted.</p>
                     <p>The GWR, aware that the new line would finally enable them to run trains into the heart of the City, invested almost £250,000 in the scheme. Eventually, over a five-year period, £1m was raised. The chosen route ran beneath existing main roads to minimise the expense of demolishing buildings. Originally scheduled to be completed in 21 months, the construction of the underground line took three years. It was built just below street level using a technique known as 'cut and cover'. A trench about ten metres wide and six metres deep was dug, and the sides temporarily held up with timber beams. Brick walls were then constructed, and finally a brick arch was added to create a tunnel. A two-metre-deep layer of soil was laid on top of the tunnel and the road above rebuilt.</p>
                     <p>The Metropolitan line, which opened on 10 January 1863, was the world's first underground railway. On its first day, almost 40,000 passengers were carried between Paddington and Farringdon, the journey taking about 18 minutes. By the end of the Metropolitan's first year of operation, 9.5 million journeys had been made.</p>
                     <p>Even as the Metropolitan began operation, the first extensions to the line were being authorised; these were built over the next five years, reaching Moorgate in the east of London and Hammersmith in the west. The original plan was to pull the trains with steam locomotives, using firebricks in the boilers to provide steam, but these engines were never introduced. Instead, the line used specially designed locomotives that were fitted with water tanks in which steam could be condensed. However, smoke and fumes remained a problem, even though ventilation shafts were added to the tunnels.</p>
                     <p>Despite the extension of the underground railway, by the 1880s, congestion on London's streets had become worse. The problem was partly that the existing underground lines formed a circuit around the centre of London and extended to the suburbs, but did not cross the capital's centre. The 'cut and cover' method of construction was not an option in this part of the capital. The only alternative was to tunnel deep underground.</p>
                     <p>Although the technology to create these tunnels existed, steam locomotives could not be used in such a confined space. It wasn't until the development of a reliable electric motor, and a means of transferring power from the generator to a moving train, that the world's first deep-level electric railway, the City & South London, became possible. The line opened in 1890, and ran from the City to Stockwell, south of the River Thames. The trains were made up of three carriages and driven by electric engines. The carriages were narrow and had tiny windows just below the roof because it was thought that passengers would not want to look out at the tunnel walls. The line was not without its problems, mainly caused by an unreliable power supply. Although the City & South London Railway was a great technical achievement, it did not make a profit. Then, in 1900, the Central London Railway, known as the 'Tuppenny Tube', began operation using new electric locomotives. It was very popular and soon afterwards new railways and extensions were added to the growing tube network. By 1907, the heart of today's Underground system was in place.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Stadiums: past, present and future</p>
                     <p><span className="font-semibold">A</span> Stadiums are among the oldest forms of urban architecture: vast stadiums where the public could watch sporting events were at the centre of western city life as far back as the ancient Greek and Roman Empires, well before the construction of the great medieval cathedrals and the grand 19th- and 20th-century railway stations which dominated urban skylines in later eras. Today, however, stadiums are regarded with growing scepticism. Construction costs can soar above £1 billion, and stadiums finished for major events such as the Olympic Games or the FIFA World Cup have notably fallen into disuse and disrepair. But this need not be the case. History shows that stadiums can drive urban development and adapt to the culture of every age. Even today, architects and planners are finding new ways to adapt the mono-functional sports arenas which became emblematic of modernisation during the 20th century.</p>
                     <p><span className="font-semibold">B</span> The amphitheatre* of Arles in southwest France, with a capacity of 25,000 spectators, is perhaps the best example of just how versatile stadiums can be. Built by the Romans in 90 AD, it became a fortress with four towers after the fifth century, and was then transformed into a village containing more than 200 houses. With the growing interest in conservation during the 19th century, it was converted back into an arena for the staging of bullfights, thereby returning the structure to its original use as a venue for public spectacles. Another example is the imposing arena of Verona in northern Italy, with space for 30,000 spectators, which was built 60 years before the Arles amphitheatre and 40 years before Rome’s famous Colosseum. It has endured the centuries and is currently considered one of the world’s prime sites for opera, thanks to its outstanding acoustics.</p>
                     <p><span className="font-semibold">C</span> The area in the centre of the Italian town of Lucca, known as the Piazza dell’ Anfiteatro, is yet another impressive example of an amphitheatre becoming absorbed into the fabric of the city. The site evolved in a similar way to Arles and was progressively filled with buildings from the Middle Ages until the 19th century, variously used as houses, a salt depot and a prison. But rather than reverting to an arena, it became a market square, designed by Romanticist architect Lorenzo Nottolini. Today, the ruins of the amphitheatre remain embedded in the various shops and residences surrounding the public square.</p>
                     <p><span className="font-semibold">D</span> There are many similarities between modern stadiums and the ancient amphitheatres intended for games. But some of the flexibility was lost at the beginning of the 20th century, as stadiums were developed using new products such as steel and reinforced concrete, and made use of bright lights for night-time matches. Many such stadiums are situated in suburban areas, designed for sporting use only and surrounded by parking lots. These factors mean that they may not be as accessible to the general public, require more energy to run and contribute to urban heat.</p>
                     <p><span className="font-semibold">E</span> But many of today's most innovative architects see scope for the stadium to help improve the city. Among the current strategies, two seem to be having particular success: the stadium as an urban hub, and as a power plant. There’s a growing trend for stadiums to be equipped with public spaces and services that serve a function beyond sport, such as hotels, retail outlets, conference centres, restaurants and bars, children’s playgrounds and green space. Creating mixed-use developments such as this reinforces compactness and multi-functionality, making more efficient use of land and helping to regenerate urban spaces. This opens the space up to families and a wider cross-section of society, instead of catering only to sportspeople and supporters. There have been many examples of this in the UK: the mixed-use facilities at Wembley and Old Trafford have become a blueprint for many other stadiums in the world.</p>
                     <p><span className="font-semibold">F</span> The phenomenon of stadiums as power stations has arisen from the idea that energy problems can be overcome by integrating interconnected buildings by means of a smart grid, which is an electricity supply network that uses digital communications technology to detect and react to local changes in usage, without significant energy losses. Stadiums are ideal for these purposes, because their canopies have a large surface area for fitting photovoltaic panels and rise high enough (more than 40 metres) to make use of micro wind turbines. Freiburg Mage Solar Stadium in Germany is the first of a new wave of stadiums as power plants, which also includes the Amsterdam Arena and the Kaohsiung Stadium. The latter, inaugurated in 2009, has 8,844 photovoltaic panels producing up to 1.14 GWh of electricity annually. This reduces the annual output of carbon dioxide by 660 tons and supplies up to 80 percent of the surrounding area when the stadium is not in use. This is proof that a stadium can serve its city, and have a decidedly positive impact in terms of reduction of CO2 emissions.</p>
                     <p><span className="font-semibold">G</span> Sporting arenas have always been central to the life and culture of cities. In every era, the stadium has acquired new value and uses: from military fortress to residential village, public space to theatre and most recently a field for experimentation in advanced engineering. The stadium of today now brings together multiple functions, thus helping cities to create a sustainable future.</p>
                     <p className="text-xs italic">*amphitheatre: (especially in Greek and Roman architecture) an open circular or oval building with a central space surrounded by tiers of seats for spectators, for the presentation of dramatic or sporting events</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">To catch a king</p>
                     <p className="italic text-center mb-4">Anna Keay reviews Charles Spencer’s book about the hunt for King Charles II during the English Civil War of the seventeenth century</p>
                     <p>Charles Spencer's latest book, To Catch a King, tells us the story of the hunt for King Charles II in the six weeks after his resounding defeat at the Battle of Worcester in September 1651. And what a story it is. After his father was executed by the Parliamentarians in 1649, the young Charles II sacrificed one of the very principles his father had died for and did a deal with the Scots, thereby accepting Presbyterianism* as the national religion in return for being crowned King of Scots. His arrival in Edinburgh prompted the English Parliamentary army to invade Scotland in a pre-emptive strike. This was followed by a Scottish invasion of England. The two sides finally faced one another at Worcester in the west of England in 1651. After being comprehensively defeated on the meadows outside the city by the Parliamentarian army, the 21-year-old king found himself the subject of a national manhunt, with a huge sum offered for his capture. Over the following six weeks he managed, through a series of heart-poundingly close escapes, to evade the Parliamentarians before seeking refuge in France. For the next nine years, the penniless and defeated Charles wandered around Europe with only a small group of loyal supporters.</p>
                     <p>Years later, after his restoration as king, the 50-year-old Charles II requested a meeting with the writer and diarist Samuel Pepys. His intention when asking Pepys to commit his story to paper was to ensure that this most extraordinary episode was never forgotten. Over two three-hour sittings, the king related to him in great detail his personal recollections of the six weeks he had spent as a fugitive. As the king and secretary settled down (a scene that is surely a gift for a future scriptwriter), Charles commenced his story: 'After the battle was so absolutely lost as to be beyond hope of recovery, I began to think of the best way of saving myself.'</p>
                     <p>One of the joys of Spencer's book, a result not least of its use of Charles II's own narrative as well as those of his supporters, is just how close the reader gets to the action. The day-by-day retelling of the fugitives' doings provides delicious details: the cutting of the king's long hair with agricultural shears, the use of walnut leaves to dye his pale skin, and the day Charles spent lying on a branch of the great oak tree in Boscobel Wood as the Parliamentary soldiers scoured the forest floor below. Spencer draws out both the humour – such as the preposterous refusal of Charles's friend Henry Wilmot to adopt disguise on the grounds that it was beneath his dignity – and the emotional tension when the secret of the king's presence was cautiously revealed to his supporters.</p>
                     <p>Charles's adventures after losing the Battle of Worcester hide the uncomfortable truth that whilst almost everyone in England had been appalled by the execution of his father, they had not welcomed the arrival of his son with the Scots army, but had instead firmly bolted their doors. This was partly because he rode at the head of what looked like a foreign invasion force and partly because, after almost a decade of civil war, people were desperate to avoid it beginning again. This makes it all the more interesting that Charles II himself loved the story so much ever after. As well as retelling it to anyone who would listen, causing eye-rolling among courtiers, he set in train a series of initiatives to memorialise it. There was to be a new order of chivalry, the Knights of the Royal Oak. A series of enormous oil paintings depicting the episode were produced, including a two-metre-wide canvas of Boscobel Wood and a set of six similarly enormous paintings of the king on the run. In 1660, Charles II commissioned the artist John Michael Wright to paint a flying squadron of cherubs* carrying an oak tree to the heavens on the ceiling of his bedchamber. It is hard to imagine many other kings marking the lowest point in their life so enthusiastically, or indeed pulling off such an escape in the first place.</p>
                     <p>Charles Spencer is the perfect person to pass the story on to a new generation. His pacey, readable prose steers deftly clear of modern idioms and elegantly brings to life the details of the great tale. He has even-handed sympathy for both the fugitive king and the fierce republican regime that hunted him, and he succeeds in his desire to explore far more of the background of the story than previous books on the subject have done. Indeed, the opening third of the book is about how Charles II found himself at Worcester in the first place, which for some will be reason alone to read To Catch a King.</p>
                     <p>The tantalising question left, in the end, is that of what it all meant. Would Charles II have been a different king had these six weeks never happened? The days and nights spent in hiding must have affected him in some way. Did the need to assume disguises, to survive on wit and charm alone, to use trickery and subterfuge to escape from tight corners help form him? This is the one area where the book doesn't quite hit the mark. Instead its depiction of Charles II in his final years as an ineffective, pleasure-loving monarch doesn't do justice to the man (neither is it accurate), or to the complexity of his character. But this one niggle aside, To Catch a King is an excellent read, and those who come to it knowing little of the famous tale will find they have a treat in store.</p>
                     <p className="text-xs italic">*Presbyterianism: part of the reformed Protestant religion</p>
                     <p className="text-xs italic">*cherub: an image of angelic children used in paintings</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–6</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-bold text-center">The London underground railway</h4>
                    <p><strong>The problem</strong></p>
                    <ul><li>• The <strong>1</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /> of London increased rapidly between 1800 and 1850</li><li>• The streets were full of horse-drawn vehicles</li></ul>
                    <p><strong>The proposed solution</strong></p>
                    <ul><li>• Charles Pearson, a solicitor, suggested building an underground railway</li><li>• Building the railway would make it possible to move people to better housing in the <strong>2</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} />.</li><li>• A number of <strong>3</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} /> agreed with Pearson's idea</li><li>• The company initially had problems getting the <strong>4</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} /> needed for the project</li><li>• Negative articles about the project appeared in the <strong>5</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} />.</li></ul>
                    <p><strong>The construction</strong></p>
                    <ul><li>• The chosen route did not require many buildings to be pulled down</li><li>• The 'cut and cover' method was used to construct the tunnels</li><li>• With the completion of the brick arch, the tunnel was covered with <strong>6</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} />.</li></ul>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7–13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 7, text: "Other countries had built underground railways before the Metropolitan line opened." },
                          { num: 8, text: "More people than predicted travelled on the Metropolitan line on the first day." },
                          { num: 9, text: "The use of ventilation shafts failed to prevent pollution in the tunnels." },
                          { num: 10, text: "A different approach from the 'cut and cover' technique was required in London's central area." },
                          { num: 11, text: "The windows on City & South London trains were at eye level." },
                          { num: 12, text: "The City & South London Railway was a financial success." },
                          { num: 13, text: "Trains on the 'Tuppenny Tube' nearly always ran on time." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–17</h3><p>Reading Passage 2 has seven sections, A–G. Which section contains the following information?</p>
                  <div className="space-y-4">
                      {[
                          { num: 14, text: "a mention of negative attitudes towards stadium building projects" },
                          { num: 15, text: "figures demonstrating the environmental benefits of a certain stadium" },
                          { num: 16, text: "examples of the wide range of facilities available at some new stadiums" },
                          { num: 17, text: "reference to the disadvantages of the stadiums built during a certain era" }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18–22</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">Roman amphitheatres</h4>
                      <p>The Roman stadiums of Europe have proved very versatile. The amphitheatre of Arles, for example, was converted first into a <strong>18</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />, then into a residential area and finally into an arena where spectators could watch <strong>19</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />. Meanwhile, the arena in Verona, one of the oldest Roman amphitheatres, is famous today as a venue where <strong>20</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /> is performed. The site of Lucca's amphitheatre has also been used for many purposes over the centuries, including the storage of <strong>21</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} />. It is now a market square with <strong>22</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} /> and homes incorporated into the remains of the Roman amphitheatre.</p>
                  </div></div>
                  <div className="mb-8">
                    {renderMultiSelect('23_24', 'Questions 23 and 24', 'Choose TWO letters, A–E. When comparing twentieth-century stadiums to ancient amphitheatres in Section D, which TWO negative features does the writer mention?', [
                        'They are less imaginatively designed.',
                        'They are less spacious.',
                        'They are in less convenient locations.',
                        'They are less versatile.',
                        'They are made of less durable materials.'
                    ], ['C', 'D'])}
                  </div>
                  <div className="mb-8">
                    {renderMultiSelect('25_26', 'Questions 25 and 26', 'Choose TWO letters, A–E. Which TWO advantages of modern stadium design does the writer mention?', [
                        'offering improved amenities for the enjoyment of sports events',
                        'bringing community life back into the city environment',
                        'facilitating research into solar and wind energy solutions',
                        'enabling local residents to reduce their consumption of electricity',
                        'providing a suitable site for the installation of renewable power generators'
                    ], ['B', 'E'])}
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–31</h3><p>Complete the summary using the list of phrases, A–J, below.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <h4 className="font-bold text-center">The story behind the hunt for Charles II</h4>
                        <p>Charles II's father was executed by the Parliamentarian forces in 1649. Charles II then formed a <strong>27</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} /> with the Scots, and in order to become King of Scots, he abandoned an important <strong>28</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} /> that was held by his father and had contributed to his father's death. The opposing sides then met outside Worcester in 1651. The battle led to a <strong>29</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} /> for the Parliamentarians and Charles had to flee for his life. A <strong>30</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} /> was offered for Charles's capture, but after six weeks spent in hiding, he eventually managed to reach the <strong>31</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} /> of continental Europe.</p>
                        <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                            <p><strong>A</strong> military innovation</p> <p><strong>B</strong> large reward</p> <p><strong>C</strong> widespread conspiracy</p>
                            <p><strong>D</strong> relative safety</p> <p><strong>E</strong> new government</p> <p><strong>F</strong> decisive victory</p>
                            <p><strong>G</strong> political debate</p> <p><strong>H</strong> strategic alliance</p> <p><strong>I</strong> popular solution</p>
                            <p><strong>J</strong> religious conviction</p>
                        </div>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32–35</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4">
                        {[
                            { num: 32, text: "Charles chose Pepys for the task because he considered him to be trustworthy." },
                            { num: 33, text: "Charles's personal recollection of the escape lacked sufficient detail." },
                            { num: 34, text: "Charles indicated to Pepys that he had planned his escape before the battle." },
                            { num: 35, text: "The inclusion of Charles's account is a positive aspect of the book." }
                        ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36–40</h3><p>Choose the correct letter, A, B, C or D.</p>
                    <div className="space-y-6">
                        <div><p><strong>36</strong> What is the reviewer's main purpose in the first paragraph?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> to describe what happened during the Battle of Worcester</p><p><strong>B</strong> to give an account of the circumstances leading to Charles II's escape</p><p><strong>C</strong> to provide details of the Parliamentarians' political views</p><p><strong>D</strong> to compare Charles II's beliefs with those of his father</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} /></div>
                        <div><p><strong>37</strong> Why does the reviewer include examples of the fugitives' behaviour in the third paragraph?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> to explain how close Charles II came to losing his life</p><p><strong>B</strong> to suggest that Charles II's supporters were badly prepared</p><p><strong>C</strong> to illustrate how the events of the six weeks are brought to life</p><p><strong>D</strong> to argue that certain aspects are not as well known as they should be</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /></div>
                        <div><p><strong>38</strong> What point does the reviewer make about Charles II in the fourth paragraph?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> He chose to celebrate what was essentially a defeat.</p><p><strong>B</strong> He misunderstood the motives of his opponents.</p><p><strong>C</strong> He aimed to restore people's faith in the monarchy.</p><p><strong>D</strong> He was driven by a desire to be popular.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /></div>
                        <div><p><strong>39</strong> What does the reviewer say about Charles Spencer in the fifth paragraph?</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> His decision to write the book comes as a surprise.</p><p><strong>B</strong> He takes an unbiased approach to the subject matter.</p><p><strong>C</strong> His descriptions of events would be better if they included more detail.</p><p><strong>D</strong> He chooses language that is suitable for a twenty-first-century audience.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /></div>
                        <div><p><strong>40</strong> When the reviewer says the book 'doesn't quite hit the mark', she is making the point that</p>
                        <div className="ml-6 mt-2 space-y-1 text-sm"><p><strong>A</strong> it overlooks the impact of events on ordinary people.</p><p><strong>B</strong> it lacks an analysis of prevalent views on monarchy.</p><p><strong>C</strong> it omits any references to the deceit practised by Charles II during his time in hiding.</p><p><strong>D</strong> it fails to address whether Charles II's experiences had a lasting influence on him.</p></div><Input className={`mt-2 ml-6 max-w-[100px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /></div>
                    </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>
        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* Questions 1-22 */}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['23', '24', '25', '26'].includes(q)).slice(0, 22).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}{/* Multi-select questions 23-24 */}<div className={`p-3 rounded border ${multipleAnswers['23_24'].sort().join(',') === 'C,D' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 23-24</span><span className={`font-bold ${multipleAnswers['23_24'].sort().join(',') === 'C,D' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['23_24'].sort().join(',') === 'C,D' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['23_24'].length > 0 ? multipleAnswers['23_24'].sort().join(', ') : '(none)'}</div><div>Correct: C, D</div></div>{/* Multi-select questions 25-26 */}<div className={`p-3 rounded border ${multipleAnswers['25_26'].sort().join(',') === 'B,E' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 25-26</span><span className={`font-bold ${multipleAnswers['25_26'].sort().join(',') === 'B,E' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['25_26'].sort().join(',') === 'B,E' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['25_26'].length > 0 ? multipleAnswers['25_26'].sort().join(', ') : '(none)'}</div><div>Correct: B, E</div></div>{/* Questions 27-40 */}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['23', '24', '25', '26'].includes(q)).slice(22).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics book="book-17" module="reading" testNumber={1} />
          <UserTestHistory book="book-17" module="reading" testNumber={1} />
        </div>
      </div>
    </div>
  )
}