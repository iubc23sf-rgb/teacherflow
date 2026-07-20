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
- git リポジトリ化済み。GitHub: https://github.com/iubc23sf-rgb/teacherflow
- Vercelにデプロイ済み。本番URL: https://teacherflow-ebon.vercel.app （`main`へのpushで自動デプロイ）
- ダッシュボードのモック表示を実データ/空状態表示に置き換え済み（授業準備の進捗は`lesson_progress`から計算、PDF由来タスクは`tasks(source='pdf')`を表示、面談・連絡予定は`interview_records`から表示、資料一覧は未実装機能として空状態表示）
- 時間割の編集UIを実装済み（`app/(app)/timetable/`）。科目・クラスの追加/削除、セルクリックでの科目・クラス・教室の割り当て/クリアが可能。ユーザーの`timetables`レコードが無い場合は初回アクセス時に自動作成
- 面談記録機能を実装済み（`app/(app)/interviews/`）。PRDに詳細仕様がなかったため一から設計（生徒名・クラス・面談日・種別・メモ）。ダッシュボードの「面談・連絡予定」とも連動
- 全テーブルへの `authenticated` ロールGRANT不足を修正済み（下記インシデント参照）、Supabaseエラーの握りつぶしにログ出力を追加済み

## 未実装（Phase2以降、PRD参照）

- 時間割の自動生成（編集UIは実装済み）
- Googleカレンダーとの実際の同期処理
- AIチャット、PDF→ToDo、授業進度管理の編集UI（ダッシュボードにはモック表示のみあり）
- 座席表などの学級経営機能（面談記録は実装済み）
- クラス管理（一覧・詳細画面）、テスト・成績管理、資料・ファイル管理

## 次にやると良さそうなこと

1. Phase2の残り機能（Googleカレンダー同期、クラス管理、テスト・成績管理）を優先順位をつけて実装
2. テストユーザーへの案内・フィードバック収集（デプロイ済みのため https://teacherflow-ebon.vercel.app を共有可能）

## 注意事項

- `.env.local` にはSupabaseの接続情報が入っているため、gitにコミットしないよう `.gitignore` を確認すること
- Supabaseの `service_role` キーは絶対にフロントエンドコードに含めないこと

### 【解決済み】全テーブルで GRANT 不足により読み書きができていなかった

2026-07-20 の動作検証で判明・対応済みのインシデント。`schema.sql` はテーブル
作成とRLSポリシーのみで、`authenticated` ロールへの GRANT が一切なかったため、
ログイン後の全てのテーブル操作が `permission denied for table ...` (42501) で
失敗していた。アプリ側のコードがSupabaseのレスポンスの `error` を確認せず
`data` を `?? []` 等で握りつぶしていたため、画面上は「データがありません」
という正常な空状態に見えてしまい、これまで気づかれていなかった。

対応: `schema.sql` に GRANT 文を追加し、本番Supabaseプロジェクトにも適用済み。
`lib/supabase/logError.ts` を追加し、dashboard/tasks/timetable/interviewsの
全ページ・server actionsで `{ error }` をログ出力するよう修正済み。**今後
新しいテーブルを追加したときは、GRANT文の対象リストに追加するのを忘れない
こと**（`supabase/schema.sql` 末尾の grant 文を参照）。

### 【対応済み】Supabaseへのスキーマ変更は本番プロジェクトへの手動適用が必要

`schema.sql` は `create table if not exists` を使っているため、既存プロジェクト
に対して全体を再実行しても新しいテーブル定義しか反映されない（`create policy`
はIF NOT EXISTSが無いため全体再実行はエラーになる）。テーブルを追加・変更した
際は、差分のSQLをSupabase SQL Editorで手動実行すること。これまでに適用が
必要だった差分:
- `timetable_slots` へのユニーク制約追加（`unique (timetable_id, day_of_week, period)`）
- `interview_records` テーブルの新規追加とGRANT

いずれも本番プロジェクトには適用済み。
