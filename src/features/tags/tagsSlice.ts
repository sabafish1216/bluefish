import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Tag = {
  id: string;
  name: string;
};

interface TagsState {
  tags: Tag[];
}

const initialState: TagsState = {
  tags: [],
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    addTag: (state, action: PayloadAction<Tag>) => {
      if (!state.tags.find(t => t.name === action.payload.name)) {
        state.tags.push(action.payload);
      }
    },
    deleteTag: (state, action: PayloadAction<string>) => {
      state.tags = state.tags.filter(t => t.id !== action.payload);
    },
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
    },
    clearTags: (state) => {
      state.tags = [];
    },
  },
});

export const { addTag, deleteTag, setTags, clearTags } = tagsSlice.actions;
export default tagsSlice.reducer; 