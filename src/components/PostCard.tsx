import { useRef, useState, useEffect } from 'react';
import {
  MessageCircle,
  Share2,
  MoreVertical,
  AlertTriangle,
  Trash2,
  Ban,
  ShieldBan,
  Undo2,
  Link as LinkIcon,
} from '@/lib/icons';
import type { Post, User } from '../types';
import UserBadge from './UserBadge';

interface PostCardProps {
  post: Post;
  currentUser?: User;
  onLike: (postId: number) => void;
  onDislike?: (postId: number) => void;
  likesDisplayCount?: number;
  onComment: (postId: number) => void;
  onShare?: (postId: number) => void;
  onReport: (post: Post) => void;
  onDelete: (postId: number) => void;
  onBlock?: (postId: number) => void;
  onUnblock?: (postId: number) => void;
  canModerate: boolean;
  commentsCount?: number;
  expandedComments?: boolean;
  loadingStates?: {
    liking?: boolean;
    deleting?: boolean;
    moderating?: boolean;
  };
  onExpand?: () => void;
}

const ROLE_BADGE_CONFIG: Record<User['role'], { label: string; className: string; icon: React.ReactNode }> = {
  user: {
    label: 'Utilisateur',
    className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200',
    icon: null,
  },
  moderator: {
    label: 'Modérateur',
    className: 'border-blue-500/50 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 text-blue-100 shadow-lg shadow-blue-500/30 backdrop-blur-sm',
    icon: <span className="text-xs">🛡️</span>,
  },
  admin: {
    label: 'Admin',
    className: 'border-red-500/50 bg-gradient-to-r from-red-500/30 via-rose-500/30 to-red-500/30 text-red-100 shadow-lg shadow-red-500/30 backdrop-blur-sm',
    icon: <span className="text-xs">👑</span>,
  },
};

