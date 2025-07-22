# 设计文档

## 概述

卡牌抽奖页面的布局间距优化设计旨在解决当前存在的两个主要问题：1）洗牌和发牌阶段卡牌位置不一致导致的视觉跳跃；2）UI元素间缺乏适当间距导致的视觉拥挤。通过重新设计卡牌定位算法、优化容器布局系统和建立统一的间距规范，确保在所有设备和屏幕尺寸下提供一致且舒适的用户体验。

## 架构

### 核心组件架构

```
CardFlipGame (主容器)
├── GameInfoPanel (游戏信息面板)
├── GameStatusIndicator (游戏状态提示)  
├── CardContainer (卡牌容器)
│   ├── CardDeck (洗牌阶段)
│   └── PlayingCard[] (发牌/游戏阶段)
└── ResultPanel (中奖结果面板)
```

### 布局层次结构

1. **主容器层** - 整体页面布局和间距控制
2. **功能区域层** - 各功能模块的定位和间距
3. **卡牌布局层** - 卡牌的精确定位和动画
4. **响应式适配层** - 不同设备的布局调整

## 组件和接口

### 1. 布局管理器 (LayoutManager)

```typescript
interface LayoutManager {
  // 计算安全区域边距
  calculateSafeMargins(deviceType: DeviceType): SafeMargins
  
  // 计算卡牌容器尺寸
  calculateCardContainerDimensions(
    screenDimensions: Dimensions,
    safeMargins: SafeMargins
  ): ContainerDimensions
  
  // 验证布局是否溢出
  validateLayoutBounds(
    layout: CardLayout,
    container: ContainerDimensions
  ): ValidationResult
}

interface SafeMargins {
  top: number      // 距离顶部UI元素的安全距离
  bottom: number   // 距离底部UI元素的安全距离  
  left: number     // 距离左侧边界的安全距离
  right: number    // 距离右侧边界的安全距离
}
```

### 2. 卡牌定位系统 (CardPositionSystem)

```typescript
interface CardPositionSystem {
  // 计算卡牌网格布局
  calculateGridLayout(
    cardCount: number,
    containerDimensions: ContainerDimensions,
    deviceType: DeviceType
  ): CardPosition[]
  
  // 确保位置一致性
  ensurePositionConsistency(
    shufflePositions: CardPosition[],
    dealPositions: CardPosition[]
  ): CardPosition[]
  
  // 动态调整布局以防止溢出
  adjustLayoutForOverflow(
    positions: CardPosition[],
    container: ContainerDimensions
  ): CardPosition[]
}

interface CardPosition {
  x: number
  y: number
  rotation: number
  cardWidth: number
  cardHeight: number
  zIndex: number
}
```

### 3. 间距规范系统 (SpacingSystem)

```typescript
interface SpacingSystem {
  // 获取标准间距值
  getStandardSpacing(spacingType: SpacingType, deviceType: DeviceType): number
  
  // 计算元素间的最小安全距离
  calculateMinimumSafeDistance(
    element1: UIElement,
    element2: UIElement
  ): number
  
  // 验证间距是否符合规范
  validateSpacing(layout: UILayout): SpacingValidationResult
}

enum SpacingType {
  CARD_TO_STATUS = 'card-to-status',      // 卡牌到状态文本
  CARD_TO_INFO = 'card-to-info',          // 卡牌到游戏信息
  CARD_TO_RESULT = 'card-to-result',      // 卡牌到中奖结果
  CARD_TO_CONTAINER = 'card-to-container', // 卡牌到容器边界
  INTER_CARD = 'inter-card'               // 卡牌之间
}
```

## 数据模型

### 1. 响应式布局配置

```typescript
interface ResponsiveLayoutConfig {
  mobile: DeviceLayoutConfig
  tablet: DeviceLayoutConfig  
  desktop: DeviceLayoutConfig
}

interface DeviceLayoutConfig {
  // 卡牌尺寸配置
  cardDimensions: {
    width: number
    height: number
    minTouchSize: number
  }
  
  // 网格布局配置
  gridConfig: {
    maxCardsPerRow: number
    cardSpacing: number
    rowSpacing: number
  }
  
  // 安全边距配置
  safeMargins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  
  // UI元素间距配置
  elementSpacing: {
    cardToStatus: number
    cardToInfo: number
    cardToResult: number
    cardToContainer: number
  }
}
```

### 2. 布局状态管理

