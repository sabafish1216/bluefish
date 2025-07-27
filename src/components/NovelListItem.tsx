import React, { useMemo } from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Box, Typography, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { Novel } from '../features/novels/novelsSlice';

interface Props {
  novel: Novel;
  folderName?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  showActions?: boolean;
  drawerWidth?: number;
  tags?: { id: string; name: string }[];
  showSyncStatus?: boolean; // 同期状態を表示するかどうか
}

const formatDate = (date: string) => new Date(date).toLocaleDateString();

const NovelListItem: React.FC<Props> = ({ 
  novel, 
  folderName, 
  onEdit, 
  onDelete, 
  isSelected = false, 
  onSelect, 
  showActions = true,
  drawerWidth = 380,
  tags = [],
  showSyncStatus = true
}) => {
  const handleClick = React.useCallback(() => {
    if (onSelect) {
      onSelect(novel.id);
    }
  }, [onSelect, novel.id]);

  const handleEdit = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(novel.id);
    }
  }, [onEdit, novel.id]);

  const handleDelete = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(novel.id);
    }
  }, [onDelete, novel.id]);

  // メモ化された値の計算
  const novelTags = useMemo(() => {
    return novel.tags
      .map(tagId => tags.find(t => t.id === tagId))
      .filter(Boolean) as { id: string; name: string }[];
  }, [novel.tags, tags]);

  const bodyPreview = useMemo(() => {
    return novel.body.trim().substring(0, 100);
  }, [novel.body]);

  const showFolderChip = useMemo(() => {
    return folderName && drawerWidth > 250;
  }, [folderName, drawerWidth]);

  const showTags = useMemo(() => {
    return novel.tags.length > 0 && drawerWidth > 250;
  }, [novel.tags.length, drawerWidth]);

  const showFullDate = useMemo(() => {
    return drawerWidth > 300;
  }, [drawerWidth]);

  const dateText = useMemo(() => {
    if (showFullDate) {
      return `作成: ${formatDate(novel.createdAt)} / 更新: ${formatDate(novel.updatedAt)}`;
    }
    return formatDate(novel.updatedAt);
  }, [showFullDate, novel.createdAt, novel.updatedAt]);

  // 同期状態の表示
  const syncStatus = useMemo(() => {
    if (!showSyncStatus) return null;

    if (novel.isSyncing) {
      return (
        <Tooltip title="同期中...">
          <CloudSyncIcon 
            sx={{ 
              fontSize: 16, 
              color: 'primary.main',
              animation: 'spin 1s linear infinite'
            }} 
          />
        </Tooltip>
      );
    }

    if (novel.lastSyncAt) {
      const lastSync = new Date(novel.lastSyncAt);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      const isRecent = timeDiff < 5 * 60 * 1000; // 5分以内

      return (
        <Tooltip title={`最終同期: ${lastSync.toLocaleString()}`}>
          <CloudSyncIcon 
            sx={{ 
              fontSize: 16, 
              color: isRecent ? 'success.main' : 'warning.main'
            }} 
          />
        </Tooltip>
      );
    }

    return (
      <Tooltip title="未同期">
        <CloudOffIcon 
          sx={{ 
            fontSize: 16, 
            color: 'text.disabled'
          }} 
        />
      </Tooltip>
    );
  }, [novel.isSyncing, novel.lastSyncAt, showSyncStatus]);

  return (
    <ListItem 
      divider 
      alignItems="flex-start"
      onClick={handleClick}
      sx={{ 
        cursor: onSelect ? 'pointer' : 'default',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: onSelect ? 'action.hover' : 'transparent'
        }
      }}
    >
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1} sx={{ flexWrap: 'wrap' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 'bold',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {novel.title}
            </Typography>
            {syncStatus}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.4
              }}
            >
              {bodyPreview}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {showFolderChip && (
                <Chip 
                  label={folderName} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              {showTags && novelTags.slice(0, 2).map(tag => (
                <Chip 
                  key={tag.id} 
                  label={tag.name} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {showTags && novelTags.length > 2 && (
                <Chip 
                  label={`+${novelTags.length - 2}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              {dateText}
              {novel.version > 1 && (
                <span style={{ marginLeft: 8 }}>
                  v{novel.version}
                </span>
              )}
            </Typography>
          </Box>
        }
      />
      
      {showActions && (
        <ListItemSecondaryAction>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              edge="end" 
              size="small"
              onClick={handleEdit}
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light' }
              }}
            >
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton 
              edge="end" 
              size="small"
              onClick={handleDelete}
              sx={{ 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.light' }
              }}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

export default NovelListItem; 