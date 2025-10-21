'use client'

import { useEffect, useRef } from 'react'
import { useSession } from '@/lib/auth-client'
import { supabase } from '@/lib/supabase'

interface PageViewTrackerProps {
  book: string
  module: string
  testNumber: number
}

export function PageViewTracker({ book, module, testNumber }: PageViewTrackerProps) {
  const { data: session } = useSession()
  const hasTracked = useRef(false)
  const isTracking = useRef(false)

  useEffect(() => {
    // Only track once per component mount and prevent concurrent requests
    if (hasTracked.current || isTracking.current) {
      return
    }

    const trackPageView = async () => {
      // Prevent concurrent tracking requests
      if (isTracking.current) {
        return
      }
      
      isTracking.current = true
      
      try {
        console.log('PageViewTracker: Starting to track page view', { book, module, testNumber })
        
        // Get real IP address from server
        let ipAddress = 'unknown'
        try {
          const ipResponse = await fetch('/api/get-ip')
          const ipData = await ipResponse.json()
          ipAddress = ipData.ip || 'unknown'
          console.log('PageViewTracker: Retrieved IP address', ipAddress)
        } catch (ipError) {
          console.warn('PageViewTracker: Failed to get IP address, using unknown', ipError)
        }

        const userId = session?.user?.id || null
        const clickDate = new Date().toISOString().split('T')[0]

        console.log('PageViewTracker: User info', { userId, isLoggedIn: !!userId, ipAddress })

        // Check for existing click record for this IP, book, module, test, and date
        const { data: existingClick, error: clickFindError } = await supabase
          .from('daily_test_clicks')
          .select('*')
          .eq('book', book)
          .eq('module', module)
          .eq('test_number', testNumber)
          .eq('ip_address', ipAddress)
          .eq('click_date', clickDate)
          .single()

        if (clickFindError && clickFindError.code !== 'PGRST116') {
          console.error('PageViewTracker: Error finding existing click:', clickFindError)
          return
        }

        if (existingClick) {
          console.log('PageViewTracker: Found existing click for same IP, incrementing count', existingClick)
          const { error: clickUpdateError } = await supabase
            .from('daily_test_clicks')
            .update({ click_count: existingClick.click_count + 1 })
            .eq('id', existingClick.id)

          if (clickUpdateError) {
            console.error('PageViewTracker: Error updating click count:', clickUpdateError)
          } else {
            console.log('PageViewTracker: Successfully updated click count')
          }
        } else {
          console.log('PageViewTracker: Creating new click record with IP address')
          const { error: clickInsertError } = await supabase
            .from('daily_test_clicks')
            .insert({
              book,
              module,
              test_number: testNumber,
              user_id: userId,
              ip_address: ipAddress,
              click_date: clickDate,
              click_count: 1,
            })

          if (clickInsertError) {
            console.error('PageViewTracker: Error creating click record:', clickInsertError)
          } else {
            console.log('PageViewTracker: Successfully created click record')
          }
        }

        // Mark as tracked after successful completion
        hasTracked.current = true
      } catch (error) {
        console.error('PageViewTracker: Error tracking page view:', error)
      } finally {
        isTracking.current = false
      }
    }

    trackPageView()
  }, [book, module, testNumber]) // Removed session dependency

  return null // This component doesn't render anything
}