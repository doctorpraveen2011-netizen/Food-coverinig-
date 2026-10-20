import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Phone, 
  Star, 
  Sparkles, 
  Award
} from 'lucide-react';
import { normalizePhone } from '../../utils/phoneUtils';
import { useAlertsStore } from '../../store/useAlertsStore';

interface AutoAssignTabProps {
  onOpenTestModal?: (defaultType?: 'email' | 'sms' | 'auto') => void;
}

export const AutoAssignTab: React.FC<AutoAssignTabProps> = ({ onOpenTestModal }) => {
  const {
    autoAssignEnabled,
    toggleAutoAssign,
    autoAssignEngine,
    setEngineAlgorithm,
    setMaxRadius,
    setMaxActiveTasks,
    assignmentRules,
    toggleRuleEnabled,
    volunteerPool,
    assignmentHistory,
    triggerAutoAssignmentBatch
  } = useAlertsStore();

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'pool' | 'history'>('rules');
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'On Delivery' | 'Offline'>('all');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  const handleRunBatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await triggerAutoAssignmentBatch();
      setDispatchResult(res.message);
      setTimeout(() => setDispatchResult(null), 5000);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredVolunteers = volunteerPool.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(volunteerSearch.toLowerCase()) || 
                          v.currentZone.toLowerCase().includes(volunteerSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Engine Controls Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 lg:p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Automated Volunteer Dispatch Engine</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  autoAssignEngine.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  Engine: {autoAssignEngine.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time geospatial matching algorithm pairing excess food donations with qualified volunteer couriers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenTestModal && (
              <button
                onClick={() => onOpenTestModal('auto')}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <span>Simulate Dispatcher</span>
              </button>
            )}

            <button
              onClick={handleRunBatch}
              disabled={isDispatching || !autoAssignEnabled}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
              <span>{isDispatching ? 'Optimizing Matches...' : 'Run Auto-Assignment Batch'}</span>
            </button>

            <button
              onClick={toggleAutoAssign}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-2xs ${
                autoAssignEnabled 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                  : 'bg-[#065F46] hover:bg-[#044E3A] text-white'
              }`}
            >
              {autoAssignEnabled ? 'Pause Engine' : 'Resume Engine'}
            </button>
          </div>
        </div>

        {/* Live Notification for Batch Run */}
        {dispatchResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{dispatchResult}</span>
            </div>
            <span className="text-[10px] bg-emerald-100/80 px-2 py-0.5 rounded font-mono">Matched 100%</span>
          </div>
        )}

        {/* Algorithm Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Dispatch Algorithm</label>
            <select
              value={autoAssignEngine.algorithm}
              onChange={(e) => setEngineAlgorithm(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Proximity & Geofencing (Optimal ETA)">Proximity & Geofencing (Optimal ETA)</option>
              <option value="Availability & Response Speed">Availability & Response Speed</option>
              <option value="Balanced Workload">Balanced Workload (Anti-Fatigue)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">Max Geofence Radius</label>
              <span className="text-xs font-bold text-emerald-700 font-mono">{autoAssignEngine.maxRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={autoAssignEngine.maxRadiusKm}
              onChange={(e) => setMaxRadius(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>5 km</span>
              <span>20 km</span>
              <span>35 km</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">Max Tasks / Volunteer</label>
              <span className="text-xs font-bold text-emerald-700 font-mono">{autoAssignEngine.maxActiveTasksPerVolunteer} active</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={autoAssignEngine.maxActiveTasksPerVolunteer}
              onChange={(e) => setMaxActiveTasks(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 task</span>
              <span>3 tasks</span>
              <span>5 tasks</span>
            </div>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'rules'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Assignment Rules ({assignmentRules.length} Configured)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pool')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'pool'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Volunteer Pool (342 Active)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Assignment History (Last 24h: {assignmentHistory.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Assignment Rules */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Active Auto-Assignment Constraints & Rules</h3>
              <p className="text-xs text-gray-500">Every donation pickup evaluates these rules in parallel to pick the optimal volunteer courier.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {assignmentRules.map((rule) => {
              const priorityBadge = {
                High: 'bg-rose-50 text-rose-700 border-rose-200',
                Medium: 'bg-amber-50 text-amber-700 border-amber-200',
                Low: 'bg-blue-50 text-blue-700 border-blue-200'
              }[rule.priority];

              return (
                <div 
                  key={rule.id}
                  className={`bg-white rounded-xl border p-4.5 transition-all shadow-2xs hover:shadow-xs ${
                    rule.enabled ? 'border-gray-200' : 'border-gray-200/60 opacity-60 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                          {rule.priority} Priority
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">{rule.name}</h4>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        {rule.description}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-2 font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-gray-400 font-sans">RULE: </span>
                        {rule.conditionText}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleRuleEnabled('assign', rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.enabled ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={rule.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Volunteer Pool */}
      {activeSubTab === 'pool' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search volunteer name or zone..."
                  value={volunteerSearch}
                  onChange={(e) => setVolunteerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'Available', 'On Delivery', 'Offline'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'All Volunteers' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.map((vol) => {
              const statusDot = {
                Available: 'bg-emerald-500',
                'On Delivery': 'bg-amber-500 animate-pulse',
                Offline: 'bg-gray-400'
              }[vol.status];

              return (
                <div key={vol.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {vol.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{vol.name}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                          <span>{vol.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{vol.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Zone:</span>
                      <span className="font-medium text-gray-800">{vol.currentZone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vehicle:</span>
                      <span className="font-medium text-gray-800">{vol.vehicleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tasks Rescued:</span>
                      <span className="font-medium text-gray-800">{vol.completedTasks} completed</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {vol.foodSafetyCertified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Award className="w-3 h-3 text-emerald-600" />
                        <span>Safety Certified</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Standard Tier</span>
                    )}

                    <a 
                      href={normalizePhone(vol.phone).cellularHref}
                      className="text-xs text-gray-600 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline font-mono"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{normalizePhone(vol.phone).formattedDisplay}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Assignment History */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">Recent Automatic Dispatches (24-Hour Window)</h3>
            <span className="text-[11px] text-gray-400">All matched with optimal route algorithm</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Donation / Task Title</th>
                  <th className="px-4 py-3">Donor / Pickup Location</th>
                  <th className="px-4 py-3">Assigned Volunteer</th>
                  <th className="px-4 py-3">Distance & ETA</th>
                  <th className="px-4 py-3">Dispatched Time</th>
                  <th className="px-4 py-3">Trip Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {assignmentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.requestTitle}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{item.donorOrSeller}</div>
                      <div className="text-[11px] text-gray-400">{item.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{item.assignedVolunteer}</div>
                      <div className="text-[11px] font-mono text-gray-500">{item.volunteerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      <span className="font-mono text-gray-800 font-medium">{item.distanceKm} km</span>
                      <span className="text-gray-400 ml-1.5">({item.etaMinutes}m ETA)</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-400">{item.assignedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'En Route' || item.status === 'Picked Up'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
