import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `This charts shows about percentage of households with electrical appliances and Number of hour at housework per week, per household between 1920 and 2019.

In the first chart washing machine, Refrigerator, Vacuum cleaner all rise from 1920 to 2019. Refrigerator and Vacuum cleaner increase faster than washing machine. In 1920, Refrigerator just zero percentage of households and Refrigerator is 30 percentage of households, but in 2019 they all increase 100 percentage of household. washing machine is 10 percentage of households in 1920, however in 2019 is just increase about 15 percentage at households, and washing mashine is overed by Pefrigerator and Vacuum cleaner in 1940 and 1960. Vacuum cleaner is overed by Pefrigerator in 1942.

In the second chart Houses per week is 50 Number of hours per week, but it decline to 10 Number of hours per week in 2019.

Over than, percentang of households with electical appliance increase however Number of hours per week decline from 1920 to 2019.`

const task2ModelAnswer = `In our rather futuristic society for a number of reasons people are getting more interested in the past of their hometowns. With the help of rapidly ameliorating technology their desire to learn about the history can be easily put into life. But what are the roots of such an eagerness?

First of all, the hectic lifestyle that we all experience nowadays does not leave any space for calmness and peace in our souls, so most of the people - especially adolescence - are struggling with finding their feet, whilst having a broad spectrum of knowledge about the world around really gives a feeling of confidence in the impermanence of life. In addition to this, it is said that being aware of the past you can change the future. Consequently, if people want to live a better life in more comfortable environment, they have to explore the history of their homes in order not to repeat past mistakes.

For this aims we are lucky to have multiple tools to carry out research into the subject. Despite libraries being considered as an old-fashioned and not necessarily convenient approach of learning, there are actually quite a few books and magazines which are not available online but which are extremely helpful when it comes to the local interests. News, photos, articles and interviews with different people published in old magazines indeed provide with a clear image of past events. Brousing the internet forums is also a great idea to find new information and make friend with mutual objectives.

Putting everything into a nutshell, learning about the history of your place not only builds a sense of confidence but also might have a big impact on our future way of life.`

export default function Book16WritingTest1() {
  const task1Question = "The charts below show the changes in ownership of electrical appliances and amount of time spent doing housework in households in one country between 1920 and 2019. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "In some countries, more and more people are becoming interested in finding out about the history of the house or building they live in. What are the reasons for this? How can people research this?";

  return (
    <WritingTestTemplate
      bookNumber="16"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book16/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
