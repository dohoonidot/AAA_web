import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from './services/authService';
import { useNotificationStore } from './store/notificationStore';
import { useLeaveRequestDraftStore } from './store/leaveRequestDraftStore';
import { useSseNotifications } from './hooks/useSseNotifications';
import type { NotificationEnvelope } from './types/notification';

type RealtimeToast = {
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
};

const extractPayloadMessage = (payload: unknown): string => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload !== 'object') return '';

  const p = payload as Record<string, unknown>;
  const messageFields = ['message', 'content', 'body', 'text', 'description', 'subject', 'title'];
  for (const field of messageFields) {
    const value = p[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  if (typeof p.name === 'string' && p.name.trim()) {
    return `${p.name}님의 알림`;
  }

  return '';
};

const buildRealtimeToast = (envelope: NotificationEnvelope): RealtimeToast => {
  const payload = envelope.payload as Record<string, unknown> | undefined;
  const payloadMessage = extractPayloadMessage(payload) || envelope.payload_text || '새로운 알림이 도착했습니다';

  switch (envelope.event) {
    case 'birthday': {
      const name = typeof payload?.name === 'string' ? payload?.name : undefined;
      return {
        message: name ? `${name}님의 생일을 축하합니다! 🎉` : '생일 축하합니다! 🎂',
        severity: 'info',
      };
    }
    case 'leave_approval':
      return { message: '새로운 휴가 승인 요청이 있습니다', severity: 'info' };
    case 'leave_alert':
      return { message: payloadMessage || '휴가 관련 알림이 있습니다', severity: 'info' };
    case 'leave_cc':
      return { message: '휴가 참조 알림이 도착했습니다', severity: 'info' };
    case 'leave_draft':
      return { message: '휴가가 부여되었습니다. 휴가를 신청해주세요.', severity: 'success' };
    case 'eapproval_approval':
      return { message: '새로운 결재 문서가 도착했습니다', severity: 'info' };
    case 'eapproval_alert': {
      const status = payload?.status;
      const statusText =
        status === 'APPROVED' ? '승인' : status === 'REJECTED' ? '반려' : '처리';
      return {
        message: `전자결재가 ${statusText}되었습니다.`,
        severity: status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'warning' : 'info',
      };
    }
    case 'eapproval_cc':
      return { message: '전자결재 참조 문서가 도착했습니다', severity: 'info' };
    case 'contest_detail':
      return { message: '새로운 공모전 알림이 도착했습니다', severity: 'info' };
    case 'gift':
    case 'gift_arrival':
      return { message: '선물이 도착했습니다', severity: 'success' };
    case 'alert':
    case 'notification':
    default:
      return { message: payloadMessage, severity: 'info' };
  }
};

export const useAppContentState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>('');

  const { setConnectionState, setSseEnabled } = useNotificationStore();
  const { openPanel: openLeaveRequestPanel } = useLeaveRequestDraftStore();

  const [giftArrivalPopup, setGiftArrivalPopup] = useState<{
    open: boolean;
    data: {
      gift_name?: string;
      message?: string;
      couponImgUrl?: string;
      coupon_end_date?: string;
      queue_name?: string;
      sender_name?: string;
    } | null;
  }>({ open: false, data: null });

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/') {
      setIsCheckingAuth(false);
      setIsLoggedIn(false);
      return;
    }

    const checkAuthStatus = async () => {
      setIsCheckingAuth(true);
      try {
        const refreshResult = await authService.refresh();
        if (refreshResult && refreshResult.status_code === 200) {
          setIsLoggedIn(true);
          console.log('[App] 리프레시 성공 - 로그인 상태 유지');

          if (refreshResult.is_agreed === 0) {
            const currentUser = authService.getCurrentUser();
            const dismissed = sessionStorage.getItem('privacy_disagree_dismissed') === '1';
            if (currentUser && !dismissed) {
              setPendingUserId(currentUser.userId);
              setPrivacyDialogOpen(true);
            }
          }
        } else {
          setIsLoggedIn(false);
          console.log('[App] 리프레시 실패 - 로그인 필요');
        }
      } catch (error) {
        console.error('[App] 리프레시 에러:', error);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [location.pathname, navigate]);

  const handlePrivacyAgreed = () => {
    setPrivacyDialogOpen(false);
    setPendingUserId('');
    sessionStorage.removeItem('privacy_disagree_dismissed');
  };

  const handlePrivacyDisagreed = () => {
    sessionStorage.setItem('privacy_disagree_dismissed', '1');
    setPrivacyDialogOpen(false);
    setPendingUserId('');
  };

  const handleNotification = useCallback((envelope: NotificationEnvelope) => {
    console.log('🔔 [App] SSE 알림 수신 → NotificationStore로 전달:', {
      event: envelope.event,
      event_id: envelope.event_id,
      user_id: envelope.user_id,
      queue_name: envelope.queue_name,
      sent_at: envelope.sent_at,
      payload: envelope.payload,
    });

    console.log('🔍 [App] 이벤트 상세:', {
      event: envelope.event,
      payload_approval_type: (envelope.payload as any)?.approval_type,
      payload_status: (envelope.payload as any)?.status,
      payload_leave_type: (envelope.payload as any)?.leave_type,
      payload_grant_days: (envelope.payload as any)?.grant_days,
    });

    if (envelope.event === 'leave_draft') {
      const payload = envelope.payload as any;
      console.log('📋 [App] 휴가 초안 메시지 수신 (leave_draft):', payload);

      const user = authService.getCurrentUser();

      const startDate = payload?.start_date || new Date().toISOString().split('T')[0];
      const endDate = payload?.end_date || startDate;

      const approvalLine = payload?.approver_name ? [{
        approverName: payload.approver_name,
        approverId: payload.approver_id || '',
        approvalSeq: 1,
      }] : [];

      const ccList = (payload?.cc_list || []).map((cc: any) => ({
        name: cc.name === 'name' ? cc.userId : cc.name,
        userId: cc.userId?.includes('@') ? cc.userId : `${cc.userId || cc.name}@aspnc.com`,
      }));

      const leaveStatus = (payload?.leave_status || []).map((ls: any) => ({
        leaveType: ls.leave_type,
        totalDays: ls.total_days || 0,
        remainDays: ls.remain_days || 0,
      }));

      console.log('🎉 [App] 휴가 상신 패널 자동 오픈:', {
        leaveType: payload?.leave_type,
        startDate,
        endDate,
        approvalLine,
        ccList,
        leaveStatus,
      });

      openLeaveRequestPanel({
        userId: payload?.user_id || user?.userId || '',
        startDate,
        endDate,
        reason: payload?.reason || '',
        leaveType: payload?.leave_type || '정기휴가',
        halfDaySlot: (payload?.half_day_slot as 'ALL' | 'AM' | 'PM') || 'ALL',
        approvalLine,
        ccList,
        leaveStatus,
        useNextYearLeave: payload?.is_next_year === 1,
      });
    }

    const toast = buildRealtimeToast(envelope);
    if (toast.message) {
      setNotification(toast);
    }

    const isGiftEvent =
      envelope.event === 'gift' ||
      envelope.event === 'gift_arrival' ||
      envelope.queue_name?.startsWith('gift.') ||
      (envelope.event === 'notification' && envelope.queue_name?.startsWith('gift.')) ||
      (envelope.payload as any)?.queue_name === 'gift' ||
      (envelope.payload as any)?.queue_name?.startsWith('gift.');

    if (isGiftEvent) {
      setTimeout(() => {
        const payload = envelope.payload as any;
        setGiftArrivalPopup({
          open: true,
          data: {
            gift_name: payload?.gift_name || payload?.title,
            message: payload?.message || payload?.description,
            couponImgUrl: payload?.couponImgUrl || payload?.coupon_img_url,
            coupon_end_date: payload?.coupon_end_date || payload?.couponEndDate,
            queue_name: payload?.queue_name || envelope.queue_name,
            sender_name: payload?.sender_name || payload?.senderName || 'ASPN AI',
          },
        });
      }, 2000);
    }
  }, [openLeaveRequestPanel]);

  useSseNotifications({
    enabled: isLoggedIn,
    onNotification: handleNotification,
    withCredentials: true,
    onConnectionStateChange: (state) => {
      setConnectionState(state);
      console.log('[App] SSE 연결 상태:', state);
    },
  });

  useEffect(() => {
    setSseEnabled(isLoggedIn);
  }, [isLoggedIn, setSseEnabled]);

  useEffect(() => {
    if (!notification) return;

    const handleDismiss = () => {
      setNotification(null);
    };

    window.addEventListener('click', handleDismiss);
    return () => {
      window.removeEventListener('click', handleDismiss);
    };
  }, [notification]);

  const handleGiftArrivalConfirm = () => {
    setGiftArrivalPopup({ open: false, data: null });
    navigate('/gift');
  };

  const handleGiftArrivalClose = () => {
    setGiftArrivalPopup({ open: false, data: null });
  };

  const clearNotification = () => setNotification(null);

  return {
    state: {
      notification,
      isLoggedIn,
      isCheckingAuth,
      privacyDialogOpen,
      pendingUserId,
      giftArrivalPopup,
    },
    actions: {
      handlePrivacyAgreed,
      handlePrivacyDisagreed,
      handleGiftArrivalConfirm,
      handleGiftArrivalClose,
      clearNotification,
    },
  };
};

export type AppContentStateHook = ReturnType<typeof useAppContentState>;
