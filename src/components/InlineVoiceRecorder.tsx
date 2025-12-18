import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic } from '@/lib/icons';

interface InlineVoiceRecorderProps {
  onSubmit: (blob: Blob, seconds: number) => void;
}

export default function InlineVoiceRecorder({ onSubmit }: InlineVoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPressingRef = useRef(false);

  const cleanup = useCallback(() => {
    setRecording(false);
    setSeconds(0);
    isPressingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    const mr = mediaRecorderRef.current;
    if (mr) {
      try {
        mr.stop();
      } catch (e) {}
      const stream = (mr as any).stream;
      if (stream) stream.getTracks().forEach((t: any) => t.stop());
      mediaRecorderRef.current = null;
    }
  }, []);

  const stopAndSend = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const duration = Math.round(seconds);
      if (blob.size > 0) {
        onSubmit(blob, Math.min(duration, 120));
      }
      cleanup();
    };
    try {
      mr.stop();
    } catch (e) {
      cleanup();
    }
  }, [seconds, onSubmit, cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      startTimeRef.current = Date.now();
      setRecording(true);
      setSeconds(0);

      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const s = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setSeconds(s);
          if (s >= 120) stopAndSend();
        }
      }, 100);
    } catch (err) {
      alert('Micro inaccessible. Vérifiez les permissions du navigateur.');
      cleanup();
    }
  }, [cleanup, stopAndSend]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isPressingRef.current = true;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    startRecording();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches?.[0];
    if (!t) return;
    isPressingRef.current = true;
    pointerStartRef.current = { x: t.clientX, y: t.clientY };
    startRecording();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recording || !isPressingRef.current || !pointerStartRef.current) return;

    const dy = e.clientY - pointerStartRef.current.y;
    // Swipe UP (dy < -50) = LOCK (hands-free, just hide the interaction)
    if (dy < -50) {
      // Locked hands-free mode - do nothing, just keep recording
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recording || !isPressingRef.current || !pointerStartRef.current) return;

    const t = e.touches?.[0];
    if (!t) return;

    const dy = t.clientY - pointerStartRef.current.y;
    // Swipe UP (dy < -50) = LOCK (hands-free, just hide the interaction)
    if (dy < -50) {
      // Locked hands-free mode - do nothing, just keep recording
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recording || !isPressingRef.current) return;
    isPressingRef.current = false;
    stopAndSend();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recording || !isPressingRef.current) return;
    isPressingRef.current = false;
    stopAndSend();
  };

  if (!recording) {
    return (
      <button
        onPointerDown={onPointerDown}
        onTouchStart={onTouchStart}
        className="p-2 text-white/60 hover:text-white transition"
        style={{ touchAction: 'none' }}
        title="Appui long pour enregistrer"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-600/20 px-3 py-2 rounded-lg">
      <div className="text-sm text-white font-medium">
        🎤 {seconds}s
      </div>

      {/* Invisible overlay to capture moves & release while recording */}
      <div
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="fixed inset-0 z-50"
        style={{ pointerEvents: 'auto', background: 'transparent', touchAction: 'none' }}
      />
    </div>
  );
}
