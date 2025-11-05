/**
 * 会话管理工具
 * 安全的会话存储和管理
 */

import { SESSION_CONFIG } from '../config/auth'

interface SessionData {
  token: string
  username: string
  loginTime: number
  lastActivity: number
  attempts: number
  lockedUntil?: number
}

class SessionManager {
  private static instance: SessionManager
  private sessionKey = 'admin_session'
  private attemptsKey = 'admin_login_attempts'

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // 验证用户名和密码
  validateCredentials(username: string, password: string): boolean {
    // 使用环境变量中的配置
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'changeme123'
    
    return username === adminUsername && password === adminPassword
  }

  // 检查登录尝试次数
  checkLoginAttempts(): boolean {
    const attempts = this.getLoginAttempts()
    const now = Date.now()
    
    // 检查是否被锁定
    if (attempts.lockedUntil && attempts.lockedUntil > now) {
      return false
    }
    
    // 重置锁定状态
    if (attempts.lockedUntil && attempts.lockedUntil <= now) {
      this.resetLoginAttempts()
      return true
    }
    
    return attempts.count < SESSION_CONFIG.maxAttempts
  }

  // 记录登录失败
  recordLoginFailure(): void {
    const attempts = this.getLoginAttempts()
    attempts.count += 1
    attempts.lastAttempt = Date.now()
    
    // 如果达到最大尝试次数，锁定账户
    if (attempts.count >= SESSION_CONFIG.maxAttempts) {
      attempts.lockedUntil = Date.now() + SESSION_CONFIG.lockoutDuration
    }
    
    localStorage.setItem(this.attemptsKey, JSON.stringify(attempts))
  }

  // 重置登录尝试
  resetLoginAttempts(): void {
    localStorage.removeItem(this.attemptsKey)
  }

  // 获取登录尝试信息
  private getLoginAttempts(): any {
    const stored = localStorage.getItem(this.attemptsKey)
    return stored ? JSON.parse(stored) : { count: 0, lastAttempt: 0 }
  }

  // 创建会话
  createSession(username: string): boolean {
    if (!this.checkLoginAttempts()) {
      return false
    }

    const sessionData: SessionData = {
      token: this.generateToken(),
      username,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      attempts: 0
    }

    // 存储会话数据
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionData))
    
    // 重置登录尝试
    this.resetLoginAttempts()
    
    return true
  }

  // 验证会话
  validateSession(): boolean {
    const session = this.getSession()
    if (!session) return false

    const now = Date.now()
    
    // 检查会话超时
    if (now - session.lastActivity > SESSION_CONFIG.timeout) {
      this.clearSession()
      return false
    }

    // 更新最后活动时间
    session.lastActivity = now
    localStorage.setItem(this.sessionKey, JSON.stringify(session))
    
    return true
  }

  // 获取会话信息
  getSession(): SessionData | null {
    const stored = localStorage.getItem(this.sessionKey)
    return stored ? JSON.parse(stored) : null
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return this.validateSession()
  }

  // 获取用户名
  getUsername(): string | null {
    const session = this.getSession()
    return session ? session.username : null
  }

  // 清除会话
  clearSession(): void {
    localStorage.removeItem(this.sessionKey)
  }

  // 生成安全的令牌
  private generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // 获取剩余锁定时间
  getRemainingLockTime(): number {
    const attempts = this.getLoginAttempts()
    if (!attempts.lockedUntil) return 0
    
    const remaining = attempts.lockedUntil - Date.now()
    return Math.max(0, remaining)
  }
}

export const sessionManager = SessionManager.getInstance()
