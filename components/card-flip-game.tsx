'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { PlayingCard } from './playing-card'
import { CardDeck } from './card-deck'
import { CardPositionDebugOverlay, DebugToggleButton } from './card-position-debug-overlay'
import { soundManager } from '@/lib/sound-manager'
import { useAnimationPerformance } from '@/lib/animation-performance'
import { 
  validateCompleteGameSetup, 
  validateGameConfig, 
  validatePositionCalculation,
  ValidationResult,
  QuantityValidationError,
  PositionCalculationError
} from '@/lib/card-game-validation'
import { 
  calculateLayout,
  getLayoutDebugInfo,
  createFallbackLayout,
  isValidContainerDimension,
  calculateEnhancedCardLayout,
  calculateMultiRowCardPositions,
  detectDeviceType,
  type EnhancedLayoutResult,
  type EnhancedCardPosition
} from '@/lib/layout-manager'
import {
  getSafeCardPosition,
  createSingleFallbackPosition,
  normalizePositionArray,
  validatePositionArray,
  isValidDimension
} from '@/lib/position-validation'
import {
  calculateFixedCardLayout,
  calculateSimpleCardSpace,
  validateLayout,
  createEmergencyLayout,
  type CardLayoutResult,
  type SimpleCardSpace
} from '@/lib/fixed-card-positioning'
// 移除了复杂的性能管理器，使用简化的resize处理
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'
import { ListItem, GameCard, CardStyle, CardGamePhase, CardFlipGameState } from '@/types'
import { cn } from '@/lib/utils'

// 优化的游戏信息显示接口
interface OptimizedGameInfo {
  essential: {
    drawQuantity: number      // Keep - shows what user requested
    totalItems: number        // Keep - shows available pool size
    currentPhase: CardGamePhase   // Keep - shows current game state
  }
  
  optional: {
    remainingCards?: number   // Remove - not essential during gameplay
    wonCount?: number         // Simplify - only show after completion
    notWonCount?: number      // Remove - can be calculated
  }
  
  displayMode: 'minimal' | 'detailed'
}

// 条件显示逻辑
function shouldShowRemainingCards(gamePhase: CardGamePhase, cardCount: number): boolean {
  // 只在特定阶段和有价值时显示
  return gamePhase === 'finished' && cardCount > 6
}

function getOptimizedGameInfoDisplay(
  gameState: CardFlipGameState,
  quantity: number,
  itemsLength: number,
  deviceType: 'mobile' | 'tablet' | 'desktop'
): OptimizedGameInfo {
  const isMinimalMode = deviceType === 'mobile' || gameState.gamePhase === 'waiting'
  
  return {
    essential: {
      drawQuantity: quantity,
      totalItems: itemsLength,
      currentPhase: gameState.gamePhase
    },
    optional: {
      remainingCards: shouldShowRemainingCards(gameState.gamePhase, gameState.cards.length) 
        ? gameState.cards.length - gameState.revealedCards.size 
        : undefined
    },
    displayMode: isMinimalMode ? 'minimal' : 'detailed'
  }
}

interface CardFlipGameProps {
  items: ListItem[]
  quantity: number
  allowRepeat: boolean
  onComplete: (winners: ListItem[]) => void
  soundEnabled: boolean
  className?: string
  autoStart?: boolean // 新增：控制是否自动开始
}

// 默认卡牌样式
const DEFAULT_CARD_STYLE: CardStyle = {
  id: 'classic',
  name: 'Classic Blue', // 这个name字段现在不会被直接使用，而是通过翻译键
  backDesign: 'bg-gradient-to-br from-blue-600 to-blue-800',
  frontTemplate: 'bg-white border-2 border-blue-300',
  colors: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#3b82f6'
  }
}

