import { useState } from 'react';
import { Smile, Image, Palette } from '@/lib/icons';

interface AvatarSelectorProps {
  selectedAvatar: {
    type: 'emoji' | 'image' | 'generated';
    value: string;
    color?: string;
  };
  onAvatarChange: (avatar: { type: 'emoji' | 'image' | 'generated'; value: string; color?: string }) => void;
}

const emojiList = [
  '😊', '😂', '🥰', '😎', '🤔', '😴', '🤗', '😇', '🙃', '😋',
  '😤', '😔', '😰', '🤯', '😱', '🥺', '😭', '😡', '🤬', '😈',
  '👻', '🤖', '👽', '🦄', '🐱', '🐶', '🐸', '🦊', '🐼', '🐨',
  '🔥', '⭐', '💎', '🌟', '✨', '💫', '🌈', '🎭', '🎪', '🎨'
];

const generatedAvatars = [
  { id: 'cat', emoji: '🐱', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'] },
  { id: 'dog', emoji: '🐶', colors: ['#fd79a8', '#fdcb6e', '#6c5ce7', '#a29bfe', '#fd79a8'] },
  { id: 'robot', emoji: '🤖', colors: ['#74b9ff', '#0984e3', '#00b894', '#00cec9', '#6c5ce7'] },
  { id: 'alien', emoji: '👽', colors: ['#55a3ff', '#26de81', '#ffc048', '#ff3838', '#a55eea'] },
];

export default function AvatarSelector({ selectedAvatar, onAvatarChange }: AvatarSelectorProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'generated'>('emoji');

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
      <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
        <Smile className="w-4 h-4" />
        <span>Choisir un avatar</span>
      </h3>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('emoji')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'emoji'
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Smile className="w-3 h-3 inline mr-1" />
          Emojis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('generated')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'generated'
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Palette className="w-3 h-3 inline mr-1" />
          Générés
        </button>
      </div>

      {/* Emoji Grid */}
      {activeTab === 'emoji' && (
        <div className="grid grid-cols-8 gap-2">
          {emojiList.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onAvatarChange({ type: 'emoji', value: emoji })}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition hover:bg-white/10 ${
                selectedAvatar.type === 'emoji' && selectedAvatar.value === emoji
                  ? 'bg-purple-500/30 border border-purple-500/50'
                  : 'hover:bg-white/5'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Generated Avatars */}
      {activeTab === 'generated' && (
        <div className="space-y-3">
          {generatedAvatars.map((avatar) => (
            <div key={avatar.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{avatar.emoji}</span>
                <span className="text-white/70 text-xs font-medium">Style {avatar.id}</span>
              </div>
              <div className="flex space-x-2">
                {avatar.colors.map((color) => (
                  <button
                    key={`${avatar.id}-${color}`}
                    type="button"
                    onClick={() => onAvatarChange({ 
                      type: 'generated', 
                      value: avatar.id, 
                      color: color 
                    })}
                    className={`w-6 h-6 rounded-full border-2 transition hover:scale-110 ${
                      selectedAvatar.type === 'generated' && 
                      selectedAvatar.value === avatar.id && 
                      selectedAvatar.color === color
                        ? 'border-white shadow-lg'
                        : 'border-white/30'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{
              backgroundColor: selectedAvatar.type === 'generated' ? selectedAvatar.color : 'transparent'
            }}
          >
            {selectedAvatar.type === 'emoji' ? selectedAvatar.value : 
             selectedAvatar.type === 'generated' ? generatedAvatars.find(a => a.id === selectedAvatar.value)?.emoji : '😊'}
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">Aperçu</p>
            <p className="text-white/50 text-xs">Votre avatar anonyme</p>
          </div>
        </div>
      </div>
    </div>
  );
}
