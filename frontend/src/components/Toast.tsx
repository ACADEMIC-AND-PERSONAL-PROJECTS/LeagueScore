import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'goal' | 'card' | 'info' | 'success';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-[#1c2028]/95 border border-[#00ff87]/50 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-right-5 duration-300"
        >
          <span className="w-2 h-2 mt-1.5 rounded-full bg-[#00ff87] animate-ping shrink-0" />
          <div className="flex-1">
            <h4 className="font-heading font-bold text-sm text-white">
              {toast.title}
            </h4>
            {toast.description && (
              <p className="font-mono-tabular text-xs text-[#b9cbb9] mt-0.5">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#b9cbb9] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
