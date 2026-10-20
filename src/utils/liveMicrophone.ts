// Real-Time Microphone & Live Speech Controller

export interface LiveMicController {
  stop: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
}

export function startLiveMicrophone({
  onAudioLevel,
  onTranscript,
  onError
}: {
  onAudioLevel?: (level: number, frequencies: number[]) => void;
  onTranscript?: (text: string) => void;
  onError?: (err: Error) => void;
}): LiveMicController {
  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let animFrameId: number | null = null;
  let isMutedState = false;
  let recognition: any = null;

  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    onError?.(new Error('Microphone access is not supported on this device.'));
    return {
      stop: () => {},
      setMuted: () => {},
      isMuted: () => false
    };
  }

  // 1. Initialize Microphone Audio Stream
  navigator.mediaDevices
    .getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })
    .then((mediaStream) => {
      stream = mediaStream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source = audioCtx.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          // Calculate average audio level (0 to 100)
          let sum = 0;
          const bars: number[] = [];
          for (let i = 0; i < 16; i++) {
            const val = dataArray[i] || 0;
            sum += val;
            bars.push(Math.round((val / 255) * 100));
          }
          const avg = isMutedState ? 0 : Math.round((sum / 16 / 255) * 100);

          onAudioLevel?.(avg, isMutedState ? bars.map(() => 0) : bars);
          animFrameId = requestAnimationFrame(tick);
        };

        tick();
      }

      // 2. Initialize Real-Time Live Speech Recognition (Chrome/Edge/Safari)
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Indian English / multilingual

          recognition.onresult = (event: any) => {
            let transcriptText = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcriptText += event.results[i][0].transcript;
            }
            if (transcriptText.trim() && !isMutedState) {
              onTranscript?.(transcriptText.trim());
            }
          };

          recognition.onerror = () => {
            // Ignore minor speech errors
          };

          recognition.start();
        }
      } catch {
        // Speech recognition optional
      }
    })
    .catch((err) => {
      console.warn('Microphone permission or hardware access notice:', err);
      onError?.(err);
    });

  return {
    stop: () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (recognition) {
        try { recognition.stop(); } catch {}
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    },
    setMuted: (muted: boolean) => {
      isMutedState = muted;
      if (stream) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !muted;
        });
      }
    },
    isMuted: () => isMutedState
  };
}
