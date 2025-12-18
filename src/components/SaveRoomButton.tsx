import { useState } from 'react';
import { Star } from '@/lib/icons';
import api from '../lib/api';

interface SaveRoomButtonProps {
  roomId: number;
  onSave?: () => void;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export default function SaveRoomButton({
  roomId,
  onSave,
  variant = 'icon',
  size = 'md',
}: SaveRoomButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSaveRoom = async () => {
    setLoading(true);
    try {
      await api.post(`/black-rooms/${roomId}/save`);
      setIsSaved(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      onSave?.();
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.message?.includes('déjà')) {
        // Already saved
        setIsSaved(true);
      } else {
        console.error('Error saving room:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Size classes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const paddingSizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  const buttonSizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleSaveRoom}
          disabled={loading}
          className={`${paddingSizes[size]} text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition disabled:opacity-50`}
          title={isSaved ? 'Retiré des favoris' : 'Ajouter aux favoris'}
        >
          <Star
            className={`${iconSizes[size]} ${isSaved ? 'fill-yellow-400' : ''}`}
          />
        </button>
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-yellow-200 text-sm animate-bounce">
            ⭐ Chambre sauvegardée!
          </div>
        )}
      </>
    );
  }

  // Button variant
  return (
    <>
      <button
        onClick={handleSaveRoom}
        disabled={loading}
        className={`${buttonSizes[size]} flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-semibold transition disabled:opacity-50`}
      >
        <Star className={`${iconSizes[size]} ${isSaved ? 'fill-white' : ''}`} />
        {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
      </button>
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-yellow-200 text-sm animate-bounce">
          ⭐ Chambre sauvegardée!
        </div>
      )}
    </>
  );
}
