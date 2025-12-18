import { AlertTriangle, X } from '@/lib/icons';

interface ErrorModalProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function ErrorModal({
  message,
  isOpen,
  onClose,
  title = 'Action impossible',
  subtitle = 'Merci de vérifier les informations avant de réessayer.',
}: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-red-900/90 border border-red-500/30 rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenu du modal */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-400 animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="text-red-200 text-sm uppercase tracking-[0.3em]">{title}</p>
            <p className="text-red-100 font-medium mt-1">{message}</p>
            {subtitle && (
              <p className="text-red-400/70 text-xs mt-2">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Bouton de fermeture manuel */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-red-100 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
