import React from 'react';
import { CheckCircle, Heart, Shield, Zap } from '@/lib/icons';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatar: string;
}

export default function WelcomeModal({ isOpen, onClose, username, avatar }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Success icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Bienvenue dans l'anonymat ! 🎭
            </h2>
          </div>

          {/* User info */}
          <div className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="text-3xl mb-2">{avatar}</div>
            <p className="text-white/90 font-medium">
              Votre identité anonyme : <span className="text-pink-400 font-bold">{username}</span>
            </p>
          </div>

          {/* Encouraging messages */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-white/90">
              <Heart className="w-5 h-5 text-pink-400 flex-shrink-0" />
              <p className="text-sm">Votre anonymat est notre priorité absolue</p>
            </div>

            <div className="flex items-center space-x-3 text-white/90">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-sm">Exprimez-vous librement sans jugement</p>
            </div>

            <div className="flex items-center space-x-3 text-white/90">
              <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-sm">Rejoignez une communauté bienveillante</p>
            </div>
          </div>

          {/* Encouraging text */}
          <div className="mb-8">
            <p className="text-white/80 text-sm leading-relaxed">
              🎭 <strong>L'anonymat vous libère</strong> - Partagez vos pensées les plus profondes,
              posez les questions que vous n'oseriez jamais poser ailleurs, et découvrez
              une communauté qui vous comprend vraiment.
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30"
          >
            Commencer mon aventure anonyme 🚀
          </button>

          <p className="text-white/60 text-xs mt-4">
            Vous serez automatiquement redirigé vers la connexion
          </p>
        </div>
      </div>
    </div>
  );
}
