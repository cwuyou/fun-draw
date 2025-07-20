# 设计文档

## 概述

卡牌抽取式抽奖模式是一个基于Web的交互式抽奖功能，模拟真实纸牌游戏的完整体验。该功能将集成到现有的趣抽应用中，遵循现有的架构模式和设计规范。用户通过洗牌、发牌、翻牌的完整流程进行抽奖，配合逼真的CSS 3D动画和Web Audio API生成的音效，提供沉浸式的抽奖体验。

## 架构

### 整体架构
卡牌抽取式抽奖模式将遵循现有应用的架构模式：
- **页面层**: `/app/draw/card-flip/page.tsx` - 主抽奖页面
- **组件层**: `/components/card-flip-game.tsx` - 核心卡牌游戏组件
- **工具层**: 扩展现有的 `lib/sound-manager.ts` 和 `lib/draw-utils.ts`
- **类型层**: 扩展现有的 `types/index.ts`

### 技术栈
- **前端框架**: Next.js 14 (App Router)
- **UI组件**: Tailwind CSS + shadcn/ui
- **动画**: CSS 3D Transforms + Framer Motion
- **音效**: Web Audio API (扩展现有SoundManager)
- **状态管理**: React useState/useEffect
- **类型系统**: TypeScript

## 组件和接口

### 核心组件结构

#### 1. CardFlipGame 组件
```typescript
interface CardFlipGameProps {
  items: ListItem[]
  quantity: number
  allowRepeat: boolean
  onComplete: (winners: ListItem[]) => void
  soundEnabled: boolean
}

interface CardFlipGameState {
  gamePhase: 'idle' | 'shuffling' | 'dealing' | 'waiting' | 'revealing' | 'finished'
  cards: GameCard[]
  revealedCards: Set<string>
  winners: ListItem[]
}
```

#### 2. PlayingCard 组件
```typescript
interface PlayingCardProps {
  card: GameCard
  isRevealed: boolean
  onFlip: (cardId: string) => void
  style: CardStyle
  disabled: boolean
}

interface GameCard {
  id: string
  content: ListItem | null
  position: { x: number; y: number; rotation: number }
  isWinner: boolean
}
```

#### 3. CardDeck 组件
```typescript
interface CardDeckProps {
  totalCards: number
  isShuffling: boolean
  onShuffleComplete: () => void
}
```

### 音效接口扩展
```typescript
// 扩展现有的 SoundManager
interface CardSoundEffects {
  shuffle: HTMLAudioElement    // 洗牌音效
  deal: HTMLAudioElement       // 发牌音效
  flip: HTMLAudioElement       // 翻牌音效
  reveal: HTMLAudioElement     // 揭晓音效
}
```

### 动画状态接口
```typescript
interface AnimationState {
  shuffleProgress: number
  dealingProgress: number
  currentDealingCard: number
  isAnimating: boolean
}
```

## 数据模型

### 卡牌样式配置
```typescript
interface CardStyle {
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

const CARD_STYLES: CardStyle[] = [
  {
    id: 'classic',
    name: '经典蓝',
    backDesign: 'bg-gradient-to-br from-blue-600 to-blue-800',
    frontTemplate: 'bg-white border-2 border-blue-300',
    colors: { primary: '#2563eb', secondary: '#1d4ed8', accent: '#3b82f6' }
  },
  {
    id: 'elegant',
    name: '优雅紫',
    backDesign: 'bg-gradient-to-br from-purple-600 to-purple-800',
    frontTemplate: 'bg-white border-2 border-purple-300',
    colors: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6' }
  },
  {
    id: 'royal',
    name: '皇家金',
    backDesign: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
    frontTemplate: 'bg-white border-2 border-yellow-300',
    colors: { primary: '#eab308', secondary: '#ca8a04', accent: '#facc15' }
  }
]
```

### 游戏配置
```typescript
interface CardGameConfig {
  minCards: number          // 最少发牌数量 (3)
  maxCards: number          // 最多发牌数量 (10)
  shuffleDuration: number   // 洗牌动画时长 (2500ms)
  dealInterval: number      // 发牌间隔 (300ms)
  flipDuration: number      // 翻牌动画时长 (600ms)
  cardStyle: CardStyle      // 选中的卡牌样式
}
```

## 错误处理

### 错误类型定义
```typescript
enum CardGameError {
  INSUFFICIENT_ITEMS = 'INSUFFICIENT_ITEMS',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  ANIMATION_FAILED = 'ANIMATION_FAILED',
  AUDIO_FAILED = 'AUDIO_FAILED'
}

interface CardGameErrorHandler {
  handleError: (error: CardGameError, context?: any) => void
  showErrorToast: (message: string) => void
  recoverFromError: () => void
}
```

### 错误处理策略
1. **项目数量不足**: 显示友好提示，建议用户添加更多项目
2. **动画失败**: 降级到简单动画或静态显示
3. **音效失败**: 静默运行，不影响核心功能
4. **网络问题**: 本地存储确保离线可用

## 测试策略

### 单元测试
- **组件渲染测试**: 验证各组件正确渲染
- **状态管理测试**: 验证游戏状态转换逻辑
- **动画逻辑测试**: 验证动画触发和完成逻辑
- **音效管理测试**: 验证音效播放和控制

### 集成测试
- **完整游戏流程测试**: 从洗牌到揭晓的完整流程
- **响应式布局测试**: 不同屏幕尺寸的适配
- **交互测试**: 触摸和鼠标操作的兼容性
- **性能测试**: 动画流畅度和内存使用

### 用户体验测试
- **可访问性测试**: 键盘导航和屏幕阅读器支持
- **跨浏览器测试**: 主流浏览器兼容性
- **移动设备测试**: 触摸操作和性能表现
- **音效测试**: 不同设备的音效播放效果

## 动画设计详细说明

### 洗牌动画
- **持续时间**: 2.5秒
- **效果**: 卡牌堆叠状态下的随机位移和旋转
- **实现**: CSS transform + JavaScript随机数生成
- **音效**: 纸牌摩擦声，循环播放

### 发牌动画
- **持续时间**: 每张牌300ms间隔
- **效果**: 卡牌从牌堆滑出到指定位置
- **布局**: 响应式扇形或网格布局
- **音效**: 纸牌滑动声，每张牌触发一次

### 翻牌动画
- **持续时间**: 600ms
- **效果**: 3D翻转效果，Y轴旋转180度
- **交互**: 点击/触摸触发
- **音效**: 纸牌翻转声 + 揭晓音效

### 响应式布局策略
- **桌面端**: 横向排列，最多5张一行
- **平板端**: 2-3张一行，适中间距
- **手机端**: 2张一行，紧凑布局
- **最小触摸区域**: 44px × 44px (iOS HIG标准)

## 性能优化

### 动画性能
- 使用 `transform` 和 `opacity` 属性避免重排重绘
- 启用硬件加速 (`will-change: transform`)
- 合理使用 `requestAnimationFrame`
- 动画完成后清理事件监听器

### 内存管理
- 及时清理定时器和事件监听器
- 音频对象复用，避免重复创建
- 图片资源懒加载和预加载策略

### 用户体验优化
- 动画可中断设计，避免长时间等待
- 提供跳过动画选项
- 渐进式加载，核心功能优先
- 离线缓存策略，确保基本功能可用