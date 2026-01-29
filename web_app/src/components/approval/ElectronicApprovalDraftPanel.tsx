import { useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  useMediaQuery,
  Slide,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  HowToReg as HowToRegIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Save as SaveIcon,
  AttachFile as AttachFileIcon,
  OpenInFull as OpenInFullIcon,
  Description as DescriptionIcon,
  PersonAddOutlined as PersonAddOutlinedIcon,
  CloudDone as CloudDoneIcon,
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  TextSnippet as TextSnippetIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useThemeStore } from '../../store/themeStore';
import { LEAVE_TYPES } from './ElectronicApprovalDraftPanel.shared';
import { useElectronicApprovalDraftState } from './ElectronicApprovalDraftPanel.state';
import ElectronicApprovalDraftPanelModals from './ElectronicApprovalDraftPanel.modals';

const CONTRACT_WEB_URL = 'http://210.107.96.193:3001/contract';
const PURCHASE_WEB_URL = 'http://210.107.96.193:3001/purchase';
const DEFAULT_WEB_URL = 'http://210.107.96.193:3001/default';
const PRIMARY_COLOR = '#4A6CF7';
const SUCCESS_COLOR = '#10B981';
const INFO_COLOR = '#20C997';
const MUTED_COLOR = '#8B95A1';
const LIGHT_BORDER = '#E9ECEF';
const DARK_BORDER = '#4A5568';
const LIGHT_SURFACE = '#F8F9FA';
const DARK_SURFACE = '#2D3748';
const DARK_PANEL = '#1A1D1F';
const LIGHT_TEXT = '#1A1D1F';
const MUTED_TEXT = '#6C757D';

export default function ElectronicApprovalDraftPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isNarrowDesktop = useMediaQuery(theme.breakpoints.down('lg'));
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';
  const { state, derived, actions } = useElectronicApprovalDraftState();
  const {
    user,
    isOpen,
    isLoading,
    approvalType,
    draftingDepartment,
    isCustomDepartment,
    departments,
    retentionPeriod,
    draftingDate,
    documentTitle,
    content,
    leaveType,
    grantDays,
    reason,
    approvers,
    ccList,
    attachments,
    chatAttachments,
    isApproverModalOpen,
    isReferenceModalOpen,
    isSequentialApproval,
    webviewOpen,
    htmlContent,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
  } = state;

  const { approvalOptions } = derived;

  const {
    closePanel,
    setApprovalType,
    setDraftingDepartment,
    setIsCustomDepartment,
    setRetentionPeriod,
    setDraftingDate,
    setDocumentTitle,
    setContent,
    setLeaveType,
    setGrantDays,
    setReason,
    setApprovers,
    setCcList,
    setAttachments,
    setChatAttachments,
    setIsApproverModalOpen,
    setIsReferenceModalOpen,
    setIsSequentialApproval,
    setWebviewOpen,
    setSnackbarOpen,
    handleAttachmentSelect,
    handleRemoveAttachment,
    handleRemoveChatAttachment,
    handleApproverConfirm,
    handleSaveApprovalLine,
    handleSubmit,
    handleReset,
  } = actions;

  const webviewUrl = useMemo(() => {
    if (approvalType === '매출/매입계약 기안서') return CONTRACT_WEB_URL;
    if (approvalType === '구매신청서') return PURCHASE_WEB_URL;
    return DEFAULT_WEB_URL;
  }, [approvalType]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return InsertDriveFileIcon;
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return ImageIcon;
    if (ext === 'pdf') return PictureAsPdfIcon;
    if (['xls', 'xlsx'].includes(ext)) return TableChartIcon;
    if (['txt'].includes(ext)) return TextSnippetIcon;
    return InsertDriveFileIcon;
  };

  const formatSize = (size?: number) => {
    if (!size && size !== 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const panelBorderColor = isDark ? DARK_BORDER : LIGHT_BORDER;
  const panelSurface = isDark ? DARK_SURFACE : LIGHT_SURFACE;
  const panelText = isDark ? 'white' : LIGHT_TEXT;
  const subtitleText = isDark ? '#9CA3AF' : '#6B7280';
  const noWrapTextSx = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  const fieldSx = {
    '& .MuiInputLabel-root': {
      color: isDark ? '#A0AEC0' : MUTED_TEXT,
      fontSize: 12,
      whiteSpace: 'nowrap',
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: isDark ? DARK_SURFACE : 'white',
      '& fieldset': {
        borderColor: isDark ? DARK_BORDER : LIGHT_BORDER,
      },
      '&:hover fieldset': {
        borderColor: isDark ? DARK_BORDER : LIGHT_BORDER,
      },
      '&.Mui-focused fieldset': {
        borderColor: PRIMARY_COLOR,
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '12px',
    },
  };

  if (!isOpen) return null;

  // 공통 패널 내용 스타일
  const panelContentSx = {
    bgcolor: isDark ? DARK_PANEL : 'white',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
  };

  // 패널 내용 렌더링 함수
  const renderPanelContent = () => (
    <>
      <Box
            sx={{
              px: isNarrowDesktop ? 2 : 3,
              py: isNarrowDesktop ? 2 : 2.5,
              borderBottom: `1px solid ${isDark ? '#2D3748' : LIGHT_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <DescriptionIcon sx={{ color: panelText, fontSize: 24 }} />
            <Typography
              sx={{
                flexGrow: 1,
                fontSize: 18,
                fontWeight: 700,
                color: panelText,
                minWidth: 0,
                ...noWrapTextSx,
              }}
            >
              전자결재 상신
            </Typography>
            <IconButton onClick={closePanel} sx={{ color: panelText }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: isNarrowDesktop ? 2 : 3 }}>
            {isLoading && (
              <Box
                sx={{
                  mb: 2,
                  p: 2.5,
                  borderRadius: '12px',
                  border: `1px solid ${PRIMARY_COLOR}4D`,
                  bgcolor: `${PRIMARY_COLOR}1A`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <CircularProgress size={20} sx={{ color: PRIMARY_COLOR }} />
                <Typography sx={{ color: PRIMARY_COLOR, fontWeight: 600, fontSize: 14 }}>
                  휴가 부여 상신 데이터를 불러오는 중입니다...
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minWidth: 0 }}>
              <DescriptionIcon sx={{ fontSize: 16, color: PRIMARY_COLOR }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: panelText, minWidth: 0, ...noWrapTextSx }}>
                공통 필수영역
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : isNarrowDesktop
                    ? 'repeat(2, minmax(0, 1fr))'
                    : 'repeat(4, minmax(0, 1fr))',
                gap: 1,
                minWidth: 0,
              }}
            >
              {isCustomDepartment ? (
                <TextField
                  label="기안부서 *"
                  value={draftingDepartment}
                  onChange={(e) => setDraftingDepartment(e.target.value)}
                  placeholder="부서명을 입력하세요"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => {
                          setIsCustomDepartment(false);
                          setDraftingDepartment('');
                        }}
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                  sx={fieldSx}
                />
              ) : (
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>기안부서 *</InputLabel>
                  <Select
                    label="기안부서 *"
                    value={draftingDepartment || ''}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomDepartment(true);
                        setDraftingDepartment('');
                        return;
                      }
                      setDraftingDepartment(String(e.target.value));
                    }}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                    <MenuItem value="__CUSTOM__">직접입력</MenuItem>
                  </Select>
                </FormControl>
              )}

              <TextField
                label="기안자 *"
                value={user?.userId || ''}
                InputProps={{ readOnly: true }}
                sx={{
                  ...fieldSx,
                  '& .MuiOutlinedInput-input': {
                    padding: '12px',
                    color: MUTED_TEXT,
                  },
                }}
              />

              <TextField
                label="기안일 *"
                type="date"
                value={draftingDate}
                onChange={(e) => setDraftingDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />

              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>보존년한 *</InputLabel>
                <Select
                  label="보존년한 *"
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(String(e.target.value))}
                >
                  {['영구', '5년', '10년', '15년', '20년'].map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 2, mb: 3 }}>
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>결재 종류 *</InputLabel>
                <Select
                  label="결재 종류 *"
                  value={approvalType}
                  onChange={(e) => {
                    const next = String(e.target.value);
                    setApprovalType(next);
                    setDocumentTitle(next);
                  }}
                >
                  {approvalOptions.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile || isNarrowDesktop ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                gap: 2,
                mb: 3,
                minWidth: 0,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, minWidth: 0 }}>
                  <HowToRegIcon sx={{ fontSize: 16, color: PRIMARY_COLOR }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: panelText, minWidth: 0, ...noWrapTextSx }}>
                    승인자
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 1,
                    mb: 1.5,
                    flexWrap: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<HowToRegIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setIsSequentialApproval(false);
                      setIsApproverModalOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      bgcolor: PRIMARY_COLOR,
                      borderRadius: '10px',
                      py: 1.3,
                      fontWeight: 600,
                      fontSize: 'clamp(11px, 1.1vw, 14px)',
                      whiteSpace: 'nowrap',
                      px: 1.25,
                    }}
                  >
                    승인자 선택
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FormatListNumberedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setIsSequentialApproval(true);
                      setIsApproverModalOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      bgcolor: SUCCESS_COLOR,
                      borderRadius: '10px',
                      py: 1.3,
                      fontWeight: 600,
                      fontSize: 'clamp(11px, 1.1vw, 14px)',
                      whiteSpace: 'nowrap',
                      px: 1.25,
                    }}
                  >
                    순차결재
                  </Button>
                </Box>
                <Box
                  sx={{
                    minHeight: 80,
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: panelSurface,
                    border: `1px solid ${panelBorderColor}`,
                  }}
                >
                  {approvers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', color: subtitleText }}>
                      <HowToRegIcon sx={{ fontSize: 20, color: PRIMARY_COLOR }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 500, mt: 0.5 }}>
                        승인자 선택
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <HowToRegIcon sx={{ fontSize: 16, color: PRIMARY_COLOR }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: panelText }}>
                          선택된 승인자 ({approvers.length}명)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {approvers.map((item, idx) => (
                          <Box
                            key={`${item.approverId}-${idx}`}
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: '12px',
                              bgcolor: `${PRIMARY_COLOR}1A`,
                              color: PRIMARY_COLOR,
                              fontSize: 10,
                              fontWeight: 500,
                            }}
                          >
                            {isSequentialApproval ? `${idx + 1}. ` : ''}{item.approverName}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, minWidth: 0 }}>
                  <PersonAddOutlinedIcon sx={{ fontSize: 16, color: INFO_COLOR }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: panelText, minWidth: 0, ...noWrapTextSx }}>
                    참조자
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setIsReferenceModalOpen(true)}
                  sx={{
                    bgcolor: INFO_COLOR,
                    borderRadius: '10px',
                    py: 1.3,
                    fontWeight: 600,
                    mb: 1.5,
                    fontSize: 'clamp(11px, 1.1vw, 14px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  참조자 선택
                </Button>
                <Box
                  sx={{
                    minHeight: 80,
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: panelSurface,
                    border: `1px solid ${panelBorderColor}`,
                  }}
                >
                  {ccList.length === 0 ? (
                    <Box sx={{ textAlign: 'center', color: subtitleText }}>
                      <PersonAddOutlinedIcon sx={{ fontSize: 20, color: INFO_COLOR }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 500, mt: 0.5 }}>
                        참조자 선택
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <PersonAddOutlinedIcon sx={{ fontSize: 16, color: INFO_COLOR }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: panelText }}>
                          선택된 참조자 ({ccList.length}명)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {ccList.map((item, idx) => (
                          <Box
                            key={`${item.name}-${idx}`}
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: '12px',
                              bgcolor: `${INFO_COLOR}1A`,
                              color: INFO_COLOR,
                              fontSize: 10,
                              fontWeight: 500,
                            }}
                          >
                            {item.name}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minWidth: 0 }}>
              <DescriptionIcon sx={{ fontSize: 16, color: PRIMARY_COLOR }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: panelText, minWidth: 0, ...noWrapTextSx }}>
                결재 상세
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              {approvalType === '휴가 부여 상신' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: panelSurface,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth sx={fieldSx}>
                      <InputLabel>휴가 종류 *</InputLabel>
                      <Select label="휴가 종류 *" value={leaveType} onChange={(e) => setLeaveType(String(e.target.value))}>
                        {LEAVE_TYPES.map((item) => (
                          <MenuItem key={item} value={item}>{item}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="제목 *"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      sx={fieldSx}
                    />
                    <TextField
                      label="휴가 부여 일수 *"
                      value={grantDays}
                      onChange={(e) => setGrantDays(e.target.value)}
                      type="number"
                      sx={fieldSx}
                    />
                    <TextField
                      label="사유"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      multiline
                      minRows={4}
                      sx={fieldSx}
                    />
                  </Box>
                </Box>
              )}

              {approvalType === '기본양식' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="제목 *"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    sx={fieldSx}
                  />
                  {htmlContent ? (
                    <Box
                      sx={{
                        border: `1px solid ${panelBorderColor}`,
                        borderRadius: '8px',
                        p: 2,
                        bgcolor: panelSurface,
                        maxHeight: 240,
                        overflow: 'auto',
                        color: panelText,
                        fontSize: 14,
                      }}
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  ) : (
                    <TextField
                      label="내용 *"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      multiline
                      minRows={5}
                      sx={fieldSx}
                    />
                  )}
                </Box>
              )}

              {(approvalType === '매출/매입계약 기안서' || approvalType === '구매신청서') && (
                <Box sx={{ border: `1px solid ${panelBorderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, bgcolor: panelSurface }}>
                    <Button size="small" startIcon={<OpenInFullIcon />} onClick={() => setWebviewOpen(true)}>
                      전체 화면
                    </Button>
                  </Box>
                  <Box sx={{ height: 320 }}>
                    <iframe title="approval-webview" src={webviewUrl} width="100%" height="100%" style={{ border: 0 }} />
                  </Box>
                </Box>
              )}

              {(approvalType === '교육신청서' || approvalType === '경조사비 지급신청서') && (
                <Box sx={{ p: 2, borderRadius: '8px', bgcolor: panelSurface, color: panelText }}>
                  <Typography variant="body2">추후 구현 예정입니다.</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minWidth: 0 }}>
              <AttachFileIcon sx={{ fontSize: 16, color: PRIMARY_COLOR }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: panelText, minWidth: 0, ...noWrapTextSx }}>
                첨부파일
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: panelSurface,
                border: `1px solid ${panelBorderColor}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minWidth: 0 }}>
                <AttachFileIcon sx={{ fontSize: 16, color: panelText }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: panelText, minWidth: 0, ...noWrapTextSx }}>
                  {attachments.length + chatAttachments.length === 0
                    ? '첨부파일'
                    : `첨부파일 ${attachments.length + chatAttachments.length}개`}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {(attachments.length > 0 || chatAttachments.length > 0) && (
                  <Button size="small" onClick={() => { setAttachments([]); setChatAttachments([]); }} sx={{ color: PRIMARY_COLOR }}>
                    모두 삭제
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  component="label"
                  sx={{ bgcolor: PRIMARY_COLOR, fontSize: 12, py: 0.5, px: 1.5, whiteSpace: 'nowrap' }}
                >
                  파일 추가
                  <input hidden type="file" multiple onChange={(e) => handleAttachmentSelect(e.target.files)} />
                </Button>
              </Box>

              {chatAttachments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <CloudDoneIcon sx={{ fontSize: 14, color: SUCCESS_COLOR }} />
                    <Typography sx={{ fontSize: 11, color: SUCCESS_COLOR }}>
                      채팅에서 첨부됨 ({chatAttachments.length}개)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {chatAttachments.map((item, idx) => {
                      const Icon = getFileIcon(item.file_name);
                      return (
                        <Box
                          key={`${item.file_name}-${idx}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: '8px',
                            bgcolor: isDark ? '#1A202C' : 'white',
                            border: `1px solid ${panelBorderColor}`,
                          }}
                        >
                          <Icon sx={{ fontSize: 20, color: PRIMARY_COLOR }} />
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: panelText }}>
                              {item.file_name.length > 15 ? `${item.file_name.slice(0, 12)}...` : item.file_name}
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: subtitleText }}>
                              {formatSize(item.size)}
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={() => handleRemoveChatAttachment(idx)}>
                            <CloseIcon sx={{ fontSize: 12, color: subtitleText }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {attachments.length > 0 && (
                <Box>
                  {chatAttachments.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <FolderOpenIcon sx={{ fontSize: 14, color: PRIMARY_COLOR }} />
                      <Typography sx={{ fontSize: 11, color: PRIMARY_COLOR }}>
                        직접 첨부 ({attachments.length}개)
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {attachments.map((file, idx) => {
                      const Icon = getFileIcon(file.name);
                      return (
                        <Box
                          key={`${file.name}-${idx}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: '8px',
                            bgcolor: isDark ? '#1A202C' : 'white',
                            border: `1px solid ${panelBorderColor}`,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Icon sx={{ fontSize: 20, color: PRIMARY_COLOR }} />
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: panelText }}>
                              {file.name.length > 15 ? `${file.name.slice(0, 12)}...` : file.name}
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: subtitleText }}>
                              {formatSize(file.size)}
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={() => handleRemoveAttachment(idx)}>
                            <CloseIcon sx={{ fontSize: 12, color: subtitleText }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {attachments.length === 0 && chatAttachments.length === 0 && (
                <Typography sx={{ fontSize: 12, color: subtitleText, textAlign: 'center', mt: 2 }}>
                  파일을 추가하려면 위의 "파일 추가" 버튼을 클릭하세요
                </Typography>
              )}
            </Box>
          </Box>

          <Divider />
          <Box sx={{ p: isNarrowDesktop ? 2 : 3, borderTop: `1px solid ${isDark ? '#2D3748' : LIGHT_BORDER}` }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveApprovalLine}
              sx={{
                color: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
                borderRadius: '8px',
                py: 1.2,
                fontWeight: 600,
                fontSize: 'clamp(11px, 1.1vw, 14px)',
                whiteSpace: 'nowrap',
                mb: 1.5,
              }}
            >
              전자결재용 결재라인 저장
            </Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                onClick={handleReset}
                sx={{
                  color: MUTED_COLOR,
                  fontWeight: 600,
                  fontSize: 'clamp(11px, 1.1vw, 14px)',
                  whiteSpace: 'nowrap',
                }}
              >
                초기화
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={isLoading}
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  fontWeight: 600,
                  py: 1.2,
                  fontSize: 'clamp(11px, 1.1vw, 14px)',
                  whiteSpace: 'nowrap',
                }}
              >
                {isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '상신'}
              </Button>
            </Box>
          </Box>
    </>
  );

  // 모바일: 오른쪽 슬라이드 패널
  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.15)',
            zIndex: 1200,
          }}
          onClick={closePanel}
        />
        <Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
          <Box
            sx={{
              ...panelContentSx,
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: '100%',
              zIndex: 1300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderPanelContent()}
          </Box>
        </Slide>
        <ElectronicApprovalDraftPanelModals
          isApproverModalOpen={isApproverModalOpen}
          isReferenceModalOpen={isReferenceModalOpen}
          isSequentialApproval={isSequentialApproval}
          webviewOpen={webviewOpen}
          webviewUrl={webviewUrl}
          snackbarOpen={snackbarOpen}
          snackbarMessage={snackbarMessage}
          snackbarSeverity={snackbarSeverity}
          isMobile={isMobile}
          approverIds={approvers.map((item) => item.approverId)}
          ccList={ccList}
          onCloseApprover={() => setIsApproverModalOpen(false)}
          onConfirmApprover={handleApproverConfirm}
          onCloseReference={() => setIsReferenceModalOpen(false)}
          onConfirmReference={(refs) => setCcList(refs.map((ref) => ({
            name: ref.name,
            department: ref.department,
            user_id: (ref as any).userId || (ref as any).user_id,
          })))}
          onCloseWebview={() => setWebviewOpen(false)}
          onSnackbarClose={() => setSnackbarOpen(false)}
        />
      </>
    );
  }

  // 데스크톱: 중앙 팝업 모달
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={closePanel}
      >
        <Box
          sx={{
            ...panelContentSx,
            width: { md: '86vw', lg: '70vw', xl: '60vw' },
            minWidth: 560,
            maxWidth: 1100,
            maxHeight: '90vh',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderPanelContent()}
        </Box>
      </Box>
      <ElectronicApprovalDraftPanelModals
        isApproverModalOpen={isApproverModalOpen}
        isReferenceModalOpen={isReferenceModalOpen}
        isSequentialApproval={isSequentialApproval}
        webviewOpen={webviewOpen}
        webviewUrl={webviewUrl}
        snackbarOpen={snackbarOpen}
        snackbarMessage={snackbarMessage}
        snackbarSeverity={snackbarSeverity}
        isMobile={isMobile}
        approverIds={approvers.map((item) => item.approverId)}
        ccList={ccList}
        onCloseApprover={() => setIsApproverModalOpen(false)}
        onConfirmApprover={handleApproverConfirm}
        onCloseReference={() => setIsReferenceModalOpen(false)}
        onConfirmReference={(refs) => setCcList(refs.map((ref) => ({
          name: ref.name,
          department: ref.department,
          user_id: (ref as any).userId || (ref as any).user_id,
        })))}
        onCloseWebview={() => setWebviewOpen(false)}
        onSnackbarClose={() => setSnackbarOpen(false)}
      />
    </>
  );
}
