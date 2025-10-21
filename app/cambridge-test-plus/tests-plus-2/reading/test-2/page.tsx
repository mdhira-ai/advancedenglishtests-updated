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

export default function Book2ReadingTest2() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();
  
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
  
  const handleTestStart = () => {
    setIsTestStarted(true);
    setStartTime(Date.now());
  };
  const handleAnswerChange = (qNum: string, value: string) => setAnswers(prev => ({ ...prev, [qNum]: value }))

  const correctAnswers = {
    '1': 'vi', '2': 'ix', '3': 'iii', '4': 'viii', '5': 'i', '6': 'iv',
    '7': 'D', '8': 'B', '9': 'D', '10': 'A',
    '11': 'managers (and/or) sportsmen', '12': 'driving', '13': 'Pharmaceutical (companies)',
    '14': 'TRUE', '15': 'FALSE', '16': 'NOT GIVEN', '17': 'TRUE', '18': 'FALSE',
    '19': 'D', '20': 'F', '21': 'B', '22': 'H', '23': 'E', '24': 'A', '25': 'G',
    '26': 'B',
    '27': 'G', '28': 'D', '29': 'J', '30': 'B', '31': 'I', '32': 'C',
    '33': 'asphalt', '34': '9/nine', '35': 'concrete',
    '36': 'E', '37': 'J', '38': 'G', '39': 'C', '40': 'A'
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
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
      
      await saveTestScore({
        book: 'practice-tests-plus-2',
        module: 'reading',
        testNumber: 2,
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge Ielts Test Plus 2 - Reading Test 2</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Why risks can go wrong</h3>
                  <p><em>Human intuition is a bad guide to handling risk</em></p>
                  <p><strong>A</strong> People make terrible decisions about the future. The evidence is all around, from their investments in the stock markets to the way they run their businesses. In fact, people are consistently bad at dealing with uncertainty, underestimating some kinds of risk and overestimating others. Surely there must be a better way than using intuition?</p>
                  <p><strong>B</strong> In the 1960s a young American research psychologist, Daniel Kahneman, became interested in people's inability to make logical decisions. That launched him on a career to show just how irrationally people behave in practice. When Kahneman and his colleagues first started work, the idea of applying psychological insights to economics and business decisions was seen as rather bizarre. But in the past decade the fields of behavioural finance and behavioural economics have blossomed, and in 2002 Kahneman shared a Nobel prize in economics for his work. Today he is in demand by business organisations and international banking companies. But, he says, there are plenty of institutions that still fail to understand the roots of their poor decisions. He claims that, far from being random, these mistakes are systematic and predictable.</p>
                  <p><strong>C</strong> One common cause of problems in decision-making is over-optimism. Ask most people about the future, and they will see too much blue sky ahead, even if past experience suggests otherwise. Surveys have shown that people's forecasts of future stock market movements are far more optimistic than past long-term returns would justify. The same goes for their hopes of ever-rising prices for their homes or odds in games of chance. Such optimism can be useful for managers or sportsmen, and sometimes turns into a self-fulfilling prophecy. But most of the time it results in wasted effort and dashed hopes. Kahneman's work points to three types of over-confidence. First, people tend to exaggerate their own skill and prowess; in polls, far fewer than half the respondents admit to having below-average skills in, say, driving. Second, they overestimate the amount of control they have over the future, forgetting about luck and chalking up success solely to skill. And third, in competitive pursuits such as dealing on shares, they forget that they have to judge their skills against those of the competition.</p>
                  <p><strong>D</strong> Another source of wrong decisions is related to the decisive effect of the initial meeting, particularly in negotiations over money. This is referred to as the 'anchor effect'. Once a figure has been mentioned, it takes a strange hold over the human mind. The asking price quoted in a house sale, for example, tends to become accepted by all parties as the 'anchor' around which negotiations take place. Much the same goes for salary negotiations or mergers and acquisitions. If nobody has much information to go on, a figure can provide comfort - even though it may lead to a terrible mistake.</p>
                  <p><strong>E</strong> In addition, mistakes may arise due to stubbornness. No one likes to abandon a cherished belief, and the earlier a decision has been taken, the harder it is to abandon it. Drug companies must decide early to cancel a failing research project to avoid wasting money, but may find it difficult to admit they have made a mistake. In the same way, analysts may have become wedded early to a single explanation that coloured their perception. A fresh eye always helps.</p>
                  <p><strong>F</strong> People also tend to put a lot of emphasis on things they have seen and experienced themselves, which may not be the best guide to decision-making. For example, somebody may buy an overvalued share because a relative has made thousands on it, only to get his fingers burned. In finance, too much emphasis on information close at hand helps to explain the tendency by most investors to invest only within the country they live in. Even though they know that diversification is good for their portfolio, a large majority of both Americans and Europeans invest far too heavily in the shares of their home countries. They would be much better off spreading their risks more widely.</p>
                  <p><strong>G</strong> More information is helpful in making any decision but says Kahneman, people spend proportionally too much time on small decisions and not enough on big ones. They need to adjust the balance. During the boom years, some companies put as much effort into planning their office party as into considering strategic mergers.</p>
                  <p><strong>H</strong> Finally, crying over spilled milk is not just a waste of time; it also often colours people's perceptions of the future. Some stock market investors trade far too frequently because they are chasing the returns on shares they wish they had bought earlier.</p>
                  <p><strong>I</strong> Kahneman reckons that some types of businesses are much better than others at dealing with risk. Pharmaceutical companies, which are accustomed to many failures and a few big successes in their drug-discovery programmes, are fairly rational about their risk-taking. But banks, he says, have a long way to go. They may take big risks on a few huge loans, but are extremely cautious about their much more numerous loans to small businesses, many of which may be less risky than the big ones. And the research has implications for governments, too. They face a whole range of competing political pressures, which means they may be even more likely to take irrational decisions.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <p>There has always been a sense in which America and Europe owned film. They invented it at the end of the nineteenth century in unfashionable places like New Jersey, Leeds and the suburbs of Lyons. At first, they saw their clumsy new camera-projectors merely as profitable versions of Victorian lantern shows, mechanical curiosities which might have a use as a sideshow at a funfair. Then the best of the pioneers looked beyond the fairground properties of their invention. A few directors, now mostly forgotten, saw that the flickering new medium was more than just a diversion. This crass commercial invention gradually began to evolve as an art. DW Griffith in California glimpsed its grace. German directors used it as an analogue to the human mind and the modernising city. Soviets employed its agitational and intellectual properties, and the Italians reconfigured it on an operatic scale.</p>
                  <p>So heady were these first decades of cinema that America and Europe can be forgiven for assuming that they were the only game in town. In less than twenty years western cinema had grown out of all recognition; its unknowns became the most famous people in the world; it made millions. It never occurred to its financial backers that another continent might borrow their magic box and make it its own. But film industries were emerging in Shanghai, Bombay and Tokyo, some of which would outgrow those in the west.</p>
                  <p>Between 1930 and 1935, China produced more than 500 films, most conventionally made in studios in Shanghai, without soundtracks. China’s best directors – Bu Wancang and Yuan Muzhi – introduced elements of realism to their stories. The Peach Girl (1931) and Street Angel (1937) are regularly voted among the best ever made in the country.</p>
                  <p>India followed a different course. In the west, the arrival of talkies gave birth to a new genre – the musical – but in India, every one of the 5000 films made between 1931 and the mid-1950s had musical interludes. The films were stylistically more wide-ranging than the western musical, encompassing realism and spectacle, dance and individual sequences, and they were often three hours long rather than Hollywood's 90 minutes. The cost of such productions resulted in a distinctive national style of cinema. They were often made in Bombay, the centre of what is now known as 'Bollywood'. Performed in Hindi (rather than any of the numerous regional languages), they addressed social and peasant themes in an optimistic and romantic way and found markets in the Middle East, Africa and the Soviet Union.</p>
                  <p>In Japan, the film industry did not rival India's in size but was unusual in other ways. Whereas in Hollywood the producer was the central figure, in Tokyo the director chose the stories and hired the producer and actors. The model was that of an artist and his studio of apprentices. Empowered by a studio as an assistant, a future director worked with senior figures, learned his craft, gained authority, until promoted to director with the power to select screenplays and performers. In the 1930s and 40s, this freedom of the director led to the production of some of Asia's finest films.</p>
                  <p>The films of Kenji Mizoguchi were among the greatest of these. Mizoguchi's films were usually set in the nineteenth century and analysed the way in which the lives of the female characters whom he chose as his focus were constrained by the society of the time. From Osaka Elegy (1936) to Ugetsu Monogatari (1953) and beyond, he evolved a sinuous way of moving his camera in and around a scene, advancing towards significant details, but often retreating at moments of confrontation or strong feeling. No one had used the camera with such finesse before.</p>
                  <p>Even more important for film history, however, is the work of the great Ozu. Where Hollywood cranked up drama, Ozu avoided it. His camera seldom moved. It nestled at seated height, framing people square on, listening quietly to their words. Ozu rejected the conventions of editing, cutting not on action, as is usually done in the west, but for visual balance. Even more strikingly, Ozu regularly cut away from his action to a shot of a tree or a kettle or clouds, not to establish a new location but as a moment of repose. Many historians now compare such 'pillow shots' to the Buddhist idea that mu – empty space or nothing – is itself an element of composition.</p>
                  <p>As the art form most swayed by money and market, cinema would appear to be too busy to bother with questions of philosophy. The Asian nations proved, and are still proving, that this is not the case. Just as deep ideas about individual freedom have fed to the aspirational cinema of Hollywood, so it is the beliefs which underlie cultures such as those of China and Japan that explain the distinctiveness of Asian cinema at its best. Yes, these films are visually striking, but it is their different sense of what a person is, and what space and action are, which makes them new to western eyes.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Quiet roads ahead</h3>
                  <p><em>The roar of passing vehicles could soon be a thing of the past</em></p>
                  <p><strong>A</strong> The noise produced by busy roads is a growing problem. While vehicle designers have worked hard to quieten engines, they have been less successful elsewhere. The sound created by the tyres on the surface of the road now accounts for more than half the noise that vehicles create, and as road building and motor sales continue to boom – particularly in Asia and the US – this is turning into a global issue.</p>
                  <p><strong>B</strong> According to the World Health Organization, exposure to noise from road traffic over long periods can lead to stress-related health problems. And where traffic noise exceeds a certain threshold, road builders have to spend money erecting sound barriers and installing double glazing in lighted homes. Houses become harder to sell where environmental noise is high, and people are not as efficient or productive at work.</p>
                  <p><strong>C</strong> Already, researchers in the Netherlands – one of the most densely populated countries in the world – are working to develop techniques for silencing the roads. In the next few years the Dutch government aims to have reduced noise levels from the country's road surfaces by six decibels overall. Dutch mechanical engineer Ard Kuijpers has come up with one of the most promising, and radical, ideas. He set out to tackle the three most important factors: surface texture, hardness and ability to absorb sound.</p>
                  <p><strong>D</strong> The rougher the surface, the more likely it is that a tyre will vibrate and create noise. Road builders usually eliminate bumps on freshly laid asphalt with heavy rollers, but Kuijpers has developed a method to reduce road noise. He thinks he can create the ultimate quiet road. His secret is a special mould 3 metres wide and 50 metres long. Hot asphalt mixed with small stones is spread into the mould by a rail-mounted machine which flattens the asphalt mix with a roller. When it sets, a 10-millimetre-thick sheet has a surface smoother than anything that can be achieved by conventional methods.</p>
                  <p><strong>E</strong> To optimise the performance of his road surface – to make it hard wearing yet soft enough to snuff out vibrations – he then adds another layer below the asphalt. This consists of a 30-millimetre-thick layer of rubber, mixed with stones which are larger than those in the lower layer. 'It's like a giant mouse mat, making the road softer,' says Kuijpers.</p>
                  <p><strong>F</strong> The size of the stones used in the two layers is important, since they create pores of a specific size in the road surface. Those in the top layer are just 1 millimetre across, while the ones below are approximately twice that size – about 9 millimetres. Kuijpers says the surface can absorb any air that is passing through a tyre's tread¹, damping oscillations that would otherwise create noise. And in addition they make it easier for the water to drain away, which can make the road safer in wet weather.</p>
                  <p><strong>G</strong> Compared with the complex manufacturing process, laying the surface is quite simple. It emerges from the factory rolled, like a carpet, onto a drum 1.5 metres in diameter. On site, it is unrolled and stuck onto its foundation with bitumen. Even the white lines are applied in the factory.</p>
                  <p><strong>H</strong> The foundation itself uses an even more sophisticated technique to reduce noise further. It consists of a sound-absorbing concrete base containing flask-shaped slots up to 10 millimetres wide and 30 millimetres deep that are open at the top and sealed at the lower end. These cavities act like Helmholtz resonators – when sound waves of specific frequencies enter the top of a flask, they set up resonances inside and the energy of the sound dissipates into the concrete as heat. The cavities play another important role: they help to drain water that seeps through from the upper surface. This flow will help flush out waste material and keep the pores in the outer layers clear.</p>
                  <p><strong>I</strong> Kuijpers can even control the sounds that his resonators absorb, simply by altering their dimensions. This could prove especially useful since different vehicles produce noise at different frequencies. Car tyres peak at around 1000 hertz, for example, but trucks generate lower-frequency noise at around 200 hertz. By varying the size of the Kuijpers resonators, it is possible to control which frequencies the concrete absorbs. On large highways, trucks tend to use the inside lane, so resonators here could be tuned to absorb sounds around 200 hertz while those in other lanes could deal with higher frequency noise from cars.</p>
                  <p><strong>J</strong> Kuijpers believes he can cut noise by five decibels compared to the quietest of today's roads. He has already tested a 100-metre-long section of the road on a motorway near Apeldoorn, and Dutch construction company Heijmans is discussing the location of the next roll-out road with the country's government. The success of Kuijpers' design will depend on how much it eventually costs. But for those affected by traffic noise there is hope of quieter times ahead.</p>
                  <p>¹ the tyre's tread – the indentations or ridges on the surface of a tyre</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-6</h3><p>Reading Passage 1 has nine paragraphs A-I. Choose the correct heading for paragraphs B and D-H from the list of headings below. Write the correct number (i-xi) in boxes 1-6.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                      <h4 className="font-bold">List of Headings</h4>
                      <p>i Not identifying the correct priorities</p>
                      <p>ii A solution for the long term</p>
                      <p>iii The difficulty of changing your mind</p>
                      <p>iv Why looking back is unhelpful</p>
                      <p>v Strengthening inner resources</p>
                      <p>vi A successful approach to the study of decision-making</p>
                      <p>vii The danger of trusting a global market</p>
                      <p>viii Reluctance to go beyond the familiar</p>
                      <p>ix The power of the first number</p>
                      <p>x The need for more effective risk assessment</p>
                      <p>xi Underestimating the difficulties ahead</p>
                  </div>
                  <div className="space-y-4">
                      <p><strong>1</strong> Paragraph B</p><Input className={`max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} />
                      <p><strong>2</strong> Paragraph D</p><Input className={`max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} />
                      <p><strong>3</strong> Paragraph E</p><Input className={`max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} />
                      <p><strong>4</strong> Paragraph F</p><Input className={`max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} />
                      <p><strong>5</strong> Paragraph G</p><Input className={`max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} />
                      <p><strong>6</strong> Paragraph H</p><Input className={`max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7-10</h3><p>Choose the correct answer, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>7</strong> People initially found Kahneman's work unusual because he</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> saw mistakes as following predictable patterns.</p><p><strong>B</strong> was unaware of behavioural approaches.</p><p><strong>C</strong> dealt with irrational types of practice.</p><p><strong>D</strong> applied psychology to finance and economics.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /></div>
                      <div><p><strong>8</strong> The writer mentions house-owners' attitudes towards the value of their homes to illustrate that</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> past failures may destroy an optimistic attitude.</p><p><strong>B</strong> people tend to exaggerate their chances of success.</p><p><strong>C</strong> optimism may be justified in certain circumstances.</p><p><strong>D</strong> people are influenced by the success of others.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} /></div>
                      <div><p><strong>9</strong> Stubbornness and inflexibility can cause problems when people</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> think their financial difficulties are just due to bad luck.</p><p><strong>B</strong> are seeking advice from experts and analysts.</p><p><strong>C</strong> refuse to invest in the early stages of a project.</p><p><strong>D</strong> are unwilling to give up unsuccessful activities or beliefs.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} /></div>
                      <div><p><strong>10</strong> Why do many Americans and Europeans fail to spread their financial risks when investing?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> They feel safer dealing in a context which is close to home.</p><p><strong>B</strong> They do not understand the benefits of diversification.</p><p><strong>C</strong> They are over-influenced by the successes of their relatives.</p><p><strong>D</strong> They do not have sufficient knowledge of one another's countries.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 11-13</h3><p>Answer the questions below, using <strong>NO MORE THAN THREE WORDS</strong> for each answer.</p>
                  <div className="space-y-4">
                      <p><strong>11</strong> Which two occupations may benefit from being over-optimistic?</p><Input className={`max-w-[250px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} />
                      <p><strong>12</strong> Which practical skill are many people over-confident about?</p><Input className={`max-w-[250px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} />
                      <p><strong>13</strong> Which type of business has a generally good attitude to dealing with uncertainty?</p><Input className={`max-w-[250px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} />
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p>Do the following statements agree with the information given in Reading Passage 2? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>14</strong> The inventors of cinema regarded it as a minor attraction.</p><Input className={`max-w-[150px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} />
                      <p><strong>15</strong> Some directors were aware of cinema's artistic possibilities from the very beginning.</p><Input className={`max-w-[150px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} />
                      <p><strong>16</strong> The development of cinema's artistic potential depended on technology.</p><Input className={`max-w-[150px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} />
                      <p><strong>17</strong> Cinema's possibilities were developed in varied ways in different western countries.</p><Input className={`max-w-[150px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />
                      <p><strong>18</strong> Western businessmen were concerned about the emergence of film industries in other parts of the world.</p><Input className={`max-w-[150px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-25</h3><p>Complete the notes below using the list of words (A-K) from the box below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                    <p><strong>A</strong> emotional, <strong>B</strong> negative, <strong>C</strong> expensive, <strong>D</strong> silent, <strong>E</strong> social, <strong>F</strong> outstanding, <strong>G</strong> little, <strong>H</strong> powerful, <strong>I</strong> realistic, <strong>J</strong> stylistic, <strong>K</strong> economic</p>
                  </div>
                  <div className="space-y-2">
                      <p><strong>Chinese cinema:</strong> large number of <strong>19</strong> <Input className={`inline-block w-24 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} /> films produced in 1930s. some early films still generally regarded as <strong>20</strong> <Input className={`inline-block w-24 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /></p>
                      <p><strong>Indian cinema:</strong> films included musical interludes. films avoided <strong>21</strong> <Input className={`inline-block w-24 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} /> topics</p>
                      <p><strong>Japanese cinema:</strong> unusual because film director was very <strong>22</strong> <Input className={`inline-block w-24 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} />. two important directors: Mizoguchi – focused on the <strong>23</strong> <Input className={`inline-block w-24 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /> restrictions faced by women. camera movement related to <strong>24</strong> <Input className={`inline-block w-24 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /> content of film. Ozu – <strong>25</strong> <Input className={`inline-block w-24 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> camera movement</p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Question 26</h3><p>Which of the following is the most suitable title for Reading Passage 2?</p>
                  <div className="space-y-2"><p><strong>A</strong> Blind to change: how is it that the west has ignored Asian cinema for so long?</p><p><strong>B</strong> A different basis: how has the cinema of Asian countries been shaped by their cultures and beliefs?</p><p><strong>C</strong> Outside Asia: how did the origins of cinema affect its development worldwide?</p><p><strong>D</strong> Two cultures: how has western cinema tried to come to terms with the challenge of the Asian market?</p></div>
                  <Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} />
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p>Reading Passage 3 has ten paragraphs labelled A-J. Which paragraph contains the following information?</p>
                  <div className="space-y-4">
                      <p><strong>27</strong> a description of the form in which Kuijpers' road surface is taken to its destination</p><Input className={`max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} />
                      <p><strong>28</strong> an explanation of how Kuijpers makes a smooth road surface</p><Input className={`max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} />
                      <p><strong>29</strong> something that has to be considered when evaluating Kuijpers' proposal</p><Input className={`max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> various economic reasons for reducing road noise</p><Input className={`max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> a generalisation about the patterns of use of vehicles on major roads</p><Input className={`max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                      <p><strong>32</strong> a summary of the different things affecting levels of noise on roads</p><Input className={`max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-35</h3><p>Label the diagram below. Choose <strong>NO MORE THAN ONE WORD AND/OR A NUMBER</strong> from the passage for each answer.</p>
                  <img src="/img/ielts/cambridge-plus/plus2/reading/test2/diagram.png" alt="Diagram of Kuijpers' road surface" className="w-full mb-4" />
                  <p><strong>33</strong> <Input className={`inline-block w-32 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} /></p>
                  <p><strong>34</strong> stones (approx. <Input className={`inline-block w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> mm diameter)</p>
                  <p><strong>35</strong> <Input className={`inline-block w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /></p>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36-40</h3><p>Complete the table below using the list of words (A-K) from the box below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                    <p><strong>A</strong> frequencies, <strong>B</strong> the engine, <strong>C</strong> rubbish, <strong>D</strong> resonators, <strong>E</strong> air flow, <strong>F</strong> dissipation, <strong>G</strong> sound energy, <strong>H</strong> pores, <strong>I</strong> lanes, <strong>J</strong> drainage, <strong>K</strong> sources</p>
                  </div>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead><tr><th className="border p-2">Layer</th><th className="border p-2">Component</th><th className="border p-2">Function</th></tr></thead>
                    <tbody>
                        <tr><td className="border p-2" rowSpan={3}>upper and lower</td><td className="border p-2" rowSpan={3}>stones</td><td className="border p-2">reduce oscillations caused by <strong>36</strong> <Input className={`w-full ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} /></td></tr>
                        <tr><td className="border p-2">create pores which help <strong>37</strong> <Input className={`w-full ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /></td></tr>
                        <tr><td className="border p-2">...</td></tr>
                        <tr><td className="border p-2" rowSpan={3}>foundation</td><td className="border p-2" rowSpan={3}>slots</td><td className="border p-2">convert <strong>38</strong> <Input className={`w-full ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> to heat.</td></tr>
                        <tr><td className="border p-2">help to remove <strong>39</strong> <Input className={`w-full ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /></td></tr>
                        <tr><td className="border p-2">can be adapted to absorb different <strong>40</strong> <Input className={`w-full ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /></td></tr>
                    </tbody>
                  </table>
                  </div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Object.keys(correctAnswers).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <PageViewTracker 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={2} 
          />
          <TestStatistics 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={2} 
          />
          <UserTestHistory 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={2}
          />
        </div>
      </div>
    </div>
  )
}