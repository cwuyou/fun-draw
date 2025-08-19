"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"
import QuickExperience from "@/components/quick-experience"
import { getCurrentExperienceSession } from "@/lib/experience-manager"

export default function DrawIndexPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [decided, setDecided] = useState(false)

  useEffect(() => {
    try {
      // 1) 若存在体验会话，直接进入对应模式
      const session = getCurrentExperienceSession()
      if (session && session.config?.mode) {
        router.replace(`/draw/${session.config.mode}`)
        return
      }

      // 2) 若已有有效配置或名单，进入配置页
      const rawConfig = localStorage.getItem("draw-config")
      const rawTemp = localStorage.getItem("temp-draw-list")
      const rawSelected = localStorage.getItem("selected-draw-list")
      const hasValidConfig = (() => {
        try {
          if (!rawConfig) return false
          const cfg = JSON.parse(rawConfig)
          return Array.isArray(cfg?.items) && cfg.items.length > 0
        } catch { return false }
      })()
      const hasList = (() => {
        try {
          const parse = (s: string | null) => s ? JSON.parse(s) : null
          const temp = parse(rawTemp)
          const sel = parse(rawSelected)
          const ok = (v: any) => v && Array.isArray(v.items) && v.items.length > 0
          return ok(temp) || ok(sel)
        } catch { return false }
      })()
      if (hasValidConfig || hasList) {
        router.replace("/draw-config")
        return
      }

      // 3) 否则停留在本页，展示快速体验入口
      setDecided(true)
    } catch {
      setDecided(true)
    }
  }, [router])

  if (!decided) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{t('home.quickExperience')}</h1>
          <p className="text-gray-600">{t('home.experienceDescription')}</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <QuickExperience variant="card" />
        </div>
      </div>
    </div>
  )
}

