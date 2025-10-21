'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { saveTestScore } from '@/lib/test-score-saver'
import { getIELTSReadingScore } from '@/lib/utils'
import { checkAnswer as checkAnswerWithMatching } from '@/lib/answer-matching'
import TextHighlighter, { useTextHighlighter } from '@/components/utils/TextHighlighter'
import { PageViewTracker, TestStatistics, UserTestHistory } from '@/components/analytics'

// Main Component - e.g., export default function Book13ReadingTest1()
export default function Book13ReadingTest1() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResultsPopup, setShowResultsPopup] = useState(false)

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = useSession();

  // Test-specific details
  const BOOK = "book-13";
  const TEST_NUMBER = 1;

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
          if (prevTime <= 1) {
            handleSubmit();
            return 0;
          }
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
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  }

 
  const correctAnswers: Record<string, string> = {
    '1': 'update', '2': 'environment', '3': 'captain', '4': 'films', '5': 'blog',
    '6': 'accommodation', '7': 'blog', '8': 'FALSE', '9': 'NOT GIVEN', '10': 'FALSE',
    '11': 'TRUE', '12': 'NOT GIVEN', '13': 'TRUE', '14': 'iv', '15': 'vi', '16': 'i',
    '17': 'v', '18': 'viii', '19': 'iii', '20': 'E', '21': 'B', '22': 'D', '23': 'A',
    '24': 'focus', '25': 'pleasure', '26': 'curiosity', '27': 'B', '28': 'C', '29': 'C',
    '30': 'D', '31': 'A', '32': 'D', '33': 'A', '34': 'E', '35': 'C', '36': 'G',
    '37': 'B', '38': 'YES', '39': 'NOT GIVEN', '40': 'NO'
  };
  const checkAnswer = (questionNumber: string): boolean => {
    const correctAnswer = correctAnswers[questionNumber];
    const userAnswer = answers[questionNumber] || '';
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber);
  }

  const calculateScore = () => {
    let correctCount = 0;
    for (const qNum of Object.keys(correctAnswers)) {
      if (checkAnswer(qNum)) correctCount++;
    }
    return correctCount;
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    const timeTaken = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    
    const detailedAnswers = {
      singleAnswers: answers,
      results: Object.keys(correctAnswers).map(qNum => ({
        questionNumber: qNum,
        userAnswer: answers[qNum] || '',
        correctAnswer: correctAnswers[qNum],
        isCorrect: checkAnswer(qNum)
      })),
      score: calculatedScore,
      totalQuestions: Object.keys(correctAnswers).length,
      percentage: Math.round((calculatedScore / Object.keys(correctAnswers).length) * 100),
      timeTaken
    };

    try {
      const testScoreData = {
        book: BOOK,
        module: 'reading',
        testNumber: TEST_NUMBER,
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
      setSubmitted(true);
      setShowResultsPopup(true);
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    setAnswers({}); setSubmitted(false); setScore(0); setShowAnswers(false);
    setShowResultsPopup(false); setIsTestStarted(false); setTimeLeft(60 * 60);
    clearAllHighlights();
  }

  const getAnswerStatus = (qNum: string) => submitted ? (checkAnswer(qNum) ? 'correct' : 'incorrect') : 'default';
  const ieltsScore = getIELTSReadingScore(score);

  /*-- 2. JSX RETURN STATEMENT GOES HERE --*/
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 13 - Reading Test 1</h1>
            <p className="text-gray-600">Academic Reading | Time: 60 minutes | Questions: 1-40</p>
          </div>
        </div>

        <div className="mb-6">
            <Card className={`${isTestStarted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <CardContent className="p-4"><div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="text-center"><div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>{formatTime(timeLeft)}</div><div className="text-sm text-gray-600">Time Remaining</div></div>
                    </div>
                    {!isTestStarted && !submitted && (<Button onClick={handleTestStart} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">Start Test</Button>)}
                    {isTestStarted && !submitted && <div className="text-sm text-blue-600 font-medium">Test in Progress</div>}
                    {submitted && <div className="text-sm text-green-600 font-medium">Test Completed</div>}
                </div>
                {!isTestStarted && !submitted && (<div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800"><p className="font-semibold">Instructions:</p><p>• You have 60 minutes. Click "Start Test" to begin the timer.</p></div>)}
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
                  <h3 className="font-semibold text-center">Case Study: Tourism New Zealand website</h3>
                  <p>New Zealand is a small country of four million inhabitants, a long-haul flight from all the major tourist-generating markets of the world. Tourism currently makes up 9% of the country's gross domestic product, and is the country's largest export sector. Unlike other export sectors, which make products and then sell them overseas, tourism brings its customers to New Zealand. The product is the country itself – the people, the places and the experiences. In 1999, Tourism New Zealand launched a campaign to communicate a new brand position to the world. The campaign focused on New Zealand's scenic beauty, exhilarating outdoor activities and authentic Maori culture, and it made New Zealand one of the strongest national brands in the world.</p>
                  <p>A key feature of the campaign was the website www.newzealand.com, which provided potential visitors to New Zealand with a single gateway to everything the destination had to offer. The heart of the website was a database of tourism services operators, both those based in New Zealand and those based abroad which offered tourism services to the country. Any tourism-related business could be listed by filling in a simple form. This meant that even the smallest bed and breakfast address or specialist activity provider could gain a web presence with access to an audience of long-haul visitors. In addition, because participating businesses were able to update the details they gave on a regular basis, the information provided remained accurate. And to maintain and improve standards, Tourism New Zealand organised a scheme whereby organisations appearing on the website underwent an independent evaluation against a set of agreed national standards of quality. As part of this, the effect of each business on the environment was considered.</p>
                  <p>To communicate the New Zealand experience, the site also carried features relating to famous people and places. One of the most popular was an interview with former New Zealand All Blacks rugby captain Tana Umaga. Another feature that attracted a lot of attention was an interactive journey through a number of the locations chosen for blockbuster films which had made use of New Zealand's stunning scenery as a backdrop. As the site developed, additional features were added to help independent travellers devise their own customised itineraries. To make it easier to plan motoring holidays, the site catalogued the most popular driving routes in the country, highlighting different routes according to the season and indicating distances and times.</p>
                  <p>Later, a Travel Planner feature was added, which allowed visitors to click and 'bookmark' places or attractions they were interested in and then view the results on a map. The Travel Planner offered suggested routes and public transport options between the chosen locations. There were also links to accommodation in the area. By registering with the website, users could save their Travel Plan and return to it later, or print it out to take on the visit. The website also had a 'Your Words' section where anyone could submit a blog of their New Zealand travels for possible inclusion on the website.</p>
                  <p>The Tourism New Zealand website won two Webby awards for online achievement and innovation. More importantly perhaps, the growth of tourism to New Zealand was impressive. Overall tourism expenditure increased by an average of 6.9% per year between 1999 and 2004. From Britain, visits to New Zealand grew at an average annual rate of 13% between 2002 and 2006, compared to a rate of 4% overall for British visits abroad.</p>
                  <p>The website was set up to allow both individuals and travel organisations to create itineraries and travel packages to suit their own needs and interests. On the website, visitors can search for activities not solely by geographical location, but also by the particular nature of the activity. This is important as research shows that activities are the key driver of visitor satisfaction, contributing 74% to visitor satisfaction, while transport and accommodation account for the remaining 26%. The more activities that visitors enjoy, the more satisfied they will be. It has also been found that visitors enjoy cultural activities most when they are interactive, such as visiting a marae (meeting ground) to learn about traditional Maori life. Many long-haul travellers enjoy such learning experiences, which provide them with stories to take home to their friends and family. In addition, it appears that visitors to New Zealand don't want to be 'one of the crowd' and find activities that involve only a few people more special and meaningful.</p>
                  <p>It could be argued that New Zealand is not a typical destination. New Zealand is a small country with a visitor economy composed mainly of small businesses. It is generally perceived as a safe English-speaking country with a reliable transport infrastructure. Because of the long-haul flight, most visitors stay for longer (average 20 days) and want to see as much of the country as possible on what is often seen as a once-in-a-lifetime visit. However, the underlying lessons apply anywhere – the effectiveness of a strong brand, a strategy based on unique experiences and a comprehensive and user-friendly website.</p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">Why being bored is stimulating – and useful, too</h3>
                  <p><b>A</b> We all know how it feels – it’s impossible to keep your mind on anything, time stretches out, and all the things you could do seem equally unlikely to make you feel better. But defining boredom so that it can be studied in the lab has proved difficult. For a start, it can include a lot of other mental states, such as frustration, apathy, depression and indifference. There isn’t even agreement over whether boredom is always a low-energy, flat kind of emotion or whether feeling agitated and restless counts as boredom, too. In his book, Boredom: A Lively History, Peter Toohey at the University of Calgary, Canada, compares it to disgust – an emotion that motivates us to stay away from certain situations. ‘If disgust protects humans from infection, boredom may protect them from “infectious” social situations,’ he suggests.</p>
                  <p><b>B</b> By asking people about their experiences of boredom, Thomas Goetz and his team at the University of Konstanz in Germany have recently identified five distinct types: indifferent, calibrating, searching, reactant and apathetic. These can be plotted on a two-dimensional chart. One axis measures how positive or negative the feeling is, the other measures how aroused or agitated the person is. Intriguingly, Goetz has found that while people experience all kinds of boredom, they tend to specialise in one. Of the five types, the most damaging is ‘reactant’ boredom with its explosive combination of high arousal and negative emotion. The most useful is what Goetz calls ‘indifferent’ boredom: someone isn’t engaged in anything satisfying but still feels relaxed and calm. However, it remains to be seen whether there are any character traits that predict the kind of boredom each of us might be prone to.</p>
                  <p><b>C</b> Psychologist Sandi Mann at the University of Central Lancashire, UK, goes further. ‘All emotions are there for a reason, including boredom,’ she says. Mann has found that being bored makes us more creative. ‘We’re all afraid of being bored but in actual fact it can lead to all kinds of amazing things,’ she says. In experiments published last year, Mann found that people who had been made to feel bored by copying numbers out of the phone book for 15 minutes came up with more creative ideas about how to use a polystyrene cup than a control group. Mann concluded that a passive, boring activity is best for creativity because it allows the mind to wander. In fact, she goes so far as to suggest that we should seek out more boredom in our lives.</p>
                  <p><b>D</b> Psychologist John Eastwood at York University in Toronto, Canada, isn’t convinced. ‘If you are in a state of mind-wandering, you are not bored,’ he says. ‘In my view, by definition boredom is an undesirable state.’ That doesn’t necessarily mean that it isn’t adaptive, he adds. ‘Pain is adaptive – if we didn’t have physical pain, we would be injured all the time.’ No, what Eastwood’s team is trying to do is pinpoint exactly what boredom is. ‘If you look at the dictionary definition of boredom, you’ll see that it’s about a lack of interest, a failure to be stimulated,’ he says. For Eastwood, the central feature of boredom is a failure to put our ‘attention system’ into gear. This causes an inability to focus on anything, which makes time seem to go painfully slowly. What’s more, your efforts to improve the situation can end up making you feel worse. ‘People try to connect with the world and if they are not successful there’s that frustration and irritability,’ he says. Perhaps most worryingly, says Eastwood, repeatedly failing to engage attention can lead to a state where you don’t know what to do any more, and no longer care.</p>
                  <p><b>E</b> 
                  Eastwood's team is now trying to explore why the attention system fails. It's early days but they think that at least some of it comes down to personality. Boredom proneness has been linked with a variety of traits. People who are motivated by pleasure seem to suffer particularly badly. Other personality traits, such as curiosity, are associated with a high boredom threshold. More evidence that boredom has detrimental effects comes from studies of people who are more or less prone to boredom. It seems those who bore easily face poorer prospects in education, their career and even life in general. But of course, boredom itself cannot kill – it's the things we do to deal with it that may put us in danger. What can we do to alleviate it before it comes to that? Goetz's group has one suggestion. Working with teenagers, they found that those who 'approach' a boring situation – in other words, see that it's boring and get stuck in anyway – report less boredom than those who try to avoid it by using snacks, TV or social media for distraction.</p>
                  <p><b>F</b>Psychologist Francoise Wemelsfelder speculates that our over-connected lifestyles might even be a new source of boredom. 'In modern human society there is a lot of overstimulation but still a lot of problems finding meaning,' she says. So instead of seeking yet more mental stimulation, perhaps we should leave our phones alone, and use boredom to motivate us to engage with the world in a more meaningful way.</p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader><CardContent className="space-y-4">
                  <h3 className="font-semibold text-center">Artificial artists</h3>
                  <p>The Painting Fool is one of a growing number of computer programs which, so their makers claim, possess creative talents. Classical music by an artificial composer has had audiences enraptured, and even tricked them into believing a human was behind the score. Artworks painted by a robot have sold for thousands of dollars and been hung in prestigious galleries. And software has been built which creates art that could not have been imagined by the programmer.</p>
                  <p>Human beings are the only species to perform sophisticated creative acts regularly. This is a question at the very core of humanity,’ says Geraint Wiggins, a computational creativity researcher at Goldsmiths, University of London. ‘It scares a lot of people. They are worried that it is taking something special away from what it means to be human.’</p>
                  <p>To some extent, we are all familiar with computerised art. The question is: where does the work of the artist stop and the creativity of the computer begin? Consider one of the oldest machine artists, AARON, a robot that has had paintings exhibited in London's Tate Modern and the San Francisco Museum of Modern Art. AARON can pick up a paintbrush and paint on canvas on its own. Impressive perhaps, but it is still little more than a tool to realise the programmer's own creative ideas.</p>
                  <p>Simon Colton, the designer of the Painting Fool, is keen to make sure his creation doesn't attract the same criticism. Unlike earlier 'artists' such as Aaron, the Painting Fool only needs minimal direction and can come up with its own concepts by going online for material. The software runs its own web searches and trawls through social media sites. It is now beginning to display a kind of imagination too, creating pictures from scratch. One of its original works is a series of fuzzy landscapes, depicting trees and sky. While some might say they have a mechanical look, Colton argues that such reactions arise from people's double standards towards software-produced and human-produced art. After all, he says, consider that the Painting Fool painted the landscapes without referring to a photo. 'If a child painted a new scene from its head, you'd say it has a certain level of imagination,' he points out. 'The same should be true of a machine.' Software bugs can also lead to unexpected results. Some of the Painting Fool's paintings of a chair came out in black and white, thanks to a technical glitch. This gives the work an eerie, ghostlike quality. Human artists like the renowned Ellsworth Kelly are lauded for limiting their colour palette – so why should computers be any different?</p>
                  <p>Researchers like Colton don’t believe it is right to measure machine creativity directly to that of humans who ‘have had millennia to develop our skills’. Others, though, are fascinated by the prospect that a computer might create something as original and subtle as our best artists. So far, only one has come close. Composer David Cope invented a program called Experiments in Musical Intelligence, or EMI. Not only did EMI create compositions in Cope's style, but also that of the most revered classical composers, including Bach, Chopin and Mozart. Audiences were moved to tears, and EMI even created an opera. Not everyone was impressed however. Some, such as Wiggins, have blasted Cope's work as pseudoscience, and condemned him for his deliberately vague explanation of how the software worked. Meanwhile, Douglas Hofstadter of Indiana University said EMI created replicas which still rely completely on the original artist’s creative impulses. When audiences found out the truth they were often enraged with Cope, and one music lover even tried to punch him. Amid such controversy, Cope destroyed EMI’s vital databases.</p>
                  <p>But why did so many people love the music, yet recoil when they discovered how it was composed? A study by computer scientist David Moffat of Glasgow Caledonian University provides a clue. He asked both expert musicians and non-experts to assess six compositions. The participants weren't told beforehand whether the tunes were composed by humans or computers, but were asked to guess, and then rate how much they liked each one. People who thought the composer was a computer tended to dislike the piece more than those who believed it was human. This was true even among the experts, who might have been expected to be more objective in their analyses.</p>
                  <p>Where does this prejudice come from? Paul Bloom of Yale University has a suggestion: he reckons part of the pleasure we get from art stems from the creative process behind the work. We can give it an irresistible essence, says Bloom. Meanwhile, experiments by Justin Kruger of New York University have shown that people’s enjoyment of an artwork increases if they think more time and effort was needed to create it. Similarly, Colton thinks that when people experience art, they wonder what the artist might have been thinking or what the artist is trying to tell them. It seems obvious, therefore, that with computers producing art, this speculation is cut short – there’s nothing to explore. But as technology becomes increasingly complex, finding those greater depths in computer art could become possible. This is precisely why Colton asks the Painting Fool to tap into online social networks for its inspiration: hopefully this way it will choose themes that will already be meaningful to us.</p>
                </CardContent></Card>
              </div>
            </TextHighlighter>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-3 z-20 border-b">Questions</h2>
            <div className="lg:h-[calc(100vh-280px)] overflow-y-auto pr-2">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('section1')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 1: Q 1-13</button>
                  <button onClick={() => setActiveTab('section2')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 2: Q 14-26</button>
                  <button onClick={() => setActiveTab('section3')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'section3' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Section 3: Q 27-40</button>
                </div>
              </div>
              
              {activeTab === 'section1' && (
                <Card><CardHeader><CardTitle>Questions 1-13</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 1-7</h3><p>Complete the table below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <table className="w-full border-collapse border border-gray-300 my-4">
                        <thead><tr><th className="border border-gray-300 p-2 bg-gray-100">Section of website</th><th className="border border-gray-300 p-2 bg-gray-100">Comments</th></tr></thead>
                        <tbody>
                            <tr><td className="border border-gray-300 p-2">Database of tourism services</td><td className="border border-gray-300 p-2">
                                <ul className="list-disc pl-5">
                                    <li>easy for tourism-related businesses to get on the list</li>
                                    <li>allowed businesses to <strong>1</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('1') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || isSubmitting}/> information regularly</li>
                                    <li>provided a country-wide evaluation of businesses, including their impact on the <strong>2</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('2') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li>
                                </ul>
                            </td></tr>
                            <tr><td className="border border-gray-300 p-2">Special features on local topics</td><td className="border border-gray-300 p-2">
                                <ul className="list-disc pl-5">
                                    <li>e.g. an interview with a former sports <strong>3</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('3') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li>
                                    <li>an interactive tour of various locations used in <strong>4</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('4') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li>
                                </ul>
                            </td></tr>
                            <tr><td className="border border-gray-300 p-2">Information on driving routes</td><td className="border border-gray-300 p-2"><ul className="list-disc pl-5"><li>varied depending on the <strong>5</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('5') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li></ul></td></tr>
                            <tr><td className="border border-gray-300 p-2">Travel Planner</td><td className="border border-gray-300 p-2"><ul className="list-disc pl-5"><li>included a map showing selected places, details of public transport and local <strong>6</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('6') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li></ul></td></tr>
                            <tr><td className="border border-gray-300 p-2">'Your Words'</td><td className="border border-gray-300 p-2"><ul className="list-disc pl-5"><li>travellers could send a link to their <strong>7</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('7') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || isSubmitting}/></li></ul></td></tr>
                        </tbody>
                    </table>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 8-13</h3><p>Do the following statements agree with the information given in Reading Passage 1? Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">8</span><div className="flex-1"><p>The website www.newzealand.com aimed to provide ready-made itineraries and packages for travel companies and individual tourists.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('8') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">9</span><div className="flex-1"><p>It was found that most visitors started searching on the website by geographical location.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('9') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">10</span><div className="flex-1"><p>According to research, 26% of visitor satisfaction is related to their accommodation.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('10') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">11</span><div className="flex-1"><p>Visitors to New Zealand like to become involved in the local culture.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('11') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">12</span><div className="flex-1"><p>Visitors like staying in small hotels in New Zealand rather than in larger ones.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('12') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">13</span><div className="flex-1"><p>Many visitors feel it is unlikely that they will return to New Zealand after their visit.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('13') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section2' && (
                <Card><CardHeader><CardTitle>Questions 14-26</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 14-19</h3><p>Choose the correct heading for each paragraph from the list of headings below. Write the correct number, <strong>i-viii</strong>.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Headings</h4>
                        <p><strong>i</strong> The productive outcomes that may result from boredom</p><p><strong>ii</strong> What teachers can do to prevent boredom</p><p><strong>iii</strong> A new explanation and a new cure for boredom</p><p><strong>iv</strong> Problems with a scientific approach to boredom</p><p><strong>v</strong> A potential danger arising from boredom</p><p><strong>vi</strong> Creating a system of classification for feelings of boredom</p><p><strong>vii</strong> Age groups most affected by boredom</p><p><strong>viii</strong> Identifying those most affected by boredom</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">14</span><div className="flex-1"><p>Paragraph A</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('14') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">15</span><div className="flex-1"><p>Paragraph B</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('15') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">16</span><div className="flex-1"><p>Paragraph C</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('16') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">17</span><div className="flex-1"><p>Paragraph D</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('17') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">18</span><div className="flex-1"><p>Paragraph E</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('18') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">19</span><div className="flex-1"><p>Paragraph F</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('19') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 20-23</h3><p>Look at the following people and the list of ideas below. Match each person with the correct idea, <strong>A-E</strong>.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Ideas</h4>
                        <p><strong>A</strong> The way we live today may encourage boredom.</p><p><strong>B</strong> One sort of boredom is worse than all the others.</p><p><strong>C</strong> Levels of boredom may fall in the future.</p><p><strong>D</strong> Trying to cope with boredom can increase its negative effects.</p><p><strong>E</strong> Boredom may encourage us to avoid an unpleasant experience.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">20</span><div className="flex-1"><p>Peter Toohey</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('20') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">21</span><div className="flex-1"><p>Thomas Goetz</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('21') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('21') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['21'] || ''} onChange={(e) => handleAnswerChange('21', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">22</span><div className="flex-1"><p>John Eastwood</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('22') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('22') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['22'] || ''} onChange={(e) => handleAnswerChange('22', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">23</span><div className="flex-1"><p>Francoise Wemelsfelder</p><Input className={`mt-2 max-w-[100px] ${getAnswerStatus('23') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('23') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['23'] || ''} onChange={(e) => handleAnswerChange('23', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 24-26</h3><p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                        <h4 className="font-semibold text-center mb-4">Responses to boredom</h4>
                        <p>For John Eastwood, the central feature of boredom is that people cannot <strong>24</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('24') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('24') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['24'] || ''} onChange={(e) => handleAnswerChange('24', e.target.value)} disabled={!isTestStarted || isSubmitting}/> due to a failure in what he calls the 'attention system', and as a result they become frustrated and irritable. His team suggests that those for whom <strong>25</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('25') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || isSubmitting}/> is an important aim in life may have problems in coping with boredom, whereas those who have the characteristic of <strong>26</strong> <Input className={`inline-block w-32 ml-1 ${getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('26') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || isSubmitting}/> can generally cope with it.</p>
                    </div>
                  </div>
                </CardContent></Card>
              )}
              {activeTab === 'section3' && (
                <Card><CardHeader><CardTitle>Questions 27-40</CardTitle></CardHeader><CardContent>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 27-31</h3><p>Choose the correct letter, <strong>A, B, C</strong> or <strong>D</strong>.</p>
                    <div className="space-y-4">
                        <div className="space-y-2"><p><span className="font-semibold">27</span> What is the writer suggesting about computer-produced works in the first paragraph?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> People’s acceptance of them can vary considerably.</p><p><strong>B</strong> A great deal of progress has already been attained in this field.</p><p><strong>C</strong> The advances are not as significant as the public believes them to be.</p><p><strong>D</strong> They have had a mixed reception from artists and the public.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('27') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="space-y-2"><p><span className="font-semibold">28</span> According to Geraint Wiggins, why are many people worried by computer art?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> It is aesthetically inferior to human art.</p><p><strong>B</strong> It may ultimately supersede human art.</p><p><strong>C</strong> It undermines a fundamental human quality.</p><p><strong>D</strong> It will lead to a deterioration in human ability.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('28') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="space-y-2"><p><span className="font-semibold">29</span> What is a key difference between Aaron and the Painting Fool?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> its programmer’s background</p><p><strong>B</strong> public response to its work</p><p><strong>C</strong> the source of its subject matter</p><p><strong>D</strong> the technical standard of its output</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('29') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="space-y-2"><p><span className="font-semibold">30</span> What point does Simon Colton make in the fourth paragraph?</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> Software-produced art is often dismissed as childish and simplistic.</p><p><strong>B</strong> The same concepts of creativity should not be applied to all forms of art.</p><p><strong>C</strong> It is unreasonable to expect a machine to be as imaginative as a human being.</p><p><strong>D</strong> People tend to judge computer art and human art according to different criteria.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('30') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="space-y-2"><p><span className="font-semibold">31</span> The writer refers to the paintings of a child as an example of computer art which</p><div className="ml-6 space-y-1 text-sm"><p><strong>A</strong> achieves a particularly striking effect.</p><p><strong>B</strong> exhibits a certain level of genuine artistic skill.</p><p><strong>C</strong> closely resembles that of a well-known artist.</p><p><strong>D</strong> highlights the technical limitations of the software.</p></div><Input className={`mt-2 max-w-[100px] ml-6 ${getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('31') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 32-37</h3><p>Complete each sentence with the correct ending, <strong>A-G</strong>, below.</p>
                    <div className="bg-gray-50 p-4 rounded-lg my-4"><h4 className="font-semibold mb-3">List of Ideas</h4>
                        <p><strong>A</strong> generating work that was virtually indistinguishable from that of humans.</p><p><strong>B</strong> knowing whether it was the work of humans or software.</p><p><strong>C</strong> producing work entirely dependent on the imagination of its creator.</p><p><strong>D</strong> comparing the artistic achievements of humans and computers.</p><p><strong>E</strong> revealing the technical details of his program.</p><p><strong>F</strong> persuading the public to appreciate computer art.</p><p><strong>G</strong> discovering that it was the product of a computer program.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">32</span><p>Simon Colton says it is important to consider the long-term view when ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('32') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('32') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['32'] || ''} onChange={(e) => handleAnswerChange('32', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">33</span><p>David Cope's EMI software surprised people by ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('33') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('33') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['33'] || ''} onChange={(e) => handleAnswerChange('33', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">34</span><p>Geraint Wiggins criticised Cope for not ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('34') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('34') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['34'] || ''} onChange={(e) => handleAnswerChange('34', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">35</span><p>Douglas Hofstadter claimed that EMI was ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('35') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('35') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['35'] || ''} onChange={(e) => handleAnswerChange('35', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">36</span><p>Audiences who had listened to EMI's music became angry after ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('36') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('36') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['36'] || ''} onChange={(e) => handleAnswerChange('36', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">37</span><p>The participants in David Moffat's study had to assess music without ...</p><Input className={`mt-2 max-w-[100px] ml-auto ${getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('37') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div>
                    </div>
                  </div>
                  <div className="mb-8"><h3 className="text-lg font-semibold mb-4">Questions 38-40</h3><p>Do the following statements agree with the claims of the writer? Write <strong>YES</strong>, <strong>NO</strong>, or <strong>NOT GIVEN</strong>.</p>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-start gap-4"><span className="font-semibold">38</span><div className="flex-1"><p>Moffat’s research may help explain people’s reactions to EMI.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('38') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">39</span><div className="flex-1"><p>The non-experts in Moffat’s study all responded in a predictable way.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('39') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                        <div className="flex items-start gap-4"><span className="font-semibold">40</span><div className="flex-1"><p>Justin Kruger’s findings cast doubt on Paul Bloom’s theory about people’s prejudice towards computer art.</p><Input className={`mt-2 max-w-[150px] ${getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : getAnswerStatus('40') === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || isSubmitting} placeholder="Answer"/></div></div>
                    </div>
                  </div>
                </CardContent></Card>
              )}
            </div>
          </div>
        </div>

        {!submitted && (<div className="mt-8 text-center"><Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold" size="lg" disabled={!isTestStarted || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Button></div>)}
        
        {submitted && (
            <Card className="mt-8 bg-blue-50 border-blue-200"><CardHeader><CardTitle className="text-xl font-bold text-center">Test Results</CardTitle></CardHeader><CardContent><div className="text-center space-y-4">
                <div className="text-3xl font-bold text-blue-600">{score}/40 correct answers</div>
                <div className="text-xl">IELTS Band Score: <span className="font-bold text-green-600">{ieltsScore}</span></div>
                <div className="flex justify-center space-x-4 mt-6">
                    <Button onClick={handleReset} variant="outline">Try Again</Button>
                    <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline">{showAnswers ? 'Hide' : 'Show'} Answer Key</Button>
                </div></div></CardContent>
            </Card>
        )}

        {showAnswers && (
            <Card className="mt-8"><CardHeader><CardTitle>Answer Key</CardTitle></CardHeader><CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(correctAnswers).map(([q, a]) => (<div key={q} className="flex justify-between p-2 bg-gray-50 rounded"><span className="font-semibold">{q}:</span><span className="text-gray-800">{a}</span></div>))}
                </div>
            </CardContent></Card>
        )}

        {showResultsPopup && (
            <div className="fixed inset-0 bg-gray-500/40 bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full">
                <div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800 mb-2">Test Results</h2><div className="flex justify-center items-center space-x-8 mb-4"><div className="text-center"><div className="text-3xl font-bold text-blue-600">{score}/40</div><div className="text-sm text-gray-600">Correct Answers</div></div><div className="text-center"><div className="text-3xl font-bold text-green-600">{ieltsScore}</div><div className="text-sm text-gray-600">IELTS Band Score</div></div></div></div>
                <div className="mb-6"><h3 className="text-lg font-semibold mb-4">Answer Review</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(correctAnswers).map(qNum => {const isCorrect = checkAnswer(qNum); return (<div key={qNum} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-between mb-2"><span className="font-semibold">Question {qNum}</span><span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span></div><div className="text-sm space-y-1"><div><span className="text-gray-600">Your answer: </span><span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{answers[qNum] || '(No answer)'}</span></div><div><span className="text-gray-600">Correct answer: </span><span className="font-medium text-green-700">{correctAnswers[qNum]}</span></div></div></div>);})}</div></div>
                <div className="flex justify-center space-x-4"><Button onClick={() => setShowResultsPopup(false)} variant="outline">Close</Button><Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button></div>
            </div></div>
        )}
        
        <PageViewTracker 
          book={BOOK} 
          module="reading" 
          testNumber={TEST_NUMBER} 
        />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <TestStatistics book={BOOK} module="reading" testNumber={TEST_NUMBER} />
            <UserTestHistory book={BOOK} module="reading" testNumber={TEST_NUMBER} />
          </div>
        </div>
      </div>
    </div>
  );
}