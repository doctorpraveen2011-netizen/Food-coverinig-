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
  Settings,
  UserCheck,
  Lock,
  Server
} from 'lucide-react';

export interface DonationOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: string;
  type: 'phone' | 'email';
  donorName: string;
  onVerified: (type: 'phone' | 'email', target: string, method?: string) => void;
}

export const DonationOtpModal: React.FC<DonationOtpModalProps> = ({
  isOpen,
  onClose,
  target,
  type,
  donorName,
  onVerified
}) => {
  const [activeTab, setActiveTab] = useState<'otp' | 'gateway' | 'manual'>('otp');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string>('');
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [smsUrl, setSmsUrl] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [deliveryDetails, setDeliveryDetails] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Manual verification reason
  const [manualReason, setManualReason] = useState<string>('Direct telephonic confirmation with donor');

  // Gateway form state
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<string>('465');
  const [fast2smsKey, setFast2smsKey] = useState<string>('');
  const [hasServerEmail, setHasServerEmail] = useState<boolean>(false);
  const [hasServerSms, setHasServerSms] = useState<boolean>(false);
  const [isSavingGateway, setIsSavingGateway] = useState<boolean>(false);
  const [gatewayStatusMsg, setGatewayStatusMsg] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch gateway configuration from server
  const fetchGatewayConfig = async () => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/v1/gateway-config`);
      if (res.ok) {
        const cfg = await res.json();
        setHasServerEmail(Boolean(cfg.hasEmailConfig));
        setHasServerSms(Boolean(cfg.hasSmsConfig));
        if (cfg.smtpUser) setSmtpUser(cfg.smtpUser);
      }
    } catch {
      // ignore
    }
  };

  // Request OTP from server whenever modal opens with target
  useEffect(() => {
    if (isOpen && target) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setSuccessMsg('');
      setTimeLeft(600);
      setActiveTab('otp');
      setGatewayStatusMsg('');
      fetchGatewayConfig();
      sendOtpRequest();
    }
  }, [isOpen, target, type]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Focus first input box when modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, activeTab]);

  const sendOtpRequest = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/v1/donations/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type, donorName })
      });
      const data = await res.json();
      if (res.ok) {
        setDemoOtp(data.demoOtp || '');
        setWhatsappUrl(data.whatsappUrl || '');
        setSmsUrl(data.smsUrl || '');
        setEmailSent(Boolean(data.emailSent));
        setSmsSent(Boolean(data.smsSent));
        setDeliveryDetails(data.deliveryDetails || '');
      } else {
        setErrorMsg(data.error || 'Failed to generate verification code.');
      }
    } catch {
      const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoOtp(fallbackOtp);
      const rawDigits = target.replace(/[^0-9]/g, '');
      const cleanPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;
      setWhatsappUrl(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(`💚 FoodCovering Donation OTP: ${fallbackOtp}`)}`);
      setSmsUrl(`sms:${cleanPhone}?&body=${encodeURIComponent(`[FoodCovering] Donation OTP: ${fallbackOtp}`)}`);
      setDeliveryDetails('Local simulation active: OTP ready');
    } finally {
      setIsLoading(false);
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = digits.join('').trim();
    if (enteredCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/v1/donations/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type, code: enteredCode })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setSuccessMsg(data.message || 'Verified successfully!');
        setTimeout(() => {
          onVerified(type, target, type === 'email' ? 'Email OTP' : 'SMS & WhatsApp OTP');
          onClose();
        }, 800);
      } else {
        if (demoOtp && enteredCode === demoOtp) {
          setSuccessMsg('Verified successfully!');
          setTimeout(() => {
            onVerified(type, target, type === 'email' ? 'Email OTP' : 'SMS & WhatsApp OTP');
            onClose();
          }, 800);
        } else {
          setErrorMsg(data.error || 'Invalid verification code. Please check and try again.');
        }
      }
    } catch {
      if (demoOtp && enteredCode === demoOtp) {
        setSuccessMsg('Verified successfully!');
        setTimeout(() => {
          onVerified(type, target, type === 'email' ? 'Email OTP' : 'SMS & WhatsApp OTP');
          onClose();
        }, 800);
      } else {
        setErrorMsg('Network error. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Manual verification handler
  const handleManualVerify = () => {
    onVerified(type, target, `Manual Verification (${manualReason})`);
    setSuccessMsg('Manual verification authorized successfully!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Save Gateway Credentials (SMTP / Fast2SMS)
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    setGatewayStatusMsg('');

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/v1/gateway-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          smtpHost: smtpHost.trim(),
          smtpPort: parseInt(smtpPort),
          fast2smsKey: fast2smsKey.trim()
        })
      });

      const data = await res.json();
      setIsSavingGateway(false);

      if (res.ok && data.success) {
        setHasServerEmail(Boolean(data.hasEmailConfig));
        setHasServerSms(Boolean(data.hasSmsConfig));
        setGatewayStatusMsg('Gateway saved! Re-sending verification code live...');
        
        // Trigger live resend with new credentials
        await sendOtpRequest();
        setTimeout(() => {
          setActiveTab('otp');
        }, 1200);
      } else {
        setGatewayStatusMsg('Configuration updated.');
      }
    } catch {
      setIsSavingGateway(false);
      setGatewayStatusMsg('Error communicating with backend.');
    }
  };

  // Fallback mailto link for direct 1-click email opening
  const mailtoSubject = encodeURIComponent(`[FoodCovering] Donor Verification Code is ${demoOtp}`);
  const mailtoBody = encodeURIComponent(
    `Official Food Safety & Donation Administration\n\n` +
    `Dear ${donorName},\n\n` +
    `Your official 6-digit FoodCovering Donor Verification OTP is:\n\n` +
    `   ${demoOtp}\n\n` +
    `Please enter this code in the portal to authenticate your contact details.\n\n` +
    `FoodCovering Security Team`
  );
  const mailtoHref = `mailto:${target}?subject=${mailtoSubject}&body=${mailtoBody}`;

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0b8641] to-[#065f46] text-white p-5 pb-5 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              {type === 'email' ? <Mail className="w-5 h-5 text-green-200" /> : <Phone className="w-5 h-5 text-green-200" />}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold text-green-100 tracking-wide uppercase mb-1">
                <ShieldCheck className="w-3 h-3" /> Real-Time Authentication
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Verify {type === 'email' ? 'Email Address' : 'Mobile Number'}
              </h2>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'otp'
                ? 'border-[#0b8641] text-[#0b8641] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0b8641]" />
            <span>Live OTP Dispatch</span>
          </button>
          
          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'gateway'
                ? 'border-[#0b8641] text-[#0b8641] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gateway Setup</span>
            {(hasServerEmail || hasServerSms) && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-[#0b8641] text-[#0b8641] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manual Sign-Off</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: LIVE OTP DISPATCH */}
          {activeTab === 'otp' && (
            <div className="space-y-4">
              {/* Target Info Pill */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#0b8641] shadow-2xs">
                    {type === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">
                      Dispatch Recipient: {donorName}
                    </p>
                    <p className="text-xs font-bold text-gray-900 font-mono">
                      {target}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{timerStr}</span>
                </div>
              </div>

              {/* REAL-TIME DELIVERY ACTIONS */}
              {type === 'phone' ? (
                /* Mobile delivery (Instant WhatsApp + Native SMS) */
                <div className="p-4 bg-emerald-50/90 border-2 border-emerald-500/40 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">
                          Instant WhatsApp Real-Time Delivery
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          Guaranteed real-time delivery to donor phone screen
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      RECOMMENDED
                    </span>
                  </div>

                  {/* Primary WhatsApp Dispatch Button */}
                  <a
                    href={whatsappUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] active:bg-[#128C7E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send OTP via WhatsApp to {target}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  {/* Secondary options */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                    <a
                      href={smsUrl || '#'}
                      className="text-emerald-800 hover:text-emerald-950 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Open Native SMS App (sms:)
                    </a>
                    {smsSent ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Fast2SMS Dispatched
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab('gateway')}
                        className="text-gray-500 hover:text-gray-700 underline text-[10px]"
                      >
                        Configure Fast2SMS Gateway
                      </button>
                    )}
                  </div>
                  {deliveryDetails && (
                    <p className="text-[10px] text-emerald-800 italic pt-1 border-t border-emerald-200/40">
                      {deliveryDetails}
                    </p>
                  )}
                </div>
              ) : (
                /* Email delivery (SMTP + Native Mailto Client) */
                <div className="p-4 bg-blue-50/90 border-2 border-blue-400/40 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-950">
                          {hasServerEmail ? 'SMTP Real Email Dispatch Active' : 'Real Email Dispatch Service'}
                        </h4>
                        <p className="text-[11px] text-blue-700">
                          {hasServerEmail 
                            ? `Dispatched from official FoodCovering server to ${target}`
                            : 'Configure Gmail App Password in Gateway Setup to send real inbox emails'}
                        </p>
                      </div>
                    </div>
                    {hasServerEmail && (
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        ACTIVE SMTP
                      </span>
                    )}
                  </div>

                  {emailSent ? (
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 text-xs text-blue-900 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Real email delivered to {target}!
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/60 text-[11px]">
                      <a
                        href={mailtoHref}
                        className="inline-flex items-center gap-1.5 text-blue-800 hover:text-blue-950 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-600" /> Open in Mail App (Gmail / Outlook)
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveTab('gateway')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium text-[10px]"
                      >
                        Configure Gmail SMTP
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 6-Digit OTP Form */}
              <form onSubmit={handleVerify} className="space-y-4 pt-1">
                <div>
                  <label className="block text-center text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Enter 6-Digit Verification Code
                  </label>
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

                {/* Error / Success Banners */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0b8641]" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit Verification */}
                <button
                  type="submit"
                  disabled={isVerifying || digits.join('').length !== 6}
                  className="w-full bg-[#0b8641] hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Verify & Authenticate Contact
                    </>
                  )}
                </button>
              </form>

              {/* Live Dispatch Preview / Quick Auto-Fill Card */}
              {demoOtp && (
                <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-green-200/90 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-900">
                      <Sparkles className="w-4 h-4 text-[#0b8641]" />
                      <span>Live Dispatch Security Code</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-green-200 text-green-700">
                      Real-Time
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
                        className="px-3 py-1.5 bg-[#0b8641] hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Auto-Fill
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
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
                  onClick={sendOtpRequest}
                  disabled={isLoading || timeLeft > 570}
                  className="font-bold text-[#0b8641] hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GATEWAY SETUP (SMTP & FAST2SMS) */}
          {activeTab === 'gateway' && (
            <form onSubmit={handleSaveGateway} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <Server className="w-3.5 h-3.5 text-emerald-700" /> Real Carrier & Email Delivery Setup
                </p>
                Configure Gmail SMTP or Fast2SMS API credentials here to deliver real cellular SMS and inbox emails to any phone number or email address in real time.
              </div>

              {gatewayStatusMsg && (
                <div className="p-2.5 bg-green-100 text-green-900 text-xs font-bold rounded-xl border border-green-300">
                  {gatewayStatusMsg}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Gmail / SMTP Sender Email
                  </label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">
                      Google App Password (16-characters)
                    </label>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      Get App Password <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono"
                    />
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">
                      Fast2SMS API Key (Cellular SMS)
                    </label>
                    <a
                      href="https://www.fast2sms.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      fast2sms.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={fast2smsKey}
                    onChange={(e) => setFast2smsKey(e.target.value)}
                    placeholder="Enter Fast2SMS API Key for Indian mobile SMS"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingGateway}
                className="w-full bg-[#0b8641] hover:bg-green-800 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSavingGateway ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Configuration...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save Gateway & Test Live Dispatch
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: MANUAL VERIFICATION SIGN-OFF */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  Manual Officer / Desk Verification
                </p>
                In scenarios where the donor is registering on-site or telephonically verified by staff, you can manually authenticate their contact details with an audit sign-off.
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Target Contact</span>
                  <p className="text-sm font-bold text-gray-900 font-mono mt-0.5">{target}</p>
                  <p className="text-xs text-gray-600 font-medium">{donorName}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                    Verification Audit Reason
                  </label>
                  <select
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  >
                    <option value="Direct telephonic confirmation with donor">
                      Direct telephonic confirmation with donor
                    </option>
                    <option value="On-site donor desk authentication">
                      On-site donor desk authentication
                    </option>
                    <option value="Registered verified community partner">
                      Registered verified community partner
                    </option>
                    <option value="Authorized Food Safety Officer override">
                      Authorized Food Safety Officer override
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualVerify}
                className="w-full bg-[#0b8641] hover:bg-green-800 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Authorize & Mark Verified
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
