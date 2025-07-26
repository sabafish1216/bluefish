import { useRef } from 'react';

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

      // トークンの有効性をテスト（簡単なAPI呼び出し）
      try {
        await window.gapi.client.drive.files.list({
          pageSize: 1,
          fields: 'files(id)',
        });
        console.log('トークン有効性チェック - 成功');
        return true;
      } catch (apiError) {
        console.log('トークン有効性チェック - 失敗（再認証が必要）:', apiError);
        // トークンをクリア
        window.gapi.client.setToken(null);
        localStorage.removeItem('google_drive_token');
        return false;
      }
    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      return false;
    }
  };

  // サインイン（ポップアップ方式、エラーハンドリング付き）
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

  // ファイル更新（既存ファイルの内容を更新）
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

  // 小説データ全体をGoogle Driveに同期
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

  // Google Driveから小説データを取得
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
    getNovelData
  };
} 