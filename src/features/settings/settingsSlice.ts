import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FontSize = 'small' | 'medium' | 'large';

interface SettingsState {
  fontSize: FontSize;
  wordCountDisplay: boolean;
  lineNumbers: boolean;
  // autoSave: boolean;
  // spellCheck: boolean;
  // autoComplete: boolean;
}

const initialState: SettingsState = {
  fontSize: 'medium',
  wordCountDisplay: true,
  lineNumbers: false,
  // autoSave: true,
  // spellCheck: false,
  // autoComplete: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setFontSize: (state, action: PayloadAction<FontSize>) => {
      state.fontSize = action.payload;
    },
    // setAutoSave: (state, action: PayloadAction<boolean>) => {
    //   state.autoSave = action.payload;
    // },
    setWordCountDisplay: (state, action: PayloadAction<boolean>) => {
      state.wordCountDisplay = action.payload;
    },
    setLineNumbers: (state, action: PayloadAction<boolean>) => {
      state.lineNumbers = action.payload;
    },
    // setSpellCheck: (state, action: PayloadAction<boolean>) => {
    //   state.spellCheck = action.payload;
    // },
    // setAutoComplete: (state, action: PayloadAction<boolean>) => {
    //   state.autoComplete = action.payload;
    // },
    setSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
    clearSettings: (state) => {
      return { ...initialState };
    },
  },
});

export const {
  setFontSize,
  // setAutoSave,
  setWordCountDisplay,
  setLineNumbers,
  // setSpellCheck,
  // setAutoComplete,
  setSettings,
  clearSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer; 