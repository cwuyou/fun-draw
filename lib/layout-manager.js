// 布局管理核心工具函数 (CommonJS版本用于测试)
// 提供设备检测、响应式配置、安全边距计算和容器尺寸计算功能

// 设备配置常量
const DEVICE_CONFIGS = {
  mobile: {
    type: 'mobile',
    breakpoint: 768,
    maxCards: 6,
    cardSize: { width: 80, height: 120 },
    spacing: 12,
    cardsPerRow: 2,
    minContainerWidth: 320,
    minContainerHeight: 400
  },
  tablet: {
    type: 'tablet',
    breakpoint: 1024,
    maxCards: 12,
    cardSize: { width: 88, height: 132 },
    spacing: 14,
    cardsPerRow: 3,
    minContainerWidth: 768,
    minContainerHeight: 600
  },
  desktop: {
    type: 'desktop',
    breakpoint: Infinity,
    maxCards: 20,
    cardSize: { width: 96, height: 144 },
    spacing: 16,
    cardsPerRow: 5,
    minContainerWidth: 1024,
    minContainerHeight: 700
  }
}

// UI元素高度常量
const UI_ELEMENT_HEIGHTS = {
  gameInfo: 120,        // 游戏信息面板高度
  gameStatus: 40,       // 游戏状态提示高度
  startButton: 80,      // 开始按钮区域高度
  resultDisplay: 100,   // 结果显示区域高度
  warnings: 60,         // 警告信息区域高度
  padding: 32           // 容器内边距
}

/**
 * 检测当前设备类型
 */
function detectDeviceType(containerWidth) {
  const width = containerWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024)
  
  if (width < DEVICE_CONFIGS.mobile.breakpoint) {
    return 'mobile'
  } else if (width < DEVICE_CONFIGS.tablet.breakpoint) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

/**
 * 获取设备配置
 */
function getDeviceConfig(deviceType) {
  return { ...DEVICE_CONFIGS[deviceType] }
}

/**
 * 获取响应式设备配置
 */
function getResponsiveDeviceConfig(containerWidth) {
  const deviceType = detectDeviceType(containerWidth)
  return getDeviceConfig(deviceType)
}

/**
 * 计算安全边距
 */
function calculateSafeMargins(deviceType, options = {}) {
  const {
    hasGameInfo = true,
    hasWarnings = false,
    hasStartButton = false,
    hasResultDisplay = false
  } = options

  // 基础边距
  let top = UI_ELEMENT_HEIGHTS.gameStatus + UI_ELEMENT_HEIGHTS.padding
  let bottom = UI_ELEMENT_HEIGHTS.padding

  // 根据UI元素调整边距
  if (hasGameInfo) {
    top += UI_ELEMENT_HEIGHTS.gameInfo
  }

  if (hasWarnings) {
    top += UI_ELEMENT_HEIGHTS.warnings
  }

  if (hasStartButton) {
    bottom += UI_ELEMENT_HEIGHTS.startButton
  }

  if (hasResultDisplay) {
    bottom += UI_ELEMENT_HEIGHTS.resultDisplay
  }

  // 设备特定调整
  const deviceMultiplier = deviceType === 'mobile' ? 1.2 : deviceType === 'tablet' ? 1.1 : 1.0
  top *= deviceMultiplier
  bottom *= deviceMultiplier

  const horizontal = UI_ELEMENT_HEIGHTS.padding
  const vertical = top + bottom

  return {
    top,
    bottom,
    left: horizontal,
    right: horizontal,
    horizontal: horizontal * 2,
    vertical
  }
}

/**
 * 计算容器尺寸
 */
function calculateContainerDimensions(actualWidth, actualHeight, safeMargins) {
  return {
    width: actualWidth,
    height: actualHeight,
    availableWidth: Math.max(0, actualWidth - safeMargins.horizontal),
    availableHeight: Math.max(0, actualHeight - safeMargins.vertical)
  }
}

/**
 * 计算最大安全卡牌数量
 */
