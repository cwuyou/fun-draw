'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'

interface PositionErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRetrying: boolean
}

interface PositionErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  enableRetry?: boolean
  showDetails?: boolean
  className?: string
}

interface ErrorDetails {
  type: 'position' | 'layout' | 'calculation' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  suggestions: string[]
}

export class PositionErrorBoundary extends Component<
  PositionErrorBoundaryProps,
  PositionErrorBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: PositionErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<PositionErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Position Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 记录错误到性能监控系统
    this.logErrorToMonitoring(error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  private logErrorToMonitoring(error: Error, errorInfo: ErrorInfo) {
    // 发送错误信息到监控系统
    if (typeof window !== 'undefined' && window.console) {
      console.group('🚨 Position Error Boundary')
      console.error('Error:', error.message)
      console.error('Stack:', error.stack)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // 可以在这里集成第三方错误监控服务
    // 例如: Sentry, LogRocket, Bugsnag 等
  }

  private analyzeError(error: Error): ErrorDetails {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    // 分析错误类型
    let type: ErrorDetails['type'] = 'unknown'
    let severity: ErrorDetails['severity'] = 'medium'
    let recoverable = true
    const suggestions: string[] = []

    // 位置相关错误
    if (message.includes('position') || message.includes('x') || message.includes('y')) {
      type = 'position'
      if (message.includes('undefined') || message.includes('null')) {
        severity = 'high'
        suggestions.push('检查位置对象是否正确初始化')
        suggestions.push('验证位置数组长度是否匹配')
      }
    }

    // 布局计算错误
    if (message.includes('layout') || message.includes('dimension') || message.includes('container')) {
      type = 'layout'
      if (message.includes('invalid') || message.includes('negative')) {
        severity = 'high'
        suggestions.push('检查容器尺寸是否有效')
        suggestions.push('验证布局参数是否正确')
      }
    }

    // 计算错误
    if (message.includes('calculation') || message.includes('math') || message.includes('nan')) {
      type = 'calculation'
      severity = 'medium'
      suggestions.push('检查数值计算是否溢出')
      suggestions.push('验证输入参数是否为有效数字')
    }

    // 严重错误判断
    if (message.includes('memory') || message.includes('stack overflow') || stack.includes('maximum call stack')) {
      severity = 'critical'
      recoverable = false
      suggestions.push('可能存在内存泄漏或无限递归')
      suggestions.push('建议刷新页面重新开始')
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push('尝试重新加载组件')
      suggestions.push('检查浏览器控制台获取更多信息')
    }

    return { type, severity, recoverable, suggestions }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached')
      return
    }

    this.setState({ isRetrying: true })

    // 延迟重试，给系统时间恢复
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      })
    }, 1000)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    })
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private renderErrorUI() {
    const { error, retryCount, isRetrying } = this.state
    const { maxRetries = 3, enableRetry = true, showDetails = false } = this.props

    if (!error) return null

    const errorDetails = this.analyzeError(error)
    const canRetry = enableRetry && retryCount < maxRetries && errorDetails.recoverable

    return (
      <div className={`min-h-[400px] flex items-center justify-center p-6 ${this.props.className || ''}`}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200">
          {/* 错误头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                errorDetails.severity === 'critical' ? 'bg-red-100' :
                errorDetails.severity === 'high' ? 'bg-orange-100' :
                'bg-yellow-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  errorDetails.severity === 'critical' ? 'text-red-600' :
                  errorDetails.severity === 'high' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {errorDetails.type === 'position' ? '位置计算错误' :
                   errorDetails.type === 'layout' ? '布局错误' :
                   errorDetails.type === 'calculation' ? '计算错误' :
                   '未知错误'}
                </h3>
                <p className="text-sm text-gray-600">
                  {errorDetails.severity === 'critical' ? '严重错误，需要重新加载' :
                   errorDetails.severity === 'high' ? '高优先级错误' :
                   '可恢复的错误'}
                </p>
              </div>
            </div>
          </div>

          {/* 错误内容 */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-700 mb-3">
                抱歉，卡牌位置计算遇到了问题。我们正在尝试恢复...
              </p>

              {/* 建议列表 */}
              {errorDetails.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">建议解决方案:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {errorDetails.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 重试信息 */}
              {enableRetry && (
                <div className="text-sm text-gray-600 mb-4">
                  重试次数: {retryCount}/{maxRetries}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      重试中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重试
                    </>
                  )}
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                重置
              </button>

              {errorDetails.severity === 'critical' && (
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新加载
                </button>
              )}
            </div>

            {/* 详细错误信息 */}
            {showDetails && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center">
                  <Bug className="w-4 h-4 mr-1" />
                  查看技术详情
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded border text-xs font-mono text-gray-700 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>错误信息:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>堆栈跟踪:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 否则渲染默认错误UI
      return this.renderErrorUI()
    }

    return this.props.children
  }
}

// 便捷的HOC包装器
export function withPositionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<PositionErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <PositionErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </PositionErrorBoundary>
  )

  WrappedComponent.displayName = `withPositionErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// 错误边界钩子（用于函数组件中的错误处理）
export function usePositionErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Position error caught by hook:', error, errorInfo)
    
    // 可以在这里添加错误上报逻辑
    if (typeof window !== 'undefined') {
      // 发送到错误监控服务
      console.group('🔧 Position Error Handler')
      console.error('Error:', error.message)
      console.error('Additional Info:', errorInfo)
      console.groupEnd()
    }
  }, [])

  return { handleError }
}