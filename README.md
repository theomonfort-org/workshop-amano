# GitHub Copilot Workshop

ハンズオン教材リポジトリ。`src/content/playbook/` の Markdown を題材に、GitHub Copilot を使って閲覧用サイトを Astro で組み立てます。

## はじめに

1. このリポジトリを **Use this template → Create a new repository** で自分用にコピー
2. **Code → Codespaces → Create codespace on main** で開発環境を起動
3. ハンズオンの手順は [ワークショップ資料](https://theomonfort.github.io/2026-Github-Copilot-Workshop/github-copilot-workshop/custom/handson/) を参照

## 構成

| パス | 内容 |
|---|---|
| `.devcontainer/devcontainer.json` | Codespaces / Dev Containers の定義 |
| `.vscode/mcp.json` | GitHub MCP Server 設定 |
| `src/content/playbook/` | 題材コンテンツ (Markdown) |

## コンテンツに含まれる要素

`src/content/playbook/` の Markdown には以下が含まれます。サイト構築時にレンダリング対応が必要です：

- **Mermaid 図** （` ```mermaid ` ブロック）：アーキテクチャ図やフローを表現
- **コードブロック**：シンタックスハイライト推奨
- **テーブル、リスト、見出し**：標準的な Markdown 要素

> 💡 サイト構築のプロンプトで「Mermaid 図をレンダリングできるようにする」と明示すると確実です。
