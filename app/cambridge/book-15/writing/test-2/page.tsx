import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The graph displays the statistics of the number of tourists visiting a particular carribean island between the years 2010 and 2017. In the year 2010, there were a quarter of a million visitors that stayed on cruise ships, while another 750000 visitors were staying on island that totals up to a million of visitors during that year. The following year, which is 2011, half a million visitors stayed on cruise ships for the visitors who were staying on the island, the graph doesn't show and decrease or an increase because the number was the same as the previous year, which is 750000 visitors. Total visitors for that year was 1 million and a quarter visitors. Moving on, the number of visitors staying on cruise ships decreased to 250000 visitors in the year 2012 while the number of visitors staying on island increased to 1250000 people. This sums up to an amount of 1500000 visitors that year.

In the year 2013, 500000 visitors stayed on cruise ships while 150000 visitors stayed on island that adds up to 2 million visitors that year. During the next year which is 2014, a total at one million visitors stayed on cruise ships while the same number of visitors staying on island remained consistent which is 1500000 people, totalling up to two million and a half visitors that year. For the year 2015, 1250000 visitors were staying on cruise ships and 1500000 tourists were staying on island, showing no changes from the previous year. The total of tourists in that year increased to 2750000 visitors. The total number of visitors remained the same in the following year which is 2016 where it summed up 1500000 visitors staying on cruise ships and 1250000 visitors staying on island. In the final year, 2017, the number of visitors staying on cruise ships and staying on island increase to two and a half million of visitors. The graph showed an increase of half a million for the number of visitors staying on cruise ships which totals up to two million visitors. As for the number of visitors staying on island, the graph also increased for a quarter million which adds up to a total of 1500000 visitors that year.

Through the years, the number of visitors staying on cruise ships showed an unstable increase and decrease for the first four years, but continued to increase in the next year onwards. As for the number of visitors staying on island, there was no progress of increase or decrease in the first two years which are 2010 and 2011 but the graph rose until it remained constant for three consecutive years in a row. The number of visitors then slacked off in the year 2016, but managed to increase to the same level as the year before the previous in 2017. All in all, the graph showed an outstanding performance for the total number of visitors throughout 2011 to 2017, where it increased gradually every single year except from 2015 to 2016 where it remained constant.`

const task2ModelAnswer = `Todays technologies enable us to read book on electronic devices and what's more, we can store hundreds of thousands of books on devices like Amazon's kindle e-reader. This makes some people to believe that people will stop printing books and in the future, everything will be digitalized.

Electronic books and newspapers have many advantages. They are easy to use and rech. They can be stored in computers, mobiles, e-readers and in cloud in huge amounts and are available at any time. The cost of manufacturing and printing is completely removed, which reduced their price. Digital book and newspapers also have one very important advantage - they are environmentally friendly. No paper is used to print magazines and books which means less trees are cut from our forests to produce papers. All of these factors convinced many people that digital versions of books and magazines is more convenient, ethical and cheaper choice.

On the other hand, traditional printed books and magazines have existed for centuries and I believe they have created some kind of emotional connection and value for people, when a man reads a book and he likes it, he most probably would like to have it in a form of a tangible thing. Books are a form of art, like statues and paintings. You can have a picture of some famous painting, but the same picture has some intangible value. Magazines and newspapers do not have such a value in themselves.

Based on this, I believe that the amount of books are printed will decrease considerably and maybe even dramatically, however printed, tangible books will still be demanded by many people as they have some aura and value in addition to the things that are written inside.

I do think though, that there is a big chance magazines and newspapers will move into the online world completely. This is because they are published in huge numbers daily and weekly and monthly and no one needs them after years. Printing so huge amount of articles will demand additional recources and make them less competitive even in terms of price.`

export default function Book15WritingTest2() {
  const task1Question = "The graph below shows the number of tourists visiting a particular Caribbean island between 2010 and 2017. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying. To what extent do you agree or disagree with this statement?";

  return (
    <WritingTestTemplate
      bookNumber="15"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book15/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
