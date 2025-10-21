'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  BookOpen, 
  ArrowRight,
  CheckCircle,
  Play,
  Target,
  Brain,
  Zap,
  Award,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  TenseComponent, 
  ConditionalComponent, 
  ModalsComponent, 
  PassiveVoiceComponent 
} from '@/components/grammar'

// Grammar topic data structure
const grammarTopics = [
  {
    id: 'tense',
    title: 'Tenses',
    description: 'Master all English tenses with comprehensive lessons and practice',
    icon: Clock,
    color: 'blue',
    gradient: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    difficulty: 'Beginner to Advanced',
    lessons: 12,
    exercises: 50,
    estimatedTime: '2-3 hours'
  },
  {
    id: 'conditional',
    title: 'Conditionals',
    description: 'Learn all types of conditional sentences and their usage',
    icon: Target,
    color: 'green',
    gradient: 'from-green-400 to-emerald-500',
    bgColor: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
    difficulty: 'Intermediate to Advanced',
    lessons: 8,
    exercises: 35,
    estimatedTime: '1.5-2 hours'
  },
  {
    id: 'modals',
    title: 'Modal Verbs',
    description: 'Understand modal verbs and their various meanings and uses',
    icon: Brain,
    color: 'purple',
    gradient: 'from-purple-400 to-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50',
    difficulty: 'Intermediate',
    lessons: 10,
    exercises: 40,
    estimatedTime: '2 hours'
  },
  {
    id: 'passive',
    title: 'Passive Voice',
    description: 'Master the passive voice in all tenses and contexts',
    icon: Zap,
    color: 'orange',
    gradient: 'from-orange-400 to-red-500',
    bgColor: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
    difficulty: 'Intermediate to Advanced',
    lessons: 9,
    exercises: 30,
    estimatedTime: '1.5 hours'
  }
]

type ViewState = 'overview' | 'topic'

export default function GrammarLearningPage() {
  const [currentView, setCurrentView] = useState<ViewState>('overview')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId)
    setCurrentView('topic')
  }

  const handleBackToOverview = () => {
    setCurrentView('overview')
    setSelectedTopic(null)
  }

  if (currentView === 'topic' && selectedTopic) {
    const topic = grammarTopics.find(t => t.id === selectedTopic)
    if (topic) {
      switch (selectedTopic) {
        case 'tense':
          return <TenseComponent onBack={handleBackToOverview} />
        case 'conditional':
          return <ConditionalComponent onBack={handleBackToOverview} />
        case 'modals':
          return <ModalsComponent onBack={handleBackToOverview} />
        case 'passive':
          return <PassiveVoiceComponent onBack={handleBackToOverview} />
        default:
          return <TopicDetailView topic={topic} onBack={handleBackToOverview} />
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Grammar Learning Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Master essential English grammar concepts with interactive lessons, 
              comprehensive explanations, and practical exercises designed for all levels.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Overview */}
        <div className="mb-12">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <Award className="w-6 h-6 text-yellow-500" />
                <span>Your Learning Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">0/4</div>
                  <div className="text-sm text-gray-600">Topics Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Exercises Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">0h</div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">0%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">0%</span>
                </div>
                <Progress value={0} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grammar Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {grammarTopics.map((topic) => (
            <TopicCard 
              key={topic.id} 
              topic={topic} 
              onSelect={() => handleTopicSelect(topic.id)} 
            />
          ))}
        </div>

        {/* Study Tips Section */}
        <div className="mt-16">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Study Tips for Success</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Practice Regularly</h4>
                  <p className="text-white/90 text-sm">
                    Consistent daily practice is more effective than long, infrequent study sessions.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Apply in Context</h4>
                  <p className="text-white/90 text-sm">
                    Use new grammar concepts in writing and speaking to reinforce learning.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Review Mistakes</h4>
                  <p className="text-white/90 text-sm">
                    Learn from errors by reviewing incorrect answers and understanding why.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Topic Card Component
function TopicCard({ topic, onSelect }: { topic: typeof grammarTopics[0], onSelect: () => void }) {
  const IconComponent = topic.icon

  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${topic.gradient}`} />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${topic.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
              <IconComponent className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {topic.title}
              </CardTitle>
              <Badge variant="secondary" className="mt-1">
                {topic.difficulty}
              </Badge>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 leading-relaxed">
          {topic.description}
        </p>
        
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{topic.lessons}</div>
            <div className="text-xs text-gray-500">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{topic.exercises}</div>
            <div className="text-xs text-gray-500">Exercises</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{topic.estimatedTime}</div>
            <div className="text-xs text-gray-500">Est. Time</div>
          </div>
        </div>

        <Button 
          onClick={onSelect}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Learning
        </Button>
      </CardContent>
    </Card>
  )
}

// Topic Detail View Component (placeholder for now)
function TopicDetailView({ topic, onBack }: { topic: typeof grammarTopics[0], onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Topics</span>
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{topic.title}</h1>
          <p className="text-xl text-gray-600 mb-8">{topic.description}</p>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Coming Soon!</h3>
                <p className="text-gray-600">
                  Detailed lessons and interactive exercises for {topic.title.toLowerCase()} are currently being developed. 
                  Check back soon for comprehensive learning materials.
                </p>
                <Button onClick={onBack} className="mt-4">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}