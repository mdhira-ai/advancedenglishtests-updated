'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Star, 
  Trophy,
  Clock,
  Target,
  Award,
  Zap,
  Brain,
  Rocket,
  Crown,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Play,
  Home,
  Settings,
  Users,
  Gift,
  Medal,
  Flame,
  Heart,
  Diamond,
  Shield
} from 'lucide-react'
import { Question, grammarQuestions } from '@/data/grammarQuestions'

// Game levels and steps configuration with modern Dribbble-style colors
const LEVELS = [
  { 
    name: 'Rookie Explorer', 
    icon: Rocket, 
    color: '#667EEA',
    gradient: 'from-blue-400 to-purple-500',
    bgColor: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    questionsRange: [0, 50],
    description: 'Start your grammar adventure!',
    accent: '#764BA2'
  },
  { 
    name: 'Grammar Detective', 
    icon: Brain, 
    color: '#F093FB',
    gradient: 'from-pink-400 to-red-500',
    bgColor: 'bg-gradient-to-br from-pink-50 via-rose-50 to-red-50',
    questionsRange: [50, 100],
    description: 'Solve grammar mysteries!',
    accent: '#F093FB'
  },
  { 
    name: 'Language Warrior', 
    icon: Shield, 
    color: '#4FACFE',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50',
    questionsRange: [100, 150],
    description: 'Battle grammar challenges!',
    accent: '#00F2FE'
  },
  { 
    name: 'Grammar Master', 
    icon: Crown, 
    color: '#43E97B',
    gradient: 'from-green-400 to-emerald-500',
    bgColor: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
    questionsRange: [150, 200],
    description: 'Become the ultimate grammar champion!',
    accent: '#38F9D7'
  }
]

type GameState = 'level-select' | 'playing' | 'level-complete' | 'game-complete'

