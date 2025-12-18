import { useState, useEffect, useRef } from 'react';
import { MessageCircle, ThumbsUp, Flag, Loader2, Send, MoreVertical, Trash2, Reply, Link as LinkIcon, Share2 } from '@/lib/icons';
import type { BlackRoom, BlackRoomPost, BlackRoomPostComment } from '../types';
import api from '../lib/api';
import WhatsAppVoiceRecorder from './WhatsAppVoiceRecorder';
import { useAuthStore } from '../store/authStore';

interface BlackRoomPostCommentsProps {
  blackRoom: BlackRoom;
  post: BlackRoomPost;
  onCommentAdded: () => void;
  defaultExpanded?: boolean;
}

export default function BlackRoomPostComments({ blackRoom, post, onCommentAdded, defaultExpanded = false }: BlackRoomPostCommentsProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<BlackRoomPostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (expanded) {
      fetchComments();
    }
  }, [expanded, post.id]);

  useEffect(() => {
    if (expanded && comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, expanded]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/black-rooms/${blackRoom.slug}/posts/${post.id}/comments`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      return;
    }

    setLoading(true);
    try {
      console.debug('[COMMENT] prepare', {
        slug: blackRoom.slug,
        postId: post.id,
        hasContent: !!commentContent.trim(),
        parentId: replyingTo,
      });
      const formData = new FormData();
      
      if (commentContent.trim()) {
        formData.append('content', commentContent);
      }

      if (replyingTo) {
        formData.append('parent_id', String(replyingTo));
      }

      const url = `/black-rooms/${blackRoom.slug}/posts/${post.id}/comments`;
      console.debug('[COMMENT] POST', url);
      const res = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.debug('[COMMENT] response', { status: res.status, data: res.data });

      setCommentContent('');
      setReplyingTo(null);
      fetchComments();
      onCommentAdded();
    } catch (error: any) {
      console.error('Error creating comment:', error);
      if (error?.response) {
        console.debug('[COMMENT] error_response', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      alert(error.response?.data?.message || 'Erreur lors de la création du commentaire');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceComment = async (blob: Blob, seconds: number, effect: 'none' | 'deep') => {
    void effect; // éviter l'avertissement TS sur le paramètre non utilisé
    setLoading(true);
    try {
      console.debug('[VOICE_COMMENT] prepare', {
        slug: blackRoom.slug,
        postId: post.id,
        seconds,
        blobType: (blob as any)?.type,
        blobSize: (blob as any)?.size,
        hasContent: !!commentContent.trim(),
        parentId: replyingTo,
      });
      const formData = new FormData();
      formData.append('audio', blob, 'comment_voice.webm');
      formData.append('audio_duration', String(seconds));

      if (commentContent.trim()) {
        formData.append('content', commentContent);
      }

      if (replyingTo) {
        formData.append('parent_id', String(replyingTo));
      }

      // Dev log: form data summary
      try {
        const entries: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const [k, v] of formData.entries() as any) {
          if (v instanceof Blob) {
            entries.push({ key: k, blob: { type: v.type, size: v.size } });
          } else {
            entries.push({ key: k, value: v });
          }
        }
        console.debug('[VOICE_COMMENT] formData', entries);
      } catch (_) {}

      const url = `/black-rooms/${blackRoom.slug}/posts/${post.id}/comments`;
      console.debug('[VOICE_COMMENT] POST', url);
      const res = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.debug('[VOICE_COMMENT] response', { status: res.status, data: res.data });

      setCommentContent('');
      setReplyingTo(null);
      fetchComments();
      onCommentAdded();
    } catch (error: any) {
      console.error('Error creating voice comment:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du commentaire audio';
      if (error?.response) {
        console.debug('[VOICE_COMMENT] error_response', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/posts/${post.id}/comments/${commentId}/like`);
      fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReportComment = async (commentId: number) => {
    if (!confirm('Voulez-vous signaler ce commentaire ?')) return;
    
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/posts/${post.id}/comments/${commentId}/report`);
      alert('Commentaire signalé');
      fetchComments();
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    
    try {
      await api.delete(`/black-rooms/${blackRoom.slug}/posts/${post.id}/comments/${commentId}`);
      alert('Commentaire supprimé');
      fetchComments();
      onCommentAdded();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression du commentaire');
    }
  };

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const maxAudioDuration = blackRoom.type === 'private' ? 180 : 60; // 3 min pour privées, 1 min pour publiques

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-white/70 hover:text-white transition mb-4"
      >
        <MessageCircle className="w-5 h-5" />
        <span>{post.comments_count} commentaire{post.comments_count !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          {/* Comments List */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {loading && comments.length === 0 ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-white/50 text-center py-4">Aucun commentaire</p>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={user}
                  blackRoom={blackRoom}
                  post={post}
                  onLike={handleLikeComment}
                  onReport={handleReportComment}
                  onDelete={handleDeleteComment}
                  onReply={(id) => {
                    setReplyingTo(id);
                    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  replyingTo={replyingTo}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  menuRefs={menuRefs}
                  maxAudioDuration={maxAudioDuration}
                />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="border-t border-white/10 pt-4">
            {replyingTo && (() => {
              const parentComment = comments.find(c => c.id === replyingTo) || 
                comments.flatMap(c => c.replies || []).find(r => r.id === replyingTo);
              return parentComment ? (
                <div className="mb-2 p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 flex items-center justify-between">
                  <p className="text-white/70 text-xs">
                    Répondre à <span className="font-semibold">{parentComment.user?.name || 'Anonyme'}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-purple-300 text-xs hover:text-purple-200"
                  >
                    Annuler
                  </button>
                </div>
              ) : null;
            })()}
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyingTo ? "Écrire une réponse..." : "Ajouter un commentaire..."}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-2 resize-none text-sm"
              rows={2}
              maxLength={2000}
            />
            <div className="flex items-center gap-2">
              {/* Voice Recorder - WhatsApp style */}
              <WhatsAppVoiceRecorder
                onRecordingComplete={(blob, seconds) => handleVoiceComment(blob, seconds, 'none')}
                maxDuration={maxAudioDuration}
                disabled={loading}
              />
              <div className="flex-1" />
              <button
                type="submit"
                disabled={loading || !commentContent.trim()}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publier
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher un commentaire avec ses réponses
interface CommentItemProps {
  comment: BlackRoomPostComment;
  user: any;
  blackRoom: BlackRoom;
  post: BlackRoomPost;
  onLike: (id: number) => void;
  onReport: (id: number) => void;
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
  replyingTo: number | null;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  menuRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
  maxAudioDuration: number;
}

function CommentItem({
  comment,
  user,
  blackRoom,
  post,
  onLike,
  onReport,
  onDelete,
  onReply,
  replyingTo,
  openMenuId,
  setOpenMenuId,
  menuRefs,
  maxAudioDuration,
}: CommentItemProps) {
  const isOwner = user && comment.user?.id === user.id;
  const showReplies = comment.replies && comment.replies.length > 0;
  const [repliesExpanded, setRepliesExpanded] = useState(true);

  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">
            {comment.user?.avatar_url || '👤'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-sm font-medium">
              {comment.user?.name || 'Anonyme'}
            </span>
            {/* Badge simple: Auteur / Utilisateur */}
            {post.user && comment.user && post.user.id === comment.user.id ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/40 flex items-center gap-1">
                <span>✍️</span>
                <span>Auteur</span>
              </span>
            ) : comment.user && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                <span>👤</span>
                <span>Utilisateur</span>
              </span>
            )}
            <span className="text-white/50 text-xs">
              {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {comment.content && (
            <p className="text-white/80 text-sm mb-2">{comment.content}</p>
          )}

          {comment.audio_path && (
            <audio
              src={comment.audio_path}
              controls
              className="w-full mb-2"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
            />
          )}
        </div>

        {/* Menu trois points */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
            className="p-1 text-white/50 hover:text-white transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {openMenuId === comment.id && (
            <div
              ref={(el) => { menuRefs.current[comment.id] = el; }}
              className="absolute right-0 top-8 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg z-50 min-w-[120px]"
            >
              {/* Copier le lien */}
              <button
                onClick={async () => {
                  const origin = window.location?.origin || '';
                  const url = `${origin}/black-rooms/${blackRoom.slug}?post=${post.id}&comment=${comment.id}`;
                  await navigator.clipboard.writeText(url);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm"
              >
                <LinkIcon className="w-4 h-4" /> Copier le lien
              </button>

              {/* Partager */}
              <button
                onClick={async () => {
                  const origin = window.location?.origin || '';
                  const url = `${origin}/black-rooms/${blackRoom.slug}?post=${post.id}&comment=${comment.id}`;
                  const shareData = { title: 'Commentaire', text: comment.content?.slice(0,120) || 'Voir le commentaire', url };
                  try {
                    if ((navigator as any).share) {
                      await (navigator as any).share(shareData);
                    } else {
                      await navigator.clipboard.writeText(url);
                    }
                  } finally {
                    setOpenMenuId(null);
                  }
                }}
                className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm"
              >
                <Share2 className="w-4 h-4" /> Partager…
              </button>

              {/* Supprimer si auteur ou admin/modo */}
              {(isOwner || (user && (user.role === 'admin' || (user.role === 'moderator' && user.is_moderator_verified)))) && (
                <button
                  onClick={() => {
                    onDelete(comment.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
              <button
                onClick={() => {
                  onReport(comment.id);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-white/70 hover:bg-white/10 flex items-center gap-2 text-sm"
              >
                <Flag className="w-4 h-4" />
                Signaler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/10">
        <button
          onClick={() => onLike(comment.id)}
          className="flex items-center gap-1 text-white/70 hover:text-white text-xs"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{comment.likes_count}</span>
        </button>
        <button
          onClick={() => onReply(comment.id)}
          className="flex items-center gap-1 text-white/70 hover:text-white text-xs"
        >
          <Reply className="w-4 h-4" />
          <span>Répondre</span>
          {comment.replies_count > 0 && (
            <span className="ml-1">({comment.replies_count})</span>
          )}
        </button>
      </div>

      {/* Réponses */}
      {showReplies && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-white/10">
          <button
            onClick={() => setRepliesExpanded(!repliesExpanded)}
            className="text-white/50 text-xs mb-2 hover:text-white/70"
          >
            {repliesExpanded ? 'Masquer' : 'Afficher'} {comment.replies_count} réponse{comment.replies_count > 1 ? 's' : ''}
          </button>
          {repliesExpanded && comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              blackRoom={blackRoom}
              post={post}
              onLike={onLike}
              onReport={onReport}
              onDelete={onDelete}
              onReply={onReply}
              replyingTo={replyingTo}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              menuRefs={menuRefs}
              maxAudioDuration={maxAudioDuration}
            />
          ))}
        </div>
      )}

      {/* Indicateur de réponse */}
      {replyingTo === comment.id && (
        <div className="mt-2 p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
          <p className="text-white/70 text-xs mb-1">Répondre à {comment.user?.name || 'Anonyme'}</p>
          <button
            onClick={() => onReply(0)}
            className="text-purple-300 text-xs hover:text-purple-200"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

