import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// Configure React Query for aggressive caching
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const STALE_TIME = 5 * 60 * 1000;  // 5 minutes

// Custom hook to fetch user with caching
export const useUserQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get('/user');
      return response.data;
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  });
};

// Custom hook to fetch topics with caching
export const useTopicsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data.data || [];
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Custom hook to fetch posts with caching
export const usePostsQuery = (topicId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['posts', topicId || 'all'],
    queryFn: async () => {
      let url = '/posts';
      if (topicId) {
        url += `?topic_id=${topicId}`;
      }
      const response = await api.get(url);
      return response.data.data || response.data || [];
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Custom hook to fetch black room types with caching
export const useBlackRoomTypesQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['black-room-types'],
    queryFn: async () => {
      const response = await api.get('/black-room-types');
      return response.data.data || [];
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Custom hook to fetch black room subscriptions with caching
export const useBlackRoomSubscriptionsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['black-room-subscriptions'],
    queryFn: async () => {
      const response = await api.get('/black-room-subscriptions');
      return response.data.data || [];
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Custom hook to fetch notifications with caching
export const useNotificationsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications?per_page=50');
      return response.data.data || [];
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
