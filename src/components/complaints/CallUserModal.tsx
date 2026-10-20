import { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';
import { normalizePhone } from '../../utils/phoneUtils';

export const CallUserModal = () => {
  const { 
    isCallModalOpen, 
    closeCallModal, 
    selectedComplaintId, 
    complaints, 
    logCallOutcome 
  } = useComplaintsStore();

  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('connected');
  const [isMuted, setIsMuted] = useState(false);
  const [outcome, setOutcome] = useState('Complainant Confirmed Contamination & Details');
  const [callNotes, setCallNotes] = useState('Complainant confirmed purchasing item; described distinct foul odor and onset of cramps. Agreed to preserve product sample for officer collection.');
  const [autoVerify, setAutoVerify] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const complaint = complaints.find((c) => c.id === selectedComplaintId);

  useEffect(() => {
    if (!isCallModalOpen) return;
    setCallDuration(0);
    setCallState('connected');
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCallModalOpen]);

  if (!isCallModalOpen || !complaint) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinishCall = async () => {
    setIsSaving(true);
    await logCallOutcome(complaint.id, outcome, callNotes, autoVerify);
    setIsSaving(false);
    closeCallModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Calling Header Banner */}
        <div className="bg-slate-900 text-white p-6 relative flex flex-col items-center justify-center text-center">
          <button
            onClick={closeCallModal}
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Pulsing Avatar */}
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-emerald-500/30 animate-pulse">
              <PhoneCall className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-lg font-bold tracking-tight">{complaint.reporter.name}</h3>
          <p className="text-emerald-400 font-mono text-xs mt-0.5">{complaint.reporter.phone}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${callState === 'ended' ? 'bg-red-400' : 'bg-emerald-400 animate-ping'}`}></span>
            <span className="text-xs text-slate-300 font-medium">
              {callState === 'ended' ? 'Line Terminated' : `Secure VoIP Line Connected • ${formatDuration(callDuration)}`}
            </span>
          </div>

          {/* Telecom Controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-full transition-colors ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Microphone"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            {/* Direct Cellular Dialer without %20 corruption */}
            <a
              href={normalizePhone(complaint.reporter.phone).cellularHref}
              className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
              title="Open Cellular Dialer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            {/* WhatsApp Direct Call */}
            <a
              href={normalizePhone(complaint.reporter.phone, {
                contactName: complaint.reporter.name,
                role: 'Complainant Citizen',
                context: 'complaint',
                referenceId: complaint.id
              }).whatsappCallHref}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-green-600/80 hover:bg-green-600 text-white transition-colors flex items-center gap-1 text-xs"
              title={`Open ${complaint.reporter.name} in WhatsApp`}
            >
              <MessageSquare className="w-4 h-4 fill-current" />
            </a>
            <button
              onClick={() => setCallState('ended')}
              className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="End Line"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Case Context & Disposition Form */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between font-semibold text-gray-900 mb-1">
              <span>Case Reference: {complaint.id}</span>
              <span className="text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-[10px]">
                {complaint.foodType}
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              Product: <strong>{complaint.productName}</strong> at <strong>{complaint.seller}</strong>
            </p>
          </div>

          {/* Disposition Outcome */}
          <div>
            <label className="block font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
              Call Disposition Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="Complainant Confirmed Contamination & Details">
                ✅ Confirmed Issue & Detailed Symptoms
              </option>
              <option value="Requested On-Site Inspector Sample Collection">
                📦 Requested On-Site Food Sample Collection
              </option>
              <option value="Consumer Refund & Product Replacement Requested">
                💳 Consumer Refund / Merchant Resolution Inquired
              </option>
              <option value="Complainant Scheduled Detailed Follow-up">
                ⏳ Follow-up Call Scheduled
              </option>
              <option value="False Alarm / Self-Resolved">
                ℹ️ User Clarified Misunderstanding / Non-Hazardous
              </option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-1.5">
              Telephonic Investigation Log Note
            </label>
            <textarea
              rows={3}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Record complainant statements, willingness to hand over sample, receipt confirmation..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Auto-verify checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoVerify"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
            />
            <label htmlFor="autoVerify" className="text-gray-700 font-medium cursor-pointer">
              Mark Complainant Phone as <strong>Audited & Verified</strong>
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              onClick={closeCallModal}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Dismiss
            </button>
            <button
              onClick={handleFinishCall}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Logging...' : 'Save Call Log & Update Case'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
