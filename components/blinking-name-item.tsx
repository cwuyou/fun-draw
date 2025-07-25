'use client'

import { useState, useEffect } from 'react'
import { BlinkingItem, BlinkingConfig } from '@/types'
import { cn } from '@/lib/utils'

interface BlinkingNameItemProps {
  item: BlinkingItem
  isHighlighted: boolean
  config: BlinkingConfig
  index: number
  height?: number
  minWidth?: number
}

export function BlinkingNameItem({
  item,
  isHighlighted,
  config,
  index,
  height = 48,
  minWidth = 120
}: BlinkingNameItemProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // 处理高亮状态变化的动画
  useEffect(() => {
    if (isHighlighted) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isHighlighted])

  // 计算发光效果的透明度
  const glowOpacity = Math.floor(config.glowIntensity * 255).toString(16).padStart(2, '0')

  // 动态样式计算
  const itemStyle = {
    height: `${height}px`,
    minWidth: `${minWidth}px`,
    backgroundColor: isHighlighted ? item.highlightColor : undefined,
    boxShadow: isHighlighted 
      ? `0 0 ${height / 2}px ${item.highlightColor}${glowOpacity}, 0 0 ${height}px ${item.highlightColor}40`
      : item.isSelected
      ? '0 2px 8px rgba(34, 197, 94, 0.3)'
      : undefined,
    transform: isHighlighted 
      ? 'scale(1.05) translateY(-2px)' 
      : item.isSelected 
      ? 'scale(1.02)' 
      : 'scale(1)',
    zIndex: isHighlighted ? 10 : item.isSelected ? 5 : 1
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border-2 transition-all duration-200 ease-out",
        "flex items-center justify-center text-sm font-medium",
        "cursor-pointer select-none overflow-hidden",
        // 基础状态样式
        isHighlighted
          ? "border-transparent text-white shadow-lg"
          : item.isSelected
          ? "border-green-400 bg-green-50 text-green-800"
          : "border-gray-200 bg-white text-gray-700",
        // 透明度控制
        !isHighlighted && !item.isSelected && "opacity-60 hover:opacity-80",
        // 动画效果
        isAnimating && "animate-pulse"
      )}
      style={itemStyle}
    >
      {/* 背景渐变效果 */}
      {isHighlighted && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(45deg, ${item.highlightColor}, transparent, ${item.highlightColor})`
          }}
        />
      )}

      {/* 文字内容 */}
      <span className={cn(
        "relative z-10 truncate px-3 font-medium",
        isHighlighted && "text-white drop-shadow-sm",
        item.isSelected && !isHighlighted && "text-green-800"
      )}>
        {item.item.name}
      </span>
      
      {/* 选中标记 */}
      {item.isSelected && (
        <div className={cn(
          "absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full",
          "flex items-center justify-center shadow-md",
          "transform transition-all duration-200",
          isHighlighted ? "scale-110" : "scale-100"
        )}>
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}

      {/* 闪烁边框效果 */}
      {isHighlighted && (
        <div 
          className="absolute inset-0 rounded-lg border-2 border-white opacity-50 animate-ping"
          style={{ animationDuration: '0.5s' }}
        />
      )}

      {/* 触摸反馈 */}
      <div className={cn(
        "absolute inset-0 rounded-lg transition-opacity duration-150",
        "bg-black opacity-0 hover:opacity-5 active:opacity-10",
        !isHighlighted && !item.isSelected && "pointer-events-auto"
      )} />
    </div>
  )
}