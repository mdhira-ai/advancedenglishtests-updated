'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { 
  MessageSquare, 
  Send, 
  Users, 
  X, 
  ChevronUp, 
  ChevronDown,
  MoreVertical,
  Smile,
  User,
  UserCheck,
  Circle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createChatManager, SupabaseChatManager } from '@/lib/supabase-chat'

interface ChatMessage {
  id: string
  room_code: string
  sender_id: string
  receiver_id?: string
  message_text: string
  message_type: 'text' | 'emoji' | 'system'
  is_private: boolean
  created_at: string
  sender_first_name: string
  sender_last_name: string
  sender_avatar_url?: string
  sender_gender: string
  is_read?: boolean
}

interface ChatParticipant {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
  gender: string
  is_online: boolean
  role: 'original' | 'additional'
}

interface TypingIndicator {
  user_id: string
  user_name: string
  is_private: boolean
  receiver_id?: string
}

interface RoomChatProps {
  roomCode: string
  currentUserId: string
  participants: ChatParticipant[]
  currentUserData: {
    first_name: string
    last_name: string
    avatar_url?: string
    gender: string
  }
  isVisible?: boolean
}

export default function RoomChatSupabase({
  roomCode,
  currentUserId,
  participants,
  currentUserData,
  isVisible = true
}: RoomChatProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [hasSelectedConversation, setHasSelectedConversation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef<boolean>(false)
  const chatManagerRef = useRef<SupabaseChatManager | null>(null)
  const unreadPollRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  // Get current conversation key (for grouping messages)
  const getCurrentConversationKey = useCallback(() => {
    if (!selectedParticipant) return 'group'
    return [currentUserId, selectedParticipant].sort().join('-')
  }, [currentUserId, selectedParticipant])

  // Get gender icon
  const getGenderIcon = (gender: string, size: string = 'h-4 w-4') => {
    switch (gender?.toLowerCase()) {
      case 'female':
        return <UserCheck className={`${size} text-pink-600`} />
      case 'male':
        return <User className={`${size} text-blue-600`} />
      case 'other':
        return <User className={`${size} text-purple-600`} />
      default:
        return <User className={`${size} text-gray-600`} />
    }
  }

  // Filter messages based on selected conversation
  const getFilteredMessages = useCallback(() => {
    if (!selectedParticipant) {
      // Group chat - show non-private messages
      return messages.filter(msg => !msg.is_private)
    } else {
      // Private chat - show messages between current user and selected participant
      return messages.filter(msg => 
        msg.is_private && (
          (msg.sender_id === currentUserId && msg.receiver_id === selectedParticipant) ||
          (msg.sender_id === selectedParticipant && msg.receiver_id === currentUserId)
        )
      )
    }
  }, [messages, selectedParticipant, currentUserId])

  // Deduplicate messages utility
  const deduplicateMessages = useCallback((msgList: ChatMessage[]) => {
    const seen = new Set<string>()
    return msgList
      .filter(msg => {
        if (seen.has(msg.id)) {
          return false
        }
        seen.add(msg.id)
        return true
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [])

  // Initialize chat manager and connect
  const initializeChatManager = useCallback(async () => {
    if (!roomCode || !currentUserId || chatManagerRef.current || isInitializing) {
      return
    }

    console.log('🚀 Initializing chat manager for room:', roomCode)
    setIsInitializing(true)
    setError(null)
    
    try {
      const chatManager = createChatManager(roomCode, currentUserId)
      chatManagerRef.current = chatManager

      const connected = await chatManager.connect({
        onMessageReceived: (message: ChatMessage) => {
          console.log('📨 New message received:', message)
          
          // Prevent duplicate messages
          if (lastMessageIdRef.current === message.id) {
            return
          }
          lastMessageIdRef.current = message.id

          setMessages(prev => {
            // Add new message and deduplicate
            const newMessages = deduplicateMessages([...prev, message])
            
            // Auto-scroll if chat is open and not minimized
            setTimeout(() => {
              if (isChatOpen && !isMinimized) {
                scrollToBottom()
              }
            }, 100)
            
            return newMessages
          })

          // Update unread counts if chat is closed or minimized
          if (!isChatOpen || isMinimized) {
            refreshUnreadCounts()
          }
        },
        onTypingUpdate: (typingIndicators: TypingIndicator[]) => {
          console.log('⌨️ Typing update:', typingIndicators)
          setTypingUsers(typingIndicators.filter(t => t.user_id !== currentUserId))
        },
        onParticipantUpdate: (updatedParticipants: ChatParticipant[]) => {
          console.log('👥 Participants updated:', updatedParticipants)
          // Handle participant updates if needed
        }
      })

      setIsConnected(connected)

      if (connected) {
        // Load chat history
        console.log('📥 Loading chat history...')
        const history = await chatManager.fetchChatHistory()
        const deduplicatedHistory = deduplicateMessages(history)
        setMessages(deduplicatedHistory)
        
        // Load unread counts
        await refreshUnreadCounts()
        
        console.log('✅ Chat manager initialized successfully')
        setError(null)
      } else {
        setError('Failed to connect to chat service')
        console.error('❌ Failed to connect to chat')
      }
    } catch (error) {
      console.error('❌ Error initializing chat manager:', error)
      setError('Failed to connect to chat')
      setIsConnected(false)
    } finally {
      setIsInitializing(false)
    }
  }, [roomCode, currentUserId, isInitializing, isChatOpen, isMinimized])

  // Refresh unread counts
  const refreshUnreadCounts = useCallback(async () => {
    if (chatManagerRef.current && chatManagerRef.current.isConnectedToChat()) {
      try {
        const counts = await chatManagerRef.current.getUnreadCounts()
        setUnreadCounts(counts)
      } catch (error) {
        console.error('❌ Error refreshing unread counts:', error)
      }
    }
  }, [])

  // Send message using Supabase broadcast
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatManagerRef.current || !isConnected || isLoading) {
      return
    }

    const messageText = newMessage.trim()
    
    // Clear input immediately for better UX
    setNewMessage('')
    
    // Stop typing indicator
    stopTyping()

    try {
      setIsLoading(true)
      setError(null)
      
      const success = await chatManagerRef.current.sendMessage({
        receiver_id: selectedParticipant || undefined,
        message_text: messageText,
        message_type: 'text',
        is_private: !!selectedParticipant,
        sender_first_name: currentUserData.first_name,
        sender_last_name: currentUserData.last_name,
        sender_avatar_url: currentUserData.avatar_url,
        sender_gender: currentUserData.gender
      })

      if (success) {
        console.log('✅ Message sent successfully')
        
        // Add message to local state immediately for sender
        const localMessage: ChatMessage = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          room_code: roomCode,
          sender_id: currentUserId,
          receiver_id: selectedParticipant || undefined,
          message_text: messageText,
          message_type: 'text',
          is_private: !!selectedParticipant,
          created_at: new Date().toISOString(),
          sender_first_name: currentUserData.first_name,
          sender_last_name: currentUserData.last_name,
          sender_avatar_url: currentUserData.avatar_url,
          sender_gender: currentUserData.gender,
          is_read: true
        }

        setMessages(prev => {
          const newMessages = deduplicateMessages([...prev, localMessage])
          return newMessages
        })

        // Focus back to input
        messageInputRef.current?.focus()
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100)
        
      } else {
        // Restore message on failure
        setNewMessage(messageText)
        setError('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setNewMessage(messageText) // Restore message
      setError('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle typing indicator with debouncing
  const handleTyping = async () => {
    if (!chatManagerRef.current || !isConnected) return

    // Clear existing debounce timeout
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current)
    }

    // If not already typing, send typing indicator
    if (!isTypingRef.current) {
      isTypingRef.current = true
      try {
        const userName = `${currentUserData.first_name} ${currentUserData.last_name}`.trim()
        await chatManagerRef.current.sendTypingIndicator(true, selectedParticipant || undefined, userName)
      } catch (error) {
        console.error('❌ Error sending typing indicator:', error)
      }
    }

    // Clear existing stop timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 1500)
  }

  // Stop typing indicator
  const stopTyping = async () => {
    if (!isTypingRef.current || !chatManagerRef.current) return
    
    isTypingRef.current = false
    
    // Clear timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current)
      typingDebounceRef.current = null
    }
  }

  // Mark messages as read
  const markMessagesAsRead = async (conversationKey: string) => {
    if (!chatManagerRef.current || !isConnected) return

    console.log('📖 Marking messages as read for:', conversationKey)
    
    try {
      const success = await chatManagerRef.current.markMessagesAsRead(selectedParticipant || undefined)
      
      if (success) {
        console.log('✅ Messages marked as read successfully')
        // Refresh unread counts
        await refreshUnreadCounts()
      }
    } catch (error) {
      console.error('❌ Error marking messages as read:', error)
    }
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading) {
        sendMessage()
      }
    }
  }

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (e.target.value.trim() && isConnected) {
      handleTyping()
    } else {
      stopTyping()
    }
  }

  // Initialize chat when component mounts or chat opens
  useEffect(() => {
    if (isChatOpen && roomCode && currentUserId && isVisible) {
      console.log('💬 Chat opened - initializing...')
      
      // Reset conversation selection state when chat opens
      if (!hasSelectedConversation) {
        setSelectedParticipant(null)
      }
      
      // Initialize chat manager if not already done
      if (!chatManagerRef.current) {
        initializeChatManager()
      }
    }
  }, [isChatOpen, roomCode, currentUserId, isVisible, initializeChatManager])

  // Setup background unread polling when chat is closed
  useEffect(() => {
    if (!isChatOpen && isVisible && roomCode && currentUserId) {
      // Start background polling for unread counts
      const startPolling = async () => {
        // Initialize chat manager if needed for background polling
        if (!chatManagerRef.current) {
          await initializeChatManager()
        }
        
        // Refresh unread counts immediately
        await refreshUnreadCounts()
        
        // Set up interval for polling
        if (unreadPollRef.current) {
          clearInterval(unreadPollRef.current)
        }
        
        unreadPollRef.current = setInterval(async () => {
          await refreshUnreadCounts()
        }, 5000) // Poll every 5 seconds
      }

      startPolling()
    } else if (unreadPollRef.current) {
      // Clear polling when chat is open
      clearInterval(unreadPollRef.current)
      unreadPollRef.current = null
    }

    return () => {
      if (unreadPollRef.current) {
        clearInterval(unreadPollRef.current)
        unreadPollRef.current = null
      }
    }
  }, [isChatOpen, isVisible, roomCode, currentUserId, initializeChatManager, refreshUnreadCounts])

  // Mark messages as read when conversation is selected
  useEffect(() => {
    console.log('📖 Read marking useEffect triggered:')
    console.log('  - isChatOpen:', isChatOpen)
    console.log('  - isMinimized:', isMinimized) 
    console.log('  - hasSelectedConversation:', hasSelectedConversation)
    console.log('  - selectedParticipant:', selectedParticipant)
    console.log('  - isConnected:', isConnected)
    
    if (isChatOpen && !isMinimized && hasSelectedConversation && isConnected) {
      const conversationKey = getCurrentConversationKey()
      console.log('📖 Marking messages as read for:', conversationKey)
      markMessagesAsRead(conversationKey)
      
      // Stop typing indicator when switching conversations
      stopTyping()
    }
  }, [selectedParticipant, hasSelectedConversation, isChatOpen, isMinimized, isConnected, getCurrentConversationKey])

  // Auto-scroll when messages change and chat is open
  useEffect(() => {
    if (isChatOpen && !isMinimized && messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages, isChatOpen, isMinimized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current)
      }
      if (unreadPollRef.current) {
        clearInterval(unreadPollRef.current)
      }
      
      // Stop typing and disconnect
      stopTyping()
      
      if (chatManagerRef.current) {
        chatManagerRef.current.disconnect()
        chatManagerRef.current = null
      }
    }
  }, [])

  // Get total unread count
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  // Get filtered typing users for current conversation
  const currentTypingUsers = useMemo(() => {
    return typingUsers.filter(typing => {
      if (!selectedParticipant) {
        // Group chat - show non-private typing from other users
        return !typing.is_private && typing.user_id !== currentUserId
      } else {
        // Private chat - show typing from selected participant to current user
        return typing.is_private && 
               typing.user_id === selectedParticipant && 
               (typing.receiver_id === currentUserId || !typing.receiver_id)
      }
    })
  }, [typingUsers, selectedParticipant, currentUserId])

  if (!isVisible) return null

  return (
    <>
      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <div className="fixed bottom-2 right-6 z-50">
          <Button
            onClick={() => {
              console.log('💬 Opening chat...')
              setIsChatOpen(true)
            }}
            className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg relative transition-all duration-200 hover:scale-105"
          >
            <MessageSquare className="h-6 w-6 text-white" />
            {totalUnreadCount > 0 && (
              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center min-w-[24px] px-1 shadow-md animate-pulse">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </div>
            )}
            {isInitializing && (
              <div className="absolute inset-0 rounded-full bg-blue-700 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Chat Interface */}
      {isChatOpen && (
        <div className={`fixed bottom-2 right-0 z-50 transition-all duration-200 ${
          isMinimized ? 'w-64' : 'w-80'
        }`}>
          <Card className="bg-white border border-gray-200 shadow-xl">
            {/* Chat Header */}
            <CardHeader className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    Room Chat
                    {isInitializing && (
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full ml-2 animate-pulse"></span>
                    )}
                    {isConnected && !isInitializing && (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                    )}
                    {!isConnected && !isInitializing && (
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                    )}
                  </CardTitle>
                  {selectedParticipant && (
                    <Badge variant="outline" className="text-xs">
                      Private
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    {isMinimized ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('💬 Closing chat...')
                      setIsChatOpen(false)
                      setIsMinimized(false)
                      setHasSelectedConversation(false)
                      stopTyping()
                    }}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Participant Selector */}
              {!isMinimized && (
                <div className="flex items-center space-x-1 mt-1 overflow-x-auto scrollbar-thin">
                  {/* Group Chat Button */}
                  <Button
                    variant={selectedParticipant === null && hasSelectedConversation ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedParticipant(null)
                      setHasSelectedConversation(true)
                    }}
                    className="flex items-center space-x-1 text-xs shrink-0 relative px-2 py-1 h-6"
                  >
                    <Users className="h-2 w-2" />
                    <span>Group</span>
                    {unreadCounts['group'] > 0 && (
                      <Badge className="ml-1 h-3 w-3 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center min-w-[12px]">
                        {unreadCounts['group'] > 9 ? '9+' : unreadCounts['group']}
                      </Badge>
                    )}
                  </Button>

                  {/* Individual Participant Buttons */}
                  {participants
                    .filter(p => p.id !== currentUserId)
                    .map(participant => (
                      <Button
                        key={participant.id}
                        variant={selectedParticipant === participant.id && hasSelectedConversation ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedParticipant(participant.id)
                          setHasSelectedConversation(true)
                        }}
                        className="flex items-center space-x-1 text-xs shrink-0 relative px-2 py-1 h-6"
                      >
                        {getGenderIcon(participant.gender, "h-2 w-2")}
                        <span className="max-w-[60px] truncate">
                          {participant.first_name}
                        </span>
                        {unreadCounts[participant.id] > 0 && (
                          <Badge className="ml-1 h-3 w-3 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center min-w-[12px]">
                            {unreadCounts[participant.id] > 9 ? '9+' : unreadCounts[participant.id]}
                          </Badge>
                        )}
                      </Button>
                    ))}
                </div>
              )}
            </CardHeader>

            {/* Chat Content */}
            {!isMinimized && (
              <CardContent className="p-0">
                {/* Connection Status */}
                {!isConnected && (
                  <div className="p-2 text-center text-sm text-orange-600 bg-orange-50 border-b">
                    Connecting to chat...
                  </div>
                )}
                
                {error && (
                  <div className="p-2 text-center text-sm text-red-600 bg-red-50 border-b">
                    {error}
                  </div>
                )}

                {/* Messages Area */}
                <div className="h-48 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {hasSelectedConversation ? (
                    getFilteredMessages().length > 0 ? (
                      getFilteredMessages().map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-2 py-1 text-xs ${
                              message.sender_id === currentUserId
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.sender_id !== currentUserId && (
                              <div className="flex items-center space-x-1 mb-1">
                                {getGenderIcon(message.sender_gender, "h-2 w-2")}
                                <span className="font-semibold text-[10px]">
                                  {message.sender_first_name}
                                </span>
                              </div>
                            )}
                            <p className="break-words">{message.message_text}</p>
                            <p className={`text-[9px] mt-1 ${
                              message.sender_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-xs py-8">
                        {selectedParticipant ? 'No private messages yet' : 'No group messages yet'}
                        <br />
                        <span className="text-[10px]">Start the conversation!</span>
                      </div>
                    )
                  ) : (
                    <div className="text-center text-gray-500 text-xs py-8">
                      Select a conversation to start chatting
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {currentTypingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-[10px]">
                            {currentTypingUsers[0].user_name} is typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-2">
                  {hasSelectedConversation && isConnected ? (
                    <div className="flex items-center space-x-2">
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        onBlur={stopTyping}
                        placeholder={
                          selectedParticipant 
                            ? `Message ${participants.find(p => p.id === selectedParticipant)?.first_name}...`
                            : "Message group..."
                        }
                        className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                      />
                      
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isLoading}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ) : !hasSelectedConversation ? (
                    <div className="text-center text-gray-400 text-xs py-2">
                      Select a conversation to start messaging
                    </div>
                  ) : (
                    <div className="text-center text-orange-500 text-xs py-2">
                      {isInitializing ? "Connecting..." : "Not connected to chat"}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Custom CSS for scrollbars */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 2px;
        }
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
          border-radius: 2px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}</style>
    </>
  )
}