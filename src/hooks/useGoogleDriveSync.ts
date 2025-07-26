import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGoogleDriveGIS } from './useGoogleDriveGIS';
import {
  setIsSyncing,
  setLastSyncTime,
  setError,
  setIsSignedIn,
} from '../features/googleDriveSync/googleDriveSyncSlice';
import { setNovels } from '../features/novels/novelsSlice';
import { setFolders } from '../features/folders/foldersSlice';
import { setTags } from '../features/tags/tagsSlice';
import { setSettings } from '../features/settings/settingsSlice';

export function useGoogleDriveSync() {
  const dispatch = useDispatch();
  const { syncNovelData, getNovelData, signIn, checkAuthStatus } = useGoogleDriveGIS();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reduxの状態を取得
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const settings = useSelector((state: RootState) => state.settings);
  const syncStatus = useSelector((state: RootState) => state.googleDriveSync);

  // 全データを取得
  const getAllData = useCallback(() => {
    return {
      novels,
      folders,
      tags,
      settings,
      lastSync: new Date().toISOString(),
    };
  }, [novels, folders, tags, settings]);

  // Google Driveに同期
  const syncToDrive = useCallback(async () => {
    if (!syncStatus.isSignedIn) return;
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      const data = getAllData();
      await syncNovelData(data);
      dispatch(setIsSyncing(false));
      dispatch(setLastSyncTime(new Date().toISOString()));
      dispatch(setError(null));
      console.log('Google Drive同期完了');
    } catch (error) {
      console.error('Google Drive同期エラー:', error);
      dispatch(setIsSyncing(false));
      dispatch(setError(error instanceof Error ? error.message : '同期エラーが発生しました'));
    }
  }, [syncStatus.isSignedIn, syncNovelData, getAllData, dispatch]);

  // Google Driveからデータを取得
  const syncFromDrive = useCallback(async () => {
    if (!syncStatus.isSignedIn) return;
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      const data = await getNovelData();
      if (data) {
        // Reduxの状態を更新
        console.log('Google Driveからデータを取得:', data);
        
        // 各データをReduxに反映
        if (data.novels) {
          dispatch(setNovels(data.novels));
        }
        if (data.folders) {
          dispatch(setFolders(data.folders));
        }
        if (data.tags) {
          dispatch(setTags(data.tags));
        }
        if (data.settings) {
          dispatch(setSettings(data.settings));
        }
      }
      dispatch(setIsSyncing(false));
      dispatch(setLastSyncTime(new Date().toISOString()));
      dispatch(setError(null));
      console.log('Google Driveからの取得完了');
    } catch (error) {
      console.error('Google Driveからの取得エラー:', error);
      dispatch(setIsSyncing(false));
      dispatch(setError(error instanceof Error ? error.message : 'データ取得エラーが発生しました'));
    }
  }, [syncStatus.isSignedIn, getNovelData, dispatch]);

  // 手動同期
  const manualSync = useCallback(async () => {
    await syncToDrive();
  }, [syncToDrive]);

  // 30分ごとの自動同期を開始
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      syncToDrive();
    }, 30 * 60 * 1000); // 30分
  }, [syncToDrive]);

  // 自動同期を停止
  const stopAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Google Driveにサインイン
  const signInToDrive = useCallback(async () => {
    try {
      await signIn(() => {
        dispatch(setIsSignedIn(true));
        syncFromDrive();
        startAutoSync();
      });
    } catch (error) {
      console.error('Google Driveサインインエラー:', error);
      dispatch(setError(error instanceof Error ? error.message : 'サインインエラーが発生しました'));
    }
  }, [signIn, syncFromDrive, startAutoSync, dispatch]);

  // ネットワーク復帰時の同期
  useEffect(() => {
    const handleOnline = () => {
      if (syncStatus.isSignedIn) {
        console.log('ネットワーク復帰 - 同期を実行');
        syncToDrive();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncStatus.isSignedIn, syncToDrive]);

  // アプリ終了時の同期
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (syncStatus.isSignedIn) {
        // 注意: beforeunloadでは非同期処理が完了しない可能性がある
        console.log('アプリ終了 - 同期を実行');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus.isSignedIn]);

  // コンポーネントアンマウント時に自動同期を停止
  useEffect(() => {
    return () => {
      stopAutoSync();
    };
  }, [stopAutoSync]);

  // アプリ起動時の認証状態チェックとデータ同期
  useEffect(() => {
    const checkAuthAndSync = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        if (isAuthenticated && !syncStatus.isSignedIn) {
          console.log('リロード後 - 認証状態を復元');
          dispatch(setIsSignedIn(true));
          syncFromDrive();
          startAutoSync();
        } else if (syncStatus.isSignedIn) {
          console.log('アプリ起動 - Google Driveからデータを取得');
          syncFromDrive();
        }
      } catch (error) {
        console.error('認証状態チェックエラー:', error);
      }
    };

    checkAuthAndSync();
  }, [syncStatus.isSignedIn, syncFromDrive, startAutoSync, checkAuthStatus, dispatch]);

  return {
    syncStatus,
    signInToDrive,
    manualSync,
    startAutoSync,
    stopAutoSync,
    syncFromDrive,
  };
} 