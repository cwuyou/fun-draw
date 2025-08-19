"use client"

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

export type HeaderVariant = "default" | "minimal"

export interface HeaderConfig {
  title?: React.ReactNode
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  rightNav?: React.ReactNode // 右侧主导航（与全局“名单库”同级）
  variant?: HeaderVariant
}

interface HeaderContextValue {
  config: HeaderConfig
  setHeader: (cfg: HeaderConfig) => void
  clearHeader: () => void
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({})

  const setHeader = useCallback((cfg: HeaderConfig) => {
    setConfig(prev => ({ ...prev, ...cfg }))
  }, [])

  const clearHeader = useCallback(() => setConfig({}), [])

  const value = useMemo(() => ({ config, setHeader, clearHeader }), [config, setHeader, clearHeader])

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}

export function useHeader() {
  const ctx = useContext(HeaderContext)
  if (!ctx) throw new Error("useHeader must be used within HeaderProvider")
  return ctx
}

// Helper component for pages to declaratively set header content.
export function PageHeader(props: HeaderConfig) {
  const { setHeader, clearHeader } = useHeader()

  React.useEffect(() => {
    setHeader(props)
    return () => clearHeader()
  }, [props.title, props.breadcrumbs, props.actions, props.rightNav, props.variant, setHeader, clearHeader])

  return null
}

