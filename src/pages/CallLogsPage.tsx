import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Phone, Clock, QrCode, PhoneCall, Search, RefreshCw, Filter, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sessionManager } from '../utils/sessionManager'
import AdminNav from '../components/AdminNav'

interface CallLogData {
  id: string
  phone_number: string
  called_at: string
  ip_address: string | null
  qr_code: {
    id: string
    code: string
    secure_code: string | null
  }
}

export default function CallLogsPage() {
  const navigate = useNavigate()
  
  // 认证检查 - 如果未登录，重定向到登录页面
  if (!sessionManager.isLoggedIn()) {
    return <Navigate to="/admin@7@/login" replace />
  }
  
  const [callLogs, setCallLogs] = useState<CallLogData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })

  // 加载通话记录数据
  const loadCallLogs = async () => {
    try {
      setLoading(true)
      setError('')

      // 计算日期过滤条件
      let dateCondition = ''
      const now = new Date()
      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateCondition = `called_at.gte.${today.toISOString()}`
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateCondition = `called_at.gte.${weekAgo.toISOString()}`
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateCondition = `called_at.gte.${monthAgo.toISOString()}`
      }

      // 构建查询
      let query = supabase
        .from('call_logs')
        .select(`
          id,
          phone_number,
          called_at,
          ip_address,
          qr_code:qr_codes (
            id,
            code,
            secure_code
          )
        `, { count: 'exact' })
        .order('called_at', { ascending: false })

      // 添加日期过滤
      if (dateCondition) {
        query = query.gte('called_at', dateCondition.split('.')[2])
      }

      // 添加分页
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('数据库查询错误:', error)
        setError('通话记录加载失败: ' + error.message)
        return
      }

      // 处理数据，确保qr_code是单个对象而不是数组
      const processedData = data?.map(log => ({
        ...log,
        qr_code: Array.isArray(log.qr_code) ? log.qr_code[0] : log.qr_code
      })) || []
      
      setCallLogs(processedData)
      setTotalCount(count || 0)

      // 计算统计数据
      await calculateStats()

    } catch (err: any) {
      console.error('通话记录加载异常:', err)
      setError('通话记录加载时发生错误: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 计算统计数据
  const calculateStats = async () => {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('call_logs').select('id', { count: 'exact', head: true }),
        supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('called_at', today.toISOString()),
        supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('called_at', weekAgo.toISOString()),
        supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('called_at', monthAgo.toISOString())
      ])

      setStats({
        total: totalResult.count || 0,
        today: todayResult.count || 0,
        thisWeek: weekResult.count || 0,
        thisMonth: monthResult.count || 0
      })
    } catch (err) {
      console.error('统计数据计算失败:', err)
    }
  }

  // 导出通话记录
  const exportCallLogs = () => {
    const csvContent = [
      ['ID', '通话时间', '呼叫号码', 'IP地址', 'QR码', '安全码'],
      ...filteredCallLogs.map(log => [
        log.id,
        new Date(log.called_at).toLocaleString('ko-KR'),
        log.phone_number,
        log.ip_address || '',
        log.qr_code?.code || '',
        log.qr_code?.secure_code || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `call_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 搜索过滤
  const filteredCallLogs = callLogs.filter(log => 
    log.phone_number.includes(searchTerm) ||
    log.qr_code?.code.includes(searchTerm) ||
    log.qr_code?.secure_code?.includes(searchTerm)
  )

  // 总页数
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  useEffect(() => {
    loadCallLogs()
  }, [currentPage, dateFilter])



  if (loading && callLogs.length === 0) {
    return (
      <div className="min-h-screen bg-surface-near-black flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="text-text-primary">通话记录加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-near-black">
      {/* 管理后台导航栏 */}
      <AdminNav currentPage="calls" />

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={exportCallLogs}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={() => {
                setCurrentPage(1)
                loadCallLogs()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 搜索和筛选栏 */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="搜索手机号码或QR码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-light-gray border border-white/20 rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-surface-light-gray border border-white/20 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">最近1周</option>
            <option value="month">最近1个月</option>
          </select>
        </div>

        {/* 通话记录列表 */}
        <div className="bg-surface-light-gray rounded-lg border border-white/10 overflow-hidden">
          {filteredCallLogs.length === 0 ? (
            <div className="p-8 text-center">
              <PhoneCall className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">
                {searchTerm || dateFilter !== 'all' ? '未找到匹配的通话记录' : '无通话记录'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-near-black">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">通话时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">呼叫号码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">关联QR码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">IP地址</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredCallLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-near-black/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <PhoneCall className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-text-primary font-medium">
                                {new Date(log.called_at).toLocaleDateString('ko-KR')}
                              </div>
                              <div className="text-text-secondary text-sm">
                                {new Date(log.called_at).toLocaleTimeString('ko-KR')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-text-secondary" />
                            <span className="text-text-primary font-medium">{log.phone_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-text-secondary" />
                            <div>
                              <div className="text-text-primary font-mono text-sm">{log.qr_code?.code || 'N/A'}</div>
                              {log.qr_code?.secure_code && (
                                <div className="text-text-secondary text-xs font-mono">{log.qr_code.secure_code}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-text-secondary font-mono text-sm">
                            {log.ip_address || '未知'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-surface-near-black border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-text-secondary text-sm">
                      显示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} 条，共 {totalCount} 条记录
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-surface-light-gray border border-white/20 rounded text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-near-black transition-colors"
                      >
                        上一页
                      </button>
                      <span className="text-text-secondary text-sm">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-surface-light-gray border border-white/20 rounded text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-near-black transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">总通话数</h3>
            <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">今日通话</h3>
            <p className="text-3xl font-bold text-green-500">{stats.today}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">本周通话</h3>
            <p className="text-3xl font-bold text-purple-500">{stats.thisWeek}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">本月通话</h3>
            <p className="text-3xl font-bold text-orange-500">{stats.thisMonth}</p>
          </div>
        </div>
      </div>
    </div>
  )
}