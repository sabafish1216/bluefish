import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Title as TitleIcon,
  FormatSize as FormatSizeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { Novel } from '../features/novels/novelsSlice';
import { addFolder } from '../features/folders/foldersSlice';
import { addTag } from '../features/tags/tagsSlice';
import TagSelector from './TagSelector';
import FolderSelector from './FolderSelector';
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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [editorMode, setEditorMode] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState<number | undefined>(undefined);

  // 自動保存フック
  const { debouncedSave, saveImmediately } = useAutoSave({ novel, onSave });

  useEffect(() => {
    setTitle(novel.title);
    setBody(novel.body);
    setSelectedTags(novel.tags);
    setSelectedFolderId(novel.folderId);
  }, [novel]);

  useEffect(() => {
    if (editorMode) {
      const setHeight = () => {
        if (window.visualViewport) {
          setDynamicHeight(window.visualViewport.height);
        } else {
          setDynamicHeight(window.innerHeight);
        }
      };
      setHeight();
      window.addEventListener('resize', setHeight);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', setHeight);
      }
      // body, htmlのoverflowをhiddenに
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // 全体スクロールを即座にトップに戻す
      const handleScroll = () => { if (window.scrollY > 0) window.scrollTo(0, 0); };
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('resize', setHeight);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', setHeight);
        }
        window.removeEventListener('scroll', handleScroll);
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [editorMode]);

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
  const displayTagNames = Array.from(new Set([
    ...selectedTagObjects.map(t => t.name),
    ...pendingTags
  ]));

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

  // --- 作品情報カード ---
  const renderInfoCard = () => (
    <Paper sx={{ p: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
        作品情報
      </Typography>
      <TextField
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        size="small"
        margin="dense"
        placeholder="タイトル"
        sx={{ mb: 1 }}
      />
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
        size="small"
      />
      <TagSelector
        value={displayTagNames}
        options={tags.map(t => t.name)}
        tagCounts={tagCounts}
        onChange={handleTagsChange}
        onCreate={() => {}}
        size="small"
      />
      <Button
        variant="contained"
        size="small"
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
          setToastOpen(true);
        }}
        sx={{ mt: 2, alignSelf: 'flex-end', minWidth: 0, px: 2 }}
      >
        保存
      </Button>
    </Paper>
  );

  // --- 本文カード ---
  const renderBodyCard = () => (
    <Paper sx={{ p: 2, mb: 2, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        本文
      </Typography>
      <textarea
        ref={textAreaRef}
        value={body}
        readOnly
        placeholder="ここに本文を入力してください..."
        style={{
          width: '100%',
          minHeight: 120,
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: getFontSize(),
          lineHeight: 1.6,
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: 12,
          boxSizing: 'border-box',
          background: 'inherit',
          color: 'inherit',
          outline: 'none',
          resize: 'none',
          cursor: 'pointer',
        }}
        onClick={() => setEditorMode(true)}
      />
      {settings.wordCountDisplay && (
        <Typography variant="caption" sx={{ textAlign: 'right', color: 'text.secondary', mt: 1 }}>
          {body.length.toLocaleString()} / 300,000
        </Typography>
      )}
    </Paper>
  );

  if (editorMode) {
    const handleEditorInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleBodyChange(e.target.value);
      // 自動スクロール処理を削除
    };
    return (
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'background.paper', zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} style={dynamicHeight ? { height: dynamicHeight, paddingBottom: 'env(safe-area-inset-bottom)' } : {}}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
          <Button onClick={() => setEditorMode(false)} startIcon={<ArrowBackIcon />} sx={{ minWidth: 0, p: 1 }}>
            戻る
          </Button>
          {settings.wordCountDisplay && (
            <Typography variant="caption" sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: 'text.secondary', fontWeight: 'bold', fontSize: '1rem', pointerEvents: 'none' }}>
              {body.length.toLocaleString()} / 300,000
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={() => insertSpecialText('[newpage]')} size="small"><AddIcon fontSize="small" /></IconButton>
            <IconButton onClick={() => insertSpecialText('[chapter:章タイトル]', '章タイトル', '章タイトル')} size="small"><TitleIcon fontSize="small" /></IconButton>
            <IconButton onClick={() => insertSpecialText('[[rb:漢字 > ふりがな]]', 'ふりがな', '漢字')} size="small"><FormatSizeIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
        {/* 本文エディタ */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <textarea
            ref={textAreaRef}
            value={body}
            onChange={handleEditorInput}
            autoFocus
            // onFocus, onBlurでsetEditorHeightは不要
            style={{
              width: '100%',
              height: '100%', // 親の高さに合わせる
              transition: 'height 0.2s',
              minHeight: 0,
              resize: 'none',
              overflowY: 'auto',
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: getFontSize(),
              lineHeight: 1.6,
              border: 'none', // デバッグ用赤枠線を撤廃
              borderRadius: 0,
              padding: 12,
              boxSizing: 'border-box',
              background: 'inherit',
              color: 'inherit',
              outline: 'none',
              display: 'block',
            }}
          />
          {/* 特殊文字バナー（テキストエリアの下に移動、ダークモード対応） */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1, borderTop: 1, borderColor: 'divider', bgcolor: (theme) => theme.palette.background.paper }}>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, px: 1 }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                insertSpecialText('「」');
                setTimeout(() => {
                  const textArea = textAreaRef.current;
                  if (textArea) {
                    const pos = (textArea.selectionStart || 0) - 1;
                    textArea.setSelectionRange(pos, pos);
                  }
                }, 0);
              }}
            >「」</Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, px: 1 }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                insertSpecialText('『』');
                setTimeout(() => {
                  const textArea = textAreaRef.current;
                  if (textArea) {
                    const pos = (textArea.selectionStart || 0) - 1;
                    textArea.setSelectionRange(pos, pos);
                  }
                }, 0);
              }}
            >『』</Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, px: 1 }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                insertSpecialText('（）');
                setTimeout(() => {
                  const textArea = textAreaRef.current;
                  if (textArea) {
                    const pos = (textArea.selectionStart || 0) - 1;
                    textArea.setSelectionRange(pos, pos);
                  }
                }, 0);
              }}
            >（）</Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, px: 1 }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => insertSpecialText('…')}
            >…</Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, px: 1 }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => insertSpecialText('—')}
            >—</Button>
          </Box>
        </Box>
      </Box>
    );
  } else {
    // --- 通常画面 ---
    return (
      <Box sx={{ height: '100vh', overflow: 'auto', p: 2}}>
        {renderInfoCard()}
        {renderBodyCard()}
        {/* SpeedDialは一旦非表示 */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={2000}
          onClose={() => setToastOpen(false)}
          message="保存が完了しました"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    );
  }
};

export default MobileWritingField; 
