import { describe, it, expect, beforeEach } from 'vitest'
import { 
  calculateBoundaryAwarePositions,
  validatePositionBoundaries,
  determineOptimalLayout,
  calculateOptimalCardSize
} from '@/lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from '@/lib/card-space-calculator'

describe('Task 16: Multi-Row Overflow Scenarios', () => {
  let mockAvailableSpace: ReturnType<typeof calculateAvailableCardSpace>
  
  beforeEach(() => {
    // 模拟标准可用空间
    mockAvailableSpace = {
      width: 800,
      height: 600,
      containerWidth: 1024,
      containerHeight: 768,
      maxCardWidth: 120,
      maxCardHeight: 180,
      uiElements: {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: true,
        hasResultDisplay: false
      }
    }
  })

  describe('4-card layout multi-row positioning', () => {
    it('should ensure second row does not overflow container bottom', () => {
      const positions = calculateBoundaryAwarePositions(4, mockAvailableSpace)
      
      expect(positions).toHaveLength(4)
      
      // 验证所有卡牌位置都在容器边界内
      positions.forEach((pos, index) => {
        const centerX = mockAvailableSpace.width / 2
        const centerY = mockAvailableSpace.height / 2
        
        const absoluteX = pos.x + centerX
        const absoluteY = pos.y + centerY
        
        const cardBottom = absoluteY + pos.cardHeight / 2
        
        expect(cardBottom).toBeLessThanOrEqual(mockAvailableSpace.height)
        expect(cardBottom).toBeGreaterThan(0)
      })
    })

    it('should position second row within visible container area', () => {
      const positions = calculateBoundaryAwarePositions(4, mockAvailableSpace)
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      
      expect(boundaryCheck.isValid).toBe(true)
      expect(boundaryCheck.violations).toHaveLength(0)
    })

    it('should calculate proper row height for 4-card layout', () => {
      const layoutConfig = determineOptimalLayout(4, mockAvailableSpace)
      const cardSize = calculateOptimalCardSize(layoutConfig, mockAvailableSpace)
      
      // 计算总网格高度
      const totalGridHeight = layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * 8 // 8px spacing
      
      expect(totalGridHeight).toBeLessThanOrEqual(mockAvailableSpace.height)
    })

    it('should handle limited height containers for 4 cards', () => {
      const limitedSpace = {
        ...mockAvailableSpace,
        height: 300 // 限制高度
      }
      
      const positions = calculateBoundaryAwarePositions(4, limitedSpace)
      const boundaryCheck = validatePositionBoundaries(positions, limitedSpace)
      
      expect(boundaryCheck.isValid).toBe(true)
      
      // 验证所有卡牌都在限制的高度内
      positions.forEach(pos => {
        const centerY = limitedSpace.height / 2
        const absoluteY = pos.y + centerY
        const cardBottom = absoluteY + pos.cardHeight / 2
        
        expect(cardBottom).toBeLessThanOrEqual(limitedSpace.height)
      })
    })
  })

  describe('5-card layout multi-row positioning', () => {
    it('should position second row within container boundaries', () => {
      const positions = calculateBoundaryAwarePositions(5, mockAvailableSpace)
      
      expect(positions).toHaveLength(5)
      
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should handle 5-card layout with proper second row positioning', () => {
      const positions = calculateBoundaryAwarePositions(5, mockAvailableSpace)
      
      // 验证没有卡牌溢出底部
      positions.forEach(pos => {
        const centerY = mockAvailableSpace.height / 2
        const absoluteY = pos.y + centerY
        const cardBottom = absoluteY + pos.cardHeight / 2
        
        expect(cardBottom).toBeLessThanOrEqual(mockAvailableSpace.height)
        expect(cardBottom).toBeGreaterThan(0)
      })
    })

    it('should distribute 5 cards across multiple rows efficiently', () => {
      const layoutConfig = determineOptimalLayout(5, mockAvailableSpace)
      
      // 5张卡牌应该分布在多行中
      expect(layoutConfig.rows).toBeGreaterThan(1)
      expect(layoutConfig.totalCards).toBe(5)
      
      // 验证布局配置合理
      const totalCards = layoutConfig.rows * layoutConfig.cardsPerRow
      expect(totalCards).toBeGreaterThanOrEqual(5)
    })

    it('should handle narrow containers for 5-card layout', () => {
      const narrowSpace = {
        ...mockAvailableSpace,
        width: 400 // 限制宽度
      }
      
      const positions = calculateBoundaryAwarePositions(5, narrowSpace)
      const boundaryCheck = validatePositionBoundaries(positions, narrowSpace)
      
      expect(boundaryCheck.isValid).toBe(true)
      
      // 验证所有卡牌都在限制的宽度内
      positions.forEach(pos => {
        const centerX = narrowSpace.width / 2
        const absoluteX = pos.x + centerX
        const cardRight = absoluteX + pos.cardWidth / 2
        
        expect(cardRight).toBeLessThanOrEqual(narrowSpace.width)
      })
    })
  })

  describe('6-card layout multi-row positioning', () => {
    it('should handle 6-card 2x3 layout without overflow', () => {
      const positions = calculateBoundaryAwarePositions(6, mockAvailableSpace)
      
      expect(positions).toHaveLength(6)
      
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should handle 6-card 3x2 layout for tall containers', () => {
      const tallSpace = {
        ...mockAvailableSpace,
        width: 400,
        height: 800 // 高容器
      }
      
      const positions = calculateBoundaryAwarePositions(6, tallSpace)
      const boundaryCheck = validatePositionBoundaries(positions, tallSpace)
      
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should optimize 6-card layout based on container aspect ratio', () => {
      // 宽容器应该倾向于2x3布局
      const wideSpace = {
        ...mockAvailableSpace,
        width: 1000,
        height: 400
      }
      
      const widePositions = calculateBoundaryAwarePositions(6, wideSpace)
      const wideBoundaryCheck = validatePositionBoundaries(widePositions, wideSpace)
      
      expect(wideBoundaryCheck.isValid).toBe(true)
      
      // 高容器应该倾向于3x2布局
      const tallSpace = {
        ...mockAvailableSpace,
        width: 400,
        height: 1000
      }
      
      const tallPositions = calculateBoundaryAwarePositions(6, tallSpace)
      const tallBoundaryCheck = validatePositionBoundaries(tallPositions, tallSpace)
      
      expect(tallBoundaryCheck.isValid).toBe(true)
    })
  })

  describe('7+ cards multi-row positioning', () => {
    it('should handle 7-card layout without overflow', () => {
      const positions = calculateBoundaryAwarePositions(7, mockAvailableSpace)
      
      expect(positions).toHaveLength(7)
      
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should handle 8-card layout with proper multi-row distribution', () => {
      const positions = calculateBoundaryAwarePositions(8, mockAvailableSpace)
      
      expect(positions).toHaveLength(8)
      
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      expect(boundaryCheck.isValid).toBe(true)
      
      // 验证所有卡牌都在边界内
      positions.forEach(pos => {
        const centerX = mockAvailableSpace.width / 2
        const centerY = mockAvailableSpace.height / 2
        
        const absoluteX = pos.x + centerX
        const absoluteY = pos.y + centerY
        
        const cardLeft = absoluteX - pos.cardWidth / 2
        const cardRight = absoluteX + pos.cardWidth / 2
        const cardTop = absoluteY - pos.cardHeight / 2
        const cardBottom = absoluteY + pos.cardHeight / 2
        
        expect(cardLeft).toBeGreaterThanOrEqual(0)
        expect(cardRight).toBeLessThanOrEqual(mockAvailableSpace.width)
        expect(cardTop).toBeGreaterThanOrEqual(0)
        expect(cardBottom).toBeLessThanOrEqual(mockAvailableSpace.height)
      })
    })

    it('should handle 9-card layout with multiple rows', () => {
      const positions = calculateBoundaryAwarePositions(9, mockAvailableSpace)
      
      expect(positions).toHaveLength(9)
      
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should handle 10-card layout without overflow', () => {
      const positions = calculateBoundaryAwarePositions(10, mockAvailableSpace)
      
      expect(positions).toHaveLength(10)
      
      const boundaryCheck = validatePositionBoundaries(positions, mockAvailableSpace)
      expect(boundaryCheck.isValid).toBe(true)
    })
  })

  describe('Multi-row height calculation validation', () => {
    it('should calculate total grid height correctly for various card counts', () => {
      const cardCounts = [4, 5, 6, 7, 8, 9, 10]
      
      cardCounts.forEach(cardCount => {
        const layoutConfig = determineOptimalLayout(cardCount, mockAvailableSpace)
        const cardSize = calculateOptimalCardSize(layoutConfig, mockAvailableSpace)
        
        const minSpacing = 8
        const totalGridHeight = layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * minSpacing
        
        expect(totalGridHeight).toBeLessThanOrEqual(mockAvailableSpace.height)
        expect(layoutConfig.rows).toBeGreaterThan(0)
        expect(layoutConfig.cardsPerRow).toBeGreaterThan(0)
      })
    })

    it('should adjust layout when container height is insufficient', () => {
      const shortSpace = {
        ...mockAvailableSpace,
        height: 200 // 很短的容器
      }
      
      const cardCounts = [4, 5, 6, 7, 8]
      
      cardCounts.forEach(cardCount => {
        const positions = calculateBoundaryAwarePositions(cardCount, shortSpace)
        const boundaryCheck = validatePositionBoundaries(positions, shortSpace)
        
        expect(boundaryCheck.isValid).toBe(true)
        expect(positions).toHaveLength(cardCount)
      })
    })

    it('should maintain minimum card spacing in multi-row layouts', () => {
      const positions4 = calculateBoundaryAwarePositions(4, mockAvailableSpace)
      const positions6 = calculateBoundaryAwarePositions(6, mockAvailableSpace)
      
      // 验证卡牌之间有合理的间距
      const allPositions = [positions4, positions6]
      allPositions.forEach(positions => {
        for (let i = 0; i < positions.length - 1; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            const pos1 = positions[i]
            const pos2 = positions[j]
            
            const distance = Math.sqrt(
              Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
            )
            
            // 最小间距应该大于0（卡牌不重叠）
            expect(distance).toBeGreaterThan(0)
          }
        }
      })
    })
  })

  describe('Edge cases and stress testing', () => {
    it('should handle extremely small containers', () => {
      const tinySpace = {
        ...mockAvailableSpace,
        width: 200,
        height: 150
      }
      
      const cardCounts = [4, 5, 6]
      
      cardCounts.forEach(cardCount => {
        const positions = calculateBoundaryAwarePositions(cardCount, tinySpace)
        const boundaryCheck = validatePositionBoundaries(positions, tinySpace)
        
        expect(positions).toHaveLength(cardCount)
        expect(boundaryCheck.isValid).toBe(true)
      })
    })

    it('should handle extremely wide containers', () => {
      const wideSpace = {
        ...mockAvailableSpace,
        width: 2000,
        height: 300
      }
      
      const positions = calculateBoundaryAwarePositions(6, wideSpace)
      const boundaryCheck = validatePositionBoundaries(positions, wideSpace)
      
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should handle extremely tall containers', () => {
      const tallSpace = {
        ...mockAvailableSpace,
        width: 300,
        height: 2000
      }
      
      const positions = calculateBoundaryAwarePositions(6, tallSpace)
      const boundaryCheck = validatePositionBoundaries(positions, tallSpace)
      
      expect(boundaryCheck.isValid).toBe(true)
    })

    it('should maintain performance with multiple rapid calculations', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 50; i++) {
        calculateBoundaryAwarePositions(6, mockAvailableSpace)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 50次计算应该在合理时间内完成
      expect(duration).toBeLessThan(500) // 500ms
    })
  })
})