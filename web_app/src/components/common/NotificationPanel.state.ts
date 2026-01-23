import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { ackSseNotifications } from '../../services/sseService';
import type { NotificationDisplay } from '../../types/notification';
import type { MouseEvent as ReactMouseEvent } from 'react';

export const useNotificationPanelState = () => {
  const navigate = useNavigate();
  const {
    isNotificationPanelOpen,
    setNotificationPanelOpen,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotificationMessages,
  } = useNotificationStore();

  const [selectedNotification, setSelectedNotification] = useState<NotificationDisplay | null>(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  useEffect(() => {
    refreshNotificationMessages();
  }, [refreshNotificationMessages]);

  const handleClearAll = async () => {
    const eventIds = notifications.map((n) => n.id);

    if (eventIds.length === 0) return;

    try {
      await ackSseNotifications(eventIds);
      console.log('[NotificationPanel] 모든 알림 ACK 완료:', eventIds.length);
    } catch (error) {
      console.error('[NotificationPanel] 모든 알림 ACK 실패:', error);
    }

    clearAllNotifications();
  };

  const handleClose = () => {
    setNotificationPanelOpen(false);
  };

  const handleNotificationClick = async (notificationId: string, _link?: string) => {
    markAsRead(notificationId);

    try {
      await ackSseNotifications(notificationId);
      console.log('[NotificationPanel] 알림 ACK 완료:', notificationId);
    } catch (error) {
      console.error('[NotificationPanel] 알림 ACK 실패:', error);
    }

    const clickedNotification = notifications.find((n) => n.id === notificationId);
    if (clickedNotification) {
      setSelectedNotification(clickedNotification);
      setNotificationModalOpen(true);
    }
  };

  const handleDelete = async (notificationId: string, event: ReactMouseEvent) => {
    event.stopPropagation();

    try {
      await ackSseNotifications(notificationId);
      console.log('[NotificationPanel] 알림 삭제 및 ACK 완료:', notificationId);
    } catch (error) {
      console.error('[NotificationPanel] 알림 ACK 실패:', error);
    }

    removeNotification(notificationId);
  };

  const handleNavigateToLink = (link: string) => {
    navigate(link);
    setNotificationModalOpen(false);
    setSelectedNotification(null);
    setNotificationPanelOpen(false);
  };

  const handleCloseModal = () => {
    setNotificationModalOpen(false);
    setSelectedNotification(null);
  };

  const formatTime = (date: Date) => {
    try {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return '방금 전';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      if (days < 7) return `${days}일 전`;

      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    } catch (error) {
      return '';
    }
  };

  return {
    state: {
      isNotificationPanelOpen,
      notifications,
      unreadCount,
      selectedNotification,
      notificationModalOpen,
    },
    actions: {
      setNotificationPanelOpen,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      refreshNotificationMessages,
      handleClearAll,
      handleClose,
      handleNotificationClick,
      handleDelete,
      handleNavigateToLink,
      handleCloseModal,
      formatTime,
    },
  };
};

export type NotificationPanelStateHook = ReturnType<typeof useNotificationPanelState>;
