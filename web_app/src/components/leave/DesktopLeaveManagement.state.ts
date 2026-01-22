import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import authService from '../../services/authService';
import type { LeaveManagementData, YearlyDetail, YearlyWholeStatus } from '../../types/leave';
import { fetchYearlyLeave } from './DesktopLeaveManagement.data';
import type {
  ExtendedYearlyDetail,
  LeaveRequestFormState,
  ManagementTableRow,
} from './DesktopLeaveManagement.types';

const buildManagementTableData = (source: YearlyWholeStatus[]) => (
  source
    .filter((item: YearlyWholeStatus) => item.leaveType !== '총계')
    .map((item: YearlyWholeStatus) => ({
      leaveType: item.leaveType || '',
      allowedDays: item.totalDays || 0,
      usedByMonth: [
        item.m01 || 0,
        item.m02 || 0,
        item.m03 || 0,
        item.m04 || 0,
        item.m05 || 0,
        item.m06 || 0,
        item.m07 || 0,
        item.m08 || 0,
        item.m09 || 0,
        item.m10 || 0,
        item.m11 || 0,
        item.m12 || 0,
      ],
      totalUsed: [
        item.m01 || 0,
        item.m02 || 0,
        item.m03 || 0,
        item.m04 || 0,
        item.m05 || 0,
        item.m06 || 0,
        item.m07 || 0,
        item.m08 || 0,
        item.m09 || 0,
        item.m10 || 0,
        item.m11 || 0,
        item.m12 || 0,
      ].reduce((sum: number, val: number) => sum + val, 0),
    }))
);

