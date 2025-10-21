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

export default function Book13ReadingTest3() {
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
  const TEST_NUMBER = 3;

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
    '1': 'furniture', '2': 'sugar', '3': 'ropes', '4': 'charcoal', '5': 'bowls',
    '6': 'hormones', '7': 'cosmetics', '8': 'dynamite', '9': 'FALSE', '10': 'FALSE',
    '11': 'NOT GIVEN', '12': 'TRUE', '13': 'NOT GIVEN', '14': 'B', '15': 'C', '16': 'A',
    '17': 'B', '18': 'recording devices', '19': 'fathers / dads', '20': 'bridge hypothesis', '21': 'repertoire',
    '22': '(audio-recording) vests', '23': 'vocabulary', '24': 'F', '25': 'A', '26': 'E',
    '27': 'C', '28': 'H', '29': 'A', '30': 'B', '31': 'D', '32': 'shells', '33': 'lake',
    '34': 'rainfall', '35': 'grains', '36': 'pottery', '37': 'B', '38': 'A', '39': 'D', '40': 'A'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 13 - Reading Test 3</h1>
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
                  <h3 className="font-semibold text-center">The coconut palm</h3>
                  <p>For millennia, the coconut has been central to the lives of Polynesian and Asian peoples. In the western world, on the other hand, coconuts have always been exotic and unusual, sometimes rare. The Italian merchant traveller Marco Polo apparently saw coconuts in South Asia in the late 13th century, and among the mid-14th-century travel writings of Sir John Mandeville there is mention of ‘great nuts of India’. Today, images of palm-fringed tropical beaches are clichés in the west to sell holidays, chocolate bars, fizzy drinks and even romance.</p>
                  <p>Typically, we imagine coconuts as brown, cannonball-like objects that, when opened, provide sweet white flesh. But we see only part of the fruit and none of the plant from which they come. The coconut palm has a smooth, slender, grey trunk, up to 30 metres tall. This is an important source of timber for building houses, and is increasingly being used as a replacement for endangered hardwoods in the furniture construction industry. The trunk is surmounted by a rosette of leaves, each of which may be up to six metres long. The leaves have hard veins in their centres which, in many parts of the world, are used as brushes after the green part of the leaf has been stripped away. Immature coconut flowers are tightly clustered together among the leaves at the top of the trunk. The flower stems may be tapped for their sap to produce a drink, and the sap can also be reduced by boiling to produce a type of sugar used for cooking.</p>
                  <p>Coconut palms produce as many as seventy fruits per year, weighing more than a kilogram each. The wall of the fruit has three layers: a waterproof outer layer, a fibrous middle layer and a hard, inner layer. The thick fibrous middle layer produces coconut fibre, ‘coir’, which has numerous uses and is particularly important in manufacturing ropes. The woody innermost layer, the shell, with its three prominent ‘eyes’, surrounds the seed. An important product obtained from the shell is charcoal, which is widely used in various industries as well as in the home as a cooking fuel. When broken in half, the shells are also used as bowls in many parts of Asia.</p>
                  <p>Inside the shell are the nutrients (endosperm) needed by the developing seed. Initially, the endosperm is a sweetish liquid, coconut water, which is enjoyed as a drink, but also provides the hormones which encourage other plants to grow roots and shoots. As the fruit matures, the coconut water gradually solidifies to form the brilliant white, fat-rich, edible flesh or meat. Dried coconut flesh, ‘copra’, is made into coconut oil and coconut milk, which are widely used in cooking in different parts of the world, as well as in cosmetics. A derivative of coconut fat, glycerine, acquired strategic importance in a quite different sphere, as Alfred Nobel introduced the world to his nitroglycerine-based invention: dynamite.</p>
                  <p>Their biology would appear to make coconuts the great maritime voyagers and coastal colonisers of the plant world. The large, energy-rich fruits are able to float in water and tolerate salt, but cannot remain viable indefinitely; studies suggest after about 110 days at sea they are no longer able to germinate. Literally cast onto desert island shores, with little more than sand to grow in and exposed to the full glare of the tropical sun, coconut seeds are able to germinate and root. The air pocket in the seed, created as the endosperm solidifies, contributes to the seed’s buoyancy. In addition, the fibrous fruit wall is waterproof and helps the seed to float during the voyage, and also protects the seed from damage when it is washed ashore.</p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">How baby talk gives infant brains a boost</h3>
                  <p><b>A</b> The typical way of talking to a baby – high-pitched, exaggerated and repetitious – is a source of fascination for linguists who hope to understand how ‘baby talk’ impacts on learning. Most babies start developing their hearing while still in the womb, prompting some hopeful parents to play classical music to their pregnant bellies. Some research even suggests that infants are listening to adult speech as early as 10 weeks before being born, gathering the basic building blocks of their family’s native tongue.</p>
                  <p><b>B</b> Early language exposure seems to have benefits to the brain – for instance, studies suggest that babies raised in bilingual homes are better at learning how to mentally prioritize information. So how does the sweet, singsong language of baby talk also known as ‘infant-directed speech’ influence a baby’s development? Here are some recent studies that explore the science behind baby talk.</p>
                  <p><b>C</b> Fathers don't use baby talk as often or in the same ways as mothers – and that's perfectly OK, according to a new study. Mark VanDam of Washington State University at Spokane and colleagues equipped parents with recording devices and speech-recognition software to study the way they interacted with their youngsters during a normal day. 'We found that moms do exactly what you'd expect and what's been described many times over,' VanDam explains. 'But we found that dads aren't doing the same thing. Dads didn't raise their pitch or fundamental frequency when they talked to kids.' Their role may be rooted in what is called the bridge hypothesis, which dates back to 1975. It suggests that fathers use less familiar language to provide their children with a bridge to the kind of speech they'll hear in public. 'The idea is that a kid gets to practice a certain kind of speech with mom and another kind of speech with dad, so the kid then has a wider repertoire of kinds of speech to practice,' says VanDam.</p>
                  <p><b>D</b> Scientists from the University of Washington and the University of Connecticut collected thousands of 30-second conversations between parents and their babies, fitting 26 children with audio-recording vests that captured language and sound during a typical eight-hour day. The study found that the more baby talk parents used, the more their youngsters began to babble. And when researchers saw the same babies at age two, they found that frequent baby talk had dramatically boosted vocabulary, regardless of socioeconomic status. 'Those children who listened to a lot of baby talk were talking more than the babies that listened to more. adult talk or standard speech,' says Nairán Ramírez-Esparza of the University of Connecticut. 'We also found that it really matters whether you use baby talk in a one-on-one context,' she adds. 'The more parents use baby talk one-on-one, the more babies babble, and the more they babble, the more words they produce later in life.</p>
                  <p><b>E</b> Another study suggests that parents might want to pair their youngsters up so they can babble more with their own kind. Researchers from McGill University and Université du Québec à Montréal found that babies seem to like listening to each other rather than to adults – which may be why baby talk is such a universal tool among parents. They played repeating vowel sounds made by a special synthesizing device that mimicked sounds made by either an adult woman or another baby. This way, only the impact of the auditory cues was observed. The team then measured how long each type of sound held the infants' attention. They found that the 'infant' sounds held babies' attention nearly 40 percent longer. The baby noises also induced more reactions in the listening infants, like smiling or lip moving, which approximates sound making. The team theorizes that this attraction to other infant sounds could help launch the learning process that leads to speech. 'It may be some property of the sound that is just drawing their attention,' says study co-author Linda Polka. 'Or maybe they are really interested in that particular type of sound because they are starting to focus on their own ability to make sounds. We are speculating here but it might catch their attention because they recognize it as a sound they could possibly make.'</p>
                  <p><b>F</b> In a study published in Proceedings of the National Academy of Sciences, a total of 57 babies from two slightly different age groups – seven months and eleven and a half months – were played a number of syllables from both their native language (English) and a non-native tongue (Spanish). The infants were placed in a brain-activation scanner that recorded activity in a brain region known to guide the motor movements that produce speech. The results suggest that listening to baby talk prompts infant brains to start practicing their language skills. 'Finding activation in motor areas of the brain when infants are simply listening is significant, because it means the baby brain is engaged in trying to talk back right from the start, and suggests that seven-month-olds' brains are already trying to figure out how to make the right movements that will produce words,' says co-author Patricia Kuhl. Another interesting finding was that while the seven-month-olds responded to all speech sounds regardless of language, the brains of the older infants worked harder at the motor activations of non-native sounds compared to native sounds. The study may have also uncovered a process by which babies recognize differences between their native language and other tongues."RetryClaude can make mistakes. Please double-check responses.</p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">Whatever happened to the Harappan Civilisation?</h3>
                  <p><b>A</b> The Harappan Civilisation of ancient Pakistan and India flourished 5,000 years ago, but a thousand years later their cities were abandoned. The Harappan Civilisation was a sophisticated Bronze Age society who built ‘megacities’ and traded internationally in luxury craft products, and yet seems to have left almost no depictions of themselves. But their lack of self-imagery – at a time when the Egyptians were carving realistic portraits of themselves – is only part of the mystery.</p>
                  <p><b>B</b> ‘There is plenty of archaeological evidence to tell us about the rise of the Harappan Civilisation, but relatively little about its fall,’ explains archaeologist Dr Cameron Petrie of the University of Cambridge. As populations increased, cities were built that had great baths, craft workshops, palaces and halls laid out in distinct sectors. Houses were arranged in blocks, with wide main streets and narrow alleyways, and many had their own wells and drainage systems. It was very much a ‘thriving’ civilisation. Then around 2100 BC, a transformation began. Streets went uncleaned, buildings started to be abandoned, and ritual structures fell out of use. After their final demise, a millennium passed before really large-scale cities appeared once more in South Asia.</p>
                  <p><b>C</b> Some have claimed that major glacier-fed rivers changed their course, dramatically affecting the water supply and agriculture; or that the cities could not cope with an increasing population, they exhausted their resource base, the trading economy broke down or they succumbed to invasion and conflict; and yet others that climate change caused an environmental change that affected food and water provision. 'It is unlikely that there was a single cause for the decline of the civilisation. But the fact is, until now, we have had little solid evidence from the area for most of the key elements,' said Petrie. 'A lot of the archaeological debate has really only been well-argued speculation.</p>
                  <p><b>D</b> A research team led by Petrie, together with Dr Ravindanath Singh of Banaras Hindu University in India, found early in their investigations that the archaeological sites were not where they were supposed to be, completely altering understanding of the way that this region was inhabited in the past. When they carried out a survey of how the larger area was settled in relation to sources of water, they found inaccuracies in the published geographic locations of ancient settlements ranging from several hundred metres to many kilometres. They realised that any attempt to use the existing data were likely to be fundamentally flawed. Over the course of several seasons of fieldwork they carried out new surveys, finding 198 settlement sites that were previously unknown.</p>
                  <p><b>E</b> Now, research published by Dr Yama Dixit and Professor David Hodell, both from Cambridge’s Department of Earth Sciences, has provided the first definitive evidence for climate change affecting the plains of north-western India, where hundreds of Harappan sites are known to have been situated. The researchers gathered shells of Melanoides tuberculata snails from the sediments of an ancient lake and used geochemical analysis as a means of tracing the climate history of the region. As today, the major source of water into the lake is likely to have been the summer monsoon,’ says Dixit. ‘But we have observed that there was an abrupt change about 4,100 years ago, when the amount of evaporation from the lake exceeded the rainfall – indicative of a drought.’ Hodell adds: ‘We estimate that the weakening of the Indian summer monsoon climate lasted about 200 years before recovering to the previous conditions, which we still see today.’</p>
                  <p><b>F</b> It has long been thought that other great Bronze Age civilisations also declined at a similar time, with a global-scale climate event being seen as the cause. While it is possible that these local-scale processes were linked, the real archaeological interest lies in understanding the impact of these larger-scale events on different environments and different populations. Considering the vast area of the Harappan Civilisation, it is essential that we obtain more climate data from areas close to the two great cities at Mohenjo-daro and Harappa and also from the Indian Punjab.</p>
                  <p><b>G</b> Petrie and Singh’s team is now examining archaeological records and trying to understand details of how people led their lives in the region five millennia ago. They are analysing grains cultivated at the time, and trying to work out whether they were growing the same types of crops in all areas, and how these crop patterns changed. They are also looking at whether the types of pottery used, and other aspects of their material culture, were distinctive to specific regions or were more similar across large areas. This gives us insight into the types of interactive networks that the population was involved in, and whether those changed.</p>
                  <p><b>H</b> Petrie believes that archaeologists are in a unique position to investigate how past societies responded to environmental and climatic change. ‘By investigating responses to environmental pressures and threats, we can learn from the past to engage with public, and—the relevant governmental and administrative bodies to be more productive in issues such as the management and administration of water supply, the balance of urban and rural development, and the importance of preserving cultural heritage in the future.’</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p>Complete the table below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <table className="w-full border-collapse border border-gray-300 my-4">
                        <thead><tr><th className="border p-2 bg-gray-100" colSpan={3}>THE COCONUT PALM</th></tr></thead>
                        <tbody>
                            <tr><td className="border p-2 font-semibold">Part</td><td className="border p-2 font-semibold">Description</td><td className="border p-2 font-semibold">Uses</td></tr>
                            <tr><td className="border p-2">trunk</td><td className="border p-2">up to 30 metres</td><td className="border p-2">for timber and the making of <strong>1</strong> <Input className="inline-block w-24 ml-1" value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting}/></td></tr>
                            <tr><td className="border p-2">leaves</td><td className="border p-2">up to 6 metres long</td><td className="border p-2">to make brushes</td></tr>
                            <tr><td className="border p-2">flowers</td><td className="border p-2">at the top of the trunk</td><td className="border p-2">stems provide sap, used as a drink or a source of <strong>2</strong> <Input className="inline-block w-24 ml-1" value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting}/></td></tr>
                            <tr><td className="border p-2" rowSpan={4}>fruits</td><td className="border p-2">outer layer</td><td className="border p-2"></td></tr>
                            <tr><td className="border p-2">middle layer (coir fibres)</td><td className="border p-2">used for <strong>3</strong> <Input className="inline-block w-24 ml-1" value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, etc.</td></tr>
                            <tr><td className="border p-2">inner layer (shell)</td><td className="border p-2">a source of <strong>4</strong> <Input className="inline-block w-24 ml-1" value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting}/>; (when halved) for <strong>5</strong> <Input className="inline-block w-24 ml-1" value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting}/></td></tr>
                            <tr><td className="border p-2">coconut water</td><td className="border p-2">a drink; a source of <strong>6</strong> <Input className="inline-block w-24 ml-1" value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting}/> for other plants</td></tr>
                            <tr><td className="border p-2"></td><td className="border p-2">coconut flesh</td><td className="border p-2">oil and milk for cooking and <strong>7</strong> <Input className="inline-block w-24 ml-1" value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting}/>; glycerine (an ingredient in <strong>8</strong> <Input className="inline-block w-24 ml-1" value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting}/>)</td></tr>
                        </tbody>
                    </table>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">9</span><div className="flex-1"><p>Coconut seeds need shade in order to germinate.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">10</span><div className="flex-1"><p>Coconuts were probably transported to Asia from America in the 16th century.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">11</span><div className="flex-1"><p>Coconuts found on the west coast of America were a different type from those found on the east coast.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">12</span><div className="flex-1"><p>All the coconuts found in Asia are cultivated varieties.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">13</span><div className="flex-1"><p>Coconuts are cultivated in different ways in America and the Pacific.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-17</h3><p>Look at the following ideas and the list of researchers below. Match each idea with the correct researcher, <strong>A, B</strong> or <strong>C</strong>.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Researchers</h4><p><strong>A</strong> Mark VanDam</p><p><strong>B</strong> Linda Polka</p><p><strong>C</strong> Patricia Kuhl</p></div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">14</span><div className="flex-1"><p>the importance of adults giving babies individual attention when talking to them</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">15</span><div className="flex-1"><p>the connection between what babies hear and their own efforts to create speech</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">16</span><div className="flex-1"><p>the advantage for the baby of having two parents each speaking in a different way</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">17</span><div className="flex-1"><p>the connection between the amount of baby talk babies hear and how much vocalising they do themselves</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18-23</h3><p>Complete the summary below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold text-center mb-4">Research into how parents talk to babies</h4>
                        <p>Researchers at Washington State University used <strong>18</strong> <Input className="inline-block w-40 ml-1" value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, together with specialised computer programs, to analyse how parents interacted with their babies during a normal day. The study revealed that <strong>19</strong> <Input className="inline-block w-40 ml-1" value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting}/> tended not to modify their ordinary speech patterns when interacting with their babies. According to an idea known as the <strong>20</strong> <Input className="inline-block w-40 ml-1" value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, they may use a more adult type of speech to prepare infants for the language they will hear outside the family home. According to the researchers, hearing baby talk from one parent and 'normal' language from the other expands the baby's <strong>21</strong> <Input className="inline-block w-40 ml-1" value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting}/> of types of speech which they can practise.</p>
                        <p>Meanwhile, another study carried out by scientists from the University of Washington and the University of Connecticut recorded speech and sound using special <strong>22</strong> <Input className="inline-block w-40 ml-1" value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting}/> that the babies were equipped with. When they studied the babies again at age two, they found that those who had heard a lot of baby talk in infancy had a much larger <strong>23</strong> <Input className="inline-block w-40 ml-1" value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting}/> than those who had not.</p>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p>Which paragraph contains the following information?</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">24</span><div className="flex-1"><p>a reference to a change which occurs in babies’ brain activity before the end of their first year</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">25</span><div className="flex-1"><p>an example of what some parents do for their baby’s benefit before birth</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">26</span><div className="flex-1"><p>a mention of babies’ preference for the sounds that other babies make</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p>Which paragraph contains the following information? Write the correct letter, <strong>A-H</strong>.</p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">27</span><div className="flex-1"><p>proposed explanations for the decline of the Harappan Civilisation</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">28</span><div className="flex-1"><p>reference to a present-day application of some archaeological research findings</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">29</span><div className="flex-1"><p>a difference between the Harappan Civilisation and another culture of the same period</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">30</span><div className="flex-1"><p>a description of some features of Harappan urban design</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">31</span><div className="flex-1"><p>reference to the discovery of errors made by previous archaeologists</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-36</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold text-center mb-4">Looking at evidence of climate change</h4>
                        <p>Yama Dixit and David Hodell have found the first definitive evidence of climate change affecting the plains of north-western India thousands of years ago. By collecting the <strong>32</strong> <Input className="inline-block w-24 ml-1" value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting}/> of snails and analysing them, they discovered evidence of a change in water levels in a <strong>33</strong> <Input className="inline-block w-24 ml-1" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting}/> in the region. This occurred when there was less <strong>34</strong> <Input className="inline-block w-24 ml-1" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting}/> than evaporation, and suggests that there was an extended period of drought.</p>
                        <p>Petrie and Singh’s team are using archaeological <strong>35</strong> <Input className="inline-block w-24 ml-1" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting}/> to look at five millennia ago, in order to know whether people had adapted their agricultural practices to changing climatic conditions. They are also examining objects including <strong>36</strong> <Input className="inline-block w-24 ml-1" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting}/>, so as to find out about links between inhabitants of different parts of the region and whether these changed over time.</p>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p>Look at the following statements and the list of researchers below. Match each statement with the correct researcher, <strong>A, B, C</strong> or <strong>D</strong>.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Researchers</h4><p><strong>A</strong> Cameron Petrie</p><p><strong>B</strong> Ravindanath Singh</p><p><strong>C</strong> Yama Dixit</p><p><strong>D</strong> David Hodell</p></div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">37</span><p>Finding further information about changes to environmental conditions in the region is vital.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">38</span><p>Examining previous patterns of behaviour may have long-term benefits.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">39</span><p>Rough calculations indicate the approximate length of a period of water shortage.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">40</span><p>Information about the decline of the Harappan Civilisation has been lacking.</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
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