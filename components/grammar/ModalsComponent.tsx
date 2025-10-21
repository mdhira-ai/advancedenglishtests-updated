'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  CheckCircle, 
  XCircle,
  Play,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Lightbulb,
  MessageSquare,
  AlertCircle
} from 'lucide-react'

// Modal verbs data structure
const modalCategories = [
  {
    id: 'ability',
    title: 'Ability & Possibility',
    description: 'Can, Could, Be able to',
    color: 'blue',
    modals: [
      {
        modal: 'can',
        usage: 'Present ability, general possibility, permission (informal)',
        examples: [
          'I can speak three languages.',
          'Can you help me with this?',
          'It can be very cold in winter.'
        ]
      },
      {
        modal: 'could',
        usage: 'Past ability, polite requests, possibility',
        examples: [
          'When I was young, I could run very fast.',
          'Could you please close the window?',
          'The weather could be better tomorrow.'
        ]
      },
      {
        modal: 'be able to',
        usage: 'Ability in all tenses, managed to do something specific',
        examples: [
          'I will be able to help you next week.',
          'She has been able to solve the problem.',
          'We were able to catch the last train.'
        ]
      }
    ],
    exercises: [
      {
        question: 'When I was a child, I _____ swim very well.',
        options: ['can', 'could', 'am able to', 'was able to'],
        correct: 1,
        explanation: 'Use "could" for general past ability.'
      },
      {
        question: 'I _____ speak Chinese by the end of this year.',
        options: ['can', 'could', 'will be able to', 'am able to'],
        correct: 2,
        explanation: 'Use "will be able to" for future ability.'
      }
    ]
  },
  {
    id: 'permission',
    title: 'Permission & Requests',
    description: 'May, Might, Can, Could',
    color: 'green',
    modals: [
      {
        modal: 'may',
        usage: 'Formal permission, possibility',
        examples: [
          'May I use your phone?',
          'Students may not eat in the classroom.',
          'It may rain this afternoon.'
        ]
      },
      {
        modal: 'might',
        usage: 'Polite permission, weak possibility',
        examples: [
          'Might I suggest a different approach?',
          'I might go to the cinema tonight.',
          'You might want to reconsider your decision.'
        ]
      },
      {
        modal: 'can',
        usage: 'Informal permission, ability',
        examples: [
          'Can I borrow your book?',
          'You can park here for free.',
          'Children can play in the garden.'
        ]
      }
    ],
    exercises: [
      {
        question: '_____ I leave early today? (formal)',
        options: ['Can', 'May', 'Might', 'Could'],
        correct: 1,
        explanation: 'Use "may" for formal permission requests.'
      },
      {
        question: 'You _____ not smoke in this building.',
        options: ['can', 'may', 'might', 'could'],
        correct: 1,
        explanation: 'Use "may not" for formal prohibition.'
      }
    ]
  },
  {
    id: 'obligation',
    title: 'Obligation & Necessity',
    description: 'Must, Have to, Should, Ought to',
    color: 'red',
    modals: [
      {
        modal: 'must',
        usage: 'Strong obligation, logical deduction',
        examples: [
          'You must wear a seatbelt.',
          'She must be tired after that long journey.',
          'All students must submit their essays by Friday.'
        ]
      },
      {
        modal: 'have to',
        usage: 'External obligation, necessity',
        examples: [
          'I have to work late tonight.',
          'Do you have to pay taxes?',
          'We had to cancel the meeting.'
        ]
      },
      {
        modal: 'should',
        usage: 'Advice, recommendation, expectation',
        examples: [
          'You should eat more vegetables.',
          'The train should arrive at 3 PM.',
          'Should I call her now?'
        ]
      }
    ],
    exercises: [
      {
        question: 'You _____ study harder if you want to pass.',
        options: ['must', 'have to', 'should', 'ought to'],
        correct: 2,
        explanation: 'Use "should" for advice and recommendations.'
      },
      {
        question: 'I _____ go to the dentist. My tooth is killing me.',
        options: ['should', 'might', 'could', 'must'],
        correct: 3,
        explanation: 'Use "must" for strong necessity or obligation.'
      }
    ]
  },
  {
    id: 'prohibition',
    title: 'Prohibition & Advice',
    description: 'Must not, Don\'t have to, Shouldn\'t',
    color: 'orange',
    modals: [
      {
        modal: 'must not / mustn\'t',
        usage: 'Strong prohibition, not allowed',
        examples: [
          'You must not tell anyone about this.',
          'Children mustn\'t play with matches.',
          'We mustn\'t be late for the meeting.'
        ]
      },
      {
        modal: 'don\'t have to',
        usage: 'No obligation, not necessary',
        examples: [
          'You don\'t have to come if you\'re busy.',
          'We don\'t have to wear uniforms.',
          'She doesn\'t have to work on Sundays.'
        ]
      },
      {
        modal: 'shouldn\'t',
        usage: 'Advice against doing something',
        examples: [
          'You shouldn\'t eat so much sugar.',
          'We shouldn\'t make any noise.',
          'He shouldn\'t drive so fast.'
        ]
      }
    ],
    exercises: [
      {
        question: 'You _____ smoke in the hospital.',
        options: ['don\'t have to', 'mustn\'t', 'shouldn\'t', 'might not'],
        correct: 1,
        explanation: 'Use "mustn\'t" for strong prohibition.'
      },
      {
        question: 'You _____ cook tonight. I\'ll order pizza.',
        options: ['mustn\'t', 'don\'t have to', 'shouldn\'t', 'can\'t'],
        correct: 1,
        explanation: 'Use "don\'t have to" when something is not necessary.'
      }
    ]
  }
]

