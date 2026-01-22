import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { Archive } from '../types';
import SearchDialog from '../components/chat/SearchDialog';
import HelpDialog from '../components/common/HelpDialog';
import LeaveRequestDraftPanel from '../components/leave/LeaveRequestDraftPanel';
import ElectronicApprovalDraftPanel from '../components/approval/ElectronicApprovalDraftPanel';
import { isDefaultArchive } from '../store/chatStore';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

type ChatPageModalsProps = {
  searchDialogOpen: boolean;
  setSearchDialogOpen: (open: boolean) => void;
  helpDialogOpen: boolean;
  setHelpDialogOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  handleMenuClose: () => void;
  selectedArchive: Archive | null;
  setSelectedArchive: (archive: Archive | null) => void;
  handleRenameClick: () => void;
  handleDeleteClick: () => void;
  renameDialogOpen: boolean;
  setRenameDialogOpen: (open: boolean) => void;
  newName: string;
  setNewName: (value: string) => void;
  handleRenameSubmit: () => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDeleteConfirm: () => Promise<void>;
  resetDialogOpen: boolean;
  setResetDialogOpen: (open: boolean) => void;
  handleResetConfirm: () => Promise<void>;
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  handleBulkDelete: () => Promise<void>;
  archives: Archive[];
  selectArchive: (archive: Archive) => void;
  snackbar: SnackbarState;
  setSnackbar: (state: SnackbarState) => void;
};

