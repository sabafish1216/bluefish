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
import { 
  setNovels, 
  addNovel,
  updateNovel
} from '../features/novels/novelsSlice';
import { setFolders } from '../features/folders/foldersSlice';
import { setTags } from '../features/tags/tagsSlice';
import { setSettings } from '../features/settings/settingsSlice';
import { Novel } from '../features/novels/novelsSlice';

export function useGoogleDriveSync() {
  const dispatch = useDispatch();
  const {
    syncNovelData,
    getNovelData,
    signIn,
    checkAuthStatus,
    getRateLimitInfo,
    deleteAllNovelFiles
  } = useGoogleDriveGIS();
  const hasInitializedRef = useRef(false);

  // Reduxの状態を取得
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const tags = useSelector((state: RootState) => state.tags.tags);
  const settings = useSelector((state: RootState) => state.settings);
  const syncStatus = useSelector((state: RootState) => state.googleDriveSync);

  // メタデータを取得（小説の基本情報のみ）
  const getMetadata = useCallback(() => {
    return {
      novels: novels.map(novel => ({
        id: novel.id,
        title: novel.title,
        tags: novel.tags,
        folderId: novel.folderId,
        createdAt: novel.createdAt,
        updatedAt: novel.updatedAt,
        lastSyncAt: novel.lastSyncAt,
        bodyLength: novel.body.length
      })),
      folders,
      tags,
      settings,
      lastSync: new Date().toISOString(),
    };
  }, [novels, folders, tags, settings]);

  // 完全なデータを同期（統合ファイル方式）
  const syncCompleteData = useCallback(async () => {
    if (!syncStatus.isSignedIn) return;
    
    console.log('完全なデータ同期開始（統合ファイル方式）');
    try {
      const completeData = {
        novels: novels, // 完全な小説データ（本文含む）
        folders,
        tags,
        settings,
        lastSync: new Date().toISOString(),
      };
      
      console.log('統合データの詳細:', {
        novelCount: completeData.novels.length,
        folderCount: completeData.folders.length,
        tagCount: completeData.tags.length,
        totalSize: JSON.stringify(completeData).length
      });
      
      await syncNovelData(completeData);
      console.log('完全なデータ同期完了（統合ファイル方式）');
    } catch (error) {
      console.error('完全なデータ同期エラー:', error);
      throw error;
    }
  }, [syncStatus.isSignedIn, novels, folders, tags, settings, syncNovelData]);

  // 完全な双方向同期（統合ファイル方式）
  const fullBidirectionalSync = useCallback(async () => {
    if (!syncStatus.isSignedIn) return;
    
    console.log('=== 統合ファイル方式による双方向同期開始 ===');
    
    try {
      // ①Google Driveから統合データを取得
      const remoteData = await getNovelData();
      
      if (remoteData) {
        console.log('Google Driveから統合データを取得:', {
          novelCount: remoteData.novels?.length || 0,
          folderCount: remoteData.folders?.length || 0,
          tagCount: remoteData.tags?.length || 0
        });
        
        // ②ローカルストレージ内のデータと、Google Driveで取得したデータを比較
        console.log('=== 競合解決開始 ===');
        
        // 安全なアクセスを確保
        const remoteNovels = remoteData.novels || [];
        const remoteFolders = remoteData.folders || [];
        const remoteTags = remoteData.tags || [];
        
        // ローカルに存在する小説のIDセット
        const localNovelIds = new Set(novels.map((n: Novel) => n.id));
        // Google Driveに存在する小説のIDセット
        const remoteNovelIds = new Set(remoteNovels.map((n: Novel) => n.id));
        
        // すべての小説IDを取得
        const allNovelIds = Array.from(new Set([...Array.from(localNovelIds), ...Array.from(remoteNovelIds)]));
        
        const novelsToAdd: Novel[] = [];
        const novelsToUpdate: Novel[] = [];
        const novelsToUpload: Novel[] = [];
        
        for (const novelId of allNovelIds) {
          const localNovel = novels.find((n: Novel) => n.id === novelId);
          const remoteNovel = remoteNovels.find((n: Novel) => n.id === novelId);
          
          console.log(`小説ID ${novelId} の競合解決:`, {
            localExists: !!localNovel,
            remoteExists: !!remoteNovel,
            localTitle: localNovel?.title,
            remoteTitle: remoteNovel?.title
          });
          
          if (remoteNovel && !localNovel) {
            // ケースA：Google Driveに存在し、ローカルストレージに存在しない作品
            console.log(`ケースA: 小説「${remoteNovel.title}」をローカルに追加 (本文: ${remoteNovel.body?.length || 0}文字)`);
            novelsToAdd.push({
              ...remoteNovel,
              lastSyncAt: new Date().toISOString(),
              isSyncing: false
            });
          } else if (!remoteNovel && localNovel) {
            // ケースB：Google Driveに存在せず、ローカルストレージに存在する作品
            console.log(`ケースB: 小説「${localNovel.title}」をGoogle Driveにアップロード (本文: ${localNovel.body?.length || 0}文字)`);
            novelsToUpload.push(localNovel);
          } else if (remoteNovel && localNovel) {
            // ケースC：Google Driveにも、ローカルストレージにも存在する作品
            console.log(`ケースC: 小説「${localNovel.title}」の最終更新日時を比較 (ローカル本文: ${localNovel.body?.length || 0}文字, リモート本文: ${remoteNovel.body?.length || 0}文字)`);
            
            const localTime = new Date(localNovel.updatedAt).getTime();
            const remoteTime = new Date(remoteNovel.updatedAt).getTime();
            
            if (remoteTime > localTime) {
              // Google Driveのデータが新しい場合
              console.log(`Google Driveのデータが新しい - ローカルを更新 (リモート本文: ${remoteNovel.body?.length || 0}文字)`);
              novelsToUpdate.push({
                ...remoteNovel,
                lastSyncAt: new Date().toISOString(),
                isSyncing: false
              });
            } else if (localTime > remoteTime) {
              // ローカルストレージのデータが新しい場合
              console.log(`ローカルのデータが新しい - Google Driveを更新 (ローカル本文: ${localNovel.body?.length || 0}文字)`);
              novelsToUpload.push(localNovel);
            } else {
              // 同じ時刻の場合、本文の内容を比較
              console.log(`更新日時が同じ - 本文の内容を比較`);
              if (localNovel.body !== remoteNovel.body) {
                // 本文が異なる場合、リモートのデータを優先（より完全なデータ）
                console.log(`本文が異なる - リモートのデータを優先 (ローカル: ${localNovel.body?.length || 0}文字, リモート: ${remoteNovel.body?.length || 0}文字)`);
                novelsToUpdate.push({
                  ...remoteNovel,
                  lastSyncAt: new Date().toISOString(),
                  isSyncing: false
                });
              } else {
                // 本文も同じ場合（真の競合なし）
                console.log(`更新日時と本文が同じ - 真の競合なし (本文: ${localNovel.body?.length || 0}文字)`);
              }
            }
          }
        }
        
        // ③競合解決結果を適用
        console.log('=== 競合解決結果の適用 ===');
        
        // 新しい小説を追加
        if (novelsToAdd.length > 0) {
          console.log('新しい小説を追加:', novelsToAdd.length + '件');
          for (const novel of novelsToAdd) {
            dispatch(addNovel(novel));
          }
        }
        
        // 既存小説を更新
        if (novelsToUpdate.length > 0) {
          console.log('既存小説を更新:', novelsToUpdate.length + '件');
          for (const novel of novelsToUpdate) {
            dispatch(updateNovel(novel));
          }
        }
        
        // フォルダとタグを更新
        if (remoteFolders.length > 0) {
          console.log('フォルダを更新:', remoteFolders.length + '件');
          dispatch(setFolders(remoteFolders));
        }
        
        if (remoteTags.length > 0) {
          console.log('タグを更新:', remoteTags.length + '件');
          dispatch(setTags(remoteTags));
        }
        
        if (remoteData.settings) {
          console.log('設定を更新');
          dispatch(setSettings(remoteData.settings));
        }
        
        // アップロードが必要な小説がある場合、統合ファイルを更新
        if (novelsToUpload.length > 0) {
          console.log('統合ファイルを更新（アップロード対象:', novelsToUpload.length + '件）');
          await syncCompleteData();
        }
      } else {
        // Google Driveにデータが存在しない場合、ローカルデータをアップロード
        console.log('Google Driveにデータが存在しないため、ローカルデータをアップロード');
        await syncCompleteData();
      }
      
      console.log('=== 統合ファイル方式による双方向同期完了 ===');
    } catch (error) {
      console.error('統合ファイル方式による同期エラー:', error);
      dispatch(setError(error instanceof Error ? error.message : '同期エラーが発生しました'));
    }
  }, [syncStatus.isSignedIn, novels, dispatch, getNovelData, syncCompleteData]);

  // 手動同期
  const manualSync = useCallback(async () => {
    if (!syncStatus.isSignedIn) {
      console.log('Google Driveにサインインしていないため、手動同期をスキップ');
      return;
    }
    
    console.log('手動同期開始');
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      
      // 統合ファイル方式による完全同期
      await fullBidirectionalSync();
      
      dispatch(setLastSyncTime(new Date().toISOString()));
      console.log('手動同期完了');
    } catch (error) {
      console.error('手動同期エラー:', error);
      dispatch(setError(error instanceof Error ? error.message : '手動同期エラーが発生しました'));
    } finally {
      dispatch(setIsSyncing(false));
    }
  }, [syncStatus.isSignedIn, fullBidirectionalSync, dispatch]);

  // Google Driveにサインイン
  const signInToDrive = useCallback(async () => {
    try {
      console.log('Google Driveサインイン開始');
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      
      // 既存のトークンをクリア
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null);
      }
      
      await signIn(
        async () => {
          console.log('Google Drive認証完了 - 同期処理を開始');
          dispatch(setIsSignedIn(true));
          dispatch(setError(null)); // エラーをクリア
          
          try {
            // アプリ起動時・同期ボタン押下時と同じ同期処理を実行
            await fullBidirectionalSync();
            console.log('Google Drive連携完了 - 同期処理完了');
          } catch (syncError) {
            console.error('Google Drive連携後の同期処理エラー:', syncError);
            dispatch(setError(syncError instanceof Error ? syncError.message : '同期処理エラーが発生しました'));
          } finally {
            dispatch(setIsSyncing(false));
            dispatch(setLastSyncTime(new Date().toISOString()));
          }
        },
        (error: string) => {
          // 認証キャンセルまたはエラー時の処理
          console.log('認証プロセスが中断されました:', error);
          dispatch(setIsSyncing(false));
          dispatch(setError(null)); // エラーをクリア（キャンセルは正常な動作）
        }
      );
    } catch (error) {
      console.error('Google Driveサインインエラー:', error);
      dispatch(setIsSyncing(false));
      dispatch(setError(error instanceof Error ? error.message : 'サインインエラーが発生しました'));
    }
  }, [signIn, fullBidirectionalSync, dispatch]);

  // Google Driveデータ削除
  const deleteGoogleDriveData = useCallback(async () => {
    if (!syncStatus.isSignedIn) {
      console.log('Google Driveにサインインしていないため、削除をスキップ');
      return;
    }
    
    console.log('Google Driveデータ削除開始');
    
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      
      // すべての小説関連ファイルを削除
      await deleteAllNovelFiles();
      
      console.log('Google Driveデータ削除完了');
    } catch (error) {
      console.error('Google Driveデータ削除エラー:', error);
      dispatch(setError(error instanceof Error ? error.message : 'Google Driveデータ削除エラーが発生しました'));
    } finally {
      dispatch(setIsSyncing(false));
    }
  }, [syncStatus.isSignedIn, deleteAllNovelFiles, dispatch]);

  // 個別小説削除（統合ファイル方式）
  const deleteNovelFromDrive = useCallback(async (novelId: string) => {
    if (!syncStatus.isSignedIn) {
      console.log('Google Driveにサインインしていないため、ローカル削除のみ実行');
      return;
    }
    
    console.log('個別小説削除開始（統合ファイル方式）:', novelId);
    
    try {
      dispatch(setIsSyncing(true));
      dispatch(setError(null));
      
      // 統合ファイル方式では、個別ファイルの削除は不要
      // ローカルで削除後、統合ファイルを更新するのみ
      console.log('統合ファイル方式: 個別ファイル削除は不要、統合ファイル更新のみ');
      
      // 統合ファイルを更新（削除された小説を除外）
      console.log('統合ファイルを更新（削除された小説を除外）');
      await syncCompleteData();
      
      console.log('個別小説削除完了（統合ファイル方式）:', novelId);
    } catch (error) {
      console.error('個別小説削除エラー:', error);
      dispatch(setError(error instanceof Error ? error.message : 'Google Driveからの削除エラーが発生しました'));
    } finally {
      dispatch(setIsSyncing(false));
    }
  }, [syncStatus.isSignedIn, syncCompleteData, dispatch]);

  // アプリ終了時の同期
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (syncStatus.isSignedIn) {
        console.log('アプリ終了 - 同期データを保存');
        
        // 同期的な同期処理（非同期処理は完了しないため）
        try {
          // 完全なデータを取得（本文含む）
          const completeData = {
            novels: novels, // 完全な小説データ（本文含む）
            folders,
            tags,
            settings,
            lastSync: new Date().toISOString(),
          };
          const content = JSON.stringify(completeData, null, 2);
          
          // ローカルストレージに一時保存（次回起動時に同期）
          localStorage.setItem('pending_sync_data', content);
          localStorage.setItem('pending_sync_timestamp', Date.now().toString());
          
          console.log('アプリ終了時の同期データを保存:', {
            dataSize: content.length,
            novelCount: completeData.novels?.length || 0,
            novelBodyLengths: completeData.novels?.map(n => ({ id: n.id, title: n.title, bodyLength: n.body.length })) || [],
            timestamp: new Date().toLocaleString()
          });
        } catch (error) {
          console.error('アプリ終了時の同期エラー:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus.isSignedIn, novels, folders, tags, settings]);

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
        
        // 既存データのマイグレーションを実行
        console.log('既存データのマイグレーションを実行');
        // dispatch(migrateNovels()); // migrateNovelsは削除されたためコメントアウト
        
        const isAuthenticated = await checkAuthStatus();
        
        // 保留中の同期データがあるかチェック（認証状態に関係なく最初にチェック）
        const pendingSyncData = localStorage.getItem('pending_sync_data');
        const pendingSyncTimestamp = localStorage.getItem('pending_sync_timestamp');
        
        if (pendingSyncData && pendingSyncTimestamp) {
          console.log('=== 保留データ処理開始 ===');
          console.log('保留中の同期データを確認（認証状態に関係なく）');
          
          // 認証されていない場合は認証状態を復元
          if (isAuthenticated && !syncStatus.isSignedIn) {
            console.log('認証状態を復元');
            dispatch(setIsSignedIn(true));
          }
          
          try {
            const pendingData = JSON.parse(pendingSyncData);
            const pendingTime = parseInt(pendingSyncTimestamp);
            
            console.log('保留データの詳細:', {
              timestamp: new Date(pendingTime).toLocaleString(),
              novelCount: pendingData.novels?.length || 0,
              folderCount: pendingData.folders?.length || 0,
              novelTitles: pendingData.novels?.map((n: any) => n.title).slice(0, 3) || [],
              novelBodyLengths: pendingData.novels?.map((n: any) => ({ id: n.id, title: n.title, bodyLength: n.body?.length || 0 })).slice(0, 3) || []
            });
            
            // 現在のRedux状態を確認
            const currentData = getMetadata();
            console.log('現在のRedux状態:', {
              novelCount: currentData.novels?.length || 0,
              novelTitles: currentData.novels?.map((n: any) => n.title).slice(0, 3) || [],
              novelBodyLengths: novels.map(n => ({ id: n.id, title: n.title, bodyLength: n.body.length })).slice(0, 3)
            });
            
            // 保留データを直接Reduxに反映（新しいデータを優先）
            console.log('保留データをReduxに反映開始');
            if (pendingData.novels) {
              console.log('小説データを設定:', pendingData.novels.length + '件');
              console.log('設定する小説データの詳細:', pendingData.novels.map((n: any) => ({
                id: n.id,
                title: n.title,
                bodyLength: n.body?.length || 0,
                bodyPreview: n.body?.substring(0, 50) + '...' || 'なし'
              })));
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
            dispatch(setIsSyncing(true));
            try {
              await fullBidirectionalSync();
              console.log('保留データの同期完了');
            } finally {
              dispatch(setIsSyncing(false));
              dispatch(setLastSyncTime(new Date().toISOString()));
            }
            
            // 保留データを削除
            localStorage.removeItem('pending_sync_data');
            localStorage.removeItem('pending_sync_timestamp');
            console.log('保留データを削除完了');
            
            console.log('=== 保留データ処理完了（syncFromDriveは実行しない）===');
            return; // ここで終了（syncFromDriveは実行しない）
          } catch (error) {
            console.error('保留データの処理エラー:', error);
            localStorage.removeItem('pending_sync_data');
            localStorage.removeItem('pending_sync_timestamp');
          }
        }
        
        // 保留データがない場合の通常処理
        if (isAuthenticated && !syncStatus.isSignedIn) {
          console.log('リロード後 - 認証状態を復元（保留データなし）');
          dispatch(setIsSignedIn(true));
          
          try {
            console.log('Google Drive連携完了 - 初回同期処理開始');
            dispatch(setIsSyncing(true));
            try {
              await fullBidirectionalSync();
              console.log('Google Drive連携完了 - 初回同期処理完了');
            } finally {
              dispatch(setIsSyncing(false));
              dispatch(setLastSyncTime(new Date().toISOString()));
            }
          } catch (syncError) {
            console.error('同期エラー - 認証状態をリセット:', syncError);
            dispatch(setIsSyncing(false));
            dispatch(setIsSignedIn(false));
            dispatch(setError('認証が期限切れです。再度サインインしてください。'));
          }
        } else if (syncStatus.isSignedIn) {
          console.log('アプリ起動 - Google Driveからデータを取得（保留データなし）');
          try {
            console.log('Google Drive連携完了 - 起動時同期処理開始');
            dispatch(setIsSyncing(true));
            try {
              await fullBidirectionalSync();
              console.log('Google Drive連携完了 - 起動時同期処理完了');
            } finally {
              dispatch(setIsSyncing(false));
              dispatch(setLastSyncTime(new Date().toISOString()));
            }
          } catch (syncError) {
            console.error('同期エラー - 認証状態をリセット:', syncError);
            dispatch(setIsSyncing(false));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の依存配列で初回のみ実行

  return {
    syncStatus,
    signInToDrive,
    manualSync,
    fullBidirectionalSync,
    deleteGoogleDriveData,
    deleteNovelFromDrive,
    // API制限情報
    getRateLimitInfo: () => {
      return getRateLimitInfo();
    }
  };
} 