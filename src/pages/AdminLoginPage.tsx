import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, LogIn, AlertTriangle } from 'lucide-react'
import { sessionManager } from '../utils/sessionManager'
import { validateUsername, validatePassword } from '../config/auth'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)

  // 检查是否已登录
  useEffect(() => {
    if (sessionManager.isLoggedIn()) {
      navigate('/admin@7@/dashboard')
    }
  }, [navigate])

  // 检查锁定状态
  useEffect(() => {
    const checkLockStatus = () => {
      const remainingTime = sessionManager.getRemainingLockTime()
      if (remainingTime > 0) {
        setLockoutTime(remainingTime)
        setError(`账户已被锁定。请在 ${Math.ceil(remainingTime / 60000)} 分钟后重试`)
      } else {
        setLockoutTime(0)
      }
    }

    checkLockStatus()
    const interval = setInterval(checkLockStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (lockoutTime > 0) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 验证输入
      if (!username.trim() || !password.trim()) {
        setError('请输入用户名和密码')
        return
      }

      if (!validateUsername(username)) {
        setError('用户名格式不正确（仅支持3-50个字符，英文、数字和下划线）')
        return
      }

      if (!validatePassword(password)) {
        setError('密码不符合安全要求（至少8个字符，包含大小写字母、数字和特殊字符）')
        return
      }

      // 验证凭据
      if (!sessionManager.checkLoginAttempts()) {
        const remainingTime = sessionManager.getRemainingLockTime()
        setError(`登录尝试次数过多。账户将被锁定 ${Math.ceil(remainingTime / 60000)} 分钟`)
        return
      }

      // 创建会话
      const success = sessionManager.createSession(username)
      
      if (success) {
        // 登录成功，跳转到管理后台
        navigate('/admin@7@/dashboard')
      } else {
        // 登录失败，记录失败次数
        sessionManager.recordLoginFailure()
        setError('用户名或密码错误')
      }

    } catch (error) {
      console.error('登录错误:', error)
      setError('登录过程中发生错误。请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-near-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">管理员登录</h1>
          <p className="text-text-secondary">请输入管理员凭据</p>
        </div>

        <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || lockoutTime > 0}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : lockoutTime > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  账户已锁定
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  登录
                </>
              )}
            </button>
          </form>

          {lockoutTime > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>账户锁定倒计时: {Math.ceil(lockoutTime / 60000)} 分钟</span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-text-secondary text-center">
              安全提示：使用强密码并定期更换
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}