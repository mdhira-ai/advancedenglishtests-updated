'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/auth-client"
import { useNewsletterRealtime } from "@/hooks/useSupabaseRealtime"
import { z } from "zod"

// Validation schema
const newsletterSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email must be less than 254 characters")
})

export default function SimpleNewsletterSignup() {
  const { data: session } = useSession()
  const newsletterRealtime = useNewsletterRealtime(session?.user?.id)
  
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  // Handle realtime updates
  useEffect(() => {
    if (newsletterRealtime.payload) {
      const payload = newsletterRealtime.payload
      console.log('Newsletter subscription updated:', payload)
      
      if (payload.eventType === 'UPDATE' && payload.new.status === 'unsubscribed') {
        setStatus('error')
        setMessage('You have been unsubscribed from the newsletter.')
      }
    }
  }, [newsletterRealtime.payload])

  // Get user's IP address for tracking
  const getUserIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/get-ip')
      const data = await response.json()
      return data.ip || null
    } catch (error) {
      console.error('Failed to get IP:', error)
      return null
    }
  }

  // Generate confirmation token
  const generateConfirmationToken = (): string => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => 
      b.toString(16).padStart(2, '0')
    ).join('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setEmailError('')
    setStatus('idle')

    try {
      // Validate email
      const validatedData = newsletterSchema.parse({ email })
      
      // Check if email already exists
      const { data: existingSubscription } = await supabase
        .from('newsletter_subscriptions')
        .select('email, status')
        .eq('email', validatedData.email)
        .single()

      if (existingSubscription) {
        if (existingSubscription.status === 'active') {
          setStatus('error')
          setMessage('This email is already subscribed to our newsletter.')
          return
        } else if (existingSubscription.status === 'unsubscribed') {
          // Reactivate subscription
          const { error: updateError } = await supabase
            .from('newsletter_subscriptions')
            .update({ 
              status: 'active',
              subscription_date: new Date().toISOString(),
              unsubscribe_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('email', validatedData.email)

          if (updateError) {
            throw new Error(updateError.message)
          }

          setStatus('success')
          setMessage('Welcome back! Your subscription has been reactivated.')
          setEmail('')
          return
        }
      }
      
      // Get user's IP address
      const ipAddress = await getUserIP()
      
      // Generate confirmation token
      const confirmationToken = generateConfirmationToken()
      
      // Prepare subscription data
      const subscriptionData = {
        email: validatedData.email,
        status: 'active', // For simplicity, we're making it active immediately
        user_id: session?.user?.id || null,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        confirmation_token: confirmationToken,
        confirmed_at: new Date().toISOString() // Auto-confirm for now
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert([subscriptionData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
      }

      // Success
      setStatus('success')
      setMessage('Successfully subscribed! Welcome to our newsletter.')
      setEmail('')

    } catch (error) {
      console.error('Newsletter subscription error:', error)
      
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const emailIssue = error.issues.find(issue => 
          issue.path && issue.path.length > 0 && String(issue.path[0]) === 'email'
        )
        if (emailIssue) {
          setEmailError(emailIssue.message)
        }
        setStatus('error')
        setMessage('Please enter a valid email address.')
      } else {
        setStatus('error')
        setMessage('Failed to subscribe. Please try again later.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
      <div className="flex items-center mb-3">
        <Mail className="w-5 h-5 mr-2 text-white" />
        <h4 className="text-lg font-semibold text-white">Stay Updated</h4>
      </div>
      
      {status !== 'idle' && (
        <div className={`mb-3 p-2 rounded flex items-center text-sm ${
          status === 'success' 
            ? 'bg-green-500/20 text-green-100' 
            : 'bg-red-500/20 text-red-100'
        }`}>
          {status === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2" />
          )}
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailError('')
          }}
          required
          className={`bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-white focus:ring-white ${emailError ? 'border-red-400' : ''}`}
          maxLength={254}
          autoComplete="email"
          spellCheck={false}
        />
        {emailError && (
          <p className="text-xs text-red-300 mt-1">{emailError}</p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-gray-900 hover:bg-gray-100 font-medium"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
              Subscribing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Subscribe
            </>
          )}
        </Button>
      </form>
      
      <p className="text-xs text-gray-300 mt-2">
        Get IELTS tips & updates. Unsubscribe anytime.
      </p>
    </div>
  )
}
