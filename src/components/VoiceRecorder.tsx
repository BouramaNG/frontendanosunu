import { useState, useRef } from 'react';
import { Mic, Square, Send, X } from '@/lib/icons';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAudioOnly: (blob: Blob, seconds: number, effect: 'none' | 'deep') => void;
  onSubmitWithContent: (blob: Blob, seconds: number, effect: 'none' | 'deep') => void;
  hasContent: boolean; // true si texte/images présentes
  isLoading?: boolean;
  maxDuration?: number; // Durée maximale en secondes (défaut: 120)
}

export default function VoiceRecorder({
  isOpen,
  onClose,
  onSubmitAudioOnly,
  onSubmitWithContent,
  hasContent,
  isLoading = false,
  maxDuration = 120, // Par défaut 2 minutes
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceEffect, setVoiceEffect] = useState<'none' | 'deep'>('none');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Essayer plusieurs MIME types pour la compatibilité
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
  if (!selectedMimeType) selectedMimeType = '';

      const mr = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      const chunks: BlobPart[] = [];
      
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      
      mr.onstop = () => {
  const blob = new Blob(chunks, { type: selectedMimeType || 'audio/webm' });
  recordedBlobRef.current = blob;
        stream.getTracks().forEach((t) => t.stop());
        setIsFinalizing(false);
      };
      
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          const next = s + 1;
          if (next >= maxDuration) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone permission failed:', err);
      alert("Impossible d'accéder au micro. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);
    setIsFinalizing(true);
    try {
      mediaRecorderRef.current?.stop();
    } catch (_) {}
  };

  // (Client DSP removed) Server-side effect selection only
  const handleSubmit = async (mode: 'audio-only' | 'content-only' | 'all') => {
    if (!recordedBlobRef.current || recordSeconds < 1) {
      alert('Enregistrement trop court. Minimum 1 seconde.');
      return;
    }

    const finalBlob = recordedBlobRef.current;

    if (mode === 'audio-only') {
      onSubmitAudioOnly(finalBlob, recordSeconds, voiceEffect);
    } else if (mode === 'content-only') {
      onClose(); // Fermer le modal, l'utilisateur publiera le texte/images avec le bouton Publier
    } else if (mode === 'all') {
      onSubmitWithContent(finalBlob, recordSeconds, voiceEffect);
    }

    resetRecorder();
  };

  const resetRecorder = () => {
    setIsRecording(false);
    setRecordSeconds(0);
    recordedBlobRef.current = null;
    setIsFinalizing(false);
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const handleClose = () => {
    resetRecorder();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 p-8 max-w-sm w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Enregistrement vocal</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recording Display */}
        <div className="bg-black/30 rounded-xl p-8 mb-6 text-center border border-white/10">
          <div className="flex justify-center mb-4">
            {isRecording ? (
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-8 h-8 text-red-500" />
              </div>
            ) : recordedBlobRef.current && !isFinalizing ? (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-green-500" />
              </div>
            ) : isFinalizing ? (
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
                <Square className="w-8 h-8 text-yellow-400" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-white/60" />
              </div>
            )}
          </div>

          <div className={`text-3xl font-mono font-bold mb-2 ${
            recordSeconds >= maxDuration * 0.9 ? 'text-red-400' : 
            recordSeconds >= maxDuration * 0.7 ? 'text-yellow-400' : 
            'text-white'
          }`}>
            {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
            {String(recordSeconds % 60).padStart(2, '0')}
          </div>
          <p className="text-sm text-white/60">
            Max {Math.floor(maxDuration / 60)} minute{maxDuration >= 60 ? 's' : ''} ({maxDuration}s)
            {recordSeconds >= maxDuration * 0.9 && (
              <span className="text-red-400 ml-2 font-semibold">⚠️ Limite presque atteinte</span>
            )}
            {recordSeconds >= maxDuration * 0.7 && recordSeconds < maxDuration * 0.9 && (
              <span className="text-yellow-400 ml-2">⚠️ Approche de la limite</span>
            )}
          </p>
        </div>

        {/* Status Message */}
        <div className="text-center mb-6">
          {isRecording ? (
            <p className="text-sm text-red-400">🔴 En direct...</p>
          ) : isFinalizing ? (
            <p className="text-sm text-yellow-400">Traitement de l'enregistrement…</p>
          ) : recordedBlobRef.current ? (
            <p className="text-sm text-green-400">✅ Enregistrement prêt</p>
          ) : (
            <p className="text-sm text-white/50">Appuyez sur le micro pour commencer</p>
          )}
        </div>

        {/* Voice Effects Selection */}
        {recordedBlobRef.current && !isRecording && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-white/60 mb-3 font-semibold uppercase">Effet vocal (anonymat)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Normal', emoji: '😊' },
                { id: 'deep', label: 'Grave', emoji: '🌊' },
              ].map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => setVoiceEffect(effect.id as 'none' | 'deep')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    voiceEffect === effect.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {effect.emoji} {effect.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2">
              {voiceEffect === 'none' && '😊 Voix normale (par défaut)'}
              {voiceEffect === 'deep' && '🌊 Voix grave et profonde — très anonyme'}
            </p>
          </div>
        )}

        {/* Controls */}
        {!isRecording && !recordedBlobRef.current && !isFinalizing ? (
          <div className="flex gap-3">
            <button
              onClick={startRecording}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 rounded-lg font-medium transition disabled:opacity-50"
            >
              <Mic className="w-5 h-5" />
              Enregistrer
            </button>
          </div>
        ) : isRecording ? (
          <div className="flex gap-3">
            <button
              onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 rounded-lg font-medium transition"
            >
              <Square className="w-5 h-5" />
              Arrêter
            </button>
          </div>
        ) : isFinalizing ? (
          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 text-white/70 rounded-lg font-medium transition"
            >
              Traitement…
            </button>
          </div>
        ) : (
          /* Mode selection after recording */
          <div className="space-y-3">
            {/* Option 1: Audio only */}
            <button
              onClick={() => handleSubmit('audio-only')}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 rounded-lg font-medium transition disabled:opacity-50 text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">🎙️ Audio seul</p>
                  <p className="text-xs text-blue-300/70">Publier uniquement ce message vocal</p>
                </div>
                <Send className="w-4 h-4" />
              </div>
            </button>

            {/* Option 2: Content only (text + images) */}
            {hasContent && (
              <button
                onClick={() => handleSubmit('content-only')}
                className="w-full px-4 py-3 bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 rounded-lg font-medium transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">📝 Texte & Images</p>
                    <p className="text-xs text-green-300/70">Publier sans cet audio (garder le brouillon)</p>
                  </div>
                  <Send className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Option 3: All together */}
            {hasContent && (
              <button
                onClick={() => handleSubmit('all')}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition disabled:opacity-50 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">🎬 Tout ensemble</p>
                    <p className="text-xs text-white/70">Publier l'audio + texte + images en même temps</p>
                  </div>
                  <Send className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Fallback: Retry button */}
            <button
              onClick={resetRecorder}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg font-medium transition text-sm"
            >
              ↺ Réessayer
            </button>
          </div>
        )}

        <p className="text-xs text-white/40 text-center mt-4">
          Votre voix sera anonymisée automatiquement
        </p>
      </div>
    </div>
  );
}
