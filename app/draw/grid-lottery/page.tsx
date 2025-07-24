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
import { DrawResultModal } from "@/components/draw-result-modal"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { soundManager } from "@/lib/sound-manager"

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

  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadDrawConfig()
    soundManager.setEnabled(soundEnabled)

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
      if (countdownRef.current) clearTimeout(countdownRef.current)
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
      if (parsedConfig.mode !== "grid-lottery") {
        toast({
          title: "模式错误",
          description: "当前页面仅支持多宫格抽奖模式",
          variant: "destructive",
        })
        router.push("/draw-config")
        return
      }

      setConfig(parsedConfig)
      initializeGrid(parsedConfig)
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
    // 根据数量确定最佳的宫格布局
    const gridSize = determineGridSize(config.quantity)
    const selectedItems = config.items.slice(0, gridSize)
    
    // 如果项目不足，用重复项目填充
    while (selectedItems.length < gridSize) {
      selectedItems.push(...config.items.slice(0, gridSize - selectedItems.length))
    }

    const cells: GridCell[] = selectedItems.map((item, index) => ({
      id: `cell-${index}`,
      index,
      item,
      isHighlighted: false,
      isWinner: false,
      position: {
        row: Math.floor(index / getGridColumns(gridSize)),
        col: index % getGridColumns(gridSize)
      }
    }))

    setGameState(prev => ({
      ...prev,
      cells,
      currentHighlight: -1,
      winner: null,
      countdown: 3
    }))
  }

  const determineGridSize = (quantity: number): number => {
    // 根据抽取数量确定合适的宫格数
    if (quantity <= 6) return 6
    if (quantity <= 9) return 9
    if (quantity <= 12) return 12
    return 15
  }

  const getGridColumns = (gridSize: number): number => {
    switch (gridSize) {
      case 6: return 3  // 2x3
      case 9: return 3  // 3x3
      case 12: return 4 // 3x4
      case 15: return 5 // 3x5
      default: return 3
    }
  }

  const getGridRows = (gridSize: number): number => {
    switch (gridSize) {
      case 6: return 2
      case 9: return 3
      case 12: return 3
      case 15: return 3
      default: return 3
    }
  }

  const playSound = (type: "countdown" | "highlight" | "spin" | "win") => {
    if (!soundEnabled) return
    soundManager.play(type)
  }

  const startCountdown = () => {
    setGameState(prev => ({ ...prev, phase: 'countdown', countdown: 3 }))
    playSound("countdown")

    const countdown = () => {
      setGameState(prev => {
        if (prev.countdown > 1) {
          playSound("countdown")
          countdownRef.current = setTimeout(countdown, 1000)
          return { ...prev, countdown: prev.countdown - 1 }
        } else {
          startSpinning()
          return { ...prev, countdown: 0 }
        }
      })
    }

    countdownRef.current = setTimeout(countdown, 1000)
  }

  const startSpinning = () => {
    if (!config) return

    setGameState(prev => ({ ...prev, phase: 'spinning' }))
    playSound("spin")

    // 执行抽奖逻辑
    const winners = performDraw(config)
    const winnerItem = winners[0] // 多宫格抽奖只选择一个获奖者

    let currentIndex = 0
    let speed = 100 // 初始速度
    let totalSpins = 0
    const maxSpins = 30 + Math.floor(Math.random() * 20) // 30-50次跳转

    const spin = () => {
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

      if (totalSpins < maxSpins) {
        // 逐渐减速
        if (totalSpins > maxSpins * 0.7) {
          speed = Math.min(speed + 50, 500)
        }
        animationRef.current = setTimeout(spin, speed)
      } else {
        // 找到获奖者在格子中的位置
        const winnerIndex = gameState.cells.findIndex(cell => cell.item.id === winnerItem.id)
        const finalIndex = winnerIndex >= 0 ? winnerIndex : Math.floor(Math.random() * gameState.cells.length)
        
        finishSpinning(finalIndex, winnerItem)
      }
    }

    spin()
  }

  const finishSpinning = (winnerIndex: number, winner: ListItem) => {
    setGameState(prev => ({
      ...prev,
      phase: 'finished',
      cells: prev.cells.map((cell, index) => ({
        ...cell,
        isHighlighted: index === winnerIndex,
        isWinner: index === winnerIndex
      })),
      currentHighlight: winnerIndex,
      winner
    }))

    soundManager.stop("spin")
    playSound("win")

    setTimeout(() => {
      setShowResult(true)
    }, 2000)
  }

  const handleStartDraw = () => {
    if (gameState.phase !== 'idle') return
    startCountdown()
  }

  const handleDrawAgain = () => {
    if (animationRef.current) clearTimeout(animationRef.current)
    if (countdownRef.current) clearTimeout(countdownRef.current)
    
    setShowResult(false)
    setGameState(prev => ({
      ...prev,
      phase: 'idle',
      cells: prev.cells.map(cell => ({
        ...cell,
        isHighlighted: false,
        isWinner: false
      })),
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
    mode: "多宫格抽奖",
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

  const gridSize = determineGridSize(config.quantity)
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
              onClick={() => router.back()}
              className="text-gray-600 hover:text-indigo-600"
              disabled={gameState.phase === "spinning" || gameState.phase === "countdown"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">多宫格抽奖</h1>
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
                {config.items.length} 项目
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
              {gameState.cells.map((cell) => (
                <div
                  key={cell.id}
                  className={`
                    aspect-square rounded-xl border-2 flex items-center justify-center text-center p-4 transition-all duration-300 transform
                    ${cell.isHighlighted 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-500 shadow-lg scale-105 text-white font-bold' 
                      : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-800'
                    }
                    ${cell.isWinner 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 shadow-xl scale-110 text-white font-bold animate-pulse' 
                      : ''
                    }
                  `}
                >
                  <div className="text-sm font-medium break-words">
                    {cell.item.name}
                  </div>
                </div>
              ))}
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
      <Toaster />
    </div>
  )
}