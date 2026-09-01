import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'border-l-4 border-[var(--color-positive)]',
  error: 'border-l-4 border-[var(--color-negative)]',
  info: 'border-l-4 border-[var(--color-accent)]',
  warning: 'border-l-4 border-[var(--color-warning)]',
}

const ICON_CLASSES: Record<ToastVariant, string> = {
  success: 'text-[var(--color-positive)]',
  error: 'text-[var(--color-negative)]',
  info: 'text-[var(--color-accent)]',
  warning: 'text-[var(--color-warning)]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${counter.current++}`
      setToasts((prev) => [...prev, { ...t, id }])
      setTimeout(() => remove(id), 5000)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2 transition-all">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant]
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'flex items-start gap-3 rounded-xl bg-[var(--color-surface)] p-3.5 shadow-2xl border border-[var(--color-border)] backdrop-blur-xl transition-all transform animate-in fade-in slide-in-from-top-4 duration-300',
                VARIANT_CLASSES[t.variant],
              )}
            >
              <Icon size={20} className={cn('mt-0.5 shrink-0', ICON_CLASSES[t.variant])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text)]">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs font-medium text-[var(--color-text-muted)]">{t.description}</p>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
