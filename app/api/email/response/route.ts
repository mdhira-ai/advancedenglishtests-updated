import { NextRequest, NextResponse } from 'next/server'
import { sendResponseNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      recipientEmail, 
      recipientName, 
      actionPerformerName, 
      response, 
      scheduledDate, 
      scheduledTime, 
      timezone 
    } = body

    // Validate required fields
    if (!recipientEmail || !recipientName || !actionPerformerName || !response || !scheduledDate || !scheduledTime || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate response type
    if (!['accepted', 'rejected', 'cancelled'].includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response type' },
        { status: 400 }
      )
    }

    // Send the email notification
    await sendResponseNotification({
      recipientEmail,
      recipientName,
      actionPerformerName,
      response,
      scheduledDate,
      scheduledTime,
      timezone
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending response notification:', error)
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    )
  }
}