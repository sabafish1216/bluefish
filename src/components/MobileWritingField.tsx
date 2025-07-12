import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { Novel, updateNovel } from '../features/novels/novelsSlice';
import { addFolder } from '../features/folders/foldersSlice';
import { addTag, deleteTag } from '../features/tags/tagsSlice';
import TagSelector from './TagSelector';
import FolderSelector from './FolderSelector';
import SettingsDialog from './common/SettingsDialog';

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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(novel.title);
    setBody(novel.body);
    setSelectedTags(novel.tags);
    setSelectedFolderId(novel.folderId);
  }, [novel]);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    const newTagIds: string[] = [];
    pendingTags.forEach(tagName => {
      const newTag = {
        id: Math.random().toString(36).slice(2),
        name: tagName.trim()
      };
      dispatch(addTag(newTag));
      newTagIds.push(newTag.id);
    });

    const updatedNovel = {
      ...novel,
      title: title.trim(),
      body,
      tags: [...selectedTags, ...newTagIds],
      folderId: selectedFolderId,
      updatedAt: new Date().toISOString()
    };
    
    if (onSave) {
      onSave(updatedNovel);
    } else {
      dispatch(updateNovel(updatedNovel));
    }
    
    setPendingTags([]);

    setTimeout(() => {
      const updatedNovels = novels.map(n => n.id === novel.id ? updatedNovel : n);
      const tagsToDelete = tags.filter(tag => {
        const count = updatedNovels.filter(novel => novel.tags.includes(tag.id)).length;
        return count === 0;
      });
      
      tagsToDelete.forEach(tag => {
        dispatch(deleteTag(tag.id));
      });
    }, 0);
  }, [title, body, selectedTags, selectedFolderId, pendingTags, novel, onSave, dispatch, novels, tags]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      setTitle(novel.title);
      setBody(novel.body);
      setSelectedTags(novel.tags);
      setSelectedFolderId(novel.folderId);
    }
    setPendingTags([]);
  }, [onCancel, novel]);

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
  }, [body]);

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

  const generateLineNumbers = () => {
    if (!settings.lineNumbers) return null;
    const lines = body.split('\n');
    return (
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 30,
          backgroundColor: 'grey.100',
          borderRight: '1px solid #ccc',
          overflow: 'hidden',
          fontFamily: 'monospace',
          fontSize: getFontSize() - 2,
          color: 'text.secondary',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          padding: '12px 4px',
          boxSizing: 'border-box',
          lineHeight: 1.6,
        }}
      >
        {lines.map((_, index) => (
          <Box key={index} sx={{ height: '1.6em' }}>
            {index + 1}
          </Box>
        ))}
      </Box>
    );
  };

  if (showInfoForm) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setShowInfoForm(false)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
              作品情報
            </Typography>
          </Toolbar>
        </AppBar>

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
              onChange={(e) => setTitle(e.target.value)}
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
                onChange={setSelectedFolderId}
                onCreate={(name) => {
                  const newFolder = {
                    id: Math.random().toString(36).slice(2),
                    name: name.trim()
                  };
                  dispatch(addFolder(newFolder));
                  setSelectedFolderId(newFolder.id);
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
                onChange={(newTagNames) => {
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
                }}
                onCreate={(tag) => {
                  // 新規作成はonChangeで処理される
                }}
              />
            </Box>
          </Paper>

          {/* 保存・キャンセルボタン */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={() => {
                handleSave();
                setShowInfoForm(false);
              }}
            >
              保存
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CancelIcon />}
              onClick={() => setShowInfoForm(false)}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
            {title || '無題'}
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setShowInfoForm(true)}
            sx={{ mr: 1 }}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 本文エリア */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {generateLineNumbers()}
          <textarea
            ref={textAreaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
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
              paddingLeft: settings.lineNumbers ? 42 : 12,
              boxSizing: 'border-box',
              background: 'inherit',
              color: 'inherit',
              outline: 'none',
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
              fontSize: '0.75rem'
            }}
          >
            {body.length.toLocaleString()} / 300,000
          </Typography>
        )}

        {/* 特殊テキストボタン */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => insertSpecialText('[newpage]')}
            sx={{ fontSize: '0.7rem', px: 1 }}
          >
            ページ追加
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => insertSpecialText('[chapter:章タイトル]', '章タイトル', '章タイトル')}
            sx={{ fontSize: '0.7rem', px: 1 }}
          >
            章タイトル
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => insertSpecialText('[[rb:漢字 > ふりがな]]', 'ふりがな', '漢字')}
            sx={{ fontSize: '0.7rem', px: 1 }}
          >
            ルビ
          </Button>
        </Box>

        {/* 保存・キャンセルボタン */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            保存
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<CancelIcon />}
            onClick={handleCancel}
          >
            キャンセル
          </Button>
        </Box>
      </Box>

      {/* 設定ダイアログ */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Box>
  );
};

export default MobileWritingField; 