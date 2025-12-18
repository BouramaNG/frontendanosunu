import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, Lock, Users, Clock, Code } from '@/lib/icons';
import api from '../lib/api';

export default function SavedBlackRooms() {
  const navigate = useNavigate();
  const [savedRooms, setSavedRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavedRooms();
  }, []);

  const fetchSavedRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/saved-black-rooms');
      setSavedRooms(response.data.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedId: number) => {
    if (!window.confirm('Supprimer cette chambre de vos favoris?')) return;

    try {
      await api.delete(`/saved-black-rooms/${savedId}`);
      setSavedRooms(savedRooms.filter((room) => room.id !== savedId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleJoin = (room: any) => {
    // Si la chambre a un lien, rejoindre directement
    if (room.black_room?.invite_link) {
      window.location.href = `/join?link=${room.black_room.invite_link}`;
      return;
    }

    // Sinon afficher un message pour saisir le code
    const code = prompt('Entrez le code d\'accès de la chambre:');
    if (code) {
      navigate('/join-private-room');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Mes chambres sauvegardées
            </h1>
          </div>
          <p className="text-white/70">Retrouvez facilement vos chambres favorites</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        {savedRooms.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <Star className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Aucune chambre sauvegardée</h2>
            <p className="text-white/70 mb-6">
              Sauvegardez vos chambres favorites pour y accéder rapidement!
            </p>
            <button
              onClick={() => navigate('/chambres-noires')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-semibold transition"
            >
              Découvrir des chambres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRooms.map((saved: any) => {
              const room = saved.black_room;
              return (
                <div
                  key={saved.id}
                  className="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/20"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition line-clamp-2">
                        {room.name}
                      </h3>
                      <p className="text-white/60 text-sm mt-1">
                        Par {room.creator?.username || 'Anonyme'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(saved.id)}
                      className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Supprimer des favoris"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Description */}
                  {room.description && (
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                        <Users className="w-4 h-4" />
                        Capacité
                      </div>
                      <div className="text-white font-semibold">
                        {room.min_participants} max
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        Durée
                      </div>
                      <div className="text-white font-semibold">
                        {room.duration_minutes}min
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    {room.is_active ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-300 text-xs font-semibold">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/50 text-gray-300 text-xs font-semibold">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Inactive
                      </span>
                    )}

                    {room.access_code && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/70 bg-white/5 rounded-lg">
                        <Code className="w-3 h-3" />
                        Code
                      </span>
                    )}
                    {room.invite_link && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/70 bg-white/5 rounded-lg">
                        <Lock className="w-3 h-3" />
                        Lien
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleJoin(room)}
                    disabled={!room.is_active}
                    className={`w-full py-2 rounded-lg font-semibold transition ${
                      room.is_active
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    {room.is_active ? 'Retourner' : 'Chambre inactive'}
                  </button>

                  {/* Saved date */}
                  <p className="text-white/50 text-xs mt-3 text-center">
                    Sauvegardée le {new Date(saved.saved_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
