import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

// Get like status between two users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const likerId = searchParams.get('likerId')
    const likedId = searchParams.get('likedId')

    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() })
    const userIdHeader = request.headers.get('x-user-id')
    
    if (!session?.user && !userIdHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authenticatedUserId = session?.user?.id || userIdHeader

    if (!likerId || !likedId) {
      return NextResponse.json({ error: 'likerId and likedId are required' }, { status: 400 })
    }

    // Check if the authenticated user is the liker
    if (authenticatedUserId !== likerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if like exists
    const existingLike = await prisma.speaking_room_likes.findFirst({
      where: {
        liker_id: likerId,
        liked_user_id: likedId
      }
    })

    // Get total likes for the liked user
    const totalLikes = await prisma.speaking_room_likes.count({
      where: {
        liked_user_id: likedId
      }
    })

    return NextResponse.json({
      hasLiked: !!existingLike,
      totalLikes
    })

  } catch (error) {
    console.error('Error in like GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle like/unlike actions
export async function POST(request: NextRequest) {
  try {
    const { roomCode, likerId, likedId, action } = await request.json()

    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() })
    const userIdHeader = request.headers.get('x-user-id')
    
    if (!session?.user && !userIdHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authenticatedUserId = session?.user?.id || userIdHeader

    if (!roomCode || !likerId || !likedId || !action) {
      return NextResponse.json({ 
        error: 'roomCode, likerId, likedId, and action are required' 
      }, { status: 400 })
    }

    // Check if the authenticated user is the liker
    if (authenticatedUserId !== likerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent self-liking
    if (likerId === likedId) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 })
    }

    // Verify the room exists and is active
    const room = await prisma.speaking_rooms.findFirst({
      where: {
        room_code: roomCode,
        status: 'active'
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found or not active' }, { status: 404 })
    }

    // Verify both users are participants in the room
    const participants = await prisma.speaking_room_participants.findMany({
      where: {
        room_id: room.id,
        user_id: { in: [likerId, likedId] },
        left_at: null
      }
    })

    if (participants.length !== 2) {
      return NextResponse.json({ 
        error: 'One or both users are not part of this room' 
      }, { status: 403 })
    }

    if (action === 'like') {
      // Check if like already exists
      const existingLike = await prisma.speaking_room_likes.findFirst({
        where: {
          liker_id: likerId,
          liked_user_id: likedId
        }
      })

      if (existingLike) {
        // Already liked
        const totalLikes = await prisma.speaking_room_likes.count({
          where: { liked_user_id: likedId }
        })

        return NextResponse.json({
          action: 'already_liked',
          totalLikes
        })
      }

      // Create new like
      await prisma.speaking_room_likes.create({
        data: {
          id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          room_id: room.id,
          liker_id: likerId,
          liked_user_id: likedId
        }
      })

      const totalLikes = await prisma.speaking_room_likes.count({
        where: { liked_user_id: likedId }
      })

      return NextResponse.json({
        action: 'liked',
        totalLikes
      })

    } else if (action === 'unlike') {
      // Remove like
      const deletedLike = await prisma.speaking_room_likes.deleteMany({
        where: {
          liker_id: likerId,
          liked_user_id: likedId
        }
      })

      const totalLikes = await prisma.speaking_room_likes.count({
        where: { liked_user_id: likedId }
      })

      return NextResponse.json({
        action: deletedLike.count > 0 ? 'unliked' : 'not_found',
        totalLikes
      })

    } else {
      return NextResponse.json({ error: 'Invalid action. Use "like" or "unlike"' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in like POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}