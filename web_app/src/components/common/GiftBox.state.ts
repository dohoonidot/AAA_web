import { useEffect, useState } from 'react';
import giftService from '../../services/giftService';
import authService from '../../services/authService';
import type { Gift } from '../../types/gift';

export const useGiftButtonState = () => {
  const [giftCount, setGiftCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadGiftCount = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) return;

        const response = await giftService.checkGifts(user.userId);
        console.log('🎁 선물 응답:', response);
        const newGiftCount = (response?.gifts || []).filter(g => g.is_new).length;
        setGiftCount(newGiftCount);
      } catch (error) {
        console.error('🎁 선물 개수 조회 실패:', error);
        setGiftCount(0);
      }
    };

    loadGiftCount();

    const interval = setInterval(loadGiftCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    state: {
      giftCount,
      isOpen,
    },
    actions: {
      setGiftCount,
      setIsOpen,
    },
  };
};

export const useGiftPanelState = ({
  open,
  onGiftCountChange,
}: {
  open: boolean;
  onGiftCountChange: (count: number) => void;
}) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mobileExportDialogOpen, setMobileExportDialogOpen] = useState(false);
  const [mobileExportLoading, setMobileExportLoading] = useState(false);
  const [mobileExportGiftUrl, setMobileExportGiftUrl] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (open) {
      loadGifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = authService.getCurrentUser();
      if (!user) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await giftService.checkGifts(user.userId);
      setGifts(response.gifts || []);

      const newGiftCount = (response.gifts || []).filter(g => g.is_new).length;
      onGiftCountChange(newGiftCount);
    } catch (err: any) {
      console.error('선물함 조회 실패:', err);
      setError('선물함을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCouponImageUrl = (gift: Gift): string | undefined => {
    return gift.coupon_img_url || gift.couponImgUrl;
  };

  const handleOpenInBrowser = (url: string) => {
    window.open(url, '_blank');
  };

  const handleOpenMobileExportDialog = (url: string) => {
    setMobileExportGiftUrl(url);
    setMobileExportDialogOpen(true);
  };

  const handleCloseMobileExportDialog = () => {
    setMobileExportDialogOpen(false);
    setMobileExportGiftUrl(null);
  };

  const handleSendToMobile = async () => {
    if (!mobileExportGiftUrl) return;

    try {
      setMobileExportLoading(true);
      const response = await giftService.sendToMobile(mobileExportGiftUrl);

      console.log('모바일 내보내기 성공:', response);

      setSnackbarMessage(response.message || '모바일로 전송되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      handleCloseMobileExportDialog();
    } catch (err: any) {
      console.error('모바일 내보내기 실패:', err);
      setSnackbarMessage(err.message || '모바일 내보내기에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setMobileExportLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (gift: Gift) => {
    setGiftToDelete(gift);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setGiftToDelete(null);
  };

  const handleDeleteGift = async () => {
    if (!giftToDelete) return;

    try {
      // 실제 삭제 API 호출 (필요시 구현)
      // 예: await giftService.deleteGift(giftToDelete.id);

      setGifts(prevGifts => prevGifts.filter(gift => gift.id !== giftToDelete.id));

      const newGiftCount = gifts.filter(g => g.id !== giftToDelete.id && g.is_new).length;
      onGiftCountChange(newGiftCount);

      setSnackbarMessage('선물이 삭제되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      handleCloseDeleteConfirm();
    } catch (error) {
      console.error('선물 삭제 실패:', error);
      setSnackbarMessage('선물 삭제에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return {
    state: {
      gifts,
      loading,
      error,
      mobileExportDialogOpen,
      mobileExportLoading,
      mobileExportGiftUrl,
      deleteConfirmOpen,
      giftToDelete,
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
    },
    actions: {
      setGifts,
      setLoading,
      setError,
      setMobileExportDialogOpen,
      setMobileExportLoading,
      setMobileExportGiftUrl,
      setDeleteConfirmOpen,
      setGiftToDelete,
      setSnackbarOpen,
      setSnackbarMessage,
      setSnackbarSeverity,
      loadGifts,
      getCouponImageUrl,
      handleOpenInBrowser,
      handleOpenMobileExportDialog,
      handleCloseMobileExportDialog,
      handleSendToMobile,
      handleOpenDeleteConfirm,
      handleCloseDeleteConfirm,
      handleDeleteGift,
      handleCloseSnackbar,
    },
  };
};

export type GiftButtonStateHook = ReturnType<typeof useGiftButtonState>;
export type GiftPanelStateHook = ReturnType<typeof useGiftPanelState>;
