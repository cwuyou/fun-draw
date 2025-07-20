'use client'

import { useState } from 'react'
import { CardDeck } from './card-deck'
import { Button } from './ui/button'

export function CardDeckTest() {
  const [isShuffling, setIsShuffling] = useState(false)
  const [totalCards] = useState(8)

  const handleStartShuffle = () => {
    setIsShuffling(true)
  }

  const handleShuffleComplete = () => {
    setIsShuffling(false)
    console.log('洗牌完成!')
  }

  return (
    <div className="flex flex-col items-center space-y-8 p-8">
      <h2 className="text-2xl font-bold">CardDeck 组件测试</h2>
      
      <div className="flex flex-col items-center space-y-4">
        <CardDeck
          totalCards={totalCards}
          isShuffling={isShuffling}
          onShuffleComplete={handleShuffleComplete}
        />
        
        <div className="text-sm text-gray-600">
          卡牌数量: {totalCards}
        </div>
        
        <div className="text-sm text-gray-600">
          状态: {isShuffling ? '洗牌中...' : '待机'}
        </div>
      </div>
      
      <Button 
        onClick={handleStartShuffle}
        disabled={isShuffling}
        className="px-6 py-2"
      >
        {isShuffling ? '洗牌中...' : '开始洗牌'}
      </Button>
      
      <div className="text-xs text-gray-500 max-w-md text-center">
        点击"开始洗牌"按钮测试洗牌动画效果。洗牌过程中会播放音效，
        动画持续2.5秒后自动完成。
      </div>
    </div>
  )
}