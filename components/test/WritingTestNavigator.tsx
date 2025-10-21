'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function WritingTestNavigator({ book, module }: { book: number, module: string }) {
  const pathname = usePathname()
  const tests = [1, 2, 3, 4]

  return (
    <div className="flex justify-center space-x-2 mb-8">
      {tests.map(testNumber => {
        const href = `/cambridge/book-${book}/${module}/test-${testNumber}`
        const isActive = pathname === href
        return (
          <Button key={testNumber} asChild variant={isActive ? 'default' : 'outline'}>
            <Link href={href}>Test {testNumber}</Link>
          </Button>
        )
      })}
    </div>
  )
}