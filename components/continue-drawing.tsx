"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  RotateCcw, 
  Users, 
  Trophy, 
  Settings, 
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { ListItem, DrawingConfig, ContinueDrawingState } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface ContinueDrawingProps {
  lastConfig: DrawingConfig
  lastResults: ListItem[]
  onContinue: (config: DrawingConfig) => void
  onModifyConfig?: () => void
  onRestart?: () => void
  className?: string
  showModifyOption?: boolean
  showRestartOption?: boolean
}

export default function ContinueDrawing({
  lastConfig,
  lastResults,
  onContinue,
  onModifyConfig,
  onRestart,
  className = '',
  showModifyOption = true,
  showRestartOption = true
}: ContinueDrawingProps) {
  const { toast } = useToast()
  const [state, setState] = useState<ContinueDrawingState>({
    excludeWinners: true,
    availableItems: [],
    lastResults: lastResults,
    isReady: false,
    roundCount: 1
  })
  const [isProcessing, setIsProcessing] = useState(false)

  // 计算可用项目
  useEffect(() => {
    const calculateAvailableItems = () => {
      if (!lastConfig.items || lastConfig.items.length === 0) {
        setState(prev => ({ ...prev, availableItems: [], isReady: false }))
        return
      }

      let availableItems = [...lastConfig.items]

      if (state.excludeWinners && lastResults.length > 0) {
        // 排除已中奖者
        const winnerIds = new Set(lastResults.map(winner => winner.id))
        availableItems = lastConfig.items.filter(item => !winnerIds.has(item.id))
      }

      const isReady = availableItems.length >= lastConfig.quantity

      setState(prev => ({
        ...prev,
        availableItems,
        isReady
      }))
    }

    calculateAvailableItems()
  }, [lastConfig, lastResults, state.excludeWinners])

  // 处理继续抽奖
  const handleContinueDrawing = async () => {
    if (!state.isReady) {
      toast({
        title: "无法继续抽奖",
        description: "可用参与者数量不足",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // 创建新的配置
      const newConfig: DrawingConfig = {
        ...lastConfig,
        items: state.availableItems
      }

      // 更新轮次计数
      setState(prev => ({ ...prev, roundCount: prev.roundCount + 1 }))

      // 调用继续抽奖回调
      onContinue(newConfig)

      toast({
        title: "继续抽奖",
        description: `第${state.roundCount + 1}轮抽奖开始，参与者${state.availableItems.length}人`,
      })

    } catch (error) {
      console.error('Continue drawing failed:', error)
      toast({
        title: "继续抽奖失败",
        description: "启动新一轮抽奖时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理重新开始
  const handleRestart = () => {
    if (onRestart) {
      onRestart()
    } else {
      // 默认重新开始逻辑
      const restartConfig: DrawingConfig = {
        ...lastConfig,
        items: lastConfig.items
      }
      
      setState(prev => ({ 
        ...prev, 
        excludeWinners: true,
        roundCount: 1,
        lastResults: []
      }))
      
      onContinue(restartConfig)
      
      toast({
        title: "重新开始",
        description: "已重置所有设置，开始新的抽奖",
      })
    }
  }

  // 获取模式显示名称
  const getModeDisplayName = (mode: string): string => {
    const modeNames = {
      'slot-machine': '老虎机',
      'card-flip': '翻牌',
      'bullet-screen': '弹幕',
      'grid-lottery': '宫格',
      'blinking-name-picker': '闪烁'
    }
    return modeNames[mode as keyof typeof modeNames] || mode
  }

  // 获取状态颜色
  const getStatusColor = (isReady: boolean) => {
    return isReady ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上轮结果摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            上轮抽奖结果
          </CardTitle>
          <CardDescription>
            第{state.roundCount}轮 · {getModeDisplayName(lastConfig.mode)}模式 · 
            抽取{lastConfig.quantity}个 · {lastResults.length}人中奖
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 中奖者列表 */}
            <div className="flex flex-wrap gap-2">
              {lastResults.map((winner, index) => (
                <Badge 
                  key={winner.id} 
                  variant="secondary" 
                  className="bg-yellow-100 text-yellow-800"
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  {winner.name}
                </Badge>
              ))}
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-800">{lastConfig.items.length}</div>
                <div className="text-gray-500">总参与者</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{lastResults.length}</div>
                <div className="text-gray-500">已中奖</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{state.availableItems.length}</div>
                <div className="text-gray-500">可参与</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{state.roundCount}</div>
                <div className="text-gray-500">当前轮次</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 继续抽奖设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            继续抽奖设置
          </CardTitle>
          <CardDescription>
            配置下一轮抽奖的参数和规则
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 排除中奖者选项 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="exclude-winners">排除已中奖者</Label>
              <p className="text-sm text-gray-500">
                是否将上轮中奖者排除在下轮抽奖之外
              </p>
            </div>
            <Switch 
              id="exclude-winners" 
              checked={state.excludeWinners} 
              onCheckedChange={(checked) => 
                setState(prev => ({ ...prev, excludeWinners: checked }))
              } 
            />
          </div>

          {/* 状态提示 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {state.isReady ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-medium ${getStatusColor(state.isReady)}`}>
                    {state.isReady ? '可以继续抽奖' : '无法继续抽奖'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {state.excludeWinners ? (
                    <>
                      排除{lastResults.length}位中奖者后，还有{state.availableItems.length}人可参与，
                      需要抽取{lastConfig.quantity}人
                    </>
                  ) : (
                    <>
                      包含所有{lastConfig.items.length}人参与，需要抽取{lastConfig.quantity}人
                    </>
                  )}
                </div>
                {!state.isReady && (
                  <div className="text-sm text-red-600">
                    可用参与者({state.availableItems.length})少于抽取数量({lastConfig.quantity})
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleContinueDrawing}
              disabled={!state.isReady || isProcessing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  启动中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  继续抽奖
                </>
              )}
            </Button>

            {showRestartOption && (
              <Button
                variant="outline"
                onClick={handleRestart}
                disabled={isProcessing}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重新开始
              </Button>
            )}

            {showModifyOption && onModifyConfig && (
              <Button
                variant="outline"
                onClick={onModifyConfig}
                disabled={isProcessing}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                修改配置
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 参与者预览 */}
      {state.availableItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              下轮参与者预览
              <Badge variant="outline">{state.availableItems.length}人</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {state.availableItems.slice(0, 20).map((item) => (
                <Badge key={item.id} variant="outline" className="text-sm">
                  {item.name}
                </Badge>
              ))}
              {state.availableItems.length > 20 && (
                <Badge variant="outline" className="text-sm text-gray-500">
                  +{state.availableItems.length - 20}人...
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}