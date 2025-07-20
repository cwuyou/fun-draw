'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PlayingCard } from './playing-card'
import { CardDeck } from './card-deck'
import { soundManager } from '@/lib/sound-manager'
import { useAnimationPerformance } from '@/lib/animation-performance'
import { ListItem, GameCard, CardStyle, CardGamePhase, CardFlipGameState } from '@/types'
import { cn } from '@/lib/utils'

interface CardFlipGameProps {
  items: ListItem[]
  quantity: number
  allowRepeat: boolean
  onComplete: (winners: ListItem[]) => void
  soundEnabled: boolean
  className?: string
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
  className
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
    dealInterval: getOptimizedDuration(600), // 增加发牌间隔，让用户能看清逐张发牌
    flipDuration: getOptimizedDuration(600)
  }

  // 确保发牌数量在合理范围内，但尊重用户配置的数量
  const actualQuantity = Math.max(1, Math.min(gameConfig.maxCards, quantity))

  // 计算卡牌布局位置（响应式）
  const calculateCardPositions = useCallback((totalCards: number) => {
    const positions = []
    
    // 添加适当的边距以防止与UI文本重叠
    const UI_TEXT_HEIGHT = 60 // 为游戏信息文本预留空间
    const CARD_MARGIN_TOP = 20 // 距离状态文本的额外边距
    const CARD_MARGIN_BOTTOM = 80 // 距离游戏信息的边距
    
    // 响应式卡牌尺寸和间距
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
    
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
  }, [])

  // 选择中奖者
  const selectWinners = useCallback((items: ListItem[], quantity: number, allowRepeat: boolean): ListItem[] => {
    try {
      if (!items || items.length === 0) {
        throw new Error('项目列表为空')
      }
      
      if (quantity <= 0) {
        throw new Error('抽取数量必须大于0')
      }
      
      if (!allowRepeat && quantity > items.length) {
        throw new Error('在不允许重复的情况下，抽取数量不能超过项目总数')
      }
      
      const winners: ListItem[] = []
      const availableItems = [...items]
      
      for (let i = 0; i < quantity; i++) {
        if (availableItems.length === 0) break
        
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        const winner = availableItems[randomIndex]
        winners.push(winner)
        
        if (!allowRepeat) {
          availableItems.splice(randomIndex, 1)
        }
      }
      
      return winners
    } catch (err) {
      setError(`选择中奖者失败: ${err instanceof Error ? err.message : '未知错误'}`)
      console.error('Select winners error:', err)
      return []
    }
  }, [])

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
      setError(null)
      setIsLoading(true)
      setGameState(prev => ({
        ...prev,
        gamePhase: 'shuffling',
        cards: [],
        revealedCards: new Set(),
        winners: []
      }))
      
      // 播放洗牌音效
      if (soundEnabled) {
        soundManager.play('card-shuffle').catch(() => {
          // 忽略播放错误
        })
      }
      
      setIsLoading(false)
    } catch (err) {
      setError('游戏启动失败，请重试')
      console.error('Game start error:', err)
      setIsLoading(false)
    }
  }, [soundEnabled])

  // 洗牌完成，开始发牌
  const handleShuffleComplete = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePhase: 'dealing' }))
    setDealtCards(0) // 重置发牌计数
    
    // 延迟一点开始发牌动画
    dealTimeoutRef.current = setTimeout(() => {
      try {
        // 准备卡牌数据
        const winners = selectWinners(items, actualQuantity, allowRepeat)
        const gameCards = createGameCards(winners, actualQuantity)
        
        setGameState(prev => ({
          ...prev,
          cards: gameCards,
          winners
        }))

        // 逐张发牌动画 - 改进为更明显的动画效果
        let currentCard = 0
        
        // 先设置所有卡片为不可见状态
        setGameState(prev => ({
          ...prev,
          cards: gameCards.map(card => ({
            ...card,
            style: {
              opacity: 0,
              transform: 'translateY(-50px) scale(0.8)',
              transition: 'all 0.4s ease-out'
            }
          }))
        }))
        
        dealIntervalRef.current = setInterval(() => {
          if (soundEnabled) {
            soundManager.play('card-deal').catch(() => {
              // 忽略播放错误
            })
          }
          
          // 显示当前卡片
          setGameState(prev => ({
            ...prev,
            cards: prev.cards.map((card, index) => 
              index === currentCard 
                ? {
                    ...card,
                    style: {
                      opacity: 1,
                      transform: 'translateY(0) scale(1)',
                      transition: 'all 0.4s ease-out'
                    }
                  }
                : card
            )
          }))
          
          currentCard++
          setDealtCards(currentCard)
          
          if (currentCard >= actualQuantity) {
            clearInterval(dealIntervalRef.current!)
            // 发牌完成，进入等待翻牌状态
            setTimeout(() => {
              setGameState(prev => ({ ...prev, gamePhase: 'waiting' }))
            }, 500) // 增加等待时间让最后一张卡片动画完成
          }
        }, gameConfig.dealInterval)
      } catch (err) {
        setError('发牌失败，请重试')
        console.error('Deal cards error:', err)
      }
    }, 500)
  }, [items, actualQuantity, allowRepeat, soundEnabled, selectWinners, createGameCards, gameConfig.dealInterval])

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
        // 游戏结束
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gamePhase: 'finished' }))
          onComplete(gameState.winners)
        }, 1000)
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

  // 初始化游戏
  useEffect(() => {
    if (items.length === 0) {
      console.warn('项目列表为空')
      return
    }
    
    startGame()
  }, [items, quantity, allowRepeat, startGame])

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
      {/* 游戏状态提示 */}
      <div className="text-center">
        {renderGameStatus()}
      </div>

      {/* 卡牌区域 - 响应式容器 */}
      <div className="relative min-h-[200px] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
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

      {/* 游戏信息 - 响应式布局 */}
      <div className="text-center space-y-2 w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-600 px-4">
          <span>抽取数量: {quantity}</span>
          <span>总项目: {items.length}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 px-4">
          <span>总卡牌: {actualQuantity}</span>
          <span>已翻开: {gameState.revealedCards.size}</span>
        </div>
        <div className="flex justify-center text-sm text-gray-600 px-4">
          <span>剩余: {gameState.cards.length - gameState.revealedCards.size}</span>
        </div>
        {gameState.gamePhase === 'finished' && (
          <div className="text-sm text-green-600 font-medium mt-4 p-3 bg-green-50 rounded-lg">
            <div className="font-semibold mb-1">🎉 中奖者</div>
            <div className="break-words">
              {gameState.winners.map(w => w.name).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}