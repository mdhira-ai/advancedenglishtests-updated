import WritingTestTemplate from '@/components/test/WritingTestTemplate'



   
      
     
const task1ModelAnswer = `From the bar chart that show the top ten countries for the production and consumption of electricity in 2014. For the production of electricity, the 1st rank is China that have 5,398 billion kWh, the 2nd rank is United States that have 4,099 billion kWh, the 3rd rank is Russia that have 1057 billion kWh, the 4th rank is Japan that have 936.2 billion kWh, the 5th rank is India that have 871 billion kWh, the 6th rank is Canada that have 618.9 billion kWh, the 7th rank is France that have 561.2 billion kWh, the 8th rank is Brazil that have 530.7 billion kWh, the 9th rank is Germany that have 526.6 billion kWh and the 10th rank is Republic of Korea that have 485.1 billion kWh.

For the consumption of electricity, the 1st rank is China that have 5,322 billion kWh, the 2nd rank is United States that have 3,866 billion kWh, the 3rd rank is Russia that have 1,038 billion kWh, the 4th rank is Japan that have 856.7 billion kWh, the 5th rank is India that have 698.8 billion kWh, the 6th rank is Germany that have 582.5 billion kWh, the 7th rank is Canada that have 499.9 kWh, the 8th rank is Brazil that have 455.8 kWh and the 10th is Republic of Korea that have 449.5 billion kWh.

From the information, The country that have the most production and consumption is China. The country that have the least in production and consumption is Republic of Korea. Almost all the country have production more than consumption, except Germany that have consumption more than production.`

const task2ModelAnswer = `In my opinion I think every subjects is important for us, we have to learn everything through our full stops. Some people say that history is one of the most important school subjects it's true but it has to go along with today's world which is science and technology. How can we move without our history, the people before us, the ancient people is the most powerful people who helps us to move forward, to know how we can live better lives, to know how to live with other and animals, how to survive and others. Of course we wouldn't know that without them.

Science and Technology are important too. They give us a chance to move forward with them, without Science and Technology we just basically live in the stone age period of our life with no useful, without them we have no light we have no food, we have no confortable stuff and things. Old people can survived without these things, humans creates lots of invention to give an unlimited wants of people.

May I give one example of the development of science and technology. With this two things it give us a chance to be a member of ASEAN 'Association of South East Asia Nation' we can be able to communicate with the other 9 countries with the high technology it help us to be a TEAMWORK with the other countries to develop our country in term of transportaion, communication, collaboration etc. it can definitely hold on to that hope that in the near future.

Overall economics can totally achieves. it is a fact that the member of the ASEAN have differences in term of political standing, culture and traditions but it's not a problem with our help to know that there's a bright future are waiting for all of us. and that is a reason why history, science and technology is important. We use History to learn about others, their culture, their tradition to be understand each other more and more and using science and Technology to help us, our country, our world to be moving forward to help each other and to give a bright future and future for everyone. especially kids have a chance to travel, to study, to get known for the next hundred years, twenty years to the new up coming year all of them can help each other to pass these chances to other kids go on and on.`


export default function Book13WritingTest3() {

      const task1Question = "The bar chart below shows the top ten countries for the production and consumption of electricity in 2014. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
      
      const task2Question = "Some people say History is one of the most important school subjects. Other people think that in today's world, subjects like Science and Technology are more important than History. Discuss both these views and give your own opinion.";
     
  return (
    <WritingTestTemplate
      bookNumber="13"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


