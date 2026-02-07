import { AlertColor } from "@mui/material";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import Toast from "@/components/Toast";

type ToastState = {
  open: boolean;
  message: string;
  severity: AlertColor;
};

type ToastContextValue = {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = useCallback(
    (message: string, severity: AlertColor) => {
      setToast({ open: true, message, severity });
    },
    []
  );

  const notifySuccess = useCallback(
    (message: string) => {
      showToast(message, "success");
    },
    [showToast]
  );

  const notifyError = useCallback(
    (message: string) => {
      showToast(message, "error");
    },
    [showToast]
  );

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(
    () => ({
      notifySuccess,
      notifyError,
    }),
    [notifyError, notifySuccess]
  );
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleClose}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
