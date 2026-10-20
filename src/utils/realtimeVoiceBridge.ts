import { io, Socket } from 'socket.io-client';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000`;

export interface VoiceBridgeSession {
  stop: () => void;
  setMonitorSelf: (enabled: boolean) => void;
  simulatePartnerSpeech: (text?: string) => void;
}

let activeSocket: Socket | null = null;

function getSocket(): Socket {
  if (!activeSocket) {
    activeSocket = io(API_BASE);
  }
  return activeSocket;
}

/**
 * Starts a real-time two-way voice streaming bridge via Socket.IO & Web Audio
 */
export function startVoiceBridge({
  channelId,
  userId,
  userName = 'User',
  onPeerSpeaking,
  onIncomingAudioStarted
}: {
  channelId: string;
  userId?: string;
  userName?: string;
  onPeerSpeaking?: (isSpeaking: boolean) => void;
  onIncomingAudioStarted?: () => void;
}): VoiceBridgeSession {
  const socket = getSocket();
  const room = `voice:${channelId}`;

  // Join the voice channel
  socket.emit('voice:join', { channelId, userId, userName });

  let audioCtx: AudioContext | null = null;
  let monitorGain: GainNode | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let micStream: MediaStream | null = null;
  let isMonitoringSelf = false;

  const initAudioCtx = () => {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
        monitorGain = audioCtx.createGain();
        monitorGain.gain.setValueAtTime(0, audioCtx.currentTime);
        monitorGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  };

  initAudioCtx();

  // Listen to incoming audio from other peer on this channel
  const handleIncomingAudio = async (data: { audioBase64: string; userId?: string; socketId?: string }) => {
    if (data.socketId === socket.id) return; // Don't replay own chunks
    try {
      const ctx = initAudioCtx();
      if (!ctx) return;

      onIncomingAudioStarted?.();
      onPeerSpeaking?.(true);

      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBuffer = await ctx.decodeAudioData(byteArray.buffer.slice(0));

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      source.onended = () => {
        onPeerSpeaking?.(false);
      };
    } catch {
      // Audio playback decode note
    }
  };

  const handlePeerSpeaking = (data: { isSpeaking: boolean }) => {
    onPeerSpeaking?.(data.isSpeaking);
  };

  socket.on('voice:incoming-audio', handleIncomingAudio);
  socket.on('voice:peer-speaking', handlePeerSpeaking);

  // Capture local microphone and stream chunks over Socket.IO
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        micStream = stream;

        // Monitor loopback if enabled
        if (audioCtx && monitorGain) {
          const micSource = audioCtx.createMediaStreamSource(stream);
          micSource.connect(monitorGain);
        }

        // Setup MediaRecorder to stream audio chunks
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : '';

          mediaRecorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);

          mediaRecorder.ondataavailable = async (e) => {
            if (e.data && e.data.size > 0 && socket.connected) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = (reader.result as string)?.split(',')[1];
                if (base64data) {
                  socket.emit('voice:audio-chunk', {
                    channelId,
                    userId,
                    audioBase64: base64data
                  });
                }
              };
              reader.readAsDataURL(e.data);
            }
          };

          // Record in fast 400ms chunks for low-latency voice speaking
          mediaRecorder.start(400);
        } catch (e) {
          console.warn('MediaRecorder streaming fallback:', e);
        }
      })
      .catch((err) => {
        console.warn('Microphone stream access notice:', err);
      });
  }

  return {
    stop: () => {
      socket.off('voice:incoming-audio', handleIncomingAudio);
      socket.off('voice:peer-speaking', handlePeerSpeaking);
      socket.emit('voice:leave', { channelId });

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch {}
      }
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    },
    setMonitorSelf: (enabled: boolean) => {
      isMonitoringSelf = enabled;
      if (audioCtx && monitorGain) {
        monitorGain.gain.setValueAtTime(enabled ? 0.35 : 0, audioCtx.currentTime);
      }
    },
    simulatePartnerSpeech: (customText?: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const partnerText = customText ||
        `Hello Praveen! This is Priya Patel from Green Life Foundation. I can hear you clearly in real-time! I am currently approaching Sector 14 Rohini for your food rescue pickup batch. Everything is on schedule!`;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(partnerText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-IN';

      onPeerSpeaking?.(true);
      utterance.onend = () => {
        onPeerSpeaking?.(false);
      };
      utterance.onerror = () => {
        onPeerSpeaking?.(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };
}
