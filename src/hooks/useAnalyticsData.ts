import { useMemo } from 'react';
import { Novel } from '../features/novels/novelsSlice';

export const useAnalyticsData = (novels: Novel[]) => {
  // 統計データの計算
  const stats = useMemo(() => {
    const totalCharacters = novels.reduce((sum, novel) => sum + novel.body.length, 0);
    const totalWords = novels.reduce((sum, novel) => {
      const words = novel.body.trim().split(/\s+/).filter(word => word.length > 0);
      return sum + words.length;
    }, 0);
    
    const avgCharactersPerNovel = novels.length > 0 ? Math.round(totalCharacters / novels.length) : 0;
    const avgWordsPerNovel = novels.length > 0 ? Math.round(totalWords / novels.length) : 0;
    
    // 最近の更新日を取得
    const recentUpdates = novels
      .map(novel => new Date(novel.updatedAt))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const lastUpdated = recentUpdates.length > 0 ? recentUpdates[0] : null;
    
    return {
      totalCharacters,
      totalWords,
      avgCharactersPerNovel,
      avgWordsPerNovel,
      lastUpdated
    };
  }, [novels]);

  // 頻出語彙の分析
  const wordFrequency = useMemo(() => {
    const allText = novels.map(novel => novel.body).join(' ');
    
    // 日本語の単語を抽出（簡易的な実装）
    const words = allText
      .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2 && word.length <= 10)
      .map(word => word.toLowerCase());
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // 上位20語を取得
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }, [novels]);

  // 作品別文字数ランキング
  const novelRanking = useMemo(() => {
    return novels
      .map(novel => ({
        title: novel.title,
        characters: novel.body.length,
        words: novel.body.trim().split(/\s+/).filter(word => word.length > 0).length
      }))
      .sort((a, b) => b.characters - a.characters)
      .slice(0, 10);
  }, [novels]);

  return {
    stats,
    wordFrequency,
    novelRanking
  };
}; 