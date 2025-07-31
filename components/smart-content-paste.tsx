"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ClipboardPaste, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Wand2,
  FileText,
  Hash,
  Minus,
  MoreHorizontal
} from 'lucide-react'
import { ListItem, ContentFormat } from '@/types'
import { smartParseText, generateParsingPreview, isLikelyNameList } from '@/lib/content-parser-utils'
import { useToast } from '@/hooks/use-toast'

interface SmartContentPasteProps {
  onContentParsed: (items: ListItem[]) => void
  onPreview?: (preview: string[]) => void
  className?: string
  placeholder?: string
  maxLength?: number
  showPreview?: boolean
}

export default function SmartContentPaste({
  onContentParsed,
  onPreview,
  className = '',
  placeholder,
  maxLength = 10000,
  showPreview = true
}: SmartContentPasteProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [content, setContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreviewPanel, setShowPreviewPanel] = useState(false)
  const [detectedFormat, setDetectedFormat] = useState<ContentFormat | null>(null)
  const [previewData, setPreviewData] = useState<{
    preview: string[]
    hasMore: boolean
    totalLines: number
  } | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // 实时分析内容
  useEffect(() => {
    if (!content.trim()) {
      setDetectedFormat(null)
      setPreviewData(null)
      setConfidence(0)
      setSuggestions([])
      return
    }

    const debounceTimer = setTimeout(() => {
      try {
        // 检查是否像名单
        const likelyCheck = isLikelyNameList(content)
        
        if (likelyCheck.isLikely) {
          // 生成预览
          const preview = generateParsingPreview(content, 5)
          setPreviewData(preview)
          onPreview?.(preview.preview)
          
          // 检测格式
          const parseResult = smartParseText(content)
          setDetectedFormat(parseResult.format)
          setConfidence(parseResult.confidence)
          setSuggestions(parseResult.suggestions)
        } else {
          setPreviewData(null)
          setDetectedFormat(null)
          setConfidence(0)
          setSuggestions([t('smartPaste.notNameListFormat')])
        }
      } catch (error) {
        console.error('Content analysis failed:', error)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [content, onPreview])

  // 处理内容变化
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    if (newContent.length <= maxLength) {
      setContent(newContent)
    }
  }, [maxLength])

  // 处理粘贴事件
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedContent = e.clipboardData.getData('text')
    
    if (pastedContent.length > maxLength) {
      e.preventDefault()
      toast({
        title: t('smartPaste.contentTooLong'),
        description: t('smartPaste.contentTooLongDesc', { maxLength }),
        variant: "destructive",
      })
      return
    }

    // 显示粘贴成功提示
    setTimeout(() => {
      toast({
        title: t('smartPaste.contentPasted'),
        description: t('smartPaste.contentPastedDesc'),
      })
    }, 100)
  }, [maxLength, toast])

  // 解析内容
  const handleParseContent = useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: t('smartPaste.pleaseInputContent'),
        description: t('smartPaste.pleaseInputContentDesc'),
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const result = smartParseText(content)
      
      if (result.items.length === 0) {
        toast({
          title: t('smartPaste.parseFailed'),
          description: t('smartPaste.parseFailedDesc'),
          variant: "destructive",
        })
        return
      }

      onContentParsed(result.items)
      
      toast({
        title: t('smartPaste.parseSuccess'),
        description: result.duplicatesRemoved > 0 
          ? t('smartPaste.parseSuccessWithDuplicates', { count: result.items.length, duplicates: result.duplicatesRemoved })
          : t('smartPaste.parseSuccessDesc', { count: result.items.length }),
      })

      // 清空内容
      setContent('')
      setShowPreviewPanel(false)
      
    } catch (error) {
      console.error('Content parsing failed:', error)
      toast({
        title: t('smartPaste.parseFailed'),
        description: t('smartPaste.parseError'),
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [content, onContentParsed, toast])

  // 清空内容
  const handleClear = useCallback(() => {
    setContent('')
    setShowPreviewPanel(false)
    textareaRef.current?.focus()
  }, [])

  // 格式化显示
  const getFormatIcon = (format: ContentFormat) => {
    switch (format) {
      case ContentFormat.NUMBERED_LIST:
        return <Hash className="w-4 h-4" />
      case ContentFormat.COMMA_SEPARATED:
        return <Minus className="w-4 h-4" />
      case ContentFormat.TAB_SEPARATED:
        return <MoreHorizontal className="w-4 h-4" />
      case ContentFormat.LINE_SEPARATED:
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getFormatName = (format: ContentFormat) => {
    switch (format) {
      case ContentFormat.NUMBERED_LIST:
        return t('smartPaste.formatNames.numberedList')
      case ContentFormat.COMMA_SEPARATED:
        return t('smartPaste.formatNames.commaSeparated')
      case ContentFormat.TAB_SEPARATED:
        return t('smartPaste.formatNames.tabSeparated')
      case ContentFormat.LINE_SEPARATED:
        return t('smartPaste.formatNames.lineSeparated')
      case ContentFormat.MIXED_FORMAT:
        return t('smartPaste.formatNames.mixedFormat')
      default:
        return t('smartPaste.formatNames.unknown')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主输入区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-purple-600" />
            {t('smartPaste.title')}
          </CardTitle>
          <CardDescription>
            {t('smartPaste.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 文本输入区域 */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onPaste={handlePaste}
              placeholder={placeholder || t('smartPaste.placeholder')}
              rows={8}
              className="resize-none font-mono text-sm"
              disabled={isProcessing}
            />
            
            {/* 字符计数 */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {t('smartPaste.characterCount', { current: content.length, max: maxLength })}
            </div>
          </div>

          {/* 格式检测结果 */}
          {detectedFormat && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getFormatIcon(detectedFormat)}
                <span className="text-sm font-medium">
                  {t('smartPaste.detectedFormat', { format: getFormatName(detectedFormat) })}
                </span>
              </div>
              
              <Badge 
                variant="secondary" 
                className={`text-xs ${getConfidenceColor(confidence)}`}
              >
                {t('smartPaste.confidence', { percent: Math.round(confidence * 100) })}
              </Badge>
              
              {showPreview && previewData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                  className="ml-auto"
                >
                  {showPreviewPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreviewPanel ? t('smartPaste.hide') : t('smartPaste.preview')}
                </Button>
              )}
            </div>
          )}

          {/* 建议提示 */}
          {suggestions.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleParseContent}
              disabled={!content.trim() || isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('smartPaste.parsing')}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {t('smartPaste.smartParse')}
                </>
              )}
            </Button>
            
            {content.trim() && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isProcessing}
              >
                {t('smartPaste.clear')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 预览面板 */}
      {showPreviewPanel && previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('smartPaste.parsePreview')}</CardTitle>
            <CardDescription>
              {t('smartPaste.willParseItems', { count: previewData.totalLines })}
              {previewData.hasMore && t('smartPaste.showingFirst', { count: previewData.preview.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previewData.preview.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <Badge variant="outline" className="w-8 h-6 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-gray-800">{name}</span>
                </div>
              ))}
              
              {previewData.hasMore && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  {t('smartPaste.moreItems', { count: previewData.totalLines - previewData.preview.length })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用提示 */}
      {!content.trim() && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <ClipboardPaste className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">{t('smartPaste.supportedFormats')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-700">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    <span>{t('smartPaste.formatExamples.numbered')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    <span>{t('smartPaste.formatExamples.lineSeparated')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="w-3 h-3" />
                    <span>{t('smartPaste.formatExamples.commaSeparated')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MoreHorizontal className="w-3 h-3" />
                    <span>{t('smartPaste.formatExamples.tabSeparated')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}