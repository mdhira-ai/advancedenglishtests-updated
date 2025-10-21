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

export default function Book1ReadingTest4() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '20_21_22': [], '23_24': [],
  })
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedClick = useRef(false);
  
  const { data: session } = useSession();
  
  const handleTestStart = () => {
    setIsTestStarted(true);
    setStartTime(Date.now());
  };
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
    } else if (interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTestStarted, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }))
  }

  const handleMultiSelect = (key: '20_21_22' | '23_24', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        const maxSelections = key === '20_21_22' ? 3 : 2;
        let newAnswers = current.includes(value) 
            ? current.filter(ans => ans !== value) 
            : (current.length < maxSelections ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    // Skip multi-select questions 20-24 as they're handled differently
    if (['20', '21', '22', '23', '24'].includes(questionNumber)) {
        return false; // Will be calculated in calculateScore
    }
    
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const userAnswer = answers[questionNumber] || ''
    if (!userAnswer.trim()) return false
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const questionNumber of Object.keys(correctAnswers)) {
      // Skip multi-select questions 20-24
      if (!['20', '21', '22', '23', '24'].includes(questionNumber)) {
        if (checkAnswer(questionNumber)) correctCount++
      }
    }
    
    // Handle multi-select questions 20-22
    const userChoices20_21_22 = multipleAnswers['20_21_22'] || [];
    const correctSet20_21_22 = ['B', 'D', 'E'];
    userChoices20_21_22.forEach(choice => {
        if (correctSet20_21_22.includes(choice)) {
            correctCount++;
        }
    });

    // Handle multi-select questions 23-24
    const userChoices23_24 = multipleAnswers['23_24'] || [];
    const correctSet23_24 = ['A', 'D'];
    userChoices23_24.forEach(choice => {
        if (correctSet23_24.includes(choice)) {
            correctCount++;
        }
    });
    
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      
      await saveTestScore({
        book: 'practice-tests-plus-1',
        module: 'reading',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: 40,
        percentage: Math.round((calculatedScore / 40) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      }, session);
      
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
    setAnswers({}); setMultipleAnswers({ '20_21_22': [], '23_24': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60);
    clearAllHighlights();
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const renderMultiSelect = (key: '20_21_22' | '23_24', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
            const opt = String.fromCharCode(65 + index);
            const isSelected = multipleAnswers[key]?.includes(opt) || false;
            const isCorrect = correctSet.includes(opt);
            return (
                <label key={opt} className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                    submitted && isCorrect ? 'bg-green-50 border border-green-200' : 
                    submitted && isSelected && !isCorrect ? 'bg-red-50 border border-red-200' : 
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                }`}>
                    <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => !submitted && handleMultiSelect(key, opt)}
                        disabled={submitted || !isTestStarted}
                        className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm">{opt}. {option}</span>
                </label>
            );
            })}
        </div>
        {submitted && <div className="mt-2 text-sm font-semibold text-green-600">Correct answers: {correctSet.join(', ')}</div>}
    </div>
  );

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'D', '2': 'B', '3': 'C', '4': 'A', '5': 'NO', '6': 'YES', '7': 'NO', '8': 'YES', '9': 'NOT GIVEN', '10': 'YES', '11': 'NOT GIVEN', '12': 'B', '13': 'A',
    '14': 'YES', '15': 'YES', '16': 'NOT GIVEN', '17': 'NO', '18': 'NO', '19': 'NOT GIVEN',
    '20': 'B D E', '21': 'B D E', '22': 'B D E',
    '23': 'A D', '24': 'A D',
    '25': 'World Tourism Organisation', '26': 'city entrepreneurs', '27': '(the) 1992 Earth Summit',
    '28': 'ability', '29': 'note', '30': 'relative', '31': 'music lessons', '32': 'tone', '33': 'words', '34': 'pitch', '35': 'cultures',
    '36': 'D', '37': 'B', '38': 'A', '39': 'E', '40': 'C'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 1 - Reading Test 4</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-center"><div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div></div>{!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}{isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}{submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}</div></CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">Reading Passages</h2>
            <TextHighlighter><div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">The Great Australian Fence</p>
                <p><span className="font-semibold">A</span> war has been going on for almost a hundred years between the sheep farmers of Australia and the dingo, Australia's wild dog. To protect their livelihoods, the farmers built a wire fence, 5,307 miles of continuous wire mesh reaching from the coast of South Australia all the way to the cotton fields of eastern Queensland, just short of the Pacific Ocean. The fence is Australia's version of the Great Wall of China, but even longer, erected to keep out hostile invaders, in this case hordes of yellow dogs. The empire it preserves is that of the woolgrowers, sovereigns of the world's second largest sheep flock, after China's - some 123 million head - and keepers of a wool export business worth four billion dollars. Never mind that more and more people - conservationists, politicians, taxpayers and animal lovers - say that such a barrier would never be allowed today on ecological grounds. With sections of it almost a hundred years old, the dog fence has become, as conservationist Lindsay Fairweather ruefully admits, 'an icon of Australian frontier ingenuity'.</p>
                <p>To appreciate this unusual outback monument and to meet the people whose livelihoods depend on it, I spent part of an Australian autumn travelling the wire. It's known by different names in different states: the Dog Fence in South Australia, the Border Fence in New South Wales and the Barrier Fence in Queensland. I would call it simply the Fence.</p>
                <p>For most of its prodigious length, this epic fence winds like a river across a landscape that, unless a big rain has fallen, scarcely has rivers. The eccentric route, prescribed mostly by property lines, provides a sampler of outback topography: the Fence goes over sand dunes, past salt lakes, up and down rock-strewn hills, through dense scrub and across barren plains.</p>
                <p>The Fence stays away from towns. Where it passes near a town, it has actually become a tourist attraction visited on bus tours. It marks the traditional dividing line between cattle and sheep. Inside, where the dingoes are legally classified as vermin, they are shot, poisoned and trapped. Sheep and dingoes do not mix and the Fence sends that message mile after mile.</p>
                <p>What is this creature that by itself threatens an entire industry, inflicting several millions of dollars of damage a year despite the presence of the world's most obsessive fence? Cousin to the coyote and the jackal, descended from the Asian wolf, Canis lupus dingo is an introduced species of wild dog. Skeletal remains indicate that the dingo was introduced to Australia more than 3,500 years ago probably with Asian seafarers who landed on the north coast. The adaptable dingo spread rapidly and in a short time became the top predator, killing off all its marsupial competitors. The dingo looks like a small wolf with a long nose, short pointed ears and a bushy tail. Dingoes rarely bark; they yelp and howl. Standing about 22 inches at the shoulder - slightly taller than a coyote - the dingo is Australia's largest land carnivore.</p>
                <p>The woolgrowers' war against dingoes, which is similar to the sheep ranchers' rage against coyotes in the US, started not long after the first European settlers disembarked in 1788, bringing with them a cargo of sheep. Dingoes officially became outlaws in 1830 when governments placed a bounty on their heads. Today bounties for problem dogs killing sheep inside the Fence can reach $500. As pioneers penetrated the interior with their flocks of sheep, fences replaced shepherds until, by the end of the 19th century, thousands of miles of barrier fencing crisscrossed the vast grazing lands. 'The dingo started out as a quiet observer,' writes Roland Breckwoldt in A Very Elegant Animal: The Dingo, 'but soon came to represent everything that was dark and dangerous on the continent.' It is estimated that since sheep arrived in Australia, dingo numbers have increased a hundredfold. Though dingoes have been eradicated from parts of Australia, an educated guess puts the population at more than a million.</p>
                <p>Eventually government officials and graziers agreed that one well-maintained fence, placed on the outer rim of sheep country and paid for by taxes levied on woolgrowers, should supplant the maze of private netting. By 1960, three states joined their barriers to form a single dog fence. The intense private battles between woolgrowers and dingoes have usually served to define the Fence only in economic terms. It marks the difference between profit and loss. Yet the Fence casts a much broader ecological shadow for it has become a kind of terrestrial dam, deflecting the flow of animals inside and out. The ecological side effects appear most vividly at Sturt National Park. In 1845 explorer Charles Sturt led an expedition through these parts on a futile search for an inland sea. For Sturt and other early explorers, it was a rare event to see a kangaroo. Now they are ubiquitous for without a native predator the kangaroo population has exploded inside the Fence. Kangaroos are now cursed more than dingoes. They have become the rivals of sheep, competing for water and grass. In response state governments cull more than three million kangaroos a year to keep Australia's national symbol from overrunning the pastoral lands. Park officials, who recognise that the fence is to blame, respond to the excess of kangaroos by saying 'The fence is there, and we have to live with it.'</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">IT'S ECO-LOGICAL</p>
                <p>Planning an eco-friendly holiday can be a minefield for the well-meaning traveller, says Steve Watkins. But help is now at hand</p>
                <p>If there were awards for tourism phrases that have been hijacked, diluted and misused then 'ecotourism' would earn top prize. The term first surfaced in the early 1980s reflecting a surge in environmental awareness and a realisation by tour operators that many travellers wanted to believe their presence abroad would not have a negative impact. It rapidly became the hottest marketing tag a holiday could carry.</p>
                <p>These days the ecotourism label is used to cover anything from a two-week tour living with remote Indonesian tribes, to a one-hour motorboat trip through an Australian gorge. In fact, any tour that involves cultural interaction, natural beauty spots, wildlife or a dash of soft-adventure is likely to be included in the overblown ecotourism folder. There is no doubt the original motives behind the movement were honourable attempts to provide a way for those who cared to make informed choices, but the lack of regulations and a standard industry definition left many travellers lost in an ecotourism jungle.</p>
                <p>It is easier to understand why the ecotourism market has become so overcrowded when we look at its wider role in the world economy. According to World Tourism Organisation figures, ecotourism is worth US$20 billion a year and makes up one-fifth of all international tourism. Add to this an annual growth rate of around five per cent and the pressure for many operators, both in developed and developing countries, to jump on the accelerating bandwagon is compelling. Without any widely recognised accreditation system, the consumer has been left to investigate the credentials of an operator themselves. This is a time-consuming process and many travellers usually take an operator's claims at face value, only adding to the proliferation of fake ecotours.</p>
                <p>However, there are several simple questions that will provide qualifying evidence of a company's commitment to minimise its impact on the environment and maximise the benefits to the tourism area's local community. For example, does the company use recycled or sustainable, locally harvested materials to build its tourist properties? Do they pay fair wages to all employees? Do they offer training to employees? It is common for city entrepreneurs to own tour companies in country areas, which can mean the money you pay ends up in the city rather than in the community being visited. By taking a little extra time to investigate the ecotourism options it is not only possible to guide your custom to worthy operators but you will often find that the experience they offer is far more rewarding.</p>
                <p>The ecotourism business is still very much in need of a shake-up and a standardised approach. There are a few organisations that have sprung up in the last ten years or so that endeavour to educate travellers and operators about the benefits of responsible ecotourism. Founded in 1990, the Ecotourism Society (TES) is a non-profit organisation of travel industry, conservation and ecological professionals, which aims to make ecotourism a genuine tool for conservation and sustainable development. Helping to create inherent economic value in wilderness environments and threatened cultures has undoubtedly been one of the ecotourism movement's most notable achievements. TES organises an annual initiative to further aid development of the ecotourism industry. This year it is launching 'Your Travel Choice Makes a Difference', an educational campaign aimed at helping consumers understand the potential positive and negative impacts of their travel decisions. TES also offers guidance on the choice of ecotours and has established a register of approved ecotourism operators around the world.</p>
                <p>A leading ecotourism operator in the United Kingdom is Tribes, which won the 1999 Tourism Concern and Independent Traveller's World 'Award for Most Responsible Tour Operator'. Amanda Marks, owner and director of Tribes, believes that the ecotourism industry still has some way to go to get its house in order. 'Until now, an ecotourism accreditation scheme has really worked primarily because there has been no systematic way of checking that accredited companies actually comply with the code of practice. Amanda believes that the most promising system is the recently re-launched Green Globe 21 scheme. The Green Globe 21 award is based on the sustainable development standards contained in Agenda 21 from the 1992 Earth Summit and was originally coordinated by the World Travel & Tourism Council (WTTC). The scheme is now an independent concern, though the WTTC still supports it. Until recently, tour companies became affiliates and could use the Green Globe logo merely on payment of an annual fee, hardly a suitable qualifying standard. However, in November 1999 Green Globe 21 introduced an annual, independent check on operators wishing to use the logo.</p>
                <p>Miriam Cain, from the Green Globe 21 marketing development, explains that current and new affiliates will now have one year to ensure that their operations comply with Agenda 21 standards. If they fail the first inspection they can only reapply once. The inspection process is not a cheap option, especially for large companies, but the benefits of having Green Globe status and the potential operational cost savings that complying with the standards can bring should be significant. 'We have joint ventures with organisations around the world, including Australia and the Caribbean that will allow us to effectively check all affiliate operators,' says Miriam. The scheme also allows destination communities to become Green Globe 21 approved.</p>
                <p>For a relatively new industry it is not surprising that ecotourism has undergone teething pains. However, there are signs that things are changing for the better. With a committed and unified approach by the travel industry, local communities, travellers and environmental experts could make ecotourism a tag to be proud of and trusted.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                <p className="text-center text-gray-500 italic mb-4">Striking the Right Note</p>
                <p>Is perfect pitch a rare talent possessed solely by the likes of Beethoven? Kathryn Brown discusses this much sought-after musical ability</p>
                <p>The uncanny, if sometimes distracting, ability to name a solitary note out of the blue, without any other notes for reference, is a prized musical talent - and a scientific mystery. Musicians with perfect pitch - or, as many researchers prefer to call it, absolute pitch - can often play pieces by ear, and many can transcribe music brilliantly. That's because they perceive the position of a note in the musical stave - its pitch - as clearly as the fact that they heard it. Hearing and naming the pitch go hand in hand.</p>
                <p>By contrast, most musicians follow not the notes, but the relationship between them. They may easily recognise two notes as being a certain number of tones apart, but could name the higher note as an E only if they are told the lower one is a C, for example. This is relative pitch. Useful, but much less mysterious.</p>
                <p>For centuries, absolute pitch has been thought of as the preserve of the musical elite. Some estimates suggest that maybe fewer than 1 in 2,000 people possess it. But a growing number of studies, from speech experiments to brain scans are now suggesting that a knack for absolute pitch may be far more common, and more varied, than previously thought. 'Absolute pitch is not an all or nothing feature,' says Marvin, a music theorist at the University of Rochester in New York state. Some researchers even claim that we could all develop the skill regardless of our musical talent. And their work may finally settle a decades-old debate about whether absolute pitch depends on melodious genes - or early music lessons.</p>
                <p>Music psychologist Diana Deutsch at the University of California in San Diego is the leading voice. Last month at the Acoustical Society of America meeting in Columbus, Ohio, Deutsch reported a study that suggests we all have the potential to acquire absolute pitch - and that speakers of tone languages use it every day. A third of the world's population - chiefly people in Asia and Africa - speak tone languages, in which a word's meaning can vary depending on the pitch a speaker uses.</p>
                <p>Deutsch and her colleagues asked seven native Vietnamese speakers and 15 native Mandarin speakers to read out lists of words on different days. The chosen words spanned a range of pitches, to force the speakers to raise and lower their voices considerably. By recording these recited lists and taking the average pitch for each whole word, the researchers compared the pitches used by each person to say each word on different days. Both groups showed strikingly consistent pitch for any given word - often less than a quarter-tone difference between days. 'The similarity,' Deutsch says, 'is mind-boggling.' It's also, she says, a real example of absolute pitch. As babies, the speakers learnt to associate certain pitches with meaningful words - just as a musician labels one tone A and another B - and they demonstrate this precise use of pitch regardless of whether or not they have had any musical training, she adds.</p>
                <p>Deutsch isn't the only researcher turning up everyday evidence of absolute pitch. At least three other experiments have found that people can launch into familiar songs at or very near the correct pitches. Some researchers have nicknamed this ability 'absolute memory', and they say it pops up on other senses, too. Given studies like these, the real mystery is why we don't all have absolute pitch, says cognitive psychologist Daniel Levitin of McGill University in Montreal.</p>
                <p>Over the past decade, researchers have confirmed that absolute pitch often runs in families. Nelson Freimer of the University of California in San Francisco, for example, is just completing a study that he says strongly suggests the right genes help create this brand of musical genius. Freimer gave tone tests to people with absolute pitch and to their relatives. He also tested several hundred pitch people who had taken early music lessons. He found that relatives of people with absolute pitch were far more likely to develop the skill than people who simply had the music lessons. 'There is clearly a familial aggregation of absolute pitch,' Freimer says.</p>
                <p>Freimer says some children are probably genetically predisposed toward absolute pitch - and this innate inclination blossoms during childhood music lessons. Indeed, many researchers now point to this harmony of nature and nurture to explain why musicians with absolute pitch show different levels of the talent. Indeed, researchers are finding more and more evidence suggesting music lessons are critical to the development of absolute pitch. In a survey of 2,700 students in American music conservatories and college programmes, New York University geneticist Peter Gregersen and his colleagues found that a whopping 32 per cent of the Asian students reported having absolute pitch, compared with just 7 per cent of non-Asian students. While that might suggest a genetic tendency towards absolute pitch in the Asian population, Gregersen says that the type and timing of music lessons probably explains much of the difference. 'For one thing, those with absolute pitch started lessons, on average, when they were five years old, while those without absolute pitch started around the age of eight. Moreover, adds Gregersen, the type of music lessons favoured in Asia, and by many of the Asian families in his study, such as the Suzuki method, often focus on playing by ear and learning the names of musical notes, while those more commonly used in the US tend to emphasise learning scales in a relative pitch way. In Japanese pre-school music programmes, he says, children often have to listen to notes played on a piano and hold up a coloured flag to signal the pitch. 'There's a distinct cultural difference,' he says.</p>
                <p>Deutsch predicts that further studies will reveal absolute pitch - in its imperfect, latent form inside all of us. The Western emphasis on relative pitch simply obscures it, she contends. 'It's very likely that scientists will end up concluding that we're all born with the potential to acquire very fine-grained absolute pitch. It's really just a matter of life getting in the way.'</p>
              </CardContent></Card>
            </div></TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2"><div className="flex space-x-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button><button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-27</button><button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 28-40</button></div></div>
              {activeTab === 'section1' && (<Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-4</h3><p className="mb-4"><strong>Choose the appropriate letters A-D and write them in boxes 1-4 on your answer sheet.</strong></p><div className="space-y-6"><div><p><span className="font-semibold">1</span> Why was the fence built?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> to separate the sheep from the cattle</p><p><strong>B</strong> to stop the dingoes from being slaughtered by farmers</p><p><strong>C</strong> to act as a boundary between properties</p><p><strong>D</strong> to protect the Australian wool industry</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">2</span> On what point do the conservationists and politicians agree?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> Wool exports are vital to the economy.</p><p><strong>B</strong> The fence poses a threat to the environment.</p><p><strong>C</strong> The fence acts as a useful frontier between states.</p><p><strong>D</strong> The number of dogs needs to be reduced.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">3</span> Why did the author visit Australia?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> to study Australian farming methods</p><p><strong>B</strong> to investigate how the fence was constructed</p><p><strong>C</strong> because he was interested in life around the fence</p><p><strong>D</strong> because he wanted to learn more about the wool industry</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">4</span> How does the author feel about the fence?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> impressed</p><p><strong>B</strong> delighted</p><p><strong>C</strong> shocked</p><p><strong>D</strong> annoyed</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 5-11</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">Write:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>YES</strong> if the statement agrees with the writer's views</p>
                      <p><strong>NO</strong> if the statement contradicts the writer's views</p>
                      <p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p>
                    </div>
                  </div>
                  <div className="space-y-3"><div>5. The fence serves a different purpose in each state. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>6. The fence is only partially successful. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>7. The dingo is indigenous to Australia. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>8. Dingoes have flourished as a result of the sheep industry. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>9. Dingoes are known to attack humans. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>10. Kangaroos have increased in number because of the fence. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>11. The author does not agree with the culling of kangaroos. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 12-13</h3><p className="mb-4"><strong>Choose the appropriate letters A-D and write them in boxes 12-13 on your answer sheet.</strong></p><div className="space-y-6"><div><p><span className="font-semibold">12</span> When did the authorities first acknowledge the dingo problem?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> 1788</p><p><strong>B</strong> 1830</p><p><strong>C</strong> 1845</p><p><strong>D</strong> 1960</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div><p><span className="font-semibold">13</span> How do the park officials feel about the fence?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> philosophical</p><p><strong>B</strong> angry</p><p><strong>C</strong> pleased</p><p><strong>D</strong> proud</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
              </CardContent></Card>)}
              {activeTab === 'section2' && (<Card><CardHeader><CardTitle>Questions 14-27</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 2?</strong></p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">Write:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>YES</strong> if the statement agrees with the writer's views</p>
                      <p><strong>NO</strong> if the statement contradicts the writer's views</p>
                      <p><strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this</p>
                    </div>
                  </div>
                  <div className="space-y-3"><div>14. The term 'ecotourism' has become an advertising gimmick. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>15. The intentions of those who coined the term 'ecotourism' were sincere. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>16. Ecotourism is growing at a faster rate than any other type of travel. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>17. It is surprising that so many tour organisations decided to become involved in ecotourism. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>18. Tourists have learnt to make investigations about tour operators before using them. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>19. Tourists have had bad experiences on ecotour holidays. <Input className={`ml-auto max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
                  <div className="mb-8">
                    {renderMultiSelect('20_21_22', 'Questions 20-22', 'According to the information given in the reading passage, which THREE of the following are true of the Ecotourism Society (TES)?', 
                        [
                            'It has monitored the growth in ecotourism.',
                            'It involves a range of specialists in the field.',
                            'It has received public recognition for the role it performs.',
                            'It sets up regular ecotour promotions.',
                            'It offers information on ecotours at an international level.',
                            'It consults with people working in tourist destinations.'
                        ], 
                        ['B', 'D', 'E']
                    )}
                  </div>
                  <div className="mb-8">
                    {renderMultiSelect('23_24', 'Questions 23-24', 'According to the information given in the reading passage, which TWO of the following are true of the Green Globe 21 award?', 
                        [
                            'The scheme is self-regulating.',
                            'Amanda Marks was recruited to develop the award.',
                            'Prior to 1999 companies were not required to pay for membership.',
                            'Both tour operators and tour sites can apply for affiliation.',
                            'It intends to reduce the number of ecotour operators.'
                        ], 
                        ['A', 'D']
                    )}
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 25-27</h3><p className="mb-4"><strong>Using NO MORE THAN THREE WORDS, answer the following questions.</strong></p><div className="space-y-4"><div>25. Which body provides information on global tourist numbers? <Input value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`mt-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}/></div><div>26. Who often gains financially from tourism in rural environments? <Input value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`mt-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}/></div><div>27. Which meeting provided the principles behind the Green Globe 21 regulations? <Input value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} className={`mt-1 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}/></div></div></div>
              </CardContent></Card>)}
              {activeTab === 'section3' && (<Card><CardHeader><CardTitle>Questions 28-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 28-35</h3><p className="mb-4"><strong>Complete the notes below using words from the box. Write your answers in boxes 28-35 on your answer sheet.</strong></p><div className="bg-gray-50 p-4 rounded-lg space-y-3"><h4 className="font-semibold text-center mb-2">NOTES</h4><p>Research is being conducted into the mysterious musical ... <strong>28</strong> ... some people possess known as perfect pitch. Musicians with this talent are able to name and sing a ... <strong>29</strong> ... without reference to another and it is this that separates them from the majority who have only ... <strong>30</strong> ... pitch. The research aims to find out whether this skill is the product of genetic inheritance or early exposure to ... <strong>31</strong> ... or, as some researchers believe, a combination of both. One research team sought a link between perfect pitch and ... <strong>32</strong> ... languages in order to explain the high number of Asian speakers with perfect pitch. Speakers of Vietnamese and Mandarin were asked to recite ... <strong>33</strong> ... on different occasions and the results were then compared in terms of ... <strong>34</strong> ... . A separate study found that the approach to teaching music in many Asian ... <strong>35</strong> ... emphasised playing by ear whereas the US method was based on the relative pitch approach.</p></div><div className="bg-gray-100 p-4 rounded-lg mt-4 grid grid-cols-4 gap-2 text-sm text-center"><p>tendency</p><p>note</p><p>ability</p><p>song</p><p>ancient</p><p>cultures</p><p>relative</p><p>primitive</p><p>pitch</p><p>music lessons</p><p>language</p><p>absolute</p><p>tone</p><p>words</p><p>melody</p><p>learning scales</p><p>spoken</p><p>names</p><p>musical instruments</p><p>universities</p></div><div className="mt-4 grid grid-cols-2 gap-4"><div>28. <Input value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>29. <Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>30. <Input value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>31. <Input value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>32. <Input value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>33. <Input value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>34. <Input value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div><div>35. <Input value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} className={getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}/></div></div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 36-40</h3><p className="mb-4"><strong>Reading Passage 3 contains a number of opinions provided by five different scientists. Match each opinion (Questions 36-40) with the scientists (A-E).</strong></p><div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm"><p><strong>A</strong> Levitin</p><p><strong>B</strong> Deutsch</p><p><strong>C</strong> Gregersen</p><p><strong>D</strong> Marvin</p><p><strong>E</strong> Freimer</p></div><div className="space-y-3"><div>36. Absolute pitch is not a clear-cut issue. <Input className={`ml-auto w-20 ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>37. Anyone can learn how to acquire perfect pitch. <Input className={`ml-auto w-20 ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>38. It's actually surprising that not everyone has absolute pitch. <Input className={`ml-auto w-20 ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>39. The perfect pitch ability is genetic. <Input className={`ml-auto w-20 ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div><div>40. The important thing is the age at which music lessons are started. <Input className={`ml-auto w-20 ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} /></div></div></div>
              </CardContent></Card>)}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {submitted && (<Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4"><div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div><div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div><div className="flex justify-center space-x-4 mt-6"><Button onClick={handleReset} variant="outline">Try Again</Button><Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button></div></div></CardContent></Card>)}
        {showAnswers && (<Card className="mt-8"><CardHeader><CardTitle>Answer Key</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{Object.entries(correctAnswers).map(([question, answer]) => (<div key={question} className="flex justify-between p-2 bg-gray-50 rounded"><span className="font-semibold">{question}:</span><span className="text-gray-800">{answer}</span></div>))}</div></CardContent></Card>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div><div className="text-center"><div className="text-3xl font-bold text-red-600">{40 - score}</div><div className="text-sm text-gray-600">Incorrect Answers</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !['20', '21', '22', '23', '24'].includes(q)).map((qNum) => { const userAnswer = answers[qNum] || ''; const correctAnswer = correctAnswers[qNum as keyof typeof correctAnswers]; const isCorrect = checkAnswer(qNum); const questionNumber = parseInt(qNum); const result = (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div></div></div>); if (questionNumber === 19) { const userChoices20_21_22 = multipleAnswers['20_21_22'] || []; const correctSet20_21_22 = ['B', 'D', 'E']; const isCorrect20_22 = userChoices20_21_22.length === 3 && userChoices20_21_22.every(choice => correctSet20_21_22.includes(choice)) && correctSet20_21_22.every(choice => userChoices20_21_22.includes(choice)); const userChoices23_24 = multipleAnswers['23_24'] || []; const correctSet23_24 = ['A', 'D']; const isCorrect23_24 = userChoices23_24.length === 2 && userChoices23_24.every(choice => correctSet23_24.includes(choice)) && correctSet23_24.every(choice => userChoices23_24.includes(choice)); return [result, <div key="20-22" className={`p-3 rounded border ${isCorrect20_22 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Questions 20-22 (Multi-select)</span><span className={`font-bold ${isCorrect20_22 ? 'text-green-600' : 'text-red-600'}`}>{isCorrect20_22 ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answers: </span><span className={`font-medium ${isCorrect20_22 ? 'text-green-700' : 'text-red-700'}`}>{userChoices20_21_22.join(', ') || '(No answers)'}</span></div><div><span className="text-gray-600">Correct answers: </span><span className="font-medium text-green-700">B, D, E</span></div></div></div>, <div key="23-24" className={`p-3 rounded border ${isCorrect23_24 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Questions 23-24 (Multi-select)</span><span className={`font-bold ${isCorrect23_24 ? 'text-green-600' : 'text-red-600'}`}>{isCorrect23_24 ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answers: </span><span className={`font-medium ${isCorrect23_24 ? 'text-green-700' : 'text-red-700'}`}>{userChoices23_24.join(', ') || '(No answers)'}</span></div><div><span className="text-gray-600">Correct answers: </span><span className="font-medium text-green-700">A, D</span></div></div></div>]; } return result; }).flat()}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          <PageViewTracker 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={4} 
          />
          <TestStatistics 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={4} 
          />
          <UserTestHistory 
            book="practice-tests-plus-1" 
            module="reading" 
            testNumber={4}
          />
        </div>
      </div>
    </div>
  )
}