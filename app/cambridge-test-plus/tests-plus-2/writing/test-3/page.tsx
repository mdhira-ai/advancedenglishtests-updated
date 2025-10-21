import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The two diagrams give figures for water use in different parts of the world in 2000. The first indicates that almost three-quarters of world consumption (70%) was for agriculture, while 22% was used for industry and a mere 8% for domestic purposes. This pattern is almost identical to that for China in 2000, whereas India used even more water (92%) for agriculture and only 8% for industrial and domestic sectors. In contrast, New Zealand used almost equal proportions for agriculture and household use, 44% and 46% respectively, and a slightly higher 10% was consumed by industry. The pattern in Canada is almost the reverse of the world average, with a mere 8% water consumed by agriculture and a massive 80% by industry. Only 12% was used by the domestic sector, which was almost a quarter of the NZ industrial consumption. Overall, the data show that water use in the two developed countries is closer to the world patterns of consumption.`

const task2ModelAnswer = `I would agree that young people today play a bigger role in society than their parents or grandparents did. This is mainly due to the large social and technological changes that have increased the experience gap between the generations. For instance, young people today are generally better educated, and because they have been trained from a young age to use computer technology, they have internet access to information in a way that was unimaginable for earlier generations. This means that they are probably better informed than their parents or grandparents were at their age, and their hi-tech skills give them confidence in dealing with the very rapid changes in technology that are so uncomfortable for older people. In addition, younger people are often the most affected by globalisation. They follow fashions in clothes, music and social habits that are common among young people throughout the world. So they have become powerful consumers who influence big global markets today. As a result of all these developments, relationships with older people are often difficult. Teachers and parents are no longer treated with respect, and experience is undervalued because young people think they know everything, or at least can learn about everything from the Internet. In many cultures this has led to a lack of discipline in schools, family breakdowns and even serious social problems. However, the current generation gap is due to the responsibility of both younger and older generations. Both have to make efforts to understand each other and a good starting point would be for families to spend more time together than they perhaps do today.`

export default function BookPlus2WritingTest3() {
  const task1Question = "The charts below show water usage in five different countries in 2000. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Young people in the modern world seem to have more power and influence than any previous young generation. Why is this the case? What impact does this have on the relationship between old and young people?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-2"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
