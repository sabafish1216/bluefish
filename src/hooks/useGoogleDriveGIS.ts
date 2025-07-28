import { useRef } from 'react';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// API制限管理クラス
class APIRateLimiter {
  private requestCount = 0;
  private resetTime = Date.now() + 100000; // 100秒後
  private dailyCount = 0;
  private dailyResetTime = Date.now() + 24 * 60 * 60 * 1000; // 24時間後

  // リクエスト可能かチェック
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // 100秒制限のリセット
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 100000;
    }
    
    // 日次制限のリセット
    if (now > this.dailyResetTime) {
      this.dailyCount = 0;
      this.dailyResetTime = now + 24 * 60 * 60 * 1000;
    }
    
    // 制限チェック
    return this.requestCount < 900 && this.dailyCount < 9500; // 安全マージン
  }

  // リクエスト記録
  recordRequest(): void {
    this.requestCount++;
    this.dailyCount++;
    console.log(`API呼び出し記録: 100秒内 ${this.requestCount}/1000, 日次 ${this.dailyCount}/10000`);
  }

  // 次のリセットまでの時間を取得
  getTimeUntilReset(): number {
    return Math.max(0, this.resetTime - Date.now());
  }

  // 現在の使用状況を取得
  getUsage(): { current: number; daily: number; timeUntilReset: number } {
    return {
      current: this.requestCount,
      daily: this.dailyCount,
      timeUntilReset: this.getTimeUntilReset()
    };
  }
}

/**
 * Google Identity Services (GIS) + gapi でGoogle Drive認証・API利用を行うカスタムフック
 */
