import { useEffect } from 'react';
import { CheckCircle, X } from '@/lib/icons';

interface SuccessModalProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number; // durée en millisecondes
  title?: string;
  subtitle?: string;
}

export default function SuccessModal({
  message,
  isOpen,
  onClose,
  duration = 2000,
  title = 'Action réussie',
  subtitle = 'Tout est synchronisé. ✨',
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-green-900/90 border border-green-500/30 rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-green-400 hover:text-green-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenu du modal */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-8 h-8 text-green-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-green-200 text-sm uppercase tracking-[0.3em]">{title}</p>
            <p className="text-green-100 font-medium mt-1">{message}</p>
            {subtitle && (
              <p className="text-green-300/80 text-sm mt-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Barre de progression animée */}
        <div className="mt-4 bg-green-800/50 rounded-full h-1 overflow-hidden">
          <div
            className="bg-green-400 h-full rounded-full animate-pulse"
            style={{
              width: '100%',
              animationName: 'success-modal-shrink',
              animationDuration: `${duration}ms`,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
            }}
          />
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes success-modal-shrink { from { width: 100%; } to { width: 0%; } }`,
        }}
      />
    </div>
  );
}
