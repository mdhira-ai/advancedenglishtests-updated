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

export default function Book16ReadingTest3() {
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
    const correctSet23_24 = ['B', 'C'];
    userChoices23_24.forEach(choice => {
        if (correctSet23_24.includes(choice)) {
            correctCount++;
        }
    });

    const userChoices25_26 = multipleAnswers['25_26'] || [];
    const correctSet25_26 = ['A', 'C'];
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
        testNumber: 3,
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
    '1': 'FALSE', '2': 'NOT GIVEN', '3': 'FALSE', '4': 'TRUE', '5': 'TRUE', '6': 'lightweight', '7': 'bronze', '8': 'levels', '9': 'hull', '10': 'triangular', '11': 'music', '12': 'grain', '13': 'towboats', '14': 'D', '15': 'C', '16': 'F', '17': 'H', '18': 'G', '19': 'B', '20': 'microorganisms/micro-organisms', '21': 'reindeer', '22': 'insects', 
    '23': 'B', '24': 'C', '23&24': ['B', 'C'],
    '25': 'A', '26': 'C', '25&26': ['A', 'C'],
    '27': 'NOT GIVEN', '28': 'TRUE', '29': 'TRUE', '30': 'NOT GIVEN', '31': 'FALSE', '32': 'FALSE', '33': 'H', '34': 'D', '35': 'G', '36': 'C', '37': 'A', '38': 'warm (winter)', '39': 'summer', '40': 'mustard plant(s)/mustard'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-16" module="reading" testNumber={3} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 16 - Reading Test 3</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div></div>
        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Roman shipbuilding and navigation</p>
                     <p>Shipbuilding today is based on science and ships are built using computers and sophisticated tools. Shipbuilding in ancient Rome, however, was more of an art relying on estimation, inherited techniques and personal experience. The Romans were not traditionally sailors but mostly land-based people, who learned to build ships from the people that they conquered, namely the Greeks and the Egyptians.</p>
                     <p>There are a few surviving written documents that give descriptions and representations of ancient Roman ships, including the sails and rigging. Excavated vessels also provide some clues about ancient shipbuilding techniques. Studies of these have taught us that ancient Roman shipbuilders built the outer hull first, then proceeded with the frame and the rest of the ship. Planks used to build the outer hull were sewn together. Starting from the 6th century BCE, they were fixed using a method called mortise and tenon, whereby one plank was locked into another without the need for stitching. Then in the first centuries of the current era, Mediterranean shipbuilders shifted to another shipbuilding method, which consisted of building the frame first and then proceeding with the hull and the other components of the ship. This method was more systematic and dramatically shortened ship construction times. The ancient Romans built large merchant ships and warships whose size and technology were unequalled until the 16th century CE.</p>
                     <p>Warships were built to be lightweight and very speedy. They had to be able to sail near the coast, which is why they had no ballast or excess load and were built with a long, narrow hull. They did not sink when damaged and often would lie crippled on the sea’s surface following naval battles. They had a bronze battering ram, which was used to pierce the timber hulls or break the oars of enemy vessels. Warships used both wind (sails) and human power (oarsmen) and were therefore very fast. Eventually, Rome’s navy became the largest and most powerful in the Mediterranean, and the Romans had control over what they called Mare Nostrum meaning ‘our sea’.</p>
                     <p>There were many kinds of warship. The ‘trireme’ was the dominant warship from the 7th to 4th century BCE. It had rowers in the top, middle and lower levels, and approximately 50 rowers in each bank. The rowers at the bottom had the most uncomfortable position as they were under the other rowers and were also exposed to the water entering through the oar-holes. It is worth noting that contrary to popular perception, rowers were not slaves but Roman citizens enrolled in the military. The trireme was superseded by larger warships with even more rowers.</p>
                     <p>Merchant ships were built to transport lots of cargo over long distances and at a reasonable cost. They had a wide, deep hull, and a solid interior for added stability. Unlike warships, they could not sail too close to the coast. They usually had two huge side rudders located off the stern and controlled by a small tiller bar connected to a system of cables. They had from one to three masts with large square sails and a small triangular sail at the bow. Just like warships, merchant ships used oarsmen, but coordinating the hundreds of rowers in both types of ship was not an easy task. In order to assist them, music would be played on an instrument, and oars would then keep time with this.</p>
                     <p>The cargo on merchant ships included raw materials (e.g. iron bars, copper, marble and granite), and agricultural products (e.g. grain from Egypt’s Nile valley). During the Empire, Rome was a huge city by ancient standards of about one million inhabitants. Goods from all over the world would come to the city through the port of Pozzuoli situated west of the bay of Naples in Italy and through the gigantic port of Ostia situated at the mouth of the Tiber River. Large merchant ships would approach the destination port and, just like today, be intercepted by a number of towboats that would drag them to the quay.</p>
                     <p>The time of travel along the many sailing routes could vary widely. Navigation in ancient Rome did not rely on sophisticated instruments such as compasses but on experience, local knowledge and observation of natural phenomena. In conditions of good visibility, seamen in the Mediterranean often had the mainland or islands in sight, which greatly facilitated navigation. They sailed by noting their position relative to a succession of recognizable landmarks. When weather conditions were not good or when land was no longer visible, Roman mariners estimated directions from the pole star or, with less accuracy, from the Sun at noon. They also estimated directions relative to the wind and swell. Overall, shipping in ancient Roman times resembled shipping today with large vessels regularly crossing the seas and bringing supplies from their Empire.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Climate change reveals ancient artefacts in Norway’s glaciers</p>
                     <p><span className="font-semibold">A</span> Well above the treeline in Norway’s highest mountains, ancient fields of ice are shrinking as Earth’s climate warms. As the ice has vanished, it has been giving up the treasures it has preserved in cold storage for the last 6,000 years – items such as ancient arrows and skis from Viking Age* traders. And those artefacts have provided archaeologists with some surprising insights into how ancient Norwegians made their livings.</p>
                     <p><span className="font-semibold">B</span> Organic materials like textiles and hides are relatively rare finds at archaeological sites. This is because unless they’re protected from the microorganisms that cause decay, they tend not to last long. Extreme cold is one reliable way to keep artefacts relatively fresh for a few thousand years, but once thawed out, these materials experience degradation relatively swiftly. With climate change shrinking ice cover around the world, glacial archaeologists need to race the clock to find newly revealed artefacts, preserve them, and study them. If something fragile dries and is windblown it might very soon be lost to science, or an arrow might be exposed and then covered again by the next snow and remain well-preserved. The unpredictability means that glacial archaeologists have to be systematic in their approach to fieldwork.</p>
                     <p><span className="font-semibold">C</span> Over a nine-year period, a team of archaeologists, which included Lars Pilø of Oppland County Council, Norway, and James Barrett of the McDonald Institute for Archaeological Research, surveyed patches of ice in Oppland, an area of south-central Norway that is home to some of the country’s highest mountains. Reindeer once congregated on these icy patches in the later summer months to escape biting insects, and from the late Stone Age**, hunters followed. In addition, trade routes threaded through the mountain passes of Oppland, linking settlements in Norway to the rest of Europe. The slow but steady movement of glaciers tends to destroy anything at their bases, so the team focused on stationary patches of ice, mostly above 1,400 metres. That ice is found amid fields of frost-weathered boulders, fallen rocks, and exposed bedrock that for nine months of the year is buried beneath snow."Fieldwork is hard work – hiking with all our equipment, often camping on permafrost – but very rewarding. You're rescuing the archaeology, bringing the melting ice to wider attention, discovering a unique environmental history and really connecting with the natural environment," says Barrett.</p>
                     <p><span className="font-semibold">D</span> At the edges of the contracting ice patches, archaeologists found more than 2,000 artefacts which formed a material record that ran from 4,000 BCE to the beginnings of the Renaissance in the 14th century. Many of the artefacts are associated with hunting. Hunters would have easily misplaced arrows and they often discarded broken bows rather than take them all the way home. Other items could have been used by hunters traversing the high mountain passes of Oppland: all-purpose items like tools, skis, and horse tack.</p>
                     <p><span className="font-semibold">E</span> Barrett’s team radiocarbon-dated 153 of the artefacts and compared those dates to the timing of major environmental changes in the region – such as periods of cooling or warming – and major social and economic shifts – such as the growth of farming settlements and the spread of international trade networks leading up to the Viking Age. They found that some periods had produced lots of artefacts, which indicates that people had been pretty active in the mountains during those times. But there were few or no signs of activity during other periods.</p>
                     <p><span className="font-semibold">F</span> What was surprising, according to Barrett, was the timing of these periods. Oppland’s mountains present daunting terrain and in periods of extreme cold, glaciers could block the higher mountain passes and make travel in the upper reaches of the mountains extremely difficult. Archaeologists assumed people would stick to lower elevations during a time like the Late Antique Little Ice Age, a short period of deeper-than-usual cold from about 536-600 CE. But it turned out that hunters kept regularly venturing into the mountains even when the climate turned cold, based on the amount of stuff they had apparently dropped there. "Remarkably, though, the finds from the ice may have continued through this period, perhaps suggesting that the importance of mountain hunting increased to supplement failing agricultural harvests in times of low temperatures," says Barrett. A colder turn in the Scandinavian climate would likely have meant widespread crop failures, so more people would have depended on hunting to make up for those losses.</p>
                     <p><span className="font-semibold">G</span> Many of the artefacts Barrett’s team recovered dated from the beginning of the Viking Age, the 700s through to the 900s CE. Trade networks connecting Scandinavia with Europe and the Middle East were expanding around this time. Although we usually think of ships when we think of Scandinavian expansion, these recent discoveries show that plenty of goods travelled on overland routes, like the mountain passes of Oppland. And growing Norwegian towns, along with export markets, would have created a booming demand for hides to fight off the cold, as well as antlers to make useful things like combs. Business must have been good for hunters.</p>
                     <p><span className="font-semibold">H</span> Norway’s mountains are probably still hiding a lot of history – and prehistory – in remote ice patches. When Barrett’s team looked at the dates for their sample of 153 artefacts, they noticed a gap in the archaeological finds from about 3,800 to 2,200 BCE. In fact, archaeological finds from that period are rare all over Norway. The researchers say that could be because many of those artefacts have already disintegrated or are still frozen in the ice. That means archaeologists could be extracting some of those artefacts from retreating ice in years to come.</p>
                     <p className="text-xs">*Viking Age: a period of European history from around 700 CE to around 1050 CE when Scandinavian Vikings migrated throughout Europe by means of trade and warfare.</p>
                     <p className="text-xs">**The Stone Age: a period in early history that began about 3.4 million years ago.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Plant ‘thermometer’ triggers springtime growth by measuring night-time heat</p>
                     <p>A photoreceptor molecule in plant cells has been found to have a second job as a thermometer after dark – allowing plants to read seasonal temperature changes. Scientists say the discovery could help breed crops that are more resilient to the temperatures expected to result from climate change.</p>
                     <p><span className="font-semibold">A</span> An international team of scientists led by the University of Cambridge has discovered that the ‘thermometer’ molecule in plants enables them to develop according to seasonal temperature changes. Researchers have revealed that molecules called phytochromes – used by plants to detect light during the day – actually change their function in darkness to become cellular temperature gauges that measure the heat of the night. The new findings, published in the journal Science, show that phytochromes control genetic switches in response to temperature as well as light to dictate plant development.</p>
                     <p><span className="font-semibold">B</span> The new findings, published in the journal Science, show that phytochromes control genetic switches in response to temperature as well as light to dictate plant development. At night, these molecules change states, and the pace at which they change is ‘directly proportional to temperature’, say scientists, who compare phytochromes to mercury in a thermometer. The warmer it is, the faster the molecular change – stimulating plant growth.</p>
                     <p><span className="font-semibold">C</span> Farmers and gardeners have known for hundreds of years how responsive plants are to temperature: warm winters cause many trees and flowers to bud early, something humans have long used to predict weather and harvest times for the coming year. The latest research pinpoints for the first time a molecular mechanism in plants that reacts to temperature – often triggering the buds of spring we long to see at the end of winter.</p>
                     <p><span className="font-semibold">D</span> With weather and temperatures set to become ever more unpredictable due to climate change, researchers say the discovery that this light-sensing molecule also functions as an internal thermometer in plants could help us breed tougher crops. ‘It is estimated that agricultural yields will need to double by 2050, but climate change is a major threat to achieving this. Key crops such as wheat and rice are sensitive to high temperatures. Thermal stress reduces crop yields by around 10% for every one degree increase in temperature,’ says lead researcher Dr Philip Wigge from Cambridge’s Sainsbury Laboratory. ‘Discovering the molecules that allow plants to sense temperature has the potential to accelerate the breeding of crops resilient to thermal stress and climate change.’</p>
                     <p><span className="font-semibold">E</span> In their active state, phytochrome molecules bind themselves to DNA to restrict plant growth. During the day, sunlight activates the molecules, slowing down growth. If a plant finds itself in shade, phytochromes are quickly inactivated – enabling it to grow faster to find sunlight again. This is how plants compete to escape each other’s shade. ‘Light-driven changes to phytochrome activity occur very fast, in less than a second,’ says Wigge. At night, however, it’s a different story. Instead of a rapid deactivation following sundown, the molecules gradually change from their active to inactive state. This is called ‘dark reversion’. ‘Just as mercury rises in a thermometer, the rate at which phytochromes revert to their inactive state during the night is a direct measure of temperature,’ says Wigge.</p>
                     <p><span className="font-semibold">F</span> 'The lower the temperature, the slower the rate at which phytochromes revert to inactivity, so the molecules spend more time in their active, growth-suppressing state. This is why plants are slower to grow in winter. Warm temperatures accelerate dark reversion, so that phytochromes rapidly reach an inactive state and detach themselves from the plant's DNA – allowing genes to be expressed and plant growth to resume.' Wigge believes phytochrome thermo-sensing evolved at a later stage, and co-opted the biological network already used for light-based growth during the downtime of night.</p>
                     <p><span className="font-semibold">G</span> Some plants mainly use day length as an indicator of the season. Other species, such as daffodils, have considerable temperature sensitivity, and can flower months in advance during a warm winter. In fact, the discovery of the dual role of phytochromes provides the science behind a well-known rhyme long used to predict the coming season: oak before ash we’ll have a splash, ash before oak we’re in for a soak. Wigge explains: ‘Oak trees rely much more on temperature, likely using phytochromes as thermometers to dictate development, whereas ash trees rely on measuring day length to determine their seasonal timing. A warmer spring, and consequently a higher likelihood of a hot summer, will result in oak leafing before ash. A cold spring will see the opposite. As the British know only too well, a colder summer is likely to be a rain-soaked one.’</p>
                     <p><span className="font-semibold">H</span> The new findings are the culmination of twelve years of research involving scientists from Germany, Argentina and the US, as well as the Cambridge team. The work was done in a model system, using a mustard plant called Arabidopsis, but Wigge says the phytochrome genes necessary for temperature sensing are found in crop plants as well. ‘Recent advances in plant genetics now mean that scientists are able to rapidly identify the genes controlling these processes in crop plants, and even alter their activity using precise molecular “scalpels”,’ adds Wigge. ‘Cambridge is uniquely well-positioned to do this kind of research as we have outstanding collaborators nearby who are working on more applied aspects of plant biology, and can help us transfer this new knowledge into the field.’</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–5</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 1, text: "The Romans’ shipbuilding skills were passed on to the Greeks and the Egyptians." },
                          { num: 2, text: "Skilled craftsmen were needed for the mortise and tenon method of fixing planks." },
                          { num: 3, text: "The later practice used by Mediterranean shipbuilders involved building the hull before the frame." },
                          { num: 4, text: "The Romans called the Mediterranean Sea Mare Nostrum because they dominated its use." },
                          { num: 5, text: "Most rowers on ships were people from the Roman army." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6–13</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">Warships and merchant ships</h4>
                      <p>Warships were designed so that they were <strong>6</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} /> and moved quickly. They often remained afloat after battles and were able to sail close to land as they lacked any additional weight. A battering ram made of <strong>7</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /> was included in the design for attacking and damaging the timber and oars of enemy ships. Warships, such as the ‘trireme’, had rowers on three different <strong>8</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} />.</p>
                      <p>Unlike warships, merchant ships had a broad <strong>9</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} /> that lay far below the surface of the sea. Merchant ships were steered through the water with the help of large rudders and a tiller bar. They had both square and <strong>10</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} /> sails. On merchant ships and warships, <strong>11</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} /> was used to ensure rowers moved their oars in and out of the water at the same time.</p>
                      <p>Quantities of agricultural goods such as <strong>12</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} /> were transported by merchant ships to two main ports in Italy. The ships were pulled to the shore by <strong>13</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} />. When the weather was clear and they could see islands or land, sailors used landmarks that they knew to help them navigate their route.</p>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–19</h3><p>Reading Passage 2 has eight sections, A–H. Which section contains the following information?</p>
                  <div className="space-y-4">
                      {[
                          { num: 14, text: "an explanation for weapons being left behind in the mountains" },
                          { num: 15, text: "a reference to the physical difficulties involved in an archaeological expedition" },
                          { num: 16, text: "an explanation of why less food may have been available" },
                          { num: 17, text: "a reference to the possibility of future archaeological discoveries" },
                          { num: 18, text: "examples of items that would have been traded" },
                          { num: 19, text: "a reference to the pressure archaeologists are under to work quickly" }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20–22</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">Interesting finds at an archaeological site</h4>
                      <p>Organic materials such as animal skins and textiles are not discovered very often at archaeological sites. They have little protection against <strong>20</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} />, which means that they decay relatively quickly. But this is not always the case. If temperatures are low enough, fragile artefacts can be preserved for thousands of years.</p>
                      <p>A team of archaeologists has been working in the mountains in Oppland in Norway to recover artefacts revealed by shrinking ice cover. In the past, there were trade routes through these mountains and <strong>21</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} /> gathered there in the summer months to avoid being attacked by <strong>22</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} /> on lower ground. The people who used these mountains left behind things and it is those objects that are of interest to archaeologists.</p>
                  </div></div>
                  <div className="mb-8">{renderMultiSelect('23_24', 'Questions 23 and 24', 'Which TWO of the following statements does the writer make about the discoveries of Barrett’s team?', ['Artefacts found in the higher mountain passes were limited to skiing equipment.', 'Hunters went into the mountains even during periods of extreme cold.', 'The number of artefacts from certain time periods was relatively low.', 'Radiocarbon dating of artefacts produced some unreliable results.', 'More artefacts were found in Oppland than at any other mountain site.'], ['B', 'C'])}</div>
                  <div className="mb-8">{renderMultiSelect('25_26', 'Questions 25 and 26', 'Which TWO of the following statements does the writer make about the Viking Age?', ['Hunters at this time benefited from an increased demand for goods.', 'The beginning of the period saw the greatest growth in the wealth of Vikings.', 'Vikings did not rely on ships alone to transport goods.', 'Norwegian towns at this time attracted traders from around the world.', 'Vikings were primarily interested in their trading links with the Middle East.'], ['A', 'C'])}</div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–32</h3><p>Do the following statements agree with the information given in Reading Passage 3? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 27, text: "The Cambridge scientists’ discovery of the ‘thermometer molecule’ caused surprise among other scientists." },
                          { num: 28, text: "The target for agricultural production by 2050 could be missed." },
                          { num: 29, text: "Wheat and rice suffer from a rise in temperatures." },
                          { num: 30, text: "It may be possible to develop crops that require less water." },
                          { num: 31, text: "Plants grow faster in sunlight than in shade." },
                          { num: 32, text: "Phytochromes change their state at the same speed day and night." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33–37</h3><p>Reading Passage 3 has eight sections, A–H. Which section contains the following information?</p>
                  <div className="space-y-4">
                      {[
                          { num: 33, text: "mention of specialists who can make use of the research findings" },
                          { num: 34, text: "a reference to a potential benefit of the research findings" },
                          { num: 35, text: "scientific support for a traditional saying" },
                          { num: 36, text: "a reference to people traditionally making plans based on plant behaviour" },
                          { num: 37, text: "a reference to where the research has been reported" }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38–40</h3><p>Complete the sentences below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage.</p>
                  <div className="space-y-4">
                      <p><strong>38</strong> Daffodils are likely to flower early in response to <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> weather.</p>
                      <p><strong>39</strong> If ash trees come into leaf before oak trees, the weather in <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /> will probably be wet.</p>
                      <p><strong>40</strong> The research was carried out using a particular species of <Input className={`inline-block w-40 ml-1 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} />.</p>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>
        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['23', '24', '25', '26'].includes(q)).slice(0, 22).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}{<div className={`p-3 rounded border ${multipleAnswers['23_24'].sort().join(',') === 'B,C' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 23-24</span><span className={`font-bold ${multipleAnswers['23_24'].sort().join(',') === 'B,C' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['23_24'].sort().join(',') === 'B,C' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['23_24'].length > 0 ? multipleAnswers['23_24'].sort().join(', ') : '(none)'}</div><div>Correct: B, C</div></div>}{<div className={`p-3 rounded border ${multipleAnswers['25_26'].sort().join(',') === 'A,C' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 25-26</span><span className={`font-bold ${multipleAnswers['25_26'].sort().join(',') === 'A,C' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['25_26'].sort().join(',') === 'A,C' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['25_26'].length > 0 ? multipleAnswers['25_26'].sort().join(', ') : '(none)'}</div><div>Correct: A, C</div></div>}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['23', '24', '25', '26'].includes(q)).slice(22).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="reading" testNumber={3} /><UserTestHistory book="book-16" module="reading" testNumber={3} /></div>
      </div>
    </div>
  )
}