import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The bar chart and table provide data on a country's export earnings across five product categories for the years 2015 and 2016. The chart displays the value in billions of dollars, while the table shows the percentage change between the two years.

Overall, total export earnings increased, with four out of the five categories showing growth in value. Petroleum products and engineered goods were consistently the highest earners. The most significant percentage growth was observed in textiles, whereas gems and jewellery was the only category to experience a decline.

In detail, petroleum products were the leading export category, earning approximately $61 billion in 2015 and rising by 3% to just over $62 billion in 2016. Engineered goods, the second-largest category, saw a more substantial increase of 8.5%, growing from around $58 billion to nearly $62 billion, almost matching the earnings from petroleum products.

The other categories showed mixed results. Textiles recorded the most dramatic change, with an increase of 15.24%. This translated to a rise in value from roughly $26 billion to over $30 billion. In contrast, agricultural products experienced only a marginal increase of 0.81%, with earnings slightly up from just over $30 billion. The only category to see a decrease in value was gems and jewellery, which fell by a minimal 0.41% from about $43 billion in 2015.`

const task2ModelAnswer = `Environmental degradation is undeniably one of the most significant challenges facing the world today. While some argue that the extinction of plant and animal species is the most critical issue, others contend that different problems pose a greater threat. This essay will discuss both perspectives before concluding that broader issues like climate change are more fundamental.

On one hand, the argument that biodiversity loss is the primary environmental concern is compelling. Ecosystems are intricate webs of life where each species plays a role. The removal of a single species, particularly a keystone species, can trigger a domino effect, leading to the collapse of an entire ecosystem. For instance, the drastic decline in bee populations worldwide threatens global agriculture, as they are essential for pollinating a vast number of crops that humans rely on for food. Furthermore, there is a moral argument that humanity has a responsibility to protect other life forms, and the loss of biodiversity represents an irreversible tragedy and a failure of our stewardship of the planet.

On the other hand, many believe that there are more urgent environmental problems. Issues such as global warming, plastic pollution, and deforestation are often cited as more critical because they are the root causes of many other environmental challenges, including species extinction. Climate change, for example, directly threatens human civilisation through rising sea levels, extreme weather events, and food shortages. The immediate and widespread impact on human health and safety from air and water pollution is another pressing concern that affects millions of people daily. From this viewpoint, tackling these foundational problems is more logical, as it would also help to mitigate the loss of biodiversity.

In my opinion, while the loss of species is a grave symptom of planetary distress, it is not the core problem. I believe that systemic issues like climate change and pollution are more important because they are the primary drivers of habitat destruction and species loss. Addressing the root causes, such as our reliance on fossil fuels and our culture of disposable consumption, is paramount. By transitioning to a sustainable and low-carbon economy, we would not only combat climate change but also protect the natural habitats that are essential for the survival of countless species. Therefore, focusing on these overarching problems offers a more holistic and effective approach to environmental protection.

In conclusion, both the loss of biodiversity and other major environmental issues like climate change are serious threats. However, I hold the view that the latter are more fundamental. By prioritising the fight against climate change and pollution, we address the causes rather than just the symptoms, offering the best chance to safeguard both the planet's species and the future of humanity.`

export default function Book14WritingTest2() {
  const task1Question = "The chart below shows the value of one country's exports in various categories during 2015 and 2016. The table shows the percentage change in each category of exports in 2016 compared with 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Some people say that the main environmental problem of our time is the loss of particular species of plants and animals. Others say that there are more important environmental problems. Discuss both these views and give your own opinion.";

  return (
    <WritingTestTemplate
      bookNumber="14"
      testNumber="2"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book14/writing/test2/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}