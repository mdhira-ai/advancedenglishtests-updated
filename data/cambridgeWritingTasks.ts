// Cambridge Writing Tasks Database
// This file contains all IELTS writing tasks from Cambridge books and Cambridge Plus-books

export interface WritingTask {
  id: string;
  book: string;
  test: string;
  type: 'task1' | 'task2';
  question: string;
  imagePath?: string;
  modelAnswer?: string;
  category?: string;
  keywords?: string[];
}

export const cambridgeWritingTasks: WritingTask[] = [
  // Cambridge Book-8
  {
    id: 'book8-test1-task1',
    book: 'Book-8',
    test: 'Test-1',
    type: 'task1',
    question: 'The pie chart below shows the main reasons why agricultural land becomes less productive. The table shows how these causes affected three regions of the world during the 1990s. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test1/task1.png',
    category: 'pie chart, table',
    keywords: ['pie chart', 'table', 'agricultural land', 'productivity', 'regions', 'causes']
  },
  {
    id: 'book8-test1-task2',
    book: 'Book-8',
    test: 'Test-1',
    type: 'task2',
    question: 'Some people think that parents should teach children how to be good members of society. Others, however, believe that school is the place to learn this. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['parents', 'school', 'children', 'society', 'education', 'responsibility']
  },
  {
    id: 'book8-test2-task1',
    book: 'Book-8',
    test: 'Test-2',
    type: 'task1',
    question: 'The three pie charts below show the changes in annual spending by a particular UK school in 1981, 1991 and 2001. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test2/task1.png',
    category: 'pie charts',
    keywords: ['pie charts', 'spending', 'school', 'UK', 'changes', 'annual']
  },
  {
    id: 'book8-test2-task2',
    book: 'Book-8',
    test: 'Test-2',
    type: 'task2',
    question: 'Nowadays the way many people interact with each other has changed because of technology. In what ways has technology affected the types of relationships people make? Has this become a positive or negative development?',
    category: 'problem-solution',
    keywords: ['technology', 'relationships', 'interaction', 'communication', 'positive', 'negative']
  },
  {
    id: 'book8-test3-task1',
    book: 'Book-8',
    test: 'Test-3',
    type: 'task1',
    question: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test3/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'households', 'owned', 'rented', 'accommodation', 'England', 'Wales']
  },
  {
    id: 'book8-test3-task2',
    book: 'Book-8',
    test: 'Test-3',
    type: 'task2',
    question: 'Increasing the price of petrol is the best way to solve growing traffic and pollution problems. To what extent do you agree or disagree? What other measures do you think might be effective?',
    category: 'opinion',
    keywords: ['petrol price', 'traffic', 'pollution', 'solutions', 'measures', 'agree', 'disagree']
  },
  {
    id: 'book8-test4-task1',
    book: 'Book-8',
    test: 'Test-4',
    type: 'task1',
    question: 'The graph below shows the quantities of goods transported in the UK between 1974 and 2002 by four different modes of transport. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book8/writing/test4/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'goods', 'transport', 'UK', 'modes', 'quantities']
  },
  {
    id: 'book8-test4-task2',
    book: 'Book-8',
    test: 'Test-4',
    type: 'task2',
    question: 'In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university studies. Discuss the advantages and disadvantages for young people who decide to do this.',
    category: 'advantages-disadvantages',
    keywords: ['young people', 'gap year', 'work', 'travel', 'university', 'advantages', 'disadvantages']
  },

  // Cambridge Book-9
  {
    id: 'book9-test1-task1',
    book: 'Book-9',
    test: 'Test-1',
    type: 'task1',
    question: 'The chart below shows the total number of minutes (in billions) of telephone calls in the UK, divided into three categories, from 1995-2002. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test1/task1.png',
    category: 'bar chart',
    keywords: ['bar chart', 'telephone calls', 'UK', 'minutes', 'categories', 'time period']
  },
  {
    id: 'book9-test1-task2',
    book: 'Book-9',
    test: 'Test-1',
    type: 'task2',
    question: 'Some experts believe that it is better for children to begin learning a foreign language at primary school rather than secondary school. Do the advantages of this outweigh the disadvantages?',
    category: 'advantages-disadvantages',
    keywords: ['children', 'foreign language', 'primary school', 'secondary school', 'learning', 'advantages']
  },
  {
    id: 'book9-test2-task1',
    book: 'Book-9',
    test: 'Test-2',
    type: 'task1',
    question: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test2/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'households', 'owned', 'rented', 'accommodation', 'England', 'Wales']
  },
  {
    id: 'book9-test2-task2',
    book: 'Book-9',
    test: 'Test-2',
    type: 'task2',
    question: 'Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children). To what extent do you agree or disagree?',
    category: 'opinion',
    keywords: ['community service', 'unpaid', 'compulsory', 'high school', 'charity', 'neighbourhood']
  },
  {
    id: 'book9-test3-task1',
    book: 'Book-9',
    test: 'Test-3',
    type: 'task1',
    question: 'The chart below shows how frequently people in the USA ate in fast food restaurants between 2003 and 2013. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test3/task1.png',
    category: 'bar chart',
    keywords: ['bar chart', 'fast food', 'restaurants', 'USA', 'frequency', 'time period']
  },
  {
    id: 'book9-test3-task2',
    book: 'Book-9',
    test: 'Test-3',
    type: 'task2',
    question: 'Some people say that the only reason for learning a foreign language is in order to travel to or work in a foreign country. Others say that these are not the only reasons why someone should learn a foreign language. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['foreign language', 'travel', 'work', 'reasons', 'learning', 'discussion']
  },
  {
    id: 'book9-test4-task1',
    book: 'Book-9',
    test: 'Test-4',
    type: 'task1',
    question: 'The graph below gives information from a 2008 report about consumption of energy in the USA since 1980 with projections until 2030. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book9/writing/test4/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'energy consumption', 'USA', 'projections', 'report']
  },
  {
    id: 'book9-test4-task2',
    book: 'Book-9',
    test: 'Test-4',
    type: 'task2',
    question: 'Every year several languages die out. Some people think that this is not important because life will be easier if there are fewer languages in the world. To what extent do you agree or disagree with this opinion?',
    category: 'opinion',
    keywords: ['languages', 'die out', 'extinction', 'communication', 'cultural diversity']
  },

  // Cambridge Book-11
  {
    id: 'book11-test1-task1',
    book: 'Book-11',
    test: 'Test-1',
    type: 'task1',
    question: 'The charts below show the percentage of water used for different purposes in six areas of the world. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test1/task1.png',
    category: 'pie charts',
    keywords: ['pie charts', 'water usage', 'purposes', 'world areas', 'percentage']
  },
  {
    id: 'book11-test1-task2',
    book: 'Book-11',
    test: 'Test-1',
    type: 'task2',
    question: 'Governments should spend money on railways rather than roads. To what extent do you agree or disagree with this statement?',
    category: 'opinion',
    keywords: ['government spending', 'railways', 'roads', 'transportation', 'infrastructure']
  },
  {
    id: 'book11-test2-task1',
    book: 'Book-11',
    test: 'Test-2',
    type: 'task1',
    question: 'The graph below shows average carbon dioxide (CO2) emissions per person in the United Kingdom, Sweden, Italy and Portugal between 1967 and 2007. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test2/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'carbon dioxide', 'emissions', 'per person', 'countries', 'time period']
  },
  {
    id: 'book11-test2-task2',
    book: 'Book-11',
    test: 'Test-2',
    type: 'task2',
    question: 'Some people claim that not enough of the waste from homes is recycled. They say that the only way to increase recycling is for governments to make it a legal requirement. To what extent do you think laws are needed to make people recycle more of their waste?',
    category: 'opinion',
    keywords: ['waste', 'recycling', 'homes', 'government', 'legal requirement', 'laws']
  },
  {
    id: 'book11-test3-task1',
    book: 'Book-11',
    test: 'Test-3',
    type: 'task1',
    question: 'The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test3/task1.png',
    category: 'bar chart',
    keywords: ['bar chart', 'men', 'women', 'education', 'Britain', 'full-time', 'part-time']
  },
  {
    id: 'book11-test3-task2',
    book: 'Book-11',
    test: 'Test-3',
    type: 'task2',
    question: 'Some people say that the only reason for learning a foreign language is in order to travel to or work in a foreign country. Others say that these are not the only reasons why someone should learn a foreign language. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['foreign language', 'travel', 'work', 'reasons', 'learning', 'discussion']
  },
  {
    id: 'book11-test4-task1',
    book: 'Book-11',
    test: 'Test-4',
    type: 'task1',
    question: 'The table below gives information about consumer spending on different items in five different countries in 2002. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book11/writing/test4/task1.png',
    category: 'table',
    keywords: ['table', 'consumer spending', 'different items', 'countries', 'comparison']
  },
  {
    id: 'book11-test4-task2',
    book: 'Book-11',
    test: 'Test-4',
    type: 'task2',
    question: 'Many governments think that economic progress is their most important goal. Some people, however, think that other types of progress are equally important for a country. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['economic progress', 'government', 'goals', 'other progress', 'country', 'importance']
  },

  // Cambridge Book-13
  {
    id: 'book13-test1-task1',
    book: 'Book-13',
    test: 'Test-1',
    type: 'task1',
    question: 'The chart below shows how frequently people in the USA ate in fast food restaurants between 2003 and 2013. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test1/task1.png',
    category: 'bar chart',
    keywords: ['bar chart', 'fast food', 'restaurants', 'USA', 'frequency', 'time period']
  },
  {
    id: 'book13-test1-task2',
    book: 'Book-13',
    test: 'Test-1',
    type: 'task2',
    question: 'Living in a country where you have to speak a foreign language can cause serious social problems, as well as practical problems. To what extent do you agree or disagree with this statement?',
    category: 'opinion',
    keywords: ['foreign language', 'country', 'social problems', 'practical problems', 'living abroad']
  },
  {
    id: 'book13-test2-task1',
    book: 'Book-13',
    test: 'Test-2',
    type: 'task1',
    question: 'The table below gives information about the underground railway systems in six cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test2/task1.png',
    category: 'table',
    keywords: ['table', 'underground railway', 'systems', 'cities', 'information', 'comparison']
  },
  {
    id: 'book13-test2-task2',
    book: 'Book-13',
    test: 'Test-2',
    type: 'task2',
    question: 'Some people believe that nowadays we have too many choices. To what extent do you agree or disagree with this statement?',
    category: 'opinion',
    keywords: ['choices', 'too many', 'modern life', 'decision making', 'options']
  },
  {
    id: 'book13-test3-task1',
    book: 'Book-13',
    test: 'Test-3',
    type: 'task1',
    question: 'The chart below shows what Anthropology graduates from one university did after finishing their undergraduate degree course. The table shows the salaries of the anthropologists in work after five years. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test3/task1.png',
    category: 'chart and table',
    keywords: ['pie chart', 'table', 'graduates', 'anthropology', 'salaries', 'careers']
  },
  {
    id: 'book13-test3-task2',
    book: 'Book-13',
    test: 'Test-3',
    type: 'task2',
    question: 'Some people say History is one of the most important school subjects. Other people think that, in today\'s world, subjects like Science and Technology are more important than History. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['history', 'science', 'technology', 'school subjects', 'importance', 'education']
  },
  {
    id: 'book13-test4-task1',
    book: 'Book-13',
    test: 'Test-4',
    type: 'task1',
    question: 'The plans below show the layout of a university\'s sports centre now, and how it will look after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge/book13/writing/test4/task1.png',
    category: 'maps/plans',
    keywords: ['plans', 'layout', 'university', 'sports centre', 'redevelopment', 'before after']
  },
  {
    id: 'book13-test4-task2',
    book: 'Book-13',
    test: 'Test-4',
    type: 'task2',
    question: 'In spite of the advances made in agriculture, many people around the world still go hungry. Why is this the case? What can be done to address this problem?',
    category: 'problem-solution',
    keywords: ['agriculture', 'hunger', 'world', 'problem', 'solution', 'food security']
  },

  // Cambridge Plus-Book-1
  {
    id: 'plus1-test1-task1',
    book: 'Plus-1',
    test: 'Test-1',
    type: 'task1',
    question: 'The chart below shows the results of a survey about people\'s coffee and tea buying and drinking habits in five Australian cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test1/task1.png',
    category: 'bar chart',
    keywords: ['bar chart', 'survey', 'coffee', 'tea', 'habits', 'Australian cities']
  },
  {
    id: 'plus1-test1-task2',
    book: 'Plus-1',
    test: 'Test-1',
    type: 'task2',
    question: 'In a number of countries, some people think it is necessary to spend large sums of money on constructing new railway lines for very fast trains between cities. Others believe the money should be spent on improving existing public transport. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['railway lines', 'fast trains', 'cities', 'public transport', 'money', 'infrastructure']
  },
  {
    id: 'plus1-test2-task1',
    book: 'Plus-1',
    test: 'Test-2',
    type: 'task1',
    question: 'The table below shows the numbers of visitors to Ashdown Museum during the year before and the year after it was refurbished. The charts show the result of surveys asking visitors how satisfied they were with their visit, during the same two periods. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test2/task1.png',
    category: 'table and charts',
    keywords: ['table', 'pie charts', 'museum', 'visitors', 'satisfaction', 'refurbishment']
  },
  {
    id: 'plus1-test2-task2',
    book: 'Plus-1',
    test: 'Test-2',
    type: 'task2',
    question: 'Some people say that advertising is extremely successful at persuading us to buy things. Other people think that advertising is so common that we no longer pay attention to it. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['advertising', 'persuading', 'buying', 'common', 'attention', 'marketing']
  },
  {
    id: 'plus1-test3-task1',
    book: 'Plus-1',
    test: 'Test-3',
    type: 'task1',
    question: 'The chart below shows the value of one country\'s exports in various categories during 2015 and 2016. The table shows the percentage change in each category of exports in 2016 compared with 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test3/task1.png',
    category: 'bar chart and table',
    keywords: ['bar chart', 'table', 'exports', 'categories', 'percentage change', 'comparison']
  },
  {
    id: 'plus1-test3-task2',
    book: 'Plus-1',
    test: 'Test-3',
    type: 'task2',
    question: 'Some people think that all university students should study whatever they like. Others believe that they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['university', 'students', 'study', 'subjects', 'science', 'technology', 'future']
  },
  {
    id: 'plus1-test4-task1',
    book: 'Plus-1',
    test: 'Test-4',
    type: 'task1',
    question: 'The bar chart below shows the top ten countries for the production and consumption of electricity in 2014. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus1/writing/test4/task1.png',
    category: 'bar chart',
    keywords: ['bar chart', 'countries', 'electricity', 'production', 'consumption', 'top ten']
  },
  {
    id: 'plus1-test4-task2',
    book: 'Plus-1',
    test: 'Test-4',
    type: 'task2',
    question: 'Some people think that strict punishments for driving offences are the key to reducing traffic accidents. Others, however, believe that other measures would be more effective in improving road safety. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['punishments', 'driving offences', 'traffic accidents', 'road safety', 'measures']
  },

  // Cambridge Plus-Book-2
  {
    id: 'plus2-test1-task1',
    book: 'Plus-2',
    test: 'Test-1',
    type: 'task1',
    question: 'The graph below shows the number of tourists visiting a particular Caribbean island between 2010 and 2017. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test1/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'tourists', 'Caribbean island', 'visitors', 'time period']
  },
  {
    id: 'plus2-test1-task2',
    book: 'Plus-2',
    test: 'Test-1',
    type: 'task2',
    question: 'In their advertising, businesses nowadays usually emphasise that their products are new in some way. Why is this? Do you think it is a positive or negative development?',
    category: 'problem-solution',
    keywords: ['advertising', 'businesses', 'products', 'new', 'positive', 'negative', 'development']
  },
  {
    id: 'plus2-test2-task1',
    book: 'Plus-2',
    test: 'Test-2',
    type: 'task1',
    question: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test2/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'households', 'owned', 'rented', 'accommodation', 'England', 'Wales']
  },
  {
    id: 'plus2-test2-task2',
    book: 'Plus-2',
    test: 'Test-2',
    type: 'task2',
    question: 'Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['accept', 'bad situation', 'job', 'money', 'improve', 'situations', 'discussion']
  },
  {
    id: 'plus2-test3-task1',
    book: 'Plus-2',
    test: 'Test-3',
    type: 'task1',
    question: 'The diagram below shows the manufacturing process for making sugar from sugar cane. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test3/task1.png',
    category: 'process diagram',
    keywords: ['diagram', 'manufacturing', 'process', 'sugar', 'sugar cane', 'production']
  },
  {
    id: 'plus2-test3-task2',
    book: 'Plus-2',
    test: 'Test-3',
    type: 'task2',
    question: 'Some people say that music is a good way of bringing people of different cultures and ages together. To what extent do you agree or disagree with this opinion?',
    category: 'opinion',
    keywords: ['music', 'cultures', 'ages', 'bringing together', 'people', 'unity']
  },
  {
    id: 'plus2-test4-task1',
    book: 'Plus-2',
    test: 'Test-4',
    type: 'task1',
    question: 'The plans below show a public park when it first opened in 1920 and the same park today. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus2/writing/test4/task1.png',
    category: 'maps/plans',
    keywords: ['plans', 'public park', '1920', 'today', 'changes', 'development']
  },
  {
    id: 'plus2-test4-task2',
    book: 'Plus-2',
    test: 'Test-4',
    type: 'task2',
    question: 'Some people think that parents should teach children how to be good members of society. Others, however, believe that school is the place to learn this. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['parents', 'children', 'society', 'school', 'learn', 'good members']
  },

  // Cambridge Plus-Book-3
  {
    id: 'plus3-test1-task1',
    book: 'Plus-3',
    test: 'Test-1',
    type: 'task1',
    question: 'The table below gives information on consumer spending on different items in five different countries in 2002. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test1/task1.png',
    category: 'table',
    keywords: ['table', 'consumer spending', 'items', 'countries', '2002', 'comparison']
  },
  {
    id: 'plus3-test1-task2',
    book: 'Plus-3',
    test: 'Test-1',
    type: 'task2',
    question: 'At the present time, the population of some countries includes a relatively large number of young adults, compared with the number of older people. Do the advantages of this situation outweigh the disadvantages?',
    category: 'advantages-disadvantages',
    keywords: ['population', 'young adults', 'older people', 'advantages', 'disadvantages', 'demographics']
  },
  {
    id: 'plus3-test2-task1',
    book: 'Plus-3',
    test: 'Test-2',
    type: 'task1',
    question: 'The graph below shows the number of tourists visiting a particular Caribbean island between 2010 and 2017. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test2/task1.png',
    category: 'line graph',
    keywords: ['line graph', 'tourists', 'Caribbean island', 'visitors', '2010-2017']
  },
  {
    id: 'plus3-test2-task2',
    book: 'Plus-3',
    test: 'Test-2',
    type: 'task2',
    question: 'These days more fathers stay at home and take care of their children while mothers go out to work. What could be the reasons for this? Do you think it is a positive or a negative development?',
    category: 'problem-solution',
    keywords: ['fathers', 'stay home', 'children', 'mothers', 'work', 'reasons', 'positive', 'negative']
  },
  {
    id: 'plus3-test3-task1',
    book: 'Plus-3',
    test: 'Test-3',
    type: 'task1',
    question: 'The chart below shows what Anthropology graduates from one university did after finishing their undergraduate degree course. The table shows the salaries of the anthropologists in work after five years. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test3/task1.png',
    category: 'chart and table',
    keywords: ['pie chart', 'table', 'anthropology', 'graduates', 'salaries', 'careers']
  },
  {
    id: 'plus3-test3-task2',
    book: 'Plus-3',
    test: 'Test-3',
    type: 'task2',
    question: 'Some people think that all university students should study whatever they like. Others believe that they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology. Discuss both these views and give your own opinion.',
    category: 'discussion',
    keywords: ['university', 'students', 'study', 'subjects', 'science', 'technology', 'future']
  },
  {
    id: 'plus3-test4-task1',
    book: 'Plus-3',
    test: 'Test-4',
    type: 'task1',
    question: 'The charts below show the percentage of monthly household income spent on various items by two different groups in one European country. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imagePath: 'https://d2cy8nxnsajz6t.cloudfront.net/cambridge-plus/plus3/writing/test4/task1.png',
    category: 'pie charts',
    keywords: ['pie charts', 'household income', 'spending', 'groups', 'European country', 'monthly']
  },
  {
    id: 'plus3-test4-task2',
    book: 'Plus-3',
    test: 'Test-4',
    type: 'task2',
    question: 'Modern technology has made it easier for individuals to download copyrighted music and books from the internet for no charge. To what extent is this a positive or a negative development? Give reasons for your answer, and include any relevant examples from your own knowledge or experience.',
    category: 'opinion',
    keywords: ['technology', 'download', 'copyrighted', 'music', 'books', 'internet', 'positive', 'negative']
  }
];

// Helper functions for filtering and searching
export const filterTasksByType = (tasks: WritingTask[], type: 'task1' | 'task2'): WritingTask[] => {
  return tasks.filter(task => task.type === type);
};

export const filterTasksByBook = (tasks: WritingTask[], book: string): WritingTask[] => {
  return tasks.filter(task => task.book === book);
};

export const searchTasks = (tasks: WritingTask[], searchQuery: string): WritingTask[] => {
  if (!searchQuery.trim()) return tasks;
  
  const query = searchQuery.toLowerCase();
  return tasks.filter(task => 
    task.question.toLowerCase().includes(query) ||
    task.category?.toLowerCase().includes(query) ||
    task.keywords?.some(keyword => keyword.toLowerCase().includes(query)) ||
    task.book.toLowerCase().includes(query)
  );
};

export const getUniqueBooks = (tasks: WritingTask[]): string[] => {
  return [...new Set(tasks.map(task => task.book))].sort();
};

export const getUniqueCategories = (tasks: WritingTask[]): string[] => {
  return [...new Set(tasks.map(task => task.category).filter(Boolean) as string[])].sort();
};
