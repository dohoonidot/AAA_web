import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import leaveService from '../services/leaveService';
import authService from '../services/authService';
import { createLogger } from '../utils/logger';
import type { LeaveGrantRequestItem } from '../types/leave';

const logger = createLogger('LeaveGrantHistoryPage');

export const useLeaveGrantHistoryPageState = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<LeaveGrantRequestItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LeaveGrantRequestItem | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    managerGranted: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const response = await leaveService.getGrantRequestList(user.userId);
      const data = response.leaveGrants || [];
      setHistory(data);

      setStats({
        total: data.length,
        pending: data.filter((item: any) => item.status === 'REQUESTED').length,
        managerGranted: data.filter((item: any) => item.isManager === 1).length,
        approved: data.filter((item: any) => item.status === 'APPROVED').length,
        rejected: data.filter((item: any) => item.status === 'REJECTED').length,
      });
    } catch (error) {
      logger.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    state: {
      loading,
      history,
      selectedItem,
      stats,
    },
    actions: {
      setLoading,
      setHistory,
      setSelectedItem,
      setStats,
      fetchHistory,
      navigate,
    },
  };
};

export type LeaveGrantHistoryPageStateHook = ReturnType<typeof useLeaveGrantHistoryPageState>;
