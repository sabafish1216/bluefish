import { Folder } from '../features/folders/foldersSlice';

export interface FolderValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

export const validateFolderName = (
  name: string,
  folders: Folder[],
  excludeFolderId?: string
): FolderValidationResult => {
  // 空文字チェック
  if (!name.trim()) {
    return {
      isValid: false,
      errorMessage: 'フォルダ名を入力してください'
    };
  }

  // 「未分類」という名前の使用を禁止
  if (name.trim() === '未分類') {
    return {
      isValid: false,
      errorMessage: '「未分類」は予約された名前のため使用できません'
    };
  }

  // 既存フォルダとの重複チェック（「未分類」を含む）
  const existingFolder = folders.find(folder => 
    folder.name === name.trim() && folder.id !== excludeFolderId
  );

  if (existingFolder) {
    return {
      isValid: false,
      errorMessage: `「${name.trim()}」は既に存在します`
    };
  }

  return {
    isValid: true,
    errorMessage: null
  };
}; 