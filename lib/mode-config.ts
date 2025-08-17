import type { DrawingMode, ModeSpecificConfig, ModeConfiguration, ModeValidationResult, DrawingConfig } from '@/types'

// 翻译函数类型定义
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * 获取模式特定配置
 * @param mode 抽奖模式
 * @param itemCount 项目总数
 * @param allowRepeat 是否允许重复
 * @param t 翻译函数
 * @returns 模式特定配置
 */
export function getModeSpecificConfig(
  mode: DrawingMode,
  itemCount: number,
  allowRepeat: boolean,
  t?: TranslationFunction
): ModeSpecificConfig {
  const baseConfig = getModeConfiguration(mode, t)
  const maxQuantity = getMaxQuantityForMode(mode, allowRepeat, itemCount, t)
  
  // 对于多宫格抽奖，数量固定为1
  if (mode === 'grid-lottery') {
    return {
      showQuantityInput: false,
      quantityValue: 1,
      quantityEditable: false,
      description: t ? t('modeConfig.gridLottery.description') : '多宫格抽奖每次只能抽取1个项目',
      helpText: t ? t('modeConfig.gridLottery.helpText') : '多宫格模式通过灯光跳转定格的方式选择单个获奖者'
    }
  }

  return {
    showQuantityInput: baseConfig.uiConfig.showQuantityInput,
    quantityValue: baseConfig.quantityConfig.fixed ? (baseConfig.quantityConfig.value || 1) : 'auto',
    quantityEditable: baseConfig.uiConfig.quantityEditable && !baseConfig.quantityConfig.fixed,
    description: baseConfig.quantityConfig.description,
    helpText: baseConfig.uiConfig.helpText
  }
}

/**
 * 获取模式配置信息
 * @param mode 抽奖模式
 * @param t 翻译函数
 * @returns 模式配置
 */
export function getModeConfiguration(mode: DrawingMode, t?: TranslationFunction): ModeConfiguration {
  const configurations: Record<DrawingMode, ModeConfiguration> = {
    'grid-lottery': {
      mode: 'grid-lottery',
      quantityConfig: {
        fixed: true,
        value: 1,
        min: 1,
        max: 1,
        description: t ? t('modeConfig.gridLottery.description') : '多宫格抽奖每次只能抽取1个项目'
      },
      uiConfig: {
        showQuantityInput: false,
        quantityEditable: false,
        helpText: t ? t('modeConfig.gridLottery.helpText') : '多宫格模式通过灯光跳转定格的方式选择单个获奖者'
      }
    },
    'card-flip': {
      mode: 'card-flip',
      quantityConfig: {
        fixed: false,
        min: 1,
        max: 10,
        description: t ? t('modeConfig.cardFlip.description') : '卡牌模式最多10个'
      },
      uiConfig: {
        showQuantityInput: true,
        quantityEditable: true,
        helpText: t ? t('modeConfig.cardFlip.helpText') : '卡牌布局限制，最多支持10张卡牌'
      }
    },
    'slot-machine': {
      mode: 'slot-machine',
      quantityConfig: {
        fixed: false,
        min: 1,
        max: 12,
        description: t ? t('modeConfig.slotMachine.description') : '老虎机模式最多12个滚轮'
      },
      uiConfig: {
        showQuantityInput: true,
        quantityEditable: true,
        helpText: t ? t('modeConfig.slotMachine.helpText') : '避免滚轮过窄影响视觉效果'
      }
    },
    'bullet-screen': {
      mode: 'bullet-screen',
      quantityConfig: {
        fixed: false,
        min: 1,
        max: 20,
        description: t ? t('modeConfig.bulletScreen.description') : '弹幕模式最多20行'
      },
      uiConfig: {
        showQuantityInput: true,
        quantityEditable: true,
        helpText: t ? t('modeConfig.bulletScreen.helpText') : '垂直空间限制，避免弹幕过密'
      }
    },
    'blinking-name-picker': {
      mode: 'blinking-name-picker',
      quantityConfig: {
        fixed: false,
        min: 1,
        max: 50,
        description: t ? t('modeConfig.blinkingNamePicker.description') : '闪烁点名模式最多50个'
      },
      uiConfig: {
        showQuantityInput: true,
        quantityEditable: true,
        helpText: t ? t('modeConfig.blinkingNamePicker.helpText') : '支持虚拟滚动，可处理较多项目'
      }
    }
  }

  return configurations[mode]
}

/**
 * 根据抽奖模式获取最大数量限制
 * @param mode 抽奖模式
 * @param allowRepeat 是否允许重复
 * @param itemCount 项目总数
 * @param t 翻译函数
 * @returns 最大数量限制
 */
export function getMaxQuantityForMode(mode: DrawingMode, allowRepeat: boolean, itemCount: number, t?: TranslationFunction): number {
  const config = getModeConfiguration(mode, t)
  
  if (config.quantityConfig.fixed) {
    return config.quantityConfig.value || 1
  }

  const modeMax = config.quantityConfig.max || (allowRepeat ? 100 : itemCount)
  return Math.min(modeMax, allowRepeat ? 100 : itemCount)
}

/**
 * 获取数量限制的描述文本
 * @param mode 抽奖模式
 * @param allowRepeat 是否允许重复
 * @param itemCount 项目总数
 * @param t 翻译函数
 * @returns 描述文本
 */
export function getQuantityLimitDescription(mode: DrawingMode, allowRepeat: boolean, itemCount: number, t?: TranslationFunction): string {
  const config = getModeConfiguration(mode, t)
  const maxQuantity = getMaxQuantityForMode(mode, allowRepeat, itemCount, t)
  
  if (config.quantityConfig.fixed) {
    return config.quantityConfig.description
  }

  const maxText = t ? t('modeConfig.maxQuantity', { max: maxQuantity }) : `最多${maxQuantity}个`
  return `${config.quantityConfig.description}（${maxText}）`
}

/**
 * 验证模式配置
 * @param config 抽奖配置
 * @returns 验证结果
 */
export function validateModeConfig(config: DrawingConfig, t?: TranslationFunction): ModeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const modeConfig = getModeConfiguration(config.mode, t)
  const maxQuantity = getMaxQuantityForMode(config.mode, config.allowRepeat, config.items.length, t)

  // 验证数量
  if (config.quantity < 1) {
    errors.push('抽取数量必须大于0')
  }

  if (config.quantity > maxQuantity) {
    errors.push(`${modeConfig.quantityConfig.description}，当前设置${config.quantity}个超出限制`)
  }

  // 验证项目数量
  if (config.items.length === 0) {
    errors.push('项目列表不能为空')
  }

  // 验证重复设置
  if (!config.allowRepeat && config.quantity > config.items.length) {
    errors.push('在不允许重复的情况下，抽取数量不能超过项目总数')
  }

  // 特殊模式验证
  if (config.mode === 'grid-lottery') {
    if (config.quantity !== 1) {
      errors.push('多宫格抽奖模式只能抽取1个项目')
    }
    
    // 验证宫格数量支持
    const supportedGridSizes = [6, 9, 12, 15]
    if (!supportedGridSizes.includes(config.items.length) && config.items.length > 15) {
      warnings.push('多宫格模式建议项目数量为6、9、12或15个以获得最佳布局效果')
    }
  }

  // 生成修正配置
  let correctedConfig: Partial<DrawingConfig> | undefined
  if (errors.length > 0) {
    correctedConfig = {
      quantity: Math.min(Math.max(1, config.quantity), maxQuantity)
    }
    
    if (config.mode === 'grid-lottery') {
      correctedConfig.quantity = 1
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedConfig
  }
}