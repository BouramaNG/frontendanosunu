import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Copy, Eye, Users, Lock, Trash2, AlertCircle, MessageSquare, 
  Activity, TrendingUp, Clock, Shield, BarChart3,
  CheckCircle, XCircle, Filter, Search, Zap
} from '@/lib/icons';
import type { BlackRoom } from '../types';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function AdminBlackRooms() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [blackRooms, setBlackRooms] = useState<BlackRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'popular'>('newest');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchBlackRooms();
  }, [user, navigate]);

  const fetchBlackRooms = async () => {
    try {
      setLoading(true);
      // Fetch all black rooms (admin endpoint)
      const res = await api.get('/black-rooms');
      const rooms = Array.isArray(res.data?.data) ? res.data.data : res.data || [];
      
      // Filter to show only "Sama Chambre Noire" (private temporary rooms)
      const samaRooms = rooms.filter((r: BlackRoom) => r.type === 'private');
      setBlackRooms(samaRooms);
    } catch (error) {
      console.error('Error fetching black rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const accessRoom = (slug: string) => {
    navigate(`/black-rooms/${slug}`);
  };

  const deleteRoom = async (roomSlug: string, roomId: number) => {
    if (!window.confirm('⚠️ Êtes-vous sûr ? Cette action est IRRÉVERSIBLE et supprimera la chambre complètement.')) {
      return;
    }

    try {
      await api.delete(`/black-rooms/${roomSlug}`);
      // Refresh the list
      setBlackRooms(blackRooms.filter(r => r.id !== roomId));
      alert('✅ Chambre supprimée avec succès !');
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('❌ Erreur lors de la suppression de la chambre');
    }
  };

  // Filter & Sort rooms
  const filteredAndSortedRooms = blackRooms
    .filter((room) => {
      const matchesSearch = 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.access_code && room.access_code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterActive === null ? true : room.is_active === filterActive;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        // If no created_at, use scheduled_end_at or current date
        const dateA = new Date('2024-01-01');
        const dateB = new Date('2024-01-01');
        return dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'active') {
        return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
      } else {
        return (b.subscribers_count || 0) - (a.subscribers_count || 0);
      }
    });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-white mb-2">❌ Accès Refusé</h2>
          <p className="text-white/60 text-lg">Seuls les administrateurs peuvent accéder à ce panel</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-purple-500 animate-spin"></div>
          </div>
          <p className="text-white text-2xl font-semibold mb-2">Chargement des chambres...</p>
          <p className="text-white/60">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  const totalMessages = blackRooms.reduce((sum, r) => sum + (r.subscribers_count || 0), 0);
  const activeRooms = blackRooms.filter(r => r.is_active).length;
  const inactiveRooms = blackRooms.length - activeRooms;

  return (
    <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 backdrop-blur-xl mb-8 p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.4),transparent_70%)]"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                🔐
              </div>
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-1">Sama Chambres Noires</h1>
                <p className="text-white/80 text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Dashboard Administrateur - Modération & Surveillance Centralisée
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-white/70">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-purple-600/5 p-6 hover:border-purple-500/60 transition group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Lock className="w-6 h-6 text-purple-400 group-hover:scale-110 transition" />
                <TrendingUp className="w-4 h-4 text-purple-300/60" />
              </div>
              <p className="text-purple-200/80 text-sm font-semibold mb-2">Total Chambres</p>
              <p className="text-4xl font-black text-purple-300">{blackRooms.length}</p>
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <p className="text-xs text-purple-200/60">Créées par les utilisateurs</p>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-emerald-600/5 p-6 hover:border-emerald-500/60 transition group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition" />
                <TrendingUp className="w-4 h-4 text-emerald-300/60" />
              </div>
              <p className="text-emerald-200/80 text-sm font-semibold mb-2">🟢 Actives</p>
              <p className="text-4xl font-black text-emerald-300">{activeRooms}</p>
              <div className="mt-3 pt-3 border-t border-emerald-500/20">
                <p className="text-xs text-emerald-200/60">{Math.round((activeRooms / (blackRooms.length || 1)) * 100)}% du total</p>
              </div>
            </div>
          </div>

          {/* Inactive */}
          <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-600/20 via-red-500/10 to-red-600/5 p-6 hover:border-red-500/60 transition group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/20 rounded-full blur-2xl -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <XCircle className="w-6 h-6 text-red-400 group-hover:scale-110 transition" />
                <TrendingUp className="w-4 h-4 text-red-300/60" />
              </div>
              <p className="text-red-200/80 text-sm font-semibold mb-2">🔴 Inactives</p>
              <p className="text-4xl font-black text-red-300">{inactiveRooms}</p>
              <div className="mt-3 pt-3 border-t border-red-500/20">
                <p className="text-xs text-red-200/60">À surveiller</p>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-blue-600/5 p-6 hover:border-blue-500/60 transition group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-6 h-6 text-blue-400 group-hover:scale-110 transition" />
                <TrendingUp className="w-4 h-4 text-blue-300/60" />
              </div>
              <p className="text-blue-200/80 text-sm font-semibold mb-2">👥 Utilisateurs</p>
              <p className="text-4xl font-black text-blue-300">{totalMessages}</p>
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <p className="text-xs text-blue-200/60">Total abonnés</p>
              </div>
            </div>
          </div>

          {/* Avg Users */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-600/20 via-amber-500/10 to-amber-600/5 p-6 hover:border-amber-500/60 transition group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                <Zap className="w-4 h-4 text-amber-300/60" />
              </div>
              <p className="text-amber-200/80 text-sm font-semibold mb-2">📊 Moyenne/Chambre</p>
              <p className="text-4xl font-black text-amber-300">
                {blackRooms.length > 0 ? Math.round(totalMessages / blackRooms.length) : 0}
              </p>
              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <p className="text-xs text-amber-200/60">Utilisateurs par chambre</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Panel */}
        <div className="bg-gradient-to-r from-white/8 to-white/5 border border-white/20 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="🔍 Rechercher par nom, slug, code d'accès..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
              />
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterActive(null)}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-semibold flex items-center gap-2 ${
                    filterActive === null
                      ? 'bg-white/20 border-white/40 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Toutes
                </button>
                <button
                  onClick={() => setFilterActive(true)}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-semibold flex items-center gap-2 ${
                    filterActive === true
                      ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300 shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Actives
                </button>
                <button
                  onClick={() => setFilterActive(false)}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-semibold flex items-center gap-2 ${
                    filterActive === false
                      ? 'bg-red-500/30 border-red-500/60 text-red-300 shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Inactives
                </button>
              </div>

              {/* Sort Controls */}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-semibold flex items-center gap-2 ${
                    sortBy === 'newest'
                      ? 'bg-blue-500/30 border-blue-500/60 text-blue-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Récentes
                </button>
                <button
                  onClick={() => setSortBy('active')}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-semibold flex items-center gap-2 ${
                    sortBy === 'active'
                      ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Actives
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-semibold flex items-center gap-2 ${
                    sortBy === 'popular'
                      ? 'bg-purple-500/30 border-purple-500/60 text-purple-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Populaires
                </button>
              </div>
            </div>

            {/* Results Info */}
            <div className="text-xs text-white/60 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Affichage: <span className="font-bold text-white">{filteredAndSortedRooms.length}</span> chambre(s) sur <span className="font-bold text-white">{blackRooms.length}</span>
            </div>
          </div>
        </div>

        {/* Rooms List */}
        {filteredAndSortedRooms.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <MessageSquare className="w-20 h-20 text-white/20 mx-auto mb-4" />
            <p className="text-white text-xl font-bold mb-2">Aucune chambre trouvée</p>
            <p className="text-white/60">Essayez une autre recherche ou changez les filtres</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedRooms.map((room) => {
              // Use scheduled_end_at as reference date or default to today
              const createdDate = room.scheduled_end_at 
                ? new Date(String(room.scheduled_end_at)) 
                : new Date();
              const now = new Date();
              const diffMs = now.getTime() - createdDate.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              
              let timeDisplay = '';
              if (diffDays > 0) {
                timeDisplay = `${diffDays} jour${diffDays > 1 ? 's' : ''} ago`;
              } else if (diffHours > 0) {
                timeDisplay = `${diffHours}h ago`;
              } else {
                timeDisplay = 'À l\'instant';
              }
              
              return (
                <div
                  key={room.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/40 bg-gradient-to-r from-white/5 via-white/[0.02] to-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-300 p-6 hover:shadow-2xl hover:shadow-purple-500/20"
                >
                  {/* Gradient Accent */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition duration-300 -z-0"></div>

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Main Info */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-2xl lg:text-3xl font-black text-white group-hover:text-pink-300 transition mb-2">
                            {room.name}
                          </h3>
                          <p className="text-white/70 text-sm lg:text-base line-clamp-2">{room.description}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`px-4 py-2 rounded-xl text-xs font-black border whitespace-nowrap ${
                            room.is_active
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/20'
                              : 'bg-red-500/20 border-red-500/60 text-red-300'
                          }`}>
                            {room.is_active ? '🟢 ACTIF' : '🔴 INACTIF'}
                          </span>
                          {diffDays === 0 && diffHours < 24 && (
                            <span className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/60 text-amber-300 shadow-lg shadow-amber-500/20">
                              ⭐ NOUVEAU
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Access Code Box */}
                      <div className="bg-black/50 border border-white/20 rounded-xl p-5 group/code hover:border-white/40 transition">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <p className="text-white/80 text-xs font-black uppercase tracking-wider">🔐 Code d'accès</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 text-white font-mono text-xl bg-white/5 px-4 py-3 rounded-lg border border-white/10 group-hover/code:border-white/30 select-all group-hover/code:bg-white/10 transition">
                            {room.access_code || room.slug}
                          </code>
                          <button
                            onClick={() => copyToClipboard(room.access_code || room.slug, room.id)}
                            className={`p-3 rounded-lg border transition flex-shrink-0 font-semibold ${
                              copiedId === room.id
                                ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/20'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                            }`}
                            title="Copier le code d'accès"
                          >
                            {copiedId === room.id ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Meta Information Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition group/meta">
                          <p className="text-white/50 text-xs font-bold mb-1 uppercase tracking-wide">📁 Catégorie</p>
                          <p className="text-white font-bold truncate">{room.category}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition group/meta">
                          <p className="text-white/50 text-xs font-bold mb-1 uppercase tracking-wide">🔒 Type</p>
                          <p className="text-white font-bold">{room.type === 'private' ? 'Privée' : 'Publique'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition group/meta">
                          <p className="text-white/50 text-xs font-bold mb-1 uppercase tracking-wide">⏰ Créée</p>
                          <p className="text-white font-bold text-sm">{timeDisplay}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition group/meta">
                          <p className="text-white/50 text-xs font-bold mb-1 uppercase tracking-wide">📅 Date</p>
                          <p className="text-white font-bold text-sm">{createdDate.toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats & Actions */}
                    <div className="space-y-4">
                      {/* User Stats Card */}
                      <div className="bg-gradient-to-br from-blue-600/30 to-blue-500/10 border border-blue-500/40 rounded-xl p-5 hover:border-blue-500/60 transition">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">👥 Abonnés</p>
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-4xl font-black text-blue-300">{room.subscribers_count || 0}</p>
                        <div className="mt-3 pt-3 border-t border-blue-500/30">
                          <p className="text-blue-200/60 text-xs">Utilisateurs actifs</p>
                        </div>
                      </div>

                      {/* Status Details */}
                      <div className={`rounded-xl p-5 border transition ${
                        room.is_active
                          ? 'bg-emerald-600/20 border-emerald-500/40 hover:border-emerald-500/60'
                          : 'bg-red-600/20 border-red-500/40 hover:border-red-500/60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs font-bold uppercase tracking-wider ${room.is_active ? 'text-emerald-200' : 'text-red-200'}`}>
                            {room.is_active ? '✅ Statut' : '⛔ Statut'}
                          </p>
                          <Activity className={`w-5 h-5 ${room.is_active ? 'text-emerald-400' : 'text-red-400'}`} />
                        </div>
                        <p className={`text-lg font-black ${room.is_active ? 'text-emerald-300' : 'text-red-300'}`}>
                          {room.is_active ? 'En cours' : 'Fermée'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => accessRoom(room.slug)}
                          className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 group/btn"
                          title="Accéder à la chambre et modérer"
                        >
                          <Eye className="w-5 h-5 group-hover/btn:animate-pulse" />
                          Modérer
                        </button>
                        <button
                          onClick={() => deleteRoom(room.slug, room.id)}
                          className="w-full px-5 py-2 bg-red-600/20 border border-red-500/60 hover:bg-red-600/40 text-red-300 rounded-xl transition text-sm font-bold flex items-center justify-center gap-2 hover:border-red-500/80"
                          title="Supprimer définitivement cette chambre"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
