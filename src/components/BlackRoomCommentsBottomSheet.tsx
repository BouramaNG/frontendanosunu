import React, { useEffect } from 'react';
import { X } from '@/lib/icons';
import type { BlackRoom, BlackRoomPost } from '../types';
import BlackRoomPostComments from './BlackRoomPostComments';

interface BlackRoomCommentsBottomSheetProps {
  open: boolean;
  onClose: () => void;
  blackRoom: BlackRoom;
  post: BlackRoomPost;
}

export default function BlackRoomCommentsBottomSheet({ open, onClose, blackRoom, post }: BlackRoomCommentsBottomSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute left-0 right-0 bottom-0 h-[78vh] bg-zinc-950 rounded-t-2xl border-t border-white/10 shadow-2xl flex flex-col">
        {/* Grab bar + close */}
        <div className="py-3 flex items-center justify-center relative">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
          <button aria-label="Fermer" className="absolute right-3 top-2 p-2 text-white/70 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="px-4 pb-2">
          <h3 className="text-white font-semibold text-lg">{post.comments_count} commentaires</h3>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <BlackRoomPostComments blackRoom={blackRoom} post={post} onCommentAdded={() => {}} defaultExpanded />
        </div>
      </div>
    </div>
  );
}