```typescript
interface LayoutState {
  // 当前设备类型
  deviceType: DeviceType
  
  // 容器尺寸
  containerDimensions: ContainerDimensions
  
  // 卡牌布局信息
  cardLayout: {
    positions: CardPosition[]
    gridInfo: GridInfo
    scaleFactor: number
  }
  
  // 间距验证结果
  spacingValidation: SpacingValidationResult
  
  // 布局是否需要重新计算
  needsRecalculation: boolean
}

interface GridInfo {
  rows: number
  columns: number
  totalWidth: number
  totalHeight: number
}
```

## 错误处理

### 1. 布局溢出处理

```typescript
interface OverflowHandler {
  // 检测布局溢出
  detectOverflow(layout: CardLayout, container: ContainerDimensions): OverflowInfo
  
  // 自动缩放解决溢出
  applyAutoScaling(layout: CardLayout, overflowInfo: OverflowInfo): CardLayout
  
  // 降级到安全布局
  fallbackToSafeLayout(cardCount: number, deviceType: DeviceType): CardLayout
}

interface OverflowInfo {
  horizontal: boolean
  vertical: boolean
  overflowAmount: { x: number, y: number }
  recommendedScale: number
}
```

### 2. 位置计算错误处理

- **输入验证**: 验证卡牌数量、容器尺寸等参数的有效性
- **边界检查**: 确保计算的位置不会超出容器边界
- **降级策略**: 当复杂布局失败时，自动降级到简单的网格布局
- **错误恢复**: 提供默认的安全位置作为后备方案

## 测试策略

### 1. 布局一致性测试

```typescript
describe('Layout Consistency', () => {
  test('洗牌到发牌位置保持一致', () => {
    // 验证洗牌结束位置与发牌开始位置一致
  })
  
  test('动画过程中位置稳定', () => {
    // 验证动画过程中卡牌不会出现位置跳跃
  })
  
  test('窗口大小改变时平滑调整', () => {
    // 验证响应式布局的平滑过渡
  })
})
```

### 2. 间距规范测试

```typescript
describe('Spacing Standards', () => {
  test('UI元素间距符合最小要求', () => {
    // 验证各UI元素间距不小于规定值
  })
  
  test('不同设备间距比例一致', () => {
    // 验证响应式间距的比例关系
  })
  
  test('内容溢出时自动调整', () => {
    // 验证内容过多时的自动调整机制
  })
})
```

### 3. 响应式布局测试

```typescript
describe('Responsive Layout', () => {
  test('移动端布局适配', () => {
    // 验证移动端的布局和间距
  })
  
  test('平板端布局适配', () => {
    // 验证平板端的布局和间距
  })
  
  test('桌面端布局适配', () => {
    // 验证桌面端的布局和间距
  })
  
  test('设备方向改变适配', () => {
    // 验证设备方向改变时的布局调整
  })
})
```

### 4. 性能测试

- **布局计算性能**: 确保复杂布局计算不会阻塞UI
- **动画流畅性**: 验证位置调整动画的流畅性
- **内存使用**: 监控布局状态管理的内存占用
- **响应时间**: 测试窗口大小改变时的响应速度

## 实现细节

### 1. 卡牌定位算法优化

当前的 `calculateCardPositions` 函数存在以下问题需要解决：

1. **位置一致性问题**: 洗牌结束位置与发牌开始位置不匹配
2. **边距计算不准确**: 硬编码的边距值不能适应所有场景
3. **溢出处理不完善**: 简单的缩放可能导致卡牌过小

**解决方案**:
- 建立统一的位置计算基准点
- 实现动态边距计算系统
- 添加智能的溢出处理和降级机制

### 2. 响应式间距系统

建立基于设备类型和屏幕尺寸的动态间距系统：

```typescript
const SPACING_CONFIG = {
  mobile: {
    cardToStatus: 24,
    cardToInfo: 32,
    cardToResult: 40,
    cardToContainer: 16,
    interCard: 12
  },
  tablet: {
    cardToStatus: 32,
    cardToInfo: 40,
    cardToResult: 48,
    cardToContainer: 24,
    interCard: 16
  },
  desktop: {
    cardToStatus: 40,
    cardToInfo: 48,
    cardToResult: 56,
    cardToContainer: 32,
    interCard: 20
  }
}
```

### 3. 动画位置同步

确保动画过程中的位置计算与最终布局位置完全一致：

- 在动画开始前预计算所有最终位置
- 使用相同的位置计算函数确保一致性
- 添加位置验证机制防止偏移

### 4. 容器自适应系统

实现智能的容器尺寸计算，考虑所有UI元素的空间需求：

- 动态计算可用空间
- 预留足够的安全边距
- 支持内容自适应扩展