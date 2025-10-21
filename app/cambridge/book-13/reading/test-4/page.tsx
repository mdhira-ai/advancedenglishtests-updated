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

export default function Book13ReadingTest4() {
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
  const TEST_NUMBER = 4;

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
    '1': 'FALSE', '2': 'FALSE', '3': 'TRUE', '4': 'TRUE', '5': 'FALSE',
    '6': 'TRUE', '7': 'NOT GIVEN', '8': 'TRUE', '9': 'wool', '10': 'navigator',
    '11': 'gale', '12': 'training', '13': 'fire', '14': 'minerals', '15': 'carbon',
    '16': 'water', '17': 'agriculture', '18': 'C', '19': 'E', '20': 'A', '21': 'D',
    '22': 'E', '23': 'C', '24': 'F', '25': 'G', '26': 'F', '27': 'D', '28': 'A',
    '29': 'B', '30': 'F', '31': 'B', '32': 'G', '33': 'E', '34': 'A', '35': 'YES',
    '36': 'NOT GIVEN', '37': 'NO', '38': 'NOT GIVEN', '39': 'YES', '40': 'NO'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 13 - Reading Test 4</h1>
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
                  <h3 className="font-semibold text-center">Cutty Sark: the fastest sailing ship of all time</h3>

                  <p>The nineteenth century was a period of great technological development in Britain, and for shipping the major changes were from wind to steam power, and from wood to iron and steel.</p>

<p>The fastest commercial sailing vessels of all time were clippers, three-masted ships built to transport goods around the world, although some also took passengers. From the 1840s until 1869, when the Suez Canal opened and steam propulsion was replacing sail, clippers dominated world trade. Although many were built, only one has survived more or less intact: Cutty Sark, now on display in Greenwich, southeast London.</p>

<p>Cutty Sark's unusual name comes from the poem <i>Tam O'Shanter</i> by the Scottish poet Robert Burns. Tam, a farmer, is chased by a witch called Nannie, who is wearing a 'cutty sark' – an old Scottish name for a short nightdress. The witch is depicted in Cutty Sark's figurehead – the carving of a woman typically at the front of old sailing ships. In legend, and in Burns's poem, witches cannot cross water, so this was a rather strange choice of name for a ship.</p>

<p>Cutty Sark was built in Dumbarton, Scotland, in 1869, for a shipping company owned by John Willis. To carry out construction, Willis chose a very small shipbuilding firm, Scott & Linton, and ensured that the contract with them put him in a very strong position. In the end, the firm was forced out of business, and the ship was finished by a competitor.</p>

<p>Willis's company was active in the tea trade between China and Britain, where speed could bring shipowners both profits and prestige. The Cutty Sark was designed to make the journey more quickly than any other ship. On her maiden voyage, in 1870, she set sail from London, carrying large amounts of goods to China. She returned laden with tea, making the journey back to London in four months. However, Cutty Sark never lived up to the high expectations of her owner, as a result of bad winds and various misfortunes. On one occasion, in 1872, the ship and a rival clipper, Thermopylae, left port in China on the same day. Crossing the Indian Ocean, Cutty Sark gained a lead of over 400 miles, but then her rudder was severely damaged in stormy seas, making her impossible to steer. The ship's crew had the daunting task of repairing the rudder at sea, and only succeeded at the second attempt. Cutty Sark reached London a week after Thermopylae.</p>

<p>Steam ships posed a growing threat to clippers, as their speed and cargo capacity increased. In addition, the opening of the Suez Canal in 1869, the same year that Cutty Sark was launched, had a serious impact. While steam ships could make use of the quicker, direct route between the Mediterranean and the Red Sea, the canal was of no use to sailing ships, which needed the much stronger winds of the oceans, and so had to sail a far greater distance. Steam ships reduced the journey time between Britain and China by approximately two months.</p>

<p>By 1878, tea traders weren't interested in Cutty Sark, and instead, she took on the much less prestigious work of carrying any cargo between any two ports in the world. In 1880, violence aboard the ship led ultimately to the replacement of the captain with an incompetent drunkard who stole the crew's wages. He was suspended from service, and a new captain appointed. This marked a turnaround and the beginning of the most successful period in Cutty Sark's working life, transporting wool from Australia to Britain. One such journey took just under 12 weeks, beating every other ship sailing that year by around a month.</p>

<p>The ship's next captain, Richard Woodget, was an excellent navigator, who got the best out of both his ship and his crew. As a sailing ship, Cutty Sark depended on the strong trade winds of the southern hemisphere, and Woodget took her further south than any previous captain, bringing her dangerously close to icebergs off the southern tip of South America. His gamble paid off, though, and the ship was the fastest vessel in the wool trade for ten years.</p>

<p>As competition from steam ships increased in the 1890s, and Cutty Sark approached the end of her life expectancy, she became less profitable. She was sold to a Portuguese firm, which renamed her Ferreira. For the next 25 years, she again carried miscellaneous cargoes around the world.</p>

<p>Badly damaged in a gale in 1922, she was put into Falmouth harbour in southwest England, for repairs. Wilfred Dowman, a retired sea captain who owned a training vessel, recognised her and tried to buy her, but without success. She returned to Portugal and was sold to another Portuguese company. Dowman was determined, however, and offered a high price: this was accepted, and the ship returned to Falmouth the following year and had her original name restored.</p>

<p>Dowman used Cutty Sark as a training ship, and she continued in this role after his death. When she was no longer required, in 1954, she was transferred to dry dock at Greenwich to go on public display. The ship suffered from fire in 2007, and again, less seriously, in 2014, but now Cutty Sark attracts a quarter of a million visitors a year.</p>

                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">SAVING THE SOIL</h3>
                  <p><b>A</b> More than a third of the Earth’s top layer is at risk. Is there hope for our planet’s most precious resource? A recent UN report warns that the world’s soil is in poor health. If we don’t slow the decline, all farmable soil could be gone in 60 years. Since soil grows 95% of our food, and sustains human life in other more surprising ways, that is a huge problem.</p>
                  <p><b>B</b> Peter Groffman, from the Cary Institute of Ecosystem Studies in New York, points out that scientists have been warning about the degradation of the world’s soil for decades. At the same time, our understanding of its importance to humans has grown. A single gram of healthy soil might contain 100 million bacteria, as well as other microorganisms such as viruses and fungi, living amid decomposing plants and various minerals. That means soils do not just grow our food, but are also the source of nearly all our existing antibiotics, and could be our great hope in the fight against antibiotic-resistant bacteria. Soil is also an ally against climate change: as microorganisms within soil digest dead animals and plants, they lock in their carbon content, holding three times the amount of carbon as does the entire atmosphere. Soils also store water, preventing flood damage: in the UK, damage to buildings, roads and bridges from floods caused by soil degradation costs £233 million every year.</p>
                  <p><b>C</b> If the soil loses its ability to perform these functions, the human race could be in big trouble. The danger is not that the soil will disappear completely, but that the microorganisms that give it its special properties will be lost. And once this has happened, it may take the soil thousands of years to recover. Agriculture is by far the biggest problem. In the wild, when plants grow they remove nutrients from the soil, but then when the plants die and decay these nutrients are returned directly to the soil. Humans tend not to return unused parts of harvested crops directly to the soil to enrich it, meaning that the soil gradually becomes less fertile. In the past we developed strategies to get around the problem, such as regularly varying the types of crops grown, or leaving fields uncultivated for a season.</p>
                  <p><b>D</b> But these practices became uneconomical as populations grew and agriculture had to be run on more commercial lines. A solution came in the early 20th century with the Haber-Bosch process for manufacturing ammonium nitrate. Farmers have been putting this synthetic fertiliser on their fields ever since. But over the past few decades, it has become clear this wasn't such a bright idea. Chemical fertilisers can release polluting nitrous oxide into the atmosphere and excess is often washed away with the rain, releasing nitrogen into rivers. More recently, we have found that indiscriminate use of fertilisers hurts the soil itself, turning it acidic and salty, and degrading the soil they are supposed to nourish.</p>
                  <p><b>E</b> One of the people looking for a solution to this problem is Pius Floris, who started out running a tree-care business in the Netherlands, and now advises some of the world's top soil scientists. He came to realise that the best way to ensure his trees flourished was to take care of the soil, and has developed a cocktail of beneficial bacteria, fungi and humus* to do this. Researchers at the University of Valladolid in Spain recently used this cocktail on soils destroyed by years of fertiliser overuse. When they applied Floris's mix to the desert-like test plots, a good crop of plants emerged that were not just healthy at the surface, but had roots strong enough to pierce dirt as hard as rock. The few plants that grew in the control plots, fed with traditional fertilisers, were small and weak.</p>
                  <p><b>F</b> However, measures like this are not enough to solve the global soil degradation problem. To assess our options on a global scale we first need an accurate picture of what types of soil are out there, and the problems they face. That’s not easy. For one thing, there is no agreed international system for classifying soil. In an attempt to unify the different approaches, the UN has created the Global Soil Map project. Researchers from nine countries are working together to create a map linked to a database that can be fed measurements from field surveys, drone surveys, satellite imagery, lab analyses and so on to provide real-time data on the state of the soil. Within the next four years, they aim to have mapped soils worldwide to a depth of 100 metres, with the results freely accessible to all.</p>
                  <p><b>G</b> But this is only a first step. We need ways of presenting the problem that bring it home to governments and the wider public, says Pamela Chasek at the International Institute for Sustainable Development, in Winnipeg, Canada. 'Most scientists don't speak language that policy-makers can understand, and vice versa.' Chasek and her colleagues have proposed a goal of 'zero net land degradation'. Like the idea of carbon neutrality, it is an easily understood target that can help shape expectations and encourage action.
For soils on the brink, that may be too late. Several researchers are agitating for the immediate creation of protected zones for endangered soils. One difficulty here is defining what these areas should conserve: areas where the greatest soil diversity is present? Or areas of unspoilt soils that could act as a future benchmark of quality?
Whatever we do, if we want our soils to survive, we need to take action now.
                <br/><small>* humus: the part of the soil formed from dead plant material</small></p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">Book Review: The Happiness Industry by William Davies</h3>
                   <p>'Happiness is the ultimate goal because it is self-evidently good. If we are asked why happiness matters we can give no further external reason. It just obviously does matter.' This pronouncement by Richard Layard, an economist and advocate of 'positive psychology', summarises the beliefs of many people today. For Layard and others like him, it is obvious that the purpose of government is to promote a state of collective well-being. The only question is how to achieve it, and here positive psychology – a supposed science that not only identifies what makes people happy but also allows their happiness to be measured – can show the way. Equipped with this science, they say, governments can secure happiness in society in a way they never could in the past.</p>

    <p>It is an astonishingly crude and simple-minded way of thinking, and for that very reason increasingly popular. Those who think in this way are oblivious to the vast philosophical literature in which the meaning and value of happiness have been explored and questioned, and write as if nothing of any importance had been thought on the subject until it occurred to their attention. It was the philosopher Jeremy Bentham (1748–1832) who was more than anyone else responsible for the development of this way of thinking. For Bentham it was obvious that the human good consists of pleasure and the absence of pain. The Greek philosopher Aristotle may have identified happiness with self-realisation in the 4th century BC, and thinkers throughout the ages may have struggled to reconcile the pursuit of happiness with other human values, but for Bentham all this was mere metaphysics or fiction. Without knowing anything much of him or the school of moral theory he established – since they are by education and intellectual conviction illiterate in the history of ideas – our advocates of positive psychology follow in his tracks in rejecting as outmoded and irrelevant pretty much the entirety of ethical reflection on human happiness to date.</p>

    <p>But as William Davies notes in his recent book <em>The Happiness Industry</em>, the view that happiness is the only self-evidently good is actually a way of limiting moral inquiry. One of the virtues of this timely and arresting book is that it places the current cult of happiness in a well-defined historical framework. Rightly, Davies begins his story with Bentham, noting that he was far more than a philosopher. Davies writes, 'Bentham's activities were those which we might now associate with a public sector management consultant'. In the 1790s, he wrote to the Home Office suggesting that the departments of government be linked together through a set of 'conversation tubes', and to the Bank of England with a design for a printing device that could produce</p>

    <p>unforgeable banknotes. He drew up plans for a 'frigidarium' to keep provisions such as meat, fish, fruit and vegetables fresh. His celebrated design for a prison to be known as a 'Panopticon', in which prisoners would be kept in solitary confinement while being visible at all times to the guards, was very nearly adopted. (Surprisingly, Davies does not discuss the fact that Bentham meant his Panopticon not just as a model prison but also as an instrument of control that could be applied to schools and factories.)</p>

    <p>Bentham was also a pioneer of the 'science of happiness'. If happiness is to be regarded as a science, it has to be measured, and Bentham suggested two ways in which this might be done. Viewing happiness as a complex of pleasurable sensations, he suggested that it might be quantified by measuring the human pulse rate. Alternatively, money could be used as the standard for quantification: if two different goods have the same price, it can be claimed that they produce the same quantity of pleasure in the consumer. Bentham was more attracted by the latter measure. By associating money so closely with inner experience, Davies writes, Bentham 'set the stage for the entangling of psychological research and capitalism that would shape the business practices of the twentieth century'.</p>

    <p><em>The Happiness Industry</em> describes how the project of a science of happiness has become integral to capitalism. We learn much that is interesting about how economic problems are being redefined and treated as psychological maladies. In addition, Davies shows how the belief that inner states of pleasure and displeasure can be objectively measured has informed management studies and advertising. The tendency of thinkers such as J B Watson, the founder of behaviourism, was that human beings could be shaped, or manipulated, by toymakers and managers. Watson had no factual basis for his view of human nature. When he became president of the American Psychological Association in 1915, he 'had never even studied a single human being'; his research had been confined to experiments on white rats. Yet Watson's reductive model is now widely applied, with 'behaviour change' becoming the goal of governments; in Britain, a 'Behaviour Insights Team' has been established by the government to study how people can be encouraged, at minimum cost to the public purse, to live in what are considered to be socially desirable ways.</p>

    <p>Modern industrial societies appear to need the possibility of ever-increasing happiness to motivate them in their labours. But whatever its intellectual pedigree, the idea that governments should be responsible for promoting happiness is always a threat to human freedom.
 <br/><small>* behaviourism: a branch of psychology which is concerned with observable behaviour</small></p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">1</span><div className="flex-1"><p>Clippers were originally intended to be used as passenger ships.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">2</span><div className="flex-1"><p>The Cutty Sark was given the name of a character in a poem.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">3</span><div className="flex-1"><p>The contract between John Willis and Scott & Linton favoured Willis.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">4</span><div className="flex-1"><p>John Willis wanted Cutty Sark to be the fastest tea clipper travelling between the UK and China.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">5</span><div className="flex-1"><p>Despite storm damage, Cutty Sark beat Thermopylae back to London.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">6</span><div className="flex-1"><p>The opening of the Suez Canal meant that steam ships could travel between Britain and China faster than clippers.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">7</span><div className="flex-1"><p>Steam ships sometimes used the ocean route to travel between London and China.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">8</span><div className="flex-1"><p>Captain Woodget put Cutty Sark at risk of hitting an iceberg.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p>Complete the sentences below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">9</span><div className="flex-1"><p>After 1880, Cutty Sark carried <Input className="inline-block w-32 ml-1" value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting}/> as its main cargo during its most successful time.</p></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">10</span><div className="flex-1"><p>As a captain and <Input className="inline-block w-32 ml-1" value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, Woodget was very skilled.</p></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">11</span><div className="flex-1"><p>Ferreira went to Falmouth to repair damage that a <Input className="inline-block w-32 ml-1" value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting}/> had caused.</p></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">12</span><div className="flex-1"><p>Between 1923 and 1954, Cutty Sark was used for <Input className="inline-block w-32 ml-1" value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting}/>.</p></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">13</span><div className="flex-1"><p>Cutty Sark has twice been damaged by <Input className="inline-block w-32 ml-1" value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting}/> in the 21st century.</p></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p>Complete the summary below. Write <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold text-center mb-4">Why soil degradation could be a disaster for humans</h4>
                        <p>Healthy soil contains a large variety of bacteria and other microorganisms, as well as plant remains and <strong>14</strong> <Input className="inline-block w-32 ml-1" value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting}/>. It provides us with food and also with antibiotics, and its function in storing <strong>15</strong> <Input className="inline-block w-32 ml-1" value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting}/> has a significant effect on the climate. In addition, it prevents damage to property and infrastructure because it holds <strong>16</strong> <Input className="inline-block w-32 ml-1" value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting}/>. If these microorganisms are lost, soil may lose its special properties. The main factor contributing to soil degradation is the <strong>17</strong> <Input className="inline-block w-32 ml-1" value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting}/> carried out by humans.</p>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-21</h3><p>Complete each sentence with the correct ending, <strong>A-F</strong>, below.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Endings</h4><p><strong>A</strong> may improve the number and quality of plants growing there.</p><p><strong>B</strong> may contain data from up to nine countries.</p><p><strong>C</strong> may not be put back into the soil.</p><p><strong>D</strong> may help governments to be more aware of soil-related issues.</p><p><strong>E</strong> may cause damage to different aspects of the environment.</p><p><strong>F</strong> may be better for use at a global level.</p></div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">18</span><p>Nutrients contained in the unused parts of harvested crops</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">19</span><p>Synthetic fertilisers produced with the Haber-Bosch process</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">20</span><p>Addition of a mixture developed by Pius Floris to the soil</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">21</span><p>The idea of zero net soil degradation</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 22-26</h3><p>Which paragraph contains the following information? Write the correct letter, <strong>A-G</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">22</span><div className="flex-1"><p>a reference to one person’s motivation for a soil-improvement project</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">23</span><div className="flex-1"><p>an explanation of how soil stayed healthy before the development of farming</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">24</span><div className="flex-1"><p>examples of different ways of collecting information on soil degradation</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">25</span><div className="flex-1"><p>a suggestion for a way of keeping some types of soil safe in the near future</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">26</span><div className="flex-1"><p>a reason why it is difficult to provide an overview of soil degradation</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-29</h3><p>Choose the correct letter, <strong>A, B, C</strong> or <strong>D</strong>.</p>
                    <div className="space-y-4">
                        <div className="space-y-2"><p><span className="font-semibold">27</span> What is the reviewer’s attitude to advocates of positive psychology?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> They are wrong to reject the ideas of Bentham.</p><p><strong>B</strong> They are misguided in their patriotic values.</p><p><strong>C</strong> They have a fresh new approach to ideas on human happiness.</p><p><strong>D</strong> They are ignorant about the ideas they should be considering.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="space-y-2"><p><span className="font-semibold">28</span> The reviewer refers to the Greek philosopher Aristotle in order to suggest that happiness</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> may not be just pleasure and the absence of pain.</p><p><strong>B</strong> should not be the main goal of humans.</p><p><strong>C</strong> is not something that should be fought for.</p><p><strong>D</strong> is not just an abstract concept.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="space-y-2"><p><span className="font-semibold">29</span> According to Davies, Bentham’s suggestion for linking the price of goods to happiness was significant because</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> it was the first successful way of assessing happiness.</p><p><strong>B</strong> it established a connection between work and psychology.</p><p><strong>C</strong> it was the first successful example of psychological research.</p><p><strong>D</strong> it involved consideration of the rights of consumers.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 30-34</h3><p>Complete the summary using the list of words, <strong>A-G</strong>, below.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">Jeremy Bentham</h4>
                        <p>Jeremy Bentham was active in other areas besides philosophy. In the 1790s he suggested a type of technology to improve <strong>30</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting}/> for different Government departments. He developed a new way of printing banknotes to increase <strong>31</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting}/> and also designed a method for the <strong>32</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting}/> of food. He also drew up plans for a prison which allowed the <strong>33</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting}/> of prisoners at all times, and believed the same design could be used for other institutions as well. When researching happiness, he investigated possibilities for its <strong>34</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, and suggested some methods of doing this.</p>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-sm"><p><strong>A</strong> measurement</p><p><strong>B</strong> security</p><p><strong>C</strong> implementation</p><p><strong>D</strong> profits</p><p><strong>E</strong> observation</p><p><strong>F</strong> communication</p><p><strong>G</strong> preservation</p></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 35-40</h3><p>Do the following statements agree with the claims of the writer? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">35</span><div className="flex-1"><p>One strength of The Happiness Industry is its discussion of the relationship between psychology and economics.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">36</span><div className="flex-1"><p>It is more difficult to measure some emotions than others.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">37</span><div className="flex-1"><p>Watson’s ideas on behaviourism were supported by research on humans he carried out before 1915.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">38</span><div className="flex-1"><p>Watson’s ideas have been most influential on governments outside America.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">39</span><div className="flex-1"><p>The need for happiness is linked to industrialisation.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">40</span><div className="flex-1"><p>A main aim of government should be to increase the happiness of the population.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
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