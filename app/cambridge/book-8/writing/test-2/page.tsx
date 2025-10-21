import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = "The charts show how much a UK school spent on different running costs in three separate years: 1981, 1991 and 2001.\n\nIn all three years, the greatest expenditure was on staff salaries. But while other workers' salaries saw a fall from 28% in 1981 to only 15% of spending in 2001, teachers' pay remained the biggest cost, reaching 50% of total spending in 1991 and ending at 45% in 2001.\n\nExpenditure on resources such as books had increased to 20% by 1991 before decreasing to only 9% by the end of the period. In contrast, the cost of furniture and equipment saw an opposite trend. This cost decreased to only 5% of total expenditure in 1991 but rose dramatically in 2001 when it represented 23% of the school budget. Similarly, the cost of insurance saw a rising trend, growing from only 2% to 8% by 2001.\n\nOverall, teachers' salaries constituted the largest cost to the school, and while spending increased dramatically for equipment and insurance, there were corresponding drops in expenditure on things such as books and on other workers' salaries."
const task2ModelAnswer = "This is a sample answer written by a candidate who achieved a Band 5.5 score. Here is the examiner's comment:\nThe topic introduction has been copied from the task and is deducted from the word count. This leaves the answer length at 236 words, so the candidate loses marks for this.\nThis answer addresses both questions, but the first is not well covered in terms of how actual relationships have changed. Nevertheless, there is a clear opinion that the effects have been positive and relationships have improved, with some relevant ideas to support this. There is a general progression to the argument, with some effective use of time markers and linkers. There is also some repetition, however. Paragraphing is not always logical, and ideas are not always well linked. A range of vocabulary that is relevant to the topic is used, including some precise and natural expressions. There are quite a lot of mistakes in word form, word choice or spelling, but these do not usually reduce understanding. A variety of sentence types is used, but not always accurately. Errors in grammar and punctuation are distracting at times, but only rarely cause problems for the reader.\n\nNowadays the way people interact with each other has changed because of technology.\nYes, the technology has changed the people’s interaction in very enhanced manner. Earlier people use to wait and try to find easy way to contact their friends or relatives leaving for. In past there was no quick technology to contact or to establish any communication between one person to another person. The drawback with past communication systems was that it were very slow and were taking process such as telegrams, letter etc. People used to afraid to sent their personal feedbacks or things to their love ones due to unsecure medium of communication. When it comes to professional level, the privacy and accuracy should be maintain but, to that time there were no secure communications.\nNow the things have changed around, people from far distance contact their loves one in an easy and quick ways which improves the Interaction level between two person. Quality the level of the Interaction between people to people, has improved because the people are equipped with high-tec technology which enhances the communication. There are many many medium which are available now such as Internet, Calling Cards etc.\nThe technology has provided the mobility faster which help people to talk or to interact at any time anywhere in the world.\nPeople can contact their friend or relatives any time they want. It has become so easier and feriendly to be in touch with your feriends, relatives even with the unknown people."

export default function Book8WritingTest1() {

  const task1Question = "The three pie charts below show the changes in annual spending by a particular UK school in 1981, 1991 and 2001.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Nowadays the way many people interact with each other has changed because of technology.\n\nIn what ways has technology affected the types of relationships people make?\n\nHas this become a positive or negative development?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.";

  return (
    <WritingTestTemplate
      bookNumber="8"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}

 
              