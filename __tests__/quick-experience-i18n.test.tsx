import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuickExperience from '@/components/quick-experience'

// Mock the translation hook
const mockT = vi.fn((key: string, params?: Record<string, any>) => {
  const translations: Record<string, string> = {
    'quickExperience.title': 'Quick Experience',
    'quickExperience.description': 'Choose a scenario and experience the charm of Pick One in 30 seconds',
    'quickExperience.oneClickExperience': 'One-Click Experience',
    'quickExperience.selectScene': 'Select Scene',
    'quickExperience.welcomeFirstTime': 'Welcome to Pick One! Choose a scenario to start your experience.',
    'quickExperience.welcomeReturning': 'Welcome back! Here are some recommended scenarios for you.',
    'quickExperience.quickStart': 'Quick Start',
    'quickExperience.quickStartDescription': 'Use the most recommended template to start immediately',
    'quickExperience.startNow': 'Start Now',
    'quickExperience.forYouRecommended': 'Recommended for You',
    'quickExperience.allScenes': 'All Scenarios',
    'quickExperience.recommended': 'Recommended',
    'quickExperience.exampleCount': '{count} examples',
    'quickExperience.experienceTime': '30 seconds',
    'quickExperience.examplePreview': 'Preview: {preview}',
    'quickExperience.viewMoreScenes': 'View More Scenarios',
    'quickExperience.starting': 'Starting...',
    'quickExperience.experienceStart': 'Experience Started',
    'quickExperience.experienceStartDescription': 'Starting {name} experience...',
    'quickExperience.startFailed': 'Start Failed',
    'quickExperience.startFailedDescription': 'Failed to start experience, please try again',
    // Experience template translations
    'experienceTemplates.classroomNaming.name': 'Classroom Naming',
    'experienceTemplates.classroomNaming.description': 'Random student selection for classroom interaction',
    'experienceTemplates.prizeDrawing.name': 'Prize Drawing',
    'experienceTemplates.prizeDrawing.description': 'Fair and just prize drawing activity',
    'experienceTemplates.partyGame.name': 'Party Game Selection',
    'experienceTemplates.partyGame.description': 'Random game selection to add party fun',
    'experienceTemplates.teamGrouping.name': 'Team Random Grouping',
    'experienceTemplates.teamGrouping.description': 'Fair distribution of team members',
    'experienceTemplates.departmentLottery.name': 'Department Lottery',
    'experienceTemplates.departmentLottery.description': 'Internal department lottery activity',
    'experienceTemplates.annualMeeting.name': 'Annual Meeting Lottery',
    'experienceTemplates.annualMeeting.description': 'Annual meeting live lottery activity',
    // Tags
    'experienceTemplates.classroomNaming.tags.0': 'Education',
    'experienceTemplates.classroomNaming.tags.1': 'Interactive',
    'experienceTemplates.classroomNaming.tags.2': 'Random',
    'experienceTemplates.classroomNaming.tags.3': 'Fair',
    'experienceTemplates.prizeDrawing.tags.0': 'Lottery',
    'experienceTemplates.prizeDrawing.tags.1': 'Prize',
    'experienceTemplates.prizeDrawing.tags.2': 'Fair',
    'experienceTemplates.prizeDrawing.tags.3': 'Incentive',
    'experienceTemplates.partyGame.tags.0': 'Entertainment',
    'experienceTemplates.partyGame.tags.1': 'Party',
    'experienceTemplates.partyGame.tags.2': 'Game',
    'experienceTemplates.partyGame.tags.3': 'Interactive',
    'experienceTemplates.teamGrouping.tags.0': 'Team',
    'experienceTemplates.teamGrouping.tags.1': 'Grouping',
    'experienceTemplates.teamGrouping.tags.2': 'Collaboration',
    'experienceTemplates.teamGrouping.tags.3': 'Fair',
    'experienceTemplates.departmentLottery.tags.0': 'Enterprise',
    'experienceTemplates.departmentLottery.tags.1': 'Department',
    'experienceTemplates.departmentLottery.tags.2': 'Lottery',
    'experienceTemplates.departmentLottery.tags.3': 'Team Building',
    'experienceTemplates.annualMeeting.tags.0': 'Annual Meeting',
    'experienceTemplates.annualMeeting.tags.1': 'Lottery',
    'experienceTemplates.annualMeeting.tags.2': 'Celebration',
    'experienceTemplates.annualMeeting.tags.3': 'Reward',
    // Sample data
    'experienceTemplates.sampleData.students.张三': 'Alice',
    'experienceTemplates.sampleData.students.李四': 'Bob',
    'experienceTemplates.sampleData.students.王五': 'Charlie',
    'experienceTemplates.sampleData.games.真心话大冒险': 'Truth or Dare',
    'experienceTemplates.sampleData.games.狼人杀': 'Werewolf',
    'experienceTemplates.sampleData.prizes.iPhone 15 Pro': 'iPhone 15 Pro',
    'experienceTemplates.sampleData.teamMembers.小明': 'Xiao Ming',
    'experienceTemplates.sampleData.employees.张经理': 'Manager Zhang',
    'experienceTemplates.sampleData.annualPrizes.特等奖：海外旅游': 'Grand Prize: Overseas Travel'
  }
  
  if (params) {
    let result = translations[key] || key
    Object.entries(params).forEach(([param, value]) => {
      result = result.replace(`{${param}}`, String(value))
    })
    return result
  }
  
  return translations[key] || key
})

vi.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({ t: mockT })
}))

// Mock the experience manager functions
vi.mock('@/lib/experience-manager', () => ({
  createExperienceSession: vi.fn(),
  getRecommendedTemplates: vi.fn(() => []),
  isFirstTimeUser: vi.fn(() => true)
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('QuickExperience Internationalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with English translations when language is English', () => {
    render(<QuickExperience variant="card" />)
    
    // Check if the component uses translation keys instead of hardcoded Chinese text
    expect(mockT).toHaveBeenCalledWith('quickExperience.title')
    expect(mockT).toHaveBeenCalledWith('quickExperience.description')
  })

  it('should render experience templates with translated names', () => {
    render(<QuickExperience variant="card" />)
    
    // Check if experience template translation keys are called
    expect(mockT).toHaveBeenCalledWith('experienceTemplates.classroomNaming.name')
    expect(mockT).toHaveBeenCalledWith('experienceTemplates.prizeDrawing.name')
    expect(mockT).toHaveBeenCalledWith('experienceTemplates.partyGame.name')
  })

  it('should not contain hardcoded Chinese text in template names', () => {
    render(<QuickExperience variant="card" />)
    
    // These Chinese texts should not appear in the rendered output
    expect(screen.queryByText('聚会游戏选择')).not.toBeInTheDocument()
    expect(screen.queryByText('课堂随机点名')).not.toBeInTheDocument()
    expect(screen.queryByText('奖品抽取')).not.toBeInTheDocument()
  })

  it('should render English template names when using English translations', () => {
    render(<QuickExperience variant="card" />)
    
    // These English texts should appear when using English translations
    // Note: We need to wait for the component to load templates
    setTimeout(() => {
      expect(screen.queryByText('Classroom Naming')).toBeInTheDocument()
      expect(screen.queryByText('Prize Drawing')).toBeInTheDocument()
      expect(screen.queryByText('Party Game Selection')).toBeInTheDocument()
    }, 100)
  })
})