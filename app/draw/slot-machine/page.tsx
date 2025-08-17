"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, ArrowLeft, Volume2, VolumeX, Dices, Users, Hash } from "lucide-react"
import type { DrawingConfig, ListItem } from "@/types"
import type { DrawResult } from "@/lib/draw-utils"
import { performDraw } from "@/lib/draw-utils"
import { SlotMachineReel } from "@/components/slot-machine-reel"
import { DrawResultModal } from "@/components/draw-result-modal"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useTranslation } from "@/hooks/use-translation"
import { soundManager } from "@/lib/sound-manager"
import { loadAndMigrateConfig } from "@/lib/config-migration"
import { getCurrentExperienceSession } from "@/lib/experience-manager"
import ExperienceFeedback from "@/components/experience-feedback"

type DrawState = "idle" | "spinning" | "stopping" | "finished"

export default function SlotMachineDrawPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  const [config, setConfig] = useState<DrawingConfig | null>(null)
  const [drawState, setDrawState] = useState<DrawState>("idle")
  const [winners, setWinners] = useState<ListItem[]>([])
  const [showResult, setShowResult] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [progress, setProgress] = useState(0)
  const [completedReels, setCompletedReels] = useState(0)
  const [isExperienceMode, setIsExperienceMode] = useState(false)
  const [experienceSession, setExperienceSession] = useState<any>(null)
  const [showExperienceFeedback, setShowExperienceFeedback] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false) // 跟踪游戏是否已完成
  const [resultViewed, setResultViewed] = useState(false) // 跟踪结果是否已被查看

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadDrawConfig()

    // 设置音效管理器的音效开关
    soundManager.setEnabled(soundEnabled)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      // 停止所有音效
      soundManager.stopAll()
    }
  }, [])

  // 监听音效开关变化
  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
    if (!soundEnabled) {
      soundManager.stopAll()
    }
  }, [soundEnabled])

  const loadDrawConfig = () => {
    try {
      // 检查是否为体验模式
      const experienceSession = getCurrentExperienceSession()
      if (experienceSession && experienceSession.isDemo) {
        if (experienceSession.config.mode === "slot-machine") {
          setIsExperienceMode(true)
          setExperienceSession(experienceSession)
          setConfig(experienceSession.config)
          
          // 显示体验开始提示
          toast({
            title: t('slotMachine.welcomeExperience', { name: experienceSession.template.name }),
            description: t('slotMachine.demoDescription'),
          })
          return
        }
      }

      // 常规模式：使用迁移函数加载配置
      const migratedConfig = loadAndMigrateConfig("draw-config")
      if (!migratedConfig) {
        toast({
          title: t('slotMachine.configLost'),
          description: t('slotMachine.reconfigureRequired'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      const parsedConfig: DrawingConfig = migratedConfig
      if (parsedConfig.mode !== "slot-machine") {
        toast({
          title: t('slotMachine.modeError'),
          description: t('slotMachine.slotMachineOnly'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      setConfig(parsedConfig)
    } catch (error) {
      toast({
        title: t('slotMachine.loadFailed'),
        description: t('slotMachine.configLoadError'),
        variant: "destructive",
      })
      router.push("/draw-config")
    }
  }

  const playSound = (type: "spin" | "stop" | "win") => {
    if (!soundEnabled) return
    soundManager.play(type)
  }

  const startDraw = () => {
    if (!config || drawState !== "idle") return

    // 清理之前可能存在的定时器
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // 执行抽奖逻辑
    const drawWinners = performDraw(config)
    setWinners(drawWinners)
    setDrawState("spinning")
    setProgress(0)
    setCompletedReels(0)

    playSound("spin")

    // 开始进度条动画
    let currentProgress = 0
    progressIntervalRef.current = setInterval(() => {
      currentProgress += 2
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setDrawState("stopping")
      }
    }, 100)
  }

  const handleReelComplete = () => {
    setCompletedReels(prev => {
      const newCompletedReels = prev + 1
      console.log(`滚轮完成回调触发，当前完成数量: ${newCompletedReels}/${config!.quantity}`)
      
      // 播放停止音效
      playSound("stop")
      
      if (newCompletedReels >= config!.quantity) {
        console.log("所有滚轮完成，设置状态为finished")
        setDrawState("finished")
        setGameCompleted(true) // 标记游戏已完成

        // 停止摇奖音效，播放中奖音效
        soundManager.stop("spin")
        playSound("win")

        // 立即显示页面结果，延迟弹出详细对话框
        setTimeout(() => {
          setShowResult(true)
          
          // 如果是体验模式，延迟显示反馈
          if (isExperienceMode) {
            setTimeout(() => {
              setShowResult(false)
              setShowExperienceFeedback(true)
            }, 3000) // 3秒后显示体验反馈
          }
        }, 1000)
      }
      
      return newCompletedReels
    })
  }

  const handleDrawAgain = () => {
    // 清理所有定时器
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    
    // 重置所有状态
    setShowResult(false)
    setGameCompleted(false) // 重置游戏完成状态
    setResultViewed(false) // 重置结果查看状态
    setDrawState("idle")
    setWinners([])
    setProgress(0)
    setCompletedReels(0)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleRestartGame = () => {
    setShowResult(false)
    setGameCompleted(false)
    setResultViewed(false)
    setDrawState("idle")
    setWinners([])
    setProgress(0)
    setCompletedReels(0)
  }

  const handleCloseResult = () => {
    setShowResult(false)
    setResultViewed(true) // 标记结果已被查看
    // 保持 gameCompleted 为 true，这样用户可以看到重新开始按钮
  }

  const getDrawResult = (): DrawResult => ({
    winners,
    timestamp: new Date().toISOString(),
    mode: t('slotMachine.modeDisplayName'),
    totalItems: config?.items.length || 0,
  })

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isExperienceMode) {
                  router.push("/") // 体验模式返回首页
                } else {
                  router.back() // 常规模式返回上一页
                }
              }}
              className="text-gray-600 hover:text-red-600"
              disabled={drawState === "spinning" || drawState === "stopping"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isExperienceMode ? t('slotMachine.backToHome') : t('slotMachine.back')}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Dices className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{t('slotMachine.title')}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-600 hover:text-red-600"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <Users className="w-3 h-3 mr-1" />
{t('slotMachine.itemCount', { count: config.items.length })}
              </Badge>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <Hash className="w-3 h-3 mr-1" />
{t('slotMachine.drawQuantity', { quantity: config.quantity })}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 状态显示 */}
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Dices className="w-6 h-6 text-red-600" />
                {drawState === "idle" && t('slotMachine.readyToStart')}
                {drawState === "spinning" && t('slotMachine.drawing')}
                {drawState === "stopping" && t('slotMachine.aboutToReveal')}
                {drawState === "finished" && t('slotMachine.drawComplete')}
              </CardTitle>
              {drawState === "spinning" && (
                <CardDescription>
                  <Progress value={progress} className="w-64 mx-auto mt-4" />
                  <p className="mt-2 text-sm text-gray-600">{t('slotMachine.drawingInProgress')}</p>
                </CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* 老虎机区域 */}
          <div className="mb-8">
            <div className="flex justify-center items-center gap-4 mb-8">
              {Array.from({ length: config.quantity }, (_, index) => (
                <SlotMachineReel
                  key={index}
                  items={config.items}
                  isSpinning={drawState === "spinning" || drawState === "stopping"}
                  finalResult={winners[index]}
                  onSpinComplete={handleReelComplete}
                  delay={index * 500} // 错开启动时间
                />
              ))}
            </div>

            {/* 装饰性元素 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                <div className="text-white font-bold text-xl">🎰</div>
                <div className="text-white font-bold text-lg">{t('slotMachine.title')}</div>
                <div className="text-white font-bold text-xl">🎰</div>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="text-center">
            {drawState === "idle" && (
              <Button
                size="lg"
                onClick={startDraw}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-12 py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-6 h-6 mr-3" />
                {t('slotMachine.startDraw')}
              </Button>
            )}

            {(drawState === "spinning" || drawState === "stopping") && (
              <Button
                size="lg"
                disabled
                className="bg-gray-400 text-white px-12 py-4 text-xl font-bold cursor-not-allowed"
              >
                <Pause className="w-6 h-6 mr-3" />
                {t('slotMachine.drawingInProgress')}
              </Button>
            )}

            {drawState === "finished" && !showResult && !resultViewed && (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">{t('slotMachine.drawComplete')}</p>

                {/* 立即显示获奖者信息 */}
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 mb-4 max-w-md mx-auto">
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    🏆 {t('slotMachine.winnersAnnouncement')}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {winners.map((winner, index) => (
                      <span
                        key={index}
                        className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-800 shadow-sm"
                      >
                        {winner.name}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 text-sm">{t('slotMachine.detailsWillShow')}</p>
              </div>
            )}

            {/* 结果已查看后的状态 */}
            {drawState === "finished" && !showResult && resultViewed && (
              <div className="text-center">
                <div className="text-6xl mb-4">🎰</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">{t('slotMachine.drawComplete')}</p>
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 mb-6 max-w-md mx-auto">
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    🏆 {t('slotMachine.winnersAnnouncement')}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {winners.map((winner, index) => (
                      <span
                        key={index}
                        className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-800 shadow-sm"
                      >
                        {winner.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 集成的操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleRestartGame}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 px-8 py-3 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🔄</span>
                    {t('slotMachine.restart')}
                  </button>
                  <button
                    onClick={() => router.push('/draw-config')}
                    className="bg-white text-gray-700 font-medium text-lg rounded-xl shadow-lg hover:bg-gray-50 border border-gray-300 transition-all duration-200 px-8 py-3 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">⚙️</span>
                    {t('slotMachine.backToConfig')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 结果弹窗 */}
      <DrawResultModal
        result={getDrawResult()}
        isOpen={showResult}
        onClose={handleCloseResult}
        onDrawAgain={handleDrawAgain}
        onGoHome={handleGoHome}
      />

      {/* Experience Feedback Modal */}
      {isExperienceMode && experienceSession && (
        <ExperienceFeedback
          isOpen={showExperienceFeedback}
          onClose={() => setShowExperienceFeedback(false)}
          sessionId={experienceSession.templateId}
          templateName={experienceSession.template.name}
        />
      )}

      <Toaster />
    </div>
  )
}
