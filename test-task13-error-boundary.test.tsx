import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PositionErrorBoundary, withPositionErrorBoundary, usePositionErrorHandler } from '@/components/position-error-boundary'
import React from 'react'

// 测试组件 - 会抛出错误
const ThrowError = ({ shouldThrow = false, errorType = 'position' }: { shouldThrow?: boolean; errorType?: string }) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'position':
        throw new Error('Cannot read properties of undefined (reading \'x\')')
      case 'layout':
        throw new Error('Invalid container dimensions: -100x-200')
      case 'calculation':
        throw new Error('Math calculation failed: NaN result')
      case 'critical':
        throw new Error('Maximum call stack size exceeded')
      default:
        throw new Error('Unknown error occurred')
    }
  }
  return <div>正常组件</div>
}

// 测试用的函数组件
const TestComponent = () => {
  const { handleError } = usePositionErrorHandler()
  
  const triggerError = () => {
    try {
      throw new Error('Test position error')
    } catch (error) {
      handleError(error as Error, { component: 'TestComponent' })
    }
  }

  return (
    <div>
      <button onClick={triggerError}>触发错误</button>
    </div>
  )
}

describe('Task 13: Error Boundary Component for Position Errors', () => {
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    vi.clearAllMocks()
  })

  describe('PositionErrorBoundary Component', () => {
    it('should render children when no error occurs', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={false} />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('正常组件')).toBeInTheDocument()
    })

    it('should catch and display position-related errors', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="position" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('位置计算错误')).toBeInTheDocument()
      expect(screen.getByText(/抱歉，卡牌位置计算遇到了问题/)).toBeInTheDocument()
    })

    it('should analyze different error types correctly', () => {
      const { rerender } = render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="layout" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('布局错误')).toBeInTheDocument()

      rerender(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="calculation" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('计算错误')).toBeInTheDocument()
    })

    it('should handle critical errors with reload option', () => {
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="critical" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('严重错误，需要重新加载')).toBeInTheDocument()
      
      const reloadButton = screen.getByText('重新加载')
      fireEvent.click(reloadButton)
      
      expect(mockReload).toHaveBeenCalled()
    })

    it('should provide retry functionality', async () => {
      let shouldThrow = true
      
      const RetryTestComponent = () => {
        if (shouldThrow) {
          throw new Error('Temporary position error')
        }
        return <div>恢复成功</div>
      }

      render(
        <PositionErrorBoundary enableRetry={true} maxRetries={3}>
          <RetryTestComponent />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('位置计算错误')).toBeInTheDocument()
      
      // 模拟错误恢复
      shouldThrow = false
      
      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('恢复成功')).toBeInTheDocument()
      })
    })

    it('should limit retry attempts', async () => {
      render(
        <PositionErrorBoundary enableRetry={true} maxRetries={2}>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      expect(screen.getByText(/重试次数:.*0.*\/.*2/)).toBeInTheDocument()

      // 第一次重试
      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/重试次数:.*1.*\/.*2/)).toBeInTheDocument()
      }, { timeout: 2000 })

      // 第二次重试
      const retryButton2 = screen.getByText('重试')
      fireEvent.click(retryButton2)

      await waitFor(() => {
        expect(screen.getByText(/重试次数:.*2.*\/.*2/)).toBeInTheDocument()
      }, { timeout: 2000 })

      // 应该没有重试按钮了
      await waitFor(() => {
        expect(screen.queryByText('重试')).not.toBeInTheDocument()
      })
    })

    it('should call onError callback when error occurs', () => {
      const onErrorSpy = vi.fn()

      render(
        <PositionErrorBoundary onError={onErrorSpy}>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should render custom fallback when provided', () => {
      const customFallback = <div>自定义错误页面</div>

      render(
        <PositionErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('自定义错误页面')).toBeInTheDocument()
      expect(screen.queryByText('位置计算错误')).not.toBeInTheDocument()
    })

    it('should show error details when enabled', () => {
      render(
        <PositionErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('查看技术详情')).toBeInTheDocument()
      
      // 点击展开详情
      fireEvent.click(screen.getByText('查看技术详情'))
      
      expect(screen.getByText(/错误信息:/)).toBeInTheDocument()
    })

    it('should handle reset functionality', async () => {
      let shouldThrow = true
      
      const ResetTestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error for reset')
        }
        return <div>重置成功</div>
      }

      render(
        <PositionErrorBoundary>
          <ResetTestComponent />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('位置计算错误')).toBeInTheDocument()
      
      // 模拟错误修复
      shouldThrow = false
      
      const resetButton = screen.getByText('重置')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByText('重置成功')).toBeInTheDocument()
      })
    })

    it('should provide helpful suggestions based on error type', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="position" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('建议解决方案:')).toBeInTheDocument()
      expect(screen.getByText(/检查位置对象是否正确初始化/)).toBeInTheDocument()
    })
  })

  describe('withPositionErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const WrappedComponent = withPositionErrorBoundary(ThrowError, {
        enableRetry: false
      })

      render(<WrappedComponent shouldThrow={true} />)

      expect(screen.getByText('位置计算错误')).toBeInTheDocument()
      expect(screen.queryByText('重试')).not.toBeInTheDocument()
    })

    it('should preserve component display name', () => {
      const TestComp = () => <div>Test</div>
      TestComp.displayName = 'TestComponent'
      
      const WrappedComponent = withPositionErrorBoundary(TestComp)
      
      expect(WrappedComponent.displayName).toBe('withPositionErrorBoundary(TestComponent)')
    })
  })

  describe('usePositionErrorHandler Hook', () => {
    it('should handle errors in function components', () => {
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      render(<TestComponent />)

      const triggerButton = screen.getByText('触发错误')
      fireEvent.click(triggerButton)

      expect(consoleGroupSpy).toHaveBeenCalledWith('🔧 Position Error Handler')
      expect(consoleSpy).toHaveBeenCalledWith('Error:', 'Test position error')
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      consoleGroupSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })
  })

  describe('Error Analysis', () => {
    it('should correctly identify position errors', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="position" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('位置计算错误')).toBeInTheDocument()
      expect(screen.getByText('高优先级错误')).toBeInTheDocument()
    })

    it('should correctly identify layout errors', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="layout" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('布局错误')).toBeInTheDocument()
      expect(screen.getByText(/检查容器尺寸是否有效/)).toBeInTheDocument()
    })

    it('should correctly identify calculation errors', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="calculation" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('计算错误')).toBeInTheDocument()
      expect(screen.getByText(/检查数值计算是否溢出/)).toBeInTheDocument()
    })

    it('should handle critical errors appropriately', () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} errorType="critical" />
        </PositionErrorBoundary>
      )

      expect(screen.getByText('严重错误，需要重新加载')).toBeInTheDocument()
      expect(screen.getByText(/可能存在内存泄漏或无限递归/)).toBeInTheDocument()
      expect(screen.queryByText('重试')).not.toBeInTheDocument() // 不可恢复的错误不显示重试
    })
  })

  describe('Error Logging and Monitoring', () => {
    it('should log errors to console with proper formatting', () => {
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      expect(consoleGroupSpy).toHaveBeenCalledWith('🚨 Position Error Boundary')
      expect(consoleSpy).toHaveBeenCalledWith('Error:', expect.any(String))
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      consoleGroupSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })

    it('should handle errors gracefully when window is undefined', () => {
      // 这个测试在jsdom环境中不适用，因为window总是存在的
      // 我们可以测试组件在没有window.location的情况下的行为
      const originalLocation = window.location
      // @ts-ignore
      delete window.location

      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      // 应该正常渲染错误UI
      expect(screen.getByText('位置计算错误')).toBeInTheDocument()

      // 恢复location
      window.location = originalLocation
    })
  })

  describe('UI Interactions', () => {
    it('should show loading state during retry', async () => {
      render(
        <PositionErrorBoundary>
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      expect(screen.getByText('重试中...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /重试中/ })).toBeDisabled()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <PositionErrorBoundary className="custom-error-boundary">
          <ThrowError shouldThrow={true} />
        </PositionErrorBoundary>
      )

      expect(container.querySelector('.custom-error-boundary')).toBeInTheDocument()
    })
  })
})