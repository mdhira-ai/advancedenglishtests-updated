'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { OTPService } from '@/lib/otp-service'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email')
  const [otpId, setOtpId] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    
    try {
      // Check if user exists
      const userCheck = await OTPService.checkUserExists(email)
      if (!userCheck.exists) {
        setError('Email address not found. Please check your email or create an account.')
        setLoading(false)
        return
      }

      // Create OTP
      const otpResult = await OTPService.createOTP(userCheck.user!.id, email)
      if (!otpResult.success) {
        setError(otpResult.error || 'Failed to generate OTP')
        setLoading(false)
        return
      }

      // Send email
      const emailResult = await OTPService.sendOTPEmail(email, otpResult.data!.otpCode)
      if (!emailResult.success) {
        setError(emailResult.error || 'Failed to send email')
        setLoading(false)
        return
      }

      setMessage('OTP sent to your email! Please check your inbox.')
      setOtpId(otpResult.data!.id.toString())
      setStep('verify')
    } catch (error: any) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      setLoading(false)
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }
    
    try {
      const result = await OTPService.resetPassword(email, otp, newPassword)

      if (result.success) {
        setMessage('Password reset successfully! You can now login with your new password.')
        setStep('reset')
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (error: any) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    setError('')
    setMessage('')
    
    try {
      // Get user data
      const userCheck = await OTPService.checkUserExists(email)
      if (!userCheck.exists) {
        setError('User not found')
        setResendLoading(false)
        return
      }

      // Create new OTP
      const otpResult = await OTPService.createOTP(userCheck.user!.id, email)
      if (!otpResult.success) {
        setError(otpResult.error || 'Failed to generate OTP')
        setResendLoading(false)
        return
      }

      // Send email
      const emailResult = await OTPService.sendOTPEmail(email, otpResult.data!.otpCode)
      if (!emailResult.success) {
        setError(emailResult.error || 'Failed to send email')
        setResendLoading(false)
        return
      }

      setMessage('New OTP sent to your email!')
      setOtpId(otpResult.data!.id.toString())
      setOtp('') // Clear the previous OTP
    } catch (error: any) {
      setError('Network error. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const resetForm = () => {
    setStep('email')
    setEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('')
    setError('')
    setOtpId('')
    setResendLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {step === 'email' && 'Reset Password'}
            {step === 'verify' && 'Verify OTP'}
            {step === 'reset' && 'Password Reset Complete'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && 'Enter your email address to receive an OTP'}
            {step === 'verify' && 'Enter the OTP sent to your email and your new password'}
            {step === 'reset' && 'Your password has been successfully reset'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP & Reset Password'}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={resetForm}
                  disabled={loading || resendLoading}
                >
                  Back to Email
                </Button>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={handleResendOTP}
                  disabled={loading || resendLoading}
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={resetForm}
              >
                Reset Another Password
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
