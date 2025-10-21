'use client'

import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The table presents survey results from one university across three different years (2000, 2005, and 2010), showing various aspects of university performance and student satisfaction.

In 2000, the university demonstrated solid performance across several key areas. Student satisfaction rates were moderately high, and the institution showed good academic standards with reasonable class sizes and adequate facilities. The teaching quality was well-regarded, and the university maintained a positive reputation within the academic community.

By 2005, there were notable improvements in several areas. Student satisfaction levels increased significantly, suggesting enhanced service delivery and educational quality. The university appeared to have invested in better facilities and resources, which contributed to improved overall performance. Teaching standards continued to develop, and the institution's reputation strengthened during this period.

The 2010 survey results showed further positive developments. Student satisfaction reached its highest levels across the three survey periods, indicating continued improvements in university services and academic delivery. The institution demonstrated consistent growth in areas such as facility quality, academic support, and overall student experience. The university's reputation continued to enhance, reflecting its sustained commitment to educational excellence.

Overall, the surveys reveal a pattern of continuous improvement at the university over the decade, with particularly strong progress in student satisfaction and institutional reputation. The data suggests successful implementation of development strategies that enhanced the university's performance across multiple dimensions.`

const task2ModelAnswer = `The question of whether the retirement age should be significantly increased due to longer life expectancy is a complex issue that affects both individuals and society as a whole. While there are compelling arguments for raising the retirement age, I believe that a moderate increase, combined with flexible options, would be more appropriate than a considerable elevation.

Proponents of raising the retirement age present several valid arguments. Firstly, increased life expectancy means people are living longer, healthier lives and may be capable of working productively for more years. This extended working period could help address the growing financial burden on pension systems and social security, as fewer working-age people support an increasing number of retirees. Additionally, many older workers possess valuable experience, skills, and institutional knowledge that could benefit the economy if they remained in the workforce longer.

However, there are significant drawbacks to considerably raising the retirement age. Not all jobs are suitable for older workers, particularly those requiring physical labor or high-stress environments. Many people in their sixties may face health issues that make continued employment difficult or impossible. Furthermore, raising the retirement age could reduce employment opportunities for younger generations, potentially increasing youth unemployment. There are also concerns about workplace age discrimination and whether older workers would be fairly treated in competitive job markets.

A more balanced approach would involve moderate increases to the retirement age, coupled with flexible retirement options. This could include phased retirement programs, part-time work opportunities for older employees, and different retirement ages for different types of occupations. Such policies would acknowledge the reality of longer life spans while considering individual circumstances and societal needs.

In conclusion, while some increase in retirement age may be necessary due to demographic changes, a considerable rise would be problematic. A gradual, flexible approach that considers health, job requirements, and individual choice would be more equitable and practical than dramatically raising the retirement age across all sectors.`

export default function BookIELTSPlus3WritingTest1() {
  const task1Question = "The table below shows the results of surveys in 2000, 2005 and 2010 about one university. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Some say that because many people are living much longer, the age at which people retire from work should be raised considerably. To what extent do you agree or disagree?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-3"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
