
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateText = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: 'You are a sophisticated writer for a luxury newsletter. Write in an elegant, intellectual, and slightly formal tone. Your audience appreciates nuance, history, and craftsmanship. Avoid slang, clichés, and overly casual language.'
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini API:", error);
    return "Error: Could not generate text.";
  }
};
