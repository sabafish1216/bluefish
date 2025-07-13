# BlueFish - 小説執筆アプリ

React・TypeScript・Redux・MUIを使用したモダンな小説執筆アプリケーションです。

## 機能

- 📝 小説の作成・編集・削除
- 📁 フォルダによる作品管理
- 🏷️ タグによる分類
- 📊 執筆統計・分析
- 🌙 ダークモード/ライトモード
- 📱 レスポンシブデザイン（モバイル対応）

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm start
```

### 3. ビルド
```bash
npm run build
```

## 使用方法

1. **作品作成**: 左上の「+」ボタンで新規作品を作成
2. **執筆**: 右側のエディタで本文を執筆
3. **管理**: 左側のサイドバーで作品・フォルダ・タグを管理
4. **分析**: 統計タブで執筆データを確認

## 技術スタック

- **フロントエンド**: React 18, TypeScript
- **状態管理**: Redux Toolkit, Redux Persist
- **UI**: Material-UI (MUI)
- **ビルド**: Create React App

## プロジェクト構造（2024年7月現在）

```
novel-writer/
├── public/
├── src/
│   ├── components/
│   │   ├── AnalyticsPage.tsx
│   │   ├── MobileWritingField.tsx
│   │   ├── WritingField.tsx
│   │   ├── NovelWorkspace.tsx
│   │   ├── NovelListItem.tsx
│   │   ├── FolderSelector.tsx
│   │   ├── TagSelector.tsx
│   │   └── common/
│   │       ├── SettingsDialog.tsx
│   │       ├── MobileDrawer.tsx
│   │       ├── SpecialTextButtons.tsx
│   │       ├── ExpandableSection.tsx
│   │       ├── ActionButtons.tsx
│   │       ├── TabPanel.tsx
│   │       ├── EmptyState.tsx
│   │       └── index.ts
│   ├── constants/
│   │   ├── analytics.ts
│   │   ├── drawer.ts
│   │   ├── index.ts
│   │   └── specialText.ts
│   ├── features/
│   │   ├── googleDrive/
│   │   ├── settings/
│   │   ├── theme/
│   │   ├── folders/
│   │   ├── novels/
│   │   └── tags/
│   ├── hooks/
│   │   ├── useAnalyticsData.ts
│   │   ├── useGoogleDriveGIS.ts
│   │   ├── useResponsive.ts
│   │   ├── useNovelData.ts
│   │   ├── useExpansionState.ts
│   │   ├── useDrawerResize.ts
│   │   └── index.ts
│   ├── pages/
│   │   └── NovelListPage.tsx
│   ├── store/
│   │   └── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── novel.ts
│   │   └── analytics.ts
│   ├── App.tsx
│   ├── App.css
│   ├── App.test.tsx
│   ├── index.tsx
│   ├── index.css
│   ├── logo.svg
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   └── setupTests.ts
└── ...
```

## ライセンス

MIT License
