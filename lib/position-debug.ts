// 位置调试工具
// 提供位置计算的详细日志记录、历史跟踪和可视化调试功能

import {
    CardPosition,
    DeviceConfig,
    PositionCalculationContext,
    LayoutCalculationResult,
    DeviceType
} from '@/types'

// 调试配置接口
interface DebugConfig {
    enabled: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    visualDebug: boolean
    trackHistory: boolean
    maxHistorySize: number
    showPerformanceMetrics: boolean
}

// 位置计算历史记录
interface PositionCalculationHistory {
    id: string
    timestamp: number
    context: PositionCalculationContext
    input: {
        containerWidth: number
        containerHeight: number
        cardCount: number
        deviceType: string
    }
    output: {
        positions: CardPosition[]
        layoutResult?: LayoutCalculationResult
        errors: string[]
        warnings: string[]
    }
    performance: {
        calculationTime: number
        validationTime: number
        totalTime: number
    }
    metadata: {
        triggeredBy: 'resize' | 'initial' | 'manual' | 'error-recovery'
        fallbackApplied: boolean
        deviceTransition?: {
            from: string
            to: string
        }
    }
}

// 调试状态管理
class PositionDebugManager {
    private config: DebugConfig
    private history: PositionCalculationHistory[] = []
    private currentCalculationId: string | null = null
    private performanceStartTime: number = 0

    constructor(config: Partial<DebugConfig> = {}) {
        this.config = {
            enabled: process.env.NODE_ENV === 'development',
            logLevel: 'info',
            visualDebug: false,
            trackHistory: true,
            maxHistorySize: 50,
            showPerformanceMetrics: true,
            ...config
        }
    }

    // 更新调试配置
    updateConfig(newConfig: Partial<DebugConfig>) {
        this.config = { ...this.config, ...newConfig }
        this.log('info', 'Debug configuration updated', newConfig)
    }

    // 开始位置计算跟踪
    startCalculation(
        context: PositionCalculationContext,
        triggeredBy: PositionCalculationHistory['metadata']['triggeredBy'] = 'manual'
    ): string {
        if (!this.config.enabled) return ''

        const calculationId = `calc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
        this.currentCalculationId = calculationId
        this.performanceStartTime = performance.now()

        this.log('debug', `Starting position calculation: ${calculationId}`, {
            context,
            triggeredBy
        })

        return calculationId
    }

    // 结束位置计算跟踪
    endCalculation(
        calculationId: string,
        positions: CardPosition[],
        layoutResult?: LayoutCalculationResult,
        errors: string[] = [],
        warnings: string[] = [],
        metadata: Partial<PositionCalculationHistory['metadata']> = {}
    ) {
        if (!this.config.enabled || calculationId !== this.currentCalculationId) return

        const totalTime = performance.now() - this.performanceStartTime

        const historyEntry: PositionCalculationHistory = {
            id: calculationId,
            timestamp: Date.now(),
            context: this.getCurrentContext(),
            input: {
                containerWidth: window.innerWidth,
                containerHeight: window.innerHeight,
                cardCount: positions.length,
                deviceType: layoutResult?.deviceConfig?.type || 'desktop'
            },
            output: {
                positions,
                layoutResult,
                errors,
                warnings
            },
            performance: {
                calculationTime: totalTime * 0.8, // 估算
                validationTime: totalTime * 0.2, // 估算
                totalTime
            },
            metadata: {
                triggeredBy: 'manual',
                fallbackApplied: positions.some(p => p.isFallback),
                ...metadata
            }
        }

        if (this.config.trackHistory) {
            this.addToHistory(historyEntry)
        }

        this.log('info', `Position calculation completed: ${calculationId}`, {
            positionCount: positions.length,
            totalTime: `${totalTime.toFixed(2)}ms`,
            errorsCount: errors.length,
            warningsCount: warnings.length,
            fallbackApplied: historyEntry.metadata.fallbackApplied
        })

        this.currentCalculationId = null
    }

    // 记录位置验证错误
    logValidationError(
        position: any,
        index: number,
        error: string,
        context?: any
    ) {
        if (!this.config.enabled) return

        this.log('error', `Position validation failed at index ${index}`, {
            position,
            error,
            context,
            calculationId: this.currentCalculationId
        })
    }

    // 记录位置验证警告
    logValidationWarning(
        position: CardPosition,
        index: number,
        warning: string,
        context?: any
    ) {
        if (!this.config.enabled) return

        this.log('warn', `Position validation warning at index ${index}`, {
            position,
            warning,
            context,
            calculationId: this.currentCalculationId
        })
    }

    // 记录设备类型转换
    logDeviceTransition(
        fromDevice: string,
        toDevice: string,
        containerDimensions: { width: number; height: number }
    ) {
        if (!this.config.enabled) return

        this.log('info', `Device type transition: ${fromDevice} → ${toDevice}`, {
            fromDevice,
            toDevice,
            containerDimensions,
            calculationId: this.currentCalculationId
        })
    }

    // 记录降级处理
    logFallbackApplied(
        reason: string,
        fallbackType: 'position' | 'layout' | 'calculation',
        context?: any
    ) {
        if (!this.config.enabled) return

        this.log('warn', `Fallback applied: ${fallbackType}`, {
            reason,
            fallbackType,
            context,
            calculationId: this.currentCalculationId
        })
    }

    // 获取调试信息摘要
    getDebugSummary(): {
        totalCalculations: number
        recentErrors: string[]
        recentWarnings: string[]
        averageCalculationTime: number
        fallbackRate: number
        deviceTransitions: Array<{ from: string; to: string; count: number }>
    } {
        const recentHistory = this.history.slice(-10)

        const errors = recentHistory.flatMap(h => h.output.errors)
        const warnings = recentHistory.flatMap(h => h.output.warnings)

        const avgTime = recentHistory.length > 0
            ? recentHistory.reduce((sum, h) => sum + h.performance.totalTime, 0) / recentHistory.length
            : 0

        const fallbackCount = recentHistory.filter(h => h.metadata.fallbackApplied).length
        const fallbackRate = recentHistory.length > 0 ? fallbackCount / recentHistory.length : 0

        // 统计设备转换
        const deviceTransitions = new Map<string, number>()
        recentHistory.forEach(h => {
            if (h.metadata.deviceTransition) {
                const key = `${h.metadata.deviceTransition.from}->${h.metadata.deviceTransition.to}`
                deviceTransitions.set(key, (deviceTransitions.get(key) || 0) + 1)
            }
        })

        return {
            totalCalculations: this.history.length,
            recentErrors: errors.slice(-5),
            recentWarnings: warnings.slice(-5),
            averageCalculationTime: avgTime,
            fallbackRate,
            deviceTransitions: Array.from(deviceTransitions.entries()).map(([transition, count]) => {
                const [from, to] = transition.split('->')
                return { from, to, count }
            })
        }
    }

    // 获取位置计算历史
    getCalculationHistory(limit: number = 10): PositionCalculationHistory[] {
        return this.history.slice(-limit)
    }

    // 清除历史记录
    clearHistory() {
        this.history = []
        this.log('info', 'Position calculation history cleared')
    }

    // 导出调试数据
    exportDebugData(): string {
        const debugData = {
            config: this.config,
            history: this.history,
            summary: this.getDebugSummary(),
            exportTime: new Date().toISOString()
        }

        return JSON.stringify(debugData, null, 2)
    }

    // 私有方法：添加到历史记录
    private addToHistory(entry: PositionCalculationHistory) {
        this.history.push(entry)

        // 限制历史记录大小
        if (this.history.length > this.config.maxHistorySize) {
            this.history = this.history.slice(-this.config.maxHistorySize)
        }
    }

    // 私有方法：获取当前上下文
    private getCurrentContext(): PositionCalculationContext {
        return {
            containerWidth: window.innerWidth,
            containerHeight: window.innerHeight,
            cardCount: 0, // 将在实际使用时更新
            deviceType: 'desktop' as DeviceType, // 将在实际使用时更新
            timestamp: Date.now(),
            fallbackApplied: false
        }
    }

    // 私有方法：日志记录
    private log(level: DebugConfig['logLevel'], message: string, data?: any) {
        if (!this.config.enabled) return

        const logLevels = ['error', 'warn', 'info', 'debug']
        const currentLevelIndex = logLevels.indexOf(this.config.logLevel)
        const messageLevelIndex = logLevels.indexOf(level)

        if (messageLevelIndex > currentLevelIndex) return

        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [POSITION-DEBUG] [${level.toUpperCase()}]`

        switch (level) {
            case 'error':
                console.error(prefix, message, data)
                break
            case 'warn':
                console.warn(prefix, message, data)
                break
            case 'info':
                console.info(prefix, message, data)
                break
            case 'debug':
                console.debug(prefix, message, data)
                break
        }
    }
}

