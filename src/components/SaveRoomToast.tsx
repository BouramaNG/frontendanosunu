import { X, Star, ArrowRight } from '@/lib/icons';

interface SaveRoomToastProps {
  isVisible: boolean;
  onClose: () => void;
  roomName: string;
  onNavigateToSaved: () => void;
}

export default function SaveRoomToast({
  isVisible,
  onClose,
  roomName,
  onNavigateToSaved,
}: SaveRoomToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-yellow-500/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1 fill-yellow-400" />
          <div className="flex-1">
            <h3 className="font-bold text-yellow-200 mb-1">Vous avez quitté la chambre</h3>
            <p className="text-yellow-200/80 text-sm mb-3">
              Vous pouvez revenir à "{roomName}" via vos chambres sauvegardées!
            </p>
            <button
              onClick={onNavigateToSaved}
              className="flex items-center gap-2 px-3 py-1 bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-100 rounded-lg text-sm font-semibold transition"
            >
              Voir mes favoris
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-yellow-200/60 hover:text-yellow-200 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
