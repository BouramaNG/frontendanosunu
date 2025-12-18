import { useRef, useState, useEffect } from 'react';
import { Mic, XCircle, Lock } from '@/lib/icons';

interface WhatsAppVoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  maxDuration?: number; // Secondes (défaut: 60)
  disabled?: boolean;
  className?: string;
}

/**
 * Composant d'enregistrement vocal style WhatsApp
 *
 * Fonctionnalités:
 * - Appuyer et maintenir pour enregistrer
 * - Glisser vers la gauche (≥80px) pour annuler
 * - Glisser vers le haut (≥80px) pour verrouiller (mode mains-libres)
 * - Relâcher pour envoyer (si non verrouillé et non annulé)
 * - Waveform animée pendant l'enregistrement
 * - Timer en temps réel
 * - Retour haptique au verrouillage
 */
export default function WhatsAppVoiceRecorder({
  onRecordingComplete,
  maxDuration = 60,
  disabled = false,
  className = '',
}: WhatsAppVoiceRecorderProps) {

  // Recording state
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const waveTimerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const recordSecRef = useRef<number>(0);
  const [wave, setWave] = useState<number[]>(Array(22).fill(0.3));
  const sendOnStopRef = useRef<boolean>(true);

  // Gesture state
  const holdActiveRef = useRef<boolean>(false);
  const isLockedRef = useRef<boolean>(false);
  const willCancelRef = useRef<boolean>(false);
  const [holdActive, setHoldActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [willCancel, setWillCancel] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // Gesture thresholds (pixels)
  const CANCEL_THRESHOLD = 80; // Glisser vers la gauche
  const LOCK_THRESHOLD = 80;   // Glisser vers le haut

  /**
   * Démarre l'enregistrement audio
   */
  const startRecording = async () => {
    if (isRecording || disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Choisir le meilleur format supporté
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];

      let selectedMime = '';
      for (const mt of candidates) {
        if ((window as any).MediaRecorder?.isTypeSupported?.(mt)) {
          selectedMime = mt;
          break;
        }
      }

      const mediaRecorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: selectedMime || 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        const secs = recordSecRef.current;

        // Reset UI
        setIsRecording(false);
        setRecordSec(0);
        recordSecRef.current = 0;

        if (recTimerRef.current) {
          window.clearInterval(recTimerRef.current);
          recTimerRef.current = null;
        }

        // Envoyer si durée >= 1s et pas annulé
        if (sendOnStopRef.current && secs >= 1) {
          onRecordingComplete(blob, Math.min(maxDuration, secs));
        }

        // Reset gesture flags
        setHoldActive(false);
        holdActiveRef.current = false;
        setWillCancel(false);
        willCancelRef.current = false;
        setIsLocked(false);
        isLockedRef.current = false;
        setWave(Array(22).fill(0.3));
      };

      mrRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordSec(0);

      // Animation waveform (fausse animation, pas analyse réelle)
      if (waveTimerRef.current) window.clearInterval(waveTimerRef.current);
      waveTimerRef.current = window.setInterval(() => {
        setWave((prev) =>
          prev.map((_, i) => {
            const base = 0.2 + Math.random() * 0.8;
            const ripple = Math.sin((Date.now() / 120 + i) / 3) * 0.15 + 0.15;
            return Math.min(1, Math.max(0.1, base * 0.7 + ripple * 0.3));
          })
        );
      }, 120);

      // Timer 1s
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
      recTimerRef.current = window.setInterval(() => {
        setRecordSec((s) => {
          const next = s + 1;
          recordSecRef.current = next;

          // Auto-stop à la durée max
          if (next >= maxDuration) {
            stopRecording(true);
          }

          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error', err);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  };

  /**
   * Arrête l'enregistrement
   */
  const stopRecording = (send: boolean = true) => {
    sendOnStopRef.current = !!send;
    try {
      mrRef.current?.stop();
    } catch {}

    if (waveTimerRef.current) {
      window.clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }

    if (!send) {
      setIsLocked(false);
      isLockedRef.current = false;
    }
  };

  /**
   * Annule l'enregistrement
   */
  const cancelRecording = () => {
    setIsLocked(false);
    isLockedRef.current = false;
    setWillCancel(false);
    willCancelRef.current = false;
    stopRecording(false);
  };

  /**
   * Extrait les coordonnées x,y d'un événement souris/touch
   */
  const getClientXY = (e: any) => {
    if (e && e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    const ne = e as MouseEvent;
    return { x: ne?.clientX ?? 0, y: ne?.clientY ?? 0 };
  };

  /**
   * Nettoyage des listeners globaux
   */
  const cleanupGlobalHandlers = () => {
    window.removeEventListener('mousemove', onGlobalMove as any);
    window.removeEventListener('mouseup', onGlobalUp as any);
    window.removeEventListener('touchmove', onGlobalMove as any);
    window.removeEventListener('touchend', onGlobalUp as any);
    window.removeEventListener('touchcancel', onGlobalUp as any);
  };

  /**
   * Gestion du mouvement global (glisser)
   */
  const onGlobalMove = (ev: any) => {
    if (!holdActiveRef.current || !startPosRef.current) return;

    const { x, y } = getClientXY(ev);
    const dx = x - startPosRef.current.x;
    const dy = y - startPosRef.current.y;

    if (!isLockedRef.current) {
      // Détection annulation (glisser gauche)
      const shouldCancel = dx <= -CANCEL_THRESHOLD;
      if (shouldCancel !== willCancelRef.current) {
        setWillCancel(shouldCancel);
        willCancelRef.current = shouldCancel;
      }

      // Détection verrouillage (glisser haut)
      if (dy <= -LOCK_THRESHOLD) {
        setIsLocked(true);
        isLockedRef.current = true;

        // Retour haptique
        try {
          (navigator as any).vibrate?.(10);
        } catch {}
      }
    }
  };

  /**
   * Gestion du relâchement global
   */
  const onGlobalUp = (_ev: any) => {
    cleanupGlobalHandlers();

    if (!holdActiveRef.current) return;

    if (!isLockedRef.current) {
      if (willCancelRef.current) {
        cancelRecording();
      } else {
        stopRecording(true);
      }
    }

    setHoldActive(false);
    holdActiveRef.current = false;
    setWillCancel(false);
    willCancelRef.current = false;
  };

  /**
   * Gestion du début de pression (souris/touch)
   */
  const handlePressStart = (e: any) => {
    // Prévenir le comportement par défaut
    try {
      if (e?.preventDefault && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
    } catch {}

    if (disabled) return;

    // Reset état
    setIsLocked(false);
    isLockedRef.current = false;
    setWillCancel(false);
    willCancelRef.current = false;
    setHoldActive(true);
    holdActiveRef.current = true;

    // Sauvegarder position initiale
    const anyEvent = (e.nativeEvent as any) || e;
    startPosRef.current = getClientXY(anyEvent);
    sendOnStopRef.current = true;

    // Démarrer enregistrement
    startRecording();

    // Attacher listeners globaux
    window.addEventListener('mousemove', onGlobalMove as any, { passive: false });
    window.addEventListener('mouseup', onGlobalUp as any, { passive: false });
    window.addEventListener('touchmove', onGlobalMove as any, { passive: false });
    window.addEventListener('touchend', onGlobalUp as any, { passive: false });
    window.addEventListener('touchcancel', onGlobalUp as any, { passive: false });
  };

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      cleanupGlobalHandlers();
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
      if (waveTimerRef.current) window.clearInterval(waveTimerRef.current);
      try {
        mrRef.current?.stop();
      } catch {}
    };
  }, []);

  return (
    <div className={className}>
      {/* Hints pendant hold (non verrouillé) + waveform */}
      {holdActive && !isLocked && (
        <div className="mb-2 px-1">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-end gap-[2px] h-6">
              {wave.map((v, i) => (
                <div
                  key={i}
                  className={`w-[3px] rounded ${
                    willCancel ? 'bg-red-400/80' : 'bg-pink-400/80'
                  }`}
                  style={{ height: `${Math.max(2, Math.min(24, v * 24))}px` }}
                />
              ))}
            </div>
            <div
              className={`text-xs px-3 py-1 rounded-full border flex items-center gap-2 ${
                willCancel
                  ? 'bg-red-500/20 border-red-500/40 text-red-200'
                  : 'bg-white/5 border-white/20 text-white/70'
              }`}
            >
              <XCircle className="w-3 h-3" /> Glissez pour annuler • <Lock className="w-3 h-3" />{' '}
              Vers le haut pour verrouiller
            </div>
          </div>
        </div>
      )}

      {/* Barre de contrôle verrouillée */}
      {isRecording && isLocked && (
        <div className="mb-2 px-1">
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl px-3 py-2">
            <span className="text-sm">
              🔴 Enregistrement {String(Math.floor(recordSec / 60)).padStart(2, '0')}:
              {String(recordSec % 60).padStart(2, '0')} / {maxDuration}s
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3 py-1 bg-white/10 hover:bg-white/15 rounded-lg border border-white/20 text-white/80 text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => stopRecording(true)}
                className="px-3 py-1 bg-red-500/30 hover:bg-red-500/40 rounded-lg border border-red-500/40 text-sm"
              >
                Terminer & envoyer
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center">
            <div className="flex items-end gap-[2px] h-6">
              {wave.map((v, i) => (
                <div
                  key={i}
                  className="w-[3px] bg-red-400/80 rounded"
                  style={{ height: `${Math.max(2, Math.min(24, v * 24))}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bouton microphone */}
      <button
        type="button"
        onMouseDown={(e) => {
          if (disabled) return;
          handlePressStart(e);
        }}
        onTouchStart={(e) => {
          if (disabled) return;
          handlePressStart(e);
        }}
        disabled={disabled}
        className={`w-12 h-12 flex items-center justify-center rounded-xl border text-white transition select-none ${
          disabled
            ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
            : isRecording
            ? willCancel
              ? 'bg-red-500/40 border-red-500/60'
              : 'bg-red-500/30 border-red-500/40'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-400 hover:from-pink-600 hover:to-purple-700'
        }`}
        title={
          disabled
            ? 'Microphone désactivé'
            : isRecording
            ? isLocked
              ? 'Enregistrement verrouillé'
              : willCancel
              ? 'Relâchez pour annuler'
              : 'Relâchez pour envoyer'
            : 'Maintenez pour enregistrer'
        }
      >
        <Mic className="w-6 h-6" />
      </button>
    </div>
  );
}
