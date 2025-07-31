import { describe, it, expect, beforeEach, vi } from 'vitest'
import { migrateGridLotteryConfig, loadAndMigrateConfig } from '@/lib/config-migration'
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

describe('Task 7: Grid Lottery Migration Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should migrate grid lottery config with incorrect quantity to 1', () => {
    // Test the core requirement: migrateGridLotteryConfig function
    const configWithWrongQuantity: DrawingConfig = {
      mode: 'grid-lottery',
      quantity: 5, // Should be migrated to 1
      allowRepeat: false,
      items: [
        { id: '1', name: '参与者1' },
        { id: '2', name: '参与者2' },
        { id: '3', name: '参与者3' }
      ]
    }

    const migratedConfig = migrateGridLotteryConfig(configWithWrongQuantity)

    expect(migratedConfig.mode).toBe('grid-lottery')
    expect(migratedConfig.quantity).toBe(1) // Should be fixed to 1
    expect(migratedConfig.allowRepeat).toBe(false)
    expect(migratedConfig.items).toHaveLength(3)
  })

  it('should load and migrate config from localStorage', () => {
    // Test the requirement: check and correct quantity values during config loading
    const legacyConfig = {
      mode: 'grid-lottery',
      quantity: 3, // Wrong quantity
      allowRepeat: true,
      items: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' }
      ]
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(legacyConfig))

    const loadedConfig = loadAndMigrateConfig('draw-config')

    expect(loadedConfig).toBeDefined()
    expect(loadedConfig!.quantity).toBe(1) // Should be corrected
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'draw-config',
      expect.stringContaining('"quantity":1')
    )
  })

  it('should maintain backward compatibility for other drawing modes', () => {
    // Test the requirement: ensure backward compatibility, not affecting other modes
    const slotMachineConfig: DrawingConfig = {
      mode: 'slot-machine',
      quantity: 5, // Should remain unchanged
      allowRepeat: false,
      items: [
        { id: '1', name: '项目1' },
        { id: '2', name: '项目2' },
        { id: '3', name: '项目3' },
        { id: '4', name: '项目4' },
        { id: '5', name: '项目5' }
      ]
    }

    // Grid lottery migration should not affect other modes
    const result = migrateGridLotteryConfig(slotMachineConfig)
    expect(result).toEqual(slotMachineConfig) // Should be unchanged
    expect(result.quantity).toBe(5) // Quantity should remain 5
  })

  it('should handle edge cases gracefully', () => {
    // Test edge case: grid lottery with quantity already set to 1
    const validConfig: DrawingConfig = {
      mode: 'grid-lottery',
      quantity: 1, // Already correct
      allowRepeat: false,
      items: [{ id: '1', name: '参与者' }]
    }

    const result = migrateGridLotteryConfig(validConfig)
    expect(result).toEqual(validConfig) // Should remain unchanged
  })

  it('should verify Requirements 4.1 and 4.2 compliance', () => {
    // Requirement 4.1: Grid lottery mode enforces single winner selection
    const multiWinnerConfig: DrawingConfig = {
      mode: 'grid-lottery',
      quantity: 10, // Multiple winners - should be corrected
      allowRepeat: false,
      items: [
        { id: '1', name: '参与者1' },
        { id: '2', name: '参与者2' }
      ]
    }

    const correctedConfig = migrateGridLotteryConfig(multiWinnerConfig)
    expect(correctedConfig.quantity).toBe(1) // Enforces single winner

    // Requirement 4.2: Backward compatibility maintained
    const cardFlipConfig: DrawingConfig = {
      mode: 'card-flip',
      quantity: 3,
      allowRepeat: true,
      items: [
        { id: '1', name: '卡片1' },
        { id: '2', name: '卡片2' },
        { id: '3', name: '卡片3' }
      ]
    }

    const unchangedConfig = migrateGridLotteryConfig(cardFlipConfig)
    expect(unchangedConfig).toEqual(cardFlipConfig) // No changes to other modes
  })
})