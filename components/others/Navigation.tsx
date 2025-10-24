'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  User,
  BookOpen,
  Star,
  Construction,
  PenTool,
  Users,
  Target,
  Mic,
  Edit3,
  UserCircle,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import BrandLogo from '@/components/others/BrandLogo'
import { signOut, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import AuthModal from '@/components/auth/AuthModal'
import { useSocket } from '@/lib/Socketprovider'



export default function Navigation() {

  const { SignoutEmit } = useSocket()

  const router = useRouter()
  const [isTestsDropdownOpen, setIsTestsDropdownOpen] = useState(false)
  const [isGrammarDropdownOpen, setIsGrammarDropdownOpen] = useState(false)
  const [isSpeakingDropdownOpen, setIsSpeakingDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; pageType: 'cambridge-plus' | 'speaking' | 'speaking-check' | null; targetUrl?: string }>({
    isOpen: false,
    pageType: null,
    targetUrl: undefined
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const grammarDropdownRef = useRef<HTMLDivElement>(null)
  const speakingDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = useSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTestsDropdownOpen(false)
      }
      if (grammarDropdownRef.current && !grammarDropdownRef.current.contains(event.target as Node)) {
        setIsGrammarDropdownOpen(false)
      }
      if (speakingDropdownRef.current && !speakingDropdownRef.current.contains(event.target as Node)) {
        setIsSpeakingDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }

    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTestsDropdownOpen(false)
        setIsGrammarDropdownOpen(false)
        setIsSpeakingDropdownOpen(false)
        setIsUserDropdownOpen(false)
        setIsMobileMenuOpen(false)
      }
    }

    if (isTestsDropdownOpen || isGrammarDropdownOpen || isSpeakingDropdownOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isTestsDropdownOpen, isGrammarDropdownOpen, isSpeakingDropdownOpen, isUserDropdownOpen])

  const handleSignOut: () => Promise<void> = async () => {
    const currentPath = window.location.pathname;
    // Store the current path in localStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }

    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // Use replace instead of push
        },
      },
    });
    SignoutEmit()
  };

  const handleProtectedLinkClick = (pageType: 'cambridge-plus' | 'speaking' | 'speaking-check', targetUrl: string) => {
    // Close all dropdowns when navigating
    setIsTestsDropdownOpen(false)
    setIsGrammarDropdownOpen(false)
    setIsSpeakingDropdownOpen(false)
    setIsUserDropdownOpen(false)
    setIsMobileMenuOpen(false)

    if (!session) {
      setAuthModal({ isOpen: true, pageType, targetUrl })
    } else {
      router.push(targetUrl)
    }
  }

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, pageType: null, targetUrl: undefined })
  }





  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <BrandLogo size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTestsDropdownOpen(!isTestsDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg px-4 py-2.5 font-medium"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Tests</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isTestsDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isTestsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                    <div className="py-2">
                      <Link
                        href="/cambridge"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-150"
                        onClick={() => setIsTestsDropdownOpen(false)}
                      >
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Cambridge IELTS</span>
                      </Link>
                      <div
                        onClick={() => handleProtectedLinkClick('cambridge-plus', '/cambridge-test-plus')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-150 cursor-pointer"
                      >
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Cambridge Test Plus</span>
                      </div>
                      <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50/50">
                        <Construction className="w-4 h-4" />
                        <span>Duolingo (Coming Soon)</span>
                      </div>
                      <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50/50">
                        <Construction className="w-4 h-4" />
                        <span>PTE (Coming Soon)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={grammarDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGrammarDropdownOpen(!isGrammarDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 rounded-lg px-4 py-2.5 font-medium"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Grammar</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGrammarDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isGrammarDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                    <div className="py-2">
                      <Link
                        href="/grammar-practice"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-all duration-150"
                        onClick={() => setIsGrammarDropdownOpen(false)}
                      >
                        <PenTool className="w-4 h-4 text-emerald-500" />
                        <span>Grammar Practice</span>
                      </Link>
                      <Link
                        href="/grammar-learning"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-all duration-150"
                        onClick={() => setIsGrammarDropdownOpen(false)}
                      >
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span>Grammar Learning</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={speakingDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSpeakingDropdownOpen(!isSpeakingDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 rounded-lg px-4 py-2.5 font-medium"
                >
                  <Mic className="w-4 h-4" />
                  <span>Speaking</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSpeakingDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isSpeakingDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                    <div className="py-2">
                      <div
                        onClick={() => handleProtectedLinkClick('speaking', '/speaking')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-all duration-150 cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>Speaking Practice with Human</span>
                      </div>
                      <Link
                        href="/speaking-check"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-all duration-150"
                        onClick={() => setIsSpeakingDropdownOpen(false)}
                      >
                        <Mic className="w-4 h-4 text-purple-500" />
                        <span>Speaking Checker</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/writing-check">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-lg px-4 py-2.5 font-medium">
                  <Edit3 className="w-4 h-4" />
                  <span>Writing Check</span>
                </Button>
              </Link>
            </div>

            {/* User Profile/Sign In (always visible) and Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              {
                session && (
                  <div className="relative" ref={userDropdownRef}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 rounded-lg px-4 py-2.5 font-medium"
                    >
                      <span className="hidden sm:inline">Welcome, {session?.user?.name.slice(0, 2)} </span>
                      <User className="sm:hidden w-4 h-4" />
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </Button>

                    {isUserDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                        <div className="py-2">
                          <Link
                            href="/profile"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-all duration-150"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <UserCircle className="w-4 h-4 text-indigo-500" />
                            <span>Profile</span>
                          </Link>
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false)
                              handleSignOut()
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all duration-150"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              {isPending && (
                <div className="flex items-center space-x-2 px-4 py-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              )}

              {!session && !isPending && (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button size="sm" className="relative text-gray-900 font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:brightness-110 border border-gray-300/20 overflow-hidden group" style={{ backgroundColor: '#ffc107' }}>
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff8c42] to-[#1A3A6E] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg">
              <div className="px-4 pt-4 pb-6 space-y-3">
                {/* Tests Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-md">
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    <span>Tests</span>
                  </div>
                  <Link
                    href="/cambridge"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>Cambridge IELTS</span>
                  </Link>
                  <div
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleProtectedLinkClick('cambridge-plus', '/cambridge-test-plus')
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150 rounded-lg cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Cambridge Test Plus</span>
                  </div>

                  <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50 rounded-lg">
                    <Construction className="w-4 h-4" />
                    <span>Duolingo (Coming Soon)</span>
                  </div>
                  <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50 rounded-lg">
                    <Construction className="w-4 h-4" />
                    <span>PTE (Coming Soon)</span>
                  </div>
                </div>

                {/* Grammar Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-md">
                    <PenTool className="w-3 h-3 text-gray-400" />
                    <span>Grammar</span>
                  </div>
                  <Link
                    href="/grammar-practice"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-150 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <PenTool className="w-4 h-4 text-emerald-500" />
                    <span>Grammar Practice</span>
                  </Link>
                  <Link
                    href="/grammar-learning"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-150 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span>Grammar Learning</span>
                  </Link>
                </div>

                {/* Speaking Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-md">
                    <Mic className="w-3 h-3 text-gray-400" />
                    <span>Speaking</span>
                  </div>
                  <div
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleProtectedLinkClick('speaking', '/speaking')
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-150 rounded-lg cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>Speaking With Human</span>
                  </div>
                  <Link
                    href="/speaking-check"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-150 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Mic className="w-4 h-4 text-purple-500" />
                    <span>Speaking Checker</span>
                  </Link>
                </div>

                {/* Writing Check */}
                <Link
                  href="/writing-check"
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-150 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Edit3 className="w-4 h-4 text-orange-500" />
                  <span>Writing Check</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <AuthModal
          isOpen={authModal.isOpen}
          onClose={closeAuthModal}
          pageType={authModal.pageType!}
          targetUrl={authModal.targetUrl}
        />
      </nav>
    </>
  )
}
