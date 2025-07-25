'use client'

import { useState } from 'react'
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react'
import { BlinkingGameState, BlinkingConfig } from '@/types'
import { cn } from '@/lib/utils'

interface BlinkingControlPanelProps {
  gameState: BlinkingGameState
  config: BlinkingConfig
  soundEnabled: boolean
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onContinue?: () => void
  onSoundToggle: (enabled: boolean) => void
  onConfigChange?: (config: Partial<BlinkingConfig>) => void
  className?: string
}

export function BlinkingControlPanel({
  gameState,
  config,
  soundEnabled,
  onStart,
  onStop,
  onReset,
  onContinue,
  onSoundToggle,
  onConfigChange,
  className
}: BlinkingControlPanelProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  // 计算进度百分比
  const getProgress = () => {
    if (gameState.totalRounds === 0) return 0
    return (gameState.selectedItems.length / gameState.totalRounds) * 100
  }

  // 获取剩余轮次
  const getRemainingRounds = () => {
    return Math.max(0, gameState.totalRounds - gameState.selectedItems.length)
  }

  // 渲染游戏状态
  const renderGameStatus = () => {
    const statusConfig = {
      'idle': { text: '准备开始', color: 'text-gray-600', icon: null },
      'blinking': { text: '正在闪烁选择中...', color: 'text-blue-600', icon: '⚡' },
      'slowing': { text: '即将停止...', color: 'text-orange-600', icon: '⏳' },
      'stopped': { text: '选择完成！', color: 'text-green-600', icon: '✅' },
      'finished': { text: '全部完成！', color: 'text-purple-600', icon: '🎉' }
    }

    const status = statusConfig[gameState.phase]
    return (
      <div className={cn("flex items-center gap-2 text-lg font-medium", status.color)}>
        {status.icon && <span>{status.icon}</span>}
        <span>{status.text}</span>
      </div>
    )
  }

  // 应用设置
  const applySettings = () => {
    if (onConfigChange) {
      onConfigChange(tempConfig)
    }
    setShowSettings(false)
  }

  // 重置设置
  const resetSettings = () => {
    setTempConfig(config)
    setShowSettings(false)
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", className)}>
      {/* 进度条 */}
      {gameState.totalRounds > 1 && (
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="h-1 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      )}
      
      <div className="p-4">
        {/* 主要控制区域 */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* 状态和信息区域 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {renderGameStatus()}
            
            {/* 轮次信息 */}
            {gameState.totalRounds > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">进度:</span>
                <span className="font-medium text-gray-700">
                  {gameState.selectedItems.length} / {gameState.totalRounds}
                </span>
                {getRemainingRounds() > 0 && (
                  <span className="text-gray-400">
                    (还需 {getRemainingRounds()} 个)
                  </span>
                )}
              </div>
            )}

            {/* 轮次指示器 */}
            {gameState.phase !== 'idle' && gameState.phase !== 'finished' && gameState.totalRounds > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(gameState.totalRounds, 10) }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i < gameState.selectedItems.length
                        ? "bg-green-500"
                        : i === gameState.currentRound - 1
                        ? "bg-blue-500 animate-pulse"
                        : "bg-gray-300"
                    )}
                  />
                ))}
                {gameState.totalRounds > 10 && (
                  <span className="text-xs text-gray-400 ml-1">...</span>
                )}
              </div>
            )}

            {/* 速度指示器 */}
            {(gameState.phase === 'blinking' || gameState.phase === 'slowing') && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>速度:</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 h-3 rounded-full transition-all duration-200",
                        i < Math.ceil((gameState.blinkingSpeed / config.finalSpeed) * 5)
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 控制按钮区域 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 主要操作按钮 */}
            {gameState.phase === 'idle' && (
              <button
                onClick={onStart}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                开始闪烁
              </button>
            )}
            
            {(gameState.phase === 'blinking' || gameState.phase === 'slowing') && (
              <button
                onClick={onStop}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                <Pause className="w-4 h-4" />
                停止
              </button>
            )}
            
            {(gameState.phase === 'stopped' || gameState.phase === 'finished') && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                重新开始
              </button>
            )}

            {/* 继续下一轮按钮 */}
            {gameState.phase === 'stopped' && getRemainingRounds() > 0 && onContinue && (
              <button
                onClick={onContinue}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                继续下一轮
              </button>
            )}

            {/* 音效控制 */}
            <button
              onClick={() => onSoundToggle(!soundEnabled)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                soundEnabled
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              title={soundEnabled ? "关闭音效" : "开启音效"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* 设置按钮 */}
            {onConfigChange && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  showSettings
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                title="设置"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && onConfigChange && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">闪烁设置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 初始速度 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  初始速度 ({tempConfig.initialSpeed}ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={tempConfig.initialSpeed}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    initialSpeed: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 最终速度 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  最终速度 ({tempConfig.finalSpeed}ms)
                </label>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="100"
                  value={tempConfig.finalSpeed}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    finalSpeed: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 减速时长 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  减速时长 ({tempConfig.accelerationDuration / 1000}s)
                </label>
                <input
                  type="range"
                  min="1000"
                  max="5000"
                  step="500"
                  value={tempConfig.accelerationDuration}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    accelerationDuration: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 发光强度 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  发光强度 ({Math.round(tempConfig.glowIntensity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={tempConfig.glowIntensity}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    glowIntensity: parseFloat(e.target.value)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* 颜色主题选择 */}
            <div className="mt-4">
              <label className="block text-xs text-gray-600 mb-2">闪烁颜色主题</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: '经典', colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'] },
                  { name: '彩虹', colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'] },
                  { name: '冷色', colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981'] },
                  { name: '暖色', colors: ['#ef4444', '#f97316', '#eab308', '#f59e0b'] }
                ].map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setTempConfig(prev => ({ ...prev, colors: theme.colors }))}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full border transition-colors",
                      JSON.stringify(tempConfig.colors) === JSON.stringify(theme.colors)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 设置按钮 */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={resetSettings}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={applySettings}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}