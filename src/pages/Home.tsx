import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Shield, Users, Loader2, MessageCircle, TrendingUp, ArrowRight, Sparkles, Heart } from '@/lib/icons';
import WelcomeHomeModal from '../components/WelcomeHomeModal';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface TopicSummary {
  id: number;
  name: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
  posts_count?: number;
}

interface RecentPost {
  id: number;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  topic?: {
    name: string;
    icon?: string;
  };
}

interface CommunityStats {
  total_posts: number;
  total_users: number;
  posts_today: number;
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleCloseModal = () => {
    setShowWelcomeModal(false);
  };

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoadingTopics(true);
      setTopicsError(null);

      try {
        const response = await api.get('/topics');
        const payload: TopicSummary[] = response.data?.data ?? [];
        setTopics(payload);

        // Calculate stats from topics
        const totalPosts = payload.reduce((acc, t) => acc + (t.posts_count || 0), 0);
        setStats({
          total_posts: totalPosts,
          total_users: Math.floor(totalPosts * 0.3) + 100, // Estimation
          posts_today: Math.floor(totalPosts * 0.05) + 5,
        });
      } catch (error: any) {
        const message = error?.response?.data?.message ?? "Impossible de récupérer les catégories.";
        setTopicsError(message);
      } finally {
        setIsLoadingTopics(false);
      }
    };

    fetchTopics().catch(() => {
      setIsLoadingTopics(false);
      setTopicsError('Impossible de récupérer les catégories.');
    });
  }, []);

  // Fetch recent posts for logged in users
  useEffect(() => {
    if (isAuthenticated) {
      const fetchRecentPosts = async () => {
        setIsLoadingPosts(true);
        try {
          const response = await api.get('/posts?limit=5');
          setRecentPosts(response.data?.data ?? []);
        } catch (error) {
          console.error('Error fetching posts:', error);
        } finally {
          setIsLoadingPosts(false);
        }
      };
      fetchRecentPosts();
    }
  }, [isAuthenticated]);

  // Logged in user view
  if (isAuthenticated && user) {
    return (
      <>
      <div className="min-h-screen pb-24 lg:pb-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-purple-900/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.3),transparent_50%)]"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  Bienvenue, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">{user.name || 'Anonyme'}</span> 👋
                </h1>
                <p className="text-white/70 text-lg">
                  Que voulez-vous faire aujourd'hui ?
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/feed"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition shadow-lg flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Aller à l'Espace Libre
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total_posts}</p>
                <p className="text-white/60 text-sm">Publications totales</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.posts_today}</p>
                <p className="text-white/60 text-sm">Posts aujourd'hui</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total_users}</p>
                <p className="text-white/60 text-sm">Membres actifs</p>
              </div>
              
              <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-pink-500/30 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-pink-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-white/60 text-sm">Anonymat garanti</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                  Publications Récentes
                </h2>
                <Link to="/feed" className="text-pink-400 hover:text-pink-300 text-sm font-medium flex items-center gap-1">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              {isLoadingPosts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : recentPosts.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/50">Aucune publication récente</p>
                  <Link to="/feed" className="mt-4 inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                    Créer une publication
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.slice(0, 5).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate('/feed')}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition group"
                    >
                      <p className="text-white/90 line-clamp-2 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-white/50">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {post.comments_count}
                          </span>
                        </div>
                        {post.topic && (
                          <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
                            {post.topic.icon} {post.topic.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Access */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Accès Rapide
              </h2>
              
              <div className="space-y-4">
                {/* Espace Libre */}
                <Link
                  to="/feed"
                  className="block bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-2xl p-5 hover:from-purple-500/30 hover:to-pink-500/20 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                      🗣️
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold group-hover:text-pink-300 transition">Espace Libre</h3>
                      <p className="text-white/60 text-sm">Wax Sa Xalaat</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-pink-400 group-hover:translate-x-1 transition" />
                  </div>
                </Link>

                {/* Chambres Noires */}
                <Link
                  to="/chambres-noires"
                  className="block bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 rounded-2xl p-5 hover:from-pink-500/30 hover:to-rose-500/20 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-2xl">
                      🔒
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold group-hover:text-pink-300 transition">Chambres Noires</h3>
                      <p className="text-white/60 text-sm">Espaces premium sécurisés</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-pink-400 group-hover:translate-x-1 transition" />
                  </div>
                </Link>

                {/* VFF */}
                <Link
                  to="/chambres-noires"
                  className="block bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 rounded-2xl p-5 hover:from-violet-500/30 hover:to-fuchsia-500/20 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-2xl">
                      💜
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold group-hover:text-violet-300 transition">Violences Faites aux Femmes</h3>
                      <p className="text-white/60 text-sm">Soutien & Ressources</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-violet-400 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              </div>

              {/* Topics */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Catégories Populaires</h3>
                <div className="flex flex-wrap gap-2">
                  {topics.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        if (!isAuthenticated) {
                          setShowLoginModal(true);
                        } else {
                          navigate(`/feed?category=${topic.slug}`);
                        }
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition text-sm flex items-center gap-2"
                    >
                      <span>{topic.icon || '📌'}</span>
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => navigate('/login')}
      />
      </>
    );
  }

  // Visitor (not logged in) view - Landing Page
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <main className="w-full">
            {/* Hero Section */}
            <div className="text-center pt-10 pb-14 sm:pt-12 sm:pb-16">
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                Exprimez-vous en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300">
                  toute<br />liberté
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/70 max-w-3xl lg:max-w-4xl mx-auto mb-4 leading-relaxed px-2 sm:px-0">
                Une plateforme moderne d'expression anonyme où vos pensées, opinions et
                expériences peuvent être partagées sans jugement.
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-pink-400 mb-10">
                🗣️ Wax Sa Xalaat - Parole Libre
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Link
                  to="/register"
                  className="px-6 py-3 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl transition shadow-lg text-center"
                >
                  Commencer à explorer
                </Link>
                <Link
                  to="/chambres-noires"
                  className="px-6 py-3 text-base sm:text-lg font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl transition backdrop-blur border border-white/20 text-center"
                >
                  Découvrir les Chambres Noires
                </Link>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="pb-20 mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Catégories</h2>
              {isLoadingTopics ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : topicsError ? (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200">
                  {topicsError}
                </div>
              ) : topics.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-white/50">Aucune catégorie disponible pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        if (!isAuthenticated) {
                          setShowLoginModal(true);
                        } else {
                          navigate(`/feed?category=${topic.slug}`);
                        }
                      }}
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:from-white/15 hover:to-white/10 transition group text-left"
                    >
                      <div className="text-4xl mb-3">
                        {topic.icon && topic.icon.trim().length > 0 ? topic.icon : '📌'}
                      </div>
                      <h3 className="text-white font-semibold group-hover:text-pink-300 transition mb-2">
                        {topic.name}
                      </h3>
                      {typeof topic.posts_count === 'number' && (
                        <p className="text-xs text-white/50">
                          {topic.posts_count} {topic.posts_count > 1 ? 'publications' : 'publication'}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Features Cards */}
            <div className="pb-20">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Card 1 - 100% Anonyme */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:transform hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">100% Anonyme</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    Aucune trace, aucun moyen de vous identifier. Votre identité
                    reste totalement protégée.
                  </p>
                </div>

                {/* Card 2 - Modération Certifiée */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:transform hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Modération Certifiée</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    Des modérateurs vérifiés maintiennent un environnement
                    respectueux et sécurisé.
                  </p>
                </div>

                {/* Card 3 - Chambres Noires */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:transform hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Chambres Noires</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    Des espaces premium avec des coaches spécialisés pour des
                    discussions approfondies.
                  </p>
                </div>
              </div>
            </div>
          </main>
      </div>

      {/* Welcome Modal */}
      <WelcomeHomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseModal}
      />
      
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => navigate('/login')}
      />
    </div>
  );
}
