"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { BlinkingNamePicker } from "@/components/blinking-name-picker"
import { DrawResultModal } from "@/components/draw-result-modal"
import type { DrawingConfig, ListItem } from "@/types"
import type { DrawResult } from "@/lib/draw-utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function BlinkingNamePickerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [config, setConfig] = useState<DrawingConfig | null>(null)
  const [winners, setWinners] = useState<ListItem[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从localStorage加载配置
    const savedConfig = localStorage.getItem("draw-config")
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig) as DrawingConfig
        if (parsedConfig.mode === "blinking-name-picker") {
          setConfig(parsedConfig)
        } else {
          // 配置模式不匹配，跳转回配置页面
          router.push("/draw-config")
          return
        }
      } catch (error) {
        console.error("解析配置失败:", error)
        router.push("/draw-config")
        return
      }
    } else {
      // 没有配置，跳转回配置页面
      router.push("/draw-config")
      return
    }
    setIsLoading(false)
  }, [router])

  const handleComplete = (selectedWinners: ListItem[]) => {
    setWinners(selectedWinners)
    setShowResult(true)
  }

  const handleDrawAgain = () => {
    setWinners([])
    setShowResult(false)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const getDrawResult = (): DrawResult => ({
    winners,
    timestamp: new Date().toISOString(),
    mode: "闪烁点名式",
    totalItems: config?.items.length || 0,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">配置加载失败，请重新配置</p>
          <Button onClick={() => router.push("/draw-config")} className="mt-4">
            返回配置
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/draw-config")}
              className="text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回配置
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">闪烁点名</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDrawAgain}
              className="text-gray-600 hover:text-purple-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <BlinkingNamePicker
            items={config.items}
            quantity={config.quantity}
            allowRepeat={config.allowRepeat}
            onComplete={handleComplete}
            soundEnabled={true}
            autoStart={false}
            className="w-full"
          />
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

      <Toaster />
    </div>
  )
}