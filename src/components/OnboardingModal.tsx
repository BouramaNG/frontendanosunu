import { useState, useEffect } from 'react';
import { X, Sparkles } from '@/lib/icons';
import type { Topic } from '../types';
import api from '../lib/api';

interface OnboardingModalProps {
  isOpen: boolean;
  topics: Topic[];
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, topics, onComplete }: OnboardingModalProps) {
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTopics(new Set());
    }
  }, [isOpen]);

  const toggleTopic = (topicId: number) => {
    setSelectedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const handleComplete = async () => {
    if (selectedTopics.size === 0) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/onboarding/complete', {
        topic_ids: Array.from(selectedTopics),
      });
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-purple-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Bienvenue ! 👋</h2>
              <p className="text-white/70 text-sm">Choisissez vos centres d'intérêt</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-white/80 mb-6 text-center">
            Sélectionnez au moins <span className="font-semibold text-purple-300">3 catégories</span> qui vous intéressent.
            <br />
            Nous vous proposerons du contenu personnalisé basé sur vos choix.
          </p>

          {/* Topics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topics.map((topic) => {
              const isSelected = selectedTopics.has(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/10 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/15'
                  }`}
                >
                  <div className="text-2xl mb-2">{topic.icon || '•'}</div>
                  <div className="font-medium text-sm">{topic.name}</div>
                  {topic.description && (
                    <div className="text-xs text-white/60 mt-1 line-clamp-2">{topic.description}</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selection Counter */}
          <div className="mt-6 text-center">
            <p className="text-white/70 text-sm">
              {selectedTopics.size > 0 ? (
                <>
                  <span className="font-semibold text-purple-300">{selectedTopics.size}</span> catégorie{selectedTopics.size > 1 ? 's' : ''} sélectionnée{selectedTopics.size > 1 ? 's' : ''}
                </>
              ) : (
                <span className="text-white/50">Aucune catégorie sélectionnée</span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <button
            onClick={handleComplete}
            disabled={selectedTopics.size < 3 || loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              selectedTopics.size >= 3 && !loading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {loading ? 'Chargement...' : selectedTopics.size < 3 ? `Sélectionnez au moins 3 catégories (${selectedTopics.size}/3)` : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
}

