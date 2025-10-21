import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The graph shows changes in the gap between US energy consumption and production since 1950. It also estimates trends up to 2025.

Between 1950 and 1970 both production and consumption increased from just over 30 units to about 65, and the difference, which was marginal during this period, was consistently low. However, production only gradually increased over the next 30 years to reach only 70 units in 2000. In contrast, growth in consumption was steeper and more fluctuating, reaching 93 units by 2000. Energy imports needed to bridge this gap therefore increased from very little in 1970 to a substantial 25 units in 2000.

Projections up to 2025 indicate that this trend is likely to continue, with the gap between production and consumption widening. By 2025 it is expected that consumption will reach 140 units, while production will reach only 90, so more than 30% of energy consumed (50 units) will have to be imported.

Overall, the graph indicates that energy production in the US is not keeping up with consumption, so imports will continue to increase.`

const task2ModelAnswer = `It is certainly true that today traffic in cities throughout the world has become a major problem. This is obvious from the number of vehicles on our roads and the amount of pollution they cause. I agree that the problem is partly due to individuals travelling for work, study or shopping purposes, and it is the case that probably this is mainly due to this.

It is certain that this is one of the options IT gives us today. However, even if everyone had access to the technology and the opportunity to work from home, it is unrealistic to think that everyone would want to. Even though the technology for working, studying or shopping on-line makes this option a possibility, nevertheless it would mean less personal choice and less social contact in their whole life. This would have a large impact on society as a whole.

So, in conclusion, I think that while this practice could reduce the traffic problems in our cities, it is most unlikely to be an acceptable solution. In terms of other solutions, perhaps we need to think more carefully about facilitating public transport and limiting private transport in our city centres. The development of public transport that is not road-based, such as sky trains or subways, would probably be a more acceptable alternative measure to reduce jams on our roads.`

export default function BookPlus2WritingTest1() {
  const task1Question = "TThe graph below compares figures for the production and consumption of energy in the US from 1950 to 2000. It also predicts figures for 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "The only way to reduce the amount of traffic in cities today is by reducing the need for people to travel from home for work, education or shopping. To what extent do you agree or disagree?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-2"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}