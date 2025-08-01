"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dices, CreditCard, MessageSquare, ArrowLeft, Users, Settings, Play, Hash, Save, Sparkles } from "lucide-react"
import type { DrawingMode, DrawingModeInfo, ListItem, DrawingConfig } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { saveList, generateUniqueListName, generateDefaultTempName } from "@/lib/storage"
import { getModeSpecificConfig, getMaxQuantityForMode, validateModeConfig } from "@/lib/mode-config"
import { preprocessConfigForSave } from "@/lib/config-migration"
import { Toaster } from "@/components/ui/toaster"
import QuickConfiguration from "@/components/quick-configuration"

export default function DrawConfigPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [listName, setListName] = useState("")
  const [items, setItems] = useState<ListItem[]>([])
  const [selectedMode, setSelectedMode] = useState<DrawingMode>("slot-machine")
  const [quantity, setQuantity] = useState<number | string>(1)
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [configMode, setConfigMode] = useState<'quick' | 'detailed'>('quick')

  console.log("DrawConfigPage 组件渲染");

  // 获取当前模式的特定配置
  const modeConfig = getModeSpecificConfig(selectedMode, items.length, allowRepeat)

  // 处理快速配置选择
  const handleQuickConfigSelect = (config: DrawingConfig) => {
    setSelectedMode(config.mode)
    setQuantity(config.quantity)
    setAllowRepeat(config.allowRepeat)
    
    toast({
      title: t('drawConfig.quickConfigApplied'),
      description: t('drawConfig.quickConfigAppliedDescription', { 
        mode: getModeDisplayName(config.mode), 
        quantity: config.quantity 
      }),
    })
    
    // 切换到详细配置标签页以便用户查看和微调
    setConfigMode('detailed')
  }

  // 获取模式显示名称
  const getModeDisplayName = (mode: DrawingMode): string => {
    const modeNames = {
      'slot-machine': t('drawingModes.slotMachine.name'),
      'card-flip': t('drawingModes.cardFlip.name'),
      'bullet-screen': t('drawingModes.bulletScreen.name'),
      'grid-lottery': t('drawingModes.gridLottery.name'),
      'blinking-name-picker': t('drawingModes.blinkingNamePicker.name')
    }
    return modeNames[mode] || mode
  }

  // 处理模式切换的函数
  const handleModeChange = (newMode: DrawingMode) => {
    const previousMode = selectedMode
    setSelectedMode(newMode)
    
    // 模式切换时的状态重置逻辑
    if (newMode === 'grid-lottery') {
      // 多宫格模式：强制设置数量为1
      setQuantity(1)
    } else if (previousMode === 'grid-lottery') {
      // 从多宫格模式切换到其他模式：重置为合理的默认值
      const newModeConfig = getModeSpecificConfig(newMode, items.length, allowRepeat)
      if (newModeConfig.quantityEditable) {
        // 如果新模式支持编辑数量，设置为1作为起始值
        setQuantity(1)
      }
    }
    
    // 如果切换到的模式有固定数量值，应用该值
    const targetModeConfig = getModeSpecificConfig(newMode, items.length, allowRepeat)
    if (!targetModeConfig.quantityEditable && typeof targetModeConfig.quantityValue === 'number') {
      setQuantity(targetModeConfig.quantityValue)
    }
  }

  // 配置数据清理和验证函数
  const cleanAndValidateConfig = () => {
    if (selectedMode === 'grid-lottery') {
      // 多宫格模式：确保数量为1
      if (quantity !== 1) {
        setQuantity(1)
      }
    }
  }

  // 当选择多宫格模式时，自动设置数量为1（保留作为备用）
  useEffect(() => {
    if (selectedMode === 'grid-lottery') {
      setQuantity(1)
    }
  }, [selectedMode])

  // 定期清理配置数据
  useEffect(() => {
    cleanAndValidateConfig()
  }, [selectedMode, items.length, allowRepeat])

  // 去重工具函数
  const removeDuplicateItems = (itemsToProcess: ListItem[]): { uniqueItems: ListItem[], duplicateCount: number } => {
    const nameMap = new Map<string, ListItem>()
    let duplicateCount = 0

    itemsToProcess.forEach(item => {
      const normalizedName = item.name.trim().toLowerCase()
      if (nameMap.has(normalizedName)) {
        duplicateCount++
      } else {
        nameMap.set(normalizedName, item)
      }
    })

    return {
      uniqueItems: Array.from(nameMap.values()),
      duplicateCount
    }
  }

  // 将 loadListData 移到组件顶层
  const loadListData = () => {
    console.log("执行 loadListData 函数");
    if (initialized) {
      console.log("已经初始化过，跳过加载");
      return;
    }

    try {
      console.log("开始加载名单数据...");
      
      // 尝试从临时名单加载（优先检查临时名单）
      const tempList = localStorage.getItem("temp-draw-list")
      console.log("临时名单数据:", tempList);
      
      if (tempList) {
        try {
          const list = JSON.parse(tempList)
          console.log("解析临时名单:", list);
          
          if (list && list.name && Array.isArray(list.items)) {
            console.log("临时名单有效，设置数据...");
            setListName(list.name)
            setItems(list.items)
            setIsLoading(false)
            setInitialized(true)
            console.log("临时名单数据设置成功");
            return
          } else {
            console.log("临时名单数据无效:", {
              hasName: !!list?.name,
              hasItems: Array.isArray(list?.items),
              items: list?.items
            });
          }
        } catch (e) {
          console.error("解析临时名单失败:", e)
        }
      } else {
        console.log("未找到临时名单数据");
      }

      // 尝试从选中的名单加载
      const selectedList = localStorage.getItem("selected-draw-list")
      console.log("选中的名单数据:", selectedList);
      
      if (selectedList) {
        try {
          const list = JSON.parse(selectedList)
          console.log("解析选中的名单:", list);
          
          if (list && list.name && Array.isArray(list.items)) {
            console.log("选中的名单有效，设置数据...");
            setListName(list.name)
            setItems(list.items)
            setIsLoading(false)
            setInitialized(true)
            console.log("选中的名单数据设置成功");
            return
          }
        } catch (e) {
          console.error("解析选中的名单失败:", e)
        }
      }

      // 没有找到有效的名单数据，跳转到创建页面
      console.log("没有找到有效的名单数据，准备跳转...");
      toast({
        title: t('drawConfig.pleaseCreateList'),
        description: t('drawConfig.pleaseCreateListDescription'),
      })
      
      // 使用客户端导航
      setTimeout(() => {
        router.push("/create-list");
      }, 100);

    } catch (error) {
      console.error("加载名单数据失败:", error)
      toast({
        title: t('drawConfig.loadFailed'),
        description: t('drawConfig.loadFailedDescription'),
        variant: "destructive",
      })
      
      // 使用客户端导航
      setTimeout(() => {
        router.push("/create-list");
      }, 100);
    }
  }

  // 使用 useEffect 来处理客户端数据加载
  useEffect(() => {
    console.log("DrawConfigPage useEffect 执行");
    // 组件挂载时加载数据
    loadListData()
    
    // 组件卸载时清理数据
    return () => {
      console.log("DrawConfigPage 组件卸载");
      if (initialized) {
        localStorage.removeItem("temp-draw-list")
        localStorage.removeItem("selected-draw-list")
      }
    }
  }, []) // 空依赖数组，只在组件挂载时执行一次

  const drawingModes: DrawingModeInfo[] = [
    {
      id: "slot-machine",
      name: t('drawingModes.slotMachine.shortTitle'),
      description: t('drawingModes.slotMachine.description'),
      icon: <Dices className="w-6 h-6" />,
      color: "bg-red-500",
    },
    {
      id: "card-flip",
      name: t('drawingModes.cardFlip.shortTitle'),
      description: t('drawingModes.cardFlip.description'),
      icon: <CreditCard className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      id: "bullet-screen",
      name: t('drawingModes.bulletScreen.title'),
      description: t('drawingModes.bulletScreen.description'),
      icon: <MessageSquare className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      id: "grid-lottery",
      name: t('drawingModes.gridLottery.shortTitle'),
      description: t('drawingModes.gridLottery.description'),
      icon: <Hash className="w-6 h-6" />,
      color: "bg-indigo-500",
    },
    {
      id: "blinking-name-picker",
      name: t('drawingModes.blinkingNamePicker.title'),
      description: t('drawingModes.blinkingNamePicker.description'),
      icon: <Sparkles className="w-6 h-6" />,
      color: "bg-pink-500",
    },
  ]

  const handleSaveCurrentList = async () => {
    if (items.length === 0) {
      toast({
        title: t('drawConfig.listEmpty'),
        description: t('drawConfig.listEmptyDescription'),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // 保存前先去重
      const { uniqueItems, duplicateCount } = removeDuplicateItems(items)
      
      // 多宫格模式的数据验证和清理
      if (selectedMode === 'grid-lottery') {
        // 确保数量设置为1
        if (quantity !== 1) {
          setQuantity(1)
        }
        
        // 检查名称数量并给出相应提示
        if (uniqueItems.length > 15) {
          toast({
            title: t('drawConfig.saveHint'),
            description: t('drawConfig.saveHintDescription', { count: uniqueItems.length }),
          })
        }
      }
      
      // 如果是临时名单，生成一个新的名称；否则使用当前名称
      const finalName = listName === generateDefaultTempName() 
        ? generateUniqueListName() 
        : generateUniqueListName(listName)

      const savedList = saveList({
        name: finalName,
        items: uniqueItems,
      })

      // 更新当前显示的数据
      setItems(uniqueItems)
      setListName(savedList.name)
      
      // 清除临时数据，因为已经正式保存了
      localStorage.removeItem("temp-draw-list")

      // 显示保存结果
      const description = duplicateCount > 0 
        ? t('drawConfig.saveSuccessWithDuplicates', { 
            message: t('drawConfig.saveSuccessDescription', { name: savedList.name }), 
            duplicates: duplicateCount 
          })
        : t('drawConfig.saveSuccessDescription', { name: savedList.name })

      toast({
        title: t('drawConfig.saveSuccess'),
        description,
      })

    } catch (error) {
      toast({
        title: t('drawConfig.saveFailed'),
        description: t('drawConfig.saveFailedDescription'),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartDraw = () => {
    if (items.length === 0) {
      toast({
        title: t('drawConfig.listEmpty'),
        description: t('drawConfig.listEmptyDrawDescription'),
        variant: "destructive",
      })
      return
    }

    // 确保quantity是有效数字
    const numQuantity = typeof quantity === 'string' ? Number.parseInt(quantity) || 1 : quantity
    
    // 如果quantity无效，先设置为有效值
    if (typeof quantity === 'string' || quantity < 1) {
      setQuantity(numQuantity)
    }

    // 对于多宫格模式，强制设置数量为1
    const finalQuantity = selectedMode === 'grid-lottery' ? 1 : numQuantity

    // 多宫格模式的特殊验证
    if (selectedMode === 'grid-lottery') {
      // 确保数量始终为1
      if (finalQuantity !== 1) {
        toast({
          title: t('drawConfig.configError'),
          description: t('drawConfig.gridLotteryOnlyOne'),
          variant: "destructive",
        })
        setQuantity(1)
        return
      }

      // 检查名称数量并给出相应提示
      if (items.length > 15) {
        toast({
          title: t('drawConfig.nameCountHint'),
          description: t('drawConfig.nameCountHintDescription', { count: items.length }),
        })
      } else if (items.length < 6 && !allowRepeat) {
        toast({
          title: t('drawConfig.gridLotteryTip'),
          description: t('drawConfig.gridLotteryTipDescription', { count: items.length }),
        })
      }
    }

    const config: DrawingConfig = {
      mode: selectedMode,
      quantity: finalQuantity,
      allowRepeat,
      items,
    }

    // 预处理配置以确保兼容性
    const processedConfig = preprocessConfigForSave(config)

    // 使用新的验证系统
    const validationResult = validateModeConfig(processedConfig)
    
    if (!validationResult.isValid) {
      toast({
        title: t('drawConfig.configError'),
        description: validationResult.errors[0],
        variant: "destructive",
      })
      
      // 如果有修正配置，应用它
      if (validationResult.correctedConfig) {
        if (validationResult.correctedConfig.quantity !== undefined) {
          setQuantity(validationResult.correctedConfig.quantity)
        }
      }
      return
    }

    // 显示警告信息（如果有）
    if (validationResult.warnings.length > 0) {
      toast({
        title: t('drawConfig.gridLotteryTip'),
        description: validationResult.warnings[0],
      })
    }

    localStorage.setItem("draw-config", JSON.stringify(processedConfig))

    // 根据选择的模式跳转到对应页面
    router.push(`/draw/${selectedMode}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('drawConfig.loading')}</p>
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
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('drawConfig.back')}
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">{t('drawConfig.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Users className="w-3 h-3 mr-1" />
              {t('drawConfig.itemsCount', { count: items.length })}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* List Info */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {t('drawConfig.currentList', { name: listName })}
              </CardTitle>
              <CardDescription>
                {t('drawConfig.itemsPreview', { 
                  count: items.length,
                  preview: items
                    .slice(0, 5)
                    .map((item) => item.name)
                    .join("、") + (items.length > 5 ? "..." : "")
                })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Configuration Tabs */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                {t('drawConfig.configurationSettings')}
              </CardTitle>
              <CardDescription>{t('drawConfig.configurationSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={configMode} onValueChange={(value) => setConfigMode(value as 'quick' | 'detailed')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="quick" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('drawConfig.quickConfig')}
                  </TabsTrigger>
                  <TabsTrigger value="detailed" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {t('drawConfig.detailedConfig')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quick" className="space-y-6">
                  <QuickConfiguration
                    items={items}
                    onConfigSelect={handleQuickConfigSelect}
                    showRecommendations={true}
                    maxRecommendations={4}
                  />
                </TabsContent>

                <TabsContent value="detailed" className="space-y-6">
                  {/* Drawing Mode Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-purple-600" />
                      {t('drawConfig.selectMode')}
                    </h3>
                    <p className="text-gray-600 mb-4">{t('drawConfig.selectModeDescription')}</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {drawingModes.map((mode) => (
                        <Card
                          key={mode.id}
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            selectedMode === mode.id ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleModeChange(mode.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 ${mode.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                              >
                                <div className="text-white">{mode.icon}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 mb-1">{mode.name}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{mode.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Drawing Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-purple-600" />
                      {t('drawConfig.drawSettings')}
                    </h3>
                    <p className="text-gray-600 mb-4">{t('drawConfig.drawSettingsDescription')}</p>
                    
                    <div className="space-y-6">
                      {/* 多宫格模式特殊说明 */}
                      {selectedMode === 'grid-lottery' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Hash className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">{t('drawConfig.gridLotteryFeatures')}</h4>
                              <ul className="text-sm text-blue-800 space-y-1">
                                <li>• {t('drawConfig.gridLotteryFeature1')}</li>
                                <li>• {t('drawConfig.gridLotteryFeature2')}</li>
                                <li>• {t('drawConfig.gridLotteryFeature3')}</li>
                                <li>• {t('drawConfig.gridLotteryFeature4')}</li>
                                <li>• {t('drawConfig.gridLotteryFeature5')}</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 数量设置区域 */}
                      {selectedMode === 'grid-lottery' ? (
                        <div className="space-y-2">
                          <Label htmlFor="quantity">{t('drawConfig.drawQuantity')}</Label>
                          <div className="flex items-center gap-3">
                            <div className="w-32 px-3 py-2 border border-blue-300 rounded-md bg-blue-50 text-blue-700 font-semibold">
                              {t('drawConfig.oneWinner')}
                            </div>
                            <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {t('drawConfig.fixedQuantity')}
                            </div>
                          </div>
                          <p className="text-sm text-blue-600">
                            {t('drawConfig.gridLotteryQuantityDescription')}
                          </p>
                        </div>
                      ) : modeConfig.showQuantityInput && (
                        <div className="space-y-2">
                          <Label htmlFor="quantity">{t('drawConfig.drawQuantity')}</Label>
                          {modeConfig.quantityEditable ? (
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              max={getMaxQuantityForMode(selectedMode, allowRepeat, items.length)}
                              value={quantity}
                              onChange={(e) => {
                                const inputValue = e.target.value
                                
                                // 允许空值，让用户可以清空输入框
                                if (inputValue === '') {
                                  setQuantity('')
                                  return
                                }
                                
                                const numValue = Number.parseInt(inputValue)
                                
                                // 如果输入的不是有效数字，保持当前值
                                if (isNaN(numValue)) {
                                  return
                                }
                                
                                const maxValue = getMaxQuantityForMode(selectedMode, allowRepeat, items.length)
                                
                                // 允许用户输入，但在合理范围内
                                if (numValue >= 1 && numValue <= maxValue) {
                                  setQuantity(numValue)
                                } else if (numValue > maxValue) {
                                  setQuantity(maxValue)
                                } else if (numValue < 1) {
                                  setQuantity(1)
                                }
                              }}
                              onBlur={(e) => {
                                // 当失去焦点时，如果是空值则设为1
                                if (e.target.value === '' || isNaN(Number.parseInt(e.target.value))) {
                                  setQuantity(1)
                                }
                              }}
                              placeholder={t('drawConfig.quantityPlaceholder')}
                              className="w-32"
                            />
                          ) : (
                            <div className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 font-medium cursor-not-allowed">
                              {modeConfig.quantityValue}
                            </div>
                          )}
                          <p className="text-sm text-gray-500">
                            {modeConfig.description}
                          </p>
                          {modeConfig.helpText && (
                            <p className="text-xs text-gray-400">
                              {modeConfig.helpText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 重复设置 - 多宫格模式特殊处理 */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="allow-repeat">{t('drawConfig.allowRepeat')}</Label>
                          {selectedMode === 'grid-lottery' ? (
                            <p className="text-sm text-blue-600">
                              {t('drawConfig.gridLotteryRepeatDescription')}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">{t('drawConfig.allowRepeatDescription')}</p>
                          )}
                        </div>
                        <Switch id="allow-repeat" checked={allowRepeat} onCheckedChange={setAllowRepeat} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* 只有当前是临时名单时才显示保存按钮 */}
            {listName === generateDefaultTempName() && (
              <Button
                size="lg"
                onClick={handleSaveCurrentList}
                disabled={isSaving || items.length === 0}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 bg-transparent"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? t('drawConfig.saving') : t('drawConfig.saveToLibrary')}
              </Button>
            )}
            
            <Button
              size="lg"
              onClick={handleStartDraw}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg font-semibold"
            >
              <Play className="w-6 h-6 mr-3" />
              {t('drawConfig.startDraw')}
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