export function useGoogleDriveGIS() {
  const tokenClientRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const rateLimiterRef = useRef<APIRateLimiter>(new APIRateLimiter());

  // デバッグ用: 環境変数の確認（初回のみ）
  if (!isInitializedRef.current) {
    console.log('Google Drive GIS - Environment variables:');
    console.log('API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? 'Set' : 'Not set');
    console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    console.log('Current URL:', window.location.href);
    console.log('Environment:', process.env.NODE_ENV);
    isInitializedRef.current = true;
  }

  // API制限チェック
  const checkRateLimit = (): boolean => {
    if (!rateLimiterRef.current.canMakeRequest()) {
      const usage = rateLimiterRef.current.getUsage();
      console.warn('API制限に達しました:', usage);
      return false;
    }
    return true;
  };

  // API呼び出し記録
  const recordAPICall = (): void => {
    rateLimiterRef.current.recordRequest();
  };

  // 制限情報取得
  const getRateLimitInfo = () => {
    return rateLimiterRef.current.getUsage();
  };

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
      error_callback: (error: any) => {
        console.log('Token client error:', error);
        // エラーコールバックは後で設定される
      }
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
  const signIn = async (onSignedIn: () => void, onError?: (error: string) => void) => {
    try {
      await initGapi();
      if (!tokenClientRef.current) initTokenClient();
      
      tokenClientRef.current.callback = (tokenResponse: any) => {
        try {
          // 認証がキャンセルされた場合
          if (!tokenResponse || tokenResponse.error) {
            console.log('認証がキャンセルされました:', tokenResponse?.error || 'no response');
            if (onError) {
              onError('認証がキャンセルされました');
            }
            return;
          }
          
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
      
      // エラーコールバックも設定
      if (onError) {
        tokenClientRef.current.error_callback = (error: any) => {
          console.log('Token client error:', error);
          
          // COOPエラーの場合は特別なメッセージを表示
          if (error && typeof error === 'object' && error.error === 'popup_closed_by_user') {
            onError('認証ウィンドウが閉じられました。再度お試しください。');
          } else if (error && typeof error === 'string' && error.includes('COOP')) {
            onError('ブラウザのセキュリティ設定により認証が中断されました。ポップアップを許可して再度お試しください。');
          } else {
            onError('認証エラーが発生しました。再度お試しください。');
          }
        };
      }
      
      try {
        tokenClientRef.current.requestAccessToken();
      } catch (requestError) {
        console.warn('アクセストークン要求エラー（無視可能）:', requestError);
        
        // COOPエラーの場合は特別な処理
        if (requestError && typeof requestError === 'object' && 
            ((requestError as any).message?.includes('COOP') || (requestError as any).message?.includes('popup'))) {
          console.log('COOPエラーが発生しました:', requestError);
          if (onError) {
            onError('ブラウザのセキュリティ設定により認証が中断されました。ポップアップを許可して再度お試しください。');
          }
          return;
        }
        
        // エラーを無視して続行
        onSignedIn();
      }
    } catch (error) {
      console.error('サインインエラー:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'サインインエラーが発生しました');
      }
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

  // ファイルアップロード（Multipart + Resumable ハイブリッド方式）
  const uploadFile = async (name: string, content: string) => {
    const contentType = 'application/json';
    const metadata = {
      name,
      mimeType: contentType,
    };

    // ファイルサイズを計算（UTF-8で3バイト/文字）
    const contentSize = content.length * 3;
    const metadataSize = JSON.stringify(metadata).length * 3;
    const totalSize = contentSize + metadataSize + 1000; // オーバーヘッド分を追加

    console.log('アップロードファイルサイズ:', {
      contentSize: (contentSize / 1024 / 1024).toFixed(2) + 'MB',
      metadataSize: (metadataSize / 1024).toFixed(2) + 'KB',
      totalSize: (totalSize / 1024 / 1024).toFixed(2) + 'MB',
      useResumable: totalSize > 5 * 1024 * 1024
    });

    // 5MBを超える場合はResumable Upload方式を使用
    if (totalSize > 5 * 1024 * 1024) {
      console.log('ファイルサイズが5MBを超えるため、Resumable Upload方式を使用');
      return await uploadFileResumable(name, content, metadata);
    } else {
      console.log('ファイルサイズが5MB以下なので、Multipart方式を使用');
      return await uploadFileMultipart(name, content, metadata);
    }
  };

  // Multipart方式のアップロード
  const uploadFileMultipart = async (name: string, content: string, metadata: any) => {
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';
    const contentType = 'application/json';
    
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

  // Resumable方式のアップロード
  const uploadFileResumable = async (name: string, content: string, metadata: any) => {
    console.log('Resumable Upload開始:', name);
    
    try {
      // 1. セッション開始
      const sessionResponse = await window.gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { 
          uploadType: 'resumable',
          name: name,
          mimeType: metadata.mimeType
        },
        headers: {
          'X-Upload-Content-Type': metadata.mimeType,
          'X-Upload-Content-Length': content.length.toString()
        }
      });

      const sessionId = sessionResponse.headers['X-GUploader-UploadID'];
      console.log('Resumable Uploadセッション開始:', sessionId);

      // 2. データ転送
      const uploadResponse = await window.gapi.client.request({
        path: `/upload/drive/v3/files`,
        method: 'PUT',
        params: { 
          uploadType: 'resumable',
          upload_id: sessionId
        },
        headers: {
          'Content-Type': metadata.mimeType,
          'Content-Length': content.length.toString()
        },
        body: content
      });

      console.log('Resumable Upload完了:', uploadResponse.result.id);
      return uploadResponse.result.id;
    } catch (error) {
      console.error('Resumable Uploadエラー:', error);
      throw error;
    }
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
      
      // res.resultがundefinedの場合の処理を追加
      if (!res.result) {
        console.log('検索結果がundefinedです');
        return null;
      }
      
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

  // ファイル更新（Multipart + Resumable ハイブリッド方式）
  const updateFile = async (fileId: string, content: string) => {
    const contentType = 'application/json';
    const metadata = {
      mimeType: contentType,
    };

    // ファイルサイズを計算（UTF-8で3バイト/文字）
    const contentSize = content.length * 3;
    const metadataSize = JSON.stringify(metadata).length * 3;
    const totalSize = contentSize + metadataSize + 1000; // オーバーヘッド分を追加

    console.log('更新ファイルサイズ:', {
      contentSize: (contentSize / 1024 / 1024).toFixed(2) + 'MB',
      metadataSize: (metadataSize / 1024).toFixed(2) + 'KB',
      totalSize: (totalSize / 1024 / 1024).toFixed(2) + 'MB',
      useResumable: totalSize > 5 * 1024 * 1024
    });

    // 5MBを超える場合はResumable Upload方式を使用
    if (totalSize > 5 * 1024 * 1024) {
      console.log('ファイルサイズが5MBを超えるため、Resumable Update方式を使用');
      return await updateFileResumable(fileId, content, metadata);
    } else {
      console.log('ファイルサイズが5MB以下なので、Multipart Update方式を使用');
      return await updateFileMultipart(fileId, content, metadata);
    }
  };

  // Multipart方式のファイル更新
  const updateFileMultipart = async (fileId: string, content: string, metadata: any) => {
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';
    const contentType = 'application/json';
    
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

  // Resumable方式のファイル更新
  const updateFileResumable = async (fileId: string, content: string, metadata: any) => {
    console.log('Resumable Update開始:', fileId);
    
    try {
      // 1. セッション開始
      const sessionResponse = await window.gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { 
          uploadType: 'resumable',
          mimeType: metadata.mimeType
        },
        headers: {
          'X-Upload-Content-Type': metadata.mimeType,
          'X-Upload-Content-Length': content.length.toString()
        }
      });

      const sessionId = sessionResponse.headers['X-GUploader-UploadID'];
      console.log('Resumable Updateセッション開始:', sessionId);

      // 2. データ転送
      const uploadResponse = await window.gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PUT',
        params: { 
          uploadType: 'resumable',
          upload_id: sessionId
        },
        headers: {
          'Content-Type': metadata.mimeType,
          'Content-Length': content.length.toString()
        },
        body: content
      });

      console.log('Resumable Update完了:', uploadResponse.result.id);
      return uploadResponse.result;
    } catch (error) {
      console.error('Resumable Updateエラー:', error);
      throw error;
    }
  };

  // 小説データ全体をGoogle Driveに同期（統合ファイル方式）
  const syncNovelData = async (novelData: any) => {
    // API制限チェック
    if (!checkRateLimit()) {
      throw new Error('API制限に達しました。しばらく待ってから再試行してください。');
    }

    const fileName = 'novel-writer-data.json';
    const content = JSON.stringify(novelData, null, 2);
    
    console.log('統合ファイル同期開始:', {
      fileName,
      dataSize: content.length,
      novelCount: novelData.novels?.length || 0,
      folderCount: novelData.folders?.length || 0,
      tagCount: novelData.tags?.length || 0
    });
    
    try {
      // 既存ファイルを検索
      recordAPICall();
      const existingFile = await findFileByName(fileName);
      console.log('既存ファイル検索結果:', existingFile);
      
      if (existingFile) {
        // 既存ファイルを更新
        console.log('既存ファイルを更新:', existingFile.id);
        recordAPICall();
        const result = await updateFile(existingFile.id, content);
        console.log('ファイル更新完了:', result);
        return result;
      } else {
        // 新規ファイルを作成
        console.log('新規ファイルを作成');
        recordAPICall();
        const result = await uploadFile(fileName, content);
        console.log('ファイル作成完了:', result);
        return result;
      }
    } catch (error) {
      console.error('統合ファイル同期エラー:', error);
      throw error;
    }
  };

  // Google Driveから小説データを取得（統合ファイル方式）
  const getNovelData = async () => {
    // API制限チェック
    if (!checkRateLimit()) {
      throw new Error('API制限に達しました。しばらく待ってから再試行してください。');
    }

    const fileName = 'novel-writer-data.json';
    console.log('統合ファイル取得開始:', fileName);
    
    try {
      recordAPICall();
      const existingFile = await findFileByName(fileName);
      console.log('ファイル検索結果:', existingFile);
      
      if (existingFile) {
        console.log('ファイルをダウンロード:', existingFile.id);
        recordAPICall();
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
    } catch (error) {
      console.error('統合ファイル取得エラー:', error);
      throw error;
    }
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

  // ファイル削除
  const deleteFile = async (fileId: string) => {
    // API制限チェック
    if (!checkRateLimit()) {
      throw new Error('API制限に達しました。しばらく待ってから再試行してください。');
    }

    console.log('ファイル削除開始:', fileId);
    
    try {
      recordAPICall();
      const response = await window.gapi.client.drive.files.delete({
        fileId: fileId
      });
      console.log('ファイル削除完了:', response);
      return response;
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      throw error;
    }
  };

  // 名前でファイルを削除
  const deleteFileByName = async (fileName: string) => {
    console.log('名前でファイル削除開始:', fileName);
    
    try {
      const existingFile = await findFileByName(fileName);
      if (existingFile) {
        console.log('ファイルを削除:', existingFile.id, existingFile.name);
        return await deleteFile(existingFile.id);
      } else {
        console.log('削除対象のファイルが見つかりません:', fileName);
        return null;
      }
    } catch (error) {
      console.error('名前でファイル削除エラー:', error);
      throw error;
    }
  };

  // すべての小説関連ファイルを削除（統合ファイル方式では1ファイルのみ）
  const deleteAllNovelFiles = async () => {
    console.log('統合ファイル削除開始');
    
    try {
      // 統合ファイルのみを削除
      console.log('統合ファイルを削除');
      await deleteFileByName('novel-writer-data.json');
      
      console.log('統合ファイル削除完了');
    } catch (error) {
      console.error('統合ファイル削除エラー:', error);
      throw error;
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
    // API制限関連
    checkRateLimit,
    recordAPICall,
    getRateLimitInfo,
    deleteFile,
    deleteFileByName,
    deleteAllNovelFiles
  };
} 