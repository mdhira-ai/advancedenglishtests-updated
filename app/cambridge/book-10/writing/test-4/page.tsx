import WritingTestTemplate from '@/components/test/WritingTestTemplate'





const task1ModelAnswer = `The diagram illustrates the life cycle of the salmon, a large fish, detailing its journey through three distinct stages and environments.

The cycle begins in the upper reaches of a river, where the water is slow-moving. Salmon eggs are laid among reeds and small stones and incubate for approximately 5-6 months. Upon hatching, the young fish are known as 'fry' and are very small, measuring only 3-8cm.

For the next stage, the fry remain in fresh water, migrating downstream to the lower, fast-flowing part of the river. They spend about four years here, growing into 'smolt', which are significantly larger at 12-15cm.

After this period, the smolt migrate to the open sea. They spend around five years in the salt water environment, maturing into adult salmon. During this time, they reach their full size of 70-76cm. Finally, the adult salmon complete the cycle by swimming back upstream to their birthplace in the upper river to lay their own eggs, and the process begins anew.`

const task2ModelAnswer = `The issue of whether museums should charge for entry is a complex one, balancing cultural accessibility with financial sustainability. While many renowned institutions worldwide offer free admission, others rely on ticket sales to operate. Although charging for entry has clear financial benefits, I believe the advantages of free admission are more significant, and therefore the disadvantages of charging outweigh the benefits.

The primary advantage of charging an admission fee is the generation of revenue. Museums have substantial running costs, from preserving priceless artifacts to paying expert staff and maintaining large buildings. Ticket sales provide a crucial and direct income stream, reducing reliance on often unpredictable government funding or private donations. This financial independence can allow museums to fund new acquisitions, special exhibitions, and educational programs, thereby enhancing the visitor experience.

However, the principal disadvantage of admission fees is that they create a barrier to access. This can exclude individuals and families from lower-income backgrounds, as well as students and young people, from engaging with their cultural heritage. This is fundamentally at odds with the core mission of a museum, which is to educate and inspire the public. Free access ensures that culture is available to everyone, regardless of their financial situation, fostering a more inclusive and culturally literate society. Furthermore, free museums often attract more visitors, including tourists, which can have a positive knock-on effect on the local economy through spending in cafes and shops.

In my opinion, the societal benefit of universal access to culture and education is paramount. While the financial challenges are real, they can be addressed through other means, such as government support, corporate sponsorships, memberships, and prominent donation boxes. By making entry free, museums position themselves as essential public services, like libraries, enriching the lives of all citizens. Therefore, the disadvantages of creating financial barriers and limiting access to knowledge far outweigh the advantages of revenue generation.`

   
  
export default function Book10WritingTest4() {

      const task1Question = "The diagrams below show the life cycle of a species of large fish called the salmon. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
     
      const task2Question = "Many museums charge for admission while others are free. Do you think the advantages of charging people for admission to museums outweigh the disadvantages?";
   
  return (
    <WritingTestTemplate
      bookNumber="10"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book10/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}

