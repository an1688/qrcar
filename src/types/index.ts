export interface QRCode {
  id: string
  code: string
  secure_code: string | null
  status: 'unassigned' | 'assigned' | 'disabled'
  created_at: string
  updated_at: string
}

export interface PhoneBinding {
  id: string
  qr_code_id: string
  phone1: string
  phone2: string | null
  management_password: string | null
  bound_at: string
  updated_at: string
}

export interface CallLog {
  id: string
  qr_code_id: string
  phone_number: string
  called_at: string
  ip_address: string | null
}
