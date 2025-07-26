import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Folder = {
  id: string;
  name: string;
};

interface FoldersState {
  folders: Folder[];
}

const initialState: FoldersState = {
  folders: [],
};

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    addFolder: (state, action: PayloadAction<Folder>) => {
      state.folders.push(action.payload);
    },
    deleteFolder: (state, action: PayloadAction<string>) => {
      state.folders = state.folders.filter(f => f.id !== action.payload);
    },
    updateFolder: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.id);
      if (folder) {
        folder.name = action.payload.name;
      }
    },
    setFolders: (state, action: PayloadAction<Folder[]>) => {
      state.folders = action.payload;
    },
  },
});

export const { addFolder, deleteFolder, updateFolder, setFolders } = foldersSlice.actions;
export default foldersSlice.reducer; 