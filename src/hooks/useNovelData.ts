import { useMemo } from 'react';
import { Novel } from '../features/novels/novelsSlice';
import { Folder } from '../features/folders/foldersSlice';
import { Tag } from '../features/tags/tagsSlice';

export const useNovelData = (novels: Novel[], folders: Folder[], tags: Tag[]) => {
  // フォルダ別に小説をグループ化（未分類を含む）
  const novelsByFolder = useMemo(() => [
    // 未分類の作品
    {
      folder: { id: 'uncategorized', name: '未分類' },
      novels: novels.filter(novel => !novel.folderId || novel.folderId === '')
    },
    // 各フォルダの作品
    ...folders.map(folder => ({
      folder,
      novels: novels.filter(novel => novel.folderId === folder.id)
    }))
  ], [novels, folders]);

  // タグ別に小説をグループ化（0件のタグは除外）
  const novelsByTag = useMemo(() => tags
    .map(tag => ({
      tag,
      novels: novels.filter(novel => novel.tags.includes(tag.id))
    }))
    .filter(({ novels }) => novels.length > 0), [novels, tags]);

  return {
    novelsByFolder,
    novelsByTag
  };
}; 