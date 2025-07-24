import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface ExpandableSectionProps {
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  id?: string;
  editable?: boolean;
  deletable?: boolean;
  onEdit?: (id: string, name: string) => void;
  onDelete?: (id: string, name: string) => void;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  count,
  isExpanded,
  onToggle,
  children,
  id,
  editable,
  deletable,
  onEdit,
  onDelete
}) => {
  return (
    <Box>
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'action.hover', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {editable && onEdit && id && (
            <IconButton size="small" sx={{ mr: 0.5 }} onClick={e => { e.stopPropagation(); onEdit(id, title); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {deletable && onDelete && id && (
            <IconButton size="small" sx={{ mr: 1 }} onClick={e => { e.stopPropagation(); onDelete(id, title); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="subtitle2">
            {title} {count !== undefined && `(${count})`}
          </Typography>
        </Box>
        <Box onClick={onToggle} sx={{ display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>
      {isExpanded && children}
    </Box>
  );
};

export default ExpandableSection; 