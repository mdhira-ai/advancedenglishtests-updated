import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showIcon?: boolean
  className?: string
  href?: string
}

export default function BrandLogo({
  size = 'md',
  showIcon = true,
  className,
  href = '/'
}: BrandLogoProps) {

  
  const sizeClasses = {
    sm: { height: 32, width: 120 },
    md: { height: 40, width: 150 },
    lg: { height: 48, width: 180 },
    xl: { height: 56, width: 210 }
  }

  const LogoContent = () => (
    <div className={cn(
      'flex items-center',
      className
    )}>
      <Image
        src="https://d2cy8nxnsajz6t.cloudfront.net/logo.png"
        alt="Advanced English Tests"
        width={sizeClasses[size].width}
        height={sizeClasses[size].height}
        className="object-contain"
        priority
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
