import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The diagram illustrates the process by which a geothermal power plant generates electricity using heat from the Earth. The process involves five main stages, from pumping cold water down into the ground to distributing the generated electricity.

The process begins when cold water is pumped from a surface source down 4.5 kilometres into the ground via an injection well. In the second stage, this water passes through a geothermal zone of hot rocks, where it is heated.

In the third stage, the resulting hot water is pumped back up to the surface through a production well. This hot water is then directed to a condenser, where it turns into steam.

The fourth stage involves this steam being used to spin a turbine. In the fifth and final stage, the spinning turbine powers a generator, which produces electricity. This electricity is then transmitted to the power grid via transmission towers. The steam from the turbine is then condensed back into water and the cycle can repeat.`

const task2ModelAnswer = `The extent to which children should be granted autonomy in their daily choices is a fundamental question in parenting and education. One perspective warns that excessive freedom in matters like food, clothing, and entertainment will breed a generation of self-centered individuals. The opposing view holds that making such decisions is a crucial part of a child's development. In my opinion, a balanced approach is required; while granting complete autonomy is unwise, providing structured opportunities for choice is essential for raising well-adjusted adults.

The concern that unrestricted choice leads to selfishness is certainly valid. If children are always allowed to prioritize their own immediate desires—for example, choosing to eat only sweets or watch television instead of doing homework—they may fail to develop self-discipline and an understanding of long-term consequences. This could foster a sense of entitlement and a lack of consideration for the needs and wishes of others, potentially leading to difficulties in social and professional relationships later in life. A society composed of such individuals would likely struggle with cooperation and collective responsibility.

However, the argument for allowing children to make decisions is equally powerful. Making choices about matters that affect them is a fundamental way for children to develop a sense of identity and agency. When a child chooses their own clothes, for instance, they are expressing their personality. When they select a hobby, they are discovering their interests. This process of decision-making is vital for building confidence, problem-solving skills, and a sense of responsibility for one's own actions. Denying children these opportunities can lead to dependency and a lack of initiative in adulthood.

I believe the most effective approach is guided autonomy. Parents and educators should provide a framework of safe and acceptable options from which a child can choose. For example, instead of asking "What do you want for dinner?", a parent could offer a choice between two healthy options. This respects the child's desire for input while ensuring a nutritious outcome. As children mature, the scope of their choices can be gradually expanded. This method teaches decision-making skills within safe boundaries, fostering both independence and an understanding of responsibility.`

export default function Book12WritingTest4() {


      const task1Question = "The diagram below shows how geothermal energy is used to produce electricity. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
    
      const task2Question = "Some people believe that allowing children to make their own choices on everyday matters (such as food, clothes and entertainment) is likely to result in a society of individuals who only think about their own wishes. Other people believe that it is important for children to make decisions about matters that affect them. Discuss both these views and give your own opinion.";
    
  return (
    <WritingTestTemplate
      bookNumber="12"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book12/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}




