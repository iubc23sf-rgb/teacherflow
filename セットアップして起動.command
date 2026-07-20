#!/bin/bash
cd "$(dirname "$0")"
echo "=== TeacherFlow セットアップ ==="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js が見つかりません。"
  echo "https://nodejs.org を開いて「LTS」版をダウンロード・インストールしてから、"
  echo "もう一度このファイルをダブルクリックしてください。"
  echo ""
  read -n 1 -s -r -p "何かキーを押すとこのウィンドウを閉じます..."
  exit 1
fi

if [ ! -f .env.local ]; then
  echo "❌ .env.local が見つかりません。"
  echo "「動作確認ガイド」のステップ3〜6（Supabaseプロジェクト作成と接続情報の設定）を先に行ってください。"
  echo ""
  read -n 1 -s -r -p "何かキーを押すとこのウィンドウを閉じます..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "初回セットアップ中です（数分かかります。そのままお待ちください）..."
  npm install
fi

echo ""
echo "起動します。少し待ってから、ブラウザで http://localhost:3000 を開いてください。"
echo "（このウィンドウを閉じるとアプリも終了します）"
echo ""
npm run dev
