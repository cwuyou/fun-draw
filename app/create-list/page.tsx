"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Plus, Upload, Type, FileText, Trash2, Save, Play, ArrowLeft, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { ListItem } from "@/types"
import { saveList, parseTextToItems, isNameEmpty, generateUniqueListName, generateDefaultTempName } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import EnhancedFileUpload from "@/components/enhanced-file-upload"
import SmartContentPaste from "@/components/smart-content-paste"

export default function CreateListPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [listName, setListName] = useState("")
  const [items, setItems] = useState<ListItem[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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
            setListName(parsedData.name === generateDefaultTempName(t) ? "" : parsedData.name)
            setItems(parsedData.items)

            toast({
              title: t('createList.dataRestored'),
              description: t('createList.dataRestoredDescription', { count: parsedData.items.length }),
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
      title: t('createList.batchDeleteSuccess'),
      description: t('createList.batchDeleteSuccessDescription', { count: selectedItems.size }),
    })
  }

  const addItem = () => {
    if (!newItemName.trim()) return

    console.log("检查重复名称:", newItemName.trim())
    console.log("当前名称列表:", items.map(item => item.name))

    // 检查是否重复
    if (checkForDuplicates(newItemName)) {
      console.log("发现重复名称，显示提示")
      toast({
        title: t('createList.nameExists'),
        description: t('createList.nameExistsDescription', { name: newItemName.trim() }),
        variant: "destructive",
      })
      return
    }

    console.log("添加新名称:", newItemName.trim())
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



  // 处理增强文件上传
  const handleEnhancedFileUpload = (newItems: ListItem[]) => {
    if (newItems.length === 0) return

    // 合并现有名称和新名称，然后去重
    const allItems = [...items, ...newItems]
    const { uniqueItems, duplicateCount } = removeDuplicateItems(allItems)

    setItems(uniqueItems)

    // 显示导入结果
    const addedCount = uniqueItems.length - items.length
    const description = duplicateCount > 0 
      ? t('createList.fileImportSuccessWithDuplicates', { added: addedCount, duplicates: duplicateCount })
      : t('createList.fileImportSuccessDescription', { added: addedCount })

    toast({
      title: t('createList.fileImportSuccess'),
      description,
    })
  }

  // 处理智能内容解析
  const handleSmartContentParsed = (newItems: ListItem[]) => {
    if (newItems.length === 0) return

    // 合并现有名称和新名称，然后去重
    const allItems = [...items, ...newItems]
    const { uniqueItems, duplicateCount } = removeDuplicateItems(allItems)

    setItems(uniqueItems)

    // 显示添加结果
    const addedCount = uniqueItems.length - items.length
    const description = duplicateCount > 0 
      ? t('createList.batchAddSuccessWithDuplicates', { added: addedCount, duplicates: duplicateCount })
      : t('createList.batchAddSuccessDescription', { added: addedCount })

    toast({
      title: t('createList.batchAddSuccess'),
      description,
    })
  }

  const handleSaveList = async () => {
    if (items.length === 0) {
      toast({
        title: t('createList.addAtLeastOne'),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 保存前先去重
      const { uniqueItems, duplicateCount } = removeDuplicateItems(items)

      // 使用智能命名：如果用户没有输入名称，自动生成
      const finalName = generateUniqueListName(listName, t)
      const wasAutoGenerated = isNameEmpty(listName)

      const savedList = saveList({
        name: finalName,
        items: uniqueItems,
      })

      // 根据是否自动生成名称显示不同的成功提示
      let successMessage = wasAutoGenerated
        ? t('createList.saveSuccessAuto', { name: savedList.name })
        : t('createList.saveSuccessDescription', { name: savedList.name })

      if (duplicateCount > 0) {
        successMessage = t('createList.saveSuccessWithDuplicates', { message: successMessage, duplicates: duplicateCount })
      }

      toast({
        title: t('createList.saveSuccess'),
        description: successMessage,
      })

      router.push("/list-library")
    } catch (error) {
      toast({
        title: t('createList.saveFailed'),
        description: t('createList.saveFailedDescription'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }



  const handleQuickDraw = async () => {
    if (items.length === 0) {
      toast({
        title: t('createList.addAtLeastOne'),
        variant: "destructive",
      })
      return
    }

    try {
      console.log("开始处理快速抽奖...");
      console.log("当前名单名称数量:", items.length);

      // 清除可能存在的旧数据
      localStorage.removeItem("temp-draw-list")
      localStorage.removeItem("selected-draw-list")
      console.log("已清除旧数据");

      // 将当前名单数据传递给抽奖配置页面
      const listData = {
        name: listName.trim() || generateDefaultTempName(t),
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
        title: t('createList.preparingDraw'),
        description: t('createList.preparingDrawDescription'),
      })

      // 使用 window.location 确保跳转成功
      setTimeout(() => {
        console.log("执行页面跳转...");
        window.location.href = "/draw-config";
      }, 500);

    } catch (error) {
      console.error("保存名单数据失败:", error)
      toast({
        title: t('createList.jumpFailed'),
        description: t('createList.jumpFailedDescription'),
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
              {t('createList.back')}
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">{t('createList.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Users className="w-3 h-3 mr-1" />
              {t('createList.itemsCount', { count: items.length })}
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
                {t('createList.listInfo')}
              </CardTitle>
              <CardDescription>{t('createList.listInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="list-name">{t('createList.listName')}</Label>
                <Input
                  id="list-name"
                  placeholder={t('createList.listNamePlaceholder')}
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
              <CardTitle>{t('createList.addList')}</CardTitle>
              <CardDescription>{t('createList.addListDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    {t('createList.manualInput')}
                  </TabsTrigger>
                  <TabsTrigger value="smart-paste" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('createList.smartPaste')}
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {t('createList.fileImport')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('createList.inputPlaceholder')}
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
                      {t('createList.addButton')}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="smart-paste" className="space-y-4">
                  <SmartContentPaste
                    onContentParsed={handleSmartContentParsed}
                    placeholder={t('createList.smartPastePlaceholder')}
                    maxLength={50000}
                    showPreview={true}
                  />
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <EnhancedFileUpload
                    onFileProcessed={handleEnhancedFileUpload}
                    maxFileSize={10}
                    acceptedFormats={['.txt', '.csv', '.xlsx']}
                    showPreview={true}
                    className="w-full"
                  />
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
                    <span>{t('createList.nameList')}</span>
                    <Badge variant="outline">{t('createList.itemsCount', { count: items.length })}</Badge>
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
                          {selectedItems.size === items.length ? t('createList.deselectAll') : t('createList.selectAll')}
                        </Button>
                        {selectedItems.size > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteSelected}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {t('createList.deleteSelected', { count: selectedItems.size })}
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
              {isLoading ? t('createList.saving') : isNameEmpty(listName) ? t('createList.saveToLibraryAuto') : t('createList.saveToLibrary')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleQuickDraw}
              disabled={items.length === 0}
              className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 bg-transparent"
            >
              <Play className="w-5 h-5 mr-2" />
              {t('createList.quickDraw')}
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
