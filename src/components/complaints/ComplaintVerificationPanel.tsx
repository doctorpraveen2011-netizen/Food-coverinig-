import { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  FileText, 
  Info, 
  CheckCircle2,
  MessageSquare,
  Printer,
  Edit2,
  Save
} from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';
import { normalizePhone, normalizeWhatsAppNumber } from '../../utils/phoneUtils';

export const ComplaintVerificationPanel = () => {
  const { 
    complaints, 
    selectedComplaintId, 
    openDetailModal, 
    openOtpModal, 
    openCallModal,
    openEmailModal,
    openPrintModal,
    setNotification,
    updateReporterContact
  } = useComplaintsStore();

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) || complaints[0];

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Manual Contact Edit State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [cascadeToAll, setCascadeToAll] = useState(true);
  const [savingContact, setSavingContact] = useState(false);

  if (!selectedComplaint) return null;

  const { reporter } = selectedComplaint;

  const startEditContact = () => {
    setEditPhone(reporter.phone || '');
    setEditEmail(reporter.email || '');
    setEditName(reporter.name || '');
    setCascadeToAll(true);
    setIsEditingContact(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhone || !editEmail) return;
    setSavingContact(true);
    const ok = await updateReporterContact(selectedComplaint.id, {
      phone: editPhone,
      email: editEmail,
      name: editName,
      updateAll: cascadeToAll
    });
    setSavingContact(false);
    if (ok) {
      setIsEditingContact(false);
      setNotification({
        text: `Updated contact to ${editPhone} / ${editEmail}${cascadeToAll ? ' across all records' : ''}`,
        type: 'success'
      });
    } else {
      setNotification({ text: 'Failed to update contact details.', type: 'error' });
    }
  };

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      setNotification({ text: `Copied email to clipboard: ${text}`, type: 'info' });
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      setNotification({ text: `Copied phone to clipboard: ${text}`, type: 'info' });
    }
  };

  const handleWhatsApp = () => {
    const cleanPhone = normalizeWhatsAppNumber(selectedComplaint.reporter.phone);
    if (!cleanPhone) {
      setNotification({
        text: 'WhatsApp contact number is unavailable for this complainant.',
        type: 'error'
      });
      return;
    }
    const msg = encodeURIComponent(
      `Hello ${selectedComplaint.reporter.name}, this is ${selectedComplaint.assignedOfficer} from the FoodCovering Safety Administration regarding your complaint ${selectedComplaint.id} for ${selectedComplaint.productName}. Could you share further details or purchase receipts?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col h-fit sticky top-6">
      {/* Panel Heading */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 leading-tight">Verify Complaint Details</h2>
          <p className="text-xs text-gray-500 mt-1">
            Contact the user to confirm the information and take necessary action.
          </p>
        </div>
      </div>

      {/* Selected Complaint ID pill */}
      <div className="mt-4 flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
        <span className="text-gray-500 font-medium">Selected Case:</span>
        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {selectedComplaint.id}
        </span>
      </div>

      {/* Supermarket Cash Refund Status */}
      {selectedComplaint.refundStatus === 'Refunded' && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">💸 Store Cash Refund Settled</span>
            <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px]">
              ₹{selectedComplaint.refundAmount || 150}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Method: <strong>{selectedComplaint.refundMethod || 'Cash'}</strong> • Ref: <span className="font-mono">{selectedComplaint.refundTransactionId || 'REF-CASH'}</span>
          </p>
        </div>
      )}

      {/* Reporter Contact Details */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
          <span className="text-xs font-semibold text-gray-700">Citizen Contact Information</span>
          {!isEditingContact && (
            <button
              onClick={startEditContact}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
              title="Edit mobile number and email manually"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {isEditingContact ? (
          <form onSubmit={handleSaveContact} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Citizen Full Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. +91 8248832986"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Registered Email *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="e.g. user@foodcovering.com"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={cascadeToAll}
                onChange={(e) => setCascadeToAll(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Update across all associated citizen records</span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={savingContact}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingContact ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingContact(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address
                </span>
                {reporter.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => openOtpModal({
                      complaintId: selectedComplaint.id,
                      type: 'email',
                      targetValue: reporter.email,
                      recipientName: reporter.name
                    })}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 underline"
                  >
                    Verify Now
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 rounded-lg border border-gray-200 text-sm text-gray-800">
                <span className="truncate pr-2 font-mono text-xs">{reporter.email}</span>
                <button
                  onClick={() => handleCopy(reporter.email, 'email')}
                  title="Copy email"
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number
                </span>
                {reporter.phoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => openOtpModal({
                      complaintId: selectedComplaint.id,
                      type: 'phone',
                      targetValue: reporter.phone,
                      recipientName: reporter.name
                    })}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 underline"
                  >
                    Verify Now
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 rounded-lg border border-gray-200 text-sm text-gray-800">
                <span className="truncate pr-2 font-mono text-xs">{reporter.phone}</span>
                <button
                  onClick={() => handleCopy(reporter.phone, 'phone')}
                  title="Copy phone"
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                >
                  {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Quick Actions (Live Dispatch)
        </h3>

        <div className="space-y-2.5">
          {/* Call User (In-App VoIP Console) */}
          <button
            onClick={openCallModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            <Phone className="w-4 h-4" />
            <span>Call User (VoIP Console)</span>
          </button>

          {/* Send Email */}
          <button
            onClick={openEmailModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <Mail className="w-4 h-4 text-gray-500" />
            <span>Send Official Notice</span>
          </button>

          {/* WhatsApp Action */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#128C7E] hover:bg-[#075E54] text-white font-medium text-sm rounded-lg transition-colors shadow-2xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Complainant</span>
          </button>

          {/* View Full Details */}
          <button
            onClick={() => openDetailModal(selectedComplaint.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span>View Full Details & Notes</span>
          </button>

          {/* Export Official Case Dossier */}
          <button
            onClick={openPrintModal}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg border border-gray-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Print Official Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* Info Reminder Box */}
      <div className="mt-5 p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Ensure to verify the complaint details before proceeding with investigation or resolution.
        </p>
      </div>
    </div>
  );
};
