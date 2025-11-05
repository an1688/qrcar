import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { QrCode, Users, Phone, Edit, Trash2, Plus, Search, RefreshCw, Download, Eye, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AdminNav from '../components/AdminNav'
import QRCode from 'qrcode'

interface QRCodeData {
  id: string
  code: string
  status: string
  secure_code: string | null
  created_at: string
  updated_at: string
  phone_bindings_count?: number
  call_logs_count?: number
}

interface UserData {
  id: string
  phone1: string
  phone2: string | null
  bound_at: string
  updated_at: string
  deleted_at: string | null
  qr_code: {
    id: string
    code: string
    secure_code: string | null
    status: string
  }
}

export default function UnifiedManagePage() {
  const navigate = useNavigate()
  
  // 认证检查
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      navigate('/admin@7@/login')
      return
    }
  }, [navigate])
  
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab') as 'qr' | 'users' | null
  const [activeTab, setActiveTab] = useState<'qr' | 'users'>(urlTab || 'qr')
  
  // 二维码管理状态
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState('')
  const [qrSearchTerm, setQrSearchTerm] = useState('')
  const [qrStatusFilter, setQrStatusFilter] = useState('all')
  const [qrStats, setQrStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0
  })
  const [previewQR, setPreviewQR] = useState<QRCodeData | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState<string>('')
  const [editQR, setEditQR] = useState<QRCodeData | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchCount, setBatchCount] = useState('')
  const [batchPrefix, setBatchPrefix] = useState('QR')

  // 用户管理状态
  const [users, setUsers] = useState<UserData[]>([])
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    deleted: 0
  })
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [showUserPreview, setShowUserPreview] = useState(false)
  const [previewUserQR, setPreviewUserQR] = useState<any>(null)

  // 加载二维码数据
  const loadQRCodes = async () => {
    try {
      setQrLoading(true)
      setQrError('')

      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          id,
          code,
          status,
          secure_code,
          created_at,
          updated_at,
          phone_bindings(count),
          call_logs(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('加载二维码数据错误:', error)
        setQrError('加载二维码数据失败: ' + error.message)
        return
      }

      const qrCodeData = data?.map(qr => ({
        ...qr,
        phone_bindings_count: qr.phone_bindings?.[0]?.count || 0,
        call_logs_count: qr.call_logs?.[0]?.count || 0
      })) || []

      setQrCodes(qrCodeData)

      // 计算统计
      const total = qrCodeData.length
      const assigned = qrCodeData.filter(qr => qr.status === 'assigned').length
      const unassigned = total - assigned

      setQrStats({ total, assigned, unassigned })

    } catch (err: any) {
      console.error('加载二维码数据异常:', err)
      setQrError('加载二维码数据时发生错误: ' + err.message)
    } finally {
      setQrLoading(false)
    }
  }

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setUserLoading(true)
      setUserError('')

      const { data, error } = await supabase
        .from('phone_bindings')
        .select(`
          id,
          phone1,
          phone2,
          bound_at,
          updated_at,
          deleted_at,
          qr_code:qr_codes(
            id,
            code,
            secure_code,
            status
          )
        `)
        .is('deleted_at', null)
        .order('bound_at', { ascending: false })

      if (error) {
        console.error('加载用户数据错误:', error)
        setUserError('加载用户数据失败: ' + error.message)
        return
      }

      // 处理数据，确保qr_code是单个对象
      const processedData = data?.map(user => ({
        ...user,
        qr_code: Array.isArray(user.qr_code) ? user.qr_code[0] : user.qr_code
      })) || []

      setUsers(processedData)

      // 计算统计（包含已删除用户）
      const { data: allUsers } = await supabase
        .from('phone_bindings')
        .select('id, deleted_at, qr_code:qr_codes(status)')

      // 处理数据，确保qr_code是单个对象
      const processedAllUsers = allUsers?.map(user => ({
        ...user,
        qr_code: Array.isArray(user.qr_code) ? user.qr_code[0] : user.qr_code
      })) || []

      const total = processedAllUsers.length
      const active = processedAllUsers.filter(u => !u.deleted_at).length
      const deleted = processedAllUsers.filter(u => u.deleted_at).length
      const inactive = processedAllUsers.filter(u => !u.deleted_at && u.qr_code?.status !== 'assigned').length

      setUserStats({ total, active, inactive, deleted })

    } catch (err: any) {
      console.error('加载用户数据异常:', err)
      setUserError('加载用户数据时发生错误: ' + err.message)
    } finally {
      setUserLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'qr') {
      loadQRCodes()
    } else {
      loadUsers()
    }
  }, [activeTab])

  // 切换选项卡时加载对应数据
  const handleTabChange = (tab: 'qr' | 'users') => {
    setActiveTab(tab)
    // 更新URL参数，但不触发页面重新加载
    const newUrl = `${window.location.pathname}?tab=${tab}`
    window.history.replaceState({}, '', newUrl)
  }

  // 筛选二维码数据
  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.code.toLowerCase().includes(qrSearchTerm.toLowerCase()) ||
                         (qr.secure_code && qr.secure_code.toLowerCase().includes(qrSearchTerm.toLowerCase()))
    const matchesStatus = qrStatusFilter === 'all' || qr.status === qrStatusFilter
    return matchesSearch && matchesStatus
  })

  // 筛选用户数据
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.phone1.includes(userSearchTerm) ||
                         (user.phone2 && user.phone2.includes(userSearchTerm)) ||
                         (user.qr_code?.code && user.qr_code.code.toLowerCase().includes(userSearchTerm.toLowerCase()))
    return matchesSearch
  })

  // 生成二维码图片
  const generateQRCode = async (code: string, secureCode?: string) => {
    try {
      // 构建二维码内容，包含代码和安全码
      const qrContent = secureCode ? 
        `QR Parking System\nCode: ${code}\nSecure: ${secureCode}` : 
        `QR Parking System\nCode: ${code}`
      
      const qrDataUrl = await QRCode.toDataURL(qrContent, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      return qrDataUrl
    } catch (error) {
      console.error('生成二维码失败:', error)
      return null
    }
  }

  // 处理二维码预览
  const handlePreviewQR = async (qr: QRCodeData) => {
    setPreviewQR(qr)
    const imageUrl = await generateQRCode(qr.code, qr.secure_code || undefined)
    setQrImageUrl(imageUrl || '')
  }

  return (
    <div className="min-h-screen bg-surface-near-black">
      {/* 管理后台导航栏 */}
      <AdminNav currentPage="manage" currentTab={activeTab} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">统一管理</h1>
          <p className="text-text-secondary">QR码和用户信息管理</p>
        </div>

        {/* 选项卡导航 */}
        <div className="mb-8">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8">
              <button
                onClick={() => handleTabChange('qr')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'qr'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR码管理
                  <span className="bg-white/10 text-xs px-2 py-1 rounded-full">
                    {qrStats.total}
                  </span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  用户管理
                  <span className="bg-white/10 text-xs px-2 py-1 rounded-full">
                    {userStats.total}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 二维码管理选项卡内容 */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            {/* 搜索和统计面板 */}
            <div className="bg-surface-near-black rounded-lg p-6 border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                    <input
                      type="text"
                      placeholder="搜索QR码或安全码..."
                      value={qrSearchTerm}
                      onChange={(e) => setQrSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={qrStatusFilter}
                    onChange={(e) => setQrStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
                  >
                    <option value="all">全部状态</option>
                    <option value="unassigned">未分配</option>
                    <option value="assigned">已分配</option>
                  </select>
                  <button
                    onClick={loadQRCodes}
                    className="btn btn-ghost"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">总计</p>
                      <p className="text-2xl font-bold text-text-primary">{qrStats.total}</p>
                    </div>
                    <QrCode className="w-8 h-8 text-primary-500" />
                  </div>
                </div>
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">已分配</p>
                      <p className="text-2xl font-bold text-success-500">{qrStats.assigned}</p>
                    </div>
                    <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">未分配</p>
                      <p className="text-2xl font-bold text-warning-500">{qrStats.unassigned}</p>
                    </div>
                    <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 二维码列表 */}
            <div className="bg-surface-near-black rounded-lg border border-white/10">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">QR码列表</h2>
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    批量生成
                  </button>
                </div>
              </div>

              {qrLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary">加载中...</p>
                </div>
              ) : qrError ? (
                <div className="p-8 text-center">
                  <p className="text-error">{qrError}</p>
                </div>
              ) : filteredQRCodes.length === 0 ? (
                <div className="p-8 text-center">
                  <QrCode className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    {qrSearchTerm ? '找不到匹配的QR码' : '没有QR码数据'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-near-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">QR码</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">安全码</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">关联用户</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">通话记录</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">创建时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredQRCodes.map((qr) => (
                        <tr key={qr.id} className="hover:bg-surface-near-black/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handlePreviewQR(qr)}
                                className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-400 transition-colors cursor-pointer"
                                title="点击查看QR码"
                              >
                                <QrCode className="w-4 h-4 text-white" />
                              </button>
                              <span className="text-text-primary font-mono font-medium">{qr.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary font-mono text-sm">{qr.secure_code || '未设置'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              qr.status === 'assigned' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {qr.status === 'assigned' ? '已分配' : '未分配'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary">{qr.phone_bindings_count || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary">{qr.call_logs_count || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                            {new Date(qr.created_at).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handlePreviewQR(qr)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="查看详情"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditQR(qr)}
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 用户管理选项卡内容 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* 搜索和统计面板 */}
            <div className="bg-surface-near-black rounded-lg p-6 border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                    <input
                      type="text"
                      placeholder="搜索用户电话或QR码..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={loadUsers}
                    className="btn btn-ghost"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">总计</p>
                      <p className="text-2xl font-bold text-text-primary">{userStats.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary-500" />
                  </div>
                </div>
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">活跃用户</p>
                      <p className="text-2xl font-bold text-success-500">{userStats.active}</p>
                    </div>
                    <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">未绑定</p>
                      <p className="text-2xl font-bold text-warning-500">{userStats.inactive}</p>
                    </div>
                    <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-near-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">已删除</p>
                      <p className="text-2xl font-bold text-error">{userStats.deleted}</p>
                    </div>
                    <div className="w-8 h-8 bg-error rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">×</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 用户列表 */}
            <div className="bg-surface-near-black rounded-lg border border-white/10">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-text-primary">用户列表</h2>
              </div>

              {userLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary">加载中...</p>
                </div>
              ) : userError ? (
                <div className="p-8 text-center">
                  <p className="text-error">{userError}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    {userSearchTerm ? '找不到匹配的用户' : '没有用户数据'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-near-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">用户ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">主号码</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">副号码</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">关联QR码</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">绑定时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          className={`transition-colors ${
                            user.deleted_at 
                              ? 'bg-red-900/20 hover:bg-red-900/30 opacity-75' 
                              : 'hover:bg-surface-near-black/50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-text-primary font-medium">#{user.id.slice(-8)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-text-secondary" />
                              <span className="text-text-primary font-medium">{user.phone1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary">{user.phone2 || '未设置'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setPreviewUserQR(user.qr_code)
                                  setShowUserPreview(true)
                                }}
                                className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center hover:bg-primary-400 transition-colors cursor-pointer"
                                title="点击查看QR码详情"
                              >
                                <QrCode className="w-4 h-4 text-white" />
                              </button>
                              <div>
                                <div className="text-text-primary font-mono text-sm">{user.qr_code?.code || 'N/A'}</div>
                                {user.qr_code?.secure_code && (
                                  <div className="text-text-secondary text-xs font-mono">{user.qr_code.secure_code}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                            {new Date(user.bound_at).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.deleted_at
                                ? 'bg-red-100 text-red-800'
                                : user.qr_code?.status === 'assigned' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.deleted_at ? '已删除' : (user.qr_code?.status === 'assigned' ? '已绑定' : '未绑定')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {!user.deleted_at && (
                                <>
                                  <button 
                                    onClick={() => setEditUser({ ...user })}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                    title="编辑用户"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (!confirm('确定要删除此用户绑定吗？此操作无法撤销。')) return
                                      const { error } = await supabase
                                        .from('phone_bindings')
                                        .update({ 
                                          deleted_at: new Date().toISOString(),
                                          updated_at: new Date().toISOString()
                                        })
                                        .eq('id', user.id)
                                      if (error) {
                                        alert('删除失败：' + error.message)
                                      } else {
                                        await loadUsers()
                                        alert('用户删除成功！')
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                    title="删除用户"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {user.deleted_at && (
                                <span className="text-text-tertiary text-sm">已删除</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 二维码预览模态框 */}
        {previewQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewQR(null)}>
            <div className="bg-surface-near-black rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">QR码详情</h3>
                <button onClick={() => setPreviewQR(null)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                {qrImageUrl ? (
                  <div className="inline-block p-4 bg-white rounded-lg">
                    <img 
                      src={qrImageUrl} 
                      alt="QR码" 
                      className="w-48 h-48"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-text-secondary animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-text-secondary">QR码</label>
                  <p className="text-text-primary font-mono text-lg">{previewQR.code}</p>
                </div>
                {previewQR.secure_code && (
                  <div>
                    <label className="text-sm text-text-secondary">安全码</label>
                    <p className="text-text-primary font-mono text-lg">{previewQR.secure_code}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-text-secondary">状态</label>
                  <p className="text-text-primary">{previewQR.status === 'assigned' ? '已分配' : '未分配'}</p>
                </div>
                <div>
                  <label className="text-sm text-text-secondary">创建时间</label>
                  <p className="text-text-primary">{new Date(previewQR.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              
              {qrImageUrl && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrImageUrl
                      link.download = `qrcode-${previewQR.code}.png`
                      link.click()
                    }}
                    className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下载QR码
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 批量生成模态框 */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBatchModal(false)}>
            <div className="bg-surface-near-black rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">QR码批量生成</h3>
                <button onClick={() => setShowBatchModal(false)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    生成数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={batchCount}
                    onChange={(e) => setBatchCount(e.target.value)}
                    placeholder="输入生成数量 (1-100)"
                    className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    前缀标识符
                  </label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    placeholder="输入前缀标识符"
                    className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="flex-1 px-4 py-2 bg-surface-near-black border border-white/20 text-text-primary rounded-lg hover:bg-surface-near-black/80 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={async () => {
                      const count = parseInt(batchCount)
                      if (!count || count < 1 || count > 100) {
                        alert('请输入有效的生成数量 (1-100)')
                        return
                      }
                      if (!batchPrefix.trim()) {
                        alert('请输入前缀标识符')
                        return
                      }

                      try {
                        const qrCodes = []
                        for (let i = 0; i < count; i++) {
                          const code = `${batchPrefix}${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
                          const secureCode = Math.random().toString(36).substr(2, 8).toUpperCase()
                          
                          qrCodes.push({
                            code,
                            secure_code: secureCode,
                            status: 'unassigned'
                          })
                        }

                        const { error } = await supabase
                          .from('qr_codes')
                          .insert(qrCodes)

                        if (error) {
                          console.error('批量生成错误:', error)
                          alert('批量生成失败：' + error.message)
                        } else {
                          setShowBatchModal(false)
                          setBatchCount('')
                          setBatchPrefix('QR')
                          await loadQRCodes()
                          alert(`成功生成 ${count} 个QR码！`)
                        }
                      } catch (err: any) {
                        console.error('批量生成异常:', err)
                        alert('批量生成过程中发生错误：' + err.message)
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-colors"
                  >
                    生成
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户二维码预览模态框 */}
        {showUserPreview && previewUserQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUserPreview(false)}>
            <div className="bg-surface-near-black rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">用户二维码详情</h3>
                <button onClick={() => setShowUserPreview(false)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-text-secondary">QR码</label>
                  <p className="text-text-primary font-mono">{previewUserQR.code}</p>
                </div>
                {previewUserQR.secure_code && (
                  <div>
                    <label className="text-sm text-text-secondary">安全码</label>
                    <p className="text-text-primary font-mono">{previewUserQR.secure_code}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-text-secondary">状态</label>
                  <p className="text-text-primary">{previewUserQR.status === 'assigned' ? '已分配' : '未分配'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}