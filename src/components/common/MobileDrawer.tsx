import React from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  useTheme
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
import { useSelector } from 'react-redux';
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
  onSettingsOpen
}) => {
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const muiTheme = useTheme();

  const { expandedFolders, expandedTags, toggleFolderExpansion, toggleTagExpansion } = useExpansionState();
  const { novelsByFolder, novelsByTag } = useNovelData(novels, folders, tags);

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
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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
    </Drawer>
  );
};

export default MobileDrawer; 