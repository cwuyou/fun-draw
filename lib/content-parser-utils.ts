import { ListItem, ContentFormat } from '@/types'
import { parseContent, parseCSVContent, detectContentFormat } from './smart-content-parser'

/**
 * 内容解析工具函数
 * 提供便捷的解析接口和辅助功能
 */

/**
 * 预设的测试内容示例
 */
export const SAMPLE_CONTENTS = {
  numbered: `1. 张三
2. 李四
3. 王五
4. 赵六
5. 陈七`,
  
  comma: `张三,学生,18
李四,老师,25
王五,工程师,30
赵六,设计师,28`,
  
  tab: `张三	学生	18
李四	老师	25
王五	工程师	30
赵六	设计师	28`,
  
  lines: `张三
李四
王五
赵六
陈七`,
  
  mixed: `1、张三
李四
3. 王五
赵六,学生
5) 陈七`
}

/**
 * 智能解析文本内容
 * 自动检测格式并解析
 */
export const smartParseText = (content: string): {
  items: ListItem[]
  format: ContentFormat
  confidence: number
  suggestions: string[]
  duplicatesRemoved: number
  processingTime: number
} => {
  const result = parseContent(content)
  return {
    items: result.items,
    format: result.detectedFormat,
    confidence: result.confidence,
    suggestions: result.suggestions,
    duplicatesRemoved: result.duplicatesRemoved,
    processingTime: result.processingTime
  }
}

/**
 * 解析文件内容
 */
