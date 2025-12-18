import React from 'react';
import type { Topic, User } from '../../types';
import { Plus, Flame, Home, Clock, Shield, Lock, Sparkles } from '@/lib/icons';

export interface SidebarProps {
  topics: Topic[];
  selectedTopic: string; // slug or 'tous'
  onSelectTopic: (slug: string) => void;
  canModerate?: boolean;
  currentUser?: User | null;
  onCreatePost?: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
        {title}
      </h3>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition text-left
        ${active ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Sidebar({
  topics,
  selectedTopic,
  onSelectTopic,
  canModerate,
  currentUser,
  onCreatePost,
}: SidebarProps) {
  const trends = [...topics]
    .sort((a, b) => (b.posts_count || 0) - (a.posts_count || 0))
    .slice(0, 8);

  return (
    <aside className="hidden lg:block w-80 shrink-0 pr-2">
      <div className="sticky top-6" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
        {/* Navigation */}
        <Section title="Navigation">
          <div className="divide-y divide-white/10">
            <NavItem
              active={selectedTopic === 'tous'}
              icon={<span className="text-base">🗣️</span>}
              label="Espace Libre"
              onClick={() => onSelectTopic('tous')}
            />
            <NavItem
              icon={<Flame className="w-4 h-4" />}
              label="Populaires"
              onClick={() => onSelectTopic('popular')}
            />
            <NavItem
              icon={<Clock className="w-4 h-4" />}
              label="Récents"
              onClick={() => onSelectTopic('recent')}
            />
            <div className="p-3">
              <button
                onClick={onCreatePost}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition"
              >
                <Plus className="w-4 h-4" /> Créer une publication
              </button>
            </div>
          </div>
        </Section>

        {/* Sujets */}
        <Section title="Sujets">
          <div className="max-h-72 overflow-auto divide-y divide-white/10">
            {topics.map((t) => (
              <NavItem
                key={t.id}
                active={selectedTopic === t.slug}
                icon={<span className="text-base">{t.icon || '•'}</span>}
                label={t.name}
                onClick={() => onSelectTopic(t.slug)}
              />
            ))}
          </div>
        </Section>

        {/* Tendances */}
        {trends.length > 0 && (
          <Section title="Tendances">
            <div className="divide-y divide-white/10">
              {trends.map((t, idx) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="text-white/40 w-5 text-right">{idx + 1}.</span>
                  <button
                    onClick={() => onSelectTopic(t.slug)}
                    className="flex-1 text-left text-white/80 hover:text-white truncate"
                  >
                    {t.name}
                  </button>
                  <span className="text-xs text-white/40">{t.posts_count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Modération */}
        {canModerate && (
          <Section title="Modération">
            <div className="divide-y divide-white/10">
              <NavItem icon={<Shield className="w-4 h-4" />} label="Signalements" />
              <NavItem icon={<Shield className="w-4 h-4" />} label="Posts bloqués" />
              <NavItem icon={<Shield className="w-4 h-4" />} label="Gestion des sujets" />
            </div>
          </Section>
        )}

        {/* Chambres Noires */}
        <Section title="Chambres Noires">
          <div className="p-3">
            <div className="p-3 rounded-lg border border-white/10 bg-white/5 relative overflow-hidden">
              {/* Badge Premium */}
              <div className="absolute top-2 right-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg border border-amber-300/50">
                    <Sparkles className="w-3 h-3 text-white" fill="white" />
                    <span className="text-[10px] font-bold text-white leading-none">PREMIUM</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Espaces premium</span>
              </div>
              <p className="text-xs text-white/50 mb-3">Coachs certifiés, audio, abonnements.</p>
              <button className="w-full text-xs px-3 py-2 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/30 text-white/90 font-medium transition">
                Explorer
              </button>
            </div>
          </div>
        </Section>

        {/* Profil */}
        <Section title="Profil">
          <div className="divide-y divide-white/10">
            <div className="px-3 py-2.5 text-sm text-white/70">
              {currentUser ? (
                <div className="truncate">{currentUser.name}</div>
              ) : (
                <div className="truncate">Utilisateur Anonyme</div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </aside>
  );
}
