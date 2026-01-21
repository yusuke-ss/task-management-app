# タスク管理アプリ

シンプルで使いやすいタスク管理Webアプリケーション

## 機能

- タスクの作成・編集・削除
- タスクの完了/未完了切り替え
- ドラッグ&ドロップによる並べ替え
- レスポンシブデザイン

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js App Router (API Routes)
- **データベース**: SQLite + Prisma ORM

## セットアップ

```bash
# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアクセスできます。

## API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | /api/tasks | タスク一覧を取得 |
| POST | /api/tasks | 新規タスクを作成 |
| GET | /api/tasks/[id] | 特定のタスクを取得 |
| PUT | /api/tasks/[id] | タスクを更新 |
| DELETE | /api/tasks/[id] | タスクを削除 |
| PATCH | /api/tasks/[id]/toggle | 完了状態を切り替え |
| PUT | /api/tasks/reorder | 並び順を更新 |

## ライセンス

MIT
