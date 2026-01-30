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
  TextField,
  InputAdornment,
  Collapse,
  Chip,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAddOutlined as PersonAddIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import type { CcPerson } from '../../types/leave';
import { useThemeStore } from '../../store/themeStore';
import { useReferenceSelectionModalState } from './ReferenceSelectionModal.state';

interface ReferenceSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedReferences: CcPerson[]) => void;
  currentReferences?: CcPerson[];
}

export default function ReferenceSelectionModal({
  open,
  onClose,
  onConfirm,
  currentReferences = [],
}: ReferenceSelectionModalProps) {
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';
  const { state, actions } = useReferenceSelectionModalState({
    open,
    onClose,
    onConfirm,
    currentReferences,
  });
  const {
    selectedReferences,
    departments,
    departmentMembers,
    expandedDepartments,
    searchText,
    isLoading,
    error,
    filteredDepartments,
  } = state;
  const {
    setSearchText,
    toggleDepartmentExpansion,
    isPersonSelected,
    togglePerson,
    removeReference,
    isDepartmentFullySelected,
    toggleDepartment,
    getFilteredMembers,
    handleConfirm,
  } = actions;

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
                bgcolor: '#20C997',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonAddIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: '18px', fontWeight: 700 }}>
              참조자 선택
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: isDark ? '#E5E7EB' : '#111827' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* 검색 필드 */}
        <TextField
          fullWidth
          placeholder="부서명 또는 이름으로 검색"
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
                borderColor: '#20C997',
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

        {/* 선택된 참조자 표시 */}
        {selectedReferences.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(32, 201, 151, 0.15)' : 'rgba(32, 201, 151, 0.1)',
              border: `1px solid ${isDark ? 'rgba(32, 201, 151, 0.35)' : 'rgba(32, 201, 151, 0.2)'}`,
            }}
          >
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#20C997', mb: 1 }}>
              선택된 참조자 ({selectedReferences.length}명)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedReferences.map((ref, idx) => (
                <Chip
                  key={idx}
                  label={`${ref.name}(${ref.department})`}
                  onDelete={() => removeReference(ref)}
                  deleteIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                  size="small"
                  sx={{
                    bgcolor: '#20C997',
                    color: 'white',
                    fontSize: '10px',
                    height: 20,
                    '& .MuiChip-deleteIcon': {
                      color: 'white',
                      opacity: 0.85,
                      marginRight: '-4px',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 부서 및 멤버 리스트 */}
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>부서 목록을 불러오는 중...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredDepartments.map((department) => {
              const members = getFilteredMembers(department);
              const isExpanded = expandedDepartments.has(department);
              
              if (members.length === 0 && searchText) return null;
              
              return (
                <Box key={department}>
                  <ListItem
                    disablePadding
                    sx={{
                      mb: 0.5,
                      borderRadius: '8px',
                      bgcolor: isDark ? '#111827' : '#F8F9FA',
                      border: isDark ? '1px solid #374151' : '1px solid transparent',
                    }}
                  >
                    <ListItemButton onClick={() => toggleDepartmentExpansion(department)}>
                      <ListItemIcon>
                        <Checkbox
                          checked={isDepartmentFullySelected(department)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDepartment(department);
                          }}
                          sx={{
                            color: '#20C997',
                            '&.Mui-checked': {
                              color: '#20C997',
                            },
                            padding: 0,
                            marginRight: 1,
                          }}
                        />
                        <BusinessIcon sx={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111827' }}>
                            {department}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#9CA3AF' }}>
                            {members.length}명
                          </Typography>
                        }
                      />
                      {isExpanded ? (
                        <ExpandLessIcon sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
                      ) : (
                        <ExpandMoreIcon sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                  
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {members.map((member, idx) => {
                        const isSelected = isPersonSelected(member);
                        
                        return (
                          <ListItem
                            key={idx}
                            disablePadding
                            sx={{
                              pl: 4,
                              mb: 0.5,
                              borderRadius: '8px',
                              bgcolor: isSelected
                                ? 'rgba(32, 201, 151, 0.15)'
                                : isDark
                                  ? '#0F172A'
                                  : 'transparent',
                              border: `1px solid ${isSelected ? '#20C997' : isDark ? '#1F2937' : 'transparent'}`,
                            }}
                          >
                            <ListItemButton onClick={() => togglePerson(member)}>
                              <ListItemIcon>
                                <Checkbox
                                  checked={isSelected}
                                  edge="start"
                                  sx={{
                                    color: '#20C997',
                                    '&.Mui-checked': {
                                      color: '#20C997',
                                    },
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: isDark ? '#E5E7EB' : '#111827' }}>
                                      {member.name}
                                    </Typography>
                                    {member.email && (
                                      <Typography sx={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                        {member.email}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
          </List>
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
          sx={{ flex: 1, bgcolor: '#20C997' }}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}
