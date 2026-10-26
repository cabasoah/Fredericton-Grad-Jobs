import { createContext, useContext } from "react";

export type ToastKind = "success" | "error";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export type ToastContextValue = {
  toasts: Toast[];
  showToast: (kind: ToastKind, message: string) => void;
  dismissToast: (id: number) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside <ToastProvider>");
  return value;
};
