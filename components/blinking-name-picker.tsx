'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { BlinkingDisplay } from './blinking-display'
import { BlinkingControlPanel } from './blinking-control-panel'
import { soundManager } from '@/lib/sound-manager'
import { useAnimationPerformance } from '@/lib/animation-performance'
import { 
  BlinkingAnimationController, 
  RandomSelector, 
  ColorCycleManager 
} from '@/lib/blinking-animation'
import { 
  BlinkingNamePickerProps, 
  BlinkingGameState, 
  BlinkingConfig, 
  BlinkingItem,
  ListItem 
} from '@/types'
import { cn } from '@/lib/utils'

// 默认配置
const DEFAULT_BLINKING_CONFIG: BlinkingConfig = {
  initialSpeed: 100,
  finalSpeed: 1000,
  accelerationDuration: 3000,
  colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'], // 红、蓝、绿、黄
  glowIntensity: 0.8
}

export function BlinkingNamePicker({
  items,
  quantity,
  allowRepeat,
  onComplete,
  onRestart,
  soundEnabled,
  className,
  autoStart = false
}: BlinkingNamePickerProps) {
  const { t } = useTranslation()
  // 初始化游戏名称 - 在组件加载时就创建
  const initialGameItems = useMemo(() => {
    return items.map((item, index) => ({
      id: `blinking-item-${item.id}`,
      item,
      isHighlighted: false,
      isSelected: false,
      highlightColor: DEFAULT_BLINKING_CONFIG.colors[0],
      position: {
        row: Math.floor(index / 4), // 假设4列布局
        col: index % 4,
        index
      }
    }))
  }, [items])

  const [gameState, setGameState] = useState<BlinkingGameState>({
    phase: 'idle',
    items: initialGameItems, // 使用初始化的游戏名称
    currentHighlight: null,
    selectedItems: [],
    blinkingSpeed: DEFAULT_BLINKING_CONFIG.initialSpeed,
    currentRound: 0,
    totalRounds: quantity,
    startTime: 0
  })

  // 当 items 或 quantity 变化时，更新游戏状态
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      items: initialGameItems,
      totalRounds: quantity,
      // 如果不在游戏进行中，重置到 idle 状态
      phase: prev.phase === 'blinking' || prev.phase === 'slowing' ? prev.phase : 'idle',
      selectedItems: prev.phase === 'blinking' || prev.phase === 'slowing' ? prev.selectedItems : [],
      currentHighlight: prev.phase === 'blinking' || prev.phase === 'slowing' ? prev.currentHighlight : null
    }))
  }, [initialGameItems, quantity])



  const [config, setConfig] = useState<BlinkingConfig>(DEFAULT_BLINKING_CONFIG)
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled)

  // 同步外部 soundEnabled 属性的变化
  useEffect(() => {
    setLocalSoundEnabled(soundEnabled)
  }, [soundEnabled])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs for animation controllers
  const animationControllerRef = useRef<BlinkingAnimationController | null>(null)
  const colorManagerRef = useRef<ColorCycleManager | null>(null)

  // 使用动画性能管理器
  const { getOptimizedDuration } = useAnimationPerformance()

  // 初始化动画控制器
  useEffect(() => {
    animationControllerRef.current = new BlinkingAnimationController(config)
    colorManagerRef.current = new ColorCycleManager(config.colors)
    
    return () => {
      animationControllerRef.current?.stopBlinking()
    }
  }, [config])

  // 性能监控和内存管理
  useEffect(() => {
    // 清理定时器和动画
    return () => {
      animationControllerRef.current?.stopBlinking()
      colorManagerRef.current?.reset()
      // 清理所有音效
      soundManager.stopAll()
    }
  }, [])

  // 响应式设计 - 监听窗口大小变化
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout
    
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        // 触发重新渲染以适应新的屏幕尺寸
        setGameState(prev => ({ ...prev }))
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // 初始化游戏名称
  const initializeGameItems = useCallback((itemList: ListItem[]): BlinkingItem[] => {
    return itemList.map((item, index) => ({
      id: `blinking-item-${item.id}`,
      item,
      isHighlighted: false,
      isSelected: false,
      highlightColor: config.colors[0],
      position: {
        row: Math.floor(index / 4), // 假设4列布局
        col: index % 4,
        index
      }
    }))
  }, [config.colors])

  // 选择随机名称
  const selectRandomItem = useCallback((
    availableItems: BlinkingItem[], 
    excludeIndices: Set<number> = new Set()
  ): number => {
    const availableIndices = availableItems
      .map((_, index) => index)
      .filter(index => !excludeIndices.has(index))
    
    if (availableIndices.length === 0) {
      throw new Error('没有可选择的名称')
    }
    
    return availableIndices[Math.floor(Math.random() * availableIndices.length)]
  }, [])

  // 获取闪烁颜色
  const getBlinkingColor = useCallback((timestamp: number): string => {
    const colorIndex = Math.floor(timestamp / 200) % config.colors.length
    return config.colors[colorIndex]
  }, [config.colors])

  // 计算闪烁速度
  const calculateBlinkingSpeed = useCallback((elapsed: number): number => {
    const progress = Math.min(elapsed / config.accelerationDuration, 1)
    // 使用ease-out缓动函数
    const easeOut = 1 - Math.pow(1 - progress, 3)
    return config.initialSpeed + (config.finalSpeed - config.initialSpeed) * easeOut
  }, [config])

  // 开始闪烁动画
  const startBlinkingAnimation = useCallback((gameItems: BlinkingItem[], roundNumber: number) => {
    if (!animationControllerRef.current) return

    // 停止之前的动画，防止多个动画同时运行
    animationControllerRef.current.stopBlinking()

    // 播放闪烁点名专用开始音效
    if (localSoundEnabled) {
      soundManager.play('blinking-start').catch(() => {
        // 忽略音效错误
      })
    }

    animationControllerRef.current.startBlinking(
      gameItems,
      // 高亮变化回调
      (index: number, color: string) => {
        setGameState(prev => ({
          ...prev,
          currentHighlight: index,
          items: prev.items.map((item, i) => ({
            ...item,
            isHighlighted: i === index,
            highlightColor: color
          }))
        }))

        // 播放闪烁音效
        if (localSoundEnabled) {
          soundManager.play('tick').catch(() => {
            // 忽略音效错误
          })
        }
      },
      // 速度变化回调
      (speed: number) => {
        setGameState(prev => ({
          ...prev,
          blinkingSpeed: speed,
          phase: speed > config.initialSpeed * 2 ? 'slowing' : 'blinking'
        }))

        // 当进入减速阶段时播放不同的音效
        if (speed > config.initialSpeed * 2 && soundEnabled) {
          soundManager.play('slow-tick').catch(() => {
            // 忽略音效错误
          })
        }
      },
      // 完成回调
      (selectedIndex: number) => {
        if (selectedIndex >= 0 && selectedIndex < gameItems.length) {
          const selectedItem = gameItems[selectedIndex].item
          
          setGameState(prev => {
            // 防止超过目标数量的选择
            if (prev.selectedItems.length >= quantity) {
              console.warn('已达到目标数量，忽略额外的选择')
              return prev
            }
            
            const newSelectedItems = [...prev.selectedItems, selectedItem]
            const updatedItems = prev.items.map((item, i) => ({
              ...item,
              isSelected: i === selectedIndex ? true : item.isSelected,
              isHighlighted: false
            }))

            // 停止所有循环音效并播放选中音效
            if (localSoundEnabled) {
              soundManager.stopAll()
              soundManager.play('select').catch(() => {
                // 忽略音效错误
              })
            }

            // 检查是否需要继续下一轮
            if (newSelectedItems.length < quantity) {
              // 延迟开始下一轮
              setTimeout(() => {
                if (!allowRepeat) {
                  // 从可用名称中移除已选中的名称
                  const availableItems = updatedItems.filter(item => !item.isSelected)
                  if (availableItems.length > 0) {
                    startBlinkingAnimation(updatedItems, roundNumber + 1)
                  } else {
                    // 没有更多可选名称，结束游戏
                    setGameState(current => ({ ...current, phase: 'finished' }))
                    onComplete(newSelectedItems)
                  }
                } else {
                  // 允许重复，继续下一轮
                  startBlinkingAnimation(updatedItems, roundNumber + 1)
                }
              }, 1000)

              return {
                ...prev,
                phase: 'stopped',
                selectedItems: newSelectedItems,
                items: updatedItems,
                currentRound: roundNumber,
                currentHighlight: selectedIndex
              }
            } else {
              // 所有轮次完成
              setTimeout(() => {
                // 停止所有音效并播放完成音效
                if (localSoundEnabled) {
                  soundManager.stopAll()
                  soundManager.play('complete').catch(() => {
                    // 忽略音效错误
                  })
                }
                onComplete(newSelectedItems)
              }, 500)

              return {
                ...prev,
                phase: 'finished',
                selectedItems: newSelectedItems,
                items: updatedItems,
                currentHighlight: selectedIndex
              }
            }
          })
        }
      }
    )
  }, [config, localSoundEnabled, quantity, allowRepeat, onComplete])

  // 开始游戏
  const startGame = useCallback(() => {
    try {
      setError(null)
      
      if (items.length === 0) {
        setError(t('drawingComponents.blinkingNamePicker.emptyListError'))
        return
      }

      if (quantity <= 0) {
        setError('抽取数量必须大于0')
        return
      }

      if (!allowRepeat && quantity > items.length) {
        setError('不允许重复时，抽取数量不能超过名称总数')
        return
      }

      // 检查动画控制器是否存在
      if (!animationControllerRef.current) {
        console.error('Animation controller not initialized')
        setError(t('drawingComponents.blinkingNamePicker.animationControllerError'))
        return
      }

      setIsLoading(true)

      // 使用当前的游戏名称，重置它们的状态
      const resetGameItems = gameState.items.map(item => ({
        ...item,
        isHighlighted: false,
        isSelected: false,
        highlightColor: config.colors[0]
      }))
      
      setGameState(prev => ({
        ...prev,
        phase: 'blinking',
        items: resetGameItems,
        currentHighlight: null,
        selectedItems: [],
        blinkingSpeed: config.initialSpeed,
        currentRound: 1,
        totalRounds: quantity,
        startTime: Date.now()
      }))

      setIsLoading(false)

      // 开始第一轮闪烁动画
      setTimeout(() => {
        startBlinkingAnimation(resetGameItems, 1)
      }, 100)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '游戏启动失败'
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [items, quantity, allowRepeat, config, gameState.items, startBlinkingAnimation])

  // 暂停游戏
  const pauseGame = useCallback(() => {
    animationControllerRef.current?.stopBlinking()
    // 暂停时不重置颜色管理器，保持当前状态
    // 暂停音效但不完全停止
    soundManager.stopAll()
    
    setGameState(prev => ({
      ...prev,
      phase: 'paused'
    }))
  }, [])

  // 恢复游戏
  const resumeGame = useCallback(() => {
    if (gameState.phase === 'paused') {
      setGameState(prev => ({
        ...prev,
        phase: 'blinking'
      }))
      
      // 恢复闪烁动画
      setTimeout(() => {
        startBlinkingAnimation(gameState.items, gameState.currentRound)
      }, 100)
    }
  }, [gameState.phase, gameState.items, gameState.currentRound, startBlinkingAnimation])

  // 停止游戏（完全停止并选择结果）
  const stopGame = useCallback(() => {
    animationControllerRef.current?.stopBlinking()
    colorManagerRef.current?.reset()
    // 停止所有音效
    soundManager.stopAll()
  }, [])

  // 重置游戏（完全重置）
  const resetGame = useCallback(() => {
    stopGame()
    
    // 重新初始化动画控制器
    if (animationControllerRef.current) {
      animationControllerRef.current = new BlinkingAnimationController(config)
    }
    if (colorManagerRef.current) {
      colorManagerRef.current = new ColorCycleManager(config.colors)
    }
    
    // 重置游戏名称状态
    const resetGameItems = initialGameItems.map(item => ({
      ...item,
      isHighlighted: false,
      isSelected: false,
      highlightColor: config.colors[0]
    }))
    
    setGameState({
      phase: 'idle',
      items: resetGameItems, // 使用重置后的游戏名称
      currentHighlight: null,
      selectedItems: [],
      blinkingSpeed: config.initialSpeed,
      currentRound: 0,
      totalRounds: quantity,
      startTime: 0
    })
    setError(null)
  }, [stopGame, config, quantity, initialGameItems])

  // 重新开始游戏（保持配置，重置选择状态）- 用于"再抽一次"
  const restartGame = useCallback(() => {
    stopGame()
    
    // 重新初始化动画控制器
    if (animationControllerRef.current) {
      animationControllerRef.current = new BlinkingAnimationController(config)
    }
    if (colorManagerRef.current) {
      colorManagerRef.current = new ColorCycleManager(config.colors)
    }
    
    // 重置游戏名称状态但保持配置
    const resetGameItems = initialGameItems.map(item => ({
      ...item,
      isHighlighted: false,
      isSelected: false,
      highlightColor: config.colors[0]
    }))
    
    setGameState(prev => ({
      ...prev,
      phase: 'idle',
      items: resetGameItems,
      currentHighlight: null,
      selectedItems: [],
      blinkingSpeed: config.initialSpeed,
      currentRound: 0,
      startTime: 0
    }))
    setError(null)
  }, [stopGame, config, initialGameItems])

  // 游戏状态转换管理
  const transitionToPhase = useCallback((newPhase: BlinkingGameState['phase'], additionalState?: Partial<BlinkingGameState>) => {
    setGameState(prev => ({
      ...prev,
      phase: newPhase,
      ...additionalState
    }))
  }, [])

  // 处理轮次完成
  const handleRoundComplete = useCallback((selectedItem: ListItem, selectedIndex: number) => {
    setGameState(prev => {
      // 防止超过目标数量的选择
      if (prev.selectedItems.length >= prev.totalRounds) {
        console.warn('已达到目标数量，忽略额外的选择')
        return prev
      }
      
      const newSelectedItems = [...prev.selectedItems, selectedItem]
      const updatedItems = prev.items.map((item, i) => ({
        ...item,
        isSelected: i === selectedIndex ? true : item.isSelected,
        isHighlighted: false
      }))

      // 播放选中音效
      if (localSoundEnabled) {
        soundManager.play('card-reveal').catch(() => {
          // 忽略音效错误
        })
      }

      const isLastRound = newSelectedItems.length >= prev.totalRounds
      
      if (isLastRound) {
        // 所有轮次完成
        setTimeout(() => {
          transitionToPhase('finished')
          onComplete(newSelectedItems)
        }, 800)

        return {
          ...prev,
          phase: 'stopped',
          selectedItems: newSelectedItems,
          items: updatedItems,
          currentHighlight: selectedIndex
        }
      } else {
        // 准备下一轮
        const nextRound = prev.currentRound + 1
        
        setTimeout(() => {
          if (!allowRepeat) {
            // 检查是否还有可选名称
            const availableItems = updatedItems.filter(item => !item.isSelected)
            if (availableItems.length === 0) {
              // 没有更多可选名称，提前结束
              transitionToPhase('finished')
              onComplete(newSelectedItems)
              return
            }
          }
          
          // 开始下一轮
          transitionToPhase('blinking', { 
            currentRound: nextRound,
            items: updatedItems,
            currentHighlight: null
          })
          
          // 延迟启动下一轮动画
          setTimeout(() => {
            startBlinkingAnimation(updatedItems, nextRound)
          }, 200)
        }, 1200)

        return {
          ...prev,
          phase: 'stopped',
          selectedItems: newSelectedItems,
          items: updatedItems,
          currentHighlight: selectedIndex,
          currentRound: nextRound
        }
      }
    })
  }, [localSoundEnabled, allowRepeat, onComplete, transitionToPhase, startBlinkingAnimation])

  // 进度跟踪
  const getProgress = useCallback(() => {
    if (gameState.totalRounds === 0) return 0
    return (gameState.selectedItems.length / gameState.totalRounds) * 100
  }, [gameState.selectedItems.length, gameState.totalRounds])

  // 获取剩余轮次
  const getRemainingRounds = useCallback(() => {
    return Math.max(0, gameState.totalRounds - gameState.selectedItems.length)
  }, [gameState.totalRounds, gameState.selectedItems.length])

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 防止在输入框中触发
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (gameState.phase === 'idle') {
            startGame()
          } else if (gameState.phase === 'blinking' || gameState.phase === 'slowing') {
            pauseGame()
          } else if (gameState.phase === 'paused') {
            resumeGame()
          }
          break

        case 'Enter':
          if (gameState.phase === 'stopped' && getRemainingRounds() > 0) {
            event.preventDefault()
            const nextRound = gameState.currentRound + 1
            transitionToPhase('blinking', { currentRound: nextRound })
            setTimeout(() => {
              startBlinkingAnimation(gameState.items, nextRound)
            }, 200)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameState.phase, startGame, stopGame, resetGame, getRemainingRounds, transitionToPhase, startBlinkingAnimation])

  // 渲染游戏状态
  const renderGameStatus = () => {
    switch (gameState.phase) {
      case 'blinking':
        return <div className="text-lg font-medium text-blue-600">{t('drawingComponents.blinkingNamePicker.blinkingStatus')}</div>
      case 'slowing':
        return <div className="text-lg font-medium text-orange-600">{t('drawingComponents.blinkingNamePicker.slowingStatus')}</div>
      case 'stopped':
        return <div className="text-lg font-medium text-green-600">{t('drawingComponents.blinkingNamePicker.stoppedStatus')}</div>
      case 'finished':
        return <div className="text-lg font-medium text-purple-600">{t('drawingComponents.blinkingNamePicker.finishedStatus')}</div>
      default:
        return <div className="text-lg font-medium text-gray-600">{t('drawingComponents.blinkingNamePicker.readyStatus')}</div>
    }
  }

  // 错误状态显示
  if (error) {
    const getErrorSolution = (errorMessage: string) => {
      if (errorMessage.includes('名称列表为空')) {
        return {
          solution: '请返回配置页面添加参与者',
          action: '返回配置',
          actionFn: () => window.history.back()
        }
      }
      if (errorMessage.includes('抽取数量必须大于0')) {
        return {
          solution: '请设置正确的抽取数量',
          action: '返回配置',
          actionFn: () => window.history.back()
        }
      }
      if (errorMessage.includes('不允许重复时，抽取数量不能超过名称总数')) {
        return {
          solution: '请减少抽取数量或允许重复抽取',
          action: '返回配置',
          actionFn: () => window.history.back()
        }
      }
      return {
        solution: t('drawingComponents.blinkingNamePicker.checkConfigRetry'),
        action: t('drawingComponents.blinkingNamePicker.restart'),
        actionFn: () => {
          setError(null)
          resetGame()
        }
      }
    }

    const errorInfo = getErrorSolution(error)

    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mb-3">
            遇到问题了
          </div>
          <div className="text-red-600 mb-4 text-lg">
            {error}
          </div>
          <div className="text-gray-600 mb-6 text-sm bg-gray-50 p-3 rounded-lg">
            💡 解决方案：{errorInfo.solution}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={errorInfo.actionFn}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {errorInfo.action}
            </button>
            <button
              onClick={() => setError(null)}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
            >
              忽略错误
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 空名称列表
  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📝</span>
          </div>
          <div className="text-2xl font-bold text-gray-700 mb-3">
            还没有参与者
          </div>
          <div className="text-gray-500 mb-6 text-lg">
            {t('drawingComponents.blinkingNamePicker.emptyListMessage')}
          </div>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="text-sm text-blue-700">
              {t('drawingComponents.blinkingNamePicker.emptyListTip')}
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
          >
            返回配置页面
          </button>
        </div>
      </div>
    )
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-pulse">⚡</span>
            </div>
          </div>
          <div className="text-xl font-medium text-blue-600 mb-2">
            {t('drawingComponents.blinkingNamePicker.preparingGame')}
          </div>
          <div className="text-sm text-gray-500">
            {t('drawingComponents.blinkingNamePicker.aboutToStart')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn("flex flex-col", className)}
      role="application"
      aria-label="闪烁点名游戏"
      aria-describedby="game-instructions"
    >
      {/* 隐藏的游戏说明，供屏幕阅读器使用 */}
      <div id="game-instructions" className="sr-only">
        {t('drawingComponents.blinkingNamePicker.gameInstructions')}
      </div>

      {/* 游戏状态公告，供屏幕阅读器使用 */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {gameState.phase === 'blinking' && t('drawingComponents.blinkingNamePicker.blinkingInProgress')}
        {gameState.phase === 'slowing' && t('drawingComponents.blinkingNamePicker.aboutToStop')}
        {gameState.phase === 'stopped' && t('drawingComponents.blinkingNamePicker.selectionComplete', { name: gameState.selectedItems[gameState.selectedItems.length - 1]?.name })}
        {gameState.phase === 'finished' && t('drawingComponents.blinkingNamePicker.gameComplete', { count: gameState.selectedItems.length })}
      </div>

      {/* 控制面板 */}
      <BlinkingControlPanel
        gameState={gameState}
        config={config}
        soundEnabled={localSoundEnabled}
        onStart={startGame}
        onStop={pauseGame}
        onResume={resumeGame}
        onReset={resetGame}
        onContinue={() => {
          const nextRound = gameState.currentRound + 1
          transitionToPhase('blinking', { currentRound: nextRound })
          setTimeout(() => {
            startBlinkingAnimation(gameState.items, nextRound)
          }, 200)
        }}
        onSoundToggle={(enabled) => {
          setLocalSoundEnabled(enabled)
          soundManager.setEnabled(enabled)
        }}
        onConfigChange={(newConfig) => {
          setConfig(prev => ({ ...prev, ...newConfig }))
        }}
        className="mb-4"
      />

      {/* 闪烁显示区域 */}
      <BlinkingDisplay
        items={gameState.items}
        currentHighlight={gameState.currentHighlight}
        config={config}
        className="flex-1"
      />

      {/* 结果显示 */}
      {gameState.selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              <span>🎉</span>
              {t('drawingComponents.blinkingNamePicker.selectedNames', { count: gameState.selectedItems.length })}
            </h3>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {/* 复制结果 */}
              <button
                onClick={() => {
                  const text = gameState.selectedItems.map(item => item.name).join(', ')
                  navigator.clipboard.writeText(text).then(() => {
                    // 可以添加一个toast提示
                    console.log('结果已复制到剪贴板')
                  }).catch(() => {
                    console.error('复制失败')
                  })
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="复制结果"
              >
                📋 复制
              </button>
              
              {/* 分享结果 */}
              <button
                onClick={() => {
                  const text = `闪烁点名结果：${gameState.selectedItems.map(item => item.name).join(', ')}`
                  if (navigator.share) {
                    navigator.share({
                      title: '闪烁点名结果',
                      text: text
                    }).catch(() => {
                      // 降级到复制
                      navigator.clipboard.writeText(text)
                    })
                  } else {
                    navigator.clipboard.writeText(text)
                  }
                }}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                title="分享结果"
              >
                📤 分享
              </button>
            </div>
          </div>
          
          {/* 结果列表 */}
          <div className="space-y-2">
            {gameState.selectedItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-green-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                </div>
                
                {/* 选中时间戳或轮次信息 */}
                <div className="text-xs text-gray-500">
                  {t('drawingComponents.blinkingNamePicker.roundSelected', { round: index + 1 })}
                </div>
              </div>
            ))}
          </div>

          {/* 统计信息 */}
          {gameState.phase === 'finished' && (
            <div className="mt-4 pt-3 border-t border-green-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{gameState.selectedItems.length}</div>
                  <div className="text-xs text-gray-500">{t('drawingComponents.blinkingNamePicker.selectedCount')}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{gameState.totalRounds}</div>
                  <div className="text-xs text-gray-500">总轮次</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{items.length}</div>
                  <div className="text-xs text-gray-500">候选名称</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((Date.now() - gameState.startTime) / 1000)}s
                  </div>
                  <div className="text-xs text-gray-500">用时</div>
                </div>
              </div>
            </div>
          )}

          {/* 继续抽取提示 */}
          {gameState.phase === 'stopped' && getRemainingRounds() > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  还需要选择 {getRemainingRounds()} 个名称
                </div>
                <button
                  onClick={() => {
                    const nextRound = gameState.currentRound + 1
                    transitionToPhase('blinking', { currentRound: nextRound })
                    setTimeout(() => {
                      startBlinkingAnimation(gameState.items, nextRound)
                    }, 200)
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  继续选择
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}