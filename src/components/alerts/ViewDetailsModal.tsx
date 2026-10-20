import React from 'react';
import { 
  X, 
  Mail, 
  MessageSquare, 
  Users 
} from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';

interface ViewDetailsModalProps {
  type: 'email' | 'sms' | 'auto-assign' | null;
  onClose: () => void;
  onNavigateTab: (tab: 'email' | 'sms' | 'auto-assign') => void;
}

export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ type, onClose, onNavigateTab }) => {
  if (!type) return null;

  const { 
    emailProvider, 
    smsProvider, 
    autoAssignEngine 
  } = useAlertsStore();

  const titleMap = {
    email: 'Email Alerts Diagnostics & Infrastructure',
    sms: 'SMS Cellular Gateway Health & Telemetry',
    'auto-assign': 'Automated Volunteer Dispatch Engine Diagnostics'
  };

  const iconMap = {
    email: <Mail className="w-5 h-5 text-blue-600" />,
    sms: <MessageSquare className="w-5 h-5 text-emerald-600" />,
    'auto-assign': <Users className="w-5 h-5 text-orange-600" />
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              {iconMap[type]}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{titleMap[type]}</h3>
              <p className="text-xs text-gray-500">Live system performance, SLA metrics, and operational readiness.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on type */}
        {type === 'email' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[11px] text-blue-700 font-medium block">Delivered Last 24h</span>
                <span className="text-xl font-bold text-blue-900 mt-1 block">124</span>
                <span className="text-[10px] text-emerald-600 font-medium">99.2% Success Rate</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[11px] text-gray-500 font-medium block">Average SMTP Latency</span>
                <span className="text-xl font-bold text-gray-900 mt-1 block">142 ms</span>
                <span className="text-[10px] text-gray-400 font-medium">Standard TLS handshakes</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[11px] text-gray-500 font-medium block">Bounced / Dropped</span>
                <span className="text-xl font-bold text-gray-900 mt-1 block">1</span>
                <span className="text-[10px] text-rose-500 font-medium">&lt; 0.8% invalid domains</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Relay Server:</span>
                <span className="font-mono text-gray-900 font-medium">{emailProvider.host}:{emailProvider.port}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Encryption:</span>
                <span className="text-emerald-700 font-medium">STARTTLS Active (Verified Certificate)</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Sender Domain:</span>
                <span className="font-mono text-gray-900 font-medium">{emailProvider.authEmail} (SPF & DKIM pass)</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Service Level Agreement:</span>
                <span className="text-emerald-700 font-medium">{emailProvider.uptime} target achieved</span>
              </div>
            </div>
          </div>
        )}

        {type === 'sms' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-[11px] text-emerald-700 font-medium block">Dispatched Last 24h</span>
                <span className="text-xl font-bold text-emerald-900 mt-1 block">98</span>
                <span className="text-[10px] text-emerald-600 font-medium">100% Deliverability</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[11px] text-gray-500 font-medium block">Carrier Network Delivery</span>
                <span className="text-xl font-bold text-gray-900 mt-1 block">1.8s</span>
                <span className="text-[10px] text-gray-400 font-medium">Airtel, Jio, Vi direct</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[11px] text-gray-500 font-medium block">Remaining Credit</span>
                <span className="text-xl font-bold text-gray-900 mt-1 block">{smsProvider.balance}</span>
                <span className="text-[10px] text-emerald-600 font-medium">Auto-reload enabled</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Gateway Provider:</span>
                <span className="font-mono text-gray-900 font-medium">Twilio Rest API v2010</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Approved Header:</span>
                <span className="font-mono text-gray-900 font-medium">{smsProvider.senderId}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Delivery Receipts DLR:</span>
                <span className="text-emerald-700 font-medium">200 OK webhook sync enabled</span>
              </div>
            </div>
          </div>
        )}

        {type === 'auto-assign' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-orange-50/70 border border-orange-100 rounded-xl">
                <span className="text-[11px] text-orange-700 font-medium block">Auto Dispatches (24h)</span>
                <span className="text-xl font-bold text-orange-900 mt-1 block">12</span>
                <span className="text-[10px] text-emerald-600 font-medium">Avg ETA 14.2 mins</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[11px] text-gray-500 font-medium block">Active Volunteer Fleet</span>
                <span className="text-xl font-bold text-gray-900 mt-1 block">342</span>
                <span className="text-[10px] text-gray-400 font-medium">Across 8 city sectors</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[11px] text-gray-500 font-medium block">Acceptance Rate</span>
                <span className="text-xl font-bold text-gray-900 mt-1 block">96.8%</span>
                <span className="text-[10px] text-emerald-600 font-medium">&lt; 3 mins median accept</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Engine Execution Mode:</span>
                <span className="text-emerald-700 font-medium">{autoAssignEngine.status} ({autoAssignEngine.algorithm})</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Maximum Radius:</span>
                <span className="font-mono text-gray-900 font-medium">{autoAssignEngine.maxRadiusKm} km</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Concurrency Threshold:</span>
                <span className="font-mono text-gray-900 font-medium">{autoAssignEngine.maxActiveTasksPerVolunteer} active trips per courier</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-400">All services operating within regular compliance thresholds</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateTab(type);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#065F46] hover:bg-[#044E3A] rounded-xl shadow-xs"
            >
              Open Full Management Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
