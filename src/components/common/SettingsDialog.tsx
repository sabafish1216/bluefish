import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  RadioGroup,
  Radio
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setFontSize, setWordCountDisplay, setLineNumbers } from '../../features/settings/settingsSlice';
import { toggleTheme } from '../../features/theme/themeSlice';
import { useGoogleDriveGIS } from '../../hooks/useGoogleDriveGIS';

const SettingsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const settings = useSelector((state: RootState) => state.settings);
  const theme = useSelector((state: RootState) => state.theme);
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const dispatch = useDispatch();

  // Google Drive GIS hooks
  const { signIn, listFiles, uploadFile } = useGoogleDriveGIS();
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 設定ハンドラ
  const handleFontSizeChange = (fontSize: string) => {
    dispatch(setFontSize(fontSize as 'small' | 'medium' | 'large'));
  };
  const handleWordCountDisplayChange = (checked: boolean) => {
    dispatch(setWordCountDisplay(checked));
  };
  const handleLineNumbersChange = (checked: boolean) => {
    dispatch(setLineNumbers(checked));
  };
  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  // Google Drive同期
  const handleSync = async () => {
    setError(null);
    setSyncing(true);
    setSyncDone(false);
    try {
      // 1. Google認証→認証完了後にアップロード・一覧取得
      await signIn(async () => {
        try {
          const data = {
            novels,
            folders,
            tags,
            timestamp: new Date().toISOString()
          };
          const fileName = `bluefish_data_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}.json`;
          await uploadFile(fileName, JSON.stringify(data, null, 2));
          const files = await listFiles();
          setDriveFiles(files || []);
          setSyncDone(true);
        } catch (e: any) {
          setError(e.message || '同期に失敗しました');
        } finally {
          setSyncing(false);
        }
      });
    } catch (e: any) {
      setError(e.message || '認証に失敗しました');
      setSyncing(false);
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
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={<Switch checked={settings.lineNumbers} onChange={e => handleLineNumbersChange(e.target.checked)} />}
              label="行番号表示"
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
        <Typography variant="subtitle1" gutterBottom>Google Drive連携（新方式）</Typography>
        <Box sx={{ opacity: 0.5, pointerEvents: 'none' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" onClick={handleSync} disabled={syncing}>Google認証＆同期</Button>
          </Box>
          {syncing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={20} />
              <Typography>同期中...</Typography>
            </Box>
          )}
          {syncDone && !syncing && (
            <Snackbar
              open={syncDone}
              autoHideDuration={3000}
              onClose={() => setSyncDone(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              message="同期が完了しました"
            />
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <List dense sx={{ maxHeight: 180, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            {driveFiles.map((file) => (
              <ListItem key={file.id}>
                <ListItemText primary={file.name} secondary={file.id} />
              </ListItem>
            ))}
            {driveFiles.length === 0 && <ListItem><ListItemText primary="ファイルはありません" /></ListItem>}
          </List>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Google認証後、自動で全データが同期されます。
          </Typography>
        </Box>
        <Alert severity="info" sx={{ my: 2 }}>
          Google Drive連携機能は現在未実装です。今後のアップデートをお待ちください。
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog; 