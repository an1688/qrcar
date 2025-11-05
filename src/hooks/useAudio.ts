import { useCallback, useEffect, useState } from 'react'
import { audioManager, type SoundType, type AudioConfig } from '../utils/audioManager'

/**
 * 音效 Hook
 * 提供音效播放和配置功能
 */
export function useAudio() {
  const [config, setConfig] = useState<AudioConfig>(audioManager.getConfig())

  /**
   * 播放指定类型的音效
   */
  const play = useCallback((soundType: SoundType) => {
    audioManager.play(soundType)
  }, [])

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: Partial<AudioConfig>) => {
    audioManager.setConfig(newConfig)
    setConfig(audioManager.getConfig())
  }, [])

  /**
   * 启用音效
   */
  const enable = useCallback(() => {
    audioManager.enable()
    setConfig(audioManager.getConfig())
  }, [])

  /**
   * 禁用音效
   */
  const disable = useCallback(() => {
    audioManager.disable()
    setConfig(audioManager.getConfig())
  }, [])

  /**
   * 切换音效开关
   */
  const toggle = useCallback(() => {
    if (config.enabled) {
      audioManager.disable()
    } else {
      audioManager.enable()
    }
    setConfig(audioManager.getConfig())
  }, [config.enabled])

  /**
   * 设置音量
   */
  const setVolume = useCallback((volume: number) => {
    audioManager.setVolume(volume)
    setConfig(audioManager.getConfig())
  }, [])

  return {
    play,
    config,
    updateConfig,
    enable,
    disable,
    toggle,
    setVolume
  }
}

/**
 * 输入框音效 Hook
 * 专门用于输入框的音效处理
 */
export function useInputAudio() {
  const { play } = useAudio()

  /**
   * 处理输入事件
   */
  const handleInput = useCallback(() => {
    play('input')
  }, [play])

  /**
   * 处理删除事件
   */
  const handleDelete = useCallback(() => {
    play('delete')
  }, [play])

  /**
   * 处理焦点事件
   */
  const handleFocus = useCallback(() => {
    play('focus')
  }, [play])

  /**
   * 处理编辑事件
   */
  const handleEdit = useCallback(() => {
    play('edit')
  }, [play])

  /**
   * 处理成功事件
   */
  const handleSuccess = useCallback(() => {
    play('success')
  }, [play])

  /**
   * 处理错误事件
   */
  const handleError = useCallback(() => {
    play('error')
  }, [play])

  /**
   * 处理键盘事件（结合输入框使用）
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      handleDelete()
    }
  }, [handleDelete])

  /**
   * 处理输入变化事件
   */
  const handleChange = useCallback((currentValue: string, previousValue: string) => {
    if (currentValue.length > previousValue.length) {
      // 输入
      handleInput()
    } else if (currentValue.length < previousValue.length) {
      // 删除
      handleDelete()
    }
  }, [handleInput, handleDelete])

  return {
    handleInput,
    handleDelete,
    handleFocus,
    handleEdit,
    handleSuccess,
    handleError,
    handleKeyDown,
    handleChange
  }
}
