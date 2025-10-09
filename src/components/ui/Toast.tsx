import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/helpers";
import type { Toast as ToastType } from "../../types";

interface ToastProps {
    toast: ToastType;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        if (toast.duration) {
            const timer = setTimeout(() => {
                onClose(toast.id);
            }, toast.duration);

            return () => clearTimeout(timer);
        }
    }, [toast.duration, toast.id, onClose]);

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />,
    };

    const styles = {
        success: "bg-green-500/20 border-green-500/50 text-green-400",
        error: "bg-red-500/20 border-red-500/50 text-red-400",
        warning: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
        info: "bg-blue-500/20 border-blue-500/50 text-blue-400",
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg animate-slideInRight",
                styles[toast.type]
            )}>
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors duration-200"
                aria-label="Close notification">
                <X size={16} />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastType[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onClose,
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};
