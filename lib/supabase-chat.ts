import { supabase } from './supabase'
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'

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

interface TypingIndicator {
  user_id: string
  user_name: string
  is_private: boolean
  receiver_id?: string
  timestamp: string
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

export class SupabaseChatManager {
  private channel: RealtimeChannel | null = null
  private roomCode: string
  private currentUserId: string
  private onMessageReceived?: (message: ChatMessage) => void
  private onTypingUpdate?: (typingUsers: TypingIndicator[]) => void
  private onParticipantUpdate?: (participants: ChatParticipant[]) => void
  private typingUsers: Map<string, TypingIndicator> = new Map()
  private isConnected: boolean = false

  constructor(roomCode: string, currentUserId: string) {
    this.roomCode = roomCode
    this.currentUserId = currentUserId
  }

  // Initialize realtime connection for the room
  public async connect(callbacks: {
    onMessageReceived?: (message: ChatMessage) => void
    onTypingUpdate?: (typingUsers: TypingIndicator[]) => void
    onParticipantUpdate?: (participants: ChatParticipant[]) => void
  }): Promise<boolean> {
    this.onMessageReceived = callbacks.onMessageReceived
    this.onTypingUpdate = callbacks.onTypingUpdate
    this.onParticipantUpdate = callbacks.onParticipantUpdate

    try {
      // Create a channel for this specific room with better configuration
      this.channel = supabase.channel(`room:${this.roomCode}:${Date.now()}`, {
        config: {
          broadcast: { self: false }, // Don't receive our own broadcasts
          presence: { key: this.currentUserId }
        }
      })

      // Listen for new messages
      this.channel.on(
        'broadcast',
        { event: 'new_message' },
        (payload: { payload: ChatMessage }) => {
          console.log('📨 Received new message:', payload.payload)
          if (this.onMessageReceived && payload.payload.sender_id !== this.currentUserId) {
            this.onMessageReceived(payload.payload)
          }
        }
      )

      // Listen for typing indicators
      this.channel.on(
        'broadcast',
        { event: 'typing_indicator' },
        (payload: { payload: TypingIndicator }) => {
          console.log('⌨️ Received typing indicator:', payload.payload)
          this.handleTypingIndicator(payload.payload)
        }
      )

      // Subscribe to the channel with retry mechanism
      const subscriptionStatus = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 10000) // 10 second timeout

        this.channel!.subscribe((status) => {
          console.log('📡 Supabase channel status:', status)
          clearTimeout(timeout)
          if (status === 'SUBSCRIBED') {
            this.isConnected = true
            resolve(true)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.isConnected = false
            resolve(false)
          }
        })
      })

