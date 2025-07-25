import { BlinkingConfig, BlinkingItem, ListItem } from '@/types'

/**
 * 闪烁动画控制器
 * 负责管理闪烁动画的时序、速度变化和选择逻辑
 */
export class BlinkingAnimationController {
  private config: BlinkingConfig
  private startTime: number = 0
  private currentSpeed: number
  private animationId: number | null = null
  private intervalId: NodeJS.Timeout | null = null
  
  constructor(config: BlinkingConfig) {
    this.config = config
    this.currentSpeed = config.initialSpeed
  }

  /**
   * 计算当前闪烁速度（基于缓动函数）
   */
  calculateBlinkingSpeed(elapsed: number): number {
    const progress = Math.min(elapsed / this.config.accelerationDuration, 1)
    // 使用ease-out缓动函数实现平滑减速
    const easeOut = 1 - Math.pow(1 - progress, 3)
    return this.config.initialSpeed + (this.config.finalSpeed - this.config.initialSpeed) * easeOut
  }

  /**
   * 获取当前时间戳对应的闪烁颜色
   */
  getBlinkingColor(timestamp: number): string {
    const colorIndex = Math.floor(timestamp / 200) % this.config.colors.length
    return this.config.colors[colorIndex]
  }

  /**
   * 开始闪烁动画
   */
  startBlinking(
    items: BlinkingItem[],
    onHighlightChange: (index: number, color: string) => void,
    onSpeedChange: (speed: number) => void,
    onComplete: (selectedIndex: number) => void
  ): void {
    this.startTime = Date.now()
    this.currentSpeed = this.config.initialSpeed
    
    let currentIndex = 0
    const excludeIndices = new Set<number>()
    
    // 获取可用的项目索引
    const availableIndices = items
      .map((_, index) => index)
      .filter(index => !items[index].isSelected)

    if (availableIndices.length === 0) {
      onComplete(-1)
      return
    }

    const blinkingLoop = () => {
      const elapsed = Date.now() - this.startTime
      const newSpeed = this.calculateBlinkingSpeed(elapsed)
      const color = this.getBlinkingColor(Date.now())
      
      // 更新当前高亮项目
      currentIndex = this.selectRandomItem(availableIndices, excludeIndices)
      onHighlightChange(currentIndex, color)
      onSpeedChange(newSpeed)
      
      this.currentSpeed = newSpeed
      
      // 检查是否应该停止
      if (elapsed >= this.config.accelerationDuration) {
        // 减速阶段完成，选择最终结果
        const finalIndex = this.selectRandomItem(availableIndices, excludeIndices)
        onHighlightChange(finalIndex, this.config.colors[0])
        onComplete(finalIndex)
        return
      }
      
      // 继续下一次闪烁
      this.intervalId = setTimeout(blinkingLoop, newSpeed)
    }
    
    // 开始第一次闪烁
    blinkingLoop()
  }

  /**
   * 停止闪烁动画
   */
  stopBlinking(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * 选择随机项目索引
   */
  private selectRandomItem(availableIndices: number[], excludeIndices: Set<number>): number {
    const validIndices = availableIndices.filter(index => !excludeIndices.has(index))
    
    if (validIndices.length === 0) {
      return availableIndices[Math.floor(Math.random() * availableIndices.length)]
    }
    
    return validIndices[Math.floor(Math.random() * validIndices.length)]
  }

  /**
   * 重置控制器状态
   */
  reset(): void {
    this.stopBlinking()
    this.startTime = 0
    this.currentSpeed = this.config.initialSpeed
  }

  /**
   * 获取当前速度
   */
  getCurrentSpeed(): number {
    return this.currentSpeed
  }

  /**
   * 获取进度百分比
   */
  getProgress(): number {
    if (this.startTime === 0) return 0
    const elapsed = Date.now() - this.startTime
    return Math.min(elapsed / this.config.accelerationDuration, 1)
  }
}

/**
 * 随机选择算法工具函数
 */
export class RandomSelector {
  /**
   * 从项目列表中随机选择指定数量的项目
   */
  static selectWinners(
    items: ListItem[], 
    quantity: number, 
    allowRepeat: boolean
  ): ListItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('项目列表不能为空')
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('抽取数量必须是大于0的整数')
    }

    if (!allowRepeat && quantity > items.length) {
      throw new Error('不允许重复时，抽取数量不能超过项目总数')
    }

    const winners: ListItem[] = []
    const availableItems = [...items]
    
    // 使用Fisher-Yates洗牌算法确保真正随机
    this.shuffleArray(availableItems)
    
    for (let i = 0; i < quantity; i++) {
      if (availableItems.length === 0 && !allowRepeat) {
        console.warn(`只能选择${i}个项目，少于配置的${quantity}个`)
        break
      }
      
      const randomIndex = Math.floor(Math.random() * availableItems.length)
      const winner = availableItems[randomIndex]
      
      if (!winner) {
        console.error(`选择项目时遇到空项目，索引: ${randomIndex}`)
        continue
      }
      
      winners.push(winner)
      
      if (!allowRepeat) {
        availableItems.splice(randomIndex, 1)
      }
    }
    
    return winners
  }

  /**
   * Fisher-Yates洗牌算法
   */
  private static shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  /**
   * 生成加权随机选择（为未来扩展预留）
   */
  static selectWithWeights(
    items: ListItem[], 
    weights: number[], 
    quantity: number = 1
  ): ListItem[] {
    if (items.length !== weights.length) {
      throw new Error('项目数量与权重数量不匹配')
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const winners: ListItem[] = []

    for (let i = 0; i < quantity; i++) {
      let random = Math.random() * totalWeight
      
      for (let j = 0; j < items.length; j++) {
        random -= weights[j]
        if (random <= 0) {
          winners.push(items[j])
          break
        }
      }
    }

    return winners
  }
}

/**
 * 颜色循环管理器
 */
export class ColorCycleManager {
  private colors: string[]
  private currentIndex: number = 0
  private lastUpdateTime: number = 0
  private cycleInterval: number

  constructor(colors: string[], cycleInterval: number = 200) {
    this.colors = colors
    this.cycleInterval = cycleInterval
  }

  /**
   * 获取当前颜色
   */
  getCurrentColor(): string {
    return this.colors[this.currentIndex]
  }

  /**
   * 更新颜色（基于时间）
   */
  updateColor(timestamp: number): string {
    if (timestamp - this.lastUpdateTime >= this.cycleInterval) {
      this.currentIndex = (this.currentIndex + 1) % this.colors.length
      this.lastUpdateTime = timestamp
    }
    return this.getCurrentColor()
  }

  /**
   * 重置到第一个颜色
   */
  reset(): void {
    this.currentIndex = 0
    this.lastUpdateTime = 0
  }

  /**
   * 设置循环间隔
   */
  setCycleInterval(interval: number): void {
    this.cycleInterval = interval
  }
}

/**
 * 动画性能监控器
 */
export class AnimationPerformanceMonitor {
  private frameCount: number = 0
  private lastTime: number = 0
  private fps: number = 60
  private isMonitoring: boolean = false

  /**
   * 开始监控性能
   */
  startMonitoring(): void {
    this.isMonitoring = true
    this.frameCount = 0
    this.lastTime = performance.now()
    this.monitorFrame()
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false
  }

  /**
   * 获取当前FPS
   */
  getCurrentFPS(): number {
    return this.fps
  }

  /**
   * 是否需要降级动画
   */
  shouldDowngradeAnimation(): boolean {
    return this.fps < 30
  }

  private monitorFrame(): void {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    this.frameCount++

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
    }

    requestAnimationFrame(() => this.monitorFrame())
  }
}