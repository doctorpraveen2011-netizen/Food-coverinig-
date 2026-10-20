import { create } from 'zustand';
import { normalizePhone } from '../utils/phoneUtils';

export interface TelecomConfig {
  voiceApiKey: string;
  provider: 'Twilio Voice Gateway' | 'Fast2SMS Voice' | 'WebRTC Live Telecom VoIP';
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  fast2smsApiKey?: string;
  recordCalls: boolean;
  callerId: string;
}

export type CallStatus = 'idle' | 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed';

interface TelecomState {
  isOpen: boolean;
  isConfigModalOpen: boolean;
  status: CallStatus;
  callId: string | null;
  contactName: string;
  phoneNumber: string;
  role: string;
  provider: string;
  liveTelecomActive: boolean;
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  keypadOpen: boolean;
  dtmfSequence: string;
  error: string | null;
  successNotice: string | null;

  config: TelecomConfig;
  isLoadingConfig: boolean;
  isSavingConfig: boolean;

  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (newConfig: Partial<TelecomConfig>) => Promise<boolean>;
  startCall: (params: { to: string; contactName?: string; role?: string; donationId?: string }) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleKeypad: () => void;
  pressDtmf: (digit: string) => void;
  clearDtmf: () => void;
  closeCallModal: () => void;
  openConfigModal: () => void;
  closeConfigModal: () => void;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000`;

let durationInterval: any = null;
let simulatedAnswerTimeout: any = null;

export const useTelecomStore = create<TelecomState>((set, get) => ({
  isOpen: false,
  isConfigModalOpen: false,
  status: 'idle',
  callId: null,
  contactName: 'Pickup Contact',
  phoneNumber: '',
  role: 'Donor',
  provider: 'Twilio Voice Gateway',
  liveTelecomActive: true,
  durationSeconds: 0,
  isMuted: false,
  isSpeakerOn: true,
  keypadOpen: false,
  dtmfSequence: '',
  error: null,
  successNotice: null,

  config: {
    voiceApiKey: 'fc_live_voice_telecom_key_98248832986',
    provider: 'Twilio Voice Gateway',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '+918000555124',
    fast2smsApiKey: '',
    recordCalls: true,
    callerId: '+91 8000 555 124'
  },
  isLoadingConfig: false,
  isSavingConfig: false,

  fetchConfig: async () => {
    set({ isLoadingConfig: true });
    try {
      const res = await fetch(`${API_BASE}/api/v1/telecom/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          set({ config: data.config });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch telecom config:', err);
    } finally {
      set({ isLoadingConfig: false });
    }
  },

  updateConfig: async (newConfig: Partial<TelecomConfig>) => {
    set({ isSavingConfig: true, error: null, successNotice: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/telecom/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update telecom configuration');
      }
      set({
        config: data.config,
        successNotice: 'Telecom API Key and configuration updated successfully!'
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to save telecom config' });
      return false;
    } finally {
      set({ isSavingConfig: false });
    }
  },

  startCall: async ({ to, contactName = 'Pickup Contact', role = 'Donor', donationId }) => {
    // Clear any existing intervals
    if (durationInterval) clearInterval(durationInterval);
    if (simulatedAnswerTimeout) clearTimeout(simulatedAnswerTimeout);

    const norm = normalizePhone(to);
    const displayPhone = norm.isValid ? norm.formattedDisplay : to;

    set({
      isOpen: true,
      status: 'initiating',
      error: null,
      successNotice: null,
      contactName,
      phoneNumber: displayPhone,
      role,
      durationSeconds: 0,
      isMuted: false,
      keypadOpen: false,
      dtmfSequence: ''
    });

    try {
      // Ensure latest config is loaded
      get().fetchConfig().catch(() => {});

      const res = await fetch(`${API_BASE}/api/v1/telecom/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: norm.cleanDestination || to,
          contactName,
          role,
          donationId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Voice gateway rejected call dispatch.');
      }

      set({
        status: 'ringing',
        callId: data.callId,
        provider: data.provider || 'Twilio Voice Gateway',
        liveTelecomActive: !!data.liveTelecomActive
      });

      // Ringing -> Connected transition (Real-time live pickup simulation)
      simulatedAnswerTimeout = setTimeout(() => {
        set({ status: 'connected' });
        durationInterval = setInterval(() => {
          set((prev) => ({ durationSeconds: prev.durationSeconds + 1 }));
        }, 1000);
      }, 3200);

    } catch (err: any) {
      set({
        status: 'failed',
        error: err.message || 'Call failed to connect.'
      });
    }
  },

  endCall: async () => {
    if (durationInterval) clearInterval(durationInterval);
    if (simulatedAnswerTimeout) clearTimeout(simulatedAnswerTimeout);

    const currentCallId = get().callId;
    set({ status: 'ended' });

    try {
      if (currentCallId) {
        await fetch(`${API_BASE}/api/v1/telecom/hangup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId: currentCallId })
        });
      }
    } catch (e) {
      console.warn('Hangup notification warning:', e);
    }

    // Auto-close modal after brief 1.5s summary
    setTimeout(() => {
      if (get().status === 'ended') {
        set({ isOpen: false, status: 'idle' });
      }
    }, 1800);
  },

  toggleMute: () => set((prev) => ({ isMuted: !prev.isMuted })),
  toggleSpeaker: () => set((prev) => ({ isSpeakerOn: !prev.isSpeakerOn })),
  toggleKeypad: () => set((prev) => ({ keypadOpen: !prev.keypadOpen })),

  pressDtmf: (digit: string) => {
    set((prev) => ({ dtmfSequence: prev.dtmfSequence + digit }));
  },

  clearDtmf: () => set({ dtmfSequence: '' }),

  closeCallModal: () => {
    if (durationInterval) clearInterval(durationInterval);
    if (simulatedAnswerTimeout) clearTimeout(simulatedAnswerTimeout);
    set({ isOpen: false, status: 'idle' });
  },

  openConfigModal: () => {
    get().fetchConfig().catch(() => {});
    set({ isConfigModalOpen: true, error: null, successNotice: null });
  },

  closeConfigModal: () => set({ isConfigModalOpen: false, error: null, successNotice: null })
}));
