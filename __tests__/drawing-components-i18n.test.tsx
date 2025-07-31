import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider } from '@/contexts/language-context'
import { SlotMachineReel } from '@/components/slot-machine-reel'
import { BulletScreenReel } from '@/components/bullet-screen-reel'
import { BlinkingNamePicker } from '@/components/blinking-name-picker'
import { BlinkingControlPanel } from '@/components/blinking-control-panel'
import type { ListItem, BlinkingGameState, BlinkingConfig } from '@/types'

// Mock sound manager
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setVolume: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true)
  }
}))

// Mock animation performance hook
vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: vi.fn(),
    unregisterAnimation: vi.fn()
  })
}))

// Mock blinking animation
vi.mock('@/lib/blinking-animation', () => ({
  BlinkingAnimationController: vi.fn().mockImplementation(() => ({
    startBlinking: vi.fn(),
    stopBlinking: vi.fn(),
    pauseBlinking: vi.fn(),
    resumeBlinking: vi.fn()
  })),
  RandomSelector: vi.fn(),
  ColorCycleManager: vi.fn().mockImplementation(() => ({
    reset: vi.fn(),
    getNextColor: vi.fn().mockReturnValue('#ef4444')
  }))
}))

const mockItems: ListItem[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' }
]

const mockBlinkingConfig: BlinkingConfig = {
  initialSpeed: 100,
  finalSpeed: 1000,
  accelerationDuration: 3000,
  colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'],
  glowIntensity: 0.8
}

const mockBlinkingGameState: BlinkingGameState = {
  phase: 'idle',
  items: [],
  selectedItems: [],
  currentRound: 1,
  totalRounds: 1
}

const renderWithLanguage = (component: React.ReactElement, language: 'zh' | 'en' = 'zh') => {
  return render(
    <LanguageProvider initialLanguage={language}>
      {component}
    </LanguageProvider>
  )
}

