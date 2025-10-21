import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export interface OTPVerification {
  id: number
  userId: string
  email: string
  otpCode: string
  purpose: string
  expiresAt: string
  isUsed: boolean
  createdAt: string
}

export class OTPService {
  // Generate a 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Check if user exists by email
  static async checkUserExists(email: string) {
    const { data, error } = await supabase
      .from('user')
      .select('id, email')
      .eq('email', email)
      .single()

    if (error || !data) {
      return { exists: false, user: null }
    }

    return { exists: true, user: data }
  }

  // Clean up old unused OTPs for the email
  static async cleanupOldOTPs(email: string, purpose: string = 'password_reset') {
    const { error } = await supabase
      .from('otp_verifications')
      .delete()
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('isUsed', false)

    return { error }
  }

  // Create new OTP record
  static async createOTP(userId: string, email: string, purpose: string = 'password_reset') {
    const otpCode = this.generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // First cleanup old OTPs
    await this.cleanupOldOTPs(email, purpose)

    const { data, error } = await supabase
      .from('otp_verifications')
      .insert({
        userId,
        email,
        otpCode,
        purpose,
        expiresAt: expiresAt.toISOString(),
        isUsed: false
      })
      .select('id, otpCode')
      .single()

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, error: null, data }
  }

  // Verify OTP
  static async verifyOTP(email: string, otpCode: string, purpose: string = 'password_reset') {
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('otpCode', otpCode)
      .eq('purpose', purpose)
      .eq('isUsed', false)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid or expired OTP', otpRecord: null }
    }

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(data.expiresAt)

    if (now > expiresAt) {
      return { valid: false, error: 'OTP has expired. Please request a new one.', otpRecord: null }
    }

    return { valid: true, error: null, otpRecord: data }
  }

  // Mark OTP as used
  static async markOTPAsUsed(otpId: number) {
    const { error } = await supabase
      .from('otp_verifications')
      .update({ isUsed: true })
      .eq('id', otpId)

    return { success: !error, error: error?.message || null }
  }

  // Update user password hash
  static async updateUserPassword(userId: string, password: string) {
    // Hash the password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    const { error } = await supabase
      .from('account')
      .update({ 
        password: passwordHash,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)

    return { success: !error, error: error?.message || null }
  }

  // Send OTP email using fetch to a simplified API endpoint
  static async sendOTPEmail(email: string, otpCode: string) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          to: email, 
          subject: 'Password Reset OTP - Advanced English Tests',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>You have requested to reset your password. Please use the following OTP code:</p>
              <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                ${otpCode}
              </div>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <p>Best regards,<br>Advanced English Tests Team</p>
            </div>
          `
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Complete password reset process
  static async resetPassword(email: string, otpCode: string, newPassword: string) {
    try {
      // 1. Verify OTP
      const otpVerification = await this.verifyOTP(email, otpCode)
      if (!otpVerification.valid) {
        return { success: false, error: otpVerification.error }
      }

      // 2. Get user data
      const userCheck = await this.checkUserExists(email)
      if (!userCheck.exists) {
        return { success: false, error: 'User not found' }
      }

      // 3. Update password
      const passwordUpdate = await this.updateUserPassword(userCheck.user!.id, newPassword)
      if (!passwordUpdate.success) {
        return { success: false, error: passwordUpdate.error }
      }

      // 4. Mark OTP as used
      await this.markOTPAsUsed(otpVerification.otpRecord!.id)

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}