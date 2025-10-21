'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Target, Users, Award, Globe, BookOpen, Brain, Heart, Star } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              <Heart className="w-4 h-4 mr-2" />
              Our Story
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About AdvancedEnglishTests
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              <span className="hidden sm:inline">Empowering global learners to achieve English mastery through innovative technology and authentic Cambridge materials.</span>
              <span className="sm:hidden">Empowering English mastery worldwide.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center px-3 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              <Target className="w-4 h-4 mr-2" />
              Our Mission
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Democratizing English Excellence
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="text-base sm:text-lg">
                We believe that language should never be a barrier to achieving your dreams. Our mission is to provide world-class IELTS preparation that's accessible to everyone, everywhere.
              </p>
              <div className="hidden sm:block space-y-4">
                <p>
                  Founded by a team of language educators and technology enthusiasts, AdvancedEnglishTests was born from the frustration of seeing talented individuals held back by expensive and ineffective English preparation resources.
                </p>
                <p>
                  Today, we're proud to serve thousands of learners worldwide, helping them unlock opportunities in education, career advancement, and global mobility.
                </p>
              </div>
            </div>
          </div>
          
          <div className="lg:text-center">
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">17+</div>
                    <div className="text-xs sm:text-sm text-gray-600">Cambridge Books</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">157</div>
                    <div className="text-xs sm:text-sm text-gray-600">Practice Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">9</div>
                    <div className="text-xs sm:text-sm text-gray-600">IELTS Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">24/7</div>
                    <div className="text-xs sm:text-sm text-gray-600">Support</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              <span className="hidden sm:inline">The principles that guide everything we do and every decision we make.</span>
              <span className="sm:hidden">Principles that guide our mission.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Accessibility</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  <span className="hidden sm:inline">Quality English education should be available to everyone, regardless of location or economic background.</span>
                  <span className="sm:hidden">Quality education for everyone, everywhere.</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  <span className="hidden sm:inline">We maintain the highest standards in content quality, using authentic Cambridge materials and cutting-edge AI technology.</span>
                  <span className="sm:hidden">Highest standards in content and technology.</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  <span className="hidden sm:inline">We continuously evolve our platform with the latest educational technology and AI-powered learning insights.</span>
                  <span className="sm:hidden">Evolving with latest educational technology.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What We Offer Section */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              <span className="hidden sm:inline">Comprehensive tools and resources designed to accelerate your English learning journey.</span>
              <span className="sm:hidden">Comprehensive English learning tools.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Cambridge Materials</h3>
                    <p className="text-gray-600 mb-3">
                      <span className="hidden sm:inline">Access to complete Cambridge IELTS books 8-17 with authentic practice tests and official answer keys.</span>
                      <span className="sm:hidden">Complete Cambridge IELTS books 8-17.</span>
                    </p>
                    <div className="hidden sm:block">
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 200+ authentic practice tests</li>
                        <li>• Official Cambridge audio materials</li>
                        <li>• Detailed answer explanations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Assessment</h3>
                    <p className="text-gray-600 mb-3">
                      <span className="hidden sm:inline">Intelligent evaluation system providing instant feedback on writing and speaking with band score predictions.</span>
                      <span className="sm:hidden">AI feedback with band score predictions.</span>
                    </p>
                    <div className="hidden sm:block">
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Real-time writing analysis</li>
                        <li>• Speaking fluency assessment</li>
                        <li>• Personalized improvement plans</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Human Interaction</h3>
                    <p className="text-gray-600 mb-3">
                      <span className="hidden sm:inline">Practice speaking with real people through our video chat platform for authentic conversation experience.</span>
                      <span className="sm:hidden">Real conversation practice with humans.</span>
                    </p>
                    <div className="hidden sm:block">
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Video chat sessions</li>
                        <li>• Native speaker practice</li>
                        <li>• Cultural exchange opportunities</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-lg p-3 flex-shrink-0">
                    <Star className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
                    <p className="text-gray-600 mb-3">
                      <span className="hidden sm:inline">Comprehensive analytics and progress monitoring to track your improvement across all four IELTS skills.</span>
                      <span className="sm:hidden">Track progress across all IELTS skills.</span>
                    </p>
                    <div className="hidden sm:block">
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Detailed performance analytics</li>
                        <li>• Skill-specific insights</li>
                        <li>• Personalized study recommendations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12 sm:mb-16">
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-6 sm:p-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Our Commitment to You
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto mb-6">
                <span className="hidden sm:inline">
                  We're more than just a platform – we're your partners in achieving English excellence. Our dedicated team of educators, 
                  developers, and language experts work tirelessly to ensure you have the best possible learning experience.
                </span>
                <span className="sm:hidden">
                  Your partners in achieving English excellence.
                </span>
              </p>
              <div className="hidden sm:block">
                <p className="text-gray-600 mb-6">
                  Every feature is designed with your success in mind, every test is carefully curated for authenticity, 
                  and every piece of feedback is crafted to accelerate your progress toward your target band score.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cambridge">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    Start Your Journey
                  </Button>
                </Link>
               
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <Card className="bg-blue-50 border border-blue-200 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-gray-600 mb-4">
                <span className="hidden sm:inline">Have questions about our platform? We'd love to hear from you and help you on your English learning journey.</span>
                <span className="sm:hidden">Questions? We're here to help.</span>
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> support@advancedenglishtests.com</p>
                <p><strong>Website:</strong> https://advancedenglishtests.com</p>
                <div className="hidden sm:block">
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
