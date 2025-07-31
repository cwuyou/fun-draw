import { ListItem, ContentFormat, ContentParsingResult } from '@/types'

/**
 * 智能内容解析系统
 * 自动识别和解析各种格式的文本内容，提取名称列表
 */

/**
 * 格式检测规则
 */
interface FormatDetectionRule {
  pattern: RegExp
  format: ContentFormat
  priority: number
  validator: (content: string) => boolean
  confidence: number
}

/**
 * 预定义的格式检测规则
 */
const FORMAT_DETECTION_RULES: FormatDetectionRule[] = [
  // 带序号的列表格式
  {
    pattern: /^\s*\d+[.\-、)\s]+(.+)$/gm,
    format: ContentFormat.NUMBERED_LIST,
    priority: 10,
    validator: (content: string) => {
      const lines = content.split('\n').filter(line => line.trim())
      const numberedLines = lines.filter(line => /^\s*\d+[.\-、)\s]+/.test(line))
      return numberedLines.length >= Math.min(3, lines.length * 0.6)
    },
    confidence: 0.9
  },
  
  // 制表符分隔格式
  {
    pattern: /^[^\t\n]+\t[^\t\n]+/gm,
    format: ContentFormat.TAB_SEPARATED,
    priority: 8,
    validator: (content: string) => {
      const lines = content.split('\n').filter(line => line.trim())
      const tabLines = lines.filter(line => line.includes('\t'))
      return tabLines.length >= Math.min(2, lines.length * 0.5)
    },
    confidence: 0.85
  },
  
  // 逗号分隔格式
  {
    pattern: /^[^,\n]+,[^,\n]+/gm,
    format: ContentFormat.COMMA_SEPARATED,
    priority: 6,
    validator: (content: string) => {
      const lines = content.split('\n').filter(line => line.trim())
      const commaLines = lines.filter(line => line.includes(',') && line.split(',').length >= 2)
      return commaLines.length >= Math.min(2, lines.length * 0.5)
    },
    confidence: 0.7
  },
  
  // 换行分隔格式（默认）
  {
    pattern: /^(.+)$/gm,
    format: ContentFormat.LINE_SEPARATED,
    priority: 1,
    validator: (content: string) => {
      const lines = content.split('\n').filter(line => line.trim())
      return lines.length >= 1
    },
    confidence: 0.5
  }
]

/**
 * 检测内容格式
 */
export const detectContentFormat = (content: string): {
  format: ContentFormat
  confidence: number
  suggestions: string[]
} => {
  if (!content || !content.trim()) {
    return {
      format: ContentFormat.LINE_SEPARATED,
      confidence: 0,
      suggestions: ['请输入要解析的内容']
    }
  }

  const suggestions: string[] = []
  let bestMatch = FORMAT_DETECTION_RULES[FORMAT_DETECTION_RULES.length - 1] // 默认为换行分隔
  let bestScore = 0

  for (const rule of FORMAT_DETECTION_RULES) {
    if (rule.validator(content)) {
      const matches = content.match(rule.pattern)
      const matchCount = matches ? matches.length : 0
      const score = rule.priority * rule.confidence * (matchCount / 10)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = rule
      }
    }
  }

  // 生成建议
  switch (bestMatch.format) {
    case ContentFormat.NUMBERED_LIST:
      suggestions.push('检测到带序号的列表，将自动去除序号')
      break
    case ContentFormat.COMMA_SEPARATED:
      suggestions.push('检测到逗号分隔格式，将提取第一列作为名称')
      break
    case ContentFormat.TAB_SEPARATED:
      suggestions.push('检测到制表符分隔格式，将提取第一列作为名称')
      break
    case ContentFormat.LINE_SEPARATED:
      suggestions.push('按行分隔解析，每行一个名称')
      break
  }

  return {
    format: bestMatch.format,
    confidence: bestMatch.confidence,
    suggestions
  }
}

/**
 * 清理和标准化名称
 */
