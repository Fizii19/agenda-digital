'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Sparkles, X } from 'lucide-react';
import Button from '@/components/ui/Button';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ConfirmInput = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
};

type ToastItem = Required<Pick<ToastInput, 'title'>> & {
  id: string;
  message: string;
  variant: ToastVariant;
};

type FeedbackContextValue = {
  notify: (input: ToastInput) => void;
  confirm: (input: ConfirmInput) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toastIcon(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'error':
      return <ShieldAlert className="h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
}

function toastStyles(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800';
  }
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    tone: 'default' | 'danger';
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    tone: 'default',
    resolve: null,
  });
  const toastTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  const notify = useCallback((input: ToastInput) => {
    const id = createToastId();
    const variant = input.variant ?? 'info';
    const nextToast: ToastItem = {
      id,
      title: input.title,
      message: input.message ?? '',
      variant,
    };

    setToasts((current) => [...current, nextToast]);

    const timeout = window.setTimeout(() => {
      dismissToast(id);
    }, input.duration ?? 3500);

    toastTimers.current.set(id, timeout);
  }, [dismissToast]);

  const confirm = useCallback((input: ConfirmInput) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        open: true,
        title: input.title,
        message: input.message,
        confirmText: input.confirmText ?? 'Ya, lanjutkan',
        cancelText: input.cancelText ?? 'Batal',
        tone: input.tone ?? 'default',
        resolve,
      });
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    setConfirmState((current) => {
      current.resolve?.(value);
      return {
        ...current,
        open: false,
        resolve: null,
      };
    });
  }, []);

  const contextValue = useMemo(() => ({ notify, confirm }), [confirm, notify]);
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      {portalTarget && createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-end px-4 sm:px-6 lg:px-8">
          <div className="flex w-full max-w-md flex-col gap-3">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg shadow-slate-200/60 backdrop-blur transition-all duration-200 ${toastStyles(toast.variant)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">
                    {toastIcon(toast.variant)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{toast.title}</p>
                        {toast.message && <p className="mt-1 text-sm leading-relaxed opacity-90">{toast.message}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissToast(toast.id)}
                        className="rounded-lg p-1 text-current/60 transition-colors hover:bg-black/5 hover:text-current"
                        aria-label="Tutup notifikasi"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        portalTarget
      )}

      {portalTarget && confirmState.open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-start gap-4 border-b border-gray-100 px-6 py-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${confirmState.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-[#4F46E5]'}`}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{confirmState.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{confirmState.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-5">
              <Button variant="ghost" type="button" onClick={() => closeConfirm(false)}>
                {confirmState.cancelText}
              </Button>
              <Button
                type="button"
                variant={confirmState.tone === 'danger' ? 'danger' : 'primary'}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmText}
              </Button>
            </div>
          </div>
        </div>,
        portalTarget
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
}
