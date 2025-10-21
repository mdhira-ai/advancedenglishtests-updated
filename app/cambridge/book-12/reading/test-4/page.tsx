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

export default function Book12ReadingTest8() {
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
    '1': 'obsidian', '2': 'spears', '3': 'beads', '4': 'impurities', '5': 'Romans', '6': 'lead', '7': 'clouding', '8': 'taxes',
    '9': 'TRUE', '10': 'FALSE', '11': 'NOT GIVEN', '12': 'TRUE', '13': 'FALSE',
    '14': 'D', '15': 'A', '16': 'C', '17': 'A', '18': 'C',
    '19': 'E', '20': 'D', '21': 'F', '22': 'A',
    '23': 'NO', '24': 'NOT GIVEN', '25': 'YES', '26': 'YES',
    '27': 'iv', '28': 'ii', '29': 'vi', '30': 'viii', '31': 'vii', '32': 'i', '33': 'iii',
    '34': 'YES', '35': 'NOT GIVEN', '36': 'NO', '37': 'NO',
    '38': 'information', '39': 'financial', '40': 'shareholders/investors'
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
        testNumber: 8,
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 12 - Reading Test 8</h1>
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
                      <h3 className="font-bold text-lg text-center">The History of Glass</h3>
                      <p>From our earliest origins, man has been making use of glass. Historians have discovered that a type of natural glass – obsidian – formed in places such as the mouth of a volcano as a result of the intense heat of an eruption melting sand – was first used as tips for spears. Archaeologists have even found evidence of man-made glass which dates back to 4000 BC; this took the form of glazes used for coating stone beads. It was not until 1500 BC, however, that the first hollow glass container was made by covering a sand core with a layer of molten glass.</p>
                      <p>Glass blowing became the most common way to make glass containers from the first century BC. The glass made during this time was highly coloured due to the impurities of the raw material. In the first century AD, methods of creating colourless glass were developed, which was then tinted by the addition of colouring materials. The secret of glass making was taken across Europe by the Romans during this century. However, they guarded the skills and technology required to make glass very closely, and it was not until their empire collapsed in 476 AD that glass-making knowledge became widespread throughout Europe and the Middle East. From the 10th century onwards, the Venetians gained a reputation for technical skill and artistic ability in the making of glass bottles, and many of the city’s craftsmen left Italy to set up glassworks throughout Europe.</p>
                      <p>A major milestone in the history of glass occurred with the invention of lead crystal glass by the English glass manufacturer George Ravenscroft (1632-1683). He attempted to counter the effect of clouding that sometimes occurred in blown glass by introducing lead to the raw materials used in the process. The new glass he created was softer and easier to decorate, and had a higher refractive index, adding to its brilliance and beauty, and it proved invaluable to the optical industry. It is thanks to Ravenscroft’s invention that optical lenses, astronomical telescopes, microscopes and the like became possible.</p>
                      <p>In Britain, the modern glass industry only really started to develop after the repeal of the Excise Act in 1845. Before that time, heavy taxes had been placed on the amount of glass melted in a glasshouse, and were levied continuously from 1745 to 1845. Joseph Paxton’s Crystal Palace at London’s Great Exhibition of 1851 marked the beginning of glass as a material used in the building industry. This revolutionary new building encouraged the use of glass in public, domestic and horticultural architecture. Glass manufacturing techniques also improved with the advancement of science and the development of better technology.</p>
                      <p>From 1887 onwards, glass making developed from traditional mouth-blowing to a semi-automatic process, after factory-owner HM Ashley introduced a machine capable of producing 200 bottles per hour in Castleford, Yorkshire, England – more than three times quicker than any previous production method. Then in 1907, the first fully automated machine was developed in the USA by Michael Owens – founder of the Owens Bottle Machine Company (later the major manufacturers Owens-Illinois) – and installed in its factory. Owens’ invention could produce an impressive 2,500 bottles per hour. Other developments followed rapidly, but it was not until the First World War, when Britain became cut off from essential glass suppliers, that glass became part of the scientific sector. Previous to this, glass had been seen as a craft rather than a precise science.</p>
                      <p>Today, glass making is big business. It has become a modern, hi-tech industry operating in a fiercely competitive global market where quality, design and service levels are critical to maintaining market share. Modern glass plants are capable of making millions of glass containers a day in many different colours, with green, brown and clear remaining the most popular. Few of us can imagine modern life without glass. It features in almost every aspect of our lives – in our homes, our cars and whenever we sit down to eat or drink. Glass packaging is used for many products, many beverages are sold in glass, as are numerous foodstuffs, as well as medicines and cosmetics.</p>
                      <p>Glass is an ideal material for recycling, and with growing consumer concern for green issues, glass bottles and jars are becoming ever more popular. Glass recycling is good news for the environment. It saves used glass containers being sent to landfill. As less energy is needed to melt recycled glass than to melt down raw materials, this also saves fuel and production costs. Recycling also reduces the need for raw materials to be quarried, thus saving precious resources.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <h3 className="font-bold text-lg text-center">Bring back the big cats</h3>
                      <p>There is a poem, written around 598 AD, which describes hunting a mystery animal called a llewyn. But what was it? Nothing seemed to fit, until 2006, when an animal bone, dating from around the same period, was found in the Kinsey Cave in northern England. Until this discovery, the lynx – a large spotted cat with tasselled ears – was presumed to have died out in Britain at least 6,000 years ago, before the inhabitants of these islands took up farming. But the 2006 find, together with three others in Yorkshire and Scotland, is compelling evidence that the lynx and the mysterious llewyn were in fact one and the same animal. If this is so, it would bring forward the tassel-eared cat’s estimated extinction date by roughly 5,000 years.</p>
                      <p>However, this is not quite the last glimpse of the animal in British culture. A 9th-century stone cross from the Isle of Eigg shows, alongside the deer, boar and aurochs pursued by a mounted hunter, a speckled cat with tasselled ears. Were it not for the animal’s backside having worn away with time, we could have been certain, as the lynx’s stubby tail is unmistakable. But even without this key feature, it’s hard to see what else the creature could have been. The lynx is now becoming the totemic animal of a movement that is transforming British environmentalism: rewilding.</p>
                      <p>Rewilding means the mass restoration of damaged ecosystems. It involves letting trees return to places that have been denuded, allowing parts of the seabed to recover from trawling and dredging, permitting rivers to flow freely again. Above all, it means bringing back missing species. One of the most striking findings of modern ecology is that ecosystems without large predators behave in completely different ways from those that retain them. Some of them drive dynamic processes that resonate through the whole food chain, creating niches for hundreds of species that might otherwise struggle to survive. The killers turn out to be bringers of life.</p>
                      <p>Such findings present a big challenge to British conservation, which has often selected arbitrary assemblages of plants and animals and sought, at great effort and expense, to prevent them from changing. It has tried to preserve the living world as if it were a jar of pickles, letting nothing in and nothing out, keeping nature in a state of arrested development. But ecosystems are not merely collections of species; they are also the dynamic and ever-shifting relationships between them. And this dynamism often depends on large predators.</p>
                      <p>At sea the potential is even greater: by protecting large areas from commercial fishing, we could once more see what 18th-century literature describes: vast shoals of fish being chased by fin and sperm whales, within sight of the English shore. This policy would also greatly boost catches in the surrounding seas; the fishing industry’s insistence on scouring every inch of seabed, leaving no breeding reserves, could not be more damaging to its own interests.</p>
                      <p>Rewilding is a rare example of an environmental movement in which campaigners articulate what they are for rather than only what they are against. One of the reasons why the enthusiasm for rewilding is spreading so quickly in Britain is that it helps to create a more inspiring vision than the green movement’s usual promise of ‘Follow us and the world will be slightly less awful than it would otherwise have been.’</p>
                      <p>The lynx presents no threat to human beings: there is no known instance of one preying on people. It is a specialist predator of roe deer, a species that has exploded in Britain in recent decades, holding back, by intensive browsing, attempts to re-establish forests. It will also winkle out sika deer: an exotic species that is almost impossible for human beings to control, as it hides in impenetrable plantations of young trees. The attempt to reintroduce this predator marries well with the aim of bringing forests back to parts of our bare and barren uplands. The lynx requires deep cover, and as such presents little risk to sheep and other livestock, which are supposed, as a condition of farm subsidies, to be kept out of the woods.</p>
                      <p>On a recent trip to the Cairngorm Mountains, I heard several conservationists suggest that the lynx could be reintroduced there within 20 years. If trees return to the bare hills elsewhere in Britain, the big cats could soon follow. There is nothing extraordinary about these proposals, seen from the perspective of anywhere else in Europe. The lynx has now been reintroduced to the Jura Mountains, the Alps, the Vosges in eastern France and the Harz mountains in Germany, and has re-established itself in many more places. The European population has tripled since 1970 to roughly 10,000. As with wolves, bears, beavers, boar, bison, moose and many other species, the lynx has been able to spread as farming has left the hills and people discover that it is more lucrative to protect charismatic wildlife than to hunt it, as tourists will pay for the chance to see it. Large-scale rewilding is happening almost everywhere – except Britain.</p>
                      <p>Here, attitudes are just beginning to change. Conservationists are starting to accept that the old preservation-jar model is failing, even on its own terms. Already, projects such as Trees for Life in the Highlands provide a hint of what might be coming. An organisation is being set up that will seek to catalyse the rewilding of land and sea across Britain, its aim being to reintroduce that rarest of species to British ecosystems: hope.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <h3 className="font-bold text-lg text-center">UK companies need more effective boards of directors</h3>
                        <p><b>A</b> After a number of serious failures of governance (that is, how they are managed at the highest level), companies in Britain, as well as elsewhere, should consider radical changes to their directors’ roles. It is clear that the role of a board director today is not an easy one. Following the 2008 financial meltdown, which resulted in a deeper and more prolonged period of economic downturn than anyone expected, the search for explanations in the many post-mortems of the crisis has meant blame has been spread far and wide. Governments, regulators, central banks and auditors have all been in the frame. The role of bank directors and management and their widely publicised failures have been extensively picked over and examined in reports, inquiries and commentaries.</p>
                        <p><b>B</b> The knock-on effect of this scrutiny has been to make the governance of companies in general an issue of intense public debate and has significantly increased the pressures on, and the responsibilities of, directors. At the simplest and most practical level, the time involved in fulfilling the demands of a board directorship has increased significantly, calling into question the effectiveness of the classic model of corporate governance by part-time, independent non-executive directors. Where once a board schedule may have consisted of between eight and ten meetings a year, in many companies the number of events requiring board input and decisions has dramatically risen. Furthermore, the amount of reading and preparation required for each meeting is increasing. Agendas can become overloaded and this can mean the time for constructive debate must necessarily be restricted in favour of getting through the business.</p>
                        <p><b>C</b> Often, board business is devolved to committees in order to cope with the workload, which may be more efficient but can mean that the board as a whole is less involved in fully addressing some of the most important issues. It is not uncommon for the audit committee meeting to last longer than the main board meeting itself. Process may take the place of discussion and be at the expense of real collaboration, so that boxes are ticked rather than issues tackled.</p>
                        <p><b>D</b> A radical solution, which may work for some very large companies whose businesses are extensive and complex, is the professional board, whose members would work up to three or four days a week, supported by their own dedicated staff and advisers. There are obvious risks to this and it would be important to establish clear guidelines for such a board to ensure that it did not step on the toes of management by becoming too engaged in the day-to-day running of the company. Problems of recruitment, remuneration and independence could also arise and this structure would not be appropriate for all companies. However, more professional and better-informed boards would have been particularly appropriate for banks where the executives had access to information that part-time non-executive directors lacked, leaving the latter unable to comprehend or anticipate the 2008 crash.</p>
                        <p><b>E</b> One of the main criticisms of boards and their directors is that they do not focus sufficiently on longer-term matters of strategy, sustainability and governance, but instead concentrate too much on short-term financial metrics. Regulatory requirements and the structure of the market encourage this behaviour. The tyranny of quarterly reporting can distort board decision-making, as directors have to ‘make the numbers’ every four months to meet the insatiable appetite of the market for more data. This serves to encourage the trading methodology of a certain kind of investor who moves in and out of a stock without engaging in constructive dialogue with the company about strategy or performance, and is simply seeking a short-term financial gain. This effect has been made worse by the changing profile of investors due to the globalisation of capital and the increasing use of automated trading systems. Corporate culture adapts and management teams are largely incentivised to meet financial goals.</p>
                        <p><b>F</b> Compensation for chief executives has become a combat zone where pitched battles between investors, management and board members are fought, often behind closed doors but increasingly frequently in the full glare of press attention. Many would argue that this is in the interest of transparency and good governance as shareholders use their muscle in the area of pay to pressure boards to remove underperforming chief executives. Their powers to vote down executive remuneration policies increased when binding votes came into force. The chair of the remuneration committee can be an exposed and lonely role, as Alison Carnwath, chair of Barclays Bank’s remuneration committee, found when she had to resign, having been roundly criticised for trying to defend the enormous bonus to be paid to the chief executive; the irony being that she was widely understood to have spoken out against it in the privacy of the committee.</p>
                        <p><b>G</b> The financial crisis stimulated a debate about the role and purpose of the company and a heightened awareness of corporate ethics. Trust in the corporation has been eroded and academics such as Michael Sandel, in his thoughtful and bestselling book What Money Can’t Buy, are questioning the morality of capitalism and the market economy. Boards of companies in all sectors will need to widen their perspective to encompass these issues and this may involve a realignment of corporate goals. We live in challenging times.</p>
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
                      <h3 className="font-semibold text-lg mb-4">Questions 1-8</h3>
                      <p className="mb-4">Complete the notes below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                      <div className="border p-4 rounded-md bg-slate-50 space-y-2">
                        <h4 className="font-bold text-center mb-4">The History of Glass</h4>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Early humans used a material called <b>1</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || submitted} /> to make the sharp points of their <b>2</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || submitted} />.</li>
                          <li>4000 BC: <b>3</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || submitted} /> made of stone were covered in a coating of man-made glass.</li>
                          <li>First century BC: glass was coloured because of the <b>4</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || submitted} /> in the material.</li>
                          <li>Until 476 AD: Only the <b>5</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || submitted} /> knew how to make glass.</li>
                          <li>From 10th century: Venetians became famous for making bottles out of glass.</li>
                          <li>17th century: George Ravenscroft developed a process using <b>6</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || submitted} /> to avoid the occurrence of <b>7</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || submitted} /> in blown glass.</li>
                          <li>Mid-19th century: British glass production developed after changes to laws concerning <b>8</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || submitted} />.</li>
                        </ul>
                         {submitted && ['1','2','3','4','5','6','7','8'].some(q => getAnswerStatus(q) === 'incorrect') && (
                            <div className="text-sm text-green-600 mt-2">
                                Correct answers: 
                                {getAnswerStatus('1') === 'incorrect' && ` 1. ${correctAnswers['1']}`}
                                {getAnswerStatus('2') === 'incorrect' && ` 2. ${correctAnswers['2']}`}
                                {getAnswerStatus('3') === 'incorrect' && ` 3. ${correctAnswers['3']}`}
                                {getAnswerStatus('4') === 'incorrect' && ` 4. ${correctAnswers['4']}`}
                                {getAnswerStatus('5') === 'incorrect' && ` 5. ${correctAnswers['5']}`}
                                {getAnswerStatus('6') === 'incorrect' && ` 6. ${correctAnswers['6']}`}
                                {getAnswerStatus('7') === 'incorrect' && ` 7. ${correctAnswers['7']}`}
                                {getAnswerStatus('8') === 'incorrect' && ` 8. ${correctAnswers['8']}`}
                            </div>
                           )}
                      </div>
                    </div>
                    <hr />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 9-13</h3>
                      <p className="mb-4">Do the following statements agree with the information given in Reading Passage 1?</p>
                      <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                        <p className="font-semibold">In boxes 9-13 on your answer sheet, write</p>
                        <p className="mt-2">
                          <span className="font-semibold">TRUE</span> if the statement agrees with the information<br/>
                          <span className="font-semibold">FALSE</span> if the statement contradicts the information<br/>
                          <span className="font-semibold">NOT GIVEN</span> if there is no information on this
                        </p>
                      </div>
                      <div className="space-y-4">
                        {['9', '10', '11', '12', '13'].map(qNum => {
                          const questions: Record<string, string> = {
                            '9': 'In 1887, HM Ashley had the fastest bottle-producing machine that existed at the time.',
                            '10': 'Michael Owens was hired by a large US company to design a fully-automated bottle manufacturing machine for them.',
                            '11': 'Nowadays, most glass is produced by large international manufacturers.',
                            '12': 'Concern for the environment is leading to an increased demand for glass containers.',
                            '13': 'It is more expensive to produce recycled glass than to manufacture new glass.'
                          };
                          return (
                            <div key={qNum}>
                              <p><b>{qNum}</b> {questions[qNum]}</p>
                              <Input 
                                placeholder="TRUE/FALSE/NOT GIVEN" 
                                value={answers[qNum] || ''} 
                                onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                disabled={!isTestStarted || submitted}
                                className={`mt-1 ${submitted ? (getAnswerStatus(qNum) === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                              />
                               {submitted && getAnswerStatus(qNum) === 'incorrect' && (
                                <p className="text-sm text-green-600 mt-1">Correct answer: {correctAnswers[qNum as keyof typeof correctAnswers]}</p>
                              )}
                            </div>
                          )
                        })}
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
                    <h3 className="font-semibold text-lg mb-4">Questions 14-18</h3>
                    <p className="mb-4">Choose the correct letter, <b>A, B, C</b> or <b>D</b>.</p>
                    <p className="mb-4 text-sm text-gray-600">Write the correct letter, A, B, C or D, in boxes 14-18 on your answer sheet.</p>
                    
                    <div className="space-y-6">
                      {/* Question 14 */}
                      <div className="space-y-3">
                        <p className="font-semibold"><b>14</b> What did the 2006 discovery of the animal bone reveal about the lynx?</p>
                        <div className="ml-4 space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const options = {
                              'A': 'Its physical appearance was very distinctive.',
                              'B': 'Its extinction was linked to the spread of farming.',
                              'C': 'It vanished from Britain several thousand years ago.',
                              'D': 'It survived in Britain longer than was previously thought.'
                            };
                            return (
                              <label key={option} className="flex items-start space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="question14"
                                  value={option}
                                  checked={answers['14'] === option}
                                  onChange={(e) => handleAnswerChange('14', e.target.value)}
                                  className="mt-1"
                                  disabled={!isTestStarted || submitted}
                                />
                                <span className={`${submitted ? (getAnswerStatus('14') === 'correct' && answers['14'] === option ? 'text-green-600 font-semibold' : getAnswerStatus('14') === 'incorrect' && answers['14'] === option ? 'text-red-600' : '') : ''}`}>
                                  <b>{option}</b> {options[option as keyof typeof options]}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question 15 */}
                      <div className="space-y-3">
                        <p className="font-semibold"><b>15</b> What point does the writer make about large predators in the third paragraph?</p>
                        <div className="ml-4 space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const options = {
                              'A': 'Their presence can increase biodiversity.',
                              'B': 'They may cause damage to local ecosystems.',
                              'C': 'Their behaviour can alter according to the environment.',
                              'D': 'They should be reintroduced only to areas where they were native.'
                            };
                            return (
                              <label key={option} className="flex items-start space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="question15"
                                  value={option}
                                  checked={answers['15'] === option}
                                  onChange={(e) => handleAnswerChange('15', e.target.value)}
                                  className="mt-1"
                                  disabled={!isTestStarted || submitted}
                                />
                                <span className={`${submitted ? (getAnswerStatus('15') === 'correct' && answers['15'] === option ? 'text-green-600 font-semibold' : getAnswerStatus('15') === 'incorrect' && answers['15'] === option ? 'text-red-600' : '') : ''}`}>
                                  <b>{option}</b> {options[option as keyof typeof options]}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question 16 */}
                      <div className="space-y-3">
                        <p className="font-semibold"><b>16</b> What does the writer suggest about British conservation in the fourth paragraph?</p>
                        <div className="ml-4 space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const options = {
                              'A': 'It has failed to achieve its aims.',
                              'B': 'It is beginning to change direction.',
                              'C': 'It has taken a misguided approach.',
                              'D': 'It has focused on the most widespread species.'
                            };
                            return (
                              <label key={option} className="flex items-start space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="question16"
                                  value={option}
                                  checked={answers['16'] === option}
                                  onChange={(e) => handleAnswerChange('16', e.target.value)}
                                  className="mt-1"
                                  disabled={!isTestStarted || submitted}
                                />
                                <span className={`${submitted ? (getAnswerStatus('16') === 'correct' && answers['16'] === option ? 'text-green-600 font-semibold' : getAnswerStatus('16') === 'incorrect' && answers['16'] === option ? 'text-red-600' : '') : ''}`}>
                                  <b>{option}</b> {options[option as keyof typeof options]}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question 17 */}
                      <div className="space-y-3">
                        <p className="font-semibold"><b>17</b> Protecting large areas of the sea from commercial fishing would result in</p>
                        <div className="ml-4 space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const options = {
                              'A': 'practical benefits for the fishing industry.',
                              'B': 'some short-term losses to the fishing industry.',
                              'C': 'widespread opposition from the fishing industry.',
                              'D': 'certain changes to techniques within the fishing industry.'
                            };
                            return (
                              <label key={option} className="flex items-start space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="question17"
                                  value={option}
                                  checked={answers['17'] === option}
                                  onChange={(e) => handleAnswerChange('17', e.target.value)}
                                  className="mt-1"
                                  disabled={!isTestStarted || submitted}
                                />
                                <span className={`${submitted ? (getAnswerStatus('17') === 'correct' && answers['17'] === option ? 'text-green-600 font-semibold' : getAnswerStatus('17') === 'incorrect' && answers['17'] === option ? 'text-red-600' : '') : ''}`}>
                                  <b>{option}</b> {options[option as keyof typeof options]}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question 18 */}
                      <div className="space-y-3">
                        <p className="font-semibold"><b>18</b> According to the author, what distinguishes rewilding from other environmental campaigns?</p>
                        <div className="ml-4 space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const options = {
                              'A': 'Its objective is more achievable.',
                              'B': 'Its supporters are more articulate.',
                              'C': 'Its positive message is more appealing.',
                              'D': 'It is based on sounder scientific principles.'
                            };
                            return (
                              <label key={option} className="flex items-start space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="question18"
                                  value={option}
                                  checked={answers['18'] === option}
                                  onChange={(e) => handleAnswerChange('18', e.target.value)}
                                  className="mt-1"
                                  disabled={!isTestStarted || submitted}
                                />
                                <span className={`${submitted ? (getAnswerStatus('18') === 'correct' && answers['18'] === option ? 'text-green-600 font-semibold' : getAnswerStatus('18') === 'incorrect' && answers['18'] === option ? 'text-red-600' : '') : ''}`}>
                                  <b>{option}</b> {options[option as keyof typeof options]}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 19-22</h3>
                    <p className="mb-4">Complete the summary using the list of words and phrases <b>A-F</b> below.</p>
                     <div className="border p-4 rounded-md mb-4 bg-slate-50">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <span><b>A</b> trees</span>
                            <span><b>B</b> endangered species</span>
                            <span><b>C</b> hillsides</span>
                            <span><b>D</b> wild animals</span>
                            <span><b>E</b> humans</span>
                            <span><b>F</b> farm animals</span>
                        </div>
                    </div>
                    <div className="border p-4 rounded-md bg-slate-50 space-y-2">
                        <h4 className="font-bold text-center mb-2">Reintroducing the lynx to Britain</h4>
                        <p>There would be many advantages to reintroducing the lynx to Britain. While there is no evidence that the lynx has ever put <b>19</b> <Input className={`inline-block w-16 ${submitted ? (getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || submitted} /> in danger, it would reduce the numbers of certain <b>20</b> <Input className={`inline-block w-16 ${submitted ? (getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || submitted} /> whose populations have increased enormously in recent decades. It would present only a minimal threat to <b>21</b> <Input className={`inline-block w-16 ${submitted ? (getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || submitted} />, provided these were kept away from lynx habitats. Furthermore, the reintroduction programme would also link efficiently with initiatives to return native <b>22</b> <Input className={`inline-block w-16 ${submitted ? (getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || submitted} /> to certain areas of the country.</p>
                        {submitted && ['19','20','21','22'].some(q => getAnswerStatus(q) === 'incorrect') && (
                        <div className="text-sm text-green-600 mt-2">
                            Correct answers: 
                            {getAnswerStatus('19') === 'incorrect' && ` 19. ${correctAnswers['19']}`}
                            {getAnswerStatus('20') === 'incorrect' && ` 20. ${correctAnswers['20']}`}
                            {getAnswerStatus('21') === 'incorrect' && ` 21. ${correctAnswers['21']}`}
                            {getAnswerStatus('22') === 'incorrect' && ` 22. ${correctAnswers['22']}`}
                        </div>
                        )}
                    </div>
                  </div>
                  <hr/>
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 23-26</h3>
                    <p className="mb-4">Do the following statements agree with the claims of the writer in Reading Passage 2?</p>
                    <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                      <p className="font-semibold">In boxes 23-26 on your answer sheet, write</p>
                      <p className="mt-2">
                        <span className="font-semibold">YES</span> if the statement agrees with the claims of the writer<br/>
                        <span className="font-semibold">NO</span> if the statement contradicts the claims of the writer<br/>
                        <span className="font-semibold">NOT GIVEN</span> if it is impossible to say what the writer thinks about this
                      </p>
                    </div>
                    <div className="space-y-4">
                      {['23', '24', '25', '26'].map(qNum => {
                          const questions: Record<string, string> = {
                            '23': 'Britain could become the first European country to reintroduce the lynx.',
                            '24': 'The large growth in the European lynx population since 1970 has exceeded conservationists’ expectations.',
                            '25': 'Changes in agricultural practices have extended the habitat of the lynx in Europe.',
                            '26': 'It has become apparent that species reintroduction has commercial advantages.'
                          };
                          return (
                            <div key={qNum}>
                              <p><b>{qNum}</b> {questions[qNum]}</p>
                              <Input 
                                placeholder="YES/NO/NOT GIVEN" 
                                value={answers[qNum] || ''} 
                                onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                disabled={!isTestStarted || submitted}
                                className={`mt-1 ${submitted ? (getAnswerStatus(qNum) === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                              />
                               {submitted && getAnswerStatus(qNum) === 'incorrect' && (
                                <p className="text-sm text-green-600 mt-1">Correct answer: {correctAnswers[qNum as keyof typeof correctAnswers]}</p>
                              )}
                            </div>
                          )
                        })}
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
                        <h3 className="font-semibold text-lg mb-4">Questions 27-33</h3>
                        <p className="mb-4">Choose the correct heading for each paragraph from the list of headings below.</p>
                        <div className="border p-4 rounded-md mb-4 bg-slate-50">
                            <h4 className="font-bold mb-2">List of Headings</h4>
                            <ul className="list-roman list-inside text-sm">
                                <li>i. Disputes over financial arrangements regarding senior managers</li>
                                <li>ii. The impact on companies of being subjected to close examination</li>
                                <li>iii. The possible need for fundamental change in every area of business</li>
                                <li>iv. Many external bodies being held responsible for problems</li>
                                <li>v. The falling number of board members with broad enough experience</li>
                                <li>vi. A risk that not all directors take part in solving major problems</li>
                                <li>vii. Boards not looking far enough ahead</li>
                                <li>viii. A proposal to change the way the board operates</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                           <p><b>27</b> Paragraph A <Input value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('27') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['27']})</span>}</p>
                           <p><b>28</b> Paragraph B <Input value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('28') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['28']})</span>}</p>
                           <p><b>29</b> Paragraph C <Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('29') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['29']})</span>}</p>
                           <p><b>30</b> Paragraph D <Input value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('30') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['30']})</span>}</p>
                           <p><b>31</b> Paragraph E <Input value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('31') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['31']})</span>}</p>
                           <p><b>32</b> Paragraph F <Input value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('32') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['32']})</span>}</p>
                           <p><b>33</b> Paragraph G <Input value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('33') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['33']})</span>}</p>
                        </div>
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 34-37</h3>
                        <p className="mb-4">Do the following statements agree with the claims of the writer in Reading Passage 3?</p>
                        <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                          <p className="font-semibold">In boxes 34-37 on your answer sheet, write</p>
                          <p className="mt-2">
                            <span className="font-semibold">YES</span> if the statement agrees with the claims of the writer<br/>
                            <span className="font-semibold">NO</span> if the statement contradicts the claims of the writer<br/>
                            <span className="font-semibold">NOT GIVEN</span> if it is impossible to say what the writer thinks about this
                          </p>
                        </div>
                        <div className="space-y-4">
                           {['34', '35', '36', '37'].map(qNum => {
                            const questions: Record<string, string> = {
                                '34': 'Close scrutiny of the behaviour of boards has increased since the economic downturn.',
                                '35': 'Banks have been mismanaged to a greater extent than other businesses.',
                                '36': 'Board meetings normally continue for as long as necessary to debate matters in full.',
                                '37': 'Using a committee structure would ensure that board members are fully informed about significant issues.'
                            };
                            return (
                                <div key={qNum}>
                                <p><b>{qNum}</b> {questions[qNum]}</p>
                                <Input 
                                    placeholder="YES/NO/NOT GIVEN" 
                                    value={answers[qNum] || ''} 
                                    onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                    disabled={!isTestStarted || submitted}
                                    className={`mt-1 ${submitted ? (getAnswerStatus(qNum) === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                                />
                                {submitted && getAnswerStatus(qNum) === 'incorrect' && (
                                    <p className="text-sm text-green-600 mt-1">Correct answer: {correctAnswers[qNum as keyof typeof correctAnswers]}</p>
                                )}
                                </div>
                            )
                            })}
                        </div>
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 38-40</h3>
                        <p className="mb-4">Complete the sentences below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                        <div className="space-y-3">
                            <p><b>38</b> Before 2008, non-executive directors were at a disadvantage because of their lack of <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
                            <p><b>39</b> Boards tend to place too much emphasis on <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || submitted} /> considerations that are only of short-term relevance.</p>
                            <p><b>40</b> On certain matters, such as pay, the board may have to accept the views of <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || submitted} />.</p>
                            {submitted && ['38', '39', '40'].some(q => getAnswerStatus(q) === 'incorrect') && (
                            <div className="text-sm text-green-600 mt-2">
                                Correct answers: 
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
          testNumber={8} 
        />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <TestStatistics book="book-12" module="reading" testNumber={8} />
            <UserTestHistory book="book-12" module="reading" testNumber={8} />
          </div>
        </div>

      </div>
    </div>
  )
}