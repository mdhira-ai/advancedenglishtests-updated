import WritingTestTemplate from '@/components/test/WritingTestTemplate'


  
const task1ModelAnswer = `The bar chart provides data on the percentage of Australian men and women across six different age groups who engaged in regular physical activity in 2010.

Overall, men were generally more physically active than women in the younger age brackets, but this trend reversed for the older age groups. The highest participation for both genders was observed in the 45-54 and 55-64 age categories.

In the youngest group, 15 to 24, 52.8% of men were regularly active, compared to a lower 47.7% of women. This gap narrowed in the 25-34 age group. The lowest participation rate for men was seen in the 35-44 bracket, at 39.5%, which was significantly lower than the 52.5% for women in the same group.

From the age of 35 onwards, women consistently showed higher rates of physical activity than men. Participation for women peaked at 53.3% in the 55-64 age group, while for men the peak was slightly lower at 53.1% in the 45-54 bracket. Interestingly, in the 65 and over category, the participation rates for both genders were almost identical, at 46.7% for men and 47.1% for women.`

const task2ModelAnswer = `The question of how freely information should be shared in critical fields like scientific research, business, and academia is a complex and enduring debate. One perspective champions open access, believing it accelerates progress, while the other argues for restriction, citing the value and importance of certain information. This essay will explore both views, ultimately contending that while some controls are necessary, the broader benefits of open collaboration and information sharing are more significant.

The argument for restricting access to information is often based on principles of security, intellectual property, and commercial advantage. In the business world, proprietary information such as trade secrets or product designs is the lifeblood of a company's competitive edge. Sharing this freely would be commercial suicide. Similarly, in scientific research, premature disclosure of data could compromise the integrity of a study or allow others to claim credit for a discovery. National security concerns also necessitate that certain governmental and scientific information remains classified. In these contexts, information is a valuable asset that requires protection.

On the other hand, the case for sharing information as widely as possible is equally, if not more, compelling. In science and academia, collaboration is the engine of discovery. When researchers share their data and findings, it allows for peer review, prevents duplication of effort, and enables others to build upon their work, accelerating the pace of innovation. The Human Genome Project is a prime example where international, open collaboration led to a monumental achievement in a fraction of the time it would have taken competing, secretive groups. In business, open-source software like Linux has demonstrated that a collaborative model can create robust, secure, and highly valuable products.

In my opinion, the ideal approach lies in a balanced model. While I acknowledge the need to protect commercially sensitive data and national security secrets, the default position, particularly in academic and fundamental scientific research, should be towards openness. The benefits of accelerating human progress, solving global challenges like climate change and disease, and fostering a more educated global populace far outweigh the risks. Therefore, information that is crucial for the common good should, wherever possible, be shared freely, while acknowledging that a framework to protect individual and commercial rights is also necessary.`

  

export default function Book12WritingTest1() {
    const task1Question = "The bar chart below shows the percentage of Australian men and women in different age groups who did regular physical activity in 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
     
      const task2Question = "Some people believe that it is good to share as much information as possible in scientific research, business and the academic world. Others believe that some information is too important or too valuable to be shared freely. Discuss both these views and give your own opinion.";
    
  return (
    <WritingTestTemplate
      bookNumber="12"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book12/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


 