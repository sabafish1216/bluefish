import React, { useState } from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  Folder as FolderIcon,
  LocalOffer as TagIcon,
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { DRAWER_CONSTANTS } from '../../constants/drawer';
import { useExpansionState } from '../../hooks/useExpansionState';
import { useNovelData } from '../../hooks/useNovelData';
import NovelListItem from '../NovelListItem';
import TabPanel from './TabPanel';
import EmptyState from './EmptyState';
import ExpandableSection from './ExpandableSection';
import ActionButtons from './ActionButtons';
import packageJson from '../../../package.json';
import { deleteFolder, updateFolder } from '../../features/folders/foldersSlice';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  selectedNovelId: string | null;
  onNovelSelect: (novelId: string) => void;
  onDeleteNovel: (novelId: string) => void;
  onNewNovel: () => void;
  onNewFolder: () => void;
  onAnalyticsToggle: () => void;
  onSettingsOpen: () => void;
  onBackToHome: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  selectedTab,
  onTabChange,
  selectedNovelId,
  onNovelSelect,
  onDeleteNovel,
  onNewNovel,
  onNewFolder,
  onAnalyticsToggle,
  onSettingsOpen,
  onBackToHome
}) => {
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const muiTheme = useTheme();
  const dispatch = useDispatch();

  const { expandedFolders, expandedTags, toggleFolderExpansion, toggleTagExpansion } = useExpansionState();
  const { novelsByFolder, novelsByTag } = useNovelData(novels, folders, tags);

  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteFolderName, setDeleteFolderName] = useState('');

  // アクションボタンの設定
  const actionButtons = [
    {
      icon: AddIcon,
      color: 'success' as const,
      tooltip: '新しい作品を作成',
      onClick: onNewNovel
    },
    {
      icon: FolderIcon,
      color: 'secondary' as const,
      tooltip: '新しいフォルダを作成',
      onClick: onNewFolder
    },
    {
      icon: AnalyticsIcon,
      color: 'info' as const,
      tooltip: '分析画面を表示',
      onClick: onAnalyticsToggle
    },
    {
      icon: SettingsIcon,
      color: 'warning' as const,
      tooltip: '設定を開く',
      onClick: onSettingsOpen
    }
  ];

  // アイコンを選択する関数
  const getIconSrc = () => {
    const isDarkMode = muiTheme.palette.mode === 'dark';
    return process.env.PUBLIC_URL + (isDarkMode ? '/bluefish_icon_light.png' : '/bluefish_icon.png');
  };

  // フォルダ編集開始
  const handleEditFolder = (folderId: string, name: string) => {
    setEditFolderId(folderId);
    setEditFolderName(name);
  };
  // フォルダ編集確定
  const handleEditFolderSave = () => {
    if (editFolderId && editFolderName.trim()) {
      dispatch(updateFolder({ id: editFolderId, name: editFolderName.trim() }));
    }
    setEditFolderId(null);
    setEditFolderName('');
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

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: '100%',
          maxWidth: 320,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
        },
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider', 
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img
            src={getIconSrc()}
            alt="BlueFish Icon"
            style={{ width: 24, height: 24 }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={() => {
              onBackToHome();
              onClose();
            }}
          >
            BlueFish
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* アクションボタン */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <ActionButtons buttons={actionButtons} />
      </Box>

      {/* タブ */}
      <Tabs
        value={selectedTab}
        onChange={onTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          icon={<BookIcon />} 
          sx={{ minHeight: 48 }}
        />
        <Tab 
          icon={<FolderIcon />} 
          sx={{ minHeight: 48 }}
        />
        <Tab 
          icon={<TagIcon />} 
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* コンテンツ */}
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
                  onSelect={() => {
                    onNovelSelect(novel.id);
                    onClose(); // モバイルでは選択後にドロワーを閉じる
                  }}
                  onDelete={onDeleteNovel}
                  showActions={true}
                  drawerWidth={DRAWER_CONSTANTS.DEFAULT_WIDTH}
                  tags={tags}
                />
              ))}
            </List>
          ) : (
            <EmptyState
              icon={BookIcon}
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
                <List>
                  {folderNovels.map((novel) => (
                    <NovelListItem
                      key={novel.id}
                      novel={novel}
                      isSelected={selectedNovelId === novel.id}
                      onSelect={() => {
                        onNovelSelect(novel.id);
                        onClose();
                      }}
                      onDelete={onDeleteNovel}
                      showActions={true}
                      drawerWidth={DRAWER_CONSTANTS.DEFAULT_WIDTH}
                      tags={tags}
                    />
                  ))}
                </List>
              </ExpandableSection>
            ))
          ) : (
            <EmptyState
              icon={FolderIcon}
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
                      onSelect={() => {
                        onNovelSelect(novel.id);
                        onClose(); // モバイルでは選択後にドロワーを閉じる
                      }}
                      onDelete={onDeleteNovel}
                      showActions={true}
                      drawerWidth={DRAWER_CONSTANTS.DEFAULT_WIDTH}
                      tags={tags}
                    />
                  ))}
                </List>
              </ExpandableSection>
            ))
          ) : (
            <EmptyState
              icon={TagIcon}
              title="タグがありません"
              description="作品にタグを設定すると、ここに表示されます"
            />
          )}
        </TabPanel>
      </Box>

      {/* フッター */}
      <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider', color: 'text.secondary', fontSize: 12 }}>
        <div>&copy; Ryuto Kobayashi</div>
        <div>v{packageJson.version}</div>
      </Box>

      {/* フォルダ編集モーダル */}
      <Dialog open={!!editFolderId} onClose={() => setEditFolderId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>フォルダ名を編集</DialogTitle>
        <DialogContent>
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
    </Drawer>
  );
};

export default MobileDrawer; 