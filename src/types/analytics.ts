export interface WordFrequency {
  word: string;
  count: number;
}

export interface NovelRanking {
  title: string;
  characters: number;
  words: number;
}

export interface AnalyticsStats {
  totalCharacters: number;
  totalWords: number;
  avgCharactersPerNovel: number;
  avgWordsPerNovel: number;
  lastUpdated: Date | null;
}

export interface BubblePosition {
  x: number;
  y: number;
  width: number;
  height: number;
} 