import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Snackbar, Alert, Box, CircularProgress } from '@mui/material';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import CodingAssistantPage from './pages/CodingAssistantPage';
import AiAssistantPage from './pages/AiAssistantPage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import AdminLeaveApprovalPage from './pages/AdminLeaveApprovalPage';
import ApprovalPage from './pages/ApprovalPage';
import GiftPage from './pages/GiftPage';
import SapPage from './pages/SapPage';
import SettingsPage from './pages/SettingsPage';
import ContestPage from './pages/ContestPage';
import LeaveGrantHistoryPage from './pages/LeaveGrantHistoryPage';
import PrivateRoute from './components/auth/PrivateRoute';
import { useThemeStore } from './store/themeStore';
import { NotificationPanel } from './components/common/NotificationPanel';
import GiftArrivalPopup from './components/common/GiftArrivalPopup';
import LeaveRequestDraftPanel from './components/leave/LeaveRequestDraftPanel';
import PrivacyAgreementDialog from './components/auth/PrivacyAgreementDialog';
import { useAppContentState } from './App.state';

function AppContent() {
  const { state, actions } = useAppContentState();
  const {
    notification,
    isLoggedIn,
    isCheckingAuth,
    privacyDialogOpen,
    pendingUserId,
    giftArrivalPopup,
  } = state;
  const {
    handlePrivacyAgreed,
    handlePrivacyDisagreed,
    handleGiftArrivalConfirm,
    handleGiftArrivalClose,
    clearNotification,
  } = actions;

  if (isCheckingAuth) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <NotificationPanel />
      {pendingUserId && (
        <PrivacyAgreementDialog
          open={privacyDialogOpen}
          userId={pendingUserId}
          onAgreed={handlePrivacyAgreed}
          onDisagreed={handlePrivacyDisagreed}
          required={true}
        />
      )}
      <GiftArrivalPopup
        open={giftArrivalPopup.open}
        giftData={giftArrivalPopup.data}
        onConfirm={handleGiftArrivalConfirm}
        onClose={handleGiftArrivalClose}
      />
      {/* 휴가 상신 패널 - 전역 (휴가 부여 승인 시 자동 오픈) */}
      <LeaveRequestDraftPanel />

      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/chat" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/coding"
          element={
            <PrivateRoute>
              <CodingAssistantPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <PrivateRoute>
              <AiAssistantPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sap"
          element={
            <PrivateRoute>
              <SapPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <PrivateRoute>
              <LeaveManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/leave-grant-history"
          element={
            <PrivateRoute>
              <LeaveGrantHistoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin-leave"
          element={
            <PrivateRoute>
              <AdminLeaveApprovalPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/approval"
          element={
            <PrivateRoute>
              <ApprovalPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/gift"
          element={
            <PrivateRoute>
              <GiftPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/contest"
          element={
            <PrivateRoute>
              <ContestPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={clearNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={clearNotification}
          severity={notification?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function App() {
  const { muiTheme } = useThemeStore();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
