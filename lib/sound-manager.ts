// 音效管理器
export class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true
  private masterVolume: number = 0.7
  private audioContext: AudioContext | null = null
  private isInitialized: boolean = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializationPromise = this.initializeSounds()
    }
  }

  private async initializeSounds(): Promise<void> {
    try {
      // 初始化 AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 检查 AudioContext 状态
      if (this.audioContext.state === 'suspended') {
        // 等待用户交互后恢复 AudioContext
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true })
        document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true })
      }
      
      // 创建音效实例
      const soundCreationPromises = [
        this.createSoundSafely('spin', () => this.createSpinSound()),
        this.createSoundSafely('stop', () => this.createStopSound()),
        this.createSoundSafely('win', () => this.createWinSound()),
        this.createSoundSafely('bullet-scroll', () => this.createBulletScrollSound()),
        this.createSoundSafely('bullet-highlight', () => this.createBulletHighlightSound()),
        this.createSoundSafely('card-shuffle', () => this.createCardShuffleSound()),
        this.createSoundSafely('card-deal', () => this.createCardDealSound()),
        this.createSoundSafely('card-flip', () => this.createCardFlipSound()),
        this.createSoundSafely('card-reveal', () => this.createCardRevealSound()),
        // 多宫格抽奖音效
        this.createSoundSafely('countdown', () => this.createCountdownSound()),
        this.createSoundSafely('highlight', () => this.createHighlightSound()),
        // 闪烁点名音效
        this.createSoundSafely('blinking-start', () => this.createBlinkingStartSound()),
        this.createSoundSafely('tick', () => this.createTickSound()),
        this.createSoundSafely('slow-tick', () => this.createSlowTickSound()),
        this.createSoundSafely('select', () => this.createSelectSound()),
        this.createSoundSafely('complete', () => this.createCompleteSound())
      ]
      
      await Promise.allSettled(soundCreationPromises)
      this.isInitialized = true
      
      // 应用主音量到所有音效
      this.applyMasterVolume()
      
    } catch (error) {
      console.warn('音效初始化失败，将使用静默模式:', error)
      this.isInitialized = false
    }
  }

  // 安全地创建音效
  private async createSoundSafely(name: string, createFn: () => HTMLAudioElement): Promise<void> {
    try {
      const sound = createFn()
      
      // 添加错误处理监听器
      sound.addEventListener('error', (e) => {
        console.warn(`音效 ${name} 加载失败:`, e)
      })
      
      // 添加加载完成监听器
      sound.addEventListener('canplaythrough', () => {
        // 音效可以播放
      })
      
      this.sounds.set(name, sound)
    } catch (error) {
      console.warn(`创建音效 ${name} 失败:`, error)
      // 创建静默的音效作为后备
      const silentAudio = new Audio()
      silentAudio.src = this.createSimpleBeep(440, 0.1)
      silentAudio.volume = 0
      this.sounds.set(name, silentAudio)
    }
  }

  // 恢复 AudioContext
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('无法恢复 AudioContext:', error)
      }
    }
  }

  // 应用主音量到所有音效
  private applyMasterVolume(): void {
    this.sounds.forEach((sound, name) => {
      const baseVolume = this.getBaseVolume(name)
      sound.volume = baseVolume * this.masterVolume
    })
  }

  // 获取音效的基础音量
  private getBaseVolume(soundName: string): number {
    const baseVolumes: Record<string, number> = {
      'spin': 0.2,
      'stop': 0.4,
      'win': 0.5,
      'bullet-scroll': 0.3,
      'bullet-highlight': 0.5,
      'card-shuffle': 0.3,
      'card-deal': 0.4,
      'card-flip': 0.5,
      'card-reveal': 0.6,
      'countdown': 0.6,
      'highlight': 0.4,
      'blinking-start': 0.4,
      'tick': 0.3,
      'slow-tick': 0.4,
      'select': 0.5,
      'complete': 0.6
    }
    return baseVolumes[soundName] || 0.5
  }

  // 生成摇奖音效（模拟滚轮转动声）
  private createSpinSound(): HTMLAudioElement {
    const audio = new Audio()
    
    // 创建一个循环的白噪音效果，模拟滚轮转动
    if (this.audioContext) {
      try {
        const duration = 0.5
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成带有节奏的噪音，模拟滚轮声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          const frequency = 100 + Math.sin(t * 20) * 50 // 变化的频率
          const noise = (Math.random() - 0.5) * 0.1
          const tone = Math.sin(2 * Math.PI * frequency * t) * 0.05
          channelData[i] = noise + tone
        }
        
        // 转换为 data URL
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        // 如果 Web Audio API 失败，使用简单的音效
        audio.src = this.createSimpleBeep(200, 0.1)
      }
    } else {
      audio.src = this.createSimpleBeep(200, 0.1)
    }
    
    audio.loop = true
    audio.volume = 0.2
    return audio
  }

  // 生成停止音效
  private createStopSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.3
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成下降音调，模拟停止声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          const frequency = 400 * (1 - t / duration) // 频率下降
          const envelope = Math.exp(-t * 5) // 音量衰减
          channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(300, 0.2)
      }
    } else {
      audio.src = this.createSimpleBeep(300, 0.2)
    }
    
    audio.volume = 0.4
    return audio
  }

  // 生成中奖音效
  private createWinSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 1.0
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成欢快的上升音调，模拟中奖声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          const baseFreq = 523 // C5
          const melody = [523, 659, 784, 1047] // C5, E5, G5, C6
          const noteIndex = Math.floor(t * 4) % melody.length
          const frequency = melody[noteIndex]
          const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 2)
          channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(500, 0.5)
      }
    } else {
      audio.src = this.createSimpleBeep(500, 0.5)
    }
    
    audio.volume = 0.5
    return audio
  }

  // 生成弹幕滚动音效（快速滚动的电子音）
  private createBulletScrollSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.3
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成快速变化的电子音，模拟弹幕滚动
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          const frequency = 200 + Math.sin(t * 100) * 100 // 快速变化的频率
          const pulse = Math.sin(t * 50) > 0 ? 1 : 0 // 脉冲效果
          const envelope = Math.exp(-t * 3) // 快速衰减
          channelData[i] = Math.sin(2 * Math.PI * frequency * t) * pulse * envelope * 0.2
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(300, 0.2)
      }
    } else {
      audio.src = this.createSimpleBeep(300, 0.2)
    }
    
    audio.loop = true
    audio.volume = 0.3
    return audio
  }

  // 生成弹幕高亮音效（定格选中的提示音）
  private createBulletHighlightSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.4
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成清脆的提示音，模拟选中效果
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          const frequency = 800 + Math.sin(t * 20) * 200 // 高频提示音
          const envelope = Math.exp(-t * 8) * Math.sin(t * Math.PI * 3) // 三次震荡衰减
          channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(800, 0.3)
      }
    } else {
      audio.src = this.createSimpleBeep(800, 0.3)
    }
    
    audio.volume = 0.5
    return audio
  }

  // 生成卡牌洗牌音效（纸牌摩擦和洗牌声）
  private createCardShuffleSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 2.5
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成纸牌摩擦声，模拟洗牌过程
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 基础摩擦噪音
          const noise = (Math.random() - 0.5) * 0.3
          // 周期性的摩擦声
          const friction = Math.sin(t * 15 + Math.sin(t * 3) * 2) * 0.2
          // 随机的纸牌碰撞声
          const shuffle = Math.sin(t * 40 + Math.random() * Math.PI) * 0.1 * Math.sin(t * 2)
          // 音量包络，开始和结束较轻
          const envelope = Math.sin(t * Math.PI / duration) * 0.8
          
          channelData[i] = (noise + friction + shuffle) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(150, 0.3)
      }
    } else {
      audio.src = this.createSimpleBeep(150, 0.3)
    }
    
    audio.loop = true
    audio.volume = 0.3
    return audio
  }

  // 生成卡牌发牌音效（纸牌滑动声）
  private createCardDealSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.3
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成纸牌滑动声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 滑动摩擦声
          const slide = Math.sin(t * 200 + Math.sin(t * 50) * 0.5) * 0.2
          // 纸张振动声
          const flutter = (Math.random() - 0.5) * 0.1 * Math.exp(-t * 8)
          // 快速衰减的包络
          const envelope = Math.exp(-t * 6) * Math.sin(t * Math.PI * 2)
          
          channelData[i] = (slide + flutter) * envelope * 0.4
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(250, 0.2)
      }
    } else {
      audio.src = this.createSimpleBeep(250, 0.2)
    }
    
    audio.volume = 0.4
    return audio
  }

  // 生成卡牌翻转音效（纸牌翻转声）
  private createCardFlipSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.6
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成纸牌翻转声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 翻转时的空气阻力声
          const whoosh = Math.sin(t * 100 + Math.sin(t * 20) * 2) * 0.15
          // 纸张弯曲声
          const bend = Math.sin(t * 300) * 0.1 * Math.exp(-t * 4)
          // 落下时的轻微撞击声
          const tap = t > 0.4 ? Math.sin(t * 800) * 0.2 * Math.exp(-(t - 0.4) * 15) : 0
          // 整体包络
          const envelope = Math.sin(t * Math.PI) * 0.8
          
          channelData[i] = (whoosh + bend + tap) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(400, 0.3)
      }
    } else {
      audio.src = this.createSimpleBeep(400, 0.3)
    }
    
    audio.volume = 0.5
    return audio
  }

  // 生成卡牌揭晓音效（庆祝或揭晓声）
  private createCardRevealSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 1.2
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成庆祝揭晓声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 上升的音调序列
          const melody = [523, 659, 784, 1047, 1319] // C5, E5, G5, C6, E6
          const noteIndex = Math.floor(t * 5) % melody.length
          const frequency = melody[noteIndex]
          // 主旋律
          const tone = Math.sin(2 * Math.PI * frequency * t) * 0.3
          // 和声
          const harmony = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.15
          // 闪烁效果
          const sparkle = Math.sin(t * 20) * Math.sin(t * 100) * 0.1
          // 整体包络，逐渐衰减
          const envelope = Math.exp(-t * 1.5) * Math.sin(t * Math.PI / duration)
          
          channelData[i] = (tone + harmony + sparkle) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(600, 0.8)
      }
    } else {
      audio.src = this.createSimpleBeep(600, 0.8)
    }
    
    audio.volume = 0.6
    return audio
  }

  // 生成倒计时音效（电子倒计时声）
  private createCountdownSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.8
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成电子倒计时声
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 主音调 - 低沉的电子音
          const mainTone = Math.sin(2 * Math.PI * 220 * t) * 0.4
          // 和声 - 高一个八度
          const harmony = Math.sin(2 * Math.PI * 440 * t) * 0.2
          // 电子脉冲效果
          const pulse = Math.sin(t * 10) > 0.5 ? 1 : 0.3
          // 音量包络 - 快速上升，缓慢衰减
          const envelope = t < 0.1 ? t * 10 : Math.exp(-(t - 0.1) * 3)
          
          channelData[i] = (mainTone + harmony) * pulse * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(220, 0.5)
      }
    } else {
      audio.src = this.createSimpleBeep(220, 0.5)
    }
    
    audio.volume = 0.6
    return audio
  }

  // 生成高亮跳转音效（快速的电子提示音）
  private createHighlightSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.15
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成快速的高亮提示音
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 高频提示音
          const frequency = 1000 + Math.sin(t * 50) * 200
          const tone = Math.sin(2 * Math.PI * frequency * t) * 0.3
          // 快速衰减包络
          const envelope = Math.exp(-t * 20) * Math.sin(t * Math.PI * 5)
          
          channelData[i] = tone * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(1000, 0.1)
      }
    } else {
      audio.src = this.createSimpleBeep(1000, 0.1)
    }
    
    audio.volume = 0.4
    return audio
  }

  // 生成闪烁点名开始音效（专用的开始提示音）
  private createBlinkingStartSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.8
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成闪烁点名专用的开始音效
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 上升音调序列，表示开始
          const frequencies = [330, 440, 550] // 三个音调的上升序列
          const noteIndex = Math.floor(t * 6) % frequencies.length
          const frequency = frequencies[noteIndex]
          // 主音调
          const tone = Math.sin(2 * Math.PI * frequency * t) * 0.4
          // 电子音效果
          const electronic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.1
          // 渐强包络，营造开始的感觉
          const envelope = Math.min(1, t * 4) * Math.exp(-t * 2)
          
          channelData[i] = (tone + electronic) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(440, 0.6)
      }
    } else {
      audio.src = this.createSimpleBeep(440, 0.6)
    }
    
    audio.volume = 0.4
    return audio
  }

  // 生成闪烁节拍音效（快速的节拍提示音）
  private createTickSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.1
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成短促的节拍音
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 双音调节拍，模拟时钟滴答声
          const frequency1 = 800
          const frequency2 = 1200
          const tone1 = Math.sin(2 * Math.PI * frequency1 * t) * 0.3
          const tone2 = Math.sin(2 * Math.PI * frequency2 * t) * 0.2
          // 快速衰减包络
          const envelope = Math.exp(-t * 30) * Math.sin(t * Math.PI * 10)
          
          channelData[i] = (tone1 + tone2) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(800, 0.1)
      }
    } else {
      audio.src = this.createSimpleBeep(800, 0.1)
    }
    
    audio.volume = 0.3
    return audio
  }

  // 生成慢速节拍音效（减速时的低频节拍）
  private createSlowTickSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.2
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成低频的慢节拍音
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 低频主音调
          const frequency1 = 400
          const frequency2 = 600
          const tone1 = Math.sin(2 * Math.PI * frequency1 * t) * 0.4
          const tone2 = Math.sin(2 * Math.PI * frequency2 * t) * 0.2
          // 较慢的衰减，营造紧张感
          const envelope = Math.exp(-t * 15) * Math.sin(t * Math.PI * 5)
          
          channelData[i] = (tone1 + tone2) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(400, 0.2)
      }
    } else {
      audio.src = this.createSimpleBeep(400, 0.2)
    }
    
    audio.volume = 0.4
    return audio
  }

  // 生成选中确认音效（清脆的确认提示音）
  private createSelectSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 0.5
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成清脆的确认音
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 上升音调序列，表示确认
          const frequencies = [523, 659, 784] // C5, E5, G5
          const noteIndex = Math.floor(t * 6) % frequencies.length
          const frequency = frequencies[noteIndex]
          const tone = Math.sin(2 * Math.PI * frequency * t) * 0.4
          // 和声增强效果
          const harmony = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2
          // 铃声效果
          const bell = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.1
          // 衰减包络
          const envelope = Math.exp(-t * 4) * Math.sin(t * Math.PI * 2)
          
          channelData[i] = (tone + harmony + bell) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(650, 0.4)
      }
    } else {
      audio.src = this.createSimpleBeep(650, 0.4)
    }
    
    audio.volume = 0.5
    return audio
  }

  // 生成完成音效（庆祝完成的音效）
  private createCompleteSound(): HTMLAudioElement {
    const audio = new Audio()
    
    if (this.audioContext) {
      try {
        const duration = 1.5
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        // 生成庆祝完成音效
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          // 欢快的上升音阶
          const melody = [523, 587, 659, 698, 784, 880, 988, 1047] // C5到C6音阶
          const noteIndex = Math.floor(t * 8) % melody.length
          const frequency = melody[noteIndex]
          // 主旋律
          const tone = Math.sin(2 * Math.PI * frequency * t) * 0.3
          // 和声
          const harmony1 = Math.sin(2 * Math.PI * frequency * 1.25 * t) * 0.15
          const harmony2 = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.1
          // 闪烁装饰音
          const sparkle = Math.sin(t * 30) * Math.sin(t * 200) * 0.05
          // 整体包络，逐渐衰减但保持欢快
          const envelope = Math.exp(-t * 0.8) * Math.sin(t * Math.PI / duration) * 1.2
          
          channelData[i] = (tone + harmony1 + harmony2 + sparkle) * envelope
        }
        
        const wavData = this.bufferToWav(buffer)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        audio.src = URL.createObjectURL(blob)
      } catch (error) {
        audio.src = this.createSimpleBeep(700, 1.0)
      }
    } else {
      audio.src = this.createSimpleBeep(700, 1.0)
    }
    
    audio.volume = 0.6
    return audio
  }

  // 创建简单的蜂鸣音作为后备
  private createSimpleBeep(frequency: number, duration: number): string {
    return `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT`
  }

  // 将 AudioBuffer 转换为 WAV 格式
  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)
    const channelData = buffer.getChannelData(0)
    
    // WAV 文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)
    
    // 音频数据
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample * 0x7FFF, true)
      offset += 2
    }
    
    return arrayBuffer
  }

  // 播放音效
  async play(soundName: string): Promise<void> {
    if (!this.enabled) return
    
    // 等待初始化完成
    if (this.initializationPromise) {
      await this.initializationPromise
    }
    
    const sound = this.sounds.get(soundName)
    if (sound) {
      try {
        sound.currentTime = 0
        await sound.play()
      } catch (error) {
        console.warn(`播放音效 ${soundName} 失败:`, error)
      }
    }
  }

  // 停止音效
  stop(soundName: string): void {
    const sound = this.sounds.get(soundName)
    if (sound) {
      sound.pause()
      sound.currentTime = 0
    }
  }

  // 停止所有音效
  stopAll(): void {
    this.sounds.forEach(sound => {
      sound.pause()
      sound.currentTime = 0
    })
  }

  // 设置音效开关
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopAll()
    }
  }

  // 设置主音量 (0-1)
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.applyMasterVolume()
  }

  // 获取主音量
  getMasterVolume(): number {
    return this.masterVolume
  }

  // 设置单个音效音量
  setVolume(soundName: string, volume: number): void {
    const sound = this.sounds.get(soundName)
    if (sound) {
      const baseVolume = this.getBaseVolume(soundName)
      sound.volume = Math.max(0, Math.min(1, baseVolume * volume))
    }
  }

  // 获取音效是否启用
  isEnabled(): boolean {
    return this.enabled
  }

  // 获取初始化状态
  isReady(): boolean {
    return this.isInitialized
  }

  // 等待初始化完成
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise
    }
  }

  // 测试音效播放
  async testSound(soundName: string): Promise<boolean> {
    try {
      await this.waitForInitialization()
      const sound = this.sounds.get(soundName)
      if (!sound) return false
      
      // 临时启用音效进行测试
      const wasEnabled = this.enabled
      this.enabled = true
      
      await this.play(soundName)
      
      // 恢复原始状态
      this.enabled = wasEnabled
      
      return true
    } catch (error) {
      console.warn(`测试音效 ${soundName} 失败:`, error)
      return false
    }
  }

  // 获取所有可用的音效名称
  getAvailableSounds(): string[] {
    return Array.from(this.sounds.keys())
  }

  // 获取音效状态信息
  getSoundInfo(): { 
    enabled: boolean
    masterVolume: number
    initialized: boolean
    audioContextState: string | null
    availableSounds: string[]
  } {
    return {
      enabled: this.enabled,
      masterVolume: this.masterVolume,
      initialized: this.isInitialized,
      audioContextState: this.audioContext?.state || null,
      availableSounds: this.getAvailableSounds()
    }
  }

  // 预加载所有音效（用于优化性能）
  async preloadSounds(): Promise<void> {
    await this.waitForInitialization()
    
    const preloadPromises = Array.from(this.sounds.entries()).map(([name, sound]) => {
      return new Promise<void>((resolve) => {
        if (sound.readyState >= 2) { // HAVE_CURRENT_DATA
          resolve()
        } else {
          const onCanPlay = () => {
            sound.removeEventListener('canplay', onCanPlay)
            sound.removeEventListener('error', onError)
            resolve()
          }
          const onError = () => {
            sound.removeEventListener('canplay', onCanPlay)
            sound.removeEventListener('error', onError)
            console.warn(`预加载音效 ${name} 失败`)
            resolve()
          }
          
          sound.addEventListener('canplay', onCanPlay)
          sound.addEventListener('error', onError)
          
          // 触发加载
          sound.load()
        }
      })
    })
    
    await Promise.allSettled(preloadPromises)
  }
}

// 创建全局音效管理器实例
export const soundManager = new SoundManager()