import React, { useEffect } from 'react';
import { CheckCircle, Crown, Star } from '@/lib/icons';

interface LoginSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatar: string;
}

export default function LoginSuccessModal({ isOpen, onClose, username, avatar }: LoginSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 7 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-emerald-900/90 via-green-900/90 to-teal-900/90 backdrop-blur-lg border border-emerald-400/30 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
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
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 animate-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            {/* Main Wolof message */}
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-emerald-400 to-green-400 mb-2 animate-pulse">
              AKSIL ak Jamm
            </h1>

            {/* Subtitle */}
            <h2 className="text-xl font-semibold text-white mb-4">
              Seu Identité virtuelle
            </h2>

            <p className="text-emerald-300 font-bold text-lg mb-2">
              YAY BOROM
            </p>
          </div>

          {/* User info */}
          <div className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="text-4xl mb-3">{avatar}</div>
            <p className="text-white text-lg font-medium">
              Bienvenue, <span className="text-emerald-400 font-bold">{username}</span>
            </p>
            <p className="text-emerald-300 text-sm mt-1">
              Votre identité virtuelle vous attend
            </p>
          </div>

          {/* Encouraging elements */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1 text-emerald-300">
              <Crown className="w-4 h-4" />
              <span className="text-xs">BOROM</span>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
              <Star className="w-4 h-4" />
              <span className="text-xs">YAY</span>
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <Star className="w-4 h-4" />
              <span className="text-xs">AKSIL</span>
            </div>
          </div>

          {/* Timer indicator */}
          <div className="mb-6">
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full animate-pulse"
                style={{
                  width: '100%',
                  animation: 'pulse 1s ease-in-out infinite'
                }}
              />
            </div>
            <p className="text-white/60 text-xs">
              Redirection automatique dans 7 secondes...
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/30"
          >
            Entrer dans mon espace virtuel 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
