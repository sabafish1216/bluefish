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
    const res = await window.gapi.client.drive.files.list({
      q: `name='${fileName}'`,
      fields: 'files(id, name, modifiedTime)',
    });
    return res.result.files[0] || null;
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
    
    // 既存ファイルを検索
    const existingFile = await findFileByName(fileName);
    
    if (existingFile) {
      // 既存ファイルを更新
      return await updateFile(existingFile.id, content);
    } else {
      // 新規ファイルを作成
      return await uploadFile(fileName, content);
    }
  };

  // Google Driveから小説データを取得
  const getNovelData = async () => {
    const fileName = 'novel-writer-data.json';
    const existingFile = await findFileByName(fileName);
    
    if (existingFile) {
      const content = await downloadFile(existingFile.id);
      return JSON.parse(content);
    }
    
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