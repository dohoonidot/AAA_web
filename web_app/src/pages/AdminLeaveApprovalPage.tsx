import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  Checkbox,
  Pagination,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  EventNote as EventNoteIcon,
  Menu as MenuIcon,
  PeopleAltOutlined as PeopleAltOutlinedIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon,
  Refresh as RefreshIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useThemeStore } from '../store/themeStore';
import { AdminCalendarSidebar } from '../components/admin/AdminCalendarSidebar';
import {
  RenderReasonWithCancelHighlight,
  formatServerDateDots,
  formatServerDateMD,
} from './admin/AdminLeaveApproval.shared';
import { useAdminLeaveApprovalState } from './admin/AdminLeaveApproval.state';
import AdminLeaveApprovalModals from './admin/AdminLeaveApproval.modals';


const AdminLeaveApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';

  const { state, derived, actions } = useAdminLeaveApprovalState({ isMobile });
  const {
    currentTab,
    statusFilter,
    selectedYear,
    adminData,
    loading,
    error,
    showAdvancedFilters,
    departmentFilter,
    positionFilter,
    leaveTypeFilters,
    dateRangeFilter,
    nameSearchFilter,
    availableDepartments,
    availablePositions,
    availableLeaveTypes,
    approvalDialog,
    selectedLeave,
    approvalAction,
    rejectMessage,
    actionLoading,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    selectedDate,
    currentPage,
    itemsPerPage,
    currentCalendarDate,
    calendarLeaves,
    holidays,
    fullscreenModalOpen,
    modalCalendarDate,
    modalSelectedDate,
    modalHolidays,
    sidebarExpanded,
    sidebarPinned,
    mobileDrawerOpen,
    yearMonthPickerOpen,
    departmentStatusModalOpen,
    detailModalOpen,
    selectedDetailLeave,
    isBatchMode,
    selectedItems,
    isBatchProcessing,
  } = state;

  const {
    hasActiveFilters,
    getActiveFiltersSummary,
    getStats,
    getFilteredLeaves,
    getPaginatedLeaves,
    totalPages,
    getLeavesForDate,
    getSelectedDateDetails,
    generateCalendar,
    getHolidayName,
    getStatusColor,
    getStatusLabel,
  } = derived;

  const {
    setCurrentTab,
    setStatusFilter,
    setSelectedYear,
    setAdminData,
    setLoading,
    setError,
    setShowAdvancedFilters,
    setDepartmentFilter,
    setPositionFilter,
    setLeaveTypeFilters,
    setDateRangeFilter,
    setNameSearchFilter,
    setApprovalDialog,
    setSelectedLeave,
    setApprovalAction,
    setRejectMessage,
    setActionLoading,
    setSnackbarOpen,
    setSelectedDate,
    setCurrentPage,
    setCurrentCalendarDate,
    setCalendarLeaves,
    setFullscreenModalOpen,
    setModalCalendarDate,
    setModalSelectedDate,
    setSidebarExpanded,
    setSidebarPinned,
    setMobileDrawerOpen,
    setYearMonthPickerOpen,
    setDepartmentStatusModalOpen,
    setDetailModalOpen,
    setSelectedDetailLeave,
    setHolidays,
    setModalHolidays,
    resetFilters,
    handleTabChange,
    handleStatusFilter,
    handleDepartmentFilter,
    handlePositionFilter,
    toggleLeaveTypeFilter,
    handleDateRangeFilter,
    handleNameSearchFilter,
    handlePageChange,
    handleMonthChange,
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleBulkReject,
    toggleBatchMode,
    toggleSelectAll,
    toggleItemSelection,
    batchApprove,
    batchReject,
    showBatchRejectDialog,
    loadAdminData,
    loadYearlyWaitingList,
    handleYearMonthConfirm,
  } = actions;

  const stats = getStats();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedHolidayName = getHolidayName(selectedDate, holidays);
  const modalSelectedHolidayName = getHolidayName(modalSelectedDate, modalHolidays);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.backgroundColor, position: 'relative' }}>
      {/* 데스크톱 사이드바 */}
      {!isMobile && (
        <AdminCalendarSidebar
          isExpanded={sidebarExpanded}
          isPinned={sidebarPinned}
          onHover={() => setSidebarExpanded(true)}
          onExit={() => {
            if (!sidebarPinned) {
              setSidebarExpanded(false);
            }
          }}
          onPinToggle={() => {
            setSidebarPinned(!sidebarPinned);
            if (!sidebarPinned) {
              setSidebarExpanded(true);
            }
          }}
        />
      )}

      {/* 모바일 Drawer 사이드바 */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 285,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)'
                : 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              p: 2,
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    p: 0.5,
                    borderRadius: '6px',
                    bgcolor: 'rgba(156, 136, 212, 0.1)',
                  }}
                >
                  <AdminPanelSettingsIcon
                    sx={{
                      color: '#9C88D4',
                      fontSize: 16,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#495057',
                  }}
                >
                  관리자 메뉴
                </Typography>
              </Box>
              <IconButton
                onClick={() => setMobileDrawerOpen(false)}
                size="small"
                sx={{
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6C757D',
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={<PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={() => {
                setMobileDrawerOpen(false);
                setDepartmentStatusModalOpen(true);
              }}
              sx={{
                bgcolor: '#9C88D4',
                color: 'white',
                py: 1.75,
                px: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  bgcolor: '#8B7BC4',
                },
              }}
            >
              부서원 휴가 현황
            </Button>
          </Box>
        </Drawer>
      )}

      {/* AppBar - Flutter 스타일 */}
      <Box
        sx={{
          bgcolor: isDark ? '#4C1D95' : '#9C88D4',
          color: 'white',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ml: !isMobile ? (sidebarExpanded ? '285px' : '50px') : 0,
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ color: 'white', mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <IconButton onClick={() => navigate('/chat')} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            관리자 - 휴가 결재 관리
          </Typography>
        </Box>

        {/* 탭 버튼 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* 휴가관리 버튼 - 일반 휴가관리 화면으로 이동 */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<EventNoteIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/leave', { state: { fromAdmin: true } })}
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              mr: 1,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                borderColor: 'white',
              },
            }}
          >
            휴가관리
          </Button>
          <Button
            variant={currentTab === 'pending' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleTabChange('pending')}
            sx={{
              bgcolor: currentTab === 'pending' ? 'white' : 'transparent',
              color: currentTab === 'pending' ? '#9C88D4' : 'white',
              borderColor: 'white',
              '&:hover': {
                bgcolor: currentTab === 'pending' ? 'white' : 'rgba(255,255,255,0.1)',
              },
            }}
          >
            대기 중
          </Button>
          <Button
            variant={currentTab === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleTabChange('all')}
            sx={{
              bgcolor: currentTab === 'all' ? 'white' : 'transparent',
              color: currentTab === 'all' ? '#9C88D4' : 'white',
              borderColor: 'white',
              '&:hover': {
                bgcolor: currentTab === 'all' ? 'white' : 'rgba(255,255,255,0.1)',
              },
            }}
          >
            전체
          </Button>

        </Box>
      </Box>

      {/* 메인 컨텐츠 */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        px: isMobile ? 1 : 2,
        pt: 2,
        pb: 0,
        ml: !isMobile ? (sidebarExpanded ? '285px' : '50px') : 0,
        transition: 'margin-left 0.3s ease-in-out'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 통계 카드 */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row', mb: 3 }}>
          {/* 결재 대기 */}
          <Card
            sx={{
              flex: 1,
              cursor: 'pointer',
              bgcolor: colorScheme.surfaceColor,
              border: statusFilter === 'REQUESTED' ? '2px solid #FF8C00' : `1px solid ${colorScheme.textFieldBorderColor}`,
            }}
            onClick={() => handleStatusCardClick('REQUESTED')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon sx={{ color: '#FF8C00' }} />
                <Typography variant="subtitle2">결재 대기</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FF8C00', fontWeight: 700 }}>
                {stats.requested}
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
            onClick={() => handleStatusCardClick('APPROVED')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#20C997' }} />
                <Typography variant="subtitle2">승인 완료</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#20C997', fontWeight: 700 }}>
                {stats.approved}
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
            onClick={() => handleStatusCardClick('REJECTED')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CancelIcon sx={{ color: '#DC3545' }} />
                <Typography variant="subtitle2">반려 처리</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#DC3545', fontWeight: 700 }}>
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 메인 컨텐츠 영역 */}
        {isMobile ? (
          /* 모바일: 결재 목록만 표시 (세로 스크롤) */
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            pb: 2,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDark ? colorScheme.surfaceColor : '#f1f1f1',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#6B7280' : '#9C88D4',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: isDark ? '#9CA3AF' : '#8A72C8',
            },
          }}>
            <Card sx={{ borderRadius: '16px', mt: 2, bgcolor: colorScheme.surfaceColor }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* 일괄 작업 모드일 때 전체 선택 체크박스 */}
                    {isBatchMode && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={selectedItems.size === getPaginatedLeaves().length && getPaginatedLeaves().length > 0}
                          onChange={() => toggleSelectAll(getPaginatedLeaves())}
                          sx={{ p: 0 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          전체 선택
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>
                      {currentTab === 'pending' ? '결재 대기 목록' : '전체 결재 목록'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value as number)}
                        sx={{ fontSize: '13px', height: '32px' }}
                      >
                        {[2024, 2025, 2026].map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}년
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Chip
                      label={`${getFilteredLeaves().length}건 (${currentPage}/${totalPages})`}
                      color="primary"
                      size="small"
                      sx={{ fontSize: '11px' }}
                    />
                  </Box>
                </Box>


                {/* 결재 목록 - 스크롤 가능 */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  flex: 1,
                  overflowY: 'auto',
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#9C88D4',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#8A72C8',
                  },
                }}>
                  {getPaginatedLeaves().length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        {getFilteredLeaves().length === 0 ? '결재 대기 중인 항목이 없습니다' : '해당 페이지에 항목이 없습니다'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {getFilteredLeaves().length === 0 ? '새로운 휴가 신청이 있을 때 이곳에 표시됩니다' : '다른 페이지를 확인해주세요'}
                      </Typography>
                    </Box>
                  ) : (
                    getPaginatedLeaves().map((leave: any, index: number) => (
                      <Card
                        key={leave.id || `leave-batch-${index}`}
                        onClick={() => {
                          if (!isBatchMode) {
                            setSelectedDetailLeave(leave);
                            setDetailModalOpen(true);
                          }
                        }}
                        sx={{
                          borderRadius: '8px',
                          bgcolor: colorScheme.surfaceColor,
                          border: leave.status?.includes('REQUESTED')
                            ? (leave.isCancel === 1 ? '2px solid #E53E3E' : '2px solid #FF8C00')
                            : `1px solid ${colorScheme.textFieldBorderColor}`,
                          cursor: isBatchMode ? 'default' : 'pointer',
                          flexShrink: 0, // 요소 크기 고정 - 압축 방지
                          minHeight: 'fit-content', // 최소 높이를 내용에 맞게
                          '&:hover': {
                            boxShadow: isBatchMode ? 0 : 2,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          {/* 일괄 작업 모드일 때 체크박스 */}
                          {isBatchMode && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Checkbox
                                checked={selectedItems.has(leave.id)}
                                onChange={() => toggleItemSelection(leave.id)}
                                sx={{ p: 0 }}
                              />
                            </Box>
                          )}
                          {/* 첫 번째 줄: 상태 + 휴가일수 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Chip
                              label={getStatusLabel(leave)}
                              size="small"
                              sx={{
                                bgcolor: `${getStatusColor(leave.status)}22`,
                                color: getStatusColor(leave.status),
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label={`${leave.leave_type}${leave.half_day_slot === 'AM' ? ' (오전반차)' :
                                  leave.half_day_slot === 'PM' ? ' (오후반차)' :
                                    leave.half_day_slot === 'ALL' ? ' (종일연차)' : ''
                                }`}
                              size="small"
                              sx={{
                                bgcolor: '#9C88D422',
                                color: '#9C88D4',
                              }}
                            />
                            {leave.half_day_slot && (
                              <Chip
                                label={leave.half_day_slot === 'AM' ? '오전 반차' : leave.half_day_slot === 'PM' ? '오후 반차' : leave.half_day_slot}
                                size="small"
                                sx={{
                                  bgcolor: '#FF8C0022',
                                  color: '#FF8C00',
                                  fontSize: '10px',
                                }}
                              />
                            )}
                            {leave.is_canceled === 1 && (
                              <Chip
                                label="취소 상신"
                                size="small"
                                sx={{
                                  bgcolor: '#FF8C0022',
                                  color: '#FF8C00',
                                  fontSize: '10px',
                                }}
                              />
                            )}
                            <Chip
                              label={`${Math.floor(leave.workdays_count)}일`}
                              sx={{
                                bgcolor: '#9C88D4',
                                color: 'white',
                                fontWeight: 700,
                                ml: 'auto',
                              }}
                            />
                          </Box>

                          {/* 신청자 정보 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA', borderRadius: '12px', border: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: '#9C88D422',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PersonIcon sx={{ color: '#9C88D4', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" fontWeight={600}>
                                {leave.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {leave.department} | {leave.job_position}
                              </Typography>
                            </Box>
                          </Box>

                          {/* 기간 */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight={600}>
                                {formatServerDateDots(leave.start_date)} - {formatServerDateDots(leave.end_date)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 3 }}>
                              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                신청: {dayjs(leave.requested_date).format('MM.DD HH:mm')}
                              </Typography>
                            </Box>
                          </Box>

                          {/* 휴가 잔여일 정보 */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                총 휴가일:
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {leave.total_days}일
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                잔여일:
                              </Typography>
                              <Typography variant="caption" fontWeight={600} sx={{ color: leave.remain_days < 5 ? '#DC3545' : 'inherit' }}>
                                {leave.remain_days}일
                              </Typography>
                            </Box>
                            {leave.join_date && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  입사일:
                                </Typography>
                                <Typography variant="caption" fontWeight={600}>
                                  {dayjs(leave.join_date).format('YYYY.MM.DD')}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* 사유 */}
                          {leave.reason && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                사유:
                              </Typography>
                              <RenderReasonWithCancelHighlight reason={leave.reason} maxLines={2} />
                            </Box>
                          )}

                          {/* 반려 사유 (있는 경우) */}
                          {leave.reject_message && (
                            <Box sx={{ mb: 1.5, p: 1, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', borderRadius: '8px', border: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                                반려 사유:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {leave.reject_message}
                              </Typography>
                            </Box>
                          )}

                          {/* 승인/반려 버튼 */}
                          {leave.status && leave.status.toUpperCase().includes('REQUESTED') && (
                            <>
                              <Divider sx={{ my: 2 }} />
                              <Box sx={{ display: 'flex', gap: 1.5 }}>
                                {/* 취소 상신: 취소 승인 버튼만 */}
                                {leave.status.toUpperCase().includes('CANCEL') && (
                                  <Button
                                    fullWidth
                                    variant="contained"
                                    color="warning"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLeave(leave);
                                      setApprovalAction('approve');
                                      setApprovalDialog(true);
                                    }}
                                  >
                                    취소 승인
                                  </Button>
                                )}

                                {/* 일반 상신: 반려 + 승인 버튼 */}
                                {!leave.status.toUpperCase().includes('CANCEL') && (
                                  <>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="error"
                                      startIcon={<CancelIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLeave(leave);
                                        setApprovalAction('reject');
                                        setApprovalDialog(true);
                                      }}
                                    >
                                      반려
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="success"
                                      startIcon={<CheckCircleIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLeave(leave);
                                        setApprovalAction('approve');
                                        setApprovalDialog(true);
                                      }}
                                    >
                                      승인
                                    </Button>
                                  </>
                                )}
                              </Box>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Stack spacing={2}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(e, page) => handlePageChange(page)}
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

            {/* 모바일: 달력 영역 */}
            <Card sx={{ borderRadius: '16px', mt: 2, bgcolor: colorScheme.surfaceColor }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* 달력 헤더 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.5, borderBottom: `1px solid ${colorScheme.textFieldBorderColor}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #9C88D4 0%, #8A72C8 100%)',
                      }}
                    >
                      <CalendarTodayIcon sx={{ color: 'white', fontSize: 14 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontSize: '15px', fontWeight: 600 }}>
                      부서원 휴가 일정
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setModalCalendarDate(new Date(currentCalendarDate));
                      setModalSelectedDate(new Date(selectedDate));
                      setFullscreenModalOpen(true);
                    }}
                    sx={{
                      color: '#9C88D4',
                      '&:hover': {
                        bgcolor: '#9C88D422',
                      },
                    }}
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* 월 네비게이션 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    px: 0.75,
                    py: 0.25,
                    bgcolor: colorScheme.surfaceColor,
                    borderRadius: '6px',
                    border: '1px solid #E9ECEF',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleMonthChange('prev')}
                    sx={{ color: '#6C757D' }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#495057' }}>
                    {dayjs(currentCalendarDate).format('YYYY년 M월')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleMonthChange('next')}
                    sx={{ color: '#6C757D' }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* 요일 헤더 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3, mb: 0.3 }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                    <Box
                      key={day}
                      sx={{
                        textAlign: 'center',
                        py: 0.5,
                        fontSize: '10px',
                        fontWeight: 600,
                        color: index === 0 ? '#E53E3E' : index === 6 ? '#3182CE' : '#6C757D80',
                      }}
                    >
                      {day}
                    </Box>
                  ))}
                </Box>

                {/* 달력 그리드 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                  {generateCalendar(currentCalendarDate).map((week, weekIndex) => (
                    <Box
                      key={weekIndex}
                      sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3 }}
                    >
                      {week.map((date, dayIndex) => {
                        if (!date) return <Box key={dayIndex} />;

                        const isCurrentMonth = date.getMonth() === currentCalendarDate.getMonth();
                        const isToday =
                          date.getDate() === new Date().getDate() &&
                          date.getMonth() === new Date().getMonth() &&
                          date.getFullYear() === new Date().getFullYear();
                        const isSelected =
                          date.getDate() === selectedDate.getDate() &&
                          date.getMonth() === selectedDate.getMonth() &&
                          date.getFullYear() === selectedDate.getFullYear();
                        const dayLeaves = getLeavesForDate(date);
                        const hasLeave = dayLeaves.length > 0;
                        const weekday = date.getDay();
                        const holidayName = getHolidayName(date, holidays);
                        const isHoliday = !!holidayName;

                        return (
                          <Box
                            key={dayIndex}
                            onClick={() => setSelectedDate(date)}
                            sx={{
                              aspectRatio: '1',
                              minHeight: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              bgcolor: isSelected
                                ? '#9C88D4'
                                : isToday
                                  ? '#9C88D480'
                                  : hasLeave && isCurrentMonth
                                    ? '#20C99726'
                                    : 'transparent',
                              '&:hover': {
                                bgcolor: isSelected ? '#9C88D4' : '#9C88D420',
                              },
                            }}
                          >
                              <Typography
                              variant="caption"
                              sx={{
                                fontSize: '11px',
                                fontWeight: isSelected || isToday ? 700 : 500,
                                color: isSelected
                                  ? 'white'
                                  : !isCurrentMonth
                                    ? '#ADB5BD'
                                    : isHoliday
                                      ? '#E53E3E'
                                      : weekday === 0
                                      ? '#E53E3E'
                                      : weekday === 6
                                        ? '#3182CE'
                                        : '#495057',
                              }}
                            >
                              {date.getDate()}
                            </Typography>
                            {isHoliday && !isSelected && !isToday && isCurrentMonth && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  bgcolor: '#E53E3E',
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>

                {/* 선택된 날짜의 휴가 내역 */}
                {(selectedHolidayName || getLeavesForDate(selectedDate).length > 0) && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #E9ECEF' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      {dayjs(selectedDate).format('M월 D일')} 휴가 내역
                    </Typography>
                    {selectedHolidayName && (
                      <Box
                        sx={{
                          mb: 1,
                          p: 1,
                          borderRadius: '6px',
                          bgcolor: 'rgba(229, 62, 62, 0.12)',
                          border: '1px solid rgba(229, 62, 62, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        <Chip
                          label="공휴일"
                          size="small"
                          sx={{
                            bgcolor: '#E53E3E',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 700,
                            height: 20,
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {selectedHolidayName}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {getLeavesForDate(selectedDate).map((leave: any, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            borderRadius: '6px',
                            bgcolor: colorScheme.surfaceColor,
                            border: '1px solid #E9ECEF',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                            {leave.name} ({leave.department})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {leave.leave_type}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ) : (
          /* 데스크톱: 50:50 분할 레이아웃 */
          <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 280px)' }}>
            {/* 왼쪽: 결재 목록 (50%) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Card sx={{ borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: colorScheme.surfaceColor }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {currentTab === 'pending' ? '결재 대기 목록' : '전체 결재 목록'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value as number)}
                          sx={{ fontSize: '13px', height: '32px' }}
                        >
                          {[2024, 2025, 2026].map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}년
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip
                        label={`${getFilteredLeaves().length}건 (${currentPage}/${totalPages}페이지)`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  </Box>

                  {/* 결재 목록 - 스크롤 가능 */}
                  <Box sx={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#9C88D4',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#8A72C8',
                    },
                  }}>
                    {getPaginatedLeaves().length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary">
                          {getFilteredLeaves().length === 0 ? '결재 대기 중인 항목이 없습니다' : '해당 페이지에 항목이 없습니다'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {getFilteredLeaves().length === 0 ? '새로운 휴가 신청이 있을 때 이곳에 표시됩니다' : '다른 페이지를 확인해주세요'}
                        </Typography>
                      </Box>
                    ) : (
                      getPaginatedLeaves().map((leave: any, index: number) => (
                        <Card
                          key={leave.id || `leave-${index}`}
                          onClick={() => {
                            setSelectedDetailLeave(leave);
                            setDetailModalOpen(true);
                          }}
                          sx={{
                            borderRadius: '8px',
                            bgcolor: colorScheme.surfaceColor,
                            border: leave.status?.includes('REQUESTED') ? '1px solid #FF8C00' : `1px solid ${colorScheme.textFieldBorderColor}`,
                            cursor: 'pointer',
                            p: 0,
                            flexShrink: 0, // 요소 크기 고정 - 압축 방지
                            minHeight: 'fit-content', // 최소 높이를 내용에 맞게
                            '&:hover': {
                              boxShadow: 2,
                            },
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}> {/* padding 줄임 */}
                            {/* 상태 및 휴가 타입 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label={getStatusLabel(leave)}
                                  size="small"
                                  sx={{
                                    bgcolor: `${getStatusColor(leave.status, leave.isCancel)}22`,
                                    color: getStatusColor(leave.status, leave.isCancel),
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    height: '20px',
                                    '& .MuiChip-label': { px: 0.5 },
                                  }}
                                />
                                <Chip
                                  label={`${leave.leave_type}${leave.half_day_slot === 'AM' ? ' (오전반차)' :
                                      leave.half_day_slot === 'PM' ? ' (오후반차)' :
                                        leave.half_day_slot === 'ALL' ? ' (종일연차)' : ''
                                    }`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#9C88D422',
                                    color: '#9C88D4',
                                    fontSize: '10px',
                                    height: '20px',
                                    '& .MuiChip-label': { px: 0.5 },
                                  }}
                                />
                                {leave.half_day_slot && (
                                  <Chip
                                    label={leave.half_day_slot === 'AM' ? '오전' : leave.half_day_slot === 'PM' ? '오후' : leave.half_day_slot}
                                    size="small"
                                    sx={{
                                      bgcolor: '#FF8C0022',
                                      color: '#FF8C00',
                                      fontSize: '9px',
                                      height: '18px',
                                      '& .MuiChip-label': { px: 0.3 },
                                    }}
                                  />
                                )}
                                {leave.is_canceled === 1 && (
                                  <Chip
                                    label="취소"
                                    size="small"
                                    sx={{
                                      bgcolor: '#FF8C0022',
                                      color: '#FF8C00',
                                      fontSize: '9px',
                                      height: '18px',
                                      '& .MuiChip-label': { px: 0.3 },
                                    }}
                                  />
                                )}
                              </Box>
                              <Chip
                                label={`${Math.floor(leave.workdays_count)}일`}
                                sx={{
                                  bgcolor: '#9C88D4',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  height: '22px',
                                  '& .MuiChip-label': { px: 0.8 },
                                }}
                              />
                            </Box>

                            {/* 두 번째 줄: 신청자 + 기간 한 줄로 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              {/* 신청자 정보 */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: '#9C88D422',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <PersonIcon sx={{ color: '#9C88D4', fontSize: 14 }} />
                                </Box>
                                <Box>
                                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                                    {leave.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', lineHeight: 1.2 }}>
                                    {leave.department} | {leave.job_position}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* 기간 정보 */}
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '11px' }}>
                                  {formatServerDateMD(leave.start_date)}-{formatServerDateMD(leave.end_date)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px', display: 'block' }}>
                                  {dayjs(leave.requested_date).format('MM.DD HH:mm')}
                                </Typography>
                              </Box>
                            </Box>


                            {/* 세 번째 줄: 휴가 정보 + 사유 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                  총:{leave.total_days}일
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                  잔:{leave.remain_days}일
                                </Typography>
                                {leave.join_date && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                    {dayjs(leave.join_date).format('YY.MM.DD')}입사
                                  </Typography>
                                )}
                              </Box>
                              {leave.reason && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: '10px',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {leave.reason}
                                </Typography>
                              )}
                            </Box>

                            {/* 반려 사유 (있는 경우) */}
                            {leave.reject_message && (
                              <Box sx={{ p: 0.5, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: '9px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  <Typography component="span" sx={{ fontWeight: 600 }}>반려 사유:</Typography> {leave.reject_message}
                                </Typography>
                              </Box>
                            )}

                            {/* 승인/반려 버튼 */}
                            {leave.status && leave.status.toUpperCase().includes('REQUESTED') && (
                              <>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                  {/* 취소 상신: 취소 승인 버튼만 */}
                                  {leave.status.toUpperCase().includes('CANCEL') && (
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="warning"
                                      startIcon={<CheckCircleIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLeave(leave);
                                        setApprovalAction('approve');
                                        setApprovalDialog(true);
                                      }}
                                    >
                                      취소 승인
                                    </Button>
                                  )}

                                  {/* 일반 상신: 반려 + 승인 버튼 */}
                                  {!leave.status.toUpperCase().includes('CANCEL') && (
                                    <>
                                      <Button
                                        fullWidth
                                        variant="contained"
                                        color="error"
                                        startIcon={<CancelIcon />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLeave(leave);
                                          setApprovalAction('reject');
                                          setApprovalDialog(true);
                                        }}
                                      >
                                        반려
                                      </Button>
                                      <Button
                                        fullWidth
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLeave(leave);
                                          setApprovalAction('approve');
                                          setApprovalDialog(true);
                                        }}
                                      >
                                        승인
                                      </Button>
                                    </>
                                  )}
                                </Box>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexShrink: 0 }}>
                      <Stack spacing={2}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={(e, page) => handlePageChange(page)}
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

            {/* 오른쪽: 달력 영역 (50%) - Flutter와 동일 */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
              {/* 달력 (60%) - 높이 조정 */}
              <Box sx={{ flex: 6, minHeight: 0, display: 'flex' }}>
                <Card sx={{ borderRadius: '16px', width: '100%', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.surfaceColor }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    {/* 달력 헤더 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.5, borderBottom: '1px solid #F1F3F5', flexShrink: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #9C88D4 0%, #8A72C8 100%)',
                          }}
                        >
                          <CalendarTodayIcon sx={{ color: 'white', fontSize: 14 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontSize: '15px', fontWeight: 600 }}>
                          부서원 휴가 일정
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setModalCalendarDate(new Date(currentCalendarDate));
                          setModalSelectedDate(new Date(selectedDate));
                          setFullscreenModalOpen(true);
                        }}
                        sx={{
                          color: '#9C88D4',
                          '&:hover': {
                            bgcolor: '#9C88D422',
                          },
                        }}
                      >
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* 월 네비게이션 */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 0.5,
                        px: 0.75,
                        py: 0.25,
                        bgcolor: colorScheme.surfaceColor,
                        borderRadius: '6px',
                        border: '1px solid #E9ECEF',
                        flexShrink: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleMonthChange('prev')}
                        sx={{ color: '#6C757D' }}
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#495057' }}>
                        {dayjs(currentCalendarDate).format('YYYY년 M월')}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleMonthChange('next')}
                        sx={{ color: '#6C757D' }}
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* 요일 헤더 */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3, mb: 0.3, flexShrink: 0 }}>
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <Box
                          key={day}
                          sx={{
                            textAlign: 'center',
                            py: 0.5,
                            fontSize: '10px',
                            fontWeight: 600,
                            color: index === 0 ? '#E53E3E' : index === 6 ? '#3182CE' : '#6C757D80',
                          }}
                        >
                          {day}
                        </Box>
                      ))}
                    </Box>

                    {/* 달력 그리드 */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.3, minHeight: 0 }}>
                      {generateCalendar(currentCalendarDate).map((week, weekIndex) => (
                        <Box
                          key={weekIndex}
                          sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3, flex: 1, minHeight: 0 }}
                        >
                          {week.map((date, dayIndex) => {
                            if (!date) return <Box key={dayIndex} />;

                            const isCurrentMonth = date.getMonth() === currentCalendarDate.getMonth();
                            const isToday =
                              date.getDate() === new Date().getDate() &&
                              date.getMonth() === new Date().getMonth() &&
                              date.getFullYear() === new Date().getFullYear();
                            const isSelected =
                              date.getDate() === selectedDate.getDate() &&
                              date.getMonth() === selectedDate.getMonth() &&
                              date.getFullYear() === selectedDate.getFullYear();
                            const dayLeaves = getLeavesForDate(date);
                            const hasLeave = dayLeaves.length > 0;
                            const weekday = date.getDay();
                            const holidayName = getHolidayName(date, holidays);
                            const isHoliday = !!holidayName;

                            return (
                              <Box
                                key={dayIndex}
                                onClick={() => setSelectedDate(date)}
                                sx={{
                                  height: '100%',
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  minHeight: '28px',
                                  bgcolor: isSelected
                                    ? '#9C88D4'
                                    : isToday
                                      ? '#9C88D480'
                                      : hasLeave && isCurrentMonth
                                        ? '#20C99726'
                                        : 'transparent',
                                  '&:hover': {
                                    bgcolor: isSelected ? '#9C88D4' : '#9C88D420',
                                  },
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '10px',
                                    fontWeight: isSelected || isToday ? 700 : 500,
                                    color: isSelected
                                      ? 'white'
                                      : !isCurrentMonth
                                        ? '#ADB5BD'
                                        : isHoliday
                                          ? '#E53E3E'
                                          : weekday === 0
                                          ? '#E53E3E'
                                          : weekday === 6
                                            ? '#3182CE'
                                            : '#495057',
                                  }}
                                >
                                  {date.getDate()}
                                </Typography>
                                {isHoliday && !isSelected && !isToday && isCurrentMonth && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      width: 4,
                                      height: 4,
                                      borderRadius: '50%',
                                      bgcolor: '#E53E3E',
                                    }}
                                  />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* 선택된 날짜 상세 (40%) - 높이 조정 */}
              <Box sx={{ flex: 4, minHeight: 0, display: 'flex' }}>
                <Card sx={{ borderRadius: '16px', width: '100%', display: 'flex', flexDirection: 'column', bgcolor: colorScheme.surfaceColor }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '14px', flexShrink: 0 }}>
                      {dayjs(selectedDate).format('YYYY.MM.DD')} 휴가 내역
                    </Typography>

                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, pr: 0.5 }}>
                      {selectedHolidayName && (
                        <Box
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: '6px',
                            bgcolor: 'rgba(229, 62, 62, 0.12)',
                            border: '1px solid rgba(229, 62, 62, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          <Chip
                            label="공휴일"
                            size="small"
                            sx={{
                              bgcolor: '#E53E3E',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 700,
                              height: 20,
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {selectedHolidayName}
                          </Typography>
                        </Box>
                      )}
                      {getSelectedDateDetails().length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            해당 날짜에 휴가 일정이 없습니다
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {getSelectedDateDetails().map((leave: any, index: number) => (
                            <Card
                              key={index}
                              sx={{
                                p: 1,
                                bgcolor: colorScheme.surfaceColor,
                                border: `1px solid ${colorScheme.textFieldBorderColor}`,
                                borderRadius: '6px',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 16, color: '#9C88D4' }} />
                                <Typography variant="body2" fontWeight={600}>
                                  {leave.name}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                {leave.department} · {leave.job_position}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                  label={`${leave.leave_type}${leave.half_day_slot === 'AM' ? ' (오전반차)' :
                                      leave.half_day_slot === 'PM' ? ' (오후반차)' :
                                        leave.half_day_slot === 'ALL' ? ' (종일연차)' : ''
                                    }`}
                                  size="small"
                                  sx={{
                                    fontSize: '10px',
                                    height: '20px',
                                    bgcolor: '#20C99722',
                                    color: '#20C997',
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatServerDateMD(leave.start_date)} ~ {formatServerDateMD(leave.end_date)}
                                </Typography>
                              </Box>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <AdminLeaveApprovalModals
        state={state}
        derived={derived}
        actions={actions}
        theme={theme}
        isMobile={isMobile}
        isDark={isDark}
        colorScheme={colorScheme}
        modalSelectedHolidayName={modalSelectedHolidayName}
        onConfirmYearMonth={handleYearMonthConfirm}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default AdminLeaveApprovalPage;
