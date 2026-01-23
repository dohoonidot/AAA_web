import { useTheme, useMediaQuery } from '@mui/material';

export const useLeaveSidebarState = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return {
    state: {
      isMobile,
    },
  };
};

export type LeaveSidebarStateHook = ReturnType<typeof useLeaveSidebarState>;
