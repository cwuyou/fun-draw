import type { SavedList, ListItem } from "@/types"

const STORAGE_KEY = "fun-draw-lists"

export function getSavedLists(): SavedList[] {
  if (typeof window === "undefined") return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error loading saved lists:", error)
    return []
  }
}

export function saveList(list: Omit<SavedList, "id" | "createdAt" | "updatedAt">): SavedList {
  const lists = getSavedLists()
  const now = new Date().toISOString()

  const newList: SavedList = {
    ...list,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  lists.push(newList)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  return newList
}

export function updateList(id: string, updates: Partial<SavedList>): SavedList | null {
  const lists = getSavedLists()
  const index = lists.findIndex((list) => list.id === id)

  if (index === -1) return null

  lists[index] = {
    ...lists[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  return lists[index]
}

export function deleteList(id: string): boolean {
  const lists = getSavedLists()
  const filteredLists = lists.filter((list) => list.id !== id)

  if (filteredLists.length === lists.length) return false

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLists))
  return true
}

export function parseTextToItems(text: string): ListItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((name) => ({
      id: crypto.randomUUID(),
      name,
    }))
}

// 名称生成工具函数
export function generateDefaultTempName(t?: (key: string) => string): string {
  if (t) {
    return t('common.tempListName')
  }
  return "临时名单" // 降级到中文
}

export function generateTimestampName(t?: (key: string) => string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const prefix = t ? t('common.listPrefix') : '名单'

  return `${prefix}_${year}-${month}-${day}_${hour}-${minute}-${second}`
}

export function ensureUniqueName(baseName: string, existingNames: string[]): string {
  let finalName = baseName
  let counter = 1
  
  while (existingNames.includes(finalName)) {
    finalName = `${baseName}(${counter})`
    counter++
    
    // 防止无限循环，最多尝试100次
    if (counter > 100) {
      finalName = `${baseName}_${Date.now()}`
      break
    }
  }
  
  return finalName
}

export function generateUniqueListName(customName?: string, t?: (key: string) => string): string {
  // 如果提供了自定义名称且不为空，直接使用
  if (customName && customName.trim()) {
    const trimmedName = customName.trim()
    const existingNames = getSavedLists().map(list => list.name)
    return ensureUniqueName(trimmedName, existingNames)
  }

  // 否则生成时间戳名称（受语言影响的前缀）
  const timestampName = generateTimestampName(t)
  const existingNames = getSavedLists().map(list => list.name)
  return ensureUniqueName(timestampName, existingNames)
}

export function isNameEmpty(name: string): boolean {
  return !name || name.trim().length === 0
}
