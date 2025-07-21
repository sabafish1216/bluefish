import React from 'react';
import { Chip, TextField, Autocomplete, Box, Typography } from '@mui/material';

interface Props {
  value: string[];
  options: string[];
  onChange: (tags: string[]) => void;
  onCreate: (tag: string) => void;
  tagCounts?: { [key: string]: number };
  size?: 'small' | 'medium';
}

const TagSelector: React.FC<Props> = ({ value, options, onChange, onCreate, tagCounts = {}, size = 'medium' }) => {
  // 件数順（降順）でソート
  const sortedOptions = [...options].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));
  
  return (
    <Autocomplete
      multiple
      freeSolo
      options={sortedOptions}
      value={value}
      onChange={(_, newValue) => {
        const added = newValue.filter(v => !options.includes(v));
        if (added.length > 0) added.forEach(onCreate);
        onChange(newValue);
      }}
      size={size}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
        ))
      }
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Typography>{option}</Typography>
            <Typography variant="caption" color="text.secondary">
              {tagCounts[option] || 0}件
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={params => <TextField {...params} label="タグ" placeholder="タグを追加" size={size} />}
    />
  );
};

export default TagSelector; 