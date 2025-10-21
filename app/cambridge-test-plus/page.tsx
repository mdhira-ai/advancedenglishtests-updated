'use client'

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Headphones, PenTool, Mic, Users, Star, Award, Target, CheckCircle, Play } from 'lucide-react';
// import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CambridgeTestPlusPage() {
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  // Refs for scrolling
  const moduleStepRef = useRef<HTMLDivElement>(null);
  const testStepRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll to element smoothly on mobile
  const scrollToElement = (elementRef: React.RefObject<HTMLDivElement | null>) => {
    if (elementRef.current && window.innerWidth < 1024) { // Only scroll on mobile/tablet
      setTimeout(() => {
        elementRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100); // Small delay to ensure state update is complete
    }
  };

  const testSeries = [
    {
      id: 1,
      title: "Cambridge Tests Plus 1",
      description: "Additional practice tests with enhanced features",
      available: true,
      tests: 4
    },
    {
      id: 2,
      title: "Cambridge Tests Plus 2",
      description: "Advanced practice tests with comprehensive feedback",
      available: true,
      tests: 4
    },
    {
      id: 3,
      title: "Cambridge Tests Plus 3",
      description: "Advanced practice tests with comprehensive feedback",
      available: true,
      tests: 4
    }
  ];

  const modules = [
    {
      name: "Listening",
      icon: Headphones,
      description: "30 minutes • 40 questions • 4 sections",
      color: "[#1A3A6E]",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300"
    },
    {
      name: "Reading",
      icon: BookOpen,
      description: "60 minutes • 40 questions • 3 passages",
      color: "[#ff8c42]",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-300"
    },
    {
      name: "Writing",
      icon: PenTool,
      description: "60 minutes • 2 tasks • Academic/General",
      color: "[#4f5bd5]",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300"
    }
  ];

  const getTestTitle = (seriesId: number, module: string, testId: number) => {
    const moduleDescriptions: { [key: string]: { [key: number]: string[] } } = {
      Listening: {
        1: ["Social context conversation", "Monologue about services", "Educational discussion", "Academic lecture"],
        2: ["Travel enquiry", "Local facilities information", "Study group planning", "Research presentation"]
      },
      Reading: {
        1: ["Scientific innovation", "Social phenomenon", "Environmental study"],
        2: ["Technology development", "Cultural analysis", "Historical research"]
      },
      Writing: {
        1: ["Process diagram + Education topic", "Chart analysis + Technology essay", "Map comparison + Society issue", "Table analysis + Environment"],
        2: ["Graph analysis + Work trends", "Process + Urban planning", "Chart + Health systems", "Diagram + Communication"]
      }
    };
    
    const descriptions = moduleDescriptions[module]?.[seriesId];
    return descriptions?.[testId - 1] || `Test ${testId}`;
  };

  return (
    // <ProtectedRoute pageType="cambridge-plus">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-[#1A3A6E] p-3 rounded-lg mr-4">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                    Cambridge IELTS Test Plus
                  </h1>
                  <p className="text-lg text-gray-600 mt-2">
                    Enhanced practice tests with advanced features
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Progress Steps - Hidden on mobile */}
          <div className="hidden lg:flex items-center justify-center mb-12">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  selectedSeries ? 'bg-[#1A3A6E] border-[#1A3A6E] text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Choose Series</span>
              </div>
              <div className={`w-16 h-0.5 ${selectedSeries ? 'bg-[#1A3A6E]' : 'bg-gray-300'}`}></div>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  selectedModule ? 'bg-[#1A3A6E] border-[#1A3A6E] text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Select Module</span>
              </div>
              <div className={`w-16 h-0.5 ${selectedModule ? 'bg-[#1A3A6E]' : 'bg-gray-300'}`}></div>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  selectedSeries && selectedModule ? 'bg-[#1A3A6E] border-[#1A3A6E] text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Start Test</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid - Stack on mobile */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-8">
            
            {/* Step 1: Choose Series */}
            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-lg">
                  <div className="bg-[#1A3A6E] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </div>
                  Test Plus Series
                </CardTitle>
                <CardDescription>Select a Cambridge Test Plus series to begin</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {testSeries.map((series) => (
                    <div
                      key={series.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                        selectedSeries === series.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedSeries(series.id);
                        setSelectedModule(null);
                        scrollToElement(moduleStepRef);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{series.title}</h3>
                          <p className="text-sm text-gray-600">{series.tests} enhanced practice tests</p>
                        </div>
                        {selectedSeries === series.id && (
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Choose Module */}
            <Card className="shadow-sm" ref={moduleStepRef}>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-lg">
                  <div className="bg-[#1A3A6E] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </div>
                  IELTS Modules
                </CardTitle>
                <CardDescription>Choose which skill to practice</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedSeries ? (
                  <div className="text-center py-12 text-gray-500">
                    <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a Test Plus series first</p>
                    <p className="text-sm">Choose from Plus 1 or Plus 2 to continue</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module) => {
                      const IconComponent = module.icon;
                      return (
                        <div
                          key={module.name}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                            selectedModule === module.name
                              ? `border-${module.color} ${module.bgColor} shadow-sm`
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedModule(module.name);
                            scrollToElement(testStepRef);
                          }}
                        >
                          <div className="flex items-center">
                            <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mr-4 flex-shrink-0`}>
                              <IconComponent className={`w-6 h-6 text-${module.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{module.name}</h3>
                              <p className="text-sm text-gray-600">{module.description}</p>
                            </div>
                            {selectedModule === module.name && (
                              <CheckCircle className={`w-6 h-6 text-${module.color} flex-shrink-0`} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Choose Test */}
            <Card className="shadow-sm" ref={testStepRef}>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-lg">
                  <div className="bg-[#1A3A6E] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </div>
                  Practice Tests
                </CardTitle>
                <CardDescription>Start your enhanced IELTS practice test</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedSeries || !selectedModule ? (
                  <div className="text-center py-12 text-gray-500">
                    <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Ready to practice?</p>
                    <p className="text-sm">Select a series and module to see available tests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((testId) => (
                      <div key={testId} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Test {testId}</h3>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Enhanced
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {getTestTitle(selectedSeries, selectedModule, testId)}
                        </p>
                        <Link href={`/cambridge-test-plus/tests-plus-${selectedSeries}/${selectedModule.toLowerCase()}/test-${testId}`}>
                          <Button className="w-full bg-[#1A3A6E] hover:bg-[#142d57] text-white">
                            <Play className="w-4 h-4 mr-2" />
                            Start Test {testId}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Section - Hide on mobile, simplify on tablet */}
          <div className="mt-16 hidden md:block">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <Award className="w-16 h-16 text-[#1A3A6E] mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Enhanced IELTS Test Plus Platform
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Practice with enhanced Cambridge Test Plus materials featuring advanced feedback and comprehensive analytics
                  </p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
                    <div className="text-sm text-gray-600 font-medium">Test Plus Series</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">32</div>
                    <div className="text-sm text-gray-600 font-medium">Enhanced Tests</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">4</div>
                    <div className="text-sm text-gray-600 font-medium">IELTS Skills</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">60+</div>
                    <div className="text-sm text-gray-600 font-medium">Hours of Practice</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Section - Simplified on mobile */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
              Quick Access to Enhanced Tests
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Headphones className="w-8 h-8 text-[#1A3A6E]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Enhanced Listening</h4>
                  <p className="text-sm text-gray-600 mb-4">Start with Test Plus 1</p>
                  <Link href="/cambridge-test-plus/tests-plus-1/listening/test-1">
                    <Button variant="outline" size="sm" className="w-full border-[#1A3A6E] text-[#1A3A6E] hover:bg-[#1A3A6E] hover:text-white">
                      Try Listening Test
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-[#ff8c42]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Advanced Reading</h4>
                  <p className="text-sm text-gray-600 mb-4">Enhanced passages</p>
                  <Link href="/cambridge-test-plus/tests-plus-1/reading/test-1">
                    <Button variant="outline" size="sm" className="w-full border-[#ff8c42] text-[#ff8c42] hover:bg-[#ff8c42] hover:text-white">
                      Try Reading Test
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer sm:col-span-2 lg:col-span-1">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PenTool className="w-8 h-8 text-[#4f5bd5]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Writing Plus</h4>
                  <p className="text-sm text-gray-600 mb-4">Enhanced feedback</p>
                  <Link href="/cambridge-test-plus/tests-plus-1/writing/test-1">
                    <Button variant="outline" size="sm" className="w-full border-[#4f5bd5] text-[#4f5bd5] hover:bg-[#4f5bd5] hover:text-white">
                      Try Writing Test
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    // </ProtectedRoute>
  );
}
