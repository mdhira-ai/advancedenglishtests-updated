import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The bar chart illustrates expenditure on five different entertainment categories in Asia, Europe, and the United States in 1995 and 2000.

Overall, the United States was by far the largest market for entertainment in both years, and spending increased across all categories and regions over the five-year period. Television consistently represented the highest proportion of spending in all three markets.

The United States saw its total entertainment spending grow significantly, from approximately $184 billion in 1995 to $257 billion in 2000. Television was the dominant sector, accounting for the majority of this expenditure. In Europe, spending rose from $131 billion to a higher figure, while Asia experienced growth from $67 billion to $110 billion.

Regarding the specific categories, television was the most popular form of entertainment. In Asia, spending on this medium nearly doubled. Video and cinema also saw substantial growth in all regions, reflecting a rising global interest in film. In contrast, spending on music and publishing, while still increasing, represented a much smaller fraction of the total entertainment market and grew at a slower pace than the other categories.`

const task2ModelAnswer = `The principle that a jury should not be aware of a defendant's past convictions is a cornerstone of many legal systems, designed to ensure a fair trial based solely on the evidence presented. While some legal experts argue for a change, I firmly believe that maintaining the current practice is essential for upholding justice.

Firstly, the primary role of a jury is to determine guilt or innocence for a specific alleged crime, not to pass judgment on an individual's entire life history. Introducing prior criminal records would inevitably prejudice the jury. For instance, if a jury knows the defendant has a past conviction for theft, they might subconsciously assume guilt in a new theft case, regardless of weak or circumstantial evidence. This shifts the focus from 'Did they commit this crime?' to 'Are they the type of person who would commit this crime?', which fundamentally undermines the presumption of innocence.

Furthermore, allowing past records into a trial creates a system where individuals are perpetually punished for their past mistakes. A person who has served their sentence has, in the eyes of the law, paid their debt to society. To use their past against them in a future, unrelated case would be a form of double jeopardy, making genuine rehabilitation and reintegration into society incredibly difficult. It suggests that a person can never truly move on from their past, which is a bleak and counterproductive message.

While proponents of change might argue that a pattern of behaviour is relevant information for a jury, the risk of misuse is too great. The justice system relies on the rigorous examination of evidence for the case at hand. Police and prosecutors already use criminal history to inform their investigations, but the final arbiters of fact—the jury—must be shielded from this potentially biasing information to ensure their decision is objective. 

In conclusion, despite arguments that a full history provides better context, I disagree with changing the current laws. Protecting the jury from knowledge of past crimes is crucial for preventing prejudice, ensuring an impartial trial, and affirming the principle that individuals should be judged on current evidence, not past errors.`

export default function BookPlus1WritingTest1() {
  const task1Question = "The graph below shows how money was spent on different forms of entertainment over a five-year period. Summarise the information by selecting and reporting the main features, and make comparisons where relevant";

  const task2Question = "Under British and Australian laws a jury in a criminal case has no access to information about the defendant's past criminal record. This protects the person who is being accused of the crime. Some lawyers have suggested that this practice should be changed and that a jury should be given all the past facts before they reach their decision about the case. Do you agree or disagree?";

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-1"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}