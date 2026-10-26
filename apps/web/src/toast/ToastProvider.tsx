import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
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
      className={`flex items-start gap-3 rounded-lg shadow-lg px-4 py-3 text-white ${
        isError ? "bg-red-600" : "bg-green-600"
      }`}
    >
      {isError ? <FaExclamationCircle className="mt-1 shrink-0" aria-hidden /> : <FaCheckCircle className="mt-1 shrink-0" aria-hidden />}
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Dismiss notification"
      >
        <FaTimes aria-hidden />
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