const cleanName = (name: string): string => {
  return name
    .trim()
    // 去除常见的序号格式
    .replace(/^\s*\d+[.\-、)\s]+/, '')
    // 去除引号
    .replace(/^["'`]|["'`]$/g, '')
    // 去除多余空格
    .replace(/\s+/g, ' ')
    // 去除特殊字符（保留中文、英文、数字、常用符号）
    .replace(/[^\u4e00-\u9fa5\w\s\-_.()（）]/g, '')
    .trim()
}

/**
 * 根据格式解析内容
 */
const parseByFormat = (content: string, format: ContentFormat): string[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  
  switch (format) {
    case ContentFormat.NUMBERED_LIST:
      return lines
        .map(line => {
          const match = line.match(/^\s*\d+[.\-、)\s]+(.+)$/)
          return match ? match[1] : line
        })
        .map(cleanName)
        .filter(name => name.length > 0)
    
    case ContentFormat.COMMA_SEPARATED:
      return lines
        .map(line => {
          const parts = line.split(',')
          return parts[0] // 取第一列
        })
        .map(cleanName)
        .filter(name => name.length > 0)
    
    case ContentFormat.TAB_SEPARATED:
      return lines
        .map(line => {
          const parts = line.split('\t')
          return parts[0] // 取第一列
        })
        .map(cleanName)
        .filter(name => name.length > 0)
    
    case ContentFormat.LINE_SEPARATED:
    default:
      return lines
        .map(cleanName)
        .filter(name => name.length > 0)
  }
}

/**
 * 去重处理
 */
const deduplicateNames = (names: string[]): { uniqueNames: string[], duplicateCount: number } => {
  const seen = new Set<string>()
  const uniqueNames: string[] = []
  let duplicateCount = 0

  for (const name of names) {
    const normalizedName = name.toLowerCase().trim()
    if (seen.has(normalizedName)) {
      duplicateCount++
    } else {
      seen.add(normalizedName)
      uniqueNames.push(name)
    }
  }

  return { uniqueNames, duplicateCount }
}

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * 主要的内容解析函数
 */
export const parseContent = (content: string): ContentParsingResult => {
  const startTime = performance.now()
  
  if (!content || !content.trim()) {
    return {
      items: [],
      detectedFormat: ContentFormat.LINE_SEPARATED,
      confidence: 0,
      suggestions: ['请输入要解析的内容'],
      duplicatesRemoved: 0,
      processingTime: 0
    }
  }

  try {
    // 检测格式
    const { format, confidence, suggestions } = detectContentFormat(content)
    
    // 解析内容
    const rawNames = parseByFormat(content, format)
    
    // 去重处理
    const { uniqueNames, duplicateCount } = deduplicateNames(rawNames)
    
    // 转换为ListItem格式
    const items: ListItem[] = uniqueNames.map(name => ({
      id: generateId(),
      name
    }))
    
    const endTime = performance.now()
    const processingTime = Math.round(endTime - startTime)
    
    // 添加处理结果建议
    const finalSuggestions = [...suggestions]
    if (duplicateCount > 0) {
      finalSuggestions.push(`已自动去除 ${duplicateCount} 个重复名称`)
    }
    if (items.length === 0) {
      finalSuggestions.push('未能解析出有效的名称，请检查内容格式')
    } else {
      finalSuggestions.push(`成功解析出 ${items.length} 个名称`)
    }
    
    return {
      items,
      detectedFormat: format,
      confidence,
      suggestions: finalSuggestions,
      duplicatesRemoved: duplicateCount,
      processingTime
    }
  } catch (error) {
    console.error('Content parsing failed:', error)
    
    return {
      items: [],
      detectedFormat: ContentFormat.LINE_SEPARATED,
      confidence: 0,
      suggestions: ['解析失败，请检查内容格式'],
      duplicatesRemoved: 0,
      processingTime: performance.now() - startTime
    }
  }
}

/**
 * 批量解析多个内容块
 */
