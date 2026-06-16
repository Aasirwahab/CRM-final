'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" styles the confirm button as destructive. */
  variant?: 'default' | 'danger'
}

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx.confirm
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setOptions(null)
  }, [])

  useEffect(() => {
    if (!options) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [options, close])

  const danger = options?.variant === 'danger'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => close(false)}
              aria-hidden
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-label={options.title}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="relative w-full max-w-sm rounded-2xl border bg-popover p-5 shadow-2xl"
            >
              <div className="flex gap-3.5">
                {danger && (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-popover-foreground">{options.title}</h2>
                  {options.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{options.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => close(false)}>
                  {options.cancelLabel ?? 'Cancel'}
                </Button>
                <Button
                  autoFocus
                  variant={danger ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => close(true)}
                >
                  {options.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}
