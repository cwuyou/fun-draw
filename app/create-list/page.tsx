"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, Type, FileText, Trash2, Save, Play, ArrowLeft, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { ListItem } from "@/types"
import { saveList, parseTextToItems, isNameEmpty, generateUniqueListName, generateDefaultTempName } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function CreateListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [listName, setListName] = useState("")
  const [items, setItems] = useState<ListItem[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [encoding, setEncoding] = useState<string>("UTF-8")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDataRestored, setIsDataRestored] = useState(false)

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

  const checkForDuplicates = (newName: string): boolean => {
    const normalizedNewName = newName.trim().toLowerCase()
    return items.some(item => item.name.trim().toLowerCase() === normalizedNewName)
  }

  // 数据恢复机制
  useEffect(() => {
    // 只在页面首次加载且当前没有数据时尝试恢复
    if (!isDataRestored && items.length === 0 && !listName.trim()) {
      try {
        const tempList = localStorage.getItem("temp-draw-list")
        if (tempList) {
          const parsedData = JSON.parse(tempList)
          if (parsedData && parsedData.name && Array.isArray(parsedData.items) && parsedData.items.length > 0) {
            // 恢复数据
            setListName(parsedData.name === generateDefaultTempName() ? "" : parsedData.name)
            setItems(parsedData.items)

            toast({
              title: "数据已恢复",
              description: `已恢复之前的名单数据，包含 ${parsedData.items.length} 个项目`,
            })
          }
        }
      } catch (error) {
        console.error("恢复数据失败:", error)
      } finally {
        setIsDataRestored(true)
      }
    }
  }, [items.length, listName, isDataRestored, toast])

  // 添加批量选择和删除功能
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(item => item.id)))
    }
  }

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const deleteSelected = () => {
    if (selectedItems.size === 0) return

    setItems(prev => prev.filter(item => !selectedItems.has(item.id)))
    setSelectedItems(new Set())

    toast({
      title: "批量删除成功",
      description: `已删除 ${selectedItems.size} 个项目`,
    })
  }

  const addItem = () => {
    if (!newItemName.trim()) return

    console.log("检查重复项目:", newItemName.trim())
    console.log("当前项目列表:", items.map(item => item.name))

    // 检查是否重复
    if (checkForDuplicates(newItemName)) {
      console.log("发现重复项目，显示提示")
      toast({
        title: "项目已存在",
        description: `"${newItemName.trim()}" 已在名单中，请勿重复添加`,
        variant: "destructive",
      })
      return
    }

    console.log("添加新项目:", newItemName.trim())
    const newItem: ListItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
    }

    setItems((prev) => [...prev, newItem])
    setNewItemName("")
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return

    const newItems = parseTextToItems(bulkText)

    // 合并现有项目和新项目，然后去重
    const allItems = [...items, ...newItems]
    const { uniqueItems, duplicateCount } = removeDuplicateItems(allItems)

    setItems(uniqueItems)
    setBulkText("")

    // 显示添加结果
    const addedCount = uniqueItems.length - items.length
    let description = `已添加 ${addedCount} 个项目`
    if (duplicateCount > 0) {
      description += `，已自动去除 ${duplicateCount} 个重复项目`
    }

    toast({
      title: "批量添加成功",
      description,
    })
  }

  // 修改文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件大小
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "文件过大",
        description: "请上传小于5MB的文件",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        let text = e.target?.result as string

        // 自动检测编码
        if (encoding === 'auto') {
          // 检查BOM标记
          if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1) // 移除BOM
            setEncoding('UTF-8')
          } else if (/[\u4E00-\u9FA5]/.test(text)) {
            // 如果包含中文字符但解码正常，可能是UTF-8
            setEncoding('UTF-8')
          } else {
            // 尝试其他编码
            try {
              const decoder = new TextDecoder('GBK')
              const encoder = new TextEncoder()
              const bytes = encoder.encode(text)
              text = decoder.decode(bytes)
              setEncoding('GBK')
            } catch {
              // 如果GBK解码失败，保持UTF-8
              setEncoding('UTF-8')
            }
          }
        }

        // 处理CSV格式
        let lines: string[] = []
        if (file.name.toLowerCase().endsWith('.csv')) {
          // 处理CSV，支持带引号的字段和逗号分隔
          lines = text.split(/\r?\n/).map(line => {
            // 移除首尾引号并处理转义引号
            return line.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').split(',')[0]
          })
        } else {
          // 普通文本文件按行分割
          lines = text.split(/\r?\n/)
        }

        // 过滤空行和处理每行数据
        const newItems = lines
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(name => ({
            id: crypto.randomUUID(),
            name: name
          }))

        if (newItems.length === 0) {
          throw new Error("未找到有效数据")
        }

        // 合并现有项目和新项目，然后去重
        const allItems = [...items, ...newItems]
        const { uniqueItems, duplicateCount } = removeDuplicateItems(allItems)

        setItems(uniqueItems)

        // 显示导入结果
        const addedCount = uniqueItems.length - items.length
        let description = `已导入 ${addedCount} 个项目，使用 ${encoding} 编码`
        if (duplicateCount > 0) {
          description += `，已自动去除 ${duplicateCount} 个重复项目`
        }

        toast({
          title: "文件导入成功",
          description,
        })
      } catch (error) {
        toast({
          title: "文件解析失败",
          description: error instanceof Error ? error.message : "请检查文件格式是否正确",
          variant: "destructive",
        })
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    reader.onerror = () => {
      toast({
        title: "文件读取失败",
        description: "请检查文件是否损坏或重试",
        variant: "destructive",
      })
    }

    try {
      if (encoding === 'auto') {
        reader.readAsText(file) // 先尝试默认编码
      } else {
        reader.readAsText(file, encoding)
      }
    } catch (error) {
      toast({
        title: "文件读取失败",
        description: "不支持的文件编码",
        variant: "destructive",
      })
    }
  }

  const handleSaveList = async () => {
    if (items.length === 0) {
      toast({
        title: "请至少添加一个项目",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 保存前先去重
      const { uniqueItems, duplicateCount } = removeDuplicateItems(items)

      // 使用智能命名：如果用户没有输入名称，自动生成
      const finalName = generateUniqueListName(listName)
      const wasAutoGenerated = isNameEmpty(listName)

      const savedList = saveList({
        name: finalName,
        items: uniqueItems,
      })

      // 根据是否自动生成名称显示不同的成功提示
      let successMessage = wasAutoGenerated
        ? `名单保存成功，已自动命名为："${savedList.name}"`
        : `名单"${savedList.name}"已保存到名单库`

      if (duplicateCount > 0) {
        successMessage += `，已自动去除 ${duplicateCount} 个重复项目`
      }

      toast({
        title: "名单保存成功",
        description: successMessage,
      })

      router.push("/list-library")
    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }



  const handleQuickDraw = async () => {
    if (items.length === 0) {
      toast({
        title: "请至少添加一个项目",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("开始处理快速抽奖...");
      console.log("当前名单项目数量:", items.length);

      // 清除可能存在的旧数据
      localStorage.removeItem("temp-draw-list")
      localStorage.removeItem("selected-draw-list")
      console.log("已清除旧数据");

      // 将当前名单数据传递给抽奖配置页面
      const listData = {
        name: listName.trim() || generateDefaultTempName(),
        items: items.map(item => ({
          id: item.id,
          name: item.name.trim()
        }))
      }
      console.log("准备保存的数据:", listData);

      // 保存数据
      localStorage.setItem("temp-draw-list", JSON.stringify(listData))
      console.log("数据已保存到 localStorage");

      // 验证数据是否保存成功
      const savedData = localStorage.getItem("temp-draw-list")
      if (!savedData) {
        throw new Error("Failed to save list data")
      }
      const parsedData = JSON.parse(savedData);
      console.log("验证保存的数据:", parsedData);

      // 使用客户端导航 - 修复跳转问题
      console.log("准备跳转到抽奖配置页面...");

      // 添加成功提示
      toast({
        title: "准备开始抽奖",
        description: "正在跳转到抽奖配置页面...",
      })

      // 使用 window.location 确保跳转成功
      setTimeout(() => {
        console.log("执行页面跳转...");
        window.location.href = "/draw-config";
      }, 500);

    } catch (error) {
      console.error("保存名单数据失败:", error)
      toast({
        title: "跳转失败",
        description: "无法保存名单数据，请重试",
        variant: "destructive",
      })
    }
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
            <h1 className="text-2xl font-bold text-gray-800">创建名单</h1>
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
          {/* List Name */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                名单信息
              </CardTitle>
              <CardDescription>为您的名单起一个容易识别的名称</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="list-name">名单名称</Label>
                <Input
                  id="list-name"
                  placeholder="例如：三年二班学生、年会奖品池... （留空将自动生成名称）"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>添加项目</CardTitle>
              <CardDescription>选择最适合您的方式来添加抽奖项目</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    手动输入
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    批量粘贴
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    文件导入
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入项目名称，按回车或点击添加"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        console.log("按钮被点击了，当前输入值:", newItemName)
                        console.log("按钮是否被禁用:", !newItemName.trim())
                        addItem()
                      }}
                      disabled={!newItemName.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-text">批量文本（每行一个项目）</Label>
                    <Textarea
                      id="bulk-text"
                      placeholder="张三&#10;李四&#10;王五&#10;赵六"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleBulkAdd} disabled={!bulkText.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    批量添加
                  </Button>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">支持 .txt 和 .csv 文件</p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="encoding">文件编码：</Label>
                        <Select value={encoding} onValueChange={setEncoding}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="选择编码" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">自动检测</SelectItem>
                            <SelectItem value="UTF-8">UTF-8</SelectItem>
                            <SelectItem value="GB2312">GB2312</SelectItem>
                            <SelectItem value="GBK">GBK</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()}>选择文件</Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span>项目列表</span>
                    <Badge variant="outline">{items.length} 个项目</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {items.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSelectAll}
                          className="text-gray-600"
                        >
                          {selectedItems.size === items.length ? "取消全选" : "全选"}
                        </Button>
                        {selectedItems.size > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteSelected}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            删除所选 ({selectedItems.size})
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${selectedItems.has(item.id) ? 'bg-purple-50' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      onClick={() => toggleSelectItem(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                            className="data-[state=checked]:bg-purple-600"
                          />
                          <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeItem(item.id)
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleSaveList}
              disabled={isLoading || items.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? "保存中..." : isNameEmpty(listName) ? "保存到名单库（自动命名）" : "保存到名单库"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleQuickDraw}
              disabled={items.length === 0}
              className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 bg-transparent"
            >
              <Play className="w-5 h-5 mr-2" />
              快速抽奖
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
