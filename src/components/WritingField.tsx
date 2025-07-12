import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { Novel, updateNovel } from '../features/novels/novelsSlice';
import { addFolder } from '../features/folders/foldersSlice';
import { addTag, deleteTag } from '../features/tags/tagsSlice';
import TagSelector from './TagSelector';
import FolderSelector from './FolderSelector';

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

    // 新規作成されたタグをReduxに保存し、IDを取得
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
      tags: [...selectedTags, ...newTagIds], // 既存タグID + 新規タグID
      folderId: selectedFolderId,
      updatedAt: new Date().toISOString()
    };
    
    if (onSave) {
      onSave(updatedNovel);
    } else {
      dispatch(updateNovel(updatedNovel));
    }
    
    // 保存後はpendingTagsをクリア
    setPendingTags([]);

    // 保存完了後に0件のタグを削除
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
    // キャンセル時もpendingTagsをクリア
    setPendingTags([]);
  }, [onCancel, novel]);

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
  }, [body]);

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

  // 行番号の生成
  const generateLineNumbers = () => {
    if (!settings.lineNumbers) return null;
    const lines = body.split('\n');
    return (
      <Box
        sx={(theme) => ({
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 40,
          backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
          borderRight: '1px solid #ccc',
          overflow: 'hidden',
          fontFamily: 'monospace',
          fontSize: getFontSize() - 2,
          color: 'text.secondary',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          padding: '16px 8px',
          boxSizing: 'border-box',
          lineHeight: 1.6,
        })}
      >
        {lines.map((_, index) => (
          <Box key={index} sx={{ height: '1.6em' }}>
            {index + 1}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3, elevation: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            作品情報
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 3 }}
          required
        />

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
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
          <Box sx={{ flex: 1 }}>
            <TagSelector
              value={displayTagNames}
              options={tags.map(t => t.name)}
              tagCounts={tagCounts}
              onChange={(newTagNames) => {
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
              }}
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
            onClick={handleSave}
          >
            保存
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
          >
            キャンセル
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
                padding: 16,
                paddingLeft: settings.lineNumbers ? 56 : 16,
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