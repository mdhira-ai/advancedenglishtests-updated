'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Target,
  Award
} from 'lucide-react'

// Tense data structure
const tenseCategories = [
  {
    id: 'present',
    title: 'Present Tenses',
    description: 'Simple, Continuous, Perfect, and Perfect Continuous',
    color: 'blue',
    lessons: [
      {
        id: 'present-simple',
        title: 'Present Simple',
        description: 'Used for habits, facts, and general truths',
        examples: [
          'I work every day.',
          'The sun rises in the east.',
          'She speaks three languages.'
        ],
        structure: {
          positive: 'Subject + base verb (+ s/es for 3rd person)',
          negative: 'Subject + do/does + not + base verb',
          question: 'Do/Does + subject + base verb?'
        },
        exercises: [
          {
            question: 'She _____ to work by bus every morning.',
            options: ['go', 'goes', 'going', 'went'],
            correct: 1,
            explanation: 'Present simple uses base verb + s/es for 3rd person singular.'
          },
          {
            question: '_____ you speak English?',
            options: ['Are', 'Do', 'Does', 'Is'],
            correct: 1,
            explanation: 'Questions in present simple use "Do" for I/you/we/they.'
          }
        ]
      },
      {
        id: 'present-continuous',
        title: 'Present Continuous',
        description: 'Used for actions happening now or temporary situations',
        examples: [
          'I am studying English now.',
          'They are building a new house.',
          'She is working on a project this week.'
        ],
        structure: {
          positive: 'Subject + am/is/are + verb+ing',
          negative: 'Subject + am/is/are + not + verb+ing',
          question: 'Am/Is/Are + subject + verb+ing?'
        },
        exercises: [
          {
            question: 'Look! It _____ outside.',
            options: ['rain', 'rains', 'is raining', 'was raining'],
            correct: 2,
            explanation: 'Present continuous for actions happening right now.'
          },
          {
            question: 'We _____ dinner at the moment.',
            options: ['have', 'are having', 'has', 'having'],
            correct: 1,
            explanation: 'Present continuous: am/is/are + verb+ing.'
          }
        ]
      },
      {
        id: 'present-perfect',
        title: 'Present Perfect',
        description: 'Used for actions completed at an unspecified time or continuing to present',
        examples: [
          'I have lived here for five years.',
          'She has finished her homework.',
          'They have never been to Paris.'
        ],
        structure: {
          positive: 'Subject + have/has + past participle',
          negative: 'Subject + have/has + not + past participle',
          question: 'Have/Has + subject + past participle?'
        },
        exercises: [
          {
            question: 'I _____ that movie three times.',
            options: ['see', 'saw', 'have seen', 'am seeing'],
            correct: 2,
            explanation: 'Present perfect for experiences without specific time.'
          },
          {
            question: '_____ you ever _____ to Japan?',
            options: ['Do/go', 'Have/been', 'Did/go', 'Are/going'],
            correct: 1,
            explanation: 'Present perfect for life experiences with "ever".'
          },
          {
            question: 'She _____ here since 2020.',
            options: ['works', 'worked', 'has worked', 'is working'],
            correct: 2,
            explanation: 'Present perfect with "since" for duration from past to now.'
          }
        ]
      },
      {
        id: 'present-perfect-continuous',
        title: 'Present Perfect Continuous',
        description: 'Used for actions that started in the past and continue to the present',
        examples: [
          'I have been studying for two hours.',
          'She has been working here since 2020.',
          'They have been building that house for months.'
        ],
        structure: {
          positive: 'Subject + have/has + been + verb+ing',
          negative: 'Subject + have/has + not + been + verb+ing',
          question: 'Have/Has + subject + been + verb+ing?'
        },
        exercises: [
          {
            question: 'I _____ for you for an hour!',
            options: ['wait', 'waited', 'have waited', 'have been waiting'],
            correct: 3,
            explanation: 'Present perfect continuous emphasizes the duration of ongoing action.'
          },
          {
            question: 'How long _____ English?',
            options: ['do you study', 'have you studied', 'have you been studying', 'are you studying'],
            correct: 2,
            explanation: 'Present perfect continuous for duration questions with "How long".'
          }
        ]
      }
    ]
  },
  {
    id: 'past',
    title: 'Past Tenses',
    description: 'Simple, Continuous, Perfect, and Perfect Continuous',
    color: 'green',
    lessons: [
      {
        id: 'past-simple',
        title: 'Past Simple',
        description: 'Used for completed actions in the past',
        examples: [
          'I visited London last year.',
          'She finished her homework.',
          'They didn\'t come to the party.'
        ],
        structure: {
          positive: 'Subject + verb (past form)',
          negative: 'Subject + did + not + base verb',
          question: 'Did + subject + base verb?'
        },
        exercises: [
          {
            question: 'Yesterday, I _____ to the cinema.',
            options: ['go', 'went', 'going', 'have gone'],
            correct: 1,
            explanation: 'Past simple for completed actions with time reference.'
          }
        ]
      },
      {
        id: 'past-continuous',
        title: 'Past Continuous',
        description: 'Used for actions in progress at a specific time in the past',
        examples: [
          'I was watching TV when he called.',
          'They were playing football at 3 PM.',
          'She wasn\'t listening during the meeting.'
        ],
        structure: {
          positive: 'Subject + was/were + verb+ing',
          negative: 'Subject + was/were + not + verb+ing',
          question: 'Was/Were + subject + verb+ing?'
        },
        exercises: [
          {
            question: 'At 8 PM yesterday, I _____ dinner.',
            options: ['eat', 'ate', 'was eating', 'have eaten'],
            correct: 2,
            explanation: 'Past continuous for actions in progress at a specific past time.'
          },
          {
            question: 'While she _____, the phone rang.',
            options: ['studies', 'studied', 'was studying', 'has studied'],
            correct: 2,
            explanation: 'Past continuous with "while" for interrupted actions.'
          }
        ]
      },
      {
        id: 'past-perfect',
        title: 'Past Perfect',
        description: 'Used for actions completed before another action in the past',
        examples: [
          'I had finished my work before he arrived.',
          'She had already left when I called.',
          'They hadn\'t seen the movie before.'
        ],
        structure: {
          positive: 'Subject + had + past participle',
          negative: 'Subject + had + not + past participle',
          question: 'Had + subject + past participle?'
        },
        exercises: [
          {
            question: 'By the time I arrived, the meeting _____ already _____.',
            options: ['has/started', 'had/started', 'was/starting', 'did/start'],
            correct: 1,
            explanation: 'Past perfect for actions completed before another past action.'
          },
          {
            question: 'She realized she _____ her keys at home.',
            options: ['left', 'leaves', 'had left', 'was leaving'],
            correct: 2,
            explanation: 'Past perfect for the earlier of two past actions.'
          }
        ]
      },
      {
        id: 'past-perfect-continuous',
        title: 'Past Perfect Continuous',
        description: 'Used for ongoing actions that continued up to a point in the past',
        examples: [
          'I had been working for hours when she called.',
          'They had been living there for years before moving.',
          'He had been studying all night.'
        ],
        structure: {
          positive: 'Subject + had + been + verb+ing',
          negative: 'Subject + had + not + been + verb+ing',
          question: 'Had + subject + been + verb+ing?'
        },
        exercises: [
          {
            question: 'She was tired because she _____ all day.',
            options: ['worked', 'was working', 'had worked', 'had been working'],
            correct: 3,
            explanation: 'Past perfect continuous for ongoing action leading to a past result.'
          },
          {
            question: 'How long _____ before you found a job?',
            options: ['did you search', 'were you searching', 'had you searched', 'had you been searching'],
            correct: 3,
            explanation: 'Past perfect continuous for duration up to a past point.'
          }
        ]
      }
    ]
  },
  {
    id: 'future',
    title: 'Future Tenses',
    description: 'Will, Going to, Continuous, Perfect, and Perfect Continuous',
    color: 'purple',
    lessons: [
      {
        id: 'future-will',
        title: 'Future with Will',
        description: 'Used for predictions, promises, and spontaneous decisions',
        examples: [
          'I will help you tomorrow.',
          'It will rain later.',
          'She won\'t be late.'
        ],
        structure: {
          positive: 'Subject + will + base verb',
          negative: 'Subject + will + not + base verb',
          question: 'Will + subject + base verb?'
        },
        exercises: [
          {
            question: 'Don\'t worry, I _____ you with your homework.',
            options: ['help', 'will help', 'am helping', 'helped'],
            correct: 1,
            explanation: 'Will for spontaneous offers and promises.'
          }
        ]
      },
      {
        id: 'future-going-to',
        title: 'Future with Going To',
        description: 'Used for planned actions and predictions based on evidence',
        examples: [
          'I am going to visit my parents next week.',
          'Look at those clouds! It\'s going to rain.',
          'She is going to study medicine.'
        ],
        structure: {
          positive: 'Subject + am/is/are + going to + base verb',
          negative: 'Subject + am/is/are + not + going to + base verb',
          question: 'Am/Is/Are + subject + going to + base verb?'
        },
        exercises: [
          {
            question: 'Look at those dark clouds! It _____ rain soon.',
            options: ['will', 'is going to', 'rains', 'is raining'],
            correct: 1,
            explanation: 'Going to for predictions based on present evidence.'
          },
          {
            question: 'We _____ move to a new house next month.',
            options: ['will', 'are going to', 'moved', 'move'],
            correct: 1,
            explanation: 'Going to for planned future actions.'
          }
        ]
      },
      {
        id: 'future-continuous',
        title: 'Future Continuous',
        description: 'Used for actions that will be in progress at a specific future time',
        examples: [
          'At 8 PM tonight, I will be watching TV.',
          'This time tomorrow, we will be flying to Paris.',
          'She will be working late tonight.'
        ],
        structure: {
          positive: 'Subject + will + be + verb+ing',
          negative: 'Subject + will + not + be + verb+ing',
          question: 'Will + subject + be + verb+ing?'
        },
        exercises: [
          {
            question: 'This time next week, I _____ on the beach.',
            options: ['will lie', 'will be lying', 'am lying', 'lie'],
            correct: 1,
            explanation: 'Future continuous for actions in progress at a specific future time.'
          },
          {
            question: 'Don\'t call me at 9 PM. I _____ dinner.',
            options: ['will have', 'will be having', 'have', 'am having'],
            correct: 1,
            explanation: 'Future continuous for actions in progress at a future time.'
          }
        ]
      },
      {
        id: 'future-perfect',
        title: 'Future Perfect',
        description: 'Used for actions that will be completed before a specific future time',
        examples: [
          'I will have finished my work by 6 PM.',
          'She will have graduated by next year.',
          'They will have arrived before the meeting starts.'
        ],
        structure: {
          positive: 'Subject + will + have + past participle',
          negative: 'Subject + will + not + have + past participle',
          question: 'Will + subject + have + past participle?'
        },
        exercises: [
          {
            question: 'By the time you arrive, I _____ dinner.',
            options: ['will cook', 'will be cooking', 'will have cooked', 'cook'],
            correct: 2,
            explanation: 'Future perfect for actions completed before a future point.'
          },
          {
            question: 'She _____ her degree by next summer.',
            options: ['will finish', 'will be finishing', 'will have finished', 'finishes'],
            correct: 2,
            explanation: 'Future perfect with "by" for completion before a deadline.'
          }
        ]
      },
      {
        id: 'future-perfect-continuous',
        title: 'Future Perfect Continuous',
        description: 'Used for ongoing actions that will continue up to a specific future point',
        examples: [
          'By next month, I will have been working here for five years.',
          'She will have been studying for three hours by 9 PM.',
          'They will have been living here for a decade next year.'
        ],
        structure: {
          positive: 'Subject + will + have + been + verb+ing',
          negative: 'Subject + will + not + have + been + verb+ing',
          question: 'Will + subject + have + been + verb+ing?'
        },
        exercises: [
          {
            question: 'By December, we _____ in this house for 10 years.',
            options: ['will live', 'will be living', 'will have lived', 'will have been living'],
            correct: 3,
            explanation: 'Future perfect continuous for duration continuing to a future point.'
          },
          {
            question: 'Next week, I _____ at this company for exactly one year.',
            options: ['will work', 'will be working', 'will have worked', 'will have been working'],
            correct: 3,
            explanation: 'Future perfect continuous emphasizes the ongoing nature of the action.'
          }
        ]
      }
    ]
  }
]

