import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The chart demonstrates what Anthropology graduates from one university did after finishing their undergraduate degree course. The table indicates the salaries of the anthropologists in work after 5 years.

As we can see from the pie chart, majority of Anthropology graduates are employed. Fifty-two per cent of them have a full-time job. Almost twenty per cent of graduates have either a part-time work or it is combined with post grad study. Eight per cent of students continue their full-time education. Only twelve per cent of graduates are unemployed. The information about all the rest graduates is unknown.

Thus, most of Anthropology graduates have a job. Half of those who work in Government sector earn more than a hundred thousand dollars. it is less than proportion of freelance conscultants who get the same amount of money. Besides, it is only one-third of those who work in private companies. We can see nearly the same percentage of those who get from fifty thousand dollars to ninty-nine thousand dollars as freelance consultants and in government sector. The situation is different in private companies. More of them get from fifty thousand to seventy-four thousand dollars than from seventy-five to ninty-nine thousand dollars. The proportion of those who work for private companies for from twenty-five to forty-nine thousand dollars is half bigger than the same one in government sector and as freelancers.

So, the chart and the table show us that most of Anthropology graduates are employed and a salary more than twenty-five thousand dollars after five year's work.`

const task2ModelAnswer = `Is it right to tell children they can achieve anything by trying hard? In some cultures, children are often told that they can achieve anything if they try hard enough. Giving this message to them can produce several effects on each child.

In the social point of view, telling this to children is very important because we are motivating the child not to give up. We are making him to try hard, to make an effort, to read between lines and at the end of that long path achieve their objectives. Telling that they can achieve anything if they try hard enough, we are saying in other words that things are not so simple or easy but they are not impossible, is all about working hard and doing our best.

Sometimes this is not helpfull because we not always achieve our dreams or goals but it does not mean we did not try hard, it was just because another person deserve it more than us. So, although we try hard, there are other factors playing a role in our path.

In the economic point of view, if our objectives demand a lot of money, we are again in the same situation, although we work hard, it would be difficult to achieve it.

To sum up, we are teaching to children how life works, it demands hard work, effort, dedication, time doing things we don't like, studying and attitude. And at the end, if you have done all these things but you still did not achieve your goal, you will be happy anyway because you did your best.`

export default function Book15WritingTest4() {
  const task1Question = "The chart below shows what Anthropology graduates from one university did after finishing their undergraduate degree course. The table shows the salaries of the anthropologists in work after five years. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "In some cultures, children are often told that they can achieve anything if they try hard enough. What are the advantages and disadvantages of giving children this message?";

  return (
    <WritingTestTemplate
      bookNumber="15"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book15/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
