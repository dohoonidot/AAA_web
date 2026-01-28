import React from 'react';
import {
  Box,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Cancel as CancelIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import type { LeaveManagementData } from '../../types/leave';
import type { useThemeStore } from '../../store/themeStore';
import LeaveCancelRequestDialog from './LeaveCancelRequestDialog';
import ApproverSelectionModal from './ApproverSelectionModal';
import ReferenceSelectionModal from './ReferenceSelectionModal';
import LeaveRequestModal from './LeaveRequestModal';
import VacationRecommendationModal from './VacationRecommendationModal';
import LeaveManualModal from './LeaveManualModal';
import LeaveAIManualModal from './LeaveAIManualModal';
import TotalCalendar from '../calendar/TotalCalendar';
import type {
  DesktopLeaveManagementActions,
  DesktopLeaveManagementState,
} from './DesktopLeaveManagement.state';
import type { ManagementTableRow } from './DesktopLeaveManagement.types';

type ThemeColorScheme = ReturnType<typeof useThemeStore>['colorScheme'];

type DesktopLeaveManagementModalsProps = {
  state: DesktopLeaveManagementState;
  actions: DesktopLeaveManagementActions;
  colorScheme: ThemeColorScheme;
  isDark: boolean;
  leaveStatusList: LeaveManagementData['leaveStatus'];
  userId: string;
  onRefresh: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
};

const DesktopLeaveManagementModals: React.FC<DesktopLeaveManagementModalsProps> = ({
  state,
  actions,
  colorScheme,
  isDark,
  leaveStatusList,
  userId,
  onRefresh,
  getStatusIcon,
}) => {
  const {
    requestDialogOpen,
    detailPanelOpen,
    selectedLeaveDetail,
    totalCalendarOpen,
    approverModalOpen,
    referenceModalOpen,
    managementTableDialogOpen,
    tableLoading,
    managementTableData,
    cancelRequestModalOpen,
    cancelRequestLeave,
    aiModalOpen,
    leaveManualOpen,
    leaveAIManualOpen,
    requestForm,
    isSequentialApproval,
    selectedYear,
  } = state;

  const {
    setDetailPanelOpen,
    setCancelRequestLeave,
    setCancelRequestModalOpen,
    setTotalCalendarOpen,
    setApproverModalOpen,
    setReferenceModalOpen,
    setRequestForm,
    setManagementTableDialogOpen,
    setAiModalOpen,
    setLeaveManualOpen,
    setLeaveAIManualOpen,
    handleRequestDialogClose,
    handleCancelSuccess,
  } = actions;

  return (
    <>
      {/* 휴가 신청 모달 - LeaveRequestModal 사용 */}
      <LeaveRequestModal
        open={requestDialogOpen}
        onClose={handleRequestDialogClose}
        onSubmit={async () => {
          onRefresh();
        }}
        userId={userId}
        leaveStatusList={leaveStatusList}
      />

      {/* 휴가 상세 정보 다이얼로그 */}
      <Dialog
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colorScheme.surfaceColor,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colorScheme.textFieldBorderColor}`, color: colorScheme.textColor }}>휴가 상세 정보</DialogTitle>
        <DialogContent>
          {selectedLeaveDetail && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(selectedLeaveDetail.status)}
                <Typography variant="h6" sx={{ color: colorScheme.textColor }}>{selectedLeaveDetail.leaveType}</Typography>
                <Chip
                  label={
                    selectedLeaveDetail.status === 'APPROVED' ? '승인' :
                      selectedLeaveDetail.status === 'REJECTED' ? '반려' :
                        selectedLeaveDetail.status === 'REQUESTED' ? '대기' :
                          selectedLeaveDetail.status === 'CANCEL_REQUESTED' ? '취소 대기' :
                            selectedLeaveDetail.status === 'CANCELLED' ? '취소됨' :
                              '대기'
                  }
                  color={
                    selectedLeaveDetail.status === 'APPROVED'
                      ? 'success'
                      : selectedLeaveDetail.status === 'REJECTED'
                        ? 'error'
                        : 'warning'
                  }
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colorScheme.hintTextColor, fontWeight: 600 }}>
                    휴가 기간
                  </Typography>
                  <Typography variant="body1" sx={{ color: colorScheme.textColor }}>
                    {dayjs(selectedLeaveDetail.startDate).format('YYYY-MM-DD')} ~{' '}
                    {dayjs(selectedLeaveDetail.endDate).format('YYYY-MM-DD')}
                  </Typography>
                  {selectedLeaveDetail.workdaysCount && (
                    <Typography variant="caption" sx={{ color: colorScheme.hintTextColor }}>
                      ({selectedLeaveDetail.workdaysCount}일 사용)
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: colorScheme.hintTextColor, fontWeight: 600 }}>
                    신청일
                  </Typography>
                  <Typography variant="body1" sx={{ color: colorScheme.textColor }}>
                    {dayjs(selectedLeaveDetail.requestedDate).format('YYYY-MM-DD')}
                  </Typography>
                </Box>

                {/* 사유 - 일반 상신과 취소 상신 구분 */}
                {selectedLeaveDetail.isCancel === 1 ? (
                  <>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                        이 항목은 취소 상신 건입니다.
                      </Typography>
                    </Alert>

                    {selectedLeaveDetail?.originalReason && (
                      <Box sx={{
                        p: 2,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 1,
                        border: `1px solid ${colorScheme.textFieldBorderColor}`,
                        mb: 1.5,
                      }}>
                        <Typography variant="caption" sx={{ color: colorScheme.hintTextColor, fontWeight: 600, display: 'block', mb: 0.5 }}>
                          원래 휴가 신청 사유
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorScheme.textColor }}>
                          {selectedLeaveDetail.originalReason}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{
                      p: 2,
                      bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.08)',
                      borderRadius: 1,
                      border: '1px solid rgba(237, 108, 2, 0.3)',
                    }}>
                      <Typography variant="caption" sx={{ color: '#C77700', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        취소 요청 사유
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorScheme.textColor }}>
                        {selectedLeaveDetail.reason || '-'}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box>
                    <Typography variant="caption" sx={{ color: colorScheme.hintTextColor, fontWeight: 600 }}>
                      휴가 사유
                    </Typography>
                    <Typography variant="body1" sx={{ color: colorScheme.textColor, mt: 0.5 }}>
                      {selectedLeaveDetail.reason || '-'}
                    </Typography>
                  </Box>
                )}

                {selectedLeaveDetail.rejectMessage && (
                  <Box sx={{
                    p: 2,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderRadius: 1,
                    border: `1px solid ${colorScheme.textFieldBorderColor}`,
                  }}>
                    <Typography variant="caption" sx={{ color: colorScheme.hintTextColor, fontWeight: 600, display: 'block', mb: 0.5 }}>
                      반려 사유
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorScheme.textColor }}>
                      {selectedLeaveDetail.rejectMessage}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
          {selectedLeaveDetail && selectedLeaveDetail.status === 'APPROVED' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<CancelIcon />}
              onClick={() => {
                setDetailPanelOpen(false);
                setCancelRequestLeave(selectedLeaveDetail);
                setCancelRequestModalOpen(true);
              }}
            >
              취소 상신
            </Button>
          )}
          <Box sx={{ ml: 'auto' }}>
            <Button onClick={() => setDetailPanelOpen(false)} variant="outlined">닫기</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 전체휴가 달력 모달 */}
      <TotalCalendar
        open={totalCalendarOpen}
        onClose={() => setTotalCalendarOpen(false)}
      />

      {/* 승인자 선택 모달 */}
      <ApproverSelectionModal
        open={approverModalOpen}
        onClose={() => setApproverModalOpen(false)}
        onConfirm={(selectedIds) => {
          setRequestForm((prev) => ({ ...prev, approverIds: selectedIds }));
        }}
        initialSelectedApproverIds={requestForm.approverIds}
        sequentialApproval={isSequentialApproval}
      />

      {/* 참조자 선택 모달 */}
      <ReferenceSelectionModal
        open={referenceModalOpen}
        onClose={() => setReferenceModalOpen(false)}
        onConfirm={(selectedReferences) => {
          setRequestForm((prev) => ({ ...prev, ccList: selectedReferences }));
        }}
        currentReferences={requestForm.ccList}
      />

      {/* 휴가 관리 대장 크게 보기 모달 */}
      <Dialog
        open={managementTableDialogOpen}
        onClose={() => setManagementTableDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: '90vh',
            bgcolor: colorScheme.surfaceColor,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: `1px solid ${colorScheme.textFieldBorderColor}`, fontSize: '18px', fontWeight: 700, color: colorScheme.textColor }}>
          <Box component="span">휴가 관리 대장</Box>
          <IconButton
            onClick={() => setManagementTableDialogOpen(false)}
            size="small"
            sx={{ p: 0.5 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, overflow: 'auto' }}>
          <TableContainer sx={{ maxHeight: '100%', overflowX: 'auto' }}>
            <Table size="small" stickyHeader sx={{ borderCollapse: 'separate', minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      color: colorScheme.textColor,
                      px: 2,
                      py: 1.5,
                      borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                    }}
                  >
                    휴가명
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      color: colorScheme.textColor,
                      px: 2,
                      py: 1.5,
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
                        fontSize: '11px',
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                        color: colorScheme.hintTextColor,
                        px: 1,
                        py: 1.5,
                        borderRight: month < 12 ? `1px solid ${colorScheme.textFieldBorderColor}` : 'none',
                        textAlign: 'center',
                        minWidth: '50px',
                        width: '50px',
                      }}
                    >
                      {month}월
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      color: colorScheme.textColor,
                      px: 2,
                      py: 1.5,
                      textAlign: 'center',
                    }}
                  >
                    사용일수
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      color: colorScheme.textColor,
                      px: 2,
                      py: 1.5,
                      textAlign: 'center',
                    }}
                  >
                    잔여일수
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
                            fontSize: '12px',
                            fontWeight: 600,
                            px: 2,
                            py: 1.5,
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
                            fontSize: '12px',
                            fontWeight: 600,
                            px: 2,
                            py: 1.5,
                            borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                            textAlign: 'center',
                            color: colorScheme.textColor,
                          }}
                        >
                          {allowedDays > 0 ? allowedDays : '-'}
                        </TableCell>
                        {usedByMonth.map((days: number, monthIndex: number) => (
                          <TableCell
                            key={monthIndex}
                            sx={{
                              fontSize: '11px',
                              fontWeight: 600,
                              px: 1,
                              py: 1.5,
                              textAlign: 'center',
                              borderRight: monthIndex < 11 ? `1px solid ${colorScheme.textFieldBorderColor}` : 'none',
                              color: days > 0 ? colorScheme.textColor : colorScheme.hintTextColor,
                              minWidth: '50px',
                              width: '50px',
                            }}
                          >
                            {days > 0 ? days : '-'}
                          </TableCell>
                        ))}
                        <TableCell
                          sx={{
                            fontSize: '12px',
                            fontWeight: 600,
                            px: 2,
                            py: 1.5,
                            borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                            textAlign: 'center',
                            color: colorScheme.textColor,
                          }}
                        >
                          {totalUsed > 0 ? totalUsed : '-'}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: '12px',
                            fontWeight: 600,
                            px: 2,
                            py: 1.5,
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
                      <Typography sx={{ color: colorScheme.hintTextColor }}>데이터가 없습니다</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setManagementTableDialogOpen(false)} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 취소 상신 다이얼로그 */}
      <LeaveCancelRequestDialog
        open={cancelRequestModalOpen}
        onClose={() => {
          setCancelRequestModalOpen(false);
          setCancelRequestLeave(null);
        }}
        onSuccess={handleCancelSuccess}
        leave={cancelRequestLeave}
        userId={userId}
      />
      {/* AI 휴가 추천 모달 */}
      <VacationRecommendationModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        userId={userId}
        year={selectedYear}
      />

      {/* 휴가관리 사용 가이드 모달 */}
      <LeaveManualModal
        open={leaveManualOpen}
        onClose={() => setLeaveManualOpen(false)}
      />

      {/* 휴가 AI 작성 메뉴얼 모달 */}
      <LeaveAIManualModal
        open={leaveAIManualOpen}
        onClose={() => setLeaveAIManualOpen(false)}
      />
    </>
  );
};

export default DesktopLeaveManagementModals;
