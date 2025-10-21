'use client'

import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The two pie charts show that low and high income groups spend their disposable income (earnings excluding house rent or purchase) on similar items but in different proportions.

Regarding the low income group, the highest proportion of their spending is on food and drink, at 29 percent, compared to just 15 percent for the high income group. This is closely followed by 24 percent paid out on fuel bills, which contrasts with a much lower figure for this item in the high income group (only 7 percent). The most popular item for the high earners is recreation and cultural activities - 21 percent compared to 11 percent by the low earning group. The higher group also spend a much higher proportion than the lower income group on restaurants and hotels (12 percent and 4 percent respectively) and on transportation (16 percent and 9 percent respectively). The proportion of expenditure on clothing for the two groups is very similar, with only one percent difference between the two (six percent for high income and five percent for the low).`

const task2ModelAnswer = `Few would argue that technologies developed in recent years have had a significant impact on the way music and books are shared. The internet enables very cheap, or even for no charge, access to words and sounds.

For many people this is a very positive development. Firstly, they make the point that downloading words and music without paying is morally wrong - it is, after all, a form of stealing, just as much as if someone had shop-lifted a CD book; they claim that if nobody actually buys music or novels, the people who produce them, for example, writers, journalists or musicians, will no longer be able to make a living from such work. Eventually, no one will be able to function. They say that eventually the only way to make money from writing and music will be through things like celebrity endorsements, and mediocrity will flourish.

I believe, however, that free access to books and music on the Internet is a liberating development, allowing more people to enjoy what once the preserve of the few. It is particularly good for young people who can freely experience a wide range of books and music. I feel the only way to prevent accessing books and music is by increased surveillance and control. I believe it would be extremely damaging, because it would create and undermine creative industries much more than free access is said to do now. 'Brave new writers and musicians' will find a way of benefiting from the new situation and good artists will be able to make a living as they always have done.`

export default function BookIELTSPlus3WritingTest4() {
  const task1Question = "The charts below show the percentage of monthly household income spent on various items by two different groups in one European country. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Modern technology has made it easier for individuals to download copyrighted music and books from the internet for no charge. To what extent is this a positive or a negative development? Give reasons for your answer, and include any relevant examples from your own knowledge or experience.";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-3"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
