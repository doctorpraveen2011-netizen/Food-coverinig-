import { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { usePipelineStore } from '../../store/usePipelineStore';
import { normalizePhone } from '../../utils/phoneUtils';
import { getBackendUrl } from '../../utils/apiConfig';

interface LiveTrackingContactsCardProps {
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export default function LiveTrackingContactsCard({ onNotify }: LiveTrackingContactsCardProps) {
  const { tracking } = usePipelineStore();

  const [donorPhone, setDonorPhone] = useState('+919876543210');
  const [volunteerPhone, setVolunteerPhone] = useState('+919876543210');
  const [receiverPhone, setReceiverPhone] = useState('+919876543212');
  
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (tracking?.contacts) {
      if (tracking.contacts.donor) setDonorPhone(tracking.contacts.donor);
      if (tracking.contacts.volunteer) setVolunteerPhone(tracking.contacts.volunteer);
      if (tracking.contacts.recipient) setReceiverPhone(tracking.contacts.recipient);
    }
  }, [tracking?.contacts]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const backendUrl = getBackendUrl();
        if (!backendUrl) return;
        const res = await fetch(`${backendUrl}/api/v1/settings/contacts`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (data.contacts) {
            setDonorPhone(data.contacts.donor || '+919876543210');
            setVolunteerPhone(data.contacts.volunteer || '+919876543210');
            setReceiverPhone(data.contacts.recipient || '+919876543212');
          }
        }
      } catch (e) {
        // use defaults
      }
    };
    fetchContacts();
  }, []);

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/\s+/g, '');
    return /^\+91[0-9]{10}$/.test(clean);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const dNorm = normalizePhone(donorPhone);
    const vNorm = normalizePhone(volunteerPhone);
    const rNorm = normalizePhone(receiverPhone);

    if (!dNorm.isValid || !vNorm.isValid || !rNorm.isValid) {
      const err = 'Invalid phone format (valid 10-digit Indian mobile number required, e.g. 8248832986 or +91 8248832986).';
      setStatusMessage({ text: err, type: 'error' });
      if (onNotify) onNotify(err, 'error');
      return;
    }

    const dPhone = `+91${dNorm.digits}`;
    const vPhone = `+91${vNorm.digits}`;
    const rPhone = `+91${rNorm.digits}`;

    setIsSaving(true);
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        await fetch(`${backendUrl}/api/v1/settings/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donor: dPhone,
            volunteer: vPhone,
            recipient: rPhone
          }),
          signal: AbortSignal.timeout(2000)
        }).catch(() => {});
      }

      setDonorPhone(dPhone);
      setVolunteerPhone(vPhone);
      setReceiverPhone(rPhone);
      const msg = 'Tracking contacts updated successfully!';
      setStatusMessage({ text: msg, type: 'success' });
      if (onNotify) onNotify(msg, 'success');
    } catch (err: any) {
      const msg = err.message || 'Error updating contacts.';
      setStatusMessage({ text: msg, type: 'error' });
      if (onNotify) onNotify(msg, 'error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Live Tracking Contacts (Admin)</h3>
          <p className="text-[10px] text-gray-500">
            Securely update the active phone numbers for the current live tracking demonstration.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-end">
          {/* Donor Phone */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Donor Phone
            </label>
            <input
              type="tel"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-2.5 py-1.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs text-gray-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
              required
            />
          </div>

          {/* Volunteer Phone */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Volunteer Phone
            </label>
            <input
              type="tel"
              value={volunteerPhone}
              onChange={(e) => setVolunteerPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-2.5 py-1.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs text-gray-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
              required
            />
          </div>

          {/* Receiver Phone */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Receiver Phone
            </label>
            <input
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="+919876543212"
              className="w-full px-2.5 py-1.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs text-gray-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
              required
            />
          </div>

          {/* Save Button */}
          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-70 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer h-[34px]"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Contacts'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
