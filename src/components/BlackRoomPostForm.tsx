import { useState, useRef } from 'react';
import { Image, Video, X, Loader2, Lock } from '@/lib/icons';
import type { BlackRoom } from '../types';
import api from '../lib/api';
import UpgradeVideoModal from './UpgradeVideoModal';
import WhatsAppVoiceRecorder from './WhatsAppVoiceRecorder';

interface BlackRoomPostFormProps {
  blackRoom: BlackRoom;
  onPostCreated: () => void;
}

export default function BlackRoomPostForm({ blackRoom, onPostCreated }: BlackRoomPostFormProps) {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [ephemeralDurationDays, setEphemeralDurationDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Vérifier si la chambre est payante
  const isPaidRoom = blackRoom.subscription_price && parseFloat(blackRoom.subscription_price as any) > 0;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      alert('Maximum 5 images autorisées');
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB pour vidéos courtes)
      const maxSizeMB = 10;
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`La vidéo ne doit pas dépasser ${maxSizeMB}MB (actuellement: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }

      // Vérifier la durée (max 60 secondes)
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const durationSeconds = Math.floor(video.duration);
        const maxDurationSeconds = 60;
        
        if (durationSeconds > maxDurationSeconds) {
          alert(`La vidéo doit durer moins de ${maxDurationSeconds}s (actuellement: ${durationSeconds}s)`);
          setSelectedVideo(null);
          return;
        }
        
        setSelectedVideo(file);
      };
      
      video.onerror = () => {
        alert('Format vidéo non supporté. Utilisez MP4, WebM ou OGG.');
        setSelectedVideo(null);
      };
      
      video.src = URL.createObjectURL(file);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo) {
      alert('Veuillez ajouter du contenu');
      return;
    }

    // Vérifier que si le post est éphémère, une durée est sélectionnée
    if (isEphemeral && ephemeralDurationDays === null) {
      alert('Veuillez sélectionner une durée pour le post éphémère');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      if (content.trim()) {
        formData.append('content', content);
      }

      // Images
      selectedImages.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      // Vidéo
      if (selectedVideo) {
        formData.append('video', selectedVideo);
        // Durée vidéo (à calculer côté client ou laisser le serveur le faire)
      }

      // Contenu éphémère - l'utilisateur choisit s'il veut que le post soit éphémère
      formData.append('is_ephemeral', String(isEphemeral));
      if (isEphemeral && ephemeralDurationDays !== null) {
        // Convertir les jours en secondes
        const durationInSeconds = ephemeralDurationDays * 24 * 60 * 60;
        formData.append('ephemeral_duration', String(durationInSeconds));
      }

      await api.post(`/black-rooms/${blackRoom.slug}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setContent('');
      setSelectedImages([]);
      setSelectedVideo(null);
      setIsEphemeral(false);
      setEphemeralDurationDays(null);
      
      onPostCreated();
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création du post');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSubmit = async (blob: Blob, seconds: number) => {
    // Vérifier que si le post est éphémère, une durée est sélectionnée
    if (isEphemeral && ephemeralDurationDays === null) {
      alert('Veuillez sélectionner une durée pour le post éphémère');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');
      formData.append('audio_duration', String(seconds));

      if (content.trim()) {
        formData.append('content', content);
      }

      if (selectedImages.length > 0) {
        selectedImages.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      // Contenu éphémère - l'utilisateur choisit s'il veut que le post soit éphémère
      formData.append('is_ephemeral', String(isEphemeral));
      if (isEphemeral && ephemeralDurationDays !== null) {
        // Convertir les jours en secondes
        const durationInSeconds = ephemeralDurationDays * 24 * 60 * 60;
        formData.append('ephemeral_duration', String(durationInSeconds));
      }

      await api.post(`/black-rooms/${blackRoom.slug}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setContent('');
      setSelectedImages([]);
      setIsEphemeral(false);
      setEphemeralDurationDays(null);
      onPostCreated();
    } catch (error: any) {
      console.error('Error creating voice post:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création du post audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez un titre accrocheur pour votre post... ✨"
          className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-4 resize-none text-lg font-medium"
          rows={3}
          maxLength={5000}
        />

        {/* Images Preview */}
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                  style={{ userSelect: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Video Preview */}
        {selectedVideo && (
          <div className="relative mb-4">
            <video
              src={URL.createObjectURL(selectedVideo)}
              controls
              controlsList="nodownload noremoteplayback"
              className="w-full rounded-lg max-h-64"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              style={{ userSelect: 'none' }}
            />
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Ephemeral Options */}
        <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <label className="flex items-center gap-2 text-white/80 text-sm mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEphemeral}
              onChange={(e) => {
                setIsEphemeral(e.target.checked);
                if (!e.target.checked) {
                  setEphemeralDurationDays(null);
                }
              }}
              className="rounded"
            />
            <span>Rendre ce post éphémère (auto-destruction après expiration)</span>
          </label>
          {isEphemeral && (
            <div className="mt-3">
              <label className="text-white/70 text-sm mb-2 block">
                Durée avant expiration :
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '24 heures', days: 1 },
                  { label: '7 jours', days: 7 },
                  { label: '30 jours', days: 30 },
                  { label: '90 jours', days: 90 },
                ].map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => setEphemeralDurationDays(option.days)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      ephemeralDurationDays === option.days
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {ephemeralDurationDays && (
                <p className="text-white/50 text-xs mt-2">
                  Le post sera automatiquement supprimé après {ephemeralDurationDays} jour{ephemeralDurationDays > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/70 hover:text-white transition"
            title="Ajouter des images"
          >
            <Image className="w-5 h-5" />
          </button>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => {
              if (!isPaidRoom) {
                setShowUpgradeModal(true);
              } else {
                videoInputRef.current?.click();
              }
            }}
            className={`p-2 rounded-lg transition relative ${
              isPaidRoom
                ? 'bg-white/10 hover:bg-white/15 text-white/70 hover:text-white'
                : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm hover:from-purple-500 hover:to-fuchsia-500 cursor-pointer'
            }`}
            title={isPaidRoom ? 'Ajouter une vidéo' : 'Vidéos en chambres payantes uniquement'}
          >
            <div className="relative">
              <Video className="w-5 h-5" />
              {!isPaidRoom && (
                <Lock className="w-3 h-3 absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5" />
              )}
            </div>
          </button>

          {/* Voice Recorder - WhatsApp-style */}
          <WhatsAppVoiceRecorder
            onRecordingComplete={handleVoiceSubmit}
            maxDuration={60}
            disabled={loading}
          />

          <div className="flex-1" />

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publication...
              </>
            ) : (
              'Publier'
            )}
          </button>
        </div>
      </form>

      {/* Upgrade Video Modal */}
      <UpgradeVideoModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        upgradeUrl={`/admin/chambres-noires/${blackRoom.slug}/settings`}
      />
    </>
  );
}

