import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Title as TitleIcon,
  FormatSize as FormatSizeIcon,
  ArrowBack as ArrowBackIcon
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

  // 自動保存フック
  const { debouncedSave, saveImmediately } = useAutoSave({ novel, onSave });

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

  // --- 作品情報カード ---
  const renderInfoCard = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        作品情報
      </Typography>
      <TextField
        fullWidth
        label="タイトル"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        sx={{ mb: 2 }}
        required
      />
      <Box sx={{ mb: 2 }}>
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
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          タグ
        </Typography>
        <TagSelector
          value={displayTagNames}
          options={tags.map(t => t.name)}
          tagCounts={tagCounts}
          onChange={handleTagsChange}
          onCreate={() => {}}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
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
          }}
        >
          保存
        </Button>
      </Box>
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
      setTimeout(() => {
        if (textAreaRef.current) {
          const selectionEnd = textAreaRef.current.selectionEnd;
          textAreaRef.current.setSelectionRange(selectionEnd, selectionEnd);
          textAreaRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
      }, 0);
    };
    return (
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'background.paper', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => insertSpecialText('[newpage]')} size="large"><AddIcon /></IconButton>
            <IconButton onClick={() => insertSpecialText('[chapter:章タイトル]', '章タイトル', '章タイトル')} size="large"><TitleIcon /></IconButton>
            <IconButton onClick={() => insertSpecialText('[[rb:漢字 > ふりがな]]', 'ふりがな', '漢字')} size="large"><FormatSizeIcon /></IconButton>
          </Box>
        </Box>
        {/* 本文エディタ */}
        <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          <textarea
            ref={textAreaRef}
            value={body}
            onChange={handleEditorInput}
            autoFocus
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
              border: 'none', // 枠を消す
              borderRadius: 0,
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
      </Box>
    );
  } else {
    // --- 通常画面 ---
    return (
      <Box sx={{ height: '100vh', overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
        {renderInfoCard()}
        {renderBodyCard()}
        {/* SpeedDialは一旦非表示 */}
      </Box>
    );
  }
};

export default MobileWritingField; 