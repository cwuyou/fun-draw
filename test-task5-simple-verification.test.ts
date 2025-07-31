import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Task 5: Grid Lottery Display Optimization - Code Verification', () => {
  const gridLotteryPagePath = join(process.cwd(), 'app/draw/grid-lottery/page.tsx')
  const drawResultModalPath = join(process.cwd(), 'components/draw-result-modal.tsx')
  
  const gridLotteryContent = readFileSync(gridLotteryPagePath, 'utf-8')
  const drawResultModalContent = readFileSync(drawResultModalPath, 'utf-8')

  it('should have "单次抽取" badge in header with proper styling', () => {
    // Check for the badge with updated styling
    expect(gridLotteryContent).toContain('单次抽取')
    expect(gridLotteryContent).toContain('bg-indigo-100 text-indigo-700')
    expect(gridLotteryContent).toContain('border border-indigo-200')
    
    console.log('✓ "单次抽取" badge found with proper styling')
  })

  it('should have updated page description emphasizing light jumping', () => {
    // Check for the updated description
    expect(gridLotteryContent).toContain('单次抽取模式 - 灯光跳转选择一位获奖者')
    
    console.log('✓ Page description updated to emphasize light jumping')
  })

  it('should display result using "获奖者：" format', () => {
    // Check for the singular result display format
    expect(gridLotteryContent).toContain('获奖者：{gameState.winner?.name}')
    
    console.log('✓ Result display uses "获奖者：" format (singular)')
  })

  it('should have updated mode description in getDrawResult', () => {
    // Check for the updated mode description
    expect(gridLotteryContent).toContain('mode: "多宫格抽奖（单次抽取）"')
    
    console.log('✓ Mode description updated to specify single draw')
  })

  it('should use conditional singular/plural forms in result modal', () => {
    // Check for conditional text in modal
    expect(drawResultModalContent).toContain('result.winners.length === 1 ? "恭喜获奖者！" : "恭喜以下幸运儿！"')
    expect(drawResultModalContent).toContain('result.winners.length === 1 ? "获奖者" : "中奖名单"')
    expect(drawResultModalContent).toContain('result.winners.length === 1 ? "1 位获奖者" : `${result.winners.length} 位中奖`')
    
    console.log('✓ Result modal uses conditional singular/plural forms')
  })

  it('should verify all task 5 sub-tasks are completed', () => {
    // Sub-task 1: 在多宫格抽奖页面头部添加"单次抽取"标识徽章
    const hasSingleDrawBadge = gridLotteryContent.includes('单次抽取') && 
                               gridLotteryContent.includes('bg-indigo-100 text-indigo-700')
    expect(hasSingleDrawBadge).toBe(true)
    
    // Sub-task 2: 更新页面标题和描述，明确显示这是单次抽取模式
    const hasUpdatedDescription = gridLotteryContent.includes('单次抽取模式 - 灯光跳转选择一位获奖者')
    expect(hasUpdatedDescription).toBe(true)
    
    // Sub-task 3: 修改结果显示文案，使用"获奖者"而不是"获奖者们"
    const hasSingularResultText = gridLotteryContent.includes('获奖者：{gameState.winner?.name}') &&
                                  drawResultModalContent.includes('result.winners.length === 1 ? "获奖者"')
    expect(hasSingularResultText).toBe(true)
    
    console.log('✓ All task 5 sub-tasks completed:')
    console.log('  1. ✓ "单次抽取" badge added to header')
    console.log('  2. ✓ Page title and description updated for single draw mode')
    console.log('  3. ✓ Result display uses "获奖者" instead of "获奖者们"')
  })

  it('should meet requirements 2.2 and 2.3', () => {
    // Requirement 2.2: Interface clearly shows single draw mode
    const meetsReq22 = gridLotteryContent.includes('单次抽取') && 
                       gridLotteryContent.includes('单次抽取模式 - 灯光跳转选择一位获奖者')
    expect(meetsReq22).toBe(true)
    
    // Requirement 2.3: Result clearly shows "获奖者：[姓名]" instead of "获奖者们"
    const meetsReq23 = gridLotteryContent.includes('获奖者：{gameState.winner?.name}') &&
                       drawResultModalContent.includes('result.winners.length === 1 ? "获奖者"')
    expect(meetsReq23).toBe(true)
    
    console.log('✓ Requirements 2.2 and 2.3 are met')
  })
})