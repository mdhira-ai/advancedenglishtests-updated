'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, MicOff, PhoneOff, Volume2, VolumeX, 
  Clock, Users, Wifi, WifiOff, Settings, 
  MessageSquare, Heart, Star, User, UserCheck, UserPlus,
  AlertCircle, CheckCircle, Signal, Phone, BookOpen, X
} from 'lucide-react'
import type { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ILocalAudioTrack,
  NetworkQuality
} from 'agora-rtc-sdk-ng'
import { useSession } from '@/lib/auth-client'
import RoomChatSupabase from '@/components/room/RoomChatSupabase'
import SpeakingAIPopup from '@/components/speaking/SpeakingAIPopup'
import { useSpeakingRoom } from '@/hooks/useSpeakingRoom'
import { 
  getAgoraToken, 
  updateRoomStatus, 
  updateParticipantOnlineStatus,
  removeParticipantFromRoom,
  saveRoomSession,
  getUserActiveRoom,
  canUserJoinRoom,
  endRoomForAllParticipants
} from '@/lib/speaking-room-utils'



interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  connectionQuality: number | null
  remoteUserJoined: boolean
}

interface AudioState {
  isMuted: boolean
  isRemoteMuted: boolean
  volume: number
  remoteVolume: number
}

export default function SpeakingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, error, isPending } = useSession()
  const roomCode = params?.roomCode as string

  // Use the custom hook for room data management
  const {
    roomData,
    participants: allParticipants,
    participantLikes,
    isLoading,
    error: roomError,
    isAuthorized,
    toggleParticipantLike,
    fetchRoomData,
    fetchParticipants: fetchAllParticipants
  } = useSpeakingRoom(roomCode)

  // Get authentication headers based on auth type
  const getAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Better Auth uses session cookies automatically
    // No additional headers needed
    
    return headers
  }, [session])

  // Get current user ID from Better Auth session
  const getCurrentUserId = useCallback(() => {
    return session?.user?.id || null
  }, [session])

  // Room state - keep only non-hook managed state
  const [sessionDuration, setSessionDuration] = useState(0)
  const [callStarted, setCallStarted] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [joinAttempts, setJoinAttempts] = useState(0)
  const [partnerLeft, setPartnerLeft] = useState(false)
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(false) // Track when restoring session after page reload
  
  // 13-minute time limit states
  const [sessionTimeUp, setSessionTimeUp] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [timeWarningMessage, setTimeWarningMessage] = useState('')
  const [timeWarningType, setTimeWarningType] = useState<'warning' | 'critical'>('warning')
  const [isEndingCall, setIsEndingCall] = useState(false) // Prevent multiple simultaneous call endings

  // New state for participants display
  const [showParticipants, setShowParticipants] = useState(false)
  const [participantsLoading, setParticipantsLoading] = useState(false)

  // New state for SpeakingAI popup
  const [showSpeakingAIPopup, setShowSpeakingAIPopup] = useState(false)

  // State to track which participants are connected to voice channel
  const [connectedParticipants, setConnectedParticipants] = useState<Set<string>>(new Set())

  // Agora state
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionQuality: null,
    remoteUserJoined: false
  })
  
  const [audioState, setAudioState] = useState<AudioState>({
    isMuted: false,
    isRemoteMuted: false,
    volume: 50,
    remoteVolume: 50
  })

  // Agora refs
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const backupTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Backup 13-minute timeout

  // Get partner info (returns the other original participant for backward compatibility)
  // Note: For invited participants, this returns the "other" original user
  // In multi-participant rooms, use getOtherParticipants() for all other users
  const getPartnerInfo = () => {
    const userId = getCurrentUserId()
    if (!roomData || !userId) return null
    
    const isUser1 = roomData.user1_id === userId
    const partnerData = isUser1 ? roomData.user2 : roomData.user1
    
    return partnerData || null
  }

  const getCurrentUserInfo = () => {
    const userId = getCurrentUserId()
    if (!roomData || !userId) return null
    
    const isUser1 = roomData.user1_id === userId
    const userData = isUser1 ? roomData.user1 : roomData.user2
    
    // If not in original room users, check participants
    if (!userData) {
      const currentUserParticipant = allParticipants.find(p => p.id === userId)
      return currentUserParticipant || null
    }
    
    return userData || null
  }

  // Get all other participants (excluding current user)
  const getOtherParticipants = () => {
    const userId = getCurrentUserId()
    if (!userId) return []
    
    return allParticipants.filter(p => p.id !== userId)
  }

  // Get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'female':
        return <UserCheck className="h-10 w-10 text-pink-600" />
      case 'male':
        return <User className="h-10 w-10 text-blue-600" />
      case 'other':
        return <User className="h-10 w-10 text-purple-600" />
      default:
        return <User className="h-10 w-10 text-gray-600" />
    }
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format remaining time for 13-minute session
  const formatRemainingTime = (elapsedSeconds: number) => {
    const maxSessionSeconds = 13 * 60 // 13 minutes = 780 seconds
    const remainingSeconds = Math.max(0, maxSessionSeconds - elapsedSeconds)
    const mins = Math.floor(remainingSeconds / 60)
    const secs = remainingSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Check room status to detect if anyone ended the call using utils
  const checkRoomStatus = async () => {
    if (!session?.user || !roomCode || isAuthorized !== true) return

    try {
      const roomAccess = await canUserJoinRoom(roomCode, session.user.id)
      
      // Only redirect if room is actually ended, not if there are temporary access issues
      if (!roomAccess.canJoin && roomAccess.reason === 'Room is not active' && roomAccess.roomData?.status === 'ended') {
        console.log('Room ended, redirecting both users to speaking page...')
        
        // Clear session timer to prevent further processing
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current)
          sessionTimerRef.current = null
        }

        // Leave voice channel and clean up
        await leaveVoiceChannel()
        
        // Immediately redirect without showing partner left screen
        console.log('Room ended - redirecting immediately...')
        window.location.href = '/speaking'
      } else if (!roomAccess.canJoin && roomAccess.reason !== 'Room is not active') {
        // For authorization issues, let the hook handle it instead of redirecting here
        console.log('Room access issue (not ended):', roomAccess.reason)
      }
    } catch (error) {
      console.error('Error checking room status:', error)
      // Don't redirect on error - let the hook handle authorization
    }
  }

  // Update room presence using utils
  const updateRoomPresence = async () => {
    const userId = getCurrentUserId()
    if (!userId || !roomCode) return

    try {
      await updateParticipantOnlineStatus(roomCode, userId, true)
    } catch (error) {
      console.error('Failed to update room presence:', error)
    }
  }

  // Initialize Agora client
  const initializeAgoraClient = async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('Skipping Agora client initialization on server side')
      return null
    }
    
    try {
      // Use dynamic import with multiple fallback strategies
      let AgoraRTC
      
      try {
        // Try standard dynamic import
        const importedModule = await import('agora-rtc-sdk-ng')
        console.log('Imported AgoraRTC module:', importedModule)
        
        // Try different ways to access AgoraRTC
        AgoraRTC = importedModule.default || (importedModule as any).AgoraRTC || importedModule
        console.log('AgoraRTC resolved:', AgoraRTC)
        
        // If still no AgoraRTC, try to access properties directly
        if (!AgoraRTC && importedModule) {
          console.log('Module keys:', Object.keys(importedModule))
          // Try to find createClient in the module
          for (const key of Object.keys(importedModule)) {
            const value = (importedModule as any)[key]
            if (value && typeof value === 'object' && 'createClient' in value) {
              console.log(`Found AgoraRTC-like object in key: ${key}`)
              AgoraRTC = value
              break
            }
          }
        }
      } catch (importError) {
        console.warn('Standard dynamic import failed, trying alternative approach:', importError)
        
        // Fallback: try accessing from window if already loaded
        if (typeof window !== 'undefined' && (window as any).AgoraRTC) {
          AgoraRTC = (window as any).AgoraRTC
        } else {
          throw new Error('Could not load AgoraRTC SDK')
        }
      }
      
      // Verify that AgoraRTC is properly loaded
      if (!AgoraRTC || typeof AgoraRTC.createClient !== 'function') {
        throw new Error('AgoraRTC SDK not properly loaded - createClient method not found')
      }
      
      console.log('AgoraRTC SDK loaded successfully')
      
      const client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8'
      })

      // Set up event handlers
      client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
        console.log('Remote user joined:', user.uid)
        setConnectionState(prev => ({ ...prev, remoteUserJoined: true }))
        
        // Find participant by matching UID and mark them as connected
        const userIdStr = String(user.uid)
        allParticipants.forEach(participant => {
          const participantUid = parseInt(participant.id.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000)
          if (String(participantUid) === userIdStr) {
            setConnectedParticipants(prev => new Set([...prev, participant.id]))
          }
        })
      })

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        console.log('Remote user left:', user.uid)
        setConnectionState(prev => ({ ...prev, remoteUserJoined: false }))
        
        // Find participant by matching UID and mark them as disconnected
        const userIdStr = String(user.uid)
        allParticipants.forEach(participant => {
          const participantUid = parseInt(participant.id.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000)
          if (String(participantUid) === userIdStr) {
            setConnectedParticipants(prev => {
              const newSet = new Set(prev)
              newSet.delete(participant.id)
              return newSet
            })
          }
        })
      })

      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          await client.subscribe(user, mediaType)
          const remoteAudioTrack = user.audioTrack
          if (remoteAudioTrack) {
            remoteAudioTrack.play()
            console.log('Playing remote audio')
          }
        }
      })

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          console.log('Remote user unpublished audio')
        }
      })

      client.on('connection-state-change', (curState: any, revState: any) => {
        console.log('Connection state changed:', curState, 'from:', revState)
        setConnectionState(prev => ({ 
          ...prev, 
          isConnected: curState === 'CONNECTED',
          isConnecting: curState === 'CONNECTING'
        }))
      })

      client.on('network-quality', (stats: any) => {
        setConnectionState(prev => ({ 
          ...prev, 
          connectionQuality: stats.downlinkNetworkQuality
        }))
      })

      clientRef.current = client
      return client
    } catch (error) {
      console.error('Error initializing Agora client:', error)
      // Handle error but don't set roomError since it's managed by the hook
      return null
    }
  }

  // Join voice channel
  const joinVoiceChannel = async () => {
    const userId = getCurrentUserId()
    if (!clientRef.current || !userId || !roomCode) {
      console.error('Missing required components for voice channel join:', {
        hasClient: !!clientRef.current,
        userId,
        roomCode
      })
      return
    }

    // Check if already connected or connecting
    if (connectionState.isConnected || connectionState.isConnecting) {
      console.log('Already connected or connecting to voice channel')
      return
    }

    // Allow joining for new sessions or session restoration
    const isRestoredSession = (callStarted && sessionStartTime && !connectionState.isConnected) || isRestoringSession
    const isNewSession = !callStarted && !sessionStartTime
    
    if (!isNewSession && !isRestoredSession) {
      console.log('Call already started and connected, skipping join')
      return
    }

    try {
      console.log('🔗 Joining voice channel:', {
        isRestoredSession,
        isNewSession,
        callStarted,
        sessionStartTime: sessionStartTime ? new Date(sessionStartTime).toLocaleTimeString() : null,
        connectionState: connectionState.isConnected ? 'connected' : 'disconnected',
        clientState: clientRef.current?.connectionState
      })

      setConnectionState(prev => ({ ...prev, isConnecting: true }))

      // Ensure client is in proper state for joining
      if (clientRef.current.connectionState === 'CONNECTED') {
        console.log('Client already connected, leaving first')
        await clientRef.current.leave()
        // Wait a moment for the leave to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      } else if (clientRef.current.connectionState === 'CONNECTING') {
        console.log('Client is connecting, waiting for it to complete...')
        // Wait a bit for connection to complete or fail
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Double-check client state
      if (clientRef.current.connectionState === 'CONNECTED') {
        console.warn('Client still connected after leave attempt, forcing leave')
        try {
          await clientRef.current.leave()
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (e) {
          console.warn('Force leave failed, continuing anyway:', e)
        }
      }

      // Get Agora token using utility function
      const tokenData = await getAgoraToken(roomCode, userId)
      
      if (!tokenData) {
        throw new Error('Failed to get Agora token')
      }

      const { token, appId } = tokenData

      if (!appId) {
        throw new Error('Agora App ID not configured')
      }

      console.log('Agora connection - appId:', appId, 'roomCode:', roomCode)

      // Join channel with proper user ID (convert to number if needed)
      const uid = parseInt(userId.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000)
      await clientRef.current.join(appId, roomCode, token, uid)

      // Use dynamic import with multiple fallback strategies for audio track creation
      let AgoraRTC
      
      try {
        const importedModule = await import('agora-rtc-sdk-ng')
        console.log('Audio track - Imported AgoraRTC module:', importedModule)
        
        // Try different ways to access AgoraRTC for audio track creation
        AgoraRTC = importedModule.default || (importedModule as any).AgoraRTC || importedModule
        console.log('Audio track - AgoraRTC resolved:', AgoraRTC)
      } catch (importError) {
        console.warn('Audio track import failed, trying window fallback:', importError)
        if (typeof window !== 'undefined' && (window as any).AgoraRTC) {
          AgoraRTC = (window as any).AgoraRTC
        } else {
          throw new Error('Could not load AgoraRTC SDK for audio track creation')
        }
      }
      
      // Verify that AgoraRTC is properly loaded for audio track creation
      if (!AgoraRTC || typeof AgoraRTC.createMicrophoneAudioTrack !== 'function') {
        throw new Error('AgoraRTC SDK not properly loaded - createMicrophoneAudioTrack method not found')
      }

      // Create and publish local audio track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true, // Acoustic Echo Cancellation
        AGC: true, // Automatic Gain Control
        ANS: true  // Automatic Noise Suppression
      })

      await clientRef.current.publish([localAudioTrack])
      localAudioTrackRef.current = localAudioTrack

      // Apply restored mute state if the audio track was restored from localStorage
      if (audioState.isMuted && isRestoringSession) {
        console.log('🔇 Applying restored mute state to audio track')
        await localAudioTrack.setMuted(true)
      }

      setJoinAttempts(0) // Reset join attempts
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: true,
        isConnecting: false
      }))

      // Clear restoration flag when successfully connected
      setIsRestoringSession(false)
      
      // Add current user to connected participants
      const currentUserId = getCurrentUserId()
      if (currentUserId) {
        setConnectedParticipants(prev => new Set([...prev, currentUserId]))
      }

      // Only set callStarted and start timer if not already started (to preserve restored sessions)
      if (!callStarted) {
        setCallStarted(true)
        
        // Start session timer and save to localStorage only if no session exists
        if (!sessionStartTime) {
          const startTime = Date.now()
          console.log('🚀 Starting new session at:', new Date(startTime).toLocaleTimeString())
          setSessionStartTime(startTime)
          saveSessionToStorage(startTime)
        } else {
          console.log('📋 Session already restored from localStorage, start time:', new Date(sessionStartTime).toLocaleTimeString())
        }
      } else {
        console.log('📋 Call already started, preserving existing session')
      }

      console.log('Successfully joined voice channel')
    } catch (error) {
      console.error('Error joining voice channel:', error)
      let errorMessage = 'Failed to join voice call.'
      
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      if (errorMsg.includes('INVALID_OPERATION')) {
        errorMessage = 'Connection already in progress. Please wait...'
      } else if (errorMsg.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
        errorMessage = 'Voice service temporarily unavailable. Please try again.'
      } else if (errorMsg.includes('INVALID_VENDOR_KEY')) {
        errorMessage = 'Voice service configuration error.'
      } else if (errorMsg.includes('permission')) {
        errorMessage = 'Please allow microphone access and try again.'
      }
      
      console.error('Voice connection error:', errorMessage)
      setConnectionState(prev => ({ 
        ...prev, 
        isConnecting: false
      }))

      // If this was a session restoration attempt, reset the restoration state
      if (isRestoringSession) {
        console.warn('⚠️ Session restoration failed, resetting restoration state')
        setIsRestoringSession(false)
        // Also clear invalid session data from storage
        clearSessionFromStorage()
      }

      setJoinAttempts(prev => prev + 1)

      // Reset client if there was an error
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') {
        try {
          await clientRef.current.leave()
        } catch (leaveError) {
          console.error('Error leaving channel after failed join:', leaveError)
        }
      }

      // Auto-retry once after a short delay for certain errors
      if (joinAttempts < 1 && (errorMsg.includes('CAN_NOT_GET_GATEWAY_SERVER') || errorMsg.includes('INVALID_OPERATION'))) {
        console.log('Auto-retrying connection in 3 seconds...')
        setTimeout(() => {
          joinVoiceChannel()
        }, 3000)
      }
    }
  }

  // Leave voice channel
  const leaveVoiceChannel = async () => {
    try {
      console.log('Starting voice channel cleanup...')
      
      // Stop and close local audio track
      if (localAudioTrackRef.current) {
        try {
          // Get the underlying MediaStreamTrack and stop it
          const mediaStreamTrack = localAudioTrackRef.current.getMediaStreamTrack()
          if (mediaStreamTrack) {
            mediaStreamTrack.stop()
            console.log('Stopped underlying media stream track')
          }
          
          localAudioTrackRef.current.stop()
          localAudioTrackRef.current.close()
          console.log('Closed Agora audio track')
        } catch (trackError) {
          console.error('Error closing audio track:', trackError)
        }
        localAudioTrackRef.current = null
      }

      // Leave channel if connected
      if (clientRef.current) {
        try {
          if (clientRef.current.connectionState === 'CONNECTED' || 
              clientRef.current.connectionState === 'CONNECTING') {
            console.log('Leaving Agora channel...')
            await clientRef.current.leave()
          }
          
          // Remove all event listeners to prevent memory leaks
          clientRef.current.removeAllListeners()
          
          // Clear client reference
          clientRef.current = null
        } catch (clientError) {
          console.error('Error handling client cleanup:', clientError)
          // Force clear the client reference even if leave failed
          clientRef.current = null
        }
      }

      // Reset all states
      setCallStarted(false)
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        connectionQuality: null,
        remoteUserJoined: false
      })
      
      setAudioState({
        isMuted: false,
        isRemoteMuted: false,
        volume: 50,
        remoteVolume: 50
      })
      
      // Clear connected participants
      setConnectedParticipants(new Set())

      // Clear session from localStorage
      clearSessionFromStorage()

      console.log('Voice channel cleanup completed')
    } catch (error) {
      console.error('Error leaving voice channel:', error)
      // Force reset state even if leave failed
      setCallStarted(false)
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        connectionQuality: null,
        remoteUserJoined: false
      })
      
      setAudioState({
        isMuted: false,
        isRemoteMuted: false,
        volume: 50,
        remoteVolume: 50
      })

      // Force clear references
      localAudioTrackRef.current = null
      clientRef.current = null

      // Clear session from localStorage
      clearSessionFromStorage()
    }
  }

  // Toggle mute
  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      const newMutedState = !audioState.isMuted
      await localAudioTrackRef.current.setMuted(newMutedState)
      setAudioState(prev => ({ ...prev, isMuted: newMutedState }))
      
      // Update session storage with new mute state
      if (roomCode && sessionStartTime) {
        updateSessionInStorage()
      }
      
      console.log('🔇 Mute toggled:', newMutedState ? 'muted' : 'unmuted')
    }
  }

  // End call and leave room
  const endCall = async () => {
    const userId = getCurrentUserId()
    if (!userId || !roomCode || isEndingCall) return

    // Prevent multiple simultaneous calls to this function
    setIsEndingCall(true)

    console.log('Ending call - starting cleanup process for all participants...')

    try {
      // Leave voice channel first and ensure complete cleanup
      await leaveVoiceChannel()

      // Calculate session duration in minutes (minimum 1 minute for any session)
      const sessionDurationMinutes = Math.max(1, Math.floor(sessionDuration / 60))
      
      console.log('Ending call with session duration:', {
        sessionDurationSeconds: sessionDuration,
        sessionDurationMinutes,
        roomCode,
        userId
      })

      // Save room session data for analytics
      if (sessionStartTime) {
        await saveRoomSession(roomCode, userId, {
          duration: sessionDurationMinutes,
          joinedAt: new Date(sessionStartTime).toISOString(),
          leftAt: new Date().toISOString()
        })
      }

      // End room for ALL participants and update their presence status
      // This will:
      // 1. Set room status to 'ended'
      // 2. Mark all participants as left
      // 3. Update user_presence table to clear in_room, room_code, room_created_at for ALL participants
      const roomEndResult = await endRoomForAllParticipants(roomCode, userId, sessionDurationMinutes)
      
      if (!roomEndResult) {
        console.warn('Failed to end room via API, falling back to individual calls')
        // Fallback to individual calls if the comprehensive API call fails
        await updateRoomStatus(roomCode, 'ended')
        await removeParticipantFromRoom(roomCode, userId)
      } else {
        console.log('Successfully ended room for all participants')
      }

      // Clear timers
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current)
        backupTimeoutRef.current = null
      }

      // Clear session from localStorage
      clearSessionFromStorage()

      console.log('Call ended successfully for all participants, redirecting...')
      
      // Navigate back to speaking page immediately with force refresh
      // Use window.location instead of router to ensure complete page reload
      // and prevent any stale state from persisting
      window.location.href = '/speaking'
    } catch (error) {
      console.error('Error ending call:', error)
      
      // Force cleanup even if API call failed
      await leaveVoiceChannel()

      // Try fallback cleanup for current user at least
      try {
        await updateRoomStatus(roomCode, 'ended')
        await removeParticipantFromRoom(roomCode, userId)
      } catch (fallbackError) {
        console.error('Fallback cleanup also failed:', fallbackError)
      }

      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      
      clearSessionFromStorage()
      
      // Force redirect with page reload to ensure complete cleanup
      window.location.href = '/speaking'
    } finally {
      // Reset the flag in case of any issues
      setIsEndingCall(false)
    }
  }

  // End call due to 13-minute time limit
  const endCallDueToTimeLimit = async () => {
    const userId = getCurrentUserId()
    if (!userId || !roomCode || isEndingCall) return

    // Prevent multiple simultaneous calls to this function
    setIsEndingCall(true)

    console.log('Auto-ending call due to 13-minute time limit')
    setSessionTimeUp(true)

    try {
      // Leave voice channel first and ensure complete cleanup
      await leaveVoiceChannel()

      // Calculate session duration in minutes - ALWAYS cap at 13 minutes for time limit endings
      const sessionDurationMinutes = 13 // Fixed at 13 minutes for time limit endings
      
        console.log('Auto-ending call with session duration:', {
          sessionDurationSeconds: sessionDuration,
          sessionDurationMinutes,
          roomCode,
          userId,
          note: 'Duration capped at 13 minutes for time limit ending'
        })      // Save room session data for analytics
      if (sessionStartTime) {
        await saveRoomSession(roomCode, userId, {
          duration: sessionDurationMinutes,
          joinedAt: new Date(sessionStartTime).toISOString(),
          leftAt: new Date().toISOString()
        })
      }

      // End room for ALL participants and update their presence status
      const roomEndResult = await endRoomForAllParticipants(roomCode, userId, sessionDurationMinutes)
      
      if (!roomEndResult) {
        console.warn('Failed to end room via API, falling back to individual calls')
        // Fallback to individual calls if the comprehensive API call fails
        await updateRoomStatus(roomCode, 'ended')
        await removeParticipantFromRoom(roomCode, userId)
      } else {
        console.log('Successfully ended room for all participants due to time limit')
      }

      // Clear timers
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current)
        backupTimeoutRef.current = null
      }

      // Clear session from localStorage
      clearSessionFromStorage()

      console.log('Call auto-ended successfully due to time limit')
      
      // Show time up message for 3 seconds, then redirect
      setTimeout(() => {
        window.location.href = '/speaking'
      }, 3000)
    } catch (error) {
      console.error('Error auto-ending call due to time limit:', error)
      
      // Force cleanup even if API call failed
      await leaveVoiceChannel()

      // Try fallback cleanup for current user at least
      try {
        await updateRoomStatus(roomCode, 'ended')
        await removeParticipantFromRoom(roomCode, userId)
      } catch (fallbackError) {
        console.error('Fallback cleanup also failed:', fallbackError)
      }
      
      // Clear all timers
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      
      clearSessionFromStorage()
      
      // Force redirect with page reload even on error
      setTimeout(() => {
        window.location.href = '/speaking'
      }, 3000)
    } finally {
      // Reset the flag in case of any issues
      setIsEndingCall(false)
    }
  }

  // Handle time warnings - now handled inline in the timer for 13-minute sessions

  // Handle like/unlike functionality using the hook
  const handleParticipantLike = async (participantId: string) => {
    await toggleParticipantLike(participantId)
  }

  // Handle end call confirmation
  const handleEndCallClick = () => {
    setShowEndCallConfirm(true)
  }

  const confirmEndCall = () => {
    setShowEndCallConfirm(false)
    endCall()
  }

  const cancelEndCall = () => {
    setShowEndCallConfirm(false)
  }

  // Initialize session timer from localStorage
  useEffect(() => {
    if (roomCode) {
      const storageKey = `speaking_session_${roomCode}`
      const storedSession = localStorage.getItem(storageKey)
      
      console.log('🔍 Checking for stored session:', { 
        roomCode, 
        storageKey, 
        hasStoredSession: !!storedSession,
        storedSession 
      })
      
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession)
          const startTime = new Date(sessionData.startTime).getTime()
          const currentTime = Date.now()
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
          
          console.log('📊 Session data analysis:', {
            sessionData,
            startTime: new Date(startTime).toISOString(),
            currentTime: new Date(currentTime).toISOString(),
            elapsedSeconds,
            isValid: elapsedSeconds > 0
          })
          
          // Only restore sessions that are less than 1 hour old and have positive elapsed time
          const maxSessionAge = 1 * 60 * 60 // 1 hour in seconds (reasonable for testing)
          
          if (elapsedSeconds > 0 && elapsedSeconds < maxSessionAge) {
            console.log(`✅ Restoring session from localStorage: ${elapsedSeconds} seconds elapsed`)
            // Set all session state atomically to prevent race conditions
            setSessionStartTime(startTime)
            setCallStarted(true)
            setIsRestoringSession(true) // Mark as restoring session
            
            // Restore audio state if available
            if (sessionData.audioState) {
              console.log('🔊 Restoring audio state:', sessionData.audioState)
              setAudioState(prevState => ({
                ...prevState,
                isMuted: sessionData.audioState.isMuted || false,
                volume: sessionData.audioState.volume || 50
              }))
            }
            
            // Don't set sessionDuration here - let the timer effect handle it to avoid conflicts
            console.log(`✅ Session restored: start time: ${new Date(startTime).toLocaleTimeString()}`)
            
            // Add a timeout to prevent hanging restoration
            const restorationTimeout = setTimeout(() => {
              if (isRestoringSession && !connectionState.isConnected) {
                console.warn('⏰ Session restoration timeout, resetting state')
                setIsRestoringSession(false)
                clearSessionFromStorage()
              }
            }, 15000) // 15 second timeout
            
            return () => clearTimeout(restorationTimeout)
          } else if (elapsedSeconds >= maxSessionAge) {
            console.log('⚠️ Session too old, clearing stale data')
            localStorage.removeItem(storageKey)
          } else {
            console.log('❌ Invalid session data, clearing')
            localStorage.removeItem(storageKey)
          }
        } catch (error) {
          console.error('❌ Error parsing stored session data:', error)
          localStorage.removeItem(storageKey)
        }
      } else {
        console.log('ℹ️ No stored session found for room:', roomCode)
      }
    }
  }, [roomCode])

  // Save session data to localStorage when call starts
  const saveSessionToStorage = (startTime: number) => {
    if (roomCode) {
      const storageKey = `speaking_session_${roomCode}`
      const sessionData = {
        startTime: new Date(startTime).toISOString(),
        roomCode,
        userId: getCurrentUserId(), // Use the current user ID function instead of just firebaseUser
        audioState: {
          isMuted: audioState.isMuted,
          volume: audioState.volume
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(sessionData))
      console.log('💾 Session saved to localStorage:', sessionData)
    }
  }

  // Clear session from localStorage
  const clearSessionFromStorage = () => {
    if (roomCode) {
      const storageKey = `speaking_session_${roomCode}`
      localStorage.removeItem(storageKey)
      console.log('🗑️ Session cleared from localStorage for room:', roomCode)
    }
  }

  // Update session data in localStorage periodically
  const updateSessionInStorage = () => {
    if (roomCode && sessionStartTime) {
      const storageKey = `speaking_session_${roomCode}`
      const sessionData = {
        startTime: new Date(sessionStartTime).toISOString(),
        roomCode,
        userId: getCurrentUserId(),
        lastUpdated: new Date().toISOString(),
        audioState: {
          isMuted: audioState.isMuted,
          volume: audioState.volume
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(sessionData))
    }
  }

  // Early authorization check - verify user has an active room
  useEffect(() => {
    const checkUserHasActiveRoom = async () => {
      const userId = getCurrentUserId()
      if (userId && roomCode && isAuthorized !== null) {
        try {
          // Only check if user is already authorized by the hook
          // This prevents redirect loops when the hook is still determining authorization
          if (isAuthorized === false) {
            console.log('User not authorized for this room')
            return
          }
          
          const activeRoom = await getUserActiveRoom(userId)
          
          // If user has an active room and it's not this room, redirect to correct room
          if (activeRoom && activeRoom.room_code !== roomCode) {
            console.log('User is in a different room, redirecting to:', activeRoom.room_code)
            router.push(`/speaking/room/${activeRoom.room_code}`)
            return
          }
        } catch (error) {
          console.error('Error checking user active room:', error)
          // Don't block access on error - let the hook handle authorization
        }
      }
    }

    // Only run this check after the hook has finished initial authorization
    if (!isLoading && isAuthorized !== null) {
      checkUserHasActiveRoom()
    }
  }, [session, roomCode, router, isAuthorized, isLoading])

  // Room status monitoring is now handled by Supabase realtime subscriptions in useSpeakingRoom hook
  useEffect(() => {
    // The room status and participant changes are automatically monitored via 
    // realtime subscriptions in the useSpeakingRoom hook - no polling needed
    console.log('Room monitoring: Using realtime subscriptions for room status updates')
  }, [roomData, session, roomCode, isAuthorized])

  // Get current user ID (either from Firebase or userProfile)
  const currentUserId = getCurrentUserId()

  // Add beforeunload event listener for cleanup
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('Page unloading, performing emergency cleanup...')
      
      // Perform immediate synchronous cleanup
      if (localAudioTrackRef.current) {
        try {
          const mediaStreamTrack = localAudioTrackRef.current.getMediaStreamTrack()
          if (mediaStreamTrack) {
            mediaStreamTrack.stop()
          }
          localAudioTrackRef.current.stop()
          localAudioTrackRef.current.close()
        } catch (error) {
          console.error('Error in beforeunload cleanup:', error)
        }
        localAudioTrackRef.current = null
      }
      
      if (clientRef.current) {
        try {
          if (clientRef.current.connectionState === 'CONNECTED') {
            // Note: leave() is async but we can't await in beforeunload
            clientRef.current.leave()
          }
          clientRef.current.removeAllListeners()
          clientRef.current = null
        } catch (error) {
          console.error('Error cleaning up client in beforeunload:', error)
        }
      }
      
      // Don't clear session storage on page unload - preserve it for potential reload
      // Only clear session storage when explicitly ending the call
      console.log('🔄 Preserving session data for potential page reload')
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Initialize component
  useEffect(() => {
    console.log('Room page: Initialize effect triggered:', { 
      currentUserId, 
      roomCode, 
      isPending, 
      hasSession: !!session?.user,
      isLoading 
    })

    if (currentUserId && roomCode) {
      console.log('Room page: User authenticated, initializing...')
      
      // Initialize Agora client asynchronously with retry logic
      const initWithRetry = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const client = await initializeAgoraClient()
            if (client) {
              console.log('✅ Agora client initialized successfully')
              
              // Update room presence after successful client initialization
              await updateRoomPresence()
              
              return client
            } else {
              console.warn(`Agora client initialization returned null (attempt ${i + 1}/${maxRetries})`)
            }
          } catch (error) {
            console.error(`Agora client initialization failed (attempt ${i + 1}/${maxRetries}):`, error)
            if (i === maxRetries - 1) {
              console.error('All Agora client initialization attempts failed')
            } else {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
            }
          }
        }
        return null
      }
      
      // Initialize client and handle session restoration
      initWithRetry()
    } else if (!isPending && !currentUserId && !isLoading) {
      // User is not authenticated and session loading is complete, redirect to login
      console.log('Room page: User not authenticated, redirecting to login')
      router.push('/login')
    } else {
      console.log('Room page: Waiting for authentication or room data...')
    }

    return () => {
      console.log('Component unmounting - performing complete cleanup...')
      
      // Clear all timers
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current)
        backupTimeoutRef.current = null
      }
      
      // Force cleanup of Agora resources
      const cleanup = async () => {
        try {
          // Stop and close local audio track
          if (localAudioTrackRef.current) {
            try {
              const mediaStreamTrack = localAudioTrackRef.current.getMediaStreamTrack()
              if (mediaStreamTrack) {
                mediaStreamTrack.stop()
              }
              localAudioTrackRef.current.stop()
              localAudioTrackRef.current.close()
            } catch (trackError) {
              console.error('Error cleaning up audio track on unmount:', trackError)
            }
            localAudioTrackRef.current = null
          }

          // Clean up Agora client
          if (clientRef.current) {
            try {
              if (clientRef.current.connectionState === 'CONNECTED' || 
                  clientRef.current.connectionState === 'CONNECTING') {
                await clientRef.current.leave()
              }
              
              // Remove all event listeners
              clientRef.current.removeAllListeners()
            } catch (clientError) {
              console.error('Error cleaning up Agora client on unmount:', clientError)
            }
            clientRef.current = null
          }
        } catch (error) {
          console.error('Error during component cleanup:', error)
        }
      }
      
      // Perform cleanup
      cleanup()
      
      // Don't clear session storage on component unmount - preserve it for page reloads
      // Session storage will only be cleared when explicitly ending the call
      console.log('🔄 Component cleanup completed, preserving session data')
    }
  }, [currentUserId, roomCode, isPending, session, isLoading, router])

  // Start session timer - 13-minute time limit implementation
  useEffect(() => {
    console.log('🕒 Timer effect triggered:', { callStarted, sessionStartTime })
    
    // Clear any existing timer first to prevent duplicates
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
    
    if (callStarted && sessionStartTime) {
      console.log('🕒 Starting session timer with start time:', new Date(sessionStartTime).toLocaleTimeString())
      
      let hasShown3MinWarning = false
      let hasShown1MinWarning = false
      
      // Update duration immediately based on current time and session start time
      const updateDuration = () => {
        const currentTime = Date.now()
        const elapsedSeconds = Math.floor((currentTime - sessionStartTime) / 1000)
        
        // Only log every 10 seconds to reduce console spam
        if (elapsedSeconds % 10 === 0) {
          console.log('⏱️ Timer updating duration:', { 
            currentTime: new Date(currentTime).toISOString(),
            sessionStartTime: new Date(sessionStartTime).toISOString(),
            elapsedSeconds,
            remainingMinutes: Math.ceil(Math.max(0, (13 * 60) - elapsedSeconds) / 60)
          })
        }
        
        setSessionDuration(elapsedSeconds)
        
        // Check for 13-minute (780 seconds) time limit
        const maxSessionSeconds = 13 * 60 // 13 minutes = 780 seconds
        const remainingSeconds = maxSessionSeconds - elapsedSeconds
        const remainingMinutes = Math.ceil(remainingSeconds / 60)
        
        // Show warnings (adjusted for 13-minute session)
        if (remainingSeconds <= 180 && remainingSeconds > 120 && !hasShown3MinWarning) {
          hasShown3MinWarning = true
          console.log('⚠️ Showing 3-minute warning')
          setTimeWarningMessage('3 minutes remaining in this session')
          setTimeWarningType('warning')
          setShowTimeWarning(true)
          
          // Auto-hide warning after 3 seconds
          setTimeout(() => {
            setShowTimeWarning(false)
          }, 3000)
        } else if (remainingSeconds <= 60 && remainingSeconds > 30 && !hasShown1MinWarning) {
          hasShown1MinWarning = true
          console.log('🚨 Showing 1-minute warning')
          setTimeWarningMessage('1 minute remaining - session will end soon')
          setTimeWarningType('critical')
          setShowTimeWarning(true)
          
          // Auto-hide warning after 3 seconds
          setTimeout(() => {
            setShowTimeWarning(false)
          }, 3000)
        }
        
        // Auto-end call when 13 minutes is reached
        if (elapsedSeconds >= maxSessionSeconds) {
          console.log('🚨 13-minute time limit reached, auto-ending call')
          
          // Clear the timer immediately to prevent further updates
          if (sessionTimerRef.current) {
            clearInterval(sessionTimerRef.current)
            sessionTimerRef.current = null
          }
          
          // Set the session duration to exactly 13 minutes to prevent any overage
          setSessionDuration(maxSessionSeconds)
          
          // Call the end function
          endCallDueToTimeLimit()
          return true // Indicate that we're ending
        }
        
        return false // Indicate normal operation
      }
      
      // Update immediately to sync duration with current time
      const isEnding = updateDuration()
      if (isEnding) {
        console.log('⏱️ Session ending immediately due to time limit')
        return
      }
      console.log('⏱️ Timer initialized successfully')
      
      // Set a backup timeout for exactly 13 minutes as a failsafe
      const backupTimeoutMs = 13 * 60 * 1000 // 13 minutes in milliseconds
      backupTimeoutRef.current = setTimeout(() => {
        console.log('🚨 Backup timeout triggered - forcing call end at 13 minutes')
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current)
          sessionTimerRef.current = null
        }
        setSessionDuration(13 * 60) // Set to exactly 13 minutes
        endCallDueToTimeLimit()
      }, backupTimeoutMs)
      
      console.log('⏱️ Backup timeout set for 13 minutes from session start')
      
      // Start the interval timer for live updates
      sessionTimerRef.current = setInterval(() => {
        const shouldEnd = updateDuration()
        
        // If updateDuration returns true, it means we're ending - stop the timer
        if (shouldEnd) {
          if (sessionTimerRef.current) {
            clearInterval(sessionTimerRef.current)
            sessionTimerRef.current = null
          }
          return
        }
        
        // Update localStorage every 10 seconds to persist session data
        const currentDuration = Math.floor((Date.now() - sessionStartTime) / 1000)
        if (currentDuration % 10 === 0) {
          updateSessionInStorage()
        }
      }, 1000)
      
      console.log('⏱️ Timer interval started successfully with 13-minute limit')
    } else {
      console.log('🕒 Timer effect: conditions not met, clearing timer')
    }

    // Cleanup function
    return () => {
      if (sessionTimerRef.current) {
        console.log('🕒 Cleaning up timer interval')
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      if (backupTimeoutRef.current) {
        console.log('🕒 Cleaning up backup timeout')
        clearTimeout(backupTimeoutRef.current)
        backupTimeoutRef.current = null
      }
    }
  }, [callStarted, sessionStartTime]) // Dependencies: only restart when these change

  // Safety mechanism: detect and fix stuck timers
  useEffect(() => {
    if (!callStarted || !sessionStartTime) return

    let lastDuration = sessionDuration
    const checkTimerHealth = setInterval(() => {
      // If duration hasn't changed in 3 seconds and call is active, restart timer
      if (sessionDuration === lastDuration && callStarted && sessionStartTime) {
        const expectedDuration = Math.floor((Date.now() - sessionStartTime) / 1000)
        const durationDifference = Math.abs(expectedDuration - sessionDuration)
        
        // If there's more than 2 seconds difference, timer is stuck
        if (durationDifference > 2) {
          console.warn('🚨 Timer appears stuck, restarting...', {
            sessionDuration,
            expectedDuration,
            durationDifference
          })
          
          // Force update duration to current time
          setSessionDuration(expectedDuration)
        }
      }
      lastDuration = sessionDuration
    }, 3000) // Check every 3 seconds

    return () => clearInterval(checkTimerHealth)
  }, [callStarted, sessionStartTime, sessionDuration])

  // Auto-join voice channel when room data is loaded or when session is restored
  useEffect(() => {
    // Only proceed if we have all required components
    if (!roomData || !clientRef.current || !getCurrentUserId()) {
      console.log('⏳ Auto-join: Waiting for prerequisites...', {
        hasRoomData: !!roomData,
        hasClient: !!clientRef.current,
        hasUserId: !!getCurrentUserId()
      })
      return
    }

    // Don't join if already connected or connecting
    if (connectionState.isConnected || connectionState.isConnecting) {
      console.log('⏭️ Auto-join: Already connected or connecting')
      return
    }

    // Determine if we should join
    const shouldJoinNewSession = !callStarted && !sessionStartTime
    const shouldRestoreSession = callStarted && sessionStartTime && !connectionState.isConnected
    const shouldJoin = shouldJoinNewSession || shouldRestoreSession

    if (shouldJoin) {
      const reason = shouldJoinNewSession ? 'new-session' : 'restored-session'
      console.log('🔄 Auto-joining voice channel:', {
        hasRoomData: !!roomData,
        hasClient: !!clientRef.current,
        callStarted,
        sessionStartTime: sessionStartTime ? new Date(sessionStartTime).toLocaleTimeString() : null,
        isRestoringSession,
        isConnecting: connectionState.isConnecting,
        isConnected: connectionState.isConnected,
        reason
      })

      // Add a slight delay to ensure Agora client is fully ready
      const timer = setTimeout(async () => {
        try {
          await joinVoiceChannel()
        } catch (error) {
          console.error('Auto-join failed:', error)
          // Reset restoration flag on failure
          if (isRestoringSession) {
            setIsRestoringSession(false)
          }
        }
      }, 500) // Reduced delay but still enough for client readiness

      return () => clearTimeout(timer)
    }
  }, [roomData, clientRef.current, callStarted, sessionStartTime, isRestoringSession, connectionState.isConnecting, connectionState.isConnected])



  if (isLoading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading room...</p>
            </CardContent>
          </Card>
        </div>
    )
  }

  // Handle authentication state
  if (isPending) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </CardContent>
          </Card>
        </div>
    )
  }

  // If not authenticated, redirect to login
  if (!session?.user) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">
                Please log in to access speaking rooms.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
    )
  }

  // If Agora client is being initialized
  if (!clientRef.current && !roomError) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Joining Room...</h3>
              <p className="text-gray-600">Setting up your voice connection</p>
            </CardContent>
          </Card>
        </div>
    )
  }

  // Session time up screen (13 minutes completed)
  if (sessionTimeUp) {
    return (

        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-orange-500 mb-4">
                <Clock className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Session Complete</h3>
              <p className="text-gray-600 mb-4">
                Your 13-minute speaking session has ended. Your progress has been saved automatically.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Session Duration: {formatDuration(sessionDuration)}
              </div>
              <div className="animate-pulse text-sm text-gray-500">Redirecting to speaking page...</div>
            </CardContent>
          </Card>
        </div>

    )
  }

  if (partnerLeft) {
    return (

        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-orange-500 mb-4">
                <MessageSquare className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Partner Left</h3>
              <p className="text-gray-600 mb-4">Your speaking partner has ended the session. You will be redirected shortly.</p>
              <div className="animate-pulse text-sm text-gray-500">Redirecting to speaking page...</div>
            </CardContent>
          </Card>
        </div>

    )
  }

  // Show unauthorized access screen
  if (isAuthorized === false) {
    return (

        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">
                {roomError || 'You are not authorized to access this room. Only room participants can join.'}
              </p>
              <Button onClick={() => router.push('/speaking')} className="w-full">
                Back to Speaking
              </Button>
            </CardContent>
          </Card>
        </div>

    )
  }

  if (error || !roomData) {
    return (

        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <MessageSquare className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{roomError || 'Room not found'}</h3>
              <Button onClick={() => router.push('/speaking')} className="w-full">
                Back to Speaking
              </Button>
            </CardContent>
          </Card>
        </div>

    )
  }

  const partner = getPartnerInfo()
  const currentUser = getCurrentUserInfo()

  // Only render main content if user is authorized
  if (isAuthorized !== true) {
    return null // This will show loading, unauthorized, or error screens handled above
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="font-semibold text-gray-900 text-sm sm:text-base hidden sm:inline">Voice Chat Room</span>
                <span className="font-semibold text-gray-900 text-sm sm:hidden">Room</span>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                #{roomCode}
              </Badge>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                {connectionState.isConnected ? (
                  <Signal className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                ) : connectionState.isConnecting ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                )}
                <span className="text-xs sm:text-sm text-gray-700 hidden sm:inline">
                  {connectionState.isConnected ? 'Connected' : 
                   connectionState.isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              
              {callStarted && (
                <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="text-xs sm:text-sm font-mono text-gray-900">
                    {formatRemainingTime(sessionDuration)} left
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Participants Section */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              
              {/* Participants Summary */}
              <Card className="bg-gradient-to-r gap-0 m-0 p-0 mb-2 from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <CardContent className="p-2 sm:p-2 ">
                  <div className="flex items-center justify-between ">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {allParticipants.length} Participants in Room
                        </h3>
                        <p className="text-sm text-gray-600">
                          {allParticipants.filter(p => p.is_online).length} online • 
                          {allParticipants.filter(p => roomData?.user1_id === p.id || roomData?.user2_id === p.id).length} original • 
                          {allParticipants.filter(p => !(roomData?.user1_id === p.id || roomData?.user2_id === p.id)).length} invited
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        Room #{roomCode}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {callStarted ? 'Session Active' : 'Starting Soon'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              
              {/* Time Warning Notification */}
              {showTimeWarning && (
                <Card className={`mb-4 border ${
                  timeWarningType === 'critical' 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-orange-300 bg-orange-50'
                }`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className={`h-5 w-5 ${
                          timeWarningType === 'critical' ? 'text-red-600' : 'text-orange-600'
                        }`} />
                        <span className={`font-medium ${
                          timeWarningType === 'critical' ? 'text-red-800' : 'text-orange-800'
                        }`}>
                          {timeWarningMessage}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowTimeWarning(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Participants Grid - Dynamic Layout for All Participants */}
              {allParticipants.length > 3 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 text-center">
                    <Users className="h-4 w-4 inline mr-1" />
                    {allParticipants.length} participants in room - scroll to see all
                  </p>
                </div>
              )}
              <div className={`grid gap-4 sm:gap-6 ${
                allParticipants.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
                allParticipants.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              } ${allParticipants.length > 6 ? 'max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                
                {/* Current User Card */}
                {(() => {
                  const currentUserParticipant = allParticipants.find(p => p.id === getCurrentUserId())
                  if (!currentUserParticipant) return null
                  
                  const isOriginalUser = roomData?.user1_id === currentUserParticipant.id || roomData?.user2_id === currentUserParticipant.id
                  
                  return (
                    <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                      <CardHeader className="bg-blue-50 border-b border-blue-100 p-3 sm:p-4">
                        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            <span className="text-gray-900">You</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              {isOriginalUser ? 'Host' : 'Guest'}
                            </Badge>
                            <Button
                              onClick={handleEndCallClick}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1"
                            >
                              End Call
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                          <div className="relative">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl sm:text-2xl font-bold border-2 border-blue-200">
                              {currentUserParticipant.first_name?.charAt(0) || 'U'}
                            </div>
                            {/* Microphone Status Indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white border-2 border-white ${
                              audioState.isMuted ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              {audioState.isMuted ? <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Mic className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              {currentUserParticipant.first_name} {currentUserParticipant.last_name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 capitalize">
                              {currentUserParticipant.gender || 'Not specified'}
                            </p>
                            <div className="mt-2">
                              <Badge variant={audioState.isMuted ? "destructive" : "default"} className="text-xs">
                                {audioState.isMuted ? 'Muted' : 'Speaking'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* All Other Participants Cards */}
                {allParticipants
                  .filter(participant => participant.id !== getCurrentUserId())
                  .map((participant, index) => {
                    const isOriginalUser = roomData?.user1_id === participant.id || roomData?.user2_id === participant.id
                    const isConnectedToVoice = connectedParticipants.has(participant.id)
                    const isOnline = participant.is_online
                    
                    return (
                      <Card key={participant.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className={`border-b p-3 sm:p-4 ${
                          isOriginalUser ? 'bg-green-50 border-green-100' : 'bg-purple-50 border-purple-100'
                        }`}>
                          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              {isOriginalUser ? (
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                              ) : (
                                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                              )}
                              <span className="text-gray-900">
                                {isOriginalUser ? 'Partner' : 'Invited'}
                              </span>
                            </div>
                            <Badge className={`text-xs ${
                              participant.is_online
                                ? isOriginalUser 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {participant.is_online ? 'Online' : 'Offline'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                            <div className="relative">
                              <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold border-2 ${
                                isOriginalUser 
                                  ? 'bg-green-100 text-green-600 border-green-200'
                                  : 'bg-purple-100 text-purple-600 border-purple-200'
                              }`}>
                                {participant.first_name?.charAt(0) || 'P'}
                              </div>
                              {/* Connection/Gender Status Indicator */}
                              <div className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white border-2 border-white ${
                                participant.is_online ? 'bg-green-500' : 'bg-gray-500'
                              }`}>
                                {participant.gender === 'female' ? (
                                  <UserCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                ) : participant.gender === 'male' ? (
                                  <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                ) : (
                                  <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                )}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                {participant.first_name} {participant.last_name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 capitalize">
                                {participant.gender || 'Not specified'}
                              </p>
                              <div className="mt-2 flex flex-col items-center space-y-2">
                                <Badge 
                                  variant={
                                    isConnectedToVoice ? "default" : 
                                    isOnline ? "secondary" : "outline"
                                  } 
                                  className={`text-xs ${
                                    isConnectedToVoice ? 'bg-green-100 text-green-800' :
                                    isOnline ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {isConnectedToVoice ? 'Speaking' : 
                                   isOnline ? 'Online' : 'Offline'}
                                   

                                </Badge>
                             

                                {/* Like Button and Count */}
                                <div className="flex items-center space-x-2">
                                  {/* Likes Count */}
                                  <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                                    <Heart className="h-3 w-3 text-pink-600 fill-current" />
                                    <span className="text-xs text-pink-700 font-medium">
                                      {participantLikes[participant.id]?.likesCount || 0}
                                    </span>
                                  </div>
                                  
                                  {/* Like Button */}
                                  {participantLikes[participant.id]?.hasLiked ? (
                                    <div className="flex items-center space-x-1 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full px-2 py-1 shadow-md">
                                      <Heart className="h-3 w-3 fill-current" />
                                      <span className="font-semibold text-xs">Liked!</span>
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() => toggleParticipantLike(participant.id)}
                                      disabled={participantLikes[participant.id]?.isLoading}
                                      size="sm"
                                      className="
                                        bg-white hover:bg-pink-50 text-gray-700 border border-pink-300 hover:border-pink-400 shadow-sm
                                        rounded-full px-2 py-1 font-medium text-xs transition-all duration-200 transform hover:scale-105
                                      "
                                    >
                                      {participantLikes[participant.id]?.isLoading ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                      ) : (
                                        <div className="flex items-center space-x-1">
                                          <Heart className="h-3 w-3 text-pink-500" />
                                          <span>Like</span>
                                        </div>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {/* Show join time for invited participants */}
                              {!isOriginalUser && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Joined {new Date(participant.joined_at).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                {/* Add placeholder cards when no participants are loaded yet */}
                {allParticipants.length === 0 && (
                  <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-100 p-3 sm:p-4">
                      <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          <span className="text-gray-600">Finding Participants...</span>
                        </div>
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          Loading
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-6 sm:py-8">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
                          <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-600">Loading...</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Finding other participants</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Conversation Tips - Desktop Only */}
              <Card className="bg-white border border-gray-200 shadow-sm hidden lg:block">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-gray-900 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Conversation Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="font-semibold text-blue-600 text-sm sm:text-base">Speaking Practice</h4>
                      <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                        <li>• Speak clearly and confidently</li>
                        <li>• Take turns in conversation</li>
                        <li>• Ask open-ended questions</li>
                        <li>• Practice as long as you need</li>
                      </ul>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="font-semibold text-blue-600 text-sm sm:text-base">Session Guidelines</h4>
                      <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                        <li>• No time limits - talk as long as you want</li>
                        <li>• Use headphones for better audio</li>
                        <li>• Find a quiet environment</li>
                        <li>• Practice natural conversation</li>
                        <li>• Like participants for great conversations!</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Voice Controls */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-gray-900 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Voice Controls</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                  
                  {/* Error Display */}
                  {roomError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-red-700 mb-2">{roomError}</p>
                          <Button
                            onClick={() => fetchRoomData()}
                            variant="outline"
                            size="sm"
                            className="text-red-700 border-red-200 hover:bg-red-100 text-xs px-2 py-1"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Join/Microphone Control */}
                  {!callStarted && !connectionState.isConnecting ? (
                    <Button
                      onClick={joinVoiceChannel}
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base"
                    >
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      Join Voice Call
                    </Button>
                  ) : connectionState.isConnecting ? (
                    <Button
                      disabled
                      size="lg"
                      className="w-full bg-gray-400 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base"
                    >
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                      Connecting...
                    </Button>
                  ) : (
                    <Button
                      onClick={toggleMute}
                      size="lg"
                      className={`w-full font-semibold py-2 sm:py-3 text-sm sm:text-base ${
                        audioState.isMuted 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {audioState.isMuted ? (
                        <>
                          <MicOff className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                          Mute
                        </>
                      )}
                    </Button>
                  )}

                  {/* End Call Button */}
                  <Button
                    onClick={handleEndCallClick}
                    variant="destructive"
                    size="lg"
                    className="text-white w-full bg-red-600 hover:bg-red-700 font-semibold py-2 sm:py-3 text-sm sm:text-base"
                  >
                    <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    End Call
                  </Button>
                </CardContent>
              </Card>

              {/* Practice Features */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                  {/* Practice with Cue Card Button */}
                  <Button
                    onClick={() => setShowSpeakingAIPopup(true)}
                    variant="outline"
                    size="lg"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 font-semibold py-2 sm:py-3 text-sm sm:text-base transition-all duration-200 hover:border-purple-300"
                  >
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    Practice with Cue Card
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Practice IELTS speaking topics with AI guidance
                  </div>
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-gray-900 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Session Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xs text-gray-600 mb-1">Time Remaining</div>
                    <div className="font-mono text-xl sm:text-2xl font-bold text-blue-600">
                      {formatRemainingTime(sessionDuration)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">13-minute session limit</div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xs text-gray-600 mb-1">Session Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(100, (sessionDuration / (13 * 60)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.floor((sessionDuration / (13 * 60)) * 100)}% complete
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Room:</span>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        #{roomCode}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                      <Badge className={`text-xs ${
                        callStarted ? 
                          (isRestoringSession ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700") : 
                          "bg-gray-100 text-gray-600"
                      }`}>
                        {callStarted ? 
                          (isRestoringSession ? "Restoring..." : "Active") : 
                          "Starting"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Connection:</span>
                      <div className="flex items-center space-x-1">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          connectionState.isConnected ? 'bg-green-500' : 
                          connectionState.isConnecting ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-700">
                          {connectionState.isConnected ? 'Connected' : 
                           connectionState.isConnecting ? 'Connecting...' : 'Disconnected'}
                        </span>
                      </div>
                    </div>

                    {connectionState.remoteUserJoined && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Partner:</span>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Ready
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Tips - Mobile Only */}
              <Card className="bg-white border border-gray-200 shadow-sm lg:hidden">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-gray-900 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Conversation Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-600 text-sm">Speaking Practice</h4>
                      <ul className="space-y-1 text-xs text-gray-700">
                        <li>• Speak clearly and confidently</li>
                        <li>• Take turns in conversation</li>
                        <li>• Ask open-ended questions</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-600 text-sm">Session Guidelines</h4>
                      <ul className="space-y-1 text-xs text-gray-700">
                        <li>• No time limits - talk as long as you want</li>
                        <li>• Use headphones for better audio</li>
                        <li>• Like your partner for great sessions!</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

   

        {/* End Call Confirmation Dialog */}
        {showEndCallConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-gray-900 flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
                  <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  <span>End Call</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <p className="text-gray-700 text-sm sm:text-base">
                  Are you sure you want to end the call? This will disconnect all participants from the session.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={confirmEndCall}
                    variant="destructive"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base py-2 sm:py-3"
                  >
                    <PhoneOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Yes, End Call
                  </Button>
                  <Button
                    onClick={cancelEndCall}
                    variant="outline"
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm sm:text-base py-2 sm:py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Custom CSS for slider and scrollbars */}
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #2563eb;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #2563eb;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 3px;
          }
          .scrollbar-track-gray-100::-webkit-scrollbar-track {
            background-color: #f3f4f6;
            border-radius: 3px;
          }
          .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
        `}</style>

        {/* Room Chat Component - Using Supabase Realtime */}
        <RoomChatSupabase
          roomCode={roomCode}
          currentUserId={getCurrentUserId() || ''}
          participants={allParticipants.map(p => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            avatar_url: p.avatar_url,
            gender: p.gender,
            is_online: p.is_online,
            role: p.role
          }))}
          currentUserData={{
            first_name: currentUser?.first_name || 'User',
            last_name: currentUser?.last_name || '',
            avatar_url: currentUser?.avatar_url,
            gender: currentUser?.gender || 'other'
          }}
          isVisible={callStarted && isAuthorized === true}
        />

        {/* Speaking AI Popup */}
        <SpeakingAIPopup 
          isOpen={showSpeakingAIPopup}
          onClose={() => setShowSpeakingAIPopup(false)}
          onTopicSelect={(topic) => {
            console.log('Selected topic:', topic)
            // Don't close the popup here - let the popup handle the topic selection flow
          }}
        />
      </div>
  )
}