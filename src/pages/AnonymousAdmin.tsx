import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  ArchiveRestore,
  ArrowUpRight,
  BookMarked,
  Clock,
  Crown,
  Edit,
  Eye,
  Filter,
  Globe,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  ShieldBan,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
  Undo2,
  Users,
} from '@/lib/icons';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import AdminPayments from './AdminPayments';

type AdminTab = 'overview' | 'posts' | 'users' | 'moderators' | 'categories' | 'payments' | 'black-rooms';

const ADMIN_TABS: { key: AdminTab; label: string; description: string }[] = [
  { key: 'overview', label: 'Vue globale', description: 'Indicateurs clés du réseau anonyme' },
  { key: 'payments', label: '💰 Paiements', description: 'Vérifier et valider les paiements Wave' },
  { key: 'black-rooms', label: '🔐 Sama Chambres', description: 'Gérer les chambres noires éphémères' },
  { key: 'posts', label: 'Posts', description: 'Modérer, bloquer ou supprimer les publications' },
  { key: 'users', label: 'Utilisateurs', description: 'Gérer les membres et leurs statuts' },
  { key: 'moderators', label: 'Modérateurs', description: 'Approuver ou suivre les modérateurs' },
  { key: 'categories', label: 'Catégories', description: 'Créer et organiser les topics' },
];

const CARD_VARIANTS = [
  'from-pink-500/25 via-purple-500/20 to-blue-500/15',
  'from-emerald-400/25 via-teal-400/15 to-emerald-500/10',
  'from-amber-400/30 via-orange-500/20 to-rose-500/15',
  'from-indigo-500/30 via-sky-500/20 to-cyan-500/15',
];

type AdminUserRow = {
  id: number;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role: string;
  is_moderator_verified: boolean;
  is_banned: boolean;
  created_at: string;
  posts_count: number;
  comments_count: number;
};

type PaginationState = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type FeedbackModalState = {
  open: boolean;
  message: string;
  subtitle?: string;
};

type AdminActionOptions = {
  body?: Record<string, unknown>;
  confirmMessage?: string;
  confirmTitle?: string;
  confirmSubtitle?: string;
  confirmLabel?: string;
  confirmTone?: 'danger' | 'warning' | 'info';
  successMessage: string;
};

type PendingActionState = {
  open: boolean;
  meta?: {
    title?: string;
    message?: string;
    subtitle?: string;
    confirmLabel?: string;
    tone?: 'danger' | 'warning' | 'info';
  };
  onConfirm?: () => void;
};

type ModeratorRequestRow = {
  id: number;
  user_id: number;
  username?: string | null;
  full_name?: string | null;
  experience?: string | null;
  availability?: string | null;
  timezone?: string | null;
  languages: string[];
  submitted_at: string;
  motivation?: string | null;
};

type ModeratorActiveRow = {
  id: number;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role: string;
  is_moderator_verified: boolean;
  moderator_verified_at: string | null;
  posts_count: number;
  comments_count: number;
};

type AdminActor = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  is_moderator_verified?: boolean;
};

type AdminTopicSummary = {
  id: number;
  name: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
};

type AdminCommentPreview = {
  id: number;
  content: string;
  created_at: string | null;
  relative_time?: string | null;
  is_blocked: boolean;
  block_reason?: string | null;
  user?: AdminActor | null;
  blocked_by?: AdminActor | null;
};

type AdminCommentRow = AdminCommentPreview & {
  likes_count: number;
  parent_id?: number | null;
  replies_count: number;
  replies_preview: AdminCommentPreview[];
};

type AdminPostRow = {
  id: number;
  content: string;
  excerpt: string;
  created_at: string | null;
  updated_at: string | null;
  relative_time?: string | null;
  likes_count: number;
  comments_count: number;
  is_blocked: boolean;
  is_approved: boolean;
  is_anonymous: boolean;
  block_reason?: string | null;
  blocked_at?: string | null;
  blocked_by?: AdminActor | null;
  topic?: AdminTopicSummary | null;
  user?: AdminActor | null;
  has_media: boolean;
  images?: string[] | null;
  stickers?: string[] | null;
};

type AdminTopicRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_sensitive: boolean;
  requires_moderation: boolean;
  is_blocked: boolean;
  blocked_at?: string | null;
  block_reason?: string | null;
  blocked_by?: {
    id: number;
    name?: string | null;
  } | null;
  posts_count: number;
  created_at: string;
  updated_at: string;
};

