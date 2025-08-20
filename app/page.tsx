"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dices,
  CreditCard,
  MessageSquare,
  Users,
  GraduationCap,
  Building,
  Heart,
  Sparkles,
  Play,
  Download,
  Share2,
  Hash,
  Menu,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import QuickExperience from "@/components/quick-experience"
import { useState } from "react"
import { ExperienceTemplate, DrawingMode } from "@/types"
import LanguageSwitcher from "@/components/language-switcher"
import { useTranslation } from "@/hooks/use-translation"
import { prepareModeConfig, prepareDemoModeConfigForMode } from "@/lib/start-mode"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,

  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"


type PendingMode = { href: string; mode: DrawingMode; title: string }

export default function HomePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showNoListDialog, setShowNoListDialog] = useState(false)
  const [pendingMode, setPendingMode] = useState<PendingMode | null>(null)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleExperienceStart = (template: ExperienceTemplate) => {
    // 体验开始的回调处理
    console.log('Experience started with template:', template.name)
  }

  const drawingModes: Array<{ icon: React.ReactElement; title: string; description: string; color: string; href: string; mode: DrawingMode; }> = [
    {
      icon: <Dices className="w-8 h-8" />,
      title: t('drawingModes.slotMachine.shortTitle'),
      description: t('drawingModes.slotMachine.description'),
      color: "bg-red-500",
      href: "/draw/slot-machine",
      mode: 'slot-machine',
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: t('drawingModes.cardFlip.shortTitle'),
      description: t('drawingModes.cardFlip.description'),
      color: "bg-blue-500",
      href: "/draw/card-flip",
      mode: 'card-flip',
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: t('drawingModes.bulletScreen.title'),
      description: t('drawingModes.bulletScreen.description'),
      color: "bg-green-500",
      href: "/draw/bullet-screen",
      mode: 'bullet-screen',
    },
    {
      icon: <Hash className="w-8 h-8" />,
      title: t('drawingModes.gridLottery.shortTitle'),
      description: t('drawingModes.gridLottery.description'),
      color: "bg-indigo-500",
      href: "/draw/grid-lottery",
      mode: 'grid-lottery',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: t('drawingModes.blinkingNamePicker.title'),
      description: t('drawingModes.blinkingNamePicker.description'),
      color: "bg-pink-500",
      href: "/draw/blinking-name-picker",
      mode: 'blinking-name-picker',
    },
  ]

  const useCases = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: t('home.useCases.items.classroom.title'),
      description: t('home.useCases.items.classroom.description'),
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: t('home.useCases.items.corporate.title'),
      description: t('home.useCases.items.corporate.description'),
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('home.useCases.items.party.title'),
      description: t('home.useCases.items.party.description'),
    },
  ]

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: t('home.features.items.modes.title'),
      description: t('home.features.items.modes.description'),
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: t('home.features.items.management.title'),
      description: t('home.features.items.management.description'),
    },
    {
      icon: <Play className="w-5 h-5" />,
      title: t('home.features.items.rules.title'),
      description: t('home.features.items.rules.description'),
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      title: t('home.features.items.sharing.title'),
      description: t('home.features.items.sharing.description'),
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
              Pick One
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/create-list" className="text-gray-600 hover:text-purple-600 transition-colors">
              {t('navigation.createList')}
            </Link>
            <Link href="/list-library" className="text-gray-600 hover:text-purple-600 transition-colors">
              {t('navigation.listLibrary')}
            </Link>
            <Link href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">
              {t('navigation.features')}
            </Link>
            <Link href="#modes" className="text-gray-600 hover:text-purple-600 transition-colors">
              {t('navigation.modes')}
            </Link>
            <Link href="#use-cases" className="text-gray-600 hover:text-purple-600 transition-colors">
              {t('navigation.useCases')}
            </Link>
            <Link href="/draw" className="ml-2">
              <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                {t('home.startButton')}
              </Button>
            </Link>
            <LanguageSwitcher variant="compact" className="ml-2" />
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link
                href="/create-list"
                className="text-gray-600 hover:text-purple-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.createList')}
              </Link>
              <Link
                href="/list-library"
                className="text-gray-600 hover:text-purple-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.listLibrary')}
              </Link>
              <Link
                href="#features"
                className="text-gray-600 hover:text-purple-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.features')}
              </Link>
              <Link
                href="#modes"
                className="text-gray-600 hover:text-purple-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.modes')}
              </Link>
              <Link
                href="#use-cases"
                className="text-gray-600 hover:text-purple-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.useCases')}
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-200">
            {t('home.newExperienceBadge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('home.hero.subtitle')}
            <br />
            {t('home.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <QuickExperience
              onExperienceStart={handleExperienceStart}
              variant="button"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            />
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg border-2 border-purple-300 text-purple-700 hover:border-purple-400 transition-all duration-300"
              onClick={() => router.push("/create-list")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t('navigation.createList')}
            </Button>
          </div>

          {/* 新用户提示 */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-purple-800">{t('home.newUserTipBold')}</h3>
              </div>
              <p className="text-purple-700 text-center leading-relaxed">
                {t('home.newUserTip')}
                <br />
                <span className="text-sm text-purple-600 mt-2 inline-block">
                  🎯 {t('home.useCases.items.classroom.title')} • 🎉 {t('home.useCases.items.corporate.title')} • 👥 {t('home.useCases.items.party.title')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('home.features.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('home.features.subtitle')}</p>
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

      {/* Quick Experience Section - MVP: remove to reduce duplication; Hero provides primary quick start */}
      {/*
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('home.quickExperienceSection.title')}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('home.quickExperienceSection.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <QuickExperience onExperienceStart={handleExperienceStart} variant="card" />
              <div className="space-y-6">...</div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Drawing Modes Section */}
      <section id="modes" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('home.modes.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('home.modes.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drawingModes.map((mode, index) => (
              <Link
                href={mode.href}
                key={index}
                className="block"
                onClick={(e) => {
                  try {
                    const raw = localStorage.getItem('selected-draw-list') || localStorage.getItem('temp-draw-list')
                    const data = raw ? JSON.parse(raw) : null
                    const hasList = data && Array.isArray(data.items) && data.items.length > 0
                    if (!hasList) {
                      // 无名单：弹出对话框
                      e.preventDefault()
                      setPendingMode({ href: mode.href, mode: mode.mode, title: mode.title })
                      setShowNoListDialog(true)
                      return
                    }

                    // 有名单：准备默认配置并直达
                    const result = prepareModeConfig(mode.mode)
                    if (result.config) {
                      e.preventDefault()
                      toast({
                        title: t('startMode.appliedTitle'),
                        description: t('startMode.appliedDesc', {
                          list: result.listName || t('startMode.defaultList'),
                          mode: mode.title,
                          qty: (result.config as any).quantity ?? 1,
                        }),
                      })
                      window.location.href = mode.href
                    }
                  } catch {}
                }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${mode.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">{mode.icon}</div>
                    </div>
                    <CardTitle className="text-xl text-gray-800">{mode.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600 text-base">{mode.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('home.useCases.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('home.useCases.subtitle')}</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t('home.cta.title')}</h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold" onClick={() => router.push('/draw')}>
              <Heart className="w-5 h-5 mr-2" />
              {t('home.cta.startButton')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg bg-transparent"
              onClick={() => {
                const el = document.getElementById('features');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('home.cta.learnMoreButton')}
            </Button>
          </div>
        </div>
      </section>

      {/* 无名单弹窗：示例数据 or 创建名单 */}
      <AlertDialog open={showNoListDialog} onOpenChange={setShowNoListDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('startMode.noListTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('startMode.noListDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoListDialog(false)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingMode) return
                const demo = prepareDemoModeConfigForMode(pendingMode.mode, t)
                if (demo.config) {
                  toast({
                    title: t('quickExperience.experienceStart'),
                    description: t('quickExperience.experienceStartDescription', { name: demo.templateName || '' })
                  })
                  window.location.href = pendingMode.href
                }
              }}
            >
              {t('startMode.useSample')}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowNoListDialog(false)
                router.push('/create-list')
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {t('startMode.goCreateList')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-300">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Dices className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Pick One</span>
          </div>
          <p className="text-sm text-gray-400">{t('home.footer.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}
