import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = "The pie chart shows that there are four main causes of farmland becoming degraded in the world today. Globally, 65% of degradation is caused by too much animal grazing and tree clearance, constituting 35% and 30% respectively. A further 28% of global degradation is due to over-cultivation of crops. Other causes account for only 7% collectively.\n\nThese causes affected different regions differently in the 1990s, with Europe having as much as 9.8% of degradation due to deforestation, while the impact of this from Oceania and North America was minimal, with only 1.7% and 0.2% of land affected respectively. Europe, with the highest overall percentage of land degraded (23%), also suffered from over-cultivation (7.7%) and over-grazing (5.5%). In contrast, Oceania had 13% of degraded farmland and this was mainly due to over-grazing (11.3%). North America had a lower proportion of degraded land at only 5%, and the main causes of this were over-cultivation (3.3%) and, to a lesser extent, over-grazing (1.5%).\n\nOverall, it is clear that Europe suffered more from farmland degradation than the other regions, and the main causes there were deforestation and over-cultivation."
const task2ModelAnswer = "A child’s education has never been about learning information and basic skills only. It has always included teaching the next generation how to be good members of society. Therefore, this cannot be the responsibility of the parents alone.\n\nIn order to be a good member of any society the individual must respect and obey the rules of their community and share their values. Educating children to understand the need to obey rules and respect others always begins in the home and is widely thought to be the responsibility of parents. They will certainly be the first to help children learn what is important in life, how they are expected to behave and what role they will play in their world.\n\nHowever, learning to understand and share the value system of a whole society cannot be achieved just in the home. Once a child goes to school, they are entering a wider community where teachers and peers will have just as much influence as their parents do at home. At school, children will experience working and living with people from a whole variety of backgrounds from the wider society. This experience should teach them how to co-operate with each other and how to contribute to the life of their community.\n\nBut to be a valuable member of any community is not like learning a simple skill. It is something that an individual goes on learning throughout life and it is the responsibility of every member of a society to take responsibility for helping the younger generation to become active and able members of that society."

export default function Book8WritingTest1() {
  const task1Question = "The pie chart below shows the main reasons why agricultural land becomes less productive. The table shows how these causes affected three regions of the world during the 1990s.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant."
  
  const task2Question = "Some people think that parents should teach children how to be good members of society. Others, however, believe that school is the place to learn this.\n\nDiscuss both these views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience."

  return (
    <WritingTestTemplate
      bookNumber="8"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}