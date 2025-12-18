import { create } from 'zustand';
import api from '../lib/api';
import type { NotificationItem } from '../types';
import { getEcho } from '../lib/echo';
import { playNotificationSound, isSoundEnabled } from '../lib/notificationSound';

const CHANNEL_PREFIX = 'notifications.';

type FetchOptions = {
  force?: boolean;
};

interface NotificationsState {
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  initialized: boolean;
  subscribedUserId: number | null;
  pollingIntervalId: number | null;
  fetchNotifications: (options?: FetchOptions) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: NotificationItem) => void;
  subscribe: (userId: number) => Promise<void>;
  setError: (message: string | null) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

const computeUnreadCount = (items: NotificationItem[]): number =>
  items.reduce((count, item) => (item.is_read ? count : count + 1), 0);

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
  initialized: false,
  subscribedUserId: null,
  pollingIntervalId: null,

  setError: (message) => set({ error: message }),

  addNotification: (notification) => {
    // Jouer le son uniquement pour les nouvelles notifications non lues
    if (!notification.is_read && isSoundEnabled()) {
      playNotificationSound();
    }

    set((state) => {
      const items = [notification, ...state.items];
      return {
        items,
        unreadCount: computeUnreadCount(items),
      };
    });
  },

  fetchNotifications: async (options) => {
    const { loading, initialized, items: existingItems } = get();
    if (loading) {
      return;
    }

    if (initialized && !options?.force) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await api.get('/notifications', {
        params: {
          per_page: 50,
        },
      });

      const notifications: NotificationItem[] = Array.isArray(response.data?.data)
        ? (response.data.data as NotificationItem[])
        : [];

      // Détecter les nouvelles notifications lors du polling
      if (initialized && options?.force && isSoundEnabled()) {
        const existingIds = new Set(existingItems.map((item) => item.id));
        const newUnreadNotifications = notifications.filter(
          (notif) => !existingIds.has(notif.id) && !notif.is_read
        );

        // Jouer le son pour chaque nouvelle notification non lue
        if (newUnreadNotifications.length > 0) {
          // Jouer le son une seule fois même s'il y a plusieurs notifications
          playNotificationSound();
        }
      }

      set({
        items: notifications,
        unreadCount: computeUnreadCount(notifications),
        initialized: true,
      });
    } catch (error: unknown) {
      const message =
        (error as any)?.response?.data?.message ?? 'Impossible de récupérer les notifications.';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  startPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId !== null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void get()
        .fetchNotifications({ force: true })
        .catch((error) => console.error('=== NOTIFICATIONS: polling fetch error ===', error));
    }, 30000);

    set({ pollingIntervalId: intervalId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId !== null) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  markAsRead: async (notificationId) => {
    const existing = get().items.find((item) => item.id === notificationId);
    if (!existing || existing.is_read) {
      return;
    }

    set((state) => {
      const items = state.items.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : item
      );

      return {
        items,
        unreadCount: computeUnreadCount(items),
      };
    });

    try {
      await api.post(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('=== NOTIFICATIONS: markAsRead error ===', error);
    }
  },

  markAllAsRead: async () => {
    set((state) => {
      const items = state.items.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at ?? new Date().toISOString(),
      }));

      return {
        items,
        unreadCount: 0,
      };
    });

    try {
      await api.post('/notifications/read-all');
    } catch (error) {
      console.error('=== NOTIFICATIONS: markAllAsRead error ===', error);
    }
  },

  subscribe: async (userId) => {
    if (!userId) {
      return;
    }

    const { subscribedUserId } = get();
    if (subscribedUserId === userId) {
      return;
    }

    const echo = await getEcho();
    if (!echo) {
      console.warn('[Notifications] Echo instance non détectée. Les notifications en direct sont désactivées.');
      get().startPolling();
      set({ subscribedUserId: userId });
      return;
    }

    get().stopPolling();

    echo
      .private(`${CHANNEL_PREFIX}${userId}`)
      .listen('NotificationCreated', (event: NotificationItem & { read_at?: string | null }) => {
        const normalized: NotificationItem = {
          id: event.id,
          type: event.type,
          payload: event.payload ?? null,
          is_read: Boolean(event.is_read),
          read_at: event.read_at ?? null,
          created_at: event.created_at,
        };

        get().addNotification(normalized);
      });

    set({ subscribedUserId: userId });
  },
}));
