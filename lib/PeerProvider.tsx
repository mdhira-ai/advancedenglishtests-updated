'use client'

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'
import Peer from 'peerjs'
import { useSocket } from './Socketprovider'
import { useSession } from './auth-client'
import { toast } from 'react-toastify';
import CallToast from './ToastCall'
import CallRejectedToast from '@/components/CallRejectedToast'
import { GetusernamebyUserId, UpdateCallStatus } from './CRUD'
import { notificationSound } from '@/components/NotificationSound'

interface PeerUser {
    peerId: string
    userId: string
    name?: string
    isOnline: boolean
}

interface CallState {
    isRinging: boolean
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
    cancelCall: () => Promise<void>


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
    const { socket, onCallRejected, offCallRejected, onCallCancelled, offCallCancelled } = useSocket()
    const { data: session } = useSession()

    // State
    const [isConnected, setIsConnected] = useState(false)
    const [peerId, setPeerId] = useState<string | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)

    const [callState, setCallState] = useState<CallState>({
        isInCall: false,
        isConnecting: false,
        isMuted: false,
        callStartTime: null,
        remoteUserId: null,
        connectionQuality: 'unknown',
        isRinging: false
    })


    const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    // Add cancel call function
    const cancelCall = useCallback(async (): Promise<void> => {
        if (!callState.isRinging || !currentCallRef.current) return

        try {

            // Stop sound when cancelling call
            notificationSound.stopNotificationSound();
            // Emit call cancellation to notify the other user
            if (socket && callState.remoteUserId) {
                socket.emit('call-cancelled', {
                    toPeerId: currentCallRef.current.peer,
                    fromPeerId: peerRef.current?.id,
                    fromUserId: session?.user?.id,
                    cancelledBy: session?.user?.name || session?.user?.id
                });
            }

            // Clear ringing timeout
            if (ringingTimeoutRef.current) {
                clearTimeout(ringingTimeoutRef.current)
                ringingTimeoutRef.current = null
            }

            // Close the call
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

            // Reset call state
            setCallState({
                isInCall: false,
                isConnecting: false,
                isMuted: false,
                callStartTime: null,
                remoteUserId: null,
                connectionQuality: 'unknown',
                isRinging: false
            })

            // Show cancellation message
            toast.info('Call cancelled', {
                position: "top-right",
                autoClose: 3000,
            })

            // Trigger onCallEnded callback
            if (onCallEnded) {
                onCallEnded()
            }
        } catch (error) {
            console.error('Error cancelling call:', error)
        }
    }, [callState.isRinging, callState.remoteUserId, socket, session?.user, onCallEnded])

    // Handle call cancellation notification
    const handleCallCancelled = useCallback(async (data: any) => {
        console.log("Call cancelled by user:", data);


        // Stop sound when call is cancelled
        notificationSound.stopNotificationSound();

        // Dismiss any active call toast
        toast.dismiss();
        const username = await GetusernamebyUserId(data.fromUserId);

        // Show notification to the receiver
        toast.info(`${username} cancelled the call `, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });

        // Clean up incoming call
        if (incomingCallRef.current) {
            incomingCallRef.current.close();
            incomingCallRef.current = null;
        }

        // Reset call state
        setCallState({
            isInCall: false,
            isConnecting: false,
            isMuted: false,
            callStartTime: null,
            remoteUserId: null,
            connectionQuality: 'unknown',
            isRinging: false
        });

        // Trigger onCallEnded callback
        if (onCallEnded) {
            onCallEnded();
        }
    }, [onCallEnded]);




    // Initialize PeerJS
    const initializePeer = useCallback(async (): Promise<boolean> => {
        if (!session?.user?.id || peerRef.current) return false

        try {
            const userId = session.user.id
            const peerInstance = new Peer({
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
            peerInstance.on('open', async (id) => {
                console.log('PeerJS connected with ID:', id)
                setPeerId(id)
                setIsConnected(true)

                // Update peerID in the database
                if (userId && id) {
                    console.log('Updating peerID in database for user:', userId, id)

                    socket.emit('update-peer-id', { userId, peerID: id });
                }


            })

            // Handle incoming calls
            peerInstance.on('call', (call) => {
                console.log('Incoming call from:', call.peer)
                incomingCallRef.current = call

                // Extract caller info from metadata
                const callerUserId = call.metadata?.userId || call.peer
                const callerName = call.metadata?.userName || 'Unknown User'

                handleIncomingCall(call.peer, callerUserId);

                // Trigger incoming call callback
                if (onIncomingCall) {
                    onIncomingCall(call.peer, callerUserId)
                }
            })

            // Handle peer errors
            peerInstance.on('error', (error) => {
                console.error('PeerJS error:', error)
                setIsConnected(false)
                toast.error('Peer connection error. Please try again.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                handleCallEnd();
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



    const handleIncomingCall = (fromPeerId: string, fromUserId: string) => {
        // You can fetch user details if needed or use the provided IDs
        notificationSound.playNotificationSound(30); // Play for 30 seconds max

        const callerName = GetusernamebyUserId(fromUserId); // Replace with actual name if available

        const toastId = toast(
            <CallToast
                callerName={callerName}
                onAnswer={() => {
                    notificationSound.stopNotificationSound();
                    answerCall();
                    toast.dismiss(toastId);
                }}
                onDecline={() => {
                    notificationSound.stopNotificationSound();
                    // Optionally handle call decline logic here
                    toast.dismiss(toastId);
                    handleReject();
                }}
            />,
            {
                position: "top-center",
                autoClose: false, // Don't auto-close
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: false,
                closeButton: false,
                type: "info"
            }
        );
    };

    // Handle call rejection notification
    const handleCallRejected = useCallback((data: any) => {
        console.log("Call rejected by user:", data);


        // Stop sound when call is rejected
        notificationSound.stopNotificationSound();

        // Clear ringing timeout
        if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current)
            ringingTimeoutRef.current = null
        }

        // Show notification to the caller
        // Show custom notification
        toast.error(
            <CallRejectedToast rejectedBy={data.rejectedBy} />,
            {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            }
        );

        // Clean up call state
        if (currentCallRef.current) {
            currentCallRef.current.close();
            currentCallRef.current = null;
        }

        // Reset call state
        setCallState({
            isInCall: false,
            isConnecting: false,
            isMuted: false,
            callStartTime: null,
            remoteUserId: null,
            connectionQuality: 'unknown',
            isRinging: false
        });

        // Stop local stream if exists
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        // Trigger onCallEnded callback
        if (onCallEnded) {
            onCallEnded();
        }
    }, [onCallEnded]);


    // Update handleReject function to emit the rejection
    const handleReject = () => {
        toast.dismiss(); // Dismiss all toasts when call ends

        // Stop sound when rejecting call
        notificationSound.stopNotificationSound();


        // Emit call rejection to notify the caller
        if (socket && incomingCallRef.current) {
            socket.emit('call-rejected', {
                toPeerId: incomingCallRef.current.peer,
                fromPeerId: peerRef.current?.id,
                fromUserId: session?.user?.id,
                rejectedBy: session?.user?.name || session?.user?.id
            });
        }

        // Clean up incoming call
        if (incomingCallRef.current) {
            incomingCallRef.current.close();
            incomingCallRef.current = null;
        }

        // Clean up current call if exists
        if (currentCallRef.current) {
            currentCallRef.current.close();
            currentCallRef.current = null;
        }

        // Reset call state
        setCallState({
            isInCall: false,
            isConnecting: false,
            isMuted: false,
            callStartTime: null,
            remoteUserId: null,
            connectionQuality: 'unknown',
            isRinging: false
        });

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);

        // Stop remote audio
        if (remoteAudioRef.current) {
            remoteAudioRef.current.pause();
            remoteAudioRef.current.srcObject = null;
        }

        // Trigger onCallEnded callback
        if (onCallEnded) {
            onCallEnded();
        }
    };


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

            // update call status
            await UpdateCallStatus(session?.user?.id || '', 'calling');



            // Set ringing state after initiating call

            setCallState(
                prev => ({ ...prev, isRinging: true })
            )


            // Start playing outgoing call sound
            notificationSound.playNotificationSound(30);

            // Set a timeout for unanswered calls (e.g., 30 seconds)
            ringingTimeoutRef.current = setTimeout(() => {
                if (callState.isRinging && !callState.isInCall) {
                    toast.error('Call unanswered. Please try again later.', {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });
                    handleCallEnd();

                }
            }, 30000);



            // Handle call events
            call.on('stream', (remoteStream) => {
                console.log('Received remote stream')

                // Stop sound when call is connected
                notificationSound.stopNotificationSound();


                // Clear ringing timeout
                if (ringingTimeoutRef.current) {
                    clearTimeout(ringingTimeoutRef.current)
                    ringingTimeoutRef.current = null
                }

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
                    connectionQuality: 'good',
                    isRinging: false
                }))




            })

            call.on('close', () => {
                console.log('Call ended by remote peer')

                // Stop sound on call end
                notificationSound.stopNotificationSound();


                if (ringingTimeoutRef.current) {
                    clearTimeout(ringingTimeoutRef.current)
                    ringingTimeoutRef.current = null
                }

                UpdateCallStatus(session?.user?.id || '', 'idle');
                handleCallEnd()
            })

            call.on('error', (error) => {
                console.error('Call error:', error)



                // Stop sound on error
                notificationSound.stopNotificationSound();


                if (ringingTimeoutRef.current) {
                    clearTimeout(ringingTimeoutRef.current)
                    ringingTimeoutRef.current = null
                }
                UpdateCallStatus(session?.user?.id || '', 'idle');
                handleCallEnd()
            })

            currentCallRef.current = call
            return true
        } catch (error) {
            console.error('Error calling user:', error)



            // Stop sound on error
            notificationSound.stopNotificationSound();


            setCallState(prev => ({ ...prev, isConnecting: false, isRinging: false }))
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

        // Always stop sound when call ends
        notificationSound.stopNotificationSound();
        // Clear ringing timeout
        if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current)
            ringingTimeoutRef.current = null
        }


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
            connectionQuality: 'unknown',
            isRinging: false
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



    // Set up call cancellation listener
    useEffect(() => {
        if (socket) {
            onCallCancelled(handleCallCancelled);
            onCallRejected(handleCallRejected);

            return () => {
                offCallCancelled(handleCallCancelled);
                offCallRejected(handleCallRejected);
            };
        }
    }, [socket, handleCallCancelled, handleCallRejected, onCallCancelled, offCallCancelled, onCallRejected, offCallRejected]);


    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (ringingTimeoutRef.current) {
                clearTimeout(ringingTimeoutRef.current)
            }


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
        cancelCall,


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