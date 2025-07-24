import React from 'react';
import { TextField, MenuItem, IconButton, Box, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Props {
  value: string;
  options: { id: string; name: string }[];
  onChange: (folderId: string) => void;
  onCreate: (name: string) => void;
  onEdit?: (folderId: string, name: string) => void;
  onDelete?: (folderId: string) => void;
  size?: 'small' | 'medium';
}

const FolderSelector: React.FC<Props> = ({ value, options, onChange, onCreate, onEdit, onDelete, size = 'medium' }) => {
  const selectedFolder = options.find(f => f.id === value);
  return (
    <TextField
      select
      label="フォルダ"
      value={value}
      onChange={e => onChange(e.target.value)}
      size={size}
      fullWidth
      margin="dense"
      InputProps={{
        endAdornment: (
          <>
            {onEdit && selectedFolder && (
              <IconButton size="small" sx={{ ml: 0.5 }} onClick={e => { e.stopPropagation(); onEdit(selectedFolder.id, selectedFolder.name); }}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && selectedFolder && (
              <IconButton size="small" sx={{ ml: 0.5 }} onClick={e => { e.stopPropagation(); onDelete(selectedFolder.id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )
      }}
    >
      {options.map(folder => (
        <MenuItem key={folder.id} value={folder.id}>
          {folder.name}
        </MenuItem>
      ))}
      <MenuItem value="__create__" onClick={() => onCreate(prompt('新しいフォルダ名を入力してください') || '')}>
        + 新規作成
      </MenuItem>
    </TextField>
  );
};

export default FolderSelector; 