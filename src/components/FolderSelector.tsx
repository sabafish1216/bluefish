import React, { useState } from 'react';
import { Box, TextField, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface Props {
  value: string;
  options: { id: string; name: string }[];
  onChange: (folderId: string) => void;
  onCreate: (name: string) => void;
}

const FolderSelector: React.FC<Props> = ({ value, options, onChange, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <Box>
      <TextField
        select
        label="フォルダ"
        value={value}
        onChange={e => onChange(e.target.value)}
        fullWidth
        sx={{ mb: 1 }}
      >
        <MenuItem value="">未分類</MenuItem>
        {options.map(f => (
          <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
        ))}
      </TextField>
      <Button size="small" onClick={() => setOpen(true)}>新しいフォルダを作成</Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { minWidth: 400, maxWidth: 600 } }}>
        <DialogTitle>新しいフォルダ</DialogTitle>
        <DialogContent sx={{ minHeight: 100, pt: 3, pb: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <TextField
            label="フォルダ名"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(''); setOpen(false); } }}>作成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderSelector; 