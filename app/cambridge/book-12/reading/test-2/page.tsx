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

export default function Book12ReadingTest6() {
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
  
  const correctAnswers = {
    '1': 'A', '2': 'B', '3': 'H', '4': 'D', '5': 'B', '6': 'C', '7': 'G', '8': 'B', '9': 'A',
    '10': 'D/E', '11': 'D/E',
    '12': 'C/D', '13': 'C/D',
    '14': 'iv', '15': 'vi', '16': 'viii', '17': 'v', '18': 'i', '19': 'vii', '20': 'iii',
    '21': 'TRUE', '22': 'FALSE', '23': 'FALSE', '24': 'NOT GIVEN',
    '25': 'rubber', '26': 'farmer',
    '27': 'eye movements', '28': 'language co-activation', '29': 'Stroop Task',
    '30': 'conflict management', '31': 'cognitive control',
    '32': 'YES', '33': 'NOT GIVEN', '34': 'NO', '35': 'NO', '36': 'NOT GIVEN',
    '37': 'D', '38': 'G', '39': 'B', '40': 'C'
  };

  const checkAnswer = (questionNumber: string, currentAnswers = answers): boolean => {
    const correctAnswer = correctAnswers[questionNumber as keyof typeof correctAnswers]
    const userAnswer = currentAnswers[questionNumber] || ''
    
    if (!userAnswer || userAnswer.trim() === '') {
      return false
    }
    
    return checkAnswerWithMatching(userAnswer, correctAnswer, questionNumber)
  }

  const calculateScore = () => {
    let correctCount = 0
    const checkedMulti = new Set<string>()

    for (const questionNumber of Object.keys(correctAnswers)) {
      const qNum = parseInt(questionNumber);
      
      if (qNum >= 10 && qNum <= 13) {
        const pairKey = (qNum <= 11) ? '10-11' : '12-13';
        if (checkedMulti.has(pairKey)) continue;

        const ans1 = answers[pairKey.split('-')[0]]?.toUpperCase() || '';
        const ans2 = answers[pairKey.split('-')[1]]?.toUpperCase() || '';
        const [corr1, corr2] = correctAnswers[questionNumber as keyof typeof correctAnswers].split('/');

        if (ans1 && ans2 && ans1 !== ans2) {
          if ((ans1 === corr1 && ans2 === corr2) || (ans1 === corr2 && ans2 === corr1)) {
            correctCount += 2;
          } else if (ans1 === corr1 || ans1 === corr2 || ans2 === corr1 || ans2 === corr2) {
            correctCount += 1;
          }
        } else if (ans1 && (ans1 === corr1 || ans1 === corr2)) {
          correctCount += 1;
        } else if (ans2 && (ans2 === corr1 || ans2 === corr2)) {
          correctCount += 1;
        }
        checkedMulti.add(pairKey);
      } else {
        if (checkAnswer(questionNumber, answers)) {
          correctCount++
        }
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
        testNumber: 6,
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


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cambridge/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reading Tests
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cambridge IELTS 12 - Reading Test 6</h1>
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
                 <Card>
                    <CardHeader><CardTitle>READING PASSAGE 1</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <h3 className="font-bold text-lg text-center">The risks agriculture faces in developing countries</h3>
                      <p><b>A</b> Two things distinguish food production from all other productive activities: first, every single person needs food each day and has a right to it; and second, it is hugely dependent on nature. These two unique aspects, one political, the other natural, make food production highly vulnerable and different from any other business. At the same time, cultural values are highly entrenched in food and agricultural systems worldwide.</p>
                      <p><b>B</b> Farmers everywhere face major risks, including extreme weather, long-term climate change, and price volatility in input and product markets. However, smallholder farmers in developing countries must in addition deal with adverse environments, both natural, in terms of soil quality, rainfall, etc., and human, in terms of infrastructure, financial systems, markets, knowledge and technology. Counter-intuitively, hunger is prevalent among many smallholder farmers in the developing world.</p>
                      <p><b>C</b> Participants in the online debate argued that our biggest challenge is to address the underlying causes of the agricultural system’s inability to ensure sufficient food for all, and they identified as drivers of this problem our dependency on fossil fuels and unsupportive government policies.</p>
                      <p><b>D</b> On the question of mitigating the risks farmers face, most essayists called for greater state intervention. In his essay, Kanayo F. Nwanze, President of the International Fund for Agricultural Development, argued that governments can significantly reduce risks for farmers by providing basic services like roads to get produce more efficiently to markets, or water and food storage facilities to reduce losses. Sophia Murphy, senior advisor to the Institute for Agriculture and Trade Policy, suggested that the procurement and holding of stocks by governments can also help mitigate wild swings in food prices by alleviating uncertainties about market supply.</p>
                      <p><b>E</b> Shenggen Fan, Director General of the International Food Policy Research Institute, held up social safety nets and public welfare programmes in Ethiopia, Brazil and Mexico as valuable ways to address poverty among farming families and reduce their vulnerability to agriculture shocks. However, some commentators responded that cash transfers to poor families do not necessarily translate into increased food security, as these programmes do not always strengthen food production or raise incomes. Regarding state subsidies for agriculture, Rokeya Kabir, Executive Director of Bangladesh Nari Progati Sangha, commented in her essay that these ‘have not compensated for the stranglehold exercised by private traders. In fact, studies show that sixty percent of beneficiaries of subsidies are not poor, but rich landowners and non-farmer traders.’</p>
                      <p><b>F</b> Nwanze, Murphy and Fan argued that private risk management tools, like private insurance, commodity futures markets, and rural finance can help small-scale producers mitigate risk and allow for investment in improvements. Kabir warned that financial support schemes often encourage the adoption of high-input agricultural practices, which in the medium term may raise production costs beyond the value of their harvests. Murphy noted that when futures markets become excessively financialised they can contribute to short-term price volatility, which increases farmers’ food insecurity. Many participants and commentators emphasised that greater transparency in markets is needed to mitigate the impact of volatility, and make evident whether adequate stocks and supplies are available. Others contended that agribusiness companies should be held responsible for paying for negative side effects.</p>
                      <p><b>G</b> Many essayists mentioned climate change and its consequences for small-scale agriculture. Fan explained that ‘in addition to reducing crop yields, climate change increases the magnitude and the frequency of extreme weather events, which increase smallholder vulnerability.’ The growing unpredictability of weather patterns increases farmers’ difficulty in managing weather-related risks. According to this author, one solution would be to develop crop varieties that are more resilient to new climate trends and extreme weather patterns. Accordingly, Pat Mooney, co-founder and executive director of the ETC Group, suggested that ‘if we are to survive climate change, we must adopt policies that let peasants diversify the plant and animal species and varieties/breeds that make up our menus.’</p>
                      <p><b>H</b> Some participating authors and commentators argued in favour of community-based and autonomous risk management strategies through collective action groups, co-operatives or producers’ groups. Such groups enhance market opportunities for small-scale producers, reduce marketing costs and synchronise buying and selling with seasonal price conditions. According to Murphy, ‘collective action offers an important way for farmers to strengthen their political and economic bargaining power, and to reduce their business risks.’ One commentator, Giel Ton, warned that collective action does not come as a free good. It takes time, effort and money to organise, build trust and to experiment. Others, like Marcel Vernooij and Marcel Beukeboom, suggested that in order to ‘apply what we already know’, all stakeholders, including business, government, scientists and civil society, must work together, starting at the beginning of the value chain.</p>
                      <p><b>I</b> Some participants explained that market price volatility is often worsened by the presence of intermediary purchasers who, taking advantage of farmers’ vulnerability, dictate prices. One commentator suggested farmers can gain greater control over prices and minimise price volatility by selling directly to consumers. Similarly, Sonali Bisht, founder and advisor to the Institute of Himalayan Environmental Research and Education (INHERE), India, wrote that community-supported agriculture, where consumers invest in local farmers by subscription and guarantee producers a fair price, is a risk-sharing model worth more attention. Direct food distribution systems not only encourage small-scale agriculture but also give consumers more control over the food they consume, she wrote.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>READING PASSAGE 2</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <h3 className="font-bold text-lg text-center">The Lost City</h3>
                      <p><b>A</b> When the US explorer and academic Hiram Bingham arrived in South America in 1911, he was ready for what was to be the greatest achievement of his life: the exploration of the remote hinterland to the west of Cusco, the old capital of the Inca empire in the Andes mountains of Peru. His goal was to locate the remains of a city called Vitcos, the last capital of the Inca civilisation. Cusco lies on a high plateau at an elevation of more than 3,000 metres, and Bingham’s plan was to descend from this plateau along the valley of the Urubamba river, which takes a circuitous route down to the Amazon and passes through an area of dramatic canyons and mountain ranges.</p>
                      <p><b>B</b> When Bingham and his team set off down the Urubamba in late July, they had an advantage over travellers who had preceded them: a track had recently been blasted down the valley canyon to enable rubber to be brought up by mules from the jungle. Almost all previous travellers had left the river at Ollantaytambo and taken a high pass across the mountains to rejoin the river lower down, thereby cutting a substantial corner, but also therefore never passing through the area around Machu Picchu.</p>
                      <p><b>C</b> On 24 July they were a few days into their descent of the valley. The day began slowly, with Bingham trying to arrange sufficient mules for the next stage of the trek. His companions showed no interest in accompanying him up the nearby hill to see some ruins that a local farmer, Melchor Arteaga, had told them about the night before. The morning was dull and damp, and Bingham also seems to have been less than keen on the prospect of climbing the hill. In his book Lost City of the Incas, he relates that he made the ascent without having the least expectation that he would find anything at the top.</p>
                      <p><b>D</b> Bingham writes about the approach in vivid style in his book. First, as he climbs up the hill, he describes the ever-present possibility of deadly snakes, ‘capable of making considerable springs when in pursuit of their prey’; not that he sees any. Then there’s a sense of mounting discovery as he comes across great sweeps of terraces, then a mausoleum, followed by monumental staircases and, finally, the grand ceremonial buildings of Machu Picchu. ‘It seemed like an unbelievable dream ... the sight held me spellbound ...’ he wrote.</p>
                      <p><b>E</b> We should remember, however, that Lost City of the Incas is a work of hindsight, not written until 1948, many years after his journey. His journal entries of the time reveal a much more gradual appreciation of his achievement. He spent the afternoon at the ruins noting down the dimensions of some of the buildings, then descended and rejoined his companions, to whom he seems to have said little about his discovery. At this stage, Bingham didn’t realise the extent or the importance of the site, nor did he realise what use he could make of the discovery.</p>
                      <p><b>F</b> However, soon after returning it occurred to him that he could make a name for himself from this discovery. When he came to write the National Geographic magazine article that broke the story to the world in April 1913, he knew he had to produce a big idea. He wondered whether it could have been the birthplace of the very first Inca, Manco the Great, and whether it could also have been what chroniclers described as ‘the last city of the Incas’. This term refers to Vilcabamba, the settlement where the Incas had fled from Spanish invaders in the 1530s. Bingham made desperate attempts to prove this belief for nearly 40 years. Sadly, his vision of the site as both the beginning and end of the Inca civilisation, while a magnificent one, is inaccurate. We now know that Vilcabamba actually lies 65 kilometres away in the depths of the jungle.</p>
                      <p><b>G</b> One question that has perplexed visitors, historians and archaeologists alike ever since Bingham, is why the site seems to have been abandoned before the Spanish Conquest. There are no references to it by any of the Spanish chroniclers – and if they had known of its existence so close to Cusco they would certainly have come in search of gold. An idea which has gained wide acceptance over the past few years is that Machu Picchu was a moya, a country estate built by an Inca emperor to escape the cold winters of Cusco, where the elite could enjoy monumental architecture and spectacular views. Furthermore, the particular architecture of Machu Picchu suggests that it was constructed at the time of the greatest of all the Incas, the emperor Pachacuti (c. 1438–71). By custom, Pachacuti’s descendants built other similar estates for their own use, and so Machu Picchu would have been abandoned after his death, some 50 years before the Spanish Conquest.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>READING PASSAGE 3</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <h3 className="font-bold text-lg text-center">The Benefits of Being Bilingual</h3>
                      <p><b>A</b> According to the latest figures, the majority of the world’s population is now bilingual or multilingual, having grown up speaking two or more languages. In the past, such children were considered to be at a disadvantage compared with their monolingual peers. Over the past few decades, however, technological advances have allowed researchers to look more deeply at how bilingualism interacts with and changes the cognitive and neurological systems, thereby identifying several clear benefits of being bilingual.</p>
                      <p><b>B</b> Research shows that when a bilingual person uses one language, the other is active at the same time. When we hear a word, we don’t hear the entire word all at once: the sounds arrive in sequential order. Long before the word is finished, the brain’s language system begins to guess what that word might be. If you hear ‘can’, you will likely activate words like ‘candy’ and ‘candle’ as well, at least during the earlier stages of word recognition. For bilingual people, this activation is not limited to a single language; auditory input activates corresponding words regardless of the language to which they belong. Some of the most compelling evidence for this phenomenon, called ‘language co-activation’, comes from studying eye movements. A Russian-English bilingual asked to ‘pick up a marker’ from a set of objects would look more at a stamp than someone who doesn’t know Russian, because the Russian word for ‘stamp’, marka, sounds like the English word he or she heard, ‘marker’. In cases like this, language co-activation occurs because what the listener hears could map onto words in either language.</p>
                      <p><b>C</b> Having to deal with this persistent linguistic competition can result in difficulties, however. For instance, knowing more than one language can cause speakers to name pictures more slowly, and can increase ‘tip-of-the-tongue states’, when you can almost, but not quite, bring a word to mind. As a result, the constant juggling of two languages creates a need to control how much a person accesses a language at any given time. For this reason, bilingual people often perform better on tasks that require conflict management. In the classic Stroop Task, people see a word and are asked to name the colour of the word’s font. When the colour and the word match (i.e., the word ‘red’ printed in red), people correctly name the colour more quickly than when the colour and the word don’t match (i.e., the word ‘red’ printed in blue). This occurs because the word itself (‘red’) and its font colour (blue) conflict. Bilingual people often excel at tasks such as this, which tap into the ability to ignore competing perceptual information and focus on the relevant aspects of the input. Bilinguals are also better at switching between two tasks; for example, when bilinguals have to switch from categorizing objects by colour (red or green)</p>
                      <p><b>D</b> to categorizing them by shape (circle or triangle), they do so more quickly than monolingual people, reflecting better cognitive control when having to make rapid changes of strategy. It also seems that the neurological roots of the bilingual advantage extend to brain areas more traditionally associated with sensory processing. When monolingual and bilingual adolescents listen to simple speech sounds without any intervening background noise, they show highly similar brain stem responses. When researchers play the same sound to both groups in the presence of background noise, however, the bilingual listeners’ neural response is considerably larger, reflecting better encoding of the sound’s fundamental frequency, a feature of sound closely related to pitch perception.</p>
                      <p><b>E</b> Such improvements in cognitive and sensory processing may help a bilingual person to process information in the environment, and help explain why bilingual adults acquire a third language better than monolingual adults master a second language. This advantage may be rooted in the skill of focussing on information about the new language while reducing interference from the languages they already know.</p>
                      <p><b>F</b> Research also indicates that bilingual experience may help to keep the cognitive mechanisms sharp by recruiting alternate brain networks to compensate for those that become damaged during aging. Older bilinguals enjoy improved memory relative to monolingual people, which can lead to real-world health benefits. In a study of over 200 patients with Alzheimer’s disease, a degenerative brain disease, bilingual patients reported showing initial symptoms of the disease an average of five years later than monolingual patients. In a follow-up study, researchers compared the brains of bilingual and monolingual patients matched on the severity of Alzheimer’s symptoms. Surprisingly, the bilinguals’ brains had more physical signs of disease than their monolingual counterparts, even though their outward behaviour and abilities were the same. If the brain is an engine, bilingualism may help it to go farther on the same amount of fuel.</p>
                      <p><b>G</b> Furthermore, the benefits associated with bilingual experience seem to start very early. In one study, researchers taught seven-month-old babies growing up in monolingual or bilingual homes that when they heard a tinkling sound, a puppet appeared on one side of a screen. Halfway through the study, the puppet began appearing on the opposite side of the screen. In order to get a reward, the infants had to adjust the rule they’d learned; only the bilingual babies were able to successfully learn the new rule. This suggests that for very young children, as well as for older people, navigating a multilingual environment imparts advantages that transfer far beyond language.</p>
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
                      <h3 className="font-semibold text-lg mb-4">Questions 1-3</h3>
                      <p className="mb-4">Which paragraph contains the following information?</p>
                      <div className="space-y-3">
                         <p><b>1</b> a reference to characteristics that only apply to food production <Input value={answers['1'] || ''} onChange={(e) => handleAnswerChange('1', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('1') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('1') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['1']})</span>}</p>
                         <p><b>2</b> a reference to challenges faced only by farmers in certain parts of the world <Input value={answers['2'] || ''} onChange={(e) => handleAnswerChange('2', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('2') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('2') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['2']})</span>}</p>
                         <p><b>3</b> a reference to difficulties in bringing about co-operation between farmers <Input value={answers['3'] || ''} onChange={(e) => handleAnswerChange('3', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('3') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('3') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['3']})</span>}</p>
                      </div>
                    </div>
                    <hr />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 4-9</h3>
                      <p className="mb-4">Match each statement with the correct person, A-G.</p>
                       <div className="border p-4 rounded-md mb-4 bg-slate-50">
                            <h4 className="font-bold mb-2">List of People</h4>
                            <ul className="list-none text-sm space-y-1">
                                <li><b>A</b> Kanayo F. Nwanze</li>
                                <li><b>B</b> Sophia Murphy</li>
                                <li><b>C</b> Shenggen Fan</li>
                                <li><b>D</b> Rokeya Kabir</li>
                                <li><b>E</b> Pat Mooney</li>
                                <li><b>F</b> Giel Ton</li>
                                <li><b>G</b> Sonali Bisht</li>
                            </ul>
                        </div>
                      <div className="space-y-3">
                         <p><b>4</b> Financial assistance from the government does not always go to the farmers who most need it. <Input value={answers['4'] || ''} onChange={(e) => handleAnswerChange('4', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('4') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('4') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['4']})</span>}</p>
                         <p><b>5</b> Farmers can benefit from collaborating as a group. <Input value={answers['5'] || ''} onChange={(e) => handleAnswerChange('5', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('5') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('5') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['5']})</span>}</p>
                         <p><b>6</b> Financial assistance from the government can improve the standard of living of farmers. <Input value={answers['6'] || ''} onChange={(e) => handleAnswerChange('6', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('6') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('6') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['6']})</span>}</p>
                         <p><b>7</b> Farmers may be helped if there is financial input by the same individuals who buy from them. <Input value={answers['7'] || ''} onChange={(e) => handleAnswerChange('7', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('7') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('7') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['7']})</span>}</p>
                         <p><b>8</b> Governments can help to reduce variation in prices. <Input value={answers['8'] || ''} onChange={(e) => handleAnswerChange('8', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('8') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('8') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['8']})</span>}</p>
                         <p><b>9</b> Improvements to infrastructure can have a major impact on risk for farmers. <Input value={answers['9'] || ''} onChange={(e) => handleAnswerChange('9', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('9') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('9') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['9']})</span>}</p>
                      </div>
                    </div>
                    <hr/>
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 10 and 11</h3>
                      <p className="mb-4">Choose <b>TWO</b> letters, A–E.</p>
                      <p className="mb-4"><i>Write the correct letters in boxes 10 and 11 on your answer sheet.</i></p>
                      <p className="mb-4">Which <b>TWO</b> problems are mentioned which affect farmers with small farms in developing countries?</p>
                      <div className="space-y-2 ml-4">
                        <p><b>A</b> lack of demand for locally produced food</p>
                        <p><b>B</b> lack of irrigation programmes</p>
                        <p><b>C</b> being unable to get insurance</p>
                        <p><b>D</b> the effects of changing weather patterns</p>
                        <p><b>E</b> having to sell their goods to intermediary buyers</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-4">
                          <label className="font-semibold">10:</label>
                          <Input placeholder="Enter letter" value={answers['10'] || ''} onChange={(e) => handleAnswerChange('10', e.target.value)} disabled={!isTestStarted || submitted} className={`w-20 ${submitted ? (getAnswerStatus('10') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}/>
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="font-semibold">11:</label>
                          <Input placeholder="Enter letter" value={answers['11'] || ''} onChange={(e) => handleAnswerChange('11', e.target.value)} disabled={!isTestStarted || submitted} className={`w-20 ${submitted ? (getAnswerStatus('11') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}/>
                        </div>
                      </div>
                      {submitted && (getAnswerStatus('10') === 'incorrect' || getAnswerStatus('11') === 'incorrect') && <p className="text-sm text-green-600 mt-1">Correct answers: D, E (any order)</p>}
                    </div>
                    <hr/>
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 12 and 13</h3>
                      <p className="mb-4">Choose <b>TWO</b> letters, A–E.</p>
                      <p className="mb-4"><i>Write the correct letters in boxes 12 and 13 on your answer sheet.</i></p>
                      <p className="mb-4">Which <b>TWO</b> actions are recommended for improving conditions for farmers?</p>
                      <div className="space-y-2 ml-4">
                        <p><b>A</b> reducing the size of food stocks</p>
                        <p><b>B</b> attempting to ensure that prices rise at certain times of the year</p>
                        <p><b>C</b> organising co-operation between a wide range of interested parties</p>
                        <p><b>D</b> encouraging consumers to take a financial stake in farming</p>
                        <p><b>E</b> making customers aware of the reasons for changing food prices</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-4">
                          <label className="font-semibold">12:</label>
                          <Input placeholder="Enter letter" value={answers['12'] || ''} onChange={(e) => handleAnswerChange('12', e.target.value)} disabled={!isTestStarted || submitted} className={`w-20 ${submitted ? (getAnswerStatus('12') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}/>
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="font-semibold">13:</label>
                          <Input placeholder="Enter letter" value={answers['13'] || ''} onChange={(e) => handleAnswerChange('13', e.target.value)} disabled={!isTestStarted || submitted} className={`w-20 ${submitted ? (getAnswerStatus('13') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}/>
                        </div>
                      </div>
                      {submitted && (getAnswerStatus('12') === 'incorrect' || getAnswerStatus('13') === 'incorrect') && <p className="text-sm text-green-600 mt-1">Correct answers: C, D (any order)</p>}
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
                    <h3 className="font-semibold text-lg mb-4">Questions 14-20</h3>
                    <p className="mb-4">Choose the correct heading for each paragraph from the list of headings below.</p>
                     <div className="border p-4 rounded-md mb-4 bg-slate-50">
                        <h4 className="font-bold mb-2">List of Headings</h4>
                        <ul className="list-roman list-inside text-sm">
                          <li>i. Different accounts of the same journey</li>
                          <li>ii. Bingham gains support</li>
                          <li>iii. A common belief</li>
                          <li>iv. The aim of the trip</li>
                          <li>v. A dramatic description</li>
                          <li>vi. A new route</li>
                          <li>vii. Bingham publishes his theory</li>
                          <li>viii. Bingham’s lack of enthusiasm</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                       <p><b>14</b> Paragraph A <Input value={answers['14'] || ''} onChange={(e) => handleAnswerChange('14', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('14') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('14') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['14']})</span>}</p>
                       <p><b>15</b> Paragraph B <Input value={answers['15'] || ''} onChange={(e) => handleAnswerChange('15', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('15') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('15') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['15']})</span>}</p>
                       <p><b>16</b> Paragraph C <Input value={answers['16'] || ''} onChange={(e) => handleAnswerChange('16', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('16') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('16') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['16']})</span>}</p>
                       <p><b>17</b> Paragraph D <Input value={answers['17'] || ''} onChange={(e) => handleAnswerChange('17', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('17') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('17') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['17']})</span>}</p>
                       <p><b>18</b> Paragraph E <Input value={answers['18'] || ''} onChange={(e) => handleAnswerChange('18', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('18') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('18') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['18']})</span>}</p>
                       <p><b>19</b> Paragraph F <Input value={answers['19'] || ''} onChange={(e) => handleAnswerChange('19', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('19') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('19') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['19']})</span>}</p>
                       <p><b>20</b> Paragraph G <Input value={answers['20'] || ''} onChange={(e) => handleAnswerChange('20', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('20') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('20') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['20']})</span>}</p>
                    </div>
                  </div>
                  <hr />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Questions 21-24</h3>
                    <p className="mb-4">Do the following statements agree with the information given in Reading Passage 2?</p>
                    <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                      <p className="font-semibold">In boxes 21-24 on your answer sheet, write</p>
                      <p className="mt-2">
                        <span className="font-semibold">TRUE</span> if the statement agrees with the information<br/>
                        <span className="font-semibold">FALSE</span> if the statement contradicts the information<br/>
                        <span className="font-semibold">NOT GIVEN</span> if there is no information on this
                      </p>
                    </div>
                    <div className="space-y-4">
                      {['21', '22', '23', '24'].map(qNum => {
                          const questions: Record<string, string> = {
                            '21': 'Bingham went to South America in search of an Inca city.',
                            '22': 'Bingham chose a particular route down the Urubamba valley because it was the most common route used by travellers.',
                            '23': 'Bingham understood the significance of Machu Picchu as soon as he saw it.',
                            '24': 'Bingham returned to Machu Picchu in order to find evidence to support his theory.',
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
                  <hr/>
                   <div>
                      <h3 className="font-semibold text-lg mb-4">Questions 25-26</h3>
                      <p className="mb-4">Complete the sentences below. Choose <b>ONE WORD ONLY</b> from the passage for each answer.</p>
                      <div className="space-y-3">
                        <p><b>25</b> The track that took Bingham down the Urubamba valley had been created for the transportation of <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('25') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['25'] || ''} onChange={(e) => handleAnswerChange('25', e.target.value)} disabled={!isTestStarted || submitted} />. {submitted && getAnswerStatus('25') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['25']})</span>}</p>
                        <p><b>26</b> Bingham found out about the ruins of Machu Picchu from a <Input className={`inline-block w-32 ml-1 mr-1 ${submitted ? (getAnswerStatus('26') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['26'] || ''} onChange={(e) => handleAnswerChange('26', e.target.value)} disabled={!isTestStarted || submitted} /> in the Urubamba valley. {submitted && getAnswerStatus('26') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['26']})</span>}</p>
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
                        <h3 className="font-semibold text-lg mb-4">Questions 27-31</h3>
                        <p className="mb-4">Complete the table below. Choose <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.</p>
                        <table className="w-full border-collapse border">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Test</th>
                                    <th className="border p-2 text-left">Findings</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border p-2">Observing the <b>27</b> <Input className={`inline-block w-40 ${submitted ? (getAnswerStatus('27') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['27'] || ''} onChange={(e) => handleAnswerChange('27', e.target.value)} disabled={!isTestStarted || submitted} /> of Russian-English bilingual people when asked to select certain objects</td>
                                    <td className="border p-2">Bilingual people engage both languages simultaneously: a mechanism known as <b>28</b> <Input className={`inline-block w-40 ${submitted ? (getAnswerStatus('28') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['28'] || ''} onChange={(e) => handleAnswerChange('28', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                                </tr>
                                 <tr>
                                    <td className="border p-2">A test called the <b>29</b> <Input className={`inline-block w-40 ${submitted ? (getAnswerStatus('29') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['29'] || ''} onChange={(e) => handleAnswerChange('29', e.target.value)} disabled={!isTestStarted || submitted} />, focusing on naming colours</td>
                                    <td className="border p-2">Bilingual people are more able to handle tasks involving a skill called <b>30</b> <Input className={`inline-block w-40 ${submitted ? (getAnswerStatus('30') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['30'] || ''} onChange={(e) => handleAnswerChange('30', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                                </tr>
                                <tr>
                                    <td className="border p-2">A test involving switching between tasks</td>
                                    <td className="border p-2">When changing strategies, bilingual people have superior <b>31</b> <Input className={`inline-block w-40 ${submitted ? (getAnswerStatus('31') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} value={answers['31'] || ''} onChange={(e) => handleAnswerChange('31', e.target.value)} disabled={!isTestStarted || submitted} /></td>
                                </tr>
                            </tbody>
                        </table>
                        {submitted && ['27','28','29','30', '31'].some(q => getAnswerStatus(q) === 'incorrect') && (
                        <div className="text-sm text-green-600 mt-2">
                            Correct answers: 
                            {getAnswerStatus('27') === 'incorrect' && ` 27. ${correctAnswers['27']}`}
                            {getAnswerStatus('28') === 'incorrect' && ` 28. ${correctAnswers['28']}`}
                            {getAnswerStatus('29') === 'incorrect' && ` 29. ${correctAnswers['29']}`}
                            {getAnswerStatus('30') === 'incorrect' && ` 30. ${correctAnswers['30']}`}
                            {getAnswerStatus('31') === 'incorrect' && ` 31. ${correctAnswers['31']}`}
                        </div>
                        )}
                    </div>
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 32-36</h3>
                        <p className="mb-4">Do the following statements agree with the claims of the writer in Reading Passage 3?</p>
                        <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                          <p className="font-semibold">In boxes 32-36 on your answer sheet, write</p>
                          <p className="mt-2">
                            <span className="font-semibold">YES</span> if the statement agrees with the claims of the writer<br/>
                            <span className="font-semibold">NO</span> if the statement contradicts the claims of the writer<br/>
                            <span className="font-semibold">NOT GIVEN</span> if it is impossible to say what the writer thinks about this
                          </p>
                        </div>
                        <div className="space-y-4">
                           {['32', '33', '34', '35', '36'].map(qNum => {
                            const questions: Record<string, string> = {
                                '32': 'Attitudes towards bilingualism have changed in recent years.',
                                '33': 'Bilingual people are better than monolingual people at guessing correctly what words are before they are finished.',
                                '34': 'Bilingual people consistently name images faster than monolingual people.',
                                '35': 'Bilingual people’s brains process single sounds more efficiently than monolingual people in all situations.',
                                '36': 'Fewer bilingual people than monolingual people suffer from brain disease in old age.'
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
                    <hr />
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Questions 37-40</h3>
                        <p className="mb-4">Which paragraph contains the following information?</p>
                        <div className="space-y-3">
                           <p><b>37</b> an example of how bilingual and monolingual people’s brains respond differently to a certain type of non-verbal auditory input <Input value={answers['37'] || ''} onChange={(e) => handleAnswerChange('37', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('37') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('37') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['37']})</span>}</p>
                           <p><b>38</b> a demonstration of how a bilingual upbringing has benefits even before we learn to speak <Input value={answers['38'] || ''} onChange={(e) => handleAnswerChange('38', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('38') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('38') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['38']})</span>}</p>
                           <p><b>39</b> a description of the process by which people identify words that they hear <Input value={answers['39'] || ''} onChange={(e) => handleAnswerChange('39', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('39') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('39') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['39']})</span>}</p>
                           <p><b>40</b> reference to some negative consequences of being bilingual <Input value={answers['40'] || ''} onChange={(e) => handleAnswerChange('40', e.target.value)} disabled={!isTestStarted || submitted} className={`inline-block w-20 ml-1 ${submitted ? (getAnswerStatus('40') === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} /> {submitted && getAnswerStatus('40') === 'incorrect' && <span className="text-sm text-green-600 ml-2">(Correct: {correctAnswers['40']})</span>}</p>
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
          testNumber={6} 
        />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <TestStatistics book="book-12" module="reading" testNumber={6} />
            <UserTestHistory book="book-12" module="reading" testNumber={6} />
          </div>
        </div>

      </div>
    </div>
  )
}