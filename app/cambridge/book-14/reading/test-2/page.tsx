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

export default function Book14ReadingTest2() {
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
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) { handleSubmit(); return 0; }
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value }))
  }

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const userAnswer = answers[questionNumber] || ''
    if (!userAnswer) return false;
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const questionNumber of Object.keys(correctAnswers)) {
      if (checkAnswer(questionNumber)) correctCount++;
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      // Save test score using test-score-saver
      const result = await saveTestScore({
        book: 'book-14',
        module: 'reading',
        testNumber: 2,
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
      
      setSubmitted(true);
      setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    setAnswers({}); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'FALSE', '2': 'TRUE', '3': 'NOT GIVEN', '4': 'FALSE', '5': 'NOT GIVEN', '6': 'TRUE', '7': 'TRUE', '8': 'TRUE',
    '9': 'merchant', '10': 'equipment', '11': 'gifts', '12': 'canoe', '13': 'mountains', '14': 'F', '15': 'C', '16': 'E', '17': 'D',
    '18': 'B', '19': 'design(s)', '20': 'pathogens', '21': 'tuberculosis', '22': 'wards', '23': 'communal', '24': 'public',
    '25': 'miasmas', '26': 'cholera', '27': 'vi', '28': 'i', '29': 'ii', '30': 'v', '31': 'iv', '32': 'vii', '33': 'iii',
    '34': 'viii', '35': 'productive', '36': 'perfectionists', '37': 'dissatisfied', '38': 'TRUE', '39': 'FALSE', '40': 'NOT GIVEN'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-14" module="reading" testNumber={2} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 14 - Reading Test 2</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6">
            <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
                        <div className="text-sm text-gray-600">Time Remaining</div>
                    </div>
                    {!isTestStarted && !submitted ? (
                        <Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>
                    ) : (
                        <div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>
                            {submitted ? 'Test Completed' : 'Test in Progress'}
                        </div>
                    )}
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
                     <p className="text-center font-bold text-gray-800 mb-4">Alexander Henderson (1831–1913)</p>
                     <p className="italic text-center mb-4">Born in Scotland, Henderson emigrated to Canada in 1855 and became a well-known landscape photographer</p>
                     <p>Alexander Henderson was born in Scotland in 1831 and was the son of a successful merchant. His grandfather, also called Alexander, had founded the family business, and later became the first chairman of the National Bank of Scotland. The family had extensive landholdings in Scotland. Besides its residence in Edinburgh, it owned Press Estate, 650 acres of farmland about 35 miles southeast of the city. The family often stayed at Press Castle, the large mansion on the northern edge of the property, and Alexander spent much of his childhood in the area, playing on the beach near Eyemouth or fishing in the streams nearby.</p>
                     <p>Even after he went to school at Murcheston Academy on the outskirts of Edinburgh, Henderson returned to Press at weekends. In 1849 he began a three-year apprenticeship to become an accountant. Although he never liked the prospect of a business career, he stayed with it to please his family. In October 1855, however, he emigrated to Canada with his wife Agnes Elder Robertson and they settled in Montreal.</p>
                     <p>Henderson learned photography in Montreal around 1857 and quickly took it up as a serious amateur. He became a personal friend and colleague of the Scottish-Canadian photographer William Notman. The two men made a photographic excursion to Niagara Falls in 1860 and they cooperated on experiments with magnesium flares as a source of artificial light in 1865. They belonged to the same societies and were among the founding members of the Art Association of Montreal. Henderson acted as chairman of the association’s first meeting, which was held in Notman’s studio on 11 January 1860.</p>
                     <p>In spite of their friendship, their styles of photography were quite different. While Notman’s landscapes were noted for their bold realism, Henderson for the first 20 years of his career produced romantic images, showing the strong influence of the British landscape tradition. His artistic and technical progress was rapid and in 1865 he published his first major collection of landscape photographs. The publication had limited circulation (only seven copies have ever been found), and was called Canadian Views and Studies. The contents of each copy vary significantly and have proved a useful source for evaluating Henderson’s early work.</p>
                     <p>In 1866, he gave up his business to open a photographic studio, advertising himself as a portrait and landscape photographer. From about 1870 he dropped portraiture to specialize in landscape photography and other views. His numerous photographs of city life revealed in street scenes, houses, and markets are alive with human activity, and although his favourite subject was the landscape he usually composed his scenes around such human pursuits as farming the land, cutting ice on a river, or sailing down a woodland stream. There was sufficient demand for these types of scenes and others he took depicting the lumber trade, steamboats and waterfalls to enable him to make a living. There was little competing hobby or amateur photography before the late 1880s because of the time-consuming techniques involved and the weight of the equipment. People wanted to buy photographs as souvenirs of a trip or as gifts, and catering to this market, Henderson had stock photographs on display at his studio for mounting, framing, or inclusion in albums.</p>
                     <p>Henderson frequently exhibited his photographs in Montreal and abroad, in London, Edinburgh, Dublin, Paris, New York, and Philadelphia. He met with greater success in 1877 and 1878 in New York when he won first prizes in the exhibition held by E and H T Anthony and Company for landscapes using the Lambertype process. In 1878 his work won second prize at the world exhibition in Paris.</p>
                     <p>In the 1870s and 1880s, Henderson travelled widely throughout Quebec and Ontario, in Canada, documenting the major cities of the two provinces and many of the villages in Quebec. He was especially fond of the wilderness and often travelled by canoe on the Blanche, du Lièvre, and other noted eastern rivers. He went on several occasions to the Maritimes and in 1872 he sailed by yacht along the lower north shore of the St Lawrence River. That same year, while in the lower St Lawrence region, he took some photographs of the construction of the Intercolonial Railway. This undertaking led in 1875 to a commission from the railway to record the principal structures along the almost-completed line connecting Montreal to Halifax. Commissions from other railways followed. In 1876 he photographed bridges on the Quebec, Montreal, Ottawa and Occidental Railway between Montreal and Ottawa. In 1885 he went west along the Canadian Pacific Railway (CPR) as far as Rogers Pass in British Columbia, where he took photographs of the mountains and the progress of construction.</p>
                     <p>In 1892 Henderson accepted a full-time position with the CPR as manager of a photographic department which he was to set up and administer. His duties included spending four months in the field each year. That summer he made his second trip west, photographing extensively along the railway line as far as Victoria. He continued in this post until 1897, when he retired completely from photography.</p>
                     <p>When Henderson died in 1913, his huge collection of glass negatives was stored in the basement of his house. Today collections of his work are held at the National Archives of Canada, Ottawa, and the McCord Museum of Canadian History, Montreal.</p>
               
               <p>Henderson learned photography in Montreal around the year 1857 and quickly took it up as a serious amateur. He became a personal friend and colleague of the Scottish–Canadian photographer William Notman. The two men made a photographic excursion to Niagara Falls in 1860 and they cooperated on experiments with magnesium flares as a source of artificial light in 1865. They belonged to the same societies and were among the founding members of the Art Association of Montreal. Henderson acted as chairman of the association’s first meeting, which was held in Notman’s studio on 11 January 1860.</p>

<p>In spite of their friendship, their styles of photography were quite different. While Notman’s landscapes were noted for their bold realism, Henderson for the first 20 years of his career produced romantic images, showing the strong influence of the British landscape tradition. His artistic and technical progress was rapid and in 1865 he published his first major collection of landscape photographs. The publication had limited circulation (only seven copies have ever been found), and was called <i>Canadian Views and Studies</i>. The contents of each copy vary significantly and have proved a useful source for evaluating Henderson’s early work.</p>

                </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Back to the future of skyscraper design</p>
                   
    
    <p>Answers to the problem of excessive electricity use by skyscrapers and large public buildings can be found in ingenious but forgotten architectural designs of the 19th and early-20th centuries.</p>
    
    <p>The Recovery of Natural Environments in Architecture by Professor Alan Short is the culmination of 30 years of research and award-winning green building design by Short and colleagues in Architecture, Engineering, Applied Maths and Earth Sciences at the University of Cambridge.</p>
    
    <p>The crisis in building design is already here,' said Short. 'Policy makers think you can solve energy and building problems with gadgets. You can't. As global temperatures continue to rise, we are going to continue to squander more and more energy on keeping our buildings mechanically cool until we have run out of capacity.'</p>
    
    <p>Short is calling for a sweeping reinvention of how skyscrapers and major public buildings are designed – to end the reliance on sealed buildings which exist solely via the life support system of vast air conditioning units.</p>
    
    <p>Instead, he shows it is entirely possible to accommodate natural ventilation and cooling in large buildings by looking into the past, before the widespread introduction of air conditioning systems, which were 'relentlessly and aggressively marketed' by their inventors.</p>
    
    <p>Short points out that to make most contemporary buildings habitable, they have to be sealed and air-conditioned. The energy use and carbon emissions this generates is spectacular and largely unnecessary. Buildings in the West account for 40-50% of electricity usage, generating substantial carbon emissions, and the rest of the world is catching up at a frightening rate. Short regards glass, steel and air-conditioned skyscrapers as symbols of status, rather than practical ways of meeting our requirements.</p>
    
    <p>Short's book highlights a developing art and science of building operating buildings through the 19th and earlier-20th centuries, including the design of ingeniously ventilated hospitals. Of particular interest were those built to the designs of John Shaw Billings, including the first Johns Hopkins Hospital in the US city of Baltimore (1873–1889).</p>
    
    <p>'We spent three years digitally modelling Billings' final designs,' says Short. 'We put pathogens in the airstreams, modelled for someone with tuberculosis (TB) coughing in the wards and we found the ventilation systems in the room would have kept other patients safe from harm.'</p>
    
    <p>'We discovered that 19th-century hospital wards could generate up to 24 air changes an hour – that's similar to the performance of a modern-day, computer-controlled operating theatre. We believe you could build wards based on these principles now.</p>
    
    <p>Single rooms are not appropriate for all patients. Communal wards appropriate for certain patients – older people with dementia, for example – would work just as well in today's hospitals at a fraction of the energy cost.'</p>
    
    <p>Professor Short contends the mindset and skill-sets behind these designs have been completely lost, lamenting the disappearance of expertly designed theatres, opera houses, and other buildings where up to half the volume of the building was given over to ensuring everyone got fresh air.</p>
    
    <p>Much of the ingenuity present in 19th-century hospital and building design was driven by a patholed public clamouring for buildings that could protect against what was thought to be the lethal threat of miasmas – toxic air that spread disease. Miasmas were feared as the principal agents of disease and epidemics for centuries, and were used to explain the spread of infection from the Middle Ages right through to the cholera outbreaks in London and Paris during the 1850s. Foul air, rather than germs, was believed to be the main driver of hospital fever', leading to disease and frequent death. The prosperous sheltered clear of hospitals.</p>
    
    <p>While miasma theory has been long since disproved, Short has for the last 30 years advocated a return to some of the building design principles produced in its wake.</p>
    
    <p>Today, huge amounts of a building's space and construction cost are given over to air conditioning,' But I have designed and built a series of buildings over the past three decades which have tried to reinvent some of these ideas and then measure what happens.</p>
    
    <p>'To go forward into our new low-energy, low-carbon future, we would be well advised to look back at design before our high-energy, high-carbon present appeared. What is surprising is what a rich legacy we have abandoned.'</p>
    
    <p>Successful examples of Short's approach include the Queen's Building at De Montfort University in Leicester. Containing as many as 2,000 staff and students, the entire building is naturally ventilated, passively cooled and naturally lit – including the two largest auditoria, each seating more than 150 people. The award-winning building uses a fraction of the electricity of comparable buildings of its type.</p>
    
    <p>Short considers that glass skyscrapers in London and around the world will become a liability over the next 20 or 30 years if climate modelling predictions and energy price rises come to pass as expected.</p>
    
    <p>He is convinced that sufficiently cooled skyscrapers using the natural environment can be produced in almost any climate. He and his team have worked on hybrid buildings in the harsh climates of Beijing and Chicago – built with natural ventilation assisted by back-up air conditioning – which, surprisingly perhaps, can be switched off more than half the time at midder days and during the spring and autumn.</p>
    
    <p>Short looks at how we might reimagine the cities, offices and homes of the future. Maybe it's time we changed our outlook.</p>

                     </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                      <h1 className="text-center font-bold text-gray-800 mb-4">Why companies should welcome disorder</h1>
    
    <div className="section">
        <div className="section-label">A</div>
        <p>Organisations big business. Whether it is 10 or five – all those ribbons and calendars – or how companies are structured, a multi-billion dollar industry helps to meet this need.</p>
        
        <p>We have more strategies for true management, project management and self-organisation than at any other time in human history. We are told that we ought to organise our company, our home life, our work, our day and even our sleep, all as a means to becoming more productive. Every week, countless seminars and workshops take place around the world or rolls projects that they ought to structure their lives in order to achieve this.</p>
        
        <p>This disorder has also crept into the thinking of business leaders and entrepreneurs, much to the delight of self-proclaimed perfectionist with the need to get everything right. The number of business schools and graduates has massively increased over the past 50 years, full of businesslike people looking for structures.</p>
    </div>

    <div className="section">
        <div className="section-label">B</div>
        <p>Ironically, however, the number of businesses that fail has also steadily increased. Work-related stress has increased. A large proportion of workers from all demographics claim to be dissatisfied with the way their work is structured and the way they are managed.</p>
        
        <p>This begs the question: what has gone wrong? Why is it that on paper the drive for organisation seems a sure shot for increasing productivity, but in reality this well short of the mark?</p>
    </div>

    <div className="section">
        <div className="section-label">C</div>
        <p>This has been a problem for a while now. Frederick Taylor was one of the forefathers of scientific management. Writing in the first half of the 20th century, he designed a number of principles to improve the efficiency of the work process, which have since become widespread in modern companies. So his approach has been around for a while.</p>
    </div>

    <div className="section">
        <div className="section-label">D</div>
        <p>New research suggests that this obsession with efficiency is misguided. The problem is not necessarily the management theories or strategies we use to organise our work; it's the basic assumptions we hold in approaching how we work. Here it's the assumption that order is a necessary condition for productivity. This assumption has also fostered the idea that disorder must be detrimental to organisational productivity. The result is that businesses and people spend time and money organising themselves for the sake of organising, rather than actually looking at the end goal and usefulness of such an effort.</p>
    </div>

    <div className="section">
        <div className="section-label">E</div>
        <p>What's more, recent studies show that order actually has diminishing returns. Order does increase productivity to a certain extent, but eventually the usefulness of the processes, organisation, and the benefit it yields, reduce until the point where any further increase in organisation becomes a liability rather than an asset. This is like diminishing something that weighs the benefits of doing it, then that thing ought not to be formally structured. Instead, the resources involved can be better used elsewhere.</p>
    </div>

    <div className="section">
        <div className="section-label">Test 2</div>
    </div>

    <div className="section">
        <div className="section-label">F</div>
        <p>In fact, research shows that, when innovating, the best approach is to create an environment devoted to creative and insanity and enable everyone involved to engage in one organic group. These environments can lead to new solutions that, under conventionally structured environments (filled with bottlenecks in terms of information flow, power structures, rules, and routines) would never be reached.</p>
    </div>

    <div className="section">
        <div className="section-label">G</div>
        <p>In recent times companies have slowly started to embrace this disorganisation. Many of them embrace it in terms of perception (embracing the idea of disorder, as opposed to forming it) and in terms of process (putting mechanisms in place to reduce structure).</p>
        
        <p>For example, Oticon, a large Danish manufacturer of hearing aids, used what it called a "spaghetti" structure in order to reduce the organisation's rigid hierarchies. This involved the elimination of job titles, departments and the formal amounts of ownership over their own time and projects. This approach proved to be highly successful initially, with clear improvements in worker productivity in all facets of the business.</p>
        
        <p>In similar fashion, the former chairman of General Electric embraced disorganisation, insisting forward the idea of the "boundaryless" organisation. Again, it involves breaking down the barriers between different parts of a company and encouraging virtual collaboration and flexible working. Google and a number of other tech companies have embraced (at least in part) these kinds of flexible structures, facilitated by technology and strong company values which place people together.</p>
    </div>

    <div className="section">
        <div className="section-label">H</div>
        <p>A word of warning to others thinking of jumping on this bandwagon: the evidence so far suggests that while the whole idea seems to have eliminating silos, and can also have detrimental effects on performance if over-used. Like order, disorder should be embraced only so far as it is useful. But we should not fear it – nor venerate one over the other. The research just shows that we should continually question whether or not our existing assumptions are right.</p>
    </div>

                    
                     </CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button>
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-26</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 27-40</button>
                </div>
              </div>
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-8</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        {[
                            { num: 1, text: "Henderson rarely visited the area around Press Estate when he was younger." },
                            { num: 2, text: "Henderson pursued a business career because it was what his family wanted." },
                            { num: 3, text: "Henderson and Notman were surprised by the results of their 1865 experiment." },
                            { num: 4, text: "There were many similarities between Henderson’s early landscapes and those of Notman." },
                            { num: 5, text: "The studio that Henderson opened in 1866 was close to his home." },
                            { num: 6, text: "Henderson gave up portraiture so that he could focus on taking photographs of scenery." },
                            { num: 7, text: "Henderson’s last work as a photographer was with the Canadian Pacific Railway." },
                            { num: 8, text: "Henderson’s photographs were on display in his studio for a limited time." }
                        ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus(String(q.num)) === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>))}
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9-13</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <h4 className="font-bold text-center">Alexander Henderson</h4>
                        <h5><b>Early life</b></h5>
                        <p>• was born in Scotland in 1831 – father was a <strong>9</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p>• trained as an accountant, emigrated to Canada in 1855</p>
                        <h5><b>Start of a photographic career</b></h5>
                        <p>• opened up a photographic studio in 1866</p>
                        <p>• took photos of city life, but preferred landscape photography</p>
                        <p>• people bought Henderson’s photos because photography <strong>10</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} /> was heavy and time-consuming</p>
                        <p>• the photographs Henderson sold were <strong>11</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} /> or souvenirs</p>
                        <h5><b>Travelling as a professional photographer</b></h5>
                        <p>• travelled widely in Quebec and Ontario in 1870s and 1880s</p>
                        <p>• took many trips along eastern rivers in a <strong>12</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} /></p>
                        <p>• worked for Canadian railways between 1875 and 1897</p>
                        <p>• worked for CPR in 1885 and photographed the <strong>13</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} /> and the railway at Rogers Pass</p>
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p>Reading Passage 2 has nine sections, A–I. Which section contains the following information?</p>
                  <div className="space-y-4 mt-4">
                      {[
                          { num: 14, text: "why some people avoided hospitals in the 19th century" },
                          { num: 15, text: "a suggestion that the popularity of tall buildings is linked to prestige" },
                          { num: 16, text: "a comparison between the circulation of air in a 19th-century building and modern standards" },
                          { num: 17, text: "how Short tested the circulation of air in a 19th-century building" },
                          { num: 18, text: "an implication that advertising led to the large increase in the use of air conditioning" }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500 bg-green-50' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-26</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">Ventilation in 19th-century hospital wards</h4>
                      <p>Professor Alan Short examined the work of John Shaw Billings, who influenced the architectural <strong>19</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /> of hospitals to ensure they had good ventilation. He calculated that <strong>20</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} /> in the air coming from patients suffering from <strong>21</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} /> would not have harmed other patients. He also found that the air in <strong>22</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22',e.target.value)} disabled={!isTestStarted || isSubmitting} /> in hospitals could change as often as in a modern operating theatre. He suggests that energy use could be reduced by locating more patients in <strong>23</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} /> areas.</p>
                      <p>A major reason for improving ventilation in 19th-century hospitals was the demand from the <strong>24</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} /> for protection against bad air, known as <strong>25</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} />. These were blamed for the spread of disease for hundreds of years, including epidemics of <strong>26</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} /> in London and Paris in the middle of the 19th century.</p>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–34</h3><p className="mb-4 text-sm">Reading Passage 3 has eight sections, A–H.</p><p className="mb-4 text-sm font-medium"><em>Choose the correct heading for each section from the list of headings below.</em></p><p className="mb-4 text-sm font-medium"><em>Write the correct number, i–ix, in boxes 27–34 on your answer sheet.</em></p>
                  <div className="bg-gray-50 p-4 rounded border mb-6">
                      <h4 className="font-semibold mb-3 text-center">List of Headings</h4>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">i</span><span>Complaints about the impact of a certain approach</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">ii</span><span>Fundamental beliefs that are in fact incorrect</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">iii</span><span>Early recommendations concerning business activities</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">iv</span><span>Organisations that put a new approach into practice</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">v</span><span>Companies that have suffered from changing their approach</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">vi</span><span>What people are increasingly expected to do</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">vii</span><span>How to achieve outcomes that are currently impossible</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">viii</span><span>Neither approach guarantees continuous improvement</span></div>
                        <div className="flex items-start"><span className="font-bold mr-3 min-w-[1rem]">ix</span><span>Evidence that a certain approach can have more disadvantages than advantages</span></div>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {[
                        { number: '27', text: 'Section A' },
                        { number: '28', text: 'Section B' },
                        { number: '29', text: 'Section C' },
                        { number: '30', text: 'Section D' },
                        { number: '31', text: 'Section E' },
                        { number: '32', text: 'Section F' },
                        { number: '33', text: 'Section G' },
                        { number: '34', text: 'Section H' }
                      ].map(({ number, text }) => (
                        <div key={number} className="flex items-center space-x-3">
                          <span className="font-medium min-w-[1.5rem]">{number}</span>
                          <p className="flex-1 text-sm">{text}</p>
                          <select 
                            value={answers[number] || ''} 
                            onChange={(e) => handleAnswerChange(number, e.target.value)}
                            className={`w-20 px-2 py-1 border rounded text-sm ${getAnswerStatus(number) === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus(number) === 'incorrect' ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            disabled={!isTestStarted || isSubmitting}
                          >
                            <option value="">Select</option>
                            <option value="i">i</option>
                            <option value="ii">ii</option>
                            <option value="iii">iii</option>
                            <option value="iv">iv</option>
                            <option value="v">v</option>
                            <option value="vi">vi</option>
                            <option value="vii">vii</option>
                            <option value="viii">viii</option>
                            <option value="ix">ix</option>
                          </select>
                        </div>
                      ))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 35–37</h3><p>Complete the sentences below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="space-y-4">
                      <p><strong>35</strong> Numerous training sessions are aimed at people who feel they are not <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} /> enough.</p>
                      <p><strong>36</strong> Being organised appeals to people who regard themselves as <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} />.</p>
                      <p><strong>37</strong> Many people feel <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} /> with aspects of their work.</p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38–40</h3><p>Do the following statements agree with the information given in Reading Passage 3? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>38</strong> Both businesses and people aim at order without really considering its value.</p><Input className={`max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>39</strong> Innovation is most successful if the people involved have distinct roles.</p><Input className={`max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      <p><strong>40</strong> Google was inspired to adopt flexibility by the success of General Electric.</p><Input className={`max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (
            <div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>
        )}

        {showResultsPopup && (
            <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
                    <div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div>
                    <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm">Your answer: {answers[qNum] || '(No answer)'}</div>{!isCorrect && <div className="text-sm">Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div>
                    <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
                </div>
            </div>
        )}

        <div className="max-w-4xl mx-auto px-4 mt-8">
          <TestStatistics book="book-14" module="reading" testNumber={2} />
          <UserTestHistory book="book-14" module="reading" testNumber={2} />
        </div>
      </div>
    </div>
  )
}