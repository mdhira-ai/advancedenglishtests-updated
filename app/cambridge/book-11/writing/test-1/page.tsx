import WritingTestTemplate from '@/components/test/WritingTestTemplate'


const task1ModelAnswer = `The six pie charts illustrate the distribution of water usage across industrial, agricultural, and domestic sectors in six distinct regions of the world.

A striking overall trend is that agriculture is the largest consumer of water in four of the six regions, particularly in the developing economies. In contrast, industry accounts for the majority of water use in the two most developed regions, North America and Europe.

In Central Asia, Africa, and South East Asia, agricultural use is overwhelmingly dominant, accounting for 88%, 84%, and 81% of water consumption respectively. South America also relies heavily on agriculture for its water use, at 71%. In these four regions, industrial and domestic use combined make up less than a quarter of the total.

The pattern is reversed in North America and Europe. In Europe, industrial use is the highest category at 53%, followed by agriculture at 32% and domestic use at 15%. North America shows a similar distribution, with industry consuming 48% of the water, agriculture 39%, and domestic use 13%. Across all six regions, domestic water consumption consistently represents the smallest proportion, never exceeding 19% (in South America).`

const task2ModelAnswer = `The allocation of government funding for transportation infrastructure is a contentious issue, with a clear division between advocates for road and rail. The statement proposes that public funds should be prioritized for railways over roads. I largely agree with this position, as investing in railways offers significant long-term environmental and social benefits, although road networks cannot be completely neglected.

The primary argument in favor of prioritizing rail transport is its environmental sustainability. Trains, particularly electric ones, are far more energy-efficient and produce significantly lower carbon emissions per passenger or per tonne of freight compared to cars and lorries. In an era of escalating climate change, shifting transport from roads to rail is a crucial strategy for reducing a nation's carbon footprint. Furthermore, expanding the rail network can alleviate traffic congestion in urban areas, leading to less air pollution, reduced noise, and shorter commute times for everyone.

From a social and economic perspective, railways can be a catalyst for development. High-speed rail links can connect major cities, boosting business and tourism. Reliable local and regional train services can also enhance social equity by providing affordable transport options for those without access to a private vehicle, connecting them to jobs, education, and healthcare.

However, it is impractical to suggest that all funding should be diverted from roads. Road infrastructure is essential for 'last-mile' connectivity, linking homes and businesses to rail stations and airports. Emergency services, local deliveries, and public buses all depend on a well-maintained road network. In rural areas, roads are often the only viable means of transport.

In conclusion, while roads serve a vital and undeniable function, I believe that governments should strategically shift the balance of their spending in favour of railways. The long-term environmental, economic, and social advantages of a modern, efficient rail system are too significant to ignore. Therefore, I agree to a great extent that railways, rather than roads, should be the focus of government investment for a more sustainable future.`


export default function Book11WritingTest1() {
  const task1Question = "The charts below show the percentage of water used for different purposes in six areas of the world. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Governments should spend money on railways rather than roads. To what extent do you agree or disagree with this statement?";
  
  return (
    <WritingTestTemplate
      bookNumber="11"
      testNumber="1"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test1/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}


   