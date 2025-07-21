import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface PreviewPageProps {
  body: string;
}

const PreviewPage: React.FC<PreviewPageProps> = ({ body }) => {
  return (
    <Box sx={{ width: '100%', height: '100%', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Paper sx={{ width: '100%', maxWidth: 700, minHeight: 400, p: 4, fontFamily: 'monospace', fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        <Typography component="div">
          {body}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PreviewPage; 