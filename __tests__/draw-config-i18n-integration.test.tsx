/**
 * 抽奖配置页面国际化集成测试
 * 测试完整的用户流程中所有文本的正确显示
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageProvider } from '@/contexts/language-context'
import DrawConfigPage from '@/app/draw-config/page'
import { useRouter } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock translation files
global.fetch = jest.fn()

const mockTranslations = {
  zh: {
    common: {
      loading: '加载中...',
      save: '保存',
      back: '返回'
    },
    drawConfig: {
      title: '抽奖配置',
      back: '返回',
      loading: '加载中...',
      quickConfigTab: '快速配置',
      detailedConfig: '详细配置',
      configurationSettings: '抽奖配置',
      configurationSettingsDescription: '选择快速配置模板或详细抽奖参数设置',
      selectMode: '选择抽奖模式',
      selectModeDescription: '选择最适合您场景的抽奖动画模式',
      drawSettings: '抽奖设置',
      drawSettingsDescription: '配置抽奖参数以满足您的具体需求',
      startDraw: '开始抽奖',
      itemsCount: '{{count}}位参与者',
      currentList: '当前名单：{{name}}',
      itemsPreview: '共{{count}}位参与者：{{preview}}'
    },
    quickConfig: {
      title: '快速配置',
      description: '选择预设配置模板，一键设置抽奖参数，省时省力',
      smartRecommendations: '智能推荐',
      frequentConfigs: '常用配置',
      allTemplates: '所有模板'
    },
    drawingModes: {
      slotMachine: {
        name: '老虎机式',
        shortTitle: '老虎机式',
        description: '经典滚轮动画，紧张刺激的抽奖体验'
      },
      cardFlip: {
        name: '卡牌抽取式',
        shortTitle: '卡牌抽取式',
        description: '优雅翻牌动画，如同魔术师的表演'
      },
      bulletScreen: {
        name: '弹幕滚动式',
        title: '弹幕滚动式',
        description: '快速滚动定格，动态选择过程'
      },
      gridLottery: {
        name: '多宫格抽奖',
        shortTitle: '多宫格抽奖',
        description: '电视节目风格，灯光跳跃定格，仪式感十足'
      },
      blinkingNamePicker: {
        name: '闪烁点名式',
        title: '闪烁点名式',
        description: '快速闪烁定格，公平随机点名体验'
      }
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      back: 'Back'
    },
    drawConfig: {
      title: 'Draw Configuration',
      back: 'Back',
      loading: 'Loading...',
      quickConfigTab: 'Quick Config',
      detailedConfig: 'Detailed Config',
      configurationSettings: 'Drawing Configuration',
      configurationSettingsDescription: 'Select quick configuration templates or detailed drawing parameter settings',
      selectMode: 'Select Drawing Mode',
      selectModeDescription: 'Choose the most suitable drawing animation mode for your scenario',
      drawSettings: 'Drawing Settings',
      drawSettingsDescription: 'Configure drawing parameters to meet your specific needs',
      startDraw: 'Start Drawing',
      itemsCount: '{{count}} participants',
      currentList: 'Current List: {{name}}',
      itemsPreview: 'Total {{count}} participants: {{preview}}'
    },
    quickConfig: {
      title: 'Quick Configuration',
      description: 'Select preset configuration templates to set drawing parameters with one click, saving time and effort',
      smartRecommendations: 'Smart Recommendations',
      frequentConfigs: 'Frequently Used',
      allTemplates: 'All Templates'
    },
    drawingModes: {
      slotMachine: {
        name: 'Slot Machine',
        shortTitle: 'Slot Machine',
        description: 'Classic reel animation with thrilling drawing experience'
      },
      cardFlip: {
        name: 'Card Drawing',
        shortTitle: 'Card Drawing',
        description: 'Elegant card flip animation like a magician\'s performance'
      },
      bulletScreen: {
        name: 'Bullet Screen',
        title: 'Bullet Screen Scrolling',
        description: 'Fast scrolling freeze, dynamic selection process'
      },
      gridLottery: {
        name: 'Grid Lottery',
        shortTitle: 'Grid Lottery',
        description: 'TV show style, light jumping freeze, full of ceremony'
      },
      blinkingNamePicker: {
        name: 'Blinking Name Picker',
        title: 'Blinking Name Calling',
        description: 'Fast blinking freeze, fair random name calling experience'
      }
    }
  }
}

describe('抽奖配置页面国际化集成测试', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    
    // Mock localStorage with test data
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'temp-draw-list') {
        return JSON.stringify({
          name: '测试名单',
          items: [
            { id: '1', name: '张三' },
            { id: '2', name: '李四' },
            { id: '3', name: '王五' }
          ]
        })
      }
      return null
    })
  })

  describe('中文环境测试', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTranslations.zh
      })
    })

    it('应该正确显示中文页面标题和导航', async () => {
      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('抽奖配置')).toBeInTheDocument()
        expect(screen.getByText('返回')).toBeInTheDocument()
      })
    })

    it('应该正确显示快速配置标签页', async () => {
      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('快速配置')).toBeInTheDocument()
        expect(screen.getByText('详细配置')).toBeInTheDocument()
      })
    })

    it('应该正确显示配置区域标题和描述', async () => {
      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('抽奖配置')).toBeInTheDocument()
        expect(screen.getByText('选择快速配置模板或详细抽奖参数设置')).toBeInTheDocument()
      })
    })

    it('应该正确显示抽奖模式名称', async () => {
      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        // 切换到详细配置标签页
        const detailedConfigTab = screen.getByText('详细配置')
        fireEvent.click(detailedConfigTab)
      })

      await waitFor(() => {
        expect(screen.getByText('老虎机式')).toBeInTheDocument()
        expect(screen.getByText('卡牌抽取式')).toBeInTheDocument()
        expect(screen.getByText('弹幕滚动式')).toBeInTheDocument()
        expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
        expect(screen.getByText('闪烁点名式')).toBeInTheDocument()
      })
    })

    it('应该正确显示参与者信息', async () => {
      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('3位参与者')).toBeInTheDocument()
        expect(screen.getByText('当前名单：测试名单')).toBeInTheDocument()
      })
    })
  })

  describe('英文环境测试', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTranslations.en
      })
      
      // Mock English list data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'temp-draw-list') {
          return JSON.stringify({
            name: 'Test List',
            items: [
              { id: '1', name: 'John' },
              { id: '2', name: 'Jane' },
              { id: '3', name: 'Bob' }
            ]
          })
        }
        return null
      })
    })

    it('应该正确显示英文页面标题和导航', async () => {
      render(
        <LanguageProvider defaultLanguage="en">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Draw Configuration')).toBeInTheDocument()
        expect(screen.getByText('Back')).toBeInTheDocument()
      })
    })

    it('应该正确显示英文标签页', async () => {
      render(
        <LanguageProvider defaultLanguage="en">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Quick Config')).toBeInTheDocument()
        expect(screen.getByText('Detailed Config')).toBeInTheDocument()
      })
    })

    it('应该正确显示英文抽奖模式名称', async () => {
      render(
        <LanguageProvider defaultLanguage="en">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        // 切换到详细配置标签页
        const detailedConfigTab = screen.getByText('Detailed Config')
        fireEvent.click(detailedConfigTab)
      })

      await waitFor(() => {
        expect(screen.getByText('Slot Machine')).toBeInTheDocument()
        expect(screen.getByText('Card Drawing')).toBeInTheDocument()
        expect(screen.getByText('Bullet Screen Scrolling')).toBeInTheDocument()
        expect(screen.getByText('Grid Lottery')).toBeInTheDocument()
        expect(screen.getByText('Blinking Name Calling')).toBeInTheDocument()
      })
    })

    it('应该正确显示英文参与者信息', async () => {
      render(
        <LanguageProvider defaultLanguage="en">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('3 participants')).toBeInTheDocument()
        expect(screen.getByText('Current List: Test List')).toBeInTheDocument()
      })
    })
  })

  describe('语言切换测试', () => {
    it('应该支持动态语言切换', async () => {
      let fetchCallCount = 0
      ;(fetch as jest.Mock).mockImplementation(() => {
        fetchCallCount++
        const translations = fetchCallCount === 1 ? mockTranslations.zh : mockTranslations.en
        return Promise.resolve({
          ok: true,
          json: async () => translations
        })
      })

      function LanguageSwitchTest() {
        const { setLanguage } = require('@/hooks/use-translation').useTranslation()
        
        return (
          <div>
            <DrawConfigPage />
            <button 
              data-testid="switch-to-en" 
              onClick={() => setLanguage('en')}
            >
              Switch to English
            </button>
          </div>
        )
      }

      render(
        <LanguageProvider defaultLanguage="zh">
          <LanguageSwitchTest />
        </LanguageProvider>
      )

      // 初始状态（中文）
      await waitFor(() => {
        expect(screen.getByText('抽奖配置')).toBeInTheDocument()
        expect(screen.getByText('快速配置')).toBeInTheDocument()
      })

      // 切换到英文
      const switchButton = screen.getByTestId('switch-to-en')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByText('Draw Configuration')).toBeInTheDocument()
        expect(screen.getByText('Quick Config')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理测试', () => {
    it('应该处理翻译文件加载失败的情况', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      // 应该显示加载状态或降级内容
      await waitFor(() => {
        // 在翻译加载失败时，应该显示键名或默认内容
        expect(screen.getByText(/loading|加载|Loading/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('应该处理缺失翻译键的情况', async () => {
      const incompleteTranslations = {
        common: {
          loading: '加载中...'
        },
        drawConfig: {
          title: '抽奖配置'
          // 缺少其他键
        }
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => incompleteTranslations
      })

      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('抽奖配置')).toBeInTheDocument()
        // 缺失的键应该显示键名作为降级
      })
    })
  })

  describe('完整用户流程测试', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTranslations.zh
      })
    })

    it('应该支持完整的配置流程', async () => {
      render(
        <LanguageProvider defaultLanguage="zh">
          <DrawConfigPage />
        </LanguageProvider>
      )

      // 1. 页面加载
      await waitFor(() => {
        expect(screen.getByText('抽奖配置')).toBeInTheDocument()
      })

      // 2. 切换到详细配置
      const detailedConfigTab = screen.getByText('详细配置')
      fireEvent.click(detailedConfigTab)

      await waitFor(() => {
        expect(screen.getByText('选择抽奖模式')).toBeInTheDocument()
      })

      // 3. 选择抽奖模式
      const slotMachineMode = screen.getByText('老虎机式')
      fireEvent.click(slotMachineMode)

      // 4. 开始抽奖
      const startDrawButton = screen.getByText('开始抽奖')
      expect(startDrawButton).toBeInTheDocument()
      
      fireEvent.click(startDrawButton)

      // 应该尝试跳转到抽奖页面
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/draw/slot-machine')
      })
    })
  })
})