import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Phone,
  Hash,
  Volume2,
  VolumeX,
  Bell
} from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

// Notification sound URL (using a free notification sound)
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface Payment {
  id: number;
  payment_code: string;
  transaction_last4: string | null;
  masked_phone: string | null;
  phone_prefix: string | null;
  phone_last2: string | null;
  amount: string;
  status: string;
  payment_method: string;
  created_at: string;
  paid_at: string | null;
  verified_at: string | null;
  user?: {
    id: number;
    name: string | null;
  };
  black_room?: {
    id: number;
    name: string;
    slug: string;
  };
  verified_by?: {
    id: number;
    name: string | null;
  };
}

interface PaymentStats {
  pending: number;
  pending_verification: number;
  completed: number;
  rejected: number;
  failed: number;
  total_revenue: number;
  today_revenue: number;
  this_month_revenue: number;
}

interface PaginationState {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  pending_verification: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  pending_verification: 'À vérifier',
  completed: 'Complété',
  rejected: 'Rejeté',
  failed: 'Échoué',
  cancelled: 'Annulé',
};

export default function AdminPayments() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('pending_verification');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sound notification state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPendingCount, setLastPendingCount] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [soundEnabled]);

  // Check for new payments and play sound
  useEffect(() => {
    if (stats && lastPendingCount !== null) {
      if (stats.pending_verification > lastPendingCount) {
        playNotificationSound();
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('🔔 Nouveau paiement à vérifier', {
            body: `${stats.pending_verification} paiement(s) en attente de vérification`,
            icon: '/favicon.ico',
          });
        }
      }
    }
    if (stats) {
      setLastPendingCount(stats.pending_verification);
    }
  }, [stats, lastPendingCount, playNotificationSound]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      if (statusFilter === 'pending_verification') {
        fetchPayments(pagination?.current_page || 1);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter, pagination?.current_page]);
  
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchPayments();
    fetchStats();
  }, [user, navigate, statusFilter]);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', statusFilter);
      params.append('page', String(page));
      
      if (searchQuery) {
        params.append('payment_code', searchQuery);
      }
      
      const response = await api.get(`/admin/payments?${params.toString()}`);
      setPayments(response.data.data.data || []);
      setPagination({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        per_page: response.data.data.per_page,
        total: response.data.data.total,
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/payments/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (payment: Payment) => {
    setActionLoading(payment.id);
    try {
      await api.post(`/admin/payments/${payment.id}/approve`);
      fetchPayments(pagination?.current_page || 1);
      fetchStats();
      setShowDetailModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (payment: Payment) => {
    setActionLoading(payment.id);
    try {
      await api.post(`/admin/payments/${payment.id}/reject`, {
        reason: rejectReason || 'Paiement non trouvé sur Wave Dashboard',
      });
      fetchPayments(pagination?.current_page || 1);
      fetchStats();
      setShowDetailModal(false);
      setRejectReason('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: string | number) => {
    return Number(amount).toLocaleString('fr-FR');
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-6 bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                💰 Gestion des Paiements Wave
              </h1>
              <p className="text-white/70">
                Vérifiez et validez les paiements en attente
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sound toggle button */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition ${
                  soundEnabled 
                    ? 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30' 
                    : 'bg-white/10 border-white/20 text-white/50 hover:bg-white/15'
                }`}
                title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                {soundEnabled ? 'Son activé' : 'Son désactivé'}
              </button>
              
              {/* Pending badge */}
              {stats && stats.pending_verification > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-xl animate-pulse">
                  <Bell className="w-5 h-5 text-orange-300" />
                  <span className="text-orange-300 font-semibold">
                    {stats.pending_verification} à vérifier
                  </span>
                </div>
              )}
              
              <button
                onClick={() => {
                  fetchPayments();
                  fetchStats();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white transition"
              >
                <RefreshCw className="w-5 h-5" />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-300" />
                </div>
                <span className="text-orange-200 text-sm">À vérifier</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.pending_verification}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                </div>
                <span className="text-green-200 text-sm">Complétés</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.completed}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-300" />
                </div>
                <span className="text-blue-200 text-sm">Aujourd'hui</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatAmount(stats.today_revenue)} <span className="text-lg">FCFA</span></p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-300" />
                </div>
                <span className="text-purple-200 text-sm">Ce mois</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatAmount(stats.this_month_revenue)} <span className="text-lg">FCFA</span></p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Rechercher par code de paiement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  statusFilter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
                }`}
              >
                {label}
                {stats && key === 'pending_verification' && stats.pending_verification > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs">
                    {stats.pending_verification}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white/70">Aucun paiement à vérifier</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Code</th>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Numéro</th>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Transaction</th>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Montant</th>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Chambre</th>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Date</th>
                    <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Statut</th>
                    <th className="text-right px-6 py-4 text-white/60 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-white font-bold">{payment.payment_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-white/80">
                          {payment.masked_phone || `${payment.phone_prefix || '??'} XXX XX ${payment.phone_last2 || '??'}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-yellow-300 font-bold">
                          {payment.transaction_last4 || '----'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-semibold">
                          {formatAmount(payment.amount)} FCFA
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/70 text-sm">
                          {payment.black_room?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/60 text-sm">
                          {formatDate(payment.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[payment.status] || STATUS_COLORS.pending}`}>
                          {STATUS_LABELS[payment.status] || payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowDetailModal(true);
                            }}
                            className="p-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/70 hover:text-white transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {payment.status === 'pending_verification' && (
                            <>
                              <button
                                onClick={() => handleApprove(payment)}
                                disabled={actionLoading === payment.id}
                                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300 transition disabled:opacity-50"
                              >
                                {actionLoading === payment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowDetailModal(true);
                                }}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <p className="text-white/60 text-sm">
                Page {pagination.current_page} sur {pagination.last_page} ({pagination.total} résultats)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchPayments(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 bg-white/10 hover:bg-white/15 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fetchPayments(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-white/10 hover:bg-white/15 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 border-2 border-white/20 rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              Détails du paiement
            </h2>

            {/* Payment Info */}
            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Code de paiement</p>
                    <p className="text-white font-mono font-bold">{selectedPayment.payment_code}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Montant</p>
                    <p className="text-white font-bold">{formatAmount(selectedPayment.amount)} FCFA</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="text-yellow-300 font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Informations à vérifier sur Wave Dashboard
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Numéro
                    </span>
                    <span className="text-white font-mono">
                      Commence par <strong>{selectedPayment.phone_prefix}</strong>, finit par <strong>{selectedPayment.phone_last2}</strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Transaction ID (4 derniers)
                    </span>
                    <span className="text-yellow-300 font-mono font-bold text-lg">
                      {selectedPayment.transaction_last4 || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Date approximative</span>
                    <span className="text-white">{formatDate(selectedPayment.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-xs mb-1">Chambre</p>
                <p className="text-white">{selectedPayment.black_room?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Actions */}
            {selectedPayment.status === 'pending_verification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Raison du rejet (optionnel)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ex: Transaction non trouvée sur Wave"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={2}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedPayment)}
                    disabled={actionLoading === selectedPayment.id}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === selectedPayment.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Approuver
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(selectedPayment)}
                    disabled={actionLoading === selectedPayment.id}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeter
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedPayment(null);
                setRejectReason('');
              }}
              className="w-full mt-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition border border-white/20"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

