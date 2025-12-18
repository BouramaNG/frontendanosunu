import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Key, ArrowLeft, Users, AlertCircle } from '@/lib/icons';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function JoinPrivateRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookupResult, setLookupResult] = useState<null | any>(null);
  const [confirming, setConfirming] = useState(false);
  const [roomSlug, setRoomSlug] = useState<string | null>(null);

  const link = searchParams.get('link');

  // Function to render error/success message with better styling
  const renderErrorMessage = (errorMsg: string) => {
    const isRoomFull = errorMsg?.includes('Chambre complète') || errorMsg?.includes('Nekk bi fess na');
    const isWelcomeBack = errorMsg?.includes('Bienvenue de retour');
    const isInvalidCode = errorMsg?.includes('Code invalide');
    const isExpired = errorMsg?.includes('expiré') || errorMsg?.includes('expirée');
    const isAlreadyMember = errorMsg?.includes('Vous êtes déjà');
    const isPendingRequest = errorMsg?.includes('déjà en attente') || errorMsg?.includes('Votre demande d\'accès est déjà');
    const isRequestRejected = errorMsg?.includes('a été rejetée');

    // SUCCESS: Welcome back message
    if (isWelcomeBack) {
      return (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-4 mb-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <div className="text-green-200 font-bold text-lg">Bienvenue de retour!</div>
              <div className="text-green-200/90 text-sm mt-1">Vous avez été réintégré à la chambre avec succès.</div>
              <div className="text-green-200/70 text-xs mt-2">Vous êtes prêt à participer à la discussion! 🚀</div>
            </div>
          </div>
        </div>
      );
    }

    if (isRoomFull) {
      return (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔴</div>
            <div className="flex-1">
              <div className="text-red-200 font-semibold">Chambre complète</div>
              <div className="text-red-200/80 text-sm mt-1">Nekk bi fess na 🚫</div>
              <div className="text-red-200/70 text-xs mt-2">Cette chambre a atteint sa capacité maximale. Essayez une autre chambre.</div>
            </div>
          </div>
        </div>
      );
    }

    if (isRequestRejected) {
      return (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">❌</div>
            <div className="flex-1">
              <div className="text-red-200 font-semibold">Demande rejetée</div>
              <div className="text-red-200/80 text-sm mt-1">Votre demande d'accès a été rejetée par le créateur.</div>
              <div className="text-red-200/70 text-xs mt-2">Vous ne pouvez pas rejoindre cette chambre.</div>
            </div>
          </div>
        </div>
      );
    }

    if (isPendingRequest) {
      return (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⏳</div>
            <div className="flex-1">
              <div className="text-yellow-200 font-semibold">Demande en attente</div>
              <div className="text-yellow-200/80 text-sm mt-1">Votre demande est déjà en attente d'approbation.</div>
              <div className="text-yellow-200/70 text-xs mt-2">Le créateur examinera votre demande bientôt.</div>
            </div>
          </div>
        </div>
      );
    }

    if (isInvalidCode) {
      return (
        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <div className="text-orange-200 font-semibold">Code invalide</div>
              <div className="text-orange-200/80 text-sm mt-1">Vérifiez le code d'accès et réessayez</div>
            </div>
          </div>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⏰</div>
            <div className="flex-1">
              <div className="text-blue-200 font-semibold">Chambre expirée</div>
              <div className="text-blue-200/80 text-sm mt-1">Cette chambre n'existe plus. Elle a probablement été détruite.</div>
            </div>
          </div>
        </div>
      );
    }

    if (isAlreadyMember) {
      return (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div className="flex-1">
              <div className="text-green-200 font-semibold">Vous êtes déjà membre</div>
              <div className="text-green-200/80 text-sm mt-1">Vous faites déjà partie de cette chambre</div>
            </div>
          </div>
        </div>
      );
    }

    // Default error message
    return (
      <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-1" />
          <div>
            <div className="text-red-200 font-semibold">Erreur</div>
            <div className="text-red-200/80 text-sm mt-1">{errorMsg}</div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Si un lien est fourni, rejoindre automatiquement
    if (link && user) {
      joinByLink();
    }
  }, [link, user]);

  const joinByLink = async () => {
    if (!link || !user) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/black-rooms/join/${link}`);
      
      // If reactivated, show success message and wait 2 seconds before navigating
      if (response.data.reactivated) {
        setError(response.data.message); // Display as success message
        setTimeout(() => {
          navigate(`/black-rooms/${response.data.data.slug}`);
        }, 2000);
      } else {
        // Normal join, navigate directly
        navigate(`/black-rooms/${response.data.data.slug}`);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const joinByCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (accessCode.length !== 6) {
      setError('Le code doit contenir 6 caractères');
      return;
    }

    // First, call lookup endpoint to get inviter info
    setLoading(true);
    setError('');
    setLookupResult(null);
    try {
      const res = await api.get(`/black-rooms/lookup-by-code/${accessCode}`);
      setLookupResult(res.data.data);
      setConfirming(true);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('lookup error', err?.response?.data || err);
      setError(err.response?.data?.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const confirmJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!lookupResult) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/black-rooms/join-by-code', {
        access_code: accessCode.toUpperCase(),
      });

      // Extract slug safely (try multiple paths)
      const slug = 
        lookupResult?.black_room?.slug ||
        response?.data?.data?.black_room?.slug ||
        response?.data?.data?.slug;

      if (!slug) {
        console.error('confirmJoin: could not extract slug', { lookupResult, response });
        setError('Erreur: impossible de charger la chambre');
        return;
      }

      // If reactivated, show success message and wait 2 seconds before navigating
      if (response.data.reactivated) {
        setError(response.data.message); // Display as success message
        setTimeout(() => {
          navigate(`/black-rooms/${slug}`);
        }, 2000);
        return;
      }

      // If 202: request is pending, start polling for approval
      if (response.status === 202) {
        setRoomSlug(slug);
        setLookupResult((prev: any) => ({
          ...prev,
          join_request: response.data.data.join_request,
          status: 'pending',
        }));
        pollForApproval(slug);
        return;
      }

      // Otherwise navigate directly
      navigate(`/black-rooms/${slug}`);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const pollForApproval = (slug: string) => {
    if (!slug) {
      setError('Erreur: impossible de démarrer la vérification');
      return;
    }

    setConfirming(false); // Hide confirmation, show waiting
    let pollCount = 0;
    const maxPolls = 60; // Max 3 minutes (60 * 3 seconds)
    
    const interval = setInterval(async () => {
      pollCount++;
      try {
        const res = await api.get(`/black-rooms/${slug}/my-join-request`);
        if (res.data.data) {
          const status = res.data.data.status;
          if (status === 'approved') {
            clearInterval(interval);
            navigate(`/black-rooms/${slug}`);
          } else if (status === 'rejected') {
            clearInterval(interval);
            setError('Votre demande a été rejetée par le créateur');
            setLookupResult(null);
            setAccessCode('');
            setRoomSlug(null);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.debug('poll error (transient)', err);
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setError('Délai d\'attente dépassé. Veuillez réessayer.');
        setRoomSlug(null);
      }
    }, 3000); // Poll every 3 seconds
  };

  if (loading && link) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-6">
      <div className="max-w-md mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/chambres-noires')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Rejoindre une Chambre Privée</h1>
            <p className="text-white/70">Entrez le code d'accès ou utilisez le lien d'invitation</p>
          </div>

          {error && renderErrorMessage(error)}

          <form onSubmit={joinByCode} className="space-y-4">
            <div>
              <label className="block text-white/80 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Code d'accès (6 caractères)
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                  setAccessCode(value);
                  setError('');
                }}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || accessCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>
          </form>

          {/* Confirmation step */}
          {confirming && lookupResult && (
            <div className="mt-6 bg-white/3 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {lookupResult.creator?.username ? lookupResult.creator.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <div className="text-white font-semibold">{lookupResult.creator?.username || 'Inconnu'}</div>
                  <div className="text-white/70 text-sm">Vous a invité dans "{lookupResult.black_room?.name}"</div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-2 border border-white/10 text-white rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmJoin}
                  className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
                >
                  {loading ? 'Connexion...' : 'Confirmer et rejoindre'}
                </button>
              </div>
            </div>
          )}

          {/* Pending approval state */}
          {lookupResult?.status === 'pending' && (
            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
              <div className="text-white font-semibold">En attente d'approbation</div>
              <div className="text-white/70 text-sm mt-2">
                {lookupResult.creator?.username} examine votre demande...
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm text-center">
              Vous avez reçu un lien d'invitation ?<br />
              Cliquez dessus pour rejoindre automatiquement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

