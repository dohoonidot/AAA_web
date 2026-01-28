import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Archive } from '../types';
import { useChatStore, ARCHIVE_NAMES, getArchiveIcon, getArchiveColor, getArchiveTag, getArchiveDescription, isDefaultArchive } from '../store/chatStore';
import authService from '../services/authService';
import chatService from '../services/chatService';

export const useChatPageState = () => {
  const {
    archives,
    currentArchive,
    setArchives,
    setCurrentArchive,
    setMessages,
  } = useChatStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const deleteDialogOpenTimeRef = useRef<number>(0);
  const [newName, setNewName] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (isInitialized) return;

      await loadArchives();

      if (isMounted) {
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('ChatPage: currentArchive 변경됨:', currentArchive?.archive_name);
  }, [currentArchive]);

  useEffect(() => {
    console.log('💎 deleteDialogOpen 상태 변경됨:', deleteDialogOpen);
    if (deleteDialogOpen) {
      console.log('💎 다이얼로그가 열렸습니다!');
      console.log('💎 selectedArchive:', selectedArchive);
    }
  }, [deleteDialogOpen, selectedArchive]);

  const loadArchives = async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.warn('사용자 정보가 없습니다.');
      return [] as Archive[];
    }

    try {
      console.log('아카이브 로드 시작:', currentUser.userId);
      const archiveList = await chatService.getArchiveList(currentUser.userId);
      console.log('로드된 아카이브 목록:', archiveList);

      const uniqueArchives = archiveList.filter((archive, index, self) =>
        index === self.findIndex((a) => a.archive_id === archive.archive_id)
      );

      const defaultArchives: Archive[] = [];
      const customArchives: Archive[] = [];

      uniqueArchives.forEach((archive) => {
        const name = archive.archive_name;
        const type = archive.archive_type || '';

        if (
          name === ARCHIVE_NAMES.WORK ||
          name === ARCHIVE_NAMES.CODE ||
          name === ARCHIVE_NAMES.SAP ||
          name === ARCHIVE_NAMES.CHATBOT ||
          type === 'code' ||
          type === 'sap'
        ) {
          defaultArchives.push(archive);
        } else {
          customArchives.push(archive);
        }
      });

      console.log('📊 기본 아카이브 수:', defaultArchives.length);
      console.log('📊 일반 아카이브 수:', customArchives.length);

      const latestDefaultArchives: Archive[] = [];

      const workArchives = defaultArchives
        .filter((a) => a.archive_name === ARCHIVE_NAMES.WORK && (a.archive_type === '' || !a.archive_type))
        .sort((a, b) => new Date(b.archive_time).getTime() - new Date(a.archive_time).getTime());
      if (workArchives.length > 0) {
        latestDefaultArchives.push(workArchives[0]);
        console.log('✅ 사내업무 최신:', workArchives[0].archive_id, workArchives[0].archive_time);
      }

      const codeArchives = defaultArchives
        .filter((a) => a.archive_name === ARCHIVE_NAMES.CODE || a.archive_type === 'code')
        .sort((a, b) => new Date(b.archive_time).getTime() - new Date(a.archive_time).getTime());
      if (codeArchives.length > 0) {
        latestDefaultArchives.push(codeArchives[0]);
        console.log('✅ 코딩어시스턴트 최신:', codeArchives[0].archive_id, codeArchives[0].archive_time);
      }

      const sapArchives = defaultArchives
        .filter((a) => a.archive_name === ARCHIVE_NAMES.SAP || a.archive_type === 'sap')
        .sort((a, b) => new Date(b.archive_time).getTime() - new Date(a.archive_time).getTime());
      if (sapArchives.length > 0) {
        latestDefaultArchives.push(sapArchives[0]);
        console.log('✅ SAP어시스턴트 최신:', sapArchives[0].archive_id, sapArchives[0].archive_time);
      }

      const chatbotArchives = defaultArchives
        .filter((a) => a.archive_name === ARCHIVE_NAMES.CHATBOT)
        .sort((a, b) => new Date(b.archive_time).getTime() - new Date(a.archive_time).getTime());
      if (chatbotArchives.length > 0) {
        latestDefaultArchives.push(chatbotArchives[0]);
        console.log('✅ AI Chatbot 최신:', chatbotArchives[0].archive_id, chatbotArchives[0].archive_time);
      }

      const filteredArchives = [...latestDefaultArchives, ...customArchives];
      console.log('📋 필터링 후 총 아카이브 수:', filteredArchives.length);

      const sorted = [...filteredArchives].sort((a, b) => {
        const orderA = getArchiveOrder(a);
        const orderB = getArchiveOrder(b);

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return new Date(b.archive_time).getTime() - new Date(a.archive_time).getTime();
      });

      setArchives(sorted);

      if (sorted.length === 0) {
        console.log('아카이브가 없어서 기본 아카이브 4개를 생성합니다.');
        await createDefaultArchives();
      } else {
        await ensureDefaultArchives(sorted);

        if (!currentArchive) {
          const workArchive = sorted.find(
            (a) => a.archive_name === ARCHIVE_NAMES.WORK
          );

          if (workArchive) {
            selectArchive(workArchive);
          } else {
            selectArchive(sorted[0]);
          }
        }
      }

      return sorted;
    } catch (error: any) {
      console.error('Failed to load archives:', error);
      console.error('에러 상세:', error.response?.data);

      if (error.response?.status === 500) {
        console.log('서버 에러로 인해 기본 아카이브 4개를 생성합니다.');
        try {
          await createDefaultArchives();
        } catch (createError) {
          console.error('기본 아카이브 생성도 실패:', createError);
        }
      }

      return [] as Archive[];
    }
  };

  const getArchiveOrder = (archive: Archive): number => {
    const name = archive.archive_name;
    const type = archive.archive_type;

    if (name === ARCHIVE_NAMES.WORK || (type === '' && name.includes('사내업무'))) {
      return 1;
    } else if (name === ARCHIVE_NAMES.CODE || type === 'code') {
      return 2;
    } else if (name === ARCHIVE_NAMES.SAP || type === 'sap') {
      return 3;
    } else if (name === ARCHIVE_NAMES.CHATBOT) {
      return 4;
    }
    return 5;
  };

  const ensureDefaultArchives = async (existingArchives: Archive[]) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const requiredArchives = [
      { title: ARCHIVE_NAMES.WORK, type: '', check: (a: Archive) => a.archive_name === ARCHIVE_NAMES.WORK && (a.archive_type === '' || !a.archive_type) },
      { title: ARCHIVE_NAMES.CODE, type: 'code', check: (a: Archive) => (a.archive_name === ARCHIVE_NAMES.CODE || a.archive_type === 'code') },
      { title: ARCHIVE_NAMES.SAP, type: 'sap', check: (a: Archive) => (a.archive_name === ARCHIVE_NAMES.SAP || a.archive_type === 'sap') },
      { title: ARCHIVE_NAMES.CHATBOT, type: '', check: (a: Archive) => a.archive_name === ARCHIVE_NAMES.CHATBOT },
    ];

    const missingArchives = requiredArchives.filter(
      required => !existingArchives.some(required.check)
    );

    if (missingArchives.length > 0) {
      console.log(`⚠️ 빠진 기본 아카이브 ${missingArchives.length}개 발견:`, missingArchives.map(a => a.title));

      for (const archive of missingArchives) {
        try {
          console.log(`📦 ${archive.title} 아카이브 생성 중...`);
          const response = await chatService.createArchive(currentUser.userId, '', archive.type);
          let newArchive = response.archive;

          if (archive.type === '') {
            if (newArchive.archive_name !== archive.title) {
              await chatService.updateArchive(currentUser.userId, newArchive.archive_id, archive.title);
              newArchive = { ...newArchive, archive_name: archive.title };
            }
          }

          console.log(`✅ ${archive.title} 아카이브 생성 완료: ${newArchive.archive_id}`);
        } catch (error: any) {
          console.error(`❌ ${archive.title} 아카이브 생성 실패:`, error);
        }
      }

      await loadArchives();
    } else {
      console.log('✅ 모든 기본 아카이브가 존재합니다.');
    }
  };

  const createDefaultArchives = async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.warn('사용자 정보가 없어서 기본 아카이브를 생성할 수 없습니다.');
      return;
    }

    try {
      console.log('====== 기본 아카이브 4개 생성 시작 ======');

      const archivesToCreate = [
        { title: ARCHIVE_NAMES.WORK, type: '' },
        { title: ARCHIVE_NAMES.CODE, type: 'code' },
        { title: ARCHIVE_NAMES.SAP, type: 'sap' },
        { title: ARCHIVE_NAMES.CHATBOT, type: '' },
      ];

      const createdArchives: Archive[] = [];

      for (const archive of archivesToCreate) {
        try {
          console.log(`📦 ${archive.title} 아카이브 생성 중...`);
          const response = await chatService.createArchive(currentUser.userId, '', archive.type);
          let newArchive = response.archive;

          if (archive.type === '') {
            if (newArchive.archive_name !== archive.title) {
              console.log(`${archive.title} 아카이브 이름 변경 중...`);
              await chatService.updateArchive(currentUser.userId, newArchive.archive_id, archive.title);
              newArchive = { ...newArchive, archive_name: archive.title };
            }
          }

          createdArchives.push(newArchive);
          console.log(`✅ ${archive.title} 아카이브 생성 완료: ${newArchive.archive_id}`);
        } catch (error: any) {
          console.error(`❌ ${archive.title} 아카이브 생성 실패:`, error);
        }
      }

      await loadArchives();

      if (createdArchives.length > 0) {
        const workArchive = createdArchives.find(a => a.archive_name === ARCHIVE_NAMES.WORK);
        if (workArchive) {
          selectArchive(workArchive);
        } else {
          selectArchive(createdArchives[0]);
        }
      }

      console.log('====== 기본 아카이브 생성 완료 ======');
    } catch (error: any) {
      console.error('기본 아카이브 생성 중 오류:', error);
      console.error('에러 상세:', error.response?.data);
    }
  };

  const selectArchive = async (archive: Archive) => {
    console.log('selectArchive 시작:', archive.archive_name, archive.archive_id);

    setCurrentArchive(archive);

    try {
      const messages = await chatService.getArchiveDetail(archive.archive_id);
      console.log('로드된 메시지 수:', messages.length);
      setMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleMenuOpen = (event: ReactMouseEvent<HTMLElement>, archive: Archive) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedArchive(archive);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRenameClick = () => {
    console.log('handleRenameClick 호출됨, selectedArchive:', selectedArchive);
    if (selectedArchive) {
      const archiveToRename = selectedArchive;
      const currentName = selectedArchive.archive_name;

      setAnchorEl(null);

      setTimeout(() => {
        setSelectedArchive(archiveToRename);
        setNewName(currentName);
        setRenameDialogOpen(true);
        console.log('이름 변경 다이얼로그 열림');
      }, 350);
    } else {
      console.warn('selectedArchive가 없습니다.');
      setAnchorEl(null);
    }
  };

  const handleRenameSubmit = async () => {
    console.log('handleRenameSubmit 호출됨, selectedArchive:', selectedArchive, 'newName:', newName);
    if (selectedArchive && newName.trim()) {
      const restrictedNames = [
        ARCHIVE_NAMES.WORK,
        ARCHIVE_NAMES.CHATBOT,
        ARCHIVE_NAMES.CODE,
        ARCHIVE_NAMES.SAP,
      ];

      if (restrictedNames.some(name => name === newName.trim())) {
        console.log('제한된 이름 사용 시도:', newName.trim());
        setSnackbar({
          open: true,
          message: `"${newName}"는 기본 아카이브 이름으로 사용할 수 없습니다.`,
          severity: 'error',
        });
        return;
      }

      try {
        const user = authService.getCurrentUser();
        console.log('현재 사용자:', user);
        if (user) {
          console.log('아카이브 이름 변경 시작:', {
            userId: user.userId,
            archiveId: selectedArchive.archive_id,
            newName: newName.trim(),
          });
          await chatService.updateArchive(user.userId, selectedArchive.archive_id, newName.trim());
          console.log('아카이브 이름 변경 API 호출 완료, 목록 새로고침');
          await loadArchives();
          setSnackbar({
            open: true,
            message: '아카이브 이름이 변경되었습니다.',
            severity: 'success',
          });
        }
      } catch (error: any) {
        console.error('아카이브 이름 변경 실패:', error);
        setSnackbar({
          open: true,
          message: error?.response?.data?.message || error?.message || '아카이브 이름 변경에 실패했습니다.',
          severity: 'error',
        });
        return;
      }

      setRenameDialogOpen(false);
      setSelectedArchive(null);
    } else {
      console.warn('selectedArchive 또는 newName이 없습니다:', { selectedArchive, newName });
    }
  };

  const handleDeleteClick = () => {
    console.log('🟣 handleDeleteClick 호출됨');
    console.log('🟣 selectedArchive:', selectedArchive);

    if (selectedArchive) {
      const isDefault = isDefaultArchive(selectedArchive);
      console.log('🟣 isDefault:', isDefault);

      setAnchorEl(null);

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (isDefault) {
            console.log('🟣 초기화 다이얼로그 열기');
            setResetDialogOpen(true);
          } else {
            console.log('🟣 삭제 다이얼로그 열기');
            deleteDialogOpenTimeRef.current = Date.now();
            setDeleteDialogOpen(true);
          }
        }, 150);
      });
    } else {
      console.log('🟣 selectedArchive 없음');
      setAnchorEl(null);
    }
  };

  const handleDeleteConfirm = async () => {
    console.log('📍 handleDeleteConfirm 함수 진입');

    if (!selectedArchive) {
      console.log('❌ selectedArchive 없음 - 함수 종료');
      return;
    }

    console.log('📍 selectedArchive:', {
      id: selectedArchive.id,
      archive_id: selectedArchive.archive_id,
      archive_name: selectedArchive.archive_name
    });

    try {
      const deletedArchiveId = selectedArchive.archive_id;
      const wasCurrentArchive = currentArchive?.archive_id === deletedArchiveId;

      console.log('🗑️ API 호출 시작 - archive_id:', deletedArchiveId);

      await chatService.deleteArchive(deletedArchiveId);

      console.log('✅ API 호출 성공!');

      console.log('🔄 아카이브 목록 새로고침 중...');
      const freshArchives = await loadArchives();
      console.log('✅ 목록 새로고침 완료, 아카이브 수:', freshArchives.length);

      if (wasCurrentArchive && freshArchives.length > 0) {
        console.log('🔄 다른 아카이브 선택 중...');

        const workArchive = freshArchives.find(a =>
          a.archive_name === '사내업무' && a.archive_type === ''
        );

        if (workArchive) {
          console.log('✅ 사내업무 아카이브 선택');
          selectArchive(workArchive);
        } else if (freshArchives.length > 0) {
          console.log('✅ 첫 번째 아카이브 선택');
          selectArchive(freshArchives[0]);
        }
      }

      setSnackbar({
        open: true,
        message: '아카이브가 삭제되었습니다.',
        severity: 'success',
      });
      console.log('✅ 삭제 완료!');

    } catch (error: any) {
      console.error('❌ 아카이브 삭제 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });

      setSnackbar({
        open: true,
        message: error?.response?.data?.message || error?.message || '아카이브 삭제에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      console.log('🔒 다이얼로그 닫기');
      setDeleteDialogOpen(false);
      setSelectedArchive(null);
    }
  };

  const handleResetConfirm = async () => {
    console.log('🔄 handleResetConfirm 호출됨');
    console.log('🔄 selectedArchive:', selectedArchive);

    if (!selectedArchive) {
      console.error('❌ selectedArchive 없음');
      return;
    }

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('❌ 사용자 정보 없음');
        setSnackbar({
          open: true,
          message: '사용자 정보를 찾을 수 없습니다.',
          severity: 'error',
        });
        return;
      }

      const archiveType = selectedArchive.archive_type || '';
      const archiveName = selectedArchive.archive_name;

      console.log('🔄 초기화 시작:', {
        userId: user.userId,
        archiveId: selectedArchive.archive_id,
        archiveType,
        archiveName,
      });

      console.log('🗑️ Step 1: 기존 아카이브 삭제 API 호출...');
      const newArchiveId = await chatService.resetArchive(
        user.userId,
        selectedArchive.archive_id,
        archiveType,
        archiveName
      );

      console.log('✅ 초기화 완료! 새 아카이브 ID:', newArchiveId);
      console.log('🔄 Step 2: 아카이브 목록 새로고침...');
      const freshArchives = await loadArchives();
      console.log('✅ 목록 새로고침 완료, 아카이브 수:', freshArchives.length);

      console.log('🔄 Step 3: 새 아카이브 선택...');
      const newArchive = freshArchives.find(a => a.archive_id === newArchiveId);
      if (newArchive) {
        console.log('✅ 새 아카이브 선택:', newArchive.archive_name);
        selectArchive(newArchive);
      } else {
        console.warn('⚠️ 새 아카이브를 찾을 수 없음:', newArchiveId);
        const sameNameArchive = freshArchives.find(a => a.archive_name === archiveName);
        if (sameNameArchive) {
          console.log('✅ 같은 이름의 아카이브 선택:', sameNameArchive.archive_name);
          selectArchive(sameNameArchive);
        }
      }

      setSnackbar({
        open: true,
        message: '대화 내용이 초기화되었습니다.',
        severity: 'success',
      });
      console.log('✅✅✅ 초기화 전체 완료!');

    } catch (error: any) {
      console.error('❌❌❌ 초기화 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });

      setSnackbar({
        open: true,
        message: error?.response?.data?.message || error?.message || '아카이브 초기화에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      console.log('🔒 초기화 다이얼로그 닫기');
      setResetDialogOpen(false);
      setSelectedArchive(null);
    }
  };

  const handleBulkDelete = async () => {
    console.log('🗑️🗑️🗑️ 커스텀 아카이브 일괄 삭제 시작');

    try {
      const customArchives = archives.filter(archive => !isDefaultArchive(archive));

      console.log(`📊 삭제 대상: ${customArchives.length}개의 커스텀 아카이브`);

      if (customArchives.length === 0) {
        setSnackbar({
          open: true,
          message: '삭제할 커스텀 아카이브가 없습니다.',
          severity: 'info',
        });
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const archive of customArchives) {
        try {
          console.log(`🗑️ 삭제 중: ${archive.archive_name} (${archive.archive_id})`);
          await chatService.deleteArchive(archive.archive_id);
          successCount++;
          console.log(`✅ 삭제 완료: ${archive.archive_name}`);
        } catch (error) {
          console.error(`❌ 삭제 실패: ${archive.archive_name}`, error);
          failCount++;
        }
      }

      console.log(`✅ 삭제 완료: ${successCount}개 성공, ${failCount}개 실패`);

      const freshArchives = await loadArchives();

      const currentStillExists = freshArchives.some(a => a.archive_id === currentArchive?.archive_id);
      if (!currentStillExists && freshArchives.length > 0) {
        const workArchive = freshArchives.find(a => a.archive_name === ARCHIVE_NAMES.WORK);
        if (workArchive) {
          selectArchive(workArchive);
        } else if (freshArchives.length > 0) {
          selectArchive(freshArchives[0]);
        }
      }

      setSnackbar({
        open: true,
        message: `${successCount}개의 아카이브가 삭제되었습니다.${failCount > 0 ? ` (${failCount}개 실패)` : ''}`,
        severity: successCount > 0 ? 'success' : 'error',
      });
      console.log('✅✅✅ 일괄 삭제 완료!');

    } catch (error: any) {
      console.error('❌❌❌ 일괄 삭제 실패:', error);
      setSnackbar({
        open: true,
        message: '아카이브 일괄 삭제에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  return {
    state: {
      archives,
      currentArchive,
      mobileMenuOpen,
      searchDialogOpen,
      helpDialogOpen,
      anchorEl,
      selectedArchive,
      renameDialogOpen,
      deleteDialogOpen,
      resetDialogOpen,
      bulkDeleteDialogOpen,
      newName,
      snackbar,
    },
    actions: {
      setArchives,
      setCurrentArchive,
      setMessages,
      setMobileMenuOpen,
      setSearchDialogOpen,
      setHelpDialogOpen,
      setAnchorEl,
      setSelectedArchive,
      setRenameDialogOpen,
      setDeleteDialogOpen,
      setResetDialogOpen,
      setBulkDeleteDialogOpen,
      setNewName,
      setSnackbar,
      loadArchives,
      selectArchive,
      handleMenuOpen,
      handleMenuClose,
      handleRenameClick,
      handleRenameSubmit,
      handleDeleteClick,
      handleDeleteConfirm,
      handleResetConfirm,
      handleBulkDelete,
    },
    shared: {
      getArchiveIcon,
      getArchiveColor,
      getArchiveTag,
      getArchiveDescription,
      isDefaultArchive,
    },
  };
};

export type ChatPageStateHook = ReturnType<typeof useChatPageState>;
