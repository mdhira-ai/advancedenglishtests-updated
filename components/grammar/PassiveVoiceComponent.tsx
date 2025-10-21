'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  CheckCircle, 
  XCircle,
  Play,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Lightbulb,
  ArrowRight,
  AlertCircle,
  Shuffle
} from 'lucide-react'

// Passive voice data structure
const passiveCategories = [
  {
    id: 'present',
    title: 'Present Tenses',
    description: 'Present Simple and Present Continuous Passive',
    color: 'orange',
    tenses: [
      {
        tense: 'Present Simple Passive',
        structure: 'am/is/are + past participle',
        usage: 'For actions happening regularly or general facts',
        examples: [
          {
            active: 'People speak English all over the world.',
            passive: 'English is spoken all over the world.',
            focus: 'Focus on English, not people'
          },
          {
            active: 'The chef prepares fresh meals daily.',
            passive: 'Fresh meals are prepared daily.',
            focus: 'Focus on meals, not the chef'
          }
        ]
      },
      {
        tense: 'Present Continuous Passive',
        structure: 'am/is/are + being + past participle',
        usage: 'For actions happening right now',
        examples: [
          {
            active: 'They are building a new hospital.',
            passive: 'A new hospital is being built.',
            focus: 'Focus on the hospital'
          },
          {
            active: 'The mechanic is repairing my car.',
            passive: 'My car is being repaired.',
            focus: 'Focus on the car'
          }
        ]
      }
    ],
    exercises: [
      {
        question: 'Active: "The company employs 500 workers." Passive: "500 workers _____ by the company."',
        options: ['employ', 'are employed', 'are employing', 'employed'],
        correct: 1,
        explanation: 'Present simple passive: are + past participle (employed).'
      },
      {
        question: 'Active: "The students are doing the homework." Passive: "The homework _____ by the students."',
        options: ['is done', 'is being done', 'are being done', 'does'],
        correct: 1,
        explanation: 'Present continuous passive: is being + past participle (done).'
      }
    ]
  },
  {
    id: 'past',
    title: 'Past Tenses',
    description: 'Past Simple and Past Continuous Passive',
    color: 'blue',
    tenses: [
      {
        tense: 'Past Simple Passive',
        structure: 'was/were + past participle',
        usage: 'For completed actions in the past',
        examples: [
          {
            active: 'Shakespeare wrote Romeo and Juliet.',
            passive: 'Romeo and Juliet was written by Shakespeare.',
            focus: 'Focus on the play'
          },
          {
            active: 'The storm damaged many houses.',
            passive: 'Many houses were damaged by the storm.',
            focus: 'Focus on the houses'
          }
        ]
      },
      {
        tense: 'Past Continuous Passive',
        structure: 'was/were + being + past participle',
        usage: 'For actions in progress in the past',
        examples: [
          {
            active: 'The workers were painting the house.',
            passive: 'The house was being painted.',
            focus: 'Focus on the house'
          },
          {
            active: 'They were questioning the suspect.',
            passive: 'The suspect was being questioned.',
            focus: 'Focus on the suspect'
          }
        ]
      }
    ],
    exercises: [
      {
        question: 'Active: "Da Vinci painted the Mona Lisa." Passive: "The Mona Lisa _____ by Da Vinci."',
        options: ['painted', 'was painted', 'was painting', 'is painted'],
        correct: 1,
        explanation: 'Past simple passive: was + past participle (painted).'
      },
      {
        question: 'Active: "They were discussing the problem." Passive: "The problem _____ ."',
        options: ['was discussed', 'was being discussed', 'discussed', 'were discussing'],
        correct: 1,
        explanation: 'Past continuous passive: was being + past participle (discussed).'
      }
    ]
  },
  {
    id: 'future',
    title: 'Future Tenses',
    description: 'Future Simple and Future Perfect Passive',
    color: 'purple',
    tenses: [
      {
        tense: 'Future Simple Passive',
        structure: 'will be + past participle',
        usage: 'For future actions',
        examples: [
          {
            active: 'The company will launch a new product.',
            passive: 'A new product will be launched.',
            focus: 'Focus on the product'
          },
          {
            active: 'They will complete the project next month.',
            passive: 'The project will be completed next month.',
            focus: 'Focus on the project'
          }
        ]
      },
      {
        tense: 'Future Perfect Passive',
        structure: 'will have been + past participle',
        usage: 'For actions that will be completed before a specific time in the future',
        examples: [
          {
            active: 'By tomorrow, the team will have finished the report.',
            passive: 'By tomorrow, the report will have been finished.',
            focus: 'Focus on the report'
          }
        ]
      }
    ],
    exercises: [
      {
        question: 'Active: "The government will build new schools." Passive: "New schools _____ by the government."',
        options: ['will build', 'will be built', 'will be building', 'are built'],
        correct: 1,
        explanation: 'Future simple passive: will be + past participle (built).'
      },
      {
        question: 'Active: "By 2025, scientists will have discovered a cure." Passive: "By 2025, a cure _____."',
        options: ['will discover', 'will be discovered', 'will have been discovered', 'is discovered'],
        correct: 2,
        explanation: 'Future perfect passive: will have been + past participle (discovered).'
      }
    ]
  },
  {
    id: 'perfect',
    title: 'Perfect Tenses',
    description: 'Present Perfect and Past Perfect Passive',
    color: 'green',
    tenses: [
      {
        tense: 'Present Perfect Passive',
        structure: 'has/have been + past participle',
        usage: 'For actions completed at an unspecified time or with present relevance',
        examples: [
          {
            active: 'Someone has stolen my bike.',
            passive: 'My bike has been stolen.',
            focus: 'Focus on the bike'
          },
          {
            active: 'The team has completed the project.',
            passive: 'The project has been completed.',
            focus: 'Focus on the project'
          }
        ]
      },
      {
        tense: 'Past Perfect Passive',
        structure: 'had been + past participle',
        usage: 'For actions completed before another past action',
        examples: [
          {
            active: 'Before I arrived, they had cleaned the room.',
            passive: 'Before I arrived, the room had been cleaned.',
            focus: 'Focus on the room'
          }
        ]
      }
    ],
    exercises: [
      {
        question: 'Active: "Someone has broken the window." Passive: "The window _____."',
        options: ['has broken', 'has been broken', 'was broken', 'is broken'],
        correct: 1,
        explanation: 'Present perfect passive: has been + past participle (broken).'
      },
      {
        question: 'Active: "They had already sold the house." Passive: "The house _____ already _____."',
        options: ['was / sold', 'had been / sold', 'has been / sold', 'is / sold'],
        correct: 1,
        explanation: 'Past perfect passive: had been + past participle (sold).'
      }
    ]
  }
]

