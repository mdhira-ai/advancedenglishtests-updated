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

export default function Book2ReadingTest1() {
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
    '1': 'ix', '2': 'iii', '3': 'viii', '4': 'i', '5': 'vi', '6': 'compressed', '7': '(tiny) droplets', '8': 'ice crystals',
    '9': 'depth', '10': 'temperature humidity', '11': 'energy', '12': 'insulation', '13': 'aircraft',
    '14': 'C', '15': 'A', '16': 'F', '17': 'B', '18': 'E', '19': 'NOT GIVEN', '20': 'TRUE', '21': 'TRUE', '22': 'NOT GIVEN', '23': 'FALSE',
    '24': 'C', '25': 'B', '26': 'D',
    '27': 'E', '28': 'G', '29': 'D', '30': 'H', '31': 'A', '32': 'C',
    '33': 'YES', '34': 'NOT GIVEN', '35': 'NO', '36': 'NOT GIVEN', '37': 'YES',
    '38': 'E', '39': 'F', '40': 'C'
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge Ielts Test Plus 2 - Reading Test 1</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Snow-makers</h3>
                  <p>Skiing is big business nowadays. But what can ski resort owners do if the snow doesn't come?</p>
                  <p><strong>A</strong> In the early to mid twentieth century, with the growing popularity of skiing, ski slopes became extremely profitable businesses. But ski resort owners were completely dependent on the weather; if it didn't snow, or didn't snow enough, they had to close everything down. Fortunately, a device called the snow gun can now provide snow whenever it is needed. These days such machines are standard equipment in the vast majority of ski resorts around the world, making it possible for many resorts to stay open four months or more a year.</p>
                  <p><strong>B</strong> Snow formed by natural weather systems comes from water vapour in the atmosphere. The water vapour condenses into droplets, forming clouds. If the temperature is sufficiently low, the water droplets freeze into tiny ice crystals. More water particles then condense onto the crystal and join with it to form a snowflake. As the snowflake grows heavier, it falls towards the Earth.</p>
                  <p><strong>C</strong> The snow gun works very differently from a natural weather system, but it accomplishes exactly the same thing. The device basically works by combining water and air. Two different hoses are attached to the gun, one leading from a water pumping station which pumps water up from a lake or reservoir, and the other leading from an air compressor. When the compressed air passes through the hose into the gun, it atomises the water — that is, it disrupts the stream so that the water splits up into tiny droplets. The droplets are then blown out of the gun and if the outside temperature is below 0°C, ice crystals will form, and will then make snowflakes in the same way as natural snow.</p>
                  <p><strong>D</strong> Snow-makers often talk about dry snow and wet snow. Dry snow has a relatively low amount of water, so it is very light and powdery. This type of snow is excellent for skiing because skis glide over it easily without getting stuck in wet slush. One of the advantages of using a snow-maker is that this powdery snow can be produced to give the ski slopes a level surface. However, on slopes which receive heavy use, resort owners also use denser, wet snow underneath the dry snow. Many resorts build up the snow depth this way once or twice a year, and then regularly coat the trails with a layer of dry snow throughout the winter.</p>
                  <p><strong>E</strong> The wetness of snow is dependent on the temperature and humidity outside, as well as the size of the water droplets launched by the gun. Snow-makers have to adjust the proportions of water and air in their snow guns to get the perfect snow consistency for the outdoor weather conditions. Many ski slopes now do this with a central computer system that is connected to weather-reading stations all over the slope.</p>
                  <p><strong>F</strong> But man-made snow makes heavy demands on the environment. It takes about 275,000 litres of water to create a blanket of snow covering a 60 x 60 metre area. Most resorts pump water from one or more reservoirs located in low-lying areas. The run-off water from the slopes feeds back into these reservoirs, so the resort can actually use the same water over and over again. However, considerable amounts of energy are needed to run the large air-compressing pumps, and the diesel engines which run them also cause air pollution.</p>
                  <p><strong>G</strong> Because of the expense of making snow, ski resorts have to balance the cost of running the machines with the benefits of extending the ski season, making sure they only make snow when it is really needed, and when it will bring the maximum amount of profit in return for the investment. But man-made snow has a number of other uses as well. A layer of snow keeps a lot of the Earth's heat from escaping into the atmosphere, so farmers often use man-made snow to provide insulation for winter crops. Snow-making machines have played a big part in many movie productions. Movie producers often take several months to shoot scenes that cover just a few days. If the movie takes place in a snowy setting, the set decorators have to get the right amount of snow for each day of shooting either by adding man-made snow or melting natural snow. And another important application of man-made snow is its use in the tests that aircraft must undergo in order to ensure that they can function safely in extreme conditions.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Why are so few tigers man-eaters?</h3>
                  <p><strong>A</strong> As you leave the Bandhavgarh National Park in central India, there is a notice which shows a huge, placid tiger. The notice says, 'You may not have seen me, but I have seen you.' There are more than a billion people in India and Indian tigers probably see humans every single day of their lives. Tigers can and do kill almost anything they meet in the jungle - they will even attack elephants and rhino. Surely, then, it is a little strange that attacks on humans are not more frequent.</p>
                  <p><strong>B</strong> Some people might argue that these attacks were in fact common in the past. British writers in adventure stories, such as Jim Corbett, gave the impression that village life in India in the early years of the twentieth century involved a state of constant siege by man-eating tigers. But they may have overstated the terror spread by tigers. There were also far more tigers around in those days (probably 60,000 in the subcontinent, compared to just 3000 today). So in proportion, attacks appear to have been as rare then as they are today.</p>
                  <p><strong>C</strong> It is widely assumed that the constraint is fear; but what exactly are tigers afraid of? Can they really know that we may be even better armed than they are? Surely not. Has the species programmed the experiences of all tigers with humans into its genes to be inherited as instinct? Perhaps. But I think the explanation may be more simple and, in a way, more intriguing.</p>
                  <p><strong>D</strong> Since the growth of ethology¹ in the 1950s, we have tried to understand animal behaviour from the animal's point of view. Until the first elegant experiments by pioneers in the field, such as Konrad Lorenz, naturalists wrote about animals as if they were slightly less intelligent humans. Jim Corbett's breathless accounts of his duels with man-eaters in truth tell us more about Jim Corbett than they do about the animals. He does, however, give a clue to the way animals see us. On the one hand, the principle of ethology is to think in the same way as the animal we are studying thinks, and to observe every tiny detail of its behaviour without imposing our own human significances on its actions.</p>
                  <p><strong>E</strong> I suspect that a tiger's fear of humans lies not in some preprogrammed ancestral logic but in the way he actually perceives us visually. If you try to think like a tiger, a human in a car might appear just to be part of the car, and because tigers don't eat cars the human is safe - unless the car is menacing the tiger or its cubs, in which case a brave or enraged tiger may charge. A human on foot is a different sort of puzzle. Imagine a tiger sees a man who is 1.8m tall. A tiger sees less than 1m tall and he may be up to 3m long from head to tail. So when a tiger sees the face on, it might not be unreasonable for him to assume that the man is much longer for his size. he might attack the animal by leaping on its back, but when he looks behind the man, he can't see a back. From the front the man is huge, but looked at from the side he all but disappears. This must be very disconcerting. A hunter has to be confident that it can tackle its prey, and if the prey is new and yet somehow invisible is correct, the opposite should be true of a squatting human. A squatting human is half the size and presents twice the spread of back, and more closely resembles a medium-sized deer. If tigers were simply frightened of all humans, then a squatting person would be no more attractive as a target than a standing one. This, however, appears not to be the case. Many incidents of attacks on people involve villagers squatting or bending over to cut grass, for fodder or building material.</p>
                  <p><strong>F</strong> If the theory that a tiger is disconcerted to find that a standing human is both very big and yet somehow invisible is correct, the opposite may explain why lions - particularly young lionesses who tend to encourage one another to take risks - are more dangerous than tigers.</p>
                  <p><strong>G</strong> The fact that humans stand upright may therefore not just be something that distinguishes them from nearly all other species, but also a factor that helped them to survive in a dangerous and unpredictable environment.</p>
                  <p>¹ ethology – the branch of zoology that studies the behaviour of animals in their natural habitats</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Keep taking the tablets</h3>
                  <p><em>The history of aspirin is a product of a rollercoaster ride through time, of accidental discoveries, intuitive reasoning and intense corporate rivalry</em></p>
                  <p>In the opening pages of Aspirin: The Remarkable Story of a Wonder Drug, Diarmuid Jeffreys describes this little white pill as ‘one of the most amazing creations in medical history, a drug so astonishingly versatile that it can relieve headache, ease your aching limbs, lower your temperature and treat some of the deadliest human diseases’.</p>
                  <p>Its properties have been known for thousands of years. Ancient Egyptian physicians used extracts from the willow tree as an analgesic, or pain killer. Centuries later the Greek physician Hippocrates recommended the bark of the willow tree as a remedy for the pains of childbirth and as a fever reducer. But it wasn't until the eighteenth and nineteenth centuries that salicylates - the chemical found in the willow tree - became the subject of serious scientific investigation. The race was on to identify the active ingredient and to replicate it synthetically. At the end of the nineteenth century a German company, Friedrich Bayer & Co, succeeded in creating acetylsalicylic acid, which was renamed aspirin.</p>
                  <p>The late nineteenth century was a fertile period for experimentation, partly because of the hunger among scientists to answer some of the great scientific questions, but also because those questions were within their means to answer. One scientist in a laboratory with some chemicals and a test tube could make significant breakthroughs, whereas today, in order to map the human genome for instance, one needs 'an army of researchers, a bank of computers and millions and millions of dollars'.</p>
                  <p>But an understanding of the nature of science and scientific inquiry is not enough. In its own to explain how society innovates. In the nineteenth century, scientific advance was closely linked to the industrial revolution. This was a period when people frequently had the means, motive and opportunity to take an idea and turn it into reality. In the case of aspirin that happened piecemeal - a series of minor, often unrelated advances, fertilised by the century's broader economic, medical and scientific developments, that led to the one big final breakthrough.</p>
                  <p>The link between big money and pharmaceutical innovation is also a significant one. Aspirin's continued shelf life was ensured because for the first 70 years of its life, huge amounts of money were put into promoting it as an ordinary everyday analgesic. In the 1970s other analgesics, such as ibuprofen and paracetamol, were entering the market, and the pharmaceutical companies then focused on publicising these new drugs. But just at the same time, discoveries were made regarding the beneficial role of aspirin in preventing heart attacks, strokes and other afflictions. Had it not been for these findings, this pharmaceutical marvel may well have disappeared.</p>
                  <p>So the relationship between big money and drugs is an odd one. Commercial markets are necessary for developing new products and ensuring that they remain around long enough for scientists to carry out research on them. But the commercial markets are just as likely to kill off certain products when something more attractive comes along. In the case of aspirin, a potential 'wonder drug' was around for over 70 years without anybody investigating the way in which it achieved its effects, because they were making more than enough money out of it as it was. If ibuprofen or paracetamol had entered the market a decade earlier, aspirin might then not be here today. It would be just another forgotten drug that people hadn't bothered to explore.</p>
                  <p>None of the recent discoveries of aspirin's benefits were made by the big pharmaceutical companies; they were made by scientists working in the public sector. 'The reason for that is very simple and straightforward,' Jeffreys says in his book. 'Drug companies will only pursue research that is going to deliver financial benefits. There's no profit in aspirin any more. It is incredibly inexpensive, with tiny profit margins and it has no patent any more, so anyone can produce it.' In fact, there is almost a disincentive for drug companies to further boost the drug, he argues, as it could possibly put them out of business by stopping them from selling their more expensive brands.</p>
                  <p>So what is the solution to a lack of commercial interest in further exploring the therapeutic benefits of aspirin? More public money going into clinical trials, says Jeffreys. 'If I were the Department of Health, I would say "this is a very inexpensive drug. There may be a lot of other things we could do with it." We should put a lot more money into trying to find out.'</p>
              <p>Jeffreys’ book – which not only tells the tale of a ‘wonder drug’ but also explores the nature of innovation and the role of big business, public money and regulation – reminds us why such research is so important.</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-5</h3><p>Reading Passage 1 has seven paragraphs A-G. Choose the correct heading for each paragraph from the list of headings below. Write the correct number (i-x) in boxes 1-5 on your answer sheet.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                      <h4 className="font-bold">List of headings</h4>
                      <p>i Considering ecological costs</p>
                      <p>ii Modifications to the design of the snow gun</p>
                      <p>iii The need for different varieties of snow</p>
                      <p>iv Local concern over environmental issues</p>
                      <p>v A problem and a solution</p>
                      <p>vi Applications beyond the ski slopes</p>
                      <p>vii Converting wet snow to dry snow</p>
                      <p>viii New method for calculating modifications</p>
                      <p>ix Artificial process, natural product</p>
                      <p>x Snow formation in nature</p>
                  </div>
                  <div className="space-y-4">
                      <p><strong>1</strong> Paragraph C</p><Input className={`max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} />
                      <p><strong>2</strong> Paragraph D</p><Input className={`max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} />
                      <p><strong>3</strong> Paragraph E</p><Input className={`max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} />
                      <p><strong>4</strong> Paragraph F</p><Input className={`max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} />
                      <p><strong>5</strong> Paragraph G</p><Input className={`max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6-8</h3><p>Label the diagram below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>
<img src="/img/ielts/cambridge-plus/plus2/reading/test1/snow-maker-diagram.png" alt="Snow Maker Diagram" className="w-full mb-4" />
<p><strong>6</strong> <Input className={`inline-block w-40 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} /> air</p>
                  <p><strong>7</strong> water is atomised into <Input className={`inline-block w-40 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /></p>
                  <p><strong>8</strong> <Input className={`inline-block w-40 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} /> are formed</p>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p>Complete the sentences below. Choose <strong>NO MORE THAN THREE WORDS</strong> from the passage for each answer.</p>
                  <div className="space-y-4">
                      <p><strong>9</strong> Dry snow is used to give slopes a level surface, while wet snow is used to increase the <Input className={`inline-block w-48 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} /> on busy slopes.</p>
                      <p><strong>10</strong> To calculate the required snow consistency, the <Input className={`inline-block w-48 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} /> and <Input className={`inline-block w-48 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10b'] || ''} onChange={(e) => handleAnswerChange('10b', e.target.value)} /> of the atmosphere must first be measured.</p>
                      <p><strong>11</strong> The machinery used in the process of making the snow consumes a lot of <Input className={`inline-block w-48 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} />, which is damaging to the environment.</p>
                      <p><strong>12</strong> Artificial snow is used in agriculture as a type of <Input className={`inline-block w-48 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} /> for plants in cold conditions.</p>
                      <p><strong>13</strong> Artificial snow may also be used in carrying out safety checks on <Input className={`inline-block w-48 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} />.</p>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p>Reading Passage 2 has seven paragraphs labelled A-G. Which paragraph contains the following information?</p>
                  <div className="space-y-4">
                      <p><strong>14</strong> a rejected explanation of why tiger attacks on humans are rare</p><Input className={`max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} />
                      <p><strong>15</strong> a reason why tiger attacks on humans might be expected to happen more often than they do</p><Input className={`max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} />
                      <p><strong>16</strong> examples of situations in which humans are more likely to be attacked by tigers</p><Input className={`max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} />
                      <p><strong>17</strong> a claim about the relative frequency of tiger attacks on humans</p><Input className={`max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />
                      <p><strong>18</strong> an explanation of tiger behaviour based on the principles of ethology</p><Input className={`max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-23</h3><p>Do the following statements agree with the information given in Reading Passage 2? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>19</strong> Tigers in the Bandhavgarh National Park are a protected species.</p><Input className={`max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />
                      <p><strong>20</strong> Some writers of fiction have exaggerated the danger of tigers to man.</p><Input className={`max-w-[150px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} />
                      <p><strong>21</strong> The fear of humans may be passed down in a tiger's genes.</p><Input className={`max-w-[150px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} />
                      <p><strong>22</strong> Konrad Lorenz claimed that some animals are more intelligent than humans.</p><Input className={`max-w-[150px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} />
                      <p><strong>23</strong> Ethology involves applying principles of human behaviour to animals.</p><Input className={`max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p>Choose the correct answer, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>24</strong> Why do tigers rarely attack people in cars?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> They have learned that cars are not dangerous.</p><p><strong>B</strong> They realise that people in cars cannot be harmed.</p><p><strong>C</strong> They do not think people in cars are living creatures.</p><p><strong>D</strong> They do not want to put their cubs at risk.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /></div>
                      <div><p><strong>25</strong> The writer says that tigers rarely attack a man who is standing up because</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> they are afraid of the man's height.</p><p><strong>B</strong> they are confused by the man's shape.</p><p><strong>C</strong> they are puzzled by the man's lack of movement.</p><p><strong>D</strong> they are unable to look at the man directly.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /></div>
                      <div><p><strong>26</strong> A human is more vulnerable to tiger attack when squatting because</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> he may be unaware of the tiger's approach.</p><p><strong>B</strong> he cannot easily move his head to see behind him.</p><p><strong>C</strong> his head becomes a better target for the tiger.</p><p><strong>D</strong> his back appears longer in relation to his height.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} /></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p>Complete each sentence with the correct ending A-H from the box below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                      <p><strong>A</strong> the discovery of new medical applications.</p>
                      <p><strong>B</strong> the negative effects of publicity.</p>
                      <p><strong>C</strong> the large pharmaceutical companies.</p>
                      <p><strong>D</strong> the industrial revolution.</p>
                      <p><strong>E</strong> the medical uses of a particular tree.</p>
                      <p><strong>F</strong> the limited availability of new drugs.</p>
                      <p><strong>G</strong> the chemical found in the willow tree.</p>
                      <p><strong>H</strong> commercial advertising campaigns.</p>
                  </div>
                  <div className="space-y-4">
                      <p><strong>27</strong> Ancient Egyptian and Greek doctors were aware of</p><Input className={`max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} />
                      <p><strong>28</strong> Frederick Bayer & Co were able to reproduce</p><Input className={`max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} />
                      <p><strong>29</strong> The development of aspirin was partly due to the effects of</p><Input className={`max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> The creation of a market for aspirin as a painkiller was achieved through</p><Input className={`max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> Aspirin might have become unavailable without</p><Input className={`max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                      <p><strong>32</strong> The way in which aspirin actually worked was not investigated by</p><Input className={`max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-37</h3><p>Do the following statements agree with the views of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>33</strong> For nineteenth-century scientists, small-scale research was enough to make important discoveries.</p><Input className={`max-w-[150px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />
                      <p><strong>34</strong> The nineteenth-century industrial revolution caused a change in the focus of scientific research.</p><Input className={`max-w-[150px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} />
                      <p><strong>35</strong> The development of aspirin in the nineteenth century followed a structured pattern of development.</p><Input className={`max-w-[150px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} />
                      <p><strong>36</strong> In the 1970s sales of new analgesic drugs overtook sales of aspirin.</p><Input className={`max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />
                      <p><strong>37</strong> Commercial companies may have both good and bad effects on the availability of pharmaceutical products.</p><Input className={`max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38-40</h3><p>Complete the summary below using the list of words A-I below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                      <p><strong>A</strong> useful, <strong>B</strong> cheap, <strong>C</strong> state, <strong>D</strong> international, <strong>E</strong> major drug companies, <strong>F</strong> profitable, <strong>G</strong> commercial, <strong>H</strong> public sector scientists, <strong>I</strong> health officials</p>
                  </div>
                  <p>Jeffreys argues that the reason why <strong>38</strong> <Input className={`inline-block w-48 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> did not find out about new uses of aspirin is that aspirin is no longer a <strong>39</strong> <Input className={`inline-block w-48 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /> drug. He therefore suggests that there should be <strong>40</strong> <Input className={`inline-block w-48 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /> support for further research into the possible applications of the drug.</p>
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
            testNumber={1} 
          />
          <TestStatistics 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={1} 
          />
          <UserTestHistory 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={1}
          />
        </div>
      </div>
    </div>
  )
}