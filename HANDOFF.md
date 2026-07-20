# TeacherFlow 引き継ぎメモ（Claude Code用）

このファイルは Cowork での作業内容を Claude Code に引き継ぐためのメモです。
Claude Code でこのプロジェクトを開いたら、まずこのファイルを読んでもらってください。

## プロジェクト概要

TeacherFlow は教員向けのオールインワン業務管理Webアプリ（β版）。
Google カレンダー同期・タスク管理・時間割・AI を1つにまとめる構想。

詳細な要件定義・画面設計はNotionを参照:
- PRD: https://app.notion.com/p/3a26ccbd352381418cf3dd050f773150
- 画面一覧・DB設計: https://app.notion.com/p/3a26ccbd35238188a3c0d851edeb5cab
- 動作確認ガイド: https://app.notion.com/p/3a26ccbd352381b8bc4bf651654228eb

## 技術スタック

- Next.js 14（App Router, TypeScript）
- Supabase（PostgreSQL / Auth / RLS）
- Tailwind CSS
- Google Calendar API（Supabase Auth の Google OAuth プロバイダ経由、未接続）

## 現在の状態（完了済み）

- Next.js + Supabase のPhase1スケルトン実装済み（ダッシュボード・タスク管理・時間割・設定画面）
- Supabaseプロジェクト作成済み（プロジェクト名: iubc23sf-rgb's Project、リージョン: Tokyo）
- `supabase/schema.sql` を実行済み（全テーブル・RLSポリシー作成済み）
- `.env.local` に Supabase の URL / anon key 設定済み
- `npm install` 実施済み、`npm run dev` でローカル起動確認済み（http://localhost:3000）
- ログイン画面にメールのマジックリンクログインを追加済み（Google OAuth設定不要でお試し可能）

## 未実装（Phase2以降、PRD参照）

- 時間割の編集UI・自動生成
- Googleカレンダーとの実際の同期処理
- AIチャット、PDF→ToDo、授業進度管理の編集UI（ダッシュボードにはモック表示のみあり）
- 面談記録、座席表などの学級経営機能
- クラス管理、テスト・成績管理、資料・ファイル管理

## 次にやると良さそうなこと

1. git リポジトリ化（現状 git 管理されていない）
2. ダッシュボードのモック表示（AI提案、面談予定、最近の資料など）を実データに置き換え
3. Phase2機能から優先順位をつけて実装
4. テストユーザー向けにVercelなどへデプロイ

## 注意事項

- `.env.local` にはSupabaseの接続情報が入っているため、gitにコミットしないよう `.gitignore` を確認すること
- Supabaseの `service_role` キーは絶対にフロントエンドコードに含めないこと
