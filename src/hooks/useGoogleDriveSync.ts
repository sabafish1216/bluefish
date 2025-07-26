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
  const hasInitializedRef = useRef(false);

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
    console.log('Google Drive同期開始:', new Date().toLocaleString());
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      const data = getAllData();
      await syncNovelData(data);
      dispatch(setIsSyncing(false));
      dispatch(setLastSyncTime(new Date().toISOString()));
      dispatch(setError(null));
      console.log('Google Drive同期完了:', new Date().toLocaleString());
    } catch (error) {
      console.error('Google Drive同期エラー:', error);
      dispatch(setIsSyncing(false));
      dispatch(setError(error instanceof Error ? error.message : '同期エラーが発生しました'));
    }
  }, [syncStatus.isSignedIn, syncNovelData, getAllData, dispatch]);

  // Google Driveからデータを取得
  const syncFromDrive = useCallback(async () => {
    if (!syncStatus.isSignedIn) return;
    console.log('syncFromDrive 実行開始:', new Date().toLocaleString());
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
      console.log('Google Driveからの取得完了:', new Date().toLocaleString());
    } catch (error) {
      console.error('Google Driveからの取得エラー:', error);
      dispatch(setIsSyncing(false));
      
      // エラーメッセージを詳細化
      let errorMessage = 'データ取得エラーが発生しました';
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('insufficientFilePermissions')) {
          errorMessage = 'Google Drive APIの設定に問題があります。管理者に連絡してください。';
        } else {
          errorMessage = error.message;
        }
      }
      dispatch(setError(errorMessage));
    }
  }, [syncStatus.isSignedIn, getNovelData, dispatch]);

  // 手動同期
  const manualSync = useCallback(async () => {
    console.log('手動同期を実行:', new Date().toLocaleString());
    await syncToDrive();
  }, [syncToDrive]);

  // 60分ごとの自動同期を開始
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('自動同期を開始 - 60分間隔');
    intervalRef.current = setInterval(() => {
      console.log('自動同期を実行 - 60分間隔');
      syncToDrive();
    }, 60 * 60 * 1000); // 60分
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
    if (hasInitializedRef.current) {
      console.log('useEffect already initialized, skipping...');
      return;
    }

    const checkAuthAndSync = async () => {
      try {
        hasInitializedRef.current = true;
        console.log('useEffect 実行開始');
        
        const isAuthenticated = await checkAuthStatus();
        if (isAuthenticated && !syncStatus.isSignedIn) {
          console.log('リロード後 - 認証状態を復元');
          dispatch(setIsSignedIn(true));
          // エラーが発生した場合の処理を追加
          try {
            await syncFromDrive();
            startAutoSync();
          } catch (syncError) {
            console.error('同期エラー - 認証状態をリセット:', syncError);
            dispatch(setIsSignedIn(false));
            dispatch(setError('同期に失敗しました。再度サインインしてください。'));
          }
        } else if (syncStatus.isSignedIn) {
          console.log('アプリ起動 - Google Driveからデータを取得');
          try {
            await syncFromDrive();
          } catch (syncError) {
            console.error('同期エラー - 認証状態をリセット:', syncError);
            dispatch(setIsSignedIn(false));
            dispatch(setError('同期に失敗しました。再度サインインしてください。'));
          }
        }
      } catch (error) {
        console.error('認証状態チェックエラー:', error);
      }
    };

    checkAuthAndSync();
  }, []); // 空の依存配列で初回のみ実行

  return {
    syncStatus,
    signInToDrive,
    manualSync,
    startAutoSync,
    stopAutoSync,
    syncFromDrive,
  };
} 