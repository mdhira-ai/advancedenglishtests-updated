import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The bar chart illustrates the trends in telephone call durations in the United Kingdom, measured in billions of minutes, across three different categories from 1995 to 2002. The categories are local fixed line, national and international fixed line, and mobile calls.

Overall, local fixed line calls were the most popular type throughout the entire period, although their usage peaked and then declined. In contrast, both national/international calls and, most dramatically, mobile calls saw significant growth.

In 1995, local fixed line calls stood at just over 70 billion minutes, rising to a peak of 90 billion in 1999. After this point, their usage began to fall, ending at the same level in 2002 as they started in 1995. National and international calls showed a more consistent upward trend, starting at approximately 38 billion minutes and increasing steadily to just over 60 billion by 2002.

The most striking change was in the use of mobiles. Starting from a very low base of around 4 billion minutes in 1995, mobile call usage experienced a meteoric rise. By 2002, the figure had surged to approximately 46 billion minutes, an increase of more than tenfold. This rapid growth meant that by the end of the period, the gap between the three categories had narrowed considerably compared to 1995.`

const task2ModelAnswer = `The proposition of making unpaid community service a mandatory component of high school education is a subject of considerable debate. While some argue it fosters social responsibility, others question the ethics and effectiveness of compulsion. In my view, I strongly agree that compulsory community service is a valuable addition to the high school experience, provided it is implemented thoughtfully.

The primary argument in favour of this policy is its potential to develop well-rounded, socially conscious citizens. By engaging in activities such as assisting at a local charity or participating in environmental clean-ups, students are exposed to different facets of their community. This direct experience can cultivate empathy and a sense of civic duty that cannot be learned from a textbook. Moreover, it equips teenagers with practical skills, from teamwork to problem-solving, which are invaluable for their future.

On the other hand, opponents often raise concerns about the compulsory nature of the service. They argue that forcing students to volunteer contradicts the very spirit of volunteerism, potentially breeding resentment. There is also the logistical challenge for schools to manage and provide meaningful placements for all students.

Despite these valid points, the benefits of a well-structured programme outweigh the drawbacks. The element of compulsion ensures that all students, not just those already inclined to volunteer, are given the opportunity to broaden their horizons. It can break down social barriers and help students discover new passions. To mitigate resentment, schools can offer a wide range of choices, allowing students to select opportunities that align with their interests. In conclusion, making community service a compulsory part of high school is a proactive step towards nurturing responsible and engaged individuals.`

export default function Book9WritingTest2() {
    const task1Question = "The chart below shows the total number of minutes (in billions) of telephone calls in the UK, divided into three categories, from 1995-2002. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
   
      const task2Question = "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?";
   
  return (
    <WritingTestTemplate
      bookNumber="9"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}




  