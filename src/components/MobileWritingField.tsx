import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Portal
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PreviewPage from './PreviewPage';
import { RootState } from '../store';
import { Novel } from '../features/novels/novelsSlice';
import { addFolder } from '../features/folders/foldersSlice';
import { validateFolderName } from '../utils/folderValidation';
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
  const [previewMode, setPreviewMode] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [replaceWarningText, setReplaceWarningText] = useState("");
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [pendingReplaceAction, setPendingReplaceAction] = useState<(() => void) | null>(null);

  // 自動保存フック
  const { debouncedSave, saveImmediately, cleanup } = useAutoSave({ novel, onSave });

  useEffect(() => {
    setTitle(novel.title);
    setBody(novel.body);
    setSelectedTags(novel.tags);
    setSelectedFolderId(novel.folderId);
  }, [novel]);

  // コンポーネントアンマウント時にcleanupを実行
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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

  const handleCreateFolder = useCallback(() => {
    const validation = validateFolderName(newFolderName, folders);
    if (validation.isValid) {
      const newFolder = {
        id: Math.random().toString(36).slice(2),
        name: newFolderName.trim()
      };
      dispatch(addFolder(newFolder));
      setNewFolderName("");
      setNewFolderError(null);
      setFolderModalOpen(false);
      setSelectedFolderId(newFolder.id);
    } else {
      setNewFolderError(validation.errorMessage);
      setShowErrorToast(true);
    }
  }, [newFolderName, folders, dispatch]);


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

  // 括弧挿入関数（選択文字を括弧内に挿入）
  const insertBrackets = useCallback((openBracket: string, closeBracket: string) => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = textArea.value.substring(start, end);
    
    let finalText: string;
    if (selectedText) {
      // 選択文字がある場合は括弧内に挿入
      finalText = openBracket + selectedText + closeBracket;
    } else {
      // 選択文字がない場合は括弧のみ挿入
      finalText = openBracket + closeBracket;
    }
    
    const newText = textArea.value.substring(0, start) + finalText + textArea.value.substring(end);
    setBody(newText);
    debouncedSave({ body: newText });

    setTimeout(() => {
      textArea.focus();
      if (selectedText) {
        // 選択文字があった場合は、括弧内の文字を選択
        const selectStart = start + openBracket.length;
        const selectEnd = selectStart + selectedText.length;
        textArea.setSelectionRange(selectStart, selectEnd);
      } else {
        // 選択文字がない場合は、括弧の間にカーソルを移動
        const newCursorPos = start + openBracket.length;
        textArea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [debouncedSave]);

  // 置換警告モーダル表示関数
  const showReplaceWarningModal = useCallback((text: string, action: () => void) => {
    console.log('showReplaceWarningModal呼び出し:', text);
    // ローカルストレージから「今後は表示しない」設定を確認
    const dontShowAgainSetting = localStorage.getItem('dontShowReplaceWarning');
    console.log('dontShowAgainSetting:', dontShowAgainSetting);
    if (dontShowAgainSetting === 'true') {
      // 警告を表示せずに直接実行
      console.log('警告をスキップして直接実行');
      action();
      // 直接実行した場合もフォーカスを戻す
      setTimeout(() => {
        const textArea = textAreaRef.current;
        if (textArea) {
          textArea.focus();
        }
      }, 100);
      return;
    }

    console.log('警告モーダルを表示する');
    setReplaceWarningText(text);
    setPendingReplaceAction(() => action);
    setShowReplaceWarning(true);
  }, []);

  // 置換実行関数
  const executeReplace = useCallback(() => {
    if (pendingReplaceAction) {
      pendingReplaceAction();
    }
    setShowReplaceWarning(false);
    setPendingReplaceAction(null);
    
    // 「今後は表示しない」がチェックされている場合、設定を保存
    if (dontShowAgain) {
      localStorage.setItem('dontShowReplaceWarning', 'true');
    }
    setDontShowAgain(false);
    
    // モーダルが閉じた後にテキストエリアにフォーカスを戻す
    setTimeout(() => {
      const textArea = textAreaRef.current;
      if (textArea) {
        textArea.focus();
      }
    }, 100);
  }, [pendingReplaceAction, dontShowAgain]);

  // 置換キャンセル関数
  const cancelReplace = useCallback(() => {
    setShowReplaceWarning(false);
    setPendingReplaceAction(null);
    setDontShowAgain(false);
    
    // モーダルが閉じた後にテキストエリアにフォーカスを戻す
    setTimeout(() => {
      const textArea = textAreaRef.current;
      if (textArea) {
        textArea.focus();
      }
    }, 100);
  }, []);

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
        onCreate={() => setFolderModalOpen(true)}
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
    if (previewMode) {
      // プレビュー画面（戻るボタン・カードなし、エディタUI背景に直接表示）
      return (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'background.paper', zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} style={dynamicHeight ? { height: dynamicHeight, paddingBottom: 'env(safe-area-inset-bottom)' } : {}}>
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
            <Button onClick={() => setPreviewMode(false)} startIcon={<ArrowBackIcon />} sx={{ minWidth: 0, p: 1, visibility: 'hidden' }}>
              戻る
            </Button>
            {settings.wordCountDisplay && (
              <Typography variant="caption" sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: 'text.secondary', fontWeight: 'bold', fontSize: '1rem', pointerEvents: 'none' }}>
                {body.length.toLocaleString()} / 300,000
              </Typography>
            )}
            <IconButton onClick={() => setPreviewMode(false)} size="small"><VisibilityOffIcon color="primary" /></IconButton>
          </Box>
          {/* プレビュー本文（カードなし、エディタUIと同じ余白・背景） */}
          <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'auto', fontFamily: "'Noto Sans JP', sans-serif", fontSize: getFontSize(), lineHeight: 1.6, bgcolor: 'background.paper', color: 'inherit' }}>
            <PreviewPage body={body} noCard />
          </Box>
        </Box>
      );
    }
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
          <IconButton onClick={() => setPreviewMode(true)} size="small"><VisibilityIcon color="action" /></IconButton>
        </Box>
        {/* 本文エディタ */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <textarea
            ref={textAreaRef}
            value={body}
            onChange={handleEditorInput}
            autoFocus
            onBlur={() => setDynamicHeight(window.innerHeight)}
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
          {/* 特殊文字バナー（下部スペース徹底排除＆ボタン均一化） */}
          {!previewMode && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 0.5,
              pt: 2,
              m: 0,
              height: 28,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: (theme) => theme.palette.background.paper,
            }}>
              {/* 既存の特殊文字ボタン群＋ページ・章・ルビボタン */}
              {[
                { label: '「」', onClick: () => insertBrackets('「', '」') },
                { label: '『』', onClick: () => insertBrackets('『', '』') },
                { label: '（）', onClick: () => insertBrackets('（', '）') },
                { 
                  label: '…', 
                  onClick: () => {
                    const textArea = textAreaRef.current;
                    console.log('…ボタンクリック - 選択範囲:', textArea?.selectionStart, textArea?.selectionEnd);
                    if (textArea && textArea.selectionStart !== textArea.selectionEnd) {
                      // 選択文字がある場合は警告モーダルを表示
                      console.log('警告モーダルを表示');
                      showReplaceWarningModal('選択文字を置き換えます。この処理は取り消せません', () => {
                        insertSpecialText('…');
                      });
                    } else {
                      // 選択文字がない場合は直接挿入
                      console.log('直接挿入');
                      insertSpecialText('…');
                    }
                  }
                },
                { 
                  label: '—', 
                  onClick: () => {
                    const textArea = textAreaRef.current;
                    console.log('—ボタンクリック - 選択範囲:', textArea?.selectionStart, textArea?.selectionEnd);
                    if (textArea && textArea.selectionStart !== textArea.selectionEnd) {
                      // 選択文字がある場合は警告モーダルを表示
                      console.log('警告モーダルを表示');
                      showReplaceWarningModal('選択文字を置き換えます。この処理は取り消せません', () => {
                        insertSpecialText('—');
                      });
                    } else {
                      // 選択文字がない場合は直接挿入
                      console.log('直接挿入');
                      insertSpecialText('—');
                    }
                  }
                },
                { label: '⧉', onClick: () => insertSpecialText('[newpage]') },
                { label: '§', onClick: () => insertSpecialText('[chapter:章タイトル]', '章タイトル', '章タイトル') },
                { label: '𝑟𝑏', onClick: () => insertSpecialText('[[rb:漢字 > ふりがな]]', 'ふりがな', '漢字') },
              ].map(({ label, onClick }) => (
                <Button
                  key={label}
                  variant="text"
                  size="small"
                  sx={{
                    minWidth: '2em',
                    width: '2em',
                    height: '100%',
                    px: 0,
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    color: 'text.primary',
                    m: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseDown={e => e.preventDefault()}
                  onClick={onClick}
                >{label}</Button>
              ))}
            </Box>
          )}
        </Box>

        {/* 置換警告モーダル（エディタモード用） */}
        <Portal container={document.body}>
          <Dialog 
            open={showReplaceWarning} 
            onClose={cancelReplace}
            maxWidth="sm" 
            fullWidth
            sx={{
              zIndex: 99999
            }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                m: 2
              }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              警告
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {replaceWarningText}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="dontShowAgain" style={{ fontSize: '0.9rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                  今後は表示しない
                </label>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={cancelReplace} color="primary">
                いいえ
              </Button>
              <Button onClick={executeReplace} color="error" variant="contained">
                はい
              </Button>
            </DialogActions>
          </Dialog>
        </Portal>
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
        {/* フォルダ作成モーダル */}
        <Dialog open={folderModalOpen} onClose={() => setFolderModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>新しいフォルダ</DialogTitle>
          <DialogContent sx={{ minHeight: 100, pt: 3, pb: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <TextField
              label="フォルダ名"
              value={newFolderName}
              onChange={e => {
                setNewFolderName(e.target.value);
                setNewFolderError(null);
              }}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setFolderModalOpen(false);
              setNewFolderName("");
              setNewFolderError(null);
            }}>キャンセル</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>作成</Button>
          </DialogActions>
        </Dialog>
        
        {/* エラーToast通知 */}
        <Portal container={document.body}>
          <Snackbar
            open={showErrorToast}
            autoHideDuration={4000}
            onClose={() => setShowErrorToast(false)}
            message={newFolderError}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{
              zIndex: 99999,
              '& .MuiSnackbarContent-root': {
                backgroundColor: '#d32f2f',
                color: 'white',
                fontWeight: 'bold'
              }
            }}
          />
        </Portal>

        {/* 置換警告モーダル */}
        <Portal container={document.body}>
          <Dialog 
            open={showReplaceWarning} 
            onClose={cancelReplace}
            maxWidth="sm" 
            fullWidth
            sx={{
              zIndex: 99999
            }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                m: 2
              }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              警告
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {replaceWarningText}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="dontShowAgain" style={{ fontSize: '0.9rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                  今後は表示しない
                </label>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={cancelReplace} color="primary">
                いいえ
              </Button>
              <Button onClick={executeReplace} color="error" variant="contained">
                はい
              </Button>
            </DialogActions>
          </Dialog>
        </Portal>
      </Box>
    );
  }
};

export default MobileWritingField; 
