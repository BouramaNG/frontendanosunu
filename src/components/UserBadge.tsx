import { Sparkles, Star, Award } from '@/lib/icons';
import type { User } from '../types';

interface UserBadgeProps {
  user: User;
  className?: string;
}

type BadgeType = 'red' | 'yellow' | 'green' | null;

/**
 * Calcule le type de badge selon les critères :
 * - Rouge : posts avec moins de 100 likes
 * - Jaune : posts entre 100-300 likes ET plus de 10 publications
 * - Vert : posts avec plus de 500 likes ET qui publient souvent
 */
function calculateBadgeType(user: User): BadgeType {
  // Si l'utilisateur est modérateur ou admin, pas de badge de niveau
  if (user.role !== 'user') {
    return null;
  }

  const totalLikes = user.total_likes || 0;
  const postsCount = user.posts_count || 0;

  // Badge vert : plus de 500 likes ET au moins 10 publications
  if (totalLikes >= 500 && postsCount >= 10) {
    return 'green';
  }

  // Badge jaune : entre 100-300 likes ET plus de 10 publications
  if (totalLikes >= 100 && totalLikes < 500 && postsCount >= 10) {
    return 'yellow';
  }

  // Badge rouge : moins de 100 likes (ou moins de 10 publications)
  if (totalLikes < 100 || postsCount < 10) {
    return 'red';
  }

  return null;
}

const BADGE_CONFIG: Record<BadgeType, { label: string; className: string; icon: React.ReactNode }> = {
  red: {
    label: 'Nouveau',
    className: 'border-red-500/50 bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-200 shadow-lg shadow-red-500/20',
    icon: <Sparkles className="w-3 h-3" />,
  },
  yellow: {
    label: 'Actif',
    className: 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-200 shadow-lg shadow-yellow-500/20',
    icon: <Star className="w-3 h-3" />,
  },
  green: {
    label: 'Influenceur',
    className: 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-200 shadow-lg shadow-emerald-500/20',
    icon: <Award className="w-3 h-3" />,
  },
};

export default function UserBadge({ user, className = '' }: UserBadgeProps) {
  const badgeType = calculateBadgeType(user);

  if (!badgeType) {
    return null;
  }

  const config = BADGE_CONFIG[badgeType];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all hover:scale-105 ${config.className} ${className}`}
      title={`${config.label} - ${user.total_likes || 0} likes, ${user.posts_count || 0} posts`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

