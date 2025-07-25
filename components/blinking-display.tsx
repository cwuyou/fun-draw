'use client'

import { useState, useEffect, useMemo } from 'react'
import { BlinkingItem, BlinkingConfig } from '@/types'
import { BlinkingNameItem } from './blinking-name-item'
import { cn } from '@/lib/utils'

interface BlinkingDisplayProps {
  items: BlinkingItem[]
  currentHighlight: number | null
  config: BlinkingConfig
  className?: string
}

interface LayoutConfig {
  columns: number
  itemMinWidth: number
  itemHeight: number
  gap: number
}

export function BlinkingDisplay({
  items,
  currentHighlight,
  config,
  className
}: BlinkingDisplayProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef)
    setContainerWidth(containerRef.offsetWidth)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  // 计算响应式布局配置
  const layoutConfig = useMemo((): LayoutConfig => {
    const itemCount = items.length
    
    // 基于容器宽度和项目数量计算最佳布局
    if (containerWidth === 0) {
      // 默认配置
      return {
        columns: Math.min(4, Math.ceil(Math.sqrt(itemCount))),
        itemMinWidth: 120,
        itemHeight: 48,
        gap: 12
      }
    }

    // 响应式断点
    let baseColumns: number
    let itemMinWidth: number
    let itemHeight: number
    let gap: number

    if (containerWidth < 480) {
      // 手机端
      baseColumns = 2
      itemMinWidth = 100
      itemHeight = 44
      gap = 8
    } else if (containerWidth < 768) {
      // 平板端
      baseColumns = 3
      itemMinWidth = 110
      itemHeight = 46
      gap = 10
    } else if (containerWidth < 1024) {
      // 小桌面端
      baseColumns = 4
      itemMinWidth = 120
      itemHeight = 48
      gap = 12
    } else {
      // 大桌面端
      baseColumns = 5
      itemMinWidth = 130
      itemHeight = 52
      gap = 16
    }

    // 根据项目数量调整列数
    const optimalColumns = Math.min(
      baseColumns,
      Math.max(2, Math.ceil(Math.sqrt(itemCount))),
      Math.floor(containerWidth / (itemMinWidth + gap))
    )

    return {
      columns: optimalColumns,
      itemMinWidth,
      itemHeight,
      gap
    }
  }, [containerWidth, items.length])

  // 计算网格样式
  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${layoutConfig.columns}, minmax(${layoutConfig.itemMinWidth}px, 1fr))`,
    gap: `${layoutConfig.gap}px`,
    padding: `${layoutConfig.gap}px`,
    justifyItems: 'center' as const,
    alignItems: 'start' as const
  }), [layoutConfig])

  // 虚拟滚动支持（当项目超过50个时）
  const shouldUseVirtualScroll = items.length > 50
  const visibleItems = shouldUseVirtualScroll ? items.slice(0, 50) : items

  return (
    <div 
      ref={setContainerRef}
      className={cn("w-full min-h-[200px] relative", className)}
    >
      {/* 主要显示区域 */}
      <div 
        style={gridStyle}
        className={cn(
          "transition-all duration-300 ease-out",
          shouldUseVirtualScroll && "max-h-[400px] overflow-y-auto"
        )}
      >
        {visibleItems.map((item, index) => (
          <BlinkingNameItem
            key={item.id}
            item={item}
            isHighlighted={currentHighlight === index}
            config={config}
            index={index}
            height={layoutConfig.itemHeight}
            minWidth={layoutConfig.itemMinWidth}
          />
        ))}
      </div>

      {/* 虚拟滚动提示 */}
      {shouldUseVirtualScroll && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-4 text-center">
          <p className="text-sm text-gray-500">
            显示前50个项目，共{items.length}个项目
          </p>
        </div>
      )}

      {/* 空状态 */}
      {items.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p>暂无项目</p>
        </div>
      )}

      {/* 加载状态指示器 */}
      {currentHighlight !== null && (
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">闪烁中</span>
        </div>
      )}
    </div>
  )
}