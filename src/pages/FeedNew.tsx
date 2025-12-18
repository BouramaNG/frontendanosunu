import { useRef, useState, lazy, Suspense } from 'react';
import { Loader2, Plus } from '@/lib/icons';
import type { Post, Comment } from '../types';
import api from '../lib/api';
import CompactPostForm from '../components/CompactPostForm';
import PostCard from '../components/PostCard';
import ShareModal from '../components/ShareModal';
import { useAuthStore } from '../store/authStore';
import { useTopicsQuery, usePostsQuery } from '../hooks/useDataCache';
import { queryClient } from '../lib/queryClient';

// Lazy load des modals (chargés seulement quand utilisés)
const CommentsModal = lazy(() => import('../components/CommentsModal'));
const SuccessModal = lazy(() => import('../components/SuccessModal'));
const ErrorModal = lazy(() => import('../components/ErrorModal'));
const ConfirmModal = lazy(() => import('../components/ConfirmModal'));
const ReportPostModal = lazy(() => import('../components/ReportPostModal'));
const VoiceRecorder = lazy(() => import('../components/VoiceRecorder'));

// Import des types nécessaires
import type { ReportPostFormValues } from '../components/ReportPostModal';
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou contenu indésirable' },
  { value: 'harassment', label: 'Harcèlement ou intimidation' },
  { value: 'hate_speech', label: 'Discours haineux' },
  { value: 'violence', label: 'Violence ou menaces' },
  { value: 'false_info', label: 'Fausses informations' },
  { value: 'nudity', label: 'Nudité ou contenu sexuel' },
  { value: 'other', label: 'Autre raison' },
];

