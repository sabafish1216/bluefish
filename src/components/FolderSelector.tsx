import React from 'react';
import { TextField, MenuItem } from '@mui/material';

interface Props {
  value: string;
  options: { id: string; name: string }[];
  onChange: (folderId: string) => void;
  onCreate: () => void;
  size?: 'small' | 'medium';
}

const FolderSelector: React.FC<Props> = ({ value, options, onChange, onCreate, size = 'medium' }) => {
  return (
    <TextField
      select
      label="フォルダ"
      value={value}
      onChange={e => onChange(e.target.value)}
      size={size}
      fullWidth
      margin="dense"
    >
      {options.map(folder => (
        <MenuItem key={folder.id} value={folder.id}>
          {folder.name}
        </MenuItem>
      ))}
      <MenuItem value="__create__" onClick={() => onCreate()}>
        + 新規作成
      </MenuItem>
    </TextField>
  );
};

export default FolderSelector; 