/**
 * 空表示コンポーネント
 * @author sabafish1028
 * @version 0.2.0
 * @since 2025-07-20
 * @updated 2025-07-20
 * @description 何もコンテンツがない場合に表示するアイコン・テキストのコンポーネント
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

/**
 * 空表示コンポーネントの型
 * @param {SvgIconComponent} icon - アイコン
 * @param {string} title - タイトル
 * @param {string} description - 説明
 * @param {string} height - 高さ
 */
interface EmptyStateProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
  height?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  height = 'calc(100vh - 200px)' 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height, 
      p: 4 
    }}>
      <Icon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {description}
      </Typography>
    </Box>
  );
};

export default EmptyState; 