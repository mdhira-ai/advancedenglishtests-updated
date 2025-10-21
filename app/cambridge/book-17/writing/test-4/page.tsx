import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The line graph shows trends in shop closures and openings of new shops in a particular country between the years 2011 and 2018.

In 2011 approximately 6,400 shops closed. The number of closures fluctuated over the next four years until 2015, when there was a dramatic fall in closures to roughly 700 shops. The following year the number of shops closing their doors rose sharply, reaching over 5,000. The figures remained steady for the next two years, with just over 5,000 closures in 2018.

The number of new shops opening decreased dramatically between 2011 (approximately 8,500) and 2012 (just under 4,000) but rebounded by roughly 50% by 2014. In 2015, the number of openings then fell to the 2012 level, but remained stable for the next two years. The last recorded year, 2018, saw a further fall to 3,000 new openings, the lowest point in this seven year period.

Overall, the number of shop closures has remained within the 5,000 to 7,000 range (with the exception of 2015). In contrast, new shop openings have shown a wider range of figures, but generally indicate a downward trend over the same period.`

const task2ModelAnswer = `Since ancient times people tried to treat themselves by herbals and another natural products. In these days this type of treatment is named as alternative medicine. Nowadays, more and more people with some diseases decide to use alternative medicines instead of classic medicine. In this essay I will try to discuss pros and cons.

In my opinion, the disadvantages outweigh the advantages of using traditional medicine. The first reason is that nobody knows how this treatment will affect to a person's health. There are a lot of cases when using different herbals caused allergic reaction and some people dead. The next reason is that people who do not have any medical education try alternative medicines. They do not know what the result will be and hope that it will be positive but not always is like that.

Although there are a lot of disadvantages, advantages might make people not go to usual doctor. The first and the main pro is that using herbals does not cause environmental problems such as air pollution or gas waste. Many pharmaceutical plants use chemicals which have harmful affect on the environment. The other reason is that alternative medicines are usually much cheaper than usual treatment as you do not have to go to pharmacy and buy expensive drugs.

To sum it up, the alternative treatment will be forever because it has some advantages which many people think that they can outweigh the disadvantages but I do not think so. The conventional medicine which develops rocketly will drive out other types of treatment in the future.`

export default function Book17WritingTest4() {
  const task1Question = "The graph below shows the number of shops that closed and the number of new shops that opened in one country between 2011 and 2018. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Nowadays, a growing number of people with health problems are trying alternative medicines and treatments instead of visiting their usual doctor. Do you think this is a positive or a negative development?";

  return (
    <WritingTestTemplate
      bookNumber="17"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book17/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
