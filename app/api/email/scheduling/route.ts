import { NextRequest, NextResponse } from 'next/server'
import { sendSchedulingNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      receiverEmail, 
      receiverName, 
      senderName, 
      scheduledDate, 
      scheduledTime, 
      timezone, 
      message 
    } = body

    // Validate required fields
    if (!receiverEmail || !receiverName || !senderName || !scheduledDate || !scheduledTime || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send the email notification
    await sendSchedulingNotification({
      receiverEmail,
      receiverName,
      senderName,
      scheduledDate,
      scheduledTime,
      timezone,
      message
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending scheduling notification:', error)
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    )
  }
}