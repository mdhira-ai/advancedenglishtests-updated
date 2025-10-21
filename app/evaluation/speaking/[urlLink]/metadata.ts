import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaking Evaluation - Advanced English Tests',
  description: 'View your IELTS speaking practice evaluation results with detailed feedback and scoring.',
  keywords: 'IELTS speaking evaluation, speaking practice results, English speaking assessment, IELTS feedback',
  openGraph: {
    title: 'Speaking Evaluation - Advanced English Tests',
    description: 'View your IELTS speaking practice evaluation results with detailed feedback and scoring.',
    type: 'website',
  },
  robots: {
    index: false, // Don't index individual evaluation pages for privacy
    follow: true,
  },
}
