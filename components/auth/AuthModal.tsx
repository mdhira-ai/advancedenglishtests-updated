'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { X, Lock, Star, BookOpen, Trophy, Target, Sparkles, Crown } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  pageType: 'cambridge-plus' | 'speaking' | 'speaking-check'
  targetUrl?: string
}

export default function AuthModal({ isOpen, onClose, pageType, targetUrl }: AuthModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  const handleNavigate = (url: string) => {
    handleClose()
    // Small delay to ensure modal closes before navigation
    setTimeout(() => {
      if (targetUrl && (url === '/login' || url === '/signup')) {
        const encodedReturnUrl = encodeURIComponent(targetUrl)
        window.location.href = `${url}?returnUrl=${encodedReturnUrl}`
      } else {
        window.location.href = url
      }
    }, 100)
  }

  if (!isOpen) return null

  const pageContent = {
    'cambridge-plus': {
      title: '🚀 Unlock Premium Excellence',
      subtitle: 'Cambridge Test Plus Awaits Your Brilliance',
      features: [
        { icon: Crown, text: 'Exclusive premium test materials' },
        { icon: Star, text: 'Advanced analytics & performance insights' },
        { icon: Trophy, text: 'Comprehensive feedback mechanisms' },
        { icon: Target, text: 'Personalized learning pathways' }
      ],
      quote: '"Excellence is not a skill, it\'s an attitude."',
      cta: 'Login for Unlimited Free Practice'
    },
    'speaking': {
      title: '🎯 Amplify Your Voice',
      subtitle: 'Speaking Practice for Linguistic Mastery',
      features: [
        { icon: Sparkles, text: 'Interactive speaking simulations' },
        { icon: BookOpen, text: 'Diverse topical conversations' },
        { icon: Star, text: 'Real-time pronunciation analysis' },
        { icon: Trophy, text: 'Confidence-building exercises' }
      ],
      quote: '"Communication is the bridge between confusion and clarity."',
      cta: 'Login for Unlimited Free Practice'
    },
    'speaking-check': {
      title: '🎙️ AI-Powered Speaking Analysis',
      subtitle: 'Advanced Speaking Assessment & Feedback',
      features: [
        { icon: Target, text: 'AI-powered speaking evaluation' },
        { icon: Star, text: 'Detailed band score analysis' },
        { icon: Trophy, text: 'Comprehensive feedback reports' },
        { icon: Sparkles, text: 'Track your progress over time' }
      ],
      quote: '"Perfect practice makes perfect performance."',
      cta: 'Login for Unlimited Free Practice'
    }
  }

  const content = pageContent[pageType]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto scrollbar-hide" style={{ height: '100vh', width: '100vw' }}>
      <div 
        className={`absolute inset-0 bg-blue-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        style={{ height: '100vh', width: '100vw' }}
      />
      
      <Card className={`relative w-full max-w-lg mx-auto my-4 sm:my-8 transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide`}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <CardHeader className="text-center pb-2 sm:pb-4 px-3 sm:px-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <Lock className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
          <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {content.title}
          </CardTitle>
          <CardDescription className="text-sm sm:text-lg text-gray-700 font-medium">
            {content.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-1.5 sm:space-y-3">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-3 rounded-lg bg-white/70 border border-blue-100">
                <div className="p-1 sm:p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex-shrink-0">
                  <feature.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs sm:text-base text-gray-700 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center py-2 sm:py-4">
            <blockquote className="text-gray-600 italic text-sm sm:text-lg font-medium px-2">
              {content.quote}
            </blockquote>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Button 
              onClick={() => handleNavigate('/login')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 sm:py-3 text-sm sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {content.cta}
            </Button>
            
            <div className="text-center">
              <span className="text-xs sm:text-base text-gray-600">New to IELTS Test? </span>
              <button 
                onClick={() => handleNavigate('/signup')}
                className="text-xs sm:text-base text-blue-600 hover:text-blue-800 font-semibold underline bg-transparent border-none cursor-pointer"
              >
                Create your account
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-lg p-2 sm:p-4 text-center">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-amber-700">
              <Sparkles className="w-3 h-3 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base font-semibold">Elevate your IELTS journey today!</span>
              <Sparkles className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
