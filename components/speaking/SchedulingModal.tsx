'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User, MessageSquare, X, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
// Email notifications handled via API routes

interface ActiveUser {
  id: string
  first_name: string
  last_name: string
  gender: string
  avatar_url: string
  total_sessions: number
  likes_received: number
  avg_session_duration: number
  total_minutes: number
  is_online: boolean
  last_seen: string
  in_room?: boolean
  room_code?: string
  room_created_at?: string
}

interface SchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: ActiveUser | null
  currentUserId: string
  onScheduleSuccess?: (newRequest: any) => void
  isLoading?: boolean
}

export default function SchedulingModal({ 
  isOpen, 
  onClose, 
  targetUser, 
  currentUserId,
  onScheduleSuccess,
  isLoading = false 
}: SchedulingModalProps) {
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [selectedHour, setSelectedHour] = useState('')
  const [selectedMinute, setSelectedMinute] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(userTimezone)
  }, [])

  // Helper function to get current time in selected timezone
  const getCurrentTimeInTimezone = (tz: string) => {
    return new Date().toLocaleString('en-US', { 
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    
    // North America
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
    { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
    { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
    { value: 'America/Toronto', label: 'Eastern Time - Canada (EST/EDT)' },
    { value: 'America/Vancouver', label: 'Pacific Time - Canada (PST/PDT)' },
    { value: 'America/Edmonton', label: 'Mountain Time - Canada (MST/MDT)' },
    { value: 'America/Winnipeg', label: 'Central Time - Canada (CST/CDT)' },
    { value: 'America/Halifax', label: 'Atlantic Time - Canada (AST/ADT)' },
    { value: 'America/St_Johns', label: 'Newfoundland Time - Canada (NST/NDT)' },
    
    // Europe
    { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
    { value: 'Europe/Paris', label: 'CET (Central European Time)' },
    { value: 'Europe/Berlin', label: 'CET (Central European Time)' },
    { value: 'Europe/Rome', label: 'CET (Central European Time)' },
    { value: 'Europe/Madrid', label: 'CET (Central European Time)' },
    { value: 'Europe/Amsterdam', label: 'CET (Central European Time)' },
    { value: 'Europe/Moscow', label: 'MSK (Moscow Time)' },
    
    // Asia
    { value: 'Asia/Dhaka', label: 'BST (Bangladesh Standard Time)' },
    { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
    { value: 'Asia/Karachi', label: 'PKT (Pakistan Standard Time)' },
    { value: 'Asia/Dubai', label: 'GST (Gulf Standard Time)' },
    { value: 'Asia/Tehran', label: 'IRST (Iran Standard Time)' },
    { value: 'Asia/Shanghai', label: 'CST (China Standard Time)' },
    { value: 'Asia/Hong_Kong', label: 'HKT (Hong Kong Time)' },
    { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
    { value: 'Asia/Seoul', label: 'KST (Korea Standard Time)' },
    { value: 'Asia/Singapore', label: 'SGT (Singapore Time)' },
    { value: 'Asia/Bangkok', label: 'ICT (Indochina Time)' },
    { value: 'Asia/Jakarta', label: 'WIB (Western Indonesian Time)' },
    { value: 'Asia/Manila', label: 'PHT (Philippine Time)' },
    
    // Middle East & Africa
    { value: 'Africa/Cairo', label: 'EET (Eastern European Time)' },
    { value: 'Africa/Lagos', label: 'WAT (West Africa Time)' },
    { value: 'Africa/Johannesburg', label: 'SAST (South Africa Standard Time)' },
    
    // Oceania
    { value: 'Australia/Sydney', label: 'AEST (Australian Eastern Time)' },
    { value: 'Australia/Melbourne', label: 'AEST (Australian Eastern Time)' },
    { value: 'Australia/Perth', label: 'AWST (Australian Western Time)' },
    { value: 'Pacific/Auckland', label: 'NZST (New Zealand Standard Time)' },
    
    // South America
    { value: 'America/Sao_Paulo', label: 'BRT (Brasilia Time)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'ART (Argentina Time)' },
    { value: 'America/Bogota', label: 'COT (Colombia Time)' },
  ]

  // Generate hour options (0-23)
  const hourOptions = []
  for (let hour = 0; hour < 24; hour++) {
    const displayHour = hour === 0 ? '12 AM' : 
                       hour < 12 ? `${hour} AM` : 
                       hour === 12 ? '12 PM' : 
                       `${hour - 12} PM`
    hourOptions.push({ value: hour.toString().padStart(2, '0'), label: displayHour })
  }

  // Generate minute options (0-59)
  const minuteOptions = []
  for (let minute = 0; minute < 60; minute++) {
    minuteOptions.push({ value: minute.toString().padStart(2, '0'), label: minute.toString().padStart(2, '0') })
  }

  const getMinDate = (tz: string) => {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz })
  }

  const getMaxDate = (tz: string) => {
    const maxDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000) // 31 days to be safe
    return maxDate.toLocaleDateString('en-CA', { timeZone: tz })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!scheduledDate) {
      newErrors.scheduledDate = 'Please select a date'
    } else {
      const todayInTz = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
      
      if (scheduledDate < todayInTz) {
        newErrors.scheduledDate = 'Cannot schedule for past dates'
      }
    }
    
    if (!selectedHour) {
      newErrors.selectedHour = 'Please select an hour'
    }
    
    if (!selectedMinute) {
      newErrors.selectedMinute = 'Please select minutes'
    }
    
    if (selectedHour && selectedMinute && scheduledDate) {
      // Check if selected time is in the past using proper timezone handling
      const todayInTz = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
      
      // Only validate if it's today in the selected timezone
      if (scheduledDate === todayInTz) {
        // Get current time in the selected timezone using Intl.DateTimeFormat
        const nowInTz = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: 'numeric',
          minute: 'numeric'
        }).formatToParts(new Date())
        
        const currentHour = parseInt(nowInTz.find(part => part.type === 'hour')?.value || '0')
        const currentMinute = parseInt(nowInTz.find(part => part.type === 'minute')?.value || '0')
        
        const hour = parseInt(selectedHour)
        const minute = parseInt(selectedMinute)
        
        // Create comparable time values (total minutes since midnight)
        const currentTotalMinutes = currentHour * 60 + currentMinute
        const scheduledTotalMinutes = hour * 60 + minute
        
        // Allow scheduling only if the time is in the future
        if (scheduledTotalMinutes <= currentTotalMinutes) {
          newErrors.selectedHour = 'Cannot schedule for past times on today\'s date'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!targetUser || !validateForm() || !currentUserId || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Combine hour and minute into scheduledTime format
    const timeString = `${selectedHour}:${selectedMinute}`
    
    // Create the scheduled datetime by combining date, time, and timezone
    const scheduledDateTime = new Date(`${scheduledDate}T${timeString}:00`)
    
    try {
      // First, get current user data for email
      const { data: currentUserData, error: userError } = await supabase
        .from('user')
        .select('name, email')
        .eq('id', currentUserId)
        .single()

      if (userError) {
        console.error('Error fetching current user data:', userError)
        throw userError
      }

      // Create the scheduled request
      const { data, error } = await supabase
        .from('scheduled_speaking_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUser.id,
          scheduled_date: scheduledDate,
          scheduled_time: timeString,
          scheduled_datetime: scheduledDateTime.toISOString(),
          timezone: timezone,
          message: message || null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating scheduled request:', error)
        throw error
      }

      console.log('Scheduled request created successfully:', data)

      // Send email notification to the receiver
      try {
        // Get receiver's email from user table
        const { data: receiverData, error: receiverError } = await supabase
          .from('user')
          .select('name, email')
          .eq('id', targetUser.id)
          .single()

        if (receiverError) {
          console.error('Error fetching receiver data:', receiverError)
        } else {
          // Send email notification via API
          const emailResponse = await fetch('/api/email/scheduling', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiverEmail: receiverData.email,
              receiverName: receiverData.name || `${targetUser.first_name} ${targetUser.last_name}`,
              senderName: currentUserData.name || 'Someone',
              scheduledDate: scheduledDate,
              scheduledTime: timeString,
              timezone: timezone,
              message: message || undefined
            })
          })

          if (emailResponse.ok) {
            console.log('Email notification sent successfully')
          } else {
            console.error('Failed to send email notification')
          }
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
        // Don't throw here - the scheduling was successful even if email failed
      }
      
      // Call success callback if provided
      if (onScheduleSuccess) {
        onScheduleSuccess(data)
      }

      // Reset form
      setScheduledDate('')
      setSelectedHour('')
      setSelectedMinute('')
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      setMessage('')
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error scheduling request:', error)
      // You can add error state here if needed
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !targetUser) return null

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-3 lg:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Schedule Speaking Session</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Target User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {targetUser.first_name} {targetUser.last_name}
              </h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Badge variant={targetUser.is_online ? "default" : "secondary"} className="text-xs">
                  {targetUser.is_online ? 'Online' : 'Offline'}
                </Badge>
                <span>•</span>
                <span>{targetUser.total_sessions} sessions</span>
              </div>
            </div>
          </div>

          {/* Timezone Selection */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Timezone (Auto-detected: {Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
            </Label>
            <select 
              id="timezone"
              value={timezone} 
              onChange={(e) => {
                setTimezone(e.target.value)
                // Reset hour and minute selections when timezone changes
                setSelectedHour('')
                setSelectedMinute('')
                // Clear any time-related errors
                if (errors.selectedHour || errors.selectedMinute) {
                  setErrors(prev => ({ 
                    ...prev, 
                    selectedHour: '', 
                    selectedMinute: '' 
                  }))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">
              <p>Your timezone was automatically detected. You can change it if needed.</p>
              <p className="mt-1">
                Current time in {timezone}: {getCurrentTimeInTimezone(timezone)}
              </p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Date</span>
            </Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => {
                setScheduledDate(e.target.value)
                if (errors.scheduledDate) {
                  setErrors(prev => ({ ...prev, scheduledDate: '' }))
                }
                // Clear time error if date changes from today to future date
                if (errors.selectedHour && e.target.value) {
                  const selectedDateStr = e.target.value
                  
                  // Get today's date in the selected timezone
                  const todayInSelectedTz = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
                  
                  if (selectedDateStr !== todayInSelectedTz) {
                    setErrors(prev => ({ ...prev, selectedHour: '' }))
                  } else if (selectedHour && selectedMinute) {
                    // Re-validate time if still today using selected timezone
                    const nowInTz = new Intl.DateTimeFormat('en-US', {
                      timeZone: timezone,
                      hour12: false,
                      hour: 'numeric',
                      minute: 'numeric'
                    }).formatToParts(new Date())
                    
                    const currentHour = parseInt(nowInTz.find(part => part.type === 'hour')?.value || '0')
                    const currentMinute = parseInt(nowInTz.find(part => part.type === 'minute')?.value || '0')
                    const selectedHourNum = parseInt(selectedHour)
                    const selectedMinuteNum = parseInt(selectedMinute)
                    
                    // Compare total minutes since midnight
                    const currentTotalMinutes = currentHour * 60 + currentMinute
                    const scheduledTotalMinutes = selectedHourNum * 60 + selectedMinuteNum
                    
                    if (scheduledTotalMinutes <= currentTotalMinutes) {
                      setErrors(prev => ({ ...prev, selectedHour: 'Cannot schedule for past times on today\'s date' }))
                    }
                  }
                }
              }}
              min={getMinDate(timezone)}
              max={getMaxDate(timezone)}
              className={errors.scheduledDate ? 'border-red-500' : ''}
              required
            />
            {errors.scheduledDate && (
              <p className="text-sm text-red-600">{errors.scheduledDate}</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Time</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {/* Hour Selection */}
              <div className="space-y-1">
                <Label htmlFor="selectedHour" className="text-sm text-gray-600">Hour</Label>
                <select 
                  id="selectedHour"
                  value={selectedHour} 
                  onChange={(e) => {
                    setSelectedHour(e.target.value)
                    if (errors.selectedHour) {
                      setErrors(prev => ({ ...prev, selectedHour: '' }))
                    }
                    // Validate immediately if date is selected and it's today
                    if (scheduledDate && e.target.value && selectedMinute) {
                      const selectedDateStr = scheduledDate
                      
                      // Get today's date in the selected timezone
                      const todayInSelectedTz = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
                      
                      if (selectedDateStr === todayInSelectedTz) {
                        // Get current time in the selected timezone using Intl.DateTimeFormat
                        const nowInTz = new Intl.DateTimeFormat('en-US', {
                          timeZone: timezone,
                          hour12: false,
                          hour: 'numeric',
                          minute: 'numeric'
                        }).formatToParts(new Date())
                        
                        const currentHour = parseInt(nowInTz.find(part => part.type === 'hour')?.value || '0')
                        const currentMinute = parseInt(nowInTz.find(part => part.type === 'minute')?.value || '0')
                        const selectedHourNum = parseInt(e.target.value)
                        const selectedMinuteNum = parseInt(selectedMinute)
                        
                        // Compare total minutes since midnight
                        const currentTotalMinutes = currentHour * 60 + currentMinute
                        const scheduledTotalMinutes = selectedHourNum * 60 + selectedMinuteNum
                        
                        if (scheduledTotalMinutes <= currentTotalMinutes) {
                          setErrors(prev => ({ ...prev, selectedHour: 'Cannot schedule for past times on today\'s date' }))
                        }
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.selectedHour ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Hour</option>
                  {hourOptions.map((hour) => (
                    <option key={hour.value} value={hour.value}>
                      {hour.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Minute Selection */}
              <div className="space-y-1">
                <Label htmlFor="selectedMinute" className="text-sm text-gray-600">Minutes</Label>
                <select 
                  id="selectedMinute"
                  value={selectedMinute} 
                  onChange={(e) => {
                    setSelectedMinute(e.target.value)
                    if (errors.selectedMinute) {
                      setErrors(prev => ({ ...prev, selectedMinute: '' }))
                    }
                    // Validate immediately if date is selected and it's today
                    if (scheduledDate && selectedHour && e.target.value) {
                      const selectedDateStr = scheduledDate
                      
                      // Get today's date in the selected timezone
                      const todayInSelectedTz = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
                      
                      if (selectedDateStr === todayInSelectedTz) {
                        // Get current time in the selected timezone using Intl.DateTimeFormat
                        const nowInTz = new Intl.DateTimeFormat('en-US', {
                          timeZone: timezone,
                          hour12: false,
                          hour: 'numeric',
                          minute: 'numeric'
                        }).formatToParts(new Date())
                        
                        const currentHour = parseInt(nowInTz.find(part => part.type === 'hour')?.value || '0')
                        const currentMinute = parseInt(nowInTz.find(part => part.type === 'minute')?.value || '0')
                        const selectedHourNum = parseInt(selectedHour)
                        const selectedMinuteNum = parseInt(e.target.value)
                        
                        // Compare total minutes since midnight
                        const currentTotalMinutes = currentHour * 60 + currentMinute
                        const scheduledTotalMinutes = selectedHourNum * 60 + selectedMinuteNum
                        
                        if (scheduledTotalMinutes <= currentTotalMinutes) {
                          setErrors(prev => ({ ...prev, selectedHour: 'Cannot schedule for past times on today\'s date' }))
                        }
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.selectedMinute ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Min</option>
                  {minuteOptions.map((minute) => (
                    <option key={minute.value} value={minute.value}>
                      {minute.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(errors.selectedHour || errors.selectedMinute) && (
              <p className="text-sm text-red-600">{errors.selectedHour || errors.selectedMinute}</p>
            )}
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Message (Optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a message for your scheduling request..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{message.length}/500 characters</p>
          </div>

          {/* Footer Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? 'Scheduling...' : 'Schedule Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}