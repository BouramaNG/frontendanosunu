import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import BottomNav from './BottomNav';
import {
  Bell,
  Loader2,
  Check,
  Heart,
  MessageCircle,
  Reply,
  ShieldAlert,
  Unlock,
  BellRing,
  Trash2,
  AlertTriangle,
} from '@/lib/icons';
import { useNotificationsStore } from '../store/notificationsStore';
import type { NotificationItem } from '../types';
import { cn, formatDate } from '../lib/utils';
import ConfirmActionModal from './ConfirmActionModal';
import api from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isMarkingAll, setMarkingAll] = useState(false);
  const [isIdentityModalOpen, setIdentityModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const {
    items,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribe,
  } = useNotificationsStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      void fetchNotifications({ force: false });
      void subscribe(user.id);
    }
  }, [fetchNotifications, subscribe, isAuthenticated, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Fermer le dropdown utilisateur si on clique ailleurs
      if (!t.closest('[data-user-dropdown]')) {
        setDropdownOpen(false);
      }
      // Fermer les notifications si on clique ailleurs (mais pas sur le bouton cloche)
      if (!t.closest('[data-notifications-dropdown]') && !t.closest('button[aria-label="Notifications"]')) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (isNotificationsOpen && isAuthenticated && user) {
      void fetchNotifications({ force: true });
    }
  }, [isNotificationsOpen, fetchNotifications, isAuthenticated, user]);

  const latestNotifications = useMemo(() => items.slice(0, 6), [items]);

  // fun: random country message shown to user, persisted for session
  const COUNTRIES = [
    'France','Belgique','Suisse','Canada','États-Unis','Mexique','Brésil','Argentine','Chili','Colombie','Pérou','Venezuela','Uruguay','Paraguay','Bolivie',
    'Espagne','Portugal','Italie','Allemagne','Pays-Bas','Luxembourg','Autriche','Pologne','Tchéquie','Slovaquie','Hongrie','Roumanie','Bulgarie','Grèce','Croatie','Slovénie','Serbie','Bosnie-Herzégovine','Macédoine du Nord','Albanie','Irlande','Royaume-Uni','Islande','Norvège','Suède','Finlande','Danemark','Estonie','Lettonie','Lituanie','Ukraine','Moldavie',
    'Maroc','Algérie','Tunisie','Libye','Égypte','Sénégal','Côte d’Ivoire','Ghana','Nigeria','Cameroun','Congo','RDC','Gabon','Tchad','Niger','Mali','Burkina Faso','Guinée','Sierra Leone','Libéria','Bénin','Togo','Rwanda','Burundi','Kenya','Tanzanie','Ouganda','Éthiopie','Somalie','Djibouti','Érythrée','Soudan','Afrique du Sud','Botswana','Namibie','Zimbabwe','Zambie','Mozambique','Madagascar',
    'Turquie','Géorgie','Arménie','Azerbaïdjan','Russie','Kazakhstan','Ouzbékistan','Turkménistan','Tadjikistan','Kirghizistan',
    'Inde','Pakistan','Bangladesh','Sri Lanka','Népal','Bhoutan','Maldives','Chine','Mongolie','Japon','Corée du Sud','Corée du Nord','Taïwan','Hong Kong','Singapour','Malaisie','Indonésie','Philippines','Thaïlande','Vietnam','Cambodge','Laos','Myanmar',
    'Australie','Nouvelle-Zélande'
  ];
  const [funCountry, setFunCountry] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const sessionCountdown = useMemo(() => {
    if (remainingMs === null) return null;
    const totalMin = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [remainingMs]);

  useEffect(() => {
    try {
      const existing = sessionStorage.getItem('anon_country');
      if (existing) {
        setFunCountry(existing);
        return;
      }
      const pick = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      sessionStorage.setItem('anon_country', pick);
      setFunCountry(pick);
    } catch (e) {
      // sessionStorage may be unavailable in some environments
    }
  }, []);

  // Session expiry countdown (4 hours from auth_login_at)
  useEffect(() => {
    const AUTO_MS = 4 * 60 * 60 * 1000;
    const updateRemaining = () => {
      try {
        const loginAtStr = localStorage.getItem('auth_login_at');
        if (!loginAtStr) {
          setRemainingMs(null);
          return;
        }
        const loginAt = parseInt(loginAtStr, 10);
        if (Number.isNaN(loginAt)) {
          setRemainingMs(null);
          return;
        }
        const now = Date.now();
        const remaining = Math.max(0, loginAt + AUTO_MS - now);
        setRemainingMs(remaining);
      } catch (_) {
        setRemainingMs(null);
      }
    };
    updateRemaining();
    const id = window.setInterval(updateRemaining, 30000);
    return () => clearInterval(id);
  }, []);

  const getNotificationDisplay = (notification: NotificationItem) => {
    const actorName = notification.payload?.actor?.name ?? 'Un utilisateur anonyme';
    const targetName = notification.payload?.target_user?.name ?? 'un membre de la communauté';
    const postExcerpt = notification.payload?.post_excerpt ?? '';
    const commentExcerpt = notification.payload?.comment_excerpt ?? '';
    const reason = notification.payload?.reason ?? '';
    const reporterName = notification.payload?.reporter?.name ?? 'Un membre de la communauté';

    switch (notification.type) {
      case 'post.liked':
        return {
          title: `${actorName} a aimé votre publication`,
          description: postExcerpt || 'Une de vos publications vient de recevoir un like.',
          accent: 'from-pink-500/80 to-red-500/80',
          icon: <Heart className="h-4 w-4 text-white" />,
        };
      case 'post.commented':
        return {
          title: `${actorName} a commenté votre publication`,
          description: commentExcerpt || 'Un nouveau commentaire vient d’arriver.',
          accent: 'from-indigo-500/80 to-purple-500/80',
          icon: <MessageCircle className="h-4 w-4 text-white" />,
        };
      case 'comment.replied':
        return {
          title: `${actorName} a répondu à votre commentaire`,
          description: commentExcerpt || 'Nouvelle réponse à votre commentaire.',
          accent: 'from-emerald-500/80 to-teal-500/80',
          icon: <Reply className="h-4 w-4 text-white" />,
        };
      case 'comment.liked':
        return {
          title: `${actorName} a aimé votre commentaire`,
          description: commentExcerpt || 'Votre commentaire gagne en popularité.',
          accent: 'from-amber-500/80 to-orange-500/80',
          icon: <Heart className="h-4 w-4 text-white" />,
        };
      case 'post.blocked':
        return {
          title: `Publication bloquée par ${actorName}`,
          description: reason || 'La publication est temporairement masquée.',
          accent: 'from-rose-600/80 to-red-600/80',
          icon: <ShieldAlert className="h-4 w-4 text-white" />,
        };
      case 'post.blocked.actor':
        return {
          title: `Vous avez bloqué la publication de ${targetName}`,
          description: reason || 'La publication du membre est désormais masquée.',
          accent: 'from-rose-500/80 to-red-500/80',
          icon: <ShieldAlert className="h-4 w-4 text-white" />,
        };
      case 'post.unblocked':
        return {
          title: `Publication débloquée par ${actorName}`,
          description: postExcerpt || 'Ta publication redevient visible.',
          accent: 'from-sky-500/80 to-cyan-500/80',
          icon: <Unlock className="h-4 w-4 text-white" />,
        };
      case 'post.unblocked.actor':
        return {
          title: `Vous avez débloqué la publication de ${targetName}`,
          description: postExcerpt || 'La publication du membre est à nouveau visible.',
          accent: 'from-blue-500/80 to-sky-500/80',
          icon: <Unlock className="h-4 w-4 text-white" />,
        };
      case 'post.deleted':
        return {
          title: `Publication supprimée par ${actorName}`,
          description: postExcerpt || 'Ta publication a été retirée de la plateforme.',
          accent: 'from-red-600/80 to-rose-600/80',
          icon: <Trash2 className="h-4 w-4 text-white" />,
        };
      case 'post.deleted.actor':
        return {
          title: `Vous avez supprimé la publication de ${targetName}`,
          description: postExcerpt || 'La publication du membre a été supprimée.',
          accent: 'from-rose-500/80 to-pink-500/80',
          icon: <Trash2 className="h-4 w-4 text-white" />,
        };
      case 'comment.blocked':
        return {
          title: `Commentaire bloqué par ${actorName}`,
          description: reason || 'Ton commentaire est actuellement masqué.',
          accent: 'from-fuchsia-600/80 to-purple-600/80',
          icon: <ShieldAlert className="h-4 w-4 text-white" />,
        };
      case 'comment.blocked.actor':
        return {
          title: `Vous avez bloqué le commentaire de ${targetName}`,
          description: reason || 'Le commentaire du membre est masqué.',
          accent: 'from-purple-500/80 to-fuchsia-500/80',
          icon: <ShieldAlert className="h-4 w-4 text-white" />,
        };
      case 'comment.deleted':
        return {
          title: `Commentaire supprimé par ${actorName}`,
          description: commentExcerpt || 'Ton commentaire a été retiré de la discussion.',
          accent: 'from-orange-500/80 to-red-500/80',
          icon: <Trash2 className="h-4 w-4 text-white" />,
        };
      case 'comment.deleted.actor':
        return {
          title: `Vous avez supprimé le commentaire de ${targetName}`,
          description: commentExcerpt || 'Le commentaire du membre a été supprimé.',
          accent: 'from-amber-500/80 to-orange-500/80',
          icon: <Trash2 className="h-4 w-4 text-white" />,
        };
      case 'post.report.submitted':
        return {
          title: 'Signalement envoyé',
          description: `Merci pour ta vigilance${postExcerpt ? ` : "${postExcerpt}"` : ''}.` ,
          accent: 'from-blue-500/80 to-indigo-500/80',
          icon: <ShieldAlert className="h-4 w-4 text-white" />,
        };
      case 'post.report.auto_removed':
        return {
          title: 'Publication retirée suite aux signalements',
          description: postExcerpt || 'Le contenu a été automatiquement supprimé.' ,
          accent: 'from-red-500/80 to-rose-500/80',
          icon: <Trash2 className="h-4 w-4 text-white" />,
        };
      case 'post.warning':
        return {
          title: 'Avertissement concernant une publication',
          description: reason || postExcerpt || 'Veuillez respecter les règles de la communauté.',
          accent: 'from-yellow-500/80 to-amber-500/80',
          icon: <ShieldAlert className="h-4 w-4 text-white" />,
        };
      case 'post.report.received':
        return {
          title: `${reporterName} a signalé votre publication`,
          description:
            reason ||
            (postExcerpt ? `"${postExcerpt}"` : 'Un rapport a été déposé sur votre contenu.'),
          accent: 'from-orange-500/80 to-amber-500/80',
          icon: <AlertTriangle className="h-4 w-4 text-white" />,
        };
      default:
        return {
          title: notification.type.replace('.', ' • '),
          description:
            commentExcerpt ||
            postExcerpt ||
            'Activité récente sur un post ou un commentaire.',
          accent: 'from-purple-500/70 to-pink-500/70',
          icon: <BellRing className="h-4 w-4 text-white" />,
        };
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleToggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
    // Fermer les notifications quand on ouvre le profil
    setNotificationsOpen(false);
  };

  const handleToggleNotifications = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setNotificationsOpen((prev) => !prev);
    // Fermer le profil quand on ouvre les notifications
    setDropdownOpen(false);
  };

  const handleNavigate = (path: string) => {
    setMobileNavOpen(false);
    navigate(path);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await markAllAsRead();
    setMarkingAll(false);
  };

  const handleOpenIdentityModal = () => {
    setIdentityError(null);
    setIdentityModalOpen(true);
  };

  const handleConfirmIdentityDeletion = async () => {
    setIdentityError(null);
    setIdentityLoading(true);
    try {
      await api.delete('/user/identity', { data: { confirm: true } });

      try {
        await logout();
      } catch (logoutError) {
        console.warn('Logout après suppression identité', logoutError);
      }

      setIdentityModalOpen(false);
      setDropdownOpen(false);
      navigate('/login', { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? 'Impossible de supprimer votre identité virtuelle pour le moment.';
      setIdentityError(message);
    } finally {
      setIdentityLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #831843 100%)' }}>
      {/* Navigation - EXACTEMENT comme les captures */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-400 via-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/40"></div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">AnoSUNU</span>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-white/60">S'exprimer Libre&nbsp;ment</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-6 relative">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/feed"
                    className="text-white/80 hover:text-white transition font-medium flex items-center gap-2"
                  >
                    <span>🗣️</span>
                    <span>Espace Libre</span>
                    <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-[9px] text-green-300 font-semibold">FREE</span>
                  </Link>
                  <Link
                    to="/chambres-noires"
                    className="flex items-center gap-2 text-white/80 hover:text-white transition font-medium relative group"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-purple-600 text-[12px] shadow-md shadow-fuchsia-500/40 relative">
                      🔒
                      {/* Badge Premium sur desktop */}
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[8px] font-bold text-white px-1 rounded-full border border-amber-300/50 shadow-lg">
                        PRO
                      </span>
                    </span>
                    <span>Chambres Noires</span>
                    {/* Badge Premium animé au hover */}
                    <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full border border-amber-300/50 shadow-lg animate-pulse">
                        Premium
                      </span>
                    </span>
                  </Link>
                  {!user.is_moderator_verified && user.role !== 'admin' && (
                    <Link
                      to="/devenir-moderateur"
                      className="text-white/80 hover:text-white transition font-medium"
                    >
                      Devenir Modérateur
                    </Link>
                  )}

                  <div className="relative" data-notifications-dropdown>
                    <button
                      onClick={handleToggleNotifications}
                      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition"
                      aria-label="Notifications"
                      aria-expanded={isNotificationsOpen}
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-500 text-[11px] font-semibold text-white px-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-lg shadow-purple-900/40 z-50">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <div>
                            <p className="text-white text-sm font-semibold">Notifications</p>
                            <p className="text-xs text-white/60">Dernières activités anonymes</p>
                          </div>
                          <button
                            onClick={handleMarkAll}
                            disabled={isMarkingAll || unreadCount === 0}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition ${
                              unreadCount === 0
                                ? 'border-white/15 text-white/30 cursor-not-allowed'
                                : 'border-white/20 text-white/70 hover:text-white hover:border-white/40'
                            }`}
                          >
                            {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Tout lire
                          </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                          {loading && items.length === 0 ? (
                            <div className="py-6 flex flex-col items-center gap-2 text-white/60 text-sm">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Chargement des notifications…
                            </div>
                          ) : error ? (
                            <div className="py-6 px-4 text-xs text-red-200/80">
                              {error}
                            </div>
                          ) : latestNotifications.length === 0 ? (
                            <div className="py-6 px-4 text-sm text-white/60">
                              Aucune notification pour le moment.
                            </div>
                          ) : (
                            latestNotifications.map((notification) => {
                              const isRead = notification.is_read;
                              const { title, description, icon, accent } = getNotificationDisplay(notification);
                              return (
                                <button
                                  key={notification.id}
                                  onClick={() => {
                                    markAsRead(notification.id);
                                  }}
                                  className={cn(
                                    'group relative w-full rounded-xl px-4 py-3 text-left text-sm transition',
                                    isRead ? 'bg-transparent text-white/70' : 'bg-white/5 text-white shadow-lg shadow-black/20',
                                    'hover:bg-white/10'
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={cn(
                                        'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br',
                                        accent,
                                        isRead ? 'opacity-60' : 'shadow-md shadow-black/30'
                                      )}
                                    >
                                      {icon}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold text-white text-xs leading-snug">{title}</p>
                                        <span className="text-[11px] text-white/50">
                                          {notification.created_at ? formatDate(notification.created_at) : ''}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs text-white/75 leading-relaxed">{description}</p>
                                      <div className="mt-2 flex items-center gap-2">
                                        {!isRead && (
                                          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
                                            Nouveau
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div className="px-4 py-2 text-center border-t border-white/10">
                          <Link
                            to="/notifications"
                            className="text-xs text-white/70 hover:text-white"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            Voir toutes les notifications &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User dropdown (joli) */}
                  <div className="relative" data-user-dropdown>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((v) => !v);
                      }}
                      aria-expanded={isDropdownOpen}
                      className="flex items-center gap-3 px-3 py-2 bg-white/6 hover:bg-white/12 rounded-lg border border-white/10 transition shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-sm font-semibold ring-1 ring-white/10">
                        {user.avatar_url || '👤'}
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-white">{user.name}</div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            user.role === 'moderator' && user.is_moderator_verified
                              ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-100 border border-blue-500/50 shadow-md shadow-blue-500/20'
                              : user.role === 'admin'
                              ? 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-100 border border-red-500/50 shadow-md shadow-red-500/20'
                              : 'bg-white/10 text-white'
                          }`}>
                            {user.role === 'moderator' && user.is_moderator_verified
                              ? '🛡️ Modérateur'
                              : user.role === 'admin'
                              ? '👑 Admin'
                              : 'Utilisateur'}
                          </span>
                        </div>
                        {/* fun country indicator under name */}
                        {funCountry && (
                          <div className="text-xs text-green-400 mt-1 flex items-center gap-2">
                            <span className="text-sm">🟢</span>
                            <span className="truncate">Pays connecté: <span className="font-medium text-white">{funCountry}</span></span>
                          </div>
                        )}
                        {isAuthenticated && sessionCountdown && (
                          <div className="text-[11px] text-white/60 mt-1">
                            ⏳ Session expire dans <span className="text-white">{sessionCountdown}</span>
                          </div>
                        )}
                        {/* hide .local emails */}
                        {user.email && !user.email.endsWith('.local') && (
                          <div className="text-xs text-white/60 truncate">{user.email}</div>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-white/70 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-black/85 border border-white/10 shadow-lg ring-1 ring-white/5 origin-top-right transform transition duration-150">
                        <div className="px-4 py-3 border-b border-white/6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{user.name}</p>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                              user.role === 'moderator' && user.is_moderator_verified
                                ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-100 border border-blue-500/50 shadow-md shadow-blue-500/20'
                                : user.role === 'admin'
                                ? 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-100 border border-red-500/50 shadow-md shadow-red-500/20'
                                : 'bg-white/6 text-white'
                            }`}>
                              {user.role === 'moderator' && user.is_moderator_verified
                                ? '🛡️ Modérateur'
                                : user.role === 'admin'
                                ? '👑 Admin'
                                : 'Utilisateur'}
                            </span>
                          </div>
                          {user.email && !user.email.endsWith('.local') && (
                            <p className="text-xs text-white/60 truncate">{user.email}</p>
                          )}
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate('/notifications');
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/6"
                          >
                            🔔 Voir les notifications
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleOpenIdentityModal();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/6"
                          >
                            🚮 Supprimer mon identité
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 border-t border-white/6"
                          >
                            🚪 Déconnexion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition backdrop-blur-sm border border-white/20"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition shadow-lg shadow-purple-500/50"
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2">
              {isAuthenticated && user && (
                <div className="relative" data-notifications-dropdown>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNotifications(e);
                      setMobileNavOpen(false);
                    }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition"
                    aria-label="Notifications"
                    aria-expanded={isNotificationsOpen}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-500 text-[11px] font-semibold text-white px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-lg shadow-purple-900/40 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div>
                          <p className="text-white text-sm font-semibold">Notifications</p>
                          <p className="text-xs text-white/60">Dernières activités anonymes</p>
                        </div>
                        <button
                          onClick={handleMarkAll}
                          disabled={isMarkingAll || unreadCount === 0}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition ${
                            unreadCount === 0
                              ? 'border-white/15 text-white/30 cursor-not-allowed'
                              : 'border-white/20 text-white/70 hover:text-white hover:border-white/40'
                          }`}
                        >
                          {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Tout lire
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                        {loading && items.length === 0 ? (
                          <div className="py-6 flex flex-col items-center gap-2 text-white/60 text-sm">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Chargement des notifications…
                          </div>
                        ) : error ? (
                          <div className="py-6 px-4 text-xs text-red-200/80">
                            {error}
                          </div>
                        ) : latestNotifications.length === 0 ? (
                          <div className="py-6 px-4 text-sm text-white/60">
                            Aucune notification pour le moment.
                          </div>
                        ) : (
                          latestNotifications.map((notification) => {
                            const isRead = notification.is_read;
                            const { title, description, icon, accent } = getNotificationDisplay(notification);
                            return (
                              <button
                                key={notification.id}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setNotificationsOpen(false);
                                }}
                                className={cn(
                                  'group relative w-full rounded-xl px-4 py-3 text-left text-sm transition',
                                  isRead ? 'bg-transparent text-white/70' : 'bg-white/5 text-white shadow-lg shadow-black/20',
                                  'hover:bg-white/10'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br',
                                      accent,
                                      isRead ? 'opacity-60' : 'shadow-md shadow-black/30'
                                    )}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="font-semibold text-white text-xs leading-snug">{title}</p>
                                      <span className="text-[11px] text-white/50">
                                        {notification.created_at ? formatDate(notification.created_at) : ''}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-white/75 leading-relaxed">{description}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                      {!isRead && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
                                          Nouveau
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div className="px-4 py-2 text-center border-t border-white/10">
                          <Link
                            to="/notifications"
                            className="text-xs text-white/70 hover:text-white"
                            onClick={() => {
                              setNotificationsOpen(false);
                              setMobileNavOpen(false);
                            }}
                          >
                            Voir toutes les notifications &rarr;
                          </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setMobileNavOpen((prev) => !prev)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition"
                aria-label="Menu"
              >
                <span className="sr-only">Toggle menu</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-t border-white/10 bg-black/70 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 text-white/80">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 border border-white/15">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-lg">
                      {user.avatar_url || '👤'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          user.role === 'moderator' && user.is_moderator_verified
                            ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-100 border border-blue-500/50 shadow-md shadow-blue-500/20'
                            : user.role === 'admin'
                            ? 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-100 border border-red-500/50 shadow-md shadow-red-500/20'
                            : 'bg-white/10 text-white'
                        }`}>
                          {user.role === 'moderator' && user.is_moderator_verified
                            ? '🛡️ Modérateur'
                            : user.role === 'admin'
                            ? '👑 Admin'
                            : 'Utilisateur'}
                        </span>
                      </div>
                      {funCountry && (
                        <p className="text-xs text-green-400">Pays connecté: <span className="font-medium text-white">{funCountry}</span></p>
                      )}
                      {isAuthenticated && sessionCountdown && (
                        <p className="text-[11px] text-white/60">⏳ Session expire dans <span className="text-white">{sessionCountdown}</span></p>
                      )}
                      {user.email && !user.email.endsWith('.local') ? (
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                      ) : (
                        <p className="text-xs text-white/50 truncate">
                          {user.role === 'moderator' && user.is_moderator_verified
                            ? 'Modérateur AnoSUNU'
                            : user.role === 'admin'
                            ? 'Admin AnoSUNU'
                            : 'Utilisateur AnoSUNU'}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigate('/feed')}
                    className="w-full text-left py-2 font-medium hover:text-white transition flex items-center gap-2"
                  >
                    <span>🗣️</span>
                    <span>Espace Libre</span>
                    <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-[9px] text-green-300 font-semibold">FREE</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/chambres-noires')}
                    className="w-full py-2 font-medium hover:text-white transition flex items-center gap-2 relative"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-purple-600 text-[12px] shadow-md shadow-fuchsia-500/40 relative">
                      🔒
                      {/* Badge Premium sur mobile */}
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[8px] font-bold text-white px-1 rounded-full border border-amber-300/50 shadow-lg">
                        PRO
                      </span>
                    </span>
                    <span>Chambres Noires</span>
                  </button>
                  {!user.is_moderator_verified && user.role !== 'admin' && (
                    <button
                      onClick={() => handleNavigate('/devenir-moderateur')}
                      className="w-full text-left py-2 font-medium hover:text-white transition"
                    >
                      Devenir Modérateur
                    </button>
                  )}
                  <button
                    onClick={handleOpenIdentityModal}
                    className="w-full py-2 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 mt-2"
                  >
                    🚮 Supprimer mon identité
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 text-sm font-medium text-white/90 hover:text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg transition border border-red-500/30"
                  >
                    🚪 Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigate('/login')}
                    className="w-full text-left py-2 font-medium hover:text-white transition"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => handleNavigate('/register')}
                    className="w-full py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition shadow-lg shadow-purple-500/40 text-center"
                  >
                    Inscription
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
  
      <footer className="mt-16 bg-black/30 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 lg:grid-cols-[1.2fr_1fr] text-white/80">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-400 via-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/40"></div>
              <div>
                <p className="text-lg sm:text-xl font-semibold text-white">AnoSUNU</p>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-white/60">S'exprimer Libre&nbsp;ment</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-lg">
              Une communauté bienveillante où chaque voix compte. Partage tes pensées, tes joies et tes luttes en toute liberté.
            </p>
            <div className="mt-6 p-5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-lg">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-lg">✨</span> Soutenir AnoSUNU
              </p>
              <p className="text-sm text-white/60 leading-relaxed mt-2">
                Ton don nous aide à maintenir un espace sûr, gratuit et anonyme pour tous. Chaque contribution renforce la voix de la communauté.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/40 bg-gradient-to-br from-purple-900/60 via-fuchsia-800/60 to-amber-700/50 shadow-[0_35px_80px_-40px_rgba(217,70,239,0.75)] p-6">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-fuchsia-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl" />

              <p className="text-white text-lg font-semibold tracking-wide">Faire un don à AnoSUNU</p>
              <p className="text-sm text-white/70 leading-relaxed mt-2">
                Scanne le QR code pour contribuer et nous aider à protéger la liberté d’expression anonyme.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl">
                    <img
                      src="/qr-code-don.webp"
                      alt="QR Code pour faire un don à AnoSUNU"
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm text-white/80">
                  <p className="font-semibold flex items-center gap-2">
                    <span className="text-base">💛</span> Impact immédiat
                  </p>
                  <ul className="space-y-2 text-white/60 leading-relaxed">
                    <li>∙ Soutien à la modération humaine</li>
                    <li>∙ Hébergement sécurisé et anonyme</li>
                    <li>∙ Nouveaux outils pour la communauté</li>
                  </ul>
                </div>
              </div>

              <a
                href="https://pay.wave.com/m/M_sn_OrBEDgUMGWxY/c/sn"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-fuchsia-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/40 transition hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                <span>💳</span>
                Contribuer maintenant
              </a>

              {/* Mobile layout - Politiques juste après le bouton don */}
              <div className="sm:hidden mt-8 flex flex-col gap-3 text-center">
                <Link 
                  to="/policies" 
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 hover:border-blue-400/60 text-blue-300 hover:text-blue-200 font-semibold transition"
                >
                  📋 Politiques & Juridique
                </Link>
                <p className="text-[11px] text-white/40">© {new Date().getFullYear()} AnoSUNU</p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Cultivons une parole libre, anonyme et respectueuse.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center justify-between text-[12px] text-white/50">
              <p>© {new Date().getFullYear()} AnoSUNU. Tous droits réservés.</p>
              <div className="flex gap-6">
                <Link to="/policies" className="hover:text-white/80 transition font-medium">Politiques & Juridique</Link>
                <p className="text-white/40">Cultivons une parole libre, anonyme et respectueuse.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <ConfirmActionModal
        isOpen={isIdentityModalOpen}
        title="Suppression définitive"
        message="Supprimer mon identité virtuelle"
        subtitle={
          identityError ??
          "Tous vos posts, commentaires, likes, messages et abonnements seront supprimés de manière irréversible."
        }
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        tone="danger"
        loading={identityLoading}
        onConfirm={handleConfirmIdentityDeletion}
        onCancel={() => {
          if (!identityLoading) {
            setIdentityModalOpen(false);
            setIdentityError(null);
          }
        }}
      />
      
      {/* Navigation mobile en bas */}
      <BottomNav />
    </div>
  );
}
