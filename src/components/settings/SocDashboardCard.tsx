import { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Ban, 
  Clock, 
  Play, 
  RotateCcw, 
  Search
} from 'lucide-react';
import type { SocEvent, SeverityType, IncidentStatusType } from './IncidentDetailsPanel';

interface SocDashboardCardProps {
  events: SocEvent[];
  selectedIncident: SocEvent | null;
  onSelectIncident: (event: SocEvent) => void;
  onSimulateScenario: (scenario: string) => void;
  onResetDemo: () => void;
  metrics: {
    securityEvents: number;
    threatsDetected: number;
    requestsBlocked: number;
    underInvestigation: number;
  };
}

export default function SocDashboardCard({
  events,
  selectedIncident,
  onSelectIncident,
  onSimulateScenario,
  onResetDemo,
  metrics
}: SocDashboardCardProps) {
  const [selectedScenario, setSelectedScenario] = useState('Repeated Login Failures');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const scenariosList = [
    'Repeated Login Failures',
    'Excessive OTP Requests',
    'Unauthorized API Access',
    'Gateway Config Change',
    'Rate Limit Exceeded'
  ];

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = 
      ev.eventType.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.source.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.affectedComponent.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSeverityBadge = (severity: SeverityType) => {
    switch (severity) {
      case 'Critical':
        return <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">Critical</span>;
      case 'High':
        return <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">High</span>;
      case 'Medium':
        return <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">Medium</span>;
      case 'Low':
        return <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">Low</span>;
    }
  };

  const getStatusBadge = (status: IncidentStatusType) => {
    switch (status) {
      case 'Open':
        return <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-semibold px-1.5 py-0.2 rounded">Open</span>;
      case 'Investigating':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold px-1.5 py-0.2 rounded">Investigating</span>;
      case 'Resolved':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold px-1.5 py-0.2 rounded">Resolved</span>;
    }
  };

  return (
    <div className="bg-[#F4FAF6] border border-emerald-200/70 rounded-xl p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-900 tracking-tight truncate">Security Operations Center (SOC)</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-semibold px-2 py-0.2 rounded-full border border-emerald-200/60 shrink-0">
              Demo Mode
            </span>
          </div>
          <p className="text-[10px] text-gray-500 truncate">
            Monitor platform security events and demonstrate incident response.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Metric 1: Security Events */}
        <div className="bg-white rounded-lg border border-gray-100/90 shadow-2xs p-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-gray-500 truncate">Security Events</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-900 leading-none">{metrics.securityEvents}</span>
              <span className="text-[9px] font-semibold text-emerald-600">↑ 3 today</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Threats Detected */}
        <div className="bg-white rounded-lg border border-gray-100/90 shadow-2xs p-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-gray-500 truncate">Threats Detected</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-900 leading-none">{metrics.threatsDetected}</span>
              <span className="text-[9px] font-semibold text-emerald-600">↑ 2 today</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Requests Blocked */}
        <div className="bg-white rounded-lg border border-gray-100/90 shadow-2xs p-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <Ban className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-gray-500 truncate">Requests Blocked</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-900 leading-none">{metrics.requestsBlocked}</span>
              <span className="text-[9px] font-semibold text-emerald-600">↑ 1 today</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Incidents Under Investigation */}
        <div className="bg-white rounded-lg border border-gray-100/90 shadow-2xs p-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-gray-500 truncate">Under Investigation</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-900 leading-none">{metrics.underInvestigation}</span>
              <span className="text-[9px] font-semibold text-emerald-600">↑ 1 today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-bold text-gray-700">Select Scenario</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg text-[11px] px-2.5 py-1 text-gray-800 font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[170px]"
          >
            {scenariosList.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSimulateScenario(selectedScenario)}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-semibold px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Event</span>
          </button>
        </div>

        <button
          onClick={onResetDemo}
          className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Recent Security Events Table */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between gap-2">
          <h4 className="text-[11px] font-bold text-gray-900 tracking-tight">Recent Security Events</h4>

          {/* Quick Filter & Search Bar */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-2.5 h-2.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter events..."
                className="pl-5 pr-2 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 w-28 sm:w-36"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-0.5 px-1.5 text-[10px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-1.5 px-3">Time</th>
                <th className="py-1.5 px-3">Event Type</th>
                <th className="py-1.5 px-3">Source</th>
                <th className="py-1.5 px-3">Severity</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400 text-[11px]">
                    No matching events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 5).map((event) => {
                  const isSelected = selectedIncident?.id === event.id;
                  return (
                    <tr
                      key={event.id}
                      onClick={() => onSelectIncident(event)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-emerald-50/60 font-medium' 
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <td className="py-1.5 px-3 font-mono text-[10px] text-gray-600 whitespace-nowrap">
                        {event.time}
                      </td>
                      <td className="py-1.5 px-3 text-gray-900 font-semibold whitespace-nowrap">
                        {event.eventType}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-[10px] text-gray-600 whitespace-nowrap">
                        {event.source}
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        {getSeverityBadge(event.severity)}
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="py-1.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(event);
                          }}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-700'
                          }`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
