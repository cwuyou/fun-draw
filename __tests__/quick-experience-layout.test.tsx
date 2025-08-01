import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuickExperience from '@/components/quick-experience'

// Mock the translation hook
const mockT = vi.fn((key: string, params?: Record<string, any>) => {
  const translations: Record<string, string> = {
    'quickExperience.title': 'Quick Experience',
    'quickExperience.description': 'Choose a scenario and experience the charm of Fun Draw in 30 seconds',
    'quickExperience.viewMoreScenes': 'View More Scenarios',
    'quickExperience.exampleCount': '{count} examples',
    'quickExperience.experienceTime': '30 seconds',
    'quickExperience.examplePreview': 'Preview: {preview}',
    // Experience template with very long text to test overflow
    'experienceTemplates.classroomNaming.name': 'Very Long Classroom Naming Template That Should Be Truncated Properly',
    'experienceTemplates.classroomNaming.description': 'This is a very long description that should be properly truncated and not overflow the card boundaries. It contains multiple sentences to test the line clamping functionality.',
    'experienceTemplates.classroomNaming.tags.0': 'VeryLongTagThatShouldBeTruncated',
    'experienceTemplates.classroomNaming.tags.1': 'Education',
    'experienceTemplates.classroomNaming.tags.2': 'Interactive',
    'experienceTemplates.classroomNaming.tags.3': 'Fair',
    // Sample data
    'experienceTemplates.sampleData.students.张三': 'Alice With Very Long Name That Should Be Handled',
    'experienceTemplates.sampleData.students.李四': 'Bob',
    'experienceTemplates.sampleData.students.王五': 'Charlie'
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

describe('QuickExperience Layout and Text Overflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render card variant without text overflow', () => {
    const { container } = render(<QuickExperience variant="card" />)
    
    // Check that the component renders without throwing errors
    expect(container).toBeInTheDocument()
    
    // Check that overflow-hidden classes are applied
    const cardElements = container.querySelectorAll('.overflow-hidden')
    expect(cardElements.length).toBeGreaterThan(0)
  })

  it('should apply proper CSS classes for text truncation', () => {
    const { container } = render(<QuickExperience variant="card" />)
    
    // Check for truncate classes
    const truncateElements = container.querySelectorAll('.truncate')
    expect(truncateElements.length).toBeGreaterThan(0)
    
    // Check for break-words classes
    const breakWordsElements = container.querySelectorAll('.break-words')
    expect(breakWordsElements.length).toBeGreaterThan(0)
  })

  it('should handle long text content gracefully', () => {
    render(<QuickExperience variant="card" />)
    
    // The component should render without errors even with long text
    expect(screen.getByText('Quick Experience')).toBeInTheDocument()
    expect(screen.getByText('View More Scenarios')).toBeInTheDocument()
  })

  it('should apply responsive grid classes', () => {
    const { container } = render(<QuickExperience variant="card" />)
    
    // Check that grid classes are properly applied
    // Note: This is a basic check since the grid is in the dialog which may not be open
    expect(container.querySelector('.grid')).toBeTruthy()
  })

  it('should have proper flex layout for template items', () => {
    const { container } = render(<QuickExperience variant="card" />)
    
    // Check for flex layout classes
    const flexElements = container.querySelectorAll('.flex')
    expect(flexElements.length).toBeGreaterThan(0)
    
    // Check for min-w-0 class which prevents flex items from overflowing
    const minWidthElements = container.querySelectorAll('.min-w-0')
    expect(minWidthElements.length).toBeGreaterThan(0)
  })
})