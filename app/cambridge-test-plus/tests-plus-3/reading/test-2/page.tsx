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

export default function BookPlus3ReadingTest2() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '21_22': [],
  });
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

  const handleMultiSelect = (questionKey: '21_22', value: string) => {
    setMultipleAnswers(prev => {
        const currentAnswers = prev[questionKey] || [];
        const maxAnswers = 2;
        let newAnswers;
        if (currentAnswers.includes(value)) {
            newAnswers = currentAnswers.filter(ans => ans !== value);
        } else {
            if (currentAnswers.length < maxAnswers) {
                newAnswers = [...currentAnswers, value].sort();
            } else { newAnswers = currentAnswers; }
        }
        return { ...prev, [questionKey]: newAnswers };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    
    // Handle multi-select for questions 21-22
    if (questionNumber === '21' || questionNumber === '22') {
        const userChoices = multipleAnswers['21_22'] || [];
        const correctAnswersSet = ['B', 'E'];
        return userChoices.length === 2 && userChoices.every(choice => correctAnswersSet.includes(choice));
    }

    if (!user) return false;
    return checkAnswerWithMatching(user, String(correct), questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    const answeredMultiSelect = new Set<string>();

    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&')) continue;
      
      // Handle multi-select questions 21-22
      if (['21', '22'].includes(qNum)) {
        if (!answeredMultiSelect.has('21_22')) {
          const userChoices = multipleAnswers['21_22'] || [];
          const correctAnswersSet = ['B', 'E'];
          userChoices.forEach(choice => {
            if (correctAnswersSet.includes(choice)) { correctCount++; }
          });
          answeredMultiSelect.add('21_22');
        }
      } else if (checkAnswer(qNum)) {
        correctCount++;
      }
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, multipleAnswers, results: Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      
      await saveTestScore({
        book: 'practice-tests-plus-3',
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
    setAnswers({}); setMultipleAnswers({ '21_22': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const renderMultiSelectStatus = (key: '21_22', correctSet: string[]) => {
    if (!submitted) return null;
    const userChoices = multipleAnswers[key] || [];
    const correctCount = userChoices.filter(c => correctSet.includes(c)).length;
    const isFullyCorrect = correctCount === correctSet.length && userChoices.length === correctSet.length;
    return (
        <div className="mt-2 flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${isFullyCorrect ? 'bg-green-600' : 'bg-red-600'}`}></div>
            <span className="text-sm text-gray-600">Correct answers: {correctSet.join(' and ')} ({correctCount}/{correctSet.length} correct)</span>
        </div>
    );
  };

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'unfit', '2': 'schools', '3': 'PE teachers', '4': 'surplus', '5': 'employment opportunities/careers',
    '6': 'TRUE', '7': 'NOT GIVEN', '8': 'TRUE', '9': 'TRUE', '10': 'FALSE', '11': 'TRUE', '12': 'FALSE', '13': 'NOT GIVEN',
    '14': 'v', '15': 'ii', '16': 'iv', '17': 'ix', '18': 'i', '19': 'vi', '20': 'viii',
    '21': 'B', '22': 'E', '21&22': ['B', 'E'],
    '23': 'offshore wind farms', '24': 'developing technology', '25': 'negative', '26': 'cars',
    '27': 'B', '28': 'D', '29': 'A', '30': 'E', '31': 'D', '32': 'C',
    '33': 'NOT GIVEN', '34': 'NO', '35': 'YES', '36': 'NO', '37': 'YES', '38': 'YES', '39': 'A', '40': 'B'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 3 - Reading Test 2</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold text-xl">Sport science in Australia</h3>
                  <p>The professional career paths available to graduates from courses relating to human movement and sport science are diverse. The graduate’s imagination is the only real constraint. However, undergraduate courses with this type of content, in Australia as well as in most other Western countries, were originally designed as preparation programmes for Physical Education (PE) teachers.</p>
                  <p>The initial programmes commenced soon after the conclusion of World War II in the mid-1940s. One of the primary motives for these initiatives was the fact that during the war effort, so many of the men who were assessed for military duty had been declared unfit. The government saw the solution in the providing of Physical Education programmes in schools, delivered by better prepared and specifically educated PE teachers.</p>
                  <p>Later, in the 1970s and early 1980s, the surplus of Australians graduating with a PE degree obliged institutions delivering this qualification to look for new employment opportunities for their graduates, resulting in the first appearance of degrees catering for recreation professionals. In many instances, this diversity of programme delivery continues to be delivered by physical educators. It is a side-line activity to the production of PE teachers.</p>
                  <p>Whilst the need to produce Physical Education teachers remains a significant social need, and most developed societies demand the availability of quality leisure programmes for their citizens, the career options of graduates within this domain are still developing. The two most evident growth domains are in the area of the professional delivery of sport, and the role of a physical lifestyle for community health.</p>
                  <p>The sports industry is developing at an unprecedented rate of growth. From a business perspective, sport is now seen as an area with the potential for high returns. It is quite significant that the businessman Rupert Murdoch broadened his business base from media to sport, having purchased an American baseball team and an Australian Rugby League competition as well as seeking opportunities to invest in an English football club. No business person of such international nature would see fit to invest in sport unless he was satisfied that this was a sound business venture with ideal revenue-generating opportunities.</p>
                  <p>These developments have confirmed sport as a business with professional management structures, marketing processes, and development strategies in place. They have indicated new and developing career paths for graduates of human movement science, sport science, exercise science and related degrees. Graduates can now visualise career paths extending into such diverse domains as sport management, sport marketing, event and facility management, government policy development pertaining to sport, sport journalism, sport psychology, and sport or athletic coaching.</p>
                  <p>Business leaders will only continue their enthusiasm for sport if they receive returns for their money. Such returns will only be forthcoming if astute, enthusiastic and properly educated professionals are delivering the programs that earn appropriate financial returns. The successful universities of the 21st century will be those that have responded to this challenge by delivering such degrees.</p>
                  <p>A second professional growth area for this group of graduates is associated with community health. The increasing demand for government expenditure to contain health budgets is reaching the stage where most governments are simply unable to function in a manner that is satisfying their constituents. One of the primary reasons for this problem is the unhelpful emphasis on treatment in medical care programmes. Governments have traditionally given their senior health official the title of ‘Minister for Health’, when in fact this officer has functioned as ‘Minister for Sickness and the Construction of Hospitals’. Government focus simply has to change. If the change is not brought about for philosophical reasons, it will occur naturally, because insufficient funding will be available to address the ever-increasing costs of medical support.</p>
                  <p>Graduates of human movement, exercise science and sport science have the potential to become major players in this shift in policy focus. It is these graduates who already have the skills, knowledge and understanding to initiate community health education programmes to reduce cardio-vascular disease, to reduce medical dependency upon diabetes, to improve workplace health leading to increased productivity, to initiate and promote programmes of activity for the elderly that reduce medical dependency, and to maintain an active lifestyle for the unemployed and disadvantaged groups in society. This is the graduate that governments will be calling upon to shift the community focus from medical dependency to healthy lifestyles in the decades ahead.</p>
                  <p>The career paths of these graduates are developing at a pace that is not evident in other professions. The contribution that these graduates can make to society, and the recognition of this contribution is at an unprecedented high, and all indications are that it will continue to grow.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold text-xl">An assessment of micro-wind turbines</h3>
                  <p><strong>A</strong> In terms of micro-renewable energy sources suitable for private use, a 15-kilowatt (kW) turbine* is at the biggest end of the spectrum. With a nine metre diameter and a pole as high as a four-storey house, this is the most efficient form of wind micro-turbine, and the sort of thing you would install only if you had plenty of space and money. According to one estimate, a 15-kW micro-turbine (that’s one with the maximum output), costing £41,000 to purchase and install, is capable of delivering 24,000 kilowatt-hours (kWh)** of electricity each year if placed on a suitably windy site.</p>
                  <p><strong>B</strong> I don’t know of any credible studies of the greenhouse gas emissions involved in producing and installing turbines, so my estimates here are going to be even more broad than usual. However, it is worth trying. If turbine manufacture is about as carbon intensive per pound sterling of product as other generators and electrical motors, which term a reasonable assumption, the carbon intensity of manufacture will be around 640 kilograms (kg) per £1,000 of value. Installation is probably about as carbon intensive as typical construction, at around 380 kg per £1,000, that makes the carbon footprint (the total amount of greenhouse gases that installing a turbine creates) 30 tonnes.</p>
                  <p><strong>C</strong> The carbon savings from wind-powered electricity generation depend on the carbon intensity of the electricity that you’re replacing. Let’s assume that your generation replaces the coal-fuelled part of the country’s energy mix. In other words, if you live in the UK, let’s say that rather than replacing typical grid electricity, which comes from a mix of coal, gas, oil and renewable energy sources, the effect of your turbine is to reduce the use of coal-fired power stations. That’s reasonable, because coal is the least preferable source in the electricity mix. In this case, the carbon saving is roughly one kilogram per kWh, so you save 25 tonnes per year and pay back the embodied carbon in just 14 months – a great start.</p>
                  <p><strong>D</strong> The UK government has recently introduced a subsidy for renewable energy that pays individual producers 24p per energy unit on top of all the money they save on their own fuel bill, and on selling surplus electricity back to the grid at approximately 5p per unit. With all this taken into account, individuals would get back £7,250 per year on their investment. That pays back the cost in about six years. It makes good financial sense and, for people who care about the carbon investment, it pays back in just over a year, and every year after that is a 25-tonne carbon saving. It’s important to remember that all these sums rely on a wind turbine having a favourable location.)</p>
                  <p><strong>E</strong> So, at face value, the turbine looks like a great idea environmentally, and a fairly good long-term investment economically for the person installing it. However, there is a crucial perspective missing from the analysis so far. Has the government spent its money wisely? It has invested 24p per unit into each micro-turbine. That works out at a massive £250 per tonne of carbon saved. My calculations tell me that had the government invested its money in offshore wind farms, instead of subsidising small-scale turbines, they would have broken even after eight years. In other words, the micro-turbine works out as a good investment for individuals, but only because the government spends, and arguably wastes, so much money subsidising it. Carbon savings are far lower too.</p>
                  <p><strong>F</strong> Nevertheless, although the micro-wind turbine subsidy doesn’t look like the very best way of spending government resources on climate change mitigation, we are talking about investing only about 0.075 percent per year of the nation’s GDP to get a one percent reduction in carbon emissions, which is a worthwhile benefit. In other words, it could be much better, but it could be worse. In addition, such investment helps to promote and sustain developing technology.</p>
                  <p><strong>G</strong> There is one extra favourable way of looking at the micro-wind turbine, even if it is not the single best way of investing money in cutting carbon. Input-output modelling has told us that it is actually quite difficult to spend money without having a negative carbon impact. So if the subsidy encourages people to spend their money on a carbon-reducing technology such as a wind turbine, rather than on carbon-producing goods like cars, and services such as overseas holidays, then the reductions in emissions will be greater than my simple sums above have suggested.</p>
                  <p>* a type of engine</p>
                  <p>** a unit for measuring electrical power</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold text-xl">Pottery production in ancient Akrotiri</h3>
                  <p>Excavations at the site of prehistoric Akrotiri, on the coast of the Aegean Sea, have revealed much about the technical aspects of pottery manufacture, indisputably one of the basic industries of this Greek city. However, considerably less is known about the socio-economic context and the way production was organised.</p>
                  <p>The bulk of pottery found at Akrotiri is locally made, and dates from the late fifteenth century BC. It clearly fulfilled a vast range of the settlement’s requirements and was used for cooking, storage, eating and drinking. The pottery found includes a wide variety of functional types like storage jars, smaller containers, pouring vessels, cooking pots, drinking vessels and so on, which all relate to specific activities and which would have been made and distributed with those activities in mind. Given the large number of shapes produced and the high degree of standardisation, it has generally been assumed that most, if not all, of Akrotiri pottery was produced by specialised craftsmen in a non-domestic context. Unfortunately, no kilns have been found in the excavated areas. The reason may be that the ceramic workshops were located on the periphery of the site, which has not yet been excavated. In any event, the ubiquity of the pottery, and the consistent repetition of the same types in different sizes, suggests production on an industrial scale.</p>
                  <p>The Akrotirian potters seem to have responded to pressures beyond their households, namely to the increasing complexity of regional distribution and exchange systems. We can imagine them as full-time craftsmen, working permanently in a high production-rate craft such as pottery manufacture and supporting themselves entirely from the proceeds of their craft. A view of the above can be argued specifically in terms of time-of-use-produced pottery and the existence of organised workshops of craftsmen during the period 1550–1500 BC. Yet, how pottery production was organised at Akrotiri remains an open question. There is no real documentary evidence. Our entire knowledge comes from the ceramic material itself, and the tentative conclusions which can be drawn from it.</p>
                  <p>The invention of units of quantity and of a numerical system to count them was of capital importance for an exchange-geared society such as that of Akrotiri. In spite of the absence of any written records of archaeological evidence reveals that concepts of measurements, both of weight and number, had been formulated. Standard measures may already have been in operation such as those evidenced by a graduated series of lead weights – made in disc form – found at the site. The existence of a unit of capacity in Late Bronze Age times is also evidenced, by the mention of units of a liquid measure for wine on excavated containers.</p>
                  <p>It must be recognised that the function of pottery vessels plays a very important role in determining their characteristics. The intended function affects the choice of clay, the production technique, and the shape and the size of the pots. For example, large storage jars (pithoi) would be needed to store commodities, whereas smaller containers would be used for transport. In fact, the length of a man’s arm limits the size of a smaller pot to a capacity of about twenty litres; that is also the maximum a man can comfortably carry.</p>
                  <p>The various sizes of container would thus represent standard quantities of a commodity, which is a fundamental element in the function of exchange. Akrotirian merchants handling a commodity such as wine would have been able to determine easily the amount of wine they were transporting from the number of containers they carried in their ships, since the capacity of each container was known to be 14–18 litres. (We could draw a parallel case with the current practice in Greece of selling oil in 17 kilogram tins.)</p>
                  <p>We may therefore assume that the shape, capacity, and sometimes decoration of vessels are indicative of the commodity contained by them. Since individual transactions would normally involve different quantities of a given commodity, a range of ‘standardised’ types of vessel would be needed to meet traders’ requirements.</p>
                  <p>In trying to reconstruct systems of capacity by measuring the volume of excavated pottery, a rather generous range of tolerances must be allowed. It seems possible that the potters of that time had specific sizes of vessel in mind, and tried to reproduce them using a specific type and amount of clay. However, it would be quite difficult for them to achieve the exact size required every time, without any mechanical means of regulating symmetry and wall thickness, and some potters would be more skilled than others. In addition, variations in the repetition of types and size may also occur because of unforeseen circumstances during the throwing process. For instance, instead of destroying the entire pot if the clay in the rim contained a piece of grit, a potter might produce a smaller pot by simply cutting off the rim. Even where there is no noticeable external difference between pots meant to contain the same quantity of a commodity, differences in their capacity can actually reach one or two litres. In one case the deviation from the required size appears to be as much as 10–20 percent.</p>
                  <p>The establishment of regular trade routes within the Aegean led to increased movement of goods; consequently a regular exchange of local, luxury and surplus goods, including metals, would have become feasible as a result of the advances in transport technology. The increased demand for standardised transactions, inextricably linked to commercial transactions, might have been one of the main factors which led to the standardisation of pottery production. Thus, the whole network of ceramic production and exchange would have depended on specific regional economic conditions, and would reflect the socio-economic structure of prehistoric Akrotiri.</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-5</h3><p>Complete the flow chart below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">The history of sports and physical science in Australia</h4>
                        <p className="text-center">A lot of people identified as being <strong>1</strong> <Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /></p>
                        <p className="text-center">↓</p>
                        <p className="text-center">Introduction of PE to <strong>2</strong> <Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} /></p>
                        <p className="text-center">↓</p>
                        <p className="text-center">Special training programmes for <strong>3</strong> <Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} /></p>
                        <p className="text-center">↓</p>
                        <p className="text-center"><strong>4</strong> <Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} /> of PE graduates</p>
                        <p className="text-center">↓</p>
                        <p className="text-center">Identification of alternative <strong>5</strong> <Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} /></p>
                        <p className="text-center">↓</p>
                        <p className="text-center">Diversification of course delivery</p>
                      </div>
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6-13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>6</strong> Sport is generally regarded as a profitable area for investment.</p><Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>7</strong> Rupert Murdoch has a personal as well as a business interest in sport.</p><Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>8</strong> The range of career opportunities available to sport graduates is increasing.</p><Input value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>9</strong> The interests of business and the interests of universities are linked.</p><Input value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>10</strong> Governments have been focusing too much attention on preventative medicine.</p><Input value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>11</strong> It is inevitable that government priorities for health spending will change.</p><Input value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>12</strong> Existing degree courses are unsuitable for careers in community health.</p><Input value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>13</strong> Funding for sport science and related degrees has been increased considerably.</p><Input value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-20</h3><p>Reading Passage 2 has SEVEN paragraphs, A-G. Choose the correct heading for each paragraph from the list of headings below. Write the correct number, i-ix.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                      <p className="font-bold">List of Headings</p>
                      <ul className="list-roman list-inside ml-2">
                        <li>i A better use for large sums of money.</li>
                        <li>ii The environmental costs of manufacture and installation.</li>
                        <li>iii Estimates of the number of micro-turbines in use.</li>
                        <li>iv The environmental benefits of running a micro-turbine.</li>
                        <li>v The size and output of the largest type of micro-turbine.</li>
                        <li>vi A limited case for subsidising micro-turbines.</li>
                        <li>vii Recent improvements in the design of micro-turbines.</li>
                        <li>viii An indirect method of reducing carbon emissions.</li>
                        <li>ix The financial benefits of running a micro-turbine.</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <p><strong>14</strong> Paragraph A</p><Input value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>15</strong> Paragraph B</p><Input value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>16</strong> Paragraph C</p><Input value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>17</strong> Paragraph D</p><Input value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>18</strong> Paragraph E</p><Input value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>19</strong> Paragraph F</p><Input value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>20</strong> Paragraph G</p><Input value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21-22</h3><p>Choose <strong>TWO</strong> letters, A-E. The list below contains some possible statements about micro wind-turbines. Which <strong>TWO</strong> of these statements are made by the writer of the passage?</p>
                      <div className="space-y-2 mt-4">
                          {['In certain areas, permission is required to install them.', 'Their exact energy output depends on their position.', 'They probably take less energy to make than other engines.', 'The UK government contributes towards their purchase cost.', 'They can produce more energy than a household needs.'].map((opt, i) => 
                            <label key={i} className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                value={String.fromCharCode(65 + i)} 
                                checked={multipleAnswers['21_22'].includes(String.fromCharCode(65 + i))} 
                                onChange={(e) => handleMultiSelect('21_22', e.target.value)} 
                                disabled={!isTestStarted || submitted} 
                              />
                              <span>{String.fromCharCode(65+i)} {opt}</span>
                            </label>
                          )}
                      </div>
                      {renderMultiSelectStatus('21_22', ['B', 'E'])}
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23-26</h3><p>Complete the sentences below. Choose <strong>NO MORE THAN THREE WORDS</strong> from the passage for each answer.</p>
                      <div className="space-y-4 mt-4">
                        <p><strong>23</strong> <Input value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /> would be a more effective target for government investment than micro-turbines.</p>
                        <p><strong>24</strong> An indirect benefit of subsidising micro-turbines is the support it provides for <Input value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} />.</p>
                        <p><strong>25</strong> Most spending has a <Input value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> effect on the environment.</p>
                        <p><strong>26</strong> If people buy a micro-turbine, they have less money to spend on things like foreign holidays and <Input value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} />.</p>
                      </div>
                    </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-28</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-4">
                      <p><strong>27</strong> What does the writer say about items of pottery excavated at Akrotiri?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">There was very little duplication.</li><li className="ml-2">They would have met a big variety of needs.</li><li className="ml-2">Most of them had been imported from other places.</li><li className="ml-2">The intended purpose of each piece was unclear.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      
                      <p><strong>28</strong> The assumption that pottery from Akrotiri was produced by specialists is partly based on</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">the discovery of kilns.</li><li className="ml-2">the central location of workshops.</li><li className="ml-2">the sophistication of decorative patterns.</li><li className="ml-2">the wide range of shapes represented.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 29-32</h3><p>Complete each sentence with the correct ending, A-F, below.</p>
                    <div className="space-y-4">
                      <p><strong>29</strong> The assumption that standard units of weight were in use could be based on</p><Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> Evidence of the use of standard units of volume is provided by</p><Input value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> The size of certain types of containers would have been restricted by</p><Input value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                      <p><strong>32</strong> Attempts to identify the intended capacity of containers are complicated by</p><Input value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                      <p><strong>A</strong> the discovery of a collection of metal discs.</p>
                      <p><strong>B</strong> the size and type of the sailing ships in use.</p>
                      <p><strong>C</strong> variations in the exact shape and thickness of similar containers.</p>
                      <p><strong>D</strong> the physical characteristics of workmen.</p>
                      <p><strong>E</strong> marks found on wine containers.</p>
                      <p><strong>F</strong> the variety of commodities for which they would have been used.</p>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-38</h3><p>Do the following statements agree with the claims of the writer? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>33</strong> There are plans to excavate new areas of the archaeological site in the near future.</p><Input value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />
                      <p><strong>34</strong> Some of the evidence concerning pottery production in ancient Akrotiri comes from written records.</p><Input value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} />
                      <p><strong>35</strong> Pots for transporting liquids would have held no more than about 20 litres.</p><Input value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} />
                      <p><strong>36</strong> It would have been hard for merchants to calculate how much wine was on their ships.</p><Input value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />
                      <p><strong>37</strong> The capacity of containers intended to hold the same amounts differed by up to 20 percent.</p><Input value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} />
                      <p><strong>38</strong> Regular trading of goods around the Aegean would have led to the general standardisation of quantities.</p><Input value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 39-40</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-4">
                    <p><strong>39</strong> What does the writer say about the standardisation of container sizes?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">Containers which looked the same from the outside often varied in capacity.</li><li className="ml-2">The instruments used to control container size were unreliable.</li><li className="ml-2">The unsystematic use of different types of clay resulted in size variations.</li><li className="ml-2">Potters usually discarded containers which were of a non-standard size.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} />
                    <p><strong>40</strong> What is probably the main purpose of Reading Passage 3?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">To evaluate the quality of pottery containers found in prehistoric Akrotiri.</li><li className="ml-2">To suggest how features of pottery production in Akrotiri reflected other developments in the region.</li><li className="ml-2">To outline the development of pottery-making skills in ancient Greece.</li><li className="ml-2">To describe methods for storing and transporting household goods in prehistoric societies.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} />
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { 
          let userAnswer: string = '';
          let correctAnswer: string = '';
          let isCorrect: boolean = false;
          
          if (['21', '22'].includes(qNum)) {
            userAnswer = (multipleAnswers['21_22'] || []).join(', ');
            correctAnswer = 'B, E';
            isCorrect = checkAnswer(qNum);
            if (qNum === '22') return null; // Skip Q22 since we show Q21-22 together
          } else {
            userAnswer = answers[qNum] || '(none)';
            correctAnswer = String(correctAnswers[qNum as keyof typeof correctAnswers]);
            isCorrect = checkAnswer(qNum);
          }
          
          const questionDisplay = qNum === '21' ? 'Q21-22' : `Q${qNum}`;
          return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">{questionDisplay}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {userAnswer}</div>{!isCorrect && <div>Correct: {correctAnswer}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <PageViewTracker 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={2}
          />
          <TestStatistics 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={2}
          />
          <UserTestHistory 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={2}
          />
        </div>
      </div>
    </div>
  )
}