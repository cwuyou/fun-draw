"use client"

import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"
import { Dices } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHeader } from "@/contexts/header-context"
import { usePathname } from "next/navigation"

interface GlobalHeaderProps {
  className?: string
  variant?: "default" | "solid" | "minimal"
}

export default function GlobalHeader({ className, variant = "default" }: GlobalHeaderProps) {
  const { t } = useTranslation()
  const { config } = useHeader()
  const pathname = usePathname()

  const effectiveVariant = config.variant ?? variant

  // Match homepage visual style by default: translucent white with blur and bottom border
  // Header 视觉：默认半透明白 + 毛玻璃，带底边；minimal 透明；solid 纯白
  const variantClass =
    effectiveVariant === "solid"
      ? "bg-white border-b"
      : effectiveVariant === "minimal"
      ? "bg-transparent"
      : "border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"

  // 尺寸：default 与首页一致（使用 py-4 提供更高的视觉高度）；minimal 更紧凑
  const containerClass =
    effectiveVariant === "minimal"
      ? "mx-auto max-w-screen-xl px-4 h-10 flex items-center justify-between"
      : "container mx-auto px-4 py-4 flex items-center justify-between"

  const isOnCreateList = pathname === "/create-list" || pathname.startsWith("/create-list/")
  const isOnListLibrary = pathname === "/list-library" || pathname.startsWith("/list-library/")

  return (
    <header className={cn("sticky top-0 z-[60]", variantClass, className)}>
      <div className={cn(containerClass)}>
        {/* Left: logo + dynamic title/breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Dices className="w-5 h-5 text-white" />
            </span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:opacity-80">
              {t('home.title').includes('趣') ? '趣抽' : 'Fun Draw'}
            </span>
          </Link>
          {effectiveVariant !== "minimal" && (
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              {config.breadcrumbs && <div className="truncate text-sm text-gray-500">{config.breadcrumbs}</div>}
              {config.title && <div className="truncate font-medium text-gray-800">{config.title}</div>}
            </div>
          )}
        </div>

        {/* Right: global nav + dynamic actions */}
        {effectiveVariant !== "minimal" && (
          <nav className="hidden sm:flex items-center gap-3 text-sm">
            {/* 在 list-library 页面，隐藏全局“创建名单”链接，避免和 PageHeader 的“新建名单”重复 */}
            {!(isOnListLibrary || isOnCreateList) && (
              <Link href="/create-list" className="text-gray-600 hover:text-purple-600">{t('navigation.createList')}</Link>
            )}
            {/* 在 list-library 页面本身隐藏“名单库”入口；在创建名单页也隐藏“名单库”以减少干扰 */}
            {!(isOnListLibrary || isOnCreateList) && (
              <Link href="/list-library" className="text-gray-600 hover:text-purple-600">{t('navigation.listLibrary')}</Link>
            )}
            {/* 与“名单库”同级、紧挨的右侧主导航插槽 */}
            {config.rightNav}
            {/* 其后才是页面级 actions（徽章、按钮等） */}
            {config.actions && <div className="ml-2 flex items-center gap-2">{config.actions}</div>}
          </nav>
        )}
      </div>
    </header>
  )
}

