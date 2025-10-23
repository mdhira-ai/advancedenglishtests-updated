'use client'

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'
import Peer from 'peerjs'
import { useSocket } from './Socketprovider'
import { useSession } from './auth-client'

interface PeerUser {
    peerId: string
    userId: string
    name?: string
    isOnline: boolean
}

interface CallState {
    isInCall: boolean
    isConnecting: boolean
    isMuted: boolean
    callStartTime: Date | null
    remoteUserId: string | null
    connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown'
}

interface PeerContextType {
    // Peer instance and connection state
    peer: Peer | null
    isConnected: boolean
    peerId: string | null

    // Room management
    currentRoom: string | null
    roomPeers: PeerUser[]

    // Call management
    callState: CallState
    localStream: MediaStream | null

    // Actions
    initializePeer: () => Promise<boolean>
    // joinRoom: (roomCode: string) => Promise<boolean>
    // leaveRoom: () => Promise<void>
    callUser: (remotePeerId: string, remoteUserId: string) => Promise<boolean>
    answerCall: () => Promise<boolean>
    endCall: () => Promise<void>
    toggleMute: () => void

    // Event handlers
    onIncomingCall?: (fromPeerId: string, fromUserId: string) => void
    onCallEnded?: () => void
    onPeerJoined?: (peer: PeerUser) => void
    onPeerLeft?: (peerId: string) => void
}

const PeerContext = createContext<PeerContextType | undefined>(undefined)

export const usePeer = () => {
    const context = useContext(PeerContext)
    if (!context) {
        throw new Error('usePeer must be used within a PeerProvider')
    }
    return context
}

interface PeerProviderProps {
    children: React.ReactNode
    onIncomingCall?: (fromPeerId: string, fromUserId: string) => void
    onCallEnded?: () => void
    onPeerJoined?: (peer: PeerUser) => void
    onPeerLeft?: (peerId: string) => void
}

