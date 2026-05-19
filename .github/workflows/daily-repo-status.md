---
description: |
  リポジトリの最近の活動（Issue、PR、コード変更）を分析し、
  日次のステータスレポートを GitHub Issue として自動作成するワークフロー。

on:
  schedule: daily
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

tools:
  github:
    # パブリックリポジトリの場合、`lockdown: false` を設定すると
    # 第三者からの Issue / PR / コメントを読み取れる。
    # プライベートリポジトリでは特に影響しない。
    lockdown: false
    min-integrity: none # このワークフローはあらゆる Issue を参照・コメントできる

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-issue:
    title-prefix: "[repo-status] "
    labels: [report, daily-status]
    close-older-issues: true
---

# 日次リポジトリステータス

リポジトリの当日の状況を **日本語の前向きなステータスレポート** として GitHub Issue に投稿してください。

## レポートに含める内容

- 直近の活動（Issue、Pull Request、コード変更、リリース、ディスカッション）
- 進捗のハイライト・継続中の取り組み・達成事項
- 注目すべき変更や議論のサマリ
- メンテナ向けの次のアクション提案

## スタイル

- ポジティブで励まし、役に立つトーン 🌟
- 絵文字は控えめに、読みやすさを優先
- 簡潔に。活動量が少ない日は短く、多い日は構造化してまとめる
- 見出し（`##`）で「概要 / Issue / Pull Request / コード変更 / 次のアクション」など節分け

## 手順

1. リポジトリの最近の活動（Issue、PR、コミット、リリース）を収集する。
2. 進捗・ハイライト・ブロッカーを分析する。
3. 上記の内容をまとめた Markdown 本文で GitHub Issue を作成する（タイトル接頭辞 `[repo-status] ` と
   ラベル `report`, `daily-status` は `safe-outputs` の設定により自動付与される）。
4. 既存の `[repo-status]` Issue は `close-older-issues: true` により自動でクローズされるため、
   重複を避けるための手動操作は不要。
