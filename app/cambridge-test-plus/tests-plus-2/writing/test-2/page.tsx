import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The table compares the opinions of male and female club members about the services provided by a city sports club. We can see from the responses that the male members are generally happier or satisfied with the range of activities at the club, with only 5% dissatisfied. In contrast, however, only about two-thirds of female members were positive about the range of activities and almost a third were dissatisfied.

The genders were more in agreement about the club facilities. Only 14% of women and 10% of men were unhappy with these, and the majority (64% and 63% respectively) were very positive. Finally, the female members were much happier with the club opening hours than their male counterparts. Almost three-quarters of them were very satisfied with these and only 3% were unhappy, whereas nearly 40% of the men expressed their dissatisfaction.

Overall, the table indicates that female members are most unhappy with the range of activities, while male members feel that opening hours are the least satisfactory aspect of the club.`

const task2ModelAnswer = `In every country there are fashions among students about which subjects are the best to study at university; sometimes this choice is influenced by the fact that the subject is popular or is determined by how much money can be earned in that field. Often this may mean that graduates are disappointed if they find that there are no appropriate employment opportunities. It is up to governments to give incentives to students to choose subjects that match the needs of their society.

Obviously one way to do this would be for the government to pay the fees of those choosing such subjects. The advantage would be that the number of students would enrol and would later fill the employment gaps. However, the disadvantages of such a policy would be considerable. For example, the students attracted by the funding may not have a real interest in or aptitude for that subject. Such students may drop out before graduation or may be employed in a related job. Furthermore, funding one group of students and not others would penalise those with a genuine interest and ability for another field. Such discrimination would certainly affect the whole of higher education of the country and students would develop very negative attitudes towards going to university altogether. This would be very counter-productive for any country.

In conclusion I think that there are many other incentives for students that could be considered, such as making courses more interesting to take, or that job rewards are greater after graduation. The educational policy proposed above, however, would certainly have more long-term disadvantages than benefits for society.`

export default function BookPlus2WritingTest2() {
  const task1Question = "The table below shows the results of a survey to find out what activities people of different age groups do during their spare time as well as how much they enjoy them. Write a report for a university lecturer describing the information shown below.";

  const task2Question = "Some people think that governments should give financial support to creative artists such as painters and musicians. Others believe that creative artists should be funded by alternative sources. Discuss both views and give your own opinion.";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-2"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
