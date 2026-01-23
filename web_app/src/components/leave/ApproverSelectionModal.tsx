import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  PeopleAltOutlined as PeopleIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FormatListNumbered as SequentialIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import type { Approver } from '../../types/leave';
import { useThemeStore } from '../../store/themeStore';
import { useApproverSelectionModalState } from './ApproverSelectionModal.state';

interface ApproverSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedApproverIds: string[], selectedApprovers: Approver[]) => void;
  initialSelectedApproverIds?: string[];
  sequentialApproval?: boolean; // 순차결재 모드 활성화 여부
}

export default function ApproverSelectionModal({
  open,
  onClose,
  onConfirm,
  initialSelectedApproverIds = [],
  sequentialApproval = false,
}: ApproverSelectionModalProps) {
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';
  const { state, actions } = useApproverSelectionModalState({
    open,
    onClose,
    onConfirm,
    initialSelectedApproverIds,
    sequentialApproval,
  });
  const {
    approverList,
    selectedApproverIds,
    selectedApproverOrder,
    isLoading,
    error,
    searchText,
    filteredApprovers,
  } = state;
  const { setSearchText, loadApprovers, handleToggleApprover, handleConfirm } = actions;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      sx={{
        '& .MuiPaper-root': {
          bgcolor: isDark ? '#1F2937' : 'white',
          color: isDark ? '#E5E7EB' : '#111827',
          border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: '10px',
                bgcolor: '#1E88E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PeopleIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: '18px', fontWeight: 700 }}>
              {sequentialApproval ? '승인자 선택 (순차결재)' : '승인자 선택'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: isDark ? '#E5E7EB' : '#111827' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: '13px', color: isDark ? '#9CA3AF' : '#6B7280', mt: 1 }}>
          {selectedApproverIds.size}명 선택됨
          {sequentialApproval && selectedApproverOrder.length > 0 && (
            <span> · 순서: {selectedApproverOrder.map((_, idx) => idx + 1).join(' → ')}</span>
          )}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* 검색 필드 */}
        {!isLoading && !error && approverList.length > 0 && (
          <TextField
            fullWidth
            placeholder="이름, 이메일, 부서, 직급으로 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? '#111827' : 'white',
                color: isDark ? '#E5E7EB' : '#111827',
                '& fieldset': {
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                },
                '&:hover fieldset': {
                  borderColor: isDark ? '#4B5563' : '#D1D5DB',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1E88E5',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
          />
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>승인자 목록을 불러오는 중...</Typography>
          </Box>
        ) : error ? (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadApprovers}
              variant="contained"
              fullWidth
            >
              다시 시도
            </Button>
          </Box>
        ) : approverList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PeopleIcon sx={{ fontSize: 64, color: isDark ? '#374151' : '#E5E7EB', mb: 2 }} />
            <Typography sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>승인자 목록이 없습니다.</Typography>
          </Box>
        ) : (
          <>
            {/* 선택된 승인자 표시 (모든 모드) */}
            {selectedApproverIds.size > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1, color: isDark ? '#E5E7EB' : '#374151' }}>
                  {sequentialApproval ? '선택된 승인자 순서' : '선택된 승인자'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sequentialApproval ? (
                    // 순차결재 모드: 순서 표시
                    selectedApproverOrder.map((approverId, index) => {
                      const approver = approverList.find((a) => a.approverId === approverId);
                      if (!approver) return null;

                      return (
                        <Chip
                          key={approverId}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  bgcolor: isDark ? '#111827' : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: '#1E88E5',
                                }}
                              >
                                {index + 1}
                              </Box>
                              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                                {approver.approverName}
                              </Typography>
                              {index < selectedApproverOrder.length - 1 && (
                                <ArrowForwardIcon sx={{ fontSize: 16, color: isDark ? '#9CA3AF' : '#9CA3AF' }} />
                              )}
                            </Box>
                          }
                          sx={{
                            bgcolor: '#1E88E5',
                            color: 'white',
                            height: 36,
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                            },
                          }}
                          onDelete={() => handleToggleApprover(approverId)}
                        />
                      );
                    })
                  ) : (
                    // 일반 모드: 선택된 승인자 목록
                    Array.from(selectedApproverIds).map((approverId) => {
                      const approver = approverList.find((a) => a.approverId === approverId);
                      if (!approver) return null;

                      return (
                        <Chip
                          key={approverId}
                          label={approver.approverName}
                          sx={{
                            bgcolor: '#1E88E5',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            height: 32,
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                            },
                          }}
                          onDelete={() => handleToggleApprover(approverId)}
                        />
                      );
                    })
                  )}
                </Box>
              </Box>
            )}
            
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredApprovers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    검색 결과가 없습니다.
                  </Typography>
                </Box>
              ) : (
                filteredApprovers.map((approver) => {
                const isSelected = selectedApproverIds.has(approver.approverId);
                // 순차결재 모드에서 순서 번호 표시
                const sequenceNumber = sequentialApproval && isSelected
                  ? selectedApproverOrder.indexOf(approver.approverId) + 1
                  : null;
                
                return (
                  <ListItem
                    key={approver.approverId}
                    disablePadding
                    sx={{
                      mb: 1,
                      borderRadius: '12px',
                      border: `1px solid ${isSelected ? '#1E88E5' : isDark ? '#374151' : '#E9ECEF'}`,
                      bgcolor: isSelected
                        ? 'rgba(30, 136, 229, 0.15)'
                        : isDark
                          ? '#111827'
                          : '#F8F9FA',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleToggleApprover(approver.approverId)}
                      sx={{ borderRadius: '12px' }}
                    >
                      <ListItemIcon>
                        {sequentialApproval && sequenceNumber ? (
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: '#1E88E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 700,
                            }}
                          >
                            {sequenceNumber}
                          </Box>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            edge="start"
                            sx={{
                              color: '#1E88E5',
                              '&.Mui-checked': {
                                color: '#1E88E5',
                              },
                            }}
                          />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111827' }}>
                              {approver.approverName}
                            </Typography>
                            {approver.jobPosition && (
                              <Chip
                                label={approver.jobPosition}
                                size="small"
                                sx={{
                                  bgcolor: isDark ? 'rgba(30, 136, 229, 0.2)' : 'rgba(30, 136, 229, 0.1)',
                                  color: '#1E88E5',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box component="div" sx={{ mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <BusinessIcon sx={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#9CA3AF' }} />
                              <Typography sx={{ fontSize: '12px', color: isDark ? '#C4C8D1' : '#6B7280' }}>
                                {approver.department}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#9CA3AF' }} />
                              <Typography
                                sx={{ fontSize: '11px', color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                                noWrap
                              >
                                {approver.approverId}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
                })
              )}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            flex: 1,
            color: isDark ? '#E5E7EB' : '#374151',
            borderColor: isDark ? '#4B5563' : '#D1D5DB',
          }}
        >
          취소
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedApproverIds.size === 0}
          sx={{ flex: 1, bgcolor: '#1E88E5' }}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}
