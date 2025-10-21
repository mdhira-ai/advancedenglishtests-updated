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

export default function Book15ReadingTest4() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
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

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    
    if (questionNumber === '7') {
      const userAnswers = new Set((answers['7'] || '').split(',').map(s => s.trim().toLowerCase()));
      const correctAnswersSet = new Set(['leaves', 'bark']);
      if (userAnswers.size !== 2) return false;
      return userAnswers.has('leaves') && userAnswers.has('bark');
    }

    if (!user) return false;
    // Ensure correct is a string when calling checkAnswerWithMatching
    const correctStr = Array.isArray(correct) ? correct.join(' or ') : correct;
    return checkAnswerWithMatching(user, correctStr, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&')) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, results: Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      // Save test score using test-score-saver
      const result = await saveTestScore({
        book: 'book-15',
        module: 'reading',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      }, session);
      
      if (!result.success) {
        console.error('Failed to save test score:', result.error);
      } else {
        console.log('Test score saved successfully');
      }
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
    '1': 'water', '2': 'diet', '3': 'drought', '4': 'erosion', '5': 'desert', '6': '(its/huarango/the) branches', '7': ['leaves', 'bark'], '8': '(its/huarango/the) trunk', '9': 'NOT GIVEN', '10': 'FALSE', '11': 'TRUE', '12': 'FALSE', '13': 'NOT GIVEN',
    '14': 'NOT GIVEN', '15': 'FALSE', '16': 'TRUE', '17': 'FALSE', '18': 'FALSE', '19': 'TRUE', '20': 'words', '21': 'finger', '22': 'direction', '23': 'commands', '24': 'fires', '25': 'technology', '26': 'award',
    '27': 'D', '28': 'E', '29': 'H', '30': 'B', '31': 'I', '32': 'C', '33': 'B', '34': 'B', '35': 'YES', '36': 'NOT GIVEN', '37': 'NO', '38': 'YES', '39': 'NOT GIVEN', '40': 'B'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-15" module="reading" testNumber={4} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 15 - Reading Test 4</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">The return of the huarango</h3>
                  <p className="text-center italic">The arid valleys of southern Peru are welcoming the return of a native plant</p>
                  <p>The south coast of Peru is a narrow, 2,000-kilometre-long strip of desert squeezed between the Andes and the Pacific Ocean. It is also one of the most fragile ecosystems on Earth. It hardly ever rains there, and the only year-round source of water is located tens of metres below the surface. This is why the huarango tree is so suited to life there: it has the longest roots of any tree in the world. They stretch down 50–80 metres and, as well as sucking up water for the tree, they bring it into the higher subsoil, creating a water source for other plant life.</p>
                  <p>Dr David Beresford-Jones, an archaeologist at Cambridge University, has been studying the role of the huarango tree in landscape change in the Lower Ica Valley in southern Peru. He believes the huarango was key to the ancient people’s diet and, because it could reach deep water sources, it allowed local people to withstand years of drought when their other crops failed. But over the centuries huarango trees were gradually replaced with crops. Cutting down native woodland leads to erosion, as there is nothing to keep the soil in place. So when the huarangos go, the land turns into a desert. Nothing grows at all in the Lower Ica Valley now.</p>
                  <p>For centuries the huarango tree was vital to the people of the neighbouring Middle Ica Valley too. They grew vegetables under it and the products made from its seed pods. Its leaves and bark were used for herbal remedies, while its branches were used for charcoal for cooking and heating, and its trunk was used to build houses. But now it is disappearing rapidly. The majority of the huarango forests in the valley have already been cleared for fuel and agriculture – initially, these were smallholdings, but now they’re huge farms producing crops for international markets.</p>
                  <p>‘Of the forests that were here 1,000 years ago, 99 per cent have already gone,’ says botanist Oliver Whaley from Kew Gardens in London, who, together with ethnobotanist Dr William Milliken, is running a pioneering project to protect and restore the rapidly disappearing habitat. In order to succeed, Whaley needs to get the local people on board, and that has meant overcoming local prejudices. ‘Increasingly aspirational communities think that if you plant food trees in your home or street, it shows you are poor and you can’t afford to grow your own food,’ he says. In order to stop the Middle Ica Valley going the same way as the Lower Ica Valley, Whaley is encouraging locals to love the huarangos again. ‘It’s a process of cultural re-education,’ he says. He has already set up a huarango festival to reinstate a sense of pride in their eco-heritage, and has helped local schoolchildren plant thousands of trees.</p>
                  <p>‘In order to get people interested in habitat restoration, you need to plant a tree that is useful to them,’ says Whaley. So, he has been working with local families to attempt to create a sustainable income from the huarangos by turning their products into foodstuffs. ‘Boil up the beans and you get this thick brown syrup like molasses. You can also use it in drinks, soups or stews.’ The pods can be ground into flour to make cakes, and the seeds roasted into a sweet, chocolatey ‘coffee’. ‘It’s packed full of vitamins and minerals,’ Whaley says.</p>
                  <p>And some farmers are already planting huarangos. Alberto Benevides, owner of Ica Valley’s only certified organic farm, which Whaley helped set up, has been planting the tree for 13 years. He produces syrup and flour, and sells these products at an organic farmers’ market in Lima. His farm is relatively small and doesn’t yet provide him with enough to live on, but he hopes this will change. ‘The organic market is growing rapidly in Peru,’ Benevides says. ‘I am investing in the future.’</p>
                  <p>But even if Whaley can convince the local people to fall in love with the huarango again, there is still the threat of the larger farms. Some of these cut across the forests and break up the corridors that allow the essential movement of mammals, birds and pollen up and down the narrow forest strip. In the hope of countering this, he is persuading farmers to let him plant forest corridors on their land. He believes the extra woodland will also benefit the farms by reducing their water usage through a lowering of evaporation and providing a refuge for bio-control insects.</p>
                  <p>‘If we can record biodiversity and see how it all works, then we’re in a good position to move on from there. Desert habitats can reduce down to very little,’ Whaley explains. ‘It’s not like a rainforest that needs to have this huge expanse. Life has always been confined to corridors and islands here. If you just have a few trees left, the population can grow up quickly because it’s used to exploiting water when it arrives.’ He sees his project as a model that has the potential to be rolled out across other arid areas around the world. ‘If we can do it here, in the most fragile system on Earth, then that’s a real message of hope for lots of places, including Africa, where there is drought and they just can’t afford to wait for rain.’</p>
              </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <h3 className="text-center font-bold">Silbo Gomero – the whistle ‘language’ of the Canary Islands</h3>
                     <p>La Gomera is one of the Canary Islands situated in the Atlantic Ocean off the northwest coast of Africa. This small volcanic island is mountainous, with steep rocky slopes and deep, wooded ravines, rising to 1,487 metres at its highest peak. It is also home to the best known of the world’s whistle ‘languages’, a means of transmitting information over long distances which is perfectly adapted to the extreme terrain of the island.</p>
                     <p>This ‘language’, known as ‘Silbo Gomero’ – from the Spanish word for ‘whistle’ – is now shedding light on the language-processing abilities of the human brain, according to scientists. Researchers say that Silbo activates parts of the brain normally associated with spoken language, suggesting that the brain is remarkably flexible in its ability to interpret sounds as language.</p>
                     <p>‘Science has developed the idea of brain areas that are dedicated to language, and we are starting to understand the scope of signals that can be recognised as language,’ says David Corina, a co-author of a recent study and associate professor of psychology at the University of Washington in Seattle.</p>
                     <p>Silbo is a substitute for Spanish, with individual words recoded into whistles which have high- and low-frequency tones. A whistler, or silbador, puts a finger in his or her mouth to increase the whistle’s pitch, while the other hand can be cupped to adjust the direction of the sound. ‘There is much more ambiguity in the whistled signal than in the spoken signal,’ explains lead researcher Manuel Carreiras, a psychology professor at the University of La Laguna in the Canary Islands. Whistled ‘words’ can be hard to distinguish, but silbadores rely on repetition, as well as awareness of context, to make themselves understood.</p>
                     <p>The silbadores of Gomera are traditionally shepherds and other isolated mountain folk, and their novel means of staying in touch allows them to communicate over distances of up to 10 kilometres. Carreiras explains that silbadores are able to pass a surprising amount of information via their whistles. ‘In daily life they use whistles to communicate short commands, but any Spanish sentence could be whistled.’ Silbo has proved particularly useful when fires have occurred on the island and rapid communication across large areas has been vital.</p>
                     <p>The study team used neuroimaging equipment to contrast the brain activity of silbadores while listening to whistled and spoken Spanish. Results showed the left temporal lobe of the brain, which is usually associated with spoken language, was engaged during the processing of Silbo. The researchers found that other key regions in the brain’s frontal lobe also responded to the whistles. The researchers found that when silbadores were listening to spoken Spanish, the same brain areas were activated, but to a lesser degree. When the experiments were repeated with non-whistlers, however, activation was observed in all areas of the brain.</p>
                     <p>‘Our results provide more evidence about the flexibility of human capacity for language in a variety of forms,’ Corina says. ‘These data suggest that left-hemisphere language regions are uniquely adapted for communicative purposes, independent of the modality of the signal. The non-silbadores were not recognising Silbo as a language. They had nothing to grab onto, so multiple areas of their brains were activated.’</p>
                     <p>Carreiras says the origins of Silbo Gomero remain obscure, but that whistled languages were once common in the Canary Islands. The islanders were of North African origin, and it is thought that some of the first people to inhabit the islands, the Guanches, already had a whistled language. Whistled languages survive today in Papua New Guinea, Mexico, Vietnam, Guyana, China, Nepal, Senegal, and a few mountainous pockets in southern Europe. There are thought to be as many as 70 whistled languages still in use, though only 12 have been described and studied scientifically. This form of communication is an adaptation found among cultures where people are often isolated from each other, according to Julien Meyer, a researcher at the Institute of Human Sciences in Lyon, France. ‘They are mostly used in mountains or dense forests,’ he says. ‘Whistled languages are quite clearly defined and represent an original adaptation of the spoken language for the needs of isolated human groups.’</p>
                     <p>But with modern communication technology now widely available, researchers say whistled languages like Silbo are threatened with extinction. With dwindling numbers of Gomera islanders still fluent in the language, Canaries’ authorities are taking steps to try to ensure its survival. Since 1999, Silbo Gomero has been taught in all of the island’s elementary schools. In 2009, Silbo Gomero has been taught in all of the island’s elementary schools. In 2009, Silbo Gomero was added to UNESCO’s list of Masterpieces of the Oral and Intangible Heritage of Humanity. ‘The local authorities are trying to get an award for the organisation to declare [Silbo Gomero] as something that should be preserved for humanity,’ Carreiras adds.</p>
              </CardContent></Card>
              
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Environmental practices of big businesses</h3>
                  <p>The environmental practices of big businesses are shaped by a fundamental fact that for many of us offends our sense of justice. Depending on the circumstances, a business may maximize the amount of money it makes, at least in the short term, by damaging the environment and hurting people. That is still the case today for fishermen in an unmanaged fishery without quotas, and for international logging companies with short-term leases on tropical rainforest land in places with corrupt officials and unsophisticated landowners. When government regulation is effective, and when the public is environmentally aware, environmentally clean big businesses may out-compete dirty ones, but the reverse is likely to be true if government regulation is ineffective and if the public doesn’t care.</p>
                  <p>It is easy for the rest of us to blame a business for helping itself by hurting other people. But blaming alone is unlikely to produce change. It ignores the fact that businesses are not charities but profit-making companies, and that publicly owned companies with shareholders are under obligation to those shareholders to maximize profits, provided they do so by legal means. US laws make a company’s directors legally liable for something termed ‘breach of fiduciary responsibility’ if they knowingly manage a company in a way that reduces profits. The car manufacturer Henry Ford was in fact successfully sued by shareholders in 1919 for raising the minimum wage of his workers to $5 per day: the courts declared that, while Ford’s humanitarian sentiments about his employees were nice, his business existed to make profits for its stockholders.</p>
                  <p>Our blaming of businesses also ignores the ultimate responsibility of the public for creating the conditions that let a business profit through destructive environmental policies. In the long run, it is the public, either directly or through its politicians, that has the power to make such destructive policies unprofitable and illegal, and to make sustainable environmental policies profitable.</p>
                  <p>The public can do that by suing businesses for harming them, as happened after the Exxon Valdez disaster, in which over 40,000 m³ of oil were spilled off the coast of Alaska. The public may also make their opinion felt by preferring to buy sustainably harvested products; by making employees of companies with poor track records feel ashamed of their company and complain to their own management; by preferring their governments to award valuable contracts to businesses with a good environmental track record; and by pressing their governments to pass and enforce laws and regulations requiring good environmental practices.</p>
                  <p>In turn, big businesses can exert powerful pressure on any suppliers that might ignore public or government pressure. For instance, after the US public became concerned about the spread of a disease known as BSE, which was transmitted to humans through infected meat, the US government’s Food and Drug Administration introduced rules demanding that the meat industry abandon practices associated with the risk of the disease spreading. But for five years the meat packers refused to follow these, claiming that they would be too expensive to obey. However, when a major fast-food company then made the same demands after customer purchases of its hamburgers plummeted, the meat industry complied within weeks. The public’s task is therefore to identify which links in the supply chain are sensitive to public pressure: for instance, fast-food chains or jewelry stores, but not meat packers or gold miners.</p>
                  <p>Some readers may be disappointed or outraged that I place the ultimate responsibility for business practices harming the public on the public itself. I also believe that the public must accept the necessity for higher prices for products to cover the added costs, if any, of sound environmental practices. My views may seem to ignore the belief that businesses should act in accordance with moral principles even if this leads to a reduction in their profits. But I think we have to recognize that, throughout human history, in all politically complex human societies, government regulation has arisen precisely because it was found that not only did moral principles need to be made explicit, they also needed to be enforced.</p>
                  <p>To me, the conclusion that the public has the ultimate responsibility for the behavior of even the biggest businesses is empowering and hopeful, rather than disappointing. My conclusion is not a moralistic one about who is right or wrong, admirable or selfish, a good guy or a bad guy. In the past, businesses have changed when the public came to expect and require different behavior, to reward businesses for behavior that the public wanted, and to make things difficult for businesses practicing behaviors that the public didn’t want. I predict that in the future, just as in the past, changes in public attitudes will be essential for changes in businesses’ environmental practices.</p>
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
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">The importance of the huarango tree</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>its roots can extend as far as 80 metres into the soil</li>
                            <li>can access <strong>1</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /> deep below the surface</li>
                            <li>was a crucial part of local inhabitants' <strong>2</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} /> a long time ago</li>
                            <li>helped people to survive periods of <strong>3</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} /></li>
                            <li>prevents <strong>4</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} /> of the soil</li>
                            <li>prevents land from becoming a <strong>5</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} /></li>
                        </ul>
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6–8</h3><p>Complete the table below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage.</p>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead><tr><th className="border p-2">Part of tree</th><th className="border p-2">Traditional use</th></tr></thead>
                      <tbody>
                        <tr><td className="border p-2"><strong>6</strong> <Input className={`w-full ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} /></td><td className="border p-2">fuel</td></tr>
                        <tr><td className="border p-2"><strong>7</strong> <Input className={`w-full ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /> and <Input className={`w-full mt-1`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /></td><td className="border p-2">medicine</td></tr>
                        <tr><td className="border p-2"><strong>8</strong> <Input className={`w-full ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} /></td><td className="border p-2">construction</td></tr>
                      </tbody>
                    </table></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9–13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4">
                        <p><strong>9</strong> Local families have told Whaley about some traditional uses of huarango products.</p><Input className={`max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>10</strong> Farmer Alberto Benevides is now making a good profit from growing huarangos.</p><Input className={`max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>11</strong> Whaley needs the co-operation of farmers to help preserve the area’s wildlife.</p><Input className={`max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>12</strong> For Whaley’s project to succeed, it needs to be extended over a very large area.</p><Input className={`max-w-[150px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>13</strong> Whaley has plans to go to Africa to set up a similar project.</p><Input className={`max-w-[150px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–19</h3><p>Do the following statements agree with the information given in Reading Passage 2? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4">
                        <p><strong>14</strong> La Gomera is the most mountainous of all the Canary Islands.</p><Input className={`max-w-[150px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>15</strong> Silbo is only appropriate for short and simple messages.</p><Input className={`max-w-[150px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>16</strong> In the brain-activity study, silbadores and non-whistlers produced different results.</p><Input className={`max-w-[150px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>17</strong> The Spanish introduced Silbo to the islands in the 15th century.</p><Input className={`max-w-[150px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>18</strong> There is precise data available regarding the number of whistled languages in existence today.</p><Input className={`max-w-[150px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>19</strong> The children of Gomera now learn Silbo.</p><Input className={`max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20–26</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">Silbo Gomero</h4>
                        <p><strong>How Silbo is produced</strong></p>
                        <ul className="list-disc pl-6">
                            <li>high- and low-frequency tones represent different sounds in Spanish <strong>20</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /></li>
                            <li>pitch of whistle is controlled using silbador's <strong>21</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} /></li>
                            <li><strong>22</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} /> is changed with a cupped hand</li>
                        </ul>
                        <p><strong>How Silbo is used</strong></p>
                        <ul className="list-disc pl-6">
                            <li>has long been used by shepherds and people living in secluded locations</li>
                            <li>in everyday use for the transmission of brief <strong>23</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /></li>
                            <li>can relay essential information quickly, e.g. to inform people about <strong>24</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /></li>
                        </ul>
                        <p><strong>The future of Silbo</strong></p>
                        <ul className="list-disc pl-6">
                            <li>future under threat because of new <strong>25</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /></li>
                            <li>Canaries' authorities hoping to receive a UNESCO <strong>26</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} /> to help preserve it</li>
                        </ul>
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–31</h3><p>Complete the summary using the list of words, A–J, below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">Big businesses</h4>
                      <p>Many big businesses today are prepared to harm people and the environment in order to make money, and they appear to have no <strong>27</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} />. Lack of <strong>28</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} /> by governments and lack of public <strong>29</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} /> can lead to environmental problems such as <strong>30</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} /> or the destruction of <strong>31</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-sm"><p><strong>A</strong> funding</p><p><strong>B</strong> trees</p><p><strong>C</strong> rare species</p><p><strong>D</strong> moral standards</p><p><strong>E</strong> control</p><p><strong>F</strong> involvement</p><p><strong>G</strong> flooding</p><p><strong>H</strong> overfishing</p><p><strong>I</strong> worker support</p></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32–34</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>32</strong> The main idea of the third paragraph is that environmental damage</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> requires political action if it is to be stopped.</p><p><strong>B</strong> is the result of ignorance on the part of the public.</p><p><strong>C</strong> could be prevented by the action of ordinary people.</p><p><strong>D</strong> can only be stopped by educating business leaders.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} /></div>
                      <div><p><strong>33</strong> In the fourth paragraph, the writer describes ways in which the public can</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> reduce their own individual impact on the environment.</p><p><strong>B</strong> learn more about the impact of business on the environment.</p><p><strong>C</strong> raise awareness of the effects of specific environmental disasters.</p><p><strong>D</strong> influence the environmental policies of businesses and governments.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} /></div>
                      <div><p><strong>34</strong> What pressure was exerted by big business in the case of the disease BSE?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> Meat packers stopped supplying hamburger chains.</p><p><strong>B</strong> A fast-food company forced their meat suppliers to follow the law.</p><p><strong>C</strong> Meat packers persuaded the government to reduce their expenses.</p><p><strong>D</strong> A fast-food company encouraged the government to introduce legislation.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 35–39</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>35</strong> The public should be prepared to fund good environmental practices.</p><Input className={`max-w-[150px] ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>36</strong> There is a contrast between the moral principles of different businesses.</p><Input className={`max-w-[150px] ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>37</strong> It is important to make a clear distinction between acceptable and unacceptable behaviour.</p><Input className={`max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>38</strong> The public have successfully influenced businesses in the past.</p><Input className={`max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>39</strong> In the future, businesses will show more concern for the environment.</p><Input className={`max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Question 40</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div><p><strong>40</strong> What would be the best subheading for this passage?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> Will the world survive the threat caused by big businesses?</p><p><strong>B</strong> How can big businesses be encouraged to be less driven by profit?</p><p><strong>C</strong> What environmental dangers are caused by the greed of businesses?</p><p><strong>D</strong> Are big businesses to blame for the damage they cause the environment?</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /></div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-15" module="reading" testNumber={4} /><UserTestHistory book="book-15" module="reading" testNumber={4} /></div>
      </div>
    </div>
  )
}