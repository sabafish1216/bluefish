import React from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  CloudSync as CloudSyncIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setError } from '../features/googleDriveSync/googleDriveSyncSlice';

interface GoogleDriveSyncButtonProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
}

export const GoogleDriveSyncButton: React.FC<GoogleDriveSyncButtonProps> = ({
  variant = 'icon',
  size = 'medium',
  showStatus = true,
}) => {
  const {
    signInToDrive,
    manualSync,
  } = useGoogleDriveSync();

  // Reduxの同期状況を取得
  const syncStatus = useSelector((state: RootState) => state.googleDriveSync);
  const dispatch = useDispatch();

  const handleSync = async () => {
    if (!syncStatus.isSignedIn) {
      await signInToDrive();
    } else {
      await manualSync();
    }
  };

  const getSyncIcon = () => {
    if (syncStatus.isSyncing) {
      return <CircularProgress size={20} />;
    }
    
    if (!syncStatus.isSignedIn) {
      return <CloudOffIcon />;
    }
    
    return <CloudSyncIcon />;
  };

  const getSyncTooltip = () => {
    if (syncStatus.isSyncing) {
      return '同期中...';
    }
    
    if (!syncStatus.isSignedIn) {
      return 'Google Driveにサインイン';
    }
    
    if (syncStatus.lastSyncTime) {
      return `最後の同期: ${new Date(syncStatus.lastSyncTime).toLocaleString()}`;
    }
    
    return '手動同期';
  };

  const getSyncButtonText = () => {
    if (syncStatus.isSyncing) {
      return '同期中...';
    }
    
    if (!syncStatus.isSignedIn) {
      return 'Google Drive連携';
    }
    
    return '同期';
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={getSyncTooltip()}>
          <IconButton
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            size={size}
            color={syncStatus.isSignedIn ? 'primary' : 'inherit'}
          >
            {getSyncIcon()}
          </IconButton>
        </Tooltip>
        
        {showStatus && syncStatus.error && (
          <Snackbar
            open={!!syncStatus.error}
            autoHideDuration={6000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            onClose={() => dispatch(setError(''))}
          >
            <Alert severity="error" onClose={() => dispatch(setError(''))}>
              {syncStatus.error}
            </Alert>
          </Snackbar>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={getSyncIcon()}
        onClick={handleSync}
        disabled={syncStatus.isSyncing}
        size={size}
        color={syncStatus.isSignedIn ? 'primary' : 'inherit'}
      >
        {getSyncButtonText()}
      </Button>
      
      {showStatus && syncStatus.error && (
        <Snackbar
          open={!!syncStatus.error}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={() => dispatch(setError(''))}
        >
          <Alert severity="error" onClose={() => dispatch(setError(''))}>
            {syncStatus.error}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}; 