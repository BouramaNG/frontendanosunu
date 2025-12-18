import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Post, Topic, User, Comment } from '../types';
import api from '../lib/api';
import AvatarSelector from '../components/AvatarSelector';
import MediaSelector from '../components/MediaSelector';
import {
  Heart,
  MessageCircle,
  AlertTriangle,
  MessageSquareQuote,
  Image as ImageIcon,
  Loader2,
  CornerDownRight,
  Reply,
  XCircle,
  Trash2,
  ShieldBan,
  Ban,
  Undo2,
} from '@/lib/icons';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ReportPostModal, { type ReportPostFormValues, REPORT_REASONS } from '../components/ReportPostModal';
import { useAuthStore } from '../store/authStore';

const ROLE_BADGE_CONFIG: Record<User['role'], { label: string; className: string }> = {
  user: {
    label: 'Utilisateur',
    className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200',
  },
  moderator: {
    label: 'Modérateur',
    className: 'border-blue-500/40 bg-blue-500/20 text-blue-200',
  },
  admin: {
    label: 'Admin',
    className: 'border-red-500/40 bg-red-500/20 text-red-200',
  },
};

const DEFAULT_ROLE_BADGE = {
  label: 'Utilisateur',
  className: 'border-white/30 bg-white/10 text-white/70',
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

  if (diffSeconds < 60) {
    return formatter.format(-diffSeconds, 'second');
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return formatter.format(-diffMinutes, 'minute');
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return formatter.format(-diffHours, 'hour');
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return formatter.format(-diffDays, 'day');
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return formatter.format(-diffMonths, 'month');
  }

  const diffYears = Math.floor(diffMonths / 12);
  return formatter.format(-diffYears, 'year');
};

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('tous');
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState({
    type: 'emoji' as 'emoji' | 'image' | 'generated',
    value: '😊',
    color: undefined as string | undefined
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<number, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<number, boolean>>({});
  const [likeLoading, setLikeLoading] = useState<Record<number, boolean>>({});
  const [commentLikeLoading, setCommentLikeLoading] = useState<Record<number, boolean>>({});
  const [replyTargets, setReplyTargets] = useState<Record<number, Comment | null>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<number, boolean>>({});
  const [moderationLoading, setModerationLoading] = useState<Record<number, boolean>>({});
  const [commentModerationLoading, setCommentModerationLoading] = useState<Record<number, boolean>>({});
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmer',
    onConfirm: () => {},
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetPost, setReportTargetPost] = useState<Post | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [successModalConfig, setSuccessModalConfig] = useState({
    message: 'Post publié avec succès !',
    title: 'Action réussie',
    subtitle: 'Tout est synchronisé. ✨',
    duration: 2000,
  });

  const { user } = useAuthStore();
  const isModerator = user?.role === 'moderator' && user?.is_moderator_verified;
  const isAdmin = user?.role === 'admin';
  const canModerate = Boolean(isModerator || isAdmin);

  const openSuccessModal = (config?: Partial<typeof successModalConfig>) => {
    setSuccessModalConfig((prev) => ({ ...prev, ...config }));
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessModalConfig((prev) => ({ ...prev }));
  };

  const handleCloseReportModal = () => {
    if (!reportSubmitting) {
      setReportModalOpen(false);
      setReportTargetPost(null);
    }
  };

  const removePostFromState = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setExpandedComments((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setPostComments((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setCommentInputs((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setCommentSubmitting((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setLikeLoading((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setReplyTargets((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setDeleteLoading((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
    setModerationLoading((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
  };

  const getReportReasonLabel = (value: ReportPostFormValues['reason']) =>
    REPORT_REASONS.find((reason) => reason.value === value)?.label ?? 'Signalement';

  const handleOpenReportModal = (post: Post) => {
    setReportTargetPost(post);
    setReportModalOpen(true);
  };

  // ===== Voice Recording (max 120s) =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        recordedBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          const next = s + 1;
          if (next >= 120) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone permission or recording failed', err);
      setErrorMessage("Impossible d'accéder au micro");
      setShowErrorModal(true);
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch (_) {}
  };

  const resetVoice = () => {
    setShowVoiceRecorder(false);
    setIsRecording(false);
    setRecordSeconds(0);
    setPreviewUrl(null);
    recordedBlobRef.current = null;
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const uploadVoicePost = async () => {
    if (!recordedBlobRef.current) return;
    if (recordSeconds < 1) {
      setErrorMessage('Enregistrement trop court.');
      setShowErrorModal(true);
      return;
    }
    setVoiceUploading(true);
    try {
      // Determine topic id similar to text post logic
      let topicId: number | null = null;
      if (selectedTopic !== 'tous') {
        const selectedTopicData = topics.find((t) => t.slug === selectedTopic);
        topicId = selectedTopicData?.id ?? null;
      }
      if (!topicId) {
        topicId = topics[0]?.id || 1;
      }

      const fd = new FormData();
      fd.append('topic_id', String(topicId));
      fd.append('audio', recordedBlobRef.current, 'voice.webm');
      fd.append('duration_seconds', String(Math.min(recordSeconds, 120)));
      fd.append('is_anonymous', 'true');
      fd.append('avatar_type', selectedAvatar.type);
      if (selectedAvatar.value) fd.append('avatar_value', selectedAvatar.value);
      if (selectedAvatar.color) fd.append('avatar_color', selectedAvatar.color);

      const response = await api.post('/posts/voice', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Prepend the new post
      setPosts((prev) => [response.data, ...prev]);
      openSuccessModal({
        message: 'Message vocal publié !',
        title: 'Publication réussie',
        subtitle: 'Votre voix (anonymisée plus tard) est partagée avec une image adaptée au sujet.',
        duration: 2000,
      });
      resetVoice();
    } catch (error: any) {
      console.error('Upload voice error', error);
      const msg = error?.response?.data?.message || "Impossible de publier le vocal.";
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setVoiceUploading(false);
    }
  };

  const handleSubmitReport = async (values: ReportPostFormValues) => {
    if (!reportTargetPost) {
      return;
    }

    setReportSubmitting(true);
    let shouldClose = false;

    try {
      const trimmedDetails = values.details?.trim() ?? '';
      const reasonLabel = getReportReasonLabel(values.reason);
      const payloadReason = trimmedDetails ? `${reasonLabel} — ${trimmedDetails}` : reasonLabel;

      const response = await api.post(`/posts/${reportTargetPost.id}/report`, {
        reason: payloadReason,
      });

      const autoRemoved = Boolean(response.data?.auto_removed);
      if (autoRemoved) {
        removePostFromState(reportTargetPost.id);
      }

      openSuccessModal({
        message:
          response.data?.message ??
          (autoRemoved
            ? 'La publication a été supprimée après signalement.'
            : 'Signalement enregistré avec succès.'),
        title: autoRemoved ? 'Publication retirée' : 'Signalement envoyé',
        subtitle: autoRemoved
          ? 'Le contenu a atteint le seuil de signalements et a été automatiquement supprimé.'
          : 'Merci de contribuer à la sécurité de la communauté.',
        duration: autoRemoved ? 2800 : 2200,
      });

      shouldClose = true;
    } catch (error: any) {
      console.error('Error reporting post:', error);
      const message =
        error?.response?.data?.message ??
        (error?.message ?? "Impossible d'envoyer le signalement.");
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setReportSubmitting(false);
      if (shouldClose) {
        handleCloseReportModal();
      }
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchPosts();
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      // Fallback en cas d'erreur API
      const mockTopics = [
        { id: 1, name: 'Politique', slug: 'politique', color: '#3b82f6', icon: '🏛️', is_sensitive: true, requires_moderation: true, posts_count: 4 },
        { id: 2, name: 'Sujets Tabous', slug: 'sujets-tabous', color: '#ef4444', icon: '🔒', is_sensitive: true, requires_moderation: true, posts_count: 4 },
        { id: 3, name: 'Ménage & Vie de Couple', slug: 'menage-vie-couple', color: '#ec4899', icon: '💑', is_sensitive: true, requires_moderation: true, posts_count: 0 },
        { id: 4, name: 'Mariage', slug: 'mariage', color: '#8b5cf6', icon: '💍', is_sensitive: true, requires_moderation: true, posts_count: 0 },
        { id: 5, name: 'Famille & Parents', slug: 'famille-parents', color: '#10b981', icon: '👨‍👩‍👧‍👦', is_sensitive: true, requires_moderation: true, posts_count: 0 },
        { id: 7, name: 'Santé Mentale', slug: 'sante-mentale', color: '#06b6d4', icon: '🧠', is_sensitive: true, requires_moderation: true, posts_count: 0 }
      ];
      setTopics(mockTopics);
    }
  };

  const toggleComments = async (postId: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    const isExpanding = !expandedComments[postId];

    if (isExpanding && !postComments[postId]) {
      setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
      try {
        const response = await api.get(`/posts/${postId}/comments`);
        setPostComments((prev) => ({ ...prev, [postId]: response.data }));
      } catch (error) {
        console.error('Error fetching comments:', error);
        setErrorMessage('Impossible de charger les commentaires');
        setShowErrorModal(true);
      } finally {
        setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleCommentChange = (postId: number, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleStartReply = (postId: number, comment: Comment) => {
    setReplyTargets((prev) => ({ ...prev, [postId]: comment }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    setCommentInputs((prev) => {
      const currentValue = prev[postId] ?? '';
      if (!currentValue.trim()) {
        const mention = `@${comment.user?.name ?? 'utilisateur'} `;
        return { ...prev, [postId]: mention };
      }
      return prev;
    });
  };

  const handleCancelReply = (postId: number) => {
    setReplyTargets((prev) => ({ ...prev, [postId]: null }));
  };

  const handleSubmitComment = async (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content,
        parent_id: replyTargets[postId]?.id ?? null,
      });

      setPostComments((prev) => ({
        ...prev,
        [postId]: insertCommentIntoTree(prev[postId] || [], response.data),
      }));

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      setReplyTargets((prev) => ({ ...prev, [postId]: null }));
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error submitting comment:', error);
      setErrorMessage('Erreur lors de l\'envoi du commentaire');
      setShowErrorModal(true);
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const insertCommentIntoTree = (comments: Comment[], newComment: Comment): Comment[] => {
    const { tree } = addCommentToTree(comments, newComment);
    return tree;
  };

  const addCommentToTree = (comments: Comment[] = [], newComment: Comment): { tree: Comment[]; inserted: boolean } => {
    if (!newComment.parent_id) {
      return {
        tree: [newComment, ...comments],
        inserted: true,
      };
    }

    let inserted = false;

    const updatedTree = comments.map((comment) => {
      if (comment.id === newComment.parent_id) {
        inserted = true;
        return {
          ...comment,
          replies: [newComment, ...(comment.replies || [])],
        };
      }

      if (comment.replies && comment.replies.length > 0) {
        const result = addCommentToTree(comment.replies, newComment);
        if (result.inserted) {
          inserted = true;
          return {
            ...comment,
            replies: result.tree,
          };
        }
      }

      return comment;
    });

    if (!inserted) {
      return {
        tree: [newComment, ...updatedTree],
        inserted: true,
      };
    }

    return {
      tree: updatedTree,
      inserted: true,
    };
  };

  const handleToggleLike = async (postId: number) => {
    if (likeLoading[postId]) return;

    setLikeLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await api.post(`/posts/${postId}/like`);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: response.data.likes_count,
                liked_by_user: response.data.liked,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      setErrorMessage('Erreur lors du like du post');
      setShowErrorModal(true);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleCommentLike = async (commentId: number, postId: number) => {
    if (commentLikeLoading[commentId]) return;

    setCommentLikeLoading((prev) => ({ ...prev, [commentId]: true }));

    try {
      const response = await api.post(`/comments/${commentId}/like`);

      setPostComments((prev) => {
        const updateComments = (comments: Comment[] = []): Comment[] =>
          comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likes_count: response.data.likes_count,
                liked_by_user: response.data.liked,
              };
            }

            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateComments(comment.replies),
              };
            }

            return comment;
          });

        return {
          ...prev,
          [postId]: updateComments(prev[postId] || []),
        };
      });
    } catch (error) {
      console.error('Error toggling comment like:', error);
      setErrorMessage('Erreur lors du like du commentaire');
      setShowErrorModal(true);
    } finally {
      setCommentLikeLoading((prev) => ({ ...prev, [commentId]: false }));
    }
  };

    const renderComments = (comments: Comment[] = [], postId: number, depth = 0, parentAuthorName?: string): ReactNode[] => {
    return comments.map((comment) => {
      const relativeTime = formatRelativeTime(comment.created_at);
      const badge = comment.user?.role ? ROLE_BADGE_CONFIG[comment.user.role] : DEFAULT_ROLE_BADGE;
      const likeBusy = !!commentLikeLoading[comment.id];
      const authorName = comment.user?.name ?? 'Utilisateur';

      return (
        <div
          key={comment.id}
          className={`relative group ${depth > 0 ? 'ml-6 border-l border-white/10 pl-4' : ''}`}
        >
          <div className="flex items-start space-x-3 rounded-2xl border border-white/10 backdrop-blur-lg px-4 py-3 mb-3 bg-gradient-to-r from-white/5 via-white/5 to-white/5 hover:from-pink-500/10 hover:via-purple-500/10 hover:to-indigo-500/10 transition-all duration-300 shadow-[0_0_25px_rgba(236,72,153,0.15)]">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-base">
                {comment.user?.gender === 'female' ? '👩' : comment.user?.gender === 'male' ? '👨' : '😶'}
              </div>
              {depth > 0 && (
                <CornerDownRight className="absolute -left-6 top-2 h-4 w-4 text-white/30" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-white text-sm font-semibold">
                  {authorName}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.className}`}
                >
                  {badge.label}
                </span>
                {relativeTime && (
                  <span className="text-white/40 text-xs">{relativeTime}</span>
                )}
                {comment.is_blocked && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-red-400/50 bg-red-500/15 text-red-100">
                    Commentaire bloqué
                  </span>
                )}
              </div>
              {parentAuthorName && (
                <div className="mb-2 text-xs text-white/50">
                  En réponse à <span className="text-white font-medium">{parentAuthorName}</span>
                </div>
              )}
              <p className="text-white/90 text-sm leading-relaxed">
                {comment.content}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => handleToggleCommentLike(comment.id, postId)}
                  className={`inline-flex items-center space-x-1 text-xs font-medium transition ${
                    comment.liked_by_user ? 'text-pink-400' : 'text-white/50 hover:text-pink-300'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${comment.liked_by_user ? 'fill-pink-400' : ''}`} />
                  {likeBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>{comment.likes_count || 0}</span>
                  )}
                </button>
                <button
                  onClick={() => handleStartReply(postId, comment)}
                  className="inline-flex items-center gap-1 text-white/40 hover:text-purple-300 text-xs font-medium transition"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Répondre</span>
                </button>
                {/* Author can delete their own comment even if not moderator */}
                {user?.id && comment.user?.id === user.id && (
                  <button
                    onClick={() => handleDeleteComment(postId, comment.id)}
                    disabled={!!commentModerationLoading[comment.id]}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition border-red-500/30 bg-red-500/15 text-red-100 hover:border-red-400/50 hover:text-red-50 ${
                      commentModerationLoading[comment.id] ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {commentModerationLoading[comment.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>Supprimer</span>
                  </button>
                )}
                {canModerate && (
                  <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                    <button
                      onClick={() => handleBlockComment(comment, postId)}
                      disabled={!!commentModerationLoading[comment.id]}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        comment.is_blocked
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100 hover:border-emerald-400/50'
                          : 'border-orange-500/30 bg-orange-500/15 text-orange-100 hover:border-orange-400/50'
                      } ${commentModerationLoading[comment.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {commentModerationLoading[comment.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : comment.is_blocked ? (
                        <Undo2 className="h-3 w-3" />
                      ) : (
                        <Ban className="h-3 w-3" />
                      )}
                      <span>{comment.is_blocked ? 'Débloquer' : 'Bloquer'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteComment(postId, comment.id)}
                      disabled={!!commentModerationLoading[comment.id]}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition border-red-500/30 bg-red-500/15 text-red-100 hover:border-red-400/50 hover:text-red-50 ${
                        commentModerationLoading[comment.id] ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {commentModerationLoading[comment.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2">
              {renderComments(comment.replies, postId, depth + 1, authorName)}
            </div>
          )}
        </div>
      );
    });
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = '/posts';
      
      // Si une catégorie spécifique est sélectionnée, filtrer par topic
      if (selectedTopic !== 'tous') {
        const selectedTopicData = topics.find(topic => topic.slug === selectedTopic);
        if (selectedTopicData) {
          url = `/posts?topic=${selectedTopicData.id}`;
        }
      }
      
  // Debug logs removed for production
      
      const response = await api.get(url);
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    // Upload images first if any
    let uploadedImageUrls: string[] = [];

    if (selectedImages.length > 0) {
      try {
        const formData = new FormData();
        selectedImages.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });

  // Debug logs removed for production

        const uploadResponse = await api.post('/posts/upload-images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

  uploadedImageUrls = uploadResponse.data.images || [];
  // Debug logs removed for production
      } catch (error) {
        console.error('=== FRONTEND: Erreur upload images ===', error);
        setErrorMessage('Erreur lors de l\'upload des images');
        setShowErrorModal(true);
        return;
      }
    }

  // Debug logs removed for production

    // Utiliser automatiquement la catégorie sélectionnée dans la sidebar
    let topicId = null;
    if (selectedTopic !== 'tous') {
      const selectedTopicData = topics.find(topic => topic.slug === selectedTopic);
      topicId = selectedTopicData?.id || null;
  // Debug logs removed for production
    }

    // Si aucune catégorie spécifique n'est sélectionnée, utiliser la première par défaut
    if (!topicId) {
      topicId = topics[0]?.id || 1;
  // Debug logs removed for production
    }

    const postData = {
      topic_id: topicId,
      content: postContent,
      is_anonymous: true,
      avatar_type: selectedAvatar.type,
      avatar_value: selectedAvatar.value,
      avatar_color: selectedAvatar.color,
      images: uploadedImageUrls,
      stickers: selectedStickers,
    };

  // Debug logs removed for production

    try {
      await api.post('/posts', postData);
      // Debug logs removed for production

      openSuccessModal({
        message: 'Post publié avec succès !',
        title: 'Publication réussie',
        subtitle: 'Ton message est maintenant visible pour la communauté.',
        duration: 2200,
      });

      // Réinitialiser le formulaire après 2 secondes (la modal se ferme automatiquement)
      setTimeout(() => {
        setPostContent('');
        setShowPostForm(false);
        setSelectedImages([]);
        setSelectedStickers([]);
        setShowAvatarSelector(false);
        setShowMediaSelector(false);
        fetchPosts();
      }, 2000);

    } catch (error: any) {
      console.error('=== FRONTEND: Erreur création post ===', error);

      let errorMsg = 'Erreur lors de la publication du post';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (deleteLoading[postId]) return;

    setConfirmModal({
      open: true,
      title: 'Supprimer la publication',
      message: 'Confirmez-vous la suppression définitive de cette publication ? Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: () => executeDeletePost(postId),
    });
  };

  const executeDeletePost = async (postId: number) => {
    setConfirmModal((prev) => ({ ...prev, open: false }));

    setDeleteLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      await api.delete(`/posts/${postId}`);

      removePostFromState(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      setErrorMessage('Impossible de supprimer la publication.');
      setShowErrorModal(true);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleBlockPost = async (post: Post) => {
    if (moderationLoading[post.id]) return;

    setConfirmModal({
      open: true,
      title: post.is_blocked ? 'Débloquer la publication' : 'Bloquer la publication',
      message: post.is_blocked
        ? 'Voulez-vous rétablir cette publication et la rendre de nouveau visible ?'
        : 'Confirmez-vous le blocage de cette publication ? Le contenu sera masqué pour tous les utilisateurs.',
      confirmLabel: post.is_blocked ? 'Débloquer' : 'Bloquer',
      onConfirm: () => executeBlockPost(post),
    });
  };

  const executeBlockPost = async (post: Post) => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
    setModerationLoading((prev) => ({ ...prev, [post.id]: true }));

    try {
      const willUnblock = post.is_blocked;

      if (willUnblock) {
        await api.post(`/posts/${post.id}/unblock`);
      } else {
        await api.post(`/posts/${post.id}/block`, {
          reason: 'Contenu jugé inapproprié par un modérateur.',
        });
      }

      await fetchPosts();
      openSuccessModal({
        message: willUnblock ? 'La publication a été rétablie.' : 'La publication a été bloquée.',
        title: willUnblock ? 'Publication débloquée' : 'Publication bloquée',
        subtitle: willUnblock
          ? 'Le contenu est de nouveau visible pour la communauté.'
          : 'Le contenu a été masqué pour la communauté.',
        duration: 2200,
      });
    } catch (error) {
      console.error('Error moderating post:', error);
      setErrorMessage("Impossible d'actualiser le statut de la publication.");
      setShowErrorModal(true);
    } finally {
      setModerationLoading((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (commentModerationLoading[commentId]) return;

    setConfirmModal({
      open: true,
      title: 'Confirmation',
      message: 'Supprimer ce commentaire ?',
      confirmLabel: 'Supprimer',
      onConfirm: () => executeDeleteComment(postId, commentId),
    });
  };

  const executeDeleteComment = async (postId: number, commentId: number) => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
    setCommentModerationLoading((prev) => ({ ...prev, [commentId]: true }));

    try {
      await api.delete(`/comments/${commentId}`, { headers: { 'X-Confirm-Delete': 'true' } });

      setPostComments((prev) => {
        const removeComment = (comments: Comment[] = []): Comment[] =>
          comments
            .filter((comment) => comment.id !== commentId)
            .map((comment) => ({
              ...comment,
              replies: removeComment(comment.replies),
            }));

        return {
          ...prev,
          [postId]: removeComment(prev[postId] || []),
        };
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments_count: Math.max((post.comments_count || 1) - 1, 0) }
            : post
        )
      );

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setErrorMessage('Impossible de supprimer le commentaire.');
      setShowErrorModal(true);
    } finally {
      setCommentModerationLoading((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleBlockComment = async (comment: Comment, postId: number) => {
    if (commentModerationLoading[comment.id]) return;

    setConfirmModal({
      open: true,
      title: comment.is_blocked ? 'Débloquer le commentaire' : 'Bloquer le commentaire',
      message: comment.is_blocked
        ? 'Voulez-vous rétablir ce commentaire et le rendre de nouveau visible ?'
        : 'Confirmez-vous le blocage de ce commentaire ? Le contenu sera masqué pour tous les utilisateurs.',
      confirmLabel: comment.is_blocked ? 'Débloquer' : 'Bloquer',
      onConfirm: () => executeBlockComment(comment, postId),
    });
  };

  const executeBlockComment = async (comment: Comment, postId: number) => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
    setCommentModerationLoading((prev) => ({ ...prev, [comment.id]: true }));

    try {
      if (comment.is_blocked) {
        await api.post(`/comments/${comment.id}/like`, {}); // placeholder to ensure request (will update below)
      }

      if (comment.is_blocked) {
        // No unblock route yet - skip for now
        setErrorMessage('La route de déblocage commentaire n’est pas encore disponible.');
        setShowErrorModal(true);
      } else {
        await api.post(`/comments/${comment.id}/block`, {
          reason: 'Commentaire signalé par un modérateur.',
        });
        openSuccessModal({
          message: 'Commentaire bloqué.',
          title: 'Commentaire bloqué',
          subtitle: 'Le commentaire est masqué pour la communauté.',
          duration: 2000,
        });
      }

      await toggleComments(postId);
    } catch (error) {
      console.error('Error moderating comment:', error);
      setErrorMessage("Impossible d'actualiser le statut du commentaire.");
      setShowErrorModal(true);
    } finally {
      setCommentModerationLoading((prev) => ({ ...prev, [comment.id]: false }));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Catégories - EXACTEMENT comme Image 3 */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 sticky top-4 lg:top-20">
              <h2 className="text-lg font-bold text-white mb-4">Catégories</h2>
              <nav className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 lg:mx-0 lg:px-0 lg:pb-0 lg:flex-col lg:gap-0 lg:space-y-2">
                {topics.map((topic) => {
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.slug)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition min-w-[160px] lg:min-w-0 border border-white/10 lg:border-transparent ${
                        selectedTopic === topic.slug
                          ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-white border border-pink-500/30'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{topic.icon}</span>
                      <span className="font-medium">{topic.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content - EXACTEMENT comme Image 3 */}
          <main className="flex-1 space-y-4 w-full">
            {/* Create Post Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                  😊
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <MessageSquareQuote className="w-5 h-5" />
                    <span>Exprimez-vous anonymement</span>
                  </h3>
                  
                  {!showPostForm ? (
                    <button
                      onClick={() => setShowPostForm(true)}
                      className="w-full px-4 py-3 text-left text-white/70 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10"
                    >
                      Partagez vos pensées, opinions, expériences... Tout est anonyme et sans jugement.
                    </button>
                  ) : showPostForm ? (
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <div className="relative">
                        <div className="absolute left-3 top-3 w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-lg z-10">
                          {selectedAvatar.value}
                        </div>
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="Partagez vos pensées, opinions, expériences... Tout est anonyme et en sécurité."
                          className="w-full pl-14 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 min-h-[100px] resize-none"
                          required
                        />
                      </div>
                      
                      {/* Avatar, Media & Voice Buttons */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white/70 text-xs">Avatar actuel:</span>
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-lg">
                            {selectedAvatar.value}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                            showAvatarSelector
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
                          }`}
                        >
                          <span>Changer Avatar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMediaSelector(!showMediaSelector)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                            showMediaSelector
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Médias</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                            showVoiceRecorder
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
                          }`}
                        >
                          <span>🎤 Vocal (max 2 min)</span>
                        </button>
                      </div>

                      {/* Avatar Selector */}
                      {showAvatarSelector && (
                        <AvatarSelector
                          selectedAvatar={selectedAvatar}
                          onAvatarChange={(avatar: any) => {
                            // Debug logs removed for production
                            setSelectedAvatar({ ...avatar, color: avatar.color || undefined });
                          }}
                        />
                      )}

                      {/* Media Selector */
                      }
                      {showMediaSelector && (
                        <MediaSelector
                          selectedImages={selectedImages}
                          selectedStickers={selectedStickers}
                          onImagesChange={setSelectedImages}
                          onStickersChange={setSelectedStickers}
                        />
                      )}

                      {/* Voice Recorder inside form */}
                      {showVoiceRecorder && (
                        <div className="space-y-3 border border-white/10 rounded-xl p-4 bg-white/5">
                          <div className="text-white/80 text-sm">Enregistrement vocal (max 2:00)</div>
                          <div className="flex items-center gap-3">
                            {!isRecording ? (
                              <button
                                type="button"
                                onClick={startRecording}
                                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-100 hover:bg-red-500/30"
                              >
                                ● Démarrer
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-400/40 text-green-100 hover:bg-green-500/30"
                              >
                                ■ Arrêter
                              </button>
                            )}
                            <span className="text-white/70 text-sm">{`${Math.floor(recordSeconds/60).toString().padStart(1,'0')}:${(recordSeconds%60).toString().padStart(2,'0')} / 2:00`}</span>
                          </div>
                          {previewUrl && (
                            <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                              <MiniAudioPlayer src={previewUrl} />
                            </div>
                          )}
                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => { resetVoice(); setShowVoiceRecorder(false); }}
                              disabled={voiceUploading}
                              className="px-4 py-2 text-white/70 hover:text-white transition text-sm"
                            >
                              Annuler vocal
                            </button>
                            <button
                              type="button"
                              onClick={uploadVoicePost}
                              disabled={!previewUrl || voiceUploading}
                              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {voiceUploading ? 'Publication…' : 'Publier le vocal'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPostForm(false);
                            setPostContent('');
                            setSelectedImages([]);
                            setSelectedStickers([]);
                            setShowAvatarSelector(false);
                            setShowMediaSelector(false);
                          }}
                          className="px-4 py-2 text-white/70 hover:text-white transition text-sm"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={!postContent.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Publier anonymement
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-white/80 text-sm">Enregistrement vocal (max 2:00)</div>
                      <div className="flex items-center gap-3">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-100 hover:bg-red-500/30"
                          >
                            ● Démarrer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-400/40 text-green-100 hover:bg-green-500/30"
                          >
                            ■ Arrêter
                          </button>
                        )}
                        <span className="text-white/70 text-sm">{`${Math.floor(recordSeconds/60).toString().padStart(1,'0')}:${(recordSeconds%60).toString().padStart(2,'0')} / 2:00`}</span>
                      </div>
                      {previewUrl && (
                        <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                          <MiniAudioPlayer src={previewUrl} />
                        </div>
                      )}
                      <div className="flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={resetVoice}
                          disabled={voiceUploading}
                          className="px-4 py-2 text-white/70 hover:text-white transition text-sm"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={uploadVoicePost}
                          disabled={!previewUrl || voiceUploading}
                          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {voiceUploading ? 'Publication…' : 'Publier le vocal'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
              </div>
            ) : (
              posts.map((post) => {
                const authorName = post.user?.name ?? 'Utilisateur';
                const userHandle = post.user?.name ? post.user.name.toLowerCase().replace(/\s+/g, '') : 'anonymous';
                const roleBadge = post.user?.role ? ROLE_BADGE_CONFIG[post.user.role] : DEFAULT_ROLE_BADGE;
                const relativeTime = post.relative_time ?? formatRelativeTime(post.created_at);
                const topicIcon = post.topic?.icon ?? '🗂️';
                const topicName = post.topic?.name ?? 'Sujet';
                const isExpanded = !!expandedComments[post.id];
                const commentsList = postComments[post.id] || [];
                const isCommentsLoading = !!commentsLoading[post.id];
                const commentInputValue = commentInputs[post.id] ?? '';
                const isSubmittingComment = !!commentSubmitting[post.id];
                const isLikeLoading = !!likeLoading[post.id];
                const commentsCount = post.comments_count ?? commentsList.length;
                const replyTarget = replyTargets[post.id] ?? null;
                const replyTargetName = replyTarget?.user?.name ?? 'Utilisateur';
                const commentPlaceholder = replyTarget ? `Répondre à ${replyTargetName}...` : 'Exprimez-vous anonymement...';

                return (
                  <article
                    key={post.id}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5/80 backdrop-blur-xl transition shadow-[0_45px_120px_-60px_rgba(236,72,153,0.55)]"
                  >
                    <div
                      className="absolute -inset-20 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.25)_0%,_rgba(79,70,229,0.15)_40%,_rgba(17,24,39,0)_70%)] opacity-70"
                      aria-hidden="true"
                    />

                    <div className="relative space-y-5 p-5 sm:p-6">
                      <header className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                          <span className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-500 text-xl sm:text-2xl shadow-[0_0_25px_rgba(251,191,36,0.65)]">
                            {post.avatar_type === 'emoji' && post.avatar_value
                              ? post.avatar_value
                              : post.user?.gender === 'female'
                              ? '👩'
                              : '👨'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-base shadow-sm">
                                {topicIcon}
                              </span>
                              {topicName}
                            </span>
                            {relativeTime && (
                              <span className="text-xs font-medium text-white/60 sm:text-sm">{relativeTime}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="min-w-0 space-y-1 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
                              <span
                                className="block truncate text-sm font-semibold text-white sm:text-base"
                                title={authorName}
                              >
                                {authorName}
                              </span>
                              <span className="hidden text-white/40 sm:inline">•</span>
                              <span className="block truncate text-xs text-white/50 max-sm:pt-0.5">@{userHandle}</span>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs border ${roleBadge.className}`}
                            >
                              {roleBadge.label}
                            </span>
                          </div>
                        </div>
                      </header>

                      <section className="relative">
                        <div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-70 blur-xl"
                          aria-hidden="true"
                        />
                        <div className="relative space-y-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 sm:px-5 sm:py-5">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/60">
                            <span className="inline-flex h-2 w-2 rounded-full bg-pink-400 animate-ping" />
                            {('audio_url' in (post as any) && (post as any).audio_url) ? 'Message vocal' : 'Pensée anonyme'}
                          </span>
                          {('audio_url' in (post as any) && (post as any).audio_url) && (
                            <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                              <MiniAudioPlayer src={(post as any).audio_url} />
                            </div>
                          )}
                          {post.content && (
                            <p className="text-[15px] font-semibold leading-relaxed text-white/90 sm:text-[16px] whitespace-pre-line">
                              {post.content}
                            </p>
                          )}
                        </div>
                      </section>

                      {post.images && post.images.some((image) => image && image !== '') && (
                        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {post.images
                            .filter((image) => image && image !== '')
                            .map((imageUrl, index) => (
                              <div
                                key={`${post.id}-image-${index}`}
                                className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_15px_40px_-30px_rgba(147,51,234,0.7)]"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Image ${index + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-52 w-full object-cover transition duration-500 hover:scale-105 sm:h-44"
                                  onError={(event) => {
                                    // Debug logs removed for production
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                        </section>
                      )}

                      {post.stickers && post.stickers.length > 0 && (
                        <section className="flex flex-wrap gap-1.5">
                          {post.stickers.map((sticker, index) => (
                            <span
                              key={`${post.id}-sticker-${index}`}
                              className="rounded-lg border border-white/20 bg-gradient-to-br from-white/15 to-white/5 px-2 py-1 text-xl"
                            >
                              {sticker}
                            </span>
                          ))}
                        </section>
                      )}

                      <footer className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition ${
                            post.liked_by_user
                              ? 'bg-pink-500/20 border-pink-500/40 text-pink-200'
                              : 'border-white/10 bg-white/5 text-white/70 hover:border-pink-400/40 hover:text-pink-200'
                          }`}
                          disabled={isLikeLoading}
                        >
                          {isLikeLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className={`h-4 w-4 ${post.liked_by_user ? 'fill-pink-400 text-pink-400' : ''}`} />
                          )}
                          <span>{post.likes_count ?? 0}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition ${
                            isExpanded
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                              : 'border-white/10 bg-white/5 text-white/70 hover:border-blue-400/40 hover:text-blue-200'
                          }`}
                        >
                          <MessageCircle className={`h-4 w-4 ${isExpanded ? 'fill-blue-300 text-blue-300' : ''}`} />
                          <span>{commentsCount}</span>
                        </button>

                        <Link
                          to={`/posts/${post.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition hover:border-purple-400/40 hover:text-purple-200"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Détails</span>
                        </Link>

                        <button
                          onClick={() => handleOpenReportModal(post)}
                          disabled={reportSubmitting && reportTargetPost?.id === post.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition ${
                            reportSubmitting && reportTargetPost?.id === post.id
                              ? 'border-orange-500/30 bg-orange-500/10 text-orange-200/70 cursor-wait'
                              : 'border-white/10 bg-white/5 text-white/60 hover:border-orange-400/40 hover:text-orange-200'
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>Signaler</span>
                        </button>

                        {canModerate && (
                          <button
                            onClick={() => handleBlockPost(post)}
                            disabled={moderationLoading[post.id]}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition ${
                              moderationLoading[post.id]
                                ? 'border-orange-500/40 bg-orange-500/20 text-orange-100/70 cursor-not-allowed'
                                : post.is_blocked
                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100 hover:border-emerald-400/50 hover:text-emerald-50'
                                : 'border-orange-500/30 bg-orange-500/15 text-orange-100 hover:border-orange-400/50 hover:text-orange-50'
                            }`}
                          >
                            {moderationLoading[post.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : post.is_blocked ? (
                              <Undo2 className="h-4 w-4" />
                            ) : (
                              <ShieldBan className="h-4 w-4" />
                            )}
                            <span>{post.is_blocked ? 'Débloquer' : 'Bloquer'}</span>
                          </button>
                        )}

                        {(canModerate || user?.id === post.user_id) && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deleteLoading[post.id]}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition ${
                              deleteLoading[post.id]
                                ? 'border-red-500/40 bg-red-500/20 text-red-200/70 cursor-not-allowed'
                                : 'border-red-500/30 bg-red-500/15 text-red-200 hover:border-red-400/50 hover:text-red-100'
                            }`}
                          >
                            {deleteLoading[post.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span>Supprimer</span>
                          </button>
                        )}
                      </footer>

                      {isExpanded && (
                        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_-50px_rgba(56,189,248,0.55)] backdrop-blur-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold tracking-wide text-white">
                                Commentaires ({commentsCount})
                              </h4>
                              <p className="mt-1 text-xs text-white/40">
                                Partagez vos ressentis dans un espace bienveillant.
                              </p>
                            </div>
                            {commentsList.length > 0 && (
                              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-200">
                                Nouveaux
                              </span>
                            )}
                          </div>

                          {isCommentsLoading ? (
                            <div className="flex items-center justify-center py-6 text-white/60">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          ) : commentsList.length > 0 ? (
                            <div className="space-y-4">{renderComments(commentsList, post.id)}</div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/10 py-8 text-center">
                              <MessageSquareQuote className="mx-auto h-10 w-10 text-white/20" />
                              <p className="mt-2 text-sm text-white/50">Aucun commentaire pour le moment</p>
                              <p className="text-xs text-white/30">Soyez le premier à briser la glace ✨</p>
                            </div>
                          )}

                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              handleSubmitComment(post.id);
                            }}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-start gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg shadow-[0_0_20px_rgba(147,51,234,0.45)]">
                                😊
                              </span>
                              <div className="flex-1">
                                {replyTarget && (
                                  <div className="mb-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/70">
                                    <div className="flex items-center gap-2">
                                      <Reply className="h-3.5 w-3.5 text-pink-300" />
                                      <div>
                                        <p className="text-sm font-semibold text-white">Réponse à {replyTargetName}</p>
                                        <p className="text-xs text-white/60 line-clamp-1">{replyTarget.content}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelReply(post.id)}
                                      className="flex items-center gap-1 text-white/60 transition hover:text-white"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      <span>Annuler</span>
                                    </button>
                                  </div>
                                )}

                                <div className="relative">
                                  <textarea
                                    value={commentInputValue}
                                    onChange={(event) => handleCommentChange(post.id, event.target.value)}
                                    placeholder={commentPlaceholder}
                                    className="min-h-[80px] w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-24 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                  />
                                  <button
                                    type="submit"
                                    disabled={isSubmittingComment || !commentInputValue.trim()}
                                    className="absolute right-2 top-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-[0_10px_30px_-15px_rgba(236,72,153,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publier'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        </section>
                      )}
                    </div>
                  </article>
                );
              })
            )}

            {posts.length > 0 && (
              <div className="text-center py-8">
                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition border border-white/10">
                  Charger plus de publications
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modales */}
      <ConfirmActionModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />

      <ReportPostModal
        open={reportModalOpen}
        loading={reportSubmitting}
        onClose={handleCloseReportModal}
        onSubmit={handleSubmitReport}
      />

      <SuccessModal
        message={successModalConfig.message}
        title={successModalConfig.title}
        subtitle={successModalConfig.subtitle}
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        duration={successModalConfig.duration}
      />

      <ErrorModal
        message={errorMessage}
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
}

// Mini audio player to avoid native controls (no browser download button)
function MiniAudioPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
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
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/90 transition ${isPlaying ? 'ring-2 ring-white/30' : 'hover:bg-white/10'}`}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, duration)}
            value={currentTime}
            onChange={handleSeek}
            className="w-full"
            aria-label="Progression audio"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
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
    </div>
  );
}
