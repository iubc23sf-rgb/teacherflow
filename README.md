# TeacherFlow（β版スケルトン）

先生のためのオールインワン業務ワークスペース。Google カレンダー同期・タスク管理・時間割・AI を1つにまとめる Web アプリの Phase1 スケルトンです。

## 技術スタック

- Next.js 14（App Router, TypeScript）
- Supabase（PostgreSQL / Auth / RLS）
- Tailwind CSS
- Google Calendar API（Supabase Auth の Google OAuth プロバイダ経由）

## 実装済み（Phase1）

- Google ログイン（Supabase Auth）
- 認証ミドルウェア（未ログイン時は /login にリダイレクト）
- サイドメニュー付きダッシュボードレイアウト
- ダッシュボード（今日の予定・未完了タスクの表示）
- タスク管理（追加・完了切替・削除、期限順/重要度順/科目別ソート）
- 時間割（週表示・編集。科目/クラスの登録、セル単位での割り当て・クリア）
- 設定画面（プロフィール、Google連携ステータス）
- Supabase 用スキーマ（`supabase/schema.sql`、RLSポリシー込み）

## 未実装（Phase2以降）

- 時間割の自動生成
- Googleカレンダーとの実際の同期処理（Edge FunctionまたはCronでの定期同期）
- AIチャット、PDF→ToDo、授業進度管理の編集UI
- 面談記録、座席表などの学級経営機能

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Supabase プロジェクトを作成

1. https://supabase.com でプロジェクトを新規作成
2. SQL Editor で `supabase/schema.sql` の内容を実行し、テーブルとRLSポリシーを作成
3. Authentication > Providers で **Google** を有効化
   - Google Cloud Console で OAuth クライアントID/シークレットを発行
   - 承認済みリダイレクトURIに `https://<プロジェクトref>.supabase.co/auth/v1/callback` を追加
4. Project Settings > API から `Project URL` と `anon public key` を取得

### 3. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` に Supabase の URL / anon key、Google OAuth のクライアントID/シークレットを記入。

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 にアクセスし、「Googleでログイン」からログインするとダッシュボードに遷移します。

## ディレクトリ構成

```
app/
  login/              ログイン画面
  auth/callback/      OAuthコールバック
  (app)/              ログイン後の画面（サイドバー付き）
    dashboard/
    tasks/
    timetable/
    settings/
lib/supabase/          Supabaseクライアント（ブラウザ/サーバー/ミドルウェア）
components/             共通UIコンポーネント
supabase/schema.sql     DBスキーマ・RLSポリシー
types/database.ts       型定義
```
