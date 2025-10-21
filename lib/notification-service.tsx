'use client'
import { toast } from 'react-toastify'
import { supabase } from './supabase'
import { createRoomAndAddUsers } from './room-management'
import { notificationSound } from './notification-sound'
import React from 'react'

// Track active notifications by request ID
const activeNotifications = new Map<string, string | number>()

// Custom notification component with buttons
const SpeakingRequestNotification = ({ 
  senderName, 
  requestId, 
  onAccept, 
  onDecline,
  closeToast
}: { 
  senderName: string
  requestId: string
  onAccept: () => void
  onDecline: () => void
  closeToast: () => void
}) => {
  const handleAccept = () => {
    notificationSound.stopNotificationSound()
    activeNotifications.delete(requestId)
    closeToast()
    onAccept()
  }

  const handleDecline = () => {
    notificationSound.stopNotificationSound()
    activeNotifications.delete(requestId)
    closeToast()
    onDecline()
  }

  const handleGoToPage = () => {
    notificationSound.stopNotificationSound()
    activeNotifications.delete(requestId)
    closeToast()
    window.location.href = '/speaking'
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="text-sm font-medium text-gray-900">
        �️ <strong>{senderName}</strong> wants to practice English speaking with you!
      </div>
      <div className="text-xs text-gray-600 mb-1">
        Join now to improve your speaking skills together
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleAccept}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-md font-medium transition-colors"
        >
          ✓ Accept
        </button>
        <button
          onClick={handleDecline}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-md font-medium transition-colors"
        >
          ✗ Decline
        </button>
        <button
          onClick={handleGoToPage}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-md font-medium transition-colors"
        >
          → View All
        </button>
      </div>
    </div>
  )
}

export const notificationService = {
  // Dismiss speaking request notification by request ID
  dismissSpeakingRequest: (requestId: string) => {
    const toastId = activeNotifications.get(requestId)
    if (toastId) {
      toast.dismiss(toastId)
      activeNotifications.delete(requestId)
      notificationSound.stopNotificationSound()
    }
  },

  // Show speaking request notification
  showSpeakingRequest: (
    senderName: string,
    requestId: string,
    currentUserId: string
  ) => {
    const handleAccept = async () => {
      try {
        // First get the request details to know who the sender is
        const { data: request, error: fetchError } = await supabase
          .from('speaking_requests')
          .select('*')
          .eq('id', requestId)
          .single()

        if (fetchError || !request) {
          console.error('Error fetching request:', fetchError)
          toast.error('Failed to find request')
          return
        }

        const senderId = request.sender_id
        const receiverId = request.receiver_id

        // Create room and add both users
        const { roomCode, error: roomError } = await createRoomAndAddUsers(senderId, receiverId)
        
        if (roomError || !roomCode) {
          console.error('Failed to create room:', roomError)
          toast.error('Failed to create room')
          return
        }

        // Update request status to accepted
        const { error } = await supabase
          .from('speaking_requests')
          .update({ status: 'accepted' })
          .eq('id', requestId)
        
        if (error) {
          console.error('Error accepting request:', error)
          toast.error('Failed to accept request')
          return
        }

        toast.success('Request accepted! Joining room...')
        // Redirect to the room
        setTimeout(() => {
          window.location.href = `/speaking/room/${roomCode}`
        }, 1000)
        
      } catch (error) {
        console.error('Error accepting request:', error)
        toast.error('Failed to accept request')
      }
    }

    const handleDecline = async () => {
      try {
        // Update request status to rejected
        const { error } = await supabase
          .from('speaking_requests')
          .update({ status: 'rejected' })
          .eq('id', requestId)
        
        if (error) {
          console.error('Error declining request:', error)
          toast.error('Failed to decline request')
          return
        }

        toast.info('Request declined')
        
      } catch (error) {
        console.error('Error declining request:', error)
        toast.error('Failed to decline request')
      }
    }

    // Play notification sound for 10 seconds
    notificationSound.playNotificationSound(10);

    // Show custom toast with buttons
    const toastId = toast(
      ({ closeToast }) => (
        <SpeakingRequestNotification
          senderName={senderName}
          requestId={requestId}
          onAccept={handleAccept}
          onDecline={handleDecline}
          closeToast={closeToast}
        />
      ),
      {
        position: 'top-center',
        autoClose: false, // Keep it open until user interacts
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        closeButton: true,
        style: {
          minWidth: '320px',
          borderRadius: '8px',
        }
      }
    )
    
    // Store the toast ID for potential dismissal
    activeNotifications.set(requestId, toastId)
  },

  // Show simple info notifications
  showInfo: (message: string) => {
    toast.info(message, {
      position: 'top-center',
      autoClose: 3000,
    })
  },

  // Show success notifications
  showSuccess: (message: string) => {
    toast.success(message, {
      position: 'top-center',
      autoClose: 3000,
    })
  },

  // Show error notifications
  showError: (message: string) => {
    toast.error(message, {
      position: 'top-center',
      autoClose: 5000,
    })
  }
}