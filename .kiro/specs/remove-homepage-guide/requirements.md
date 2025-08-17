# Requirements Document

## Introduction

用户反馈首页的引导功能影响用户体验。当用户进入首页时，默认语言是中文，但是弹出了英文的引导对话框，这种不一致的语言体验让用户感到困惑。为了改善用户体验，需要移除这个引导功能。

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望进入首页时不会弹出引导对话框，这样我可以直接开始使用应用而不被打断。

#### Acceptance Criteria

1. WHEN 用户首次访问首页 THEN 系统 SHALL NOT 显示引导对话框
2. WHEN 用户再次访问首页 THEN 系统 SHALL NOT 显示引导对话框
3. WHEN 用户进入首页 THEN 系统 SHALL 直接显示完整的首页内容

### Requirement 2

**User Story:** 作为用户，我希望首页保持简洁的用户体验，这样我可以快速找到我需要的功能。

#### Acceptance Criteria

1. WHEN 用户访问首页 THEN 系统 SHALL 移除所有与引导相关的UI元素
2. WHEN 用户访问首页 THEN 系统 SHALL 保持现有的快速体验功能正常工作
3. WHEN 用户访问首页 THEN 系统 SHALL 保持现有的导航和功能按钮正常工作

### Requirement 3

**User Story:** 作为开发者，我希望清理与引导功能相关的代码，这样可以减少代码复杂度和维护成本。

#### Acceptance Criteria

1. WHEN 移除引导功能 THEN 系统 SHALL 删除ExperienceGuide组件的使用
2. WHEN 移除引导功能 THEN 系统 SHALL 删除首次用户检测逻辑
3. WHEN 移除引导功能 THEN 系统 SHALL 保持代码的整洁性和可维护性
4. WHEN 移除引导功能 THEN 系统 SHALL 确保没有遗留的未使用代码