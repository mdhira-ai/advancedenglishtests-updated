import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The two tables provide sales figures for Fairtrade-labelled coffee and bananas in five European countries in the years 1999 and 2004. The sales are measured in millions of euros.

Overall, sales for both products increased in the majority of the countries listed, with some experiencing dramatic growth. Switzerland was the clear leader in banana sales, while the UK became the dominant market for coffee by 2004.

For coffee, all five countries saw a rise in sales. The most remarkable increase occurred in the UK, where sales surged from 1.5 to 20 million euros. Switzerland also saw its sales double from 3 to 6 million euros. Growth was more modest in Denmark, Belgium, and Sweden, with sales in these countries remaining below 2 million euros in both years.

The trend for bananas was more varied. Switzerland's sales were by far the highest, rocketing from 15 to 47 million euros. The UK and Belgium also experienced growth, albeit on a much smaller scale. Conversely, Denmark saw a significant fall in banana sales, halving from 2 to just 0.9 million euros. Sweden's sales also declined slightly over the period.`

const task2ModelAnswer = `The debate over the direction of university education is a central one in modern society, pitting personal passion against pragmatic utility. One perspective champions the freedom for students to pursue any subject they desire, while the other advocates for a focus on subjects deemed beneficial for the future, like science and technology. This essay will examine both viewpoints before arguing that a balanced approach, which values all disciplines, is ultimately the most beneficial for both individuals and society.

The argument for unrestricted choice in higher education is rooted in the ideals of personal development and intellectual curiosity. Proponents believe that when students study subjects they are passionate about, they are more engaged, creative, and likely to excel. This approach fosters a diverse and well-rounded society, rich in arts, humanities, and social sciences, which are crucial for cultural vitality and critical thinking. Forcing students into 'useful' fields they dislike could stifle innovation and lead to a workforce that is competent but uninspired.

Conversely, the view that universities should prioritize science and technology is driven by economic and practical concerns. In a rapidly advancing world, nations require a skilled workforce in STEM fields to drive innovation, solve complex problems like climate change, and maintain a competitive edge. From this perspective, allowing too many students to study subjects with limited direct job prospects is seen as a misallocation of resources, both for the individual who may struggle to find employment and for the state that often subsidizes their education.

In my opinion, both arguments hold some validity, but a society that solely prioritizes vocational subjects would be culturally and intellectually impoverished. While the need for scientists and engineers is undeniable, we also need historians, artists, and philosophers to help us understand our world and ourselves. The ideal solution is not to restrict choice but to better integrate different fields of study. Universities could encourage interdisciplinary programs and emphasize the transferable skills—such as critical analysis and communication—that are gained from all subjects. Ultimately, allowing students to follow their passions, while also providing clear guidance on career pathways for all disciplines, creates the most dynamic, innovative, and fulfilled society.`

  
export default function Book10WritingTest2() {
    const task1Question = "The tables below give information about sales of Fairtrade-labelled coffee and bananas in 1999 and 2004 in five European countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
     
      const task2Question = "Some people think that all university students should study whatever they like. Others believe that they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology. Discuss both these views and give your own opinion.";
     
  return (
    <WritingTestTemplate
      bookNumber="10"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book10/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


