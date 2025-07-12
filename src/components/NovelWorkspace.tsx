import React, { useState, useCallback } from 'react';
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
  useTheme
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
import packageJson from '../../package.json';

const NovelWorkspace: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const theme = useSelector((state: RootState) => state.theme);
  const dispatch = useDispatch();

  const { isMobile } = useResponsive();
  const muiTheme = useTheme();

  // カスタムフックの使用
  const { drawerWidth, isResizing, handleMouseDown, handleDoubleClick } = useDrawerResize({
    defaultWidth: DRAWER_CONSTANTS.DEFAULT_WIDTH,
    minWidth: DRAWER_CONSTANTS.MIN_WIDTH,
    maxWidth: DRAWER_CONSTANTS.MAX_WIDTH
  });

  const { expandedFolders, expandedTags, toggleFolderExpansion, toggleTagExpansion } = useExpansionState();
  const { novelsByFolder, novelsByTag } = useNovelData(novels, folders, tags);

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

  const handleNewNovel = useCallback(() => {
    const now = new Date().toISOString();
    const newNovel = {
      id: Math.random().toString(36).slice(2),
      title: '新しい作品',
      body: '',
      tags: [],
      folderId: '',
      createdAt: now,
      updatedAt: now,
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

  const handleDeleteNovel = useCallback((novelId: string) => {
    if (window.confirm('この作品を削除しますか？この操作は取り消せません。')) {
      dispatch(deleteNovel(novelId));
      if (selectedNovelId === novelId) {
        setSelectedNovelId(null);
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
    if (newFolderName.trim()) {
      // フォルダ追加ロジック（必要ならdispatch）
      setNewFolderName("");
      setFolderModalOpen(false);
    }
  }, [newFolderName]);

  const handleBackToList = useCallback(() => {
    setSelectedNovelId(null);
  }, []);

  const selectedNovel = selectedNovelId ? novels.find(n => n.id === selectedNovelId) : null;

  // アクションボタンの設定
  const actionButtons = [
    {
      icon: AddIcon,
      color: 'success' as const,
      tooltip: '新しい作品を作成',
      onClick: handleNewNovel
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
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* モバイルヘッダー */}
        <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
              BlueFish
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => setSettingsModalOpen(true)}
            >
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* モバイルコンテンツ */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
                textAlign: 'center'
              }}
            >
              <BookIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                執筆を開始
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 300 }}>
                メニューから作品を選択するか、新しい作品を作成してください
              </Typography>
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
          onNewNovel={handleNewNovel}
          onNewFolder={() => setFolderModalOpen(true)}
          onAnalyticsToggle={handleAnalyticsToggle}
          onSettingsOpen={() => setSettingsModalOpen(true)}
        />

        {/* フォルダ作成モーダル */}
        <Dialog open={folderModalOpen} onClose={() => setFolderModalOpen(false)} maxWidth="sm" fullWidth>
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
          {/* タイトル下に4つのFabボタンを横並びで配置 */}
          <ActionButtons buttons={actionButtons} />
          {/* フォルダ作成モーダル */}
          <Dialog open={folderModalOpen} onClose={() => setFolderModalOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { minWidth: 400, maxWidth: 600 } }}>
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
                  title={folder.name}
                  count={folderNovels.length}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolderExpansion(folder.id)}
                >
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

      {/* 設定ダイアログ */}
      <SettingsDialog
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </Box>
  );
};

export default NovelWorkspace; 