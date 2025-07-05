import React from 'react';

interface ReportFilterContainerProps {
    children: React.ReactNode;
    onGenerate: () => void;
    isLoading?: boolean;
}

export const ReportFilterContainer: React.FC<ReportFilterContainerProps> = ({ children, onGenerate, isLoading }) => {
    return (
        <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-slate-50 mb-6">
            {children}
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 self-end"
            >
                {isLoading ? 'Yuklanmoqda...' : 'Hisobotni yaratish'}
            </button>
        </div>
    );
};
