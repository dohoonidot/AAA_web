import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, Security as SecurityIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { usePrivacyAgreementDialogState } from './PrivacyAgreementDialog.state';

// 개인정보 동의서 내용
const PRIVACY_CONTENT = {
  title: '개인정보 수집·이용 동의서',
  sections: [
    {
      title: '1. 개인정보 수집 및 이용 목적',
      content: 'ASPN AI Agent 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다. 수집된 정보는 서비스 제공, 고객 지원, 서비스 개선 목적으로만 사용됩니다.'
    },
    {
      title: '2. 수집하는 개인정보 항목',
      content: '필수: 사용자 ID, 이메일 주소, 이름\n선택: 프로필 사진, 연락처'
    },
    {
      title: '3. 개인정보 보유 및 이용 기간',
      content: '개인정보는 서비스 이용 기간 동안 보유하며, 회원 탈퇴 시 즉시 삭제됩니다.'
    },
    {
      title: '4. 개인정보 제3자 제공',
      content: '개인정보는 법령에 의해 요구되는 경우를 제외하고는 제3자에게 제공되지 않습니다.'
    },
    {
      title: '5. 개인정보 처리의 위탁',
      content: '개인정보 처리는 회사 내부에서만 수행되며, 외부 위탁은 하지 않습니다.'
    },
    {
      title: '6. 개인정보의 안전성 확보 조치',
      content: '개인정보는 암호화되어 저장되며, 접근 권한이 있는 직원만이 처리할 수 있습니다.'
    }
  ]
};

interface PrivacyAgreementDialogProps {
  open: boolean;
  userId: string;
  // 동의 처리 완료(동의함) 콜백
  onAgreed: () => void;
  // 동의 처리 완료(동의 안 함) 콜백
  onDisagreed?: () => void;
  onClose?: () => void;
  required?: boolean; // 필수 동의 여부 (로그인 시 true)
  // 버튼 노출 제어 (설정 페이지 등에서 사용)
  showAgreeButton?: boolean; // default: true
  showDisagreeButton?: boolean; // default: true
  showCancelButton?: boolean; // default: true (required=false일 때만 의미 있음)
}

const PrivacySection = ({ title, content, isDark }: { title: string; content: string; isDark: boolean }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: isDark ? '#E5E7EB' : '#1F2937' }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: isDark ? '#9CA3AF' : '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
      {content}
    </Typography>
  </Box>
);

export default function PrivacyAgreementDialog({
  open,
  userId,
  onAgreed,
  onDisagreed,
  onClose,
  required = false,
  showAgreeButton = true,
  showDisagreeButton = true,
  showCancelButton = true,
}: PrivacyAgreementDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';
  const { state, actions } = usePrivacyAgreementDialogState({
    userId,
    onAgreed,
    onDisagreed,
    onClose,
    required,
    showAgreeButton,
    showDisagreeButton,
    showCancelButton,
  });
  const {
    loading,
    error,
    cancelVisible,
    disagreeVisible,
    agreeVisible,
    hasAnyActions,
  } = state;
  const { handleAgreement, handleClose } = actions;

  return (
    <Dialog
      open={open}
      onClose={required ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={required}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '20px',
          maxHeight: isMobile ? '100vh' : '90vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'
            : 'linear-gradient(135deg, #4A90E2 0%, #7BB3F0 100%)',
          color: 'white',
          borderRadius: isMobile ? 0 : '20px 20px 0 0',
          px: { xs: 2, sm: 3 },
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            개인정보 수집·이용 동의서
          </Typography>
        </Box>
        {!required && onClose && (
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: isDark ? '#0F172A' : 'background.paper',
          overflow: 'auto',
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {PRIVACY_CONTENT.sections.map((section, index) => (
          <PrivacySection
            key={index}
            title={section.title}
            content={section.content}
            isDark={isDark}
          />
        ))}
      </DialogContent>

      {hasAnyActions && (
        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            bgcolor: isDark ? '#0F172A' : 'background.paper',
          }}
        >
          {cancelVisible && (
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={loading}
              fullWidth={isMobile}
              sx={{ order: { xs: 3, sm: 1 } }}
            >
              취소
            </Button>
          )}
          {disagreeVisible && (
            <Button
              onClick={() => handleAgreement(false)}
              variant="outlined"
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
              fullWidth={isMobile}
              sx={{
                order: { xs: 2, sm: 2 },
                minWidth: { xs: '100%', sm: 120 },
              }}
            >
              {loading ? '처리 중...' : '동의 안 함'}
            </Button>
          )}
          {agreeVisible && (
            <Button
              onClick={() => handleAgreement(true)}
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
              fullWidth={isMobile}
              sx={{
                order: { xs: 1, sm: 3 },
                minWidth: { xs: '100%', sm: 120 },
              }}
            >
              {loading ? '처리 중...' : '동의함'}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
