import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import novelsReducer from '../features/novels/novelsSlice';
import tagsReducer from '../features/tags/tagsSlice';
import foldersReducer from '../features/folders/foldersSlice';
import themeReducer from '../features/theme/themeSlice';
import settingsReducer from '../features/settings/settingsSlice';

const rootReducer = combineReducers({
  novels: novelsReducer,
  tags: tagsReducer,
  folders: foldersReducer,
  theme: themeReducer,
  settings: settingsReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['novels', 'tags', 'folders', 'theme', 'settings'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 