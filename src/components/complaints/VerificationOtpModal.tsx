import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  UserCheck, 
  Send, 
  ExternalLink, 
  MessageSquare, 
  Settings, 
  Sparkles, 
  Check, 
  Copy, 
  Lock 
} from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';

export const VerificationOtpModal: React.FC = () => {
  const { 
    isOtpModalOpen, 
    otpTarget, 
    closeOtpModal, 
    requestVerificationOtp, 
    confirmOtp, 
    manualAuditVerify,
    getGatewayConfig,
    updateGatewayConfig 
  } = useComplaintsStore();

  const [otpCode, setOtpCode] = useState('');
  const [activeTab, setActiveTab] = useState<'otp' | 'gateway' | 'manual'>('otp');
  const [manualReason, setManualReason] = useState('Direct telephonic confirmation with complainant');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [whatsappLink, setWhatsappLink] = useState<string>('');
  const [smsLink, setSmsLink] = useState<string>('');
  const [emailDispatched, setEmailDispatched] = useState<boolean>(false);
  const [smsDispatched, setSmsDispatched] = useState<boolean>(false);
  const [deliveryDetails, setDeliveryDetails] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Gateway form state
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [hasServerEmail, setHasServerEmail] = useState(false);
  const [hasServerSms, setHasServerSms] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [gatewayStatusMsg, setGatewayStatusMsg] = useState('');

  useEffect(() => {
    if (isOtpModalOpen && otpTarget) {
      setOtpCode('');
      setErrorMsg('');
      setTimeLeft(600);
      setIsSubmitting(true);
      setActiveTab('otp');
      setGatewayStatusMsg('');

      // Check current gateway configuration on server
      getGatewayConfig().then((cfg) => {
        if (cfg) {
          setHasServerEmail(!!cfg.hasEmailConfig);
          setHasServerSms(!!cfg.hasSmsConfig);
          if (cfg.smtpUser) setSmtpUser(cfg.smtpUser);
        }
      });

      // Request initial OTP from backend
      requestVerificationOtp(otpTarget.complaintId, otpTarget.type).then((res) => {
        if (res.demoOtp) {
          setGeneratedCode(res.demoOtp);
        }
        if (res.whatsappUrl) {
          setWhatsappLink(res.whatsappUrl);
        }
        if (res.smsUrl) {
          setSmsLink(res.smsUrl);
        }
        setEmailDispatched(!!res.emailSent);
        setSmsDispatched(!!res.smsSent);
        if (res.deliveryDetails) {
          setDeliveryDetails(res.deliveryDetails);
        }
        setIsSubmitting(false);
      });
    }
  }, [isOtpModalOpen, otpTarget, getGatewayConfig, requestVerificationOtp]);

  useEffect(() => {
    if (!isOtpModalOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOtpModalOpen]);

  if (!isOtpModalOpen || !otpTarget) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResend = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await requestVerificationOtp(otpTarget.complaintId, otpTarget.type);
    if (res.demoOtp) {
      setGeneratedCode(res.demoOtp);
      setTimeLeft(600);
    }
    if (res.whatsappUrl) setWhatsappLink(res.whatsappUrl);
    if (res.smsUrl) setSmsLink(res.smsUrl);
    setEmailDispatched(!!res.emailSent);
    setSmsDispatched(!!res.smsSent);
    if (res.deliveryDetails) setDeliveryDetails(res.deliveryDetails);
    setIsSubmitting(false);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const success = await confirmOtp(otpTarget.complaintId, otpTarget.type, otpCode);
    setIsSubmitting(false);

    if (success) {
      closeOtpModal();
    } else {
      setErrorMsg('Invalid or expired code. Please verify the code entered.');
    }
  };

  const handleManualVerify = async () => {
    if (!manualReason.trim()) {
      setErrorMsg('Please specify an audit verification reason.');
      return;
    }
    setIsSubmitting(true);
    await manualAuditVerify(otpTarget.complaintId, otpTarget.type, manualReason);
    setIsSubmitting(false);
    closeOtpModal();
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    setGatewayStatusMsg('');

    const res = await updateGatewayConfig({
      smtpUser: smtpUser.trim(),
      smtpPass: smtpPass.trim(),
      smtpHost: smtpHost.trim(),
      smtpPort,
      fast2smsKey: fast2smsKey.trim()
    });

    setIsSavingGateway(false);
    if (res && res.success) {
      setHasServerEmail(!!res.hasEmailConfig);
      setHasServerSms(!!res.hasSmsConfig);
      setGatewayStatusMsg('Gateway credentials saved successfully! Triggering live delivery test...');
      
      // If verifying email, test sending right away!
      if (otpTarget.type === 'email' && smtpUser && smtpPass) {
        const reRes = await requestVerificationOtp(otpTarget.complaintId, 'email');
        if (reRes.emailSent) {
          setEmailDispatched(true);
          setGatewayStatusMsg(`Email successfully dispatched live to ${otpTarget.targetValue}!`);
        }
      }
    } else {
      setGatewayStatusMsg('Configuration updated.');
    }
  };

  // Helper mailto link for direct 1-click fallback
  const mailtoSubject = encodeURIComponent(`[FoodCovering] Security Verification OTP is ${generatedCode} (Case #${otpTarget.complaintId})`);
  const mailtoBody = encodeURIComponent(
    `Official Food Safety Administration Verification Notice\n\n` +
    `Dear ${otpTarget.recipientName || 'Complainant'},\n\n` +
    `Your official 6-digit Food Safety Report verification code for Case #${otpTarget.complaintId} is:\n\n` +
    `   ${generatedCode}\n\n` +
    `Please provide this code to the investigation officer to authenticate your report.\n\n` +
    `FoodCovering Regulatory Authority`
  );
  const mailtoHref = `mailto:${otpTarget.targetValue}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              {otpTarget.type === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Real-Time {otpTarget.type === 'email' ? 'Email' : 'Phone'} OTP Verification
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  LIVE DISPATCH
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">
                Case #{otpTarget.complaintId} • Recipient: {otpTarget.recipientName || 'Complainant'}
              </p>
            </div>
          </div>
          <button
            onClick={closeOtpModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 text-xs font-medium bg-gray-50/70">
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'otp'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live OTP Dispatch</span>
          </button>
          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'gateway'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gateway Settings</span>
            {hasServerEmail && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Admin Sign-Off</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Target info badge */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block text-[11px]">Dispatch Target:</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{otpTarget.targetValue}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[11px]">Complainant:</span>
                  <span className="font-semibold text-gray-800">{otpTarget.recipientName || 'Complainant'}</span>
                </div>
              </div>

              {/* REAL-TIME DELIVERY ACTIONS */}
              {otpTarget.type === 'phone' ? (
                /* Phone delivery channels (WhatsApp + Native SMS) */
                <div className="p-4 bg-emerald-50/80 border-2 border-emerald-500/40 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">
                          Instant WhatsApp Mobile Delivery
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          Guaranteed real-time delivery to friend's phone screen for live pitch
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      RECOMMENDED
                    </span>
                  </div>

                  {/* Primary WhatsApp Dispatch Button */}
                  <a
                    href={whatsappLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Deliver OTP via WhatsApp to {otpTarget.targetValue}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  {/* Secondary options */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                    <a
                      href={smsLink || '#'}
                      className="text-emerald-800 hover:text-emerald-950 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Open Native SMS App (sms:)
                    </a>
                    {smsDispatched ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Carrier SMS Dispatched
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
                </div>
              ) : (
                /* Email delivery channels (SMTP + Mailto Client fallback) */
                <div className="p-4 bg-blue-50/80 border-2 border-blue-400/40 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-950">
                          Real-time Email Dispatch
                        </h4>
                        <p className="text-[11px] text-blue-700">
                          {emailDispatched 
                            ? 'Delivered to recipient inbox via live SMTP gateway'
                            : 'Deliver directly via email client or live Gmail SMTP'}
                        </p>
                      </div>
                    </div>
                    {emailDispatched && (
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> SENT TO INBOX
                      </span>
                    )}
                  </div>

                  {emailDispatched ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">Real Email Sent to {otpTarget.targetValue}!</p>
                        <p className="text-[11px] text-emerald-700">Ask your friend or judge to check their inbox or spam folder.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <a
                        href={mailtoHref}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Mail className="w-4 h-4" />
                        <span>1-Click Launch Email Client (mailto:)</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                      <div className="flex items-center justify-between text-[11px] px-1 text-gray-500">
                        <span>Pre-filled subject & official body</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('gateway')}
                          className="text-blue-700 font-semibold hover:underline"
                        >
                          Connect Gmail for Auto-Send →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECURITY CODE TOKEN SANDBOX */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" /> Generated Security Token (Sandbox)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[10px] font-medium"
                    >
                      {copiedOtp ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      id="btn-auto-fill-otp"
                      onClick={() => setOtpCode(generatedCode)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline hover:cursor-pointer"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => setOtpCode(generatedCode)}
                  title="Click to auto-fill this code into the input field"
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all group"
                >
                  <div className="font-mono font-black text-xl tracking-[0.3em] text-emerald-700 group-hover:scale-105 transition-transform">
                    {generatedCode || 'GENERATING...'}
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-emerald-700 font-medium transition-colors">
                    Click to fill ↵
                  </span>
                </div>
                {deliveryDetails && (
                  <p className="text-[10px] text-gray-500 font-mono truncate">{deliveryDetails}</p>
                )}
              </div>

              {/* CODE INPUT FORM */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Enter 6-Digit Code Received by Complainant
                </label>
                <input
                  id="input-verification-otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono font-black px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {/* Expiry & Resend */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Code Expires: {formatTimer(timeLeft)}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold disabled:opacity-50 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend Fresh Code
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeOtpModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-validate-otp"
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 6}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying...' : 'Validate & Verify'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'gateway' && (
            <form onSubmit={handleSaveGateway} className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Live Production Dispatcher Settings</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Configure your Gmail or custom SMTP to enable 100% automated background email delivery directly to the judge's or friend's actual email inbox during live demonstrations.
                </p>
              </div>

              {/* SMTP / Gmail settings */}
              <div className="space-y-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Gmail / SMTP Email Gateway
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasServerEmail ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                    {hasServerEmail ? 'CONNECTED' : 'NOT CONFIGURED'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Gmail / SMTP Sender Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-gray-700">
                      Gmail App Password (16 chars)
                    </label>
                    <span className="text-[10px] text-gray-400">Google Account &gt; App passwords</span>
                  </div>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-gray-500 mb-0.5">Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-300 rounded font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Port</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-300 rounded font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Fast2SMS API Key (Optional) */}
              <div className="space-y-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Cellular SMS Gateway (Fast2SMS)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasServerSms ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                    {hasServerSms ? 'ACTIVE' : 'OPTIONAL'}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Fast2SMS Authorization API Key (India Direct Carrier SMS)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Fast2SMS API Key..."
                    value={fast2smsKey}
                    onChange={(e) => setFast2smsKey(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  Note: WhatsApp direct delivery works instantly without any SMS API key!
                </p>
              </div>

              {gatewayStatusMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{gatewayStatusMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('otp')}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Back to OTP
                </button>
                <button
                  type="submit"
                  disabled={isSavingGateway}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  <span>{isSavingGateway ? 'Saving...' : 'Save & Activate Gateway'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>Supervisory Manual Certification</span>
                </div>
                <p className="leading-relaxed text-[11px] text-blue-800">
                  Use this administrative override when the investigation officer has conducted a live telephonic VoIP interview or on-premise verification with the complainant and certifies identity authenticity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Audit Justification & Documentation
                </label>
                <textarea
                  rows={3}
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Provide audit justification, e.g. Complainant verified during VoIP investigation interview..."
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('otp')}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Back to OTP
                </button>
                <button
                  type="button"
                  onClick={handleManualVerify}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : 'Certify & Verify'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
