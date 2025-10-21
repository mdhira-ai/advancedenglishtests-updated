import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The four pie charts compare the age distribution of the populations in Yemen and Italy in the year 2000 and provide projections for 2050.

Overall, the data reveals a stark contrast between the two countries, with Yemen having a much younger population than Italy in both years. The projections indicate that while both populations are expected to age, this trend will be far more pronounced in Italy.

In 2000, Yemen's population was predominantly young, with the 0-14 age group making up half of the population (50.1%). The working-age population (15-59 years) accounted for 46.3%, while a very small minority, just 3.6%, were aged 60 or over. By 2050, the proportion of children is projected to fall to 37.0%, while the 15-59 age group is expected to grow significantly to 57.3%. The elderly population is also predicted to see a slight increase to 5.7%.

In sharp contrast, Italy had a much older population structure in 2000. The largest segment was the 15-59 age group at 61.6%, while the 60+ group already constituted a substantial 24.1%. Children aged 0-14 made up only 14.3% of the population. Looking ahead to 2050, Italy's population is forecast to age dramatically. The proportion of people aged 60 and over is expected to surge to 42.3%, while the 0-14 and 15-59 age groups are projected to shrink to 11.5% and 46.2% respectively.`

const task2ModelAnswer = `Improving public health is a critical goal for all governments, but the most effective methods to achieve this are often debated. One popular view suggests that increasing the number of sports facilities is the key, while an opposing perspective argues for other, more impactful measures. This essay will discuss both viewpoints before concluding that a multi-faceted approach, not solely focused on sports facilities, is required.

On the one hand, proponents of building more sports facilities argue that it directly tackles the problem of physical inactivity. By providing accessible places for people to exercise, such as gyms and parks, communities can encourage a more active lifestyle. This approach is tangible and can foster a sense of community around health.

However, critics contend that simply building facilities is a simplistic solution. They point out that factors beyond access, such as lack of time and motivation, prevent people from exercising. Furthermore, public health encompasses more than just fitness; it includes nutrition and mental health. Therefore, other measures are crucial. For instance, public health campaigns promoting healthy eating, taxes on sugary drinks, and improved access to mental health services could have a broader impact.

In my opinion, while increasing sports facilities can be a beneficial part of a public health strategy, it is insufficient on its own. A holistic approach is essential. The most effective strategy would combine accessible exercise facilities with strong public education programs and policies that make healthy food choices cheaper. Therefore, while building sports centres is not a bad idea, it must be part of a wider, more comprehensive set of measures.`


export default function Book9WritingTest3() {
      const task1Question = "The charts below give information on the ages of the populations of Yemen and Italy in 2000 and projections for 2050. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
      
      const task2Question = "Some people say that the best way to improve public health is by increasing the number of sports facilities. Others, however, say that this would have little effect on public health and that other measures are required. Discuss both these views and give your own opinion.";
     
  return (
    <WritingTestTemplate
      bookNumber="9"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


