import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  RotateCw 
} from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';

interface TestAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannel?: 'email' | 'sms' | 'auto';
}

export const TestAlertModal: React.FC<TestAlertModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultChannel = 'email' 
}) => {
  if (!isOpen) return null;

  const { 
    emailTemplates, 
    smsTemplates, 
    sendTestEmail, 
    sendTestSms, 
    triggerAutoAssignmentBatch 
  } = useAlertsStore();

  const [channel, setChannel] = useState<'email' | 'sms' | 'auto'>(defaultChannel);
  const [recipientEmail, setRecipientEmail] = useState('inspector.safety@foodcovering.org');
  const [recipientPhone, setRecipientPhone] = useState('+91 98765 43210');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResultMessage(null);

    try {
      if (channel === 'email') {
        const res = await sendTestEmail(
          recipientEmail, 
          selectedTemplateId || emailTemplates[0].id, 
          customSubject || undefined
        );
        setResultMessage(res.message);
      } else if (channel === 'sms') {
        const res = await sendTestSms(
          recipientPhone, 
          selectedTemplateId || smsTemplates[0].id
        );
        setResultMessage(res.message);
      } else {
        const res = await triggerAutoAssignmentBatch();
        setResultMessage(res.message);
      }

      setTimeout(() => {
        setResultMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setResultMessage(`Error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Send Test Alert Dispatch</h3>
              <p className="text-[11px] text-gray-500">Verify routing, templates, and delivery pipelines instantaneously.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              channel === 'email'
                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-2xs'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Email Alert</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              channel === 'sms'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>SMS Alert</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('auto')}
            className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              channel === 'auto'
                ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-2xs'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 text-orange-600" />
            <span>Simulate Dispatch</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-4 text-xs">
          {channel === 'email' && (
            <>
              <div>
                <label className="text-gray-600 font-medium block mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-600 font-medium block mb-1">Select Email Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {emailTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-600 font-medium block mb-1">Custom Subject (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to use template subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {channel === 'sms' && (
            <>
              <div>
                <label className="text-gray-600 font-medium block mb-1">Recipient Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-600 font-medium block mb-1">Select SMS Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {smsTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {channel === 'auto' && (
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
              <span className="font-semibold text-orange-900 block">Volunteer Match Engine Simulator</span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Will trigger a mock high-priority food donation intake, analyze available couriers in the volunteer pool, run geofence scoring, and assign the top volunteer in real time.
              </p>
            </div>
          )}

          {resultMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {/* Actions */}
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
              disabled={isSending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#065F46] hover:bg-[#044E3A] rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Dispatch...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Test Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
