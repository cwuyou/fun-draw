'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Eye, EyeOff, Grid, Target, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateAvailableCardSpace } from '@/lib/card-space-calculator'
import { validatePositionBoundaries } from '@/lib/boundary-aware-positioning'
import type { CardPosition } from '@/types'

interface DebugOverlayProps {
  containerWidth: number
  containerHeight: number
  cardPositions: CardPosition[]
  isVisible?: boolean
  onToggle?: (visible: boolean) => void
}

interface DebugInfo {
  availableSpace: ReturnType<typeof calculateAvailableCardSpace>
  boundaryValidation: ReturnType<typeof validatePositionBoundaries>
  positionMetrics: {
    totalCards: number
    validPositions: number
    invalidPositions: number
    averageSpacing: number
    utilizationRate: number
  }
}

export function CardPositionDebugOverlay({
  containerWidth,
  containerHeight,
  cardPositions,
  isVisible = false,
  onToggle
}: DebugOverlayProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showBoundaries, setShowBoundaries] = useState(true)
  const [showPositions, setShowPositions] = useState(true)
  const [showMetrics, setShowMetrics] = useState(true)

  // 只在开发模式下显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  useEffect(() => {
    if (!isVisible || cardPositions.length === 0) {
      setDebugInfo(null)
      return
    }

    // 计算调试信息
    const uiElements = {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: true,
      hasResultDisplay: false
    }

    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, uiElements)
    const boundaryValidation = validatePositionBoundaries(cardPositions, availableSpace)

    // 计算位置指标
    const validPositions = cardPositions.filter(pos => 
      pos.x >= 0 && pos.y >= 0 && 
      pos.x + pos.cardWidth <= containerWidth && 
      pos.y + pos.cardHeight <= containerHeight
    ).length

    const totalCardArea = cardPositions.reduce((sum, pos) => sum + (pos.cardWidth * pos.cardHeight), 0)
    const availableArea = availableSpace.width * availableSpace.height
    const utilizationRate = availableArea > 0 ? (totalCardArea / availableArea) * 100 : 0

    // 计算平均间距
    let totalSpacing = 0
    let spacingCount = 0
    for (let i = 0; i < cardPositions.length - 1; i++) {
      for (let j = i + 1; j < cardPositions.length; j++) {
        const pos1 = cardPositions[i]
        const pos2 = cardPositions[j]
        const distance = Math.sqrt(
          Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
        )
        totalSpacing += distance
        spacingCount++
      }
    }
    const averageSpacing = spacingCount > 0 ? totalSpacing / spacingCount : 0

    setDebugInfo({
      availableSpace,
      boundaryValidation,
      positionMetrics: {
        totalCards: cardPositions.length,
        validPositions,
        invalidPositions: cardPositions.length - validPositions,
        averageSpacing,
        utilizationRate
      }
    })
  }, [isVisible, cardPositions, containerWidth, containerHeight])

  if (!isVisible || !debugInfo) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* 容器边界可视化 */}
      {showBoundaries && (
        <div className="absolute inset-0">
          {/* 容器边界 */}
          <div 
            className="absolute border-2 border-red-500 border-dashed"
            style={{
              width: containerWidth,
              height: containerHeight,
              left: 0,
              top: 0
            }}
          />
          
          {/* 可用空间边界 */}
          <div 
            className="absolute border-2 border-blue-500 border-solid bg-blue-500/10"
            style={{
              width: debugInfo.availableSpace.width,
              height: debugInfo.availableSpace.height,
              left: (containerWidth - debugInfo.availableSpace.width) / 2,
              top: (containerHeight - debugInfo.availableSpace.height) / 2
            }}
          />
          
          {/* 边界违规指示器 */}
          {debugInfo.boundaryValidation.violations.map((violation, index) => (
            <div
              key={index}
              className="absolute bg-red-500/30 border border-red-500"
              style={{
                left: violation.position.x,
                top: violation.position.y,
                width: 96, // 默认卡牌宽度
                height: 144 // 默认卡牌高度
              }}
            >
              <div className="absolute -top-6 left-0 text-xs text-red-500 bg-white px-1 rounded">
                {violation.violation}: {violation.overflow.toFixed(1)}px
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 卡牌位置指示器 */}
      {showPositions && (
        <div className="absolute inset-0">
          {cardPositions.map((position, index) => (
            <div key={index} className="absolute">
              {/* 卡牌位置框 */}
              <div
                className="absolute border border-green-500 bg-green-500/20"
                style={{
                  left: position.x,
                  top: position.y,
                  width: position.cardWidth,
                  height: position.cardHeight,
                  transform: `rotate(${position.rotation}deg)`
                }}
              />
              
              {/* 中心点指示器 */}
              <div
                className="absolute w-2 h-2 bg-green-500 rounded-full"
                style={{
                  left: position.x + position.cardWidth / 2 - 4,
                  top: position.y + position.cardHeight / 2 - 4
                }}
              />
              
              {/* 位置标签 */}
              <div
                className="absolute text-xs text-green-500 bg-white px-1 rounded"
                style={{
                  left: position.x,
                  top: position.y - 20
                }}
              >
                #{index + 1} ({position.x.toFixed(0)}, {position.y.toFixed(0)})
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 调试控制面板 */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Position Debug
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle?.(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>

          {/* 切换控件 */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={(e) => setShowBoundaries(e.target.checked)}
                className="w-3 h-3"
              />
              <Grid className="w-3 h-3" />
              Boundaries
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showPositions}
                onChange={(e) => setShowPositions(e.target.checked)}
                className="w-3 h-3"
              />
              <Target className="w-3 h-3" />
              Positions
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showMetrics}
                onChange={(e) => setShowMetrics(e.target.checked)}
                className="w-3 h-3"
              />
              <Ruler className="w-3 h-3" />
              Metrics
            </label>
          </div>

          {/* 指标显示 */}
          {showMetrics && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Container:</span>
                  <div className="font-mono">{containerWidth}×{containerHeight}</div>
                </div>
                <div>
                  <span className="text-gray-600">Available:</span>
                  <div className="font-mono">
                    {debugInfo.availableSpace.width}×{debugInfo.availableSpace.height}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Cards:</span>
                  <div className="font-mono">{debugInfo.positionMetrics.totalCards}</div>
                </div>
                <div>
                  <span className="text-gray-600">Valid:</span>
                  <div className="font-mono text-green-600">
                    {debugInfo.positionMetrics.validPositions}
                  </div>
                </div>
              </div>
              
              {debugInfo.positionMetrics.invalidPositions > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{debugInfo.positionMetrics.invalidPositions} invalid positions</span>
                </div>
              )}
              
              <div>
                <span className="text-gray-600">Utilization:</span>
                <div className="font-mono">
                  {debugInfo.positionMetrics.utilizationRate.toFixed(1)}%
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Avg Spacing:</span>
                <div className="font-mono">
                  {debugInfo.positionMetrics.averageSpacing.toFixed(1)}px
                </div>
              </div>
              
              {!debugInfo.boundaryValidation.isValid && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-600 font-semibold text-xs mb-1">
                    Boundary Violations:
                  </div>
                  {debugInfo.boundaryValidation.violations.slice(0, 3).map((violation, index) => (
                    <div key={index} className="text-xs text-red-600">
                      Card #{violation.cardIndex + 1}: {violation.violation} by {violation.overflow.toFixed(1)}px
                    </div>
                  ))}
                  {debugInfo.boundaryValidation.violations.length > 3 && (
                    <div className="text-xs text-red-500">
                      +{debugInfo.boundaryValidation.violations.length - 3} more...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 调试工具切换按钮
export function DebugToggleButton({ 
  isVisible, 
  onToggle 
}: { 
  isVisible: boolean
  onToggle: (visible: boolean) => void 
}) {
  // 只在开发模式下显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onToggle(!isVisible)}
      className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-sm"
    >
      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      <span className="ml-2">Debug</span>
    </Button>
  )
}