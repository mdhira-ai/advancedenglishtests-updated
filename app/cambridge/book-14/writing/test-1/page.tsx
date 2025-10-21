import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The three pie charts illustrate the average distribution of three potentially unhealthy nutrients—sodium, saturated fat, and added sugar—across four daily meals in the USA: breakfast, lunch, dinner, and snacks.

Overall, it is clear that dinner is the main source of both sodium and saturated fat, whereas snacks contribute the most added sugar to the average American diet. Breakfast consistently accounts for the smallest or second-smallest percentage of all three nutrients.

Focusing on sodium and saturated fat, dinner comprises the largest share for both, at 43% and 37% respectively. Lunch is the second most significant meal, contributing 29% of sodium and 26% of saturated fat. In contrast, snacks and breakfast make up a much smaller proportion of sodium intake, with both accounting for 14%. For saturated fat, snacks contribute a notable 21%, while breakfast is the source of the lowest proportion at 16%.

Regarding added sugar, the pattern is markedly different. Snacks are the primary source, responsible for a substantial 42% of the total intake. Lunch and dinner provide considerably smaller but similar amounts, at 23% and 19% respectively. Once again, breakfast is the meal with the lowest contribution, making up just 16% of the daily added sugar consumption.`

const task2ModelAnswer = `The question of how to respond to adversity, such as financial difficulties or a dissatisfying career, is a timeless debate. One perspective suggests that the most prudent course of action is to accept such circumstances, while another advocates for actively seeking to change them. While there is merit in accepting what cannot be altered, I firmly believe that striving for improvement is ultimately a more constructive and empowering approach.

On the one hand, the argument for accepting a negative situation is often rooted in the pursuit of mental tranquility and pragmatism. Proponents of this view might argue that constantly fighting against one's circumstances can lead to chronic stress, anxiety, and disappointment. For instance, in a large-scale economic recession where job opportunities are scarce, accepting a less-than-ideal job might be a sensible strategy to maintain stability and avoid the mental toll of a fruitless search. This stoic approach can help individuals find contentment and focus on other, more positive aspects of their lives, such as family and hobbies, rather than dwelling on what they lack.

On the other hand, the philosophy of actively working to better one's situation is central to personal growth and societal progress. To passively accept a state of unhappiness can lead to stagnation, resentment, and a sense of helplessness. The drive to improve is what encourages individuals to acquire new skills, seek further education, or start their own businesses. For example, an employee dissatisfied with their job can enroll in evening courses to qualify for a promotion or a career change, thereby taking control of their destiny. This proactive mindset not only has the potential to yield tangible rewards like a higher income and greater job satisfaction but also fosters resilience and self-confidence.

In conclusion, while accepting difficult situations can be a valuable coping mechanism, particularly for circumstances truly beyond our control, it should not be the default response to all adversity. I am convinced that the human spirit thrives on challenges and the pursuit of betterment. Therefore, actively trying to improve one's unsatisfactory conditions is generally the superior path, as it empowers individuals, fosters personal development, and ultimately leads to a more fulfilling life.`

export default function Book14WritingTest1() {
  const task1Question = "The charts below show the average percentages in typical meals of three types of nutrients, all of which may be unhealthy if eaten too much. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both these views and give your own opinion.";

  return (
    <WritingTestTemplate
      bookNumber="14"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book14/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}