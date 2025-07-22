'use client'

import { useState, useEffect } from 'react'
import { GameCard, CardStyle } from '@/types'
import { useAnimationPerformance } from '@/lib/animation-performance'
import { cn } from '@/lib/utils'

interface PlayingCardProps {
  card: GameCard
  isRevealed: boolean
  onFlip: (cardId: string) => void
  style: CardStyle
  disabled: boolean
  className?: string
}

export function PlayingCard({ 
  card, 
  isRevealed, 
  onFlip, 
  style, 
  disabled,
  className 
}: PlayingCardProps) {
  const [isFlipping, setIsFlipping] = useState(false)

  // 使用动画性能管理器
  const {
    shouldSkipAnimation,
    shouldEnableShadows,
    getOptimizedDuration,
    registerAnimation,
    unregisterAnimation
  } = useAnimationPerformance()

  // 优化的动画持续时间
  const flipDuration = getOptimizedDuration(600)

  const handleClick = () => {
    if (disabled || isRevealed || isFlipping) return
    
    // 注册翻牌动画
    if (!registerAnimation(`card-flip-${card.id}`)) {
      // 如果无法注册动画，直接触发翻牌
      onFlip(card.id)
      return
    }
    
    setIsFlipping(true)
    onFlip(card.id)
    
    // Reset flipping state after animation completes
    setTimeout(() => {
      setIsFlipping(false)
      unregisterAnimation(`card-flip-${card.id}`)
    }, shouldSkipAnimation ? 100 : flipDuration)
  }

  // 清理动画注册
  useEffect(() => {
    return () => {
      unregisterAnimation(`card-flip-${card.id}`)
    }
  }, [card.id, unregisterAnimation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // 响应式卡牌尺寸
  const cardWidth = card.position.cardWidth || 96
  const cardHeight = card.position.cardHeight || 144
  
  // 确保最小触摸区域 44px x 44px (iOS HIG标准)
  const minTouchSize = 44
  const touchWidth = Math.max(cardWidth, minTouchSize)
  const touchHeight = Math.max(cardHeight, minTouchSize)

  return (
    <div
      className={cn(
        "relative cursor-pointer perspective-1000",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={isRevealed ? `已翻开: ${card.content?.name || '空卡'}` : '点击翻牌'}
      data-testid={card.id}
      style={{
        width: `${touchWidth}px`,
        height: `${touchHeight}px`,
        transform: `translate(${card.position.x}px, ${card.position.y}px) rotate(${card.position.rotation}deg)`,
        transition: 'transform 0.3s ease-out',
        // Apply dealing animation styles if present
        ...(card.style || {}),
        // Ensure proper z-index to prevent text overlap
        zIndex: card.style?.zIndex || 10
      }}
    >
      {/* 卡牌内容区域 - 使用实际卡牌尺寸 */}
      <div
        className={cn(
          "relative transform-style-preserve-3d mx-auto my-auto",
          (isRevealed || isFlipping) && "rotate-y-180",
          shouldSkipAnimation ? "transition-none" : "transition-transform ease-out"
        )}
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transitionDuration: shouldSkipAnimation ? '0ms' : `${flipDuration}ms`
        }}
      >
        {/* 卡牌背面 */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-lg backface-hidden",
            "border-2 border-gray-200 flex items-center justify-center",
            shouldEnableShadows ? "shadow-lg" : "shadow-sm",
            style.backDesign
          )}
        >
          <div className="text-white text-xs font-bold opacity-80">
            {style.name}
          </div>
        </div>

        {/* 卡牌正面 */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-lg backface-hidden rotate-y-180",
            shouldEnableShadows ? "shadow-lg" : "shadow-sm",
            style.frontTemplate,
            "flex flex-col items-center justify-center p-2 text-center"
          )}
        >
          {card.content ? (
            <>
              <div className={cn(
                "font-bold text-gray-800 mb-1",
                cardWidth < 88 ? "text-sm" : "text-lg"
              )}>
                🎉
              </div>
              <div className={cn(
                "font-semibold text-gray-700 break-words leading-tight",
                cardWidth < 88 ? "text-xs" : "text-sm"
              )}>
                {card.content.name}
              </div>
              {card.isWinner && (
                <div className={cn(
                  "text-yellow-600 mt-1 font-medium",
                  cardWidth < 88 ? "text-xs" : "text-xs"
                )}>
                  中奖！
                </div>
              )}
            </>
          ) : (
            <div className={cn(
              "text-gray-400",
              cardWidth < 88 ? "text-xs" : "text-sm"
            )}>
              空卡
            </div>
          )}
        </div>
      </div>

      {/* 悬停效果 */}
      {!disabled && !isRevealed && !shouldSkipAnimation && (
        <div className="absolute inset-0 rounded-lg bg-white bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
      )}
    </div>
  )
}