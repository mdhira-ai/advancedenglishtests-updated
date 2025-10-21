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

export default function Book2ReadingTest4() {
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

  const correctAnswers = {
    '1': 'D', '2': 'E', '3': 'G', '4': 'B', '5': 'D', '6': 'F', '7': 'A', '8': 'C', '9': 'G', '10': 'E',
    '11': 'natural resource', '12': 'recycling industry', '13': 'drinkable liquids', '14': '(real) sand',
    '15': 'NOT GIVEN', '16': 'FALSE', '17': 'NOT GIVEN', '18': 'TRUE', '19': 'TRUE',
    '20': 'D', '21': 'E', '22': 'C', '23': 'A',
    '24': 'C', '25': 'B', '26': 'A', '27': 'B',
    '28': 'vi', '29': 'v', '30': 'vii', '31': 'i', '32': 'iv', '33': 'ii',
    '34': 'thousands of years', '35': '(tree) bark', '36': 'overseas museums', '37': 'school walls',
    '38': 'B', '39': 'C', '40': 'C'
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
      const detailedAnswers = { singleAnswers: answers, results: Object.keys(correctAnswers).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      
      await saveTestScore({
        book: 'practice-tests-plus-2',
        module: 'reading',
        testNumber: 4,
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
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge Ielts Test Plus 2 - Reading Test 4</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Green virtues of green sand</h3>
                  <p><em>Revolution in glass recycling could help keep water clean</em></p>
                  <p><strong>A</strong> For the past 100 years special high grade white sand, dug from the ground at Leighton Buzzard in the UK, has been used to filter tap water to remove bacteria and impurities – but this may no longer be necessary. A new factory that turns used wine bottles into green sand could revolutionise the recycling industry and help to filter Britain's drinking water. Backed by $1.6m from the European Union and the Department for Environment, Food and Rural Affairs (Defra), a company based in Scotland is building a factory that will turn bottles back into the sand from which they were made in the first place. The green sand has already been successfully tested by water companies and is being used in 50 swimming pools in Scotland to keep the water clean.</p>
                  <p><strong>B</strong> The idea is not only to avoid using up an increasingly scarce natural resource, sand, but also to solve a crisis in the recycling industry. Britain uses 750,000 tonnes of glass a year, but recycles only 750,000 tonnes of it. The problem is that half the green bottle glass in Britain is originally from imported wine and beer bottles. Because there is so much of it, and it is less useful than domestic production that recycles clear glass, green glass is worth only $25 a tonne. Clear glass, which is melted down and used for whisky bottles, mainly for export, is worth double that amount.</p>
                  <p><strong>C</strong> Howard Dryden, a scientist and managing director of the company, Dryden Aqua, of Bonnyrigg, near Edinburgh, has spent six years working on the product he calls Active Filtration Media, or AFM. He concedes that he has given what is basically recycled glass a 'fancy name' to remove the stigma of what most people would regard as an inferior product. He says he needs bottles that have already contained drinkable liquids to be sure that drinking water filtered through the AFM would not be contaminated. Crushed down beverage glass has fewer impurities than real sand and it performed better in trials. 'The fact is that tests show that AFM does the job better than sand, it is easier to clean and reuse and has all sorts of properties that make it ideal for other applications,' he claimed.</p>
                  <p><strong>D</strong> The factory is designed to produce 100 tonnes of AFM a day, although Mr Dryden regards this as a large-scale pilot project rather than full production. Current estimates of the UK market for this glass for filtering drinking water, sewage, industrial water, swimming pools and fish farming are between 175,000 to 217,000 tonnes a year, which will use up most of the glass available near the factory. So he intends to build five or six factories in cities where there are large quantities of bottles, in order to cut down on transport costs.</p>
                  <p><strong>E</strong> The current factory will be completed this month and is expected to go into full production on January 14th next year. Once it is providing a 'regular' product, the government's drinking water inspectorate will be asked to perform tests and approve it for use in water supplies. A Defra spokesman said it was hoped that AFM could meet approval within six months. The only problem that they could foresee was possible contamination if some glass came from sources other than beverage bottles.</p>
                  <p><strong>F</strong> Among those who have tested the glass already is Caroline Fitzpatrick of the civil and environmental engineering department of University College London. 'We have looked at a number of batches and it appears to do the job,' she said. 'Basically, sand is made of glass and Mr Dryden is turning bottles back into sand. It seems a straightforward idea and there is no reason we can think of why it would not work. Since glass from wine bottles and other beverages has no impurities and clearly did not leach any substances into the contents of the bottles, there was no reason to believe there would be a problem,' Dr Fitzpatrick added.</p>
                  <p><strong>G</strong> Mr Dryden has set up a network of agents round the world to sell AFM. It is already in use in central America to filter water on banana plantations where the fruit has to be washed before being despatched to European markets. It is also in use in sewage works to filter water before it is returned to rivers, something which is becoming legally necessary across the European Union because of tighter regulations on sewage works. So there are a great number of applications involving cleaning up water. Currently, however, AFM costs $670 a tonne, about four times as much as good quality sand. 'But that is because we haven't got large-scale production. Obviously, when we get going it will cost a lot less, and be competitive with sand in price as well,' Mr Dryden said. 'I believe it performs better and lasts longer than sand, so it is going to be better value too.'</p>
                  <p><strong>H</strong> If AFM takes off as a product it will be a big boost for the government agency which is charged with finding a market for recycled products. Crushed glass is already being used in road surfacing and in making tiles and bricks. Similarly, AFM could prove to have a widespread use and give green glass a cash value.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">NATURAL CHOICE Coffee and chocolate</h3>
                  <p><em>What’s the connection between your morning coffee, wintering North American birds and the cool shade of a tree? Actually, quite a lot, says Simon Birch.</em></p>
                  <p>When scientists from London's Natural History Museum descended on the coffee farms of the tiny Central American republic of El Salvador, they were astonished to find such diversity of insect and plant species. During 18 months' work on 12 farms, they found a third more species of parasitic wasps than are known to exist in the whole country of Costa Rica. They described four new species and are aware of a fifth. On 24 farms they found nearly 300 species of tree - when they had expected to find about 100.</p>
                  <p>El Salvador has lost much of its natural forest, with coffee farms covering nearly 10% of the country. Most of them use the 'shade-grown' method of production, which utilises a semi-natural forest ecosystem. Alex Munro, the museum's botanist on the expedition, says, 'Our findings amazed our insect specialist. There's a very sophisticated food web present. The wasps, for instance, may depend on specific species of tree.'</p>
                  <p>It's the same the world over. Species diversity is much higher where coffee is grown in shade conditions. In addition, coffee (and chocolate) is usually grown in tropical rainforest regions that are biodiversity hotspots. These habitats support up to 70% of the planet's plant and animal species, and so the production methods of coffee and chocolate can have a hugely significant impact,' explains Dr Paul Donald of the Royal Society for the Protection of Birds.</p>
                  <p>So what does 'shade-grown' mean, and why is it good for wildlife? Most of the world's coffee is produced by poor farmers in the developing world, traditionally they have grown coffee (and cocoa) under the shade of selectively-thinned tracts of rain forest in a genuinely sustainable form of farming. Leaf fall from the canopy provides a supply of nutrients and acts as a mulch that suppresses weeds. The insects that live in the canopy pollinate the cocoa and coffee and prey on pests. The trees also provide farmers with fruit and wood for fuel.</p>
                  <p>'Bird diversity in shade-grown coffee plantations rivals that found in natural forests in the same region,' says Robert Rice from the Smithsonian Migratory Bird Center. In Ghana, West Africa – one of the world's biggest producers of cocoa – 90% of the cocoa is grown under shade, and these forest plantations are a vital habitat for wintering European migrant birds. In the same way, the coffee forests of Central and South America are a refuge for wintering North American migrants.</p>
                  <p>More recently, a combination of the collapse in the world market for coffee and cocoa and a drive to increase yields by producer countries has led to huge swathes of shade-grown coffee and cocoa being cleared to make way for a highly intensive monoculture pattern of production known as 'full sun'. But this system not only reduces the diversity of flora and fauna, it also requires huge amounts of pesticides and fertilisers. In Cote d'Ivoire, which produces more than half the world's cocoa, more than a third of the crop is now grown in full-sun conditions.</p>
                  <p>The loggers have been busy in the Americas too, where nearly 70% of all Colombian coffee is now produced using full-sun production. One study carried out in Colombia and Mexico found that compared with shade coffee, full-sun plantations have 95% fewer species of birds.</p>
                  <p>In El Salvador, Alex Munro says shade-coffee farms have a cultural as well as ecological significance and people are not happy to see them go. But the financial pressures are great, and few of these coffee farms make much money. 'One farm we studied, a cooperative of 100 families, made just $10,000 a year – $100 per family – and that's not taking labour costs into account.'</p>
                  <p>The loss of shade-coffee forests has so alarmed a number of North American wildlife organisations that they are now harnessing consumer power to help save these threatened habitats. They are promoting a 'certification' system that can indicate to consumers that the beans have been grown on shade plantations. Bird-friendly coffee, for instance, is marketed by the Smithsonian Migratory Bird Center. The idea is that the small extra cost is passed directly on to the coffee farmers as a financial incentive to maintain their shade-coffee farms.</p>
                  <p>Not all conservationists agree with such measures, however. Some say certification could be leading to the loss – not preservation – of natural forests. John Rappole of the Smithsonian Conservation and Research Center, for example, argues that shade-grown marketing provides 'an incentive to convert existing areas of primary forest that are too remote or steep to be converted profitably to other forms of cultivation into shade-coffee plantations'.</p>
                  <p>Other conservationists, such as Stacey Philpott and colleagues, argue the case for shade coffee. But there are different types of shade growing. Those used by subsistence farmers are virtually identical to natural forest (and have a corresponding diversity), while systems that use coffee plants as the understorey and cacao or citrus trees as the overstorey may be no more diverse than full-sun farms. Certification procedures need to distinguish between the two, and Ms Philpott argues that as long as the process is rigorous and offers financial gain to the producers, shade growing does benefit the environment.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Painters of time</h3>
                  <p><em>'The world's fascination with the mystique of Australian Aboriginal art.' - Emmanuel de Roux</em></p>
                  <p><strong>A</strong> The works of Aboriginal artists are now much in demand throughout the world, and not just in Australia, where they are already fully recognised: the National Museum of Australia, which opened in Canberra in 2001, designed 40% of its exhibition space to works by Aborigines. In Europe their art is being exhibited in Lyon, France, while the future Quai Branly museum in Paris – which will be devoted to arts and civilisations of Africa, Asia, Oceania and the Americas – plans to commission frescoes by artists from Australia.</p>
                  <p><strong>B</strong> Their artistic movement began about 30 years ago, but its roots go back to time immemorial. All the works refer to the founding myth of the Aboriginal culture, 'the Dreaming'. That internal geography, which is rendered with a brush and colours, is also the expression of the Aborigines' long quest to regain the land which was stolen from them when Europeans arrived in the nineteenth century. 'Painting is nothing without history,' says one such artist, Michael Nelson Tjakamarra.</p>
                  <p><strong>C</strong> There are now fewer than 400,000 Aborigines living in Australia. They have been swamped by the country's 17.5 million immigrants. These original 'natives' have been living in Australia for 50,000 years, but they were undoubtedly maltreated by the newcomers. Driven back to the most barren lands or crammed into slums on the outskirts of cities, the Aborigines were subjected to a policy of 'assimilation', which involved kidnapping children to make them better 'integrated' into European society, and herding the nomads Aborigines were forced into settled communities.</p>
                  <p><strong>D</strong> It was in one such community, Papunya, near Alice Springs, in the central desert, that Aboriginal painting first came into its own. In 1971, a white schoolteacher, Geoffrey Bardon, suggested to a group of Aborigines that they should decorate the school walls with ritual motifs, so as to pass on to the younger generation the myths that were starting to fade from their collective memory. He gave them brushes, colours and surfaces to paint on - cardboard and canvases. He was astounded by the result. But their art did not come like a bolt from the blue: for thousands of years Aborigines had been 'painting' on the ground using sands of different colours, and on rock faces; they had also been decorating their bodies for ceremonial purposes. So there existed a formal vocabulary.</p>
                  <p><strong>E</strong> This had already been noted by Europeans. In the early twentieth century, Aboriginal communities brought together by missionaries in northern Australia had been encouraged to reproduce on tree bark the motifs found on rock faces. Artists turned out a steady stream of works, supported by the churches, which helped to sell them to the public, and between 1950 and 1960 Aboriginal paintings began to reach overseas museums. Painting on bark persisted in the north, whereas the communities of the central desert increasingly used acrylic paint, and elsewhere in Western Australia women explored the possibilities of wax painting and dyeing processes, known as 'batik'.</p>
                  <p><strong>F</strong> What Aborigines depict are always elements of the Dreaming, the collective history that each community is both part of and guardian of. The Dreaming is the story of their origins, of their 'Great Ancestors', who passed on their knowledge, their art and their skills (hunting, medicine, painting, music and dance) to man. 'The Dreaming is not synonymous with the moment when the world was created,' says Stephane Jacob, one of the organisers of the Lyon exhibition. 'For Aborigines, that moment has never ceased to exist. It is perpetuated by the cycle of the seasons and the religious ceremonies which the Aborigines organise. Indeed the aim of those ceremonies is also to ensure the permanence of that order of things. The central function of Aboriginal painting, even in its contemporary manifestations, is to guarantee the survival of this world. The Dreaming is both past, present and future.</p>
                  <p><strong>G</strong> Each work is created individually, with a form peculiar to each artist, but it is created within and on behalf of a community who must approve it. An artist cannot use a 'dream' that does not belong to his or her community, since each community is the owner of its dreams, just as it is anchored to a territory marked out by its ancestors, so each painting can be interpreted as a kind of spiritual road map for that community.</p>
                  <p><strong>H</strong> Nowadays, each community is organised as a cooperative and draws on the services of an art adviser, a government-employed agent who provides the artists with materials, deals with galleries and museums and redistributes the proceeds from sales among the artists.</p>
                  <p><strong>I</strong> Today, Aboriginal painting has become a great success. Some works sell for more than $25,000, and exceptional items may fetch as much as $180,000 in Australia. 'By exporting their paintings as though they were surfaces of their territory, by accompanying them to the temples of western art, the Aborigines have redrawn the map of their country, into whose depths they were exiled,' says Yves Le Fur, of the Quai Branly museum. 'Masterpieces have been created. Their undeniable power prompts a dialogue that has proved all too rare in the history of contacts between the two cultures'.</p>
              </CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2"><div className="flex space-x-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-14</button><button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 15-27</button><button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 28-40</button></div></div>
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-14</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-10</h3><p>Reading Passage 1 has 8 paragraphs labelled A-H. Which paragraph contains the following information?</p>
                  <div className="space-y-4">
                      <p><strong>1</strong> a description of plans to expand production of AFM</p><Input className={`max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} />
                      <p><strong>2</strong> the identification of a potential danger in the raw material for AFM</p><Input className={`max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} />
                      <p><strong>3</strong> an example of AFM use in the export market</p><Input className={`max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} />
                      <p><strong>4</strong> a comparison of the value of green glass and other types of glass</p><Input className={`max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} />
                      <p><strong>5</strong> a list of potential applications of AFM in the domestic market</p><Input className={`max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} />
                      <p><strong>6</strong> the conclusions drawn from laboratory checks on the process of AFM production</p><Input className={`max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} />
                      <p><strong>7</strong> identification of current funding for the production of green sand</p><Input className={`max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} />
                      <p><strong>8</strong> an explanation of the chosen brand name for crushed green glass</p><Input className={`max-w-[100px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} />
                      <p><strong>9</strong> a description of plans for exporting AFM</p><Input className={`max-w-[100px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} />
                      <p><strong>10</strong> a description of what has to happen before AFM is accepted for general use</p><Input className={`max-w-[100px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 11-14</h3><p>Complete the summary below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-bold text-center">Green sand</h4>
                    <p>The use of crushed green glass (AFM) may have two significant impacts: it may help to save a diminishing <strong>11</strong> <Input className={`inline-block w-48 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} /> while at the same time solving a major problem for the <strong>12</strong> <Input className={`inline-block w-48 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} /> in the UK. However, according to Howard Dryden, only glass from bottles that have been used for <strong>13</strong> <Input className={`inline-block w-48 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} /> can be used in the production process. AFM is more effective than <strong>14</strong> <Input className={`inline-block w-48 ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} /> as a water filter, and also has other uses.</p>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 15-27</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 15-19</h3><p>Do the following statements agree with the information given in Reading Passage 2? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>15</strong> More species survive on the farms studied by the researchers than in the natural El Salvador forests.</p><Input className={`max-w-[150px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} />
                      <p><strong>16</strong> Nearly three-quarters of the Earth's wildlife species can be found in shade-coffee plantations.</p><Input className={`max-w-[150px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} />
                      <p><strong>17</strong> Farmers in El Salvador who have tried both methods prefer shade-grown plantations.</p><Input className={`max-w-[150px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />
                      <p><strong>18</strong> Shade plantations are important for migrating birds in both Africa and the Americas.</p><Input className={`max-w-[150px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />
                      <p><strong>19</strong> Full-sun cultivation can increase the costs of farming.</p><Input className={`max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-23</h3><p>Look at the following opinions (Questions 20-23) and the list of people below. Match each opinion to the person credited with it.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of People</strong></p><p><strong>A</strong> Alex Munroe, <strong>B</strong> Paul Donald, <strong>C</strong> Robert Rice, <strong>D</strong> John Rappole, <strong>E</strong> Stacey Philpott</p></div>
                  <div className="space-y-4">
                      <p><strong>20</strong> Encouraging shade growing may lead to farmers using the natural forest for their plantations.</p><Input className={`max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} />
                      <p><strong>21</strong> If shade-coffee farms match the right criteria, they can be good for wildlife.</p><Input className={`max-w-[100px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} />
                      <p><strong>22</strong> There may be as many species of bird found on shade farms in a particular area, as in natural habitats there.</p><Input className={`max-w-[100px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} />
                      <p><strong>23</strong> Currently, many shade-coffee farmers earn very little.</p><Input className={`max-w-[100px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-27</h3><p>Classify the features described below as applying to <strong>A</strong> the shade-grown method, <strong>B</strong> the full-sun method, or <strong>C</strong> both shade-grown and full-sun methods. Write the correct letter A-C in boxes 24-27.</p>
                  <div className="space-y-4">
                      <p><strong>24</strong> can be used on either coffee or cocoa plantations</p><Input className={`max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} />
                      <p><strong>25</strong> is expected to produce bigger crops</p><Input className={`max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} />
                      <p><strong>26</strong> documentation may be used to encourage sales</p><Input className={`max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} />
                      <p><strong>27</strong> can reduce wildlife diversity</p><Input className={`max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} />
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 28-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 28-33</h3><p>Reading Passage 3 has nine paragraphs A-I. Choose the most suitable heading for paragraphs A-F from the list of headings below. Write the correct number (i-viii) in boxes 28-33.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                      <h4 className="font-bold">List of headings</h4>
                      <p>i Amazing results from a project</p>
                      <p>ii New religious ceremonies</p>
                      <p>iii Community art centres</p>
                      <p>iv Early painting techniques and marketing systems</p>
                      <p>v Mythology and history combined</p>
                      <p>vi The increasing acclaim for Aboriginal art</p>
                      <p>vii Belief in continuity</p>
                      <p>viii Oppression of a minority people</p>
                  </div>
                  <div className="space-y-4">
                      <p><strong>28</strong> Paragraph A</p><Input className={`max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} />
                      <p><strong>29</strong> Paragraph B</p><Input className={`max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> Paragraph C</p><Input className={`max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> Paragraph D</p><Input className={`max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                      <p><strong>32</strong> Paragraph E</p><Input className={`max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />
                      <p><strong>33</strong> Paragraph F</p><Input className={`max-w-[100px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 34-37</h3><p>Complete the flow chart below. Choose <strong>NO MORE THAN THREE WORDS</strong> from the passage for each answer.</p>
                  <div className="space-y-2 border p-4 rounded-lg">
                      <p>For <strong>34</strong> <Input className={`inline-block w-40 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} />, Aborigines produced ground and rock paintings.</p>
                      <p className="text-center">↓</p>
                      <p>Early twentieth century: churches first promoted the use of <strong>35</strong> <Input className={`inline-block w-40 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> for paintings.</p>
                      <p className="text-center">↓</p>
                      <p>Mid-twentieth century: Aboriginal paintings were seen in <strong>36</strong> <Input className={`inline-block w-40 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />.</p>
                      <p className="text-center">↓</p>
                      <p>Early 1970s: Aborigines painted traditional patterns on <strong>37</strong> <Input className={`inline-block w-40 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /> in one community.</p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38-40</h3><p>Choose the correct answer, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>38</strong> In Paragraph G, the writer suggests that an important feature of Aboriginal art is</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> its historical context.</p><p><strong>B</strong> its significance to the group.</p><p><strong>C</strong> its religious content.</p><p><strong>D</strong> its message about the environment.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /></div>
                      <div><p><strong>39</strong> In Aboriginal beliefs, there is a significant relationship between</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> communities and lifestyles.</p><p><strong>B</strong> images and techniques.</p><p><strong>C</strong> culture and form.</p><p><strong>D</strong> ancestors and territory.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /></div>
                      <div><p><strong>40</strong> In Paragraph I, the writer suggests that Aboriginal art invites Westerners to engage with</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> the Australian land.</p><p><strong>B</strong> their own art.</p><p><strong>C</strong> Aboriginal culture.</p><p><strong>D</strong> their own history.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /></div>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Object.keys(correctAnswers).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <PageViewTracker 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={4}
          />
          <TestStatistics 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={4}
          />
          <UserTestHistory 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={4}
          />
        </div>
      </div>
    </div>
  )
}