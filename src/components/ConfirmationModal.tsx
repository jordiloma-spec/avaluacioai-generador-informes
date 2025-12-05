import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancel·lar',
  variant = 'default',
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = {
    default: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
  }[variant];

  const icon = {
    default: <AlertTriangle className="text-blue-600" size={24} />,
    danger: <AlertTriangle className="text-red-600" size={24} />,
    success: <CheckCircle className="text-emerald-600" size={24} />,
  }[variant];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onConfirm}
            className={`w-full py-2 ${confirmButtonClasses} text-white rounded-lg font-bold transition-colors`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};