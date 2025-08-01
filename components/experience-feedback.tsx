"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Star, ThumbsUp, ThumbsDown, Heart, ArrowRight } from 'lucide-react'
import { completeExperienceSession } from '@/lib/experience-manager'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ExperienceFeedbackProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  templateName: string
  className?: string
}

interface FeedbackData {
  satisfaction: number
  wouldRecommend: boolean
  comments?: string
  improvements?: string[]
}

export default function ExperienceFeedback({ 
  isOpen, 
  onClose, 
  sessionId,
  templateName,
  className = ''
}: ExperienceFeedbackProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  // 验证必需的props
  if (!sessionId || !templateName) {
    console.error('ExperienceFeedback: Missing required props', { sessionId, templateName })
    return null
  }
  const [feedback, setFeedback] = useState<FeedbackData>({
    satisfaction: 0,
    wouldRecommend: true,
    comments: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'rating' | 'details' | 'thanks'>('rating')
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // 清理所有定时器
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  const handleSatisfactionRate = (rating: number) => {
    setFeedback(prev => ({ ...prev, satisfaction: rating }))
    
    // 自动进入下一步
    const timer = setTimeout(() => {
      setCurrentStep('details')
    }, 500)
    timersRef.current.push(timer)
  }

  const handleRecommendation = (recommend: boolean) => {
    setFeedback(prev => ({ ...prev, wouldRecommend: recommend }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return // 防止重复提交
    
    setIsSubmitting(true)
    
    try {
      // 提交反馈
      completeExperienceSession(sessionId, feedback)
      
      toast({
        title: t('experienceFeedback.feedbackSuccess'),
        description: t('experienceFeedback.feedbackSuccessDescription'),
      })
      
      setCurrentStep('thanks')
      
      // 3秒后自动关闭
      const timer = setTimeout(() => {
        if (onClose) {
          onClose()
        }
      }, 3000)
      timersRef.current.push(timer)
      
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast({
        title: t('experienceFeedback.submitFailed'),
        description: t('experienceFeedback.submitFailedDescription'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateOwnList = () => {
    try {
      onClose()
      router.push('/create-list')
    } catch (error) {
      console.error('Failed to navigate to create list:', error)
      window.location.href = '/create-list'
    }
  }

  const handleTryAnotherTemplate = () => {
    try {
      onClose()
      // 清除体验会话数据
      localStorage.removeItem('current-experience-session')
      router.push('/')
    } catch (error) {
      console.error('Failed to navigate to home:', error)
      window.location.href = '/'
    }
  }

  const renderRatingStep = () => (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {t('experienceFeedback.ratingQuestion', { templateName })}
        </h3>
        <p className="text-gray-600">{t('experienceFeedback.ratingDescription')}</p>
      </div>
      
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleSatisfactionRate(rating)}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
              feedback.satisfaction >= rating
                ? 'text-yellow-500'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <Star 
              className={`w-8 h-8 ${
                feedback.satisfaction >= rating ? 'fill-current' : ''
              }`} 
            />
          </button>
        ))}
      </div>
      
      <div className="text-sm text-gray-500">
        {feedback.satisfaction === 0 && t('experienceFeedback.ratingInstructions')}
        {feedback.satisfaction === 1 && t('experienceFeedback.ratingLabels.1')}
        {feedback.satisfaction === 2 && t('experienceFeedback.ratingLabels.2')}
        {feedback.satisfaction === 3 && t('experienceFeedback.ratingLabels.3')}
        {feedback.satisfaction === 4 && t('experienceFeedback.ratingLabels.4')}
        {feedback.satisfaction === 5 && t('experienceFeedback.ratingLabels.5')}
      </div>
    </div>
  )

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {t('experienceFeedback.detailsTitle')}
        </h3>
        <p className="text-gray-600">{t('experienceFeedback.detailsDescription')}</p>
      </div>

      {/* 推荐意愿 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          {t('experienceFeedback.recommendQuestion')}
        </label>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant={feedback.wouldRecommend === true ? "default" : "outline"}
            onClick={() => handleRecommendation(true)}
            className={`flex-1 sm:flex-none whitespace-nowrap ${feedback.wouldRecommend === true ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <ThumbsUp className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t('experienceFeedback.recommend')}</span>
          </Button>
          <Button
            variant={feedback.wouldRecommend === false ? "default" : "outline"}
            onClick={() => handleRecommendation(false)}
            className={`flex-1 sm:flex-none whitespace-nowrap ${feedback.wouldRecommend === false ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <ThumbsDown className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t('experienceFeedback.notRecommend')}</span>
          </Button>
        </div>
      </div>

      {/* 评论 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {t('experienceFeedback.commentsLabel')}
        </label>
        <Textarea
          placeholder={t('experienceFeedback.commentsPlaceholder')}
          value={feedback.comments}
          onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('rating')}
        >
          {t('experienceFeedback.backButton')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSubmitting ? t('experienceFeedback.submitting') : t('experienceFeedback.submitButton')}
        </Button>
      </div>
    </div>
  )

  const renderThanksStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
        <Heart className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {t('experienceFeedback.thanksTitle')}
        </h3>
        <p className="text-gray-600">
          {t('experienceFeedback.thanksDescription')}
        </p>
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <p className="text-sm text-purple-700 mb-3">
          {t('experienceFeedback.completionMessage')}
        </p>
        <div className="space-y-2">
          <Button
            onClick={handleCreateOwnList}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {t('experienceFeedback.createOwnList')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={handleTryAnotherTemplate}
            className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            {t('experienceFeedback.tryAnotherTemplate')}
          </Button>
        </div>
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t('experienceFeedback.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('experienceFeedback.description')}
          </DialogDescription>
          <div className="flex justify-center gap-2 mb-4">
            {['rating', 'details', 'thanks'].map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  ['rating', 'details', 'thanks'].indexOf(currentStep) >= index 
                    ? 'bg-purple-500' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStep === 'rating' && renderRatingStep()}
          {currentStep === 'details' && renderDetailsStep()}
          {currentStep === 'thanks' && renderThanksStep()}
        </div>

        {currentStep === 'rating' && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              {t('experienceFeedback.skipFeedback')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}