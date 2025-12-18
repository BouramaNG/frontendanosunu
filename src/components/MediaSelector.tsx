import { useState, useRef } from 'react';
import { Image, Sticker, Upload, X, Plus } from '@/lib/icons';

interface MediaSelectorProps {
  selectedImages: File[];
  selectedStickers: string[];
  onImagesChange: (images: File[]) => void;
  onStickersChange: (stickers: string[]) => void;
}

const stickerCategories = {
  emotions: ['😊', '😂', '🥰', '😎', '🤔', '😴', '🤗', '😇', '🙃', '😋', '😤', '😔', '😰', '🤯', '😱', '🥺', '😭', '😡'],
  animals: ['🐱', '🐶', '🐸', '🦊', '🐼', '🐨', '🦄', '🐯', '🦁', '🐷', '🐸', '🐙', '🦋', '🐝', '🐢', '🦖'],
  objects: ['🔥', '⭐', '💎', '🌟', '✨', '💫', '🌈', '🎭', '🎪', '🎨', '🎯', '🎲', '🎸', '🎤', '📱', '💻'],
  food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🍝', '🍜', '🍲', '🍱', '🍣', '🍤', '🍦'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🍀', '🌳', '🌲', '🌴', '🌵', '🌾', '🌊', '🌙', '☀️', '⭐']
};

export default function MediaSelector({ selectedImages, selectedStickers, onImagesChange, onStickersChange }: MediaSelectorProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'stickers'>('images');
  const [activeStickerCategory, setActiveStickerCategory] = useState<keyof typeof stickerCategories>('emotions');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    onImagesChange([...selectedImages, ...validFiles]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const toggleSticker = (sticker: string) => {
    if (selectedStickers.includes(sticker)) {
      onStickersChange(selectedStickers.filter(s => s !== sticker));
    } else {
      onStickersChange([...selectedStickers, sticker]);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
      <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
        <Image className="w-4 h-4" />
        <span>Ajouter des médias</span>
      </h3>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'images'
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Image className="w-3 h-3 inline mr-1" />
          Images ({selectedImages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stickers')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            activeTab === 'stickers'
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Sticker className="w-3 h-3 inline mr-1" />
          Stickers ({selectedStickers.length})
        </button>
      </div>

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-3">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 border-2 border-dashed border-white/20 rounded-lg hover:border-purple-500/50 hover:bg-white/5 transition text-white/60 hover:text-white flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Cliquez pour ajouter des images</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stickers Tab */}
      {activeTab === 'stickers' && (
        <div className="space-y-3">
          {/* Sticker Categories */}
          <div className="flex flex-wrap gap-1">
            {Object.keys(stickerCategories).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveStickerCategory(category as keyof typeof stickerCategories)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  activeStickerCategory === category
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
            {stickerCategories[activeStickerCategory].map((sticker) => (
              <button
                key={sticker}
                type="button"
                onClick={() => toggleSticker(sticker)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition hover:bg-white/10 ${
                  selectedStickers.includes(sticker)
                    ? 'bg-purple-500/30 border border-purple-500/50 scale-110'
                    : 'hover:bg-white/5'
                }`}
              >
                {sticker}
              </button>
            ))}
          </div>

          {/* Selected Stickers Preview */}
          {selectedStickers.length > 0 && (
            <div className="border-t border-white/10 pt-3">
              <p className="text-white/70 text-xs mb-2">Stickers sélectionnés:</p>
              <div className="flex flex-wrap gap-1">
                {selectedStickers.map((sticker, index) => (
                  <div
                    key={`${sticker}-${index}`}
                    className="relative group bg-white/10 rounded-lg p-1"
                  >
                    <span className="text-lg">{sticker}</span>
                    <button
                      type="button"
                      onClick={() => toggleSticker(sticker)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-2 h-2 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {(selectedImages.length > 0 || selectedStickers.length > 0) && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/60 text-xs">
            {selectedImages.length > 0 && `${selectedImages.length} image(s)`}
            {selectedImages.length > 0 && selectedStickers.length > 0 && ' • '}
            {selectedStickers.length > 0 && `${selectedStickers.length} sticker(s)`}
          </p>
        </div>
      )}
    </div>
  );
}
