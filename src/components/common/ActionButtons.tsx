import React from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface ActionButton {
  icon: SvgIconComponent;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  tooltip: string;
  onClick: () => void;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  gap?: number;
  justifyContent?: 'center' | 'flex-start' | 'flex-end';
  mb?: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  buttons, 
  gap = 2, 
  justifyContent = 'center',
  mb = 2 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap, 
      mb, 
      justifyContent 
    }}>
      {buttons.map((button, index) => {
        const Icon = button.icon;
        return (
          <Tooltip key={index} title={button.tooltip}>
            <Fab
              size="medium"
              color={button.color}
              onClick={button.onClick}
              sx={{ minWidth: 40, width: 40, height: 40 }}
            >
              <Icon />
            </Fab>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default ActionButtons; 