export const parseBatchContent = (contents: string[]): ContentParsingResult[] => {
  return contents.map(content => parseContent(content))
}

/**
 * 解析CSV内容
 */
export const parseCSVContent = (csvContent: string): ContentParsingResult => {
  const startTime = performance.now()
  
  try {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
    const names: string[] = []
    
    for (const line of lines) {
      // 简单的CSV解析（处理带引号的字段）
      const fields = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // 转义的引号
            current += '"'
            i++ // 跳过下一个引号
          } else {
            // 切换引号状态
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // 字段分隔符
          fields.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      // 添加最后一个字段
      fields.push(current.trim())
      
      // 取第一个字段作为名称
      if (fields.length > 0 && fields[0]) {
        const cleanedName = cleanName(fields[0])
        if (cleanedName) {
          names.push(cleanedName)
        }
      }
    }
    
    // 去重处理
    const { uniqueNames, duplicateCount } = deduplicateNames(names)
    
    // 转换为ListItem格式
    const items: ListItem[] = uniqueNames.map(name => ({
      id: generateId(),
      name
    }))
    
    const endTime = performance.now()
    const processingTime = Math.round(endTime - startTime)
    
    const suggestions = [
      'CSV格式解析完成，已提取第一列作为名称',
      `成功解析出 ${items.length} 个名称`
    ]
    
    if (duplicateCount > 0) {
      suggestions.push(`已自动去除 ${duplicateCount} 个重复名称`)
    }
    
    return {
      items,
      detectedFormat: ContentFormat.COMMA_SEPARATED,
      confidence: 0.9,
      suggestions,
      duplicatesRemoved: duplicateCount,
      processingTime
    }
  } catch (error) {
    console.error('CSV parsing failed:', error)
    
    return {
      items: [],
      detectedFormat: ContentFormat.COMMA_SEPARATED,
      confidence: 0,
      suggestions: ['CSV解析失败，请检查文件格式'],
      duplicatesRemoved: 0,
      processingTime: performance.now() - startTime
    }
  }
}

/**
 * 验证解析结果
 */
export const validateParsingResult = (result: ContentParsingResult): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} => {
  const warnings: string[] = []
  const errors: string[] = []
  
  // 检查是否有结果
  if (result.items.length === 0) {
    errors.push('未能解析出任何有效名称')
  }
  
  // 检查名称长度
  const longNames = result.items.filter(item => item.name.length > 50)
  if (longNames.length > 0) {
    warnings.push(`有 ${longNames.length} 个名称超过50个字符，可能影响显示效果`)
  }
  
  // 检查重复率
  if (result.duplicatesRemoved > result.items.length * 0.3) {
    warnings.push('重复名称较多，建议检查原始数据')
  }
  
  // 检查置信度
  if (result.confidence < 0.6) {
    warnings.push('格式识别置信度较低，建议手动确认解析结果')
  }
  
  // 检查处理时间
  if (result.processingTime > 1000) {
    warnings.push('处理时间较长，建议分批处理大量数据')
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}

/**
 * 获取格式建议
 */
export const getFormatSuggestions = (content: string): string[] => {
  const suggestions: string[] = []
  
  if (!content.trim()) {
    return ['请输入要解析的内容']
  }
  
  const lines = content.split('\n').filter(line => line.trim())
  
  // 建议优化格式
  if (lines.length === 1 && content.includes(',')) {
    suggestions.push('建议将逗号分隔的内容按行分隔，每行一个名称')
  }
  
  if (lines.some(line => /^\s*\d+/.test(line))) {
    suggestions.push('检测到序号，系统将自动去除序号并提取名称')
  }
  
  if (lines.some(line => line.includes('\t'))) {
    suggestions.push('检测到制表符，将提取第一列作为名称')
  }
  
  const avgLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length
  if (avgLength > 100) {
    suggestions.push('部分行内容较长，建议确认是否为单个名称')
  }
  
  return suggestions
}