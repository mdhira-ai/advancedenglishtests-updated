import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The four line graphs compare full-time and part-time employment figures for males and females in Australia across various age groups in 1973 and 1993.

Overall, the most significant trend over the two decades was the dramatic increase in part-time employment among women, whereas male employment was characterized by a high, yet slightly declining, rate of full-time work. For both genders, part-time work was less common than full-time work, but its importance grew substantially for the female workforce.

Looking at male employment, the rate of full-time work in 1973 was extremely high, peaking at over 90% for those aged 25-54. By 1993, this pattern remained, but the percentages had fallen slightly across all age groups. Part-time employment for men was minimal in both years, never exceeding 10% for any age group.

In contrast, female employment patterns underwent a major shift. While full-time employment rates for women remained relatively stable and significantly lower than men's, peaking at around 50-60% for the 20-24 age bracket, part-time work soared. In 1973, female part-time employment was below 15% for all ages. By 1993, however, it had risen sharply, reaching a peak of over 25% for women aged 35-44. This indicates a substantial move towards part-time roles for women, particularly in their middle years.`

const task2ModelAnswer = `The motivations driving elite athletes have undeniably evolved, with modern sport becoming a lucrative industry where fame and fortune are prominent goals. This shift sends a complex message to young people and has profoundly affected the nature of sports themselves.

The primary message this trend conveys to aspiring young athletes is that extrinsic rewards are paramount. When children see their heroes motivated more by endorsement deals and prize money than by the glory of victory or the pursuit of excellence, it can reframe their own aspirations. They may begin to value marketability over sportsmanship and financial success over personal bests. This can lead to a cynical approach to sport, where the goal is not to be the best athlete but to become the most famous personality, which is a potentially damaging lesson for character development.

This change in attitude has also significantly impacted sports. On one hand, professionalization, funded by massive commercial interest, has raised the level of competition. Athletes can dedicate their lives to training, leading to incredible human achievements. However, this commercial pressure has also introduced negative elements. The immense financial stakes can lead to corruption, such as match-fixing or performance-enhancing drug use, as the incentive to win at all costs becomes overwhelming. Furthermore, it can erode the connection between teams and their communities, as players frequently move clubs for higher salaries, turning sport into a transient business rather than a source of local pride and loyalty.

In conclusion, the modern emphasis on money and fame in sport has created a double-edged sword. While it has elevated performance levels, it also risks corrupting the core values of sport and sends a message to youth that material gain is more important than intrinsic passion and integrity. This shift fundamentally alters the spirit of competition, for better and for worse.`

export default function BookPlus1WritingTest3() {
  const task1Question = "The graphs below show full-time and part-time employment in Australia between 1973 and 1993 for men and women. Write a report for a university lecturer describing the information shown below.";

  const task2Question = "In the past, sporting champions used to be motivated primarily by the desire to win a match or to break world records. These days, they are more likely to be motivated by prize money and the opportunity to be famous. What message does this send to young people and how does this attitude to sport affect the sports themselves?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-1"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
