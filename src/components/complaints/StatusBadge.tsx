import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'sm' }) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (normalized.includes('under investigation')) {
    colorClasses = 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';
  } else if (normalized.includes('in progress')) {
    colorClasses = 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
  } else if (normalized.includes('resolved')) {
    colorClasses = 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]';
  } else if (normalized.includes('closed')) {
    colorClasses = 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
  } else if (normalized.includes('submitted')) {
    colorClasses = 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]';
  }

  const paddingClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${paddingClass} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
};
