# gsetup

以下を1コマンドで実行する CLI。

1. `git init`
2. `git config --local user.name / user.email`（`.env.json` の値）
3. `.gitignore` の作成（`template/gitignore` をコピー。既に存在する場合はスキップ）
4. `template/.claude` を対象ディレクトリの `.claude` にコピー（既存ファイルは上書きしない）

`.gitignore` の中身や `.claude` の内容は `template/` 配下を編集すればカスタマイズできる。
（`template/.gitignore` にするとツール自身のリポジトリで効いてしまうため、ドット無しの `gitignore` で置いている）

## セットアップ

```sh
npm install                      # 依存関係のインストール + ビルド（prepare で npm run build が走る）
cp .env.example.json .env.json   # userName / userEmail を編集
npm link                         # gsetup コマンドをグローバルに登録
```

`dist/` が無い場合や、ビルドだけやり直したい場合は `npm run build` を実行する。

`.env.json` はこのフォルダ（ツール本体）に置く。どのディレクトリで実行してもこの設定が使われる。

```json
{
  "userName": "Your Name",
  "userEmail": "you@example.com"
}
```

## 使い方

```sh
gsetup            # カレントディレクトリで実行
gsetup path/to/dir  # 指定ディレクトリで実行（無ければ作成）
```

`src/index.ts` を変更したら `npm run build` で再ビルドする。
