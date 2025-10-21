'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  CheckCircle, 
  XCircle,
  Play,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Lightbulb,
  Award
} from 'lucide-react'

// Conditional data structure
const conditionalTypes = [
  {
    id: 'zero',
    title: 'Zero Conditional',
    description: 'General truths and scientific facts',
    structure: 'If + present simple, present simple',
    usage: 'Used for facts, general truths, and things that are always true',
    examples: [
      'If you heat water to 100°C, it boils.',
      'If it rains, the ground gets wet.',
      'If you don\'t eat, you get hungry.'
    ],
    exercises: [
      {
        question: 'If you _____ ice, it melts.',
        options: ['heat', 'heated', 'will heat', 'would heat'],
        correct: 0,
        explanation: 'Zero conditional uses present simple in both parts for general truths.'
      },
      {
        question: 'Plants _____ if they don\'t get water.',
        options: ['died', 'die', 'will die', 'would die'],
        correct: 1,
        explanation: 'Zero conditional: present simple for facts that are always true.'
      }
    ]
  },
  {
    id: 'first',
    title: 'First Conditional',
    description: 'Real possibilities in the future',
    structure: 'If + present simple, will + base verb',
    usage: 'Used for real possibilities and likely future situations',
    examples: [
      'If it rains tomorrow, I will stay home.',
      'If you study hard, you will pass the exam.',
      'If we leave now, we won\'t be late.'
    ],
    exercises: [
      {
        question: 'If I _____ time, I will help you.',
        options: ['have', 'had', 'will have', 'would have'],
        correct: 0,
        explanation: 'First conditional uses present simple after "if" for real future possibilities.'
      },
      {
        question: 'She _____ angry if you don\'t call her.',
        options: ['is', 'was', 'will be', 'would be'],
        correct: 2,
        explanation: 'First conditional: will + base verb in the result clause.'
      }
    ]
  },
  {
    id: 'second',
    title: 'Second Conditional',
    description: 'Unreal or unlikely situations in the present/future',
    structure: 'If + past simple, would + base verb',
    usage: 'Used for hypothetical, unreal, or unlikely situations',
    examples: [
      'If I won the lottery, I would travel the world.',
      'If I were you, I would apologize.',
      'If he studied more, he would get better grades.'
    ],
    exercises: [
      {
        question: 'If I _____ rich, I would buy a yacht.',
        options: ['am', 'was', 'were', 'would be'],
        correct: 2,
        explanation: 'Second conditional uses past simple (were for all persons) after "if".'
      },
      {
        question: 'What _____ you do if you found a wallet?',
        options: ['will', 'would', 'did', 'do'],
        correct: 1,
        explanation: 'Second conditional: would + base verb for hypothetical results.'
      }
    ]
  },
  {
    id: 'third',
    title: 'Third Conditional',
    description: 'Unreal situations in the past',
    structure: 'If + past perfect, would have + past participle',
    usage: 'Used for imaginary past situations and their imaginary results',
    examples: [
      'If I had studied harder, I would have passed the test.',
      'If you had left earlier, you wouldn\'t have missed the train.',
      'If it hadn\'t rained, we would have gone to the beach.'
    ],
    exercises: [
      {
        question: 'If she _____ the meeting, she would have known about the changes.',
        options: ['attended', 'had attended', 'would attend', 'would have attended'],
        correct: 1,
        explanation: 'Third conditional uses past perfect after "if" for unreal past situations.'
      },
      {
        question: 'I _____ the job if I had applied earlier.',
        options: ['got', 'would get', 'would have got', 'had got'],
        correct: 2,
        explanation: 'Third conditional: would have + past participle for imaginary past results.'
      }
    ]
  }
]

type ViewState = 'overview' | 'detail' | 'exercise'

interface ConditionalComponentProps {
  onBack?: () => void
}

export default function ConditionalComponent({ onBack }: ConditionalComponentProps) {
  const [currentView, setCurrentView] = useState<ViewState>('overview')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [exercisesCompleted, setExercisesCompleted] = useState(0)

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setCurrentView('detail')
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
    
    const currentType = conditionalTypes.find(type => type.id === selectedType)
    const exercise = currentType?.exercises[currentExercise]
    
    if (exercise && selectedAnswer === exercise.correct) {
      setScore(score + 1)
    }
    
    setShowResult(true)
  }

  const handleNextExercise = () => {
    const currentType = conditionalTypes.find(type => type.id === selectedType)
    
    if (currentType && currentExercise < currentType.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setExercisesCompleted(exercisesCompleted + 1)
    } else {
      // Exercise completed
      setCurrentView('detail')
    }
  }

  const getCurrentType = () => conditionalTypes.find(type => type.id === selectedType)

  // Overview View
  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(to bottom right, #ff8c42, #ffc107)'}}>
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Conditional Sentences</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Learn all types of conditional sentences and when to use them in different situations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conditionalTypes.map((type, index) => (
            <Card 
              key={type.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {index === 0 ? '0th' : index === 1 ? '1st' : index === 2 ? '2nd' : '3rd'}
                      </Badge>
                      <span>{type.title}</span>
                    </CardTitle>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">{type.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-mono text-gray-700">{type.structure}</p>
                </div>
                <Badge variant="secondary">{type.exercises.length} exercises</Badge>
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

  // Detail View
  if (currentView === 'detail' && selectedType) {
    const type = getCurrentType()
    if (!type) return null

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{type.title}</h1>
          <p className="text-gray-600 mb-6">{type.description}</p>
          <div className="bg-gradient-to-r p-4 rounded-lg inline-block" style={{background: 'linear-gradient(to right, #ffc107, #ff8c42)'}}>
            <p className="font-mono text-lg text-white">{type.structure}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>When to Use</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{type.usage}</p>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span>Examples</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {type.examples.map((example, index) => (
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
            style={{background: 'linear-gradient(to right, #ff8c42, #ffc107)'}}
          >
            <Play className="w-4 h-4 mr-2" />
            Practice with Exercises ({type.exercises.length} questions)
          </Button>
        </div>
        </div>
      </div>
    )
  }

  // Exercise View
  if (currentView === 'exercise' && selectedType) {
    const type = getCurrentType()
    if (!type) return null
    
    const exercise = type.exercises[currentExercise]
    const progress = ((currentExercise + 1) / type.exercises.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('detail')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to {type.title}</span>
          </Button>
          
          <div className="text-sm text-gray-500">
            Question {currentExercise + 1} of {type.exercises.length}
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
              <CardTitle className="text-center">{type.title} Exercise</CardTitle>
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
                          : 'border-green-500 bg-green-50'
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
                            : 'border-green-500 bg-green-500'
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
                {currentExercise < type.exercises.length - 1 ? 'Next Question' : 'Complete Exercise'}
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