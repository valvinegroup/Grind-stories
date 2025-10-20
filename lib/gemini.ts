import { GoogleGenAI } from "@google/genai";

export const generateText = async (prompt: string): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable not set. Gemini API calls will fail.");
    return "Error: API key not configured.";
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a sophisticated writer for a luxury newsletter. Write in an elegant, intellectual, and slightly formal tone. Your audience appreciates nuance, history, and craftsmanship. Avoid slang, clichés, and overly casual language.'
      }
    });

    const text = response.text ?? (response as { output_text?: string }).output_text ?? null;
    return text ?? "Error: Gemini did not return any text.";
  } catch (error) {
    console.error("Error generating text with Gemini API:", error);
    return "Error: Could not generate text.";
  }
};
