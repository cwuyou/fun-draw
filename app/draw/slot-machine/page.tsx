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
import { soundManager } from "@/lib/sound-manager"

type DrawState = "idle" | "spinning" | "stopping" | "finished"

export default function SlotMachineDrawPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [config, setConfig] = useState<DrawingConfig | null>(null)
  const [drawState, setDrawState] = useState<DrawState>("idle")
  const [winners, setWinners] = useState<ListItem[]>([])
  const [showResult, setShowResult] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [progress, setProgress] = useState(0)
  const [completedReels, setCompletedReels] = useState(0)

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
      const configData = localStorage.getItem("draw-config")
      if (!configData) {
        toast({
          title: "配置丢失",
          description: "请重新配置抽奖参数",
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      const parsedConfig: DrawingConfig = JSON.parse(configData)
      if (parsedConfig.mode !== "slot-machine") {
        toast({
          title: "模式错误",
          description: "当前页面仅支持老虎机模式",
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      setConfig(parsedConfig)
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载抽奖配置",
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
        
        // 停止摇奖音效，播放中奖音效
        soundManager.stop("spin")
        playSound("win")

        setTimeout(() => {
          setShowResult(true)
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
    setDrawState("idle")
    setWinners([])
    setProgress(0)
    setCompletedReels(0)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const getDrawResult = (): DrawResult => ({
    winners,
    timestamp: new Date().toISOString(),
    mode: "老虎机式",
    totalItems: config?.items.length || 0,
  })

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
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
              onClick={() => router.back()}
              className="text-gray-600 hover:text-red-600"
              disabled={drawState === "spinning" || drawState === "stopping"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Dices className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">老虎机抽奖</h1>
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
                {config.items.length} 项目
              </Badge>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <Hash className="w-3 h-3 mr-1" />
                抽取 {config.quantity} 个
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
                {drawState === "idle" && "准备开始"}
                {drawState === "spinning" && "正在抽奖..."}
                {drawState === "stopping" && "即将揭晓..."}
                {drawState === "finished" && "抽奖完成！"}
              </CardTitle>
              {drawState === "spinning" && (
                <CardDescription>
                  <Progress value={progress} className="w-64 mx-auto mt-4" />
                  <p className="mt-2 text-sm text-gray-600">抽奖进行中，请稍候...</p>
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
                <div className="text-white font-bold text-lg">老虎机抽奖</div>
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
                开始抽奖
              </Button>
            )}

            {(drawState === "spinning" || drawState === "stopping") && (
              <Button
                size="lg"
                disabled
                className="bg-gray-400 text-white px-12 py-4 text-xl font-bold cursor-not-allowed"
              >
                <Pause className="w-6 h-6 mr-3" />
                抽奖中...
              </Button>
            )}

            {drawState === "finished" && !showResult && (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">抽奖完成！</p>
                <p className="text-gray-600">结果即将显示...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 结果弹窗 */}
      <DrawResultModal
        result={getDrawResult()}
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        onDrawAgain={handleDrawAgain}
        onGoHome={handleGoHome}
      />
      <Toaster />
    </div>
  )
}
