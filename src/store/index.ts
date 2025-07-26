import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import novelsReducer from '../features/novels/novelsSlice';
import foldersReducer from '../features/folders/foldersSlice';
import tagsReducer from '../features/tags/tagsSlice';
import settingsReducer from '../features/settings/settingsSlice';
import themeReducer from '../features/theme/themeSlice';
import googleDriveSyncReducer from '../features/googleDriveSync/googleDriveSyncSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['novels', 'folders', 'tags', 'settings', 'theme', 'googleDriveSync']
};

const persistedReducer = persistReducer(persistConfig, (state: any, action: any) => {
  // 各スライスを個別に永続化
  const novels = persistReducer({ key: 'novels', storage }, novelsReducer)(state?.novels, action);
  const folders = persistReducer({ key: 'folders', storage }, foldersReducer)(state?.folders, action);
  const tags = persistReducer({ key: 'tags', storage }, tagsReducer)(state?.tags, action);
  const settings = persistReducer({ key: 'settings', storage }, settingsReducer)(state?.settings, action);
  const theme = persistReducer({ key: 'theme', storage }, themeReducer)(state?.theme, action);
  const googleDriveSync = persistReducer({ key: 'googleDriveSync', storage }, googleDriveSyncReducer)(state?.googleDriveSync, action);

  return {
    novels,
    folders,
    tags,
    settings,
    theme,
    googleDriveSync
  };
});

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 