import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Novel = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  folderId: string;
  createdAt: string;
  updatedAt: string;
  // 同期用の追加フィールド
  version: number;           // バージョン番号（競合解決用）
  lastSyncAt: string | null; // 最後の同期時刻
  isSyncing: boolean;        // 同期中フラグ
};

interface NovelsState {
  novels: Novel[];
}

const initialState: NovelsState = {
  novels: [],
};

// 既存データのマイグレーション関数
const migrateNovel = (novel: any): Novel => {
  // 既存のフィールドが存在しない場合のデフォルト値
  const defaultNovel: Novel = {
    id: novel.id || '',
    title: novel.title || '',
    body: novel.body || '',
    tags: novel.tags || [],
    folderId: novel.folderId || '',
    createdAt: novel.createdAt || new Date().toISOString(),
    updatedAt: novel.updatedAt || new Date().toISOString(),
    version: novel.version || 1,
    lastSyncAt: novel.lastSyncAt || null,
    isSyncing: novel.isSyncing || false,
  };

  return defaultNovel;
};

const novelsSlice = createSlice({
  name: 'novels',
  initialState,
  reducers: {
    addNovel: (state, action: PayloadAction<Novel>) => {
      const novel = {
        ...action.payload,
        version: 1,
        lastSyncAt: null,
        isSyncing: false
      };
      state.novels.push(novel);
    },
    updateNovel: (state, action: PayloadAction<Novel>) => {
      const idx = state.novels.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) {
        const currentNovel = state.novels[idx];
        state.novels[idx] = {
          ...action.payload,
          version: currentNovel.version + 1,
          lastSyncAt: null,
          isSyncing: false
        };
      }
    },
    deleteNovel: (state, action: PayloadAction<string>) => {
      state.novels = state.novels.filter(n => n.id !== action.payload);
    },
    setNovels: (state, action: PayloadAction<Novel[]>) => {
      // マイグレーションを適用
      state.novels = action.payload.map(migrateNovel);
    },
    clearNovels: (state) => {
      state.novels = [];
    },
    // 同期用のアクション
    setNovelSyncing: (state, action: PayloadAction<{ id: string; isSyncing: boolean }>) => {
      const idx = state.novels.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) {
        state.novels[idx].isSyncing = action.payload.isSyncing;
      }
    },
    setNovelLastSync: (state, action: PayloadAction<{ id: string; lastSyncAt: string }>) => {
      const idx = state.novels.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) {
        state.novels[idx].lastSyncAt = action.payload.lastSyncAt;
      }
    },
    // 競合解決用のアクション
    resolveNovelConflict: (state, action: PayloadAction<{ id: string; novel: Novel; resolvedVersion: number }>) => {
      const idx = state.novels.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) {
        state.novels[idx] = {
          ...action.payload.novel,
          version: action.payload.resolvedVersion,
          lastSyncAt: new Date().toISOString(),
          isSyncing: false
        };
      }
    },
    // マイグレーション用のアクション
    migrateNovels: (state) => {
      state.novels = state.novels.map(migrateNovel);
    },
  },
});

export const { 
  addNovel, 
  updateNovel, 
  deleteNovel, 
  setNovels, 
  clearNovels,
  setNovelSyncing,
  setNovelLastSync,
  resolveNovelConflict,
  migrateNovels
} = novelsSlice.actions;
export default novelsSlice.reducer; 