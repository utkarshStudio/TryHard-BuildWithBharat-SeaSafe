import OpenAI from "openai";

export const llama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});
