import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The provided diagram illustrates the process of electricity generation in a hydroelectric power station, detailing its operation during both day and night.

Overall, the system operates in two distinct modes: generating power during periods of high demand (day) and storing potential energy during low-demand periods (night). The process relies on the movement of water between a high-level and a low-level reservoir, using a reversible turbine to either generate or pump.

During the day, when electricity demand is high, water is released from the high-level reservoir. It flows through an intake in the dam and down a large pipe known as a penstock. The force of the flowing water turns a reversible turbine, which is connected to a generator. This generator converts the mechanical energy from the turbine into electricity, which is then transmitted to the national grid via power lines. After passing through the turbine, the water is discharged into a low-level reservoir.

At night, when demand for electricity is lower and power is cheaper, the process is reversed. The station uses electricity from the national grid to power its reversible turbine, which now functions as a pump. This pump moves water from the low-level reservoir back up the penstock to the high-level reservoir, effectively recharging the system. This stored water can then be used to generate electricity again the following day.`

const task2ModelAnswer = `It is often said that music possesses a unique ability to unite people across cultural and generational divides. I wholeheartedly agree with this opinion, as I believe music functions as a universal language that transcends superficial differences and fosters shared human experience.

Firstly, music's power to bridge cultural gaps is immense. Unlike spoken or written language, music communicates directly through emotion, rhythm, and melody, requiring no translation to be understood and appreciated. This allows individuals from vastly different backgrounds to connect over a shared piece of art. For instance, global music festivals such as Tomorrowland or Glastonbury attract audiences from every corner of the globe. People who cannot speak to each other in their native tongues can still dance to the same beat and share a moment of collective joy. Similarly, the worldwide popularity of genres like Latin Pop or K-Pop demonstrates that a catchy melody or a powerful performance can create fans in countries thousands of miles away, fostering a sense of global community.

Secondly, music is a remarkable tool for connecting different age groups. Classic songs and artists often achieve a timeless appeal, becoming part of a shared cultural heritage that is passed down through generations. It is common to see children, parents, and grandparents all enjoying the music of bands like The Beatles or Queen at family gatherings or weddings. This shared appreciation creates common ground and strengthens familial bonds. Furthermore, modern technology has made it easier for younger generations to discover older music, while older people are often introduced to new genres by their children or grandchildren, creating opportunities for mutual understanding and shared discovery.

In conclusion, I am firmly convinced that music is one of the most effective mediums for bringing people together. By overcoming the barriers of language, it unites diverse cultures in a shared emotional experience, and by resonating across decades, it bridges the gap between the young and the old. Its capacity to create harmony among people is as powerful as its ability to create harmony in sound.`

export default function Book14WritingTest3() {
  const task1Question = "The diagram below shows how electricity is generated in a hydroelectric power station. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Some people say that music is a good way of bringing people of different cultures and ages together. To what extent do you agree or disagree with this opinion?";

  return (
    <WritingTestTemplate
      bookNumber="14"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book14/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