const ChatPageModals: React.FC<ChatPageModalsProps> = ({
  searchDialogOpen,
  setSearchDialogOpen,
  helpDialogOpen,
  setHelpDialogOpen,
  anchorEl,
  handleMenuClose,
  selectedArchive,
  setSelectedArchive,
  handleRenameClick,
  handleDeleteClick,
  renameDialogOpen,
  setRenameDialogOpen,
  newName,
  setNewName,
  handleRenameSubmit,
  deleteDialogOpen,
  setDeleteDialogOpen,
  handleDeleteConfirm,
  resetDialogOpen,
  setResetDialogOpen,
  handleResetConfirm,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  handleBulkDelete,
  archives,
  selectArchive,
  snackbar,
  setSnackbar,
}) => (
  <>
    {/* 검색 다이얼로그 */}
    <SearchDialog
      open={searchDialogOpen}
      onClose={() => setSearchDialogOpen(false)}
      archives={archives}
      onSelectArchive={(archive) => {
        selectArchive(archive);
        setSearchDialogOpen(false);
      }}
      onSelectMessage={(archiveId, chatId) => {
        console.log('메시지 선택:', archiveId, chatId);
      }}
    />

    {/* 도움말 다이얼로그 */}
    <HelpDialog
      open={helpDialogOpen}
      onClose={() => setHelpDialogOpen(false)}
    />

    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      MenuListProps={{
        'aria-labelledby': 'archive-menu-button',
        disableListWrap: true,
        autoFocus: false,
        autoFocusItem: false,
      }}
      slotProps={{
        paper: {
          sx: {
            zIndex: (theme) => theme.zIndex.modal + 1,
          },
        },
      }}
      disablePortal={false}
      disableAutoFocus={true}
      disableEnforceFocus={true}
      disableRestoreFocus={true}
      disableScrollLock={true}
    >
      {selectedArchive && !isDefaultArchive(selectedArchive) && (
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleRenameClick();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>이름 변경</ListItemText>
        </MenuItem>
      )}
      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteClick();
        }}
      >
        <ListItemIcon>
          {selectedArchive && isDefaultArchive(selectedArchive) ? (
            <RefreshIcon fontSize="small" />
          ) : (
            <DeleteIcon fontSize="small" color="error" />
          )}
        </ListItemIcon>
        <ListItemText>
          {selectedArchive && isDefaultArchive(selectedArchive) ? '초기화' : '삭제'}
        </ListItemText>
      </MenuItem>
    </Menu>

    {/* 이름 변경 다이얼로그 */}
    <Dialog
      open={renameDialogOpen}
      onClose={() => setRenameDialogOpen(false)}
      disableEnforceFocus
    >
      <DialogTitle>아카이브 이름 변경</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="새 이름"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleRenameSubmit();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          console.log('이름 변경 다이얼로그 취소 버튼 클릭');
          setRenameDialogOpen(false);
        }}>취소</Button>
        <Button onClick={() => {
          console.log('이름 변경 버튼 클릭됨!');
          handleRenameSubmit();
        }} variant="contained">
          변경
        </Button>
      </DialogActions>
    </Dialog>

    {/* 삭제 확인 다이얼로그 */}
    <Dialog
      open={deleteDialogOpen}
      onClose={() => {
        console.log('🔵 다이얼로그 onClose');
        setDeleteDialogOpen(false);
        setSelectedArchive(null);
      }}
      PaperProps={{
        onMouseMove: () => {
          console.log('🟠 다이얼로그 내부에서 마우스 움직임 감지됨');
        },
        sx: {
          zIndex: 9999,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            zIndex: (theme) => theme.zIndex.drawer + 1,
          },
        },
      }}
    >
      <DialogTitle
        onMouseEnter={() => console.log('🔷 DialogTitle 마우스 진입')}
      >
        아카이브 삭제
      </DialogTitle>
      <DialogContent
        onMouseEnter={() => console.log('🔷 DialogContent 마우스 진입')}
      >
        <DialogContentText>
          "{selectedArchive?.archive_name}" 아카이브를 삭제하시겠습니까?
          <br />
          이 작업은 되돌릴 수 없습니다.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setDeleteDialogOpen(false);
          setSelectedArchive(null);
        }}>취소</Button>
        <Button
          onMouseEnter={() => {
            console.log('🟢 삭제 버튼 위에 마우스 올림');
            console.log('🟢 버튼 disabled 상태:', !selectedArchive);
          }}
          onMouseDown={(e) => {
            console.log('🟡 삭제 버튼 mouseDown');
            e.stopPropagation();
          }}
          onClick={async (e) => {
            console.log('🔴 삭제 버튼 onClick 발생!');
            e.stopPropagation();
            e.preventDefault();

            if (!selectedArchive) {
              console.log('❌ selectedArchive 없음');
              return;
            }

            console.log('✅ selectedArchive 있음:', selectedArchive.archive_id);
            console.log('🚀 handleDeleteConfirm 호출 시작...');

            try {
              await handleDeleteConfirm();
              console.log('✅ handleDeleteConfirm 완료');
            } catch (error) {
              console.error('❌ 삭제 중 에러:', error);
            }
          }}
          variant="contained"
          color="error"
          disabled={!selectedArchive}
        >
          삭제
        </Button>
      </DialogActions>
    </Dialog>

    {/* 초기화 확인 다이얼로그 */}
    <Dialog
      open={resetDialogOpen}
      onClose={() => {
        console.log('🔵 초기화 다이얼로그 onClose');
        setResetDialogOpen(false);
        setSelectedArchive(null);
      }}
      PaperProps={{
        onMouseMove: () => {
          console.log('🟠 초기화 다이얼로그 내부에서 마우스 움직임');
        },
        sx: {
          zIndex: 9999,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            zIndex: (theme) => theme.zIndex.drawer + 1,
          },
        },
      }}
    >
      <DialogTitle
        onMouseEnter={() => console.log('🔷 초기화 DialogTitle 마우스 진입')}
      >
        기본 아카이브 초기화
      </DialogTitle>
      <DialogContent
        onMouseEnter={() => console.log('🔷 초기화 DialogContent 마우스 진입')}
      >
        <DialogContentText>
          "{selectedArchive?.archive_name}"의 대화 내용을 초기화하시겠습니까?
          <br />
          <br />
          초기화하면 기존 대화 내용이 모두 삭제되고 새로운 동일 유형의 아카이브가 생성됩니다.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onMouseEnter={() => console.log('🟢 취소 버튼 마우스 진입')}
          onMouseDown={(e) => {
            console.log('🟡 취소 버튼 mouseDown');
            e.stopPropagation();
          }}
          onClick={(e) => {
            console.log('🔴 취소 버튼 클릭됨!');
            e.stopPropagation();
            setResetDialogOpen(false);
            setSelectedArchive(null);
          }}
        >
          취소
        </Button>
        <Button
          onMouseEnter={() => {
            console.log('🟢 초기화 버튼 마우스 진입');
          }}
          onMouseDown={(e) => {
            console.log('🟡 초기화 버튼 mouseDown');
            e.stopPropagation();
          }}
          onClick={async (e) => {
            console.log('🔴🔴🔴 초기화 버튼 onClick 발생!');
            e.stopPropagation();
            e.preventDefault();

            try {
              await handleResetConfirm();
            } catch (error) {
              console.error('❌ 초기화 중 에러:', error);
            }
          }}
          variant="contained"
          color="primary"
        >
          초기화
        </Button>
      </DialogActions>
    </Dialog>

    {/* 일괄 삭제 확인 다이얼로그 */}
    <Dialog
      open={bulkDeleteDialogOpen}
      onClose={() => {
        setBulkDeleteDialogOpen(false);
      }}
      PaperProps={{
        sx: {
          zIndex: 9999,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            zIndex: (theme) => theme.zIndex.drawer + 1,
          },
        },
      }}
    >
      <DialogTitle>커스텀 아카이브 일괄 삭제</DialogTitle>
      <DialogContent>
        <DialogContentText>
          기본 아카이브를 제외한 모든 커스텀 아카이브를 삭제하시겠습니까?
          <br />
          <br />
          <strong>삭제 대상: {archives.filter((archive) => !isDefaultArchive(archive)).length}개</strong>
          <br />
          이 작업은 되돌릴 수 없습니다.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setBulkDeleteDialogOpen(false);
          }}
        >
          취소
        </Button>
        <Button
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await handleBulkDelete();
          }}
          variant="contained"
          color="error"
        >
          전체 삭제
        </Button>
      </DialogActions>
    </Dialog>

    {/* 알림 스낵바 */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>

    {/* 휴가 신청 초안 패널 */}
    <LeaveRequestDraftPanel />
    <ElectronicApprovalDraftPanel />
  </>
);

export default ChatPageModals;
