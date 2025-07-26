import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GoogleDriveSyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
  isSignedIn: boolean;
}

const initialState: GoogleDriveSyncState = {
  isSyncing: false,
  lastSyncTime: null,
  error: null,
  isSignedIn: false,
};

const googleDriveSyncSlice = createSlice({
  name: 'googleDriveSync',
  initialState,
  reducers: {
    setIsSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    setLastSyncTime(state, action: PayloadAction<string | null>) {
      state.lastSyncTime = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setIsSignedIn(state, action: PayloadAction<boolean>) {
      state.isSignedIn = action.payload;
    },
    resetSyncState(state) {
      state.isSyncing = false;
      state.lastSyncTime = null;
      state.error = null;
      state.isSignedIn = false;
    }
  }
});

export const {
  setIsSyncing,
  setLastSyncTime,
  setError,
  setIsSignedIn,
  resetSyncState
} = googleDriveSyncSlice.actions;

export default googleDriveSyncSlice.reducer; 