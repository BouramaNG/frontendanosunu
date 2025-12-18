import { useState, useRef } from 'react';
import { Image as ImageIcon, Send, Loader2, X, Mic, Video, Lock } from '@/lib/icons';
import type { User } from '../types';
import UpgradeVideoModal from './UpgradeVideoModal';
import InlineVoiceRecorder from './InlineVoiceRecorder';

interface PostFormProps {
  user?: User;
  topics: Array<{ id: number; name: string; slug: string; icon?: string }>;
  selectedTopic: string;
  onTopicChange: (slug: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  selectedImages: File[];
  onImagesChange: (images: File[]) => void;
  selectedVideos?: File[];
  onVideosChange?: (videos: File[]) => void;
  previewVideoUrls?: string[];
  onRemoveVideo?: (index: number) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  previewUrls?: string[];
  onRemoveImage?: (index: number) => void;
  onVoiceClick?: () => void;
  onAudioSubmit?: (blob: Blob, seconds: number) => void;
  maxChars?: number;
  isPaidTopic?: boolean;
}

export default function PostForm({
  user,
  topics,
  selectedTopic,
  onTopicChange,
  content,
  onContentChange,
  selectedImages,
  onImagesChange,
  selectedVideos = [],
  onVideosChange,
  previewVideoUrls = [],
  onRemoveVideo,
  onSubmit,
  isLoading = false,
  previewUrls = [],
  onRemoveImage,
  onVoiceClick,
  onAudioSubmit,
  maxChars = 1000,
  isPaidTopic = false,
}: PostFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onImagesChange([...selectedImages, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    onImagesChange([...selectedImages, ...imageFiles]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onVideosChange) {
      // Vérifier la taille (max 10MB)
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
          return;
        }
        
        onVideosChange([file]);
      };
      
      video.onerror = () => {
        alert('Format vidéo non supporté. Utilisez MP4, WebM ou OGG.');
      };
      
      video.src = URL.createObjectURL(file);
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const charCount = content.length;
  const charPercentage = (charCount / maxChars) * 100;
  const isNearLimit = charPercentage > 80;
  const isOverLimit = charPercentage > 100;

  return (
    <>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
      {/* Header avec Avatar */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold ring-2 ring-white/20">
          {user?.name?.[0] || '👤'}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {user?.name || 'Utilisateur'}
          </p>
          <p className="text-xs text-white/50">Partagez vos pensées...</p>
        </div>
      </div>

      {/* Selector Topic */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wide">
          Catégorie
        </label>
        <select
          value={selectedTopic}
          onChange={(e) => onTopicChange(e.target.value)}
          className="w-full border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none transition appearance-none cursor-pointer font-medium"
          style={{
            backgroundColor: 'white',
            color: 'black',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M1 4l5 4 5-4'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: '32px',
          }}
        >
          <option value="tous" style={{ color: 'black', backgroundColor: 'white' }}>Tous les sujets</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.slug} style={{ color: 'white', backgroundColor: '#3b82f6' }}>
              {topic.icon || '•'} {topic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Textarea */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value.slice(0, maxChars))}
          placeholder="Exprimez-vous sans crainte... 💭"
          maxLength={maxChars}
          rows={4}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/40 transition resize-none text-sm sm:text-base"
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden mr-3">
            <div
              className={`h-full transition ${
                isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(charPercentage, 100)}%` }}
            />
          </div>
          <span
            className={`text-xs font-medium ${
              isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white/60'
            }`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* Image Preview */}
      {previewUrls.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-black/20 group"
              >
                <img
                  src={url}
                  alt={`Preview ${idx}`}
                  className="w-full h-full object-cover"
                />
                {onRemoveImage && (
                  <button
                    onClick={() => onRemoveImage(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Preview */}
      {previewVideoUrls && previewVideoUrls.length > 0 && (
        <div className="relative mb-4">
          <video
            src={previewVideoUrls[0]}
            controls
            controlsList="nodownload noremoteplayback"
            className="w-full rounded-lg max-h-64"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            style={{ userSelect: 'none' }}
          />
          {onRemoveVideo && (
            <button
              type="button"
              onClick={() => onRemoveVideo(0)}
              className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition mb-4 cursor-pointer ${
          dragOver
            ? 'border-purple-500/60 bg-purple-500/10'
            : 'border-white/20 hover:border-white/30 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2"
        >
          <ImageIcon className="w-5 h-5 text-white/60" />
          <span className="text-xs text-white/60">
            {dragOver
              ? 'Déposez vos images'
              : 'Glissez/déposez ou cliquez pour ajouter des images'}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white disabled:opacity-50"
            title="Ajouter des images"
          >
            <ImageIcon className="w-5 h-5" />
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
              if (!isPaidTopic) {
                setShowUpgradeModal(true);
              } else {
                videoInputRef.current?.click();
              }
            }}
            disabled={isLoading}
            className={`p-2 rounded-lg transition relative ${
              isPaidTopic
                ? 'hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-50'
                : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm hover:from-purple-500 hover:to-fuchsia-500'
            }`}
            title={isPaidTopic ? 'Ajouter une vidéo' : 'Vidéos en sujets payants uniquement'}
          >
            <div className="relative">
              <Video className="w-5 h-5" />
              {!isPaidTopic && (
                <Lock className="w-3 h-3 absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5" />
              )}
            </div>
          </button>

          {onAudioSubmit ? (
            <InlineVoiceRecorder onSubmit={onAudioSubmit} />
          ) : onVoiceClick ? (
            <button
              onClick={onVoiceClick}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white disabled:opacity-50"
              title="Enregistrement audio"
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        <button
          onClick={onSubmit}
          disabled={isLoading || !content.trim() || isOverLimit}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publication...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publier
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-white/40 mt-3 text-center">
        ✨ Restez respectueux et authentique. Les publications offensantes seront modérées.
      </p>
      </div>

      {/* Upgrade Video Modal for public feed */}
      <UpgradeVideoModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        upgradeUrl="/chambres-noires"
      />
    </>
  );
}
