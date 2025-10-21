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

export default function Book14ReadingTest3() {
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
    
    // Handle 'in either order' for 21&22
    if (questionNumber === '21' || questionNumber === '22') {
        const otherQ = questionNumber === '21' ? '22' : '21';
        const userAns = answers[questionNumber]?.toUpperCase().trim();
        const otherUserAns = answers[otherQ]?.toUpperCase().trim();
        const correctAnswersSet = ['B', 'C'];
        return correctAnswersSet.includes(userAns || '') && correctAnswersSet.includes(otherUserAns || '') && userAns !== otherUserAns;
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
      
      // Save test score using test-score-saver
      const result = await saveTestScore({
        book: 'book-14',
        module: 'reading',
        testNumber: 3,
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
    '1': 'B', '2': 'A', '3': 'D', '4': 'NOT GIVEN', '5': 'NO', '6': 'YES', '7': 'B', '8': 'C', '9': 'B', '10': 'A', '11': 'A', '12': 'C', '13': 'A',
    '14': 'C', '15': 'H', '16': 'A', '17': 'F', '18': 'I', '19': 'B', '20': 'E',
    '21': 'B', '22': 'C', '21&22': ['B', 'C'],
    '23': 'ecology', '24': 'prey', '25': 'habitats', '26': 'antibiotics', '27': 'B', '28': 'G', '29': 'F', '30': 'E', '31': 'C',
    '32': 'NO', '33': 'YES', '34': 'NOT GIVEN', '35': 'NO', '36': 'YES', '37': 'encouraging', '38': 'desire', '39': 'autonomy', '40': 'targeted'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-14" module="reading" testNumber={3} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 14 - Reading Test 3</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <p>A. Looked at in one way, everyone knows what intelligence is; looked at in another way, no one does. In other words, people all have unconscious notions — known as "implicit theories" — of intelligence, but no one knows for certain what it actually is. This chapter addresses how people conceptualize intelligence, whatever it may actually be.</p>
<p>But why would we even care what people think intelligence is, as opposed only to valuing whatever it actually is? There are at least four reasons people’s conceptions of intelligence matter.</p>
<p>B. First, implicit theories of intelligence drive the way in which people perceive and evaluate their own intelligence and that of others. To better understand the judgments people make about their own and others’ abilities, it is useful to learn about people’s implicit theories. For example, parents’ implicit theories of their children’s language development predict their children’s language skills, even after controlling for the children’s actual language ability. More generally, parents’ implicit theories of intelligence will determine at what ages they believe their children are ready to perform various cognitive tasks. Job interviewers will make hiring decisions on the basis of their implicit theories of intelligence. People will decide who to be friends with on the basis of such theories. In sum, knowledge about implicit theories of intelligence is important because this knowledge is so often used by people to make judgments in the course of their everyday lives.</p>
<p>C. Second, the implicit theories of scientific investigators ultimately give rise to their explicit theories. Thus it is useful to find out what these implicit theories are. Implicit theories provide a framework that is useful in defining the general scope of a phenomenon—what especially a not-well-understood phenomenon. These implicit theories can suggest aspects of the phenomenon that have been more or less attended to in previous investigations.</p>
<p>D. Third, implicit theories can be useful when an investigator suspects that existing explicit theories are wrong or misleading. If an investigation of implicit theories reveals little agreement between the extant implicit and explicit theories, the implicit theories may point to a need for a new theory or for a reexamination of existing theories. For example, some implicit theories of intelligence suggest the need for expansion of some of our explicit theories of the construct.</p>
<p>Test 3</p>
<p>E. Finally, understanding implicit theories of intelligence can help elucidate developmental and cross-cultural differences. As mentioned earlier, people have expectations for intellectual performances that differ for children of different ages. How these expectations differ is in part a function of culture. For example, expectations for children who participate in Western-style schooling are almost certain to be different from those for children who do not participate in such schooling.</p>
<p>F. I have suggested that there are three major implicit theories of how intelligence relates to society as a whole (Sternberg, 1997). These might be called Hamiltonian, Jeffersonian, and Jacksonian. These views are not based strictly, but rather, loosely, on the philosophies of Alexander Hamilton, Thomas Jefferson, and Andrew Jackson, three great statesmen in the history of the United States.</p>
<p>G. The Hamiltonian view, which is similar to the Platonic view, is that people are born with different levels of intelligence and that those who are less intelligent need the good offices of the more intelligent to keep them in line, whether they are called government officials or, in Plato’s view, philosophers. In the Hamiltonian view, it is assumed that the more intelligent would have the wisdom and skills to lead society in a way that would be beneficial to all (Sternberg, 1997). This view assumes that people who cannot take care of themselves. Left to themselves, the unintelligent would create, as they always have created, a kind of chaos.</p>
<p>H. The Jeffersonian view is that people should have equal opportunities, but they do not necessarily avail themselves equally of these opportunities and are not necessarily equally rewarded for their accomplishments. People are rewarded for what they accomplish, if given equal opportunity. Low achievers are not rewarded to the same extent as high achievers. In the Jeffersonian view, the goal of education is not to favor an elite, as in the Hamiltonian tradition, but rather to allow children the opportunities to make full use of the skills they have. My own views are similar to these (Sternberg, 1997).</p>
<p>I. The Jacksonian view is that all people are equal, not only as human beings but in terms of their competencies—that one person would serve as well as another in government or on a jury or in almost any position of responsibility. In this view of democracy, people are essentially interchangeable except for specialized skills, all of which can be learned. In this view, there is no need or want for institutions that might lead to favoring one group over another.</p>
<p>J. Implicit theories of intelligence and of the relationship of intelligence to society perhaps need to be considered more carefully than they have been. Scientists may observe they observe we understand presuppositions for explicit theories and even experimental designs that are then taken as scientific contributions. Until scholars are able to discuss their implicit theories and thus their assumptions, they are likely to miss the point of what others are saying when discussing their explicit theories and their data.</p>

 </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Saving bugs to find new drugs</p>
                     <p className="italic text-center mb-4">Zoologist Ross Piper looks at the potential of insects in pharmaceutical research</p>
                     <p><span className="font-semibold">A</span> More drugs than you might think are derived from, or inspired by, compounds found in living things. Looking to nature for the soothing and curing of our ailments is nothing new – we have been doing it for tens of thousands of years. You only have to look at other primates – such as the capuchin monkeys who rub themselves with toxin-oozing millipedes to deter mosquitoes, or the chimpanzees who use noxious forest plants to rid themselves of intestinal parasites – to realise that our ancient ancestors too probably had a basic grasp of medicine.</p>
                     <p><span className="font-semibold">B</span> Pharmaceutical science and chemistry built on these ancient foundations and perfected the extraction, characterisation, modification and testing of these natural products. Then, for a while, modern pharmaceutical science moved its focus away from nature and into the laboratory, designing chemical compounds from scratch. The main cause of this shift is that although there are plenty of promising chemical compounds in nature, finding them is far from easy. Securing sufficient numbers of the organisms in question, isolating and characterising the compounds of interest, and producing large quantities of these compounds are all significant hurdles.</p>
                     <p><span className="font-semibold">C</span> Laboratory-based drug discovery has achieved varying levels of success, something which has now prompted the development of new approaches focusing once again on natural products. With the ability to mine genomes for useful compounds, it is now evident that we have barely scratched the surface of nature’s molecular diversity. This realisation, together with several looming health crises, such as antibiotic resistance, has put bioprospecting – the search for useful compounds in nature – firmly back on the map.</p>
                     <p><span className="font-semibold">D</span> Insects are the undisputed masters of the terrestrial domain, where they occupy every possible niche. Consequently, they have a bewildering array of interactions with other organisms, something which has driven the evolution of an enormous range of very interesting compounds for defensive and offensive purposes. Their remarkable diversity exceeds that of every other group of animals on the planet combined. Yet even though insects are far and away the most diverse animals in existence, their potential as sources of therapeutic compounds is yet to be realised.</p>
                     <p><span className="font-semibold">E</span> From the tiny proportion of insects that have been investigated, several promising compounds have been identified. For example, alloferon, an antimicrobial compound produced by blow fly larvae, is used as an antiviral and antitumor agent in South Korea and Russia. The larvae of a few other insect species are being investigated for the potent antimicrobial compounds they produce. Meanwhile, a compound from the venom of the wasp Polybia paulista has potential in cancer treatment.</p>
                     <p><span className="font-semibold">F</span> Why is it that insects have received relatively little attention in bioprospecting? Firstly, there are so many insects that, without some manner of targeted approach, investigating this huge variety of species is a daunting task. Secondly, insects are generally very small, and the glands inside them that secrete potentially useful compounds are smaller still. This can make it difficult to obtain sufficient quantities of the compound for subsequent testing. Thirdly, although we consider insects to be everywhere, the reality of this ubiquity is vast numbers of a few extremely common species. Many insect species are infrequently encountered and very difficult to rear in captivity, which, again, can leave us with insufficient material to work with.</p>
                     <p><span className="font-semibold">G</span> My colleagues and I at Aberystwyth University in the UK have developed an approach in which we use our knowledge of ecology as a guide to target our efforts. The creatures that particularly interest us are the many insects that secrete powerful poison for subduing prey and keeping it fresh for future consumption. There are even more insects that are masters of exploiting filthy habitats, such as faeces and carcasses, where they are regularly challenged by thousands of micro-organisms. These insects have many antimicrobial compounds for dealing with pathogenic bacteria and fungi, suggesting that there is certainly potential to find many compounds that can serve as or inspire new antibiotics.</p>
                     <p><span className="font-semibold">H</span> Although natural history knowledge points us in the right direction, it doesn’t solve the problems associated with obtaining useful compounds from insects. It is now possible to snip out the stretches of the insect’s DNA that carry the codes for the interesting compounds and insert them into cell lines that allow larger quantities to be produced. And although the road from isolating and characterising compounds with desirable qualities to developing a commercial product is very long and full of pitfalls, the variety of successful animal-derived pharmaceuticals on the market demonstrates there is a precedent here that is worth exploring.</p>
                     <p><span className="font-semibold">I</span> With every bit of wilderness that disappears, we deprive ourselves of potential medicines. As much as I’d love to help develop a groundbreaking insect-derived medicine, my main motivation for looking at insects in this way is conservation. I sincerely believe that all species have a right to exist for their own sake. If we can shine a light on the darker recesses of nature’s medicine cabinet, exploring the useful chemistry of the most diverse animals on the planet, I believe we can make people think differently about the value of nature.</p>
              </CardContent></Card>

              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The power of play</p>
                     <p>Virtually every child, the world over, plays. The drive to play is so intense that children will do so in any circumstances, for instance when they have no real toys, or when parents do not actively encourage the behavior. In the eyes of a young child, running, pretending, and building are fun. Researchers and educators know that these playful activities benefit the development of the whole child across social, cognitive, physical, and emotional domains. Indeed, play is such an instrumental component to healthy child development that the United Nations High Commission on Human Rights (1989) recognized play as a fundamental right of every child.</p>
                     <p>Yet, while experts continue to expound a powerful argument for the importance of play in children’s lives, the actual time children spend playing continues to decrease. Today, children play eight hours less each week than their counterparts did two decades ago (Elkind 2008). Under pressure of rising academic standards, play is being replaced by test preparation in kindergartens and grade schools, and parents who aim to give their preschoolers a leg up are led to believe that flashcards and educational ‘toys’ are the path to success. Our society has created a false dichotomy between play and learning.</p>
                     <p>Through play, children learn to regulate their behavior, lay the foundations for later learning in science and mathematics, figure out the complex negotiations of social relationships, build a repertoire of creative problem-solving skills, and so much more. There is also an important link between play and physical and mental health. Outdoor play is usually active play, which increases пульса, uses modern muscle groups, and fights obesity.</p>
                  <p>Full consensus on a formal definition of play continues to elude the researchers and theorists who study it. Definitions range from discrete descriptions of various types of play such as physical, construction, language, or symbolic play (Miller & Almon 2009), to lists of broad criteria, based on observations and attitudes, that are meant to capture the essence of all play behaviors (e.g. Rubin et al. 1983).</p>
                     <p>A majority of the contemporary definitions of play focus on several key criteria. The founder of the National Institute for Play, Dr. Stuart Brown, has described play as ‘anything that spontaneously is done for its own sake’. More specifically, he says it ‘appears purposeless, produces pleasure and joy, and leads one to the next stage of mastery’. Similarly, Miller and Almon (2009) say that play includes ‘activities that are freely chosen and directed by children and arise from intrinsic motivation’. Often, play is defined along a continuum as more or less playful using the following set of behavioral and dispositional criteria (e.g. Rubin et al. 1983):</p>
                     <p>Play is pleasurable: Children must enjoy the activity or it is not play. It is intrinsically motivated: Children engage in play simply for the satisfaction the behavior itself brings. It has no extrinsically motivated function or goal. Play is process oriented: When children play, the means are more important than the ends. It is freely chosen, voluntary, and spontaneous: Children play when they have the choice to do so. Play is actively engaged: Players must be physically and/or mentally involved in the activity. Play is non-literal. It involves make-believe.</p>
                    <p>According to this view, children's playful behaviors can range in degree from 0% to 100% playful. Rubin and colleagues did not assign greater weight to any one dimension in determining playfulness; however, other researchers have suggested that process orientation and a lack of obvious functional purpose may be the most important aspects of play (e.g. Pellegrini 2009).</p>
                     <p>From the perspective of a continuum, play can thus blend with other motives and attitudes that are less playful, such as work. Unlike play, work is typically not viewed as enjoyable and it is extrinsically motivated (i.e. it is goal oriented). Researcher Joan Goodman (1994) suggested that hybrid forms of work and play are not a detriment to learning; rather, they can provide optimal contexts for learning. For example, a child may be engaged in a difficult, goal-directed activity set up by their teacher, but they may still be actively engaged and intrinsically motivated. At this mid-point between play and work, the child’s motivation, coupled with guidance from an adult, can create robust opportunities for playful learning.</p>
                     <p>Critically, recent research supports the idea that adults can facilitate children’s learning while maintaining a playful approach in interactions known as ‘guided play’. The adult’s role in play varies as a function of their educational goals and the child’s developmental level (Hirsh-Pasek et al. 2009).</p>
                     <p>Guided play takes two forms. At a very basic level, adults can enrich the child’s environment by providing objects or experiences that promote aspects of a curriculum. In the more direct form of guided play, parents or other adults can support children’s play by joining in the fun as a co-player, raising thoughtful questions, commenting on children’s discoveries, or encouraging further exploration or new facets to the child’s activity. Although playful learning can be somewhat structured, it must also be child-centered (Nicolopoulou et al. 2006). Play should stem from the child’s own desire.</p>
                     <p>Both free and guided play are essential elements in a child-centered approach to playful learning. Intrinsically motivated free play provides the child with true autonomy, while guided play is an avenue through which parents and educators can provide more targeted learning experiences. In either case, play should be actively engaged, it should be predominantly child-directed, and it must be fun.</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–3</h3><p>Reading Passage 1 has ten sections, A–J. Which section contains the following information?</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>1</strong> information about how non-scientists’ assumptions about intelligence influence their behaviour towards others</p><Input className={`max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>2</strong> a reference to lack of clarity over the definition of intelligence</p><Input className={`max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>3</strong> the point that a researcher’s implicit and explicit theories may be very different</p><Input className={`max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 4–6</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 1? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>4</strong> Slow language development in children is likely to prove disappointing to their parents.</p><Input className={`max-w-[150px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>5</strong> People’s expectations of what children should gain from education are universal.</p><Input className={`max-w-[150px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>6</strong> Scholars may discuss theories without fully understanding each other.</p><Input className={`max-w-[150px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 7–13</h3><p>Look at the following statements and the list of theories below. Match each statement with the correct theory, A, B or C.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of Theories</strong></p><p><strong>A</strong> Hamiltonian</p><p><strong>B</strong> Jeffersonian</p><p><strong>C</strong> Jacksonian</p></div>
                    <div className="space-y-4">
                        {[
                            { num: 7, text: "It is desirable for the same possibilities to be open to everyone." },
                            { num: 8, text: "No section of society should have preferential treatment at the expense of another." },
                            { num: 9, text: "People should only gain benefits on the basis of what they actually achieve." },
                            { num: 10, text: "Variation in intelligence begins at birth." },
                            { num: 11, text: "The most intelligent people should be in positions of power." },
                            { num: 12, text: "Everyone can develop the same abilities." },
                            { num: 13, text: "People of low intelligence are likely to lead uncontrolled lives." }
                        ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>))}
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–20</h3><p>Reading Passage 2 has nine paragraphs, A–I. Which paragraph contains the following information?</p>
                    <div className="space-y-4 mt-4">
                        {[
                            { num: 14, text: "mention of factors driving a renewed interest in natural medicinal compounds" },
                            { num: 15, text: "how recent technological advances have made insect research easier" },
                            { num: 16, text: "examples of animals which use medicinal substances from nature" },
                            { num: 17, text: "reasons why it is challenging to use insects in drug research" },
                            { num: 18, text: "reference to how interest in drug research may benefit wildlife" },
                            { num: 19, text: "a reason why nature-based medicines fell out of favour for a period" },
                            { num: 20, text: "an example of an insect-derived medicine in use at the moment" }
                        ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>))}
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 21 and 22</h3><p>Choose TWO letters, A–E. Which TWO of the following make insects interesting for drug research?</p>
                    <div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> the huge number of individual insects in the world</p><p><strong>B</strong> the variety of substances insects have developed to protect themselves</p><p><strong>C</strong> the potential to extract and make use of insects’ genetic codes</p><p><strong>D</strong> the similarities between different species of insect</p><p><strong>E</strong> the manageable size of most insects</p></div>
                    <div className="flex items-center gap-4 mt-2"><Input className={`w-20 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} placeholder="21" disabled={!isTestStarted || isSubmitting} /><Input className={`w-20 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} placeholder="22" disabled={!isTestStarted || isSubmitting} /></div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 23–26</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">Research at Aberystwyth University</h4>
                        <p>Ross Piper and fellow zoologists at Aberystwyth University are using their expertise in <strong>23</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /> when undertaking bioprospecting with insects. They are especially interested in the compounds that insects produce to overpower and preserve their <strong>24</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} />. They are also interested in compounds which insects use to protect themselves from pathogenic bacteria and fungi found in their <strong>25</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} />. Piper hopes that these substances will be useful in the development of drugs such as <strong>26</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} />.</p>
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–31</h3><p>Look at the following statements and the list of researchers below. Match each statement with the correct researcher, A–G.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of Researchers</strong></p><p><strong>A</strong> Elkind</p><p><strong>B</strong> Miller & Almon</p><p><strong>C</strong> Rubin et al.</p><p><strong>D</strong> Stuart Brown</p><p><strong>E</strong> Pellegrini</p><p><strong>F</strong> Joan Goodman</p><p><strong>G</strong> Hirsh-Pasek et al.</p></div>
                  <div className="space-y-4">
                      {[
                          { num: 27, text: "Play can be divided into a number of separate categories." },
                          { num: 28, text: "Adults’ intended goals affect how they play with children." },
                          { num: 29, text: "Combining work with play may be the best way for children to learn." },
                          { num: 30, text: "Certain elements of play are more significant than others." },
                          { num: 31, text: "Activities can be classified on a scale of playfulness." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32–36</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 32, text: "Children need toys in order to play." },
                          { num: 33, text: "It is a mistake to treat play and learning as separate types of activities." },
                          { num: 34, text: "Play helps children to develop their artistic talents." },
                          { num: 35, text: "Researchers have agreed on a definition of play." },
                          { num: 36, text: "Work and play differ in terms of whether or not they have a target." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37–40</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">Guided play</h4>
                        <p>In the simplest form of guided play, an adult contributes to the environment in which the child is playing. Alternatively, an adult can play with a child and develop the play, for instance by <strong>37</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /> the child to investigate different aspects of their game. Adults can help children to learn through play, and may make the activity more structured, but it should still be based on the child’s <strong>38</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> to play.</p>
                        <p>Play without the intervention of adults gives children real <strong>39</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} />; with adults, play can be <strong>40</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /> at particular goals. However, all forms of play should be an opportunity for children to have fun.</p>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-14" module="reading" testNumber={3} /><UserTestHistory book="book-14" module="reading" testNumber={3} /></div>
      </div>
    </div>
  )
}