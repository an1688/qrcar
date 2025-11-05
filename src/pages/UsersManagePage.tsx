import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Phone, QrCode, Edit, Trash2, Plus, Search, RefreshCw, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

export default function UsersManagePage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    deleted: 0
  })
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewQR, setPreviewQR] = useState<any>(null)

  // 用户数据加载
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('phone_bindings')
        .select(`
          id,
          phone1,
          phone2,
          bound_at,
          updated_at,
          deleted_at,
          qr_code:qr_codes (
            id,
            code,
            secure_code,
            status
          )
        `)
        .order('bound_at', { ascending: false })

      if (error) {
        console.error('数据库查询错误:', error)
        setError('用户数据加载失败: ' + error.message)
        return
      }

      // 数据处理，检查qr_code是否为单个对象而非数组
      const processedData = data?.map(user => ({
        ...user,
        qr_code: Array.isArray(user.qr_code) ? user.qr_code[0] : user.qr_code
      })) || []
      
      setUsers(processedData)
      
      // 统计数据计算
      const total = processedData.length
      const active = processedData.filter((user: any) => user.qr_code?.status === 'assigned' && !user.deleted_at).length || 0
      const inactive = processedData.filter((user: any) => user.qr_code?.status !== 'assigned' && !user.deleted_at).length || 0
      const deleted = processedData.filter((user: any) => user.deleted_at).length || 0
      
      setStats({ total, active, inactive, deleted })

    } catch (err: any) {
      console.error('用户数据加载异常:', err)
      setError('用户数据加载时发生错误: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 用户删除（软删除）
  const deleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户绑定吗？此操作不可撤销。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('phone_bindings')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('用户删除错误:', error)
        alert('删除失败: ' + error.message)
        return
      }

      // 重新加载数据
      await loadUsers()
      alert('用户删除成功！')

    } catch (err: any) {
      console.error('用户删除异常:', err)
      alert('删除失败: ' + err.message)
    }
  }

  // 编辑用户
  const editUserData = (user: UserData) => {
    setEditUser({ ...user })
  }

  // QR码预览
  const previewQRCode = (qrCode: any) => {
    setPreviewQR(qrCode)
    setShowPreview(true)
  }

  // 生成QR码图片URL - 指向访客电话页面
  const generateQRCodeImage = (qrCode: any) => {
    // 生成完整通话URL，访客扫码后直接拨打
    const baseUrl = window.location.origin
    const callUrl = `${baseUrl}/call/${qrCode.secure_code || qrCode.code}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(callUrl)}`
  }

  // 保存用户编辑
  const saveUserEdit = async () => {
    if (!editUser) return

    try {
      const { error } = await supabase
        .from('phone_bindings')
        .update({
          phone1: editUser.phone1,
          phone2: editUser.phone2,
          updated_at: new Date().toISOString()
        })
        .eq('id', editUser.id)

      if (error) {
        console.error('用户更新错误:', error)
        alert('更新失败: ' + error.message)
        return
      }

      setEditUser(null)
      await loadUsers()
      alert('用户更新成功！')

    } catch (err: any) {
      console.error('用户更新异常:', err)
      alert('更新失败: ' + err.message)
    }
  }

  // 搜索过滤
  const filteredUsers = users.filter(user => 
    user.phone1.includes(searchTerm) ||
    user.phone2?.includes(searchTerm) ||
    user.qr_code?.code.includes(searchTerm) ||
    user.qr_code?.secure_code?.includes(searchTerm)
  )

  useEffect(() => {
    loadUsers()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in')
    navigate('/admin@7@/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-near-black flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="text-text-primary">用户数据加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-near-black">
      {/* 顶部导航栏 */}
      <nav className="bg-surface-light-gray border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-text-primary">管理后台</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin@7@/dashboard')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                返回仪表板
              </button>
              <button
                onClick={handleLogout}
                className="text-text-secondary hover:text-red-400 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">用户管理</h2>
            <p className="text-text-secondary">管理系统中的所有用户绑定</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadUsers}
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

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="搜索电话号码或QR码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-light-gray border border-white/20 rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-surface-light-gray rounded-lg border border-white/10 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">
                {searchTerm ? '未找到匹配的用户' : '无用户数据'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-near-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">用户ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">主号码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">备用号码</th>
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
                            onClick={() => previewQRCode(user.qr_code)}
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
                                onClick={() => editUserData(user)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="编辑用户"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteUser(user.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="删除用户"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {user.deleted_at && (
                            <span className="text-text-secondary text-xs">已删除</span>
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

        {/* 统计信息 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">总用户数</h3>
            <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">已绑定用户</h3>
            <p className="text-3xl font-bold text-green-500">{stats.active}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">未绑定用户</h3>
            <p className="text-3xl font-bold text-yellow-500">{stats.inactive}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">已删除用户</h3>
            <p className="text-3xl font-bold text-red-500">{stats.deleted}</p>
          </div>
        </div>
      </div>

      {/* QR码预览弹窗 */}
      {showPreview && previewQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light-gray rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">QR码详情</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <img 
                  src={generateQRCodeImage(previewQR)} 
                  alt={`二维码 ${previewQR.code}`}
                  className="mx-auto border border-white/20 rounded"
                />
                <p className="text-sm text-text-secondary mt-2">
                  访客可以扫描此QR码直接致电车主
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">QR码:</span>
                  <span className="text-text-primary font-mono">{previewQR.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">安全代码:</span>
                  <span className="text-text-primary font-mono">{previewQR.secure_code || '未设置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">状态:</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    previewQR.status === 'assigned' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {previewQR.status === 'assigned' ? '已分配' : '未分配'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户弹窗 */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light-gray rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">编辑用户</h3>
              <button 
                onClick={() => setEditUser(null)}
                className="text-text-secondary hover:text-text-primary"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">主手机号码</label>
                <input
                  type="text"
                  value={editUser.phone1}
                  onChange={(e) => setEditUser({...editUser, phone1: e.target.value})}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">备用手机号码</label>
                <input
                  type="text"
                  value={editUser.phone2 || ''}
                  onChange={(e) => setEditUser({...editUser, phone2: e.target.value})}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">QR码</label>
                <input
                  type="text"
                  value={editUser.qr_code?.code || ''}
                  disabled
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-md text-text-secondary"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveUserEdit}
                  className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 bg-surface-near-black text-text-primary py-2 px-4 rounded-md border border-white/20 hover:bg-surface-near-black/80 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}