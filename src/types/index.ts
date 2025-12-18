export interface User {
  id: number;
  name: string;
  email: string;
  gender: 'male' | 'female';
  avatar_url: string;
  role: 'user' | 'moderator' | 'admin';
  is_moderator_verified: boolean;
  moderator_badge?: string;
  is_banned: boolean;
  has_completed_onboarding?: boolean;
  total_likes?: number;
  posts_count?: number;
  has_keychain_pin?: boolean;
  keychain_pin_set_at?: string | null;
}

export interface NotificationItem {
  id: number;
  type: string;
  payload?: Record<string, any> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  is_sensitive: boolean;
  requires_moderation: boolean;
  posts_count: number;
}

export interface Post {
  id: number;
  user_id: number;
  topic_id: number;
  content: string;
  is_anonymous: boolean;
  is_approved: boolean;
  is_blocked: boolean;
  blocked_by?: number;
  block_reason?: string;
  likes_count: number;
  comments_count: number;
  avatar_type?: string;
  avatar_value?: string;
  avatar_color?: string;
  images?: string[];
  videos?: string[];
  stickers?: string[];
  has_media?: boolean;
  audio_url?: string;
  score?: number;
  user_vote?: -1 | 0 | 1;
  dislikes_count?: number;
  disliked_by_user?: boolean;
  created_at: string;
  relative_time?: string;
  liked_by_user?: boolean;
  user?: User;
  topic?: Topic;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  parent_id?: number;
  content: string;
  is_blocked: boolean;
  likes_count: number;
  created_at: string;
  user?: User;
  replies?: Comment[];
  liked_by_user?: boolean;
}

export interface BlackRoom {
  id: number;
  name: string;
  slug: string;
  description: string;
  coach_id: number;
  creator_id?: number;
  category: string;
  type: 'public' | 'private' | 'creator_vip' | 'consultation';
  public_type?: 'tabous' | 'confessions' | 'sexualite' | 'senegal_actualites' | 'vff';
  cover_image?: string;
  subscription_price: number;
  subscription_period: 'monthly' | 'quarterly' | 'yearly';
  subscribers_count: number;
  is_active: boolean;
  access_code?: string;
  invite_link?: string;
  max_participants?: number;
  min_participants?: number;
  scheduled_end_at?: string;
  duration_minutes?: number;
  creator_monthly_fee?: number;
  max_subscribers?: number;
  access_price?: number;
  is_auto_destroy?: boolean;
  destroyed_at?: string;
  coach?: User;
  creator?: User;
  // Appended by backend for private rooms that auto-expire
  is_expired?: boolean;
  expires_in_seconds?: number | null;
}

export interface BlackRoomType {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  badge?: string;
  type: 'public' | 'private' | 'creator_vip' | 'consultation';
  public_type?: 'tabous' | 'confessions' | 'sexualite' | 'senegal_actualites' | 'vff';
  monthly_price?: number;
  access_price?: number;
  requires_subscription: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface BlackRoomPost {
  id: number;
  black_room_id: number;
  user_id: number;
  content?: string;
  audio_path?: string;
  video_path?: string;
  images?: string[];
  audio_duration?: number;
  video_duration?: number;
  is_ephemeral: boolean;
  expires_at?: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  reports_count: number;
  is_blocked: boolean;
  is_deleted: boolean;
  created_at: string;
  user?: User;
}

export interface BlackRoomPostComment {
  id: number;
  black_room_post_id: number;
  user_id: number;
  parent_id?: number | null;
  content?: string;
  audio_path?: string;
  audio_duration?: number;
  is_ephemeral: boolean;
  expires_at?: string;
  likes_count: number;
  replies_count: number;
  reports_count: number;
  is_blocked: boolean;
  is_deleted: boolean;
  created_at: string;
  user?: User;
  parent?: BlackRoomPostComment;
  replies?: BlackRoomPostComment[];
}

export interface BlackRoomSubscription {
  id: number;
  user_id: number;
  black_room_id: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  auto_renew: boolean;
  black_room?: BlackRoom;
}

export interface BlackRoomMessage {
  id: number;
  black_room_id: number;
  user_id: number;
  content?: string;
  type: 'text' | 'audio' | 'image' | 'video' | 'sticker';
  file_path?: string;
  duration?: number;
  created_at: string;
  user?: User;
}

export interface ModeratorRequest {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  user?: User;
}
