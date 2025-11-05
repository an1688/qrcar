import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Users, Phone, Edit, Trash2, Search, RefreshCw, QrCode, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sessionManager } from '../utils/sessionManager'
import AdminNav from '../components/AdminNav'

interface UserData {
  id: string
  phone1: string
  phone2: string | null
  bound_at: string
  updated_at: string
  deleted_at: string | null
  management_password: string
  qr_code: {
    id: string
    code: string
    secure_code: string | null
    status: string
  }
}

export default function UserManagePage() {
  const navigate = useNavigate()
  
  // 认证检查 - 如果未登录，重定向到登录页面
  if (!sessionManager.isLoggedIn()) {
    return <Navigate to="/admin@7@/login" replace />
  }
  
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
  const [editForm, setEditForm] = useState({
    phone1: '',
    phone2: '',
    management_password: ''
  })
  const [showUserPreview, setShowUserPreview] = useState(false)
  const [previewUserQR, setPreviewUserQR] = useState<any>(null)

  // 用户数据加载
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
          management_password,
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
        console.error('用户数据加载错误:', error)
        setUserError('用户数据加载失败: ' + error.message)
        return
      }

      // 数据处理，检查qr_code是否为单一对象
      const processedData = data?.map(user => ({
        ...user,
        qr_code: Array.isArray(user.qr_code) ? user.qr_code[0] : user.qr_code
      })) || []

      setUsers(processedData)

      // 统计计算（包括已删除用户）
      const { data: allUsers } = await supabase
        .from('phone_bindings')
        .select('id, deleted_at, qr_code:qr_codes(status)')

      // 数据处理，检查qr_code是否为单一对象
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
      console.error('用户数据加载异常:', err)
      setUserError('用户数据加载时发生错误: ' + err.message)
    } finally {
      setUserLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // 保存编辑的用户信息
  const handleSaveEdit = async () => {
    if (!editUser) return

    try {
      const { error } = await supabase
        .from('phone_bindings')
        .update({
          phone1: editForm.phone1,
          phone2: editForm.phone2 || null,
          management_password: editForm.management_password,
          updated_at: new Date().toISOString()
        })
        .eq('id', editUser.id)

      if (error) {
        console.error('用户信息更新失败:', error)
        alert('更新失败: ' + error.message)
        return
      }

      alert('更新成功！')
      setEditUser(null)
      setEditForm({ phone1: '', phone2: '', management_password: '' })
      await loadUsers()
    } catch (err: any) {
        console.error('用户信息更新异常:', err)
      alert('更新失败: ' + err.message)
    }
  }

  // 用户数据过滤
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.phone1.includes(userSearchTerm) ||
                         (user.phone2 && user.phone2.includes(userSearchTerm)) ||
                         (user.qr_code?.code && user.qr_code.code.toLowerCase().includes(userSearchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-surface-near-black">
      {/* 管理后台导航栏 */}
      <AdminNav currentPage="user-manage" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* 搜索及统计面板 */}
        <div className="bg-surface-near-black rounded-lg p-6 border border-white/10 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索用户电话号码或QR码..."
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
                {userSearchTerm ? '未找到匹配的用户' : '无用户数据'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-near-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">用户ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">车牌号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">备用号码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">管理密码</th>
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
                        <span className="text-text-secondary font-mono">{user.management_password || '未设置'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setPreviewUserQR(user.qr_code)
                              setShowUserPreview(true)
                            }}
                            className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center hover:bg-primary-400 transition-colors cursor-pointer"
                            title="点击查看QR码详细信息"
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
                        {new Date(user.bound_at).toLocaleString('ko-KR')}
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
                                onClick={() => {
                                  setEditUser(user)
                                  setEditForm({
                                    phone1: user.phone1 || '',
                                    phone2: user.phone2 || '',
                                    management_password: user.management_password || ''
                                  })
                                }}
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
                                    alert('删除失败: ' + error.message)
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

      {/* 用户QR码预览模态框 */}
      {showUserPreview && previewUserQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUserPreview(false)}>
          <div className="bg-surface-near-black rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">用户QR码详细信息</h3>
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

      {/* 用户编辑模态框 */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditUser(null)}>
          <div className="bg-surface-near-black rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">编辑用户信息</h3>
              <button onClick={() => setEditUser(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  主电话号码
                </label>
                <input
                  type="tel"
                  value={editForm.phone1}
                  onChange={(e) => setEditForm({ ...editForm, phone1: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  placeholder="请输入主电话号码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  备用电话号码
                </label>
                <input
                  type="tel"
                  value={editForm.phone2}
                  onChange={(e) => setEditForm({ ...editForm, phone2: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  placeholder="输入备用电话号码（可选）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  管理密码
                </label>
                <input
                  type="text"
                  value={editForm.management_password}
                  onChange={(e) => setEditForm({ ...editForm, management_password: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  placeholder="请输入管理密码"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 px-4 py-2 bg-surface-near-black border border-white/20 text-text-primary rounded-lg hover:bg-surface-near-black/80 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
