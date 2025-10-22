'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import {
  Users, User, MessageSquare, Send, Inbox, Clock,
  X, CalendarDays, Mic, UserCheck
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Loading from './loading'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import SpeakingRequests, { IncomingRequestsModal, OutgoingRequestsModal } from '@/components/speaking/SpeakingRequests'
import ScheduledRequests from '@/components/speaking/ScheduledRequests'
import SchedulingModal from '@/components/speaking/SchedulingModal'

dayjs.extend(relativeTime)

interface User {
  id: string
  userId: string
  isOnline: boolean
  lastSeen: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    createdAt: string
    updatedAt: string
    emailVerified: boolean
    gender?: string | null
  } | null
  in_room?: boolean
  room_code?: string
  room_created_at?: string
}

interface UserStatistics {
  userId: string
  totalMinutes: number
  totalLikes: number
  totalSessions: number
}

export default function page() {
  // State for popups only
  const [showIncomingRequestsPopup, setShowIncomingRequestsPopup] = useState(false)
  const [showSentRequestsPopup, setShowSentRequestsPopup] = useState(false)
  const [showScheduledRequestsPopup, setShowScheduledRequestsPopup] = useState(false)
  const [showSchedulingModal, setShowSchedulingModal] = useState(false)
  const [selectedUserForScheduling, setSelectedUserForScheduling] = useState<any>(null)

  // Request counts
  const [incomingRequestCount, setIncomingRequestCount] = useState(0)
  const [outgoingRequestCount, setOutgoingRequestCount] = useState(0)
  const [scheduledSessionCount, setScheduledSessionCount] = useState(0)

  const [realtimedata, setrealtimedata] = useState<User[]>([])
  const [userStatistics, setUserStatistics] = useState<UserStatistics[]>([])
  const router = useRouter();
  const { data: session, error, isPending } = useSession()

  // Initialize speaking requests component
  const speakingRequestsData = SpeakingRequests({
    currentUserId: session?.user?.id || '',
    allUsers: realtimedata,
    onRequestCountChange: (incoming, outgoing) => {
      setIncomingRequestCount(incoming)
      setOutgoingRequestCount(outgoing)
    },
    onRoomJoin: (roomCode) => {
      // This will be called when the other user accepts the request
      // The current user will be redirected automatically in the updateRequestStatus function
      console.log(`Room ${roomCode} created, other user should be redirected`)
    }
  })




  // Get gender icon helper
  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'female':
        return <UserCheck className="h-7 w-7 text-pink-600" />
      case 'male':
        return <User className="h-7 w-7 text-blue-600" />
      default:
        return <User className="h-7 w-7 text-gray-600" />
    }
  }

  // Calculate user statistics
  const calculateUserStatistics = async () => {
    if (!session?.user?.id) return

    try {
      // Get all users who have been online
      const allUserIds = realtimedata.map(user => user.userId)

      if (allUserIds.length === 0) return

      // Fetch speaking room participants to get sessions count and individual session durations
      const { data: participantsData } = await supabase
        .from('speaking_room_participants')
        .select('user_id, joined_at, left_at')
        .in('user_id', allUserIds)
        .not('left_at', 'is', null) // Only get completed sessions

      // Fetch likes data
      const { data: likesData } = await supabase
        .from('speaking_room_likes')
        .select('liked_user_id')
        .in('liked_user_id', allUserIds)

      // Process statistics for each user
      const statistics: UserStatistics[] = allUserIds.map(userId => {
        // Calculate sessions and total minutes from participant data
        const userParticipations = participantsData?.filter(p => p.user_id === userId) || []
        const totalSessions = userParticipations.length

        // Calculate total minutes by summing individual session durations
        const totalMinutes = Math.round(
          userParticipations.reduce((sum, p) => {
            if (p.joined_at && p.left_at) {
              const joinedAt = new Date(p.joined_at)
              const leftAt = new Date(p.left_at)
              const durationMs = leftAt.getTime() - joinedAt.getTime()
              const durationMinutes = durationMs / (1000 * 60) // Convert to minutes
              return sum + durationMinutes
            }
            return sum
          }, 0)
        )

        // Calculate total likes
        const totalLikes = likesData?.filter(like => like.liked_user_id === userId).length || 0

        return {
          userId,
          totalMinutes,
          totalLikes,
          totalSessions
        }
      })

      setUserStatistics(statistics)
    } catch (error) {
      console.error('Error calculating user statistics:', error)
    }
  }

  // Get statistics for a specific user
  const getUserStatistics = (userId: string): UserStatistics => {
    return userStatistics.find(stats => stats.userId === userId) || {
      userId,
      totalMinutes: 0,
      totalLikes: 0,
      totalSessions: 0
    }
  }

  // Handle redirect after component has mounted
  useEffect(() => {
    if (!isPending && !error && !session) {
      router.replace("/login"); // Use replace instead of push
    }
  }, [session, isPending, error, router]);

  // Check if current user is in a room and redirect them
  useEffect(() => {
    if (!session?.user?.id) return

    const checkUserRoomStatus = async () => {
      try {
        const { data: userPresence } = await supabase
          .from('user_presence')
          .select('in_room, room_code')
          .eq('userId', session.user.id)
          .single()

        if (userPresence?.in_room && userPresence?.room_code) {
          console.log('User is in room, redirecting to:', userPresence.room_code)
          router.push(`/speaking/room/${userPresence.room_code}`)
        }
      } catch (error) {
        console.error('Error checking user room status:', error)
      }
    }

    checkUserRoomStatus()
  }, [session?.user?.id, router])

  // Fetch and subscribe to scheduled sessions count
  useEffect(() => {
    if (!session?.user?.id) return

    // Function to fetch scheduled sessions count
    const fetchScheduledSessionsCount = async () => {
      const { count } = await supabase
        .from('scheduled_speaking_requests')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .eq('status', 'pending')

      setScheduledSessionCount(count || 0)
    }

    // Initial fetch
    fetchScheduledSessionsCount()

    // Set up realtime subscription for scheduled_speaking_requests
    const scheduledRequestsChannel = supabase
      .channel('scheduled-requests-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_speaking_requests'
        },
        (payload) => {
          console.log('Scheduled request change received:', payload)
          // Check if the change affects current user
          const newRecord = payload.new as any
          const oldRecord = payload.old as any

          const isRelevant = (record: any) =>
            record && (record.sender_id === session.user.id || record.receiver_id === session.user.id)

          if (isRelevant(newRecord) || isRelevant(oldRecord)) {
            // Refetch count when any relevant change occurs
            fetchScheduledSessionsCount()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(scheduledRequestsChannel)
    }
  }, [session?.user?.id])

  // Set up realtime subscription for room invitations
  useEffect(() => {
    if (!session?.user?.id) return

    const roomInvitationsChannel = supabase
      .channel('room-invitations-speaking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speaking_room_invitations'
        },
        (payload) => {
          console.log('Room invitation change received:', payload)

          // Check if current user received an invitation
          const newRecord = payload.new as any
          const oldRecord = payload.old as any

          // If current user received an invitation and accepted it, they should be redirected
          if (payload.eventType === 'UPDATE' &&
            newRecord?.invitee_id === session.user.id &&
            newRecord?.status === 'accepted' &&
            oldRecord?.status === 'pending') {

            // Small delay to ensure backend has processed the room joining
            setTimeout(() => {
              // Refresh page data to get updated presence
              window.location.reload()
            }, 1000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomInvitationsChannel)
    }
  }, [session?.user?.id])

  // Set up realtime subscription for user presence
  useEffect(() => {
    if (!session) return

    // Fetch initial data
    const fetchInitialData = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('*,user(*)')

      if (data) {
        setrealtimedata(data)

        // Check if current user is in a room and redirect them
        const currentUserPresence = data.find(user => user.userId === session?.user?.id)
        if (currentUserPresence?.in_room && currentUserPresence?.room_code) {
          router.push(`/speaking/room/${currentUserPresence.room_code}`)
          return
        }
      }
    }

    fetchInitialData()

    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        async (payload) => {

          // Check if current user was added to a room
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedUser = payload.new as any
            if (updatedUser.userId === session?.user?.id && updatedUser.in_room && updatedUser.room_code) {
              // Current user was added to a room, redirect them
              router.push(`/speaking/room/${updatedUser.room_code}`)
              return
            }
          }

          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('user_presence')
              .select('*,user(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setrealtimedata((current) => [data, ...current])
            }
          }
          if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('user_presence')
              .select('*,user(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setrealtimedata((current) => {
                const index = current.findIndex(item => item.id === payload.new.id)
                if (index !== -1) {
                  const updatedData = { ...current[index], ...data }
                  return [...current.slice(0, index), updatedData, ...current.slice(index + 1)]
                }
                return current
              })
            }
          }
          if (payload.eventType === 'DELETE') {
            setrealtimedata((current) => current.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channels)
    }
  }, [session, router])

  // Set up realtime subscription for user statistics
  useEffect(() => {
    if (!session?.user?.id) return

    // Initial calculation when component mounts and data is available
    if (realtimedata.length > 0) {
      calculateUserStatistics()
    }

    // Set up realtime subscriptions for statistics-related tables
    const statisticsChannel = supabase
      .channel('user-statistics-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_rooms' },
        () => {
          calculateUserStatistics()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_room_participants' },
        () => {
          console.log('Room participants changed, recalculating statistics')
          calculateUserStatistics()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_room_likes' },
        () => {
          console.log('Room likes changed, recalculating statistics')
          calculateUserStatistics()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(statisticsChannel)
    }
  }, [session?.user?.id, realtimedata])

  // Show loading while checking session
  if (isPending) {
    return <Loading />;
  }

  // If user is not logged in, redirect to login page
  if (!session) {
    return <Loading />;
  }








  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex lg:min-h-screen">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen">
          <div className="flex flex-col w-80 xl:w-96">
            <div className="flex flex-col h-full bg-white shadow-lg overflow-y-auto">
              {/* Header */}
              <div className="p-4 lg:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="p-1.5 lg:p-2 rounded-lg" style={{ backgroundColor: '#4f5bd5' }}>
                      <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg lg:text-xl font-bold text-gray-900">Speaking Practice</h1>
                      <p className="text-xs lg:text-sm text-gray-600">Connect & Practice</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div className="text-center p-2 lg:p-3 rounded-lg" style={{ backgroundColor: '#e8f2ff' }}>
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-1" style={{ color: '#1A3A6E' }} />
                    <p className="text-base lg:text-lg font-bold" style={{ color: '#1A3A6E' }}>
                      {realtimedata.filter(user => user.isOnline && !user.in_room).length}
                    </p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                  <div className="text-center p-2 lg:p-3 bg-orange-50 rounded-lg">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 mx-auto mb-1" />
                    <p className="text-base lg:text-lg font-bold text-orange-700">
                      {realtimedata.filter(user => user.in_room).length}
                    </p>
                    <p className="text-xs text-gray-600">In Rooms</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-4 lg:p-6 space-y-2 lg:space-y-3">
                {/* Incoming Requests */}
                <button
                  onClick={() => setShowIncomingRequestsPopup(true)}
                  className="w-full flex items-center justify-between p-2 lg:p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="p-1.5 lg:p-2 bg-red-100 rounded-lg">
                      <Inbox className="h-4 w-4 lg:h-5 lg:w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm lg:font-medium text-gray-900">Incoming Requests</p>
                      <p className="text-xs lg:text-sm text-gray-600 hidden lg:block">People want to speak</p>
                    </div>
                  </div>
                  {incomingRequestCount > 0 && <Badge className="bg-red-500 text-white text-xs">{incomingRequestCount}</Badge>}
                </button>

                {/* Sent Requests */}
                <button
                  onClick={() => setShowSentRequestsPopup(true)}
                  className="w-full flex items-center justify-between p-2 lg:p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="p-1.5 lg:p-2 rounded-lg" style={{ backgroundColor: '#e8f2ff' }}>
                      <Send className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#1A3A6E' }} />
                    </div>
                    <div>
                      <p className="text-sm lg:font-medium text-gray-900">Sent Requests</p>
                      <p className="text-xs lg:text-sm text-gray-600 hidden lg:block">Waiting for response</p>
                    </div>
                  </div>
                  {outgoingRequestCount > 0 && <Badge className="text-white text-xs" style={{ backgroundColor: '#4f5bd5' }}>{outgoingRequestCount}</Badge>}
                </button>

                {/* Scheduled Sessions */}
                <button
                  onClick={() => setShowScheduledRequestsPopup(true)}
                  className="w-full flex items-center justify-between p-2 lg:p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
                      <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm lg:font-medium text-gray-900">Scheduled Sessions</p>
                      <p className="text-xs lg:text-sm text-gray-600 hidden lg:block">Your upcoming sessions</p>
                    </div>
                  </div>
                  {scheduledSessionCount > 0 && <Badge className="bg-blue-500 text-white text-xs">{scheduledSessionCount}</Badge>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 lg:w-0">
          <div className="flex-1 bg-gray-50 lg:static relative pb-16 sm:pb-20 lg:pb-0">
            {/* Motivational Quote Banner */}
            <div className="p-3 sm:p-4 lg:p-6 pb-0">
              <div className="max-w-6xl mx-auto mb-4 lg:mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 lg:p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Mic className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 mr-2" />
                    <span className="text-blue-600 font-semibold text-sm lg:text-base">Start Your Speaking Journey</span>
                  </div>
                  <p className="text-gray-700 text-sm lg:text-base font-medium mb-1">
                    "Don't waste your time! Send a connect request or schedule a session to start speaking practice."
                  </p>
                  <p className="text-blue-600 text-xs lg:text-sm font-semibold">
                    🚀 Your first step will boost your speaking confidence!
                  </p>
                </div>
              </div>
            </div>

            {/* Users Grid */}
            <div className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="max-w-6xl mx-auto">
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center justify-between mb-1 lg:mb-2">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">All Users</h2>
                  </div>
                  <p className="text-sm lg:text-base text-gray-600 mb-3">
                    Connect with people worldwide to practice and enhance your speaking skills. Your profile is shown first, followed by users sorted by recent activity.
                  </p>

                  {/* User Statistics Summary */}
                  {/* User Statistics Summary */}
                  <div className="flex items-center justify-start space-x-0 mb-4">
                    <div className="flex items-center space-x-2  rounded-full px-3 py-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div className="flex items-center text-center  space-x-2 ">
                        <p className="text-sm font-bold text-blue-700">{realtimedata.length}</p>
                        <p className="text-xs text-blue-600">Total</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2  rounded-full px-3 py-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <div className="flex items-center  text-center space-x-2">
                        <p className="text-sm font-bold text-green-700">
                          {realtimedata.filter(user => user.isOnline && !user.in_room).length}
                        </p>
                        <p className="text-xs text-green-600">Online</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 rounded-full px-3 py-2">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <div className="flex items-center  text-center space-x-2">
                        <p className="text-sm font-bold text-orange-700">
                          {realtimedata.filter(user => user.in_room).length}
                        </p>
                        <p className="text-xs text-orange-600">Speaking</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-4">
                  {(() => {
                    // Sort users in priority order: 
                    // 1. Current user first
                    // 2. Active users (online but not in room)
                    // 3. Users in room
                    // 4. Recent active users (offline, sorted by most recent activity)
                    const sortedUsers = [...realtimedata].sort((a, b) => {
                      // Current user always comes first
                      if (a.userId === session?.user?.id) return -1;
                      if (b.userId === session?.user?.id) return 1;

                      // Get status priority (lower number = higher priority)
                      const getStatusPriority = (user: User) => {
                        if (user.isOnline && !user.in_room) return 1; // Active users
                        if (user.in_room) return 2; // Users in room
                        return 3; // Offline users
                      };

                      const aPriority = getStatusPriority(a);
                      const bPriority = getStatusPriority(b);

                      // If same priority, sort by lastSeen (most recent first)
                      if (aPriority === bPriority) {
                        const aTime = new Date(a.lastSeen).getTime();
                        const bTime = new Date(b.lastSeen).getTime();
                        return bTime - aTime; // Descending order (latest first)
                      }

                      // Sort by priority
                      return aPriority - bPriority;
                    });

                    return sortedUsers;
                  })().map((user) => (
                    <div key={user.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                      {/* Header with Avatar and Name */}
                      <div className="p-3 text-center relative">
                        {/* Corner Badge */}
                        {user?.userId === session?.user.id && (
                          <div className="absolute top-1 right-1 text-white px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#1A3A6E' }}>
                            YOU
                          </div>
                        )}

                        {/* Avatar */}
                        <div className="relative inline-block mb-2">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${user.in_room
                            ? 'bg-red-50'
                            : user.isOnline
                              ? 'bg-blue-50'
                              : 'bg-gray-100'
                            }`}>
                            {getGenderIcon(user.user?.gender || 'male')}
                          </div>

                          {/* Status dot */}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${user.in_room
                            ? 'bg-red-400'
                            : user.isOnline
                              ? 'bg-green-400'
                              : 'bg-gray-300'
                            }`}></div>
                        </div>

                        {/* Name */}
                        <h3 className="text-sm font-medium text-gray-900 leading-tight mb-1">
                          {user.user?.name || user.user?.email || user.userId.slice(0, 8)}
                        </h3>

                        {/* Gender */}
                        <p className="text-xs text-gray-600 mb-1">
                          {user.user?.gender || 'Not specified'}
                        </p>

                        {/* Status Text */}
                        <p className={`text-xs ${user.in_room
                          ? 'text-red-500'
                          : user.isOnline
                            ? 'text-green-600'
                            : 'text-gray-400'
                          }`}>
                          {user.in_room ? 'In Room' : user.isOnline ? 'Available' : 'Offline'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />

                        </p>

                        {/* Last Seen */}
                        <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          {user.isOnline ? 'Online' : `Last seen: ${dayjs(user.lastSeen).fromNow()}`}
                        </p>

                        {/* User Statistics */}
                        {(() => {
                          const stats = getUserStatistics(user.userId)
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-blue-600">{stats.totalMinutes}</span>
                                  <span className="text-xs text-gray-500">min</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-pink-600">{stats.totalLikes}</span>
                                  <span className="text-xs text-gray-500">likes</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-green-600">{stats.totalSessions}</span>
                                  <span className="text-xs text-gray-500">talks</span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Action Button */}
                      {user.userId !== session?.user.id && (
                        <div className="p-3 pt-2">
                          {(() => {
                            const userId = user.userId
                            const hasPendingRequest = speakingRequestsData.hasPendingRequestWith(userId)
                            const pendingRequest = speakingRequestsData.getPendingRequestWith(userId)
                            const isProcessing = speakingRequestsData.processingRequestId === userId

                            if (hasPendingRequest && pendingRequest) {
                              const isSender = pendingRequest.sender_id === session?.user?.id

                              if (isSender) {
                                // User has sent a request - show cancel option
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                                      <Clock className="h-3 w-3" />
                                      <span>Request Sent</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                      onClick={() => speakingRequestsData.updateRequestStatus(pendingRequest.id, 'cancelled')}
                                      disabled={isProcessing}
                                    >
                                      Cancel Request
                                    </Button>
                                  </div>
                                )
                              } else {
                                // User received a request - show accept/reject options
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center space-x-1 text-xs text-blue-600">
                                      <Inbox className="h-3 w-3" />
                                      <span>Request Received</span>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                        onClick={() => speakingRequestsData.updateRequestStatus(pendingRequest.id, 'rejected')}
                                        disabled={isProcessing}
                                      >
                                        Reject
                                      </Button>
                                      <Button
                                        size="sm"
                                        className={`flex-1 h-7 text-xs ${speakingRequestsData.isEitherUserInRoom(pendingRequest)
                                            ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                          }`}
                                        onClick={() => speakingRequestsData.updateRequestStatus(pendingRequest.id, 'accepted')}
                                        disabled={isProcessing || speakingRequestsData.isEitherUserInRoom(pendingRequest)}
                                        title={speakingRequestsData.isEitherUserInRoom(pendingRequest) ? 'Cannot accept - one user is currently in a room' : ''}
                                      >
                                        {speakingRequestsData.isEitherUserInRoom(pendingRequest) ? 'User Busy' : 'Accept'}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              }
                            }

                            // No pending request - show send request button
                            return (
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  className={`w-full h-8 text-xs font-medium rounded ${(!user.isOnline || user.in_room)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  disabled={!user.isOnline || user.in_room || isProcessing}
                                  onClick={() => speakingRequestsData.sendRequest(userId)}
                                >
                                  {isProcessing ? 'Sending...' : user.in_room ? 'In Room' : !user.isOnline ? 'Offline' : 'Connect'}
                                </Button>

                                {/* Schedule Button - always available */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-7 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    setSelectedUserForScheduling({
                                      id: userId,
                                      first_name: user.user?.name?.split(' ')[0] || 'User',
                                      last_name: user.user?.name?.split(' ').slice(1).join(' ') || '',
                                      gender: user.user?.gender || 'male',
                                      avatar_url: user.user?.image || '',
                                      total_sessions: 0,
                                      likes_received: 0,
                                      avg_session_duration: 0,
                                      total_minutes: 0,
                                      is_online: user.isOnline,
                                      last_seen: user.lastSeen,
                                      in_room: user.in_room,
                                      room_code: user.room_code,
                                      room_created_at: user.room_created_at
                                    })
                                    setShowSchedulingModal(true)
                                  }}
                                >
                                  Schedule
                                </Button>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation - Visible on mobile only */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
            <div className="grid grid-cols-4 ">
              {/* Incoming Requests */}
              <button
                onClick={() => setShowIncomingRequestsPopup(true)}
                className="flex flex-col items-center py-3 sm:py-3 px-2 text-center relative transition-colors text-red-600 hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="relative">
                  <Inbox className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                  {incomingRequestCount > 0 && (
                    <div className="absolute -top-2 sm:-top-2 -right-2 sm:-right-2 min-w-5 h-5 sm:min-w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1.5 py-0.5">
                      {incomingRequestCount}
                    </div>
                  )}
                </div>
                <span className="text-xs hidden sm:block">Requests</span>
              </button>

              {/* Active Users / Home */}
              <button
                className="flex flex-col items-center py-3 sm:py-3 px-2 text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                style={{ color: '#1A3A6E' }}
              >
                <div className="relative">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                  <div className="absolute -top-2 sm:-top-2 -right-2 sm:-right-2 min-w-5 h-5 sm:min-w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center font-bold px-1.5 py-0.5" style={{ backgroundColor: '#4f5bd5' }}>
                    {realtimedata.length}
                  </div>
                </div>
                <span className="text-xs hidden sm:block">Users</span>
              </button>

              {/* Scheduled Sessions */}
              <button
                onClick={() => setShowScheduledRequestsPopup(true)}
                className="flex flex-col items-center py-3 sm:py-3 px-2 text-center text-blue-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="relative">
                  <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                  {scheduledSessionCount > 0 && (
                    <div className="absolute -top-2 sm:-top-2 -right-2 sm:-right-2 min-w-5 h-5 sm:min-w-5 sm:h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1.5 py-0.5">
                      {scheduledSessionCount}
                    </div>
                  )}
                </div>
                <span className="text-xs hidden sm:block">Schedule</span>
              </button>

              {/* Sent Requests */}
              <button
                onClick={() => setShowSentRequestsPopup(true)}
                className="flex flex-col items-center py-3 sm:py-3 px-2 text-center relative transition-colors hover:bg-gray-50 active:bg-gray-100"
                style={{ color: '#1A3A6E' }}
              >
                <div className="relative">
                  <Send className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                  {outgoingRequestCount > 0 && (
                    <div className="absolute -top-2 sm:-top-2 -right-2 sm:-right-2 min-w-5 h-5 sm:min-w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center font-bold px-1.5 py-0.5" style={{ backgroundColor: '#4f5bd5' }}>
                      {outgoingRequestCount}
                    </div>
                  )}
                </div>
                <span className="text-xs hidden sm:block">Sent</span>
              </button>
            </div>
          </div>

          {/* Request Modals */}
          <IncomingRequestsModal
            isOpen={showIncomingRequestsPopup}
            onClose={() => setShowIncomingRequestsPopup(false)}
            requests={speakingRequestsData.incomingRequests}
            updateRequestStatus={speakingRequestsData.updateRequestStatus}
            getGenderIcon={speakingRequestsData.getGenderIcon}
            getUserDisplayName={speakingRequestsData.getUserDisplayName}
            processingRequestId={speakingRequestsData.processingRequestId}
            isEitherUserInRoom={speakingRequestsData.isEitherUserInRoom}
          />

          <OutgoingRequestsModal
            isOpen={showSentRequestsPopup}
            onClose={() => setShowSentRequestsPopup(false)}
            requests={speakingRequestsData.outgoingRequests}
            updateRequestStatus={speakingRequestsData.updateRequestStatus}
            getGenderIcon={speakingRequestsData.getGenderIcon}
            getUserDisplayName={speakingRequestsData.getUserDisplayName}
            processingRequestId={speakingRequestsData.processingRequestId}
          />

          {/* Scheduled Requests Modal */}
          {showScheduledRequestsPopup && (
            <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-3 lg:p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Scheduled Sessions</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduledRequestsPopup(false)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                  <ScheduledRequests
                    currentUserId={session?.user?.id || ''}
                    allUsers={realtimedata.map(user => ({
                      id: user.userId,
                      first_name: user.user?.name?.split(' ')[0] || 'User',
                      last_name: user.user?.name?.split(' ').slice(1).join(' ') || '',
                      gender: user.user?.gender || 'male',
                      avatar_url: user.user?.image || '',
                      total_sessions: 0,
                      likes_received: 0,
                      avg_session_duration: 0,
                      total_minutes: 0,
                      is_online: user.isOnline,
                      last_seen: user.lastSeen,
                      in_room: user.in_room,
                      room_code: user.room_code,
                      room_created_at: user.room_created_at
                    }))}
                    currentUserInRoom={false} // You can determine this based on your logic
                    speakingRequests={speakingRequestsData.requests}
                    onCountChange={(count) => setScheduledSessionCount(count)}
                    onJoinRoom={(roomCode) => {
                      console.log('Joining room:', roomCode)
                      // Implement room joining logic here
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Scheduling Modal */}
          <SchedulingModal
            isOpen={showSchedulingModal}
            onClose={() => {
              setShowSchedulingModal(false)
              setSelectedUserForScheduling(null)
            }}
            targetUser={selectedUserForScheduling}
            currentUserId={session?.user?.id || ''}
            onScheduleSuccess={(newRequest) => {
              console.log('Schedule request created:', newRequest)
              // The ScheduledRequests component will automatically update via realtime subscription
            }}
          />
        </div>
      </div>
    </div>
  )
}