import React from 'react';

interface PinReminderModalProps {
  isOpen: boolean;
  onCreatePin: () => void;
  onLater: () => void;
}

export default function PinReminderModal({ isOpen, onCreatePin, onLater }: PinReminderModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="relative max-w-lg w-full mx-4 rounded-3xl border border-white/20 bg-gradient-to-br from-purple-950 to-pink-950 p-8 shadow-2xl">
        <div className="absolute right-6 top-6 text-5xl">⏰</div>
        <div className="space-y-4 text-white">
          <h2 className="text-2xl font-bold">Protégez votre trousseau</h2>
          <p className="text-sm text-white/70">
            Vous n'avez pas encore défini de code PIN pour verrouiller votre trousseau d'accès. Choisissez un code à 4 chiffres
            pour vous reconnecter rapidement sans mot de passe.
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={onCreatePin}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-white font-semibold shadow-lg shadow-purple-500/30 transition hover:from-pink-600 hover:to-purple-700"
          >
            Créer mon code PIN maintenant
          </button>
          <button
            type="button"
            onClick={onLater}
            className="w-full rounded-xl border border-white/20 bg-white/10 py-3 text-white font-semibold transition hover:bg-white/15"
          >
            Me le rappeler plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
