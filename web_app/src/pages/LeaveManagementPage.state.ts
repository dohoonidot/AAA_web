import { useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, SyntheticEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import leaveService from '../services/leaveService';
import { createLogger } from '../utils/logger';
import type { LeaveManagementData, LeaveCancelRequest, ApprovalStatus } from '../types/leave';

const logger = createLogger('LeaveManagementPage');

export const useLeaveManagementPageState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const fromAdmin = (location.state as any)?.fromAdmin || false;
  const isApprover = user?.isApprover || false;

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveData, setLeaveData] = useState<LeaveManagementData | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [cancelRequestModalOpen, setCancelRequestModalOpen] = useState(false);
  const [cancelRequestLeave, setCancelRequestLeave] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [cancelReasonDialogOpen, setCancelReasonDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [hideCanceled, setHideCanceled] = useState(false);
  const [leaveManualOpen, setLeaveManualOpen] = useState(false);
  const [leaveAIManualOpen, setLeaveAIManualOpen] = useState(false);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    if (isApprover && !fromAdmin) {
      logger.dev('승인자이므로 관리자 화면으로 리다이렉트');
      navigate('/admin-leave', { replace: true });
    }
  }, [isApprover, fromAdmin, navigate]);

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      logger.dev('휴가관리 데이터 로드 시작:', currentUser.userId);

      const data = await leaveService.getLeaveManagement(currentUser.userId) as any;
      logger.dev('휴가관리 데이터 응답 (전체):', data);
      logger.dev('응답 타입:', typeof data);
      logger.dev('응답 키들:', Object.keys(data || {}));

      logger.dev('data.leave_status:', data.leave_status);
      logger.dev('data.approval_status:', data.approval_status);
      logger.dev('data.yearly_whole_status:', data.yearly_whole_status);
      logger.dev('data.monthly_leaves:', data.monthly_leaves);
      logger.dev('data.yearly_details:', data.yearly_details);

      logger.dev('data.leaveStatus:', data.leaveStatus);
      logger.dev('data.approvalStatus:', data.approvalStatus);
      logger.dev('data.yearlyWholeStatus:', data.yearlyWholeStatus);
      logger.dev('data.monthlyLeaves:', data.monthlyLeaves);
      logger.dev('data.yearlyDetails:', data.yearlyDetails);

      const actualLeaveStatus = data.leave_status || data.leaveStatus || [];
      const actualApprovalStatus = data.approval_status || data.approvalStatus;
      const actualYearlyDetails = data.yearly_details || data.yearlyDetails || [];
      const actualYearlyWholeStatus = data.yearly_whole_status || data.yearlyWholeStatus || [];
      const actualMonthlyLeaves = data.monthly_leaves || data.monthlyLeaves || [];

      logger.dev('실제 데이터 매핑 결과:');
      logger.dev('actualLeaveStatus:', actualLeaveStatus);
      logger.dev('actualApprovalStatus:', actualApprovalStatus);
      logger.dev('actualYearlyDetails:', actualYearlyDetails);
      logger.dev('actualYearlyWholeStatus:', actualYearlyWholeStatus);
      logger.dev('actualMonthlyLeaves:', actualMonthlyLeaves);

      let approvalStatus: ApprovalStatus;
      if (Array.isArray(actualApprovalStatus)) {
        const statusArray = actualApprovalStatus as any[];
        approvalStatus = {
          requested: statusArray.find(item => item.status === 'REQUESTED')?.count || 0,
          approved: statusArray.find(item => item.status === 'APPROVED')?.count || 0,
          rejected: statusArray.find(item => item.status === 'REJECTED')?.count || 0,
        };
      } else if (actualApprovalStatus && typeof actualApprovalStatus === 'object') {
        approvalStatus = {
          requested: (actualApprovalStatus as any).REQUESTED || 0,
          approved: (actualApprovalStatus as any).APPROVED || 0,
          rejected: (actualApprovalStatus as any).REJECTED || 0,
        };
      } else {
        approvalStatus = { requested: 0, approved: 0, rejected: 0 };
      }

      const safeData: LeaveManagementData = {
        leaveStatus: actualLeaveStatus,
        approvalStatus: approvalStatus,
        yearlyDetails: actualYearlyDetails,
        yearlyWholeStatus: actualYearlyWholeStatus,
        monthlyLeaves: actualMonthlyLeaves,
      };

      setLeaveData(safeData);

      logger.dev('휴가관리 데이터 로드 완료 - leaveStatus:', safeData.leaveStatus);

      if (currentUser && currentUser.userId) {
        try {
          logger.dev('[LeaveManagementPage] 대기 건수 조회 시작, userId:', currentUser.userId);
          const count = await leaveService.getWaitingLeavesCount(currentUser.userId);
          logger.dev('[LeaveManagementPage] 대기 건수 조회 완료:', count);
          setWaitingCount(count);
          logger.dev('[LeaveManagementPage] waitingCount state 설정 완료:', count);
        } catch (err) {
          logger.error('[LeaveManagementPage] 대기 건수 조회 실패:', err);
          setWaitingCount(0);
        }
      }

    } catch (err: any) {
      logger.error('휴가관리 데이터 로드 실패:', err);
      logger.error('에러 상세:', err.response?.data);
      setError(err.response?.data?.message || err.message || '휴가관리 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: ReactMouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRequestDialogOpen = () => {
    setRequestDialogOpen(true);
  };

  const handleRequestDialogClose = () => {
    setRequestDialogOpen(false);
  };

  const handleOpenCancelDialog = () => {
    setCancelReasonDialogOpen(true);
  };

  const handleDetailModalCancelRequest = async () => {
    if (!user?.userId) {
      alert('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    if (!selectedLeave?.id) {
      alert('휴가 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await leaveService.requestLeaveCancel({
        id: selectedLeave.id,
        userId: user.userId,
        reason: cancelReason.trim(),
      });

      if (response.error) {
        alert(`취소 상신 실패: ${response.error}`);
        return;
      }

      alert('휴가 취소 상신이 완료되었습니다.');
      setCancelReasonDialogOpen(false);
      setDetailModalOpen(false);
      setCancelReason('');
      loadLeaveData();
    } catch (error: any) {
      alert(`취소 상신 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelRequestLeave) return;

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const cancelRequest: LeaveCancelRequest = {
        id: cancelRequestLeave.id,
        userId: currentUser.userId,
      };

      const response = await leaveService.cancelLeaveRequestNew(cancelRequest);

      if (response.error) {
        setError(`취소 상신 실패: ${response.error}`);
        return;
      }

      loadLeaveData();
      setCancelRequestModalOpen(false);
      setCancelRequestLeave(null);
      setError(null);
      alert('취소 상신이 완료되었습니다.');
    } catch (error: any) {
      logger.error('취소 상신 실패:', error);
      setError(error.message || '취소 상신에 실패했습니다.');
    }
  };

  return {
    state: {
      user,
      fromAdmin,
      isApprover,
      tabValue,
      loading,
      error,
      leaveData,
      waitingCount,
      requestDialogOpen,
      cancelRequestModalOpen,
      cancelRequestLeave,
      detailModalOpen,
      selectedLeave,
      cancelReasonDialogOpen,
      cancelReason,
      recommendationOpen,
      hideCanceled,
      leaveManualOpen,
      leaveAIManualOpen,
      menuAnchorEl,
      menuOpen,
    },
    actions: {
      setTabValue,
      setLoading,
      setError,
      setLeaveData,
      setWaitingCount,
      setRequestDialogOpen,
      setCancelRequestModalOpen,
      setCancelRequestLeave,
      setDetailModalOpen,
      setSelectedLeave,
      setCancelReasonDialogOpen,
      setCancelReason,
      setRecommendationOpen,
      setHideCanceled,
      setLeaveManualOpen,
      setLeaveAIManualOpen,
      setMenuAnchorEl,
      loadLeaveData,
      handleMenuOpen,
      handleMenuClose,
      handleTabChange,
      handleRequestDialogOpen,
      handleRequestDialogClose,
      handleOpenCancelDialog,
      handleDetailModalCancelRequest,
      handleCancelRequest,
    },
  };
};

export type LeaveManagementPageStateHook = ReturnType<typeof useLeaveManagementPageState>;
