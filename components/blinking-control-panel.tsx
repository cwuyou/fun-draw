'use client'

import { useState } from 'react'
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { BlinkingGameState, BlinkingConfig } from '@/types'
import { cn } from '@/lib/utils'

interface BlinkingControlPanelProps {
  gameState: BlinkingGameState
  config: BlinkingConfig
  soundEnabled: boolean
  onStart: () => void
  onStop: () => void
  onResume?: () => void
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
  onResume,
  onReset,
  onContinue,
  onSoundToggle,
  onConfigChange,
  className
}: BlinkingControlPanelProps) {
  const { t } = useTranslation()
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
      'idle': { 
        text: t('drawingComponents.blinkingNamePicker.controlPanel.idle.text'), 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100', 
        icon: '🎯',
        description: t('drawingComponents.blinkingNamePicker.controlPanel.idle.description')
      },
      'blinking': { 
        text: t('drawingComponents.blinkingNamePicker.controlPanel.blinking.text'), 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100', 
        icon: '⚡',
        description: t('drawingComponents.blinkingNamePicker.controlPanel.blinking.description')
      },
      'slowing': { 
        text: t('drawingComponents.blinkingNamePicker.controlPanel.slowing.text'), 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100', 
        icon: '⏳',
        description: t('drawingComponents.blinkingNamePicker.controlPanel.slowing.description')
      },
      'paused': {
        text: t('drawingComponents.blinkingNamePicker.controlPanel.paused.text'),
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⏸️',
        description: t('drawingComponents.blinkingNamePicker.controlPanel.paused.description')
      },
      'stopped': { 
        text: t('drawingComponents.blinkingNamePicker.controlPanel.stopped.text'), 
        color: 'text-green-600', 
        bgColor: 'bg-green-100', 
        icon: '✅',
        description: t('drawingComponents.blinkingNamePicker.controlPanel.stopped.description')
      },
      'finished': { 
        text: t('drawingComponents.blinkingNamePicker.controlPanel.finished.text'), 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-100', 
        icon: '🎉',
        description: t('drawingComponents.blinkingNamePicker.controlPanel.finished.description')
      }
    }

    const status = statusConfig[gameState.phase]
    return (
      <div className="flex flex-col gap-1">
        <div className={cn("flex items-center gap-2 text-lg font-medium transition-all duration-300", status.color)}>
          {status.icon && (
            <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300", status.bgColor)}>
              {status.icon}
            </span>
          )}
          <span className="transition-all duration-300">{status.text}</span>
        </div>
        <div className="text-xs text-gray-500 ml-10">
          {status.description}
        </div>
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
                <span className="text-gray-500">{t('blinkingNamePicker.progressLabel')}</span>
                <span className="font-medium text-gray-700">
                  {gameState.selectedItems.length} / {gameState.totalRounds}
                </span>
                {getRemainingRounds() > 0 && (
                  <span className="text-gray-400">
                    {t('blinkingNamePicker.remainingCount', { count: getRemainingRounds() })}
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
                <span>{t('blinkingNamePicker.speedLabel')}</span>
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
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                title={t('blinkingNamePicker.startBlinkingTooltip')}
              >
                <Play className="w-4 h-4" />
                {t('blinkingNamePicker.startBlinking')}
              </button>
            )}
            
            {(gameState.phase === 'blinking' || gameState.phase === 'slowing') && (
              <button
                onClick={onStop}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg animate-pulse"
                title={t('blinkingNamePicker.pauseBlinkingTooltip')}
              >
                <Pause className="w-4 h-4" />
                {t('blinkingNamePicker.pause')}
              </button>
            )}
            
            {gameState.phase === 'paused' && onResume && (
              <button
                onClick={onResume}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                title={t('blinkingNamePicker.resumeBlinkingTooltip')}
              >
                <Play className="w-4 h-4" />
                {t('blinkingNamePicker.resumeBlinking')}
              </button>
            )}
            
            {(gameState.phase === 'stopped' || gameState.phase === 'finished') && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                title={t('blinkingNamePicker.restartTooltip')}
              >
                <RotateCcw className="w-4 h-4" />
                {t('blinkingNamePicker.restart')}
              </button>
            )}

            {/* 继续下一轮按钮 */}
            {gameState.phase === 'stopped' && getRemainingRounds() > 0 && onContinue && (
              <button
                onClick={onContinue}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 animate-bounce"
                title={t('blinkingNamePicker.continueNextRoundTooltip', { count: getRemainingRounds() })}
              >
                <Play className="w-4 h-4" />
                {t('blinkingNamePicker.continueNextRound')}
              </button>
            )}

            {/* 音效控制 */}
            <button
              onClick={() => onSoundToggle(!soundEnabled)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                soundEnabled
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              title={soundEnabled ? t('blinkingNamePicker.turnOffSound') : t('blinkingNamePicker.turnOnSound')}
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
                title={t('blinkingNamePicker.settings')}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && onConfigChange && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('blinkingNamePicker.blinkingSettings')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 初始速度 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {t('blinkingNamePicker.initialSpeed', { speed: tempConfig.initialSpeed })}
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
                  {t('blinkingNamePicker.finalSpeed', { speed: tempConfig.finalSpeed })}
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
                  {t('blinkingNamePicker.accelerationDuration', { seconds: Math.round(tempConfig.accelerationDuration / 1000) })}
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
                  {t('blinkingNamePicker.glowIntensity', { percent: Math.round(tempConfig.glowIntensity * 100) })}
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
              <label className="block text-xs text-gray-600 mb-2">{t('blinkingNamePicker.colorTheme')}</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: t('blinkingNamePicker.theme.classic'), colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'] },
                  { name: t('blinkingNamePicker.theme.rainbow'), colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'] },
                  { name: t('blinkingNamePicker.theme.cool'), colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981'] },
                  { name: t('blinkingNamePicker.theme.warm'), colors: ['#ef4444', '#f97316', '#eab308', '#f59e0b'] }
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
                {t('common.cancel')}
              </button>
              <button
                onClick={applySettings}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}