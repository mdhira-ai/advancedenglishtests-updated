import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `This is an answer written by a candidate who achieved a Band 6.0 score.

The diagram illustrates the process by which sugar is produced from sugar cane. The process consists of seven steps of various time length, starting by farming sugar canes and ending by dry sugar ready to use.

First, sugarcane is farmed and nurished for a period of 12 to 18 months, which is the longest step in the whole process. Second, sugar cane get harvested by the means of two ways, either manually or using specialized vehicles. Third, the harvested sugar cane go through the step of crushing, resulting in liquid form called juice.

The fourth step involves purifying the juice through Limestone filters. The purified juice now goes through the fifth step, which put it under extreme heat to allow it to evaporate to get syrup out from it. Then the syrup is centrifuged to separate sugar crystals from syrup. Once that happend the sugar is taken into the last phase of drying and cooling, which finalise the process and produce ready-to-use sugar that is packed and ready for sale.`

const task2ModelAnswer = `This is an answer written by a candidate who achieved a Band 4.5 score.

In their advertising, businesses nowdays sometimes stress that their products are new in some way. From my point of view, some businesses want to have good products to give to the people, but usually they worry about their products are newer than some other's businesses products.

In think it is a negative development, because when businesses stress about the quality of their products sometimes they do something wrong while they are producing them. It is good when the businesses take care of and look after their products but with a limit. According to some experts, when you take a lot of care of something, you will probably do some things, about it, wrong.

From my own experience, I was trying to make three school projects, which my teachers asked me to do, and despite my hard work and because I was stressed about the projects I had to do, I finally failed because I had made a lot of mistakes.

To sum up, businesses nowdays should not stress about their products being new in some way. Besides that they should calm down and be careful on what they are producing.`

export default function Book16WritingTest2() {
  const task1Question = "The diagram below shows the manufacturing process for making sugar from sugar cane. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "In their advertising, businesses nowadays usually emphasise that their products are new in some way. Why is this? Do you think it is a positive or negative development?";

  return (
    <WritingTestTemplate
      bookNumber="16"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book16/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