export default function FeedNew() {
  // ============ React Query - Replaces useState for data fetching ============
  const [selectedTopic, setSelectedTopic] = useState<string>('tous');
  
  // Fetch topics with React Query (automatic deduplication, 5min cache)
  const { data: topicsData = [], isLoading: topicsLoading } = useTopicsQuery();
  const topics = topicsData;
  
  // Fetch posts with React Query (automatic deduplication, 5min cache)
  const topicId = selectedTopic !== 'tous' ? topics.find((t: any) => t.slug === selectedTopic)?.id : undefined;
  const { data: postsData = [], isLoading: postsLoading } = usePostsQuery(topicId);
  const posts = postsData;
  const loading = topicsLoading || postsLoading;

  // State for posts
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedAvatar] = useState({
    type: 'emoji' as const,
    value: '😊',
  });
  // (No top CTA - we rely on the bottom nav compact trigger)

  // UI State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successConfig, setSuccessConfig] = useState({
    message: '',
    title: '',
    subtitle: '',
    duration: 2000,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: 'Confirmer',
    message: 'Êtes-vous sûr?',
    confirmText: 'Supprimer',
    isDangerous: true,
    onConfirm: () => {},
  });

  // Comments & Interactions
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Record<number | string, Record<string, boolean>>>({});

  // Comments Modal
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsModalPost, setCommentsModalPost] = useState<Post | null>(null);
  const [commentsModalComments, setCommentsModalComments] = useState<Comment[]>([]);
  const [commentsModalLoading, setCommentsModalLoading] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetPost, setReportTargetPost] = useState<Post | null>(null);

  // Share Modal
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; title: string; text: string; url: string; type: 'post' | 'comment' }>({
    isOpen: false,
    title: '',
    text: '',
    url: '',
    type: 'post',
  });

  // Voice Recording
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);

  // Auth
  const { user } = useAuthStore();
  const isModerator = user?.role === 'moderator' && user?.is_moderator_verified;
  const isAdmin = user?.role === 'admin';
  const canModerate = Boolean(isModerator || isAdmin);

  const feedEndRef = useRef<HTMLDivElement>(null);

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

      // debug logs removed in production

    setLoadingStates((prev) => ({ ...prev, create: { posting: true } }));
    
    try {
      // Step 1: Upload images si présentes
      let uploadedImageUrls: string[] = [];
      if (selectedImages.length > 0) {
          // image upload debug logs removed
        const imageFd = new FormData();
        selectedImages.forEach((image, index) => {
          imageFd.append(`images[${index}]`, image);
        });

        const uploadResponse = await api.post('/posts/upload-images', imageFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedImageUrls = uploadResponse.data.images || [];
          // image upload result (removed debug log)
      }

      // Step 2: Résoudre le topic ID
      let topicId: number | null = null;
      if (selectedTopic !== 'tous') {
        const topic = topics.find((t: any) => t.slug === selectedTopic);
        topicId = topic?.id ?? null;
      }
      if (!topicId && topics.length > 0) {
        topicId = topics[0].id;
      }

        // topic id resolved

      // Step 3: Préparer les données du post (JSON, pas FormData!)
      const postData = {
        topic_id: topicId || 1,
        content: postContent,
        is_anonymous: true, // ✅ Booléen, pas string!
        avatar_type: selectedAvatar.type,
        avatar_value: selectedAvatar.value,
        images: uploadedImageUrls,
      };

        // post data prepared

      // Step 4: Envoyer le post
      await api.post('/posts', postData);

        // server responded with new post

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setPostContent('');
      setSelectedImages([]);
      setSuccessConfig({
        message: 'Publication créée avec succès ! 🎉',
        title: 'Succès',
        subtitle: 'Votre message est maintenant visible.',
        duration: 2000,
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('[POST] ❌ Erreur complète:', error);
      console.error('[POST] Status:', error?.response?.status);
      console.error('[POST] Data:', error?.response?.data);
      console.error('[POST] Message:', error?.message);
      setErrorMessage(error?.response?.data?.message || 'Erreur lors de la publication');
      setShowErrorModal(true);
    } finally {
      setLoadingStates((prev) => ({ ...prev, create: { posting: false } }));
        // post handling finished
    }
  };

  const handleUploadVoiceOnly = async (blob: Blob, recordSeconds: number) => {
  // Debug logs removed for production
    // voice-only publish debug logs removed
    setVoiceUploading(true);
    try {
      let topicId: number | null = null;
      if (selectedTopic !== 'tous') {
        const topic = topics.find((t: any) => t.slug === selectedTopic);
        topicId = topic?.id ?? null;
      }
      if (!topicId && topics.length > 0) {
        topicId = topics[0].id;
      }

      // voice-only topic id resolved

      const fd = new FormData();
      fd.append('topic_id', String(topicId || 1));
      fd.append('audio', blob, 'voice.webm');
      fd.append('duration_seconds', String(Math.min(recordSeconds, 120)));
      fd.append('is_anonymous', '1');
      fd.append('avatar_type', selectedAvatar.type);
      fd.append('avatar_value', selectedAvatar.value);

      // voice-only formdata content logging removed
      for (const value of fd.values()) {
        // removed debug logging for form data values
        void value;
      }

      // voice-only formdata ready for sending

      await api.post('/posts/voice', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // voice-only server response received

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSuccessConfig({
        message: 'Message vocal publié ! 🎉',
        title: 'Publication réussie',
        subtitle: 'Votre voix (anonymisée) est partagée.',
        duration: 2000,
      });
      setShowSuccessModal(true);
      setShowVoiceRecorder(false);

      // Clear the form after publishing audio-only
      setPostContent('');
      setSelectedImages([]);
    } catch (error: any) {
      console.error('[VOICE_ONLY] ❌ Erreur:', error);
      setErrorMessage(
        error.response?.data?.message ||
        'Erreur lors de la publication du message vocal.'
      );
      setShowErrorModal(true);
    } finally {
      setVoiceUploading(false);
    }
  };

  const handleUploadVoiceWithContent = async (blob: Blob, recordSeconds: number) => {
  // voice-with-content debug logs removed
    
    if (!postContent.trim() && selectedImages.length === 0) {
      alert('Veuillez ajouter du contenu (texte ou image) à côté de votre audio.');
      return;
    }

    setVoiceUploading(true);
    try {
      // First, upload images if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        // image upload debug removed
        const imgFormData = new FormData();
        selectedImages.forEach((img) => {
          imgFormData.append('images[]', img);
        });

        const imgResponse = await api.post('/posts/upload-images', imgFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  imageUrls = imgResponse.data.images || [];
      }

      // Now, create the post with text, images, AND audio
      let topicId: number | null = null;
      if (selectedTopic !== 'tous') {
        const topic = topics.find((t: any) => t.slug === selectedTopic);
        topicId = topic?.id ?? null;
      }
      if (!topicId && topics.length > 0) {
        topicId = topics[0].id;
      }

  // voice-with-content topic id resolved

      // Upload audio as FormData
      const audioFormData = new FormData();
      audioFormData.append('topic_id', String(topicId || 1));
      audioFormData.append('audio', blob, 'voice.webm');
      audioFormData.append('duration_seconds', String(Math.min(recordSeconds, 120)));
      audioFormData.append('is_anonymous', '1');
      audioFormData.append('avatar_type', selectedAvatar.type);
      audioFormData.append('avatar_value', selectedAvatar.value);
      audioFormData.append('content', postContent.trim());
      
      // Add image URLs if any
      if (imageUrls.length > 0) {
        imageUrls.forEach((url, idx) => {
          audioFormData.append(`images[${idx}]`, url);
        });
      }

  // audio formdata logging removed

      await api.post('/posts/voice', audioFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

  // voice-with-content server response received

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSuccessConfig({
        message: 'Post complet publié ! 🎉',
        title: 'Publication réussie',
        subtitle: 'Votre audio, texte et images sont partagés (anonymisés).',
        duration: 2000,
      });
      setShowSuccessModal(true);
      setShowVoiceRecorder(false);

      // Clear the form after successful publish
      setPostContent('');
      setSelectedImages([]);
    } catch (error: any) {
      console.error('[VOICE_WITH_CONTENT] ❌ Erreur:', error);
      setErrorMessage(
        error.response?.data?.message ||
        'Erreur lors de la publication du post avec audio.'
      );
      setShowErrorModal(true);
    } finally {
      setVoiceUploading(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    const postIdx = posts.findIndex((p: any) => p.id === postId);
    if (postIdx === -1) return;

    setLoadingStates((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], liking: true },
    }));

    try {
      const response = await api.post(`/posts/${postId}/like`);
      const { liked, likes_count } = response.data;

      const newLikedPosts = new Set(likedPosts);
      if (liked) {
        newLikedPosts.add(postId);
      } else {
        newLikedPosts.delete(postId);
      }
      setLikedPosts(newLikedPosts);

      queryClient.setQueryData(['posts', topicId], (oldData: Post[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((p: Post) =>
          p.id === postId
            ? { ...p, likes_count, liked_by_user: liked }
            : p
        );
      });
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], liking: false },
      }));
    }
  };

  const handleToggleComments = async (postId: number) => {
    const post = posts.find((p: any) => p.id === postId);
    if (!post) return;

    setCommentsModalPost(post);
    setCommentsModalLoading(true);
    setCommentsModalOpen(true);

    try {
      const response = await api.get(`/posts/${postId}/comments`);
      setCommentsModalComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setErrorMessage('Impossible de charger les commentaires');
      setShowErrorModal(true);
      setCommentsModalComments([]);
    } finally {
      setCommentsModalLoading(false);
    }
  };

  const handleReplyComment = (_comment: Comment) => {
    // TODO: Implémenter la réponse aux commentaires
  };

  const handleLikeComment = async (commentId: number) => {
    if (!commentsModalPost) return;

    setLoadingComments(prev => new Set([...prev, commentId]));

    try {
      const response = await api.post(`/comments/${commentId}/like`);
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
    if (!commentsModalPost) return;

    try {
      await api.delete(`/comments/${commentId}`);
  setCommentsModalComments(prev => prev.filter(c => c.id !== commentId));
  // Decrement the post's comments_count so the feed shows the updated count
  queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSuccessConfig({
        message: 'Commentaire supprimé avec succès',
        title: 'Succès',
        subtitle: '',
        duration: 2000,
      });
      setShowSuccessModal(true);
      // Fermer la modale de commentaires pour forcer une re-synchronisation
      setCommentsModalOpen(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setErrorMessage('Impossible de supprimer le commentaire');
      setShowErrorModal(true);
    }
  };

  const handleReportComment = (_comment: Comment) => {
    // TODO: Implémenter le signalement de commentaires
  };

  const handleSubmitReply = async (parentCommentId: number, content: string) => {
    if (!commentsModalPost) return;

    try {
      const response = await api.post(`/posts/${commentsModalPost.id}/comments`, {
        content: content.trim(),
        parent_id: parentCommentId,
      });

      // Add the new reply to the comments tree
      const newReply = response.data;
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
      setSuccessConfig({
        message: 'Réponse envoyée avec succès',
        title: 'Succès',
        subtitle: '',
        duration: 2000,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting reply:', error);
      setErrorMessage('Impossible d\'envoyer la réponse');
      setShowErrorModal(true);
    }
  };

  const handleSubmitComment = async (content: string) => {
    if (!commentsModalPost) return;

    try {
      const response = await api.post(`/posts/${commentsModalPost.id}/comments`, {
        content: content.trim(),
      });

      const newComment = response.data;
  setCommentsModalComments([newComment, ...commentsModalComments]);
  // Update the posts list so the comment counter updates live
  queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSuccessConfig({
        message: 'Commentaire envoyé avec succès',
        title: 'Succès',
        subtitle: '',
        duration: 2000,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setErrorMessage('Impossible d\'envoyer le commentaire');
      setShowErrorModal(true);
      throw error;
    }
  };

  const handleDeletePost = async (postId: number) => {
    setConfirmConfig({
      title: 'Supprimer la publication',
      message: 'Êtes-vous sûr de vouloir supprimer cette publication? Cette action est irréversible.',
      confirmText: 'Supprimer',
      isDangerous: true,
      onConfirm: async () => {
        setLoadingStates((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], deleting: true },
        }));

        try {
          await api.delete(`/posts/${postId}`);
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          setSuccessConfig({
            message: 'Publication supprimée.',
            title: 'Succès',
            subtitle: '',
            duration: 1500,
          });
          setShowSuccessModal(true);
          setShowConfirmModal(false);
        } catch (error) {
          console.error('Error deleting post:', error);
          setErrorMessage('Impossible de supprimer la publication');
          setShowErrorModal(true);
          setShowConfirmModal(false);
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            [postId]: { ...prev[postId], deleting: false },
          }));
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleBlockPost = async (postId: number) => {
    setLoadingStates((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], moderating: true },
    }));

    try {
      await api.post(`/posts/${postId}/block`);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSuccessConfig({
        message: 'Publication bloquée.',
        title: 'Succès',
        subtitle: '',
        duration: 1500,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error blocking post:', error);
      setErrorMessage('Impossible de bloquer la publication');
      setShowErrorModal(true);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], moderating: false },
      }));
    }
  };

  const handleUnblockPost = async (postId: number) => {
    setLoadingStates((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], moderating: true },
    }));

    try {
      await api.post(`/posts/${postId}/unblock`);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSuccessConfig({
        message: 'Publication débloquée.',
        title: 'Succès',
        subtitle: '',
        duration: 1500,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error unblocking post:', error);
      setErrorMessage('Impossible de débloquer la publication');
      setShowErrorModal(true);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], moderating: false },
      }));
    }
  };

  const handleOpenReportModal = (post: Post) => {
    setReportTargetPost(post);
    setReportModalOpen(true);
  };

  const handleSharePost = (postId: number) => {
    const post = posts.find((p: any) => p.id === postId);
    if (!post) return;

    const shareUrl = `${window.location.origin}/posts/${postId}`;
    const shareTitle = 'Anosunu - Publication';
    const shareText = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');

    setShareModal({
      isOpen: true,
      title: shareTitle,
      text: shareText,
      url: shareUrl,
      type: 'post',
    });
  };

  const handleSubmitReport = async (values: ReportPostFormValues) => {
    if (!reportTargetPost) return;

    try {
      const reasonLabel = REPORT_REASONS.find((r) => r.value === values.reason)?.label || '';
      const message = values.details ? `${reasonLabel} — ${values.details}` : reasonLabel;

      const response = await api.post(`/posts/${reportTargetPost.id}/report`, {
        reason: message,
      });

      if (response.data?.auto_removed) {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }

      setSuccessConfig({
        message: response.data?.message || 'Signalement enregistré.',
        title: response.data?.auto_removed ? 'Publication retirée' : 'Merci',
        subtitle: response.data?.auto_removed
          ? 'Le contenu a été automatiquement supprimé.'
          : 'Nous examinerons votre signalement.',
        duration: 2000,
      });
      setShowSuccessModal(true);
      setReportModalOpen(false);
      setReportTargetPost(null);
    } catch (error: any) {
      console.error('Error reporting post:', error);
      setErrorMessage(error?.response?.data?.message || 'Erreur lors du signalement');
      setShowErrorModal(true);
    }
  };

  // ============ Render ============
  const postState = (loadingStates['create'] as Record<string, boolean>) || {};

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Post Form: compact component that exposes data-compact-post-form and an ID for bottom nav to target */}
        {user && (
          <div id="post-form-container">
            <CompactPostForm
              user={user}
              topics={topics}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              content={postContent}
              onContentChange={setPostContent}
              selectedImages={selectedImages}
              onImagesChange={setSelectedImages}
              onSubmit={handleCreatePost}
              isLoading={postState.posting}
              previewUrls={selectedImages.map((f) => URL.createObjectURL(f))}
              onRemoveImage={(idx) => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
              onVoiceClick={() => setShowVoiceRecorder(true)}
              onAudioSubmit={(blob: Blob, seconds: number) => handleUploadVoiceOnly(blob, seconds)}
              maxChars={1000}
            />
          </div>
        )}

        {/* Topic Filter: grid 3 per row to avoid horizontal scrolling */}
        <div className="mb-6 px-0 sm:px-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedTopic('tous')}
              className={`w-full text-center px-2 py-2 rounded-md font-medium text-[13px] sm:text-sm transition ${
                selectedTopic === 'tous'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 border border-white/10 text-white/80 hover:border-white/20'
              }`}
            >
              Tous
            </button>
            {topics.map((topic: any) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.slug)}
                className={`w-full text-center px-2 py-2 rounded-md font-medium text-[13px] sm:text-sm leading-snug transition ${
                  selectedTopic === topic.slug
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:border-white/20'
                }`}
              >
                <span className="inline-block mr-1">{topic.icon || '•'}</span>
                <span className="break-words">{topic.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Plus className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/50">Aucune publication pour le moment.</p>
            <p className="text-white/40 text-sm mt-1">
              Soyez le premier à partager vos pensées ! 💭
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => {
              const postLoading = loadingStates[post.id] || {};

              return (
                <div key={post.id}>
                  {/* Post Card */}
                  <PostCard
                    post={post}
                    currentUser={user || undefined}
                    onLike={handleLikePost}
                    onComment={() => handleToggleComments(post.id)}
                    onShare={handleSharePost}
                    onReport={handleOpenReportModal}
                    onDelete={handleDeletePost}
                    onBlock={handleBlockPost}
                    onUnblock={handleUnblockPost}
                    canModerate={canModerate}
                    commentsCount={post.comments_count || 0}
                    expandedComments={false}
                    loadingStates={postLoading}
                    onExpand={() => handleToggleComments(post.id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      {/* Modals - Lazy loaded avec Suspense */}
      <Suspense fallback={null}>
        {showSuccessModal && (
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title={successConfig.title}
            subtitle={successConfig.subtitle}
            message={successConfig.message}
            duration={successConfig.duration}
          />
        )}

        {showErrorModal && (
          <ErrorModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            message={errorMessage}
          />
        )}

        {reportModalOpen && (
          <ReportPostModal
            open={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            onSubmit={handleSubmitReport}
          />
        )}

        {showVoiceRecorder && (
          <VoiceRecorder
            isOpen={showVoiceRecorder}
            onClose={() => setShowVoiceRecorder(false)}
            onSubmitAudioOnly={handleUploadVoiceOnly}
            onSubmitWithContent={handleUploadVoiceWithContent}
            hasContent={postContent.trim().length > 0 || selectedImages.length > 0}
            isLoading={voiceUploading}
          />
        )}

        {showConfirmModal && (
          <ConfirmModal
            isOpen={showConfirmModal}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText={confirmConfig.confirmText}
            isDangerous={confirmConfig.isDangerous}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}

        {/* Comments Modal - TikTok Style for Feed */}
        {commentsModalOpen && commentsModalPost && (
          <CommentsModal
          open={true}
          onClose={() => setCommentsModalOpen(false)}
          comments={commentsModalComments}
          currentUser={user || undefined}
          commentCount={commentsModalPost.comments_count}
          canModerate={canModerate}
          isLoading={commentsModalLoading}
          onReply={handleReplyComment}
          onDelete={handleDeleteComment}
          onLike={handleLikeComment}
          onReport={handleReportComment}
          likedComments={likedComments}
          loadingComments={loadingComments}
          onSubmitReply={handleSubmitReply}
          onSubmitComment={handleSubmitComment}
        />
      )}
      </Suspense>

      {/* ShareModal - Non-lazy loaded pour affichage immédiat */}
      {shareModal.isOpen && (
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
          title={shareModal.title}
          text={shareModal.text}
          url={shareModal.url}
          type={shareModal.type}
        />
      )}
    </div>
  );
}
