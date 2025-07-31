import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadAndMigrateConfig, preprocessConfigForSave } from '@/lib/config-migration'
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

describe('Grid Lottery Migration Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should migrate legacy grid-lottery config with wrong quantity', () => {
    // Simulate legacy config with wrong quantity
    const legacyConfig: DrawingConfig = {
      mode: 'grid-lottery',
      quantity: 5, // This should be migrated to 1
      allowRepeat: false,
      items: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' },
        { id: '3', name: '王五' }
      ]
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(legacyConfig))

    // Load and migrate config
    const migratedConfig = loadAndMigrateConfig('draw-config')

    // Verify migration
    expect(migratedConfig).toBeDefined()
    expect(migratedConfig!.mode).toBe('grid-lottery')
    expect(migratedConfig!.quantity).toBe(1) // Should be fixed to 1
    expect(migratedConfig!.allowRepeat).toBe(false)
    expect(migratedConfig!.items).toHaveLength(3)

    // Verify that the corrected config was saved back to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'draw-config',
      expect.stringContaining('"quantity":1')
    )
  })

  it('should not modify valid grid-lottery config', () => {
    // Valid config that doesn't need migration
    const validConfig: DrawingConfig = {
      mode: 'grid-lottery',
      quantity: 1, // Already correct
      allowRepeat: true,
      items: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' }
      ]
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(validConfig))

    // Load config
    const loadedConfig = loadAndMigrateConfig('draw-config')

    // Verify no changes
    expect(loadedConfig).toEqual(validConfig)

    // Verify that config was not saved back (no changes)
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })

  it('should preprocess config before saving', () => {
    // Config that needs preprocessing
    const configToSave: DrawingConfig = {
      mode: 'grid-lottery',
      quantity: 3, // This should be fixed to 1
      allowRepeat: false,
      items: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' },
        { id: '3', name: '王五' },
        { id: '4', name: '赵六' }
      ]
    }

    // Preprocess config
    const processedConfig = preprocessConfigForSave(configToSave)

    // Verify preprocessing
    expect(processedConfig.mode).toBe('grid-lottery')
    expect(processedConfig.quantity).toBe(1) // Should be fixed to 1
    expect(processedConfig.allowRepeat).toBe(false)
    expect(processedConfig.items).toHaveLength(4)
  })

  it('should handle corrupted config gracefully', () => {
    // Simulate corrupted config
    localStorageMock.getItem.mockReturnValue('{"mode":"grid-lottery","quantity":')

    // Load config
    const loadedConfig = loadAndMigrateConfig('draw-config')

    // Should return null for corrupted config
    expect(loadedConfig).toBeNull()
  })

  it('should migrate config with missing fields', () => {
    // Config with missing fields
    const incompleteConfig = {
      mode: 'grid-lottery',
      quantity: 2,
      // missing allowRepeat
      items: [
        { id: '1', name: '张三' }
      ]
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(incompleteConfig))

    // Load and migrate config
    const migratedConfig = loadAndMigrateConfig('draw-config')

    // Verify migration
    expect(migratedConfig).toBeDefined()
    expect(migratedConfig!.mode).toBe('grid-lottery')
    expect(migratedConfig!.quantity).toBe(1) // Fixed to 1
    expect(migratedConfig!.allowRepeat).toBe(false) // Default value
    expect(migratedConfig!.items).toHaveLength(1)

    // Verify that the corrected config was saved
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should not affect non-grid-lottery configs', () => {
    // Non-grid-lottery config
    const slotMachineConfig: DrawingConfig = {
      mode: 'slot-machine',
      quantity: 5, // This should NOT be changed
      allowRepeat: false,
      items: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' },
        { id: '3', name: '王五' },
        { id: '4', name: '赵六' },
        { id: '5', name: '钱七' }
      ]
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(slotMachineConfig))

    // Load config
    const loadedConfig = loadAndMigrateConfig('draw-config')

    // Verify no changes to non-grid-lottery config
    expect(loadedConfig).toEqual(slotMachineConfig)
    expect(loadedConfig!.quantity).toBe(5) // Should remain unchanged

    // Should not save back since no changes
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })
})