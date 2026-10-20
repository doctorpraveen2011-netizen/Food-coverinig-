import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';
import type { EmailTemplate, SmsTemplate } from '../../store/useAlertsStore';

interface TemplateEditorModalProps {
  emailTemplate: EmailTemplate | null;
  smsTemplate: SmsTemplate | null;
  onClose: () => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  emailTemplate,
  smsTemplate,
  onClose
}) => {
  if (!emailTemplate && !smsTemplate) return null;

  const { saveEmailTemplate, saveSmsTemplate } = useAlertsStore();

  const isEmail = !!emailTemplate;

  // Email form states
  const [eName, setEName] = useState(emailTemplate?.name || '');
  const [eSubject, setESubject] = useState(emailTemplate?.subject || '');
  const [eCategory, setECategory] = useState(emailTemplate?.category || 'Operations');
  const [eBody, setEBody] = useState(emailTemplate?.body || '');

  // SMS form states
  const [sName, setSName] = useState(smsTemplate?.name || '');
  const [sCategory, setSCategory] = useState(smsTemplate?.category || 'Urgent');
  const [sBody, setSBody] = useState(smsTemplate?.body || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmail && emailTemplate) {
      saveEmailTemplate({
        ...emailTemplate,
        name: eName,
        subject: eSubject,
        category: eCategory as any,
        body: eBody,
        lastModified: new Date().toISOString().split('T')[0]
      });
    } else if (smsTemplate) {
      saveSmsTemplate({
        ...smsTemplate,
        name: sName,
        category: sCategory as any,
        body: sBody,
        charCount: sBody.length,
        segments: Math.ceil(sBody.length / 160) || 1,
        lastModified: new Date().toISOString().split('T')[0]
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {isEmail ? 'Edit Email Template' : 'Edit SMS Message Template'}
              </h3>
              <p className="text-[11px] text-gray-500">Configure message content and dynamic parameters.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {isEmail ? (
            <>
              <div>
                <label className="text-gray-600 font-medium block mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 font-medium block mb-1">Category</label>
                  <select
                    value={eCategory}
                    onChange={(e) => setECategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Operations">Operations</option>
                    <option value="Donation">Donation</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Digest">Digest</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 font-medium block mb-1">Subject Line</label>
                  <input
                    type="text"
                    required
                    value={eSubject}
                    onChange={(e) => setESubject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 font-medium block mb-1">Email Body (Markdown / Plain Text)</label>
                <textarea
                  rows={6}
                  required
                  value={eBody}
                  onChange={(e) => setEBody(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-gray-600 font-medium block mb-1">SMS Template Name</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-600 font-medium block mb-1">Category</label>
                <select
                  value={sCategory}
                  onChange={(e) => setSCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="Verification">Verification</option>
                  <option value="Status">Status</option>
                  <option value="Reminder">Reminder</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-600 font-medium">SMS Message Body</label>
                  <span className="text-[11px] font-mono text-gray-500">
                    {sBody.length} chars ({Math.ceil(sBody.length / 160) || 1} segment)
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={sBody}
                  onChange={(e) => setSBody(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

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
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
