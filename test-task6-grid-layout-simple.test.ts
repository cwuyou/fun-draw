import { describe, it, expect } from 'vitest'
import {
  determineOptimalGridSize,
  fillGridCells,
  validateGridConfiguration,
  getValidDrawItems,
  findItemInGrid
} from '@/lib/grid-layout-utils'
import type { ListItem } from '@/types'

describe('Task 6: Grid Layout and Repeat Logic', () => {
  const createTestItems = (count: number): ListItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      name: `项目 ${i + 1}`
    }))
  }

  describe('Grid Size Determination (Requirements 3.1-3.5)', () => {
    it('should use correct grid sizes based on item count', () => {
      // Requirement 3.1: 1-6 items → 6 grids (2×3)
      expect(determineOptimalGridSize(1)).toBe(6)
      expect(determineOptimalGridSize(6)).toBe(6)
      
      // Requirement 3.2: 7-9 items → 9 grids (3×3)
      expect(determineOptimalGridSize(7)).toBe(9)
      expect(determineOptimalGridSize(9)).toBe(9)
      
      // Requirement 3.3: 10-12 items → 12 grids (3×4)
      expect(determineOptimalGridSize(10)).toBe(12)
      expect(determineOptimalGridSize(12)).toBe(12)
      
      // Requirement 3.4: 13-15 items → 15 grids (3×5)
      expect(determineOptimalGridSize(13)).toBe(15)
      expect(determineOptimalGridSize(15)).toBe(15)
      
      // Requirement 3.5: >15 items → 15 grids (3×5)
      expect(determineOptimalGridSize(20)).toBe(15)
      expect(determineOptimalGridSize(100)).toBe(15)
    })
  })

  describe('Repeat Logic (Requirements 5.1-5.4)', () => {
    it('should repeat items when allowRepeat is true and items < grid size (Requirement 5.1)', () => {
      const items = createTestItems(3)
      const gridSize = 6
      const result = fillGridCells(items, gridSize, true)
      
      expect(result).toHaveLength(6)
      
      // Should have repeated items
      const itemCounts = result.reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      expect(itemCounts['项目 1']).toBe(2)
      expect(itemCounts['项目 2']).toBe(2)
      expect(itemCounts['项目 3']).toBe(2)
    })

    it('should use placeholders when allowRepeat is false and items < grid size (Requirement 5.2)', () => {
      const items = createTestItems(3)
      const gridSize = 6
      const result = fillGridCells(items, gridSize, false)
      
      expect(result).toHaveLength(6)
      
      // First 3 should be original items
      expect(result[0].name).toBe('项目 1')
      expect(result[1].name).toBe('项目 2')
      expect(result[2].name).toBe('项目 3')
      
      // Last 3 should be placeholders
      expect(result[3].id).toBe('placeholder-3')
      expect(result[4].id).toBe('placeholder-4')
      expect(result[5].id).toBe('placeholder-5')
    })

    it('should ensure valid items for drawing when repeat is enabled (Requirement 5.3)', () => {
      const items = createTestItems(2)
      const gridSize = 6
      const filledItems = fillGridCells(items, gridSize, true)
      
      // All cells should have valid items (no placeholders)
      const hasPlaceholders = filledItems.some(item => item.id.startsWith('placeholder-'))
      expect(hasPlaceholders).toBe(false)
      
      // All items should be from the original set
      filledItems.forEach(item => {
        expect(['项目 1', '项目 2']).toContain(item.name)
      })
    })

    it('should return original items when drawing from repeated grid (Requirement 5.4)', () => {
      const items = createTestItems(3)
      const gridSize = 9
      const filledItems = fillGridCells(items, gridSize, true)
      
      // Create mock grid cells
      const cells = filledItems.map((item, index) => ({
        id: `cell-${index}`,
        index,
        item,
        isHighlighted: false,
        isWinner: false,
        position: { row: Math.floor(index / 3), col: index % 3 }
      }))
      
      const validItems = getValidDrawItems(cells)
      
      // Should return only the original unique items
      expect(validItems).toHaveLength(3)
      expect(validItems.map(item => item.name)).toEqual(['项目 1', '项目 2', '项目 3'])
    })
  })

  describe('Grid Filling Edge Cases', () => {
    it('should handle empty item list', () => {
      const result = fillGridCells([], 6, false)
      expect(result).toHaveLength(6)
      expect(result.every(item => item.id.startsWith('placeholder-'))).toBe(true)
    })

    it('should handle items equal to grid size', () => {
      const items = createTestItems(6)
      const result = fillGridCells(items, 6, false)
      
      expect(result).toHaveLength(6)
      expect(result).toEqual(items)
    })

    it('should randomly select items when items > grid size', () => {
      const items = createTestItems(20)
      const result = fillGridCells(items, 15, false)
      
      expect(result).toHaveLength(15)
      
      // All selected items should be from original list
      result.forEach(item => {
        expect(items.some(original => original.id === item.id)).toBe(true)
      })
      
      // Should not have placeholders
      expect(result.some(item => item.id.startsWith('placeholder-'))).toBe(false)
    })
  })

  describe('Validation Logic', () => {
    it('should validate configuration correctly', () => {
      // Valid configuration
      const validResult = validateGridConfiguration(createTestItems(5), false)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)
      
      // Invalid configuration (empty items)
      const invalidResult = validateGridConfiguration([], false)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors).toContain('多宫格抽奖需要至少1个参与项目')
      
      // Warning for too many items
      const warningResult = validateGridConfiguration(createTestItems(20), false)
      expect(warningResult.isValid).toBe(true)
      expect(warningResult.warnings.some(w => w.includes('将随机选择15个填充宫格'))).toBe(true)
    })
  })

  describe('Item Finding Logic', () => {
    it('should find items correctly in grid with repeats', () => {
      const items = createTestItems(3)
      const filledItems = fillGridCells(items, 6, true)
      const cells = filledItems.map((item, index) => ({
        id: `cell-${index}`,
        index,
        item,
        isHighlighted: false,
        isWinner: false,
        position: { row: Math.floor(index / 3), col: index % 3 }
      }))
      
      // Should find first occurrence of item
      const targetItem = items[1]
      const foundIndex = findItemInGrid(cells, targetItem)
      
      expect(foundIndex).toBeGreaterThanOrEqual(0)
      expect(cells[foundIndex].item.name).toBe(targetItem.name)
    })

    it('should not find placeholder items', () => {
      const items = createTestItems(3)
      const filledItems = fillGridCells(items, 6, false)
      const cells = filledItems.map((item, index) => ({
        id: `cell-${index}`,
        index,
        item,
        isHighlighted: false,
        isWinner: false,
        position: { row: Math.floor(index / 3), col: index % 3 }
      }))
      
      // Try to find a placeholder by name
      const placeholderItem = { id: 'test', name: '空位 1' }
      const foundIndex = findItemInGrid(cells, placeholderItem)
      
      expect(foundIndex).toBe(-1)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete workflow for small item count with repeat', () => {
      const items = createTestItems(4)
      const gridSize = determineOptimalGridSize(items.length)
      
      expect(gridSize).toBe(6) // Should use 2×3 layout
      
      const filledItems = fillGridCells(items, gridSize, true)
      expect(filledItems).toHaveLength(6)
      
      // Should have repeated items
      const uniqueNames = new Set(filledItems.map(item => item.name))
      expect(uniqueNames.size).toBe(4) // Original 4 items
      
      // Validate configuration
      const validation = validateGridConfiguration(items, true)
      expect(validation.isValid).toBe(true)
    })

    it('should handle complete workflow for large item count', () => {
      const items = createTestItems(18)
      const gridSize = determineOptimalGridSize(items.length)
      
      expect(gridSize).toBe(15) // Should use 3×5 layout
      
      const filledItems = fillGridCells(items, gridSize, false)
      expect(filledItems).toHaveLength(15)
      
      // Should have randomly selected 15 items
      const uniqueIds = new Set(filledItems.map(item => item.id))
      expect(uniqueIds.size).toBe(15)
      
      // Should not have placeholders
      expect(filledItems.some(item => item.id.startsWith('placeholder-'))).toBe(false)
      
      // Validate configuration
      const validation = validateGridConfiguration(items, false)
      expect(validation.isValid).toBe(true)
      expect(validation.warnings.some(w => w.includes('将随机选择15个填充宫格'))).toBe(true)
    })

    it('should handle complete workflow for insufficient items without repeat', () => {
      const items = createTestItems(4)
      const gridSize = determineOptimalGridSize(items.length)
      
      expect(gridSize).toBe(6) // Should use 2×3 layout
      
      const filledItems = fillGridCells(items, gridSize, false)
      expect(filledItems).toHaveLength(6)
      
      // Should have 4 original items + 2 placeholders
      const originalItems = filledItems.filter(item => !item.id.startsWith('placeholder-'))
      const placeholders = filledItems.filter(item => item.id.startsWith('placeholder-'))
      
      expect(originalItems).toHaveLength(4)
      expect(placeholders).toHaveLength(2)
      
      // Validate configuration
      const validation = validateGridConfiguration(items, false)
      expect(validation.isValid).toBe(true)
      expect(validation.warnings.some(w => w.includes('少于推荐宫格数量'))).toBe(true)
    })
  })
})