type ViewState = 'overview' | 'category' | 'lesson' | 'exercise'

interface TenseComponentProps {
  onBack?: () => void
}

export default function TenseComponent({ onBack }: TenseComponentProps) {
  const [currentView, setCurrentView] = useState<ViewState>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [exercisesCompleted, setExercisesCompleted] = useState(0)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentView('category')
  }

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId)
    setCurrentView('lesson')
  }

  const handleStartExercise = () => {
    setCurrentView('exercise')
    setCurrentExercise(0)
    setScore(0)
    setExercisesCompleted(0)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    const currentCategory = tenseCategories.find(cat => cat.id === selectedCategory)
    const currentLessonData = currentCategory?.lessons.find(lesson => lesson.id === selectedLesson)
    const exercise = currentLessonData?.exercises[currentExercise]
    
    if (exercise && selectedAnswer === exercise.correct) {
      setScore(score + 1)
    }
    
    setShowResult(true)
  }

  const handleNextExercise = () => {
    const currentCategory = tenseCategories.find(cat => cat.id === selectedCategory)
    const currentLessonData = currentCategory?.lessons.find(lesson => lesson.id === selectedLesson)
    
    if (currentLessonData && currentExercise < currentLessonData.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setExercisesCompleted(exercisesCompleted + 1)
    } else {
      // Exercise completed
      setCurrentView('lesson')
    }
  }

  const getCurrentCategory = () => tenseCategories.find(cat => cat.id === selectedCategory)
  const getCurrentLesson = () => getCurrentCategory()?.lessons.find(lesson => lesson.id === selectedLesson)

  // Overview View
  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(to bottom right, #4f5bd5, #1A3A6E)'}}>
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">English Tenses</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Master all English tenses with clear explanations, examples, and interactive exercises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tenseCategories.map((category) => (
            <Card 
              key={category.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              onClick={() => handleCategorySelect(category.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.title}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Badge variant="secondary">{category.lessons.length} lessons</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

          {onBack && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Topics</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Category View
  if (currentView === 'category' && selectedCategory) {
    const category = getCurrentCategory()
    if (!category) return null

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('overview')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{category.title}</h1>
          <p className="text-gray-600">{category.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {category.lessons.map((lesson) => (
            <Card 
              key={lesson.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg"
              onClick={() => handleLessonSelect(lesson.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{lesson.title}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{lesson.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{lesson.exercises.length} exercises</span>
                  <Badge variant="secondary">Start Learning</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </div>
    )
  }

  // Lesson View
  if (currentView === 'lesson' && selectedLesson) {
    const lesson = getCurrentLesson()
    if (!lesson) return null

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('category')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
          <p className="text-gray-600">{lesson.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Structure</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Positive</h4>
                <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{lesson.structure.positive}</p>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Negative</h4>
                <p className="text-gray-700 bg-red-50 p-3 rounded-lg">{lesson.structure.negative}</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Question</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{lesson.structure.question}</p>
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Examples</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lesson.examples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{example}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={handleStartExercise}
            className="text-white px-8 py-3"
            style={{background: 'linear-gradient(to right, #4f5bd5, #1A3A6E)'}}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Exercises ({lesson.exercises.length} questions)
          </Button>
        </div>
        </div>
      </div>
    )
  }

  // Exercise View
  if (currentView === 'exercise' && selectedLesson) {
    const lesson = getCurrentLesson()
    if (!lesson) return null
    
    const exercise = lesson.exercises[currentExercise]
    const progress = ((currentExercise + 1) / lesson.exercises.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('lesson')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Lesson</span>
          </Button>
          
          <div className="text-sm text-gray-500">
            Question {currentExercise + 1} of {lesson.exercises.length}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="mb-6">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">{exercise.question}</h3>
              
              <div className="space-y-3">
                {exercise.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === index
                        ? showResult
                          ? index === exercise.correct
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-blue-500 bg-blue-50'
                        : showResult && index === exercise.correct
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? showResult
                            ? index === exercise.correct
                              ? 'border-green-500 bg-green-500'
                              : 'border-red-500 bg-red-500'
                            : 'border-blue-500 bg-blue-500'
                          : showResult && index === exercise.correct
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {((selectedAnswer === index && showResult) || (showResult && index === exercise.correct)) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                        {(selectedAnswer === index && showResult && index !== exercise.correct) && (
                          <XCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {showResult && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">{exercise.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            {!showResult ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="px-8 py-3"
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                onClick={handleNextExercise}
                className="px-8 py-3"
              >
                {currentExercise < lesson.exercises.length - 1 ? 'Next Question' : 'Complete Exercise'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
        </div>
      </div>
    )
  }

  return null
}