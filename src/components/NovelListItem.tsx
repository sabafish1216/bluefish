import React, { useMemo } from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  tags = []
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
                fontSize: '1.25rem',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {novel.title}
            </Typography>
            {showFolderChip && (
              <Chip label={folderName} size="small" color="secondary" />
            )}
          </Box>
        }
        secondary={
          <Box display="flex" flexDirection="column" gap={1} sx={{ mt: 1 }}>
            {/* 本文の書き出し */}
            {bodyPreview && (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  lineHeight: 1.3
                }}
              >
                {bodyPreview}
              </Typography>
            )}
            {showTags && (
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {novelTags.map(tag => (
                  <Chip key={tag.id} label={tag.name} size="small" />
                ))}
              </Box>
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: 'text.secondary'
              }}
            >
              {dateText}
            </Typography>
          </Box>
        }
      />
      {showActions && (
        <ListItemSecondaryAction>
          {onEdit && (
            <IconButton 
              edge="end" 
              aria-label="edit" 
              onClick={handleEdit}
              size="small"
            >
              <EditIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton 
              edge="end" 
              aria-label="delete" 
              onClick={handleDelete}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

export default React.memo(NovelListItem); 