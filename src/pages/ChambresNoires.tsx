import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Star, Users, Heart, Brain, MessageCircle, Sparkles, Shield, TrendingUp,
  Zap, Crown, Eye, CheckCircle2, ArrowRight, Clock, Globe, Key, X
} from '@/lib/icons';
import type { BlackRoomType, BlackRoomSubscription } from '../types';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import WavePaymentModal from '../components/WavePaymentModal';

interface RoomFeatures {
  icon: string;
  title: string;
  description: string;
}

const getRoomFeatures = (type: BlackRoomType): RoomFeatures[] => {
  switch (type.public_type) {
    case 'tabous':
      return [
        { icon: '🔒', title: '100% Anonyme', description: 'Votre identité reste secrète' },
        { icon: '💬', title: 'Discussions Libres', description: 'Parlez sans tabou ni jugement' },
        { icon: '🎭', title: 'Masques Virtuels', description: 'Protection totale de votre identité' },
        { icon: '⚡', title: 'Auto-Destruction', description: 'Contenu éphémère sécurisé' },
      ];
    case 'confessions':
      return [
        { icon: '💔', title: 'Sans Jugement', description: 'Un espace bienveillant' },
        { icon: '🤝', title: 'Soutien Mutuel', description: 'Communauté solidaire' },
        { icon: '🛡️', title: 'Confidentialité', description: 'Vos secrets sont protégés' },
        { icon: '✨', title: 'Libération', description: 'Libérez-vous en toute sécurité' },
      ];
    case 'sexualite':
      return [
        { icon: '💋', title: 'Respect Mutuel', description: 'Dans un cadre bienveillant' },
        { icon: '🎯', title: 'Éducation', description: 'Informations et échanges' },
        { icon: '🔐', title: 'Discret', description: 'Vie privée garantie' },
        { icon: '🌟', title: 'Bienveillance', description: 'Communauté respectueuse' },
      ];
    case 'senegal_actualites':
      return [
        { icon: '📰', title: 'Actualités', description: 'Débats sur le Sénégal' },
        { icon: '💭', title: 'Opinions Libres', description: 'Exprimez-vous sans crainte' },
        { icon: '🌍', title: 'Perspectives', description: 'Points de vue variés' },
        { icon: '🎤', title: 'Débats', description: 'Discussions constructives' },
      ];
    case 'vff':
      return [
        { icon: '💜', title: 'Écoute & Soutien', description: 'Vous n\'êtes pas seule' },
        { icon: '🛡️', title: 'Sécurité Totale', description: 'Anonymat garanti à 100%' },
        { icon: '📞', title: 'Ressources d\'Aide', description: 'Numéros d\'urgence disponibles' },
        { icon: '🤝', title: 'Solidarité', description: 'Communauté bienveillante' },
      ];
    default:
      return [];
  }
};

const getRoomDescription = (type: BlackRoomType): string => {
  switch (type.public_type) {
    case 'tabous':
      return 'Plongez dans un espace où tous les sujets sont permis. Discutez librement de ce qui vous préoccupe, sans peur du jugement. Ici, votre anonymat est votre bouclier.';
    case 'confessions':
      return 'Un sanctuaire numérique où vos confessions trouvent une oreille attentive. Partagez vos cris du cœur, vos secrets, vos peines. Ici, vous n\'êtes pas seul.';
    case 'sexualite':
      return 'Un espace d\'échange respectueux et éducatif sur la sexualité. Posez vos questions, partagez vos expériences, apprenez dans un environnement bienveillant et anonyme.';
    case 'senegal_actualites':
      return 'Débattre librement de l\'actualité sénégalaise. Politique, économie, société - exprimez vos opinions sans crainte. Votre anonymat vous protège.';
    case 'vff':
      return 'Un refuge sécurisé pour les victimes de violences. Parlez, témoignez, trouvez du soutien. Ici, vous êtes entendue, protégée et accompagnée. Vous n\'êtes pas seule. 💜';
    default:
      return type.description;
  }
};