function calculateMaxSafeCards(containerDimensions, deviceConfig) {
  const { availableWidth, availableHeight } = containerDimensions
  const { cardSize, spacing, cardsPerRow } = deviceConfig

  // 计算可容纳的行数
  const maxRows = Math.floor((availableHeight + spacing) / (cardSize.height + spacing))
  
  // 计算每行实际可容纳的卡牌数
  const actualCardsPerRow = Math.min(
    cardsPerRow,
    Math.floor((availableWidth + spacing) / (cardSize.width + spacing))
  )

  // 总的最大卡牌数
  const maxCards = Math.max(0, maxRows * actualCardsPerRow)
  
  // 不超过设备限制
  return Math.min(maxCards, deviceConfig.maxCards)
}

/**
 * 计算推荐卡牌数量
 */
function calculateRecommendedCards(requestedQuantity, maxSafeCards, itemCount) {
  // 确保不超过可用项目数
  const maxPossible = Math.min(maxSafeCards, itemCount)
  
  // 推荐数量至少是请求数量，但不超过最大可能数量
  const recommended = Math.min(
    Math.max(requestedQuantity, Math.ceil(requestedQuantity * 1.2)), // 增加20%的缓冲
    maxPossible
  )

  return Math.max(1, recommended) // 至少1张卡牌
}

/**
 * 验证容器是否满足最小要求
 */
function validateContainerSize(containerDimensions, deviceConfig) {
  const { width, height, availableWidth, availableHeight } = containerDimensions
  const { minContainerWidth, minContainerHeight, cardSize } = deviceConfig

  if (width < minContainerWidth) {
    return {
      isValid: false,
      error: `Container width (${width}px) is below minimum required (${minContainerWidth}px) for ${deviceConfig.type} devices`
    }
  }

  if (height < minContainerHeight) {
    return {
      isValid: false,
      error: `Container height (${height}px) is below minimum required (${minContainerHeight}px) for ${deviceConfig.type} devices`
    }
  }

  // 检查是否至少能容纳一张卡牌
  if (availableWidth < cardSize.width || availableHeight < cardSize.height) {
    return {
      isValid: false,
      error: `Available space (${availableWidth}x${availableHeight}px) is too small for card size (${cardSize.width}x${cardSize.height}px)`
    }
  }

  return { isValid: true }
}

/**
 * 综合布局计算
 */
function calculateLayout(containerWidth, containerHeight, requestedQuantity, itemCount, uiOptions = {}) {
  // 获取设备配置
  const deviceConfig = getResponsiveDeviceConfig(containerWidth)
  
  // 计算安全边距
  const safeMargins = calculateSafeMargins(deviceConfig.type, uiOptions)
  
  // 计算容器尺寸
  const containerDimensions = calculateContainerDimensions(
    containerWidth,
    containerHeight,
    safeMargins
  )
  
  // 计算最大安全卡牌数
  const maxSafeCards = calculateMaxSafeCards(containerDimensions, deviceConfig)
  
  // 计算推荐卡牌数
  const recommendedCards = calculateRecommendedCards(
    requestedQuantity,
    maxSafeCards,
    itemCount
  )

  return {
    deviceConfig,
    containerDimensions,
    safeMargins,
    maxSafeCards,
    recommendedCards
  }
}

/**
 * 获取布局调试信息
 */
function getLayoutDebugInfo(layoutResult) {
  const { deviceConfig, containerDimensions, safeMargins, maxSafeCards, recommendedCards } = layoutResult
  
  return [
    `Device: ${deviceConfig.type} (${containerDimensions.width}x${containerDimensions.height}px)`,
    `Available: ${containerDimensions.availableWidth}x${containerDimensions.availableHeight}px`,
    `Margins: T${safeMargins.top} B${safeMargins.bottom} L${safeMargins.left} R${safeMargins.right}`,
    `Card Size: ${deviceConfig.cardSize.width}x${deviceConfig.cardSize.height}px`,
    `Max Safe Cards: ${maxSafeCards}`,
    `Recommended: ${recommendedCards}`
  ].join(' | ')
}

module.exports = {
  detectDeviceType,
  getDeviceConfig,
  getResponsiveDeviceConfig,
  calculateSafeMargins,
  calculateContainerDimensions,
  calculateMaxSafeCards,
  calculateRecommendedCards,
  validateContainerSize,
  calculateLayout,
  getLayoutDebugInfo
}