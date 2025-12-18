import { useEffect, useState, useRef } from 'react';
import { X, Send, Mic, Square } from '@/lib/icons';
import type { Comment, User } from '../types';
import CommentThread from './CommentThread';

interface CommentsModalProps {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  currentUser?: User;
  commentCount: number;
  canModerate?: boolean;
  isLoading?: boolean;
  onReply?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  onLike?: (commentId: number) => void;
  onReport?: (comment: Comment) => void;
  likedComments?: Set<number>;
  loadingComments?: Set<number>;
  onSubmitReply?: (parentCommentId: number, content: string) => Promise<void>;
  onSubmitComment?: (content: string) => Promise<void>;
  onSubmitVoiceComment?: (audioBlob: Blob, duration: number) => Promise<void>;
}

export default function CommentsModal({
  open,
  onClose,
  comments,
  currentUser,
  commentCount,
  canModerate = false,
  isLoading = false,
  onReply,
  onDelete,
  onLike,
  onReport,
  likedComments = new Set(),
  loadingComments = new Set(),
  onSubmitReply,
  onSubmitComment,
  onSubmitVoiceComment,
}: CommentsModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Deletion handled by parent via onDelete

  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSubmittingVoice, setIsSubmittingVoice] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    setReplyContent(`@${comment.user?.name || 'utilisateur'} `);
  };

  const handleSubmitReplyClick = async () => {
    if (!replyingTo || !replyContent.trim() || !onSubmitReply) return;

    setIsSubmittingReply(true);
    try {
      await onSubmitReply(replyingTo.id, replyContent);
      setReplyingTo(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSubmitNewCommentClick = async () => {
    if (!newCommentContent.trim() || !onSubmitComment) return;

    setIsSubmittingComment(true);
    try {
      await onSubmitComment(newCommentContent);
      setNewCommentContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Note: call onDelete(commentId) to request deletion from parent

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Timer pour la durée d'enregistrement (max 60s)
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= 60) {
            stopVoiceRecording();
            return 60;
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopVoiceRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (onSubmitVoiceComment && recordingDuration > 0) {
          setIsSubmittingVoice(true);
          try {
            await onSubmitVoiceComment(audioBlob, recordingDuration);
            setRecordingDuration(0);
          } catch (error) {
            console.error('Error submitting voice comment:', error);
          } finally {
            setIsSubmittingVoice(false);
          }
        }
      }, { once: true });
    }
    
    setIsRecording(false);
    
    // Stop all audio tracks
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center md:items-end">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${
          isMobile ? 'h-[60vh] rounded-t-3xl' : 'md:w-[500px] md:h-[65vh] md:rounded-2xl md:mb-4'
        } bg-gradient-to-b from-slate-900 via-slate-900 to-black border border-white/10 shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">{commentCount} commentaire{commentCount !== 1 ? 's' : ''}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Comments List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/50 text-sm">
              Aucun commentaire
            </div>
          ) : (
            <CommentThread
              comments={comments}
              currentUser={currentUser}
              canModerate={canModerate}
              size="lg"
              onReply={handleReplyClick}
              onDelete={onDelete}
              onLike={onLike}
              onReport={onReport}
              likedComments={likedComments}
              loadingComments={loadingComments}
            />
          )}
        </div>

        {/* Reply Input - Bottom */}
        {replyingTo && (
          <div className="border-t border-white/10 p-3 bg-white/5">
            <div className="mb-2 p-2 bg-purple-500/20 rounded border border-purple-500/30 flex items-center justify-between">
              <p className="text-white/70 text-xs">
                Répondre à <span className="font-semibold text-purple-300">{replyingTo.user?.name || 'Anonyme'}</span>
              </p>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="text-white/50 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Écrivez votre réponse..."
                className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                rows={2}
              />
              <button
                onClick={handleSubmitReplyClick}
                disabled={!replyContent.trim() || isSubmittingReply}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium disabled:opacity-50 transition flex items-center gap-1"
              >
                {isSubmittingReply ? '...' : <Send className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* New Comment Input - Bottom */}
        {onSubmitComment && currentUser && !replyingTo && (
          <div className="border-t border-white/10 p-3 bg-white/5">
            <div className="flex gap-2 items-end">
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                rows={2}
              />
              {/* Mic Button - Only if voice comments are supported */}
              {onSubmitVoiceComment && (
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`p-2 rounded-lg transition flex-shrink-0 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                  }`}
                  title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer un commentaire vocal'}
                >
                  {isRecording ? <Square size={18} /> : <Mic size={18} />}
                </button>
              )}
              {/* Send Button */}
              <button
                onClick={handleSubmitNewCommentClick}
                disabled={!newCommentContent.trim() || isSubmittingComment}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium disabled:opacity-50 transition flex items-center gap-1"
              >
                {isSubmittingComment ? '...' : <Send className="w-3 h-3" />}
              </button>
            </div>
            {/* Recording Timer - Only if voice comments are supported */}
            {onSubmitVoiceComment && isRecording && (
              <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Enregistrement: {recordingDuration}s / 60s
              </div>
            )}
          </div>
        )}

  {/* Confirmation handled by parent */}
      </div>
    </div>
  );
}
