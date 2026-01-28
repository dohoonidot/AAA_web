import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import dayjs from 'dayjs';
import { useThemeStore } from '../../store/themeStore';
import type { AdminWaitingLeave } from '../../types/leave';
import { useAdminLeaveApprovalScreenState } from './AdminLeaveApprovalScreen.state';

export default function AdminLeaveApprovalScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';

  const { state, actions } = useAdminLeaveApprovalScreenState();
  const {
    selectedTab,
    statusFilter,
    selectedYear,
    adminData,
    loading,
    error,
    currentPage,
    itemsPerPage,
    approvalDialog,
    selectedLeave,
    approvalAction,
    rejectMessage,
    actionLoading,
  } = state;
  const {
    setSelectedTab,
    setStatusFilter,
    setSelectedYear,
    setCurrentPage,
    setApprovalDialog,
    setSelectedLeave,
    setApprovalAction,
    setRejectMessage,
    setError,
    handleApprove,
    handleReject,
    navigate,
  } = actions;

  // 통계 카드 렌더링
  const renderStatsCards = () => {
    if (!adminData) return null;

    // approval_status 배열에서 통계 추출
    let requested = 0;
    let approved = 0;
    let rejected = 0;

    if (adminData.approval_status && Array.isArray(adminData.approval_status)) {
      adminData.approval_status.forEach((item) => {
        if (item.status === 'REQUESTED') requested = item.count;
        if (item.status === 'APPROVED') approved = item.count;
        if (item.status === 'REJECTED') rejected = item.count;
      });
    }

    return (
      <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row', mb: 3 }}>
        {/* 결재 대기 */}
        <Card
          sx={{
            flex: 1,
            cursor: 'pointer',
            bgcolor: colorScheme.surfaceColor,
            border: statusFilter === 'REQUESTED' ? '2px solid #FF8C00' : `1px solid ${colorScheme.textFieldBorderColor}`,
          }}
          onClick={() => {
            setSelectedTab('pending');
            setStatusFilter('REQUESTED');
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon sx={{ color: '#FF8C00' }} />
              <Typography variant="subtitle2">결재 대기</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: '#FF8C00', fontWeight: 700 }}>
              {requested}
            </Typography>
          </CardContent>
        </Card>

        {/* 승인 완료 */}
        <Card
          sx={{
            flex: 1,
            cursor: 'pointer',
            bgcolor: colorScheme.surfaceColor,
            border: statusFilter === 'APPROVED' ? '2px solid #20C997' : `1px solid ${colorScheme.textFieldBorderColor}`,
          }}
          onClick={() => {
            setSelectedTab('all');
            setStatusFilter('APPROVED');
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon sx={{ color: '#20C997' }} />
              <Typography variant="subtitle2">승인 완료</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: '#20C997', fontWeight: 700 }}>
              {approved}
            </Typography>
          </CardContent>
        </Card>

        {/* 반려 처리 */}
        <Card
          sx={{
            flex: 1,
            cursor: 'pointer',
            bgcolor: colorScheme.surfaceColor,
            border: statusFilter === 'REJECTED' ? '2px solid #DC3545' : `1px solid ${colorScheme.textFieldBorderColor}`,
          }}
          onClick={() => {
            setSelectedTab('all');
            setStatusFilter('REJECTED');
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CancelIcon sx={{ color: '#DC3545' }} />
              <Typography variant="subtitle2">반려 처리</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: '#DC3545', fontWeight: 700 }}>
              {rejected}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // 결재 목록 필터링
  const getFilteredLeaves = (): AdminWaitingLeave[] => {
    if (!adminData) return [];

    let list = [...adminData.waiting_leaves];

    // 탭 필터 적용
    if (selectedTab === 'pending') {
      list = list.filter((leave) => leave.status.toUpperCase().includes('REQUESTED'));
    }

    // 상태 필터 적용
    if (statusFilter) {
      if (statusFilter === 'REQUESTED') {
        list = list.filter((leave) => leave.status.toUpperCase().includes('REQUESTED'));
      } else {
        list = list.filter((leave) => leave.status === statusFilter);
      }
    }

    return list;
  };

  // 페이지네이션 적용된 목록
  const getPaginatedLeaves = (): AdminWaitingLeave[] => {
    const filteredLeaves = getFilteredLeaves();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLeaves.slice(startIndex, endIndex);
  };

  // 총 페이지 수 계산
  const getTotalPages = (): number => {
    const filteredLeaves = getFilteredLeaves();
    return Math.ceil(filteredLeaves.length / itemsPerPage);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // 상태 색상 반환
  const getStatusColor = (status: string) => {
    if (status.includes('REQUESTED')) return '#FF8C00';
    if (status === 'APPROVED') return '#20C997';
    if (status === 'REJECTED') return '#DC3545';
    return '#6B7280';
  };

  // 상태 레이블 반환
  const getStatusLabel = (leave: AdminWaitingLeave) => {
    if (leave.isCancel === 1) {
      return '🔄 취소 대기';
    }
    if (leave.status === 'REQUESTED') return '대기';
    if (leave.status === 'APPROVED') return '승인';
    if (leave.status === 'REJECTED') return '반려';
    return leave.status;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.backgroundColor }}>
      {/* AppBar */}
      <Box
        sx={{
          bgcolor: isDark ? '#4C1D95' : '#9C88D4',
          color: 'white',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/leave')} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            관리자 - 휴가 결재 관리
          </Typography>
        </Box>

        {/* 탭 버튼 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={selectedTab === 'pending' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setSelectedTab('pending');
              setStatusFilter('REQUESTED');
            }}
            sx={{
              bgcolor: selectedTab === 'pending' ? 'white' : 'transparent',
              color: selectedTab === 'pending' ? '#9C88D4' : 'white',
              borderColor: 'white',
              '&:hover': {
                bgcolor: selectedTab === 'pending' ? 'white' : 'rgba(255,255,255,0.1)',
              },
            }}
          >
            대기 중
          </Button>
          <Button
            variant={selectedTab === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setSelectedTab('all');
              setStatusFilter(null);
            }}
            sx={{
              bgcolor: selectedTab === 'all' ? 'white' : 'transparent',
              color: selectedTab === 'all' ? '#9C88D4' : 'white',
              borderColor: 'white',
              '&:hover': {
                bgcolor: selectedTab === 'all' ? 'white' : 'rgba(255,255,255,0.1)',
              },
            }}
          >
            전체
          </Button>
        </Box>
      </Box>

      {/* 메인 컨텐츠 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 통계 카드 */}
        {renderStatsCards()}

        {/* 결재 목록 */}
        <Card sx={{ borderRadius: '16px', bgcolor: colorScheme.surfaceColor }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedTab === 'pending' ? '결재 대기 목록' : '전체 결재 목록'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value as number)}
                    sx={{ fontSize: '13px' }}
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}년
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Chip
                  label={`${getFilteredLeaves().length}건`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ maxHeight: 500, overflow: 'auto', bgcolor: colorScheme.surfaceColor }}
            >
              <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>신청자</TableCell>
                    <TableCell>휴가 종류</TableCell>
                    <TableCell>기간</TableCell>
                    {!isMobile && <TableCell>일수</TableCell>}
                    <TableCell>상태</TableCell>
                    <TableCell align="center">처리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getPaginatedLeaves().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 5 : 6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">결재 대기 건이 없습니다</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedLeaves().map((leave) => (
                      <TableRow key={leave.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {leave.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {leave.department} · {leave.jobPosition}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{leave.leaveType}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: isMobile ? '11px' : '13px' }}>
                            {dayjs(leave.startDate).format('YYYY-MM-DD')}
                            <br />~{' '}
                            {dayjs(leave.endDate).format('YYYY-MM-DD')}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {leave.workdaysCount}일
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip
                            label={getStatusLabel(leave)}
                            size="small"
                            sx={{
                              bgcolor: `${getStatusColor(leave.status)}22`,
                              color: getStatusColor(leave.status),
                              fontSize: '11px',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {leave.status.includes('REQUESTED') && (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setApprovalAction('approve');
                                  setApprovalDialog(true);
                                }}
                              >
                                승인
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setApprovalAction('reject');
                                  setApprovalDialog(true);
                                }}
                              >
                                반려
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 페이지네이션 */}
            {getFilteredLeaves().length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={getTotalPages()}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 승인/반려 다이얼로그 */}
      <Dialog
        open={approvalDialog}
        onClose={() => !actionLoading && setApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            {approvalAction === 'approve' ? '휴가 승인' : '휴가 반려'}
          </Typography>
          <IconButton onClick={() => !actionLoading && setApprovalDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: colorScheme.surfaceColor, borderRadius: '8px', border: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  신청자
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedLeave.name} ({selectedLeave.department} · {selectedLeave.jobPosition})
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
                  휴가 종류
                </Typography>
                <Typography variant="body1">
                  {selectedLeave.leaveType}
                  {selectedLeave.isCancel === 1 && (
                    <Chip label="취소 상신" size="small" color="warning" sx={{ ml: 1 }} />
                  )}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
                  휴가 기간
                </Typography>
                <Typography variant="body1">
                  {dayjs(selectedLeave.startDate).format('YYYY-MM-DD')} ~{' '}
                  {dayjs(selectedLeave.endDate).format('YYYY-MM-DD')} ({selectedLeave.workdaysCount}일)
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
                  사유
                </Typography>
                <Typography variant="body1">{selectedLeave.reason}</Typography>
              </Box>

              {approvalAction === 'reject' && (
                <TextField
                  label="반려 사유"
                  multiline
                  rows={3}
                  fullWidth
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  required
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setApprovalDialog(false)} variant="outlined" disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={approvalAction === 'approve' ? handleApprove : handleReject}
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            disabled={actionLoading}
          >
            {actionLoading
              ? '처리 중...'
              : approvalAction === 'approve'
                ? '승인하기'
                : '반려하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
