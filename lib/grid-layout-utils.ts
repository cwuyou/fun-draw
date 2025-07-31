import type { ListItem, GridCell } from "@/types"

/**
 * 根据参与项目数量确定最佳的宫格布局
 * 按照需求规范：
 * - 1-6个项目：2×3布局（6宫格）
 * - 7-9个项目：3×3布局（9宫格）
 * - 10-12个项目：3×4布局（12宫格）
 * - 13-15个项目：3×5布局（15宫格）
 * - 超过15个项目：3×5布局（15宫格）并随机选择15个项目
 */
export function determineOptimalGridSize(itemCount: number): number {
  if (itemCount <= 6) return 6   // 2×3 布局
  if (itemCount <= 9) return 9   // 3×3 布局
  if (itemCount <= 12) return 12 // 3×4 布局
  return 15 // 3×5 布局（13-15个或更多）
}

/**
 * 根据宫格数量获取列数
 */
export function getGridColumns(gridSize: number): number {
  switch (gridSize) {
    case 6: return 3  // 2×3
    case 9: return 3  // 3×3
    case 12: return 4 // 3×4
    case 15: return 5 // 3×5
    default: return 3
  }
}

/**
 * 根据宫格数量获取行数
 */
export function getGridRows(gridSize: number): number {
  switch (gridSize) {
    case 6: return 2  // 2×3
    case 9: return 3  // 3×3
    case 12: return 3 // 3×4
    case 15: return 3 // 3×5
    default: return 3
  }
}

/**
 * 创建空的占位符项目
 */
export function createPlaceholderItem(index: number): ListItem {
  return {
    id: `placeholder-${index}`,
    name: `空位 ${index + 1}`
  }
}

/**
 * 根据配置填充宫格
 * @param items 原始项目列表
 * @param gridSize 目标宫格数量
 * @param allowRepeat 是否允许重复
 * @returns 填充后的项目列表
 */
export function fillGridCells(
  items: ListItem[], 
  gridSize: number, 
  allowRepeat: boolean
): ListItem[] {
  if (items.length === 0) {
    // 如果没有项目，创建占位符
    return Array.from({ length: gridSize }, (_, index) => createPlaceholderItem(index))
  }

  // 如果项目数量超过宫格数量，随机选择项目
  if (items.length > gridSize) {
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, gridSize)
  }

  // 如果项目数量等于宫格数量，直接返回
  if (items.length === gridSize) {
    return [...items]
  }

  // 项目数量少于宫格数量的情况
  if (allowRepeat) {
    // 允许重复：创建一个平衡的分布，确保公平性
    const filledItems: ListItem[] = []
    
    // 计算每个项目应该出现的基础次数
    const baseCount = Math.floor(gridSize / items.length)
    const extraCount = gridSize % items.length
    
    // 为每个项目分配基础出现次数
    items.forEach(item => {
      for (let i = 0; i < baseCount; i++) {
        filledItems.push(item)
      }
    })
    
    // 随机选择项目来填充剩余的位置
    const shuffledItems = [...items].sort(() => Math.random() - 0.5)
    for (let i = 0; i < extraCount; i++) {
      filledItems.push(shuffledItems[i])
    }
    
    // 随机打乱所有项目的位置，确保公平性和随机性
    return filledItems.sort(() => Math.random() - 0.5)
  } else {
    // 不允许重复：使用现有项目 + 占位符
    const filledItems = [...items]
    const remainingSlots = gridSize - items.length
    
    for (let i = 0; i < remainingSlots; i++) {
      filledItems.push(createPlaceholderItem(items.length + i))
    }
    
    return filledItems
  }
}

/**
 * 创建宫格单元格数组
 * @param items 填充后的项目列表
 * @param gridSize 宫格数量
 * @returns 宫格单元格数组
 */
export function createGridCells(items: ListItem[], gridSize: number): GridCell[] {
  const columns = getGridColumns(gridSize)
  
  return items.map((item, index) => ({
    id: `cell-${index}`,
    index,
    item,
    isHighlighted: false,
    isWinner: false,
    position: {
      row: Math.floor(index / columns),
      col: index % columns
    }
  }))
}

/**
 * 验证宫格配置是否有效
 * @param items 原始项目列表
 * @param allowRepeat 是否允许重复
 * @returns 验证结果
 */
export function validateGridConfiguration(
  items: ListItem[], 
  allowRepeat: boolean
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  recommendedGridSize: number
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (items.length === 0) {
    errors.push('多宫格抽奖需要至少1个参与项目')
  }
  
  const recommendedGridSize = determineOptimalGridSize(items.length)
  
  if (items.length > 15) {
    warnings.push(`项目数量超过15个（${items.length}个），将随机选择15个填充宫格`)
  }
  
  if (items.length < recommendedGridSize && !allowRepeat) {
    warnings.push(
      `项目数量（${items.length}个）少于推荐宫格数量（${recommendedGridSize}个），` +
      `空余宫格将显示占位符。建议启用"允许重复"以获得更好的视觉效果。`
    )
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendedGridSize
  }
}

/**
 * 获取有效的抽奖项目（排除占位符，去重）
 * @param cells 宫格单元格数组
 * @returns 有效的抽奖项目列表（去重后）
 */
export function getValidDrawItems(cells: GridCell[]): ListItem[] {
  const validItems = cells
    .map(cell => cell.item)
    .filter(item => !item.id.startsWith('placeholder-'))
  
  // 去重：基于ID去重，保留第一次出现的项目
  const uniqueItems: ListItem[] = []
  const seenIds = new Set<string>()
  
  for (const item of validItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id)
      uniqueItems.push(item)
    }
  }
  
  return uniqueItems
}

/**
 * 在宫格中查找项目的索引
 * @param cells 宫格单元格数组
 * @param targetItem 目标项目
 * @returns 项目在宫格中的索引，如果未找到返回-1
 */
export function findItemInGrid(cells: GridCell[], targetItem: ListItem): number {
  // 首先尝试精确匹配ID
  let index = cells.findIndex(cell => cell.item.id === targetItem.id)
  
  if (index === -1) {
    // 如果ID匹配失败，尝试匹配名称（处理重复项目的情况）
    index = cells.findIndex(cell => 
      cell.item.name === targetItem.name && 
      !cell.item.id.startsWith('placeholder-')
    )
  }
  
  return index
}