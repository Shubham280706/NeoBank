import {
  Home,
  Wallet,
  Send,
  CreditCard,
  Receipt,
  BarChart3,
  PiggyBank,
  Target,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Accounts', to: '/accounts', icon: Wallet },
  { label: 'Payments', to: '/payments', icon: Send },
  { label: 'Cards', to: '/cards', icon: CreditCard },
  { label: 'Transactions', to: '/transactions', icon: Receipt },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Budgets', to: '/budgets', icon: PiggyBank },
  { label: 'Savings', to: '/savings', icon: Target },
  { label: 'Settings', to: '/settings', icon: Settings },
]

// Subset shown in the mobile bottom nav (keep short for small screens).
export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[4],
  NAV_ITEMS[8],
]

export const ADMIN_NAV_ITEM: NavItem = { label: 'Admin', to: '/admin', icon: ShieldCheck }
