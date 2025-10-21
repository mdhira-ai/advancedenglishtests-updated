import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The two pie charts illustrate how an average Australian household consumes energy and the proportion of greenhouse gas emissions that result from this usage.

Overall, heating and water heating are the two largest consumers of energy, together accounting for nearly three-quarters of the total. However, water heating is the single biggest contributor to greenhouse gas emissions.

Heating is the most significant use of energy in the home, responsible for 42% of consumption. Water heating is the second largest at 30%. In contrast, the emissions from these activities are 15% and 32% respectively, showing that water heating is less energy-efficient.

Other appliances make up 15% of energy use but are responsible for a much larger share of emissions, at 28%. This suggests these devices are also relatively inefficient. Refrigeration accounts for 7% of energy consumption but double that proportion of emissions at 14%. The most efficient areas appear to be cooling and lighting. Cooling uses 2% of energy and results in 3% of emissions, while lighting is responsible for 4% of energy use but generates 8% of emissions.`

const task2ModelAnswer = `The question of how to instill a sense of morality in children is a foundational aspect of parenting and education. The statement posits that teaching right from wrong is crucial and that punishment is a necessary tool in this process. While I wholeheartedly agree that a strong moral compass is vital, I believe that punishment, especially in its traditional forms, is not the most effective method and should be approached with great caution.

Instilling a sense of right and wrong from a young age is undeniably important. It forms the basis of a child's character and their ability to function as a responsible member of society. Early moral education helps children develop empathy, respect for others, and an understanding of consequences. Without this foundation, they may struggle to form healthy relationships and navigate social complexities.

However, I disagree that punishment is the primary or most necessary tool for this education. Over-reliance on punishment can teach fear rather than understanding. A child might avoid a certain behaviour simply to escape a negative consequence, not because they comprehend why the action is wrong. This can lead to resentment and a focus on not getting caught, rather than on developing an internal moral code.

Instead of traditional punishment, parents and teachers should focus on a range of more constructive methods. Positive reinforcement, where good behaviour is praised and rewarded, is often more effective in encouraging desirable actions. Furthermore, 'natural consequences' can be a powerful teacher; for example, if a child breaks a toy through carelessness, they learn the consequence is that they can no longer play with it. Dialogue is also critical; explaining why a certain behaviour is hurtful or wrong helps a child develop empathy and reasoning skills. Sanctions like a 'time-out' or temporary removal of privileges can be used, but they should be framed as opportunities for reflection rather than retribution. In conclusion, while setting clear boundaries is essential, the education of a child's conscience is better served by guidance, discussion, and positive reinforcement than by punitive measures.`


export default function Book10WritingTest1() {
      const task1Question = "The first chart below shows how energy is used in an average Australian household. The second chart shows the greenhouse gas emissions which result from this energy use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
    
      const task2Question = "It is important for children to learn the difference between right and wrong at an early age. Punishment is necessary to help them learn this distinction. To what extent do you agree or disagree with this opinion? What sort of punishment should parents and teachers be allowed to use to teach good behaviour to children?";
   
  return (
    <WritingTestTemplate
      bookNumber="10"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book10/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}

