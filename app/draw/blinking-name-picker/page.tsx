"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { BlinkingNamePicker } from "@/components/blinking-name-picker"
import { DrawResultModal } from "@/components/draw-result-modal"
import type { DrawingConfig, ListItem } from "@/types"
import type { DrawResult } from "@/lib/draw-utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { loadAndMigrateConfig } from "@/lib/config-migration"
import { soundManager } from "@/lib/sound-manager"
import { getCurrentExperienceSession } from "@/lib/experience-manager"
import ExperienceFeedback from "@/components/experience-feedback"
import ErrorBoundary from "@/components/error-boundary"

export default function BlinkingNamePickerPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [config, setConfig] = useState<DrawingConfig | null>(null)
  const [winners, setWinners] = useState<ListItem[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameKey, setGameKey] = useState(0) // 用于强制重新渲染
  const [isExperienceMode, setIsExperienceMode] = useState(false)
  const [experienceSession, setExperienceSession] = useState<any>(null)
  const [showExperienceFeedback, setShowExperienceFeedback] = useState(false)
  
  // 用于管理定时器的ref
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      // 检查是否为体验模式
      const experienceSession = getCurrentExperienceSession()
      console.log('Experience session:', experienceSession)
      
      if (experienceSession && experienceSession.isDemo) {
        console.log('Loading experience mode with config:', experienceSession.config)
        
        // 验证配置数据
        if (!experienceSession.config || 
            !experienceSession.config.items || 
            !Array.isArray(experienceSession.config.items) ||
            experienceSession.config.items.length === 0) {
          console.error('Invalid experience config:', experienceSession.config)
          toast({
            title: t('blinkingNamePicker.experienceDataError'),
            description: t('blinkingNamePicker.experienceDataErrorDescription'),
            variant: "destructive",
          })
          router.push("/")
          return
        }

        // 验证模板数据
        if (!experienceSession.template || !experienceSession.template.name) {
          console.error('Invalid experience template:', experienceSession.template)
          toast({
            title: t('blinkingNamePicker.experienceTemplateError'),
            description: t('blinkingNamePicker.experienceTemplateErrorDescription'),
            variant: "destructive",
          })
          router.push("/")
          return
        }
        
        setIsExperienceMode(true)
        setExperienceSession(experienceSession)
        setConfig(experienceSession.config)
        setIsLoading(false)
        
        // 显示体验开始提示
        toast({
          title: t('blinkingNamePicker.welcomeExperience', { name: experienceSession.template.name }),
          description: t('blinkingNamePicker.welcomeExperienceDescription'),
        })
      } else {
        // 常规模式：使用迁移函数加载配置
        const migratedConfig = loadAndMigrateConfig("draw-config")
        console.log('Loading regular mode with config:', migratedConfig)
        
        if (migratedConfig) {
          if (migratedConfig.mode === "blinking-name-picker") {
            setConfig(migratedConfig)
          } else {
            // 配置模式不匹配，跳转回配置页面
            router.push("/draw-config")
            return
          }
        } else {
          // 没有配置，跳转回配置页面
          router.push("/draw-config")
          return
        }
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        title: t('blinkingNamePicker.loadFailed'),
        description: t('blinkingNamePicker.loadFailedDescription'),
        variant: "destructive",
      })
      router.push("/")
    }

    // 页面卸载时清理所有音效和定时器
    return () => {
      soundManager.stopAll()
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
        feedbackTimerRef.current = null
      }
    }
  }, [router, toast])

  const handleComplete = (selectedWinners: ListItem[]) => {
    setWinners(selectedWinners)
    setShowResult(true)
    // 确保在显示结果对话框时停止所有音效
    soundManager.stopAll()
    
    // 如果是体验模式，延迟显示反馈
    if (isExperienceMode) {
      // 清除之前的定时器
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
      }
      
      feedbackTimerRef.current = setTimeout(() => {
        // 检查组件是否仍然挂载
        setShowResult(false)
        setShowExperienceFeedback(true)
        feedbackTimerRef.current = null
      }, 3000) // 3秒后显示体验反馈
    }
  }

  const handleDrawAgain = () => {
    setWinners([])
    setShowResult(false)
    // 确保在"再抽一次"时停止所有音效
    soundManager.stopAll()
    setGameKey(prev => prev + 1) // 强制重新渲染组件，实现重启
  }

  const handleReset = () => {
    setWinners([])
    setShowResult(false)
    // 确保在重新开始时停止所有音效
    soundManager.stopAll()
    setGameKey(prev => prev + 1) // 强制重新渲染组件，实现完全重置
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const getDrawResult = (): DrawResult => ({
    winners,
    timestamp: new Date().toISOString(),
    mode: t('blinkingNamePicker.title'),
    totalItems: config?.items.length || 0,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('blinkingNamePicker.loading')}</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('blinkingNamePicker.configLoadFailed')}</p>
          <Button onClick={() => router.push("/draw-config")} className="mt-4">
            {t('blinkingNamePicker.backToConfig')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.stopAll() // 返回前停止所有音效
                if (isExperienceMode) {
                  router.push("/") // 体验模式返回首页
                } else {
                  router.push("/draw-config") // 常规模式返回配置页面
                }
              }}
              className="text-gray-600 hover:text-purple-600 transition-all duration-200"
              title={isExperienceMode ? t('blinkingNamePicker.backToHome') : t('blinkingNamePicker.backToConfigPage')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isExperienceMode ? t('blinkingNamePicker.backToHome') : t('blinkingNamePicker.backToConfig')}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-2xl font-bold text-gray-800">{t('blinkingNamePicker.title')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config && (
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600 mr-4">
                <span>{t('blinkingNamePicker.participants', { count: config.items.length })}</span>
                <span>{t('blinkingNamePicker.drawCount', { count: config.quantity })}</span>
                <span>{config.allowRepeat ? t('blinkingNamePicker.allowRepeat') : t('blinkingNamePicker.noRepeat')}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-gray-600 hover:text-purple-600 transition-all duration-200"
              title={t('blinkingNamePicker.restartTooltip')}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('blinkingNamePicker.restart')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {config && (
            <ErrorBoundary>
              <BlinkingNamePicker
                key={gameKey} // 使用 key 强制重新渲染
                items={config.items}
                quantity={config.quantity}
                allowRepeat={config.allowRepeat}
                onComplete={handleComplete}
                soundEnabled={true}
                autoStart={false}
                className="w-full"
              />
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <DrawResultModal
        result={getDrawResult()}
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        onDrawAgain={handleDrawAgain}
        onGoHome={handleGoHome}
      />

      {/* Experience Feedback Modal */}
      {isExperienceMode && experienceSession && experienceSession.template && (
        <ExperienceFeedback
          isOpen={showExperienceFeedback}
          onClose={() => setShowExperienceFeedback(false)}
          sessionId={experienceSession.templateId || 'unknown'}
          templateName={experienceSession.template.name || '未知模板'}
        />
      )}

      <Toaster />
    </div>
  )
}