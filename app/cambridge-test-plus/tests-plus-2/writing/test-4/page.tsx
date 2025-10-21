import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The diagrams illustrate the transformation of a small fishing village into a large European tourist resort over time. Overall, the development shows a dramatic change from a traditional coastal community to a modern tourist destination with significantly expanded infrastructure and facilities.

In the original fishing village, the settlement was small and compact, centered around the harbor where fishing boats were moored. The village consisted of traditional houses clustered near the waterfront, with limited infrastructure. The surrounding area was largely undeveloped, featuring natural coastline and open spaces.

The transformation into a tourist resort brought extensive changes to both the village and its surroundings. The original harbor was expanded and modernized to accommodate larger vessels, including tourist boats and yachts. The traditional houses were either renovated or replaced with hotels and tourist accommodations. New infrastructure was added, including wider roads, parking areas, and tourist facilities.

The most significant change occurred in the surrounding area, where large hotel complexes, entertainment facilities, and recreational areas were constructed. The natural coastline was developed with beaches, promenades, and water sports facilities. Additionally, the resort now features extensive transportation links, including what appears to be an airport or major transport hub to facilitate tourist access.

This development represents a complete transformation from a small, traditional fishing community to a comprehensive tourist destination designed to accommodate large numbers of visitors.`

const task2ModelAnswer = `Music is indeed a universal phenomenon that transcends cultural and geographical boundaries, playing a significant role in human societies worldwide. While some argue that music brings only positive benefits to individuals and communities, others contend that it can have negative influences. I believe that while music predominantly has positive effects, it can occasionally have negative impacts depending on its content and context.

Those who advocate for music's purely beneficial nature have compelling arguments. Firstly, music serves as a powerful educational tool, helping children develop cognitive skills, improve memory, and enhance mathematical abilities. Research has consistently shown that musical training can improve academic performance and emotional intelligence. Secondly, music acts as a universal language that bridges cultural divides, promoting understanding and unity among diverse populations. International music festivals and collaborative projects demonstrate how music can foster global cooperation and cultural exchange. Additionally, music provides therapeutic benefits, helping people cope with stress, depression, and trauma, which is why music therapy is widely used in healthcare settings.

However, critics raise valid concerns about music's potential negative influences. Certain genres with explicit lyrics promoting violence, substance abuse, or misogyny can negatively impact impressionable listeners, particularly young people. Some studies suggest that aggressive music may contribute to antisocial behavior or desensitize individuals to violence. Furthermore, the commercial music industry can sometimes prioritize profit over artistic integrity, leading to the promotion of superficial content that may not contribute positively to society.

In my opinion, while music's potential for negative influence cannot be entirely dismissed, its benefits far outweigh its drawbacks. The key lies in promoting quality music education, encouraging critical listening skills, and ensuring that positive musical content is accessible to all. Rather than viewing music as inherently good or bad, we should focus on how it is created, distributed, and consumed.

In conclusion, music's impact on individuals and societies is predominantly positive, offering educational, cultural, and therapeutic benefits. However, society must remain vigilant about potentially harmful content while celebrating music's extraordinary capacity to enrich human experience.`

export default function BookPlus2WritingTest4() {
  const task1Question = "The diagrams below show the development of a small fishing village and its surrounding area into a large European tourist resort. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Music is played in every society and culture in the world today. Some people think that music brings only benefits to individuals and societies. Others, however, think that music can have a negative influence on both. Discuss both these views and give your own opinion.";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-2"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
