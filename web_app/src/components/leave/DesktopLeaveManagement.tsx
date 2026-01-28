import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Badge,
} from '@mui/material';
import {
  Event as EventIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  EditCalendar as EditCalendarIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Pending as PendingIcon,
  CalendarMonth as CalendarMonthIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AutoAwesome as AutoAwesomeIcon,
  HelpOutline as HelpOutlineIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';

import dayjs from 'dayjs';
import type {
  LeaveManagementData,
  LeaveStatus,
} from '../../types/leave';
import authService from '../../services/authService';
import PersonalCalendar from '../calendar/PersonalCalendar';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import {
  useDesktopLeaveManagementState,
} from './DesktopLeaveManagement.state';
import type { ManagementTableRow } from './DesktopLeaveManagement.types';
import DesktopLeaveManagementModals from './DesktopLeaveManagement.modals';

interface DesktopLeaveManagementProps {
  leaveData: LeaveManagementData;
  onRefresh: () => void;
  waitingCount?: number;
}

export default function DesktopLeaveManagement({
  leaveData,
  onRefresh,
  waitingCount = 0,
}: DesktopLeaveManagementProps) {
  const navigate = useNavigate();
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';

  // is_approver 확인
  const user = authService.getCurrentUser();
  const isApprover = user?.isApprover || false;

  // 디버깅
  console.log('📍 [DesktopLeaveManagement] user:', user);
  console.log('📍 [DesktopLeaveManagement] isApprover:', isApprover);

  const { state, derived, actions } = useDesktopLeaveManagementState({
    leaveData,
    onRefresh,
  });
  const {
    hideCanceled,
    selectedYear,
    sidebarOpen,
    currentPage,
    itemsPerPage,
    yearlyLoading,
    managementTableData,
    tableLoading,
  } = state;

  const {
    getFilteredYearlyDetails,
    getPaginatedYearlyDetails,
    filteredCount,
    totalPages,
    getStatusColor,
  } = derived;

  const {
    setAiModalOpen,
    setLeaveManualOpen,
    setLeaveAIManualOpen,
    setHideCanceled,
    setSelectedYear,
    setTotalCalendarOpen,
    setDetailPanelOpen,
    setSelectedLeaveDetail,
    setManagementTableDialogOpen,
    setSidebarOpen,
    handleRequestDialogOpen,
    handlePageChange,
  } = actions;

  const getStatusIcon = (status: string) => {
    const colors = {
      approved: isDark ? '#34D399' : '#20C997',
      rejected: isDark ? '#F87171' : '#DC3545',
      requested: isDark ? '#FBBF24' : '#FF8C00',
      cancelRequested: isDark ? '#FCD34D' : '#F59E0B',
      cancelled: isDark ? '#9CA3AF' : '#9CA3AF',
      default: isDark ? '#9CA3AF' : '#6B7280',
    };

    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon sx={{ color: colors.approved, fontSize: 20 }} />;
      case 'REJECTED':
        return <CancelIcon sx={{ color: colors.rejected, fontSize: 20 }} />;
      case 'REQUESTED':
        return <PendingIcon sx={{ color: colors.requested, fontSize: 20 }} />;
      case 'CANCEL_REQUESTED':
        return <PendingIcon sx={{ color: colors.cancelRequested, fontSize: 20 }} />;
      case 'CANCELLED':
        return <CancelIcon sx={{ color: colors.cancelled, fontSize: 20 }} />;
      default:
        return <ScheduleIcon sx={{ color: colors.default, fontSize: 20 }} />;
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.backgroundColor }}>
      {/* 사이드바와 메인 컨텐츠를 감싸는 컨테이너 */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 사이드바 */}
        <Box
          sx={{
            width: sidebarOpen ? 240 : 60,
            bgcolor: colorScheme.surfaceColor,
            borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease-in-out',
            position: 'relative',
            zIndex: 1000,
          }}
        >
          {/* 사이드바 헤더 */}
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'space-between' : 'center',
              borderBottom: `1px solid ${colorScheme.textFieldBorderColor}`,
              minHeight: 64,
            }}
          >
            {sidebarOpen && (
              <Typography sx={{ fontSize: '16px', fontWeight: 600, color: colorScheme.textColor }}>
                메뉴
              </Typography>
            )}
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{
                color: colorScheme.hintTextColor,
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' },
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Box>

          {/* 사이드바 메뉴 */}
          <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
            {/* 부서 휴가 현황 메뉴 (기존) */}
            <Box
              onClick={() => setTotalCalendarOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: sidebarOpen ? 2 : 1.5,
                py: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                },
              }}
            >
              <CalendarMonthIcon sx={{ color: colorScheme.primaryColor, fontSize: 24 }} />
              {sidebarOpen && (
                <Typography
                  sx={{
                    ml: 2,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colorScheme.textColor,
                  }}
                >
                  부서 휴가 현황
                </Typography>
              )}
            </Box>

            {/* 휴가 부여 내역 메뉴 (신규 추가) */}
            <Box
              onClick={() => navigate('/leave-grant-history')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: sidebarOpen ? 2 : 1.5,
                py: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                },
              }}
            >
              <AssignmentIcon sx={{ color: colorScheme.primaryColor, fontSize: 24 }} />
              {sidebarOpen && (
                <Typography
                  sx={{
                    ml: 2,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colorScheme.textColor,
                  }}
                >
                  휴가 부여 내역
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* 메인 컨텐츠 영역 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* AppBar - Flutter 스타일 */}
          <Box
            sx={{
              bgcolor: colorScheme.surfaceColor,
              borderBottom: `1px solid ${colorScheme.textFieldBorderColor}`,
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* 왼쪽: 뒤로가기 버튼 + 타이틀 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => navigate('/chat')}
                sx={{
                  color: colorScheme.textColor,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px', color: colorScheme.textColor }}>
                휴가관리
              </Typography>
            </Box>

            {/* Toolbar Buttons - Flutter 스타일 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', minWidth: 0 }}>
              {/* 휴가관리 사용 가이드 버튼 */}
              <Button
                variant="text"
                startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
                onClick={() => setLeaveManualOpen(true)}
                sx={{
                  color: colorScheme.textColor,
                  fontSize: '13px',
                  textTransform: 'none',
                }}
              >
                사용 가이드
              </Button>

              {/* 휴가 AI 작성 메뉴얼 버튼 */}
              <Button
                variant="text"
                startIcon={<SmartToyIcon sx={{ fontSize: 18 }} />}
                onClick={() => setLeaveAIManualOpen(true)}
                sx={{
                  color: colorScheme.textColor,
                  fontSize: '13px',
                  textTransform: 'none',
                }}
              >
                AI 메뉴얼
              </Button>

              {/* 내 휴가계획 AI 추천 버튼 (AppBar로 이동) */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => setAiModalOpen(true)}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#667EEA',
                  color: '#667EEA',
                  px: 2,
                  '&:hover': {
                    borderColor: '#764BA2',
                    bgcolor: isDark ? 'rgba(102, 126, 234, 0.05)' : 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                내 휴가계획 AI 추천
              </Button>

              {/* 관리자용 결재 버튼 - 승인자인 경우에만 표시 */}
              {isApprover && (
                <Badge
                  badgeContent={waitingCount}
                  color="error"
                  invisible={waitingCount === 0}
                  max={99}
                >
                  <Button
                    variant="contained"
                    startIcon={<AdminPanelSettingsIcon sx={{ fontSize: 18 }} />}
                    onClick={() => {
                      navigate('/admin-leave', { replace: false });
                    }}
                    sx={{
                      bgcolor: isDark ? '#8B5CF6' : '#6F42C1',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 2,
                      py: 0.75,
                      '&:hover': {
                        bgcolor: isDark ? '#7C3AED' : '#5a359a',
                      },
                    }}
                  >
                    관리자용 결재
                  </Button>
                </Badge>
              )}

              {/* 취소건 숨김 버튼 */}
              <Button
                variant="text"
                startIcon={
                  hideCanceled ? (
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityOffIcon sx={{ fontSize: 18 }} />
                  )
                }
                onClick={() => setHideCanceled(!hideCanceled)}
                sx={{
                  color: colorScheme.textColor,
                  fontSize: '13px',
                  textTransform: 'none',
                }}
              >
                취소건 숨김
              </Button>

              {/* 휴가 작성 버튼 */}
              <Button
                variant="contained"
                startIcon={<EditCalendarIcon sx={{ fontSize: 18 }} />}
                onClick={handleRequestDialogOpen}
                sx={{
                  bgcolor: isDark ? '#60A5FA' : '#3B82F6',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 2,
                  py: 0.75,
                  '&:hover': {
                    bgcolor: isDark ? '#3B82F6' : '#2563EB',
                  },
                }}
              >
                휴가 작성
              </Button>
            </Box>
          </Box>

          {/* Main Content - Flutter 레이아웃과 동일 */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', minWidth: 0 }}>
              {/* 상단 영역: 내 휴가 현황 + 결재진행 현황 */}
              <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, alignItems: 'stretch', minWidth: 0 }}>
                {/* 왼쪽: 내 휴가 현황 */}
                <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
                  <Card
                    sx={{
                      width: '100%',
                      borderRadius: '12px',
                      border: `1px solid ${colorScheme.textFieldBorderColor}`,
                      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: colorScheme.surfaceColor,
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexShrink: 0 }}>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: '8px',
                            background: isDark
                              ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
                              : 'linear-gradient(135deg, #20C997 0%, #17A589 100%)',
                            mr: 1,
                          }}
                        >
                          <EventIcon sx={{ color: 'white', fontSize: 14 }} />
                        </Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: colorScheme.textColor }}>
                          내 휴가 현황
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'stretch' }}>
                        {leaveData.leaveStatus && leaveData.leaveStatus.length > 0 ? (
                          leaveData.leaveStatus.slice(0, 4).map((status: LeaveStatus, index: number) => (
                            <Box
                              key={index}
                              sx={{
                                flex: 1,
                                textAlign: 'center',
                                p: 1,
                                borderRadius: '6px',
                                bgcolor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(32, 201, 151, 0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography sx={{ fontSize: '10px', color: colorScheme.hintTextColor, mb: 0.25, fontWeight: 500 }}>
                                {(status as any).leave_type || status.leaveType || '휴가'}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '16px',
                                  fontWeight: 700,
                                  color: isDark ? '#34D399' : '#20C997',
                                  lineHeight: 1.1,
                                }}
                              >
                                {(status as any).remain_days ?? status.remainDays ?? 0}
                                <Typography component="span" sx={{ fontSize: '10px', ml: 0.25 }}>
                                  일
                                </Typography>
                              </Typography>
                              <Typography sx={{ fontSize: '9px', color: colorScheme.hintTextColor, mt: 0.25 }}>
                                / {(status as any).total_days ?? status.totalDays ?? 0}일
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography sx={{ fontSize: '12px', color: colorScheme.hintTextColor, textAlign: 'center', flex: 1, py: 1.5 }}>
                            휴가 정보 없음
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* 오른쪽: 결재진행 현황 */}
                <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
                  <Card
                    sx={{
                      width: '100%',
                      borderRadius: '12px',
                      border: `1px solid ${colorScheme.textFieldBorderColor}`,
                      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: colorScheme.surfaceColor,
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: '8px',
                              background: isDark
                                ? 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
                                : 'linear-gradient(135deg, #1E88E5 0%, #1976D2 100%)',
                              mr: 1,
                            }}
                          >
                            <AssignmentIcon sx={{ color: 'white', fontSize: 14 }} />
                          </Box>
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: colorScheme.textColor }}>
                            결재 진행 현황
                          </Typography>
                        </Box>

                        <Chip
                          label={`총 ${(leaveData.approvalStatus?.requested || 0) +
                            (leaveData.approvalStatus?.approved || 0) +
                            (leaveData.approvalStatus?.rejected || 0)
                            }건`}
                          size="small"
                          sx={{
                            bgcolor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(30, 136, 229, 0.12)',
                            color: isDark ? '#60A5FA' : '#1E88E5',
                            fontSize: '10px',
                            fontWeight: 600,
                            height: 22,
                            px: 0.75,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'stretch' }}>
                        {/* 대기중 */}
                        <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: '6px', bgcolor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 140, 0, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25, mb: 0.25 }}>
                            <ScheduleIcon sx={{ fontSize: 12, color: isDark ? '#FBBF24' : '#FF8C00' }} />
                            <Typography sx={{ fontSize: '10px', color: colorScheme.hintTextColor, fontWeight: 500 }}>대기중</Typography>
                          </Box>
                          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#FBBF24' : '#FF8C00', lineHeight: 1.1 }}>
                            {leaveData.approvalStatus?.requested || 0}
                          </Typography>
                        </Box>

                        {/* 승인됨 */}
                        <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: '6px', bgcolor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(32, 201, 151, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25, mb: 0.25 }}>
                            <CheckCircleIcon sx={{ fontSize: 12, color: isDark ? '#34D399' : '#20C997' }} />
                            <Typography sx={{ fontSize: '10px', color: colorScheme.hintTextColor, fontWeight: 500 }}>승인됨</Typography>
                          </Box>
                          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#34D399' : '#20C997', lineHeight: 1.1 }}>
                            {leaveData.approvalStatus?.approved || 0}
                          </Typography>
                        </Box>

                        {/* 반려됨 */}
                        <Box sx={{ flex: 1, textAlign: 'center', p: 1, borderRadius: '6px', bgcolor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 53, 69, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25, mb: 0.25 }}>
                            <CancelIcon sx={{ fontSize: 12, color: isDark ? '#F87171' : '#DC3545' }} />
                            <Typography sx={{ fontSize: '10px', color: colorScheme.hintTextColor, fontWeight: 500 }}>반려됨</Typography>
                          </Box>
                          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#F87171' : '#DC3545', lineHeight: 1.1 }}>
                            {leaveData.approvalStatus?.rejected || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* 하단 영역: 개인별 휴가 내역 + 달력/휴가 관리 대장 */}
              <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minHeight: 0, minWidth: 0 }}>
                {/* 왼쪽: 개인별 휴가 내역 (50%) */}
                <Box sx={{ flex: '1 1 0', minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <Card sx={{ height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.surfaceColor, border: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                    <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0, gap: 1, minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: colorScheme.textColor,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          개인별 휴가 내역
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', minWidth: 0 }}>
                          <Chip
                            label={`${filteredCount}건${filteredCount > 0 ? ` (${currentPage}/${totalPages}페이지)` : ''}`}
                            size="small"
                            color={filteredCount > itemsPerPage ? "primary" : "default"}
                            sx={{ fontSize: '11px', flexShrink: 0 }}
                          />
                          <FormControl size="small" sx={{ minWidth: 100, flexShrink: 0 }}>
                            <Select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(e.target.value as number)}
                              sx={{
                                fontSize: '13px',
                                bgcolor: colorScheme.surfaceColor,
                                color: colorScheme.textColor,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: colorScheme.textFieldBorderColor,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: colorScheme.textFieldBorderColor,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: colorScheme.textFieldBorderColor,
                                },
                                '& .MuiSelect-icon': {
                                  color: colorScheme.textColor,
                                },
                              }}
                            >
                              {[2024, 2025, 2026].map((year) => (
                                <MenuItem
                                  key={year}
                                  value={year}
                                  sx={{
                                    color: colorScheme.textColor,
                                    bgcolor: colorScheme.surfaceColor,
                                    '&:hover': {
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                    },
                                    '&.Mui-selected': {
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                      '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                                      },
                                    },
                                  }}
                                >
                                  {year}년
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      <Box sx={{ flex: 1, overflow: 'auto' }}>
                        {yearlyLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : getPaginatedYearlyDetails().length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {getPaginatedYearlyDetails().map((detail: YearlyDetail, index: number) => (
                              <Box
                                key={index}
                                sx={{
                                  p: 1.5,
                                  border: '1px solid',
                                  borderColor: colorScheme.textFieldBorderColor,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  bgcolor: colorScheme.surfaceColor,
                                  '&:hover': {
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                  },
                                }}
                                onClick={() => {
                                  setSelectedLeaveDetail(detail);
                                  setDetailPanelOpen(true);
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                    {getStatusIcon(detail.status)}
                                    <Typography
                                      noWrap
                                      sx={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: colorScheme.textColor,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {detail.leaveType}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={
                                      detail.status === 'APPROVED' ? '승인' :
                                        detail.status === 'REJECTED' ? '반려' :
                                          detail.status === 'REQUESTED' ? '대기' :
                                            detail.status === 'CANCEL_REQUESTED' ? '취소 대기' :
                                              detail.status === 'CANCELLED' ? '취소' :
                                                '대기'
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor: `${getStatusColor(detail.status)}22`,
                                      color: getStatusColor(detail.status),
                                      fontSize: '11px',
                                      height: 20,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  noWrap
                                  sx={{
                                    fontSize: '12px',
                                    color: colorScheme.hintTextColor,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {dayjs(detail.startDate).format('YYYY-MM-DD')} ~ {dayjs(detail.endDate).format('YYYY-MM-DD')}
                                </Typography>
                                <Typography
                                  noWrap
                                  sx={{
                                    fontSize: '12px',
                                    color: colorScheme.hintTextColor,
                                    mt: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {detail.reason}
                                </Typography>
                                {detail.rejectMessage && (
                                  <Box sx={{
                                    mt: 1,
                                    p: 1,
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                    borderRadius: 1,
                                    border: `1px solid ${colorScheme.textFieldBorderColor}`
                                  }}>
                                    <Typography
                                      noWrap
                                      sx={{
                                        fontSize: '11px',
                                        color: colorScheme.textColor,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      <Typography component="span" sx={{ fontWeight: 600 }}>반려 사유:</Typography> {detail.rejectMessage}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <EventIcon sx={{ fontSize: 60, color: isDark ? '#4B5563' : '#E5E7EB', mb: 1 }} />
                            <Typography sx={{ color: colorScheme.hintTextColor }}>
                              {getFilteredYearlyDetails().length === 0 ? '휴가 내역이 없습니다' : '해당 페이지에 항목이 없습니다'}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* 페이지네이션 */}
                      {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexShrink: 0 }}>
                          <Stack spacing={2}>
                            <Pagination
                              count={totalPages}
                              page={currentPage}
                              onChange={(_e, page) => handlePageChange(page)}
                              color="primary"
                              size="small"
                              showFirstButton
                              showLastButton
                            />
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                {/* 오른쪽: 달력 + 휴가 관리 대장 (50%) */}
                <Box sx={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, minWidth: 0 }}>
                  {/* 위: 휴가 일정 달력 (55%) */}
                  <Box sx={{ flex: 5.5, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.surfaceColor, border: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                      <CardContent sx={{ p: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                          <PersonalCalendar
                            monthlyLeaves={leaveData.monthlyLeaves || []}
                            loading={false}
                            error={null}
                            onTotalCalendarOpen={() => setTotalCalendarOpen(true)}
                            title="휴가 일정 달력"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* 아래: 휴가 관리 대장 (45%) */}
                  <Box sx={{ flex: 4.5, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.surfaceColor, border: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
                          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: colorScheme.textColor }}>휴가 관리 대장</Typography>
                          <IconButton
                            onClick={() => setManagementTableDialogOpen(true)}
                            size="small"
                            sx={{ p: 0.5 }}
                            title="크게 보기"
                          >
                            <FullscreenIcon />
                          </IconButton>
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                          <TableContainer sx={{ maxHeight: '100%', overflowX: 'auto' }}>
                            <Table size="small" stickyHeader sx={{ borderCollapse: 'separate', minWidth: 800 }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F9FAFB',
                                      color: colorScheme.textColor,
                                      px: 1,
                                      py: 1,
                                      borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                                      position: 'sticky',
                                      left: 0,
                                      zIndex: 3,
                                    }}
                                  >
                                    휴가종류
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F9FAFB',
                                      color: colorScheme.textColor,
                                      px: 1,
                                      py: 1,
                                      borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                                      textAlign: 'center',
                                    }}
                                  >
                                    허용일수
                                  </TableCell>
                                  {/* 월별 사용 현황 헤더 - 각 월별로 개별 셀 사용 */}
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                                    <TableCell
                                      key={month}
                                      sx={{
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F9FAFB',
                                        color: colorScheme.hintTextColor,
                                        px: 0.5,
                                        py: 1,
                                        borderRight: month < 12 ? `1px solid ${colorScheme.textFieldBorderColor}` : 'none',
                                        textAlign: 'center',
                                        minWidth: '40px',
                                        width: '40px',
                                      }}
                                    >
                                      {month}월
                                    </TableCell>
                                  ))}
                                  <TableCell
                                    sx={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F9FAFB',
                                      color: colorScheme.textColor,
                                      px: 1,
                                      py: 1,
                                      textAlign: 'center',
                                    }}
                                  >
                                    사용일수
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F9FAFB',
                                      color: colorScheme.textColor,
                                      px: 1,
                                      py: 1,
                                      textAlign: 'center',
                                    }}
                                  >
                                    남은일수
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {tableLoading ? (
                                  <TableRow>
                                    <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                                      <CircularProgress size={24} />
                                    </TableCell>
                                  </TableRow>
                                ) : managementTableData && managementTableData.length > 0 ? (
                                  managementTableData.map((row: ManagementTableRow, index: number) => {
                                    const allowedDays = row.allowedDays || 0;
                                    const totalUsed = row.totalUsed || 0;
                                    const remainDays = allowedDays - totalUsed;
                                    const usedByMonth = row.usedByMonth || Array(12).fill(0);

                                    return (
                                      <TableRow
                                        key={index}
                                        hover
                                        sx={{
                                          '&:hover': {
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                                            '& .sticky-cell': {
                                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                                            },
                                          },
                                        }}
                                      >
                                        <TableCell
                                          className="sticky-cell"
                                          sx={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            px: 1,
                                            py: 1,
                                            borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 2,
                                            bgcolor: colorScheme.surfaceColor,
                                            color: colorScheme.textColor,
                                          }}
                                        >
                                          {row.leaveType || '-'}
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            px: 1,
                                            py: 1,
                                            borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                                            textAlign: 'center',
                                            color: colorScheme.textColor,
                                          }}
                                        >
                                          {allowedDays > 0 ? allowedDays : '-'}
                                        </TableCell>
                                        {/* 월별 사용일수 */}
                                        {usedByMonth.map((days: number, monthIndex: number) => (
                                          <TableCell
                                            key={monthIndex}
                                            sx={{
                                              fontSize: '10px',
                                              fontWeight: 600,
                                              px: 0.5,
                                              py: 1,
                                              textAlign: 'center',
                                              borderRight: monthIndex < 11 ? `1px solid ${colorScheme.textFieldBorderColor}` : 'none',
                                              color: days > 0 ? colorScheme.textColor : colorScheme.hintTextColor,
                                              minWidth: '40px',
                                              width: '40px',
                                            }}
                                          >
                                            {days > 0 ? days : '-'}
                                          </TableCell>
                                        ))}
                                        <TableCell
                                          sx={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            px: 1,
                                            py: 1,
                                            borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                                            textAlign: 'center',
                                            color: colorScheme.textColor,
                                          }}
                                        >
                                          {totalUsed > 0 ? totalUsed : '-'}
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            px: 1,
                                            py: 1,
                                            textAlign: 'center',
                                            color: remainDays > 0
                                              ? (isDark ? '#34D399' : '#059669')
                                              : (isDark ? '#F87171' : '#DC2626'),
                                          }}
                                        >
                                          {remainDays}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                                      <Typography sx={{ fontSize: '12px', color: colorScheme.hintTextColor }}>
                                        데이터가 없습니다
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>


          <DesktopLeaveManagementModals
            state={state}
            actions={actions}
            colorScheme={colorScheme}
            isDark={isDark}
            leaveStatusList={leaveData.leaveStatus}
            userId={user?.userId || ''}
            onRefresh={onRefresh}
            getStatusIcon={getStatusIcon}
          />

        </Box>
      </Box>
    </Box>

  );
}
