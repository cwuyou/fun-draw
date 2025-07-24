# 多宫格抽奖实现文档

## 功能概述

多宫格抽奖是一种类似电视抽奖节目的互动抽奖方式，具有以下特点：

1. **多宫格布局**：支持6、9、12、15个格子的配置
2. **灯光跳转动画**：格子高亮不断跳转，营造紧张感
3. **倒计时开始**：3秒倒计时增加仪式感
4. **音效配合**：倒计时音、跳转音、中奖音
5. **最终定格**：灯光定格在获奖者格子上

## 技术实现

### 1. 类型定义

```typescript
// 多宫格抽奖配置
export interface GridLotteryConfig {
  gridSize: 6 | 9 | 12 | 15  // 支持的宫格数量
  animationDuration: number  // 动画持续时间
  highlightSpeed: number     // 高亮跳转速度
  countdownDuration: number  // 倒计时时长
  soundEnabled: boolean      // 音效开关
}

// 格子状态
export interface GridCell {
  id: string
  index: number
  item: ListItem
  isHighlighted: boolean
  isWinner: boolean
  position: { row: number; col: number }
}

// 游戏阶段
export type GridLotteryPhase = 'idle' | 'countdown' | 'spinning' | 'slowing' | 'finished'
```

### 2. 宫格布局算法

```typescript
const determineGridSize = (quantity: number): number => {
  if (quantity <= 6) return 6   // 2x3 布局
  if (quantity <= 9) return 9   // 3x3 布局
  if (quantity <= 12) return 12 // 3x4 布局
  return 15                     // 3x5 布局
}

const getGridColumns = (gridSize: number): number => {
  switch (gridSize) {
    case 6: return 3   // 2x3
    case 9: return 3   // 3x3
    case 12: return 4  // 3x4
    case 15: return 5  // 3x5
    default: return 3
  }
}
```

### 3. 动画流程

#### 阶段1：倒计时 (3秒)
- 显示3、2、1倒计时
- 播放倒计时音效
- 增加仪式感和紧张感

#### 阶段2：高速跳转 (2-4秒)
- 格子高亮快速跳转
- 播放跳转音效和背景音
- 速度逐渐减慢

#### 阶段3：定格 (1秒)
- 高亮定格在获奖者格子
- 播放中奖音效
- 格子闪烁动画

#### 阶段4：结果展示
- 显示获奖者信息
- 弹出结果对话框

### 4. 音效设计

```typescript
// 新增的音效类型
'countdown': 电子倒计时声 (220Hz基频，脉冲效果)
'highlight': 快速提示音 (1000Hz高频，快速衰减)
'spin': 背景旋转音 (循环播放)
'win': 中奖庆祝音 (上升音阶)
```

### 5. 视觉效果

#### 格子状态样式
```css
/* 普通状态 */
.grid-cell {
  background: white;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

/* 高亮状态 */
.grid-cell.highlighted {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-color: #d97706;
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
}

/* 获奖状态 */
.grid-cell.winner {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #047857;
  transform: scale(1.1);
  animation: pulse 1s infinite;
}
```

## 用户体验设计

### 1. 交互流程
1. **配置阶段**：用户选择多宫格抽奖模式
2. **准备阶段**：显示宫格，展示所有选项
3. **开始抽奖**：点击按钮开始倒计时
4. **倒计时**：3秒倒计时增加紧张感
5. **跳转动画**：灯光快速跳转，逐渐减速
6. **结果揭晓**：定格在获奖者，播放庆祝动画
7. **结果展示**：弹窗显示详细结果

### 2. 视觉层次
- **背景**：渐变色背景营造氛围
- **宫格**：清晰的网格布局
- **高亮**：明显的颜色对比和动画
- **状态提示**：清晰的阶段指示

### 3. 音效体验
- **倒计时音**：低沉电子音，增加紧张感
- **跳转音**：快速提示音，跟随高亮
- **背景音**：循环播放的旋转音
- **中奖音**：欢快的庆祝音乐

## 配置选项

### 1. 数量限制
```typescript
case 'grid-lottery':
  return Math.min(15, allowRepeat ? 100 : itemCount)
```

### 2. 布局适配
- **6个格子**：2x3布局，适合少量选项
- **9个格子**：3x3布局，经典方形
- **12个格子**：3x4布局，适中选择
- **15个格子**：3x5布局，最大支持

### 3. 响应式设计
- 格子大小自适应屏幕
- 保持合适的宽高比
- 文字大小动态调整

## 技术特点

### 1. 性能优化
- 使用CSS Grid布局
- 硬件加速的transform动画
- 音效预加载和缓存
- 防抖的动画控制

### 2. 兼容性
- 支持现代浏览器
- 音效降级处理
- 触摸设备友好

### 3. 可维护性
- 模块化的组件设计
- 清晰的状态管理
- 完整的类型定义

## 使用场景

### 1. 适用场景
- **公司年会**：员工抽奖，氛围热烈
- **活动现场**：观众互动，视觉冲击
- **教学场景**：学生选择，增加趣味
- **聚会游戏**：朋友聚会，娱乐互动

### 2. 优势特点
- **仪式感强**：倒计时和音效营造氛围
- **视觉冲击**：灯光跳转效果吸引注意
- **操作简单**：一键开始，自动完成
- **结果公正**：随机算法保证公平

## 扩展可能

### 1. 未来优化
- 支持自定义宫格数量
- 添加更多动画效果
- 支持多人同时抽奖
- 添加历史记录功能

### 2. 个性化选项
- 自定义颜色主题
- 可选择音效风格
- 调整动画速度
- 自定义倒计时时长

---

**实现状态**: ✅ 完成  
**测试状态**: 🔄 待测试  
**用户体验**: 🎯 优秀

多宫格抽奖为用户提供了一种全新的、充满仪式感的抽奖体验，特别适合需要营造氛围的场合！