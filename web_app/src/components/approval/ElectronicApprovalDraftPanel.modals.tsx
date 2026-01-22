import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ApproverSelectionModal from '../leave/ApproverSelectionModal';
import ReferenceSelectionModal from '../leave/ReferenceSelectionModal';
import type { EApprovalCcPerson } from '../../types/eapproval';

type ElectronicApprovalDraftModalsProps = {
  isApproverModalOpen: boolean;
  isReferenceModalOpen: boolean;
  isSequentialApproval: boolean;
  webviewOpen: boolean;
  webviewUrl: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: 'success' | 'error';
  isMobile: boolean;
  approverIds: string[];
  ccList: EApprovalCcPerson[];
  onCloseApprover: () => void;
  onConfirmApprover: (ids: string[], selectedApprovers: any[]) => void;
  onCloseReference: () => void;
  onConfirmReference: (selected: EApprovalCcPerson[]) => void;
  onCloseWebview: () => void;
  onSnackbarClose: () => void;
};

const ElectronicApprovalDraftPanelModals: React.FC<ElectronicApprovalDraftModalsProps> = ({
  isApproverModalOpen,
  isReferenceModalOpen,
  isSequentialApproval,
  webviewOpen,
  webviewUrl,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  isMobile,
  approverIds,
  ccList,
  onCloseApprover,
  onConfirmApprover,
  onCloseReference,
  onConfirmReference,
  onCloseWebview,
  onSnackbarClose,
}) => (
  <>
    <ApproverSelectionModal
      open={isApproverModalOpen}
      onClose={onCloseApprover}
      onConfirm={onConfirmApprover}
      initialSelectedApproverIds={approverIds}
      sequentialApproval={isSequentialApproval}
    />

    <ReferenceSelectionModal
      open={isReferenceModalOpen}
      onClose={onCloseReference}
      onConfirm={onConfirmReference}
      currentReferences={ccList}
    />

    <Dialog open={webviewOpen} onClose={onCloseWebview} fullScreen={isMobile} maxWidth="xl" fullWidth>
      <DialogTitle>결재 상세</DialogTitle>
      <DialogContent sx={{ p: 0, height: isMobile ? '100%' : '80vh' }}>
        <iframe
          title="approval-webview"
          src={webviewUrl}
          style={{ border: 'none', width: '100%', height: '100%' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseWebview}>닫기</Button>
      </DialogActions>
    </Dialog>

    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={onSnackbarClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
        {snackbarMessage}
      </Alert>
    </Snackbar>
  </>
);

export default ElectronicApprovalDraftPanelModals;
