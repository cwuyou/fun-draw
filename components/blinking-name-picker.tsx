'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react'
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
  soundEnabled,
  className,
  autoStart = false
}: BlinkingNamePickerProps) {
  const [gameState, setGameState] = useState<BlinkingGameState>({
    phase: 'idle',
    items: [],
    currentHighlight: null,
    selectedItems: [],
    blinkingSpeed: DEFAULT_BLINKING_CONFIG.initialSpeed,
    currentRound: 0,
    totalRounds: quantity,
    startTime: 0
  })

  const [config, setConfig] = useState<BlinkingConfig>(DEFAULT_BLINKING_CONFIG)
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled)
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

  // 初始化游戏项目
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

  // 选择随机项目
  const selectRandomItem = useCallback((
    availableItems: BlinkingItem[], 
    excludeIndices: Set<number> = new Set()
  ): number => {
    const availableIndices = availableItems
      .map((_, index) => index)
      .filter(index => !excludeIndices.has(index))
    
    if (availableIndices.length === 0) {
      throw new Error('没有可选择的项目')
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

    // 播放开始音效
    if (soundEnabled) {
      soundManager.play('card-shuffle').catch(() => {
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
        if (soundEnabled) {
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
            const newSelectedItems = [...prev.selectedItems, selectedItem]
            const updatedItems = prev.items.map((item, i) => ({
              ...item,
              isSelected: i === selectedIndex ? true : item.isSelected,
              isHighlighted: false
            }))

            // 播放选中音效
            if (soundEnabled) {
              soundManager.play('select').catch(() => {
                // 忽略音效错误
              })
            }

            // 检查是否需要继续下一轮
            if (roundNumber < quantity) {
              // 延迟开始下一轮
              setTimeout(() => {
                if (!allowRepeat) {
                  // 从可用项目中移除已选中的项目
                  const availableItems = updatedItems.filter(item => !item.isSelected)
                  if (availableItems.length > 0) {
                    startBlinkingAnimation(updatedItems, roundNumber + 1)
                  } else {
                    // 没有更多可选项目，结束游戏
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
                // 播放完成音效
                if (soundEnabled) {
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
  }, [config, soundEnabled, quantity, allowRepeat, onComplete])

  // 开始游戏
  const startGame = useCallback(() => {
    try {
      setError(null)
      
      if (items.length === 0) {
        setError('项目列表为空，无法开始游戏')
        return
      }

      if (quantity <= 0) {
        setError('抽取数量必须大于0')
        return
      }

      if (!allowRepeat && quantity > items.length) {
        setError('不允许重复时，抽取数量不能超过项目总数')
        return
      }

      setIsLoading(true)

      const gameItems = initializeGameItems(items)
      
      setGameState({
        phase: 'blinking',
        items: gameItems,
        currentHighlight: null,
        selectedItems: [],
        blinkingSpeed: config.initialSpeed,
        currentRound: 1,
        totalRounds: quantity,
        startTime: Date.now()
      })

      setIsLoading(false)

      // 开始第一轮闪烁动画
      setTimeout(() => {
        startBlinkingAnimation(gameItems, 1)
      }, 100)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '游戏启动失败'
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [items, quantity, allowRepeat, config, initializeGameItems, startBlinkingAnimation])

  // 停止游戏
  const stopGame = useCallback(() => {
    animationControllerRef.current?.stopBlinking()
    colorManagerRef.current?.reset()
  }, [])

  // 重置游戏
  const resetGame = useCallback(() => {
    stopGame()
    setGameState({
      phase: 'idle',
      items: [],
      currentHighlight: null,
      selectedItems: [],
      blinkingSpeed: config.initialSpeed,
      currentRound: 0,
      totalRounds: quantity,
      startTime: 0
    })
    setError(null)
  }, [stopGame, config.initialSpeed, quantity])

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
      const newSelectedItems = [...prev.selectedItems, selectedItem]
      const updatedItems = prev.items.map((item, i) => ({
        ...item,
        isSelected: i === selectedIndex ? true : item.isSelected,
        isHighlighted: false
      }))

      // 播放选中音效
      if (soundEnabled) {
        soundManager.play('card-reveal').catch(() => {
          // 忽略音效错误
        })
      }

      const isLastRound = prev.currentRound >= prev.totalRounds
      
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
            // 检查是否还有可选项目
            const availableItems = updatedItems.filter(item => !item.isSelected)
            if (availableItems.length === 0) {
              // 没有更多可选项目，提前结束
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
  }, [soundEnabled, allowRepeat, onComplete, transitionToPhase, startBlinkingAnimation])

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
            stopGame()
          }
          break
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            resetGame()
          }
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setLocalSoundEnabled(prev => !prev)
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
        return <div className="text-lg font-medium text-blue-600">正在闪烁选择中...</div>
      case 'slowing':
        return <div className="text-lg font-medium text-orange-600">即将停止...</div>
      case 'stopped':
        return <div className="text-lg font-medium text-green-600">选择完成！</div>
      case 'finished':
        return <div className="text-lg font-medium text-purple-600">全部完成！</div>
      default:
        return <div className="text-lg font-medium text-gray-600">准备开始</div>
    }
  }

  // 错误状态显示
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-xl font-semibold text-red-700 mb-2">
            游戏出错了
          </div>
          <div className="text-red-600 mb-4">
            {error}
          </div>
          <button
            onClick={() => {
              setError(null)
              startGame()
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>
    )
  }

  // 空项目列表
  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">
            项目列表为空
          </div>
          <div className="text-gray-500">
            请添加至少 1 个项目进行抽奖
          </div>
        </div>
      </div>
    )
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-blue-600">
            正在准备游戏...
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
        闪烁点名游戏。使用空格键开始或停止游戏，使用回车键继续下一轮，使用Ctrl+R重置游戏。
      </div>

      {/* 游戏状态公告，供屏幕阅读器使用 */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {gameState.phase === 'blinking' && '正在闪烁选择中'}
        {gameState.phase === 'slowing' && '即将停止'}
        {gameState.phase === 'stopped' && `选择完成，选中了 ${gameState.selectedItems[gameState.selectedItems.length - 1]?.name}`}
        {gameState.phase === 'finished' && `游戏完成，共选中 ${gameState.selectedItems.length} 个项目`}
      </div>

      {/* 控制面板 */}
      <BlinkingControlPanel
        gameState={gameState}
        config={config}
        soundEnabled={localSoundEnabled}
        onStart={startGame}
        onStop={stopGame}
        onReset={resetGame}
        onContinue={() => {
          const nextRound = gameState.currentRound + 1
          transitionToPhase('blinking', { currentRound: nextRound })
          setTimeout(() => {
            startBlinkingAnimation(gameState.items, nextRound)
          }, 200)
        }}
        onSoundToggle={setLocalSoundEnabled}
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
              已选中项目 ({gameState.selectedItems.length})
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
                  第 {index + 1} 轮选中
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
                  <div className="text-xs text-gray-500">选中项目</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{gameState.totalRounds}</div>
                  <div className="text-xs text-gray-500">总轮次</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{items.length}</div>
                  <div className="text-xs text-gray-500">候选项目</div>
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
                  还需要选择 {getRemainingRounds()} 个项目
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