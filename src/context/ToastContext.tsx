import React, { createContext, useContext, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastOptions {
  title?: string;
  duration?: number;
  isDbAction?: boolean;
}

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration: number;
  isDbAction?: boolean;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  loading: (message: string, title?: string) => string;
  db: (title: string, status: ToastType, details?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dismissToast = useCallback((_id: string) => {}, []);
  const showToast = useCallback((_message: string, _type: ToastType = 'info', _options?: ToastOptions) => '', []);
  const success = useCallback((_message: string, _title?: string, _duration?: number) => '', []);
  const error = useCallback((_message: string, _title?: string, _duration?: number) => '', []);
  const info = useCallback((_message: string, _title?: string, _duration?: number) => '', []);
  const loading = useCallback((_message: string, _title?: string) => '', []);
  const db = useCallback((_title: string, _status: ToastType = 'info', _details?: string, _duration?: number) => '', []);

  return (
    <ToastContext.Provider
      value={{
        toasts: [],
        showToast,
        dismissToast,
        success,
        error,
        info,
        loading,
        db,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
