import WritingTestTemplate from '@/components/test/WritingTestTemplate'

  
 
const task1ModelAnswer = `The line graph compares the average carbon dioxide emissions per person in four European countries—the United Kingdom, Sweden, Italy, and Portugal—over a forty-year period from 1967 to 2007.

Overall, the data shows a clear downward trend in CO2 emissions for the UK and Sweden, whereas Italy and Portugal experienced a consistent increase. Despite its decline, the United Kingdom remained one of the highest emitters throughout the period.

In 1967, the UK had the highest emissions, starting at nearly 11 metric tonnes per person. This figure gradually decreased to approximately 9 tonnes by 2007. Sweden's emissions followed a more dramatic path, peaking at over 10 tonnes in 1977 before falling sharply to around 5.5 tonnes by the end of the period.

In contrast, both Italy and Portugal saw their per capita emissions rise. Italy began at just over 4 tonnes and climbed steadily to nearly 8 tonnes by 2007, surpassing Sweden's emissions around 1987. Portugal started with the lowest emissions, just over 1 tonne, but experienced significant growth, more than tripling its output to around 5.5 tonnes by 2007, eventually matching the level of Sweden.`

const task2ModelAnswer = `The motivations behind learning a foreign language are diverse and often debated. One perspective posits that the primary, and perhaps only, reason is for practical purposes such as travel and work. An alternative view holds that there are numerous other valid reasons for language acquisition. This essay will discuss both viewpoints, ultimately arguing that while practical motivations are significant, the non-utilitarian reasons are equally, if not more, valuable.

The view that language learning is primarily for travel or employment is understandable in our globalized world. Proficiency in a foreign language can unlock significant career opportunities, enabling individuals to work for multinational corporations or in international relations. Similarly, for avid travelers, being able to communicate in the local tongue enriches the experience, transforming a tourist into a more engaged visitor. This practical approach sees language as a tool, a means to an end for achieving specific professional or personal goals.

However, to limit the purpose of learning a language to these utilitarian motives is to overlook a wealth of other profound benefits. One of the most important of these is cultural understanding. Language is the key that unlocks a culture's literature, music, humour, and worldview. Learning another language allows one to see the world from a different perspective, fostering empathy and breaking down ethnocentric barriers. For instance, studying Japanese provides insights into concepts like 'wabi-sabi' that have no direct equivalent in English and reveal a different way of appreciating aesthetics.

Furthermore, there are significant cognitive advantages associated with bilingualism. Research has shown that it can improve problem-solving skills, creativity, and mental flexibility. It can even delay the onset of age-related cognitive decline. These benefits are intrinsic and enhance a person's life regardless of whether they ever travel or use the language for work.

In conclusion, while the practical need for communication in work and travel is a powerful motivator for language learning, it is by no means the only reason. The intellectual and cultural enrichment that comes from engaging with another language offers deep, lifelong benefits that are valuable in their own right. Therefore, I believe the reasons for learning a language extend far beyond mere utility.`

  
export default function Book11WritingTest3() {

    const task1Question = "The graph below shows average carbon dioxide (CO2) emissions per person in the United Kingdom, Sweden, Italy and Portugal between 1967 and 2007. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
     
    const task2Question = "Some people say that the only reason for learning a foreign language is in order to travel to or work in a foreign country. Others say that these are not the only reasons why someone should learn a foreign language. Discuss both these views and give your own opinion.";
      
  return (
    <WritingTestTemplate
      bookNumber="11"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