export const parseFileContent = async (file: File): Promise<{
  items: ListItem[]
  format: ContentFormat
  confidence: number
  suggestions: string[]
  duplicatesRemoved: number
  processingTime: number
  fileName: string
  fileSize: number
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        
        // 根据文件类型选择解析方法
        let result
        if (file.name.toLowerCase().endsWith('.csv')) {
          result = parseCSVContent(content)
        } else {
          result = parseContent(content)
        }
        
        resolve({
          items: result.items,
          format: result.detectedFormat,
          confidence: result.confidence,
          suggestions: result.suggestions,
          duplicatesRemoved: result.duplicatesRemoved,
          processingTime: result.processingTime,
          fileName: file.name,
          fileSize: file.size
        })
      } catch (error) {
        reject(new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    // 检查文件大小
    if (file.size > 5 * 1024 * 1024) { // 5MB
      reject(new Error('文件过大，请选择小于5MB的文件'))
      return
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 合并多个解析结果
 */
export const mergeParsingResults = (results: ListItem[][]): {
  items: ListItem[]
  duplicatesRemoved: number
} => {
  const allItems = results.flat()
  const seen = new Set<string>()
  const uniqueItems: ListItem[] = []
  let duplicatesRemoved = 0
  
  for (const item of allItems) {
    const normalizedName = item.name.toLowerCase().trim()
    if (seen.has(normalizedName)) {
      duplicatesRemoved++
    } else {
      seen.add(normalizedName)
      uniqueItems.push(item)
    }
  }
  
  return {
    items: uniqueItems,
    duplicatesRemoved
  }
}

/**
 * 验证名称有效性
 */
export const validateNames = (items: ListItem[]): {
  validItems: ListItem[]
  invalidItems: ListItem[]
  warnings: string[]
} => {
  const validItems: ListItem[] = []
  const invalidItems: ListItem[] = []
  const warnings: string[] = []
  
  for (const item of items) {
    const name = item.name.trim()
    
    // 检查名称长度
    if (name.length === 0) {
      invalidItems.push(item)
      continue
    }
    
    if (name.length > 100) {
      warnings.push(`名称"${name.substring(0, 20)}..."过长，可能影响显示`)
    }
    
    // 检查特殊字符
    if (/[<>{}[\]\\|`~!@#$%^&*+=]/.test(name)) {
      warnings.push(`名称"${name}"包含特殊字符`)
    }
    
    validItems.push(item)
  }
  
  return {
    validItems,
    invalidItems,
    warnings
  }
}

/**
 * 格式化解析统计信息
 */
export const formatParsingStats = (
  totalItems: number,
  duplicatesRemoved: number,
  processingTime: number,
  format: ContentFormat
): string => {
  const formatNames = {
    [ContentFormat.LINE_SEPARATED]: '按行分隔',
    [ContentFormat.COMMA_SEPARATED]: '逗号分隔',
    [ContentFormat.TAB_SEPARATED]: '制表符分隔',
    [ContentFormat.NUMBERED_LIST]: '带序号列表',
    [ContentFormat.MIXED_FORMAT]: '混合格式'
  }
  
  let stats = `解析完成：${formatNames[format]}格式，共${totalItems}个名称`
  
  if (duplicatesRemoved > 0) {
    stats += `，去除${duplicatesRemoved}个重复项`
  }
  
  if (processingTime > 0) {
    stats += `，耗时${processingTime}ms`
  }
  
  return stats
}

/**
 * 生成解析预览
 */
export const generateParsingPreview = (content: string, maxLines: number = 5): {
  preview: string[]
  hasMore: boolean
  totalLines: number
} => {
  if (!content.trim()) {
    return {
      preview: [],
      hasMore: false,
      totalLines: 0
    }
  }
  
  const { format } = detectContentFormat(content)
  const result = parseContent(content)
  
  const previewItems = result.items.slice(0, maxLines)
  const preview = previewItems.map(item => item.name)
  
  return {
    preview,
    hasMore: result.items.length > maxLines,
    totalLines: result.items.length
  }
}

/**
 * 检查内容是否可能是名单
 */
export const isLikelyNameList = (content: string): {
  isLikely: boolean
  confidence: number
  reasons: string[]
} => {
  const reasons: string[] = []
  let confidence = 0
  
  if (!content.trim()) {
    return {
      isLikely: false,
      confidence: 0,
      reasons: ['内容为空']
    }
  }
  
  const lines = content.split('\n').filter(line => line.trim())
  
  // 检查行数
  if (lines.length >= 2) {
    confidence += 0.3
    reasons.push('包含多行内容')
  }
  
  // 检查是否包含常见的名字模式
  const namePatterns = [
    /[\u4e00-\u9fa5]{2,4}/, // 中文姓名
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // 英文姓名
    /^\w+$/ // 单个词
  ]
  
  const nameMatches = lines.filter(line => {
    const cleanLine = line.replace(/^\s*\d+[.\-、)\s]+/, '').trim()
    return namePatterns.some(pattern => pattern.test(cleanLine))
  })
  
  if (nameMatches.length >= lines.length * 0.6) {
    confidence += 0.4
    reasons.push('包含类似姓名的内容')
  }
  
  // 检查是否有序号
  const numberedLines = lines.filter(line => /^\s*\d+[.\-、)\s]+/.test(line))
  if (numberedLines.length >= lines.length * 0.5) {
    confidence += 0.2
    reasons.push('包含序号列表')
  }
  
  // 检查行长度
  const avgLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length
  if (avgLength >= 2 && avgLength <= 20) {
    confidence += 0.1
    reasons.push('行长度适中')
  }
  
  return {
    isLikely: confidence >= 0.5,
    confidence,
    reasons
  }
}

/**
 * 导出解析结果为不同格式
 */
export const exportParsingResult = (items: ListItem[], format: 'txt' | 'csv' | 'json'): string => {
  switch (format) {
    case 'txt':
      return items.map(item => item.name).join('\n')
    
    case 'csv':
      return ['序号,姓名,ID']
        .concat(items.map((item, index) => `${index + 1},${item.name},${item.id}`))
        .join('\n')
    
    case 'json':
      return JSON.stringify(items, null, 2)
    
    default:
      return items.map(item => item.name).join('\n')
  }
}

/**
 * 创建解析结果的下载链接
 */
export const createDownloadLink = (content: string, filename: string, mimeType: string): string => {
  const blob = new Blob([content], { type: mimeType })
  return URL.createObjectURL(blob)
}