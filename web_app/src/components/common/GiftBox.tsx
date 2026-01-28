/**
 * 선물함 컴포넌트
 * 우측 상단에 배지 아이콘으로 표시되며, 클릭 시 선물 목록 표시
 */

import React from 'react';
import {
  Badge,
  IconButton,
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Alert,
  useTheme,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Gift } from '../../types/gift';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { useGiftButtonState, useGiftPanelState } from './GiftBox.state';

/**
 * 선물함 아이콘 버튼
 * 헤더나 네비게이션 바에 배치
 */
export function GiftButton() {
  const { state, actions } = useGiftButtonState();
  const { giftCount, isOpen } = state;
  const { setIsOpen, setGiftCount } = actions;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <>
      <IconButton
        onClick={() => setIsOpen(true)}
        aria-label="선물함"
        sx={{
          mr: 1,
          bgcolor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(156, 136, 212, 0.9)',
          color: 'white',
          '&:hover': {
            bgcolor: isDark ? 'rgba(139, 92, 246, 0.55)' : 'rgba(156, 136, 212, 1)',
          },
          boxShadow: 2,
        }}
      >
        <Badge badgeContent={giftCount} color="error">
          <CardGiftcardIcon />
        </Badge>
      </IconButton>
      <GiftPanel
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onGiftCountChange={setGiftCount}
      />
    </>
  );
}

interface GiftPanelProps {
  open: boolean;
  onClose: () => void;
  onGiftCountChange: (count: number) => void;
}

/**
 * 선물함 패널 Drawer
 */
