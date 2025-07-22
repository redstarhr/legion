# カスタムID命名規則

このドキュメントは、このプロジェクト内で使用されるDiscordインタラクション（ボタン、セレクトメニュー、モーダル）の`customId`に関する命名規則を定義します。この規則に従うことで、コードの可読性と保守性が向上します。

## 構造

カスタムIDは、アンダースコア（`_`）で区切られた以下の構造に従います。

```
{domain}_{action}_{target}_{dynamic_parts}
```

### 各セグメントの説明

1.  **`{domain}` (必須)**: インタラクションが属する主要な機能領域。
    *   `quest`: 個別のクエスト掲示板関連（例：クエストの受注、編集）。
    *   `dash`: メインのクエストダッシュボード関連。
    *   `config`: Botの設定コマンド（`/クエスト設定`）関連。
    *   `list`: ページ分割されたリスト（例：完了済みクエスト一覧）関連。

2.  **`{action}` (必須)**: ユーザーが実行する操作の種類。
    *   `open`: UI要素（モーダルやセレクトメニューなど）を開く。
    *   `submit`: モーダルを送信する。
    *   `select`: セレクトメニューで項目を選択する。
    *   `confirm`: アクションを確定する（例：「はい、削除します」）。
    *   `cancel`: アクションをキャンセルする（例：「いいえ、戻ります」）。
    *   `toggle`: 状態を切り替える（例：クエストの募集〆切/再開）。
    *   `action`: 新しいUIを開かずに直接的なアクションを実行する（例：ファイルのダウンロード）。

3.  **`{target}` (必須)**: 操作の対象となる特定の要素やエンティティ。
    *   例: `acceptModal`, `editModal`, `roleSelect`, `archiveConfirm`, `downloadCsv`。

4.  **`{dynamic_parts}` (任意)**: ハンドラが機能するために必要な動的なデータ（クエストIDやユーザーIDなど）。
    *   例: `_q_123abc`, `_user_456def`, `_interaction_789ghi`。

### 具体例

| 古いカスタムID                 | 新しいカスタムID                            | 説明                                      |
| ------------------------------ | ------------------------------------------- | ----------------------------------------- |
| `quest_accept`                 | `quest_open_acceptModal_{questId}`          | クエスト受注モーダルを開くボタン。        |
| `quest_accept_submit_{questId}`| `quest_submit_acceptModal_{questId}`        | クエスト受注モーダルの送信。              |
| `dash_add_quest`               | `dash_open_addQuestModal`                   | ダッシュボードでクエストを追加するボタン。|
| `config_set_role`              | `config_open_roleSelect`                    | ロール選択メニューを表示するボタン。      |
| `config_role_${id}_select`     | `config_select_role_${id}`                  | ロール選択メニュー。                      |
| `config_role_${id}_remove`     | `config_action_removeRole_${id}`            | 設定されたロールを削除するボタン。        |
| `pagination_list-completed_next`| `list_completed_nextPage_{userId}`          | リストの次のページへ移動するボタン。      |

---
*注意: `startsWith` を使用してハンドラを特定する場合、ハンドラファイル内の `customId` はアンダースコアで終わるようにしてください (例: `customId: 'quest_open_acceptModal_'`)。*