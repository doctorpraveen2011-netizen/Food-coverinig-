import React from 'react';
import { FileText, Search, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';

export const ComplaintSummaryCards: React.FC = () => {
  const { stats, statusFilter, setStatusFilter } = useComplaintsStore();

  const cards = [
    {
      id: 'total',
      label: 'Total Complaints',
      value: stats.total,
      trend: '12%',
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600',
      filterTarget: 'All Statuses',
      activeBorder: 'ring-2 ring-blue-500/20 border-blue-500'
    },
    {
      id: 'investigation',
      label: 'Under Investigation',
      value: stats.underInvestigation,
      trend: '8%',
      icon: Search,
      iconBg: 'bg-orange-50 text-orange-600',
      filterTarget: 'Under Investigation',
      activeBorder: 'ring-2 ring-orange-500/20 border-orange-500'
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: stats.resolved,
      trend: '18%',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      filterTarget: 'Resolved',
      activeBorder: 'ring-2 ring-emerald-500/20 border-emerald-500'
    },
    {
      id: 'closed',
      label: 'Closed',
      value: stats.closed,
      trend: '6%',
      icon: XCircle,
      iconBg: 'bg-slate-100 text-slate-600',
      filterTarget: 'Closed',
      activeBorder: 'ring-2 ring-slate-500/20 border-slate-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isCurrentFilter =
          (card.filterTarget === 'All Statuses' && statusFilter === 'All Statuses') ||
          statusFilter === card.filterTarget;

        return (
          <div
            key={card.id}
            onClick={() => setStatusFilter(card.filterTarget)}
            className={`bg-white rounded-xl p-5 border border-gray-200 transition-all cursor-pointer hover:border-gray-300 hover:shadow-sm ${
              isCurrentFilter ? 'border-emerald-600/50 shadow-sm' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">{card.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
                
                <div className="flex items-center gap-1.5 mt-2.5 text-[11px]">
                  <span className="inline-flex items-center font-semibold text-emerald-600">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    {card.trend}
                  </span>
                  <span className="text-gray-400">vs. last period</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
