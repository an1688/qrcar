// 调试版本 - 简化批量选择功能
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, Plus, Edit, Trash2, Search, RefreshCw, Download, Eye, X, CheckSquare, Square } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

export default function QRCodesManagePage() {
  const navigate = useNavigate()
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0
  })
  const [previewQR, setPreviewQR] = useState<QRCodeData | null>(null)
  const [editQR, setEditQR] = useState<QRCodeData | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchCount, setBatchCount] = useState('')
  const [batchPrefix, setBatchPrefix] = useState('QR')
  const [selectedQRs, setSelectedQRs] = useState<Set<string>>(new Set())
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)

  // 加载二维码数据
  const loadQRCodes = async () => {
    try {
      setLoading(true)
      setError('')

      // 首先获取真实的总数统计
      const { count: totalCount, error: countError } = await supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('总数统计错误:', countError)
        setError('获取二维码总数失败: ' + countError.message)
        return
      }

      // 获取已分配数量
      const { count: assignedCount, error: assignedError } = await supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'assigned')

      if (assignedError) {
        console.error('已分配数量统计错误:', assignedError)
      }

      // 获取二维码数据
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
        .limit(50000)

      if (error) {
        console.error('数据库查询错误:', error)
        setError('加载二维码数据失败: ' + error.message)
        return
      }

      // 处理数据，添加统计信息
      const processedData = data?.map(qr => ({
        ...qr,
        phone_bindings_count: qr.phone_bindings?.[0]?.count || 0,
        call_logs_count: qr.call_logs?.[0]?.count || 0
      })) || []

      setQrCodes(processedData)
      
      // 使用真实的数据库统计
      const total = totalCount || 0
      const assigned = assignedCount || 0
      const unassigned = total - assigned
      
      setStats({ total, assigned, unassigned })

    } catch (err: any) {
      console.error('加载二维码数据异常:', err)
      setError('加载二维码数据时发生错误: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 批量删除二维码
  const batchDeleteQRCodes = async () => {
    if (selectedQRs.size === 0) {
      alert('请先选择要删除的二维码')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedQRs.size} 个二维码吗？此操作不可撤销。`)) {
      return
    }

    try {
      const qrIds = Array.from(selectedQRs)
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .in('id', qrIds)

      if (error) {
        console.error('批量删除错误:', error)
        alert('删除失败: ' + error.message)
        return
      }

      setSelectedQRs(new Set())
      setShowBatchDeleteModal(false)
      await loadQRCodes()
      alert(`成功删除 ${qrIds.length} 个二维码！`)

    } catch (err: any) {
      console.error('批量删除异常:', err)
      alert('删除失败: ' + err.message)
    }
  }

  // 调试函数 - 强制显示删除按钮
  const forceShowDeleteButton = () => {
    console.log('Selected QRs:', selectedQRs)
    console.log('Selected QRs size:', selectedQRs.size)
    alert(`当前选中数量: ${selectedQRs.size}`)
  }

  // 选择/取消选择单个二维码
  const toggleQRSelection = (qrId: string) => {
    console.log('Toggle QR selection:', qrId)
    const newSelected = new Set(selectedQRs)
    if (newSelected.has(qrId)) {
      newSelected.delete(qrId)
    } else {
      newSelected.add(qrId)
    }
    console.log('New selected set:', newSelected)
    setSelectedQRs(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    console.log('Toggle select all')
    if (selectedQRs.size === filteredQRCodes.length) {
      setSelectedQRs(new Set())
    } else {
      setSelectedQRs(new Set(filteredQRCodes.map(qr => qr.id)))
    }
  }

  // 搜索和筛选过滤
  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.code.includes(searchTerm) || 
                         qr.secure_code?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || qr.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    loadQRCodes()
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
          <span className="text-text-primary">加载二维码数据中...</span>
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
            <h1 className="text-xl font-semibold text-text-primary">二维码停车联系牌系统 - 管理后台</h1>
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
        {/* 搜索和筛选栏 - 移到顶部 */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="搜索二维码代码或安全代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-light-gray border border-white/20 rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-surface-light-gray border border-white/20 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="assigned">已分配</option>
            <option value="unassigned">未分配</option>
          </select>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">二维码管理</h2>
            <p className="text-text-secondary">管理系统中的所有二维码</p>
            <p className="text-red-400 text-sm mt-2">调试信息: 当前选中 {selectedQRs.size} 个二维码</p>
          </div>
          <div className="flex items-center gap-4">
            {/* 批量删除按钮 - 始终显示红色 */}
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors ${
                selectedQRs.size > 0 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-red-400 hover:bg-red-500'
              }`}
              title={selectedQRs.size > 0 ? `删除选中的 ${selectedQRs.size} 个二维码` : '请先选择要删除的二维码'}
            >
              <Trash2 className="w-4 h-4" />
              批量删除 ({selectedQRs.size})
            </button>
            
            <button
              onClick={exportQRCodes}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            
            {/* 调试按钮 */}
            <button
              onClick={forceShowDeleteButton}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
            >
              <span>调试 ({selectedQRs.size})</span>
            </button>
            
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              批量生成
            </button>
            <button
              onClick={loadQRCodes}
              className="flex items-center gap-2 px-4 py-2 bg-surface-light-gray border border-white/20 text-text-primary rounded-md transition-colors"
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

        {/* 二维码列表 */}
        <div className="bg-surface-light-gray rounded-lg border border-white/10 overflow-hidden">
          {filteredQRCodes.length === 0 ? (
            <div className="p-8 text-center">
              <QrCode className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">
                {searchTerm || statusFilter !== 'all' ? '没有找到匹配的二维码' : '暂无二维码数据'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-near-black">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
                      >
                        {selectedQRs.size === filteredQRCodes.length && filteredQRCodes.length > 0 ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        全选
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">二维码代码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">安全代码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">绑定数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">通话记录</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredQRCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-surface-near-black/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleQRSelection(qr.id)}
                          className="flex items-center justify-center w-5 h-5 hover:bg-surface-near-black rounded transition-colors"
                          title={selectedQRs.has(qr.id) ? "取消选择" : "选择"}
                        >
                          {selectedQRs.has(qr.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary-500" />
                          ) : (
                            <Square className="w-4 h-4 text-text-secondary" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => previewQRCode(qr)}
                            className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center hover:bg-primary-400 transition-colors cursor-pointer"
                            title="点击查看二维码详情"
                          >
                            <QrCode className="w-4 h-4 text-white" />
                          </button>
                          <span className="text-text-primary font-mono text-sm">{qr.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-text-secondary font-mono text-sm">
                          {qr.secure_code || '未设置'}
                        </span>
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
                      <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                        {new Date(qr.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-text-primary font-medium">
                          {qr.phone_bindings_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-text-primary font-medium">
                          {qr.call_logs_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => editQRCode(qr)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="编辑二维码"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteQRCode(qr.id, qr.code)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="删除二维码"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* 统计信息 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">总二维码数</h3>
            <p className="text-3xl font-bold text-primary-500">{stats.total}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">已分配二维码</h3>
            <p className="text-3xl font-bold text-green-500">{stats.assigned}</p>
          </div>
          <div className="bg-surface-light-gray rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-text-primary mb-2">未分配二维码</h3>
            <p className="text-3xl font-bold text-yellow-500">{stats.unassigned}</p>
          </div>
        </div>
      </div>

      {/* 批量删除确认模态框 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light-gray rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">批量删除确认</h3>
              <button 
                onClick={() => setShowBatchDeleteModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-text-primary mb-2">
                  您确定要删除选中的 <span className="font-bold text-red-400">{selectedQRs.size}</span> 个二维码吗？
                </p>
                <p className="text-text-secondary text-sm">
                  此操作不可撤销，删除后将无法恢复。
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={batchDeleteQRCodes}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                >
                  确认删除
                </button>
                <button
                  onClick={() => setShowBatchDeleteModal(false)}
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

// 辅助函数
const exportQRCodes = () => {
  alert('导出功能暂未实现')
}

const previewQRCode = (qr: QRCodeData) => {
  alert(`预览二维码: ${qr.code}`)
}

const editQRCode = (qr: QRCodeData) => {
  alert(`编辑二维码: ${qr.code}`)
}

const deleteQRCode = async (qrId: string, qrCode: string) => {
  if (!confirm(`确定要删除二维码 "${qrCode}" 吗？此操作不可撤销。`)) {
    return
  }
  alert('删除功能暂未实现')
}