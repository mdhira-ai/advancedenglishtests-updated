'use client'

import { usePeer } from '@/lib/PeerProvider'
import { useEffect, useState } from 'react'

export default function SpeakingRoomPage({ params }: { params: { roomCode: string } }) {
  const {
    isConnected,
    callState,
    callUser,
    answerCall,
    endCall,
    toggleMute
  } = usePeer()

  const [showIncomingCall, setShowIncomingCall] = useState(false)
  const [incomingCallInfo, setIncomingCallInfo] = useState<any>(null)





  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Room info */}
      <div className="p-4">
        <h1>Speaking Room: {params.roomCode}</h1>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      </div>

     

      {/* Call controls */}
      {(callState.isInCall || callState.isConnecting) && (
        <div className="p-4">
          <h2>Call in progress</h2>
          <p>Status: {callState.isConnecting ? 'Connecting...' : 'Connected'}</p>
          {callState.callStartTime && (
            <p>Duration: {Math.floor((Date.now() - callState.callStartTime.getTime()) / 1000)}s</p>
          )}
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={toggleMute}
              className={`px-4 py-2 rounded ${callState.isMuted ? 'bg-red-500' : 'bg-gray-500'} text-white`}
            >
              {callState.isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Incoming call modal */}
      {showIncomingCall && incomingCallInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3>Incoming call from {incomingCallInfo.fromUserId}</h3>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  answerCall()
                  setShowIncomingCall(false)
                }}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Answer
              </button>
              <button
                onClick={() => {
                  setShowIncomingCall(false)
                  setIncomingCallInfo(null)
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}