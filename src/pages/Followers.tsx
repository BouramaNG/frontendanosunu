import { useEffect, useState } from 'react';
import { Users, UserPlus, Search } from '@/lib/icons';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';
import { Loader2 } from '@/lib/icons';

export default function Followers() {
  const { user } = useAuthStore();
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [user]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      // Pour l'instant, on simule des données
      // À remplacer par un vrai endpoint API quand il sera disponible
      const response = await api.get('/users/followers').catch(() => ({ data: { data: [] } }));
      setFollowers(response.data?.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des followers:', error);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      // Pour l'instant, on simule des données
      // À remplacer par un vrai endpoint API quand il sera disponible
      const response = await api.get('/users/following').catch(() => ({ data: { data: [] } }));
      setFollowing(response.data?.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des following:', error);
      setFollowing([]);
    }
  };

  const filteredUsers = (activeTab === 'followers' ? followers : following).filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24 lg:pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Communauté</h1>
          <p className="text-white/70 text-sm">
            Gérez vos connexions et découvrez de nouveaux membres
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'followers'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Followers</span>
              {followers.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {followers.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'following'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Following</span>
              {following.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {following.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder={`Rechercher dans ${activeTab === 'followers' ? 'vos followers' : 'vos abonnements'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery
                ? 'Aucun résultat'
                : activeTab === 'followers'
                ? 'Aucun follower pour le moment'
                : "Vous n'êtes abonné à personne"}
            </h3>
            <p className="text-white/60 text-sm">
              {searchQuery
                ? 'Essayez avec d\'autres mots-clés'
                : activeTab === 'followers'
                ? 'Partagez votre profil pour attirer des followers'
                : 'Découvrez et suivez des membres intéressants'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((follower) => (
              <div
                key={follower.id}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/8 transition"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ring-2 ring-white/20"
                    style={
                      follower.avatar_color
                        ? { backgroundColor: follower.avatar_color }
                        : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
                    }
                  >
                    {follower.avatar_value || '👤'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{follower.name || 'Utilisateur'}</h3>
                    <p className="text-white/60 text-sm">
                      {follower.email ? follower.email.split('@')[0] : 'Membre'}
                    </p>
                  </div>

                  {/* Actions */}
                  <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition">
                    Voir profil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


