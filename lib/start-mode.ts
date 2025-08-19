import { DrawingConfig, DrawingMode, ListItem } from '@/types'
import { getMaxQuantityForMode, validateModeConfig } from '@/lib/mode-config'
import { clearCurrentExperienceSession, createExperienceSession } from '@/lib/experience-manager'
import { createExperienceTemplates } from '@/lib/experience-templates'

// 本地翻译函数类型（与其他文件一致）
type TranslationFunction = (key: string, params?: Record<string, any>) => string

// 读取当前名单（temp 或 selected）
function loadCurrentList(): { name: string; items: ListItem[] } | null {
  try {
    const parse = (raw: string | null) => (raw ? JSON.parse(raw) : null)
    const temp = parse(localStorage.getItem('temp-draw-list'))
    const selected = parse(localStorage.getItem('selected-draw-list'))
    const ok = (v: any) => v && Array.isArray(v.items) && v.items.length > 0
    if (ok(selected)) return { name: selected.name || 'List', items: selected.items }
    if (ok(temp)) return { name: temp.name || 'List', items: temp.items }
  } catch (e) {
    console.error('Failed to load current list', e)
  }
  return null
}

// 基于模式与名单规模生成推荐默认配置
function buildDefaultConfig(mode: DrawingMode, items: ListItem[]): DrawingConfig {
  // 默认不允许重复
  const allowRepeat = false
  const max = getMaxQuantityForMode(mode, allowRepeat, items.length)

  // 推荐初始量：各模式设定一个合理的基准，然后 clamp 到范围内
  const base: Record<DrawingMode, number> = {
    'grid-lottery': 1,
    'card-flip': 3,
    'slot-machine': 3,
    'bullet-screen': 5,
    'blinking-name-picker': 1,
  }
  const baseQ = base[mode] ?? 1
  const quantity = Math.max(1, Math.min(max, Math.min(baseQ, items.length)))

  return { mode, quantity, allowRepeat, items }
}

export function prepareModeConfig(mode: DrawingMode): { config: DrawingConfig | null; listName?: string; warnings?: string[] } {
  const list = loadCurrentList()
  if (!list) return { config: null }

  const config = buildDefaultConfig(mode, list.items)
  const result = validateModeConfig(config)

  // 应用校正
  if (!result.isValid && result.correctedConfig) {
    Object.assign(config, result.correctedConfig)
  }

  try {
    // 清除体验会话，避免会话劫持
    clearCurrentExperienceSession()
  } catch {}

  // 保存配置
  localStorage.setItem('draw-config', JSON.stringify(config))

  return { config, listName: list.name, warnings: result.warnings }
}

// 为指定模式准备“示例数据”默认配置（无名单时使用）
export function prepareDemoModeConfigForMode(mode: DrawingMode, t: TranslationFunction): { config: DrawingConfig | null; templateName?: string } {
  try {
    const templates = createExperienceTemplates(t)
    const template = templates.find(tmp => tmp.suggestedMode === mode) || templates[0]
    if (!template) return { config: null }

    const allowRepeat = template.suggestedConfig.allowRepeat ?? false
    const items = template.items
    const max = getMaxQuantityForMode(mode, allowRepeat, items.length, t)
    const desired = template.suggestedConfig.quantity ?? 1
    const quantity = Math.max(1, Math.min(max, Math.min(desired, items.length)))

    const config: DrawingConfig = { mode, quantity, allowRepeat, items }

    // 写入体验会话，以保证各模式页面识别为“体验模式”，从而返回按钮指向首页
    try { createExperienceSession(template.id, t as any) } catch {}

    // 覆盖名单，确保示例体验
    try {
      localStorage.removeItem('temp-draw-list')
      localStorage.removeItem('selected-draw-list')
    } catch {}

    localStorage.setItem('draw-config', JSON.stringify(config))
    return { config, templateName: template.name }
  } catch (e) {
    console.error('Failed to prepare demo config for mode', mode, e)
    return { config: null }
  }
}