type ViewState = 'overview' | 'category' | 'exercise'

interface ModalsComponentProps {
  onBack?: () => void
}

export default function ModalsComponent({ onBack }: ModalsComponentProps) {
  const [currentView, setCurrentView] = useState<ViewState>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [exercisesCompleted, setExercisesCompleted] = useState(0)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentView('category')
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
    
    const currentCategory = modalCategories.find(cat => cat.id === selectedCategory)
    const exercise = currentCategory?.exercises[currentExercise]
    
    if (exercise && selectedAnswer === exercise.correct) {
      setScore(score + 1)
    }
    
    setShowResult(true)
  }

  const handleNextExercise = () => {
    const currentCategory = modalCategories.find(cat => cat.id === selectedCategory)
    
    if (currentCategory && currentExercise < currentCategory.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setExercisesCompleted(exercisesCompleted + 1)
    } else {
      // Exercise completed
      setCurrentView('category')
    }
  }

  const getCurrentCategory = () => modalCategories.find(cat => cat.id === selectedCategory)

  // Overview View
  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(to bottom right, #1A3A6E, #4f5bd5)'}}>
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Modal Verbs</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Master modal verbs and their various meanings: ability, permission, obligation, and advice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modalCategories.map((category) => (
            <Card 
              key={category.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              onClick={() => handleCategorySelect(category.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">{category.modals.length} modals</Badge>
                  <Badge variant="outline">{category.exercises.length} exercises</Badge>
                </div>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
          <p className="text-gray-600 mb-6">{category.description}</p>
        </div>

        <div className="space-y-6">
          {category.modals.map((modal, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader style={{background: 'linear-gradient(to right, rgba(26, 58, 110, 0.1), rgba(79, 91, 213, 0.1))'}}>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#1A3A6E'}}>
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-mono text-lg">{modal.modal}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="flex items-center space-x-2 font-semibold text-gray-700 mb-3">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span>Usage</span>
                    </h4>
                    <p className="text-gray-600 leading-relaxed">{modal.usage}</p>
                  </div>
                  <div>
                    <h4 className="flex items-center space-x-2 font-semibold text-gray-700 mb-3">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>Examples</span>
                    </h4>
                    <div className="space-y-2">
                      {modal.examples.map((example, exIndex) => (
                        <div key={exIndex} className="p-2 bg-gray-50 rounded text-sm">
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={handleStartExercise}
            className="text-white px-8 py-3"
            style={{background: 'linear-gradient(to right, #1A3A6E, #4f5bd5)'}}
          >
            <Play className="w-4 h-4 mr-2" />
            Practice with Exercises ({category.exercises.length} questions)
          </Button>
        </div>
        </div>
      </div>
    )
  }

  // Exercise View
  if (currentView === 'exercise' && selectedCategory) {
    const category = getCurrentCategory()
    if (!category) return null
    
    const exercise = category.exercises[currentExercise]
    const progress = ((currentExercise + 1) / category.exercises.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('category')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to {category.title}</span>
          </Button>
          
          <div className="text-sm text-gray-500">
            Question {currentExercise + 1} of {category.exercises.length}
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
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center space-x-2">
                <Brain className="w-5 h-5" style={{color: '#1A3A6E'}} />
                <span>{category.title} Exercise</span>
              </CardTitle>
            </CardHeader>
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
                          : 'border-purple-500 bg-purple-50'
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
                            : 'border-purple-500 bg-purple-500'
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
                <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
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
                {currentExercise < category.exercises.length - 1 ? 'Next Question' : 'Complete Exercise'}
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