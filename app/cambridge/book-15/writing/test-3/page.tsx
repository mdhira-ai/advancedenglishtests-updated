import WritingTestTemplate from '@/components/test/WritingTestTemplate'

const task1ModelAnswer = `The given scheme explains the process of instant noodles production. Moreover it reveals how this product appears on super market shelves. In general, there are eight stages of manufacturing before the final product is being delivered to the store.

The first operation consists of putting flour into storage silos. Then the flour is mixed with some other ingredients into dough in a special machine. The substance is further stretched into sheets which a cut into thin strips during the fourth stage. The following operation involves the strips too. At this moment the noodles are formed into discs. After that the round-shaped figures are cooked in oil and dried. The seventh stage consists of placing the product into cups and adding some vegetables and spices to it. The final part of production process is mainly about the packaging. At this moment freshly printed lables are added to the cups which are sealed. After that, as soon as the product (instant noodles) is ready to leave the factory, it is shipped to a shopping facility.

Overall, it takes a considerably long time for a product to get to a super market.`

const task2ModelAnswer = `Advertisement has always been a crucial part in the world of marketing. Throughout the decade, we have seen a significant increase in the amount of advertisements, whether it is on the media like television or widespread through social network platforms. The goal of advertisements is to get consumers to buy a targeted product, and while this method has been proven considerably successful generally, some people view it as too prevalent to catch the consumers attention any more.

Advertisements can act as a strong persuasion device to seemingly hypnotize people into buying goods and services. This is so because of the tactics placed in the messages, such as showing people having a good time together when using a particular product, using bandwagon or showing only the upsides of usage, and applying compare and contrast strategies to show the effects of using the product and make it stand out. Even if people do not know it, these messages are repeated several times and soon it may brainwash people to Finally go out and get the product. For instance, if a person is watching television and sees a certain advertisement of a snack many times, the repeated sight of the scrumptious food may result in that person feeling hungry and succumbing to the advertisement at last.

Nevertheless, there is another point of view in which the widespread of advertisements makes it a normal thing. After watching a dozen of advertisements people will see it as a mere every day routine and cease to pay attention to the message of the advertisement. Some people may even choose to turn off a television channel, for instance, only just to avoid seeing and hearing repetetive advertisements. After a certain frequency, they start to get bored and stop paying attention to ads. Hence, in the end, the main goal of advertisements is not complete since the people whom the advertisements are do not receive that message. A real life example can be seen from advertisements in a particular social media platform, Youtube. In the Youtube marketing mechanism, advertisements are place before and in between videos, hoping that the viewers would also be forced to watch the advertisements, too. However, this is not usually the case, since many people would just click "Skip Ad" and continue on.

In conclusion, advertisements can be successful in persuading people to purchase goods and services, or they can be unsuccessful in many ways. They are very commonly seen nowadays, but not all of them fulfill their purpose. Thus, advertisements must be designed and presented in the correct way to result in the highest effectiveness.`

export default function Book15WritingTest3() {
  const task1Question = "The diagram below shows how instant noodles are manufactured. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

  const task2Question = "Advertising is all around us and it is an unavoidable part of everyone's life. Some people say that advertising is a positive part of our lives while others say it is a negative one. Discuss both views and give your own opinion.";

  return (
    <WritingTestTemplate
      bookNumber="15"
      testNumber="3"
      task1Question={task1Question}
      task1ImagePath="https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book15/writing/test3/task1.png"
      task1ModelAnswer={task1ModelAnswer}
      task2Question={task2Question}
      task2ModelAnswer={task2ModelAnswer}
      backUrl="/cambridge/"
    />
  )
}
