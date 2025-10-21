'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import { getIELTSReadingScore } from '@/lib/utils'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'

export default function Book12ReadingTest1() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  useEffect(() => {
    setTestStartTime(Date.now());
  }, []);
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60) // 60 minutes in seconds
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
    setTestStartTime(Date.now());
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
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      
      const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : (60*60) - timeLeft;
      
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
      
      const testScoreData = {
        book: 'book-12',
        module: 'reading',
        testNumber: 1,
        score: calculatedScore,
        totalQuestions: Object.keys(correctAnswers).length,
        percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
        ieltsBandScore: getIELTSReadingScore(calculatedScore),
        timeTaken: timeTaken || 0
      };
      
      const saveResult = await saveTestScore(testScoreData, session);
      
      if (saveResult.success) {
        console.log('Test score saved successfully');
      } else {
        console.error('Failed to save test score:', saveResult.error);
      }
      
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setSubmitted(true);
      setShowResultsPopup(true);
      setIsSubmitting(false);
      setTimeLeft(0)
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
    '1': 'NOT GIVEN', '2': 'FALSE', '3': 'FALSE', '4': 'TRUE', '5': 'TRUE',
    '6': 'taste', '7': 'cheaper', '8': 'convenient', '9': 'image', '10': 'sustainable',
    '11': 'recycled', '12': 'biodiversity', '13': 'desertification', '14': 'antiques',
    '15': 'triumph', '16': 'information', '17': 'contact/meetings', '18': 'hunt/desire', '19': 'aimless/empty',
    '20': 'educational', '21': 'trainspotting', '22': 'NOT GIVEN', '23': 'FALSE',
    '24': 'NOT GIVEN', '25': 'TRUE', '26': 'TRUE', '27': 'vi', '28': 'viii',
    '29': 'ii', '30': 'iv', '31': 'iii', '32': 'vii', '33': 'fire science',
    '34': 'investigators', '35': 'evidence', '36': 'prosecution', '37': 'NOT GIVEN',
    '38': 'YES', '39': 'NO', '40': 'NO'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 12 - Reading Test 1</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6">
          <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">60 minutes</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
                {!isTestStarted && !submitted && (
                  <Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                    Start Test
                  </Button>
                )}
                {isTestStarted && !submitted && (
                  <div className="text-sm text-blue-600 font-medium">Test in Progress</div>
                )}
                {submitted && (
                  <div className="text-sm text-green-600 font-medium">Test Completed</div>
                )}
              </div>
              {!isTestStarted && !submitted && (
                <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                  <p className="font-semibold">Instructions:</p>
                  <p>• You have 60 minutes to complete all 40 questions.</p>
                  <p>• Click &quot;Start Test&quot; to begin the timer. The test will auto-submit when the timer runs out.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-3 z-10 border-b">
              <h2 className="text-xl font-bold">Reading Passages</h2>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={clearAllHighlights} 
                  variant="outline" 
                  size="sm" 
                  disabled={!isTestStarted || isSubmitting}
                  className="text-xs"
                >
                  Clear Highlights
                </Button>
                <div className="text-xs text-gray-500">
                  Select text to highlight
                </div>
              </div>
            </div>
            <TextHighlighter>
              <div className="lg:h-[calc(100vh-280px)] overflow-y-auto space-y-8 pr-2">
                {/* Reading passages remain the same */}
                 <Card>
                <CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-bold text-lg text-center">Cork</h3>
                  <p>Cork – the thick bark of the cork oak tree (Quercus suber) – is a remarkable material. It is tough, elastic, buoyant, and fire-resistant, and suitable for a wide range of purposes. It has also been used for millennia: the ancient Egyptians sealed their sarcophagi (stone coffins) with cork, while the ancient Greeks and Romans used it for anything from beehives to sandals.</p>
                  <p>And the cork oak itself is an extraordinary tree. Its bark grows up to 20 cm in thickness, insulating the tree like a coat wrapped around the trunk and branches and keeping the inside at a constant 20°C all year round. Developed most probably as a defence against forest fires, the bark of the cork oak has a particular cellular structure – with about 40 million cells per cubic centimetre – that technology has never succeeded in replicating. The cells are filled with air, which is why cork is so buoyant. It also has an elasticity that means you can squash it and watch it spring back to its original size and shape when you release the pressure.</p>
                  <p>Cork oaks grow in a number of Mediterranean countries, including Portugal, Spain, Italy, Greece and Morocco. They flourish in warm, sunny climates where there is a minimum of 400 millimetres of rain per year, and not more than 800 millimetres. Like grape vines, the trees thrive in poor soil, putting down deep roots in search of moisture and nutrients. Southern Portugal’s Alentejo region meets all of these requirements, which explains why, by the early 20th century, this region had become the world’s largest producer of cork, and why today it accounts for roughly half of all cork production around the world.</p>
                  <p>Most cork forests are family-owned. Many of these family businesses, and indeed many of the trees themselves, are around 200 years old. Cork production is, above all, an exercise in patience. From the planting of a cork sapling to the first harvest takes 25 years, and a gap of approximately a decade must separate harvests from an individual tree. And for top-quality cork, it’s necessary to wait a further 15 or 20 years. You even have to wait for the right kind of summer’s day to harvest cork. If the bark is stripped on a day when it’s too cold – or when the air is damp – the tree will be damaged.</p>
                  <p>Cork harvesting is a very specialised profession. No mechanical means of stripping cork bark has been invented, so the job is done by teams of highly skilled workers. First, they make vertical cuts down the bark using small sharp axes, then lever it away in pieces as large as they can manage. The most skilful cork-strippers prise away a semi-circular husk that runs the length of the trunk from just above ground level to the first branches. It is then dried on the ground for about four months, before being taken to factories, where it is boiled to kill any insects that might remain in the cork. Over 60% of cork then goes on to be made into traditional bottle stoppers, with most of the remainder being used in the construction trade. Corkboard and cork tiles are ideal for thermal and acoustic insulation, while granules of cork are used in the manufacture of concrete.</p>
                  <p>Recent years have seen the end of the virtual monopoly of cork as the material for bottle stoppers, due to concerns about the effect it may have on the contents of the bottle. This is caused by a chemical compound called 2,4,6-trichloroanisole (TCA), which forms through the interaction of plant phenols, chlorine and mould. The tiniest concentrations – as little as three or four parts to a trillion – can spoil the taste of the product contained in the bottle. The result has been a gradual yet steady move first towards plastic stoppers and, more recently, to aluminium screw caps. These substitutes are cheaper to manufacture and, in the case of screw caps, more convenient for the user.</p>
                  <p>The classic cork stopper does have several advantages, however. Firstly, its traditional image is more in keeping with that of the type of high quality goods with which it has long been associated. Secondly – and very importantly – cork is a sustainable product that can be recycled without difficulty. Moreover, cork forests are a resource which support local biodiversity, and prevent desertification in the regions where they are planted. So, given the current concerns about environmental issues, the future of this ancient material once again looks promising.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-bold text-lg text-center">Collecting as a hobby</h3>
                   <p>Collecting must be one of the most varied of human activities, and it’s one that many of us psychologists find fascinating. Many forms of collecting have been dignified with a technical name: an archtophilist collects teddy bears, a philatelist collects postage stamps, and a deltiologist collects postcards. Amassing hundreds or even thousands of postcards, chocolate wrappers or whatever, takes time, energy and money that could surely be put to much more productive use. And yet there are millions of collectors around the world. Why do they do it?</p>
                   <p>There are the people who collect because they want to make money – this could be called an instrumental reason for collecting; that is, collecting as a means to an end. They’ll look for, say, antiques that they can buy cheaply and expect to be able to sell at a profit. But there may well be a psychological element, too – buying cheap and selling dear can give the collector a sense of triumph. And as selling online is so easy, more and more people are joining in.</p>
                   <p>Many collectors collect to develop their social life, attending meetings of a group of collectors and exchanging information on items. This is a variant on joining a bridge club or a gym, and similarly brings them into contact with like-minded people.</p>
                   <p>Another motive for collecting is the desire to find something special, or a particular example of the collected item, such as a rare early recording by a particular singer. Some may spend their whole lives in a hunt for this. Psychologically, this can give a purpose to a life that otherwise feels aimless. There is a danger, though, that if the individual is ever lucky enough to find what they’re looking for, rather than celebrating their success, they may feel empty, now that the goal that drove them on has gone.</p>
                   <p>If you think about collecting postage stamps, another potential reason for it – or, perhaps, a result of collecting – is its educational value. Stamp collecting opens a window to other countries, and to the plants, animals, or famous people shown on their stamps. Similarly, in the 19th century, many collectors amassed fossils, animals and plants from around the globe, and their collections provided a vast amount of information about the natural world. Without those collections, our understanding would be greatly inferior to what it is.</p>
                   <p>In the past – and nowadays, too, though to a lesser extent – a popular form of collecting, particularly among boys and men, was trainspotting. This might involve trying to see every locomotive of a particular type, using published data that identifies each one, and ticking off each engine as it is seen. Trainspotters exchange information, these days often by mobile phone, so they can work out where to go to, to see a particular engine. As a by-product, many practitioners of the hobby become very knowledgeable about railway operations, or the technical specifications of different engine types.</p>
                   <p>Similarly, people who collect dolls may go beyond simply enlarging their collection, and develop an interest in the way that dolls are made, or the materials that are used. These have changed over the centuries from the wood that was standard in 16th century Europe, through the wax and porcelain of later centuries, to the plastics of today’s dolls. Or collectors might be inspired to study how dolls reflect notions of what children like, or ought to like.</p>
                   <p>Not all collectors are interested in learning from their hobby, though, so what we might call a psychological reason for collecting is the need for a sense of control, perhaps as a way of dealing with insecurity. Stamp collectors, for instance, arrange their stamps in albums, usually very neatly, organising their collection according to certain commonplace principles – perhaps by country in alphabetical order, or grouping stamps by what they depict – people, birds, maps, and so on.</p>
                   <p>One reason, conscious or not, for what someone chooses to collect is to show the collector’s individualism. Someone who decides to collect something as unexpected as dog collars, for instance, may be conveying their belief that they must be interesting themselves. And believe it or not, there is at least one dog collar museum in existence, and it grew out of a personal collection.</p>
                   <p>Of course, all hobbies give pleasure, but the common factor in collecting is usually passion: pleasure is putting it far too mildly. More than most other hobbies, collecting can be totally engrossing, and can give a strong sense of personal fulfilment. To non-collectors it may appear an eccentric, if harmless, way of spending time, but potentially, collecting has a lot going for it.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-bold text-lg text-center">What’s the purpose of gaining knowledge?</h3>
                  <p><b>A</b> ‘I would found an institution where any person can find instruction in any subject.’ That was the founder’s motto for Cornell University, and it seems an apt characterization of the different university, also in the USA, where I currently teach philosophy. A student can prepare for a career in resort management, engineering, interior design, accounting, music, law enforcement, you name it. But what would the founders of these two institutions have thought of a course called ‘Arson for Profit’? I kid you not: we have it on the books. Any undergraduates who have met the academic requirements can sign up for the course in our program in ‘fire science’.</p>
                  <p><b>B</b> Naturally, the course is intended for prospective arson investigators, who can learn all the tricks of the trade for detecting whether a fire was deliberately set, discovering who did it, and establishing a chain of evidence for effective prosecution in a court of law. But wouldn’t this also be the perfect course for prospective arsonists to sign up for? My point is not to criticize academic programs in fire science: they are highly welcome as part of the increasing professionalization of this and many other occupations. However, it’s not unknown for a firefighter to torch a building. This example suggests how dishonest and illegal behavior, with the help of higher education, can creep into every aspect of public and business life.</p>
                  <p><b>C</b> I realized this anew when I was invited to speak before a class in marketing, which is another of our degree programs. The regular instructor is a colleague who appreciates the kind of ethical perspective I can bring as a philosopher. There are endless ways I could have approached this assignment, but I took my cue from the title of the course: ‘Principles of Marketing’. It made me think to ask the students, ‘Is marketing principled?’ After all, a subject matter can have principles in the sense of being codified, having rules, as with football or chess, without being principled in the sense of being ethical. Many of the students immediately assumed that the answer to my question about marketing principles was obvious: no. Just look at the ways in which everything under the sun has been marketed; obviously it need not be done in a principled (=ethical) fashion.</p>
                  <p><b>D</b> Is that obvious? I made the suggestion, which may sound downright crazy in light of the evidence, that perhaps marketing is by definition principled. My inspiration for this judgement is the philosopher Immanuel Kant, who argued that any body of knowledge consists of an end (or purpose) and a means.</p>
                  <p><b>E</b> Let us apply both the terms ‘means’ and ‘end’ to marketing. The students have signed up for a course in order to learn how to market effectively. But to what end? There seem to be two main attitudes toward that question. One is that the answer is obvious: the purpose of marketing is to sell things and to make money. The other attitude is that the purpose of marketing is irrelevant: Each person comes to the program and course with his or her own plans, and these need not even concern the acquisition of marketing expertise as such. My proposal, which I believe would also be Kant’s, is that neither of these attitudes captures the significance of the end to the means for marketing. A field of knowledge or a professional endeavor is defined by both the means and the end; hence both deserve scrutiny. Students need to study both how to achieve X, and also what X is.</p>
                  <p><b>F</b> It is at this point that ‘Arson for Profit’ becomes supremely relevant. That course is presumably all about means: how to detect and prosecute criminal activity. It is therefore assumed that the end is good in an ethical sense. When I ask fire science students to articulate the end, or purpose, of their field, they eventually generalize to something like, ‘The safety and welfare of society,’ which seems right. As we have seen, someone could use the very same knowledge of means to achieve a much less noble end, such as personal profit via destructive, dangerous, reckless activity. But we would not call that firefighting. We have a separate word for it: arson. Similarly, if you employed the ‘principles of marketing’ in an unprincipled way, you would not be doing marketing. We have another term for it: fraud. Kant gives the example of a doctor and a poisoner, who use the identical knowledge to achieve their divergent ends. We would say that one is practicing medicine, the other, murder.</p>
                </CardContent>
              </Card>
              </div>
            </TextHighlighter>
          </div>
          
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('section1')} 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'section1' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Section 1: Q 1-13
                  </button>
                  <button 
                    onClick={() => setActiveTab('section2')} 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'section2' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Section 2: Q 14-26
                  </button>
                  <button 
                    onClick={() => setActiveTab('section3')} 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'section3' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Section 3: Q 27-40
                  </button>
                </div>
              </div>

              {activeTab === 'section1' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questions 1-13</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 1-5</h3>
                      <p className="mb-4">Do the following statements agree with the information given in Reading Passage 1?</p>
                      <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                        <p className="font-semibold">In boxes 1-5 on your answer sheet, write</p>
                        <p className="mt-2">
                          <span className="font-semibold">TRUE</span> if the statement agrees with the information<br/>
                          <span className="font-semibold">FALSE</span> if the statement contradicts the information<br/>
                          <span className="font-semibold">NOT GIVEN</span> if there is no information on this
                        </p>
                      </div>
                      <div className="space-y-4">
                        {['1', '2', '3', '4', '5'].map(qNum => {
                          const questions: Record<string, string> = {
                            '1': 'The cork oak has the thickest bark of any living tree.',
                            '2': 'Scientists have developed a synthetic cork with the same cellular structure as natural cork.',
                            '3': 'Individual cork oak trees must be left for 25 years between the first and second harvest.',
                            '4': 'Cork bark should be stripped in dry atmospheric conditions.',
                            '5': 'The only way to remove the bark from cork oak trees is by hand.'
                          };
                          return (
                            <div key={qNum}>
                              <p><b>{qNum}</b> {questions[qNum]}</p>
                              <Input 
                                placeholder="TRUE/FALSE/NOT GIVEN" 
                                value={answers[qNum] || ''} 
                                onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                disabled={!isTestStarted || submitted}
                                className={`mt-1 ${submitted ? (getAnswerStatus(qNum) === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                              />
                               {submitted && getAnswerStatus(qNum) === 'incorrect' && (
                                <p className="text-sm text-green-600 mt-1">Correct answer: {correctAnswers[qNum as keyof typeof correctAnswers]}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <hr />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 6-13</h3>
                      <p className="mb-4">Complete the notes below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                      <div className="border p-4 rounded-md bg-slate-50 space-y-2">
                        <h4 className="font-bold text-center mb-4">Comparison of aluminium screw caps and cork bottle stoppers</h4>
                        <div>
                            <b>Advantages of aluminium screw caps</b>
                            <ul className="list-disc list-inside ml-4">
                                <li>do not affect the <b>6</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || submitted}/> of the bottle contents {submitted && getAnswerStatus('6') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['6']})</span>}</li>
                                <li>are <b>7</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || submitted}/> to produce {submitted && getAnswerStatus('7') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['7']})</span>}</li>
                                <li>are <b>8</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || submitted}/> to use {submitted && getAnswerStatus('8') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['8']})</span>}</li>
                            </ul>
                        </div>
                        <div className="pt-2">
                            <b>Advantages of cork bottle stoppers</b>
                             <ul className="list-disc list-inside ml-4">
                                <li>suit the <b>9</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || submitted}/> of quality products {submitted && getAnswerStatus('9') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['9']})</span>}</li>
                                <li>made from a <b>10</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || submitted}/> material {submitted && getAnswerStatus('10') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['10']})</span>}</li>
                                <li>easily <b>11</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && getAnswerStatus('11') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['11']})</span>}</li>
                                <li>cork forests aid <b>12</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || submitted}/> {submitted && getAnswerStatus('12') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['12']})</span>}</li>
                                <li>cork forests stop <b>13</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || submitted}/> happening {submitted && getAnswerStatus('13') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['13']})</span>}</li>
                            </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'section2' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questions 14-26</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 14-21</h3>
                    <p className="mb-4">Complete the sentences below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                    <div className="space-y-3">
                        <p><b>14</b> The writer mentions collecting <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || submitted} /> as an example of collecting in order to make money. {submitted && getAnswerStatus('14') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['14']})</span>}</p>
                        <p><b>15</b> Collectors may get a feeling of <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || submitted} /> from buying and selling items. {submitted && getAnswerStatus('15') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['15']})</span>}</p>
                        <p><b>16</b> Collectors’ clubs provide opportunities to share <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || submitted} />. {submitted && getAnswerStatus('16') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['16']})</span>}</p>
                        <p><b>17</b> Collectors’ clubs offer <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || submitted} /> with people who have similar interests. {submitted && getAnswerStatus('17') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['17']})</span>}</p>
                        <p><b>18</b> Collecting sometimes involves a life-long <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || submitted} /> for a special item. {submitted && getAnswerStatus('18') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['18']})</span>}</p>
                        <p><b>19</b> Searching for something particular may prevent people from feeling their life is completely <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || submitted} />. {submitted && getAnswerStatus('19') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['19']})</span>}</p>
                        <p><b>20</b> Stamp collecting may be <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || submitted} /> because it provides facts about different countries. {submitted && getAnswerStatus('20') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['20']})</span>}</p>
                        <p><b>21</b> <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || submitted} /> tends to be mostly a male hobby. {submitted && getAnswerStatus('21') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['21']})</span>}</p>
                    </div>
                  </div>
                  <hr />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 22-26</h3>
                    <p className="mb-4">Do the following statements agree with the information given in the passage?</p>
                    <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                      <p className="font-semibold">In boxes 22-26 on your answer sheet, write</p>
                      <p className="mt-2">
                        <span className="font-semibold">TRUE</span> if the statement agrees with the information<br/>
                        <span className="font-semibold">FALSE</span> if the statement contradicts the information<br/>
                        <span className="font-semibold">NOT GIVEN</span> if there is no information on this
                      </p>
                    </div>
                    <div className="space-y-4">
                      {['22', '23', '24', '25', '26'].map(qNum => {
                          const questions: Record<string, string> = {
                            '22': 'The number of people buying dolls has grown over the centuries.',
                            '23': 'Sixteenth century European dolls were normally made of wax and porcelain.',
                            '24': 'Arranging a stamp collection by the size of the stamps is less common than other methods.',
                            '25': 'Someone who collects unusual objects may want others to think he or she is also unusual.',
                            '26': 'Collecting gives a feeling that other hobbies are unlikely to inspire.'
                          };
                          return (
                            <div key={qNum}>
                              <p><b>{qNum}</b> {questions[qNum]}</p>
                              <Input 
                                placeholder="TRUE/FALSE/NOT GIVEN" 
                                value={answers[qNum] || ''} 
                                onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                disabled={!isTestStarted || submitted}
                                className={`mt-1 ${submitted ? (getAnswerStatus(qNum) === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                              />
                               {submitted && getAnswerStatus(qNum) === 'incorrect' && (
                                <p className="text-sm text-green-600 mt-1">Correct answer: {correctAnswers[qNum as keyof typeof correctAnswers]}</p>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {activeTab === 'section3' && (
              <Card>
                <CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 27-32</h3>
                        <p className="mb-4">Choose the correct heading for each section from the list of headings below.</p>
                        <div className="border p-4 rounded-md mb-4 bg-slate-50">
                            <h4 className="font-bold mb-2">List of Headings</h4>
                            <ul className="list-roman list-inside text-sm">
                                <li>i. Courses that require a high level of commitment</li>
                                <li>ii. A course title with two meanings</li>
                                <li>iii. The equal importance of two key issues</li>
                                <li>iv. Applying a theory in an unexpected context</li>
                                <li>v. The financial benefits of studying</li>
                                <li>vi. A surprising course title</li>
                                <li>vii. Different names for different outcomes</li>
                                <li>viii. The possibility of attracting the wrong kind of student</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                           <p><b>27</b> Section A <Input value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('27') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['27']})</span>}</p>
                           <p><b>28</b> Section B <Input value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('28') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['28']})</span>}</p>
                           <p><b>29</b> Section C <Input value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('29') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['29']})</span>}</p>
                           <p><b>30</b> Section D <Input value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('30') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['30']})</span>}</p>
                           <p><b>31</b> Section E <Input value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('31') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['31']})</span>}</p>
                           <p><b>32</b> Section F <Input value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('32') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['32']})</span>}</p>
                        </div>
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 33-36</h3>
                        <p className="mb-4">Complete the summary below. Choose <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.</p>
                        <div className="border p-4 rounded-md bg-slate-50 space-y-2">
                          <h4 className="font-bold text-center mb-2">The ‘Arson for Profit’ course</h4>
                          <p>This is a university course intended for students who are undergraduates and who are studying <b>33</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || submitted} />. The expectation is that they will become <b>34</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || submitted} /> specialising in arson. The course will help them to detect cases of arson and find <b>35</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || submitted} /> of criminal intent, leading to successful <b>36</b> <Input className={`inline-block w-32 ${submitted ? (getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || submitted} /> in the courts.</p>
                           {submitted && ['33','34','35','36'].some(q => getAnswerStatus(q) === 'incorrect') && (
                            <div className="text-sm text-green-600 mt-2">
                                Correct answers: 
                                {getAnswerStatus('33') === 'incorrect' && ` 33. ${correctAnswers['33']}`}
                                {getAnswerStatus('34') === 'incorrect' && ` 34. ${correctAnswers['34']}`}
                                {getAnswerStatus('35') === 'incorrect' && ` 35. ${correctAnswers['35']}`}
                                {getAnswerStatus('36') === 'incorrect' && ` 36. ${correctAnswers['36']}`}
                            </div>
                           )}
                        </div>
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 37-40</h3>
                        <p className="mb-4">Do the following statements agree with the views of the writer in Reading Passage 3?</p>
                        <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                          <p className="font-semibold">In boxes 37-40 on your answer sheet, write</p>
                          <p className="mt-2">
                            <span className="font-semibold">YES</span> if the statement agrees with the views of the writer<br/>
                            <span className="font-semibold">NO</span> if the statement contradicts the views of the writer<br/>
                            <span className="font-semibold">NOT GIVEN</span> if it is impossible to say what the writer thinks about this
                          </p>
                        </div>
                        <div className="space-y-4">
                           {['37', '38', '39', '40'].map(qNum => {
                            const questions: Record<string, string> = {
                                '37': 'It is difficult to attract students onto courses that do not focus on a career.',
                                '38': 'The ‘Arson for Profit’ course would be useful for people intending to set fire to buildings.',
                                '39': 'Fire science courses are too academic to help people to be good at the job of firefighting.',
                                '40': 'The writer’s fire science students provided a detailed definition of the purpose of their studies.'
                            };
                            return (
                                <div key={qNum}>
                                <p><b>{qNum}</b> {questions[qNum]}</p>
                                <Input 
                                    placeholder="YES/NO/NOT GIVEN" 
                                    value={answers[qNum] || ''} 
                                    onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                    disabled={!isTestStarted || submitted}
                                    className={`mt-1 ${submitted ? (getAnswerStatus(qNum) === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                                />
                                {submitted && getAnswerStatus(qNum) === 'incorrect' && (
                                    <p className="text-sm text-green-600 mt-1">Correct answer: {correctAnswers[qNum as keyof typeof correctAnswers]}</p>
                                )}
                                </div>
                            )
                            })}
                        </div>
                    </div>
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubmit} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" 
              size="lg" 
              disabled={!isTestStarted || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
            {!isTestStarted ? (
              <p className="text-sm text-blue-600 mt-2">Start the test to enable submission</p>
            ) : (
              <p className="text-sm text-gray-600 mt-2">Make sure you have answered all questions before submitting</p>
            )}
          </div>
        )}

        {submitted && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div>
                <div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div>
                <div className="flex justify-center space-x-4 mt-6">
                  <Button onClick={handleReset} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">
                    {showAnswers ? 'Hide' : 'Show'} Answer Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center mt-8">
          {!submitted && (
            <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
          )}
        </div>

        {showAnswers && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Answer Key</CardTitle>
              {submitted && (
                <p className="text-sm text-gray-600">
                  <span className="text-green-600">Green</span> = Correct, <span className="text-red-600 ml-2">Red</span> = Incorrect
                </p>
              )}
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(correctAnswers).map(([question, answer]) => {
                    const userAnswer = answers[question] || '';
                    const isCorrect = checkAnswer(question);
                    return (
                      <div 
                        key={question} 
                        className={`p-3 rounded border ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Question {question}</span>
                          <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600">Your answer: </span>
                            <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {userAnswer || '(No answer)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Correct answer: </span>
                            <span className="font-medium text-green-700">{answer}</span>
                          </div>
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

        {showResultsPopup && (
          <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2>
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{score}/40</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{ieltsScore}</div>
                    <div className="text-sm text-gray-600">IELTS Band Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{40 - score}</div>
                    <div className="text-sm text-gray-600">Incorrect Answers</div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(correctAnswers).map((questionNumber) => {
                    const userAnswer = answers[questionNumber] || '';
                    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers];
                    const isCorrect = checkAnswer(questionNumber);
                    return (
                      <div 
                        key={questionNumber} 
                        className={`p-3 rounded border ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Question {questionNumber}</span>
                          <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600">Your answer: </span>
                            <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {userAnswer || '(No answer)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Correct answer: </span>
                            <span className="font-medium text-green-700">{correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => setShowResultsPopup(false)} variant="outline">
                  Close
                </Button>
                <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        <PageViewTracker 
          book="book-12" 
          module="reading" 
          testNumber={1} 
        />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <TestStatistics book="book-12" module="reading" testNumber={1} />
            <UserTestHistory book="book-12" module="reading" testNumber={1} />
          </div>
        </div>

      </div>
    </div>
  )
}