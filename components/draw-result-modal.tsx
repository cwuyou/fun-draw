"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Copy, Download, RotateCcw, Home, Sparkles, CheckCircle, X } from "lucide-react"
import type { DrawResult } from "@/lib/draw-utils"
import { exportResults, copyToClipboard } from "@/lib/draw-utils"
import { useToast } from "@/hooks/use-toast"

interface DrawResultModalProps {
  result: DrawResult
  isOpen: boolean
  onClose: () => void
  onDrawAgain: () => void
  onGoHome: () => void
}

export function DrawResultModal({ result, isOpen, onClose, onDrawAgain, onGoHome }: DrawResultModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    const text = result.winners.map((winner) => winner.name).join("\n")
    const success = await copyToClipboard(text)

    if (success) {
      toast({
        title: t('drawResult.copySuccess'),
        description: t('drawResult.copySuccessDescription'),
      })
    } else {
      toast({
        title: t('drawResult.copyFailed'),
        description: t('drawResult.copyFailedDescription'),
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    setIsExporting(true)
    try {
      exportResults(result)
      toast({
        title: t('drawResult.exportSuccess'),
        description: t('drawResult.exportSuccessDescription'),
      })
    } catch (error) {
      toast({
        title: t('drawResult.exportFailed'),
        description: t('drawResult.exportFailedDescription'),
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-white">
        <CardHeader className="text-center pb-4 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            🎉 {t('drawResult.title')}
          </CardTitle>

          <CardDescription className="text-lg text-gray-600">
            {result.winners.length === 1 ? t('drawResult.congratulations') : t('drawResult.congratulationsMultiple')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 统计信息 */}
          <div className="flex justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              {result.mode}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              {result.winners.length === 1 ? t('drawResult.oneWinner') : t('drawResult.multipleWinners', { count: result.winners.length })}
            </Badge>
          </div>

          {/* 中奖名单 */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">
              {result.winners.length === 1 ? t('drawResult.winner') : t('drawResult.winnersList')}
            </h3>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {result.winners.map((winner, index) => (
                <div
                  key={winner.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-lg">{winner.name}</p>
                  </div>
                  <div className="text-2xl">🎊</div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t('drawResult.copyResult')}
            </Button>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="flex-1 border-green-200 text-green-600 hover:bg-green-50 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? t('drawResult.exporting') : t('drawResult.exportFile')}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onDrawAgain}
              size="lg"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {t('drawResult.drawAgain')}
            </Button>

            <Button
              onClick={onGoHome}
              variant="outline"
              size="lg"
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent py-3 font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('drawResult.goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
