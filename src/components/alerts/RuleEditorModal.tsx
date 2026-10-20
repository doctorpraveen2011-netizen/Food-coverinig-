import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';
import type { AlertRule } from '../../store/useAlertsStore';

interface RuleEditorModalProps {
  rule: AlertRule | null;
  onClose: () => void;
  channel: 'email' | 'sms' | 'assign';
}

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({ rule, onClose, channel }) => {
  if (!rule) return null;

  const { emailRules, smsRules } = useAlertsStore();

  const [name, setName] = useState(rule.name);
  const [trigger, setTrigger] = useState(rule.trigger);
  const [condition, setCondition] = useState(rule.condition);
  const [recipientGroup, setRecipientGroup] = useState(rule.recipientGroup);
  const [severity, setSeverity] = useState(rule.severity);
  const [enabled, setEnabled] = useState(rule.enabled);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === 'email') {
      const exists = emailRules.some(r => r.id === rule.id);
      const updatedRule = { ...rule, name, trigger, condition, recipientGroup, severity, enabled };
      useAlertsStore.setState((state) => ({
        emailRules: exists 
          ? state.emailRules.map(r => r.id === rule.id ? updatedRule : r)
          : [updatedRule, ...state.emailRules]
      }));
    } else if (channel === 'sms') {
      const exists = smsRules.some(r => r.id === rule.id);
      const updatedRule = { ...rule, name, trigger, condition, recipientGroup, severity, enabled };
      useAlertsStore.setState((state) => ({
        smsRules: exists 
          ? state.smsRules.map(r => r.id === rule.id ? updatedRule : r)
          : [updatedRule, ...state.smsRules]
      }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{rule.name ? 'Edit Alert Rule' : 'Create New Alert Rule'}</h3>
              <p className="text-[11px] text-gray-500">Define evaluation thresholds and target audience.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-600 font-medium block mb-1">Rule Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Critical Spoilage Risk Warning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-600 font-medium block mb-1">Trigger Event</label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="On Analysis Submission">On Analysis Submission</option>
                <option value="Timer Exceeded">Timer Exceeded (SLA)</option>
                <option value="Donation Created">Donation Created</option>
                <option value="Temperature Exceeded">Sensor Limit Exceeded</option>
                <option value="Automated Dispatch Match">Automated Dispatch Match</option>
                <option value="Cron Schedule">Cron Schedule (Daily)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-600 font-medium block mb-1">Severity Tier</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-600 font-medium block mb-1">Condition Expression</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Quality Score < 60% OR High Bacteria Risk"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-gray-600 font-medium block mb-1">Recipient Target Group</label>
            <input
              type="text"
              required
              placeholder="e.g. Municipal Health Directorate & On-Duty Officers"
              value={recipientGroup}
              onChange={(e) => setRecipientGroup(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rule-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded accent-emerald-600"
            />
            <label htmlFor="rule-enabled" className="text-xs text-gray-700 font-medium cursor-pointer">
              Enable this rule immediately upon saving
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#065F46] hover:bg-[#044E3A] rounded-xl shadow-xs"
            >
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
