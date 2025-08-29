import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  RadioGroup,
  Radio
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
import { useGoogleDriveSync } from '../../hooks/useGoogleDriveSync';

const SettingsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const theme = useSelector((state: RootState) => state.theme);
  const { syncStatus, signInToDrive, manualSync, getRateLimitInfo, deleteGoogleDriveData } = useGoogleDriveSync();
  const [rateLimitInfo, setRateLimitInfo] = useState<{ current: number; daily: number; timeUntilReset: number } | null>(null);

  // デバッグ用: 同期状態のログ
  console.log('SettingsDialog - syncStatus:', {
    isSyncing: syncStatus.isSyncing,
    isSignedIn: syncStatus.isSignedIn,
    lastSyncTime: syncStatus.lastSyncTime,
    error: syncStatus.error
  });

  // API制限情報を定期的に更新
  useEffect(() => {
    if (syncStatus.isSignedIn) {
      const updateRateLimitInfo = () => {
        try {
          const info = getRateLimitInfo();
          setRateLimitInfo(info);
        } catch (error) {
          console.error('API制限情報取得エラー:', error);
        }
      };

      updateRateLimitInfo();
      const interval = setInterval(updateRateLimitInfo, 10000); // 10秒ごとに更新

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus.isSignedIn]); // getRateLimitInfoを依存配列から削除

  const handleFontSizeChange = (fontSize: string) => {
    dispatch(setFontSize(fontSize as 'small' | 'medium' | 'large'));
  };

  const handleWordCountDisplayChange = (checked: boolean) => {
    dispatch(setWordCountDisplay(checked));
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleResetAllData = async () => {
    if (window.confirm('すべてのデータをリセットしますか？この操作は取り消せません。\n\nローカルデータとGoogle Driveのデータの両方が削除されます。')) {
      try {
        // Google Driveデータを削除（サインインしている場合）
        if (syncStatus.isSignedIn) {
          console.log('Google Driveデータ削除開始');
          await deleteGoogleDriveData();
          console.log('Google Driveデータ削除完了');
        }
        
        // ローカルデータを削除
        dispatch(clearNovels());
        dispatch(clearFolders());
        dispatch(clearTags());
        dispatch(clearSettings());
        dispatch(resetSyncState());
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('すべてのデータリセット完了');
        window.location.reload();
      } catch (error) {
        console.error('データリセットエラー:', error);
        alert('データリセット中にエラーが発生しました。');
      }
    }
  };

  const handleGoogleDriveSignIn = async () => {
    try {
      await signInToDrive();
    } catch (error) {
      console.error('Google Driveサインインエラー:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      console.log('手動同期ボタンクリック - 同期開始');
      await manualSync();
      console.log('手動同期ボタンクリック - 同期完了');
    } catch (error) {
      console.error('手動同期エラー:', error);
    }
  };

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
        {/* Google Drive連携 */}
        {/* <Typography variant="subtitle1" gutterBottom>Google Drive連携</Typography>
        <Box sx={{ mb: 2 }}>
          {!syncStatus.isSignedIn ? (
            <Button 
              variant="contained" 
              onClick={handleGoogleDriveSignIn}
              disabled={syncStatus.isSyncing}
              sx={{ mb: 2 }}
            >
              {syncStatus.isSyncing ? '認証中...' : 'Google Driveにサインイン'}
            </Button>
          ) : (
            <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handleManualSync}
              disabled={syncStatus.isSyncing}
              startIcon={syncStatus.isSyncing ? <CircularProgress size={16} /> : null}
              sx={{ minWidth: 120 }}
            >
              {syncStatus.isSyncing ? '同期中...' : '手動同期'}
            </Button>
            {syncStatus.isSyncing && (
              <CircularProgress size={20} />
            )}
          </Box>
              {syncStatus.lastSyncTime && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  最終同期: {new Date(syncStatus.lastSyncTime).toLocaleString('ja-JP')}
                </Typography>
              )}
              {syncStatus.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {syncStatus.error}
                </Alert>
              )}
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Google Driveにサインインすると、アプリ起動時に自動同期されます。
            手動同期ボタンでいつでも同期できます。複数端末でデータを共有できます。
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            ※ 初回サインイン時は認証ウィンドウが開きます。ブラウザのポップアップを許可してください。
          </Typography>
        </Box> */}
        <Divider sx={{ my: 2 }} />
        {/* API制限情報 */}
        {/* <Typography variant="subtitle1" gutterBottom>API制限情報</Typography>
        {rateLimitInfo ? (
          <List>
            <ListItem>
              <ListItemText primary="現在のリクエスト数" secondary={rateLimitInfo.current} />
            </ListItem>
            <ListItem>
              <ListItemText primary="1日のリクエスト制限" secondary={rateLimitInfo.daily} />
            </ListItem>
            <ListItem>
              <ListItemText primary="リセットまでの時間" secondary={`${Math.ceil(rateLimitInfo.timeUntilReset / 60)}分`} />
            </ListItem>
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            リクエスト制限情報は利用可能です。
          </Typography>
        )} */}
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
            小説、フォルダ、タグ、設定をすべてリセットします。
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog; 