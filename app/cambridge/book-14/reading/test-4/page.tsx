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

export default function Book14ReadingTest4() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '23_24': [], '25_26': [],
  })
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

  const handleMultiSelect = (key: '23_24' | '25_26', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const checkAnswer = (questionNumber: string): boolean => {
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    
    // Skip multi-select questions 23-26 as they're handled differently
    if (['23', '24', '25', '26'].includes(questionNumber)) {
        return false; // Will be calculated in calculateScore
    }

    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&') || ['23', '24', '25', '26'].includes(qNum)) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    
    // Handle multi-select questions 23-24
    const userChoices23_24 = multipleAnswers['23_24'] || [];
    const correctSet23_24 = ['B', 'D'];
    userChoices23_24.forEach(choice => {
        if (correctSet23_24.includes(choice)) {
            correctCount++;
        }
    });

    // Handle multi-select questions 25-26
    const userChoices25_26 = multipleAnswers['25_26'] || [];
    const correctSet25_26 = ['B', 'E'];
    userChoices25_26.forEach(choice => {
        if (correctSet25_26.includes(choice)) {
            correctCount++;
        }
    });
    
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
    setAnswers({}); setMultipleAnswers({ '23_24': [], '25_26': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'

  const renderMultiSelect = (key: '23_24' | '25_26', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
            const opt = String.fromCharCode(65 + index);
            return (
                <label key={opt} className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        value={opt} 
                        checked={multipleAnswers[key].includes(opt)} 
                        onChange={() => handleMultiSelect(key, opt)} 
                        disabled={!isTestStarted || submitted} 
                    />
                    <span><strong>{opt}</strong> {option}</span>
                </label>
            );
            })}
        </div>
        {submitted && <div className="mt-2 text-sm font-semibold text-green-600">Correct answers: {correctSet.join(', ')}</div>}
    </div>
  );

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'four/4', '2': 'young', '3': 'food', '4': 'light', '5': 'aggressively', '6': 'location', '7': 'neurons', '8': 'chemicals',
    '9': 'FALSE', '10': 'TRUE', '11': 'FALSE', '12': 'NOT GIVEN', '13': 'TRUE', '14': 'B', '15': 'E', '16': 'C', '17': 'A', '18': 'TRUE',
    '19': 'TRUE', '20': 'NOT GIVEN', '21': 'FALSE', '22': 'NOT GIVEN', 
    '23': 'B', '24': 'D', '23&24': ['B', 'D'],
    '25': 'B', '26': 'E', '25&26': ['B', 'E'],
    '27': 'FALSE', '28': 'NOT GIVEN', '29': 'FALSE', '30': 'TRUE', '31': 'FALSE', '32': 'TRUE', '33': 'NOT GIVEN', '34': 'large',
    '35': 'microplastic', '36': 'populations', '37': 'concentrations', '38': 'predators', '39': 'disasters', '40': 'A'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageViewTracker book="book-14" module="reading" testNumber={4} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 14 - Reading Test 4</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div></div>
        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">The secret of staying young</p>
                     <p>Pheidole dentata, a native ant of the south-eastern U.S., isn’t immortal. But scientists have found that it doesn’t seem to show any signs of aging. Old worker ants can do everything just as well as the youngsters, and their brains appear just as sharp. ‘We get a picture that these ants really don’t decline,’ says Ysabel Giraldo, who studied the ants for her doctoral thesis at Boston University.</p>
                     <p>Such age-defying feats are rare in the animal kingdom. Naked mole rats can live for almost 30 years and stay fit for nearly their entire lives. They can still reproduce even when old, and they never get cancer. But the vast majority of animals deteriorate with age, just like people do. ‘It’s this social complexity that makes P. dentata useful for studying aging in people,’ says Giraldo, now at the California Institute of Technology. Humans are also highly social, a trait that has been connected to healthier aging. By contrast, most animal studies of aging use mice, worms or fruit flies, which all lead much more isolated lives.</p>
                     <p>In the lab, P. dentata worker ants typically live for around 140 days. Giraldo focused on ants at four age ranges: 20 to 22 days, 45 to 47 days, 95 to 97 days and 120 to 122 days. Unlike all previous studies, which only estimated how old the ants were, her work tracked the ants from the time the pupae became adults, so she knew their exact ages. Then she put them through a range of tests.</p>
                     <p>Giraldo watched how well the ants took care of the young of the colony, recording how often each ant attended to, carried and fed them. She compared how well 20-day-old and 95-day-old ants followed the telltale scent that the insects usually leave to mark a trail to food. She tested how ants responded to light and also measured how active they were by counting how often ants in a small dish walked across a line. And she experimented with how ants react to live prey: a tethered fruit fly. Giraldo expected the older ants to perform poorly in all these tasks. But the elderly insects were all good caretakers and trail-followers. The 95-day-old ants could track the scent even longer than their younger counterparts. They all responded to light well, and the older ants were more active. And when it came to reacting to prey, the older ants attacked the poor fruit fly just as aggressively as the young ones did, flaring their mandibles or pulling at the fly’s legs.</p>
                     <p>Then Giraldo compared the brains of 20-day-old and 95-day-old ants, identifying any cells that were close to death. She saw no major differences with age, nor was there any difference in the location of the dying cells, showing that age didn’t seem to affect specific brain functions. Ants and other insects have structures in their brains called mushroom bodies, which are important for processing information, learning and memory. She also wanted to see if aging affects the density of synaptic complexes within these structures—regions where neurons come together. Again, the answer was no. What was more, the old ants didn’t experience any drop in the levels of either serotonin or dopamine—brain chemicals whose decline often coincides with aging. In humans, for example, a decrease in serotonin has been linked to Alzheimer’s disease.</p>
                     <p>‘This is the first time anyone has looked at both behavioral and neural changes in these ants so thoroughly,’ says Giraldo, who recently published the findings in the Proceedings of the Royal Society B. Scientists have looked at some similar aspects in bees, but the results of recent bee studies were mixed—some studies showed age-related declines, which biologists call senescence, and others didn’t. ‘For now, the study raises more questions than it answers,’ Giraldo says, ‘including how P. dentata stays in such good shape.’</p>
                     <p>Also, if the ants don’t deteriorate with age, why do they die at all? Out in the wild, the ants probably don’t live for a full 140 days, thanks to predators, disease and just living in an environment that’s much harsher than the comforts of the lab. ‘The lucky ants that do live into old age may suffer a steep decline just before dying,’ Giraldo says, but she can’t say for sure because her study wasn’t designed to follow an ant’s final moments.</p>
                     <p>‘It will be important to extend these findings to other species of social insects,’ says Gene E. Robinson, an entomologist at the University of Illinois at Urbana-Champaign. This ant might be unique, or it might represent a broader pattern among other social bugs with possible clues to the science of aging in larger animals. Either way, it seems that for these ants, age really doesn’t matter.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p className="text-center font-bold text-gray-800 mb-4">Why zoos are good</p>
                     <p className="italic text-center mb-4">Scientist David Hone makes the case for zoos</p>
                     <p><span className="font-semibold">A</span> In my view, it is perfectly possible for many species of animals living in zoos or wildlife parks to have a quality of life as high as, or higher than, in the wild. Animals in good zoos get a varied and high-quality diet with all the supplements required, and any illnesses they might have will be treated. Their movement might be somewhat restricted, but they have a safe environment in which to live, and they are spared bullying and social ostracism by others of their kind. They do not suffer from the threat or stress of predators, or the irritation and pain of parasites or injuries. The average captive animal will have a greater life expectancy compared with its wild counterpart, and will not die of drought, starvation or in the jaws of a predator. A lot of very nasty things happen to truly wild animals that just don’t happen in good zoos, and to view a life that is ‘free’ as one that is automatically ‘good’ is, I think, an error. Furthermore, zoos serve several key purposes.</p>
                     <p><span className="font-semibold">B</span> Firstly, zoos aid conservation. Colossal numbers of species are becoming extinct across the world, and many more are increasingly threatened and therefore risk extinction. Moreover, some of these collapses have been sudden, dramatic and unexpected, or were simply discovered very late in the day. A species protected in captivity can be bred up to provide a reservoir population against a population crash or extinction in the wild. A good number of species only exist in captivity, with many of these living in zoos. Still more only exist in the wild because they have been reintroduced from zoos, or have wild populations that have been boosted by captive-bred animals. Without these efforts there would be fewer species alive today. Although reintroduction successes are few and far between, the numbers are increasing, and the very fact that species have been saved or reintroduced as a result of captive breeding proves the value of such initiatives.</p>
                     <p><span className="font-semibold">C</span> Zoos also provide education. Many children and adults, especially those in cities, will never see a wild animal beyond a fox or a pigeon. While it is true that television documentaries are becoming ever more detailed and impressive, and many natural history specimens are on display in museums, there really is nothing to compare with seeing a living creature in the flesh, hearing it, smelling it, watching what it does and having the time to absorb details. That alone will bring a greater understanding and perspective to many, and hopefully give them a greater appreciation for wildlife, conservation efforts and how they can contribute.</p>
                     <p><span className="font-semibold">D</span> In addition to this, there is also the education that can take place in zoos through signs, talks and presentations which directly communicate information to visitors about the animals they are seeing and their place in the world. This was an area where zoos used to be lacking, but they are now increasingly sophisticated in their communication and outreach work. Many zoos also work directly to educate conservation workers in other countries, or send their animal keepers abroad to contribute their knowledge and skills to those working in zoos and reserves, thereby helping to improve conditions and reintroductions all over the world.</p>
                     <p><span className="font-semibold">E</span> Zoos also play a key role in research. If we are to save wild species and restore and repair ecosystems we need to know about how key species live, act and react. Being able to undertake research on animals in zoos where there is less risk and fewer variables means real changes can be effected on wild populations. Finding out about, for example, the oestrus cycle of an animal or its breeding rate helps us manage wild populations. Procedures such as capturing and moving at-risk or dangerous individuals are bolstered by knowledge gained in zoos about doses for anaesthetics, and by experience in handling and transporting animals. This can make a real difference to conservation efforts and to the reduction of human-animal conflicts, and can provide a knowledge base for helping with the increasing threats of habitat destruction and other problems.</p>
                     <p><span className="font-semibold">F</span> In conclusion, considering the many ongoing global threats to the environment, it is hard for me to see zoos as anything other than essential to the long-term survival of numerous species. They are vital not just in terms of protecting animals, but as a means of learning about them to aid those still in the wild, as well as educating and informing the general population about these animals and their world so that they can assist or at least accept the need to be more environmentally conscious. Without them, the world would be, and would increasingly become, a much poorer place.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                     <p>Chelsea Rochman, an ecologist at the University of California, Davis, has been trying to answer a dismal question: Is everything terrible, or are things just very, very bad?</p>
                     <p>Rochman is a member of the National Center for Ecological Analysis and Synthesis’s marine-debris working group, a collection of scientists who study, among other things, the growing problem of marine debris, also known as ocean trash. Plenty of studies have sounded alarm bells about the state of marine debris; in a recent paper published in the journal Ecology, Rochman and her colleagues set out to determine how many of those perceived risks are real.</p>
                     <p>Often, Rochman says, scientists will end a paper by speculating about the broader impacts of what they’ve found. For example, a study could show that certain seabirds eat plastic bags, and go on to warn that whole bird populations are at risk of dying out. ‘But the truth was that nobody had yet tested those perceived threats,’ Rochman says. ‘There wasn’t a lot of information.’</p>
                     <p>Rochman and her colleagues examined more than a hundred papers on the impacts of marine debris that were published through 2013. Within each paper, they asked what threats scientists had studied – 366 perceived threats in all – and what they’d actually found.</p>
                     <p>In 83 percent of cases, the perceived dangers of ocean trash were proven true. In the remaining cases, the working group found the studies had weaknesses in design and content which affected the validity of their conclusions – they lacked a control group, for example, or used faulty statistics.</p>
                     <p>Strikingly, Rochman says, only one well-designed study failed to find the effect it was looking for, an investigation of mussels ingesting microscopic plastic bits. The plastic moved from the mussels’ stomachs to their bloodstreams, scientists found, and stayed there for weeks – but didn’t seem to stress out the shellfish.</p>
                     <p>While mussels may be fine eating trash, though, the analysis also gave a clearer picture of the many ways that ocean debris is bothersome.</p>
                     <p>Within the studies they looked at, most of the proven threats came from plastic debris, rather than other materials like metal or wood. Most of the dangers also involved large pieces of debris – animals getting entangled in trash, for example, or eating it and severely injuring themselves.</p>
                     <p>But a lot of ocean debris is ‘microplastic’, or pieces smaller than five millimeters. These may be ingredients in cosmetics and toiletries, fibers shed by synthetic clothing in the wash, or eroded remnants of larger debris. Compared to the number of studies investigating large-scale debris, Rochman’s group found little research on the effects of these tiny bits. ‘There are a lot of open questions still for microplastic,’ Rochman says, though she notes that more papers on the subject have been published since 2013, the cutoff point for the group’s analysis.</p>
                     <p>There are also, she adds, a lot of open questions about the ways that ocean debris can lead to sea-creature death. Many studies have looked at how plastic affects an individual animal, or that animal’s tissues or cells, rather than whole populations. And in the lab, scientists often use higher concentrations of plastic than what’s really in the ocean. None of that tells us how many birds or fish or sea turtles could die from plastic pollution – or how deaths in one species could affect that animal’s predators, or the rest of the ecosystem.</p>
                     <p>‘We need to be asking more ecologically relevant questions,’ Rochman says. Usually, scientists don’t know how disasters like an oil spill or a nuclear meltdown will affect the environment until after they’ve happened. ‘We don’t ask the right questions early enough,’ she says. But if ecologists can understand how the slow-moving effect of ocean trash is damaging ecosystems, they might be able to prevent things from getting worse.</p>
                     <p>Asking the right questions can help policy makers, and the public, figure out where to focus their attention. The problems that look or sound most dramatic may not be the best places to start. For example, the name of the ‘Great Pacific Garbage Patch’ – a collection of marine debris in the northern Pacific Ocean – might conjure up a vast, floating trash island. In reality though, much of the debris is tiny or below the surface; a person could sail through the area without seeing any trash at all. A Dutch group called ‘The Ocean Cleanup’ is currently working on plans to put mechanical devices in the Pacific Garbage Patch and similar areas to suck up plastic. But a recent paper used simulations to show that strategically positioning the cleanup devices closer to shore would more effectively reduce pollution over the long term.</p>
                     <p>‘I think clearing up some of these misperceptions is really important,’ Rochman says. Among scientists as well as in the media, she says, ‘A lot of the images about strandings and entanglement and all of that cause specific perceptions that plastic debris is killing everything in the ocean.’ Interrogating the existing scientific literature can help ecologists figure out which problems really need addressing, and which ones they’d be better off – like the mussels – absorbing and ignoring.</p>
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
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1–8</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-bold text-center">Ysabel Giraldo’s research</h4>
                    <p>Focused on a total of <strong>1</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /> different age groups of ants, analysing:</p>
                    <p><strong>Behaviour:</strong></p>
                    <ul><li>• how well ants looked after their <strong>2</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} /></li><li>• their ability to locate <strong>3</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} /> using a scent trail</li><li>• the effect that <strong>4</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} /> had on them</li><li>• how <strong>5</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} /> they attacked prey</li></ul>
                    <p><strong>Brains:</strong></p>
                    <ul><li>• comparison between age and the <strong>6</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} /> of dying cells in the brains of ants</li><li>• condition of synaptic complexes (areas in which <strong>7</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} /> meet) in the brain’s ‘mushroom bodies’</li><li>• level of two <strong>8</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} /> in the brain associated with ageing</li></ul>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 9–13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 9, text: "Pheidole dentata ants are the only known animals which remain active for almost their whole lives." },
                          { num: 10, text: "Ysabel Giraldo was the first person to study Pheidole dentata ants using precise data about the insects’ ages." },
                          { num: 11, text: "The ants in Giraldo’s experiments behaved as she had predicted that they would." },
                          { num: 12, text: "The recent studies of bees used different methods of measuring age-related decline." },
                          { num: 13, text: "Pheidole dentata ants kept in laboratory conditions tend to live for longer lives." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14–17</h3><p>Reading Passage 2 has six paragraphs, A–F. Which paragraph contains the following information?</p>
                  <div className="space-y-4">
                      {[
                          { num: 14, text: "a reference to how quickly animal species can die out" },
                          { num: 15, text: "reasons why it is preferable to study animals in captivity rather than in the wild" },
                          { num: 16, text: "mention of two ways of learning about animals other than visiting them in zoos" },
                          { num: 17, text: "reasons why animals in zoos may be healthier than those in the wild" }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 18–22</h3><p>Do the following statements agree with the information given in Reading Passage 2? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 18, text: "An animal is likely to live longer in a zoo than in the wild." },
                          { num: 19, text: "There are some species in zoos which can no longer be found in the wild." },
                          { num: 20, text: "Improvements in the quality of TV wildlife documentaries have resulted in increased numbers of zoo visitors." },
                          { num: 21, text: "Zoos have always excelled at transmitting information about animals to the public." },
                          { num: 22, text: "Studying animals in zoos is less stressful for the animals than studying them in the wild." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8">
                    {renderMultiSelect('23_24', 'Questions 23 and 24', 'Choose TWO letters, A–E. Which TWO of the following are stated about zoo staff?', [
                        'Some take part in television documentaries about animals.',
                        'Some travel to overseas locations to join teams in zoos.',
                        'Some get experience with species in the wild before taking up zoo jobs.',
                        'Some teach people who are involved with conservation projects.',
                        'Some specialise in caring for species which are under threat.'
                    ], ['B', 'D'])}
                  </div>
                  <div className="mb-8">
                    {renderMultiSelect('25_26', 'Questions 25 and 26', 'Choose TWO letters, A–E. Which TWO of these beliefs about zoos does the writer mention?', [
                        'They can help children overcome their fears of wild animals.',
                        'They can increase public awareness of environmental issues.',
                        'They can provide employment for a range of professional people.',
                        'They can generate income to support wildlife conservation projects.',
                        'They can raise animals which can later be released into the wild.'
                    ], ['B', 'E'])}
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27–33</h3><p>Do the following statements agree with the information given in Reading Passage 3? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      {[
                          { num: 27, text: "Rochman and her colleagues were the first people to research the problem of marine debris." },
                          { num: 28, text: "The creatures most in danger from ocean trash are certain seabirds." },
                          { num: 29, text: "The studies Rochman has reviewed have already proved that populations of some birds will soon become extinct." },
                          { num: 30, text: "Rochman analysed papers on the different kinds of danger caused by ocean trash." },
                          { num: 31, text: "Most of the research analysed by Rochman and her colleagues was badly designed." },
                          { num: 32, text: "One study examined by Rochman was expecting to find that mussels were harmed by eating plastic." },
                          { num: 33, text: "Some mussels choose to eat plastic in preference to their natural diet." }
                      ].map(q => (<div key={q.num} className="flex items-start gap-4"><span className="font-semibold">{q.num}</span><div><p>{q.text}</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus(String(q.num)) === 'correct' ? 'border-green-500' : ''}`} value={answers[String(q.num)] || ''} onChange={(e) => handleAnswerChange(String(q.num), e.target.value)} /></div></div>))}
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 34–39</h3><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-center">Findings related to marine debris</h4>
                      <ul><li>• plastic (not metal or wood)</li><li>• bits of debris that were <strong>34</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> (harmful to animals)</li><li>• There was little research into <strong>35</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> e.g. from synthetic fibres.</li></ul>
                      <p><strong>Drawbacks of the studies examined:</strong></p>
                      <ul><li>• most of them focused on individual animals, not entire <strong>36</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} /></li><li>• the <strong>37</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /> of plastic used in the lab did not always reflect those in the ocean</li><li>• there was insufficient information on:<ul><li>– numbers of animals which could be affected</li><li>– the impact of a reduction in numbers on the <strong>38</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> of that species</li><li>– the impact on the ecosystem</li></ul></li></ul>
                      <p>Rochman says more information is needed on the possible impact of future <strong>39</strong> <Input className={`inline-block w-24 ml-1 ${getAnswerStatus('39') === 'correct' ? 'border-green-500' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /> (e.g. involving oil).</p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Question 40</h3><p>Choose the correct letter, A, B, C or D. What would be the best title for this passage?</p>
                  <div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> Assessing the threat of marine debris</p><p><strong>B</strong> Marine debris: who is to blame?</p><p><strong>C</strong> A new solution to the problem of marine debris</p><p></p>
<p><strong>D</strong> Marine debris: the need for international action</p></div>
<Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('40') === 'correct' ? 'border-green-500' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} /></div>
</CardContent></Card>
)}
</div>
</div>
</div>
code
Code
{!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
    {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* Questions 1-22 */}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['23', '24', '25', '26'].includes(q)).slice(0, 22).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}{/* Multi-select questions 23-24 */}<div className={`p-3 rounded border ${multipleAnswers['23_24'].sort().join(',') === 'B,D' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 23-24</span><span className={`font-bold ${multipleAnswers['23_24'].sort().join(',') === 'B,D' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['23_24'].sort().join(',') === 'B,D' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['23_24'].length > 0 ? multipleAnswers['23_24'].sort().join(', ') : '(none)'}</div><div>Correct: B, D</div></div>{/* Multi-select questions 25-26 */}<div className={`p-3 rounded border ${multipleAnswers['25_26'].sort().join(',') === 'B,E' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 25-26</span><span className={`font-bold ${multipleAnswers['25_26'].sort().join(',') === 'B,E' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['25_26'].sort().join(',') === 'B,E' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['25_26'].length > 0 ? multipleAnswers['25_26'].sort().join(', ') : '(none)'}</div><div>Correct: B, E</div></div>{/* Questions 27-40 */}{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['23', '24', '25', '26'].includes(q)).slice(22).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
    <div className="max-w-4xl mx-auto px-4 mt-8"><TestStatistics book="book-14" module="reading" testNumber={4} /><UserTestHistory book="book-14" module="reading" testNumber={4} /></div>
  </div>
</div>
)
}