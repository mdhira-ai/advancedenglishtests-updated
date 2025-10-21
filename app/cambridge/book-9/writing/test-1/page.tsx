import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The two maps illustrate the significant developments that took place on a previously uninhabited island to transform it into a tourist resort.

Initially, the island was completely undeveloped, with only a scattering of palm trees and a beach on its western side. The island is roughly 250 metres long and is surrounded by the sea.

In the 'after' map, the island has been extensively developed to accommodate tourists. A central reception building has been constructed, surrounded by a vehicle track. To the east of the reception, a restaurant has been built. Accommodation facilities are a major new feature. Two areas of accommodation have been erected: one to the west of the reception, consisting of smaller huts arranged in a circular pattern, and another larger accommodation area to the east.

Furthermore, a pier has been built on the southern coast, allowing boats to dock. This pier is connected to the reception area by a vehicle track. For recreational purposes, a designated swimming area has been established off the western beach. Footpaths have been added to connect all the key facilities, including one leading from the western accommodation area to the beach. While many trees remain, especially on the eastern tip, the central area has been cleared for the new buildings and infrastructure.`

const task2ModelAnswer = `The debate over the optimal age for children to begin learning a foreign language is a prominent one in modern education. While traditionally introduced in secondary school, a growing number of experts advocate for starting in primary school. I firmly believe that the advantages of this early start significantly outweigh the potential drawbacks.

One of the most compelling arguments for early language acquisition is the cognitive flexibility of young children. Their brains are neurologically primed for language learning, allowing them to absorb new sounds, grammatical structures, and vocabulary with a natural ease that often diminishes with age. This 'sponge-like' ability means they can often achieve a more native-like accent and intuitive understanding of the language. Furthermore, learning a language at a young age is less about memorising rules and more about communication through play, songs, and interactive activities, which can foster a genuine and lasting enthusiasm for the subject.

However, there are some disadvantages to consider. Critics argue that the primary school curriculum is already crowded, and adding another complex subject could overburden both students and teachers. There is also the issue of resources; effective early language teaching requires specialised teachers who are not only fluent but also skilled in engaging young learners, and not all primary schools are equipped to provide this.

Despite these challenges, the long-term benefits are undeniable. Early exposure to a different language also means exposure to a different culture, which promotes tolerance, curiosity, and a more global perspective from a young age. It also provides a stronger foundation for more advanced language studies. In conclusion, while logistical and curricular challenges exist, the profound cognitive and cultural advantages of starting foreign language education in primary school make it a highly beneficial approach.`

export default function Book9WritingTest1() {
      const task1Question = "The two maps below show an island, before and after the construction of some tourist facilities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
   
      const task2Question = "Some experts believe that it is better for children to begin learning a foreign language at primary school rather than secondary school. Do the advantages of this outweigh the disadvantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience.";
    
  return (
    <WritingTestTemplate
      bookNumber="9"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


