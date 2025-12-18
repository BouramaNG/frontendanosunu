import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Clock, User, Calendar, Globe, Eye, MessageCircle } from '@/lib/icons';

interface ModeratorRequest {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  availability: string;
  age_range: string;
  timezone: string;
  motivation: string;
  experience?: string;
  languages?: string[];
  documents?: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    avatar_url?: string;
  };
}

export default function AdminModeration() {
  const [requests, setRequests] = useState<ModeratorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ModeratorRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/admin/moderator-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        console.error('Erreur lors du chargement des demandes');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!reviewNotes.trim()) {
      alert('Veuillez ajouter des notes de révision');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/admin/moderator-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          review_notes: reviewNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Demande approuvée ! Nouvel username: ${data.new_username}`);
        setReviewNotes('');
        setSelectedRequest(null);
        fetchRequests(); // Recharger la liste
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (requestId: number) => {
    if (!reviewNotes.trim()) {
      alert('Veuillez expliquer pourquoi vous refusez cette demande');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/admin/moderator-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          review_notes: reviewNotes
        })
      });

      if (response.ok) {
        alert('Demande rejetée');
        setReviewNotes('');
        setSelectedRequest(null);
        fetchRequests(); // Recharger la liste
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du rejet');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des demandes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Administration - Demandes de Modération</h1>
          </div>
          <p className="text-white/70">Gérez les demandes de modération de la communauté</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Filtres et statistiques */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filtres */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Filtres</h3>
              <div className="space-y-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      filter === status
                        ? 'bg-purple-500/30 text-white border border-purple-400/50'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {status === 'all' ? 'Toutes' : status === 'pending' ? 'En attente' : status === 'approved' ? 'Approuvées' : 'Rejetées'}
                    {status === 'pending' && (
                      <span className="ml-auto bg-yellow-400/30 text-yellow-300 px-2 py-1 rounded-full text-xs">
                        {requests.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total demandes</span>
                  <span className="text-white font-semibold">{requests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">En attente</span>
                  <span className="text-yellow-400 font-semibold">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400">Approuvées</span>
                  <span className="text-green-400 font-semibold">
                    {requests.filter(r => r.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400">Rejetées</span>
                  <span className="text-red-400 font-semibold">
                    {requests.filter(r => r.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des demandes */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">
                Demandes de modération {filter !== 'all' && `(${filter})`}
              </h2>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">Aucune demande {filter !== 'all' ? filter : ''}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{request.user.username}</h3>
                            <p className="text-white/60 text-sm">{request.full_name}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{request.status}</span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Disponibilité:</span>
                          <p className="text-white">{request.availability}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Âge:</span>
                          <p className="text-white">{request.age_range}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Fuseau horaire:</span>
                          <p className="text-white">{request.timezone}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Date:</span>
                          <p className="text-white">{new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/70 text-sm line-clamp-2">{request.motivation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de détails */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Détails de la demande</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations utilisateur */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Informations utilisateur</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-white/60">Nom complet:</span>
                      <p className="text-white">{selectedRequest.full_name}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Email:</span>
                      <p className="text-white">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Username:</span>
                      <p className="text-white">{selectedRequest.user.username}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Date de demande:</span>
                      <p className="text-white">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Informations de candidature */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Informations de candidature</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-white/60">Disponibilité:</span>
                      <p className="text-white">{selectedRequest.availability}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Tranche d'âge:</span>
                      <p className="text-white">{selectedRequest.age_range}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Fuseau horaire:</span>
                      <p className="text-white">{selectedRequest.timezone}</p>
                    </div>
                    {selectedRequest.languages && (
                      <div>
                        <span className="text-white/60">Langues:</span>
                        <p className="text-white">{selectedRequest.languages.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Motivation */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Motivation</h3>
                  <p className="text-white/80 whitespace-pre-wrap">{selectedRequest.motivation}</p>
                </div>

                {/* Expérience (si présente) */}
                {selectedRequest.experience && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3">Expérience</h3>
                    <p className="text-white/80 whitespace-pre-wrap">{selectedRequest.experience}</p>
                  </div>
                )}

                {/* Actions pour les demandes en attente */}
                {selectedRequest.status === 'pending' && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3">Action</h3>
                    <div className="space-y-3">
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Notes de révision (obligatoire pour le rejet)..."
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none"
                        rows={3}
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(selectedRequest.id)}
                          className="flex-1 py-2 px-4 bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 text-green-400 rounded-lg transition flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => handleReject(selectedRequest.id)}
                          className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-400 rounded-lg transition flex items-center justify-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Rejeter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes de révision (si présente) */}
                {selectedRequest.review_notes && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3">Notes de révision</h3>
                    <p className="text-white/80 whitespace-pre-wrap">{selectedRequest.review_notes}</p>
                    {selectedRequest.reviewed_at && (
                      <p className="text-white/60 text-sm mt-2">
                        Révisé le {new Date(selectedRequest.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
