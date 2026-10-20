import { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  ExternalLink 
} from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';

export const SendEmailModal = () => {
  const { 
    isEmailModalOpen, 
    closeEmailModal, 
    selectedComplaintId, 
    complaints, 
    sendOfficialEmail 
  } = useComplaintsStore();

  const complaint = complaints.find((c) => c.id === selectedComplaintId);

  const [subject, setSubject] = useState(
    complaint ? `[Official Notice] Food Safety Inquiry — Case #${complaint.id}` : ''
  );
  const [bodyText, setBodyText] = useState(
    complaint
      ? `Dear ${complaint.reporter.name},

This is an official communication from the FoodCovering Safety Administration regarding your complaint (${complaint.id}) regarding ${complaint.productName} purchased at ${complaint.seller}.

Your complaint has been assigned to Investigation Officer ${complaint.assignedOfficer} and is currently under active field review.

To expedite laboratory testing or merchant inspection, please reply with:
1. Photograph of product batch code / packaging expiry stamp
2. Retail purchase receipt / digital billing copy
3. Condition of storage prior to consumption

Regards,
${complaint.assignedOfficer}
Food Safety Investigation Division
FoodCovering Administration Portal`
      : ''
  );
  const [isSending, setIsSending] = useState(false);

  if (!isEmailModalOpen || !complaint) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    await sendOfficialEmail(complaint.id, subject, bodyText);
    setIsSending(false);
    closeEmailModal();
  };

  const handleExternalMailto = () => {
    const s = encodeURIComponent(subject);
    const b = encodeURIComponent(bodyText);
    window.location.href = `mailto:${complaint.reporter.email}?subject=${s}&body=${b}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Dispatch Official Inspection Notice</h3>
              <p className="text-xs text-gray-500">Case #{complaint.id} • Complainant: {complaint.reporter.name}</p>
            </div>
          </div>

          <button
            onClick={closeEmailModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">To (Complainant Email)</label>
            <input
              type="text"
              readOnly
              value={complaint.reporter.email}
              className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl font-mono text-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Subject Header *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Official Notice Content *</label>
            <textarea
              rows={8}
              required
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <button
              type="button"
              onClick={handleExternalMailto}
              className="px-3.5 py-2 text-blue-700 hover:bg-blue-50 rounded-xl transition-colors font-medium flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Desktop Email Client</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEmailModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending...' : 'Dispatch Official Notice'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
