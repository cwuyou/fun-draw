import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LanguageProvider } from '@/contexts/language-context'
import { useTranslation } from '@/hooks/use-translation'

// Test component for parameter interpolation
function TestParameterComponent({ translationKey, params }: { 
  translationKey: string
  params?: Record<string, any> 
}) {
  const { t } = useTranslation()
  return <div>{t(translationKey, params)}</div>
}

const renderWithLanguage = (component: React.ReactElement, language: 'zh' | 'en' = 'zh') => {
  return render(
    <LanguageProvider initialLanguage={language}>
      {component}
    </LanguageProvider>
  )
}

describe('Translation Parameter Interpolation', () => {
  it('should interpolate count parameters correctly in Chinese', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.selectedNames"
        params={{ count: 3 }}
      />
    )
    
    expect(screen.getByText('已选中名称 (3)')).toBeInTheDocument()
  })

  it('should interpolate count parameters correctly in English', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.selectedNames"
        params={{ count: 3 }}
      />,
      'en'
    )
    
    expect(screen.getByText('Selected Names (3)')).toBeInTheDocument()
  })

  it('should interpolate name parameters correctly in Chinese', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.selectionComplete"
        params={{ name: '张三' }}
      />
    )
    
    expect(screen.getByText('选择完成，选中了 张三')).toBeInTheDocument()
  })

  it('should interpolate name parameters correctly in English', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.selectionComplete"
        params={{ name: 'Alice' }}
      />,
      'en'
    )
    
    expect(screen.getByText('Selection complete, selected Alice')).toBeInTheDocument()
  })

  it('should interpolate round parameters correctly in Chinese', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.roundSelected"
        params={{ round: 2 }}
      />
    )
    
    expect(screen.getByText('第 2 轮选中')).toBeInTheDocument()
  })

  it('should interpolate round parameters correctly in English', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.roundSelected"
        params={{ round: 2 }}
      />,
      'en'
    )
    
    expect(screen.getByText('Selected in round 2')).toBeInTheDocument()
  })

  it('should handle multiple parameters correctly', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="errors.validation.outOfRange"
        params={{ min: 1, max: 10 }}
      />
    )
    
    expect(screen.getByText('数值超出允许范围 (1-10)')).toBeInTheDocument()
  })

  it('should handle missing parameters gracefully', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.selectedNames"
        // Missing count parameter
      />
    )
    
    // Should still render without throwing error
    expect(screen.getByText(/已选中名称/)).toBeInTheDocument()
  })

  it('should handle undefined parameters gracefully', () => {
    renderWithLanguage(
      <TestParameterComponent 
        translationKey="drawingComponents.blinkingNamePicker.selectionComplete"
        params={{ name: undefined }}
      />
    )
    
    // Should still render without throwing error
    expect(screen.getByText(/选择完成/)).toBeInTheDocument()
  })
})