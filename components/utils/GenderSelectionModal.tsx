'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GenderSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onGenderSelect: (gender: string) => void
}

export default function GenderSelectionModal({ 
  isOpen, 
  onClose, 
  onGenderSelect 
}: GenderSelectionModalProps) {
  const [selectedGender, setSelectedGender] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (selectedGender) {
      onGenderSelect(selectedGender)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0  bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader>
          <CardTitle>Select Your Gender</CardTitle>
          <p className="text-sm text-gray-600">
            Please select your gender to help other users find suitable speaking partners.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={selectedGender === 'male'}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="radio radio-primary"
              />
              <span>Male</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={selectedGender === 'female'}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="radio radio-primary"
              />
              <span>Female</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="other"
                checked={selectedGender === 'other'}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="radio radio-primary"
              />
              <span>Other</span>
            </label>
          </div>
          <div className="flex gap-2 pt-4">
           
            <Button 
              onClick={handleSubmit}
              disabled={!selectedGender}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
