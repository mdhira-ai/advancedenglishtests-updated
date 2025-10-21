import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The line graph displays the consumption of various energy sources in the USA from 1980, with projections extending to 2030. The data is measured in quadrillion units.

Overall, fossil fuels—namely Petrol and Oil, Coal, and Natural Gas—have been and are projected to remain the dominant sources of energy. In contrast, the three renewable and nuclear sources account for a much smaller, though generally stable or slightly increasing, proportion of total consumption.

Petrol and Oil is the most significant energy source, starting at 35 quadrillion units in 1980, dipping slightly, and then embarking on a steady upward trend. It is forecast to reach nearly 50 quadrillion units by 2030. Coal and Natural Gas have vied for the second position. Coal consumption grew steadily from about 16 units in 1980 and is projected to rise to over 30 units by 2030. Natural Gas fluctuated around 20 units for two decades before beginning a slower ascent, expected to level off at approximately 25 units.

The consumption levels for Nuclear, Solar/Wind, and Hydropower are considerably lower. All three started at a similar level of around 4 quadrillion units. Nuclear energy saw a gradual increase to about 7 units by 2005 and is predicted to continue this slow growth. Solar/Wind power also shows a slight projected increase, while Hydropower has remained the most stable and lowest of all sources.`

const task2ModelAnswer = `The steady disappearance of languages around the globe is an undeniable reality of our interconnected world. A pragmatic view suggests that this linguistic consolidation simplifies communication and is therefore not a concern. However, I strongly disagree with this perspective; I believe the extinction of any language represents an irreversible loss for humanity.

Proponents of the idea that fewer languages are better often focus on the perceived benefits of global efficiency. They argue that a world with a handful of major languages would facilitate easier international trade, diplomacy, and scientific collaboration. From this utilitarian viewpoint, linguistic diversity is an obstacle to progress, and the decline of minor languages is simply a natural outcome of globalisation.

This perspective, however, is profoundly shortsighted. A language is not merely a tool for communication; it is the repository of a culture's unique history, worldview, and knowledge. Encoded within its vocabulary and grammar are distinct ways of understanding the world. For example, many indigenous languages contain vast knowledge about local ecosystems and medicinal plants that is lost forever when the language dies. The loss of a language is therefore the loss of a unique part of our collective human heritage.

In conclusion, while the argument for a linguistically simpler world has a superficial appeal, it ignores the immense cultural and intellectual wealth that is eradicated with each language that falls silent. The preservation of linguistic diversity is not a matter of nostalgia; it is essential for maintaining different perspectives, protecting unique knowledge systems, and appreciating the rich tapestry of human culture. Therefore, the death of any language is a significant and tragic event.`


export default function Book9WritingTest4() {
      const task1Question = "The graph below gives information from a 2008 report about consumption of energy in the USA since 1980 with projections until 2030. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
   
      const task2Question = "Every year several languages die out. Some people think that this is not important because life will be easier if there are fewer languages in the world. To what extent do you agree or disagree with this opinion?";
   
  return (
    <WritingTestTemplate
      bookNumber="9"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}




