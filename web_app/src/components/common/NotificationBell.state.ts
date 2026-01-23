import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '../../services/notificationApi';
import type { AlertItem } from '../../types/notification';
import type { MouseEvent as ReactMouseEvent } from 'react';

export const useNotificationBellState = ({
  userId,
  refreshInterval,
  externalOpen,
  externalOnClose,
}: {
  userId: string;
  refreshInterval: number;
  externalOpen?: boolean;
  externalOnClose?: () => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<AlertItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalOpen(false);
    }
  };
  const handleOpen = () => {
    if (externalOpen === undefined) {
      setInternalOpen(true);
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const alerts = await notificationApi.getAlerts(userId);
      setNotifications(alerts);

      const unread = alerts.filter((alert) => !alert.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('[NotificationBell] 알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();

    const intervalId = setInterval(loadNotifications, refreshInterval);

    return () => clearInterval(intervalId);
  }, [loadNotifications, refreshInterval]);

  const handleNotificationClick = async (alert: AlertItem) => {
    if (!alert.is_read) {
      try {
        const updatedAlerts = await notificationApi.markAsRead(userId, alert.id);
        setNotifications(updatedAlerts);

        const unread = updatedAlerts.filter((a) => !a.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('[NotificationBell] 읽음 처리 실패:', error);
      }
    }

    setSelectedNotification(alert);
    setDetailModalOpen(true);
  };

  const handleDelete = async (alertId: number, event: ReactMouseEvent) => {
    event.stopPropagation();

    try {
      const updatedAlerts = await notificationApi.deleteAlert(userId, alertId);
      setNotifications(updatedAlerts);

      const unread = updatedAlerts.filter((a) => !a.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('[NotificationBell] 삭제 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadAlerts = notifications.filter((alert) => !alert.is_read);

    for (const alert of unreadAlerts) {
      try {
        await notificationApi.markAsRead(userId, alert.id);
      } catch (error) {
        console.error('[NotificationBell] 읽음 처리 실패:', error);
      }
    }

    await loadNotifications();
  };

  const handleClearAll = async () => {
    for (const alert of notifications) {
      try {
        await notificationApi.deleteAlert(userId, alert.id);
      } catch (error) {
        console.error('[NotificationBell] 삭제 실패:', error);
      }
    }

    await loadNotifications();
    setClearAllConfirmOpen(false);
  };

  return {
    state: {
      internalOpen,
      notifications,
      unreadCount,
      selectedNotification,
      detailModalOpen,
      clearAllConfirmOpen,
      loading,
      isOpen,
    },
    actions: {
      setInternalOpen,
      setNotifications,
      setUnreadCount,
      setSelectedNotification,
      setDetailModalOpen,
      setClearAllConfirmOpen,
      setLoading,
      handleClose,
      handleOpen,
      loadNotifications,
      handleNotificationClick,
      handleDelete,
      handleMarkAllAsRead,
      handleClearAll,
    },
  };
};

export type NotificationBellStateHook = ReturnType<typeof useNotificationBellState>;
