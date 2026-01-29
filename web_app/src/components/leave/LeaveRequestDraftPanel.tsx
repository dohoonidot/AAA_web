/**
 * 휴가 신청 초안 패널
 * Flutter의 leave_draft_modal.dart 100% 동일 구현
 */

import { createLogger } from '../../utils/logger';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  FormControlLabel,
  Button,
  Chip,
  Radio,
  RadioGroup,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BeachAccess as BeachAccessIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  EventNote as EventNoteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  HowToReg as HowToRegIcon,
  PersonAdd as PersonAddIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useThemeStore } from '../../store/themeStore';
import ApproverSelectionModal from './ApproverSelectionModal';
import ReferenceSelectionModal from './ReferenceSelectionModal';
import { useLeaveRequestDraftPanelState } from './LeaveRequestDraftPanel.state';

const logger = createLogger('LeaveRequestDraftPanel');

export default function LeaveRequestDraftPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px = 모바일
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';
  const { state, actions } = useLeaveRequestDraftPanelState();
  const {
    isOpen,
    isLoading,
    formData,
    isLeaveBalanceExpanded,
    isSequentialApproval,
    useNextYear,
    halfDay,
    halfDayPeriod,
    userName,
    leaveStatusList,
    nextYearLeaveStatus,
    isApproverModalOpen,
    isReferenceModalOpen,
  } = state;
  const {
    closePanel,
    updateFormData,
    toggleLeaveBalance,
    setSequentialApproval,
    setHalfDay,
    setHalfDayPeriod,
    setIsApproverModalOpen,
    setIsReferenceModalOpen,
    handleApproverConfirm,
    handleReferenceConfirm,
    handleSaveApprovalLine,
    handleSubmit,
    handleNextYearCheckbox,
  } = actions;

  if (!isOpen || !formData) {
    return null;
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'transparent',
          zIndex: 1200,
        }}
        onClick={closePanel}
      />

      {/* 메인 패널 */}
      <Box
        sx={{
          position: 'fixed',
          top: isMobile ? 0 : '50%',
          left: isMobile ? 0 : '50%',
          right: isMobile ? 0 : 'auto',
          bottom: isMobile ? 0 : 'auto',
          transform: isMobile ? 'none' : 'translate(-50%, -50%)',
          width: isMobile ? '100%' : '60%',
          minWidth: isMobile ? 'unset' : '600px',
          maxWidth: isMobile ? 'unset' : '800px',
          height: isMobile ? '100vh' : '90vh',
          bgcolor: colorScheme.surfaceColor,
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: isMobile ? 'slideUp 300ms ease-out' : 'fadeScaleIn 300ms ease-out',
          '@keyframes fadeScaleIn': {
            from: {
              opacity: 0,
              transform: 'translate(-50%, -50%) scale(0.95)',
            },
            to: {
              opacity: 1,
              transform: 'translate(-50%, -50%) scale(1)',
            },
          },
          '@keyframes slideUp': {
            from: {
              opacity: 0,
              transform: 'translateY(100%)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${colorScheme.textFieldBorderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          {/* 아이콘 컨테이너 */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(74, 108, 247, 0.2)' : 'rgba(74, 108, 247, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BeachAccessIcon sx={{ fontSize: 20, color: '#4A6CF7' }} />
          </Box>

          {/* 제목 */}
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 700,
              color: colorScheme.textColor,
              flex: 1,
            }}
          >
            휴가 상신 초안
          </Typography>

          {/* 접기 버튼 */}
          <Tooltip title="접어두기">
            <IconButton
              size="small"
              onClick={() => logger.dev('접어두기')}
              sx={{ color: colorScheme.hintTextColor }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>

          {/* 닫기 버튼 */}
          <Tooltip title="닫기">
            <IconButton
              size="small"
              onClick={closePanel}
              sx={{ color: colorScheme.hintTextColor }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 바디 - 스크롤 가능 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* 1. 휴가 현황 섹션 (Collapsible) */}
          <Box
            sx={{
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
              borderRadius: '12px',
              border: `1px solid ${colorScheme.textFieldBorderColor}`,
            }}
          >
            {/* 헤더 */}
            <Box
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                },
              }}
              onClick={toggleLeaveBalance}
            >
              <EventNoteIcon sx={{ fontSize: 16, color: '#4A6CF7' }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colorScheme.textColor, flex: 1 }}>
                내 휴가 현황
              </Typography>
              <IconButton size="small">
                {isLeaveBalanceExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* 내용 */}
            <Collapse in={isLeaveBalanceExpanded}>
              <Box sx={{ px: 1.5, pb: 2 }}>
                {leaveStatusList && leaveStatusList.length > 0 ? (
                  leaveStatusList.map((status, index) => {
                    const leaveType = status.leaveType || (status as any).leave_type;
                    const remainDays = status.remainDays ?? (status as any).remain_days ?? 0;
                    const totalDays = status.totalDays ?? (status as any).total_days ?? 0;

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.5,
                        }}
                      >
                        <Typography sx={{ fontSize: '12px', color: colorScheme.hintTextColor }}>
                          {leaveType}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>
                          <Typography component="span" sx={{ fontSize: '12px', color: colorScheme.hintTextColor }}>
                            남은 일수{' '}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#60A5FA' : '#3B82F6' }}
                          >
                            {remainDays.toFixed(1)}일
                          </Typography>
                          <Typography component="span" sx={{ fontSize: '12px', color: colorScheme.hintTextColor }}>
                            {' / 허용 일수 '}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#34D399' : '#10B981' }}
                          >
                            {totalDays.toFixed(1)}일
                          </Typography>
                        </Typography>
                      </Box>
                    );
                  })
                ) : (
                  <Typography sx={{ fontSize: '12px', color: colorScheme.hintTextColor, textAlign: 'center', py: 2 }}>
                    휴가 정보 없음
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* 2. 기본 정보 섹션 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: colorScheme.textColor }}>
                📝 기본 정보
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={useNextYear}
                    onChange={(e) => handleNextYearCheckbox(e.target.checked)}
                    sx={{ color: '#4A6CF7' }}
                  />
                }
                label={<Typography sx={{ fontSize: '14px' }}>내년 정기휴가 사용하기</Typography>}
              />
            </Box>

            {/* 신청자명 */}
            <TextField
              fullWidth
              label="신청자명"
              value={userName || ''}
              disabled
              size="small"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                  fontSize: '14px',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  fontWeight: 500,
                },
              }}
            />

            {/* 휴가종류 */}
            <FormControl fullWidth size="small">
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: colorScheme.textColor,
                  mb: 0.5,
                }}
              >
                휴가종류 *
              </Typography>
              <Select
                value={formData.leaveType}
                onChange={(e) => updateFormData({ leaveType: e.target.value })}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                  fontSize: '14px',
                  borderRadius: '8px',
                }}
              >
                {useNextYear && nextYearLeaveStatus.length > 0
                  ? // 내년 정기휴가 체크 시: 내년 휴가 + 남은일수/허용일수 표시
                    nextYearLeaveStatus.map((status) => (
                      <MenuItem key={status.leaveType} value={status.leaveType}>
                        {status.leaveType} (남은일수: {status.remainDays}일 / 허용일수: {status.totalDays}일)
                      </MenuItem>
                    ))
                  : leaveStatusList.length > 0
                  ? // 일반 모드: 휴가 현황에서 가져온 휴가 종류 표시
                    leaveStatusList.map((status) => (
                      <MenuItem key={status.leaveType} value={status.leaveType}>
                        {status.leaveType} (잔여: {status.remainDays}일)
                      </MenuItem>
                    ))
                  : // API 실패 시 빈 값 표시
                    []
                }
              </Select>
            </FormControl>
          </Box>

          {/* 3. 휴가 상세 섹션 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: colorScheme.textColor }}>
                📅 휴가 상세
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={halfDay}
                    onChange={(e) => setHalfDay(e.target.checked)}
                    sx={{ color: '#4A6CF7' }}
                  />
                }
                label={<Typography sx={{ fontSize: '14px' }}>반차 사용</Typography>}
              />
            </Box>

            {/* 날짜 선택 */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <TextField
                fullWidth
                label="시작일 *"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData({ startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  flex: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                    fontSize: '14px',
                    borderRadius: '8px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    fontWeight: 500,
                  },
                }}
              />
              <TextField
                fullWidth
                label="종료일 *"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData({ endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  flex: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                    fontSize: '14px',
                    borderRadius: '8px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    fontWeight: 500,
                  },
                }}
              />
            </Box>

            {/* 반차 선택 */}
            {halfDay && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA', borderRadius: '8px' }}>
                <RadioGroup
                  row
                  value={halfDayPeriod}
                  onChange={(e) => setHalfDayPeriod(e.target.value as 'AM' | 'PM')}
                  sx={{ gap: 1.5 }}
                >
                  <FormControlLabel value="AM" control={<Radio size="small" />} label="오전반차" />
                  <FormControlLabel value="PM" control={<Radio size="small" />} label="오후반차" />
                </RadioGroup>
              </Box>
            )}

            {/* 휴가사유 */}
            <TextField
              fullWidth
              label="휴가사유"
              multiline
              rows={6}
              value={formData.reason}
              onChange={(e) => updateFormData({ reason: e.target.value })}
              placeholder="휴가 사유를 입력하세요"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                  fontSize: '14px',
                  borderRadius: '8px',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  fontWeight: 500,
                },
              }}
            />
          </Box>

          {/* 4. 승인자/참조자 섹션 */}
          <Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: colorScheme.textColor, mb: 2 }}>
              👥 승인자 및 참조자
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {/* 승인자 */}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colorScheme.textColor, mb: 1 }}>
                  승인자
                </Typography>

                {/* 승인자 선택 버튼들 */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<HowToRegIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setSequentialApproval(false);
                      setIsApproverModalOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      bgcolor: isDark ? '#60A5FA' : '#4A6CF7',
                      '&:hover': { bgcolor: isDark ? '#3B82F6' : '#3B5BE8' },
                      fontSize: '12px',
                      textTransform: 'none',
                    }}
                  >
                    승인자 선택
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<FormatListNumberedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setSequentialApproval(true);
                      setIsApproverModalOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      bgcolor: isDark ? '#34D399' : '#10B981',
                      '&:hover': { bgcolor: isDark ? '#10B981' : '#059669' },
                      fontSize: '12px',
                      textTransform: 'none',
                    }}
                  >
                    순차결재
                  </Button>
                </Box>

                {/* 승인자 표시 영역 */}
                <Box
                  sx={{
                    minHeight: 80,
                    p: 2,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                    borderRadius: '12px',
                    border: `1px solid ${colorScheme.textFieldBorderColor}`,
                  }}
                >
                  {formData.approvalLine && formData.approvalLine.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <HowToRegIcon sx={{ fontSize: 16, color: '#4A6CF7' }} />
                        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: colorScheme.textColor }}>
                          선택된 승인자 ({formData.approvalLine.length}명)
                          {isSequentialApproval && ' (순차결재)'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {formData.approvalLine.map((approver, idx) => (
                          <Chip
                            key={idx}
                            label={`${isSequentialApproval ? `${idx + 1}. ` : ''}${approver.approverName}`}
                            size="small"
                            sx={{
                              bgcolor: isDark ? 'rgba(74, 108, 247, 0.2)' : 'rgba(74, 108, 247, 0.1)',
                              color: '#4A6CF7',
                              fontSize: '10px',
                              fontWeight: 500,
                              height: 24,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <HowToRegIcon sx={{ fontSize: 20, color: '#4A6CF7', mb: 0.5 }} />
                      <Typography sx={{ fontSize: '12px', color: colorScheme.hintTextColor }}>승인자 선택</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 참조자 */}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colorScheme.textColor, mb: 1 }}>
                  참조자
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  size="small"
                  startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setIsReferenceModalOpen(true)}
                  sx={{
                    bgcolor: isDark ? '#34D399' : '#20C997',
                    '&:hover': { bgcolor: isDark ? '#10B981' : '#17A589' },
                    fontSize: '12px',
                    textTransform: 'none',
                    mb: 1,
                  }}
                >
                  참조자 선택
                </Button>

                {/* 참조자 표시 영역 */}
                <Box
                  sx={{
                    minHeight: 80,
                    p: 2,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FA',
                    borderRadius: '12px',
                    border: `1px solid ${colorScheme.textFieldBorderColor}`,
                  }}
                >
                  {formData.ccList && formData.ccList.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <PersonAddIcon sx={{ fontSize: 16, color: '#20C997' }} />
                        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: colorScheme.textColor }}>
                          선택된 참조자 ({formData.ccList.length}명)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {formData.ccList.map((cc, idx) => (
                          <Chip
                            key={idx}
                            label={cc.name}
                            size="small"
                            sx={{
                              bgcolor: isDark ? 'rgba(32, 201, 151, 0.2)' : 'rgba(32, 201, 151, 0.1)',
                              color: isDark ? '#34D399' : '#20C997',
                              fontSize: '10px',
                              fontWeight: 500,
                              height: 24,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <PersonAddIcon sx={{ fontSize: 20, color: '#20C997', mb: 0.5 }} />
                      <Typography sx={{ fontSize: '12px', color: colorScheme.hintTextColor }}>참조자 선택</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 푸터 - 버튼들 */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${colorScheme.textFieldBorderColor}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          {/* 결재라인 저장 버튼 */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<SaveIcon sx={{ fontSize: 20 }} />}
            onClick={handleSaveApprovalLine}
            sx={{
              color: '#4A6CF7',
              borderColor: '#4A6CF7',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '12px',
              py: 1,
              '&:hover': {
                borderColor: '#3B5BE8',
                bgcolor: isDark ? 'rgba(74, 108, 247, 0.1)' : 'rgba(74, 108, 247, 0.05)',
              },
            }}
          >
            휴가 상신용 결재라인 저장
          </Button>

          {/* 휴가 상신 버튼 */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={isLoading}
            sx={{
              bgcolor: '#4A6CF7',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '12px',
              py: 1,
              '&:hover': {
                bgcolor: '#3B5BE8',
              },
            }}
          >
            {isLoading ? '신청 중...' : '휴가 상신'}
          </Button>
        </Box>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                bgcolor: colorScheme.surfaceColor,
                p: 2.5,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                minWidth: 200,
              }}
            >
              {/* 로딩 스피너 */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  border: '3px solid',
                  borderColor: isDark ? 'rgba(74, 108, 247, 0.3)' : 'rgba(74, 108, 247, 0.2)',
                  borderTopColor: '#4A6CF7',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    to: { transform: 'rotate(360deg)' },
                  },
                }}
              />

              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colorScheme.textColor,
                  mb: 0.5,
                }}
              >
                AI가 초안을 작성중입니다
              </Typography>

              <Typography
                sx={{
                  fontSize: '14px',
                  color: colorScheme.hintTextColor,
                }}
              >
                잠시만 기다려주세요.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* 승인자 선택 모달 */}
      <ApproverSelectionModal
        open={isApproverModalOpen}
        onClose={() => setIsApproverModalOpen(false)}
        onConfirm={handleApproverConfirm}
        initialSelectedApproverIds={formData.approvalLine?.map((a) => a.approverId) || []}
        sequentialApproval={isSequentialApproval}
      />

      {/* 참조자 선택 모달 */}
      <ReferenceSelectionModal
        open={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        onConfirm={handleReferenceConfirm}
        currentReferences={
          formData.ccList?.map((cc) => ({
            name: cc.name,
            department: cc.department || '',
            userId: cc.userId,
          })) || []
        }
      />
    </>
  );
}
