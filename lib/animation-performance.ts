// 动画性能优化工具
export interface DeviceCapabilities {
  isLowEnd: boolean
  supportsHardwareAcceleration: boolean
  preferReducedMotion: boolean
  maxConcurrentAnimations: number
  animationQuality: 'high' | 'medium' | 'low'
}

export interface AnimationConfig {
  enableComplexAnimations: boolean
  enableParticleEffects: boolean
  enableShadows: boolean
  enableBlur: boolean
  animationDuration: number
  frameRate: number
  animationQuality: 'high' | 'medium' | 'low'
}

class AnimationPerformanceManager {
  private deviceCapabilities: DeviceCapabilities | null = null
  private animationConfig: AnimationConfig | null = null
  private activeAnimations = new Set<string>()
  private performanceObserver: PerformanceObserver | null = null
  private frameRateHistory: number[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectDeviceCapabilities()
      this.setupPerformanceMonitoring()
    }
  }

  // 检测设备性能能力
  private detectDeviceCapabilities(): void {
    const capabilities: DeviceCapabilities = {
      isLowEnd: this.isLowEndDevice(),
      supportsHardwareAcceleration: this.supportsHardwareAcceleration(),
      preferReducedMotion: this.prefersReducedMotion(),
      maxConcurrentAnimations: this.getMaxConcurrentAnimations(),
      animationQuality: this.determineAnimationQuality()
    }

    this.deviceCapabilities = capabilities
    this.animationConfig = this.createAnimationConfig(capabilities)
  }

  // 检测是否为低端设备
  private isLowEndDevice(): boolean {
    // 检查硬件并发数（CPU核心数的近似值）
    const hardwareConcurrency = navigator.hardwareConcurrency || 2
    
    // 检查内存（如果可用）
    const deviceMemory = (navigator as any).deviceMemory || 4
    
    // 检查连接类型（如果可用）
    const connection = (navigator as any).connection
    const isSlowConnection = connection && 
      (connection.effectiveType === 'slow-2g' || 
       connection.effectiveType === '2g' || 
       connection.effectiveType === '3g')

    // 检查用户代理字符串中的低端设备标识
    const userAgent = navigator.userAgent.toLowerCase()
    const isLowEndUA = userAgent.includes('android') && 
      (userAgent.includes('chrome/') && 
       parseInt(userAgent.split('chrome/')[1]) < 80)

    return hardwareConcurrency <= 2 || 
           deviceMemory <= 2 || 
           isSlowConnection || 
           isLowEndUA
  }

  // 检测硬件加速支持
  private supportsHardwareAcceleration(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch {
      return false
    }
  }

  // 检测用户是否偏好减少动画
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // 确定最大并发动画数量
  private getMaxConcurrentAnimations(): number {
    if (this.isLowEndDevice()) return 2
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 8) return 8
    return 4
  }

  // 确定动画质量等级
  private determineAnimationQuality(): 'high' | 'medium' | 'low' {
    if (this.prefersReducedMotion()) return 'low'
    if (this.isLowEndDevice()) return 'low'
    if (!this.supportsHardwareAcceleration()) return 'medium'
    return 'high'
  }

  // 创建动画配置
  private createAnimationConfig(capabilities: DeviceCapabilities): AnimationConfig {
    const baseConfig: AnimationConfig = {
      enableComplexAnimations: true,
      enableParticleEffects: true,
      enableShadows: true,
      enableBlur: true,
      animationDuration: 1,
      frameRate: 60,
      animationQuality: capabilities.animationQuality
    }

    switch (capabilities.animationQuality) {
      case 'low':
        return {
          ...baseConfig,
          enableComplexAnimations: false,
          enableParticleEffects: false,
          enableShadows: false,
          enableBlur: false,
          animationDuration: 0.5,
          frameRate: 30,
          animationQuality: 'low'
        }
      case 'medium':
        return {
          ...baseConfig,
          enableParticleEffects: false,
          enableBlur: false,
          animationDuration: 0.75,
          frameRate: 45,
          animationQuality: 'medium'
        }
      default:
        return {
          ...baseConfig,
          animationQuality: 'high'
        }
    }
  }

  // 设置性能监控
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'measure' && entry.name.startsWith('animation-')) {
              this.recordFrameRate(entry.duration)
            }
          })
        })
        
        this.performanceObserver.observe({ entryTypes: ['measure'] })
      } catch (error) {
        console.warn('性能监控初始化失败:', error)
      }
    }

    // 监听帧率
    this.startFrameRateMonitoring()
  }

  // 开始帧率监控
  private startFrameRateMonitoring(): void {
    let lastTime = performance.now()
    let frameCount = 0

    const measureFrameRate = (currentTime: number) => {
      frameCount++
      
      if (currentTime - lastTime >= 1000) { // 每秒测量一次
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        this.recordFrameRate(fps)
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFrameRate)
    }
    
    requestAnimationFrame(measureFrameRate)
  }

  // 记录帧率
  private recordFrameRate(fps: number): void {
    this.frameRateHistory.push(fps)
    
    // 只保留最近的100个记录
    if (this.frameRateHistory.length > 100) {
      this.frameRateHistory.shift()
    }
    
    // 如果帧率持续低于阈值，降级动画质量
    if (this.frameRateHistory.length >= 10) {
      const averageFps = this.frameRateHistory.slice(-10).reduce((a, b) => a + b, 0) / 10
      
      if (averageFps < 30 && this.animationConfig?.animationQuality !== 'low') {
        console.warn('检测到低帧率，降级动画质量')
        this.degradeAnimationQuality()
      }
    }
  }

  // 降级动画质量
  private degradeAnimationQuality(): void {
    if (!this.animationConfig) return

    this.animationConfig = {
      ...this.animationConfig,
      enableComplexAnimations: false,
      enableParticleEffects: false,
      enableShadows: false,
      animationDuration: 0.5,
      frameRate: 30,
      animationQuality: 'low'
    }

    // 触发自定义事件通知组件更新
    window.dispatchEvent(new CustomEvent('animationQualityChanged', {
      detail: this.animationConfig
    }))
  }

  // 注册动画
  registerAnimation(id: string): boolean {
    if (!this.deviceCapabilities) return true

    if (this.activeAnimations.size >= this.deviceCapabilities.maxConcurrentAnimations) {
      console.warn(`达到最大并发动画数量限制: ${this.deviceCapabilities.maxConcurrentAnimations}`)
      return false
    }

    this.activeAnimations.add(id)
    return true
  }

  // 注销动画
  unregisterAnimation(id: string): void {
    this.activeAnimations.delete(id)
  }

  // 获取设备能力
  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities
  }

  // 获取动画配置
  getAnimationConfig(): AnimationConfig | null {
    return this.animationConfig
  }

  // 获取当前帧率
  getCurrentFrameRate(): number {
    if (this.frameRateHistory.length === 0) return 60
    return this.frameRateHistory[this.frameRateHistory.length - 1]
  }

  // 获取平均帧率
  getAverageFrameRate(): number {
    if (this.frameRateHistory.length === 0) return 60
    return this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length
  }

  // 检查是否应该跳过动画
  shouldSkipAnimation(): boolean {
    return this.deviceCapabilities?.preferReducedMotion || 
           this.deviceCapabilities?.animationQuality === 'low' ||
           false
  }

  // 获取优化的动画持续时间
  getOptimizedDuration(baseDuration: number): number {
    if (!this.animationConfig) return baseDuration
    return baseDuration * this.animationConfig.animationDuration
  }

  // 检查是否启用复杂动画
  shouldEnableComplexAnimations(): boolean {
    return this.animationConfig?.enableComplexAnimations ?? true
  }

  // 检查是否启用粒子效果
  shouldEnableParticleEffects(): boolean {
    return this.animationConfig?.enableParticleEffects ?? true
  }

  // 检查是否启用阴影
  shouldEnableShadows(): boolean {
    return this.animationConfig?.enableShadows ?? true
  }

  // 检查是否启用模糊效果
  shouldEnableBlur(): boolean {
    return this.animationConfig?.enableBlur ?? true
  }

  // 清理资源
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }
    
    this.activeAnimations.clear()
    this.frameRateHistory = []
  }
}

// 创建全局实例
export const animationPerformanceManager = new AnimationPerformanceManager()

// 动画性能钩子
export function useAnimationPerformance() {
  const capabilities = animationPerformanceManager.getDeviceCapabilities()
  const config = animationPerformanceManager.getAnimationConfig()

  return {
    capabilities,
    config,
    shouldSkipAnimation: animationPerformanceManager.shouldSkipAnimation(),
    shouldEnableComplexAnimations: animationPerformanceManager.shouldEnableComplexAnimations(),
    shouldEnableParticleEffects: animationPerformanceManager.shouldEnableParticleEffects(),
    shouldEnableShadows: animationPerformanceManager.shouldEnableShadows(),
    shouldEnableBlur: animationPerformanceManager.shouldEnableBlur(),
    getOptimizedDuration: (duration: number) => animationPerformanceManager.getOptimizedDuration(duration),
    registerAnimation: (id: string) => animationPerformanceManager.registerAnimation(id),
    unregisterAnimation: (id: string) => animationPerformanceManager.unregisterAnimation(id),
    getCurrentFrameRate: () => animationPerformanceManager.getCurrentFrameRate(),
    getAverageFrameRate: () => animationPerformanceManager.getAverageFrameRate()
  }
}