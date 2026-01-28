import { Box, Container, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import PrivacyAgreementDialog from '../components/auth/PrivacyAgreementDialog';
import { useLoginPageState } from './LoginPage.state';

export default function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, actions } = useLoginPageState();
  const { privacyDialogOpen, pendingUserId, loginLoading } = state;
  const { handleLoginSuccess, handlePrivacyAgreed, handlePrivacyDisagreed, setLoginLoading } = actions;

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
              {!loginLoading &&
                (isMobile ? '모바일 웹 버전' : '데스크톱 웹 버전')}
            </Typography>
          </Box>

          <LoginForm onLoginSuccess={handleLoginSuccess} onLoadingChange={setLoginLoading} />

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