export function GiftPanel({ open, onClose, onGiftCountChange }: GiftPanelProps) {
  const { state, actions } = useGiftPanelState({ open, onGiftCountChange });
  const {
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
  } = state;
  const {
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
  } = actions;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const panelBg = isDark ? '#0F172A' : '#F8F9FA';
  const panelSurface = isDark ? '#111827' : 'white';
  const panelBorder = isDark ? 'rgba(255,255,255,0.08)' : 'divider';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        sx: { zIndex: (theme) => theme.zIndex.appBar + 2 },
      }}
      sx={{
        zIndex: (theme) => theme.zIndex.appBar + 2,
        '& .MuiDrawer-paper': {
          zIndex: (theme) => theme.zIndex.appBar + 3,
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          bgcolor: panelBg,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 헤더 */}
        <Box
          sx={{
            p: 2,
            bgcolor: isDark ? '#5B21B6' : '#9C88D4',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CardGiftcardIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              받은 선물함
            </Typography>
            <Chip
              label={`${gifts.length}개`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'white',
                color: isDark ? 'white' : '#9C88D4',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        {/* 액션 버튼 영역 */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: panelBorder, bgcolor: panelSurface }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 왼쪽: 뒤로가기 버튼 */}
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: isDark ? 'grey.400' : 'text.secondary' }}
            >
              <ArrowBackIcon />
            </IconButton>

            {/* 오른쪽: 새로고침 버튼 */}
            <Button
              size="small"
              onClick={loadGifts}
              disabled={loading}
              variant="outlined"
            >
              새로고침
            </Button>
          </Box>
        </Box>

        {/* 선물 목록 */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : gifts.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: isDark ? 'grey.400' : 'text.secondary',
              }}
            >
              <CardGiftcardIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom>
                받은 선물이 없습니다
              </Typography>
              <Typography variant="body2">
                선물이 도착하면 여기에 표시됩니다
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {gifts.map((gift, index) => (
                <React.Fragment key={gift.id || index}>
                  <Card sx={{ mb: 2, boxShadow: 2, bgcolor: panelSurface }}>
                    <CardContent>
                      {/* 선물 타입 & NEW 배지 & 삭제 버튼 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={gift.gift_type || '쿠폰'}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          {gift.is_new && (
                            <Chip
                              label="NEW"
                              color="error"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteConfirm(gift)}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* 선물 내용 */}
                      {gift.gift_content && (
                        <Typography variant="body1" sx={{ mb: 2, color: isDark ? 'grey.100' : 'text.primary' }}>
                          {gift.gift_content}
                        </Typography>
                      )}

                      {/* 쿠폰 이미지 */}
                      {getCouponImageUrl(gift) && (
                        <CardMedia
                          component="img"
                          image={getCouponImageUrl(gift)!}
                          alt="쿠폰 이미지"
                          sx={{
                            borderRadius: 1,
                            mb: 2,
                            maxHeight: 200,
                            objectFit: 'contain',
                          }}
                        />
                      )}

                      {/* 브라우저 열기 및 모바일 내보내기 버튼 */}
                      {getCouponImageUrl(gift) && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                            onClick={() => handleOpenInBrowser(getCouponImageUrl(gift)!)}
                            sx={{
                              bgcolor: 'grey.600',
                              color: 'white',
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '15px',
                              px: 2.25,
                              py: 1.25,
                              '&:hover': {
                                bgcolor: 'grey.700',
                              },
                            }}
                          >
                            브라우저에서 열기
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<PhoneAndroidIcon sx={{ fontSize: 18 }} />}
                            onClick={() => handleOpenMobileExportDialog(getCouponImageUrl(gift)!)}
                            sx={{
                              background: 'linear-gradient(90deg, #7b8fd1 0%, #b39ddb 100%)',
                              color: 'white',
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '15px',
                              px: 2.25,
                              py: 1.25,
                              boxShadow: '0px 2px 6px rgba(183, 202, 255, 0.08)',
                              '&:hover': {
                                background: 'linear-gradient(90deg, #6a7fc0 0%, #a08cc8 100%)',
                                boxShadow: '0px 4px 8px rgba(183, 202, 255, 0.12)',
                              },
                            }}
                          >
                            모바일로 내보내기
                          </Button>
                        </Box>
                      )}

                      {/* 쿠폰 만료일 */}
                      {gift.coupon_end_date && (
                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                          만료일: {dayjs(gift.coupon_end_date).format('YYYY-MM-DD')}
                        </Typography>
                      )}

                      {/* 받은 시간 */}
                      {gift.received_at && (
                        <Typography variant="caption" color={isDark ? 'grey.400' : 'text.secondary'} sx={{ display: 'block', mb: 1 }}>
                          받은 시간: {dayjs(gift.received_at).format('YYYY-MM-DD HH:mm')}
                        </Typography>
                      )}

                      {/* 선물 확인 버튼 */}
                      {gift.gift_url && (
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          endIcon={<OpenInNewIcon />}
                          href={gift.gift_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mt: 1 }}
                        >
                          선물 확인하기
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  {index < gifts.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

      </Box>

      {/* 모바일 내보내기 확인 다이얼로그 */}
      <Dialog
        open={mobileExportDialogOpen}
        onClose={handleCloseMobileExportDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: panelSurface,
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          모바일로 내보내기
        </DialogTitle>
        <DialogContent>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2,
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            모바일로 내보내기는 3분~5분정도 시간이 소요됩니다. 전송하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseMobileExportDialog}
            disabled={mobileExportLoading}
            variant="text"
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: isDark ? 'grey.300' : 'grey.600',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.100',
              },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleSendToMobile}
            disabled={mobileExportLoading}
            variant="text"
            startIcon={mobileExportLoading ? <CircularProgress size={16} /> : null}
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
              },
            }}
          >
            {mobileExportLoading ? '전송 중...' : '전송'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 선물 삭제 확인 모달 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: panelSurface,
          },
        }}
      >
        <DialogTitle>
          선물 삭제 확인
        </DialogTitle>
        <DialogContent>
          <Typography>
            이 선물을 삭제하시겠습니까? 삭제된 선물은 복구할 수 없습니다.
          </Typography>
          {giftToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {giftToDelete.gift_content || giftToDelete.gift_type || '선물'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteConfirm}
            variant="outlined"
          >
            취소
          </Button>
          <Button
            onClick={handleDeleteGift}
            color="error"
            variant="contained"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 성공/에러 알림 Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}