export const PeerProvider: React.FC<PeerProviderProps> = ({
    children,
    onIncomingCall,
    onCallEnded,
    onPeerJoined,
    onPeerLeft
}) => {
    // Refs
    const peerRef = useRef<Peer | null>(null)
    const currentCallRef = useRef<any>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
    const incomingCallRef = useRef<any>(null)

    // Hooks
    const { socket } = useSocket()
    const { data: session } = useSession()

    // State
    const [isConnected, setIsConnected] = useState(false)
    const [peerId, setPeerId] = useState<string | null>(null)
    const [currentRoom, setCurrentRoom] = useState<string | null>(null)
    const [roomPeers, setRoomPeers] = useState<PeerUser[]>([])
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)

    const [callState, setCallState] = useState<CallState>({
        isInCall: false,
        isConnecting: false,
        isMuted: false,
        callStartTime: null,
        remoteUserId: null,
        connectionQuality: 'unknown'
    })

    // Initialize PeerJS
    const initializePeer = useCallback(async (): Promise<boolean> => {
        if (!session?.user?.id || peerRef.current) return false

        try {
            const userId = session.user.id
            const peerInstance = new Peer( {
                host: "call.borealsoftwarecompany.com",
                port: 443,
                path: "/peerjs",
                secure: true,
                config: {
                    iceServers: [
                        { urls: "stun:call.borealsoftwarecompany.com:3478" },
                        {
                            urls: "turn:call.borealsoftwarecompany.com:3478",
                            username: "webrtcuser",
                            credential: "strongpassword123",
                        },
                        {
                            urls: "turns:call.borealsoftwarecompany.com:5349",
                            username: "webrtcuser",
                            credential: "strongpassword123",
                        },
                        // Add Google's STUN servers for redundancy
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:stun1.l.google.com:19302" },
                    ],

                    iceCandidatePoolSize: 10,
                    bundlePolicy: "max-bundle",
                    rtcpMuxPolicy: "require",
                    iceTransportPolicy: "all",
                    // Add configuration for better network change handling
                    iceRestart: true,
                    continualGatheringPolicy: "gather_continually",
                    debug: 3, // Enable debug logging to troubleshoot connection issues
                },
                debug: 2,
            });

            // Handle peer connection
            peerInstance.on('open', (id) => {
                console.log('PeerJS connected with ID:', id)
                setPeerId(id)
                setIsConnected(true)
            })

            // Handle incoming calls
            peerInstance.on('call', (call) => {
                console.log('Incoming call from:', call.peer)
                incomingCallRef.current = call

                // Extract caller info from metadata
                const callerUserId = call.metadata?.userId || call.peer
                const callerName = call.metadata?.userName || 'Unknown User'

                // Trigger incoming call callback
                if (onIncomingCall) {
                    onIncomingCall(call.peer, callerUserId)
                }
            })

            // Handle peer errors
            peerInstance.on('error', (error) => {
                console.error('PeerJS error:', error)
                setIsConnected(false)
            })

            // Handle peer disconnection
            peerInstance.on('disconnected', () => {
                console.log('PeerJS disconnected')
                setIsConnected(false)
            })

            peerRef.current = peerInstance
            return true
        } catch (error) {
            console.error('Error initializing PeerJS:', error)
            return false
        }
    }, [session?.user?.id, onIncomingCall])

    // Get user media stream
    const getUserMedia = useCallback(async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            })

            localStreamRef.current = stream
            setLocalStream(stream)
            return stream
        } catch (error) {
            console.error('Error accessing microphone:', error)
            return null
        }
    }, [])

    // Join room
    // const joinRoom = useCallback(async (roomCode: string): Promise<boolean> => {
    //     if (!socket || !peerId || !session?.user) return false

    //     try {
    //         // Emit join room event
    //         socket.emit('join-speaking-room', {
    //             roomCode,
    //             userId: session.user.id,
    //             peerId,
    //             userName: session.user.name
    //         })

    //         setCurrentRoom(roomCode)
    //         return true
    //     } catch (error) {
    //         console.error('Error joining room:', error)
    //         return false
    //     }
    // }, [socket, peerId, session?.user])

    // Leave room
    // const leaveRoom = useCallback(async (): Promise<void> => {
    //     if (!socket || !currentRoom || !session?.user) return

    //     try {
    //         // End any active call first
    //         await endCall()

    //         // Emit leave room event
    //         socket.emit('leave-speaking-room', {
    //             roomCode: currentRoom,
    //             userId: session.user.id,
    //             peerId
    //         })

    //         setCurrentRoom(null)
    //         setRoomPeers([])
    //     } catch (error) {
    //         console.error('Error leaving room:', error)
    //     }
    // }, [socket, currentRoom, session?.user, peerId])

    // Call user
    const callUser = useCallback(async (remotePeerId: string, remoteUserId: string): Promise<boolean> => {
        if (!peerRef.current || callState.isInCall || callState.isConnecting) return false

        try {
            setCallState(prev => ({ ...prev, isConnecting: true, remoteUserId }))

            // Get local stream
            const stream = await getUserMedia()
            if (!stream) {
                setCallState(prev => ({ ...prev, isConnecting: false }))
                return false
            }

            // Make the call with metadata
            const call = peerRef.current.call(remotePeerId, stream, {
                metadata: {
                    userId: session?.user?.id,
                    userName: session?.user?.name
                }
            })

            // Handle call events
            call.on('stream', (remoteStream) => {
                console.log('Received remote stream')

                // Play remote audio
                if (!remoteAudioRef.current) {
                    remoteAudioRef.current = new Audio()
                    remoteAudioRef.current.autoplay = true
                }
                remoteAudioRef.current.srcObject = remoteStream
                remoteAudioRef.current.play().catch(console.error)

                setCallState(prev => ({
                    ...prev,
                    isInCall: true,
                    isConnecting: false,
                    callStartTime: new Date(),
                    connectionQuality: 'good'
                }))
            })

            call.on('close', () => {
                console.log('Call ended by remote peer')
                handleCallEnd()
            })

            call.on('error', (error) => {
                console.error('Call error:', error)
                handleCallEnd()
            })

            currentCallRef.current = call
            return true
        } catch (error) {
            console.error('Error calling user:', error)
            setCallState(prev => ({ ...prev, isConnecting: false }))
            return false
        }
    }, [peerRef.current, callState, getUserMedia, session?.user])

    // Answer incoming call
    const answerCall = useCallback(async (): Promise<boolean> => {
        if (!incomingCallRef.current) return false

        try {
            setCallState(prev => ({ ...prev, isConnecting: true }))

            // Get local stream
            const stream = await getUserMedia()
            if (!stream) {
                setCallState(prev => ({ ...prev, isConnecting: false }))
                return false
            }

            // Answer the call
            const call = incomingCallRef.current
            call.answer(stream)

            // Handle call events
            call.on('stream', (remoteStream: MediaProvider | null) => {
                console.log('Received remote stream after answering')

                // Play remote audio
                if (!remoteAudioRef.current) {
                    remoteAudioRef.current = new Audio()
                    remoteAudioRef.current.autoplay = true
                }
                remoteAudioRef.current.srcObject = remoteStream
                remoteAudioRef.current.play().catch(console.error)

                setCallState(prev => ({
                    ...prev,
                    isInCall: true,
                    isConnecting: false,
                    callStartTime: new Date(),
                    remoteUserId: call.metadata?.userId || call.peer,
                    connectionQuality: 'good'
                }))
            })

            call.on('close', () => {
                console.log('Call ended by remote peer')
                handleCallEnd()
            })

            call.on('error', (error: any) => {
                console.error('Call error:', error)
                handleCallEnd()
            })

            currentCallRef.current = call
            incomingCallRef.current = null
            return true
        } catch (error) {
            console.error('Error answering call:', error)
            setCallState(prev => ({ ...prev, isConnecting: false }))
            return false
        }
    }, [getUserMedia])

    // Handle call end
    const handleCallEnd = useCallback(() => {
        // Close current call
        if (currentCallRef.current) {
            currentCallRef.current.close()
            currentCallRef.current = null
        }

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
            localStreamRef.current = null
            setLocalStream(null)
        }

        // Stop remote audio
        if (remoteAudioRef.current) {
            remoteAudioRef.current.pause()
            remoteAudioRef.current.srcObject = null
        }

        // Reset call state
        setCallState({
            isInCall: false,
            isConnecting: false,
            isMuted: false,
            callStartTime: null,
            remoteUserId: null,
            connectionQuality: 'unknown'
        })

        // Clear incoming call
        incomingCallRef.current = null

        // Trigger callback
        if (onCallEnded) {
            onCallEnded()
        }
    }, [onCallEnded])

    // End call
    const endCall = useCallback(async (): Promise<void> => {
        handleCallEnd()
    }, [handleCallEnd])

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
            }
        }
    }, [])

    // Socket event handlers
    useEffect(() => {
        if (!socket) return

        // Handle room events
        socket.on('peer-joined-room', ({ peerId: joinedPeerId, userId, userName }: { peerId: string, userId: string, userName: string }) => {
            console.log('Peer joined room:', joinedPeerId, userId)

            const newPeer: PeerUser = {
                peerId: joinedPeerId,
                userId,
                name: userName,
                isOnline: true
            }

            setRoomPeers(prev => {
                const exists = prev.some(p => p.peerId === joinedPeerId)
                if (exists) return prev
                const updated = [...prev, newPeer]

                // Trigger callback
                if (onPeerJoined) {
                    onPeerJoined(newPeer)
                }

                return updated
            })
        })

        socket.on('peer-left-room', ({ peerId: leftPeerId }: { peerId: string }) => {
            console.log('Peer left room:', leftPeerId)

            setRoomPeers(prev => {
                const updated = prev.filter(p => p.peerId !== leftPeerId)

                // End call if it was with this peer
                if (currentCallRef.current && currentCallRef.current.peer === leftPeerId) {
                    handleCallEnd()
                }

                // Trigger callback
                if (onPeerLeft) {
                    onPeerLeft(leftPeerId)
                }

                return updated
            })
        })

        socket.on('room-peers', ({ peers }: { peers: PeerUser[] }) => {
            console.log('Received room peers:', peers)
            setRoomPeers(peers)
        })

        return () => {
            socket.off('peer-joined-room')
            socket.off('peer-left-room')
            socket.off('room-peers')
        }
    }, [socket, onPeerJoined, onPeerLeft, handleCallEnd])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleCallEnd()

            if (peerRef.current) {
                peerRef.current.destroy()
                peerRef.current = null
            }
        }
    }, [handleCallEnd])

    // Auto-initialize peer when user is available
    useEffect(() => {
        if (session?.user?.id && !peerRef.current) {
            initializePeer()
        }
    }, [session?.user?.id, initializePeer])

    const contextValue: PeerContextType = {
        // Peer instance and connection state
        peer: peerRef.current,
        isConnected,
        peerId,

        // Room management
        currentRoom,
        roomPeers,

        // Call management
        callState,
        localStream,

        // Actions
        initializePeer,
        // joinRoom,
        // leaveRoom,
        callUser,
        answerCall,
        endCall,
        toggleMute,

        // Event handlers
        onIncomingCall,
        onCallEnded,
        onPeerJoined,
        onPeerLeft
    }

    return (
        <PeerContext.Provider value={contextValue}>
            {children}
            {/* Hidden audio element for remote stream */}
            <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                style={{ display: 'none' }}
            />
        </PeerContext.Provider>
    )
}

export default PeerProvider