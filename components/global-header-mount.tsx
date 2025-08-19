"use client"

import GlobalHeader from "./global-header"
import { usePathname } from "next/navigation"

// Helper: match by path segment ("/foo" matches "/foo" and "/foo/...", but not "/foo-bar")
const matchPath = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/")

// 开启全局 Header：去掉抽奖页面的沉浸式排除
const IMMERSIVE_ROUTES: string[] = []

const PAGES_WITH_OWN_HEADER = [
  "/", // Home has its own bespoke header
]

export default function GlobalHeaderMount() {
  const pathname = usePathname()

  const isImmersive = IMMERSIVE_ROUTES.some((r) => matchPath(pathname, r))

  // 沉浸式页面以及自带顶栏的页面：不挂载全局 Header
  if (isImmersive || PAGES_WITH_OWN_HEADER.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return null
  }

  // 其他页面：使用默认（纯白）Header。
  // 说明：GlobalHeader 使用 position: sticky，会在文档流中占位，因此不需要额外的占位元素。
  return <GlobalHeader variant="default" />
}

