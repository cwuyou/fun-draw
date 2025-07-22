'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { PlayingCard } from './playing-card'
import { CardDeck } from './card-deck'
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
import { ListItem, GameCard, CardStyle, CardGamePhase, CardFlipGameState } from '@/types'
import { cn } from '@/lib/utils'

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
  name: '经典蓝',
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

  // 计算卡牌布局位置（响应式）
  const calculateCardPositions = useCallback((totalCards: number) => {
    try {
      // 验证位置计算参数
      const deviceType = typeof window !== 'undefined' 
        ? (window.innerWidth < 768 ? 'mobile' : 
           window.innerWidth < 1024 ? 'tablet' : 'desktop')
        : 'desktop'

      const containerDimensions = typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : undefined

      const positionValidation = validatePositionCalculation({
        totalCards,
        containerWidth: containerDimensions?.width,
        containerHeight: containerDimensions?.height,
        deviceType
      })

      if (!positionValidation.isValid) {
        console.error('Position calculation validation failed:', positionValidation.error)
        // 降级到安全的默认布局
        return [{
          x: 0,
          y: 0,
          rotation: 0,
          cardWidth: 96,
          cardHeight: 144
        }]
      }

      const positions = []
      
      // 添加适当的边距以防止与UI文本重叠
      const CARD_MARGIN_TOP = 40 // 距离状态文本的额外边距，增加到40px
      const CARD_MARGIN_BOTTOM = 120 // 距离游戏信息的边距，增加到120px
      
      // 响应式卡牌尺寸和间距
      const isMobile = deviceType === 'mobile'
      const isTablet = deviceType === 'tablet'
      
      // 根据设备类型调整卡牌尺寸和间距
      let cardWidth, cardHeight, spacing, cardsPerRow
      
      if (isMobile) {
        // 移动端：较小的卡牌，2张一行
        cardWidth = 80  // w-20 = 80px
        cardHeight = 120 // h-30 = 120px
        spacing = 12
        cardsPerRow = Math.min(2, totalCards)
      } else if (isTablet) {
        // 平板端：中等卡牌，3张一行
        cardWidth = 88  // w-22 = 88px
        cardHeight = 132 // h-33 = 132px
        spacing = 14
        cardsPerRow = Math.min(3, totalCards)
      } else {
        // 桌面端：标准卡牌，最多5张一行
        cardWidth = 96  // w-24 = 96px
        cardHeight = 144 // h-36 = 144px
        spacing = 16
        cardsPerRow = Math.min(5, totalCards)
      }
      
      const rows = Math.ceil(totalCards / cardsPerRow)
      
      // 验证布局是否会溢出容器
      const totalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing
      const totalHeight = rows * cardHeight + (rows - 1) * spacing + CARD_MARGIN_TOP + CARD_MARGIN_BOTTOM
      
      if (containerDimensions) {
        const availableWidth = containerDimensions.width - 32 // 减去padding
        const availableHeight = containerDimensions.height - 200 // 减去UI元素高度
        
        if (totalWidth > availableWidth || totalHeight > availableHeight) {
          console.warn('Layout may overflow container, adjusting card size')
          // 自动调整卡牌尺寸以适应容器
          const scaleX = availableWidth / totalWidth
          const scaleY = availableHeight / totalHeight
          const scale = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
          
          cardWidth *= scale
          cardHeight *= scale
          spacing *= scale
        }
      }
      
      let cardIndex = 0
      for (let row = 0; row < rows; row++) {
        const cardsInThisRow = Math.min(cardsPerRow, totalCards - row * cardsPerRow)
        const rowWidth = cardsInThisRow * cardWidth + (cardsInThisRow - 1) * spacing
        const startX = -rowWidth / 2 + cardWidth / 2
        
        for (let col = 0; col < cardsInThisRow; col++) {
          positions.push({
            x: startX + col * (cardWidth + spacing),
            // 调整Y位置以考虑UI文本间距
            y: CARD_MARGIN_TOP + row * (cardHeight + spacing) - (rows - 1) * (cardHeight + spacing) / 2,
            rotation: (Math.random() - 0.5) * 4, // 轻微随机旋转
            cardWidth,
            cardHeight
          })
          cardIndex++
        }
      }
      
      return positions
    } catch (error) {
      console.error('Error calculating card positions:', error)
      // 返回安全的默认位置
      return Array.from({ length: totalCards }, (_, index) => ({
        x: (index % 3 - 1) * 100, // 简单的3列布局
        y: Math.floor(index / 3) * 150,
        rotation: 0,
        cardWidth: 96,
        cardHeight: 144
      }))
    }
  }, [])

  // 选择中奖者
  const selectWinners = useCallback((items: ListItem[], quantity: number, allowRepeat: boolean): ListItem[] => {
    try {
      // 增强的输入验证
      if (!Array.isArray(items)) {
        throw new Error('项目列表必须是数组格式')
      }
      
      if (items.length === 0) {
        throw new Error('项目列表为空')
      }
      
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('抽取数量必须是大于0的整数')
      }
      
      if (quantity > gameConfig.maxCards) {
        throw new Error(`抽取数量不能超过${gameConfig.maxCards}张卡牌`)
      }
      
      if (!allowRepeat && quantity > items.length) {
        throw new Error('Quantity exceeds available items when repeat is disabled')
      }

      // 验证项目格式
      const invalidItems = items.filter(item => 
        !item || 
        typeof item.name !== 'string' || 
        item.name.trim().length === 0
      )
      
      if (invalidItems.length > 0) {
        throw new Error(`发现${invalidItems.length}个无效项目，请检查项目名称`)
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
          console.warn(`只能选择${i}个中奖者，少于配置的${quantity}个`)
          break
        }
        
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        const winner = availableItems[randomIndex]
        
        if (!winner) {
          console.error(`选择中奖者时遇到空项目，索引: ${randomIndex}`)
          continue
        }
        
        winners.push(winner)
        
        if (!allowRepeat) {
          availableItems.splice(randomIndex, 1)
        }
      }
      
      if (winners.length === 0) {
        throw new Error('未能选择任何中奖者，请检查项目列表')
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
        console.warn('游戏正在进行中，无法重新开始')
        return
      }

      // 验证必要的游戏参数
      if (!items || items.length === 0) {
        setError('项目列表为空，无法开始游戏')
        return
      }

      if (actualQuantity <= 0) {
        setError('抽取数量必须大于0')
        return
      }

      // 验证不允许重复时的项目数量
      if (!allowRepeat && quantity > items.length) {
        setError('Quantity exceeds available items when repeat is disabled')
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

  // Enhanced dealing animation system
  const dealCardsWithAnimation = useCallback(async (gameCards: GameCard[]) => {
    try {
      setGameState(prev => ({ ...prev, gamePhase: 'dealing' }))
      setDealtCards(0)
      
      // Initialize all cards as invisible with starting position
      setGameState(prev => ({
        ...prev,
        cards: gameCards.map(card => ({
          ...card,
          style: {
            opacity: 0,
            transform: 'translateY(-100px) scale(0.5) rotateX(90deg)',
            transition: `all ${gameConfig.cardAppearDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
            zIndex: 1000 // Start with high z-index for dealing effect
          }
        }))
      }))
      
      // Deal cards one by one with staggered timing
      for (let i = 0; i < gameCards.length; i++) {
        // Wait for the interval before dealing next card
        await new Promise(resolve => setTimeout(resolve, gameConfig.dealInterval))
        
        // Play dealing sound effect for each card
        if (soundEnabled) {
          soundManager.play('card-deal').catch(() => {
            // Ignore audio errors
          })
        }
        
        // Animate current card into position
        setGameState(prev => ({
          ...prev,
          cards: prev.cards.map((card, index) => 
            index === i 
              ? {
                  ...card,
                  style: {
                    opacity: 1,
                    transform: 'translateY(0) scale(1) rotateX(0deg)',
                    transition: `all ${gameConfig.cardAppearDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    zIndex: Math.min(50, gameCards.length - i) // 限制z-index最大值，防止遮挡UI
                  }
                }
              : card
          )
        }))
        
        // Update dealt cards counter
        setDealtCards(i + 1)
        
        // 移除跳动效果，避免位置问题
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            cards: prev.cards.map((card, index) => 
              index === i 
                ? {
                    ...card,
                    style: {
                      ...card.style,
                      transform: 'translateY(0) scale(1) rotateX(0deg)',
                      transition: `all 150ms ease-out`
                    }
                  }
                : card
            )
          }))
        }, gameConfig.cardAppearDuration - 50)
      }
      
      // Wait for last card animation to complete, then transition to waiting phase
      setTimeout(() => {
        // Clear all inline styles to let CSS take over
        setGameState(prev => ({
          ...prev,
          gamePhase: 'waiting',
          cards: prev.cards.map(card => ({
            ...card,
            style: undefined // Remove inline styles
          }))
        }))
      }, gameConfig.cardAppearDuration + 200)
      
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
        // 游戏结束 - 不自动重新开始
        setGameState(prev => ({ ...prev, gamePhase: 'finished' }))
        // 延迟调用完成回调，让用户看到最终状态
        setTimeout(() => {
          onComplete(gameState.winners)
        }, 500)
      } else {
        // 继续等待翻牌
        setGameState(prev => ({ ...prev, gamePhase: 'waiting' }))
      }
    }, gameConfig.flipDuration)
  }, [gameState, soundEnabled, onComplete, gameConfig.flipDuration])

  // 监听窗口大小变化，重新计算卡牌位置
  useEffect(() => {
    const handleResize = () => {
      if (gameState.cards.length > 0) {
        const newPositions = calculateCardPositions(gameState.cards.length)
        setGameState(prev => ({
          ...prev,
          cards: prev.cards.map((card, index) => ({
            ...card,
            position: newPositions[index]
          }))
        }))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [gameState.cards.length, calculateCardPositions])

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
      console.warn('项目列表为空')
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
        return <div className="text-lg font-medium text-blue-600">正在洗牌...</div>
      case 'dealing':
        return <div className="text-lg font-medium text-green-600">正在发牌...</div>
      case 'waiting':
        return <div className="text-lg font-medium text-purple-600">点击卡牌进行翻牌</div>
      case 'revealing':
        return <div className="text-lg font-medium text-orange-600">翻牌中...</div>
      case 'finished':
        return <div className="text-lg font-medium text-red-600">抽奖完成！</div>
      default:
        return <div className="text-lg font-medium text-gray-600">准备中...</div>
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>
    )
  }

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

  // 加载状态显示
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">
            正在准备游戏...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8", className)}>
      {/* 游戏信息 - 移到顶部，避免被卡牌遮挡 */}
      <div className="text-center space-y-2 w-full max-w-md bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between text-sm text-gray-600 px-2">
          <span>抽取数量: {quantity}</span>
          <span>总项目: {items.length}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 px-2">
          <span>总卡牌: {actualQuantity}</span>
          <span>已翻开: {gameState.revealedCards.size}</span>
        </div>
        <div className="flex justify-center text-sm text-gray-600 px-2">
          <span>剩余: {gameState.cards.length - gameState.revealedCards.size}</span>
        </div>
      </div>

      {/* 游戏状态提示 */}
      <div className="text-center">
        {renderGameStatus()}
      </div>

      {/* 开始抽奖按钮 - 只在idle状态显示 */}
      {gameState.gamePhase === 'idle' && (
        <div className="text-center">
          <button
            onClick={startGame}
            disabled={isLoading || items.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            🎲 开始抽奖
          </button>
          <p className="text-sm text-gray-500 mt-2">
            点击按钮开始卡牌抽奖
          </p>
        </div>
      )}

      {/* 警告信息显示 */}
      {warnings.length > 0 && (
        <div className="w-full max-w-md space-y-2">
          {warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-800">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* 卡牌区域 - 响应式容器，增加底部空间 */}
      <div className="relative min-h-[300px] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 mb-8">
        {/* 洗牌阶段显示卡牌堆 */}
        {gameState.gamePhase === 'shuffling' && (
          <CardDeck
            totalCards={items.length}
            isShuffling={true}
            onShuffleComplete={handleShuffleComplete}
          />
        )}

        {/* 发牌和游戏阶段显示游戏卡牌 */}
        {(gameState.gamePhase === 'dealing' || 
          gameState.gamePhase === 'waiting' || 
          gameState.gamePhase === 'revealing' || 
          gameState.gamePhase === 'finished') && (
          <div className="relative">
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
                  gameState.gamePhase === 'dealing' && index >= dealtCards && "opacity-0 scale-95"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 中奖结果显示 - 只在游戏结束时显示，位置固定避免遮挡 */}
      {gameState.gamePhase === 'finished' && (
        <div className="text-center w-full max-w-md">
          <div className="text-sm text-green-600 font-medium p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="font-semibold mb-2">🎉 中奖者</div>
            <div className="break-words">
              {gameState.winners.map(w => w.name).join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}