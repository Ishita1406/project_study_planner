import React from 'react';
import { RefreshCw, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  targetDate: string;
  onConfirmMoveOnly: () => void;
  onConfirmRebalance: () => void;
}

export const RebalanceModal: React.FC<RebalanceModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  targetDate,
  onConfirmMoveOnly,
  onConfirmRebalance,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Study Plan?"
      subtitle="You shifted a scheduled study task"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
          <p className="text-xs font-semibold text-slate-900">{taskTitle}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Rescheduling to: {targetDate}</span>
          </p>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Would you like to move this individual task only, or automatically rebalance the rest of
          your weekly schedule to maintain optimal daily study load?
        </p>

        <div className="space-y-2.5 pt-2">
          {/* Option 1: Move Only */}
          <button
            onClick={() => {
              onConfirmMoveOnly();
              onClose();
            }}
            className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all flex items-start gap-3 cursor-pointer group"
          >
            <div className="p-1.5 bg-slate-100 rounded text-slate-600 mt-0.5 group-hover:bg-slate-200">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Move this task only</p>
              <p className="text-[11px] text-slate-500">
                Keep all other tasks at their current dates and times.
              </p>
            </div>
          </button>

          {/* Option 2: Rebalance Plan */}
          <button
            onClick={() => {
              onConfirmRebalance();
              onClose();
            }}
            className="w-full text-left p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 transition-all flex items-start gap-3 cursor-pointer group"
          >
            <div className="p-1.5 bg-indigo-100 rounded text-indigo-700 mt-0.5 group-hover:bg-indigo-200">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-950">
                Rebalance the remaining plan
              </p>
              <p className="text-[11px] text-indigo-800/80">
                Adjust subsequent pending sessions to prevent overload and meet deadlines.
              </p>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
