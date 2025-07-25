import { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateNovel } from '../features/novels/novelsSlice';
import { Novel } from '../features/novels/novelsSlice';

interface UseAutoSaveProps {
  novel: Novel;
  onSave?: (novel: Novel) => void;
}

export const useAutoSave = ({ novel, onSave }: UseAutoSaveProps) => {
  const dispatch = useDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAutoSave = useCallback(async (updatedData: Partial<Novel>) => {
    console.log('自動保存開始:', updatedData);

    setIsSaving(true);

    try {
      const updatedNovel = {
        ...novel,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      console.log('保存する小説データ:', updatedNovel);

      if (onSave) {
        await onSave(updatedNovel);
      } else {
        dispatch(updateNovel(updatedNovel));
      }

      setLastSaved(new Date());
      console.log('自動保存完了');
    } catch (error) {
      console.error('自動保存に失敗しました:', error);
    } finally {
      setIsSaving(false);
    }
  }, [novel, onSave, dispatch]);

  const debouncedSave = useCallback((updatedData: Partial<Novel>) => {
    console.log('debouncedSave呼び出し:', updatedData);
    
    // 既存のタイマーをクリア
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 新しいタイマーを設定（100ms後）
    autoSaveTimerRef.current = setTimeout(() => {
      console.log('デバウンスタイマー実行');
      handleAutoSave(updatedData);
    }, 100);
  }, [handleAutoSave]);

  const saveImmediately = useCallback((updatedData: Partial<Novel>) => {
    // 既存のタイマーをクリア
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // 即座に保存
    handleAutoSave(updatedData);
  }, [handleAutoSave]);

  return {
    isSaving,
    lastSaved,
    debouncedSave,
    saveImmediately
  };
}; 