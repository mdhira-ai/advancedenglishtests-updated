'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageCircle, Phone, MapPin, Send, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/auth-client"
import { useContactFormRealtime } from "@/hooks/useSupabaseRealtime"
import { z } from "zod"



interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
  inquiryType: string
}

// Validation schema
const contactFormSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name must contain only letters and spaces"),
  lastName: z.string()
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]*$/, "Last name must contain only letters and spaces")
    .optional(),
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email must be less than 254 characters"),
  subject: z.string()
    .min(1, "Subject is required")
    .max(500, "Subject must be less than 500 characters"),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
  inquiryType: z.enum(['general', 'technical', 'billing', 'feedback', 'bug_report', 'feature_request'])
})

export default function ContactSection() {
  const { data: session } = useSession()
  const contactRealtime = useContactFormRealtime(session?.user?.id)
  
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Handle realtime updates
  useEffect(() => {
    if (contactRealtime.payload && contactRealtime.payload.eventType === 'UPDATE') {
      const updatedSubmission = contactRealtime.payload.new
      if (updatedSubmission.status === 'replied') {
        // Show notification that admin replied
        setSubmitStatus('success')
        setSubmitMessage('Admin has replied to your message! Check your email.')
      }
    }
  }, [contactRealtime.payload])

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

  // Handle form submission with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitStatus('idle')

    try {
      // Validate form data
      const validatedData = contactFormSchema.parse(formData)
      
      // Get user's IP address
      const ipAddress = await getUserIP()
      
      // Prepare submission data
      const submissionData = {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName || null,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        inquiry_type: validatedData.inquiryType,
        user_id: session?.user?.id || null,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        status: 'new'
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('contact_form_submissions')
        .insert([submissionData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
      }

      // Success
      setSubmitStatus('success')
      setSubmitMessage('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.')
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: '',
        inquiryType: 'general'
      })

    } catch (error) {
      console.error('Form submission error:', error)
      
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const errors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          if (issue.path && issue.path.length > 0) {
            const fieldName = String(issue.path[0])
            errors[fieldName] = issue.message
          }
        })
        setFieldErrors(errors)
        setSubmitStatus('error')
        setSubmitMessage('Please fix the errors below and try again.')
      } else {
        setSubmitStatus('error')
        setSubmitMessage('Failed to send message. Please try again later.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' }
  ]



  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6" style={{backgroundColor: '#e3f2fd', color: '#1A3A6E'}}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Get Expert Support
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Need Help? We're Here for You!
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Have questions about IELTS preparation, technical issues, or need personalized guidance? 
            Our expert team is ready to help you succeed in your English mastery journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <Send className="w-6 h-6 mr-3" style={{color: '#1A3A6E'}} />
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Fill out the form below and we'll respond within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitStatus !== 'idle' && (
                  <div className={`mb-6 p-4 rounded-lg flex items-center ${
                    submitStatus === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {submitStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    )}
                    <span>{submitMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            firstName: e.target.value
                          })
                          setFieldErrors({
                            ...fieldErrors,
                            firstName: ''
                          })
                        }}
                        className={`mt-1 ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                        placeholder="Your first name"
                        maxLength={50}
                        autoComplete="given-name"
                        spellCheck={false}
                      />
                      {fieldErrors.firstName && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            lastName: e.target.value
                          })
                          setFieldErrors({
                            ...fieldErrors,
                            lastName: ''
                          })
                        }}
                        className={`mt-1 ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                        placeholder="Your last name"
                        maxLength={50}
                        autoComplete="family-name"
                        spellCheck={false}
                      />
                      {fieldErrors.lastName && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          email: e.target.value
                        })
                        setFieldErrors({
                          ...fieldErrors,
                          email: ''
                        })
                      }}
                      className={`mt-1 ${fieldErrors.email ? 'border-red-500' : ''}`}
                      placeholder="your.email@example.com"
                      maxLength={254}
                      autoComplete="email"
                      spellCheck={false}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="inquiryType" className="text-sm font-medium text-gray-700">
                      Inquiry Type *
                    </Label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      required
                      value={formData.inquiryType}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          inquiryType: e.target.value
                        })
                      }}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          subject: e.target.value
                        })
                        setFieldErrors({
                          ...fieldErrors,
                          subject: ''
                        })
                      }}
                      className={`mt-1 ${fieldErrors.subject ? 'border-red-500' : ''}`}
                      placeholder="Brief description of your inquiry"
                      maxLength={500}
                      spellCheck={true}
                    />
                    {fieldErrors.subject && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          message: e.target.value
                        })
                        setFieldErrors({
                          ...fieldErrors,
                          message: ''
                        })
                      }}
                      className={`mt-1 ${fieldErrors.message ? 'border-red-500' : ''}`}
                      placeholder="Please provide detailed information about your question or issue..."
                      rows={6}
                      maxLength={5000}
                      spellCheck={true}
                    />
                    {fieldErrors.message && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                    style={{backgroundColor: '#1A3A6E'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f2847'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A3A6E'}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 text-white" style={{backgroundColor: '#1A3A6E'}}>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p style={{color: '#b3d4fc'}}>support@advancedenglishtest.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MessageCircle className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p style={{color: '#b3d4fc'}}>Available 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p style={{color: '#b3d4fc'}}>Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Help</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" style={{color: '#ff8c42'}} />
                    <span>Test Instructions & FAQs</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" style={{color: '#ff8c42'}} />
                    <span>Technical Troubleshooting</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" style={{color: '#ff8c42'}} />
                    <span>Account & Billing Support</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" style={{color: '#ff8c42'}} />
                    <span>Study Guidance & Tips</span>
                  </div>
                </div>
              </CardContent>
            </Card>

           
          </div>
        </div>
      </div>
    </div>
  )
}
