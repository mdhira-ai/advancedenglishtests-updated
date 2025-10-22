import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// Simple function to save writing evaluation data
// export async function saveWritingEvaluationData({
//   userId,
//   taskType,
//   question,
//   userAnswer,
//   evaluationResponse,
//   wordCount,
//   isLoggedIn
// }: {
//   userId?: string | null
//   taskType: string
//   question: string
//   userAnswer: string
//   evaluationResponse: any
//   wordCount?: number | null
//   isLoggedIn: boolean
// }) {
//   try {
//     // Generate a unique URL link for sharing
//     const urlLink = nanoid(12)

//     const evaluationData = await prisma.writing_evaluation_data.create({
//       data: {
//         userId: userId || null,
//         taskType,
//         question,
//         userAnswer,
//         evaluationResponse: typeof evaluationResponse === 'object' 
//           ? JSON.stringify(evaluationResponse) 
//           : evaluationResponse,
//         wordCount: wordCount || null,
//         urlLink,
//         isLoggedIn
//       }
//     })

//     return {
//       success: true,
//       id: evaluationData.id.toString(),
//       shareableUrl: urlLink,
//       isLoggedIn,
//       userId: userId || 'anonymous'
//     }
//   } catch (error) {
//     console.error('Error saving writing evaluation data:', error)
//     throw error
//   }
// }

// Simple function to save speaking evaluation data
// export async function saveSpeakingEvaluationData({
//   userId,
//   topic,
//   questions,
//   userAnswer,
//   evaluationResponse,
//   recordingDuration
// }: {
//   userId?: string | null
//   topic: string
//   questions: string[] | string
//   userAnswer: string
//   evaluationResponse: any
//   recordingDuration: number
// }) {
//   try {
//     // Generate a unique URL link for sharing
//     const urlLink = nanoid(12)

//     const evaluationData = await prisma.speaking_evaluation_data.create({
//       data: {
//         userId: userId || null,
//         topic,
//         questions: Array.isArray(questions) ? JSON.stringify(questions) : questions,
//         userAnswer,
//         evaluationResponse: typeof evaluationResponse === 'object' 
//           ? JSON.stringify(evaluationResponse) 
//           : evaluationResponse,
//         recordingDuration,
//         urlLink
//       }
//     })

//     return {
//       success: true,
//       id: evaluationData.id.toString(),
//       shareableUrl: urlLink,
//       userId: userId || 'anonymous'
//     }
//   } catch (error) {
//     console.error('Error saving speaking evaluation data:', error)
//     throw error
//   }
// }

// Function to get evaluation data by URL link
export async function getEvaluationDataByUrl(urlLink: string, type: 'writing' | 'speaking') {
  try {
    if (type === 'writing') {
      const evaluationData = await prisma.writing_evaluation_data.findFirst({
        where: { urlLink },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (!evaluationData) {
        return null
      }

      return {
        ...evaluationData,
        id: evaluationData.id.toString(),
        createdAt: evaluationData.createdAt.toISOString()
      }
    } else {
      const evaluationData = await prisma.speaking_evaluation_data.findFirst({
        where: { urlLink },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (!evaluationData) {
        return null
      }

      return {
        ...evaluationData,
        id: evaluationData.id.toString(),
        createdAt: evaluationData.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching evaluation data:', error)
    throw error
  }
}