import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import PrivacyAgreementDialog from '../components/auth/PrivacyAgreementDialog';
import authService from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>('');

  // 페이지 마운트 시 개인정보 동의 여부 확인
  useEffect(() => {
    const checkPrivacyAgreement = () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser && !currentUser.privacyAgreed) {
        // 로그인은 되어 있지만 개인정보 동의가 안 된 경우 모달 표시
        setPendingUserId(currentUser.userId);
        setPrivacyDialogOpen(true);
      }
    };

    checkPrivacyAgreement();
  }, []);

  const handleLoginSuccess = () => {
    navigate('/chat');
  };

  const handlePrivacyAgreed = () => {
    // 개인정보 동의 완료 후 모달 닫기 및 채팅 페이지로 이동
    setPrivacyDialogOpen(false);
    setPendingUserId(''); // pendingUserId도 초기화하여 모달 컴포넌트 언마운트
    navigate('/chat');
  };

  const handlePrivacyDisagreed = async () => {
    // 동의 안 함: 서버에 0 저장 후, 로그인 상태 유지(이번 세션에서는 모달 닫기만)
    setPrivacyDialogOpen(false);
    setPendingUserId('');
    sessionStorage.setItem('privacy_disagree_dismissed', '1');
    navigate('/chat');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e3f2fd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* 로고 영역 */}
          <Box
            sx={{
              textAlign: 'center',
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1D4487 0%, #1976d2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              AAA
            </Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: '#1D4487',
                mb: 1,
              }}
            >
              ASPN AI Agent
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.9rem' }}
            >
              데스크톱 웹 버전
            </Typography>
          </Box>

          <LoginForm onLoginSuccess={handleLoginSuccess} />

          {/* 개인정보 동의 모달 (이미 로그인된 상태이지만 동의가 안 된 경우) */}
          {pendingUserId && (
            <PrivacyAgreementDialog
              open={privacyDialogOpen}
              userId={pendingUserId}
              onAgreed={handlePrivacyAgreed}
              onDisagreed={handlePrivacyDisagreed}
              required={true}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
}
