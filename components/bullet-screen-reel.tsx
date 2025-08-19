"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "@/hooks/use-translation"
import type { ListItem } from "@/types"

interface BulletScreenReelProps {
  items: ListItem[]
  isScrolling: boolean
  finalResult?: ListItem
  onScrollComplete?: () => void
  delay?: number
}

type ScrollPhase = "idle" | "accelerating" | "scrolling" | "slowing" | "highlighting" | "stopped"

export function BulletScreenReel({ items, isScrolling, finalResult, onScrollComplete, delay = 0 }: BulletScreenReelProps) {
  const { t } = useTranslation()
  const [currentItems, setCurrentItems] = useState<ListItem[]>([])
  const [scrollPhase, setScrollPhase] = useState<ScrollPhase>("idle")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(200)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 创建扩展的名称列表用于无缝滚动
  const extendedItems = [...items, ...items, ...items, ...items]

  // 初始化显示名单
  useEffect(() => {
    if (items.length > 0 && currentItems.length === 0 && scrollPhase === "idle") {
      const visibleCount = Math.min(6, items.length)
      const staticItems = items.slice(0, visibleCount)
      setCurrentItems(staticItems)
    }
  }, [items, currentItems.length, scrollPhase])

  // 重置状态的 effect
  useEffect(() => {
    if (!isScrolling && !finalResult) {
      // 在准备状态下显示一些静态名单，而不是空数组
      const visibleCount = Math.min(6, items.length)
      const staticItems = items.slice(0, visibleCount)
      setCurrentItems(staticItems)
      setScrollPhase("idle")
      setHighlightedIndex(-1)
      setHasCompleted(false)
      setScrollSpeed(200)
      stopScrolling()
    }
  }, [isScrolling, finalResult, items])

  // 当 finalResult 变化时重置完成状态
  useEffect(() => {
    if (finalResult) {
      setHasCompleted(false)
    }
  }, [finalResult])

  useEffect(() => {
    if (isScrolling && !hasCompleted) {
      // 延迟开始滚动
      timeoutRef.current = setTimeout(() => {
        startScrolling()
      }, delay)
    } else if (!isScrolling) {
      stopScrolling()
    }

    return () => {
      stopScrolling()
    }
  }, [isScrolling, delay, hasCompleted])

  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      stopScrolling()
    }
  }, [])

  const startScrolling = () => {
    // 阶段1: 加速阶段
    setScrollPhase("accelerating")
    accelerate()
  }

  const accelerate = () => {
    let speed = 300 // 开始较慢
    setScrollSpeed(speed)
    
    const accelerateInterval = setInterval(() => {
      speed = Math.max(50, speed - 30) // 逐渐加速到50ms间隔
      setScrollSpeed(speed)
      
      // 清除之前的滚动间隔
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        updateScrollingItems()
      }, speed)
      
      if (speed <= 50) {
        clearInterval(accelerateInterval)
        // 进入匀速滚动阶段
        setScrollPhase("scrolling")
        
        // 匀速持续3秒后开始减速
        timeoutRef.current = setTimeout(() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            slowDown()
          }
        }, 3000)
      }
    }, 100)
  }

  const updateScrollingItems = () => {
    // 随机选择一些名称显示，模拟弹幕效果
    const visibleCount = Math.min(8, items.length)
    const shuffled = [...extendedItems].sort(() => Math.random() - 0.5)
    setCurrentItems(shuffled.slice(0, visibleCount))
  }

  const slowDown = () => {
    // 阶段3: 减速阶段
    setScrollPhase("slowing")
    let speed = 100
    
    const slowDownInterval = setInterval(() => {
      speed += 80
      setScrollSpeed(speed)

      // 清除之前的滚动间隔
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        updateScrollingItems()
      }, speed)

      if (speed >= 800) {
        // 清除减速间隔
        clearInterval(slowDownInterval)
        // 清除滚动间隔
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // 阶段4: 高亮选中阶段
        setScrollPhase("highlighting")
        highlightWinner()
      }
    }, 200)
  }

  const highlightWinner = () => {
    if (!finalResult) return

    // 准备最终显示的名称列表，确保中奖名称在显著位置
    const finalDisplayItems = []
    const otherItems = items.filter(item => item.id !== finalResult.id)
    
    // 将中奖名称放在中间位置，周围放其他名称
    const visibleCount = Math.min(7, items.length)
    const middleIndex = Math.floor(visibleCount / 2)
    
    // 添加前面的名称
    for (let i = 0; i < middleIndex; i++) {
      if (otherItems[i]) {
        finalDisplayItems.push(otherItems[i])
      }
    }
    
    // 添加中奖名称到中间
    finalDisplayItems.push(finalResult)
    
    // 添加后面的名称
    for (let i = middleIndex; i < visibleCount - 1; i++) {
      if (otherItems[i]) {
        finalDisplayItems.push(otherItems[i])
      }
    }

    // 更新显示的名称列表
    setCurrentItems(finalDisplayItems)
    
    // 中奖名称现在在中间位置
    const displayWinnerIndex = middleIndex
    
    // 高亮动画 - 闪烁效果
    let highlightCount = 0
    const highlightInterval = setInterval(() => {
      setHighlightedIndex(prev => prev === displayWinnerIndex ? -1 : displayWinnerIndex)
      highlightCount++
      
      if (highlightCount >= 8) { // 闪烁4次
        clearInterval(highlightInterval)
        setHighlightedIndex(displayWinnerIndex)
        setScrollPhase("stopped")
        setHasCompleted(true)
        
        setTimeout(() => {
          console.log(t('drawingComponents.bulletScreen.scrollStopped'))
          onScrollComplete?.()
        }, 500)
      }
    }, 400) // 稍微慢一点的闪烁，更明显
  }

  const stopScrolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const getPhaseColor = () => {
    switch (scrollPhase) {
      case "accelerating":
        return "from-blue-400 to-cyan-400"
      case "scrolling":
        return "from-green-400 to-blue-400"
      case "slowing":
        return "from-yellow-400 to-orange-400"
      case "highlighting":
        return "from-purple-400 to-pink-400"
      case "stopped":
        return "from-green-400 to-emerald-400"
      default:
        return "from-gray-400 to-gray-500"
    }
  }

  const getPhaseText = () => {
    switch (scrollPhase) {
      case "accelerating":
        return t('drawingComponents.bulletScreen.accelerating')
      case "scrolling":
        return t('drawingComponents.bulletScreen.scrolling')
      case "slowing":
        return t('drawingComponents.bulletScreen.slowing')
      case "highlighting":
        return t('drawingComponents.bulletScreen.highlighting')
      case "stopped":
        return t('drawingComponents.bulletScreen.stopped')
      default:
        return t('drawingComponents.bulletScreen.ready')
    }
  }

  return (
    <div className="relative">
      {/* 弹幕容器 */}
      <div 
        ref={containerRef}
        className={`relative h-20 bg-gradient-to-r ${getPhaseColor()} rounded-lg overflow-hidden border-2 border-white/30 shadow-lg`}
      >
        {/* 背景动画效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        
        {/* 状态指示器 */}
        <div className="absolute top-2 left-2 z-20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              scrollPhase === "scrolling" ? "bg-green-400 animate-pulse" :
              scrollPhase === "highlighting" ? "bg-purple-400 animate-bounce" :
              scrollPhase === "stopped" ? "bg-emerald-400" :
              "bg-blue-400"
            }`}></div>
            <span className="text-xs text-white font-medium">{getPhaseText()}</span>
          </div>
        </div>

        {/* 弹幕名称 */}
        <div className="relative h-full flex items-center justify-center">
          <div className="flex items-center gap-4 px-4">
            {currentItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`
                  px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
                  transition-all duration-300 transform
                  ${highlightedIndex === index 
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black scale-150 shadow-2xl animate-pulse border-4 border-yellow-300 font-bold text-base" 
                    : scrollPhase === "stopped" && index === Math.floor(currentItems.length / 2)
                    ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white scale-125 shadow-xl border-2 border-green-300 font-bold"
                    : "bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                  }
                  ${scrollPhase === "scrolling" ? "animate-bounce" : ""}
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationDuration: scrollPhase === "scrolling" ? "0.6s" : "0.3s"
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* 高亮边框效果 */}
        {scrollPhase === "highlighting" && (
          <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg animate-pulse"></div>
        )}
        
        {/* 完成边框效果 */}
        {scrollPhase === "stopped" && (
          <div className="absolute inset-0 border-4 border-green-400 rounded-lg shadow-lg shadow-green-400/50"></div>
        )}
      </div>

      {/* 弹幕轨迹线 */}
      <div className="absolute -top-1 -bottom-1 left-0 right-0 border-l-2 border-r-2 border-dashed border-gray-300 opacity-30 pointer-events-none"></div>
    </div>
  )
}