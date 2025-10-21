'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from './auth-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceUser {
  user_id: string
  email?: string
  online_at: string
}

interface PresenceContextType {
  isOnline: boolean
  onlineUsers: PresenceUser[]
  userCount: number
  isLoading: boolean
  error: string | null
  realtimedata: any[] // Real-time data changes
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined)

// Database operations for user_presence table
const updateUserPresence = async (userId: string, isOnline: boolean) => {
  try {
    const now = new Date().toISOString()

    // Upsert user presence data
    const { data, error } = await supabase
      .from('user_presence')
      .upsert({
        id: `presence_${userId}`,
        userId: userId,
        isOnline: isOnline,
        lastSeen: now,
        updatedAt: now
      }, {
        onConflict: 'userId',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error updating user presence:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to update user presence:', error)
    return false
  }
}

// Get all presence records from database
const getDbPresenceUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*, user(email)')
      // .select("*")
      .order('updatedAt', { ascending: false })

    if (error) {
      console.error('Error fetching presence users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch presence users:', error)
    return []
  }
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [isOnline, setIsOnline] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [userCount, setUserCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [realtimedata, setrealtimedata] = useState<any[]>([])

  // Function to refresh database presence data
    const refreshDbPresence = async () => {
    const users = await getDbPresenceUsers()
    // setDbPresenceUsers(users)
    setrealtimedata(users)
  }

  // useEffect(() => {

  //   const channels = supabase.channel('custom-all-channel')
  //     .on(
  //       'postgres_changes',
  //       // need email from user table
  //       { event: '*', schema: 'public', table: 'user_presence' },
  //       (payload) => {
  //         console.log('Change received!', payload)
  //         if(payload.eventType ==='INSERT'){
  //           setrealtimedata((current) => [...current, payload.new])
  //           console.log(realtimedata)
  //         }
  //         if(payload.eventType ==='UPDATE'){
  //             setrealtimedata( prev => prev.map(item => item.id === payload.new.id ? payload.new : item))

  //         }
  //         if(payload.eventType ==='DELETE'){
  //           setrealtimedata((current) => {
  //             console.log(realtimedata)
  //             return current.filter(item => item.id !== payload.old.id)
  //           })
  //         }
          

  //       }
  //     )
  //     .subscribe()

  //   return () => {
  //     supabase.removeChannel(channels)
  //   }


  // }, [])



  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false)
      return
    }

    const setupPresence = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const presenceChannel = supabase.channel('global-presence', {
          config: {
            presence: {
              key: session.user.id,
            },
          },
        })

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            console.log('Presence synced')


            const state = presenceChannel.presenceState()
            const users: PresenceUser[] = []

            Object.entries(state).forEach(([key, presences]) => {
              if (Array.isArray(presences) && presences.length > 0) {
                const presence = presences[0] as any
                if (presence.user_id && presence.online_at) {
                  users.push({
                    user_id: presence.user_id,
                    email: presence.email,
                    online_at: presence.online_at
                  })
                }
              }
            })

            setOnlineUsers(users)
            setUserCount(users.length)
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            // update in database
            // if (key) {
            //   updateUserPresence(key, true)
            // }

            // console.log('User joined:', key, newPresences)
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {

            // update in database
            if (key) {
              updateUserPresence(key, false)
            }


            console.log('User left:', key, leftPresences)
          })

        presenceChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const userPresence: PresenceUser = {
              user_id: session.user.id,
              email: session.user.email,
              online_at: new Date().toISOString(),
            }

            const presenceTrackStatus = await presenceChannel.track(userPresence)

            if (presenceTrackStatus === 'ok') {
              setIsOnline(true)
              await updateUserPresence(session.user.id, true)
              console.log('Successfully tracking presence')
            } else {
              setError('Failed to track presence')
            }
          }
        })

        setIsLoading(false)

        return () => {
          presenceChannel.untrack()
          presenceChannel.unsubscribe()
        }
      } catch (err) {
        console.error('Error setting up presence:', err)
        setError(err instanceof Error ? err.message : 'Failed to setup presence')
        setIsLoading(false)
      }
    }

    const cleanup = setupPresence()

    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.())
    }
  }, [session?.user])


  useEffect(() => {
    return () => {
      if (session?.user) {
        updateUserPresence(session.user.id, false)
      }
    }
  }, [session?.user])

  // Load database presence data on mount
  useEffect(() => {
    refreshDbPresence()
  }, [])

  const value: PresenceContextType = {
    isOnline,
    onlineUsers,
    userCount,
    isLoading,
    error,
    realtimedata
  }

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const context = useContext(PresenceContext)
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider')
  }
  return context
}