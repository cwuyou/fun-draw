"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowRight, Sparkles, Users, Gift, GraduationCap, Building, Heart } from 'lucide-react'
import { ExperienceTemplate } from '@/types'
import { saveUserPreferences } from '@/lib/experience-manager'

interface ExperienceGuideProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelect: (template: ExperienceTemplate) => void
  className?: string
}

interface GuideStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
}

export default function ExperienceGuide({ 
  isOpen, 
  onClose, 
  onTemplateSelect,
  className = ''
}: ExperienceGuideProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [showSkipOption, setShowSkipOption] = useState(false)

  const guideSteps: GuideStep[] = [
    {
      id: 'welcome',
      title: t('experienceGuide.welcome.title'),
      description: t('experienceGuide.welcome.description'),
      icon: Sparkles,
      completed: false
    },
    {
      id: 'modes',
      title: t('experienceGuide.modes.title'),
      description: t('experienceGuide.modes.description'),
      icon: Gift,
      completed: false
    },
    {
      id: 'scenarios',
      title: t('experienceGuide.scenarios.title'),
      description: t('experienceGuide.scenarios.description'),
      icon: Users,
      completed: false
    }
  ]

  const popularTemplates: ExperienceTemplate[] = [
    {
      id: 'classroom-naming',
      name: t('experienceGuide.templates.classroomNaming'),
      description: t('experienceGuide.templates.classroomNamingDesc'),
      scenario: 'education',
      items: [],
      suggestedMode: 'blinking-name-picker',
      suggestedConfig: { quantity: 1, allowRepeat: false },
      icon: GraduationCap,
      color: 'bg-blue-500',
      tags: ['教育', '课堂']
    },
    {
      id: 'annual-meeting',
      name: t('experienceGuide.templates.annualMeeting'),
      description: t('experienceGuide.templates.annualMeetingDesc'),
      scenario: 'corporate',
      items: [],
      suggestedMode: 'grid-lottery',
      suggestedConfig: { quantity: 1, allowRepeat: false },
      icon: Building,
      color: 'bg-yellow-500',
      tags: ['企业', '年会']
    },
    {
      id: 'party-game',
      name: t('experienceGuide.templates.partyGame'),
      description: t('experienceGuide.templates.partyGameDesc'),
      scenario: 'entertainment',
      items: [],
      suggestedMode: 'card-flip',
      suggestedConfig: { quantity: 1, allowRepeat: false },
      icon: Heart,
      color: 'bg-pink-500',
      tags: ['聚会', '娱乐']
    }
  ]

  useEffect(() => {
    // 3秒后显示跳过选项
    const timer = setTimeout(() => {
      setShowSkipOption(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    // 保存用户偏好：跳过引导
    saveUserPreferences({ skipIntro: true })
    onClose()
  }

  const handleTemplateSelect = (template: ExperienceTemplate) => {
    // 保存用户偏好：完成引导
    saveUserPreferences({ skipIntro: false })
    onTemplateSelect(template)
    onClose()
  }

  const renderStepContent = () => {
    const step = guideSteps[currentStep]
    const IconComponent = step.icon

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <IconComponent className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{step.title}</h2>
              <p className="text-gray-600 text-lg">{step.description}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-700">
                {t('experienceGuide.welcome.tip')}
              </p>
            </div>
          </div>
        )

      case 'modes':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h2>
              <p className="text-gray-600">{step.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: t('experienceGuide.modes.slotMachine'), color: 'bg-red-500', desc: t('experienceGuide.modes.slotMachineDesc') },
                { name: t('experienceGuide.modes.cardFlip'), color: 'bg-blue-500', desc: t('experienceGuide.modes.cardFlipDesc') },
                { name: t('experienceGuide.modes.bulletScreen'), color: 'bg-green-500', desc: t('experienceGuide.modes.bulletScreenDesc') },
                { name: t('experienceGuide.modes.gridLottery'), color: 'bg-yellow-500', desc: t('experienceGuide.modes.gridLotteryDesc') }
              ].map((mode, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`w-8 h-8 ${mode.color} rounded-lg mx-auto mb-2`}></div>
                  <div className="font-medium text-sm text-gray-800">{mode.name}</div>
                  <div className="text-xs text-gray-500">{mode.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'scenarios':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h2>
              <p className="text-gray-600 mb-4">{step.description}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-center mb-4">{t('experienceGuide.scenarios.selectPrompt')}</h3>
              {popularTemplates.map(template => {
                const TemplateIcon = template.icon as React.ComponentType<{ className?: string }>
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-purple-50 border-purple-100"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <TemplateIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="sr-only">
            {t('experienceGuide.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('experienceGuide.description')}
          </DialogDescription>
          {/* 进度指示器 */}
          <div className="flex justify-center gap-2 mb-4">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          {/* 跳过按钮 */}
          {showSkipOption && currentStep < guideSteps.length - 1 && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              {t('experienceGuide.skipGuide')}
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            {currentStep < guideSteps.length - 1 && (
              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('experienceGuide.nextStep')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}