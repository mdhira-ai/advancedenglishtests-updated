import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get IP address from various headers (common proxy headers)
    let ip = request.headers.get('x-forwarded-for')
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip') // Cloudflare
      || request.headers.get('x-client-ip')
      || request.headers.get('x-cluster-client-ip')
      || request.headers.get('x-forwarded')
      || request.headers.get('forwarded-for')
      || request.headers.get('forwarded')
      || 'unknown'

    // If x-forwarded-for contains multiple IPs, take the first one
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim()
    }

    // Clean up the IP address
    if (ip) {
      ip = ip.trim()
      // Remove brackets from IPv6 addresses if present
      if (ip.startsWith('[') && ip.endsWith(']')) {
        ip = ip.slice(1, -1)
      }
    }

    return NextResponse.json({ 
      ip: ip || 'unknown',
      success: true 
    })
  } catch (error) {
    console.error('Error getting IP address:', error)
    return NextResponse.json({ 
      ip: 'unknown',
      success: false,
      error: 'Failed to get IP address'
    }, { status: 500 })
  }
}