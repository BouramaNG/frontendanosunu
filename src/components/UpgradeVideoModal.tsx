import { Video, Zap, Lock, ArrowRight } from '@/lib/icons';

interface UpgradeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeUrl?: string;
}

export default function UpgradeVideoModal({
  isOpen,
  onClose,
  upgradeUrl = '#',
}: UpgradeVideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-purple-500/20">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-purple-600/20 p-4 rounded-full">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Vidéos Premium
        </h2>
        <p className="text-white/60 text-center text-sm mb-6">
          Disponible uniquement en chambres payantes
        </p>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <Video className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-medium text-sm">Vidéos Courtes</h3>
              <p className="text-white/50 text-xs">Jusqu'à 60 secondes</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-medium text-sm">Engagement Max</h3>
              <p className="text-white/50 text-xs">Captez l'attention en vidéo</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-medium text-sm">Contenu Exclusif</h3>
              <p className="text-white/50 text-xs">Réservé à vos membres</p>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4 mb-8 text-center">
          <p className="text-white/70 text-sm mb-1">Upgrade cette chambre</p>
          <p className="text-purple-400 font-bold">
            Créez une version payante avec vidéos
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg text-white font-medium transition"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              window.location.href = upgradeUrl;
            }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-white font-bold transition flex items-center justify-center gap-2"
          >
            Upgrade
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Text */}
        <p className="text-white/40 text-xs mt-6 text-center">
          Les vidéos aident vos messages à être vus 10x plus souvent
        </p>
      </div>
    </div>
  );
}
