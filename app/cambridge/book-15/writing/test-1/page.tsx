import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The table depicts the outcomes of a questionare of how often people buy and drink a different types of coffee in Sydney, Melbourne, Brisbane, Adelaide, and Hobart of Australia.

The first option is bought fresh coffee in last 4 weeks. In Sydney has 43.7 per cent of city residents and has almost the same amount as Melbourne which is 42.2 per cent. Brisbane and Adelaide have a nearly same amount, 34.2 per cent and 34.4 per cent. Next, Hobart has 38.3 per cent.

The second line is bought instant coffee in last 4 weeks. Brisbane has 52.6 per cent. Other two cities that have amost the same number are Adelaide, 49.8 per cent, and Melbourne, 48.3 per cent. The lowest number is 45.5 per cent of Sydney and The highest number is 54.1 per cent of Hobart.

The last option of the survey shows the percentage of city residents that went to a cafe' for coffee or tea in last 4 weeks. In Sydney, people went to a cafe' for coffee or tea in last 4 weeks 61 per cent of city residents. In Brisbane, citizens went to a cafe' for coffee of tea in last 4 weeks 55.4 per cent. The lowest is Adelaide that shows 49.9 per cent of city residents. In Hobart, people went to a cafe' for coffee of tea in last 4 weeks 62.7 per cent. The highest is Melbourne that shows 63.3 per cent.

In conclusion, the highest number of the survey is the percentage of city residents that went to a cafe for coffee or tea in last 4 weeks because it shows almost the highest percentage in 3 types.`

const task2ModelAnswer = `In some countries the ownership of peoples' home is an important matter. In these countries it is very important to own your own home rather than renting it. It might be indifferent for some, but for these people it matter.

Why is that the case? You might wonder. I think it is because your home is supposed to be exactly what it sounds like, your home. As a human I think we long after having stuff to call our own, doesn't matter what it is, but humans will always want to claim ownership. This is nothing new and it has been like this through human history, like colonies for example, which later once again became the same country as before lead by its own inhabitants. People will always want to be the one to decide what happens to them and when you rent your home you can't even paint it without the owners permission.

If you as a person are renting an apartment there might be a lot of stressors in your life. A scratched wall can cause you a major headache, because the wall was not yours. The bedroom you are currently sleeping in might not be available as long as you hope, things happen in life and maybe the next landlord won't want to have you as a tenant.

In other perspective, not owning your home could be a relief when it comes to your finance. As a renter you don't have to pay mortgage, take loans or spend an awful lot of money on buying the property. You wouldn't have to worry about the house market crashing or a natural disaster destroying your expensive home.

Bottom line, as a human I feel like we need to have a home and calling it your own can make that more special. I personally would rather own my house, because then whatever happens it is on me and no one else.`

export default function Book15WritingTest1() {
  const task1Question = "The chart below shows the results of a survey about people’s coffee and tea buying and drinking habits in five Australian cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "In some countries, owning a home rather than renting one is very important for people. Why might this be the case? Do you think this is a positive or negative development?";

  return (
    <WritingTestTemplate
      bookNumber="15"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book15/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
