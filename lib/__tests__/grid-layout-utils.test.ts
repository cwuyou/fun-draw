import { describe, it, expect } from 'vitest'
import {
  determineOptimalGridSize,
  getGridColumns,
  getGridRows,
  fillGridCells,
  createGridCells,
  validateGridConfiguration,
  getValidDrawItems,
  findItemInGrid,
  createPlaceholderItem
} from '../grid-layout-utils'
import type { ListItem, GridCell } from '@/types'

// Test data
const createTestItems = (count: number): ListItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `项目 ${i + 1}`
  }))
}

describe('Grid Layout Utils', () => {
  describe('determineOptimalGridSize', () => {
    it('should return 6 for 1-6 items', () => {
      expect(determineOptimalGridSize(1)).toBe(6)
      expect(determineOptimalGridSize(3)).toBe(6)
      expect(determineOptimalGridSize(6)).toBe(6)
    })

    it('should return 9 for 7-9 items', () => {
      expect(determineOptimalGridSize(7)).toBe(9)
      expect(determineOptimalGridSize(8)).toBe(9)
      expect(determineOptimalGridSize(9)).toBe(9)
    })

    it('should return 12 for 10-12 items', () => {
      expect(determineOptimalGridSize(10)).toBe(12)
      expect(determineOptimalGridSize(11)).toBe(12)
      expect(determineOptimalGridSize(12)).toBe(12)
    })

    it('should return 15 for 13-15 items', () => {
      expect(determineOptimalGridSize(13)).toBe(15)
      expect(determineOptimalGridSize(14)).toBe(15)
      expect(determineOptimalGridSize(15)).toBe(15)
    })

    it('should return 15 for more than 15 items', () => {
      expect(determineOptimalGridSize(16)).toBe(15)
      expect(determineOptimalGridSize(20)).toBe(15)
      expect(determineOptimalGridSize(100)).toBe(15)
    })
  })

  describe('getGridColumns', () => {
    it('should return correct column count for each grid size', () => {
      expect(getGridColumns(6)).toBe(3)   // 2×3
      expect(getGridColumns(9)).toBe(3)   // 3×3
      expect(getGridColumns(12)).toBe(4)  // 3×4
      expect(getGridColumns(15)).toBe(5)  // 3×5
    })

    it('should return default 3 for unknown grid size', () => {
      expect(getGridColumns(8)).toBe(3)
      expect(getGridColumns(20)).toBe(3)
    })
  })

  describe('getGridRows', () => {
    it('should return correct row count for each grid size', () => {
      expect(getGridRows(6)).toBe(2)   // 2×3
      expect(getGridRows(9)).toBe(3)   // 3×3
      expect(getGridRows(12)).toBe(3)  // 3×4
      expect(getGridRows(15)).toBe(3)  // 3×5
    })

    it('should return default 3 for unknown grid size', () => {
      expect(getGridRows(8)).toBe(3)
      expect(getGridRows(20)).toBe(3)
    })
  })

  describe('createPlaceholderItem', () => {
    it('should create placeholder item with correct format', () => {
      const placeholder = createPlaceholderItem(0)
      expect(placeholder.id).toBe('placeholder-0')
      expect(placeholder.name).toBe('空位 1')
    })

    it('should create unique placeholders for different indices', () => {
      const placeholder1 = createPlaceholderItem(0)
      const placeholder2 = createPlaceholderItem(1)
      
      expect(placeholder1.id).toBe('placeholder-0')
      expect(placeholder2.id).toBe('placeholder-1')
      expect(placeholder1.name).toBe('空位 1')
      expect(placeholder2.name).toBe('空位 2')
    })
  })

  describe('fillGridCells', () => {
    it('should create placeholders when no items provided', () => {
      const result = fillGridCells([], 6, false)
      expect(result).toHaveLength(6)
      expect(result[0].id).toBe('placeholder-0')
      expect(result[0].name).toBe('空位 1')
    })

    it('should randomly select items when more items than grid size', () => {
      const items = createTestItems(10)
      const result = fillGridCells(items, 6, false)
      
      expect(result).toHaveLength(6)
      // All items should be from original list
      result.forEach(item => {
        expect(items.some(original => original.id === item.id)).toBe(true)
      })
    })

    it('should return same items when count equals grid size', () => {
      const items = createTestItems(6)
      const result = fillGridCells(items, 6, false)
      
      expect(result).toHaveLength(6)
      expect(result).toEqual(items)
    })

    it('should repeat items when allowRepeat is true and items < grid size', () => {
      const items = createTestItems(3)
      const result = fillGridCells(items, 6, true)
      
      expect(result).toHaveLength(6)
      // Should have repeated items
      expect(result[0]).toEqual(items[0])
      expect(result[3]).toEqual(items[0])
      expect(result[1]).toEqual(items[1])
      expect(result[4]).toEqual(items[1])
    })

    it('should add placeholders when allowRepeat is false and items < grid size', () => {
      const items = createTestItems(3)
      const result = fillGridCells(items, 6, false)
      
      expect(result).toHaveLength(6)
      // First 3 should be original items
      expect(result.slice(0, 3)).toEqual(items)
      // Last 3 should be placeholders
      expect(result[3].id).toBe('placeholder-3')
      expect(result[4].id).toBe('placeholder-4')
      expect(result[5].id).toBe('placeholder-5')
    })
  })

  describe('createGridCells', () => {
    it('should create grid cells with correct positions', () => {
      const items = createTestItems(6)
      const cells = createGridCells(items, 6)
      
      expect(cells).toHaveLength(6)
      
      // Check first cell
      expect(cells[0].id).toBe('cell-0')
      expect(cells[0].index).toBe(0)
      expect(cells[0].item).toEqual(items[0])
      expect(cells[0].position).toEqual({ row: 0, col: 0 })
      expect(cells[0].isHighlighted).toBe(false)
      expect(cells[0].isWinner).toBe(false)
      
      // Check position calculation for 3-column layout
      expect(cells[3].position).toEqual({ row: 1, col: 0 })
      expect(cells[4].position).toEqual({ row: 1, col: 1 })
      expect(cells[5].position).toEqual({ row: 1, col: 2 })
    })

    it('should handle different grid sizes correctly', () => {
      const items = createTestItems(9)
      const cells = createGridCells(items, 9)
      
      expect(cells).toHaveLength(9)
      // For 3x3 grid
      expect(cells[6].position).toEqual({ row: 2, col: 0 })
      expect(cells[8].position).toEqual({ row: 2, col: 2 })
    })
  })

  describe('validateGridConfiguration', () => {
    it('should return valid for normal configuration', () => {
      const items = createTestItems(5)
      const result = validateGridConfiguration(items, false)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.recommendedGridSize).toBe(6)
    })

    it('should return error for empty items', () => {
      const result = validateGridConfiguration([], false)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('多宫格抽奖需要至少1个参与项目')
    })

    it('should return warning for too many items', () => {
      const items = createTestItems(20)
      const result = validateGridConfiguration(items, false)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('项目数量超过15个（20个），将随机选择15个填充宫格')
      expect(result.recommendedGridSize).toBe(15)
    })

    it('should return warning for insufficient items without repeat', () => {
      const items = createTestItems(3)
      const result = validateGridConfiguration(items, false)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.includes('项目数量（3个）少于推荐宫格数量（6个）'))).toBe(true)
    })

    it('should not warn about insufficient items when repeat is allowed', () => {
      const items = createTestItems(3)
      const result = validateGridConfiguration(items, true)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.includes('少于推荐宫格数量'))).toBe(false)
    })
  })

  describe('getValidDrawItems', () => {
    it('should return only non-placeholder items', () => {
      const items = createTestItems(3)
      const filledItems = fillGridCells(items, 6, false)
      const cells = createGridCells(filledItems, 6)
      
      const validItems = getValidDrawItems(cells)
      
      expect(validItems).toHaveLength(3)
      expect(validItems).toEqual(items)
    })

    it('should return all items when no placeholders', () => {
      const items = createTestItems(6)
      const cells = createGridCells(items, 6)
      
      const validItems = getValidDrawItems(cells)
      
      expect(validItems).toHaveLength(6)
      expect(validItems).toEqual(items)
    })

    it('should return empty array when all placeholders', () => {
      const filledItems = fillGridCells([], 6, false)
      const cells = createGridCells(filledItems, 6)
      
      const validItems = getValidDrawItems(cells)
      
      expect(validItems).toHaveLength(0)
    })
  })

  describe('findItemInGrid', () => {
    let cells: GridCell[]
    let items: ListItem[]

    beforeEach(() => {
      items = createTestItems(3)
      const filledItems = fillGridCells(items, 6, true) // With repeats
      cells = createGridCells(filledItems, 6)
    })

    it('should find item by exact ID match', () => {
      const targetItem = items[1]
      const index = findItemInGrid(cells, targetItem)
      
      expect(index).toBeGreaterThanOrEqual(0)
      expect(cells[index].item.id).toBe(targetItem.id)
    })

    it('should find item by name when ID match fails', () => {
      const targetItem = { id: 'different-id', name: items[1].name }
      const index = findItemInGrid(cells, targetItem)
      
      expect(index).toBeGreaterThanOrEqual(0)
      expect(cells[index].item.name).toBe(targetItem.name)
    })

    it('should return -1 when item not found', () => {
      const targetItem = { id: 'not-found', name: '不存在的项目' }
      const index = findItemInGrid(cells, targetItem)
      
      expect(index).toBe(-1)
    })

    it('should not match placeholder items by name', () => {
      const placeholderItems = fillGridCells([], 6, false)
      const placeholderCells = createGridCells(placeholderItems, 6)
      
      const targetItem = { id: 'test', name: '空位 1' }
      const index = findItemInGrid(placeholderCells, targetItem)
      
      expect(index).toBe(-1)
    })
  })
})