import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BulletScreenReel } from '../bullet-screen-reel'
import type { ListItem } from '@/types'

// Mock the translation hook
vi.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

describe('BulletScreenReel', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: '张三' },
    { id: '2', name: '李四' },
    { id: '3', name: '王五' },
    { id: '4', name: '赵六' },
    { id: '5', name: '陈七' },
    { id: '6', name: '刘八' },
    { id: '7', name: '杨九' },
    { id: '8', name: '黄十' }
  ]

  it('should display names in idle state (准备状态下应该显示名单)', async () => {
    render(
      <BulletScreenReel
        items={mockItems}
        isScrolling={false}
        finalResult={undefined}
      />
    )

    // 等待组件初始化
    await waitFor(() => {
      // 应该显示前6个名单项目
      expect(screen.getByText('张三')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
      expect(screen.getByText('王五')).toBeInTheDocument()
      expect(screen.getByText('赵六')).toBeInTheDocument()
      expect(screen.getByText('陈七')).toBeInTheDocument()
      expect(screen.getByText('刘八')).toBeInTheDocument()
    })

    // 第7个和第8个名称不应该显示（因为只显示前6个）
    expect(screen.queryByText('杨九')).not.toBeInTheDocument()
    expect(screen.queryByText('黄十')).not.toBeInTheDocument()
  })

  it('should display ready status text in idle state', async () => {
    render(
      <BulletScreenReel
        items={mockItems}
        isScrolling={false}
        finalResult={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('drawingComponents.bulletScreen.ready')).toBeInTheDocument()
    })
  })

  it('should handle empty items list gracefully', async () => {
    render(
      <BulletScreenReel
        items={[]}
        isScrolling={false}
        finalResult={undefined}
      />
    )

    // 应该不会崩溃，并且显示准备状态
    await waitFor(() => {
      expect(screen.getByText('drawingComponents.bulletScreen.ready')).toBeInTheDocument()
    })
  })

  it('should display fewer items when list is smaller than 6', async () => {
    const smallList: ListItem[] = [
      { id: '1', name: '张三' },
      { id: '2', name: '李四' },
      { id: '3', name: '王五' }
    ]

    render(
      <BulletScreenReel
        items={smallList}
        isScrolling={false}
        finalResult={undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
      expect(screen.getByText('王五')).toBeInTheDocument()
    })
  })

  it('should reset to idle state with names when scrolling stops', async () => {
    const { rerender } = render(
      <BulletScreenReel
        items={mockItems}
        isScrolling={true}
        finalResult={undefined}
      />
    )

    // 重新渲染为非滚动状态
    rerender(
      <BulletScreenReel
        items={mockItems}
        isScrolling={false}
        finalResult={undefined}
      />
    )

    // 应该回到准备状态并显示名单
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
      expect(screen.getByText('drawingComponents.bulletScreen.ready')).toBeInTheDocument()
    })
  })
})
