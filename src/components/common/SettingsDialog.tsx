import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Box,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setFontSize, setWordCountDisplay } from '../../features/settings/settingsSlice';
import { toggleTheme } from '../../features/theme/themeSlice';
import { clearNovels } from '../../features/novels/novelsSlice';
import { clearFolders } from '../../features/folders/foldersSlice';
import { clearTags } from '../../features/tags/tagsSlice';
import { clearSettings } from '../../features/settings/settingsSlice';
import { resetSyncState } from '../../features/googleDriveSync/googleDriveSyncSlice';
// import { useGoogleDriveSync } from '../../hooks/useGoogleDriveSync';

const SettingsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const theme = useSelector((state: RootState) => state.theme);
  // const { syncStatus, signInToDrive, manualSync } = useGoogleDriveSync();

  const handleFontSizeChange = (fontSize: string) => {
    dispatch(setFontSize(fontSize as 'small' | 'medium' | 'large'));
  };

  const handleWordCountDisplayChange = (checked: boolean) => {
    dispatch(setWordCountDisplay(checked));
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleResetAllData = () => {
    if (window.confirm('すべてのデータをリセットしますか？この操作は取り消せません。')) {
      dispatch(clearNovels());
      dispatch(clearFolders());
      dispatch(clearTags());
      dispatch(clearSettings());
      dispatch(resetSyncState());
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // const handleGoogleDriveSignIn = async () => {
  //   try {
  //     await signInToDrive();
  //   } catch (error) {
  //     console.error('Google Driveサインインエラー:', error);
  //   }
  // };

  // const handleManualSync = async () => {
  //   try {
  //     await manualSync();
  //   } catch (error) {
  //     console.error('手動同期エラー:', error);
  //   }
  // };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { minHeight: '60vh', maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">設定</Typography>
        </Box>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500] }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {/* 表示・テーマ設定 */}
        <Typography variant="subtitle1" gutterBottom>表示設定</Typography>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>フォントサイズ</Typography>
          <RadioGroup
            row
            value={settings.fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
          >
            <FormControlLabel value="small" control={<Radio />} label="小（14px）" />
            <FormControlLabel value="medium" control={<Radio />} label="中（16px）" />
            <FormControlLabel value="large" control={<Radio />} label="大（20px）" />
          </RadioGroup>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
            <FormControlLabel
              control={<Switch checked={settings.wordCountDisplay} onChange={e => handleWordCountDisplayChange(e.target.checked)} />}
              label="文字数表示"
            />
          </Box>
        </FormControl>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>テーマ</Typography>
        <FormControlLabel
          control={<Switch checked={theme.isDarkMode} onChange={handleThemeToggle} />}
          label="ダークモード"
          sx={{ mb: 2 }}
        />
        <Divider sx={{ my: 2 }} />
        {/* Google Drive連携 - 一時的に無効化 */}
        <Typography variant="subtitle1" gutterBottom>Google Drive連携</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Google Drive同期機能は現在メンテナンス中です。
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        {/* データリセット */}
        <Typography variant="subtitle1" gutterBottom>データ管理</Typography>
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleResetAllData}
            sx={{ mb: 2 }}
          >
            すべてのデータをリセット
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            小説、フォルダ、タグ、設定、Google Drive同期状態をすべてリセットします。
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog; 