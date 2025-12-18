import { useState } from 'react';
import { Heart, Reply, Trash2, AlertTriangle, MoreVertical, Link as LinkIcon, Share2 } from '@/lib/icons';
import type { Comment, User } from '../types';
import UserBadge from './UserBadge';

interface CommentThreadProps {
  comments: Comment[];
  currentUser?: User;
  onReply?: (comment: Comment) => void;
  onLike?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  onReport?: (comment: Comment) => void;
  likedComments?: Set<number>;
  loadingComments?: Set<number>;
  canModerate?: boolean;
  onShareComment?: (comment: Comment) => void;
  onCopyCommentLink?: (comment: Comment) => void;
  size?: 'md' | 'lg';
}

export default function CommentThread({
  comments,
  currentUser,
  onReply,
  onLike,
  onDelete,
  onReport,
  likedComments = new Set(),
  loadingComments = new Set(),
  canModerate = false,
  onShareComment,
  onCopyCommentLink,
  size = 'md',
}: CommentThreadProps) {
  const isLg = size === 'lg';
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Normalize in case parent passes API envelope { data: [...] }
  const list: Comment[] = Array.isArray(comments)
    ? comments
    : (((comments as unknown as { data?: Comment[] })?.data) ?? []);

  const toggleReplies = (commentId: number) => {
    const updated = new Set(expandedReplies);
    if (updated.has(commentId)) {
      updated.delete(commentId);
    } else {
      updated.add(commentId);
    }
    setExpandedReplies(updated);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

    if (diffSeconds < 60) return formatter.format(-diffSeconds, 'second');
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return formatter.format(-diffMinutes, 'minute');
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return formatter.format(-diffHours, 'hour');
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return formatter.format(-diffDays, 'day');
    return `il y a ${diffDays}j`;
  };

  const renderCommentTree = (comment: Comment, depth: number = 0) => {
    const authorId = (comment as any).user_id ?? (comment.user as any)?.id;
    const isOwn = Number(currentUser?.id) === Number(authorId);
    const isOwnByName = (currentUser?.name && comment.user?.name) ? (currentUser?.name === comment.user?.name) : false;
    const canDeleteUI = (isOwn || isOwnByName || canModerate);
    const isLiked = likedComments.has(comment.id);
    const isLoading = loadingComments.has(comment.id);
    const isReply = depth > 0;

    return (
      <div
        key={comment.id}
        className={`flex ${isReply ? 'gap-2' : 'gap-3'} ${isReply ? 'bg-white/[0.02] p-3 rounded-lg border border-white/5' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{ marginLeft: depth > 0 ? `0px` : undefined }}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isReply ? 'w-6 h-6' : 'w-8 h-8'}`}>
          <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${isReply ? 'text-[10px]' : 'text-sm'} font-bold ring-1 ring-white/20`}>
            {comment.user?.name?.[0] || '👤'}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-semibold text-white">
              {comment.user?.name || 'Anonyme'}
            </span>
            {/* Badge de niveau utilisateur */}
            {comment.user && <UserBadge user={comment.user} />}
            {/* Badge de rôle (modérateur/admin) */}
            {comment.user && (comment.user.role === 'moderator' || comment.user.role === 'admin') && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                comment.user.role === 'moderator'
                  ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 text-blue-100 shadow-md shadow-blue-500/20'
                  : comment.user.role === 'admin'
                  ? 'border-red-500/50 bg-gradient-to-r from-red-500/30 via-rose-500/30 to-red-500/30 text-red-100 shadow-md shadow-red-500/20'
                  : ''
              }`}>
                {comment.user.role === 'moderator' ? (
                  <>🛡️ Modérateur</>
                ) : comment.user.role === 'admin' ? (
                  <>👑 Admin</>
                ) : null}
              </span>
            )}
            <span className="text-white/50">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.is_blocked && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-xs">
                Bloqué
              </span>
            )}
          </div>

          {/* Texte du commentaire */}
          {comment.content && (
            <p className={`text-white/80 ${isLg ? 'text-base' : 'text-sm'} ${isReply ? '!text-sm' : ''} leading-relaxed mb-2 break-words`}>{comment.content}</p>
          )}

          {/* Audio du commentaire (voice note) */}
          {(((comment as any).audio_path) || ((comment as any).audio_url)) && (
            <div className="mb-2">
              <div className="text-xs text-white/50 mb-1">Commentaire vocal</div>
              <audio
                controls
                className="w-full h-8 rounded"
                controlsList="nodownload"
                src={(comment as any).audio_url || (comment as any).audio_path}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
              >
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center gap-2 mt-2 text-white/50 relative ${isLg ? 'py-1' : ''} ${isReply ? 'gap-2' : 'gap-4'}`}>
            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(comment.id);
              }}
              disabled={isLoading}
              className={`flex items-center gap-1 ${isLg ? 'text-sm' : 'text-xs'} ${isReply ? '!text-xs' : ''} transition hover:text-red-400 ${
                isLiked ? 'text-red-400' : ''
              } disabled:opacity-50`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes_count}</span>
            </button>

            {/* Reply */}
            {onReply && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(comment);
                }}
                className={`flex items-center gap-1 ${isLg ? 'text-sm' : 'text-xs'} transition hover:text-blue-400`}
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Répondre</span>
              </button>
            )}

            {/* More menu */}
            <div className="ml-auto relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId((prev) => (prev === comment.id ? null : comment.id));
                }}
                className="text-white/60 hover:text-white/80 transition p-1 rounded hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={openMenuId === comment.id}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenuId === comment.id && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 bg-zinc-900/95 border border-white/10 rounded-md shadow-lg z-20 backdrop-blur-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10"
                    onClick={() => {
                      onCopyCommentLink?.(comment);
                      setOpenMenuId(null);
                    }}
                  >
                    <LinkIcon className="w-4 h-4" /> Copier le lien
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10"
                    onClick={() => {
                      onShareComment?.(comment);
                      setOpenMenuId(null);
                    }}
                  >
                    <Share2 className="w-4 h-4" /> Partager…
                  </button>
                  {onReport && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10"
                      onClick={() => {
                        onReport(comment);
                        setOpenMenuId(null);
                      }}
                    >
                      <AlertTriangle className="w-4 h-4" /> Signaler
                    </button>
                  )}
                  
                  {canDeleteUI && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-300 hover:bg-white/10"
                      onClick={() => {
                        if (onDelete) {
                          onDelete(comment.id);
                        } else {
                          console.warn('[UI][COMMENT] onDelete handler missing');
                        }
                        setOpenMenuId(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-white/50 hover:text-white/70 transition mb-3 w-full flex items-center gap-2"
              >
                <span className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent"></span>
                <span className="text-white/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 whitespace-nowrap">
                  {expandedReplies.has(comment.id)
                    ? `↑ Masquer ${comment.replies.length} réponse${comment.replies.length > 1 ? 's' : ''}`
                    : `↓ Réponse${comment.replies.length > 1 ? 's' : ''} (${comment.replies.length})`}
                </span>
                <span className="flex-1 h-px bg-gradient-to-l from-white/20 via-white/10 to-transparent"></span>
              </button>

              {expandedReplies.has(comment.id) && (
                <div className="mt-3 space-y-3 pl-0">
                  {comment.replies.map((reply) =>
                    renderCommentTree(reply, depth + 1)
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (list.length === 0) {
    return (
      <div className="py-8 text-center text-white/50 text-sm">
        Aucun commentaire pour le moment. Soyez le premier !
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {list.map((comment) => renderCommentTree(comment))}
    </div>
  );
}
