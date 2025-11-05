import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { QrCode, Users, Phone, BarChart3, RefreshCw, TrendingUp, TrendingDown, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sessionManager } from '../utils/sessionManager'
import AdminNav from '../components/AdminNav'

interface DashboardStats {
  // 二维码统计
  totalQRCodes: number
  assignedQRCodes: number
  unassignedQRCodes: number
  
  // 用户统计
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  
  // 通话统计
  totalCalls: number
  todayCalls: number
  weekCalls: number
  monthCalls: number
  
  // 增长趋势
  callGrowthRate: number
  userGrowthRate: number
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  
  // 认证检查 - 如果未登录，重定向到登录页面
  if (!sessionManager.isLoggedIn()) {
    return <Navigate to="/admin@7@/login" replace />
  }

  // 登出功能
  const handleLogout = () => {
    sessionManager.clearSession()
    navigate('/admin@7@/login')
  }
  
  const [stats, setStats] = useState<DashboardStats>({
    totalQRCodes: 0,
    assignedQRCodes: 0,
    unassignedQRCodes: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalCalls: 0,
    todayCalls: 0,
    weekCalls: 0,
    monthCalls: 0,
    callGrowthRate: 0,
    userGrowthRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const menuItems = [
    {
      icon: QrCode,
      title: 'QR码管理',
      description: '停车场QR码管理',
      path: '/admin@7@/qrcodes',
      color: 'bg-blue-500',
      count: stats.totalQRCodes
    },
    {
      icon: Users,
      title: '客户管理',
      description: '系统用户管理',
      path: '/admin@7@/users',
      color: 'bg-green-500',
      count: stats.totalUsers
    },
    {
      icon: Phone,
      title: '通话记录',
      description: '查看通话记录',
      path: '/admin@7@/calls',
      color: 'bg-purple-500',
      count: stats.totalCalls
    }
  ]

  // 加载统计数据
  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      setError('')

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // 并行查询所有统计数据
      const [
        qrCodesResult,
        usersResult,
        callsResult,
        todayCallsResult,
        weekCallsResult,
        monthCallsResult,
        yesterdayCallsResult
      ] = await Promise.all([
        // 二维码统计
        supabase.from('qr_codes').select('status', { count: 'exact', head: true }),
        
        // 用户统计
        supabase.from('phone_bindings').select('id', { count: 'exact', head: true }),
        
        // 总通话数
        supabase.from('call_logs').select('id', { count: 'exact', head: true }),
        
        // 今日通话
        supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('called_at', today.toISOString()),
        
        // 本周通话
        supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('called_at', weekAgo.toISOString()),
        
        // 本月通话
        supabase.from('call_logs').select('id', { count: 'exact', head: true }).gte('called_at', monthAgo.toISOString()),
        
        // 昨日通话（用于计算增长率）
        supabase.from('call_logs').select('id', { count: 'exact', head: true })
          .gte('called_at', yesterday.toISOString())
          .lt('called_at', today.toISOString())
      ])

      // 获取已分配和未分配二维码数量
      const { data: qrCodesData } = await supabase
        .from('qr_codes')
        .select('status')

      const assignedQRCodes = qrCodesData?.filter(qr => qr.status === 'assigned').length || 0
      const totalQRCodes = qrCodesData?.length || 0
      const unassignedQRCodes = totalQRCodes - assignedQRCodes

      // 计算用户状态
      const { data: usersData } = await supabase
        .from('phone_bindings')
        .select('qr_code:qr_codes(status)')

      const activeUsers = usersData?.filter((user: any) => user.qr_code?.status === 'assigned').length || 0
      const totalUsers = usersData?.length || 0
      const inactiveUsers = totalUsers - activeUsers

      // 计算增长率
      const todayCalls = todayCallsResult.count || 0
      const yesterdayCalls = yesterdayCallsResult.count || 0
      const callGrowthRate = yesterdayCalls > 0 
        ? Math.round(((todayCalls - yesterdayCalls) / yesterdayCalls) * 100)
        : todayCalls > 0 ? 100 : 0

      const userGrowthRate = 0 // 用户增长率计算需要更复杂的历史数据

      setStats({
        totalQRCodes,
        assignedQRCodes,
        unassignedQRCodes,
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalCalls: callsResult.count || 0,
        todayCalls,
        weekCalls: weekCallsResult.count || 0,
        monthCalls: monthCallsResult.count || 0,
        callGrowthRate,
        userGrowthRate
      })

      setLastUpdated(new Date())

    } catch (err: any) {
      console.error('统计数据加载错误:', err)
      setError('加载统计数据时发生错误: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 自动刷新（每5分钟）
  useEffect(() => {
    loadDashboardStats()
    
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])



  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN')
  }

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? TrendingUp : TrendingDown
  }

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-500' : 'text-red-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-near-black flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="text-text-primary">正在加载统计数据...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-near-black">
      {/* 管理后台导航栏 */}
      <AdminNav currentPage="dashboard" />

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                className="bg-surface-light-gray rounded-lg p-6 border border-white/10 hover:border-primary-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                    {item.count !== null && (
                      <p className="text-2xl font-bold text-text-primary">{formatNumber(item.count)}</p>
                    )}
                  </div>
                </div>
                <p className="text-text-secondary text-sm">{item.description}</p>
              </div>
            )
          })}
        </div>

        {/* 核心统计指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-text-primary">总QR码</h3>
              <QrCode className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-500 mb-1">{formatNumber(stats.totalQRCodes)}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-500">已分配: {formatNumber(stats.assignedQRCodes)}</span>
              <span className="text-yellow-500">未分配: {formatNumber(stats.unassignedQRCodes)}</span>
            </div>
          </div>

          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-text-primary">总用户</h3>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-500 mb-1">{formatNumber(stats.totalUsers)}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-500">活跃: {formatNumber(stats.activeUsers)}</span>
              <span className="text-red-500">非活跃: {formatNumber(stats.inactiveUsers)}</span>
            </div>
          </div>

          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-text-primary">总通话</h3>
              <Phone className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-500 mb-1">{formatNumber(stats.totalCalls)}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">今日: {formatNumber(stats.todayCalls)}</span>
              {(() => {
                const GrowthIcon = getGrowthIcon(stats.callGrowthRate)
                return (
                  <div className={`flex items-center gap-1 ${getGrowthColor(stats.callGrowthRate)}`}>
                    <GrowthIcon className="w-4 h-4" />
                    <span>{Math.abs(stats.callGrowthRate)}%</span>
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-text-primary">使用率</h3>
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-500 mb-1">
              {stats.totalQRCodes > 0 ? Math.round((stats.assignedQRCodes / stats.totalQRCodes) * 100) : 0}%
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-text-secondary">QR码使用率</span>
            </div>
          </div>
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-4">通话统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">今日通话</span>
                <span className="text-text-primary font-medium">{formatNumber(stats.todayCalls)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">本周通话</span>
                <span className="text-text-primary font-medium">{formatNumber(stats.weekCalls)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">本月通话</span>
                <span className="text-text-primary font-medium">{formatNumber(stats.monthCalls)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-4">系统状态</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">系统运行</span>
                <span className="text-green-500 font-medium">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">数据库连接</span>
                <span className="text-green-500 font-medium">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">最后更新</span>
                <span className="text-text-primary font-medium">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('zh-CN') : '未知'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-4">快速操作</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin@7@/qrcodes')}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-near-black rounded transition-colors"
              >
                创建新QR码
              </button>
              <button
                onClick={() => navigate('/admin@7@/users')}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-near-black rounded transition-colors"
              >
                查看用户列表
              </button>
              <button
                onClick={() => navigate('/admin@7@/calls')}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-near-black rounded transition-colors"
              >
                导出通话记录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}