'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface VisitorData {
  id?: number
  ipAddress: string
  countryName?: string
  countryCode?: string
  city?: string
  region?: string
  currentPage?: string
  userAgent?: string
  visitCount: number
  createdAt: Date
  lastUpdated: Date
}

interface VisitorContextType {
  currentVisitor: VisitorData | null
  isTracking: boolean
  isLoading: boolean
  error: string | null
  totalVisitors: number
  onlineVisitors: VisitorData[]
  refreshVisitorData: () => Promise<void>
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined)

// Function to map database record to VisitorData interface
const mapDatabaseToVisitorData = (dbRecord: any): VisitorData => ({
  id: dbRecord.id,
  ipAddress: dbRecord.ip_address,
  countryName: dbRecord.country_name,
  countryCode: dbRecord.country_code,
  city: dbRecord.city,
  region: dbRecord.region,
  currentPage: dbRecord.current_page,
  userAgent: dbRecord.user_agent,
  visitCount: dbRecord.visit_count,
  createdAt: new Date(dbRecord.created_at),
  lastUpdated: new Date(dbRecord.last_updated)
})

// Function to normalize IP address
const normalizeIPAddress = (ip: string): string => {
  if (!ip || ip === 'unknown') return 'unknown'
  
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') {
    return '127.0.0.1' // Convert IPv6 localhost to IPv4 localhost
  }
  
  // Handle IPv4 mapped IPv6 addresses (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '')
  }
  
  // For other IPv6 addresses, replace colons with dashes to make them database-friendly
  if (ip.includes(':') && !ip.includes('.')) {
    return ip.replace(/:/g, '-')
  }
  
  return ip.trim()
}

// Function to get IP address
const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('/api/get-ip', {
      method: 'GET',
      cache: 'no-store'
    })
    const data = await response.json()
    const rawIP = data.ip || 'unknown'
    return normalizeIPAddress(rawIP)
  } catch (error) {
    console.error('Error fetching IP:', error)
    return 'unknown'
  }
}

