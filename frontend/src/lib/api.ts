import { supabase } from './supabase'

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

function toQueryString(query?: Query) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const { method = 'GET', body, query } = options

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Network error — unable to reach the backend.', 0)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let parsed: unknown = undefined
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'error' in (parsed as Record<string, unknown>)
        ? String((parsed as Record<string, unknown>).error)
        : undefined) || res.statusText || 'Request failed'
    throw new ApiError(message, res.status)
  }

  return parsed as T
}

const get = <T,>(path: string, query?: Query) => request<T>(path, { method: 'GET', query })
const post = <T,>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body })
const put = <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body })
const patch = <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body })
const del = <T,>(path: string) => request<T>(path, { method: 'DELETE' })

// ---------- Domain types (kept intentionally loose to match a partial backend) ----------

export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  dob?: string
  role?: 'user' | 'admin'
  upi_id?: string
  [key: string]: unknown
}

export interface BankAccount {
  id: string
  account_number: string
  ifsc?: string
  type?: string
  balance: number
  available_balance?: number
  currency?: string
  [key: string]: unknown
}

export interface Transaction {
  id: string
  account_id?: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  category?: string
  status?: string
  merchant?: string
  description?: string
  created_at: string
  [key: string]: unknown
}

export interface Beneficiary {
  id: string
  name: string
  account_number?: string
  ifsc?: string
  upi_id?: string
  nickname?: string
  [key: string]: unknown
}

export interface Transfer {
  id: string
  senderAccountId?: string
  beneficiaryId?: string
  amount: number
  transferType: 'UPI' | 'IMPS' | 'NEFT' | 'RTGS'
  status?: string
  remarks?: string
  merchant?: string
  created_at?: string
  [key: string]: unknown
}

export interface Card {
  id: string
  last4?: string
  cardholder_name?: string
  card_type?: string
  expiry_month?: number
  expiry_year?: number
  status?: 'ACTIVE' | 'FROZEN' | 'REPORTED' | 'REPLACED' | string
  spending_limit?: number
  daily_limit?: number
  [key: string]: unknown
}

export interface KycStatus {
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'PROCESSING' | 'VERIFIED' | 'FAILED' | string
  documentType?: string
  documentNumber?: string
  [key: string]: unknown
}

export interface Bank {
  id: string
  institution_name?: string
  status?: string
  [key: string]: unknown
}

export interface Budget {
  id: string
  category: string
  amount: number
  period?: string
  spent?: number
  remaining?: number
  percentUsed?: number
  [key: string]: unknown
}

export interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount?: number
  deadline?: string
  [key: string]: unknown
}

export interface NotificationItem {
  id: string
  title?: string
  message: string
  read?: boolean
  created_at: string
  type?: string
  [key: string]: unknown
}

export interface Payment {
  id: string
  amount: number
  currency?: string
  paymentMethod?: string
  status?: string
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  page?: number
  pageSize?: number
}

// ---------- auth ----------
export const authApi = {
  me: () => get<{ profile: Profile; bank_accounts: BankAccount[] }>('/api/auth/me'),
}

// ---------- accounts ----------
export const accountsApi = {
  list: () => get<BankAccount[]>('/api/accounts'),
  get: (id: string) => get<BankAccount>(`/api/accounts/${id}`),
  balance: (id: string) => get<{ balance: number; available_balance?: number }>(`/api/accounts/${id}/balance`),
}

// ---------- transactions ----------
export interface TransactionFilters extends Query {
  search?: string
  category?: string
  status?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}
export const transactionsApi = {
  list: (filters: TransactionFilters = {}) => get<PaginatedResponse<Transaction>>('/api/transactions', filters),
  get: (id: string) => get<Transaction>(`/api/transactions/${id}`),
}

// ---------- beneficiaries ----------
export const beneficiariesApi = {
  list: () => get<Beneficiary[]>('/api/beneficiaries'),
  create: (body: Partial<Beneficiary>) => post<Beneficiary>('/api/beneficiaries', body),
  update: (id: string, body: Partial<Beneficiary>) => put<Beneficiary>(`/api/beneficiaries/${id}`, body),
  remove: (id: string) => del<void>(`/api/beneficiaries/${id}`),
}

// ---------- transfers ----------
export interface CreateTransferInput {
  senderAccountId: string
  beneficiaryId?: string
  amount: number
  transferType: 'UPI' | 'IMPS' | 'NEFT' | 'RTGS'
  remarks?: string
  idempotencyKey: string
  merchant?: string
  recipientUpiId?: string
}
export const transfersApi = {
  create: (body: CreateTransferInput) => post<Transfer>('/api/transfers', body),
  list: (filters: Query = {}) => get<PaginatedResponse<Transfer>>('/api/transfers', filters),
  get: (id: string) => get<Transfer>(`/api/transfers/${id}`),
}

