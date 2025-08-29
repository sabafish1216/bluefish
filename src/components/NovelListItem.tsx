import React, { useMemo } from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Box, Typography, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Novel } from '../features/novels/novelsSlice';

interface Props {
  novel: Novel;
  folderName?: string;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  showActions?: boolean;
  drawerWidth?: number;
  tags?: { id: string; name: string }[];
}

const formatDate = (date: string) => new Date(date).toLocaleDateString();

const NovelListItem: React.FC<Props> = ({ 
  novel, 
  folderName, 
  onDelete, 
  isSelected = false, 
  onSelect, 
  showActions = true,
  drawerWidth = 380,
  tags = []
}) => {
  const handleClick = React.useCallback(() => {
    if (onSelect) {
      onSelect(novel.id);
    }
  }, [onSelect, novel.id]);

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
    return novel.body?.trim()?.substring(0, 100) || '';
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
            {/* {novel.isSyncing && (
              <CircularProgress 
                size={16} 
                sx={{ 
                  color: 'primary.main',
                  ml: 1
                }} 
              />
            )} */}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              component="div"
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
              component="div"
              sx={{ fontSize: '0.7rem' }}
            >
              {dateText}
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