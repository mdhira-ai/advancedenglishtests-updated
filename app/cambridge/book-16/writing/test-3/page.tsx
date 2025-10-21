import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `This is an answer written by a candidate who achieved a Band 6.5 score.

The South West airport had some changes after its redevelopment. The departures area was modified to have a bag drop service, along with a cafe and check-in module that were already there before the redevelopment. However, both the cafe and the check-in module changed places to make room for the bag drop. After going through security passport control, passengers and airport staff will be able to purchase stuff at the new stores before their flight. After doing some shopping, the boarding gates wait ahead. There are now 18 gates, which were 8 before the redevelopment. For this reason, the walkway installed between the gates has been replaced for a sky train, which will be able to transport people along the different gates. But if you're not leaving the South West airport, you'll be glad to know the arrivals area has also been redeveloped. After going through passport control customs, passengers and airport staff will be able to hire different services. This area was empty before the redevelopment, but now it has an ATM, a cafe and a car hire service that will gladly take you to your destination.`

const task2ModelAnswer = `This is an answer written by a candidate who achieved a Band 7.0 score.

Today high levels of sugar are contained in many sources of food, especially in manufactured food. And, of course, eating so much sugar is not good for our health: it can cause just a simple cavy, for example, but also worse problems, like the increasing level of sugar in blood. Some people suggest that sugary products should be more expensive, so people would buy less of them.

According to me, I think that this solution is not the best one as sugary products include some types of food that we eat everyday, such as bread or pasta. This foods, particularly the first one, are really important in our diet, so make them more expensive will influence not only our lifestyle, but also some people wouldn't be able anymore to buy the most important food for them. Just think for example to poor people, who can maybe afford a few loads of bread per day: what would they eat if we increased bread price?

I think that the best solution for this problem would be informing people about what they eat, because sometimes we don't even know that. They have already done something to inform people about the characteristics of food, of course, and labels are one of the most important thing, as they tell you all the ingredients of a particular food. They probably don't know the biggest part of the substances named in the list, as not everybody knows that there is a specific order of the ingredients in the list. So something we could do is organizing some "talks" to inform people not only about the function of labels, but especially about the big amount of sugar we eat everyday. I think as well that this talks should be organised also in schools, because also children must be aware of what they eat; besides, children can tell what they have learned by these "conferences" at their parents, so the whole family would eat better.

To sum it up, I think that it is not necessary to increase the prices of sugary food and that all we need is information, that will lead people to eat less sugary food and, as a consequence, live better with less problems.`

export default function Book16WritingTest3() {
  const task1Question = "The plans below show the site of an airport now and how it will look after redevelopment next year. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Many manufactured food and drink products contain high levels of sugar, which causes many health problems. Sugary products should be made more expensive to encourage people to consume less sugar. Do you agree or disagree?";

  return (
    <WritingTestTemplate
      bookNumber="16"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book16/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
