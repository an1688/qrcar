import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { QrCode, Edit, Plus, Search, RefreshCw, Download, Eye, X, CheckSquare, Square, Archive, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sessionManager } from '../utils/sessionManager'
import AdminNav from '../components/AdminNav'
import QRCode from 'qrcode'
import JSZip from 'jszip'

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

export default function QRManagePage() {
  const navigate = useNavigate()
  

  
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
  const [selectedQRs, setSelectedQRs] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [editingQR, setEditingQR] = useState<QRCodeData | null>(null)
  const [editForm, setEditForm] = useState({ code: '', secure_code: '', status: 'unassigned' })

  // 加载QR代码数据
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
        .limit(50000)  // 设置较大的限制确保加载所有数据

      if (error) {
        console.error('QR代码数据加载错误:', error)
        setQrError('QR代码数据加载失败: ' + error.message)
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
      console.error('QR代码数据加载异常:', err)
      setQrError('QR代码数据加载过程中发生错误: ' + err.message)
    } finally {
      setQrLoading(false)
    }
  }

  useEffect(() => {
    loadQRCodes()
  }, [])

  // 生成QR代码图像
  const generateQRCode = async (code: string, secureCode?: string) => {
    try {
      // 构成完整URL，扫描后可直接跳转到绑定页面
      const baseUrl = window.location.origin
      const identifier = secureCode || code
      const qrContent = `${baseUrl}/bind/${identifier}`
      
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
      console.error('QR代码生成失败:', error)
      return null
    }
  }

  // 处理复选框选择
  const handleSelectQR = (qrId: string) => {
    const newSelected = new Set(selectedQRs)
    if (newSelected.has(qrId)) {
      newSelected.delete(qrId)
    } else {
      newSelected.add(qrId)
    }
    setSelectedQRs(newSelected)
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedQRs.size === filteredQRCodes.length) {
      setSelectedQRs(new Set())
    } else {
      setSelectedQRs(new Set(filteredQRCodes.map(qr => qr.id)))
    }
  }

  // 批量下载选中的QR代码
  const handleBatchDownload = async () => {
    if (selectedQRs.size === 0) {
      alert('请先选择要下载的QR代码')
      return
    }

    setIsDownloading(true)
    try {
      const zip = new JSZip()
      const selectedQRData = filteredQRCodes.filter(qr => selectedQRs.has(qr.id))
      
      // 为每个选中的QR代码生成图像并添加到zip中
      for (const qr of selectedQRData) {
        const qrImageUrl = await generateQRCode(qr.code, qr.secure_code || undefined)
        if (qrImageUrl) {
          // base64图像转换为blob
          const response = await fetch(qrImageUrl)
          const blob = await response.blob()
          const filename = `qrcode-${qr.code}.png`
          zip.file(filename, blob)
        }
      }

      // 生成zip文件并下载
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcodes-${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(url)

      alert(`成功下载了 ${selectedQRData.length} 个QR代码！`)
      setSelectedQRs(new Set())
    } catch (error) {
      console.error('批量下载失败:', error)
      alert('批量下载失败，请重试')
    } finally {
      setIsDownloading(false)
    }
  }

  // 处理QR代码预览
  const handlePreviewQR = async (qr: QRCodeData) => {
    setPreviewQR(qr)
    const imageUrl = await generateQRCode(qr.code, qr.secure_code || undefined)
    setQrImageUrl(imageUrl || '')
  }

  // 处理QR代码编辑
  const handleEditQR = (qr: QRCodeData) => {
    setEditingQR(qr)
    setEditForm({
      code: qr.code,
      secure_code: qr.secure_code || '',
      status: qr.status
    })
  }

  // 保存编辑的QR代码
  const handleSaveEdit = async () => {
    if (!editingQR) return

    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({
          code: editForm.code,
          secure_code: editForm.secure_code || null,
          status: editForm.status
        })
        .eq('id', editingQR.id)

      if (error) {
        console.error('QR代码更新失败:', error)
        alert('更新失败: ' + error.message)
        return
      }

      alert('更新成功！')
      setEditingQR(null)
      setEditForm({ code: '', secure_code: '', status: 'unassigned' })
      await loadQRCodes()
    } catch (err: any) {
      console.error('QR代码更新异常:', err)
      alert('更新失败: ' + err.message)
    }
  }

  // 处理QR代码删除
  const handleDeleteQR = async (qr: QRCodeData) => {
    if (!confirm(`确定要删除QR代码 "${qr.code}"吗？此操作无法撤销。`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qr.id)

      if (error) {
        console.error('QR代码删除失败:', error)
        alert('删除失败: ' + error.message)
        return
      }

      alert('删除成功！')
      await loadQRCodes()
    } catch (err: any) {
      console.error('QR代码删除异常:', err)
      alert('删除失败: ' + err.message)
    }
  }

  // 过滤QR代码数据
  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.code.toLowerCase().includes(qrSearchTerm.toLowerCase()) ||
                         (qr.secure_code && qr.secure_code.toLowerCase().includes(qrSearchTerm.toLowerCase()))
    const matchesStatus = qrStatusFilter === 'all' || qr.status === qrStatusFilter
    return matchesSearch && matchesStatus
  })

  // 认证检查 - 如果未登录，重定向到登录页面
  if (!sessionManager.isLoggedIn()) {
    return <Navigate to="/admin@7@/login" replace />
  }

  return (
    <div className="min-h-screen bg-surface-near-black">
      {/* 管理后台导航栏 */}
      <AdminNav currentPage="qr-manage" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* 搜索和统计面板 */}
        <div className="bg-surface-near-black rounded-lg p-6 border border-white/10 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索QR代码或安全代码..."
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

        {/* QR代码列表 */}
        <div className="bg-surface-near-black rounded-lg border border-white/10">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">QR代码列表</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBatchDownload}
                  disabled={isDownloading || selectedQRs.size === 0}
                  className="btn btn-secondary"
                >
                  <Archive className="w-4 h-4" />
                  {isDownloading ? '下载中...' : `选择下载 (${selectedQRs.size})`}
                </button>
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  批量生成
                </button>
              </div>
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
                {qrSearchTerm ? '未找到匹配的QR代码' : '暂无QR代码数据'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-near-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 hover:text-text-primary transition-colors"
                      >
                        {selectedQRs.size === filteredQRCodes.length && filteredQRCodes.length > 0 ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        选择
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">QR代码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">安全代码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">连接用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">通话记录</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredQRCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-surface-near-black/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectQR(qr.id)}
                          className="flex items-center justify-center w-8 h-8 hover:bg-surface-near-black/50 rounded transition-colors"
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
                            onClick={() => handlePreviewQR(qr)}
                            className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-400 transition-colors cursor-pointer"
                            title="点击查看QR代码"
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
                            title="详细查看"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditQR(qr)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteQR(qr)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="删除"
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
      </div>

      {/* QR代码预览模态框 */}
      {previewQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewQR(null)}>
          <div className="bg-surface-near-black rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">QR代码详细信息</h3>
              <button onClick={() => setPreviewQR(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              {qrImageUrl ? (
                <div className="inline-block p-4 bg-white rounded-lg">
                  <img 
                    src={qrImageUrl} 
                    alt="QR代码" 
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
                <label className="text-sm text-text-secondary">QR代码</label>
                <p className="text-text-primary font-mono text-lg">{previewQR.code}</p>
              </div>
              {previewQR.secure_code && (
                <div>
                  <label className="text-sm text-text-secondary">安全代码</label>
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
                  QR代码下载
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR代码编辑模态框 */}
      {editingQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingQR(null)}>
          <div className="bg-surface-near-black rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">QR代码编辑</h3>
              <button onClick={() => setEditingQR(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  QR代码
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  placeholder="请输入QR代码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  安全代码
                </label>
                <input
                  type="text"
                  value={editForm.secure_code}
                  onChange={(e) => setEditForm({ ...editForm, secure_code: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                  placeholder="请输入安全代码（可选）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  状态
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-near-black border border-white/20 rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
                >
                  <option value="unassigned">未分配</option>
                  <option value="assigned">已分配</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingQR(null)}
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

      {/* 批量生成模态框 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBatchModal(false)}>
          <div className="bg-surface-near-black rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">QR代码批量生成</h3>
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
                  max="10000"
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  placeholder="请输入生成数量（1-10000）"
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
                  placeholder="请输入前缀标识符"
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
                    if (!count || count < 1 || count > 10000) {
                      alert('请输入有效的生成数量（1-10000）')
                      return
                    }
                    if (!batchPrefix.trim()) {
                      alert('请输入前缀标识符')
                      return
                    }

                    try {
                      // 验证前缀长度（确保前缀 + 6位数字不超过50个字符）
                      if (batchPrefix.length > 44) {
                        alert('前缀长度不能超过44个字符（前缀+6位数字总长度不能超过50个字符）')
                        return
                      }

                      const qrCodes = []
                      for (let i = 0; i < count; i++) {
                        // 生成6位随机数
                        const randomNumber = Math.floor(Math.random() * 900000 + 100000).toString()
                        const code = `${batchPrefix}${randomNumber}`
                        // 生成更短的secure_code，时间戳后6位 + 6位随机字符 = 12位
                        const timestamp = Date.now().toString().slice(-6)
                        const random = Math.random().toString(36).substr(2, 6).toUpperCase()
                        const secure_code = `${timestamp}${random}`
                        
                        qrCodes.push({
                          code,
                          secure_code,
                          status: 'unassigned'
                        })
                      }

                      const { error } = await supabase
                        .from('qr_codes')
                        .insert(qrCodes)

                      if (error) {
                        console.error('批量生成错误:', error)
                        alert('批量生成失败: ' + error.message)
                      } else {
                        setShowBatchModal(false)
                        setBatchCount('')
                        setBatchPrefix('QR')
                        await loadQRCodes()
                        alert(`成功生成了 ${count} 个QR代码！`)
                      }
                    } catch (err: any) {
                      console.error('批量生成异常:', err)
                      alert('批量生成过程中发生错误: ' + err.message)
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
    </div>
  )
}