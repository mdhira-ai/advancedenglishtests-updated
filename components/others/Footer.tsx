'use client'

import Link from "next/link";
import { BookOpen, Headphones, PenTool, Mic, Brain, Globe, Award, Star, Facebook, Instagram } from "lucide-react";
import Image from "next/image";
import SimpleNewsletterSignup from '@/components/others/SimpleNewsletterSignup'
import { useState } from 'react';

const size = 'md'; // Options: 'sm', 'md', 'lg'

const sizeClasses = {
  sm: { width: 120, height: 30 },
  md: { width: 180, height: 45 },
  lg: { width: 240, height: 60 },
};
export default function Footer() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; pageType: 'cambridge-plus' | 'speaking' | 'speaking-check' | null }>({
    isOpen: false,
    pageType: null
  })

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, pageType: null })
  }
  return (
    <footer className="bg-[#1A3A6E] text-white py-8 sm:py-12 lg:py-16 border-t-4 border-[#4f5bd5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="sm:col-span-2">
            <div className="mb-4">
               <Image
                      src="https://d2cy8nxnsajz6t.cloudfront.net/logoWhite.png"
                      alt="Advanced English Tests"
                      width={sizeClasses[size].width}
                      height={sizeClasses[size].height}
                      className="object-contain"
                      priority
                    />
            </div>
            <p className="text-sm sm:text-base text-gray-300 mb-6 max-w-md leading-relaxed">
              🌍 Empowering ambitious international students to unlock global opportunities through English mastery. 
              Your gateway to prestigious universities worldwide - featuring authentic IELTS and speaking preparation 
              with cutting-edge AI feedback and official Cambridge materials. Transform your study abroad dreams into reality!
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://www.facebook.com/advancedenglishtests" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative"
              >
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl hover:from-blue-500 hover:to-blue-600">
                  <Facebook className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
              </a>
              
              <a 
                href="https://www.instagram.com/advancedenglishtests" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative"
              >
                <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl hover:from-pink-400 hover:via-purple-400 hover:to-indigo-400">
                  <Instagram className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#ffc107] border-l-4 border-[#ffc107] pl-3">Test Modules</h4>
            <ul className="space-y-3 text-sm sm:text-base text-gray-300">
              <li className="hover:text-[#ff8c42] transition-colors duration-200">
                <Link href="/cambridge" className="flex items-center group">
                  <div className="w-2 h-2 bg-[#ff8c42] rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                  <Headphones className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  Listening Tests
                </Link>
              </li>
              <li className="hover:text-[#4f5bd5] transition-colors duration-200">
                <Link href="/cambridge" className="flex items-center group">
                  <div className="w-2 h-2 bg-[#4f5bd5] rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                  <BookOpen className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  Reading Tests
                </Link>
              </li>
              <li className="hover:text-[#ff8c42] transition-colors duration-200">
                <Link href="/writing-check" className="flex items-center group">
                  <div className="w-2 h-2 bg-[#ff8c42] rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                  <PenTool className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  Writing Practice
                </Link>
              </li>
              <li className="hover:text-[#ff8c42] transition-colors duration-200">
                <Link href="/speaking-check" className="flex items-center group">
                  <div className="w-2 h-2 bg-[#ff8c42] rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                  <Mic className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  Speaking Practice
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#ffc107] border-l-4 border-[#ffc107] pl-3">Stay Connected</h4>
            <SimpleNewsletterSignup />
          </div>
        </div>

        {/* Newsletter Subscription Section - Full component moved to main page */}

        <div className="border-t-2 border-[#4f5bd5] pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-gray-300">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-[#ffc107] rounded-full mr-2"></div>
                <Star className="w-3 sm:w-4 h-3 sm:h-4 mr-1 text-[#ffc107]" />
                © 2025 AdvancedEnglishTests
              </span>
              <span className="hidden sm:inline text-[#4f5bd5]">•</span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-[#ff8c42] rounded-full mr-2"></div>
                <Award className="w-3 sm:w-4 h-3 sm:h-4 mr-1 text-[#ff8c42]" />
                <span className="hidden sm:inline">Official Cambridge Materials</span>
                <span className="sm:hidden">Cambridge Materials</span>
              </span>
              <span className="hidden sm:inline text-[#4f5bd5]">•</span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-[#4f5bd5] rounded-full mr-2"></div>
                <Globe className="w-3 sm:w-4 h-3 sm:h-4 mr-1 text-[#4f5bd5]" />
                Free Global Access
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-300">
              <Link href="/about" className="hover:text-[#ffc107] transition-colors duration-200 flex items-center">
                <div className="w-1 h-1 bg-[#ff8c42] rounded-full mr-2"></div>
                About
              </Link>
              <span className="text-[#4f5bd5]">•</span>
              <Link href="/privacy" className="hover:text-[#ffc107] transition-colors duration-200 flex items-center">
                <div className="w-1 h-1 bg-[#ff8c42] rounded-full mr-2"></div>
                Privacy
              </Link>
              <span className="text-[#4f5bd5]">•</span>
              <Link href="/terms" className="hover:text-[#ffc107] transition-colors duration-200 flex items-center">
                <div className="w-1 h-1 bg-[#ff8c42] rounded-full mr-2"></div>
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
      
  
    </footer>
  );
}