// ---------- cards ----------
export const cardsApi = {
  list: () => get<Card[]>('/api/cards'),
  create: (body: Partial<Card>) => post<Card>('/api/cards', body),
  freeze: (id: string) => post<Card>(`/api/cards/${id}/freeze`),
  unfreeze: (id: string) => post<Card>(`/api/cards/${id}/unfreeze`),
  setLimit: (id: string, spendingLimit: number) => put<Card>(`/api/cards/${id}/limit`, { spendingLimit }),
  report: (id: string, reason?: string) => post<Card>(`/api/cards/${id}/report`, { reason }),
  transactions: (id: string) => get<Transaction[]>(`/api/cards/${id}/transactions`),
}

// ---------- kyc ----------
export const kycApi = {
  submit: (body: { documentType: string; documentNumber: string }) => post<KycStatus>('/api/kyc/submit', body),
  status: () => get<KycStatus>('/api/kyc/status'),
}

// ---------- payments ----------
export const paymentsApi = {
  create: (body: { amount: number; currency: string; paymentMethod: string }) => post<Payment>('/api/payments', body),
  get: (id: string) => get<Payment>(`/api/payments/${id}`),
  refund: (id: string) => post<Payment>(`/api/payments/${id}/refund`),
}

// ---------- banks (linked accounts) ----------
export const banksApi = {
  link: (body: { institutionId?: string } = {}) => post<Bank>('/api/banks/link', body),
  list: () => get<Bank[]>('/api/banks'),
  accounts: (id: string) => get<BankAccount[]>(`/api/banks/${id}/accounts`),
  transactions: (id: string) => get<Transaction[]>(`/api/banks/${id}/transactions`),
  unlink: (id: string) => del<void>(`/api/banks/${id}`),
}

// ---------- fx ----------
export const fxApi = {
  rates: (base = 'INR') => get<{ base: string; rates: Record<string, number> }>('/api/fx/rates', { base }),
  convert: (from: string, to: string, amount: number) =>
    get<{ from: string; to: string; amount: number; result: number; rate?: number }>('/api/fx/convert', {
      from,
      to,
      amount,
    }),
}

// ---------- budgets ----------
export const budgetsApi = {
  list: () => get<Budget[]>('/api/budgets'),
  create: (body: Partial<Budget>) => post<Budget>('/api/budgets', body),
  update: (id: string, body: Partial<Budget>) => put<Budget>(`/api/budgets/${id}`, body),
  remove: (id: string) => del<void>(`/api/budgets/${id}`),
}

// ---------- savings ----------
export const savingsApi = {
  list: () => get<SavingsGoal[]>('/api/savings'),
  create: (body: Partial<SavingsGoal>) => post<SavingsGoal>('/api/savings', body),
  update: (id: string, body: Partial<SavingsGoal>) => put<SavingsGoal>(`/api/savings/${id}`, body),
  remove: (id: string) => del<void>(`/api/savings/${id}`),
  contribute: (id: string, body: { amount: number; type: 'deposit' | 'withdraw' }) =>
    post<SavingsGoal>(`/api/savings/${id}/contribute`, body),
}

// ---------- notifications ----------
export const notificationsApi = {
  list: () => get<NotificationItem[]>('/api/notifications'),
  markRead: (id: string) => patch<NotificationItem>(`/api/notifications/${id}/read`),
  markAllRead: () => patch<void>('/api/notifications/read-all'),
}

// ---------- analytics ----------
export const analyticsApi = {
  overview: () => get<Record<string, unknown>>('/api/analytics/overview'),
  spending: () => get<Record<string, unknown>>('/api/analytics/spending'),
  categories: () => get<Array<{ category: string; amount: number; [key: string]: unknown }>>('/api/analytics/categories'),
  monthly: () => get<Array<{ month: string; income?: number; spending?: number; [key: string]: unknown }>>('/api/analytics/monthly'),
}

// ---------- admin ----------
export const adminApi = {
  users: (query: Query = {}) => get<PaginatedResponse<Profile>>('/api/admin/users', query),
  transactions: (query: Query = {}) => get<PaginatedResponse<Transaction>>('/api/admin/transactions', query),
  kyc: (query: Query = {}) => get<PaginatedResponse<KycStatus & { user_id: string }>>('/api/admin/kyc', query),
  analytics: () => get<Record<string, unknown>>('/api/admin/analytics'),
  systemHealth: () => get<Record<string, unknown>>('/api/admin/system-health'),
  auditLogs: (query: Query = {}) => get<PaginatedResponse<Record<string, unknown>>>('/api/admin/audit-logs', query),
  payments: (query: Query = {}) => get<PaginatedResponse<Payment>>('/api/admin/payments', query),
  cards: (query: Query = {}) => get<PaginatedResponse<Card>>('/api/admin/cards', query),
}
