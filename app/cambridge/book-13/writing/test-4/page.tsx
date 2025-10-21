import WritingTestTemplate from '@/components/test/WritingTestTemplate'



const task1ModelAnswer = `The two plans illustrate the layout of the university's sports centre at the present moment and the way it will look like after a reconstruction.

According to the new layout, the redeveloped sports centre is going to become bigger. First, the gym is going to be larger and an additional changing room is going to appear. Besides, there is going to be a cafeteria and two dance studios are going to be built. Apart from that, 2 dance studios are going to be built opposite the gym. Finally, the sports centre is going to get a new leisure pool. It is going to be located in the place where the outdoor courts used to be.

As can be seen from the first layout, both outdoor courts are going to be replaced by other facilities in the renovated sports centre. Furthermore, the sports hall is going to be smaller in the university sports centre. It is clear from the second layout that the redeveloped sports centre is going to be a fully indoor one.`

const task2ModelAnswer = `Nowadays many countries has been tried to develop the Advances inches to Solves the lack of food in the world by the way why many people around the world still go hungry. In my opinion, I think "Capitalism".

Under the "World Order" by USA in 1970 (the cold war) dovied the countries around the world in to 3 groups, 1) the first world like USA, UK, Japan like that. 2) the second word was like Soviet Union and 3) the third word was a devolping countries. I didn't think the capitalism is bad, I think it made many problems such as the lack of Food to the poor countries.

According to this is the economic, the developed countries have the absolute rights to take an advantage from the resoule in the devolping countries with the lowest wage, the hard working and the dangerous places working Hence, the people who live in the devolping countries has no oppotunities to build their own countries. The people who work with the lowest wage they go rice and make the product for example 1 dollar US per a day for 1 worker. 1 work go to rice and make the product to be selled, to the cap is approximate 99 dollar US goes to the owner who live in the developed countries.

The some of this problem, I think the government on each countries should guranted their citizen to have a basic rights, Food, Clear water and Education, for example. The highest price of food that restrize the poor people to access the food, the government need to bare the barrier pices of food won't be high.

In the long team of solving this problem, the goverment will give more Education fee as free for their citizen because I absolutly think that the lack of Education is the core of this problems. when the people has a high Education comes with a hire in a high working, then the goverment should bare the fee of household is not high as well. the people will be expenditure more. When the more expenditures the people have, the local income will increase. We have to solve this problem together, not the duty of some countries, the problem will be eradicated from the wild, I am as we have to have a hope to solve it, Not despair yet.`

    
export default function Book13WritingTest4() {

  const task1Question = "The plans below show the layout of a university's sports centre now, and how it will look after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
     
      const task2Question = "In spite of the advances made in agriculture, many people around the world still go hungry. Why is this the case? What can be done about this problem?";
   
  return (
    <WritingTestTemplate
      bookNumber="13"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}

