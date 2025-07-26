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

  // gapiの初期化
  const initGapi = async () => {
    return new Promise<void>((resolve, reject) => {
      window.gapi.load('client', {
        callback: async () => {
          await window.gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          resolve();
        },
        onerror: reject,
      });
    });
  };

  // GISクライアントの初期化
  const initTokenClient = () => {
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: () => {}, // 後で差し替え
    });
  };

  // サインイン（コールバック方式）
  const signIn = async (onSignedIn: () => void) => {
    await initGapi();
    if (!tokenClientRef.current) initTokenClient();
    tokenClientRef.current.callback = (tokenResponse: any) => {
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });
      onSignedIn();
    };
    tokenClientRef.current.requestAccessToken();
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

  return { 
    signIn, 
    listFiles, 
    uploadFile, 
    downloadFile, 
    findFileByName, 
    updateFile,
    syncNovelData,
    getNovelData
  };
} 