import { AlertCircle, X } from '@/lib/icons';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="relative w-full max-w-md mx-4">
        <div className="relative bg-gradient-to-br from-purple-950 to-pink-950 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-5 top-5 text-white/40 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDangerous 
                ? 'bg-red-500/20 border border-red-500/30' 
                : 'bg-yellow-500/20 border border-yellow-500/30'
            }`}>
              <AlertCircle className={isDangerous ? 'w-8 h-8 text-red-400' : 'w-8 h-8 text-yellow-400'} />
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>

          {/* Message */}
          <p className="text-white/70 text-center mb-8">{message}</p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full py-3 px-4 font-semibold rounded-xl transition ${
                isDangerous
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg'
              }`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition border border-white/20"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
