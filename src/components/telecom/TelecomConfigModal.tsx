import React, { useState, useEffect } from 'react';
import { useTelecomStore, type TelecomConfig } from '../../store/useTelecomStore';
import { Key, PhoneCall, Check, AlertCircle, X, Server, Radio } from 'lucide-react';

export const TelecomConfigModal: React.FC = () => {
  const {
    isConfigModalOpen,
    closeConfigModal,
    config,
    updateConfig,
    isSavingConfig,
    error,
    successNotice
  } = useTelecomStore();

  const [form, setForm] = useState<TelecomConfig>({
    voiceApiKey: '',
    provider: 'Twilio Voice Gateway',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    fast2smsApiKey: '',
    recordCalls: true,
    callerId: '+91 8000 555 124'
  });

  useEffect(() => {
    if (config) {
      setForm({ ...config });
    }
  }, [config, isConfigModalOpen]);

  if (!isConfigModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Voice Telecom API Settings
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  Real-Time
                </span>
              </h3>
              <p className="text-xs text-slate-400">Configure outbound telecom gateway & Voice API credentials</p>
            </div>
          </div>
          <button
            onClick={closeConfigModal}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl flex items-start gap-2 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Primary Voice API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                FoodCovering Voice API Key
              </span>
              <span className="text-[10px] text-slate-500">Live Production Secret</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.voiceApiKey}
                onChange={(e) => setForm({ ...form, voiceApiKey: e.target.value })}
                placeholder="fc_live_voice_key_..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Authenticates all real-time voice calls to donors, supermarkets, and volunteers.
            </p>
          </div>

          {/* Telecom Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Telecom Gateway Provider
            </label>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="Twilio Voice Gateway">Twilio Voice Gateway (Global PSTN & Mobile)</option>
              <option value="Fast2SMS Voice">Fast2SMS Voice (India DLT Compliant)</option>
              <option value="WebRTC Live Telecom VoIP">WebRTC Live Telecom VoIP (Low Latency In-App)</option>
            </select>
          </div>

          {/* Twilio Specific Section */}
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                Twilio Cloud Voice Credentials (Optional)
              </span>
              <span className="text-[10px] text-slate-500">PSTN Gateway</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Account SID</label>
              <input
                type="text"
                value={form.twilioAccountSid || ''}
                onChange={(e) => setForm({ ...form, twilioAccountSid: e.target.value })}
                placeholder="AC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Auth Token</label>
              <input
                type="password"
                value={form.twilioAuthToken || ''}
                onChange={(e) => setForm({ ...form, twilioAuthToken: e.target.value })}
                placeholder="••••••••••••••••••••••••"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Twilio Caller ID / Number</label>
              <input
                type="text"
                value={form.twilioPhoneNumber || ''}
                onChange={(e) => setForm({ ...form, twilioPhoneNumber: e.target.value })}
                placeholder="+918000555124"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Caller ID Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              Caller ID Header
            </label>
            <input
              type="text"
              value={form.callerId}
              onChange={(e) => setForm({ ...form, callerId: e.target.value })}
              placeholder="+91 8000 555 124"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Toggle Recording */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-200 block">Record Call Quality & Transcripts</span>
              <span className="text-[10px] text-slate-500 block">Required for Food Safety Spoilage verification audits</span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, recordCalls: !form.recordCalls })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                form.recordCalls ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  form.recordCalls ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeConfigModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
            >
              {isSavingConfig ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving API Key...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save & Apply Key
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
