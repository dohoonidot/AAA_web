import { useSettingsPageState } from './SettingsPage.state';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Chip,
  useTheme,
  Paper,
  Grid,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import MobileMainLayout from '../components/layout/MobileMainLayout';
import PrivacyAgreementDialog from '../components/auth/PrivacyAgreementDialog';


export default function SettingsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { state, actions } = useSettingsPageState();
  const {
    notifications,
    privacyAgreed,
    privacyDialogOpen,
    error,
    userInfo,
    themeMode,
  } = state;
  const {
    setPrivacyDialogOpen,
    handleLogout,
    handleThemeChange,
    handleNotificationChange,
    navigate,
  } = actions;

  return (
    <MobileMainLayout
      hideAppBar={false}
      hideSidebarOnDesktop={true}
      title="환경 설정"
      showBackButton={true}
      onBackClick={() => navigate('/chat')}
    >
      <Box sx={{ height: '100vh', overflow: 'auto', p: { xs: 2, md: 3 }, bgcolor: isDark ? '#0F172A' : 'transparent' }}>
        {/* 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            계정 정보와 앱 설정을 관리하세요
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 내 계정정보 섹션 */}
        <Card sx={{ mb: 3, bgcolor: isDark ? '#111827' : 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                내 계정정보
              </Typography>
            </Box>

            {userInfo && (
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        사용자 ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {userInfo.userId}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        이름
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {userInfo.name || '정보 없음'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* 계정 정보 안내 메시지 */}
            <Alert severity="info" sx={{ mb: 2 }}>
              현재 로그인된 계정 정보입니다. 계정 변경은 로그아웃 후 다시 로그인하세요.
            </Alert>

            {/* 로그아웃 버튼 */}
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              fullWidth
              sx={{ mt: 1 }}
            >
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* 테마 설정 섹션 */}
        <Card sx={{ mb: 3, bgcolor: isDark ? '#111827' : 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaletteIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                테마 설정
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {[
                { value: 'light', label: '라이트', color: '#FFFFFF' },
                { value: 'dark', label: '다크', color: '#1F2937' },
                { value: 'system', label: '시스템', color: '#6B7280' },
              ].map((theme) => (
                <Grid size={4} key={theme.value}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: themeMode === theme.value ? 2 : 1,
                      borderColor: themeMode === theme.value ? 'primary.main' : 'grey.300',
                      bgcolor: theme.color,
                      color: theme.value === 'light' ? (isDark ? '#111827' : 'text.primary') : 'white',
                    }}
                    onClick={() => handleThemeChange(theme.value as ThemeMode)}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {theme.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* 알림 설정 섹션 */}
        <Card sx={{ mb: 3, bgcolor: isDark ? '#111827' : 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                알림 설정
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="푸시 알림"
                  secondary="새로운 메시지와 알림을 받습니다"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications}
                    onChange={(e) => handleNotificationChange(e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* 개인정보 설정 섹션 */}
        <Card sx={{ mb: 3, bgcolor: isDark ? '#111827' : 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                개인정보 설정
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  개인정보 수집·이용 동의
                </Typography>
                <Chip
                  icon={privacyAgreed ? <CheckCircleIcon /> : <CancelIcon />}
                  label={privacyAgreed ? '동의함' : '동의 안함'}
                  color={privacyAgreed ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                서비스 이용을 위해 개인정보 수집·이용에 동의가 필요합니다.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => setPrivacyDialogOpen(true)}
              fullWidth
              sx={{ mb: 2 }}
            >
              개인정보 수집·이용 동의서 보기
            </Button>

            <Alert severity="info">
              개인정보는 서비스 제공을 위해 필요한 최소한의 정보만 수집하며, 안전하게 보호됩니다.
            </Alert>
          </CardContent>
        </Card>

        {/* 앱 정보 섹션 */}
        <Card sx={{ bgcolor: isDark ? '#111827' : 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <InfoIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                앱 정보
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemText
                  primary="버전"
                  secondary="1.0.0"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="빌드 번호"
                  secondary="20241021"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="개발사"
                  secondary="ASPN"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* 개인정보 동의서 다이얼로그 */}
        {userInfo && (
          <PrivacyAgreementDialog
            open={privacyDialogOpen}
            userId={userInfo.userId}
            onAgreed={async () => {
              setPrivacyDialogOpen(false);
              // 동의 상태 다시 로드
              await loadPrivacyStatus();
            }}
            onClose={() => setPrivacyDialogOpen(false)}
            required={false}
            // 설정 페이지에서는 "동의 안 함" 버튼 제거
            showDisagreeButton={false}
            // 이미 동의한 상태면 "동의함" 버튼도 숨김(뷰어 모드)
            showAgreeButton={!privacyAgreed}
            // 이미 동의한 상태면 하단 취소 버튼도 숨김(상단 X로만 닫기)
            showCancelButton={!privacyAgreed}
          />
        )}
      </Box>
    </MobileMainLayout>
  );
}
