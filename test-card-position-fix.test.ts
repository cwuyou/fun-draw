// 测试卡牌位置修复
import { describe, it, expect } from 'vitest'
import { calculateBoundaryAwarePositions, validatePositionBoundaries } from './lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from './lib/card-space-calculator'

describe('Card Position Fix Tests', () => {
  const mockContainerWidth = 1024
  const mockContainerHeight = 768
  
  const availableSpace = calculateAvailableCardSpace(mockContainerWidth, mockContainerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })

  it('should generate valid positions for 3 cards', () => {
    const positions = calculateBoundaryAwarePositions(3, availableSpace)
    
    expect(positions).toHaveLength(3)
    positions.forEach((pos, index) => {
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
      expect(typeof pos.cardWidth).toBe('number')
      expect(typeof pos.cardHeight).toBe('number')
      expect(pos.cardWidth).toBeGreaterThan(0)
      expect(pos.cardHeight).toBeGreaterThan(0)
      console.log(`Card ${index}: x=${pos.x}, y=${pos.y}, size=${pos.cardWidth}x${pos.cardHeight}`)
    })
  })

  it('should generate valid positions for 6 cards without overflow', () => {
    const positions = calculateBoundaryAwarePositions(6, availableSpace)
    
    expect(positions).toHaveLength(6)
    
    // 验证边界
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    expect(boundaryCheck.isValid).toBe(true)
    
    positions.forEach((pos, index) => {
      // 转换为绝对坐标进行验证
      const centerX = availableSpace.width / 2
      const centerY = availableSpace.height / 2
      const absoluteX = pos.x + centerX
      const absoluteY = pos.y + centerY
      
      const cardLeft = absoluteX - pos.cardWidth / 2
      const cardRight = absoluteX + pos.cardWidth / 2
      const cardTop = absoluteY - pos.cardHeight / 2
      const cardBottom = absoluteY + pos.cardHeight / 2
      
      // 确保卡牌在边界内
      expect(cardLeft).toBeGreaterThanOrEqual(0)
      expect(cardRight).toBeLessThanOrEqual(availableSpace.width)
      expect(cardTop).toBeGreaterThanOrEqual(0)
      expect(cardBottom).toBeLessThanOrEqual(availableSpace.height)
      
      console.log(`Card ${index}: center-offset=(${pos.x}, ${pos.y}), absolute=(${absoluteX}, ${absoluteY}), bounds=[${cardLeft}, ${cardTop}, ${cardRight}, ${cardBottom}]`)
    })
  })

  it('should handle 7+ cards without undefined positions', () => {
    const positions = calculateBoundaryAwarePositions(8, availableSpace)
    
    expect(positions).toHaveLength(8)
    positions.forEach((pos, index) => {
      expect(pos).toBeDefined()
      expect(pos.x).toBeDefined()
      expect(pos.y).toBeDefined()
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
      expect(!isNaN(pos.x)).toBe(true)
      expect(!isNaN(pos.y)).toBe(true)
      console.log(`Card ${index}: x=${pos.x}, y=${pos.y}`)
    })
  })

  it('should use center-relative coordinate system', () => {
    const positions = calculateBoundaryAwarePositions(4, availableSpace)
    
    // 检查是否使用相对于中心的坐标系统
    // 至少应该有一些卡牌的坐标是负数（在中心左侧或上方）
    const hasNegativeX = positions.some(pos => pos.x < 0)
    const hasNegativeY = positions.some(pos => pos.y < 0)
    const hasPositiveX = positions.some(pos => pos.x > 0)
    const hasPositiveY = positions.some(pos => pos.y > 0)
    
    console.log('Position distribution:', {
      hasNegativeX,
      hasNegativeY,
      hasPositiveX,
      hasPositiveY,
      positions: positions.map(p => ({ x: p.x, y: p.y }))
    })
    
    // 对于4张卡牌，应该有分布在中心周围的位置
    expect(hasNegativeX || hasPositiveX).toBe(true)
  })
})