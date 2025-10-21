import WritingTestTemplate from '@/components/test/WritingTestTemplate'


 
const task1ModelAnswer = `The two maps illustrate the current layout of the town centre of Islip and a proposed plan for its future development.

Overall, the development plan envisages a significant transformation of the town centre from a simple, linear layout into a more integrated, pedestrian-focused area with new facilities and a circular road system.

Currently, Islip town centre is bisected by a main road running east-west, lined with shops on both sides. To the south of this road, there is a school and a large housing area, with a park to the east. The area to the north of the main road is countryside.

The proposed plan introduces a dual carriageway that will bypass the town centre in a large ring. The existing main road will be converted into a pedestrian-only street. The current shops will be consolidated into a new shopping centre, which will also feature a bus station and a car park. Significant changes are planned for housing, with a new housing area to be built where some of the northern shops currently stand, and another new housing development replacing a portion of the park. The existing park will be reduced in size to accommodate this new housing.`

const task2ModelAnswer = `The demographic structure of a nation, particularly the balance between its youth and elderly populations, has profound implications for its social and economic future. In several countries, a "youth bulge" is evident, where young adults form a relatively large segment of the population. While this demographic profile presents certain challenges, I firmly believe that its advantages, such as economic dynamism and innovation, significantly outweigh the disadvantages.

One of the main disadvantages associated with a large youth population is the strain it can place on public services and the job market. A large cohort of young people requires substantial investment in education and healthcare. Furthermore, when these individuals enter the workforce, there can be intense competition for jobs, potentially leading to high rates of youth unemployment. This can, in turn, contribute to social unrest and emigration, as skilled young people seek opportunities elsewhere. This "brain drain" can hamper a country's long-term development.

However, the advantages of a youthful population are more compelling. A large number of young adults represents a vibrant and dynamic workforce, which can fuel economic growth. Young workers are often seen as more adaptable to new technologies and more willing to embrace innovation, making the country more competitive on a global scale. This demographic dividend can lead to increased productivity and a larger tax base to support the aging population and fund public services.

Moreover, a youthful society is often a hub of creativity and cultural energy. Young people drive trends in music, fashion, and technology, and are often at the forefront of social and political change. This dynamism can make a country a more exciting and progressive place to live.

In conclusion, while managing the educational and employment needs of a large young adult population is a significant challenge, the potential benefits are immense. The economic vitality, innovative capacity, and cultural dynamism that a youthful demographic brings are powerful assets for any nation. Therefore, the advantages of this situation decidedly outweigh the disadvantages.`

 

export default function Book12WritingTest2() {
     const task1Question = "The maps below show the centre of a small town called Islip as it is now, and plans for its development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
  
      const task2Question = "At the present time, the population of some countries includes a relatively large number of young adults, compared with the number of older people. Do the advantages of this situation outweigh the disadvantages?";
     
  return (
    <WritingTestTemplate
      bookNumber="12"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book12/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


