import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The diagrams illustrate the evolutionary path of the horse over a 40-million-year timeline, detailing significant changes in its physical stature and, most notably, its foot structure.

Overall, the horse underwent a dramatic transformation from a small, dog-sized creature into the large, powerful animal it is today. This increase in size was accompanied by a remarkable specialisation of the foot, which evolved from a multi-toed limb to a single, solid hoof.

Forty million years ago, the Eohippus was a small animal with a distinctly arched back and a short neck and skull. Its most notable feature was its foot, which consisted of four small toes. By 30 million years ago, its descendant, the Mesohippus, was larger, with longer legs and a flatter back. Its foot had evolved to have three toes, with the central toe being larger and more dominant than the two on the side.

This trend continued with the Merychippus, 15 million years ago, which was larger still and more closely resembled a modern horse. Its side toes had become even smaller and were lifted from the ground, meaning it stood on its middle toe. Finally, the modern horse is the largest of the four, with a long, powerful build. Its foot structure represents the culmination of this evolutionary process, having developed into a single large hoof, which is effectively a single, highly adapted toe.`

const task2ModelAnswer = `The assertion that 'Failure is proof that the desire wasn't strong enough' presents a very simplistic and often harsh view of a complex human experience. While I acknowledge that a lack of desire can certainly lead to failure, I largely disagree that failure is definitive proof of it, as this perspective ignores a multitude of other critical factors.

On one hand, it is undeniable that motivation and a powerful desire to succeed are fundamental ingredients for achieving challenging goals. A person with weak resolve is more likely to abandon their efforts at the first sign of difficulty. For instance, an aspiring musician who only casually wants to learn the guitar will likely quit when faced with the tedious and painful process of developing calluses and mastering chords. In such cases, their failure to learn is indeed a direct result of insufficient desire to persevere through the hardship.

However, to attribute all failure to a lack of desire is a fallacy that overlooks crucial external and internal barriers. External circumstances often play a decisive role. A dedicated student from a low-income background may fail to get into a top university not due to a lack of ambition, but because of a lack of access to quality education, resources, or guidance. Similarly, a well-conceived business may fail due to an unforeseen economic recession or a disruptive new technology, events that are entirely outside the entrepreneur's control and have no bearing on their level of desire.

Furthermore, internal factors beyond motivation are equally important. An individual may possess an immense desire to become a professional basketball player but may simply lack the necessary physical attributes, such as height and coordination. In addition, poor strategy, inadequate knowledge, or mental health challenges can all precipitate failure, even in the most passionate and determined individuals. Failure, in many instances, is not an endpoint but a part of the learning process that ultimately leads to success.

In conclusion, while a strong desire is essential for success, it is not the only variable. Blaming all failure on a lack of will is to ignore the complex reality of talent, resources, strategy, and sheer luck. Therefore, failure should be seen not as proof of weak desire, but as a multifaceted outcome that warrants a more nuanced and compassionate understanding.`

export default function BookPlus1WritingTest4() {
  const task1Question = "The diagrams below show the evolution of horses over the past 40 million years. Write a report for a university lecturer describing the information shown below.";

  const task2Question = "'Failure is proof that the desire wasn't strong enough.' To what extent do you agree with this statement?";;

  return (
    <WritingTestTemplate
      bookNumber="practice-tests-plus-1"
      testNumber="4"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test4/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge-test-plus/"
    />
  )
}
