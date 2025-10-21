import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The bar chart illustrates the frequency with which people in the United States consumed meals at fast-food restaurants over three separate years: 2003, 2006, and 2013.

Overall, the most popular frequency for eating at fast-food establishments was either once a week or once or twice a month. There was a noticeable shift over the period, with a decline in high-frequency dining and an increase in less frequent visits.

In 2003, the highest proportion of people (around 31%) ate at fast-food restaurants once a week. This figure saw a slight increase to about 33% in 2006 before falling back to approximately 28% in 2013. The category of 'once or twice a month' grew in popularity, starting at 30% in 2003 and rising to become the most common frequency in 2013, at over 33%.

Conversely, the proportions of people eating fast food more frequently declined. Those who ate fast food 'several times a week' dropped from around 17% to 15%, while the small percentage of daily consumers fell from roughly 4% to below 3%. The group that visited 'a few times a year' saw a steady increase from about 13% to 15%. Finally, the proportion of people who never ate fast food remained consistently low, fluctuating around 4-5% throughout the period.`

const task2ModelAnswer = `The allocation of national budgets for transportation is a critical decision facing many countries, particularly concerning the balance between developing new infrastructure and upgrading existing systems. One school of thought advocates for investing vast sums in new high-speed railway lines between cities, while another argues that this money would be better utilized improving current public transport. This essay will discuss both perspectives, concluding that while high-speed rail has its merits, improving existing public transport offers more widespread and equitable benefits.

Proponents of constructing new fast train lines highlight the potential for significant economic and environmental advantages. High-speed rail can drastically reduce travel times between major economic hubs, fostering business, tourism, and national integration. For example, Japan's Shinkansen network has been instrumental in its economic development. Environmentally, fast trains are a more sustainable alternative to short-haul flights and private car travel, which can help countries meet their carbon reduction targets. From this viewpoint, such projects are a necessary investment in a modern, competitive, and greener future.

However, critics argue that these mega-projects are excessively expensive and their benefits are often concentrated on a small segment of the population—namely, business travelers and those living in major cities. They contend that the same funds could be used to make substantial improvements to the everyday public transport systems that millions of people rely on. This would involve upgrading local bus networks, suburban train lines, and tram systems. Such improvements could lead to more immediate and tangible benefits for a larger portion of the population, such as reduced daily commute times, lower travel costs, and decreased traffic congestion in urban areas. This approach prioritizes the quality of daily life for the many over the high-speed convenience for the few.

In my opinion, while the allure of high-speed rail is strong, the more prudent and equitable use of public funds is to improve existing public transport networks first. A reliable, affordable, and efficient local transport system directly benefits a far greater number of citizens, enhancing their access to jobs, education, and services. Once a robust local network is established, a country can then consider investing in high-speed inter-city lines. Therefore, the focus should be on foundational improvements before pursuing ambitious new projects.`


export default function Book12WritingTest3() {

      const task1Question = "The chart below shows how frequently people in the USA ate in fast food restaurants between 2003 and 2013. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
   
      const task2Question = "In a number of countries, some people think it is necessary to spend large sums of money on constructing new railway lines for very fast trains between cities. Others believe the money should be spent on improving existing public transport. Discuss both these views and give your own opinion.";
  
  return (
    <WritingTestTemplate
      bookNumber="12"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book12/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}



