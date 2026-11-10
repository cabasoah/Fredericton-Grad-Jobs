import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LuCircleAlert, LuCircleCheck, LuX } from "react-icons/lu";
import { ToastContext, type Toast, type ToastKind } from "./ToastContext";

// How long a toast stays on screen, in milliseconds.
const TOAST_DURATION_MS = 5000;

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.kind === "error";
  return (
    <li
      className={`flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 shadow-overlay ${
        isError ? "border-rose-200" : "border-emerald-200"
      }`}
    >
      {isError ? (
        <LuCircleAlert className="mt-0.5 shrink-0 text-lg text-rose-600" aria-hidden />
      ) : (
        <LuCircleCheck className="mt-0.5 shrink-0 text-lg text-emerald-600" aria-hidden />
      )}
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Dismiss notification"
      >
        <LuX aria-hidden />
      </button>
    </li>
  );
};

const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, kind, message }]);
  }, []);

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Announced to screen readers as it changes. */}
      <ol
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </ol>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
