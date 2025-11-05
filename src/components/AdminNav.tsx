import { useNavigate, useLocation } from 'react-router-dom'
import { QrCode, LogOut } from 'lucide-react'
import { sessionManager } from '../utils/sessionManager'

interface AdminNavProps {
  currentPage?: string
  currentTab?: 'qr' | 'users'
}

export default function AdminNav({ currentPage, currentTab }: AdminNavProps) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    sessionManager.clearSession()
    navigate('/admin@7@/login')
  }

  const navItems = [
    {
      key: 'dashboard',
      label: '仪表板',
      path: '/admin@7@/dashboard'
    },
    {
      key: 'qr-manage',
      label: 'QR码管理',
      path: '/admin@7@/qrcodes'
    },
    {
      key: 'user-manage',
      label: '客户管理',
      path: '/admin@7@/users'
    },
    {
      key: 'calls',
      label: '通话记录',
      path: '/admin@7@/calls'
    }
  ]

  // 判断当前页面状态
  const getCurrentPage = () => {
    if (location.pathname === '/admin@7@/dashboard') return 'dashboard'
    if (location.pathname === '/admin@7@/qrcodes') return 'qr-manage'
    if (location.pathname === '/admin@7@/users') return 'user-manage'
    if (location.pathname === '/admin@7@/calls') return 'calls'
    return currentPage || 'dashboard'
  }

  const activePage = getCurrentPage()

  return (
    <nav className="sticky top-0 z-50 bg-surface-near-black/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <QrCode className="w-6 h-6 text-primary-500" />
              <h1 className="text-xl font-semibold text-text-primary">
                管理后台
              </h1>
            </div>
            <div className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`transition-colors ${
                    activePage === item.key
                      ? 'text-primary-500 font-medium'
                      : 'text-text-secondary hover:text-primary-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost text-sm"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </nav>
  )
}