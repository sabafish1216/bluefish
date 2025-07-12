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

  return { signIn, listFiles, uploadFile };
} 