export default function AnonymousAdmin() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [usersData, setUsersData] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [usersPagination, setUsersPagination] = useState<PaginationState>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [usersActionLoading, setUsersActionLoading] = useState<Record<number, string | null>>({});
  const [successModal, setSuccessModal] = useState<FeedbackModalState>({
    open: false,
    message: '',
    subtitle: '',
  });
  const [errorModal, setErrorModal] = useState<FeedbackModalState>({
    open: false,
    message: '',
    subtitle: '',
  });
  const [confirmModal, setConfirmModal] = useState<PendingActionState>({
    open: false,
    meta: undefined,
    onConfirm: undefined,
  });
  const [moderatorsLoading, setModeratorsLoading] = useState(false);
  const [moderatorRequests, setModeratorRequests] = useState<ModeratorRequestRow[]>([]);
  const [activeModerators, setActiveModerators] = useState<ModeratorActiveRow[]>([]);
  const [moderatorActionLoading, setModeratorActionLoading] = useState<number | null>(null);
  const [topicsData, setTopicsData] = useState<AdminTopicRow[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicActionLoading, setTopicActionLoading] = useState<Record<number, string | null>>({});
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [topicFormMode, setTopicFormMode] = useState<'create' | 'edit'>('create');
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  // Payments pending count for badge
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  
  const [topicForm, setTopicForm] = useState({
    id: undefined as number | undefined,
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#6366f1',
    is_sensitive: false,
    requires_moderation: false,
  });
  const [postsData, setPostsData] = useState<AdminPostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsPerPage] = useState(20);
  const [postsMeta, setPostsMeta] = useState<PaginationState>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [postSearchInput, setPostSearchInput] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState<'all' | 'active' | 'blocked' | 'pending'>('all');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [postDetail, setPostDetail] = useState<{ post: AdminPostRow; comments: AdminCommentRow[] } | null>(null);
  const [postDetailLoading, setPostDetailLoading] = useState(false);
  const [postActionLoading, setPostActionLoading] = useState<Record<number, string | null>>({});
  const [commentActionLoading, setCommentActionLoading] = useState<Record<number, string | null>>({});

  const summaryMetrics = useMemo(
    () => [
      {
        label: 'Utilisateurs actifs',
        value: '18 245',
        delta: '+12% cette semaine',
        icon: Users,
      },
      {
        label: 'Posts publiés (24h)',
        value: '4 592',
        delta: '+8% vs. hier',
        icon: MessageSquare,
      },
      {
        label: 'Incidents critiques',
        value: '27',
        delta: '5 en cours de traitement',
        icon: AlertTriangle,
      },
      {
        label: 'Tickets modération',
        value: '63',
        delta: '17 assignés',
        icon: ShieldCheck,
      },
    ],
    []
  );

  const fetchUsers = useCallback(
    async (page: number, search: string) => {
      setUsersLoading(true);
      setSuccessModal((prev) => ({ ...prev, open: false }));
      setErrorModal((prev) => ({ ...prev, open: false }));
      try {
        const response = await api.get('/admin/users', {
          params: {
            page,
            per_page: usersPerPage,
            search: search ? search : undefined,
          },
        });

        const {
          data,
          current_page,
          last_page,
          per_page,
          total,
        } = response.data;

        setUsersData(data ?? []);
        setUsersPagination({
          current_page: current_page ?? page,
          last_page: last_page ?? 1,
          per_page: per_page ?? usersPerPage,
          total: total ?? data?.length ?? 0,
        });
      } catch (error) {
        console.error('=== ADMIN USERS: fetch error ===', error);
        setErrorModal({
          open: true,
          message: "Impossible de récupérer les utilisateurs. Veuillez réessayer.",
          subtitle: 'Le serveur a renvoyé une erreur inattendue. Réessaie dans quelques instants.',
        });
      } finally {
        setUsersLoading(false);
      }
    },
    [usersPerPage]
  );

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchUsers(usersPage, userSearch);
    }
  }, [activeTab, user?.role, usersPage, userSearch, fetchUsers]);

  useEffect(() => {
    if (activeTab !== 'users') {
      setSuccessModal((prev) => ({ ...prev, open: false }));
      setErrorModal((prev) => ({ ...prev, open: false }));
    }
  }, [activeTab]);

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchPosts = useCallback(
    async (page: number, search: string, status: 'all' | 'active' | 'blocked' | 'pending') => {
      setPostsLoading(true);
      setErrorModal((prev) => ({ ...prev, open: false }));
      try {
        const response = await api.get('/admin/posts', {
          params: {
            page,
            per_page: postsPerPage,
            search: search ? search : undefined,
            status: status !== 'all' ? status : undefined,
          },
        });

        const data: AdminPostRow[] = Array.isArray(response.data?.data) ? response.data.data : [];
        setPostsData(data);
        setPostsMeta({
          current_page: response.data?.meta?.current_page ?? page,
          last_page: response.data?.meta?.last_page ?? 1,
          per_page: response.data?.meta?.per_page ?? postsPerPage,
          total: response.data?.meta?.total ?? data.length,
        });
      } catch (error) {
        console.error('=== ADMIN POSTS: fetch error ===', error);
        setErrorModal({
          open: true,
          message: "Impossible de récupérer les publications.",
          subtitle: 'Vérifie ta connexion ou consulte la console réseau pour plus de détails.',
        });
      } finally {
        setPostsLoading(false);
      }
    },
    [postsPerPage]
  );

  const fetchPostDetail = useCallback(
    async (postId: number) => {
      setPostDetailLoading(true);
      setErrorModal((prev) => ({ ...prev, open: false }));
      try {
        const response = await api.get(`/admin/posts/${postId}`);
        const payload = response.data?.data;
        if (payload?.post) {
          setPostDetail({
            post: payload.post as AdminPostRow,
            comments: Array.isArray(payload.comments) ? (payload.comments as AdminCommentRow[]) : [],
          });
        }
      } catch (error) {
        console.error('=== ADMIN POST DETAIL: fetch error ===', error);
        setErrorModal({
          open: true,
          message: "Impossible de charger le détail de la publication.",
          subtitle: 'Réessaie dans quelques instants.',
        });
      } finally {
        setPostDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === 'posts' && user?.role === 'admin') {
      fetchPosts(postsPage, postSearch, postStatusFilter);
    }
  }, [activeTab, user?.role, fetchPosts, postsPage, postSearch, postStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'posts') {
      return;
    }

    if (postsData.length === 0) {
      setSelectedPostId(null);
      setPostDetail(null);
      return;
    }

    if (selectedPostId === null || !postsData.some((post) => post.id === selectedPostId)) {
      const firstId = postsData[0].id;
      setSelectedPostId(firstId);
      void fetchPostDetail(firstId);
    }
  }, [activeTab, postsData, selectedPostId, fetchPostDetail]);

  const executePostAction = useCallback(
    async (
      post: AdminPostRow,
      action: 'block' | 'unblock' | 'delete',
      options?: { reason?: string }
    ) => {
      setPostActionLoading((prev) => ({ ...prev, [post.id]: action }));
      setSuccessModal((prev) => ({ ...prev, open: false }));
      setErrorModal((prev) => ({ ...prev, open: false }));

      try {
        let response;
        if (action === 'block') {
          response = await api.post(`/admin/posts/${post.id}/block`, {
            reason: options?.reason,
          });
        } else if (action === 'unblock') {
          response = await api.post(`/admin/posts/${post.id}/unblock`, {});
        } else {
          response = await api.delete(`/admin/posts/${post.id}`);
        }

        await fetchPosts(postsPage, postSearch, postStatusFilter);

        if (action === 'delete') {
          if (selectedPostId === post.id) {
            setSelectedPostId(null);
            setPostDetail(null);
          }
          setSuccessModal({
            open: true,
            message: 'Publication supprimée.',
            subtitle: 'Le post n’apparaît plus dans la liste.',
          });
          return;
        }

        if (selectedPostId === post.id) {
          await fetchPostDetail(post.id);
        }

        const updatedPost: AdminPostRow | undefined = response?.data?.data;
        if (updatedPost) {
          setPostDetail((prev) => {
            if (prev && prev.post.id === updatedPost.id) {
              return { ...prev, post: updatedPost };
            }
            return prev;
          });
        }

        setSuccessModal({
          open: true,
          message: action === 'block' ? 'Publication bloquée.' : 'Publication débloquée.',
          subtitle:
            action === 'block'
              ? 'Les utilisateurs ne peuvent plus consulter ce contenu.'
              : 'La publication est à nouveau visible.',
        });
      } catch (error: any) {
        console.error('=== ADMIN POSTS ACTION ERROR ===', error);
        const errorMsg =
          error?.response?.data?.message || "Impossible d'appliquer l'action sur la publication.";
        setErrorModal({
          open: true,
          message: errorMsg,
          subtitle: 'Réessaie dans quelques instants.',
        });
      } finally {
        setPostActionLoading((prev) => {
          const clone = { ...prev };
          delete clone[post.id];
          return clone;
        });
      }
    },
    [fetchPosts, postsPage, postSearch, postStatusFilter, selectedPostId, fetchPostDetail]
  );

  const executeCommentAction = useCallback(
    async (
      comment: AdminCommentRow,
      action: 'block' | 'unblock' | 'delete',
      options?: { reason?: string }
    ) => {
      if (selectedPostId === null) {
        return;
      }

      setCommentActionLoading((prev) => ({ ...prev, [comment.id]: action }));
      setSuccessModal((prev) => ({ ...prev, open: false }));
      setErrorModal((prev) => ({ ...prev, open: false }));

      try {
        if (action === 'block') {
          await api.post(`/admin/comments/${comment.id}/block`, {
            reason: options?.reason,
          });
        } else if (action === 'unblock') {
          await api.post(`/admin/comments/${comment.id}/unblock`, {});
        } else {
          await api.delete(`/admin/comments/${comment.id}`);
        }

        await fetchPostDetail(selectedPostId);
        await fetchPosts(postsPage, postSearch, postStatusFilter);

        setSuccessModal({
          open: true,
          message:
            action === 'block'
              ? 'Commentaire bloqué.'
              : action === 'unblock'
              ? 'Commentaire débloqué.'
              : 'Commentaire supprimé.',
          subtitle:
            action === 'block'
              ? 'Le commentaire est désormais masqué du public.'
              : action === 'unblock'
              ? 'Le commentaire est de nouveau visible.'
              : 'Il a été retiré définitivement.',
        });
      } catch (error: any) {
        console.error('=== ADMIN COMMENTS ACTION ERROR ===', error);
        const errorMsg =
          error?.response?.data?.message || "Impossible d'appliquer l'action sur le commentaire.";
        setErrorModal({
          open: true,
          message: errorMsg,
          subtitle: 'Réessaie dans quelques instants.',
        });
      } finally {
        setCommentActionLoading((prev) => {
          const clone = { ...prev };
          delete clone[comment.id];
          return clone;
        });
      }
    },
    [selectedPostId, fetchPostDetail, fetchPosts, postsPage, postSearch, postStatusFilter]
  );

  const normaliseUserPayload = useCallback((payload: any): AdminUserRow => {
    return {
      id: payload?.id,
      name: payload?.name ?? payload?.username ?? '',
      username: payload?.username ?? payload?.name ?? '',
      email: payload?.email ?? '',
      role: payload?.role ?? 'user',
      is_moderator_verified: Boolean(payload?.is_moderator_verified),
      is_banned: Boolean(payload?.is_banned),
      created_at: payload?.created_at ?? new Date().toISOString(),
      posts_count: payload?.posts_count ?? 0,
      comments_count: payload?.comments_count ?? 0,
    };
  }, []);

  const formatDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return parsed.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchModerators = useCallback(async () => {
    setModeratorsLoading(true);
    setSuccessModal((prev) => ({ ...prev, open: false }));
    setErrorModal((prev) => ({ ...prev, open: false }));
    try {
      const response = await api.get('/admin/moderators');
      const pending = Array.isArray(response.data?.pending_requests) ? response.data.pending_requests : [];
      const active = Array.isArray(response.data?.active_moderators) ? response.data.active_moderators : [];

      setModeratorRequests(
        pending.map((entry: any) => ({
          id: entry?.id,
          user_id: entry?.user_id,
          username: entry?.username ?? null,
          full_name: entry?.full_name ?? null,
          experience: entry?.experience ?? null,
          availability: entry?.availability ?? null,
          timezone: entry?.timezone ?? null,
          languages: Array.isArray(entry?.languages) ? entry.languages : [],
          submitted_at: entry?.submitted_at,
          motivation: entry?.motivation ?? null,
        }))
      );

      setActiveModerators(
        active.map((entry: any) => ({
          id: entry?.id,
          username: entry?.username ?? entry?.name ?? null,
          email: entry?.email ?? null,
          avatar_url: entry?.avatar_url ?? null,
          role: entry?.role ?? 'moderator',
          is_moderator_verified: Boolean(entry?.is_moderator_verified),
          moderator_verified_at: entry?.moderator_verified_at ?? null,
          posts_count: entry?.posts_count ?? 0,
          comments_count: entry?.comments_count ?? 0,
        }))
      );
    } catch (error) {
      console.error('=== ADMIN MODERATORS: fetch error ===', error);
      setErrorModal({
        open: true,
        message: "Impossible de récupérer les données modérateur. Veuillez réessayer.",
        subtitle: 'Le serveur a renvoyé une erreur inattendue. Réessaie dans quelques instants.',
      });
    } finally {
      setModeratorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'moderators' && user?.role === 'admin') {
      fetchModerators();
    }
  }, [activeTab, user?.role, fetchModerators]);

  const resetTopicForm = useCallback(() => {
    setTopicForm({
      id: undefined,
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '#6366f1',
      is_sensitive: false,
      requires_moderation: false,
    });
    setTopicFormMode('create');
    setTopicFormOpen(false);
  }, []);

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    setSuccessModal((prev) => ({ ...prev, open: false }));
    setErrorModal((prev) => ({ ...prev, open: false }));
    try {
      const response = await api.get('/admin/topics');
      const records = Array.isArray(response.data?.data) ? response.data.data : [];
      setTopicsData(records);
    } catch (error) {
      console.error('=== ADMIN TOPICS: fetch error ===', error);
      setErrorModal({
        open: true,
        message: "Impossible de récupérer les catégories.",
        subtitle: 'Le serveur a renvoyé une erreur inattendue. Réessaie dans quelques instants.'
      });
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'categories' && user?.role === 'admin') {
      fetchTopics();
    }
  }, [activeTab, user?.role, fetchTopics]);

  // Fetch pending payments count for badge
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchPendingCount = async () => {
        try {
          const response = await api.get('/admin/payments/stats');
          const stats = response.data.data;
          setPendingPaymentsCount(stats.pending_verification || 0);
        } catch (error) {
          console.error('Error fetching pending payments count:', error);
        }
      };
      
      fetchPendingCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const openCreateTopicForm = () => {
    resetTopicForm();
    setTopicFormMode('create');
    setTopicFormOpen(true);
  };

  const openEditTopicForm = (topic: AdminTopicRow) => {
    setTopicForm({
      id: topic.id,
      name: topic.name,
      slug: topic.slug ?? '',
      description: topic.description ?? '',
      icon: topic.icon ?? '',
      color: topic.color ?? '#6366f1',
      is_sensitive: Boolean(topic.is_sensitive),
      requires_moderation: Boolean(topic.requires_moderation),
    });
    setTopicFormMode('edit');
    setTopicFormOpen(true);
  };

  const updateTopicState = (updatedTopic: AdminTopicRow) => {
    setTopicsData((prev) =>
      prev.map((entry) => (entry.id === updatedTopic.id ? updatedTopic : entry))
    );
  };

  const removeTopicFromState = (topicId: number) => {
    setTopicsData((prev) => prev.filter((entry) => entry.id !== topicId));
  };

  const createTopicPayload = () => {
    return {
      name: topicForm.name.trim(),
      slug: topicForm.slug.trim() || null,
      description: topicForm.description.trim() || null,
      icon: topicForm.icon.trim() || null,
      color: topicForm.color || '#6366f1',
      is_sensitive: Boolean(topicForm.is_sensitive),
      requires_moderation: Boolean(topicForm.requires_moderation),
    };
  };

  const handleTopicSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topicForm.name.trim()) {
      return;
    }

    setTopicSubmitting(true);
    try {
      const payload = createTopicPayload();
      if (topicFormMode === 'create') {
        const response = await api.post('/admin/topics', payload);
        const createdTopic: AdminTopicRow = response.data?.data;
        if (createdTopic) {
          setTopicsData((prev) => [createdTopic, ...prev]);
        } else {
          await fetchTopics();
        }
        setSuccessModal({
          open: true,
          message: 'Catégorie créée avec succès.',
          subtitle: 'La liste des topics est à jour.'
        });
      } else if (topicForm.id) {
        const response = await api.put(`/admin/topics/${topicForm.id}`, payload);
        const updatedTopic: AdminTopicRow = response.data?.data;
        if (updatedTopic) {
          updateTopicState(updatedTopic);
        } else {
          await fetchTopics();
        }
        setSuccessModal({
          open: true,
          message: 'Catégorie mise à jour avec succès.',
          subtitle: 'Les modifications sont appliquées immédiatement.'
        });
      }

      resetTopicForm();
    } catch (error: any) {
      console.error('=== ADMIN TOPICS: submit error ===', error);
      const errorMsg =
        error?.response?.data?.message ||
        "Impossible d'enregistrer la catégorie. Vérifie les champs saisis.";
      setErrorModal({
        open: true,
        message: errorMsg,
        subtitle: 'Le serveur a renvoyé une erreur. Consulte la console pour plus de détails.'
      });
    } finally {
      setTopicSubmitting(false);
    }
  };

  const handleTopicDelete = (topic: AdminTopicRow) => {
    setConfirmModal({
      open: true,
      meta: {
        title: 'Supprimer la catégorie',
        message:
          topic.posts_count > 0
            ? `Cette catégorie contient encore ${topic.posts_count} post(s). Assure-toi de les déplacer avant suppression.`
            : 'Confirmez-vous la suppression définitive de cette catégorie ?',
        subtitle: topic.posts_count > 0 ? 'La suppression échouera tant qu’il reste des publications associées.' : undefined,
        confirmLabel: 'Supprimer',
        tone: 'danger',
      },
      onConfirm: () => executeTopicDelete(topic.id),
    });
  };

  const executeTopicDelete = async (topicId: number) => {
    setTopicActionLoading((prev) => ({ ...prev, [topicId]: 'delete' }));
    try {
      await api.delete(`/admin/topics/${topicId}`);
      removeTopicFromState(topicId);
      setSuccessModal({
        open: true,
        message: 'Catégorie supprimée avec succès.',
        subtitle: 'Elle ne figure plus dans la liste.'
      });
    } catch (error: any) {
      console.error('=== ADMIN TOPICS: delete error ===', error);
      const errorMsg = error?.response?.data?.message || 'Suppression impossible. Vérifie la présence de posts associés.';
      setErrorModal({
        open: true,
        message: errorMsg,
        subtitle: 'Ajuste les publications ou réessaie plus tard.'
      });
    } finally {
      setTopicActionLoading((prev) => {
        const clone = { ...prev };
        delete clone[topicId];
        return clone;
      });
    }
  };

  const handleToggleTopicBlock = (topic: AdminTopicRow) => {
    const willBlock = !topic.is_blocked;
    setConfirmModal({
      open: true,
      meta: {
        title: willBlock ? 'Bloquer la catégorie' : 'Débloquer la catégorie',
        message: willBlock
          ? 'Suspendre cette catégorie empêchera toute nouvelle publication et commentaire.'
          : 'Rendre cette catégorie à nouveau active ? Les publications seront de nouveau autorisées.',
        subtitle: willBlock && topic.block_reason ? `Dernière raison: ${topic.block_reason}` : undefined,
        confirmLabel: willBlock ? 'Bloquer' : 'Débloquer',
        tone: willBlock ? 'danger' : 'info',
      },
      onConfirm: () => executeTopicToggleBlock(topic.id, willBlock),
    });
  };

  const executeTopicToggleBlock = async (topicId: number, willBlock: boolean) => {
    setTopicActionLoading((prev) => ({ ...prev, [topicId]: 'toggle' }));
    try {
      const response = await api.post(`/admin/topics/${topicId}/toggle-block`, willBlock ? { reason: 'Blocage appliqué depuis le panneau admin.' } : {});
      const updatedTopic: AdminTopicRow = response.data?.data;
      if (updatedTopic) {
        updateTopicState(updatedTopic);
      } else {
        await fetchTopics();
      }
      setSuccessModal({
        open: true,
        message: willBlock ? 'Catégorie bloquée.' : 'Catégorie débloquée.',
        subtitle: willBlock ? 'Les publications sont désormais empêchées.' : 'Les publications sont de nouveau possibles.'
      });
    } catch (error: any) {
      console.error('=== ADMIN TOPICS: toggle error ===', error);
      const errorMsg = error?.response?.data?.message || "Impossible d'actualiser le statut de la catégorie.";
      setErrorModal({
        open: true,
        message: errorMsg,
        subtitle: 'Réessaie dans un instant ou contacte un administrateur.'
      });
    } finally {
      setTopicActionLoading((prev) => {
        const clone = { ...prev };
        delete clone[topicId];
        return clone;
      });
    }
  };

  const executeUserAction = useCallback(
    async (account: AdminUserRow, endpoint: string, options: AdminActionOptions) => {
      setUsersActionLoading((prev) => ({ ...prev, [account.id]: endpoint }));
      setSuccessModal((prev) => ({ ...prev, open: false }));
      setErrorModal((prev) => ({ ...prev, open: false }));

      try {
        const response = await api.post(endpoint, options.body ?? {});
        const updatedPayload = response.data?.user;
        if (updatedPayload) {
          const updatedRow = normaliseUserPayload(updatedPayload);
          setUsersData((prev) =>
            prev.map((row) => (row.id === account.id ? { ...row, ...updatedRow } : row))
          );
        } else {
          await fetchUsers(usersPage, userSearch);
        }
        setSuccessModal({
          open: true,
          message: options.successMessage,
          subtitle: 'Tous les tableaux sont synchronisés automatiquement.',
        });
      } catch (error) {
        console.error('=== ADMIN USERS ACTION ERROR ===', error);
        setErrorModal({
          open: true,
          message: "Impossible d'appliquer l'action. Réessaie dans un instant.",
          subtitle: 'Vérifie ta connexion ou consulte la console réseau pour plus de détails.',
        });
      } finally {
        setUsersActionLoading((prev) => {
          const clone = { ...prev };
          delete clone[account.id];
          return clone;
        });
      }
    },
    [fetchUsers, normaliseUserPayload, userSearch, usersPage]
  );

  const handleUserAction = useCallback(
    (account: AdminUserRow, endpoint: string, options: AdminActionOptions) => {
      const { confirmMessage, confirmTitle, confirmSubtitle, confirmLabel, confirmTone, ...cleanOptions } = options;

      if (confirmMessage) {
        setConfirmModal({
          open: true,
          meta: {
            title: confirmTitle,
            message: confirmMessage,
            subtitle: confirmSubtitle,
            confirmLabel,
            tone: confirmTone,
          },
          onConfirm: () => executeUserAction(account, endpoint, cleanOptions),
        });
        return;
      }

      executeUserAction(account, endpoint, options);
    },
    [executeUserAction]
  );

  const executeModeratorAction = useCallback(
    async (
      requestRow: ModeratorRequestRow,
      action: 'approve' | 'reject',
      options: AdminActionOptions
    ) => {
      setModeratorActionLoading(requestRow.id);
      setSuccessModal((prev) => ({ ...prev, open: false }));
      setErrorModal((prev) => ({ ...prev, open: false }));

      try {
        const endpoint = `/admin/moderators/requests/${requestRow.id}/${action}`;
        const response = await api.post(endpoint, options.body ?? {});

        if (action === 'approve') {
          const moderator = response.data?.moderator;
          setModeratorRequests((prev) => prev.filter((item) => item.id !== requestRow.id));

          if (moderator) {
            const normalizedModerator: ModeratorActiveRow = {
              id: moderator.id,
              username: moderator.username ?? moderator.name ?? requestRow.username ?? null,
              email: moderator.email ?? null,
              avatar_url: moderator.avatar_url ?? null,
              role: moderator.role ?? 'moderator',
              is_moderator_verified: Boolean(moderator.is_moderator_verified ?? true),
              moderator_verified_at: moderator.moderator_verified_at ?? new Date().toISOString(),
              posts_count: moderator.posts_count ?? 0,
              comments_count: moderator.comments_count ?? 0,
            };

            setActiveModerators((prev) => [normalizedModerator, ...prev]);
          } else {
            await fetchModerators();
          }
        } else {
          setModeratorRequests((prev) => prev.filter((item) => item.id !== requestRow.id));
        }

        setSuccessModal({
          open: true,
          message: options.successMessage,
          subtitle: 'Tous les tableaux sont synchronisés automatiquement.',
        });
      } catch (error) {
        console.error('=== ADMIN MODERATORS ACTION ERROR ===', error);
        setErrorModal({
          open: true,
          message: "Impossible d'appliquer l'action modérateur.",
          subtitle: 'Vérifie ta connexion ou consulte la console réseau pour plus de détails.',
        });
      } finally {
        setModeratorActionLoading(null);
      }
    },
    [fetchModerators]
  );

  const handleModeratorAction = useCallback(
    (requestRow: ModeratorRequestRow, action: 'approve' | 'reject') => {
      const baseOptions: AdminActionOptions =
        action === 'approve'
          ? {
              successMessage: 'Demande approuvée. Le compte est promu en modérateur.',
              confirmMessage: 'Approuver cette demande et promouvoir le membre en modérateur vérifié ?'
                ,
              confirmTitle: 'Valider la demande',
              confirmSubtitle: 'Un badge certifié et les privilèges de modération seront ajoutés immédiatement.',
              confirmLabel: 'Approuver',
              confirmTone: 'info',
            }
          : {
              successMessage: 'Demande rejetée avec succès.',
              confirmMessage: 'Rejeter cette demande de modération ? Le candidat sera notifié.',
              confirmTitle: 'Rejeter la candidature',
              confirmSubtitle: 'Explique brièvement les raisons pour garder une trace claire (une note est ajoutée automatiquement).',
              confirmLabel: 'Rejeter',
              confirmTone: 'danger',
              body: {
                review_notes: 'Demande rejetée depuis le panneau admin.',
              },
            };

      const { confirmMessage, confirmTitle, confirmSubtitle, confirmLabel, confirmTone, ...cleanOptions } = baseOptions;

      if (confirmMessage) {
        setConfirmModal({
          open: true,
          meta: {
            title: confirmTitle,
            message: confirmMessage,
            subtitle: confirmSubtitle,
            confirmLabel,
            tone: confirmTone,
          },
          onConfirm: () => executeModeratorAction(requestRow, action, cleanOptions),
        });
        return;
      }

      executeModeratorAction(requestRow, action, cleanOptions);
    },
    [executeModeratorAction]
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-md space-y-6 bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl p-10 shadow-[0_40px_120px_-40px_rgba(79,70,229,0.45)]">
          <div className="flex items-center justify-center gap-3 text-white text-3xl font-semibold">
            <ShieldCheck className="h-8 w-8 text-purple-300" />
            Accès restreint
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Seuls les administrateurs peuvent consulter l'espace de supervision <span className="text-purple-200 font-semibold">/anonymous</span>. Demande à ton responsable ou connecte-toi avec un compte ayant les privilèges nécessaires.
          </p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-10">
      <div>
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-300" />
          Panorama de la plateforme
        </h2>
        <p className="text-white/60 text-sm mt-1">
          Pilote les performances globales et détecte les anomalies en un coup d'œil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {summaryMetrics.map(({ label, value, delta, icon: Icon }, index) => (
          <div
            key={label}
            className={`relative rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-[0_25px_60px_-35px_rgba(59,130,246,0.45)] overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${CARD_VARIANTS[index % CARD_VARIANTS.length]} opacity-40`} />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-[0.3em]">{label}</p>
                <p className="text-3xl font-semibold text-white mt-2">{value}</p>
              </div>
              <span className="text-emerald-200 text-sm">{delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-[0_40px_120px_-55px_rgba(244,114,182,0.6)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-lg font-semibold">Thermomètre de la communauté</h3>
              <p className="text-white/60 text-sm">Répartition des intentions de modération sur les 24 dernières heures</p>
            </div>
            <button className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60">
              <Filter className="h-4 w-4" />
              Filtrer
            </button>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <dt className="text-white/60">Posts sensibles</dt>
              <dd className="text-white text-xl font-semibold mt-1">132</dd>
              <span className="text-amber-200 text-xs">58% en politique</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <dt className="text-white/60">Alertes instantanées</dt>
              <dd className="text-white text-xl font-semibold mt-1">27</dd>
              <span className="text-pink-200 text-xs">12 urgentes</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <dt className="text-white/60">Modérations réussies</dt>
              <dd className="text-white text-xl font-semibold mt-1">486</dd>
              <span className="text-emerald-200 text-xs">92% satisfaction</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <dt className="text-white/60">Demandes en cours</dt>
              <dd className="text-white text-xl font-semibold mt-1">38</dd>
              <span className="text-white/50 text-xs">Répartition équilibrée</span>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-[0_40px_120px_-55px_rgba(110,231,183,0.45)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-lg font-semibold">Actions rapides</h3>
              <p className="text-white/60 text-sm">Déclenche des opérations critiques en un clic</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Bloquer des posts critiques', icon: Lock, accent: 'text-red-200' },
              { label: 'Envoyer une diffusion globale', icon: MessageSquare, accent: 'text-cyan-200' },
              { label: 'Analyser l’activité par topic', icon: BookMarked, accent: 'text-purple-200' },
              { label: 'Exporter les logs', icon: ArchiveRestore, accent: 'text-emerald-200' },
            ].map(({ label, icon: Icon, accent }) => (
              <button
                key={label}
                className="group w-full px-4 py-4 bg-white/10 border border-white/10 rounded-2xl text-left text-sm font-medium text-white/80 hover:text-white hover:border-white/30 hover:bg-white/15 transition flex items-center justify-between"
              >
                <span>{label}</span>
                <Icon className={`h-4 w-4 ${accent} group-hover:scale-110 transition`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPosts = () => {
    const handleSearchSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      setPostsPage(1);
      setPostSearch(postSearchInput.trim());
    };

    const handleRefresh = () => {
      fetchPosts(postsPage, postSearch, postStatusFilter);
    };

    const handleSelectPost = (postId: number) => {
      setSelectedPostId(postId);
      void fetchPostDetail(postId);
    };

    const getStatusBadge = (post: AdminPostRow) => {
      if (post.is_blocked) {
        return {
          label: 'bloqué',
          className: 'border-red-400/40 text-red-200 bg-red-500/10',
        };
      }

      if (!post.is_approved) {
        return {
          label: 'en attente',
          className: 'border-amber-400/40 text-amber-200 bg-amber-500/10',
        };
      }

      return {
        label: 'actif',
        className: 'border-emerald-400/40 text-emerald-200 bg-emerald-500/10',
      };
    };

    const selectedPost = postDetail?.post;
    const selectedComments = postDetail?.comments ?? [];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold">Gestion des posts</h2>
            <p className="text-white/60 text-sm">Surveille et intervient rapidement sur les contenus sensibles.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={postSearchInput}
                  onChange={(event) => setPostSearchInput(event.target.value)}
                  placeholder="Rechercher par contenu, auteur, topic"
                  className="pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white/80 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/40"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/15"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </button>
            </form>
            <select
              value={postStatusFilter}
              onChange={(event) => {
                setPostsPage(1);
                setPostStatusFilter(event.target.value as 'all' | 'active' | 'blocked' | 'pending');
              }}
              className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="blocked">Bloqués</option>
            </select>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/15"
            >
              <ArrowUpRight className="h-4 w-4" />
              Rafraîchir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl">
            {postsLoading && postsData.length === 0 ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : postsData.length === 0 ? (
              <div className="py-12 text-center text-white/60 text-sm">
                Aucune publication ne correspond aux filtres.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                  <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-[0.2em]">
                    <tr>
                      <th className="px-5 py-4 text-left">Post</th>
                      <th className="px-5 py-4 text-left">Auteur</th>
                      <th className="px-5 py-4 text-left">Topic</th>
                      <th className="px-5 py-4 text-left">Statut</th>
                      <th className="px-5 py-4 text-left">Interactions</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {postsData.map((post) => {
                      const badge = getStatusBadge(post);
                      const isSelected = post.id === selectedPostId;
                      const actionLoading = postActionLoading[post.id];
                      return (
                        <tr
                          key={post.id}
                          className={`transition hover:bg-white/5 cursor-pointer ${
                            isSelected ? 'bg-white/10 border-l-4 border-purple-400/70' : ''
                          }`}
                          onClick={() => handleSelectPost(post.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-white/90 font-semibold truncate">#{post.id} • {post.excerpt || '—'}</span>
                              <span className="text-xs text-white/50">{formatDateTime(post.created_at ?? '')}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="text-white/80 font-medium">{post.user?.name ?? 'Anonyme'}</span>
                              <span className="text-xs text-white/40">{post.user?.email ?? 'Compte masqué'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex h-3 w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: post.topic?.color ?? '#6366f1' }}
                              />
                              <span>{post.topic?.name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest border ${badge.className}`}
                            >
                              <span className="inline-block h-2 w-2 rounded-full bg-current" />
                              {badge.label}
                            </span>
                            {post.block_reason && (
                              <p className="text-[11px] text-red-200/70 mt-1">{post.block_reason}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1 text-xs text-white/60">
                              <span className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-white/40" />
                                {post.comments_count} commentaires
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-white/40" />
                                {post.relative_time ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white/70 hover:text-white hover:border-white/40"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSelectPost(post.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                Détails
                              </button>
                              <button
                                disabled={Boolean(actionLoading)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (post.is_blocked) {
                                    setConfirmModal({
                                      open: true,
                                      meta: {
                                        title: 'Débloquer la publication',
                                        message: 'La publication redeviendra visible pour tous les utilisateurs.',
                                        confirmLabel: 'Débloquer',
                                        tone: 'info',
                                      },
                                      onConfirm: () => executePostAction(post, 'unblock'),
                                    });
                                  } else {
                                    const reasonPrompt = window.prompt(
                                      'Raison du blocage (optionnel)',
                                      'Infraction aux règles de la communauté.'
                                    );
                                    if (reasonPrompt === null) {
                                      return;
                                    }
                                    setConfirmModal({
                                      open: true,
                                      meta: {
                                        title: 'Bloquer la publication',
                                        message: 'Confirme le blocage de cette publication ?',
                                        subtitle: 'Les utilisateurs ne pourront plus la consulter.',
                                        confirmLabel: 'Bloquer',
                                        tone: 'danger',
                                      },
                                      onConfirm: () =>
                                        executePostAction(post, 'block', {
                                          reason: reasonPrompt.trim() || undefined,
                                        }),
                                    });
                                  }
                                }}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition ${
                                  post.is_blocked
                                    ? 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10'
                                    : 'border-red-400/40 text-red-200 hover:bg-red-500/10'
                                } ${
                                  actionLoading
                                    ? 'opacity-70 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                              >
                                {actionLoading === 'block' || actionLoading === 'unblock' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : post.is_blocked ? (
                                  <Undo2 className="h-3.5 w-3.5" />
                                ) : (
                                  <ShieldBan className="h-3.5 w-3.5" />
                                )}
                                <span>{post.is_blocked ? 'Débloquer' : 'Bloquer'}</span>
                              </button>
                              <button
                                disabled={Boolean(actionLoading)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setConfirmModal({
                                    open: true,
                                    meta: {
                                      title: 'Supprimer la publication',
                                      message: 'Cette action est irréversible. Supprimer définitivement le post ?',
                                      confirmLabel: 'Supprimer',
                                      tone: 'danger',
                                    },
                                    onConfirm: () => executePostAction(post, 'delete'),
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition ${
                                  actionLoading
                                    ? 'border-white/15 text-white/40 cursor-not-allowed'
                                    : 'border-red-500/40 text-red-200 hover:bg-red-500/10'
                                }`}
                              >
                                {actionLoading === 'delete' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-[0_30px_80px_-45px_rgba(96,165,250,0.45)] space-y-5 min-h-[360px]">
            {selectedPostId === null ? (
              <div className="text-sm text-white/60">Sélectionne une publication pour afficher ses détails.</div>
            ) : postDetailLoading || !selectedPost ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-white/60" />
                    Post #{selectedPost.id}
                  </h3>
                  <p className="text-white/70 text-sm mt-2 whitespace-pre-wrap break-words">
                    {selectedPost.content || '—'}
                  </p>
                </div>

                <dl className="grid grid-cols-1 gap-3 text-sm text-white/70">
                  <div>
                    <dt className="text-white/50 text-xs uppercase tracking-[0.25em]">Auteur</dt>
                    <dd className="mt-1 text-white">
                      {selectedPost.user?.name ?? 'Anonyme'}
                      {selectedPost.is_anonymous ? ' (post anonyme)' : ''}
                    </dd>
                    <dd className="text-white/50 text-xs">{selectedPost.user?.email ?? 'Non divulgué'}</dd>
                  </div>
                  <div>
                    <dt className="text-white/50 text-xs uppercase tracking-[0.25em]">Topic</dt>
                    <dd className="mt-1 flex items-center gap-2 text-white">
                      <span
                        className="inline-flex h-3 w-3 rounded-full border border-white/20"
                        style={{ backgroundColor: selectedPost.topic?.color ?? '#6366f1' }}
                      />
                      {selectedPost.topic?.name ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/50 text-xs uppercase tracking-[0.25em]">Créé le</dt>
                    <dd className="mt-1 text-white">{formatDateTime(selectedPost.created_at ?? '')}</dd>
                  </div>
                </dl>

                <div className="space-y-3">
                  <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-white/60" />
                    Derniers commentaires ({selectedComments.length})
                  </h4>
                  {selectedComments.length === 0 ? (
                    <p className="text-white/60 text-xs">Aucun commentaire disponible.</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scroll">
                      {selectedComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-2xl border border-white/10 bg-white/10 p-3 text-xs text-white/80"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] text-white/50 mb-1">
                            <span>{comment.user?.name ?? 'Anonyme'}</span>
                            <span>{comment.relative_time ?? formatDateTime(comment.created_at ?? '')}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-white/80">{comment.content}</p>
                          {comment.is_blocked && (
                            <p className="mt-2 text-amber-200 text-[11px]">Commentaire bloqué · {comment.block_reason ?? 'raison non fournie'}</p>
                          )}
                          {comment.replies_preview.length > 0 && (
                            <div className="mt-2 space-y-1 text-[11px] text-white/50">
                              {comment.replies_preview.map((reply) => (
                                <div key={reply.id} className="pl-2 border-l border-white/15">
                                  <span className="text-white/70">{reply.user?.name ?? 'Anonyme'}:</span>{' '}
                                  {reply.content}
                                </div>
                              ))}
                              {comment.replies_count > comment.replies_preview.length && (
                                <span>… {comment.replies_count - comment.replies_preview.length} réponse(s) supplémentaire(s)</span>
                              )}
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {(() => {
                              const loading = commentActionLoading[comment.id];
                              if (comment.is_blocked) {
                                return (
                                  <button
                                    disabled={Boolean(loading)}
                                    onClick={() =>
                                      setConfirmModal({
                                        open: true,
                                        meta: {
                                          title: 'Débloquer le commentaire',
                                          message: 'Rendre ce commentaire à nouveau visible ?',
                                          confirmLabel: 'Débloquer',
                                          tone: 'info',
                                        },
                                        onConfirm: () => executeCommentAction(comment, 'unblock'),
                                      })
                                    }
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition ${
                                      loading
                                        ? 'border-white/15 text-white/40 cursor-not-allowed'
                                        : 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10'
                                    }`}
                                  >
                                    {loading === 'unblock' ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Undo2 className="h-3.5 w-3.5" />
                                    )}
                                    <span>Débloquer</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  disabled={Boolean(loading)}
                                  onClick={() => {
                                    const reasonPrompt = window.prompt(
                                      'Raison du blocage du commentaire (optionnel)',
                                      'Infraction aux règles de la communauté.'
                                    );
                                    if (reasonPrompt === null) {
                                      return;
                                    }
                                    setConfirmModal({
                                      open: true,
                                      meta: {
                                        title: 'Bloquer le commentaire',
                                        message: 'Masquer ce commentaire pour tous les utilisateurs ?',
                                        confirmLabel: 'Bloquer',
                                        tone: 'danger',
                                      },
                                      onConfirm: () =>
                                        executeCommentAction(comment, 'block', {
                                          reason: reasonPrompt.trim() || undefined,
                                        }),
                                    });
                                  }}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition ${
                                    loading
                                      ? 'border-white/15 text-white/40 cursor-not-allowed'
                                      : 'border-red-400/40 text-red-200 hover:bg-red-500/10'
                                  }`}
                                >
                                  {loading === 'block' ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldBan className="h-3.5 w-3.5" />
                                  )}
                                  <span>Bloquer</span>
                                </button>
                              );
                            })()}
                            <button
                              disabled={Boolean(commentActionLoading[comment.id])}
                              onClick={() =>
                                setConfirmModal({
                                  open: true,
                                  meta: {
                                    title: 'Supprimer le commentaire',
                                    message: 'Confirmer la suppression définitive de ce commentaire ?',
                                    confirmLabel: 'Supprimer',
                                    tone: 'danger',
                                  },
                                  onConfirm: () => executeCommentAction(comment, 'delete'),
                                })
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition ${
                                commentActionLoading[comment.id]
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : 'border-red-500/40 text-red-200 hover:bg-red-500/10'
                              }`}
                            >
                              {commentActionLoading[comment.id] === 'delete' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {postsData.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <span>
              Page {postsMeta.current_page} / {postsMeta.last_page} · {postsMeta.total} résultats
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={postsMeta.current_page <= 1}
                onClick={() => setPostsPage((prev) => Math.max(prev - 1, 1))}
                className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                  postsMeta.current_page <= 1
                    ? 'border-white/10 text-white/30 cursor-not-allowed'
                    : 'border-white/20 text-white/70 hover:text-white hover:border-white/40'
                }`}
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={postsMeta.current_page >= postsMeta.last_page}
                onClick={() =>
                  setPostsPage((prev) =>
                    postsMeta.current_page >= postsMeta.last_page ? prev : prev + 1
                  )
                }
                className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                  postsMeta.current_page >= postsMeta.last_page
                    ? 'border-white/10 text-white/30 cursor-not-allowed'
                    : 'border-white/20 text-white/70 hover:text-white hover:border-white/40'
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUsers = () => {
    const handleSearchSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      setUsersPage(1);
      setUserSearch(userSearchInput.trim());
    };

    const getStatusBadge = (row: AdminUserRow) => {
      if (row.is_banned) {
        return {
          label: 'suspendu',
          className: 'border-red-400/40 text-red-200 bg-red-500/10',
        };
      }

      if (row.is_moderator_verified || row.role === 'moderator') {
        return {
          label: 'verifié',
          className: 'border-sky-400/40 text-sky-200 bg-sky-500/10',
        };
      }

      return {
        label: 'actif',
        className: 'border-emerald-400/40 text-emerald-200 bg-emerald-500/10',
      };
    };

    const isActionLoading = (account: AdminUserRow) => Boolean(usersActionLoading[account.id]);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold">Gestion des utilisateurs</h2>
            <p className="text-white/60 text-sm">Statuts, sanctions & rôles privilégiés.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-300/40 rounded-xl text-sm text-emerald-100 hover:bg-emerald-500/30">
              <Plus className="h-4 w-4" />
              Inviter un utilisateur
            </button>
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={userSearchInput}
                  onChange={(event) => setUserSearchInput(event.target.value)}
                  placeholder="Chercher (pseudo, email, nom)"
                  className="pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white/80 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/40"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/15"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </button>
            </form>
            <button
              type="button"
              onClick={() => fetchUsers(usersPage, userSearch)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/15"
            >
              <ArrowUpRight className="h-4 w-4" />
              Rafraîchir
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl">
          {usersLoading && usersData.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            </div>
          ) : usersData.length === 0 ? (
            <div className="py-12 text-center text-white/60 text-sm">
              {errorModal.open ? errorModal.message : 'Aucun utilisateur à afficher pour le moment.'}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-[0.2em]">
                  <tr>
                    <th className="px-5 py-4 text-left">Pseudo</th>
                    <th className="px-5 py-4 text-left">Rôle</th>
                    <th className="px-5 py-4 text-left">Statut</th>
                    <th className="px-5 py-4 text-left">Posts</th>
                    <th className="px-5 py-4 text-left">Commentaires</th>
                    <th className="px-5 py-4 text-left">Inscription</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {usersData.map((account) => {
                    const badge = getStatusBadge(account);
                    const displayName = account.username || account.name || account.email || `user-${account.id}`;

                    return (
                      <tr key={account.id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4 font-semibold text-white/90">{displayName}</td>
                        <td className="px-5 py-4 text-white/70 uppercase tracking-widest text-[11px]">{account.role}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest border ${badge.className}`}>
                            <span className="inline-block h-2 w-2 rounded-full bg-current" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">{account.posts_count}</td>
                        <td className="px-5 py-4">{account.comments_count}</td>
                        <td className="px-5 py-4 whitespace-nowrap">{formatDate(account.created_at)}</td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white/70 hover:text-white hover:border-white/40"
                            disabled={isActionLoading(account)}
                          >
                            Détails
                          </button>
                          {account.is_banned ? (
                            <button
                              onClick={() =>
                                handleUserAction(account, `/admin/users/${account.id}/unsuspend`, {
                                  successMessage: 'Utilisateur réactivé avec succès.',
                                  confirmMessage: 'Réactiver cet utilisateur ? Il pourra de nouveau poster et commenter.',
                                  confirmTitle: 'Réactivation utilisateur',
                                  confirmSubtitle: 'Une fois confirmée, la suspension est levée immédiatement.',
                                  confirmLabel: 'Réactiver',
                                  confirmTone: 'info',
                                })
                              }
                              disabled={isActionLoading(account)}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                isActionLoading(account)
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10'
                              }`}
                            >
                              {isActionLoading(account) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Réactiver'}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleUserAction(account, `/admin/users/${account.id}/suspend`, {
                                  successMessage: 'Utilisateur suspendu.',
                                  confirmMessage: 'Suspendre cet utilisateur ? Il perdra l’accès immédiat.',
                                  confirmTitle: 'Suspension immédiate',
                                  confirmSubtitle: 'Cette action bloque l’accès et masque les interactions en cours.',
                                  confirmLabel: 'Suspendre',
                                  confirmTone: 'danger',
                                  body: { reason: 'Suspendu depuis le panneau admin.' },
                                })
                              }
                              disabled={isActionLoading(account) || account.role === 'admin'}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                isActionLoading(account) || account.role === 'admin'
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : 'border-red-500/40 text-red-200 hover:bg-red-500/10'
                              }`}
                            >
                              {isActionLoading(account) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Suspendre'}
                            </button>
                          )}
                          {account.role === 'admin' ? null : account.role === 'moderator' ? (
                            <button
                              onClick={() =>
                                handleUserAction(account, `/admin/users/${account.id}/demote`, {
                                  successMessage: 'Statut modérateur retiré.',
                                  confirmMessage: 'Retirer le rôle modérateur ? L’utilisateur redeviendra standard.',
                                  confirmTitle: 'Retirer le statut modérateur',
                                  confirmSubtitle: 'Il ne pourra plus traiter les tickets ou actions de modération.',
                                  confirmLabel: 'Retirer le rôle',
                                  confirmTone: 'warning',
                                })
                              }
                              disabled={isActionLoading(account)}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                isActionLoading(account)
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : 'border-amber-400/40 text-amber-200 hover:bg-amber-500/10'
                              }`}
                            >
                              {isActionLoading(account) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Retirer rôle'}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleUserAction(account, `/admin/users/${account.id}/promote`, {
                                  successMessage: 'Utilisateur promu modérateur.',
                                  confirmMessage: 'Promouvoir cet utilisateur en modérateur vérifié ?',
                                  confirmTitle: 'Promotion en modérateur',
                                  confirmSubtitle: 'Nous ajouterons les privilèges et un badge certifié.',
                                  confirmLabel: 'Promouvoir',
                                  confirmTone: 'info',
                                })
                              }
                              disabled={isActionLoading(account)}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                isActionLoading(account)
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : 'border-sky-400/40 text-sky-200 hover:bg-sky-500/10'
                              }`}
                            >
                              {isActionLoading(account) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Promouvoir'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {usersLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white/5 border-t border-white/10 text-xs text-white/60">
                <div>
                  Page <span className="text-white font-semibold">{usersPagination.current_page}</span> / {usersPagination.last_page}
                  <span className="ml-2">•</span>
                  <span className="ml-2">{usersPagination.total} utilisateurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={usersPage <= 1 || usersLoading}
                    onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                    className={`px-3 py-1.5 rounded-lg border text-white/70 hover:text-white hover:border-white/40 ${
                      usersPage <= 1 || usersLoading ? 'opacity-50 cursor-not-allowed border-white/10' : 'border-white/20'
                    }`}
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    disabled={usersPage >= usersPagination.last_page || usersLoading}
                    onClick={() => setUsersPage((prev) => Math.min(usersPagination.last_page, prev + 1))}
                    className={`px-3 py-1.5 rounded-lg border text-white/70 hover:text-white hover:border-white/40 ${
                      usersPage >= usersPagination.last_page || usersLoading ? 'opacity-50 cursor-not-allowed border-white/10' : 'border-white/20'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderModerators = () => {
    const actionIsLoading = (id: number) => moderatorActionLoading === id;

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold">Coordination des modérateurs</h2>
            <p className="text-white/60 text-sm">Approuve les candidatures et suis les membres actifs.</p>
          </div>
          <button
            type="button"
            onClick={fetchModerators}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/15"
          >
            <ArrowUpRight className="h-4 w-4" />
            Rafraîchir
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_30px_90px_-50px_rgba(236,72,153,0.55)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Demandes en attente</h3>
              <span className="text-white/60 text-xs uppercase tracking-[0.3em]">{moderatorRequests.length} à examiner</span>
            </div>

            {moderatorsLoading && moderatorRequests.length === 0 ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : moderatorRequests.length === 0 ? (
              <div className="py-10 text-center text-white/60 text-sm">
                Aucun dossier en attente. Les prochaines candidatures apparaîtront ici.
              </div>
            ) : (
              <ul className="space-y-4 text-sm text-white/80">
                {moderatorRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-col gap-4 bg-white/10 border border-white/15 rounded-2xl px-5 py-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-white font-semibold text-base">{request.full_name || request.username || `Candidat #${request.id}`}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                            <Clock className="h-3.5 w-3.5" />
                            Déposé le {formatDateTime(request.submitted_at)}
                          </span>
                          {request.availability && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                              <ShieldQuestion className="h-3.5 w-3.5" />
                              {request.availability}
                            </span>
                          )}
                          {request.timezone && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                              <Globe className="h-3.5 w-3.5" />
                              {request.timezone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModeratorAction(request, 'approve')}
                          disabled={actionIsLoading(request.id)}
                          className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                            actionIsLoading(request.id)
                              ? 'border-white/15 text-white/40 cursor-not-allowed'
                              : 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10'
                          }`}
                        >
                          {actionIsLoading(request.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Approuver'}
                        </button>
                        <button
                          onClick={() => handleModeratorAction(request, 'reject')}
                          disabled={actionIsLoading(request.id)}
                          className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                            actionIsLoading(request.id)
                              ? 'border-white/15 text-white/40 cursor-not-allowed'
                              : 'border-red-500/40 text-red-200 hover:bg-red-500/10'
                          }`}
                        >
                          {actionIsLoading(request.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refuser'}
                        </button>
                      </div>
                    </div>
                    {request.motivation && (
                      <p className="text-xs text-white/60 italic leading-relaxed">“{request.motivation}”</p>
                    )}
                    {request.languages.length > 0 && (
                      <div className="text-xs text-white/50 flex flex-wrap gap-2">
                        {request.languages.map((lang) => (
                          <span key={lang} className="px-3 py-1 rounded-full border border-white/15 bg-white/5">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_30px_90px_-50px_rgba(59,130,246,0.45)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Modérateurs actifs</h3>
              <span className="text-white/60 text-xs uppercase tracking-[0.3em]">{activeModerators.length} profils</span>
            </div>

            {moderatorsLoading && activeModerators.length === 0 ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : activeModerators.length === 0 ? (
              <div className="py-10 text-center text-white/60 text-sm">
                Aucun modérateur actif pour le moment.
              </div>
            ) : (
              <ul className="space-y-4 text-sm text-white/80 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                {activeModerators.map((moderator) => (
                  <li
                    key={moderator.id}
                    className="flex flex-col gap-3 bg-white/10 border border-white/15 rounded-2xl px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 text-sm font-semibold uppercase">
                          {moderator.username?.slice(0, 2) || 'MO'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{moderator.username ?? `modérateur-${moderator.id}`}</p>
                          <p className="text-white/50 text-xs">{moderator.email || 'Email non renseigné'}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs text-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Vérifié le {moderator.moderator_verified_at ? formatDate(moderator.moderator_verified_at) : '—'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/15 bg-white/5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {moderator.comments_count} commentaires modérés
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/15 bg-white/5">
                        <Users className="h-3.5 w-3.5" />
                        {moderator.posts_count} posts traités
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_30px_90px_-55px_rgba(250,204,21,0.5)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Tâches de coordination</h3>
            <span className="text-white/60 text-xs uppercase tracking-[0.3em]">à planifier</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              {
                title: 'Synchroniser les briefings',
                icon: MessageSquare,
                description: 'Préparer le point hebdomadaire avec les modérateurs seniors.',
              },
              {
                title: 'Analyser les meilleures pratiques',
                icon: BookMarked,
                description: 'Compiler les retours utilisateurs et les guidelines à renforcer.',
              },
              {
                title: 'Planifier la prochaine cohorte',
                icon: Crown,
                description: 'Identifier les candidats prometteurs pour le prochain batch.',
              },
            ].map(({ title, icon: Icon, description }) => (
              <div key={title} className="flex flex-col gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-white">{title}</p>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">{description}</p>
                <button className="self-start text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white">Planifier</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCategories = () => {
    const isFormValid = Boolean(topicForm.name.trim());

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold">Architecture des catégories</h2>
            <p className="text-white/60 text-sm">
              Organise les espaces thématiques, ajuste leurs règles et bloque les topics sensibles.
            </p>
          </div>
          <button
            onClick={openCreateTopicForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/25 border border-purple-400/40 rounded-xl text-sm text-purple-100 hover:bg-purple-500/35"
          >
            <Plus className="h-4 w-4" />
            Nouvelle catégorie
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl">
            {topicsLoading && topicsData.length === 0 ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : topicsData.length === 0 ? (
              <div className="py-12 text-center text-white/60 text-sm">
                Aucune catégorie à afficher pour le moment.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-[0.2em]">
                  <tr>
                    <th className="px-5 py-4 text-left">Nom</th>
                    <th className="px-5 py-4 text-left">Statut</th>
                    <th className="px-5 py-4 text-left">Modération</th>
                    <th className="px-5 py-4 text-left">Posts</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {topicsData.map((topic) => {
                    const blocked = Boolean(topic.is_blocked);
                    const actionLoading = topicActionLoading[topic.id];
                    return (
                      <tr key={topic.id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex h-3 w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: topic.color ?? '#6366f1' }}
                              />
                              <span className="font-semibold text-white/90">{topic.name}</span>
                              <span className="text-xs text-white/40">#{topic.slug}</span>
                            </div>
                            {topic.description && (
                              <p className="text-xs text-white/50 line-clamp-2">{topic.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest border ${
                              blocked
                                ? 'border-red-400/40 text-red-200 bg-red-500/10'
                                : 'border-emerald-400/40 text-emerald-200 bg-emerald-500/10'
                            }`}
                          >
                            <span className="inline-block h-2 w-2 rounded-full bg-current" />
                            {blocked ? 'bloqué' : 'actif'}
                          </span>
                          {blocked && topic.block_reason && (
                            <p className="mt-2 text-[11px] text-white/50 line-clamp-1">
                              Raison: {topic.block_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 space-y-1">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-[11px] uppercase tracking-widest border ${
                              topic.is_sensitive
                                ? 'border-amber-400/40 text-amber-200 bg-amber-500/10'
                                : 'border-white/15 text-white/60'
                            }`}
                          >
                            Sensible: {topic.is_sensitive ? 'oui' : 'non'}
                          </span>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-[11px] uppercase tracking-widest border ${
                              topic.requires_moderation
                                ? 'border-sky-400/40 text-sky-200 bg-sky-500/10'
                                : 'border-white/15 text-white/60'
                            }`}
                          >
                            Modération: {topic.requires_moderation ? 'renforcée' : 'standard'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-white/80">{topic.posts_count}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleToggleTopicBlock(topic)}
                              disabled={Boolean(actionLoading)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1 transition ${
                                actionLoading
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : blocked
                                      ? 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10'
                                      : 'border-red-400/40 text-red-200 hover:bg-red-500/10'
                              }`}
                            >
                              {actionLoading === 'toggle' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : blocked ? (
                                <Undo2 className="h-3.5 w-3.5" />
                              ) : (
                                <ShieldBan className="h-3.5 w-3.5" />
                              )}
                              <span>{blocked ? 'Débloquer' : 'Bloquer'}</span>
                            </button>
                            <button
                              onClick={() => openEditTopicForm(topic)}
                              className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white/70 hover:text-white hover:border-white/40 inline-flex items-center gap-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleTopicDelete(topic)}
                              disabled={Boolean(actionLoading)}
                              className={`px-3 py-1.5 rounded-lg border text-xs inline-flex items-center gap-1 transition ${
                                actionLoading
                                  ? 'border-white/15 text-white/40 cursor-not-allowed'
                                  : 'border-red-500/40 text-red-200 hover:bg-red-500/10'
                              }`}
                            >
                              {actionLoading === 'delete' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-[0_30px_80px_-45px_rgba(168,85,247,0.55)] space-y-5">
            {topicFormOpen ? (
              <form className="space-y-4" onSubmit={handleTopicSubmit}>
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-lg font-semibold">
                    {topicFormMode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetTopicForm}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-white/50">Nom</span>
                    <input
                      type="text"
                      value={topicForm.name}
                      onChange={(event) => setTopicForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                      placeholder="Ex: Santé mentale"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-white/50">Slug</span>
                    <input
                      type="text"
                      value={topicForm.slug}
                      onChange={(event) => setTopicForm((prev) => ({ ...prev, slug: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                      placeholder="Ex: sante-mentale"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-white/50">Description</span>
                    <textarea
                      value={topicForm.description}
                      onChange={(event) => setTopicForm((prev) => ({ ...prev, description: event.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                      placeholder="Résumé de la catégorie"
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs uppercase tracking-widest text-white/50">Icône</span>
                      <input
                        type="text"
                        value={topicForm.icon}
                        onChange={(event) => setTopicForm((prev) => ({ ...prev, icon: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        placeholder="Emoji ou URL"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs uppercase tracking-widest text-white/50">Couleur</span>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={topicForm.color}
                          onChange={(event) => setTopicForm((prev) => ({ ...prev, color: event.target.value }))}
                          className="h-10 w-16 rounded border border-white/20 bg-white/10"
                        />
                        <input
                          type="text"
                          value={topicForm.color}
                          onChange={(event) => setTopicForm((prev) => ({ ...prev, color: event.target.value }))}
                          className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                          placeholder="#6366f1"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-white/70">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={topicForm.is_sensitive}
                        onChange={(event) => setTopicForm((prev) => ({ ...prev, is_sensitive: event.target.checked }))}
                        className="rounded border-white/20 bg-transparent text-purple-400 focus:ring-purple-400/40"
                      />
                      Contenu sensible (surveillance accrue)
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={topicForm.requires_moderation}
                        onChange={(event) =>
                          setTopicForm((prev) => ({ ...prev, requires_moderation: event.target.checked }))
                        }
                        className="rounded border-white/20 bg-transparent text-purple-400 focus:ring-purple-400/40"
                      />
                      Modération renforcée obligatoire
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-white/40">
                    {topicFormMode === 'create'
                      ? 'Crée une nouvelle thématique accessible immédiatement.'
                      : `Dernière mise à jour : ${formatDateTime(topicsData.find((t) => t.id === topicForm.id)?.updated_at ?? new Date().toISOString())}`}
                  </span>
                  <button
                    type="submit"
                    disabled={!isFormValid || topicSubmitting}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      !isFormValid || topicSubmitting
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    {topicSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="hidden" />}
                    <span>{topicFormMode === 'create' ? 'Créer la catégorie' : 'Enregistrer les modifications'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm text-white/70">
                <h3 className="text-white text-lg font-semibold">Configuration rapide</h3>
                <p>
                  Sélectionne une catégorie pour la modifier ou crée une nouvelle entrée. Utilise le bouton
                  “Nouvelle catégorie” pour déployer le formulaire.
                </p>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li>• Bloquer une catégorie empêche toute publication.</li>
                  <li>• Une couleur permet de la distinguer visuellement dans le feed.</li>
                  <li>• Les options “sensible” et “modération renforcée” aident les modérateurs.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Payments Tab - Direct integration of AdminPayments component
  const renderPayments = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              💰 Gestion des Paiements Wave
            </h2>
            <p className="text-white/60 mt-1">
              Vérifiez et validez les paiements en attente
            </p>
          </div>
        </div>
        
        {/* Intégration directe du composant AdminPayments pour les notifications */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <AdminPayments />
        </div>
      </div>
    );
  };

  // Black Rooms Tab
  const renderBlackRooms = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              🔐 Sama Chambres Noires
            </h2>
            <p className="text-white/60 mt-1">
              Modérez les chambres noires éphémères créées par les utilisateurs
            </p>
          </div>
          <Link
            to="/admin/black-rooms"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Voir toutes les chambres →
          </Link>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="text-center py-12">
            <Lock className="w-16 h-16 text-purple-400/40 mx-auto mb-4" />
            <p className="text-white/70 text-lg">Accédez au dashboard complet pour gérer les chambres</p>
            <Link
              to="/admin/black-rooms"
              className="inline-block mt-6 px-6 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-xl hover:bg-purple-500/30 transition"
            >
              Ouvrir le dashboard 🔐
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPayments();
      case 'black-rooms':
        return renderBlackRooms();
      case 'posts':
        return renderPosts();
      case 'users':
        return renderUsers();
      case 'moderators':
        return renderModerators();
      case 'categories':
        return renderCategories();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[75vh] pb-20 space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-purple-500/20 via-indigo-600/20 to-cyan-500/20 px-10 py-12 shadow-[0_60px_160px_-60px_rgba(56,189,248,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.2),transparent_40%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white/90">
              <Crown className="h-4 w-4 text-amber-300" />
              Portail Administrateur
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Quartier général <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300">/anonymous</span>
              </h1>
              <p className="mt-3 text-white/80 max-w-2xl">
                Organise, sécurise et dynamise l’écosystème social anonyme. Accède à toutes les commandes critiques depuis un unique hub immersif.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <MessageSquare className="h-4 w-4 text-pink-200" />
                1 482 posts aujourd’hui
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                38 incidents en cours
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white/10 border border-white/15 backdrop-blur-2xl rounded-3xl px-4 py-3 flex flex-wrap items-center gap-2">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col items-start px-4 py-3 rounded-2xl border transition relative ${
              activeTab === tab.key
                ? 'border-white/40 bg-white/20 text-white'
                : 'border-transparent text-white/60 hover:border-white/20 hover:text-white'
            }`}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              {tab.label}
              {tab.key === 'payments' && pendingPaymentsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingPaymentsCount}
                </span>
              )}
            </span>
            <span className="text-xs text-white/50">{tab.description}</span>
          </button>
        ))}
        <Link
          to="/admin/activation"
          className="ml-auto px-4 py-2 rounded-2xl border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10 text-sm"
          title="Activer un utilisateur dans une Chambre"
        >
          Activation Chambres
        </Link>
      </nav>

      <section className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-2xl p-8 shadow-[0_45px_140px_-60px_rgba(59,130,246,0.35)]">
        {renderContent()}
      </section>

      <SuccessModal
        isOpen={successModal.open}
        message={successModal.message || 'Action réalisée avec succès.'}
        subtitle={successModal.subtitle}
        title="Opération confirmée"
        duration={2400}
        onClose={() => setSuccessModal((prev) => ({ ...prev, open: false }))}
      />

      <ErrorModal
        isOpen={errorModal.open}
        message={errorModal.message || 'Une erreur est survenue.'}
        subtitle={errorModal.subtitle}
        title="Opération refusée"
        onClose={() => setErrorModal((prev) => ({ ...prev, open: false }))}
      />

      <ConfirmActionModal
        isOpen={confirmModal.open}
        title={confirmModal.meta?.title ?? 'Confirmer l’action'}
        message={confirmModal.meta?.message ?? ''}
        subtitle={confirmModal.meta?.subtitle}
        confirmLabel={confirmModal.meta?.confirmLabel ?? 'Confirmer'}
        cancelLabel="Annuler"
        tone={confirmModal.meta?.tone ?? 'warning'}
        loading={false}
        onCancel={() => setConfirmModal({ open: false })}
        onConfirm={() => {
          const callback = confirmModal.onConfirm;
          setConfirmModal({ open: false });
          callback?.();
        }}
      />
    </div>
  );
}
