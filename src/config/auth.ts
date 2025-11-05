/**
 * 安全认证配置
 * 使用环境变量存储敏感信息
 */

// 管理员凭据配置
export const ADMIN_CONFIG = {
  username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'changeme123',
  // 密码哈希（使用bcrypt格式）
  passwordHash: import.meta.env.VITE_ADMIN_PASSWORD_HASH || '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
}

// 会话配置
export const SESSION_CONFIG = {
  timeout: 30 * 60 * 1000, // 30分钟
  maxAttempts: 5, // 最大登录尝试次数
  lockoutDuration: 15 * 60 * 1000, // 锁定15分钟
}

// 密码策略
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
}

// 验证用户名
export const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_]+$/.test(username)
}

// 验证密码强度
export const validatePassword = (password: string): boolean => {
  if (password.length < PASSWORD_POLICY.minLength) return false
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) return false
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) return false
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) return false
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false
  return true
}

// 生成会话令牌
export const generateSessionToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 验证会话令牌
export const validateSessionToken = (token: string): boolean => {
  return token && token.length === 64 && /^[a-f0-9]+$/.test(token)
}