// 全局调试管理器实例
const debugManager = new PositionDebugManager()

// 导出的调试函数
export function enablePositionDebug(config?: Partial<DebugConfig>) {
    debugManager.updateConfig({ enabled: true, ...config })
}

export function disablePositionDebug() {
    debugManager.updateConfig({ enabled: false })
}

export function startPositionCalculation(
    context: PositionCalculationContext,
    triggeredBy?: PositionCalculationHistory['metadata']['triggeredBy']
): string {
    return debugManager.startCalculation(context, triggeredBy)
}

export function endPositionCalculation(
    calculationId: string,
    positions: CardPosition[],
    layoutResult?: LayoutCalculationResult,
    errors?: string[],
    warnings?: string[],
    metadata?: Partial<PositionCalculationHistory['metadata']>
) {
    debugManager.endCalculation(calculationId, positions, layoutResult, errors, warnings, metadata)
}

export function logPositionValidationError(
    position: any,
    index: number,
    error: string,
    context?: any
) {
    debugManager.logValidationError(position, index, error, context)
}

export function logPositionValidationWarning(
    position: CardPosition,
    index: number,
    warning: string,
    context?: any
) {
    debugManager.logValidationWarning(position, index, warning, context)
}

export function logDeviceTransition(
    fromDevice: string,
    toDevice: string,
    containerDimensions: { width: number; height: number }
) {
    debugManager.logDeviceTransition(fromDevice, toDevice, containerDimensions)
}

export function logFallbackApplied(
    reason: string,
    fallbackType: 'position' | 'layout' | 'calculation',
    context?: any
) {
    debugManager.logFallbackApplied(reason, fallbackType, context)
}

export function getPositionDebugSummary() {
    return debugManager.getDebugSummary()
}

export function getPositionCalculationHistory(limit?: number) {
    return debugManager.getCalculationHistory(limit)
}

export function clearPositionDebugHistory() {
    debugManager.clearHistory()
}

export function exportPositionDebugData(): string {
    return debugManager.exportDebugData()
}

// 布局调试信息获取函数
export function getLayoutDebugInfo(layoutResult: LayoutCalculationResult): any {
    return {
        deviceType: layoutResult.deviceConfig?.type,
        containerDimensions: layoutResult.containerDimensions,
        safeMargins: layoutResult.safeMargins,
        maxSafeCards: layoutResult.maxSafeCards,
        recommendedCards: layoutResult.recommendedCards,
        fallbackApplied: layoutResult.fallbackApplied,
        timestamp: Date.now()
    }
}