import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  Divider,
  Stack
} from '@mui/material';
import {
  Settings as SettingsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  TextFields as TextFieldsIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { toggleTheme } from '../../features/theme/themeSlice';
import {
  setFontSize,
  setWordCountDisplay,
  setLineNumbers,
  FontSize
} from '../../features/settings/settingsSlice';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const settings = useSelector((state: RootState) => state.settings);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    dispatch(setFontSize(fontSize));
  };

  const handleWordCountDisplayChange = (checked: boolean) => {
    dispatch(setWordCountDisplay(checked));
  };

  const handleLineNumbersChange = (checked: boolean) => {
    dispatch(setLineNumbers(checked));
  };

  const getFontSizeLabel = (size: FontSize) => {
    switch (size) {
      case 'small': return '小';
      case 'medium': return '中';
      case 'large': return '大';
      default: return '中';
    }
  };

  const getFontSizeValue = (size: FontSize) => {
    switch (size) {
      case 'small': return 14;
      case 'medium': return 16;
      case 'large': return 18;
      default: return 16;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        設定
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* テーマ設定 */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
              テーマ
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={handleThemeToggle}
                  color="primary"
                />
              }
              label={isDarkMode ? "ダークモード" : "ライトモード"}
            />
          </Box>

          <Divider />

          {/* フォントサイズ設定 */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TextFieldsIcon />
              本文フォントサイズ
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={settings.fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value as FontSize)}
                row
              >
                {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                  <FormControlLabel
                    key={size}
                    value={size}
                    control={<Radio />}
                    label={`${getFontSizeLabel(size)} (${getFontSizeValue(size)}px)`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider />

          {/* 表示設定 */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VisibilityIcon />
              表示設定
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.wordCountDisplay}
                    onChange={(e) => handleWordCountDisplayChange(e.target.checked)}
                    color="primary"
                  />
                }
                label="文字数表示"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.lineNumbers}
                    onChange={(e) => handleLineNumbersChange(e.target.checked)}
                    color="primary"
                  />
                }
                label="行番号表示"
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 