export function CardFlipGame({
  items,
  quantity,
  allowRepeat,
  onComplete,
  soundEnabled,
  className,
  autoStart = false
}: CardFlipGameProps) {
  const { t } = useTranslation()
  const [gameState, setGameState] = useState<CardFlipGameState>({
    gamePhase: 'idle',
    cards: [],
    revealedCards: new Set(),
    winners: []
  })
  
  const [dealtCards, setDealtCards] = useState(0) // 跟踪已发牌数量
  
  const [cardStyle] = useState<CardStyle>(DEFAULT_CARD_STYLE)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [debugVisible, setDebugVisible] = useState(false)
  const dealTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dealIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationCleanupRef = useRef<(() => void)[]>([])

  // 使用动画性能管理器
  const {
    getOptimizedDuration,
    registerAnimation,
    unregisterAnimation
  } = useAnimationPerformance()

  // 游戏配置（根据设备性能优化）
  const gameConfig = {
    maxCards: 10,
    shuffleDuration: getOptimizedDuration(3000), // 增加洗牌时间
    dealInterval: getOptimizedDuration(300), // 发牌间隔 - 300ms between each card
    cardAppearDuration: getOptimizedDuration(400), // 每张卡片出现动画时长 - 400ms for each card to appear
    flipDuration: getOptimizedDuration(600)
  }

  // 确保发牌数量在合理范围内，但尊重用户配置的数量
  const actualQuantity = Math.max(1, Math.min(gameConfig.maxCards, quantity))

  // 使用动态间距系统
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  
  const dynamicSpacing = useDynamicSpacing({
    containerWidth,
    containerHeight,
    uiElements: {
      hasGameInfo: true,
      hasWarnings: warnings.length > 0,
      hasStartButton: gameState.gamePhase === 'idle',
      hasResultDisplay: gameState.gamePhase === 'finished',
      cardAreaMinHeight: 300
    },
    enableValidation: process.env.NODE_ENV === 'development',
    enableDebug: process.env.NODE_ENV === 'development'
  })

  // 修复的卡牌布局位置计算（使用简化且可靠的系统，带性能优化）
  const calculateCardPositions = useCallback((totalCards: number) => {
    try {
      // 获取容器尺寸
      const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
      const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 768
      
      // 使用修复的卡牌布局计算系统
      const layoutResult = calculateFixedCardLayout(totalCards, containerWidth, containerHeight)
      
      // 验证布局是否合理
      const space = calculateSimpleCardSpace(containerWidth, containerHeight)
      const isValid = validateLayout(layoutResult, space)
      
      if (!isValid) {
        console.warn('Layout validation failed, using emergency layout')
        // 如果布局不合理，使用紧急布局
        const emergencyLayout = createEmergencyLayout(totalCards, space)
        return emergencyLayout.positions
      }
      
      // 输出调试信息
      if (process.env.NODE_ENV === 'development') {
        console.group('🎯 Fixed Card Position Calculation')
        console.log('Container:', `${containerWidth}x${containerHeight}`)
        console.log('Card Count:', totalCards)
        console.log('Layout:', `${layoutResult.layoutInfo.rows}x${layoutResult.layoutInfo.cardsPerRow}`)
        console.log('Card Size:', layoutResult.actualCardSize)
        console.log('Grid Size:', `${layoutResult.layoutInfo.totalWidth}x${layoutResult.layoutInfo.totalHeight}`)
        console.log('Positions:', layoutResult.positions.length)
        console.groupEnd()
      }
      
      return layoutResult.positions
      
    } catch (error) {
      console.error('Error in card position calculation:', error)
      return createEmergencyLayoutFallback(totalCards, containerWidth, containerHeight)
    }
  }, [warnings.length, gameState.gamePhase])

  // 紧急布局函数 - 当主要布局系统失败时使用
  const createEmergencyLayoutFallback = useCallback((cardCount: number, containerWidth: number, containerHeight: number): CardPosition[] => {
    const space = calculateSimpleCardSpace(containerWidth, containerHeight)
    const emergencyLayout = createEmergencyLayout(cardCount, space)
    return emergencyLayout.positions
  }, [])

  // 选择中奖者
  const selectWinners = useCallback((items: ListItem[], quantity: number, allowRepeat: boolean): ListItem[] => {
    try {
      // 增强的输入验证
      if (!Array.isArray(items)) {
        throw new Error(t('cardFlip.invalidArrayFormat'))
      }
      
      if (items.length === 0) {
        throw new Error(t('cardFlip.emptyList'))
      }
      
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(t('cardFlip.invalidQuantity'))
      }
      
      if (quantity > gameConfig.maxCards) {
        throw new Error(t('cardFlip.quantityTooLarge', { max: gameConfig.maxCards }))
      }
      
      if (!allowRepeat && quantity > items.length) {
        throw new Error(t('cardFlip.quantityExceedsItems'))
      }

      // 验证名称格式
      const invalidItems = items.filter(item => 
        !item || 
        typeof item.name !== 'string' || 
        item.name.trim().length === 0
      )
      
      if (invalidItems.length > 0) {
        throw new Error(t('cardFlip.invalidNames', { count: invalidItems.length }))
      }
      
      const winners: ListItem[] = []
      const availableItems = [...items]
      
      // 添加随机种子以确保真正的随机性
      const shuffleArray = (array: ListItem[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]]
        }
        return array
      }
      
      // 预先打乱数组以提高随机性
      shuffleArray(availableItems)
      
      for (let i = 0; i < quantity; i++) {
        if (availableItems.length === 0) {
          console.warn(t('cardFlip.fewerWinnersThanExpected', { actual: i, expected: quantity }))
          break
        }
        
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        const winner = availableItems[randomIndex]
        
        if (!winner) {
          console.error(`选择中奖者时遇到空名称，索引: ${randomIndex}`)
          continue
        }
        
        winners.push(winner)
        
        if (!allowRepeat) {
          availableItems.splice(randomIndex, 1)
        }
      }
      
      if (winners.length === 0) {
        throw new Error(t('cardFlip.noWinnersSelected'))
      }
      
      if (winners.length < quantity) {
        console.warn(`实际选择了${winners.length}个中奖者，少于配置的${quantity}个`)
      }
      
      return winners
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '选择中奖者时发生未知错误'
      setError(`选择中奖者失败: ${errorMessage}`)
      console.error('Select winners error:', err)
      return []
    }
  }, [gameConfig.maxCards])

  // 创建游戏卡牌
  const createGameCards = useCallback((winners: ListItem[], totalCards: number): GameCard[] => {
    const cards: GameCard[] = []
    
    // 计算卡牌布局位置
    const positions = calculateCardPositions(totalCards)
    
    // 创建中奖者索引（随机分布）
    const winnerIndices = new Set<number>()
    while (winnerIndices.size < winners.length && winnerIndices.size < totalCards) {
      winnerIndices.add(Math.floor(Math.random() * totalCards))
    }
    
    const winnerArray = Array.from(winnerIndices)
    
    for (let i = 0; i < totalCards; i++) {
      const winnerIndex = winnerArray.indexOf(i)
      cards.push({
        id: `game-card-${i}`,
        content: winnerIndex >= 0 ? winners[winnerIndex] : null,
        position: positions[i],
        isWinner: winnerIndex >= 0
      })
    }
    
    return cards
  }, [calculateCardPositions])

  // 开始游戏
  const startGame = useCallback(() => {
    try {
      // 清除之前的错误状态
      setError(null)
      setWarnings([])
      
      // 预先验证游戏状态
      if (gameState.gamePhase !== 'idle' && gameState.gamePhase !== 'finished') {
        console.warn(t('cardFlip.gameInProgress'))
        return
      }

      // 验证必要的游戏参数
      if (!items || items.length === 0) {
        setError(t('cardFlip.cannotStartGame'))
        return
      }

      if (actualQuantity <= 0) {
        setError(t('cardFlip.invalidQuantity'))
        return
      }

      // 验证不允许重复时的名称数量
      if (!allowRepeat && quantity > items.length) {
        setError(t('cardFlip.quantityExceedsItems'))
        return
      }

      setIsLoading(true)
      
      // 清理之前的状态
      if (dealTimeoutRef.current) {
        clearTimeout(dealTimeoutRef.current)
        dealTimeoutRef.current = null
      }
      if (dealIntervalRef.current) {
        clearInterval(dealIntervalRef.current)
        dealIntervalRef.current = null
      }

      setGameState(prev => ({
        ...prev,
        gamePhase: 'shuffling',
        cards: [],
        revealedCards: new Set(),
        winners: []
      }))
      
      setDealtCards(0)
      
      // 播放洗牌音效
      if (soundEnabled) {
        soundManager.play('card-shuffle').catch((audioError) => {
          console.warn('洗牌音效播放失败:', audioError)
          // 音效失败不应该阻止游戏继续
        })
      }
      
      setIsLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '游戏启动时发生未知错误'
      setError(`游戏启动失败: ${errorMessage}`)
      console.error('Game start error:', err)
      setIsLoading(false)
      
      // 重置游戏状态到安全状态
      setGameState({
        gamePhase: 'idle',
        cards: [],
        revealedCards: new Set(),
        winners: []
      })
    }
  }, [soundEnabled, items, actualQuantity, gameState.gamePhase])

  // Enhanced dealing animation system with pre-calculated positions
  const dealCardsWithAnimation = useCallback(async (gameCards: GameCard[]) => {
    try {
      setGameState(prev => ({ ...prev, gamePhase: 'dealing' }))
      setDealtCards(0)
      
      // 在动画开始前预计算所有最终位置
      const finalPositions = gameCards.map(card => ({
        x: card.position.x,
        y: card.position.y,
        rotation: card.position.rotation,
        cardWidth: card.position.cardWidth,
        cardHeight: card.position.cardHeight
      }))
      
      // 定义统一的动画起始位置（从卡牌堆位置开始）
      const startingPosition = {
        x: 0, // 中心位置
        y: -150, // 从上方开始
        rotation: 0,
        scale: 0.8
      }
      
      // Initialize all cards with pre-calculated final positions but invisible
      setGameState(prev => ({
        ...prev,
        cards: gameCards.map((card, index) => ({
          ...card,
          // 确保position对象包含最终位置信息
          position: finalPositions[index],
          style: {
            opacity: 0,
            // 使用统一的起始位置，避免位置跳跃
            transform: `translate(${startingPosition.x}px, ${startingPosition.y}px) scale(${startingPosition.scale}) rotateX(90deg) rotate(${startingPosition.rotation}deg)`,
            transition: 'none', // 初始化时不使用过渡
            zIndex: 1000 + index, // 确保发牌顺序的层级
            position: 'absolute' as const,
            left: '50%',
            top: '50%',
            marginLeft: `-${finalPositions[index].cardWidth / 2}px`,
            marginTop: `-${finalPositions[index].cardHeight / 2}px`,
            width: `${finalPositions[index].cardWidth}px`,
            height: `${finalPositions[index].cardHeight}px`
          }
        }))
      }))
      
      // 短暂延迟确保DOM更新完成
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Deal cards one by one with staggered timing
      for (let i = 0; i < gameCards.length; i++) {
        // Wait for the interval before dealing next card
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, gameConfig.dealInterval))
        }
        
        // Play dealing sound effect for each card
        if (soundEnabled) {
          soundManager.play('card-deal').catch(() => {
            // Ignore audio errors
          })
        }
        
        // Animate current card to its final position
        setGameState(prev => ({
          ...prev,
          cards: prev.cards.map((card, index) => 
            index === i 
              ? {
                  ...card,
                  style: {
                    ...card.style,
                    opacity: 1,
                    // 动画到预计算的最终位置，确保位置保持稳定
                    transform: `translate(${finalPositions[i].x}px, ${finalPositions[i].y}px) scale(1) rotateX(0deg) rotate(${finalPositions[i].rotation}deg)`,
                    transition: `all ${gameConfig.cardAppearDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`, // 使用更平滑的缓动函数
                    zIndex: Math.min(50, gameCards.length - i) // 限制z-index最大值，防止遮挡UI
                  }
                }
              : card
          )
        }))
        
        // Update dealt cards counter
        setDealtCards(i + 1)
      }
      
      // Wait for last card animation to complete, then transition to waiting phase
      setTimeout(() => {
        // 移除内联样式，让CSS接管，确保位置一致性
        setGameState(prev => ({
          ...prev,
          gamePhase: 'waiting',
          cards: prev.cards.map(card => ({
            ...card,
            style: {
              // 保留关键的位置信息，确保动画结束后位置不变
              position: 'absolute' as const,
              left: '50%',
              top: '50%',
              marginLeft: `-${card.position.cardWidth / 2}px`,
              marginTop: `-${card.position.cardHeight / 2}px`,
              width: `${card.position.cardWidth}px`,
              height: `${card.position.cardHeight}px`,
              transform: `translate(${card.position.x}px, ${card.position.y}px) rotate(${card.position.rotation}deg)`,
              transition: 'transform 0.3s ease-out, opacity 0.2s ease-out', // 保留平滑的交互过渡
              zIndex: 10
            }
          }))
        }))
      }, gameConfig.cardAppearDuration + 100) // 减少延迟，提高响应性
      
    } catch (err) {
      setError('发牌失败，请重试')
      console.error('Deal cards error:', err)
    }
  }, [soundEnabled, gameConfig.dealInterval, gameConfig.cardAppearDuration])

  // 洗牌完成，开始发牌
  const handleShuffleComplete = useCallback(() => {
    // 延迟一点开始发牌动画，让洗牌动画完全结束
    dealTimeoutRef.current = setTimeout(async () => {
      try {
        // 准备卡牌数据
        const winners = selectWinners(items, actualQuantity, allowRepeat)
        const gameCards = createGameCards(winners, actualQuantity)
        
        // 设置基础游戏状态
        setGameState(prev => ({
          ...prev,
          winners
        }))

        // 开始发牌动画
        await dealCardsWithAnimation(gameCards)
        
      } catch (err) {
        setError('发牌失败，请重试')
        console.error('Deal cards error:', err)
      }
    }, 300) // Reduced delay for smoother transition
  }, [items, actualQuantity, allowRepeat, selectWinners, createGameCards, dealCardsWithAnimation])

  // 处理卡牌翻转
  const handleCardFlip = useCallback((cardId: string) => {
    if (gameState.gamePhase !== 'waiting') return
    
    const card = gameState.cards.find(c => c.id === cardId)
    if (!card || gameState.revealedCards.has(cardId)) return
    
    // 播放翻牌音效
    if (soundEnabled) {
      soundManager.play('card-flip').catch(() => {
        // 忽略播放错误
      })
    }
    
    // 计算新的已翻开卡牌集合
    const newRevealedCards = new Set([...gameState.revealedCards, cardId])
    
    // 更新已翻开的卡牌
    setGameState(prev => ({
      ...prev,
      gamePhase: 'revealing',
      revealedCards: newRevealedCards
    }))
    
    // 翻牌动画完成后的处理
    setTimeout(() => {
      // 播放揭晓音效
      if (soundEnabled && card.isWinner) {
        soundManager.play('card-reveal').catch(() => {
          // 忽略播放错误
        })
      }
      
      // 检查是否所有卡牌都已翻开
      if (newRevealedCards.size === gameState.cards.length) {
        // 游戏结束 - 直接调用完成回调，不显示卡牌下方结果
        setGameState(prev => ({ ...prev, gamePhase: 'finished' }))
        // 立即调用完成回调，让对话框成为唯一的结果展示
        setTimeout(() => {
          onComplete(gameState.winners)
        }, 300) // 缩短延迟，快速显示对话框
      } else {
        // 继续等待翻牌
        setGameState(prev => ({ ...prev, gamePhase: 'waiting' }))
      }
    }, gameConfig.flipDuration)
  }, [gameState, soundEnabled, onComplete, gameConfig.flipDuration])

  // 监听窗口大小变化，实现平滑的位置重新计算和调整（使用增强的边界感知系统）
  useEffect(() => {
    // 创建简化的防抖resize处理函数
    let resizeTimeout: NodeJS.Timeout
    const debouncedResizeHandler = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        // 只有在有卡牌需要重新定位时才进行处理
        if (!gameState.cards || gameState.cards.length === 0) {
          console.log('No cards to reposition during resize')
          return
        }

        try {
          // 获取当前容器尺寸
          const containerWidth = window.innerWidth
          const containerHeight = window.innerHeight
          
          console.log(`Resize detected: ${containerWidth}x${containerHeight}`)
          
          // 验证容器尺寸
          if (!isValidDimension(containerWidth, containerHeight)) {
            console.warn(`Invalid container dimensions during resize: ${containerWidth}x${containerHeight}`)
            return
          }
          
          // 移除了复杂的UI状态计算，使用简化的空间计算
          
          // 使用修复的布局系统重新计算位置
          let newPositions
          try {
            const layoutResult = calculateFixedCardLayout(gameState.cards.length, containerWidth, containerHeight)
            const space = calculateSimpleCardSpace(containerWidth, containerHeight)
            const isValid = validateLayout(layoutResult, space)
            
            if (isValid) {
              newPositions = layoutResult.positions
            } else {
              console.warn('Layout validation failed during resize, using emergency layout')
              const emergencyLayout = createEmergencyLayout(gameState.cards.length, space)
              newPositions = emergencyLayout.positions
            }
          } catch (positionError) {
            console.error('Position calculation failed during resize:', positionError)
            const space = calculateSimpleCardSpace(containerWidth, containerHeight)
            const emergencyLayout = createEmergencyLayout(gameState.cards.length, space)
            newPositions = emergencyLayout.positions
          }
          
          // 验证位置数组完整性
          if (newPositions.length !== gameState.cards.length) {
            console.error(`Position array length mismatch during resize: expected ${gameState.cards.length}, got ${newPositions.length}`)
            const space = calculateSimpleCardSpace(containerWidth, containerHeight)
            const emergencyLayout = createEmergencyLayout(gameState.cards.length, space)
            newPositions = emergencyLayout.positions
          }
          
          // 安全地应用新位置
          setGameState(prev => ({
            ...prev,
            cards: prev.cards.map((card, index) => {
              const newPosition = newPositions[index]
              
              // 确保位置有效
              if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number') {
                console.error(`Invalid position for card ${index} during resize:`, newPosition)
                // 使用紧急降级位置
                return {
                  ...card,
                  position: {
                    x: 0,
                    y: index * 20 - (prev.cards.length - 1) * 10,
                    rotation: 0,
                    cardWidth: 96,
                    cardHeight: 144
                  },
                  style: {
                    ...card.style,
                    transform: `translate(0px, ${index * 20 - (prev.cards.length - 1) * 10}px) rotate(0deg)`,
                    width: '96px',
                    height: '144px',
                    marginLeft: '-48px',
                    marginTop: '-72px',
                    transition: 'transform 0.3s ease-out'
                  }
                }
              }
              
              return {
                ...card,
                position: newPosition,
                style: {
                  ...card.style,
                  // 确保动画过程中的位置准确性
                  transform: `translate(${newPosition.x}px, ${newPosition.y}px) rotate(${newPosition.rotation}deg)`,
                  width: `${newPosition.cardWidth}px`,
                  height: `${newPosition.cardHeight}px`,
                  marginLeft: `-${newPosition.cardWidth / 2}px`,
                  marginTop: `-${newPosition.cardHeight / 2}px`,
                  transition: 'transform 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out, margin 0.3s ease-out'
                }
              }
            })
          }))
          
          // 调试信息
          if (process.env.NODE_ENV === 'development') {
            console.log('Window resized - Positions recalculated:', {
              cardCount: gameState.cards.length,
              containerSize: `${containerWidth}x${containerHeight}`,
              positionsGenerated: newPositions.length
            })
          }
          
        } catch (error) {
          console.error('Critical error during window resize handling:', error)
          // 应用紧急降级 - 重置到中心位置
          setGameState(prev => ({
            ...prev,
            cards: prev.cards.map((card, index) => ({
              ...card,
              position: {
                x: 0,
                y: index * 20 - (prev.cards.length - 1) * 10, // 垂直堆叠在中心
                rotation: 0,
                cardWidth: 96,
                cardHeight: 144
              },
              style: {
                ...card.style,
                transform: `translate(0px, ${index * 20 - (prev.cards.length - 1) * 10}px) rotate(0deg)`,
                width: '96px',
                height: '144px',
                marginLeft: '-48px',
                marginTop: '-72px',
                transition: 'transform 0.3s ease-out'
              }
            }))
          }))
        }
      }, 150) // 150ms防抖延迟
    }

    // 添加resize事件监听器
    window.addEventListener('resize', debouncedResizeHandler)
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', debouncedResizeHandler)
      clearTimeout(resizeTimeout)
    }
  }, [gameState.cards.length, gameState.gamePhase, calculateCardPositions, warnings.length, items.length])

  // 验证游戏配置
  useEffect(() => {
    const containerDimensions = typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : undefined

    const validation = validateCompleteGameSetup(
      items,
      quantity,
      allowRepeat,
      soundEnabled,
      containerDimensions
    )

    if (!validation.isValid) {
      setError(validation.error || '配置验证失败')
      setWarnings([])
      return
    }

    setError(null)
    setWarnings(validation.warnings || [])
  }, [items, quantity, allowRepeat, soundEnabled])

  // 初始化游戏 - 只在autoStart为true时自动开始
  useEffect(() => {
    if (items.length === 0) {
      console.warn(t('cardFlip.emptyList'))
      return
    }
    
    // 重置错误状态，确保每次组件重新挂载时都清除之前的错误
    setError(null)
    setWarnings([])
    
    if (autoStart) {
      startGame()
    }
  }, [items, quantity, allowRepeat, startGame, autoStart])

  // 清理定时器和动画
  useEffect(() => {
    return () => {
      if (dealTimeoutRef.current) {
        clearTimeout(dealTimeoutRef.current)
      }
      if (dealIntervalRef.current) {
        clearInterval(dealIntervalRef.current)
      }
      
      // 清理所有注册的动画
      animationCleanupRef.current.forEach(cleanup => cleanup())
      animationCleanupRef.current = []
    }
  }, [])

  // 渲染游戏状态提示
  const renderGameStatus = () => {
    switch (gameState.gamePhase) {
      case 'shuffling':
        return <div className="text-lg font-medium text-blue-600">{t('cardFlip.shuffling')}</div>
      case 'dealing':
        return <div className="text-lg font-medium text-green-600">{t('cardFlip.dealing')}</div>
      case 'waiting':
        return <div className="text-lg font-medium text-purple-600">{t('cardFlip.waiting')}</div>
      case 'revealing':
        return <div className="text-lg font-medium text-orange-600">{t('cardFlip.revealing')}</div>
      case 'finished':
        return <div className="text-lg font-medium text-red-600">{t('cardFlip.finished')}</div>
      default:
        return <div className="text-lg font-medium text-gray-600">{t('cardFlip.ready')}</div>
    }
  }

  // 错误状态显示
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center", dynamicSpacing.cssClasses.container.padding, className)}>
        <div className="text-center">
          <div className={cn("w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto", `mb-[${dynamicSpacing.spacing.responsive('md')}px]`)}>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className={cn("text-xl font-semibold text-red-700", `mb-[${dynamicSpacing.spacing.responsive('sm')}px]`)}>
            {t('cardFlip.gameError')}
          </div>
          <div className={cn("text-red-600", `mb-[${dynamicSpacing.spacing.responsive('md')}px]`)}>
            {error}
          </div>
          <button
            onClick={() => {
              setError(null)
              startGame()
            }}
            className={cn("bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", `px-[${dynamicSpacing.spacing.responsive('md')}px] py-[${dynamicSpacing.spacing.responsive('sm')}px]`)}
          >
            {t('cardFlip.restart')}
          </button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center", dynamicSpacing.cssClasses.container.padding, className)}>
        <div className="text-center">
          <div className={cn("text-xl font-semibold text-gray-700", `mb-[${dynamicSpacing.spacing.responsive('sm')}px]`)}>
            {t('cardFlip.emptyList')}
          </div>
          <div className="text-gray-500">
            {t('drawingComponents.cardFlip.emptyListMessage')}
          </div>
        </div>
      </div>
    )
  }

  // 加载状态显示
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center", dynamicSpacing.cssClasses.container.padding, className)}>
        <div className="text-center">
          <div className={cn("animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto", `mb-[${dynamicSpacing.spacing.responsive('md')}px]`)}></div>
          <div className="text-lg text-gray-600">
            {t('cardFlip.loading')}
          </div>
        </div>
      </div>
    )
  }

  // 获取优化的游戏信息显示配置
  const optimizedGameInfo = getOptimizedGameInfoDisplay(
    gameState,
    quantity,
    items.length,
    dynamicSpacing.deviceType
  )

  return (
    <div className={cn("flex flex-col items-center", dynamicSpacing.cssClasses.component.spaceY, dynamicSpacing.cssClasses.container.padding, className)}>
      {/* 优化的游戏信息面板 - 根据设备和游戏阶段调整显示内容 */}
      <div className={cn(
        "text-center w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100", 
        dynamicSpacing.cssClasses.uiElement.gameInfo,
        `p-[${dynamicSpacing.spacing.responsive('lg')}px]`
      )}>
        {/* 面板标题 */}
        <div className={cn("text-base font-semibold text-gray-800", `mb-[${dynamicSpacing.spacing.responsive('md')}px]`)}>
          {t('cardFlip.gameInfo')}
        </div>
        
        {/* 核心信息网格 - 始终显示的基本信息 */}
        <div className={cn("grid grid-cols-2 gap-4", `mb-[${dynamicSpacing.spacing.responsive('sm')}px]`)}>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">{t('cardFlip.drawQuantityLabel')}</div>
            <div className="text-lg font-bold text-blue-800">{optimizedGameInfo.essential.drawQuantity}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium mb-1">{t('cardFlip.totalNamesLabel')}</div>
            <div className="text-lg font-bold text-green-800">{optimizedGameInfo.essential.totalItems}</div>
          </div>
        </div>
        
        {/* 详细模式下的游戏进度信息 */}
        {optimizedGameInfo.displayMode === 'detailed' && (
          <div className={cn("grid grid-cols-2 gap-4", `mb-[${dynamicSpacing.spacing.responsive('xs')}px]`)}>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-medium mb-1">{t('cardFlip.totalCardsLabel')}</div>
              <div className="text-lg font-bold text-purple-800">{actualQuantity}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs text-orange-600 font-medium mb-1">{t('cardFlip.revealedLabel')}</div>
              <div className="text-lg font-bold text-orange-800">{gameState.revealedCards.size}</div>
            </div>
          </div>
        )}
        
        {/* 条件显示剩余卡牌指示器 - 只在游戏完成且卡牌数量较多时显示 */}
        {optimizedGameInfo.optional.remainingCards !== undefined && (
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-600 font-medium mb-1">{t('cardFlip.remainingCardsLabel')}</div>
            <div className="text-sm font-semibold text-gray-800">
              {optimizedGameInfo.optional.remainingCards}
            </div>
          </div>
        )}
      </div>

      {/* 游戏状态提示 */}
      <div className={cn("text-center", dynamicSpacing.cssClasses.uiElement.gameStatus)}>
        {renderGameStatus()}
      </div>

      {/* 开始抽奖按钮 - 只在idle状态显示 */}
      {gameState.gamePhase === 'idle' && (
        <div className={cn("text-center", dynamicSpacing.cssClasses.uiElement.startButton)}>
          <button
            onClick={startGame}
            disabled={isLoading || items.length === 0}
            className={cn("bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105", `px-[${dynamicSpacing.spacing.responsive('xl')}px] py-[${dynamicSpacing.spacing.responsive('md')}px]`)}
          >
            {t('cardFlip.startDrawing')}
          </button>
          <p className={cn("text-sm text-gray-500", `mt-[${dynamicSpacing.spacing.responsive('xs')}px]`)}>
            {t('cardFlip.clickToStart')}
          </p>
        </div>
      )}

      {/* 警告信息显示 */}
      {warnings.length > 0 && (
        <div className={cn("w-full max-w-md", dynamicSpacing.cssClasses.uiElement.warnings, `space-y-[${dynamicSpacing.spacing.responsive('xs')}px]`)}>
          {warnings.map((warning, index) => (
            <div key={index} className={cn("flex items-center bg-yellow-50 border border-yellow-200 rounded-lg", `gap-[${dynamicSpacing.spacing.responsive('xs')}px] p-[${dynamicSpacing.spacing.responsive('sm')}px]`)}>
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-800">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* 卡牌区域 - 视觉焦点区域，增强层次感 */}
      <div className={cn(
        "relative min-h-[300px] w-full flex items-center justify-center",
        "bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200",
        "shadow-inner transition-all duration-300",
        gameState.gamePhase === 'waiting' && "shadow-lg ring-2 ring-blue-200 ring-opacity-50",
        dynamicSpacing.cssClasses.uiElement.cardArea,
        dynamicSpacing.cssClasses.container.paddingX,
        `p-[${dynamicSpacing.spacing.responsive('lg')}px]`
      )}>
        {/* 背景装饰 - 增强视觉层次 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
        
        {/* 洗牌阶段显示卡牌堆 */}
        {gameState.gamePhase === 'shuffling' && (
          <div className="relative z-10">
            <CardDeck
              totalCards={items.length}
              isShuffling={true}
              onShuffleComplete={handleShuffleComplete}
            />
          </div>
        )}

        {/* 发牌和游戏阶段显示游戏卡牌 */}
        {(gameState.gamePhase === 'dealing' || 
          gameState.gamePhase === 'waiting' || 
          gameState.gamePhase === 'revealing' || 
          gameState.gamePhase === 'finished') && (
          <div className="relative z-10">
            {gameState.cards.map((card, index) => (
              <PlayingCard
                key={card.id}
                card={card}
                isRevealed={gameState.revealedCards.has(card.id)}
                onFlip={handleCardFlip}
                style={cardStyle}
                disabled={gameState.gamePhase !== 'waiting'}
                className={cn(
                  "absolute transition-all duration-500 ease-out",
                  "hover:z-20 focus:z-20", // 确保交互时卡牌在最前面
                  gameState.gamePhase === 'dealing' && index >= dealtCards && "opacity-0 scale-95"
                )}
              />
            ))}
          </div>
        )}
        
        {/* 空状态提示 */}
        {gameState.gamePhase === 'idle' && (
          <div className="text-center text-gray-400 z-10">
            <div className="text-4xl mb-2">🎴</div>
            <div className="text-sm">{t('cardFlip.cardsWillShowHere')}</div>
          </div>
        )}
      </div>

      {/* 开发模式调试工具 */}
      <CardPositionDebugOverlay
        containerWidth={typeof window !== 'undefined' ? window.innerWidth : 1024}
        containerHeight={typeof window !== 'undefined' ? window.innerHeight : 768}
        cardPositions={gameState.cards.map(card => card.position)}
        isVisible={debugVisible}
        onToggle={setDebugVisible}
      />
      
      <DebugToggleButton
        isVisible={debugVisible}
        onToggle={setDebugVisible}
      />

    </div>
  )
}