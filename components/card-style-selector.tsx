"use client"

import * as React from "react"
import { CardStyle, CARD_STYLES } from "@/lib/card-styles"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface CardStyleSelectorProps {
  selectedStyle: CardStyle
  onStyleChange: (style: CardStyle) => void
  className?: string
}

export function CardStyleSelector({ 
  selectedStyle, 
  onStyleChange, 
  className 
}: CardStyleSelectorProps) {
  const handleValueChange = (value: string) => {
    const style = CARD_STYLES.find(s => s.id === value)
    if (style) {
      onStyleChange(style)
    }
  }

  return (
    <div className={className}>
      <Label htmlFor="card-style-select" className="text-sm font-medium">
        卡牌样式
      </Label>
      <Select value={selectedStyle.id} onValueChange={handleValueChange}>
        <SelectTrigger id="card-style-select" className="w-full mt-2">
          <SelectValue placeholder="选择卡牌样式" />
        </SelectTrigger>
        <SelectContent>
          {CARD_STYLES.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              <div className="flex items-center gap-3">
                <div 
                  className={`w-6 h-4 rounded-sm ${style.backDesign}`}
                  aria-hidden="true"
                />
                <span>{style.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// 预览组件，用于显示卡牌样式效果
interface CardStylePreviewProps {
  style: CardStyle
  className?: string
}

export function CardStylePreview({ style, className }: CardStylePreviewProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {/* 卡牌背面预览 */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className={`w-16 h-24 rounded-lg ${style.backDesign} shadow-md flex items-center justify-center`}
        >
          <div className="w-8 h-8 border-2 border-white/30 rounded-full" />
        </div>
        <span className="text-xs text-muted-foreground">背面</span>
      </div>
      
      {/* 卡牌正面预览 */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className={`w-16 h-24 rounded-lg ${style.frontTemplate} shadow-md flex items-center justify-center`}
        >
          <div className="text-xs font-medium text-center px-2">
            示例
          </div>
        </div>
        <span className="text-xs text-muted-foreground">正面</span>
      </div>
    </div>
  )
}