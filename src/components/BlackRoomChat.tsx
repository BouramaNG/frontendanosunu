import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Send, Smile, Loader2, Lock, XCircle, Video, X, ZoomIn, Trash2, MoreVertical } from '@/lib/icons';
import type { BlackRoom, BlackRoomMessage } from '../types';
import api from '../lib/api';
import { getEcho } from '../lib/echo';
import { useAuthStore } from '../store/authStore';

interface BlackRoomChatProps {
  blackRoom: BlackRoom;
}

// Build absolute media URL from storage path returned by API
function useMediaUrlBuilder() {
  return useMemo(() => {
    try {
      const base = (api.defaults.baseURL || '').replace(/\/?api\/?$/, '');
      return (path?: string | null) => {
        if (!path) return '';
        // If already absolute, return as-is
        if (/^https?:\/\//i.test(path)) return path;
        return `${base}/storage/${path.replace(/^\/?storage\/?/, '').replace(/^\/?/, '')}`;
      };
    } catch (_) {
      return (_path?: string | null) => _path || '';
    }
  }, []);
}

const MiniAudioPlayer = React.memo(({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime || 0);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const onAudioEnded = () => setIsPlaying(false);
  const formatTime = (sec: number) => {
    if (!sec || Number.isNaN(sec) || !isFinite(sec)) return '0:00';
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const m = Math.floor(sec / 60).toString();
    return `${m}:${s}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/15"
        >
          {isPlaying ? (
            <span className="text-sm">❚❚</span>
          ) : (
            <span className="text-sm">▶</span>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          value={Math.min(currentTime, duration)}
          step={1}
          onChange={(e) => {
            const val = Number(e.target.value || 0);
            if (audioRef.current) {
              audioRef.current.currentTime = val;
              setCurrentTime(val);
            }
          }}
          className="flex-1 accent-pink-500"
        />
        <div className="text-xs text-white/60 w-12 text-right">{formatTime(currentTime)}</div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onAudioEnded}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
      />
    </div>
  );
});

const STICKERS = ['😀','😂','😍','😎','😢','🔥','💜','👍','🙏','🎉','🫶','🤝'];

// Gesture thresholds
const CANCEL_THRESHOLD = 80; // pixels left
const LOCK_THRESHOLD = 60; // pixels up

// Helper to get x,y from mouse or touch event
function getClientXY(e: any): { x: number; y: number } {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.clientX !== undefined && e.clientY !== undefined) {
    return { x: e.clientX, y: e.clientY };
  }
  return { x: 0, y: 0 };
}

export default function BlackRoomChat({ blackRoom }: BlackRoomChatProps) {
  const [messages, setMessages] = useState<BlackRoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showMenuForMessage, setShowMenuForMessage] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const buildUrl = useMediaUrlBuilder();
  const { user } = useAuthStore();

  // De-duplication and stable cursor
  const seenIdsRef = useRef<Set<number>>(new Set());
  const afterIdRef = useRef<number>(0);

  // Quick voice recording (WhatsApp-like)
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const recordSecRef = useRef<number>(0);
  const [wave, setWave] = useState<number[]>(Array(22).fill(0.3));
  const waveTimerRef = useRef<number | null>(null);
  const sendOnStopRef = useRef<boolean>(true);
  const holdActiveRef = useRef<boolean>(false);
  const isLockedRef = useRef<boolean>(false);
  const willCancelRef = useRef<boolean>(false);
  const [holdActive, setHoldActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [willCancel, setWillCancel] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const realtimeActiveRef = useRef<boolean>(false);

  // Typing and Recording indicators
  const channelRef = useRef<any>(null);
  const typingUsersRef = useRef<Map<number, { name: string; expiry: number }>>(new Map());
  const recordingUsersRef = useRef<Map<number, { name: string; expiry: number }>>(new Map());
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<string[]>([]);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    try {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    } catch {}
  };

  // Merge incoming messages uniquely by id, keep ascending order, update cursors
  const upsertMessages = (incoming: BlackRoomMessage[]) => {
    if (!incoming || incoming.length === 0) return;
    let nextAfter = afterIdRef.current;
    setMessages((prev) => {
      const map = new Map<number, BlackRoomMessage>();
      for (const m of prev) map.set(m.id, m);
      for (const m of incoming) map.set(m.id, m);
      const arr = Array.from(map.values()).sort((a, b) => a.id - b.id);
      seenIdsRef.current = new Set(arr.map((m) => m.id));
      nextAfter = arr.length ? arr[arr.length - 1].id : nextAfter;
      return arr;
    });
    afterIdRef.current = nextAfter;
  };

  const fetchMessages = async (initial = false) => {
    try {
      setPolling(true);
      const cursor = initial ? 0 : afterIdRef.current;
      const res = await api.get(`/black-rooms/${blackRoom.slug}/messages`, {
        params: cursor > 0 ? { after_id: cursor, limit: 50 } : { limit: 50 },
      });
      const items: BlackRoomMessage[] = res.data?.data || [];
      if (items.length > 0) {
        upsertMessages(items);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      // Ignore fetch errors
    } finally {
      setPolling(false);
    }
  };

  const pollIdRef = useRef<number | null>(null);
  const stopPolling = () => {
    if (pollIdRef.current) {
      window.clearInterval(pollIdRef.current);
      pollIdRef.current = null;
    }
  };

  // Clean up expired typing/recording users
  const cleanupExpiredUsers = () => {
    const now = Date.now();

    // Clean typing users
    let typingChanged = false;
    typingUsersRef.current.forEach((value, key) => {
      if (value.expiry < now) {
        typingUsersRef.current.delete(key);
        typingChanged = true;
      }
    });
    if (typingChanged) {
      setTypingUsers(Array.from(typingUsersRef.current.values()).map(u => u.name));
    }

    // Clean recording users
    let recordingChanged = false;
    recordingUsersRef.current.forEach((value, key) => {
      if (value.expiry < now) {
        recordingUsersRef.current.delete(key);
        recordingChanged = true;
      }
    });
    if (recordingChanged) {
      setRecordingUsers(Array.from(recordingUsersRef.current.values()).map(u => u.name));
    }
  };

  // Emit typing event (throttled to every 3 seconds)
  const emitTyping = async () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 3000) {
      return; // Throttled
    }

    lastTypingSentRef.current = now;
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/typing`);
    } catch (e) {
      // Ignore typing emit errors
    }
  };

  // Emit recording event
  const emitRecording = async (isRecordingNow: boolean) => {
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/recording`, {
        is_recording: isRecordingNow
      });
    } catch (e) {
      // Ignore recording emit errors
    }
  };

  // Handle input change with typing throttle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Emit typing event (throttled)
    emitTyping();

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to emit typing again if user keeps typing
    typingTimeoutRef.current = window.setTimeout(() => {
      if (input.trim()) {
        emitTyping();
      }
    }, 2500);
  };

  useEffect(() => {
    // initial load
    fetchMessages(true).then(() => setTimeout(scrollToBottom, 150));
    // start polling (will be disabled if Echo connects)
    pollIdRef.current = window.setInterval(() => {
      fetchMessages(false);
    }, 3000);

    // Setup cleanup interval for expired users
    const cleanupInterval = window.setInterval(cleanupExpiredUsers, 1000);

    // Try to connect Echo and subscribe
    let unsub: (() => void) | null = null;
    getEcho().then((echo) => {
      if (!echo) {
        return;
      }
      try {
        const channel = echo.private(`black-room.${blackRoom.id}`);
        channelRef.current = channel;

        // Listen for new messages
        channel.listen('.BlackRoomMessageCreated', (payload: any) => {
          if (payload?.message) {
            upsertMessages([payload.message]);
            setTimeout(scrollToBottom, 50);
            if (!realtimeActiveRef.current) {
              stopPolling();
              realtimeActiveRef.current = true;
            }
          }
        });

        // Listen for deleted messages
        channel.listen('.BlackRoomMessageDeleted', (payload: any) => {
          if (payload?.message_id) {
            setMessages(prev => prev.filter(m => m.id !== payload.message_id));
            setShowMenuForMessage(null); // Close any open menu
          }
        });

        // Listen for UserTyping events
        channel.listen('.UserTyping', (payload: any) => {
          if (payload?.user_id && payload.user_id !== user?.id) {
            const now = Date.now();
            typingUsersRef.current.set(payload.user_id, {
              name: payload.user_name || 'Anonyme',
              expiry: now + 4000 // 4 seconds expiry
            });
            setTypingUsers(Array.from(typingUsersRef.current.values()).map(u => u.name));
          }
        });

        // Listen for UserRecording events
        channel.listen('.UserRecording', (payload: any) => {
          if (payload?.user_id && payload.user_id !== user?.id) {
            const now = Date.now();
            if (payload.is_recording) {
              recordingUsersRef.current.set(payload.user_id, {
                name: payload.user_name || 'Anonyme',
                expiry: now + 65000 // 65 seconds expiry (max recording time + buffer)
              });
            } else {
              // User stopped recording, remove them immediately
              recordingUsersRef.current.delete(payload.user_id);
            }
            setRecordingUsers(Array.from(recordingUsersRef.current.values()).map(u => u.name));
          }
        });

        unsub = () => {
          try { (echo as any).leave(`black-room.${blackRoom.id}`); } catch {}
          realtimeActiveRef.current = false;
        };
      } catch (err) {
        // Ignore Echo setup errors
      }
    });

    return () => {
      stopPolling();
      window.clearInterval(cleanupInterval);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blackRoom.id, blackRoom.slug]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenuForMessage(null);
    if (showMenuForMessage) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenuForMessage]);

  const sendText = async () => {
    const content = input.trim();
    if (!content) return;
    try {
      setSending(true);
      const res = await api.post(`/black-rooms/${blackRoom.slug}/messages`, {
        type: 'text',
        content,
      });
      const msg: BlackRoomMessage = res.data?.message;
      if (msg) {
        upsertMessages([msg]);
        setInput('');
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      alert("Echec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const onPickImage = async (file: File) => {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image trop volumineuse (max 2 Mo)');
        return;
      }
      setUploading(true);

      // Optimistic UI: create temporary URL for instant display
      const tempUrl = URL.createObjectURL(file);
      const tempId = -Date.now(); // negative temporary ID
      const tempMessage: BlackRoomMessage = {
        id: tempId,
        type: 'image',
        content: undefined,
        file_path: tempUrl,
        user_id: user?.id || 0,
        user: user || undefined,
        black_room_id: blackRoom.id,
        created_at: new Date().toISOString(),
        duration: undefined,
      };

      // Display immediately (optimistic)
      upsertMessages([tempMessage]);
      setTimeout(scrollToBottom, 50);

      // Upload in background
      const fd = new FormData();
      fd.append('type', 'image');
      fd.append('file', file);
      const res = await api.post(`/black-rooms/${blackRoom.slug}/messages`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const realMsg: BlackRoomMessage = res.data?.message;

      if (realMsg) {
        // Replace temporary message with real one from server
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
        // Release temporary URL
        URL.revokeObjectURL(tempUrl);
      }
    } catch (e) {
      alert("Echec de l'upload image");
      // On error, remove temporary message
      setMessages(prev => prev.filter(m => m.id >= 0));
    } finally {
      setUploading(false);
    }
  };

  const onPickVideo = async (file: File) => {
    if (!file) return;
    try {
      if (file.size > 50 * 1024 * 1024) {
        alert('Video trop volumineuse (max 50 Mo)');
        return;
      }
      setUploading(true);

      // Optimistic UI: create temporary URL for instant display
      const tempUrl = URL.createObjectURL(file);
      const tempId = -Date.now();
      const tempMessage: BlackRoomMessage = {
        id: tempId,
        type: 'video',
        content: undefined,
        file_path: tempUrl,
        user_id: user?.id || 0,
        user: user || undefined,
        black_room_id: blackRoom.id,
        created_at: new Date().toISOString(),
        duration: undefined,
      };

      // Display immediately (optimistic)
      upsertMessages([tempMessage]);
      setTimeout(scrollToBottom, 50);

      // Upload in background
      const fd = new FormData();
      fd.append('type', 'video');
      fd.append('file', file);
      const res = await api.post(`/black-rooms/${blackRoom.slug}/messages`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const realMsg: BlackRoomMessage = res.data?.message;

      if (realMsg) {
        // Replace temporary message with real one from server
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
        // Release temporary URL
        URL.revokeObjectURL(tempUrl);
      }
    } catch (e) {
      alert("Echec de l'upload video");
      // On error, remove temporary message
      setMessages(prev => prev.filter(m => m.id >= 0));
    } finally {
      setUploading(false);
    }
  };

  const onSubmitVoice = async (blob: Blob, seconds: number) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('type', 'audio');
      fd.append('file', blob, 'voice-message.webm');
      fd.append('duration', String(Math.min(60, Math.max(1, seconds || 0))));
      const res = await api.post(`/black-rooms/${blackRoom.slug}/messages`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const msg: BlackRoomMessage = res.data?.message;
      if (msg) {
        upsertMessages([msg]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      alert("Echec de l'envoi audio");
    } finally {
      setUploading(false);
    }
  };

  const sendSticker = async (content: string) => {
    try {
      setSending(true);
      const res = await api.post(`/black-rooms/${blackRoom.slug}/messages`, {
        type: 'sticker',
        content,
      });
      const msg: BlackRoomMessage = res.data?.message;
      if (msg) {
        upsertMessages([msg]);
        setShowStickers(false);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      // Ignore sticker send errors
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;
    try {
      await api.delete(`/black-rooms/${blackRoom.slug}/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (e) {
      alert('Impossible de supprimer ce message');
    }
  };

  // Quick recorder: start and stop (auto-send on stop)
  const startQuickRecord = async () => {
    if (isRecording || uploading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick a supported mime type
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selected = '';
      for (const mt of candidates) { if ((window as any).MediaRecorder?.isTypeSupported?.(mt)) { selected = mt; break; } }
      const mr = selected ? new MediaRecorder(stream, { mimeType: selected }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: selected || 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        const secs = recordSecRef.current;
        setIsRecording(false);
        setRecordSec(0);
        recordSecRef.current = 0;
        if (recTimerRef.current) { window.clearInterval(recTimerRef.current); recTimerRef.current = null; }
        if (waveTimerRef.current) { window.clearInterval(waveTimerRef.current); waveTimerRef.current = null; }

        // Emit recording stopped
        emitRecording(false);

        if (sendOnStopRef.current && secs >= 1) {
          await onSubmitVoice(blob, Math.min(60, secs));
        }
        // reset gesture flags
        setHoldActive(false);
        holdActiveRef.current = false;
        setWillCancel(false);
        willCancelRef.current = false;
        setIsLocked(false);
        isLockedRef.current = false;
        setWave(Array(22).fill(0.3));
      };
      mrRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordSec(0);

      // Emit recording started
      emitRecording(true);

      // Start fake waveform animation (lightweight)
      if (waveTimerRef.current) window.clearInterval(waveTimerRef.current);
      waveTimerRef.current = window.setInterval(() => {
        setWave((prev) => prev.map((_v, i) => {
          // create a pleasant random bar height with slight ripple
          const base = 0.2 + Math.random() * 0.8;
          const ripple = Math.sin((Date.now()/120 + i) / 3) * 0.15 + 0.15;
          return Math.min(1, Math.max(0.1, base * 0.7 + ripple * 0.3));
        }));
      }, 120);
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
      recTimerRef.current = window.setInterval(() => {
        recordSecRef.current += 1;
        setRecordSec(recordSecRef.current);
        if (recordSecRef.current >= 60) {
          stopQuickRecord(true);
        }
      }, 1000);
    } catch (e) {
      alert('Impossible d\'acceder au micro');
    }
  };

  const stopQuickRecord = (send = true) => {
    sendOnStopRef.current = send;
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
    }
    if (waveTimerRef.current) { window.clearInterval(waveTimerRef.current); waveTimerRef.current = null; }
    if (!send) {
      setIsLocked(false);
      isLockedRef.current = false;
    }
  };

  const cancelQuickRecord = () => {
    setIsLocked(false);
    isLockedRef.current = false;
    stopQuickRecord(false);
  };

  const cleanupGlobalHandlers = () => {
    window.removeEventListener('mousemove', onGlobalMove as any);
    window.removeEventListener('mouseup', onGlobalUp as any);
    window.removeEventListener('touchmove', onGlobalMove as any);
    window.removeEventListener('touchend', onGlobalUp as any);
    window.removeEventListener('touchcancel', onGlobalUp as any);
  };

  const onGlobalMove = (ev: any) => {
    if (!holdActiveRef.current || !startPosRef.current) return;
    const { x, y } = getClientXY(ev);
    const dx = x - startPosRef.current.x;
    const dy = y - startPosRef.current.y;
    if (!isLockedRef.current) {
      const shouldCancel = dx <= -CANCEL_THRESHOLD;
      if (shouldCancel !== willCancelRef.current) {
        setWillCancel(shouldCancel);
        willCancelRef.current = shouldCancel;
      }
      if (dy <= -LOCK_THRESHOLD) {
        setIsLocked(true);
        isLockedRef.current = true;
        try { (navigator as any).vibrate?.(10); } catch (_) {}
      }
    }
  };

  const onGlobalUp = (_ev: any) => {
    cleanupGlobalHandlers();
    if (!holdActiveRef.current) return;
    if (!isLockedRef.current) {
      if (willCancelRef.current) {
        cancelQuickRecord();
      } else {
        stopQuickRecord(true);
      }
    }
    setHoldActive(false);
    holdActiveRef.current = false;
    setWillCancel(false);
    willCancelRef.current = false;
  };

  const handleMicPressStart = (e: any) => {
    // Ne pas appeler preventDefault pour les événements tactiles (passive listeners)
    if (e?.type !== 'touchstart' && e?.preventDefault && typeof e.preventDefault === 'function') {
      try {
        e.preventDefault();
      } catch (_) {
        // Ignore errors
      }
    }

    if (uploading) return;
    setIsLocked(false);
    isLockedRef.current = false;
    setWillCancel(false);
    willCancelRef.current = false;
    setHoldActive(true);
    holdActiveRef.current = true;
    // remember starting position
    const anyEvent = (e.nativeEvent as any) || e;
    startPosRef.current = getClientXY(anyEvent);
    sendOnStopRef.current = true;
    startQuickRecord();
    window.addEventListener('mousemove', onGlobalMove as any, { passive: false });
    window.addEventListener('mouseup', onGlobalUp as any, { passive: false });
    window.addEventListener('touchmove', onGlobalMove as any, { passive: false });
    window.addEventListener('touchend', onGlobalUp as any, { passive: false });
    window.addEventListener('touchcancel', onGlobalUp as any, { passive: false });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 backdrop-blur-xl">
      {/* Messages list */}
      <div ref={listRef} className="max-h-[50vh] sm:max-h-[60vh] min-h-[35vh] sm:min-h-[40vh] overflow-y-auto p-4 space-y-2">
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} est en train d'ecrire...`
                : typingUsers.length === 2
                ? `${typingUsers[0]} et ${typingUsers[1]} sont en train d'ecrire...`
                : `${typingUsers.slice(0, 2).join(', ')} et ${typingUsers.length - 2} autre${typingUsers.length - 2 > 1 ? 's' : ''} sont en train d'ecrire...`
              }
            </span>
          </div>
        )}

        {/* Recording indicators */}
        {recordingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>
              {recordingUsers.length === 1
                ? `${recordingUsers[0]} est en train d'enregistrer un vocal...`
                : recordingUsers.length === 2
                ? `${recordingUsers[0]} et ${recordingUsers[1]} sont en train d'enregistrer un vocal...`
                : `${recordingUsers.slice(0, 2).join(', ')} et ${recordingUsers.length - 2} autre${recordingUsers.length - 2 > 1 ? 's' : ''} sont en train d'enregistrer un vocal...`
              }
            </span>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-12 text-white/50">Aucun message pour le moment.</div>
        )}
        {messages.map((m, idx) => {
          const isMine = !!(user && Number(m.user_id) === Number(user.id));
          const displayName = isMine ? 'Moi' : (m.user?.name || 'Anonyme');
          const avatarUrl = m.user?.avatar_url || '';
          const prev = idx > 0 ? messages[idx - 1] : undefined;
          const next = idx < messages.length - 1 ? messages[idx + 1] : undefined;
          const prevDelta = prev ? (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime())/1000 : Infinity;
          const nextDelta = next ? (new Date(next.created_at).getTime() - new Date(m.created_at).getTime())/1000 : Infinity;
          const samePrevUser = prev && prev.user_id === m.user_id;
          const sameNextUser = next && next.user_id === m.user_id;
          const showHeader = !samePrevUser || prevDelta > 120;
          const isLastInGroup = !sameNextUser || nextDelta > 120;
          const showSeparator = prev && prevDelta >= 300; // separator if gap >= 5 minutes
          const marginTop = !samePrevUser ? 'mt-4' : 'mt-1'; // Plus d'espace entre différents utilisateurs

          return (
            <div key={`${m.id}-${idx}`} className={marginTop}>
              {showSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="px-4 py-1 text-xs text-white/70 bg-white/5 border border-white/20 rounded-full shadow-lg">
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
                <div className={`relative max-w-[85%] ${
                  m.type === 'text' || m.type === 'sticker' || m.type === 'audio'
                    ? `rounded-2xl px-4 py-3 shadow-xl ${
                        isMine
                          ? 'bg-gradient-to-br from-pink-600 to-purple-600 text-white'
                          : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-white/10'
                      }`
                    : 'p-0'
                }`}>
                  {showHeader && (m.type === 'text' || m.type === 'sticker' || m.type === 'audio') && (
                    <div className={`mb-2 pb-2 border-b ${isMine ? 'border-white/20' : 'border-white/10'} flex items-center justify-between gap-2`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/90">{displayName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{blackRoom.name}</span>
                      </div>
                      {isMine && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuForMessage(showMenuForMessage === m.id ? null : m.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            title="Options"
                          >
                            <MoreVertical className="w-4 h-4 text-white/70" />
                          </button>
                          {showMenuForMessage === m.id && (
                            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-2xl z-10 min-w-[150px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMenuForMessage(null);
                                  deleteMessage(m.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {m.type === 'text' && (
                    <div className="whitespace-pre-wrap break-words text-base leading-relaxed">{m.content}</div>
                  )}

                  {m.type === 'sticker' && (
                    <div className="text-5xl leading-none py-2">{m.content}</div>
                  )}

                  {m.type === 'image' && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 relative">
                      <img
                        src={buildUrl(m.file_path)}
                        alt="image"
                        className="max-h-80 w-full object-cover cursor-pointer"
                        onClick={() => setZoomedImage(buildUrl(m.file_path))}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        draggable={false}
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-2 hover:bg-black/80 transition-colors cursor-pointer" onClick={() => setZoomedImage(buildUrl(m.file_path))}>
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                      {isMine && (
                        <div className="absolute top-2 left-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuForMessage(showMenuForMessage === m.id ? null : m.id);
                            }}
                            className="bg-black/60 backdrop-blur-sm p-2 rounded-full hover:bg-black/80 transition-colors"
                            title="Options"
                          >
                            <MoreVertical className="w-5 h-5 text-white" />
                          </button>
                          {showMenuForMessage === m.id && (
                            <div className="absolute left-0 top-full mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-2xl z-10 min-w-[150px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMenuForMessage(null);
                                  deleteMessage(m.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {showHeader && (
                        <div className="px-3 py-2 bg-black/40 backdrop-blur-sm flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{displayName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {m.type === 'video' && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 relative">
                      <video
                        src={buildUrl(m.file_path)}
                        className="max-h-80 w-full object-cover"
                        controls
                        controlsList="nodownload"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        draggable={false}
                      />
                      {isMine && (
                        <div className="absolute top-2 left-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuForMessage(showMenuForMessage === m.id ? null : m.id);
                            }}
                            className="bg-black/60 backdrop-blur-sm p-2 rounded-full hover:bg-black/80 transition-colors"
                            title="Options"
                          >
                            <MoreVertical className="w-5 h-5 text-white" />
                          </button>
                          {showMenuForMessage === m.id && (
                            <div className="absolute left-0 top-full mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-2xl z-10 min-w-[150px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMenuForMessage(null);
                                  deleteMessage(m.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {showHeader && (
                        <div className="px-3 py-2 bg-black/40 backdrop-blur-sm flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{displayName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {m.type === 'audio' && (
                    <div className="min-w-[280px]">
                      <MiniAudioPlayer src={buildUrl(m.file_path)} />
                    </div>
                  )}

                  {(m.type === 'text' || m.type === 'sticker' || m.type === 'audio') && (
                    <div className={`mt-1 text-[10px] ${isMine ? 'text-white/60 text-right' : 'text-white/50'}`}>
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  {isLastInGroup && (m.type === 'text' || m.type === 'sticker' || m.type === 'audio') && (
                    <div className={`absolute bottom-2 ${isMine ? '-right-2' : '-left-2'} w-4 h-4 rotate-45 ${
                      isMine
                        ? 'bg-gradient-to-br from-pink-600 to-purple-600'
                        : 'bg-gradient-to-br from-gray-800 to-gray-900 border-l border-t border-white/10'
                    }`}></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {polling && (
          <div className="flex justify-center py-2 text-white/40 text-xs"><Loader2 className="w-4 h-4 animate-spin mr-1" /> Mise a jour…</div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 p-3">
        {/* Hints during hold (not locked) + waveform */}
        {holdActive && !isLocked && (
          <div className="px-1 pb-2">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-end gap-[2px] h-6">
                {wave.map((v, i) => (
                  <div key={i} className={`w-[3px] ${willCancel ? 'bg-red-400/80' : 'bg-pink-400/80'} rounded`} style={{ height: `${Math.max(2, Math.min(24, v*24))}px` }} />
                ))}
              </div>
              <div className={`text-xs px-3 py-1 rounded-full border flex items-center gap-2 ${willCancel ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-white/5 border-white/20 text-white/70'}`}>
                <XCircle className="w-3 h-3" /> Glissez pour annuler • <Lock className="w-3 h-3" /> Vers le haut pour verrouiller
              </div>
            </div>
          </div>
        )}
        {/* Locked controls bar */}
        {isRecording && isLocked && (
          <div className="px-1 pb-2">
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl px-3 py-2">
              <span className="text-sm">🔴 Enregistrement {String(Math.floor(recordSec/60)).padStart(2,'0')}:{String(recordSec%60).padStart(2,'0')} / 60s</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={cancelQuickRecord} className="px-3 py-1 bg-white/10 hover:bg-white/15 rounded-lg border border-white/20 text-white/80">Annuler</button>
                <button type="button" onClick={() => stopQuickRecord(true)} className="px-3 py-1 bg-red-500/30 hover:bg-red-500/40 rounded-lg border border-red-500/40">Terminer & envoyer</button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-end gap-[2px] h-6">
                {wave.map((v, i) => (
                  <div key={i} className="w-[3px] bg-red-400/80 rounded" style={{ height: `${Math.max(2, Math.min(24, v*24))}px` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Image */}
          <label className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickImage(f);
                e.currentTarget.value = '';
              }}
            />
            <ImageIcon className="w-5 h-5" />
          </label>

          {/* Video */}
          <label className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 cursor-pointer">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickVideo(f);
                e.currentTarget.value = '';
              }}
            />
            <Video className="w-5 h-5" />
          </label>

          {/* Stickers */}
          <button
            type="button"
            onClick={() => setShowStickers((s) => !s)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15"
            title="Stickers"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Input */}
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
            placeholder="Ecrire un message… (emoji supportes)"
            className="flex-1 px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50"
          />

          {/* Mic button (hold to record) */}
          <button
            type="button"
            onMouseDown={handleMicPressStart}
            onTouchStart={handleMicPressStart}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border text-white transition select-none ${isRecording ? (willCancel ? 'bg-red-500/40 border-red-500/60' : 'bg-red-500/30 border-red-500/40') : 'bg-white/10 border-white/20 hover:bg-white/15'}`}
            title={isRecording ? (isLocked ? 'Enregistrement verrouille' : (willCancel ? 'Relachez pour annuler' : 'Relachez pour envoyer')) : 'Appuyez et maintenez pour parler'}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send */}
          <button
            type="button"
            disabled={sending || uploading || !input.trim()}
            onClick={sendText}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-60"
            title="Envoyer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {showStickers && (
          <div className="mt-3 grid grid-cols-8 gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
            {STICKERS.map((s) => (
              <button
                key={s}
                onClick={() => sendSticker(s)}
                className="text-2xl p-2 hover:bg-white/10 rounded-lg"
                title="Envoyer sticker"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all z-10"
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
