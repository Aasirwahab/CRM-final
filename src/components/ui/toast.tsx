'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Toast = ToastOptions & { id: number; variant: ToastVariant }

type ToastContextValue = {
  toast: (opts: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    ring: 'ring-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    ring: 'ring-destructive/25',
    iconColor: 'text-destructive',
  },
  info: {
    icon: Info,
    ring: 'ring-primary/20',
    iconColor: 'text-primary',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = ++idRef.current
      const variant = opts.variant ?? 'info'
      const duration = opts.duration ?? 4000
      setToasts((prev) => [...prev, { ...opts, id, variant }])
      if (duration > 0) {
        setTimeout(() => remove(id), duration)
      }
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, ring, iconColor } = VARIANT_STYLES[t.variant]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                role="status"
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover p-3.5 shadow-lg ring-1 ${ring}`}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-popover-foreground">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Dismiss"
                  className="-mr-1 -mt-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
