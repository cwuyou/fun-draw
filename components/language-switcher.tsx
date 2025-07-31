"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Check, Globe, ChevronDown } from 'lucide-react'
import { useTranslation, useLanguageSwitch } from '@/hooks/use-translation'
import { LanguageSwitcherProps, LanguageCode, SUPPORTED_LANGUAGES } from '@/types'
import { cn } from '@/lib/utils'

/**
 * 语言切换器组件
 * 
 * 提供用户界面来切换应用程序的语言设置
 * 支持中文和英文之间的切换，具有响应式设计
 */
export default function LanguageSwitcher({
  className = '',
  variant = 'default',
  showLabel = false
}: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { 
    currentLanguage, 
    switchToZh, 
    switchToEn, 
    isLoading,
    error 
  } = useLanguageSwitch()
  
  const [isOpen, setIsOpen] = useState(false)

  // 获取当前语言配置
  const currentLangConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage)
  
  // 语言选项处理函数
  const handleLanguageSelect = (languageCode: LanguageCode) => {
    if (languageCode === currentLanguage) return
    
    if (languageCode === 'zh') {
      switchToZh()
    } else if (languageCode === 'en') {
      switchToEn()
    }
    
    setIsOpen(false)
  }

  // 获取语言显示标识
  const getLanguageLabel = (langCode: LanguageCode): string => {
    return langCode === 'zh' ? '中' : 'EN'
  }

  // 紧凑模式渲染
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-md hover:bg-gray-100 transition-colors",
              "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
              isLoading && "opacity-50 cursor-not-allowed",
              className
            )}
            disabled={isLoading}
            aria-label={t('common.switchLanguage') || 'Switch Language'}
          >
            <span className="text-sm font-medium text-gray-700">
              {getLanguageLabel(currentLanguage)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-40 p-1"
          sideOffset={4}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer",
                "hover:bg-gray-50 rounded-sm transition-colors",
                currentLanguage === language.code && "bg-purple-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm font-medium">
                  {language.nativeName}
                </span>
              </div>
              {currentLanguage === language.code && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 默认模式渲染
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 h-9 px-3 border-gray-200",
            "hover:bg-gray-50 hover:border-gray-300 transition-all",
            "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
            isLoading && "opacity-50 cursor-not-allowed",
            error && "border-red-300 text-red-600",
            className
          )}
          disabled={isLoading}
          aria-label={t('common.switchLanguage') || 'Switch Language'}
        >
          {/* 图标 */}
          <Globe className="w-4 h-4 text-gray-500" />
          
          {/* 当前语言标识 */}
          <span className="text-sm font-medium text-gray-700">
            {getLanguageLabel(currentLanguage)}
          </span>
          
          {/* 语言名称（可选） */}
          {showLabel && currentLangConfig && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              {currentLangConfig.nativeName}
            </span>
          )}
          
          {/* 下拉箭头 */}
          <ChevronDown className={cn(
            "w-3 h-3 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
          
          {/* 加载状态指示 */}
          {isLoading && (
            <div className="w-3 h-3 border border-gray-300 border-t-purple-600 rounded-full animate-spin" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 p-1"
        sideOffset={4}
      >
        {/* 错误状态显示 */}
        {error && (
          <div className="px-3 py-2 text-xs text-red-600 bg-red-50 rounded-sm mb-1">
            {t('errors.languageLoadError') || 'Language load error'}
          </div>
        )}
        
        {/* 语言选项列表 */}
        {SUPPORTED_LANGUAGES.map((language) => {
          const isActive = currentLanguage === language.code
          
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer",
                "hover:bg-gray-50 rounded-sm transition-colors",
                "focus:bg-gray-50 focus:outline-none",
                isActive && "bg-purple-50 hover:bg-purple-100"
              )}
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                {/* 国旗图标 */}
                <span className="text-lg" role="img" aria-label={language.name}>
                  {language.flag}
                </span>
                
                {/* 语言信息 */}
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-purple-700" : "text-gray-700"
                  )}>
                    {language.nativeName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {language.name}
                  </span>
                </div>
              </div>
              
              {/* 选中状态指示 */}
              <div className="flex items-center gap-2">
                {isActive && (
                  <>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5"
                    >
                      {t('common.current') || 'Current'}
                    </Badge>
                    <Check className="w-4 h-4 text-purple-600" />
                  </>
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
        
        {/* 分隔线和帮助信息 */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <div className="px-3 py-2 text-xs text-gray-500">
            {t('common.languageHelp') || 'Language preference is saved automatically'}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 简化的语言切换按钮
 * 只显示当前语言标识，点击直接切换
 */
export function SimpleLanguageSwitcher({ 
  className = '' 
}: { 
  className?: string 
}) {
  const { toggleLanguage, currentLanguage, isLoading } = useLanguageSwitch()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      disabled={isLoading}
      className={cn(
        "h-8 w-8 p-0 rounded-md hover:bg-gray-100 transition-colors",
        "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label="Toggle Language"
    >
      <span className="text-sm font-medium text-gray-700">
        {currentLanguage === 'zh' ? '中' : 'EN'}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border border-gray-300 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}
    </Button>
  )
}

/**
 * 移动端优化的语言切换器
 * 针对移动设备的触摸交互优化
 */
export function MobileLanguageSwitcher({ 
  className = '' 
}: { 
  className?: string 
}) {
  const { t } = useTranslation()
  const { currentLanguage, switchToZh, switchToEn, isLoading } = useLanguageSwitch()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    if (languageCode === currentLanguage) return
    
    if (languageCode === 'zh') {
      switchToZh()
    } else if (languageCode === 'en') {
      switchToEn()
    }
    
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "flex items-center gap-3 h-12 px-4 w-full justify-between",
            "border-gray-200 hover:bg-gray-50 transition-colors",
            "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
            isLoading && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
            <span className="text-base font-medium text-gray-700">
              {t('common.language') || 'Language'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {currentLanguage === 'zh' ? '中文' : 'English'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-full min-w-[200px] p-2"
        sideOffset={8}
      >
        {SUPPORTED_LANGUAGES.map((language) => {
          const isActive = currentLanguage === language.code
          
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md",
                "hover:bg-gray-50 transition-colors min-h-[48px]",
                isActive && "bg-purple-50 hover:bg-purple-100"
              )}
              disabled={isLoading}
            >
              <span className="text-xl" role="img" aria-label={language.name}>
                {language.flag}
              </span>
              
              <div className="flex-1">
                <div className={cn(
                  "text-base font-medium",
                  isActive ? "text-purple-700" : "text-gray-700"
                )}>
                  {language.nativeName}
                </div>
                <div className="text-sm text-gray-500">
                  {language.name}
                </div>
              </div>
              
              {isActive && (
                <Check className="w-5 h-5 text-purple-600" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}