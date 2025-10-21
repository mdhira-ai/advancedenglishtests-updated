'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { TestStatistics } from '@/components/analytics/TestStatistics'
import { UserTestHistory } from '@/components/analytics/UserTestHistory';

export default function Book11ReadingTest4() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Set test start time
  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
  const [activeTab, setActiveTab] = useState('section1')

  const { clearAllHighlights, getHighlightCount } = useTextHighlighter()

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

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTestStarted, submitted, timeLeft]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Handled by TextHighlighter
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestStart = () => {
    setIsTestStarted(true);
  };

  const handleAnswerChange = (questionNumber: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }))
  }

  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const userAnswer = answers[questionNumber] || ''
    
    if (!userAnswer || userAnswer.trim() === '') {
      return false
    }
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    for (const questionNumber of Object.keys(correctAnswers)) {
      if (checkAnswer(questionNumber)) {
        correctCount++
      }
    }
    return correctCount
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      // Calculate time taken
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
      
      // Prepare detailed answers data
      const detailedAnswers = {
        singleAnswers: answers,
        multipleAnswers: {},
        results: Object.keys(correctAnswers).map(questionNum => ({
          questionNumber: questionNum,
          userAnswer: answers[questionNum] || '',
          correctAnswer: correctAnswers[questionNum as keyof typeof correctAnswers],
          isCorrect: checkAnswer(questionNum)
        })),
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        timeTaken
      };
      
      // Save to database using test score saver
      const testScoreData = {
        book: 'book-11',
        module: 'reading',
        testNumber: 4,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || undefined
      };
      
      const saveResult = await saveTestScore(testScoreData, session);
      
      if (saveResult.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', saveResult.error);
      }
      
      setSubmitted(true);
      setShowResultsPopup(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      // Still show results even if save failed
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setShowAnswers(false)
    setShowResultsPopup(false)
    setIsTestStarted(false)
    setTimeLeft(60 * 60)
    clearAllHighlights()
  }

  const getAnswerStatus = (questionNumber: string) => {
    if (!submitted) return 'default'
    return checkAnswer(questionNumber) ? 'correct' : 'incorrect'
  }

  const ieltsScore = getIELTSReadingScore(score)

  const correctAnswers = {
    '1': 'FALSE', '2': 'NOT GIVEN', '3': 'NOT GIVEN', '4': 'TRUE',
    '5': 'A', '6': 'C', '7': 'B', '8': 'A', '9': 'A',
    '10': 'D', '11': 'B', '12': 'E', '13': 'F',
    '14': 'B', '15': 'A', '16': 'B', '17': 'D', '18': 'C',
    '19': 'TRUE', '20': 'TRUE', '21': 'NOT GIVEN', '22': 'TRUE', '23': 'FALSE',
    '24': 'C', '25': 'A', '26': 'E',
    '27': 'vii', '28': 'vi', '29': 'iv', '30': 'v', '31': 'i', '32': 'ii',
    '33': 'G', '34': 'E', '35': 'B', '36': 'F',
    '37': 'NOT GIVEN', '38': 'NO', '39': 'YES', '40': 'YES'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 11 - Reading Test 4</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6">
          <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>{formatTime(timeLeft)}</div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">60 minutes</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
                {!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}
                {isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}
                {submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}
              </div>
              {!isTestStarted && !submitted && (<div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800"><p className="font-semibold">Instructions:</p><p>• You have 60 minutes to complete all 40 questions</p><p>• Click "Start Test" to begin the timer</p></div>)}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">
              <h2 className="text-xl font-bold">Reading Passages</h2>
              <div className="flex items-center space-x-2">
                <Button onClick={clearAllHighlights} variant="outline" size="sm" disabled={!isTestStarted || isSubmitting} className="text-xs">Clear Highlights</Button>
                <div className="text-xs text-gray-500">Select text to highlight • Double-click to remove • ESC to cancel</div>
              </div>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
                <Card><CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center font-bold text-xl mb-4">Research using twins</p><p>To biomedical researchers all over the world, twins offer a precious opportunity to untangle the influence of genes and the environment - of nature and nurture. Because identical twins come from a single fertilized egg that splits into two, they share virtually the same genetic code. Any differences between them - one twin having younger looking skin, for example - must be due to environmental factors such as less time spent in the sun.</p><p>Alternatively, by comparing the experiences of identical twins with those of fraternal twins, who come from separate eggs and share on average half their DNA, researchers can quantify the extent to which our genes affect our lives. If identical twins are more similar to each other with respect to an ailment than fraternal twins are, then vulnerability to the disease must be rooted at least in part in heredity.</p><p>These two lines of research - studying the differences between identical twins to pinpoint the influence of environment, and comparing identical twins with fraternal ones to measure the role of inheritance - have been crucial to understanding the interplay of nature and nurture in determining our personalities, behaviour, and vulnerability to disease.</p><p>The idea of using twins to measure the influence of heredity dates back to 1875, when the English scientist Francis Galton first suggested the approach (and coined the phrase 'nature and nurture'). But twin studies took a surprising twist in the 1980s, with the arrival of studies into identical twins who had been separated at birth and reunited as adults. Over two decades, 137 sets of twins eventually visited Thomas Bouchard's lab in what became known as the Minnesota Study of Twins Reared Apart. Numerous tests were carried out on the twins, and they were each asked more than 15,000 questions.</p><p>Bouchard and his colleagues used this mountain of data to identify how far twins were affected by their genetic makeup. The key to their approach was a statistical concept called heritability. In broad terms, the heritability of a trait measures the extent to which differences among members of a population can be explained by differences in their genetics. And what Bouchard and his colleagues found was that, in almost every case, the most important influence on the traits they examined - from reading and maths ability to personality and intelligence - was genes. The finding continues to cause controversy.</p><p>Lately, however, twin studies have helped lead scientists to a radical new conclusion: that nature and nurture are not the only elemental forces at work. According to a recent field called epigenetics, there is a third factor also in play, one that in some cases serves as a bridge between the environment and our genes, and in others operates on its own to shape who we are.</p><p>Epigenetic processes are chemical reactions tied to neither nature nor nurture but representing what researchers have called a 'third component'. These reactions influence how our genetic code is expressed: how each gene is strengthened or weakened, even turned on or off, to build our bones, brains and all the other parts of our bodies.</p><p>If you think of our DNA as an immense piano keyboard and our genes as the keys - each key symbolizing a segment of DNA responsible for a particular note, or trait, and all the keys combining to make us who we are - then epigenetic processes determine when and how each key can be struck, changing the tune being played.</p><p>One way the study of epigenetics is revolutionizing our understanding of biology is by revealing a mechanism by which the environment directly impacts on genes. Studies of animals, for example, have shown that when a rat experiences stress during pregnancy, it can cause epigenetic changes in a fetus that lead to behavioural problems as the rodent grows up. Other epigenetic processes appear to occur randomly, while others are normal, such as those that guide embryonic cells as they become heart, brain, or liver cells, for example.</p><p>Geneticist Danielle Reed has worked with many twins over the years and thought deeply about what twin studies have taught us. 'It's very clear when you look at twins that much of what they share is hardwired,' she says. 'Many things about them are absolutely the same and unalterable. But it's also clear, when you get to know them, that other things about them are different. Epigenetics is the origin of a lot of those differences, in my view.'</p><p>Reed credits Thomas Bouchard's work for today's surge in twin studies. 'He was the trailblazer,' she says. 'We forgot that 50 years ago things like heart disease were thought to be caused entirely by lifestyle. Schizophrenia was thought to be due to poor mothering. Twin studies have allowed us to be more reflective about what people are actually born with and what's caused by experience.'</p><p>Having said that, Reed adds, the latest work in epigenetics promises to take our understanding even further. 'What I like to say is that nature writes some things in pencil and some things in pen,' she says. 'Things written in pen you can't change. That's DNA. But things written in pencil you can. That's epigenetics. Now that we're actually able to look at the DNA and see where the pencil writings are, it's sort of a whole new world.'</p></CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center font-bold text-xl mb-4">An introduction to film sound</p><p>Though we might think of film as an essentially visual experience, we really cannot afford to underestimate the importance of film sound. A meaningful sound track is often as complicated as the image on the screen, and is ultimately just as much the responsibility of the director. The entire sound track consists of three essential ingredients: the human voice, sound effects and music. These three tracks must be mixed and balanced so as to produce the necessary emphases which in turn create desired effects. Topics which essentially refer to the three previously mentioned tracks are discussed below. They include dialogue, synchronous and asynchronous sound effects, and music.</p><p>Let us start with dialogue. As is the case with stage drama, dialogue serves to tell the story and expresses feelings and motivations of characters as well. Often with film characterization the audience perceives little or no difference between the character and the actor. Thus, for example, the actor Humphrey Bogart is the character Sam Spade; film personality and life personality seem to merge. Perhaps this is because the very texture of an actor's voice supplies an element of character.</p><p>When voice textures fit the performer's physiognomy and gestures, a whole and very realistic persona emerges. The viewer sees not an actor working at his craft, but another human being struggling with life. It is interesting to note that how dialogue is used and the very amount of dialogue used varies widely among films. For example, in the highly successful science-fiction film 2001, little dialogue was evident, and most of it was banal and of little intrinsic interest. In this way the film-maker was able to portray what Thomas Sobochack and Vivian Sobochack call, in An Introduction to Film, the 'inadequacy of human responses when compared with the magnificent technology created by man and the visual beauties of the universe'.</p><p>The comedy Bringing Up Baby, on the other hand, presents practically non-stop dialogue delivered at breakneck speed. This use of dialogue underscores not only the dizzy quality of the character played by Katharine Hepburn, but also the absurdity of the film itself and thus its humor. The audience is bounced from gag to gag and conversation to conversation; there is no time for audience reflection. The audience is caught up in a whirlwind of activity in simply managing to follow the plot. This film presents pure escapism - largely due to its frenetic dialogue.</p><p>Synchronous sound effects are those sounds which are synchronized or matched with what is viewed. For example, if the film portrays a character playing the piano, the sounds of the piano are projected. Synchronous sounds contribute to the realism of film and also help to create a particular atmosphere. For example, the 'click' of a door being opened may simply serve to convince the audience that the image portrayed is real, and the audience may only subconsciously note the expected sound. However, if the 'click' of an opening door is part of an ominous action such as a burglary, the sound mixer may call attention to the 'click' with an increase in volume; this helps to engage the audience in a moment of suspense.</p><p>Asynchronous sound effects, on the other hand, are not matched with a visible source of the sound on screen. Such sounds are included so as to provide an appropriate emotional nuance, and they may also add to the realism of the film. For example, a film-maker might opt to include the background sound of an ambulance's siren while the foreground sound and image portrays an arguing couple. The asynchronous ambulance siren underscores the psychic injury incurred in the argument; at the same time the noise of the siren adds to the realism of the film by acknowledging the film's city setting.</p><p>We are probably all familiar with background music in films, which has become so ubiquitous as to be noticeable in its absence. We are aware that it is used to add emotion and rhythm. Usually not meant to be noticeable, it often provides a tone or an emotional attitude toward the story and/or the characters depicted. In addition, background music often foreshadows a change in mood. For example, dissonant music may be used in film to indicate an approaching (but not yet visible) menace or disaster.</p><p>Background music may aid viewer understanding by linking scenes. For example, a particular musical theme associated with an individual character or situation may be repeated at various points in a film in order to remind the audience of salient motifs or ideas.</p><p>Film sound comprises conventions and innovations. We have come to expect an acceleration of music during car chases and creaky doors in horror films. Yet, it is important to note as well that sound is often brilliantly conceived. The effects of sound are often largely subtle and often are noted by only our subconscious minds. We need to foster an awareness of film sound as well as film space so as to truly appreciate an art form that sprang to life during the twentieth century - the modern film.</p></CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center font-bold text-xl mb-4">‘This Marvellous Invention’</p><p><span className="font-semibold">A</span> Of all mankind’s manifold creations, language must take pride of place. Other inventions – the wheel, agriculture, sliced bread – may have transformed our material existence, but the advent of language is what made us human. Compared to language, all other inventions pale in significance, since everything we have ever achieved depends on language and originates from it. Without language, we could never have embarked on our ascent to unparalleled power over all other animals, and even over nature itself.</p><p><span className="font-semibold">B</span> But language is foremost not just because it came first. In its own right it is a tool of extraordinary sophistication, yet based on an idea of ingenious simplicity: ‘this marvellous invention of composing out of twenty-five or thirty sounds that infinite variety of expressions which, whilst having in themselves no likeness to what is in our mind, allow us to disclose to others its whole secret, and to make known to those who cannot penetrate it all that we imagine, and all the various stirrings of our soul’. This was how, in 1660, the renowned French grammarians of the Port-Royal abbey near Versailles distilled the essence of language, and no one since has celebrated more eloquently the magnitude of its achievement. Even so, there is just one flaw in all these hymns of praise, for the homage to language’s unique accomplishment conceals a simple yet critical incongruity. Language is mankind’s greatest invention – except, of course, that it was never invented. This apparent paradox is at the core of our fascination with language, and it holds many of its secrets.</p><p><span className="font-semibold">C</span> Language often seems so skilfully drafted that one can hardly imagine it as anything other than the perfected handiwork of a master craftsman. How else could this instrument make so much out of barely three dozen measly morsels of sound? In themselves, these configurations of mouth, p,f,b,v,t,d,k,g,sh,a,e and so on – amount to nothing more than a few haphazard spits and splutters, random noises with no meaning, no ability to express, no power to explain. But run them through the cogs and wheels of the language machine, let it arrange them in some very special orders, and there is nothing that these meaningless streams of air cannot do: from sighing the interminable boredom of existence to unravelling the fundamental order of the universe.</p><p><span className="font-semibold">D</span> The most extraordinary thing about language, however, is that one doesn’t have to be a genius to set its wheels in motion. The language machine allows just about everybody – from pre-modern foragers in the subtropical savannah, to post-modern philosophers in the suburban sprawl – to tie these meaningless sounds together into an infinite variety of subtle senses, and all apparently without the slightest exertion. Yet it is precisely this deceptive ease which makes language a victim of its own success, since in everyday life its triumphs are usually taken for granted. The wheels of language run so smoothly that one rarely bothers to stop and think about all the resourcefulness and expertise that must have gone into making it tick.</p><p><span className="font-semibold">E</span> Often, it is only the estrangement of foreign tongues, with their many exotic and outlandish features, that brings home the wonder of language’s design. One of the showiest stunts that some languages can pull off is an ability to build up words of breath-taking length, and thus express in one word what English takes a whole sentence to say. The Turkish word *şehirlileştiremediklerimizdensiniz*, to take one example, means nothing less than ‘you are one of those whom we can’t turn into a town-dweller’. (In case you were wondering, this monstrosity really is one word, not merely many different words squashed together – most of its components cannot even stand up on their own.)</p><p><span className="font-semibold">F</span> And if that sounds like some one-off freak, then consider Sumerian, the language spoken on the banks of the Euphrates some 5,000 years ago by the people who invented writing and thus enabled the documentation of history. Sumerian was an ‘agglutinative’ language, which means that it could stick strings of discrete grammatical particles to the roots of words, with the result that these words could become very long and express complex grammatical relations. A Sumerian word like *munintuma’a* (‘when he had made it suitable for her’) is a single word, not a sentence. What is more, the elements of the word are not just tacked together; they are arranged in a strict sequence, like a string of beads. If the order of the beads is changed, the meaning is changed as well.</p></CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {/* Tab Navigation */}
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 1: Q 1-13</button>
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 2: Q 14-26</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Section 3: Q 27-40</button>
                </div>
              </div>
              {activeTab === 'section1' && (<Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-4</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 1?</strong></p><p className="mb-4">In boxes 1-4 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">1</span><div className="flex-1"><p>There may be genetic causes for the differences in how young the skin of identical twins looks.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">2</span><div className="flex-1"><p>Twins are at greater risk of developing certain illnesses than non-twins.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">3</span><div className="flex-1"><p>Bouchard advertised in newspapers for twins who had been separated at birth.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">4</span><div className="flex-1"><p>Epigenetic processes are different from both genetic and environmental processes.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 5-9</h3><p className="mb-4"><strong>Look at the following statements (Questions 5-9) and the list of researchers below.</strong></p><p className="mb-4"><strong>Match each statement with the correct researcher, A, B or C.</strong></p><p className="mb-4 italic">NB You may use any letter more than once.</p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2">List of Researchers</h4><div><strong>A</strong> Francis Galton</div><div><strong>B</strong> Thomas Bouchard</div><div><strong>C</strong> Danielle Reed</div></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">5</span><div className="flex-1"><p>invented a term used to distinguish two factors affecting human characteristics</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">6</span><div className="flex-1"><p>expressed the view that the study of epigenetics will increase our knowledge</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">7</span><div className="flex-1"><p>developed a mathematical method of measuring genetic influences</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">8</span><div className="flex-1"><p>pioneered research into genetics using twins</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">9</span><div className="flex-1"><p>carried out research into twins who had lived apart</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 10-13</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-F, below.</strong></p><div className="space-y-4 p-4 border rounded-md bg-gray-50"><h4 className="font-semibold text-center">Epigenetic processes</h4><p>In epigenetic processes, <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="10"/> influence the activity of our genes, for example in creating our internal <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="11"/>. The study of epigenetic processes is uncovering a way in which our genes can be affected by our <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="12"/>. One example is that if a pregnant rat suffers stress, the new-born rat may later show problems in its <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="13"/>.</p></div><div className="border border-gray-300 p-4 mt-4 bg-gray-50 grid grid-cols-3 gap-2 text-center"><p><strong>A</strong> nurture</p><p><strong>B</strong> organs</p><p><strong>C</strong> code</p><p><strong>D</strong> chemicals</p><p><strong>E</strong> environment</p><p><strong>F</strong> behaviour/behavior</p></div></div></CardContent></Card>)}
              {activeTab === 'section2' && (<Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-18</h3><p className="mb-4"><strong>Choose the correct letter, A, B, C or D.</strong></p><div className="space-y-6"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">14</span><div className="flex-1"><p>In the first paragraph, the writer makes a point that</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> the director should plan the sound track at an early stage in filming.</div><div><strong>B</strong> it would be wrong to overlook the contribution of sound to the artistry of films.</div><div><strong>C</strong> the music industry can have a beneficial influence on sound in film.</div><div><strong>D</strong> it is important for those working on the sound in a film to have sole responsibility for it.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">15</span><div className="flex-1"><p>One reason that the writer refers to Humphrey Bogart is to exemplify</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> the importance of the actor and the character appearing to have similar personalities.</div><div><strong>B</strong> the audience's wish that actors are visually appropriate for their roles.</div><div><strong>C</strong> the value of the actor having had similar feelings to the character.</div><div><strong>D</strong> the audience's preference for dialogue to be as authentic as possible.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">16</span><div className="flex-1"><p>In the third paragraph, the writer suggests that</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> audiences are likely to be critical of film dialogue that does not reflect their own experience.</div><div><strong>B</strong> film dialogue that appears to be dull may have a specific purpose.</div><div><strong>C</strong> filmmakers vary considerably in the skill with which they handle dialogue.</div><div><strong>D</strong> the most successful films are those with dialogue of a high quality.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">17</span><div className="flex-1"><p>What does the writer suggest about Bringing Up Baby?</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> The plot suffers from the filmmaker's wish to focus on humorous dialogue.</div><div><strong>B</strong> The dialogue helps to make it one of the best comedy films ever produced.</div><div><strong>C</strong> There is a mismatch between the speed of the dialogue and the speed of the actions.</div><div><strong>D</strong> The nature of the dialogue emphasises key elements of the film.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">18</span><div className="flex-1"><p>The writer refers to the 'click' of a door to make the point that realistic sounds</p><div className="ml-4 my-2 space-y-1"><div><strong>A</strong> are often used to give the audience a false impression of events in the film.</div><div><strong>B</strong> may be interpreted in different ways by different members of the audience.</div><div><strong>C</strong> may be modified in order to manipulate the audience's response to the film.</div><div><strong>D</strong> tend to be more significant in films presenting realistic situations.</div></div><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 19-23</h3><p className="mb-4"><strong>Do the following statements agree with the information given in Reading Passage 2?</strong></p><p className="mb-4">In boxes 19-23 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>TRUE</strong> if the statement agrees with the information</p><p><strong>FALSE</strong> if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">19</span><div className="flex-1"><p>Audiences are likely to be surprised if a film lacks background music.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">20</span><div className="flex-1"><p>Background music may anticipate a development in a film.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">21</span><div className="flex-1"><p>Background music has more effect on some people than on others.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">22</span><div className="flex-1"><p>Background music may help the audience to make certain connections within the film.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">23</span><div className="flex-1"><p>Audiences tend to be aware of how the background music is affecting them.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p className="mb-4"><strong>Complete each sentence with the correct ending, A-E, below.</strong></p><div className="space-y-4 mb-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">24</span><p>The audience's response to different parts of a film can be controlled</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">25</span><p>The feelings and motivations of characters become clear</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">26</span><p>A character seems to be a real person rather than an actor</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="border border-gray-300 p-4 bg-gray-50 space-y-1"><div><strong>A</strong> when the audience listens to the dialogue.</div><div><strong>B</strong> if the film reflects the audience's own concerns.</div><div><strong>C</strong> if voice, sound and music are combined appropriately.</div><div><strong>D</strong> when the director is aware of how the audience will respond.</div><div><strong>E</strong> when the actor's appearance, voice and moves are consistent with each other.</div></div></div></CardContent></Card>)}
              {activeTab === 'section3' && (<Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent><div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-32</h3><p className="mb-4"><strong>Reading Passage 3 has six paragraphs, A-F.</strong></p><p className="mb-4"><strong>Choose the correct heading for paragraphs A-F from the list of headings below.</strong></p><p className="mb-4"><strong>Write the correct number, i-vii, in boxes 27-32 on your answer sheet.</strong></p><div className="border border-gray-300 p-4 mb-4 bg-gray-50"><h4 className="font-semibold mb-2 text-center">List of Headings</h4><div className="space-y-1"><div><strong>i</strong> Differences between languages highlight their impressiveness</div><div><strong>ii</strong> The way in which a few sounds are organised to convey a huge range of meaning</div><div><strong>iii</strong> Why the sounds used in different languages are not identical</div><div><strong>iv</strong> Apparently incompatible characteristics of language</div><div><strong>v</strong> Even silence can be meaningful</div><div><strong>vi</strong> Why language is the most important invention of all</div><div><strong>vii</strong> The universal ability to use language</div></div></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">27</span><p>Paragraph A</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">28</span><p>Paragraph B</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">29</span><p>Paragraph C</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">30</span><p>Paragraph D</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">31</span><p>Paragraph E</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">32</span><p>Paragraph F</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div><div className="my-8"><h3 className="text-lg font-semibold mb-4">Questions 33-36</h3><p className="mb-4"><strong>Complete the summary using the list of words, A-G, below.</strong></p><div className="space-y-4 p-4 border rounded-md bg-gray-50"><h4 className="font-semibold text-center mb-4">The importance of language</h4><p>The wheel is one invention that has had a major impact on <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="33"/> aspects of life, but no impact has been as <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="34"/> as that of language. Language is very <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="35"/>, yet composed of just a small number of sounds. Language appears to be <Input className={`inline-block w-24 mx-1 ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="36"/> to use. However, its sophistication is often overlooked.</p></div><div className="border border-gray-300 p-4 mt-4 bg-gray-50 grid grid-cols-4 gap-2 text-center"><p><strong>A</strong> difficult</p><p><strong>B</strong> complex</p><p><strong>C</strong> original</p><p><strong>D</strong> admired</p><p><strong>E</strong> material</p><p><strong>F</strong> easy</p><p><strong>G</strong> fundamental</p></div></div><div className="my-8"><h3 className="text-lg font-semibold mb-4">Questions 37-40</h3><p className="mb-4"><strong>Do the following statements agree with the views of the writer in Reading Passage 3?</strong></p><p className="mb-4">In boxes 37-40 on your answer sheet, write</p><div className="ml-4 mb-4"><p><strong>YES</strong> if the statement agrees with the views of the writer</p><p><strong>NO</strong> if the statement contradicts the views of the writer</p><p><strong>NOT GIVEN</strong> if there is no information on this</p></div><div className="space-y-4"><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">37</span><div className="flex-1"><p>Human beings might have achieved their present position without language.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">38</span><div className="flex-1"><p>The Port-Royal grammarians did justice to the nature of language.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">39</span><div className="flex-1"><p>A complex idea can be explained more clearly in a sentence than in a single word.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div><div className="flex items-start gap-4"><span className="font-semibold min-w-[20px]">40</span><div className="flex-1"><p>The Sumerians were responsible for starting the recording of events.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div></div></div></CardContent></Card>)}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button>{!isTestStarted ? (<p className="text-sm text-blue-600 mt-2">Start the test to enable submission</p>) : (<p className="text-sm text-gray-600 mt-2">Make sure you have answered all questions before submitting</p>)}</div>)}
        {submitted && (<Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4"><div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div><div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div><div className="flex justify-center space-x-4 mt-6"><Button onClick={handleReset} variant="outline">Try Again</Button><Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button></div></div></CardContent></Card>)}
        <div className="flex justify-center mt-8">{!submitted && (<Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answers</Button>)}</div>
        
        {showAnswers && (
            <Card className="mt-8">
            <CardHeader>
                <CardTitle>Answer Key</CardTitle>
                {submitted && (<p className="text-sm text-gray-600"><span className="text-green-600">Green</span> = Correct, <span className="text-red-600 ml-2">Red</span> = Incorrect</p>)}
            </CardHeader>
            <CardContent>
                {submitted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(correctAnswers).map(([question, answer]) => {
                    const userAnswer = answers[question] || '';
                    const isCorrect = checkAnswer(question);
                    return (
                        <div key={question} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {question}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div>
                        <div className="text-sm space-y-1">
                            <div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div>
                            <div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{answer}</span></div>
                        </div>
                        </div>
                    );
                    })}
                </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(correctAnswers).map(([question, answer]) => (
                    <div key={question} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{question}:</span>
                        <span className="text-gray-800">{answer}</span>
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
            </Card>
        )}

        {showResultsPopup && (<div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"><div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div><div className="text-center"><div className="text-3xl font-bold text-red-600">{40 - score}</div><div className="text-sm text-gray-600">Incorrect Answers</div></div></div></div><div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map((questionNumber) => { const userAnswer = answers[questionNumber] || ''; const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]; const isCorrect = checkAnswer(questionNumber); return (<div key={questionNumber} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {questionNumber}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswer}</span></div></div></div>);})}</div></div><div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div></div></div>)}
        {/* Page View Tracker */}
        <PageViewTracker 
          book="book-11"
          module="reading"
          testNumber={4}
        />
        
        {/* Test Information and Statistics */}
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
          <TestStatistics 
            book="book-11"
            module="reading"
            testNumber={4}
          />
          <UserTestHistory 
            book="book-11"
            module="reading"
            testNumber={4}
          />
        </div>

      </div>
    </div>
  )
}