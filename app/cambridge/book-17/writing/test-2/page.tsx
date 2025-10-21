import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The table illustrates the data on the police budget in which the money came from and the two pie charts describe the distribution of the amount of money in the two of year 2017 and 2018 in an area of Britain. Overall, there was an upward trend in all three different sources while the money spent on salaries was always the majority of contribution.

Looking into more details, the highest amount of money on the police budget belonged to 'National Government', 175.5 million pounds in 2017 and it kept rising to 177.8 million pounds. Thus was followed by 'Local Taxes', at 91.2 million pounds in 2017, after one year, it increase significantly to 102.3 million pounds.

In term of the how the money was spent, the majority of police budget goes to salaries which was for officers and staff, dropping slightly from 75% in 2017 to 69% in 2018. Meanwhile, the proportion of 'Buildings and transport' remained constantly, at 17% each year. An opposite pattern can be seen in the category of technology, its figure rose sharply from 8% in 2017 to 14% in 2018, which was always the lowest rate during the given period.`

const task2ModelAnswer = `Mobile phones, nowadays, contains essential features with entertainment also. There has been a large growth seen in usage hours of smartphones among youngsters. There are several reasons behind this situation and I find this development more beneficial than negative. Both the reasons and my view is elaborated further.

The first reason for overusage of smart devices by youngsters is the social benefit they provide. The smart phone connected with internet opens up the large possibilities, from creating new friends to communicating with them over social media. For instance, a child in my neighbourhood chats for hours with his school friends over Facebook (a social media) and also spend time over online video sharing phone application. Moreover, the mobile gaming, specially multiplayer games, is another major reason for the situation. Children plays different kind of games over mobile for the entertainment purpose and they involve themselves in games in such a manner, that they forget about the timing and other work to do.

However, I believe that smartphones have also increased the knowledge of pupils. It has developed some important social skills, such as communication skill, team work and many more, by allowing them to work and play in groups, without the restriction of distance. In addition, children can learn through internet by watchin online videos and reading articles, which ultimately helps them in their studies as well as language skills. For example, whenever my niece require to know about something, he searches it over the internet and learns from it. Moreover, multiplayer online gaming improves their multitasking ability and it also gives them a competitive environment.

Overall, I agree that overusage of smartphones on regular basis is harmful for them, but if given proper guidance, mobile phones can help them in learning some life-long skills.`

export default function Book17WritingTest2() {
  const task1Question = "The table below shows the sources of funding for police budgets in an area of Britain from 2017 to 2018. The pie charts show how the money was spent in each of the two years. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Some children spend hours every day on their smartphones. Why is this the case? Do you think this is a positive or a negative development?";

  return (
    <WritingTestTemplate
      bookNumber="17"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book17/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
