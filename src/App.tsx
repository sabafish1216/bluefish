import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Analytics } from '@vercel/analytics/react';
import NovelWorkspace from './components/NovelWorkspace';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// テーマ設定の定数
const THEME_CONFIG = {
  borderRadius: 24,
  primary: {
    light: '#2563eb',
    dark: '#60a5fa'
  },
  secondary: {
    light: '#a21caf',
    dark: '#c084fc'
  },
  background: {
    light: '#f3f4f6',
    dark: '#121212'
  },
  paper: {
    light: '#fff',
    dark: '#1e1e1e'
  }
} as const;

// テーマコンポーネント
const ThemedApp: React.FC = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { 
        main: isDarkMode ? THEME_CONFIG.primary.dark : THEME_CONFIG.primary.light,
        contrastText: isDarkMode ? '#000' : '#fff'
      },
      secondary: { 
        main: isDarkMode ? THEME_CONFIG.secondary.dark : THEME_CONFIG.secondary.light,
        contrastText: isDarkMode ? '#000' : '#fff'
      },
      background: {
        default: isDarkMode ? THEME_CONFIG.background.dark : THEME_CONFIG.background.light,
        paper: isDarkMode ? THEME_CONFIG.paper.dark : THEME_CONFIG.paper.light,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          root: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiStack: {
        styleOverrides: {
          root: {
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDarkMode ? '0 4px 8px rgba(0, 0, 0, 0.3)' : undefined,
            borderRadius: THEME_CONFIG.borderRadius,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: THEME_CONFIG.borderRadius,
          },
          outlined: {
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : undefined,
            '&:hover': {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : undefined,
            },
          },
        },
      },
    },
  }), [isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NovelWorkspace />
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemedApp />
        <Analytics />
      </PersistGate>
    </Provider>
  );
};

export default App; 