'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, Crown, UserMinus, Loader2, User, 
  Mic, MicOff, Volume2
} from 'lucide-react'

interface RoomParticipant {
  id: string
  first_name: string
  last_name: string
  avatar_url: string
  gender: string
  role: 'original' | 'additional'
  joined_at: string
  is_online: boolean
}

interface RoomParticipantsProps {
  roomCode: string
  currentUserId: string
  getAuthHeaders: () => Promise<Record<string, string>>
  onParticipantLeft?: () => void
}

export default function RoomParticipants({
  roomCode,
  currentUserId,
  getAuthHeaders,
  onParticipantLeft
}: RoomParticipantsProps) {
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [leavingRoom, setLeavingRoom] = useState(false)

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `/api/speaking/room/participants?roomCode=${roomCode}&userId=${currentUserId}`,
        { headers }
      )

      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchParticipants, 10000)
    return () => clearInterval(interval)
  }, [roomCode, currentUserId])

  // Leave room (for additional participants only)
  const leaveRoom = async () => {
    if (leavingRoom) return

    setLeavingRoom(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `/api/speaking/room/participants?roomCode=${roomCode}&userId=${currentUserId}`,
        {
          method: 'DELETE',
          headers
        }
      )

      if (response.ok) {
        onParticipantLeft?.()
      }
    } catch (error) {
      console.error('Error leaving room:', error)
    } finally {
      setLeavingRoom(false)
    }
  }

  // Get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'female':
        return <span className="text-pink-500">👩</span>
      case 'male':
        return <span className="text-blue-500">👨</span>
      case 'other':
        return <span className="text-purple-500">🧑</span>
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  // Check if current user is additional participant
  const isCurrentUserAdditional = participants.find(p => 
    p.id === currentUserId && p.role === 'additional'
  )

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-gray-900">
              Room Participants ({participants.length})
            </CardTitle>
          </div>
          
          {isCurrentUserAdditional && (
            <Button
              variant="outline"
              size="sm"
              onClick={leaveRoom}
              disabled={leavingRoom}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {leavingRoom ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Leaving...
                </>
              ) : (
                <>
                  <UserMinus className="h-3 w-3 mr-1" />
                  Leave Room
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {participants.map((participant) => (
            <div 
              key={participant.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                participant.id === currentUserId 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {participant.avatar_url ? (
                    <img
                      src={participant.avatar_url}
                      alt={`${participant.first_name} ${participant.last_name}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      {getGenderIcon(participant.gender)}
                    </div>
                  )}
                  
                  {participant.is_online && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {participant.first_name} {participant.last_name}
                      {participant.id === currentUserId && (
                        <span className="text-blue-600 ml-1">(You)</span>
                      )}
                    </h3>
                    
                    {participant.role === 'original' && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                        <Crown className="h-3 w-3 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>
                      Joined {new Date(participant.joined_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {participant.gender}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio status indicators - these would be connected to actual audio state */}
                <div className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4 text-green-600" />
                  <Mic className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {participants.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No participants in this room</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
