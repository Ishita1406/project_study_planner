import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3.5">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
