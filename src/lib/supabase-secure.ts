import { createClient } from '@supabase/supabase-js'

// 安全配置：从环境变量获取敏感信息
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 验证环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase配置缺失：请设置VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY环境变量')
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // 不持久化会话到localStorage
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'qr-parking-system'
    }
  }
})

// 数据库操作封装
export class DatabaseService {
  // 安全的QR码查询
  static async getQRCodes(limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('QR码查询失败:', error)
      return { data: null, error }
    }
  }

  // 安全的手机绑定查询
  static async getPhoneBindings(qrCodeId?: string) {
    try {
      let query = supabase
        .from('phone_bindings')
        .select(`
          id,
          phone1,
          phone2,
          bound_at,
          updated_at,
          qr_code:qr_codes(code, status)
        `)
        .is('deleted_at', null) // 只查询未删除的记录

      if (qrCodeId) {
        query = query.eq('qr_code_id', qrCodeId)
      }

      const { data, error } = await query.order('bound_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('手机绑定查询失败:', error)
      return { data: null, error }
    }
  }

  // 安全的通话记录查询
  static async getCallLogs(limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          id,
          phone_number,
          called_at,
          call_status,
          qr_code:qr_codes(code)
        `)
        .order('called_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('通话记录查询失败:', error)
      return { data: null, error }
    }
  }

  // 创建手机绑定（带权限检查）
  static async createPhoneBinding(qrCodeId: string, phone1: string, phone2?: string) {
    try {
      // 输入验证
      if (!qrCodeId || !phone1) {
        throw new Error('QR码ID和手机号码不能为空')
      }

      if (!/^1[3-9]\d{9}$/.test(phone1)) {
        throw new Error('手机号码格式不正确')
      }

      if (phone2 && !/^1[3-9]\d{9}$/.test(phone2)) {
        throw new Error('备用手机号码格式不正确')
      }

      const { data, error } = await supabase
        .from('phone_bindings')
        .insert({
          qr_code_id: qrCodeId,
          phone1,
          phone2: phone2 || null
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('创建手机绑定失败:', error)
      return { data: null, error }
    }
  }

  // 创建通话记录
  static async createCallLog(phoneNumber: string, qrCodeId: string) {
    try {
      // 输入验证
      if (!phoneNumber || !qrCodeId) {
        throw new Error('手机号码和QR码ID不能为空')
      }

      if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
        throw new Error('手机号码格式不正确')
      }

      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          phone_number: phoneNumber,
          qr_code_id: qrCodeId,
          call_status: 'initiated'
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('创建通话记录失败:', error)
      return { data: null, error }
    }
  }
}

// 错误处理工具
export class ErrorHandler {
  static handleDatabaseError(error: any): string {
    if (error.code === '23505') {
      return '数据已存在，请检查输入信息'
    }
    
    if (error.code === '23503') {
      return '关联数据不存在，请检查QR码'
    }
    
    if (error.message?.includes('permission denied')) {
      return '权限不足，无法执行此操作'
    }
    
    if (error.message?.includes('row-level security')) {
      return '访问被拒绝，请检查权限'
    }
    
    return '操作失败，请稍后重试'
  }
}
