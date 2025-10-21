'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'

export default function Book13ReadingTest2() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Test-specific details
  const BOOK = "book-13";
  const TEST_NUMBER = 2;

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
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTestStarted, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestStart = () => setIsTestStarted(true);

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  }

  const correctAnswers: { [key: string]: string } = {
    '1': 'oils', '2': 'friendship', '3': 'funerals', '4': 'wealth', '5': 'indigestion',
    '6': 'India', '7': 'camels', '8': 'Alexandria', '9': 'Venice', '10': 'TRUE',
    '11': 'FALSE', '12': 'NOT GIVEN', '13': 'FALSE', '14': 'B', '15': 'F',
    '16': 'B', '17': 'E', '18': 'A', '19': 'B', '20': 'C', '21': 'animals',
    '22': 'childbirth', '23': 'placebo', '24': 'game', '25': 'strangers', '26': 'names',
    '27': 'D', '28': 'C', '29': 'A', '30': 'D', '31': 'D', '32': 'D', '33': 'C',
    '34': 'B', '35': 'A', '36': 'C', '37': 'A', '38': 'B', '39': 'C', '40': 'D'
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber];
    const userAnswer = answers[questionNumber] || '';
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  }

  const calculateScore = () => {
    let correctCount = 0;
    for (const qNum of Object.keys(correctAnswers)) {
      if (checkAnswer(qNum)) correctCount++;
    }
    return correctCount;
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    
    const detailedAnswers = {
      singleAnswers: answers,
      results: Object.keys(correctAnswers).map(qNum => ({
        questionNumber: qNum,
        userAnswer: answers[qNum] || '',
        correctAnswer: correctAnswers[qNum],
        isCorrect: checkAnswer(qNum)
      })),
      score: calculatedScore,
      totalQuestions: Object.keys(correctAnswers).length,
      percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
      timeTaken
    };

    try {
      const testScoreData = {
        book: BOOK,
        module: 'reading',
        testNumber: TEST_NUMBER,
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
      setSubmitted(true);
      setShowResultsPopup(true);
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    setAnswers({}); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60);
    clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default';
  const ieltsScore = getIELTSReadingScore(score);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 13 - Reading Test 2</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6">
            <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <CardContent className="p-4"><div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="text-center"><div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>
                    </div>
                    {!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}
                    {isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}
                    {submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}
                </div>
                {!isTestStarted && !submitted && (<div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800"><p className="font-semibold">Instructions:</p><p>• You have 60 minutes. Click "Start Test" to begin the timer.</p></div>)}
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">
              <h2 className="text-xl font-bold">Reading Passages</h2>
              <Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
                <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                    <h3 className="font-semibold text-center">Bringing cinnamon to Europe</h3>
                
                  <p>Cinnamon is a sweet, fragrant spice produced from the inner bark of trees of the genus Cinnamomum, which is native to the Indian sub-continent. It was known in biblical times, and is mentioned in several books of the Bible, both as an ingredient that was mixed with oil for anointing people's bodies, and also as a token indicating friendship among lovers and friends. In ancient Rome, mourners attending funerals burnt cinnamon to create a pleasant scent. Most often, however, the spice found its primary use as an additive to food and drink. In the Middle Ages, Europeans who could afford the spice used it to flavour food, particularly meat, and to impress those around them with their ability to purchase an expensive condiment from the 'exotic' East. At a banquet, a host would offer guests a plate with various spices piled upon it as a sign of the wealth at his or her disposal. Cinnamon was also reported to have health benefits, and was thought to cure various ailments, such as indigestion.</p>

    <p>Toward the end of the Middle Ages, the European middle classes began to desire the lifestyle of the elite, including their consumption of spices. This led to a growth in demand for cinnamon and other spices. At that time, cinnamon was transported by Arab merchants, who closely guarded the secret of the source of the spice from potential rivals. They took it from India, where it was grown, on camels via an overland route to the Mediterranean. Their journey ended when they reached Alexandria. European traders sailed there to purchase their supply of cinnamon, then brought it back to Venice. The spice then travelled from that great trading city to markets all around Europe. Because the overland trade route allowed for only small quantities of the spice to reach Europe, and because Venice had a virtual monopoly of the trade, the Venetians could set the price of cinnamon exorbitantly high. These prices, coupled with the increasing demand, spurred the search for new routes to Asia by Europeans eager to take part in the spice trade.</p>

    <p>Seeking the high profits promised by the cinnamon market, Portuguese traders arrived on the island of Ceylon in the Indian Ocean toward the end of the 15th century. Before Europeans arrived on the island, the state had organized the cultivation of cinnamon. People belonging to the ethnic group called the Salagama would peel the bark off young shoots of the cinnamon plant in the rainy season, when the wet bark was more pliable. During the peeling process, they curled the bark into the 'stick' shape still associated with the spice today. The Salagama then gave the finished product to the king as a form of tribute. When the Portuguese arrived, they needed to increase</p>

    <p>production significantly, and so enslaved many other members of the Ceylonese native population, forcing them to work in cinnamon harvesting. In 1518, the Portuguese built a fort on Ceylon, which enabled them to protect the island, so helping them to develop a monopoly in the cinnamon trade and generate very high profits. In the late 16th century, for example, they enjoyed a tenfold profit when shipping cinnamon over a journey of eight days from Ceylon to India.</p>

    <p>When the Dutch arrived off the coast of southern Asia at the very beginning of the 17th century, they set their sights on displacing the Portuguese as kings of cinnamon. The Dutch allied themselves with Kandy, an inland kingdom on Ceylon. In return for payments of elephants and cinnamon, they protected the native king from the Portuguese. By 1640, the Dutch broke the 150-year old Portuguese monopoly when they overran and occupied their factories. By 1658, they had permanently expelled the Portuguese from the island, thereby gaining control of the lucrative cinnamon trade.</p>

    <p>In order to protect their hold on the market, the Dutch, like the Portuguese before them, treated the native inhabitants harshly. Because of the need to boost production and satisfy Europe's ever-increasing appetite for cinnamon, the Dutch began to alter the harvesting practices of the Ceylonese. Over time, the supply of cinnamon trees on the island became nearly exhausted, due to systematic stripping of the bark. Eventually, the Dutch began cultivating their own cinnamon trees to supplement the diminishing number of wild trees available for use.</p>

    <p>Then, in 1796, the English arrived on Ceylon, thereby displacing the Dutch from their control of the cinnamon monopoly. By the middle of the 19th century, production of cinnamon reached 1,000 tons a year, after a lower grade quality of the spice became acceptable to European tastes. By that time, cinnamon was being grown in other parts of the Indian Ocean region and in the West Indies, Brazil, and Guyana. Not only was a monopoly of cinnamon becoming impossible, but the spice trade overall was diminishing in economic potential, and was eventually superseded by the rise of trade in coffee, tea, chocolate, and sugar.</p>

                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">Oxytocin</h3>
                  <p><b>A</b> Oxytocin is a chemical, a hormone produced in the pituitary gland in the brain. It was through various studies focusing on animals that scientists first became aware of the influence of oxytocin. They discovered that it helps reinforce the bonds between prairie voles, which mate for life, and triggers the motherly behaviour that sheep show towards their newborn lambs. It is also released by women in childbirth, strengthening the attachment between mother and baby. Few chemicals have as positive a reputation as oxytocin, which is sometimes referred to as the 'love hormone'. One sniff of it can, it is claimed, make a person more trusting, empathetic, generous and cooperative. It is time, however, to revise this wholly optimistic view. A new wave of studies has shown that its effects vary greatly depending on the person and the circumstances, and it can impact on our social interactions for worse as well as for better.</p>
                  <p><b>B</b> Oxytocin's role in human behaviour first emerged in 2005. In a groundbreaking experiment, Markus Heinrichs and his colleagues at the University of Freiburg, Germany, asked volunteers to do an activity in which they could invest money with an anonymous person who was not guaranteed to be honest. The team found that participants who had sniffed oxytocin via a nasal spray beforehand invested more money than those who received a placebo instead. The study was the start of research into the effects of oxytocin on human interactions. 'For eight years, it was quite a lonesome field,' Heinrichs recalls. 'Now, everyone is interested.' These follow-up studies have shown that after a sniff of the hormone, people become more charitable, better at reading emotions on others' faces and at communicating constructively in arguments. Together, the results fuelled the view that oxytocin universally enhanced the positive aspects of our social nature.</p>
                  <p><b>C</b> Then, a few years later, a study by Simone Shamay-Tsoory at the University of Haifa, Israel, found that when volunteers played a competitive game, those who inhaled oxytocin showed more pleasure when they beat other players, and more envy when other players won. What’s more, administering oxytocin also has sharply contrasting outcomes depending on a person’s disposition. Jennifer Bartz from Mount Sinai School of Medicine, New York, found that it improves people’s ability to read emotions, but only if they are not very socially adept to begin with. Her research also shows that oxytocin in fact reduces cooperation in subjects who are particularly anxious or sensitive to rejection.</p>
                  <p><b>D</b> Another discovery is that oxytocin’s effects vary depending on who we are interacting with. Studies conducted by Carolyn DeClerck of the University of Antwerp, Belgium, revealed that people who had received a dose of oxytocin actually became less cooperative when dealing with complete strangers. Meanwhile, Carsten De Dreu at the University of Amsterdam in the Netherlands discovered that volunteers given oxytocin showed favouritism towards their teammates when they were pitted against competing teams in a game. What's more, oxytocin drives people to care for those in their social circle and defend them from outsiders. It appears that oxytocin strengthens biases, rather than promoting general goodwill, as was previously thought.</p>
                  <p><b>E</b> There were signs of these subtleties from the start. Bartz has recently shown that in almost half of the existing research results, oxytocin influences only certain individuals or in certain circumstances. Once researchers took that into account, it became clear that they had been underestimating the significance of their findings. To Bartz, the key is understanding what the hormone does in the first place. The prevailing theory is that it reduces anxiety and fear. Or it could simply motivate people to seek out social connections. She believes that oxytocin acts as a chemical spotlight that shines on social cues – a shift in a person's glance, a flicker of the eyes, a dip in the voice – making people more attuned to their social environment. This would explain why it makes people more responsive to others in their in-group, but wary of those in their out-group. It also makes things worse for people who are overly sensitive or prone to interpreting social cues in the worst light.</p>
                  <p><b>F</b> Perhaps we should not be surprised that the hormone is so complex. The hormone is found in everything from octopuses to sheep, and its evolutionary roots go back half a billion years. It's a very simple and ancient molecule that has been co-opted for many different functions. It affects primitive parts of the brain like the amygdala, so it’s going to have many effects on just about everything. Bartz agrees. 'Oxytocin probably does some very basic things, but once you add our higher-order thinking and social situations, these basic processes could manifest in different ways depending on individual differences and context.'</p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">Making the most of trends</h3>
                  
                  <p>Most managers can identify the major trends of the day. But in the course of conducting research in a number of industries and working directly with companies, we have discovered that managers often fail to recognize the less obvious but profound ways these trends are influencing consumers' aspirations, attitudes, and behaviors. This is especially true of trends that managers view as peripheral to their core markets.</p>

<p>Many ignore trends in their innovation strategies or adopt a wait-and-see approach and let competitors take the lead. At a minimum, such responses mean missed profit opportunities. At the extreme, they can jeopardize a company by ceding to rivals the opportunity to transform the industry. The purpose of this article is twofold: to spur managers to think more expansively about how trends could engender new value propositions in their core markets, and to provide some high-level advice on how to make market research and product development personnel more adept at analyzing and exploiting trends.</p>

<p>One strategy, known as 'infuse and augment', is to design a product or service that retains most of the attributes and functions of existing products in the category but adds others that address the needs and desires unleashed by a major trend. A case in point is the Poppy range of handbags, which the firm Coach created in response to the economic downturn of 2008. The Coach brand had been a symbol of opulence and luxury for nearly 70 years, and the most obvious reaction to the downturn would have been to lower prices. However, that would have risked cheapening the brand's image. Instead, they initiated a consumer-research project which revealed that customers were eager to lift themselves and the country out of tough times. Using these insights, Coach launched the lower-priced Poppy handbags, which were in vibrant colors, and looked more youthful and playful than conventional Coach products. Creating the sub-brand allowed Coach to avert an across-the-board price cut. In contrast to the many companies that responded to the recession by cutting prices, Coach saw the new consumer mindset as an opportunity for innovation and renewal.</p>

<p>A further example of this strategy was supermarket Tesco's response to consumers' growing concerns about the environment. With that in mind, Tesco, one of the world's top five retailers, introduced its Greener Living program, which demonstrates the company's commitment to protecting the environment by involving consumers in ways that produce tangible results. For example, Tesco customers can accumulate points for such activities as reusing bags, recycling cans and printer cartridges, and buying home-insulation materials. Like points earned on regular purchases, these green points can be redeemed for cash. Tesco has not abandoned its traditional retail offerings but augmented its business with these innovations, thereby infusing its value proposition with a green streak.</p>

<p>A more radical strategy is 'combine and transcend'. This entails combining aspects of the product's existing value proposition with attributes addressing changes arising from a trend, to create a novel experience – one that may land the company in an entirely new market space. At first glance, spending resources to incorporate elements of a seemingly irrelevant trend into one's core offerings sounds like it's hardly worthwhile. But consider Nike's move to integrate the digital revolution into its reputation for high-performance athletic footwear. In 2006, they teamed up with technology company Apple to launch Nike+, a digital sports kit comprising a sensor that attaches to the running shoe and a wireless receiver that connects to the user's iPod. By combining Nike's original value proposition for amateur athletes with one for digital consumers, the Nike+ sports kit and web interface moved the company from a focus on athletic apparel to a new plane of engagement with its customers.</p>

<p>A third approach, known as 'counteract and reaffirm', involves developing products or services that stress the values traditionally associated with the category in ways that allow consumers to oppose – or at least temporarily escape from – the aspects of trends they view as undesirable. A product that accomplished this is the ME2, a video game created by Canada's iToys. By reaffirming the toy category's association with physical play, the ME2 counteracted some of the widely perceived negative impacts of digital gaming devices. Like other handheld games, the device featured a host of exciting interactive games, a full-color LCD screen, and advanced 3D graphics. What set it apart was that it incorporated the traditional physical component of children's play: it contained a pedometer, which tracked and awarded points for physical activity (walking, running, biking, skateboarding, climbing stairs). The child could use the points to enhance various virtual skills needed for the video game. The ME2, introduced in mid-2008, catered to kids' huge desire to play video games while countering the negatives, such as associations with lack of exercise and obesity.</p>

<p>Once you have gained perspective on how trend-related changes in consumer opinions and behaviors impact on your category, you can determine which of our three innovation strategies to pursue. When your category's basic value proposition continues to be meaningful for consumers influenced by the trend, the infuse-and-augment strategy will allow you to reinvigorate the category. If analysis reveals an increasing disparity between your category and consumers' new focus, your innovations need to transcend the category to integrate the two worlds. Finally, if aspects of the category clash with undesired outcomes of a trend, such as associations with unhealthy lifestyles, there is an opportunity to counteract those changes by reaffirming the core values of your category.</p>

<p>Trends – technological, economic, environmental, social, or political – that affect how people perceive the world around them and shape what they expect from products and services present firms with unique opportunities for growth.</p>


                   </CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button>
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-26</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 27-40</button>
                </div>
              </div>
              
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-9</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                        <h4 className="font-semibold text-center mb-4">The Early History of Cinnamon</h4>
                        <p><strong>Biblical times:</strong> added to <strong>1</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting}/>; used to show <strong>2</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting}/> between people</p>
                        <p><strong>Ancient Rome:</strong> used for its sweet <strong>3</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting}/> at funerals</p>
                        <p><strong>Middle Ages:</strong> added to food, especially meat; was an indication of a person’s <strong>4</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting}/>; known as a treatment for <strong>5</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting}/> and other health problems; grown in <strong>6</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting}/>; merchants used <strong>7</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting}/> to bring it to the Mediterranean; arrived in the Mediterranean at <strong>8</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting}/>; traders took it to <strong>9</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting}/> and sold it to destinations around Europe.</p>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 10-13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">10</span><div className="flex-1"><p>The Portuguese had control over the cinnamon trade in Ceylon throughout the 16th century.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">11</span><div className="flex-1"><p>The Dutch took over the cinnamon trade from the Portuguese as soon as they arrived in Ceylon.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">12</span><div className="flex-1"><p>The trees planted by the Dutch produced larger quantities of cinnamon than the wild trees.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">13</span><div className="flex-1"><p>The spice trade maintained its economic importance during the 19th century.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p>Which paragraph contains the following information? Write the correct letter, <strong>A-F</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">14</span><div className="flex-1"><p>reference to research showing the beneficial effects of oxytocin on people</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">15</span><div className="flex-1"><p>reasons why the effects of oxytocin are complex</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">16</span><div className="flex-1"><p>mention of a period in which oxytocin attracted little scientific attention</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">17</span><div className="flex-1"><p>reference to people ignoring certain aspects of their research data</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-20</h3><p>Look at the following research findings and the list of researchers below. Match each research finding with the correct researcher, <strong>A-F</strong>.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Researchers</h4><p><strong>A</strong> Markus Heinrichs</p><p><strong>B</strong> Simone Shamay-Tsoory</p><p><strong>C</strong> Jennifer Bartz</p><p><strong>D</strong> Carolyn DeClerck</p><p><strong>E</strong> Carsten De Dreu</p><p><strong>F</strong> Sue Carter</p></div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">18</span><div className="flex-1"><p>People are more trusting when affected by oxytocin.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">19</span><div className="flex-1"><p>Oxytocin increases people’s feelings of jealousy.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">20</span><div className="flex-1"><p>The effect of oxytocin varies from one type of person to another.</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21-26</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                        <h4 className="font-semibold text-center mb-4">Oxytocin research</h4>
                        <p>The earliest findings about oxytocin and bonding came from research involving <strong>21</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting}/>. It was also discovered that humans produce oxytocin during birth and when feeding their young. An experiment in 2005, in which participants were given either oxytocin or a <strong>22</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, reinforced the belief that the hormone had a positive effect. However, later research suggests that this is not always the case. A study at the University of Haifa where participants took part in a competitive <strong>23</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting}/> revealed the negative emotions which oxytocin can trigger. A study at the University of Antwerp showed people’s lack of willingness to help <strong>24</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting}/> while under the influence of oxytocin. Meanwhile, research at the University of Amsterdam revealed that people who have been given oxytocin consider their own group of <strong>25</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting}/> to be superior to others.</p>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p>Choose the correct letter, <strong>A, B, C</strong> or <strong>D</strong>.</p>
                    <div className="space-y-6">
                        <div className="space-y-3"><p><span className="font-semibold">27</span> In the first paragraph, the writer says that most managers</p><div className="ml-6 space-y-2">{['A', 'B', 'C', 'D'].map(option => (<label key={`27-${option}`} className="flex items-start space-x-2 cursor-pointer"><input type="radio" name="question-27" value={option} checked={answers['27'] === option} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} className="mt-1 text-blue-600"/><span className={`text-sm ${getAnswerStatus('27') === 'correct' && answers['27'] === option ? 'text-green-700 font-medium' : getAnswerStatus('27') === 'incorrect' && answers['27'] === option ? 'text-red-700 font-medium' : ''}`}><strong>{option}</strong> {option === 'A' ? 'fail to spot the key consumer trends of the moment.' : option === 'B' ? 'make the mistake of focusing only on the principal consumer trends.' : option === 'C' ? 'misinterpret market research data relating to current consumer trends.' : 'are unaware of the significant impact that trends can have on consumers\' lives.'}</span></label>))}</div></div>
                        <div className="space-y-3"><p><span className="font-semibold">28</span> According to the third paragraph, Coach was anxious to</p><div className="ml-6 space-y-2">{['A', 'B', 'C', 'D'].map(option => (<label key={`28-${option}`} className="flex items-start space-x-2 cursor-pointer"><input type="radio" name="question-28" value={option} checked={answers['28'] === option} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} className="mt-1 text-blue-600"/><span className={`text-sm ${getAnswerStatus('28') === 'correct' && answers['28'] === option ? 'text-green-700 font-medium' : getAnswerStatus('28') === 'incorrect' && answers['28'] === option ? 'text-red-700 font-medium' : ''}`}><strong>{option}</strong> {option === 'A' ? 'follow what some of its competitors were doing.' : option === 'B' ? 'maintain its prices throughout its range.' : option === 'C' ? 'safeguard its reputation as a manufacturer of luxury goods.' : 'modify the entire look of its brand to suit the economic climate.'}</span></label>))}</div></div>
                        <div className="space-y-3"><p><span className="font-semibold">29</span> What point is made about Tesco's Greener Living programme?</p><div className="ml-6 space-y-2">{['A', 'B', 'C', 'D'].map(option => (<label key={`29-${option}`} className="flex items-start space-x-2 cursor-pointer"><input type="radio" name="question-29" value={option} checked={answers['29'] === option} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} className="mt-1 text-blue-600"/><span className={`text-sm ${getAnswerStatus('29') === 'correct' && answers['29'] === option ? 'text-green-700 font-medium' : getAnswerStatus('29') === 'incorrect' && answers['29'] === option ? 'text-red-700 font-medium' : ''}`}><strong>{option}</strong> {option === 'A' ? 'It did not require Tesco to modify its core business activities.' : option === 'B' ? 'It succeeded in attracting a more eco-conscious clientele.' : option === 'C' ? 'Its main aim was to raise consumers\' awareness of environmental issues.' : 'It was not the first time that Tesco had implemented such an initiative.'}</span></label>))}</div></div>
                        <div className="space-y-3"><p><span className="font-semibold">30</span> What does the writer suggest about Nike's strategy?</p><div className="ml-6 space-y-2">{['A', 'B', 'C', 'D'].map(option => (<label key={`30-${option}`} className="flex items-start space-x-2 cursor-pointer"><input type="radio" name="question-30" value={option} checked={answers['30'] === option} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} className="mt-1 text-blue-600"/><span className={`text-sm ${getAnswerStatus('30') === 'correct' && answers['30'] === option ? 'text-green-700 font-medium' : getAnswerStatus('30') === 'incorrect' && answers['30'] === option ? 'text-red-700 font-medium' : ''}`}><strong>{option}</strong> {option === 'A' ? 'It was an extremely risky strategy at the time.' : option === 'B' ? 'It was a strategy that a less established company could afford to follow.' : option === 'C' ? 'It was the type of strategy that would not have been possible in the past.' : 'It was the type of strategy which might appear to have few obvious benefits.'}</span></label>))}</div></div>
                        <div className="space-y-3"><p><span className="font-semibold">31</span> What was original about the ME2?</p><div className="ml-6 space-y-2">{['A', 'B', 'C', 'D'].map(option => (<label key={`31-${option}`} className="flex items-start space-x-2 cursor-pointer"><input type="radio" name="question-31" value={option} checked={answers['31'] === option} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className="mt-1 text-blue-600"/><span className={`text-sm ${getAnswerStatus('31') === 'correct' && answers['31'] === option ? 'text-green-700 font-medium' : getAnswerStatus('31') === 'incorrect' && answers['31'] === option ? 'text-red-700 font-medium' : ''}`}><strong>{option}</strong> {option === 'A' ? 'It contained technology that had been developed for the sports industry.' : option === 'B' ? 'It appealed to young people who were keen to improve their physical fitness.' : option === 'C' ? 'It took advantage of a current trend for video games with colourful 3D graphics.' : 'It was a handheld game that addressed people\'s concerns about unhealthy lifestyles.'}</span></label>))}</div></div>
                    </div>
                  </div>

                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-37</h3><p>Look at the following statements and the list of companies below. Match each statement with the correct company, <strong>A, B, C</strong> or <strong>D</strong>.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of companies</h4><p><strong>A</strong> Coach</p><p><strong>B</strong> Tesco</p><p><strong>C</strong> Nike</p><p><strong>D</strong> iToys</p></div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">32</span><p>It turned the notion that its products could have harmful effects to its own advantage.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">33</span><p>It extended its offering by collaborating with another manufacturer.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">34</span><p>It implemented an incentive scheme to demonstrate its corporate social responsibility.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">35</span><p>It discovered that customers had a positive attitude towards dealing with difficult circumstances.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">36</span><p>It responded to a growing lifestyle trend in an unrelated product sector.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">37</span><p>It successfully avoided having to charge its customers less for its core products.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38-40</h3><p>Complete each sentence with the correct ending, <strong>A, B, C</strong> or <strong>D</strong> below.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>A</strong> employ a combination of strategies to maintain your consumer base.</p><p><strong>B</strong> identify the most appropriate innovation strategy to use.</p><p><strong>C</strong> emphasise your brand’s traditional values with the counteract-and-reaffirm strategy.</p><p><strong>D</strong> use the combine-and-transcend strategy to integrate the two worlds.</p></div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">38</span><p>If there are any trend-related changes impacting on your category, you should ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">39</span><p>If a current trend highlights a negative aspect of your category, you should ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">40</span><p>If the consumers’ new focus has an increasing lack of connection with your offering, you should ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        
        {submitted && (
            <Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4">
                <div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div>
                <div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div>
                <div className="flex justify-center space-x-4 mt-6">
                    <Button onClick={handleReset} variant="outline">Try Again</Button>
                    <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button>
                </div></div></CardContent>
            </Card>
        )}

        {showAnswers && (
            <Card className="mt-8"><CardHeader><CardTitle>Answer Key</CardTitle></CardHeader><CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(correctAnswers).map(([q, a]) => (<div key={q} className="flex justify-between p-2 bg-gray-50 rounded"><span className="font-semibold">{q}:</span><span className="text-gray-800">{a}</span></div>))}
                </div>
            </CardContent></Card>
        )}

        {showResultsPopup && (
            <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
                <div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div></div></div>
                <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map(qNum => {const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{answers[qNum] || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswers[qNum]}</span></div></div></div>);})}</div></div>
                <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
            </div></div>
        )}
        
        <PageViewTracker 
          book={BOOK} 
          module="reading" 
          testNumber={TEST_NUMBER} 
        />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <TestStatistics book={BOOK} module="reading" testNumber={TEST_NUMBER} />
            <UserTestHistory book={BOOK} module="reading" testNumber={TEST_NUMBER} />
          </div>
        </div>
      </div>
    </div>
  );
}