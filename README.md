# BlueFish - 小説執筆アプリ

BlueFishは、React・TypeScript・Redux・MUIを使用したモダンな小説執筆アプリケーションです。

## 特徴

- 📝 **直感的な執筆環境**: シンプルで使いやすい執筆インターフェース
- 📱 **レスポンシブデザイン**: デスクトップとモバイルの両方に対応
- 🏷️ **タグ管理**: 作品にタグを付けて整理
- 📁 **フォルダ管理**: 作品をフォルダで分類
- 📊 **分析機能**: 執筆状況の可視化
- ⚙️ **カスタマイズ可能**: フォントサイズ、行番号表示、文字数表示などの設定
- 🌙 **ダークモード対応**: ライト/ダークモードの切り替え

## 技術スタック

- **フロントエンド**: React 19, TypeScript
- **状態管理**: Redux Toolkit
- **UIライブラリ**: Material-UI (MUI)
- **ルーティング**: React Router
- **永続化**: Redux Persist
- **ビルドツール**: Create React App

## セットアップ

### 前提条件

- Node.js 18.x以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/sabafish1028/bluefish.git
cd bluefish

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start
```

### ビルド

```bash
# 本番用ビルド
npm run build

# テスト実行
npm test
```

## 使用方法

1. **作品の作成**: 左上の「+」ボタンで新しい作品を作成
2. **執筆**: 右側のエリアで本文を入力
3. **管理**: 左側のサイドバーで作品、フォルダ、タグを管理
4. **設定**: 右上の設定ボタンでアプリの設定を変更

## デプロイ

このアプリはGitHub Pagesで自動デプロイされています。

- **本番環境**: https://sabafish1028.github.io/bluefish
- **自動ビルド**: mainブランチにプッシュすると自動でビルド・デプロイされます

## 開発

### プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── common/         # 共通コンポーネント
│   └── ...
├── features/           # Reduxスライス
├── hooks/              # カスタムフック
├── constants/          # 定数
├── types/              # TypeScript型定義
├── store/              # Reduxストア設定
└── pages/              # ページコンポーネント
```

### 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 作者

Ryuto Kobayashi

---

**BlueFish** - あなたの創作活動をサポートする小説執筆アプリ
