import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The provided data illustrates the impact of a refurbishment on Ashdown Museum, showing changes in visitor numbers and satisfaction levels in the year before and the year after the project.

Overall, the refurbishment appears to have been a major success, leading to a significant increase in both the number of visitors and their reported levels of satisfaction.

The total number of visitors to the museum rose substantially, from 74,000 in the year before the refurbishment to 92,000 in the year after. This represents an increase of 18,000 visitors.

The improvement in visitor satisfaction was even more pronounced. Before the refurbishment, the largest group of respondents (40%) were dissatisfied, with a further 10% being very dissatisfied. Only 15% were very satisfied and 30% were satisfied. After the refurbishment, this pattern was completely reversed. The proportion of very satisfied visitors more than doubled to 35%, and the satisfied group grew to 40%. Consequently, the percentage of dissatisfied visitors fell dramatically to 15%, and the very dissatisfied segment shrank to just 5%. The proportion of visitors giving no response also decreased from 5% to a negligible level.`

const task2ModelAnswer = `The definition and pursuit of national progress is a fundamental concern for any government. A prevalent view is that economic progress is the paramount objective, the primary measure of a country's success. However, an alternative perspective argues that other forms of progress, such as social and environmental well-being, are of equal importance. This essay will discuss both viewpoints and assert that while economic health is crucial, it should not be the sole priority of a nation.

The argument for prioritizing economic progress is compelling. A robust economy, often measured by GDP growth, provides the financial resources necessary for a country to function and develop. Economic prosperity can lead to lower unemployment, higher incomes, and an improved standard of living for citizens. The tax revenue generated from a thriving economy is what funds essential public services, including healthcare, education, and infrastructure. From this standpoint, without a strong economic foundation, a country cannot afford to invest in other areas of progress.

On the other hand, focusing exclusively on economic indicators can lead to significant societal problems. The relentless pursuit of growth can result in environmental degradation, such as pollution and the depletion of natural resources, which ultimately harms public health and future prosperity. Similarly, a purely economic focus can exacerbate social inequality. A country might have a high GDP, but if the wealth is concentrated in the hands of a few while many live in poverty with poor access to healthcare and education, it cannot be considered truly progressive. Other metrics, like literacy rates, life expectancy, levels of happiness, and environmental quality, are equally vital for assessing a nation's well-being.

In my opinion, a balanced approach is essential. Economic progress should be seen as a means to an end, not the end itself. The ultimate goal of a government should be to improve the overall quality of life for its citizens. This requires a holistic view of progress that integrates economic development with social equity and environmental sustainability. For example, investing in green technology can create jobs while also tackling climate change, achieving both economic and environmental goals simultaneously. In conclusion, while many governments rightly focus on building a strong economy, this must be balanced with a commitment to social welfare and environmental protection. True progress is achieved when a country is not only wealthy but also fair, healthy, and sustainable.`


export default function Book11WritingTest4() {
      const task1Question = "The table below shows the number of visitors to Ashdown Museum during the year before and the year after it was refurbished. The charts show the result of surveys asking visitors how satisfied they were with their visit, during the same two periods. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
     
      const task2Question = "Many governments think that economic progress is their most important goal. Some people, however, think that other types of progress are equally important for a country. Discuss both these views and give your own opinion.";
    
  return (
    <WritingTestTemplate
      bookNumber="11"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


   