export default function ChambresNoires() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [types, setTypes] = useState<BlackRoomType[]>([]);
  const [subscriptions, setSubscriptions] = useState<BlackRoomSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [currentSubscribingType, setCurrentSubscribingType] = useState<BlackRoomType | null>(null);
  const [currentInfoRoomId, setCurrentInfoRoomId] = useState<number | null>(null);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const infoTimeoutRef = useRef<number | null>(null);
  const [showVffModal, setShowVffModal] = useState(false);

  useEffect(() => {
    fetchTypes();
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchTypes = async () => {
    try {
      const response = await api.get('/black-room-types');
      setTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching black room types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/black-room-subscriptions');
      setSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const isSubscribed = (typeId: number): boolean => {
    return subscriptions.some(sub => sub.black_room?.public_type === types.find(t => t.id === typeId)?.public_type);
  };

  const handleSubscribe = async (type: BlackRoomType) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Guard: only public types that require subscription and are active can be subscribed
    if (type.type !== 'public' || !type.requires_subscription || !type.is_active) {
      alert('Cette chambre ne peut pas être souscrite via cette action.');
      return;
    }

    try {
      const response = await api.post(`/black-room-types/${type.id}/subscribe`);

      // Vérifier si c'est le mode test
      const isTestMode = response.data.message?.includes('Mode Test');

      setCurrentSubscribingType(type);

      // Configurer les données pour le modal Wave
      const paymentInfo = {
        payment_code: response.data.data?.payment_code || response.data.data?.payment?.payment_code || '',
        wave_url: response.data.data?.wave_url || 'https://pay.wave.com/m/M_sn_OrBEDgUMGWxY/c/sn/',
        amount: response.data.data?.amount || response.data.data?.payment?.amount || 0,
        isTestMode: isTestMode,
      };
      setPaymentData(paymentInfo);
      setShowPaymentModal(true);

      // Rafraîchir les abonnements
      fetchSubscriptions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'abonnement');
    }
  };

  const handlePaymentVerified = () => {
    fetchSubscriptions();
    setShowPaymentModal(false);
    // Rediriger vers la chambre seulement si l'utilisateur clique explicitement
    if (currentSubscribingType) {
      navigate(`/black-rooms/${currentSubscribingType.slug}`);
    }
    setPaymentData(null);
    setCurrentSubscribingType(null);
  };

  const getRoomGradient = (type: BlackRoomType): string => {
    switch (type.public_type) {
      case 'tabous':
        return 'from-purple-900/40 via-pink-900/40 to-purple-900/40';
      case 'confessions':
        return 'from-blue-900/40 via-indigo-900/40 to-purple-900/40';
      case 'sexualite':
        return 'from-pink-900/40 via-rose-900/40 to-red-900/40';
      case 'senegal_actualites':
        return 'from-green-900/40 via-emerald-900/40 to-teal-900/40';
      case 'vff':
        return 'from-purple-900/50 via-violet-900/40 to-fuchsia-900/40';
      default:
        return 'from-gray-900/40 via-slate-900/40 to-gray-900/40';
    }
  };

  const getRoomGlow = (type: BlackRoomType): string => {
    switch (type.public_type) {
      case 'tabous':
        return 'shadow-[0_0_30px_rgba(168,85,247,0.4)]';
      case 'confessions':
        return 'shadow-[0_0_30px_rgba(59,130,246,0.4)]';
      case 'sexualite':
        return 'shadow-[0_0_30px_rgba(236,72,153,0.4)]';
      case 'senegal_actualites':
        return 'shadow-[0_0_30px_rgba(16,185,129,0.4)]';
      case 'vff':
        return 'shadow-[0_0_40px_rgba(167,139,250,0.5)]';
      default:
        return 'shadow-[0_0_30px_rgba(139,92,246,0.4)]';
    }
  };

  const filteredTypes = selectedType === 'tous' 
    ? types 
    : types.filter(t => {
        if (selectedType === 'public') return t.type === 'public';
        if (selectedType === 'private') return t.type === 'private';
        if (selectedType === 'creator') return t.type === 'creator_vip';
        return true;
      });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                Les <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Chambres Noires</span>
              </h1>
            </div>
            
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-4 leading-relaxed">
              Entrez dans des espaces <span className="font-semibold text-purple-300">ultra-sécurisés</span> où votre anonymat est{' '}
              <span className="font-semibold text-pink-300">garanti à 100%</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-white/90 text-sm font-medium">Cryptage End-to-End</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-white/90 text-sm font-medium">Anonymat Total</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white/90 text-sm font-medium">Auto-Destruction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          {/* Categories Filter */}
        <div className="flex justify-center flex-wrap gap-3 mb-12">
          {[
            { id: 'tous', label: 'Toutes', icon: Globe },
            { id: 'public', label: 'Publiques', icon: Users },
            { id: 'private', label: 'Privées', icon: Key },
            { id: 'creator', label: 'Créateurs', icon: Crown },
          ].map((cat) => {
            const Icon = cat.icon;
              return (
                <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`group relative px-6 py-3 rounded-xl transition-all duration-300 ${
                  selectedType === cat.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/15 border border-white/20'
                }`}
              >
                <Icon className={`w-5 h-5 inline mr-2 ${selectedType === cat.id ? 'animate-pulse' : ''}`} />
                <span className="font-semibold">{cat.label}</span>
                {selectedType === cat.id && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-full"></div>
                )}
                </button>
              );
            })}
          </div>

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTypes.map((type) => {
            const subscribed = isSubscribed(type.id);
            const features = getRoomFeatures(type);
            const isHovered = hoveredRoom === type.id;
            const canSubscribe = type.type === 'public' && type.requires_subscription && type.is_active;
            const isCreatorVip = type.type === 'creator_vip';
            const disabledSubscribe = !subscribed && !canSubscribe && !isCreatorVip;
            
            return (
              <div
                key={type.id}
                onMouseEnter={() => setHoveredRoom(type.id)}
                onMouseLeave={() => setHoveredRoom(null)}
                className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-500 transform ${
                  subscribed 
                    ? 'border-green-500/50 bg-gradient-to-br from-green-900/30 to-emerald-900/30' 
                    : `border-white/20 bg-gradient-to-br ${getRoomGradient(type)}`
                } ${isHovered ? 'scale-105 -translate-y-2 ' + getRoomGlow(type) : 'hover:scale-102'} backdrop-blur-xl`}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRoomGradient(type)} animate-pulse`}></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        </div>

                {/* Content */}
                <div className="relative p-6">
                  {/* Header */}
              <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`relative ${isHovered ? 'animate-bounce' : ''}`}>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                          {type.icon || '🔒'}
                        </div>
                  </div>
                  {/* inline info for VIP creator rooms will render below CTA */}
                  <div>
                        <h3 className="text-xl font-bold text-white mb-1">{type.name}</h3>
                        {type.badge && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded-full text-xs font-semibold text-purple-200">
                            <Sparkles className="w-3 h-3" />
                            {type.badge}
                  </span>
                )}
              </div>
                </div>
                    {subscribed && (
                      <div className="flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/50">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 text-xs font-semibold">Actif</span>
                </div>
                    )}
              </div>

              {/* Description */}
                  <p className="text-white/80 text-sm mb-6 leading-relaxed min-h-[60px]">
                    {getRoomDescription(type)}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {features.slice(0, 4).map((feature, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="text-2xl mb-1">{feature.icon}</div>
                        <div className="text-white font-semibold text-xs mb-0.5">{feature.title}</div>
                        <div className="text-white/60 text-[10px] leading-tight">{feature.description}</div>
                      </div>
                ))}
              </div>

                  {/* Stats & Price */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white/70 text-xs">Communauté</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-white/70 text-xs">Sécurisé</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {type.monthly_price ? (
                        <>
                          <div className="text-2xl font-bold text-white">{type.monthly_price.toLocaleString()}</div>
                          <div className="text-white/60 text-xs">FCFA/mois</div>
                        </>
                      ) : type.access_price ? (
                        <>
                          <div className="text-2xl font-bold text-white">{type.access_price.toLocaleString()}</div>
                          <div className="text-white/60 text-xs">FCFA</div>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* CTA Button */}
                  {type.type === 'private' ? (
                    <button
                      onClick={() => navigate('/create-private-room')}
                      className="w-full group/btn relative overflow-hidden py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 group-hover/btn:animate-spin" />
                        Créer ma Chambre
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (subscribed) {
                          navigate(`/black-rooms/${type.slug}`);
                        } else {
                          if (isCreatorVip) {
                            setInfoModalMessage("Cette chambre VIP est en cours de déploiement. Elle sera bientôt disponible pour les créateurs — restez à l'écoute ! 💜");
                            setCurrentInfoRoomId(type.id);
                            if (infoTimeoutRef.current) {
                              window.clearTimeout(infoTimeoutRef.current);
                            }
                            infoTimeoutRef.current = window.setTimeout(() => {
                              setCurrentInfoRoomId(null);
                            }, 4000);
                          } else if (!canSubscribe) {
                            alert('Cette chambre n\'est pas disponible pour souscription en ligne.');
                          } else {
                            handleSubscribe(type);
                          }
                        }
                      }}
                      disabled={disabledSubscribe}
                      title={disabledSubscribe ? 'Cette chambre n\'est pas disponible pour souscription' : undefined}
                      className={`w-full group/btn relative overflow-hidden py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg ${disabledSubscribe ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl'} ${
                        subscribed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                          : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {subscribed ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Accéder Maintenant
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            Débloquer l'Accès
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>
                  )}
                  {/* "Je suis invité" only for Sama Chambre Noire (case-insensitive match on name) */}
                  {!subscribed && ((type.name || '').toLowerCase().includes('sama')) && (
                    <div className="mt-3">
                      <button
                        onClick={() => navigate('/join-private-room')}
                        className="w-full py-3 bg-white/6 hover:bg-white/12 border border-white/10 rounded-xl text-white font-medium"
                      >
                        Je suis invité
                      </button>
                    </div>
                  )}
                  {/* Inline info banner for creator_vip only on clicked card */}
                  {currentInfoRoomId === type.id && type.type === 'creator_vip' && (
                    <div className="mt-4 p-3 bg-purple-900/80 border border-purple-600/40 rounded-lg text-purple-100 text-sm">
                      {infoModalMessage}
                    </div>
                  )}
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* VFF Special Section - Emergency Resources */}
        <div className="mt-16 relative overflow-hidden rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-900/50 via-purple-900/40 to-fuchsia-900/40 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(167,139,250,0.4),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(232,121,249,0.3),transparent_50%)]"></div>
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
                  <div className="relative w-28 h-28 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <span className="text-6xl">💜</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Violences Faites aux Femmes
                </h2>
                <p className="text-xl text-violet-300 font-semibold mb-4">
                  Vous n'êtes pas seule. De l'aide est disponible.
                </p>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  Si vous êtes victime ou témoin de violences, ces numéros peuvent vous aider. 
                  <span className="font-semibold text-violet-300"> N'hésitez jamais à appeler.</span>
                </p>
                
                {/* Emergency Numbers Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: '🚔', name: 'Police Secours', number: '17', urgent: true },
                    { icon: '📞', name: 'Gendarmerie', number: '800 00 20 20' },
                    { icon: '🚑', name: 'SAMU', number: '1515' },
                    { icon: '🚒', name: 'Pompiers', number: '18' },
                    { icon: '⚖️', name: 'AJS (Juristes)', number: '33 823 52 12' },
                    { icon: '💜', name: 'CLVF', number: '33 869 10 30' },
                  ].map((item, idx) => (
                    <a
                      key={idx}
                      href={`tel:${item.number.replace(/\s/g, '')}`}
                      className={`group bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 ${
                        item.urgent 
                          ? 'border-red-500/50 hover:border-red-400' 
                          : 'border-white/20 hover:border-violet-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                        <div>
                          <div className="text-white/70 text-xs">{item.name}</div>
                          <div className={`font-bold ${item.urgent ? 'text-red-400' : 'text-violet-300'}`}>{item.number}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => setShowVffModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500/70 to-fuchsia-500/70 hover:from-violet-600/70 hover:to-fuchsia-600/70 text-white rounded-xl font-bold transition shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-xl">💜</span>
                    Accéder à l'Espace de Soutien
                    <span className="text-xs bg-violet-900/50 px-2 py-0.5 rounded-full ml-2">Bientôt</span>
                  </button>
                  <button
                    disabled
                    className="px-6 py-3 bg-white/10 text-white/50 rounded-xl font-semibold border border-white/20 cursor-not-allowed flex items-center justify-center gap-2"
                    title="Bientôt disponible"
                  >
                    <span className="text-xl">🤝</span>
                    Devenir Association d'Aide
                    <span className="text-xs bg-violet-500/30 px-2 py-0.5 rounded-full">Bientôt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="mt-8 relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.3),transparent_50%)]"></div>
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Votre <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Sécurité</span> est Notre Priorité
                </h2>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  Chaque chambre est protégée par un cryptage de niveau militaire. Vos conversations sont anonymes, 
                  vos données sont éphémères, et votre identité reste un secret absolu. 
                  <span className="font-semibold text-purple-300"> C'est notre promesse.</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: '🔐', text: 'Cryptage AES-256' },
                    { icon: '👁️', text: 'Anonymat Total' },
                    { icon: '⚡', text: 'Auto-Destruction' },
                    { icon: '🛡️', text: 'Zero Logs' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="text-white/90 text-sm font-medium">{item.text}</div>
            </div>
          ))}
        </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Payment Modal */}
      {showPaymentModal && paymentData && (
        <WavePaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
          }}
          paymentData={paymentData}
          onPaymentVerified={handlePaymentVerified}
        />
      )}

      {/* VFF Coming Soon Modal */}
      {showVffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-gradient-to-br from-violet-900/90 via-purple-900/90 to-fuchsia-900/90 rounded-3xl border-2 border-violet-500/50 shadow-2xl animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setShowVffModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto">
                  <span className="text-5xl">💜</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-3">
                Espace de Soutien Bientôt Disponible
              </h3>

              {/* Message */}
              <p className="text-violet-200 text-base leading-relaxed mb-2">
                Cette chambre sera accessible une fois que nous aurons reçu des demandes d'associations d'aide.
              </p>
              <p className="text-violet-200/80 text-sm leading-relaxed mb-6">
                Nous travaillons pour vous offrir un espace de soutien de qualité avec des professionnels. Merci de votre patience ! 💜
              </p>

              {/* Button */}
              <button
                onClick={() => setShowVffModal(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl font-bold transition shadow-lg hover:shadow-xl"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