export const useDesktopLeaveManagementState = ({
  leaveData,
  onRefresh,
}: {
  leaveData: LeaveManagementData;
  onRefresh: () => void;
}) => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [leaveManualOpen, setLeaveManualOpen] = useState(false);
  const [leaveAIManualOpen, setLeaveAIManualOpen] = useState(false);
  const [hideCanceled, setHideCanceled] = useState(false);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [totalCalendarOpen, setTotalCalendarOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<ExtendedYearlyDetail | null>(null);
  const [managementTableDialogOpen, setManagementTableDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [yearlyDetails, setYearlyDetails] = useState(leaveData.yearlyDetails || []);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [yearlyWholeStatus, setYearlyWholeStatus] = useState(leaveData.yearlyWholeStatus || []);
  const [managementTableData, setManagementTableData] = useState<ManagementTableRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [requestForm, setRequestForm] = useState<LeaveRequestFormState>({
    leaveType: '',
    startDate: dayjs(),
    endDate: dayjs(),
    reason: '',
    halfDaySlot: '',
    approverIds: [] as string[],
    ccList: [] as Array<{ name: string; department: string }>,
    useHalfDay: false,
    useNextYearLeave: false,
  });

  const [approverModalOpen, setApproverModalOpen] = useState(false);
  const [referenceModalOpen, setReferenceModalOpen] = useState(false);
  const [isSequentialApproval, setIsSequentialApproval] = useState(false);
  const [cancelRequestModalOpen, setCancelRequestModalOpen] = useState(false);
  const [cancelRequestLeave, setCancelRequestLeave] = useState<YearlyDetail | null>(null);

  useEffect(() => {
    if (leaveData.yearlyWholeStatus && leaveData.yearlyWholeStatus.length > 0) {
      const tableData = buildManagementTableData(leaveData.yearlyWholeStatus);
      setManagementTableData(tableData);
      setYearlyWholeStatus(leaveData.yearlyWholeStatus);
    }
  }, [leaveData.yearlyWholeStatus]);

  useEffect(() => {
    loadYearlyLeaveData(selectedYear);
    loadManagementTable();
  }, [selectedYear]);

  const loadYearlyLeaveData = async (year: number) => {
    try {
      setYearlyLoading(true);
      const user = authService.getCurrentUser();
      if (!user) return;

      console.log('연도별 휴가 내역 조회:', year);

      const response = await fetchYearlyLeave(user.userId, year);

      console.log('연도별 휴가 내역 응답:', response);

      if (response.yearlyDetails) {
        setYearlyDetails(response.yearlyDetails);
      } else {
        const filtered = leaveData.yearlyDetails.filter((detail) => {
          const detailYear = new Date(detail.startDate).getFullYear();
          return detailYear === year;
        });
        setYearlyDetails(filtered);
      }

      if (response.yearlyWholeStatus && response.yearlyWholeStatus.length > 0) {
        setYearlyWholeStatus(response.yearlyWholeStatus);
        const tableData = buildManagementTableData(response.yearlyWholeStatus);
        setManagementTableData(tableData);
      } else if (leaveData.yearlyWholeStatus && leaveData.yearlyWholeStatus.length > 0) {
        setYearlyWholeStatus(leaveData.yearlyWholeStatus);
        const tableData = buildManagementTableData(leaveData.yearlyWholeStatus);
        setManagementTableData(tableData);
      }
    } catch (err) {
      console.error('연도별 휴가 내역 조회 실패:', err);
      const filtered = leaveData.yearlyDetails.filter((detail) => {
        const detailYear = new Date(detail.startDate).getFullYear();
        return detailYear === selectedYear;
      });
      setYearlyDetails(filtered);

      if (leaveData.yearlyWholeStatus && leaveData.yearlyWholeStatus.length > 0) {
        setYearlyWholeStatus(leaveData.yearlyWholeStatus);
        const tableData = buildManagementTableData(leaveData.yearlyWholeStatus);
        setManagementTableData(tableData);
      }
    } finally {
      setYearlyLoading(false);
    }
  };

  const loadManagementTable = async () => {
    try {
      setTableLoading(true);

      if (yearlyWholeStatus && yearlyWholeStatus.length > 0) {
        const tableData = buildManagementTableData(yearlyWholeStatus);
        setManagementTableData(tableData);
        return;
      }

      if (leaveData.yearlyWholeStatus && leaveData.yearlyWholeStatus.length > 0) {
        const tableData = buildManagementTableData(leaveData.yearlyWholeStatus);
        setManagementTableData(tableData);
      }
    } catch (err) {
      console.error('휴가 관리 대장 조회 실패:', err);
      setManagementTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  const handleRequestDialogOpen = () => {
    setRequestDialogOpen(true);
  };

  const handleRequestDialogClose = () => {
    setRequestDialogOpen(false);
    setIsSequentialApproval(false);
    setRequestForm({
      leaveType: '',
      startDate: dayjs(),
      endDate: dayjs(),
      reason: '',
      halfDaySlot: '',
      approverIds: [],
      ccList: [],
      useHalfDay: false,
      useNextYearLeave: false,
    });
  };

  const handleCancelSuccess = () => {
    onRefresh();
    setCancelRequestModalOpen(false);
    setCancelRequestLeave(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#20C997';
      case 'REJECTED':
        return '#DC3545';
      case 'REQUESTED':
        return '#FF8C00';
      case 'CANCEL_REQUESTED':
        return '#F59E0B';
      case 'CANCELLED':
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  };

  const getFilteredYearlyDetails = () => {
    if (!yearlyDetails || !Array.isArray(yearlyDetails)) {
      console.log('⚠️ yearlyDetails가 배열이 아님:', yearlyDetails);
      return [];
    }
    const filtered = yearlyDetails.filter((detail) => !hideCanceled || detail.status !== 'CANCELLED');
    console.log('🔍 개인별 휴가 내역 - 전체:', yearlyDetails.length, '필터링 후:', filtered.length);
    return filtered;
  };

  const getPaginatedYearlyDetails = () => {
    const filtered = getFilteredYearlyDetails();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    console.log('📄 페이지네이션 - 현재페이지:', currentPage, '시작:', startIndex, '끝:', endIndex, '결과:', paginated.length);
    return paginated;
  };

  const filteredCount = getFilteredYearlyDetails().length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / itemsPerPage));
  console.log('📊 총 페이지:', totalPages, '현재 페이지:', currentPage, '전체 항목:', filteredCount);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    console.log('🔄 페이지 리셋 - 연도:', selectedYear, '취소건숨김:', hideCanceled);
    setCurrentPage(1);
  }, [selectedYear, hideCanceled, yearlyDetails]);

  return {
    state: {
      requestDialogOpen,
      aiModalOpen,
      leaveManualOpen,
      leaveAIManualOpen,
      hideCanceled,
      selectedYear,
      totalCalendarOpen,
      detailPanelOpen,
      selectedLeaveDetail,
      managementTableDialogOpen,
      sidebarOpen,
      currentPage,
      itemsPerPage,
      yearlyDetails,
      yearlyLoading,
      yearlyWholeStatus,
      managementTableData,
      tableLoading,
      requestForm,
      approverModalOpen,
      referenceModalOpen,
      isSequentialApproval,
      cancelRequestModalOpen,
      cancelRequestLeave,
    },
    derived: {
      getFilteredYearlyDetails,
      getPaginatedYearlyDetails,
      filteredCount,
      totalPages,
      getStatusColor,
    },
    actions: {
      setRequestDialogOpen,
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
      setCurrentPage,
      setYearlyDetails,
      setYearlyLoading,
      setYearlyWholeStatus,
      setManagementTableData,
      setTableLoading,
      setRequestForm,
      setApproverModalOpen,
      setReferenceModalOpen,
      setIsSequentialApproval,
      setCancelRequestModalOpen,
      setCancelRequestLeave,
      loadYearlyLeaveData,
      loadManagementTable,
      handleRequestDialogOpen,
      handleRequestDialogClose,
      handleCancelSuccess,
      handlePageChange,
    },
  };
};

export type DesktopLeaveManagementStateHook = ReturnType<typeof useDesktopLeaveManagementState>;
export type DesktopLeaveManagementState = DesktopLeaveManagementStateHook['state'];
export type DesktopLeaveManagementDerived = DesktopLeaveManagementStateHook['derived'];
export type DesktopLeaveManagementActions = DesktopLeaveManagementStateHook['actions'];
