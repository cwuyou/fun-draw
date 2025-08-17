"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  Star, 
  Users, 
  ArrowRight, 
  Check, 
  Info,
  Sparkles,
  Clock,
  Target
} from 'lucide-react'
import { ListItem, DrawingConfig, ConfigurationTemplate } from '@/types'
import { 
  createQuickConfigTemplates, 
  getSmartRecommendations, 
  getMostUsedConfigs,
  recordConfigUsage,
  calculateAutoQuantity
} from '@/lib/quick-config-templates'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/use-translation'

interface QuickConfigurationProps {
  items: ListItem[]
  onConfigSelect: (config: DrawingConfig) => void
  className?: string
  showRecommendations?: boolean
  maxRecommendations?: number
}

export default function QuickConfiguration({
  items,
  onConfigSelect,
  className = '',
  showRecommendations = true,
  maxRecommendations = 4
}: QuickConfigurationProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [selectedConfig, setSelectedConfig] = useState<ConfigurationTemplate | null>(null)
  const [recommendations, setRecommendations] = useState<ConfigurationTemplate[]>([])
  const [mostUsed, setMostUsed] = useState<ConfigurationTemplate[]>([])
  const [allTemplates, setAllTemplates] = useState<ConfigurationTemplate[]>([])
  const [isApplying, setIsApplying] = useState(false)

  // 加载推荐配置
  useEffect(() => {
    const templates = createQuickConfigTemplates(t)
    setAllTemplates(templates)
    
    if (items.length > 0) {
      const smartRecs = getSmartRecommendations(items.length, t, maxRecommendations)
      setRecommendations(smartRecs)
    }
    
    const mostUsedConfigs = getMostUsedConfigs(t, 3)
    setMostUsed(mostUsedConfigs)
  }, [items.length, maxRecommendations, t])

  // 应用配置
  const handleApplyConfig = async (template: ConfigurationTemplate) => {
    if (items.length === 0) {
      toast({
        title: t('quickConfig.cannotApply'),
        description: t('quickConfig.addParticipantsFirst'),
        variant: "destructive",
      })
      return
    }

    setIsApplying(true)
    setSelectedConfig(template)

    try {
      // 计算实际数量
      let actualQuantity = template.quantity
      if (template.quantity === 'auto') {
        actualQuantity = calculateAutoQuantity(items.length, template.scenario)
      }

      // 验证数量合理性
      if (typeof actualQuantity === 'number') {
        if (actualQuantity > items.length && !template.allowRepeat) {
          actualQuantity = items.length
        }
        if (actualQuantity < 1) {
          actualQuantity = 1
        }
      }

      // 创建配置对象
      const config: DrawingConfig = {
        mode: template.mode,
        quantity: actualQuantity as number,
        allowRepeat: template.allowRepeat,
        items: items
      }

      // 记录使用统计
      recordConfigUsage(template.id)

      // 应用配置
      onConfigSelect(config)

      toast({
        title: t('quickConfig.configApplied'),
        description: t('quickConfig.configAppliedDesc', { name: template.name, quantity: actualQuantity }),
      })

    } catch (error) {
      console.error('Failed to apply config:', error)
      toast({
        title: t('quickConfig.applyFailed'),
        description: t('quickConfig.applyError'),
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
      setTimeout(() => setSelectedConfig(null), 2000)
    }
  }

  // 渲染配置卡片
  const renderConfigCard = (template: ConfigurationTemplate, isRecommended: boolean = false) => {
    const IconComponent = template.icon as React.ComponentType<{ className?: string }>
    const isSelected = selectedConfig?.id === template.id
    const isApplied = isSelected && !isApplying
    
    // 计算显示数量
    let displayQuantity = template.quantity
    if (template.quantity === 'auto' && items.length > 0) {
      displayQuantity = calculateAutoQuantity(items.length, template.scenario)
    }

    return (
      <Card
        key={template.id}
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          isSelected 
            ? 'ring-2 ring-purple-500 bg-purple-50' 
            : 'hover:bg-gray-50'
        } ${isRecommended ? 'border-purple-200 bg-purple-50/30' : ''}`}
        onClick={() => handleApplyConfig(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  {template.name}
                  {isRecommended && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                      <Star className="w-3 h-3 mr-1" />
{t('quickConfig.recommended')}
                    </Badge>
                  )}
                  {isApplied && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      <Check className="w-3 h-3 mr-1" />
{t('quickConfig.applied')}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {template.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Configuration info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 flex-shrink-0">{t('quickConfig.drawQuantity')}：</span>
                <span className="font-medium text-purple-600 truncate">
                  {displayQuantity === 'auto' ? t('quickConfig.intelligent') : displayQuantity}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 flex-shrink-0">{t('quickConfig.allowRepeat')}：</span>
                <span className="font-medium truncate">
                  {template.allowRepeat ? t('quickConfig.yes') : t('quickConfig.notAllow')}
                </span>
              </div>
            </div>

            {/* Mode info */}
            <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span className="flex-shrink-0">{t('quickConfig.drawMode')}：</span>
              <span className="truncate">{getModeDisplayName(template.mode)}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Applicability hint */}
            {items.length > 0 && (
              <div className="text-xs text-gray-400">
                {getApplicabilityHint(template, items.length)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 获取模式显示名称
  const getModeDisplayName = (mode: string): string => {
    const modeNames = {
      'slot-machine': t('quickConfig.modes.slotMachine'),
      'card-flip': t('quickConfig.modes.cardFlip'),
      'bullet-screen': t('quickConfig.modes.bulletScreen'),
      'grid-lottery': t('quickConfig.modes.gridLottery'),
      'blinking-name-picker': t('quickConfig.modes.blinkingNamePicker')
    }
    return modeNames[mode as keyof typeof modeNames] || mode
  }

  // 获取适用性提示
  const getApplicabilityHint = (template: ConfigurationTemplate, itemCount: number): string => {
    const quantity = template.quantity === 'auto' 
      ? calculateAutoQuantity(itemCount, template.scenario)
      : template.quantity

    if (typeof quantity === 'number') {
      if (quantity > itemCount && !template.allowRepeat) {
        return t('quickConfig.recommendAtLeast', { count: quantity })
      }
      if (quantity === 1 && itemCount > 20) {
        return t('quickConfig.suitableForLargeGroup')
      }
      if (quantity > 1 && itemCount < 5) {
        return t('quickConfig.fewParticipants')
      }
    }
    
    return t('quickConfig.suitableForParticipants', { count: itemCount })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title and description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-purple-600" />
{t('quickConfig.title')}
        </h2>
        <p className="text-gray-600">
          {t('quickConfig.description')}
        </p>
      </div>

      {/* Participant info */}
      {items.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription dangerouslySetInnerHTML={{
            __html: t('quickConfig.currentListInfo', { count: items.length })
          }} />
        </Alert>
      )}

      {/* Smart recommendations */}
      {showRecommendations && recommendations.length > 0 && items.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
{t('quickConfig.smartRecommendations')}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.map(template => 
              renderConfigCard(template, true)
            )}
          </div>
        </div>
      )}

      {/* Frequently used configs */}
      {mostUsed.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
{t('quickConfig.frequentConfigs')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {mostUsed.map(template => 
              renderConfigCard(template, false)
            )}
          </div>
        </div>
      )}

      {/* All templates */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">{t('quickConfig.allTemplates')}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map(template => 
            renderConfigCard(template, false)
          )}
        </div>
      </div>

      {/* Usage hint */}
      {items.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('quickConfig.addParticipantsHint')}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isApplying && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="font-medium">{t('quickConfig.applyingConfig')}</span>
          </div>
        </div>
      )}
    </div>
  )
}