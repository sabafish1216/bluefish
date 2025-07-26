/**
 * アクションボタンコンポーネント
 * @author sabafish1028
 * @version 1.0.0-beta
 * @since 2025-07-20
 * @updated 2025-07-20
 * @description アクションボタンのコンポーネント
 */

import React from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

/**
 * アクションボタンの型
 * @param {ActionButtonsProps} props - プロパティ
 * @param {ActionButton[]} props.buttons - ボタンの配列
 * @param {number} props.gap - ボタン間のスペース
 * @param {'center' | 'flex-start' | 'flex-end'} props.justifyContent - ボタンの配置
 * @param {number} props.mb - ボタンの下部マージン
 */
interface ActionButton {
  icon: SvgIconComponent;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  tooltip: string;
  onClick: () => void;
}

/**
 * アクションボタン配列の型
 * @param {ActionButton[]} buttons - ボタンの配列
 * @param {number} gap - ボタン間のスペース
 * @param {'center' | 'flex-start' | 'flex-end'} justifyContent - ボタンの配置
 * @param {number} mb - ボタンの下部マージン
 */
interface ActionButtonsProps {
  buttons: ActionButton[];
  gap?: number;
  justifyContent?: 'center' | 'flex-start' | 'flex-end';
  mb?: number;
}

/**
 * アクションボタン配列のコンポーネント
 * @param {ActionButtonsProps} props - プロパティ
 * @param {ActionButton[]} props.buttons - ボタンの配列
 * @param {number} props.gap - ボタン間のスペース
 * @param {'center' | 'flex-start' | 'flex-end'} props.justifyContent - ボタンの配置
 * @param {number} props.mb - ボタンの下部マージン
 */
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