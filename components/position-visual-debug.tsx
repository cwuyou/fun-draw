'use client'

import React, { useState, useEffect } from 'react'
import { CardPosition } from '@/types'

interface PositionVisualDebugProps {
  positions: CardPosition[]
  containerWidth: number
  containerHeight: number
  isVisible?: boolean
  className?: string
}

export function PositionVisualDebug({
  positions,
  containerWidth,
  containerHeight,
  isVisible = false,
  className = ''
}: PositionVisualDebugProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showBounds, setShowBounds] = useState(true)

  if (!isVisible) return null

  // 计算缩放比例以适应调试面板
  const debugWidth = 300
  const debugHeight = 200
  const scaleX = debugWidth / containerWidth
  const scaleY = debugHeight / containerHeight
  const scale = Math.min(scaleX, scaleY)

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      {/* 控制面板 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white">位置可视化</h4>
        <div className="flex items-center space-x-2 text-xs">
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="mr-1 w-3 h-3"
            />
            网格
          </label>
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="mr-1 w-3 h-3"
            />
            标签
          </label>
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={showBounds}
              onChange={(e) => setShowBounds(e.target.checked)}
              className="mr-1 w-3 h-3"
            />
            边界
          </label>
        </div>
      </div>

      {/* 可视化区域 */}
      <div className="relative bg-gray-800 rounded border border-gray-600">
        <svg
          width={debugWidth}
          height={debugHeight}
          viewBox={`0 0 ${debugWidth} ${debugHeight}`}
          className="w-full h-full"
        >
          {/* 网格 */}
          {showGrid && (
            <g>
              <defs>
                <pattern
                  id="grid"
                  width={20 * scale}
                  height={20 * scale}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${20 * scale} 0 L 0 0 0 ${20 * scale}`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </g>
          )}

          {/* 容器边界 */}
          {showBounds && (
            <rect
              x={0}
              y={0}
              width={containerWidth * scale}
              height={containerHeight * scale}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* 卡牌位置 */}
          {positions.map((position, index) => {
            const x = (position.x + containerWidth / 2) * scale - (position.cardWidth * scale) / 2
            const y = (position.y + containerHeight / 2) * scale - (position.cardHeight * scale) / 2
            const width = position.cardWidth * scale
            const height = position.cardHeight * scale

            return (
              <g key={index}>
                {/* 卡牌矩形 */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={position.isFallback ? '#fbbf24' : '#3b82f6'}
                  fillOpacity="0.6"
                  stroke={position.isFallback ? '#f59e0b' : '#2563eb'}
                  strokeWidth="1"
                  transform={`rotate(${position.rotation} ${x + width/2} ${y + height/2})`}
                />

                {/* 中心点 */}
                <circle
                  cx={(position.x + containerWidth / 2) * scale}
                  cy={(position.y + containerHeight / 2) * scale}
                  r="2"
                  fill={position.isFallback ? '#f59e0b' : '#2563eb'}
                />

                {/* 标签 */}
                {showLabels && (
                  <text
                    x={(position.x + containerWidth / 2) * scale}
                    y={(position.y + containerHeight / 2) * scale - 5}
                    textAnchor="middle"
                    className="text-xs fill-white"
                    fontSize="10"
                  >
                    {index}
                  </text>
                )}

                {/* 错误指示器 */}
                {position.validationError && (
                  <circle
                    cx={(position.x + containerWidth / 2) * scale + width/2 - 5}
                    cy={(position.y + containerHeight / 2) * scale - height/2 + 5}
                    r="3"
                    fill="#ef4444"
                  />
                )}
              </g>
            )
          })}

          {/* 中心线 */}
          <g stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2">
            <line
              x1={containerWidth * scale / 2}
              y1={0}
              x2={containerWidth * scale / 2}
              y2={containerHeight * scale}
            />
            <line
              x1={0}
              y1={containerHeight * scale / 2}
              x2={containerWidth * scale}
              y2={containerHeight * scale / 2}
            />
          </g>
        </svg>

        {/* 信息覆盖层 */}
        <div className="absolute top-2 left-2 text-xs text-gray-300 space-y-1">
          <div>容器: {containerWidth}×{containerHeight}</div>
          <div>卡牌: {positions.length}</div>
          <div>缩放: {(scale * 100).toFixed(1)}%</div>
          {positions.some(p => p.isFallback) && (
            <div className="text-yellow-400">⚠ 包含降级位置</div>
          )}
          {positions.some(p => p.validationError) && (
            <div className="text-red-400">❌ 包含验证错误</div>
          )}
        </div>
      </div>

      {/* 位置详情 */}
      <div className="mt-3 max-h-32 overflow-y-auto">
        <div className="text-xs text-gray-300 space-y-1">
          {positions.map((position, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-1 rounded ${
                position.isFallback ? 'bg-yellow-900/30' : 'bg-gray-700/30'
              }`}
            >
              <span>#{index}</span>
              <span>
                ({position.x.toFixed(0)}, {position.y.toFixed(0)})
              </span>
              <span>{position.rotation.toFixed(0)}°</span>
              <span className="text-xs">
                {position.cardWidth}×{position.cardHeight}
              </span>
              {position.isFallback && (
                <span className="text-yellow-400 text-xs">FB</span>
              )}
              {position.validationError && (
                <span className="text-red-400 text-xs">ERR</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 位置比较可视化组件
interface PositionComparisonProps {
  beforePositions: CardPosition[]
  afterPositions: CardPosition[]
  containerWidth: number
  containerHeight: number
  isVisible?: boolean
  className?: string
}

export function PositionComparison({
  beforePositions,
  afterPositions,
  containerWidth,
  containerHeight,
  isVisible = false,
  className = ''
}: PositionComparisonProps) {
  if (!isVisible) return null

  const debugWidth = 300
  const debugHeight = 150
  const scaleX = debugWidth / containerWidth
  const scaleY = debugHeight / containerHeight
  const scale = Math.min(scaleX, scaleY)

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-white mb-3">位置变化对比</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* 变化前 */}
        <div>
          <h5 className="text-xs text-gray-400 mb-2">变化前</h5>
          <div className="relative bg-gray-800 rounded border border-gray-600">
            <svg width={debugWidth/2} height={debugHeight} className="w-full h-full">
              {beforePositions.map((position, index) => {
                const x = (position.x + containerWidth / 2) * scale / 2 - (position.cardWidth * scale) / 4
                const y = (position.y + containerHeight / 2) * scale - (position.cardHeight * scale) / 2
                const width = position.cardWidth * scale / 2
                const height = position.cardHeight * scale / 2

                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#6b7280"
                    fillOpacity="0.6"
                    stroke="#9ca3af"
                    strokeWidth="1"
                    transform={`rotate(${position.rotation} ${x + width/2} ${y + height/2})`}
                  />
                )
              })}
            </svg>
          </div>
        </div>

        {/* 变化后 */}
        <div>
          <h5 className="text-xs text-gray-400 mb-2">变化后</h5>
          <div className="relative bg-gray-800 rounded border border-gray-600">
            <svg width={debugWidth/2} height={debugHeight} className="w-full h-full">
              {afterPositions.map((position, index) => {
                const x = (position.x + containerWidth / 2) * scale / 2 - (position.cardWidth * scale) / 4
                const y = (position.y + containerHeight / 2) * scale - (position.cardHeight * scale) / 2
                const width = position.cardWidth * scale / 2
                const height = position.cardHeight * scale / 2

                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={position.isFallback ? '#fbbf24' : '#3b82f6'}
                    fillOpacity="0.6"
                    stroke={position.isFallback ? '#f59e0b' : '#2563eb'}
                    strokeWidth="1"
                    transform={`rotate(${position.rotation} ${x + width/2} ${y + height/2})`}
                  />
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 变化统计 */}
      <div className="mt-3 text-xs text-gray-300">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-gray-400">移动:</span>
            <span className="ml-1">
              {afterPositions.filter((pos, i) => 
                beforePositions[i] && 
                (Math.abs(pos.x - beforePositions[i].x) > 1 || Math.abs(pos.y - beforePositions[i].y) > 1)
              ).length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">旋转:</span>
            <span className="ml-1">
              {afterPositions.filter((pos, i) => 
                beforePositions[i] && Math.abs(pos.rotation - beforePositions[i].rotation) > 1
              ).length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">降级:</span>
            <span className="ml-1 text-yellow-400">
              {afterPositions.filter(pos => pos.isFallback).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}