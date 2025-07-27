import { useRef } from 'react';
import { Novel } from '../features/novels/novelsSlice';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

/**
 * Google Identity Services (GIS) + gapi でGoogle Drive認証・API利用を行うカスタムフック
 */
export function useGoogleDriveGIS() {
  const tokenClientRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);

  // デバッグ用: 環境変数の確認（初回のみ）
  if (!isInitializedRef.current) {
    console.log('Google Drive GIS - Environment variables:');
    console.log('API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? 'Set' : 'Not set');
    console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    console.log('Current URL:', window.location.href);
    console.log('Environment:', process.env.NODE_ENV);
    isInitializedRef.current = true;
  }

  // gapiの初期化
  const initGapi = async () => {
    return new Promise<void>((resolve, reject) => {
      // 既に初期化済みの場合はスキップ
      if (window.gapi && window.gapi.client && window.gapi.client.drive) {
        console.log('gapi already initialized, skipping...');
        resolve();
        return;
      }

      console.log('Initializing gapi...');
      window.gapi.load('client', {
        callback: async () => {
          try {
            console.log('gapi client loaded, initializing...');
          await window.gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
            console.log('gapi client initialized successfully');
          resolve();
          } catch (error) {
            console.error('gapi client init error:', error);
            reject(error);
          }
        },
        onerror: (error: any) => {
          console.error('gapi load error:', error);
          reject(error);
        },
      });
    });
  };

  // GISクライアントの初期化
  const initTokenClient = () => {
    console.log('Initializing token client...');
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
      callback: () => {}, // 後で差し替え
    });
    console.log('Token client initialized');
  };

  // 認証状態をチェック（トークンの有効性も確認）
  const checkAuthStatus = async () => {
    try {
      await initGapi();
      let token = window.gapi.client.getToken();
      console.log('認証状態チェック - Token:', token ? '存在' : 'なし');
      
      // トークンが存在しない場合、ローカルストレージから復元を試行
      if (!token || !token.access_token) {
        const savedTokenData = localStorage.getItem('google_drive_token');
        if (savedTokenData) {
          try {
            const tokenData = JSON.parse(savedTokenData);
            const now = Date.now();
            
            // トークンの有効期限をチェック
            if (tokenData.expires_at > now) {
              console.log('保存されたトークンを復元');
              window.gapi.client.setToken({ access_token: tokenData.access_token });
              token = window.gapi.client.getToken();
            } else {
              console.log('保存されたトークンが期限切れ');
              localStorage.removeItem('google_drive_token');
            }
          } catch (parseError) {
            console.error('トークンデータの解析エラー:', parseError);
            localStorage.removeItem('google_drive_token');
          }
        }
      }
      
      if (!token || !token.access_token) {
        return false;
      }

      // トークンの有効性をテスト
      try {
        await window.gapi.client.drive.files.list({ pageSize: 1 });
        console.log('トークン有効性確認完了');
        return true;
      } catch (testError) {
        console.log('トークン無効:', testError);
        window.gapi.client.setToken(null);
        localStorage.removeItem('google_drive_token');
        return false;
      }
    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      return false;
    }
  };

  // サインイン
  const signIn = async (onSignedIn: () => void) => {
    try {
    await initGapi();
    if (!tokenClientRef.current) initTokenClient();
      
    tokenClientRef.current.callback = (tokenResponse: any) => {
        try {
          // アクセストークンとリフレッシュトークンを保存
          const tokenData = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: Date.now() + (tokenResponse.expires_in * 1000)
          };
          
          // ローカルストレージに保存（セキュリティ上の注意が必要）
          localStorage.setItem('google_drive_token', JSON.stringify(tokenData));
          
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });
      onSignedIn();
        } catch (tokenError) {
          console.warn('トークン設定エラー（無視可能）:', tokenError);
          // エラーを無視して続行
          onSignedIn();
        }
    };
      
      try {
    tokenClientRef.current.requestAccessToken();
      } catch (requestError) {
        console.warn('アクセストークン要求エラー（無視可能）:', requestError);
        // エラーを無視して続行
        onSignedIn();
      }
    } catch (error) {
      console.error('サインインエラー:', error);
      throw error;
    }
  };

  // Drive APIの利用例
  const listFiles = async () => {
    const res = await window.gapi.client.drive.files.list({
      pageSize: 10,
      fields: 'files(id, name)',
    });
    return res.result.files;
  };

  // ファイルアップロード（multipart/related, boundary方式）
  const uploadFile = async (name: string, content: string) => {
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';
    const contentType = 'application/json';
    const metadata = {
      name,
      mimeType: contentType,
    };
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n\r\n' +
      content +
      closeDelim;
    const res = await window.gapi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: multipartRequestBody,
    });
    return res.result.id;
  };

  // ファイルダウンロード
  const downloadFile = async (fileId: string) => {
    const res = await window.gapi.client.drive.files.get({
      fileId,
      alt: 'media',
    });
    return res.body;
  };

  // ファイル検索（名前で検索）
  const findFileByName = async (fileName: string) => {
    console.log('ファイル検索開始:', fileName);
    
    try {
      const res = await window.gapi.client.drive.files.list({
        q: `name='${fileName}'`,
        fields: 'files(id, name, modifiedTime, size)',
        spaces: 'drive',
        pageSize: 10
      });
      
      console.log('検索結果:', res.result);
      console.log('見つかったファイル数:', res.result.files?.length || 0);
      
      if (res.result.files && res.result.files.length > 0) {
        const file = res.result.files[0];
        console.log('選択されたファイル:', file);
        return file;
      }
      
      return null;
    } catch (error) {
      console.error('ファイル検索エラー:', error);
      return null;
    }
  };

  // ファイル更新
  const updateFile = async (fileId: string, content: string) => {
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';
    const contentType = 'application/json';
    const metadata = {
      mimeType: contentType,
    };
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n\r\n' +
      content +
      closeDelim;
    const res = await window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: multipartRequestBody,
    });
    return res.result;
  };

  // 個別小説の同期（新機能）
  const syncIndividualNovel = async (novel: Novel) => {
    const fileName = `novel-${novel.id}.json`;
    const content = JSON.stringify(novel, null, 2);
    
    console.log('個別小説同期開始:', {
      fileName,
      novelId: novel.id,
      title: novel.title,
      version: novel.version,
      dataSize: content.length
    });
    
    // 既存ファイルを検索
    const existingFile = await findFileByName(fileName);
    console.log('既存ファイル検索結果:', existingFile);
    
    if (existingFile) {
      // 既存ファイルを更新
      console.log('既存ファイルを更新:', existingFile.id);
      const result = await updateFile(existingFile.id, content);
      console.log('ファイル更新完了:', result);
      return result;
    } else {
      // 新規ファイルを作成
      console.log('新規ファイルを作成');
      const result = await uploadFile(fileName, content);
      console.log('ファイル作成完了:', result);
      return result;
    }
  };

  // 個別小説の取得（新機能）
  const getIndividualNovel = async (novelId: string) => {
    const fileName = `novel-${novelId}.json`;
    console.log('個別小説取得開始:', fileName);
    
    const existingFile = await findFileByName(fileName);
    console.log('ファイル検索結果:', existingFile);
    
    if (existingFile) {
      console.log('ファイルをダウンロード:', existingFile.id);
      const content = await downloadFile(existingFile.id);
      console.log('ダウンロード完了, コンテンツサイズ:', content.length);
      
      try {
        const novel = JSON.parse(content) as Novel;
        console.log('小説データ解析完了:', {
          id: novel.id,
          title: novel.title,
          version: novel.version,
          bodyLength: novel.body.length
        });
        return novel;
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        console.log('生のコンテンツ:', content.substring(0, 200) + '...');
        return null;
      }
    }
    
    console.log('ファイルが存在しません');
    return null;
  };

  // 競合解決機能（新機能）
  const resolveConflict = (localNovel: Novel, remoteNovel: Novel): Novel => {
    console.log('競合解決開始:', {
      localVersion: localNovel.version,
      remoteVersion: remoteNovel.version,
      localUpdatedAt: localNovel.updatedAt,
      remoteUpdatedAt: remoteNovel.updatedAt
    });

    // バージョン番号が同じ場合は競合なし
    if (localNovel.version === remoteNovel.version) {
      console.log('競合なし - バージョンが同じ');
      return localNovel;
    }

    // リモートの方が新しい場合
    if (remoteNovel.version > localNovel.version) {
      console.log('リモートの方が新しい - リモートを採用');
      return {
        ...remoteNovel,
        lastSyncAt: new Date().toISOString(),
        isSyncing: false
      };
    }

    // ローカルの方が新しい場合
    if (localNovel.version > remoteNovel.version) {
      console.log('ローカルの方が新しい - ローカルを採用');
      return {
        ...localNovel,
        lastSyncAt: new Date().toISOString(),
        isSyncing: false
      };
    }

    // タイムスタンプで比較（バージョンが同じ場合）
    const localTime = new Date(localNovel.updatedAt).getTime();
    const remoteTime = new Date(remoteNovel.updatedAt).getTime();

    if (remoteTime > localTime) {
      console.log('リモートの方が新しい - タイムスタンプ比較');
      return {
        ...remoteNovel,
        lastSyncAt: new Date().toISOString(),
        isSyncing: false
      };
    } else {
      console.log('ローカルの方が新しい - タイムスタンプ比較');
      return {
        ...localNovel,
        lastSyncAt: new Date().toISOString(),
        isSyncing: false
      };
    }
  };

  // 小説データ全体をGoogle Driveに同期（従来の方式 - メタデータ用）
  const syncNovelData = async (novelData: any) => {
    const fileName = 'novel-writer-data.json';
    const content = JSON.stringify(novelData, null, 2);
    
    console.log('syncNovelData 開始:', {
      fileName,
      dataSize: content.length,
      novelCount: novelData.novels?.length || 0,
      folderCount: novelData.folders?.length || 0,
      tagCount: novelData.tags?.length || 0
    });
    
    // 既存ファイルを検索
    const existingFile = await findFileByName(fileName);
    console.log('既存ファイル検索結果:', existingFile);
    
    if (existingFile) {
      // 既存ファイルを更新
      console.log('既存ファイルを更新:', existingFile.id);
      const result = await updateFile(existingFile.id, content);
      console.log('ファイル更新完了:', result);
      return result;
    } else {
      // 新規ファイルを作成
      console.log('新規ファイルを作成');
      const result = await uploadFile(fileName, content);
      console.log('ファイル作成完了:', result);
      return result;
    }
  };

  // Google Driveから小説データを取得（従来の方式 - メタデータ用）
  const getNovelData = async () => {
    const fileName = 'novel-writer-data.json';
    console.log('getNovelData 開始:', fileName);
    
    const existingFile = await findFileByName(fileName);
    console.log('ファイル検索結果:', existingFile);
    
    if (existingFile) {
      console.log('ファイルをダウンロード:', existingFile.id);
      const content = await downloadFile(existingFile.id);
      console.log('ダウンロード完了, コンテンツサイズ:', content.length);
      
      try {
        const data = JSON.parse(content);
        console.log('データ解析完了:', {
          novelCount: data.novels?.length || 0,
          folderCount: data.folders?.length || 0,
          tagCount: data.tags?.length || 0
        });
        return data;
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        console.log('生のコンテンツ:', content.substring(0, 200) + '...');
        return null;
      }
    }
    
    console.log('ファイルが存在しません');
    return null; // ファイルが存在しない場合
  };

  // サインアウト
  const signOut = () => {
    try {
      window.gapi.client.setToken(null);
      localStorage.removeItem('google_drive_token');
      console.log('サインアウト完了');
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  return { 
    signIn, 
    signOut,
    checkAuthStatus,
    listFiles, 
    uploadFile, 
    downloadFile, 
    findFileByName, 
    updateFile,
    syncNovelData,
    getNovelData,
    // 新機能
    syncIndividualNovel,
    getIndividualNovel,
    resolveConflict
  };
} 