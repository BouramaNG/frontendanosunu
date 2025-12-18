import { X, User, LogIn } from '@/lib/icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
}

export default function LoginRequiredModal({ isOpen, onClose, onLogin }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Fermer" className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4">
          <div className="w-20 h-20 rounded-full bg-pink-500/20 mx-auto flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-pink-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nio gui Diegalou fok gua connecter</h3>
          <p className="text-white/70 mb-6">Désolé, il faut vous connecter pour accéder à cette catégorie.</p>

          <div className="flex justify-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-white/80 border border-white/10">Fermer</button>
            <button
              onClick={() => { onLogin?.(); onClose(); }}
              className="px-4 py-2 rounded-xl bg-pink-500 text-white font-semibold flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
