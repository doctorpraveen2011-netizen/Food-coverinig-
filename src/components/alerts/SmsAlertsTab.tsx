import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCw, 
  Edit3, 
  Sliders, 
  Smartphone, 
  Coins 
} from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';
import type { AlertRule, SmsTemplate } from '../../store/useAlertsStore';

interface SmsAlertsTabProps {
  onOpenTestModal: (defaultType?: 'email' | 'sms' | 'auto') => void;
  onEditTemplate: (template: SmsTemplate) => void;
  onEditRule: (rule: AlertRule) => void;
}

export const SmsAlertsTab: React.FC<SmsAlertsTabProps> = ({
  onOpenTestModal,
  onEditTemplate,
  onEditRule
}) => {
  const { 
    smsAlertsEnabled, 
    toggleSmsAlerts, 
    smsProvider, 
    smsRules, 
    toggleRuleEnabled, 
    smsTemplates, 
    smsLogs,
    retrySmsLog
  } = useAlertsStore();

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'templates' | 'logs' | 'twilio'>('rules');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'Delivered' | 'Sent' | 'Failed'>('all');

  const filteredLogs = smsLogs.filter(log => {
    const matchesSearch = log.phone.includes(logSearch) || 
                          log.recipientName.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.messagePreview.toLowerCase().includes(logSearch.toLowerCase());
    const matchesStatus = logFilter === 'all' || log.status === logFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 lg:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">SMS Alerts & Dispatch Gateway</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  smsAlertsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {smsAlertsEnabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Instant cellular notifications for volunteer matches, security OTP verification, and urgent contamination warnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenTestModal('sms')}
              className="px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test SMS</span>
            </button>

            <button
              onClick={toggleSmsAlerts}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-2xs ${
                smsAlertsEnabled 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                  : 'bg-[#065F46] hover:bg-[#044E3A] text-white'
              }`}
            >
              {smsAlertsEnabled ? 'Disable SMS Service' : 'Enable SMS Service'}
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 mt-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'rules'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>SMS Rules ({smsRules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'templates'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Message Templates ({smsTemplates.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'logs'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Delivery Logs ({smsLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('twilio')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'twilio'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Twilio Account & Balance</span>
          </button>
        </div>
      </div>

      {/* Rules */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">SMS Notification Triggers</h3>
              <p className="text-xs text-gray-500">Fast push cellular triggers prioritized for immediate actions within 1-3 minutes.</p>
            </div>
            <button 
              onClick={() => onEditRule({
                id: `sr-${Date.now()}`,
                name: '',
                trigger: 'Automated Match',
                condition: '',
                recipientGroup: 'Volunteers',
                enabled: true,
                severity: 'High'
              })}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#065F46] border border-emerald-200/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create SMS Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {smsRules.map((rule) => {
              const severityColor = {
                Critical: 'bg-rose-50 text-rose-700 border-rose-200',
                High: 'bg-amber-50 text-amber-700 border-amber-200',
                Medium: 'bg-blue-50 text-blue-700 border-blue-200',
                Low: 'bg-gray-100 text-gray-600 border-gray-200'
              }[rule.severity];

              return (
                <div 
                  key={rule.id}
                  className={`bg-white rounded-xl border p-4.5 transition-all shadow-2xs hover:shadow-xs ${
                    rule.enabled ? 'border-gray-200' : 'border-gray-200/60 opacity-70 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${severityColor}`}>
                          {rule.severity}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">{rule.name}</h4>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-2 font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-gray-400 font-sans">Trigger: </span>
                        {rule.condition}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleRuleEnabled('sms', rule.id)}
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

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate max-w-[220px]">
                      <strong className="text-gray-700">Audience:</strong> {rule.recipientGroup}
                    </span>
                    <button 
                      onClick={() => onEditRule(rule)}
                      className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">SMS Concise Message Templates</h3>
              <p className="text-xs text-gray-500">Optimized for 160-character GSM boundaries to prevent multi-segment carrier surcharges.</p>
            </div>
            <button 
              onClick={() => onEditTemplate({
                id: `st-${Date.now()}`,
                name: 'New SMS Template',
                category: 'Urgent',
                body: '',
                variables: [],
                charCount: 0,
                segments: 1,
                lastModified: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#065F46] border border-emerald-200/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create SMS Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smsTemplates.map((template) => (
              <div 
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      {template.category}
                    </span>
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {template.charCount} chars ({template.segments} segment)
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-gray-900 mt-2.5">{template.name}</h4>

                  {/* Mock Phone Bubble */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-[11px] text-gray-800 font-sans leading-relaxed relative">
                    <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-50 border-t border-l border-gray-200/80 rotate-45"></div>
                    {template.body}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.variables.map(v => (
                      <span key={v} className="text-[9px] bg-emerald-50 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-200/60">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEditTemplate(template)}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search phone number or recipient..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'Delivered', 'Sent', 'Failed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setLogFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    logFilter === status
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Phone & Contact</th>
                    <th className="px-4 py-3">SMS Message Snippet</th>
                    <th className="px-4 py-3">Carrier / Gateway</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{log.recipientName}</div>
                        <div className="text-[11px] font-mono text-gray-500">{log.phone}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-600 font-mono text-[11px]">
                        {log.messagePreview}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{log.carrier}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-400">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          log.status === 'Delivered' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : log.status === 'Sent'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {log.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                          {log.status === 'Sent' && <Clock className="w-3 h-3" />}
                          {log.status === 'Failed' && <XCircle className="w-3 h-3" />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => retrySmsLog(log.id)}
                          className="text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No SMS delivery records match current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Twilio */}
      {activeSubTab === 'twilio' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Twilio Telephony & Messaging Service</h3>
              <p className="text-xs text-gray-500">Carrier routing endpoints for SMS delivery receipts and bidirectional webhook triggers.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Twilio Gateway Connected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 block">Available SMS Balance</span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">{smsProvider.balance}</span>
              <span className="text-[11px] text-emerald-600 mt-1 block">Est. ~14,860 SMS segments left</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 block">Alphanumeric Sender ID</span>
              <span className="text-2xl font-bold font-mono text-gray-900 mt-1 block">{smsProvider.senderId}</span>
              <span className="text-[11px] text-gray-500 mt-1 block">TRAI Registered Header</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 block">Twilio Account SID</span>
              <span className="text-sm font-mono text-gray-800 mt-2 block truncate">{smsProvider.accountSid}</span>
              <span className="text-[11px] text-emerald-600 mt-1 block">Webhook Status: Healthy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
