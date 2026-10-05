import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Flame, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type}`} role="alert">
            <span className="toast-icon">
              {t.type === "success" && <CheckCircle2 size={20} />}
              {t.type === "error" && <AlertCircle size={20} />}
              {t.type === "warning" && <AlertTriangle size={20} />}
              {t.type === "info" && <Info size={20} />}
              {t.type === "emergency" && <Flame size={22} className="pulse-danger" />}
            </span>
            <div className="toast-content">
              <strong>
                {t.type === "emergency"
                  ? "EMERGENCY ALERT"
                  : t.type.charAt(0).toUpperCase() + t.type.slice(1)}
              </strong>
              <p>{t.message}</p>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
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
