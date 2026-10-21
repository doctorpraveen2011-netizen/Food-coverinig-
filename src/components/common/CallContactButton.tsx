import React, { useState } from 'react';
import { Phone, MessageSquare, Copy, Check, Radio, AlertCircle } from 'lucide-react';
import { 
  normalizePhone, 
  normalizeWhatsAppNumber, 
  buildWhatsAppClickToChatUrl 
} from '../../utils/phoneUtils';
import { useTelecomStore } from '../../store/useTelecomStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getBackendUrl } from '../../utils/apiConfig';

interface CallContactButtonProps {
  label?: string;
  phoneNumber?: string | null;
  contactName?: string;
  role?: string;
  donationId?: string;
  referenceId?: string;
  context?: 'donation' | 'complaint' | 'volunteer' | 'tracking' | 'supermarket' | 'general' | string;
  storeRepresentative?: string;
  storeName?: string;
  variant?: 'compact' | 'standard' | 'full';
  className?: string;
  onWhatsAppOpened?: () => void;
}

export default function CallContactButton({
  label = 'Call',
  phoneNumber,
  contactName = 'Praveen',
  role = 'Complainant Citizen',
  donationId,
  referenceId,
  context = 'complaint',
  storeRepresentative,
  storeName,
  variant = 'compact',
  className = '',
  onWhatsAppOpened
}: CallContactButtonProps) {
  const [copied, setCopied] = useState(false);
  const [openingWhatsApp, setOpeningWhatsApp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);

  const refId = referenceId || donationId;
  const inferredContext = context || (referenceId ? 'complaint' : (donationId ? 'donation' : 'general'));

  const norm = normalizePhone(phoneNumber || null, {
    contactName,
    role,
    context: inferredContext,
    referenceId: refId
  });

  const startCall = useTelecomStore((s) => s.startCall);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!norm.formattedDisplay || norm.formattedDisplay === 'Unavailable') return;
    navigator.clipboard.writeText(norm.cellularHref.replace('tel:', '') || norm.digits);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVoiceCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const destination = norm.cleanDestination || (norm.digits ? `+91${norm.digits}` : (phoneNumber ? String(phoneNumber) : ''));
    if (!destination) {
      setErrorMessage('Phone number is unavailable for in-app call.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    startCall({
      to: destination,
      contactName,
      role,
      donationId: refId
    });
  };

  const handleWhatsAppContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Phone number validation
    const normalizedNumber = normalizeWhatsAppNumber(phoneNumber);
    if (!normalizedNumber) {
      setErrorMessage('WhatsApp contact number is unavailable for this complainant.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setOpeningWhatsApp(true);

    // 2. Build real dynamic message
    const representative = storeRepresentative || currentUser?.fullName || currentUser?.username || 'Rajesh Mehta (Store Lead)';
    const store = storeName || currentUser?.supermarket?.name || 'FreshMart Supermarkets';

    const result = buildWhatsAppClickToChatUrl({
      phone: phoneNumber,
      consumerName: contactName,
      storeRepresentative: representative,
      storeName: store,
      complaintReference: refId
    });

    if (!result?.url) {
      setErrorMessage('WhatsApp contact number is unavailable for this complainant.');
      setOpeningWhatsApp(false);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    // 3. Open the REAL WhatsApp conversation in a new window/tab
    try {
      window.open(result.url, '_blank', 'noopener,noreferrer');
      if (onWhatsAppOpened) onWhatsAppOpened();
    } catch {
      window.location.assign(result.url);
    }

    // 4. Record real audit event asynchronously
    if (refId) {
      try {
        const backendUrl = getBackendUrl();
        if (backendUrl) {
          fetch(`${backendUrl}/api/supermarket/complaints/${refId}/contact-audit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ contactMethod: 'whatsapp' }),
            signal: AbortSignal.timeout(2000)
          }).catch(() => {});
        }
      } catch {}
    }

    setTimeout(() => {
      setOpeningWhatsApp(false);
    }, 1200);
  };

  const cellularHref = norm.cellularHref || (normalizeWhatsAppNumber(phoneNumber) ? `tel:+${normalizeWhatsAppNumber(phoneNumber)}` : '');

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
          {/* Action 1: Real WhatsApp Contact */}
          <button
            type="button"
            onClick={handleWhatsAppContact}
            disabled={openingWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-80"
            title="Open this complainant in WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>{openingWhatsApp ? 'Opening WhatsApp...' : 'WhatsApp Contact'}</span>
          </button>

          {/* Action 2: In-App VoIP Call */}
          <button
            type="button"
            onClick={handleVoiceCall}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Place real-time in-app VoIP call"
          >
            <Radio className="w-3 h-3 text-emerald-200" />
            <span>In-App Call</span>
          </button>

          {/* Action 3: Normal Phone Call */}
          {cellularHref ? (
            <a
              href={cellularHref}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              title="Call phone number"
            >
              <Phone className="w-3 h-3 text-slate-600" />
              <span>Phone</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('Phone number is unavailable for dialing.');
                setTimeout(() => setErrorMessage(null), 3000);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium border border-slate-200 cursor-not-allowed"
              title="Phone number unavailable"
            >
              <Phone className="w-3 h-3" />
              <span>Phone</span>
            </button>
          )}

          {/* Quick Copy */}
          {norm.formattedDisplay && norm.formattedDisplay !== 'Unavailable' && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Copy exact phone number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Validation Notice Alert */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Full / standard view
  return (
    <div className={`flex flex-col gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{contactName || label}:</span>
        <span className="font-mono font-bold text-slate-900">{norm.formattedDisplay}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Real WhatsApp Contact */}
        <button
          type="button"
          onClick={handleWhatsAppContact}
          disabled={openingWhatsApp}
          className="py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-80"
          title="Open this complainant in WhatsApp"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>{openingWhatsApp ? 'Opening WhatsApp...' : 'WhatsApp Contact'}</span>
        </button>

        {/* Real-time In-App VoIP Call */}
        <button
          type="button"
          onClick={handleVoiceCall}
          className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          title="Place real-time in-app VoIP call"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>In-App Call</span>
        </button>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-500">
        {cellularHref ? (
          <a
            href={cellularHref}
            className="hover:text-slate-800 flex items-center gap-1 underline underline-offset-2"
            title="Call phone number"
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span>Call phone number</span>
          </a>
        ) : (
          <span className="text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>Phone unavailable</span>
          </span>
        )}

        {norm.formattedDisplay && norm.formattedDisplay !== 'Unavailable' && (
          <button
            type="button"
            onClick={handleCopy}
            className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      {/* Validation Notice Alert */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
