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

## プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── common/         # 共通コンポーネント
│   ├── novel/          # 小説関連コンポーネント
│   └── mobile/         # モバイル用コンポーネント
├── features/           # Reduxスライス
├── hooks/              # カスタムフック
├── pages/              # ページコンポーネント
├── store/              # Reduxストア設定
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

## ライセンス

MIT License

## 開発者

BlueFish開発チーム
