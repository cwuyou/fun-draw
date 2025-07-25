"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dices,
  Gift,
  CreditCard,
  MessageSquare,
  Gamepad2,
  Users,
  GraduationCap,
  Building,
  Heart,
  Sparkles,
  Play,
  Download,
  Share2,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const drawingModes = [
    {
      icon: <Dices className="w-8 h-8" />,
      title: "老虎机式",
      description: "经典滚轮动画，紧张刺激的抽奖体验",
      color: "bg-red-500",
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "盲盒式",
      description: "神秘开箱动画，充满惊喜的揭晓时刻",
      color: "bg-purple-500",
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "卡牌抽取式",
      description: "优雅翻牌动画，如同魔术师的表演",
      color: "bg-blue-500",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "弹幕滚动式",
      description: "快速滚动定格，动感十足的选择过程",
      color: "bg-green-500",
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "扭蛋机式",
      description: "可爱扭蛋动画，童趣满满的抽奖方式",
      color: "bg-orange-500",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "闪烁点名式",
      description: "快速闪烁定格，公平随机的点名体验",
      color: "bg-pink-500",
    },
  ]

  const useCases = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "课堂教学",
      description: "随机点名、分组、提问，让课堂更有趣",
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "企业活动",
      description: "年会抽奖、团建活动、现场互动",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "朋友聚会",
      description: "做决策、游戏选择、聚会助兴",
    },
  ]

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "多种抽奖模式",
      description: "6种创新动画效果，告别单调的转盘",
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: "便捷名单管理",
      description: "支持手动输入、批量导入、本地保存",
    },
    {
      icon: <Play className="w-5 h-5" />,
      title: "灵活抽奖规则",
      description: "自定义抽取数量、是否允许重复中奖",
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      title: "结果分享保存",
      description: "一键复制、导出文件、连续抽奖",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Dices className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              趣抽
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/create-list" className="text-gray-600 hover:text-purple-600 transition-colors">
              创建名单
            </Link>
            <Link href="/list-library" className="text-gray-600 hover:text-purple-600 transition-colors">
              名单库
            </Link>
            <Link href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">
              功能特色
            </Link>
            <Link href="#modes" className="text-gray-600 hover:text-purple-600 transition-colors">
              抽奖模式
            </Link>
            <Link href="#use-cases" className="text-gray-600 hover:text-purple-600 transition-colors">
              使用场景
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-200">
            🎉 全新多模式抽奖体验
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            让抽奖变得更有趣
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            告别单调的转盘抽奖！趣抽为您提供6种创新的抽奖动画模式，
            <br />
            无论是课堂教学、企业年会还是朋友聚会，都能找到最适合的抽奖方式。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
              onClick={() => router.push("/create-list")}
            >
              <Play className="w-5 h-5 mr-2" />
              立即开始抽奖
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg bg-transparent"
            >
              查看演示
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">为什么选择趣抽？</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">我们重新定义了在线抽奖体验，让每一次抽奖都充满期待和乐趣</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <CardTitle className="text-lg text-gray-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Drawing Modes Section */}
      <section id="modes" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">六种创新抽奖模式</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              每种模式都有独特的动画效果和音效，为不同场景提供最佳的抽奖体验
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drawingModes.map((mode, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm group"
              >
                <CardHeader className="text-center">
                  <div
                    className={`w-16 h-16 ${mode.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="text-white">{mode.icon}</div>
                  </div>
                  <CardTitle className="text-xl text-gray-800">{mode.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 text-base">{mode.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">适用场景</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">从教育到企业，从娱乐到决策，趣抽能够满足各种抽奖需求</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-white">{useCase.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{useCase.title}</h3>
                <p className="text-gray-600 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">准备好开始您的趣味抽奖之旅了吗？</h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            无需注册，无需下载，打开浏览器就能使用。支持PC、平板、手机全平台。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              <Heart className="w-5 h-5 mr-2" />
              免费开始使用
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg bg-transparent"
            >
              了解更多功能
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-300">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Dices className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">趣抽</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 趣抽 - 让抽奖变得更有趣 | 多模式趣味抽奖网站</p>
        </div>
      </footer>
    </div>
  )
}
