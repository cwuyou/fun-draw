"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dices, Gift, CreditCard, MessageSquare, Gamepad2, ArrowLeft, Users, Settings, Play, Hash, Save } from "lucide-react"
import type { DrawingMode, DrawingModeInfo, ListItem, DrawingConfig } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { saveList, generateUniqueListName, generateDefaultTempName } from "@/lib/storage"
import { Toaster } from "@/components/ui/toaster"

export default function DrawConfigPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [listName, setListName] = useState("")
  const [items, setItems] = useState<ListItem[]>([])
  const [selectedMode, setSelectedMode] = useState<DrawingMode>("slot-machine")
  const [quantity, setQuantity] = useState(1)
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  console.log("DrawConfigPage 组件渲染");

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
        title: "请先创建名单",
        description: "需要先创建或选择一个名单才能开始抽奖",
      })
      
      // 使用客户端导航
      setTimeout(() => {
        router.push("/create-list");
      }, 100);

    } catch (error) {
      console.error("加载名单数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载名单数据，请重新创建名单",
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
      name: "老虎机式",
      description: "经典滚轮动画，紧张刺激的抽奖体验",
      icon: <Dices className="w-6 h-6" />,
      color: "bg-red-500",
    },
    {
      id: "blind-box",
      name: "盲盒式",
      description: "神秘开箱动画，充满惊喜的揭晓时刻",
      icon: <Gift className="w-6 h-6" />,
      color: "bg-purple-500",
    },
    {
      id: "card-flip",
      name: "卡牌抽取式",
      description: "优雅翻牌动画，如同魔术师的表演",
      icon: <CreditCard className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      id: "bullet-screen",
      name: "弹幕滚动式",
      description: "快速滚动定格，动感十足的选择过程",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      id: "gashapon",
      name: "扭蛋机式",
      description: "可爱扭蛋动画，童趣满满的抽奖方式",
      icon: <Gamepad2 className="w-6 h-6" />,
      color: "bg-orange-500",
    },
  ]

  const handleSaveCurrentList = async () => {
    if (items.length === 0) {
      toast({
        title: "名单为空",
        description: "当前没有可保存的项目",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // 保存前先去重
      const { uniqueItems, duplicateCount } = removeDuplicateItems(items)
      
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
      let description = `名单"${savedList.name}"已保存到名单库`
      if (duplicateCount > 0) {
        description += `，已自动去除 ${duplicateCount} 个重复项目`
      }

      toast({
        title: "名单保存成功",
        description,
      })

    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartDraw = () => {
    if (items.length === 0) {
      toast({
        title: "名单为空",
        description: "请先添加抽奖项目",
        variant: "destructive",
      })
      return
    }

    if (quantity > items.length && !allowRepeat) {
      toast({
        title: "抽取数量过多",
        description: "在不允许重复的情况下，抽取数量不能超过项目总数",
        variant: "destructive",
      })
      return
    }

    const config: DrawingConfig = {
      mode: selectedMode,
      quantity,
      allowRepeat,
      items,
    }

    localStorage.setItem("draw-config", JSON.stringify(config))

    // 根据选择的模式跳转到对应页面
    router.push(`/draw/${selectedMode}`)
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">抽奖配置</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Users className="w-3 h-3 mr-1" />
              {items.length} 个项目
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
                当前名单：{listName}
              </CardTitle>
              <CardDescription>
                共 {items.length} 个项目：
                {items
                  .slice(0, 5)
                  .map((item) => item.name)
                  .join("、")}
                {items.length > 5 && "..."}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Drawing Mode Selection */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                选择抽奖模式
              </CardTitle>
              <CardDescription>每种模式都有独特的动画效果和体验</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drawingModes.map((mode) => (
                  <Card
                    key={mode.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      selectedMode === mode.id ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMode(mode.id)}
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
            </CardContent>
          </Card>

          {/* Drawing Settings */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-600" />
                抽奖设置
              </CardTitle>
              <CardDescription>配置抽奖的具体参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">抽取数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={allowRepeat ? 100 : items.length}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-32"
                />
                <p className="text-sm text-gray-500">
                  单次抽取的项目数量（最多 {allowRepeat ? 100 : items.length} 个）
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow-repeat">允许重复中奖</Label>
                  <p className="text-sm text-gray-500">开启后，同一个项目可以被多次抽中</p>
                </div>
                <Switch id="allow-repeat" checked={allowRepeat} onCheckedChange={setAllowRepeat} />
              </div>
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
                {isSaving ? "保存中..." : "保存到名单库"}
              </Button>
            )}
            
            <Button
              size="lg"
              onClick={handleStartDraw}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg font-semibold"
            >
              <Play className="w-6 h-6 mr-3" />
              开始抽奖
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
