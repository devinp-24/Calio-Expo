// backend/services/openaiService.js
const { OpenAI } = require("openai");

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment");
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Sends a chat completion request to OpenAI.
 *
 * @param {Array<{role:string,content:string}>} messages
 * @param {object}   [options]
 * @returns {Promise<{role:string,content:string}>}
 */
async function getChatCompletion(messages, options = {}) {
    const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0,
        max_tokens: 512,
        ...options
    });
    return resp.choices[0].message;
}

module.exports = { getChatCompletion };
