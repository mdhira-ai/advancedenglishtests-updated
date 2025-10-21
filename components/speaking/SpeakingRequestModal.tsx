'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, UserCheck } from 'lucide-react'

interface SpeakingRequestModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
    gender: string
  } | null
  onSendRequest: (userId: string) => void
}

export default function SpeakingRequestModal({ 
  isOpen, 
  onClose, 
  targetUser,
  onSendRequest 
}: SpeakingRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen || !targetUser) return null

  const handleSendRequest = async () => {
    setIsLoading(true)
    try {
      await onSendRequest(targetUser.id)
      onClose()
    } catch (error) {
      console.error('Failed to send speaking request:', error)
    } finally {
      setIsLoading(false)
    }
  }
  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'female':
        return <UserCheck className="h-8 w-8 text-pink-600" />
      case 'male':
      case 'other':
      default:
        return <User className="h-8 w-8 text-blue-600" />
    }
  }

  return (
    <div className="fixed inset-0  bg-opacity-10 backdrop-blur-sm  flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Send Speaking Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
               <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              {getGenderIcon(targetUser.gender)}
            </div>
            
            </Avatar>
            <div>
              <h3 className="font-semibold">
               {targetUser.last_name}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {targetUser.gender}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Send a speaking practice request to {targetUser.first_name}? 
            They will have 10 minutes to respond.
          </p>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendRequest}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
