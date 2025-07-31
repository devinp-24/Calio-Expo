// src/api/openai.js
import Constants from "expo-constants";
import OpenAI from "openai";
import { greetingMemoryPrompt } from "../prompts/systemPrompt";

const config = Constants.manifest ?? Constants.expoConfig;
if (!config?.extra?.OPENAI_API_KEY) {
  throw new Error(
    "Missing OPENAI_API_KEY. Please add it under expo.extra in app.json"
  );
}

const openai = new OpenAI({
  apiKey: config.extra.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function chatWithAgent(history, overrideSystemPrompt) {
  const systemContent = overrideSystemPrompt ?? greetingMemoryPrompt;
  const messages = [{ role: "system", content: systemContent }, ...history];
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });
  return resp.choices[0].message;
}
