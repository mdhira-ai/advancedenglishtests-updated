'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Headphones, PenTool, Users, Award, CheckCircle, Play, Target, Clock } from 'lucide-react';

export default function CambridgePage() {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
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

  const books = [
    { id: 8, title: "Cambridge IELTS 8", available: true, tests: 4 },
    { id: 9, title: "Cambridge IELTS 9", available: true, tests: 4 },
    { id: 10, title: "Cambridge IELTS 10", available: true, tests: 4 },
    { id: 11, title: "Cambridge IELTS 11", available: true, tests: 4 },
    { id: 12, title: "Cambridge IELTS 12", available: true, tests: 4 },
    { id: 13, title: "Cambridge IELTS 13", available: true, tests: 4 },
    { id: 14, title: "Cambridge IELTS 14", available: true, tests: 4 },
    { id: 15, title: "Cambridge IELTS 15", available: true, tests: 4 },
    { id: 16, title: "Cambridge IELTS 16", available: true, tests: 4 },
    { id: 17, title: "Cambridge IELTS 17", available: true, tests: 4 },
  ];

  const modules = [
    {
      name: "Listening",
      icon: Headphones,
      description: "30 minutes • 40 questions • 4 sections",
      color: "[#1A3A6E]",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-300"
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
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-300"
    }
  ];

  const getTestTitle = (bookId: number, module: string, testId: number) => {
    const moduleDescriptions: { [key: string]: { [key: number]: string[] } } = {
      Listening: {
        8: ["Social context conversation", "Monologue in social context", "Educational/training context", "Academic lecture"],
        9: ["Job enquiry conversation", "Holiday activity information", "Student discussion", "Academic lecture"],
        10: ["Accommodation enquiry", "Local amenities tour", "Assignment discussion", "Research presentation"],
        11: ["Course enquiry", "Local facility information", "Study group discussion", "Academic lecture"],
        12: ["Travel enquiry", "Local attraction information", "Academic discussion", "Research lecture"],
        13: ["Housing enquiry", "Community information", "Study planning", "Academic presentation"],
        14: ["Service enquiry", "Local information", "Educational discussion", "Academic lecture"],
        15: ["Accommodation booking", "Local facilities", "Academic planning", "Research presentation"],
        16: ["Travel booking", "Local services", "Study discussion", "Academic lecture"],
        17: ["Service enquiry", "Community information", "Educational planning", "Research presentation"]
      },
      Reading: {
        8: ["Scientific discovery", "Social phenomenon", "Historical account"],
        9: ["Scientific innovation", "Space exploration", "Natural history"],
        10: ["Environmental study", "Social research", "Technology development"],
        11: ["Scientific research", "Social investigation", "Historical analysis"],
        12: ["Environmental science", "Social study", "Technology innovation"],
        13: ["Scientific discovery", "Social research", "Historical investigation"],
        14: ["Environmental research", "Social analysis", "Technology study"],
        15: ["Scientific study", "Social phenomenon", "Historical research"],
        16: ["Environmental analysis", "Social investigation", "Technology research"],
        17: ["Scientific research", "Social study", "Historical analysis"]
      },
      Writing: {
        8: ["Process diagram + Education discussion", "Chart analysis + Technology debate", "Map comparison + Environment essay", "Table analysis + Society topic"],
        9: ["Map comparison + Education essay", "Chart analysis + Community service", "Demographics + Health facilities", "Energy consumption + Language diversity"],
        10: ["Process + Education topic", "Chart + Work-life balance", "Map + Urban planning", "Table + Technology impact"],
        11: ["Chart + Education methods", "Process + Work trends", "Map + Urban development", "Table + Environmental issues"],
        12: ["Chart + Education funding", "Process + Work automation", "Map + City planning", "Graph + Social media"],
        13: ["Chart + Education access", "Process + Work culture", "Map + Transportation", "Table + Climate change"],
        14: ["Process + Education technology", "Chart + Career choices", "Map + Urban growth", "Graph + Cultural diversity"],
        15: ["Chart + Education systems", "Process + Remote work", "Map + City development", "Table + Globalization"],
        16: ["Process + Online learning", "Chart + Employment trends", "Map + Infrastructure", "Graph + Social issues"],
        17: ["Chart + Education policy", "Process + Modern workplace", "Map + Urban planning", "Table + Environmental protection"]
      }
    };
    
    const descriptions = moduleDescriptions[module]?.[bookId];
    return descriptions?.[testId - 1] || `Test ${testId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-[#1A3A6E] p-3 rounded-lg mr-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Cambridge IELTS Practice
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Official practice materials for IELTS preparation
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
                selectedBook ? 'bg-[#1A3A6E] border-[#1A3A6E] text-white' : 'border-gray-300 text-gray-400'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Choose Book</span>
            </div>
            <div className={`w-16 h-0.5 ${selectedBook ? 'bg-[#1A3A6E]' : 'bg-gray-300'}`}></div>
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
                selectedBook && selectedModule ? 'bg-[#1A3A6E] border-[#1A3A6E] text-white' : 'border-gray-300 text-gray-400'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Start Test</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Stack on mobile */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-8">
          
          {/* Step 1: Choose Book */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center text-lg">
                <div className="bg-[#1A3A6E] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
                Cambridge Books
              </CardTitle>
              <CardDescription>Select a Cambridge IELTS book to begin</CardDescription>
            </CardHeader>
            <CardContent className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      selectedBook === book.id
                        ? 'border-[#1A3A6E] bg-slate-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedBook(book.id);
                      setSelectedModule(null);
                      scrollToElement(moduleStepRef);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{book.title}</h3>
                        <p className="text-sm text-gray-600">{book.tests} practice tests available</p>
                      </div>
                      {selectedBook === book.id && (
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
              {!selectedBook ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a Cambridge book first</p>
                  <p className="text-sm">Choose from books 8-17 to continue</p>
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
              <CardDescription>Start your IELTS practice test</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedBook || !selectedModule ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Ready to practice?</p>
                  <p className="text-sm">Select a book and module to see available tests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((testId) => (
                    <div key={testId} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Test {testId}</h3>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          Available
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {getTestTitle(selectedBook, selectedModule, testId)}
                      </p>
                      <Link href={`/cambridge/book-${selectedBook}/${selectedModule.toLowerCase()}/test-${testId}`}>
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
                  Complete IELTS Preparation Platform
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Practice with authentic Cambridge materials and track your progress across all IELTS modules
                </p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-2">10</div>
                  <div className="text-sm text-gray-600 font-medium">Cambridge Books</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-2">120</div>
                  <div className="text-sm text-gray-600 font-medium">Practice Tests</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-2">9</div>
                  <div className="text-sm text-gray-600 font-medium">IELTS Skills</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-2">240+</div>
                  <div className="text-sm text-gray-600 font-medium">Hours of Practice</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Section - Simplified on mobile */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Quick Access to Popular Tests
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-8 h-8 text-[#1A3A6E]" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Latest Listening Tests</h4>
                <p className="text-sm text-gray-600 mb-4">Start with Cambridge IELTS 17</p>
                <Link href="/cambridge/book-17/listening/test-1">
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
                <h4 className="font-semibold text-gray-900 mb-2">Popular Reading Tests</h4>
                <p className="text-sm text-gray-600 mb-4">Academic reading practice</p>
                <Link href="/cambridge/book-15/reading/test-1">
                  <Button variant="outline" size="sm" className="w-full border-[#ff8c42] text-[#ff8c42] hover:bg-[#ff8c42] hover:text-white">
                    Try Reading Test
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-md transition-shadow cursor-pointer sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-violet-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Writing Task Practice</h4>
                <p className="text-sm text-gray-600 mb-4">Academic writing tasks</p>
                <Link href="/cambridge/book-14/writing/test-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Try Writing Test
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
