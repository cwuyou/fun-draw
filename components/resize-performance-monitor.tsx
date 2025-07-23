'use client'

import { useState, useEffect } from 'react'
import { resizePerformanceManager, ResizePerformanceMetrics } from '@/lib/resize-performance'

interface ResizePerformanceMonitorProps {
  enabled?: boolean
  showDetails?: boolean
  className?: string
}

export function ResizePerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  showDetails = false,
  className = ''
}: ResizePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<ResizePerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const updateMetrics = () => {
      setMetrics(resizePerformanceManager.getMetrics())
    }

    // 初始更新
    updateMetrics()

    // 定期更新指标
    const interval = setInterval(updateMetrics, 1000)

    return () => clearInterval(interval)
  }, [enabled])

  if (!enabled || !metrics) return null

  const formatDuration = (ms: number) => `${ms.toFixed(1)}ms`
  const formatMemory = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getPerformanceStatus = () => {
    if (metrics.averageDuration > 200) return { color: 'text-red-500', status: '慢' }
    if (metrics.averageDuration > 100) return { color: 'text-yellow-500', status: '中等' }
    return { color: 'text-green-500', status: '快' }
  }

  const performanceStatus = getPerformanceStatus()

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-mono hover:bg-gray-700 transition-colors"
        title="Resize Performance Monitor"
      >
        📊 {metrics.resizeCount}
      </button>

      {/* 详细面板 */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 max-w-96">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Resize Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 基础指标 */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">调整次数:</span>
              <span className="text-sm font-mono">{metrics.resizeCount}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">平均耗时:</span>
              <span className={`text-sm font-mono ${performanceStatus.color}`}>
                {formatDuration(metrics.averageDuration)} ({performanceStatus.status})
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">防抖命中:</span>
              <span className="text-sm font-mono">{metrics.debounceHits}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">内存使用:</span>
              <span className="text-sm font-mono">{formatMemory(metrics.memoryUsage)}</span>
            </div>
          </div>

          {/* 详细信息 */}
          {showDetails && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">总耗时:</span>
                <span className="text-sm font-mono">{formatDuration(metrics.totalDuration)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">最后调整:</span>
                <span className="text-sm font-mono">
                  {metrics.lastResizeTime ? new Date(metrics.lastResizeTime).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                const report = resizePerformanceManager.getPerformanceReport()
                console.log('Performance Report:', report)
              }}
              className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              导出报告
            </button>
            
            <button
              onClick={() => {
                resizePerformanceManager.reset()
                setMetrics(resizePerformanceManager.getMetrics())
              }}
              className="flex-1 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
          </div>

          {/* 性能建议 */}
          {metrics.averageDuration > 100 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div className="text-yellow-800 font-medium mb-1">性能建议:</div>
              <div className="text-yellow-700">
                {metrics.averageDuration > 200 
                  ? '调整大小处理较慢，考虑优化布局计算或增加防抖延迟'
                  : '调整大小处理中等，可以进一步优化'
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}