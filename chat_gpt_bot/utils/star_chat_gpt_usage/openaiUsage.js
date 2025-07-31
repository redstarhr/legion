'use strict';

const axios = require('axios');

/**
 * Fetches OpenAI API usage data for a specific date. Note: The /v1/usage
 * endpoint is deprecated and may not work for all accounts.
 * @param {string} apiKey - The OpenAI API key.
 * @param {string} date - The date for which to fetch usage, in YYYY-MM-DD format.
 * @returns {Promise<object>} A promise that resolves to the usage data object.
 * @throws {Error} If the API key is not provided or if the API call fails.
 */
async function getOpenAiUsage(apiKey, date) {
  if (!apiKey) {
    throw new Error('OpenAI API key was not provided.');
  }

  const url = 'https://api.openai.com/v1/usage';

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      params: {
        date: date,
      },
    });

    // The usage endpoint returns a `data` array and a `total_usage` field.
    return response.data;
  } catch (error) {
    console.error('Error fetching OpenAI usage:', error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error?.message || error.message;
    throw new Error(`Failed to fetch OpenAI usage: ${errorMessage}`);
  }
}

module.exports = {
  getOpenAiUsage,
};