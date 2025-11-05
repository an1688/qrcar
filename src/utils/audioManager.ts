/**
 * 音效管理器
 * 使用 Web Audio API 生成和播放音效
 */

export type SoundType = 'input' | 'delete' | 'focus' | 'edit' | 'success' | 'error'

export interface AudioConfig {
  enabled: boolean
  volume: number
}

class AudioManager {
  private audioContext: AudioContext | null = null
  private config: AudioConfig = {
    enabled: true,
    volume: 0.08
  }

  constructor() {
    this.initAudioContext()
  }

  /**
   * 初始化 Audio Context
   */
  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass()
      }
    } catch (error) {
      console.warn('无法初始化 AudioContext:', error)
    }
  }

  /**
   * 恢复 Audio Context（浏览器策略要求用户交互后才能播放音频）
   */
  private async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('无法恢复 AudioContext:', error)
      }
    }
  }

  /**
   * 播放指定类型的音效
   */
  async play(soundType: SoundType) {
    if (!this.config.enabled || !this.audioContext) {
      return
    }

    try {
      await this.resumeContext()

      switch (soundType) {
        case 'input':
          this.playInputSound()
          break
        case 'delete':
          this.playDeleteSound()
          break
        case 'focus':
          this.playFocusSound()
          break
        case 'edit':
          this.playEditSound()
          break
        case 'success':
          this.playSuccessSound()
          break
        case 'error':
          this.playErrorSound()
          break
        default:
          console.warn('未知的音效类型:', soundType)
      }
    } catch (error) {
      console.warn('音效播放失败:', error)
    }
  }

  /**
   * 输入音效 - 清脆的单音
   */
  private playInputSound() {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 600
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.config.volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.12)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.12)
  }

  /**
   * 删除音效 - 低沉的音调
   */
  private playDeleteSound() {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 400
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.config.volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
  }

  /**
   * 焦点音效 - 柔和的提示音
   */
  private playFocusSound() {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 500
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.config.volume * 0.6, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.08)
  }

  /**
   * 编辑音效 - 上升音调
   */
  private playEditSound() {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(450, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(650, this.audioContext.currentTime + 0.15)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.config.volume * 0.7, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.15)
  }

  /**
   * 成功音效 - 愉悦的双音
   */
  private playSuccessSound() {
    if (!this.audioContext) return

    const playTone = (frequency: number, delay: number) => {
      const oscillator = this.audioContext!.createOscillator()
      const gainNode = this.audioContext!.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext!.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(this.config.volume * 1.2, this.audioContext!.currentTime + delay)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + delay + 0.2)

      oscillator.start(this.audioContext!.currentTime + delay)
      oscillator.stop(this.audioContext!.currentTime + delay + 0.2)
    }

    playTone(523, 0)    // C5
    playTone(659, 0.1)  // E5
  }

  /**
   * 错误音效 - 警告音
   */
  private playErrorSound() {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 300
    oscillator.type = 'sawtooth'

    gainNode.gain.setValueAtTime(this.config.volume * 0.8, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.15)
  }

  /**
   * 设置音效配置
   */
  setConfig(config: Partial<AudioConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AudioConfig {
    return { ...this.config }
  }

  /**
   * 启用音效
   */
  enable() {
    this.config.enabled = true
  }

  /**
   * 禁用音效
   */
  disable() {
    this.config.enabled = false
  }

  /**
   * 设置音量 (0-1)
   */
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume))
  }
}

// 导出单例
export const audioManager = new AudioManager()