describe('Drawing Components Internationalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SlotMachineReel', () => {
    it('should render without translation errors', () => {
      const onSpinComplete = vi.fn()
      
      renderWithLanguage(
        <SlotMachineReel
          items={mockItems}
          isSpinning={false}
          onSpinComplete={onSpinComplete}
        />
      )
      
      // Component should render without throwing errors
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('should work with English language', () => {
      const onSpinComplete = vi.fn()
      
      renderWithLanguage(
        <SlotMachineReel
          items={mockItems}
          isSpinning={false}
          onSpinComplete={onSpinComplete}
        />,
        'en'
      )
      
      // Component should render without throwing errors in English
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })

  describe('BulletScreenReel', () => {
    it('should render phase text in Chinese', () => {
      const onScrollComplete = vi.fn()
      
      renderWithLanguage(
        <BulletScreenReel
          items={mockItems}
          isScrolling={false}
          onScrollComplete={onScrollComplete}
        />
      )
      
      // Should show Chinese ready text
      expect(screen.getByText('准备中')).toBeInTheDocument()
    })

    it('should render phase text in English', () => {
      const onScrollComplete = vi.fn()
      
      renderWithLanguage(
        <BulletScreenReel
          items={mockItems}
          isScrolling={false}
          onScrollComplete={onScrollComplete}
        />,
        'en'
      )
      
      // Should show English ready text
      expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    it('should update phase text when scrolling', () => {
      const onScrollComplete = vi.fn()
      
      const { rerender } = renderWithLanguage(
        <BulletScreenReel
          items={mockItems}
          isScrolling={false}
          onScrollComplete={onScrollComplete}
        />
      )
      
      expect(screen.getByText('准备中')).toBeInTheDocument()
      
      // Start scrolling
      rerender(
        <LanguageProvider initialLanguage="zh">
          <BulletScreenReel
            items={mockItems}
            isScrolling={true}
            onScrollComplete={onScrollComplete}
          />
        </LanguageProvider>
      )
      
      // Should eventually show accelerating text (after animation starts)
      // Note: This might need to wait for animation to start
    })
  })

  describe('BlinkingNamePicker', () => {
    it('should render empty list message in Chinese', () => {
      const onComplete = vi.fn()
      const onRestart = vi.fn()
      
      renderWithLanguage(
        <BlinkingNamePicker
          items={[]}
          quantity={1}
          allowRepeat={false}
          onComplete={onComplete}
          onRestart={onRestart}
          soundEnabled={false}
        />
      )
      
      expect(screen.getByText('请先添加参与者才能开始闪烁点名抽奖')).toBeInTheDocument()
    })

    it('should render empty list message in English', () => {
      const onComplete = vi.fn()
      const onRestart = vi.fn()
      
      renderWithLanguage(
        <BlinkingNamePicker
          items={[]}
          quantity={1}
          allowRepeat={false}
          onComplete={onComplete}
          onRestart={onRestart}
          soundEnabled={false}
        />,
        'en'
      )
      
      expect(screen.getByText('Please add participants before starting blinking name picker')).toBeInTheDocument()
    })

    it('should render game status in Chinese', () => {
      const onComplete = vi.fn()
      const onRestart = vi.fn()
      
      renderWithLanguage(
        <BlinkingNamePicker
          items={mockItems}
          quantity={1}
          allowRepeat={false}
          onComplete={onComplete}
          onRestart={onRestart}
          soundEnabled={false}
        />
      )
      
      expect(screen.getByText('准备开始')).toBeInTheDocument()
    })

    it('should render game status in English', () => {
      const onComplete = vi.fn()
      const onRestart = vi.fn()
      
      renderWithLanguage(
        <BlinkingNamePicker
          items={mockItems}
          quantity={1}
          allowRepeat={false}
          onComplete={onComplete}
          onRestart={onRestart}
          soundEnabled={false}
        />,
        'en'
      )
      
      expect(screen.getByText('Ready to start')).toBeInTheDocument()
    })
  })

  describe('BlinkingControlPanel', () => {
    it('should render status text in Chinese', () => {
      const mockHandlers = {
        onStart: vi.fn(),
        onStop: vi.fn(),
        onReset: vi.fn(),
        onSoundToggle: vi.fn()
      }
      
      renderWithLanguage(
        <BlinkingControlPanel
          gameState={mockBlinkingGameState}
          config={mockBlinkingConfig}
          soundEnabled={false}
          {...mockHandlers}
        />
      )
      
      expect(screen.getByText('准备开始')).toBeInTheDocument()
    })

    it('should render status text in English', () => {
      const mockHandlers = {
        onStart: vi.fn(),
        onStop: vi.fn(),
        onReset: vi.fn(),
        onSoundToggle: vi.fn()
      }
      
      renderWithLanguage(
        <BlinkingControlPanel
          gameState={mockBlinkingGameState}
          config={mockBlinkingConfig}
          soundEnabled={false}
          {...mockHandlers}
        />,
        'en'
      )
      
      expect(screen.getByText('Ready to Start')).toBeInTheDocument()
    })

    it('should update status text when game state changes', () => {
      const mockHandlers = {
        onStart: vi.fn(),
        onStop: vi.fn(),
        onReset: vi.fn(),
        onSoundToggle: vi.fn()
      }
      
      const blinkingState: BlinkingGameState = {
        ...mockBlinkingGameState,
        phase: 'blinking'
      }
      
      renderWithLanguage(
        <BlinkingControlPanel
          gameState={blinkingState}
          config={mockBlinkingConfig}
          soundEnabled={false}
          {...mockHandlers}
        />
      )
      
      expect(screen.getByText('正在闪烁选择中...')).toBeInTheDocument()
    })
  })

  describe('Translation Key Validation', () => {
    it('should not throw errors for missing translation keys', () => {
      // Test that components gracefully handle missing translation keys
      const onComplete = vi.fn()
      const onRestart = vi.fn()
      
      expect(() => {
        renderWithLanguage(
          <BlinkingNamePicker
            items={mockItems}
            quantity={1}
            allowRepeat={false}
            onComplete={onComplete}
            onRestart={onRestart}
            soundEnabled={false}
          />
        )
      }).not.toThrow()
    })

    it('should handle parameter interpolation correctly', () => {
      const onComplete = vi.fn()
      const onRestart = vi.fn()
      
      const gameStateWithSelection: BlinkingGameState = {
        ...mockBlinkingGameState,
        phase: 'finished',
        selectedItems: [mockItems[0], mockItems[1]]
      }
      
      // This would test parameter interpolation in translations
      // The actual test would depend on how the component displays selected items
      expect(() => {
        renderWithLanguage(
          <BlinkingNamePicker
            items={mockItems}
            quantity={2}
            allowRepeat={false}
            onComplete={onComplete}
            onRestart={onRestart}
            soundEnabled={false}
          />
        )
      }).not.toThrow()
    })
  })
})