export default function PostCard({
  post,
  currentUser,
  onLike,
  onDislike,
  likesDisplayCount,
  onComment,
  onShare,
  onReport,
  onDelete,
  onBlock,
  onUnblock,
  canModerate,
  commentsCount = 0,
  expandedComments = false,
  loadingStates = {},
  onExpand,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isOwnPost = Number(currentUser?.id) === Number(((post as any).user_id ?? (post.user as any)?.id));
  const isBlocked = post.is_blocked;
  const badge =
    post.user?.role && post.user.role !== 'user'
      ? ROLE_BADGE_CONFIG[post.user.role]
      : null;

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return formatter.format(-diffMonths, 'month');
    const diffYears = Math.floor(diffMonths / 12);
    return formatter.format(-diffYears, 'year');
  };

  const hasAudio = Boolean(post.audio_url);
  const hasImages = Array.isArray(post.images) && post.images.length > 0;
  const hasVideos = Array.isArray((post as any).videos) && (post as any).videos.length > 0;

  // Get background gradient class + accent color based on topic
  const getAudioBackgroundStyle = (topicSlug?: string) => {
    const styles: Record<string, { gradient: string; accent: string }> = {
      'politics': {
        gradient: 'from-blue-950 via-indigo-900 to-purple-900',
        accent: '#60a5fa',
      },
      'relationships': {
        gradient: 'from-rose-950 via-red-900 to-pink-900',
        accent: '#f43f5e',
      },
      'taboo': {
        gradient: 'from-slate-950 via-purple-900 to-violet-900',
        accent: '#c084fc',
      },
      'community': {
        gradient: 'from-emerald-950 via-green-900 to-teal-900',
        accent: '#10b981',
      },
      'security': {
        gradient: 'from-slate-900 via-cyan-900 to-blue-900',
        accent: '#0ea5e9',
      },
      'anonymous': {
        gradient: 'from-slate-950 via-indigo-900 to-violet-900',
        accent: '#a78bfa',
      },
    };
    return styles[topicSlug || ''] || styles['anonymous'];
  };

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

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const formatTime = (sec: number) => {
    if (!sec || Number.isNaN(sec) || !isFinite(sec)) return '0:00';
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const m = Math.floor(sec / 60).toString();
    return `${m}:${s}`;
  };

  const onAudioEnded = () => setIsPlaying(false);

  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5 transition hover:border-white/20 hover:bg-white/8 ${
        isBlocked ? 'opacity-60' : ''
      }`}
    >
      {/* Header avec Avatar et Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ring-2 ring-white/20 ${
                post.avatar_color ? `bg-[${post.avatar_color}]` : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
              style={post.avatar_color ? { backgroundColor: post.avatar_color } : {}}
            >
              {post.avatar_value || '👤'}
            </div>
          </div>

          {/* Info Utilisateur */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">
                {post.user?.name || 'Anonyme'}
              </span>
              {/* Badge de niveau utilisateur (rouge/jaune/vert) */}
              {post.user && <UserBadge user={post.user} />}
              {/* Badge de rôle (modérateur/admin) */}
              {badge && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${badge.className}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              )}
              {post.is_blocked && (
                <span className="px-2 py-1 rounded-full text-xs font-medium border-red-500/40 bg-red-500/20 text-red-200">
                  Bloqué
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
              <span>{formatRelativeTime(post.created_at)}</span>
              {post.topic && (
                <>
                  <span>•</span>
                  <span className="font-medium text-white/60">{post.topic.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu Bouton */}
        <div ref={menuRef} className="relative flex-shrink-0 ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-10 bg-dark-800 border border-white/10 rounded-lg shadow-lg z-20 min-w-[200px]">
              {/* Copy Link */}
              <button
                onClick={async () => {
                  try {
                    const origin = (typeof window !== 'undefined' && window.location?.origin) || '';
                    const url = `${origin}/?post=${post.id}`;
                    await navigator.clipboard.writeText(url);
                  } catch {}
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 border-b border-white/10"
              >
                <LinkIcon className="w-4 h-4" />
                Copier le lien du post
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  onShare?.(post.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 border-b border-white/10"
              >
                <Share2 className="w-4 h-4" />
                Partager…
              </button>

              <button
                onClick={() => {
                  onReport(post);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 border-b border-white/10"
              >
                <AlertTriangle className="w-4 h-4" />
                Signaler
              </button>

              {isOwnPost && (
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  disabled={loadingStates.deleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 border-b border-white/10 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}

              {canModerate && !isOwnPost && (
                <>
                  {!isBlocked ? (
                    <button
                      onClick={() => {
                        onBlock?.(post.id);
                        setShowMenu(false);
                      }}
                      disabled={loadingStates.moderating}
                      className="w-full px-4 py-2 text-left text-sm text-orange-300 hover:bg-orange-500/20 flex items-center gap-2 border-b border-white/10 disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      Bloquer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onUnblock?.(post.id);
                        setShowMenu(false);
                      }}
                      disabled={loadingStates.moderating}
                      className="w-full px-4 py-2 text-left text-sm text-green-300 hover:bg-green-500/20 flex items-center gap-2 border-b border-white/10 disabled:opacity-50"
                    >
                      <Undo2 className="w-4 h-4" />
                      Débloquer
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDelete(post.id);
                      setShowMenu(false);
                    }}
                    disabled={loadingStates.moderating}
                    className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <ShieldBan className="w-4 h-4" />
                    Supprimer (Mod)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenu du Post */}
      {!isBlocked ? (
        <>
          {/* Texte (titre) */}
          {post.content && (
            <p className="text-white/90 text-base sm:text-lg font-semibold leading-relaxed mb-3">
              {post.content}
            </p>
          )}

          {/* Image + Audio overlay (si audio ET image(s)) */}
          {hasAudio && hasImages ? (
            <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/10">
              <div className="aspect-video">
                    <img
                      src={post.images![0]}
                      alt="Couverture du post"
                      className="w-full h-full object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      draggable={false}
                      style={{ userSelect: 'none' }}
                    />
              </div>
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              {/* Play Button */}
              <button
                onClick={togglePlay}
                className={`absolute inset-0 flex items-center justify-center transition ${
                  isPlaying ? 'opacity-90' : 'opacity-100 hover:opacity-100'
                }`}
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 border border-white/30 backdrop-blur flex items-center justify-center text-white shadow-lg">
                  {isPlaying ? (
                    <span className="w-0 h-0 border-l-0 border-r-0 border-t-0 border-b-0">
                      ❚❚
                    </span>
                  ) : (
                    <span className="ml-1">▶</span>
                  )}
                </div>
              </button>
              {/* Hidden/Minimal audio element */}
              <audio
                ref={audioRef}
                onEnded={onAudioEnded}
                src={post.audio_url}
                className="hidden"
              />
            </div>
          ) : (
            /* Images (pas d'audio) */
            post.images && post.images.length > 0 && (
              <div
                className={`grid gap-2 mb-4 rounded-lg overflow-hidden ${
                  post.images.length === 1
                    ? 'grid-cols-1'
                    : post.images.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2'
                }`}
              >
                {post.images.map((image, idx) => (
                  <div key={idx} className="aspect-video bg-black/20 rounded overflow-hidden">
                        <img
                          src={image}
                          alt={`Post media ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition"
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          draggable={false}
                          style={{ userSelect: 'none' }}
                        />
                  </div>
                ))}
              </div>
            )
          )}

          {/* Videos */}
          {hasVideos && (
            <div
              className={`grid gap-2 mb-4 ${
                (post as any).videos.length === 1
                  ? 'grid-cols-1'
                  : (post as any).videos.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
              }`}
            >
              {(post as any).videos.map((videoUrl: string, idx: number) => (
                <div key={idx} className="bg-black/20 rounded overflow-hidden">
                      <video
                        src={videoUrl}
                        controls
                        controlsList="nodownload noremoteplayback"
                        className="block w-full h-auto max-h-64 sm:max-h-72 md:max-h-80 object-contain"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        draggable={false}
                        style={{ userSelect: 'none' }}
                      />
                </div>
              ))}
            </div>
          )}

          {/* Stickers */}
          {post.stickers && post.stickers.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {post.stickers.map((sticker, idx) => (
                <span key={idx} className="text-2xl">
                  {sticker}
                </span>
              ))}
            </div>
          )}

          {/* Audio Player with Category Background (video-like display) */}
          {hasAudio && !hasImages && (
            <div className={`mb-4 rounded-lg overflow-hidden relative aspect-video bg-gradient-to-br ${getAudioBackgroundStyle((post as any).topic?.slug).gradient}`}>
              {/* Subtle animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

              {/* Play Button Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center group z-10"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition transform ${
                  isPlaying
                    ? 'bg-white/30 scale-90'
                    : 'bg-white/20 group-hover:bg-white/30 group-hover:scale-110'
                }`}>
                  <span className="text-3xl ml-1">{isPlaying ? '❚❚' : '▶'}</span>
                </div>
              </button>

              {/* Audio info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-5">
                <p className="text-xs text-white/70">Message vocal • {formatTime(duration)}</p>
              </div>

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                onEnded={onAudioEnded}
                onLoadedMetadata={handleLoadedMetadata}
                src={post.audio_url}
                className="hidden"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-white/50 italic text-sm">Ce post a été bloqué par la modération.</p>
      )}

      {/* Actions */}
      <div className="flex items-center pt-4 border-t border-white/10 text-white/60">
        {/* Groupe 👍 / 👎 à gauche */}
        <div className="flex items-center gap-2">
          {/* 👍 Like */}
          <button
            type="button"
            onClick={() => onLike(post.id)}
            disabled={loadingStates.liking}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition hover:bg-white/10 ${
              post.liked_by_user ? 'text-rose-400' : 'text-white/70 hover:text-rose-300'
            } disabled:opacity-50`}
            aria-label={post.liked_by_user ? 'Retirer le like' : 'Aimer'}
            title={post.liked_by_user ? 'Retirer le like' : 'Aimer'}
          >
            <span className="text-base">👍</span>
            <span className="text-xs sm:text-sm font-medium">{typeof likesDisplayCount === 'number' ? likesDisplayCount : post.likes_count}</span>
          </button>

          {/* 👎 Dislike */}
          <button
            type="button"
            onClick={() => onDislike?.(post.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition hover:bg-white/10 ${
              (post as any).disliked_by_user ? 'text-sky-400' : 'text-white/70 hover:text-sky-300'
            }`}
            aria-label={(post as any).disliked_by_user ? 'Retirer le dislike' : 'Ne pas aimer'}
            title={(post as any).disliked_by_user ? 'Retirer le dislike' : 'Ne pas aimer'}
          >
            <span className="text-base">👎</span>
            <span className="text-xs sm:text-sm font-medium">{(post as any).dislikes_count ?? 0}</span>
          </button>
        </div>

        {/* Groupe à droite */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Comments */}
          <button
            type="button"
            onClick={() => {
              onExpand?.();
              onComment(post.id);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition hover:bg-blue-500/20 hover:text-blue-400"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-medium">{commentsCount || post.comments_count}</span>
          </button>

          {/* Share */}
          {onShare && (
            <button
              type="button"
              onClick={() => onShare && onShare(post.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition hover:bg-green-500/20 hover:text-green-400"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-medium">Partager</span>
            </button>
          )}
        </div>
      </div>

      {/* Commentaires Aperçu */}
      {expandedComments && post.comments && post.comments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">
            {post.comments.length} commentaire{post.comments.length > 1 ? 's' : ''}
          </div>
          {post.comments.slice(0, 2).map((comment) => (
            <div key={comment.id} className="bg-white/5 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">
                  {comment.user?.name || 'Anonyme'}
                </span>
              </div>
              <p className="text-white/70">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
