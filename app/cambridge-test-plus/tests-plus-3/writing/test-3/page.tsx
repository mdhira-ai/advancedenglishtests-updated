'use client'

import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The bar chart illustrates the percentage of unemployed graduates aged 20-24 in one European country over a two-year period, showing unemployment trends across different months.

At the beginning of the period, graduate unemployment stood at approximately 8% and remained relatively stable during the early months. However, there was a notable increase during the winter months, with unemployment rising to around 12% by the end of the first year. This seasonal pattern suggests that fewer employment opportunities were available during the colder months.

During the second year, unemployment levels showed some fluctuation but generally remained elevated compared to the initial period. The unemployment rate peaked at approximately 14% during the mid-year period, representing the highest point across the entire timeframe. This increase could be attributed to various economic factors affecting the job market for recent graduates.

Towards the end of the second year, there was a gradual decline in unemployment levels, dropping to around 10%. While this represented an improvement from the peak levels, the unemployment rate remained higher than the initial baseline, indicating ongoing challenges in the graduate job market.

Overall, the data reveals significant volatility in graduate unemployment over the two-year period, with clear seasonal patterns and a general trend toward higher unemployment rates. The most concerning aspect is the sustained elevation in unemployment levels, suggesting that young graduates faced increasing difficulties in securing employment. The pattern indicates that economic conditions or structural changes in the job market may have adversely affected graduate employment opportunities during this period.`

const task2ModelAnswer = `The assumption that every country should prioritize constantly increasing production of materials and goods is a fundamental economic principle that deserves careful examination. While increased production can bring certain benefits, I disagree that it should be the primary goal for all countries, as this approach overlooks crucial environmental, social, and sustainability concerns.

Proponents of continuous production growth argue that it drives economic development and improves living standards. Increased production typically leads to job creation, higher GDP, and enhanced national competitiveness in global markets. Countries with growing manufacturing sectors often experience technological advancement, infrastructure development, and increased export revenues. This economic growth can provide governments with resources to invest in education, healthcare, and social services, ultimately benefiting their citizens.

However, the relentless pursuit of increased production is fundamentally flawed and unsustainable. Firstly, continuous production growth places enormous strain on natural resources and the environment. Many countries are already experiencing resource depletion, pollution, and climate change effects directly linked to over-production and over-consumption. The environmental costs often outweigh the short-term economic benefits, creating long-term problems for future generations.

Furthermore, focusing solely on production quantity ignores quality of life considerations. Countries like Denmark and Bhutan have demonstrated that citizen well-being, work-life balance, and environmental sustainability can be more valuable than maximum production output. These nations prioritize happiness indices, environmental protection, and social cohesion over pure economic growth.

A more balanced approach would involve sustainable production that meets genuine needs while protecting environmental resources. Countries should focus on efficient production methods, renewable resources, circular economy principles, and quality rather than quantity. This approach considers long-term sustainability, environmental impact, and social well-being alongside economic growth.

In conclusion, while production growth can contribute to development, making it the primary goal is shortsighted and potentially harmful. Countries should pursue balanced development that integrates economic, environmental, and social objectives rather than focusing exclusively on increasing material production.`

export default function BookIELTSPlus3WritingTest3() {
  const task1Question = "The bar chart below shows the percentage of unemployed graduates, aged 20-24, in one European country over a two-year period. Summarise the information by selecting and reporting the main features, and making comparisons where relevant.";

  const task2Question = "Many people assume that the goal of every country should be to produce more materials and goods. To what extent do you agree or disagree that constantly increasing production is an appropriate goal?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-3"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
