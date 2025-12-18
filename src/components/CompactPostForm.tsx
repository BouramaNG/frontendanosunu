import { useState, useRef } from 'react';
import { Image as ImageIcon, Mic, ChevronDown } from '@/lib/icons';
import type { User } from '../types';
import PostForm from './PostForm';

interface CompactPostFormProps {
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
  onSubmit: () => void;
  isLoading?: boolean;
  previewUrls?: string[];
  previewVideoUrls?: string[];
  onRemoveImage?: (index: number) => void;
  onRemoveVideo?: (index: number) => void;
  onVoiceClick?: () => void;
  onAudioSubmit?: (blob: Blob, seconds: number) => void;
  maxChars?: number;
}

export default function CompactPostForm({
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
  onSubmit,
  isLoading = false,
  previewUrls = [],
  previewVideoUrls = [],
  onRemoveImage,
  onRemoveVideo,
  onVoiceClick,
  onAudioSubmit,
  maxChars = 1000,
}: CompactPostFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCompactClick = () => {
    setIsExpanded(true);
    // Focus sur le textarea après un court délai pour l'animation
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    if (!content.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      setIsExpanded(false);
    }
  };

  const handleForceClose = () => {
    // If there's content, ask for confirmation before closing
    if (content.trim() || selectedImages.length > 0 || selectedVideos.length > 0) {
      const ok = window.confirm('Vous avez du contenu non sauvegardé. Fermer le formulaire ?');
      if (!ok) return;
    }
    setIsExpanded(false);
  };

  // Si le formulaire a du contenu, rester ouvert
  if (content.trim() || selectedImages.length > 0 || selectedVideos.length > 0) {
    if (!isExpanded) setIsExpanded(true);
  }

  if (isExpanded) {
    return (
      <div className="mb-6">
        <div className="flex justify-end mb-2">
          <button
            onClick={handleForceClose}
            className="text-sm text-white/60 hover:text-white px-2 py-1"
          >
            Fermer
          </button>
        </div>
        <PostForm
          user={user}
          topics={topics}
          selectedTopic={selectedTopic}
          onTopicChange={onTopicChange}
          content={content}
          onContentChange={onContentChange}
          selectedImages={selectedImages}
          onImagesChange={onImagesChange}
          selectedVideos={selectedVideos}
          onVideosChange={onVideosChange}
          onSubmit={() => {
            onSubmit();
            setIsExpanded(false);
          }}
          isLoading={isLoading}
          previewUrls={previewUrls}
          previewVideoUrls={previewVideoUrls}
          onRemoveImage={onRemoveImage}
          onRemoveVideo={onRemoveVideo}
          onVoiceClick={onVoiceClick}
          onAudioSubmit={onAudioSubmit}
          maxChars={maxChars}
        />
        {(content.trim() || selectedImages.length > 0 || selectedVideos.length > 0) && (
          <button
            onClick={handleClose}
            className="mt-2 text-xs text-white/50 hover:text-white/70 flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" />
            Réduire
          </button>
        )}
      </div>
    );
  }

  // Vue compacte
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 hover:border-white/20 transition cursor-pointer">
      <button
        onClick={handleCompactClick}
        data-compact-post-form
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold ring-2 ring-white/20 flex-shrink-0">
          {user?.name?.[0] || '👤'}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/60">
            Partagez vos pensées, opinions, expériences...
          </p>
        </div>
        <div className="flex items-center gap-2 text-white/40">
          <ImageIcon className="w-4 h-4" />
          <Mic className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}

