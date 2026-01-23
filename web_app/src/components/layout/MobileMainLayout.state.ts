import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import {
  Assignment as AssignmentIcon,
  BeachAccess as BeachAccessIcon,
  CardGiftcard as GiftIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import type { ElementType } from 'react';

export const useMobileMainLayoutState = ({ isMobile }: { isMobile: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const user = authService.getCurrentUser();
  const drawerRef = useRef<HTMLDivElement>(null);

  const isApprover = user?.isApprover || false;
  const workMenuItems: Array<{ text: string; path: string; icon: ElementType }> = [
    { text: '전자결재', path: '/approval', icon: AssignmentIcon },
    { text: '휴가관리', path: isApprover ? '/admin-leave' : '/leave', icon: BeachAccessIcon },
    { text: '받은선물함', path: '/gift', icon: GiftIcon },
    { text: '공모전', path: '/contest', icon: EmojiEventsIcon },
  ];

  useEffect(() => {
    if (mobileOpen && isMobile) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            const target = mutation.target as HTMLElement;
            if (target.id === 'root' || target.closest('#root')) {
              const rootElement = document.getElementById('root');
              if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
                rootElement.removeAttribute('aria-hidden');
              }
            }
          }
        });
      });

      const rootElement = document.getElementById('root');
      if (rootElement) {
        observer.observe(rootElement, {
          attributes: true,
          attributeFilter: ['aria-hidden'],
          subtree: true,
        });

        if (rootElement.getAttribute('aria-hidden') === 'true') {
          rootElement.removeAttribute('aria-hidden');
        }
      }

      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement !== document.body) {
        if (!activeElement.closest('header') && !activeElement.closest('[role="banner"]')) {
          activeElement.blur();
        }
      }

      const mainContent = document.querySelector('main');
      if (mainContent) {
        const focusableElements = mainContent.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusableElements.forEach(element => {
          (element as HTMLElement).blur();
        });
      }

      const intervalId = setInterval(() => {
        const rootElement = document.getElementById('root');
        if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
          rootElement.removeAttribute('aria-hidden');
        }
      }, 50);

      if (drawerRef.current) {
        const firstFocusableElement = drawerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (firstFocusableElement) {
          setTimeout(() => {
            firstFocusableElement.focus();
          }, 200);
        }
      }

      return () => {
        observer.disconnect();
        clearInterval(intervalId);
      };
    } else {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
        rootElement.removeAttribute('aria-hidden');
      }
    }
  }, [mobileOpen, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return {
    state: {
      mobileOpen,
      helpDialogOpen,
      user,
      isApprover,
      location,
      drawerRef,
      workMenuItems,
    },
    actions: {
      setMobileOpen,
      setHelpDialogOpen,
      handleDrawerToggle,
      handleDrawerClose,
      handleMenuClick,
      handleLogout,
    },
  };
};

export type MobileMainLayoutStateHook = ReturnType<typeof useMobileMainLayoutState>;
