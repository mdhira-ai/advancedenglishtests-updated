import WritingTestTemplate from '@/components/test/WritingTestTemplate'

  
const task1ModelAnswer = `The two pie charts compare the foreign language abilities of British students at a particular university in 2000 and 2010.

Overall, the proportion of students with some foreign language skills increased over the decade, with a notable rise in those speaking Spanish. Conversely, the percentage of students with no second language ability halved.

In 2000, one-fifth (20%) of the students could not speak any language other than English. This figure dropped significantly to just 10% by 2010. The most popular language in 2000 was Spanish, spoken by 30% of students, and its popularity grew further to 35% in 2010, making it the largest single category.

In contrast, the proportion of students speaking French only saw a decline from 15% to 10%. The percentage for German only also remained low at 10% in both years. The category of "Another language" saw a positive change, increasing from 15% in 2000 to 20% in 2010. Finally, the proportion of students proficient in two other languages remained constant at 10% across the decade.`

const task2ModelAnswer = `The issue of household waste and recycling has become a critical environmental concern in many countries. While public awareness campaigns and voluntary schemes have had some success, many argue that legal enforcement is the only truly effective solution to boost recycling rates. While I agree that laws are a powerful and necessary tool, I do not believe they are the *only* way; a comprehensive strategy combining legislation with education and improved infrastructure is needed.

On the one hand, making recycling a legal requirement has clear advantages. Laws provide a clear framework and set definitive targets that individuals and municipalities must meet. The introduction of fines or penalties for non-compliance can be a powerful motivator, compelling people who might otherwise not bother to sort their waste correctly. This approach can rapidly change behaviour on a large scale, leading to a significant and immediate increase in the amount of waste being diverted from landfills. For example, countries like Germany and Switzerland, which have strict recycling laws, consistently achieve some of the highest recycling rates in the world.

However, relying solely on legislation can be problematic. It can be perceived as authoritarian and may breed resentment if the public does not understand the reasons behind the laws. Furthermore, laws are only effective if they are properly enforced and supported by the necessary infrastructure. If a government mandates the separation of five different types of waste but local councils do not provide the corresponding bins or collection services, the law becomes impractical and will ultimately fail.

Therefore, other measures are equally crucial. Continuous public education is vital to foster a genuine environmental consciousness, so that people recycle because they want to, not just because they fear a fine. Investing in convenient and accessible recycling facilities is also key. For instance, implementing "pay-as-you-throw" schemes, where households are charged for the amount of non-recycled waste they produce, can provide a financial incentive that complements legal requirements. In conclusion, while I believe that laws are an essential component in compelling people to recycle more, they must be part of a broader strategy that includes education, incentives, and robust infrastructure to be truly successful.`


export default function Book11WritingTest2() {

      const task1Question = "The charts below show the proportions of British students at one university in England who were able to speak other languages in addition to English, in 2000 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
    
      const task2Question = "Some people claim that not enough of the waste from homes is recycled. They say that the only way to increase recycling is for governments to make it a legal requirement. To what extent do you think laws are needed to make people recycle more of their waste?";
     
  return (
    <WritingTestTemplate
      bookNumber="11"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


 