import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The two maps illustrate the layout of Grange Park in 1920, the year it opened, and its current design today.

Overall, the park has undergone a significant transformation, with most of its original features being replaced by modern recreational facilities. While the general shape and the two main entrances have been preserved, a new entrance has been added, and every major attraction within the park has been altered.

In the center of the park, the fountain that stood in 1920 has been removed. In its place now stands a large rose garden, which is surrounded by new seating areas. Another major change occurred in the top-right corner, where the stage for musicians has been replaced by a much larger amphitheatre designed for concerts. Similarly, in the bottom-right corner, the glasshouse has made way for a new water feature.

On the western side of the park, the changes are equally pronounced. The pond for water plants in the top-left corner has been converted into a children's play area. The rose garden in the bottom-left corner has been replaced with a café. Finally, while the original entrances on Arnold Avenue and Eldon Street remain, a third entrance has been introduced, providing access to a new underground car park located beneath the southern part of the park.`

const task2ModelAnswer = `In recent years, there has been a noticeable shift in the labour market, with an increasing number of individuals opting for self-employment over traditional roles within a company. This essay will first explore the primary reasons for this trend, such as the pursuit of flexibility and passion, and then discuss the significant disadvantages, including financial instability and increased responsibility.

There are several compelling reasons why people are choosing to become their own boss. Perhaps the most significant driver is the desire for greater autonomy and flexibility. Self-employment allows individuals to control their own schedules, choose their projects, and decide where they work. This freedom is particularly attractive to those seeking a better work-life balance or wishing to escape the rigid structure and bureaucracy of corporate environments. Furthermore, the rise of the digital economy has made it easier than ever to start a business with minimal overheads. Another key motivation is the opportunity to pursue a personal passion and turn it into a career, which can be more fulfilling than a conventional job.

However, the path of self-employment is fraught with challenges. The most prominent disadvantage is the lack of financial security. Unlike salaried employees, the self-employed often face fluctuating and unpredictable incomes, and they do not receive benefits such as paid holidays, sick leave, or employer-sponsored pension plans. This instability can be a major source of stress. Secondly, being self-employed means taking on a multitude of roles beyond one's core expertise. A freelance graphic designer, for example, must also be a marketer, an accountant, and an administrator. This immense workload can lead to long hours and burnout, blurring the lines between personal and professional life.

In conclusion, the allure of freedom, control, and the ability to follow one's passion are powerful motivators driving the trend towards self-employment. Nevertheless, this career choice comes with considerable drawbacks, namely financial insecurity and the burden of managing all aspects of a business. While being self-employed can be incredibly rewarding, it requires a high degree of resilience and discipline to navigate its inherent risks.`

export default function Book14WritingTest4() {
  const task1Question = "The plans below show a public park when it first opened in 1920 and the same park today. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Nowadays many people choose to be self-employed, rather than to work for a company or organisation. Why might this be the case? What could be the disadvantages of being self-employed?";

  return (
    <WritingTestTemplate
      bookNumber="14"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book14/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
