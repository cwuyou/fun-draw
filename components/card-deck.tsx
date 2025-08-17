'use client'

import { useState, useEffect, useRef } from 'react'
import { soundManager } from '@/lib/sound-manager'
import { useAnimationPerformance } from '@/lib/animation-performance'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

interface CardDeckProps {
  totalCards: number
  isShuffling: boolean
  onShuffleComplete: () => void
  className?: string
}

interface DeckCard {
  id: string
  x: number
  y: number
  rotation: number
  zIndex: number
}

export function CardDeck({ 
  totalCards, 
  isShuffling, 
  onShuffleComplete,
  className 
}: CardDeckProps) {
  const [cards, setCards] = useState<DeckCard[]>([])
  const [shuffleProgress, setShuffleProgress] = useState(0)
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const { t } = useTranslation()

  // 使用动画性能管理器
  const {
    shouldSkipAnimation,
    shouldEnableComplexAnimations,
    shouldEnableParticleEffects,
    shouldEnableShadows,
    getOptimizedDuration,
    registerAnimation,
    unregisterAnimation
  } = useAnimationPerformance()

  // 初始化卡牌堆叠 - 显示所有上传的卡片
  useEffect(() => {
    // 确保显示所有上传的卡片，满足需求6.2：显示与上传列表数量匹配的确切卡片数
    const actualCardCount = Math.max(1, totalCards) // 至少显示1张卡片
    
    const initialCards: DeckCard[] = []
    for (let i = 0; i < actualCardCount; i++) {
      initialCards.push({
        id: `deck-card-${i}`,
        x: Math.random() * 2 - 1, // 初始时保持相对整齐的堆叠
        y: -i * 0.4, // 适当的堆叠间距，让每张卡片都可见
        rotation: Math.random() * 6 - 3, // 轻微的随机旋转
        zIndex: actualCardCount - i
      })
    }
    setCards(initialCards)
  }, [totalCards])

  // 洗牌动画效果
  useEffect(() => {
    if (isShuffling) {
      startShuffleAnimation()
    } else {
      stopShuffleAnimation()
    }

    return () => {
      stopShuffleAnimation()
    }
  }, [isShuffling])

  const startShuffleAnimation = () => {
    // 注册动画
    if (!registerAnimation('card-shuffle')) {
      // 如果无法注册动画，直接完成洗牌
      setTimeout(finishShuffle, 100)
      return
    }

    // 播放洗牌音效
    soundManager.play('card-shuffle').catch(() => {
      // 忽略播放错误
    })
    
    setShuffleProgress(0)
    
    // 确保最小持续时间为视觉可感知的时间（需求6.4）
    const minDuration = 2500 // 最小2.5秒
    const shuffleDuration = Math.max(minDuration, getOptimizedDuration(3000))
    const startTime = Date.now()
    
    // 如果应该跳过动画，也给一个最小的可见时间
    if (shouldSkipAnimation) {
      setTimeout(() => {
        unregisterAnimation('card-shuffle')
        finishShuffle()
      }, minDuration) // 确保最小持续时间
      return
    }
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / shuffleDuration, 1)
      
      setShuffleProgress(progress)
      
      // 实现更真实的洗牌模式（需求6.3）
      if (shouldEnableComplexAnimations) {
        // 复杂动画：模拟真实洗牌动作
        setCards(prevCards => 
          prevCards.map((card, index) => {
            // 创建分组洗牌效果 - 卡片分成两堆然后交错
            const isLeftPile = index % 2 === 0
            const pileOffset = isLeftPile ? -1 : 1
            const shufflePhase = Math.sin(progress * Math.PI * 2)
            
            // 水平移动：模拟分堆和合并
            const baseX = pileOffset * 8 * Math.sin(progress * Math.PI)
            const shuffleX = Math.sin(elapsed * 0.008 + index * 0.5) * 12 * (1 - progress * 0.7)
            
            // 垂直移动：模拟卡片起伏
            const baseY = -index * 0.4
            const liftY = Math.abs(shufflePhase) * 8 // 洗牌时卡片会被抬起
            const shuffleY = Math.cos(elapsed * 0.006 + index * 0.3) * 6 * (1 - progress * 0.6)
            
            // 旋转：模拟洗牌时的卡片翻转
            const baseRotation = Math.random() * 6 - 3
            const shuffleRotation = Math.sin(elapsed * 0.01 + index * 0.4) * 25 * (1 - progress * 0.4)
            
            return {
              ...card,
              x: baseX + shuffleX,
              y: baseY - liftY + shuffleY,
              rotation: baseRotation + shuffleRotation
            }
          })
        )
      } else {
        // 简化动画：保持基本的洗牌视觉效果
        setCards(prevCards => 
          prevCards.map((card, index) => {
            const shuffleIntensity = Math.sin(progress * Math.PI) // 中间最强，两端较弱
            
            return {
              ...card,
              x: Math.sin(elapsed * 0.006 + index * 0.5) * 8 * shuffleIntensity,
              y: -index * 0.4 + Math.cos(elapsed * 0.005 + index * 0.3) * 4 * shuffleIntensity,
              rotation: Math.sin(elapsed * 0.007 + index * 0.4) * 15 * shuffleIntensity
            }
          })
        )
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // 洗牌完成，恢复整齐堆叠
        unregisterAnimation('card-shuffle')
        finishShuffle()
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const stopShuffleAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current)
    }
    soundManager.stop('card-shuffle')
  }

  const finishShuffle = () => {
    // 停止洗牌音效
    soundManager.stop('card-shuffle')
    
    // 平滑过渡到整齐堆叠状态（需求6.5：确保平滑过渡到发牌阶段）
    setCards(prevCards => 
      prevCards.map((card, index) => ({
        ...card,
        x: 0, // 回到中心位置
        y: -index * 0.5, // 整齐堆叠
        rotation: 0, // 回正角度
      }))
    )
    
    setShuffleProgress(0)
    
    // 给足够时间让过渡动画完成，确保平滑过渡
    shuffleTimeoutRef.current = setTimeout(() => {
      onShuffleComplete()
    }, 500) // 增加过渡时间确保平滑
  }

  return (
    <div 
      className={cn(
        "relative w-32 h-48 mx-auto", // 增大卡牌堆尺寸以更好显示多张卡片
        className
      )}
      role="img"
      aria-label={isShuffling ? "正在洗牌..." : "卡牌堆"}
    >
      {/* 卡牌堆叠 */}
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={cn(
            "absolute w-full h-full rounded-lg shadow-lg",
            "bg-gradient-to-br from-blue-600 to-blue-800",
            "border-2 border-gray-200",
            "transition-transform duration-200 ease-out",
            isShuffling && "transition-none"
          )}
          style={{
            transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg)`,
            zIndex: card.zIndex,
            transformOrigin: 'center center',
            // 为每张卡片添加轻微的透明度变化，让堆叠效果更明显
            opacity: Math.max(0.7, 1 - index * 0.05)
          }}
        >
          {/* 卡牌背面设计 */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-xs font-bold opacity-80">
              {index + 1} / {cards.length}
            </div>
          </div>
          
          {/* 卡牌边缘高光效果 */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-transparent to-white opacity-10" />
        </div>
      ))}
      
      {/* 洗牌进度指示器（可选） */}
      {isShuffling && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {t('cardFlip.shuffling')}
          </div>
        </div>
      )}
      
      {/* 洗牌特效粒子（增强视觉效果） */}
      {isShuffling && shouldEnableParticleEffects && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(shouldEnableComplexAnimations ? 6 : 3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-60"
              style={{
                left: `${20 + Math.sin(Date.now() * 0.01 + i) * 30}%`,
                top: `${30 + Math.cos(Date.now() * 0.008 + i) * 40}%`,
                animation: `float ${getOptimizedDuration(1000)}ms ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}