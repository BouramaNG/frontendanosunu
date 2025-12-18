import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

interface KeychainLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export default function KeychainLoginModal({ isOpen, onClose, onSuccess }: KeychainLoginModalProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    setUsername('');
    setPin('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Veuillez saisir votre nom d\'utilisateur.');
      return;
    }
    if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
      setError('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/keychain/login', {
        username,
        pin,
      });

      const { user, token } = response.data as { user: User; token: string };
      if (!user || !token) {
        throw new Error('Réponse invalide du serveur.');
      }

      // Mettre à jour la session et attendre que l'état soit mis à jour
      await hydrateSession({ user, token, recordLoginAt: true });
      
      // Appeler le callback onSuccess si fourni
      onSuccess?.(user);
      
      // Fermer la modale
      handleClose();
      
      // Attendre un court instant pour s'assurer que l'état est mis à jour
      setTimeout(() => {
        // Rediriger en fonction du rôle
        if (user.role === 'admin') {
          window.location.href = '/anonymous';
        } else {
          window.location.href = '/feed';
        }
      }, 100);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Impossible de déverrouiller votre trousseau. Vérifiez votre code PIN.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="relative max-w-md w-full mx-4 rounded-3xl border border-white/20 bg-gradient-to-br from-purple-950 to-pink-950 p-8 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-6 top-6 text-white/40 hover:text-white transition"
        >
          ✕
        </button>

        <div className="text-center text-white space-y-3">
          <div className="text-5xl">🔑</div>
          <h2 className="text-2xl font-bold">Se connecter avec mon trousseau</h2>
          <p className="text-sm text-white/70">
            Déverrouillez votre session en entrant votre nom d'utilisateur et votre code PIN à 4 chiffres.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2" htmlFor="keychain-username">
              Nom d'utilisateur
            </label>
            <input
              id="keychain-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              placeholder="ano_abc12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2" htmlFor="keychain-pin">
              Code PIN (4 chiffres)
            </label>
            <input
              id="keychain-pin"
              type="password"
              maxLength={4}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              placeholder="••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-white font-semibold shadow-lg shadow-purple-500/30 transition hover:from-pink-600 hover:to-purple-700 disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Déverrouiller mon trousseau'}
          </button>
        </form>
      </div>
    </div>
  );
}
