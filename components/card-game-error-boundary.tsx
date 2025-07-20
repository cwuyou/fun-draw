"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface CardGameErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface CardGameErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error
    resetError: () => void
    goHome: () => void
  }>
}

export class CardGameErrorBoundary extends React.Component<
  CardGameErrorBoundaryProps,
  CardGameErrorBoundaryState
> {
  constructor(props: CardGameErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): CardGameErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CardGameErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      hasError: true,
      error,
      errorInfo,
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            goHome={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }}
          />
        )
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  resetError: () => void
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/')
  }

  const handleResetError = () => {
    resetError()
    // 清理可能的错误状态
    if (typeof window !== 'undefined') {
      localStorage.removeItem('draw-config')
      localStorage.removeItem('temp-draw-list')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">卡牌游戏出错了</CardTitle>
          <CardDescription className="text-red-600">
            游戏遇到了意外错误，请尝试重新开始
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">错误详情：</p>
              <p className="text-xs text-red-600 mt-1 font-mono">
                {error.message || '未知错误'}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleResetError}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新开始游戏
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using error boundary in functional components
export function useCardGameErrorHandler() {
  const router = useRouter()

  const handleError = (error: Error, context?: any) => {
    console.error('Card game error:', error, context)
    
    // 可以在这里添加错误上报逻辑
    // reportError(error, context)
  }

  const showErrorToast = (message: string) => {
    // 这里可以使用 toast 系统显示错误
    console.error('Card game error toast:', message)
  }

  const recoverFromError = () => {
    // 清理错误状态
    if (typeof window !== 'undefined') {
      localStorage.removeItem('draw-config')
      localStorage.removeItem('temp-draw-list')
    }
    router.push('/draw-config')
  }

  return {
    handleError,
    showErrorToast,
    recoverFromError,
  }
}