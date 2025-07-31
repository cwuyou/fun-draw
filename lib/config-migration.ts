import type { DrawingConfig, DrawingMode } from '@/types'

/**
 * 配置数据迁移和兼容性处理工具
 */

/**
 * 多宫格抽奖配置迁移函数
 * 处理现有配置数据，确保多宫格模式的数量设置为1
 * @param config 原始配置数据
 * @returns 迁移后的配置数据
 */
export function migrateGridLotteryConfig(config: DrawingConfig): DrawingConfig {
  // 如果不是多宫格模式，直接返回原配置
  if (config.mode !== 'grid-lottery') {
    return config
  }

  // 多宫格模式：确保数量为1
  if (config.quantity !== 1) {
    console.log(`[配置迁移] 多宫格抽奖模式数量从 ${config.quantity} 修正为 1`)
    
    return {
      ...config,
      quantity: 1
    }
  }

  return config
}

/**
 * 通用配置迁移函数
 * 处理所有模式的配置兼容性问题
 * @param config 原始配置数据
 * @returns 迁移后的配置数据
 */
export function migrateDrawingConfig(config: DrawingConfig): DrawingConfig {
  let migratedConfig = { ...config }

  // 验证配置基本结构
  if (!migratedConfig.mode) {
    console.warn('[配置迁移] 缺少模式信息，设置为默认模式')
    migratedConfig.mode = 'slot-machine'
  }

  if (!migratedConfig.items || !Array.isArray(migratedConfig.items)) {
    console.warn('[配置迁移] 项目列表无效，设置为空数组')
    migratedConfig.items = []
  }

  if (typeof migratedConfig.quantity !== 'number' || migratedConfig.quantity < 1) {
    console.warn('[配置迁移] 数量设置无效，设置为默认值1')
    migratedConfig.quantity = 1
  }

  if (typeof migratedConfig.allowRepeat !== 'boolean') {
    console.warn('[配置迁移] 重复设置无效，设置为默认值false')
    migratedConfig.allowRepeat = false
  }

  // 应用多宫格模式特定迁移
  migratedConfig = migrateGridLotteryConfig(migratedConfig)

  // 验证数量设置的合理性
  migratedConfig = validateAndCorrectQuantity(migratedConfig)

  return migratedConfig
}

/**
 * 验证并修正数量设置
 * @param config 配置数据
 * @returns 修正后的配置数据
 */
function validateAndCorrectQuantity(config: DrawingConfig): DrawingConfig {
  const { mode, quantity, allowRepeat, items } = config

  // 多宫格模式特殊处理
  if (mode === 'grid-lottery') {
    if (quantity !== 1) {
      console.log(`[配置迁移] 多宫格模式数量修正：${quantity} -> 1`)
      return { ...config, quantity: 1 }
    }
    return config
  }

  // 其他模式的数量验证
  const maxQuantity = allowRepeat ? 100 : items.length
  
  if (quantity > maxQuantity) {
    const correctedQuantity = Math.max(1, maxQuantity)
    console.log(`[配置迁移] 数量超出限制，修正：${quantity} -> ${correctedQuantity}`)
    return { ...config, quantity: correctedQuantity }
  }

  return config
}

/**
 * 从localStorage加载配置并应用迁移
 * @param key 存储键名
 * @returns 迁移后的配置数据，如果不存在则返回null
 */
export function loadAndMigrateConfig(key: string): DrawingConfig | null {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      return null
    }

    const config = JSON.parse(stored) as DrawingConfig
    const migratedConfig = migrateDrawingConfig(config)

    // 如果配置被修改，保存回localStorage
    if (JSON.stringify(config) !== JSON.stringify(migratedConfig)) {
      console.log('[配置迁移] 配置已更新，保存到localStorage')
      localStorage.setItem(key, JSON.stringify(migratedConfig))
    }

    return migratedConfig
  } catch (error) {
    console.error('[配置迁移] 加载配置失败:', error)
    return null
  }
}

/**
 * 保存配置前的预处理
 * 确保配置符合当前版本的要求
 * @param config 要保存的配置
 * @returns 处理后的配置
 */
export function preprocessConfigForSave(config: DrawingConfig): DrawingConfig {
  return migrateDrawingConfig(config)
}

/**
 * 检查配置是否需要迁移
 * @param config 配置数据
 * @returns 是否需要迁移
 */
export function needsMigration(config: DrawingConfig): boolean {
  // 检查多宫格模式的数量设置
  if (config.mode === 'grid-lottery' && config.quantity !== 1) {
    return true
  }

  // 检查基本结构完整性
  if (!config.mode || !Array.isArray(config.items) || 
      typeof config.quantity !== 'number' || 
      typeof config.allowRepeat !== 'boolean') {
    return true
  }

  // 检查数量设置合理性
  const maxQuantity = config.allowRepeat ? 100 : config.items.length
  if (config.quantity < 1 || config.quantity > maxQuantity) {
    return true
  }

  return false
}

/**
 * 获取迁移日志信息
 * @param originalConfig 原始配置
 * @param migratedConfig 迁移后配置
 * @returns 迁移日志
 */
export function getMigrationLog(originalConfig: DrawingConfig, migratedConfig: DrawingConfig): string[] {
  const logs: string[] = []

  if (originalConfig.mode !== migratedConfig.mode) {
    logs.push(`模式: ${originalConfig.mode} -> ${migratedConfig.mode}`)
  }

  if (originalConfig.quantity !== migratedConfig.quantity) {
    logs.push(`数量: ${originalConfig.quantity} -> ${migratedConfig.quantity}`)
  }

  if (originalConfig.allowRepeat !== migratedConfig.allowRepeat) {
    logs.push(`允许重复: ${originalConfig.allowRepeat} -> ${migratedConfig.allowRepeat}`)
  }

  if (originalConfig.items.length !== migratedConfig.items.length) {
    logs.push(`项目数量: ${originalConfig.items.length} -> ${migratedConfig.items.length}`)
  }

  return logs
}