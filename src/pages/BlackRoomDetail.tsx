import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, MessageCircle, Share2, Flag, ThumbsUp, ThumbsDown,
  Shield, Zap, Users, Clock, CheckCircle2, MoreVertical, Link as LinkIcon, AlertTriangle, Trash2
} from '@/lib/icons';
import type { BlackRoom, BlackRoomPost } from '../types';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import BlackRoomPostForm from '../components/BlackRoomPostForm';
import BlackRoomPostComments from '../components/BlackRoomPostComments';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import BlackRoomVideoPlayer from '../components/BlackRoomVideoPlayer';
import SaveRoomToast from '../components/SaveRoomToast';
import { detectScreenCapture, preventImageDownload } from '../utils/contentProtection';
import BlackRoomChat from '../components/BlackRoomChat';

export default function BlackRoomDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [blackRoom, setBlackRoom] = useState<BlackRoom | null>(null);
  const [posts, setPosts] = useState<BlackRoomPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  // Mobile bottom-sheet state - DEPRECATED
  const [isMobile, setIsMobile] = useState(false);
  // const [sheetOpen, setSheetOpen] = useState(false);
  // const [sheetPost, setSheetPost] = useState<BlackRoomPost | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  // Comments modal state (TikTok style)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsModalPost, setCommentsModalPost] = useState<BlackRoomPost | null>(null);
  const [commentsModalComments, setCommentsModalComments] = useState<any[]>([]);
  const [commentsModalLoading, setCommentsModalLoading] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; title: string; text: string; url: string; type: 'post' | 'comment' }>({
    isOpen: false,
    title: '',
    text: '',
    url: '',
    type: 'post',
  });

  // Presence (online users) — server filters admins & moderators already
  type PresentUser = { id: number; name?: string | null; username?: string | null; role?: string | null };
  const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);

  // Join requests (for room creator)
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [respondingToRequest, setRespondingToRequest] = useState<number | null>(null);

  // Room expiration countdown
  const [expirationWarning, setExpirationWarning] = useState<string | null>(null);
  const lastWarningTimeRef = useRef<number>(0);

  // Leave room state
  const [showLeaveToast, setShowLeaveToast] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);

  useEffect(() => {
    const onResize = () => {
      try { setIsMobile(window.innerWidth < 1024); } catch {}
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (slug) {
      fetchBlackRoom();
    }

    // Activer la protection anti-capture
    detectScreenCapture();
    preventImageDownload();
  }, [slug]);

  // Presence: heartbeat + polling when room is loaded (not gated by isSubscribed)
  useEffect(() => {
    if (!blackRoom) return;
    let hbTimer: any;
    let listTimer: any;
    let expirationTimer: any;

    const heartbeat = async () => {
      try {
  await api.post(`/black-rooms/${blackRoom.slug}/presence/heartbeat`);
      } catch (e) {
        console.debug('[presence] heartbeat error', e);
      }
    };
    const fetchPresence = async () => {
      try {
        const res = await api.get(`/black-rooms/${blackRoom.slug}/presence`, { params: { window_seconds: 120 } });
  const data = Array.isArray(res.data?.data) ? res.data.data : [];
  setPresentUsers(data);
  setPresenceCount(Number(res.data?.meta?.count ?? data.length));
      } catch (e) {
        console.debug('[presence] fetch error', e);
      }
    };

    // Check room expiration
    const checkExpiration = () => {
      const scheduledEnd = blackRoom.scheduled_end_at ? new Date(blackRoom.scheduled_end_at).getTime() : null;
      const now = Date.now();
      
      if (!scheduledEnd) {
        setExpirationWarning(null);
        return;
      }

      const timeRemaining = scheduledEnd - now;
      const secondsRemaining = Math.floor(timeRemaining / 1000);

      // If expired (0 or negative seconds), redirect automatically without alert
      if (secondsRemaining <= 0) {
        navigate('/chambres-noires');
        return;
      }

      // Warning if < 2 minutes (120 seconds)
      if (secondsRemaining <= 120) {
        const now_ = Date.now();
        // Show warning every 30 seconds
        if (now_ - lastWarningTimeRef.current >= 30000) {
          const mins = Math.floor(secondsRemaining / 60);
          const secs = secondsRemaining % 60;
          const msg = `⚠️ Chambre expire dans ${mins}m ${secs}s. Données seront supprimées!`;
          setExpirationWarning(msg);
          lastWarningTimeRef.current = now_;
          
          // Optional: show browser notification
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Black Room expiration', {
                body: msg,
                icon: '⏰',
              });
            }
          } catch (e) {
            console.debug('Notification failed:', e);
          }
        }
      } else {
        setExpirationWarning(null);
      }
    };

    // initial
    heartbeat();
    fetchPresence();
    checkExpiration();
    // intervals (optimisés pour réduire la charge réseau)
    hbTimer = setInterval(heartbeat, 30000); // 30s
    listTimer = setInterval(fetchPresence, 60000); // 60s (réduit de 20s)
    expirationTimer = setInterval(checkExpiration, 10000); // 10s (réduit de 5s)

    return () => {
      if (hbTimer) clearInterval(hbTimer);
      if (listTimer) clearInterval(listTimer);
      if (expirationTimer) clearInterval(expirationTimer);
    };
  }, [blackRoom, navigate]);

  const isStaff = !!(user && (user.role === 'admin' || (user.role === 'moderator' && user.is_moderator_verified)));

  // Récupérer les posts quand la chambre est chargée et que l'utilisateur est abonné
  useEffect(() => {
    if (blackRoom && isSubscribed) {
      fetchPosts();

      // Rafraîchir automatiquement les posts pour filtrer les posts éphémères expirés
      // Réduit à 30 secondes pour diminuer la charge réseau
      const interval = setInterval(() => {
        fetchPosts();
      }, 30000); // 30 secondes (réduit de 10s)
      
      return () => clearInterval(interval);
    }
  }, [blackRoom, isSubscribed]);

  const fetchBlackRoom = async () => {
    try {
      // Essayer d'abord avec la route par slug
      const response = await api.get(`/black-rooms/slug/${slug}`);
      setBlackRoom(response.data.blackRoom);
      // Bypass: admin & modérateurs vérifiés ont accès sans abonnement
      const isStaff = user && (user.role === 'admin' || (user.role === 'moderator' && user.is_moderator_verified));
      setIsSubscribed(isStaff ? true : (response.data.isSubscribed || false));
      
      if ((isStaff || response.data.isSubscribed)) {
        fetchPosts();
      }
    } catch (error: any) {
      // Si ça échoue, essayer avec l'ancienne route
      try {
        const response = await api.get(`/black-rooms/${slug}`);
        setBlackRoom(response.data.blackRoom);
        const isStaff = user && (user.role === 'admin' || (user.role === 'moderator' && user.is_moderator_verified));
        setIsSubscribed(isStaff ? true : (response.data.isSubscribed || false));
        
        if ((isStaff || response.data.isSubscribed)) {
          fetchPosts();
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setIsSubscribed(false);
        }
        console.error('Error fetching black room:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!blackRoom) return;
    
    try {
  const response = await api.get(`/black-rooms/${blackRoom.slug}/posts`);
      
      // Laravel pagination returns data in 'data' key
      const postsData = response.data.data || response.data || [];
      setPosts(postsData);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      if (error.response?.status === 403) {
        console.error('Access denied to posts');
      }
    }
  };

  const handleLike = async (postId: number, action: 'like' | 'dislike') => {
    if (!blackRoom) return;
    
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/posts/${postId}/like`, { action });
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReport = async (postId: number) => {
    if (!blackRoom) return;
    if (!confirm('Voulez-vous signaler ce post ?')) return;

    try {
      await api.post(`/black-rooms/${blackRoom.slug}/posts/${postId}/report`, {
        reason: 'Contenu inapproprié'
      });
      alert('Post signalé avec succès');
      fetchPosts();
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!blackRoom) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;

    try {
      await api.delete(`/black-rooms/${blackRoom.slug}/posts/${postId}`);
      // Retirer le post de la liste locale
      setPosts(prev => prev.filter(p => p.id !== postId));
      alert('Post supprimé avec succès');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression du post');
    }
  };

  const handleLeaveRoom = async () => {
    if (!blackRoom || !user) return;

    setLeavingRoom(true);
    try {
      // Call unsubscribe API to mark subscription as inactive
      await api.post(`/black-rooms/${blackRoom.slug}/unsubscribe`);
      
      // Show leave toast
      setShowLeaveToast(true);
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowLeaveToast(false);
      }, 5000);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/chambres-noires');
      }, 2000);
    } catch (error: any) {
      console.error('Error leaving room:', error);
      alert(error.response?.data?.message || 'Erreur lors de la sortie');
    } finally {
      setLeavingRoom(false);
    }
  };

  // Join requests handlers (for room creator)
  const fetchJoinRequests = async () => {
    if (!blackRoom) return;
    try {
      const res = await api.get(`/black-rooms/${blackRoom.slug}/join-requests`);
      setJoinRequests(res.data.data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  };

  const handleApproveRequest = async (joinRequestId: number) => {
    if (!blackRoom) return;
    setRespondingToRequest(joinRequestId);
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/join-requests/${joinRequestId}/approve`);
      fetchJoinRequests();
      fetchPosts(); // Refresh to show new member
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setRespondingToRequest(null);
    }
  };

  const handleRejectRequest = async (joinRequestId: number) => {
    if (!blackRoom) return;
    setRespondingToRequest(joinRequestId);
    try {
      await api.post(`/black-rooms/${blackRoom.slug}/join-requests/${joinRequestId}/reject`);
      fetchJoinRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setRespondingToRequest(null);
    }
  };

  // Load join requests when creator opens the room
  useEffect(() => {
    if (blackRoom && user && blackRoom.creator_id === user.id) {
      fetchJoinRequests();
      // Refresh every 10 seconds
      const interval = setInterval(fetchJoinRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [blackRoom, user]);

  // Auto-show modal when there are pending requests
  useEffect(() => {
    if (joinRequests.length > 0 && !showJoinRequests) {
      setShowJoinRequests(true);
    }
  }, [joinRequests]);

  const handleOpenCommentsModal = async (post: BlackRoomPost) => {
    setCommentsModalPost(post);
    setCommentsModalLoading(true);
    setCommentsModalOpen(true);
    
    try {
      if (!blackRoom) return;
      const response = await api.get(`/black-rooms/${blackRoom.slug}/posts/${post.id}/comments`);
      // Backend returns { data: Comment[] }
  setCommentsModalComments(response.data?.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setCommentsModalComments([]);
    } finally {
      setCommentsModalLoading(false);
    }
  };

  const handleReplyComment = (_comment: any) => {
    // Reply handler (no debug log)
    // TODO: Implémenter la réponse aux commentaires
  };

  const handleLikeComment = async (commentId: number) => {
    if (!commentsModalPost || !blackRoom) return;

    setLoadingComments(prev => new Set([...prev, commentId]));

    try {
      const response = await api.post(`/black-rooms/${blackRoom.slug}/posts/${commentsModalPost.id}/comments/${commentId}/like`);
      if (response.data.liked) {
        setLikedComments(prev => new Set([...prev, commentId]));
      } else {
        setLikedComments(prev => {
          const updated = new Set(prev);
          updated.delete(commentId);
          return updated;
        });
      }
      
      // Rafraîchir les commentaires pour avoir le bon compteur
      const updatedComments = commentsModalComments.map(c =>
        c.id === commentId ? { ...c, likes_count: response.data.likes_count, liked_by_user: response.data.liked } : c
      );
      setCommentsModalComments(updatedComments);
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLoadingComments(prev => {
        const updated = new Set(prev);
        updated.delete(commentId);
        return updated;
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    if (!commentsModalPost || !blackRoom) return;

    try {
      await api.delete(`/black-rooms/${blackRoom.slug}/posts/${commentsModalPost.id}/comments/${commentId}`);
      setCommentsModalComments(prev => prev.filter(c => c.id !== commentId));
  // Show success notification
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReportComment = (_comment: any) => {
    // Report comment handler (no debug log)
    // TODO: Implémenter le signalement de commentaires
  };

  const handleSubmitReply = async (parentCommentId: number, content: string) => {
    if (!commentsModalPost || !blackRoom) return;

    try {
      const response = await api.post(`/black-rooms/${blackRoom.slug}/posts/${commentsModalPost.id}/comments`, {
        content: content.trim(),
        parent_id: parentCommentId,
      });

      // Add the new reply to the comments tree
      const newReply = response.data.data;
      const updatedComments = commentsModalComments.map(c => {
        if (c.id === parentCommentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply],
          };
        }
        return c;
      });

  setCommentsModalComments(updatedComments);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleSubmitComment = async (content: string) => {
    if (!commentsModalPost || !blackRoom) return;

    try {
      const response = await api.post(`/black-rooms/${blackRoom.slug}/posts/${commentsModalPost.id}/comments`, {
        content: content.trim(),
      });

      const newComment = response.data.data;
  setCommentsModalComments([newComment, ...commentsModalComments]);
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error;
    }
  };

  const handleSubmitVoiceComment = async (audioBlob: Blob, duration: number) => {
    if (!commentsModalPost || !blackRoom) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-comment.webm');
      formData.append('audio_duration', duration.toString());

      const response = await api.post(
        `/black-rooms/${blackRoom.slug}/posts/${commentsModalPost.id}/comments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newComment = response.data.data;
  setCommentsModalComments([newComment, ...commentsModalComments]);
    } catch (error) {
      console.error('Error submitting voice comment:', error);
      throw error;
    }
  };

  const getRoomTheme = () => {
    if (!blackRoom) return {};
    const pt: string = (blackRoom as any)?.public_type ?? '';
    
    switch (pt) {
      case 'tabous':
        return {
          gradient: 'from-purple-900/30 via-pink-900/30 to-purple-900/30',
          glow: 'shadow-[0_0_40px_rgba(168,85,247,0.5)]',
          accent: 'purple',
        };
      case 'confessions':
        return {
          gradient: 'from-blue-900/30 via-indigo-900/30 to-purple-900/30',
          glow: 'shadow-[0_0_40px_rgba(59,130,246,0.5)]',
          accent: 'blue',
        };
      case 'sexualite':
        return {
          gradient: 'from-pink-900/30 via-rose-900/30 to-red-900/30',
          glow: 'shadow-[0_0_40px_rgba(236,72,153,0.5)]',
          accent: 'pink',
        };
      case 'senegal_actualites':
        return {
          gradient: 'from-green-900/30 via-emerald-900/30 to-teal-900/30',
          glow: 'shadow-[0_0_40px_rgba(16,185,129,0.5)]',
          accent: 'green',
        };
      case 'vff':
        return {
          gradient: 'from-purple-900/40 via-violet-900/30 to-fuchsia-900/30',
          glow: 'shadow-[0_0_50px_rgba(167,139,250,0.6)]',
          accent: 'violet',
        };
      default:
        return {
          gradient: 'from-gray-900/30 via-slate-900/30 to-gray-900/30',
          glow: 'shadow-[0_0_40px_rgba(139,92,246,0.5)]',
          accent: 'purple',
        };
    }
  };

  // Emergency resources for VFF room
  const emergencyResources = [
    { name: 'Police Secours', number: '17', icon: '🚔', description: 'En cas d\'urgence immédiate' },
    { name: 'Gendarmerie', number: '800 00 20 20', icon: '📞', description: 'Ligne gratuite' },
    { name: 'SAMU', number: '1515', icon: '🚑', description: 'Urgences médicales' },
    { name: 'Pompiers', number: '18', icon: '🚒', description: 'Urgences & Secours' },
    { name: 'AJS (Juristes Sénégalaises)', number: '33 823 52 12', icon: '⚖️', description: 'Assistance juridique' },
    { name: 'CLVF', number: '33 869 10 30', icon: '💜', description: 'Lutte contre les violences' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!blackRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Chambre introuvable</h2>
          <button
            onClick={() => navigate('/chambres-noires')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/chambres-noires')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <div className="relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.3),transparent_70%)]"></div>
            <div className="relative p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
                  <Lock className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Accès <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Restreint</span>
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Cette chambre noire est protégée. Vous devez être abonné pour accéder à son contenu exclusif et sécurisé.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/chambres-noires')}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  S'abonner Maintenant
                </button>
                <button
                  onClick={() => navigate('/chambres-noires')}
                  className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20"
                >
                  Explorer les Chambres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const theme = getRoomTheme();

  return (
    <>
    <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <button
          onClick={() => navigate('/chambres-noires')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Retour aux chambres</span>
        </button>

        {/* Room Header - Premium Design */}
        <div className={`relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br ${theme.gradient} backdrop-blur-xl mb-8 ${theme.glow}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.2),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.2),transparent_50%)]"></div>
          
          <div className="relative p-8 lg:p-12">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                  <div className={`relative w-20 h-20 ${blackRoom.public_type === 'vff' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-3xl flex items-center justify-center text-4xl shadow-2xl`}>
                    {blackRoom.public_type === 'tabous' && '🔒'}
                    {blackRoom.public_type === 'confessions' && '💔'}
                    {blackRoom.public_type === 'sexualite' && '💋'}
                    {blackRoom.public_type === 'senegal_actualites' && '📰'}
                    {blackRoom.public_type === 'vff' && '💜'}
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{blackRoom.name}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-white/90 text-xs font-medium">Sécurisé</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/10 backdrop-blur-sm rounded-full px-3 py-1 border border-green-500/30">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-300 text-xs font-semibold">En ligne: {presenceCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/50">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-semibold text-sm">Accès Actif</span>
              </div>
            </div>

            <p className="text-white/90 text-lg leading-relaxed max-w-3xl">
              {blackRoom.description}
            </p>

            {/* Online users preview */}
            {presentUsers.length > 0 && (
              <div className="mt-4 text-sm text-white/80">
                <span className="text-white/60 mr-2">Présents:</span>
                <span>
                  {presentUsers.slice(0, 6).map((u, idx) => (
                    <span key={u.id} className="mr-2">
                      {u.name || u.username || `#${u.id}`}
                      {idx < Math.min(5, presentUsers.length - 1) ? ',' : ''}
                    </span>
                  ))}
                  {presentUsers.length > 6 && (
                    <span className="text-white/50">+{presentUsers.length - 6}</span>
                  )}
                </span>
              </div>
            )}

            {/* Security Badges */}
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: '🔐', text: 'Cryptage AES-256' },
                { icon: '👁️', text: 'Anonymat Total' },
                { icon: '⚡', text: 'Auto-Destruction' },
                { icon: '🛡️', text: 'Zero Logs' },
              ].map((badge, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-white/90 text-sm font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EXPIRATION WARNING BANNER */}
        {expirationWarning && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/50 bg-gradient-to-r from-red-900/60 via-red-800/40 to-orange-900/60 backdrop-blur-xl mb-8 animate-pulse">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.4),transparent_70%)]"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 animate-bounce">
                  ⏰
                </div>
                <div className="flex-1">
                  <h2 className="text-xl lg:text-2xl font-bold text-red-200 mb-2">
                    {expirationWarning}
                  </h2>
                  <p className="text-red-100 text-sm">
                    Tous les messages, vidéos et données seront supprimés définitivement à l'expiration. 🚨
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Resources for VFF Room */}
        {blackRoom.public_type === 'vff' && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-fuchsia-900/30 backdrop-blur-xl mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.3),transparent_50%)]"></div>
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  📞
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Numéros d'Urgence & Ressources</h2>
                  <p className="text-white/70 text-sm">Vous n'êtes pas seule. De l'aide est disponible.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergencyResources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={`tel:${resource.number.replace(/\s/g, '')}`}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/50 rounded-xl p-4 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {resource.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{resource.name}</p>
                        <p className="text-violet-300 font-bold">{resource.number}</p>
                        <p className="text-white/50 text-xs">{resource.description}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                <p className="text-white/90 text-sm text-center">
                  💜 <strong>Message important :</strong> Si vous êtes en danger immédiat, appelez le <strong className="text-violet-300">17</strong> (Police) immédiatement.
                  Votre sécurité est notre priorité absolue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Join Requests Section (for room creator) */}
        {user && blackRoom && blackRoom.creator_id === user.id && (
          <div className="mb-6">
            <button
              onClick={() => setShowJoinRequests(!showJoinRequests)}
              className="flex items-center justify-between w-full bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 hover:bg-yellow-500/20 transition"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  Demandes d'accès ({joinRequests.length})
                </span>
              </div>
              <span className="text-white/60">{showJoinRequests ? '▼' : '▶'}</span>
            </button>

            {showJoinRequests && joinRequests.length > 0 && (
              <div className="mt-3 space-y-2">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {req.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {req.user?.name || 'Utilisateur'}
                        </div>
                        <div className="text-white/60 text-sm">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={respondingToRequest === req.id}
                        className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition"
                      >
                        {respondingToRequest === req.id ? '...' : 'Accepter'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={respondingToRequest === req.id}
                        className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition"
                      >
                        {respondingToRequest === req.id ? '...' : 'Rejeter'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showJoinRequests && joinRequests.length === 0 && (
              <div className="mt-3 text-center text-white/60 text-sm py-4">
                Aucune demande en attente
              </div>
            )}
          </div>
        )}

        {/* Auto Modal for Join Requests */}
        {user && blackRoom && blackRoom.creator_id === user.id && joinRequests.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowJoinRequests(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-purple-900/80 border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-xl font-bold text-white">
                    {joinRequests.length} demande{joinRequests.length > 1 ? 's' : ''} d'accès
                  </h2>
                </div>
                <button
                  onClick={() => setShowJoinRequests(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {req.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {req.user?.name || 'Utilisateur'}
                          </div>
                          <div className="text-white/60 text-xs">
                            {new Date(req.created_at).toLocaleDateString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={respondingToRequest === req.id}
                        className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition font-semibold"
                      >
                        {respondingToRequest === req.id ? '...' : '✓ Accepter'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={respondingToRequest === req.id}
                        className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition font-semibold"
                      >
                        {respondingToRequest === req.id ? '...' : '✕ Rejeter'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowJoinRequests(false)}
                className="w-full mt-6 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {blackRoom.type === 'private' ? (
          <div className="mt-6 space-y-4">
            <BlackRoomChat blackRoom={blackRoom} />
            
            {/* Leave Room Button - Below Chat */}
            <button
              onClick={handleLeaveRoom}
              disabled={leavingRoom}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 rounded-lg transition disabled:opacity-50 font-semibold"
              title="Quitter cette chambre"
            >
              {leavingRoom ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-300"></div>
                  <span>Départ en cours...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">✕</span>
                  <span>Quitter la Chambre</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
        {/* Post Form */}
        <BlackRoomPostForm blackRoom={blackRoom} onPostCreated={fetchPosts} />

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <MessageCircle className="relative w-16 h-16 text-white/30 mx-auto" />
              </div>
              <p className="text-white/50 text-lg mb-2">Aucun post pour le moment.</p>
              <p className="text-white/40 text-sm">Soyez le premier à partager !</p>
            </div>
          ) : (
            posts.map((post, index) => (
              <div key={post.id}>
                {/* Séparateur premium entre les posts */}
                {index > 0 && (
                  <div className="relative flex items-center justify-center my-10 py-4">
                    {/* Lignes décoratives avec effet glow */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-purple-500/60"></div>
                      <div className="w-16 h-[1px] bg-gradient-to-r from-purple-500/60 via-pink-500/60 to-purple-500/60"></div>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-purple-500/60 via-purple-500/40 to-transparent"></div>
                    </div>
                    
                    {/* Badge premium avec effets */}
                    <div className="relative z-10">
                      {/* Glow effect en arrière-plan */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-full blur-xl"></div>
                      
                      {/* Badge principal */}
                      <div className="relative px-6 py-2.5 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-500/20 border border-purple-400/30 rounded-full backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
                          <span className="text-white/90 text-xs font-bold uppercase tracking-[0.15em] letter-spacing">
                            {blackRoom?.name || 'Chambre'}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                {/* Top-right three-dots menu on the card */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpenMenuPostId(prev => prev === post.id ? null : post.id); }}
                    className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
                    aria-haspopup="menu"
                    aria-expanded={openMenuPostId === post.id}
                    title="Plus d'actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openMenuPostId === post.id && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 bg-zinc-900/95 border border-white/10 rounded-md shadow-lg backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10"
                        onClick={async () => {
                          try {
                            const origin = window.location?.origin || '';
                            const slugStr = blackRoom?.slug || slug || String(blackRoom?.id || '');
                            const url = `${origin}/black-rooms/${slugStr}?post=${post.id}`;
                            await navigator.clipboard.writeText(url);
                          } catch {}
                          setOpenMenuPostId(null);
                        }}
                      >
                        <LinkIcon className="w-4 h-4" /> Copier le lien du post
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10"
                        onClick={() => {
                          const origin = window.location?.origin || '';
                          const slugStr = blackRoom?.slug || slug || String(blackRoom?.id || '');
                          const url = `${origin}/black-rooms/${slugStr}?post=${post.id}`;
                          setShareModal({
                            isOpen: true,
                            title: blackRoom?.name || 'Chambre',
                            text: post.content || '',
                            url,
                            type: 'post',
                          });
                          setOpenMenuPostId(null);
                        }}
                      >
                        <Share2 className="w-4 h-4" /> Partager…
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/10"
                        onClick={() => { handleReport(post.id); setOpenMenuPostId(null); }}
                      >
                        <AlertTriangle className="w-4 h-4" /> Signaler
                      </button>
                      {/* Supprimer - visible seulement si l'utilisateur est propriétaire du post */}
                      {user && post.user?.id === user.id && (
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => { handleDeletePost(post.id); setOpenMenuPostId(null); }}
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                <div className="relative p-6 lg:p-8">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-50"></div>
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg">
                        {post.user?.avatar_url || '👤'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold">{post.user?.name || 'Anonyme'}</p>
                        {post.user && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/40 flex items-center gap-1">
                            <span>✍️</span>
                            <span>Auteur</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-xs mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.created_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                        {post.is_ephemeral && post.expires_at && (
                          <span className="flex items-center gap-1 text-yellow-400" title={`Expire le ${new Date(post.expires_at).toLocaleString('fr-FR')}`}>
                            <Zap className="w-3 h-3" />
                            Éphémère - Expire {new Date(post.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content - Titre dans une section */}
                  {post.content && (
                    <PostContent content={post.content} />
                  )}

                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={post.images.length === 1 ? "mb-4" : "grid grid-cols-2 gap-3 mb-4"}>
                      {post.images.map((img, idx) => (
                        <div key={idx} className="relative group/img overflow-hidden rounded-xl">
                          <img
                            src={img}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-auto max-h-96 object-cover select-none transition-transform duration-300 group-hover/img:scale-105"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition rounded-xl pointer-events-none"></div>
                          {post.is_ephemeral && (
                            <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                              <Zap className="w-3 h-3 text-white" />
                              <span className="text-white text-xs font-semibold">Éphémère</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Video (Audio converti en vidéo avec image de fond) */}
                  {post.video_path && (
                    <BlackRoomVideoPlayer 
                      videoPath={post.video_path}
                      isEphemeral={post.is_ephemeral}
                      isAudio={!post.audio_path} // Si pas d'audio_path, c'est un audio converti en vidéo
                    />
                  )}

                  {/* Audio uniquement (si pas de vidéo générée) */}
                  {post.audio_path && !post.video_path && (
                    <div className="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-purple-900/50 border border-purple-500/30">
                      {/* Image de fond pour l'audio */}
                      <div className="relative w-full h-64 flex items-center justify-center">
                        {/* Dégradé de fond */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-purple-600/40"></div>
                        
                        {/* Cercle avec effet glow */}
                        <div className="relative z-10">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                          <div className="relative w-24 h-24 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border-2 border-white/30">
                            <Zap className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        
                        {/* Contrôles audio au bas (mini-lecteur personnalisé pour empêcher le menu natif de téléchargement) */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4">
                          <MiniAudioPlayer src={post.audio_path} />
                        </div>
                      </div>
                      
                      {post.is_ephemeral && (
                        <div className="absolute top-4 right-4 bg-yellow-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <Zap className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-semibold">Éphémère</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleLike(post.id, 'like')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 hover:text-white transition group/like"
                    >
                      <ThumbsUp className="w-5 h-5 group-hover/like:scale-110 transition-transform" />
                      <span className="font-semibold">{post.likes_count}</span>
                    </button>
                    <button
                      onClick={() => handleLike(post.id, 'dislike')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 hover:text-white transition group/dislike"
                    >
                      <ThumbsDown className="w-5 h-5 group-hover/dislike:scale-110 transition-transform" />
                      <span className="font-semibold">{post.dislikes_count}</span>
                    </button>
                    <button 
                      onClick={() => {
                        handleOpenCommentsModal(post);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 hover:text-white transition"
                      title="Voir et commenter"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-semibold">{post.comments_count}</span>
                    </button>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleReport(post.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 rounded-xl text-white/70 hover:text-red-300 transition"
                        title="Signaler ce post"
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div id={`comments-${post.id}`}>
                    {!isMobile && (
                      <BlackRoomPostComments
                        blackRoom={blackRoom}
                        post={post}
                        onCommentAdded={() => {
                          fetchPosts();
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
        </>
        )}
      </div>
    </div>

    {/* Mobile Comments Bottom Sheet - DEPRECATED, using CommentsModal instead */}
    {/* {isMobile && sheetOpen && blackRoom && sheetPost && (
      <BlackRoomCommentsBottomSheet
        open={true}
        onClose={() => setSheetOpen(false)}
        blackRoom={blackRoom!}
        post={sheetPost!}
      />
    )} */}

    {/* Comments Modal - TikTok Style for Black Rooms */}
    {commentsModalOpen && commentsModalPost && (
      <CommentsModal
        open={true}
        onClose={() => setCommentsModalOpen(false)}
        comments={commentsModalComments}
        currentUser={user || undefined}
        commentCount={commentsModalPost.comments_count}
        canModerate={isStaff}
        isLoading={commentsModalLoading}
        onReply={handleReplyComment}
        onDelete={handleDeleteComment}
        onLike={handleLikeComment}
        onReport={handleReportComment}
        likedComments={likedComments}
        loadingComments={loadingComments}
        onSubmitReply={handleSubmitReply}
        onSubmitComment={handleSubmitComment}
        onSubmitVoiceComment={handleSubmitVoiceComment}
      />
    )}

    {/* Share Modal for Black Room posts */}
    <ShareModal
      isOpen={shareModal.isOpen}
      onClose={() => setShareModal((s) => ({ ...s, isOpen: false }))}
      title={shareModal.title}
      text={shareModal.text}
      url={shareModal.url}
      type={shareModal.type}
    />

    {/* Save Room Toast - shown when user leaves */}
    <SaveRoomToast
      isVisible={showLeaveToast}
      onClose={() => setShowLeaveToast(false)}
      roomName={blackRoom?.name || 'Chambre'}
      onNavigateToSaved={() => navigate('/saved-black-rooms')}
    />
  </>
  );
}

// Composant pour afficher le contenu du post avec "voir plus"
function PostContent({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > 100;
  const displayText = shouldTruncate && !isExpanded ? content.substring(0, 100) + '...' : content;

  return (
    <section className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
      <h2 className="text-sm lg:text-base font-medium text-white leading-relaxed">
        {displayText}
      </h2>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-medium transition"
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </section>
  );
}

// Mini audio player used to avoid native controls (no browser download button)
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
