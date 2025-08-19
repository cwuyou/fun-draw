"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, Play, Users, Calendar, FileText } from "lucide-react"
import type { SavedList } from "@/types"
import { getSavedLists, deleteList } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from '@/contexts/header-context'


export default function ListLibraryPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [lists, setLists] = useState<SavedList[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = () => {
    setIsLoading(true)
    try {
      const savedLists = getSavedLists()
      setLists(savedLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    } catch (error) {
      toast({
        title: t('listLibrary.loadFailed'),
        description: t('listLibrary.loadFailedDescription'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteList = (id: string, name: string) => {
    if (confirm(t('listLibrary.deleteConfirm', { name }))) {
      if (deleteList(id)) {
        setLists((prev) => prev.filter((list) => list.id !== id))
        toast({
          title: t('listLibrary.deleteSuccess'),
          description: t('listLibrary.deleteSuccessDescription', { name }),
        })
      } else {
        toast({
          title: t('listLibrary.deleteFailed'),
          variant: "destructive",
        })
      }
    }
  }

  const handleUseList = (list: SavedList) => {
    // 清除可能存在的临时名单数据，确保使用选中的名单
    localStorage.removeItem("temp-draw-list")
    localStorage.setItem("selected-draw-list", JSON.stringify(list))
    router.push("/draw-config")
  }

  const filteredLists = lists.filter((list) => list.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (dateString: string) => {
    const locale = t('common.locale') === 'zh' ? 'zh-CN' : 'en-US'
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const toggleSelectAll = () => {
    if (selectedLists.size === filteredLists.length) {
      setSelectedLists(new Set())
    } else {
      setSelectedLists(new Set(filteredLists.map(list => list.id)))
    }
  }

  const toggleSelectList = (id: string, event: React.MouseEvent) => {
    // 防止点击卡片内的按钮时触发选择
    if ((event.target as HTMLElement).closest('button')) {
      return
    }

    const newSelected = new Set(selectedLists)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedLists(newSelected)
  }

  const handleBatchDelete = () => {
    if (selectedLists.size === 0) return

    if (confirm(t('listLibrary.batchDeleteConfirm', { count: selectedLists.size }))) {
      let successCount = 0
      selectedLists.forEach(id => {
        if (deleteList(id)) {
          successCount++
        }
      })

      setLists(prev => prev.filter(list => !selectedLists.has(list.id)))
      setSelectedLists(new Set())

      toast({
        title: t('listLibrary.batchDeleteSuccess'),
        description: t('listLibrary.batchDeleteSuccessDescription', { count: successCount }),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Inject page header into GlobalHeader */}
      <PageHeader
        title={t('listLibrary.title')}
        actions={
          <div className="flex items-center gap-2">
            {filteredLists.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={toggleSelectAll} className="text-gray-600">
                  {selectedLists.size === filteredLists.length ? t('listLibrary.deselectAll') : t('listLibrary.selectAll')}
                </Button>
                {selectedLists.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600">
                    {t('listLibrary.deleteSelected', { count: selectedLists.size })}
                  </Button>
                )}
              </>
            )}
            <Button onClick={() => router.push("/create-list")} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('listLibrary.newList')}
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('listLibrary.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lists Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">{t('listLibrary.loading')}</p>
            </div>
          ) : filteredLists.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery ? t('listLibrary.noListsFound') : t('listLibrary.noListsYet')}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? t('listLibrary.tryOtherKeywords') : t('listLibrary.createFirstList')}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => router.push("/create-list")}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('listLibrary.createList')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map((list) => (
                <Card
                  key={list.id}
                  className={`border-0 shadow-lg transition-all cursor-pointer ${
                    selectedLists.has(list.id)
                      ? 'bg-purple-50/80 border-2 border-purple-200'
                      : 'bg-white/80 hover:shadow-xl'
                  } backdrop-blur-sm`}
                  onClick={(e) => toggleSelectList(list.id, e)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                          {list.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {t('listLibrary.itemsCount', { count: list.items.length })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(list.updatedAt)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                        {list.items.slice(0, 6).map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                        {list.items.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{list.items.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUseList(list)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {t('listLibrary.use')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteList(list.id, list.name)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
