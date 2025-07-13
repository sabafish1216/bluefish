import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { Novel } from '../features/novels/novelsSlice';
import { addFolder } from '../features/folders/foldersSlice';
import { addTag } from '../features/tags/tagsSlice';
import TagSelector from './TagSelector';
import FolderSelector from './FolderSelector';
import { useAutoSave } from '../hooks/useAutoSave';

interface WritingFieldProps {
  novel: Novel;
  onSave?: (novel: Novel) => void;
  onCancel?: () => void;
}

const WritingField: React.FC<WritingFieldProps> = ({ novel, onSave, onCancel }) => {
  const dispatch = useDispatch();

  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const novels = useSelector((state: RootState) => state.novels.novels);
  const settings = useSelector((state: RootState) => state.settings);

  const [title, setTitle] = useState(novel.title);
  const [body, setBody] = useState(novel.body);
  const [selectedTags, setSelectedTags] = useState<string[]>(novel.tags);
  const [pendingTags, setPendingTags] = useState<string[]>([]); // 新規作成されたタグ（まだ保存されていない）
  const [selectedFolderId, setSelectedFolderId] = useState<string>(novel.folderId);
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
    console.log('本文変更検知:', newBody.length, '文字');
    setBody(newBody);
    debouncedSave({ body: newBody });
  }, [debouncedSave]);

  // タグ変更時の自動保存
  const handleTagsChange = useCallback((newTagNames: string[]) => {
    // 利用可能なすべてのタグ名を取得
    const allAvailableTagNames = tags.map(t => t.name);
    
    // 新規作成されたタグをpendingTagsに追加
    const newPendingTags = newTagNames.filter(name => 
      !allAvailableTagNames.includes(name) && !pendingTags.includes(name)
    );
    
    // 削除されたpendingTagsを処理
    const removedPendingTags = pendingTags.filter(name => 
      !newTagNames.includes(name)
    );
    
    // pendingTagsを更新
    setPendingTags(prev => [...prev.filter(t => !removedPendingTags.includes(t)), ...newPendingTags]);
    
    // 既存タグのIDリストを更新（利用可能なタグから選択されたもの）
    const existingTagIds = newTagNames
      .filter(name => allAvailableTagNames.includes(name))
      .map(name => tags.find(t => t.name === name)?.id)
      .filter(Boolean) as string[];
    
    setSelectedTags(existingTagIds);
    
    // 新規作成されたタグをReduxに保存し、IDを取得
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



  // 特殊テキスト挿入関数
  const insertSpecialText = useCallback((text: string, selectText?: string, replaceText?: string) => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const currentText = body;
    const selectedText = currentText.substring(start, end);
    
    // 選択中のテキストがある場合は、プレースホルダーを置換
    let finalText = text;
    if (selectedText && replaceText) {
      finalText = text.replace(replaceText, selectedText);
    }
    
    // カーソル位置にテキストを挿入
    const newText = currentText.substring(0, start) + finalText + currentText.substring(end);
    setBody(newText);
    debouncedSave({ body: newText });

    // テキストエリアにフォーカスを戻す
    setTimeout(() => {
      textArea.focus();
      
      if (selectText) {
        // 特定のテキストを選択状態にする
        const selectStart = start + finalText.indexOf(selectText);
        const selectEnd = selectStart + selectText.length;
        textArea.setSelectionRange(selectStart, selectEnd);
      } else {
        // 挿入したテキストの後ろにカーソルを移動
        const newCursorPos = start + finalText.length;
        textArea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [body, debouncedSave]);

  const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));
  
  // 表示用のタグ名リスト（既存タグ + 新規作成タグ）
  const displayTagNames = [
    ...selectedTagObjects.map(t => t.name),
    ...pendingTags
  ];

  // タグの件数を計算
  const tagCounts: { [key: string]: number } = {};
  tags.forEach(tag => {
    const count = novels.filter(novel => novel.tags.includes(tag.id)).length;
    tagCounts[tag.name] = count;
  });

  // フォントサイズの取得
  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3, elevation: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            作品情報
          </Typography>
          {/* 保存状態表示 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        </Box>

        <TextField
          fullWidth
          label="タイトル"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          sx={{ mb: 3 }}
          required
        />

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
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
          <Box sx={{ flex: 1 }}>
            <TagSelector
              value={displayTagNames}
              options={tags.map(t => t.name)}
              tagCounts={tagCounts}
              onChange={handleTagsChange}
              onCreate={(tag) => {
                // 新規作成はonChangeで処理されるので、ここでは何もしない
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={() => saveImmediately({
              title,
              body,
              tags: [...selectedTags, ...pendingTags.map(name => {
                const existingTag = tags.find(t => t.name === name);
                return existingTag ? existingTag.id : name;
              })],
              folderId: selectedFolderId
            })}
          >
            保存
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ flexGrow: 1, p: 3, elevation: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            本文
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => insertSpecialText('[newpage]')}
              sx={{ fontSize: '0.75rem' }}
            >
              ページ追加
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => insertSpecialText('[chapter:章タイトル]', '章タイトル', '章タイトル')}
              sx={{ fontSize: '0.75rem' }}
            >
              章タイトル
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => insertSpecialText('[[rb:漢字 > ふりがな]]', 'ふりがな', '漢字')}
              sx={{ fontSize: '0.75rem' }}
            >
              ルビ
            </Button>
          </Box>
        </Box>
        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              height: '100%',
              width: '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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
                padding: 16,
                boxSizing: 'border-box',
                background: 'inherit',
                color: 'inherit',
                outline: 'none',
              }}
            />
          </Box>
          {settings.wordCountDisplay && (
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 16,
                color: 'text.secondary',
                backgroundColor: 'background.paper',
                padding: '2px 6px',
                borderRadius: 1,
                fontSize: '0.75rem',
                pointerEvents: 'none',
                border: 1,
                borderColor: 'divider'
              }}
            >
              {body.length.toLocaleString()} / 300,000
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default WritingField; 