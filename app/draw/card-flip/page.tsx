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
  const [gameCompleted, setGameCompleted] = useState(false) // 跟踪游戏是否已完成
  const [resultViewed, setResultViewed] = useState(false) // 跟踪结果是否已被查看

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
    setGameCompleted(true) // 标记游戏已完成

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
    setGameCompleted(false) // 重置游戏完成状态
    // 通过改变key来重置游戏组件到idle状态，等待用户手动开始
    setGameKey(prev => prev + 1)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleRestartGame = () => {
    setShowResult(false)
    setWinners([])
    setGameCompleted(false)
    setResultViewed(false) // 重置结果查看状态
    setGameKey(prev => prev + 1)
  }

  const handleCloseResult = () => {
    setShowResult(false)
    setResultViewed(true) // 标记结果已被查看
    // 保持 gameCompleted 为 true，这样用户可以看到重新开始按钮
  }

  const getDrawResult = (): DrawResult => ({
    winners,
    timestamp: new Date().toISOString(),
    mode: t('cardFlip.modeName'),
    totalItems: config?.items.length || 0,
  })

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('cardFlip.loading')}</p>
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
{t('cardFlip.back')}
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Spade className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">{t('cardFlip.title')}</h1>
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
                        <h4 className="font-medium leading-none">{t('cardFlip.soundSettings')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('cardFlip.soundSettingsDescription')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* 主音量控制 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{t('cardFlip.masterVolume')}</label>
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
                          <label className="text-sm font-medium">{t('cardFlip.testSound')}</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-shuffle')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              {t('cardFlip.shuffle')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-deal')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              {t('cardFlip.deal')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-flip')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              {t('cardFlip.flip')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => soundManager.play('card-reveal')}
                              disabled={!soundEnabled || !soundInitialized}
                              className="text-xs"
                            >
                              {t('cardFlip.reveal')}
                            </Button>
                          </div>
                        </div>

                        {/* 音效状态指示 */}
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('cardFlip.soundStatus')}:</span>
                            <span className={soundInitialized ? "text-green-600" : "text-orange-600"}>
                              {soundInitialized ? t('cardFlip.ready') : t('cardFlip.initializing')}
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
{t('cardFlip.namesCount', { count: config.items.length })}
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Hash className="w-3 h-3 mr-1" />
{t('cardFlip.drawQuantity', { quantity: config.quantity })}
                </Badge>
                {!config.allowRepeat && drawnItems.size > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
{t('cardFlip.remaining', { count: config.items.length - drawnItems.size })}
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
                  {t('cardFlip.title')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('cardFlip.description')}
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

            {/* 游戏完成后的状态显示 */}
            {gameCompleted && !showResult && !resultViewed && (
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">{t('cardFlip.drawComplete')}</p>

                {/* 统一的获奖者展示样式 */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-4 max-w-md mx-auto">
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    🏆 {t('cardFlip.winnersAnnouncement')}
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

                <p className="text-gray-600 text-sm">{t('cardFlip.detailsWillShow')}</p>
              </div>
            )}

            {/* 结果已查看后的状态 */}
            {gameCompleted && !showResult && resultViewed && (
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎊</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">{t('cardFlip.drawComplete')}</p>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6 max-w-md mx-auto">
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    🏆 {t('cardFlip.winnersAnnouncement')}
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
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 px-8 py-3 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🔄</span>
                    {t('cardFlip.restart')}
                  </button>
                  <button
                    onClick={() => router.push('/draw-config')}
                    className="bg-white text-gray-700 font-medium text-lg rounded-xl shadow-lg hover:bg-gray-50 border border-gray-300 transition-all duration-200 px-8 py-3 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">⚙️</span>
                    {t('cardFlip.backToConfig')}
                  </button>
                </div>
              </div>
            )}

            {/* 装饰性元素 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg">
                <div className="text-white font-bold text-xl">🃏</div>
                <div className="text-white font-bold text-lg">{t('cardFlip.title')}</div>
                <div className="text-white font-bold text-xl">🃏</div>
              </div>
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
        <Toaster />
      </div>
    </CardGameErrorBoundary>
  )
}