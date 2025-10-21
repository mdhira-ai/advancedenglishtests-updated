'use client'

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Shield, Users, AlertTriangle } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              <FileText className="w-4 h-4 mr-2" />
              Legal Information
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              <span className="hidden sm:inline">Please read these terms and conditions carefully before using our service.</span>
              <span className="sm:hidden">Terms and conditions for our service.</span>
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
          
          {/* Acceptance of Terms */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Acceptance of Terms
                  </h2>
                  <p className="text-gray-600 mb-4">
                    By accessing and using AdvancedEnglishTests.com, you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                  <div className="hidden sm:block">
                    <p className="text-gray-600">
                      If you do not agree to abide by the above, please do not use this service. We reserve the right to change these terms at any time without prior notice.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use License */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Use License
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Permission is granted to temporarily access AdvancedEnglishTests.com for personal, non-commercial transitory viewing only.
                </p>
                <div className="hidden sm:block">
                  <p className="font-semibold text-gray-800 mb-2">This license shall not allow you to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for commercial purposes or public display</li>
                    <li>Attempt to reverse engineer any software contained on the website</li>
                    <li>Remove any copyright or proprietary notations from the materials</li>
                  </ul>
                </div>
                <div className="sm:hidden">
                  <p className="text-sm">
                    <strong>Restrictions:</strong> No modification, commercial use, or reverse engineering allowed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <Users className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    User Accounts
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p>
                      You are responsible for maintaining the confidentiality of your account credentials.
                    </p>
                    <div className="hidden sm:block space-y-3">
                      <p>
                        You agree to accept responsibility for all activities that occur under your account or password. 
                        You must notify us immediately of any unauthorized use of your account.
                      </p>
                      <p>
                        We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.
                      </p>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-sm">
                        You're responsible for account security and must report unauthorized access immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Uses */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Prohibited Uses
                  </h2>
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4">
                      You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800">You may not:</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                          <li>Violate any international, federal, provincial, or state regulations or laws</li>
                          <li>Transmit or procure the sending of any advertising or promotional material</li>
                          <li>Impersonate or attempt to impersonate the company or employees</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800">Also prohibited:</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                          <li>Engage in any other conduct that restricts others' use</li>
                          <li>Use automated systems to access the service</li>
                          <li>Share account credentials with others</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="sm:hidden">
                    <p className="text-gray-600 text-sm">
                      <strong>Prohibited:</strong> Unlawful activities, spam, impersonation, automated access, or credential sharing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Disclaimer
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, and conditions.
                </p>
                <div className="hidden sm:block">
                  <p>
                    AdvancedEnglishTests.com shall not be liable for any damages arising out of or in connection with your use of this website. 
                    This limitation of liability applies to direct, indirect, consequential, special, punitive, or any other damages you or others may suffer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy Link */}
          <Card className="bg-blue-50 border border-blue-200 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h2>
              <p className="text-gray-600 mb-4">
                <span className="hidden sm:inline">Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.</span>
                <span className="sm:hidden">Please review our Privacy Policy for data handling information.</span>
              </p>
              <a 
                href="/privacy" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                Read Privacy Policy →
              </a>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 mb-4">
                <span className="hidden sm:inline">If you have any questions about these Terms and Conditions, please contact us.</span>
                <span className="sm:hidden">Questions? Contact us for clarification.</span>
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> support@advancedenglishtests.com</p>
                <p><strong>Website:</strong> https://advancedenglishtests.com</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
