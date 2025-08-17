# Design Document

## Overview

本设计文档描述了如何移除首页引导功能的技术方案。当前的引导功能通过ExperienceGuide组件实现，在用户首次访问时弹出多步骤的引导对话框。由于这个功能影响用户体验，特别是在中文环境下显示英文内容的问题，我们需要完全移除这个功能。

## Architecture

### 当前架构分析

引导功能涉及以下组件和模块：

1. **ExperienceGuide组件** (`components/experience-guide.tsx`)
   - 多步骤引导对话框
   - 模板选择功能
   - 用户偏好保存

2. **Experience Manager** (`lib/experience-manager.ts`)
   - `isFirstTimeUser()` 函数检测首次用户
   - `saveUserPreferences()` 保存用户偏好
   - 本地存储管理

3. **首页集成** (`app/page.tsx`)
   - 引导状态管理
   - 首次用户检测逻辑
   - ExperienceGuide组件渲染

4. **翻译文件**
   - `public/locales/en.json` 和 `public/locales/zh.json`
   - `experienceGuide` 相关翻译键

### 目标架构

移除引导功能后的简化架构：

1. **首页** (`app/page.tsx`)
   - 移除引导相关状态和逻辑
   - 保持其他功能不变
   - 简化组件结构

2. **Experience Manager** (`lib/experience-manager.ts`)
   - 保留核心功能
   - 移除首次用户检测相关函数
   - 保持其他体验管理功能

3. **组件清理**
   - ExperienceGuide组件可以保留但不使用
   - 或者完全删除（推荐）

## Components and Interfaces

### 需要修改的组件

#### 1. HomePage组件 (`app/page.tsx`)

**当前实现问题：**
- 使用`isFirstTimeUser()`检测首次用户
- 管理`showGuide`状态
- 渲染ExperienceGuide组件

**修改方案：**
```typescript
// 移除的导入
- import ExperienceGuide from "@/components/experience-guide"
- import { isFirstTimeUser } from "@/lib/experience-manager"

// 移除的状态
- const [showGuide, setShowGuide] = useState(false)

// 移除的useEffect
- useEffect(() => {
-   const checkFirstTime = async () => {
-     // 首次用户检测逻辑
-   }
-   checkFirstTime()
- }, [])

// 移除的处理函数
- const handleGuideTemplateSelect = (template: ExperienceTemplate) => {
-   // 引导模板选择处理
- }

// 移除的JSX
- <ExperienceGuide
-   isOpen={showGuide}
-   onClose={() => setShowGuide(false)}
-   onTemplateSelect={handleGuideTemplateSelect}
- />
```

#### 2. Experience Manager (`lib/experience-manager.ts`)

**保留的功能：**
- 体验会话管理
- 用户偏好设置
- 模板推荐
- 使用统计

**可选移除的功能：**
- `isFirstTimeUser()` 函数（如果其他地方不使用）
- 相关的首次用户检测逻辑

### 不需要修改的组件

#### 1. QuickExperience组件
- 保持现有功能
- 继续提供快速体验功能

#### 2. 其他页面组件
- 不受影响
- 保持现有功能

## Data Models

### 用户偏好设置

保持现有的`ExperienceUserPreferences`接口：

```typescript
export interface ExperienceUserPreferences {
  skipIntro: boolean // 可以保留，用于其他场景
  preferredTemplates: string[]
  lastUsedTemplate?: string
  autoStartDemo: boolean
}
```

### 本地存储

保持现有的存储结构，但移除引导相关的使用：

```typescript
const STORAGE_KEYS = {
  CURRENT_EXPERIENCE: 'current-experience-session',
  EXPERIENCE_HISTORY: 'experience-history',
  USER_PREFERENCES: 'experience-user-preferences'
} as const
```

## Error Handling

### 移除过程中的错误处理

1. **导入清理**
   - 确保移除所有未使用的导入
   - 避免TypeScript编译错误

2. **状态管理**
   - 移除相关状态变量
   - 清理相关的事件处理函数

3. **组件渲染**
   - 移除ExperienceGuide组件的渲染
   - 确保页面布局不受影响

### 运行时错误预防

1. **本地存储兼容性**
   - 保持现有的本地存储结构
   - 避免破坏现有用户数据

2. **功能降级**
   - 确保快速体验功能正常工作
   - 保持其他用户体验功能

## Testing Strategy

### 单元测试

1. **首页组件测试**
   - 验证引导对话框不再显示
   - 确保其他功能正常工作
   - 测试快速体验功能

2. **Experience Manager测试**
   - 测试保留的功能
   - 验证移除的功能不影响其他功能

### 集成测试

1. **用户流程测试**
   - 首次访问用户流程
   - 返回用户流程
   - 快速体验流程

2. **本地存储测试**
   - 验证数据持久化
   - 测试用户偏好设置

### 用户体验测试

1. **页面加载测试**
   - 验证首页快速加载
   - 确保没有不必要的延迟

2. **功能完整性测试**
   - 验证所有现有功能正常工作
   - 确保用户体验流畅

## Implementation Considerations

### 渐进式移除策略

1. **第一阶段：禁用引导**
   - 简单地不显示引导对话框
   - 保留相关代码以便回滚

2. **第二阶段：清理代码**
   - 移除未使用的组件和函数
   - 清理翻译文件

3. **第三阶段：优化**
   - 优化首页加载性能
   - 清理本地存储逻辑

### 向后兼容性

1. **用户数据保护**
   - 不删除现有用户的本地存储数据
   - 保持用户偏好设置

2. **功能保持**
   - 确保快速体验功能继续工作
   - 保持其他体验管理功能

### 性能优化

1. **减少首页加载时间**
   - 移除不必要的首次用户检测
   - 减少JavaScript包大小

2. **简化状态管理**
   - 减少React状态变量
   - 简化useEffect逻辑

## Migration Plan

### 代码迁移步骤

1. **修改首页组件**
   - 移除引导相关导入
   - 删除引导状态管理
   - 移除ExperienceGuide组件渲染

2. **清理Experience Manager**
   - 评估`isFirstTimeUser()`函数的使用
   - 如果只用于引导，则可以移除

3. **清理翻译文件**
   - 移除`experienceGuide`相关翻译键
   - 保持文件结构完整

4. **测试验证**
   - 运行所有相关测试
   - 验证用户体验

### 回滚计划

如果需要恢复引导功能：

1. **代码恢复**
   - 恢复ExperienceGuide组件使用
   - 恢复首页引导逻辑

2. **翻译恢复**
   - 恢复experienceGuide翻译键

3. **测试验证**
   - 确保引导功能正常工作