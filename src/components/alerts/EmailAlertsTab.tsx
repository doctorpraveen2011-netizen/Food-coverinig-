import React, { useState } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCw, 
  Edit3, 
  Sliders, 
  FileText, 
  Server,
  Eye
} from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';
import type { AlertRule, EmailTemplate } from '../../store/useAlertsStore';

interface EmailAlertsTabProps {
  onOpenTestModal: (defaultType?: 'email' | 'sms' | 'auto') => void;
  onEditTemplate: (template: EmailTemplate) => void;
  onEditRule: (rule: AlertRule) => void;
}

export const EmailAlertsTab: React.FC<EmailAlertsTabProps> = ({
  onOpenTestModal,
  onEditTemplate,
  onEditRule
}) => {
  const { 
    emailAlertsEnabled, 
    toggleEmailAlerts, 
    emailProvider, 
    emailRules, 
    toggleRuleEnabled, 
    emailTemplates, 
    emailLogs,
    resendEmailLog
  } = useAlertsStore();

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'templates' | 'logs' | 'provider'>('rules');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'Delivered' | 'Pending' | 'Failed' | 'Bounced'>('all');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connSuccess, setConnSuccess] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const handleTestConnection = () => {
    setTestingConnection(true);
    setConnSuccess(null);
    setTimeout(() => {
      setTestingConnection(false);
      setConnSuccess('Successfully connected to SMTP server (28ms roundtrip)');
      setTimeout(() => setConnSuccess(null), 4000);
    }, 1000);
  };

  const filteredLogs = emailLogs.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.subject.toLowerCase().includes(logSearch.toLowerCase());
    const matchesStatus = logFilter === 'all' || log.status === logFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Controls */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 lg:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Email Alerts Service</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  emailAlertsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {emailAlertsEnabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Automated SMTP transactional messaging for safety alerts, dispatch triggers, and daily reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenTestModal('email')}
              className="px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Email</span>
            </button>

            <button
              onClick={toggleEmailAlerts}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-2xs ${
                emailAlertsEnabled 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                  : 'bg-[#065F46] hover:bg-[#044E3A] text-white'
              }`}
            >
              {emailAlertsEnabled ? 'Disable Service' : 'Enable Service'}
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
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
            <span>Rules Configuration ({emailRules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'templates'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Email Templates ({emailTemplates.length})</span>
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
            <span>Delivery Logs ({emailLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('provider')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'provider'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Provider & SMTP Settings</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Rules Configuration */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Configured Email Trigger Rules</h3>
              <p className="text-xs text-gray-500">Rules evaluate real-time food inspections, storage sensor limits, and dispatch SLAs.</p>
            </div>
            <button 
              onClick={() => onEditRule({
                id: `er-${Date.now()}`,
                name: '',
                trigger: 'On Analysis Submission',
                condition: '',
                recipientGroup: 'Officers',
                enabled: true,
                severity: 'High'
              })}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#065F46] border border-emerald-200/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {emailRules.map((rule) => {
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
                        <span className="text-gray-400 font-sans">IF </span>
                        {rule.condition}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleRuleEnabled('email', rule.id)}
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
                      <strong className="text-gray-700">Recipients:</strong> {rule.recipientGroup}
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

      {/* SubTab 2: Templates */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Email Templates Repository</h3>
              <p className="text-xs text-gray-500">Customizable dynamic templates supporting handlebars-style metadata variables.</p>
            </div>
            <button 
              onClick={() => onEditTemplate({
                id: `et-${Date.now()}`,
                name: 'New Custom Template',
                subject: '',
                category: 'Operations',
                body: '',
                variables: [],
                lastModified: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#065F46] border border-emerald-200/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
              <div 
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                      {template.category}
                    </span>
                    <span className="text-[10px] text-gray-400">Updated {template.lastModified}</span>
                  </div>

                  <h4 className="text-xs font-bold text-gray-900 mt-2.5">{template.name}</h4>
                  <p className="text-[11px] text-gray-600 font-medium line-clamp-1 mt-1">
                    <span className="text-gray-400">Subject: </span>{template.subject}
                  </p>

                  <div className="mt-2.5 p-2.5 bg-gray-50/70 rounded-lg border border-gray-100 text-[11px] text-gray-600 line-clamp-3 whitespace-pre-line font-sans">
                    {template.body}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.variables.slice(0, 4).map(v => (
                      <span key={v} className="text-[9px] bg-emerald-50 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-200/60">
                        {`{{${v}}}`}
                      </span>
                    ))}
                    {template.variables.length > 4 && (
                      <span className="text-[9px] text-gray-400 font-mono self-center">
                        +{template.variables.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => onEditTemplate(template)}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Template Preview Modal */}
          {previewTemplate && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900">Email Template Preview</h3>
                  <button 
                    onClick={() => setPreviewTemplate(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Template Name: </span>
                    <span className="font-semibold text-gray-800">{previewTemplate.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Subject Line: </span>
                    <span className="font-mono bg-gray-50 px-2 py-1 rounded border block mt-1 text-gray-800">
                      {previewTemplate.subject}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Email Body: </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-60 overflow-y-auto">
                      {previewTemplate.body}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setPreviewTemplate(null);
                      onOpenTestModal('email');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#065F46] hover:bg-[#044E3A] rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test with This Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipient email or subject..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'Delivered', 'Pending', 'Failed', 'Bounced'] as const).map((status) => (
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
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Rule</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredLogs.map((log) => {
                    const statusBadge = {
                      Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
                      Failed: 'bg-rose-50 text-rose-700 border-rose-200',
                      Bounced: 'bg-purple-50 text-purple-700 border-purple-200'
                    }[log.status];

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{log.recipient}</td>
                        <td className="px-4 py-3 max-w-xs truncate text-gray-600">{log.subject}</td>
                        <td className="px-4 py-3 text-[11px] text-gray-500">{log.ruleName}</td>
                        <td className="px-4 py-3 text-[11px] text-gray-400">{log.timestamp}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                            {log.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                            {log.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {(log.status === 'Failed' || log.status === 'Bounced') && <XCircle className="w-3 h-3" />}
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => resendEmailLog(log.id)}
                            className="text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1 hover:underline"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Resend</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No email logs matching current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Provider & SMTP Settings */}
      {activeSubTab === 'provider' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Primary SMTP Provider Gateway</h3>
              <p className="text-xs text-gray-500">Live configuration for transactional message routing.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Status: Connected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-gray-500 font-medium block mb-1">Host Server</label>
              <input 
                type="text" 
                defaultValue={emailProvider.host} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800"
              />
            </div>
            <div>
              <label className="text-gray-500 font-medium block mb-1">Port</label>
              <input 
                type="number" 
                defaultValue={emailProvider.port} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800"
              />
            </div>
            <div>
              <label className="text-gray-500 font-medium block mb-1">Authenticated Sender Identity</label>
              <input 
                type="email" 
                defaultValue={emailProvider.authEmail} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800"
              />
            </div>
            <div>
              <label className="text-gray-500 font-medium block mb-1">Security Protocol</label>
              <input 
                type="text" 
                defaultValue="STARTTLS / TLS 1.3 Verified" 
                disabled 
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {connSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{connSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">Gateway Uptime: {emailProvider.uptime}</span>
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Testing Socket Ping...' : 'Test SMTP Connection'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
