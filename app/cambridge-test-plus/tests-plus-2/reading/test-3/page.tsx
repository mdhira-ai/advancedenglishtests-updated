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

export default function Book2ReadingTest3() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multipleAnswers, setMultipleAnswers] = useState<{ [key: string]: string[] }>({ '39_40': [] })
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
  
  const handleMultiSelect = (key: '39_40', value: string) => {
    setMultipleAnswers(prev => {
        const current = prev[key] || [];
        let newAnswers = current.includes(value) ? current.filter(ans => ans !== value) : (current.length < 2 ? [...current, value] : current);
        return { ...prev, [key]: newAnswers.sort() };
    });
  };

  const correctAnswers = {
    '1': 'B', '2': 'A', '3': 'D',
    '4': 'E', '5': 'D', '6': 'F', '7': 'B',
    '8': 'I', '9': 'G', '10': 'E', '11': 'D', '12': 'A', '13': 'F',
    '14': 'NOT GIVEN', '15': 'YES', '16': 'NO', '17': 'YES', '18': 'NOT GIVEN', '19': 'YES',
    '20': 'agriculture', '21': 'parks', '22': 'productivity', '23': 'protein', '24': 'DNA', '25': 'game',
    '26': 'A', '27': 'D',
    '28': 'E', '29': 'B', '30': 'H', '31': 'A', '32': 'F', '33': 'D',
    '34': 'sneezed', '35': 'two/2', '36': 'removed', '37': 'analysis', '38': 'life',
    '39&40': ['C', 'D']
  };

  const checkAnswer = (questionNumber: string): boolean => {
    if (['39', '40'].includes(questionNumber)) return false;
    const correct = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const user = answers[questionNumber] || ''
    if (!user) return false;
    return checkAnswerWithMatching(user, correct as string, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const qNum of Object.keys(correctAnswers)) {
      if (qNum.includes('&') || ['39', '40'].includes(qNum)) continue;
      if (checkAnswer(qNum)) correctCount++;
    }
    const userChoices39_40 = multipleAnswers['39_40'] || [];
    const correctSet39_40 = ['C', 'D'];
    userChoices39_40.forEach(choice => {
        if (correctSet39_40.includes(choice)) correctCount++;
    });
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return; setIsSubmitting(true);
    try {
      const calculatedScore = calculateScore(); setScore(calculatedScore);
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      const detailedAnswers = { singleAnswers: answers, multipleAnswers, results: Object.keys(correctAnswers).filter(q => !q.includes('&')).map(qNum => ({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correctAnswers[qNum as keyof typeof correctAnswers], isCorrect: checkAnswer(qNum) })), score: calculatedScore, totalQuestions: 40, timeTaken };
      
      await saveTestScore({
        book: 'practice-tests-plus-2',
        module: 'reading',
        testNumber: 3,
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
    setAnswers({}); setMultipleAnswers({ '39_40': [] }); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60); clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default'
  const ieltsScore = getIELTSReadingScore(score)

  const renderMultiSelect = (key: '39_40', title: string, question: string, options: string[], correctSet: string[]) => (
    <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm mb-4">{question}</p>
        <div className="space-y-2">
            {options.map((option, index) => {
            const opt = String.fromCharCode(65 + index);
            return (
                <label key={opt} className="flex items-center space-x-2">
                    <input type="checkbox" value={opt} checked={multipleAnswers[key].includes(opt)} onChange={() => handleMultiSelect(key, opt)} disabled={!isTestStarted || submitted} />
                    <span><strong>{opt}</strong> {option}</span>
                </label>
            );
            })}
        </div>
        {submitted && <div className="mt-2 text-sm font-semibold text-green-600">Correct answers: {correctSet.join(', ')}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge-test-plus/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Reading Tests</Link>
          <div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge Ielts Test Plus 2 - Reading Test 3</h1><p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p></div>
        </div>

        <div className="mb-6"><Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>{!isTestStarted && !submitted ? (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white">Start Test</Button>) : (<div className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-blue-600'}`}>{submitted ? 'Test Completed' : 'Test in Progress'}</div>)}</CardContent></Card></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b"><h2 className="text-xl font-bold">Reading Passages</h2><Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button></div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
              <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">A song on the brain</h3>
                  <p><em>Some songs just won't leave you alone. But this may give us clues about how our brain works</em></p>
                  <p><strong>A</strong> Everyone knows the situation where you can't get a song out of your head. You hear a pop song on the radio - or even just read the song's title - and it haunts you for hours, playing over and over in your mind until you're heartily sick of it. The condition now even has a medical name - 'song-in-head syndrome'.</p>
                  <p><strong>B</strong> But why does the mind annoy us like this? No one knows for sure, but it's probably because the brain is better at holding onto information than it is at knowing what information is important. Roger Chaffin, a psychologist at the University of Connecticut, says, 'It's a manifestation of an aspect of memory which is normally an asset to us, but in this instance it can be a nuisance.'</p>
                  <p><strong>C</strong> This eager acquisitiveness of the brain may have helped our ancestors remember important information in the past. Today, students use it to learn new material, and musicians rely on it to memorise complicated pieces. But when this useful function goes awry it can get you stuck on a tune. Unfortunately, superficial, repetitive pop tunes are, by their very nature, more likely to stick than something more creative.</p>
                  <p><strong>D</strong> The annoying playback probably originates in the auditory cortex. Located at the front of the brain, this region handles both listening and playback of music and other sounds. Neuroscientist Robert Zatorre of McGill University in Montreal proved this some years ago when he asked volunteers to replay the theme from the TV show Dallas in their heads. Brain imaging studies showed that this activated the same part of the auditory cortex as when the people actually heard the song.</p>
                  <p><strong>E</strong> Not every stored musical memory emerges into consciousness, however. The frontal lobe of the brain gets to decide which thoughts become conscious and which ones are simply stored away. But it can become fatigued or depressed, which is when people most commonly suffer from song-in-head syndrome and other intrusive thoughts, says Susan Ball, a clinical psychologist at Indiana University School of Medicine in Indianapolis. And once the unwanted song surfaces, it's hard to stuff it back down into the subconscious. 'The more you try to suppress a thought, the more you get it,' says Ball. 'We call this the pink elephant phenomenon. Tell the brain not to think about pink elephants, and it's guaranteed to do so,' she says.</p>
                  <p><strong>F</strong> For those not severely afflicted, simply avoiding certain kinds of music can help. 'I know certain pieces that are kind of "sticky" to me, so I will not play them in the early morning for fear that they will run around in my head all day,' says Steven Brown, who trained as a classical pianist but is now a neuroscientist at the University of Texas Health Science Center at San Antonio. He says he always has a song in his head and, even more annoying, his mind seems to make it all the way through. It tends to revolve short fragments between, say, 5 or 15 seconds. They seem to get looped, for hours sometimes,' he says.</p>
                  <p><strong>G</strong> Brown's experience of repeated musical loops may represent a phenomenon called 'chunking', in which people remember musical phrases as a single unit of memory, says Caroline Palmer, a psychologist at Ohio State University in Columbus. Most listeners have little choice about what they remember. Particular chunks may be especially 'sticky' if you hear them often or if they follow certain predictable patterns, such as the chord progression of rock 'n' roll music. Palmer's research shows that the more a piece of music conforms to these patterns, the easier it is to remember. That's why you're more likely to be haunted by the tunes of pop music than those of a classical composer such as J.S. Bach.</p>
                  <p><strong>H</strong> But this ability can be used for good as well as annoyance. Teachers can tap into memory reinforcement by setting their lessons to music. For example, in one experiment students who heard a history text set as the lyrics to a catchy song remembered the words better than those who simply read them, says Sandra Calvert, a psychologist at Georgetown University in Washington DC.</p>
                  <p><strong>I</strong> This sort of memory enhancement may even explain the origin of music. Before the written word could be used to record history, people memorised it in songs, says Leon James, a psychologist at the University of Hawaii. And music may have had an even more important role. 'All music has a message,' he says. 'This message functions to unite society and to standardise the thought processes of people in society.'</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Worldly wealth</h3>
                  <p><em>Can the future population of the world enjoy a comfortable lifestyle, with possessions, space and mobility, without crippling the environment?</em></p>
                  <p>The world's population is expected to stabilise at around nine billion. Will it be possible for nine billion people to have the lifestyle enjoyed by only the wealthy? One school of thought says no; not only should the majority of the world's people resign themselves to poverty forever, but they must also revert to simpler lifestyles in order to save the planet.</p>
                  <p>Admittedly, there may be political or social barriers to achieving a rich world. But in fact there seems to be no insuperable physical or ecological reason why nine billion people should not achieve a comfortable lifestyle, using technology we now possess. In thinking about the future of civilization, we ought to start by asking what people want. The evidence demonstrates that as people get richer, they want a greater range of personal technology, they want lots of room (preferably near or in natural surroundings) and they want greater speed in travel. More possessions, more space, more mobility.</p>
                  <p>In the developed world, the personal technologies of the wealthy, including telephones, washing machines and cars, have become necessities within a generation or two. Increasing productivity that results in decreasing costs for such goods has been responsible for the greatest gains in the standard of living, and there is every reason to believe that this will continue.</p>
                  <p>As affluence grows, the amount of energy and raw materials used for production of machinery will therefore escalate. But this need not mean an end to the machine age. Rather than being thrown away, materials from old machinery can be recycled by manufacturers. And long before all fossil fuels are exhausted, their rising prices may compel industrial society not only to become more energy efficient but also to find alternative energy sources sufficient for the demands of an advanced technological civilization – nuclear fission, nuclear fusion, solar energy, chemical photosynthesis, geothermal, biomass or some yet unknown source of energy.</p>
                  <p>The growth of cities and suburbs is often seen as a threat to the environment. However, in fact the increasing amount of land consumed by agriculture is a far greater danger than urban sprawl. Stopping the growth of farms is the best way to preserve many of the world's remaining wild areas. But is a dramatic downsizing of farming possible? Thanks to the growth of agricultural productivity, reforestation and 're-wilding' has been under way in the industrial countries for generations. Since 1950 more land in the US has been set aside in parks than has been occupied by urban and suburban growth. And much of what was farmland in the nineteenth century is now forest again. Taking the best Iowa maize growers as the norm for world food production, it has been calculated that less than a tenth of present cropland could support a population of 10 billion.</p>
                  <p>In The Environment Game, a vision of a utopia that would be at once high-tech and environmentalist, Nigel Calder suggested that 'nourishing but unpalatable primary food produced by industrial techniques – like yeast from petroleum – may be fed to animals, so that we can still enjoy customary meat, eggs, milk, butter, and cheese – and so that people in underdeveloped countries can have adequate supplies of animal protein for the first time.</p>
                  <p>In the long run, tissue-cloning techniques could be used to grow desired portions of meat by themselves. Once their DNA has been extracted to create cowless steaks and chickenless drumsticks, domesticated species of livestock, bred for millennia to be stupid or to have grotesque, enhanced traits, should be allowed to become extinct, except for a few specimens in zoos. And some game such as wild deer, rabbits and wild ducks will be ever more abundant as farms revert to wilderness, so this could supplement the laboratory-grown meat in the diets of tomorrow's affluent.</p>
                  <p>With rising personal incomes come rising expectations of mobility. This is another luxury of today's rich that could become a necessity of tomorrow's global population - particularly if its members choose to live widely dispersed in a post-agrarian wilderness. In his recent book Free Flight, James Fallows, a pilot as well as a writer, describes serious attempts by both state and private entrepreneurs in the USA to promote an 'air taxi' system within the price range of today's middle class - and perhaps tomorrow's global population.</p>
                  <p>Two of the chief obstacles to the science fiction fantasy of the personal plane or hover car are price and danger. While technological improvements are driving prices down, piloting an aircraft in three dimensions is still more difficult than driving a car in two, and pilot error causes more fatalities than driver error. But before long our aircraft and cars will be piloted by computers which are never tired or stressed.</p>
                  <p>So there are some grounds for optimism when viewing the future of civilization. With the help of technology, and without putting serious strains on the global environment, possessions, space and mobility can be achieved for all the projected population of the world.</p>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="text-center font-bold">Space: The Final Archaeological Frontier</h3>
                  <p><em>Space travel may still have a long way to go, but the notion of archaeological research and heritage management in space is already concerning scientists and environmentalists.</em></p>
                  <p>In 1993, University of Hawaii's anthropologist Ben Finney, who for much of his career has studied the technology once used by Polynesians to colonise islands in the Pacific, suggested that it would not be premature to begin thinking about the archaeology of Russian and American aerospace sites on the Moon and Mars. Finney pointed out that just as today's scholars use archaeological records to investigate how Polynesians diverged culturally as they explored the Pacific, archaeologists will someday study off-Earth sites to trace the development of humans in space. He realised that it was unlikely anyone would be able to conduct fieldwork in the near future, but he was convinced that one day such work would be done.</p>
                  <p>There is a growing awareness, however, that it won't be long before both corporate adventurers and space tourists reach the Moon and Mars. There is a wealth of important archaeological sites from the history of space exploration on the Moon and Mars, and measures need to be taken to protect these sites. In addition to the threat from profit-seeking corporations, scholars cite other potentially destructive forces such as souvenir hunting and unmonitored scientific sampling, as has already occurred in explorations of remote polar regions. Already in 1999 one company was proposing a robotic lunar rover mission beginning with the site of Tranquility Base and rumbling across the Moon from one archaeological site to another, from the wreck of the Ranger 8 probe to Apollo 17's landing site. The mission, which would leave vehicle tyre marks all over some of the most famous sites on the Moon, was promoted as a form of theme-park entertainment.</p>
                  <p>According to the vaguely worded United Nations Outer Space Treaty of 1967, what it terms 'space junk' remains the property of the country that sent the craft or probe into space. But the treaty doesn't explicitly address protection of sites of human exploration of the heavens with 'space junk' leaves them vulnerable to scavengers. Another problem arises through other international treaties proclaiming that land in space cannot be owned by any country or individual. This presents some interesting dilemmas for the aspiring manager of extraterrestrial cultural resources. Does the US own Neil Armstrong's famous first footprints on the Moon but not the lunar dust in which they were recorded? Surely those footprints are as important in the story of human development as the 3.5 million-year-old Laetoli prints, which have survived for 3.5 million years encased in cement-like ash. Unlike the Laetoli prints, which will survive for those millions of years, the Apollo 11 footprints could be swept away with casual brush of a space tourist's hand. To deal with problems like these, it may be time to look to innovative international administrative structures for the preservation of historic remains on the new frontier.</p>
                  <p>The Moon, with its wealth of sites, will surely be the first destination of archaeologists trained to work in space. But any young scholars hoping to claim the mantle of history's first lunar archaeologist will be disappointed. That distinction is already taken. On November 19, 1969, astronauts Charles Conrad and Alan Bean made a difficult pin-point landing on the Moon's Ocean of Storms, just a few hundred feet from an unmanned probe, Surveyor 3, that had landed in a crater on April 19, 1967. Unrecognized at the time, this was an important moment in the history of science. Bean and Conrad were about to conduct the first archaeological studies on the Moon.</p>
                  <p>After the obligatory planting of the American flag and some geological sampling, Conrad and Bean made their way to Surveyor 3. They observed that the probe had bounced after touchdown and carefully photographed the impressions made by its footpads. The whole spacecraft was covered in dust, perhaps kicked up by the landing. The astronaut-archaeologists carefully removed the probe's television camera, remote sampling arm and pieces of tubing. They bagged and labelled these artefacts and stowed them on board their lunar module. On their return to Earth, they passed them on to the Daveson Space Center in Houston, Texas, and the Hughes Air and Space Corporation in El Segundo, California. There, scientists analysed the changes in these aerospace artefacts.</p>
                  <p>One result of the analysis astonished them. A fragment of the television camera revealed evidence of the bacteria Streptococcus mitis. For a moment it was thought that Conrad and Bean had discovered evidence for life on the Moon, but after further research the real explanation became apparent. While the camera was being installed in the probe prior to the launch, someone sneezed on it. The resulting bacteria had travelled to the Moon, remained in an alternating freezing/boiling vacuum for more than two years, and returned promptly to life upon reaching the safety of a laboratory back on Earth.</p>
                  <p>The finding that not even the vastness of space can stop humans from spreading a sore throat was an unexpected spin-off. But the artefacts brought back by Bean and Conrad have a broad significance. Simple as they may seem, they provide the first example of extraterrestrial archaeology and - perhaps more significant for the history of the discipline - formational archaeology, the study of environmental and cultural forces upon the life history of human artefacts in space.</p>
              </CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2"><div className="flex space-x-1 bg-gray-100 p-1 rounded-lg"><button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button><button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-27</button><button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 text-sm ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 28-40</button></div></div>
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-3</h3><p>Choose the correct answer, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>1</strong> The writer says that 'song-in-head syndrome' may occur because the brain</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> confuses two different types of memory.</p><p><strong>B</strong> cannot decide what information it needs to retain.</p><p><strong>C</strong> has been damaged by harmful input.</p><p><strong>D</strong> cannot hold onto all the information it processes.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} /></div>
                      <div><p><strong>2</strong> A tune is more likely to stay in your head if</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> it is simple and unoriginal.</p><p><strong>B</strong> you have musical training.</p><p><strong>C</strong> it is part of your culture.</p><p><strong>D</strong> you have a good memory.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} /></div>
                      <div><p><strong>3</strong> Robert Zatorre found that a part of the auditory cortex was activated when volunteers</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> listened to certain types of music.</p><p><strong>B</strong> learned to play a tune on an instrument.</p><p><strong>C</strong> replayed a piece of music after several years.</p><p><strong>D</strong> remembered a tune they had heard previously.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} /></div>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 4-7</h3><p>Look at the following theories (Questions 4-7) and the list of people below. Match each theory with the person it is credited to.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4"><p><strong>List of people</strong></p><p><strong>A</strong> Roger Chaffin, <strong>B</strong> Susan Ball, <strong>C</strong> Steven Brown, <strong>D</strong> Caroline Palmer, <strong>E</strong> Sandra Calvert, <strong>F</strong> Leon James</p></div>
                  <div className="space-y-4">
                      <p><strong>4</strong> The memorable nature of some tunes can help other learning processes.</p><Input className={`max-w-[100px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} />
                      <p><strong>5</strong> Music may not always be stored in the memory in the form of separate notes.</p><Input className={`max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} />
                      <p><strong>6</strong> People may have started to make music because of their need to remember things.</p><Input className={`max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} />
                      <p><strong>7</strong> Having a song going round your head may happen to you more often when one part of the brain is tired.</p><Input className={`max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 8-13</h3><p>Reading Passage 1 has nine paragraphs labelled A-I. Which paragraph contains the following information?</p>
                  <div className="space-y-4">
                      <p><strong>8</strong> a claim that music strengthens social bonds</p><Input className={`max-w-[100px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} />
                      <p><strong>9</strong> two reasons why some bits of music tend to stick in your mind more than others</p><Input className={`max-w-[100px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} />
                      <p><strong>10</strong> an example of how the brain may respond in opposition to your wishes</p><Input className={`max-w-[100px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} />
                      <p><strong>11</strong> the name of the part of the brain where song-in-head syndrome begins</p><Input className={`max-w-[100px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} />
                      <p><strong>12</strong> examples of two everyday events that can set off song-in-head syndrome</p><Input className={`max-w-[100px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} />
                      <p><strong>13</strong> a description of what one person does to prevent song-in-head syndrome</p><Input className={`max-w-[100px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} />
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-27</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p>Do the following statements agree with the claims of the writer in Reading Passage 2? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                  <div className="space-y-4">
                      <p><strong>14</strong> Today's wealthy people ignore the fact that millions are living in poverty.</p><Input className={`max-w-[150px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} />
                      <p><strong>15</strong> There are reasons why the future population of the world may not enjoy a comfortable lifestyle.</p><Input className={`max-w-[150px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} />
                      <p><strong>16</strong> The first thing to consider when planning for the future is environmental protection.</p><Input className={`max-w-[150px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} />
                      <p><strong>17</strong> As manufactured goods get cheaper, people will benefit more from them.</p><Input className={`max-w-[150px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} />
                      <p><strong>18</strong> It may be possible to find new types of raw materials for use in the production of machinery.</p><Input className={`max-w-[150px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} />
                      <p><strong>19</strong> The rising prices of fossil fuels may bring some benefits.</p><Input className={`max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-25</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-bold text-center">Space for an increased population</h4>
                    <p>According to the writer, the use of land for <strong>20</strong> <Input className={`inline-block w-40 ${getAnswerStatus('20') === 'correct' ? 'border-green-500' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} /> is the most serious threat to the environment. However, in the US, there has already been an increase in the amount of land used for <strong>21</strong> <Input className={`inline-block w-40 ${getAnswerStatus('21') === 'correct' ? 'border-green-500' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} /> and forests. Far less land would be required to feed the world's population if the <strong>22</strong> <Input className={`inline-block w-40 ${getAnswerStatus('22') === 'correct' ? 'border-green-500' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} /> of the land could be improved worldwide. It has also been claimed that the industrial production of animal foods could allow greater access to animal <strong>23</strong> <Input className={`inline-block w-40 ${getAnswerStatus('23') === 'correct' ? 'border-green-500' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} /> by the entire world's population. Scientists could use <strong>24</strong> <Input className={`inline-block w-40 ${getAnswerStatus('24') === 'correct' ? 'border-green-500' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} /> from domesticated animals to help produce meat by tissue cloning, and these species could then be allowed to die out. In addition to this type of meat, <strong>25</strong> <Input className={`inline-block w-40 ${getAnswerStatus('25') === 'correct' ? 'border-green-500' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} /> will also be widely available.</p>
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 26-27</h3><p>Choose the correct answer, A, B, C or D.</p>
                  <div className="space-y-6">
                      <div><p><strong>26</strong> Greater mobility may be a feature of the future because of changes in</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> the location of housing.</p><p><strong>B</strong> patterns of employment.</p><p><strong>C</strong> centres of transport.</p><p><strong>D</strong> the distribution of wealth.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} /></div>
                      <div><p><strong>27</strong> Air transport will be safe because of</p><div className="ml-6 space-y-2 text-sm"><p><strong>A</strong> new types of aircraft.</p><p><strong>B</strong> better training methods.</p><p><strong>C</strong> three-dimensional models.</p><p><strong>D</strong> improved technology.</p></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} /></div>
                  </div></div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 28-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 28-33</h3><p>Complete each sentence with the correct ending A-H from the box below.</p>
                  <div className="bg-gray-50 p-4 rounded-lg my-4 space-y-2">
                      <p><strong>A</strong> activities of tourists and scientists have harmed the environment.</p>
                      <p><strong>B</strong> some sites in space could be important in the history of space exploration.</p>
                      <p><strong>C</strong> vehicles used for tourism have polluted the environment.</p>
                      <p><strong>D</strong> it may be unclear who has responsibility for historic human footprints.</p>
                      <p><strong>E</strong> past explorers used technology in order to find new places to live.</p>
                      <p><strong>F</strong> man-made objects left in space are regarded as rubbish.</p>
                      <p><strong>G</strong> astronauts may need to work more closely with archaeologists.</p>
                      <p><strong>H</strong> important sites on the Moon may be under threat.</p>
                  </div>
                  <div className="space-y-4">
                      <p><strong>28</strong> Ben Finney's main academic work investigates the way that</p><Input className={`max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} />
                      <p><strong>29</strong> Ben Finney thought that in the long term</p><Input className={`max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} />
                      <p><strong>30</strong> Commercial pressures mean that in the immediate future</p><Input className={`max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} />
                      <p><strong>31</strong> Academics are concerned by the fact that in isolated regions on Earth,</p><Input className={`max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} />
                      <p><strong>32</strong> One problem with the 1967 UN treaty is that</p><Input className={`max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} />
                      <p><strong>33</strong> The wording of legal agreements over ownership of land in space means that</p><Input className={`max-w-[100px] ${getAnswerStatus('33') === 'correct' ? 'border-green-500' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} />
                  </div></div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 34-38</h3><p>Complete the flow chart below. Choose <strong>NO MORE THAN ONE WORD</strong> from the passage for each answer.</p>
                  <div className="space-y-2 border p-4 rounded-lg">
                      <p>During the assembly of the Surveyor 3 probe, someone <strong>34</strong> <Input className={`inline-block w-32 ${getAnswerStatus('34') === 'correct' ? 'border-green-500' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} /> on a TV camera.</p>
                      <p className="text-center">↓</p>
                      <p>The TV camera was carried to the Moon on Surveyor 3.</p>
                      <p className="text-center">↓</p>
                      <p>The TV camera remained on the Moon for over <strong>35</strong> <Input className={`inline-block w-32 ${getAnswerStatus('35') === 'correct' ? 'border-green-500' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} /> years.</p>
                      <p className="text-center">↓</p>
                      <p>Apollo 12 astronauts <strong>36</strong> <Input className={`inline-block w-32 ${getAnswerStatus('36') === 'correct' ? 'border-green-500' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} /> the TV camera.</p>
                      <p className="text-center">↓</p>
                      <p>The TV camera was returned to Earth for <strong>37</strong> <Input className={`inline-block w-32 ${getAnswerStatus('37') === 'correct' ? 'border-green-500' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} />.</p>
                      <p className="text-center">↓</p>
                      <p>The Streptococcus mitis bacteria were found.</p>
                      <p className="text-center">↓</p>
                      <p>The theory that this suggested there was <strong>38</strong> <Input className={`inline-block w-32 ${getAnswerStatus('38') === 'correct' ? 'border-green-500' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} /> on the Moon was rejected.</p>
                      <p className="text-center">↓</p>
                      <p>Scientists concluded that the bacteria can survive lunar conditions.</p>
                  </div></div>
                  <div className="mb-8">
                  {renderMultiSelect('39_40', 'Questions 39-40', 'The TWO main purposes of the writer of this text are to explain', [
                      'the reasons why space archaeology is not possible.',
                      'the dangers that could follow from contamination of objects from space.',
                      'the need to set up careful controls over space tourism.',
                      'the need to preserve historic sites and objects in space.',
                      'the possible cultural effects of space travel.'
                  ], ['C', 'D'])}
                  </div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm">Correct</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm">IELTS Band</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Object.keys(correctAnswers).filter(q => !q.includes('&') && !['39', '40'].includes(q)).map(qNum => { const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div>Your: {answers[qNum] || '(none)'}</div>{!isCorrect && <div>Correct: {correctAnswers[qNum as keyof typeof correctAnswers]}</div>}</div>);})}<div className={`p-3 rounded border ${multipleAnswers['39_40'].sort().join(',') === 'C,D' ? 'bg-green-50' : 'bg-red-50'}`}><div className="flex justify-between"><span className="font-semibold">Q 39-40</span><span className={`font-bold ${multipleAnswers['39_40'].sort().join(',') === 'C,D' ? 'text-green-600' : 'text-red-600'}`}>{multipleAnswers['39_40'].sort().join(',') === 'C,D' ? '✓' : '✗'}</span></div><div>Your: {multipleAnswers['39_40'].length > 0 ? multipleAnswers['39_40'].sort().join(', ') : '(none)'}</div><div>Correct: C, D</div></div></div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <PageViewTracker 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={3}
          />
          <TestStatistics 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={3}
          />
          <UserTestHistory 
            book="practice-tests-plus-2" 
            module="reading" 
            testNumber={3}
          />
        </div>
      </div>
    </div>
  )
}