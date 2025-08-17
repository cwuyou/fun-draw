'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bug, 
  Eye, 
  EyeOff, 
  Download, 
  Trash2, 
  Activity, 
  AlertTriangle,
  Info,
  Settings,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'
import {
  getPositionDebugSummary,
  getPositionCalculationHistory,
  clearPositionDebugHistory,
  exportPositionDebugData,
  enablePositionDebug,
  disablePositionDebug
} from '@/lib/position-debug'

interface PositionDebugPanelProps {
  isVisible?: boolean
  onToggle?: (visible: boolean) => void
  className?: string
}

export function PositionDebugPanel({
  isVisible = false,
  onToggle,
  className = ''
}: PositionDebugPanelProps) {
  // 只在开发模式下显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const [debugSummary, setDebugSummary] = useState<any>(null)
  const [calculationHistory, setCalculationHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'settings'>('summary')
  const [debugEnabled, setDebugEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // 刷新调试数据
  const refreshDebugData = () => {
    try {
      const summary = getPositionDebugSummary()
      const history = getPositionCalculationHistory(20)
      setDebugSummary(summary)
      setCalculationHistory(history)
    } catch (error) {
      console.error('Failed to refresh debug data:', error)
    }
  }

  // 设置自动刷新
  useEffect(() => {
    if (isVisible) {
      refreshDebugData()
      const interval = setInterval(refreshDebugData, 2000)
      setRefreshInterval(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [isVisible])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [refreshInterval])

  const handleToggleDebug = () => {
    if (debugEnabled) {
      disablePositionDebug()
    } else {
      enablePositionDebug()
    }
    setDebugEnabled(!debugEnabled)
  }

  const handleClearHistory = () => {
    clearPositionDebugHistory()
    refreshDebugData()
  }

  const handleExportData = () => {
    try {
      const data = exportPositionDebugData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `position-debug-${new Date().toISOString().slice(0, 19)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export debug data:', error)
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      case 'desktop': return <Monitor className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="打开位置调试面板"
      >
        <Bug className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 max-h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bug className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">位置调试面板</h3>
          <div className={`w-2 h-2 rounded-full ${debugEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleDebug}
            className={`p-1 rounded ${debugEnabled ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
            title={debugEnabled ? '禁用调试' : '启用调试'}
          >
            {debugEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onToggle?.(false)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
            title="关闭面板"
          >
            ×
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'summary', label: '概览', icon: Activity },
          { key: 'history', label: '历史', icon: Info },
          { key: 'settings', label: '设置', icon: Settings }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {activeTab === 'summary' && debugSummary && (
          <div className="space-y-4">
            {/* 基本统计 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{debugSummary.totalCalculations}</div>
                <div className="text-sm text-blue-800">总计算次数</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {debugSummary.averageCalculationTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-green-800">平均计算时间</div>
              </div>
            </div>

            {/* 降级率 */}
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800">降级处理率</span>
                <span className="text-lg font-bold text-yellow-600">
                  {(debugSummary.fallbackRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${debugSummary.fallbackRate * 100}%` }}
                />
              </div>
            </div>

            {/* 设备转换 */}
            {debugSummary.deviceTransitions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">设备类型转换</h4>
                <div className="space-y-2">
                  {debugSummary.deviceTransitions.map((transition: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(transition.from)}
                        <span className="text-sm">→</span>
                        {getDeviceIcon(transition.to)}
                      </div>
                      <span className="text-sm font-medium">{transition.count}次</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最近错误 */}
            {debugSummary.recentErrors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                  最近错误
                </h4>
                <div className="space-y-1">
                  {debugSummary.recentErrors.slice(0, 3).map((error: string, index: number) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">计算历史</h4>
              <button
                onClick={refreshDebugData}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                刷新
              </button>
            </div>
            
            {calculationHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无计算历史</p>
              </div>
            ) : (
              <div className="space-y-2">
                {calculationHistory.map((entry: any) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(entry.input.deviceType)}
                        <span className="text-xs font-medium text-gray-900">
                          {entry.input.cardCount} 张卡牌
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">容器:</span>
                        <span className="ml-1">{entry.input.containerWidth}×{entry.input.containerHeight}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">耗时:</span>
                        <span className="ml-1">{entry.performance.totalTime.toFixed(1)}ms</span>
                      </div>
                    </div>

                    {entry.metadata.fallbackApplied && (
                      <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        使用了降级处理
                      </div>
                    )}

                    {(entry.output.errors.length > 0 || entry.output.warnings.length > 0) && (
                      <div className="mt-2 space-y-1">
                        {entry.output.errors.map((error: string, index: number) => (
                          <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            错误: {error}
                          </div>
                        ))}
                        {entry.output.warnings.map((warning: string, index: number) => (
                          <div key={index} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                            警告: {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={handleToggleDebug}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">启用位置调试</span>
              </label>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">操作</h4>
              <div className="space-y-2">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出调试数据</span>
                </button>
                
                <button
                  onClick={handleClearHistory}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清除历史记录</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">调试信息</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>环境: {process.env.NODE_ENV}</div>
                <div>用户代理: {navigator.userAgent.slice(0, 50)}...</div>
                <div>屏幕: {window.screen.width}×{window.screen.height}</div>
                <div>视口: {window.innerWidth}×{window.innerHeight}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 调试面板钩子
export function usePositionDebugPanel() {
  const [isVisible, setIsVisible] = useState(false)

  const toggle = (visible?: boolean) => {
    setIsVisible(visible !== undefined ? visible : !isVisible)
  }

  return {
    isVisible,
    toggle,
    DebugPanel: (props: Omit<PositionDebugPanelProps, 'isVisible' | 'onToggle'>) => (
      <PositionDebugPanel
        {...props}
        isVisible={isVisible}
        onToggle={toggle}
      />
    )
  }
}