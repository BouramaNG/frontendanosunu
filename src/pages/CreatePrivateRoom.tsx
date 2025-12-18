import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, Clock, Shield, Check, Sparkles, Lock, Zap, Eye } from '@/lib/icons';
import api from '../lib/api';
import WavePaymentModal from '../components/WavePaymentModal';
import ShareRoomModal from '../components/ShareRoomModal';
import { useAuthStore } from '../store/authStore';

export default function CreatePrivateRoom() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minParticipants, setMinParticipants] = useState(2);
  const [maxParticipants, setMaxParticipants] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (maxParticipants < minParticipants) {
      alert('Le nombre maximum doit être supérieur ou égal au minimum');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/black-rooms/private/create', {
        name,
        description,
        min_participants: minParticipants,
        max_participants: maxParticipants,
        duration_minutes: durationMinutes,
        payment_method: 'orange_money',
        phone_number: '',
      });

      const data = response.data.data;

      // If payment created and pending, open Wave modal and DO NOT render success screen yet
      if (data.payment && data.payment.status === 'pending') {
        setPaymentData({
          payment_code: data.payment.payment_code,
          wave_url: data.payment.wave_url,
          amount: data.payment.amount,
          black_room_slug: data.black_room_slug,
        });
        setShowPaymentModal(true);
        // Do not set createdRoom yet to avoid showing success screen with placeholders.
      } else {
        setCreatedRoom(data);
      }
    } catch (error: any) {
      console.error('Error creating private room:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (createdRoom) {
  const isRoomActive = Boolean(createdRoom?.access_code || createdRoom?.invite_link);
  return (
      <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Success Animation */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-green-500/50 bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-green-900/40 backdrop-blur-xl mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.3),transparent_70%)]"></div>
            <div className="relative p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Chambre <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Créée !</span> 🎉
              </h2>
              <p className="text-white/80 text-lg mb-8">
                Votre espace privé est prêt. Partagez le code ou le lien avec vos invités.
              </p>
            </div>
          </div>

          {/* Access Info - Share Button */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.2),transparent_70%)]"></div>
            <div className="relative p-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Prêt à inviter vos amis? 🚀</h3>
              <p className="text-white/80 mb-6">Partagez votre chambre via WhatsApp, Telegram, Email ou SMS</p>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg transition transform hover:scale-105"
              >
                📱 Partager la Chambre
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-xl mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.2),transparent_70%)]"></div>
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Important : Auto-Destruction
                  </h3>
                  <div className="space-y-2 text-white/90 text-sm">
                    <p>⏰ Cette chambre sera <strong>automatiquement détruite</strong> après <strong>{createdRoom.black_room.duration_minutes} minutes</strong>.</p>
                    <p>🗑️ <strong>Toutes les données</strong> (posts, commentaires, images, vidéos) seront <strong>supprimées définitivement</strong>.</p>
                    <p>🔒 <strong>Aucune récupération possible</strong> après la destruction.</p>
                    <p className="mt-3 pt-3 border-t border-yellow-500/30">
                      <strong>Fin prévue :</strong> {new Date(createdRoom.scheduled_end_at).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                if (!isRoomActive) return;
                navigate(createdRoom.black_room?.slug ? `/black-rooms/${createdRoom.black_room.slug}` : '/chambres-noires');
              }}
              disabled={!isRoomActive}
              className={`flex-1 group relative overflow-hidden py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                isRoomActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transform hover:scale-105'
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/15'
              }`}
              title={isRoomActive ? 'Accéder à la Chambre' : 'Activez la chambre en finalisant le paiement'}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                {isRoomActive ? 'Accéder à la Chambre' : 'Paiement requis'}
                {isRoomActive && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
              {isRoomActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              )}
            </button>
            <button
              onClick={() => navigate('/chambres-noires')}
              className="px-6 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20"
            >
              Retour
            </button>
          </div>
          {showPaymentModal && paymentData && (
            <WavePaymentModal
              isOpen={showPaymentModal}
              onClose={() => {
                setShowPaymentModal(false);
                // If user closes/cancels the payment modal and room isn't active, redirect to list page
                if (!isRoomActive) {
                  navigate('/chambres-noires');
                }
              }}
              paymentData={paymentData}
              onPaymentVerified={async (payload?: any) => {
                // After verification, fetch room details (server should return access_code/invite_link once active)
                try {
                  // If payload includes black_room (admin approved just now), use it
                  if (payload?.black_room) {
                    const roomData = payload.black_room;
                    setCreatedRoom({
                      black_room: roomData,
                      access_code: roomData.access_code,
                      invite_link: roomData.invite_link,
                      scheduled_end_at: roomData.scheduled_end_at,
                    });
                  } else {
                    // Try by ID first
                    let res;
                    try {
                      res = await api.get(`/black-rooms/${createdRoom.black_room.id}`);
                    } catch (err) {
                      // Fallback to slug-based endpoint if available
                      if (createdRoom.black_room.slug) {
                        res = await api.get(`/black-rooms/slug/${createdRoom.black_room.slug}`);
                      } else if (paymentData?.black_room_slug) {
                        res = await api.get(`/black-rooms/slug/${paymentData.black_room_slug}`);
                      } else {
                        throw err;
                      }
                    }

                    const roomData = res.data.data.blackRoom ?? res.data.data;
                    setCreatedRoom({
                      black_room: roomData,
                      access_code: roomData.access_code,
                      invite_link: roomData.invite_link,
                      scheduled_end_at: roomData.scheduled_end_at,
                    });
                  }
                } catch (e) {
                  // If not yet available, keep polling or inform user
                }
                setShowPaymentModal(false);
              }}
            />
          )}

          {/* Share Modal */}
          {showShareModal && (
            <ShareRoomModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              accessCode={createdRoom.access_code}
              inviteLink={createdRoom.invite_link}
              roomName={createdRoom.black_room?.name || 'Chambre Privée'}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/chambres-noires')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-xl mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.3),transparent_50%)]"></div>
          <div className="relative p-8 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Créer votre <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Chambre Privée</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Un espace ultra-sécurisé entre 2 et 15 personnes. Vos conversations disparaîtront automatiquement après la durée choisie.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-white/5 to-white/5 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_70%)]"></div>
          <div className="relative p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-white/90 font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Nom de la chambre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                  placeholder="Ex: Discussion entre amis"
                />
              </div>

              <div>
                <label className="block text-white/90 font-semibold mb-3">Description (optionnel)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition resize-none"
                  rows={3}
                  placeholder="Décrivez le sujet de discussion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/90 font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Capacité maximale
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="15"
                    value={minParticipants}
                    onChange={(e) => setMinParticipants(Number(e.target.value))}
                    required
                    className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition text-center text-2xl font-bold"
                  />
                  <p className="text-white/60 text-xs mt-2">Toi + X autres personnes (max. 15)</p>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-white/90 font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Maximum système
                    </label>
                    <div className="w-full bg-white/5 border-2 border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold flex items-center justify-center">
                      15
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <p className="text-purple-200 text-xs">Max non modifiable</p>
                  </div>
                </div>
              </div>

              <div className="hidden">
                <label className="block text-white/90 font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  Participants max
                </label>
                <input
                  type="number"
                  min="2"
                  max="15"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  required
                  className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition text-center text-2xl font-bold"
                />
              </div>

              <div>
                <label className="block text-white/90 font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Durée (minutes) - Max 180 (3H)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  required
                  className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition text-center text-2xl font-bold"
                />
                <p className="text-white/60 text-xs mt-2">
                  ⚡ Après cette durée, la chambre sera automatiquement détruite
                </p>
              </div>

              {/* Security Info */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.2),transparent_70%)]"></div>
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-yellow-400" />
                        Conditions de Sécurité
                      </h3>
                      <ul className="space-y-2 text-white/90 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">💰</span>
                          <span><strong>Prix :</strong> 2 000 FCFA par création</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">⏰</span>
                          <span><strong>Auto-destruction :</strong> La chambre sera détruite après {durationMinutes} minutes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">🗑️</span>
                          <span><strong>Suppression totale :</strong> Toutes les données seront supprimées définitivement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">🔐</span>
                          <span><strong>Code & Lien :</strong> Vous recevrez un code unique et un lien d'invitation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">🛡️</span>
                          <span><strong>Modérateurs invisibles :</strong> Des modérateurs surveillent discrètement</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Créer la Chambre (2 000 FCFA)
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </form>

        {/* Payment Modal shown while still on the form screen */}
        {showPaymentModal && paymentData && (
          <WavePaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              // User canceled without verification -> go back to list
              navigate('/chambres-noires');
            }}
            paymentData={paymentData}
            onPaymentVerified={async (payload?: any) => {
              try {
                if (payload?.black_room) {
                  const roomData = payload.black_room;
                  setCreatedRoom({
                    black_room: roomData,
                    access_code: roomData.access_code,
                    invite_link: roomData.invite_link,
                    scheduled_end_at: roomData.scheduled_end_at,
                  });
                } else {
                  // Fallback: try to retrieve by slug if present in paymentData
                  let res;
                  if (paymentData?.black_room_slug) {
                    res = await api.get(`/black-rooms/slug/${paymentData.black_room_slug}`);
                  }
                  const roomData = res?.data?.data?.blackRoom ?? res?.data?.data;
                  if (roomData) {
                    setCreatedRoom({
                      black_room: roomData,
                      access_code: roomData.access_code,
                      invite_link: roomData.invite_link,
                      scheduled_end_at: roomData.scheduled_end_at,
                    });
                  }
                }
              } catch (_) {
                // ignore, user can try again
              }
              setShowPaymentModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
