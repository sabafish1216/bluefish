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

export function useGoogleDriveSync() {
  const dispatch = useDispatch();
  const { syncNovelData, getNovelData, signIn } = useGoogleDriveGIS();
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
        // Reduxの状態を更新（実際の実装では適切なactionをdispatch）
        console.log('Google Driveからデータを取得:', data);
        // TODO: Reduxの状態を更新する処理を実装
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

  // 5分ごとの自動同期を開始
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      syncToDrive();
    }, 5 * 60 * 1000); // 5分
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

  return {
    syncStatus,
    signInToDrive,
    manualSync,
    startAutoSync,
    stopAutoSync,
    syncToDrive,
    syncFromDrive,
  };
} 