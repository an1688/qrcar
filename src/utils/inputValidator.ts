/**
 * 输入验证工具
 * 防止XSS、SQL注入等攻击
 */

// XSS防护
export class XSSProtection {
  // HTML实体编码
  static encodeHTML(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  // 清理HTML标签
  static stripHTML(str: string): string {
    const div = document.createElement('div')
    div.innerHTML = str
    return div.textContent || div.innerText || ''
  }

  // 验证字符串是否包含危险字符
  static containsDangerousChars(str: string): boolean {
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\(/gi,
      /expression\(/gi
    ]
    
    return dangerousPatterns.some(pattern => pattern.test(str))
  }
}

// 输入验证规则
export class InputValidator {
  // 手机号验证
  static validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: '手机号码不能为空' }
    }

    // 移除空格和特殊字符
    const cleanPhone = phone.replace(/[^\d]/g, '')
    
    if (cleanPhone.length !== 11) {
      return { isValid: false, error: '手机号码必须是11位数字' }
    }

    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      return { isValid: false, error: '手机号码格式不正确' }
    }

    // 检查是否包含危险字符
    if (XSSProtection.containsDangerousChars(phone)) {
      return { isValid: false, error: '输入包含非法字符' }
    }

    return { isValid: true }
  }

  // 用户名验证
  static validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: '用户名不能为空' }
    }

    if (username.length < 3 || username.length > 50) {
      return { isValid: false, error: '用户名长度必须在3-50个字符之间' }
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, error: '用户名只能包含字母、数字和下划线' }
    }

    // 检查是否包含危险字符
    if (XSSProtection.containsDangerousChars(username)) {
      return { isValid: false, error: '输入包含非法字符' }
    }

    return { isValid: true }
  }

  // 密码验证
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: '密码不能为空' }
    }

    if (password.length < 8) {
      return { isValid: false, error: '密码长度至少8位' }
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: '密码必须包含小写字母' }
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: '密码必须包含大写字母' }
    }

    if (!/\d/.test(password)) {
      return { isValid: false, error: '密码必须包含数字' }
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, error: '密码必须包含特殊字符' }
    }

    // 检查是否包含危险字符
    if (XSSProtection.containsDangerousChars(password)) {
      return { isValid: false, error: '输入包含非法字符' }
    }

    return { isValid: true }
  }

  // QR码验证
  static validateQRCode(code: string): { isValid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
      return { isValid: false, error: 'QR码不能为空' }
    }

    if (code.length < 3 || code.length > 20) {
      return { isValid: false, error: 'QR码长度必须在3-20个字符之间' }
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
      return { isValid: false, error: 'QR码只能包含大写字母和数字' }
    }

    // 检查是否包含危险字符
    if (XSSProtection.containsDangerousChars(code)) {
      return { isValid: false, error: '输入包含非法字符' }
    }

    return { isValid: true }
  }

  // 通用字符串验证
  static validateString(str: string, maxLength = 255): { isValid: boolean; error?: string } {
    if (!str || typeof str !== 'string') {
      return { isValid: false, error: '输入不能为空' }
    }

    if (str.length > maxLength) {
      return { isValid: false, error: `输入长度不能超过${maxLength}个字符` }
    }

    // 检查是否包含危险字符
    if (XSSProtection.containsDangerousChars(str)) {
      return { isValid: false, error: '输入包含非法字符' }
    }

    return { isValid: true }
  }

  // 数字验证
  static validateNumber(num: any): { isValid: boolean; error?: string; value?: number } {
    if (num === null || num === undefined || num === '') {
      return { isValid: false, error: '数字不能为空' }
    }

    const parsedNum = Number(num)
    if (isNaN(parsedNum)) {
      return { isValid: false, error: '必须是有效数字' }
    }

    return { isValid: true, value: parsedNum }
  }
}

// 数据清理工具
export class DataSanitizer {
  // 清理用户输入
  static sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    // 移除HTML标签
    let cleaned = XSSProtection.stripHTML(input)
    
    // 移除危险字符
    cleaned = cleaned.replace(/[<>\"']/g, '')
    
    // 移除多余的空格
    cleaned = cleaned.trim().replace(/\s+/g, ' ')
    
    return cleaned
  }

  // 清理手机号
  static sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return ''
    }

    // 只保留数字
    return phone.replace(/[^\d]/g, '')
  }

  // 清理用户名
  static sanitizeUsername(username: string): string {
    if (!username || typeof username !== 'string') {
      return ''
    }

    // 只保留字母、数字和下划线
    return username.replace(/[^a-zA-Z0-9_]/g, '')
  }

  // 清理QR码
  static sanitizeQRCode(code: string): string {
    if (!code || typeof code !== 'string') {
      return ''
    }

    // 只保留大写字母和数字
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  }
}

// 输入验证中间件
export function validateInput(schema: { [key: string]: (value: any) => { isValid: boolean; error?: string } }) {
  return (data: any) => {
    const errors: { [key: string]: string } = {}
    const cleanedData: any = {}

    for (const [field, validator] of Object.entries(schema)) {
      const value = data[field]
      const validation = validator(value)

      if (!validation.isValid) {
        errors[field] = validation.error || '验证失败'
      } else {
        cleanedData[field] = value
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      data: cleanedData
    }
  }
}

// 常用验证模式
export const ValidationPatterns = {
  phone: (value: any) => InputValidator.validatePhoneNumber(value),
  username: (value: any) => InputValidator.validateUsername(value),
  password: (value: any) => InputValidator.validatePassword(value),
  qrCode: (value: any) => InputValidator.validateQRCode(value),
  string: (value: any) => InputValidator.validateString(value),
  number: (value: any) => InputValidator.validateNumber(value)
}
