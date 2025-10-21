import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The three graphs provide an overview of the types of music people purchase in the UK. At first glance we see that classical music is far less popular than pop or rock music.

While slightly more women than men buy pop music, the rock market is dominated by men with 30% buying rock, compared to 18% of women. From the first graph we see that interest in pop music is steady from age 16 to 44 with 20% of the population continuing to buy pop CDs after the age of 45.

The interest in rock music reaches its peak among the 25 to 34 year olds, though it never sells as well as pop. Interest also drops off after the age of 35 with an even sharper fall from age 45 onwards, a pattern which is the opposite to the classical music graph.`

const task2ModelAnswer = `In times of high unemployment, employers need do very little to encourage their staff. At first glance it is easy to see why, because with so many people out of work and job vacancies are scarce, they have to find effective ways of rewarding their staff in order to stop them from going elsewhere.

One obvious way of doing this is to offer extra money to employees who are seen to be working exceptionally hard and this is done in companies with a product to sell. For example, real estate agents or department stores can offer a simple commission on all sales. This style of management favours people who can demonstrate their contribution through sales figures, but does not take into account the work done by people behind the scenes who have little contact with the public. A better approach is for management to offer a bonus to all the staff at the end of the year if the profits are healthy. This, however, does not allow management to target individuals who have genuinely worked harder than others.

Another possibility is to identify excellent staff through incentive schemes such as 'Employee of the Month' or 'Worker of the Week' to make people feel recognised. Such people are usually singled out with the help of clients. Hotels, restaurants and tour operators may also allow staff to accept tips offered by clients who are pleased with the service. However, tipping is a highly unreliable source of money and does not favour everyone.

Basically, employees want to be recognised for their contribution - whether through receiving more money or simply some encouraging words. They also need to feel that their contribution to the whole organisation is worthwhile. Good management recognises this need and responds appropriately.`

export default function BookPlus1WritingTest2() {
  const task1Question = "The graphs below show the types of music albums purchased by people in Britain according to sex and age. Write a report for a university lecturer describing the information shown below.";

  const task2Question = "Some employers reward members of staff for their exceptional contribution to the company by giving them extra money. This practice can act as an incentive for some but may also have a negative impact on others. To what extent is this style of management effective? Are there better ways of encouraging employees to work hard?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-1"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
