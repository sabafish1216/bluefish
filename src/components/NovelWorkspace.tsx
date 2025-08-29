import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  useTheme,
  Paper,
  Snackbar,
  Portal
} from '@mui/material';
import {
  Book as BookIcon,
  Folder as FolderIcon,
  LocalOffer as TagIcon,
  Inbox as InboxIcon,
  FolderOpen as FolderOpenIcon,
  Label as LabelIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { addNovel, deleteNovel } from '../features/novels/novelsSlice';
import { addFolder, deleteFolder, updateFolder } from '../features/folders/foldersSlice';
import { validateFolderName } from '../utils/folderValidation';
import { DRAWER_CONSTANTS } from '../constants/drawer';
import { useDrawerResize } from '../hooks/useDrawerResize';
import { useExpansionState } from '../hooks/useExpansionState';
import { useNovelData } from '../hooks/useNovelData';
import { useResponsive } from '../hooks/useResponsive';
import NovelListItem from './NovelListItem';
import WritingField from './WritingField';
import MobileWritingField from './MobileWritingField';
import AnalyticsPage from './AnalyticsPage';
import TabPanel from './common/TabPanel';
import ActionButtons from './common/ActionButtons';
import EmptyState from './common/EmptyState';
import ExpandableSection from './common/ExpandableSection';
import SettingsDialog from './common/SettingsDialog';
import MobileDrawer from './common/MobileDrawer';
// import { GoogleDriveSyncButton } from './GoogleDriveSyncButton';
import packageJson from '../../package.json';
// import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync';

const NovelWorkspace: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState<number | undefined>(undefined);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteFolderName, setDeleteFolderName] = useState('');

  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const dispatch = useDispatch();

  const { isMobile } = useResponsive();
  const muiTheme = useTheme();
  // const { deleteNovelFromDrive, syncStatus } = useGoogleDriveSync();

  // カスタムフックの使用
  const { drawerWidth, isResizing, handleMouseDown, handleDoubleClick } = useDrawerResize({
    defaultWidth: DRAWER_CONSTANTS.DEFAULT_WIDTH,
    minWidth: DRAWER_CONSTANTS.MIN_WIDTH,
    maxWidth: DRAWER_CONSTANTS.MAX_WIDTH
  });

  const { expandedFolders, expandedTags, toggleFolderExpansion, toggleTagExpansion } = useExpansionState();
  const { novelsByFolder, novelsByTag } = useNovelData(novels, folders, tags);

  useEffect(() => {
    if (isMobile) {
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
      return () => {
        window.removeEventListener('resize', setHeight);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', setHeight);
        }
      };
    }
  }, [isMobile]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  }, []);

  const handleNovelSelect = useCallback((novelId: string) => {
    setSelectedNovelId(novelId);
    if (showAnalytics) {
      setShowAnalytics(false);
    }
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [showAnalytics, isMobile]);

  const handleCreateNovel = useCallback(() => {
    const now = new Date().toISOString();
    const newNovel = {
      id: Math.random().toString(36).slice(2),
      title: '新しい作品',
      body: '',
      tags: [],
      folderId: '',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastSyncAt: null,
      isSyncing: false,
    };
    dispatch(addNovel(newNovel));
    setSelectedNovelId(newNovel.id);
    if (showAnalytics) {
      setShowAnalytics(false);
    }
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [dispatch, showAnalytics, isMobile]);

  const handleDeleteNovel = useCallback(async (novelId: string) => {
    if (window.confirm('この作品を削除しますか？この操作は取り消せません。')) {
      try {
        // Google Drive連携時はGoogle Driveからも削除
        // if (syncStatus.isSignedIn) {
        //   console.log('Google Drive連携時 - Google Driveからも削除');
        //   await deleteNovelFromDrive(novelId);
        // } else {
        //   console.log('Google Drive未連携時 - ローカル削除のみ');
        // }
        
        // ローカルデータを削除
        dispatch(deleteNovel(novelId));
        
        if (selectedNovelId === novelId) {
          setSelectedNovelId(null);
        }
      } catch (error) {
        console.error('作品削除エラー:', error);
        // エラーが発生してもローカルデータは削除
        dispatch(deleteNovel(novelId));
        if (selectedNovelId === novelId) {
          setSelectedNovelId(null);
        }
      }
    }
  }, [dispatch, selectedNovelId]);

  const handleAnalyticsToggle = useCallback(() => {
    setShowAnalytics(!showAnalytics);
    if (showAnalytics) {
      setSelectedNovelId(null);
    }
  }, [showAnalytics]);

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
    } else {
      setNewFolderError(validation.errorMessage);
      setShowErrorToast(true);
    }
  }, [newFolderName, folders, dispatch]);

  const handleBackToList = useCallback(() => {
    setSelectedNovelId(null);
  }, []);

  // 初期画面に戻る関数
  const handleBackToHome = useCallback(() => {
    setSelectedNovelId(null);
    setShowAnalytics(false);
    setMobileDrawerOpen(false);
  }, []);

  // フォルダ編集開始
  const handleEditFolder = (folderId: string, name: string) => {
    setEditFolderId(folderId);
    setEditFolderName(name);
  };
  // フォルダ編集確定
  const handleEditFolderSave = () => {
    if (editFolderId && editFolderName.trim()) {
      const validation = validateFolderName(editFolderName, folders, editFolderId);
      if (validation.isValid) {
      dispatch(updateFolder({ id: editFolderId, name: editFolderName.trim() }));
    setEditFolderId(null);
    setEditFolderName('');
      }
    }
  };
  // フォルダ削除開始
  const handleDeleteFolder = (folderId: string, name: string) => {
    setDeleteFolderId(folderId);
    setDeleteFolderName(name);
  };
  // フォルダ削除確定
  const handleDeleteFolderConfirm = () => {
    if (deleteFolderId) {
      dispatch(deleteFolder(deleteFolderId));
      novels.forEach(novel => {
        if (novel.folderId === deleteFolderId) {
          dispatch({ type: 'novels/updateNovel', payload: { ...novel, folderId: '' } });
        }
      });
    }
    setDeleteFolderId(null);
    setDeleteFolderName('');
  };

  const selectedNovel = selectedNovelId ? novels.find(n => n.id === selectedNovelId) : null;

  // アクションボタンの設定
  const actionButtons = [
    {
      icon: AddIcon,
      color: 'success' as const,
      tooltip: '新しい作品を作成',
      onClick: handleCreateNovel
    },
    {
      icon: FolderIcon,
      color: 'secondary' as const,
      tooltip: '新しいフォルダを作成',
      onClick: () => setFolderModalOpen(true)
    },
    {
      icon: AnalyticsIcon,
      color: 'info' as const,
      tooltip: '分析画面を表示',
      onClick: handleAnalyticsToggle
    },
    {
      icon: SettingsIcon,
      color: 'warning' as const,
      tooltip: '設定を開く',
      onClick: () => setSettingsModalOpen(true)
    }
  ];

  // アイコンを選択する関数
  const getIconSrc = () => {
    const isDarkMode = muiTheme.palette.mode === 'dark';
    return process.env.PUBLIC_URL + (isDarkMode ? '/bluefish_icon_light.png' : '/bluefish_icon.png');
  };

  // モバイル用のレイアウト
  if (isMobile) {
    return (
      <Box style={dynamicHeight ? { height: dynamicHeight, overflow: 'hidden' } : {}}>
        {/* モバイルヘッダー */}
        <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              sx={{ 
                flexGrow: 1, 
                fontSize: '1.1rem',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={handleBackToHome}
            >
              BlueFish
            </Typography>
                            {/* GoogleDriveSyncButton variant="icon" size="small" /> */}
            <IconButton
              color="inherit"
              onClick={() => setSettingsModalOpen(true)}
            >
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* モバイルコンテンツ */}
        <Box sx={{ flexGrow: 1, height: dynamicHeight ? `calc(${dynamicHeight}px - 56px)` : undefined, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {showAnalytics ? (
            <AnalyticsPage />
          ) : selectedNovel ? (
            <MobileWritingField
              novel={selectedNovel}
              onBack={handleBackToList}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                p: 3,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              {/* ヘッダー部分 */}
              <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
                <img
                  src={getIconSrc()}
                  alt="BlueFish Icon"
                  style={{ width: 80, height: 80, marginBottom: 16 }}
                />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 2, 
                    color: 'text.primary',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  onClick={handleBackToHome}
                >
                  BlueFish
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  小説執筆アプリ
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 300, mx: 'auto' }}>
                  アイデアを形に、ストーリーを紡ぐ
                </Typography>
              </Box>

              {/* 統計カード */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4, width: '100%' }}>
                <Paper sx={{ flex: 1, minWidth: 0, maxWidth: '50%', p: 2, textAlign: 'center', bgcolor: 'background.paper', border: 1, borderColor: 'divider', elevation: 2, boxSizing: 'border-box' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main', wordBreak: 'break-all' }}>
                    {novels.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    作品数
                  </Typography>
                </Paper>
                <Paper sx={{ flex: 1, minWidth: 0, maxWidth: '50%', p: 2, textAlign: 'center', bgcolor: 'background.paper', border: 1, borderColor: 'divider', elevation: 2, boxSizing: 'border-box' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main', wordBreak: 'break-all' }}>
                    {novels.reduce((total, novel) => total + novel.body.length, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    総文字数
                  </Typography>
                </Paper>
              </Box>

              {/* 機能説明 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center', color: 'text.primary' }}>
                  主な機能
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BookIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      複数作品の管理と整理
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FolderIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      フォルダとタグによる分類
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AnalyticsIcon sx={{ fontSize: 24, color: 'info.main' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      執筆統計と分析
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* アクションボタン */}
              
            </Box>
          )}
        </Box>

        {/* モバイルドロワー */}
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          selectedNovelId={selectedNovelId}
          onNovelSelect={handleNovelSelect}
          onDeleteNovel={handleDeleteNovel}
          onNewNovel={handleCreateNovel}
          onNewFolder={() => setFolderModalOpen(true)}
          onAnalyticsToggle={handleAnalyticsToggle}
          onSettingsOpen={() => setSettingsModalOpen(true)}
          onBackToHome={handleBackToHome}
        />

        {/* フォルダ作成モーダル */}
        <Dialog open={folderModalOpen} onClose={() => setFolderModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>新しいフォルダ</DialogTitle>
          <DialogContent sx={{ minHeight: 100, pt: 3, pb: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <TextField
              label="フォルダ名"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              fullWidth
              autoFocus
              
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFolderModalOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>作成</Button>
          </DialogActions>
        </Dialog>
        {/* 設定ダイアログ */}
        <SettingsDialog
          open={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      </Box>
    );
  }

  // デスクトップ用のレイアウト（既存のコード）
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 左側のドロワー */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            position: 'relative',
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        {/* リサイズハンドル */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&:active': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
            zIndex: 1,
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        />
        <Box sx={{ pt: 3, pl: 3, pr: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img
              src={getIconSrc()}
              alt="BlueFish Icon"
              style={{ width: 32, height: 32, marginRight: 8 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              BlueFish
            </Typography>
          </Box>
                    {/* Google Drive同期ボタン */}
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <GoogleDriveSyncButton variant="button" size="small" />
          </Box> */}
          {/* タイトル下に4つのFabボタンを横並びで配置 */}
          <ActionButtons buttons={actionButtons} />
          {/* フォルダ作成モーダル */}
          <Dialog open={folderModalOpen} onClose={() => setFolderModalOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { minWidth: 400, maxWidth: 600 } }}>
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
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<BookIcon />} 
            label={drawerWidth > DRAWER_CONSTANTS.NARROW_WIDTH ? "すべて" : undefined}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<FolderIcon />} 
            label={drawerWidth > DRAWER_CONSTANTS.NARROW_WIDTH ? "フォルダ" : undefined}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<TagIcon />} 
            label={drawerWidth > DRAWER_CONSTANTS.NARROW_WIDTH ? "タグ" : undefined}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {/* すべての作品タブ */}
          <TabPanel value={selectedTab} index={0}>
            {novels.length > 0 ? (
              <List>
                {novels.map((novel) => (
                  <NovelListItem
                    key={novel.id}
                    novel={novel}
                    isSelected={selectedNovelId === novel.id}
                    onSelect={() => handleNovelSelect(novel.id)}
                    onDelete={handleDeleteNovel}
                    showActions={true}
                    drawerWidth={drawerWidth}
                    tags={tags}
                  />
                ))}
              </List>
            ) : (
              <EmptyState
                icon={InboxIcon}
                title="作品がありません"
                description="新しい作品を作成して執筆を始めましょう"
              />
            )}
          </TabPanel>

          {/* フォルダ別タブ */}
          <TabPanel value={selectedTab} index={1}>
            {novelsByFolder.length > 0 ? (
              novelsByFolder.map(({ folder, novels: folderNovels }) => (
                <ExpandableSection
                  key={folder.id}
                  id={folder.id}
                  title={folder.name}
                  count={folderNovels.length}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolderExpansion(folder.id)}
                  editable={folder.id !== 'uncategorized' && folder.name !== '未分類'}
                  deletable={folder.id !== 'uncategorized' && folder.name !== '未分類'}
                  onEdit={handleEditFolder}
                  onDelete={handleDeleteFolder}
                >
                  {folderNovels.length === 0 ? (
                    <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                      このフォルダには作品がありません
                    </Typography>
                  ) : (
                    <List>
                      {folderNovels.map((novel) => (
                        <NovelListItem
                          key={novel.id}
                          novel={novel}
                          isSelected={selectedNovelId === novel.id}
                          onSelect={() => handleNovelSelect(novel.id)}
                          onDelete={handleDeleteNovel}
                          showActions={true}
                          drawerWidth={drawerWidth}
                          tags={tags}
                        />
                      ))}
                    </List>
                  )}
                </ExpandableSection>
              ))
            ) : (
              <EmptyState
                icon={FolderOpenIcon}
                title="フォルダがありません"
                description="作品にフォルダを設定すると、ここに表示されます"
              />
            )}
          </TabPanel>

          {/* タグ別タブ */}
          <TabPanel value={selectedTab} index={2}>
            {novelsByTag.length > 0 ? (
              novelsByTag.map(({ tag, novels: tagNovels }) => (
                <ExpandableSection
                  key={tag.id}
                  title={tag.name}
                  count={tagNovels.length}
                  isExpanded={expandedTags.has(tag.id)}
                  onToggle={() => toggleTagExpansion(tag.id)}
                >
                  <List>
                    {tagNovels.map((novel) => (
                      <NovelListItem
                        key={novel.id}
                        novel={novel}
                        isSelected={selectedNovelId === novel.id}
                        onSelect={() => handleNovelSelect(novel.id)}
                        onDelete={handleDeleteNovel}
                        showActions={true}
                        drawerWidth={drawerWidth}
                        tags={tags}
                      />
                    ))}
                  </List>
                </ExpandableSection>
              ))
            ) : (
              <EmptyState
                icon={LabelIcon}
                title="タグがありません"
                description="作品にタグを設定すると、ここに表示されます"
              />
            )}
          </TabPanel>
        </Box>
        <Box sx={{ p: 2, textAlign: 'center', mt: 'auto', color: 'text.secondary', fontSize: 12 }}>
          <div>&copy; Ryuto Kobayashi</div>
          <div>v{packageJson.version}</div>
        </Box>
      </Drawer>

      {/* 右側の執筆エリア */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        cursor: isResizing ? 'col-resize' : 'default'
      }}>
        {showAnalytics ? (
          <AnalyticsPage />
        ) : selectedNovel ? (
          <WritingField novel={selectedNovel} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              bgcolor: 'background.default',
              p: 4
            }}
          >
            <BookIcon sx={{ fontSize: 80, color: 'grey.400', mb: 3 }} />
            <Typography variant="h4" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
              執筆を開始
            </Typography>
            <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
              左側の作品一覧から作品を選択するか、<br />
              新しい作品を作成してください
            </Typography>
          </Box>
        )}
      </Box>

      {/* フォルダ編集モーダル */}
      <Dialog open={!!editFolderId} onClose={() => setEditFolderId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>フォルダ名を編集</DialogTitle>
        <DialogContent sx={{ minWidth: 320, px: 2 }}>
          <TextField
            label="フォルダ名"
            value={editFolderName}
            onChange={e => setEditFolderName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFolderId(null)}>キャンセル</Button>
          <Button onClick={handleEditFolderSave} disabled={!editFolderName.trim()}>保存</Button>
        </DialogActions>
      </Dialog>
      {/* フォルダ削除ダイアログ */}
      <Dialog open={!!deleteFolderId} onClose={() => setDeleteFolderId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>フォルダを削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>「{deleteFolderName}」内の作品は「未分類」に移動します。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFolderId(null)}>キャンセル</Button>
          <Button color="error" onClick={handleDeleteFolderConfirm}>削除</Button>
        </DialogActions>
      </Dialog>

      {/* 設定ダイアログ */}
      <SettingsDialog
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </Box>
  );
};

export default NovelWorkspace; 