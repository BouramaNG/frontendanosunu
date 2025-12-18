import React, { useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

type Mode = 'create' | 'update';

interface SetPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: Mode;
}

export default function SetPinModal({ isOpen, onClose, mode = 'create' }: SetPinModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const user = useAuthStore((state) => state.user);

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    setPin('');
    setConfirmPin('');
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

    if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
      setError('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Les deux codes PIN ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/keychain/pin', {
        pin,
        pin_confirmation: confirmPin,
      });

      const hasKeychainPin = response.data?.has_keychain_pin;
      const token = localStorage.getItem('auth_token');

      if (user && token) {
        hydrateSession({ user: { ...user, has_keychain_pin: hasKeychainPin ?? true }, token, recordLoginAt: false });
      }

      handleClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Impossible d\'enregistrer le code PIN. Veuillez réessayer.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="relative max-w-md w-full mx-4 rounded-3xl border border-white/20 bg-gradient-to-br from-purple-950 to-pink-950 p-8 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-6 top-6 text-white/40 hover:text-white transition"
        >
          ✕
        </button>

        <div className="text-center text-white space-y-3">
          <div className="text-5xl">🔐</div>
          <h2 className="text-2xl font-bold">{mode === 'update' ? 'Mettre à jour votre PIN' : 'Créer votre code PIN'}</h2>
          <p className="text-sm text-white/70">
            Choisissez un code PIN à 4 chiffres. Il vous permettra de déverrouiller rapidement votre trousseau sans votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2" htmlFor="pin">
              Code PIN (4 chiffres)
            </label>
            <input
              id="pin"
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

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2" htmlFor="pin-confirmation">
              Confirmez votre PIN
            </label>
            <input
              id="pin-confirmation"
              type="password"
              maxLength={4}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, ''));
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
            {loading ? 'Enregistrement…' : mode === 'update' ? 'Mettre à jour le PIN' : 'Enregistrer le PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
