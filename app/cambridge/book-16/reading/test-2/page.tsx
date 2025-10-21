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

export default function Book16ReadingTest2() {
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
    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum in correctAnswers) {
      if (checkAnswer(qNum)) {
        correctCount++
      }
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, results: Object.keys(correctAnswers).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      // Save test score using test-score-saver
      const result = await saveTestScore({
        book: 'book-16',
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
    '1': 'TRUE', '2': 'NOT GIVEN', '3': 'TRUE', '4': 'FALSE', '5': 'FALSE', '6': 'TRUE', '7': 'TRUE', '8': 'NOT GIVEN', '9': 'Ridgeway', '10': 'documents', '11': 'soil', '12': 'fertility', '13': 'Rhiannon', '14': 'D', '15': 'C', '16': 'A', '17': 'G', '18': 'B', '19': 'H', '20': 'E', '21': 'YES', '22': 'NO', '23': 'NOT GIVEN', '24': 'YES', '25': 'NOT GIVEN', '26': 'NO', '27': 'B', '28': 'C', '29': 'B', '30': 'D', '31': 'D', '32': 'A', '33': 'C', '34': 'G', '35': 'E', '36': 'FALSE', '37': 'NOT GIVEN', '38': 'NOT GIVEN', '39': 'TRUE', '40': 'TRUE'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-16" module="reading" testNumber={2} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 16 - Reading Test 2</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div></div>
        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The White Horse of Uffington</p>
                     <p>The cutting of huge figures or ‘geoglyphs’ into the earth of English hillsides has taken place for more than 3,000 years. There are 56 hill figures scattered around England, with the vast majority on the chalk downlands of the country’s southern counties. The figures include giants, horses, crosses and regimental badges. Although the majority of these geoglyphs date within the last 300 years or so, there are one or two that are much older.</p>
                     <p>The most famous of these figures is perhaps also the most mysterious – the Uffington White Horse in Oxfordshire. The White Horse has recently been re-dated and shown to be even older than its previously assigned ancient pre-Roman Iron Age* date. More controversial is the date of the enigmatic Long Man of Wilmington in Sussex. While many historians are convinced the figure is prehistoric, others believe that it was the work of an artistic monk from a nearby priory and was created between the 11th and 15th centuries.</p>
                     <p>The method of cutting these huge figures was simply to remove the overlying grass to reveal the gleaming white chalk below. However, the grass would soon grow over the geoglyph again unless it was regularly cleaned or scoured by a fairly large team of people. One reason that the vast majority of hill figures have disappeared is that when the traditions associated with the figures faded, people no longer bothered or remembered to clear away the grass to expose the chalk outline. Furthermore, over hundreds of years the outlines would sometimes change due to people not always cutting in exactly the same place, thus creating a different shape to the original geoglyph. The fact that any ancient hill figures survive at all in England today is testament to the strength and continuity of local customs and beliefs which, in one case at least, must stretch back over millennia.</p>
                     <p>The Uffington White Horse is a unique, stylised representation of a horse consisting of a long, sleek back, thin disjointed legs, a streaming tail, and a bird-like beaked head. The elegant creature almost melts into the landscape. The horse is situated 2.5 km from Uffington village on a steep slope close to the Late Bronze Age* (c. 7th century BCE) hillfort of Uffington Castle and below the Ridgeway, a long-distance Neolithic** track.</p>
                     <p>The Uffington Horse is also surrounded by Bronze Age burial mounds. It is not far from the Bronze Age cemetery of Lambourn Seven Barrows, which consists of more than 30 well-preserved burial mounds. The carving has been placed in such a way as to make it extremely difficult to see from close quarters, and like many geoglyphs is best appreciated from the air. Nevertheless, there are certain areas of the Vale of the White Horse, the valley containing and named after the enigmatic creature, from which an adequate impression may be gained. Indeed on a clear day the carving can be seen from up to 30 km away.</p>
                     <p>The earliest evidence of a horse at Uffington is from the 1070s CE when ‘White Horse Hill’ is mentioned in documents from the nearby Abbey of Abingdon, and the first reference to the horse itself is soon after, in 1190 CE. However, the carving is believed to date back much further than that. Due to the similarity of the Uffington White Horse to the stylised depictions of horses on 1st century BCE coins, it had been thought that the creature must also date to that period.</p>
                     <p>However, in 1995 Optically Stimulated Luminescence (OSL) testing was carried out by the Oxford Archaeological Unit on soil from two of the lower layers of the horse’s body, and from another cut near the base. The result was a date for the horse’s construction somewhere between 1400 and 600 BCE – in other words, it had a Late Bronze Age or Early Iron Age origin.</p>
                     <p>The latter end of this date range would tie the carving of the horse in with occupation of the nearby Uffington hillfort, indicating that it may represent a tribal emblem marking the land of the inhabitants of the hillfort. Alternatively, the carving may have been carried out during a Bronze Age ritual. Some researchers see the horse as representing the Celtic*** horse goddess Epona, who was worshipped as a protector of horses, and her associations with fertility. However, the cult of Epona was not imported from Gaul (France) until around the first century CE. This date is at least six centuries after the Uffington Horse was probably carved. Nevertheless, the horse had great ritual and economic significance during the Bronze and Iron Ages, as attested by its depictions on jewellery and other metal objects. It is possible that the carving represents a goddess in native mythology, such as Rhiannon, described in later Welsh mythology as a beautiful woman dressed in gold and riding a white horse.</p>
                     <p>The fact that geoglyphs can disappear easily, along with their associated rituals and meaning, indicates that they were never intended to be anything more than temporary gestures. But this does not lessen their importance. These giant carvings are a fascinating glimpse into the minds of their creators and how they viewed the landscape in which they lived.</p>
                     <p className="text-xs">*Iron Age: a period (in Britain 800 BCE - 43 CE) that is characterised by the use of iron tools</p>
                     <p className="text-xs">**Neolithic: a period (in Britain c. 4,000 BCE - c. 2,500 BCE) that is significant for the spread of agricultural practices, and the use of stone tools</p>
                     <p className="text-xs">***Celtic: an ancient people who migrated from Europe to Britain before the Romans</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">I contain multitudes</p>
                     <p className="italic text-center mb-4">Wendy Moore reviews Ed Yong’s book about microbes</p>
                     <p>Microbes, most of them bacteria, have populated this planet since long before animal life developed and they will outlive us. Invisible to the naked eye, they are ubiquitous. They inhabit the soil, air, rocks and water and are present within every form of life, from seaweed and coral to dogs and humans. And, as Yong explains in his utterly absorbing and hugely important book, we mess with them at our peril.</p>
                     <p>Every species has its own colony of microbes, called a ‘microbiome’, and these microbes vary not only between species but also between individuals and within different parts of each individual. What is amazing is that while the number of human cells in the average person is about 30 trillion, the number of microbial ones is higher – about 39 trillion. At best, Yong informs us, we are only 50 per cent human. Indeed, some scientists even suggest we should think of each species and its microbes as a single unit, dubbed a ‘holobiont’.</p>
                     <p>In each human there are microbes that live only in the stomach, the mouth or the armpit and by and large they do so peacefully. So ‘bad’ microbes are just microbes out of context. Microbes that sit contentedly in the human gut (where there are more microbes than there are stars in the galaxy) can become deadly if they find their way into the bloodstream. These communities are constantly changing too. The right hand shares just one-sixth of its microbes with the left hand. And, of course, we are surrounded by microbes. Every time we eat, we swallow a million microbes in each gram of food; we are continually swapping them with other humans, pets and the world at large.</p>
                     <p>It’s a fascinating topic and Yong, a young British science journalist, is an extraordinarily adept guide. Writing with lightness and panache, he has a knack of explaining complex science in terms that are both easy to understand and totally enthralling. Yong is on a mission. Leading us gently by the hand, he takes us into the world of microbes – a bizarre, alien planet – in a bid to persuade us to love them as much as he does. By the end, we do.</p>
                     <p>For most of human history we had no idea that microbes existed. The first man to see these extraordinarily potent creatures was a Dutch lens-maker called Antony van Leeuwenhoek in the 1670s. Using microscopes of his own design that could magnify up to 270 times, he examined a drop of water from a nearby lake and found it teeming with tiny creatures he called ‘animalcules’. It wasn’t until nearly two hundred years later that the research of French biologist Louis Pasteur indicated that some microbes caused disease. It was Pasteur’s ‘germ theory’ that gave bacteria the poor image that endures today.</p>
                     <p>Yong’s book is in many ways a plea for microbial tolerance, pointing out that while fewer than one hundred species of bacteria bring disease, many thousands more play a vital role in maintaining our health. The book also acknowledges that our attitude towards bacteria is not a simple one. We tend to see the dangers posed by bacteria, yet at the same time we are sold yoghurts and drinks that supposedly nurture ‘friendly’ bacteria. In reality, says Yong, bacteria should not be viewed as either friends or foes, villains or heroes. Instead we should realise we have a symbiotic relationship, that can be mutually beneficial or mutually destructive.</p>
                     <p>What then do these millions of organisms do? The answer is pretty much everything. New research is now unravelling the ways in which bacteria aid digestion, regulate our immune systems, eliminate toxins, produce vitamins, affect our behaviour and even combat obesity. ‘They actually help us become who we are,’ says Yong. But we are facing a growing problem. Our obsession with hygiene, our overuse of antibiotics and our unhealthy, low-fibre diets are disrupting the bacterial balance and may be responsible for soaring rates of allergies and immune problems, such as inflammatory bowel disease (IBD).</p>
                     <p>The most recent research actually turns accepted norms upside down. For example, there are studies indicating that the excessive use of household detergents and antibacterial products actually destroys the microbes that normally keep the more dangerous germs at bay. Other studies show that keeping a dog as a pet gives children early exposure to a diverse range of bacteria, which may help protect them against allergies later.</p>
                     <p>The readers of Yong’s book must be prepared for a decidedly unglamorous world. Among the less appealing case studies is one about a fungus that is wiping out entire populations of frogs and that can be halted by a rare microbial bacterium. Another is about squid that carry luminescent bacteria that protect them against predators. However, if you can overcome your distaste for some of the investigations, the reasons for Yong’s enthusiasm become clear. The microbial world is a place of wonder. Already, in an attempt to stop mosquitoes spreading dengue fever – a disease that infects 400 million people a year – mosquitoes are being loaded with a bacterium to block the disease. In the future, our ability to manipulate microbes means we could construct buildings with useful microbes built into their walls to fight off infections. Just imagine a neonatal hospital ward coated in a specially mixed cocktail of microbes so that babies get the best start in life.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">How to make wise decisions</p>
                     <p>Across cultures, wisdom has been considered one of the most revered human qualities. Although the truly wise may seem few and far between, empirical research examining wisdom suggests that it isn’t an exceptional trait possessed by a small handful of bearded philosophers after all – in fact, the latest studies suggest that most of us have the ability to make wise decisions, given the right context.</p>
                     <p>‘It appears that experiential, situational, and cultural factors are even more powerful in shaping wisdom than previously imagined,’ says Associate Professor Igor Grossmann of the University of Waterloo in Ontario, Canada. ‘Recent empirical findings from cognitive, developmental, social, and personality psychology cumulatively suggest that people’s ability to reason wisely varies dramatically across experiential and situational contexts. Understanding the role of such contextual factors offers unique insights into understanding wisdom in daily life, as well as how it can be enhanced and taught.’</p>
                     <p>It seems that it’s not so much that some people simply possess wisdom and others lack it, but that our ability to reason wisely depends on a variety of external factors. ‘It is impossible to characterize thought processes attributed to wisdom without considering the role of contextual factors,’ explains Grossmann. ‘In other words, wisdom is not solely an “inner quality” but rather unfolds as a function of situations people happen to be in. Some situations are more likely to promote wisdom than others.’</p>
                     <p>Coming up with a definition of wisdom is challenging, but Grossmann and his colleagues have identified four key characteristics as part of a framework of wise reasoning. One is intellectual humility or recognition of the limits of our own knowledge, and another is appreciation of perspectives wider than the issue at hand. Sensitivity to the possibility of change in social relations is also key, along with compromise or integration of different attitudes and beliefs.</p>
                     <p>Grossmann and his colleagues have also found that one of the most reliable ways to support wisdom in our own day-to-day decisions is to look at scenarios from a third-party perspective, as though giving advice to a friend. Research suggests that when adopting a first-person viewpoint we focus on the focal features of the environment and when we adopt a third-person, ‘observer’ viewpoint we reason more broadly and focus more on interpersonal and moral ideals such as justice and impartiality. Looking at problems from this more expansive viewpoint allows us to foster cognitive processes related to wise decisions.</p>
                     <p>What are we to do, then, when confronted with situations like a disagreement with a spouse or negotiating a contract at work, that require us to take a personal stake? Grossmann argues that even when we aren’t able to change the situation, we can still evaluate these experiences from different perspectives.</p>
                     <p>For example, in one experiment that took place during the peak of a recent economic recession, graduating college seniors were asked to reflect on their job prospects. The students were instructed to imagine their career either ‘as if you were a distant observer’ or ‘before your own eyes as if you were right there’. Participants in the group assigned to the ‘distant observer’ role displayed more wisdom-related reasoning (intellectual humility and recognition of change) than did participants in the control group.</p>
                     <p>In another study, couples in long-term romantic relationships were instructed to visualize an unresolved relationship conflict either through the eyes of an outsider or from their own perspective. Participants then discussed the incident with their partner for 10 minutes, after which they wrote down their thoughts about it. Couples in the ‘other’s eyes’ condition were significantly more likely to rely on wise reasoning – recognizing others’ perspectives and searching for a compromise – compared to the couples in the egocentric condition.</p>
                     <p>‘Ego-decentering promotes greater focus on others and enables a bigger picture, conceptual view of the experience, affording recognition of intellectual humility and change,’ says Grossmann.</p>
                     <p>We might associate wisdom with intelligence or particular personality traits, but research shows only a small positive relationship between wise thinking and crystallized intelligence and the personality traits of openness and agreeableness. ‘It is remarkable how much people can vary in their wisdom from one situation to the next, and how much stronger such contextual effects are for understanding the relationship between wise judgment and its social and affective outcomes as compared to the generalized “traits”,’ Grossmann explains. ‘That is, knowing how wisely a person behaves in a given situation is more informative for understanding their emotions or likelihood to forgive [or] retaliate as compared to knowing whether the person may be wise “in general”.’</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–8</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 1, text: "Most geoglyphs in England are located in a particular area of the country." },
                          { num: 2, text: "There are more geoglyphs in the shape of a horse than any other creature." },
                          { num: 3, text: "A recent dating of the Uffington White Horse indicates that people were mistaken about its age." },
                          { num: 4, text: "Historians have come to an agreement about the origins of the Long Man of Wilmington." },
                          { num: 5, text: "Geoglyphs were created by people placing white chalk on the hillside." },
                          { num: 6, text: "Many geoglyphs in England are no longer visible." },
                          { num: 7, text: "The shape of some geoglyphs has been altered over time." },
                          { num: 8, text: "The fame of the Uffington White Horse is due to its size." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9–13</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">The Uffington White Horse</h4>
                      <p><strong>The location of the Uffington White Horse:</strong></p>
                      <ul><li>• a distance of 2.5 km from Uffington village</li><li>• near an ancient road known as the <strong>9</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} /></li><li>• close to an ancient cemetery that has a number of burial mounds</li></ul>
                      <p><strong>Dating the Uffington White Horse:</strong></p>
                      <ul><li>• first reference to White Horse Hill appears in <strong>10</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} /> from the 1070s</li><li>• horses shown on coins from the period 100 BCE – 1 BCE are similar in appearance</li><li>• according to analysis of the surrounding <strong>11</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} />, the Horse is Late Bronze Age / Early Iron Age</li></ul>
                      <p><strong>Possible reasons for creation of the Uffington White Horse:</strong></p>
                      <ul><li>• an emblem to indicate land ownership</li><li>• formed part of an ancient ritual</li><li>• was a representation of goddess Epona – associated with protection of horses and <strong>12</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} /></li><li>• was a representation of a Welsh goddess called <strong>13</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} /></li></ul>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–16</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>14</strong> What point does the writer make about microbes in the first paragraph?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> They adapt quickly to their environment.</p><p><strong>B</strong> The risk they pose has been exaggerated.</p><p><strong>C</strong> They are more plentiful in animal life than plant life.</p><p><strong>D</strong> They will continue to exist for longer than the human race.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} /></div>
                      <div><p><strong>15</strong> In the second paragraph, the writer is impressed by the fact that</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> each species tends to have vastly different microbes.</p><p><strong>B</strong> some parts of the body contain relatively few microbes.</p><p><strong>C</strong> the average individual has more microbial cells than human ones.</p><p><strong>D</strong> scientists have limited understanding of how microbial cells behave.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} /></div>
                      <div><p><strong>16</strong> What is the writer doing in the fifth paragraph?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> explaining how a discovery was made</p><p><strong>B</strong> comparing scientists’ theories about microbes</p><p><strong>C</strong> describing confusion among scientists</p><p><strong>D</strong> giving details of how microbes cause disease</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 17–20</h3><p>Complete the summary using the list of words, A–H, below. Write the correct letter, A–H.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">We should be more tolerant of microbes</h4>
                      <p>Yong’s book argues that we should be more tolerant of microbes. Many have a beneficial effect, and only a relatively small number lead to <strong>17</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />. And although it is misleading to think of microbes as ‘friendly’, we should also stop thinking of them as the enemy. In fact, we should accept that our relationship with microbes is one based on <strong>18</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />.</p>
                      <p>New research shows that microbes have numerous benefits for humans. Amongst other things, they aid digestion, remove poisons, produce vitamins and may even help reduce obesity. However, there is a growing problem. Our poor <strong>19</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />, our overuse of antibiotics, and our excessive focus on <strong>20</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /> are upsetting the bacterial balance and may be contributing to the huge increase in allergies and immune system problems.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                      <div className="bg-gray-100 p-2 rounded"><strong>A</strong> solution</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>B</strong> partnership</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>C</strong> destruction</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>D</strong> exaggeration</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>E</strong> cleanliness</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>F</strong> regulations</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>G</strong> illness</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>H</strong> nutrition</div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21–26</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 2? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 21, text: "It is possible that using antibacterial products in the home fails to have the desired effect." },
                          { num: 22, text: "It is a good idea to ensure that children come into contact with as few bacteria as possible." },
                          { num: 23, text: "Yong’s book contains more case studies than are necessary." },
                          { num: 24, text: "The case study about bacteria that prevent squid from being attacked may have limited appeal." },
                          { num: 25, text: "Efforts to control dengue fever have been surprisingly successful." },
                          { num: 26, text: "Microbes that reduce the risk of infection have already been put inside the walls of some hospital wards." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–30</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>27</strong> What point does the writer make in the first paragraph?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> Wisdom appears to be unique to the human race.</p><p><strong>B</strong> A basic assumption about wisdom may be wrong.</p><p><strong>C</strong> Concepts of wisdom may depend on the society we belong to.</p><p><strong>D</strong> There is still much to be discovered about the nature of wisdom.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} /></div>
                      <div><p><strong>28</strong> What does Igor Grossmann suggest about the ability to make wise decisions?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> It can vary greatly from one person to another.</p><p><strong>B</strong> Earlier research into it was based on unreliable data.</p><p><strong>C</strong> The importance of certain influences on it was underestimated.</p><p><strong>D</strong> Various branches of psychology define it according to their own criteria.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} /></div>
                      <div><p><strong>29</strong> According to the third paragraph, Grossmann claims that the level of wisdom an individual shows</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> can be greater than they think it is.</p><p><strong>B</strong> will be different in different circumstances.</p><p><strong>C</strong> may be determined by particular aspects of their personality.</p><p><strong>D</strong> should develop over time as a result of their life experiences.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} /></div>
                      <div><p><strong>30</strong> What is described in the fifth paragraph?</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> a difficulty encountered when attempting to reason wisely</p><p><strong>B</strong> an example of the type of person who is likely to reason wisely</p><p><strong>C</strong> a controversial view about the benefits of reasoning wisely</p><p><strong>D</strong> a recommended strategy that can help people to reason wisely</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 31–35</h3><p>Complete the summary using the list of words, A–J, below. Write the correct letter, A–J.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">The characteristics of wise reasoning</h4>
                      <p>Igor Grossmann and colleagues have established four characteristics which enable us to make wise decisions. It is important to have a certain degree of <strong>31</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} /> regarding the extent of our knowledge, and to take into account <strong>32</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} /> which may not be the same as our own. We should also be able to take a broad <strong>33</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} /> of any situation. Another key characteristic is being aware of the likelihood of alterations in the way that people relate to each other.</p>
                      <p>Grossmann also believes that it is better to regard scenarios with <strong>34</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} />. By avoiding the first-person perspective, we focus more on <strong>35</strong> <Input className={`inline-block w-16 ml-1 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> and on other moral ideals, which in turn leads to wiser decision-making.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                      <div className="bg-gray-100 p-2 rounded"><strong>A</strong> opinions</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>B</strong> confidence</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>C</strong> view</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>D</strong> modesty</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>E</strong> problems</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>F</strong> objectivity</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>G</strong> fairness</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>H</strong> experiences</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>I</strong> range</div>
                      <div className="bg-gray-100 p-2 rounded"><strong>J</strong> reasons</div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36–40</h3><p>Do the following statements agree with the information given in Reading Passage 3? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 36, text: "Students participating in the job prospects experiment could choose one of two perspectives to take." },
                          { num: 37, text: "Participants in the couples experiment were aware that they were taking part in a study about wise reasoning." },
                          { num: 38, text: "In the couples experiments, the length of the couples’ relationships had an impact on the results." },
                          { num: 39, text: "In both experiments, the participants who looked at the situation from a more detached viewpoint tended to make wiser decisions." },
                          { num: 40, text: "Grossmann believes that a person’s wisdom is determined by their intelligence to only a very limited extent." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>
        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-16" module="reading" testNumber={2} /><UserTestHistory book="book-16" module="reading" testNumber={2} /></div>
      </div>
    </div>
  )
}