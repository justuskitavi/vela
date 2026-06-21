import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let cachedModel: ChatGoogleGenerativeAI | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local — get a free key at aistudio.google.com/apikey.`
    );
  }
  return value.trim();
}

export function getModel(): ChatGoogleGenerativeAI {
  if (cachedModel) {
    return cachedModel;
  }

  const apiKey = requireEnv("GOOGLE_API_KEY");

  cachedModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey,
    temperature: 0,
  });

  return cachedModel;
}