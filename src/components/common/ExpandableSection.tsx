import React from 'react';
import { Box, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

interface ExpandableSectionProps {
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  count,
  isExpanded,
  onToggle,
  children
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
        onClick={onToggle}
      >
        <Typography variant="subtitle2">
          {title} {count !== undefined && `(${count})`}
        </Typography>
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      {isExpanded && children}
    </Box>
  );
};

export default ExpandableSection; 