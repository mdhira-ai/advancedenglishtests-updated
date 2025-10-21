import WritingTestTemplate from '@/components/test/WritingTestTemplate'


 
const task1ModelAnswer = `The provided bar chart depicts the comprassion of buying or renting houses in England and Wales from 1918 to 2011.

1918 the rented households was raised about 78 percentage. Than it leveled of between 1939 to 1959. From 1961 to 1981 it dramaticly dropped to 35 percentage. This accommodation stated the same until 2001. In 2011 there was a slight increase in rented households and it was up to 38%.

The same year the owned ones has raise from 21% to 32% in 1918 to1959. In 1939 to 1959 the was a gradualy raise in the percentage than it starts to leveled up to 69% in 1991. At 2001 to 2011 there was a decline in the owned accommodation and it was 62%.

Genarally, both of the rented and owned households has raised and droped throug the years from 1918 to 2011. This was a year that the were the same prectarge and it was 1971 which 50%.`

const task2ModelAnswer = `The answer is complex since there are a lot of choices in our life and all of them are different kinds. In some cases I would say that it is a good thing to have the ability to choose from a wide variety, take for example gastronomy. Could single person has different tastes on their list of favourite food. Actually if you have a big family, it's almost impossible to cook something that everyone would like. Therefore I would say that it is great that you can go to a shopping center and choose from a dozen different food types. I can always find something that looks delicious.

Naturally, there are some people who say that it is against it, because they claim to go that back in that happy past we had a perfect life, when naturally everybody was farmer. I personally disagree with that. I am happy that I could choose a job that best fit to my abilities. I mean no one is the same, why should we want to do the same? Different kinds of universities give us the opportunity to become who we are meant to be. We have the choice to move.

However there is one topic where, according to my opinion, we have too many choices. This specific area is television. There are hundreds of channels, therefore you can always find something that is worth watching. Lately you could just sit in your living room your whole day, when I think that other outdoor activities are healthier than the results of the many available channels. From this point of view I would agree that we have too many choices.

In conclusion I would say that we can't generally talk about choices since they could be different. In some cases it is good to have many of them while in other areas they could have a negative effect.`

  

export default function Book13WritingTest2() {
   const task1Question = "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
    
      const task2Question = "Some people believe that nowadays we have too many choices. To what extent do you agree or disagree with this statement?";
     
  return (
    <WritingTestTemplate
      bookNumber="13"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}



   