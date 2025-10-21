import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The chart describes the data about families weekly expenditure prospects in 1968 and in 2018.

The most significant spent rate is on food with a 35% ratio in the year 1968. Housing and clothing come next with the same prospect of 10% of the weekly income. Expenditure on leisure, transport, personal goods and household goods are almost same percentage, the former one is slightly more. Lastly, spent rates on fuel and the others are recorded the least with a 6% in the year of 1968.

Turning to 2018, food expenditure of families had dropped dramatically to a percentage between 15 to 20. On the other hand, housing spent had rised significantly with an almost 20% slightly more than food expenditures. The most crucial rise was recorded on leisure spent rates. It had soared abut 10% in 50 years. Transportation expeditures comes after and followed by Household goods and the othe categories respetively. Last three had remained the least just as in 1968 which is fuel and power, clothing and footware and personal goods.

Overall, weekly expenditure averages of families had dramatically changed over 50 years. Some spent rates had remained the same whereas some of the alterations are quite noticable.`

const task2ModelAnswer = `As the number of professionals workking abroad increases, it is often discussed whether they should stay where hey did their trainings or they should be free to move to another country if they desired to. While I believe theat a person should be free to migrate, I agree that it has negative effects on the country of training.

On the one hand, professionals who decide to work abroad are seeking for a different lifestyle and career opportunities. Therefore, they should be allowed to improve their lives outside the limitations of their country of origin. For example, whilst in Spain residents in a hospital do not have hands-on experience due to safety measures, in other countries such as Argentina, residents actually practice their skills with patients. Besides, cultural exchanges have proven to increase efficiency, since different nationalities mean different believes and the introduction of new methods.

On the other hand, when professionals leave the country where they trained, countries are damaged socially and economically. In countries where the government provides free education and healthcare, many people think that the population should compensate the country with their skills and abilities. Furthermore, as a study fo South African emigration has pointed out when a professional lease the country it results in the loss of 10 unskilled jobs. Therefore it affect the economy and the community.

Taking everything into account, it can be said that miving out from the country of training should not be taken lightly, given the adverse effects on the population. However, I firmly believe that someone's professional development should not depend on their country of origin and professionals should be allowed to look for better opportunities overseas.`

export default function Book17WritingTest3() {
  const task1Question = "The chart below gives information about how families in one country spent their weekly income in 1968 and in 2018. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Some people think that professionals, such as doctors and engineers, should be required to work in the country where they did their training. Others believe they should be free to work in another country if they wish. Discuss both these views and give your own opinion.";

  return (
    <WritingTestTemplate
      bookNumber="17"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book17/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
