"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, ArrowLeft, Volume2, VolumeX, Hash, Users, Timer } from "lucide-react"
import type { DrawingConfig, ListItem, GridLotteryState, GridLotteryPhase, GridCell } from "@/types"
import type { DrawResult } from "@/lib/draw-utils"
import { performDraw } from "@/lib/draw-utils"
import { 
  determineOptimalGridSize, 
  getGridColumns, 
  getGridRows, 
  fillGridCells, 
  createGridCells,
  validateGridConfiguration,
  getValidDrawItems,
  findItemInGrid
} from "@/lib/grid-layout-utils"
import { DrawResultModal } from "@/components/draw-result-modal"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { soundManager } from "@/lib/sound-manager"
import { loadAndMigrateConfig } from "@/lib/config-migration"
import { getCurrentExperienceSession } from "@/lib/experience-manager"
import ExperienceFeedback from "@/components/experience-feedback"

export default function GridLotteryDrawPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [config, setConfig] = useState<DrawingConfig | null>(null)
  const [gameState, setGameState] = useState<GridLotteryState>({
    phase: 'idle',
    cells: [],
    currentHighlight: -1,
    winner: null,
    countdown: 3
  })
  const [showResult, setShowResult] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isExperienceMode, setIsExperienceMode] = useState(false)
  const [experienceSession, setExperienceSession] = useState<any>(null)
  const [showExperienceFeedback, setShowExperienceFeedback] = useState(false)

  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const isFinishedRef = useRef<boolean>(false)

  useEffect(() => {
    loadDrawConfig()
    soundManager.setEnabled(soundEnabled)

    return () => {
      // 组件卸载时清理所有定时器和音效
      if (animationRef.current) {
        clearTimeout(animationRef.current)
        animationRef.current = null
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
        countdownRef.current = null
      }
      soundManager.stopAll()
    }
  }, [])

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
        if (experienceSession.config.mode === "grid-lottery") {
          setIsExperienceMode(true)
          setExperienceSession(experienceSession)
          setConfig(experienceSession.config)
          initializeGrid(experienceSession.config)
          
          // 显示体验开始提示
          toast({
            title: `欢迎体验"${experienceSession.template.name}"`,
            description: "这是演示数据，您可以直接开始抽奖体验",
          })
          return
        }
      }

      // 常规模式：使用迁移函数加载配置
      const migratedConfig = loadAndMigrateConfig("draw-config")
      if (!migratedConfig) {
        toast({
          title: "配置丢失",
          description: "请重新配置抽奖参数",
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      if (migratedConfig.mode !== "grid-lottery") {
        toast({
          title: "模式错误",
          description: "当前页面仅支持多宫格抽奖模式",
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      // 多宫格模式特殊验证：确保数量为1
      if (migratedConfig.quantity !== 1) {
        console.warn(`[Grid Lottery] 配置数量异常: ${migratedConfig.quantity}, 已修正为1`)
        migratedConfig.quantity = 1
        // 保存修正后的配置
        localStorage.setItem("draw-config", JSON.stringify(migratedConfig))
      }

      setConfig(migratedConfig)
      initializeGrid(migratedConfig)
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载抽奖配置",
        variant: "destructive",
      })
      router.push("/draw-config")
    }
  }

  const initializeGrid = (config: DrawingConfig) => {
    // 验证配置
    const validation = validateGridConfiguration(config.items, config.allowRepeat)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: "配置错误",
          description: error,
          variant: "destructive",
        })
      })
      return
    }
    
    // 显示警告信息
    validation.warnings.forEach(warning => {
      toast({
        title: "配置提醒",
        description: warning,
        variant: "default",
      })
    })

    // 根据名称数量确定最佳的宫格布局
    const gridSize = determineOptimalGridSize(config.items.length)
    
    // 根据配置填充宫格
    const filledItems = fillGridCells(config.items, gridSize, config.allowRepeat)
    
    // 创建宫格单元格
    const cells = createGridCells(filledItems, gridSize)

    setGameState(prev => ({
      ...prev,
      cells,
      currentHighlight: -1,
      winner: null,
      countdown: 3
    }))
  }



  const playSound = (type: "countdown" | "highlight" | "spin" | "win") => {
    if (!soundEnabled) return
    soundManager.play(type)
  }

  const startCountdown = () => {
    console.log('开始倒计时，设置为3')
    setGameState(prev => ({ ...prev, phase: 'countdown', countdown: 3 }))
    playSound("countdown")

    // 倒计时3
    countdownRef.current = setTimeout(() => {
      console.log('显示倒计时2')
      setGameState(prev => ({ ...prev, countdown: 2 }))
      playSound("countdown")
      
      // 倒计时2
      countdownRef.current = setTimeout(() => {
        console.log('显示倒计时1')
        setGameState(prev => ({ ...prev, countdown: 1 }))
        playSound("countdown")
        
        // 倒计时1
        countdownRef.current = setTimeout(() => {
          console.log('倒计时结束，开始抽奖')
          startSpinning()
        }, 1000)
      }, 1000)
    }, 1000)
  }

  const startSpinning = () => {
    if (!config) return

    console.log('开始抽奖动画')
    
    // 重置完成标志
    isFinishedRef.current = false
    
    setGameState(prev => ({ ...prev, phase: 'spinning' }))
    playSound("spin")

    // 获取有效的抽奖名称（排除占位符）
    const validItems = getValidDrawItems(gameState.cells)
    
    if (validItems.length === 0) {
      toast({
        title: "抽奖失败",
        description: "没有有效的抽奖名称",
        variant: "destructive",
      })
      return
    }

    // 从有效名称中执行抽奖逻辑
    const configWithValidItems = { ...config, items: validItems }
    const winners = performDraw(configWithValidItems)
    const winnerItem = winners[0] // 多宫格抽奖只选择一个获奖者

    let currentIndex = 0
    let speed = 100 // 初始速度
    let totalSpins = 0
    const maxSpins = 30 + Math.floor(Math.random() * 20) // 30-50次跳转

    const spin = () => {
      // 检查是否已经完成，如果是则立即停止
      if (isFinishedRef.current) {
        return
      }

      setGameState(prev => ({
        ...prev,
        cells: prev.cells.map((cell, index) => ({
          ...cell,
          isHighlighted: index === currentIndex
        })),
        currentHighlight: currentIndex
      }))

      playSound("highlight")
      currentIndex = (currentIndex + 1) % gameState.cells.length
      totalSpins++

      if (totalSpins < maxSpins && !isFinishedRef.current) {
        // 逐渐减速
        if (totalSpins > maxSpins * 0.7) {
          speed = Math.min(speed + 50, 500)
        }
        animationRef.current = setTimeout(spin, speed)
      } else if (!isFinishedRef.current) {
        // 找到获奖者在格子中的位置
        const winnerIndex = findItemInGrid(gameState.cells, winnerItem)
        const finalIndex = winnerIndex >= 0 ? winnerIndex : Math.floor(Math.random() * gameState.cells.length)
        
        finishSpinning(finalIndex, winnerItem)
      }
    }

    spin()
  }

  const finishSpinning = (winnerIndex: number, winner: ListItem) => {
    // 立即设置完成标志，防止任何后续的spin调用
    isFinishedRef.current = true
    
    // 立即清除所有动画定时器，防止后续调用
    if (animationRef.current) {
      clearTimeout(animationRef.current)
      animationRef.current = null
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }

    // 停止所有音效
    soundManager.stop("spin")
    soundManager.stop("highlight")
    
    // 立即设置最终状态，确保状态不再变化
    setGameState({
      phase: 'finished',
      cells: gameState.cells.map((cell, index) => ({
        ...cell,
        isHighlighted: index === winnerIndex,
        isWinner: index === winnerIndex
      })),
      currentHighlight: winnerIndex,
      winner,
      countdown: 0
    })

    // 播放获奖音效
    playSound("win")

    // 延迟显示结果对话框
    setTimeout(() => {
      setShowResult(true)
      
      // 如果是体验模式，延迟显示反馈
      if (isExperienceMode) {
        setTimeout(() => {
          setShowResult(false)
          setShowExperienceFeedback(true)
        }, 3000) // 3秒后显示体验反馈
      }
    }, 2000)
  }

  const handleStartDraw = () => {
    if (gameState.phase !== 'idle') return
    startCountdown()
  }

  const handleDrawAgain = () => {
    // 重置完成标志
    isFinishedRef.current = false
    
    // 清除所有定时器
    if (animationRef.current) {
      clearTimeout(animationRef.current)
      animationRef.current = null
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }
    
    // 停止所有音效
    soundManager.stopAll()
    
    // 重新初始化宫格布局（重新洗牌）
    if (config) {
      initializeGrid(config)
    }
    
    // 重置状态
    setShowResult(false)
    setGameState(prev => ({
      ...prev,
      phase: 'idle',
      currentHighlight: -1,
      winner: null,
      countdown: 3
    }))
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const getDrawResult = (): DrawResult => ({
    winners: gameState.winner ? [gameState.winner] : [],
    timestamp: new Date().toISOString(),
    mode: "多宫格抽奖（单次抽取）",
    totalItems: config?.items.length || 0,
  })

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  const gridSize = determineOptimalGridSize(config.items.length)
  const gridCols = getGridColumns(gridSize)
  const gridRows = getGridRows(gridSize)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
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
              className="text-gray-600 hover:text-indigo-600"
              disabled={gameState.phase === "spinning" || gameState.phase === "countdown"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isExperienceMode ? "返回首页" : "返回"}
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">多宫格抽奖</h1>
                <p className="text-sm text-gray-600">单次抽取模式 - 灯光跳转选择一位获奖者</p>
              </div>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-semibold px-3 py-1 text-sm border border-indigo-200">
                <Hash className="w-3 h-3 mr-1" />
                单次抽取
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-600 hover:text-indigo-600"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                <Users className="w-3 h-3 mr-1" />
                {config.items.length} 名称
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Hash className="w-3 h-3 mr-1" />
                {gridSize} 宫格
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 状态显示 */}
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                {gameState.phase === "idle" && (
                  <>
                    <Hash className="w-6 h-6 text-indigo-600" />
                    准备开始
                  </>
                )}
                {gameState.phase === "countdown" && (
                  <>
                    <Timer className="w-6 h-6 text-orange-600" />
                    倒计时 {gameState.countdown}
                  </>
                )}
                {gameState.phase === "spinning" && (
                  <>
                    <Hash className="w-6 h-6 text-purple-600 animate-spin" />
                    灯光跳转中...
                  </>
                )}
                {gameState.phase === "finished" && (
                  <>
                    <Hash className="w-6 h-6 text-green-600" />
                    抽奖完成！
                  </>
                )}
              </CardTitle>
              {gameState.phase === "spinning" && (
                <CardDescription>
                  <p className="mt-2 text-sm text-gray-600">灯光正在快速跳转，即将定格...</p>
                </CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* 多宫格区域 */}
          <div className="mb-8">
            <div 
              className={`grid gap-4 mx-auto max-w-3xl`}
              style={{
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${gridRows}, 1fr)`
              }}
            >
              {gameState.cells.map((cell) => {
                const isPlaceholder = cell.item.id.startsWith('placeholder-')
                return (
                  <div
                    key={cell.id}
                    className={`
                      aspect-square rounded-xl border-2 flex items-center justify-center text-center p-4 transition-all duration-300 transform
                      ${cell.isHighlighted 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-500 shadow-lg scale-105 text-white font-bold' 
                        : isPlaceholder
                          ? 'bg-gray-50 border-gray-300 text-gray-400'
                          : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-800'
                      }
                      ${cell.isWinner 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 shadow-xl scale-110 text-white font-bold animate-pulse' 
                        : ''
                      }
                    `}
                  >
                    <div className={`text-sm font-medium break-words ${isPlaceholder ? 'italic' : ''}`}>
                      {isPlaceholder ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        cell.item.name
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 装饰性元素 */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full shadow-lg">
                <div className="text-white font-bold text-xl">🎯</div>
                <div className="text-white font-bold text-lg">多宫格抽奖</div>
                <div className="text-white font-bold text-xl">🎯</div>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="text-center">
            {gameState.phase === "idle" && (
              <Button
                size="lg"
                onClick={handleStartDraw}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-6 h-6 mr-3" />
                开始抽奖
              </Button>
            )}

            {(gameState.phase === "countdown" || gameState.phase === "spinning") && (
              <Button
                size="lg"
                disabled
                className="bg-gray-400 text-white px-12 py-4 text-xl font-bold cursor-not-allowed"
              >
                <Pause className="w-6 h-6 mr-3" />
                {gameState.phase === "countdown" ? "倒计时中..." : "抽奖中..."}
              </Button>
            )}

            {gameState.phase === "finished" && !showResult && (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">抽奖完成！</p>
                <p className="text-gray-600">获奖者：{gameState.winner?.name}</p>
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