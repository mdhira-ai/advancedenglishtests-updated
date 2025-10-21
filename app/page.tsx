'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Headphones, PenTool, Mic, Award, Clock, Target, Star, Users, Brain, Globe, CheckCircle, Sparkles, TrendingUp, Shield } from "lucide-react";
import ContactSection from "@/components/others/ContactSection";

export default function page() {


  return (
    <div className="min-h-screen hero-gradient">
    

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-3 sm:px-6 py-2 rounded-full bg-white bg-opacity-80 text-brand-purple text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-purple-200 backdrop-blur-sm">
              <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">🎯 #1 English Mastery Platform for Global Success</span>
              <span className="sm:hidden">🎯 #1 English Platform</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              Unlock
              <span className="brand-gradient-text"> English </span>
              <br className="hidden sm:block" />
              Mastery with
              <span className="text-brand-orange"> Precision</span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-gray-600 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed px-4">
              🌍 <strong>Your Passport to Global Success!</strong> Conquer IELTS and speaking assessments with confidence. 
              Transform your English skills from ordinary to extraordinary and unlock doors to prestigious universities worldwide.
              🚀 Practice with <strong>official Cambridge materials</strong> from Books 8-17 and Cambridge Advance Test books. 
              Get <strong>instant AI-powered feedback</strong> on writing, track your progress, and achieve your dream band score.
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-3xl mx-auto border border-purple-200 backdrop-blur-sm">
              <p className="text-base sm:text-lg font-semibold text-brand-purple mb-2">
                🎉 FREE Access for Everyone!
              </p>
              <p className="text-sm sm:text-base text-brand-purple">
                No registration required to start practicing. Sign up to save progress and unlock premium features.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
              <Link href="/cambridge">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-[#1A3A6E] hover:bg-[#142d57] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Star className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  Start Free Practice
                </Button>
              </Link>
           
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#1A3A6E] text-[#1A3A6E] hover:bg-blue-50">
                    <Users className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Sign Up for Progress Tracking</span>
                    <span className="sm:hidden">Sign Up & Track</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#ff8c42] text-[#ff8c42] hover:bg-orange-50">
                    <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                    View Your Progress
                  </Button>
                </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-purple">300+</div>
                <div className="text-xs sm:text-sm text-gray-600">Premium Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-blue">AI</div>
                <div className="text-xs sm:text-sm text-gray-600">Smart Evaluation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-orange">17</div>
                <div className="text-xs sm:text-sm text-gray-600">Cambridge Books</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-yellow">100%</div>
                <div className="text-xs sm:text-sm text-gray-600">Free Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-blue-100 text-[#1A3A6E] text-xs sm:text-sm font-medium mb-4 backdrop-blur-sm">
              <Brain className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Revolutionary Intelligent Learning Engine</span>
              <span className="sm:hidden">AI Learning Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
              Your Ultimate English Mastery Arsenal
              <span className="block text-[#1A3A6E] text-lg sm:text-xl md:text-3xl mt-2">Cambridge • Assessment</span>
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Unleash your English potential with our cutting-edge platform featuring 300+ authentic tests, adaptive technology, and instant expert-level feedback. Transform your skills from intermediate to exceptional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group border-2 hover:border-blue-200 hover-brand-lift">
              <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="bg-blue-100 rounded-full w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-8 sm:w-10 h-8 sm:h-10 text-[#1A3A6E]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Immersive Listening</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Experience authentic Cambridge audio with crystal-clear sound quality, real-time scoring, and comprehensive feedback analysis</p>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-center text-[#1A3A6E]">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    160+ Audio Tests
                  </div>
                  <div className="flex items-center justify-center text-[#1A3A6E]">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Instant Band Scoring
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group border-2 hover:border-blue-200 hover-brand-lift">
              <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="bg-blue-100 rounded-full w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 text-brand-blue" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Strategic Reading</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Master complex academic passages with intelligent text highlighting, detailed explanations, and advanced comprehension tools</p>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-center text-brand-blue">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Smart Text Analysis
                  </div>
                  <div className="flex items-center justify-center text-brand-blue">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Answer Explanations
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group border-2 hover:border-orange-200 relative overflow-hidden hover-brand-lift">
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-[#1A3A6E] text-white text-xs px-1 sm:px-2 py-1 rounded-full font-medium">
                🤖 <span className="hidden sm:inline">Tech Powered</span>
              </div>
              <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="bg-blue-100 rounded-full w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <PenTool className="w-8 sm:w-10 h-8 sm:h-10 text-brand-orange" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Precision Writing</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Revolutionary evaluation delivering expert-level feedback on Task Achievement, Coherence, Vocabulary, and Grammar with band predictions</p>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-center text-brand-orange">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    4-Criteria Analysis
                  </div>
                  <div className="flex items-center justify-center text-brand-orange">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Instant Band Scores
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group border-2 hover:border-yellow-200 relative overflow-hidden hover-brand-lift">
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-[#ff8c42] text-white text-xs px-1 sm:px-2 py-1 rounded-full font-medium">
                <span className="hidden sm:inline">Live Transcription</span>
                <span className="sm:hidden">Live</span>
              </div>
              <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="bg-yellow-100 rounded-full w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-8 sm:w-10 h-8 sm:h-10 text-brand-yellow" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Dynamic Speaking</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Advanced speech recognition with real-time transcription, powered fluency analysis, and comprehensive pronunciation feedback</p>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-center text-brand-yellow">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Real-time Transcription
                  </div>
                  <div className="flex items-center justify-center text-brand-yellow">
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Fluency Analysis
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* International Student Success Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 sm:w-32 lg:w-48 h-24 sm:h-32 lg:h-48 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-indigo-200 backdrop-blur-sm">
              🌟 <span className="hidden sm:inline">Your Study Abroad Journey Starts Here</span>
              <span className="sm:hidden">Study Abroad Journey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
              From Dreams to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Acceptance Letters</span>
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
              🎓 Every year, thousands of ambitious students like you secure admission to prestigious universities worldwide. 
              <strong>Your English proficiency scores are the key</strong> that unlocks scholarships, visa approvals, and academic opportunities in top destinations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            <div className="text-center group">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border-2 border-transparent group-hover:border-indigo-200">
                <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">🇺🇸 USA</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Ivy League Dreams</h3>
                <p className="text-xs sm:text-sm text-gray-600">Harvard, MIT, Stanford await with IELTS 7.0+</p>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border-2 border-transparent group-hover:border-purple-200">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">🇬🇧 UK</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Oxford & Cambridge</h3>
                <p className="text-xs sm:text-sm text-gray-600">Russell Group universities with IELTS 6.5+ requirements</p>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border-2 border-transparent group-hover:border-blue-200">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">🇨🇦 Canada</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Express Entry Ready</h3>
                <p className="text-xs sm:text-sm text-gray-600">Top universities + immigration pathways</p>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border-2 border-transparent group-hover:border-emerald-200">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">🇦🇺 Australia</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Group of Eight</h3>
                <p className="text-xs sm:text-sm text-gray-600">Prestigious universities with post-study work visas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Writing Evaluation Showcase */}
      <div className="py-12 sm:py-16 lg:py-20 section-gradient-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-blue-100 text-[#1A3A6E] text-xs sm:text-sm font-medium mb-4 sm:mb-6 backdrop-blur-sm">
                <Brain className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Advanced Writing Assessment</span>
                <span className="sm:hidden">AI Writing Assessment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Experience Lightning-Fast Writing Analysis
                <span className="block text-[#1A3A6E] text-lg sm:text-xl md:text-2xl mt-2">Powered by Advanced Technology</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8">
                Our breakthrough writing evaluator delivers university-level feedback in seconds. Get precise band scores across all four IELTS criteria with detailed improvement strategies that transform your writing from good to exceptional.
              </p>
              
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-blue-100 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                    <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-[#1A3A6E]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Comprehensive 4-Criteria Breakdown
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Deep analysis of Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range with targeted improvement recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-blue-100 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                    <Target className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Expert-Level Strategic Guidance
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Receive specific, actionable insights on vocabulary enhancement, sentence structure optimization, and coherence improvement techniques
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-green-100 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                    <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Advanced Progress Intelligence
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Track your writing evolution with sophisticated analytics showing band score progression and skill development patterns over time
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/writing-check">
                <Button size="lg" className="w-full sm:w-auto bg-[#1A3A6E] hover:bg-[#142d57] text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  <PenTool className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Experience Writing Analysis</span>
                  <span className="sm:hidden">Try Writing Analysis</span>
                </Button>
              </Link>
            </div>

            <div className="order-1 lg:order-2 lg:text-center">
              <Card className="bg-white shadow-2xl border-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50/50"></div>
                <CardHeader className="relative px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <CardTitle className="text-lg sm:text-2xl text-gray-900">AI Writing Dashboard</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-current" />
                      <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-current" />
                      <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-current" />
                      <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-current" />
                      <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                  <CardDescription className="text-sm sm:text-base">
                    Revolutionary real-time analysis for Task 1 & Task 2 excellence
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Overall Band Score</span>
                        <span className="text-xl sm:text-2xl font-bold text-blue-600">7.5</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#1A3A6E] h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border text-center">
                        <div className="text-base sm:text-lg font-bold text-green-600">8.0</div>
                        <div className="text-xs text-gray-600">Task Achievement</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border text-center">
                        <div className="text-base sm:text-lg font-bold text-blue-600">7.5</div>
                        <div className="text-xs text-gray-600">Coherence</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border text-center">
                        <div className="text-base sm:text-lg font-bold text-purple-600">7.0</div>
                        <div className="text-xs text-gray-600">Vocabulary</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border text-center">
                        <div className="text-base sm:text-lg font-bold text-orange-600">7.5</div>
                        <div className="text-xs text-gray-600">Grammar</div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                      <div className="text-xs sm:text-sm font-medium text-green-800 mb-1">✅ Exceptional Strengths:</div>
                      <div className="text-xs text-green-700">Outstanding task response with compelling examples</div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                      <div className="text-xs sm:text-sm font-medium text-yellow-800 mb-1">🎯 Strategic Improvements:</div>
                      <div className="text-xs text-yellow-700">Enhance lexical sophistication, refine article precision</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Cambridge Books Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium mb-4">
              <Award className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Authentic Cambridge Materials Collection</span>
              <span className="sm:hidden">Cambridge Collection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
              Exclusive Cambridge IELTS Collection
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Unlock the complete Cambridge IELTS treasure trove from Books 8-17 and Cambridge Advance Test books, featuring 200+ authentic practice tests with official answer keys, expert explanations, and Cambridge-certified audio materials.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {[
              { book: "8", tests: "4 Complete Tests", color: "from-blue-500 to-blue-600", status: "Available", highlight: "Foundation" },
              { book: "9", tests: "4 Complete Tests", color: "from-green-500 to-green-600", status: "Available", highlight: "Intermediate" },
              { book: "10", tests: "4 Complete Tests", color: "from-purple-500 to-purple-600", status: "Available", highlight: "Advanced" },
              { book: "11", tests: "4 Complete Tests", color: "from-orange-500 to-orange-600", status: "Available", highlight: "Expert" },
              { book: "12", tests: "4 Complete Tests", color: "from-red-500 to-red-600", status: "Available", highlight: "Master" }
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <CardContent className="p-3 sm:p-4 lg:p-6 relative">
                  <div className="text-center">
                    <div className={`w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 text-white font-bold text-sm sm:text-lg lg:text-xl shadow-lg`}>
                      {item.book}
                    </div>
                    <h3 className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                      Cambridge IELTS {item.book}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 hidden sm:block">{item.tests}</p>
                    <div className="bg-gray-100 text-gray-700 text-xs px-1 sm:px-2 py-1 rounded-full mb-2 sm:mb-3 font-medium">
                      {item.highlight}
                    </div>
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs text-green-600">
                      <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="font-medium hidden sm:inline">{item.status}</span>
                      <span className="font-medium sm:hidden">✓</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12 px-4">
            <Link href="/cambridge">
              <Button size="lg" className="w-full sm:w-auto bg-[#1A3A6E] hover:bg-[#142d57] text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                <BookOpen className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Explore Complete Cambridge Collection</span>
                <span className="sm:hidden">Cambridge Collection</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Test Platforms Section - Redesigned */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs sm:text-sm font-medium mb-6">
              <Brain className="w-4 h-4 mr-2" />
              <span>Revolutionary Test Ecosystem</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Choose Your
              <span className="text-blue-600"> Mastery Path</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Four revolutionary platforms designed to elevate your English proficiency from ordinary to extraordinary. 
              Each ecosystem offers unique advantages tailored to different learning styles and goals.
            </p>
          </div>

          {/* Test Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Cambridge IELTS Excellence */}
            <div className="group relative">
              <Card className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      TRADITIONAL EXCELLENCE
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cambridge IELTS</h3>
                    <p className="text-sm text-gray-600">Official Materials Mastery</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Books 8-17 Collection
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      200+ Authentic Tests
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Expert Explanations
                    </div>
                  </div>
                  
                  <Link href="/cambridge">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Start Practice
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Cambridge Test Plus */}
            <div className="group relative">
              <Card className="bg-white border-2 border-purple-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      PREMIUM PLUS
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cambridge Plus</h3>
                    <p className="text-sm text-gray-600">Advanced Test Series</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Plus 1, 2 & 3 Collections
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Advanced Difficulty
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Enhanced Features
                    </div>
                  </div>
                  
                  <Link href="/cambridge-test-plus">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0">
                      <Award className="w-4 h-4 mr-2" />
                      Explore Plus
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* AI Speaking Practice */}
            <div className="group relative">
              <Card className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      AI POWERED
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Speaking AI</h3>
                    <p className="text-sm text-gray-600">Intelligent Conversation</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Real-time AI Feedback
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Speech Recognition
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      24/7 Availability
                    </div>
                  </div>
                  
                  <Link href="/speaking-check">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                      <Brain className="w-4 h-4 mr-2" />
                      Try AI Chat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Human Speaking Practice */}
            <div className="group relative">
              <Card className="bg-white border-2 border-orange-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-300 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      HUMAN EXPERT
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Speaking Room</h3>
                    <p className="text-sm text-gray-600">Live Human Practice</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Expert Examiners
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Live Video Sessions
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Personalized Feedback
                    </div>
                  </div>
                  
                  <Link href="/speaking">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0">
                      <Mic className="w-4 h-4 mr-2" />
                      Book Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Comparison Guide */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Find Your Perfect Match
                </h3>
              </div>
              <p className="text-gray-600 text-lg">
                Not sure which platform suits your learning style? Our intelligent comparison guide helps you choose the optimal path to IELTS success.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                  <div className="text-blue-600 font-semibold">Traditional Learner</div>
                </div>
                <div className="text-gray-700 text-sm">→ Cambridge IELTS</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-purple-600 mr-2" />
                  <div className="text-purple-600 font-semibold">Challenge Seeker</div>
                </div>
                <div className="text-gray-700 text-sm">→ Cambridge Plus</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-emerald-600 mr-2" />
                  <div className="text-emerald-600 font-semibold">Tech Enthusiast</div>
                </div>
                <div className="text-gray-700 text-sm">→ Speaking AI</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-orange-600 mr-2" />
                  <div className="text-orange-600 font-semibold">Personal Touch</div>
                </div>
                <div className="text-gray-700 text-sm">→ Speaking Room</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cambridge">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start with Cambridge
                </Button>
              </Link>
              <Link href="/speaking-check">
                <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Brain className="w-4 h-4 mr-2" />
                  Try AI Speaking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
              Why Global Achievers Choose Our Platform
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Engineered specifically for ambitious international students, featuring breakthrough technology and expert-designed content that guarantees IELTS excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="bg-blue-100 rounded-full w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex items-center justify-center mb-4 sm:mb-6">
                  <Award className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Authentic Cambridge Excellence
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Access 100% verified IELTS materials from Cambridge University Press featuring 200+ authentic tests. Experience the exact exam conditions with official questions, answer keys, and Cambridge-certified audio content.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="bg-green-100 rounded-full w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex items-center justify-center mb-4 sm:mb-6">
                  <Clock className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Immersive Exam Simulation
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Experience high-fidelity timed practice tests that perfectly mirror actual IELTS exam conditions. Build unshakeable confidence and master time management skills before your crucial test day.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="bg-blue-100 rounded-full w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex items-center justify-center mb-4 sm:mb-6">
                  <Globe className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-[#1A3A6E]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Unrestricted Global Access
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Zero geographic barriers or expensive subscriptions. Access premium features worldwide for free, with optional registration for advanced progress tracking and personalized learning analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="bg-orange-100 rounded-full w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex items-center justify-center mb-4 sm:mb-6">
                  <Brain className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-orange-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Revolutionary Technology Intelligence
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Experience lightning-fast, university-level feedback through our breakthrough evaluation system. Receive precise band scores with detailed improvement strategies that transform your writing from good to exceptional.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="bg-indigo-100 rounded-full w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex items-center justify-center mb-4 sm:mb-6">
                  <TrendingUp className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Advanced Progress Intelligence
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Monitor your English mastery evolution with sophisticated analytics showcasing band score progression, skill development patterns, and performance insights across all modules over time.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="bg-pink-100 rounded-full w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 flex items-center justify-center mb-4 sm:mb-6">
                  <Shield className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-pink-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Enterprise-Grade Security
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Your academic journey is safeguarded with us. Practice with complete confidence knowing your progress data and personal information are protected with enterprise-level security protocols.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-[#1A3A6E] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Transform Your IELTS Dreams Into Reality
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of ambitious international students who have unlocked their target band scores and secured admission to world-class universities with our revolutionary IELTS mastery platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Link href="/cambridge">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#1A3A6E] hover:bg-gray-100 shadow-lg">
                <Star className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Begin Your Success Journey - Absolutely Free!</span>
                <span className="sm:hidden">Start Free Journey!</span>
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 text-xs sm:text-sm mt-4 px-4">
            ✅ No credit card required • ✅ Instant access • ✅ Complete Cambridge collection included
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <ContactSection />

    </div>
  );
}
