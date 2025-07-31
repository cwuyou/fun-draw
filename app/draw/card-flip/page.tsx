"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Volume2, VolumeX, Volume1, Spade, Users, Hash, Settings } from "lucide-react"
import type { DrawingConfig, ListItem } from "@/types"
import type { DrawResult } from "@/lib/draw-utils"
import { CardFlipGame } from "@/components/card-flip-game"
import { DrawResultModal } from "@/components/draw-result-modal"
import { CardGameErrorBoundary, useCardGameErrorHandler } from "@/components/card-game-error-boundary"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useTranslation } from "@/hooks/use-translation"
import { soundManager } from "@/lib/sound-manager"
import { loadAndMigrateConfig } from "@/lib/config-migration"

export default function CardFlipDrawPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { handleError, showErrorToast, recoverFromError } = useCardGameErrorHandler()

  const [config, setConfig] = useState<DrawingConfig | null>(null)
  const [winners, setWinners] = useState<ListItem[]>([])
  const [showResult, setShowResult] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [gameKey, setGameKey] = useState(0) // 用于重置游戏组件
  const [drawnItems, setDrawnItems] = useState<Set<string>>(new Set()) // 跟踪已抽取的名称
  const [soundInitialized, setSoundInitialized] = useState(false)

  useEffect(() => {
    loadDrawConfig()
    initializeSoundSystem()

    return () => {
      // 停止所有音效
      soundManager.stopAll()
    }
  }, [])

  // 初始化音效系统
  const initializeSoundSystem = async () => {
    try {
      // 等待音效系统初始化
      await soundManager.waitForInitialization()

      // 设置音效开关和音量
      soundManager.setEnabled(soundEnabled)
      soundManager.setMasterVolume(masterVolume)

      // 预加载音效以提高性能
      await soundManager.preloadSounds()

      setSoundInitialized(true)

      // 显示音效系统状态
      const soundInfo = soundManager.getSoundInfo()
      console.log('音效系统初始化完成:', soundInfo)

    } catch (error) {
      console.warn('音效系统初始化失败:', error)
      toast({
        title: t('cardFlip.soundInitFailed'),
        description: t('cardFlip.soundMayNotWork'),
        variant: "destructive",
      })
    }
  }

  // 监听音效开关变化
  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
    if (!soundEnabled) {
      soundManager.stopAll()
    }
  }, [soundEnabled])

  // 监听音量变化
  useEffect(() => {
    soundManager.setMasterVolume(masterVolume)
  }, [masterVolume])

  const loadDrawConfig = () => {
    try {
      // 使用迁移函数加载配置
      const migratedConfig = loadAndMigrateConfig("draw-config")
      if (!migratedConfig) {
        handleError(new Error("配置数据丢失"), { context: "loadDrawConfig" })
        toast({
          title: t('cardFlip.configLost'),
          description: t('cardFlip.reconfigureRequired'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      const parsedConfig: DrawingConfig = migratedConfig

      // 验证配置数据的完整性
      if (!parsedConfig.mode || !parsedConfig.items || !Array.isArray(parsedConfig.items)) {
        handleError(new Error("配置数据格式错误"), { context: "loadDrawConfig", config: parsedConfig })
        toast({
          title: t('cardFlip.configError'),
          description: t('cardFlip.configFormatError'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      if (parsedConfig.mode !== "card-flip") {
        handleError(new Error(`模式不匹配: ${parsedConfig.mode}`), { context: "loadDrawConfig" })
        toast({
          title: t('cardFlip.modeError'),
          description: t('cardFlip.cardFlipOnly'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      // 验证名称数量
      if (parsedConfig.items.length < 3) {
        handleError(new Error("名称数量不足"), { context: "loadDrawConfig", itemCount: parsedConfig.items.length })
        toast({
          title: t('cardFlip.insufficientNames'),
          description: t('cardFlip.minThreeNames'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      // 验证抽取数量
      if (parsedConfig.quantity < 1 || parsedConfig.quantity > 10) {
        handleError(new Error("抽取数量无效"), { context: "loadDrawConfig", quantity: parsedConfig.quantity })
        toast({
          title: t('cardFlip.quantityError'),
          description: t('cardFlip.quantityRange'),
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      setConfig(parsedConfig)
    } catch (error) {
      handleError(error as Error, { context: "loadDrawConfig" })
      toast({
        title: t('cardFlip.loadFailed'),
        description: t('cardFlip.configLoadError'),
        variant: "destructive",
      })
      router.push("/draw-config")
    }
  }

  const handleGameComplete = (gameWinners: ListItem[]) => {
    setWinners(gameWinners)

    // 如果不允许重复中奖，将中奖者添加到已抽取列表
    if (!config?.allowRepeat) {
      setDrawnItems(prev => {
        const newDrawnItems = new Set(prev)
        gameWinners.forEach(winner => newDrawnItems.add(winner.id))
        return newDrawnItems
      })
    }

    // 适当延迟显示结果弹窗，让用户有时间看到最终状态
    setTimeout(() => {
      setShowResult(true)
    }, 800) // 减少延迟时间，提升用户体验
  }

  const handleDrawAgain = () => {
    // 检查是否有足够的剩余名称进行下一轮抽奖
    if (!config?.allowRepeat) {
      const remainingItems = config.items.filter(item => !drawnItems.has(item.id))
      if (remainingItems.length < config.quantity) {
        toast({
          title: t('cardFlip.cannotDrawAgain'),
          description: t('cardFlip.insufficientRemaining', { needed: config.quantity, remaining: remainingItems.length }),
          variant: "destructive",
        })
        return
      }
    }

    setShowResult(false)
    setWinners([])
    // 通过改变key来重置游戏组件到idle状态，等待用户手动开始
    setGameKey(prev => prev + 1)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const getDrawResult = (): DrawResult => ({
    winners,
    timestamp: new Date().toISOString(),
    mode: "卡牌抽取式",
    totalItems: config?.items.length || 0,
  })

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <CardGameErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Spade className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">卡牌抽奖</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 音效控制 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-gray-600 hover:text-blue-600"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>

                {/* 音量控制弹窗 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600"
                      disabled={!soundEnabled}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">音效设置</h4>
                        <p className="text-sm text-muted-foreground">
                          调整音效音量和测试音效
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* 主音量控制 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">主音量</label>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(masterVolume * 100)}%
                            </span>
                          </div>
                          <Slider
                            value={[masterVolume]}
                            onValueChange={(value) => setMasterVolume(value[0])}
                            max={1}
                            min={0}
                            step={0.1}
                            className="w-full"
                            disabled={!soundEnabled}
                          />
                        </div>

                        {/* 音效测试按钮 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">测试音效</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-shuffle')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              洗牌
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-deal')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              发牌
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-flip')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              翻牌
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-reveal')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              揭晓
                            </Button>
                          </div>
                        </div>

                        {/* 音效状态指示 */}
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>音效状态:</span>
                            <span className={soundInitialized ? "text-green-600" : "text-orange-600"}>
                              {soundInitialized ? "已就绪" : "初始化中..."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Users className="w-3 h-3 mr-1" />
                  {config.items.length} 名称
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Hash className="w-3 h-3 mr-1" />
                  抽取 {config.quantity} 个
                </Badge>
                {!config.allowRepeat && drawnItems.size > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    剩余 {config.items.length - drawnItems.size} 个
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* 游戏说明 */}
            <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Spade className="w-6 h-6 text-blue-600" />
                  卡牌抽奖
                </CardTitle>
                <CardDescription className="text-base">
                  点击卡牌进行翻牌，体验优雅的抽奖过程
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 卡牌游戏区域 */}
            <div className="mb-8">
              <CardFlipGame
                key={gameKey}
                items={config.allowRepeat ? config.items : config.items.filter(item => !drawnItems.has(item.id))}
                quantity={config.quantity}
                allowRepeat={config.allowRepeat}
                onComplete={handleGameComplete}
                soundEnabled={soundEnabled}
                autoStart={false}
                className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg"
              />
            </div>

            {/* 装饰性元素 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg">
                <div className="text-white font-bold text-xl">🃏</div>
                <div className="text-white font-bold text-lg">卡牌抽奖</div>
                <div className="text-white font-bold text-xl">🃏</div>
              </div>
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
    </CardGameErrorBoundary>
  )
}