export default function GrammarPracticePage() {
  
  // Game state management
  const [gameState, setGameState] = useState<GameState>('level-select')
  const [currentLevel, setCurrentLevel] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  
  // Scoring and progress
  const [levelScore, setLevelScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [lives, setLives] = useState(3)
  
  // Tracking
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [questionResults, setQuestionResults] = useState<{ [key: number]: boolean }>({})
  const [timeSpent, setTimeSpent] = useState(0)
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set())
  
  // Animations and effects
  const [showFirework, setShowFirework] = useState(false)
  const [shakeEffect, setShakeEffect] = useState(false)
  const [powerUpActive, setPowerUpActive] = useState(false)

  // Get current level questions
  const getCurrentLevelQuestions = () => {
    const level = LEVELS[currentLevel]
    return grammarQuestions.slice(level.questionsRange[0], level.questionsRange[1])
  }
  
  const currentQuestion = getCurrentLevelQuestions()[currentQuestionIndex]
  const levelQuestions = getCurrentLevelQuestions()
  const levelProgressPercentage = ((currentQuestionIndex + 1) / levelQuestions.length) * 100

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [gameState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Robust answer validation function
  const validateAnswer = (userAnswer: string, correctAnswer: string, questionType: string): boolean => {
    // Normalize both answers by trimming whitespace and converting to lowercase
    const normalizeText = (text: string): string => {
      return text
        .trim()
        .toLowerCase()
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Normalize quotes and apostrophes
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        // Remove extra punctuation spacing
        .replace(/\s*([.!?])\s*/g, '$1')
    }

    const normalizedUser = normalizeText(userAnswer)
    const normalizedCorrect = normalizeText(correctAnswer)

    // Direct match
    if (normalizedUser === normalizedCorrect) {
      return true
    }

    // Handle specific question types with custom logic
    switch (questionType) {
      case 'fill_blank':
      case 'multiple_choice':
        // For fill_blank and multiple_choice, be more flexible with punctuation
        const extractCore = (text: string): string => {
          return text.replace(/[.!?,"';:()]/g, '').trim()
        }
        
        if (extractCore(normalizedUser) === extractCore(normalizedCorrect)) {
          return true
        }

        // Handle common variations
        if (normalizedCorrect === 'a' && (normalizedUser === 'an' || normalizedUser === 'the')) {
          return false // These are grammatically different
        }
        if (normalizedCorrect === 'an' && (normalizedUser === 'a' || normalizedUser === 'the')) {
          return false // These are grammatically different
        }
        
        // Handle contractions
        const expandContractions = (text: string): string => {
          return text
            .replace(/doesn't/g, 'does not')
            .replace(/don't/g, 'do not')
            .replace(/isn't/g, 'is not')
            .replace(/aren't/g, 'are not')
            .replace(/wasn't/g, 'was not')
            .replace(/weren't/g, 'were not')
            .replace(/hasn't/g, 'has not')
            .replace(/haven't/g, 'have not')
            .replace(/won't/g, 'will not')
            .replace(/wouldn't/g, 'would not')
            .replace(/can't/g, 'cannot')
            .replace(/couldn't/g, 'could not')
            .replace(/shouldn't/g, 'should not')
            .replace(/mustn't/g, 'must not')
            .replace(/i'm/g, 'i am')
            .replace(/you're/g, 'you are')
            .replace(/he's/g, 'he is')
            .replace(/she's/g, 'she is')
            .replace(/it's/g, 'it is')
            .replace(/we're/g, 'we are')
            .replace(/they're/g, 'they are')
        }
        
        if (expandContractions(normalizedUser) === expandContractions(normalizedCorrect)) {
          return true
        }
        break

      case 'interrogative':
        // For questions, normalize question format
        const normalizeQuestion = (text: string): string => {
          return text
            .replace(/\s*\?\s*/g, '?')
            .replace(/\s*,\s*/g, ', ')
            .replace(/\s+/g, ' ')
            .trim()
        }
        
        if (normalizeQuestion(normalizedUser) === normalizeQuestion(normalizedCorrect)) {
          return true
        }

        // Allow missing question mark
        const userWithoutPunctuation = normalizedUser.replace(/[.!?]/g, '')
        const correctWithoutPunctuation = normalizedCorrect.replace(/[.!?]/g, '')
        
        if (userWithoutPunctuation === correctWithoutPunctuation) {
          return true
        }

        // Handle common question word variations
        const questionVariations: { [key: string]: string[] } = {
          'did i': ['have i', 'do i'],
          'did you': ['have you', 'do you'],
          'did he': ['has he', 'does he'],
          'did she': ['has she', 'does she'],
          'did we': ['have we', 'do we'],
          'did they': ['have they', 'do they']
        }

        for (const [base, variations] of Object.entries(questionVariations)) {
          if (normalizedCorrect.includes(base)) {
            for (const variation of variations) {
              if (normalizedUser.includes(variation)) {
                // Check if the rest of the sentence matches
                const baseRest = normalizedCorrect.replace(base, '').trim()
                const varRest = normalizedUser.replace(variation, '').trim()
                if (baseRest === varRest) {
                  return false // These are different question forms
                }
              }
            }
          }
        }
        break

      case 'correct_mistake':
        // For mistake correction, allow minor punctuation differences
        const removePunctuation = (text: string): string => {
          return text.replace(/[.!?,"';:()]/g, '').replace(/\s+/g, ' ').trim()
        }
        
        if (removePunctuation(normalizedUser) === removePunctuation(normalizedCorrect)) {
          return true
        }

        // Check for contraction fixes specifically
        const checkMistakeCorrection = (user: string, correct: string): boolean => {
          // Common mistake patterns
          const mistakes = [
            { wrong: "he don't", right: "he doesn't" },
            { wrong: "she don't", right: "she doesn't" },
            { wrong: "it don't", right: "it doesn't" },
            { wrong: "he do", right: "he does" },
            { wrong: "she do", right: "she does" },
            { wrong: "it do", right: "it does" },
            { wrong: "born on", right: "born in" },
            { wrong: "married with", right: "married to" }
          ]

          for (const mistake of mistakes) {
            if (correct.includes(mistake.right.toLowerCase()) && user.includes(mistake.right.toLowerCase())) {
              return true
            }
          }
          return false
        }

        if (checkMistakeCorrection(normalizedUser, normalizedCorrect)) {
          return true
        }
        break

      case 'rearrange':
        // For rearrangements, just check if all letters are present
        const sortLetters = (text: string): string => {
          return text.replace(/\s+/g, '').split('').sort().join('')
        }
        
        if (sortLetters(normalizedUser) === sortLetters(normalizedCorrect)) {
          return true
        }
        break
    }

    // Split into words and compare for flexibility
    const userWords = normalizedUser.split(/\s+/).filter(word => word.length > 0)
    const correctWords = normalizedCorrect.split(/\s+/).filter(word => word.length > 0)

    // For single word answers, be more lenient with exact matching
    if (correctWords.length === 1 && userWords.length === 1) {
      return userWords[0] === correctWords[0]
    }

    // Check for essential word matching in longer sentences
    if (correctWords.length > 3) {
      const commonWords = userWords.filter(word => 
        correctWords.includes(word) && 
        word.length > 2 && // Ignore very short words
        !['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but'].includes(word)
      )
      
      const essentialWords = correctWords.filter(word => 
        word.length > 2 && 
        !['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but'].includes(word)
      )
      
      const matchPercentage = commonWords.length / Math.max(essentialWords.length, 1)
      
      // If 85% of essential words match and sentence length is reasonable, consider correct
      if (matchPercentage >= 0.85 && userWords.length >= correctWords.length * 0.7) {
        return true
      }
    }

    return false
  }

  const startLevel = (levelIndex: number) => {
    setCurrentLevel(levelIndex)
    setCurrentQuestionIndex(0)
    setGameState('playing')
    setLevelScore(0)
    setCorrectAnswers(0)
    setStreak(0)
    setLives(3)
    setTimeSpent(0)
    setSelectedAnswer('')
    setUserAnswer('')
    setShowResult(false)
  }

  const handleAnswerSubmit = () => {
    // Get the user's answer based on question type
    const answer = currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'fill_blank' 
      ? selectedAnswer 
      : userAnswer.trim()

    // Validate answer cannot be empty
    if (!answer || answer.trim() === '') {
      // Show a brief message or handle empty answer case
      return
    }

    // Use the robust validation function
    const isCorrect = validateAnswer(answer, currentQuestion.correctAnswer, currentQuestion.type)
    
    setQuestionResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }))
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]))
    
    if (isCorrect) {
      setLevelScore(prev => prev + currentQuestion.points + (streak * 2)) // Bonus for streak
      setTotalScore(prev => prev + currentQuestion.points + (streak * 2))
      setCorrectAnswers(prev => prev + 1)
      setStreak(prev => {
        const newStreak = prev + 1
        if (newStreak > maxStreak) setMaxStreak(newStreak)
        return newStreak
      })
      setShowFirework(true)
      setTimeout(() => setShowFirework(false), 1500)
    } else {
      setStreak(0)
      setLives(prev => Math.max(0, prev - 1))
      setShakeEffect(true)
      setTimeout(() => setShakeEffect(false), 500)
    }
    
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < levelQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer('')
      setUserAnswer('')
      setShowResult(false)
    } else {
      // Level complete
      setCompletedLevels(prev => new Set([...prev, currentLevel]))
      setGameState('level-complete')
    }
  }

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1)
      setCurrentQuestionIndex(0)
      setGameState('playing')
      setLevelScore(0)
      setCorrectAnswers(0)
      setStreak(0)
      setLives(3)
      setTimeSpent(0)
    } else {
      setGameState('game-complete')
    }
  }

  const resetGame = () => {
    setGameState('level-select')
    setCurrentLevel(0)
    setCurrentQuestionIndex(0)
    setTotalScore(0)
    setMaxStreak(0)
    setCompletedLevels(new Set())
    setAnsweredQuestions(new Set())
    setQuestionResults({})
  }

  const getScoreGrade = () => {
    const percentage = (correctAnswers / levelQuestions.length) * 100
    if (percentage >= 90) return { grade: 'S', color: 'text-yellow-500', bg: 'bg-gradient-to-r from-yellow-200 to-yellow-300' }
    if (percentage >= 80) return { grade: 'A+', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-200 to-green-300' }
    if (percentage >= 70) return { grade: 'A', color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-200 to-blue-300' }
    if (percentage >= 60) return { grade: 'B', color: 'text-purple-600', bg: 'bg-gradient-to-r from-purple-200 to-purple-300' }
    return { grade: 'C', color: 'text-gray-600', bg: 'bg-gradient-to-r from-gray-200 to-gray-300' }
  }

  // Level Selection Screen
  if (gameState === 'level-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Modern floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 animate-float bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="absolute top-1/4 -right-32 w-80 h-80 rounded-full opacity-10 animate-float-delayed bg-gradient-to-r from-pink-400 to-red-500"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 animate-float bg-gradient-to-r from-cyan-400 to-blue-500"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 rounded-full opacity-10 animate-float-delayed bg-gradient-to-r from-green-400 to-emerald-500"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Modern Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                <div className="relative bg-white rounded-full p-6 shadow-2xl">
                  <Brain className="w-16 h-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600" />
                </div>
              </div>
            </div>
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 mb-6 tracking-tight">
              Grammar Quest
            </h1>
            <p className="text-2xl text-slate-600 mb-8 font-medium">Master English Grammar Through Epic Adventures</p>
            
            {/* Stats Cards */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{totalScore}</div>
                    <div className="text-sm text-slate-600">Total Score</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{maxStreak}</div>
                    <div className="text-sm text-slate-600">Best Streak</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                    <Medal className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{completedLevels.size}/4</div>
                    <div className="text-sm text-slate-600">Levels</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Selection Grid - Modern Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {LEVELS.map((level, index) => {
              const IconComponent = level.icon
              const isCompleted = completedLevels.has(index)
              const isLocked = index > 0 && !completedLevels.has(index - 1) && completedLevels.size === 0
              
              return (
                <div 
                  key={index}
                  className={`group relative transform transition-all duration-500 hover:scale-105 ${
                    isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => !isLocked && startLevel(index)}
                >
                  {/* Card Background with Gradient */}
                  <div className={`
                    relative bg-white rounded-3xl p-8 shadow-xl border border-white/50
                    ${isLocked ? 'opacity-60' : 'hover:shadow-2xl'} 
                    transition-all duration-500 backdrop-blur-sm
                    ${!isLocked ? 'hover:bg-white/90' : ''}
                  `}>
                    
                    {/* Gradient Border Effect */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${level.gradient} p-0.5 ${isLocked ? 'opacity-50' : 'group-hover:opacity-100'} transition-opacity`}>
                      <div className="bg-white rounded-3xl h-full w-full"></div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${level.gradient} flex items-center justify-center transform transition-transform group-hover:scale-110`}>
                          <IconComponent className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      
                      {/* Level Info */}
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{level.name}</h3>
                        <p className="text-slate-600 text-sm mb-4">{level.description}</p>
                        <div className="text-xs text-slate-500 bg-slate-100 rounded-lg px-3 py-2 inline-block">
                          Questions {level.questionsRange[0] + 1} - {level.questionsRange[1]}
                        </div>
                      </div>
                      
                      {/* Status and Action */}
                      <div className="space-y-3">
                        {isCompleted && (
                          <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl py-3">
                            <Crown className="w-5 h-5 text-yellow-600" />
                            <span className="text-green-800 font-semibold text-sm">Completed!</span>
                          </div>
                        )}
                        
                        {isLocked ? (
                          <div className="flex items-center justify-center space-x-2 bg-slate-100 rounded-xl py-3">
                            <Shield className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-600 font-medium text-sm">Complete Previous Level</span>
                          </div>
                        ) : (
                          <Button 
                            className={`w-full bg-gradient-to-r ${level.gradient} hover:shadow-lg transform transition-all duration-300 hover:scale-105 text-white font-semibold py-3 rounded-xl border-0`}
                            size="lg"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            {isCompleted ? 'Play Again' : 'Start Adventure'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modern Stats Dashboard */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Your Grammar Journey</h2>
              <p className="text-slate-600">Track your progress and achievements</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{answeredQuestions.size}</div>
                <div className="text-sm text-slate-600">Questions Answered</div>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-100 border border-yellow-200/50">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{totalScore}</div>
                <div className="text-sm text-slate-600">Total Score</div>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200/50">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{maxStreak}</div>
                <div className="text-sm text-slate-600">Best Streak</div>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200/50">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{completedLevels.size}</div>
                <div className="text-sm text-slate-600">Completed Levels</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Level Complete Screen
  if (gameState === 'level-complete') {
    const gradeInfo = getScoreGrade()
    const accuracy = (correctAnswers / levelQuestions.length) * 100
    const level = LEVELS[currentLevel]
    const IconComponent = level.icon

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 py-8 relative overflow-hidden">
        {/* Modern floating celebration elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 animate-float bg-gradient-to-r from-yellow-400 to-orange-500"></div>
          <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full opacity-10 animate-float-delayed bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 animate-float bg-gradient-to-r from-purple-400 to-pink-500"></div>
        </div>

        {/* Celebration particles */}
        {showFirework && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              >
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            ))}
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            
            {/* Modern Header */}
            <div className={`bg-gradient-to-r ${level.gradient} p-12 text-center`}>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Trophy className="w-20 h-20 text-yellow-300 animate-bounce" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-5xl font-black text-white mb-4">Level Complete! 🎉</h1>
              <p className="text-2xl text-white/90 mb-2">{level.name}</p>
              <p className="text-xl text-white/80">Mission Accomplished!</p>
            </div>
            
            {/* Stats Grid */}
            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <div className={`${gradeInfo.bg} p-8 rounded-3xl text-center shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/50`}>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className={`w-10 h-10 ${gradeInfo.color}`} />
                  </div>
                  <div className={`text-4xl font-black ${gradeInfo.color} mb-2`}>{gradeInfo.grade}</div>
                  <div className="text-sm font-semibold text-slate-600">Grade Achieved</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-3xl text-center shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-200/50">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-black text-blue-800 mb-2">{levelScore}</div>
                  <div className="text-sm font-semibold text-slate-600">Level Points</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-3xl text-center shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-200/50">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-black text-green-800 mb-2">{correctAnswers}/{levelQuestions.length}</div>
                  <div className="text-sm font-semibold text-slate-600">Correct Answers</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-100 p-8 rounded-3xl text-center shadow-xl transform hover:scale-105 transition-all duration-300 border border-orange-200/50">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Flame className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-black text-orange-800 mb-2">{maxStreak}</div>
                  <div className="text-sm font-semibold text-slate-600">Best Streak</div>
                </div>
              </div>

              {/* Accuracy Progress */}
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${level.gradient} flex items-center justify-center`}>
                      {React.createElement(IconComponent, { className: "w-6 h-6 text-white" })}
                    </div>
                    <span className="text-2xl font-bold text-slate-800">Accuracy Rate</span>
                  </div>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{accuracy.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <div className="h-6 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${level.gradient} transition-all duration-1000 ease-out`}
                      style={{ width: `${accuracy}%` }}
                    ></div>
                  </div>
                  <div className="absolute -top-2 transition-all duration-1000" style={{ left: `${accuracy}%` }}>
                    <div className={`w-10 h-10 bg-gradient-to-r ${level.gradient} rounded-full shadow-lg flex items-center justify-center`}>
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation Message */}
              <div className="text-center space-y-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200/50">
                  <div className="text-3xl mb-4">
                    {accuracy >= 90 
                      ? "🌟 Perfect! You're a grammar genius!" 
                      : accuracy >= 80 
                      ? "🎯 Excellent work! Outstanding performance!"
                      : accuracy >= 70 
                      ? "💪 Great job! You're making solid progress!"
                      : "📚 Good effort! Keep practicing to improve!"}
                  </div>
                  <p className="text-lg text-slate-700 max-w-2xl mx-auto">
                    {accuracy >= 90 
                      ? "Your mastery of grammar concepts is truly impressive. You've demonstrated exceptional understanding and skill!"
                      : accuracy >= 80 
                      ? "You've shown strong command of grammar rules. Your dedication to learning is paying off!"
                      : accuracy >= 70 
                      ? "You're building a solid foundation in grammar. Keep up the momentum and continue practicing!"
                      : "Every question you answer helps you grow. Review the concepts and try again to improve your skills!"}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  {currentLevel < LEVELS.length - 1 ? (
                    <Button 
                      onClick={nextLevel}
                      className={`px-12 py-4 text-xl font-bold text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r ${level.gradient} border-0`}
                      size="lg"
                    >
                      <ChevronRight className="w-6 h-6 mr-3" />
                      Next Level
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setGameState('game-complete')}
                      className="px-12 py-4 text-xl font-bold text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 border-0"
                      size="lg"
                    >
                      <Crown className="w-6 h-6 mr-3" />
                      Complete Game
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => setGameState('level-select')}
                    variant="outline"
                    className="px-12 py-4 text-xl font-semibold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                    size="lg"
                  >
                    <Home className="w-6 h-6 mr-3" />
                    Level Select
                  </Button>
                  
                  <Button 
                    onClick={() => startLevel(currentLevel)}
                    variant="outline"
                    className="px-12 py-4 text-xl font-semibold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    size="lg"
                  >
                    <RotateCcw className="w-6 h-6 mr-3" />
                    Retry Level
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Game Complete Screen
  if (gameState === 'game-complete') {
    const overallAccuracy = (Object.values(questionResults).filter(Boolean).length / Object.values(questionResults).length) * 100

    return (
      <div className="min-h-screen py-8 relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        {/* Celebration animations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Card className="border-4 shadow-2xl bg-white overflow-hidden border-emerald-400">
            <CardHeader className="text-center text-white py-12 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Crown className="w-24 h-24 text-yellow-300 animate-pulse" />
                  <Sparkles className="w-12 h-12 text-yellow-200 absolute -top-3 -right-3 animate-spin" />
                  <Diamond className="w-8 h-8 text-yellow-100 absolute -bottom-2 -left-2 animate-bounce" />
                </div>
              </div>
              <CardTitle className="text-6xl font-bold mb-4">🏆 GRAMMAR MASTER! 🏆</CardTitle>
              <p className="text-2xl opacity-90">You've conquered all grammar challenges!</p>
            </CardHeader>
            
            <CardContent className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <div className="bg-yellow-100 border border-yellow-300 p-8 rounded-2xl text-center shadow-xl transform hover:scale-105 transition-all">
                  <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                  <div className="text-5xl font-bold mb-2 text-yellow-700">MASTER</div>
                  <div className="text-lg font-medium text-yellow-600">Final Rank</div>
                </div>
                
                <div className="bg-blue-100 border border-blue-300 p-8 rounded-2xl text-center shadow-xl transform hover:scale-105 transition-all">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <div className="text-5xl font-bold mb-2 text-blue-700">{totalScore}</div>
                  <div className="text-lg font-medium text-blue-600">Total Score</div>
                </div>
                
                <div className="bg-green-100 border border-green-300 p-8 rounded-2xl text-center shadow-xl transform hover:scale-105 transition-all">
                  <Target className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <div className="text-5xl font-bold text-green-600 mb-2">{overallAccuracy.toFixed(1)}%</div>
                  <div className="text-lg font-medium text-green-600">Overall Accuracy</div>
                </div>
                
                <div className="bg-orange-100 border border-orange-300 p-8 rounded-2xl text-center shadow-xl transform hover:scale-105 transition-all">
                  <Flame className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                  <div className="text-5xl font-bold mb-2 text-orange-700">{maxStreak}</div>
                  <div className="text-lg font-medium text-orange-600">Best Streak</div>
                </div>
              </div>

              <div className="text-center space-y-8">
                <div className="p-8 bg-purple-50 rounded-2xl border-4 border-purple-300">
                  <div className="text-4xl mb-4">🎉 Congratulations, Grammar Champion! 🎉</div>
                  <p className="text-xl text-gray-700 mb-4">
                    You've mastered all 200 grammar questions across 4 challenging levels!
                  </p>
                  <p className="text-lg text-gray-600">
                    Your dedication to learning English grammar is truly remarkable. 
                    Keep practicing and continue your language learning journey!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Button 
                    onClick={resetGame}
                    className="text-white px-12 py-5 text-xl font-semibold rounded-2xl shadow-xl transform hover:scale-105 transition-all hover:opacity-90"
                    style={{ backgroundColor: '#4f5bd5' }}
                  >
                    <RotateCcw className="w-7 h-7 mr-3" />
                    Start New Journey
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-4 px-12 py-5 text-xl font-semibold rounded-2xl shadow-xl transform hover:scale-105 transition-all"
                    style={{ borderColor: '#ff8c42', color: '#ff8c42' }}
                  >
                    <Gift className="w-7 h-7 mr-3" />
                    Share Achievement
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Playing Screen
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 py-4 sm:py-8 relative overflow-hidden ${shakeEffect ? 'animate-pulse' : ''}`}>
      {/* Modern floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-5 animate-float bg-gradient-to-r from-blue-400 to-purple-500"></div>
        <div className="absolute bottom-1/4 -right-24 w-80 h-80 rounded-full opacity-5 animate-float-delayed bg-gradient-to-r from-pink-400 to-red-500"></div>
      </div>
      
      {/* Firework effects */}
      {showFirework && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-1/4 left-1/4 w-6 h-6 rounded-full animate-ping bg-yellow-400"></div>
          <div className="absolute top-1/3 right-1/3 w-4 h-4 rounded-full animate-pulse bg-orange-400"></div>
          <div className="absolute bottom-1/4 left-1/3 w-8 h-8 rounded-full animate-bounce bg-blue-400"></div>
          <div className="absolute top-2/3 right-1/4 w-5 h-5 rounded-full animate-spin bg-indigo-400"></div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Modern Game Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <Button
                onClick={() => setGameState('level-select')}
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-slate-300 text-slate-700 hover:bg-white hover:scale-105 transition-all shadow-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Levels
              </Button>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${LEVELS[currentLevel].gradient} flex items-center justify-center`}>
                  {React.createElement(LEVELS[currentLevel].icon, { className: "w-6 h-6 text-white" })}
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-800">{LEVELS[currentLevel].name}</div>
                  <div className="text-sm text-slate-600">Level {currentLevel + 1} of 4</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < lives ? 'bg-gradient-to-r from-red-400 to-pink-500' : 'bg-slate-200'
                  } transition-all`}>
                    <Heart className={`w-5 h-5 ${i < lives ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                ))}
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <span className="text-lg font-semibold text-slate-800">{formatTime(timeSpent)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{levelScore}</div>
                  <div className="text-xs text-slate-600">Level Score</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{currentQuestionIndex + 1}/{levelQuestions.length}</div>
                  <div className="text-xs text-slate-600">Question</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{correctAnswers}</div>
                  <div className="text-xs text-slate-600">Correct</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{streak}</div>
                  <div className="text-xs text-slate-600">Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Progress Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-slate-800">Level Progress</span>
              <span className="text-slate-600 font-medium">{currentQuestionIndex + 1} of {levelQuestions.length}</span>
            </div>
            <div className="relative">
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${LEVELS[currentLevel].gradient} transition-all duration-500 ease-out`}
                  style={{ width: `${levelProgressPercentage}%` }}
                ></div>
              </div>
              <div className="absolute -top-1 transition-all duration-500" style={{ left: `${levelProgressPercentage}%` }}>
                <div className={`w-5 h-5 bg-gradient-to-r ${LEVELS[currentLevel].gradient} rounded-full shadow-lg`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Question Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 mb-8 overflow-hidden">
          {/* Question Header */}
          <div className={`bg-gradient-to-r ${LEVELS[currentLevel].gradient} p-6`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Question {currentQuestionIndex + 1}
                </h2>
                <p className="text-white/80 text-sm capitalize">
                  {currentQuestion.type.replace('_', ' ')} • {LEVELS[currentLevel].name}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white font-bold">
                <Star className="w-5 h-5 inline mr-2" />
                {currentQuestion.points} pts
              </div>
            </div>
          </div>
          
          {/* Question Content */}
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-8 text-slate-800 leading-relaxed">
                {currentQuestion.question}
              </h3>

              {/* Multiple Choice / Fill in the Blank */}
              {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'fill_blank') && currentQuestion.options && (
                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <label 
                      key={index}
                      className={`group flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                        selectedAnswer === option 
                          ? `border-transparent bg-gradient-to-r ${LEVELS[currentLevel].gradient} shadow-xl` 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={selectedAnswer === option}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${
                        selectedAnswer === option 
                          ? 'border-white bg-white' 
                          : 'border-slate-300 group-hover:border-slate-400'
                      }`}>
                        {selectedAnswer === option && (
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${LEVELS[currentLevel].gradient}`}></div>
                        )}
                      </div>
                      <span className={`text-lg font-medium ${
                        selectedAnswer === option ? 'text-white' : 'text-slate-700'
                      }`}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Free Text Input */}
              {(currentQuestion.type === 'correct_mistake' || 
                currentQuestion.type === 'rearrange' || 
                currentQuestion.type === 'interrogative') && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-slate-700 mb-3">
                      Your Answer:
                    </label>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-6 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none text-lg resize-none bg-white/80 backdrop-blur-sm transition-all"
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Result Display */}
            {showResult && (
              <div className={`p-6 rounded-2xl mb-6 border-2 transform transition-all ${
                questionResults[currentQuestion.id] 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start space-x-4">
                  {questionResults[currentQuestion.id] ? (
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`font-bold text-lg mb-2 ${
                      questionResults[currentQuestion.id] ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {questionResults[currentQuestion.id] 
                        ? `🎉 Correct! +${currentQuestion.points + (streak * 2)} points ${streak > 0 ? `(+${streak * 2} streak bonus)` : ''}` 
                        : '❌ Incorrect! -1 life'
                      }
                    </div>
                    {!questionResults[currentQuestion.id] && (
                      <div className="space-y-2 mb-3">
                        <div className="text-slate-700 text-lg">
                          <strong>Your answer:</strong> {
                            currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'fill_blank' 
                              ? selectedAnswer 
                              : userAnswer
                          }
                        </div>
                        <div className="text-slate-700 text-lg">
                          <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                        </div>
                      </div>
                    )}
                    {currentQuestion.explanation && (
                      <div className="text-slate-600">
                        <strong>Explanation:</strong> {currentQuestion.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(prev => prev - 1)
                    setSelectedAnswer('')
                    setUserAnswer('')
                    setShowResult(false)
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className="bg-white/80 backdrop-blur-sm border-slate-300 text-slate-700 hover:bg-white hover:scale-105 transition-all shadow-md px-6 py-3"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                {!showResult ? (
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={
                      (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'fill_blank') 
                        ? !selectedAnswer 
                        : !userAnswer.trim()
                    }
                    className={`px-8 py-3 text-white font-semibold rounded-xl border-0 bg-gradient-to-r ${LEVELS[currentLevel].gradient} hover:shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:transform-none`}
                    size="lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className={`px-8 py-3 text-white font-semibold rounded-xl border-0 bg-gradient-to-r ${LEVELS[currentLevel].gradient} hover:shadow-lg transform transition-all duration-300 hover:scale-105`}
                    size="lg"
                  >
                    {currentQuestionIndex === levelQuestions.length - 1 ? (
                      <>
                        <Trophy className="w-5 h-5 mr-2" />
                        Complete Level
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Next Question
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
            <Target className="w-5 h-5 mr-3" />
            Question Navigator
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {levelQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuestionIndex(index)
                  setSelectedAnswer('')
                  setUserAnswer('')
                  setShowResult(false)
                }}
                className={`w-12 h-12 rounded-xl text-sm font-bold transition-all transform hover:scale-110 shadow-md ${
                  index === currentQuestionIndex
                    ? `text-white bg-gradient-to-r ${LEVELS[currentLevel].gradient} shadow-lg`
                    : answeredQuestions.has(levelQuestions[index].id)
                    ? questionResults[levelQuestions[index].id]
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