      if (subscriptionStatus) {
        console.log('✅ Chat manager connected successfully')
        return true
      } else {
        console.error('❌ Failed to connect to chat channel')
        return false
      }
    } catch (error) {
      console.error('❌ Error connecting to chat:', error)
      this.isConnected = false
      return false
    }
  }

  // Handle typing indicator updates
  private handleTypingIndicator(indicator: TypingIndicator) {
    if (indicator.user_id === this.currentUserId) return

    const key = `${indicator.user_id}_${indicator.is_private ? indicator.receiver_id || 'private' : 'group'}`
    
    // Check if indicator is recent (within 2 seconds)
    const indicatorTime = new Date(indicator.timestamp).getTime()
    const now = Date.now()
    
    if (now - indicatorTime < 2000) {
      this.typingUsers.set(key, indicator)
    } else {
      this.typingUsers.delete(key)
    }

    // Clean up old typing indicators
    Array.from(this.typingUsers.entries()).forEach(([mapKey, typing]) => {
      const typingTime = new Date(typing.timestamp).getTime()
      if (now - typingTime > 3000) {
        this.typingUsers.delete(mapKey)
      }
    })

    if (this.onTypingUpdate) {
      this.onTypingUpdate(Array.from(this.typingUsers.values()))
    }
  }

  // Send a message with improved error handling
  public async sendMessage(messageData: {
    receiver_id?: string
    message_text: string
    message_type?: 'text' | 'emoji' | 'system'
    is_private?: boolean
    sender_first_name: string
    sender_last_name: string
    sender_avatar_url?: string
    sender_gender: string
  }): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      console.error('❌ Chat channel not connected')
      return false
    }

    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const message: ChatMessage = {
      id: messageId,
      room_code: this.roomCode,
      sender_id: this.currentUserId,
      receiver_id: messageData.receiver_id,
      message_text: messageData.message_text.trim(),
      message_type: messageData.message_type || 'text',
      is_private: messageData.is_private || false,
      created_at: new Date().toISOString(),
      sender_first_name: messageData.sender_first_name,
      sender_last_name: messageData.sender_last_name,
      sender_avatar_url: messageData.sender_avatar_url,
      sender_gender: messageData.sender_gender,
      is_read: false
    }

    try {
      // First save to database
      const dbResult = await this.saveMessageToDatabase(message)
      if (!dbResult) {
        console.error('❌ Failed to save message to database')
        return false
      }

      // Then broadcast to other users
      const broadcastResult = await this.channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message
      })

      if (broadcastResult === 'ok') {
        console.log('✅ Message sent successfully:', message.message_text)
        return true
      } else {
        console.error('❌ Failed to broadcast message:', broadcastResult)
        return false
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      return false
    }
  }

  // Send typing indicator with timestamp
  public async sendTypingIndicator(isTyping: boolean, receiverId?: string, userName: string = 'User'): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      console.error('❌ Chat channel not connected for typing')
      return false
    }

    const typingData: TypingIndicator = {
      user_id: this.currentUserId,
      user_name: userName,
      is_private: !!receiverId,
      receiver_id: receiverId,
      timestamp: new Date().toISOString()
    }

    try {
      if (isTyping) {
        const result = await this.channel.send({
          type: 'broadcast',
          event: 'typing_indicator',
          payload: typingData
        })
        console.log('⌨️ Typing indicator sent:', result)
      }
      
      return true
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error)
      return false
    }
  }

  // Enhanced message saving with better error handling
  private async saveMessageToDatabase(message: ChatMessage): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('speaking_room_messages')
        .insert({
          id: message.id,
          room_code: message.room_code,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          message_text: message.message_text,
          message_type: message.message_type,
          is_private: message.is_private,
          is_read: false,
          created_at: message.created_at
        })
        .select()

      if (error) {
        console.error('❌ Database error saving message:', error)
        return false
      }

      console.log('✅ Message saved to database:', data)
      return true
    } catch (error) {
      console.error('❌ Exception saving message:', error)
      return false
    }
  }

  // Enhanced chat history fetching
  public async fetchChatHistory(limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('speaking_room_messages')
        .select(`
          *,
          sender:sender_id!inner (
            name,
            gender,
            image
          )
        `)
        .eq('room_code', this.roomCode)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching chat history:', error)
        return []
      }

      if (!data || data.length === 0) {
        console.log('📭 No chat history found for room:', this.roomCode)
        return []
      }

      // Transform the data to match ChatMessage interface
      const messages = data.map((msg: any) => {
        const senderName = msg.sender?.name || 'Unknown User'
        const nameParts = senderName.split(' ')
        
        return {
          id: msg.id,
          room_code: msg.room_code,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          message_text: msg.message_text,
          message_type: msg.message_type,
          is_private: msg.is_private,
          created_at: msg.created_at,
          sender_first_name: nameParts[0] || 'Unknown',
          sender_last_name: nameParts.slice(1).join(' ') || '',
          sender_avatar_url: msg.sender?.image,
          sender_gender: msg.sender?.gender || 'other',
          is_read: msg.is_read
        }
      })

      console.log('📥 Loaded chat history:', messages.length, 'messages')
      return messages
    } catch (error) {
      console.error('❌ Exception fetching chat history:', error)
      return []
    }
  }

  // Enhanced mark messages as read
  public async markMessagesAsRead(senderId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('speaking_room_messages')
        .update({ is_read: true })
        .eq('room_code', this.roomCode)
        .eq('is_read', false) // Only update unread messages

      if (senderId) {
        // Mark private messages from specific sender as read
        query = query
          .eq('sender_id', senderId)
          .eq('receiver_id', this.currentUserId)
          .eq('is_private', true)
      } else {
        // Mark all group messages as read (messages where current user is not sender)
        query = query
          .neq('sender_id', this.currentUserId)
          .eq('is_private', false)
      }

      const { data, error } = await query.select('id')

      if (error) {
        console.error('❌ Error marking messages as read:', error)
        return false
      }

      if (data && data.length > 0) {
        console.log('✅ Marked', data.length, 'messages as read')
      }
      
      return true
    } catch (error) {
      console.error('❌ Exception marking messages as read:', error)
      return false
    }
  }

  // Enhanced unread counts
  public async getUnreadCounts(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('speaking_room_messages')
        .select('sender_id, is_private, receiver_id')
        .eq('room_code', this.roomCode)
        .eq('is_read', false)
        .neq('sender_id', this.currentUserId) // Don't count own messages

      if (error) {
        console.error('❌ Error fetching unread counts:', error)
        return {}
      }

      const counts: Record<string, number> = { group: 0 }

      if (data) {
        data.forEach((msg: any) => {
          if (msg.is_private && msg.receiver_id === this.currentUserId) {
            // Private message to current user
            counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1
          } else if (!msg.is_private) {
            // Group message
            counts['group'] = (counts['group'] || 0) + 1
          }
        })
      }

      console.log('📊 Unread counts:', counts)
      return counts
    } catch (error) {
      console.error('❌ Exception getting unread counts:', error)
      return {}
    }
  }

  // Check connection status
  public isConnectedToChat(): boolean {
    return this.isConnected && !!this.channel
  }

  // Disconnect with cleanup
  public async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.unsubscribe()
        this.channel = null
      }
      this.isConnected = false
      this.typingUsers.clear()
      console.log('🔌 Chat channel disconnected and cleaned up')
    } catch (error) {
      console.error('❌ Error disconnecting chat:', error)
    }
  }
}

// Utility function to create chat manager instance
export const createChatManager = (roomCode: string, currentUserId: string): SupabaseChatManager => {
  return new SupabaseChatManager(roomCode, currentUserId)
}