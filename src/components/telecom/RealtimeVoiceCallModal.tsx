import React, { useEffect, useState, useRef } from 'react';
import { useTelecomStore } from '../../store/useTelecomStore';
import { TelecomConfigModal } from './TelecomConfigModal';
import { normalizePhone } from '../../utils/phoneUtils';
import {
  startRingbackTone,
  stopRingbackTone,
  playDtmfTone,
  playCallEndedTone
} from '../../utils/telecomAudio';
import { startLiveMicrophone, type LiveMicController } from '../../utils/liveMicrophone';
import { startVoiceBridge, type VoiceBridgeSession } from '../../utils/realtimeVoiceBridge';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Grid,
  Radio,
  Settings2,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  QrCode,
  Headphones,
  UserCheck,
  X
} from 'lucide-react';

export const RealtimeVoiceCallModal: React.FC = () => {
  const {
    isOpen,
    status,
    callId,
    contactName,
    phoneNumber,
    role,
    provider,
    liveTelecomActive,
    durationSeconds,
    isMuted,
    isSpeakerOn,
    keypadOpen,
    dtmfSequence,
    error,
    config,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleKeypad,
    pressDtmf,
    clearDtmf,
    closeCallModal,
    openConfigModal
  } = useTelecomStore();

  const [copied, setCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([15, 25, 40, 65, 80, 50, 70, 90, 60, 45, 30, 20, 10]);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [micActive, setMicActive] = useState<boolean>(false);
  const [monitorSelf, setMonitorSelf] = useState<boolean>(false);
  const [peerSpeaking, setPeerSpeaking] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  const micRef = useRef<LiveMicController | null>(null);
  const bridgeRef = useRef<VoiceBridgeSession | null>(null);

  // Manage Web Audio ringback and disconnect sounds according to call status
  useEffect(() => {
    if (!isOpen) {
      stopRingbackTone();
      return;
    }

    if (status === 'ringing') {
      startRingbackTone();
    } else if (status === 'connected') {
      stopRingbackTone();
    } else if (status === 'ended') {
      playCallEndedTone();
    } else if (status === 'failed') {
      stopRingbackTone();
    }

    return () => {
      stopRingbackTone();
    };
  }, [isOpen, status]);

  // Manage Live Real-Time Microphone capture & Speech recognition when Connected
  useEffect(() => {
    if (isOpen && status === 'connected') {
      try {
        micRef.current = startLiveMicrophone({
          onAudioLevel: (level, bars) => {
            setAudioLevel(level);
            setMicActive(true);
            if (bars && bars.length > 0) {
              setFrequencyBars(bars.slice(0, 13));
            }
          },
          onTranscript: (text) => {
            setLiveTranscript(text);
          },
          onError: (err) => {
            console.warn('Live mic stream info:', err);
          }
        });

        // Initialize two-way Socket.IO voice bridge
        bridgeRef.current = startVoiceBridge({
          channelId: callId || 'donation-stream',
          userName: 'praveen',
          onPeerSpeaking: (isSpeaking) => {
            setPeerSpeaking(isSpeaking);
          }
        });
      } catch (e) {
        console.warn('Microphone start error:', e);
      }
    } else {
      if (micRef.current) {
        micRef.current.stop();
        micRef.current = null;
      }
      if (bridgeRef.current) {
        bridgeRef.current.stop();
        bridgeRef.current = null;
      }
      setMicActive(false);
      setAudioLevel(0);
      setLiveTranscript('');
      setPeerSpeaking(false);
      setMonitorSelf(false);
    }

    return () => {
      if (micRef.current) {
        micRef.current.stop();
        micRef.current = null;
      }
      if (bridgeRef.current) {
        bridgeRef.current.stop();
        bridgeRef.current = null;
      }
    };
  }, [isOpen, status, callId]);

  // Sync mute state to physical microphone stream
  useEffect(() => {
    if (micRef.current) {
      micRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  const handleToggleMonitor = () => {
    const next = !monitorSelf;
    setMonitorSelf(next);
    if (bridgeRef.current) {
      bridgeRef.current.setMonitorSelf(next);
    }
  };

  const handleVolunteerVoiceResponse = () => {
    if (bridgeRef.current) {
      bridgeRef.current.simulatePartnerSpeech(
        `Hello ${contactName}! This is Priya Patel from Green Life Foundation. I can hear you clearly in real-time! I am approaching your pickup address now.`
      );
    }
  };

  if (!isOpen) {
    return <TelecomConfigModal />;
  }

  const norm = normalizePhone(phoneNumber || '+91 82488 32986', {
    contactName,
    role,
    context: 'telecom',
    referenceId: callId || undefined
  });
  const formattedSeconds = String(durationSeconds % 60).padStart(2, '0');
  const formattedMinutes = String(Math.floor(durationSeconds / 60)).padStart(2, '0');
  const durationDisplay = `${formattedMinutes}:${formattedSeconds}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(norm.formattedDisplay || phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDtmfPress = (digit: string) => {
    playDtmfTone(digit);
    pressDtmf(digit);
  };

  const dialpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  const qrImageUrl = norm.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(norm.whatsappCallHref)}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative max-h-[96vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Live Real-Time Voice Channel
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openConfigModal}
                title="Configure Voice API Key"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-slate-700/50"
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Key</span>
              </button>
              <button
                onClick={closeCallModal}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Primary WhatsApp Real-Time Voice Call Hero Card */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950/70 border-2 border-emerald-500/70 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-950 shrink-0">
                    <MessageSquare className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        Real WhatsApp Contact
                      </h4>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-[#25D366] text-black">
                        Click to Chat
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Open conversation with <strong className="text-white capitalize">{contactName}</strong> ({norm.formattedDisplay}) in WhatsApp to voice call
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    showQrCode
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle Mobile QR Code for WhatsApp Call"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQrCode ? 'Hide QR' : 'Phone QR'}</span>
                </button>
              </div>

              {/* Action Buttons for WhatsApp */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href={norm.whatsappNativeAppHref || norm.whatsappCallHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all text-center"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>Open in WhatsApp</span>
                </a>

                <a
                  href={norm.whatsappNativeAppHref}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Open Windows WhatsApp App"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Desktop App</span>
                </a>

                <a
                  href={norm.whatsappWebHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Open in WhatsApp Web"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Web</span>
                </a>
              </div>

              {/* Mobile QR Code Section */}
              {showQrCode && (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-4 bg-slate-950/60 p-3 rounded-xl animate-in fade-in">
                  <div className="p-1.5 bg-white rounded-xl shadow-md shrink-0">
                    <img
                      src={qrImageUrl}
                      alt="WhatsApp Call QR Code"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <div className="text-left space-y-1 text-xs text-slate-300">
                    <div className="font-bold text-white text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Instant Phone Calling (Zero Setup):</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                      <li>Open your mobile phone camera or WhatsApp.</li>
                      <li>Scan this QR code.</li>
                      <li>
                        Tap the green <strong className="text-emerald-400">📞 Phone Call</strong> icon in the chat to speak live!
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* In-App Live Speaking & Microphone Card */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-center flex flex-col items-center">
              {/* Avatar / Calling Circle */}
              <div className="relative mb-3">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                    status === 'connected'
                      ? 'bg-emerald-500/10 border-2 border-emerald-500 ring-8 ring-emerald-500/10 text-emerald-400'
                      : status === 'ringing'
                      ? 'bg-amber-500/10 border-2 border-amber-500 ring-8 ring-amber-500/10 text-amber-400 animate-pulse'
                      : status === 'ended'
                      ? 'bg-slate-800 border-2 border-slate-700 text-slate-400'
                      : 'bg-blue-500/10 border-2 border-blue-500 text-blue-400'
                  }`}
                >
                  <Phone className={`w-8 h-8 ${status === 'connected' ? 'animate-bounce' : ''}`} />
                </div>

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-md ${
                      status === 'connected'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : status === 'ringing'
                        ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                        : status === 'ended'
                        ? 'bg-slate-900 text-slate-400 border-slate-700'
                        : 'bg-blue-950 text-blue-300 border-blue-700'
                    }`}
                  >
                    {status === 'initiating' && 'Connecting API...'}
                    {status === 'ringing' && 'Ringing Recipient...'}
                    {status === 'connected' && `In Call • ${durationDisplay}`}
                    {status === 'ended' && 'Call Completed'}
                    {status === 'failed' && 'Line Busy / Failed'}
                  </span>
                </div>
              </div>

              {/* Recipient Details */}
              <h2 className="text-xl font-bold text-white tracking-tight mt-1 capitalize">
                {contactName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700/60">
                  {role}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  <span>{norm.formattedDisplay}</span>
                  <button
                    onClick={handleCopyPhone}
                    className="hover:text-white transition-colors p-0.5"
                    title="Copy Phone Number"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Telecom Gateway Info */}
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[280px]">
                  {provider} • Key:{' '}
                  <span className="font-mono text-slate-300">
                    {config.voiceApiKey ? `${config.voiceApiKey.slice(0, 14)}...` : 'Active'}
                  </span>
                </span>
              </div>

              {error && (
                <div className="mt-2.5 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Live Real-Time Speaking Section */}
            {status === 'connected' && (
              <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
                {/* Visualizer bars driven by real mic input */}
                <div className="flex items-center justify-center gap-1.5 h-11 px-4 py-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  {frequencyBars.map((barHeight, i) => {
                    const scaled = Math.min(100, Math.max(15, barHeight + (audioLevel > 5 ? Math.sin(i + Date.now()/200) * 20 : 0)));
                    return (
                      <div
                        key={i}
                        style={{ height: `${scaled}%` }}
                        className={`w-1.5 rounded-full transition-all duration-75 ${
                          audioLevel > 15
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                            : audioLevel > 5
                            ? 'bg-emerald-500'
                            : 'bg-emerald-600/40'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Live Microphone Status & Two-Way Intercom Action Bar */}
                <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${audioLevel > 5 ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-[11px] font-semibold text-slate-200">
                      {isMuted
                        ? 'Microphone Muted'
                        : audioLevel > 5
                        ? `Live Speech Active • ${audioLevel}% Volume`
                        : 'Microphone Live • Speak Now in Real-Time'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Hear My Voice Monitor Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleMonitor}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                        monitorSelf
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Hear your own microphone live through earphones/speakers"
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{monitorSelf ? 'Monitor ON' : 'Hear Myself'}</span>
                    </button>

                    {/* Volunteer Real-Time Voice Response */}
                    <button
                      type="button"
                      onClick={handleVolunteerVoiceResponse}
                      className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Test live volunteer voice response through speakers"
                    >
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Volunteer Reply</span>
                    </button>
                  </div>
                </div>

                {/* Peer speaking badge */}
                {peerSpeaking && (
                  <div className="p-2 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-center text-xs font-bold text-emerald-300 animate-pulse flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Remote Contact is speaking in real-time...</span>
                  </div>
                )}

                {/* Real-Time Speech Recognition Caption */}
                {liveTranscript && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-900/60 text-left animate-in fade-in">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1 mb-0.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Your Spoken Voice Transcript:</span>
                    </div>
                    <p className="text-xs text-slate-100 font-mono italic">
                      "{liveTranscript}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Keypad / DTMF Dialpad Area */}
            {keypadOpen && (
              <div className="px-8 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    DTMF In-Call Keypad
                  </span>
                  {dtmfSequence && (
                    <button
                      onClick={clearDtmf}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="h-7 bg-slate-900 rounded-lg px-2 flex items-center justify-center font-mono text-emerald-400 font-bold tracking-widest text-sm mb-3 border border-slate-800">
                  {dtmfSequence || '—'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {dialpadKeys.flat().map((key) => (
                    <button
                      key={key}
                      onClick={() => handleDtmfPress(key)}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl font-bold text-slate-100 text-sm transition-colors border border-slate-700/50"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Controls Panel */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3 shrink-0">
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Mute */}
              <button
                onClick={toggleMute}
                disabled={status === 'ended'}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 ring-2 ring-rose-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title={isMuted ? 'Unmute Live Microphone' : 'Mute Live Microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* DTMF Keypad Toggle */}
              <button
                onClick={toggleKeypad}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  keypadOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Toggle Keypad"
              >
                <Grid className="w-5 h-5" />
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isSpeakerOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                }`}
                title="Toggle Speakerphone"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                disabled={status === 'ended'}
                className="w-13 h-13 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-950 transition-all"
                title="Hang Up Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>

            {/* Direct Channel Strip */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] font-medium text-slate-500">Real-Time Lines:</span>
              <div className="flex items-center gap-2">
                <a
                  href={norm.cellularHref}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Cellular Direct</span>
                </a>
                <a
                  href={norm.whatsappCallHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3 h-3 fill-current" />
                  <span>WhatsApp Contact</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TelecomConfigModal />
    </>
  );
};
