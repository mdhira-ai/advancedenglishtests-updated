'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Eye, Database, Users, AlertCircle, FileText } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              <Shield className="w-4 h-4 mr-2" />
              Privacy & Security
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              <span className="hidden sm:inline">Your privacy is fundamental to us. This policy explains how we collect, use, and protect your information.</span>
              <span className="sm:hidden">How we protect your privacy and data.</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: August 29, 2025
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-6 sm:space-y-8">
          
          {/* Information We Collect */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <Database className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Information We Collect
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                      <p className="mb-2">
                        When you create an account, we collect information such as your email address, name, and profile preferences.
                      </p>
                      <div className="hidden sm:block">
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Email address for account creation and communication</li>
                          <li>Display name for personalization</li>
                          <li>Profile preferences and learning goals</li>
                          <li>Progress data and test results</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Usage Information</h3>
                      <p>
                        <span className="hidden sm:inline">We automatically collect information about how you use our platform, including pages visited, features used, and time spent on activities.</span>
                        <span className="sm:hidden">We collect usage data to improve our platform.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <Eye className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    How We Use Your Information
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <div className="hidden sm:block">
                      <p className="mb-4">We use the information we collect to:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Service Provision</h4>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li>Provide and maintain our services</li>
                            <li>Process your test submissions</li>
                            <li>Generate personalized feedback</li>
                            <li>Track your learning progress</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Communication</h4>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li>Send important service updates</li>
                            <li>Respond to your inquiries</li>
                            <li>Provide customer support</li>
                            <li>Share educational content (optional)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-sm">
                        <strong>We use your data to:</strong> Provide services, track progress, communicate updates, and improve our platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <Lock className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Data Security
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    <div className="hidden sm:block">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Our Security Measures Include:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <ul className="list-disc pl-4 space-y-1 text-sm">
                              <li>SSL encryption for data transmission</li>
                              <li>Secure database storage</li>
                              <li>Regular security audits</li>
                            </ul>
                          </div>
                          <div>
                            <ul className="list-disc pl-4 space-y-1 text-sm">
                              <li>Access controls and authentication</li>
                              <li>Data backup and recovery systems</li>
                              <li>Employee security training</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-sm bg-gray-50 rounded-lg p-3">
                        <strong>Security:</strong> SSL encryption, secure storage, access controls, regular audits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <Users className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Information Sharing
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p className="font-semibold text-gray-800">
                      We do not sell, trade, or rent your personal information to third parties.
                    </p>
                    <div className="hidden sm:block">
                      <p className="mb-4">We may share your information only in the following circumstances:</p>
                      <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-800 mb-2">Legal Requirements</h4>
                          <p className="text-sm text-red-700">
                            When required by law, court order, or government request to protect our rights or the safety of others.
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Service Providers</h4>
                          <p className="text-sm text-blue-700">
                            With trusted third-party services that help us operate our platform (hosting, analytics, customer support).
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-sm">
                        <strong>Sharing limited to:</strong> Legal requirements and trusted service providers only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <FileText className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Your Rights
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      You have several rights regarding your personal information:
                    </p>
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Access & Update</h4>
                            <p className="text-sm">View and modify your personal information through your account settings.</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Data Export</h4>
                            <p className="text-sm">Request a copy of your personal data in a portable format.</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Account Deletion</h4>
                            <p className="text-sm">Delete your account and associated data at any time.</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Communication Control</h4>
                            <p className="text-sm">Opt out of non-essential communications while keeping your account active.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <strong>Your Rights:</strong> Access, update, export, delete data, and control communications.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Analytics */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Cookies and Analytics
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We use cookies and similar technologies to enhance your experience and understand how our platform is used.
                </p>
                <div className="hidden sm:block">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Essential Cookies</h4>
                      <p className="text-sm">Required for basic site functionality, authentication, and security.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Analytics Cookies</h4>
                      <p className="text-sm">Help us understand site usage and improve our services. You can opt out through your browser settings.</p>
                    </div>
                  </div>
                </div>
                <div className="sm:hidden">
                  <p className="text-sm bg-gray-50 rounded-lg p-3">
                    <strong>Cookies:</strong> Essential for functionality, analytics for improvement (opt-out available).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="bg-orange-50 border border-orange-200 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Children's Privacy
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p>
                      Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                    </p>
                    <div className="hidden sm:block">
                      <p>
                        If you are a parent or guardian and believe your child has provided us with personal information, 
                        please contact us immediately so we can delete such information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Changes to This Privacy Policy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                </p>
                <div className="hidden sm:block">
                  <p>
                    You are advised to review this Privacy Policy periodically for any changes. 
                    Changes to this Privacy Policy are effective when they are posted on this page.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Last Updated:</strong> August 29, 2025
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-blue-50 border border-blue-200 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Contact Us About Privacy
              </h2>
              <p className="text-gray-600 mb-4">
                <span className="hidden sm:inline">If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact us.</span>
                <span className="sm:hidden">Questions about privacy? Contact us anytime.</span>
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> privacy@advancedenglishtests.com</p>
                <p><strong>General Support:</strong> support@advancedenglishtests.com</p>
                <p><strong>Website:</strong> https://advancedenglishtests.com</p>
                <div className="hidden sm:block">
                  <p><strong>Response Time:</strong> We respond to privacy inquiries within 48 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GDPR Notice */}
          <Card className="bg-green-50 border border-green-200 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                GDPR Compliance
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  <span className="hidden sm:inline">For users in the European Union, we comply with the General Data Protection Regulation (GDPR). You have additional rights under GDPR including data portability and the right to be forgotten.</span>
                  <span className="sm:hidden">EU users: GDPR-compliant with additional rights available.</span>
                </p>
                <div className="hidden sm:block">
                  <p className="text-sm">
                    To exercise these rights or for more information about our GDPR compliance, please contact our Data Protection Officer at: dpo@advancedenglishtests.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
