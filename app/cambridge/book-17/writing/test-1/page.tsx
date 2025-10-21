import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The two maps illustrates the norbiton area in the present days, as well as, the planned development.

Overall, the norbiton industrial area is located at the east side of the town, with a river on the north, separating the farmland from the industrial area, which is located in the center of the map, represented by a few factory biuldings and roads, followed by the main road at the extreme south of the map.

the planned development shows a substantially growth and modifications of the overall infrastructure of the area between the farmland and the main road.

Firstly, the planned development of the norbiton area replaces what once were factories for housings.

Moreover, the roads have been developed to acomodate all the new biuldings that have been planned for the area, which are, a school and a playground to the east side of the roundabout located in the center of the map, as well as shops and a medical center around the round about.

Secondly, a bridge is planned for the north of the map to cross the river and provide acess to the housing that will be located in farmland.`

const task2ModelAnswer = `It is said that taking risks brings a lot of benefits. However, it also gives us some drawbacks.

First of all, it is obvious that taking risks will cause a great loss if people do it and fail. In personal life, this loss might not be so harmful. However, it will be really harmfull in professional life, because people take a responsibility not only for themselves but also others such as colleages, customers and their families. It will even damage the society from the economic point.

On the other hand, we can receive huge benefits by taking risks. Firstly, we can learn how to prepare for one goal through this process. In order to achieve the aim, people will make all the efforts to think about it and try to find more efficient way. If they do this in the professional circumstances, they will recognise the responsibility and importance of cooperation.

Also, it will be completely meaningful even though people can't achieve the goal after taking risks. They will learn the reason why they have failed and how to change it. The failure will enable them to improve their skills and to achieve their object next time.

As I mentioned, it is true that taking risks give us both advantages and disadvantages. However, it can be argued that the benefits outweighed the drawbacks in that we can obtain advantages not only from the result but also from the process of taking risks.`

export default function Book17WritingTest1() {
  const task1Question = "The maps below show an industrial area in the town of Norbiton, and planned future development of the site. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "It is important for people to take risks, both in their professional lives and their personal lives. Do you think the advantages of taking risks outweigh the disadvantages?";

  return (
    <WritingTestTemplate
      bookNumber="17"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book17/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
