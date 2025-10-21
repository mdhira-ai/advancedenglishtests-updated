'use client'

import React from 'react'
import { X, Clock, CheckCircle, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HowToUseModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[75vh] sm:max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 text-center border-b border-gray-200 flex-shrink-0">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="mb-2 sm:mb-4">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-4">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              IELTS Speaking Practice
            </h2>
            <p className="text-sm sm:text-lg text-gray-600">
              Your complete guide to 13-minute IELTS-style speaking sessions
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* IELTS Format Overview */}
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="text-lg font-bold text-amber-800">IELTS Speaking Test (13 minutes)</h3>
            </div>
            <div className="text-sm text-gray-700">
              <strong>Part 1:</strong> Introduction (4-5 min) • <strong>Part 2:</strong> Cue Card (3-4 min) • <strong>Part 3:</strong> Discussion (4-5 min)
            </div>
          </div>

          {/* Simple Steps */}
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">1</div>
              <div>
                <h3 className="font-bold text-blue-800 mb-1">Find a Partner</h3>
                <p className="text-sm text-gray-700">Browse users and send a speaking request</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4">2</div>
              <div>
                <h3 className="font-bold text-green-800 mb-1">Connect</h3>
                <p className="text-sm text-gray-700">Connect now or schedule for later</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-4">3</div>
              <div>
                <h3 className="font-bold text-purple-800 mb-1">Practice Speaking</h3>
                <p className="text-sm text-gray-700">Follow IELTS format with built-in timer and cue cards</p>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Why This Works
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Real exam experience with actual timing</li>
              <li>• Build confidence with real people</li>
              <li>• Get instant feedback from your partner</li>
              <li>• Practice anytime with available users</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Tip:</span> Take turns being examiner and candidate
            </div>
            <Button 
              onClick={onClose}
              className="px-6 py-2 text-white font-medium rounded-lg"
              style={{ backgroundColor: '#4f5bd5' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A3A6E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4f5bd5';
              }}
            >
              Got It!
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}