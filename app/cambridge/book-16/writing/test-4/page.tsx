import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `This is an answer written by a candidate who achieved a Band 5.5 score.

Plastic bottles are one of the most materials used in the world, and recycling is a really important subject to try to minimize the waste.

Around the streets, in front off houses and restaurants is possible to see some bins, to collect organic and recycle waste. The yellow in is the correct one to trash recycle things, such as plastic bottles. After trashed, a truck collects at least once a week and leave in a specific place to separate what is recycleble and what is not. For that reason, is really important to separate before trash, this means someone will not spend to many time separating.

Recycling is a big process, after separated the waste should be compressing in blocks to facilitate the crushing and washing process, that should be done because to many durty come with the bottles and crushing it makes easier to produce a new material.

Crushed, washed and then going to the production of plastic pellets, it is can be finally heated to form a raw material.

But what can be produced using recycled bottles? New bottles, containers, bags, T-shirts, pen, toys and to many other things.

Searching, it is possible to see how big is the waste problem around the world and how not to many governments invests in this situation. Starting into the houses, avoiding to use plastics in excess and separating the correct things in the correct bins, is a good way to keep the environment safe.`

const task2ModelAnswer = `This is an answer written by a candidate who achieved a Band 4.0 score.

The Advanteg of Driveles Vehicles

First of all number of vehicles is incarese day after day which means ever day the world gets more drivers then before. If we admite that alots of people prefer to use public transport we do not have any doubts that many people use the vehicles because of advantage of driving.

The history shows us that the human like to move from place to another for many reasns and the always fell pleased when the rid. this days people have all kind of vehicles bicks, cars, motor...etc because they all have a different advantage.

people needs also can not meet at be found in one pleace for that reason people need to move from a plece to another place to meet thier needs which means the advantage of moving from point to anther point will be exist for ever.

World has bee changed a lot and many people have got great jobs with big salaries. The can easly fund thier vehicl and because people get feeling boring if the used to some thing they always perefer to chang thier vehicle from time to time.

Finally I think it is very hard to believe that the driverless vehicles with outweigh the disadvantages because people always find drive more and more give thier life meaning and add more advantage to it all kind of vehicles give happeness to a lot of people that they can not think about lossing it.`

export default function Book16WritingTest4() {
  const task1Question = "The diagram below shows the process for recycling plastic bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "In the future all cars, buses and trucks will be driverless. The only people travelling inside these vehicles will be passengers.Do you think the advantages of driverless vehicles outweigh the disadvantages?";

  return (
    <WritingTestTemplate
      bookNumber="16"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book16/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}