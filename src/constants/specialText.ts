export const SPECIAL_TEXT_TEMPLATES = {
  PAGE_BREAK: '\n\n---\n\n',
  CHAPTER_TITLE: '\n\n# 第{number}章 {title}\n\n',
  RUBY: '{base}<ruby>{ruby}<rt>{reading}</rt></ruby>',
} as const;

export const SPECIAL_TEXT_PLACEHOLDERS = {
  CHAPTER_NUMBER: '{number}',
  CHAPTER_TITLE: '{title}',
  RUBY_BASE: '{base}',
  RUBY_READING: '{reading}',
} as const; 