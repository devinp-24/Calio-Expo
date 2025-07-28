// backend/controllers/chatController.js
const { getChatCompletion } = require("../services/openaiService");

/**
 * POST /api/chat
 * Body: { history: Array<{role,content}>, prompt: string }
 */
async function handleChat(req, res) {
    const { history, prompt } = req.body;

    if (
        !Array.isArray(history) ||
        typeof prompt !== "string" ||
        prompt.trim().length === 0
    ) {
        return res
            .status(400)
            .json({ error: "Request must include `history` (array) and `prompt` (string)" });
    }

    // Prepend the system prompt
    const messages = [
        { role: "system", content: prompt.trim() },
        ...history,
    ];

    try {
        const aiMessage = await getChatCompletion(messages);
        res.json(aiMessage);
    } catch (err) {
        console.error("❌ OpenAI request failed:", err);
        res.status(502).json({ error: "AI request failed" });
    }
}

module.exports = { handleChat };
