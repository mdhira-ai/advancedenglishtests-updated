import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = "This is a sample answer written by a candidate who achieved a Band 6 score. Here is the examiner's comment:\nThis answer presents the information in the two diagrams appropriately. The main differences between the two processes are identified in a clear summary, but other important features could be described more fully. The organisation of information is the strongest feature of this script. The description is well organised and there is a smooth progression across the whole answer that is achieved through good use of linkers and referencing phrases. A range of relevant vocabulary is used, although this is not wide and there are some less suitable word choices. There are a few mistakes in spelling, but these do not make the answer difficult to understand. A mix of sentence forms is used and there are some accurate examples of complex structures, but the many short, simple sentences tend to limit the range.\n\nThe diagrams show the processes and the equipments used to make cement, and how these are used to produce concrete for building purposes.\nThe first step in the cement productios is to introduce limestone clay. These materials pass through a crusher that produces a powder. Then this powder goes into a mixer. After this, the product passes to a rotating heater which works with heat. Afterwards, the mixture goes into a ginder where the cement comes out. At the end of the process, the cement is packed in bags.\nReferring to the concret production, the process begins with a combination of 15% cement, 10% water, 25% and sand 50% gravel. These four elements are introduced into a concrete mixer.\nAs mentioned above, the concrete production takes fewer steps that the cement production; however, it is necessary to use more materials than the latter process in order to obtain the final product.\nThe last difference between both processes is that the concrete mixer does not work with heat."
const task2ModelAnswer = "There is no doubt that traffic and pollution from vehicles have become huge problems, both in cities and on motorways everywhere. Solving these problems is likely to need more than a simple rise in the price of petrol.\n\nWhile it is undeniable that private car use is one of the main causes of the increase in traffic and pollution, higher fuel costs are unlikely to limit the number of drivers for long. As this policy would also affect the cost of public transport, it would be very unpopular with people who would have to travel on the roads. But there are various other measures that could be implemented that would have a huge effect on these problems.\n\nI think to tackle the problem of pollution, cleaner fuels need to be developed. The technology is already available to produce electric cars that would be both quieter and cleaner to use. Persuading manufacturers and travellers to adopt this new technology would be a more effective strategy for improving air quality, especially in cities.\n\nHowever, traffic congestion will not be solved by changing the type of private vehicle people can use. To do this, we need to improve the choice of public transport services available to travellers. For example, if sufficient sky trains and underground train systems were built and effectively maintained in our major cities, then traffic on the roads would be dramatically reduced. Long-distance train and coach services should be made attractive and affordable alternatives to driving your own car for long journeys.\n\nIn conclusion, I think that long-term traffic and pollution reductions would depend on educating the public to use public transport more, and on governments using public money to construct and run efficient systems."

export default function Book8WritingTest1() {

    const task1Question = "The diagrams below show the stages and equipment used in the cement-making process, and how cement is used to produce concrete for building purposes.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.";
  
    const task2Question = "Increasing the price of petrol is the best way to solve growing traffic and pollution problems.\n\nTo what extent do you agree or disagree?\n\nWhat other measures do you think might be effective?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.";

           
  return (
    <WritingTestTemplate
      bookNumber="8"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}

