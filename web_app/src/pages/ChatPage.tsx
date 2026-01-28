import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Button,
  Avatar,
} from '@mui/material';
import {
  Lock as LockIcon,
  Code as CodeIcon,
  Business as BusinessIcon,
  AutoAwesome as AutoAwesomeIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  BeachAccess as BeachAccessIcon,
  // EmojiEvents as EmojiEventsIcon,
  Menu as MenuIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ARCHIVE_NAMES, getArchiveIcon, getArchiveColor, getArchiveTag, getArchiveDescription } from '../store/chatStore';
import { useThemeStore } from '../store/themeStore';
import authService from '../services/authService';
import chatService from '../services/chatService';
import ChatArea from '../components/chat/ChatArea';
import { NotificationBell } from '../components/common/NotificationBell';
import { GiftButton } from '../components/common/GiftBox';
import { MobileOnly, DesktopOnly } from '../components/common/Responsive';
import type { Archive } from '../types';
import { useElectronicApprovalStore } from '../store/electronicApprovalStore';
import ChatPageModals from './ChatPage.modals';
import { useChatPageState } from './ChatPage.state';

const SIDEBAR_WIDTH = 280; // 230 + 20px

export default function ChatPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px = 모바일
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme.name === 'Dark';
  const { openPanel: openElectronicApproval } = useElectronicApprovalStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { state, actions } = useChatPageState();
  const {
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
  } = state;
  const {
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
  } = actions;


  // 아이콘 가져오기 - Flutter 스타일 (18px)
  const getIcon = (archive: Archive) => {
    const iconName = getArchiveIcon(archive);
    const color = getArchiveColor(archive, false);

    const iconProps = { sx: { color, fontSize: 18, opacity: 0.7 } }; // Flutter: 18px with opacity

    switch (iconName) {
      case 'code':
        return <CodeIcon {...iconProps} />;
      case 'business':
        return <BusinessIcon {...iconProps} />;
      case 'auto_awesome':
        return <AutoAwesomeIcon {...iconProps} />;
      case 'lock':
        return <LockIcon {...iconProps} />;
      default:
        return <ChatIcon {...iconProps} />;
    }
  };

  // 현재 사용자 정보
  const currentUser = authService.getCurrentUser();

  // 사이드바 콘텐츠 (Desktop/Mobile 공통) - MobileMainLayout 스타일로 통일
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 사용자 정보 헤더 - MobileMainLayout 스타일 */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(180deg, ${colorScheme.sidebarGradientStart}, ${colorScheme.sidebarGradientEnd})`,
          color: colorScheme.sidebarTextColor,
          borderBottom: `1px solid ${colorScheme.textFieldBorderColor}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{
            bgcolor: isDark ? 'rgba(79, 195, 247, 0.2)' : '#e3f2fd',
            color: colorScheme.primaryColor,
            width: 40,
            height: 40
          }}>
            <ChatIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 'bold',
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {currentUser?.userId || '사용자'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
              ASPN AI Agent
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Chip
            label="모바일 웹 버전"
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(79, 195, 247, 0.2)' : '#e3f2fd',
              color: colorScheme.primaryColor,
              fontSize: '0.75rem',
              height: 22
            }}
          />
          {/* 검색 버튼 */}
          <Tooltip title="대화 내용 검색" placement="right">
            <IconButton
              onClick={() => {
                setSearchDialogOpen(true);
                if (isMobile) setMobileMenuOpen(false);
              }}
              size="small"
              sx={{
                color: colorScheme.primaryColor,
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'transparent',
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          {/* 새 채팅방 버튼 */}
          <Tooltip title="새 채팅방 만들기" placement="right">
            <IconButton
              onClick={async () => {
                try {
                  const currentUser = authService.getCurrentUser();
                  if (currentUser) {
                    console.log('➕ 새 아카이브 생성 시작');

                    // 기존 아카이브 중 "새 대화 N" 형식의 최대 번호 찾기
                    const newChatNumbers = archives
                      .map(a => {
                        const match = a.archive_name.match(/^새 대화 (\d+)$/);
                        return match ? parseInt(match[1], 10) : 0;
                      })
                      .filter(n => n > 0);

                    const nextNumber = newChatNumbers.length > 0 ? Math.max(...newChatNumbers) + 1 : 1;
                    const newArchiveName = `새 대화 ${nextNumber}`;

                    console.log('📝 새 아카이브 이름:', newArchiveName);

                    const response = await chatService.createArchive(currentUser.userId, '', '');
                    console.log('✅ 새 아카이브 생성 완료:', response.archive.archive_id);

                    // 이름 변경
                    await chatService.updateArchive(currentUser.userId, response.archive.archive_id, newArchiveName);
                    console.log('✅ 이름 변경 완료:', newArchiveName);

                    const freshArchives = await loadArchives();
                    const newArchive = freshArchives.find(a => a.archive_id === response.archive.archive_id);

                    if (newArchive) {
                      console.log('✅ 새 아카이브 선택:', newArchive.archive_name);
                      selectArchive(newArchive);
                    } else {
                      console.warn('⚠️ 생성된 아카이브를 찾을 수 없음');
                    }

                    if (isMobile) setMobileMenuOpen(false);
                  }
                } catch (error) {
                  console.error('새 채팅방 생성 실패:', error);
                  alert('새 채팅방 생성에 실패했습니다.');
                }
              }}
              size="small"
              sx={{
                color: colorScheme.primaryColor,
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'transparent',
                },
              }}
            >
              <AddIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
          {/* 일괄 삭제 버튼 */}
          <Tooltip title="커스텀 아카이브 일괄 삭제" placement="right">
            <IconButton
              onClick={() => {
                setBulkDeleteDialogOpen(true);
                if (isMobile) setMobileMenuOpen(false);
              }}
              size="small"
              sx={{
                color: isDark ? '#ff6b6b' : '#d32f2f',
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'transparent',
                },
              }}
            >
              <DeleteSweepIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ borderColor: colorScheme.textFieldBorderColor }} />

      {/* 채팅방 목록 */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1, minHeight: 0 }}>
        <List sx={{ py: 0.5 }}>
          {archives.map((archive) => {
            const isSelected = currentArchive?.archive_id === archive.archive_id;
            const color = getArchiveColor(archive, isDark);
            const tag = getArchiveTag(archive);
            const description = getArchiveDescription(archive);

            return (
              <Box key={archive.archive_id}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    selectArchive(archive);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  component="div"
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    color: colorScheme.sidebarTextColor,
                    pr: 6,
                    '&.Mui-selected': {
                      bgcolor: isDark ? 'rgba(79, 195, 247, 0.15)' : '#e3f2fd',
                      color: colorScheme.primaryColor,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(79, 195, 247, 0.25)' : '#bbdefb',
                      },
                      '& .MuiListItemIcon-root': {
                        color: colorScheme.primaryColor,
                      },
                    },
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
                      '& .menu-icon-button': {
                        opacity: 1,
                        visibility: 'visible',
                      },
                    },
                    '& .menu-icon-button': {
                      opacity: 0,
                      visibility: 'hidden',
                      transition: 'opacity 0.2s ease, visibility 0.2s ease',
                    },
                    '&.Mui-selected .menu-icon-button': {
                      opacity: 1,
                      visibility: 'visible',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getIcon(archive)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: '0.875rem',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {archive.archive_name}
                        </Typography>
                        {tag && (
                          <Chip
                            label={tag}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 'bold',
                              bgcolor: `${color}33`,
                              color: color,
                              borderRadius: '4px',
                              '& .MuiChip-label': {
                                px: 0.75,
                                py: 0.25,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                  />

                  <IconButton
                    className="menu-icon-button"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, archive);
                    }}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: colorScheme.hintTextColor,
                    }}
                    id={`archive-menu-button-${archive.archive_id}`}
                    aria-label="아카이브 메뉴"
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>

                {/* 설명 표시 */}
                {description && (
                  <Box sx={{ px: 2, pb: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colorScheme.hintTextColor,
                        fontSize: '0.7rem',
                        lineHeight: 1.3,
                        display: 'block',
                      }}
                    >
                      {description}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* 하단 고정 영역 (업무 메뉴 + 하단 메뉴) */}
      <Box sx={{ flexShrink: 0 }}>
        <Divider sx={{ mx: 2, borderColor: colorScheme.textFieldBorderColor }} />

        {/* 업무 메뉴 섹션 - MobileMainLayout 스타일 */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ color: colorScheme.hintTextColor, fontWeight: 600 }}>
            업무
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {/* 전자결재 메뉴 (임시 숨김) */}
          {/* <ListItemButton
            onClick={() => {
              navigate('/approval');
              if (isMobile) setMobileMenuOpen(false);
            }}
            selected={location.pathname === '/approval'}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: colorScheme.sidebarTextColor,
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : '#e3f2fd',
                color: colorScheme.primaryColor,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(79, 195, 247, 0.25)' : '#bbdefb',
                },
                '& .MuiListItemIcon-root': {
                  color: colorScheme.primaryColor,
                },
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/approval' ? colorScheme.primaryColor : colorScheme.hintTextColor }}>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText
              primary="전자결재"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === '/approval' ? 600 : 400,
              }}
            />
          </ListItemButton> */}

          {/* 휴가관리 */}
          <ListItemButton
            onClick={() => {
              navigate('/leave');
              if (isMobile) setMobileMenuOpen(false);
            }}
            selected={location.pathname === '/leave'}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: colorScheme.sidebarTextColor,
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : '#e3f2fd',
                color: colorScheme.primaryColor,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(79, 195, 247, 0.25)' : '#bbdefb',
                },
                '& .MuiListItemIcon-root': {
                  color: colorScheme.primaryColor,
                },
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/leave' ? colorScheme.primaryColor : colorScheme.hintTextColor }}>
              <BeachAccessIcon />
            </ListItemIcon>
            <ListItemText
              primary="휴가 관리"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === '/leave' ? 600 : 400,
              }}
            />
          </ListItemButton>

        </List>

        <Divider sx={{ mx: 2, borderColor: colorScheme.textFieldBorderColor }} />

        {/* 하단 메뉴 - MobileMainLayout 스타일 */}
        <List sx={{ px: 1 }}>
          <ListItemButton
            onClick={() => {
              navigate('/settings');
              if (isMobile) setMobileMenuOpen(false);
            }}
            selected={location.pathname === '/settings'}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: colorScheme.sidebarTextColor,
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : '#e3f2fd',
                color: colorScheme.primaryColor,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(79, 195, 247, 0.25)' : '#bbdefb',
                },
                '& .MuiListItemIcon-root': {
                  color: colorScheme.primaryColor,
                },
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/settings' ? colorScheme.primaryColor : colorScheme.hintTextColor }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="설정"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === '/settings' ? 600 : 400,
              }}
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => {
              setHelpDialogOpen(true);
              if (isMobile) setMobileMenuOpen(false);
            }}
            selected={helpDialogOpen}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: colorScheme.sidebarTextColor,
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : '#e3f2fd',
                color: colorScheme.primaryColor,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(79, 195, 247, 0.25)' : '#bbdefb',
                },
                '& .MuiListItemIcon-root': {
                  color: colorScheme.primaryColor,
                },
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              },
            }}
          >
            <ListItemIcon sx={{ color: helpDialogOpen ? colorScheme.primaryColor : colorScheme.hintTextColor }}>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText
              primary="도움말"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: helpDialogOpen ? 600 : 400,
              }}
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => {
              authService.logout();
              if (isMobile) setMobileMenuOpen(false);
            }}
            sx={{
              borderRadius: 2,
              color: isDark ? '#ff6b6b' : '#d32f2f',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 107, 107, 0.1)' : '#ffebee',
                color: isDark ? '#ff8787' : '#b71c1c',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="로그아웃"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>

          {/* 사내AI 공모전 메뉴 (임시 숨김) */}
          {/* <ListItemButton
            onClick={() => {
              navigate('/contest');
              if (isMobile) setMobileMenuOpen(false);
            }}
            selected={location.pathname === '/contest'}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: colorScheme.sidebarTextColor,
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : '#e3f2fd',
                color: colorScheme.primaryColor,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(79, 195, 247, 0.25)' : '#bbdefb',
                },
                '& .MuiListItemIcon-root': {
                  color: colorScheme.primaryColor,
                },
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/contest' ? colorScheme.primaryColor : colorScheme.hintTextColor }}>
              <EmojiEventsIcon />
            </ListItemIcon>
            <ListItemText
              primary="사내AI 공모전"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === '/contest' ? 600 : 400,
              }}
            />
          </ListItemButton> */}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100vh',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* 모바일 상단 헤더 (모바일에서만 표시) */}
      <MobileOnly>
        <AppBar
          position="static"
          sx={{
            background: `linear-gradient(90deg, ${colorScheme.appBarGradientStart}, ${colorScheme.appBarGradientEnd})`,
            flexShrink: 0,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            // Safe Area handling for top
            pt: 'var(--sat)',
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: { xs: 48 } }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2, color: colorScheme.appBarTextColor }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1rem', color: colorScheme.appBarTextColor }}>
              {currentArchive?.archive_name || 'ASPN AI Agent'}
            </Typography>
            <GiftButton />
            <IconButton
              color="inherit"
              onClick={() => openElectronicApproval()}
              sx={{ color: colorScheme.appBarTextColor }}
            >
              <DescriptionIcon />
            </IconButton>
            {currentUser && <NotificationBell userId={currentUser!.userId} />}
          </Toolbar>
        </AppBar>
      </MobileOnly>

      {/* 데스크톱 상단 버튼들 (우측 상단 고정) */}
      <DesktopOnly>
        <Box
          sx={{
            position: 'fixed',
            top: 12,
            right: 16,
            zIndex: (theme) => theme.zIndex.drawer + 2,
            display: 'flex',
            gap: 1,
          }}
        >
          <GiftButton />
          <IconButton
            color="inherit"
            onClick={() => openElectronicApproval()}
            sx={{ color: colorScheme.textColor }}
          >
            <DescriptionIcon />
          </IconButton>
          {currentUser && <NotificationBell userId={currentUser.userId} />}
        </Box>
      </DesktopOnly>

      {/* 메인 콘텐츠 영역 (사이드바 + 채팅 영역) */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          width: '100%',
          height: {
            xs: 'calc(100vh - 48px - var(--sat))', // 모바일: AppBar 및 Safe Area 제외
            md: '100vh', // 데스크톱: 전체 높이
          },
        }}
      >
        {/* 사이드바 - Desktop: permanent, Mobile: temporary - Flutter 스타일 */}
        <MobileOnly>
          <Drawer
            variant="temporary"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            ModalProps={{
              keepMounted: true, // 모바일에서 성능 향상
              disableAutoFocus: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: SIDEBAR_WIDTH,
                boxSizing: 'border-box',
                bgcolor: colorScheme.sidebarBackgroundColor,
                borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                // Safe area padding for the drawer content if needed
                pl: 'var(--sal)',
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        </MobileOnly>

        <DesktopOnly>
          <Drawer
            variant="permanent"
            open={true}
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: SIDEBAR_WIDTH,
                boxSizing: 'border-box',
                bgcolor: colorScheme.sidebarBackgroundColor,
                borderRight: `1px solid ${colorScheme.textFieldBorderColor}`,
                position: 'relative',
                height: '100vh',
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        </DesktopOnly>

        {/* 메인 채팅 영역 */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: {
              xs: '100%', // 모바일: 전체 너비
              md: `calc(100% - ${SIDEBAR_WIDTH}px)`, // 데스크톱: 사이드바 제외
            },
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatArea />
        </Box>
      </Box>

      <ChatPageModals
        searchDialogOpen={searchDialogOpen}
        setSearchDialogOpen={setSearchDialogOpen}
        helpDialogOpen={helpDialogOpen}
        setHelpDialogOpen={setHelpDialogOpen}
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        selectedArchive={selectedArchive}
        setSelectedArchive={setSelectedArchive}
        handleRenameClick={handleRenameClick}
        handleDeleteClick={handleDeleteClick}
        renameDialogOpen={renameDialogOpen}
        setRenameDialogOpen={setRenameDialogOpen}
        newName={newName}
        setNewName={setNewName}
        handleRenameSubmit={handleRenameSubmit}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDeleteConfirm={handleDeleteConfirm}
        resetDialogOpen={resetDialogOpen}
        setResetDialogOpen={setResetDialogOpen}
        handleResetConfirm={handleResetConfirm}
        bulkDeleteDialogOpen={bulkDeleteDialogOpen}
        setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
        handleBulkDelete={handleBulkDelete}
        archives={archives}
        selectArchive={selectArchive}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
      />

    </Box>
  );
}
