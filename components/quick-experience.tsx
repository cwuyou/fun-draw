"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Play, Sparkles, Users, Clock, ArrowRight, Star } from 'lucide-react'
import { ExperienceTemplate } from '@/types'
import { createExperienceTemplates } from '@/lib/experience-templates'
import { createExperienceSession, getRecommendedTemplates, isFirstTimeUser } from '@/lib/experience-manager'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface QuickExperienceProps {
  onExperienceStart?: (template: ExperienceTemplate) => void
  className?: string
  variant?: 'button' | 'card' | 'modal'
}

export default function QuickExperience({ 
  onExperienceStart, 
  className = '',
  variant = 'button'
}: QuickExperienceProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<ExperienceTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [recommendedTemplates, setRecommendedTemplates] = useState<ExperienceTemplate[]>([])
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [allTemplates, setAllTemplates] = useState<ExperienceTemplate[]>([])

  useEffect(() => {
    // 加载推荐模板和用户状态
    const loadRecommendations = async () => {
      try {
        const templates = createExperienceTemplates(t)
        setAllTemplates(templates)
        
        const recommended = getRecommendedTemplates(6, t)
        setRecommendedTemplates(recommended)
        setIsFirstTime(isFirstTimeUser())
      } catch (error) {
        console.error('Failed to load recommendations:', error)
        const templates = createExperienceTemplates(t)
        setAllTemplates(templates)
        setRecommendedTemplates(templates.slice(0, 6))
      }
    }

    loadRecommendations()
  }, [t])

  const handleTemplateSelect = async (template: ExperienceTemplate) => {
    setIsLoading(true)
    setSelectedTemplate(template)

    try {
      // 创建体验会话
      const session = createExperienceSession(template.id, t)
      if (!session) {
        throw new Error('Failed to create experience session')
      }

      // 清除可能存在的旧数据
      localStorage.removeItem("temp-draw-list")
      localStorage.removeItem("selected-draw-list")

      // 使用会话中的配置，确保一致性
      const experienceConfig = session.config

      // 保存体验配置到localStorage，供抽奖页面使用
      localStorage.setItem("draw-config", JSON.stringify(experienceConfig))
      
      console.log('Saved experience config:', experienceConfig)
      console.log('Template items:', template.items)

      // 显示开始提示
      toast({
        title: t('quickExperience.experienceStart'),
        description: t('quickExperience.experienceStartDescription', { name: template.name }),
      })

      // 调用回调函数
      if (onExperienceStart) {
        onExperienceStart(template)
      }

      // 直接跳转到对应的抽奖页面
      setTimeout(() => {
        router.push(`/draw/${template.suggestedMode}`)
      }, 1000)

    } catch (error) {
      console.error('Failed to start experience:', error)
      toast({
        title: t('quickExperience.startFailed'),
        description: t('quickExperience.startFailedDescription'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowTemplateModal(false)
    }
  }

  const handleQuickStart = () => {
    // 快速开始：使用最推荐的模板
    if (recommendedTemplates.length > 0) {
      handleTemplateSelect(recommendedTemplates[0])
    }
  }

  const renderTemplateCard = (template: ExperienceTemplate, isRecommended: boolean = false) => {
    const IconComponent = template.icon as React.ComponentType<{ className?: string }>
    
    return (
      <Card
        key={template.id}
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden ${
          selectedTemplate?.id === template.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
        } ${isRecommended ? 'border-purple-200 bg-purple-50/30' : ''}`}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2 flex-wrap">
                  <span className="truncate">{template.name}</span>
                  {isRecommended && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs flex-shrink-0">
                      <Star className="w-3 h-3 mr-1" />
                      {t('quickExperience.recommended')}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1 overflow-hidden break-words" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {template.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 场景信息 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {t('quickExperience.exampleCount', { count: template.items.length })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('quickExperience.experienceTime')}
              </span>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-1 overflow-hidden">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs truncate max-w-20">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* 示例名称预览 */}
            <div className="text-xs text-gray-400 truncate break-words">
              {t('quickExperience.examplePreview', { preview: template.items.slice(0, 3).map(item => item.name).join('、') })}
              {template.items.length > 3 && '...'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 按钮变体
  if (variant === 'button') {
    return (
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className={`border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg bg-transparent ${className}`}
            disabled={isLoading}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isLoading ? t('quickExperience.starting') : t('quickExperience.oneClickExperience')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {t('quickExperience.selectScene')}
            </DialogTitle>
            <DialogDescription>
              {isFirstTime 
                ? t('quickExperience.welcomeFirstTime')
                : t('quickExperience.welcomeReturning')
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 快速开始选项 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{t('quickExperience.quickStart')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('quickExperience.quickStartDescription')}
                  </p>
                </div>
                <Button
                  onClick={handleQuickStart}
                  disabled={isLoading || recommendedTemplates.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t('quickExperience.startNow')}
                </Button>
              </div>
            </div>

            {/* 推荐模板 */}
            {recommendedTemplates.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {t('quickExperience.forYouRecommended')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedTemplates.slice(0, 4).map(template => 
                    renderTemplateCard(template, true)
                  )}
                </div>
              </div>
            )}

            {/* 所有模板 */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">{t('quickExperience.allScenes')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allTemplates.map(template => 
                  renderTemplateCard(template, false)
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // 卡片变体
  if (variant === 'card') {
    return (
      <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {t('quickExperience.title')}
          </CardTitle>
          <CardDescription>
            {t('quickExperience.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {recommendedTemplates.slice(0, 3).map(template => {
              const IconComponent = template.icon as React.ComponentType<{ className?: string }>
              return (
                <div
                  key={template.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors overflow-hidden"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{template.name}</div>
                    <div className="text-sm text-gray-500 truncate break-words">{template.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            className="w-full mt-4 border-purple-200 text-purple-600 hover:bg-purple-50"
            onClick={() => setShowTemplateModal(true)}
          >
            {t('quickExperience.viewMoreScenes')}
          </Button>
        </CardContent>
        
        {/* Dialog for card variant */}
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {t('quickExperience.selectScene')}
              </DialogTitle>
              <DialogDescription>
                {isFirstTime 
                  ? t('quickExperience.welcomeFirstTime')
                  : t('quickExperience.welcomeReturning')
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 快速开始选项 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{t('quickExperience.quickStart')}</h3>
                    <p className="text-sm text-gray-600">
                      {t('quickExperience.quickStartDescription')}
                    </p>
                  </div>
                  <Button
                    onClick={handleQuickStart}
                    disabled={isLoading || recommendedTemplates.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('quickExperience.startNow')}
                  </Button>
                </div>
              </div>

              {/* 推荐模板 */}
              {recommendedTemplates.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {t('quickExperience.forYouRecommended')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedTemplates.slice(0, 4).map(template => 
                      renderTemplateCard(template, true)
                    )}
                  </div>
                </div>
              )}

              {/* 所有模板 */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">{t('quickExperience.allScenes')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allTemplates.map(template => 
                    renderTemplateCard(template, false)
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // 模态框变体（独立使用）
  return (
    <div className={className}>
      {/* 模态框内容已在上面的Dialog中实现 */}
    </div>
  )
}