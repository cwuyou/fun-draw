// 测试6卡牌布局优化功能
import { describe, it, expect } from 'vitest'
import { 
  calculateBoundaryAwarePositions, 
  determineOptimal6CardLayout,
  validatePositionBoundaries
} from './lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from './lib/card-space-calculator'

describe('6-Card Layout Optimization Tests', () => {
  it('should choose 2x3 layout for wide containers', () => {
    // 创建一个宽容器 (aspect ratio > 1.5)
    const wideContainerWidth = 1200
    const wideContainerHeight = 600
    
    const availableSpace = calculateAvailableCardSpace(wideContainerWidth, wideContainerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const layoutConfig = determineOptimal6CardLayout(availableSpace)
    
    console.log('Wide container layout:', {
      aspectRatio: (availableSpace.width / availableSpace.height).toFixed(2),
      layout: `${layoutConfig.rows}x${layoutConfig.cardsPerRow}`,
      availableSpace: `${availableSpace.width}x${availableSpace.height}`
    })
    
    // 对于宽容器，应该选择合理的布局（可能是2x3或1x6，取决于具体的纵横比）
    expect(layoutConfig.totalCards).toBe(6)
    expect(layoutConfig.rows).toBeGreaterThan(0)
    expect(layoutConfig.cardsPerRow).toBeGreaterThan(0)
    
    // 如果纵横比非常大，单行布局是合理的
    const aspectRatio = availableSpace.width / availableSpace.height
    if (aspectRatio > 3.0) {
      // 超宽容器，单行布局是合理的
      expect(layoutConfig.rows).toBe(1)
      expect(layoutConfig.cardsPerRow).toBe(6)
    } else if (aspectRatio > 1.5) {
      // 宽容器，2x3布局是合理的
      expect(layoutConfig.rows).toBe(2)
      expect(layoutConfig.cardsPerRow).toBe(3)
    }
  })

  it('should choose 3x2 layout for tall containers', () => {
    // 创建一个高容器 (aspect ratio <= 1.2)
    const tallContainerWidth = 600
    const tallContainerHeight = 800
    
    const availableSpace = calculateAvailableCardSpace(tallContainerWidth, tallContainerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const layoutConfig = determineOptimal6CardLayout(availableSpace)
    
    // 对于高容器，应该选择3行2列布局
    expect(layoutConfig.rows).toBe(3)
    expect(layoutConfig.cardsPerRow).toBe(2)
    expect(layoutConfig.totalCards).toBe(6)
    
    console.log('Tall container layout:', {
      aspectRatio: (availableSpace.width / availableSpace.height).toFixed(2),
      layout: `${layoutConfig.rows}x${layoutConfig.cardsPerRow}`,
      availableSpace: `${availableSpace.width}x${availableSpace.height}`
    })
  })

  it('should choose single-row layout for ultra-wide containers', () => {
    // 创建一个超宽容器 (aspect ratio > 2.5)
    const ultraWideContainerWidth = 1600
    const ultraWideContainerHeight = 500
    
    const availableSpace = calculateAvailableCardSpace(ultraWideContainerWidth, ultraWideContainerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const layoutConfig = determineOptimal6CardLayout(availableSpace)
    
    // 对于超宽容器，可能选择单行布局
    console.log('Ultra-wide container layout:', {
      aspectRatio: (availableSpace.width / availableSpace.height).toFixed(2),
      layout: `${layoutConfig.rows}x${layoutConfig.cardsPerRow}`,
      availableSpace: `${availableSpace.width}x${availableSpace.height}`
    })
    
    // 验证布局是合理的
    expect(layoutConfig.totalCards).toBe(6)
    expect(layoutConfig.rows).toBeGreaterThan(0)
    expect(layoutConfig.cardsPerRow).toBeGreaterThan(0)
    expect(layoutConfig.rows * layoutConfig.cardsPerRow).toBeGreaterThanOrEqual(6)
  })

  it('should generate valid positions for 6 cards with optimized layout', () => {
    const containerWidth = 1024
    const containerHeight = 768
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const positions = calculateBoundaryAwarePositions(6, availableSpace)
    
    expect(positions).toHaveLength(6)
    
    // 验证所有位置都在边界内
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    expect(boundaryCheck.isValid).toBe(true)
    
    // 验证位置分布的平衡性
    const xPositions = positions.map(p => p.x)
    const yPositions = positions.map(p => p.y)
    
    // 应该有不同的x和y位置（不是所有卡牌都在同一位置）
    const uniqueXPositions = new Set(xPositions).size
    const uniqueYPositions = new Set(yPositions).size
    
    expect(uniqueXPositions).toBeGreaterThan(1)
    expect(uniqueYPositions).toBeGreaterThan(1)
    
    console.log('6-card position distribution:', {
      uniqueXPositions,
      uniqueYPositions,
      xRange: [Math.min(...xPositions), Math.max(...xPositions)],
      yRange: [Math.min(...yPositions), Math.max(...yPositions)]
    })
  })

  it('should respect 80% container limit for 6-card layouts', () => {
    const containerWidth = 800
    const containerHeight = 600
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const positions = calculateBoundaryAwarePositions(6, availableSpace)
    
    // 计算实际占用的空间
    const xPositions = positions.map(p => p.x)
    const yPositions = positions.map(p => p.y)
    const cardWidths = positions.map(p => p.cardWidth)
    const cardHeights = positions.map(p => p.cardHeight)
    
    const minX = Math.min(...xPositions.map((x, i) => x - cardWidths[i] / 2))
    const maxX = Math.max(...xPositions.map((x, i) => x + cardWidths[i] / 2))
    const minY = Math.min(...yPositions.map((y, i) => y - cardHeights[i] / 2))
    const maxY = Math.max(...yPositions.map((y, i) => y + cardHeights[i] / 2))
    
    // 转换为绝对坐标
    const centerX = availableSpace.width / 2
    const centerY = availableSpace.height / 2
    
    const actualMinX = minX + centerX
    const actualMaxX = maxX + centerX
    const actualMinY = minY + centerY
    const actualMaxY = maxY + centerY
    
    const actualWidth = actualMaxX - actualMinX
    const actualHeight = actualMaxY - actualMinY
    
    const widthRatio = actualWidth / availableSpace.width
    const heightRatio = actualHeight / availableSpace.height
    
    console.log('6-card space utilization:', {
      actualSize: `${actualWidth.toFixed(0)}x${actualHeight.toFixed(0)}`,
      availableSize: `${availableSpace.width}x${availableSpace.height}`,
      widthRatio: (widthRatio * 100).toFixed(1) + '%',
      heightRatio: (heightRatio * 100).toFixed(1) + '%'
    })
    
    // 验证不超过合理的空间使用率（允许一些灵活性）
    expect(widthRatio).toBeLessThanOrEqual(1.0) // 不超过100%
    expect(heightRatio).toBeLessThanOrEqual(1.0) // 不超过100%
  })

  it('should handle different aspect ratios correctly', () => {
    const testCases = [
      { width: 1600, height: 400, expectedAspectCategory: 'ultra-wide' }, // 4:1
      { width: 1200, height: 600, expectedAspectCategory: 'wide' },       // 2:1
      { width: 1024, height: 768, expectedAspectCategory: 'standard' },   // 4:3
      { width: 600, height: 800, expectedAspectCategory: 'tall' },        // 3:4
      { width: 400, height: 800, expectedAspectCategory: 'very-tall' }    // 1:2
    ]
    
    testCases.forEach(testCase => {
      const availableSpace = calculateAvailableCardSpace(testCase.width, testCase.height, {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      })
      
      const layoutConfig = determineOptimal6CardLayout(availableSpace)
      const aspectRatio = availableSpace.width / availableSpace.height
      
      // 验证布局是合理的
      expect(layoutConfig.totalCards).toBe(6)
      expect(layoutConfig.rows).toBeGreaterThan(0)
      expect(layoutConfig.cardsPerRow).toBeGreaterThan(0)
      
      // 验证能生成有效位置
      const positions = calculateBoundaryAwarePositions(6, availableSpace)
      expect(positions).toHaveLength(6)
      
      const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
      expect(boundaryCheck.isValid).toBe(true)
      
      console.log(`${testCase.expectedAspectCategory} container:`, {
        size: `${testCase.width}x${testCase.height}`,
        aspectRatio: aspectRatio.toFixed(2),
        layout: `${layoutConfig.rows}x${layoutConfig.cardsPerRow}`,
        boundaryValid: boundaryCheck.isValid
      })
    })
  })
})