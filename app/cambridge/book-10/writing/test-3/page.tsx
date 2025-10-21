import WritingTestTemplate from '@/components/test/WritingTestTemplate'




const task1ModelAnswer = `The two bar charts illustrate the destinations of UK students who completed graduate and postgraduate degrees in 2008, excluding those who entered full-time employment.

Overall, the most popular path for both groups was to continue their education, while the least common choice was voluntary work. The patterns of destinations were broadly similar for graduates and postgraduates, although the absolute numbers were significantly higher for graduates.

For graduates, the largest group, numbering 29,665, chose to pursue further study. The next most common destination was part-time work, with 17,735 graduates. Unemployment was the third most frequent outcome, affecting 16,235 individuals. A much smaller number, only 3,500, undertook voluntary work.

A similar pattern is evident among postgraduates, though on a smaller scale. Further study was again the top choice, with 2,725 individuals. Part-time work followed with 2,535 postgraduates, and 1,625 were unemployed. As with the graduates, voluntary work was the least popular option, with only 345 postgraduates choosing this path.`

const task2ModelAnswer = `In an era of globalization, the increasing similarity of cultures, largely driven by the universal availability of consumer products, is a prominent phenomenon. This trend towards a global monoculture prompts a critical question: is this a positive or a negative development? In my view, while there are some superficial benefits, the erosion of cultural diversity is a profoundly negative development for the world.

The primary argument for this trend being positive is convenience and a sense of global interconnectedness. People can enjoy the same brands of food, clothing, and entertainment whether they are in Tokyo, Paris, or Rio de Janeiro. This shared consumer culture can create a common language and understanding, potentially breaking down some barriers between nations. Furthermore, the global market can drive competition, theoretically leading to higher quality products at lower prices for consumers everywhere.

However, these benefits are far outweighed by the significant drawbacks. The most critical loss is that of cultural identity. Local traditions, cuisines, crafts, and styles, which have evolved over centuries, are often unable to compete with the marketing power of multinational corporations. When a global coffee chain replaces a local café, it is not just a commercial transaction; it is a small erosion of a community's unique character. This homogenization leads to a less interesting and less vibrant world.

Moreover, this phenomenon often masks a form of cultural imperialism, where Western brands and values dominate, marginalizing other cultures. It also harms local economies, as profits are repatriated to corporate headquarters rather than being reinvested in the local community. The loss of local businesses leads to a loss of jobs and a decline in specialized skills.

In conclusion, while the ability to buy familiar products worldwide offers a degree of comfort and convenience, this comes at the steep price of cultural erosion and economic imbalance. The world's richness lies in its diversity, and the trend towards global similarity represents a significant loss of this heritage. Therefore, I firmly believe it is a negative development.`

   
  
export default function Book10WritingTest3() {
   const task1Question = "The charts below show what UK graduate and postgraduate students who did not go into full-time work did after leaving college in 2008. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
    
      const task2Question = "Countries are becoming more and more similar because people are able to buy the same products anywhere in the world. Do you think this is a positive or negative development?";
     
  return (
    <WritingTestTemplate
      bookNumber="10"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book10/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}

