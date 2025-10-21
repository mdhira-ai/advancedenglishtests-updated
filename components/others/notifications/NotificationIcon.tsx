'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NotificationPopup from './NotificationPopup'

export default function NotificationIcon() {
  const [notificationCount, setNotificationCount] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [loading, setLoading] = useState(false)

 


  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPopup(!showPopup)}
          className="relative p-2"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </Button>
      </div>

    </>
  )
}
