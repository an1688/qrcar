import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Phone, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { QRCode, PhoneBinding } from '../types'
import { useInputAudio } from '../hooks/useAudio'
import { usePageTitle } from '../hooks/usePageTitle'

export default function BindPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  usePageTitle('차주 설정')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [qrCode, setQRCode] = useState<QRCode | null>(null)
  const [existingBinding, setExistingBinding] = useState<PhoneBinding | null>(null)
  const [phone1, setPhone1] = useState(['0', '1', '0', '', '', '', '', '', '', '', ''])
  const [phone2, setPhone2] = useState(['', '', '', '', '', '', '', '', '', '', ''])
  const [managementPassword, setManagementPassword] = useState('')
  const [phone1Error, setPhone1Error] = useState('')
  const [phone2Error, setPhone2Error] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [focusedBox, setFocusedBox] = useState<{phone: string, index: number} | null>(null)
  const [glowBoxes, setGlowBoxes] = useState<Set<string>>(new Set())
  const [showSetup, setShowSetup] = useState(false)
  
  // 使用音效 Hook
  const { handleInput, handleDelete, handleFocus, handleEdit, handleSuccess } = useInputAudio()

  useEffect(() => {
    console.log('=== BindPage useEffect 触发 ===')
    console.log('id参数:', id)
    console.log('当前路径:', window.location.pathname)
    
    if (!id) {
      console.log('id为空，跳转到首页')
      navigate('/')
      return
    }
    
    console.log('调用loadData函数')
    loadData()
  }, [id])



  async function loadData() {
    console.log('=== loadData 函数开始执行 ===')
    try {
      setLoading(true)
      setError('')

      console.log('=== BindPage 调试信息 ===')
      console.log('当前路由参数 id:', id)
      console.log('当前URL:', window.location.href)

      // 检查是否是编辑模式（从设置按钮跳转过来）
      const urlParams = new URLSearchParams(location.search)
      const isEditMode = urlParams.get('mode') === 'edit'
      console.log('编辑模式:', isEditMode)

      // 处理二维码标识符 - 简化逻辑，直接使用id
      const identifier = id || ''
      console.log('处理的标识符:', identifier)

      // 演示模式处理 - 如果是demo123，直接进入演示模式
      if (identifier === 'demo123') {
        console.log('演示模式，模拟QR码数据')
        
        // 模拟QR码数据
        const mockQRCode = {
          id: 'demo',
          code: 'demo123',
          secure_code: 'demo123',
          status: 'unassigned' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('设置模拟QR码数据:', mockQRCode)
        setQRCode(mockQRCode)
        
        // 演示模式下直接显示设置界面 - 使用同步方式
        console.log('设置showSetup为true')
        setShowSetup(true)
        
        // 强制重新渲染
        setTimeout(() => {
          console.log('设置loading为false')
          setLoading(false)
        }, 100)
        
        console.log('演示模式设置完成')
        return
      }

      // 获取二维码信息 - 首先尝试通过secure_code查找，然后通过code查找
      console.log('尝试通过secure_code查找:', identifier)
      let { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('secure_code', identifier)
        .maybeSingle()

      console.log('secure_code查询结果:', qrData)
      console.log('secure_code查询错误:', qrError)

      // 如果通过secure_code没找到，尝试通过原始code查找（兼容旧URL）
      if (!qrData) {
        console.log('secure_code未找到，尝试通过code查找:', identifier)
        const { data: oldQrData, error: oldQrError } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('code', identifier)
          .maybeSingle()
        
        console.log('code查询结果:', oldQrData)
        console.log('code查询错误:', oldQrError)
        
        if (oldQrData && oldQrData.secure_code) {
          // 重定向到新的安全URL
          console.log('重定向到新的安全URL:', oldQrData.secure_code)
          navigate(`/bind/${oldQrData.secure_code}`, { replace: true })
          return
        }
        
        qrData = oldQrData
        qrError = oldQrError
      }

      if (qrError) {
        console.error('查询错误:', qrError)
        throw qrError
      }
      if (!qrData) {
        console.log('二维码不存在，id:', id)
        
        // 额外检查：看看是否有任何相似的二维码
        console.log('检查是否有任何相似的二维码...')
        const { data: similarQRs, error: similarError } = await supabase
          .from('qr_codes')
          .select('code, secure_code, status')
          .or(`code.ilike.%${id}%,secure_code.ilike.%${id}%`)
          .limit(5)
        
        console.log('相似的二维码:', similarQRs)
        console.log('相似查询错误:', similarError)
        
        setError(`QR코드가 존재하지 않습니다 (ID: ${id})`)
        return
      }

      console.log('找到二维码数据:', qrData)

      setQRCode(qrData)

      // 检查二维码状态 - 如果已分配且不是编辑模式，直接跳转到通话页面
      if (qrData.status === 'assigned' && !isEditMode) {
        console.log('二维码已分配，非编辑模式，跳转到通话页面')
        navigate(`/call/${identifier}`, { replace: true })
        return
      }

      // 如果是编辑模式或二维码未分配，继续处理绑定逻辑
      if (isEditMode) {
        console.log('编辑模式，加载现有绑定数据')
      } else {
        // 非编辑模式下，二维码未分配，显示中间页面（第一次扫码或未绑定状态）
        console.log('二维码未分配，显示中间页面')
      }

      // 检查是否已有绑定记录（可能是未分配状态的绑定）
      const { data: bindingData, error: bindingError } = await supabase
        .from('phone_bindings')
        .select('*')
        .eq('qr_code_id', qrData.id)
        .maybeSingle()

      if (bindingError) throw bindingError
      
      if (bindingData) {
        console.log('发现已有绑定记录，加载现有数据')
        setExistingBinding(bindingData)
        // 将字符串转换为数组格式
        const phone1Array = bindingData.phone1.replace(/\D/g, '').padEnd(11, '').split('')
        const phone2Array = (bindingData.phone2 || '').replace(/\D/g, '').padEnd(11, '').split('')
        setPhone1(phone1Array)
        setPhone2(phone2Array)
        setManagementPassword(bindingData.management_password || '')
        // 如果已有绑定或编辑模式，直接显示设置界面
        setShowSetup(true)
      } else {
        console.log('没有绑定记录，显示中间页面')
        // 重置为初始状态，显示中间页面
        setPhone1(['0', '1', '0', '', '', '', '', '', '', '', ''])
        setPhone2(['', '', '', '', '', '', '', '', '', '', ''])
        setManagementPassword('')
        setShowSetup(false)
      }

    } catch (err: any) {
      console.error('로딩 실패:', err)
      setError(err.message || '로딩 실패')
    } finally {
      setLoading(false)
    }
  }

  // 验证韩国手机号格式 (更宽松的验证)
  function validateKoreanPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    
    // 验证是否为11位数字
    if (cleaned.length !== 11) {
      return false
    }
    
    // 验证前3位是否为韩国手机号段
    const validPrefixes = ['010', '011', '016', '017', '018', '019']
    const prefix = cleaned.substring(0, 3)
    
    return validPrefixes.includes(prefix)
  }

  // 验证手机号码格式
  function validatePhone(phone: string): { valid: boolean; message: string } {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length !== 11) {
      return { valid: false, message: '11자리 번호를 모두 입력해주세요' }
    }

    if (validateKoreanPhone(phone)) {
      return { valid: true, message: '' }
    }

    return { valid: false, message: '한국 휴대폰 번호 형식: 010/011/016/017/018/019-XXXX-XXXX' }
  }

  // 处理单个数字框的输入
  const handleBoxInput = (phone: 'phone1' | 'phone2', index: number, value: string) => {
    if (value.length > 1) return // 限制只输入一个字符
    
    const phoneArray = phone === 'phone1' ? [...phone1] : [...phone2]
    phoneArray[index] = value.replace(/\D/g, '') // 只保留数字
    
    if (phone === 'phone1') {
      setPhone1(phoneArray)
      // 播放输入音效
      if (value) handleInput()
    } else {
      setPhone2(phoneArray)
      // 播放输入音效
      if (value) handleInput()
    }
    
    // 添加发光效果
    const glowKey = `${phone}-${index}`
    setGlowBoxes(prev => new Set([...prev, glowKey]))
    setTimeout(() => {
      setGlowBoxes(prev => {
        const newSet = new Set(prev)
        newSet.delete(glowKey)
        return newSet
      })
    }, 300)
    
    // 验证手机号格式
    const phoneString = phoneArray.join('').replace(/\D/g, '')
    if (phoneString.length > 0) {
      const validation = validatePhone(phoneString)
      if (phone === 'phone1') {
        setPhone1Error(validation.valid ? '' : validation.message)
      } else {
        setPhone2Error(validation.valid ? '' : validation.message)
      }
    } else {
      if (phone === 'phone1') {
        setPhone1Error('')
      } else {
        setPhone2Error('')
      }
    }
    
    // 自动跳转到下一个框
    if (value && index < 10) {
      setTimeout(() => {
        const nextInput = document.getElementById(`${phone}-box-${index + 1}`) as HTMLInputElement
        nextInput?.focus()
      }, 100)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (phone: 'phone1' | 'phone2', index: number, e: React.KeyboardEvent) => {
    const phoneArray = phone === 'phone1' ? phone1 : phone2
    
    if (e.key === 'Backspace') {
      if (phoneArray[index] && index >= 0) {
        // 如果当前框有内容，删除当前框的内容并播放删除音效
        const newArray = [...phoneArray]
        newArray[index] = ''
        
        if (phone === 'phone1') {
          setPhone1(newArray)
        } else {
          setPhone2(newArray)
        }
        
        // 播放删除音效
        handleDelete()
        
        // 添加发光效果
        const glowKey = `${phone}-${index}`
        setGlowBoxes(prev => new Set([...prev, glowKey]))
        setTimeout(() => {
          setGlowBoxes(prev => {
            const newSet = new Set(prev)
            newSet.delete(glowKey)
            return newSet
          })
        }, 300)
        
        // 验证手机号格式
        const phoneString = newArray.join('').replace(/\D/g, '')
        if (phoneString.length > 0) {
          const validation = validatePhone(phoneString)
          if (phone === 'phone1') {
            setPhone1Error(validation.valid ? '' : validation.message)
          } else {
            setPhone2Error(validation.valid ? '' : validation.message)
          }
        } else {
          if (phone === 'phone1') {
            setPhone1Error('')
          } else {
            setPhone2Error('')
          }
        }
      } else if (!phoneArray[index] && index > 0) {
        // 如果当前框是空的，退格键跳到前一个框
        const prevInput = document.getElementById(`${phone}-box-${index - 1}`) as HTMLInputElement
        prevInput?.focus()
      }
      e.preventDefault() // 防止默认的退格行为
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // 左箭头键跳到前一个框
      const prevInput = document.getElementById(`${phone}-box-${index - 1}`) as HTMLInputElement
      prevInput?.focus()
    } else if (e.key === 'ArrowRight' && index < 10) {
      // 右箭头键跳到后一个框
      const nextInput = document.getElementById(`${phone}-box-${index + 1}`) as HTMLInputElement
      nextInput?.focus()
    }
  }

  // 处理粘贴事件
  const handlePaste = (phone: 'phone1' | 'phone2', e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 11)
    
    if (phone === 'phone1') {
      const newArray = [...phone1]
      for (let i = 0; i < pastedText.length && i < 11; i++) {
        newArray[i] = pastedText[i]
      }
      setPhone1(newArray)
      handleSuccess()
    } else {
      const newArray = [...phone2]
      for (let i = 0; i < pastedText.length && i < 11; i++) {
        newArray[i] = pastedText[i]
      }
      setPhone2(newArray)
      handleSuccess()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // 将数组转换为字符串格式
    const phone1String = phone1.join('').replace(/\D/g, '')
    const phone2String = phone2.join('').replace(/\D/g, '')
    
    const phone1Validation = validatePhone(phone1String)
    if (!phone1Validation.valid) {
      setError(phone1Validation.message)
      setPhone1Error(phone1Validation.message)
      return
    }

    if (phone2String) {
      const phone2Validation = validatePhone(phone2String)
      if (!phone2Validation.valid) {
        setError(phone2Validation.message)
        setPhone2Error(phone2Validation.message)
        return
      }
    }

    if (!qrCode) return

    try {
      setSubmitting(true)
      setError('')

      // 演示模式处理
      if (qrCode.code === 'demo123') {
        console.log('演示模式，模拟提交成功')
        handleSuccess()
        setSuccess(true)
        setTimeout(() => {
          // 演示模式下跳转到演示通话页面
          navigate(`/call/demo123`)
        }, 2000)
        return
      }

      if (existingBinding) {
        // 更新已有绑定
        const { error: updateError } = await supabase
          .from('phone_bindings')
          .update({
            phone1: phone1String,
            phone2: phone2String || null,
            management_password: managementPassword || existingBinding.management_password,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBinding.id)

        if (updateError) throw updateError
      } else {
        // 创建新绑定
        if (!managementPassword) {
          setPasswordError('관리 비밀번호를 설정해주세요')
          return
        }
        
        const { error: insertError } = await supabase
          .from('phone_bindings')
          .insert({
            qr_code_id: qrCode.id,
            phone1: phone1String,
            phone2: phone2String || null,
            management_password: managementPassword
          })

        if (insertError) throw insertError

        // 更新二维码状态为已分配
        await supabase
          .from('qr_codes')
          .update({ status: 'assigned', updated_at: new Date().toISOString() })
          .eq('id', qrCode.id)
      }

      handleSuccess()
      setSuccess(true)
      setTimeout(() => {
        navigate(`/call/${id}`)
      }, 2000)

    } catch (err: any) {
      console.error('연결 실패:', err)
      setError(err.message || '연결 실패, 다시 시도해주세요')
    } finally {
      setSubmitting(false)
    }
  }

  function formatPhoneInput(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    
    // 韩国手机号格式: XXX-XXXX-XXXX
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }
  }

  // 渲染可编辑的数字方框
  function renderPhoneBoxes(phoneArray: string[], error: string, phone: 'phone1' | 'phone2') {
    const boxes = []
    
    // 渲染11个可编辑的数字方框
    for (let i = 0; i < 11; i++) {
      const hasValue = phoneArray[i] !== ''
      const digit = phoneArray[i]
      const isFocused = focusedBox?.phone === phone && focusedBox?.index === i
      const isGlowing = glowBoxes.has(`${phone}-${i}`)
      
      boxes.push(
        <input
          key={i}
          id={`${phone}-box-${i}`}
          type="text"
          value={digit}
          onChange={(e) => handleBoxInput(phone, i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(phone, i, e)}
          onPaste={(e) => handlePaste(phone, e)}
          onFocus={() => {
            setFocusedBox({ phone, index: i })
            handleFocus()
          }}
          onBlur={() => setFocusedBox(null)}
          maxLength={1}
          className={`
            w-8 h-10 sm:w-12 sm:h-14 rounded-md sm:rounded-lg border-2 flex items-center justify-center text-sm sm:text-lg font-mono font-bold text-center
            transition-all duration-300 ease-in-out
            ${hasValue 
              ? error 
                ? 'border-error bg-error/10 text-error' 
                : 'border-primary-500 bg-primary-500/10 text-text-primary'
              : 'border-white/20 bg-white/5 text-text-tertiary'
            }
            ${isFocused ? 'ring-2 ring-primary-300 ring-offset-2 ring-offset-background' : ''}
            ${isGlowing ? 'shadow-lg shadow-primary-500/50 border-primary-400 bg-primary-400/20' : ''}
            focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-background
            hover:border-primary-300 hover:bg-primary-500/5
            cursor-text select-none
          `}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        />
      )
    }
    
    return (
      <div className="w-full">
        {/* 移动端布局 - 一行显示 */}
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center items-center">
          {/* 前3位 */}
          <div className="flex gap-1 sm:gap-2">
            {boxes.slice(0, 3)}
          </div>
          <span className="text-text-secondary text-lg sm:text-xl font-bold mx-1">-</span>
          {/* 中间4位 */}
          <div className="flex gap-1 sm:gap-2">
            {boxes.slice(3, 7)}
          </div>
          <span className="text-text-secondary text-lg sm:text-xl font-bold mx-1">-</span>
          {/* 最后4位 */}
          <div className="flex gap-1 sm:gap-2">
            {boxes.slice(7, 11)}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary text-lg">로딩 중...</div>
      </div>
    )
  }

  if (error && !qrCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-error mb-2">오류 발생</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-ghost">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full text-center">
          <Check className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text-primary mb-2">
            {existingBinding ? '업데이트 성공' : '연결 성공'}
          </h2>
          <p className="text-text-secondary mb-4">
            연락처가 성공적으로 {existingBinding ? '업데이트' : '연결'}되었습니다
          </p>
          <p className="text-sm text-text-tertiary">
            전화 걸기 페이지로 이동 중...
          </p>
        </div>
      </div>
    )
  }

  // 如果没有二维码数据，显示错误页面
  if (!qrCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-error mb-2">오류 발생</h2>
          <p className="text-text-secondary mb-6">QR코드가 존재하지 않습니다</p>
          <button onClick={() => navigate('/')} className="btn btn-ghost">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 中间页面 - 第一次扫码显示
  if (!showSetup) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="w-full max-w-md text-center space-y-8">
          {/* 页面头部 */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-3">
              <Phone className="w-12 h-12 text-primary-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
              환영합니다
            </h1>
          </div>

          {/* 设置按钮 */}
          <div className="card">
            <p className="text-text-secondary mb-6">
              방문객이 QR코드를 스캔한 후 즉시 통화할 수 있습니다
            </p>
            <button
              onClick={() => {
                setShowSetup(true)
                handleEdit()
              }}
              className="w-full h-16 btn btn-primary text-xl font-bold"
            >
              <Phone className="w-6 h-6" />
              설정
            </button>
          </div>

          {/* 二维码信息 */}
          <div className="text-center">
            <div className="text-sm text-text-secondary mb-2">QR코드 번호</div>
            <div className="text-xl font-bold font-mono text-primary-500">
              {id}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Phone className="w-10 h-10 text-primary-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
              {existingBinding ? '연락처 업데이트' : '연락처 연결'}
            </h1>
          </div>
          <p className="text-text-secondary">
            {new URLSearchParams(location.search).get('mode') === 'edit' ? '설정 버튼을 통해 편집 모드로 들어갑니다' : '방문객이 QR코드를 스캔한 후 즉시 통화할 수 있습니다'}
          </p>
        </div>

        {/* 绑定表单 */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-md p-4">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              휴대폰 번호1 <span className="text-error">*</span>
            </label>
            
            {/* 可编辑的数字方框 */}
            <div className="mb-4">
              {renderPhoneBoxes(phone1, phone1Error, 'phone1')}
            </div>
            
            {phone1Error && (
              <p className="text-xs text-error mt-2">{phone1Error}</p>
            )}
            {!phone1Error && phone1.join('').replace(/\D/g, '').length === 11 && (
              <p className="text-xs text-success-500 mt-2">✓ 형식이 올바릅니다</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              휴대폰 번호2 <span className="text-text-tertiary">(선택사항)</span>
            </label>
            
            {/* 可编辑的数字方框 */}
            <div className="mb-4">
              {renderPhoneBoxes(phone2, phone2Error, 'phone2')}
            </div>
            
            {phone2Error && (
              <p className="text-xs text-error mt-2">{phone2Error}</p>
            )}
            {!phone2Error && phone2.join('').replace(/\D/g, '').length === 11 && (
              <p className="text-xs text-success-500 mt-2">✓ 형식이 올바릅니다</p>
            )}
          </div>

          {/* 管理密码 */}
          <div>
            <label htmlFor="managementPassword" className="block text-sm font-medium text-text-secondary mb-2">
              관리 비밀번호 {existingBinding ? <span className="text-text-tertiary">(비워두면 기존 비밀번호 유지)</span> : <span className="text-error">*</span>}
            </label>
            <input
              id="managementPassword"
              type="password"
              value={managementPassword}
              onChange={(e) => {
                setManagementPassword(e.target.value)
                setPasswordError('')
                // 播放输入音效
                if (e.target.value.length > 0) {
                  handleInput()
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && managementPassword.length > 0) {
                  // 播放删除音效
                  handleDelete()
                }
              }}
              onFocus={() => handleFocus()}
              placeholder={existingBinding ? "비워두면 기존 비밀번호 유지" : "관리 비밀번호 설정"}
              className="input"
              required={!existingBinding}
            />
            {passwordError && (
              <p className="text-xs text-error mt-2">{passwordError}</p>
            )}
            {existingBinding && !managementPassword && (
              <p className="text-xs text-text-tertiary mt-2">새 비밀번호를 입력하지 않으면 기존 비밀번호를 유지합니다</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || phone1.join('').replace(/\D/g, '').length !== 11 || !!phone1Error || (phone2.join('').replace(/\D/g, '').length > 0 && (phone2.join('').replace(/\D/g, '').length !== 11 || !!phone2Error)) || (existingBinding ? false : !managementPassword) || !!passwordError}
            className="w-full h-14 btn btn-primary text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '처리 중...' : existingBinding ? '업데이트' : '확인'}
          </button>
        </form>

        {/* 二维码信息 - 移到底部 */}
        <div className="card mt-6 text-center">
          <div className="text-sm text-text-secondary mb-2">二维码号码</div>
          <div className="text-2xl font-bold font-mono text-primary-500">
            {id}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center space-y-3">
          {existingBinding && (
            <button
              onClick={() => navigate(`/call/${id}`)}
              className="btn btn-ghost w-full"
            >
              돌아가기
            </button>
          )}
          <button
            onClick={() => setShowSetup(false)}
            className="btn btn-ghost w-full"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  )
}
