export interface CardStyle {
  id: string
  name: string
  backDesign: string        // CSS类名或背景图片
  frontTemplate: string     // 正面模板样式
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

export const CARD_STYLES: CardStyle[] = [
  {
    id: 'classic',
    name: '经典蓝',
    backDesign: 'bg-gradient-to-br from-blue-600 to-blue-800',
    frontTemplate: 'bg-white border-2 border-blue-300',
    colors: { 
      primary: '#2563eb', 
      secondary: '#1d4ed8', 
      accent: '#3b82f6' 
    }
  },
  {
    id: 'elegant',
    name: '优雅紫',
    backDesign: 'bg-gradient-to-br from-purple-600 to-purple-800',
    frontTemplate: 'bg-white border-2 border-purple-300',
    colors: { 
      primary: '#7c3aed', 
      secondary: '#6d28d9', 
      accent: '#8b5cf6' 
    }
  },
  {
    id: 'royal',
    name: '皇家金',
    backDesign: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
    frontTemplate: 'bg-white border-2 border-yellow-300',
    colors: { 
      primary: '#eab308', 
      secondary: '#ca8a04', 
      accent: '#facc15' 
    }
  }
]

export const getCardStyleById = (id: string): CardStyle => {
  const style = CARD_STYLES.find(style => style.id === id)
  if (!style) {
    return CARD_STYLES[0] // 默认返回第一个样式
  }
  return style
}

export const getDefaultCardStyle = (): CardStyle => {
  return CARD_STYLES[0]
}