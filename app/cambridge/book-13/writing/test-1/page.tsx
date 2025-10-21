import WritingTestTemplate from '@/components/test/WritingTestTemplate'


 
const task1ModelAnswer = `The two maps illustrate the way to get to a City hospital of two different years (2007 and 2010).

According to both maps, there are two features which is city hospital that is sourrounded by Ring Road. In these two maps, there have been two features that still remained. This two features are City hospital and staff car park. Apart from these two features, there are some features that shows on 2010 map but not shows on 2007 map. This features are bus station, round-about and public car park. In the map of 2010 are public car park which located on the east-side of the city hospital. The further additional features are two around-turn on the hospital Rd, which can lead to the bus station.

Overall, there are two major features that never change on both 2007 and 2010 map these features are city hospital and staff car park. However, there are some additional features that appear on the map of 2010 but not on 2007. These features are public car park, bus station and two around-turns.`
   
const task2ModelAnswer = `It is clear that living in a foreign country has its own benefits and drawbacks to consider. I agree with this statement, however I think that anybody coming in another country should respect national culture. In this essay, I would like to outline the social and practical problems.

The social problem would be a language barrier. Such means that a person coming from another country who might not be able to speak and understand the language. Which meant is a problem as far a person is living in a country, and a person who came in the country. Another problem is cultural, this problem is to be considered. Other people might offend others with their behavior or language for example, some cultures like English people prefer to be very polite and say things differently from other cultures. The person who doesn't know how to behave in a particular culture might offend others around him.

The practical problems would be misunderstanding of culture. That means a person who visits other countries does not understand other culture and he behaves as he wants to. The second practical problem is finding a job. This problem to be solved, because people who live in a country and they were born in that country might not respect and not like the behaviour of a person who works in a restaurant, it might be because, the cultures are different.

To summarize, it can be said that there are a lot of misconceptions which people have when they come in a foreign country, and in my opinion from my personal experience people should educate themselves in order to know how to behave in different situations with different cultures.`

  

export default function Book13WritingTest1() {
   const task1Question = "The two maps below show road access to a city hospital in 2007 and 2010.Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

      const task2Question = "Living in a country where you have to speak a foreign language can cause serious social problems, as well as practical problems.To what extent do you agree or disagree with this statement?";
     
  return (
    <WritingTestTemplate
      bookNumber="13"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}



   
      
     