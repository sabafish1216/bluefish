# BlueFish - 小説執筆アプリ

React・TypeScript・Redux・MUIを使用したモダンな小説執筆アプリケーションです。

**Version: 1.0.0-beta**

## 機能

- 📝 小説の作成・編集・削除
- 📁 フォルダによる作品管理
- 🏷️ タグによる分類
- 📊 執筆統計・分析
- 🌙 ダークモード/ライトモード
- 📱 レスポンシブデザイン（モバイル対応）
- ☁️ **Google Drive連携**（複数端末でのデータ同期）

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
5. **同期**: 設定画面でGoogle Drive連携を有効化

## Google Drive連携

- **自動同期**: 5分ごとにデータを同期
- **手動同期**: 設定画面から手動で同期可能
- **複数端末対応**: 同じGoogleアカウントで複数端末からアクセス
- **起動時同期**: アプリ起動時に自動でデータを取得

## 技術スタック

- **フロントエンド**: React 18, TypeScript
- **状態管理**: Redux Toolkit, Redux Persist
- **UI**: Material-UI (MUI)
- **ビルド**: Create React App
- **ホスティング**: Vercel
- **同期**: Google Drive API

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
│   │   ├── GoogleDriveSyncButton.tsx
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
│   │   ├── googleDriveSync/
│   │   ├── settings/
│   │   ├── theme/
│   │   ├── folders/
│   │   ├── novels/
│   │   └── tags/
│   ├── hooks/
│   │   ├── useAnalyticsData.ts
│   │   ├── useGoogleDriveGIS.ts
│   │   ├── useGoogleDriveSync.ts
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
│   ├── utils/
│   │   └── folderValidation.ts
│   ├── App.tsx
│   ├── App.css
│   ├── App.test.tsx
│   ├── index.tsx
│   ├── index.css
│   └── logo.svg
├── package.json
├── vercel.json
└── README.md
```

## デプロイ

このアプリはVercelでホスティングされています。

- **本番URL**: [BlueFish App](https://bluefish-7ua4lvev3-sabafish1028s-projects.vercel.app)
- **自動デプロイ**: GitHubにプッシュすると自動的にデプロイ

## ライセンス

MIT License
