// このファイルは、customIdを体系的に管理するための一時的なものです。
// プロジェクトの要件に応じて、より複雑なID生成ロジックに置き換えることができます。

const idManager = {
  createButtonId: (...parts) => parts.join('_'),
};

module.exports = { idManager };