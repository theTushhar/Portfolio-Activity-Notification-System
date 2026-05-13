import { useState, useEffect, createContext, useContext } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return { toast: (msg: string) => console.log(msg) }
  }
  return context
}

export function toast(message: string, type: 'success' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const newToast: Toast = {
        id: Date.now(),
        message: e.detail.message,
        type: e.detail.type,
      }
      setToasts((prev) => [...prev, newToast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, 3000)
    }
    window.addEventListener('show-toast', handler as EventListener)
    return () => window.removeEventListener('show-toast', handler as EventListener)
  }, [])

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}