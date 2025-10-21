'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Highlight {
  text: string
  color: string
  id: string
}

interface TextHighlighterProps {
  children: ReactNode
  className?: string
  highlightColors?: {
    red: { bg: string; border: string; label: string; emoji: string }
    green: { bg: string; border: string; label: string; emoji: string }
    blue?: { bg: string; border: string; label: string; emoji: string }
    yellow?: { bg: string; border: string; label: string; emoji: string }
  }
  onHighlightsChange?: (highlights: Record<string, Highlight>) => void
  initialHighlights?: Record<string, Highlight>
}

export default function TextHighlighter({
  children,
  className = '',
  highlightColors = {
    red: { bg: 'rgba(254, 202, 202, 0.7)', border: '#f87171', label: 'Red', emoji: '🔴' },
    green: { bg: 'rgba(187, 247, 208, 0.7)', border: '#4ade80', label: 'Green', emoji: '🟢' }
  },
  onHighlightsChange,
  initialHighlights = {}
}: TextHighlighterProps) {
  const [selectedText, setSelectedText] = useState('')
  const [showHighlightMenu, setShowHighlightMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [highlights, setHighlights] = useState<Record<string, Highlight>>(initialHighlights)
  const [highlightCounter, setHighlightCounter] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle ESC key to close highlight menu and document selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHighlightMenu(false)
        window.getSelection()?.removeAllRanges()
      }
    }

    // Handle text selection changes
    const handleSelectionChange = () => {
      handleDocumentSelection()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [])

  // Notify parent of highlights changes
  useEffect(() => {
    if (onHighlightsChange) {
      onHighlightsChange(highlights)
    }
  }, [highlights, onHighlightsChange])

  // Handle text selection on document level
  const handleDocumentSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim()
        
        // Check if the selection is within this component
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer
        const parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
        
        // Only show highlight menu if selection is within this component
        if (parentElement && containerRef.current?.contains(parentElement)) {
          setSelectedText(selectedText)
          
          // Get the position for the highlight menu
          const rect = range.getBoundingClientRect()
          const scrollY = window.scrollY || document.documentElement.scrollTop
          const scrollX = window.scrollX || document.documentElement.scrollLeft
          
          setMenuPosition({
            x: rect.left + scrollX + (rect.width / 2),
            y: rect.top + scrollY - 500
          })
          setShowHighlightMenu(true)
        }
      } else {
        setShowHighlightMenu(false)
      }
    }, 50)
  }

  const addHighlight = (color: keyof typeof highlightColors) => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0)
      const highlightId = `highlight-${highlightCounter}`
      const colorConfig = highlightColors[color]
      
      if (!colorConfig) return
      
      // Create a span element to wrap the selected text
      const span = document.createElement('span')
      span.id = highlightId
      span.style.cursor = 'pointer'
      span.style.padding = '1px 2px'
      span.style.borderRadius = '2px'
      span.style.position = 'relative'
      span.title = `${colorConfig.label} highlight - Double-click to remove`
      span.style.backgroundColor = colorConfig.bg
      span.style.borderBottom = `2px solid ${colorConfig.border}`
      
      try {
        range.surroundContents(span)
        
        // Store the highlight
        setHighlights(prev => ({
          ...prev,
          [highlightId]: {
            text: selectedText,
            color: color,
            id: highlightId
          }
        }))
        
        // Add hover effect
        span.addEventListener('mouseenter', () => {
          span.style.opacity = '0.8'
        })
        span.addEventListener('mouseleave', () => {
          span.style.opacity = '1'
        })
        
        // Add click listener to remove highlight
        span.addEventListener('dblclick', () => removeHighlight(highlightId))
        
        setHighlightCounter(prev => prev + 1)
      } catch (error) {
        console.log('Could not highlight complex selection')
      }
      
      selection.removeAllRanges()
      setShowHighlightMenu(false)
    }
  }

  const removeHighlight = (highlightId: string) => {
    const element = document.getElementById(highlightId)
    if (element) {
      const parent = element.parentNode
      const textNode = document.createTextNode(element.textContent || '')
      parent?.replaceChild(textNode, element)
      parent?.normalize()
      
      setHighlights(prev => {
        const newHighlights = { ...prev }
        delete newHighlights[highlightId]
        return newHighlights
      })
    }
  }

  const clearAllHighlights = () => {
    Object.keys(highlights).forEach(highlightId => {
      removeHighlight(highlightId)
    })
    setHighlights({})
    setHighlightCounter(0)
  }

  const getHighlightCount = () => Object.keys(highlights).length

  return (
    <>
      <style>{`
        .text-highlighter-container {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }
        
        .text-highlighter-container::-moz-selection {
          background-color: rgba(59, 130, 246, 0.3);
          color: inherit;
        }
        
        .text-highlighter-container::selection {
          background-color: rgba(59, 130, 246, 0.3);
          color: inherit;
        }
        
        .highlight-menu-enter {
          animation: highlight-menu-enter 0.2s ease-out;
        }
        
        @keyframes highlight-menu-enter {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
      `}</style>
      
      <div 
        ref={containerRef}
        className={`text-highlighter-container ${className}`}
      >
        {children}
      </div>

      {/* Clear Highlights Button */}
      {getHighlightCount() > 0 && (
        <div className="mt-2 flex justify-end">
          <Button 
            onClick={clearAllHighlights} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            Clear All Highlights ({getHighlightCount()})
          </Button>
        </div>
      )}

      {/* Text Highlight Menu */}
      {showHighlightMenu && (
        <div 
          className="fixed z-50 highlight-menu-enter"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 flex space-x-2 relative">
            {Object.entries(highlightColors).map(([colorKey, colorConfig]) => (
              <Button
                key={colorKey}
                onClick={() => addHighlight(colorKey as keyof typeof highlightColors)}
                size="sm"
                className={`${
                  colorKey === 'red' ? 'bg-red-500 hover:bg-red-600' :
                  colorKey === 'green' ? 'bg-green-500 hover:bg-green-600' :
                  colorKey === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                  colorKey === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'bg-gray-500 hover:bg-gray-600'
                } text-white px-2 py-1 text-xs shadow-md hover:shadow-lg transition-shadow`}
              >
                {colorConfig.emoji} {colorConfig.label}
              </Button>
            ))}
            <Button
              onClick={() => setShowHighlightMenu(false)}
              size="sm"
              variant="outline"
              className="px-2 py-1 text-xs hover:bg-gray-50 transition-colors"
            >
              ✕
            </Button>
            {/* Arrow pointing up to selected text */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-300"></div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-px w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for managing highlights externally
export const useTextHighlighter = (initialHighlights: Record<string, Highlight> = {}) => {
  const [highlights, setHighlights] = useState<Record<string, Highlight>>(initialHighlights)

  const clearAllHighlights = () => {
    Object.keys(highlights).forEach(highlightId => {
      const element = document.getElementById(highlightId)
      if (element) {
        const parent = element.parentNode
        const textNode = document.createTextNode(element.textContent || '')
        parent?.replaceChild(textNode, element)
        parent?.normalize()
      }
    })
    setHighlights({})
  }

  const getHighlightsByColor = (color: string) => {
    return Object.values(highlights).filter(h => h.color === color)
  }

  const getHighlightCount = () => Object.keys(highlights).length

  return {
    highlights,
    setHighlights,
    clearAllHighlights,
    getHighlightsByColor,
    getHighlightCount
  }
}
