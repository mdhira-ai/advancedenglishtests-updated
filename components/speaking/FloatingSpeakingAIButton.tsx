'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Volume2 } from 'lucide-react'
import SpeakingAIPopup from './SpeakingAIPopup'

export default function FloatingSpeakingAIButton() {
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsPopupOpen(true)}
          size="lg"
          className="
            w-15 h-15 rounded-full shadow-2xl transform transition-all duration-300 
            hover:scale-110 hover:shadow-xl active:scale-95
            text-white border-0 relative overflow-hidden group p-2
          "
          style={{
            backgroundColor: '#1A3A6E',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#142d57'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1A3A6E'
          }}
        >
          {/* Background Animation */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Icon Container */}
          <div className="relative z-10 flex items-center justify-center">
            <Mic className="h-12 w-12 transform transition-transform duration-300 group-hover:scale-110" />
          </div>
          
          {/* Sound Wave Effect */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Volume2 className="h-4 w-4 text-white animate-pulse" />
          </div>
          
          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-full border-2 opacity-20 animate-ping" style={{ borderColor: '#1A3A6E' }}></div>
        </Button>
        
        {/* Tooltip */}
        <div className="
          absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
          whitespace-nowrap shadow-lg
        ">
          Speaking Practice
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Popup Modal */}
      <SpeakingAIPopup 
        isOpen={isPopupOpen} 
        onClose={() => setIsPopupOpen(false)} 
      />
      

    </>
  )
}
