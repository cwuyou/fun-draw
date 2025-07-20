"use client"

import { useState, useEffect, useRef } from "react"
import type { ListItem } from "@/types"

interface SlotMachineReelProps {
  items: ListItem[]
  isSpinning: boolean
  finalResult?: ListItem
  onSpinComplete?: () => void
  delay?: number
}

type AnimationPhase = "idle" | "accelerating" | "spinning" | "decelerating" | "stopping" | "stopped"

export function SlotMachineReel({ items, isSpinning, finalResult, onSpinComplete, delay = 0 }: SlotMachineReelProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [spinSpeed, setSpinSpeed] = useState(100)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const slowDownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 创建扩展的项目列表用于无缝滚动
  const extendedItems = [...items, ...items, ...items]

  // 重置状态的 effect - 当不在旋转且没有最终结果时重置
  useEffect(() => {
    if (!isSpinning && !finalResult) {
      // 完全重置状态
      setCurrentIndex(0)
      setSpinSpeed(100)
      setHasCompleted(false)
      setAnimationPhase("idle")
      stopSpinning()
    }
  }, [isSpinning, finalResult])

  // 当 finalResult 变化时重置完成状态
  useEffect(() => {
    if (finalResult) {
      setHasCompleted(false)
    }
  }, [finalResult])

  useEffect(() => {
    if (isSpinning && !hasCompleted) {
      // 延迟开始滚动
      timeoutRef.current = setTimeout(() => {
        startSpinning()
      }, delay)
    } else if (!isSpinning) {
      stopSpinning()
    }

    return () => {
      stopSpinning()
    }
  }, [isSpinning, delay, hasCompleted])

  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      stopSpinning()
    }
  }, [])

  const startSpinning = () => {
    // 阶段1: 加速阶段
    setAnimationPhase("accelerating")
    accelerate()
  }

  const accelerate = () => {
    let speed = 200 // 开始较慢
    setSpinSpeed(speed)
    
    const accelerateInterval = setInterval(() => {
      speed = Math.max(30, speed - 20) // 逐渐加速到30ms间隔
      setSpinSpeed(speed)
      
      // 清除之前的滚动间隔
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % extendedItems.length)
      }, speed)
      
      if (speed <= 30) {
        clearInterval(accelerateInterval)
        // 进入匀速阶段
        setAnimationPhase("spinning")
        
        // 匀速持续2秒后开始减速
        timeoutRef.current = setTimeout(() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            slowDown()
          }
        }, 2000)
      }
    }, 100)
  }

  const slowDown = () => {
    // 阶段3: 减速阶段
    setAnimationPhase("decelerating")
    let speed = 100
    
    slowDownIntervalRef.current = setInterval(() => {
      speed += 50
      setSpinSpeed(speed)

      // 清除之前的滚动间隔
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % extendedItems.length)
      }, speed)

      if (speed >= 500) {
        // 清除减速间隔
        if (slowDownIntervalRef.current) {
          clearInterval(slowDownIntervalRef.current)
          slowDownIntervalRef.current = null
        }
        // 清除滚动间隔
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // 阶段4: 停止阶段
        setAnimationPhase("stopping")

        // 停在最终结果上
        if (finalResult) {
          const finalIndex = items.findIndex((item) => item.id === finalResult.id)
          if (finalIndex !== -1) {
            setCurrentIndex(finalIndex + items.length) // 使用中间段的索引
          }
        }

        // 标记为已完成，防止重复触发
        setHasCompleted(true)
        
        // 阶段5: 完全停止
        setTimeout(() => {
          setAnimationPhase("stopped")
          console.log("滚轮停止，触发完成回调")
          onSpinComplete?.()
        }, 500)
      }
    }, 200)
  }

  const stopSpinning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (slowDownIntervalRef.current) {
      clearInterval(slowDownIntervalRef.current)
      slowDownIntervalRef.current = null
    }
  }

  const getVisibleItems = () => {
    const visibleCount = 5
    const startIndex = Math.max(0, currentIndex - 2)
    const result = []

    for (let i = 0; i < visibleCount; i++) {
      const index = (startIndex + i) % extendedItems.length
      result.push({
        item: extendedItems[index],
        index: index,
        isCenter: i === 2,
      })
    }

    return result
  }

  return (
    <div className="relative w-32 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden border-4 border-yellow-400 shadow-2xl">
      {/* 滚轮背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/10 to-transparent"></div>

      {/* 中心指示器 */}
      <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-16 border-t-2 border-b-2 border-red-500 bg-red-500/20 z-10"></div>

      {/* 滚动项目 */}
      <div className="relative h-full flex flex-col justify-center">
        {getVisibleItems().map((visibleItem, index) => (
          <div
            key={`${visibleItem.index}-${index}`}
            className={`
              flex items-center justify-center h-16 px-2 text-center transition-all duration-100
              ${
                visibleItem.isCenter
                  ? "text-yellow-300 font-bold text-lg scale-110 bg-yellow-500/20"
                  : "text-gray-300 text-sm"
              }
              ${isSpinning ? "blur-sm" : ""}
            `}
          >
            <span className="truncate max-w-full">{visibleItem.item.name}</span>
          </div>
        ))}
      </div>

      {/* 动态发光效果 */}
      {animationPhase === "accelerating" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"></div>
      )}
      {animationPhase === "spinning" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent animate-pulse"></div>
      )}
      {animationPhase === "decelerating" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent animate-pulse"></div>
      )}
      {animationPhase === "stopped" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-bounce"></div>
      )}
      
      {/* 速度指示器 */}
      <div className="absolute top-2 right-2 z-20">
        {animationPhase === "accelerating" && (
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        )}
        {animationPhase === "spinning" && (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-spin"></div>
        )}
        {animationPhase === "decelerating" && (
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        )}
        {animationPhase === "stopped" && (
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        )}
      </div>
    </div>
  )
}
