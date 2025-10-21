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

export default function BookPlus3ReadingTest4() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '20_21': [], '22_23': [],
  })
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

  const handleMultiSelect = (questionKey: '20_21' | '22_23', value: string) => {
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
    
    // Handle 'in either order' for 20&21
    if (questionNumber === '20' || questionNumber === '21') {
        const userChoices = multipleAnswers['20_21'] || [];
        const correctSet = ['C', 'E'];
        const correctCount = userChoices.filter(c => correctSet.includes(c)).length;
        return correctCount === correctSet.length && userChoices.length === correctSet.length;
    }

    // Handle 'in either order' for 22&23
    if (questionNumber === '22' || questionNumber === '23') {
        const userChoices = multipleAnswers['22_23'] || [];
        const correctSet = ['A', 'C'];
        const correctCount = userChoices.filter(c => correctSet.includes(c)).length;
        return correctCount === correctSet.length && userChoices.length === correctSet.length;
    }

    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    const answeredMultiSelect = new Set<string>();
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&')) continue;
      if (['20', '21'].includes(qNum)) { 
        if (!answeredMultiSelect.has('20_21')) { 
          const userChoices = multipleAnswers['20_21'] || [];
          const correctSet = ['C', 'E'];
          const correctChosen = userChoices.filter(c => correctSet.includes(c)).length;
          correctCount += correctChosen;
          answeredMultiSelect.add('20_21'); 
        }
      } else if (['22', '23'].includes(qNum)) { 
        if (!answeredMultiSelect.has('22_23')) { 
          const userChoices = multipleAnswers['22_23'] || [];
          const correctSet = ['A', 'C'];
          const correctChosen = userChoices.filter(c => correctSet.includes(c)).length;
          correctCount += correctChosen;
          answeredMultiSelect.add('22_23'); 
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
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined;
      const detailedAnswers = { singleAnswers: answers, multipleAnswers, results: Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      const percentage = Math.round((calculatedScore / 40) * 100);
      const ieltsBandScore = getIELTSReadingScore(calculatedScore);
      
      await saveTestScore({
        book: 'practice-tests-plus-3',
        module: 'reading',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage,
        ieltsBandScore,
        timeTaken
      }, session);
      setSubmitted(true); setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      const calculatedScore = calculateScore(); setScore(calculatedScore); setSubmitted(true); setShowResultsPopup(true);
    } finally { setIsSubmitting(false); }
  }

  const handleReset = () => {
    setAnswers({}); setMultipleAnswers({ '20_21': [], '22_23': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const renderMultiSelectStatus = (key: '20_21' | '22_23', correctSet: string[]) => {
    if (!submitted) return null;
    const userChoices = multipleAnswers[key] || [];
    const correctCount = userChoices.filter(c => correctSet.includes(c)).length;
    const isFullyCorrect = correctCount === correctSet.length && userChoices.length === correctSet.length;
    return (
        <div className="mt-2 flex items-center gap-2">
            <span className={`text-sm ${isFullyCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isFullyCorrect ? '✓' : '✗'} Correct answers: {correctSet.join(' and ')} ({correctCount}/{correctSet.length} correct)
            </span>
        </div>
    );
  };

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'TRUE', '2': 'FALSE', '3': 'TRUE', '4': 'TRUE', '5': 'NOT GIVEN',
    '6': '(a) share scheme', '7': 'Roland/Roland group', '8': '(a) trade fair', '9': 'jazz', '10': '1998',
    '11': 'education', '12': 'technology', '13': 'branches',
    '14': 'iii', '15': 'vi', '16': 'ix', '17': 'iv', '18': 'ii', '19': 'vii',
    '20': 'C', '21': 'E', '20&21': ['C', 'E'],
    '22': 'A', '23': 'C', '22&23': ['A', 'C'],
    '24': 'regular wage', '25': 'steam power', '26': 'picturesque',
    '27': 'NOT GIVEN', '28': 'YES', '29': 'NOT GIVEN', '30': 'NO', '31': 'YES',
    '32': 'C', '33': 'E', '34': 'F', '35': 'A', '36': 'I',
    '37': 'B', '38': 'C', '39': 'A', '40': 'B'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 3 - Reading Test 4</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                <h3 className="text-center font-bold text-xl">Geoff Brash</h3>
                <p>Geoff Brash, who died in 2010, was a gregarious Australian businessman and philanthropist who encouraged the young to reach their potential.</p>
                <p>Born in Melbourne to Elsa and Alfred Brash, he was educated at Scotch College. His sister, Barbara, became a renowned artist and printmaker. His father, Alfred, ran the Brash retail music business that had been founded in 1862 by his grandfather, the German immigrant Marcus Brash, specialising in pianos. It carried the slogan ‘A home is not a home without a piano.’</p>
                <p>In his young days, Brash enjoyed the good life, playing golf and sailing, and spending some months travelling through Europe, having a leisurely holiday. He worked for a time at Myer department stores before joining the family business in 1949, where he quickly began to put his stamp on things. In one of his first management decisions, he diverged from his father’s sense of frugal aesthetics by re-carpeting the old man’s office while he was away. After initially complaining of his extravagance, his father grew to accept the change and gave Geoff increasing responsibility in the business.</p>
                <p>After World War II (1939-1945), Brash’s had begun to focus on white goods, such as washing machines and refrigerators, as the consumer boom took hold. However, while his father was content with the business he had built, the younger Brash viewed expansion as vital. When Geoff Brash took over as managing director in 1957, the company had two stores, but after floating on the stock exchange the following year, he expanded rapidly. Over the next 20 years, he bought into familiar music industry names such as Allans, Palings and Suttons. Eventually, 170 stores traded across the continent under the Brash’s banner.</p>
                <p>Geoff Brash learned from his father’s focus on customer service. Alfred Brash had also been a pioneer in introducing a share scheme for his staff, and his son retained and expanded the plan following the float.</p>
                <p>Geoff Brash was optimistic and outward looking. As a result, he was a pioneer in both accessing and selling new technology, and developing overseas relationships. He sourced and sold electric guitars, organs, and a range of other modern instruments, as well as state-of-the-art audio and video equipment. He developed a relationship with Taro Kakehashi, the founder of Japan’s Roland group, which led to a joint venture that brought electronic musical devices to Australia.</p>
                <p>In 1965, Brash and his wife attended a trade fair in Guangzhou, the first of its kind in China; they were one of the first Western business people allowed into the country following Mao Zedong’s Cultural Revolution. He returned there many times, helping advise the Chinese in establishing a high quality piano factory in Beijing; he became the factory’s agent in Australia. Brash also took leading jazz musicians Don Burrows and James Morrison to China, on a trip that reintroduced jazz to many Chinese musicians.</p>
                <p>He stood down as Executive Chairman of Brash’s in 1988, but under the new management debt became a problem, and in 1994 the banks called in administrators. The company was sold to Singaporean interests and continued to trade until 1998, when it again went into administration. The Brash name then disappeared from the retail world. Brash was greatly disappointed by the collapse, and the eventual disappearance of the company he had run for so long. But it was not long before he invested in a restructured Allan’s music business.</p>
                <p>Brash was a committed philanthropist who, in the mid-1980s, established the Brash Foundation, which eventually morphed, with other partners, into the Soundhouse Music Alliance. This was a not-for-profit organisation overseeing and promoting multimedia music making and education for teachers and students. The Soundhouse offers teachers and young people the opportunity to get exposure to the latest music technology, and to use this to compose and record their own music, either alone or in collaboration. The organisation is now also established branches in New Zealand, South Africa and Ireland, as well as numerous sites around Australia.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                <h3 className="text-center font-bold text-xl">Early occupations around the river Thames</h3>
                <p><strong>A</strong> In her pioneering survey, Sources of London English, Laura Wright has listed the variety of medieval workers who took their livings from the river Thames. The baillies of Queenhithe and Billingsgate acted as customs officers. There were conservators, who were responsible for maintaining the embankments and the weirs, and there were the garthmen who worked in the fish garths (enclosures). There were galleymen and lightermen and shoutmen, called after the names of their boats, and there were hookers who were named after the manner in which they caught their fish. The searcher patrolled the Thames in search of illegal fish weirs, and the tideman worked on its banks and foreshores whenever the tide permitted him to do so.</p>
                <p><strong>B</strong> All of these occupations persisted for many centuries, as did those jobs that depended upon the trade of the river. Yet, it was not easy work for any of the workers. They carried most goods upon their backs, since the rough surfaces of the quays and nearby streets were not suitable for wagons or large carts; the merchandise characteristically arrived in barrels which could be rolled from the ship along each quay. If the burden was too great to be carried by a single man, then the goods were slung on poles resting on the shoulders of two men. It was a slow and expensive method of business.</p>
                <p><strong>C</strong> However, up to the eighteenth century, river work was seen in a generally favourable light. For Langland, writing in the fourteenth century, the labourers working on river merchandise were relatively prosperous. And the porters of the seventeenth and early eighteenth centuries were, if anything, aristocrats of labour, enjoying high status. However, in the years from the late eighteenth to the early nineteenth century, there was a marked change in attitude. This was in part because the river work was within the region of the East End of London, which in this period acquired an unenviable reputation. By now, riverside labour was considered to be the most disreputable, and certainly the least desirable form of work.</p>
                <p><strong>D</strong> It could be said that the first industrial community in England grew up around the Thames. With the host of river workers themselves, as well as the vast assembly of ancillary trades such as tavern-keepers and laundresses, food-sellers and street-hawkers, shopkeepers and marine store dealers – there was a workforce of many thousands congregated in a relatively small area. There were more varieties of business to be observed by the riverside than in any other part of the city. As a result, with the possible exception of the area known as Seven Dials, the East End was also the most intensively inhabited region of London.</p>
                <p><strong>E</strong> It was a world apart, with its own language and its own laws. From the sailors in the opium dens of Limehouse to the smugglers on the malarial flats of the estuary, the workers of the river were not part of any civilised society. The alien world of the river had fostered theft. That alienation was also expressed in the slang of the docks, which essentially amounted to backslang, or the reversal of ordinary words. This backslang also helped in the formulation of Cockney rhyming slang*, so that the vocabulary of Londoners was directly affected by the life of the Thames.</p>
                <p><strong>F</strong> The reports in the nineteenth-century press reveal a heterogeneous world of dock labour, in which the crowds of casuals waiting for work at the dock gates at 7.45 a.m. include penniless refugees, bankrupts, old soldiers, broken-down gentlemen, discharged servants, and ex-convicts. There were some 400-500 permanent workers who earned a regular wage and who were considered to be the patricians of dockside labour. However, there were some 2,500 casual workers who were hired by the shift. The work for which they competed fiercely had become ever more unpleasant. Steam power could not be used for the cranes, for example, because of the danger of fire. So the cranes were powered by treadmills. Six to eight men entered a wooden cylinder and, laying hold of ropes, would tread the wheel round. They could lift nearly 20 tonnes to an average height of 27 feet (8.2 metres), forty times in an hour. This was part of the life of the river unknown to those who were intent upon its more picturesque aspects.</p>
                <p>* a collection of phrases, based on rhyme, used by people in parts of central London as alternatives to standard English words.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                <h3 className="text-center font-bold text-xl">Video game research</h3>
                <p>Although video games were first developed for adults, they are no longer exclusively reserved for the grown ups in the home. In 2006, Rideout and Hamel reported that as many as 29 percent of preschool children (children between two and six years old) in the United States had played console video games, and 18 percent had played hand-held ones. Given young children’s insatiable eagerness to learn, coupled with the fact that they are clearly surrounded by this medium, we predict that preschoolers will both continue and increasingly begin to adopt video games for personal enjoyment. Although the majority of gaming equipment is still designed for a much older target audience, once a game system enters the household it is potentially available for all family members, including the youngest. Portable systems have done a particularly good job of penetrating the younger market.</p>
                <p>Research in the video game market is typically done at two stages: some time close to the end of the product cycle, in order to get feedback from consumers, so that a marketing strategy can be developed; and at the very end of the product cycle to ‘fix bugs’ in the game. While both of those types of research are important, and may be appropriate for dealing with adult consumers, neither of them aids in designing better games, especially when it comes to designing for an audience that may have particular needs, such as preschoolers or senior citizens. Instead, exploratory and formative research has to be undertaken in order to truly understand those audiences, their abilities, their perspective, and their needs. In the spring of 2007, our preschool-game production team at Nickelodeon had a hunch that the Nintendo DS* with its new features such as the microphone, small size and portability, and its relatively low price point was a ripe gaming platform for preschoolers. There were a few games on the market at the time which had characters that appealed to the younger set, but our game producers did not think that the game mechanics or design were appropriate for preschoolers. What exactly preschoolers could do with the system, however, was a bit of a mystery. So we set about doing a study to answer the query. What could we expect preschoolers to be capable of in the context of hand-held game play, and how might the child development literature inform us as we proceeded with the creation of a new outlet for this age group?</p>
                <p>Our context in this case was the United States, although the games that resulted were also released in other regions due to the broad international reach of the characters. In order to design the best possible DS product for a preschool audience, we were fully committed to the ideals of a ‘user-centered approach,’ which assumes that users will be at least considered, but ideally consulted during the development process. After all, when it comes to introducing a new interactive product to the child market, and particularly such a young age group within it, we believe it is crucial to assess the range of physical and cognitive abilities associated with their specific developmental stage.</p>
                <p>Revelle and Medoff (2002) review some of the basic reasons why home entertainment systems, computers, and other electronic gaming devices are often difficult for preschoolers to use. In addition to their still developing motor skills (which makes manipulating a controller with small buttons difficult), many of the major stumbling blocks are cognitive. Though preschoolers are learning to think symbolically, and understand that pictures can stand for real-life objects, the vast majority are still unable to read and write. Thus, using text-based menu selections is not viable. Mapping is yet another obstacle since preschoolers may be unable to understand that there is a direct link between how the controller is used and the activities that appear before them on screen. Though this aspect is changing, in traditional mapping systems real life movements do not usually translate into game-based activity.</p>
                <p>Over the course of our study, we gained many insights into how preschoolers interact with various platforms, including the DS. For instance, all instructions for preschoolers need to be in voiceover, and include visual representations, and this has been one of the most difficult areas for us to negotiate with respect to game design on the DS. Because the game cartridges have very limited memory capacity, particularly in comparison to console or computer games, the ability to capture large amounts of voiceover data via sound files for visual representations of instructions becomes limited. So, instructions take up minimal memory, so they are preferable from a technological perspective. Figuring out ways to maximise sound and graphics files, while retaining the clear visual and verbal cues that we know are critical for our youngest players, is a constant give and take. Another of our findings indicated that preschoolers may use either a stylus, or their fingers, or both although they are not very accurate with either. One of the very interesting aspects of the DS is the interface, which is designed to respond to stylus interactions, can also effectively be used with the tip of the finger. This is particularly noteworthy in the context of preschoolers for two reasons. Firstly, as they have trouble with fine motor skills, and their hand-eye coordination is still in development, they are less exact with their stylus movements; and secondly, their fingers are so small that they mimic the stylus very effectively, and therefore by using their fingers they can often be more accurate in their game interactions.</p>
                <p>* a brand of hand-held electronic games</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-5</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>1</strong> The Brash business originally sold pianos.</p><Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} />
                        <p><strong>2</strong> Geoff Brash’s first job was with his grandfather’s company.</p><Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} />
                        <p><strong>3</strong> Alfred Brash thought that his son wasted money.</p><Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} />
                        <p><strong>4</strong> By the time Geoff Brash took control, the Brash business was selling some electrical products.</p><Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} />
                        <p><strong>5</strong> Geoff Brash had ambitions to open Brash stores in other countries.</p><Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} />
                    </div></div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6-10</h3><p>Answer the questions below. Choose <strong>NO MORE THAN THREE WORDS OR A NUMBER</strong> from the passage for each answer.</p>
                      <div className="space-y-4 mt-4">
                        <p><strong>6</strong> Which arrangement did Alfred Brash set up for his employees?</p><Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} />
                        <p><strong>7</strong> Which Japanese company did Geoff Brash collaborate with?</p><Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} />
                        <p><strong>8</strong> What type of event in China marked the beginning of Geoff Brash’s relationship with that country?</p><Input value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} />
                        <p><strong>9</strong> What style of music did Geoff Brash help to promote in China?</p><Input value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} />
                        <p><strong>10</strong> When did the Brash company finally stop doing business?</p><Input value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} />
                      </div>
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 11-13</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">Soundhouse Music Alliance</h4>
                        <ul className="list-disc list-inside ml-4">
                          <li>Grew out of the Brash Foundation.</li>
                          <li>A non-commercial organisation providing support for music and music <strong>11</strong> <Input className="inline-block w-32 ml-1" value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} />.</li>
                          <li>Allows opportunities for using up-to-date <strong>12</strong> <Input className="inline-block w-32 ml-1" value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} />.</li>
                          <li>Has <strong>13</strong> <Input className="inline-block w-32 ml-1" value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} /> in several countries.</li>
                        </ul>
                      </div>
                    </div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p>Reading Passage 2 has SIX paragraphs, A-F. Choose the correct heading, A-F, from the list of headings below. Write the correct number, i-ix.</p>
                      <div className="bg-gray-50 p-4 rounded-lg my-4">
                        <p className="font-bold">List of Headings</p>
                        <ul className="list-roman list-inside ml-2">
                          <li>i A mixture of languages and nationalities</li>
                          <li>ii The creation of an exclusive identity</li>
                          <li>iii The duties involved in various occupations</li>
                          <li>iv An unprecedented population density</li>
                          <li>v Imports and exports transported by river</li>
                          <li>vi Transporting heavy loads manually</li>
                          <li>vii Temporary work for large numbers of people</li>
                          <li>viii Hazards associated with riverside work</li>
                          <li>ix The changing status of riverside occupations</li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <p><strong>14</strong> Paragraph A</p><Input value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} />
                        <p><strong>15</strong> Paragraph B</p><Input value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} />
                        <p><strong>16</strong> Paragraph C</p><Input value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} />
                        <p><strong>17</strong> Paragraph D</p><Input value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />
                        <p><strong>18</strong> Paragraph E</p><Input value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />
                        <p><strong>19</strong> Paragraph F</p><Input value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />
                      </div>
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-21</h3><p className="text-sm font-semibold mb-2">Choose TWO letters, A-E. Which TWO statements are made about work by the River Thames before the eighteenth century?</p>
                      <div className="space-y-2">{['Goods were transported from the river by cart.', 'The workforce was very poorly paid.', 'Occupations were specialised.', 'Workers were generally looked down upon.', 'Physical strength was required.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['20_21'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('20_21', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                      {renderMultiSelectStatus('20_21', ['C', 'E'])}
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 22-23</h3><p className="text-sm font-semibold mb-2">Choose TWO letters, A-E. Which TWO statements are made about life by the River Thames in the early nineteenth century?</p>
                      <div className="space-y-2">{['The area was very crowded.', 'There was an absence of crime.', 'Casual work was in great demand.', 'Several different languages were in use.', 'Inhabitants were known for their friendliness.'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['22_23'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('22_23', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                      {renderMultiSelectStatus('22_23', ['A', 'C'])}
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p>Complete the sentences below. Use <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>
                      <div className="space-y-4 mt-4">
                        <p><strong>24</strong> In the nineteenth century, only a minority of dock workers received a <Input value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} />.</p>
                        <p><strong>25</strong> Cranes were operated manually because <Input value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> created a risk of fire.</p>
                        <p><strong>26</strong> Observers who were unfamiliar with London's docks found the River Thames <Input value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} />.</p>
                      </div>
                    </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>27</strong> Video game use amongst preschool children is higher in the US than in other countries.</p><Input value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} />
                      <p><strong>28</strong> The proportion of preschool children using video games is likely to rise.</p><Input value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} />
                      <p><strong>29</strong> Parents in the US who own gaming equipment generally allow their children to play with it.</p><Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> The type of research which manufacturers usually do is aimed at improving game design.</p><Input value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> Both old and young games consumers require research which is specifically targeted.</p><Input value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-36</h3><p>Complete the summary using the list of words/phrases, A-I, below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">Problems for preschool users of video games</h4>
                      <p>Preschool children find many electronic games difficult, because neither their motor skills nor their <strong>32</strong> <Input className="inline-block w-20 ml-1" value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} /> are sufficiently developed.</p>
                      <p>Certain types of control are hard for these children to manipulate: for example, <strong>33</strong> <Input className="inline-block w-20 ml-1" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} /> can be more effective than styluses.</p>
                      <p>Also, although they already have the ability to relate <strong>34</strong> <Input className="inline-block w-20 ml-1" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> to real-world objects, preschool children are largely unable to understand the connection between their own <strong>35</strong> <Input className="inline-block w-20 ml-1" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> and the movements they can see on the screen. Finally, very few preschool children can understand <strong>36</strong> <Input className="inline-block w-20 ml-1" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 grid grid-cols-3 gap-2 text-sm">
                      <p><strong>A</strong> actions</p><p><strong>B</strong> buttons</p><p><strong>C</strong> cognitive skills</p>
                      <p><strong>D</strong> concentration</p><p><strong>E</strong> fingers</p><p><strong>F</strong> pictures</p>
                      <p><strong>G</strong> sounds</p><p><strong>H</strong> spoken instructions</p><p><strong>I</strong> written menus</p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-4">
                    <p><strong>37</strong> In 2007, what conclusion did games producers at Nickelodeon come to?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">The preschool market was unlikely to be sufficiently profitable.</li><li className="ml-2">One of their hardware products would probably be suitable for preschoolers.</li><li className="ml-2">Games produced by rival companies were completely inappropriate for preschoolers.</li><li className="ml-2">They should put their ideas for new games for preschoolers into practice.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} />
                    <p><strong>38</strong> The study carried out by Nickelodeon</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">was based on children living in various parts of the world.</li><li className="ml-2">focused on the kinds of game content which interests preschoolers.</li><li className="ml-2">investigated the specific characteristics of the target market.</li><li className="ml-2">led to products which appealed mainly to the US consumers.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} />
                    <p><strong>39</strong> Which problem do the writers highlight concerning games instructions for young children?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">Spoken instructions take up a lot of the available memory.</li><li className="ml-2">Written instructions have to be expressed very simply.</li><li className="ml-2">The children do not follow instructions consistently.</li><li className="ml-2">The video images distract attention from the instructions.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} />
                    <p><strong>40</strong> Which is the best title for Reading Passage 3?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">An overview of video games software for the preschool market</li><li className="ml-2">Researching and designing video games for preschool children</li><li className="ml-2">The effects of video games on the behaviour of young children</li><li className="ml-2">Assessing the impact of video games on educational achievement</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} />
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { 
          let userAnswer: string = ''; let isCorrect: boolean = false; let questionDisplay = `Q${qNum}`;
          const multiSelectKeys: {[key: string]: string[]} = {'20_21': ['C', 'E'], '22_23': ['A', 'C']};
          const multiSelectInfo = Object.entries(multiSelectKeys).find(([key]) => key.split('_').includes(qNum));

          if (multiSelectInfo) {
            const [key, correctSet] = multiSelectInfo;
            userAnswer = (multipleAnswers[key as keyof typeof multipleAnswers] || []).join(', ');
            const correctAns = correctSet.join(', ');
            isCorrect = correctSet.every(a => userAnswer.includes(a)) && userAnswer.split(', ').length === correctSet.length;
            questionDisplay = `Q${key.replace('_', '-')}`;
            if (qNum === key.split('_')[0]) return null;
            return (
              <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between"><span className="font-semibold">{questionDisplay}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                <div>Your: {userAnswer || '(none)'}</div>
                {!isCorrect && <div>Correct: {correctAns}</div>}
              </div>
            );
          } else { 
            userAnswer = answers[qNum] || ''; 
            isCorrect = checkAnswer(qNum); 
            return (
              <div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                <div>Your: {userAnswer || '(none)'}</div>
                {!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}
              </div>
            );
          }
        })}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <PageViewTracker 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={4}
          />
          <TestStatistics 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={4}
          />
          <UserTestHistory 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={4}
          />
        </div>
      </div>
    </div>
  )
}