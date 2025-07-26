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
    console.log('=== syncFromDrive 実行開始 ===');
    console.log('syncFromDrive 実行開始:', new Date().toLocaleString());
    
    // 認証状態を再確認
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      console.log('認証状態が無効のため、同期をスキップ');
      dispatch(setIsSyncing(false));
      dispatch(setIsSignedIn(false));
      dispatch(setError('認証が必要です。Google Driveにサインインしてください。'));
      return;
    }
    
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      const data = await getNovelData();
      if (data) {
        // Reduxの状態を更新
        console.log('Google Driveからデータを取得:', {
          novelCount: data.novels?.length || 0,
          folderCount: data.folders?.length || 0,
          novelTitles: data.novels?.map((n: any) => n.title).slice(0, 3) || []
        });
        
        // 現在のRedux状態を確認
        const currentData = getAllData();
        console.log('更新前のRedux状態:', {
          novelCount: currentData.novels?.length || 0,
          novelTitles: currentData.novels?.map((n: any) => n.title).slice(0, 3) || []
        });
        
        // 各データをReduxに反映
        if (data.novels) {
          console.log('Google Driveの小説データをReduxに設定:', data.novels.length + '件');
          dispatch(setNovels(data.novels));
        }
        if (data.folders) {
          console.log('Google DriveのフォルダデータをReduxに設定:', data.folders.length + '件');
          dispatch(setFolders(data.folders));
        }
        if (data.tags) {
          console.log('Google DriveのタグデータをReduxに設定:', data.tags.length + '件');
          dispatch(setTags(data.tags));
        }
        if (data.settings) {
          console.log('Google Driveの設定データをReduxに設定');
          dispatch(setSettings(data.settings));
        }
        
        console.log('=== Google DriveデータでReduxを更新完了 ===');
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
      
      if (error && typeof error === 'object' && 'result' in error && error.result && typeof error.result === 'object' && 'error' in error.result) {
        const apiError = (error.result as any).error;
        console.log('APIエラー詳細:', apiError);
        
        if (apiError.code === 403) {
          if (apiError.message && apiError.message.includes('insufficientFilePermissions')) {
            errorMessage = 'Google Drive APIの権限が不足しています。OAuth同意画面の設定とテストユーザーの追加を確認してください。';
          } else if (apiError.message && apiError.message.includes('blocked')) {
            errorMessage = 'APIキーが制限されています。HTTPリファラーの設定を確認してください。';
          } else {
            errorMessage = 'Google Drive APIへのアクセスが拒否されました。APIキーの設定を確認してください。';
          }
        } else if (apiError.code === 401) {
          errorMessage = '認証が無効です。再度サインインしてください。';
        }
      } else if (error instanceof Error) {
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

  // 5分ごとの自動同期を開始
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('自動同期を開始 - 5分間隔');
    intervalRef.current = setInterval(() => {
      console.log('自動同期を実行 - 5分間隔');
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
      // 既存のトークンをクリア
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null);
      }
      
      await signIn(async () => {
        dispatch(setIsSignedIn(true));
        dispatch(setError(null)); // エラーをクリア
        
        // 保留中の同期データがあるかチェック
        const pendingSyncData = localStorage.getItem('pending_sync_data');
        const pendingSyncTimestamp = localStorage.getItem('pending_sync_timestamp');
        
        if (pendingSyncData && pendingSyncTimestamp) {
          console.log('保留中の同期データを確認');
          try {
            const pendingData = JSON.parse(pendingSyncData);
            const pendingTime = parseInt(pendingSyncTimestamp);
            
            console.log('保留データの詳細:', {
              timestamp: new Date(pendingTime).toLocaleString(),
              novelCount: pendingData.novels?.length || 0,
              folderCount: pendingData.folders?.length || 0
            });
            
            // 保留データを直接Reduxに反映（新しいデータを優先）
            console.log('保留データをReduxに反映');
            if (pendingData.novels) dispatch(setNovels(pendingData.novels));
            if (pendingData.folders) dispatch(setFolders(pendingData.folders));
            if (pendingData.tags) dispatch(setTags(pendingData.tags));
            if (pendingData.settings) dispatch(setSettings(pendingData.settings));
            
            // 保留データをGoogle Driveに同期
            console.log('保留データをGoogle Driveに同期');
            await syncNovelData(pendingData);
            console.log('保留データの同期完了');
            
            // 保留データを削除
            localStorage.removeItem('pending_sync_data');
            localStorage.removeItem('pending_sync_timestamp');
            
            // 自動同期を開始
            startAutoSync();
            return; // ここで終了（syncFromDriveは実行しない）
          } catch (error) {
            console.error('保留データの処理エラー:', error);
            // エラーの場合は保留データを削除
            localStorage.removeItem('pending_sync_data');
            localStorage.removeItem('pending_sync_timestamp');
          }
        }
        
        // 保留データがない場合のみGoogle Driveからデータを取得
        console.log('保留データがないため、Google Driveからデータを取得');
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
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (syncStatus.isSignedIn) {
        console.log('アプリ終了 - 同期データを保存');
        
        // 同期的な同期処理（非同期処理は完了しないため）
        try {
          // 現在のデータを取得
          const currentData = getAllData();
          const content = JSON.stringify(currentData, null, 2);
          
          // ローカルストレージに一時保存（次回起動時に同期）
          localStorage.setItem('pending_sync_data', content);
          localStorage.setItem('pending_sync_timestamp', Date.now().toString());
          
          console.log('アプリ終了時の同期データを保存:', {
            dataSize: content.length,
            novelCount: currentData.novels?.length || 0,
            timestamp: new Date().toLocaleString()
          });
        } catch (error) {
          console.error('アプリ終了時の同期エラー:', error);
        }
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && syncStatus.isSignedIn) {
        console.log('ページ非表示 - 同期を実行');
        // ページが非表示になった時も同期
        syncToDrive();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncStatus.isSignedIn, getAllData, syncToDrive]);

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
          
          // 保留中の同期データがあるかチェック
          const pendingSyncData = localStorage.getItem('pending_sync_data');
          const pendingSyncTimestamp = localStorage.getItem('pending_sync_timestamp');
          
          if (pendingSyncData && pendingSyncTimestamp) {
            console.log('=== 保留データ処理開始 ===');
            console.log('保留中の同期データを確認（リロード後）');
            try {
              const pendingData = JSON.parse(pendingSyncData);
              const pendingTime = parseInt(pendingSyncTimestamp);
              
              console.log('保留データの詳細:', {
                timestamp: new Date(pendingTime).toLocaleString(),
                novelCount: pendingData.novels?.length || 0,
                folderCount: pendingData.folders?.length || 0,
                novelTitles: pendingData.novels?.map((n: any) => n.title).slice(0, 3) || []
              });
              
              // 現在のRedux状態を確認
              const currentData = getAllData();
              console.log('現在のRedux状態:', {
                novelCount: currentData.novels?.length || 0,
                novelTitles: currentData.novels?.map((n: any) => n.title).slice(0, 3) || []
              });
              
              // 保留データを直接Reduxに反映（新しいデータを優先）
              console.log('保留データをReduxに反映開始');
              if (pendingData.novels) {
                console.log('小説データを設定:', pendingData.novels.length + '件');
                dispatch(setNovels(pendingData.novels));
              }
              if (pendingData.folders) {
                console.log('フォルダデータを設定:', pendingData.folders.length + '件');
                dispatch(setFolders(pendingData.folders));
              }
              if (pendingData.tags) {
                console.log('タグデータを設定:', pendingData.tags.length + '件');
                dispatch(setTags(pendingData.tags));
              }
              if (pendingData.settings) {
                console.log('設定データを設定');
                dispatch(setSettings(pendingData.settings));
              }
              console.log('保留データをReduxに反映完了');
              
              // 保留データをGoogle Driveに同期
              console.log('保留データをGoogle Driveに同期開始');
              await syncNovelData(pendingData);
              console.log('保留データの同期完了');
              
              // 保留データを削除
              localStorage.removeItem('pending_sync_data');
              localStorage.removeItem('pending_sync_timestamp');
              console.log('保留データを削除完了');
              
              // 自動同期を開始
              startAutoSync();
              console.log('=== 保留データ処理完了（syncFromDriveは実行しない）===');
              return; // ここで終了（syncFromDriveは実行しない）
            } catch (error) {
              console.error('保留データの処理エラー:', error);
              localStorage.removeItem('pending_sync_data');
              localStorage.removeItem('pending_sync_timestamp');
            }
          }
          
          // 保留データがない場合のみGoogle Driveから取得
          console.log('保留データがないため、Google Driveからデータを取得');
          try {
            await syncFromDrive();
            startAutoSync();
          } catch (syncError) {
            console.error('同期エラー - 認証状態をリセット:', syncError);
            dispatch(setIsSignedIn(false));
            dispatch(setError('認証が期限切れです。再度サインインしてください。'));
          }
        } else if (syncStatus.isSignedIn) {
          console.log('アプリ起動 - Google Driveからデータを取得');
          try {
            await syncFromDrive();
          } catch (syncError) {
            console.error('同期エラー - 認証状態をリセット:', syncError);
            dispatch(setIsSignedIn(false));
            dispatch(setError('認証が期限切れです。再度サインインしてください。'));
          }
        } else {
          console.log('認証されていません - 手動サインインが必要');
          
          // 保留中の同期データがあるかチェック
          const pendingSyncData = localStorage.getItem('pending_sync_data');
          const pendingSyncTimestamp = localStorage.getItem('pending_sync_timestamp');
          
          if (pendingSyncData && pendingSyncTimestamp) {
            const timestamp = parseInt(pendingSyncTimestamp);
            const now = Date.now();
            const timeDiff = now - timestamp;
            
            // 24時間以内の保留データがあれば通知
            if (timeDiff < 24 * 60 * 60 * 1000) {
              console.log('保留中の同期データを発見:', {
                dataSize: pendingSyncData.length,
                age: Math.round(timeDiff / 1000 / 60) + '分前'
              });
              dispatch(setError('前回のセッションで同期されていないデータがあります。サインインして同期してください。'));
            } else {
              // 24時間以上古いデータは削除
              localStorage.removeItem('pending_sync_data');
              localStorage.removeItem('pending_sync_timestamp');
            }
          }
          
          // 認証されていない場合は同期をスキップ
          return;
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