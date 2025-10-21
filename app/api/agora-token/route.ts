import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { channelName, uid } = await request.json()

    if (!channelName || !uid) {
      return NextResponse.json({ error: 'Channel name and UID are required' }, { status: 400 })
    }

    // Better Auth authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId) {
      return NextResponse.json({ error: 'Agora App ID not configured' }, { status: 500 })
    }

    // Convert string UID to integer for Agora
    const numericUid = parseInt(uid.toString().replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000)

    let token = null

    // Production mode: Generate token with App Certificate
    if (appCertificate && appCertificate !== 'your_agora_app_certificate_here') {
      const role = RtcRole.PUBLISHER
      const expirationTimeInSeconds = 3600 // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        numericUid,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      )

      console.log('Generated production Agora token for channel:', channelName, 'uid:', numericUid)
    } else {
      // Development mode: Use null token (test mode)
      console.log('Using Agora test mode (null token) for channel:', channelName, 'uid:', numericUid)
      console.log('To enable production mode, set AGORA_APP_CERTIFICATE in your environment variables')
    }

    return NextResponse.json({ 
      token,
      channelName,
      uid: numericUid,
      appId,
      mode: token ? 'production' : 'test',
      expiresIn: token ? 3600 : null
    })
  } catch (error) {
    console.error('Error generating Agora token:', error)
    return NextResponse.json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}