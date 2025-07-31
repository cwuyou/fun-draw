import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  migrateGridLotteryConfig, 
  migrateDrawingConfig, 
  loadAndMigrateConfig,
  preprocessConfigForSave,
  needsMigration,
  getMigrationLog
} from '../config-migration'
import type { DrawingConfig } from '@/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

Object.defineProperty(console, 'log', { value: consoleMock.log })
Object.defineProperty(console, 'warn', { value: consoleMock.warn })
Object.defineProperty(console, 'error', { value: consoleMock.error })

describe('Config Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('migrateGridLotteryConfig', () => {
    it('should fix quantity to 1 for grid-lottery mode', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 5,
        allowRepeat: false,
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' }
        ]
      }

      const result = migrateGridLotteryConfig(config)

      expect(result.quantity).toBe(1)
      expect(consoleMock.log).toHaveBeenCalledWith('[配置迁移] 多宫格抽奖模式数量从 5 修正为 1')
    })

    it('should not modify config if quantity is already 1', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: [
          { id: '1', name: 'Item 1' }
        ]
      }

      const result = migrateGridLotteryConfig(config)

      expect(result).toEqual(config)
      expect(consoleMock.log).not.toHaveBeenCalled()
    })

    it('should not modify non-grid-lottery configs', () => {
      const config: DrawingConfig = {
        mode: 'slot-machine',
        quantity: 5,
        allowRepeat: false,
        items: [
          { id: '1', name: 'Item 1' }
        ]
      }

      const result = migrateGridLotteryConfig(config)

      expect(result).toEqual(config)
    })
  })

  describe('migrateDrawingConfig', () => {
    it('should fix missing mode', () => {
      const config = {
        quantity: 1,
        allowRepeat: false,
        items: []
      } as DrawingConfig

      const result = migrateDrawingConfig(config)

      expect(result.mode).toBe('slot-machine')
      expect(consoleMock.warn).toHaveBeenCalledWith('[配置迁移] 缺少模式信息，设置为默认模式')
    })

    it('should fix invalid items array', () => {
      const config = {
        mode: 'slot-machine',
        quantity: 1,
        allowRepeat: false,
        items: null
      } as any

      const result = migrateDrawingConfig(config)

      expect(result.items).toEqual([])
      expect(consoleMock.warn).toHaveBeenCalledWith('[配置迁移] 项目列表无效，设置为空数组')
    })

    it('should fix invalid quantity', () => {
      const config = {
        mode: 'slot-machine',
        quantity: -1,
        allowRepeat: false,
        items: []
      } as DrawingConfig

      const result = migrateDrawingConfig(config)

      expect(result.quantity).toBe(1)
      expect(consoleMock.warn).toHaveBeenCalledWith('[配置迁移] 数量设置无效，设置为默认值1')
    })

    it('should fix invalid allowRepeat', () => {
      const config = {
        mode: 'slot-machine',
        quantity: 1,
        allowRepeat: null,
        items: []
      } as any

      const result = migrateDrawingConfig(config)

      expect(result.allowRepeat).toBe(false)
      expect(consoleMock.warn).toHaveBeenCalledWith('[配置迁移] 重复设置无效，设置为默认值false')
    })

    it('should apply grid-lottery specific migration', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 3,
        allowRepeat: false,
        items: [
          { id: '1', name: 'Item 1' }
        ]
      }

      const result = migrateDrawingConfig(config)

      expect(result.quantity).toBe(1)
    })

    it('should correct quantity that exceeds maximum', () => {
      const config: DrawingConfig = {
        mode: 'slot-machine',
        quantity: 10,
        allowRepeat: false,
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' }
        ]
      }

      const result = migrateDrawingConfig(config)

      expect(result.quantity).toBe(2) // Max without repeat is items.length
      expect(consoleMock.log).toHaveBeenCalledWith('[配置迁移] 数量超出限制，修正：10 -> 2')
    })
  })

  describe('loadAndMigrateConfig', () => {
    it('should return null if no config exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = loadAndMigrateConfig('test-key')

      expect(result).toBeNull()
    })

    it('should return null if config is invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = loadAndMigrateConfig('test-key')

      expect(result).toBeNull()
      expect(consoleMock.error).toHaveBeenCalledWith('[配置迁移] 加载配置失败:', expect.any(Error))
    })

    it('should load and migrate config successfully', () => {
      const originalConfig = {
        mode: 'grid-lottery',
        quantity: 5,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(originalConfig))

      const result = loadAndMigrateConfig('test-key')

      expect(result).toBeDefined()
      expect(result!.quantity).toBe(1)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', expect.stringContaining('"quantity":1'))
      expect(consoleMock.log).toHaveBeenCalledWith('[配置迁移] 配置已更新，保存到localStorage')
    })

    it('should not save if config unchanged', () => {
      const config = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(config))

      const result = loadAndMigrateConfig('test-key')

      expect(result).toEqual(config)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('preprocessConfigForSave', () => {
    it('should preprocess config before saving', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 3,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      const result = preprocessConfigForSave(config)

      expect(result.quantity).toBe(1)
    })
  })

  describe('needsMigration', () => {
    it('should return true for grid-lottery with wrong quantity', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 5,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      expect(needsMigration(config)).toBe(true)
    })

    it('should return false for valid grid-lottery config', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      expect(needsMigration(config)).toBe(false)
    })

    it('should return true for missing mode', () => {
      const config = {
        quantity: 1,
        allowRepeat: false,
        items: []
      } as DrawingConfig

      expect(needsMigration(config)).toBe(true)
    })

    it('should return true for invalid items', () => {
      const config = {
        mode: 'slot-machine',
        quantity: 1,
        allowRepeat: false,
        items: null
      } as any

      expect(needsMigration(config)).toBe(true)
    })

    it('should return true for quantity exceeding limits', () => {
      const config: DrawingConfig = {
        mode: 'slot-machine',
        quantity: 10,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      expect(needsMigration(config)).toBe(true)
    })
  })

  describe('getMigrationLog', () => {
    it('should generate migration log for changed config', () => {
      const original: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 5,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      const migrated: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      const log = getMigrationLog(original, migrated)

      expect(log).toContain('数量: 5 -> 1')
    })

    it('should return empty log for unchanged config', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: [{ id: '1', name: 'Item 1' }]
      }

      const log = getMigrationLog(config, config)

      expect(log).toEqual([])
    })
  })
})