export interface NovelGroup {
  folder: {
    id: string;
    name: string;
  };
  novels: any[];
}

export interface TagGroup {
  tag: {
    id: string;
    name: string;
  };
  novels: any[];
} 