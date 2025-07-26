import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Novel = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  folderId: string;
  createdAt: string;
  updatedAt: string;
};

interface NovelsState {
  novels: Novel[];
}

const initialState: NovelsState = {
  novels: [],
};

const novelsSlice = createSlice({
  name: 'novels',
  initialState,
  reducers: {
    addNovel: (state, action: PayloadAction<Novel>) => {
      state.novels.push(action.payload);
    },
    updateNovel: (state, action: PayloadAction<Novel>) => {
      const idx = state.novels.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) state.novels[idx] = action.payload;
    },
    deleteNovel: (state, action: PayloadAction<string>) => {
      state.novels = state.novels.filter(n => n.id !== action.payload);
    },
    setNovels: (state, action: PayloadAction<Novel[]>) => {
      state.novels = action.payload;
    },
  },
});

export const { addNovel, updateNovel, deleteNovel, setNovels } = novelsSlice.actions;
export default novelsSlice.reducer; 