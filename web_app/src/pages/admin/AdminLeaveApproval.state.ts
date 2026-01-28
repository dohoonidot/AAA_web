import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import authService from '../../services/authService';
import leaveService from '../../services/leaveService';
import type { AdminManagementApiResponse } from '../../types/leave';
import type { Holiday } from '../../types/holiday';
import { createLogger } from '../../utils/logger';
import { fetchAdminDeptCalendar, fetchAdminManagementData, fetchAdminYearlyLeave, fetchHolidays } from './AdminLeaveApproval.data';

const logger = createLogger('AdminLeaveApprovalState');

export const useAdminLeaveApprovalState = (options: { isMobile: boolean }) => {
  const itemsPerPage = options.isMobile ? 5 : 10;
  const [currentTab, setCurrentTab] = useState<'pending' | 'all'>('pending');
  const [statusFilter, setStatusFilter] = useState<string | null>('REQUESTED');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [adminData, setAdminData] = useState<AdminManagementApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [leaveTypeFilters, setLeaveTypeFilters] = useState<Set<string>>(new Set());
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: Date | null, end: Date | null }>({
    start: null,
    end: null,
  });
  const [nameSearchFilter, setNameSearchFilter] = useState('');

  const availableDepartments = useMemo(() => (
    ['개발팀', '디자인팀', '마케팅팀', '영업팀', '인사팀', '재무팀']
  ), []);
  const availablePositions = useMemo(() => (
    ['사원', '대리', '과장', '차장', '부장', '이사']
  ), []);
  const availableLeaveTypes = useMemo(() => (
    ['연차', '반차', '병가', '경조사', '출산휴가', '육아휴가', '기타']
  ), []);

  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectMessage, setRejectMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarLeaves, setCalendarLeaves] = useState<any[]>([]);

  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [modalCalendarDate, setModalCalendarDate] = useState(new Date());
  const [modalSelectedDate, setModalSelectedDate] = useState(new Date());

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [yearMonthPickerOpen, setYearMonthPickerOpen] = useState(false);
  const [departmentStatusModalOpen, setDepartmentStatusModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailLeave, setSelectedDetailLeave] = useState<any | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [modalHolidays, setModalHolidays] = useState<Holiday[]>([]);

  const resetFilters = () => {
    setDepartmentFilter('');
    setPositionFilter('');
    setLeaveTypeFilters(new Set());
    setDateRangeFilter({ start: null, end: null });
    setNameSearchFilter('');
  };

  const handleYearMonthConfirm = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const month = dayjs(modalCalendarDate).format('YYYY-MM');
      const response = await fetchAdminDeptCalendar(user.userId, month);

      if (response.monthlyLeaves) {
        setCalendarLeaves(response.monthlyLeaves);
      }
    } catch (err: any) {
      logger.error('부서별 달력 조회 실패:', err);
    }
    setYearMonthPickerOpen(false);
  };

  const hasActiveFilters = departmentFilter ||
    positionFilter ||
    leaveTypeFilters.size > 0 ||
    dateRangeFilter.start ||
    dateRangeFilter.end ||
    nameSearchFilter.trim();

  const getActiveFiltersSummary = () => {
    const filters = [] as string[];
    if (departmentFilter) filters.push(`부서: ${departmentFilter}`);
    if (positionFilter) filters.push(`직급: ${positionFilter}`);
    if (leaveTypeFilters.size > 0) filters.push(`휴가유형: ${leaveTypeFilters.size}개`);
    if (dateRangeFilter.start && dateRangeFilter.end) filters.push('날짜범위');
    if (nameSearchFilter.trim()) filters.push('이름검색');
    return filters.join(', ');
  };

  const getStats = () => {
    let requested = 0;
    let approved = 0;
    let rejected = 0;

    if (adminData?.approval_status && Array.isArray(adminData.approval_status)) {
      adminData.approval_status.forEach((item: any) => {
        if (item.status === 'REQUESTED') requested = item.count;
        if (item.status === 'APPROVED') approved = item.count;
        if (item.status === 'REJECTED') rejected = item.count;
      });
    }

    return { requested, approved, rejected };
  };

  const applyFilters = (items: any[]) => {
    return items.filter((item) => {
      if (departmentFilter && departmentFilter !== '전체') {
        if (item.department !== departmentFilter) return false;
      }

      if (positionFilter && positionFilter !== '전체') {
        if (item.job_position !== positionFilter) return false;
      }

      if (leaveTypeFilters.size > 0) {
        if (!item.leave_type || !leaveTypeFilters.has(item.leave_type)) {
          return false;
        }
      }

      if (dateRangeFilter.start && dateRangeFilter.end) {
        const requestDate = new Date(item.requested_date);
        if (requestDate < dateRangeFilter.start || requestDate > dateRangeFilter.end) {
          return false;
        }
      }

      if (nameSearchFilter.trim()) {
        const name = item.name?.toLowerCase() || '';
        if (!name.includes(nameSearchFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  };

  const getFilteredLeaves = () => {
    if (!adminData) return [];

    let list: any[] = [];
    if (currentTab === 'all') {
      list = [
        ...(adminData.monthly_leaves || []),
        ...(adminData.waiting_leaves || []),
      ];
      const uniqueList = list.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
      list = uniqueList;
    } else {
      list = [...(adminData.waiting_leaves || [])];
    }

    if (currentTab === 'pending') {
      list = list.filter((leave) => leave.status && leave.status.toUpperCase().includes('REQUESTED'));
    }

    if (statusFilter) {
      if (statusFilter === 'REQUESTED') {
        list = list.filter((leave) => leave.status && leave.status.toUpperCase().includes('REQUESTED'));
      } else {
        list = list.filter((leave) => leave.status === statusFilter);
      }
    }

    if (hasActiveFilters) {
      list = applyFilters(list);
    }

    return list;
  };

  const getPaginatedLeaves = () => {
    const filtered = getFilteredLeaves();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredLeaves().length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, statusFilter, departmentFilter, positionFilter, leaveTypeFilters, dateRangeFilter, nameSearchFilter]);

  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const calendar: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay.getDate() - i;
      week.push(new Date(year, month - 1, day));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, month, day));
      if (week.length === 7) {
        calendar.push([...week]);
        week = [];
      }
    }

    if (week.length > 0) {
      let nextDay = 1;
      while (week.length < 7) {
        week.push(new Date(year, month + 1, nextDay));
        nextDay++;
      }
      calendar.push(week);
    }

    return calendar;
  };

  const getLeavesForDate = (date: Date) => {
    return calendarLeaves.filter((leave: any) => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endLocal = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      return targetDate >= startLocal && targetDate <= endLocal;
    });
  };

  const getSelectedDateDetails = () => getLeavesForDate(selectedDate);

  const handleMonthChange = async (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentCalendarDate(newDate);

    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const month = dayjs(newDate).format('YYYY-MM');
      const response = await fetchAdminDeptCalendar(user.userId, month);

      if (response.monthlyLeaves) {
        setCalendarLeaves(response.monthlyLeaves);
      }
    } catch (err: any) {
      logger.error('부서별 달력 조회 실패:', err);
    }
  };

  const getStatusColor = (status: string, isCancel?: number) => {
    if (!status) return '#6B7280';
    if (isCancel === 1 && status === 'REQUESTED') return '#E53E3E';
    if (status === 'CANCEL_REQUESTED') return '#E53E3E';
    if (status === 'CANCELLED') return '#6C757D';
    if (status.includes('REQUESTED')) return '#FF8C00';
    if (status === 'APPROVED') return '#20C997';
    if (status === 'REJECTED') return '#DC3545';
    return '#6B7280';
  };

  const getStatusLabel = (leave: any) => {
    if (!leave.status) return '알 수 없음';
    if (leave.isCancel === 1 && leave.status === 'REQUESTED') return '🔄 취소 상신 대기';
    if (leave.status === 'CANCEL_REQUESTED') return '🔄 취소 상신 대기';
    if (leave.status === 'CANCELLED') return '상신취소';
    if (leave.status === 'REQUESTED') return '승인 대기';
    if (leave.status === 'APPROVED') return '승인됨';
    if (leave.status === 'REJECTED') return '반려됨';
    return leave.status;
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const currentMonth = dayjs().format('YYYY-MM');
      const response = await fetchAdminManagementData(user.userId, currentMonth);

      logger.dev('관리자 데이터 응답:', response);
      logger.dev('waiting_leaves 샘플:', response.waiting_leaves?.[0]);
      logger.dev('monthly_leaves 샘플:', response.monthly_leaves?.[0]);

      setAdminData(response);

      if (response.monthly_leaves) {
        setCalendarLeaves(response.monthly_leaves);
      }
    } catch (err: any) {
      logger.error('관리자 데이터 로드 실패:', err);
      setError(err.message || '관리자 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyWaitingList = async (year: number) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        logger.error('사용자 정보가 없습니다.');
        return;
      }

      logger.dev('loadYearlyWaitingList 호출됨 - year:', year, 'userId:', user.userId);

      const response = await fetchAdminYearlyLeave(user.userId, year);

      logger.dev('연도별 결재 대기 목록 응답:', response);
      logger.dev('approval_status:', response.approval_status);
      logger.dev('yearly_details 개수:', response.yearly_details?.length || 0);

      setAdminData(prev => ({
        ...prev,
        approval_status: response.approval_status || [],
        waiting_leaves: response.yearly_details || [],
      }));

      logger.dev('adminData 업데이트 완료');
    } catch (err: any) {
      logger.error('연도별 데이터 로드 실패:', err);
      logger.error('에러 상세:', err.response?.data);
      logger.error('에러 상태:', err.response?.status);
      setError(`연도별 데이터를 불러오는데 실패했습니다: ${err.message}`);
    }
  };

  const loadHolidayData = async (date: Date, setter: (value: Holiday[]) => void) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await fetchHolidays(year, month);
      setter(response.holidays || []);
    } catch (err: any) {
      console.error('공휴일 데이터 로드 실패:', err);
      setter([]);
    }
  };

  const getHolidayName = (date: Date, list: Holiday[]) => {
    const holiday = list.find((item) => dayjs(item.locDate).isSame(dayjs(date), 'day'));
    return holiday?.dateName || null;
  };

  useEffect(() => {
    if (!authService.hasAdminPermission()) {
      setError('관리자 권한이 필요합니다.');
      setLoading(false);
      return;
    }

    loadAdminData();
  }, []);

  useEffect(() => {
    if (adminData) {
      loadYearlyWaitingList(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadHolidayData(currentCalendarDate, setHolidays);
  }, [currentCalendarDate]);

  useEffect(() => {
    loadHolidayData(modalCalendarDate, setModalHolidays);
  }, [modalCalendarDate]);

  const handleTabChange = (tab: 'pending' | 'all') => {
    setCurrentTab(tab);
    if (tab === 'pending') {
      setStatusFilter('REQUESTED');
    } else {
      setStatusFilter(null);
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };

  const handleDepartmentFilter = (department: string) => {
    setDepartmentFilter(department);
  };

  const handlePositionFilter = (position: string) => {
    setPositionFilter(position);
  };

  const toggleLeaveTypeFilter = (leaveType: string) => {
    setLeaveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(leaveType)) {
        next.delete(leaveType);
      } else {
        next.add(leaveType);
      }
      return next;
    });
  };

  const handleDateRangeFilter = (start: Date | null, end: Date | null) => {
    setDateRangeFilter({ start, end });
  };

  const handleNameSearchFilter = (value: string) => {
    setNameSearchFilter(value);
  };

  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    if (isBatchMode) {
      setSelectedItems(new Set());
    }
  };

  const toggleSelectAll = (items: any[]) => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const toggleItemSelection = (itemId: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const batchApprove = async () => {
    if (selectedItems.size === 0) return;

    setIsBatchProcessing(true);
    let successCount = 0;

    for (const itemId of selectedItems) {
      try {
        await leaveService.processAdminApproval({
          id: Number(itemId),
          approverId: authService.getCurrentUser()?.userId || '',
          isApproved: 'APPROVED',
        });
        successCount++;
      } catch (error) {
        logger.error(`일괄 승인 실패 (ID: ${itemId}):`, error);
      }
    }

    if (successCount > 0) {
      await loadAdminData();
      setSelectedItems(new Set());
      setIsBatchMode(false);
      setSnackbarMessage(`일괄 승인 ${successCount}건 처리 완료`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }

    setIsBatchProcessing(false);
  };

  const batchReject = async (reason: string) => {
    if (selectedItems.size === 0) return;

    setIsBatchProcessing(true);
    let successCount = 0;

    for (const itemId of selectedItems) {
      try {
        await leaveService.processAdminApproval({
          id: Number(itemId),
          approverId: authService.getCurrentUser()?.userId || '',
          isApproved: 'REJECTED',
          rejectMessage: reason,
        });
        successCount++;
      } catch (error) {
        logger.error(`일괄 반려 실패 (ID: ${itemId}):`, error);
      }
    }

    if (successCount > 0) {
      await loadAdminData();
      setSelectedItems(new Set());
      setIsBatchMode(false);
      setSnackbarMessage(`일괄 반려 ${successCount}건 처리 완료`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }

    setIsBatchProcessing(false);
  };

  const showBatchRejectDialog = () => {
    const reason = prompt('반려 사유를 입력해주세요:');
    if (reason && reason.trim()) {
      batchReject(reason.trim());
    }
  };

  const handleApprove = async (leave?: any) => {
    const targetLeave = leave ?? selectedLeave;
    logger.dev('[AdminLeaveApproval] handleApprove 호출:', {
      hasLeave: Boolean(leave),
      hasSelectedLeave: Boolean(selectedLeave),
      targetId: targetLeave?.id,
      targetStatus: targetLeave?.status,
      targetIsCancel: targetLeave?.isCancel,
    });
    if (!targetLeave?.id) {
      logger.error('[AdminLeaveApproval] 승인 실패: 대상 휴가 ID 없음');
      return;
    }

    setActionLoading(true);
    try {
      if (targetLeave.status === 'CANCEL_REQUESTED' || targetLeave.isCancel === 1) {
        logger.dev('[AdminLeaveApproval] 취소 승인 요청 전송');
        await leaveService.processCancelApproval({
          id: targetLeave.id,
          approverId: authService.getCurrentUser()?.userId || '',
        });
        setSnackbarMessage('취소 승인이 완료되었습니다.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        logger.dev('[AdminLeaveApproval] 일반 승인 요청 전송');
        await leaveService.processAdminApproval({
          id: targetLeave.id,
          approverId: authService.getCurrentUser()?.userId || '',
          isApproved: 'APPROVED',
        });
        setSnackbarMessage('승인이 완료되었습니다.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
      setApprovalDialog(false);
      setSelectedLeave(null);
      setRejectMessage('');
      await loadAdminData();
    } catch (err: any) {
      logger.error('승인 실패:', err);
      alert('승인 처리에 실패했습니다.');
      setSnackbarMessage('승인 처리에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (leave?: any) => {
    const targetLeave = leave ?? selectedLeave;
    logger.dev('[AdminLeaveApproval] handleReject 호출:', {
      hasLeave: Boolean(leave),
      hasSelectedLeave: Boolean(selectedLeave),
      targetId: targetLeave?.id,
      targetStatus: targetLeave?.status,
      targetIsCancel: targetLeave?.isCancel,
      rejectMessageLength: rejectMessage.trim().length,
    });
    if (!targetLeave?.id) {
      logger.error('[AdminLeaveApproval] 반려 실패: 대상 휴가 ID 없음');
      return;
    }
    if (!rejectMessage.trim()) {
      logger.error('[AdminLeaveApproval] 반려 실패: 반려 사유 없음');
      return;
    }

    setActionLoading(true);
    try {
      logger.dev('[AdminLeaveApproval] 반려 요청 전송');
      await leaveService.processAdminApproval({
        id: targetLeave.id,
        approverId: authService.getCurrentUser()?.userId || '',
        isApproved: 'REJECTED',
        rejectMessage: rejectMessage,
      });
      setSnackbarMessage('반려 처리가 완료되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setApprovalDialog(false);
      setSelectedLeave(null);
      setRejectMessage('');
      await loadAdminData();
    } catch (err: any) {
      logger.error('반려 실패:', err);
      alert('반려 처리에 실패했습니다.');
      setSnackbarMessage('반려 처리에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApprove = async (selectedItems: Set<string>) => {
    if (!selectedItems.size) return;

    try {
      for (const id of selectedItems) {
        await leaveService.processAdminApproval({
          id: Number(id),
          approverId: authService.getCurrentUser()?.userId || '',
          isApproved: 'APPROVED',
        });
      }
      await loadAdminData();
      setSnackbarMessage('일괄 승인이 완료되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      logger.error('일괄 승인 실패:', err);
      alert('일괄 승인 처리에 실패했습니다.');
      setSnackbarMessage('일괄 승인 처리에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleBulkReject = async (selectedItems: Set<string>, message: string) => {
    if (!selectedItems.size || !message.trim()) return;

    try {
      for (const id of selectedItems) {
        await leaveService.processAdminApproval({
          id: Number(id),
          approverId: authService.getCurrentUser()?.userId || '',
          isApproved: 'REJECTED',
          rejectMessage: message,
        });
      }
      await loadAdminData();
      setSnackbarMessage('일괄 반려가 완료되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      logger.error('일괄 반려 실패:', err);
      alert('일괄 반려 처리에 실패했습니다.');
      setSnackbarMessage('일괄 반려 처리에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return {
    state: {
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
      fullscreenModalOpen,
      modalCalendarDate,
      modalSelectedDate,
      sidebarExpanded,
      sidebarPinned,
      mobileDrawerOpen,
      yearMonthPickerOpen,
      departmentStatusModalOpen,
      detailModalOpen,
      selectedDetailLeave,
      holidays,
      modalHolidays,
    },
    derived: {
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
    },
    actions: {
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
      setSnackbarMessage,
      setSnackbarSeverity,
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
    },
  };
};

export type AdminLeaveApprovalStateHook = ReturnType<typeof useAdminLeaveApprovalState>;
export type AdminLeaveApprovalState = AdminLeaveApprovalStateHook['state'];
export type AdminLeaveApprovalDerived = AdminLeaveApprovalStateHook['derived'];
export type AdminLeaveApprovalActions = AdminLeaveApprovalStateHook['actions'];
