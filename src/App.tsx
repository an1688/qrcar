import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CallPage from './pages/CallPage'
import BindPage from './pages/BindPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import QRManagePage from './pages/QRManagePage'
import UserManagePage from './pages/UserManagePage'
import CallLogsPage from './pages/CallLogsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call/:id" element={<CallPage />} />
        <Route path="/bind/:id" element={<BindPage />} />
        <Route path="/admin@7@" element={<AdminDashboardPage />} />
        <Route path="/admin@7@/login" element={<AdminLoginPage />} />
        <Route path="/admin@7@/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin@7@/qrcodes" element={<QRManagePage />} />
        <Route path="/admin@7@/users" element={<UserManagePage />} />
        <Route path="/admin@7@/calls" element={<CallLogsPage />} />
      </Routes>
    </Router>
  )
}

export default App
