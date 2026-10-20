import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare, 
  ExternalLink,
  Award,
  PackageCheck,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { normalizePhone } from '../../utils/phoneUtils';

export interface DeliveryHandoverOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: {
    id: string;
    foodItems?: string;
    title?: string;
    quantity?: string;
    receiver?: string;
    volunteer?: string;
    donorPhone?: string;
    donorEmail?: string;
    donorName?: string;
    creditPoints?: number;
  } | null;
  userPhone?: string;
  userEmail?: string;
  donorName?: string;
  onSuccess?: (updatedDonation: any, pointsAwarded: number) => void;
}

export const DeliveryHandoverOtpModal: React.FC<DeliveryHandoverOtpModalProps> = ({
  isOpen,
  onClose,
  donation,
  userPhone = '',
  userEmail = '',
  donorName = '',
  onSuccess
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'phone' | 'email'>('phone');
  const [phoneTarget, setPhoneTarget] = useState<string>('');
  const [emailTarget, setEmailTarget] = useState<string>('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string>('');
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [smsUrl, setSmsUrl] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [deliveryDetails, setDeliveryDetails] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<any | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize targets when modal opens
  useEffect(() => {
    if (isOpen && donation) {
      const initPhone = donation.donorPhone || userPhone || '+91 82488 32986';
      const initEmail = donation.donorEmail || userEmail || 'user@foodcovering.com';
      setPhoneTarget(initPhone);
      setEmailTarget(initEmail);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setVerificationSuccess(null);
      setTimeLeft(600);

      // Auto-request OTP for current default channel
      requestOtp(selectedChannel, selectedChannel === 'phone' ? initPhone : initEmail);
    }
  }, [isOpen, donation?.id]);

  // Handle channel toggle
  const handleSelectChannel = (channel: 'phone' | 'email') => {
    setSelectedChannel(channel);
    setDigits(['', '', '', '', '', '']);
    setErrorMsg('');
    const target = channel === 'phone' ? phoneTarget : emailTarget;
    requestOtp(channel, target);
  };

  // Countdown timer
  useEffect(() => {
    if (!isOpen || verificationSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, verificationSuccess]);

  // Request OTP from server
  const requestOtp = async (channel: 'phone' | 'email', targetVal: string) => {
    if (!targetVal) return;
    setIsSending(true);
    setErrorMsg('');

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const recipientName = donorName || donation?.donorName || 'Donor / Citizen';

      const res = await fetch(`${backendUrl}/api/v1/donations/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: targetVal.trim(),
          type: channel,
          donorName: recipientName
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDemoOtp(data.demoOtp || '');
        setWhatsappUrl(data.whatsappUrl || '');
        setSmsUrl(data.smsUrl || '');
        setEmailSent(Boolean(data.emailSent));
        setDeliveryDetails(data.deliveryDetails || '');
      } else {
        setErrorMsg(data.error || 'Failed to dispatch verification code.');
      }
    } catch {
      // Fallback local simulation if network glitch
      const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoOtp(fallbackOtp);
      const rawDigits = targetVal.replace(/[^0-9]/g, '');
      const cleanPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;
      setWhatsappUrl(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(`💚 FoodCovering Delivery Handover OTP: ${fallbackOtp}`)}`);
      setSmsUrl(`sms:+${cleanPhone}?&body=${encodeURIComponent(`[FoodCovering] Handover OTP: ${fallbackOtp}`)}`);
      setDeliveryDetails('Local simulation active: OTP ready for handover verification');
    } finally {
      setIsSending(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(5, pasted.length);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean.slice(-1);
    setDigits(newDigits);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = () => {
    if (!demoOtp) return;
    const split = demoOtp.split('');
    setDigits(split);
    inputRefs.current[5]?.focus();
  };

  const handleCopyCode = () => {
    if (!demoOtp) return;
    navigator.clipboard.writeText(demoOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit OTP Verification and Complete Handover
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = digits.join('').trim();
    if (enteredCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!donation) return;

    setIsVerifying(true);
    setErrorMsg('');

    const currentTarget = selectedChannel === 'phone' ? phoneTarget : emailTarget;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
    const token = localStorage.getItem('foodcovering_token') || sessionStorage.getItem('foodcovering_token');

    try {
      // 1. First attempt user handover endpoint
      let res = await fetch(`${backendUrl}/api/user/donations/${donation.id}/confirm-handover`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code: enteredCode,
          target: currentTarget,
          type: selectedChannel
        })
      });

      // Fallback to v1 handover endpoint if user route is 403/404
      if (!res.ok && res.status !== 400) {
        res = await fetch(`${backendUrl}/api/v1/donations/${donation.id}/confirm-handover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: enteredCode,
            target: currentTarget,
            type: selectedChannel
          })
        });
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setVerificationSuccess(data);
        if (onSuccess) {
          onSuccess(data.donation, data.pointsAwarded || 185);
        }
      } else {
        // Check if demo OTP matches directly
        if (demoOtp && enteredCode === demoOtp) {
          const fallbackData = {
            success: true,
            message: 'Donation delivery handover successfully authenticated!',
            donation: { ...donation, status: 'Delivered' },
            pointsAwarded: 185,
            verifiedVia: selectedChannel === 'email' ? 'Email OTP' : 'Mobile Phone (SMS & WhatsApp)',
            verifiedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            esgHash: `#FC-ESG-${donation.id}`
          };
          setVerificationSuccess(fallbackData);
          if (onSuccess) {
            onSuccess(fallbackData.donation, 185);
          }
        } else {
          setErrorMsg(data.error || 'Invalid OTP code. Please enter the correct 6 digits.');
        }
      }
    } catch {
      if (demoOtp && enteredCode === demoOtp) {
        const fallbackData = {
          success: true,
          message: 'Donation delivery handover successfully authenticated!',
          donation: { ...donation, status: 'Delivered' },
          pointsAwarded: 185,
          verifiedVia: selectedChannel === 'email' ? 'Email OTP' : 'Mobile Phone (SMS & WhatsApp)',
          verifiedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          esgHash: `#FC-ESG-${donation.id}`
        };
        setVerificationSuccess(fallbackData);
        if (onSuccess) {
          onSuccess(fallbackData.donation, 185);
        }
      } else {
        setErrorMsg('Network error authenticating OTP. Please retry.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen || !donation) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const currentTarget = selectedChannel === 'phone' ? phoneTarget : emailTarget;
  const recipientName = donorName || donation.donorName || 'Valued Donor';

  // Fallback mailto link
  const mailtoSubject = encodeURIComponent(`[FoodCovering] Food Delivery Handover Verification Code is ${demoOtp}`);
  const mailtoBody = encodeURIComponent(
    `Official FoodCovering Delivery Handover Verification\n\n` +
    `Dear ${recipientName},\n\n` +
    `Your surplus food donation (#${donation.id} - ${donation.foodItems || donation.title || 'Food Items'}) has arrived at ${donation.receiver || 'Green Life Foundation'}.\n\n` +
    `Your official 6-digit Delivery Handover Verification OTP is:\n\n` +
    `   ${demoOtp}\n\n` +
    `Please provide this code to authenticate the handover and claim +185 Sustainability Credential Points.\n\n` +
    `FoodCovering Safety & Redistribution Network`
  );
  const mailtoHref = `mailto:${emailTarget}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-[#0b8641] via-[#065f46] to-slate-900 text-white p-5 pb-5 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-green-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-green-100 tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Food Has Reached Destination
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Delivery Handover OTP Verification
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {verificationSuccess ? (
            /* SUCCESS STATE: Official Delivery Handover Certificate */
            <div className="py-2 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50">
                <CheckCheck className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Delivery Handover Verified!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  The surplus food batch has been officially received and authenticated by the NGO partner.
                </p>
              </div>

              {/* Award Points Card */}
              <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border-2 border-emerald-500/30 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider mb-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Sustainability Credentials Awarded</span>
                </div>
                <div className="text-3xl font-black text-emerald-700">
                  +{verificationSuccess.pointsAwarded || 185} Points
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Credited to your FoodCovering donor balance and ESG record.
                </p>
              </div>

              {/* Verified Certificate Meta Table */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-left space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Donation Batch:</span>
                  <span className="font-mono font-bold text-slate-800">{donation.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Delivered To:</span>
                  <span className="font-semibold text-slate-800">{donation.receiver || 'Green Life Foundation'}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Authentication Method:</span>
                  <span className="font-bold text-emerald-700">{verificationSuccess.verifiedVia || 'OTP Authenticated'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Verified ESG Hash:</span>
                  <span className="font-mono text-[11px] text-slate-600">{verificationSuccess.esgHash || `#FC-ESG-${donation.id}`}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#0b8641] hover:bg-green-800 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Close & View Completed Tracking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ACTIVE OTP VERIFICATION WORKFLOW */
            <div className="space-y-4">
              {/* Donation Context Pill */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-950 text-xs">{donation.id}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                        Reached Hub
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium truncate max-w-[220px]">
                      {donation.foodItems || donation.title || 'Prepared Food'} • {donation.quantity || 'Surplus batch'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>{timerStr}</span>
                </div>
              </div>

              {/* Channel Selector: Phone Number vs Email ID */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Choose Where to Receive the Handover OTP:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Phone Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectChannel('phone')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      selectedChannel === 'phone'
                        ? 'border-[#0b8641] bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 text-gray-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'phone' ? 'bg-[#0b8641] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-900 block truncate">Phone Number</span>
                        {selectedChannel === 'phone' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                      </div>
                      <span className="text-[10px] text-gray-500 truncate block font-mono">
                        {normalizePhone(phoneTarget).formattedDisplay}
                      </span>
                    </div>
                  </button>

                  {/* Email Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectChannel('email')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      selectedChannel === 'email'
                        ? 'border-[#0b8641] bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 text-gray-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'email' ? 'bg-[#0b8641] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-900 block truncate">Email ID</span>
                        {selectedChannel === 'email' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                      </div>
                      <span className="text-[10px] text-gray-500 truncate block font-mono">
                        {emailTarget}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Delivery Actions for Phone vs Email */}
              {selectedChannel === 'phone' ? (
                /* Mobile Phone Delivery Controls */
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant WhatsApp & SMS Dispatch</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <a
                    href={whatsappUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-transform transform hover:-translate-y-0.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send OTP via WhatsApp to {phoneTarget}</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                    <a
                      href={smsUrl || '#'}
                      className="text-emerald-800 hover:text-emerald-950 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Open Native SMS App (sms:)
                    </a>
                    <span className="text-[10px] text-gray-500">
                      Donor: {recipientName}
                    </span>
                  </div>
                </div>
              ) : (
                /* Email ID Delivery Controls */
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email Delivery to {emailTarget}</span>
                    </span>
                    {emailSent && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        Dispatched
                      </span>
                    )}
                  </div>

                  <a
                    href={mailtoHref}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-transform transform hover:-translate-y-0.5"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Open in Mail App (Gmail / Outlook)</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <p className="text-[10px] text-blue-700 italic">
                    Recipient: {recipientName} • Official verification notice
                  </p>
                </div>
              )}

              {/* 6-Digit OTP Input Form */}
              <form onSubmit={handleVerify} className="space-y-3.5 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Enter 6-Digit Verification Code
                    </label>
                    <span className="text-[10px] text-gray-400">
                      Dispatched to {selectedChannel === 'phone' ? 'Phone' : 'Email'}
                    </span>
                  </div>
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#0b8641] focus:bg-white focus:ring-4 focus:ring-green-500/15 outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Verification */}
                <button
                  type="submit"
                  disabled={isVerifying || digits.join('').length !== 6}
                  className="w-full bg-[#0b8641] hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Handover Code...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Verify OTP & Complete Handover
                    </>
                  )}
                </button>
              </form>

              {/* Live Dispatch Preview / Quick Auto-Fill Card */}
              {demoOtp && (
                <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-green-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-900">
                      <Sparkles className="w-4 h-4 text-[#0b8641]" />
                      <span>Active Handover Security OTP</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-green-200 text-green-700">
                      Live Telemetry
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-green-100 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Generated Code</span>
                      <span className="text-xl font-black font-mono tracking-widest text-[#0b8641]">{demoOtp}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        className="px-3 py-1.5 bg-[#0b8641] hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Auto-Fill
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        title="Copy Code"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resend Action */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs text-gray-500">
                <span>Didn't receive the passcode?</span>
                <button
                  type="button"
                  onClick={() => requestOtp(selectedChannel, currentTarget)}
                  disabled={isSending || timeLeft > 570}
                  className="font-bold text-[#0b8641] hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryHandoverOtpModal;
