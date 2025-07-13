import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Title as TitleIcon,
  FormatSize as FormatSizeIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { Novel } from '../features/novels/novelsSlice';
import { addFolder } from '../features/folders/foldersSlice';
import { addTag } from '../features/tags/tagsSlice';
import TagSelector from './TagSelector';
import FolderSelector from './FolderSelector';
import SettingsDialog from './common/SettingsDialog';
import { useAutoSave } from '../hooks/useAutoSave';

interface MobileWritingFieldProps {
  novel: Novel;
  onSave?: (novel: Novel) => void;
  onCancel?: () => void;
  onBack: () => void;
}

const MobileWritingField: React.FC<MobileWritingFieldProps> = ({ 
  novel, 
  onSave, 
  onCancel, 
  onBack 
}) => {
  const dispatch = useDispatch();

  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const novels = useSelector((state: RootState) => state.novels.novels);
  const settings = useSelector((state: RootState) => state.settings);

  const [title, setTitle] = useState(novel.title);
  const [body, setBody] = useState(novel.body);
  const [selectedTags, setSelectedTags] = useState<string[]>(novel.tags);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(novel.folderId);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 自動保存フック
  const { isSaving, lastSaved, debouncedSave, saveImmediately } = useAutoSave({ novel, onSave });

  useEffect(() => {
    setTitle(novel.title);
    setBody(novel.body);
    setSelectedTags(novel.tags);
    setSelectedFolderId(novel.folderId);
  }, [novel]);

  // タイトル変更時の自動保存
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  }, [debouncedSave]);

  // 本文変更時の自動保存
  const handleBodyChange = useCallback((newBody: string) => {
    setBody(newBody);
    debouncedSave({ body: newBody });
  }, [debouncedSave]);

  // タグ変更時の自動保存
  const handleTagsChange = useCallback((newTagNames: string[]) => {
    const allAvailableTagNames = tags.map(t => t.name);
    const newPendingTags = newTagNames.filter(name => 
      !allAvailableTagNames.includes(name) && !pendingTags.includes(name)
    );
    const removedPendingTags = pendingTags.filter(name => 
      !newTagNames.includes(name)
    );
    setPendingTags(prev => [...prev.filter(t => !removedPendingTags.includes(t)), ...newPendingTags]);
    const existingTagIds = newTagNames
      .filter(name => allAvailableTagNames.includes(name))
      .map(name => tags.find(t => t.name === name)?.id)
      .filter(Boolean) as string[];
    setSelectedTags(existingTagIds);
    
    const newTagIds: string[] = [];
    newPendingTags.forEach(tagName => {
      const newTag = {
        id: Math.random().toString(36).slice(2),
        name: tagName.trim()
      };
      dispatch(addTag(newTag));
      newTagIds.push(newTag.id);
    });

    debouncedSave({ tags: [...existingTagIds, ...newTagIds] });
  }, [tags, pendingTags, dispatch, debouncedSave]);

  // フォルダ変更時の自動保存
  const handleFolderChange = useCallback((newFolderId: string) => {
    setSelectedFolderId(newFolderId);
    debouncedSave({ folderId: newFolderId });
  }, [debouncedSave]);



  const insertSpecialText = useCallback((text: string, selectText?: string, replaceText?: string) => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const currentText = body;
    const selectedText = currentText.substring(start, end);
    
    let finalText = text;
    if (selectedText && replaceText) {
      finalText = text.replace(replaceText, selectedText);
    }
    
    const newText = currentText.substring(0, start) + finalText + currentText.substring(end);
    setBody(newText);
    debouncedSave({ body: newText });

    setTimeout(() => {
      textArea.focus();
      
      if (selectText) {
        const selectStart = start + finalText.indexOf(selectText);
        const selectEnd = selectStart + selectText.length;
        textArea.setSelectionRange(selectStart, selectEnd);
      } else {
        const newCursorPos = start + finalText.length;
        textArea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [body, debouncedSave]);

  const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));
  const displayTagNames = [
    ...selectedTagObjects.map(t => t.name),
    ...pendingTags
  ];

  const tagCounts: { [key: string]: number } = {};
  tags.forEach(tag => {
    const count = novels.filter(novel => novel.tags.includes(tag.id)).length;
    tagCounts[tag.name] = count;
  });

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };

  if (showInfoForm) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー削除済み */}
        {/* 作品情報フォーム */}
        <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              基本情報
            </Typography>

            <TextField
              fullWidth
              label="タイトル"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              sx={{ mb: 3 }}
              required
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                フォルダ
              </Typography>
              <FolderSelector
                value={selectedFolderId}
                options={folders}
                onChange={handleFolderChange}
                onCreate={(name) => {
                  const newFolder = {
                    id: Math.random().toString(36).slice(2),
                    name: name.trim()
                  };
                  dispatch(addFolder(newFolder));
                  handleFolderChange(newFolder.id);
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                タグ
              </Typography>
              <TagSelector
                value={displayTagNames}
                options={tags.map(t => t.name)}
                tagCounts={tagCounts}
                onChange={handleTagsChange}
                onCreate={(tag) => {
                  // 新規作成はonChangeで処理される
                }}
              />
            </Box>
          </Paper>

          {/* 保存・キャンセルボタン */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CancelIcon />}
              onClick={() => setShowInfoForm(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={() => {
                saveImmediately({
                  title,
                  body,
                  tags: [...selectedTags, ...pendingTags.map(name => {
                    const existingTag = tags.find(t => t.name === name);
                    return existingTag ? existingTag.id : name;
                  })],
                  folderId: selectedFolderId
                });
                setShowInfoForm(false);
              }}
            >
              保存
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // SpeedDialのアクション定義
  const speedDialActions = [
    {
      icon: <SaveIcon />,
      name: '手動保存',
      action: () => setShowInfoForm(true)
    },
    {
      icon: <AddIcon />,
      name: 'ページ追加',
      action: () => insertSpecialText('[newpage]')
    },
    {
      icon: <TitleIcon />,
      name: '章タイトル',
      action: () => insertSpecialText('[chapter:章タイトル]', '章タイトル', '章タイトル')
    },
    {
      icon: <FormatSizeIcon />,
      name: 'ルビ',
      action: () => insertSpecialText('[[rb:漢字 > ふりがな]]', 'ふりがな', '漢字')
    }
  ];

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      position: 'fixed',
      top: 64, // ヘッダーの高さ分下げる
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* ヘッダー削除済み */}
      {/* 本文エリア */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 2, 
        overflow: 'hidden',
        height: 'calc(100vh - 64px - 32px)', // ヘッダー高さ(64px) + パディング(32px)を考慮
        maxHeight: 'calc(100vh - 64px - 32px)'
      }}>
        <Paper sx={{ 
          flexGrow: 1, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0, 
          overflow: 'hidden',
          height: '100%',
          maxHeight: '100%'
        }}>
          {/* 保存状態表示 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            {isSaving && (
              <Chip 
                label="保存中..." 
                size="small" 
                color="info" 
                variant="outlined"
              />
            )}
            {lastSaved && !isSaving && (
              <Chip 
                label={`保存済み ${lastSaved.toLocaleTimeString()}`} 
                size="small" 
                color="success" 
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ 
            position: 'relative', 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            height: settings.wordCountDisplay ? 'calc(100% - 60px)' : 'calc(100% - 40px)',
            maxHeight: settings.wordCountDisplay ? 'calc(100% - 60px)' : 'calc(100% - 40px)'
          }}>
            <textarea
              ref={textAreaRef}
              value={body}
              onChange={e => handleBodyChange(e.target.value)}
              placeholder="ここに本文を入力してください..."
              style={{
                width: '100%',
                height: '100%',
                minHeight: 0,
                maxHeight: '100%',
                resize: 'none',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: getFontSize(),
                lineHeight: 1.6,
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 12,
                boxSizing: 'border-box',
                background: 'inherit',
                color: 'inherit',
                outline: 'none',
                flex: 1,
                display: 'block',
              }}
            />
          </Box>

          {/* 文字数表示 */}
          {settings.wordCountDisplay && (
            <Typography
              variant="caption"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mt: 1,
                fontSize: '0.75rem',
                flexShrink: 0,
                height: 20,
                minHeight: 20,
                maxHeight: 20,
              }}
            >
              {body.length.toLocaleString()} / 300,000
            </Typography>
          )}
        </Paper>
      </Box>

      {/* SpeedDial ボタンパレット */}
      <SpeedDial
        ariaLabel="アクションメニュー"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          '& .MuiFab-root': {
            borderRadius: '50%',
            width: 56,
            height: 56,
          },
          '& .MuiSpeedDialAction-fab': {
            borderRadius: '50%',
            width: 40,
            height: 40,
          }
        }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setSpeedDialOpen(false);
            }}
          />
        ))}
      </SpeedDial>

      {/* 設定ダイアログ */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Box>
  );
};

export default MobileWritingField; 