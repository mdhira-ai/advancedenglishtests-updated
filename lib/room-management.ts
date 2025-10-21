import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Utility function to generate room code
function generateRoomCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

// Store active realtime channels for cleanup
const activeChannels = new Map<string, RealtimeChannel>()

// Create a room and add users to it
export async function createRoomAndAddUsers(
  user1Id: string, 
  user2Id: string
): Promise<{ roomCode?: string; error?: string }> {
  try {
    // Generate unique room code
    let roomCode: string
    let attempts = 0
    
    do {
      roomCode = generateRoomCode()
      attempts++
      
      if (attempts > 10) {
        return { error: 'Failed to generate unique room code' }
      }
      
      // Check if room code already exists
      const { data: existingRoom } = await supabase
        .from('speaking_rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single()
        
      if (!existingRoom) break
    } while (true)

    // Create the room directly with Supabase
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .insert({
        room_code: roomCode,
        creator_id: user1Id,
        status: 'active',
        room_type: 'instant',
        max_participants: 10,
        agora_channel_name: roomCode
      })
      .select()
      .single()

    if (roomError || !room) {
      return { error: roomError?.message || 'Failed to create room' }
    }

    // Add both users as participants
    const { error: participantsError } = await supabase
      .from('speaking_room_participants')
      .insert([
        {
          room_id: room.id,
          user_id: user1Id,
          role: 'creator',
          is_online: true
        },
        {
          room_id: room.id,
          user_id: user2Id,
          role: 'participant',
          is_online: true
        }
      ])

    if (participantsError) {
      // Cleanup: delete the room if participants couldn't be added
      await supabase.from('speaking_rooms').delete().eq('id', room.id)
      return { error: 'Failed to add participants to room' }
    }
    
    // Update user presence for both users to indicate they're in a room
    const { error: presenceError } = await supabase
      .from('user_presence')
      .upsert([
        {
          id: `presence_${user1Id}`,
          userId: user1Id,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          in_room: true,
          room_code: room.room_code,
          room_created_at: new Date().toISOString()
        },
        {
          id: `presence_${user2Id}`,
          userId: user2Id,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          in_room: true,
          room_code: room.room_code,
          room_created_at: new Date().toISOString()
        }
      ])

    if (presenceError) {
      console.error('Error updating user presence:', presenceError.message || presenceError)
      // Don't fail the room creation for presence errors - just log it
    }

    return { roomCode: room.room_code }

  } catch (error) {
    console.error('Error in createRoomAndAddUsers:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Join an existing room with realtime updates
export async function joinRoom(
  roomCode: string, 
  userId: string,
  onRoomUpdate?: (room: any) => void
): Promise<{ success?: boolean; error?: string; channel?: RealtimeChannel }> {
  try {
    // Check if room exists and is active
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select('id, status, max_participants, participants:speaking_room_participants(count)')
      .eq('room_code', roomCode)
      .eq('status', 'active')
      .single()

    if (roomError || !room) {
      return { error: 'Room not found or has ended' }
    }

    // Check if room is at capacity
    const participantCount = room.participants?.[0]?.count || 0
    if (participantCount >= room.max_participants) {
      return { error: 'Room is at maximum capacity' }
    }

    // Add user as participant
    const { error: participantError } = await supabase
      .from('speaking_room_participants')
      .insert({
        room_id: room.id,
        user_id: userId,
        role: 'participant',
        is_online: true
      })

    if (participantError) {
      return { error: 'Failed to join room' }
    }

    // Update user presence
    const { error: presenceError } = await supabase
      .from('user_presence')
      .upsert({
        id: `presence_${userId}`,
        userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        in_room: true,
        room_code: roomCode
      })

    if (presenceError) {
      console.error('Error updating user presence:', presenceError)
      // Don't fail the join for presence errors
    }

    // Set up realtime subscription if callback provided
    let channel: RealtimeChannel | undefined
    if (onRoomUpdate) {
      const subscriptionResult = await subscribeToRoom(roomCode, {
        onRoomStatusChange: onRoomUpdate,
        onParticipantJoin: (participant) => {
          console.log('User joined room:', participant)
        },
        onParticipantLeave: (participant) => {
          console.log('User left room:', participant)
        }
      })
      
      if (subscriptionResult.channel) {
        channel = subscriptionResult.channel
      }
    }

    return { success: true, channel }

  } catch (error) {
    console.error('Error in joinRoom:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Leave a room with realtime cleanup
export async function leaveRoom(
  roomCode: string, 
  userId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get room data
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select('id, creator_id')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      return { error: 'Room not found' }
    }

    // Mark participant as left
    const { error: participantError } = await supabase
      .from('speaking_room_participants')
      .update({
        left_at: new Date().toISOString(),
        is_online: false
      })
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .is('left_at', null)

    if (participantError) {
      return { error: 'Failed to leave room' }
    }

    // Update user presence - clear room info
    const { error: presenceError } = await supabase
      .from('user_presence')
      .upsert({
        id: `presence_${userId}`,
        userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        in_room: false,
        room_code: null,
        room_created_at: null
      })

    if (presenceError) {
      console.error('Error updating user presence:', presenceError)
      // Don't fail the leave for presence errors
    }

    // Cleanup realtime subscriptions for this room
    await unsubscribeFromRoom(roomCode)

    return { success: true }

  } catch (error) {
    console.error('Error in leaveRoom:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get room participants
export async function getRoomParticipants(
  roomCode: string
): Promise<{ participants?: any[]; error?: string }> {
  try {
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select(`
        id,
        participants:speaking_room_participants(
          id,
          user_id,
          role,
          joined_at,
          is_online,
          user:User(
            id,
            name,
            gender,
            image
          )
        )
      `)
      .eq('room_code', roomCode)
      .is('participants.left_at', null)
      .single()

    if (roomError || !room) {
      return { error: 'Room not found' }
    }

    const participants = room.participants?.map((p: any) => ({
      id: p.user.id,
      first_name: p.user.name?.split(' ')[0] || '',
      last_name: p.user.name?.split(' ').slice(1).join(' ') || '',
      avatar_url: p.user.image || '',
      gender: p.user.gender || 'other',
      role: p.role,
      joined_at: p.joined_at,
      is_online: p.is_online
    })) || []

    return { participants }

  } catch (error) {
    console.error('Error in getRoomParticipants:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Subscribe to room changes with realtime updates
export async function subscribeToRoom(
  roomCode: string,
  callbacks: {
    onRoomStatusChange?: (room: any) => void;
    onParticipantJoin?: (participant: any) => void;
    onParticipantLeave?: (participant: any) => void;
    onPresenceUpdate?: (presence: any) => void;
  }
): Promise<{ channel?: RealtimeChannel; error?: string }> {
  try {
    // Create a unique channel for this room
    const channelName = `room:${roomCode}`
    
    // Remove existing channel if it exists
    if (activeChannels.has(channelName)) {
      await activeChannels.get(channelName)?.unsubscribe()
      activeChannels.delete(channelName)
    }

    const channel = supabase.channel(channelName)

    // Subscribe to room status changes
    if (callbacks.onRoomStatusChange) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'speaking_rooms',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => callbacks.onRoomStatusChange?.(payload.new)
      )
    }

    // Subscribe to participant changes
    if (callbacks.onParticipantJoin || callbacks.onParticipantLeave) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speaking_room_participants'
        },
        async (payload) => {
          // Check if this participant belongs to our room
          const { data: room } = await supabase
            .from('speaking_rooms')
            .select('id')
            .eq('room_code', roomCode)
            .single()

          if (room && (payload.new as any)?.room_id === room.id) {
            if (payload.eventType === 'INSERT') {
              callbacks.onParticipantJoin?.(payload.new)
            } else if (payload.eventType === 'UPDATE' && (payload.new as any)?.left_at) {
              callbacks.onParticipantLeave?.(payload.new)
            }
          }
        }
      )
    }

    // Subscribe to presence updates
    if (callbacks.onPresenceUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => callbacks.onPresenceUpdate?.(payload.new)
      )
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to room updates')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to room updates')
      }
    })
    
    activeChannels.set(channelName, channel)
    return { channel }

  } catch (error) {
    console.error('Error subscribing to room:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Subscribe to user presence in a room
export async function subscribeToRoomPresence(
  roomCode: string,
  userId: string,
  callbacks: {
    onUserJoin?: (userId: string, metadata: any) => void;
    onUserLeave?: (userId: string, metadata: any) => void;
    onSync?: () => void;
  }
): Promise<{ channel?: RealtimeChannel; error?: string }> {
  try {
    const channelName = `presence:${roomCode}`
    
    // Remove existing presence channel if it exists
    if (activeChannels.has(channelName)) {
      await activeChannels.get(channelName)?.unsubscribe()
      activeChannels.delete(channelName)
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId
        }
      }
    })

    // Handle presence state changes
    channel
      .on('presence', { event: 'sync' }, () => {
        callbacks.onSync?.()
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        callbacks.onUserJoin?.(key, newPresences[0])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        callbacks.onUserLeave?.(key, leftPresences[0])
      })

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this user's presence in the room
        const presenceState = await channel.track({
          userId,
          roomCode,
          joinedAt: new Date().toISOString(),
          isOnline: true
        })
        console.log('Presence tracking status:', presenceState)
      }
    })

    activeChannels.set(channelName, channel)
    return { channel }

  } catch (error) {
    console.error('Error subscribing to room presence:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Unsubscribe from a specific room channel
export async function unsubscribeFromRoom(
  roomCode: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const channelName = `room:${roomCode}`
    const channel = activeChannels.get(channelName)
    
    if (channel) {
      await channel.unsubscribe()
      activeChannels.delete(channelName)
    }

    // Also unsubscribe from presence channel
    const presenceChannelName = `presence:${roomCode}`
    const presenceChannel = activeChannels.get(presenceChannelName)
    
    if (presenceChannel) {
      await presenceChannel.unsubscribe()
      activeChannels.delete(presenceChannelName)
    }

    return { success: true }

  } catch (error) {
    console.error('Error unsubscribing from room:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Cleanup all active channels (call when user logs out or leaves app)
export async function cleanupAllChannels(): Promise<{ success?: boolean; error?: string }> {
  try {
    const promises = Array.from(activeChannels.values()).map(channel => 
      channel.unsubscribe()
    )
    
    await Promise.all(promises)
    activeChannels.clear()

    return { success: true }

  } catch (error) {
    console.error('Error cleaning up channels:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get all active channel names (for debugging)
export function getActiveChannels(): string[] {
  return Array.from(activeChannels.keys())
}