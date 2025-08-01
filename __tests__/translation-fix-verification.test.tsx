import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '@/contexts/language-context'
import { useTranslation } from '@/hooks/use-translation'

// Test component to verify translations
const TestTranslationComponent = ({ keys }: { keys: string[] }) => {
  const { t } = useTranslation()
  
  return (
    <div>
      {keys.map(key => (
        <div key={key} data-testid={key}>
          {t(key as any)}
        </div>
      ))}
    </div>
  )
}

const TestWrapper = ({ children, language = 'en' }: { children: React.ReactNode; language?: string }) => (
  <LanguageProvider initialLanguage={language}>
    {children}
  </LanguageProvider>
)

describe('Translation Fix Verification', () => {
  describe('Grid Lottery Translations', () => {
    const gridLotteryKeys = [
      'gridLottery.title',
      'gridLottery.readyToStart',
      'gridLottery.startDraw',
      'gridLottery.back',
      'gridLottery.backToHome'
    ]

    it('should display English translations for grid lottery', () => {
      render(
        <TestWrapper language="en">
          <TestTranslationComponent keys={gridLotteryKeys} />
        </TestWrapper>
      )

      expect(screen.getByTestId('gridLottery.title')).toHaveTextContent('Multi-Grid Lottery')
      expect(screen.getByTestId('gridLottery.readyToStart')).toHaveTextContent('Ready to Start')
      expect(screen.getByTestId('gridLottery.startDraw')).toHaveTextContent('Start Draw')
      expect(screen.getByTestId('gridLottery.back')).toHaveTextContent('Back')
      expect(screen.getByTestId('gridLottery.backToHome')).toHaveTextContent('Back to Home')
    })

    it('should display Chinese translations for grid lottery', () => {
      render(
        <TestWrapper language="zh">
          <TestTranslationComponent keys={gridLotteryKeys} />
        </TestWrapper>
      )

      expect(screen.getByTestId('gridLottery.title')).toHaveTextContent('多宫格抽奖')
      expect(screen.getByTestId('gridLottery.readyToStart')).toHaveTextContent('准备开始')
      expect(screen.getByTestId('gridLottery.startDraw')).toHaveTextContent('开始抽奖')
      expect(screen.getByTestId('gridLottery.back')).toHaveTextContent('返回')
      expect(screen.getByTestId('gridLottery.backToHome')).toHaveTextContent('返回首页')
    })
  })

  describe('Blinking Name Picker Translations', () => {
    const blinkingKeys = [
      'blinkingNamePicker.title',
      'blinkingNamePicker.startBlinking',
      'blinkingNamePicker.pause',
      'blinkingNamePicker.restart'
    ]

    it('should display English translations for blinking name picker', () => {
      render(
        <TestWrapper language="en">
          <TestTranslationComponent keys={blinkingKeys} />
        </TestWrapper>
      )

      expect(screen.getByTestId('blinkingNamePicker.title')).toHaveTextContent('Blinking Name Picker')
      expect(screen.getByTestId('blinkingNamePicker.startBlinking')).toHaveTextContent('Start Blinking')
      expect(screen.getByTestId('blinkingNamePicker.pause')).toHaveTextContent('Pause')
      expect(screen.getByTestId('blinkingNamePicker.restart')).toHaveTextContent('Restart')
    })

    it('should display Chinese translations for blinking name picker', () => {
      render(
        <TestWrapper language="zh">
          <TestTranslationComponent keys={blinkingKeys} />
        </TestWrapper>
      )

      expect(screen.getByTestId('blinkingNamePicker.title')).toHaveTextContent('闪烁点名')
      expect(screen.getByTestId('blinkingNamePicker.startBlinking')).toHaveTextContent('开始闪烁')
      expect(screen.getByTestId('blinkingNamePicker.pause')).toHaveTextContent('暂停')
      expect(screen.getByTestId('blinkingNamePicker.restart')).toHaveTextContent('重新开始')
    })
  })

  describe('Translation Key Fallback', () => {
    it('should not display translation keys as text in English', () => {
      render(
        <TestWrapper language="en">
          <TestTranslationComponent keys={['gridLottery.title', 'blinkingNamePicker.title']} />
        </TestWrapper>
      )

      // Should not contain the key itself
      expect(screen.queryByText('gridLottery.title')).not.toBeInTheDocument()
      expect(screen.queryByText('blinkingNamePicker.title')).not.toBeInTheDocument()
      
      // Should contain actual translations
      expect(screen.getByText('Multi-Grid Lottery')).toBeInTheDocument()
      expect(screen.getByText('Blinking Name Picker')).toBeInTheDocument()
    })

    it('should not display translation keys as text in Chinese', () => {
      render(
        <TestWrapper language="zh">
          <TestTranslationComponent keys={['gridLottery.title', 'blinkingNamePicker.title']} />
        </TestWrapper>
      )

      // Should not contain the key itself
      expect(screen.queryByText('gridLottery.title')).not.toBeInTheDocument()
      expect(screen.queryByText('blinkingNamePicker.title')).not.toBeInTheDocument()
      
      // Should contain actual translations
      expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
      expect(screen.getByText('闪烁点名')).toBeInTheDocument()
    })
  })
})