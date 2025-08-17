"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  File, 
  Camera, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Download,
  Smartphone,
  Monitor
} from 'lucide-react'
import { ListItem, FileProcessingState, DragDropState } from '@/types'
import { parseFileContent } from '@/lib/content-parser-utils'
import { useToast } from '@/hooks/use-toast'

interface EnhancedFileUploadProps {
  onFileProcessed: (items: ListItem[]) => void
  onProgress?: (progress: number) => void
  onError?: (error: string) => void
  className?: string
  maxFileSize?: number // MB
  acceptedFormats?: string[]
  showPreview?: boolean
}

export default function EnhancedFileUpload({
  onFileProcessed,
  onProgress,
  onError,
  className = '',
  maxFileSize = 5,
  acceptedFormats = ['.txt', '.csv'],
  showPreview = true
}: EnhancedFileUploadProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    dragCounter: 0,
    isProcessing: false,
    progress: 0
  })
  
  const [processingState, setProcessingState] = useState<FileProcessingState>({
    status: 'idle',
    progress: 0
  })
  
  const [isMobile, setIsMobile] = useState(false)
  const [lastProcessedFile, setLastProcessedFile] = useState<{
    name: string
    size: number
    itemCount: number
  } | null>(null)

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 处理文件
  const processFile = useCallback(async (file: File) => {
    setProcessingState({
      status: 'processing',
      progress: 0,
      startTime: Date.now()
    })
    
    setDragState(prev => ({ ...prev, isProcessing: true, progress: 0 }))

    try {
      // 验证文件
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(t('fileUpload.fileSizeExceeded', { maxSize: maxFileSize }))
      }

      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFormats.includes(fileExtension)) {
        throw new Error(t('fileUpload.unsupportedFormat', { formats: acceptedFormats.join(', ') }))
      }

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProcessingState(prev => {
          const newProgress = Math.min(prev.progress + 10, 90)
          setDragState(current => ({ ...current, progress: newProgress }))
          onProgress?.(newProgress)
          return { ...prev, progress: newProgress }
        })
      }, 100)

      // 解析文件
      const result = await parseFileContent(file)
      
      clearInterval(progressInterval)
      
      // 完成处理
      setProcessingState({
        status: 'completed',
        progress: 100,
        result: {
          items: result.items,
          duplicateCount: result.duplicatesRemoved,
          formatDetected: result.format,
          processingTime: result.processingTime,
          fileSize: file.size,
          fileName: file.name
        },
        endTime: Date.now()
      })
      
      setDragState(prev => ({ ...prev, isProcessing: false, progress: 100 }))
      setLastProcessedFile({
        name: file.name,
        size: file.size,
        itemCount: result.items.length
      })
      
      onProgress?.(100)
      onFileProcessed(result.items)
      
      toast({
        title: t('fileUpload.fileProcessSuccess'),
        description: t('fileUpload.fileProcessSuccessDesc', { fileName: file.name, count: result.items.length }),
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('fileUpload.fileProcessFailed')
      
      setProcessingState({
        status: 'error',
        progress: 0,
        error: errorMessage
      })
      
      setDragState(prev => ({ ...prev, isProcessing: false, progress: 0 }))
      
      onError?.(errorMessage)
      toast({
        title: t('fileUpload.fileProcessFailed'),
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [maxFileSize, acceptedFormats, onFileProcessed, onProgress, onError, toast])

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragState(prev => ({
      ...prev,
      dragCounter: prev.dragCounter + 1,
      isDragging: true
    }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragState(prev => {
      const newCounter = prev.dragCounter - 1
      return {
        ...prev,
        dragCounter: newCounter,
        isDragging: newCounter > 0
      }
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragState({
      isDragging: false,
      dragCounter: 0,
      isProcessing: false,
      progress: 0
    })

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  // 文件选择处理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [processFile])

  // 点击上传
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 移动端相机拍照
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*'
      fileInputRef.current.capture = 'environment'
      fileInputRef.current.click()
    }
  }, [])

  // 重置状态
  const resetState = useCallback(() => {
    setProcessingState({ status: 'idle', progress: 0 })
    setDragState({
      isDragging: false,
      dragCounter: 0,
      isProcessing: false,
      progress: 0
    })
    setLastProcessedFile(null)
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主上传区域 */}
      <Card
        ref={dropZoneRef}
        className={`transition-all duration-300 ${
          dragState.isDragging
            ? 'border-purple-500 border-2 bg-purple-50 scale-105'
            : 'border-dashed border-2 border-gray-300 hover:border-purple-400'
        } ${dragState.isProcessing ? 'pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!dragState.isProcessing ? handleUploadClick : undefined}
      >
        <CardContent className="p-8 text-center">
          {dragState.isProcessing ? (
            // 处理中状态
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('fileUpload.processing')}</h3>
                <Progress value={dragState.progress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-gray-500 mt-2">{dragState.progress}% {t('common.loading')}</p>
              </div>
            </div>
          ) : dragState.isDragging ? (
            // 拖拽中状态
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-800">{t('fileUpload.releaseToUpload')}</h3>
                <p className="text-purple-600">{t('fileUpload.supportedFormats', { formats: acceptedFormats.join(', '), maxSize: maxFileSize })}</p>
              </div>
            </div>
          ) : (
            // 默认状态
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-100 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {isMobile ? t('fileUpload.clickToSelect') : t('fileUpload.dragToUpload')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('fileUpload.supportedFormats', { formats: acceptedFormats.join(', '), maxSize: maxFileSize })}
                </p>
                
                {/* 移动端特殊选项 */}
                {isMobile && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUploadClick()
                      }}
                      className="flex items-center gap-2"
                    >
                      <File className="w-4 h-4" />
                      {t('fileUpload.selectFile')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCameraCapture()
                      }}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {t('fileUpload.takePhoto')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 处理状态显示 */}
      {processingState.status !== 'idle' && (
        <Card>
          <CardContent className="p-4">
            {processingState.status === 'processing' && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{t('fileUpload.processingFile')}</p>
                  <Progress value={processingState.progress} className="mt-2" />
                </div>
              </div>
            )}

            {processingState.status === 'completed' && processingState.result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{t('fileUpload.completed')}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('fileUpload.fileName')}</span>
                    <span className="font-medium">{processingState.result.fileName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('fileUpload.fileSize')}</span>
                    <span className="font-medium">{formatFileSize(processingState.result.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('fileUpload.parsedItems')}</span>
                    <span className="font-medium text-green-600">{t('fileUpload.itemsCount', { count: processingState.result.items.length })}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('fileUpload.processingTime', { time: `${processingState.result.processingTime}ms` })}</span>
                  </div>
                </div>

                {processingState.result.duplicateCount > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('fileUpload.duplicatesRemoved', { count: processingState.result.duplicateCount })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetState}
                  >
                    {t('fileUpload.reupload')}
                  </Button>
                </div>
              </div>
            )}

            {processingState.status === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <X className="w-5 h-5" />
                  <span className="font-medium">{t('fileUpload.failed')}</span>
                </div>
                
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {processingState.error}
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                >
                  {t('fileUpload.retry')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用提示 */}
      {processingState.status === 'idle' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {isMobile ? <Smartphone className="w-3 h-3 text-blue-600" /> : <Monitor className="w-3 h-3 text-blue-600" />}
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  {isMobile ? t('fileUpload.mobileUploadTip') : t('fileUpload.desktopUploadTip')}
                </p>
                <ul className="space-y-1 text-blue-700">
                  {isMobile ? (
                    <>
                      <li>• {t('fileUpload.mobileInstructions.selectFromGallery')}</li>
                      <li>• {t('fileUpload.mobileInstructions.takePhotoToRecognize')}</li>
                      <li>• {t('fileUpload.mobileInstructions.shareFromOtherApps')}</li>
                    </>
                  ) : (
                    <>
                      <li>• {t('fileUpload.desktopInstructions.dragAndDrop')}</li>
                      <li>• {t('fileUpload.desktopInstructions.supportedFormats')}</li>
                      <li>• {t('fileUpload.desktopInstructions.smartParsing')}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}