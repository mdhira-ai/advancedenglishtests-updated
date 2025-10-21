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
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { TestStatistics } from '@/components/analytics/TestStatistics'
import { UserTestHistory } from '@/components/analytics/UserTestHistory'

export default function BookPlus3ReadingTest1() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  useEffect(() => {
    setStartTime(Date.now());
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
      if (checkAnswer(qNum)) correctCount++;
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, results: Object.keys(correctAnswers).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      
      await saveTestScore({
        book: 'practice-tests-plus-3',
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
    setAnswers({}); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': '100/a hundred/one hundred', '2': '50 percent/fifty percent', '3': 'water', '4': 'energy monitors', '5': 'diesel generators', '6': 'insulation', '7': 'greenhouses',
    '8': 'FALSE', '9': 'TRUE', '10': 'NOT GIVEN', '11': 'TRUE', '12': 'FALSE', '13': 'TRUE',
    '14': 'F', '15': 'B', '16': 'G', '17': 'A', '18': 'C', '19': 'D', '20': 'C', '21': 'A', '22': 'D', '23': 'B',
    '24': 'temporary', '25': 'home', '26': 'factors',
    '27': 'A', '28': 'C', '29': 'A', '30': 'D', '31': 'B', '32': 'NOT GIVEN', '33': 'YES', '34': 'YES', '35': 'NO', '36': 'NOT GIVEN',
    '37': 'F', '38': 'E', '39': 'H', '40': 'A'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 3 - Reading Test 1</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold text-xl">Reducing electricity consumption on the Isle of Eigg</h3>
                  <p><strong>Background</strong></p>
                  <p>The Isle of Eigg is situated off the West Coast of Scotland, and is reached by ferry from the mainland. For the island community of about a hundred residents, it has always been expensive to import products, materials and skilled labour from the mainland, and this has encouraged a culture of self-sufficiency and careful use of resources. Today, although the island now has most modern conveniences, CO2 emissions per household are 20 percent lower than the UK average, and electricity use is 50 percent lower.</p>
                  <p>When Eigg’s electricity grid was switched on in February 2008, it quickly became apparent that in order to keep the capital building costs down, it would be necessary to manage demand. This would also allow the island to generate most of its electricity from renewable sources, mainly water, wind and solar power. This goal was overseen by the Eigg Heritage Trust (EHT).</p>
                  <p><strong>The technology</strong></p>
                  <p>Eigg manages electricity demand mainly by capping the instantaneous power that can be used by any one household to ten kW for a business. If usage goes over the limit, the electricity supply is cut off and the maintenance team must be called to come and switch it back on again. All households and businesses have energy monitors, which display current and cumulative electricity usage, and sound an alarm when consumption reaches a user-defined level, usually set a few hundred watts below the actual limit. The result is that Eigg residents have a keen sense of how much power different electrical appliances use, and are careful to minimise energy consumption.</p>
                  <p>Demand is also managed by warning the entire island when renewable energy generation is lower than demand, and diesel generators are operating to back it up, a so-called ‘red light day’, as opposed to ‘green light days’ when there is sufficient renewable energy. Residents then take steps to temporarily reduce electricity demand further still, or postpone demand until renewable energy generation has increased.</p>
                  <p>Energy use on the island has also been reduced through improved wall and loft insulation in homes, new boilers, solar water heating, car sharing and various small, energy-saving measures in households. New energy supplies are being developed, including sustainably harvested forests to supply wood for heating.</p>
                  <p>Eigg Heritage Trust has installed insulation in all of its own properties at no cost to the tenants, while private properties have paid for their own insulation to be installed. The same applies for installations of solar water heating, although not all Trust properties have received this as yet. The Trust also operates a Green Grants scheme, where residents can claim 50 percent of the cost of equipment to reduce carbon emissions, up to a limit of £300. Purchases included bikes, solar water heating, secondary glazing, thicker curtains, and greenhouses to grow food locally, rather than importing it.</p>
                  <p><strong>Environmental benefits</strong></p>
                  <p>Prior to the installation of the new electricity grid and renewable energy generation, most households on Eigg used diesel generators to supply electricity, resulting in significant carbon emissions. Homes were also poorly insulated and badly heated. Inefficient oil-burning boilers, or used coal for heating.</p>
                  <p>The work by the Eigg Heritage Trust to reduce energy use has resulted in significant reductions in carbon emissions from the island’s households and businesses. The average annual electricity use per household is 2,160 kilowatt hours (kWh), compared to a UK average in 2008 of 4,198 kWh. Domestic carbon emissions have fallen by 47 percent, from 8.4 to 4.45 tonnes per year. This compares to average UK household emissions of 5.5 to 6 tonnes per year. The emissions should fall even further over the next few years as the supply of wood for heating increases.</p>
                  <p><strong>Social benefits</strong></p>
                  <p>The completion of Eigg’s electricity grid has made a significant difference to the island’s residents, freeing them from dependence on diesel generators and providing them with a stable and affordable power supply. A reliable electricity supply has brought improvements in other areas – for example, better treatment of drinking water in some houses, and the elimination of the constant noise of diesel generators. Improved home insulation and heating has also yielded benefits, making it more affordable to keep homes at a comfortable temperature. One of the incentives for capping electricity use, rather than charging different amounts according to usage, was to make access to energy equitable. Every household has the same five kW cap, irrespective of income, so distributing the available resources equally across the island’s population.</p>
                  <p><strong>Economic and employment benefits</strong></p>
                  <p>Eigg’s electricity grid supports four part-time maintenance jobs on the island, and residents have also been employed for building work to improve Trust-owned houses and other buildings. Likewise, the start of organised harvesting of wood for heating has created several forestry jobs for residents. A part-time ‘green project manager’ post has also been created. A wider economic impact has come from having a reliable and affordable electricity supply, which has enabled several new businesses to start up, including restaurants, shops, guest houses and self-catering accommodation. As Eigg has become known for cutting carbon emissions and protecting the environment, an increasing number of visitors have come to the island to learn about its work, bringing a further economic benefit to the residents.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold text-xl">Change in business organisations</h3>
                  <p><strong>A</strong> The forces that operate to bring about change in organisations can be thought of as winds which are many and varied – from small summer breezes that merely disturb a few papers, to mighty howling gales which cause devastation, structures and operations, causing consequent orientation of purpose and rebuilding. Sometimes, however, the winds die down to give periods of relative calm, periods of relative organisational stability. Such a period was the agricultural age, which Goodman (1995) maintains prevailed in Europe and western societies as a whole until the early 1700s. During this period, wealth was created in the context of an agriculturally based society influenced mainly by local markets (both customer and labour) and factors outside people’s control, such as the weather. During this time, people could fairly well predict the cycle of activities required to maintain life, even if that life might be at little more than subsistence level.</p>
                  <p><strong>B</strong> To maintain the meteorological metaphor, stronger winds of change blew to bring in the Industrial Revolution and the industrial age. Again, according to Goodman, this lasted for a long time, until around 1945. It was characterised by a series of inventions and innovations that reduced the number of people needed to work the land and, in turn, provided the means of production of hitherto rarely obtainable goods for organisations supplying these in ever increasing numbers became the aim. To a large extent, demand and supply were predictable, enabling companies to structure their organisations along what Burns and Stalker (1966) described as mechanistic lines, that is as systems of strict hierarchical structures and firm means of control.</p>
                  <p><strong>C</strong> This situation prevailed for some time, with demand still coming mainly from the domestic market and organisations striving to fill the ‘supply gap’. Thus the most disturbing environmental influence on organisations of this time was the demand for products, which outstripped supply. The saying attributed to Henry Ford that ‘you can have any colour of car so long as it is black’, gives a flavour of the supply-led state of the market. Apart from any technical difficulties of producing different colours of car, Ford did not have to worry about customers’ colour preferences: he could sell all that he made. Organisations of this period can be regarded as ‘task-oriented’, with effort being put into increasing production through more effective and efficient production processes.</p>
                  <p><strong>D</strong> As time passed, this favourable period for organisations began to decline. In the neo-industrial age, people became more discriminating in the goods and services they wished to buy and, as technological advancements brought about increased productivity, supply overtook demand. Companies began, increasingly, to look abroad for additional markets.</p>
                  <p><strong>E</strong> At the same time, organisations faced more intensive competition from abroad for their own products and services in the West. This development was accompanied by a shift in focus from manufacturing to service, whether this merely added value to manufactured products, or whether it was service in its own right. In the neo-industrial age of western countries, the emphasis moved towards adding value to goods and services – what Goodman calls the value-oriented time, as contrasted with the task-oriented and products/services-oriented times of the past.</p>
                  <p><strong>F</strong> Today, in the post-industrial age, most people agree that organisational life is becoming ever more uncertain, as the pace of change quickens and the future becomes less predictable. Writing in 1999, Nadler and Tushman, two US academics, said: ‘Poised on the eve of the next century, we are witnessing a profound transformation in the very nature of our business organisations. Historic forces have converged to fundamentally reshape the scope, strategies, and structures of large enterprise.’ At a less general level of analysis, Graeme Leach, Chief Economist at the British Institute of Directors, claimed in the Guardian newspaper (2000) that: ‘By 2020, the nine-to-five rat race will be extinct and present levels of self-employment, commuting and technology use, as well as age and sex gaps, will have changed beyond recognition.’ According to the article, Leach anticipates that, in 20 years time, 20-25 percent of the workforce will be temporary workers and many more will be flexible. 25 percent of people will no longer work in a traditional office and ... 50 percent will work from home in some form.' Continuing to use the 'winds of change' metaphor, the expectation is of damaging gale-force winds bringing the need for rebuilding that takes the opportunity to incorporate new ideas and ways of doing things.</p>
                  <p><strong>G</strong> Whether all this will happen is arguable. Forecasting the future is always fraught with difficulties. For instance, Mannermann (1998) sees future studies as part art and part science and notes: ‘The future is full of surprises, uncertainty, trends and trend breaks, irrationality and rationality, and it is changing and escaping from our hands as time goes by. It is also the result of actions made by innumerable more or less powerful forces.’ What seems certain is that the organisational world is changing at a fast rate – even if the direction of change is not always predictable. Consequently, it is crucial that organisational managers and decision makers are aware of, and able to analyse the factors which trigger organisational change.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold text-xl">The creation of lasting memories</h3>
                  <p>Many studies of the brain processes underlying the creation of memory consolidation (lasting memories) have involved giving various human and animal subjects treatment, while training them to perform a task. These have contributed greatly to our understanding.</p>
                  <p>In pioneering studies using goldfish, Bernard Agranoff found that protein synthesis inhibitors* injected after training caused the goldfish to forget what they had learned. In other experiments, he administered protein synthesis inhibitors immediately before the fish were trained. The remarkable finding was that the fish learned the task completely normally, but forgot it within a few hours – that is, the protein synthesis inhibitors blocked memory consolidation, but did not influence short-term memory.</p>
                  <p>There is now extensive evidence that short-term memory is spared by many kinds of treatments, including electro-convulsive therapy (ECT), that block memory consolidation. On the other hand, and equally importantly, neuroscientist Ivan Izquierdo found that many drug treatments can block short-term memory without blocking memory consolidation. Contrary to the hypothesis put forward by Canadian psychologist Donald Hebb, in 1949, long-term memory does not require short-term memory, and vice versa.</p>
                  <p>Such findings suggest that our experiences create parallel, and possibly independent stages of memory, each with a different life span. All of this evidence from clinical and experimental studies strongly indicates that the brain handles recent and remote memory in different ways; but why does it do that?</p>
                  <p>We obviously need to have memory that is created rapidly: reacting to an ever and rapidly changing environment requires that. For example, most current building codes require that the heights of all steps in a staircase be equal. After taking a couple of steps, up or down, we implicitly remember the heights of the steps and assume that the others will be the same. If they are not the same, we are very likely to trip and fall. Lack of this kind of rapidly created implicit memory would be bad for us and for insurance companies, but perhaps good for lawyers. It would be of little value to us if we remembered the heights of the steps only after a delay of many hours, when the memory becomes consolidated.</p>
                  <p>The hypothesis that lasting memory consolidates slowly over time is supported primarily by clinical and experimental evidence that the formation of long-term memory is influenced by treatments and disorders affecting brain functioning. There are also other kinds of evidence indicating more directly that the memories consolidate over time after learning. Avi Kami and Dov Sagi reported that the performance of human subjects trained in a visual skill did not improve until eight hours after the training, and that improvement was even greater the following day. Furthermore, the skill was retained for several years.</p>
                  <p>Studies using human brain imaging to study changes in neural activity induced by learning have also reported that the changes continue to develop for hours after learning. In an innovative study using functional imaging of the brain, Reza Shadmehr and Henry Holcomb examined brain activity in several brain regions shortly after human subjects were trained in a motor learning task. They found that the performance of the subjects remained stable for several hours after completion of the training.</p>
                  <p>Their brain activity did not; different regions of the brain were predominantly active at different times over a period of several hours after the training. The activity shifted from the prefrontal cortex to two areas known to be involved in controlling movement, the motor cortex and cerebellar cortex. Consolidation of the motor skill appeared to involve activation of different neural systems that increased the stability of the brain processes underlying the skill.</p>
                  <p>There is also evidence that learning-induced changes in the activity of neurons in the cerebral cortex continue to increase for many days after the training. In an extensive series of studies using rats with electrodes implanted in the auditory cortex, Norman Weinberg reported that, after a tone of specific frequency was paired a few times with footshock, neurons in the rats’ auditory cortex responded more to that specific tone and less to other tones of other frequencies. Even more interestingly, the selectivity of the neurons’ response to the specific tone used in training continued to increase for several days after the training was terminated.</p>
                  <p>It is not intuitively obvious why our lasting memories consolidate slowly. Certainly, one can wonder why we have a form of memory that we have to rely on for many hours, days or a lifetime, that is so susceptible to disruption shortly after it is initiated. Perhaps the brain system that consolidates long-term memory over time was a late development in vertebrate evolution. Moreover, maybe we consolidate memories slowly because our mammalian brains are large and enormously complex. We can readily reject these ideas. All species of animals studied to date have both short and long-term memory, and all are susceptible to retrograde amnesia. Like humans, birds, bees and molluscs, as well as fish and rats, make long-term memory slowly. Consolidation of memory clearly emerged early in evolution, and was conserved.</p>
                  <p>Although there seems to be no compelling reason to conclude that a biological system such as a brain could not quickly make a lasting memory, the fact is that animal brains do not. Thus, memory consolidation must serve some very important adaptive function or functions. There is considerable evidence suggesting that the slow consolidation is adaptive because it enables neurobiological processes occurring shortly after learning to influence the strength of memory for experiences. The extensive evidence that memory can be enhanced, as well as impaired, by treatments administered shortly after training, provides intriguing support for this hypothesis.</p>
                  <p><i>* substances which stop or slow the growth of cells</i></p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-7</h3><p>Answer the questions below. Choose <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> from the passage for each answer.</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>1</strong> Approximately how many people live on Eigg?</p><Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>2</strong> What proportion of a UK household’s electricity consumption does an Eigg household consume?</p><Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>3</strong> Apart from wind and sun, where does most of Eigg’s electricity come from?</p><Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>4</strong> What device measures the amount of electricity Eigg’s households are using?</p><Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>5</strong> When renewable energy supplies are insufficient, what backs them up?</p><Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>6</strong> What has EHT provided free of charge in all the houses it owns?</p><Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>7</strong> Which gardening aid did some Eigg inhabitants claim grants for?</p><Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 8-13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>8</strong> Electricity was available for the first time on Eigg when a new grid was switched on.</p><Input value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>9</strong> Eigg’s carbon emissions are now much lower than before.</p><Input value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>10</strong> Wood will soon be the main source of heating on Eigg.</p><Input value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>11</strong> Eigg is quieter as a result of having a new electricity supply.</p><Input value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>12</strong> Well-off households pay higher prices for the use of extra electricity.</p><Input value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>13</strong> The new electricity grid has created additional employment opportunities on Eigg.</p><Input value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p>Reading Passage 2 has SEVEN paragraphs, A-G. Which paragraph contains the following information?</p>
                    <div className="space-y-4 mt-4">
                      <p><strong>14</strong> some specific predictions about businesses and working practices</p><Input value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>15</strong> reference to the way company employees were usually managed</p><Input value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>16</strong> a warning for business leaders</p><Input value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>17</strong> the description of an era notable for the relative absence of change</p><Input value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>18</strong> a reason why customer satisfaction was not a high priority</p><Input value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-23</h3><p>Look at the following characteristics (Questions 19-23) and the list of periods below. Match each characteristic with the correct period, A, B or C. Write the correct letter, A, B or C.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of periods</strong></p><p><strong>A</strong> The agricultural age</p><p><strong>B</strong> The industrial age</p><p><strong>C</strong> The neo-industrial age</p></div>
                    <div className="space-y-4">
                      <p><strong>19</strong> a surplus of goods</p><Input value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>20</strong> an emphasis on production quantity</p><Input value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>21</strong> the proximity of consumers to workplaces</p><Input value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>22</strong> a focus on the quality of goods</p><Input value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>23</strong> new products and new ways of working</p><Input value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <h4 className="font-bold text-center mb-2">Businesses in the 21st century</h4>
                          <p>It is generally agreed that changes are taking place more quickly now, and that organisations are being transformed. One leading economist suggested that by 2020, up to a quarter of employees would be <strong>24</strong> <Input className="inline-block w-32 ml-1" value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} />, and half of all employees would be based in the <strong>25</strong> <Input className="inline-block w-32 ml-1" value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} />. Although predictions can be wrong, the speed of change is not in doubt, and business leaders need to understand the <strong>26</strong> <Input className="inline-block w-32 ml-1" value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} /> that will be influential.</p>
                      </div>
                    </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-4">
                      <p><strong>27</strong> Experiments by Bernard Agranoff described in Reading Passage 3 involved</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">injecting goldfish at different stages of the experiments.</li><li className="ml-2">training goldfish to do different types of task.</li><li className="ml-2">using different types of treatment on goldfish.</li><li className="ml-2">comparing the performance of different goldfish on certain tasks.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      
                      <p><strong>28</strong> Most findings from recent studies suggest that</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">drug treatments do not normally affect short-term memories.</li><li className="ml-2">long-term memories build upon short-term memories.</li><li className="ml-2">short and long-term memories are formed by separate processes.</li><li className="ml-2">ECT treatment affects both short-and long-term memories.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} />

                      <p><strong>29</strong> In the fifth paragraph, what does the writer want to show by the example of staircases?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">Prompt memory formation underlies the performance of everyday tasks.</li><li className="ml-2">Routine tasks can be carried out unconsciously.</li><li className="ml-2">Physical accidents can impair the function of memory.</li><li className="ml-2">Complex information such as regulations cannot be retained by the memory.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} />

                      <p><strong>30</strong> Observations about memory by Kami and Sagi</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">cast doubt on existing hypotheses.</li><li className="ml-2">related only to short-term memory.</li><li className="ml-2">were based on tasks involving hearing.</li><li className="ml-2">confirmed other experimental findings.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} />

                      <p><strong>31</strong> What did the experiment by Shadmehr and Holcomb show?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">Different areas of the brain were activated by different tasks.</li><li className="ml-2">Activity in the brain gradually moved from one area to other areas.</li><li className="ml-2">Subjects continued to get better at a task after training had finished.</li><li className="ml-2">Treatment given to subjects improved their performance on a task.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-36</h3><p>Do the following statements agree with the views of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>32</strong> The training which Kami and Sagi’s subjects were given was repeated over several days.</p><Input value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>33</strong> The rats in Weinberger’s studies learned to associate a certain sound with a specific experience.</p><Input value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>34</strong> The results of Weinberger’s studies indicated that the strength of the rats’ learned associations increases with time.</p><Input value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>35</strong> It is easy to see the evolutionary advantage of the way lasting memories in humans are created.</p><Input value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>36</strong> Long-term memories in humans are more stable than in many other species.</p><Input value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p>Complete the summary using the list of words, A-I, below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">Long-term memory</h4>
                      <p>Various researchers have examined the way lasting memories are formed. Laboratory experiments usually involve teaching subjects to do something <strong>37</strong> <Input className="inline-block w-20 ml-1" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} />, and treating them with mild electric shocks or drugs. Other studies monitor behaviour after a learning experience, or use sophisticated equipment to observe brain activity.</p>
                      <p>The results are generally consistent: they show that lasting memories are the result of a <strong>38</strong> <Input className="inline-block w-20 ml-1" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> and complex biological process.</p>
                      <p>The fact that humans share this trait with other species, including animals with <strong>39</strong> <Input className="inline-block w-20 ml-1" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /> brains, suggests that it developed <strong>40</strong> <Input className="inline-block w-20 ml-1" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /> in our evolutionary history.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 grid grid-cols-3 gap-2 text-sm">
                      <p><strong>A</strong> early</p><p><strong>B</strong> easy</p><p><strong>C</strong> large</p>
                      <p><strong>D</strong> late</p><p><strong>E</strong> lengthy</p><p><strong>F</strong> new</p>
                      <p><strong>G</strong> recently</p><p><strong>H</strong> small</p><p><strong>I</strong> quick</p>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <PageViewTracker 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={1}
          />
          <TestStatistics 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={1}
          />
          <UserTestHistory 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={1}
          />
        </div>
      </div>
    </div>
  )
}