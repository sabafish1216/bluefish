import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import {
  Add as AddIcon,
  Title as TitleIcon,
  TextFields as RubyIcon
} from '@mui/icons-material';

interface SpecialTextButton {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
}

interface SpecialTextButtonsProps {
  onInsertPageBreak: () => void;
  onInsertChapterTitle: () => void;
  onInsertRuby: () => void;
}

const SpecialTextButtons: React.FC<SpecialTextButtonsProps> = ({
  onInsertPageBreak,
  onInsertChapterTitle,
  onInsertRuby
}) => {
  const buttons: SpecialTextButton[] = [
    {
      icon: <AddIcon />,
      tooltip: 'ページ区切りを挿入',
      onClick: onInsertPageBreak
    },
    {
      icon: <TitleIcon />,
      tooltip: '章タイトルを挿入',
      onClick: onInsertChapterTitle
    },
    {
      icon: <RubyIcon />,
      tooltip: 'ルビを挿入',
      onClick: onInsertRuby
    }
  ];

  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 16, 
      right: 16, 
      display: 'flex', 
      gap: 1, 
      zIndex: 1 
    }}>
      {buttons.map((button, index) => (
        <Tooltip key={index} title={button.tooltip}>
          <Button
            variant="outlined"
            size="small"
            onClick={button.onClick}
            sx={{ 
              minWidth: 'auto', 
              width: 40, 
              height: 40, 
              p: 0,
              borderRadius: 2
            }}
          >
            {button.icon}
          </Button>
        </Tooltip>
      ))}
    </Box>
  );
};

export default SpecialTextButtons; 