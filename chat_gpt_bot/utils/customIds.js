// utils/customIds.js

/**
 * モーダル識別子
 */
const Modals = {
  config: 'gpt_config_modal',
};

/**
 * モーダル内のTextInputコンポーネント識別子
 */
const Inputs = {
  systemPrompt: 'gpt_system_prompt_input',
  temperature: 'gpt_temperature_input',
  model: 'gpt_model_input',
};

/**
 * ボタン、メニュー、その他のカスタムID（必要に応じて追加）
 */
const Buttons = {
  openSettings: 'chatgpt_open_config_button',
  saveSettings: 'chatgpt_save_button',
};

const SelectMenus = {
  todayChannel: 'chatgpt_config_select_today_channel',
};

module.exports = {
  Modals,
  Inputs,
  Buttons,
  SelectMenus,
};
