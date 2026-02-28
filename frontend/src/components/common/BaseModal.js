import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export const BaseModal = ({
    open,
    onOpenChange,
    title,
    subtitle,
    size = 'md',
    children,
    onSubmit,
    submitText = 'Lưu',
    loading = false,
    loadingText = 'Đang xử lý...',
    cancelText = 'Hủy',
    hideFooter = false,
    disableSubmit = false,
}) => {
    if (!open) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        'full': 'max-w-[95vw]',
    };

    const content = (
        <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
                {children}
            </div>

            {!hideFooter && (
                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelText}
                    </Button>

                    {onSubmit && (
                        <Button
                            type="submit"
                            isLoading={loading}
                            disabled={disableSubmit}
                        >
                            {loading ? loadingText : submitText}
                        </Button>
                    )}
                </div>
            )}
        </>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div
                className={cn(
                    "w-full max-h-[95vh] bg-white rounded-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                    sizeClasses[size]
                )}
            >
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                        {subtitle && <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>}
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                {onSubmit ? (
                    <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                        {content}
                    </form>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
};
