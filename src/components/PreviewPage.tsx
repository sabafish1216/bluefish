import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface PreviewPageProps {
  body: string;
  onBack: () => void;
}

const PreviewPage: React.FC<PreviewPageProps> = ({ body, onBack }) => {
  return (
    <Box sx={{ width: '100%', height: '100%', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Paper sx={{ width: '100%', maxWidth: 700, minHeight: 400, p: 4, fontFamily: 'monospace', fontSize: 16, lineHeight: 1.6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="outlined" size="small">
            戻る
          </Button>
        </Box>
        <Box sx={{ maxHeight: 500, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <Typography component="div">
            {body}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PreviewPage; 