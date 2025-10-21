'use client'

import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The diagram illustrates the manufacturing process of leather goods, showing the various stages from raw materials to finished products. Overall, there are several distinct phases involving both traditional and modern techniques to transform animal hides into quality leather items.

The process begins with the preparation of animal hides, which are first cleaned and treated to remove any remaining flesh and hair. The hides are then soaked in large vats containing lime and water solutions to soften the material and prepare it for further processing. This initial stage is crucial for ensuring the quality of the final product.

Following the cleaning phase, the hides undergo a tanning process, which is essential for preserving the leather and making it durable. The materials are treated with various chemical solutions, including chromium salts or vegetable tannins, depending on the desired characteristics of the final product. This tanning process can take several days to complete and determines the leather's color, flexibility, and longevity.

After tanning, the leather is dried and then subjected to various finishing processes. These include stretching, smoothing, and conditioning to achieve the desired texture and appearance. The leather may also be dyed to achieve specific colors and treated with protective coatings to enhance durability and water resistance.

In the final stages, the prepared leather is cut and shaped according to specific patterns for different products such as shoes, bags, belts, or jackets. Skilled craftspeople then assemble these pieces using traditional techniques like stitching and modern methods such as adhesive bonding to create the finished leather goods.

The entire process demonstrates a combination of time-honored techniques and modern technology to produce high-quality leather products.`

const task2ModelAnswer = `As children transition into adulthood, their social behavior undergoes significant transformations that reflect their cognitive, emotional, and psychological development. Understanding these changes and evaluating their positive impact is crucial for appreciating human social evolution.

The most notable differences between children's and adults' social behavior center around communication patterns, emotional regulation, and relationship dynamics. Young children tend to be more direct and spontaneous in their interactions, often expressing emotions immediately and honestly without social filtering. They form friendships quickly based on proximity and shared activities, and their social conflicts are typically resolved rapidly and forgotten easily. Children also demonstrate remarkable openness to new relationships and show little concern for social hierarchies or status differences.

In contrast, adult social behavior is characterized by greater complexity and sophistication. Adults develop advanced communication skills, including the ability to read social cues, engage in nuanced conversations, and adapt their behavior to different social contexts. They learn to regulate emotions appropriately, considering the feelings and perspectives of others before responding. Adult relationships tend to be more selective and deeper, based on shared values, interests, and mutual respect rather than mere convenience.

These changes are largely positive and necessary for functioning effectively in society. The development of emotional intelligence allows adults to navigate complex social situations, maintain professional relationships, and contribute meaningfully to their communities. Adults' ability to consider long-term consequences and think beyond immediate gratification leads to more stable relationships and better decision-making. The sophistication in communication enables collaboration, negotiation, and conflict resolution essential for societal functioning.

However, some aspects of childhood social behavior that diminish in adulthood are worth preserving. Children's natural curiosity, openness to diversity, and ability to forgive quickly are valuable traits that can enhance adult relationships and social cohesion.

In conclusion, while the transition from childhood to adult social behavior involves both gains and losses, the overall changes are predominantly positive, enabling individuals to contribute effectively to society while maintaining meaningful relationships.`

export default function BookIELTSPlus3WritingTest2() {
  const task1Question = "The diagram below show how leather goods are produced. Summarise the information by selecting and reporting the main features, and making comparisons where relevant.";

  const task2Question = "As children become adults, their social behaviour changes in some ways. What are the main differences between young children's social behaviour and that of adults? To what extent are the changes that take place good?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-3"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
