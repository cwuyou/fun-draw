# 抽奖模式数量限制优化

## 问题描述

用户反馈：**老虎机式、弹幕滚动式抽奖数量应该设置上限。测试了27个名单，老虎机式抽奖页面是多列展示的，数量太多了，每一列的宽度会非常小，体验很不好。弹幕滚动式抽奖数量可以设置稍微大一些的上限，因为它按行展示的，每一行的宽度不会因为抽奖数量的变化而变化。**

## 问题分析

### 各抽奖模式的布局特点

1. **老虎机式**：
   - 水平排列多个滚轮
   - 滚轮数量越多，每个滚轮宽度越窄
   - 27个滚轮时，每个滚轮变得非常窄，难以阅读

2. **弹幕滚动式**：
   - 垂直排列多行弹幕
   - 每行独立滚动，宽度固定
   - 行数过多会超出垂直空间

3. **卡牌抽取式**：
   - 已有10张限制，布局协调

4. **盲盒式/扭蛋机式**：
   - 单个元素展示，无特殊布局限制

### 用户体验问题

- **老虎机式27个滚轮**：每个滚轮宽度约为屏幕宽度的1/27，文字几乎无法阅读
- **弹幕滚动式过多行**：可能超出屏幕高度，部分内容不可见
- **没有合理的上限指导**：用户不知道什么是合适的数量

## 解决方案

### 1. 智能数量限制策略

根据每种抽奖模式的特点设置合适的上限：

```typescript
const getMaxQuantityForMode = (mode: DrawingMode, allowRepeat: boolean, itemCount: number): number => {
  switch (mode) {
    case 'card-flip':
      return 10 // 卡牌模式：布局限制
    case 'slot-machine':
      return Math.min(12, allowRepeat ? 100 : itemCount) // 老虎机：最多12个滚轮
    case 'bullet-screen':
      return Math.min(20, allowRepeat ? 100 : itemCount) // 弹幕：最多20行
    case 'blind-box':
    case 'gashapon':
    default:
      return allowRepeat ? 100 : itemCount // 其他模式：保持原有逻辑
  }
}
```

### 2. 用户友好的提示信息

```typescript
const getQuantityLimitDescription = (mode: DrawingMode, allowRepeat: boolean, itemCount: number): string => {
  const maxQuantity = getMaxQuantityForMode(mode, allowRepeat, itemCount)
  
  switch (mode) {
    case 'card-flip':
      return '卡牌模式最多10个'
    case 'slot-machine':
      return `老虎机模式最多${maxQuantity}个（避免滚轮过窄）`
    case 'bullet-screen':
      return `弹幕模式最多${maxQuantity}个（垂直空间限制）`
    case 'blind-box':
    case 'gashapon':
    default:
      return `最多 ${maxQuantity} 个`
  }
}
```

### 3. 完整的验证逻辑

```typescript
// 输入框最大值限制
max={getMaxQuantityForMode(selectedMode, allowRepeat, items.length)}

// 输入时实时限制
const maxValue = getMaxQuantityForMode(selectedMode, allowRepeat, items.length)

// 提交时验证
const maxQuantity = getMaxQuantityForMode(selectedMode, allowRepeat, items.length)
if (numQuantity > maxQuantity) {
  toast({
    title: "数量错误",
    description: `${modeNames[selectedMode]}模式最多支持${maxQuantity}个`,
    variant: "destructive",
  })
  return
}
```

## 限制值设计理由

### 老虎机式：最多12个滚轮

**设计考虑**：
- 在1920px宽屏上，12个滚轮每个约160px宽度，可以清晰显示内容
- 在1366px笔记本上，12个滚轮每个约114px宽度，仍然可读
- 超过12个时，滚轮变得过窄，影响用户体验

**用户体验**：
- 修复前：27个滚轮，每个约50px宽，文字几乎无法阅读
- 修复后：最多12个滚轮，保持合适的宽度和可读性

### 弹幕滚动式：最多20行

**设计考虑**：
- 每行弹幕高度约40-50px（包含间距）
- 20行总高度约800-1000px，适合大部分屏幕
- 超过20行可能在小屏幕上超出可视区域

**用户体验**：
- 修复前：可能设置过多行数，部分内容不可见
- 修复后：确保所有弹幕都在可视区域内

### 卡牌抽取式：保持10张

**已有优化**：
- 经过之前的布局优化，10张卡牌可以很好地适应各种屏幕
- 使用2行或3行布局，视觉效果协调

### 其他模式：保持灵活性

**盲盒式/扭蛋机式**：
- 单个元素展示，不存在布局拥挤问题
- 保持原有的灵活性，最多100个（允许重复时）

## 修复效果

### 各模式限制值总结

| 抽奖模式 | 最大数量 | 限制原因 | 用户体验改善 |
|---------|---------|---------|-------------|
| 卡牌抽取式 | 10个 | 布局协调性 | 保持现有优化效果 |
| 老虎机式 | 12个 | 避免滚轮过窄 | 滚轮宽度合适，内容清晰可读 |
| 弹幕滚动式 | 20个 | 垂直空间限制 | 所有弹幕都在可视区域内 |
| 盲盒式 | 无限制* | 无特殊限制 | 保持灵活性 |
| 扭蛋机式 | 无限制* | 无特殊限制 | 保持灵活性 |

*无限制指受项目总数或100个上限约束

### 用户体验对比

**修复前（27个项目的情况）**：
- 老虎机式：27个滚轮，每个约50px宽 ❌ **无法阅读**
- 弹幕滚动式：27行弹幕，总高度约1350px ❌ **可能超出屏幕**
- 用户困惑：不知道合适的数量范围

**修复后（27个项目的情况）**：
- 老虎机式：最多12个滚轮，每个约114px宽 ✅ **清晰可读**
- 弹幕滚动式：最多20行弹幕，总高度约1000px ✅ **完全可见**
- 用户指导：清晰的限制说明和原因

## 技术实现

### 修改的文件
- `app/draw-config/page.tsx` - 配置页面的智能限制逻辑

### 核心函数
1. `getMaxQuantityForMode()` - 根据模式返回最大数量
2. `getQuantityLimitDescription()` - 生成用户友好的提示信息
3. 更新的验证逻辑 - 输入时和提交时的双重验证

### 边界情况处理
- **项目数量少于限制**：以项目数量为准
- **允许重复模式**：适当放宽限制（但仍有上限）
- **输入验证**：实时限制用户输入
- **提交验证**：最终检查确保数据有效

## 验证结果

✅ **老虎机式体验优化** - 滚轮宽度合适，内容清晰可读
✅ **弹幕滚动式空间控制** - 所有内容都在可视区域内
✅ **智能提示信息** - 用户了解限制原因
✅ **保持其他模式灵活性** - 不影响盲盒和扭蛋机模式
✅ **边界情况处理** - 各种场景下都有合适的限制

## 用户反馈预期

**修复前**：
> "老虎机27个滚轮太窄了，根本看不清楚内容，体验很差。"

**修复后**：
> "现在老虎机最多12个滚轮，每个都能看清楚，而且系统会提示为什么有这个限制，很贴心！"

---

**修复状态**: ✅ 完成  
**用户体验**: ✅ 显著改善  
**布局优化**: ✅ 各模式都有合适限制

现在各个抽奖模式都有了智能的数量限制，既保证了用户体验，又避免了界面布局问题！