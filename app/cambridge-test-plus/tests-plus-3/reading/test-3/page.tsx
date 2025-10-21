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

export default function BookPlus3ReadingTest3() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({
    '20_21': [],
    '22_23': [],
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
    
    // Handle multi-select for questions 20-21
    if (questionNumber === '20' || questionNumber === '21') {
        const userChoices = multipleAnswers['20_21'] || [];
        const correctAnswersSet = ['B', 'D'];
        return userChoices.length === 2 && userChoices.every(choice => correctAnswersSet.includes(choice));
    }

    // Handle multi-select for questions 22-23
    if (questionNumber === '22' || questionNumber === '23') {
        const userChoices = multipleAnswers['22_23'] || [];
        const correctAnswersSet = ['A', 'E'];
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
      
      // Handle multi-select questions 20-21
      if (['20', '21'].includes(qNum)) {
        if (!answeredMultiSelect.has('20_21')) {
          const userChoices = multipleAnswers['20_21'] || [];
          const correctAnswersSet = ['B', 'D'];
          userChoices.forEach(choice => {
            if (correctAnswersSet.includes(choice)) { correctCount++; }
          });
          answeredMultiSelect.add('20_21');
        }
      }
      // Handle multi-select questions 22-23
      else if (['22', '23'].includes(qNum)) {
        if (!answeredMultiSelect.has('22_23')) {
          const userChoices = multipleAnswers['22_23'] || [];
          const correctAnswersSet = ['A', 'E'];
          userChoices.forEach(choice => {
            if (correctAnswersSet.includes(choice)) { correctCount++; }
          });
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
        testNumber: 3,
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
            <div className={`w-4 h-4 rounded-full ${isFullyCorrect ? 'bg-green-600' : 'bg-red-600'}`}></div>
            <span className="text-sm text-gray-600">Correct answers: {correctSet.join(' and ')} ({correctCount}/{correctSet.length} correct)</span>
        </div>
    );
  };

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': '10/ten million', '2': 'cats and foxes', '3': 'monitored', '4': 'fire', '5': 'extinct',
    '6': '5/five months', '7': '15/fifteen weeks', '8': '(strong) medicinal powers', '9': 'skills and knowledge',
    '10': 'FALSE', '11': 'TRUE', '12': 'NOT GIVEN', '13': 'TRUE',
    '14': 'ii', '15': 'v', '16': 'i', '17': 'vii', '18': 'iv', '19': 'viii',
    '20': 'B', '21': 'D', '20&21': ['B', 'D'],
    '22': 'A', '23': 'E', '22&23': ['A', 'E'],
    '24': 'Astrakhan', '25': 'houses', '26': 'fire',
    '27': 'NO', '28': 'YES', '29': 'NO', '30': 'YES', '31': 'NOT GIVEN', '32': 'YES',
    '33': 'A', '34': 'C', '35': 'C', '36': 'D',
    '37': 'C', '38': 'F', '39': 'D', '40': 'A'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS Practice Tests Plus 3 - Reading Test 3</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                <h3 className="text-center font-bold text-xl">The Rufous Hare-Wallaby</h3>
                <p>The Rufous Hare-Wallaby is a species of Australian kangaroo, usually known by its Aboriginal name, ‘mala’. At one time, there may have been as many as ten million of these little animals across the arid and semi-arid landscape of Australia, but their populations, like those of so many other small endemic species, were devastated when cats and foxes were introduced – indeed, during the 1950s it was thought that the mala was extinct. But in 1964, a small colony was found 450 miles northwest of Alice Springs in the Tanami Desert. And 12 years later, a second small colony was found nearby. Very extensive surveys were made throughout historical mala range – but no other traces were found.</p>
                <p>Throughout the 1970s and 1980s, scientists from the Parks and Wildlife Commission of the Northern Territory monitored these two populations. At first it seemed that they were holding their own. Then in late 1987, every one of the individuals of the second and smaller of the wild colonies was killed in an examination of the tracks in the sand, it seemed that just one single fox had been responsible. And then, in October 1991, a wild-fire destroyed the entire area occupied by the remaining colony. Thus the mala was finally pronounced extinct in the wild.</p>
                <p>Fortunately, ten years earlier, seven individuals had been captured, and had become the founders of a captive breeding programme at the Arid Zone Research Institute in Alice Springs; and that group had thrived. Part of this success is due to the fact that the female can breed when she is just five months old and can produce up to three young a year. Like other kangaroo species, the mother carries her young – known as a joey – in her pouch for about 15 weeks, and she can have more than one joey at the same time.</p>
                <p>In the early 1980s, there were enough mala in the captive population to make it feasible to start a reintroduction programme. But first it was necessary to discuss this with the leaders of the Yapa people. Traditionally, the mala had been an important animal in their culture, with strong medicinal powers for old people. It had also been an important food source, and there were concerns that any mala returned to the wild would be killed for the pot. And so, in 1980, a group of key Yapa men was invited to visit the proposed reintroduction area. The skills and knowledge of the Yapa would play a significant and enduring role in this and all other mala projects.</p>
                <p>With the help of the local Yapa, an electric fence was erected around 250 acres of suitable habitat, about 300 miles northwest of Alice Springs so that the mala could adapt while protected from predators. By 1992, there were about 150 mala in their enclosure, which became known as the Mala Paddock. However, all attempts to reintroduce mala from the paddocks into the unfenced wild were unsuccessful, so in the end the reintroduction programme was abandoned. The team now faced a situation where mala could be bred, but not released into the wild again.</p>
                <p>Thus, in 1993, a Mala Recovery Team was established to boost mala numbers, and goals for a new programme were set: the team concentrated on finding suitable predator-free or predator-controlled conservation sites within the mala’s known range. Finally, in March 1999, twelve adult females, eight adult males, and eight joeys were transferred from the Mala Paddock to Dryandra Woodland in Western Australia. Then, a few months later, a second group was transferred to Trimouille, an island off the coast of western Australia. First, it had been necessary to rid the island of rats and cats – a task that had taken two years of hard work.</p>
                <p>Six weeks after their release into this conservation site, a team returned to the island to find out how things were going. Each of the malas had been fitted with a radio collar that transmits for about 14 months, after which it falls off. The team was able to locate 29 out of the 30 transmitters – only one came from the collar of a mala that had died of unknown causes. So far the recovery programme had gone even better than expected.</p>
                <p>Today, there are many signs suggesting that the mala population on the island is continuing to do well.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                <h3 className="text-center font-bold text-xl">Measures to combat infectious disease in tsarist Russia</h3>
                <p><strong>A</strong> In the second half of the seventeenth century, Russian authorities began implementing controls at the borders of their empire to prevent the importation of plague, a highly infectious and dangerous disease. Information on disease outbreak occurring abroad was regularly reported to the tsar’s court through various means, including commercial channels (travelling merchants), mail, and personnel deployed abroad, undercover agents of the network of Imperial Foreign Office embassies and representations abroad, and the customs offices. For instance, the heads of customs offices were instructed to question foreigners entering Russia about possible epidemics of dangerous diseases in their respective countries.</p>
                <p><strong>B</strong> If news of an outbreak came from abroad, relations with the affected country were suspended. For instance, foreign vessels were not allowed to dock in Russian ports if there was credible information about the existence of epidemics in countries from whence they had departed. In addition, all foreigners entering Russia from those countries had to undergo quarantine. In 1665, after receiving news about a plague epidemic in England, Tsar Alexei wrote a letter to King Charles II in which he announced the cessation of Russian trade relations with England and other foreign states. These protective measures appeared to have been effective, as the country did not record any cases of plague during that year and in the next three decades. It was not until 1692 that another plague outbreak was recorded in the Russian province of Astrakhan. This epidemic continued for five months and killed 10,383 people, or about 65 percent of the city’s population. By the end of the seventeenth century, preventative measures had been widely introduced in Russia, including the isolation of persons ill with plague, the imposition of quarantines, and the distribution of explanatory public health notices about plague outbreaks.</p>
                <p><strong>C</strong> During the eighteenth century, although none of the occurrences was of the same scale as in the past, plague appeared in Russia several times. For instance, from 1703 to 1705, a plague outbreak that had ravaged Istanbul spread to the Podolsk and Kiev provinces in Russia, and then to Poland and Hungary. After defeating the Swedes in the battle of Poltava in 1709, Tsar Peter I (Peter the Great) dispatched part of his army to Poland, where plague had been raging for two years. Despite preventive measures, the disease spread among the Russian troops. In 1710, the plague reached Riga, (then part of Sweden, now the capital of Latvia), where it was active until 1711 and claimed 60,000 lives. During this period, the Russians besieged Riga and, after the Swedes had surrendered the city in 1710, the Russian army lost 9,800 soldiers to the plague. Russian military chronicles of the time note that more soldiers died of the disease after the capture of Riga than from enemy fire during the siege of that city.</p>
                <p><strong>D</strong> Tsar Peter I imposed strict measures to prevent the spread of plague during these conflicts. Soldiers suspected of being infected were isolated and taken to areas far from military camps. In addition, camps were designed to separate divisions, detachments, and smaller units of soldiers. When plague reached Narva (located in present-day Estonia) and threatened to spread to St. Petersburg, the newly built capital of Russia, Tsar Peter I ordered the army to cordon off the entire province of Astrakhan. He ordered that all movement on the rivers be temporarily halted to prevent the movement of people and goods from Narva to St Petersburg and Novgorod, roadblocks and checkpoints were set up on all roads. The tsar’s orders were rigorously enforced, and those who disobeyed were hung.</p>
                <p><strong>E</strong> However, although the Russian authorities applied such methods to contain the spread of the disease and limit the number of victims, all of the measures had a provisional character: they were intended to respond to a specific outbreak, and were not designed as a coherent set of measures to be implemented systematically at the first sign of plague. The advent of such a standard response system came a few years later.</p>
                <p><strong>F</strong> The first attempts to organise procedures and carry out proactive steps to control plague date to the aftermath of the 1727–1728 epidemic in Astrakhan. In response to this, the Russian imperial authorities issued several decrees aimed at controlling the future spread of plague. Among these decrees, the ‘Instructions for Governors and Heads of Townships’ required that all governors immediately inform the Senate – a government body created by Tsar Peter I in 1711 to advise the monarch – if plague cases were detected in their respective provinces. Furthermore, the decree required that governors ensure the physical examination of all persons suspected of carrying the disease and their subsequent isolation. In addition, it was ordered that sites where plague victims were found had to be encircled by checkpoints and isolated for the duration of the outbreak. These checkpoints were to remain operational for at least six weeks. The houses of infected persons were to be burned along with all of the personal property they contained, including farm animals and cattle. The governors were instructed to inform the neighbouring provinces and cities about every plague case occurring on their territories. Finally, letters brought by couriers were heated above a fire before being copied. </p>
                <p><strong>G</strong>  The implementation by the authorities of these combined measures demonstrates their intuitive understanding of the importance of the timely isolation of infected people to limit the spread of plague.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                <h3 className="text-center font-bold text-xl">Recovering a damaged reputation</h3>
                <p>In 2009, it was revealed that some of the information published by the University of East Anglia’s Climatic Research Unit (CRU) in the UK, concerning climate change, had been inaccurate. Furthermore, it was alleged that some of the relevant statistics had been withheld from publication. The ensuing controversy affected the reputation not only of that institution, but also of the Intergovernmental Panel on Climate Change (IPCC), with which the CRU is closely involved, and of climate scientists in general. Even if the claims of misconduct and incompetence were eventually proven to be largely untrue, or confined to a few individuals, the damage was done. The perceived wrongdoings of a few people had raised doubts about the many.</p>
                <p>The response of most climate scientists was to cross their fingers and hope for the best, and they kept a low profile. Many no doubt hoped that subsequent independent inquiries into the IPCC and CRU would draw a line under their problems. However, although these were likely to help, they were unlikely to undo the harm caused by months of hostile news reports and attacks by critics.</p>
                <p>The damage that has been done should not be underestimated. As Ralph Cicerone, the President of the US National Academy of Sciences, wrote in an editorial in the journal Science: ‘Public opinion has moved toward the view that scientists often try to suppress alternative hypotheses and ideas and that scientists will withhold data and try to manipulate some aspects of peer review to prevent dissent.’ He concluded that ‘the perceived misbehavior of even a few scientists can diminish the credibility of science as a whole.’</p>
                <p>An opinion poll taken at the beginning of 2010 found that the proportion of people in the US who trust scientists as a source of information about global warming had dropped from 83 percent, in 2008, to 74 percent. Another survey carried out by the British Broadcasting Corporation in February 2010 found that just 26 percent of British people now believe that climate change is being largely human-made, down from 41 percent in November 2009.</p>
                <p>Regaining the confidence and trust of the public is never easy. Hunkering down and hoping for the best – climate science’s current strategy – makes it almost impossible. It is much better to learn from the successes and failures of organisations that have dealt with similar blows to their public standing.</p>
                <p>In fact, climate science needs professional help to rebuild its reputation. It could do worse than follow the advice given by Leslie Gaines-Ross, a ‘reputation strategist’ at Public Relations (PR) company Weber Shandwick, in her recent book Corporate Reputation: 12 Steps to Safeguarding and Recovering Reputation. Gaines-Ross’s strategy is based on her analysis of how various organisations responded to crises, such as desktop-printer firm Xerox, whose business plummeted during the 1990s, and the USA’s National Aeronautics and Space Administration (NASA) after the Columbia shuttle disaster in 2003.</p>
                <p>The first step she suggests is to ‘take the heat – leader first’. In many cases, chief executives who publicly accept responsibility for corporate failings can begin to reverse the freefall of their company’s reputations, but not always. If the leader is held at least partly responsible for the fall from grace, it can be almost impossible to convince critics that a new direction can be charted with that same person at the helm.</p>
                <p>This is the dilemma facing the heads of the IPCC and CRU. Both have been blamed for their organisations’ problems, not least for the way in which they have dealt with critics, and both have been subjected to public calls for their removal. Yet both organisations appear to believe they can repair their reputations without a change of leadership.</p>
                <p>The second step outlined by Gaines-Ross is to ‘communicate tirelessly’. Yet many climate researchers have avoided the media and the public, at least until the official enquiries have concluded their reports. This reaction may be understandable, but it has backfired. Journalists following the story have often been unable to find spokespeople willing to defend climate science. In this case, ‘no comment’ is commonly interpreted as an admission of silent, collective guilt.</p>
                <p>Remaining visible is only a start, though; climate scientists also need to be careful what they say. They must realise that they face doubts not just about their published results, but also about their conduct and honesty. It simply won’t work for scientists to continue to appeal to the weight of the evidence, while refusing to discuss the integrity of their profession. The harm has been increased by a perceived reluctance to admit even the possibility of mistakes or wrongdoing.</p>
                <p>The third step put forward by Gaines-Ross is ‘don’t underestimate your critics and competitors’. This means not only recognising the skill with which the opponents of climate research have executed their campaigns through Internet blogs and other media, but also acknowledging the validity of some of their criticisms. It is clear, for instance, that climate scientists need better standards of transparency, to allow for scrutiny not just by their peers, but also by critics from outside the world of research.</p>
                <p>It is also important to engage with those critics. That doesn’t mean conceding to unfounded arguments which are based on prejudice rather than evidence, but there is an obligation to help the public understand the causes of climate change, as well as the options for avoiding and dealing with the consequences.</p>
                <p>To begin the process of rebuilding trust in their profession, climate scientists need to follow these three steps. But that is just the start. Gaines-Ross estimates that it typically takes four years for a company to rescue and restore a broken reputation.</p>
                <p>Winning back public confidence is a marathon, not a sprint, but you can’t win at all if you don’t step up to the starting line.</p>
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
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-5</h3><p>Complete the flow chart below. Choose <strong>NO MORE THAN THREE WORDS AND/OR A NUMBER</strong> from the passage for each answer.</p>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-bold text-center mb-2">The Wild Australian mala</h4>
                        <p className="text-center">Distant past: total population of up to <strong>1</strong> <Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /> in desert and semi-desert regions.</p>
                        <p className="text-center">↓</p>
                        <p className="text-center">Populations of malas were destroyed by <strong>2</strong> <Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} /></p>
                        <p className="text-center">↓</p>
                        <p className="text-center">1964/1976: two surviving colonies were discovered.</p>
                        <p className="text-center">↓</p>
                        <p className="text-center">Scientists <strong>3</strong> <Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} /> the colonies.</p>
                        <p className="text-center">↓</p>
                        <p className="text-center">1987: one of the colonies was completely destroyed.</p>
                        <p className="text-center">↓</p>
                        <p className="text-center">1991: the other colony was destroyed by <strong>4</strong> <Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} /></p>
                        <p className="text-center">↓</p>
                        <p className="text-center">The wild mala was declared <strong>5</strong> <Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} /></p>
                      </div>
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 6-9</h3><p>Answer the questions below. Choose <strong>NO MORE THAN THREE WORDS AND/OR A NUMBER</strong> from the passage for each answer.</p>
                      <div className="space-y-4 mt-4">
                        <p><strong>6</strong> At what age can female malas start breeding?</p><Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>7</strong> For about how long do young malas stay inside their mother's pouch?</p><Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>8</strong> Apart from being a food source, what value did malas have for the Yapa people?</p><Input value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>9</strong> What was the Yapa's lasting contribution to the mala reintroduction programme?</p><Input value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                      </div>
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 10-13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <p><strong>10</strong> Natural defences were sufficient to protect the area called Mala Paddock.</p><Input value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>11</strong> Scientists eventually gave up their efforts to release captive mala into the unprotected wild.</p><Input value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>12</strong> The mala population which was transferred to Dryandra Woodland quickly increased in size.</p><Input value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                        <p><strong>13</strong> Scientists were satisfied with the initial results of the recovery programme.</p><Input value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} />
                    </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p>Reading Passage 2 has SEVEN sections, A-G. Choose the correct heading for sections A-F from the list of headings below. Write the correct number, i-viii.</p>
                      <div className="bg-gray-50 p-4 rounded-lg my-4">
                        <p className="font-bold">List of Headings</p>
                        <ul className="list-roman list-inside ml-2">
                          <li>i Outbreaks of plague as a result of military campaigns.</li>
                          <li>ii Systematic intelligence-gathering about external cases of plague.</li>
                          <li>iii Early forms of treatment for plague victims.</li>
                          <li>iv The general limitations of early Russian anti-plague measures.</li>
                          <li>v Partly successful bans against foreign states affected by plague.</li>
                          <li>vi Hostile reactions from foreign states to Russian anti-plague measures.</li>
                          <li>vii Various measures to limit outbreaks of plague associated with war.</li>
                          <li>viii The formulation and publication of preventive strategies.</li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <p><strong>14</strong> Section A</p><Input value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} />
                        <p><strong>15</strong> Section B</p><Input value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} />
                        <p><strong>16</strong> Section C</p><Input value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} />
                        <p><strong>17</strong> Section D</p><Input value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />
                        <p><strong>18</strong> Section E</p><Input value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />
                        <p><strong>19</strong> Section F</p><Input value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />
                      </div>
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-21</h3><p className="text-sm font-semibold mb-2">Choose TWO letters, A-E. Which TWO measures did Russia take in the seventeenth century to avoid plague outbreaks?</p>
                      <div className="space-y-2">{['Cooperation with foreign leaders', 'Spying', 'Military campaigns', 'Restrictions on access to its ports', 'Expulsion of foreigners'].map((o,i) => <label key={i} className="flex items-center gap-2"><input type="checkbox" value={String.fromCharCode(65+i)} checked={multipleAnswers['20_21'].includes(String.fromCharCode(65 + i))} onChange={(e) => handleMultiSelect('20_21', e.target.value)} disabled={!isTestStarted || submitted}/>{String.fromCharCode(65+i)} {o}</label>)}</div>
                      {renderMultiSelectStatus('20_21', ['B', 'D'])}
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 22-23</h3><p className="text-sm font-semibold mb-2">Choose TWO letters, A-E. Which TWO statements are made about Russia in the early eighteenth century?</p>
                      <div className="space-y-2">{['Plague outbreaks were consistently smaller than before.', 'Military casualties at Riga exceeded the number of plague victims.', 'The design of military camps allowed plague to spread quickly.', 'The tsar’s plan to protect St Petersburg from plague was not strictly implemented.', 'Anti-plague measures were generally reactive rather than strategic.'].map((o,i) => (
                        <label key={i} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={String.fromCharCode(65 + i)}
                            checked={multipleAnswers['22_23'].includes(String.fromCharCode(65 + i))}
                            onChange={(e) => handleMultiSelect('22_23', e.target.value)}
                            disabled={!isTestStarted || submitted}
                          />
                          {String.fromCharCode(65 + i)} {o}
                        </label>
                      ))}
                      </div>
                      {renderMultiSelectStatus('22_23', ['A', 'E'])}
                    </div>
                    <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p>Complete the sentences below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                      <div className="space-y-4 mt-4">
                        <p><strong>24</strong> An outbreak of plague in <Input value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /> prompted the publication of a coherent preventative strategy.</p>
                        <p><strong>25</strong> Provincial governors were ordered to burn the <Input value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> and possessions of plague victims.</p>
                        <p><strong>26</strong> Correspondence was held over a <Input value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} /> prior to copying it.</p>
                      </div>
                    </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 3? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>27</strong> If a majority of scientists at the CRU were cleared of misconduct, the public would be satisfied.</p><Input value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} />
                      <p><strong>28</strong> In the aftermath of the CRU scandal, most scientists avoided attention.</p><Input value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} />
                      <p><strong>29</strong> Journalists have defended the CRU and the IPCC against their critics.</p><Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> Ralph Cicerone regarded the damage caused by the CRU as extending beyond the field of climate science.</p><Input value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> Since 2010, confidence in climate science has risen slightly in the US.</p><Input value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                      <p><strong>32</strong> Climate scientists should take professional advice on regaining public confidence.</p><Input value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 33-36</h3><p>Choose the correct letter, A, B, C or D.</p>
                  <div className="space-y-4">
                      <p><strong>33</strong> In accordance with Gaines-Ross’s views, the heads of the CRU and IPCC should have</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">resigned from their posts.</li><li className="ml-2">accepted responsibility and continued in their posts.</li><li className="ml-2">shifted attention onto more junior staff.</li><li className="ml-2">ignored the criticisms directed at them.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />
                      <p><strong>34</strong> Which mistake have staff at the CRU and IPCC made?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">They have blamed each other for problems.</li><li className="ml-2">They have publicly acknowledged failings.</li><li className="ml-2">They have avoided interviews with the press.</li><li className="ml-2">They have made conflicting public statements.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} />
                      <p><strong>35</strong> People who challenge the evidence of climate change have generally</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">presented their case poorly.</li><li className="ml-2">missed opportunities for publicity.</li><li className="ml-2">made some criticisms which are justified.</li><li className="ml-2">been dishonest in their statements.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} />
                      <p><strong>36</strong> What does the reference to ‘a marathon’ indicate in the final paragraph?</p>
                      <ul className="list-disc list-inside ml-4"><li className="ml-2">The rate at which the climate is changing.</li><li className="ml-2">The competition between rival theories of climate change.</li><li className="ml-2">The ongoing need for new climate data.</li><li className="ml-2">The time it might take for scientists to win back confidence.</li></ul>
                      <Input placeholder="A, B, C or D" value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p>Complete the summary using the list of words/phrases, A-H, below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-bold text-center mb-2">Controversy about climate science</h4>
                      <p>The revelation, in 2009, that scientists at the CRU had presented inaccurate information and concealed some of their <strong>37</strong> <Input className="inline-block w-20 ml-1" value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} /> had a serious effect on their reputation. In order to address the problem, the scientists should turn to experts in <strong>38</strong> <Input className="inline-block w-20 ml-1" value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} />.</p>
                      <p>Leslie Gaines-Ross has published <strong>39</strong> <Input className="inline-block w-20 ml-1" value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} /> based on studies of crisis management in commercial and public-sector organisations. Amongst other things, Gaines-Ross suggests that climate scientists should confront their <strong>40</strong> <Input className="inline-block w-20 ml-1" value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} />.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 grid grid-cols-2 gap-2 text-sm">
                      <p><strong>A</strong> critics</p><p><strong>B</strong> corruption</p><p><strong>C</strong> statistics</p>
                      <p><strong>D</strong> guidelines</p><p><strong>E</strong> managers</p><p><strong>F</strong> public relations</p>
                      <p><strong>G</strong> sources</p><p><strong>H</strong> computer modelling</p>
                  </div></div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => { 
          let userAnswer: string = ''; let isCorrect: boolean = false; let questionDisplay = `Q${qNum}`;
          const multiSelectKeys: {[key: string]: string[]} = {'20_21': ['B', 'D'], '22_23': ['A', 'E']};
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
            testNumber={3}
          />
          <TestStatistics 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={3}
          />
          <UserTestHistory 
            book="practice-tests-plus-3" 
            module="reading" 
            testNumber={3}
          />
        </div>
      </div>
    </div>
  )
}