type ViewState = 'overview' | 'category' | 'exercise'

interface PassiveVoiceComponentProps {
  onBack?: () => void
}

export default function PassiveVoiceComponent({ onBack }: PassiveVoiceComponentProps) {
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
    
    const currentCategory = passiveCategories.find(cat => cat.id === selectedCategory)
    const exercise = currentCategory?.exercises[currentExercise]
    
    if (exercise && selectedAnswer === exercise.correct) {
      setScore(score + 1)
    }
    
    setShowResult(true)
  }

  const handleNextExercise = () => {
    const currentCategory = passiveCategories.find(cat => cat.id === selectedCategory)
    
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

  const getCurrentCategory = () => passiveCategories.find(cat => cat.id === selectedCategory)

  // Overview View
  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(to bottom right, #ff8c42, #1A3A6E)'}}>
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Passive Voice</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Learn how to form and use the passive voice in all tenses to change the focus of your sentences.
          </p>
        </div>

        {/* When to use passive voice */}
        <Card className="border-2" style={{background: 'linear-gradient(to right, rgba(255, 140, 66, 0.1), rgba(26, 58, 110, 0.1))', borderColor: '#ff8c42'}}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{color: '#1A3A6E'}}>
              <Lightbulb className="w-5 h-5" />
              <span>When to Use Passive Voice</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shuffle className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">Change Focus</h4>
                <p className="text-sm text-gray-600">When the action is more important than who does it</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">Unknown Actor</h4>
                <p className="text-sm text-gray-600">When we don't know who performed the action</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">Formal Writing</h4>
                <p className="text-sm text-gray-600">Common in academic and scientific writing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passiveCategories.map((category) => (
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
                  <Badge variant="secondary">{category.tenses.length} tenses</Badge>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{category.title} Passive</h1>
          <p className="text-gray-600 mb-6">{category.description}</p>
        </div>

        <div className="space-y-8">
          {category.tenses.map((tense, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span>{tense.tense}</span>
                </CardTitle>
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg mt-3">
                  <p className="font-mono text-gray-700">{tense.structure}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h4 className="flex items-center space-x-2 font-semibold text-gray-700 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span>Usage</span>
                  </h4>
                  <p className="text-gray-600">{tense.usage}</p>
                </div>

                <div>
                  <h4 className="flex items-center space-x-2 font-semibold text-gray-700 mb-4">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span>Active → Passive Examples</span>
                  </h4>
                  <div className="space-y-4">
                    {tense.examples.map((example, exIndex) => (
                      <div key={exIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <Badge variant="outline" className="text-xs mt-1">Active</Badge>
                            <p className="text-gray-700">{example.active}</p>
                          </div>
                          <div className="flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex items-start space-x-3">
                            <Badge variant="default" className="text-xs mt-1 bg-orange-500">Passive</Badge>
                            <p className="text-gray-700 font-medium">{example.passive}</p>
                          </div>
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                            💡 {example.focus}
                          </div>
                        </div>
                      </div>
                    ))}
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
            style={{background: 'linear-gradient(to right, #ff8c42, #1A3A6E)'}}
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
                <Zap className="w-5 h-5 text-orange-500" />
                <span>{category.title} Passive Exercise</span>
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
                          : 'border-orange-500 bg-orange-50'
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
                            : 'border-orange-500 bg-orange-500'
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