// Function to get country information from IP
const getCountryFromIP = async (ip: string) => {
  // Handle localhost and private/invalid IPs
  if (ip === 'unknown' || ip === 'localhost' || ip === '127.0.0.1' || 
      ip.startsWith('192.168.') || ip.startsWith('10.') || 
      ip.startsWith('172.') || ip.includes('-')) {
    return {
      countryName: 'Local/Private',
      countryCode: 'XX',
      city: 'Local',
      region: 'Local'
    }
  }

  try {
    // Using IPGeolocation.io API
    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=ea5da57cd5fe43d48c8a9e732329c7d7&ip=${ip}`)
    if (!response.ok) throw new Error('Failed to fetch location')
    
    const data = await response.json()
    return {
      countryName: data.country_name || 'Unknown',
      countryCode: data.country_code2 || 'XX',
      city: data.city || 'Unknown',
      region: data.state_prov || 'Unknown'
    }
  } catch (error) {
    console.error('Error fetching country info:', error)
    return {
      countryName: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
      region: 'Unknown'
    }
  }
}

// Database operations for visitors table
const upsertVisitor = async (visitorData: Omit<VisitorData, 'id' | 'createdAt' | 'lastUpdated' | 'visitCount'>) => {
  try {
    // Validate IP address
    if (!visitorData.ipAddress || visitorData.ipAddress === 'unknown') {
      console.warn('Invalid IP address provided to upsertVisitor:', visitorData.ipAddress)
      return null
    }

    // First, try to find existing visitor
    const { data: existingVisitor, error: findError } = await supabase
      .from('visitors')
      .select('*')
      .eq('ip_address', visitorData.ipAddress)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error finding visitor:', {
        error: findError,
        message: findError.message || 'Unknown error',
        code: findError.code || 'No code',
        ipAddress: visitorData.ipAddress
      })
      return null
    }

    if (existingVisitor) {
      // Update existing visitor
      const { data: updatedVisitor, error: updateError } = await supabase
        .from('visitors')
        .update({
          current_page: visitorData.currentPage,
          user_agent: visitorData.userAgent,
          visit_count: existingVisitor.visit_count + 1,
          last_updated: new Date().toISOString()
        })
        .eq('ip_address', visitorData.ipAddress)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating visitor:', updateError)
        return null
      }

      return mapDatabaseToVisitorData(updatedVisitor)
    } else {
      // Create new visitor
      const { data: newVisitor, error: insertError } = await supabase
        .from('visitors')
        .insert({
          ip_address: visitorData.ipAddress,
          country_name: visitorData.countryName,
          country_code: visitorData.countryCode,
          city: visitorData.city,
          region: visitorData.region,
          current_page: visitorData.currentPage,
          user_agent: visitorData.userAgent,
          visit_count: 1
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting visitor:', insertError)
        return null
      }

      return mapDatabaseToVisitorData(newVisitor)
    }
  } catch (error) {
    console.error('Error upserting visitor:', error)
    return null
  }
}

// Get total visitor count
const getTotalVisitorCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error getting visitor count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting visitor count:', error)
    return 0
  }
}

export function VisitorTrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [currentVisitor, setCurrentVisitor] = useState<VisitorData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalVisitors, setTotalVisitors] = useState(0)
  const [onlineVisitors, setOnlineVisitors] = useState<VisitorData[]>([])
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null)

  // Function to refresh visitor data
  const refreshVisitorData = useCallback(async () => {
    const count = await getTotalVisitorCount()
    setTotalVisitors(count)
  }, [])

  // Initialize visitor tracking
  const initializeVisitorTracking = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get IP address
      const ip = await getIPAddress()
      if (ip === 'unknown') {
        setError('Unable to detect IP address')
        return
      }

      // Get country information
      const locationInfo = await getCountryFromIP(ip)

      // Get user agent
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'

      // Prepare visitor data
      const visitorData = {
        ipAddress: ip,
        countryName: locationInfo.countryName,
        countryCode: locationInfo.countryCode,
        city: locationInfo.city,
        region: locationInfo.region,
        currentPage: pathname,
        userAgent: userAgent
      }

      // Upsert visitor in database
      const visitor = await upsertVisitor(visitorData)
      if (visitor) {
        setCurrentVisitor(visitor)
        setIsTracking(true)
      } else {
        setError('Failed to track visitor')
      }

      // Setup Realtime Presence
      const channel = supabase.channel('visitor-presence', {
        config: {
          presence: {
            key: ip, // Use IP as unique key
          },
        },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const visitors: VisitorData[] = []

          Object.entries(state).forEach(([key, presences]) => {
            if (Array.isArray(presences) && presences.length > 0) {
              const presence = presences[0] as any
              if (presence.visitor_data) {
                visitors.push(presence.visitor_data)
              }
            }
          })

          setOnlineVisitors(visitors)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Visitor joined:', key)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Visitor left:', key)
        })

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceData = {
            visitor_data: {
              ...visitorData,
              online_at: new Date().toISOString(),
            }
          }

          const presenceTrackStatus = await channel.track(presenceData)
          if (presenceTrackStatus === 'ok') {
            console.log('Successfully tracking visitor presence')
          } else {
            setError('Failed to track visitor presence')
          }
        }
      })

      setPresenceChannel(channel)

      // Refresh total visitor count
      await refreshVisitorData()

    } catch (err) {
      console.error('Error initializing visitor tracking:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize visitor tracking')
    } finally {
      setIsLoading(false)
    }
  }, [pathname, refreshVisitorData])

  // Update current page when pathname changes
  const updateCurrentPage = useCallback(async () => {
    if (currentVisitor && isTracking) {
      try {
        const { error: updateError } = await supabase
          .from('visitors')
          .update({
            current_page: pathname,
            last_updated: new Date().toISOString()
          })
          .eq('ip_address', currentVisitor.ipAddress)

        if (!updateError && presenceChannel) {
          // Update presence data with new page
          const presenceData = {
            visitor_data: {
              ...currentVisitor,
              currentPage: pathname,
              online_at: new Date().toISOString(),
            }
          }
          await presenceChannel.track(presenceData)
        }
      } catch (error) {
        console.error('Error updating current page:', error)
      }
    }
  }, [currentVisitor, isTracking, pathname, presenceChannel])

  // Initialize tracking on mount
  useEffect(() => {
    initializeVisitorTracking()

    // Cleanup function
    return () => {
      if (presenceChannel) {
        presenceChannel.untrack()
        presenceChannel.unsubscribe()
      }
    }
  }, []) // Only run once on mount

  // Update page when pathname changes
  useEffect(() => {
    if (currentVisitor && isTracking) {
      updateCurrentPage()
    }
  }, [pathname, updateCurrentPage])

  // Listen to database changes for real-time visitor updates
  useEffect(() => {
    const channel = supabase
      .channel('visitor-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'visitors' }, 
        (payload) => {
          console.log('Visitor data changed:', payload)
          // Refresh visitor count when changes occur
          refreshVisitorData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshVisitorData])

  const value: VisitorContextType = {
    currentVisitor,
    isTracking,
    isLoading,
    error,
    totalVisitors,
    onlineVisitors,
    refreshVisitorData
  }

  return (
    <VisitorContext.Provider value={value}>
      {children}
    </VisitorContext.Provider>
  )
}

export function useVisitorTracking() {
  const context = useContext(VisitorContext)
  if (context === undefined) {
    throw new Error('useVisitorTracking must be used within a VisitorTrackingProvider')
  }
  return context
}

// Optional: Export individual hooks for specific data
export function useVisitorCount() {
  const { totalVisitors } = useVisitorTracking()
  return totalVisitors
}

export function useOnlineVisitors() {
  const { onlineVisitors } = useVisitorTracking()
  return onlineVisitors
}

export function useCurrentVisitor() {
  const { currentVisitor } = useVisitorTracking()
  return currentVisitor
}