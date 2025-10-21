import nodemailer from 'nodemailer'

// Create email transporter using environment variables
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing')
  }

  return nodemailer.createTransport({
   host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Don't fail on invalid certs (for development/self-signed certificates)
        rejectUnauthorized: false,
      },
  })
}

interface SchedulingNotificationParams {
  receiverEmail: string
  receiverName: string
  senderName: string
  scheduledDate: string
  scheduledTime: string
  timezone: string
  message?: string
}

// Shared function to format datetime the same way as ScheduledRequests component
const formatDateTime = (dateStr: string, timeStr: string, timezone: string) => {
  try {
    const date = new Date(`${dateStr}T${timeStr}`)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      timezone: timezone
    }
  } catch (error) {
    return { date: dateStr, time: timeStr, timezone }
  }
}

export async function sendSchedulingNotification({
  receiverEmail,
  receiverName,
  senderName,
  scheduledDate,
  scheduledTime,
  timezone,
  message
}: SchedulingNotificationParams) {
  try {
    const transporter = createTransporter()

    // Use the same formatting function as ScheduledRequests component
    const { date: formattedDate, time: formattedTime } = formatDateTime(
      scheduledDate, 
      scheduledTime, 
      timezone
    )

    const htmlContent = `
      <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; font-family: Arial, sans-serif;">
        <!-- Header -->
        <tr>
            <td style="padding: 20px; text-align: center; background-color: #1A3A6E;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">AdvancedEnglishTests</h1>
                <p style="color: #ffffff; margin: 8px 0 0; font-size: 16px;">Conquer IELTS with Free Practice Tools, Live the Life You Dream</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <h2 style="color: #1A3A6E; text-align: center; margin-bottom: 20px;">🗓️ New Speaking Session Scheduled!</h2>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Hi <strong>${receiverName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            <strong>${senderName}</strong> has scheduled a speaking session with you.
          </p>
          
          <!-- Session Details -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">📅 Session Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 120px;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Timezone:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${timezone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Partner:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${senderName}</td>
              </tr>
            </table>
          </div>
          
          ${message ? `
          <!-- Message from Sender -->
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">💬 Message from ${senderName}:</h4>
            <p style="color: #1f2937; margin: 0; font-style: italic;">"${message}"</p>
          </div>
          ` : ''}
          
          <!-- Action Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; margin-bottom: 15px;">You can manage this session in your dashboard:</p>
            <a href="https://advancedenglishtests.com/speaking" 
               style="display: inline-block; background-color: #1A3A6E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px;">
              View Speaking Dashboard
            </a>
          </div>
          
          <!-- Instructions -->
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">📋 What's Next?</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>You can accept, reschedule, or decline this session in your dashboard</li>
              <li>Make sure to be online a 10 minutes before the scheduled time</li>
            </ul>
          </div>
          
          <!-- Footer -->
          </td>
        </tr>
        <tr>
            <td style="padding: 20px; background-color: #f4f4f4; text-align: center;">
                <div class="social-icons" style="margin-bottom: 12px;">
                    <a href="https://www.facebook.com/advancedenglishtests" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                        <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width: 32px; height: 32px; border-radius: 50%;" />
                    </a>
                    <a href="https://www.instagram.com/advancedenglishtests/" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                        <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 32px; height: 32px; border-radius: 50%;" />
                    </a>
                </div>
                <p style="color: #333333; font-size: 12px; margin: 0;">© 2025 AdvancedEnglishTests. All rights reserved.</p>
            </td>
        </tr>
      </table>
    `

    const mailOptions = {
      from: `"Advanced English Tests" <${process.env.EMAIL_FROM}>`,
      to: receiverEmail,
      subject: `🗓️ Speaking Session Scheduled with ${senderName} - Advanced English Tests`,
      html: htmlContent,
      text: `
        Hi ${receiverName},

        ${senderName} has scheduled a speaking session with you.

        Session Details:
        Date: ${formattedDate}
        Time: ${formattedTime}
        Timezone: ${timezone}
        Partner: ${senderName}

        ${message ? `Message from ${senderName}: "${message}"` : ''}

        You can manage this session in your dashboard at: https://advancedenglishtests.com/speaking

        What's Next?
        - You'll receive another notification closer to the session time
        - You can accept, reschedule, or decline this session in your dashboard
        - Make sure to be online a few minutes before the scheduled time

        Best regards,
        Advanced English Tests Team
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('Scheduling notification sent successfully to:', receiverEmail)
    return { success: true }

  } catch (error) {
    console.error('Error sending scheduling notification:', error)
    throw error
  }
}

// Response notification when user accepts/rejects a scheduled session
interface ResponseNotificationParams {
  recipientEmail: string
  recipientName: string
  actionPerformerName: string
  response: 'accepted' | 'rejected' | 'cancelled'
  scheduledDate: string
  scheduledTime: string
  timezone: string
}

export async function sendResponseNotification({
  recipientEmail,
  recipientName,
  actionPerformerName,
  response,
  scheduledDate,
  scheduledTime,
  timezone
}: ResponseNotificationParams) {
  try {
    const transporter = createTransporter()

    // Use the same formatting function as ScheduledRequests component
    const { date: formattedDate, time: formattedTime } = formatDateTime(
      scheduledDate, 
      scheduledTime, 
      timezone
    )

    // Customize message based on response type
    let actionMessage = ''
    let headerTitle = ''
    let headerEmoji = ''
    
    switch (response) {
      case 'accepted':
        actionMessage = `<strong>${actionPerformerName}</strong> has accepted your session request.`
        headerTitle = 'Session Accepted'
        headerEmoji = '✅'
        break
      case 'rejected':
        actionMessage = `<strong>${actionPerformerName}</strong> has declined your session request.`
        headerTitle = 'Session Declined'
        headerEmoji = '❌'
        break
      case 'cancelled':
        actionMessage = `<strong>${actionPerformerName}</strong> has cancelled the scheduled session.`
        headerTitle = 'Session Cancelled'
        headerEmoji = '🚫'
        break
      default:
        actionMessage = `<strong>${actionPerformerName}</strong> has updated your session request.`
        headerTitle = 'Session Update'
        headerEmoji = '📅'
    }

    const htmlContent = `
      <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; font-family: Arial, sans-serif;">
        <!-- Header -->
        <tr>
            <td style="padding: 20px; text-align: center; background-color: #1A3A6E;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">AdvancedEnglishTests</h1>
                <p style="color: #ffffff; margin: 8px 0 0; font-size: 16px;">Conquer IELTS with Free Practice Tools, Live the Life You Dream</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <h2 style="color: #2563eb; text-align: center; margin-bottom: 20px;">${headerEmoji} ${headerTitle}</h2>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Hi <strong>${recipientName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            ${actionMessage}
          </p>
          
          <!-- Session Details -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">📅 Session Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 120px;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Timezone:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${timezone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Partner:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${actionPerformerName}</td>
              </tr>
            </table>
          </div>
          
          <!-- Action Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://advancedenglishtests.com/speaking" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px;">
              View Speaking Dashboard
            </a>
          </div>
          
          <!-- Footer -->
          </td>
        </tr>
        <tr>
            <td style="padding: 20px; background-color: #f4f4f4; text-align: center;">
                <div style="margin-bottom: 12px;">
                    <a href="https://www.facebook.com/advancedenglishtests" style="display: inline-block; width: 32px; height: 32px; margin: 0 8px; background: #4F5BD5; border-radius: 50%; text-decoration: none; color: #ffffff; line-height: 32px; font-size: 14px; text-align: center;">f</a>
                </div>
                <p style="color: #333333; font-size: 12px; margin: 0;">© 2025 AdvancedEnglishTests. All rights reserved.</p>
            </td>
        </tr>
      </table>
    `

    // Create text version based on response type
    let textMessage = ''
    switch (response) {
      case 'accepted':
        textMessage = `${actionPerformerName} has accepted your session request.`
        break
      case 'rejected':
        textMessage = `${actionPerformerName} has declined your session request.`
        break
      case 'cancelled':
        textMessage = `${actionPerformerName} has cancelled the scheduled session.`
        break
      default:
        textMessage = `${actionPerformerName} has updated your session request.`
    }

    const mailOptions = {
      from: `"Advanced English Tests" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: `${headerEmoji} ${headerTitle} - Advanced English Tests`,
      html: htmlContent,
      text: `
        Hi ${recipientName},

        ${textMessage}

        Session Details:
        Date: ${formattedDate}
        Time: ${formattedTime}
        Timezone: ${timezone}
        Partner: ${actionPerformerName}

        You can view your speaking dashboard at: https://advancedenglishtests.com/speaking

        Best regards,
        Advanced English Tests Team
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Response notification (${response}) sent successfully to:`, recipientEmail)
    return { success: true }

  } catch (error) {
    console.error('Error sending response notification:', error)
    throw error
  }
}
