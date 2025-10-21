export interface Question {
  id: number
  type: 'multiple_choice' | 'fill_blank' | 'correct_mistake' | 'rearrange' | 'interrogative'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  points: number
}

export const grammarQuestions: Question[] = [
  {
    id: 1,
    type: 'fill_blank',
    question: 'I _____ going to school with my friend.',
    options: ['is', 'was', 'were', 'am'],
    correctAnswer: 'am',
    explanation: 'Use "am" with "I" in present continuous tense.',
    points: 10
  },
  {
    id: 2,
    type: 'correct_mistake',
    question: 'Correct the mistake: I was born on 2000',
    options: [],
    correctAnswer: 'I was born in 2000',
    explanation: 'Use "in" with years, not "on".',
    points: 15
  },
  {
    id: 3,
    type: 'fill_blank',
    question: 'Yesterday I _____ my clothes.',
    options: ['wash', 'washed'],
    correctAnswer: 'washed',
    explanation: 'Use past tense "washed" with "yesterday".',
    points: 10
  },
  {
    id: 4,
    type: 'multiple_choice',
    question: 'They _____ leaving tomorrow.',
    options: ['are', 'is', 'am'],
    correctAnswer: 'are',
    explanation: 'Use "are" with "they" in present continuous.',
    points: 10
  },
  {
    id: 5,
    type: 'rearrange',
    question: 'Rearrange the letters: R M B U N E',
    options: [],
    correctAnswer: 'NUMBER',
    explanation: 'The correct arrangement is "NUMBER".',
    points: 20
  },
  {
    id: 6,
    type: 'fill_blank',
    question: 'I _____ working on the report all morning.',
    options: ['have been', 'has been'],
    correctAnswer: 'have been',
    explanation: 'Use "have been" for present perfect continuous with "I".',
    points: 15
  },
  {
    id: 7,
    type: 'interrogative',
    question: 'Put in interrogative form: I ate rice.',
    options: [],
    correctAnswer: 'Did I eat rice?',
    explanation: 'Use "Did" + subject + base verb for past simple questions.',
    points: 15
  },
  {
    id: 8,
    type: 'multiple_choice',
    question: 'She _____ to the market every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correctAnswer: 'goes',
    explanation: 'Use "goes" for third person singular in simple present.',
    points: 10
  },
  {
    id: 9,
    type: 'correct_mistake',
    question: 'Correct the mistake: He don\'t like coffee.',
    options: [],
    correctAnswer: 'He doesn\'t like coffee.',
    explanation: 'Use "doesn\'t" with third person singular, not "don\'t".',
    points: 15
  },
  {
    id: 10,
    type: 'fill_blank',
    question: 'If I _____ rich, I would travel the world.',
    options: ['was', 'were', 'am', 'is'],
    correctAnswer: 'were',
    explanation: 'Use "were" in unreal conditional sentences for all persons.',
    points: 20
  },
  {
    id: 11,
    type: 'multiple_choice',
    question: 'This is _____ apple.',
    options: ['a', 'an', 'the'],
    correctAnswer: 'an',
    explanation: 'Use "an" before a word starting with a vowel sound.',
    points: 10
  },
  {
    id: 12,
    type: 'fill_blank',
    question: 'My sister is a doctor and my brother is _____ engineer.',
    options: ['a', 'an', 'the'],
    correctAnswer: 'an',
    explanation: 'Use "an" before "engineer" because it starts with a vowel sound.',
    points: 10
  },
  {
    id: 13,
    type: 'correct_mistake',
    question: 'Correct the mistake: We went to the park for to play.',
    options: [],
    correctAnswer: 'We went to the park to play.',
    explanation: 'The infinitive of purpose is "to" + base verb.',
    points: 15
  },
  {
    id: 14,
    type: 'interrogative',
    question: 'Put in interrogative form: She will arrive at 8 PM.',
    options: [],
    correctAnswer: 'Will she arrive at 8 PM?',
    explanation: 'Invert the subject and the modal verb "will" to form a question.',
    points: 15
  },
  {
    id: 15,
    type: 'multiple_choice',
    question: 'There isn\'t _____ milk in the fridge.',
    options: ['some', 'any', 'a'],
    correctAnswer: 'any',
    explanation: 'Use "any" in negative sentences.',
    points: 10
  },
  {
    id: 16,
    type: 'rearrange',
    question: 'Rearrange the words: hungry / very / is / The dog',
    options: [],
    correctAnswer: 'The dog is very hungry.',
    explanation: 'The standard sentence structure is Subject-Verb-Adjective.',
    points: 20
  },
  {
    id: 17,
    type: 'fill_blank',
    question: 'I have _____ my homework.',
    options: ['did', 'do', 'done'],
    correctAnswer: 'done',
    explanation: 'Use the past participle "done" with "have" in the present perfect tense.',
    points: 10
  },
  {
    id: 18,
    type: 'multiple_choice',
    question: 'She is _____ than her sister.',
    options: ['tall', 'taller', 'tallest'],
    correctAnswer: 'taller',
    explanation: 'Use the comparative form "taller" when comparing two people.',
    points: 10
  },
  {
    id: 19,
    type: 'correct_mistake',
    question: 'Correct the mistake: They is playing in the garden.',
    options: [],
    correctAnswer: 'They are playing in the garden.',
    explanation: 'Use "are" with the pronoun "they".',
    points: 15
  },
  {
    id: 20,
    type: 'fill_blank',
    question: 'Could you please pass me _____ salt?',
    options: ['a', 'an', 'the'],
    correctAnswer: 'the',
    explanation: 'Use "the" when referring to a specific item known to both speakers.',
    points: 10
  },
  {
    id: 21,
    type: 'multiple_choice',
    question: 'He drives very _____.',
    options: ['careful', 'carefully', 'care'],
    correctAnswer: 'carefully',
    explanation: 'Use the adverb "carefully" to describe the verb "drives".',
    points: 10
  },
  {
    id: 22,
    type: 'interrogative',
    question: 'Put in interrogative form: He can play the guitar.',
    options: [],
    correctAnswer: 'Can he play the guitar?',
    explanation: 'Invert the subject and the modal verb "can" to ask a question.',
    points: 15
  },
  {
    id: 23,
    type: 'fill_blank',
    question: 'I haven\'t seen him _____ last year.',
    options: ['for', 'since', 'at'],
    correctAnswer: 'since',
    explanation: 'Use "since" with a specific point in time in the past.',
    points: 15
  },
  {
    id: 24,
    type: 'correct_mistake',
    question: 'Correct the mistake: Me and my friend went to the cinema.',
    options: [],
    correctAnswer: 'My friend and I went to the cinema.',
    explanation: 'When "I" is part of the subject, use "I", not "me". It\'s polite to mention the other person first.',
    points: 15
  },
  {
    id: 25,
    type: 'rearrange',
    question: 'Rearrange the letters: T R O D O C',
    options: [],
    correctAnswer: 'DOCTOR',
    explanation: 'The letters spell the word "DOCTOR".',
    points: 20
  },
  {
    id: 26,
    type: 'multiple_choice',
    question: 'How _____ sugar do you want?',
    options: ['many', 'much', 'a lot'],
    correctAnswer: 'much',
    explanation: 'Use "much" with uncountable nouns like "sugar".',
    points: 10
  },
  {
    id: 27,
    type: 'fill_blank',
    question: 'She _____ to London last summer.',
    options: ['go', 'went', 'has gone'],
    correctAnswer: 'went',
    explanation: 'Use the simple past tense for a completed action in the past.',
    points: 10
  },
  {
    id: 28,
    type: 'correct_mistake',
    question: 'Correct the mistake: This is the most biggest house I have ever seen.',
    options: [],
    correctAnswer: 'This is the biggest house I have ever seen.',
    explanation: 'Do not use "most" with a superlative adjective that already ends in "-est".',
    points: 15
  },
  {
    id: 29,
    type: 'multiple_choice',
    question: 'The book is _____ the table.',
    options: ['in', 'at', 'on'],
    correctAnswer: 'on',
    explanation: 'Use "on" to indicate a position on a surface.',
    points: 10
  },
  {
    id: 30,
    type: 'interrogative',
    question: 'Put in interrogative form: They have finished their work.',
    options: [],
    correctAnswer: 'Have they finished their work?',
    explanation: 'Invert the subject and the auxiliary verb "have" to form a question.',
    points: 15
  },
  {
    id: 31,
    type: 'fill_blank',
    question: 'If you _____ hard, you will pass the exam.',
    options: ['study', 'studied', 'will study'],
    correctAnswer: 'study',
    explanation: 'This is a first conditional sentence. Use the present simple in the "if" clause.',
    points: 15
  },
  {
    id: 32,
    type: 'multiple_choice',
    question: 'This book belongs to _____.',
    options: ['me', 'my', 'I'],
    correctAnswer: 'me',
    explanation: 'Use the object pronoun "me" after a preposition like "to".',
    points: 10
  },
  {
    id: 33,
    type: 'rearrange',
    question: 'Rearrange the words: a / I / have / question',
    options: [],
    correctAnswer: 'I have a question.',
    explanation: 'A simple declarative sentence structure is Subject-Verb-Object.',
    points: 20
  },
  {
    id: 34,
    type: 'correct_mistake',
    question: 'Correct the mistake: There is many sheeps in the field.',
    options: [],
    correctAnswer: 'There are many sheep in the field.',
    explanation: '"Sheep" is an irregular plural, and it is used with "are".',
    points: 15
  },
  {
    id: 35,
    type: 'fill_blank',
    question: 'I am not interested _____ politics.',
    options: ['on', 'at', 'in'],
    correctAnswer: 'in',
    explanation: 'The correct preposition after "interested" is "in".',
    points: 10
  },
  {
    id: 36,
    type: 'multiple_choice',
    question: 'While I was cooking, the phone _____.',
    options: ['ring', 'rang', 'was ringing'],
    correctAnswer: 'rang',
    explanation: 'Use the simple past for a short action that interrupts a longer, ongoing past action.',
    points: 15
  },
  {
    id: 37,
    type: 'interrogative',
    question: 'Put in interrogative form: He works in a bank.',
    options: [],
    correctAnswer: 'Does he work in a bank?',
    explanation: 'Use "Does" + subject + base verb for third person present simple questions.',
    points: 15
  },
  {
    id: 38,
    type: 'fill_blank',
    question: 'You _____ be quiet in the library.',
    options: ['must', 'can', 'may'],
    correctAnswer: 'must',
    explanation: '"Must" is used to express a strong obligation or rule.',
    points: 10
  },
  {
    id: 39,
    type: 'correct_mistake',
    question: 'Correct the mistake: She is married with a doctor.',
    options: [],
    correctAnswer: 'She is married to a doctor.',
    explanation: 'The correct preposition to use with "married" is "to".',
    points: 15
  },
  {
    id: 40,
    type: 'multiple_choice',
    question: '_____ are my keys!',
    options: ['This', 'That', 'These'],
    correctAnswer: 'These',
    explanation: 'Use "These" for plural, nearby objects.',
    points: 10
  },
  {
    id: 41,
    type: 'rearrange',
    question: 'Rearrange the letters: R A C E H T E',
    options: [],
    correctAnswer: 'TEACHER',
    explanation: 'The letters spell the word "TEACHER".',
    points: 20
  },
  {
    id: 42,
    type: 'fill_blank',
    question: 'He is the man _____ helped me yesterday.',
    options: ['who', 'which', 'what'],
    correctAnswer: 'who',
    explanation: 'Use the relative pronoun "who" to refer to people.',
    points: 15
  },
  {
    id: 43,
    type: 'multiple_choice',
    question: 'What time _____ the train leave?',
    options: ['do', 'does', 'is'],
    correctAnswer: 'does',
    explanation: 'Use "does" for questions in the third person singular simple present.',
    points: 10
  },
  {
    id: 44,
    type: 'correct_mistake',
    question: 'Correct the mistake: I look forward to meet you.',
    options: [],
    correctAnswer: 'I look forward to meeting you.',
    explanation: 'The phrase "look forward to" is followed by a gerund (-ing form).',
    points: 20
  },
  {
    id: 45,
    type: 'interrogative',
    question: 'Put in interrogative form: The children are sleeping.',
    options: [],
    correctAnswer: 'Are the children sleeping?',
    explanation: 'Invert the subject and the verb "are" to form the question.',
    points: 15
  },
  {
    id: 46,
    type: 'fill_blank',
    question: 'I prefer tea _____ coffee.',
    options: ['than', 'to', 'from'],
    correctAnswer: 'to',
    explanation: 'Use "to" not "than" with the verb "prefer".',
    points: 10
  },
  {
    id: 47,
    type: 'multiple_choice',
    question: 'We have lived here _____ ten years.',
    options: ['since', 'for', 'at'],
    correctAnswer: 'for',
    explanation: 'Use "for" with a period of time.',
    points: 10
  },
  {
    id: 48,
    type: 'correct_mistake',
    question: 'Correct the mistake: If I would have money, I would buy a car.',
    options: [],
    correctAnswer: 'If I had money, I would buy a car.',
    explanation: 'This is a second conditional sentence. Use the past simple in the "if" clause.',
    points: 20
  },
  {
    id: 49,
    type: 'rearrange',
    question: 'Rearrange the words: listening / to / music / I / am',
    options: [],
    correctAnswer: 'I am listening to music.',
    explanation: 'This is the standard structure for the present continuous tense.',
    points: 20
  },
  {
    id: 50,
    type: 'fill_blank',
    question: 'There are _____ apples on the table.',
    options: ['any', 'some', 'much'],
    correctAnswer: 'some',
    explanation: 'Use "some" in positive sentences with countable nouns.',
    points: 10
  },
  {
    id: 51,
    type: 'multiple_choice',
    question: 'He is afraid _____ dogs.',
    options: ['of', 'from', 'with'],
    correctAnswer: 'of',
    explanation: 'The correct preposition after "afraid" is "of".',
    points: 10
  },
  {
    id: 52,
    type: 'interrogative',
    question: 'Put in interrogative form: She was happy.',
    options: [],
    correctAnswer: 'Was she happy?',
    explanation: 'Invert the subject and the verb "was".',
    points: 15
  },
  {
    id: 53,
    type: 'correct_mistake',
    question: 'Correct the mistake: Let\'s go to home.',
    options: [],
    correctAnswer: 'Let\'s go home.',
    explanation: '"Go home" is a fixed expression; no preposition is needed.',
    points: 15
  },
  {
    id: 54,
    type: 'fill_blank',
    question: 'I _____ to the radio when you called.',
    options: ['listened', 'was listening', 'listen'],
    correctAnswer: 'was listening',
    explanation: 'Use the past continuous for a longer action that was interrupted.',
    points: 15
  },
  {
    id: 55,
    type: 'multiple_choice',
    question: 'The film was _____.',
    options: ['boring', 'bored', 'bore'],
    correctAnswer: 'boring',
    explanation: 'Use the -ing adjective to describe the thing that causes the feeling (the film).',
    points: 15
  },
  {
    id: 56,
    type: 'rearrange',
    question: 'Rearrange the letters: L O H S O C',
    options: [],
    correctAnswer: 'SCHOOL',
    explanation: 'The letters spell the word "SCHOOL".',
    points: 20
  },
  {
    id: 57,
    type: 'fill_blank',
    question: 'The meeting is _____ 10 AM.',
    options: ['on', 'in', 'at'],
    correctAnswer: 'at',
    explanation: 'Use "at" with specific times.',
    points: 10
  },
  {
    id: 58,
    type: 'correct_mistake',
    question: 'Correct the mistake: I have a good news for you.',
    options: [],
    correctAnswer: 'I have good news for you.',
    explanation: '"News" is an uncountable noun and does not use the article "a".',
    points: 20
  },
  {
    id: 59,
    type: 'multiple_choice',
    question: 'This is the _____ day of my life.',
    options: ['good', 'better', 'best'],
    correctAnswer: 'best',
    explanation: 'Use the superlative form "best" when comparing more than two things.',
    points: 10
  },
  {
    id: 60,
    type: 'interrogative',
    question: 'Put in interrogative form: You live in this city.',
    options: [],
    correctAnswer: 'Do you live in this city?',
    explanation: 'Use "Do" + subject + base verb for present simple questions.',
    points: 15
  },
  {
    id: 61,
    type: 'fill_blank',
    question: 'The car is very old. We are going to buy a new _____ soon.',
    options: ['one', 'it', 'ones'],
    correctAnswer: 'one',
    explanation: '"One" is used as a pronoun to avoid repeating the noun "car".',
    points: 15
  },
  {
    id: 62,
    type: 'multiple_choice',
    question: 'How _____ people were at the party?',
    options: ['much', 'many', 'some'],
    correctAnswer: 'many',
    explanation: 'Use "many" with countable nouns like "people".',
    points: 10
  },
  {
    id: 63,
    type: 'correct_mistake',
    question: 'Correct the mistake: Who\'s book is this?',
    options: [],
    correctAnswer: 'Whose book is this?',
    explanation: '"Whose" is the possessive pronoun. "Who\'s" is a contraction of "who is".',
    points: 20
  },
  {
    id: 64,
    type: 'rearrange',
    question: 'Rearrange the words: never / I / have / there / been',
    options: [],
    correctAnswer: 'I have never been there.',
    explanation: 'The adverb "never" usually goes between the auxiliary verb and the main verb.',
    points: 20
  },
  {
    id: 65,
    type: 'fill_blank',
    question: 'By the time I arrived, the movie _____ already started.',
    options: ['has', 'had', 'was'],
    correctAnswer: 'had',
    explanation: 'Use the past perfect ("had" + past participle) for an action that happened before another past action.',
    points: 20
  },
  {
    id: 66,
    type: 'multiple_choice',
    question: 'I was _____ by the movie.',
    options: ['boring', 'bored', 'bore'],
    correctAnswer: 'bored',
    explanation: 'Use the -ed adjective to describe how a person feels.',
    points: 15
  },
  {
    id: 67,
    type: 'interrogative',
    question: 'Put in interrogative form: We should leave now.',
    options: [],
    correctAnswer: 'Should we leave now?',
    explanation: 'Invert the subject and the modal verb "should".',
    points: 15
  },
  {
    id: 68,
    type: 'fill_blank',
    question: 'This is the hospital _____ I was born.',
    options: ['which', 'where', 'who'],
    correctAnswer: 'where',
    explanation: 'Use the relative adverb "where" to refer to a place.',
    points: 15
  },
  {
    id: 69,
    type: 'correct_mistake',
    question: 'Correct the mistake: He gave to me the book.',
    options: [],
    correctAnswer: 'He gave me the book.',
    explanation: 'When the indirect object ("me") comes before the direct object ("the book"), no preposition is needed.',
    points: 15
  },
  {
    id: 70,
    type: 'multiple_choice',
    question: 'She is _____ a nice person.',
    options: ['so', 'such', 'very'],
    correctAnswer: 'such',
    explanation: 'Use "such" before a noun phrase (such + a/an + adjective + noun).',
    points: 15
  },
  {
    id: 71,
    type: 'rearrange',
    question: 'Rearrange the letters: N O M Y E',
    options: [],
    correctAnswer: 'MONEY',
    explanation: 'The letters spell the word "MONEY".',
    points: 20
  },
  {
    id: 72,
    type: 'fill_blank',
    question: 'We _____ to the beach tomorrow if the weather is good.',
    options: ['will go', 'went', 'go'],
    correctAnswer: 'will go',
    explanation: 'This is a first conditional. Use "will" + base verb in the main clause.',
    points: 15
  },
  {
    id: 73,
    type: 'multiple_choice',
    question: '_____ of them knew the answer.',
    options: ['No one', 'None', 'Any'],
    correctAnswer: 'None',
    explanation: '"None of" is used with a plural noun or pronoun.',
    points: 15
  },
  {
    id: 74,
    type: 'correct_mistake',
    question: 'Correct the mistake: Every students have a book.',
    options: [],
    correctAnswer: 'Every student has a book.',
    explanation: '"Every" is followed by a singular noun and a singular verb.',
    points: 20
  },
  {
    id: 75,
    type: 'interrogative',
    question: 'Put in interrogative form: It is raining.',
    options: [],
    correctAnswer: 'Is it raining?',
    explanation: 'Invert the subject "it" and the verb "is".',
    points: 15
  },
  {
    id: 76,
    type: 'fill_blank',
    question: 'It\'s cold. You _____ wear a coat.',
    options: ['should', 'mustn\'t', 'can'],
    correctAnswer: 'should',
    explanation: '"Should" is used to give advice.',
    points: 10
  },
  {
    id: 77,
    type: 'multiple_choice',
    question: 'This problem is _____ difficult to solve.',
    options: ['to', 'too', 'two'],
    correctAnswer: 'too',
    explanation: '"Too" means "excessively" or "more than enough".',
    points: 10
  },
  {
    id: 78,
    type: 'rearrange',
    question: 'Rearrange the words: you / Can / help / me?',
    options: [],
    correctAnswer: 'Can you help me?',
    explanation: 'The structure for a modal question is Modal-Subject-Verb-Object.',
    points: 20
  },
  {
    id: 79,
    type: 'correct_mistake',
    question: 'Correct the mistake: She speaks English very good.',
    options: [],
    correctAnswer: 'She speaks English very well.',
    explanation: 'Use the adverb "well" to describe the verb "speaks", not the adjective "good".',
    points: 15
  },
  {
    id: 80,
    type: 'fill_blank',
    question: 'I want _____ a new phone.',
    options: ['buy', 'to buy', 'buying'],
    correctAnswer: 'to buy',
    explanation: 'The verb "want" is followed by the "to"-infinitive.',
    points: 10
  },
  {
    id: 81,
    type: 'multiple_choice',
    question: 'He is as _____ as his brother.',
    options: ['smart', 'smarter', 'smartest'],
    correctAnswer: 'smart',
    explanation: 'Use the base form of the adjective in "as ... as" comparisons.',
    points: 15
  },
  {
    id: 82,
    type: 'interrogative',
    question: 'Put in interrogative form: They went to the party.',
    options: [],
    correctAnswer: 'Did they go to the party?',
    explanation: 'Use "Did" + subject + base verb for past simple questions.',
    points: 15
  },
  {
    id: 83,
    type: 'fill_blank',
    question: 'Let\'s meet _____ the cinema.',
    options: ['in', 'at', 'on'],
    correctAnswer: 'at',
    explanation: 'Use "at" for specific locations or points.',
    points: 10
  },
  {
    id: 84,
    type: 'correct_mistake',
    question: 'Correct the mistake: The police is coming.',
    options: [],
    correctAnswer: 'The police are coming.',
    explanation: '"Police" is a plural noun and takes a plural verb.',
    points: 15
  },
  {
    id: 85,
    type: 'rearrange',
    question: 'Rearrange the letters: Y A F I M L',
    options: [],
    correctAnswer: 'FAMILY',
    explanation: 'The letters spell the word "FAMILY".',
    points: 20
  },
  {
    id: 86,
    type: 'multiple_choice',
    question: 'I\'m tired _____ I didn\'t sleep well.',
    options: ['so', 'because', 'but'],
    correctAnswer: 'because',
    explanation: '"Because" is used to give a reason.',
    points: 10
  },
  {
    id: 87,
    type: 'fill_blank',
    question: 'He has _____ friends.',
    options: ['few', 'little', 'less'],
    correctAnswer: 'few',
    explanation: 'Use "few" with countable nouns like "friends". "A few" would mean "some". "Few" means "not many".',
    points: 15
  },
  {
    id: 88,
    type: 'correct_mistake',
    question: 'Correct the mistake: It\'s a beautiful day, isn\'t it?',
    options: [],
    correctAnswer: 'It\'s a beautiful day, isn\'t it?',
    explanation: 'This question is already correct. The question tag for "It is" is "isn\'t it".',
    points: 20
  },
  {
    id: 89,
    type: 'interrogative',
    question: 'Put in interrogative form: He has a new car.',
    options: [],
    correctAnswer: 'Does he have a new car?',
    explanation: 'When "has" is the main verb, use "Does...have" to form the question.',
    points: 15
  },
  {
    id: 90,
    type: 'multiple_choice',
    question: 'The homework was _____ by the student.',
    options: ['do', 'did', 'done'],
    correctAnswer: 'done',
    explanation: 'This is a passive voice construction (was + past participle).',
    points: 15
  },
  {
    id: 91,
    type: 'fill_blank',
    question: 'I enjoy _____ to music.',
    options: ['to listen', 'listening', 'listen'],
    correctAnswer: 'listening',
    explanation: 'The verb "enjoy" is followed by a gerund (-ing form).',
    points: 10
  },
  {
    id: 92,
    type: 'rearrange',
    question: 'Rearrange the words: my / is / Where / phone?',
    options: [],
    correctAnswer: 'Where is my phone?',
    explanation: 'The structure for a "Wh-" question with "be" is Wh-word + be + subject.',
    points: 20
  },
  {
    id: 93,
    type: 'correct_mistake',
    question: 'Correct the mistake: I did not saw him yesterday.',
    options: [],
    correctAnswer: 'I did not see him yesterday.',
    explanation: 'After "did not" (or "didn\'t"), use the base form of the verb.',
    points: 15
  },
  {
    id: 94,
    type: 'multiple_choice',
    question: 'They arrived _____ England last week.',
    options: ['to', 'at', 'in'],
    correctAnswer: 'in',
    explanation: 'Use "in" with countries and cities when using the verb "arrive".',
    points: 10
  },
  {
    id: 95,
    type: 'fill_blank',
    question: 'If I had known, I _____ have helped you.',
    options: ['will', 'would', 'did'],
    correctAnswer: 'would',
    explanation: 'This is a third conditional sentence. Use "would have" in the main clause.',
    points: 20
  },
  {
    id: 96,
    type: 'interrogative',
    question: 'Put in interrogative form: He is from Spain.',
    options: [],
    correctAnswer: 'Is he from Spain?',
    explanation: 'Invert the subject and the verb "is".',
    points: 15
  },
  {
    id: 97,
    type: 'multiple_choice',
    question: 'This is _____ expensive than I thought.',
    options: ['more', 'most', 'much'],
    correctAnswer: 'more',
    explanation: 'Use "more" with long adjectives for comparative forms.',
    points: 10
  },
  {
    id: 98,
    type: 'correct_mistake',
    question: 'Correct the mistake: I suggest you to see a doctor.',
    options: [],
    correctAnswer: 'I suggest that you see a doctor.',
    explanation: 'The verb "suggest" is followed by a "that" clause, not a "to"-infinitive.',
    points: 20
  },
  {
    id: 99,
    type: 'rearrange',
    question: 'Rearrange the letters: T U D E N S T',
    options: [],
    correctAnswer: 'STUDENT',
    explanation: 'The letters spell the word "STUDENT".',
    points: 20
  },
  {
    id: 100,
    type: 'fill_blank',
    question: 'There is too _____ noise in this room.',
    options: ['many', 'much', 'some'],
    correctAnswer: 'much',
    explanation: '"Noise" is an uncountable noun, so use "much".',
    points: 10
  },
  {
    id: 101,
    type: 'multiple_choice',
    question: 'She worked hard, _____ she passed the exam.',
    options: ['so', 'but', 'because'],
    correctAnswer: 'so',
    explanation: '"So" is used to show a result or consequence.',
    points: 10
  },
  {
    id: 102,
    type: 'correct_mistake',
    question: 'Correct the mistake: The childrens are playing outside.',
    options: [],
    correctAnswer: 'The children are playing outside.',
    explanation: '"Children" is the correct plural form of "child".',
    points: 15
  },
  {
    id: 103,
    type: 'interrogative',
    question: 'Put in interrogative form: She made a cake.',
    options: [],
    correctAnswer: 'Did she make a cake?',
    explanation: 'Use "Did" + subject + base form of the verb for past simple questions.',
    points: 15
  },
  {
    id: 104,
    type: 'fill_blank',
    question: 'My birthday is _____ July.',
    options: ['at', 'on', 'in'],
    correctAnswer: 'in',
    explanation: 'Use "in" with months.',
    points: 10
  },
  {
    id: 105,
    type: 'rearrange',
    question: 'Rearrange the words: the / is / What / time?',
    options: [],
    correctAnswer: 'What is the time?',
    explanation: 'The standard word order for asking the time.',
    points: 20
  },
  {
    id: 106,
    type: 'multiple_choice',
    question: 'I have never _____ to Japan.',
    options: ['be', 'been', 'was'],
    correctAnswer: 'been',
    explanation: 'Use the past participle "been" with "have" in the present perfect.',
    points: 10
  },
  {
    id: 107,
    type: 'correct_mistake',
    question: 'Correct the mistake: He asked me where am I going.',
    options: [],
    correctAnswer: 'He asked me where I was going.',
    explanation: 'In reported questions, the word order is subject + verb, not inverted.',
    points: 20
  },
  {
    id: 108,
    type: 'fill_blank',
    question: 'The keys are _____ in the drawer.',
    options: ['somewhere', 'anywhere', 'nowhere'],
    correctAnswer: 'somewhere',
    explanation: '"Somewhere" is used in positive sentences to mean "in some place".',
    points: 10
  },
  {
    id: 109,
    type: 'multiple_choice',
    question: 'You can\'t go out _____ you finish your homework.',
    options: ['if', 'unless', 'when'],
    correctAnswer: 'unless',
    explanation: '"Unless" means "except if".',
    points: 15
  },
  {
    id: 110,
    type: 'interrogative',
    question: 'Put in interrogative form: They were watching TV.',
    options: [],
    correctAnswer: 'Were they watching TV?',
    explanation: 'Invert the subject and the auxiliary verb "were".',
    points: 15
  },
  {
    id: 111,
    type: 'rearrange',
    question: 'Rearrange the letters: T A W R E',
    options: [],
    correctAnswer: 'WATER',
    explanation: 'The letters spell the word "WATER".',
    points: 20
  },
  {
    id: 112,
    type: 'fill_blank',
    question: 'There are _____ of books on the shelf.',
    options: ['a lots', 'lot', 'lots'],
    correctAnswer: 'lots',
    explanation: 'The correct phrases are "lots of" or "a lot of".',
    points: 10
  },
  {
    id: 113,
    type: 'correct_mistake',
    question: 'Correct the mistake: My sister is more tall than me.',
    options: [],
    correctAnswer: 'My sister is taller than I am.',
    explanation: 'For short adjectives, add "-er" for the comparative form. It is also more formally correct to say "than I am".',
    points: 15
  },
  {
    id: 114,
    type: 'multiple_choice',
    question: 'He promised _____ me.',
    options: ['to help', 'helping', 'help'],
    correctAnswer: 'to help',
    explanation: 'The verb "promise" is followed by a "to"-infinitive.',
    points: 10
  },
  {
    id: 115,
    type: 'fill_blank',
    question: 'The letter _____ yesterday.',
    options: ['was sent', 'is sent', 'sent'],
    correctAnswer: 'was sent',
    explanation: 'This is a passive voice sentence in the past simple.',
    points: 15
  },
  {
    id: 116,
    type: 'interrogative',
    question: 'Put in interrogative form: He would like a coffee.',
    options: [],
    correctAnswer: 'Would he like a coffee?',
    explanation: 'Invert the subject and the modal "would".',
    points: 15
  },
  {
    id: 117,
    type: 'rearrange',
    question: 'Rearrange the words: not / I / understand / do',
    options: [],
    correctAnswer: 'I do not understand.',
    explanation: 'Standard word order for a negative sentence in the present simple.',
    points: 20
  },
  {
    id: 118,
    type: 'correct_mistake',
    question: 'Correct the mistake: I have less friends than you.',
    options: [],
    correctAnswer: 'I have fewer friends than you.',
    explanation: 'Use "fewer" for countable nouns like "friends". Use "less" for uncountable nouns.',
    points: 20
  },
  {
    id: 119,
    type: 'multiple_choice',
    question: '_____ the bad weather, the match was cancelled.',
    options: ['Because', 'Despite', 'Due to'],
    correctAnswer: 'Due to',
    explanation: '"Due to" is a preposition used to explain the reason for something, followed by a noun phrase.',
    points: 15
  },
  {
    id: 120,
    type: 'fill_blank',
    question: 'You must stop _____ so much noise.',
    options: ['to make', 'making', 'make'],
    correctAnswer: 'making',
    explanation: 'The verb "stop" followed by a gerund (-ing) means to cease an action.',
    points: 15
  },
  {
    id: 121,
    type: 'multiple_choice',
    question: 'She cut _____ while she was cooking.',
    options: ['her', 'herself', 'she'],
    correctAnswer: 'herself',
    explanation: 'Use a reflexive pronoun when the subject and object of a verb are the same.',
    points: 10
  },
  {
    id: 122,
    type: 'correct_mistake',
    question: 'Correct the mistake: The sun raise in the east.',
    options: [],
    correctAnswer: 'The sun rises in the east.',
    explanation: 'For a third-person singular subject ("the sun") in the simple present, the verb needs an "-s".',
    points: 15
  },
  {
    id: 123,
    type: 'interrogative',
    question: 'Put in interrogative form: We could see the ocean.',
    options: [],
    correctAnswer: 'Could we see the ocean?',
    explanation: 'Invert the subject and the modal verb "could".',
    points: 15
  },
  {
    id: 124,
    type: 'rearrange',
    question: 'Rearrange the letters: E G A U G N A L',
    options: [],
    correctAnswer: 'LANGUAGE',
    explanation: 'The letters spell the word "LANGUAGE".',
    points: 20
  },
  {
    id: 125,
    type: 'fill_blank',
    question: 'He is responsible _____ the marketing department.',
    options: ['for', 'of', 'to'],
    correctAnswer: 'for',
    explanation: 'The correct preposition after "responsible" is "for".',
    points: 10
  },
  {
    id: 126,
    type: 'multiple_choice',
    question: 'This is the _____ film I have ever seen.',
    options: ['worse', 'bad', 'worst'],
    correctAnswer: 'worst',
    explanation: '"Worst" is the superlative form of "bad".',
    points: 10
  },
  {
    id: 127,
    type: 'correct_mistake',
    question: 'Correct the mistake: She told to me a secret.',
    options: [],
    correctAnswer: 'She told me a secret.',
    explanation: 'The verb "tell" is not followed by "to" when it has an indirect object.',
    points: 15
  },
  {
    id: 128,
    type: 'fill_blank',
    question: '_____ you ever been to Paris?',
    options: ['Did', 'Have', 'Are'],
    correctAnswer: 'Have',
    explanation: 'This is a present perfect question asking about life experience.',
    points: 10
  },
  {
    id: 129,
    type: 'interrogative',
    question: 'Put in interrogative form: The train will be late.',
    options: [],
    correctAnswer: 'Will the train be late?',
    explanation: 'Invert the subject and the modal verb "will".',
    points: 15
  },
  {
    id: 130,
    type: 'rearrange',
    question: 'Rearrange the words: book / This / is / interesting / very',
    options: [],
    correctAnswer: 'This book is very interesting.',
    explanation: 'The standard sentence structure is Subject-Verb-Adverb-Adjective.',
    points: 20
  },
  {
    id: 131,
    type: 'multiple_choice',
    question: 'He succeeded _____ passing the exam.',
    options: ['at', 'in', 'on'],
    correctAnswer: 'in',
    explanation: 'The correct preposition after "succeeded" is "in".',
    points: 10
  },
  {
    id: 132,
    type: 'correct_mistake',
    question: 'Correct the mistake: I am agree with you.',
    options: [],
    correctAnswer: 'I agree with you.',
    explanation: '"Agree" is a verb, not an adjective, so it doesn\'t need "am".',
    points: 15
  },
  {
    id: 133,
    type: 'fill_blank',
    question: 'He avoided _____ my question.',
    options: ['to answer', 'answering', 'answer'],
    correctAnswer: 'answering',
    explanation: 'The verb "avoid" is followed by a gerund (-ing form).',
    points: 15
  },
  {
    id: 134,
    type: 'multiple_choice',
    question: 'This dress is _____ yours.',
    options: ['the same as', 'same that', 'the same like'],
    correctAnswer: 'the same as',
    explanation: 'The correct expression is "the same as".',
    points: 15
  },
  {
    id: 135,
    type: 'interrogative',
    question: 'Put in interrogative form: He speaks German.',
    options: [],
    correctAnswer: 'Does he speak German?',
    explanation: 'Use "Does" + subject + base verb for third-person present simple questions.',
    points: 15
  },
  {
    id: 136,
    type: 'rearrange',
    question: 'Rearrange the letters: O R O M T W O R',
    options: [],
    correctAnswer: 'TOMORROW',
    explanation: 'The letters spell the word "TOMORROW".',
    points: 20
  },
  {
    id: 137,
    type: 'fill_blank',
    question: 'She is used to _____ early.',
    options: ['get up', 'getting up', 'got up'],
    correctAnswer: 'getting up',
    explanation: 'The phrase "be used to" is followed by a gerund (-ing form).',
    points: 20
  },
  {
    id: 138,
    type: 'correct_mistake',
    question: 'Correct the mistake: It depends of the weather.',
    options: [],
    correctAnswer: 'It depends on the weather.',
    explanation: 'The correct preposition after "depends" is "on".',
    points: 15
  },
  {
    id: 139,
    type: 'multiple_choice',
    question: 'Neither my brother _____ my sister can come.',
    options: ['or', 'nor', 'and'],
    correctAnswer: 'nor',
    explanation: 'The correct pairing is "neither ... nor".',
    points: 10
  },
  {
    id: 140,
    type: 'fill_blank',
    question: 'I would rather _____ at home tonight.',
    options: ['stay', 'to stay', 'staying'],
    correctAnswer: 'stay',
    explanation: '"Would rather" is followed by the base form of the verb (infinitive without "to").',
    points: 15
  },
  {
    id: 141,
    type: 'interrogative',
    question: 'Put in interrogative form: They have been waiting for an hour.',
    options: [],
    correctAnswer: 'Have they been waiting for an hour?',
    explanation: 'Invert the subject and the auxiliary verb "have".',
    points: 15
  },
  {
    id: 142,
    type: 'rearrange',
    question: 'Rearrange the words: you / seen / Have / it?',
    options: [],
    correctAnswer: 'Have you seen it?',
    explanation: 'Standard word order for a present perfect question.',
    points: 20
  },
  {
    id: 143,
    type: 'correct_mistake',
    question: 'Correct the mistake: I wish I am taller.',
    options: [],
    correctAnswer: 'I wish I were taller.',
    explanation: 'After "wish", use the subjunctive mood "were" for hypothetical situations.',
    points: 20
  },
  {
    id: 144,
    type: 'multiple_choice',
    question: 'He is not only a good student _____ a talented artist.',
    options: ['but also', 'and', 'or'],
    correctAnswer: 'but also',
    explanation: 'The correct correlative conjunction is "not only ... but also".',
    points: 10
  },
  {
    id: 145,
    type: 'fill_blank',
    question: 'The teacher made me _____ the essay again.',
    options: ['to write', 'write', 'writing'],
    correctAnswer: 'write',
    explanation: '"Make" in the sense of "force" is followed by an object and the base form of the verb.',
    points: 15
  },
  {
    id: 146,
    type: 'multiple_choice',
    question: 'He works as an engineer, _____?',
    options: ['does he', 'doesn\'t he', 'is he'],
    correctAnswer: 'doesn\'t he',
    explanation: 'This is a question tag. A positive statement is followed by a negative tag.',
    points: 15
  },
  {
    id: 147,
    type: 'correct_mistake',
    question: 'Correct the mistake: I enjoyed the film, it\'s special effects were amazing.',
    options: [],
    correctAnswer: 'I enjoyed the film, its special effects were amazing.',
    explanation: '"Its" is the possessive pronoun. "It\'s" is the contraction for "it is".',
    points: 20
  },
  {
    id: 148,
    type: 'interrogative',
    question: 'Put in interrogative form: This car was made in Germany.',
    options: [],
    correctAnswer: 'Was this car made in Germany?',
    explanation: 'Invert the subject and the auxiliary verb "was".',
    points: 15
  },
  {
    id: 149,
    type: 'rearrange',
    question: 'Rearrange the letters: S U B S I N E S',
    options: [],
    correctAnswer: 'BUSINESS',
    explanation: 'The letters spell the word "BUSINESS".',
    points: 20
  },
  {
    id: 150,
    type: 'fill_blank',
    question: 'I can\'t find my keys _____.',
    options: ['somewhere', 'anywhere', 'nowhere'],
    correctAnswer: 'anywhere',
    explanation: 'Use "anywhere" in negative sentences.',
    points: 10
  },
  {
    id: 151,
    type: 'multiple_choice',
    question: '_____ he was tired, he continued working.',
    options: ['Although', 'Because', 'So'],
    correctAnswer: 'Although',
    explanation: '"Although" is used to show a contrast.',
    points: 10
  },
  {
    id: 152,
    type: 'correct_mistake',
    question: 'Correct the mistake: He runs more faster than me.',
    options: [],
    correctAnswer: 'He runs faster than me.',
    explanation: 'Do not use "more" with a comparative adjective that already ends in "-er".',
    points: 15
  },
  {
    id: 153,
    type: 'interrogative',
    question: 'Put in interrogative form: They must finish the project.',
    options: [],
    correctAnswer: 'Must they finish the project?',
    explanation: 'Invert the subject and the modal "must".',
    points: 15
  },
  {
    id: 154,
    type: 'fill_blank',
    question: 'This house was built _____ my grandfather.',
    options: ['by', 'from', 'of'],
    correctAnswer: 'by',
    explanation: 'Use "by" in passive sentences to show who performed the action.',
    points: 10
  },
  {
    id: 155,
    type: 'rearrange',
    question: 'Rearrange the words: a / I / walk / for / went',
    options: [],
    correctAnswer: 'I went for a walk.',
    explanation: 'Standard word order for a simple past tense sentence.',
    points: 20
  },
  {
    id: 156,
    type: 'multiple_choice',
    question: 'She is good _____ playing the piano.',
    options: ['in', 'on', 'at'],
    correctAnswer: 'at',
    explanation: 'The correct collocation is "good at".',
    points: 10
  },
  {
    id: 157,
    type: 'correct_mistake',
    question: 'Correct the mistake: He gave me an advice.',
    options: [],
    correctAnswer: 'He gave me some advice.',
    explanation: '"Advice" is an uncountable noun. To make it singular, you can say "a piece of advice".',
    points: 20
  },
  {
    id: 158,
    type: 'fill_blank',
    question: 'At this time tomorrow, I _____ on a beach.',
    options: ['will sit', 'will be sitting', 'sit'],
    correctAnswer: 'will be sitting',
    explanation: 'Use the future continuous for an action that will be in progress at a specific time in the future.',
    points: 15
  },
  {
    id: 159,
    type: 'multiple_choice',
    question: 'He is _____ to lift that box.',
    options: ['enough strong', 'strong enough', 'so strong'],
    correctAnswer: 'strong enough',
    explanation: '"Enough" comes after the adjective it modifies.',
    points: 15
  },
  {
    id: 160,
    type: 'interrogative',
    question: 'Put in interrogative form: You saw the accident.',
    options: [],
    correctAnswer: 'Did you see the accident?',
    explanation: 'Use "Did" + subject + base verb for past simple questions.',
    points: 15
  },
  {
    id: 161,
    type: 'rearrange',
    question: 'Rearrange the letters: T R O P S',
    options: [],
    correctAnswer: 'SPORT',
    explanation: 'The letters spell the word "SPORT".',
    points: 20
  },
  {
    id: 162,
    type: 'fill_blank',
    question: 'I haven\'t decided yet, but I _____ go to the party.',
    options: ['must', 'might', 'have to'],
    correctAnswer: 'might',
    explanation: '"Might" is used to express possibility, not certainty.',
    points: 10
  },
  {
    id: 163,
    type: 'correct_mistake',
    question: 'Correct the mistake: What means this word?',
    options: [],
    correctAnswer: 'What does this word mean?',
    explanation: 'The correct question structure is "Wh-word + auxiliary + subject + verb".',
    points: 15
  },
  {
    id: 164,
    type: 'multiple_choice',
    question: 'There is _____ traffic on the roads today.',
    options: ['fewer', 'less', 'few'],
    correctAnswer: 'less',
    explanation: 'Use "less" with uncountable nouns like "traffic".',
    points: 10
  },
  {
    id: 165,
    type: 'fill_blank',
    question: 'He stopped _____ a cigarette.',
    options: ['to smoke', 'smoking', 'smoke'],
    correctAnswer: 'to smoke',
    explanation: '"Stop" + to-infinitive means stopping one action to start another.',
    points: 15
  },
  {
    id: 166,
    type: 'interrogative',
    question: 'Put in interrogative form: She has been to Italy.',
    options: [],
    correctAnswer: 'Has she been to Italy?',
    explanation: 'Invert the subject and the auxiliary verb "has".',
    points: 15
  },
  {
    id: 167,
    type: 'rearrange',
    question: 'Rearrange the words: a / What / day / beautiful!',
    options: [],
    correctAnswer: 'What a beautiful day!',
    explanation: 'This is the standard structure for an exclamatory sentence.',
    points: 20
  },
  {
    id: 168,
    type: 'correct_mistake',
    question: 'Correct the mistake: He works hardly.',
    options: [],
    correctAnswer: 'He works hard.',
    explanation: '"Hard" is both an adjective and an adverb. "Hardly" means "almost not".',
    points: 20
  },
  {
    id: 169,
    type: 'multiple_choice',
    question: 'I\'ll call you as soon as I _____ home.',
    options: ['will get', 'get', 'got'],
    correctAnswer: 'get',
    explanation: 'After time conjunctions like "as soon as", use the present simple to refer to the future.',
    points: 15
  },
  {
    id: 170,
    type: 'fill_blank',
    question: 'The film is based _____ a true story.',
    options: ['on', 'in', 'at'],
    correctAnswer: 'on',
    explanation: 'The correct collocation is "based on".',
    points: 10
  },
  {
    id: 171,
    type: 'multiple_choice',
    question: 'I\'m sorry _____ being late.',
    options: ['for', 'about', 'to'],
    correctAnswer: 'for',
    explanation: 'The expression is "to be sorry for" something.',
    points: 10
  },
  {
    id: 172,
    type: 'correct_mistake',
    question: 'Correct the mistake: Everyone are here.',
    options: [],
    correctAnswer: 'Everyone is here.',
    explanation: 'Pronouns like "everyone" are singular and take a singular verb.',
    points: 15
  },
  {
    id: 173,
    type: 'interrogative',
    question: 'Put in interrogative form: We are late.',
    options: [],
    correctAnswer: 'Are we late?',
    explanation: 'Invert the subject and the verb "are".',
    points: 15
  },
  {
    id: 174,
    type: 'rearrange',
    question: 'Rearrange the letters: P A Y H P',
    options: [],
    correctAnswer: 'HAPPY',
    explanation: 'The letters spell the word "HAPPY".',
    points: 20
  },
  {
    id: 175,
    type: 'fill_blank',
    question: 'This is the _____ part of the test.',
    options: ['more difficult', 'most difficult', 'difficulter'],
    correctAnswer: 'most difficult',
    explanation: 'Use "most" with long adjectives to form the superlative.',
    points: 15
  },
  {
    id: 176,
    type: 'multiple_choice',
    question: 'She is _____ a doctor or a nurse, I can\'t remember.',
    options: ['neither', 'either', 'both'],
    correctAnswer: 'either',
    explanation: 'The correct pairing for showing a choice between two options is "either ... or".',
    points: 10
  },
  {
    id: 177,
    type: 'correct_mistake',
    question: 'Correct the mistake: I prefer to not go out tonight.',
    options: [],
    correctAnswer: 'I prefer not to go out tonight.',
    explanation: 'The negative for an infinitive is "not to" + verb.',
    points: 15
  },
  {
    id: 178,
    type: 'fill_blank',
    question: 'We _____ for three hours when the bus finally arrived.',
    options: ['waited', 'were waiting', 'had been waiting'],
    correctAnswer: 'had been waiting',
    explanation: 'Use the past perfect continuous to emphasize the duration of an activity that was in progress before another past event.',
    points: 20
  },
  {
    id: 179,
    type: 'interrogative',
    question: 'Put in interrogative form: The movie was interesting.',
    options: [],
    correctAnswer: 'Was the movie interesting?',
    explanation: 'Invert the subject and the verb "was".',
    points: 15
  },
  {
    id: 180,
    type: 'rearrange',
    question: 'Rearrange the words: go / Let\'s / the / to / park.',
    options: [],
    correctAnswer: 'Let\'s go to the park.',
    explanation: 'This is the standard structure for a suggestion using "Let\'s".',
    points: 20
  },
  {
    id: 181,
    type: 'multiple_choice',
    question: 'My car is _____ repaired.',
    options: ['being', 'been', 'be'],
    correctAnswer: 'being',
    explanation: 'This is the present continuous passive voice (is + being + past participle).',
    points: 15
  },
  {
    id: 182,
    type: 'correct_mistake',
    question: 'Correct the mistake: She has two brother-in-laws.',
    options: [],
    correctAnswer: 'She has two brothers-in-law.',
    explanation: 'For compound nouns, the main noun ("brother") is pluralized.',
    points: 20
  },
  {
    id: 183,
    type: 'fill_blank',
    question: 'You should get your car _____.',
    options: ['service', 'servicing', 'serviced'],
    correctAnswer: 'serviced',
    explanation: 'This is a causative structure: get + object + past participle.',
    points: 15
  },
  {
    id: 184,
    type: 'multiple_choice',
    question: 'The longer you wait, the _____ it gets.',
    options: ['harder', 'hardest', 'hard'],
    correctAnswer: 'harder',
    explanation: 'This is a comparative structure: "The + comparative, the + comparative".',
    points: 15
  },
  {
    id: 185,
    type: 'interrogative',
    question: 'Put in interrogative form: He used to live here.',
    options: [],
    correctAnswer: 'Did he use to live here?',
    explanation: 'To make a question with "used to", use "Did" + subject + "use to".',
    points: 15
  },
  {
    id: 186,
    type: 'rearrange',
    question: 'Rearrange the letters: R U N C Y T O',
    options: [],
    correctAnswer: 'COUNTRY',
    explanation: 'The letters spell the word "COUNTRY".',
    points: 20
  },
  {
    id: 187,
    type: 'fill_blank',
    question: 'I wish I _____ speak French.',
    options: ['can', 'could', 'will'],
    correctAnswer: 'could',
    explanation: 'After "wish", use "could" to talk about ability you would like to have.',
    points: 15
  },
  {
    id: 188,
    type: 'correct_mistake',
    question: 'Correct the mistake: I am looking for my keys, but I can\'t find them nowhere.',
    options: [],
    correctAnswer: 'I am looking for my keys, but I can\'t find them anywhere.',
    explanation: 'Avoid double negatives. Use "anywhere" with a negative verb like "can\'t".',
    points: 15
  },
  {
    id: 189,
    type: 'multiple_choice',
    question: 'I\'ll do it _____ I have time.',
    options: ['when', 'during', 'unless'],
    correctAnswer: 'when',
    explanation: '"When" is a conjunction used to indicate a future time.',
    points: 10
  },
  {
    id: 190,
    type: 'fill_blank',
    question: 'He is allergic _____ cats.',
    options: ['with', 'from', 'to'],
    correctAnswer: 'to',
    explanation: 'The correct collocation is "allergic to".',
    points: 10
  },
  {
    id: 191,
    type: 'interrogative',
    question: 'Put in interrogative form: It might rain later.',
    options: [],
    correctAnswer: 'Might it rain later?',
    explanation: 'Invert the subject and the modal "might". This is less common than "Do you think it will rain?".',
    points: 15
  },
  {
    id: 192,
    type: 'rearrange',
    question: 'Rearrange the words: to / I / like / would / order.',
    options: [],
    correctAnswer: 'I would like to order.',
    explanation: 'Standard phrase for ordering in a restaurant.',
    points: 20
  },
  {
    id: 193,
    type: 'correct_mistake',
    question: 'Correct the mistake: Despite he was rich, he was unhappy.',
    options: [],
    correctAnswer: 'Despite being rich, he was unhappy.',
    explanation: '"Despite" is a preposition and must be followed by a noun or gerund phrase.',
    points: 20
  },
  {
    id: 194,
    type: 'multiple_choice',
    question: 'He couldn\'t come to the party _____ his illness.',
    options: ['because', 'because of', 'so'],
    correctAnswer: 'because of',
    explanation: '"Because of" is a preposition followed by a noun. "Because" is a conjunction followed by a clause.',
    points: 15
  },
  {
    id: 195,
    type: 'fill_blank',
    question: 'It\'s no use _____ about it.',
    options: ['to worry', 'worrying', 'worry'],
    correctAnswer: 'worrying',
    explanation: 'The expression "it\'s no use" is followed by a gerund (-ing form).',
    points: 15
  },
  {
    id: 196,
    type: 'multiple_choice',
    question: 'He is _____ young to drive a car.',
    options: ['to', 'two', 'too'],
    correctAnswer: 'too',
    explanation: '"Too" means "excessively". The structure is "too + adjective + to-infinitive".',
    points: 10
  },
  {
    id: 197,
    type: 'correct_mistake',
    question: 'Correct the mistake: The amount of people is increasing.',
    options: [],
    correctAnswer: 'The number of people is increasing.',
    explanation: 'Use "number" for countable nouns like "people". Use "amount" for uncountable nouns.',
    points: 20
  },
  {
    id: 198,
    type: 'interrogative',
    question: 'Put in interrogative form: He had to leave early.',
    options: [],
    correctAnswer: 'Did he have to leave early?',
    explanation: 'To form a question with "had to", use "Did" + subject + "have to".',
    points: 15
  },
  {
    id: 199,
    type: 'rearrange',
    question: 'Rearrange the letters: O I N M R G N',
    options: [],
    correctAnswer: 'MORNING',
    explanation: 'The letters spell the word "MORNING".',
    points: 20
  },
  {
    id: 200,
    type: 'fill_blank',
    question: 'You haven\'t eaten all day. You _____ be hungry.',
    options: ['might', 'must', 'should'],
    correctAnswer: 'must',
    explanation: 'Use "must" for a logical conclusion or strong deduction.',
    points: 15
  }
]