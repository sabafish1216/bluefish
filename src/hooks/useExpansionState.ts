import { useState, useCallback } from 'react';

export const useExpansionState = () => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const toggleFolderExpansion = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const toggleTagExpansion = useCallback((tagId: string) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  }, []);

  return {
    expandedFolders,
    expandedTags,
    toggleFolderExpansion,
    toggleTagExpansion
  };
}; 