# Requirements Document

## Introduction

多宫格抽奖模式的核心特点是通过灯光在多个宫格间跳转，最终定格在一个获奖者上。这种抽奖方式的本质决定了它应该一次只能抽取一个结果，而不是让用户配置抽取数量。当前实现中允许用户配置抽取数量是不合理的，需要优化为固定单次抽取模式。

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望多宫格抽奖模式自动设置为单次抽取，这样我就不需要手动配置数量，避免混淆。

#### Acceptance Criteria

1. WHEN 用户选择多宫格抽奖模式 THEN 系统 SHALL 自动将抽取数量设置为1且不可修改
2. WHEN 用户在多宫格抽奖模式下查看配置 THEN 系统 SHALL 隐藏数量输入框或显示为禁用状态
3. WHEN 用户切换到多宫格抽奖模式 THEN 系统 SHALL 显示说明文字"多宫格抽奖固定为单次抽取"

### Requirement 2

**User Story:** 作为用户，我希望多宫格抽奖的界面清楚地表明这是单次抽取模式，这样我就能理解为什么没有数量配置选项。

#### Acceptance Criteria

1. WHEN 用户选择多宫格抽奖模式 THEN 系统 SHALL 在配置页面显示模式说明"多宫格抽奖通过灯光跳转选择一个获奖者"
2. WHEN 用户在多宫格抽奖页面 THEN 系统 SHALL 在界面上显示"单次抽取"标识
3. WHEN 多宫格抽奖完成 THEN 系统 SHALL 在结果中明确显示"获奖者：[姓名]"而不是"获奖者们"

### Requirement 3

**User Story:** 作为用户，我希望多宫格抽奖的宫格数量能够根据参与项目数量智能调整，这样就能获得最佳的视觉效果。

#### Acceptance Criteria

1. WHEN 参与项目数量为1-6个 THEN 系统 SHALL 使用2×3布局（6宫格）
2. WHEN 参与项目数量为7-9个 THEN 系统 SHALL 使用3×3布局（9宫格）
3. WHEN 参与项目数量为10-12个 THEN 系统 SHALL 使用3×4布局（12宫格）
4. WHEN 参与项目数量为13-15个 THEN 系统 SHALL 使用3×5布局（15宫格）
5. WHEN 参与项目数量超过15个 THEN 系统 SHALL 使用3×5布局（15宫格）并随机选择15个项目填充

### Requirement 4

**User Story:** 作为用户，我希望多宫格抽奖模式与其他抽奖模式在配置流程上保持一致，只是在数量配置上有所区别。

#### Acceptance Criteria

1. WHEN 用户选择多宫格抽奖模式 THEN 系统 SHALL 保持相同的配置页面布局和流程
2. WHEN 用户在多宫格抽奖模式下配置 THEN 系统 SHALL 仍然显示项目列表、重复设置等其他配置选项
3. WHEN 用户从多宫格抽奖模式切换到其他模式 THEN 系统 SHALL 恢复数量输入框的可用状态
4. WHEN 用户保存多宫格抽奖配置 THEN 系统 SHALL 自动将数量设置为1并保存到localStorage

### Requirement 5

**User Story:** 作为用户，我希望多宫格抽奖的"允许重复"设置仍然有效，这样在项目数量少于宫格数量时可以重复填充。

#### Acceptance Criteria

1. WHEN 用户启用"允许重复"且项目数量少于宫格数量 THEN 系统 SHALL 重复使用项目填充所有宫格
2. WHEN 用户禁用"允许重复"且项目数量少于宫格数量 THEN 系统 SHALL 只使用现有项目，空余宫格保持空白或显示占位符
3. WHEN 多宫格抽奖开始 THEN 系统 SHALL 确保每个宫格都有有效的抽奖项目（如果启用重复）
4. WHEN 抽奖结果确定 THEN 系统 SHALL 返回原始项目而不是重复填充的副本