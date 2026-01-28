import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import leaveService from '../services/leaveService';
import authService from '../services/authService';
import type { LeaveManagementData, YearlyDetail } from '../types/leave';

export const useLeaveManagementState = ({ isMobile }: { isMobile: boolean }) => {
  const [leaveData, setLeaveData] = useState<LeaveManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<YearlyDetail | null>(null);
  const [hideCanceled, setHideCanceled] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [yearlyDetails, setYearlyDetails] = useState<YearlyDetail[]>([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isMobile ? 5 : 10;

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  useEffect(() => {
    loadLeaveData();
  }, []);

  useEffect(() => {
    if (selectedYear && leaveData) {
      loadYearlyLeaveData(selectedYear);
    }
  }, [selectedYear]);

  const loadLeaveData = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const data = await leaveService.getLeaveManagement(user.userId);
      setLeaveData(data);

      if (data) {
        await loadYearlyLeaveData(selectedYear);
      }
    } catch (err: any) {
      console.error('휴가관리 데이터 로드 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyLeaveData = async (year: number) => {
    try {
      setYearlyLoading(true);
      const user = authService.getCurrentUser();
      if (!user) return;

      console.log('연도별 휴가 내역 조회:', year);

      const response = await leaveService.getYearlyLeave({
        userId: user.userId,
        year: year,
      });

      console.log('연도별 휴가 내역 응답:', response);

      if (response.yearlyDetails) {
        setYearlyDetails(response.yearlyDetails);
      } else if (leaveData?.yearlyDetails) {
        const filtered = leaveData.yearlyDetails.filter(detail => {
          const detailYear = new Date(detail.startDate).getFullYear();
          return detailYear === year;
        });
        setYearlyDetails(filtered);
      }
    } catch (err: any) {
      console.error('연도별 휴가 내역 조회 실패:', err);
      if (leaveData?.yearlyDetails) {
        const filtered = leaveData.yearlyDetails.filter(detail => {
          const detailYear = new Date(detail.startDate).getFullYear();
          return detailYear === selectedYear;
        });
        setYearlyDetails(filtered);
      }
    } finally {
      setYearlyLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear]);

  const handlePageChange = (_event: ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  return {
    state: {
      leaveData,
      loading,
      error,
      requestModalOpen,
      cancelDialogOpen,
      selectedLeave,
      hideCanceled,
      selectedYear,
      yearlyDetails,
      yearlyLoading,
      currentPage,
      itemsPerPage,
      sidebarExpanded,
      sidebarPinned,
      detailDrawerOpen,
    },
    actions: {
      setLeaveData,
      setLoading,
      setError,
      setRequestModalOpen,
      setCancelDialogOpen,
      setSelectedLeave,
      setHideCanceled,
      setSelectedYear,
      setYearlyDetails,
      setYearlyLoading,
      setCurrentPage,
      setSidebarExpanded,
      setSidebarPinned,
      setDetailDrawerOpen,
      loadLeaveData,
      loadYearlyLeaveData,
      handlePageChange,
    },
  };
};

export type LeaveManagementStateHook = ReturnType<typeof useLeaveManagementState>;
